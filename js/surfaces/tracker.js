/* ============================================================
   surfaces/tracker.js — THE RETAIN SURFACE (the spreadsheet-killer)
   Two lenses, one tab:
     · "cross" — Unified Cross-Platform Tracker, organized around D.library
                 (canonical subjects → topics). Coverage + UNION tracking status
                 ("done on Marrow" satisfies the canonical topic) + completion
                 proof (HY-union coverage + importance-ranked untracked gaps) +
                 the genuinely-unmapped HY topics surfaced honestly.   [Stage 2]
     · "pyq"   — PYQ Tracker. Actual past-exam question counts per platform
                 (measured = the strongest honest yield signal we hold), tracked
                 across platforms; Cerebellum shown as "no PYQ capture".  [Stage 1]
   Reuses the standard tracking seam: leaf/paper rows carry `.mrow`+data-id+[data-act]
   chips, so the shared appClick delegation + refreshRowEverywhere keep them in sync.
   Aggregates (union dots, meters, tiles) update on the global `state-changed` event.
   Every figure carries its epistemic label + source (chartFrame/panel). Coverage pips
   come from the centralized libCoverageChips (core.js) so the future "My subscriptions"
   .cov-mine row lands additively, everywhere, for free.
   ============================================================ */
let trkLens = "cross";        // "cross" | "pyq"  (lens chosen via the top sub-nav)
/* PYQ lens state */
let pyqExam = "all";          // all | NEET PG | INI-CET | FMGE | AIIMS
let pyqPlatform = "all";
let pyqSubject = "all";
let pyqSet = "pyq";           // "pyq" (past papers only) | "all" (+ revision sets)
/* cross lens state */
let trkSubject = "all";
let trkFilter = "all";        // all | hy | gaps (untracked HY) | started

function renderTracker() {
  resetPlates();
  const v = $("#view-tracker"); v.innerHTML = "";
  // lens switching now lives in the shared top sub-nav (Cross-platform · PYQ · QBank),
  // driven by NAV_GROUPS in main.js. renderTracker only reads trkLens to pick the view.
  const body = el("div", "trk-body");
  v.appendChild(body);
  if (trkLens === "pyq") _trkPyq(body); else _trkCross(body);

  _trkBindOnce();
  labelizeResponsiveTables();
  if (typeof animateView === "function") animateView($("#view-tracker"));
}

/* shared tracking chips — the exact qbank markup so appClick/refreshRowEverywhere work */
function _trkChips(id) {
  const p = Store.prog(id);
  return `<span class="chips">`
    + `<button class="chip a ${p.a ? "on" : ""}" data-act="a" aria-pressed="${p.a ? "true" : "false"}" title="Attempted">A</button>`
    + `<button class="chip r ${p.r ? "on" : ""}" data-act="r" aria-pressed="${p.r ? "true" : "false"}" title="Reviewed">R</button>`
    + `<button class="chip t ${p.t ? "on" : ""}" data-act="t" aria-pressed="${p.t ? "true" : "false"}" title="Mastered / redone">Rt</button>`
    + `</span>`;
}

/* ============================================================
   PYQ LENS  (Stage 1) — measured past-exam question coverage
   ============================================================ */
const _EX_CLS = { "NEET PG": "neet", "INI-CET": "ini", "FMGE": "fmge", "AIIMS": "aiims" };
function _pyqFilter(p) {
  if (pyqSet === "pyq" && p.setKind !== "pyq") return false;
  if (pyqExam !== "all" && p.exam !== pyqExam) return false;
  if (pyqPlatform !== "all" && p.platformId !== pyqPlatform) return false;
  if (pyqSubject !== "all" && p.subject !== pyqSubject) return false;
  return true;
}

