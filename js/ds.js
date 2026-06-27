/* ============================================================
   Calvetra — ds.js  (shared COMPONENT + CHART library)  ·  Stage 3b
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
   opts = [{v,label}] (or plain strings). tint ∈ ""|marrow|cere for active pill.
   A11y: these are CLICK-ONLY toggles (surface handlers swap a single panel), not
   ARIA tabs with tabpanels — so we use the conformant role="radiogroup"/role="radio"
   + aria-checked pattern (NOT role="tablist"/tab, which would promise tabpanels that
   don't exist). Roving tabindex (only the checked pill is in the tab order) + Arrow/
   Home/End navigation are added by the scoped installer below. */
function segmented(opts, current, name, tint = "") {
  const items = (opts || []).map(o => (typeof o === "string" ? { v: o, label: o } : o));
  return `<div class="seg ${tint} has-ind" role="radiogroup"${name ? ` data-seg="${esc(name)}"` : ""}>`
    + `<span class="seg-ind" aria-hidden="true"></span>`
    + items.map(o => { const on = o.v === current; return `<button type="button" role="radio" class="${on ? "on" : ""}" data-seg-v="${esc(o.v)}" aria-checked="${on}" tabindex="${on ? "0" : "-1"}">${esc(o.label)}</button>`; }).join("")
    + `</div>`;
}

/* §2.5c — shared SLIDING-INDICATOR machinery for EVERY segmented() group.
   The pill (.seg-ind) is the single moving element: one canonical placer slides it
   under the active radio on subject / qbank / tests / platform alike — no per-surface
   bespoke copy. It starts width:0 (invisible) until placed, so any surface that
   never wires it degrades cleanly; reduced-motion collapses the slide to an instant
   jump (CSS). Animates transform/opacity + width only (GPU); never blocks paint.
   - placeSegInd(seg, animate): seat the pill under button.on. animate=false
     suppresses the entrance slide (first paint / layout reflow) via a flush.
   - placeAllSegInds(scope): re-seat every indicator in scope (post-render / resize),
     always WITHOUT a slide — a layout change must not read as a deliberate move. */
function placeSegInd(seg, animate) {
  if (!seg) return;
  const ind = seg.querySelector(":scope > .seg-ind");
  const on = seg.querySelector("button.on");
  if (!ind || !on) return;
  if (!animate) ind.style.transition = "none";
  ind.style.setProperty("--seg-x", on.offsetLeft + "px");
  ind.style.width = on.offsetWidth + "px";
  if (!animate) { void ind.offsetWidth; ind.style.transition = ""; } // flush, then re-enable
}
function placeAllSegInds(scope) {
  const root = scope || document;
  if (!root.querySelectorAll) return;
  root.querySelectorAll(".seg.has-ind[data-seg]").forEach(s => placeSegInd(s, false));
}
/* Global wiring (attached once, at module load — ds.js loads before surfaces):
   - delegated click (capture) on any seg radio slides its indicator to the new pill.
     Purely visual + additive; each surface keeps its own selection handler, and the
     roving installer above keeps aria/tabindex in sync off the same .on class.
   - one resize listener re-seats every indicator (no per-render stacking).
   - a MutationObserver on #app (childList only, rAF-debounced) re-seats indicators
     after any surface re-render, so qbank/tests/platform/subject light up uniformly
     without touching motion.js or each surface. */
