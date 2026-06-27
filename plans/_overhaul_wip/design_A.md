# Design Direction A — "THE ALMANAC PLATE"
### Editorial-Almanac Maximalist for the Meridian Experience Overhaul

> **One-liner:** A medical-PG data app rendered as a beautifully typeset reference *annual* — every chart is an
> engraved "plate" (hairline-ruled ink on paper, high-yield struck in antique gold), yet it hits native-app
> density at 375px because the engraving discipline (rules + tabular figures + grouping) *is* the density engine.

The thesis: an almanac (think *Whitaker's*, *The Old Farmer's Almanac*, a Tufte plate, a Bradshaw railway table)
is the densest paper artifact ever made — pages of ruled tables, marginal figures, and engraved diagrams, all
calm. We do not fight the brand to reach density; we **lean into the historically densest expression of the
brand**. Charts are "PLATES": framed, captioned, numbered, hairline-ruled, with the epistemic label set as the
plate's *imprint line* and the source as its *colophon*. This makes the neutrality firewall a visible aesthetic
feature, not a compliance afterthought.

The named risk (too precious / not dense enough) is controlled by **one hard rule**: precious lives in the
*frame* (rules, captions, the gold), never in the *padding*. Mobile padding stays 10–14px, rows 44–56px, tiles
84–104px — identical to the density bars. The serif is rationed: exactly one hero serif numeral per screen; every
other figure is compact tabular sans. Gold is rationed: it only ever encodes high-yield / rating, never decoration.

---

## 1. VISUAL LANGUAGE

### 1.1 Token additions (extend `:root`; do NOT replace the existing feel)
All existing tokens stay. Add to `css/tokens.css` (was `:root` in styles.css). Hex chosen to sit inside the
current paper/ink/pine/gold family — warm, never neon.

```css
:root{
  /* --- existing kept verbatim: --paper #f4f1ea / --paper-2 #fbf9f3 / --paper-3 #f0ece2,
         --ink #23201b (+ -2 #655d51 -3 #7a7264 -4 #b3ab9c), --line #e4ddcf / --line-2 #d6cdba,
         --accent #1f4a3f / --accent-2 #2c6354 / --accent-soft #e8efe9,
         --marrow #3a5a78 / --cere #b0613b / --core #5d7a52 / --rt #6a5a86,
         --gold #a9832f / --bad #9a3b34 --- */

  /* PLATE surface: a touch warmer/whiter than paper-2, so a chart reads as "printed stock" */
  --plate:#fcfaf4;                 /* engraving ground (lighter than --paper-2) */
  --plate-edge:#cabd9f;            /* the visible plate-mark / frame rule (darker than --line-2) */
  --rule:#e4ddcf;                  /* = --line; hairline inside plates (alias for intent) */
  --rule-strong:#c9bfa8;          /* heavier internal divisions (table spines) */
  --ink-faint:#cfc7b6;            /* gridlines/ticks that must recede behind data */
  --gold-soft:#efe2c0;            /* gold fill at low alpha for HY cells (paper-safe) */
  --gold-ink:#7e5f1d;             /* darker gold for text-on-paper legibility (AA on --plate) */

  /* CATEGORICAL platform palette (encodes WHICH platform) — keep existing hues, name the seam ids */
  --p-marrow:var(--marrow);        /* #3a5a78 blue-slate */
  --p-cere:var(--cere);            /* #b0613b terracotta */
  --p-doc:var(--core);             /* #5d7a52 sage (DocTutorials = .k) */
  --p-prepl:#6a5a86;               /* reuse --rt muted plum — PrepLadder (seam, platformId:null) */
  --p-eguru:#8a7a52;               /* muted ochre — eGurukul (seam, platformId:null) */

  /* SEQUENTIAL yield/density ramp (encodes HOW MUCH — light paper -> deep pine).
     Used by heatmaps, treemaps, density meters. 5 steps, all warm, never neon. */
  --seq-0:#f2eee3;  --seq-1:#d9e0d2;  --seq-2:#aec3ab;  --seq-3:#6f9580;  --seq-4:#1f4a3f;
  /* GOLD ramp for the SECOND encoding (HY / consensus strength) — antique, not yellow */
  --hy-1:#efe2c0;  --hy-2:#d8b25e;  --hy-3:#a9832f;  /* low / mid / top density tier */

  /* semantic status (reliability, diffs) — reuse oxblood + pine, add a caution */
  --ok:var(--accent); --warn:#a9832f; --risk:var(--bad);

  /* type scale (tabular sans steps in px; serif display steps) */
  --t-hero:clamp(30px,8vw,46px);   /* the ONE serif hero numeral per screen */
  --t-display:clamp(19px,2.4vw,24px); /* serif page/section titles */
  --t-fig-lg:22px;  --t-fig:18px;  --t-fig-sm:15px;  /* tabular figures (tiles, rows) */
  --t-body:14px;  --t-meta:12px;  --t-label:11px;     /* label = uppercase .08em */
  --t-imprint:9.5px;               /* the plate imprint line (epistemic + source) */

  /* spacing / radii / elevation — almanac = tight + flat */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:24px;
  --r-plate:12px; --r-tile:11px; --r-chip:6px;
  --shadow-plate:0 1px 0 var(--plate-edge), 0 2px 8px rgba(35,32,27,.05); /* near-flat, paper-on-paper */
}
body.evening{
  --plate:#211c18; --plate-edge:#4a3f33; --rule-strong:#41382f; --ink-faint:#3a322a;
  --gold-soft:#3a3017; --gold-ink:#cda64e;
  --seq-0:#262019; --seq-1:#33402f; --seq-2:#4f6b58; --seq-3:#6fae98; --seq-4:#9fd9c4;
  --hy-1:#3a3017; --hy-2:#9c7b34; --hy-3:#cda64e;
  --p-prepl:#a892c2; --p-eguru:#bfa970;
}
```

