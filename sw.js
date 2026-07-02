const CACHE_NAME = "mesai-pwa-mobile-v61-performance";
const FILES = [
  "./",
  "./index.html?v=61",
  "./app.js?v=61",
  "./firebase-mesai.js?v=61",
  "./manifest.json?v=61",
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

  // Firebase/Auth/Firestore istekleri ve POST istekleri cache'e alınmaz.
  // Böylece girişte "POST cache" hatası ve eski veri karışması engellenir.
  if (request.method !== "GET" ||
      request.url.includes("firestore.googleapis.com") ||
      request.url.includes("identitytoolkit.googleapis.com") ||
      request.url.includes("securetoken.googleapis.com") ||
      request.url.includes("googleapis.com")) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML ve JS dosyalarında önce ağı dene; güncelleme GitHub'dan hemen gelir.
  if (request.mode === "navigate" || request.destination === "script" || request.url.includes("index.html")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match("./index.html?v=61")))
    );
    return;
  }

  // Diğer statik dosyalarda cache, yoksa ağ.
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
      return response;
    }))
  );
});
