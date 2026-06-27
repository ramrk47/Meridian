# Design Direction C — "THE ATLAS"
## Relational / IMDB-Entity overhaul for Meridian

> **Angle:** Foreground the *graph*. The three entity types — **Subject**, **Platform**, **Faculty** —
> and the **relationships between them** (who teaches what, where; where platforms agree; how a teacher's
> career moved) are the hero. The 7 tracking tabs stay home; every name on every surface is a *link* into
> the entity it represents. The heatmap, the consensus mark, and the career timeline are the load-bearing
> visualizations, not decoration. We keep the warm almanac soul and reach native-app density.
>
> **Risk owned:** relationship-viz that is decorative, or that buries daily tracking density. Mitigation
> (stated up front): every relational viz binds *real* `D` data, carries an epistemic badge + source, and
> is **subordinate to the tracking rows** on mobile (charts collapse to a single compact strip; rows win
> the fold). No chart ships unless it answers "what do I do next / who is best / where do they agree."

This spec is concrete and buildable in the existing vanilla stack: HTML/SVG strings from pure functions on
the global scope, CSS variables extending the current tokens. **No framework, no bundler, no ES modules,
no new runtime deps.** It maps onto the TARGET MODULE ARCHITECTURE in the brief (core/ds/surfaces/entities/main).

---

## 0. What the data actually supports (grounding — verified against data.js / build_data.py)

Decisions below only bind data that exists, so we never fabricate:

- **`D.platforms[]`** — `marrow` (m), `cerebellum` (c), `doctutorials` (k). Each has `subjects[].modules[]`
  with `{id,name,category,mcqs,rating,priority,hyScore}`. PrepLadder/eGurukul are **not** in `platforms[]`
  (no content) — they appear only in `D.reliability.apps[]` and `D.subjectStrength` with `platformId:null`.
- **`D.subjectStrength`** — `{epistemic:"directional", captured, framing:"community reputation", sourceIds[],
  subjects:[{subject, strong:[{platform, platformId}]}]}`. Binds the "who is best per subject" claim.
- **`D.reliability`** — `{epistemic:"public-3p", captured, scale, apps:[{name,platformId,rating,ratingApprox,
  ratingsLabel,themes[],sourceId}]}`. Binds the neutral scorecard. Integrated platforms also carry a
  convenience `platforms[].reliability` pointer.
- **`D.sources[]`** — evidence registry; `SRC_BY_ID`. **Every curated figure references these ids.**
- **`D.methodology`** — the 4 epistemic-label definitions + the firewall sentence. Powers tooltips + How-we-rate.
- **`D.faculty`** — **does NOT exist in data.js yet** (referenced once, unpopulated). FACULTY_LAYER.md gives the
  target schema. → This design defines the **seed file `_raw/curated/faculty.json`** + the `build_data.py`
  hook + the surfaces, all **gated**: when `D.faculty` is empty/absent, the Faculty tab + faculty panels
  render an honest **"seed in progress"** empty-state, never a fabricated roster. Cross-matching (`bestCross`,
  `siblings`) already lets us draw the subject×platform heatmap **today** from real MCQ data.
- **Proxy honesty:** `hyScore` is within-subject MCQ density. Everywhere it appears it is labelled
  `proxy` and titled "MCQ density — proxy, not measured exam yield." We never compute a fake "yield."

---

## 1. VISUAL LANGUAGE

We **extend** the existing `:root` tokens (styles.css L6–31) — we do not replace the feel. New tokens go in
`css/tokens.css`. All hexes chosen to sit inside the current paper/ink/pine/gold world; **nothing neon**.

