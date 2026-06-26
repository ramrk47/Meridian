# Builder prompt — Phase 1b.2 (mobile density redesign)

> Paste into a fresh session. You are the **builder**; the coordinator owns strategy/PROGRESS.
> The first mobile build (1b) was **rejected**: it reads like "a website cosplaying as an app."
> Your job is the **density redesign** — make every mobile screen a crisp, compact, native data app.
> Data layer is **frozen** (`window.D`, 3 QBanks). This is `index.html` + `styles.css` + the render
> layer of `app.js`. **Do NOT touch `build_data.py` or the data shape.**

## Orient (read first — non-negotiable)
- **`plans/MOBILE_DESIGN_STANDARD.md`** — THE spec. It has measurable density targets and a
  screenshot-checked verification bar. You ship only when every bar passes.
- `plans/RESPONSIVE_MOBILE_REWORK.md` — original responsive scope (still valid for breakpoints/PWA).
- Current `index.html` / `styles.css` / the per-view render functions + `show()` in `app.js`.

## The problem to fix (concrete)
- **Overview:** 4 KPIs as 4 full-width giant cards → only ~4 numbers fill the whole screen.
- **QBank:** 5 stacked full-width controls before any data; categories are fat one-datum cards.
- Oversized serif numerals repeated down every screen; card-on-flat-ground floats waste space.

## Do (apply MOBILE_DESIGN_STANDARD.md targets)
1. **KPIs → compact 2-col tile grid** (3-col ≥414 if legible): **≥6 tiles above the fold** on Overview.
   Tile = tabular number + micro-label + thin accent/sparkline; ~84–104px tall, not ~230px.
2. **Lists → inset-grouped rows**, 44–56px tall, **hairline dividers**, leading accent, trailing
   value + action. Kill the one-datum fat cards (subjects, categories, modules, tests, videos, HY).
3. **One sticky toolbar**, not a stack: slim search + sort/filter **icon buttons → bottom-sheet**;
   platform = segmented control; hi-yield = pill toggle. ≤1 toolbar row above the first data row.
4. **Mobile type scale:** at most ONE hero serif number per screen; all other numbers compact tabular
   (18–22px); labels 11–12px uppercase; tight line-heights; **tabular/aligned numerals**.
5. **Tighten spacing** (section gap ≤12px, inner pad ~10–14px); separate with hairlines + grouping,
   not whitespace. Keep ≥44px tap targets via hit-area padding.
6. Apply across **all 7 views** + drawer/bottom-sheet + palette. Keep desktop excellent (this is a
   denser mobile layer + a tighter shared type scale; don't regress wide screens).

## Keep (do not "redesign to generic")
- Warm almanac paper/ink palette, serif display, calm accents — **retained**. Never neon.
- Density comes from layout + type scale + grouping, not from changing the brand.
- PWA (manifest/sw), bottom nav, logo-as-home, N-platform UI from 1b all stay — only density changes.

## Verify (screenshot-checked) → ship
- Claude Preview at 320·360·375·414·480·600·768·834·1024·1280·1440·1920.
- **Hit the standard's verification bar at 375×812:** Overview ≥6 KPI tiles + next section above fold;
  QBank toolbar + ≥4 rows above fold; rows 44–56px; no fat one-datum cards; no horizontal scroll;
  console clean. **Attach 375 + 768 + 1440 screenshots as proof** and self-check against the anti-patterns.
- Commit small units; `git push origin main` (SSH; gh token invalid).
- Tick the redesign in `PROGRESS.md`, append one decision-log line.
- **Report to coordinator (3–6 lines):** before/after density (KPIs-above-fold, row height, toolbar
  rows), any tradeoffs, screenshots.

## Model / reasoning
**Opus 4.8, high reasoning** — this is taste-critical; a density/design miss costs a whole session, so
spend the stronger model here rather than iterate cheaply. Use the Preview screenshots as the ground truth.