(function wireSegInds() {
  if (typeof document === "undefined" || !document.addEventListener) return;
  const appNode = () => ((typeof $ === "function" && $("#app")) || document.getElementById("app") || document);
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest('.seg.has-ind[data-seg] button[data-seg-v]');
    if (!b) return;
    const seg = b.closest(".seg.has-ind");
    // reflect active state for the placer, then slide. Idempotent + order-independent
    // with each surface's own .on toggling (capture runs first; a surface re-render,
    // if any, re-paints fresh markup that the observer then re-seats).
    seg.querySelectorAll("button[data-seg-v]").forEach(x => x.classList.toggle("on", x === b));
    placeSegInd(seg, true);
  }, true);
  let _segRAF = 0;
  const reseatAll = () => {
    if (typeof requestAnimationFrame !== "function") { placeAllSegInds(appNode()); return; }
    cancelAnimationFrame(_segRAF);
    _segRAF = requestAnimationFrame(() => placeAllSegInds(appNode()));
  };
  if (typeof window !== "undefined") window.addEventListener("resize", reseatAll);
  const start = () => {
    const app = appNode();
    if (app !== document && typeof MutationObserver !== "undefined") {
      new MutationObserver(reseatAll).observe(app, { childList: true, subtree: true });
    }
    placeAllSegInds(app);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

/* §2.5b roving keyboard nav for every segmented() group (scoped to ds.js).
   - Arrow/Home/End move focus across the radios (roving tabindex).
   - keeps aria-checked + tabindex in sync with the .on class even when a surface
     re-paints only .on (e.g. subject.js toggles .on without touching aria), so the
     announced state never drifts. Honors the surfaces' own click handlers — we only
     synthesize a .click() so their existing data-seg-v logic still fires. */
(function installSegRoving() {
  if (typeof document === "undefined") return;
  function sync(seg) {
    const btns = seg.querySelectorAll('button[role="radio"]');
    btns.forEach(b => { const on = b.classList.contains("on"); b.setAttribute("aria-checked", on ? "true" : "false"); b.setAttribute("tabindex", on ? "0" : "-1"); });
  }
  document.addEventListener("keydown", e => {
    const btn = e.target.closest && e.target.closest('.seg[role="radiogroup"] button[role="radio"]');
    if (!btn) return;
    const seg = btn.closest('.seg[role="radiogroup"]');
    const btns = Array.prototype.slice.call(seg.querySelectorAll('button[role="radio"]'));
    const i = btns.indexOf(btn);
    let j = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % btns.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + btns.length) % btns.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = btns.length - 1;
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); return; }
    else return;
    e.preventDefault();
    btns[j].focus();
    btns[j].click();          // surfaces' [data-seg-v] handler does the actual selection
  });
  // After any seg click (surface re-renders or in-place .on swap), realign aria/tabindex.
  document.addEventListener("click", e => {
    const btn = e.target.closest && e.target.closest('.seg[role="radiogroup"] button[role="radio"]');
    if (btn) requestAnimationFrame(() => { const seg = btn.closest('.seg[role="radiogroup"]'); if (seg) sync(seg); });
  });
})();

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

/* §2.9 emptyState({icon,title,body,action}) — THE shared "plate awaiting its
   engraving" primitive (spec §4). Replaces the ~7 bespoke per-surface stand-ins
   (hy/videos/qbank/platform/subject) so every empty plate shares ONE mark, copy
   rhythm, hairline + plate-mark treatment — the opposite of bespoke one-offs.
   - centered block on the --plate ground, engraved hairline + inner plate-mark
     inset rule (reuses the shipped `.empty.es-trail` CSS contract from overview).
   - ONE monochrome STROKE-ONLY inline-SVG mark in --line-2 — NEVER colour (keeps
     the neutrality firewall + warm-almanac identity; renders no fabricated data).
   - serif title (.es-title), --t-meta body (.es-body), optional linkbtn CTA (.es-cta).
   icon ∈ quill|ledger|film|compass|gauge (default quill).
   title = plain text. body = caller markup allowed (e.g. <b>filter name</b>).
   action = {label, act}  → act becomes data-act-ui (the qbEmpty CTA convention),
            or {label, attrs:'data-hy-clearstatus'} for a bespoke activation hook. */
