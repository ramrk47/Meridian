/* ============================================================
   Meridian — ds.js  (shared COMPONENT + CHART library)  ·  Stage 3b
   Loads after core.js, before surfaces/entities. Every function is a
   PURE function returning an HTML/SVG string (no DOM, no side effects),
   so it drops straight into the el()/innerHTML flow + appClick delegation.

   Charts live HERE (shared vocabulary) — surfaces + entity pages consume.
   The neutrality firewall is enforced at the component boundary:
   chartFrame() / panel() REQUIRE (epi, sourceIds) for curated data, so a
   viz cannot render without its epistemic label + source.

   Entity-link convention (matches main.js appClick):
     data-go-subject="<canon>" · data-go-platform="<id>" · data-go-faculty="<id>"
   ============================================================ */

/* ============================================================
   §1.1 COLOR-AS-DATA CONTRACT — the three canonical color helpers.
   No surface may invent a color; it asks one of these.
   (platColor lives in core.js — single canonical def, returns a var.)
   ============================================================ */
// magnitude 0..1 → nearest sequential step var (the density/yield ramp).
function yieldFill(t) { const n = Math.max(0, Math.min(5, Math.round((t || 0) * 5))); return `var(--y${n})`; }
// agreement count 0..3 → consensus ramp var.
function conFill(n) { return ['var(--con-none)', 'var(--con-one)', 'var(--con-two)', 'var(--con-all)'][Math.max(0, Math.min(3, n || 0))]; }
// ink color that stays legible on a given magnitude cell (dark cells flip to paper).
function yieldInk(t) { return (Math.round((t || 0) * 5) >= 3) ? 'var(--y-ink-hi)' : 'var(--y-ink-lo)'; }

/* small util: build the entity-link attribute for a router target ("subject:Surgery"…) */
function _goAttr(go) {
  if (!go) return "";
  const i = String(go).indexOf(":"); if (i < 0) return "";
  const kind = go.slice(0, i), val = go.slice(i + 1);
  if (kind === "subject") return ` data-go-subject="${esc(val)}"`;
  if (kind === "platform") return ` data-go-platform="${esc(val)}"`;
  if (kind === "faculty") return ` data-go-faculty="${esc(val)}"`;
  return "";
}

/* ============================================================
   §0  shared meters (kept live — qbank surface + sidebar + entity pages)
   ============================================================ */
function meterHTML(a, total, cls = "") {
  return `<span class="meter ${cls}"><span class="meter-bar"><i style="width:${pct(a, total)}%"></i></span><span class="meter-txt">${a}/${total}</span></span>`;
}
function bigMeter(ro) {
  return `<div class="bigmeter"><div class="bm-bar"><i style="width:${pct(ro.a, ro.total)}%"></i><b style="width:${pct(ro.r, ro.total)}%"></b></div>
    <div class="bm-key"><span><i class="k a"></i>${ro.a} attempted</span><span><i class="k r"></i>${ro.r} reviewed</span><span><i class="k t"></i>${ro.t} mastered</span></div></div>`;
}

/* ============================================================
   §2  COMPONENT PRIMITIVES
   ============================================================ */

/* §2.1 statTile({value,label,note,accent,spark,epi,go,hero})
   Compact KPI tile. `go` makes it a router link (the relational hook).
   accent ∈ m|c|k|g → leading categorical bar. hero → the ONE serif numeral. */
function statTile(opts) {
  // back-compat: positional (cls, big, lbl, note) still works for any legacy caller
  if (typeof opts === "string") opts = { accent: opts, value: arguments[1], label: arguments[2], note: arguments[3] };
  const o = opts || {};
  const tag = o.go ? "button" : "div";
  const cls = ["tile", o.accent || "", o.hero ? "is-hero" : "", o.go ? "is-link" : ""].filter(Boolean).join(" ");
  return `<${tag} class="${cls}"${_goAttr(o.go)}${o.go ? ' type="button"' : ""}>`
    + `<span class="tile-v num">${o.value == null ? "—" : o.value}</span>`
    + (o.label ? `<span class="tile-l">${o.label}</span>` : "")
    + (o.note ? `<span class="tile-n">${o.note}</span>` : "")
    + (o.spark ? `<span class="tile-spark">${o.spark}</span>` : "")
    + (o.epi ? `<i class="tile-epi">${epiDot(o.epi)}</i>` : "")
    + `</${tag}>`;
}

