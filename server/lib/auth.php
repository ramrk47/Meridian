<?php
/* Auth: server-side Google ID-token verification (JWKS + claim checks),
   server sessions (httpOnly+Secure+SameSite cookie), user upsert, and the
   POSITIVE-EXPLICIT, fail-closed mock-auth guard.

   Crypto is NOT hand-rolled: firebase/php-jwt (vendored) does RS256 verification
   against Google's JWKS; we supply the keys + the claim checks Google requires. */

declare(strict_types=1);

require_once __DIR__ . '/jwt/JWT.php';
require_once __DIR__ . '/jwt/JWK.php';
require_once __DIR__ . '/jwt/Key.php';
require_once __DIR__ . '/jwt/JWTExceptionWithPayloadInterface.php';
require_once __DIR__ . '/jwt/BeforeValidException.php';
require_once __DIR__ . '/jwt/ExpiredException.php';
require_once __DIR__ . '/jwt/SignatureInvalidException.php';

use Firebase\JWT\JWT;
use Firebase\JWT\JWK;

const GOOGLE_JWKS_URL   = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS    = ['accounts.google.com', 'https://accounts.google.com'];
const SESSION_COOKIE    = 'cal_session';
const SESSION_TTL_SEC   = 60 * 60 * 24 * 30;          // 30 days

/* ── Google ID-token verification ─────────────────────────────────────────── */

/** Fetch Google's JWKS, cached to disk per Cache-Control max-age. Returns decoded array. */
function google_jwks(): array {
  $cacheFile = __DIR__ . '/../jwks_cache/google.json';
  if (is_file($cacheFile)) {
    $c = json_decode((string) file_get_contents($cacheFile), true);
    if (is_array($c) && isset($c['fetched_at'], $c['max_age'], $c['jwks'])
        && (time() - $c['fetched_at']) < $c['max_age']) {
      return $c['jwks'];
    }
  }
  [$body, $maxAge] = http_get_with_cache_age(GOOGLE_JWKS_URL);
  $jwks = json_decode($body, true);
  if (!is_array($jwks) || empty($jwks['keys'])) throw new RuntimeException('bad JWKS response');
  @mkdir(dirname($cacheFile), 0775, true);
  $tmp = $cacheFile . '.tmp';
  file_put_contents($tmp, json_encode(['fetched_at' => time(), 'max_age' => max(300, $maxAge), 'jwks' => $jwks]));
  @rename($tmp, $cacheFile);
  return $jwks;
}

/** GET a URL via curl; returns [body, maxAgeSeconds]. */
function http_get_with_cache_age(string $url): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
  ]);
  $resp = curl_exec($ch);
  if ($resp === false) throw new RuntimeException('JWKS fetch failed: ' . curl_error($ch));
  $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  $hsize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  curl_close($ch);
  if ($code !== 200) throw new RuntimeException('JWKS HTTP ' . $code);
  $headers = substr($resp, 0, $hsize);
  $body = substr($resp, $hsize);
  $maxAge = 3600;
  if (preg_match('/cache-control:[^\r\n]*max-age=(\d+)/i', $headers, $m)) $maxAge = (int) $m[1];
  return [$body, $maxAge];
}

/**
 * Verify a Google ID token. Returns ['sub','email','name'] on success.
 * Throws on ANY failure. Checks: RS256 sig (JWKS), exp/iat (JWT::decode),
 * aud == our client_id, iss ∈ google, email_verified === true.
 */
function google_verify(string $idToken): array {
  $clientId = cfg()['google_client_id'] ?? '';
  if ($clientId === '') throw new RuntimeException('google_client_id not configured');

  JWT::$leeway = 60;                                   // small clock-skew tolerance
  $keys = JWK::parseKeySet(google_jwks());             // kid-indexed Key set
  $payload = (array) JWT::decode($idToken, $keys);     // verifies signature + exp/nbf/iat

  // aud
  $aud = $payload['aud'] ?? '';
  if (!is_string($aud) || !hash_equals($clientId, $aud)) throw new RuntimeException('aud mismatch');
  // iss
  $iss = $payload['iss'] ?? '';
  if (!in_array($iss, GOOGLE_ISSUERS, true)) throw new RuntimeException('iss mismatch');
  // email verified
  $ev = $payload['email_verified'] ?? false;
  if ($ev !== true && $ev !== 'true') throw new RuntimeException('email not verified');
  // subject
  $sub = $payload['sub'] ?? '';
  if (!is_string($sub) || $sub === '') throw new RuntimeException('missing sub');

  return [
    'sub'   => $sub,
    'email' => isset($payload['email']) ? (string) $payload['email'] : null,
    'name'  => isset($payload['name'])  ? (string) $payload['name']  : null,
  ];
}

