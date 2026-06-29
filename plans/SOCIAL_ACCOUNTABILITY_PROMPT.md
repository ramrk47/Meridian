# Builder prompt — Step 2: Social Accountability (pods · shared board · partner · snapshot card)

> Paste into a fresh session. You are the **builder**; the coordinator owns strategy/PROGRESS.
> Build the **social accountability layer** on the **hardened** backend — the research-validated #1
> behavior (aspirants relentlessly seek study-buddies / daily-target accountability). **Account-gated**;
> the local-first app must still work fully without an account. **Fully autonomous, commit secrets-free.**
> App is **Calvetra**. Backend = PHP+MySQL/SQLite in `server/` (security-hardened); client `storage.js` + `js/`.

## Read first
- `plans/BACKEND_AND_FULL_BUILD.md` (Step 2 scope + security bar) · `plans/STUDY_PLANNER.md` (accountability
  engine (e)–(g) + the **sharing/privacy model**) · the hardened `server/lib/*` (reuse its auth/session/CSRF/
  PDO/rate-limit/body-cap patterns — do NOT weaken them) · `storage.js` (Store + sync + mergeState).

## The privacy model (CENTRAL — this defines the feature)
- **Opt-in only.** Nothing is shared until the user explicitly joins a pod / links a partner.
- **Aggregate, not surveillance.** A member publishes a **minimal adherence summary** (adherence %, subjects
  on-track/behind, current-cycle label) — **never** their raw `user_state`/granular ticks. The server stores/
  relays only that published summary; it must NOT cross-read one user's full state to show another.
- **Solidarity, NOT a leaderboard.** The board shows each member's adherence **to their own plan** — no ranking
  by raw volume or hours, no "winner." Calm tone. (This is the anti-dopamine guardrail extended to social.)

## STAGE 1 — Social backend (security-critical; build + locally test first)
Add to the hardened API (`?action=` controller + `server/lib/`):
- **Tables:** `pods(id, name, owner_user_id, invite_code UNIQUE, created)`, `pod_members(pod_id, user_id, joined,
  opted_in)`, `member_summaries(user_id, pod_id, summary JSON, updated_at)`, `partners(user_a, user_b, status,
  created)`. PDO + parameterized only.
- **Endpoints:** pod `create` (returns invite_code) · `join` (by invite_code) · `leave` · `board` (members +
  their latest published summaries) · `publish_summary` (the caller's own summary) · partner `invite`/`accept`/
  `snapshot`. **All require an authenticated session + CSRF on writes**; rate-limited; bodies under the cap.
- **Authorization (test these adversarially):** `board`/`publish` only for **members** of that pod; **no** reading
  a non-member's data; join only via a valid `invite_code` (unguessable, e.g. 128-bit); a user can only publish
  **their own** summary; leaving removes membership + their summary; no user/pod enumeration; invite codes are not
  reversible to user identity.

## STAGE 2 — Client surfaces (account-gated; calm, opt-in)
- **Pods:** create a pod → share invite code; join via code; **pod board** (members + their adherence% + subjects
  on-track/behind — solidarity, no rank); leave. The client computes its own summary from the cycle/plan engine
  (`_cycleStats`/adherence) and `publish_summary`s it (opt-in, debounced).
- **Accountability partner:** 1:1 mutual-opt-in link; show the partner's weekly snapshot.
- **WhatsApp snapshot card:** generate a shareable weekly summary **card** ("Adherence 82% · OBG done · Surgery
  behind") via canvas/image + the **Web Share API** (fallback: copy/download) — the user drops it into their own
  WhatsApp group. **No WhatsApp API integration** — the app is the source of truth, WhatsApp is just the surface.
- Sign-in required for all of the above (reuse the existing Google/dev sign-in); when signed out, show a calm
  "sign in to join a pod" prompt — the rest of the app is unaffected.

## Hard constraints
- Reuse the hardened security patterns (server-verified session, CSRF, PDO params, rate-limit, 256KB body cap,
  minimal PII). **Do not regress** the auth core or local-first. Published summaries are tiny — keep them so.
- Neutrality/anti-dopamine: solidarity not leaderboard; opt-in; aggregate-only; no hours-ranking; money never
  buys placement. The 3 standards (density/data-visual/local-first) pass. 56,091 / `D.library` / mapping / the
  surfaces untouched. **Secrets never committed.**

## Verify → ship
- Local (`php -S` via the `backend` launch config, SQLite + dev mock-auth, **two mock users**): user A creates a
  pod → B joins by code → board shows both adherence summaries (solidarity, no rank) → A publishes an updated
  summary → B sees it; partner invite/accept + snapshot; the snapshot card generates + shares. **Authz tests:** a
  non-member is blocked from `board`/`publish` (403); a bad invite code fails; a user can't publish another's
  summary. Offline/local-first unaffected; console clean; the 3 standards hold at all breakpoints.
- Commit in small **secrets-free** units; `git push origin main`. Tick this in `PROGRESS.md`, decision-log line,
  refresh the data inventory (new server tables + the `member_summaries`/pods seams).
- **Report to coordinator (6–8 lines):** tables + endpoints + the authz model, how summaries (not raw state) are
  published, the board's solidarity framing, the snapshot-card share path, and the authz tests you ran.

## Out of scope (don't build)
Adopt curator/peer **plans** (that's Step 3 with the curator layer) · crowd/faculty ratings (Step 3) · any chat/
messaging (WhatsApp stays the surface) · public/discoverable pods (invite-only only).

## Model / reasoning
**Opus 4.8 · xhigh reasoning** — multi-user **authorization** is the crux (cross-user data exposure is the risk);
security-critical, one focused sequential session. > Coordinator will **security-review the authz surface**
(member-only reads, invite-code unguessability, own-summary-only writes, no enumeration) before it goes live.
