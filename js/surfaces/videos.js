/* ============================================================
   surfaces/videos.js — VIDEOS (CoreBTR topic clips + linked modules)
   Cross-surface video helpers live in core.js; this owns the surface,
   its KPI tiles, faculty rollup (relational), sidebar, dense clip rows,
   the video drawer, and post-toggle sync.

   THE ATLAS contract:
     · density via shared primitives — statTile/.tiles, listRow-shaped rows
       in ONE inset container, the qb sidebar shell (mobile sticky toolbar).
     · JUDGMENT not inventory — every figure carries its epistemic label:
         clip set + your tracking = MEASURED (local, this device)
         auto-cut topic confidence = PROXY
         faculty-of-record mapping = DIRECTIONAL (seed, sourced via faculty)
     · RELATIONAL viz = "who teaches this set" faculty rollup → Faculty pages
       (the un-buildable-by-incumbents bridge). Gated when no faculty mapped.
   Tracking hooks preserved verbatim for main.js appClick delegation:
     row = .vrow[data-vid] with .chip.a/.chip.r[data-vact]; data-open-video;
     sidebar item [data-vsubj] with meterHTML in .sb-row2 (syncVideoAfterToggle).
   ============================================================ */
let vSubject = null;
function vDefaultSubject() { return videoSubjects()[0]; }

/* a refined empty/forthcoming state — reads as "a plate awaiting its engraving",
   not a broken box. Monochrome stroke-only mark (open ledger), serif title, meta
   body. `compact` trims chrome for the in-plate (faculty-forthcoming) variant.
   NOTE: the spec's canonical emptyState() belongs in the shared ds.js; it is
   absent today, so this scoped helper carries the intent without editing shared
   files (flagged for the integrator). No color, no fabricated data — firewall-safe. */
function _vidEmptyState(title, body, compact) {
  // delegate to the shared ds.emptyState() primitive (film mark). body is plain text here,
  // so esc it (emptyState inserts body as markup; it esc's the title itself). compact keeps
  // its modifier class for any tighter sidebar contexts.
  const html = emptyState({ icon: "film", title, body: esc(body) });
  return compact ? html.replace('class="empty es-trail"', 'class="empty es-trail is-compact"') : html;
}

/* faculty-of-record for the loaded video set: [{fac, clips}] desc by clips.
   DIRECTIONAL (seed). Drives the relational rollup + per-row faculty chip. */
function _videoFacultyRollup() {
  const counts = {};
  VIDEOS.forEach(v => {
    (v.facultyIds || (v.facultyId ? [v.facultyId] : [])).forEach(id => { counts[id] = (counts[id] || 0) + 1; });
  });
  return Object.keys(counts).map(id => ({ fac: facById(id), clips: counts[id] }))
    .filter(r => r.fac).sort((a, b) => b.clips - a.clips);
}
/* union of the sourced affiliation refs across the rolled-up faculty (for the
   directional imprint — we cite the faculty's own public sources, never fabricate). */
function _videoFacultySources(roll) {
  const ids = new Set();
  roll.forEach(r => (r.fac.affiliations || []).forEach(a => (a.sourceIds || a.sourceId ? [].concat(a.sourceIds || a.sourceId) : []).forEach(s => ids.add(s))));
  return [...ids];
}

