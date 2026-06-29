<?php
/* Copy this file to  config.php  and edit the values.
   config.php is git-ignored and blocked from web access by .htaccess.
   COMMIT NO SECRETS. */
return [
  // ── Database ──────────────────────────────────────────────────────────────
  // driver: 'sqlite' (zero-setup, good for local dev) or 'mysql' (production).
  'db' => [
    'driver'      => 'sqlite',                       // 'sqlite' | 'mysql'
    // sqlite: a file path. Keep it OUTSIDE web access (under server/, .htaccess-blocked
    // + gitignored). Default lives in server/data/ which is already blocked + ignored.
    'sqlite_path' => __DIR__ . '/data/calvetra.sqlite',
    // mysql:
    'host'        => 'localhost',
    'name'        => 'calvetra',
    'user'        => 'calvetra',
    'pass'        => '',
  ],

  // ── Google OAuth (Sign in with Google) ────────────────────────────────────
  // Create an OAuth 2.0 Client ID in Google Cloud Console (see DEPLOY.md).
  // The client id is also exposed to the browser (it is not a secret); the
  // secret is only needed for server-side flows we may add later.
  'google_client_id'     => '',                      // e.g. '1234-abc.apps.googleusercontent.com'
  'google_client_secret' => '',                      // not required for ID-token verification

  // ── Request limits ────────────────────────────────────────────────────────
  // Hard cap (bytes) on a JSON request body. Over this -> 413, before decoding.
  // The synced state blob is small; 256 KB is generous headroom. Raise only if
  // a real account legitimately exceeds it.
  'max_body_bytes' => 256 * 1024,

  // ── Sessions / CSRF ───────────────────────────────────────────────────────
  // Long random string; used to derive/sign nothing secret directly but kept for
  // future signed-cookie needs. Set to a unique 64+ char random value in prod.
  'session_secret' => 'CHANGE-ME-to-a-long-random-secret',

  // ── CORS ──────────────────────────────────────────────────────────────────
  // Exact origin allowed to call the API with credentials. MUST be a single exact
  // origin in production (credentialed CORS cannot use '*'). For local dev the API
  // also auto-allows http://localhost:* / http://127.0.0.1:* origins.
  'allow_origin' => 'https://app.notalonestudios.com',

  // ── Environment ───────────────────────────────────────────────────────────
  // 'production' forces HTTPS-only Secure cookies and HARD-DISABLES dev mock-auth.
  'env' => 'production',                              // 'development' | 'production'

  // ── Dev mock-auth (TESTING ONLY) ──────────────────────────────────────────
  // POSITIVE EXPLICIT opt-in. Issues a session WITHOUT Google, for local testing
  // of the sync loop without real creds. Enabled ONLY when ALL are true:
  //   (1) this flag === true, (2) env !== 'production', (3) request host is localhost.
  // Fail-closed: a missing/empty config can never enable it.
  'dev_mock_auth' => false,

  // ── Legacy single-user file API (pre-accounts) ────────────────────────────
  // The old ?profile= file store. Kept ONLY for backward-compat with the existing
  // single-user deploy. It is physically isolated from account data (separate
  // files under data/legacy/, never touches user_state). Set '' to DISABLE it.
  'legacy_edit_token' => '',
];
