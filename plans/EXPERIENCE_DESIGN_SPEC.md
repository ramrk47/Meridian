# Meridian — Experience Design Spec (THE ATLAS, engraved)

> **Status:** This file is the committed contract for all builders of the Experience Overhaul.
> **Base direction:** C ("The Atlas" — relationships are the product; every name is a link; the
> Subject↔Platform↔Faculty triangle is the IMDB graph). **Grafted in:** A's engraved-plate brand work
> (imprint-line colophon, `Pl. N` numbering, dual-encoded heatmap, "precious lives in the frame") and
> B's density + feasibility engine (five-facts-in-one-row, `yieldFill`/`platColor` color helpers,
> gridded-chart discipline, the "warn is a 6px dot, never a bar" neutrality rule).
>
> **Mission:** reach native-data-app density (Apple Health / Oura / Groww / Kite) and a true chart
> vocabulary while keeping the warm editorial almanac soul — **warm, engraved, never neon.**
>
> **Vanilla forever:** every component/chart is a pure function on the global scope returning an
> HTML/SVG string. No framework, no bundler, no ES-module import/export, no new runtime deps. CSS is
> plain custom-property-driven files. `storage.js` Store seam is untouched. Validate every new JS file
> with `node --check` before finishing.

---

## 0. WHAT THE DATA ACTUALLY SUPPORTS (grounding — verified against `data.js` / `build_data.py`)

Bind only data that exists. **Never fabricate a count, rating, name, or date.** Verified in repo:

- **`D.platforms[]`** — `marrow` (cls `.m`), `cerebellum` (`.c`), `doctutorials` (`.k`). Each:
  `subjects[].modules[]` `{id,name,category,mcqs,rating,priority,hyScore}`. Totals **42,889** (Marrow+Cere)
  + **13,202** (DocTutorials) = **56,091** — read, never recompute.
- **PrepLadder / eGurukul are NOT content platforms.** They appear ONLY in `D.reliability.apps[]` and
  `D.subjectStrength` as `platformId:null` (reputation/ingest seam). **GUARD RAIL (applies to ALL surfaces):
  never render PrepLadder/eGurukul as heatmap columns or bars — they have no `platforms[]` content.** They
  appear only as muted, non-link reputation chips (`.platlabel.off`) in reliability / strength / faculty
  contexts, with a "not yet integrated" note.
- **`D.subjectStrength`** — `{epistemic:"directional", captured, framing:"community reputation", sourceIds[],
  subjects:[{subject, strong:[{platform, platformId}]}]}`. Binds "who is best per subject."
- **`D.reliability`** — `{epistemic:"public-3p", captured, scale, apps:[{name,platformId,rating,ratingApprox,
  ratingsLabel,themes[],sourceId}]}`. iOS App-Store scorecard.
- **`D.sources[]` / `SRC_BY_ID`** — evidence registry. Every curated figure references these ids.
- **`D.methodology`** — 4 epistemic-label defs + neutrality firewall sentence (`EPI_DEF`, `epiDesc`).
- **`D.faculty` — does NOT exist in `data.js` yet.** Seed files exist on disk un-emitted
  (`_raw/curated/faculty_seed.json`, `faculty_sources.json`). This spec defines the schema, the
  `build_data.py` emit hook + `_collect_refs` guard extension, AND every faculty surface as **gated**:
  when `D.faculty` is empty/absent the Faculty nav entry is hidden and panels render an honest
  "Faculty profiles are being seeded — N profiles live" empty state. **Never a fabricated roster.**
- **`hyScore`** = within-subject MCQ density. **A PROXY**, not measured exam yield. Everywhere it appears
  it is labelled `proxy` and titled "MCQ density — proxy, not measured exam yield." Never compute a fake "yield."

Existing helpers to REUSE (confirmed in `app.js`): `epiBadge` (L91), `srcLink` (L95), `platRefChip` (L106),
`srcLine`, `openSheet` (L631), `bestCrossByPlat` (L130), `freshSubjects` (L36), `canon`, `EPI_DEF` (L87),
`epiName`/`epiDesc`. Existing CSS to extend: `.stat` mobile rule (styles.css L618 — already 84px/22px tabular
sans/2-col), `.view{container-type:inline-size}` (L467), `.seg` (L121), `.qb-controls` (L310), `.timeline`
(L199), responsive `.resp` table (L556), bottom-nav/sheet chrome (L576+).

---

## 1. DESIGN TOKENS (extend `:root`; never replace the feel) → `css/tokens.css`

All existing tokens stay verbatim. Hexes chosen to sit inside the paper/ink/pine/gold family. **Never neon.**

