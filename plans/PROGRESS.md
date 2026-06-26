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
- **Working tree:** clean / code at last-shipped v2 (a half-built tab experiment was reverted).
- **Blocking next:** decide the 5 strategic forks → sequence roadmap; then foundation (mobile + multi-platform data).

## Strategy frame (LOCKED) — from MARKET_INTEL.md
- **Build/launch for NEET PG · INI-CET · FMGE now**; architect exam-agnostic so all-India verticals extend later (don't build them yet).
- **Two-sided money:** free tier (trust+scale) → **Pro ~₹1,999/yr via 7–14d free trial** → **B2B demand-intelligence to the teaching apps** (the durable revenue engine).
- **Neutrality is the moat & the product.** Firewall rule: *money buys visibility (a labeled Sponsored surface), never the score/ranking.* Rate from observed usage/outcome data, publish methodology.
- **Positioning:** the neutral meta-layer above the silos — IMDB × cross-platform tracker × "do-next" coach. Wedge = displace the **spreadsheet**, not the platforms.
- **Timing:** NExT deferred to ~2028-29 — build for the live exams, treat NExT as upside, never anchor a milestone to its date.

## OPEN strategic forks (resolve with user BEFORE sequencing the roadmap) — MARKET_INTEL §7
1. **Launch hook:** free Rank/College **Predictor** (max viral) vs **Tracker** (truer to thesis)? *Rec: both, predictor first.*
2. **Ratings source:** crowd reviews vs **observed usage/outcome** vs hybrid? *Rec: hybrid — seed with "best faculty by subject," graduate to usage-based.*
3. **B2B timing:** delay until scale (cleaner neutrality) vs court 1–2 friendly independents (DocTutorials/Cerebellum) early?
4. **Account model:** when add accounts + backend? (gates peer-pace, pods, crowd ratings, B2B aggregation.)
5. **Neutrality stance:** adopt the firewall publicly from day one?

## Data inventory (`_raw/NewPlatforms/`) — captured, NOT yet integrated
| File | Rows | Level |
|------|-----:|-------|
| `doctutorials_subjects.csv` | 57 | subject×{Main,QRP,PYQ} |
| `doctutorials_chapters.csv` | 1311 | chapter |
| `egurukul_topics.csv` | 1282 | topic |
| `egurukul_other.csv` | 1809 | topic (PYQ/Express) |
| `prepladder_modules.csv` | 1115 | module |
| `prepladder_pyq.csv` | 361 | topic/year |
| `prepladder_subject_totals.csv` | 19 | subject |
- ⚠️ Dedup the `(1)/(2)` copies; verify DocTutorials Main-vs-PYQ overlap; HTML page saves are gitignored fallback.

## Roadmap (strategy-informed; SEQUENCE depends on the forks — confirm with user)
### Phase 0 — settle strategy
- [ ] Resolve the 5 forks; produce a re-ranked, sequenced roadmap into `VISION_and_ROADMAP.md`.
### Phase 1 — foundation (powers the free tracker; needed regardless of forks)
- [ ] **Responsive + mobile-first rebuild** (`RESPONSIVE_MOBILE_REWORK.md`). *Incumbents are mobile-first (H5).*
- [ ] **Multi-platform data model** — exam-agnostic `D.platforms[]`, ingest 5 platforms, N-way consensus (`DATA_INTEGRATION.md`). *H1.*
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
- 2026-06-27 Deep market-intel sweep done → `MARKET_INTEL.md`. Strategy frame locked (two-sided
  freemium + B2B, neutrality moat). 5 forks open. Reverted a half-built tab experiment; tree clean.
- 2026-06-26 Moved repo Downloads → `~/Meridian`. Sentiment research → `RESEARCH_FINDINGS.md`.
  DocTutorials/PrepLadder/eGurukul detailed CSVs captured to `_raw/NewPlatforms/`.

## Open questions for the user
- The 5 forks above (Phase 0). Even partial leanings unblock sequencing.
- DocTutorials/PrepLadder shown on a free/limited account — are the MCQ totals the full paid catalog?
