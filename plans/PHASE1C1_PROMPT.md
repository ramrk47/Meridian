# Builder prompt — Phase 1c.1 (curation: substance + neutrality, data-first)

> Paste into a fresh session. You are the **builder**; the coordinator owns strategy/PROGRESS.
> Goal: move Meridian from showing **inventory (counts)** to showing **curated judgment** — honestly
> labeled and sourced. **Data + light UI labeling only.** The desktop data-viz redesign is a *separate*
> next pass (1c.2) — do NOT build charts here.

## Orient (read first — non-negotiable)
- **`plans/DATA_VISUAL_STANDARD.md`** — THE spec (two laws + neutrality firewall + epistemic labels +
  the verification bar). You ship only when the curation bar passes.
- **`plans/RESEARCH_FINDINGS.md`** (H3 best-faculty/subject; the app-store reliability scorecard table)
  and **`plans/MARKET_INTEL.md`** — the ONLY sources you may curate from. Every claim must trace to one.
- `build_data.py`, current `window.D` shape in `data.js`, and how `app.js` reads it.

## Do (curation — substance + honesty)
1. **Honest yield labeling.** The current "high-yield" hyScore is **MCQ-share within a subject = a
   proxy, not exam yield.** Relabel it wherever shown (e.g. "MCQ density / volume share") and tag it
   `proxy`. Do NOT compute or imply real exam yield unless PYQ-weighted data backs it; if you add a
   PYQ-weighted measure where PYQ captures exist, keep it **visibly distinct** from the proxy.
2. **Best-platform/faculty per-subject matrix.** Structure the H3 findings into curated data:
   per subject → reputed-strong platform(s), tagged **`directional`** ("community reputation"), with
   source + capture date. Framed as aggregated public sentiment, **never as Meridian's verdict**.
3. **Neutral reliability scorecard.** Encode the app-store table (Marrow 4.7/33k · PrepLadder 4.4/21k ·
   DocTutorials 4.2/1.7k · Cerebellum 3.7/3.4k · eGurukul 3.0/2.3k + recurring 1–2★ themes), tagged
   `public-3p`, with date + source.
4. **Schema, not hardcoding.** Add curated fields to `D` via `build_data.py` from a curated source file
   (e.g. `_raw/curated/…`): suggested `D.platforms[].reliability`, `D.subjectStrength[]`, and a
   `D.sources[]` registry that inline labels reference. Keep the PrepLadder/eGurukul ingest seam.
5. **Surface the labels + a "How we rate / Sources" panel** (lightweight — text/list is fine here; the
   rich visuals come in 1c.2). Every rating/rank on screen shows its epistemic tag + source + date.

## Hard constraints (neutrality firewall — auto-fail if broken)
- **Never fabricate.** No invented numbers, ranks, faculty names, or counts. If the research doesn't
  state it, it does not go in. Preserve existing `measured` counts exactly (42,889 + 13,202 = 56,091).
- Every `directional`/`public-3p` figure is **labeled as such** with source + date. Nothing presents
  Meridian as the judge of faculty quality where the data is only community sentiment.
- Don't touch the mobile density work or break the density/no-scroll/console-clean bars.

## Verify → ship
- `python build_data.py`; open in Claude Preview (use a free port in `.claude/launch.json` if 87xx is
  taken). Console clean; every figure shows its label + source; "How we rate" surface present.
- **Spot-check 3 curated claims** against RESEARCH_FINDINGS/MARKET_INTEL — all must trace to a source.
- Commit small units; `git push origin main` (SSH; gh token invalid).
- Tick **1c.1** in `PROGRESS.md`, append one decision-log line, refresh the data inventory.
- **Report to coordinator (3–6 lines):** what was curated, the new `D` fields, how labels/sources are
  shown, any claim you chose to omit for lack of a source, what's ready for the 1c.2 viz pass.

## Model / reasoning
**Opus 4.8, high reasoning** — neutrality-critical curation (epistemic labeling, no fabrication, honest
relabeling) is judgment-heavy; a sourcing/over-claim miss is costly. Spend the stronger model.
