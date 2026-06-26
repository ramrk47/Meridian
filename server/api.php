<?php
/* ===========================================================
   QBank Tracker — minimal file-based API (PHP, no database)
   Drop this on PHP shared hosting (Hostinger/cPanel) to give
   the dashboard server-side, cross-device persistence.

   GET  api.php?profile=me           -> returns that profile's JSON state
   POST api.php?profile=me           -> saves JSON body (requires edit token)
        header: X-Edit-Token: <token from config.php>

   Single-user/token now; the `profile` param is the seam for
   real per-account auth later (the "social" layer).
   =========================================================== */

$config = file_exists(__DIR__ . '/config.php')
  ? require __DIR__ . '/config.php'
  : ['edit_token' => '', 'allow_origin' => '*'];

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ($config['allow_origin'] ?: '*'));
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Edit-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function profile_id() {
  $p = isset($_GET['profile']) ? $_GET['profile'] : 'me';
  $p = preg_replace('/[^a-zA-Z0-9_-]/', '', $p);
  return $p === '' ? 'me' : $p;
}
function data_path($p) { return __DIR__ . '/data/' . $p . '.json'; }

$method = $_SERVER['REQUEST_METHOD'];
$profile = profile_id();
$path = data_path($profile);

if ($method === 'GET') {
  if (file_exists($path)) { readfile($path); }
  else { echo json_encode(new stdClass()); }
  exit;
}

if ($method === 'POST') {
  // auth: require matching token if one is configured
  $token = isset($_SERVER['HTTP_X_EDIT_TOKEN']) ? $_SERVER['HTTP_X_EDIT_TOKEN'] : '';
  if (!empty($config['edit_token']) && !hash_equals($config['edit_token'], $token)) {
    http_response_code(401);
    echo json_encode(['error' => 'unauthorized']); exit;
  }
  $raw = file_get_contents('php://input');
  $decoded = json_decode($raw, true);
  if ($decoded === null && trim($raw) !== 'null') {
    http_response_code(400);
    echo json_encode(['error' => 'invalid json']); exit;
  }
  if (!is_dir(__DIR__ . '/data')) { mkdir(__DIR__ . '/data', 0775, true); }
  // atomic write
  $tmp = $path . '.tmp';
  file_put_contents($tmp, json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  rename($tmp, $path);
  echo json_encode(['ok' => true, 'profile' => $profile, 'savedAt' => date('c')]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'method not allowed']);
