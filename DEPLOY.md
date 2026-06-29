# Deploying to a subdomain (e.g. tracker.notalonestudios.com)

The dashboard is **static + a tiny PHP API**. It works three ways, in order of effort:

## 1. Local only (what you have now)
Double-click `index.html`. Your ticks/scores save in this browser (`localStorage`).
Use **Export** to back up to a JSON file, **Import** to restore. Nothing else needed.

## 2. Static hosting (live, but still per-device)
Upload the whole folder to any static host or subdomain. Everyone who visits can view and
track in *their own* browser. No backend, no shared data. Good for a public read/try version.

## 3. Server-backed (live + saves to the server, cross-device)  ← Hostinger path
Gives you persistence on the server and is the seam for the future multi-user/social layer.

**Steps on Hostinger (or any cPanel/PHP host):**
1. Create the subdomain (e.g. `tracker.notalonestudios.com`) pointing at a folder, say `public_html/tracker`.
2. Upload everything in this project into that folder (so `index.html` and `server/` sit inside it).
3. In `server/`, copy `config.sample.php` → `config.php` and set:
   - `legacy_edit_token` → a long random secret (this is your "password" to save).
   - `allow_origin` → `https://tracker.notalonestudios.com` (your exact URL — an exact
     origin is required; credentialed CORS cannot use `*`).
4. Make sure `server/data/` is writable by PHP (usually `755`/`775`). **Where your host
   allows it, place `server/data/` and `server/config.php` OUTSIDE the web root** (e.g. one
   directory above `public_html`) so they can never be web-served even if `.htaccess` is
   ignored; point `sqlite_path` / the `require` at the relocated paths.
5. Turn on the server backend in the page. Open the browser console on the live site once and run:
   ```js
   APP_CONFIG.backend = "server";              // or edit storage.js to default this
   localStorage.setItem("qbank_edit_token", "PASTE-YOUR-legacy_edit_token-HERE");
   location.reload();
   ```
   (To make it permanent, set `backend: "server"` in `storage.js`'s `APP_CONFIG`.)

Now your edits POST to `server/api.php`, which writes `server/data/me.json`. Visitors without the
token can still read; only you (with the token) can save. If the server is ever unreachable, the app
**keeps working from localStorage** and retries — you never lose a tick.

### Security notes
- `config.php`, `server/data/*`, `server/lib/`, and `server/jwks_cache/` are blocked from
  direct web access by `.htaccess` (root rule + dir-local `Require all denied`, so it holds
  under subpath deploys too). Better still, keep `data/` + `config.php` outside the web root.
- Never commit `config.php` (it's in `.gitignore`).
- `allow_origin` must be your **exact** app origin — credentialed CORS cannot use `*`. The API
  additionally auto-allows `http://localhost:*` / `http://127.0.0.1:*` for local dev only.

## 4. The social / multi-user future (groundwork already laid)
- Every save is keyed by `APP_CONFIG.profile` — today it's `"me"`. Swap that for a real user id
  after adding login, and each account gets its own `data/<userid>.json` with **zero frontend rewrite**.
- Difficulty ratings are already stored per-test; aggregating `data/*.json` server-side gives you
  community averages, "rate this GT", and leaderboards — the IMDB-of-exams layer.
- Suggested next step when you want accounts: add a `login.php` (sessions or JWT) and replace the
  static `edit_token` check in `api.php` with a per-user check. The storage adapter already sends
  credentials and a token header.  **→ DONE — see section 5 below (Google OAuth + per-user sync).**

## 5. Accounts + cross-device sync (Google OAuth + MySQL)  ← the backend foundation
This is the real multi-user layer. **Auth is Google only** (no passwords). The app stays
**local-first**: it works fully offline and the server is sync + social, never required. The legacy
`?profile=` file API (section 3) still works but is superseded and **isolated** from account data.

### A. What only YOU can do
**1) Create a Google OAuth client** (Google Cloud Console):
   - APIs & Services → **Credentials** → *Create credentials* → **OAuth client ID** → *Web application*.
   - **Authorized JavaScript origins:** your exact app origin, e.g. `https://app.notalonestudios.com`
     (add `http://localhost:8801` while testing locally).
   - No redirect URI needed — we use Google Identity Services (ID token in the browser), verified
     server-side. Copy the **Client ID** (the client secret isn't needed for ID-token verification).

**2) Create a MySQL database** (Hostinger/cPanel → MySQL Databases): a DB + user + password, with
   the user granted on that DB. Note host (usually `localhost`), name, user, pass.

**3) Configure `server/config.php`** (copy from `config.sample.php`; **never commit it**):
   ```php
   'db' => ['driver' => 'mysql', 'host' => 'localhost', 'name' => '...', 'user' => '...', 'pass' => '...'],
   'google_client_id' => '....apps.googleusercontent.com',
   'allow_origin'     => 'https://app.notalonestudios.com',   // exact origin (credentialed CORS)
   'env'              => 'production',   // forces Secure cookies; HARD-disables dev mock-auth
   'dev_mock_auth'    => false,
   ```
   Tables auto-create on first request (or run `server/schema.sql` by hand).

**4) Serve over HTTPS.** Session cookies are `Secure` in production — the app must be on `https://`.

### B. How it works (no frontend rewrite needed)
- "Sign in with Google" appears automatically once `google_client_id` is set. The browser gets a
  Google **ID token** → `POST server/api.php?action=google` **verifies it server-side** (RS256 sig
  against Google's JWKS, `aud`/`iss`/`exp`, `email_verified`) → upserts the user → sets an
  httpOnly+Secure+SameSite session cookie.
- State syncs as one per-user JSON blob (`GET`/`POST ?action=state`, CSRF-protected, last-write-wins
  on `updated_at`). Offline edits queue in `localStorage` and reconcile on reconnect. First login
  **merges** local ticks into the account (never clobbered).

### B′. Hardening already in place
- **Request size cap:** JSON bodies over `max_body_bytes` (config, default **256 KB**) are rejected with `413`
  before decode; over-deep JSON (depth > 32) → `400`. Raise the cap only if a real account legitimately exceeds it.
- **Last-write-wins is server-clamped:** the client's `updatedAt` is clamped to `min(client, server-now)`, so a
  future-dated blob can't permanently win and wedge other devices.
- **Sessions hashed at rest:** `sessions.id` stores `sha256(token)`; the raw token lives only in the httpOnly cookie.
- **CORS:** exact `allow_origin` only (credentialed CORS forbids `*`); `localhost`/`127.0.0.1` auto-allowed for dev.
- **Files:** `server/lib/`, `server/jwks_cache/`, `server/data/`, and `config.php` are blocked from the web
  (root `.htaccess` + dir-local `Require all denied`, subpath-safe). Prefer keeping `data/`+`config.php` out of the web root.

### C. Local testing without Google (developers)
Set `'driver' => 'sqlite'`, `'env' => 'development'`, `'dev_mock_auth' => true`, run
`php -S 127.0.0.1:8801 -t .`, open the app, use the **"Dev sign in"** button. Mock-auth is provably
off in production (requires `dev_mock_auth=true` **and** `env!=='production'` **and** a localhost
request — three independent gates).
