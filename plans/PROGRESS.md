# Meridian — PROGRESS (living source of truth)

> The **coordinator session** owns this file. Update it every working session: tick milestones,
> append to the decisions log, keep the data inventory current. Read it (and `git log`) FIRST.
> Last updated: 2026-06-27.

## Status snapshot
- **Shipped (v2):** Marrow + Cerebellum QBanks (42,889 MCQs), CoreBTR tests + 178 topic videos.
  3-level QBank tracker, high-yield engine + consensus, command palette, detail drawer, progress/
  coverage, test scoring + per-subject accuracy, evening theme, j/k keyboard, PWA-ready storage.
- **Repo:** `~/Meridian`, git → `git@github.com:ramrk47/Meridian.git` (`main`, SSH; gh token invalid).
- **Research DONE (two layers):** `RESEARCH_FINDINGS.md` (micro — aspirant sentiment, H1/H2/H3/H6
  confirmed) + `MARKET_INTEL.md` (macro — market size, competitors, white-space, GTM, monetization).
- **Working tree:** clean / live **7-tab** app on the **exam-agnostic `D.platforms[]`** model (Phase 1a done).
  Three QBanks now: **Marrow · Cerebellum · DocTutorials** (`window.D = {exam, platforms[], tests, videos}`;
  `QBANK_DATA` is a back-compat alias). N-way consensus + cross-platform layer live.
- **Micro-drifts RESOLVED in Phase 1b** (commit `8292ff9`): footer "1–6"→"1–7"; subhead now derived
  from `D.platforms` (no hardcoded "Marrow · Cerebellum · CoreBTR").
- **PRODUCT RENAMED → Calvetra** (2026-06-27; was "Meridian"). In-app brand only (title/H1/monogram C/
  manifest/sw cache/copy); repo dir + git remote stay `Meridian`. **calvetra.com + IP-India(Class 41/42)+USPTO
  trademark clearance still REQUIRED before public launch** (see `plans/NAME_CANDIDATES.md`, memory `product-name-calvetra`).
- **Phase 1c.2 Experience Overhaul + craft elevation SHIPPED & verified** (modular design system + chart
  vocabulary + entity pages Subject/Platform/Faculty + faculty seed(14) + motion/View-Transitions layer).
- **Next:** small polish (migrate 5 surface empty-states to `ds.emptyState()`); then Phase 2 wedge (predictor + tracker).