/* §2.2 listRow({lead,title,sub,trail,go,done}) + groupList(rows)
   The inset-grouped workhorse: ONE rounded container, internal hairlines
   (iOS feel) — NOT N floating cards. lead = pre-built glyph/dot/rank html. */
function listRow(o) {
  o = o || {};
  const tag = o.go ? "a" : "div";
  const cls = ["lrow", o.done ? "done" : "", o.go ? "is-link" : ""].filter(Boolean).join(" ");
  return `<${tag} class="${cls}"${_goAttr(o.go)}${o.go ? ' role="link" tabindex="0"' : ""}>`
    + (o.lead != null ? `<span class="lrow-lead">${o.lead}</span>` : "")
    + `<span class="lrow-main"><span class="lrow-title">${o.title || ""}</span>`
    + (o.sub ? `<span class="lrow-sub">${o.sub}</span>` : "")
    + `</span>`
    + (o.trail != null ? `<span class="lrow-trail">${o.trail}</span>` : "")
    + `</${tag}>`;
}
function groupList(rows, cls = "") {
  const body = (rows || []).filter(Boolean).join("");
  return `<div class="lgroup ${cls}">${body}</div>`;
}
/* a colored dot lead (platform identity / categorical) */
function dotLead(color) { return `<span class="lr-dot" style="--c:${color || 'var(--ink-3)'}"></span>`; }

/* §2.3 epiBadge (re-exported from core.js) + epiDot — 6px label-coded square for dense rows / tile corners. */
function epiDot(tag) {
  if (!tag) return "";
  return `<span class="epidot ${esc(tag)}" tabindex="0" role="note" aria-label="${esc(epiName(tag))} — ${esc(epiDesc(tag))}" title="${esc(epiName(tag))} — ${esc(epiDesc(tag))}"></span>`;
}

/* §2.5 segmented(opts,current,name) — generalize .seg.
   opts = [{v,label}] (or plain strings). tint ∈ ""|marrow|cere for active pill. */
function segmented(opts, current, name, tint = "") {
  const items = (opts || []).map(o => (typeof o === "string" ? { v: o, label: o } : o));
  return `<div class="seg ${tint}" role="tablist"${name ? ` data-seg="${esc(name)}"` : ""}>`
    + items.map(o => `<button type="button" role="tab" class="${o.v === current ? "on" : ""}" data-seg-v="${esc(o.v)}" aria-selected="${o.v === current}">${esc(o.label)}</button>`).join("")
    + `</div>`;
}

/* §2.7 panel({title,epi,sourceIds,captured,body,actions})
   Section container for non-chart content. epi+sourceIds MANDATORY when body
   holds curated data — firewall enforced at the boundary (warn in console). */
function panel(o) {
  o = o || {};
  if (o.curated && !o.epi) console.warn("panel(): curated body without epistemic tag —", o.title);
  return `<section class="panel">`
    + `<div class="ph"><div class="ph-l"><h3>${esc(o.title || "")}${o.epi ? " " + epiBadge(o.epi) : ""}</h3></div>`
    + (o.actions ? `<div class="ph-actions">${o.actions}</div>` : "")
    + `</div>`
    + (o.sourceIds && o.sourceIds.length ? srcLine(o.sourceIds, o.captured) : "")
    + `<div class="panel-body">${o.body || ""}</div>`
    + `</section>`;
}

