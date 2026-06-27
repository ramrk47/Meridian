# Phase 1c.2 — Experience Overhaul (web + mobile) — ULTRACODE BRIEF

> The coordinator's brief for an **ultracode (multi-agent Workflow) session**. Ambition chosen by the
> user: **HYBRID** — a full new data-presentation + UI system **and** first-class entity pages, while
> keeping the tracking tabs as "home." Faculty (the people pillar) is built **inside** this system, not
> bolted on. This brief is the contract; the ultracode session decomposes it into a Workflow.

## The vision (hybrid)
- **Keep the tracking tabs as the home surface** (Overview/QBank/Progress/Tests/High-Yield/Videos/Planner),
  re-skinned to the new system.
- **Add first-class ENTITY PAGES** (the IMDB move):
  - **Subject** → coverage + yield across platforms (heatmap row), consensus high-yield topics,
    **who teaches it best** (faculty + platform strength, `directional`/sourced), videos, your progress.
  - **Platform** → reliability scorecard (`public-3p`, dated), coverage by subject, **faculty roster**, your tracking.
  - **Faculty** → **career timeline** (current → past → solo → super-specialty), the two ratings (gated
    profile + rolled-up video, `directional` now), subjects taught, linked platforms.
- **One design system, two layouts** — desktop uses the **width** (multi-panel, relational viz); mobile
  uses **density** (tiles, compact rows, viz adapted to narrow). Not two designs.
- **Full chart vocabulary, every datum epistemically labelled + sourced.**

## The rubric (must pass all three standards)
- `MOBILE_DESIGN_STANDARD.md` — density bars (≥6 KPI tiles above fold, 44–56px rows, one toolbar, etc.).
- `DATA_VISUAL_STANDARD.md` — judgment-not-inventory, draw-relationships, epistemic labels + sources,
  neutrality firewall (reuse 1c.1's `D.sources[]` registry + the build-time source-integrity guard).
- `FACULTY_LAYER.md` — `D.faculty[]` schema, two rating signals, `verifiedVia` designed (voting enforced
  post-backend), **aggregate-only / community-sentiment framing, never a "worst faculty" board.**

## Scope — what gets built
**A · Design-system foundation** (tokens + components, shared web+mobile): type scale w/ **tabular
numerals**; spacing/radii/elevation; **color AS data encoding** (platform = categorical palette
Marrow/Cere/Doc/PrepL/eGuru; yield/density = sequential; status = semantic — never decorative neon);
components: stat-tile, list-row, **epistemic badge**, source-link/platform-ref chip, segmented control,
bottom-sheet, panel, chart frame. Warm almanac identity retained.
**B · Chart vocabulary** (relational viz; desktop + mobile-adapted; all labelled): **subject×platform
heatmap** (coverage/yield), **consensus** indicator (≥2 platforms agree), **treemap/ranked bars**
(MCQ/yield mass), grouped bars (volume — exists), **sparklines/small-multiples** (progress),
**faculty career timeline**, rating/scorecard component.
**C · Entity pages** — Subject, Platform, Faculty (per the vision above), reachable from anywhere
(click a subject → Subject page; faculty link → Faculty page; platform chip → Platform page).
**D · Faculty data** — implement `D.faculty[]` (FACULTY_LAYER schema) + **~10–20 curated seed**
(`directional`, sourced; omit anything unsourced) + `verifiedVia:"in-app-activity"` field + map videos→
faculty where certain. (This folds in the former 1c.1F pass.)
**E · Re-skin the 7 tabs** to the new system (density web+mobile; drop relational viz in where it helps;
link out to entity pages).
**F · Navigation** wiring for the entity pages; tabs remain home.

## Architecture / engineering (coordinator's calls — keep these)
- **Stage 1 modularizes the `app.js` render layer** into per-surface modules + a shared design-system/
  components module, so parallel agents don't clobber the single 1,300-line file. Stay **vanilla** (no
  framework), **local-first**, `storage.js` seam intact, `build_data.py` data contract intact.
- **Preserve** the measured total (56,091), all 1c.1 curated data/labels, and the source-integrity guard.

## Recommended Workflow shape (the ultracode session may refine)
1. **Design exploration** (parallel, judged) — N agents each produce a complete cross-surface design
   direction (visual language + entity-page IA + chart treatments) as concrete specs. **Judge panel**
   scores vs the 3 standards + brand → synthesize ONE winning spec. *(This is the taste insurance that
   1b lacked — independent attempts + adversarial design review.)*
2. **Foundation** (sequential, one cohesive agent) — implement winning tokens + component library +
   modularize the render layer. The shared seam; do not parallelize.
3. **Surface implementation** (parallel, worktree-isolated per surface) — one agent per entity page /
   re-skinned tab / the faculty seed, building on the foundation modules.
4. **Adversarial review** (parallel, multi-lens) — reviewers for: density, neutrality/sourcing,
   mobile-native-feel, desktop-width-use, breakpoint/console verification in Claude Preview. Findings → fix loop.
5. **Integration + verify** — assemble; verify all surfaces at 320·375·414·768·1024·1440·1920; screenshots as proof.

## Hard constraints (auto-fail)
Neutrality firewall (labels + sources + guard, no fabrication); density bars; no horizontal scroll
320–1920; console clean; local-first still works; identity retained (warm almanac, never neon);
measured data preserved; faculty guardrails honored.

## Verification bar
1. Subject / Platform / Faculty entity pages exist and wire up from the rest of the app.
2. ≥1 true relational visualization per relevant surface (heatmap/consensus/treemap/timeline) — not just cards+tables.
3. Mobile density bars pass; desktop uses the width (multi-panel). Both from one system.
4. Every datum carries its epistemic label + source; faculty timeline + guardrails correct; 56,091 preserved.
5. All breakpoints: no h-scroll, console clean. Attach 375 + 768 + 1440 screenshots of Overview + a Subject page + a Faculty page.

## Report back to coordinator
Per surface: what shipped; the design-system tokens/components; faculty seed count + omissions; the
relational viz built; screenshots; anything that needs a coordinator call. Then I reconcile vs the
standards before Phase 2.

> Separate, still pending (needs the user's logged-in browser): the **faculty data-gathering pass**
> (`FACULTY_DATA_PASS_PROMPT.md`) enriches the seed afterward — zero UI churn, the Faculty page renders the schema.
