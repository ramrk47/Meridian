/* ============================================================
   surfaces/overview.js — OVERVIEW (the Atlas HOME)
   Density-first KPI deck + relational viz (subject×platform heatmap,
   consensus, reliability scorecard) + curated judgment surfaces.
   Built on shared ds.js primitives (statTile / listRow / heatmap /
   consensusMark / ratingScorecard / chartFrame / panel) — every datum
   epistemically labelled + sourced; entity links route the IMDB triangle.
   ============================================================ */
function renderOverview() {
  resetPlates();                                  // each surface starts at Pl. 1
  const v = $("#view-overview"); v.innerHTML = "";

  /* ---- tracked-progress rollups (YOUR data → measured, local) ---- */
  const att = allModuleIds.filter(id => Store.prog(id).a).length;
  const rev = allModuleIds.filter(id => Store.prog(id).r).length;
  const scored = Object.keys(Store.state.scores).length;
  const mastered = allModuleIds.filter(id => Store.prog(id).t).length;
  const hyLeaves = LEAVES.filter(l => l.priority === 3);
  const hyTotal = hyLeaves.length;
  const hyDone = hyLeaves.filter(l => Store.prog(l.id).a).length;

  /* ============================================================
     §1  KPI DECK — ≥6 compact tappable tiles above the fold.
     ONE serif hero (combined MCQs, measured); rest tabular sans.
     Tiles route to entities where they map to one (the relational hook).
     ============================================================ */
  const deck = el("div", "ov-deck tiles");
  deck.innerHTML =
    statTile({ value: fmt(QBANK_MCQ), label: `MCQs · ${QBANKS.length} BANKS`,
      note: QBANKS.map(p => p.name).join(" + "), accent: "g", epi: "measured", hero: true }) +
    statTile({ value: `${pct(att, allModuleIds.length)}%`, label: "Attempted",
      note: `${fmt(att)} of ${fmt(allModuleIds.length)} topics`, accent: "m", epi: "measured" }) +
    statTile({ value: fmt(rev), label: "Reviewed",
      note: "2nd-pass topics", accent: "k", epi: "measured" }) +
    statTile({ value: `${pct(hyDone, hyTotal)}%`, label: "Top-density done",
      note: `${hyDone} of ${hyTotal} ★★★`, accent: "c", epi: "proxy" }) +
    statTile({ value: fmt(hyTotal - hyDone), label: "Density gaps",
      note: "untouched ★★★ topics", accent: "g", epi: "proxy" }) +
    statTile({ value: fmt(scored), label: "Tests scored",
      note: `${mastered} mastered`, accent: "k", epi: "measured" });
  v.appendChild(deck);

  /* ============================================================
     §2  DO-NEXT — Continue + Next best moves (inset groupLists).
     Preserves tracking wiring: data-open-leaf (drawer) + data-quick-a (toggle).
     ============================================================ */
  const grid = el("div", "inst-grid");

  // continue where you left off — most recently tracked modules (local)
  const recent = Object.entries(Store.state.progress)
    .filter(([id]) => LEAF_BY_ID[id])
    .sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0)).slice(0, 6).map(([id]) => LEAF_BY_ID[id]);
  const contBody = recent.length
    ? groupList(recent.map(l => listRow({
        lead: dotLead(platColor(l.platform)),
        title: `<span data-open-leaf="${l.id}">${esc(l.name)}</span>`,
        sub: `${esc(l.canon)} · ${esc(platName(l.platform))}`,
        trail: statusDots(l.id),
      })))
    : `<div class="empty">No modules tracked yet. Open the <b>QBank Tracker</b> and tick a few — your trail shows up here.</div>`;
  grid.appendChild(el("div", "", panel({
    title: "Continue where you left off",
    body: contBody,
  }).replace('<h3>Continue where you left off</h3>',
    '<h3>Continue where you left off</h3><span class="ph-sub">your most recently tracked modules · this device</span>')));

  // next best moves — untracked top-density topics (proxy for exam weight)
  const gaps = hyLeaves.filter(l => !Store.prog(l.id).a)
    .sort((a, b) => b.hyScore - a.hyScore).slice(0, 6);
  const nextBody = groupList(gaps.map(l => listRow({
    lead: hyBadge(l.priority),
    title: `<span data-open-leaf="${l.id}">${esc(l.name)}</span>`,
    sub: `${esc(l.canon)} · ${fmt(l.mcqs)} MCQs`,
    trail: `<button class="qmark" type="button" data-quick-a="${l.id}" title="Mark attempted" aria-label="Mark ${esc(l.name)} attempted">+</button>`,
  })));
  grid.appendChild(el("div", "", panel({
    title: "Your next best moves",
    epi: "proxy",
    actions: `<button class="linkbtn" type="button" data-jump-hygaps>See all gaps →</button>`,
    body: nextBody,
  }).replace(epiBadge("proxy") + '</h3>',
    epiBadge("proxy") + '</h3><span class="ph-sub">top MCQ-density topics you haven\'t started — proxy for exam weight</span>')));
  v.appendChild(grid);

  /* ============================================================
     §3  HERO RELATIONAL VIZ — Subject × Platform MCQ-density heatmap.
     Counts measured; within-row bucketing → proxy. Gold ring overlay =
     community-reputed strongest (directional, separately sourced + legended).
     ============================================================ */
  // per-subject, per-platform MCQ totals (measured)
  const subMap = {};                      // canon → { platformId → mcqs }
  QBANKS.forEach(p => freshSubjects(p).forEach(s => {
    const c = canon(s.subject);
    (subMap[c] = subMap[c] || {})[p.id] = (subMap[c][p.id] || 0) + s._mcqs;
  }));
  const subTotal = c => QBANKS.reduce((a, p) => a + (subMap[c][p.id] || 0), 0);
  const subjectsRanked = Object.keys(subMap).sort((a, b) => subTotal(b) - subTotal(a));

  // strength lookup: canon → platformId community-reputed strongest (directional)
  const strongBy = {};
  (CUR.strength?.subjects || []).forEach(r => {
    const top = (r.strong || []).find(x => x.platformId && PLAT_BY_ID[x.platformId]);
    if (top) strongBy[canon(r.subject)] = top.platformId;
  });

  const hmRows = subjectsRanked.map(c => ({ key: c, label: c, go: "subject:" + c }));
  const hmCols = QBANKS.map(p => ({ id: p.id, label: p.name, color: platColor(p.id) }));
  const hmVal = (rowKey, colId) => {
    const raw = (subMap[rowKey] || {})[colId] || 0;
    const row = subMap[rowKey] || {};
    const mx = Math.max(1, ...QBANKS.map(p => row[p.id] || 0));
    return { v: fmt(raw), raw, t: raw / mx };
  };
  const heatLegend =
    `<span class="cf-key"><span class="lg-ramp"><i style="background:var(--y1)"></i><i style="background:var(--y2)"></i>` +
    `<i style="background:var(--y3)"></i><i style="background:var(--y4)"></i><i style="background:var(--y5)"></i></span>MCQ density ${epiBadge("proxy")}</span>` +
    (Object.keys(strongBy).length
      ? `<span class="cf-key"><span class="lg-ring"></span>community-reputed strongest ${epiBadge("directional")}</span>` : "");
  const heatNote = "Cell shade = within-subject MCQ density (proxy, not measured exam yield). Counts are measured. " +
    "Gold ring = the platform aspirants most often call strongest for that subject — community reputation, directional. " +
    "Tap a cell for the raw count; tap a subject to open its page.";
  v.appendChild(el("div", "", chartFrame(
    "Subject × platform — MCQ density",
    "proxy",
    (CUR.strength?.sourceIds || []),
    CUR.strength?.captured || D.captured,
    heatmap(hmRows, hmCols, hmVal, { ringFn: c => strongBy[c] || null }),
    { legend: heatLegend, note: heatNote }
  )));

  /* ============================================================
     §4  CONSENSUS + RELIABILITY — judgment band (two panels desktop).
     ============================================================ */
  const band = el("div", "panel-grid");

  // consensus: how many of the 3 integrated platforms flag a subject top-density (proxy)
  const consensus = subjectsRanked.map(c => {
    const plats = QBANKS.map(p => ({
      id: p.id,
      on: LEAVES.some(l => l.canon === c && l.platform === p.id && l.priority === 3),
    }));
    const agree = plats.filter(p => p.on).length;
    return { c, plats, agree };
  }).filter(x => x.agree > 0)
    .sort((a, b) => b.agree - a.agree || subTotal(b.c) - subTotal(a.c))
    .slice(0, 7);
  const consBody = groupList(consensus.map(x => listRow({
    title: `<span data-go-subject="${esc(x.c)}">${esc(x.c)}</span>`,
    sub: `${fmt(subTotal(x.c))} MCQs · ${x.agree} of ${QBANKS.length} flag top-density`,
    trail: consensusMark(null, x.plats),
    go: "subject:" + x.c,
  })));
  band.appendChild(el("div", "", panel({
    title: "Consensus high-yield",
    epi: "proxy",
    sourceIds: CUR.strength?.sourceIds || [],
    captured: CUR.strength?.captured || D.captured,
    body: consBody + `<div class="ph-sub" style="margin-top:8px">Subjects where ≥2 independent platforms independently flag top MCQ-density — a cross-platform proxy for high-yield, not measured exam consensus.</div>`,
  }).replace(epiBadge("proxy") + '</h3>',
    epiBadge("proxy") + '</h3><span class="ph-sub">where the platforms agree</span>')));

  // reliability scorecard (public-3p) — neutral, warn = 6px dot (in ds.js)
  if (CUR.reliability?.apps?.length) {
    band.appendChild(el("div", "", panel({
      title: "App reliability — iOS App Store (India)",
      epi: CUR.reliability.epistemic,
      sourceIds: [],
      captured: CUR.reliability.captured,
      actions: `<a class="linkbtn" href="#howrate">How we rate →</a>`,
      body: ratingScorecard(CUR.reliability.apps, "reliability") +
        (CUR.reliability.note ? `<div class="ph-sub" style="margin-top:8px">${esc(CUR.reliability.note)}</div>` : ""),
    }).replace(epiBadge(CUR.reliability.epistemic) + '</h3>',
      epiBadge(CUR.reliability.epistemic) + `</h3><span class="ph-sub">third-party stars + recurring complaints · captured ${esc(CUR.reliability.captured)} — reliability signal, not content quality, not a Meridian score</span>`)));
  }
  v.appendChild(band);

  /* ============================================================
     §5  CURATED JUDGMENT TABLES + METHODOLOGY (reachable "How we rate")
     ============================================================ */
  const sub = renderSubjectStrength(); if (sub) v.appendChild(sub);
  v.appendChild(renderMethodology());
}

