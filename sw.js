/* Keeps the artwork on the device so it isn't pulled down the website every
   time the app is opened. Deliberately narrow: it serves the images and icons
   from a cache and never touches anything else. The page itself always comes
   from the network, so the VERSION check in index.html still decides when a new
   build is picked up - a service worker holding the HTML would fight it.

   VERSION is stamped on deploy, the same way index.html is. Each build gets its
   own cache and the old ones are dropped, so a redrawn image arrives once and
   then stays put. */
const VERSION = "dev";
const CACHE = "zonk-" + VERSION;
const ASSETS = [
  "splash.webp", "ptf.webp", "colorcoded.webp", "rollout.webp", "cosmos.webp",
  "scoreb.webp",
  "og.jpg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      // one at a time: a single missing file shouldn't stop the rest being kept
      .then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if(e.request.method !== "GET" || url.origin !== location.origin) return;
  const name = url.pathname.split("/").pop();
  if(!ASSETS.includes(name)) return;      // everything else, the network decides

  // The page asks for these with ?v=<version> on the end; the cache is already
  // per-version, so the query is not what identifies them here.
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)
      .then(res => {
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        }
        return res;
      }))
  );
});
