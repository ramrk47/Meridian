# Builder prompt — Phase 2b: PYQ Tracker + Unified Cross-Platform Tracker (on the canonical spine)

> Paste into a fresh session. You are the **builder**; the coordinator owns strategy/PROGRESS.
> **Fully autonomous — do NOT pause for user input.** If a datum isn't in our captures/sources, **omit +
> label — never fabricate.** App is **Calvetra**. Modular architecture: `js/{core,ds,motion,main,surfaces/*,
> entities/*}` + `css/*`; data via `build_data.py` → `D`.

## Where we are (read first)
Phase 1 foundation is done & verified: the **canonical library** (`D.library` — 19 subjects · 170 sections ·
**787 topics** with PYQ-frequency `importance`, `directional`/sourced) and an **audited cross-platform map**
(`library.topics[].platformRefs`, recall-recovered to **594/787 topics, 152/157 high-yield** — trustworthy,
precision-preserved). **All 5 platforms are integrated** (Marrow/Cere/DocT = `qbank`; PrepLadder/eGurukul =
`lecture`, `mcqs:null`). Build the **retain surface** — the spreadsheet-killer — **on this spine**.
- Orient: `plans/PROGRESS.md`, `plans/VISION_and_ROADMAP.md` (Phase 2), the 3 standards
  (`MOBILE_DESIGN_STANDARD`/`DATA_VISUAL_STANDARD`/`FACULTY_LAYER`), `STUDY_PLANNER.md` (scope boundary below).
- **Do NOT** re-integrate platforms or touch `D.library`/the mapping — they're the source of truth.

## STAGE 1 — PYQ Tracker (commit before Stage 2)
Integrate the remaining **PYQ seams** into `D` via `build_data.py` (sourced, `measured`, no fabrication):
`prepladder_pyq.csv` (361), `egurukul_other.csv` (PYQ/Express), DocTutorials **QRP + PYQ** (in
`doctutorials_chapters.csv`), Marrow "Previous Year Question Papers". Where a platform has no PYQ capture,
show it as such. Then a **PYQ tracking surface**: per subject (and year where captured), PYQ coverage across
platforms, mark done/reviewed (reuse the `storage.js` progress seam + `ds` components). Frame PYQ as **the
strongest honest yield signal we hold** (actual past questions = `measured`) — and tie it to `D.library`
importance where topics align.

## STAGE 2 — Unified Cross-Platform Tracker (the spreadsheet-killer)
The core wedge (research job #1: "orchestrate ONE cross-platform plan and prove I'm finishing it").
**Organize it around `D.library`** (subjects → topics) — *this* is what stops modules being missed:
- For each canonical topic: its **importance** + **which platforms cover it** (from `platformRefs`) + **your
  tracking status** (union across platforms — "done on Marrow" satisfies the canonical topic, not re-flagged
  as missing elsewhere). Show the audited per-platform coverage pips.
- **Prove completion:** per-subject and overall **coverage of the high-yield union** + the **untracked
  high-yield gaps** (what you haven't started), importance-ranked. Cross-link to Subject/Platform/Faculty
  entity pages and the QBank tracker. Density on mobile, multi-panel width on desktop.
- Surface the **5 genuinely-unmapped high-yield topics** honestly (real gaps), don't hide them.

## Scope guardrails (do NOT build these here)
- **NOT** the Phase-3 **Study Planner** (`STUDY_PLANNER.md` — editable/shareable peer planner + accountability)
  nor the **parked "My subscriptions" lens** (CAPTURE-NOT-BUILD). *But* keep the coverage-chip structure clean
  so that future `subs[]` lens is purely additive (a `.cov-mine` upper row later) — don't foreclose it.
- **NOT** the Rank/College **Predictor** (Phase 2a — its own data-first session, next).

## Hard constraints
- Neutrality firewall: epistemic labels + sources on every figure; the build-time source-integrity guard must
  still pass; **no fabricated counts/coverage** (null/`unmapped` + label instead). Preserve the **56,091**
  measured MCQ figure, `D.library`, and the mapping. Local-first (`storage.js`); Calvetra; warm almanac
  identity (never neon). The three standards are pass/fail.
- No horizontal scroll 320→1920; console clean; day + evening parity; motion `prefers-reduced-motion`-safe.

## Verify → ship
- `python build_data.py` (guard must pass); Claude Preview (free port if 87xx taken). Verify the PYQ surface
  + the unified tracker render the canonical-topic coverage correctly across all 5 platforms, union progress
  updates, gaps compute, at 320·375·414·768·1024·1440·1920, day+evening. Attach 375 + 1440 screenshots of the
  unified tracker + the PYQ surface.
- Commit in small units; `git push origin main` (SSH; gh token invalid). Tick Phase 2b in `PROGRESS.md`,
  decision-log line, refresh the data inventory (PYQ integrated).
- **Report to coordinator (4–6 lines):** PYQ coverage by platform, the unified-tracker design, how union
  progress + gaps compute off the spine, anything omitted for lack of a source, what's ready for Phase 2a.

## Model / reasoning
**Opus 4.8 · high reasoning** (xhigh fine given breadth). Cohesive single-surface build on the new
architecture + the trustworthy spine; one session, no subagents needed.
