# Builder prompt — Backend Foundation (PHP + MySQL + Google OAuth + state sync)

> Paste into a fresh session. You are the **builder**; the coordinator owns strategy/PROGRESS.
> Build the **backend gate** that everything social sits on. **Auth = Google OAuth only** (no passwords,
> no other providers). **Local-first must still work fully offline** — the backend is sync + social, never a
> hard dependency. App is **Calvetra**. **Build + locally test autonomously**; real Google creds + host are
> the user's to supply at deploy (build a dev/mock path so you can verify without them).

## Read first
- **`plans/BACKEND_AND_FULL_BUILD.md`** — the architecture + security requirements (authoritative).
- Existing `server/api.php` (file-based JSON, the `profile`=account seam), `server/config.sample.php`, `DEPLOY.md`,
  and **`storage.js`** (the client `Store` + `save()`/`sync` seam — this is where sync wires in).
- `DATA_VISUAL_STANDARD.md` (neutrality firewall) — applies to anything user/ratings-related later.

## Build (PHP 8 + MySQL via PDO)
1. **Config + schema.** Extend `config.sample.php` → keys: `db{host,name,user,pass}`, `google_client_id`,
   `google_client_secret`, `session_secret`, `allow_origin`. **`config.php` stays gitignored — commit NO secrets.**
   Add a migration that creates `users(id, google_sub UNIQUE, email, name, created_at)`,
   `user_state(user_id PK, blob JSON, updated_at, version)`, and a `sessions` mechanism.
2. **Google OAuth (server-verified).** Endpoint receives the Google ID token from the client → **verify it
   server-side** (fetch Google JWKS, check signature + `aud`==client_id + `iss` + `exp` — never trust the client
   payload) → upsert `users` by `sub` → issue a **session cookie** (`httpOnly`, `Secure`, `SameSite=Lax`). Add
   `/me` (current user) and `/logout`. Use a vetted JWT/JWKS verification approach; do not hand-roll crypto.
3. **State sync API** (replaces/extends `api.php`, now account-scoped): `GET state` → the authed user's `user_state`
   blob; `POST state` → save it (**versioned, last-write-wins on `updated_at`**). Require an authenticated session +
   a **CSRF token** on POST. Keep the atomic-write discipline.
4. **Client wiring (`storage.js` + app):** when logged in, `Store` syncs the user-state blob to the server
   (debounced on `save()`, retry/queue on failure); **offline keeps working from localStorage** and reconciles on
   reconnect — never block the UI. Add a **"Sign in with Google"** button + account state + a small **sync indicator**
   (toolbar + mobile overflow). On first login, **merge local state into the account** (don't clobber the user's local ticks).
5. **Local testability (so you can verify without real creds):** support a **SQLite** fallback for dev + a
   **dev-only mock-auth** path (clearly gated to localhost, hard-off in production) that issues a session without
   Google. Use this to test the full sync loop end-to-end.
6. **Deploy docs:** update `DEPLOY.md` with the Google Cloud OAuth client setup + MySQL setup steps for the user
   (the parts only they can do).

## Hard constraints — SECURITY (non-negotiable; auto-fail if violated)
- **No secrets in git.** `config.php`, keys, tokens never committed (verify `.gitignore`).
- **PDO parameterized queries only** (no string-built SQL). Verify the Google ID token server-side (sig/aud/iss/exp).
- httpOnly + Secure + SameSite session cookies; **CSRF token** on every state-changing POST; HTTPS-only in prod;
  basic rate-limiting on auth/sync. **Minimal PII** (sub + email + name only). All sharing opt-in (none built here).
- Mock-auth path is **dev/localhost only** and provably disabled in production config.
- **Local-first still works with the backend unreachable** (offline edits persist + sync later). Don't regress the
  app: 56,091 / `D.library` / mapping / the 10 surfaces untouched; the 3 standards still pass.

## Verify → ship
- Local end-to-end (SQLite + mock-auth, or a local MySQL): sign in → tick something → it syncs → reload → state
  restored from server; go offline → app still works + edits queue → reconnect → syncs; logout clears the session.
  Console clean; no UI block when the server is down. (Use Claude Preview for the client; run PHP locally for the API.)
- Commit in small units (**secrets-free**); `git push origin main`. Tick this in `PROGRESS.md`, decision-log line,
  refresh the data inventory (new server-side seams). Update `DEPLOY.md`.
- **Report to coordinator (5–7 lines):** endpoints + schema built, how OAuth verification + sessions work, the sync/
  offline-reconcile model, the local→account merge, what the USER must still do (Google OAuth client, MySQL/host),
  and confirmation no secrets were committed.

## Model / reasoning
**Opus 4.8 · xhigh reasoning** — security-critical (OAuth verification, sessions, SQLi/CSRF surface) + the offline-
reconcile sync logic. One focused sequential session; **not** parallelized (it's the shared foundation).
> Coordinator will review the security surface (token verification, query parameterization, secret handling, the
> mock-auth production-off guard) before any social feature builds on it.
