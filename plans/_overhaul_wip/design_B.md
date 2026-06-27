# DESIGN DIRECTION B — "THE INSTRUMENT"
### Meridian Experience Overhaul · Clinical Data-Instrument angle

> **One line:** Treat Meridian like a Bloomberg/Kite terminal for exam prep — a warm-paper
> *instrument panel* where every pixel carries calibrated information, charts are exact (gridlines,
> ticks, small-multiples), and nothing is decorative — but the surface is still the almanac, printed
> on paper, never a glowing dashboard.

This is **HYBRID ambition**: the 7 tracking tabs stay the home; we ADD first-class
`Subject` / `Platform` / `Faculty` entity pages. ONE design system, TWO layouts (desktop uses width
via multi-panel instrument grids; mobile hits density via tile-grids + inset rows). All vanilla
HTML/SVG strings, global scope, no bundler, no ES modules. The data model (`window.D`) is consumed
exactly as it exists today — `subjectStrength.subjects[]`, `reliability.apps[]`, `methodology.labels[]`,
`sources[]`, plus the new (still-to-seed) `D.faculty[]` per `FACULTY_LAYER.md`.

The governing metaphor: a **printed instrument**. Think the dial face of a marine chronometer or a
mid-century lab oscilloscope manual — engraved, exact, calm, monochrome with one or two ink accents.
That is how we get terminal density *without* going neon or cold.

---

## 0. CORE IDEA — what makes "Instrument" distinct from the other directions

1. **Tabular-first.** Wherever a thing has >2 numbers, it is a *table or a small-multiple grid*, not a
   card. Numbers are always tabular-aligned, right-set, monospaced-feel via `font-feature-settings:"tnum"`.
2. **Gridded charts, not blobby ones.** Every chart has faint baseline gridlines + axis ticks +
   value labels at the data points (like a Kite candlestick chart or an Oura sleep-stage strip), so it
   reads as a *measurement*, not an illustration.
3. **Maximum information density per row.** A single subject row simultaneously shows: name, consensus
   mark, per-platform coverage sparkbar, your-progress micro-ring, and best-platform chip — five facts,
   one 48px row. This is the "at a glance" promise.
4. **The instrument frame.** A reusable `chart-frame` chrome (title · epistemic tag · source · date ·
   tiny legend) wraps every visualization so the neutrality firewall is *structural*, not bolted on.
5. **Warm, engraved, never neon.** Color is used sparingly and always as data encoding. The default
   ink for chart strokes is `--ink-2`; saturated platform hues appear only where they identify a
   platform; the yield ramp is a warm sequential pine→gold scale, never a rainbow, never a glow.

---

## 1. VISUAL LANGUAGE

### 1.1 Token additions (extend, do not replace `:root` in styles.css → future `css/tokens.css`)

Keep every existing token. ADD:

```css
:root{
  /* --- instrument neutrals: faint gridlines + engraved hairlines --- */
  --grid:        #ece6d8;      /* chart gridlines — one notch lighter than --line */
  --grid-2:      #ded4c0;      /* axis baseline / zero-line — slightly darker */
  --tick:        #b3ab9c;      /* axis tick labels = existing --ink-4 weight */
  --ink-num:     #1a1814;      /* near-black for hero tabular numerals (crisper than --ink) */

  /* --- SEQUENTIAL YIELD/DENSITY RAMP (warm, pine→gold, 5 stops) --- */
  /* used for heatmap cells, treemap fill, density encoding. NEVER for platform identity. */
  --y0:#f0ece2;  /* ~empty   (= --paper-3) */
  --y1:#dfe4d8;  /* low      */
  --y2:#c3d0b6;  /* mid-low  */
  --y3:#9bb583;  /* mid      */
  --y4:#5d7a52;  /* high     (= --core) */
  --y5:#3f5a37;  /* top      (deep pine) */
  /* evening variants below */

  /* --- categorical PLATFORM palette (identity only) --- */
  --p-marrow:#3a5a78;  --p-cere:#b0613b;  --p-doc:#5d7a52;
  --p-prepl:#6a5a86;   --p-eguru:#a9832f;        /* not-yet-integrated; rendered muted */
  /* (re-uses existing --marrow/--cere/--core; --prepl/--eguru are new, mapped to --rt/--gold hues) */

  /* --- semantic status (consensus / agreement / reliability) --- */
  --agree:#1f4a3f;     /* ≥2 platforms agree high-yield = accent pine */
  --solo:#a9832f;      /* only 1 platform flags it = gold (caution: single-source) */
  --warn:#9a3b34;      /* reliability complaint theme = oxblood (used as small dot only) */

  /* --- instrument type scale (tabular sans + serif display) --- */
  --t-hero:    clamp(30px,7vw,46px);  /* THE one serif hero number per screen */
  --t-fig-xl:  22px;   /* primary tabular figure (desktop tile / table key cell) */
  --t-fig:     18px;   /* standard tabular figure */
  --t-fig-sm:  15px;   /* dense table cell */
  --t-body:    13.5px;
  --t-label:   11px;   /* uppercase micro-label, tracking .08–.13em */
  --t-tick:    10px;   /* axis ticks / chart value labels */

  /* --- instrument spacing/radii (tighter than current) --- */
  --r-tile:    10px;   /* tiles + inset list container (was 14) */
  --r-chip:    6px;
  --pad-tile:  12px;   /* tile inner pad (mobile) / 14px desktop */
  --row-h:     48px;   /* canonical list row height (44–56 band) */
  --frame-pad: clamp(14px,2vw,20px);
  --elev-1:    0 1px 0 var(--line);                    /* engraved seam, not a drop shadow */
  --elev-pop:  0 18px 46px rgba(20,17,14,.18);         /* sheets/drawer only */
}
body.evening{
  --grid:#2a2620; --grid-2:#3a342c; --tick:#5c544a; --ink-num:#f3ead8;
  --y0:#241f1b; --y1:#2c352b; --y2:#3a4a36; --y3:#566b48; --y4:#7f9b6b; --y5:#9fba84;
  --p-marrow:#7da6cf; --p-cere:#d99368; --p-doc:#8fb37f; --p-prepl:#a892c2; --p-eguru:#cda64e;
  --agree:#5e9b86; --solo:#cda64e; --warn:#d77a72;
}
```

