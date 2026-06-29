<?php
/* Fixed-window per-IP/bucket rate limiter (DB-backed, parameterized).
   Cheap + portable across MySQL/SQLite. Used on auth + state POST. */

declare(strict_types=1);

/**
 * Returns true if the request is ALLOWED (under the limit), false if throttled.
 * $key e.g. "google", "devlogin", "state". Window resets every $windowSec.
 */
function rate_ok(string $key, int $limit, int $windowSec): bool {
  $pdo = db();
  $bucket = $key . ':' . client_ip();
  $now = now_ms();
  $winStart = $now - ($windowSec * 1000);

  $sel = $pdo->prepare('SELECT window_start, count FROM rate_limits WHERE bucket = ?');
  $sel->execute([$bucket]);
  $row = $sel->fetch();

  if (!$row || (int)$row['window_start'] < $winStart) {
    // new window
    $up = $pdo->prepare(
      'INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT(bucket) DO UPDATE SET window_start = excluded.window_start, count = 1'
    );
    // MySQL uses different upsert syntax; branch on driver
    if (cfg()['db']['driver'] === 'mysql') {
      $up = $pdo->prepare(
        'INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE window_start = VALUES(window_start), count = 1'
      );
      $up->execute([$bucket, $now]);
    } else {
      $up->execute([$bucket, $now]);
    }
    return true;
  }

  if ((int)$row['count'] >= $limit) return false;

  $inc = $pdo->prepare('UPDATE rate_limits SET count = count + 1 WHERE bucket = ?');
  $inc->execute([$bucket]);
  return true;
}
