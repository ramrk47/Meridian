# Full Build-Out — backend + accounts + the whole manifested vision (PROGRAM)

> Decided 2026-06-29 (user): **manifest every feature we've conceived, including the backend.** Auth is
> **Google OAuth only — no passwords, no other providers, no complex login.** This pulls Phase 5 forward:
> we go from local-first-only to **local-first + a synced backend** that unlocks everything we've parked
> (peer pods, shared accountability, verified faculty + crowd ratings, the curator layer, the predictor).
> Local-first must *still work offline* (standing rule) — the backend is sync + social, never a hard dependency.

## Architecture (coordinator's decisions — aligned to the existing scaffold)
- **Stack: PHP + MySQL (PDO).** Matches `server/api.php` + `DEPLOY.md` + Hostinger/cPanel hosting. The current
  file-based JSON API becomes the **user-state blob** path; relational/social data moves to MySQL tables.
- **Auth: Google OAuth 2.0 ("Sign in with Google").** Client gets a Google ID token (Google Identity Services) →
  server **verifies it** (signature against Google certs, `aud` = our client id, `iss`, `exp` — never trust the
  client) → upserts a user by Google `sub` → issues a server **session** (httpOnly + Secure + SameSite cookie).
- **Sync model:** `storage.js` stays the local-first seam. Local is the working copy; on login/change it syncs the
  user-state blob to the server (versioned, last-write-wins on `updated_at`); offline edits queue + retry. **Never
  block the UI on the server.**
- **Data model:** `users` (google sub, email, name, created) · `user_state` (per-user synced JSON blob) · relational
  social tables added per feature: `pods`/`pod_members`, `shared_plans`, `ratings` (faculty/topic/test), `curators`.
- **Security (hard requirements):** PDO **parameterized queries** (no SQLi) · verify the Google ID token server-side ·
  httpOnly+Secure+SameSite cookies · **CSRF token** on state-changing POSTs · secrets (Google client secret, DB creds)
  in **gitignored `config.php`** (existing pattern), never committed · HTTPS-only · rate-limit · **minimal PII** (sub +
  email + name only) · all sharing **opt-in** · ratings stay behind the **neutrality firewall** (verified, aggregate,
  methodology published, money never buys score).

## Sequence (each step its own session; backend gates the rest)
1. **Backend Foundation (the gate)** — `BACKEND_FOUNDATION_PROMPT.md`. PHP+MySQL, Google OAuth, server session,
   user-state sync via the `storage.js` seam, account state in-app (sign-in, sync indicator, local→account migration
   on first login), security-hardened, deploy docs. *Local-first preserved.* **Build first.**
2. **Social accountability** (planner's post-backend half) — peer pods, shared adherence board (solidarity, not a
   leaderboard), accountability partner, WhatsApp snapshot card, **adopt curator/peer plans**.
3. **The ratings graph** (now unlockable) — **verified faculty voting** (`verifiedVia:"in-app-activity"`, now
   enforceable), **crowd ratings** (topic/test difficulty + quality), the **curator layer** (`CURATOR_LAYER.md` —
   outcome-verified "people who made it" + tagged blog→planner). All firewall-bound.
4. **Parked additive bits** — the emphasized `.cov-mine` subscriptions coverage row; **pace benchmarking** ("am I
   behind vs peers", now possible with accounts).
5. **Predictor (Phase 2a)** — the acquisition hook; its own public-data-gathering session (can run in parallel —
   data-side, independent of the backend).
6. **Architected-not-built: B2B demand-intelligence** — design the aggregate data model so it's supportable; build
   only at scale (neutrality-safe aggregate dashboards).

*Steps 2–4 can be ultracode (parallel feature surfaces) once the backend lands. Step 1 is sequential + security-
critical → one focused session.*

## Needs the USER (not buildable autonomously)
- **Google OAuth credentials** — create an OAuth 2.0 Client ID in Google Cloud Console; put client id/secret in
  `server/config.php` (never committed). The build sets up the seam + a local dev/mock-auth path so it's testable
  without real creds; real Google sign-in is wired at deploy.
- **Host + MySQL** — a `notalonestudios.com` subdomain + a MySQL DB on the host (or guided setup).
- **Calvetra IP caveat:** a *publicly branded* launch waits on domain/trademark clearance; a **dev/staging subdomain**
  for building + testing is fine now.