const _ES_MARKS = {
  quill: `<path d="M20 4S8 6 5 15l4 4C18 16 20 4 20 4Z"/><path d="M5 19l3.5-3.5"/>`,
  ledger: `<path d="M12 6C9 4 5 4 3 5v14c2-1 6-1 9 1 3-2 7-2 9-1V5c-2-1-6-1-9 1Z"/><path d="M12 6v14"/>`,
  film: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 5v14M17 5v14"/>`,
  compass: `<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z"/>`,
  gauge: `<path d="M4 14a8 8 0 0 1 16 0"/><path d="M12 14l4-3"/><path d="M4 14h2M18 14h2M12 6v2"/>`,
};
function emptyState(o) {
  o = o || {};
  const glyph = _ES_MARKS[o.icon] || _ES_MARKS.quill;
  const mark = `<svg class="es-mark" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" `
    + `fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>`;
  let cta = "";
  if (o.action && o.action.label) {
    const a = o.action;
    const hook = a.attrs ? " " + a.attrs : (a.act ? ` data-act-ui="${esc(a.act)}"` : "");
    cta = `<button type="button" class="linkbtn es-cta"${hook}>${esc(a.label)}</button>`;
  }
  return `<div class="empty es-trail">${mark}`
    + `<div class="es-title">${esc(o.title || "Awaiting engraving")}</div>`
    + (o.body ? `<div class="es-body">${o.body}</div>` : "")
    + cta
    + `</div>`;
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
      // epistemic tag for this cell: measured count; ringed cells add a directional overlay.
      const epi = ringed ? "directional" : "measured";
      const ttl = `${esc(r.label)} · ${esc(c.label)}: ${has ? esc(fmt(d.raw)) + " MCQs (measured)" : "not covered"}${ringed ? " · community-reputed strongest (directional)" : ""}`;
      // data-read-plate routes taps to the already-wired readPlateSheet (main.js) so the
      // per-cell measured/directional firewall label is reachable on TOUCH (title= is hover-only);
      // data-hm-* + aria-label keep the custom .cf-tip + screen-reader paths working.
      return `<button type="button" class="hm-cell${has ? "" : " empty"}${ringed ? " ring" : ""}" style="${style}"`
        + ` data-hm-row="${esc(r.label)}" data-hm-col="${esc(c.label)}" data-hm-raw="${esc(String(d.raw == null ? "" : d.raw))}"`
        + ` data-hm-epi="${epi}" data-hm-disp="${has ? esc(fmt(d.raw)) + " MCQs" : "not covered"}"${ringed ? ' data-hm-ring="1"' : ""}`
        + ` data-read-plate="${epi}" aria-label="${ttl}"`
        + ` title="${ttl}">${disp}</button>`;
    }).join("");
    // role="link" + tabindex make the subject jump-affordance keyboard-reachable;
    // main.js's keydown handler already activates [data-go-subject] with role="link".
    const lbl = r.go ? `<a class="hm-rl is-link" role="link" tabindex="0"${_goAttr(r.go)}>${esc(r.label)}</a>` : `<span class="hm-rl">${esc(r.label)}</span>`;
    return `<div class="hm-row" style="grid-template-columns:${colTpl}">${lbl}${cells}</div>`;
  }).join("");
  // role="grid" + visually-hidden caption give AT users the matrix's identity & axes;
  // each cell already carries an aria-label (row · col · value + epistemic tag).
  const cap = `${rows.length} ${rows.length === 1 ? "subject" : "subjects"} × ${cols.length} ${cols.length === 1 ? "platform" : "platforms"} — MCQ density (measured count, proxy bucketing); a gold ring marks the community-reputed strongest (directional).`;
  return `<div class="heatmap${compact ? " compact" : ""}" role="grid" aria-label="${esc(cap)}">`
    + `<span class="vh" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0">${esc(cap)}</span>`
    + `${head}${body}</div>`;
}

/* §3.2 consensusMark(n, plats) — how many of the (independent) platforms agree HY (0..3).
   plats = [{id,on}] so each pip is OUTLINED in its platform color (WHICH agree) and the row
   fill deepens with conFill(n) (HOW MANY agree). glyph variant for list-row trailing slots. */