function renderVideos() {
  resetPlates();
  const v = $("#view-videos"); v.innerHTML = "";
  if (!VIDEOS.length) {
    // richer empty state — a plate awaiting its engraving, not a missing thing.
    // (emptyState() is the spec's shared ds.js primitive; absent today — see return notes.
    //  This scoped .vid-empty markup matches the intent so the surface stays whole.)
    v.appendChild(el("div", "vid-empty", _vidEmptyState(
      "No video set loaded yet",
      "This layer is source-agnostic — a CoreBTR (or any future) topic-cut lecture set drops in here and lights up tracking, faculty of record, and module matching automatically.")));
    return;
  }
  if (!vSubject || !videoSubjects().includes(vSubject)) vSubject = vDefaultSubject();

  const all = vidRollup(VIDEOS);
  const roll = _videoFacultyRollup();
  const hrs = Math.round(all.mins / 60);

  /* ── KPI tiles: 6 above the fold, compact 2/3-col. ONE serif hero. ── */
  const tiles = el("div", "tiles vid-tiles");
  tiles.dataset.reveal = "";                          // the deck rises+fades once on entrance
  tiles.innerHTML = [
    // hero numeral carries data-count → shared countUp() animates it ONCE (reduced-motion-safe;
    // the final fmt() string stays the rendered text so the figure is never left mid-count).
    statTile({ accent: "k", hero: true, value: fmt(VIDEOS.length), label: "CoreBTR clips", note: "topic-cut lecture set", epi: "measured" })
      .replace('<span class="tile-v num">', `<span class="tile-v num" data-count="${VIDEOS.length}">`),
    statTile({ accent: "m", value: pct(all.w, all.total) + "%", label: "Watched", note: `${all.w} of ${all.total} clips`, epi: "measured" }),
    statTile({ accent: "c", value: fmt(all.r), label: "Revised", note: "second-pass clips", epi: "measured" }),
    statTile({ accent: "g", value: hrs + "h", label: "Runtime", note: `${fmt(all.mins)} min total`, epi: "measured" }),
    statTile({ value: fmt(videoSubjects().length), label: "Subjects", note: "covered by the set", epi: "measured" }),
    statTile({ value: fmt(roll.length), label: "Faculty mapped", note: roll.length ? "faculty of record →" : "seeding", epi: "directional", go: roll.length === 1 ? "faculty:" + roll[0].fac.id : undefined }),
  ].join("");
  v.appendChild(tiles);

  /* ── RELATIONAL viz + intent, 2-up (desktop) → faculty-of-record rollup left,
       the tracking callout right; collapses to one column on mobile (panel-grid). ── */
  const band = el("div", "panel-grid vid-band");
  band.appendChild(_facultyRollupSection(roll));      // already a [data-reveal]-able .cframe.plate inside
  const calloutCell = el("div", "vid-callout-cell");
  calloutCell.dataset.reveal = "";
  calloutCell.innerHTML = `<div class="callout vid-callout">
    <b>Video tracking.</b> Your CoreBTR lecture set, cut topic-by-topic. Mark <b>Watched</b> / <b>Revised</b>; each clip is
    <b>matched to the question-bank modules it likely covers</b> across Marrow &amp; Cerebellum by topic similarity ${epiDot("proxy")} — open a
    clip for suggested modules, jumps, and the faculty of record. This layer is source-agnostic: any future video set drops in the same way.</div>`;
  band.appendChild(calloutCell);
  v.appendChild(band);

  /* ── sidebar + dense rows (reuses the mobile-sticky qb shell) ── */
  const layout = el("div", "qb-layout");
  layout.dataset.reveal = "";                          // the tracking workspace rises in last
  layout.innerHTML = `
    <aside class="qb-side">
      <div class="sb-list" id="vbList"></div>
    </aside>
    <div class="qb-main">
      <div class="qb-controls vid-controls">
        <h3 class="vid-heading" id="vHeading"></h3>
        <span class="vid-sub" id="vHeadSub"></span>
        <div class="spacer"></div>
        <button class="ghostbtn" id="vWatchAll" title="Mark all watched">✓ Watch all</button>
      </div>
      <div class="qb-content" id="vbContent"></div>
    </div>`;
  v.appendChild(layout);

  drawVideoSidebar(); drawVideoSubject();
  $("#vWatchAll").addEventListener("click", () => {
    const vids = videosOf(vSubject); const allW = vids.every(x => Store.video(x.id).w);
    vids.forEach(x => { if (allW ? Store.video(x.id).w : !Store.video(x.id).w) Store.toggleVideo(x.id, "w"); });
    drawVideoSubject(); drawVideoSidebar(); toast(allW ? "Unmarked subject" : `Marked ${vids.length} clips watched`);
  });
}

/* the relational rollup — a chartFrame'd ranked list of faculty by clip count,
   each linking to its Faculty page. DIRECTIONAL; imprint cites the faculty's
   own public sources. Gated to an honest empty-state when no mapping seeded. */