/* ---- best-platform-per-subject (community reputation, directional) ---- */
function renderSubjectStrength() {
  const s = CUR.strength; if (!s || !s.subjects?.length) return null;
  const rows = s.subjects.map(r => listRow({
    title: `<span data-go-subject="${esc(canon(r.subject))}">${esc(r.subject)}</span>`,
    trail: r.strong.map(platRefChip).join(" "),
    go: "subject:" + canon(r.subject),
  }));
  return el("div", "", panel({
    title: "Best platform per subject — community reputation",
    epi: s.epistemic,
    sourceIds: s.sourceIds,
    captured: s.captured,
    body: groupList(rows),
  }).replace(epiBadge(s.epistemic) + '</h3>',
    epiBadge(s.epistemic) + '</h3><span class="ph-sub">which platform aspirants most often call strongest — reputation only, never Meridian\'s verdict</span>'));
}

/* renderReliability kept for back-compat callers; Overview now uses the inline scorecard. */
function renderReliability() {
  const r = CUR.reliability; if (!r || !r.apps?.length) return null;
  return el("div", "", panel({
    title: "App reliability — iOS App Store (India)",
    epi: r.epistemic,
    captured: r.captured,
    body: ratingScorecard(r.apps, "reliability") + (r.note ? `<div class="ph-sub" style="margin-top:8px">${esc(r.note)}</div>` : ""),
  }));
}