### 1.1 Palette additions (light) — append to `:root`
```css
:root{
  /* --- categorical PLATFORM palette (extend existing) --- */
  --marrow:#3a5a78;  --cere:#b0613b;  --core:#5d7a52;     /* existing: Marrow / Cerebellum / DocTut */
  --prepl:#7a6a3c;   /* NEW PrepLadder — muted ochre-bronze, distinct from gold, reputation-only */
  --eguru:#6a5a86;   /* NEW eGurukul — muted aubergine (reuses --rt family), reputation-only */
  /* tints for chips/fills — computed, not stored, via color-mix(in srgb, var(--X) 14%, var(--paper-2)) */

  /* --- SEQUENTIAL yield/density ramp (single-hue, pine→paper; encodes magnitude) --- */
  --seq-0:#f0ece2;   /* = --paper-3, "none/low" */
  --seq-1:#dbe3dc;
  --seq-2:#b9ccbf;
  --seq-3:#8fb0a0;
  --seq-4:#5d8a78;
  --seq-5:#2c6354;   /* = --accent-2, "highest density" */
  --seq-ink-lo:var(--ink-2);  /* text on light cells */
  --seq-ink-hi:var(--paper-2);/* text on dark cells (seq-4/5) */

  /* --- DIVERGING consensus ramp (disagree ↔ agree); warm, not red/green neon --- */
  --con-none:var(--line);      /* platform absent */
  --con-one:#cdb98a;           /* one platform flags HY (muted straw) */
  --con-two:#a9832f;           /* = --gold, two agree */
  --con-all:#7a5b16;           /* deep antique gold, all agree — the strongest consensus */

  /* --- semantic status (reuse existing) --- */
  --good:var(--core); --warn:var(--gold); --bad:var(--bad); --neutral:var(--ink-3);

  /* --- elevation (almanac = mostly flat; elevation is for overlays only) --- */
  --e0:none;
  --e1:0 1px 0 var(--line);                          /* hairline "card" — the default */
  --e2:0 8px 24px rgba(35,32,27,.10);                /* hover lift, popovers */
  --e3:0 22px 60px rgba(20,17,14,.30);               /* sheets / drawer / palette (existing values) */

  /* --- radii scale --- */
  --r-1:7px;   /* chips, small controls (existing chip radius) */
  --r-2:11px;  /* tiles, rows-group, cat-block (existing) */
  --r-3:14px;  /* panels (existing --r region) */
  --r-pill:22px;

  /* --- chart geometry tokens --- */
  --cell:34px;            /* heatmap cell desktop */
  --cell-m:26px;          /* heatmap cell mobile */
  --spark-h:26px;         /* sparkline strip height */
  --tl-dot:9px;           /* timeline node */
}
```
Evening edition (`body.evening`) gets the parallel ramp (darker paper, lighter ink) appended next to the
existing evening block — the sequential ramp inverts toward `--accent` lightness so cells stay readable on dusk:
```css
body.evening{
  --prepl:#bda86a; --eguru:#a892c2;
  --seq-0:#2a241f; --seq-1:#33403a; --seq-2:#3f5a4f; --seq-3:#4f7766; --seq-4:#5e9b86; --seq-5:#6fae98;
  --seq-ink-hi:#181513; --seq-ink-lo:var(--ink-2);
  --con-one:#6a5a30; --con-two:var(--gold); --con-all:#cda64e;
}
```

### 1.2 Type scale (display serif + tabular sans steps, explicit px)
Two faces, unchanged: `--serif` (Iowan/Palatino/Georgia) for **display/identity** only; `--sans` for **all
data**. Numerals are **tabular** everywhere data aligns (`font-variant-numeric:tabular-nums`).

| Token | px (desktop) | px (mobile ≤640) | Face | Use |
|---|---|---|---|---|
| `--t-hero` | `clamp(30px,5vw,46px)` | 30–34px | serif | **the single** hero number per screen (Overview headline stat; entity-page title number) |
| `--t-display` | 22–24px | 18–19px | serif | page/section H2, entity name |
| `--t-panel` | 18px | 16px | serif | panel H3 |
| `--t-stat` | 20px | 18–22px | sans | stat-tile value (tabular) |
| `--t-body` | 15px | 15px | sans | body / list-row primary |
| `--t-row` | 13.5px | 14px | sans | dense table/list secondary |
| `--t-meta` | 12px | 11.5px | sans | meta, source line |
| `--t-label` | 11px | 11px | sans | UPPERCASE labels, `.10em` tracking |
| `--t-micro` | 10px | 9.5px | sans | epistemic badge, axis ticks, bottom-nav |

Rule enforced by review: **at most one `--t-hero` per rendered screen.** All other figures use `--t-stat`
or smaller. This is what kills the "giant serif numerals down the page" anti-pattern.

### 1.3 Spacing / radii / density
- Spacing scale: `4 / 8 / 12 / 16 / 22 / 32`. **Section gap ≤12px on mobile** (`--gap` already clamps).
- Tile inner pad: desktop 16–20px; **mobile 10–14px** (matches existing mobile `.stat` rules).
- Inset-grouped lists: **one** rounded container (`--r-2`), internal **1px hairlines** (`--line`), no
  per-row borders/shadows. Row height 44–56px.
- Elevation: surfaces are flat (`--e1` hairline). Only overlays (sheet/drawer/palette/hover-popover) lift.

### 1.4 COLOR-AS-DATA-ENCODING (the contract)
- **Categorical = platform identity.** Marrow `--marrow`, Cerebellum `--cere`, DocTutorials `--core`,
  PrepLadder `--prepl`, eGurukul `--eguru`. Used for: platform chips, heatmap **column headers**, bar fills
  in ranked bars, timeline affiliation nodes, legend swatches. *Never* used to mean magnitude.
