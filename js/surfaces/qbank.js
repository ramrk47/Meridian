/* ============================================================
   surfaces/qbank.js — QBANK TRACKER (sidebar workspace + 3-level tree)
   + the shared DETAIL DRAWER and OPTION BOTTOM-SHEET (consumed by
   qbank / high-yield / overview / videos).
   ============================================================ */
const QB = { platform: "marrow", subject: null, sort: "hy", status: "all", hyOnly: false, search: "", subjSort: "size" };
const QB_SORT_OPTS = [["hy", "High-yield"], ["mcqs", "Most MCQs"], ["rating", "Rating / difficulty"], ["name", "A–Z"], ["leastdone", "Least attempted"], ["completion", "Least complete"]];
const QB_STATUS_OPTS = [["all", "All statuses"], ["untracked", "Yet to attempt"], ["attempted", "Attempted"], ["review", "Needs review"], ["mastered", "Mastered (retaken)"], ["starred", "My starred"], ["hard", "High difficulty (top-rated)"]];
function qbDefaultSubject() { const s = subjectsOf(QB.platform); return s[0]; }
/* mobile fold breakpoint (matches css/qbank.css @media(max-width:640px)) */
const QB_MOBILE_MQ = (typeof matchMedia === "function") ? matchMedia("(max-width:640px)") : { matches: false };
function qbIsMobile() { return !!QB_MOBILE_MQ.matches; }
/* re-draw the compact/full subject hero when crossing the fold breakpoint (rotation/resize) */
if (QB_MOBILE_MQ.addEventListener) {
  QB_MOBILE_MQ.addEventListener("change", () => { if ($("#qbContent")) drawSubject(); });
} else if (QB_MOBILE_MQ.addListener) {
  QB_MOBILE_MQ.addListener(() => { if ($("#qbContent")) drawSubject(); });
}
/* active-pill tint for the shared seg → only theme-tokened tints (CSS: .seg.marrow/.seg.cere);
   any other bank falls back to the default ink pill, which themes correctly in evening. */
const QSEG_TINT = { marrow: "marrow", cerebellum: "cere" };
/* N-way platform switch: segmented up to 3 banks, dropdown beyond.
   Uses the shared segmented() component (data-seg-v + tokened .seg tints) so the
   active pill themes correctly in evening — no raw data-hex / #fff injected into markup. */
