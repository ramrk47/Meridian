/* ============================================================
   entities/platform.js — renderPlatformPage(id)   ·  Stage 3b
   Entity page (NOT a tab): one integrated platform's profile —
   public-3p reliability scorecard, coverage-by-subject mass (measured
   counts, proxy density), faculty roster (career moat), and YOUR
   tracking on this platform (measured, local). Every figure carries its
   epistemic label + source via chartFrame()/panel(). Links out to the
   Subject and Faculty pages — the Subject↔Platform↔Faculty triangle.

   NEUTRALITY FIREWALL: never fabricate a count/rating/name/date; money
   never moves the score; reliability complaint THEMES render as a 6px
   warn DOT, never a shaming bar; faculty roster is aggregate-only.

   KIND SPLIT (Phase 1d): qbank platforms (Marrow / Cerebellum / DocTutorials)
   render the full measured-MCQ page below. Lecture platforms (PrepLadder /
   eGurukul) carry no measured MCQ totals — they render a compact lecture page
   (reliability + module/topic count coverage + the faculty moat), never
   fabricated MCQ mass. Truly unknown / reputation-only ids still get the stub.
   ============================================================ */

/* the App-Store reliability row for this platform (public-3p), if any */
function _platReliability(id) {
  return ((D.reliability && D.reliability.apps) || []).find(a => a.platformId === id) || null;
}

/* ---- local empty-state engraving (CRAFT) ---------------------------------
   Reads as "a plate awaiting its engraving", not a missing thing: plate ground
   + a monochrome STROKE-ONLY mark (never colour), serif title, meta body.
   NOTE for integrator: this duplicates the intended shared
   emptyState({icon,title,body,action}) primitive (spec §4) which does not yet
   exist in ds.js — and is mirrored in entities/subject.js (_subjEmpty). Promote
   + dedupe when the shared primitive lands. Keeps every epistemic label intact
   and the gated-faculty "forthcoming" framing for the neutrality firewall. */
const _PLAT_MARKS = {
  quill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 4S8 6 5 15l4 4C18 16 20 4 20 4Z"/><path d="M5 19l3.5-3.5"/></svg>`,
  ledger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6C9 4 5 4 3 5v14c2-1 6-1 9 1 3-2 7-2 9-1V5c-2-1-6-1-9 1Z"/><path d="M12 6v14"/></svg>`,
  compass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z"/></svg>`,
};
function _platEmpty(o) {
  o = o || {};
  // delegate to the shared ds.emptyState() primitive; o.mark (quill|ledger|compass) → icon. body carries markup.
  return emptyState({ icon: o.mark, title: o.title, body: o.body });
}

/* ---- lecture-platform page (PrepLadder / eGurukul) -----------------------
   No measured MCQ totals (mcqs=null). Honest surface of what we DO hold:
   public-3p reliability, module/topic COUNT coverage (measured), community-
   reputed-strongest subjects (directional), and the faculty roster (the moat).
   Never renders MCQ mass or a fabricated density. */