- **Sequential = magnitude** (`--seq-0…5`). Used for: heatmap **cells** (MCQ density / coverage), treemap
  tiles, progress fills. Light→dark = low→high. One hue (pine) so it reads as "more/less," not category.
- **Diverging/ordinal = consensus** (`--con-*`). Used **only** in the consensus mark (how many independent
  platforms agree a topic is high-yield). Gold family = agreement strength.
- **Semantic = status** (`--good/--warn/--bad`). Reliability deltas, gaps, "needs review."
- **Epistemic ≠ data color.** Epistemic badges keep their existing label-coded hues (measured=ink,
  proxy=gold, directional=marrow, public-3p=core) and sit *outside* the data-color system so a reader never
  confuses "how we know it" with "how big it is."

---

## 2. COMPONENT INVENTORY (`js/ds.js` → pure functions returning HTML/SVG strings; CSS in `css/components.css`)

Every component is a string-returning function so it drops into the current `el(tag,cls,html)` flow and the
existing `appClick` delegation. Markup + the **mobile vs desktop density behavior** for each:

### 2.1 `statTile({value, label, note, accent, spark, epi, href})`
```html
<button class="tile" data-go="subject:Surgery">
  <span class="tile-spark"><!-- optional inline sparkline SVG --></span>
  <span class="tile-v num">12,481</span>
  <span class="tile-l">MCQs · Surgery</span>
  <span class="tile-n">Marrow + Cere + Doc <span class="epi proxy">proxy</span></span>
</button>
```
- **Desktop:** part of `repeat(auto-fit,minmax(210px,1fr))` grid (existing `.statgrid`). Value `--t-stat` 20px,
  thin accent rule on top (existing `::before`), optional 1-line sparkline.
- **Mobile (≤640):** **2-col grid (3-col ≥414)**, height **84–104px**, value 18–22px **sans** tabular (existing
  mobile `.stat` rules already do this — we keep them). Note truncates to 1 line. **Tile is a `<button>` →
  tappable entity link** (this is the relational hook: an Overview KPI for "Surgery" routes to the Subject page).

### 2.2 `listRow({lead, title, sub, trail, action, href, done})` — the inset-grouped row
```html
<div class="lgroup">                      <!-- one rounded container -->
  <a class="lrow" data-go="faculty:fac-x"> <!-- internal hairline divider via :not(:first) border-top -->
    <span class="lrow-lead dot c"></span>
    <span class="lrow-main"><b>Dr. …</b><em>Surgery · Marrow (current)</em></span>
    <span class="lrow-trail num">4.6 <i class="epi directional">dir</i></span>
  </a>
  …
</div>
```
- **Both layouts:** `.lrow` height **44–56px**, `1px` hairline between rows, single container border/radius.
  `min-height:44px`, hit-area padding so tap target ≥44px even when visual row is 48px.
- **Desktop:** can show `sub` inline (grid `auto 1fr auto`). **Mobile:** title + sub stack tightly (2 lines max),
  trail right-aligned. This **replaces** the per-item floating cards. (Generalizes the existing `.mini-row`,
  `.row.mrow`, `.vrow` into one primitive.)

### 2.3 `epiBadge(tag)` — already exists (app.js L91); re-export from `ds.js` unchanged
Tiny pill, `border:1px solid currentColor`, label-coded color, `cursor:help`, `title=epiDesc(tag)`.
**Contract: every figure that is not raw `measured` count carries one.** 10px, `--t-micro`.

### 2.4 `srcLink(id)` / `platRefChip(ref)` — already exist (app.js L95, L106); re-export
- `srcLine(ids, captured)` renders `Source: §a · §b · captured 2026-06-26` under any curated panel header.
- `platRefChip` renders a platform chip; **extended** so the chip is a **router link** (`data-go="platform:marrow"`)
  when the ref has a real `platformId`, and a muted non-link (`.platlabel.off`) when `platformId:null`
  (PrepLadder/eGurukul reputation-only). This is a core relational affordance.

### 2.5 `segmented(opts, current, name)` — generalize existing `.seg`
Inline-flex pill group; active = filled (platform-tinted variant `.seg.marrow/.cere`). **Mobile:** horizontal
scroll if it overflows (existing rule). One segmented control per toolbar, never stacked.

### 2.6 `bottomSheet` / `openSheet(title,opts,current,onPick)` — already exists (app.js L631)
Mobile sort/filter target. Drag-handle, `max-height:80vh`, `--e3`. Reused for **entity quick-actions** on
mobile (e.g. "Open Subject page / Filter to this platform"). Desktop equivalent = inline controls; sheets are
mobile-only.

