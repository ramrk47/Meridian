<?php
/* ===========================================================
   Social accountability (Step 2) — pods, shared adherence board,
   accountability partner. Authorization is the crux: every read is
   MEMBER-GATED, every write is OWN-DATA-ONLY (the actor is always the
   session user_id, never a client-supplied id), invite codes are 128-bit
   and unguessable, and nothing here ever reads another user's raw
   user_state — only the tiny opt-in AGGREGATE summary a member published.

   The front controller (api.php) authenticates the session + checks CSRF on
   writes BEFORE calling these. Functions take the authenticated $userId and
   use prepared statements only. They throw on a denied/invalid request via
   json_err (which exits), so callers can treat a return as success.
   =========================================================== */

declare(strict_types=1);

const POD_SELF_SCOPE   = 0;          // member_summaries.pod_id sentinel for the user's own latest summary
const POD_NAME_MAX     = 120;
const SUMMARY_MAX_SUBS = 30;         // cap subjects arrays (board is aggregate, not a dump)
const SUMMARY_STR_MAX  = 48;         // cap any label/subject string length
const POD_MAX_PER_USER = 20;         // a person can't be in unbounded pods (abuse guard)

/* ── small helpers ─────────────────────────────────────────────────────────── */

function social_uid_col(): string { return cfg()['db']['driver'] === 'mysql' ? 'BIGINT UNSIGNED' : 'INTEGER'; }

/** 128-bit unguessable, opaque code (not derivable to a user/pod id). */
function social_new_code(): string { return bin2hex(random_bytes(16)); }   // 32 hex chars

/** True iff $userId is a member of $podId. The single authorization predicate
 *  every pod read/write funnels through. */
function pod_is_member(int $podId, int $userId): bool {
  $q = db()->prepare('SELECT 1 FROM pod_members WHERE pod_id = ? AND user_id = ?');
  $q->execute([$podId, $userId]);
  return (bool) $q->fetch();
}

function pod_member_count(int $podId): int {
  $q = db()->prepare('SELECT COUNT(*) AS c FROM pod_members WHERE pod_id = ?');
  $q->execute([$podId]);
  return (int) ($q->fetch()['c'] ?? 0);
}

/** Public projection of a pod (no internal columns leaked beyond what a member needs). */
function pod_public(array $p): array {
  return [
    'id'         => (int) $p['id'],
    'name'       => (string) $p['name'],
    'inviteCode' => (string) $p['invite_code'],
    'ownerId'    => (int) $p['owner_user_id'],
    'createdAt'  => (int) $p['created_at'],
  ];
}

/* ── Summary sanitation ──────────────────────────────────────────────────────
   The published summary is AGGREGATE + tiny by contract. We hard-whitelist keys
   and clamp every field, so the store can never relay raw state, oversized blobs,
   or unexpected structure even if the client misbehaves. */
function social_clean_strings($arr): array {
  if (!is_array($arr)) return [];
  $out = [];
  foreach ($arr as $v) {
    if (!is_string($v) && !is_int($v) && !is_float($v)) continue;
    $s = trim((string) $v);
    if ($s === '') continue;
    if (function_exists('mb_substr')) $s = mb_substr($s, 0, SUMMARY_STR_MAX);
    else $s = substr($s, 0, SUMMARY_STR_MAX);
    $out[] = $s;
    if (count($out) >= SUMMARY_MAX_SUBS) break;
  }
  return $out;
}

function social_sanitize_summary($s): array {
  if (!is_array($s)) json_err('invalid summary', 400);
  $clampPct = function ($v): int { $n = (int) $v; return $n < 0 ? 0 : ($n > 100 ? 100 : $n); };
  $label = isset($s['cycleLabel']) && is_string($s['cycleLabel']) ? trim($s['cycleLabel']) : '';
  if ($label !== '') $label = (function_exists('mb_substr') ? mb_substr($label, 0, SUMMARY_STR_MAX) : substr($label, 0, SUMMARY_STR_MAX));
  return [
    'adherence'       => $clampPct($s['adherence'] ?? 0),
    'coverage'        => $clampPct($s['coverage'] ?? 0),
    'subjectsOnTrack' => social_clean_strings($s['subjectsOnTrack'] ?? []),
    'subjectsBehind'  => social_clean_strings($s['subjectsBehind'] ?? []),
    'cycleLabel'      => $label,
    'planName'        => (function () use ($s) {
      $p = isset($s['planName']) && is_string($s['planName']) ? trim($s['planName']) : '';
      return $p === '' ? '' : (function_exists('mb_substr') ? mb_substr($p, 0, SUMMARY_STR_MAX) : substr($p, 0, SUMMARY_STR_MAX));
    })(),
  ];
}

