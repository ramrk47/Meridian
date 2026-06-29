# Meridian — PROGRESS (living source of truth)

> The **coordinator session** owns this file. Update it every working session: tick milestones,
> append to the decisions log, keep the data inventory current. Read it (and `git log`) FIRST.
> Last updated: 2026-06-29.

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
- **Next:** **Step 2 — social accountability** (peer pods / shared adherence board / accountability partner /
  WhatsApp snapshot / curator-adopt) now green-lit: the Backend Foundation passed security review **and** the 3 must-fix
  blockers + 3 nice-to-haves are **hardened + verified (2026-06-29)**. *(Backend Foundation built + verified 2026-06-29;
  Phase 2b tracker + local-first Study Planner shipped 2026-06-29. Predictor remains a parallel data-first session,
  deferred to near-launch.)*

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
| `egurukul_other.csv` | 1809 | topic (PYQ/Express) | ✅ **2b**: PYQ (419) + Express (1390) → `D.pyq` (measured; Express flagged revision) |
| `prepladder_modules.csv` | 1115 | module | ✅ integrated `kind:"lecture"` (`mcqs:null`); mapped onto spine |
| `prepladder_pyq.csv` | 361 | topic/year | ✅ **2b**: 361 PYQ sets / 6,774 Qs → `D.pyq` (measured) |
| `prepladder_subject_totals.csv` | 19 | subject | ✅ used to validate PrepLadder module counts |

**PYQ seams → `D.pyq` (Phase 2b, Stage 1; measured past-paper question counts, SEPARATE from the 56,091 QBank MCQ figure):**
| Platform | Source | Past papers | Notes |
|----------|--------|------------:|-------|
| Marrow | "Previous Year Question Papers" subject (reuses existing leaf ids → unions w/ QBank tracker) | 323 / 5,738 Q | measured |
| DocTutorials | `doctutorials_chapters.csv` PYQ + QRP | 371 / 4,488 Q (+ QRP 296 / 5,539 Q) | QRP flagged revision |
| PrepLadder | `prepladder_pyq.csv` | 361 / 6,774 Q | measured |
| eGurukul | `egurukul_other.csv` PYQ + Express | 419 / 4,846 Q (+ Express 1,390 / 14,890 Q) | Express flagged revision |
| Cerebellum | — | 0 | **honest "no PYQ capture"** (never fabricated) |
| **Total** | | **1,474 sets / 21,846 PYQ Qs · 4/5 platforms** | 3,160 trackable units incl. revision |

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
- ✅ All PYQ seams now integrated (Phase 2b) — no remaining content seams.

**User-state seams (`storage.js` `blankState`; local-first AND now server-synced per-account — NOT source data):**
| Key | Shape | Added | Consumed by |
|-----|-------|-------|-------------|
| `progress` / `videos` / `scores` / `stars` / `customTests` | tracking maps (carry `ts`) | (pre-existing) | every tracker; the planner's **derived done-diary** + topic-union completion |
| `subs[]` | owned platform ids (default `[]`) | **Planner (2026-06-29)** | scopes plan generation + the honest-gap signal; `.cov-mine` row (parked) |
| `plan` | `{id,name,mode,examDate?,range?,dailyCap,items[],…}` | **Planner (2026-06-29)** | the active Study Planner (single plan; rides export/import/reset) |
- The whole `blankState` blob is the unit of sync: signed-in, it round-trips to `user_state.blob` (server),
  reconciled by `mergeState()` (newest-`ts` wins; unions; first-login local→account merge). Offline → localStorage only.

