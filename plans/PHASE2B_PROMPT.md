# Builder prompt — Phase 2b: integrate PrepLadder + eGurukul → all-5-platform Cross-Platform Tracker + PYQ Tracker

> Paste into a fresh session. You are the **builder**; the coordinator owns strategy/PROGRESS.
> **Fully autonomous — do NOT pause for user input.** Make every design/scoping call yourself per the
> standards; if a datum isn't in our captures/sources, **omit and label it — never fabricate.**
> The app is **Calvetra** (rebrand done; keep branding consistent, don't reintroduce "Meridian" in UI;
> the repo dir + `__meridianNavDepth` internal name stay as-is). Modular architecture is in place:
> `js/{core,ds,motion,main, surfaces/*, entities/*}` + partitioned `css/*`; data via `build_data.py` → `D`.

## Orient (read first)
- `plans/PROGRESS.md`, `plans/VISION_and_ROADMAP.md` (Phase 2), `plans/DATA_INTEGRATION.md`.
- The three standards (the rubric): `MOBILE_DESIGN_STANDARD.md`, `DATA_VISUAL_STANDARD.md`, `FACULTY_LAYER.md`.
- `build_data.py` (the `platforms[]` seam: `_marrow_platform()`/`_cere_platform()` + inline DocTutorials;
  `D.reliability`/`D.subjectStrength` already list PrepLadder/eGurukul as **non-integrated**), and how
  `js/` reads `D` (N-platform already — new platforms "light up" in QBank/heatmap/entity pages once in `D.platforms`).

## STAGE 1 — integrate PrepLadder + eGurukul (GATE: finish + verify before Stage 2)
Build them once so the tracker spans all five. Add `_prepladder_platform()` + `_egurukul_platform()` to `build_data.py`:
- **Dedup first:** use the canonical base CSVs; ignore/delete the `(1)`/`(2)` copies (they're duplicates).
- **PrepLadder** from `prepladder_modules.csv` (1,115 modules, grouped by Prof) + `prepladder_subject_totals.csv`
  (19) → subjects → modules. **No reliable MCQ totals exist (free-plan capture)** → set `mcqs:null`,
  do NOT invent them; track at **module** granularity. PYQ from `prepladder_pyq.csv` (361) for Stage 2.
- **eGurukul** from `egurukul_topics.csv` (1,282 topics) → subjects → topics. **No MCQ totals** → `mcqs:null`;
  track at **topic** granularity. PYQ/Express from `egurukul_other.csv` (1,809) for Stage 2.
- **CANON** already has the aliases (PSM, Gynaecology & Obstetrics, OBG) — reuse; all 5 share the 19-subject spine.
- **Honesty:** where `mcqs` is null, the UI shows "—" / "MCQ count not captured" (labeled), and the
  **MCQ-density proxy is simply unavailable** for these two (omit, don't fake). Flip their `D.reliability`/
  `subjectStrength` entries from "non-integrated" to integrated; reconcile any "not yet tracked" copy.
- **Sanity:** the measured **MCQ** figure stays **56,091** (only Marrow+Cere+DocT carry MCQ counts);
  report the NEW module/topic/PYQ counts separately in the build prints. Verify all 5 render in QBank +
  on the Subject/Platform entity pages (heatmap/roster), console clean.

## STAGE 2 — PYQ Tracker (across all 5, on the new design system)
- Integrate the PYQ captures into `D` (sourced, `measured`): Marrow "Previous Year Question Papers",
  PrepLadder PYQ (361), eGurukul PYQ/Express (from `egurukul_other.csv`), DocTutorials PYQ (the seam in
  `doctutorials_chapters.csv`). Where a platform has no PYQ capture, show it as such (don't fabricate).
- Build a **PYQ tracking surface**: per subject (and year where captured), PYQ coverage across platforms,
  mark done/reviewed (reuse the `storage.js` progress seam + `ds` components). Frame PYQ as **the strongest
  honest yield signal we hold** (actual past questions = `measured`, closer to real exam yield than the
  MCQ-density proxy) — label it as such.

## STAGE 3 — Unified Cross-Platform Tracker (the retain surface / spreadsheet-killer)
The core wedge (research job #1: "orchestrate ONE cross-platform plan and prove I'm finishing it"). Build
**one surface** that shows your progress as the **union across all 5 platforms**, not per-platform silos:
- By subject: your combined coverage across platforms, **coverage of the high-yield/PYQ union**, and the
  **untracked gaps** (what high-yield/PYQ you haven't started). Uses canonical subject equivalence so
  "done on Marrow" isn't re-counted as missing on others.
- "Prove I'm finishing it": a clear completion/▮ progress read per subject and overall, cross-linked to
  the Subject/Platform entity pages and the QBank tracker. Density on mobile, multi-panel width on desktop.

## Scope guardrails (do NOT build these here)
- **NOT** the Phase-3 **Study Planner** (`STUDY_PLANNER.md` — editable/shareable peer planner + accountability) —
  this is the *tracking/coverage* surface, not the planner. Don't expand the existing Planner tab into that.
- **NOT** the Rank/College **Predictor** (Phase 2a — its own data-first session, next).

## Hard constraints
- The three standards are pass/fail. Neutrality firewall: epistemic labels + sources on every figure;
  the build-time source-integrity guard must still pass; **no fabricated counts** (null + label instead).
- Local-first (`storage.js` seam); Calvetra branding; warm almanac identity (never neon); preserve the
  56,091 measured MCQ figure + all 1c.1 curated data.
- No horizontal scroll 320→1920; console clean; day + evening parity; motion `prefers-reduced-motion`-safe.

## Verify → ship
- `python build_data.py`; Claude Preview (free port in `.claude/launch.json` if 87xx taken). Verify all 5
  platforms across QBank + entity pages, the PYQ surface, and the unified tracker at 320·375·414·768·1024·1440·1920,
  day + evening. Attach 375 + 1440 screenshots of the unified tracker + the PYQ surface as proof.
- Commit in small units; `git push origin main` (SSH; gh token invalid). Tick Phase 2b in `PROGRESS.md`,
  append a decision-log line, **refresh the data inventory** (PrepLadder/eGurukul now integrated).
- **Report to coordinator (4–6 lines):** platforms integrated + their granularity/omissions, PYQ coverage
  by platform, the unified tracker design, anything you omitted for lack of a source, what's ready for Phase 2a.

## Model / reasoning
**Opus 4.8 · high reasoning** (xhigh is a fine upgrade given the breadth — data integration + 3 build stages).
This is a cohesive single-surface build on the new architecture; one session, no subagents needed.