### 2.7 `panel({title, epi, sourceIds, captured, body, actions})`
```html
<section class="panel">
  <div class="ph"><h3>Who teaches Surgery best <span class="epi directional">directional</span></h3>
    <div class="ph-actions">…</div></div>
  <div class="srcline">Source: §medicotopics · §quora · captured 2026-06-26</div>
  <div class="panel-body">…</div>
</section>
```
- **Desktop:** 26px pad, can sit in a multi-column `panel-grid`. **Mobile:** 13–14px pad, full-width, stacked
  (existing `.panel` mobile rules). The `epi` + `srcline` are **mandatory params** when body holds curated data —
  the firewall is enforced at the component boundary, not left to each caller.

### 2.8 `chartFrame(title, epi, sourceIds, captured, svgOrHtml, {legend, note})` — **the keystone**
Single wrapper every chart MUST pass through so no chart can ship without its epistemic label + source.
```html
<figure class="cframe">
  <figcaption class="cf-head">
    <span class="cf-title">Subject × platform — MCQ density</span>
    <span class="epi proxy" title="…">proxy</span>
  </figcaption>
  <div class="cf-plot"><svg …></svg></div>
  <div class="cf-legend">…sequential ramp key…</div>
  <div class="srcline">Source: … · captured 2026-06-26</div>
</figure>
```
- **Desktop:** plot uses available width; legend inline-right of title.
- **Mobile:** title row wraps; legend moves **below** plot; plot becomes horizontally **pannable inside the
  figure only** (the figure clips; the *page* never horizontal-scrolls — `overflow-x:auto` on `.cf-plot`, not body).
  A "tap a cell → detail sheet" affordance replaces hover tooltips on touch.

---

## 3. CHART VOCABULARY (`js/ds.js`; CSS in `css/charts.css`)

All charts are **inline SVG strings** (crisp, themeable via `currentColor`/`var()`, no canvas, no deps). Each is
wrapped by `chartFrame` so its epistemic label + source render automatically. Numbers come straight from `D`.

### 3.1 `heatmap(rows, cols, valueFn, {scale})` — Subject × Platform — **the hero relational viz**
- **Binds:** rows = canonical subjects (`subjectsOf` ∪ via `CANON`); cols = the 3 integrated platforms; cell =
  per-subject MCQ density for that platform (sum of `mcqs` → bucketed to `--seq-0…5` by within-row rank, OR by
  absolute share). Empty cell where a platform lacks the subject (`--con-none` hairline). **All `measured` counts;
  the density *bucketing* is `proxy`** → frame epi = `proxy`.
- **SVG approach:** a `<g>` per row; `<rect width=--cell height=--cell rx=3>` per cell filled
  `var(--seq-n)`; cell value text centered, color `--seq-ink-hi/lo` by bucket. Column headers = platform-colored
  labels (categorical). Row label = subject name, **clickable → Subject page** (`data-go`). Cell click → opens a
  detail sheet "Surgery on Marrow: 1,204 MCQs (measured)".
- **Mobile adapt:** `--cell-m` 26px; if 3 cols × N rows overflows, the **figure** scrolls horizontally (not the
  page); subject labels stay sticky-left via a fixed first column. Below ~360px, collapse to **"top-N subjects"**
  rows only with a "show all" control to keep the fold dense.
- **Epi/source:** frame badge `proxy`; `srcline` = "Counts measured from platform captures · captured 26 Jun 2026."

### 3.2 `consensusMark(topicCanon)` — Consensus indicator
- **Binds:** for a canonical topic/subject, how many **independent integrated platforms** flag it high-density
  (`priority>=2` / top `hyScore` tier) via `bestCrossByPlat`/`scoredCross`. 0–3 platforms.
- **Approach:** three small pips (one per platform) in a row; filled with **`--con-*`** by *count of agreement*
  (the more agree, the deeper the gold), each pip outlined in its **platform color** so you can see *which*
  agree. A compact inline `◔◑●` glyph variant exists for list rows. Distinguishes **agreement** (≥2 deep-gold)
  from **lone signal** (1 straw) visually.
- **Mobile:** inline 3-pip cluster fits in a list-row trailing slot (no width change).
- **Epi/source:** label `proxy` (built on the density proxy + cross-match heuristic) — explicitly *not* claimed
  as measured exam consensus. Tooltip spells this out.

### 3.3 `rankedBars(items, valueFn, colorFn)` / `treemap(items)` — Mass / where-to-spend
- **Binds:** MCQ mass by subject (or by platform within a subject). `colorFn` = platform categorical for
  platform breakdowns; `--seq-*` for single-metric magnitude.
- **rankedBars (default, mobile-safe):** horizontal bars, label-left (clickable → entity), value-right tabular,
  sorted desc. Reuses the existing `.bars/.barrow` look but generalized + linkable.
