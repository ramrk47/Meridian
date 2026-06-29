-- Calvetra — MySQL reference schema (production).
-- The app ALSO creates these programmatically (server/lib/db.php run_migrations),
-- so this file is for DBAs / manual setup. Run once against your MySQL database.
-- Charset utf8mb4 throughout. No secrets here.

CREATE TABLE IF NOT EXISTS users (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  google_sub  VARCHAR(255) NOT NULL UNIQUE,
  email       VARCHAR(320),
  name        VARCHAR(255),
  created_at  BIGINT NOT NULL              -- unix epoch millis
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_state (
  user_id     BIGINT UNSIGNED PRIMARY KEY,
  blob        JSON,
  updated_at  BIGINT NOT NULL,            -- unix epoch millis (last-write-wins key)
  version     INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_user_state_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  id          VARCHAR(64) PRIMARY KEY,    -- sha256 hex of the 256-bit token; raw token lives only in the cookie
  user_id     BIGINT UNSIGNED NOT NULL,
  csrf_token  VARCHAR(64) NOT NULL,
  created_at  BIGINT NOT NULL,
  expires_at  BIGINT NOT NULL,
  last_seen   BIGINT NOT NULL,
  INDEX idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket        VARCHAR(160) PRIMARY KEY, -- "<action>:<ip>"
  window_start  BIGINT NOT NULL,
  count         INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Social accountability (Step 2) ─────────────────────────────────────────────
-- Opt-in pods + a shared adherence board + 1:1 accountability partners. These hold
-- only AGGREGATE published summaries (adherence %, on-track/behind subjects, cycle
-- label) — never raw user_state. All access is authorization-gated in lib/social.php.

CREATE TABLE IF NOT EXISTS pods (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  invite_code   VARCHAR(64) NOT NULL UNIQUE,   -- 128-bit hex; unguessable, not reversible to identity
  created_at    BIGINT NOT NULL,
  CONSTRAINT fk_pods_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pod_members (
  pod_id    BIGINT UNSIGNED NOT NULL,
  user_id   BIGINT UNSIGNED NOT NULL,
  joined_at BIGINT NOT NULL,
  opted_in  TINYINT NOT NULL DEFAULT 1,        -- publish my summary to this pod's board
  PRIMARY KEY (pod_id, user_id),
  INDEX idx_pod_members_user (user_id),
  CONSTRAINT fk_pod_members_pod  FOREIGN KEY (pod_id)  REFERENCES pods(id)  ON DELETE CASCADE,
  CONSTRAINT fk_pod_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- pod_id = 0 is the reserved SELF scope (the user's current summary, read by an
-- accepted partner's snapshot + used as fallback). Other rows mirror it per pod so a
-- board reads ONLY rows scoped to that pod. No FK on pod_id because of the 0 sentinel;
-- integrity is enforced in app logic (leave purges the row).
CREATE TABLE IF NOT EXISTS member_summaries (
  pod_id     BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  summary    JSON,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (pod_id, user_id),
  INDEX idx_member_summaries_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS partners (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  requester_id BIGINT UNSIGNED NOT NULL,
  addressee_id BIGINT UNSIGNED,                -- NULL until accepted
  invite_code  VARCHAR(64) NOT NULL UNIQUE,    -- 128-bit hex; B accepts by code (no email enumeration)
  status       VARCHAR(16) NOT NULL,           -- 'pending' | 'accepted'
  created_at   BIGINT NOT NULL,
  INDEX idx_partners_req (requester_id),
  INDEX idx_partners_addr (addressee_id),
  CONSTRAINT fk_partners_req  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
