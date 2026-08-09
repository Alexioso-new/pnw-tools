/* PNW-FILE-GUIDE
   sw.js — service worker (offline cache).
   WAJIB: naikkan angka CACHE setiap rilis, kalau tidak pengguna melihat versi lama.
   APP_SHELL harus selalu cocok dengan nama file asli di proyek.
   Terhubung: index.html (mendaftarkan SW).
 */

/* HOSANA YOUTH TOOLS - service worker
   PENTING: naikkan angka versi CACHE setiap deploy index.html baru
   supaya cache lama dibuang dan file terbaru dipakai. */
const CACHE = "pnw-tools-v89";
const APP_SHELL = [
  "./",
  "./index.html",
  "./youthviews.html",
  "./castflow.html",
  "./manifest.json",
  "./favicon.png",
  "./castflow-favicon.png",
  "./castflow-icon.png",
  "./castflow-logo.png",
  "./castflow-logo-light.png",
  "./castflow-logo.svg",
  "./castflow-logo-light.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./css/styles.css",
  "./css/design.css",
  "./css/yv-timeline.css",
  "./css/castflow.css",
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
  "./js/yv-motion.js",
  "./js/yv-standalone.js",
  "./js/yv-timeline.js",
  "./js/castflow.js",
  "./js/app.js",
  "./js/guide.js",
  "./js/projector.js",
  "./js/hosana-flame-data.js",
  "./js/logo-anim.js",
  "./js/presenter-logo-data.js",
  "./js/presenter-logo.js",
  "./js/stage-display.js",
  "./js/hosana-flame.json",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => {}))),
      ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
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

  // navigasi HTML -> NETWORK-FIRST supaya update langsung terpakai.
  // v81 PERBAIKAN: dulu SEMUA navigasi disimpan dengan kunci "./index.html",
  // apa pun URL aslinya. Akibatnya membuka youthviews.html menimpa cache
  // index.html (dan sebaliknya), sehingga saat offline halaman bisa tertukar.
  // Sekarang kunci cache mengikuti URL request yang sebenarnya.
  if (isHTML) {
    const shellKey = url.pathname.endsWith("/") ? "./index.html" : req.url;
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200 && url.origin === self.location.origin) {
            const copy = res.clone();
            caches
              .open(CACHE)
              .then((c) => c.put(shellKey, copy))
              .catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches
            .match(shellKey)
            .then((r) => r || caches.match("./index.html"))
            .then((r) => r || caches.match("./")),
        ),
    );
    return;
  }

  // aset lain -> cache-first dengan revalidasi di belakang
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (
            res &&
            res.status === 200 &&
            url.origin === self.location.origin
          ) {
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
