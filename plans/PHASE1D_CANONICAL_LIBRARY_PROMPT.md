# Builder prompt — Phase 1d: Canonical Topic Library & Importance Spine

> Paste into a fresh session. You are the **builder**; the coordinator owns strategy/PROGRESS.
> **Fully autonomous — do NOT pause for user input.** If a datum isn't in our sources, **omit + label —
> never fabricate** (especially: never force a platform↔topic mapping to inflate coverage).
> App is **Calvetra**. Modular architecture: `js/{core,ds,motion,main,surfaces/*,entities/*}` + `css/*`;
> data via `build_data.py` → `D`. This pass is the **data backbone** the cross-platform tracker depends on.

## Why this exists
Cross-platform matching today uses **fuzzy token similarity** (`sim()`/`toksC()`) — brittle; it mis-merges
and silently misses modules. We now have an authoritative **canonical Subject→Section→Topic library with
PYQ-frequency importance**: `_raw/curated/Masterlist_topic_importance.xlsx` (a reliable Reddit-sourced
masterlist, user-provided). Build the spine from it, map every platform onto it, and upgrade "High-Yield"
from the **MCQ-density proxy** to this **real PYQ-frequency importance** (labeled `directional`).

## The source file (structure — already reverse-engineered, parse robustly)
`_raw/curated/Masterlist_topic_importance.xlsx`, **19 sheets = our 19 subjects** (SURGERY, OBG, PATHOLOGY,
PHARMACOLOGY, MICROBIOLOGY, FORENSIC, PEDIATRICS, BIOCHEMISTRY, MEDICINE, PSM, ORTHO, PSYCHIATRY,
PHYSIOLOGY, ENT, OPHTHAL, DERMATOLOGY, ANATOMY, RADIOLOGY, ANAESTHESIA) + one empty trailing sheet (skip).
Within a sheet:
- **Section/system header rows** = a single non-empty cell, all-caps, no number (e.g. "GASTROINTESTINAL TRACT",
  "EPIDEMIOLOGY", "Cardiology") → these are the **Sub-section** level grouping the rows beneath them.
- **Header row:** `NUMBER | TOPIC NAME | TIMES REPEATED | PYQ ASKED | PRIORITY | SOURCE TO BE STUDIED |
  [DURATION | COMPLETED | 1ST REVISION | 2ND REVISION]` — caps/spelling vary per sheet; match by position/fuzzy header.
- **Topic rows:** number, **Topic Name** (often comma-separated synonyms → split into name + `aliases[]`,
  e.g. "Inguinal Hernia, Hernia"), **Times Repeated** (int = PYQ frequency), **PYQ Asked** (angle text),
  **Priority** (High/Moderate/Low), **Source rec** (e.g. "RR video+notes➡️Main"). **Ignore** the personal
  tracking columns (COMPLETED / 1ST / 2ND REVISION) — they're the original author's, not ours.

## Stages (commit per stage)
**1 · Canonical library → `D.library`.** Parse all 19 sheets via `build_data.py` (use `openpyxl` if
available, else the stdlib `zipfile`+XML approach — no new heavy deps). Map sheet names → CANON subjects
(reuse `CANON`: OBG→Obstetrics & Gynaecology, PSM→Community Medicine, OPHTHAL→Ophthalmology, etc.). Emit:
```
D.library = { source:{id,label:"Community-curated PYQ-importance masterlist (Reddit)",epistemic:"directional",captured:"2026-06-27"},
  subjects:[ { subject, sections:[ { name, topics:[
     { id, name, aliases:[], timesRepeated:int|null, priority:"High|Moderate|Low", pyqAngle, sourceRec,
       importance:<derived score from priority+timesRepeated>, platformRefs:{} } ]}]}] }
```
Register the source in `D.sources[]` (reuse the 1c.1 registry + the build-time source-integrity guard).
**2 · Integrate PrepLadder + eGurukul** into `D.platforms[]` (the last 2 un-integrated platforms), so the
spine can map all five. Dedup the `(1)/(2)` copies; canonical base CSVs only. PrepLadder = `prepladder_modules.csv`
(1,115 modules, **no MCQ totals → `mcqs:null`**, track at module level) + `prepladder_subject_totals.csv`.
eGurukul = `egurukul_topics.csv` (1,282 topics, **`mcqs:null`**, topic level). Flip their `D.reliability`/
`subjectStrength` entries from "non-integrated" → integrated. The measured **MCQ** figure stays **56,091**
(only Marrow+Cere+DocT carry MCQs); report new module/topic counts separately.
**3 · Map all 5 platforms → canonical topics** (the crux). For each platform's modules/topics, match to a
canonical topic by normalized name + aliases (anchor on the canonical names, not the other way). **Only
assign when confident; everything else stays `unmapped` and is reported.** Fill `platformRefs{platformId:[ids]}`.
Compute + surface **per-platform coverage of high-yield canonical topics** and **unmapped counts**. Do NOT
force matches. (Keep the old `sim()` only as a fallback hint, not as truth.)
**4 · Upgrade High-Yield to importance-based.** Make the Masterlist **importance the primary signal** on the
High-Yield surface + Subject entity pages (topics ranked by PYQ-frequency importance, showing the PYQ angle),
labeled `directional` + sourced. **Demote MCQ-density to a secondary, clearly-labeled `proxy`** (don't delete
it). Surface "this high-yield topic is / isn't covered on platforms X,Y" using the mapping.

## Scope guardrails (do NOT build here)
- **NOT** the unified cross-platform tracker / PYQ tracker (that's the next pass — `PHASE2B_PROMPT.md`, now
  rebuilt on this spine). **NOT** the Study Planner (Phase 3) or the Predictor (Phase 2a).

## Hard constraints
- Neutrality firewall: importance is `directional` (community-curated PYQ-frequency), sourced + dated; the
  source-integrity guard must still pass; **no fabricated counts or mappings** (null/`unmapped` + label instead).
- Preserve the 56,091 measured MCQ figure + all 1c.1/1c.2 data. Local-first; Calvetra branding; warm
  almanac identity. The three standards (`MOBILE_DESIGN_STANDARD`/`DATA_VISUAL_STANDARD`/`FACULTY_LAYER`) are pass/fail.

## Verify → ship
- `python build_data.py` (must not abort on the source guard); Claude Preview (free port if 87xx taken).
  Spot-check: 5+ canonical topics carry correct importance + aliases; mapping coverage looks sane per subject;
  High-Yield now shows importance-ranked topics with the `directional` label; all 5 platforms render. All
  breakpoints 320→1920, day+evening, console clean, no h-scroll. Attach 375 + 1440 screenshots of High-Yield + a Subject page.
- Commit per stage; `git push origin main` (SSH; gh token invalid). Tick **Phase 1d** in `PROGRESS.md`,
  decision-log line, **refresh the data inventory** (library + 2 platforms integrated + mapping coverage stats).
- **Report to coordinator (5–7 lines):** topics/sections parsed per subject, mapping coverage % + unmapped
  counts per platform, how importance now drives High-Yield, anything omitted for lack of a source, what's ready for the tracker.

## Model / reasoning
**Opus 4.8 · xhigh reasoning** — large careful parse + the platform↔topic **mapping is correctness-critical**
(a wrong map = false coverage). One cohesive data-foundation session; honest `unmapped` flagging over forced matches.
> NOTE to coordinator: the mapping is the highest-risk artifact — worth an adversarial/audit follow-up (or an
> ultracode verification pass) before the tracker is built on it.
