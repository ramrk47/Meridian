/* Meridian service worker — installable shell, offline-capable.
   Network-first for same-origin GETs (always fresh online; cache is the
   offline fallback). The app is local-first, so a stale cache never loses
   user data — tracking lives in localStorage/IndexedDB via storage.js. */
const CACHE = "meridian-shell-v2";
const SHELL = [
  "./", "./index.html",
  "./css/tokens.css", "./css/components.css", "./css/charts.css",
  "./css/overview.css", "./css/qbank.css", "./css/progress.css",
  "./css/tests.css", "./css/hy.css", "./css/videos.css", "./css/planner.css",
  "./data.js", "./storage.js",
  "./js/core.js", "./js/ds.js",
  "./js/surfaces/overview.js", "./js/surfaces/qbank.js", "./js/surfaces/progress.js",
  "./js/surfaces/tests.js", "./js/surfaces/hy.js", "./js/surfaces/videos.js", "./js/surfaces/planner.js",
  "./js/entities/subject.js", "./js/entities/platform.js", "./js/entities/faculty.js",
  "./js/main.js",
  "./manifest.webmanifest", "./icon.svg",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return; // let cross-origin pass through
  e.respondWith(
    fetch(req)
      .then(resp => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return resp;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