function qbankSwitchHTML() {
  if (QBANKS.length > 3) {
    return `<select class="sel mini" id="qplat" title="QBank platform">${QBANKS.map(p =>
      `<option value="${p.id}" ${QB.platform === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>`;
  }
  const opts = QBANKS.map(p => ({ v: p.id, label: p.name }));
  return segmented(opts, QB.platform, "qplatseg", QSEG_TINT[QB.platform] || "");
}
function switchQbankPlatform(id) {
  if (!id || id === QB.platform || !PLAT_BY_ID[id]) return;
  const prevCanon = QB.subject ? canon(QB.subject) : null;   // land on the same topic across banks
  QB.platform = id;
  const list = subjectsOf(QB.platform);
  QB.subject = (prevCanon && list.find(s => canon(s) === prevCanon)) || qbDefaultSubject();
  QB.search = ""; renderQbank();
}

function renderQbank() {
  const v = $("#view-qbank"); v.innerHTML = "";
  if (!QB.subject || !subjectsOf(QB.platform).includes(QB.subject)) QB.subject = qbDefaultSubject();

  const layout = el("div", "qb-layout");
  layout.innerHTML = `
    <aside class="qb-side">
      <div class="qb-side-top">
        ${qbankSwitchHTML()}
        <select class="sel mini" id="qSubjSort" title="Order subjects">
          <option value="size">By size</option><option value="alpha">A–Z</option>
          <option value="completion">By completion</option><option value="gaps">By high-yield gaps</option>
        </select>
      </div>
      <div class="sb-list" id="sbList"></div>
    </aside>
    <div class="qb-main">
      <div class="qb-controls" id="qbControls">
        <input class="search" id="qsearch" placeholder="Search ${esc(platName(QB.platform))} topics…" value="${esc(QB.search)}">
        <select class="sel desk-ctrl" id="qsort" aria-label="Sort topics">
          ${QB_SORT_OPTS.map(([v, l]) => `<option value="${v}">Sort: ${l}</option>`).join("")}
        </select>
        <select class="sel desk-ctrl" id="qstatus" aria-label="Filter topics">
          ${QB_STATUS_OPTS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}
        </select>
        <button class="iconbtn mob-ctrl" id="qSortBtn" aria-label="Sort topics" title="Sort">⇅</button>
        <button class="iconbtn mob-ctrl" id="qFilterBtn" aria-label="Filter topics" title="Filter">⛁</button>
        <button class="chipbtn ${QB.hyOnly ? "on" : ""}" id="qHy" title="High-yield only">★<span class="ctrl-lbl"> High-yield</span></button>
        <div class="spacer"></div>
        <button class="ghostbtn desk-ctrl" id="qExpand" title="Expand all">⊕ Expand</button>
        <button class="ghostbtn desk-ctrl" id="qCollapse" title="Collapse all">⊖ Collapse</button>
      </div>
      <div class="qb-content" id="qbContent"></div>
    </div>`;
  v.appendChild(layout);

  $("#qsort").value = QB.sort; $("#qstatus").value = QB.status; $("#qSubjSort").value = QB.subjSort;
  // wiring — platform switch is segmented (≤3 banks) or a dropdown (>3)
  const qseg = $('[data-seg="qplatseg"]'); if (qseg) qseg.addEventListener("click", e => { const b = e.target.closest("[data-seg-v]"); if (b) switchQbankPlatform(b.dataset.segV); });
  const qplat = $("#qplat"); if (qplat) qplat.addEventListener("change", e => switchQbankPlatform(e.target.value));
  $("#qSubjSort").addEventListener("change", e => { QB.subjSort = e.target.value; drawSidebar(); });
  $("#qsearch").addEventListener("input", e => { QB.search = e.target.value; drawSidebar(); drawSubject(); });
  $("#qsort").addEventListener("change", e => { QB.sort = e.target.value; drawSubject(); });
  $("#qstatus").addEventListener("change", e => { QB.status = e.target.value; drawSidebar(); drawSubject(); });
  $("#qHy").addEventListener("click", () => { QB.hyOnly = !QB.hyOnly; $("#qHy").classList.toggle("on", QB.hyOnly); updateQbFilterBadge(); drawSidebar(); drawSubject(); });
  $("#qExpand").addEventListener("click", () => $$(".cat-block", $("#qbContent")).forEach(b => b.classList.add("open")));
  $("#qCollapse").addEventListener("click", () => $$(".cat-block", $("#qbContent")).forEach(b => b.classList.remove("open")));
  // mobile: sort/filter open a bottom-sheet instead of native selects
  $("#qSortBtn")?.addEventListener("click", () => openSheet("Sort topics", QB_SORT_OPTS, QB.sort, val => { QB.sort = val; const s = $("#qsort"); if (s) s.value = val; drawSubject(); }));
  $("#qFilterBtn")?.addEventListener("click", () => openSheet("Filter by status", QB_STATUS_OPTS, QB.status, val => { QB.status = val; const s = $("#qstatus"); if (s) s.value = val; updateQbFilterBadge(); drawSidebar(); drawSubject(); }));
  updateQbFilterBadge();

  drawSidebar(); drawSubject();
}
function leafMatchesFilters(l) {
  if (QB.hyOnly && l.priority !== 3) return false;
  const p = Store.prog(l.id), st = Store.state.stars[l.id];
  switch (QB.status) {
    case "untracked": if (p.a || p.r || p.t) return false; break;
    case "attempted": if (!p.a) return false; break;
    case "review": if (!(p.a && !p.r)) return false; break;
    case "mastered": if (!p.t) return false; break;
    case "starred": if (!st) return false; break;
    case "hard": { const hard = l.rating != null ? l.rating >= 4.5 : l.priority === 3; if (!hard) return false; break; }
  }
  if (QB.search) { const t = QB.search.toLowerCase(); if (!l.name.toLowerCase().includes(t) && !(l.cat || "").toLowerCase().includes(t) && !l.subject.toLowerCase().includes(t)) return false; }
  return true;
}
function subjectMatchCount(subject) { return leavesOf(QB.platform, subject).filter(leafMatchesFilters).length; }
function drawSidebar() {
  const wrap = $("#sbList"); if (!wrap) return; wrap.innerHTML = "";
  let subs = subjectsOf(QB.platform).map(s => {
    const ls = leavesOf(QB.platform, s); const ro = rollupLeaves(ls);
    const hyGaps = ls.filter(l => l.priority === 3 && !Store.prog(l.id).a).length;
    return { s, ls, ro, hyGaps, mcqs: subjMeta(QB.platform, s)?.mcqs || 0, match: subjectMatchCount(s) };
  });
  const filtering = QB.search || QB.status !== "all" || QB.hyOnly;
  if (filtering) subs = subs.filter(x => x.match > 0);
  subs.sort((a, b) => {
    if (QB.subjSort === "alpha") return a.s.localeCompare(b.s);
    if (QB.subjSort === "completion") return pct(b.ro.a, b.ro.total) - pct(a.ro.a, a.ro.total);
    if (QB.subjSort === "gaps") return b.hyGaps - a.hyGaps;
    return b.mcqs - a.mcqs;
  });
  // keep selection valid
  if (filtering && subs.length && !subs.some(x => x.s === QB.subject)) QB.subject = subs[0].s;
  subs.forEach(x => {
    const it = el("button", "sb-item" + (x.s === QB.subject ? " on" : ""));
    it.dataset.subj = x.s;
    it.innerHTML = `<span class="sb-row1"><span class="sb-name">${esc(x.s)}</span>${x.hyGaps ? `<span class="sb-gaps" title="${x.hyGaps} high-yield gaps">${x.hyGaps}</span>` : ""}</span>
      <span class="sb-row2">${meterHTML(x.ro.a, x.ro.total)}${filtering ? `<span class="sb-match">${x.match} match${x.match !== 1 ? "es" : ""}</span>` : `<span class="sb-mcq">${fmt(x.mcqs)}</span>`}</span>`;
    wrap.appendChild(it);
  });
  if (!subs.length) wrap.appendChild(el("div", "empty small", "No subjects match."));
}
function sortLeaves(arr) {
  const a = [...arr];
  switch (QB.sort) {
    case "mcqs": a.sort((x, y) => y.mcqs - x.mcqs); break;
    case "rating": a.sort((x, y) => (y.rating || y.hyScore) - (x.rating || x.hyScore)); break;
    case "name": a.sort((x, y) => x.name.localeCompare(y.name)); break;
    case "leastdone": case "completion": a.sort((x, y) => (Store.prog(x.id).a - Store.prog(y.id).a) || (y.hyScore - x.hyScore)); break;
    default: a.sort((x, y) => y.hyScore - x.hyScore); // hy
  }
  return a;
}
function drawSubject() {
  const host = $("#qbContent"); if (!host) return; host.innerHTML = "";
  resetPlates();
  const subject = QB.subject; if (!subject) { host.appendChild(el("div", "empty", "Pick a subject.")); return; }
  const ls = leavesOf(QB.platform, subject);
  const ro = rollupLeaves(ls);
  const meta = subjMeta(QB.platform, subject);
  const cnon = canon(subject);
  const hyCount = ls.filter(l => l.priority === 3).length;
  // Mobile fold (EXPERIENCE_DESIGN_SPEC §7: header + toolbar + ≥4 leaf rows must be visible
  // at 375×812). On phones we keep the hero compact — hero MCQ tile + Attempted + Reviewed,
  // plus the bigMeter — and DEFER the units/high-yield/mastered tiles and the per-subject
  // heatmap (the same coverage×density viz already lives on the Subject entity page). Tiles
  // stay in DOM in their canonical order (deferred ones hidden) so syncAfterToggle's positional
  // indices remain valid; the matchMedia listener re-draws on breakpoint change.
  const mob = qbIsMobile();
  // header — the ONE serif hero number per screen is the subject MCQ count (measured).
  const head = el("div", "subj-hero" + (mob ? " is-compact" : ""));
  head.innerHTML = `
    <div class="sh-top">
      <div class="sh-id">
        <span class="sh-eyebrow">${esc(platName(QB.platform))} · ${esc(cnon)}</span>
        <h2 class="sh-name"><a class="sh-link is-link" data-go-subject="${esc(cnon)}" role="link" tabindex="0" title="Open the ${esc(cnon)} subject page">${esc(subject)}</a></h2>
      </div>
      <button class="linkbtn sh-open" data-go-subject="${esc(cnon)}">Subject page →</button>
    </div>
    <div class="sh-tiles">
      ${statTile({ value: fmt(meta?.mcqs || 0), label: "MCQs", note: "measured count", accent: platCls(QB.platform), epi: "measured", hero: true })}
      ${statTile({ value: ls.length, label: platUnitNoun(QB.platform), note: "tracked items" })}
      ${statTile({ value: pct(ro.a, ro.total) + "%", label: "Attempted", note: ro.a + " of " + ro.total, epi: "measured" })}
      ${statTile({ value: ro.r, label: "Reviewed", note: ro.t + " mastered", epi: "measured" })}
      ${statTile({ value: hyCount, label: "High-yield", note: "density proxy", accent: "g", epi: "proxy" })}
      ${statTile({ value: pct(ro.t, ro.total) + "%", label: "Mastered", note: "retaken", epi: "measured" })}
    </div>
    <div class="sh-progress">${bigMeter(ro)}</div>
    <div class="sh-heat">${subjectHeatmap(cnon, subject)}</div>`;
  // Mobile fold: defer the units / high-yield / mastered tiles + the per-subject heatmap so
  // header + sticky toolbar + ≥4 leaf rows clear the fold at 375×812. Kept in the DOM (just
  // hidden inline) so syncAfterToggle's positional tile indices stay valid; the matchMedia
  // listener re-draws on breakpoint change. The same coverage×density heatmap lives on the
  // Subject entity page, so no judgment/firewall signal is lost.
  if (mob) {
    const tiles = $$(".sh-tiles .tile", head);
    [tiles[1], tiles[4], tiles[5], $(".sh-heat", head)].forEach(n => { if (n) n.style.display = "none"; });
  }
  host.appendChild(head);

  let tree = treeOf(QB.platform, subject);
  if (QB.sort === "completion") tree = [...tree].sort((a, b) => { const ra = rollupLeaves(a.items), rb = rollupLeaves(b.items); return pct(ra.a, ra.total) - pct(rb.a, rb.total); });
  const body = el("div", "tree");
  let shown = 0;
  tree.forEach(group => {
    const items = sortLeaves(group.items.filter(leafMatchesFilters));
    if (!items.length) return;
    shown += items.length;
    if (group.cat == null) {
      // no category level (Cerebellum): one inset-grouped container of rows
      const grp = el("div", "lgroup");
      items.forEach(l => grp.appendChild(leafRow(l)));
      body.appendChild(grp);
    } else {
      const gro = rollupLeaves(group.items);
      const hy = group.items.filter(l => l.priority === 3).length;
      const block = el("div", "cat-block" + (QB.search || QB.status !== "all" || QB.hyOnly ? " open" : ""));
      block.dataset.cat = group.cat; block.dataset.subject = subject;
      block.innerHTML = `<div class="cat-head" data-cat-toggle>
          <span class="chev">▶</span>
          <span class="cat-name">${esc(group.cat)}</span>
          ${hy ? `<span class="cat-hy" title="${hy} high-yield">★ ${hy}</span>` : ""}
          <span class="cat-meter">${meterHTML(gro.a, gro.total)}</span>
          <span class="cat-mcq">${fmt(group.items.reduce((s, l) => s + l.mcqs, 0))}</span>
          <button class="bulkbtn" data-bulk="${esc(group.cat)}" title="Mark all attempted">✓ all</button>
        </div>
        <div class="cat-body"></div>`;
      const cb = $(".cat-body", block);
      items.forEach(l => cb.appendChild(leafRow(l)));
      body.appendChild(block);
    }
  });
  if (!shown) body.appendChild(el("div", "empty", "No topics match your filters in this subject."));
  host.appendChild(body);
}
/* per-canon-subject MCQ count on a given integrated platform (measured; 0 if absent) */
function subjMcqOn(platId, cnon) {
  const p = PLAT_BY_ID[platId]; if (!p) return 0;
  const s = (p.subjects || []).find(s => canon(s.subject) === cnon);
  return s ? (subjMeta(platId, s.subject)?.mcqs || 0) : 0;
}
/* community-reputed-strongest platformId for a canonical subject (directional, sourced) */
function strongestPlat(cnon) {
  const rec = (CUR.strength?.subjects || []).find(s => canon(s.subject) === cnon);
  const hit = rec && rec.strong && rec.strong.find(x => x.platformId && PLAT_BY_ID[x.platformId]);
  return hit ? hit.platformId : null;
}
/* Subject × the 3 integrated platforms — MCQ density (proxy bucketing over measured counts),
   with a gold directional ring on the community-reputed strongest bank. The hero relational viz. */
function subjectHeatmap(cnon, subject) {
  const cols = QBANKS.map(p => ({ id: p.id, label: p.name, color: platColor(p.id) }));
  const counts = QBANKS.map(p => subjMcqOn(p.id, cnon));
  const mx = Math.max(1, ...counts);
  const rows = [{ key: cnon, label: subject, go: "subject:" + cnon }];
  const valueFn = (rowKey, colId) => {
    const raw = subjMcqOn(colId, rowKey);
    return { v: fmt(raw), raw, t: raw / mx };
  };
  const strong = strongestPlat(cnon);
  const ringFn = strong ? (() => strong) : null;
  const ramp = `<span class="lg-ramp">${["--y1", "--y2", "--y3", "--y4", "--y5"].map(v => `<i style="background:var(${v})"></i>`).join("")}</span>`;
  const legend = `<span class="cf-key">${ramp}density — proxy</span>`
    + (strong ? `<span class="cf-key"><span class="lg-ring"></span>community-reputed strongest — directional</span>` : "");
  const note = strong
    ? `Cells = MCQ count per bank (measured); shade = within-row density (proxy). Ring marks ${esc(platName(strong))}, community-reputed strongest for ${esc(cnon)} (directional).`
    : `Cells = MCQ count per bank (measured); shade = within-row density (proxy). No community-strength signal sourced for ${esc(cnon)} yet.`;
  // The relational claim (coverage × density + strength ring) is backed by the strength registry.
  const srcIds = CUR.strength?.sourceIds || [];
  const cap = CUR.strength?.captured || D.captured;
  return chartFrame("Coverage × density — this subject", "proxy", srcIds, cap,
    heatmap(rows, cols, valueFn, { ringFn }), { legend, note });
}
/* per-leaf cross-platform consensus: of the 3 integrated banks, how many flag this canonical
   topic high-yield (priority 3). Own platform + best confident cross-match per other bank. */
function leafConsensus(l) {
  const plats = QBANKS.map(p => {
    let on = false;
    if (p.id === l.platform) on = l.priority === 3;
    else { const byP = bestCrossByPlat(l); const ol = byP[p.id]; on = !!(ol && ol.priority === 3); }
    return { id: p.id, on };
  });
  return plats;
}
function coverageBadge(l) {            // one ✓ per other platform where the matched topic is tracked
  const byP = bestCrossByPlat(l);
  return Object.entries(byP).map(([pid, ol]) => {
    const p = Store.prog(ol.id); if (!p.a && !p.r) return "";
    return `<span class="xcov ${platCls(pid)}" data-xgo="${ol.id}" style="color:${platColor(pid)}" title="${esc(platName(pid))}: ${esc(ol.name)} — ${p.r ? "reviewed" : "attempted"} on the other bank · click to jump">${platInitial(pid)} ✓</span>`;
  }).join("");
}
function leafRow(l) {
  const p = Store.prog(l.id), st = Store.state.stars[l.id];
  // inset-grouped listRow shape; keeps `.mrow`+data-id+[data-act] so shared appClick/sync still works.
  const row = el("div", "lrow mrow" + (p.a ? " done" : "")); row.dataset.id = l.id;
  const plats = leafConsensus(l);
  const agree = plats.filter(x => x.on).length;
  const rate = l.rating != null ? `${l.rating.toFixed(1)}★` : (l.modulesCount != null ? `${l.modulesCount} mod` : "");
  const sub = [esc(l.cat || l.canon), rate].filter(Boolean).join(" · ");
  row.innerHTML = `
    <span class="lrow-lead"><button class="pinstar ${st ? "on" : ""}" data-act="star" aria-pressed="${st ? "true" : "false"}" aria-label="Pin topic" title="Pin">${st ? "★" : "☆"}</button></span>
    <span class="lrow-main">
      <span class="lrow-title"><span class="leaf-link" role="button" tabindex="0" data-open-leaf="${l.id}" aria-label="Open ${esc(l.name)}">${esc(l.name)}</span> ${hyBadge(l.priority)}${coverageBadge(l)}</span>
      <span class="lrow-sub">${sub}</span>
    </span>
    <span class="lrow-trail">
      <span class="lrow-con" title="${agree} of ${plats.length} banks flag this high-yield (proxy)">${consensusMark(null, plats)}</span>
      <span class="chips">
        <button class="chip a ${p.a ? "on" : ""}" data-act="a" aria-pressed="${p.a ? "true" : "false"}" title="Attempted">A</button>
        <button class="chip r ${p.r ? "on" : ""}" data-act="r" aria-pressed="${p.r ? "true" : "false"}" title="Reviewed">R</button>
        <button class="chip t ${p.t ? "on" : ""}" data-act="t" aria-pressed="${p.t ? "true" : "false"}" title="Retaken / mastered">Rt</button>
      </span>
      <span class="rmcq num">${fmt(l.mcqs)}</span>
    </span>`;
  return row;
}
function subjOthers(subject) {        // same canonical subject on every OTHER qbank
  if (subject === PYQ) return [];
  const c = canon(subject);
  return QBANKS.filter(p => p.id !== QB.platform)
    .map(p => { const f = p.subjects.find(s => canon(s.subject) === c); return f ? { platform: p.id, subject: f.subject } : null; })
    .filter(Boolean);
}

/* live meter sync after a toggle (no full re-render) */
function syncAfterToggle(id) {
  const leaf = LEAF_BY_ID[id]; if (!leaf) return;
  // category meter
  const block = $(`#qbContent .cat-block[data-cat="${cssEsc(leaf.cat)}"][data-subject="${cssEsc(leaf.subject)}"]`);
  if (block) {
    const gro = rollupLeaves(leavesOf(QB.platform, leaf.subject).filter(l => l.cat === leaf.cat));
    const m = $(".cat-meter", block); if (m) m.innerHTML = meterHTML(gro.a, gro.total);
  }
  // subject hero (stat-tiles + big meter)
  if (leaf.subject === QB.subject && leaf.platform === QB.platform) {
    const ro = rollupLeaves(leavesOf(QB.platform, QB.subject));
    const hero = $("#qbContent .subj-hero");
    if (hero) {
      const vals = $$(".sh-tiles .tile-v", hero);
      const notes = $$(".sh-tiles .tile-n", hero);
      if (vals[2]) vals[2].textContent = pct(ro.a, ro.total) + "%";
      if (notes[2]) notes[2].textContent = ro.a + " of " + ro.total;
      if (vals[3]) vals[3].textContent = ro.r;
      if (notes[3]) notes[3].textContent = ro.t + " mastered";
      if (vals[5]) vals[5].textContent = pct(ro.t, ro.total) + "%";
      const bm = $(".sh-progress", hero); if (bm) bm.innerHTML = bigMeter(ro);
    }
  }
  // sidebar entry
  const sb = $(`#sbList .sb-item[data-subj="${cssEsc(leaf.subject)}"]`);
  if (sb) {
    const ro = rollupLeaves(leavesOf(QB.platform, leaf.subject));
    const m = $(".meter", sb); if (m) m.outerHTML = meterHTML(ro.a, ro.total);
    const gaps = leavesOf(QB.platform, leaf.subject).filter(l => l.priority === 3 && !Store.prog(l.id).a).length;
    let g = $(".sb-gaps", sb);
    if (gaps) {
      if (g) g.textContent = gaps;
      else { const r1 = $(".sb-row1", sb); if (r1) r1.insertAdjacentHTML("beforeend", `<span class="sb-gaps" title="${gaps} high-yield gaps">${gaps}</span>`); }
    } else if (g) g.remove();
  }
}

/* ============================================================
   DETAIL DRAWER (shared by QBank + High-Yield + Overview + Videos)
   ============================================================ */
let lastFocus = null;
function openDrawer(id) {
  const l = LEAF_BY_ID[id]; if (!l) return;
  lastFocus = document.activeElement;
  const dr = $("#drawer"), body = $("#drawerBody");
  const p = Store.prog(l.id), st = Store.state.stars[l.id];
  const cross = crossMatches(l), sibs = siblings(l, 8), tests = relatedTests(l.canon);
  const crossByPlat = {};
  cross.forEach(c => (crossByPlat[c.platform] = crossByPlat[c.platform] || []).push(c));
  body.innerHTML = `
    <div class="dr-eyebrow"><span class="platlabel ${platCls(l.platform)}" style="color:${platColor(l.platform)}">${esc(platName(l.platform))}</span> · ${esc(l.canon)}${l.cat ? " · " + esc(l.cat) : ""}</div>
    <h2 class="dr-title">${esc(l.name)} ${hyBadge(l.priority)}</h2>
    <div class="dr-facts">
      <span><b>${fmt(l.mcqs)}</b> MCQs</span>
      ${l.rating != null ? `<span><b>${l.rating.toFixed(1)}</b> rating</span>` : ""}
      ${l.modulesCount != null ? `<span><b>${l.modulesCount}</b> modules</span>` : ""}
      <span><b>${l.priority === 3 ? "High" : l.priority === 2 ? "Medium" : "Standard"}</b> MCQ density ${epiBadge("proxy")}</span>
    </div>
    <div class="dr-track">
      <span class="dr-lbl">Your status</span>
      <div class="chips big" data-id="${l.id}">
        <button class="chip a ${p.a ? "on" : ""}" data-dract="a">Attempted</button>
        <button class="chip r ${p.r ? "on" : ""}" data-dract="r">Reviewed</button>
        <button class="chip t ${p.t ? "on" : ""}" data-dract="t">Mastered</button>
        <button class="chip star ${st ? "on" : ""}" data-dract="star">${st ? "★ Pinned" : "☆ Pin"}</button>
      </div>
      <button class="linkbtn" data-goto-leaf="${l.id}">Open in QBank Tracker →</button>
    </div>
    <div class="dr-sec"><div class="dr-lbl">Same topic on other platforms</div>
      ${cross.length ? QBANKS.filter(p => crossByPlat[p.id]).map(p =>
        `<div class="dr-subgrp"><span class="platlabel ${p.cls}" style="color:${p.color};font-size:11px">${esc(p.name)}</span>
         ${crossByPlat[p.id].map(c => drLink(c)).join("")}</div>`).join("")
        : `<div class="muted small">No close match found on the other banks.</div>`}</div>
    <div class="dr-sec"><div class="dr-lbl">${l.cat ? "More in " + esc(l.cat) : "Related in " + esc(l.canon)}</div>
      ${sibs.length ? sibs.map(s => drLink(s)).join("") : `<div class="muted small">—</div>`}</div>
    <div class="dr-sec"><div class="dr-lbl">Related tests</div>
      ${tests.length ? tests.map(t => `<button class="dr-itemlink" data-goto-test="${esc(t.id)}"><span>${esc(t.name)}</span><span class="muted">${t.platform}</span></button>`).join("") : `<div class="muted small">No subject-named tests; see the Tests tab.</div>`}</div>
    ${videosForLeaf(l).length ? `<div class="dr-sec"><div class="dr-lbl">CoreBTR videos covering this</div>
      ${videosForLeaf(l).map(vi => `<button class="dr-itemlink" data-open-video="${vi.id}"><span>🎬 ${esc(vi.topic)}</span><span class="muted">${esc(vi.subject)}${vi.durMin ? " · " + vi.durMin + "m" : ""}</span></button>`).join("")}</div>` : ""}`;
  dr.classList.add("open"); $("#drawerScrim").classList.add("open"); dr.setAttribute("aria-hidden", "false");
  setTimeout(() => $("#drawerClose").focus(), 30);
}
function drLink(l) {
  const p = Store.prog(l.id);
  return `<button class="dr-itemlink" data-open-leaf="${l.id}">
    <span>${hyBadge(l.priority)} ${esc(l.name)}</span>
    <span class="dr-rt">${fmt(l.mcqs)} ${statusDots(l.id)}</span></button>`;
}
function closeDrawer() {
  const dr = $("#drawer"); if (!dr.classList.contains("open")) return;
  dr.classList.remove("open"); $("#drawerScrim").classList.remove("open"); dr.setAttribute("aria-hidden", "true");
  if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch {} lastFocus = null; }
}

/* ---- option bottom-sheet (mobile sort / filter) ---- */
let sheetPick = null, sheetLastFocus = null;
function openSheet(title, opts, current, onPick) {
  sheetLastFocus = document.activeElement; sheetPick = onPick;
  const sh = $("#sheet"); $("#sheetTitle").textContent = title;
  $("#sheetBody").innerHTML = opts.map(([v, l]) =>
    `<button class="sheet-opt${v === current ? " on" : ""}" data-v="${esc(v)}"><span>${esc(l)}</span>${v === current ? '<span class="sheet-tick">✓</span>' : ""}</button>`).join("");
  $("#sheetScrim").classList.add("open"); sh.classList.add("open"); sh.setAttribute("aria-hidden", "false");
  setTimeout(() => $("#sheetClose").focus(), 30);
}
function closeSheet() {
  const sh = $("#sheet"); if (!sh.classList.contains("open")) return;
  sh.classList.remove("open"); $("#sheetScrim").classList.remove("open"); sh.setAttribute("aria-hidden", "true"); sheetPick = null;
  if (sheetLastFocus && sheetLastFocus.focus) { try { sheetLastFocus.focus(); } catch {} sheetLastFocus = null; }
}
function updateQbFilterBadge() {
  const b = $("#qFilterBtn"); if (b) b.classList.toggle("has-dot", QB.status !== "all");
}
