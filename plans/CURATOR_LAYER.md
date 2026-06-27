# Curator Layer — the outcome-verified "people who made it" pillar (architecture + guardrails)

> Proposed 2026-06-27 (by the user, mid-1c.2). Meridian is "IMDB for exam prep". We have two people-adjacent
> signals so far: faculty (who *teaches*) and anonymous/app-store reputation. The missing, highest-credibility
> signal is **outcome**: what did people who *actually succeeded* (good rank / matched into PG) use and recommend?
> This is the credibility currency the ratings graph needs — the answer to "whose opinion counts?". It is the
> twin of the faculty pillar (faculty = who teaches; curators = who succeeded) and the concrete form of the
> locked **Fork #2** decision to "graduate ratings to observed usage/outcome signals as scale arrives".
> Governed by `DATA_VISUAL_STANDARD.md` (epistemic labels + neutrality firewall) and the `verifiedVia` pattern
> already established in `FACULTY_LAYER.md`.

## The idea (what the user asked for)
1. **Curators** = verified-outcome aspirants — people who joined PG / cleared with a good rank — whose ratings
   and recommendations carry **outcome-weighted credibility** (a "more real-life rating"), distinct from
   anonymous crowd votes.
2. **A curator blog / notes space** where curators write their references & strategy. Crucially, each
   **reference is structured and tagged** to app entities (subject / topic / faculty / platform / test / video),
   and a user can **one-tap add a tagged reference into their Study Planner** — wiring credible opinion straight
   into the existing "do-next" engine.

## Why it's strategically core (not feature-piling)
- **Outcome is the strongest credibility tier.** The market already votes for "topper strategy" content. A
  *verified* high-ranker's recommendation outweighs hundreds of anonymous votes — it kills the cold-start +
  astroturf problem that sinks ratings systems.
- **Un-buildable by incumbents, neutrally.** No single platform can credibly surface "what toppers actually used
  *across* platforms." Only the neutral meta-layer can — same moat shape as faculty.
- **It makes UGC compound.** Tagged references → planner converts prose into actionable, reusable do-next items,
  feeding the coach pillar instead of being a dead content silo.

## Why NOT now (the honest constraints → build later, capture now)
- **Needs accounts + backend + real outcome-verification.** Proving rank / PG-admission (rank cards, admission
  proof, fraud resistance) is a trust-ops problem, not a render function. Sits **after** the "wedge proves → add
  backend" gate (Fork #3). Building curator accounts/UGC now would break **local-first-first**.
- **Adds a third marketplace side.** An empty curator blog is dead on arrival; supply must be **seeded** (recruit
  a handful of real verified toppers — exactly as the faculty seed does).
- **It is the moat → do it right, after there are users to read it.** Not bolted onto the 1c.2 design overhaul.

## Decisions (locked direction; details at build time)
- **Capture-not-build.** A first-class pillar, sequenced into **Phase 3 (retention + the ratings graph)**, behind
  the **accounts/backend gate**. The seam is *additive* to the faculty `verifiedVia` machinery — no rewrite.
- **Credibility is a labelled tier, never a verdict.** An individual curator rec is `directional`; the **aggregate
  of verified-outcome curators** is a high-signal tier, clearly labelled + sourced, framed as community evidence,
  **never** "Meridian's verdict". No "worst" boards (toppers or otherwise).
- **Neutrality firewall applies fully.** Money never buys curator status, weight, or placement; verified outcome
  is the only thing that grants curator credibility; methodology published.

## Schema seam (target — designable later, additive to the existing model)
```
D.curators = [{
  id:"cur-<slug>", handle, outcome:{ exam:"NEET PG", year:2025, rank:123, result:"matched", verifiedVia:"verified-outcome", status:"directional" },
  subjects:[…], bio, sourceIds:[…], epistemic:"directional"
}]
D.reviews = [{                                   // unifies topic/test/faculty/platform reviews under one credibility model
  id, authorId:"cur-…"|"user-…", entity:{ type:"subject|topic|faculty|platform|test|video", id },
  rating, text, verifiedVia:"verified-outcome|in-app-activity|unverified", status:"directional", sourceIds:[…]
}]
// Blog post = a review/notes doc whose body carries inline REFERENCE TAGS:
//   { entity:{type,id}, action:"add-to-planner" } → the Study Planner consumes these as one-tap "add" items.
```
- Reuses `verifiedVia` (faculty established it) with a new value `verified-outcome`. The Study Planner already
  exists (the do-next surface) — curator references plug in as taggable "add" actions, zero new pillar in the UI.

## Sequencing
- **Now:** captured here; **no build**, **no change to the running 1c.2 workflow**. The faculty entity + `verifiedVia`
  it ships establish the pattern this extends.
- **Phase 3 (post-backend gate):** build curator profiles + outcome verification + unified reviews + the tagged
  blog→planner loop; seed a few real verified toppers to break cold-start; enforce verified-outcome gating.
- **Later:** curator-recommendation aggregation becomes a premium "what toppers did" surface (Phase 4) and an
  input to B2B demand-intelligence (Phase 5), neutrality firewall enforced.