- **treemap (desktop ≥1024 only):** squarified `<rect>` tiles sized by mass, filled `--seq-*`, label if tile big
  enough. **Mobile falls back to rankedBars** (treemaps are unreadable narrow) — same data, different shape.
- **Epi/source:** `measured` for counts; if sorted by density proxy, `proxy`.

### 3.4 `sparkline(series)` / `smallMultiples(seriesByKey)` — Progress over time
- **Binds:** the **test timeline** (`D.tests` GT/CoreBTR scores over dates) and per-subject accuracy
  (`subjectAccuracy()`), and tracking momentum (count of `Store.prog` ticks — local, so `measured` for *your*
  data). NOTE: only draws where a real series exists; a single data point renders as a dot + "1 test" (no fake trend).
- **Approach:** `<polyline>` on a 0–100 band, `--accent` stroke, last-point dot, min/max ticks. `smallMultiples`
  = a grid of tiny sparklines (one per subject) for Progress — small-multiples beat one giant numeral.
- **Mobile:** sparkline fits inside a stat-tile (`--spark-h` 26px) or a list-row trail; small-multiples become a
  2-col grid.
- **Epi/source:** your tracking = `measured` (local). Test scores = `measured` (you entered them).

### 3.5 `facultyTimeline(faculty)` — Career timeline — **the un-buildable-by-incumbents viz**
- **Binds:** `faculty.affiliations[]` = `{platformId|name, role, subjects[], from, to, status}` with
  status ∈ current/past/solo/superspecialty. Renders **only** from seeded sourced data; **gated** empty-state
  if `D.faculty` absent.
- **Approach:** a horizontal (desktop) / vertical (mobile) time axis. Each affiliation = a **segment** colored by
  platform (categorical; solo/superspecialty = `--ink-3`/dashed since no platform). `current` segment is solid +
  capped "now"; `past` is muted; the *movement between platforms* is the story (a teacher who left Marrow → solo
  is exactly what no platform shows). Each node links to the **Platform page**. Reuses existing `.timeline` look,
  extended to a true axis.
- **Mobile:** vertical timeline (existing `.timeline` pattern), node = platform-colored, date + role + subjects.
- **Epi/source:** every segment carries `directional` (seed) + per-affiliation `sourceIds` → `srcline`.

### 3.6 `ratingScorecard(apps | faculty.ratings)` — Rating scorecard
- **Two uses, same component:**
  (a) **Platform reliability** — `D.reliability.apps[]`: rating (e.g. 4.7), `ratingsLabel` (~33k), recurring
      `themes[]` as chips. Bar length = rating/5 on `--seq-*` or semantic. **`public-3p`**, dated, sourced
      (`sourceId` per row). Includes PrepLadder/eGurukul (platformId:null → muted, non-link name).
  (b) **Faculty ratings** — `ratings.profile` (votes, gated `verifiedVia:"in-app-activity"`) +
      `ratings.videoByPlatform[]` (rolled-up). Seed = **`directional`**; shows count `n`; **aggregate-only**,
      **never** a "worst faculty" board (we render strengths/fit per subject, not a ranked shaming list).
- **Approach:** rows of `label | bar | value | epi`. Star value tabular. Themes = small `.tag` chips.
- **Mobile:** stacks to label-row → bar-row → themes-row inside one inset group; rating value stays right-aligned.
- **Epi/source:** mandatory per-row `epi` + `srcLink`; "How we rate" link in panel header.

---

## 4. ENTITY-PAGE IA (`js/entities/{subject,platform,faculty}.js`)

Three new `<section>`s in index.html: `#view-subject`, `#view-platform`, `#view-faculty`. `main.js` routes
`goSubject(canon)/goPlatform(id)/goFaculty(id)` (via `data-go="subject:…|platform:…|faculty:…"` delegated in
`appClick`), pushes a hash (`#/subject/Surgery`) for back-button, and renders into the section. A slim **entity
header** (back chevron + breadcrumb + entity title + the one hero number) tops each. **Cross-links are everywhere:**
a Subject page links to its Platforms and Faculty; a Platform page links to its Subjects and Faculty; a Faculty
page links to Platforms and Subjects. That triangle *is* the IMDB graph.

