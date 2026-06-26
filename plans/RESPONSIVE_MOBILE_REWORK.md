# Responsive + Mobile Rework Plan

The current layout wastes space (fixed `max-width:1140px` centered with big empty gutters on wide
screens; 2-up grids that don't reflow well; tables that overflow on narrow; the QBank two-column
collapses to an awkward stacked sidebar). There is **no real mobile view**. This plan rebuilds the
layout to be fluid across all widths and adds a ground-up mobile experience that ports to an app.

## Principles
- **Fluid, not fixed.** Replace the single `max-width:1140px` with a responsive container that grows
  on large screens (cap ~1440–1600 for readability, but use the width: multi-column dashboards,
  wider tables, side-by-side panels). Use `clamp()` for spacing/type and CSS Grid `auto-fit/minmax`
  so panels fill available width.
- **Container queries** for component-level responsiveness (panels adapt to *their* width, not just
  the viewport) — `@container` on `.panel`, `.statgrid`, `.qb-layout`, `.hy-cols`.
- **Mobile-first CSS**: author base styles for ~360px, layer enhancements up at breakpoints.
- **No hover-only affordances** (titles/tooltips must have tap equivalents). Min tap target 44×44.
- **Safe-area insets** (`env(safe-area-inset-*)`) for notches/home-bar — required for app shell.

## Breakpoints to support & test
`320, 360, 375, 414, 480` (phones) · `600, 768, 834` (tablets) · `1024, 1280, 1440, 1920` (desktop).
Test every tab at each: Overview, QBank, Progress, Tests, High-Yield, Videos, Planner — plus the
**drawer** and **command palette** overlays.

## Desktop space-utilization fixes
- Container: `width:min(100% - 2rem, 1480px)` with fluid side padding; let dense views go wider.
- `.statgrid` already `auto-fit minmax(210px,1fr)` — good; raise the min on huge screens so cards
  don't get absurdly wide, or cap columns with `repeat(auto-fit,minmax(210px,260px))`-style.
- QBank: on ≥1280, widen the sidebar slightly and let the tree use the extra width (two module
  columns via container query when the main panel is very wide). On ≤900 it becomes mobile mode (below).
- Tables (Progress/Tests/HY consensus): give them room; on wide screens show more columns; never
  let them overflow — use `overflow-x:auto` wrappers as a fallback only.

## Ground-up MOBILE (≤640px) — build as a first-class mode
- **Top bar:** collapse to a compact sticky header — monogram + current-tab title + a ⌘K/search icon
  + an overflow "⋯" menu holding Export/Import/Reset/Theme. Drop the long subtitle.
- **Navigation:** replace the wrapping text tabs with a **fixed bottom tab bar** (icons + short
  labels) for the 5–7 sections — thumb-reachable, app-like. (Bottom nav is the single biggest
  mobile win.) Active state = accent. Respect safe-area bottom inset.
- **QBank on mobile:** the subject sidebar becomes either (a) a horizontal scrolling subject chip
  strip pinned under the header, or (b) a `<select>`/bottom-sheet subject picker. Main shows one
  subject's collapsible tree, full width. Sticky controls condense into one row + a "filters"
  bottom-sheet. Chips (A/R/Rt) stay but enlarge to ≥40px.
- **Detail drawer → bottom sheet** on mobile: slides up from the bottom, full-width, drag-to-dismiss
  handle, max-height ~88vh, scrolls internally. (Right-side 430px drawer is desktop-only.)
- **Command palette → full-screen** on mobile (input pinned top, results fill screen).
- **Tables → card lists** on mobile: Progress/Tests/HY consensus rows reflow into stacked cards
  (label: value pairs), not horizontally-scrolling tables. Tests score inputs get larger numeric
  fields; difficulty stars stay tappable.
- **Videos:** same sidebar→chip-strip/select pattern; rows are comfortable touch height.
- **Bars/meters:** already fluid; ensure labels don't truncate awkwardly at 320px.

## Implementation approach (low-risk, incremental)
1. Introduce layout tokens: `--container-max`, fluid `--gap`/`--pad` via `clamp()`. Convert `main`
   and `.foot` to the new container.
2. Add a `@media (max-width:640px)` mobile layer + a bottom-nav component (new markup in
   `index.html`; `show()` already drives active state — mirror it to the bottom nav).
3. Convert the QBank/Videos `.qb-layout` to: desktop two-column (grid) / mobile stacked with a
   subject chip-strip. Gate the sidebar behavior on a `body.mobile`-like flag or pure CSS.
4. Make drawer + palette responsive (bottom-sheet / full-screen via media query + a class).
5. Convert data tables to responsive card mode with a `data-label` attribute pattern + CSS.
6. Add container queries to `.panel`, `.statgrid`, `.hy-cols` for in-panel reflow.
7. Audit tap targets, hover-only text, and add `env(safe-area-inset-*)` padding.

## Mobile-app portability (do alongside, cheap now)
- **PWA**: add `manifest.webmanifest` (name, icons, theme/background color = paper/ink, display
  `standalone`) + a tiny service worker that caches the static shell (the app is already offline-
  capable; SW just enables "Add to Home Screen" + installable app). This alone gives a near-native
  mobile app with zero rewrite.
- Keep everything **touch-first and inset-aware** so a later **Capacitor/Tauri** wrap is a packaging
  step, not a redesign. Avoid desktop-only APIs; storage already abstracted in `storage.js`.

## Verification checklist (every change)
- Claude Preview at each breakpoint (use `preview_resize` presets + custom 320/414/834/1440).
- No horizontal scroll at any width; no overlapping sticky elements (watch `--hh`).
- Drawer + palette open/scroll/dismiss correctly on mobile.
- Console clean. Then commit + push.
