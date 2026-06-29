# Builder prompt — Backend Hardening (security-review fixes; gate before social features)

> Paste into a fresh session. You are the **builder**; the coordinator owns strategy/PROGRESS.
> The Backend Foundation passed a security review — auth/crypto core is production-grade — with **3 must-fix
> blockers + 3 cheap nice-to-haves** before any social feature or public deploy. Apply them all. **Fully
> autonomous, no user input.** App is **Calvetra**; PHP+PDO backend in `server/`. **Commit secrets-free.**

## Read first
- `plans/BACKEND_AND_FULL_BUILD.md` (architecture + security bar). The files below are the targets.
- Don't regress the verified-good auth core (Google JWKS/RS256 verify, sessions, CSRF, legacy isolation,
  mock-auth prod-off gates) — these PASSED; leave their behavior intact.

## MUST-FIX (blockers)
1. **HIGH — cap the state blob (DoS / write-amplification).** In `server/lib/http.php` `read_json_body()`
   (~:80-86) and `server/lib/state.php` `state_post()` (~:35-55): reject a raw body over a configurable cap
   (default **256 KB**) with **413**; `json_decode($raw, true, 32)` (depth limit) and reject malformed/over-depth
   with **400**; validate the decoded value is an object/array before storing. Add the cap to `config.sample.php`.
2. **MEDIUM — protect source + JWKS under subpath deploys.** The root-anchored `RedirectMatch ^/server/...`
   (`server/.htaccess:~15`) fails when the app is deployed under a URL subpath (DEPLOY.md §3's own layout). Add
   **dir-local `.htaccess` with `Require all denied`** in `server/lib/` and `server/jwks_cache/` (mirror
   `server/data/.htaccess`), AND de-anchor the rule to `RedirectMatch 404 (^|/)server/(lib|data|jwks_cache)/`.
   In `DEPLOY.md`, recommend placing `data/` + `config.php` outside the web root where possible.
3. **MEDIUM — clamp the last-write-wins timestamp to server time.** In `server/lib/state.php`
   (`state_incoming_ts`, ~:21-27 & ~:40), the client's `updatedAt` is the LWW key → a future-dated blob can
   permanently win and wedge other devices. Clamp: `incomingTs = min(incomingTs, now_ms())` (or use a
   server-assigned monotonic version as the authority). A client must not be able to future-date its way to always-win.

## NICE-TO-HAVE (do them — cheap, pre-scale hygiene)
4. **Hash session ids at rest.** Store `hash('sha256', $id)` in `sessions.id`, look up by hash
   (`auth.php:~132`, `db.php:~55`). The raw id stays only in the cookie. (Dev sessions can be dropped on migrate.)
5. **Remove the dead `*` CORS branch** in `server/lib/http.php` (~:57,64) — `Allow-Origin:*` + `Allow-Credentials:true`
   is invalid anyway. Keep the exact-origin + loopback paths.
6. **Fix stale DEPLOY.md guidance:** `edit_token` → `legacy_edit_token`; remove the "`*` origin is fine for testing"
   note (require an exact origin).

## Verify → ship
- `brew install php` if needed → `php -S localhost:8000` with the SQLite dev DB + dev mock-auth. Confirm:
  oversized/over-deep blob → 413/400; a future-dated `updatedAt` is clamped (can't permanently win); a simulated
  subpath request to `lib/*.php` and `jwks_cache/*` → denied; session lookup still works with hashing; and the full
  **sign-in → tick → sync → reload → offline → reconcile → logout** loop is still green (no auth-core regression).
  Console clean. (Use Claude Preview for the client.)
- Commit in small **secrets-free** units; `git push origin main`. Tick this in `PROGRESS.md`, decision-log line,
  update `DEPLOY.md`. **Report (4–6 lines):** each fix + how you verified it, and confirm the auth core is unchanged.

## Model / reasoning
**Opus 4.8 · high reasoning** — small but security-sensitive; correctness of the limits/clamp/htaccess matters.
> After this lands, the coordinator green-lights **Step 2 (social accountability)** to build on the account layer.
