const CACHE_NAME = "rosbots-5572-scouting-v3.001";

// Everything the app needs to run with ZERO network connection.
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./match-data.js",
  "./vendor/bootstrap.min.css",
  "./vendor/qrcode.min.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Cache-first for everything in our own app. For anything else (e.g. the
// Google Form submission, YouTube embed, or field-layout images still
// pointed at ibb.co) we try the network but silently fail if there's no
// connection — the app must never break just because those don't load.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // Cross-origin (Google Form POST, YouTube, ibb.co images): network first,
  // but never let a failure surface as a broken page.
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
