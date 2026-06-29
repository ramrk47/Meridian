/* ============================================================
   main.js — orchestrator (loads LAST)
   Command palette, navigation / deep links, entity routing, global
   event delegation, toolbar / toast / nav / keyboard wiring, the
   RENDER map + show(view), and init().
   ============================================================ */

/* ============================================================
   COMMAND PALETTE
   ============================================================ */
let PALETTE_INDEX = null, palSel = 0, palResults = [];
function buildPaletteIndex() {
  const idx = [];
  // subjects
  QBANKS.forEach(p => subjectsOf(p.id).forEach(s =>
    idx.push({ type: "Subject", label: s, sub: p.name, run: () => jumpToSubject(canon(s), p.id) })));
  // leaves
  const leafType = { marrow: "Module", cerebellum: "Unit", doctutorials: "Chapter" };
  LEAVES.forEach(l => idx.push({ type: leafType[l.platform] || "Topic", label: l.name, sub: `${platName(l.platform)} · ${l.canon}`, leaf: l, run: () => openDrawer(l.id) }));
  // tests
  buildTests().forEach(t => idx.push({ type: "Test", label: t.name, sub: t.platform, run: () => { gotoTest(t.id); } }));
  // videos
  VIDEOS.forEach(vi => idx.push({ type: "Video", label: vi.topic, sub: `CoreBTR · ${vi.subject}`, run: () => openVideoDrawer(vi.id) }));
  // platforms (integrated content platforms → entity pages)
  QBANKS.forEach(p => idx.push({ type: "Platform", label: p.name, sub: `${fmt(platMCQ(p.id))} MCQs`, run: () => goPlatform(p.id) }));
  // faculty (gated: only indexed when seeded — never a fabricated roster)
  FACULTY.forEach(f => idx.push({ type: "Faculty", label: f.name, sub: (f.subjects || []).map(canon).join(" · ") + " · directional", run: () => goFaculty(f.id) }));
  // actions
  [["Overview", "overview"], ["QBank Tracker", "qbank"], ["Cross-platform Tracker", "tracker"], ["Progress", "progress"], ["Tests & Scores", "tests"], ["High-Yield", "hy"], ["Study Planner", "planner"]]
    .forEach(([lbl, view]) => idx.push({ type: "Go to", label: lbl, sub: "tab", run: () => show(view) }));
  idx.push({ type: "Action", label: "Export tracking (backup)", sub: "", run: () => $("#btnExport").click() });
  return idx;
}
function scoreMatch(q, s) {
  s = s.toLowerCase(); q = q.toLowerCase();
  if (s === q) return 100; if (s.startsWith(q)) return 70; const i = s.indexOf(q);
  if (i >= 0) return 50 - i * 0.1;
  // token subsequence
  let pos = 0; for (const ch of q) { pos = s.indexOf(ch, pos); if (pos < 0) return -1; pos++; } return 10;
}
let palLastFocus = null;
function openPalette() {
  palLastFocus = document.activeElement;
  PALETTE_INDEX = buildPaletteIndex(); // refresh (custom tests / state)
  $("#palette").classList.add("open"); $("#palInput").value = ""; palSel = 0;
  drawPalette(""); setTimeout(() => $("#palInput").focus(), 20);
}
function closePalette() {
  $("#palette").classList.remove("open");
  if (palLastFocus && palLastFocus.focus) { try { palLastFocus.focus(); } catch {} palLastFocus = null; }
}
function drawPalette(q) {
  q = q.trim();
  if (!q) {
    palResults = [
      ...PALETTE_INDEX.filter(x => x.type === "Go to"),
      ...PALETTE_INDEX.filter(x => x.leaf && x.leaf.priority === 3).slice(0, 5).map(x => ({ ...x, type: "High-yield" })),
    ];
  } else {
    palResults = PALETTE_INDEX.map(x => ({ x, sc: Math.max(scoreMatch(q, x.label), scoreMatch(q, x.sub) - 20) }))
      .filter(o => o.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 40).map(o => o.x);
  }
  palSel = Math.max(0, Math.min(palSel, palResults.length - 1));
  const list = $("#palList"); list.innerHTML = "";
  palResults.forEach((r, i) => {
    const it = el("div", "pal-item" + (i === palSel ? " sel" : ""));
    it.dataset.i = i;
    it.innerHTML = `<span class="pal-type ${r.type.replace(/\s/g, "").toLowerCase()}">${r.type}</span>
      <span class="pal-label">${esc(r.label)}${r.leaf ? " " + hyBadge(r.leaf.priority) : ""}</span>
      <span class="pal-sub">${esc(r.sub)}</span>`;
    list.appendChild(it);
  });
  if (!palResults.length) list.appendChild(el("div", "pal-empty", "No matches."));
}
function palMove(d) { palSel = (palSel + d + palResults.length) % (palResults.length || 1); drawPalette($("#palInput").value); ensurePalVisible(); }
function ensurePalVisible() { const s = $(".pal-item.sel"); if (s) s.scrollIntoView({ block: "nearest" }); }
function palChoose() { const r = palResults[palSel]; if (r) { closePalette(); r.run(); } }

