<?php
/* PDO factory (mysql | sqlite) + idempotent migrations.
   ALL queries elsewhere use prepared statements — no string-built SQL. */

declare(strict_types=1);

function db(): PDO {
  static $pdo = null;
  if ($pdo !== null) return $pdo;
  $db = cfg()['db'];
  $driver = $db['driver'] ?? 'sqlite';
  $opts = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
  ];
  if ($driver === 'mysql') {
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $db['host'], $db['name']);
    $pdo = new PDO($dsn, $db['user'], $db['pass'], $opts);
  } else {
    $path = $db['sqlite_path'];
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0775, true);
    $pdo = new PDO('sqlite:' . $path, null, null, $opts);
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA foreign_keys = ON');
  }
  run_migrations($pdo, $driver);
  return $pdo;
}

function run_migrations(PDO $pdo, string $driver): void {
  $mysql = ($driver === 'mysql');
  // type shims so one migration covers both engines
  $pk      = $mysql ? 'BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  $json    = $mysql ? 'JSON' : 'TEXT';
  $ts      = $mysql ? 'BIGINT' : 'INTEGER';            // unix-ms timestamps as integers
  $eng     = $mysql ? 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4' : '';

  $pdo->exec("CREATE TABLE IF NOT EXISTS users (
    id $pk,
    google_sub VARCHAR(255) NOT NULL UNIQUE,
    email      VARCHAR(320),
    name       VARCHAR(255),
    created_at $ts NOT NULL
  ) $eng");

  $pdo->exec("CREATE TABLE IF NOT EXISTS user_state (
    user_id    " . ($mysql ? 'BIGINT UNSIGNED' : 'INTEGER') . " PRIMARY KEY,
    blob       $json,
    updated_at $ts NOT NULL,
    version    INTEGER NOT NULL DEFAULT 1
  ) $eng");

  $pdo->exec("CREATE TABLE IF NOT EXISTS sessions (
    id         VARCHAR(64) PRIMARY KEY,            -- sha256(token) hex; raw token only in the cookie
    user_id    " . ($mysql ? 'BIGINT UNSIGNED' : 'INTEGER') . " NOT NULL,
    csrf_token VARCHAR(64) NOT NULL,
    created_at $ts NOT NULL,
    expires_at $ts NOT NULL,
    last_seen  $ts NOT NULL
  ) $eng");

  $pdo->exec("CREATE TABLE IF NOT EXISTS rate_limits (
    bucket       VARCHAR(160) PRIMARY KEY,
    window_start $ts NOT NULL,
    count        INTEGER NOT NULL
  ) $eng");

  /* ── Social accountability (Step 2): pods, memberships, published summaries,
        accountability partners. ALL access is authorization-gated in lib/social.php;
        these tables hold only opt-in AGGREGATE summaries, never raw user_state. ── */
  $uid = $mysql ? 'BIGINT UNSIGNED' : 'INTEGER';

  $pdo->exec("CREATE TABLE IF NOT EXISTS pods (
    id            $pk,
    name          VARCHAR(120) NOT NULL,
    owner_user_id $uid NOT NULL,
    invite_code   VARCHAR(64) NOT NULL UNIQUE,   -- 128-bit hex; unguessable, not reversible to identity
    created_at    $ts NOT NULL
  ) $eng");

  $pdo->exec("CREATE TABLE IF NOT EXISTS pod_members (
    pod_id    $uid NOT NULL,
    user_id   $uid NOT NULL,
    joined_at $ts NOT NULL,
    opted_in  INTEGER NOT NULL DEFAULT 1,         -- publish my summary to this pod's board
    PRIMARY KEY (pod_id, user_id)
  ) $eng");

  /* One row per (scope, user). pod_id = 0 is the reserved SELF scope: the user's
     current published summary, read by an accepted partner's snapshot and used as
     the fallback. Other rows mirror that summary into each pod the user belongs to,
     so a pod board reads ONLY rows scoped to that pod. */
  $pdo->exec("CREATE TABLE IF NOT EXISTS member_summaries (
    pod_id     $uid NOT NULL,
    user_id    $uid NOT NULL,
    summary    $json,
    updated_at $ts NOT NULL,
    PRIMARY KEY (pod_id, user_id)
  ) $eng");

  $pdo->exec("CREATE TABLE IF NOT EXISTS partners (
    id           $pk,
    requester_id $uid NOT NULL,
    addressee_id $uid,                            -- NULL until accepted
    invite_code  VARCHAR(64) NOT NULL UNIQUE,     -- 128-bit hex; B accepts by code (no email enumeration)
    status       VARCHAR(16) NOT NULL,            -- 'pending' | 'accepted'
    created_at   $ts NOT NULL
  ) $eng");
  // Secondary indexes — created once, tolerant of re-runs across engines (MySQL has
  // no CREATE INDEX IF NOT EXISTS; a duplicate-index error on a later run is benign).
  $idx = function (string $sql) use ($pdo) { try { $pdo->exec($sql); } catch (Throwable $e) { /* already exists */ } };
  $idx("CREATE INDEX idx_partners_req  ON partners (requester_id)");
  $idx("CREATE INDEX idx_partners_addr ON partners (addressee_id)");
  $idx("CREATE INDEX idx_member_summaries_user ON member_summaries (user_id)");
}

function now_ms(): int { return (int) round(microtime(true) * 1000); }
