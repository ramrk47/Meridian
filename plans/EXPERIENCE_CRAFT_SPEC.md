# EXPERIENCE_CRAFT_SPEC — Craft Elevation Pass (Phase 1c.2-craft)

**Status:** the contract for builders. Additive only. Every existing feature, datum, route, and
tracking interaction MUST keep working. This spec takes Meridian from "correct + clean" to
ARTISTIC / METICULOUS / CUTTING-EDGE — a fine printed annual that happens to breathe.

> Read first: `plans/EXPERIENCE_DESIGN_SPEC.md` (design system), `plans/_overhaul_wip/MODULE_MANIFEST.md`
> (global API + load order). This spec ASSUMES those and only adds.

---

## 0. ETHOS (the taste bar — non-negotiable)

Cutting-edge but **calm**. Editorial almanac, not a startup dashboard. Motion is purposeful and quiet
(cross-fades, gentle rises, draw-ons) — NEVER bouncy / springy / neon / techy. Charts animate **ONCE
on entrance, never on reflow**. Animate **transform / opacity only** (GPU). Honor
`prefers-reduced-motion` EVERYWHERE (full function, zero motion). Feature-detect everything
cutting-edge; the existing synchronous path IS the fallback.

### HARD GUARDRAILS (auto-fail if violated)
- **Non-regressive:** never remove/break working code, data wiring, routes, tracking. Works fully
  with motion DISABLED and on browsers lacking View Transitions / `@property` / `text-box-trim`.
- **3 standards intact:** mobile density bars (≥6 KPI tiles above fold on Overview; QBank toolbar +
  ≥4 rows; 44–56px rows; one hero serif numeral) · neutrality firewall (every datum keeps its
  epistemic label + source; motion must NEVER hide/obscure/animate-away a label; faculty stays
  aggregate/directional) · warm almanac identity, never neon.
- **Vanilla / local-first:** no framework / bundler / ES-module import-export / CDN / deps; no network
  calls; `storage.js` seam untouched; console clean; no horizontal scroll 320–1920.
- **Preserve:** build total **56,091** + `build_data.py` source-integrity guard. `node --check` every
  JS file; `python3 build_data.py` stays green (combined 42889, DocTutorials 13202, faculty 14,
  "all source refs resolve"). CSS bytes do NOT count toward the 56,091 total.

---

## 1. SHARED PRIMITIVES

### 1.1 Motion tokens — the single motion contract (`css/tokens.css`, inside `:root`)

Promote the ad-hoc decelerate curve already used on drawer/sheet to canonical, and put durations on a
40ms grid inside the 120–320ms band. Day + evening share these (motion is theme-agnostic; do NOT
re-declare in `body.evening`).

```css
:root{
  /* ── MOTION: easing ── */
  --ease-rise:cubic-bezier(.22,.61,.36,1);  /* decelerate/settle — rises, bars, drawers (canonical) */
  --ease-soft:cubic-bezier(.4,0,.2,1);       /* symmetric cross-fades */
  --ease-exit:cubic-bezier(.4,0,1,1);        /* overlays leaving */
  /* ── MOTION: duration (40ms grid, 120–320ms band) ── */
  --d-1:120ms;  /* taps / press / focus ring */
  --d-2:180ms;  /* chips, segmented slide, tile hover, tooltip */
  --d-3:240ms;  /* view cross-fade, palette, count-up, reveal */
  --d-4:320ms;  /* drawer / sheet / entity push, bar/sparkline draw-on */
  --stagger:28ms; /* one sequenced-reveal unit */
}
```

**Sweep (single source of truth):** replace hardcoded transition values with these tokens —
- `css/components.css`: the seven bare `transition:.15s`/`.12s` → `--d-2`; drawer/sheet `.34s`/`.3s`
  → `--d-4`; `.pbar i` `.5s` width → `--d-4`.
- `css/charts.css` `.bar` `.7s`, `css/tests.css` progress `.6s`, `css/qbank.css` `.meter/.bm-bar` `.4s`
  → bring into band (`--d-3`/`--d-4`) AND convert to entrance-only (see §1.6 / §4-conventions).

### 1.2 Reduced-motion + contrast + data firewall (`css/tokens.css`, bottom of file)

There is currently **zero** reduced-motion handling anywhere — this is the prerequisite for shipping
anything below.