**Color-as-data law (printed beside every plate legend):**
- **Categorical = platform identity** (marrow/cere/doc/prepl/eguru hues). Used for series, bars, faculty-affiliation chips.
- **Sequential `--seq-*` = magnitude** (coverage %, MCQ density, completion). Light paper = none, deep pine = most.
- **Gold `--hy-*` = high-yield / consensus / rating** ONLY. Never a fifth "pretty" color.
- **Semantic = `--ok/--warn/--risk`** for reliability tiers and score diffs.
- Never blend the channels: a heatmap is sequential OR categorical per cell, never both.

### 1.2 The "plate" surface (the signature move)
A chart-frame is an engraved plate: ground `--plate`, a 1px `--plate-edge` frame, an inner 6px `--plate`
matte (the "plate mark"), a **plate number** in the corner (`Pl. 1`, `Pl. 2` … auto-incremented per surface,
serif small-caps), a serif caption, and at the bottom an **imprint line** (epistemic badge + source colophon).
This single component carries the entire neutrality firewall visibly.

### 1.3 Typography in practice
- Page titles, section titles, entity names, the **one hero numeral**, plate captions, plate numbers → `--serif`.
- All other numbers, all labels, all chart tick text, all rows → `--sans`, `tnum` on. Tabular alignment everywhere.
- Labels: `--t-label` uppercase, `.08em` tracking, `--ink-3`. Imprint line: `--t-imprint`, `--ink-3`, the
  epistemic badge inline at start.

---

## 2. COMPONENT INVENTORY
All are pure functions in `js/ds.js` returning HTML/SVG strings (no DOM build, no deps). Markup below is the
contract; CSS lives in `css/components.css` + `css/charts.css`.

### 2.1 `statTile(opts)` — the KPI tile (extends existing `.stat`)
```
<button class="tile a-<accent>" data-go="…">
  <span class="tile-fig">87%</span>          <!-- tabular sans, --t-fig-lg -->
  <span class="tile-lbl">ATTEMPTED</span>     <!-- --t-label uppercase -->
  <span class="tile-note">812 of 934</span>   <!-- --ink-4, 1 line, ellipsis -->
  <svg class="tile-spark">…</svg>             <!-- optional 1px sparkline, --accent stroke -->
  <i class="epi proxy" title="…">proxy</i>    <!-- epistemic micro-badge, top-right -->
</button>
```
- **Mobile (≤640):** height 84–104px, pad 10–14px, fig 22px sans, label 10px. Grid: `repeat(2,1fr)` (≥414 →
  `repeat(3,1fr)`), gap 8px. Leading 3px accent bar (existing `.stat::before`) kept as the categorical hook.