function renderLecturePlatformPage(p, id, v) {
  const subjects = p.subjects;
  const reli = _platReliability(id);
  const totalUnits = platMods(id);
  const unitNoun = id === "prepladder" ? "modules" : "topics";
  const roster = facultyForPlatform(id);
  const reliCap = (D.reliability && D.reliability.captured) || D.captured;

  const strongSubs = new Set(((D.subjectStrength && D.subjectStrength.subjects) || [])
    .filter(s => (s.strong || []).some(x => x.platformId === id))
    .map(s => canon(s.subject)));

  const heroNum = reli && reli.rating != null ? reli.rating : "—";
  const head = `<div class="entity-head">
      <div class="eyebrow"><button class="linkbtn back" data-go-overview>‹ Home</button> · PLATFORMS</div>
      <div class="eh-top">
        <div class="eh-id"><h2 class="sh-name" style="color:${platColor(id)}">${esc(p.name)}</h2>
          <div class="eh-tags">
            <span class="echip off">${fmt(totalUnits)} ${esc(unitNoun)} · ${esc(D.exam || "NEET PG")}</span>
            <span class="echip off">${subjects.length} subjects · lecture platform</span>
          </div>
        </div>
        <div class="eh-hero">
          <span class="hero-num num">${heroNum === "—" ? "—" : '<span class="hn-star" aria-hidden="true">★</span> ' + esc(String(heroNum))}</span>
          <span class="hero-lbl">${reli ? "App-Store rating " + epiBadge("public-3p") : "no public rating"}</span>
          <span class="hero-note muted small">${reli ? esc(reli.ratingsLabel || "") + " ratings · captured " + esc(reliCap) : ""}</span>
        </div>
      </div>
    </div>`;

  const topSub = subjects.slice().sort((a, b) => b.modules.length - a.modules.length)[0];
  const tiles = `<div class="tiles">`
    + statTile({ accent: platCls(id), value: reli && reli.rating != null ? reli.rating : "—", label: "RATING ★", note: reli ? (reli.ratingsLabel || "App Store") : "no public rating", epi: reli ? "public-3p" : null })
    + statTile({ accent: platCls(id), value: fmt(totalUnits), label: unitNoun.toUpperCase(), note: "no MCQ totals captured", epi: null })
    + statTile({ accent: platCls(id), value: subjects.length, label: "SUBJECTS", note: topSub ? "most: " + esc(canon(topSub.subject)) : "" })
    + statTile({ value: roster.length || "—", label: "FACULTY", note: roster.length ? "with affiliations here" : "none seeded yet", epi: roster.length ? "directional" : null })
    + `</div>`;

  /* reliability scorecard (public-3p) */
  let reliPlate;
  if (reli) {
    reliPlate = chartFrame(
      "Reliability — iOS App Store",
      "public-3p", [reli.sourceId].filter(Boolean), reliCap,
      ratingScorecard([reli], "reliability"),
      {
        legend: `<span class="cf-key"><span class="wdot"></span>recurring complaint theme</span>`,
        note: (D.reliability && D.reliability.note ? esc(D.reliability.note) + " " : "")
          + "Public third-party signal — money never moves the score."
      }
    );
  } else {
    reliPlate = panel({
      title: "Reliability — iOS App Store", epi: "public-3p",
      body: _platEmpty({ mark: "compass", title: "No public rating yet",
        body: `No iOS App-Store rating is captured for ${esc(p.name)} so far ${epiBadge("public-3p")}.` })
    });
  }

  /* coverage by subject — module/topic COUNT (measured count, NOT MCQ mass) */
  const covItems = subjects.map(s => {
    const c = canon(s.subject);
    return {
      label: c, value: s.modules.length, go: "subject:" + c,
      mark: strongSubs.has(c) ? `<span class="rb-strong" title="Community-reputed strongest here (directional)">◆</span>` : null
    };
  }).sort((a, b) => b.value - a.value);
  const coverage = chartFrame(
    `Coverage by subject — ${unitNoun} count`,
    "measured", [], D.captured,
    rankedBars(covItems, { colorFn: () => platColor(id) }),
    {
      legend: `<span class="cf-key"><span class="lg-swatch" style="background:${platColor(id)}"></span>${esc(p.name)} ${esc(unitNoun)} (measured count)</span>`
        + (strongSubs.size ? `<span class="cf-key"><span class="rb-strong">◆</span>community-reputed strongest ${epiBadge("directional")}</span>` : ""),
      note: `Bar length = number of ${esc(unitNoun)} this platform carries in each subject (measured count, ${esc(D.captured)}). MCQ-level density is not captured for lecture platforms, so none is shown. ◆ marks subjects the community reputes ${esc(p.name)} strongest at (directional). Tap a subject for its cross-platform page.`
    }
  );

  /* faculty roster (the moat) */
  let facultyPanel;
  if (!roster.length) {
    facultyPanel = panel({
      title: "Faculty roster", epi: "directional",
      body: _platEmpty({ mark: "quill", title: "No affiliations listed here yet",
        body: `No seeded faculty currently list ${esc(p.name)} among their affiliations. The roster grows as more profiles are sourced ${epiBadge("directional")}.` })
    });
  } else {
    const rows = roster.map(f => {
      const aff = (f.affiliations || []).find(a => a.platformId === id) || {};
      const subs = [...new Set((f.subjects || []).map(canon))];
      return listRow({
        lead: dotLead(platColor(id)),
        title: esc(f.name),
        sub: `${subs.join(" · ")}${aff.status ? ' · <span class="rost-st">' + esc(aff.status) + "</span>" : ""}`,
        trail: aff.status === "past"
          ? `<span class="echip off">past</span>`
          : `<span class="echip off">${esc(aff.role ? aff.role.split(/[,(]/)[0].trim() : "faculty")}</span>`,
        go: "faculty:" + f.id
      });
    });
    const rosterSrc = [...new Set(roster.flatMap(f => (f.affiliations || []).flatMap(a => a.sourceIds || []).concat(f.sourceIds || [])))];
    facultyPanel = panel({
      title: `Faculty roster · ${roster.length}`, epi: "directional",
      sourceIds: rosterSrc, captured: "2026-06-27",
      body: groupList(rows)
        + `<p class="muted small" style="margin-top:8px">Career history from public sources (directional seed). Aggregate · community-sentiment · not endorsement. Tap a name for the full career timeline.</p>`
    });
  }

  /* honest note panel: why no MCQ mass here */
  const note = panel({
    title: "Why no MCQ scorecard here",
    body: `<p class="muted">${esc(p.name)} is a <b>lecture / video platform</b>. Calvetra has integrated its ${esc(unitNoun)} so they can be mapped onto the canonical topic spine and shown in cross-platform coverage — but it holds <b>no measured MCQ-bank totals</b> for it, so this page never shows MCQ mass or a density score. Counts above are measured ${esc(unitNoun)} counts ${epiBadge("measured")}; the importance of each topic comes from the community PYQ-frequency spine ${epiBadge("directional")}.</p>`
  });

  v.innerHTML = head + tiles
    + `<div class="panel-grid">${reliPlate}${coverage}</div>`
    + `<div class="inst-grid">${facultyPanel}${note}</div>`;

  _platEnhance(v, p);
}

