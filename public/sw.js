// Al-Furqan service worker: makes the app installable and gives it an offline page.
// It deliberately stores no Quran or other API content: Quran.Foundation's terms limit caching its content
// to one week, and all /api responses stay network-only. Only build assets (hashed, immutable) are cached.
const VERSION = "af-sw-v1";
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }));
    return;
  }
  if (request.mode === "navigate") {
    // Redirect rather than serve the offline page under the requested address, so the app shell renders it as itself.
    event.respondWith(fetch(request).catch(async () => url.pathname === OFFLINE_URL ? (await caches.match(OFFLINE_URL)) ?? Response.error() : Response.redirect(OFFLINE_URL, 302)));
  }
});