- **Desktop:** same component, `repeat(auto-fit,minmax(190px,1fr))`, fig may upgrade to serif **only on the single
  hero tile** (the one marked `is-hero`); the rest stay sans. Sparkline shows where a series exists (progress over
  time, reliability trend) else omitted. Tap target = whole tile (≥44px tall always).

### 2.2 `listRow(opts)` — inset-grouped row (replaces floating cards everywhere)
Rows live inside `groupList(rows)` = ONE rounded `--plate` container with internal 1px `--rule` dividers (iOS
inset-grouped), NOT N cards.
```
<div class="lrow" data-go="…">
  <span class="lrow-lead" style="--c:var(--p-marrow)"></span>  <!-- 3px accent or platform dot -->
  <span class="lrow-main">
    <span class="lrow-name">Acute Pancreatitis</span>
    <span class="lrow-sub">Surgery · Marrow · 142 MCQs</span>  <!-- meta line, --t-meta --ink-3 -->
  </span>
  <span class="lrow-trail">…value / sdots / chips / hy ★★★…</span>
</div>
```
- **Mobile:** 44–56px tall, 12px h-pad, name `--t-body`, sub on its own 11.5px line only if needed (else single
  line). Trailing chips get 44px hit-area (negative-margin trick already used). Hairline divider, no gap.
- **Desktop:** same row, may grow a middle column (e.g. inline meter or coverage dots) since width allows; row
  height 40–48px (desktop can be a touch tighter). Hover `--paper-3`.

### 2.3 `epiBadge(tag)` — already exists, KEEP. Re-exported from ds.js
`measured` ink-grey · `proxy` gold · `directional` marrow-blue · `public-3p` sage. Tiny pill, `cursor:help`, the
`title` = `epiDesc(tag)`. **Hard rule: every figure/plate/row carrying a curated claim renders one.** In plates it
sits in the imprint line; in tiles it floats top-right; in table headers it sits after the column label.

### 2.4 `srcLink(id)` / `platRefChip(ref)` — already exist, KEEP.
`srcLine(ids, captured)` renders the **colophon**: `Source: <a>… · captured DATE`. In a plate this is the bottom
imprint. `platRefChip` renders a platform name styled by `platCls`, with `.off` muted style when `platformId:null`
(PrepLadder/eGurukul seam) plus an "(not yet integrated)" note — preserves the honest seam.

### 2.5 `segmented(opts)` — platform / scope switch (extends existing `.seg`)
Pill group; active pill inherits platform hue (`.seg.marrow button.on` pattern exists). Mobile: horizontal-scroll
if overflow (already handled). Used for platform filter, layout toggles (e.g. heatmap "coverage | density").

### 2.6 `bottomSheet(title, bodyHTML)` — already wired (`#sheet`). KEEP + reuse.
All mobile sort/filter/legend overflow goes here. New: a **"Read the plate" sheet** — tapping a plate's imprint
badge on mobile opens a sheet explaining that epistemic label + listing the full sources (since hover titles don't
exist on touch). Desktop uses `title=` tooltip + the always-visible imprint line.

### 2.7 `panel(title, epi?, bodyHTML, srcIds?, captured?)` — content panel (extends `.panel`)
Section container for non-chart content (lists, tables). Header = serif `h3` + optional epiBadge; optional srcline.
Mobile pad 13–14px, desktop 26px (existing).

### 2.8 `chartFrame(title, {epi, srcIds, captured, plateNo, legend, svg})` — THE PLATE
```
<figure class="plate" aria-label="…">
  <figcaption class="plate-cap">
    <span class="plate-no">Pl. 3</span>
    <span class="plate-title">Coverage × yield — Surgery</span>
    <span class="epi directional">directional</span>
  </figcaption>
  <div class="plate-body">{svg or html grid}</div>
  <div class="plate-legend">{legend swatches + scale ramp}</div>
  <div class="plate-imprint srcline">Source: <a>…</a> · captured 26 Jun 2026</div>
</figure>
```
- **Mobile:** the plate frame thins (4px plate-mark, pad 10px), caption wraps to 2 lines, legend goes
  horizontal-scroll, imprint stays 9.5px. SVG uses `viewBox` + `width:100%;height:auto` so it never overflows.
