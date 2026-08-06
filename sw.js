/* HOSANA YOUTH TOOLS - service worker
   PENTING: naikkan angka versi CACHE setiap deploy index.html baru
   supaya cache lama dibuang dan file terbaru dipakai. */
const CACHE = "pnw-tools-v62";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./css/styles.css",
  "./img/worship.jpg",
  "./img/praise.jpg",
  "./img/google.png",
  "./lottie.min.js",
  "./js/logger.js",
  "./js/animations.js",
  "./js/gsap/gsap.min.js",
  "./js/gsap/CustomEase.min.js",
  "./js/motion.js",
  "./js/recorder.js",
  "./js/app.js",
  "./js/logo-anim.js",
  "./js/hosana-flame.json",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => {})))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isHTML =
    req.mode === "navigate" ||
    req.destination === "document" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("index.html");

  // index.html / navigasi -> NETWORK-FIRST supaya update langsung terpakai
  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((c) => c.put("./index.html", copy))
            .catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./"))),
    );
    return;
  }

  // aset lain -> cache-first dengan revalidasi di belakang
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && url.origin === self.location.origin) {
            const copy = res.clone();
            caches
              .open(CACHE)
              .then((c) => c.put(req, copy))
              .catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
