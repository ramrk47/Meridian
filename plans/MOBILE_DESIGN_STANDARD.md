# Mobile Design Standard — crisp, compact, data-forward (STANDING RULE)

> Design and visual data depiction are **the forefront of the product**, not a finish. Every mobile
> screen must read as a **native data app**, never a responsive website stacked vertically. This doc is
> a hard rule for all current and future UI. Measurable bars below — a screen ships only if it meets them.

## The one law: DENSITY
A phone screen must deliver **information at a glance**, like Apple Health / Oura / Groww / Kite /
Robinhood — not one datum per scroll. The failure mode we are killing: desktop cards (big rounded
boxes, fat padding, one number each) stacked one-per-row.

## What was wrong (2026-06-27 review — fix all of these)
- **Overview:** 4 KPIs as 4 full-width giant cards → only ~4 numbers fill an entire 375×812 screen.
- **QBank:** search + sort + status + hi-yield + expand/collapse each on their own full-width row →
  ~5 rows of chrome before data; categories are fat one-datum cards.
- **Everywhere:** oversized serif numerals eat vertical space; card-on-flat-ground floats waste edges.

## Concrete density targets (verify by screenshot at 375×812)
- **KPI/stat blocks → a compact tile grid**, 2 columns (3 on ≥414 where it stays legible). **≥6 KPI
  tiles visible above the fold** on Overview. Each tile: big-ish tabular number + 1 micro-label +
  thin accent/sparkline. Tile height ~84–104px, not ~230px.
- **Lists are rows, not cards.** Subject / category / module / test rows = **44–56px tall**, hairline
  (`1px`) divider between, leading accent or icon, trailing value + action. iOS *inset-grouped list*
  feel (one rounded container, internal hairlines) — **not** N separate floating cards.
- **One toolbar, not a stack.** Search + sort + filter + hi-yield collapse into **a single sticky row**:
  a slim search field with inline sort/filter **icon buttons** that open a **bottom-sheet**; platform =
  segmented control; hi-yield = a pill toggle. Expand/Collapse = small icon affordances, not buttons.
  Target: **≤1 toolbar row** above the first data row (was 5).
- **Type scale (mobile):** at most **one** hero serif number per screen (~clamp 30–40px). All other
  numbers use a **compact tabular** scale (18–22px). Labels: 11–12px uppercase, tight tracking.
  Line-heights tight (1.1–1.25). Numerals **tabular / aligned** so columns line up.
- **Tap targets stay ≥44×44** via hit-area padding — density must NOT shrink touch targets. A 48px row
  with a 44px hit area is correct; a 30px row is not.
- **Spacing:** section gap ≤12px; card/tile inner pad ~10–14px (was ~22). Use hairlines + grouping to
  separate, not whitespace.

## Keep the identity (this is NOT a redesign to generic)
- Warm "almanac" paper/ink palette, serif display face, calm accents — **retained**. Never neon.
- Density is achieved through **layout + type scale + grouping**, not by changing the brand.
- Accents stay meaningful (the per-stat color bars become tile accents / sparkline strokes).

## Native patterns to adopt
- Stat-tile grid (Health-style), sparkline/mini-bar inside tiles, inset-grouped list rows with
  hairlines, sticky segmented controls, **bottom-sheet** for filters/sort/detail, section headers as
  thin sticky labels, swipe/long-press optional later. Tabular numerals everywhere data aligns.

## Anti-patterns (auto-fail)
- One datum per full-width card; >1 stacked full-width `<input>`/`<select>` in a row of controls;
  giant serif numerals repeated down the page; floating card-on-card with big gaps; horizontal scroll;
  touch target <44px; using whitespace (not hairlines) as the only separator.

## Verification bar (screenshot-checked, every screen)
1. Overview at 375×812 shows **≥6 KPI tiles + the start of the next section** above the fold.
2. QBank at 375×812 shows the toolbar **+ ≥4 category/module rows** above the fold.
3. List rows measure 44–56px; dividers are hairlines; no one-datum fat cards remain.
4. No horizontal scroll 320→1920; tap targets ≥44px; console clean.
5. Side-by-side feels like a data app (Health/Kite), not a stacked webpage. If in doubt, it's too sparse.