function _facultyRollupSection(roll) {
  const wrap = el("div", "vid-facroll");
  wrap.dataset.reveal = "";                            // panel rises+fades once on entrance
  if (!roll.length) {
    // honest "plate awaiting engraving" — forthcoming, not empty (gated-honesty contract).
    wrap.innerHTML = chartFrame(
      "Faculty of record", "directional", [], D.subjectStrength ? D.subjectStrength.captured : "",
      _vidEmptyState(
        "Faculty of record — forthcoming",
        "No clips attributed to a teacher yet. As the set is mapped, the people teaching it engrave here and link to their career timelines.",
        true),
      { note: "Faculty layer is seeded — aggregate, community-sentiment, never a ranking of people." });
    return wrap;
  }
  const max = roll[0].clips;
  const rows = roll.map(r => {
    const w = Math.max(4, Math.round(r.clips / max * 100));
    const subs = (r.fac.subjects || []).map(canon).slice(0, 2).join(" · ");
    return `<a class="vfr-row is-link" data-go-faculty="${esc(r.fac.id)}" role="link" tabindex="0">`
      + `<span class="vfr-dot" style="--c:${platColor((r.fac.platforms && r.fac.platforms[0] && r.fac.platforms[0].platformId) || "")}"></span>`
      + `<span class="vfr-main"><span class="vfr-name">${esc(r.fac.name)}</span>`
      + (subs ? `<span class="vfr-sub">${esc(subs)}</span>` : "")
      + `</span>`
      + `<span class="vfr-track"><i class="vfr-bar" style="width:${w}%;background:${yieldFill(r.clips / max)}"></i></span>`
      + `<span class="vfr-val num">${fmt(r.clips)}</span></a>`;
  }).join("");
  const body = `<div class="vfr-list">${rows}</div>`;
  wrap.innerHTML = chartFrame(
    "Faculty of record — clips taught", "directional", _videoFacultySources(roll),
    D.subjectStrength ? D.subjectStrength.captured : "",
    body,
    {
      legend: `<span class="cf-key"><span class="lg-ramp" style="background:linear-gradient(90deg,var(--y1),var(--y5));width:34px"></span>more clips</span>`,
      note: "Who teaches this set — tap a name for their career timeline. Aggregate, community-sentiment, never a ranking of people.",
    });
  return wrap;
}

function drawVideoSidebar() {
  const wrap = $("#vbList"); if (!wrap) return; wrap.innerHTML = "";
  videoSubjects().forEach(s => {
    const ro = vidRollup(videosOf(s));
    const it = el("button", "sb-item" + (s === vSubject ? " on" : "")); it.dataset.vsubj = s;
    it.innerHTML = `<span class="sb-row1"><span class="sb-name">${esc(s)}</span></span>
      <span class="sb-row2">${meterHTML(ro.w, ro.total)}<span class="sb-mcq">${Math.round(ro.mins / 60)}h</span></span>`;
    wrap.appendChild(it);
  });
}

function drawVideoSubject() {
  const host = $("#vbContent"); if (!host) return; host.innerHTML = "";
  const vids = videosOf(vSubject);
  const ro = vidRollup(vids);
  const heading = $("#vHeading"); if (heading) heading.textContent = vSubject;
  const hs = $("#vHeadSub");
  if (hs) hs.innerHTML = `${vids.length} clips · ${ro.w} watched · ${Math.round(ro.mins / 60)}h ${epiDot("measured")}`;
  // ONE inset-grouped container, internal hairlines (NOT N floating cards)
  const list = el("div", "lgroup vlist");
  vids.forEach(vid => list.insertAdjacentHTML("beforeend", videoRow(vid)));
  host.appendChild(list);
}

/* a dense clip row — inset-grouped (.vrow lives inside one .lgroup), 48px band.
   Keeps the EXACT tracking hooks main.js delegates on: .vrow[data-vid] +
   .chip.a/.chip.r[data-vact]. Faculty-of-record chip → Faculty page (gated). */
function videoRow(vid) {
  const x = Store.video(vid.id);
  const sugg = videoSuggestions(vid).length;
  const facIds = vid.facultyIds || (vid.facultyId ? [vid.facultyId] : []);
  const fac = facIds.map(facById).filter(Boolean)[0];
  const facChip = fac
    ? `<a class="vfac echip is-link" data-go-faculty="${esc(fac.id)}" title="Faculty of record (directional) — ${esc(fac.name)}">${esc(fac.name)}</a>`
    : "";
  const meta = [
    vid.durMin != null ? `${vid.durMin} min` : "",
    `${confTag(vid.confidence)}${epiDot("proxy")}`,
    sugg ? `<span class="vsugg" data-open-video="${vid.id}">${sugg} linked</span>` : "",
  ].filter(Boolean).join(" · ");
  return `<div class="vrow lrow${x.w ? " done" : ""}" data-vid="${vid.id}">`
    + `<span class="vnum num">${vid.num}</span>`
    + `<div class="vmain">`
    + `<span class="vtopic" role="button" tabindex="0" data-open-video="${vid.id}" aria-label="Open ${esc(vid.topic)}">${esc(vid.topic)}</span>`
    + `<span class="vmeta">${meta}</span>`
    + (facChip ? `<span class="vfacline">${facChip}</span>` : "")
    + `</div>`
    + `<div class="chips">`
    + `<button class="chip a ${x.w ? "on" : ""}" data-vact="w" aria-pressed="${x.w ? "true" : "false"}" title="Watched">W</button>`
    + `<button class="chip r ${x.v ? "on" : ""}" data-vact="v" aria-pressed="${x.v ? "true" : "false"}" title="Revised">Rv</button>`
    + `</div>`
    + `</div>`;
}

