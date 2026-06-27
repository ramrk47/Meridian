# Meridian — Vision, Core Ideas & Roadmap

## The one-line concept
**An IMDB for exam prep** — a neutral, cross-platform hub where aspirants track what they've
studied across *every* source they use, see what's high-yield by consensus, rate and review the
content/tests, and discover what to do next. Not a content seller; a **meta-layer** that sits
above the content sellers.

## Why it can win
Every aspirant pays for 2–4 platforms (Marrow, PrepLadder, Cerebellum, DocTutorials, eGurukul,
DAMS…) and has **no single place** to see combined progress, dedupe overlapping topics, or judge
which platform's content is actually best for a given topic. Each platform deliberately locks you
in. Meridian is the Switzerland: it makes multi-source study coherent. The data we already hold
(both major QBanks, topic-level, with computed high-yield + cross-platform matching) is the moat.

## Core ideas (the pillars)
1. **Cross-platform tracking** — one progress state over the union of all platforms' topics.
2. **Consensus high-yield** — when independent platforms both rank a topic high, that's signal.
3. **The review/ratings layer (the real IMDB part)** — users rate tests & topics for difficulty,
   quality, and "worth it", aggregated into community scores. This is the social moat and the
   thing no single platform can credibly build (they can't rate competitors).
4. **Topic equivalence graph** — the same topic mapped across platforms (modules, videos, tests),
   so "I did Glaucoma on Marrow" surfaces the Cerebellum/DocTutorials equivalents and any video.
5. **Do-next intelligence** — gap analysis (untracked high-yield), weakest-subject routing from
   test scores, spaced-revision nudges.

## Vision arcs (near → far)
- **Now (v2, shipped):** 2 QBanks + CoreBTR tests + CoreBTR videos, tracking, high-yield engine,
  command palette, detail drawer, evening theme. Local-first, single user.
- **Next:** responsive + true mobile; multi-platform data (DocTutorials/PrepLadder/eGurukul);
  research-validated features; PHP backend on a notalonestudios.com subdomain.
- **Then (social):** accounts + login; community ratings/reviews of tests & topics; leaderboards;
  "which platform is best for X" aggregated verdicts; shareable progress.
- **Mobile app:** wrap the responsive web app (Capacitor/Tauri/PWA) — the mobile rework is
  designed to be portable to a shell with minimal change.
- **Compendium (the big bet):** generalize beyond medical PG to **UPSC, NEET UG, JEE, KCET**, and
  other streams. The data model is already exam-agnostic in shape (Exam → Platform → Subject →
  Topic → Item). One codebase, many exam "verticals"; the cross-platform + ratings layer is the
  same everywhere. Becomes a compendium hub for all streams of aspirants.

## Roadmap backlog (pre-research ranking) — **SUPERSEDED** by "Sequenced roadmap" below (2026-06-27)
> Kept for history. The live build order is the **Sequenced roadmap** section further down,
> which folds in RESEARCH_FINDINGS.md, MARKET_INTEL.md, and the resolved strategic forks.
**P0 — foundational**
- Responsive layout rework + exquisite mobile view (see RESPONSIVE_MOBILE_REWORK.md). Current
  desktop space utilization is poor; no mobile view exists. Blocks everything else's usability.
- Multi-platform data model (Exam→Platform→Subject→Topic) so new platforms are data, not rewrites.

**P1 — high-leverage, IMDB-aligned**
- Community ratings/reviews scaffold (even local-first first): per-test and per-topic difficulty +
  quality + notes, designed to aggregate server-side later.
- Finish data integration of DocTutorials (have MCQ totals), PrepLadder, eGurukul (drill counts).
- "What to do next" dashboard: untracked high-yield by MCQ-at-risk, weakest subjects from scores.
- Spaced revision: surface topics marked Reviewed/Retaken N days ago as "due".

**P2 — depth & delight**
- Topic equivalence graph view (cross-platform map per subject).
- Study sessions / pomodoro + daily goal + streaks (continuity).
- Print/PDF revision broadsheet polish.
- Import/merge a friend's export (compare coverage).

**P3 — platform & scale**
- Accounts + PHP/DB backend; deploy to subdomain.
- Multi-exam verticals (UPSC/NEET-UG/JEE/KCET) behind an exam switcher.
- Mobile app shell.

## Resolved strategic forks (2026-06-27) — these drive the sequence
1. **Launch hook → Predictor first, tracker retains.** Free, no-login Rank/College Predictor is the
   public results-season lead magnet; the cross-platform tracker is the retain surface users funnel into.
2. **Ratings source → Hybrid.** Seed editorial "best faculty by subject" + the dated app-store
   reliability scorecard, then graduate to observed usage/outcome signals as scale arrives. Avoids
   both cold-start (pure usage) and selection-bias (pure crowd).
3. **Account/backend timing → Local-first now, backend after the wedge proves.** `storage.js` stays
   the seam; accounts + PHP/DB enter only once tracker+predictor show traction. Gates pace-benchmark,
   pods, crowd-rating aggregation, and Pro payments.
4. **B2B timing → Delay until scale.** Build the aggregate data asset now; no B2B sales conversations
   until there's real scale — protects the neutrality moat.
5. **Neutrality → locked + public from day one.** The firewall (money buys labeled visibility, never
   the score; rate from observed data; publish methodology; disclose paid placements) is a first-class,
   visible product feature, stated openly at launch.

## Sequenced roadmap (post-forks — this is the live build order)

### Phase 1 — Foundation (local-first; the rails, no new user features) — **build first regardless**
- **1a · Exam-agnostic data model.** Refactor `window.QBANK_DATA.{marrow,cerebellum}` →
  `D = { exam, platforms[], tests, videos }` (Exam→Platform→Subject→Topic→Item, per DATA_INTEGRATION.md).
  Integrate **DocTutorials now** (has MCQ totals); PrepLadder/eGurukul once drilled. Extend `CANON`
  aliases. Generalize consensus **2 → N** (high on ≥2 independent platforms). Preserve the 42,889
  Marrow+Cerebellum sanity total. Files: `build_data.py`, `data.js`, `app.js` (data-access + helpers).
- **1b · Mobile-first responsive rebuild** on the *frozen* N-platform schema (RESPONSIVE_MOBILE_REWORK.md):
  fluid container, sticky compact header + **bottom tab nav**, QBank subject chip-strip, drawer→bottom-sheet,
  palette→full-screen, tables→card lists, container queries, safe-area insets, **PWA** manifest + SW.
  Sweep the two micro-drifts here (footer "1–6"→"1–7"; dynamic platform subhead). Files: `index.html`,
  `styles.css`, `app.js` (render layer + mirror `show()` to bottom nav).
- *Sequencing:* **1a before 1b** — freeze the schema so the responsive renderers are written once
  against the final shape, not twice. Both are the cohesive app.js/styles.css/index.html surface →
  built by the coordinator, sequentially (app.js is the shared seam; do not parallelize).

### Phase 1c — Data & Visual Experience (substance + depiction) — **before the wedge**
*Decided 2026-06-27: the baseline shows inventory (counts), not the curated cross-platform judgment
that is Meridian's reason to exist; desktop is still the sparse pre-mobile layout. Raise the floor
before building the predictor/tracker on it. Governed by `DATA_VISUAL_STANDARD.md`. Two passes:*
- **1c.1 · Curation (data-first).** Relabel proxy-vs-yield honestly; curate the **best-platform
  per-subject matrix** (H3, `directional`, sourced) + the **neutral reliability scorecard** (`public-3p`,
  dated) into `D` via `build_data.py`; add a `D.sources[]` registry + "How we rate" surface. Neutrality
  firewall enforced; PrepLadder/eGurukul count-drilling is an optional separate Chrome session (don't block).
- **1c.2 · Experience Overhaul (ULTRACODE)** — `EXPERIENCE_OVERHAUL_BRIEF.md`. *Ambition: HYBRID.* One
  cross-surface (web+mobile) overhaul that **folds in the faculty layer + the data-viz pass**: a new
  **design system** (tokens + chart vocabulary, color-as-data-encoding) + **first-class entity pages**
  (Subject / Platform / **Faculty** with career timeline + ratings) + relational viz (heatmap · consensus ·
  treemap · sparklines · timeline, all epistemically labelled), while keeping the tracking tabs as home.
  **One system, two layouts** (desktop width / mobile density). Run as a multi-agent Workflow: design-
  exploration → judged synthesis → modularize+foundation → parallel surface impl → adversarial review.
  Faculty data (`D.faculty[]` schema + ~10–20 `directional` seed + `verifiedVia`) is built inside it;
  voting enforced post-backend. *(Absorbs the former 1c.1F + 1c.2.)*
- **Faculty data pass** (greenlit, separate — needs the user's logged-in browser) — `FACULTY_DATA_PASS_PROMPT.md`;
  enriches the seed afterward with zero UI churn.

### Phase 2 — Free wedge / acquisition (the launch)
- **2a · Free Rank/College Predictor** — public, no-login, shareable, results-season hook; neutral
  published methodology. The acquisition magnet.
- **2b · Cross-platform tracker + PYQ tracker** as the retain surface (tracker core mostly exists →
  extend to N platforms; add PYQ tracking). The spreadsheet-killer.
- *Quick win when slack:* **subscription/validity tracker** (H6 — show each platform's expiry vs the
  exam date, warn before lapse; cheap, emotionally resonant).

### Phase 3 — Retention + the ratings graph (the moat; still local-first)
- **3a · Spaced-revision "Due" queue** across all platforms (H2 — top unmet need).
- **3b · Do-next intelligence** — weakest-subject routing from scores + untracked-high-yield gap (H4).
- **3c · Ratings scaffold (hybrid)** — seed "best faculty by subject" + read-only dated reliability
  scorecard; local-first, schema ready to sync; neutrality firewall labeled (H3).
- **3d · Curator layer (post-backend)** — outcome-verified "people who made it" (good rank / matched PG)
  as a credibility tier on ratings + a tagged blog whose references one-tap into the planner. The graduation
  of Fork #2 to observed-outcome signals; twin of the faculty pillar. Spec: `plans/CURATOR_LAYER.md`. Needs
  accounts + outcome-verification → behind the backend gate.
- **3e · Study Planner as the retain surface** — editable/customizable + shareable peer planner +
  accountability engine (plan-adherence not vanity hours; "done diary" derived from real tracked activity;
  small peer pods + WhatsApp-shareable weekly snapshot). Solo planner + templates + done-diary are
  **local-first (buildable Phase 2/3)**; sharing/pods need the backend. Spec: `plans/STUDY_PLANNER.md`.

> **Naming:** the product is now **Calvetra** (renamed from Meridian, 2026-06-27 — `plans/NAME_CANDIDATES.md`).
> calvetra.com + IP-India/USPTO trademark clearance required before public launch.

### ⟐ Gate — wedge proves traction → add **accounts + backend** (PHP/DB on the `storage.js` seam)
Unlocks pace-benchmark, pods, crowd-rating aggregation, and Pro payments. Deploy to a
notalonestudios.com subdomain.

### Phase 4 — Premium "Pro" (₹1,999/yr via 7–14d free trial; needs payments → post-gate)
Cross-platform weak-topic heatmap · rank prediction with cross-platform normalization · Last-10-Days
deadline engine · spaced repetition across sources · ad-free.

### Phase 5 — B2B demand-intelligence (only at scale — the durable revenue engine)
Anonymized aggregate dashboards (category demand, share-of-attention, completion/satisfaction
benchmarks) sold per platform. Neutrality firewall enforced; methodology published; lead-in with the
safest aggregate product, no per-enrollment lead-gen at launch.

### Later — Compendium
UPSC/NEET-UG/JEE/KCET verticals behind an exam switcher (`D.exam` already in the schema); mobile app
shell via Capacitor/Tauri on the PWA base.

## Guardrails / principles
- **Neutral & honest:** never fake counts; label inferred data; respect each platform's guardrails
  (we read public/own-account page content, never bypass protections or scrape behind paywalls).
- **Local-first always works** even when the backend is down.
- **Design stays editorial** — calm, premium, never gaudy.
- **Exam-agnostic core** — every new feature should make sense for a future UPSC/JEE vertical too.
