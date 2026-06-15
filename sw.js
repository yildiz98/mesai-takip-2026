const CACHE_NAME = "mesai-pwa-mobile-v10-bottom-nav";
const FILES = [
  "./",
  "./index.html?v=10",
  "./app.js?v=10",
  "./manifest.json?v=10",
  "./icon.svg",
  "./polis-logo.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // HTML sayfaları ve JS dosyalarında önce ağı dene; böylece güncelleme hemen gelir.
  if (request.mode === "navigate" || request.destination === "script" || request.url.includes("index.html")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match("./index.html?v=10")))
    );
    return;
  }

  // Diğer dosyalarda cache, yoksa ağ.
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
      return response;
    }))
  );
});