### 4.1 SUBJECT page — `renderSubjectPage(canon)`
**Desktop (≥1024, multi-panel, uses width):**
```
┌ ‹ back · SUBJECTS / Surgery ────────────────────────────────────────────────┐
│  Surgery                                          [hero number: 14,062 MCQs]  │  ← one --t-hero
│  measured across Marrow · Cere · Doc   [open in QBank]   epi: measured        │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ COVERAGE × YIELD (heatmap row)│ CONSENSUS HIGH-YIELD TOPICS                    │
│  1-row heatmap: this subject  │  list of topics where ≥2 platforms agree,      │
│  across 3 platforms, cells =  │  each row: topic · consensusMark · density     │
│  density (seq ramp) [proxy]   │  [proxy] · sourced. Click topic → drawer.      │
├──────────────────────────────┴───────────────────────────────────────────────┤
│ WHO TEACHES IT BEST           │ VIDEOS (CoreBTR etc.)    │ YOUR PROGRESS        │
│  best-platform (subjectStrength│  videosForLeaf / subject │  bigMeter + sparkline│
│  directional, sourced) +       │  rows, link → Faculty     │  attempted/reviewed  │
│  faculty roster rows (gated)   │  /Platform                │  [measured, local]   │
│  → Faculty pages               │                           │                      │
└────────────────────────────────────────────────────────────────────────────────┘
```
Panels laid out with a `panel-grid` (`grid-template-columns:1.1fr .9fr` then a 3-col band). Uses the width via
multi-panel, not stretched cards.

**Mobile (density):**
- Entity header (compact, hero number 30–34px, "open in QBank" icon-button).
- **Stat-tile strip** (2-col): MCQs (measured) · density rank (proxy) · best platform (directional) · your %
  (measured) · #faculty · #videos → **6 tiles above fold.**
- One sticky toolbar row (segmented: Coverage / Consensus / Teachers / Videos / You) → swaps the panel below
  (single-panel-at-a-time, density preserved).
- Each panel = inset-grouped rows. Heatmap collapses to its single subject row (3 cells) inside a `chartFrame`.

### 4.2 PLATFORM page — `renderPlatformPage(id)`
**Desktop:**
```
┌ ‹ back · PLATFORMS / Marrow ─────────────────────────────────────────────────┐
│  Marrow   [hero: 4.7★ ~33k]  epi: public-3p · captured 26 Jun 2026  [How we rate]│
├───────────────────────────────┬───────────────────────────────────────────────┤
│ RELIABILITY SCORECARD          │ COVERAGE BY SUBJECT                            │
│  ratingScorecard row +         │  rankedBars of MCQ mass by subject (measured), │
│  recurring themes chips        │  bars → Subject pages; or 1-col heatmap of this│
│  [public-3p, sourced]          │  platform vs others (seq ramp)                 │
├───────────────────────────────┴───────────────────────────────────────────────┤
│ FACULTY ROSTER (gated)         │ YOUR TRACKING ON THIS PLATFORM                │
│  faculty whose affiliations    │  rollup of your ticks for this platform        │
│  include this platform → pages │  (attempted/reviewed) [measured, local]        │
└────────────────────────────────────────────────────────────────────────────────┘
```
**Mobile:** header with hero 4.7★; 2-col tile strip (rating · ratings count · #subjects · #faculty · your
attempted · your reviewed → 6 tiles); segmented (Reliability / Coverage / Faculty / You); panels = rows.
Reliability themes render as wrapped `.tag` chips. **Subject mass = rankedBars** (treemap is desktop-only).