/* ============================================================
   NAVIGATION / DEEP LINKS
   ============================================================ */
function jumpToSubject(canonSubj, platform) {
  QB.platform = platform || QB.platform;
  const list = subjectsOf(QB.platform);
  const native = list.find(s => canon(s) === canonSubj) || list[0];
  QB.subject = native; QB.search = ""; QB.status = "all"; QB.hyOnly = false;
  show("qbank");
}
function gotoLeaf(id) {
  const l = LEAF_BY_ID[id]; if (!l) return;
  QB.platform = l.platform; QB.subject = l.subject; QB.search = ""; QB.status = "all"; QB.hyOnly = false;
  closeDrawer(); show("qbank");
  setTimeout(() => {
    const block = $(`#qbContent .cat-block[data-cat="${cssEsc(l.cat)}"]`); if (block) block.classList.add("open");
    const row = $(`#qbContent .mrow[data-id="${cssEsc(id)}"]`);
    if (row) { row.scrollIntoView({ block: "center", behavior: MOTION_OK() ? "smooth" : "auto" }); row.classList.add("flash"); setTimeout(() => row.classList.remove("flash"), 1500); }
  }, 60);
}
function gotoTest(id) {
  show("tests");
  setTimeout(() => { const row = $(`#view-tests .scorerow[data-id="${cssEsc(id)}"]`); if (row) { row.scrollIntoView({ block: "center", behavior: MOTION_OK() ? "smooth" : "auto" }); row.classList.add("flash"); setTimeout(() => row.classList.remove("flash"), 1500); } }, 60);
}

/* ---- ENTITY ROUTING (entity pages are NOT tabs; they live in their own view sections) ----
   Entity pages push a real hash (#/subject/<canon>, #/platform/<id>, #/faculty/<id>) so the
   browser Back button and a page refresh both restore them (spec §4). A single hashchange
   listener (routeFromHash) is the source of truth: navigation helpers only WRITE the hash, the
   listener does the rendering. `routing` guards re-entrancy so programmatic hash writes (here and
   in show()) don't double-render or loop. */
