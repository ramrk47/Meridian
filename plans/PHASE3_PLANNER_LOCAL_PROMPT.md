# Builder prompt — Local-first Study Planner (accountability + backward-planning retain surface)

> Paste into a fresh session. You are the **builder**; the coordinator owns strategy/PROGRESS.
> **Fully autonomous — do NOT pause for user input.** If a datum isn't in our captures/sources, **omit +
> label — never fabricate.** App is **Calvetra**. Modular architecture: `js/{core,ds,motion,main,surfaces/*,
> entities/*}` + `css/*`; data via `build_data.py` → `D`; user-state via `storage.js`.

## Read first (the spec is rich — read both in full)
- **`plans/STUDY_PLANNER.md`** — THE spec (the user's accumulated ideas + the research fold-in). Build to it.
- **`plans/STUDY_PLANNER_RESEARCH.md`** — the market research that reframed priorities (lead with accountability;
  backward-planning is the signature feature; hours reframed-not-removed).
- The 3 standards (`MOBILE_DESIGN_STANDARD`/`DATA_VISUAL_STANDARD`/`FACULTY_LAYER`); `js/surfaces/` (the current
  static Planner), `core.js` (`D.library`, `libCoverageChips`, `libTopicUnion`), `storage.js`
  (`Store.state.progress[id].ts`, `videos[id].ts`, `Store.state.schedule`).

## Scope — LOCAL-FIRST core only (the solo planner; high value, no backend)
Build the editable single-user planner. **Do NOT build the post-backend social half** (peer pods, shared
adherence board, WhatsApp snapshot, accountability partner, curator-adopt) — those need accounts/server.

### Lead with the research-validated heroes
1. **Backward-plan from a locked exam date — the signature feature.** User locks an exam date → auto-generate
   **M1/M2/M3 revision passes** counting *backward* (foundation → revision+mocks → rapid revision/last-10-days),
   distributing the library's high-yield topics by importance across the runway. A live **"on track / X days
   behind"** read. **Auto-reschedule when a day is missed** (the anti-abandonment recovery mechanism — root cause
   of week-2 drop-off). Date math is local; no backend.
2. **Adherence + coverage are the hero metrics; the done-diary is DERIVED, not self-reported.** Group existing
   `progress[*].ts` + `videos[*].ts` by day → "what I did on 26 Jun"; **adherence** = planned items actually
   completed (match by module/leaf ids, reuse `libTopicUnion` so "done on Marrow" satisfies the canonical topic).
   **Hours: reframe, not remove** — offer an optional, auto-derived, **non-ranked** hours stat (off by default).
3. **Editable + forkable onboarding (never a blank page).** Plans are editable drafts; new users start from a
   quick-mode/template seed, not an empty grid.

### Modes ladder (all produce the same `plan.items`)
- **Quick-schedule:** assign subject(s) → date range → auto-distribute that subject's modules/videos across days,
  weighted by importance (library) / MCQ-density (`proxy`-labelled), under a daily load cap.
- **Intensity templates:** Hybrid (videos+MCQs) · MCQ-heavy · Revision/PYQ · Custom (platform + activity type).
- **Backward-plan (exam-date)** — above.
- **Manual/custom** — hand-pick modules per day (power path).
- **Realistic-plan guardrail:** if a plan is over-stuffed vs observed pace, warn + suggest a feasible split.

### My-subscriptions scoping (build the local-first primitive — plan generation needs it)
- `Store.state.subs[]` + `toggleSub()`/`isSub()` in `storage.js` (default empty = opt-in); a small "My banks"
  5-chip selector (toolbar + mobile overflow). **Scopes plan generation** to owned banks; sharpens the honest-gap
  signal. (The fancy emphasized `.cov-mine` coverage-pip row from STUDY_PLANNER.md may ship here or stay parked —
  builder's call; keep it additive either way.)

## Schema (local-first; extend the existing seam)
`Store.state.schedule`; `plan = { id, name, mode, examDate?, range?:{from,to}, dailyCap?, revisionPass?,
items:[{ entity:{type,id}, targetDate, pass? }], commitments:[…] }`. Done-diary DERIVED from `*.ts` (no new
write path). Templates are generators over `D.platforms`/`D.library`. Persist via `storage.js` (server-sync later).

## Hard constraints
- **Anti-dopamine (the core guardrail):** completion counts ONLY from real tracked actions; metrics are about
  commitments kept + coverage, never vanity hours; keep planning friction low (the planner must not become the
  procrastination). Calm almanac tone — nudges, not punishment; no leaderboard, no infinite feed.
- Neutrality: template weighting `proxy`-labelled; library importance `directional`/sourced; money never buys
  plan placement. Preserve 56,091 / `D.library` / the mapping. Local-first must work offline. The 3 standards pass/fail.
- No horizontal scroll 320→1920; console clean; day+evening parity; `prefers-reduced-motion`-safe.

## Verify → ship
- Claude Preview (free port if 87xx taken): create a plan in each mode; lock an exam date → see M1/M2/M3 + the
  on-track read; mark a tracked action → it appears in the done-diary + lifts adherence; miss a day → auto-reschedule
  fires; over-stuff → guardrail warns. All breakpoints, day+evening, console clean. Attach 375 + 1440 screenshots.
- Commit in small units; `git push origin main` (SSH; gh token invalid). Tick this in `PROGRESS.md`, decision-log
  line, refresh the data inventory.
- **Report to coordinator (5–7 lines):** modes built, how backward-planning + auto-reschedule work, the done-diary/
  adherence derivation, subs scoping, what was deferred to post-backend, anything omitted for lack of a source.

## Model / reasoning
**Opus 4.8 · xhigh reasoning** — the backward-planning / auto-reschedule logic is the hard, correctness-sensitive
part; date math + revision-pass distribution + miss-recovery. Cohesive single-surface build; one session.
