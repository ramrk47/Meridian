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
- **Known micro-drift (fold into the mobile rebuild, not a standalone commit):** footer says "press 1–6" but there are 7 tabs/keys (`index.html:49`); subhead hardcodes "Marrow · Cerebellum · CoreBTR" (`index.html:16`).
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
- [ ] **1b · Responsive + mobile-first rebuild** (`RESPONSIVE_MOBILE_REWORK.md`). *Incumbents are mobile-first (H5).* **← next**
- [x] **1a · Multi-platform data model** — exam-agnostic `D.platforms[]` + DocTutorials ingest + N-way
  consensus (`DATA_INTEGRATION.md`). *H1.* *(2026-06-27)* DocTutorials Main integrated (13,202 MCQs);
  Marrow+Cerebellum preserved at 42,889. PrepLadder/eGurukul left as a clean ingest seam.
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
  **Next build: Phase 1a (exam-agnostic `D.platforms[]` + DocTutorials integration + N-way consensus), then 1b mobile rebuild** — awaiting user go.
- 2026-06-27 Deep market-intel sweep done → `MARKET_INTEL.md`. Strategy frame locked (two-sided
  freemium + B2B, neutrality moat). 5 forks open. Reverted a half-built tab experiment; tree clean.
- 2026-06-26 Moved repo Downloads → `~/Meridian`. Sentiment research → `RESEARCH_FINDINGS.md`.
  DocTutorials/PrepLadder/eGurukul detailed CSVs captured to `_raw/NewPlatforms/`.

## Open questions for the user
- The 5 forks above (Phase 0). Even partial leanings unblock sequencing.
- DocTutorials/PrepLadder shown on a free/limited account — are the MCQ totals the full paid catalog?