```css
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.01ms!important; animation-iteration-count:1!important;
    transition-duration:.01ms!important; scroll-behavior:auto!important;
  }
  .view{animation:none}
}
@media (prefers-contrast:more){
  :root{--line:#cbbfa8;--line-2:#a99e85;--ink-3:#5a5247;--ink-4:#8a8073}
  body.evening{--line:#4a3f33;--line-2:#5c5040}
  .tile,.panel,.cframe.plate{border-width:1.5px}
  .epi,.epidot{outline:1px solid currentColor}
  .paper-grain{display:none}
}
@media (forced-colors:active){
  .hm-cell{border:1px solid CanvasText}
  .chip.on,.sb-item.on{forced-color-adjust:none}
  .tab.active::after{background:Highlight}
}
```

Also move `html{scroll-behavior:smooth}` (currently unconditional at tokens.css L135) so smoothness
only applies when motion is allowed:
```css
html{scroll-behavior:auto}
@media (prefers-reduced-motion:no-preference){ html{scroll-behavior:smooth} }
```

### 1.3 `js/core.js` — live motion guard (add near the format helpers)

A **live** matchMedia query (NOT a cached boolean) so an OS toggle mid-session is honored:
```js
const RM = matchMedia("(prefers-reduced-motion:reduce)");      // .matches re-read at call time
const MOTION_OK = () => !RM.matches;                            // call it; never cache the value
const VT_OK = () => !!document.startViewTransition && MOTION_OK();
```
Every JS animation below early-returns to its FINAL state when `!MOTION_OK()`.

### 1.4 `js/motion.js` — tiny shared helper API (NEW FILE)

New module, **global scope** (no import/export), loaded in `index.html` + `sw.js` SHELL **after
`js/ds.js`, before the surfaces** (it depends on `el/fmt/MOTION_OK`, and surfaces/main consume it).
Add to MODULE_MANIFEST load order. Every function is reduced-motion + feature-detect guarded and is a
**no-op-but-correct-final-state** when guards fail.

```js
/* js/motion.js — paper-soft motion helpers. All guarded; all GPU (transform/opacity). */

// One shared IntersectionObserver for ALL entrance effects (count-up, chart intro, reveal).
// Created lazily; fires each target ONCE then unobserves (guarantees once-only, survives reflow).
function observeOnce(el, fn){…}            // internal: adds to the shared IO, fn(el) on first ~15% visible

// Wrap a DOM swap in a View Transition when supported + motion-ok; else run synchronously (fallback).
function viewTransition(swap){              // swap:()=>void  (does the classList toggles + RENDER)
  if(VT_OK()) document.startViewTransition(swap); else swap();
}

// Scroll-reveal: gentle rise+fade ONCE on entrance. els = NodeList/array of [data-reveal] nodes.
// Sets inline --i (capped at 4) for stagger; adds .in via the shared IO. Fail-safe: a rAF after
// first paint force-adds .in to anything still hidden (content is NEVER stuck invisible).
function reveal(els){…}

// Count-up on ONE numeric element. Reads data-count (raw int); formats each frame through fmt()
// (en-IN grouping). Honors reduced-motion (instant set to final). easeOutCubic, ~--d-3..--d-4, once.
function countUp(el){                       // el carries data-count="56091"; text already = final string
  if(!MOTION_OK()){ return; }               // leave the inline final text untouched
  …rAF loop, snap exactly to target on last frame…
}

// Chart entrance. svgEl|cframe carries the chart; adds .is-in once visible to trigger CSS keyframes
// (bars scaleX from baseline, heatmap cells stagger-fade via --i, sparkline draw-on via dashoffset).
// JS only sets the class + per-cell --i; ALL animation lives in css/charts.css (so reduced-motion
// firewall collapses it). No-op final-state when !MOTION_OK (CSS already renders final).
function chartIntro(cframeEl){…}
```

**Wiring point:** `init()` (main.js) creates nothing extra — `motion.js` owns its lazy shared IO.
Surfaces call `reveal($$("[data-reveal]", viewEl))`, `countUp($(".tile.is-hero .tile-v[data-count]"))`,
and `chartIntro` per `.cframe.plate` **after** each `renderX()` (or once via a post-render hook in
`show()`/`renderXView`). Re-render must NOT re-animate: the shared IO unobserves after firing, and
reveal/countUp guard on a `data-done` flag.

