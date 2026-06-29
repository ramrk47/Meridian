<?php
/* HTTP helpers: config load, CORS, JSON in/out, env + host checks.
   No secrets here. */

declare(strict_types=1);

function cfg(): array {
  static $config = null;
  if ($config !== null) return $config;
  $defaults = [
    'db' => ['driver' => 'sqlite', 'sqlite_path' => __DIR__ . '/../data/calvetra.sqlite',
             'host' => 'localhost', 'name' => 'calvetra', 'user' => 'calvetra', 'pass' => ''],
    'google_client_id' => '', 'google_client_secret' => '',
    'session_secret' => '', 'allow_origin' => '',
    'env' => 'production', 'dev_mock_auth' => false, 'legacy_edit_token' => '',
    'max_body_bytes' => 256 * 1024,                  // cap on a JSON request body (DoS guard)
  ];
  $file = __DIR__ . '/../config.php';
  $loaded = file_exists($file) ? require $file : [];
  // shallow-merge with a one-level deep merge for 'db'
  $config = array_merge($defaults, is_array($loaded) ? $loaded : []);
  if (isset($loaded['db']) && is_array($loaded['db'])) {
    $config['db'] = array_merge($defaults['db'], $loaded['db']);
  }
  return $config;
}

function is_production(): bool { return (cfg()['env'] ?? 'production') === 'production'; }

/** True only for loopback hosts — used to gate dev-only behavior. */
function is_localhost_request(): bool {
  $host = $_SERVER['HTTP_HOST'] ?? '';
  $host = preg_replace('/:\d+$/', '', $host);            // strip port
  if (in_array($host, ['localhost', '127.0.0.1', '::1', '[::1]'], true)) return true;
  $ra = $_SERVER['REMOTE_ADDR'] ?? '';
  return in_array($ra, ['127.0.0.1', '::1'], true);
}

/** Cookies get Secure unless we're plainly on local http dev. */
function cookie_secure(): bool {
  if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') return true;
  // production ALWAYS Secure (assumes HTTPS termination); only relax on localhost dev
  if (is_production()) return true;
  return !is_localhost_request();
}

function send_cors_headers(): void {
  $allow = cfg()['allow_origin'] ?? '';
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $ok = '';
  if ($origin !== '') {
    // exact configured origin
    if ($allow !== '' && $allow !== '*' && hash_equals($allow, $origin)) {
      $ok = $origin;
    } elseif (preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
      // always allow loopback dev origins (file:// has no Origin and is same-doc anyway)
      $ok = $origin;
    }
    // NOTE: no wildcard branch — credentialed CORS (Allow-Credentials:true) is invalid
    // with Allow-Origin:*, so we only ever reflect an exact, allowed origin.
  }
  if ($ok !== '') {
    header('Access-Control-Allow-Origin: ' . $ok);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
  }
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Edit-Token');
}

function json_out($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function json_err(string $msg, int $code = 400): void { json_out(['error' => $msg], $code); }

/** Max bytes allowed for a JSON request body (config 'max_body_bytes', default 256 KB). */
function max_body_bytes(): int {
  $cap = cfg()['max_body_bytes'] ?? (256 * 1024);
  return (is_int($cap) && $cap > 0) ? $cap : (256 * 1024);
}

/**
 * Decode a JSON request body; returns [decoded, ok].
 *  - Over the size cap  -> emits 413 directly (transport-level reject, never decoded).
 *  - Malformed / deeper than the decode depth limit -> ok=false (caller emits 400).
 */
function read_json_body() {
  $cap = max_body_bytes();
  // Short-circuit on a declared oversize length before buffering the whole body.
  $declared = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
  if ($declared > $cap) json_err('payload too large', 413);
  $raw = file_get_contents('php://input');
  if ($raw === '' || $raw === false) return [null, true];
  if (strlen($raw) > $cap) json_err('payload too large', 413);   // authoritative size check
  $decoded = json_decode($raw, true, 32);                        // depth-limited; over-depth -> null
  if ($decoded === null && trim($raw) !== 'null') return [null, false];
  return [$decoded, true];
}

function client_ip(): string {
  return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}