function consensusMark(n, plats, opts) {
  opts = opts || {};
  const total = plats ? plats.length : 3;
  const agree = (n == null && plats) ? plats.filter(p => p.on).length : (n || 0);
  // data-read-plate="proxy" routes a TAP to readPlateSheet so the "(proxy)" framing
  // — invisible in native title= on touch — stays reachable on mobile (neutrality firewall).
  if (opts.glyph) {
    const g = ["○", "◔", "◑", "●"][Math.max(0, Math.min(3, agree))];
    const t = `${agree} of ${total} platforms flag high-yield (proxy)`;
    return `<span class="cmark-glyph" role="button" tabindex="0" data-read-plate="proxy" aria-label="${t}" style="color:${conFill(agree)}" title="${t}">${g}</span>`;
  }
  const pips = (plats || Array.from({ length: total }, () => ({}))).map(p =>
    `<span class="cpip${p.on ? " on" : ""}" style="border-color:${p.id ? platColor(p.id) : 'var(--ink-4)'};background:${p.on ? conFill(agree) : 'transparent'}" title="${esc(p.id ? platName(p.id) : "platform")}${p.on ? " · flags HY" : ""}"></span>`
  ).join("");
  const ct = `${agree} of ${total} platforms flag this high-yield (proxy)`;
  return `<span class="cmark" role="button" tabindex="0" data-read-plate="proxy" aria-label="${ct}" title="${ct}">${pips}</span>`;
}

/* §3.1b cf-tip — ONE body-appended custom chart tooltip that replaces the hover-only,
   touch-invisible native title= on heatmap cells. Renders an almanac plate (row · col,
   value with its epiBadge, gold-ring directional note) positioned via GPU transform.
   TOUCH path is untouched: data-read-plate already routes a tap to readPlateSheet so the
   firewall context is reachable on mobile. Self-installing; honors prefers-reduced-motion
   (no fade) and feature-degrades silently. Scoped entirely to ds.js — no new main.js wiring. */
