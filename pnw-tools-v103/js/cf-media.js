/* PNW-FILE-GUIDE
   js/cf-media.js — MEDIA RESOLVER + MISSING ASSET CHECKER v102
   (Sprint 3: S3-04 + S3-05).
   Satu jalur resmi untuk mengubah referensi aset menjadi sumber nyata:
     • idb:<id>   -> PNWMedia (IndexedDB), dengan timeout + deteksi hilang.
     • http(s):/data:/blob: -> passthrough.
   Media yang gagal di-resolve dicatat (store + storage adapter) dan
   dipancarkan lewat event media:missing-detected, sehingga Preflight dan
   Importer bisa memperingatkan operator SEBELUM live.
   Kontrak: modul lain TIDAK boleh lagi memanggil PNWMedia.resolve langsung
   untuk kebutuhan baru — wajib lewat CastFlowKernel.media.resolve().
   Dimuat SETELAH cf-kernel.js.
 */
(function () {
  "use strict";
  var K = window.CastFlowKernel;
  if (!K) return;

  var MISSING_KEY = "media:missing";
  var missing = {}; /* ref -> true */
  (K.storage.get(MISSING_KEY, []) || []).forEach(function (r) {
    missing[r] = true;
  });
  function saveMissing() {
    K.storage.set(MISSING_KEY, Object.keys(missing));
  }
  function markMissing(ref) {
    if (missing[ref]) return;
    missing[ref] = true;
    saveMissing();
    K.bus.emit(K.Events.MEDIA_MISSING, { ids: [ref] });
  }
  function markResolved(ref) {
    if (!missing[ref]) return;
    delete missing[ref];
    saveMissing();
    K.bus.emit(K.Events.MEDIA_RESOLVED, { ref: ref });
  }

  function resolve(ref, timeoutMs) {
    var v = String(ref || "");
    if (!v) return Promise.resolve(null);
    if (v.indexOf("idb:") === 0) {
      if (!(window.PNWMedia && window.PNWMedia.resolve)) {
        markMissing(v);
        return Promise.resolve(null);
      }
      var settled = false;
      var timeout = new Promise(function (res) {
        setTimeout(function () {
          if (!settled) {
            settled = true;
            markMissing(v);
            res(null);
          }
        }, timeoutMs || 2000);
      });
      var attempt = PNWMedia.resolve(v)
        .then(function (u) {
          if (u) {
            if (!settled) {
              settled = true;
              markResolved(v);
            } else {
              /* resolve terlambat tetap menyembuhkan status (self-heal) */
              markResolved(v);
            }
            return u;
          }
          if (!settled) {
            settled = true;
            markMissing(v);
          }
          return null;
        })
        .catch(function () {
          if (!settled) {
            settled = true;
            markMissing(v);
          }
          return null;
        });
      return Promise.race([attempt, timeout]);
    }
    return Promise.resolve(v); /* http/data/blob passthrough */
  }

  /* Kumpulkan semua referensi idb: yang dipakai rundown saat ini. */
  function collectRefsFromPlan() {
    var out = [];
    try {
      var tl = window.PNWProjector && PNWProjector.__tl;
      var plan = tl && tl.plan ? tl.plan() || [] : [];
      plan.forEach(function (it) {
        var bg = it && it.bg;
        if (bg && typeof bg.value === "string" && bg.value.indexOf("idb:") === 0) out.push(bg.value);
        if (it && typeof it.media === "string" && it.media.indexOf("idb:") === 0) out.push(it.media);
      });
    } catch (e) {}
    return out;
  }

  function scanRefs(refs) {
    var miss = [];
    var chain = Promise.resolve();
    (refs || []).forEach(function (ref) {
      chain = chain.then(function () {
        return resolve(ref).then(function (u) {
          if (!u) miss.push(ref);
        });
      });
    });
    return chain.then(function () {
      if (miss.length) K.bus.emit(K.Events.MEDIA_MISSING, { ids: miss });
      return miss;
    });
  }
  function scanPlan() {
    return scanRefs(collectRefsFromPlan());
  }

  K.media = {
    resolve: resolve,
    scanPlan: scanPlan,
    scanRefs: scanRefs,
    collectRefsFromPlan: collectRefsFromPlan,
    listMissing: function () {
      return Object.keys(missing);
    },
    clearMissing: function () {
      missing = {};
      saveMissing();
    },
  };
})();