function _trkPyq(v) {
  if (!PYQ_DATA || !PYQ_PAPERS.length) {
    v.appendChild(el("div", "", emptyState({ icon: "ledger", title: "No PYQ data captured", body: "Past-year question banks have not been captured yet." })));
    return;
  }
  const CAP = PYQ_CAP;
  const platsWithPyq = PYQ_PLATS.filter(p => p.sets.some(s => s.kind === "pyq"));
  const noPyq = PYQ_PLATS.filter(p => !p.has || !p.sets.some(s => s.kind === "pyq"));
  const pyqOnly = PYQ_PAPERS.filter(p => p.setKind === "pyq");
  const roll = pyqRollup(pyqOnly);
  const byExam = {}; PYQ_EXAMS.forEach(e => byExam[e] = { q: 0, n: 0 });
  pyqOnly.forEach(p => { if (byExam[p.exam]) { byExam[p.exam].q += p.count; byExam[p.exam].n++; } });
  const bySubjQ = {}; pyqOnly.forEach(p => bySubjQ[p.subject] = (bySubjQ[p.subject] || 0) + p.count);
  const heaviest = Object.entries(bySubjQ).sort((a, b) => b[1] - a[1])[0] || ["—", 0];

  /* ── stat tiles — measured past-paper coverage ── */
  const tiles = el("div", "tiles trk-tiles");
  tiles.innerHTML =
    statTile({ accent: "g", hero: true, value: fmt(roll.q), label: "Past-paper questions", note: `${fmt(roll.total)} papers · ${platsWithPyq.length}/${PYQ_PLATS.length} platforms`, epi: "measured" }) +
    statTile({ accent: "m", value: pct(roll.a, roll.total) + "%", label: "You've attempted", note: `${roll.a}/${roll.total} papers`, epi: "measured" }) +
    statTile({ accent: "k", value: fmt(byExam["NEET PG"].q), label: "NEET PG", note: `${byExam["NEET PG"].n} papers`, epi: "measured" }) +
    statTile({ accent: "k", value: fmt(byExam["INI-CET"].q), label: "INI-CET", note: `${byExam["INI-CET"].n} papers`, epi: "measured" }) +
    statTile({ accent: "k", value: fmt(byExam["FMGE"].q), label: "FMGE", note: `${byExam["FMGE"].n} papers`, epi: "measured" }) +
    statTile({ accent: "c", value: fmt(heaviest[1]), label: "Heaviest subject", note: esc(heaviest[0]), epi: "measured", go: "subject:" + heaviest[0] });
  v.appendChild(tiles);
  const heroV = tiles.querySelector(".tile.is-hero .tile-v"); if (heroV) heroV.dataset.count = String(roll.q);

  /* ── honest framing ── */
  const note = el("div", "callout trk-note");
  note.setAttribute("data-reveal", "");
  note.innerHTML = `<b>Previous-year questions are the strongest honest yield signal we hold ${epiBadge("measured")}</b> — these are
    <em>actual past exam questions</em>, counted from each platform's capture, not a proxy. Track which papers you've worked,
    across every bank at once. <span class="muted">${esc(PYQ_DATA.measuredNote)} · captured ${esc(CAP)}.</span>`;
  v.appendChild(note);

  /* ── toolbar: exam segmented + platform/subject/set filters ── */
  const EX_SEG = [{ v: "all", label: "All exams" }].concat(PYQ_EXAMS.map(e => ({ v: e, label: e })));
  const EX_OPTS = [["all", "All exams"]].concat(PYQ_EXAMS.map(e => [e, e]));
  const PLAT_OPTS = [["all", "All platforms"]].concat(platsWithPyq.map(p => [p.platformId, p.name]));
  const SUBJ_OPTS = [["all", "All subjects"]].concat(pyqSubjects().map(s => [s, s]));
  const SET_OPTS = [["pyq", "Past papers only"], ["all", "Incl. revision sets"]];
  const ctr = el("div", "controls trk-controls qb-controls");
  ctr.innerHTML =
    `<div class="trk-examseg desk-ctrl">${segmented(EX_SEG, pyqExam, "pyqExam")}</div>`
    + `<select class="sel desk-ctrl" id="pyqPlat" aria-label="Platform">${PLAT_OPTS.map(([vv, l]) => `<option value="${esc(vv)}"${vv === pyqPlatform ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`
    + `<select class="sel desk-ctrl" id="pyqSubj" aria-label="Subject">${SUBJ_OPTS.map(([vv, l]) => `<option value="${esc(vv)}"${vv === pyqSubject ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`
    + `<select class="sel desk-ctrl" id="pyqSet" aria-label="Paper type">${SET_OPTS.map(([vv, l]) => `<option value="${esc(vv)}"${vv === pyqSet ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`
    + `<button class="iconbtn mob-ctrl" id="pyqExamBtn" aria-label="Exam" title="Exam">◷</button>`
    + `<button class="iconbtn mob-ctrl" id="pyqPlatBtn" aria-label="Platform" title="Platform">▤</button>`
    + `<button class="iconbtn mob-ctrl" id="pyqSubjBtn" aria-label="Subject" title="Subject">☰</button>`
    + `<button class="iconbtn mob-ctrl" id="pyqSetBtn" aria-label="Paper type" title="Type">⛁</button>`
    + `<div class="spacer"></div><span class="count-pill">${pyqOnly.length} past papers</span>`;
  v.appendChild(ctr);
  const exSeg = ctr.querySelector('[data-seg="pyqExam"]');
  if (exSeg) exSeg.addEventListener("click", e => { const b = e.target.closest("[data-seg-v]"); if (b && b.dataset.segV !== pyqExam) { pyqExam = b.dataset.segV; renderTracker(); } });
  $("#pyqPlat")?.addEventListener("change", e => { pyqPlatform = e.target.value; renderTracker(); });
  $("#pyqSubj")?.addEventListener("change", e => { pyqSubject = e.target.value; renderTracker(); });
  $("#pyqSet")?.addEventListener("change", e => { pyqSet = e.target.value; renderTracker(); });
  $("#pyqExamBtn")?.addEventListener("click", () => openSheet("Exam", EX_OPTS, pyqExam, val => { pyqExam = val; renderTracker(); }));
  $("#pyqExamBtn")?.classList.toggle("has-dot", pyqExam !== "all");
  $("#pyqPlatBtn")?.addEventListener("click", () => openSheet("Platform", PLAT_OPTS, pyqPlatform, val => { pyqPlatform = val; renderTracker(); }));
  $("#pyqPlatBtn")?.classList.toggle("has-dot", pyqPlatform !== "all");
  $("#pyqSubjBtn")?.addEventListener("click", () => openSheet("Subject", SUBJ_OPTS, pyqSubject, val => { pyqSubject = val; renderTracker(); }));
  $("#pyqSubjBtn")?.classList.toggle("has-dot", pyqSubject !== "all");
  $("#pyqSetBtn")?.addEventListener("click", () => openSheet("Paper type", SET_OPTS, pyqSet, val => { pyqSet = val; renderTracker(); }));

  /* ── Pl.1 — subject × platform PYQ question heatmap (measured) ── */
  const subjects = pyqSubjects().filter(s => pyqSubject === "all" || s === pyqSubject);
  const hmCols = platsWithPyq.filter(p => pyqPlatform === "all" || p.platformId === pyqPlatform).map(p => ({ id: p.platformId, label: p.name, color: platColor(p.platformId) }));
  const cellQ = {};
  PYQ_PAPERS.filter(p => p.setKind === "pyq" && (pyqExam === "all" || p.exam === pyqExam)).forEach(p => {
    (cellQ[p.subject] = cellQ[p.subject] || {})[p.platformId] = (cellQ[p.subject]?.[p.platformId] || 0) + p.count;
  });
  const maxCell = Math.max(1, ...subjects.flatMap(s => hmCols.map(c => (cellQ[s] || {})[c.id] || 0)));
  const hmRows = subjects.map(s => ({ key: s, label: s, go: "subject:" + s }));
  const hmVal = (rowKey, colId) => { const q = (cellQ[rowKey] || {})[colId] || 0; return q ? { v: fmt(q), raw: q, t: q / maxCell } : { raw: 0 }; };
  if (hmCols.length && subjects.length) {
    const hmLegend = `<span class="lg-ramp"><i class="r0"></i><i class="r1"></i><i class="r2"></i><i class="r3"></i><i class="r4"></i><i class="r5"></i><span>PYQ questions</span></span>`;
    const hp = el("div", "trk-frame"); hp.setAttribute("data-reveal", "");
    hp.innerHTML = chartFrame(
      "Past-paper questions — subject × platform" + (pyqExam === "all" ? "" : " · " + pyqExam),
      "measured", [], CAP, heatmap(hmRows, hmCols, hmVal),
      { legend: hmLegend, plateNo: 1, note: `Cell = captured past-paper questions for that subject on that platform (measured). Cerebellum is absent — it exposes no PYQ bank in our capture. Click a subject to open it.` });
    v.appendChild(hp);
  }

  /* ── body: papers grouped by subject → platform, trackable ── */
  const shown = PYQ_PAPERS.filter(_pyqFilter);
  if (!shown.length) {
    v.appendChild(el("div", "", emptyState({ icon: "ledger", title: "No papers under this filter", body: "Loosen the exam / platform / subject filters to see captured papers." })));
  } else {
    const bySubj = {};
    shown.forEach(p => (bySubj[p.subject] = bySubj[p.subject] || []).push(p));
    const subjOrder = Object.keys(bySubj).sort((a, b) => bySubj[b].reduce((x, p) => x + p.count, 0) - bySubj[a].reduce((x, p) => x + p.count, 0));
    subjOrder.forEach(subj => {
      const papers = bySubj[subj];
      const ro = pyqRollup(papers);
      const block = el("section", "panel trk-subjblock cat-block open");
      block.dataset.subject = subj;
      const platGroups = {};
      papers.forEach(p => (platGroups[p.platformId] = platGroups[p.platformId] || []).push(p));
      const platHtml = Object.keys(platGroups).map(pid => {
        const ps = platGroups[pid].slice().sort((a, b) => (b.year || 0) - (a.year || 0));
        const rows = ps.map(p => _pyqPaperRow(p)).join("");
        const pr = pyqRollup(ps);
        return `<div class="trk-platgroup">`
          + `<div class="trk-plathead" style="--c:${platColor(pid)}"><span class="trk-platname" style="color:${platColor(pid)}">${esc(platDisplayName(pid))}</span>`
          + `<span class="trk-platmeta num">${pr.a}/${pr.total} · ${fmt(pr.q)} Qs</span></div>`
          + `<div class="lgroup trk-papers">${rows}</div></div>`;
      }).join("");
      block.innerHTML =
        `<div class="ph trk-subjhead" data-cat-toggle><div class="ph-l"><h3><a class="is-link" data-go-subject="${esc(subj)}">${esc(subj)}</a></h3>`
        + `<span class="muted trk-sh">${fmt(ro.q)} questions · ${ro.total} papers</span></div>`
        + `<span class="trk-subjmeter">${meterHTML(ro.a, ro.total)}</span></div>`
        + `<div class="trk-subjbody">${platHtml}</div>`;
      v.appendChild(block);
    });
  }

  /* ── honest "no PYQ capture" footnote ── */
  if (noPyq.length) {
    const f = el("div", "trk-nopyq");
    f.innerHTML = `<span class="trk-nopyq-dot"></span>No PYQ bank captured for ${noPyq.map(p => `<b>${esc(p.name)}</b>`).join(", ")} — shown as a real gap, never fabricated.`;
    v.appendChild(f);
  }
}

function _pyqPaperRow(p) {
  const pr = Store.prog(p.id);
  const exCls = _EX_CLS[p.exam] || "oth";
  const sub = `${p.year ? p.year + " · " : ""}${fmt(p.count)} Qs${p.setKind !== "pyq" ? ` · ${p.setKind === "qrp" ? "revision (QRP)" : "express"}` : ""}`;
  return `<div class="lrow mrow pyq-row${pr.a ? " done" : ""}" data-id="${esc(p.id)}">`
    + `<span class="lrow-lead"><span class="pyq-extag ex-${exCls}" title="${esc(p.exam || "exam")}">${esc(p.exam || "—")}</span></span>`
    + `<span class="lrow-main"><span class="lrow-title">${esc(p.label)}</span><span class="lrow-sub">${sub}</span></span>`
    + `<span class="lrow-trail">${_trkChips(p.id)}</span></div>`;
}

/* ============================================================
   CROSS-PLATFORM LENS  (Stage 2) — the spreadsheet-killer.
   Organized around D.library (canonical subjects → topics). For each topic:
   importance (directional) + which platforms cover it (audited platformRefs) +
   your UNION tracking status (done on ANY platform satisfies the topic). Proves
   completion (HY-union coverage + importance-ranked untracked gaps) and surfaces
   the genuinely-unmapped high-yield topics honestly.
   ============================================================ */
const TRK_FILTER_OPTS = [["all", "All topics"], ["hy", "High-yield only"], ["gaps", "Untracked HY gaps"], ["started", "Started"]];
const TRK_PLAT_ORDER = ["marrow", "cerebellum", "doctutorials", "prepladder", "egurukul"].filter(id => typeof PLAT_BY_ID !== "undefined" && PLAT_BY_ID[id]);

function _trkTopicHas(t) { return Object.keys(t.platformRefs || {}).length > 0; }
function _trkSubjTopics(subj) {
  let ts = libTopics(subj);
  if (trkFilter === "hy") ts = ts.filter(t => t.tier === 3);
  else if (trkFilter === "gaps") ts = ts.filter(t => t.tier === 3 && !libTopicUnion(t).started);
  else if (trkFilter === "started") ts = ts.filter(t => libTopicUnion(t).started);
  return ts;
}
/* per-subject HY-union completion (for the proof bars + headers) */
function _trkSubjHy(subj) {
  const hy = libTopics(subj).filter(t => t.tier === 3);
  const started = hy.filter(t => libTopicUnion(t).started).length;
  const mapped = hy.filter(_trkTopicHas).length;
  return { total: hy.length, started, mapped };
}

function _trkCross(v) {
  if (!LIB || !LIB_TOPICS.length) {
    v.appendChild(el("div", "", emptyState({ icon: "compass", title: "No canonical library", body: "The topic spine (D.library) is unavailable." })));
    return;
  }
  const CAP = LIB_CAP;
  const allHy = LIB_TOPICS.filter(t => t.tier === 3);
  const hyStarted = allHy.filter(t => libTopicUnion(t).started).length;
  const hyMapped = LIB_COV ? LIB_COV.hyWithAnyPlatform : allHy.filter(_trkTopicHas).length;
  const topicsStarted = LIB_TOPICS.filter(t => libTopicUnion(t).started).length;
  const genuineGaps = allHy.filter(t => !_trkTopicHas(t)).sort(_byImp);

  /* ── stat tiles — completion proof (≥6) ── */
  const tiles = el("div", "tiles trk-tiles");
  tiles.innerHTML =
    statTile({ accent: "g", hero: true, value: pct(hyStarted, allHy.length) + "%", label: "High-yield done", note: `${hyStarted}/${allHy.length} HY topics · union`, epi: "measured" }) +
    statTile({ accent: "k", value: `${hyMapped}/${allHy.length}`, label: "Mapped to a platform", note: "audited cross-platform", epi: "directional" }) +
    statTile({ accent: "m", value: pct(topicsStarted, LIB_TOPICS.length) + "%", label: "All topics touched", note: `${fmt(topicsStarted)}/${fmt(LIB_TOPICS.length)}`, epi: "measured" }) +
    statTile({ accent: "c", value: fmt(allHy.length - hyStarted), label: "High-yield remaining", note: "ranked below", epi: "measured" }) +
    statTile({ accent: "g", value: fmt(genuineGaps.length), label: "Genuine HY gaps", note: "truly unmapped — real gaps", epi: "directional" }) +
    statTile({ accent: "k", value: fmt(LIB_TOPICS.length), label: "Canonical topics", note: `${LIB_SUBJECTS.length} subjects`, epi: "directional" });
  v.appendChild(tiles);
  const heroV = tiles.querySelector(".tile.is-hero .tile-v"); if (heroV) heroV.dataset.count = String(pct(hyStarted, allHy.length));

  /* ── honest framing ── */
  const note = el("div", "callout trk-note");
  note.setAttribute("data-reveal", "");
  note.innerHTML = `<b>One plan across every platform — and proof you're finishing it.</b> Topics come from the canonical
    spine (community-curated PYQ importance ${epiBadge("directional")}); coverage pips are the <em>audited</em> cross-platform
    map. Status is the <b>union</b>: marking a topic done on Marrow satisfies it — it is <em>not</em> re-flagged as missing on
    every other bank. <span class="muted">Source: ${LIB_SRC ? srcLinks(LIB_SRC_IDS) : "masterlist"} · captured ${esc(CAP)}.
    Where naming differs we say "not mapped" rather than guess. Method → <button type="button" class="linkbtn" data-trk-howrate>How we rate ↗</button></span>`;
  v.appendChild(note);

  /* ── toolbar: subject focus + filter ── */
  const SUBJ_OPTS = [["all", "All subjects"]].concat(LIB_SUBJECTS.slice().sort().map(s => [s, s]));
  const ctr = el("div", "controls trk-controls qb-controls");
  ctr.innerHTML =
    `<select class="sel desk-ctrl" id="trkSubj" aria-label="Subject">${SUBJ_OPTS.map(([vv, l]) => `<option value="${esc(vv)}"${vv === trkSubject ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`
    + `<select class="sel desk-ctrl" id="trkFilter" aria-label="Filter">${TRK_FILTER_OPTS.map(([vv, l]) => `<option value="${esc(vv)}"${vv === trkFilter ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`
    + `<button class="iconbtn mob-ctrl" id="trkSubjBtn" aria-label="Subject" title="Subject">☰</button>`
    + `<button class="iconbtn mob-ctrl" id="trkFilterBtn" aria-label="Filter" title="Filter">⛁</button>`
    + `<div class="spacer"></div><span class="count-pill">${trkFilter === "all" ? fmt(LIB_TOPICS.length) + " topics" : (TRK_FILTER_OPTS.find(o => o[0] === trkFilter) || ["", ""])[1]}</span>`;
  v.appendChild(ctr);
  $("#trkSubj")?.addEventListener("change", e => { trkSubject = e.target.value; renderTracker(); });
  $("#trkFilter")?.addEventListener("change", e => { trkFilter = e.target.value; renderTracker(); });
  $("#trkSubjBtn")?.addEventListener("click", () => openSheet("Subject", SUBJ_OPTS, trkSubject, val => { trkSubject = val; renderTracker(); }));
  $("#trkSubjBtn")?.classList.toggle("has-dot", trkSubject !== "all");
  $("#trkFilterBtn")?.addEventListener("click", () => openSheet("Filter", TRK_FILTER_OPTS, trkFilter, val => { trkFilter = val; renderTracker(); }));
  $("#trkFilterBtn")?.classList.toggle("has-dot", trkFilter !== "all");

  /* ── PROVE COMPLETION: HY-union by subject + importance-ranked untracked gaps ── */
  const subjStats = LIB_SUBJECTS.map(s => ({ s, ...(_trkSubjHy(s)) })).filter(x => x.total > 0);
  const barItems = subjStats.slice()
    .sort((a, b) => (a.started / (a.total || 1)) - (b.started / (b.total || 1)))
    .map(x => ({ label: x.s, value: pct(x.started, x.total), t: x.started / (x.total || 1), go: "subject:" + x.s, mark: `${x.started}/${x.total}` }));
  const proveGrid = el("div", "trk-prove-grid");
  proveGrid.setAttribute("data-reveal", "");
  const barFrame = chartFrame(
    "High-yield completion by subject (union)", "measured", [], CAP,
    rankedBars(barItems, { nosort: true }),
    { plateNo: 1, legend: `<span class="lg-ramp"><i class="r0"></i><i class="r1"></i><i class="r2"></i><i class="r3"></i><i class="r4"></i><i class="r5"></i><span>% HY done</span></span>`,
      note: `Each bar = share of that subject's high-yield topics you've started on <em>any</em> platform (measured, union). Weakest first — that's where to spend next. Click a subject to open it.` });

  // untracked HY gaps (importance-ranked) — what you haven't started
  const gapScope = trkSubject === "all" ? allHy : allHy.filter(t => t.subject === trkSubject);
  const untracked = gapScope.filter(t => _trkTopicHas(t) && !libTopicUnion(t).started).sort(_byImp);
  const gapRows = untracked.slice(0, 24).map(t => listRow({
    lead: impStars(t.tier),
    title: `<a class="is-link" data-go-subject="${esc(t.subject)}">${esc(t.name)}</a>`,
    sub: `<span class="trk-sectag">${esc(trkSubject === "all" ? t.subject : t.section)}</span>`
      + (t.timesRepeated != null ? ` <span class="trk-freq">asked ${t.timesRepeated}×</span>` : "")
      + ` <span class="trk-gap-start">start on ${esc(libTopicPlatformLeaves(t).map(g => platName(g.platformId)).join(", ") || "—")}</span>`,
    trail: libCoverageChips(t),
  }));
  const gapsPanel = panel({
    title: "Untracked high-yield — start here", epi: "measured", sourceIds: LIB_SRC_IDS, captured: CAP, curated: true,
    actions: `<span class="count-pill">${untracked.length} topics</span>`,
    body: untracked.length
      ? groupList(gapRows, "trk-gaplist") + (untracked.length > 24 ? `<div class="cf-note">Showing the 24 highest-importance; ${untracked.length - 24} more under the filters.</div>` : "")
      : emptyState({ icon: "gauge", title: "No untracked high-yield here", body: trkSubject === "all" ? "You've started every mapped high-yield topic. 🎯" : `You've started every mapped high-yield topic in ${esc(trkSubject)}.` }),
  });
  proveGrid.innerHTML = `<div class="trk-frame">${barFrame}</div>` + gapsPanel;
  v.appendChild(proveGrid);

  /* ── genuinely-unmapped high-yield topics (real gaps, surfaced honestly) ── */
  if (genuineGaps.length) {
    const grows = genuineGaps.map(t => listRow({
      lead: impStars(t.tier),
      title: `<a class="is-link" data-go-subject="${esc(t.subject)}">${esc(t.name)}</a>`,
      sub: `<span class="trk-sectag">${esc(t.subject)} · ${esc(t.section)}</span>` + (t.pyqAngle ? ` <span class="trk-angle">${esc(t.pyqAngle)}</span>` : ""),
      trail: `<span class="cov-none">— no platform</span>`,
    }).replace('class="lrow"', 'class="lrow trk-genuine"'));
    v.appendChild(_trkEl(panel({
      title: "Genuine high-yield gaps — no platform covers these", epi: "directional", sourceIds: LIB_SRC_IDS, captured: CAP, curated: true,
      actions: `<span class="count-pill">${genuineGaps.length} topics</span>`,
      body: groupList(grows, "trk-genuinelist") + `<div class="cf-note">High-yield by PYQ frequency, yet <b>no</b> integrated platform confidently covers them — a real gap to fill from notes / a PYQ pass, not a mapping miss. The honest opposite of hiding what we don't have.</div>`,
    })));
  }

  /* ── BODY: subject sections → topics → per-platform leaves (lazy by subject) ── */
  const bodySubjects = (trkSubject === "all" ? LIB_SUBJECTS.slice().sort() : [trkSubject])
    .filter(s => _trkSubjTopics(s).length > 0);
  const bodyHead = el("div", "trk-bodyhead");
  bodyHead.innerHTML = `<h3>Track by canonical topic</h3><span class="muted small">expand a subject → a topic → tick the platform you used. Coverage pips show every bank that covers it.</span>`;
  v.appendChild(bodyHead);
  bodySubjects.forEach(subj => {
    const hy = _trkSubjHy(subj);
    const tcount = _trkSubjTopics(subj).length;
    const open = trkSubject !== "all";
    const block = el("section", "panel trk-subjblock cross" + (open ? " open" : ""));
    block.dataset.subject = subj;
    block.innerHTML =
      `<div class="ph trk-subjhead"><div class="ph-l"><h3><a class="is-link" data-go-subject="${esc(subj)}">${esc(subj)}</a></h3>`
      + `<span class="muted trk-sh">${tcount} ${trkFilter === "all" ? "topics" : "shown"} · ${hy.started}/${hy.total} HY done</span></div>`
      + `<span class="trk-subjmeter" title="High-yield topics started (union)">${meterHTML(hy.started, hy.total)}</span></div>`
      + `<div class="trk-subjbody"></div>`;
    v.appendChild(block);
    if (open) _trkRenderSubjectTopics(block);
  });
}

/* lazy-populate a subject block's topics (rendered on first expand) */
function _trkRenderSubjectTopics(block) {
  const bodyEl = $(".trk-subjbody", block);
  if (!bodyEl || bodyEl.dataset.loaded) return;
  bodyEl.dataset.loaded = "1";
  const topics = _trkSubjTopics(block.dataset.subject);
  bodyEl.innerHTML = topics.length
    ? topics.map(_trkTopicHtml).join("")
    : emptyState({ icon: "compass", title: "No topics under this filter", body: "Loosen the filter to see this subject's topics." });
}

function _trkUnionDots(u) {
  return `<span class="trk-union" title="Union across mapped platforms — ${u.a} attempted · ${u.r} reviewed · ${u.t} mastered of ${u.total} leaves">`
    + `<i class="ud a${u.a ? " on" : ""}"></i><i class="ud r${u.r ? " on" : ""}"></i><i class="ud t${u.t ? " on" : ""}"></i>`
    + (u.plats ? `<span class="trk-platsdone">${u.platsDone}/${u.plats}</span>` : "")
    + `</span>`;
}
function _trkLeafRow(leafId) {
  const m = MODULE_BY_ID[leafId]; if (!m) return "";
  const pr = Store.prog(leafId);
  return `<div class="lrow mrow trk-leafrow${pr.a ? " done" : ""}" data-id="${esc(leafId)}">`
    + `<span class="lrow-main"><span class="lrow-title">${esc(m.name)}</span>`
    + `<span class="lrow-sub" style="color:${platColor(m.platform)}">${esc(platName(m.platform))}${m.mcqs ? ` · ${fmt(m.mcqs)} MCQs` : ""}</span></span>`
    + `<span class="lrow-trail">${_trkChips(leafId)}</span></div>`;
}
function _trkTopicHtml(t) {
  const u = libTopicUnion(t);
  const groups = libTopicPlatformLeaves(t);
  const expandable = groups.length > 0;
  const angle = t.pyqAngle ? `<span class="trk-angle" title="${esc(t.pyqAngle)}">${esc(t.pyqAngle)}</span>` : "";
  const freq = t.timesRepeated != null ? `<span class="trk-freq">asked ${t.timesRepeated}×</span>` : "";
  const row = `<div class="lrow trk-topic${expandable ? " is-link" : ""}" role="button" tabindex="0" aria-expanded="false">`
    + `<span class="lrow-lead">${impStars(t.tier)}</span>`
    + `<span class="lrow-main"><span class="lrow-title">${esc(t.name)}</span>`
    + `<span class="lrow-sub"><span class="trk-sectag">${esc(t.section)}</span>${freq}${angle}</span></span>`
    + `<span class="lrow-trail trk-topic-trail">${libCoverageChips(t)}${_trkUnionDots(u)}</span></div>`;
  let inner;
  if (expandable) {
    const mapped = new Set(groups.map(g => g.platformId));
    const unmapped = TRK_PLAT_ORDER.filter(id => !mapped.has(id)).map(platName);
    inner = groups.map(g => `<div class="trk-leaf-platlabel" style="color:${platColor(g.platformId)}">${esc(platName(g.platformId))}</div>`
      + g.leafIds.map(_trkLeafRow).join("")).join("")
      + (unmapped.length ? `<div class="trk-leaf-unmapped">Not confidently mapped on: ${esc(unmapped.join(", "))}</div>` : "");
  } else {
    inner = `<div class="trk-leaf-unmapped">No platform confidently covers this topic yet — a real gap (or naming simply differs).</div>`;
  }
  return `<div class="trk-topwrap" data-tid="${esc(t.id)}">${row}<div class="trk-leaves">${inner}</div></div>`;
}

/* ============================================================
   shared aggregate refresh — keep union dots / meters / tiles live
   without a full re-render (leaf chips already sync via appClick).
   ============================================================ */
let _trkBound = false;
function _trkBindOnce() {
  if (_trkBound) return; _trkBound = true;
  document.addEventListener("state-changed", () => {
    if (currentView !== "tracker") return;
    if (trkLens === "pyq") _trkRefreshPyq(); else _trkRefreshCross();
  });
  // cross-lens interactions (subject expand + topic expand). Links/chips fall through
  // to appClick / entity routing; we only handle the disclosure toggles here.
  document.addEventListener("click", e => {
    if (currentView !== "tracker" || trkLens !== "cross") return;
    if (e.target.closest(".chip, .pinstar, a, [data-go-subject], [data-go-platform], [data-trk-howrate]")) return;
    const sh = e.target.closest(".trk-subjhead");
    if (sh && $("#view-tracker").contains(sh)) {
      const block = sh.closest(".trk-subjblock");
      block.classList.toggle("open");
      if (block.classList.contains("open")) _trkRenderSubjectTopics(block);
      return;
    }
    const tr = e.target.closest(".trk-topic");
    if (tr && $("#view-tracker").contains(tr)) {
      const w = tr.closest(".trk-topwrap"); const openNow = w.classList.toggle("open");
      tr.setAttribute("aria-expanded", openNow ? "true" : "false");
    }
  });
  // keyboard parity for topic disclosure (Enter/Space on the role=button row)
  document.addEventListener("keydown", e => {
    if (currentView !== "tracker" || trkLens !== "cross") return;
    if (e.key !== "Enter" && e.key !== " ") return;
    const tr = e.target.closest && e.target.closest(".trk-topic");
    if (tr && $("#view-tracker").contains(tr)) { e.preventDefault(); tr.click(); }
  });
  // "How we rate" → reuse the HY methodology jump (Overview firewall panel)
  document.addEventListener("click", e => {
    if (e.target.closest("[data-trk-howrate]")) { e.preventDefault(); if (typeof hyGotoMethodology === "function") hyGotoMethodology(); }
  });
}
/* wrap an HTML string into a [data-reveal] element so animateView reveals it */
function _trkEl(html) { const d = el("section", "trk-frame"); d.setAttribute("data-reveal", ""); d.innerHTML = html; return d; }

function _trkRefreshCross() {
  const allHy = LIB_TOPICS.filter(t => t.tier === 3);
  const hyStarted = allHy.filter(t => libTopicUnion(t).started).length;
  const topicsStarted = LIB_TOPICS.filter(t => libTopicUnion(t).started).length;
  const t1 = $("#view-tracker .trk-tiles .tile:nth-child(1)");
  if (t1) { const vv = $(".tile-v", t1), nn = $(".tile-n", t1); if (vv) vv.textContent = pct(hyStarted, allHy.length) + "%"; if (nn) nn.textContent = `${hyStarted}/${allHy.length} HY topics · union`; }
  const t3 = $("#view-tracker .trk-tiles .tile:nth-child(3)");
  if (t3) { const vv = $(".tile-v", t3), nn = $(".tile-n", t3); if (vv) vv.textContent = pct(topicsStarted, LIB_TOPICS.length) + "%"; if (nn) nn.textContent = `${fmt(topicsStarted)}/${fmt(LIB_TOPICS.length)}`; }
  const t4 = $("#view-tracker .trk-tiles .tile:nth-child(4) .tile-v"); if (t4) t4.textContent = fmt(allHy.length - hyStarted);
  // visible topic union dots
  $$("#view-tracker .trk-topwrap").forEach(w => {
    const t = LIB_TOPIC_BY_ID[w.dataset.tid]; if (!t) return;
    const slot = $(".trk-union", w); if (slot) slot.outerHTML = _trkUnionDots(libTopicUnion(t));
  });
  // subject HY meters
  $$("#view-tracker .trk-subjblock.cross").forEach(block => {
    const hy = _trkSubjHy(block.dataset.subject);
    const m = $(".trk-subjmeter", block); if (m) m.innerHTML = meterHTML(hy.started, hy.total);
    const sh = $(".trk-sh", block); if (sh) { const tc = _trkSubjTopics(block.dataset.subject).length; sh.textContent = `${tc} ${trkFilter === "all" ? "topics" : "shown"} · ${hy.started}/${hy.total} HY done`; }
  });
}
function _trkRefreshPyq() {
  // live-update the "You've attempted" tile (tile 2)
  const roll = pyqRollup(PYQ_PAPERS.filter(p => p.setKind === "pyq"));
  const t2 = $("#view-tracker .trk-tiles .tile:nth-child(2)");
  if (t2) { const vv = $(".tile-v", t2), nn = $(".tile-n", t2); if (vv) vv.textContent = pct(roll.a, roll.total) + "%"; if (nn) nn.textContent = `${roll.a}/${roll.total} papers`; }
  $$("#view-tracker .trk-subjblock").forEach(block => {
    const subj = block.dataset.subject;
    const papers = PYQ_PAPERS.filter(p => p.subject === subj && _pyqFilter(p));
    const ro = pyqRollup(papers);
    const m = $(".trk-subjmeter", block); if (m) m.innerHTML = meterHTML(ro.a, ro.total);
    $$(".trk-platgroup", block).forEach(g => {
      const head = $(".trk-platmeta", g); if (!head) return;
      const ids = $$(".pyq-row", g).map(r => r.dataset.id);
      const ps = papers.filter(p => ids.includes(p.id));
      const pr = pyqRollup(ps); head.textContent = `${pr.a}/${pr.total} · ${fmt(pr.q)} Qs`;
    });
  });
}