/* ============================================================
   §2.8  chartFrame — THE ENGRAVED PLATE (keystone).
   EVERY chart passes through here. The signature makes it structurally
   impossible to render a viz without (epi, sourceIds, captured).
   Auto-incremented "Pl. N" via a per-call-site counter the caller owns;
   if no counter passed we use a module-global running number.
   ============================================================ */
let _plateSeq = 0;
function chartFrame(title, epi, sourceIds, captured, svgOrHtml, opts) {
  opts = opts || {};
  const no = opts.plateNo != null ? opts.plateNo : (++_plateSeq);
  const tapEpi = ` data-read-plate="${esc(epi || "")}" data-read-src="${esc((sourceIds || []).join(","))}" data-read-cap="${esc(captured || "")}"`;
  return `<figure class="cframe plate">`
    + `<figcaption class="cf-head">`
    + `<span class="plate-no">Pl. ${no}</span>`
    + `<span class="cf-title">${esc(title || "")}</span>`
    + (epi ? `<span class="cf-epi"${tapEpi}>${epiBadge(epi)}</span>` : "")
    + (opts.legend ? `<div class="cf-legend">${opts.legend}</div>` : "")
    + `</figcaption>`
    + `<div class="cf-plot">${svgOrHtml || ""}</div>`
    + (opts.note ? `<div class="cf-note">${opts.note}</div>` : "")
    + `<div class="cf-imprint">${srcLine(sourceIds || [], captured)}</div>`
    + `</figure>`;
}
/* reset the plate counter at the top of each renderX (so each surface starts at Pl. 1) */
function resetPlates() { _plateSeq = 0; }

/* §2.6 readPlateSheet(epi,srcIds,captured) — touch answer to hover tooltips.
   Opens the option sheet (from qbank surface) explaining the label + sources. */
function readPlateSheet(epi, srcIds, captured) {
  if (typeof openSheet !== "function") return;
  const ids = (typeof srcIds === "string") ? srcIds.split(",").filter(Boolean) : (srcIds || []);
  // openSheet expects [v, label] tuples (it destructures them)
  const opts = [["_epi", `${epiName(epi)} — ${epiDesc(epi)}`]]
    .concat(ids.map(id => [id, (SRC_BY_ID[id] ? (SRC_BY_ID[id].publisher || SRC_BY_ID[id].title) : id)]));
  openSheet("How we know this" + (captured ? ` · captured ${captured}` : ""), opts, "_epi", v => {
    const s = SRC_BY_ID[v]; if (s && /^https?:/.test(s.url || "")) window.open(s.url, "_blank", "noopener");
  });
}

/* §2.x bottomSheetOpt — a single sheet option row (used by openSheet bodies) */
function bottomSheetOpt(v, label, on) {
  return `<button class="sheet-opt ${on ? "on" : ""}" data-v="${esc(v)}">${esc(label)}${on ? ' <span class="tick">✓</span>' : ""}</button>`;
}

/* ============================================================
   §3  CHART VOCABULARY  (inline SVG / CSS-grid strings; var()-themed)
   Gridded discipline: faint --grid baselines + ticks + value labels so
   charts read as MEASUREMENTS, not illustrations. Numbers come from D.
   ============================================================ */

/* §3.1 heatmap(rows, cols, valueFn, opts) — Subject × Platform, the hero relational viz.
   rows = [{key,label,go?}]  cols = [{id,label,color}]  valueFn(rowKey,colId) → {v,raw,t}
     v   = display count (measured)   raw used for tooltip
     t   = 0..1 magnitude within the row (proxy bucketing) → yieldFill
   opts.ringFn(rowKey) → colId that gets the gold "community-strongest" ring (directional overlay)
   opts.compact (mobile) → initials + dot, sized to col count so it NEVER page-scrolls. */