function social_decode_summary($blob) {
  if ($blob === null) return null;
  return is_string($blob) ? json_decode($blob, true) : $blob;
}

/* Upsert ONE member_summaries row (scope = pod_id; self-scope = POD_SELF_SCOPE). */
function social_upsert_summary(int $podId, int $userId, string $json, int $ts): void {
  $pdo = db();
  if (cfg()['db']['driver'] === 'mysql') {
    $sql = 'INSERT INTO member_summaries (pod_id, user_id, summary, updated_at) VALUES (?,?,?,?)
            ON DUPLICATE KEY UPDATE summary = VALUES(summary), updated_at = VALUES(updated_at)';
  } else {
    $sql = 'INSERT INTO member_summaries (pod_id, user_id, summary, updated_at) VALUES (?,?,?,?)
            ON CONFLICT(pod_id, user_id) DO UPDATE SET summary = excluded.summary, updated_at = excluded.updated_at';
  }
  $pdo->prepare($sql)->execute([$podId, $userId, $json, $ts]);
}

/* ── Pods ────────────────────────────────────────────────────────────────────*/

/** Create a pod owned by $userId; the owner is auto-joined (opted in). */
function pod_create(int $userId, string $name): array {
  $name = trim($name);
  if ($name === '') json_err('pod name required', 400);
  if (function_exists('mb_substr')) $name = mb_substr($name, 0, POD_NAME_MAX);
  else $name = substr($name, 0, POD_NAME_MAX);

  $pdo = db();
  $now = now_ms();
  // generate a unique invite code (retry on the astronomically rare collision)
  $code = '';
  for ($i = 0; $i < 5; $i++) {
    $code = social_new_code();
    $chk = $pdo->prepare('SELECT 1 FROM pods WHERE invite_code = ?');
    $chk->execute([$code]);
    if (!$chk->fetch()) break;
    $code = '';
  }
  if ($code === '') json_err('could not allocate invite code', 500);

  $pdo->prepare('INSERT INTO pods (name, owner_user_id, invite_code, created_at) VALUES (?,?,?,?)')
      ->execute([$name, $userId, $code, $now]);
  $podId = (int) $pdo->lastInsertId();
  $pdo->prepare('INSERT INTO pod_members (pod_id, user_id, joined_at, opted_in) VALUES (?,?,?,1)')
      ->execute([$podId, $userId, $now]);

  $sel = $pdo->prepare('SELECT * FROM pods WHERE id = ?');
  $sel->execute([$podId]);
  return pod_public($sel->fetch());
}

/** Join a pod by invite code. A wrong code is indistinguishable from a nonexistent
 *  pod (generic 404) — no enumeration, no "pod exists but…" oracle. */
function pod_join(int $userId, string $code): array {
  $code = trim($code);
  if (!preg_match('/^[a-f0-9]{32}$/', $code)) json_err('invalid invite code', 404);
  $pdo = db();
  $sel = $pdo->prepare('SELECT * FROM pods WHERE invite_code = ?');
  $sel->execute([$code]);
  $pod = $sel->fetch();
  if (!$pod) json_err('invalid invite code', 404);
  $podId = (int) $pod['id'];

  if (!pod_is_member($podId, $userId)) {
    $cnt = $pdo->prepare('SELECT COUNT(*) AS c FROM pod_members WHERE user_id = ?');
    $cnt->execute([$userId]);
    if ((int) ($cnt->fetch()['c'] ?? 0) >= POD_MAX_PER_USER) json_err('pod limit reached', 429);
    $pdo->prepare('INSERT INTO pod_members (pod_id, user_id, joined_at, opted_in) VALUES (?,?,?,1)')
        ->execute([$podId, $userId, now_ms()]);
  }
  return pod_public($pod);
}

/** Leave a pod: removes membership AND purges this user's summary for that pod.
 *  If the owner leaves, ownership transfers to the earliest remaining member; an
 *  empty pod is deleted along with its summaries. */