## Strategy frame (LOCKED) — from MARKET_INTEL.md
- **Build/launch for NEET PG · INI-CET · FMGE now**; architect exam-agnostic so all-India verticals extend later (don't build them yet).
- **Two-sided money:** free tier (trust+scale) → **Pro ~₹1,999/yr via 7–14d free trial** → **B2B demand-intelligence to the teaching apps** (the durable revenue engine).
- **Neutrality is the moat & the product.** Firewall rule: *money buys visibility (a labeled Sponsored surface), never the score/ranking.* Rate from observed usage/outcome data, publish methodology.
- **Positioning:** the neutral meta-layer above the silos — IMDB × cross-platform tracker × "do-next" coach. Wedge = displace the **spreadsheet**, not the platforms.
- **Timing:** NExT deferred to ~2028-29 — build for the live exams, treat NExT as upside, never anchor a milestone to its date.

## RESOLVED strategic forks (2026-06-27) — recorded in VISION_and_ROADMAP.md
1. **Launch hook → Predictor first**, cross-platform tracker retains.
2. **Ratings source → Hybrid** — seed editorial "best faculty by subject" + dated reliability scorecard → graduate to observed-usage.
3. **B2B timing → Delay until scale** (protect the neutrality moat).
4. **Account/backend → Local-first now**, accounts + PHP/DB only after the wedge proves traction.
5. **Neutrality → locked + public from day one** (firewall is a first-class, visible feature).

## Data inventory (`_raw/NewPlatforms/`) — ALL 5 platforms INTEGRATED (1d); 3 carry measured MCQs, 2 are lecture
| File | Rows | Level | Status |
|------|-----:|-------|--------|
| `doctutorials_subjects.csv` | 57 | subject×{Main,QRP,PYQ} | ✅ Main in `D.platforms` (QRP/PYQ = seam) |
| `doctutorials_chapters.csv` | 1311 | chapter | ✅ 644 Main chapters → leaves (13,202 MCQs) |
| `egurukul_topics.csv` | 1282 | topic | ✅ integrated `kind:"lecture"` (`mcqs:null`); mapped onto spine |
| `egurukul_other.csv` | 1809 | topic (PYQ/Express) | ⏳ seam |
| `prepladder_modules.csv` | 1115 | module | ✅ integrated `kind:"lecture"` (`mcqs:null`); mapped onto spine |
| `prepladder_pyq.csv` | 361 | topic/year | ⏳ seam |
| `prepladder_subject_totals.csv` | 19 | subject | ✅ used to validate PrepLadder module counts |

**Canonical spine (`_raw/curated/Masterlist_topic_importance.xlsx` → `D.library`, Phase 1d):**
| Source | Level | epistemic | Status |
|--------|-------|-----------|--------|
| Masterlist (Reddit-sourced) | subject→section→topic | `directional` | ✅ 19 subjects · 170 sections · **787 topics** (157 High) → `D.library`; PYQ-freq importance + angle + aliases |
| Cross-platform map | topic↔platform leaf | build-time | ✅ `library.topics[].platformRefs` + `library.coverage`: **594/787 topics, 152/157 HY** mapped (precision-first matcher + propose→refute→confirm recall-recovery overlay `_raw/curated/mapping_overrides.json`; was 232/787, 77/157). 1,401 verified links added, 9 false positives removed |

**Curated layer (`_raw/curated/`)** — sourced judgment, generated into `D` by `build_data.py` (1c.1 / 1d):
| File | Rows | epistemic | Status |
|------|-----:|-----------|--------|
| `sources.json` | 9 | — | ✅ shared registry → `D.sources[]` (+ `src-masterlist-pyq-reddit`; faculty pass APPENDS) |
| `subject_strength.json` | 10 | `directional` | ✅ best-platform/subject → `D.subjectStrength` (PrepLadder rows now integrated) |
| `reliability.json` | 5 apps | `public-3p` | ✅ iOS App Store scorecard → `D.reliability` (all 5 apps `platformId` set) |
| `methodology.json` | 4 labels | — | ✅ epistemic-label defs + firewall → `D.methodology` ("How we rate") |
- ⚠️ `(1)/(2)` copies are byte-identical dups — `build_data.py` reads the canonical base CSV only.
- Remaining seams: `egurukul_other.csv`, `prepladder_pyq.csv`, DocTutorials QRP/PYQ — for the Phase-2 PYQ tracker.

## Roadmap (strategy-informed; SEQUENCE depends on the forks — confirm with user)
### Phase 0 — settle strategy
- [x] Resolve the 5 forks; produce a re-ranked, sequenced roadmap into `VISION_and_ROADMAP.md`. *(2026-06-27)*
### Phase 1 — foundation (powers the free tracker; needed regardless of forks)
- [x] **1b.2 · Mobile density redesign** (`MOBILE_DESIGN_STANDARD.md`). *Fixes the 1b rejection.* *(2026-06-27)*
  KPIs→compact 2-col stat-tile grid (≥6 above fold; 3-col ≥414); QBank 5-control stack→**one toolbar row**
  (slim search + sort/filter **icon buttons → bottom-sheet** + ★ pill); category rows 54px; compact subject
  hero (tabular stats, no redundant legend); tighter panels/type. Desktop untouched (changes scoped ≤640).
  Verified 320–1920 (no h-scroll, console clean); 375 shows 6 tiles + next section / toolbar + 6 cat rows.
- [x] **1b · Responsive + mobile-first rebuild** (`RESPONSIVE_MOBILE_REWORK.md`). *Incumbents are mobile-first (H5).* *(2026-06-27)*
  Fluid container (→1480) + container queries; compact mobile header + **bottom tab nav**; QBank subject
  chip-strip; drawer→bottom-sheet; palette→full-screen; tables→card lists; **PWA** (manifest+SW+icon).
  Overview moved to the **top-left monogram (home)** to free a bottom-nav slot. Verified 12 widths.
- [x] **1a · Multi-platform data model** — exam-agnostic `D.platforms[]` + DocTutorials ingest + N-way
  consensus (`DATA_INTEGRATION.md`). *H1.* *(2026-06-27)* DocTutorials Main integrated (13,202 MCQs);
  Marrow+Cerebellum preserved at 42,889. PrepLadder/eGurukul left as a clean ingest seam.
### Phase 1c — Data & Visual Experience (before the wedge) — `DATA_VISUAL_STANDARD.md`
- [x] **1c.1 · Curation (data-first)** — honest proxy-vs-yield labels; curate best-**platform**
  per-subject matrix (`directional`, sourced) + neutral reliability scorecard (`public-3p`, dated) into
  `D`; `D.sources[]` + "How we rate" surface. Prompt: `plans/PHASE1C1_PROMPT.md`. *(2026-06-27)*
  Curated layer generated by `build_data.py` from `_raw/curated/*.json` (sources · subject_strength ·
  reliability · methodology) → `D.{sources,subjectStrength,reliability,methodology}` + `platforms[].reliability`.
  Honest relabel: "MCQ density (proxy), not measured exam yield" everywhere the score shows (HY callout +
  consensus + planner + drawer "High MCQ density" + Overview "Top-density" tiles), all badged `proxy`.
  Overview gains best-platform-per-subject (`directional`), the 5-app reliability scorecard (`public-3p`,
  per-row source), and a "How we rate · sources" panel. Source-integrity guard in build aborts on any
  unknown source ref. Verified 375–1280 day+evening (console clean, no h-scroll, card-mode tables);
  3 claims spot-checked → all trace to RESEARCH_FINDINGS.md. **`D.sources[]` + epistemic conventions
  reused by 1c.1F.** Commits `91fa9d6` (data) · `3d7deca` (UI).
- [x] **1c.2 · Experience Overhaul (ULTRACODE) — DONE 2026-06-27** (verified, commits →`79ef4a7`). `EXPERIENCE_OVERHAUL_BRIEF.md`. *Ambition: HYBRID.*
  Cross-surface (web+mobile) overhaul: new design system + chart vocabulary + **entity pages**
  (Subject/Platform/**Faculty**) + relational viz, one-system-two-layouts. **Folds in the faculty layer**
  (`D.faculty[]` schema + ~10–20 `directional` seed + `verifiedVia`) and the data-viz pass. Run as a
  multi-agent Workflow (design-explore→judge→foundation→parallel impl→adversarial review). *User runs with ultracode.*
- [ ] **Faculty data pass** (greenlit, separate — needs user's logged-in browser) — `FACULTY_DATA_PASS_PROMPT.md`;
  enriches the seed afterward, zero UI churn. *(`PHASE1C1F_PROMPT.md` is superseded by the overhaul brief.)*
### Phase 1d — Canonical Topic Library & Importance Spine (NEW, before Phase 2) — `PHASE1D_CANONICAL_LIBRARY_PROMPT.md`
- [x] In-house **Subject→Section→Topic** library + **PYQ-frequency importance** from the user-provided
  `_raw/curated/Masterlist_topic_importance.xlsx` (reliable Reddit-sourced; `directional`). Folds in
  **PrepLadder+eGurukul integration** + **maps all 5 platforms onto the spine** (replaces fuzzy `sim()`) +
  **upgrades High-Yield: MCQ-density proxy → real importance**. *The backbone the tracker needs. Opus xhigh.* *(2026-06-28)*
  **Stage 1** — stdlib `.xlsx` reader in `build_data.py` (no openpyxl dep) parses 19 sheets → `D.library`:
  19 subjects, 170 sections, **787 topics** (157 High). Each topic: name + aliases[], `timesRepeated` (PYQ
  freq), priority, `pyqAngle`, `sourceRec`, derived `importance` (0.65·PYQ-freq + 0.35·priority), tier,
  `platformRefs{}`. Sourced to `src-masterlist-pyq-reddit` (epi `directional`), passes the integrity guard;
  author's personal revision columns ignored. **Stage 2** — PrepLadder (1,115 modules) + eGurukul (1,282
  topics) integrated as `kind:"lecture"`, `mcqs:null` → **measured MCQ stays 56,091** (Marrow+Cere+DocT).
  Excluded from all QBANKS surfaces by kind; get a compact lecture Platform page (reliability + module-count
  coverage + faculty moat). reliability/subject_strength flipped non-integrated→integrated. **Stage 3** —
  precision-first build-time matcher fills `platformRefs` + `library.coverage`: anchored on canonical
  names+aliases, exact/substring/subset only (no loose overlap), compound-topic conjunct splitting, spelling
  +synonym normalization, generic-noun guard. **232/787** topics and **77/157 high-yield** carry ≥1 confident
  platform map; rest honestly `unmapped`. **Stage 4** — High-Yield surface + Subject pages now lead with
  PYQ-frequency importance (directional, sourced, with the asked-angle + per-platform coverage pips); MCQ
  density demoted to a clearly-labelled `proxy` lens (kept, not deleted). Verified 320→1440 day+evening,
  console clean, no h-scroll; 375+1440 of HY + a Subject page. Commits `f6d6564`·`737f673`·`d3289a3`·`9f0c1ac`.
  ⚠️ Mapping is the highest-risk artifact — worth an adversarial/ultracode audit before the tracker builds on it.
### Mapping Audit & Recall-Recovery (after 1d, before Phase 2) — `MAPPING_AUDIT_BRIEF.md` (ULTRACODE) ✅
- [x] Raised platform↔canonical-topic mapping **recall** without losing precision. Per-subject
  propose→**refute**→**confirm** fan-out (19 subjects × 3 stages, Opus 4.8 high, two independent skeptics,
  default-reject); handled 1:many/many:1 granularity. **232/787→594/787 topics, 77/157→152/157 HY.**
  1,401 verified links added (every one survived two adversarial passes + a structural re-validation in
  `build_data.py`), 9 matcher false positives removed (bladder/gall-bladder homonym, generic "synthesis"/
  "inhibitor"/"syndrome"). 5 HY topics remain honest gaps (Cystourethroscope, Hysteroscopy, High-risk
  pregnancy, Poisoning, Post-gastrectomy). Overlay = `_raw/curated/mapping_overrides.json`; spine untouched.
### Phase 2 — free wedge / acquisition (GTM)
- [ ] **PYQ tracker** + unified **cross-platform tracker** as the retain surface (the spreadsheet-killer) —
  `PHASE2B_PROMPT.md`, **rebuilt on the 1d canonical spine** (Stage-1 platform integration moved into 1d);
  build **after** the mapping audit lands.
- [ ] **Free Rank/College Predictor** (results-season lead magnet) — Phase 2a, its own data-first session next.
### Phase 3 — retention & the ratings graph (the moat)
- [ ] **Spaced revision / error-log → verified re-test queue** (H2/job#4 — top pain).
- [ ] **"Best platform/faculty per subject" ratings graph** (H3) — structured, voted, neutral.
- [ ] **Pace benchmarking / "Am I behind?"** (job#5) — needs accounts (fork #4).
### Phase 4 — premium (power users pay)
- [ ] Pro: cross-platform weak-topic heatmap, **rank prediction w/ cross-platform normalization** (job#3), **Last-10-Days deadline engine** (job#2), SR across sources. Free-trial→paid.
### Phase 5 — backend & B2B
- [ ] Accounts + PHP/DB; deploy to notalonestudios.com subdomain.
- [ ] **B2B demand-intelligence dashboards** (aggregate, neutrality-safe) — the primary revenue engine.
### Later — Compendium
- [ ] Multi-exam verticals (UPSC/NEET-UG/JEE/KCET) behind an exam switcher; mobile app shell.

## Decisions log (newest first)
- 2026-06-28 **Mapping audit verified+accepted by coordinator; `PHASE2B_PROMPT.md` refreshed for the spine.**
  Independent recompute matched: **594/787 topics, 152/157 HY** mapped, 56,091 preserved, guard intact. Spine
  is tracker-ready (cleared the "<60% HY ⇒ granularity problem" risk). Rewrote the stale 2b prompt (dropped the
  now-done platform integration) to build the **PYQ tracker + unified cross-platform tracker organized around
  `D.library` + `platformRefs`** — union progress, HY-coverage + gaps, 5 genuine HY gaps surfaced honestly.
  **Greenlit as the next build** (Opus high). Subscriptions lens stays parked (additive, per `STUDY_PLANNER.md`).
- 2026-06-28 **Mapping Audit & Recall-Recovery SHIPPED (ULTRACODE) — map is now tracker-ready.** Ran a
  per-subject `propose→refute→confirm` Workflow (19 subjects pipelined, 3 stages, Opus 4.8 · high; two
  independent skeptics, default-reject; 1:many/many:1 granularity-aware) to recover matches the 1d
  precision-first matcher missed on naming/granularity. **Coverage 232/787→594/787 topics (29%→75%),
  77/157→152/157 HY (49%→97%).** Per-platform HY: Marrow 46→136, Cerebellum 14→61, DocTutorials 26→112,
  PrepLadder 45→134, eGurukul 54→133. Mechanism: a validated **overlay** (`_raw/curated/mapping_overrides.json`,
  1,401 added links + 9 removals) merged in `build_data.py` after the algorithmic pass — spine (`D.library`)
  untouched; validator re-checks every leaf (exists / right platform / same canonical subject) and dropped
  2 fabricated ids (1 recovered as a slug-truncation typo). Removals fixed real matcher false positives
  (bladder/gall-bladder homonym; generic "synthesis"/"inhibitor"/"syndrome"). 5 HY topics left as **honest
  gaps** (Cystourethroscope, Hysteroscopy, High-risk pregnancy, Poisoning, Post-gastrectomy). Guards pass
  (56,091 / 42,889 unchanged); spot-checked 18 recoveries (incl. all riskiest cerebellum broad-unit maps) —
  all correct. Preview verified (HY + Subject pips, console clean, no h-scroll 320→1440, day+evening).
  Note: first run hit transient API "connection closed" on 4 subjects' Propose; a retry-hardened refire
  (`mapaudit_refire.js`) recovered them. **Next = Phase 2b tracker on this map.**
- 2026-06-28 **Phase 1d verified+accepted; next = an ULTRACODE Mapping Audit before Phase 2b** (`MAPPING_AUDIT_BRIEF.md`).
  Independent recompute matched the builder: D.library 19/170/787, **77/157 HY mapped**, 56,091 preserved,
  PrepLadder/eGurukul integrated as `kind:lecture`/null-MCQ, High-Yield now importance-first. The mapping is
  precision-first/**low-recall** (Marrow 46/157, Cere 14/157 = recall failures, not real gaps) — building the
  flagship tracker on it would understate coverage. Recover recall via per-subject propose→refute, precision preserved.
- 2026-06-28 **Phase 1d shipped — Canonical Topic Library, Importance Spine, all-5-platform map.** Parsed the
  Reddit masterlist into `D.library` (787 topics, PYQ-frequency importance, `directional`); integrated
  PrepLadder + eGurukul as `kind:"lecture"` (`mcqs:null`, measured MCQ unchanged at **56,091**); mapped all 5
  platforms onto the spine with a **precision-first** build-time matcher (232/787 topics, 77/157 high-yield
  confidently mapped; rest honest-`unmapped`, no forced matches); High-Yield + Subject pages now lead with
  real PYQ-frequency importance (angle + per-platform coverage pips) and demote MCQ-density to a labelled
  `proxy` lens. Decision: lecture platforms stay out of all MCQ-density/QBANKS surfaces (so the measured
  figure and existing surfaces are untouched) and the legacy `sim()` matcher is kept only as a runtime drawer
  hint — the build-time spine is coverage truth. **Open risk flagged to coordinator:** the platform↔topic map
  is the highest-risk artifact (a wrong map = false coverage) — recommend an adversarial/ultracode audit
  before the Phase-2 tracker is built on it. Commits `f6d6564`·`737f673`·`d3289a3`·`9f0c1ac`.
- 2026-06-27 **Canonical Topic Library added (Phase 1d), reordered before Phase 2.** User provided an
  authoritative source — `_raw/curated/Masterlist_topic_importance.xlsx` (Reddit-sourced, reliable): 19
  subject sheets, Subject→Section→Topic with **PYQ-frequency `Times Repeated` + Priority**. It's both the
  **canonical spine** (so QBanks' differing names stop causing missed/double-counted modules — replaces
  brittle fuzzy `sim()`) and a **real importance signal** (retires the MCQ-density proxy on High-Yield,
  labeled `directional`). 1d folds in PrepLadder+eGurukul integration + maps all 5 onto the spine. Prompt:
  `PHASE1D_CANONICAL_LIBRARY_PROMPT.md` (Opus xhigh). Then Phase 2b tracker rebuilt on the spine. **Crux/risk:
  the platform↔topic mapping** — flag `unmapped` over forcing matches; may warrant an adversarial audit.
- 2026-06-27 **Product renamed Meridian → Calvetra** (user pick from the naming workflow). Coined mark
  ("clear/calibrate"), neutral-scales bucket (doesn't box in the exam-agnostic compendium; rejected medical-
  flavored "Synapse" for scale + crowded-namespace reasons). In-app brand only (title/H1/monogram→C/manifest/
  sw-cache→`calvetra-shell-v5`/copy); repo dir + git remote stay `Meridian`; internal `__meridianNavDepth` untouched.
  **calvetra.com + IP-India(Class 41 edu/42 software)+USPTO trademark clearance REQUIRED before public launch** —
  web "available" is directional only. Shortlist + Top 5 + avoid-list: `plans/NAME_CANDIDATES.md`.
- 2026-06-27 **Phase 1c.2 Experience Overhaul + craft elevation SHIPPED** (commits up to `79ef4a7`). Two ultracode
  Workflows: (1) overhaul — modularized the 1,539-line `app.js` + `styles.css` into `js/`+`css/` modules (core/ds/
  surfaces/entities/main, file-partitioned for safe parallelism), built a design-system + chart vocabulary
  (heatmap/consensus/treemap/sparkline/timeline/scorecard), 3 **entity pages** (Subject/Platform/Faculty), folded in
  the **faculty layer** (`D.faculty[]` + 14 sourced `directional` seed + `verifiedVia`), re-skinned the 7 tabs;
  (2) craft elevation — shared `js/motion.js` (View Transitions API, IO reveal, count-up, chart-intro), motion/
  elevation tokens, micro-interactions, richer empty-states, desktop balance, a11y — all reduced-motion-safe +
  non-regressive. **Coordinator live-verify** fixed 2 bugs: entity routing never painted (`setHash` pre-marked
  `routeKey`) and HY `[data-reveal]` panels stuck invisible on direct re-render paths (missing `animateView`).
  Verified in Preview 320–1920, day+evening, console clean, no h-scroll, density bars, multi-panel relational
  desktop, **56,091 preserved**. Two new pillars CAPTURED (build later): `plans/CURATOR_LAYER.md` (outcome-verified
  ratings + tagged blog→planner, Phase 3/post-backend) and `plans/STUDY_PLANNER.md` (editable/shareable peer planner
  + accountability engine, local-first Phase 2/3). *Pending polish:* migrate 5 surface empty-states to `ds.emptyState()`.
- 2026-06-27 **1c.1 verified+accepted; 1c.1F+1c.2 merged into "1c.2 · Experience Overhaul" (ultracode).**
  User: mix the faculty build into a serious cross-surface (web+mobile) data-presentation + UI overhaul,
  run with ultracode. Ambition chosen: **HYBRID** (new design system + chart vocabulary + first-class
  **entity pages** Subject/Platform/Faculty, keep tracking tabs as home, one-system-two-layouts). Brief:
  `EXPERIENCE_OVERHAUL_BRIEF.md`. Coordinator eng calls: stage-1 modularize `app.js` render layer for safe
  parallelism; rubric = the 3 standards; workflow = design-explore→judge→foundation→parallel impl→adversarial
  review. Kept "High-Yield" tab name (real fix = future PYQ-yield data pass, not a rename).
- 2026-06-27 **Phase 1c.1 shipped — curation: inventory → judgment, honestly labelled** (commits
  `91fa9d6` data, `3d7deca` UI). Built the sourced curation layer from `_raw/curated/*.json` →
  `D.{sources,subjectStrength,reliability,methodology}`: best-platform-per-subject (community reputation,
  `directional`), the 5-app iOS reliability scorecard (`public-3p`, per-row source), the four epistemic-
  label defs + neutrality firewall. Reusable epistemic-badge + source-link + platform-ref-chip helpers
  in `app.js`; surfaced on Overview (incl. "How we rate · sources") and as honest proxy relabels (the
  hyScore is now "MCQ density (proxy), not measured exam yield" wherever shown). **Neutrality calls:**
  PrepLadder/eGurukul shown in the scorecard + reputation matrix but flagged "not yet tracked"
  (`platformId:null`, ingest seam intact); a build-time source-integrity guard aborts on any unknown
  source ref. **Omitted for lack of a source:** any *real* PYQ-weighted exam-yield measure — we hold no
  per-topic PYQ-frequency data, so the proxy stays a proxy and we say so. **For 1c.2:** these surfaces are
  text/tables awaiting the data-viz pass (heatmap / matrix / treemap); the tab still reads "High-Yield"
  (kept as nav identity, now badged proxy in-view) — coordinator may want to revisit that label.
- 2026-06-27 **Faculty layer added as a first-class pillar** (`FACULTY_LAYER.md`) — the IMDB *people*
  layer. Faculty entities w/ career history (platforms→solo/super-specialty) + two neutral ratings
  (gated profile votes; rolled-up video rating). We hold ~no faculty data today (verified). Decided:
  **schema + ~10–20 curated seed now** (`directional`, sourced), **greenlit a data-gathering pass**, and
  **verifiedVia="in-app-activity"** for voting (enforced post-backend). Guardrail: aggregate-only,
  community-sentiment framing, never a "worst faculty" board. Passes: 1c.1F + faculty data pass.
- 2026-06-27 **Phase 1c added before the wedge** (user: baseline *data curation* + *visual experience*
  need a major upgrade). Insight: we show **inventory (counts), not judgment** — the moat data
  (best-faculty/subject, reliability scorecard, true yield) sits in research docs, not the app; desktop
  is still the sparse pre-mobile layout. Wrote **`DATA_VISUAL_STANDARD.md`** (laws: show judgment not
  inventory; draw relationships not numbers; neutrality firewall + epistemic labels). Scope: both as
  one workstream, **before** the Phase 2 predictor. Runs data-first (1c.1) → viz (1c.2).
- 2026-06-27 **Phase 1b.2 density redesign shipped** — clears the 1b rejection against
  `MOBILE_DESIGN_STANDARD.md`. Presentation-only (data layer frozen): `index.html` + `styles.css` +
  render layer of `app.js`. **Overview** 4 giant cards → **6 compact KPI tiles** (2-col, tabular
  sans numerals, 1-line note, accent bar; 3-col ≥414). Shared `.stat` mobile restyle ⇒ every view's
  statgrid densifies at once. **QBank** 5 stacked full-width controls → **one toolbar row**: slim
  search + sort/filter **icon buttons that open a reusable bottom-sheet** (`#sheet`, grab-handle, ✓ on
  current, filter-active dot) + ★ hi-yield pill; native `<select>`s kept desktop-only (`.desk-ctrl`).
  Subject hero compacted (tabular stats, dropped redundant meter legend); **category rows 54px**; leaf
  rows/panels/type tightened. Desktop pristine — all density scoped to `@media(max-width:640px)`.
  Verified in Preview at 320·360·375·414·480·600·768·834·1024·1280·1440·1920 (no h-scroll any of 7
  views, console clean); 375 bar met: 6 KPI tiles + next section above fold; toolbar + 6 category rows.
- 2026-06-27 **Phase 1b shipped** (commits `cac4da7` PWA shell, `8292ff9` rebuild). Presentation-only
  on the frozen N-platform schema (data layer untouched). Fluid container `min(100%-2rem,1480px)` +
  clamp tokens + container queries; mobile (≤640) gets a compact sticky header (monogram + tab title +
  ⌘K + "⋯" overflow), a **fixed bottom tab nav**, QBank subject **chip-strip**, **44×44** A/R/Rt chips,
  drawer→**drag-to-dismiss bottom sheet**, palette→**full screen**, tables→**label:value cards** (auto-
  labeled from headers; overflow-x scroll fallback on tablet), 16px inputs, safe-area insets. **PWA**:
  `manifest.webmanifest` (standalone, paper/ink, maskable SVG) + network-first `sw.js` + `icon.svg`.
  **UX decision:** Overview is the home page reached via the **top-left monogram** (active-state logo),
  not a nav item — frees a slot so the bottom nav carries 6 roomier sections. Micro-drifts resolved
  (footer 1–7; dynamic subhead from `D.platforms`). Verified no horizontal scroll across
  320·360·375·414·480·600·768·834·1024·1280·1440·1920 (all 7 views), console clean, SW active.
- 2026-06-27 **Phase 1a shipped** (commits `7bae112..e5af3ca`). `build_data.py` → exam-agnostic
  `window.D = {exam, platforms[], tests, videos}` + `QBANK_DATA` alias shim. DocTutorials Main
  integrated (19 subj / 644 chapters / **13,202 MCQs**; subject-overview states 13,199 → +3 capture
  variance; hyScore = within-subject MCQ share, no rating captured). Marrow+Cerebellum **preserved at
  42,889**. app.js fully N-platform: consensus 2→N (high on ≥2 banks), N-way cross-matcher/drawer/
  palette/coverage, QBank N-way switch (segmented ≤3, dropdown beyond), generalized Overview/Progress/
  HY/Planner. Fixed `cerebellum_tests.csv` path drift. Verified clean in Preview (all 7 tabs, no console
  errors). PrepLadder/eGurukul left as a clean ingest seam. **Next: Phase 1b mobile rebuild.**
- 2026-06-27 **5 forks resolved** (predictor-first · hybrid ratings · local-first→backend-after-wedge ·
  delay-B2B · public neutrality). Sequenced roadmap written to `VISION_and_ROADMAP.md`. Reconciled
  code drift (7-tab app is live v2; footer "1–6" + static subhead noted to fix in mobile rebuild).
  Phase 1a now **shipped + reconciled** (totals: 56,091 = 42,889 preserved + 13,202 DocTutorials).
- 2026-06-27 **Phase 1b shipped but REJECTED on design** — mobile reads like "a website cosplaying as
  an app": desktop cards stacked one-per-row, one datum per giant card, oversized serif numerals,
  stacked full-width controls. Wrote **`plans/MOBILE_DESIGN_STANDARD.md`** (standing rule: density is
  the product) + memory. **Next build: Phase 1b.2 density redesign** — prompt in `plans/PHASE1B2_PROMPT.md` (Opus, high).
- 2026-06-27 Deep market-intel sweep done → `MARKET_INTEL.md`. Strategy frame locked (two-sided
  freemium + B2B, neutrality moat). 5 forks open. Reverted a half-built tab experiment; tree clean.
- 2026-06-26 Moved repo Downloads → `~/Meridian`. Sentiment research → `RESEARCH_FINDINGS.md`.
  DocTutorials/PrepLadder/eGurukul detailed CSVs captured to `_raw/NewPlatforms/`.

## Open questions for the user
- The 5 forks above (Phase 0). Even partial leanings unblock sequencing.
- DocTutorials/PrepLadder shown on a free/limited account — are the MCQ totals the full paid catalog?
