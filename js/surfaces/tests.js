/* ============================================================
   surfaces/tests.js — TESTS & SCORES (score log + per-subject accuracy)
   Recomposed onto the shared system (statTile / chartFrame / sparkline /
   rankedBars). Score-entry table + difficulty stars keep their exact DOM
   (.scorerow/.sin/.diff/.acc) so the global Store wiring in main.js
   (testsInput / testsClick) is untouched. Local tracking = "measured".
   ============================================================ */
function testTag(name, status) {
  const n = (name || "").toLowerCase();
  if (status === "Non-Competitive") return `<span class="tag misc">Surprise</span>`;
  if (/grand test|gt[\s-]|^grand/.test(n)) return `<span class="tag gt">Grand</span>`;
  if (/mini/.test(n)) return `<span class="tag mini">Mini</span>`;
  if (/fmge/.test(n)) return `<span class="tag misc">FMGE</span>`;
  if (/integrated/.test(n)) return `<span class="tag subj">Integrated</span>`;
  if (/inicet|ini-cet/.test(n)) return `<span class="tag gt">INICET</span>`;
  return `<span class="tag subj">Subject</span>`;
}
function subjectAccuracy() {
  const acc = {};
  buildTests().forEach(t => {
    const s = Store.score(t.id); if (!s || s.right == null) return;
    const tot = s.right + s.wrong; if (!tot) return; // attempted (skipped isn't captured)
    const n = (t.name || "").toLowerCase();
    if (/grand test|\bgt[\s-]|integrated|fmge|inicet|ini-cet|national/.test(n)) return; // broad tests: skip to avoid noise
    const matched = new Set();
    Object.keys(TEST_ALIASES).forEach(k => { if (new RegExp("\\b" + k + "\\b").test(n)) matched.add(TEST_ALIASES[k]); });
    if (matched.size !== 1) return; // only attribute clean single-subject tests (no split-credit noise)
    matched.forEach(cs => { const a = acc[cs] || (acc[cs] = { right: 0, q: 0, tests: 0 }); a.right += s.right; a.q += tot; a.tests++; });
  });
  return Object.entries(acc).map(([cs, a]) => ({ cs, pct: pct(a.right, a.q), tests: a.tests, q: a.q })).sort((x, y) => x.pct - y.pct);
}
let testPlat = "all";

/* Typeset figures — true minus (U+2212) + hair-space before the unit so deltas
   read as engraved metrics, not ASCII. Local to this surface until the shared
   fmtPct/fmtDelta land in core.js (see return note). Reduced-motion-agnostic
   (pure string formatting, never animated). */
const _HAIR = " ";                                   // hair space
function fmtPctT(n) { return (n == null ? "—" : Math.round(n) + _HAIR + "%"); }
function fmtDeltaT(n) {                                    // signed, true minus, hair-space unit
  if (n == null) return "—";
  const neg = n < 0, mag = Math.abs(Math.round(n));
  return (neg ? "−" : "+") + mag + _HAIR + "pts";
}

/* Zero-state accuracy gauge — a calibrated-but-empty axis (baseline + 0/100 ticks
   + dotted "awaiting data" midline + CTA), NOT a dashed broken box. Reads as a
   gauge that has been ruled and is waiting for its first reading. Pure SVG; the
   firewall leaves it fully visible (no entrance dependency). */
function emptyAccuracyAxis() {
  const W = 560, H = 96, pad = 6, mid = H / 2;
  return `<svg class="spark spark-empty" viewBox="0 0 ${W} ${H}" role="img" `
    + `aria-label="Accuracy gauge — calibrated, awaiting your first scored mock (measured, this device)" `
    + `preserveAspectRatio="none">`
    + `<line class="spk-base" x1="0" y1="${H - pad}" x2="${W}" y2="${H - pad}"/>`
    + `<line class="spk-base" x1="0" y1="${pad}" x2="${W}" y2="${pad}"/>`
    + `<line class="spk-wait" x1="${pad}" y1="${mid}" x2="${W - pad}" y2="${mid}"/>`
    + `<text class="spk-tick" x="2" y="${pad + 8}">100</text>`
    + `<text class="spk-tick" x="2" y="${H - pad - 2}">0</text>`
    + `<text class="spk-cap" x="${W / 2}" y="${mid - 6}" text-anchor="middle">awaiting your first scored mock</text>`
    + `</svg>`;
}

/* YOUR accuracy across scored tests, in test-hub order (a real measured series, not fabricated dates).
   Broad/full tests only (GT/Integrated/INICET) so the trend reads as overall-mock momentum. */