(function installCfTip() {
  if (typeof document === "undefined" || typeof matchMedia !== "function") return;
  // Hover-capable, fine-pointer only: touch devices use the data-read-plate tap path (sheet).
  if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  let tip = null, raf = 0, px = 0, py = 0;
  // Scoped almanac styling injected once (keeps the upgrade entirely within ds.js):
  // hairline + faint warm shadow plate, fixed-positioned, GPU transform, fade gated
  // behind prefers-reduced-motion so reduced-motion users get an instant (non-faded) tip.
  function ensureStyle() {
    if (document.getElementById("cf-tip-style")) return;
    const st = document.createElement("style");
    st.id = "cf-tip-style";
    st.textContent =
      ".cf-tip{position:fixed;top:0;left:0;z-index:90;max-width:230px;pointer-events:none;"
      + "background:var(--plate,var(--paper-2));border:1px solid var(--line);border-radius:9px;"
      + "padding:8px 10px;box-shadow:0 6px 20px -8px color-mix(in srgb,var(--ink) 26%,transparent),0 1px 0 var(--line);"
      + "display:flex;flex-direction:column;gap:3px;opacity:0;transition:opacity var(--d-2,180ms) var(--ease-soft,ease);"
      + "will-change:transform,opacity}"
      + ".cf-tip.on{opacity:1}"
      + ".cf-tip .cf-tip-head{font:600 11.5px/1.25 var(--sans);color:var(--ink-2);letter-spacing:.01em}"
      + ".cf-tip .cf-tip-x{color:var(--ink-4)}"
      + ".cf-tip .cf-tip-val{display:flex;align-items:center;gap:6px;font:600 13px var(--sans);color:var(--ink-1,var(--ink))}"
      + ".cf-tip .cf-tip-val .num{font-variant-numeric:tabular-nums}"
      + ".cf-tip .cf-tip-note{font:500 10.5px/1.3 var(--sans);color:var(--gold,var(--ink-3))}"
      + "@media (prefers-reduced-motion:reduce){.cf-tip{transition:none}}";
    document.head.appendChild(st);
  }
  function ensure() {
    if (tip) return tip;
    ensureStyle();
    tip = document.createElement("div");
    tip.className = "cf-tip";
    tip.setAttribute("role", "tooltip");
    tip.setAttribute("aria-hidden", "true");
    document.body.appendChild(tip);
    return tip;
  }
  function render(cell) {
    const row = cell.getAttribute("data-hm-row") || "";
    const col = cell.getAttribute("data-hm-col") || "";
    const disp = cell.getAttribute("data-hm-disp") || "";
    const epi = cell.getAttribute("data-hm-epi") || "measured";
    const ring = cell.getAttribute("data-hm-ring") === "1";
    const t = ensure();
    t.innerHTML =
      `<span class="cf-tip-head">${esc(row)} <span class="cf-tip-x">·</span> ${esc(col)}</span>`
      + `<span class="cf-tip-val"><b class="num">${esc(disp)}</b> ${epiBadge(epi)}</span>`
      + (ring ? `<span class="cf-tip-note">Gold ring = community-reputed strongest (directional)</span>` : "");
    t.classList.add("on");
    t.setAttribute("aria-hidden", "false");
  }
  function place() {
    raf = 0;
    if (!tip) return;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = px + 14, y = py + 16;
    if (x + w > innerWidth - 8) x = px - w - 14;
    if (y + h > innerHeight - 8) y = py - h - 16;
    tip.style.transform = `translate(${Math.max(8, x)}px,${Math.max(8, y)}px)`;
  }
  function hide() {
    if (!tip) return;
    tip.classList.remove("on");
    tip.setAttribute("aria-hidden", "true");
  }
  document.addEventListener("pointerover", e => {
    const cell = e.target.closest && e.target.closest(".hm-cell:not(.empty)");
    if (!cell) return;
    render(cell);
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(place);
  });
  document.addEventListener("pointermove", e => {
    if (!tip || !tip.classList.contains("on")) return;
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(place);
  });
  document.addEventListener("pointerout", e => {
    const cell = e.target.closest && e.target.closest(".hm-cell");
    if (cell) hide();
  });
  // Keyboard parity: focus a cell → show; blur → hide (positioned at the cell).
  document.addEventListener("focusin", e => {
    const cell = e.target.closest && e.target.closest(".hm-cell:not(.empty)");
    if (!cell) return;
    render(cell);
    const r = cell.getBoundingClientRect();
    px = r.left + r.width / 2; py = r.bottom;
    if (!raf) raf = requestAnimationFrame(place);
  });
  document.addEventListener("focusout", e => {
    if (e.target.closest && e.target.closest(".hm-cell")) hide();
  });
  // Keyboard activation for the consensus glyph/cmark (role=button spans): Enter/Space
  // synthesizes a click so the existing [data-read-plate] handler opens readPlateSheet.
  // Native <button> hm-cells already activate on their own; this covers the spans only.
  document.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const tgt = e.target;
    if (!tgt || !tgt.matches || !tgt.matches('.cmark[data-read-plate],.cmark-glyph[data-read-plate]')) return;
    e.preventDefault();
    tgt.click();
  });
  void reduce; // fade is gated in CSS via prefers-reduced-motion; flag retained for clarity
})();

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
    const lbl = i.go ? `<a class="rb-name is-link" role="link" tabindex="0"${_goAttr(i.go)}>${esc(i.label)}</a>` : `<span class="rb-name">${esc(i.label)}</span>`;
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
    const head = s.go ? `<a class="sm-l is-link" role="link" tabindex="0"${_goAttr(s.go)}>${esc(s.label)}</a>` : `<span class="sm-l">${esc(s.label)}</span>`;
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
    const nameHtml = integrated ? `<a class="ftl-org is-link" role="link" tabindex="0" data-go-platform="${esc(pid)}">${esc(name)}</a>` : `<span class="ftl-org off">${esc(name)}</span>`;
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
      ? `<a class="rs-name is-link" role="link" tabindex="0" data-go-platform="${esc(a.platformId)}" style="color:${platColor(a.platformId)}">${esc(a.name)}</a>`
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