```css
:root{
  /* ── CATEGORICAL platform palette (encodes WHICH platform — identity only) ── */
  --p-marrow:var(--marrow);   /* #3a5a78 slate-blue  · Marrow (.m) */
  --p-cere:var(--cere);       /* #b0613b terracotta  · Cerebellum (.c) */
  --p-doc:var(--core);        /* #5d7a52 sage        · DocTutorials (.k) */
  --p-prepl:#7a6a3c;          /* muted ochre-bronze  · PrepLadder  — reputation-only, never a content column */
  --p-eguru:#6a5a86;          /* muted aubergine     · eGurukul    — reputation-only, never a content column */

  /* ── SEQUENTIAL yield/density ramp (encodes HOW MUCH — warm pine, light→deep; never platform) ── */
  --y0:#f0ece2;  /* = --paper-3, none/low */
  --y1:#dbe3dc;
  --y2:#b9ccbf;
  --y3:#8fb0a0;
  --y4:#5d8a78;
  --y5:#2c6354;  /* = --accent-2, highest */
  --y-ink-lo:var(--ink-2);    /* text on light cells (y0–y2) */
  --y-ink-hi:var(--paper-2);  /* text on dark cells (y3–y5) */

  /* ── DIVERGING/ORDINAL consensus ramp (how many platforms agree — antique gold, never red/green neon) ── */
  --con-none:var(--line);     /* platform absent */
  --con-one:#cdb98a;          /* 1 platform flags HY — straw (lone signal) */
  --con-two:#a9832f;          /* = --gold, 2 agree */
  --con-all:#7a5b16;          /* deep antique gold, all 3 agree — strongest consensus */

  /* ── INSTRUMENT neutrals: gridlines, ticks, crisp numerals (from B) ── */
  --grid:#ece6d8;             /* faint chart gridlines — one notch lighter than --line */
  --grid-2:#ded4c0;           /* axis baseline / zero-line */
  --tick:var(--ink-4);        /* axis tick + value-label color */
  --ink-num:#1a1814;          /* crisper near-black for hero tabular numerals */

  /* ── ENGRAVED PLATE surface (from A — the brand signature) ── */
  --plate:#fcfaf4;            /* engraving ground (lighter than --paper-2) */
  --plate-edge:#cabd9f;       /* visible plate-mark / frame rule */
  --rule-strong:#c9bfa8;      /* heavier internal divisions (table spines) */
  --imprint-ink:var(--ink-3); /* imprint-line / colophon text */

  /* ── SEMANTIC status ── */
  --good:var(--core); --warn:var(--gold); --bad:var(--bad); --neutral:var(--ink-3);

  /* ── ELEVATION (almanac = flat; elevation is for overlays only) ── */
  --e0:none;
  --e1:0 1px 0 var(--line);                    /* hairline "card" — the default surface */
  --e1-plate:0 1px 0 var(--plate-edge), 0 2px 8px rgba(35,32,27,.05); /* near-flat plate */
  --e2:0 8px 24px rgba(35,32,27,.10);          /* hover lift, popovers */
  --e3:0 22px 60px rgba(20,17,14,.30);         /* sheets / drawer / palette */

  /* ── RADII ── */
  --r-1:7px;    /* chips, small controls */
  --r-2:11px;   /* tiles, inset-group container */
  --r-3:14px;   /* panels (= existing --r region) */
  --r-plate:12px;
  --r-pill:22px;

  /* ── SPACING scale: 4 / 8 / 12 / 16 / 22 / 32 ── */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:22px; --sp-6:32px;

  /* ── TYPE SCALE (px; serif = display/identity only, sans = ALL data, tabular numerals) ── */
  --t-hero:clamp(30px,5vw,46px); /* the SINGLE serif hero number per screen */
  --t-display:24px;   /* page/section H2, entity name (serif) */
  --t-panel:18px;     /* panel H3 / chartFrame title (serif) */
  --t-stat:20px;      /* stat-tile value (sans, tabular) */
  --t-body:15px;      /* body / list-row primary (sans) */
  --t-row:13.5px;     /* dense table / list secondary (sans) */
  --t-meta:12px;      /* meta, source line */
  --t-label:11px;     /* UPPERCASE labels, .10em tracking */
  --t-micro:10px;     /* epistemic badge, axis ticks, imprint, bottom-nav */
  --t-imprint:9.5px;  /* plate imprint line (epi + source colophon) */

  /* ── CHART geometry ── */
  --cell:34px;        /* heatmap cell desktop */
  --cell-m:30px;      /* heatmap cell mobile (≤3 fixed cols → never page-scrolls) */
  --spark-h:26px;     /* sparkline strip height */
  --tl-dot:9px;       /* timeline node */
  --row-h:48px;       /* canonical list-row height (44–56 band) */
}
```

**Type-scale overrides at ≤640 (mobile):** `--t-display:18px`, `--t-panel:16px`, `--t-stat` clamps 18–22px,
`--t-row:14px`, `--t-meta:11.5px`. Mobile keeps **exactly one `--t-hero` per screen** at 30–34px.

**Evening edition** (`body.evening`, append next to existing evening block):
```css
body.evening{
  --p-prepl:#bda86a; --p-eguru:#a892c2;
  --y0:#2a241f; --y1:#33403a; --y2:#3f5a4f; --y3:#4f7766; --y4:#5e9b86; --y5:#6fae98;
  --y-ink-hi:#181513; --y-ink-lo:var(--ink-2);
  --con-one:#6a5a30; --con-two:var(--gold); --con-all:#cda64e;
  --grid:#2a2620; --grid-2:#3a342c; --tick:#5c544a; --ink-num:#f3ead8;
  --plate:#211c18; --plate-edge:#4a3f33; --rule-strong:#41382f;
}
```