**Server-side seams (Backend Foundation, 2026-06-29) — MySQL prod / SQLite dev, via `server/lib/`:**
| Table | Shape | Purpose |
|-------|-------|---------|
| `users` | `id, google_sub UNIQUE, email, name, created_at` | one row per Google account (minimal PII: sub+email+name) |
| `user_state` | `user_id PK, blob JSON, updated_at, version` | the synced per-account state blob (last-write-wins on `updated_at`) |
| `sessions` | `id=sha256(token), user_id, csrf_token, created_at, expires_at, last_seen` | server session → `cal_session` httpOnly+Secure+SameSite cookie (raw token only in cookie; **hashed at rest**); CSRF per session |
| `rate_limits` | `bucket, window_start, count` | fixed-window throttle on `google`/`devlogin`/`state` POST |
- API: `server/api.php?action=` → `google` (verify Google ID token) · `devlogin` (dev-only) · `me` · `logout` · `state`.
  Legacy `?profile=` file store kept but **isolated** under `data/legacy/`, never touches account data.

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
- [x] **Phase 2b · PYQ tracker + unified cross-platform tracker** (the retain surface / spreadsheet-killer),
  built on the 1d canonical spine. *(2026-06-29)* New **Tracker** surface, two lenses via a shared top sub-nav:
  **(1) Cross-platform** — organized around `D.library`: per canonical topic, PYQ-frequency importance
  (directional) + audited coverage pips (`libCoverageChips`) + **union** tracking ("done on Marrow satisfies
  the topic"); proves completion (HY-union % by subject, importance-ranked untracked-HY gaps, the **5 genuine
  unmapped HY topics** surfaced honestly); subject→topic→per-platform-leaf drill reuses the `.mrow` chip seam,
  aggregates refresh live on `state-changed`. **(2) PYQ** — `D.pyq` measured past-paper coverage
  (1,474 sets / 21,846 Qs across 4 platforms; Cerebellum honest "no capture"; QRP/Express flagged revision),
  subject×platform heatmap + trackable per-paper rows (Marrow reuses leaf ids → unions w/ QBank). **56,091 /
  `D.library` / mapping untouched.** Folded in a **nav refactor** (user ask): bottom bar 7→**5 groups**
  (Home · Track[Cross·PYQ·QBank] · Plan[Planner·HY] · Stats[Progress·Tests] · Videos) with a shared sub-nav
  lens switcher; `NAV_GROUPS` drives desktop tabs + mobile bar; `show(view)` stays the atom (deep-links /
  palette / hotkeys 1–5 / entity Back re-sync). Verified 320→1920 day+evening, console clean, no h-scroll;
  data traces to raw CSVs. Commits `d6a0a72`·`e31e189`·`7a3748c`. *(Subscriptions lens now BUILT as the
  My-banks primitive — see the Study Planner entry below.)*
- [x] **Phase 2/3 · Local-first Study Planner** (the retain surface — editable plan + accountability engine),
  built on the 1d spine + the tracker's timestamp seam. *(2026-06-29)* Full rewrite of the static Planner into an
  **editable, forkable** planner with four modes (Quick-schedule · Intensity templates [Hybrid/MCQ-heavy/Revision/
  Custom] · **Backward-plan** · Manual), all producing one `plan.items[]`. **Backward-plan (signature):** lock an
  exam date → auto **M1/M2/M3** revision passes counting down (foundation→revision+mocks→rapid revision, last-10-days
  reserved), HY topics get multiple passes; a live **on-track / X-days-behind** read; **auto-reschedule** moves
  missed-day items forward (the anti-abandonment recovery, with a calm banner). **Adherence + coverage are the hero
  metrics; the done-diary is DERIVED** from `progress[*].ts`+`videos[*].ts` (grouped by local day, never self-
  reported); ticking a topic marks its primary owned-bank leaf attempted (a REAL action) and union-reflects it.
  **Hours reframed** (optional, off by default, video-minutes only — MCQ/reading time never fabricated).
  **Realistic-plan guardrail** warns when a plan outpaces observed history (≥3 active days before any pace claim) and
  offers a one-tap re-cap. **My-subscriptions** primitive shipped (`Store.subs[]`+`toggleSub`/`isSub`/`setSubs`; a
  global "My banks" toolbar button + overflow + a multi-select sheet) — scopes plan generation to owned banks.
  Local-first via `Store.plan` + `Store.subs` (ride import/export/reset for free). **Post-backend social half NOT
  built** (peer pods, shared adherence board, WhatsApp snapshot, accountability partner, curator-adopt). Verified in
  Preview: all 4 modes, exam-lock→passes+on-track, tick→diary+adherence, miss→auto-reschedule, over-stuff→guardrail;
  375+1440, day+evening, console clean, no h-scroll. Files: `js/surfaces/planner.js` (rewrite), `css/planner.css`,
  `storage.js`, `index.html`, `js/main.js`.