**Rationale for the warm sequential ramp:** the rubric says *sequential = yield, categorical = platform,
never neon*. A pine→gold ramp reads as "intensity of importance" while staying inside the almanac's
clinical-pine + antique-gold identity. Cells never use pure saturated blue/red/green and never glow.

### 1.2 Type scale in practice

- **Exactly one** `--t-hero` serif number per screen (Overview: the 56,091 combined MCQs; Subject page:
  the subject's total MCQ mass; Platform page: the reliability star). Everything else is **tabular sans**
  at `--t-fig*`. This satisfies "at most ONE hero serif number per screen."
- Serif (`--serif`) is reserved for: the hero number, page/section titles (`h2.section`, entity page
  H1s), and chart-frame titles. All data values, axis ticks, table cells = `--sans` + `tnum`.
- Labels are `--t-label` uppercase `letter-spacing:.1em` `color:var(--ink-3)`. Tick labels are
  `--t-tick` `color:var(--tick)`.

### 1.3 Spacing / radii / elevation

- **Elevation is engraving, not float.** Tiles and inset lists sit on `--paper-2` with a 1px `--line`
  border and *no* drop shadow (`--elev-1` is a single hairline). Only the bottom-sheet, drawer, command
  palette, and toast use a real shadow (`--elev-pop`). This kills the "floating card-on-card" anti-pattern.
- Section gap mobile ≤12px; desktop panel gap `--gap` (existing clamp 14–24px).
- Radii tighten to `--r-tile:10px` for the instrument feel (engraved plates, not pillows).

### 1.4 COLOR-AS-DATA-ENCODING (the rules, enforced in `css/charts.css`)

| Encoding | Scale | Where |
|---|---|---|
| **Yield / MCQ-density / coverage intensity** | sequential `--y0..--y5` | heatmap cells, treemap fill, density sparkbars |
| **Platform identity** | categorical `--p-marrow/-cere/-doc/-prepl/-eguru` | platform bars, chips, sparkline strokes, roster |
| **Consensus / agreement** | semantic `--agree` (≥2) vs `--solo` (1) | consensus mark, best-for-subject |
| **Reliability complaint** | `--warn` as a 6px dot only (never fills a bar — we don't shame) | scorecard theme tags |
| **Your progress** | `--marrow` attempted, `--core` reviewed, `--rt` retaken (UNCHANGED from today) | rings, meters, dots |

Hard rule encoded as a CSS comment + a `js/ds.js` helper `yieldFill(t /*0..1*/)` returning the right
`--yN` var so no surface invents a color.

---

## 2. COMPONENT INVENTORY (`js/ds.js` — pure functions returning HTML/SVG strings)

All components are **one function each**, returning a string. Surfaces compose them. Markup uses the
existing class hooks where they exist; new hooks live in `css/components.css` / `css/charts.css`.

### 2.1 `statTile(opts)` — the KPI plate
```
statTile({key:"56,091", label:"COMBINED MCQS", sub:"3 banks · 2,073 topics",
          epi:"measured", accent:"g", spark:[…]/*optional micro-sparkline*/})
```
Markup:
```html
<div class="tile a-g">
  <div class="tile-key num">56,091</div>          <!-- --t-fig-xl tabular -->
  <div class="tile-lbl">COMBINED MCQS</div>
  <div class="tile-sub">3 banks · 2,073 topics</div>
  <svg class="tile-spark">…</svg>                  <!-- optional 1-line sparkline -->
  <span class="epi measured" …>measured</span>     <!-- corner epistemic dot/badge -->
</div>
```
- **Mobile (≤640):** `grid-template-columns:repeat(2,1fr)` (3 at ≥414); tile height 84–104px;
  `--t-fig-xl` key, 11px label, optional 14px sparkline strip at bottom. Reuses the existing `.stat`
  mobile rules (already compact) but renamed `.tile` with the spark slot. Epistemic badge collapses to a
  4px colored corner dot with the label in `title=` to save height; tap/long-press shows the sheet.
- **Desktop:** `repeat(auto-fit,minmax(170px,1fr))`; key at `--t-fig-xl`, full epistemic badge visible,
  sparkline shown inline. The leading accent bar (existing `.stat::before`) stays as the engraved tick.

### 2.2 `listRow(opts)` — the inset-grouped row (THE workhorse)
```
listRow({lead:dot|rank|hy, title, meta, trail:value|chips|ring, href:goSubject(...)})
```
Rendered inside a single `.inset` container (one rounded box, internal `1px var(--line)` dividers):
```html
<div class="inset">
  <button class="lrow" data-...>
    <span class="lrow-lead">…</span>      <!-- dot / rank-num / ★★★ -->
    <span class="lrow-main">
      <span class="lrow-title">Acid–Base</span>
      <span class="lrow-meta">Physiology · 412 MCQs</span>
    </span>
    <span class="lrow-trail">…</span>     <!-- tabular value, ring, or chips -->
  </button>
  …more rows, hairline between…
</div>
```
- **Height 48px** (`--row-h`), inside the 44–56 band; hit area ≥44px. One rounded container, internal
  hairlines — the iOS inset-grouped feel, NOT N floating cards.
- **Mobile:** title on top, meta one line below (ellipsis), trail right-aligned. Tap = navigate / open
  drawer. This replaces today's `.mini-row`, `.row.mrow`, `.vrow`, `.cat-head` with one primitive.
- **Desktop:** can render the trail as a multi-cell strip (e.g. consensus mark + sparkbar + ring +
  best-chip) — the *density-per-row* idea. Same container, wider trail.

### 2.3 `epiBadge(tag)` — epistemic label (EXTEND existing, already in app.js line 91)
Keep current `.epi.measured/.proxy/.directional/.public-3p`. ADD a `epiDot(tag)` micro-variant (6px
colored square + `title`/`aria-label`) for dense rows and tile corners where the full pill won't fit.
Both link the same `EPI_DEF` definition; tapping either opens the "How we rate" sheet anchored to that tag.

### 2.4 `srcLink(id)` / `platRefChip(ref)` — source + platform-ref (EXISTING — keep, line 95/106)
Already implemented and correct. The instrument frame (2.8) calls `srcLine(ids, captured)` so every
chart shows `Source: § … · captured DATE`. No change except they now live in `js/core.js`.

### 2.5 `segmented(opts)` — segmented control (EXTEND `.seg`)
Existing `.seg` is good. Density behavior:
- **Desktop:** inline, full labels.
- **Mobile:** horizontal-scroll (already done at line 601), and when used as a *toolbar* filter it can
  collapse to an **icon-button → bottom-sheet** (the `openSheet` path already exists). Platform filter
  stays a visible segmented strip (categorical color on the `.on` segment).

### 2.6 `bottomSheet` / `openSheet(title, opts, current, onPick)` — EXISTING (line 631), keep.
Used for: sort, status filter, epistemic-definition popover, and the mobile chart "expand to full
detail" (e.g. tap a heatmap cell → sheet with the exact numbers + source). No new code, new callers.

### 2.7 `panel(title, epi, srcIds, captured, bodyHTML)` — the section container
Wraps `.panel` (existing) but standardizes the header into: serif title · `epiBadge` · `srcLine`. This
guarantees substance surfaces always carry label+source. Mobile pad 13–14px (existing rule).

### 2.8 `chartFrame(title, epi, srcIds, captured, legendHTML, svgOrHTML)` — THE INSTRUMENT FRAME ★
The signature component of this direction. Every visualization is wrapped:
```html
<figure class="cframe">
  <figcaption class="cframe-head">
    <span class="cframe-title">Subject × platform — MCQ density</span>
    <span class="epi proxy">proxy</span>
    <div class="cframe-legend">…color ramp key / categorical swatches…</div>
  </figcaption>
  <div class="cframe-plot">…SVG…</div>
  <div class="srcline">Source: § App Store … · captured 2026-06-26</div>
</figure>
```
- The frame draws a faint 1px `--line` top+bottom rule (engraved plate). Legend explains the color
  encoding (ramp gradient bar for sequential; swatch row for categorical).
- **Mobile:** title + epi on row 1, legend wraps to row 2 (small), plot scrolls *internally* if it must
  (never the page — no horizontal page scroll), srcline at bottom. Tap a data point → bottom-sheet detail.
- This is where the neutrality firewall becomes structural: you literally cannot render a chart without
  passing it an epistemic tag + source ids.

---

## 3. CHART VOCABULARY (`css/charts.css` + `js/ds.js`; SVG strings, no libs)

All charts: a viewBox with explicit gridlines, axis ticks, value labels — the "exact instrument" look.
Color follows §1.4. All wrapped in `chartFrame`.

### 3.1 Subject × Platform **HEATMAP** (the cross-platform thesis, made visual)
- **Binds:** for each canonical subject (rows) × each integrated qbank (cols) → MCQ count
  (`freshSubjects(p)` → `s._mcqs`), normalized within-subject to a 0..1 *density* and mapped to
  `--y0..--y5`. Not-yet-integrated platforms (PrepLadder/eGurukul → `platformId:null`) render as a
  hatched/empty column labeled "not integrated" so the seam is honest.
- **SVG approach:** a `<g>` per row; `<rect>` cells `w≈42 h≈26`, `fill:var(--yN)`, `1px var(--paper)`
  gridline gaps (engraved grid). Column headers = platform initials in categorical color. Row labels =
  subject names (clickable → `goSubject`). Each cell shows the count in `--t-tick` when wide enough; on
  hover/tap → tooltip/sheet with exact count + epistemic tag (`measured`).
- **Epi/source:** frame tag = `measured` (raw counts) for the *coverage* heatmap; a toggle switches to
  the `proxy` density view (hyScore share) — clearly re-labeled, never called yield.
- **Mobile adapt:** rows stay full-width; columns shrink to ~3 integrated banks (fits ~3×fit in 343px);
  cell becomes a square 30px; subject label truncates with ellipsis; tap a row → Subject page. If a 4th+
  column would overflow, the not-integrated columns collapse into a single "+2 reputation-only" marker
  that opens the strength matrix. NO horizontal page scroll — the grid is sized to the column count.

### 3.2 **CONSENSUS** indicator (where ≥2 platforms agree a topic is high-yield)
- **Binds:** per subject, count how many integrated platforms rate its priority-3 (top-density) share
  above threshold, AND cross-reference `subjectStrength.subjects[].strong[]` (directional). A subject is
  `agree` if ≥2 independent signals concur, `solo` if 1.
- **Approach (HTML, not SVG):** a compact "consensus mark" = a row of N small squares (one per platform),
  filled `--y4` where that platform flags high-density, plus a leading status glyph: `●●` filled =
  `--agree`, `●○` = `--solo`. A legend explains "filled = platform concurs."
- **Epi/source:** density part = `proxy`; reputation part = `directional`; both badges shown; source =
  `subjectStrength.sourceIds`. The frame explicitly states "agreement of independent signals, not
  Meridian's verdict" (firewall language reused from `subjectStrength.framing`).
- **Mobile adapt:** the mark is already tiny (≤80px wide); sits in the trailing slot of a subject
  `listRow`. Tap → sheet explaining which signals agreed + sources.

### 3.3 **TREEMAP / RANKED-BARS** (where the mass is / where to spend)
- **Binds:** MCQ mass per subject (`subTotal(s)` across qbanks, `measured`).
- **Approach:** *Desktop* = squarified treemap (SVG `<rect>`s sized by mass, filled by within-set
  density rank from `--y1..--y5`, label + count inside when the tile is large enough). *Mobile* = the
  same data as **ranked horizontal bars** (treemaps are unreadable narrow): one `listRow` per subject,
  trailing a density-filled bar whose width = mass share, value label at the end, sorted desc. This is
  the "treemap on desktop, ranked-bars on mobile" adaptation the rubric names.
- **Epi/source:** `measured`; counts we hold. Click subject → Subject page.

### 3.4 **SPARKLINE / SMALL-MULTIPLES** (progress, not giant numerals)
- **Binds:** your tracking. Per subject: attempted/total over its categories → a small-multiple grid of
  mini progress bars; per the whole exam: a sparkline of cumulative attempted topics by recency
  (`Store.state.progress[].ts`). Tests page: a sparkline of accuracy across your scored tests.
- **Approach:** SVG `<polyline>` stroke `--ink-2` 1.5px on a faint `--grid` baseline with min/max dots;
  small-multiples = a CSS grid of 60×24 mini-bars, each a subject, fill `--marrow`/`--core` for
  attempted/reviewed. Tabular value beside each. This replaces "giant single numerals" with relational
  micro-charts (the rubric's explicit ask for Progress).
- **Epi/source:** `measured` (your own ticks); no external source needed but tag still shown for
  consistency ("your tracking, this device").
- **Mobile adapt:** small-multiples become a 2-col grid of 44px rows (subject + mini-bar + %); the
  exam-level sparkline spans full width at 40px tall.

### 3.5 **FACULTY CAREER TIMELINE** (the moat, made visual)
- **Binds:** `D.faculty[].affiliations[]` = `{platformId, name, role, subjects, from, to, status}` with
  `status ∈ current|past|solo|superspecialty`.
- **Approach (SVG horizontal timeline):** a single time axis (min `from` → today) with year ticks. Each
  affiliation = a horizontal segment positioned by `from..to`, colored by platform (categorical
  `--p-*`), with a glyph at the start: ◆ current, ● past, ★ solo, ✦ superspecialty. Open-ended (`to:null`)
  segments get an arrowhead → today. Hovering a segment → role + subjects + source. The visual *story* is
  exactly the moat: "taught Surgery at PrepLadder 2014–18 → moved to Marrow 2018 → went solo 2024," which
  no incumbent can show.
- **Epi/source:** `directional`; `faculty[].sourceIds` → `srcLine`. Frame states "career history compiled
  from public sources; community-sentiment, not endorsement."
- **Mobile adapt:** rotate to a **vertical** timeline (reuse existing `.timeline`/`.tl` CSS at
  styles.css:198) — dated nodes top→bottom, platform-colored node, status glyph, role + subjects. This is
  already an idiom in the codebase; we just feed it faculty data.

### 3.6 **RATING SCORECARD** (reliability — public-3p; faculty ratings — directional)
- **Binds (reliability):** `D.reliability.apps[]` = `{name, platformId, rating, ratingApprox,
  ratingsLabel, themes[], sourceId}`. **Binds (faculty):** `faculty[].ratings.profile` +
  `ratings.videoByPlatform[]`.
- **Approach:** a table-instrument. Each app/faculty = a row: name (platform color), a **5-pip star
  meter** drawn in SVG (filled pips = rating, `--gold`), the numeric rating (`tnum`, with `~` prefix when
  `ratingApprox`), the ratings-count label, and the complaint themes as small muted tags each prefixed by
  a 6px `--warn` dot. Rows are sortable. NO "worst" ranking, NO bar that visually shames — the star meter
  is neutral and the themes are factual tags. For faculty: two separate meters (profile votes / rolled-up
  video) each carrying `directional` + `verifiedVia` note ("seed — community voting after backend").
- **Epi/source:** reliability = `public-3p` + date + `sourceId`; faculty = `directional`. Both via frame.
- **Mobile adapt:** the existing responsive-table→card pattern (`table.resp`, styles.css:699) turns each
  row into a labeled card; star meter + numeric stay on row 1; themes wrap below. Reuses proven CSS.

> Every chart function signature ends in `(…, epi, srcIds, captured)` so it is *impossible* to render one
> without its epistemic label + source — the firewall is enforced by the API shape.

---

## 4. ENTITY-PAGE IA (new `#view-subject`, `#view-platform`, `#view-faculty`)

Routing: `goSubject(canon)` / `goPlatform(id)` / `goFaculty(id)` set the active view and call
`renderSubjectPage/…`. Entry points: clicking any subject name (heatmap row, ranked bar, list row,
progress table), any platform chip/initial, any faculty name (video meta, roster, strength matrix).
Back = browser-history-less in-app: a slim breadcrumb row ("‹ Overview / Subject: Pathology") + Esc.

### 4.1 SUBJECT page — `renderSubjectPage(canon)`

**Desktop (≥1024, multi-panel, uses width):**
```
┌ ‹ back · breadcrumb ───────────────────────────────────────────────┐
│ PATHOLOGY                                   [hero serif MCQ mass]    │  ← H1 + one hero number
│ measured · across 3 banks                                           │
├───────────────────────────┬────────────────────────────────────────┤
│ COVERAGE × PLATFORM        │ CONSENSUS HIGH-YIELD TOPICS             │
│ [heatmap row: this subject │ [list: top-density topics, each with    │
│  across Marrow/Cere/Doc +  │  consensus mark ●● + per-bank sparkbar  │
│  reputation-only columns]  │  + MCQ count; proxy + directional tags] │
│ measured/proxy toggle      │                                         │
├───────────────────────────┴────────────────────────────────────────┤
│ WHO TEACHES IT BEST   (directional, sourced)                        │
│ [best-platform chip(s) from subjectStrength] + [faculty roster for  │
│  this subject: name · platform · star-meter (directional)]          │
├──────────────────────────────────┬──────────────────────────────────┤
│ VIDEOS (this subject)            │ YOUR PROGRESS                     │
│ [inset list of videos +          │ [small-multiples: categories      │
│  confidence tags + faculty]      │  attempted/reviewed; sparkline]   │
└──────────────────────────────────┴──────────────────────────────────┘
```
Two-column instrument grid (`grid-template-columns:1fr 1fr` / `1fr` for full-width bands). Uses the width.

**Mobile (density):**
- Sticky compact header: subject name (serif 18px) + ONE hero number (MCQ mass) + epi badge.
- Section order as vertical stack, each a `panel` with a thin sticky section label:
  1. **Coverage** — single-subject heatmap strip (3 cells) inline.
  2. **Consensus high-yield** — inset list, each row: ★★★ lead · topic · consensus mark trail.
  3. **Who teaches it best** — best-platform chip + faculty inset rows (star-meter trail).
  4. **Videos** — inset list (44–56px rows).
  5. **Your progress** — 2-col small-multiples grid.
- All numbers tabular `--t-fig`. No giant serif repeats.

Data: `leavesOf`/`treeOf` for topics, `bestCrossByPlat` for cross-bank coverage, `subjectStrength`
for best-platform (directional), `facultyForSubject` (new helper) for the roster, `videosOf` for videos,
`rollupLeaves` for progress.

### 4.2 PLATFORM page — `renderPlatformPage(id)`

**Desktop:**
```
┌ ‹ back · breadcrumb ────────────────────────────────────────────────┐
│ MARROW                              [hero: ★ 4.7  ~33k ratings]       │  ← reliability star is the hero
│ public-3p · App Store · captured 2026-06-26                          │
├──────────────────────────────┬──────────────────────────────────────┤
│ RELIABILITY SCORECARD        │ COVERAGE BY SUBJECT                   │
│ [star meter + numeric +      │ [ranked bars: this platform's MCQ     │
│  complaint themes; this app   │  mass per subject, density-filled;    │
│  highlighted in the full     │  measured]                            │
│  cross-platform table]       │                                       │
├──────────────────────────────┴──────────────────────────────────────┤
│ FACULTY ROSTER (current + past on this platform, directional)        │
│ [inset rows: faculty · subjects · status glyph · star-meter]         │
├──────────────────────────────────────────────────────────────────────┤
│ YOUR TRACKING ON THIS PLATFORM                                       │
│ [small-multiples per subject + overall attempted/reviewed/retaken]   │
└──────────────────────────────────────────────────────────────────────┘
```
For not-yet-integrated platforms (PrepLadder/eGurukul, `platformId:null` in content but present in
scorecard/strength): show reliability + reputation + roster, and a clear "content not yet integrated —
ingest seam" note instead of coverage. Honest about the seam.

**Mobile:** vertical stack — hero star → scorecard card → coverage ranked-bars → roster inset list →
your tracking small-multiples. Reliability uses the `table.resp` card pattern.

Data: `D.reliability.apps` (find by `platformId`), `freshSubjects(p)`/`platMCQ`, `facultyForPlatform`
(new), `rollup` over this platform's leaves.

### 4.3 FACULTY page — `renderFacultyPage(id)`

**Desktop:**
```
┌ ‹ back · breadcrumb ────────────────────────────────────────────────┐
│ DR. <NAME>                          [two star-meters: profile · video]│  ← both directional
│ directional · seed · community sentiment, not endorsement            │
│ teaches: Surgery · ENT   (canonical subjects → clickable)           │
├──────────────────────────────────────────────────────────────────────┤
│ CAREER TIMELINE                                                      │
│ [horizontal SVG timeline: PrepLadder 2014–18 → Marrow 2018– →       │
│  solo 2024– ; platform-colored segments, status glyphs, year ticks] │
├──────────────────────────────┬──────────────────────────────────────┤
│ RATINGS (directional, seed)  │ LINKED PLATFORMS                      │
│ [profile star-meter +        │ [chips → goPlatform; current/past     │
│  verifiedVia note;           │  status glyph each]                   │
│  rolled-up video meter       │                                       │
│  per platform]               │                                       │
├──────────────────────────────┴──────────────────────────────────────┤
│ SUBJECTS TAUGHT  → each links to goSubject (where they appear in     │
│ "who teaches it best")                                               │
└──────────────────────────────────────────────────────────────────────┘
```
**Neutrality:** aggregate-only, every datum sourced (`faculty[].sourceIds`), framed as community
sentiment, `verifiedVia:"in-app-activity"` shown as a "votes will be verified after backend" note. NO
cross-faculty ranking, NO "worst" board — a faculty page is always about *one* person's history + fit.

**Mobile:** name + two meters stacked → **vertical** career timeline (reuse `.timeline`) → ratings card →
linked-platform chips → subjects-taught chips. Dense, scannable, 44px tap targets.

Data: `D.faculty[]` (seed, ~10–20), `facById`, `videoFaculty` rollup (new helpers in core.js). Until the
seed exists, the page renders an honest empty state ("faculty layer — seeding in progress") and the nav
entry is hidden if `D.faculty` is absent — console stays clean, nothing fabricated.

---

## 5. TAB RE-SKIN (the 7 home tabs adopt the instrument system)

Each `renderX` moves to `js/surfaces/X.js`, recomposed from `statTile`/`listRow`/`chartFrame`. Where a
relational viz earns its place is called out. Navigation to entity pages noted.

| Tab | Re-skin | Relational viz earned | Entity nav |
|---|---|---|---|
| **Overview** | KPI **tile grid** (≥6 tiles: combined MCQs[hero serif, measured], attempted%, reviewed, top-density%, density gaps, tests scored[measured]). Then "continue" + "next moves" inset lists. Then the **subject×platform heatmap** replacing today's volume bars. Then strength matrix + reliability scorecard + How-we-rate (all existing curated panels, reframed in `chartFrame`). | **Heatmap** (3.1) + **consensus** glance (3.2) + **scorecard** (3.6). | subject names → `goSubject`; platform headers → `goPlatform`; "How we rate" → methodology sheet. |
| **QBank Tracker** | Keep the sidebar+main layout (desktop) / chip-strip (mobile). Subject hero gets a **coverage strip** (this subject across banks). Category tree rows become `listRow`s with a density sparkbar trail. ONE sticky toolbar (slim search + sort/filter icon→sheet + hi-yield pill) — already built. | **Density sparkbar** per category (sequential ramp) + **cross-bank coverage badges** (existing `xcov`) upgraded to mini consensus marks. | subject in sidebar → can deep-link to `goSubject`; leaf cross-match chips → `goPlatform`. |
| **Progress** | Replace giant-number table with **small-multiples** grid (per subject attempted/reviewed) + an exam-level **sparkline** of cumulative progress. Keep the sortable table (desktop) but each row gets a micro-ring trail. | **Small-multiples + sparkline** (3.4). | subject row → `goSubject`. |
| **Tests & Scores** | Add-form unchanged. Scores table gets an **accuracy sparkline** header (your trend) + per-subject accuracy mini-bars. | **Sparkline** of accuracy over time; per-subject accuracy bars (`measured` from your scores). | test subject tags → `goSubject`. |
| **High-Yield** | The columns become a **consensus-ranked** view: topics where ≥2 banks agree on high density float to top with an `--agree` mark; honest `proxy` badge on the density itself. | **Consensus indicator** (3.2) as the organizing principle. | topic → drawer; subject filter → `goSubject`. |
| **Videos** | Rows become `listRow`s (existing `.vrow` is close); each shows confidence tag + (new) **faculty chip** → `goFaculty`. A small **coverage-by-confidence** bar at top. | Coverage/confidence mini-bar; faculty rollup. | faculty chip → `goFaculty`; suggested leaf → drawer/`goSubject`. |
| **Study Planner** | Tiers (hi/mid/lo) reframed as instrument plates; each tier shows a **ranked-bar** of its subjects by density + your gap. KPI row → tiles. | **Ranked-bars** (3.3) of where-to-spend by tier. | subject in a tier → `goSubject`. |

The 7 tabs stay the **home** (bottom nav on mobile, tab bar on desktop) — entity pages are pushed
*on top* via the same `#view-*` show/hide mechanism (no new router lib; `show(view)` extended to handle
`subject`/`platform`/`faculty` with a stashed param). Console-clean: entity views start empty and only
render on navigation.

---

## 6. TWO-LAYOUTS RULE (one system, desktop=width, mobile=density)

**Breakpoint strategy** (already partially in styles.css — formalize it):

- **Chrome (app shell) is viewport-media driven** (`@media (max-width:640px)`): compact header, bottom
  nav, sheets, drawer→bottom-sheet. This is fixed at the device level — exists today, retained.
- **Content reflow is container-query driven** (`.view{container-type:inline-size}`, already at line
  467): panels reflow based on *their own width*, so the same `renderSubjectPage` HTML gives a 2-col
  instrument grid in a wide `#view-subject` and a 1-col stack in a narrow one — **one render path, two
  layouts**, no JS branching.

The single rule, stated as CSS:
```css
/* DESKTOP = USE THE WIDTH: instrument grids go multi-panel */
.inst-grid{display:grid;gap:var(--gap);grid-template-columns:1fr 1fr}
.inst-grid.full{grid-template-columns:1fr}
@container (max-width:760px){ .inst-grid{grid-template-columns:1fr} }   /* MOBILE = DENSITY: stack */

/* tiles: dense 2/3-col on phone, auto-fit plates on desktop */
.tiles{display:grid;gap:8px;grid-template-columns:repeat(2,1fr)}
@container (min-width:415px){ .tiles{grid-template-columns:repeat(3,1fr)} }
@container (min-width:760px){ .tiles{grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:var(--gap)} }

/* charts: SVG viewBox + preserveAspectRatio scale fluidly; column COUNT (not width) shrinks on mobile */
.cframe-plot svg{width:100%;height:auto;display:block}
```
- **Desktop** earns the width with `inst-grid` multi-panel entity pages + multi-column tile plates +
  treemap. **Mobile** hits density with 2/3-col tiles, inset list rows (48px), ranked-bars instead of
  treemap, vertical timeline instead of horizontal, charts that drop columns rather than scroll.
- **No horizontal scroll 320→1920:** charts size to column count; tables use the proven `table.resp`
  card fallback; `min-width:0` on all ellipsis cells (existing). Verified at 320/375/414/768/1024/1440/1920.

---

## 7. HOW IT PASSES EACH MEASURABLE BAR

**A) Mobile density (375×812):**
- Overview shows **6 KPI tiles** (combined MCQs, attempted%, reviewed, top-density%, density gaps, tests
  scored) in a 2-col (3-col ≥414) grid, **tile height 84–104px** (existing `.stat` mobile rule: 84px min),
  + the start of the heatmap above the fold → **≥6 tiles + next section visible**. ✓
- Lists are **inset-grouped rows at 48px** (`--row-h`, in the 44–56 band), 1px hairline dividers, one
  rounded container — `listRow`/`.inset` replaces all floating cards. ✓
- **ONE sticky toolbar** on QBank: slim search + sort/filter icon-buttons → bottom-sheet + hi-yield pill
  + platform segmented (existing `.qb-controls` mobile rule, line 655). ✓
- **One hero serif number per screen** (`--t-hero`); all other figures tabular 18–22px (`--t-fig*`);
  labels 11px uppercase. ✓
- **Tap targets ≥44px** (hit-area padding on rows, 44px chips/icon-buttons — existing). ✓

**B) Data/viz substance:**
- Every surface shows **judgment** (consensus high-yield, best-platform & best-faculty per subject,
  next-best-moves, neutral reliability) — not just inventory. ✓
- **Relationships drawn, not numerals:** heatmap, consensus mark, treemap/ranked-bars, sparklines/
  small-multiples, faculty timeline, star scorecards — **≥1 true relational viz per relevant surface**. ✓
- **Every figure carries its epistemic label + source + date** — enforced structurally because
  `chartFrame`/`panel` require `(epi, srcIds, captured)` and won't render without them. `measured`/
  `proxy`/`directional`/`public-3p` exactly as `D.methodology.labels`. ✓
- **Methodology/"How we rate" reachable** from every epi badge (tap → sheet) and the Overview panel. ✓
- **Neutrality firewall:** never fabricate (all data from `window.D`; `build_data.py` guard untouched);
  color/star meters are neutral; faculty aggregate-only, no "worst" board; hyScore always labeled
  `proxy`, never "yield." ✓

**C) Faculty layer:**
- Consumes `D.faculty[]` schema (career timeline `affiliations[]` with current/past/solo/superspecialty;
  two ratings: `ratings.profile` gated by `verifiedVia:"in-app-activity"` + rolled-up `videoByPlatform`).