### 1.1 COLOR-AS-DATA CONTRACT (enforced by two helpers — no surface may invent a color)

| Channel | Scale | Where | Helper |
|---|---|---|---|
| **Magnitude** (MCQ density / coverage / progress) | sequential `--y0..--y5` | heatmap cells, treemap fill, ranked-bar fill, density sparkbars, progress fills | `yieldFill(t)` |
| **Platform identity** | categorical `--p-marrow/-cere/-doc` (`-prepl/-eguru` reputation-only) | platform chips, heatmap **column headers**, categorical bar fills, timeline nodes, legend swatches | `platColor(id)` |
| **Consensus** (how many platforms agree HY) | ordinal `--con-none/one/two/all` | consensus mark ONLY | `conFill(n)` |
| **Status** | semantic `--good/--warn/--bad` | reliability deltas, gaps, "needs review". **`--warn`/`--bad` render as a 6px DOT only, never a filled bar — we never shame.** | — |
| **Epistemic** (how we KNOW) | label-coded (`measured`=ink, `proxy`=gold, `directional`=marrow, `public-3p`=core) | `epiBadge` only | `epiBadge(tag)` |

**Firewall:** epistemic color sits OUTSIDE the data-color system — a reader never confuses "how we know it"
with "how big it is." Required helpers in `js/ds.js`:

```js
// 0..1 → nearest sequential step var. Centralizes the magnitude ramp.
function yieldFill(t){ return `var(--y${Math.max(0,Math.min(5,Math.round(t*5)))})`; }
// platform id → categorical var. Reputation-only ids allowed but callers must not place them in content viz.
function platColor(id){ return ({marrow:'var(--p-marrow)',cerebellum:'var(--p-cere)',doctutorials:'var(--p-doc)',
  prepladder:'var(--p-prepl)',egurukul:'var(--p-eguru)'})[id] || 'var(--ink-3)'; }
// agreement count 0..3 → consensus ramp var.
function conFill(n){ return ['var(--con-none)','var(--con-one)','var(--con-two)','var(--con-all)'][Math.max(0,Math.min(3,n))]; }
```

---

## 2. COMPONENT LIBRARY (`js/ds.js` — pure string-returning fns; CSS in `css/components.css`)

Every component returns a string so it drops into the existing `el(tag,cls,html)` flow and `appClick`
delegation. Each entry: **signature → markup → desktop vs mobile density behavior.**

### 2.1 `statTile({value, label, note, accent, spark, epi, go})`
```html
<button class="tile a-g" data-go="subject:Surgery">
  <span class="tile-v num">14,062</span>            <!-- --t-stat tabular; serif ONLY if .is-hero -->
  <span class="tile-l">MCQs · SURGERY</span>          <!-- --t-label uppercase -->
  <span class="tile-n">Marrow + Cere + Doc</span>     <!-- --t-meta, 1 line ellipsis -->
  <svg class="tile-spark">…</svg>                     <!-- optional micro-sparkline, --accent stroke -->
  <i class="epi proxy" title="…">proxy</i>           <!-- corner micro-badge; collapses to 4px dot on mobile -->
</button>
```
- `accent` ∈ `m|c|k|g` → leading 3px categorical bar (existing `.stat::before`). `go` makes the tile a
  **router link** — the relational hook (an Overview KPI for "Surgery" routes to its Subject page).
- **Desktop:** `repeat(auto-fit,minmax(190px,1fr))`. Value `--t-stat`; serif upgrade ONLY on the lone
  `.is-hero` tile. **Mobile (≤640):** 2-col (3-col ≥414), height **84–104px**, pad 10–14px, value 18–22px
  sans tabular (existing `.stat` mobile rule). Tap target = whole tile (≥44px). Reuses `.stat` CSS, renamed `.tile`.

### 2.2 `listRow({lead, title, sub, trail, go, done})` + `groupList(rows)` — the inset-grouped workhorse
`groupList` wraps rows in ONE rounded `--r-2` container with internal 1px `--line` dividers (iOS inset-grouped
feel) — **NOT N floating cards.** Replaces `.mini-row`, `.row.mrow`, `.vrow`, `.cat-head` with one primitive.
```html
<div class="lgroup">
  <a class="lrow" data-go="faculty:fac-x">
    <span class="lrow-lead dot" style="--c:var(--p-marrow)"></span> <!-- dot / rank-num / ★★★ -->
    <span class="lrow-main"><span class="lrow-title">Acute Pancreatitis</span>
      <span class="lrow-sub">Surgery · Marrow · 142 MCQs</span></span>
    <span class="lrow-trail">…value / consensus mark / chips / ring…</span>
  </a>
  <!-- more rows, hairline between via :not(:first-child){border-top:1px solid var(--line)} -->
</div>
```
- **Height 48px** (`--row-h`, in 44–56 band); hit area ≥44px; one container border/radius.
- **DESKTOP density trail (grafted from B — five facts in one row):** the trail may render a multi-cell strip:
  **consensus mark + per-platform density sparkbar + your-progress micro-ring + best-platform chip** — five
  facts (name, consensus, per-platform coverage, your progress, best platform) in one 48px row.