function scoreSeries() {
  const out = [];
  buildTests().forEach(t => {
    const s = Store.score(t.id); if (!s || s.right == null) return;
    const tot = (s.right || 0) + (s.wrong || 0) + (s.skipped || 0); if (!tot) return;
    const n = (t.name || "").toLowerCase();
    if (!/grand|integrated|inicet|ini-cet|fmge|national|mock/.test(n)) return;
    out.push({ y: pct(s.right, tot), label: t.name });
  });
  return out;
}

function renderTests() {
  if (typeof resetPlates === "function") resetPlates();
  const v = $("#view-tests"); v.innerHTML = "";
  const cur = testPlat;

  const scores = Object.values(Store.state.scores).filter(s => s.right != null);
  const totR = scores.reduce((a, s) => a + (s.right || 0), 0);
  const totQ = scores.reduce((a, s) => a + ((s.right || 0) + (s.wrong || 0) + (s.skipped || 0)), 0);
  const hubTotal = D.tests.corebtr.length + D.tests.gt2026.length + Store.state.customTests.length;
  const cereTotalRow = (D.tests.cereGtSummary || []).find(r => r.year === "TOTAL");
  const cereTotal = cereTotalRow ? cereTotalRow.count : "—";
  const sacc = subjectAccuracy();
  const series = scoreSeries();
  const cap = D.captured;

  /* ── KPI tile strip (≥6 tiles; ONE serif hero = overall accuracy) ── */
  const tiles = el("div", "tiles tests-kpi");
  tiles.innerHTML = [
    statTile({ accent: "g", hero: true, value: totQ ? pct(totR, totQ) + "%" : "—", label: "Overall accuracy",
      note: totQ ? `${fmt(totR)} right / ${fmt(totQ)} attempted` : "score a test to begin", epi: "measured" }),
    statTile({ accent: "k", value: scores.length, label: "Tests scored", note: "your accuracy log", epi: "measured" }),
    statTile({ accent: "m", value: totQ ? fmt(totQ) : "—", label: "Questions attempted", note: "across all scored tests", epi: "measured" }),
    statTile({ accent: "c", value: sacc.length, label: "Subjects with data", note: sacc.length ? `weakest: ${esc(sacc[0].cs)}` : "scored subject tests", epi: "measured" }),
    statTile({ accent: "k", value: fmt(hubTotal), label: "Tests in hub", note: `incl. ${Store.state.customTests.length} you added` }),
    statTile({ accent: "c", value: cereTotal, label: "Cerebellum GT archive", note: "2023–26, public schedule", epi: "public-3p" })
  ].join("");
  v.appendChild(tiles);
  // count-up the ONE hero numeral (overall accuracy). data-count = raw int; the
  // displayed text keeps its "%" suffix — motion.js preserves the final string and
  // is reduced-motion / no-IO safe (no-op → final state). Only when there's data.
  if (totQ) {
    const heroV = $(".tile.is-hero .tile-v", tiles);
    if (heroV) heroV.dataset.count = String(pct(totR, totQ));
  }

  /* ── Relational viz band (desktop two-up): accuracy sparkline (left) ·
       per-subject weakest-first rankedBars (right). Mobile collapses to one
       column (panel-grid handles the breakpoint). ── */
  let trendHTML;
  if (series.length) {
    const spk = sparkline(series.map((p, i) => ({ x: i, y: p.y })), { w: 560, h: 96, unit: "test" });
    const last = series[series.length - 1], first = series[0];
    const delta = series.length > 1 ? last.y - first.y : null;
    const note = series.length === 1
      ? "one mock scored — trend appears as you log more"
      : `${series.length} mocks · latest ${fmtPctT(last.y)}`
        + (delta != null ? ` · <span class="d-trend ${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "▲" : "▼"} ${fmtDeltaT(delta)} vs first</span>` : "");
    trendHTML = chartFrame(
      "Accuracy across your scored mocks", "measured", [], cap, spk,
      { note, legend: `<span class="cf-key"><span class="lg-line"></span>accuracy %, test-hub order · this device</span>` }
    );
  } else {
    // calibrated-but-empty gauge (axis + dotted midline + CTA) instead of a dashed box
    trendHTML = chartFrame(
      "Accuracy across your scored mocks", "measured", [], cap,
      emptyAccuracyAxis(),
      { note: `No grand-test scores yet — the gauge is ruled and waiting. Log a Grand Test / INICET mock below and your accuracy trend draws here, locally on this device. <span class="cf-cta">Log your first GT below ↓</span>` }
    );
  }

  /* per-subject accuracy plate — weakest-first rankedBars; richer empty state
     (a ruled plate awaiting its first single-subject reading) when none scored */
  let saccHTML;
  if (sacc.length) {
    const items = sacc.map(x => ({
      label: x.cs,
      value: x.pct,
      // magnitude color = accuracy band (low→high); kept on the sequential yield ramp
      color: x.pct < 55 ? "var(--bad)" : x.pct < 70 ? "var(--gold)" : "var(--accent)",
      go: "subject:" + x.cs,
      mark: `${fmt(x.q)} Q · ${x.tests} test${x.tests > 1 ? "s" : ""}`
    }));
    const bars = rankedBars(items, { nosort: true, colorFn: i => i.color });
    saccHTML = chartFrame(
      "Your subjects — accuracy, weakest first", "measured", [], cap, bars,
      {
        note: "inferred from your scored single-subject tests; broad GTs excluded to avoid split-credit noise · tap a subject to drill in",
        legend: `<span class="cf-key"><span class="lg-dot" style="background:var(--bad)"></span>&lt;55%<span class="lg-dot" style="background:var(--gold)"></span>55–70%<span class="lg-dot" style="background:var(--accent)"></span>&ge;70%</span>`
      }
    );
  } else {
    saccHTML = chartFrame(
      "Your subjects — accuracy, weakest first", "measured", [], cap,
      `<div class="tests-empty"><svg class="te-mark" viewBox="0 0 24 24" aria-hidden="true" width="26" height="26">`
      + `<path d="M4 19h16M6 16l4-7 3 4 2-3 3 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      + `<div class="te-title">No single-subject reading yet</div>`
      + `<div class="te-body">Score a Subject test (Anatomy, Pathology…) below and your accuracy ranks here, weakest first — broad GTs are excluded to keep the read clean.</div></div>`,
      { note: "one bar per scored single-subject test · this device" }
    );
  }

  const vizband = el("div", "panel-grid tests-viz");
  vizband.innerHTML = `<div class="vz-cell" data-reveal>${trendHTML}</div><div class="vz-cell" data-reveal>${saccHTML}</div>`;
  v.appendChild(vizband);

  /* ── Add a custom test (preserved behavior; Store seam) ── */
  const add = el("section", "panel"); add.dataset.reveal = "1";
  add.innerHTML = `<div class="ph"><div class="ph-l"><h3>Add a Grand Test / custom test</h3></div></div>
     <div class="srcline">your own GTs, offline mocks, anything not listed — stored locally, this device <i class="tile-epi">${epiDot("measured")}</i></div>
     <div class="addform">
       <input class="search" id="ctName" placeholder="Test name (e.g. My GT-7)" style="flex:2;min-width:200px">
       <select class="sel" id="ctPlat"><option>CoreBTR</option><option>Marrow</option><option>Cerebellum</option><option>Other</option></select>
       <input class="search" id="ctQ" type="number" min="1" placeholder="Q count" style="min-width:100px">
       <button class="btn" id="ctAdd">Add test</button>
     </div>`;
  v.appendChild(add);
  $("#ctAdd").addEventListener("click", () => {
    const name = $("#ctName").value.trim(); if (!name) { $("#ctName").focus(); return; }
    Store.addCustomTest({ name, platform: $("#ctPlat").value, q: +$("#ctQ").value || null, status: "custom" });
    renderTests();
  });

  /* ── ONE toolbar row: filter segmented + hint pill ── */
  const ctr = el("div", "controls");
  const segOpts = [
    { v: "all", label: "All" }, { v: "CoreBTR", label: "CoreBTR" },
    { v: "Cerebellum", label: "Cerebellum" }, { v: "custom", label: "My tests" }
  ];
  ctr.innerHTML = segmented(segOpts, cur, "tplat") + `<div class="spacer"></div><span class="count-pill">tap a row to score · ★ rate difficulty</span>`;
  v.appendChild(ctr);
  ctr.addEventListener("click", e => {
    const b = e.target.closest("[data-seg-v]"); if (b) { testPlat = b.dataset.segV; renderTests(); }
  });

  /* ── Score-entry table (DOM kept verbatim so Store wiring is untouched) ── */
  let rows = buildTests();
  if (cur === "custom") rows = rows.filter(t => t.custom);
  else if (cur !== "all") rows = rows.filter(t => t.platform === cur);

  const panel = el("section", "panel tests-ledger"); panel.dataset.reveal = "1";
  panel.innerHTML = `<table class="tests resp"><thead><tr>
    <th>Test</th><th>Type</th><th class="num">Q</th><th class="num">Right</th><th class="num">Wrong</th>
    <th class="num">Acc.</th><th>Difficulty</th><th></th></tr></thead><tbody></tbody></table>`;
  const tb = $("tbody", panel);
  rows.forEach(t => tb.appendChild(scoreRow(t)));
  v.appendChild(panel);

  /* ── 2026 Cerebellum GT schedule — dated calendar to pace against (public-3p) ── */
  const p2 = el("section", "panel"); p2.dataset.reveal = "1";
  p2.innerHTML = `<div class="ph"><div class="ph-l"><h3><span class="platlabel c">Cerebellum</span> · 2026 Grand Test schedule ${epiBadge("public-3p")}</h3></div></div>
    <div class="srcline">published calendar to pace against${cap ? ` · captured ${esc(cap)}` : ""}</div>`;
  const tl = el("div", "timeline");
  D.tests.gt2026.forEach(t => tl.appendChild(el("div", "tl",
    `<div class="tdate">${esc(t.date)}</div><div class="tname">${esc(t.name)}</div><div class="tmeta">${esc(String(t.questions))} Q · ${esc(String(t.duration))} min</div>`)));
  p2.appendChild(tl);
  v.appendChild(p2);

  labelizeResponsiveTables();

  // Self-re-render paths (add/delete custom test, segment switch) call renderTests()
  // directly, bypassing show()'s central animateView(). Without this, the freshly
  // rebuilt [data-reveal] panels (viz band, add-form, ledger, schedule) stay stuck at
  // opacity:0 (components.css:757) for motion-OK users until they leave + return.
  // Idempotent (once-only IO + data-done flags), so the show()-path call is harmless.
  // Mirrors qbank.js drawSubject / overview.js render.
  if (typeof animateView === "function") animateView($("#view-tests"));
}
function scoreRow(t) {
  const s = Store.score(t.id) || {};
  const acc = (s.right != null && (s.right + s.wrong + (s.skipped || 0)) > 0) ? fmtPctT(pct(s.right, s.right + s.wrong + (s.skipped || 0))) : "—";
  const tr = el("tr", "scorerow"); tr.dataset.id = t.id;
  tr.innerHTML = `
    <td style="font-weight:600">${esc(t.name)}${t.custom ? ' <span class="tag misc">mine</span>' : ""}</td>
    <td>${testTag(t.name, t.status)}</td>
    <td class="num">${t.q ? fmt(t.q) : "—"}</td>
    <td class="num"><input class="sin" data-f="right" type="number" min="0" value="${s.right ?? ""}" placeholder="–"></td>
    <td class="num"><input class="sin" data-f="wrong" type="number" min="0" value="${s.wrong ?? ""}" placeholder="–"></td>
    <td class="num acc">${acc}</td>
    <td class="diff" data-id="${t.id}">${[1, 2, 3, 4, 5].map(n => `<span class="ds ${s.diff >= n ? "on" : ""}" data-n="${n}">★</span>`).join("")}</td>
    <td>${t.custom ? `<button class="xbtn" data-act="del" title="Remove">✕</button>` : ""}</td>`;
  return tr;
}
function testsInput(e) {
  const inp = e.target.closest("input.sin"); if (!inp) return;
  const row = e.target.closest(".scorerow"); const id = row.dataset.id;
  const rv = $('input[data-f="right"]', row).value, wv = $('input[data-f="wrong"]', row).value;
  const right = +rv || 0, wrong = +wv || 0;
  Store.setScore(id, { right: rv === "" ? null : right, wrong });
  $(".acc", row).textContent = (right + wrong) ? fmtPctT(pct(right, right + wrong)) : "—";
}
function testsClick(e) {
  const star = e.target.closest(".diff .ds");
  if (star) {
    const cell = e.target.closest(".diff"); const id = cell.dataset.id; const n = +star.dataset.n;
    const cur = (Store.score(id) || {}).diff || 0; const val = cur === n ? 0 : n;
    Store.setScore(id, { diff: val });
    $$(".ds", cell).forEach((s, i) => s.classList.toggle("on", i < val));
    return true;
  }
  const del = e.target.closest('[data-act="del"]');
  if (del) { const row = e.target.closest(".scorerow"); Store.removeCustomTest(row.dataset.id); renderTests(); return true; }
  return false;
}
