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
- **Blocking next:** decide the 5 strategic forks → sequence roadmap; then foundation (mobile + multi-platform data).

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

## Data inventory (`_raw/NewPlatforms/`) — DocTutorials INTEGRATED; rest captured, not yet integrated
| File | Rows | Level | Status |
|------|-----:|-------|--------|
| `doctutorials_subjects.csv` | 57 | subject×{Main,QRP,PYQ} | ✅ Main in `D.platforms` (QRP/PYQ = seam) |
| `doctutorials_chapters.csv` | 1311 | chapter | ✅ 644 Main chapters → leaves (13,202 MCQs) |
| `egurukul_topics.csv` | 1282 | topic | ⏳ seam (no counts on overview) |
| `egurukul_other.csv` | 1809 | topic (PYQ/Express) | ⏳ seam |
| `prepladder_modules.csv` | 1115 | module | ⏳ seam (no MCQ totals yet) |
| `prepladder_pyq.csv` | 361 | topic/year | ⏳ seam |
| `prepladder_subject_totals.csv` | 19 | subject | ⏳ seam |
- ⚠️ Dedup the `(1)/(2)` copies; verify DocTutorials Main-vs-PYQ overlap; HTML page saves are gitignored fallback.
- Ingest seam for PrepLadder/eGurukul: add a `_platform()` builder in `build_data.py` + an entry in
  `platforms[]` — app.js is already N-platform, so they light up with zero UI changes once counts land.

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
- [ ] **1c.1 · Curation (data-first)** — honest proxy-vs-yield labels; curate best-**platform**
  per-subject matrix (`directional`, sourced) + neutral reliability scorecard (`public-3p`, dated) into
  `D`; `D.sources[]` + "How we rate" surface. Prompt: `plans/PHASE1C1_PROMPT.md`.
- [ ] **1c.1F · Faculty layer** (`FACULTY_LAYER.md`) — `D.faculty[]` schema + ~10–20 curated seed
  (career history, gated profile + rolled-up video ratings, `directional`/`verifiedVia`), faculty surface.
  The IMDB *people* pillar; voting enforced post-backend. Prompt: `plans/PHASE1C1F_PROMPT.md`. *Run after 1c.1.*
- [ ] **Faculty data pass** (greenlit) — Chrome+research gathering of rosters / movement history / ratings →
  `_raw/curated/`. Needs user's logged-in browser. Prompt: `plans/FACULTY_DATA_PASS_PROMPT.md`. *Parallel; enriches 1c.1F.*
- [ ] **1c.2 · Depiction (viz)** — desktop-led data-viz: subject×platform heatmap, consensus view,
  best-for-subject matrix, **faculty career timeline / per-subject strength**, MCQ/yield treemap,
  progress sparklines. Prompt issued after 1c.1 + 1c.1F verify.
### Phase 2 — free wedge / acquisition (GTM)
- [ ] **Free Rank/College Predictor** (results-season lead magnet) — if fork #1 says predictor-first.
- [ ] **PYQ tracker** + unified **cross-platform tracker** as the retain surface (the spreadsheet-killer).
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