function renderPlatformPage(id) {
  const v = $("#view-platform"); if (!v) return;
  resetPlates();

  const p = PLAT_BY_ID[id];
  /* GUARD: reputation-only / unknown ids never get a content page */
  if (!p) {
    const repName = REPUTATION_NAMES[id];
    v.innerHTML = `<div class="entity-head">
        <div class="eyebrow"><button class="linkbtn back" data-go-overview>‹ Home</button> · PLATFORMS</div>
        <h2 class="sh-name">${esc(repName || id)}</h2>
      </div>
      ${panel({
        title: repName ? `${repName} — reputation only` : "Unknown platform",
        epi: repName ? "directional" : null,
        body: repName
          ? `<p class="muted">${esc(repName)} appears in Calvetra's neutral reliability scorecard and community-reputation matrix, but its content is <b>not yet integrated</b> — so it has no coverage page. It stays an honest reputation chip until ingested.</p>`
          : `<p class="muted">No such platform.</p>`
      })}`;
    return;
  }

  /* lecture platforms (no measured MCQs) → compact, honest page */
  if (p.kind !== "qbank") { renderLecturePlatformPage(p, id, v); return; }

  /* ---- derived ---- */
  const subjects = freshSubjects(p);
  const reli = _platReliability(id);
  const totalMCQ = platMCQ(id);
  const totalUnits = platMods(id);
  const roster = facultyForPlatform(id);
  const ids = LEAVES.filter(l => l.platform === id).map(l => l.id);
  const ro = rollup(ids);
  const unitNoun = platUnitNoun(id);
  const reliCap = (D.reliability && D.reliability.captured) || D.captured;
  const strengthCap = (D.subjectStrength && D.subjectStrength.captured) || D.captured;

  /* subjects this platform is community-reputed strongest at (directional) */
  const strongSubs = new Set(((D.subjectStrength && D.subjectStrength.subjects) || [])
    .filter(s => (s.strong || []).some(x => x.platformId === id))
    .map(s => canon(s.subject)));

  /* ---- entity header: breadcrumb + name + ONE hero number (reliability ★, public-3p) ---- */
  const heroNum = reli && reli.rating != null ? (reli.ratingApprox ? "" : "") + reli.rating : "—";
  const head = `<div class="entity-head">
      <div class="eyebrow"><button class="linkbtn back" data-go-overview>‹ Home</button> · PLATFORMS</div>
      <div class="eh-top">
        <div class="eh-id"><h2 class="sh-name" style="color:${platColor(id)}">${esc(p.name)}</h2>
          <div class="eh-tags">
            <span class="echip off">${fmt(totalMCQ)} MCQs · ${esc(D.exam || "NEET PG")}</span>
            <span class="echip off">${subjects.length} subjects · ${fmt(totalUnits)} ${esc(unitNoun)}</span>
          </div>
        </div>
        <div class="eh-hero">
          <span class="hero-num num">${heroNum === "—" ? "—" : '<span class="hn-star" aria-hidden="true">★</span> ' + esc(String(heroNum))}</span>
          <span class="hero-lbl">${reli ? "App-Store rating " + epiBadge("public-3p") : "no public rating"}</span>
          <span class="hero-note muted small">${reli ? esc(reli.ratingsLabel || "") + " ratings · captured " + esc(reliCap) : ""}</span>
        </div>
      </div>
    </div>`;

  /* ---- 6-tile strip (mobile density; tappable where relational) ---- */
  const topSub = subjects.slice().sort((a, b) => b._mcqs - a._mcqs)[0];
  const tiles = `<div class="tiles">`
    + statTile({ accent: platCls(id), value: reli && reli.rating != null ? (reli.ratingApprox ? "~" : "") + reli.rating : "—", label: "RATING ★", note: reli ? (reli.ratingsLabel || "App Store") : "no public rating", epi: reli ? "public-3p" : null })
    + statTile({ accent: platCls(id), value: fmt(totalMCQ), label: "MCQs", note: "across " + subjects.length + " subjects" })
    + statTile({ accent: platCls(id), value: subjects.length, label: "SUBJECTS", note: topSub ? "top: " + esc(canon(topSub.subject)) : "" })
    + statTile({ value: roster.length || "—", label: "FACULTY", note: roster.length ? "with affiliations here" : "none seeded yet", epi: roster.length ? "directional" : null })
    + statTile({ value: ro.a, label: "YOU ATTEMPTED", note: pct(ro.a, ro.total) + "% of " + fmt(ro.total) + " " + esc(unitNoun), epi: "measured" })
    + statTile({ value: ro.r, label: "YOU REVIEWED", note: pct(ro.r, ro.total) + "% reviewed", epi: "measured" })
    + `</div>`;

  /* ---- Pl.1 — RELIABILITY SCORECARD (public-3p, dated, sourced; warn = 6px dot) ---- */
  let reliPlate;
  if (reli) {
    reliPlate = chartFrame(
      "Reliability — iOS App Store",
      "public-3p", [reli.sourceId].filter(Boolean), reliCap,
      ratingScorecard([reli], "reliability"),
      {
        legend: `<span class="cf-key"><span class="wdot"></span>recurring complaint theme</span>`,
        note: (D.reliability && D.reliability.note ? esc(D.reliability.note) + " " : "")
          + "Public third-party signal — money never moves the score. Complaint themes are surfaced as neutral dots, never a shaming bar."
      }
    );
  } else {
    reliPlate = panel({
      title: "Reliability — iOS App Store",
      epi: "public-3p",
      body: _platEmpty({ mark: "compass", title: "No public rating yet",
        body: `No iOS App-Store rating is captured for ${esc(p.name)} so far. This plate fills in when a public third-party signal is sourced ${epiBadge("public-3p")} — money never moves the score.` })
    });
  }

  /* ---- Pl.2 — COVERAGE BY SUBJECT (measured counts; proxy density fill; → Subject pages) ---- */
  const covItems = subjects.map(s => {
    const c = canon(s.subject);
    return {
      label: c,
      value: s._mcqs,
      go: "subject:" + c,
      mark: strongSubs.has(c) ? `<span class="rb-strong" title="Community-reputed strongest here (directional)">◆</span>` : null
    };
  }).sort((a, b) => b.value - a.value);
  const coverage = chartFrame(
    "Coverage by subject — MCQ mass",
    "measured", [], D.captured,
    rankedBars(covItems, { colorFn: () => platColor(id) }),
    {
      legend: `<span class="cf-key"><span class="lg-swatch" style="background:${platColor(id)}"></span>${esc(p.name)} MCQs (measured)</span>`
        + (strongSubs.size ? `<span class="cf-key"><span class="rb-strong">◆</span>community-reputed strongest ${epiBadge("directional")}</span>` : ""),
      note: `Bar length = number of MCQs this platform carries in each subject (measured, ${esc(D.captured)}). ◆ marks subjects the community reputes ${esc(p.name)} strongest at (directional). Tap a subject to open its cross-platform page.`
    }
  );

  /* desktop-only treemap of the same mass (≥1024); degrades to the ranked bars
     above on narrow viewports. Gate in JS so the contract holds even where the
     `.plat-treemap{display:none}` CSS gate is not linked — a thin treemap is
     unreadable and would otherwise duplicate the coverage bars on mobile. */
  const isDesktop = (typeof matchMedia !== "function") || matchMedia("(min-width:1024px)").matches;
  let treemapBand = "";
  if (isDesktop) {
    const tmItems = covItems.filter(i => i.value > 0).map(i => ({ label: i.label, value: i.value, go: i.go }));
    const treemapPlate = chartFrame(
      "Where the mass sits — treemap",
      "measured", [], D.captured,
      treemap(tmItems),
      { note: "Tile area = MCQ mass per subject (measured). Desktop view of the same data as the ranked bars — tap a tile to open the Subject page." }
    );
    treemapBand = `<div class="plat-treemap">${treemapPlate}</div>`;
  }

  /* ---- FACULTY ROSTER (gated; aggregate-only; → Faculty pages) ---- */
  let facultyPanel;
  if (!FACULTY.length) {
    facultyPanel = panel({
      title: "Faculty roster",
      epi: "directional",
      body: _platEmpty({ mark: "quill", title: "Profiles forthcoming",
        body: `Faculty profiles are being seeded from public sources. <b>0 live</b> across Calvetra so far. Aggregate-only · community-sentiment · never a ranking of peers ${epiBadge("directional")}.` })
    });
  } else if (!roster.length) {
    facultyPanel = panel({
      title: "Faculty roster",
      epi: "directional",
      body: _platEmpty({ mark: "quill", title: "No affiliations listed here yet",
        body: `No seeded faculty currently list ${esc(p.name)} among their affiliations. The roster grows as more profiles are sourced ${epiBadge("directional")}.` })
    });
  } else {
    const rows = roster.map(f => {
      const aff = (f.affiliations || []).find(a => a.platformId === id) || {};
      const subs = [...new Set((f.subjects || []).map(canon))];
      const facSrc = [...new Set((f.affiliations || []).flatMap(a => a.sourceIds || []).concat(f.sourceIds || []))];
      return listRow({
        lead: dotLead(platColor(id)),
        title: esc(f.name),
        sub: `${subs.join(" · ")}${aff.status ? ' · <span class="rost-st">' + esc(aff.status) + "</span>" : ""}`,
        trail: aff.status === "past"
          ? `<span class="echip off">past</span>`
          : `<span class="echip off">${esc(aff.role ? aff.role.split(/[,(]/)[0].trim() : "faculty")}</span>`,
        go: "faculty:" + f.id
      });
    });
    const rosterSrc = [...new Set(roster.flatMap(f => (f.affiliations || []).flatMap(a => a.sourceIds || []).concat(f.sourceIds || [])))];
    facultyPanel = panel({
      title: `Faculty roster · ${roster.length}`,
      epi: "directional",
      sourceIds: rosterSrc, captured: "2026-06-27",
      actions: `<span class="ph-note muted small">incl. status: past</span>`,
      body: groupList(rows)
        + `<p class="muted small" style="margin-top:8px">Career history from public sources (directional seed). Aggregate · community-sentiment · not endorsement. Tap a name for the full career timeline.</p>`
    });
  }

  /* ---- YOUR TRACKING ON THIS PLATFORM (measured, local) ---- */
  /* per-subject progress mini-rows (your coverage where you've started) */
  const subProg = subjects.map(s => {
    const sids = LEAVES.filter(l => l.platform === id && l.subject === s.subject).map(l => l.id);
    const r = rollup(sids);
    return { subject: canon(s.subject), r };
  }).filter(x => x.r.a > 0 || x.r.r > 0).sort((a, b) => b.r.a - a.r.a).slice(0, 8);
  const trackBody = ro.a || ro.r
    ? bigMeter(ro)
      + (subProg.length
        ? `<div class="track-subs">` + groupList(subProg.map(x => listRow({
            title: esc(x.subject),
            sub: `${x.r.a}/${x.r.total} attempted · ${x.r.r} reviewed`,
            trail: meterHTML(x.r.a, x.r.total),
            go: "subject:" + x.subject
          }))) + `</div>`
        : "")
    : _platEmpty({ mark: "ledger", title: "Your trail starts here",
        body: `You haven't tracked any ${esc(unitNoun)} on ${esc(p.name)} yet. Open the QBank Tracker to start ticking — it stays private on this device ${epiBadge("measured")}.` });
  const tracking = panel({
    title: "Your tracking on this platform",
    epi: "measured",
    body: trackBody
      + `<p class="muted small" style="margin-top:8px">Your tracked activity on this device (measured, local). Stays private — Calvetra is local-first.</p>`
  });

  v.innerHTML = head + tiles
    + `<div class="panel-grid">${reliPlate}${coverage}</div>`
    + `<div class="inst-grid">${facultyPanel}${tracking}</div>`
    + treemapBand;

  /* ---- CRAFT post-render enhancement (all additive, reduced-motion-safe) ----
     animateView() in main.js handles [data-reveal] rise/fade + .cframe.plate
     chartIntro once on entrance via the shared once-only IntersectionObserver.
     Here we only (a) flag the structural blocks as reveal targets (stagger cap
     handled by motion.js) and (b) make the desktop treemap tiles a real, calm,
     accessible affordance — without touching the shared treemap() output. */
  _platEnhance(v, p);
}

