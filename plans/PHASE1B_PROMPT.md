# Builder prompt — Phase 1b (mobile-first responsive rebuild + PWA)

> Paste into a fresh session. You are the **builder**; the coordinator owns strategy/PROGRESS.
> Execute **Phase 1b only** — presentation layer. The data schema is **frozen** (Phase 1a shipped:
> `window.D = {exam, platforms[], tests, videos}`, 3 QBanks, N-platform throughout). **Do NOT touch
> `build_data.py` or the data shape.** This is `index.html` + `styles.css` + the render/layout parts of `app.js`.

## Orient (read first)
- `plans/RESPONSIVE_MOBILE_REWORK.md` — the full spec (this is your source of truth for the rebuild).
- `plans/PROGRESS.md` and the Phase-1 entries in `plans/VISION_and_ROADMAP.md`.
- Current `index.html` (7-tab header, drawer, palette markup) and `styles.css` (fixed `max-width:1140px`).
- In `app.js`: `show()` / `TAB_ORDER` (tab switching), the render functions per view, drawer + palette open/close.

## Task (mobile-first, fluid-everywhere)
1. **Container:** replace fixed `max-width:1140px` with `width:min(100% - 2rem, ~1480px)`; fluid `--gap`/`--pad` via `clamp()`; let dense views use the width. Container queries on `.panel`/`.statgrid`/`.hy-cols`/`.qb-layout`.
2. **Mobile header (≤640px):** compact sticky bar — monogram + current-tab title + ⌘K icon + a "⋯" overflow holding Export/Import/Reset/Theme. Drop the long subtitle on mobile.
3. **Bottom tab nav** (the biggest mobile win): fixed, thumb-reachable, icons + short labels for the 7 sections, active = accent, mirror `show()`'s active state, respect `env(safe-area-inset-bottom)`.
4. **QBank mobile:** subject sidebar → horizontal **chip-strip** (or `<select>`/bottom-sheet); main shows one subject's collapsible tree full-width; controls condense to one row + a filters bottom-sheet; A/R/Rt chips ≥40px. Keep the N-way platform switch usable on narrow.
5. **Drawer → bottom-sheet** on mobile (slide-up, drag handle, max-height ~88vh, internal scroll). **Palette → full-screen** on mobile (input pinned top).
6. **Tables → card lists** on mobile (Progress / Tests / High-Yield consensus) via `data-label` pattern; Tests numeric inputs larger; difficulty stars stay tappable.
7. **PWA:** add `manifest.webmanifest` (paper/ink theme, `display:standalone`, icons) + a tiny service worker caching the static shell. Register it in `index.html`.
8. **Sweep the two micro-drifts** (scoped to land here): footer **"1–6" → "1–7"** (`index.html:49`); make the **subhead dynamic from `D.platforms`** instead of the static "Marrow · Cerebellum · CoreBTR" (`index.html:16`).

## Hard constraints
- No framework; keep it vanilla. **Don't change the data layer** or any `D.platforms` logic.
- No hover-only affordances; min tap target **44×44**. Safe-area insets where sticky.
- Keep desktop excellent too — this is fluid-everywhere, not just a phone skin.

## Verify (every breakpoint) → ship
- Claude Preview at **320 · 360 · 375 · 414 · 480 · 600 · 768 · 834 · 1024 · 1280 · 1440 · 1920**.
- Each: all 7 tabs render; **no horizontal scroll**; no overlapping sticky elements (watch `--hh`); bottom nav + drawer/bottom-sheet + palette open/scroll/dismiss correctly; console clean.
- Screenshot 2–3 key widths (e.g. 375 + 768 + 1440) as proof.
- Commit in small units; `git push origin main` (SSH; gh token invalid).
- Tick **Phase 1b** in `PROGRESS.md`, append one decision-log line, note the micro-drifts as resolved.
- **Report to coordinator (3–6 lines):** what shipped, any layout compromises, PWA status, what's open.

## Model / reasoning
**Sonnet 4.6, medium-high reasoning** — iteration-heavy CSS with many preview/resize loops; cost-effective per cycle. Escalate to Opus 4.8 only if a structural layout problem resists.