function pod_leave(int $userId, int $podId): array {
  $pdo = db();
  if (!pod_is_member($podId, $userId)) json_err('not a member', 403);

  $pdo->prepare('DELETE FROM pod_members WHERE pod_id = ? AND user_id = ?')->execute([$podId, $userId]);
  $pdo->prepare('DELETE FROM member_summaries WHERE pod_id = ? AND user_id = ?')->execute([$podId, $userId]);

  // ownership / cleanup
  $owner = $pdo->prepare('SELECT owner_user_id FROM pods WHERE id = ?');
  $owner->execute([$podId]);
  $row = $owner->fetch();
  if ($row && (int) $row['owner_user_id'] === $userId) {
    $next = $pdo->prepare('SELECT user_id FROM pod_members WHERE pod_id = ? ORDER BY joined_at ASC LIMIT 1');
    $next->execute([$podId]);
    $n = $next->fetch();
    if ($n) {
      $pdo->prepare('UPDATE pods SET owner_user_id = ? WHERE id = ?')->execute([(int) $n['user_id'], $podId]);
    }
  }
  if (pod_member_count($podId) === 0) {
    $pdo->prepare('DELETE FROM member_summaries WHERE pod_id = ?')->execute([$podId]);
    $pdo->prepare('DELETE FROM pods WHERE id = ?')->execute([$podId]);
  }
  return ['ok' => true];
}

/** The pods $userId belongs to (with member counts) — never lists pods they're not in. */
function pod_list(int $userId): array {
  $pdo = db();
  $q = $pdo->prepare(
    'SELECT p.* FROM pods p JOIN pod_members m ON m.pod_id = p.id
     WHERE m.user_id = ? ORDER BY p.created_at DESC'
  );
  $q->execute([$userId]);
  $out = [];
  foreach ($q->fetchAll() as $p) {
    $pub = pod_public($p);
    $pub['memberCount'] = pod_member_count((int) $p['id']);
    $out[] = $pub;
  }
  return ['pods' => $out];
}

/** The solidarity board for a pod: each opted-in member's display name + their
 *  published summary for THIS pod. MEMBER-ONLY: a non-member is refused (403).
 *  No raw state, no email; the caller gets exactly the aggregate members chose to
 *  publish. The client frames it as solidarity (each vs their own plan), never a rank. */
function pod_board(int $userId, int $podId): array {
  $pdo = db();
  if (!pod_is_member($podId, $userId)) json_err('forbidden', 403);

  $sel = $pdo->prepare('SELECT * FROM pods WHERE id = ?');
  $sel->execute([$podId]);
  $pod = $sel->fetch();
  if (!$pod) json_err('not found', 404);

  $q = $pdo->prepare(
    'SELECT m.user_id, m.opted_in, u.name AS name,
            s.summary AS summary, s.updated_at AS updated_at
       FROM pod_members m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN member_summaries s ON s.user_id = m.user_id AND s.pod_id = m.pod_id
      WHERE m.pod_id = ?
      ORDER BY m.joined_at ASC'
  );
  $q->execute([$podId]);

  $members = [];
  foreach ($q->fetchAll() as $r) {
    $members[] = [
      'userId'    => (int) $r['user_id'],
      'name'      => $r['name'] !== null && $r['name'] !== '' ? (string) $r['name'] : 'Member',
      'isSelf'    => ((int) $r['user_id']) === $userId,
      'optedIn'   => (int) $r['opted_in'] === 1,
      'summary'   => social_decode_summary($r['summary']),
      'updatedAt' => $r['updated_at'] !== null ? (int) $r['updated_at'] : 0,
    ];
  }
  return ['pod' => pod_public($pod), 'members' => $members];
}

/** Publish the CALLER'S OWN summary. The actor is the session user_id — a client
 *  cannot publish for anyone else (there is no user_id input). Writes the SELF
 *  scope row (for partner snapshots / fallback) plus a row mirrored into every pod
 *  the caller is a member of, so each pod board reads only its own scoped rows. */