function heatmap(rows, cols, valueFn, opts) {
  opts = opts || {};
  // Mobile auto-engages compact mode (initials M/C/D + color dot) so headers
  // NEVER mid-word truncate to "CEREBELL…"; callers needn't pass compact:true.
  const isMobile = (typeof matchMedia === "function") && matchMedia("(max-width:640px)").matches;
  const compact = !!opts.compact || isMobile;
  const colTpl = `120px repeat(${cols.length}, 1fr)`;
  const head = `<div class="hm-row hm-head" style="grid-template-columns:${colTpl}">`
    + `<span class="hm-corner"></span>`
    + cols.map(c => `<span class="hm-col" style="color:${c.color || platColor(c.id)}" title="${esc(c.label)}">${compact ? esc((c.label[0] || "?").toUpperCase()) : esc(c.label)}</span>`).join("")
    + `</div>`;
  const body = rows.map(r => {
    const ring = opts.ringFn ? opts.ringFn(r.key) : null;
    const cells = cols.map(c => {
      const d = valueFn(r.key, c.id) || {};
      const has = d.raw != null && d.raw > 0;
      const t = d.t || 0;
      const ringed = ring && ring === c.id;
      const style = has ? `background:${yieldFill(t)};color:${yieldInk(t)}` : "";
      const disp = !has ? "" : (compact ? `<span class="hm-dot"></span>` : `<span class="hm-v">${esc(String(d.v == null ? "" : d.v))}</span>`);
      return `<button type="button" class="hm-cell${has ? "" : " empty"}${ringed ? " ring" : ""}" style="${style}"`
        + ` data-hm-row="${esc(r.label)}" data-hm-col="${esc(c.label)}" data-hm-raw="${esc(String(d.raw == null ? "" : d.raw))}"`
        + ` title="${esc(r.label)} · ${esc(c.label)}: ${has ? esc(fmt(d.raw)) + " MCQs (measured)" : "not covered"}${ringed ? " · community-reputed strongest (directional)" : ""}">${disp}</button>`;
    }).join("");
    const lbl = r.go ? `<a class="hm-rl is-link"${_goAttr(r.go)}>${esc(r.label)}</a>` : `<span class="hm-rl">${esc(r.label)}</span>`;
    return `<div class="hm-row" style="grid-template-columns:${colTpl}">${lbl}${cells}</div>`;
  }).join("");
  return `<div class="heatmap${compact ? " compact" : ""}">${head}${body}</div>`;
}

/* §3.2 consensusMark(n, plats) — how many of the (independent) platforms agree HY (0..3).
   plats = [{id,on}] so each pip is OUTLINED in its platform color (WHICH agree) and the row
   fill deepens with conFill(n) (HOW MANY agree). glyph variant for list-row trailing slots. */
function consensusMark(n, plats, opts) {
  opts = opts || {};
  const total = plats ? plats.length : 3;
  const agree = (n == null && plats) ? plats.filter(p => p.on).length : (n || 0);
  if (opts.glyph) {
    const g = ["○", "◔", "◑", "●"][Math.max(0, Math.min(3, agree))];
    return `<span class="cmark-glyph" style="color:${conFill(agree)}" title="${agree} of ${total} platforms flag high-yield (proxy)">${g}</span>`;
  }
  const pips = (plats || Array.from({ length: total }, () => ({}))).map(p =>
    `<span class="cpip${p.on ? " on" : ""}" style="border-color:${p.id ? platColor(p.id) : 'var(--ink-4)'};background:${p.on ? conFill(agree) : 'transparent'}" title="${esc(p.id ? platName(p.id) : "platform")}${p.on ? " · flags HY" : ""}"></span>`
  ).join("");
  return `<span class="cmark" title="${agree} of ${total} platforms flag this high-yield (proxy)">${pips}</span>`;
}

/* §3.3 rankedBars(items, opts) — mass / where-to-spend (horizontal, mobile-safe).
   items = [{label,value,t?,colorFn?,go?,sub?}]  opts.colorFn(item) overrides; default yieldFill(t).
   Gridded: --grid baseline + right-aligned tabular value. Generalizes .bars/.barrow. */
