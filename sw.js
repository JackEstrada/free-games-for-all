/* Offline support.
 * The site shell is network-first so updates show up right away; game files, Flash files,
 * thumbnails and Ruffle are cache-first, so any game you've opened once keeps working offline.
 * Bump VERSION when you change index.html, assets/ or flash.html.
 */
const VERSION = "v1";
const SHELL = "fgfa-shell-" + VERSION;
const GAMES = "fgfa-games";
const SHELL_FILES = [
  "./", "index.html", "flash.html", "manifest.webmanifest", "icon.svg",
  "assets/style.css", "assets/app.js", "assets/catalog.js", "assets/meta.js", "ruffle/ruffle.js",
];
const CACHE_FIRST = ["games/", "flash/", "thumbs/", "ruffle/"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("fgfa-shell-") && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const base = new URL("./", self.registration.scope).pathname;
  if (!url.pathname.startsWith(base)) return;
  const rel = url.pathname.slice(base.length);

  if (CACHE_FIRST.some((p) => rel.startsWith(p)) && rel !== "ruffle/ruffle.js") {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(GAMES).then((c) => c.put(req, copy));
        }
        return res;
      }))
    );
    return;
  }

  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html")))
  );
});