### 4.3 FACULTY page — `renderFacultyPage(id)`
**Desktop:**
```
┌ ‹ back · FACULTY / Dr. … ────────────────────────────────────────────────────┐
│  Dr. …    aka "…"        [hero: 4.6 community ★]  epi: directional · seed       │
│  Subjects: Surgery · Surgical Onco   bio (sourced)                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ CAREER TIMELINE  (facultyTimeline — horizontal axis)                            │
│  Marrow(current) ──── PrepLadder(past) ──── Solo brand(superspecialty)          │
│  each segment platform-colored, → Platform page; [directional, sourced per seg]  │
├───────────────────────────────┬───────────────────────────────────────────────┤
│ TWO RATINGS (directional)      │ SUBJECTS TAUGHT  +  LINKED PLATFORMS           │
│  profile votes (gated badge:   │  subject chips → Subject pages;               │
│  verifiedVia in-app-activity)  │  platform chips → Platform pages              │
│  + rolled-up video rating       │  videos by this faculty (if facultyId on D.videos)│
│  ratingScorecard [directional]  │                                              │
└────────────────────────────────────────────────────────────────────────────────┘
```
**Mobile:** header (hero community rating 30–34px, "directional · seed" badge prominent); tile strip
(#platforms · #subjects · years active · profile ★ · video ★ · #videos → 6 tiles); **vertical** timeline;
ratings as stacked scorecard; subject/platform chips wrap. **Empty/seed state** if `D.faculty` is unpopulated:
an honest panel "Faculty profiles are being seeded (directional, sourced). N profiles live." — never fabricated.

---

## 5. TAB RE-SKIN (7 tabs adopt the system; where a relational viz earns its place; navigation into entities)

All tabs keep their function and `Store` seam; they re-skin to the `ds.js` primitives and gain **entity links**.

1. **Overview** — *The atlas home.* Top: **6+ stat-tiles** (KPIs as tappable entity links). **Earns a viz:**
   the **subject×platform heatmap** (the cross-platform thesis at a glance, `proxy`) + a **consensus
   high-yield** mini-list + the **reliability scorecard** strip (`public-3p`). "Do next" callout links to the
   weakest subject's Subject page. Every subject/platform name → entity page.
2. **QBank Tracker** — keep the sidebar + dense leaf rows (already strong). Re-skin rows to `listRow`. **Earns a
   viz:** the subject hero gets a **3-cell heatmap** (this subject across platforms) + `consensusMark` per leaf
   (already partly there via `coverageBadge`/`bestCrossByPlat`). Subject name in hero → Subject page; cross-cov
   badge → the other Platform/Subject.
3. **Progress** — replace giant numerals with **sparklines / small-multiples** per subject (test-score series +
   accuracy). Rows → Subject pages. **Earns a viz:** small-multiples grid.
4. **Tests & Scores** — keep the entry table; add a **score sparkline** (timeline of GTs). Subject accuracy rows
   → Subject pages. Test rows stay editable (`Store`).
5. **High-Yield** — reframe explicitly as **proxy density** + **consensus**. **Earns a viz:** rankedBars of
   density by subject with `consensusMark`, sorted; the strongest relational "where do platforms agree" surface
   after Overview. Names → Subject pages. Every figure badged `proxy`.
6. **Videos** — `listRow` rows; **add faculty link** (when `D.videos[].facultyId` seeded) → Faculty page; the
   "related QBank modules" suggestion (existing `videoSuggestions`) → Subject/leaf. Rolled-up video rating feeds
   the Faculty page.
7. **Study Planner** — tiers re-skinned to inset groups; **earns a viz:** rankedBars of "mass remaining" by
   subject (what to spend on), each → Subject page. The plan is literally a relational read of where you're weak.

**Navigation model:** desktop top-tabs + new entity routing; mobile bottom-nav (6) + entity pages pushed as
full views with a back chevron. `⌘K` palette already indexes subjects/tests/modules → extend to index
**platforms + faculty** as `goto` rows (one-line addition to the palette index). Click a subject anywhere →
Subject page; a platform chip → Platform page; a faculty name → Faculty page. **This ubiquity of cross-links is
the direction's signature.**

---

## 6. TWO-LAYOUTS RULE (one system; desktop "uses the width," mobile "hits density")

**One design system, two layouts, driven by the *existing* split the codebase already uses** (verified in
styles.css): **viewport media queries drive app chrome** (header, bottom-nav, sheets, sticky sidebars) and
**container queries drive in-panel reflow** (`.view{container-type:inline-size}`).

- **Breakpoints:** `≤640px` = mobile (bottom-nav, sheets, compact header, 2/3-col tiles, single-panel entity
  pages); `641–1023px` = tablet (inline controls return, 2-col panel grids, drawer not sheet); `≥1024px` =
  desktop (multi-panel entity pages, **treemap** unlocked, heatmap full width, side-by-side panels); `≥1480px`
  capped by `--container`.
- **"Use the width" (desktop):** entity pages and Overview switch to `panel-grid`
  (`grid-template-columns: 1.1fr .9fr` / 3-col bands); charts expand (heatmap cell `--cell` 34px; treemap on).
  Container queries let a panel reflow its inner grid based on *its own* width, so a narrow panel in a wide page
  still behaves — true responsive, not viewport-only.
- **"Hit density" (mobile):** the SAME components shrink via the mobile token layer — tiles 84–104px 2/3-col,
  rows 44–56px inset-grouped, ONE sticky toolbar (slim search + icon-buttons → bottom-sheet + segmented +
  pill), charts collapse (heatmap → top-N pannable strip; treemap → rankedBars; timeline → vertical). The hero
  number drops to 30–34px and there is exactly one per screen.
- **Single source of truth:** components don't fork — they read the same tokens; only token *values* and a few
  `grid-template-columns` swap per breakpoint. No duplicate markup paths.
- **No horizontal scroll 320–1920:** only `.cf-plot` (chart figures) and overflowing segmented controls scroll
  *internally*; `body`/`main` never do. Verified pattern already in styles.css (`.tbl-scroll`, sheet, etc.).

---

## 7. HOW IT PASSES EACH MEASURABLE BAR (with numbers)

**A) MOBILE DENSITY (375×812):**
- **≥6 KPI tiles above fold (Overview):** stat-tile grid is 2-col (3-col ≥414); 6 tiles at 84–104px ≈ 3 rows ≈
  300–360px, leaving the heatmap/consensus section start visible. ✅ (extends existing `.statgrid` mobile rules.)