function rankedBars(items, opts) {
  opts = opts || {};
  const list = (items || []).slice().sort((a, b) => (opts.nosort ? 0 : (b.value - a.value)));
  const mx = Math.max(1, ...list.map(i => i.value || 0));
  return `<div class="rbars">` + list.map(i => {
    const w = Math.max(2, Math.round((i.value || 0) / mx * 100));
    const fill = opts.colorFn ? opts.colorFn(i) : (i.color || yieldFill(i.t != null ? i.t : (i.value || 0) / mx));
    const lbl = i.go ? `<a class="rb-name is-link"${_goAttr(i.go)}>${esc(i.label)}</a>` : `<span class="rb-name">${esc(i.label)}</span>`;
    return `<div class="rbrow">${lbl}`
      + `<span class="rb-track"><i class="rb-bar" style="width:${w}%;background:${fill}"></i>`
      + (i.mark != null ? `<span class="rb-mark">${i.mark}</span>` : "")
      + `</span>`
      + `<span class="rb-val num">${i.value == null ? "—" : fmt(i.value)}</span></div>`;
  }).join("") + `</div>`;
}

/* §3.3 treemap(items) — desktop ≥1024 ONLY (auto-degrades to rankedBars on mobile).
   Squarified-ish slice/dice by mass, filled yieldFill. items = [{label,value,go?}]. */
function treemap(items, opts) {
  opts = opts || {};
  const list = (items || []).filter(i => i.value > 0).slice().sort((a, b) => b.value - a.value);
  const total = list.reduce((a, i) => a + i.value, 0) || 1;
  const W = 1000, H = 560;
  // simple slice-and-dice: alternate split direction, proportional to remaining mass
  const rects = []; let x = 0, y = 0, w = W, h = H, horiz = true;
  list.forEach((it, idx) => {
    const frac = it.value / list.slice(idx).reduce((a, i) => a + i.value, 0);
    let rw, rh;
    if (idx === list.length - 1) { rw = w; rh = h; }
    else if (horiz) { rw = Math.round(w * frac); rh = h; }
    else { rw = w; rh = Math.round(h * frac); }
    const t = it.value / (list[0].value || 1);
    rects.push({ x, y, w: rw, h: rh, it, t });
    if (idx < list.length - 1) {
      if (horiz) { x += rw; w -= rw; } else { y += rh; h -= rh; }
      horiz = !horiz;
    }
  });
  const tiles = rects.map(r => {
    const big = r.w > 120 && r.h > 46;
    const ink = yieldInk(r.t);
    const lbl = big ? `<text x="${r.x + 10}" y="${r.y + 22}" class="tm-l" fill="${ink}">${esc(r.it.label)}</text>`
      + `<text x="${r.x + 10}" y="${r.y + 40}" class="tm-v" fill="${ink}">${esc(fmt(r.it.value))}</text>` : "";
    return `<g class="tm-tile${r.it.go ? " is-link" : ""}"${r.it.go ? _goAttr(r.it.go) : ""}>`
      + `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="3" fill="${yieldFill(r.t)}" stroke="var(--plate)" stroke-width="2"><title>${esc(r.it.label)}: ${esc(fmt(r.it.value))}</title></rect>${lbl}</g>`;
  }).join("");
  return `<svg class="treemap" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">${tiles}</svg>`;
}

/* §3.4 sparkline(series) — a single metric over time. series = [{x?,y,label?}] (y required).
   Gridded: faint baseline, last-point dot, min/max ticks. Single point → dot + caption. */
