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