/* ── User upsert ──────────────────────────────────────────────────────────── */

/** Upsert by google_sub; returns the user row (id, google_sub, email, name). */
function upsert_user(string $sub, ?string $email, ?string $name): array {
  $pdo = db();
  $mysql = cfg()['db']['driver'] === 'mysql';
  if ($mysql) {
    $sql = 'INSERT INTO users (google_sub, email, name, created_at) VALUES (?,?,?,?)
            ON DUPLICATE KEY UPDATE email = VALUES(email), name = VALUES(name)';
  } else {
    $sql = 'INSERT INTO users (google_sub, email, name, created_at) VALUES (?,?,?,?)
            ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name';
  }
  $pdo->prepare($sql)->execute([$sub, $email, $name, now_ms()]);
  $sel = $pdo->prepare('SELECT id, google_sub, email, name FROM users WHERE google_sub = ?');
  $sel->execute([$sub]);
  return $sel->fetch();
}

/* ── Sessions ─────────────────────────────────────────────────────────────── */

/** sessions.id stores the SHA-256 of the token; the raw token lives only in the
 *  cookie. A DB read leak then can't be replayed as a live session. (sha256 hex
 *  is 64 chars, so it fits the existing VARCHAR(64) column.) */
function session_id_hash(string $rawId): string { return hash('sha256', $rawId); }

function session_create(int $userId): array {
  $pdo = db();
  $id   = bin2hex(random_bytes(32));                   // 64 hex — raw token (cookie only)
  $csrf = csrf_new_token();
  $now  = now_ms();
  $exp  = $now + SESSION_TTL_SEC * 1000;
  $pdo->prepare('INSERT INTO sessions (id, user_id, csrf_token, created_at, expires_at, last_seen)
                 VALUES (?,?,?,?,?,?)')->execute([session_id_hash($id), $userId, $csrf, $now, $exp, $now]);
  set_session_cookie($id);                             // raw token to the client
  return ['id' => $id, 'user_id' => $userId, 'csrf_token' => $csrf, 'expires_at' => $exp];
}

function set_session_cookie(string $id): void {
  setcookie(SESSION_COOKIE, $id, [
    'expires'  => time() + SESSION_TTL_SEC,
    'path'     => '/',
    'httponly' => true,
    'secure'   => cookie_secure(),
    'samesite' => 'Lax',
  ]);
}

/** Returns the live session row (refreshing last_seen) or null. */
function current_session(): ?array {
  $id = $_COOKIE[SESSION_COOKIE] ?? '';
  if ($id === '' || !preg_match('/^[a-f0-9]{64}$/', $id)) return null;
  $h = session_id_hash($id);                            // look up by hash, not raw token
  $pdo = db();
  $sel = $pdo->prepare('SELECT id, user_id, csrf_token, expires_at FROM sessions WHERE id = ?');
  $sel->execute([$h]);
  $row = $sel->fetch();
  if (!$row) return null;
  if ((int) $row['expires_at'] < now_ms()) {
    $pdo->prepare('DELETE FROM sessions WHERE id = ?')->execute([$h]);
    return null;
  }
  $pdo->prepare('UPDATE sessions SET last_seen = ? WHERE id = ?')->execute([now_ms(), $h]);
  return $row;
}

function end_session(): void {
  $id = $_COOKIE[SESSION_COOKIE] ?? '';
  if ($id !== '' && preg_match('/^[a-f0-9]{64}$/', $id)) {
    db()->prepare('DELETE FROM sessions WHERE id = ?')->execute([session_id_hash($id)]);
  }
  setcookie(SESSION_COOKIE, '', [
    'expires' => time() - 3600, 'path' => '/', 'httponly' => true,
    'secure' => cookie_secure(), 'samesite' => 'Lax',
  ]);
}

function user_by_id(int $id): ?array {
  $sel = db()->prepare('SELECT id, google_sub, email, name FROM users WHERE id = ?');
  $sel->execute([$id]);
  return $sel->fetch() ?: null;
}

/* ── Mock-auth guard (TESTING ONLY) ───────────────────────────────────────────
   THREE independent positive gates; fail-closed. A missing/empty config can
   never enable this. */
function mock_auth_enabled(): bool {
  return (cfg()['dev_mock_auth'] ?? false) === true   // (1) positive explicit opt-in
      && !is_production()                              // (2) env !== production
      && is_localhost_request();                       // (3) loopback host only
}