function publish_summary(int $userId, $summaryInput): array {
  $summary = social_sanitize_summary($summaryInput);
  $json = json_encode($summary, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $now = now_ms();

  social_upsert_summary(POD_SELF_SCOPE, $userId, $json, $now);

  $pdo = db();
  $q = $pdo->prepare('SELECT pod_id, opted_in FROM pod_members WHERE user_id = ?');
  $q->execute([$userId]);
  $pods = 0;
  foreach ($q->fetchAll() as $row) {
    $podId = (int) $row['pod_id'];
    if ((int) $row['opted_in'] === 1) {
      social_upsert_summary($podId, $userId, $json, $now);
    } else {
      // opted out of this pod's board — ensure no stale summary lingers
      $pdo->prepare('DELETE FROM member_summaries WHERE pod_id = ? AND user_id = ?')->execute([$podId, $userId]);
    }
    $pods++;
  }
  return ['ok' => true, 'pods' => $pods, 'updatedAt' => $now];
}

/* ── Accountability partner (1:1, mutual opt-in) ──────────────────────────────
   B accepts A's one-time code — there is no email lookup, so no one can probe
   "is X a user". The snapshot reads only the SELF-scope published summary, and
   only between an ACCEPTED pair. */

/** Create (or reuse) a pending partner invite for the caller; returns its code. */
function partner_invite(int $userId): array {
  $pdo = db();
  // reuse an existing un-accepted invite this user already issued (idempotent share)
  $ex = $pdo->prepare("SELECT invite_code FROM partners WHERE requester_id = ? AND status = 'pending' LIMIT 1");
  $ex->execute([$userId]);
  $row = $ex->fetch();
  if ($row) return ['inviteCode' => (string) $row['invite_code']];

  $code = '';
  for ($i = 0; $i < 5; $i++) {
    $code = social_new_code();
    $chk = $pdo->prepare('SELECT 1 FROM partners WHERE invite_code = ?');
    $chk->execute([$code]);
    if (!$chk->fetch()) break;
    $code = '';
  }
  if ($code === '') json_err('could not allocate invite code', 500);

  $pdo->prepare("INSERT INTO partners (requester_id, addressee_id, invite_code, status, created_at)
                 VALUES (?, NULL, ?, 'pending', ?)")
      ->execute([$userId, $code, now_ms()]);
  return ['inviteCode' => $code];
}

/** Accept a partner code. The acceptor becomes addressee; cannot accept own code. */
function partner_accept(int $userId, string $code): array {
  $code = trim($code);
  if (!preg_match('/^[a-f0-9]{32}$/', $code)) json_err('invalid invite code', 404);
  $pdo = db();
  $sel = $pdo->prepare('SELECT * FROM partners WHERE invite_code = ?');
  $sel->execute([$code]);
  $p = $sel->fetch();
  if (!$p) json_err('invalid invite code', 404);
  if ((int) $p['requester_id'] === $userId) json_err('cannot partner with yourself', 400);
  if ($p['status'] !== 'pending' || $p['addressee_id'] !== null) json_err('invite already used', 409);

  $pdo->prepare("UPDATE partners SET addressee_id = ?, status = 'accepted' WHERE id = ? AND status = 'pending'")
      ->execute([$userId, (int) $p['id']]);
  return ['ok' => true, 'partnerId' => (int) $p['requester_id']];
}

/** The accepted partners of $userId and each one's latest SELF-scope summary. */
function partner_snapshot(int $userId): array {
  $pdo = db();
  $q = $pdo->prepare(
    "SELECT pt.id, pt.requester_id, pt.addressee_id,
            u.name AS name, s.summary AS summary, s.updated_at AS updated_at
       FROM partners pt
       JOIN users u
         ON u.id = CASE WHEN pt.requester_id = ? THEN pt.addressee_id ELSE pt.requester_id END
       LEFT JOIN member_summaries s
         ON s.user_id = u.id AND s.pod_id = ?
      WHERE pt.status = 'accepted' AND (pt.requester_id = ? OR pt.addressee_id = ?)
      ORDER BY pt.created_at DESC"
  );
  $q->execute([$userId, POD_SELF_SCOPE, $userId, $userId]);

  $partners = [];
  foreach ($q->fetchAll() as $r) {
    $partners[] = [
      'name'      => $r['name'] !== null && $r['name'] !== '' ? (string) $r['name'] : 'Partner',
      'summary'   => social_decode_summary($r['summary']),
      'updatedAt' => $r['updated_at'] !== null ? (int) $r['updated_at'] : 0,
    ];
  }
  // also surface the caller's own pending invite code (if any) so the client can show it
  $pend = $pdo->prepare("SELECT invite_code FROM partners WHERE requester_id = ? AND status = 'pending' LIMIT 1");
  $pend->execute([$userId]);
  $pr = $pend->fetch();
  return ['partners' => $partners, 'pendingInvite' => $pr ? (string) $pr['invite_code'] : null];
}