- **Desktop:** full plate-mark, caption single line, legend right-aligned in the caption row when it fits.
- The plate number auto-increments via a render-scope counter (a closure in each `renderX`), giving the "annual"
  feel without fabricating anything.

---

## 3. CHART VOCABULARY  (`js/ds.js` chart fns; styles in `css/charts.css`)
Every chart returns an `<svg viewBox>` (or CSS-grid for the heatmap) **wrapped by `chartFrame`** so the epistemic
label + source are structurally inseparable from the data. All bind to real `D` — never fabricate. Colors via the
CSS variables above so theme + evening just work.

### 3.1 `heatmap(rows, cols, valueFn, {mode})` — **subject × platform** (THE flagship relational viz)
- **Data:** rows = canonical subjects (`[...new Set(QBANKS.flatMap(p=>freshSubjects(p).map(s=>canon(s.subject))))]`);
  cols = QBANKS (categorical). `mode:"coverage"` → does platform cover this subject (binary-ish, cell = MCQ count
  bucketed onto `--seq-*`); `mode:"density"` → within-subject MCQ share (the **proxy**, labelled). Cell fill =
  sequential ramp; if the subject's `D.subjectStrength` names a platform strongest, that cell gets a **gold
  hairline ring** (the directional overlay) — two epistemic layers, each labelled in the legend.
- **Approach:** CSS-grid of `<button class="hm-cell">` (not SVG) so cells are tappable → opens that
  Subject×Platform pairing. `grid-template-columns: 120px repeat(N, 1fr)`. Row label = subject (click → Subject
  page). Cell shows the number on hover/focus (desktop) or always at ≥420px.
- **Mobile adapt:** subjects become rows (already vertical-friendly); columns shrink to platform **initials** (M/C/D)
  with a color dot; cell = colored square + tiny count; horizontal never scrolls because only 3 integrated qbank
  columns exist. A "show seam platforms (PrepLadder/eGurukul)" toggle adds muted `--p-prepl/--p-eguru` columns that
  render as hatched "not integrated" cells (honest empty state, not fabricated counts).
- **Epi/source:** plate caption epiBadge = `measured` (coverage) or `proxy` (density); the gold-ring overlay carries
  its own `directional` chip in the legend with `srcLine(D.subjectStrength.sourceIds, captured)`.

### 3.2 `consensusMark(topic)` / consensus plate — where platforms AGREE
- **Data:** for a canonical subject, cross-match leaves (existing `bestCrossByPlat`/`crossMatches`) to find topics
  that ≥2 qbanks both rank high-density (priority 3). Agreement = both gold; disagreement = one gold one grey.
- **Approach:** a small "agreement glyph" per topic row: N pips (one per qbank), each pip filled gold if that
  platform tiers the topic ★★★, hollow if not. `consensusMark` returns inline SVG (e.g. 3 pips). A **consensus
  plate** lists topics sorted by agreement count, the most-agreed struck in gold ("both banks call this top-tier").