function openVideoDrawer(id) {
  const vid = VID_BY_ID[id]; if (!vid) return;
  lastFocus = document.activeElement;
  const dr = $("#drawer"), body = $("#drawerBody");
  const x = Store.video(id);
  const sugg = videoSuggestions(vid, 8);
  const cc = BTR_CANON[vid.subject];
  const facIds = vid.facultyIds || (vid.facultyId ? [vid.facultyId] : []);
  const facs = facIds.map(facById).filter(Boolean);
  body.innerHTML = `
    <div class="dr-eyebrow"><span class="platlabel k">CoreBTR video</span> · ${esc(vid.subject)}${cc ? " · maps to " + esc(cc) : ""}</div>
    <h2 class="dr-title">${esc(vid.topic)}</h2>
    <div class="dr-facts">
      <span><b>#${vid.num}</b> in subject</span>
      ${vid.durMin != null ? `<span><b>${vid.durMin}</b> min</span>` : ""}
      <span>cut confidence ${confTag(vid.confidence)} ${epiDot("proxy")}</span>
    </div>
    <div class="dr-track">
      <span class="dr-lbl">Your status ${epiDot("measured")}</span>
      <div class="vchips big" data-vid="${id}">
        <button class="chip a ${x.w ? "on" : ""}" data-vdract="w" aria-pressed="${x.w ? "true" : "false"}" aria-label="Watched">Watched</button>
        <button class="chip r ${x.v ? "on" : ""}" data-vdract="v" aria-pressed="${x.v ? "true" : "false"}" aria-label="Revised">Revised</button>
      </div>
      <div class="muted small">File: ${esc(vid.file)}</div>
    </div>
    ${facs.length ? `<div class="dr-sec"><div class="dr-lbl">Faculty of record <span class="epi directional" title="directional — community-sourced career history">directional</span></div>
      <div class="echips">${facs.map(f => `<a class="echip is-link" data-go-faculty="${esc(f.id)}">${esc(f.name)}</a>`).join("")}</div></div>` : ""}
    <div class="dr-sec"><div class="dr-lbl">Question-bank modules this video likely covers <span class="epi proxy" title="proxy — matched by topic similarity, not a known coverage relation">proxy</span></div>
      <div class="muted small">Matched by topic similarity — not a verified coverage map.</div>
      ${sugg.length ? sugg.map(l => drLink(l)).join("") : `<div class="muted small">No close module match — try the command palette.</div>`}</div>
    <div class="dr-sec"><div class="dr-lbl">Related tests</div>
      ${cc ? relatedTests(cc).map(t => `<button class="dr-itemlink" data-goto-test="${esc(t.id)}"><span>${esc(t.name)}</span><span class="muted">${t.platform}</span></button>`).join("") || `<div class="muted small">—</div>` : `<div class="muted small">—</div>`}</div>`;
  dr.classList.add("open"); $("#drawerScrim").classList.add("open"); dr.setAttribute("aria-hidden", "false");
  setTimeout(() => $("#drawerClose").focus(), 30);
}

function syncVideoAfterToggle(id) {
  const vid = VID_BY_ID[id]; if (!vid) return;
  const sb = $(`#vbList .sb-item[data-vsubj="${cssEsc(vid.subject)}"]`);
  if (sb) { const ro = vidRollup(videosOf(vid.subject)); const m = $(".meter", sb); if (m) m.outerHTML = meterHTML(ro.w, ro.total); }
  // keep the subject sub-header count fresh when toggling within the open subject
  if (vid.subject === vSubject) {
    const ro = vidRollup(videosOf(vSubject)); const hs = $("#vHeadSub");
    if (hs) hs.innerHTML = `${ro.total} clips · ${ro.w} watched · ${Math.round(ro.mins / 60)}h ${epiDot("measured")}`;
  }
}