- **Mobile:** title + sub stack (2 lines max), single right-aligned trail value/mark.

### 2.3 `epiBadge(tag)` / `epiDot(tag)` — re-export existing `epiBadge`; ADD `epiDot`
Tiny pill, `border:1px solid currentColor`, label-coded color, `cursor:help`, `title=epiDesc(tag)`, 10px
`--t-micro`. `epiDot(tag)` = 6px square + `title`/`aria-label` for dense rows / tile corners. Tapping either on
mobile opens the "How we rate" sheet anchored to that tag. **Contract: every figure that is not a raw
`measured` count carries one.**

### 2.4 `srcLink(id)` / `srcLine(ids, captured)` / `platRefChip(ref)` — re-export existing; extend
- `srcLine(ids, captured)` → `Source: §a · §b · captured 26 Jun 2026` (the plate **colophon**).
- `platRefChip(ref)` **extended:** renders a **router link** (`data-go="platform:marrow"`) when the ref has a
  real `platformId`; renders a muted non-link (`.platlabel.off` + "not yet integrated" note) when
  `platformId:null` (PrepLadder/eGurukul). Core relational + seam-honesty affordance.

### 2.5 `segmented(opts, current, name)` — generalize existing `.seg`
Inline-flex pill group; active pill platform-tinted (`.seg.marrow button.on`). **Mobile:** horizontal-scroll on
overflow (existing rule); as a toolbar filter it may collapse to an icon-button → `openSheet`. One segmented
control per toolbar, never stacked.

### 2.6 `openSheet(title, opts, current, onPick)` / `readPlateSheet(epi, srcIds, captured)` — re-export existing + ADD
`openSheet` is the mobile sort/filter/quick-action target (drag-handle, `max-height:80vh`, `--e3`). ADD
`readPlateSheet` (from A): on touch, tapping a plate's imprint badge opens a sheet explaining that epistemic
label (`epiDesc`) + listing full sources — the touch answer to hover-tooltips.

### 2.7 `panel({title, epi, sourceIds, captured, body, actions})`
Section container for non-chart content. Header = serif `h3` + `epiBadge` + `ph-actions`; `srcline` under
header. **`epi` + `sourceIds` are MANDATORY params when body holds curated data** — the firewall is enforced at
the component boundary. Desktop pad 26px (may sit in `panel-grid`); mobile pad 13–14px, full-width.

### 2.8 `chartFrame(title, epi, sourceIds, captured, svgOrHtml, {legend, note, plateNo})` — **THE ENGRAVED PLATE (keystone)**
Single wrapper EVERY chart MUST pass through. **API shape makes it structurally impossible to render a viz
without `(epi, sourceIds, captured)`.** Styled as A's engraved plate: ground `--plate`, 1px `--plate-edge`
frame, auto-incremented `Pl. N` number (per-`renderX` closure counter, serif small-caps — the "annual" feel),
serif caption, and the **imprint line = the colophon** (epistemic badge inline at start + `srcLine`).
```html
<figure class="cframe plate">
  <figcaption class="cf-head">
    <span class="plate-no">Pl. 3</span>
    <span class="cf-title">Subject × platform — MCQ density</span>
    <span class="epi proxy" title="…">proxy</span>
    <div class="cf-legend">…ramp key / categorical swatches…</div>
  </figcaption>
  <div class="cf-plot"><svg viewBox="…">…</svg></div>
  <div class="cf-imprint srcline">Source: §… · captured 26 Jun 2026</div>
</figure>
```
- **Desktop:** plot uses available width; legend inline-right of title; full plate-mark.
- **Mobile:** title row wraps; legend moves below plot; frame thins (4px plate-mark, 10px pad); imprint stays
  9.5px. **SVG uses `viewBox` + `width:100%;height:auto` so it never overflows the page.** Tap imprint badge →
  `readPlateSheet`; tap a data point → detail sheet.

---

## 3. CHART VOCABULARY (`js/ds.js`; CSS `css/charts.css`)

All charts are **inline SVG (or CSS-grid) strings** (crisp, themeable via `var()`, no canvas/deps), wrapped by
`chartFrame`. **Gridded-chart discipline (from B): faint `--grid` baseline gridlines + axis ticks + value
labels at data points** so charts read as *measurements*, not illustrations. Numbers come straight from `D`.

### 3.1 `heatmap(rows, cols, valueFn, {mode})` — Subject × Platform — **the hero relational viz**
- **Binds:** rows = canonical subjects (`[...new Set(QBANKS.flatMap(p=>freshSubjects(p).map(s=>canon(s.subject))))]`);
  cols = **the 3 integrated platforms ONLY**; cell = per-subject MCQ density (sum of `mcqs`, bucketed to
  `--y0..--y5` by within-row rank). Empty cell (`--con-none` hairline) where a platform lacks the subject.
  **Counts measured; the bucketing is proxy → frame epi = `proxy`.**
- **DUAL ENCODING (grafted from A):** the cell that `D.subjectStrength` names strongest for that subject gets a
  **gold hairline ring** (`--con-two` stroke) — a second, separately-labelled `directional` overlay. The legend
  carries BOTH: a sequential ramp key (`proxy`) AND a "gold ring = community-reputed strongest, directional"
  swatch with its own `srcLine(D.subjectStrength.sourceIds, captured)`.
