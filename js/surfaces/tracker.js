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
let trkLens = "pyq";          // "cross" | "pyq"  (Stage 2 flips default → "cross")
/* PYQ lens state */
let pyqExam = "all";          // all | NEET PG | INI-CET | FMGE | AIIMS
let pyqPlatform = "all";
let pyqSubject = "all";
let pyqSet = "pyq";           // "pyq" (past papers only) | "all" (+ revision sets)
/* cross lens state */
let trkSubject = "all";
let trkFilter = "all";        // all | hy | gaps (untracked HY) | started

const TRK_LENS_OPTS = [{ v: "cross", label: "Cross-platform" }, { v: "pyq", label: "PYQ papers" }];

function renderTracker() {
  resetPlates();
  const v = $("#view-tracker"); v.innerHTML = "";

  // lens switch (segmented) — the retain surface's two views
  const lensBar = el("div", "trk-lensbar");
  lensBar.innerHTML = segmented(TRK_LENS_OPTS, trkLens, "trkLens");
  v.appendChild(lensBar);
  const seg = lensBar.querySelector('[data-seg="trkLens"]');
  if (seg) seg.addEventListener("click", e => { const b = e.target.closest("[data-seg-v]"); if (b && b.dataset.segV !== trkLens) { trkLens = b.dataset.segV; renderTracker(); } });

  const body = el("div", "trk-body");
  v.appendChild(body);
  if (trkLens === "pyq") _trkPyq(body); else _trkCross(body);

  _trkBindOnce(v);
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
   CROSS-PLATFORM LENS  (Stage 2) — placeholder until Stage 2 lands
   ============================================================ */
function _trkCross(v) {
  v.appendChild(el("div", "", emptyState({
    icon: "compass", title: "Unified cross-platform tracker",
    body: "The canonical-topic union tracker renders here.",
  })));
}

/* ============================================================
   shared aggregate refresh — keep union dots / meters / tiles live
   without a full re-render (leaf chips already sync via appClick).
   ============================================================ */
let _trkBound = false;
function _trkBindOnce(v) {
  if (_trkBound) return; _trkBound = true;
  document.addEventListener("state-changed", () => {
    if (currentView !== "tracker") return;
    if (trkLens === "pyq") _trkRefreshPyq(); else if (typeof _trkRefreshCross === "function") _trkRefreshCross();
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
