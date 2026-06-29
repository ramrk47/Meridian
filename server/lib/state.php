<?php
/* Account-scoped user_state: GET returns the authed user's blob; POST stores it,
   last-write-wins on updated_at. The first-login local→account MERGE is computed
   CLIENT-side (it holds both blobs); the server stays a dumb versioned blob store.
   This is physically separate from the legacy ?profile= file store. */

declare(strict_types=1);

/** Returns ['state'=>?array, 'version'=>int, 'updatedAt'=>int] for a user. */
function state_get(int $userId): array {
  $sel = db()->prepare('SELECT blob, updated_at, version FROM user_state WHERE user_id = ?');
  $sel->execute([$userId]);
  $row = $sel->fetch();
  if (!$row) return ['state' => null, 'version' => 0, 'updatedAt' => 0];
  $blob = $row['blob'];
  $decoded = is_string($blob) ? json_decode($blob, true) : $blob;
  return ['state' => $decoded, 'version' => (int) $row['version'], 'updatedAt' => (int) $row['updated_at']];
}

/** Parse the client state's ISO `updatedAt` to unix-ms; fallback to now.
 *  CLAMPED to server time: a client must not be able to future-date its blob to
 *  permanently win last-write-wins and wedge other devices. So incomingTs is
 *  never allowed to exceed now_ms(). */
function state_incoming_ts($state): int {
  if (is_array($state) && !empty($state['updatedAt'])) {
    $t = strtotime((string) $state['updatedAt']);
    if ($t !== false) return min($t * 1000, now_ms());
  }
  return now_ms();
}

/**
 * Store the blob. Last-write-wins on updated_at:
 *  - if the stored copy is NEWER than the incoming, do NOT overwrite — return
 *    {stale:true, state, version, updatedAt} so the client reconciles + re-posts.
 *  - otherwise upsert and bump version.
 */
function state_post(int $userId, $state): array {
  // Only ever store a JSON object/array blob — never a scalar/null (defense in depth;
  // the front controller also guards, this keeps the store self-protecting).
  if (!is_array($state)) json_err('invalid state', 400);
  $pdo = db();
  $incomingTs = state_incoming_ts($state);

  $cur = state_get($userId);
  if ($cur['state'] !== null && $cur['updatedAt'] > $incomingTs) {
    return ['stale' => true] + $cur;                   // server is newer; client must merge
  }

  $json = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $newVersion = $cur['version'] + 1;
  $mysql = cfg()['db']['driver'] === 'mysql';
  if ($mysql) {
    $sql = 'INSERT INTO user_state (user_id, blob, updated_at, version) VALUES (?,?,?,?)
            ON DUPLICATE KEY UPDATE blob = VALUES(blob), updated_at = VALUES(updated_at), version = VALUES(version)';
  } else {
    $sql = 'INSERT INTO user_state (user_id, blob, updated_at, version) VALUES (?,?,?,?)
            ON CONFLICT(user_id) DO UPDATE SET blob = excluded.blob, updated_at = excluded.updated_at, version = excluded.version';
  }
  $pdo->prepare($sql)->execute([$userId, $json, $incomingTs, $newVersion]);
  return ['ok' => true, 'version' => $newVersion, 'updatedAt' => $incomingTs];
}