/* ---- How we rate · sources (the neutrality firewall surface) ---- */
function renderMethodology() {
  const m = CUR.method;
  const p = el("section", "panel howrate");
  p.id = "howrate";
  p.innerHTML = `<div class="ph"><div class="ph-l"><h3>How we rate · sources</h3>
    <span class="ph-sub">every figure in Meridian is labelled by how much we actually know — counts, proxy, community reputation, or public data</span></div></div>`;
  if (m?.labels?.length) {
    const defs = el("div", "epi-defs");
    defs.innerHTML = m.labels.map(l => `<div class="epi-def"><span class="epi ${l.tag}">${esc(l.name)}</span><span class="epi-d">${esc(l.desc)}</span></div>`).join("");
    p.appendChild(defs);
  }
  if (m?.firewall) p.appendChild(el("div", "callout firewall", `<b>Neutrality firewall.</b> ${esc(m.firewall)}`));
  if (CUR.sources.length) {
    p.appendChild(el("div", "dr-lbl", "Sources"));
    const ul = el("ul", "src-list");
    ul.innerHTML = CUR.sources.map(s => {
      const t = /^https?:/.test(s.url || "")
        ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`
        : `<span>${esc(s.title)}</span>`;
      return `<li>${t} <span class="muted">— ${esc(s.publisher || "")} · ${esc(s.type)} · captured ${esc(s.captured)}</span></li>`;
    }).join("");
    p.appendChild(ul);
  }
  return p;
}