- **Tile height ~84–104px, NOT ~230:** enforced by `min-height:84px` + compact mobile `.tile` rules (existing
  `.stat` mobile block already sets this). ✅
- **Lists are ROWS 44–56px, hairline dividers, one inset-grouped container:** `listRow`/`.lgroup` primitive; one
  `border+radius` on the group, `1px` internal hairlines, `min-height:44–56px`. No floating per-item cards. ✅
- **ONE sticky toolbar row:** slim search + sort/filter **icon-buttons → bottom-sheet** + platform **segmented**
  + hi-yield **pill** (existing `.qb-controls` mobile pattern reused for entity pages). ✅
- **At most ONE hero serif number per screen:** enforced by the `--t-hero` rule (entity header / Overview
  headline only); all other figures `--t-stat` 18–22px tabular sans, labels 11–12px uppercase. ✅
- **Tap targets ≥44px:** tiles are buttons; rows `min-height:44`; chips 44×44 on mobile (existing); icon-buttons
  44×44 (existing `.iconbtn`). ✅
- **QBank fold:** toolbar + ≥4 category/leaf rows — preserved from current dense QBank. ✅

**B) DATA/VIZ SUBSTANCE:**
- **Judgment not inventory:** Overview/HY/Subject lead with consensus high-yield, best-platform/faculty, do-next,
  neutral reliability — not raw counts. ✅
- **≥1 TRUE relational viz per relevant surface:** Overview (heatmap + consensus + scorecard), Subject (heatmap
  row + consensus + who-teaches-best), Platform (scorecard + coverage bars/heatmap), Faculty (career timeline +
  ratings), HY (rankedBars+consensus), Progress (small-multiples). ✅
- **Color encodes data:** sequential=density/yield, categorical=platform, diverging-gold=consensus, never
  decorative neon. ✅
- **Every figure carries epistemic label + source + date:** enforced at the `chartFrame`/`panel` component
  boundary (mandatory `epi`+`sourceIds` params); `srcLine` renders source+captured; `epiBadge` on every
  non-raw-measured figure; `proxy` honesty on all `hyScore`/density. ✅
- **NEUTRALITY FIREWALL:** never fabricate (faculty gated to seed/empty-state; all curated figures trace to
  `D.sources` via `SRC_BY_ID`); money never moves score (firewall text on How-we-rate); aggregate-only, **no
  "worst faculty" board**; `build_data.py` source-integrity guard kept intact (we only *add* a faculty doc + its
  `_collect_refs` hook so faculty `sourceIds` are validated too). ✅
- **How-we-rate reachable:** `renderMethodology` surface + a link in every curated panel header. ✅

**C) FACULTY LAYER:**
- `D.faculty[]` schema per FACULTY_LAYER.md (career timeline current→past→solo→superspecialty + two ratings,
  both `directional` seed; `verifiedVia:"in-app-activity"` designed, enforced post-backend). Seed via
  `_raw/curated/faculty.json` + `build_data.py` (validated by the integrity guard). Faculty page (timeline +
  ratings + subjects + linked platforms), gated empty-state when unpopulated. Aggregate-only, sourced. ✅

**HARD CONSTRAINTS:** Vanilla (string-returning fns on global scope, no modules/bundler/deps); local-first
(`Store` seam untouched, no network); almanac identity retained (paper/ink/pine/gold extended, never neon);
TOTAL 56,091 preserved (we read counts, never recompute); console clean; no horizontal scroll 320–1920 (only
internal `.cf-plot`/segmented scroll). `node --check` passes on every new `js/*.js` before finishing.

---

## 8. Build order (incremental, each step ships green)
1. `css/tokens.css` + `css/components.css` + `css/charts.css` (additions only; old styles.css coexists, then retire).
2. `js/core.js` — move existing helpers + add faculty helpers (gracefully empty when `D.faculty` absent).
3. `js/ds.js` — components + chart library (heatmap/consensus/rankedBars/sparkline/timeline/scorecard + chartFrame).
4. Re-skin tabs to primitives (surfaces/*.js) — visual swap, same data/Store.
5. `js/entities/*.js` + `#view-*` sections + `main.js` routing (`data-go`, hash, palette index for platform/faculty).
6. `_raw/curated/faculty.json` seed (10–20, sourced, directional) + `build_data.py` hook + guard extension; run
   `python3 build_data.py` (must still print combined 42889 / Doc 13202 / all refs resolve).
7. Verify at 375×812 + 1024 + 1920; `node --check`; console clean.