- **Approach:** CSS-grid of `<button class="hm-cell">` (tappable). `grid-template-columns:120px repeat(3,1fr)`.
  Column header = platform-colored label (categorical). Row label = subject (click → Subject page). Cell shows
  count at ≥420px; tap → detail sheet "Surgery on Marrow: 1,204 MCQs (measured)."
- **Mobile (NO page scroll — grafted from A's ≤3-fixed-columns rule):** exactly 3 integrated columns shrink to
  initials (M/C/D) + color dot at `--cell-m`; the grid is **sized to the column count so it NEVER horizontal-
  scrolls.** Below ~360px collapse to top-N subject rows + "show all." **PrepLadder/eGurukul are NEVER added as
  columns** (no content); an optional "+2 reputation-only" marker opens the strength matrix instead.

### 3.2 `consensusMark(topicCanon)` — Consensus indicator (most information-rich viz)
- **Binds:** for a canonical topic/subject, how many of the 3 independent integrated platforms flag it
  high-density (`priority===3` / top `hyScore` tier) via `bestCrossByPlat`/`scoredCross`. 0–3.
- **Approach:** 3 small pips (one per platform) in a row; **each pip OUTLINED in its platform color** (so you
  see WHICH agree) and **filled by `conFill(n)`** (so you see HOW MANY agree — deeper gold = more). Inline glyph
  variant `◔◑●` for list-row trailing slots. Distinguishes agreement (≥2, deep gold) from lone signal (1, straw).
- **Mobile:** fits a list-row trailing slot at fixed width (no overflow).
- **Epi/source:** label `proxy` (density proxy + cross-match heuristic — explicitly NOT measured exam consensus;
  tooltip/`readPlateSheet` spells this out). Reputation part references `subjectStrength.sourceIds`.

### 3.3 `rankedBars(items, valueFn, colorFn)` / `treemap(items)` — mass / where-to-spend
- **Binds:** MCQ mass by subject (or by platform within a subject). `colorFn` = `platColor` for platform
  breakdowns; `yieldFill` for single-metric magnitude.
- **rankedBars (default, mobile-safe):** horizontal bars, label-left (click → entity), value-right tabular,
  sorted desc, with `--grid` baseline + tick. Generalizes existing `.bars/.barrow`.
- **treemap (desktop ≥1024 ONLY):** squarified `<rect>` tiles sized by mass, filled `yieldFill`, label if tile
  big enough. **Mobile auto-degrades to `rankedBars`** (treemaps unreadable narrow) — same data, different shape.
- **Epi/source:** `measured` for counts; `proxy` if sorted by density.

### 3.4 `sparkline(series)` / `smallMultiples(seriesByKey)` — Progress over time
- **Binds:** test timeline (`D.tests` GT/CoreBTR scores over dates), per-subject accuracy (`subjectAccuracy()`),
  tracking momentum (`Store.state.progress[].ts` — local → `measured` for YOUR data). Draws only where a real
  series exists; a single point renders as a dot + "1 test" (no fake trend).
- **Approach:** `<polyline>` stroke `--ink-2` 1.5px on a faint `--grid` baseline, last-point dot, min/max ticks,
  value labels (gridded discipline). `smallMultiples` = grid of tiny sparklines (one per subject) — small
  multiples beat one giant numeral; this is the Progress hero.
- **Mobile:** sparkline fits a stat-tile (`--spark-h` 26px) or row trail; small-multiples → 2-col grid.
- **Epi/source:** `measured` (local; imprint "your tracked activity, this device").

### 3.5 `facultyTimeline(faculty)` — Career timeline — **the un-buildable-by-incumbents viz**
- **Binds:** `faculty.affiliations[]` = `{platformId|name, role, subjects[], from, to, status}`,
  status ∈ `current|past|solo|superspecialty`. Renders ONLY from seeded sourced data; **gated** empty-state if
  `D.faculty` absent.
- **Approach (combined A+C encoding):** a true time axis (horizontal desktop / vertical mobile) with year ticks.
  Each affiliation = a segment positioned by `from..to`, **colored by platform (`platColor`) = WHO**, with
  **status encoded by edge/fill style (from A) = WHEN/STATUS:** `current` solid + capped "now"; `past` muted;
  `solo`/`superspecialty` gold-edged + `--ink-3` (no platform). Open-ended (`to:null`) → arrowhead to today.
  The *movement between platforms* (left Marrow → solo) is the story no incumbent can show. Each node links to
  the **Platform page**.
- **Mobile:** vertical timeline (reuse existing `.timeline`/`.tl`), node platform-colored, date + role + subjects.
- **Epi/source:** every segment `directional` (seed) + per-affiliation `sourceIds` → `srcline`. Caption:
  "career history, public sources — directional seed. Aggregate, community-sentiment, not endorsement."

### 3.6 `ratingScorecard(apps | faculty.ratings, mode)` — Rating scorecard (neutral)
- **(a) Platform reliability** (`mode:"reliability"`) — `D.reliability.apps[]`: name (platRefChip, `.off` for
  seam apps), a **5-pip star meter** (filled to `rating/5`, `--gold`), numeric rating tabular (`~` prefix when
  `ratingApprox`), `ratingsLabel`, recurring `themes[]` as small `.tag` chips **each prefixed by a 6px `--warn`
  DOT — never a bar that shames (grafted verbatim from B).** `public-3p`, dated, per-row `srcLink(sourceId)`.
  Includes PrepLadder/eGurukul (`platformId:null` → muted, non-link name).
- **(b) Faculty ratings** (`mode:"faculty"`) — `ratings.profile` (votes, gated `verifiedVia:"in-app-activity"`,
  greyed "verified voting opens with accounts") + `ratings.videoByPlatform[]` (rolled-up, per-platform mini-rows
  + `n`). Seed = `directional`. **Aggregate-only; NEVER a "worst faculty" board** — only the individual's own
  per-subject strengths as community sentiment.
- **Mobile:** uses existing `.resp` table → stacked label:value cards; star meter + numeric on row 1; themes
  wrap. Pips read-only.
- **Epi/source:** mandatory per-row `epi` + `srcLink`; "How we rate" link in panel header.

---

## 4. ENTITY-PAGE LAYOUTS (`js/entities/{subject,platform,faculty}.js`)

Three new `<section>`s in `index.html`: `#view-subject`, `#view-platform`, `#view-faculty`. `main.js` routes
`goSubject(canon)/goPlatform(id)/goFaculty(id)` via `data-go="subject:…|platform:…|faculty:…"` delegated in
`appClick`, pushes a hash (`#/subject/Surgery`) for real back-button, renders into the section. A slim **entity
header** (back chevron + breadcrumb eyebrow + entity name + the ONE hero number) tops each. **Cross-links are
everywhere — the Subject↔Platform↔Faculty triangle IS the IMDB graph.** `⌘K` palette indexes subjects + tests +
modules + **platforms + faculty** (`.pal-type` rows). Every name routes.

### 4.1 SUBJECT page — `renderSubjectPage(canon)`
**Desktop (≥1024, multi-panel via `panel-grid` `1.1fr .9fr` then a 3-col band):**
```
‹ back · SUBJECTS / Surgery        Surgery        [hero: 14,062 MCQs]  epi: measured  [open in QBank]
┌ COVERAGE × YIELD (Pl.1) ──────────────┬ CONSENSUS HIGH-YIELD TOPICS (Pl.2) ──────────────┐
│ 1-row heatmap, this subject × 3 plats │ topics where ≥2 agree: topic · consensusMark ·   │
│ cells = density [proxy] + gold ring   │ density [proxy] · sourced. click → leaf drawer    │
├ WHO TEACHES IT BEST ──────────┬ VIDEOS ──────────────┬ YOUR PROGRESS ─────────────────────┤
│ best-platform (subjectStrength │ videosForLeaf rows,  │ smallMultiples + sparkline          │
│ directional) + faculty roster  │ link → Faculty/Plat  │ attempted/reviewed [measured,local] │
│ (gated) → Faculty pages        │                      │                                     │
```
**Mobile (density):** compact header (hero 30–34px, "open in QBank" icon-button). **2-col stat-tile strip = 6
tiles above fold:** MCQs (measured) · density rank (proxy) · best platform (directional) · your % (measured) ·
#faculty · #videos. ONE sticky toolbar = segmented **Coverage / Consensus / Teachers / Videos / You** swapping
the panel below (single-panel-at-a-time keeps density). Heatmap collapses to its single 3-cell row inside a
`chartFrame`.

### 4.2 PLATFORM page — `renderPlatformPage(id)`
**Desktop:**
```
‹ back · PLATFORMS / Marrow      Marrow      [hero: 4.7★ ~33k]  epi: public-3p · 26 Jun 2026  [How we rate]
┌ RELIABILITY SCORECARD (Pl.1) ─────────┬ COVERAGE BY SUBJECT (Pl.2) ───────────────────────┐
│ ratingScorecard row + theme chips      │ rankedBars of MCQ mass by subject (measured),     │
│ (warn = 6px dot) [public-3p, sourced]  │ bars → Subject pages; treemap on desktop ≥1024     │
├ FACULTY ROSTER (gated) ────────────────┴ YOUR TRACKING ON THIS PLATFORM ───────────────────┤
│ faculty whose affiliations include this │ rollup of your ticks (attempted/reviewed)         │
│ platform (incl. status:past) → pages    │ [measured, local]                                 │
```
For `platformId:null` apps shown elsewhere: a Platform page is NOT generated (no content) — they remain
reputation-only chips. **Mobile:** hero 4.7★; 6-tile strip (rating · count · #subjects · #faculty · your
attempted · your reviewed); segmented Reliability / Coverage / Faculty / You; coverage = rankedBars (treemap is
desktop-only); themes wrap as `.tag` chips.

### 4.3 FACULTY page — `renderFacultyPage(id)`
**Desktop:**
```
‹ back · FACULTY / Dr. …    Dr. … aka "…"   [hero: 4.6 community ★]  epi: directional · seed
┌ CAREER TIMELINE (Pl.1, facultyTimeline — horizontal axis) ──────────────────────────────────┐
│ Marrow(current) ── PrepLadder(past) ── Solo(superspecialty); platform-colored + status-edged  │
│ each segment → Platform page; [directional, sourced per segment]                               │
├ TWO RATINGS (Pl.2, directional) ──────┬ SUBJECTS TAUGHT + LINKED PLATFORMS ───────────────────┤
│ profile votes (verifiedVia chip) +     │ subject chips → Subject pages; platform chips →        │
│ rolled-up video rating [directional]   │ Platform pages; videos by this faculty (facultyId)     │
```
**Mobile:** header (hero community rating 30–34px, "directional · seed" badge prominent); 6-tile strip
(#platforms · #subjects · years active · profile ★ · video ★ · #videos); **vertical** timeline; ratings stacked;
subject/platform chips wrap. **Empty/seed state when `D.faculty` unpopulated:** honest panel "Faculty profiles
are being seeded (directional, sourced). N profiles live." — never fabricated; nav entry hidden.

---

## 5. PER-TAB RE-SKIN (7 tabs adopt the system + gain entity links + earn ≥1 relational viz)

All tabs keep their function and `Store` seam. `renderX` moves to `js/surfaces/X.js`, recomposed from primitives.

| Tab | Re-skin | Relational viz earned | Entity nav |
|---|---|---|---|
| **Overview** (atlas home) | ≥6 tappable stat-tiles (combined MCQs [hero serif, measured] · attempted% · reviewed · top-density% [proxy] · density gaps [proxy] · tests scored). "Continue" + "next moves" groupLists. | **subject×platform heatmap** (hero, proxy) + **consensus** mini-list + **reliability scorecard** strip (public-3p). "Do next" → weakest Subject page. | every subject/platform name → entity page; "How we rate" → methodology sheet. |
| **QBank Tracker** | keep sidebar + dense leaf rows; re-skin rows to `listRow` with density-sparkbar trail; ONE sticky toolbar (existing `.qb-controls`). | subject hero gets a **3-cell heatmap** + per-leaf **`consensusMark`** (upgrades existing `coverageBadge`/`xcov`). | subject hero → Subject page; cross-cov chip → Platform/Subject. |
| **Progress** | replace giant numerals with **`smallMultiples`** per subject (test-score series + accuracy) + micro-ring per row. | **small-multiples grid** + exam-level sparkline. | row → Subject page. |
| **Tests & Scores** | keep editable entry table (Store); add accuracy **sparkline** header + per-subject accuracy mini-bars. | **sparkline** of GT scores over time. | test subject tag → Subject page. |
| **High-Yield** | reframe explicitly as **proxy density + consensus**; every figure `proxy`-badged. | **rankedBars of density by subject with `consensusMark`**, consensus-ranked (≥2 agree float up). | name → Subject page; topic → drawer. |
| **Videos** | `listRow` rows; add **faculty chip** (when `D.videos[].facultyId` seeded) → Faculty page; "related QBank modules" → Subject/leaf. | coverage/confidence mini-bar; faculty rollup feeds Faculty page. | faculty chip → Faculty; suggested leaf → drawer/Subject. |
| **Study Planner** | tiers → inset groups; KPI row → tiles. | **rankedBars of "mass remaining" by subject** (what to spend on, proxy). | tier item → Subject page. |

**Navigation model:** desktop top-tabs + entity routing; mobile bottom-nav (6) + entity pages pushed full-view
with back chevron. Entity views start empty, render only on navigation (console stays clean).

---

## 6. BREAKPOINTS / TWO-LAYOUTS RULE (one system; desktop "uses the width," mobile "hits density")

**One design system, two layouts, driven by the existing split:** **viewport media queries drive app chrome**
(header, bottom-nav, sheets, sticky sidebars); **container queries drive in-panel reflow**
(`.view{container-type:inline-size}`, already in place). One render path — components don't fork; only token
values + a few `grid-template-columns` swap.

- **Breakpoints:** `≤640px` = mobile (bottom-nav, sheets, compact header, 2/3-col tiles, single-panel entity
  pages); `641–1023px` = tablet (inline controls return, 2-col panel grids, drawer not sheet); `≥1024px` =
  desktop (multi-panel entity pages, **treemap unlocked**, heatmap full width); `≥1480px` capped by `--container`.
- **Starting CSS (grafted from B — copy-paste-ready):**
```css
.inst-grid{display:grid;gap:var(--gap);grid-template-columns:1fr 1fr}
.inst-grid.full{grid-template-columns:1fr}
@container (max-width:760px){ .inst-grid{grid-template-columns:1fr} }      /* MOBILE = density: stack */
.tiles{display:grid;gap:8px;grid-template-columns:repeat(2,1fr)}
@container (min-width:415px){ .tiles{grid-template-columns:repeat(3,1fr)} }
@container (min-width:760px){ .tiles{grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:var(--gap)} }
.cf-plot svg{width:100%;height:auto;display:block}                        /* charts scale fluidly */
.panel-grid{display:grid;gap:var(--gap);grid-template-columns:1.1fr .9fr}
@container (max-width:820px){ .panel-grid{grid-template-columns:1fr} }
```
- **Desktop uses the width:** entity pages + Overview → `panel-grid`/`inst-grid` multi-panel; heatmap cell 34px;
  treemap + side-by-side panels on. **Mobile hits density:** SAME components shrink via the mobile token layer —
  tiles 84–104px 2/3-col, rows 48px inset-grouped, ONE sticky toolbar, charts collapse (heatmap → 3 fixed
  cols/initials; treemap → rankedBars; timeline → vertical). Hero number 30–34px, exactly one per screen.
- **NO horizontal scroll 320–1920:** charts size to column COUNT (not width); heatmap ≤3 fixed columns; treemaps
  degrade; tables → `.resp` cards; `min-width:0` on ellipsis cells. Only overflowing `.seg` scrolls internally.
  `body`/`main` never scroll horizontally. Verify at 320/375/414/768/1024/1440/1920.

---

## 7. DEFINITION OF DONE — per surface (tied to measurable bars)

**Global (every surface):** `node --check` passes on every new `js/*.js`; console clean; no horizontal scroll
320–1920; almanac identity retained (warm, never neon); `Store` seam untouched, no network; TOTAL **56,091**
preserved (read, never recompute); `build_data.py` source-integrity guard intact (+ faculty `_collect_refs`
hook). Every non-`measured` figure carries `epiBadge` + `srcLine` via `chartFrame`/`panel`. **`grep` lint:
`--t-hero` used exactly ONCE per `renderX` (the one-hero-serif bar).**

- **Overview** — [ ] ≥6 stat-tiles above fold at 375×812, each 84–104px, tappable → entity. [ ] subject×platform
  heatmap present, `proxy`-badged + sourced, dual gold-ring overlay legended. [ ] consensus mini-list +
  reliability scorecard (warn = 6px dot). [ ] one hero serif numeral. [ ] "How we rate" reachable.
- **QBank Tracker** — [ ] leaf rows are `listRow` (48px, hairline, one inset container), not cards. [ ] ONE
  sticky toolbar (slim search + sort/filter icon→sheet + pills). [ ] subject hero = 3-cell heatmap +
  `consensusMark` per leaf. [ ] fold = toolbar + ≥4 rows.
- **Progress** — [ ] giant numerals replaced by smallMultiples/sparklines (gridded: baseline + ticks + value
  labels). [ ] rows → Subject pages. [ ] `measured` (local) labelled.
- **Tests & Scores** — [ ] entry table still editable (Store). [ ] score sparkline present, `measured`. [ ] rows
  → Subject pages.
- **High-Yield** — [ ] every figure `proxy`-badged. [ ] rankedBars + consensusMark, consensus-ranked. [ ] names
  → Subject pages.
- **Videos** — [ ] rows are `listRow`. [ ] faculty chip → Faculty page (when seeded; gated otherwise). [ ]
  related-module suggestion → Subject/leaf.
- **Study Planner** — [ ] tiers are inset groups. [ ] "mass remaining" rankedBars (proxy) → Subject pages.
- **Subject page** — [ ] hero number + ≥6 mobile tiles. [ ] heatmap row + consensus + who-teaches-best +
  videos + progress, each labelled + sourced. [ ] every name links (triangle). [ ] mobile = single-panel
  segmented swap, no horizontal scroll.
- **Platform page** — [ ] hero 4.7★ public-3p + date. [ ] scorecard (warn dot) + coverage bars + faculty roster
  (gated) + your tracking. [ ] subjects/faculty link. [ ] PrepLadder/eGurukul get NO Platform page.
- **Faculty page** — [ ] career timeline (platform color + status edge, each segment sourced directional). [ ]
  two ratings, aggregate-only, NO "worst" board, `verifiedVia` shown. [ ] gated empty-state + hidden nav when
  `D.faculty` absent. [ ] subject/platform chips link.

---

## 8. BUILD ORDER (incremental; each step ships green)
1. `css/tokens.css` + `css/components.css` + `css/charts.css` (additions only; old `styles.css` coexists, then retire).
2. `js/core.js` — move existing helpers + add `yieldFill`/`platColor`/`conFill` + faculty helpers
   (`FACULTY`/`facById`/`facultyForSubject`/`facultyForPlatform`/`videoFaculty`, all null-guard `D.faculty`).
3. `js/ds.js` — components + chart library (heatmap/consensus/rankedBars/treemap/sparkline/smallMultiples/
   facultyTimeline/ratingScorecard) + `chartFrame` (plate + imprint + `Pl. N` counter) + `readPlateSheet`.
4. Re-skin tabs to primitives (`js/surfaces/*.js`) — visual swap, same data/Store.
5. `js/entities/*.js` + `#view-*` sections + `main.js` routing (`data-go`, hash, palette index platform/faculty).
6. `_raw/curated/faculty_seed.json` → emit `D.faculty[]` via `build_data.py` hook + `_collect_refs` guard
   extension; run `python3 build_data.py` (must still print combined 42889 / Doc 13202 / all refs resolve).
7. Verify at 375×812 + 1024 + 1920; `node --check` every module; console clean; remove old `app.js`/`styles.css`.