const ENTITY_VIEWS = ["subject", "platform", "faculty"];
let routing = false; // true while we are applying a hash → suppress echo writes
function showEntity(kind) {
  // deactivate tab nav highlight + show the matching entity section only
  $$(".tab").forEach(t => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
  $$("#botnav button").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-current", "false"); });
  const home = $("#btnHome"); if (home) { home.classList.remove("active"); home.setAttribute("aria-current", "false"); }
  $$(".view").forEach(s => s.classList.toggle("active", s.id === "view-" + kind));
  const sn = $("#subnav"); if (sn) { sn.innerHTML = ""; sn.hidden = true; } // entity pages aren't a group
  requestAnimationFrame(placeBotnavInd);
  labelizeResponsiveTables(); setHeaderHeight();
  window.scrollTo({ top: 0, behavior: "instant" });
}
/* render-only entity painters (no hash side-effect) — used by the router.
   Wrapped in viewTransition (feature-detected + reduced-motion-guarded): this
   single seam covers goSubject/goPlatform/goFaculty AND Back/refresh routing.
   Fallback runs the body synchronously → unchanged behavior. animateView fires
   the entrance once after the entity renders. */
function renderSubjectView(canonSubj) { viewTransition(() => { renderSubjectPage(canonSubj); showEntity("subject"); const mt = $("#mobTitle"); if (mt) mt.textContent = canonSubj; currentView = "subject"; animateView($("#view-subject")); }); }
function renderPlatformView(id) { viewTransition(() => { renderPlatformPage(id); showEntity("platform"); const mt = $("#mobTitle"); if (mt) mt.textContent = platName(id); currentView = "platform"; animateView($("#view-platform")); }); }
function renderFacultyView(id) { viewTransition(() => { renderFacultyPage(id); showEntity("faculty"); const mt = $("#mobTitle"); if (mt) { const f = facById(id); mt.textContent = f ? f.name : "Faculty"; } currentView = "faculty"; animateView($("#view-faculty")); }); }
/* public navigation helpers — push a hash, let the router paint (keeps Back/refresh honest) */
let pendingHashWrite = false; // set when WE write the hash, so the hashchange handler doesn't treat it as a Back
function setHash(h) {
  if (routing) return;
  try {
    if (location.hash !== h) {
      window.__meridianNavDepth = (window.__meridianNavDepth || 0) + 1;
      pendingHashWrite = true;
      // NOTE: do NOT mark routeKey here. Only a caller that already PAINTED its target may
      // suppress the echo repaint (show() does, below). goSubject/goPlatform/goFaculty only
      // WRITE the hash — their echo hashchange MUST reach routeFromHash and paint the entity.
      location.hash = h;
    }
  } catch {}
}
function goSubject(canonSubj) { if (routing) { renderSubjectView(canonSubj); return; } setHash("#/subject/" + encodeURIComponent(canonSubj)); }
function goPlatform(id) { if (routing) { renderPlatformView(id); return; } setHash("#/platform/" + encodeURIComponent(id)); }
function goFaculty(id) { if (routing) { renderFacultyView(id); return; } setHash("#/faculty/" + encodeURIComponent(id)); }
/* unified back affordance for all entity pages: real browser history when we have somewhere to
   go back to, else fall to Overview. Keeps subject/platform/faculty consistent (finding fix). */
function goBack() {
  // directional cue for the View Transition: the new view enters from above, the
  // old exits downward (set one frame before history.back; cleared after the route
  // paints). Purely a CSS hint — no effect when VT is unsupported / reduced-motion.
  if (VT_OK()) { document.documentElement.dataset.vtDir = "back"; }
  if (window.__meridianNavDepth > 0) { history.back(); return; }
  show("overview");
}
/* central router: read the hash, paint the matching entity or tab. Re-entrancy-guarded.
   `routeKey` lets us skip a redundant repaint when show()/goX already rendered before writing the
   hash (the resulting echo hashchange lands on the same target). */
let routeKey = "\0"; // sentinel that never equals a real hash, so the first route always paints
function routeFromHash() {
  const raw = (location.hash || "").replace(/^#/, "");
  if (raw === routeKey) return; // already painted this exact route (echo from our own write)
  routeKey = raw;
  routing = true;
  try {
    let m;
    if ((m = raw.match(/^\/subject\/(.+)$/))) renderSubjectView(canon(decodeURIComponent(m[1])));
    else if ((m = raw.match(/^\/platform\/(.+)$/))) { const id = decodeURIComponent(m[1]); if (PLAT_BY_ID[id]) renderPlatformView(id); else show("overview"); }
    else if ((m = raw.match(/^\/faculty\/(.+)$/))) { const id = decodeURIComponent(m[1]); if (facById(id)) renderFacultyView(id); else show("overview"); }
    else { const v = raw.replace(/^\//, ""); show(RENDER[v] ? v : "overview"); }
  } finally {
    routing = false;
    // clear the directional Back cue after this route's transition has been kicked
    // off (rAF for foreground; setTimeout so a hidden/throttled tab still clears it
    // and the cue can't leak into the next forward navigation).
    if (document.documentElement.dataset.vtDir) {
      const clearDir = () => { delete document.documentElement.dataset.vtDir; };
      requestAnimationFrame(clearDir);
      setTimeout(clearDir, 400);
    }
  }
}

/* ============================================================
   GLOBAL EVENT DELEGATION
   ============================================================ */
function appClick(e) {
  // test interactions first
  if (testsClick(e)) return;

  // tracking chips (qbank rows or drawer)
  const actBtn = e.target.closest("[data-act],[data-dract]");
  if (actBtn) {
    const drawerChips = actBtn.closest(".chips.big");
    const id = drawerChips ? drawerChips.dataset.id : (e.target.closest(".mrow")?.dataset.id);
    const act = actBtn.dataset.act || actBtn.dataset.dract;
    if (id && act) {
      if (act === "star") Store.star(id); else Store.toggle(id, act);
      refreshRowEverywhere(id);
      if (drawerChips) refreshDrawerChips(id);
      syncAfterToggle(id);
      return;
    }
  }
  // video tracking chips (row or drawer)
  const vBtn = e.target.closest("[data-vact],[data-vdract]");
  if (vBtn) {
    const drawerV = vBtn.closest(".vchips.big");
    const id = drawerV ? drawerV.dataset.vid : e.target.closest(".vrow")?.dataset.vid;
    const act = vBtn.dataset.vact || vBtn.dataset.vdract;
    if (id && act) {
      Store.toggleVideo(id, act);
      const x = Store.video(id);
      $$(`.vrow[data-vid="${cssEsc(id)}"]`).forEach(r => {
        r.classList.toggle("done", !!x.w);
        const w = $(".chip.a", r), rv = $(".chip.r", r);
        if (w) { w.classList.toggle("on", !!x.w); w.setAttribute("aria-pressed", x.w ? "true" : "false"); }
        if (rv) { rv.classList.toggle("on", !!x.v); rv.setAttribute("aria-pressed", x.v ? "true" : "false"); }
      });
      if (drawerV) { $(".chip.a", drawerV)?.classList.toggle("on", !!x.w); $(".chip.r", drawerV)?.classList.toggle("on", !!x.v); }
      syncVideoAfterToggle(id);
      return;
    }
  }
  const ov = e.target.closest("[data-open-video]"); if (ov) { openVideoDrawer(ov.dataset.openVideo); return; }
  const vsb = e.target.closest("[data-vsubj]"); if (vsb) { vSubject = vsb.dataset.vsubj; drawVideoSidebar(); drawVideoSubject(); $("#vbContent").scrollIntoView({ block: "start", behavior: MOTION_OK() ? "smooth" : "auto" }); return; }
  // cross-bank coverage jump
  const xg = e.target.closest("[data-xgo]"); if (xg) { e.stopPropagation(); gotoLeaf(xg.dataset.xgo); return; }
  // open drawer
  const op = e.target.closest("[data-open-leaf]"); if (op) { openDrawer(op.dataset.openLeaf); return; }
  // entity-page links (scaffolding for 3b surfaces)
  const es = e.target.closest("[data-go-subject]"); if (es) { goSubject(es.dataset.goSubject); return; }
  const ep = e.target.closest("[data-go-platform]"); if (ep) { goPlatform(ep.dataset.goPlatform); return; }
  const ef = e.target.closest("[data-go-faculty]"); if (ef) { goFaculty(ef.dataset.goFaculty); return; }
  const eh = e.target.closest("[data-go-overview]"); if (eh) { goBack(); return; }
  // engraved-plate imprint badge (touch answer to hover tooltips) → "How we know this" sheet
  const rp = e.target.closest("[data-read-plate]"); if (rp) { readPlateSheet(rp.dataset.readPlate, rp.dataset.readSrc, rp.dataset.readCap); return; }
  // category collapse (ignore clicks on the bulk button inside the header)
  const ct = e.target.closest("[data-cat-toggle]"); if (ct && !e.target.closest("[data-bulk]")) { ct.closest(".cat-block").classList.toggle("open"); return; }
  // bulk mark
  const bulk = e.target.closest("[data-bulk]");
  if (bulk) {
    const block = bulk.closest(".cat-block"); const cat = block.dataset.cat, subject = block.dataset.subject;
    const ls = leavesOf(QB.platform, subject).filter(l => l.cat === cat);
    const allDone = ls.every(l => Store.prog(l.id).a);
    ls.forEach(l => { const p = Store.prog(l.id); if (allDone ? p.a : !p.a) Store.toggle(l.id, "a"); });
    drawSubject(); drawSidebar();
    toast(allDone ? `Unmarked ${esc(cat)}` : `Marked ${ls.length} modules attempted`);
    return;
  }
  // sidebar subject select
  const sb = e.target.closest("[data-subj]"); if (sb) { QB.subject = sb.dataset.subj; drawSidebar(); drawSubject(); $("#qbContent").scrollIntoView({ block: "start", behavior: MOTION_OK() ? "smooth" : "auto" }); return; }
  // jumps
  const js = e.target.closest("[data-jump-subj]"); if (js) { jumpToSubject(js.dataset.jumpSubj, js.dataset.jumpPlat || js.closest("[data-jump-plat]")?.dataset.jumpPlat); return; }
  const jo = e.target.closest("[data-jump-other]"); if (jo) { QB.platform = jo.dataset.jumpPlat; QB.subject = jo.dataset.jumpOther; QB.search = ""; QB.status = "all"; QB.hyOnly = false; renderQbank(); return; }
  const gl = e.target.closest("[data-goto-leaf]"); if (gl) { gotoLeaf(gl.dataset.gotoLeaf); return; }
  const gt = e.target.closest("[data-goto-test]"); if (gt) { closeDrawer(); gotoTest(gt.dataset.gotoTest); return; }
  const qa = e.target.closest("[data-quick-a]"); if (qa) { Store.toggle(qa.dataset.quickA, "a"); renderOverview(); return; }
  const hg = e.target.closest("[data-jump-hygaps]"); if (hg) { QB.status = "untracked"; QB.hyOnly = true; QB.search = ""; show("qbank"); return; }
}
function refreshRowEverywhere(id) {
  const p = Store.prog(id), st = Store.state.stars[id];
  $$(`.mrow[data-id="${cssEsc(id)}"]`).forEach(row => {
    row.classList.toggle("done", !!p.a);
    [["a", p.a], ["r", p.r], ["t", p.t]].forEach(([k, val]) => { const c = $(".chip." + k, row); if (c) { c.classList.toggle("on", !!val); c.setAttribute("aria-pressed", val ? "true" : "false"); } });
    const ps = $(".pinstar", row); if (ps) { ps.classList.toggle("on", !!st); ps.textContent = st ? "★" : "☆"; ps.setAttribute("aria-pressed", st ? "true" : "false"); }
  });
}
function refreshDrawerChips(id) {
  const p = Store.prog(id), st = Store.state.stars[id];
  const box = $(`.chips.big[data-id="${cssEsc(id)}"]`); if (!box) return;
  $(".chip.a", box)?.classList.toggle("on", !!p.a);
  $(".chip.r", box)?.classList.toggle("on", !!p.r);
  $(".chip.t", box)?.classList.toggle("on", !!p.t);
  const star = $(".chip.star", box); if (star) { star.classList.toggle("on", !!st); star.textContent = st ? "★ Pinned" : "☆ Pin"; }
}

/* ============================================================
   TOOLBAR / TOAST / NAV / KEYBOARD
   ============================================================ */
function wireToolbar() {
  $("#btnExport").addEventListener("click", () => {
    const blob = new Blob([Store.export()], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `meridian-tracking-${Store.state.profile}.json`; a.click(); URL.revokeObjectURL(a.href);
  });
  $("#btnImport").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { try { Store.import(rd.result); show(currentView); toast("Tracking imported"); } catch { toast("Invalid file", true); } };
    rd.readAsText(f);
  });
  $("#btnReset").addEventListener("click", () => {
    if (confirm("Reset all your tracking (progress, scores, stars, custom tests)? The QBank data itself stays.")) { Store.reset(); show(currentView); toast("Tracking reset"); }
  });
  $("#btnSearch")?.addEventListener("click", openPalette);
  $("#btnTheme")?.addEventListener("click", toggleTheme);
  // My banks — the personal-subscriptions selector (scopes plan generation). The
  // sheet + dot live in surfaces/planner.js (openBanksSheet / _syncBanksDot).
  $("#btnBanks")?.addEventListener("click", () => { if (typeof openBanksSheet === "function") openBanksSheet(); });
  if (typeof _syncBanksDot === "function") _syncBanksDot();
}
/* account + sync indicator (Google OAuth; local-first preserved). The single
   #btnAccount button doubles as the sync status pill. Overflow proxies to it. */
function wireAccount() {
  const btn = $("#btnAccount"), ov = $("#ovAccount");
  if (!btn || !window.Account) return;
  const first = () => { const u = Account.user; return u ? (u.name || u.email || "Account").split(" ")[0] : "Account"; };
  const LABEL = {
    off:     () => "↪ Sign in",
    syncing: () => "⟳ Syncing…",
    synced:  () => "✓ " + first(),
    pending: () => "● " + first() + " · will sync",
    offline: () => "● " + first() + " · offline",
  };
  function render() {
    const s = Account.status;
    btn.textContent = (LABEL[s] || LABEL.off)();
    btn.classList.toggle("on", !!Account.user);
    btn.title = Account.user
      ? `Signed in as ${Account.user.email || first()} — click to sign out`
      : "Sign in to sync across devices";
    if (ov) ov.textContent = Account.user ? ("⎋ Sign out (" + first() + ")") : "↪ Sign in";
  }
  document.addEventListener("account-changed", render);
  btn.addEventListener("click", () => {
    if (Account.user) {
      if (confirm("Sign out? Your local tracking stays on this device.")) Account.signOut().then(() => toast("Signed out"));
    } else if (Account.config.devAuth && !Account.config.googleClientId) {
      Account.signInDev().then(() => { if (Account.user) toast("Signed in (dev)"); });
    } else {
      Account.signInGoogle();
    }
  });
  render();
  Account.init();   // fire-and-forget; never blocks the UI
}
/* mobile-only chrome: compact search button + overflow "⋯" menu (proxies the toolbar) */
function wireMobileChrome() {
  $("#btnSearchM")?.addEventListener("click", openPalette);
  const ovBtn = $("#btnOverflow"), ovMenu = $("#overflowMenu");
  if (!ovBtn || !ovMenu) return;
  const close = () => { ovMenu.hidden = true; ovBtn.setAttribute("aria-expanded", "false"); };
  ovBtn.addEventListener("click", e => {
    e.stopPropagation();
    const willOpen = ovMenu.hidden; ovMenu.hidden = !willOpen; ovBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });
  ovMenu.addEventListener("click", e => { const b = e.target.closest("[data-proxy]"); if (b) { close(); $("#" + b.dataset.proxy)?.click(); } });
  document.addEventListener("click", e => { if (!ovMenu.hidden && !e.target.closest(".overflow")) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !ovMenu.hidden) close(); });
}
/* bottom-sheet drawer: drag the handle down to dismiss (mobile only) */
function wireDrawerDrag() {
  const dr = $("#drawer"), head = $(".drawer-head", dr); if (!head) return;
  let startY = 0, curY = 0, dragging = false;
  const isSheet = () => matchMedia("(max-width:640px)").matches;
  head.addEventListener("touchstart", e => {
    if (!isSheet() || !dr.classList.contains("open")) return;
    dragging = true; startY = e.touches[0].clientY; curY = 0; dr.style.transition = "none";
  }, { passive: true });
  head.addEventListener("touchmove", e => {
    if (!dragging) return; curY = Math.max(0, e.touches[0].clientY - startY); dr.style.transform = `translateY(${curY}px)`;
  }, { passive: true });
  head.addEventListener("touchend", () => {
    if (!dragging) return; dragging = false; dr.style.transition = ""; dr.style.transform = "";
    if (curY > 90) closeDrawer();
  });
}
/* persistent visually-hidden live region so transient toasts are announced to
   screen readers (the .toast element itself is not announced). polite for
   confirmations, assertive for the bad/error variant. Created lazily, once. */
function srAnnounce(msg, bad) {
  const id = bad ? "srLiveAssertive" : "srLivePolite";
  let region = document.getElementById(id);
  if (!region) {
    region = el("div", "sr-only");
    region.id = id;
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", bad ? "assertive" : "polite");
    region.setAttribute("aria-atomic", "true");
    document.body.appendChild(region);
  }
  // clear then set on the next frame so repeated identical messages re-announce
  region.textContent = "";
  requestAnimationFrame(() => { region.textContent = msg; });
}
function toast(msg, bad) {
  const t = el("div", "toast" + (bad ? " bad" : ""), msg); document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2200);
  srAnnounce(msg, bad);
}
function toggleTheme() {
  const dark = document.body.classList.toggle("evening");
  try { localStorage.setItem("meridian_theme", dark ? "evening" : "day"); } catch {}
  $("#btnTheme").textContent = dark ? "☾ Evening" : "☀ Day";
}

const RENDER = { overview: renderOverview, qbank: renderQbank, tracker: renderTracker, progress: renderProgress, tests: renderTests, hy: renderHY, videos: renderVideos, planner: renderPlanner };
const TAB_LABEL = { overview: "Overview", qbank: "QBank", tracker: "Cross-platform Tracker", progress: "Progress", tests: "Tests & Scores", hy: "High-Yield", videos: "Videos", planner: "Study Planner" };
let currentView = "overview";

/* ============================================================
   NAV GROUPS — ≤5 bottom-bar buttons; related sections merge into a
   group and a top "sub-nav" lens switcher picks between them (the same
   mechanic as the Tracker's Cross-platform/PYQ toggle, lifted up so it
   serves every grouped tab). A lens = {view, label, lens?}; `lens` (for
   the tracker) sets trkLens before rendering. show(view) stays the atom —
   every deep-link / palette / hotkey / Back path calls it and the group
   chrome (tabs + bottom bar + sub-nav) re-syncs from the resulting view.
   ============================================================ */
const NAV_GROUPS = [
  { id: "home", label: "Home", icon: "⌂", lenses: [{ view: "overview", label: "Overview" }] },
  { id: "track", label: "Track", icon: "⊞", lenses: [
      { view: "tracker", label: "Cross-platform", lens: "cross" },
      { view: "tracker", label: "PYQ", lens: "pyq" },
      { view: "qbank", label: "QBank" }] },
  { id: "plan", label: "Plan", icon: "◆", lenses: [
      { view: "planner", label: "Planner" }, { view: "hy", label: "High-Yield" }] },
  { id: "stats", label: "Stats", icon: "◔", lenses: [
      { view: "progress", label: "Progress" }, { view: "tests", label: "Tests & Scores" }] },
  { id: "videos", label: "Videos", icon: "▷", lenses: [{ view: "videos", label: "Videos" }] },
];
const GROUP_BY_ID = Object.fromEntries(NAV_GROUPS.map(g => [g.id, g]));
const GROUP_OF_VIEW = {}; // view -> owning groupId (first match)
NAV_GROUPS.forEach(g => g.lenses.forEach(l => { if (!(l.view in GROUP_OF_VIEW)) GROUP_OF_VIEW[l.view] = g.id; }));
const GROUP_LAST = {};    // groupId -> last-used lens index (so re-tapping a group returns to your lens)

/* build the desktop tab bar + mobile bottom bar from NAV_GROUPS (once, in init) */
function renderNavChrome() {
  const tabs = $("#tabs");
  if (tabs) tabs.innerHTML = NAV_GROUPS.map(g =>
    `<button class="tab" role="tab" data-group="${g.id}" aria-selected="false" tabindex="-1">${esc(g.label)}</button>`).join("");
  const bot = $("#botnav");
  if (bot) bot.innerHTML = NAV_GROUPS.map(g =>
    `<button data-group="${g.id}" aria-label="${esc(g.label)}"><span class="bn-i" aria-hidden="true">${g.icon}</span><span class="bn-l">${esc(g.label)}</span></button>`).join("")
    + `<span class="bn-ind" aria-hidden="true"></span>`;
}
/* which lens of a group is active for the current view (+ tracker sub-state) */
function _activeLensIndex(g, view) {
  for (let i = 0; i < g.lenses.length; i++) { const l = g.lenses[i]; if (l.view === view && (!l.lens || l.lens === trkLens)) return i; }
  for (let i = 0; i < g.lenses.length; i++) { if (g.lenses[i].view === view) return i; }
  return 0;
}
/* render the top sub-nav lens switcher (only when the group has ≥2 lenses) */
function renderSubnav(groupId, view) {
  const sn = $("#subnav"); if (!sn) return;
  const g = GROUP_BY_ID[groupId];
  if (!g || g.lenses.length < 2) { sn.innerHTML = ""; sn.hidden = true; return; }
  const idx = _activeLensIndex(g, view);
  sn.hidden = false;
  sn.innerHTML = `<div class="subnav-inner" role="tablist" aria-label="${esc(g.label)} views">`
    + g.lenses.map((l, i) => `<button class="subnav-btn${i === idx ? " on" : ""}" role="tab" data-lensidx="${i}" aria-selected="${i === idx ? "true" : "false"}" tabindex="${i === idx ? "0" : "-1"}">${esc(l.label)}</button>`).join("")
    + `</div>`;
}
/* slide the bottom-bar active indicator under the active group button */
function placeBotnavInd() {
  const bot = $("#botnav"); if (!bot) return;
  const ind = $(".bn-ind", bot), on = $("button.active[data-group]", bot);
  if (!ind) return;
  if (!on || !on.offsetParent) { ind.style.width = "0px"; return; }
  ind.style.transform = `translateX(${on.offsetLeft}px)`;
  ind.style.width = on.offsetWidth + "px";
}
/* open a group → its remembered (or first) lens */
function showGroup(groupId) {
  const g = GROUP_BY_ID[groupId]; if (!g) return;
  let idx = GROUP_LAST[groupId] != null ? GROUP_LAST[groupId] : 0;
  if (idx >= g.lenses.length) idx = 0;
  showLens(groupId, idx);
}
/* open a specific lens within a group */
function showLens(groupId, idx) {
  const g = GROUP_BY_ID[groupId]; if (!g) return;
  const l = g.lenses[idx]; if (!l) return;
  GROUP_LAST[groupId] = idx;
  if (l.lens && l.view === "tracker") trkLens = l.lens;   // set sub-state BEFORE the view renders
  show(l.view);
}
/* sync tabs + bottom bar + sub-nav off the active view (called by show()) */
function _syncGroupChrome(view) {
  const gid = GROUP_OF_VIEW[view];
  $$("#tabs .tab").forEach(t => { const on = t.dataset.group === gid; t.classList.toggle("active", on); t.setAttribute("aria-selected", on ? "true" : "false"); });
  $$("#botnav button[data-group]").forEach(b => { const on = b.dataset.group === gid; b.classList.toggle("active", on); b.setAttribute("aria-current", on ? "page" : "false"); });
  const home = $("#btnHome"); if (home) { const on = view === "overview"; home.classList.toggle("active", on); home.setAttribute("aria-current", on ? "page" : "false"); }
  renderSubnav(gid, view);
  // mobile header reflects the ACTIVE LENS (e.g. "PYQ"), not just the view — accurate for grouped tabs
  const g = GROUP_BY_ID[gid], mt = $("#mobTitle");
  if (mt && g) { const l = g.lenses[_activeLensIndex(g, view)]; mt.textContent = (g.lenses.length > 1 ? (l && l.label) : (TAB_LABEL[view] || view)); }
  requestAnimationFrame(placeBotnavInd);
}
function show(view) {
  // entity views aren't tabs and have no RENDER entry — re-paint them from the live hash instead
  // (keeps show(currentView) safe after import/reset while an entity page is open).
  if (!RENDER[view]) { routeKey = "\0"; routeFromHash(); return; }
  // calm editorial cross-fade via the View Transitions API (feature-detected +
  // reduced-motion-guarded inside viewTransition); the synchronous fallback IS
  // today's exact behavior, so routing/Back/refresh logic is unchanged.
  viewTransition(() => {
    currentView = view;
    _syncGroupChrome(view);              // tabs + bottom bar + sub-nav lens switcher + mob title
    $$(".view").forEach(s => s.classList.toggle("active", s.id === "view-" + view));
    RENDER[view]();
    labelizeResponsiveTables();
    setHeaderHeight();
    animateView($("#view-" + view));     // reveal panels / chart intro / hero count-up (once)
  });
  setHash("#/" + view); // suppressed while routing (router is painting); else writes a Back-able entry
  routeKey = "/" + view; // we just painted this tab — mark it so the echo hashchange is a no-op
  // tab change scroll-to-top is always instant (never a smooth fight with the transition)
  window.scrollTo({ top: 0, behavior: "instant" });
}
/* card-list table mode (mobile): auto-stamp each cell with its column header,
   and wrap wide tables in a horizontal-scroll fallback for the tablet range
   (cards take over ≤640px, where .tbl-scroll goes overflow:visible). */
function labelizeResponsiveTables() {
  $$("#app .view.active table.resp").forEach(tbl => {
    if (!tbl.parentElement.classList.contains("tbl-scroll")) {
      const wrap = el("div", "tbl-scroll");
      tbl.parentNode.insertBefore(wrap, tbl); wrap.appendChild(tbl);
    }
    const heads = $$("thead th", tbl).map(th => th.textContent.trim());
    $$("tbody tr", tbl).forEach(tr => $$("td", tr).forEach((td, i) => { if (heads[i]) td.setAttribute("data-label", heads[i]); }));
  });
}
function setHeaderHeight() {
  // defer the offsetHeight read into a rAF so the write→read→write layout thrash
  // on every show() collapses into one frame (no forced sync reflow mid-swap).
  requestAnimationFrame(() => {
    const h = $(".topbar")?.offsetHeight || 110;
    document.documentElement.style.setProperty("--hh", h + "px");
  });
}

function qbVisibleRows() { return $$("#qbContent .mrow").filter(r => r.offsetParent !== null); }
function moveCursor(dir) {
  const rows = qbVisibleRows(); if (!rows.length) return;
  let idx = rows.findIndex(r => r.dataset.id === QB.cursorId);
  idx = idx < 0 ? (dir > 0 ? 0 : rows.length - 1) : Math.max(0, Math.min(rows.length - 1, idx + dir));
  rows.forEach(r => r.classList.remove("cursor"));
  const row = rows[idx]; row.classList.add("cursor"); QB.cursorId = row.dataset.id;
  row.scrollIntoView({ block: "nearest" });
}
function cursorAct(act) {
  if (!QB.cursorId) { moveCursor(1); return; }
  if (act === "star") Store.star(QB.cursorId); else Store.toggle(QB.cursorId, act);
  refreshRowEverywhere(QB.cursorId); syncAfterToggle(QB.cursorId);
}
document.addEventListener("keydown", e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); return; }
  if ($("#palette").classList.contains("open")) {
    if (e.key === "Escape") closePalette();
    else if (e.key === "ArrowDown") { e.preventDefault(); palMove(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); palMove(-1); }
    else if (e.key === "Enter") { e.preventDefault(); palChoose(); }
    return;
  }
  // fast score entry: Enter jumps to next test's Right input
  if (e.target.classList && e.target.classList.contains("sin")) {
    if (e.key === "Enter") {
      e.preventDefault();
      const row = e.target.closest(".scorerow"); const next = row && row.nextElementSibling;
      const ni = next && next.querySelector('input[data-f="right"]'); if (ni) { ni.focus(); ni.select(); }
    }
    return;
  }
  if (e.key === "Escape") { closeSheet(); closeDrawer(); return; }
  if (typing) return;
  if (e.key === "/") { e.preventDefault(); openPalette(); return; }
  if (e.key >= "1" && e.key <= "9" && +e.key <= NAV_GROUPS.length) { showGroup(NAV_GROUPS[+e.key - 1].id); return; }
  // QBank keyboard tracking
  if (currentView === "qbank") {
    const k = e.key.toLowerCase();
    if (k === "j" || e.key === "ArrowDown") { e.preventDefault(); moveCursor(1); }
    else if (k === "k" || e.key === "ArrowUp") { e.preventDefault(); moveCursor(-1); }
    else if (k === "a") cursorAct("a");
    else if (k === "r") cursorAct("r");
    else if (k === "t") cursorAct("t");
    else if (k === "s") cursorAct("star");
  }
});

