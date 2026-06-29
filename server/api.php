<?php
/* ===========================================================
   Calvetra API — front controller (PHP 8 + PDO)
   Dispatches on ?action= :
     POST ?action=google     -> verify Google ID token, create session
     POST ?action=devlogin   -> DEV-ONLY mock session (3 positive gates)
     GET  ?action=me          -> current user + fresh CSRF + client config
     POST ?action=logout      -> destroy session (CSRF required)
     GET  ?action=state       -> authed user's state blob
     POST ?action=state       -> save blob (session + CSRF; last-write-wins)

   Legacy (backward-compat, ISOLATED from account data):
     GET/POST ?profile=<id>   -> file store under data/legacy/, never touches user_state
   =========================================================== */

declare(strict_types=1);

require_once __DIR__ . '/lib/http.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/csrf.php';
require_once __DIR__ . '/lib/ratelimit.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/state.php';
require_once __DIR__ . '/lib/social.php';

send_cors_headers();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = isset($_GET['action']) ? (string) $_GET['action'] : '';

// ── Legacy file path (only when ?profile= and no ?action=) ───────────────────
if ($action === '' && isset($_GET['profile'])) { legacy_handle($method); exit; }

try {
  switch ($action) {

    case 'google':
      require_post($method);
      if (!rate_ok('google', 20, 300)) json_err('rate limited', 429);
      [$body, $okJson] = read_json_body();
      if (!$okJson || !is_array($body) || empty($body['id_token'])) json_err('missing id_token', 400);
      try {
        $g = google_verify((string) $body['id_token']);
      } catch (Throwable $e) {
        json_err('google verification failed', 401);
      }
      $user = upsert_user($g['sub'], $g['email'], $g['name']);
      $sess = session_create((int) $user['id']);
      json_out(['user' => public_user($user), 'csrf' => $sess['csrf_token']]);
      break;

    case 'devlogin':
      require_post($method);
      if (!mock_auth_enabled()) json_err('not found', 404);   // provably off in prod
      if (!rate_ok('devlogin', 50, 300)) json_err('rate limited', 429);
      $user = upsert_user('dev|local-tester', 'dev@localhost', 'Dev Tester');
      $sess = session_create((int) $user['id']);
      json_out(['user' => public_user($user), 'csrf' => $sess['csrf_token'], 'dev' => true]);
      break;

    case 'me':
      $sess = current_session();
      $user = $sess ? user_by_id((int) $sess['user_id']) : null;
      json_out([
        'user'   => $user ? public_user($user) : null,
        'csrf'   => $sess['csrf_token'] ?? null,
        'config' => [
          'googleClientId' => cfg()['google_client_id'] ?? '',
          'devAuth'        => mock_auth_enabled(),
        ],
      ]);
      break;

    case 'logout':
      require_post($method);
      $sess = current_session();
      if ($sess && !csrf_check($sess)) json_err('bad csrf', 403);
      end_session();
      json_out(['ok' => true]);
      break;

    case 'state':
      $sess = current_session();
      if (!$sess) json_err('unauthorized', 401);
      $userId = (int) $sess['user_id'];
      if ($method === 'GET') {
        json_out(state_get($userId));
      } elseif ($method === 'POST') {
        if (!csrf_check($sess)) json_err('bad csrf', 403);
        if (!rate_ok('state', 120, 60)) json_err('rate limited', 429);
        [$body, $okJson] = read_json_body();
        if (!$okJson || !is_array($body)) json_err('invalid json', 400);
        json_out(state_post($userId, $body));
      } else {
        json_err('method not allowed', 405);
      }
      break;

    /* ── Social accountability (Step 2) ──────────────────────────────────────
       Every action requires an authenticated session. Writes additionally
       require CSRF + are rate-limited. The acting user is ALWAYS the session
       user_id — social.php never trusts a client-supplied actor id. */
    case 'pod_create':
      [$uid, $body] = social_write_guard($method, 'social', 30, 300);
      json_out(['pod' => pod_create($uid, (string) ($body['name'] ?? ''))]);
      break;

    case 'pod_join':
      [$uid, $body] = social_write_guard($method, 'social', 60, 300);
      json_out(['pod' => pod_join($uid, (string) ($body['invite_code'] ?? ''))]);
      break;

    case 'pod_leave':
      [$uid, $body] = social_write_guard($method, 'social', 60, 300);
      json_out(pod_leave($uid, (int) ($body['pod_id'] ?? 0)));
      break;

    case 'pod_list':
      $uid = require_session_uid();
      json_out(pod_list($uid));
      break;

    case 'pod_board':
      $uid = require_session_uid();
      json_out(pod_board($uid, (int) ($_GET['pod_id'] ?? 0)));
      break;

    case 'publish_summary':
      [$uid, $body] = social_write_guard($method, 'publish', 120, 300);
      json_out(publish_summary($uid, $body['summary'] ?? null));
      break;

    case 'partner_invite':
      [$uid, $body] = social_write_guard($method, 'social', 30, 300);
      json_out(partner_invite($uid));
      break;

    case 'partner_accept':
      [$uid, $body] = social_write_guard($method, 'social', 60, 300);
      json_out(partner_accept($uid, (string) ($body['invite_code'] ?? '')));
      break;

    case 'partner_snapshot':
      $uid = require_session_uid();
      json_out(partner_snapshot($uid));
      break;

    default:
      json_err('not found', 404);
  }
} catch (Throwable $e) {
  // never leak internals
  json_err('server error', 500);
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function require_post(string $method): void {
  if ($method !== 'POST') json_err('method not allowed', 405);
}

/** Authenticated read: returns the session user_id or 401s. */
function require_session_uid(): int {
  $sess = current_session();
  if (!$sess) json_err('unauthorized', 401);
  return (int) $sess['user_id'];
}

/** Authenticated, CSRF-checked, rate-limited WRITE. Returns [userId, jsonBody].
 *  Centralizes the security bar so every social write enforces it identically:
 *  POST-only · live session · CSRF header · per-IP rate limit · body under cap. */
function social_write_guard(string $method, string $rlKey, int $limit, int $windowSec): array {
  require_post($method);
  $sess = current_session();
  if (!$sess) json_err('unauthorized', 401);
  if (!csrf_check($sess)) json_err('bad csrf', 403);
  if (!rate_ok($rlKey, $limit, $windowSec)) json_err('rate limited', 429);
  [$body, $okJson] = read_json_body();
  if (!$okJson) json_err('invalid json', 400);
  if ($body === null) $body = [];
  if (!is_array($body)) json_err('invalid json', 400);
  return [(int) $sess['user_id'], $body];
}

function public_user(array $u): array {
  return ['id' => (int) $u['id'], 'email' => $u['email'] ?? null, 'name' => $u['name'] ?? null];
}

/* Legacy single-user file store — kept ONLY for the pre-accounts deploy.
   Writes data/legacy/<profile>.json. CANNOT read or write account user_state. */
function legacy_handle(string $method): void {
  $token = cfg()['legacy_edit_token'] ?? '';
  if ($token === '' && isset(cfg()['edit_token'])) $token = (string) cfg()['edit_token']; // old key fallback

  $p = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $_GET['profile']);
  if ($p === '') $p = 'me';
  $dir = __DIR__ . '/data/legacy';
  $path = $dir . '/' . $p . '.json';

  if ($method === 'GET') {
    if (is_file($path)) { header('Content-Type: application/json; charset=utf-8'); readfile($path); }
    else json_out(new stdClass());
    exit;
  }
  if ($method === 'POST') {
    if ($token === '') json_err('legacy save disabled', 403);   // fail-closed if no token configured
    $sent = $_SERVER['HTTP_X_EDIT_TOKEN'] ?? '';
    if (!hash_equals($token, $sent)) json_err('unauthorized', 401);
    [$body, $okJson] = read_json_body();
    if (!$okJson) json_err('invalid json', 400);
    if (!is_dir($dir)) mkdir($dir, 0775, true);
    $tmp = $path . '.tmp';
    file_put_contents($tmp, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    rename($tmp, $path);
    json_out(['ok' => true, 'profile' => $p, 'savedAt' => date('c')]);
  }
  json_err('method not allowed', 405);
}