function sparkline(series, opts) {
  opts = opts || {};
  const pts = (series || []).filter(p => p && p.y != null);
  const W = opts.w || 240, H = opts.h || 56, pad = 6;
  if (!pts.length) return `<svg class="spark" viewBox="0 0 ${W} ${H}"></svg>`;
  const ys = pts.map(p => p.y), mn = Math.min(...ys), mx = Math.max(...ys), rng = (mx - mn) || 1;
  const X = i => pts.length === 1 ? W / 2 : pad + i * (W - 2 * pad) / (pts.length - 1);
  const Y = v => H - pad - (v - mn) / rng * (H - 2 * pad);
  const base = `<line class="spk-base" x1="0" y1="${H - pad}" x2="${W}" y2="${H - pad}"/>`;
  if (pts.length === 1) {
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" role="img">${base}<circle class="spk-dot" cx="${W / 2}" cy="${Y(pts[0].y)}" r="3.5"/>`
      + `<text class="spk-cap" x="${W / 2}" y="${H - 1}" text-anchor="middle">1 ${esc(opts.unit || "point")}</text></svg>`;
  }
  const poly = pts.map((p, i) => `${X(i)},${Y(p.y)}`).join(" ");
  const last = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" role="img" preserveAspectRatio="none">`
    + base
    + `<polyline class="spk-line" points="${poly}"/>`
    + `<circle class="spk-dot" cx="${X(pts.length - 1)}" cy="${Y(last.y)}" r="3"/>`
    + `<text class="spk-tick" x="2" y="10">${esc(String(mx))}</text>`
    + `<text class="spk-tick" x="2" y="${H - pad - 2}">${esc(String(mn))}</text>`
    + `</svg>`;
}

/* §3.4 smallMultiples(seriesByKey) — grid of tiny sparklines, one per key.
   seriesByKey = [{key,label,series,go?,value?}]. The Progress hero. */
function smallMultiples(seriesByKey, opts) {
  opts = opts || {};
  return `<div class="smgrid">` + (seriesByKey || []).map(s => {
    const head = s.go ? `<a class="sm-l is-link"${_goAttr(s.go)}>${esc(s.label)}</a>` : `<span class="sm-l">${esc(s.label)}</span>`;
    return `<div class="sm-cell">${head}`
      + (s.value != null ? `<span class="sm-v num">${esc(String(s.value))}</span>` : "")
      + sparkline(s.series, { w: 120, h: 34, unit: opts.unit }) + `</div>`;
  }).join("") + `</div>`;
}

/* §3.5 facultyTimeline(faculty) — Career timeline, the un-buildable-by-incumbents viz.
   affiliations[] colored by platform (WHO) + status-styled (WHEN): current solid/capped,
   past muted, solo/superspecialty gold-edged. Vertical (reuses .timeline feel). Each node
   links to its Platform page (when platformId real). Gated: empty → honest note. */
function facultyTimeline(faculty) {
  const affs = (faculty && faculty.affiliations) || [];
  if (!affs.length) return `<div class="empty small">No sourced career history yet (directional seed).</div>`;
  // order by from-year (unknowns sort to top as "ongoing/undated")
  const yr = a => a.from ? parseInt(a.from, 10) : (a.status === "current" ? 9999 : 0);
  const sorted = affs.slice().sort((a, b) => yr(a) - yr(b));
  return `<ol class="ftl">` + sorted.map(a => {
    const pid = a.platformId;
    const integrated = pid && PLAT_BY_ID[pid];
    const color = integrated ? platColor(pid) : (pid ? platColor(pid) : "var(--ink-3)");
    // integrated → its name; reputation-only id → friendly name; else the affiliation's own name / Independent
    const name = integrated ? platName(pid) : (pid ? platDisplayName(pid) : (a.name || "Independent"));
    const span = `${a.from ? esc(a.from) + (a.fromApproximate ? "≈" : "") : "—"} → ${a.to ? esc(a.to) : (a.status === "current" ? "now" : "—")}`;
    const nameHtml = integrated ? `<a class="ftl-org is-link" data-go-platform="${esc(pid)}">${esc(name)}</a>` : `<span class="ftl-org off">${esc(name)}</span>`;
    return `<li class="ftl-item st-${esc(a.status || "past")}">`
      + `<span class="ftl-node" style="--c:${color}"></span>`
      + `<div class="ftl-body">`
      + `<div class="ftl-top">${nameHtml}<span class="ftl-status">${esc(a.status || "")}</span></div>`
      + `<div class="ftl-role">${esc(a.role || "")}</div>`
      + `<div class="ftl-span num">${span}</div>`
      + (a.subjects && a.subjects.length ? `<div class="ftl-subs">${a.subjects.map(s => `<span class="echip" data-go-subject="${esc(canon(s))}">${esc(canon(s))}</span>`).join("")}</div>` : "")
      + `</div></li>`;
  }).join("") + `</ol>`;
}