function init() {
  // dynamic subhead — derived from D.platforms (no hardcoded platform list)
  const sub = $("#subhead");
  if (sub) sub.textContent = `Cross-platform exam almanac · ${D.exam || ""} · ${PLATFORMS.map(p => p.name).join(" · ")} · captured ${D.captured}`;
  // theme
  try { if (localStorage.getItem("meridian_theme") === "evening") { document.body.classList.add("evening"); } } catch {}
  if ($("#btnTheme")) $("#btnTheme").textContent = document.body.classList.contains("evening") ? "☾ Evening" : "☀ Day";
  wireToolbar();
  wireAccount();
  wireMobileChrome();
  wireDrawerDrag();
  renderNavChrome();
  $("#tabs").addEventListener("click", e => { const b = e.target.closest(".tab"); if (b && b.dataset.group) showGroup(b.dataset.group); });
  $("#botnav").addEventListener("click", e => { const b = e.target.closest("button[data-group]"); if (b) showGroup(b.dataset.group); });
  $("#subnav").addEventListener("click", e => { const b = e.target.closest(".subnav-btn"); if (b) showLens(GROUP_OF_VIEW[currentView], +b.dataset.lensidx); });
  $("#btnHome")?.addEventListener("click", () => show("overview"));
  document.body.addEventListener("click", appClick); // body, not #app — drawer/palette live outside #app
  $("#app").addEventListener("input", testsInput);
  // keyboard activation for focusable non-button controls (Enter / Space).
  // Covers both role="button" widgets AND role="link" entity navigators
  // (data-go-subject/platform/faculty) so keyboard users can open entity pages.
  document.body.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target.closest('[data-open-leaf],[data-jump-subj],[data-goto-leaf],[data-xgo],[data-quick-a],[data-open-video],[data-go-subject],[data-go-platform],[data-go-faculty]');
    if (!t) return;
    const role = t.getAttribute("role");
    if (role === "button" || role === "link") { e.preventDefault(); t.click(); }
  });
  // palette wiring
  $("#palInput").addEventListener("input", e => { palSel = 0; drawPalette(e.target.value); });
  $("#palList").addEventListener("click", e => { const it = e.target.closest(".pal-item"); if (it) { palSel = +it.dataset.i; palChoose(); } });
  $("#palScrim").addEventListener("click", closePalette);
  $("#drawerScrim").addEventListener("click", closeDrawer);
  $("#drawerClose").addEventListener("click", closeDrawer);
  // option bottom-sheet wiring
  $("#sheetScrim").addEventListener("click", closeSheet);
  $("#sheetClose").addEventListener("click", closeSheet);
  $("#sheetBody").addEventListener("click", e => { const b = e.target.closest(".sheet-opt"); if (b) { const v = b.dataset.v, cb = sheetPick; closeSheet(); if (cb) cb(v); } });
  window.addEventListener("resize", setHeaderHeight);
  window.addEventListener("resize", placeBotnavInd);
  // hash routing: Back/Forward + refresh restore the exact entity page or tab (spec §4).
  // Browser Back decrements our nav depth so goBack() knows when there's history left.
  window.addEventListener("hashchange", () => {
    if (pendingHashWrite) { pendingHashWrite = false; } // our own forward write — depth already incremented
    else if (window.__meridianNavDepth > 0) window.__meridianNavDepth--; // user pressed Back/Forward
    routeFromHash();
  });
  // initial view from hash (supports legacy bare "#qbank" and new "#/qbank" / "#/subject/..." forms)
  window.__meridianNavDepth = 0;
  routeFromHash();
}
Store.load().then(init);
