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
   - `edit_token` → a long random secret (this is your "password" to save).
   - `allow_origin` → `https://tracker.notalonestudios.com` (your exact URL).
4. Make sure `server/data/` is writable by PHP (usually `755`/`775`).
5. Turn on the server backend in the page. Open the browser console on the live site once and run:
   ```js
   APP_CONFIG.backend = "server";              // or edit storage.js to default this
   localStorage.setItem("qbank_edit_token", "PASTE-YOUR-edit_token-HERE");
   location.reload();
   ```
   (To make it permanent, set `backend: "server"` in `storage.js`'s `APP_CONFIG`.)

Now your edits POST to `server/api.php`, which writes `server/data/me.json`. Visitors without the
token can still read; only you (with the token) can save. If the server is ever unreachable, the app
**keeps working from localStorage** and retries — you never lose a tick.

### Security notes
- `config.php` and `server/data/*.json` are blocked from direct web access by `.htaccess`.
- Never commit `config.php` (it's in `.gitignore`).
- `*` origin is fine for testing; lock it to your real URL for production.

## 4. The social / multi-user future (groundwork already laid)
- Every save is keyed by `APP_CONFIG.profile` — today it's `"me"`. Swap that for a real user id
  after adding login, and each account gets its own `data/<userid>.json` with **zero frontend rewrite**.
- Difficulty ratings are already stored per-test; aggregating `data/*.json` server-side gives you
  community averages, "rate this GT", and leaderboards — the IMDB-of-exams layer.
- Suggested next step when you want accounts: add a `login.php` (sessions or JWT) and replace the
  static `edit_token` check in `api.php` with a per-user check. The storage adapter already sends
  credentials and a token header.