/* §3.6 ratingScorecard(data, mode) — neutral rating scorecard.
   mode "reliability": data = D.reliability.apps[] → star-meter + numeric + themes (warn = 6px DOT).
   mode "faculty":     data = faculty.ratings → gated profile votes + rolled-up per-platform video rating.
   Aggregate-only; NEVER a "worst faculty" board. */
function _starMeter(score, max = 5) {
  const filled = Math.round((score || 0));
  let pips = "";
  for (let i = 1; i <= max; i++) pips += `<span class="star ${i <= filled ? "on" : ""}"></span>`;
  return `<span class="starmeter" aria-label="${score == null ? "no rating" : score + " of " + max}">${pips}</span>`;
}
function ratingScorecard(data, mode) {
  if (mode === "faculty") {
    const r = (data && (data.profile || data.videoByPlatform)) ? data : {};
    const prof = r.profile || {};
    const profRow = `<div class="rs-row faculty">`
      + `<span class="rs-name">Community profile rating</span>`
      + `<span class="rs-meter">${_starMeter(prof.score)}<span class="rs-num num">${prof.score == null ? "—" : prof.score}</span></span>`
      + `<span class="rs-note">${prof.score == null ? "verified voting opens with accounts" : (prof.count + " votes")}` + (prof.verifiedVia ? ` <span class="echip off">${esc(prof.verifiedVia)}</span>` : "") + `</span>`
      + `</div>`;
    const vids = (r.videoByPlatform || []).map(v =>
      `<div class="rs-row faculty">`
      + `<span class="rs-name">${esc(platName(v.platformId))} video rating</span>`
      + `<span class="rs-meter">${_starMeter(v.avg)}<span class="rs-num num">${v.avg == null ? "—" : v.avg}</span></span>`
      + `<span class="rs-note">${v.n ? v.n + " videos" : "rolled up — seed"}</span></div>`).join("");
    return `<div class="scorecard">${profRow}${vids}</div>`;
  }
  // reliability mode
  const apps = data || [];
  return `<div class="scorecard">` + apps.map(a => {
    const nm = a.platformId && PLAT_BY_ID[a.platformId]
      ? `<a class="rs-name is-link" data-go-platform="${esc(a.platformId)}" style="color:${platColor(a.platformId)}">${esc(a.name)}</a>`
      : `<span class="rs-name off" title="not yet integrated">${esc(a.name)}</span>`;
    const num = (a.ratingApprox ? "~" : "") + (a.rating == null ? "—" : a.rating);
    const themes = (a.themes || []).map(t => `<span class="theme-chip"><span class="wdot"></span>${esc(t)}</span>`).join("");
    return `<div class="rs-row reli">`
      + `<span class="rs-app">${nm}</span>`
      + `<span class="rs-meter">${_starMeter(a.rating)}<span class="rs-num num">${num}</span></span>`
      + (a.ratingsLabel ? `<span class="rs-cnt num">${esc(a.ratingsLabel)}</span>` : "")
      + (a.sourceId ? `<span class="rs-src">${srcLink(a.sourceId)}</span>` : "")
      + (themes ? `<span class="rs-themes">${themes}</span>` : "")
      + `</div>`;
  }).join("") + `</div>`;
}