- **Mobile:** the pip glyph is 3×8px dots inline in a `listRow` trailing slot — reads at a glance, zero overflow.
- **Epi/source:** epiBadge `proxy` (it's density agreement, not measured yield) + caption note "agreement of an
  MCQ-density proxy across banks — not measured exam yield." Honest by construction.

### 3.3 `rankedBars(items, valueFn, colorFn)` / `treemap(items)` — mass / where-to-spend
- **Default = ranked horizontal bars** (the existing `.bars`/`.barrow` upgraded into a plate) because bars beat
  treemaps for legibility at 375px. Bar fill = sequential ramp by magnitude OR categorical by platform (two
  variants). Value label inside bar (tabular), subject name = click → Subject page.
- **Treemap variant** (`treemap`) offered on **desktop only** for "MCQ mass by subject" (squarified, SVG `<rect>`s,
  fill = `--seq-*`, label if rect big enough). On mobile it **degrades to `rankedBars`** automatically (treemap
  labels can't survive 375px) — same data, no overflow.
- **Epi/source:** `measured` for raw MCQ mass; `proxy` if showing density. srcline `measured` = "counts we hold."

### 3.4 `sparkline(series)` / `smallMultiples(seriesMap)` — progress, not giant numerals
- **Data:** per-subject completion over the user's tracking timeline (from `Store.state.progress[].ts`), or test
  scores over time (`Store.state.scores`). All **local, measured** (the user's own data → `measured`).
- **Approach:** `sparkline` = a 1px `--accent` polyline in a ~80×24 SVG, optional end-dot + last value. Lives inside
  stat tiles (Progress/Overview) and Test rows. `smallMultiples` = a grid of mini-plates, one tiny sparkline per
  subject, shared y-scale, for the Progress tab — "small multiples" is peak almanac.
- **Mobile:** sparkline sits in the tile (already ≤104px); small-multiples grid = 2-col of 84px mini-plates.
- **Epi/source:** `measured` (your device). No external source needed; imprint says "your tracked activity, this device."

### 3.5 `facultyTimeline(faculty)` — career history (the moat, visualized)
- **Data:** `D.faculty[].affiliations[]` → ordered segments `{platformId|name, role, subjects, from, to, status}`.
- **Approach:** a horizontal **engraved timeline** SVG: a baseline rule (the almanac spine), a tick per year span,
  one **lane segment per affiliation** colored by platform (categorical `--p-*`), `status` encoded by segment style
  — `current` solid, `past` solid muted, `solo`/`superspecialty` = gold-edged (the "went independent" story). Each
  segment labels platform + year range; `to:null` segments run to a "now" marker at the right edge.
- **Mobile adapt:** rotate to **vertical timeline** (reuse the existing `.timeline`/`.tl` CSS pattern — dot on a
  spine, date + platform + subjects per node), newest at top. No horizontal scroll, reads like a CV.
- **Epi/source:** every segment's `sourceIds` → srcline `directional` (seed). Caption note: "career history,
  community/public sources — directional seed." Aggregate framing only.

### 3.6 `ratingScorecard(apps)` / faculty rating block — neutral reliability + the two faculty ratings
- **Reliability scorecard (platform):** `D.reliability.apps[]` → a plate table: app name (platRefChip, `.off` for
  seam apps), star rating drawn as **5 gold pips** (filled to `rating/5`) + the numeric `4.7` tabular + ratings
  count label + recurring-theme chips. Sort by rating; bar/pip fill = gold (rating channel). Rows where
  `platformId:null` are clearly the ingest seam. **No "worst app" headline — it's a neutral table.**
- **Faculty ratings (two signals, both `directional` seed):**
  1. **Profile votes** → a single gold-pip score + `count` + a `verifiedVia:"in-app-activity"` chip (greyed
     "verified voting opens with accounts") — never a raw leaderboard.
  2. **Rolled-up video rating** → per-platform mini-rows (avg pip + n), aggregate-only.
  Both rendered by `ratingScorecard` in "faculty" mode. **Never a "worst faculty" board** — only the individual's
  own per-subject strengths, framed as community sentiment.
- **Mobile:** scorecard table uses the existing `table.resp` → stacked label:value cards (already built); pips scale
  down but stay ≥ tap-irrelevant (read-only). Theme chips wrap.
- **Epi/source:** scorecard epiBadge `public-3p` + date + per-row `srcLink(app.sourceId)`. Faculty epiBadge
  `directional` + `srcLine(faculty.sourceIds)`.

---

## 4. ENTITY-PAGE IA
New routes render into `#view-subject`, `#view-platform`, `#view-faculty` (added to index.html). Entry handlers
`goSubject(canon)`, `goPlatform(id)`, `goFaculty(id)` in `js/main.js`; pages in `js/entities/*`. Back affordance =
a serif "‹ back" + breadcrumb eyebrow. The 7 tabs remain home; entity pages are pushed-over views (desktop:
full-width view with back; mobile: full-screen with back + the bottom nav still present).

### 4.1 SUBJECT page — `renderSubjectPage(canon)`
**Desktop (≥1024, multi-panel, uses the width):**
```
┌──────────────────────────────────────────────────────────────────────┐
│ ‹ Back · SUBJECT                                                        │
│ Surgery                                  [hero serif numeral: 142 ★★★]  │  ← title + ONE hero (consensus HY count)
│ tiles: Combined MCQs | Your coverage% | Reviewed% | Consensus HY | Gaps │  ← statTile row (measured/proxy badged)
├──────────────────────────────┬─────────────────────────────────────────┤
│ Pl.1 Coverage × yield        │ Pl.2 Consensus high-yield topics         │
│  (heatmap: this subject's     │  (consensus plate: topics ≥2 banks agree │
│   row, all platforms, cells   │   are top-density, gold-struck; pips)     │
│   = density; gold ring = the  │  listRows, click → leaf drawer           │
│   reputed-strong platform)    │                                          │
├──────────────────────────────┴─────────────────────────────────────────┤
│ Pl.3 Who teaches it best  (directional)                                  │
│  LEFT: platform-strength (subjectStrength gold ring + platRefChip, src)  │
│  RIGHT: faculty roster for this subject (facultyForSubject) — name rows, │
│         directional rating pip, click → Faculty page                     │
├──────────────────────────────┬─────────────────────────────────────────┤
│ Videos for this subject       │ Your progress (small-multiples spark)    │
│  (D.videos filtered, listRows)│  measured — your tracked completion      │
└──────────────────────────────┴─────────────────────────────────────────┘
```
**Mobile (density):** single column, same order, each block a plate/group. Hero tile + 5 stat tiles (2-col grid =
≥6 above fold). Heatmap collapses to this-subject row with M/C/D dot-columns. "Who teaches it best" = two stacked
groupLists. Each plate's imprint badge taps → "read the plate" sheet.

### 4.2 PLATFORM page — `renderPlatformPage(id)`
**Desktop:**
```
‹ Back · PLATFORM
Marrow            [hero serif: 25,234 MCQs]      ⟨reliability 4.7★ pips · public-3p⟩
tiles: Subjects | Modules | MCQs | Your coverage% | App rating(public-3p) | Faculty count
┌── Pl.1 Reliability scorecard (public-3p, dated) ──┬── Pl.2 Coverage by subject ──┐
│  this platform's row pulled out of the full        │  rankedBars of MCQ mass by    │
│  scorecard + recurring-theme chips + srcLink        │  subject, fill = seq ramp;    │
│  (neutral, the seam apps shown muted for context)   │  click subject → Subject page │
├── Pl.3 Faculty roster (facultyForPlatform) ────────┴──────────────────────────────┤
│  listRows: name · subjects · role/status (current/past) · directional rating ·     │
│  click → Faculty page. Shows faculty who LEFT too (status:past) — the moat.         │
├── Your tracking on this platform ─────────────────────────────────────────────────┤
│  subject completion meters (measured) + "continue" listRows                         │
└────────────────────────────────────────────────────────────────────────────────────┘
```
**Mobile:** hero tile + 5 tiles (≥6). Scorecard via `table.resp` card mode. Coverage = rankedBars plate.
Roster = groupList. Tracking = meters. One sticky toolbar if filtering the roster (search + sort icon → sheet).

### 4.3 FACULTY page — `renderFacultyPage(id)`
**Desktop:**
```
‹ Back · FACULTY                                            directional (seed) ⓘ
Dr. … (aka "…")                          [hero serif: profile rating pip + count]
subjects taught: [Surgery] [ENT] chips      bio (short, sourced)
┌── Pl.1 Career timeline (directional) ──────────────────────────────────────────┐
│  engraved horizontal timeline: current Marrow → past PrepLadder → solo (gold).   │
│  platform-colored lanes, status-encoded, year ticks, "now" marker. srcline.      │
├── Pl.2 Ratings (two signals, directional) ──┬── Pl.3 Subjects & strength ───────┤
│  profile votes pip + count + verifiedVia chip │  per-subject community-sentiment   │
│  rolled-up video rating per platform (mini)   │  strengths (NOT a ranking board)   │
├── Linked platforms ─────────────────────────┴────────────────────────────────────┤
│  platRefChips for every affiliation platform → click → Platform page              │
└────────────────────────────────────────────────────────────────────────────────────┘
```
**Mobile:** name + subjects chips, then **vertical** timeline (the `.timeline` pattern), then ratings group, then
strengths group, then linked-platform chips. Hero = the profile rating numeral. Everything `directional`-badged;
aggregate-only; no comparative leaderboard anywhere.

---

## 5. TAB RE-SKIN (the 7 tracking tabs adopt the system; each earns ≥1 relational viz where it fits)

- **Overview** — KPI tile grid (existing 6 tiles kept: Combined MCQs *measured*, Attempted, Reviewed, Top-density
  *proxy*, Density gaps *proxy*, Tests scored). **Relational viz:** the **subject×platform heatmap** plate becomes
  the hero of Overview (replacing/augmenting the comparison bars), making the cross-platform thesis the first thing
  you see. Below: "continue" + "next moves" groupLists; then subjectStrength + reliability plates + "How we rate."
  Subject names in every list/bar → click → Subject page.
- **QBank Tracker** — keep the sticky-sidebar (desktop) / chip-strip (mobile) subject nav. Subject hero gets the
  hero numeral. **Relational viz:** a small **coverage×density heatmap** for the *selected subject's* leaves vs
  cross-bank matches, + per-leaf `consensusMark` pips and the cross-bank `xcov` badges (exist). Subject name in
  hero → Subject page; platform switch → Platform page link.
- **Progress** — kill giant numerals. **Relational viz:** `smallMultiples` of per-subject completion sparklines
  (*measured*) + a coverage heatmap (subject × {attempted/reviewed/mastered}). Tiles for rollups.
- **Tests & Scores** — score-over-time **sparkline** per series in the tile/row (*measured*); the test list as
  groupList; difficulty stars in gold. Timeline of upcoming GTs reuses `.timeline`.
- **High-Yield** — the **consensus plate** is the star: topics where banks agree (gold), `proxy`-badged throughout
  (honest). rankedBars of HY mass by subject. Subject → Subject page; topic → drawer.
- **Videos** — groupList rows (exist); add **faculty rollup**: each video's `facultyId` → a faculty chip → Faculty
  page; per-faculty rolled-up video rating shown (*directional*). Subject filter segmented.
- **Study Planner** — tiers as plates; **relational viz:** a ranked "where your gaps are" bars (untouched ★★★ mass
  by subject, *proxy*) so the plan is visibly evidence-led. Each tier item → drawer/Subject page.

**Navigation to entities:** delegated clicks in `appClick` — `data-go-subject`, `data-go-platform`,
`data-go-faculty` attributes on names/chips route to the three handlers. Command palette gains Subject / Platform /
Faculty result types (reuse `.pal-type`). Back = browser-style in-app stack.

---

## 6. TWO-LAYOUTS RULE (one system, two layouts)
- **Single source of truth:** components/charts are identical functions; only *layout context* changes.
- **Chrome (app shell) = viewport media queries** (the existing `@media(max-width:640px)` chrome: compact header,
  bottom nav, sheets, full-screen palette). Unchanged contract.
- **Content reflow = container queries** (`.view{container-type:inline-size}`, already in place). Multi-panel grids
  (`two-col`, entity `panel-grid`) collapse at container breakpoints, NOT viewport — so a panel reflows correctly
  even inside the desktop sidebar layout.
- **"Desktop uses the width":** entity pages and Overview use a **12-col-ish CSS grid** (`grid-template-columns:
  repeat(12,1fr)` desktop) placing plates 2-up / 3-up; treemap + small-multiples + side-by-side plates appear only
  where width ≥ ~900px (container query). Plates that are too wide degrade (treemap→rankedBars).
- **"Mobile hits density":** at ≤640 everything is single-column, tiles 2–3-col, rows 44–56px, one toolbar, plates
  thin their frame. The *same* `statTile`/`listRow`/plate just render in their compact CSS state. Breakpoints:
  `≤360` (shave), `≤640` (mobile chrome+density), `414–640` (3-col tiles), container `≤540/620/820` (panel reflow),
  `≥900` container (multi-panel + treemap), `≤1920+` capped container so figures never sprawl. **No horizontal
  scroll 320→1920** is guaranteed because every SVG uses `viewBox`+`width:100%`, the heatmap has ≤3 fixed columns,
  treemaps degrade, and tables become cards.

---

## 7. HOW IT PASSES EACH MEASURABLE BAR

**A) Mobile density (375×812):**
- **≥6 KPI tiles above fold:** Overview renders 6 `statTile`s in a 2-col (≥414 → 3-col) grid, each 84–104px →
  6 tiles ≈ 3 rows ≈ 300–330px, leaving the heatmap plate header visible above the 812 fold. ✓
- **Tiles 84–104px, not ~230:** enforced in `css/components.css` mobile state (`min-height:84px`, pad 10–14px, fig
  22px sans). ✓
- **Rows 44–56px, hairline dividers, inset-grouped:** `listRow` inside `groupList` = one rounded `--plate`
  container, internal 1px `--rule` dividers, no per-row card, height 44–56px. ✓ (matches existing `.mrow`/`.vrow`).
- **ONE sticky toolbar:** every list surface uses one sticky row = slim search + sort/filter **icon-buttons** →
  `bottomSheet`, platform = `segmented`, hi-yield = pill (the existing `.qb-controls` mobile pattern, reused). ✓
- **≤1 hero serif numeral/screen:** only the tile/title marked `is-hero` uses serif; all other figures sans
  tabular 18–22px; labels 11–12px uppercase. Lint by grepping `--t-hero` usage = once per render. ✓
- **Tap targets ≥44px:** tiles, rows, chips, icon-buttons all ≥44px (hit-area padding where visual <44). ✓

**B) Data/Viz substance:**
- **Judgment not inventory:** Overview/Subject lead with the **heatmap** (cross-platform coverage), **consensus**
  plate (agreement), **subjectStrength** (best-platform, directional), **reliability** (neutral public-3p),
  next-best-moves (what-to-do). Counts are present but never alone. ✓
- **Relationships not numerals:** ≥1 true relational viz per relevant surface — Overview/Subject = heatmap;
  High-Yield = consensus; Progress = small-multiples + heatmap; Planner = ranked gaps; Faculty = career timeline. ✓
- **Every figure labelled + sourced + dated:** `chartFrame` imprint = `epiBadge` + `srcLine(ids, captured)`;
  tiles carry `.epi`; tables carry per-row `srcLink`. Methodology "How we rate" stays reachable (Overview footer +
  palette + a sheet). ✓
- **Color encodes data:** sequential `--seq-*` = yield/density, categorical `--p-*` = platform, gold `--hy-*` =
  HY/consensus/rating — declared in every plate legend; never decorative. ✓
- **Neutrality firewall:** all curated values come from `D` (build_data.py guard intact); money never moves a score
  (no sponsored surface); aggregate-only; faculty has no "worst" board. ✓

**C) Faculty layer:**
- `D.faculty[]` schema as specified (career timeline current→past→solo→superspecialty + two ratings, both
  `directional` seed, `verifiedVia:"in-app-activity"`). Timeline + ratingScorecard render it; aggregate-only,
  community-sentiment framing; every name/affiliation/date/score → `srcLink`. Videos roll up via `facultyId`. ✓

**Hard constraints:** TOTAL **56,091** preserved (we only read `D`, never recompute counts; build_data prints
42889 + 13202). No framework / bundler / ES-module import-export — all fns on global scope, plain `<script>`
order. No network deps; `storage.js` Store seam untouched (we read `Store.prog/state`). Almanac identity retained
and *amplified* (plates, gold, hairlines), never neon. Console clean (pure string fns, delegated clicks).
JS validated with `node --check` per module before finishing.

---

### Build order (incremental, ships value each step)
1. `css/tokens.css` + `css/charts.css` (plate + ramps) — visual foundation, no behavior change.
2. `js/ds.js` chart fns (heatmap, consensus, rankedBars, sparkline, facultyTimeline, ratingScorecard) + chartFrame.
3. Re-skin Overview (heatmap hero) + Progress (small-multiples) — prove the plate on home tabs.
4. `js/entities/*` + routes + `#view-*` containers — Subject/Platform pages (read existing curated `D`).
5. Faculty: extend build_data.py to emit `D.faculty[]` from `_raw/curated/faculty.json` (seed), Faculty page,
   videos `facultyId` rollup. Keep the source-integrity guard; add faculty refs to the guard's `_collect_refs`.
6. Remove old app.js/styles.css once fully split.
