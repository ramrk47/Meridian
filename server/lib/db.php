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
}

function now_ms(): int { return (int) round(microtime(true) * 1000); }
