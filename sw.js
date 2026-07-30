/* HOSANA YOUTH TOOLS - service worker
   PENTING: naikkan angka versi CACHE setiap deploy index.html baru
   supaya cache lama dibuang dan file terbaru dipakai. */
const CACHE = "pnw-tools-v46";
const APP_SHELL = ["./", "./index.html", "./privacy.html", "./terms.html", "./manifest.json", "./icon-192.png"];

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
  // v4.2.2 - JANGAN cegat permintaan lintas-asal (Google Fonts, CDN, Firebase,
  // YouTube). Dulu service worker mem-fetch ulang aset ini; fetch dari konteks
  // SW tunduk pada connect-src, sehingga font gstatic diblokir CSP lalu handler
  // mengembalikan undefined -> "Failed to convert value to 'Response'" dan
  // ERR_FAILED beruntun (ikut merusak long-polling Firebase). Biarkan browser
  // menanganinya langsung; aset pihak ketiga tetap punya cache HTTP sendiri.
  if (url.origin !== self.location.origin) return;
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
        .catch(() =>
          caches
            .match("./index.html")
            .then((r) => r || caches.match("./"))
            .then((r) => r || Response.error()),
        ),
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
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});