- Both ratings rendered **directional** (seed); aggregate-only; community-sentiment framing; never a
  ranking board. Every name/affiliation/date/score from `faculty[].sourceIds`. Faculty page + roster on
  Subject/Platform pages + faculty chips on Videos. Until seed exists, honest empty state, nav hidden,
  console clean. ✓

**Cross-cutting hard constraints:** no horizontal scroll 320–1920 (§6); console clean (entity views lazy,
no fabricated data, helpers null-guard `D.faculty`); local-first intact (Store seam untouched, no network);
almanac identity retained (warm paper/ink, serif display, hairlines, pine+gold accents, evening theme
extended — never neon); TOTAL **56,091** preserved (Overview hero reads `QBANK_MCQ`, unchanged); vanilla
(global-scope `<script>` files in dependency order, no bundler/ES-modules/deps); `node --check` clean.

---

## 8. BUILD NOTES (concrete, vanilla)

- New CSS files: `css/tokens.css` (the §1.1 additions), `css/components.css` (tile/inset/listRow/cframe),
  `css/charts.css` (heatmap/treemap/timeline/scorecard/sparkline). Loaded via `<link>` before the JS.
- New JS (global scope, order): `js/core.js` (helpers + new faculty helpers `FACULTY`/`facById`/
  `facultyForSubject`/`facultyForPlatform`/`videoFaculty`), `js/ds.js` (components + charts),
  `js/surfaces/*.js`, `js/entities/{subject,platform,faculty}.js`, `js/main.js` (extended `show()` +
  `goSubject/goPlatform/goFaculty` + appClick delegation). `index.html` gains `#view-subject`,
  `#view-platform`, `#view-faculty` and the new tags. No `import/export`.
- Charts are pure SVG-string builders; the only runtime is the browser. `yieldFill(t)` centralizes the
  sequential ramp; `platColor(id)` (existing) centralizes categorical.
- `build_data.py` SOURCE-INTEGRITY GUARD untouched; faculty seed will reference `D.sources[]` ids and pass
  the same guard. `python3 build_data.py` still prints the same totals.