- [ ] **Free Rank/College Predictor** (results-season lead magnet) — Phase 2a, deferred to near-launch.
### Phase 3 — retention & the ratings graph (the moat)
- [ ] **Spaced revision / error-log → verified re-test queue** (H2/job#4 — top pain).
- [ ] **"Best platform/faculty per subject" ratings graph** (H3) — structured, voted, neutral.
- [~] **Pace benchmarking / "Am I behind?"** (job#5) — local "on-track / X-days-behind" read + realistic-plan
  guardrail SHIPPED in the Study Planner (2026-06-29); the *peer* pace comparison still needs accounts (fork #4).
### Phase 4 — premium (power users pay)
- [ ] Pro: cross-platform weak-topic heatmap, **rank prediction w/ cross-platform normalization** (job#3), **Last-10-Days deadline engine** (job#2), SR across sources. Free-trial→paid.
### Phase 5 — backend & B2B
- [ ] Accounts + PHP/DB; deploy to notalonestudios.com subdomain.
- [ ] **B2B demand-intelligence dashboards** (aggregate, neutrality-safe) — the primary revenue engine.
### Later — Compendium
- [ ] Multi-exam verticals (UPSC/NEET-UG/JEE/KCET) behind an exam switcher; mobile app shell.

## Decisions log (newest first)
- 2026-06-29 **Backend hardening SHIPPED → social layer GREEN-LIT.** Applied all 6 security-review items
  (`BACKEND_HARDENING_PROMPT.md`), auth core untouched. **3 must-fix:** (HIGH) state blob now capped —
  `read_json_body()` rejects >256 KB (configurable `max_body_bytes`) with **413** before decode + a depth-32
  `json_decode` limit → **400**, and `state_post()` stores only an object/array; (MED) `lib/`+`jwks_cache/` now carry
  dir-local `Require all denied` .htaccess **and** the root rule is de-anchored to `(^|/)server/(lib|data|jwks_cache)/`
  so it holds under subpath deploys; (MED) LWW `updatedAt` **clamped to `min(client, now_ms())`** — a future-dated
  blob can no longer permanently win/wedge devices. **3 nice-to-have:** session ids **hashed (sha256) at rest** (raw
  token only in the cookie); dead `*`-CORS branch removed (exact-origin only); DEPLOY.md fixed (`edit_token`→
  `legacy_edit_token`, exact-origin required, recommend `data/`+`config.php` outside web root). **Verified** on
  SQLite+dev mock-auth: 413 on oversize / 400 on over-depth, 2099-dated blob clamped to server-now (later write still
  wins → no wedge), DB row id = sha256(cookie) (not the raw token), de-anchored regex denies every subpath lib/data/
  jwks path while api.php+index.html stay reachable, CORS reflects exact origin + credentials (no wildcard); full
  client loop (dev sign-in → tick → sync → server pull → reconcile/merge → logout) green in Preview, console clean,
  `php -l` clean, no auth-core regression. **GATE CLEARED → Step 2 (social accountability).**
- 2026-06-29 **Backend Foundation security-reviewed → CONDITIONAL GREEN-LIGHT.** Adversarial audit (line-by-line +
  live crypto tests) confirmed the auth core is **production-grade, not self-reported**: Google JWKS/RS256 verify
  (rejects `alg:none`/HS256-confusion, checks aud/iss/exp/email_verified), full PDO parameterization, 256-bit
  sessions (no fixation, server-side logout), CSRF, legacy `?profile=` isolation, 3-gate mock-auth prod-off — all
  PASS; secrets gate independently verified (config.php/sqlite/legacy untracked). **3 must-fix blockers before
  social/deploy:** (HIGH) no state-blob size/depth cap → DoS; (MED) `lib/`+`jwks_cache/` exposed under subpath
  deploys (root-anchored RedirectMatch); (MED) client-controlled LWW `updatedAt` can wedge sync. +3 nice-to-haves
  (hash session ids at rest, drop `*`-CORS branch, DEPLOY.md doc fixes). **GATE: harden → then social.** Fix prompt:
  `BACKEND_HARDENING_PROMPT.md` (Opus high).
- 2026-06-29 **Backend Foundation BUILT + locally verified (the gate is in).** PHP 8 + PDO (MySQL prod / SQLite
  dev), single `?action=` front controller (`server/api.php`) + `server/lib/` (db/auth/state/csrf/ratelimit/http)
  + vendored **firebase/php-jwt**. Endpoints: `google` (server-verified ID token — RS256 vs Google JWKS, `aud`/`iss`/
  `exp`/`email_verified`), `devlogin` (dev-only, 3 positive prod-off gates), `me`, `logout`, `state` (GET/POST,
  CSRF-required, last-write-wins). Tables `users`/`user_state`/`sessions`/`rate_limits`. Client: `storage.js` gains an
  Account+sync layer (debounced push, offline queue + reconnect flush, **client-side first-login merge** so local
  ticks are never clobbered) + a "Sign in"/sync pill in toolbar **and** mobile overflow. **Local-first preserved**
  (works fully offline; 56,091 / library / mapping / 10 surfaces untouched). Verified end-to-end on SQLite + dev
  mock-auth: signin→tick→sync→reload-from-server→offline-queue→reconnect-drain→logout, plus merge keeps the union;
  console clean, no UI block, **no secrets committed** (config.php/sqlite/jwks_cache/legacy gitignored). Legacy
  `?profile=` file API kept but **isolated** from account data. `DEPLOY.md` §5 documents the user-only setup (Google
  OAuth client + MySQL + HTTPS). **USER still supplies:** Google Client ID, MySQL/host. **→ awaiting coordinator
  security review** (token-verify path, query parameterization, secret handling, mock-auth prod-off, legacy isolation)
  before any social feature builds on it.
- 2026-06-29 **MAJOR PIVOT — manifest the full vision incl. the backend (user directive).** "Put everything into
  the foundation including backend. No complex logins — just Google OAuth." Pulls Phase 5 forward: local-first **+**
  a synced PHP+MySQL backend with **Google OAuth only**, unlocking the parked half (peer pods, shared accountability,
  verified faculty + crowd ratings, curator layer, pace-benchmarks, subscriptions row, predictor). Local-first must
  still work offline (the backend is sync+social, never a hard dependency). Program + architecture + security in
  `BACKEND_AND_FULL_BUILD.md`; sequence = **Backend Foundation (gate) → social → ratings graph → additive bits →
  predictor**; B2B architected-not-built. **First build: `BACKEND_FOUNDATION_PROMPT.md` (Opus xhigh, security-critical).**
  User must supply Google OAuth creds + host/MySQL; public *branded* launch waits on Calvetra IP clearance (dev
  subdomain fine now). Coordinator will security-review (token verify, parameterized queries, secret handling) before social builds.
- 2026-06-29 **Planner verified+accepted by coordinator → local-first product is now feature-rich.** Checked:
  `_genBackward` M1/M2/M3 logic sound (today→exam-1, foundation/revision/rapid split, last-10 reserved, HY gets
  all passes), adherence/coverage honestly derived from real tracked actions, hours = video-minutes only, integrity
  intact (56,091 / library / mapping). **INFLECTION:** the free local-first wedge — cross-platform tracker + PYQ +
  canonical spine + importance + faculty entities + accountability planner — is substantially built. **Highest-value
  next move is VALIDATION, not more features:** get it in front of real aspirants to test the orchestration bet (the
  research's riskiest *unproven* assumption). Options — (a) try it end-to-end; (b) a lightweight public deploy of the
  offline app; (c) the predictor as the acquisition hook. Backend/social (pods, curator-adopt, B2B) stays gated on
  real users (Fork #3). Predictor remains near-launch.
- 2026-06-29 **Phase 2/3 SHIPPED — local-first Study Planner (the retain surface).** Built the editable planner +
  accountability engine on the 1d spine and the tracker's timestamp seam. Led with the research heroes:
  **backward-plan from a locked exam date** (auto M1/M2/M3 passes counting down + on-track read + **auto-reschedule**
  on a missed day) and **adherence/coverage as the heroes with a DERIVED done-diary** (from `*.ts`, never self-
  reported). Four modes (Quick/Template/Backward/Manual) all emit one `plan.items[]`. **Design calls:** (1) the
  schedulable unit is the **canonical library topic**, not a raw leaf — it's importance-ranked, union-trackable
  ("done on Marrow satisfies it" via `libTopicUnion`), and subs-scopable; ticking marks the primary owned-bank leaf
  attempted (keeps completion a REAL action — anti-dopamine). (2) **Hours reframed not removed** — optional, off by
  default, **video-minutes only** (the one honestly-derivable duration; MCQ/reading time isn't captured so it's never
  invented). (3) **Guardrail needs ≥3 active days** before making a pace claim (avoids absurd suggestions off noise);
  pace-unknown plans only warn on an objectively heavy load. (4) **My-subscriptions** built as a global primitive
  (`Store.subs[]`) with a toolbar "My banks" multi-select — scopes plan generation; the emphasized `.cov-mine`
  coverage row stays parked (additive-ready). State persists via `Store.plan`+`Store.subs` (ride export/import/reset).
  **Deferred to post-backend (NOT built):** peer pods, shared adherence board, WhatsApp snapshot, accountability
  partner, curator-adopt — they need accounts/server. **Omitted for lack of a source:** real study *hours* beyond
  video durations (kept honest). Verified in Preview (all modes; exam-lock→M1/M2/M3+on-track; tick→diary+adherence;
  miss→auto-reschedule; over-stuff→guardrail; 375+1440; day+evening; console clean; no h-scroll). 56,091 / `D.library`
  / mapping untouched.
- 2026-06-29 **Next build = local-first Study Planner** (`PHASE3_PLANNER_LOCAL_PROMPT.md`, Opus xhigh), ahead of
  the Phase 2a predictor. Rationale: acquisition (predictor) isn't live until public deploy + backend (Phase 5),
  and the predictor is best built near a real results-season launch with audited cutoff data — whereas the planner
  is the **research-validated deepest moat** (accountability/adherence) and its core is fully buildable now
  (local-first on the spine + tracker). Lead with backward-planning-from-exam-date + auto-reschedule + adherence;
  social half (pods/sharing) stays post-backend. Predictor deferred to near-launch.
- 2026-06-29 **Phase 2b SHIPPED — PYQ tracker + unified cross-platform tracker (the retain surface) + 5-group nav.**
  Stage 1: integrated the last PYQ seams into `D.pyq` (measured past-paper question counts; 1,474 sets / 21,846 Qs;
  Marrow reuses existing leaf ids to union with the QBank tracker; DocT QRP + eGurukul Express captured but flagged
  as revision, not past papers; Cerebellum shown honestly as "no PYQ capture"). Kept SEPARATE from the 56,091 QBank
  MCQ figure (preserved). Stage 2: the spreadsheet-killer — a cross-platform lens organized around `D.library`, with
  per-topic importance (directional) + audited coverage pips + **union** status (done-anywhere satisfies the topic),
  completion proof (HY-union % by subject + importance-ranked untracked gaps), and the **5 genuinely-unmapped HY
  topics** surfaced honestly. Reuses the `.mrow`/appClick tracking seam; live aggregate refresh on `state-changed`.
  **Mid-build the user asked to cut the bottom bar to ≤5 PS-style:** refactored nav into `NAV_GROUPS` (Home · Track
  · Plan · Stats · Videos), merging related sections behind a shared top sub-nav lens switcher (the Tracker's
  internal lens toggle lifted into a general mechanic) — desktop tabs + mobile bar both driven by it; `show(view)`
  remains the routing atom so deep-links / palette / hotkeys (1–5) / entity Back all re-sync. Coverage chips stay
  centralized in `libCoverageChips` so the parked "My subscriptions" `.cov-mine` row remains purely additive.
  Verified in Preview 320→1920 day+evening (console clean, no h-scroll; one 1024 grid-blowout fixed via min-width:0),
  PYQ heatmap cells trace exactly to the raw CSVs. **Next = Phase 2a Rank/College Predictor (its own data-first session).**
- 2026-06-28 **Study Planner research received + folded into `STUDY_PLANNER.md`** (`STUDY_PLANNER_RESEARCH.md`).
  Verdicts: accountability/adherence is the most *observed* behavior → **lead with it, not orchestration** (the
  orchestration desire is INFERRED — validate fast); editable/shareable/copy-a-topper **strongly validated** →
  forkable onboarding required. **New signature feature it surfaced: backward planning from a locked exam date
  (M1/M2/M3 revision passes + auto-reschedule on a missed day)** — the anti-abandonment core. **Hours: reframe,
  not remove** (optional, auto-derived, non-ranked). Open risks to interview: explicit orchestration demand +
  subscription-expiry behavior. Subscriptions lens confirmed (stays parked, additive).
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
