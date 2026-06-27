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

  /* ── Relational viz: YOUR accuracy trend across scored mocks (measured, local) ── */
  const trend = el("div", "");
  if (series.length) {
    const spk = sparkline(series.map((p, i) => ({ x: i, y: p.y })), { w: 560, h: 96, unit: "test" });
    const last = series[series.length - 1], first = series[0];
    const delta = series.length > 1 ? last.y - first.y : null;
    const note = series.length === 1
      ? "one mock scored — trend appears as you log more"
      : `${series.length} mocks · latest ${last.y}%` + (delta != null ? ` · ${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)} pts vs first` : "");
    trend.innerHTML = chartFrame(
      "Accuracy across your scored mocks", "measured", [], cap, spk,
      { note, legend: `<span class="cf-key"><span class="lg-line"></span>accuracy %, test-hub order · this device</span>` }
    );
  } else {
    trend.innerHTML = chartFrame(
      "Accuracy across your scored mocks", "measured", [], cap,
      `<div class="empty small">No grand-test scores yet. Log a Grand Test / INICET mock below and your accuracy trend draws here — locally, on this device.</div>`,
      {}
    );
  }
  v.appendChild(trend);

  /* ── Add a custom test (preserved behavior; Store seam) ── */
  const add = el("section", "panel");
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

  const panel = el("section", "panel");
  panel.innerHTML = `<table class="tests resp"><thead><tr>
    <th>Test</th><th>Type</th><th class="num">Q</th><th class="num">Right</th><th class="num">Wrong</th>
    <th class="num">Acc.</th><th>Difficulty</th><th></th></tr></thead><tbody></tbody></table>`;
  const tb = $("tbody", panel);
  rows.forEach(t => tb.appendChild(scoreRow(t)));
  v.appendChild(panel);

  /* ── Per-subject accuracy: relational rankedBars, weakest-first, names → Subject pages ── */
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
    const ap = el("div", "");
    ap.innerHTML = chartFrame(
      "Your subjects — accuracy, weakest first", "measured", [], cap, bars,
      {
        note: "inferred from your scored single-subject tests; broad GTs excluded to avoid split-credit noise · tap a subject to drill in",
        legend: `<span class="cf-key"><span class="lg-dot" style="background:var(--bad)"></span>&lt;55%<span class="lg-dot" style="background:var(--gold)"></span>55–70%<span class="lg-dot" style="background:var(--accent)"></span>&ge;70%</span>`
      }
    );
    v.appendChild(ap);
  }

  /* ── 2026 Cerebellum GT schedule — dated calendar to pace against (public-3p) ── */
  const p2 = el("section", "panel");
  p2.innerHTML = `<div class="ph"><div class="ph-l"><h3><span class="platlabel c">Cerebellum</span> · 2026 Grand Test schedule ${epiBadge("public-3p")}</h3></div></div>
    <div class="srcline">published calendar to pace against${cap ? ` · captured ${esc(cap)}` : ""}</div>`;
  const tl = el("div", "timeline");
  D.tests.gt2026.forEach(t => tl.appendChild(el("div", "tl",
    `<div class="tdate">${esc(t.date)}</div><div class="tname">${esc(t.name)}</div><div class="tmeta">${esc(String(t.questions))} Q · ${esc(String(t.duration))} min</div>`)));
  p2.appendChild(tl);
  v.appendChild(p2);

  labelizeResponsiveTables();
}
function scoreRow(t) {
  const s = Store.score(t.id) || {};
  const acc = (s.right != null && (s.right + s.wrong + (s.skipped || 0)) > 0) ? pct(s.right, s.right + s.wrong + (s.skipped || 0)) + "%" : "—";
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
  $(".acc", row).textContent = (right + wrong) ? pct(right, right + wrong) + "%" : "—";
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