### 1.5 View Transitions integration plan

**DOM swaps to wrap** (all via `viewTransition(swap)`):
- `show(view)` (main.js L328) — wrap the `.view` toggle + `RENDER[view]()` body.
- `renderSubjectView` / `renderPlatformView` / `renderFacultyView` (L122–124) — wrap the
  `renderXPage() + showEntity()` body. (These are the router-side painters; wrapping here covers
  goSubject/goPlatform/goFaculty AND Back/refresh routing in one place.)

**Fallback:** `viewTransition` runs `swap()` synchronously when `!VT_OK()` → today's exact behavior.
Because View Transitions snapshot the live tree, the existing `window.scrollTo({top:0})` in
`showEntity` stops reading as a jump-cut.

**Default style** (`css/components.css`) — calm editorial cross-fade + gentle rise that matches the
current `.view` fade vocabulary (NOT the browser's default slide):
```css
::view-transition-old(root){animation:vt-out var(--d-3) var(--ease-soft) both}
::view-transition-new(root){animation:vt-in  var(--d-3) var(--ease-rise) both}
@keyframes vt-out{to{opacity:0}}
@keyframes vt-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
/* directional Back cue (set documentElement.dataset.vtDir='back' in goBack() one frame before
   history.back(); clear in transition.finished). New enters from above, old exits downward. */
[data-vt-dir=back]::view-transition-new(root){animation:vt-in-back var(--d-3) var(--ease-rise) both}
@keyframes vt-in-back{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
```

**Shared-element hero (ONE pair per navigation, optional enhancement):** just before the transition
in `goSubject/goPlatform/goFaculty`, tag the clicked source element
(`e.target.closest('[data-go-*]').style.viewTransitionName='entity-hero'`) and have the entity painter
set the hero numeral/name to the same `view-transition-name`. Clear BOTH in `transition.finished.then`.
Keep it to a single hero pair (calm, not a swarm). Fully gated; without support the instant render is
unchanged. `view-transition-name` must be unique per frame — assign on click, clear on finish.

### 1.6 Interaction / elevation / texture / focus tokens

**Elevation consolidation (`css/components.css`):** route every one-off overlay shadow through the
existing ladder — `.drawer`/`.pal-box`/`.toast`/`.mob-menu`/`.sheet`/responsive-table-sheet/
`.iconbtn-pop` → top tier uses `var(--e3)`; hover lifts use `var(--e2)`; cards stay `var(--e1)`.
Directional drawers keep their offset but reuse the `--e3` blur/color (one warm studio, drop the cold
near-black tints). **Evening** needs visible overlays — add to `body.evening`:
```css
body.evening{
  --e2:0 8px 24px rgba(0,0,0,.45);
  --e3:0 22px 60px rgba(0,0,0,.6), 0 0 0 1px var(--line-2);  /* hairline ring separates from dusk */
}
```

**Tactile press (`css/components.css`, `css/charts.css`):** unify a quiet letterpress on `:active` for
`.tile.is-link`, `.lrow.is-link`, `.chip`, `.echip`, `.seg button`, `.tbtn`, `.botnav button`,
`.sheet-opt`, `.qmark`, `.pinstar`, `.plate-no`, `.hm-cell`:
```css
.tile.is-link:active,.lrow.is-link:active,.chip:active,.echip:active,.qmark:active{
  transform:scale(.985); transition:transform var(--d-1) var(--ease-rise);
}
.hm-cell:active{transform:scale(.96)}
```
Transform-only (GPU). Reduced-motion firewall collapses it to instant.

**Focus-visible (`css/components.css`):** one two-layer ring that reads on any ground; inset variant
for rounded containers:
```css
:focus-visible{
  outline:2px solid color-mix(in srgb,var(--accent) 60%,transparent); outline-offset:2px;
  box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 16%,transparent);
}
.pal-item:focus-visible,.sheet-opt:focus-visible,.hm-cell:focus-visible{outline-offset:-2px;box-shadow:none}
```

**Selection (`css/tokens.css`):** replace the hard pine block with a warm gold wash that preserves ink:
```css
::selection{background:color-mix(in srgb,var(--gold) 26%,transparent);color:inherit;text-shadow:none}
body.evening ::selection{background:color-mix(in srgb,var(--gold) 34%,transparent)}
```

**Custom scrollbars (`css/components.css`):** none exist today.
```css
html{scrollbar-width:thin;scrollbar-color:var(--line-2) transparent}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:var(--line-2);border:3px solid var(--paper);border-radius:var(--r-pill)}
::-webkit-scrollbar-thumb:hover{background:var(--ink-4)}
::-webkit-scrollbar-track{background:transparent}
.drawer-body,.sheet-body,.pal-list,.ftl{scrollbar-width:thin}
.drawer-body::-webkit-scrollbar,.sheet-body::-webkit-scrollbar,.pal-list::-webkit-scrollbar{width:8px}
```
Token-driven → evening remaps automatically.

**Optional paper grain (`css/components.css` + `js/core.js`):** a single fixed,
`pointer-events:none`, `z-index:-1` `.paper-grain` layer (inline SVG `feTurbulence` data-URI,
opacity ~.025, `mix-blend-mode:multiply` day / `screen` evening). STATIC (no animated noise).
**Off by default**, behind a settings/evening toggle, suppressed under `prefers-reduced-data` AND
`prefers-contrast:more` (already in §1.2). No image asset (keeps vanilla). Zero density/label/route
impact.

### 1.7 Typography refinement tokens (`css/tokens.css` + targeted CSS)

- **Lining-tabular serif numerals** — add to every serif numeral surface
  (`.tile.is-hero .tile-v`, `.hero-num`, `.dr-facts b`, `.pl-kpi b`, `.sh-name` where numeric):
  `font-variant-numeric:lining-nums tabular-nums; font-feature-settings:"lnum" 1,"tnum" 1;`
- **`body{font-optical-sizing:auto}`** so display faces tighten at `--t-hero`.
- **SVG tabular figures** (`css/charts.css`) — `tnum` on body does NOT inherit into SVG `<text>`:
  `.cf-plot text, svg text{font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}`
- **True small-caps eyebrows** — serif-context labels (`.entity-head .eyebrow`, plate caption labels,
  `.pal-type`) → `font-variant-caps:all-small-caps; font-feature-settings:"smcp","c2sc";` Keep sans
  micro-labels uppercase but drop tracking from `.1em`→`.06–.08em` (and `.stat .lbl` `.13em`→`.08em`).
- **Leading scale tokens:** `--lh-hero:0.95; --lh-display:1.12; --lh-body:1.55; --lh-dense:1.3;` apply
  consistently. On `.hero-num`/`.tile-v`, feature-detected `text-box-trim:trim-both;
  text-box-edge:cap alphabetic` to seat caps on the grid (graceful no-op fallback).
- **Measure + wrap** (desktop, pure progressive enhancement): `max-width:62ch` on `.callout`,
  `.fac-bio`, `.cf-note`, `.empty`; `max-width:34ch` on multi-word serif headings; `text-wrap:balance`
  on headings/captions; `text-wrap:pretty` on body prose.
- **Hanging punctuation + ligatures:** `hanging-punctuation:first last` on prose containers;
  `font-feature-settings:"liga" 1,"calt" 1` (+ `"dlig" 1` tasteful) on serif display.
- **Typeset figures (centralize in `js/core.js`):** add `fmtPct(n)` / `fmtDelta(n)` helpers using a
  true minus `−` (U+2212) for negatives and a hair-space before `%`/`★`. Apply in tests/progress/
  reliability deltas. `fmt` itself is UNCHANGED (en-IN, build-guard sensitive).

### 1.8 `@property`-typed tokens (`css/tokens.css`, top, before `:root`)

For smooth tweening of ramp/fill (un-typed custom props can't transition). Graceful no-op where
unsupported.
```css
@property --bar-grow{syntax:"<percentage>";inherits:false;initial-value:0%}
@property --fill-t{syntax:"<number>";inherits:false;initial-value:0}
@property --seg-x{syntax:"<length>";inherits:false;initial-value:0px}
```

---

## 2. CHART-ENTRANCE & INTERACTION-STATE CONVENTIONS

All entrance motion is **entrance-only** (via `chartIntro`/`reveal` + shared IO, `.is-in`/`.in`
class), **never on reflow/Store-toggle**. All keyframes live in CSS under the §1.2 firewall (collapse
to final state). All GPU (transform/opacity/dashoffset).

| Chart | Entrance | Notes |
|---|---|---|
| **heatmap** | cells `opacity 0→1 + scale(.96)→1`, `transition-delay:calc(var(--i)*var(--stagger))`, **cap --i at ~12** | JS sets inline `--i` (cell index); stagger-fade reads left-to-right |
| **rankedBars / treemap** | bars `transform-origin:left; scaleX(0)→1` (NOT width), staggered by row | GPU transform = no layout thrash; replaces the legacy `width` transition |
| **sparkline** | draw-on via `stroke-dasharray`/`stroke-dashoffset`→0 over `--d-4 --ease-rise`; endpoint dot scales in after | static area-fill gradient + endpoint halo (§4 tests/progress) |
| **bars/meters** (`.bar`,`.pbar i`,`.bm-bar`) | first-paint scaleX from baseline ONLY; subsequent `syncAfterToggle` updates are **instant** | add `.no-anim` (or strip the `.is-fresh` carrier class after first transition) during Store-driven `refreshRowEverywhere`/`syncAfterToggle` so a chip tap never re-grows on-screen bars |

**Interaction-state conventions:**
- **Toggle confirm pulse (off→on ONLY):** chips/pin add a transient class for ~340ms
  (`el.classList.add('just-on'); setTimeout(()=>el.classList.remove('just-on'),360)`) →
  `@keyframes chip-imprint` (scale 1→.9→1, paper-soft) + brief inset ring. Fires only at the moment of
  change (never on re-render). Reduced-motion → instant solid fill; state still fully conveyed by color
  + `aria-pressed`.
- **Quick-add (`+ .qmark`):** on activate, morph `+`→`✓` for ~700ms via `.added-flash`, glyph swap
  works even reduced-motion. Keep the existing toast for SR announce.
- **Segmented sliding indicator:** one `<span class="seg-ind" aria-hidden>` per `.seg`; on pick set
  `--seg-x`/`--seg-w` from the active button's `offsetLeft`/`offsetWidth`; indicator transitions
  `transform`+width `var(--d-2) var(--ease-rise)`. Buttons go transparent; the pill carries the tint
  (`.seg.marrow .seg-ind{background:var(--marrow)}`). First paint = no entrance slide (set with
  transition disabled). Reduced-motion → jumps.
- **Palette open/close:** drop `display:none↔block`; animate `.pal-scrim` opacity (`--d-2 --ease-soft`)
  + `.pal-box` `translateY(-6px) scale(.985)→none + opacity` (`--d-3 --ease-rise`) on `.open`; close
  with `--ease-exit`. Logic/scoring/keyboard nav untouched.
- **Custom chart tooltip (replaces native `title=`):** ONE body-appended `.cf-tip` element; a delegated
  `pointermove`/`pointerover` listener reads the existing `data-hm-row/col/raw` (and bar/treemap
  equivalents), renders an almanac plate — row · col, value with its `epiBadge`, gold-ring directional
  note when present. Position via `transform:translate` (GPU), fade `--d-2`. **Touch:** a tap routes to
  the existing `readPlateSheet` so the firewall context is reachable on mobile. Reduced-motion → no
  fade. This is the highest-leverage chart upgrade (native tooltips are invisible on touch today).
- **Link underline grow:** editorial text links (`.srclink`,`.linkbtn`,`.rs-name.is-link`,`.ftl-org`)
  draw underline via `background-image:linear-gradient(currentColor,currentColor);
  background-size:0% 1px;background-position:0 100%;background-repeat:no-repeat` → hover `100% 1px`
  over `--d-2 --ease-soft`.

**Accessibility (ship alongside, all additive):**
- `.sr-only` utility in tokens.css for chart summaries.
- Charts get programmatic summaries: SVG charts `aria-label` (e.g. "Sparkline: rank 142→118 over 6
  tests" — keep epistemic tag in the text); heatmap `role=grid` + visually-hidden caption + per-cell
  `aria-label` (not just `title`); rankedBars row `role=group aria-label="<label>: <value>"`.
- A/R/Rt + `.sb-item` chips get `aria-pressed`/`aria-current` + descriptive `aria-label`
  ("Attempted"/"Reviewed"/"Retaken"), flipped in `syncAfterToggle`/`refreshRowEverywhere`.
- Tablist: roving tabindex + Arrow/Home/End on `#tabs`; `role=tabpanel`+`aria-labelledby`+
  `aria-controls` linking tabs↔`#view-*`. Mirror roving tabindex on `segmented()` pills and the
  heatmap grid (one tab-stop in, arrows between cells).
- `#app` gets `tabindex=-1` so the skip-link lands focus. `trapFocus(container)` shared by
  drawer + sheet + palette; restore focus to `lastFocus`/`palLastFocus` on close.
- Perf: move `setHeaderHeight()`'s `offsetHeight` read into a `requestAnimationFrame` (or a one-time
  `ResizeObserver` on `.topbar`) to kill the write→read→write thrash on every `show()`; scroll-to-top
  uses `behavior: RM.matches?'auto':'instant'` (tab change is always instant, never a 600ms smooth
  fight with the View Transition).

---

## 3. CSS CONSOLIDATION (prerequisite for uniform entrance + tooltip)

The heatmap / sparkline / ranked-bar classes are defined 2–3× across surface CSS and have **drifted**
(qbank cells 38px/6px-radius/shadow-hover vs progress cells 30px/3px/brightness-hover — same component,
two looks). Promote ONE canonical `.heatmap/.hm-*/.rbars/.rb-*/.spark/.spk-*` definition into
`css/charts.css` (which loads after components, before surface CSS); delete the scoped duplicates in
`qbank.css`/`progress.css`/`tests.css` (progress.css already carries the INTEGRATOR "delete this block"
comment); keep only genuinely surface-specific overrides. Standardize legends: one
`linear-gradient(90deg,var(--y0)..var(--y5))` ramp bar + canonical `.lg-ring/.lg-line/.lg-dot` in
charts.css, replacing the hand-rolled per-surface legend markup. Keep every `epiBadge`/directional-ring
note exactly as-is. Re-verify no h-scroll 320–1920 (CSS bytes don't affect the 56,091 total).

---

## 4. PER-SURFACE CHECKLIST

Each surface: wrap nav via `viewTransition`; `reveal()` its `.panel`/`.cframe.plate`; `chartIntro()`
its charts; `countUp()` its ONE hero numeral; route empties through the new `emptyState()` primitive.

### Shared new primitive — `emptyState({icon,title,body,action})` (`js/ds.js`)
Replaces the flat dashed `.empty` box at ~10 sites. Centered block on `--plate` ground with the
engraved hairline (`--e1-plate`) + inner plate-mark rule (`box-shadow:inset 0 0 0 1px var(--plate-edge)`),
a small monochrome inline-SVG mark (quill / open ledger / compass — stroke only, `--line-2`/`--ink-4`,
NEVER color), serif `--t-panel` title, `--t-meta` body, optional `linkbtn` CTA. Reads as "a plate
awaiting its engraving", not a missing thing.

### overview
- `countUp` the `.tile.is-hero .tile-v`; keep ≥6 KPI tiles above fold (do not bloat).
- `inst-grid`: `align-items:start; grid-auto-rows:1fr`; panels `display:flex;flex-direction:column` so
  source colophon pins to bottom and short "Continue" column bottom-aligns with "Next moves".
- Empty "Continue where you left off" → `emptyState` (quill mark, "Your trail starts here",
  `data-go-tab="qbank"` CTA). Optional faint ghost-preview rows = REAL top-density topic names at
  `opacity:.4`, clearly labelled "preview" (NO fabricated tracking state — neutrality firewall).
- `reveal` the panels (stagger cap 4).

### qbank
- Segmented sliding indicator on the subject/sort controls; chip off→on confirm pulse; A/R/Rt
  `aria-pressed` + labels.
- Bars in rows: first-paint scaleX only; `syncAfterToggle` updates instant (no re-grow on chip tap).
- Drawer: `--e3` elevation, trapFocus, custom scrollbar. Plate `Pl. N` tap-to-explain (see hy/charts).

### progress
- Consume the consolidated `.heatmap`/`.spark` from charts.css (delete the scoped block).
- `chartIntro` heatmap (stagger-fade) + sparklines (draw-on); sparkline gets gradient area-fill +
  endpoint halo. `reveal` panels.

### tests
- Wrap secondary plates in existing `.panel-grid` (accuracy sparkline left / per-subject weakest-first
  rankedBars right); editable score table stays full-width below, `max-width:min(100%,860px)`,
  `margin-inline:auto` (intentional ledger column).
- Zero-state sparkline: render the gridded **axis** (baseline + min/max ticks + dotted "awaiting data"
  midline + "Log your first GT below ↓" CTA) instead of a dashed `.empty` — a calibrated-but-empty
  gauge, not a broken box.
- `fmtPct`/`fmtDelta` for accuracy/delta cells. `countUp` the hero numeral.

### hy (high-yield)
- `.plate-no` becomes a real affordance: `tabindex=0 role=button` + `data-plate-explain`, wired in
  `appClick` to open a sheet explaining the engraved-plate metaphor + jump to imprint sources; press
  state per §1.6.
- Pair the consensus inset-group (left) with a compact subject-density panel (right) under the hero
  rankedBars (`.panel-grid`).
- consensusMark: off-pips → `--line-2` hairline (lit pips dominate); on-pips scale/opacity-in ONCE on
  entrance (reduced-motion → filled). Keep "proxy, not measured exam consensus" label. Route the
  ◔◑● list glyph through the shared custom tooltip so mobile gets the proxy context.

### videos
- Faculty rollup + callout sit 2-up (`.panel-grid`).
- Empty states (no videos mapped) → `emptyState` (keeps the panel-grid cell balanced).
- watched/revised chips: off→on confirm pulse + `aria-pressed`.

### planner
- Adopt the consolidated legend ramp + reveal panels. No new density. Keep adherence framing
  (adherence not hours) and all labels intact.

### entities/subject
- Hero numeral `countUp` + lining-tabular figures; optional shared-element `view-transition-name`.
- Segmented control (Coverage/Consensus/Teachers/Videos/You) gets the sliding indicator.
- Empty sub-panels (no HY topics / no videos / no test scores / faculty seeding) → `emptyState`; the
  faculty "being seeded" state uses the "plate awaiting engraving" metaphor with honest N/N count
  ("forthcoming", not "empty") to match the gated-honesty contract.
- `chartIntro` the heatmap/bars; `reveal` panels (stagger cap 4).

### entities/platform
- Hero `countUp`. Treemap (desktop ≥1024): add one-line truncated label for tiles `w>70 && h>20`
  (rely on tooltip for smaller); hover/focus quiet lift via `filter:brightness(1.04)` + stroke widen
  to 3px (transform-free, no reflow) + focus-visible ring; entrance fade tiles in by area
  (largest first), reduced-motion-safe. Auto-degrades to rankedBars on mobile (unchanged).
- Segmented sliding indicator; `reveal` panels.

### entities/faculty
- Hero `countUp`. Faculty timeline engraving finish (`facultyTimeline`): current-affiliation node gets
  an inset letterpress (pressed-into-paper, NOT glowing); desktop horizontal axis gets a hairline
  dashed "now" rule labelled in small-caps serif at the right edge; solo/superspecialty gold-dashed
  segments tightened to 3px/3px rhythm; gold node uses `--gold`. Entrance: rail draws left→right
  (dashoffset) + nodes stagger scale-in (gated, reduced-motion-safe). Expand legend to 3 keys
  (current pine / past muted / solo·superspecialty gold-dashed).
- `fac-bio` measure cap + `text-wrap:pretty`. Ratings stay aggregate/directional (firewall);
  no "worst" framing; epistemic labels never animated away.

---

## 5. BUILD / VERIFY CHECKLIST (every PR)
1. `node --check` on every JS file incl. new `js/motion.js`.
2. `python3 build_data.py` green (combined 42889, DocTutorials 13202, faculty 14, refs resolve).
3. `js/motion.js` added to `index.html` AND `sw.js` SHELL in the correct load slot (after ds.js,
   before surfaces); MODULE_MANIFEST load order updated.
4. Console clean; no horizontal scroll 320–1920; build total **56,091** unchanged.
5. Toggle OS reduced-motion → app fully functional, ZERO motion, all numbers/labels/charts at final
   state, every epistemic label + source still visible.
6. Test in a browser WITHOUT View Transitions / `@property` / `text-box-trim` → graceful instant
   fallback, no console errors.
