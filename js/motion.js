/* ============================================================
   motion.js — paper-soft motion helpers (shared seam, loads after ds.js,
   before the surfaces). Global scope; no import/export.
   Every function: feature-detects (View Transitions / IntersectionObserver),
   honors prefers-reduced-motion via the LIVE MOTION_OK() guard (do nothing /
   jump to final state), animates transform/opacity only, and is safe to call
   repeatedly (idempotent — a data-done flag + once-only IO prevent re-runs).
   Depends on: MOTION_OK, VT_OK (core.js), fmt (core.js).
   ============================================================ */

/* One shared IntersectionObserver for ALL entrance effects (reveal / count-up /
   chart intro). Created lazily; fires each target ONCE then unobserves, so an
   effect can never re-run on reflow / Store-toggle / re-render. */
let _io = null;
const _ioMap = new WeakMap(); // node → callback
function _ensureIO() {
  if (_io || typeof IntersectionObserver !== "function") return _io;
  _io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const node = en.target, fn = _ioMap.get(node);
      _io.unobserve(node); _ioMap.delete(node);
      if (fn) fn(node);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
  return _io;
}
/* internal: run fn(el) ONCE when el first becomes ~15% visible.
   Fallback (no IO support): run immediately. */
function observeOnce(el, fn) {
  if (!el || typeof fn !== "function") return;
  const io = _ensureIO();
  if (!io) { fn(el); return; }       // no IO → just run now (still once: caller guards data-done)
  _ioMap.set(el, fn);
  io.observe(el);
}

/* Wrap a DOM swap in a View Transition when supported + motion-ok; else run
   synchronously (today's exact behavior — the synchronous path IS the fallback).
   `swap` does the classList toggles + RENDER. Never throws if VT rejects. */
function viewTransition(swap) {
  if (typeof swap !== "function") return;
  if (VT_OK()) {
    try { document.startViewTransition(swap); }
    catch { swap(); }               // any VT failure → run the swap directly
  } else {
    swap();
  }
}

/* Scroll-reveal: a gentle rise+fade ONCE on entrance. `els` = NodeList/array of
   [data-reveal] nodes (typically panels / plates). Sets inline --i (capped at 4)
   for stagger; adds .in via the shared IO. Reduced-motion / no-IO → content is
   shown immediately at final state (never stuck invisible). A rAF fail-safe
   force-reveals anything still hidden after first paint. Idempotent (data-done). */
function reveal(els) {
  const list = els ? (els.length != null ? [...els] : [els]) : [];
  if (!list.length) return;
  if (!MOTION_OK()) { list.forEach(e => { e.classList.add("in"); e.dataset.revealDone = "1"; }); return; }
  list.forEach((e, i) => {
    if (e.dataset.revealDone) { e.classList.add("in"); return; } // already revealed; don't re-animate
    e.style.setProperty("--i", Math.min(i, 4));
    observeOnce(e, n => { n.classList.add("in"); n.dataset.revealDone = "1"; });
  });
  // fail-safe: force-reveal anything still hidden shortly after paint. Uses BOTH
  // a rAF (foreground) and a setTimeout (timers still run in a hidden/throttled
  // tab where rAF + IntersectionObserver are suspended) so [data-reveal] content
  // can NEVER be permanently stuck invisible.
  const flush = () => list.forEach(e => { if (!e.dataset.revealDone) { e.classList.add("in"); e.dataset.revealDone = "1"; } });
  requestAnimationFrame(() => requestAnimationFrame(flush));
  setTimeout(flush, 400);
}

/* Count-up on ONE numeric element. The element already carries its FINAL string
   as text and a data-count="<raw int>". Reduced-motion / no support → leave the
   final text untouched (no-op-but-correct). easeOutCubic over ~--d-3..--d-4;
   formats each frame through fmt() (en-IN grouping); snaps exactly to target on
   the last frame. Idempotent via data-done. */
function countUp(el) {
  if (!el) return;
  if (el.dataset.countDone) return;                 // already counted — never re-run
  const target = parseInt(el.dataset.count, 10);
  if (!isFinite(target)) return;                    // nothing numeric to animate
  el.dataset.countDone = "1";
  if (!MOTION_OK()) return;                          // leave the inline final text as-is
  const finalText = el.textContent;                 // preserve suffix/format if non-numeric
  observeOnce(el, node => {
    const dur = 560, t0 = performance.now();
    const ease = p => 1 - Math.pow(1 - p, 3);       // easeOutCubic
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      if (p >= 1) { node.textContent = finalText; return; }   // snap to original final string
      node.textContent = fmt(Math.round(target * ease(p)));
      requestAnimationFrame(step);
    };
    node.textContent = fmt(0);
    requestAnimationFrame(step);
  });
}

/* Chart entrance. `cframeEl` carries a chart (.cframe.plate or an svg/heatmap
   wrapper). Adds .is-in ONCE when visible to trigger the CSS keyframes (bars
   scaleX from baseline, heatmap cells stagger-fade via --i, sparkline draw-on).
   JS only sets the class + per-cell --i; ALL animation lives in css/charts.css,
   so the reduced-motion firewall collapses it. No-op final-state when !MOTION_OK
   (CSS already paints the final state without .is-in). Idempotent. */
function chartIntro(cframeEl) {
  if (!cframeEl) return;
  if (cframeEl.dataset.introDone) { cframeEl.classList.add("is-in"); return; }
  // stamp per-cell index for staggered heatmap fade (cap so a big grid never crawls)
  const cells = cframeEl.querySelectorAll(".hm-cell");
  cells.forEach((c, i) => { if (!c.style.getPropertyValue("--i")) c.style.setProperty("--i", Math.min(i, 12)); });
  if (!MOTION_OK()) { cframeEl.classList.add("is-in"); cframeEl.dataset.introDone = "1"; return; }
  observeOnce(cframeEl, node => { node.classList.add("is-in"); node.dataset.introDone = "1"; });
  // fail-safe (rAF + setTimeout): play/settle the entrance even if the chart
  // never scrolls into view OR the tab is hidden (charts are fully visible
  // WITHOUT .is-in, so this only adds the one-time entrance, never hides them).
  const settle = () => { if (!cframeEl.dataset.introDone) { cframeEl.classList.add("is-in"); cframeEl.dataset.introDone = "1"; } };
  requestAnimationFrame(() => requestAnimationFrame(settle));
  setTimeout(settle, 400);
}

/* Convenience: run reveal + chartIntro across a freshly-rendered view scope.
   Surfaces/main call this once AFTER renderX() so entrance fires at the right
   lifecycle point without re-animating on minor refresh (the once-only IO +
   data-done flags guarantee it). Safe to call repeatedly. */
function animateView(scope) {
  const root = scope || document;
  reveal(root.querySelectorAll("[data-reveal]"));
  root.querySelectorAll(".cframe.plate").forEach(chartIntro);
  const hero = root.querySelector(".tile.is-hero .tile-v[data-count], .hero-num[data-count]");
  if (hero) countUp(hero);
}