/* Stamp reveal targets + upgrade treemap tiles. Pure DOM post-pass over the
   freshly-rendered view; never changes data, labels, or routes. */
function _platEnhance(v, p) {
  // (a) reveal: entity head + each plate/panel in the two grids + the treemap band.
  const eh = v.querySelector(".entity-head"); if (eh) eh.setAttribute("data-reveal", "");
  v.querySelectorAll(".panel-grid > *, .inst-grid > *, .plat-treemap > *")
    .forEach(n => n.setAttribute("data-reveal", ""));

  // (b) treemap tiles → calm, accessible affordance. The shared treemap() emits
  // <g class="tm-tile is-link"> with the go-attr already; we add a programmatic
  // label, keyboard reachability, and a per-tile entrance index (--ti, largest
  // first — tiles are already sorted by mass desc in treemap()). Hover/focus
  // lift + entrance live in css/platform.css (transform-free; firewall-safe).
  const tiles = v.querySelectorAll(".plat-treemap .tm-tile");
  tiles.forEach((g, i) => {
    g.style.setProperty("--ti", Math.min(i, 12));   // cap so a big set never crawls
    if (g.classList.contains("is-link")) {
      if (!g.hasAttribute("tabindex")) g.setAttribute("tabindex", "0");
      g.setAttribute("role", "link");
      const t = g.querySelector("title");
      if (t && !g.hasAttribute("aria-label")) g.setAttribute("aria-label", t.textContent + " — open subject");
      // Enter/Space activates via the existing data-go delegation (synthesize a click).
      if (!g.dataset.kb) {
        g.dataset.kb = "1";
        g.addEventListener("keydown", e => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
        });
      }
    }
  });
}
