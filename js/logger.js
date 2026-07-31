/* HOSANA YOUTH TOOLS - logger.js
   Pelacakan error ringan. Dimuat PALING AWAL supaya menangkap error sedini
   mungkin (termasuk gagal muat gambar/script), lalu mengirim ke Firebase
   (node "/logs") begitu koneksi siap. Ada throttle + dedupe supaya tidak spam. */
(function () {
  var APP_VERSION = "3.9.2";
  var MAX_PER_SESSION = 30;
  var MIN_INTERVAL_MS = 800;
  var queue = [];
  var sent = 0;
  var lastAt = 0;
  var seen = {};
  var fb = null;
  var ctx = {};
  var ready = false;

  function nowIso() {
    try { return new Date().toISOString(); } catch (e) { return ""; }
  }
  function fingerprint(e) {
    return (e.type || "") + "|" + (e.message || "") + "|" + (e.source || "") + "|" + (e.line || "");
  }
  function base() {
    return {
      at: nowIso(),
      ts: Date.now(),
      url: (location && location.href) || "",
      ua: (navigator && navigator.userAgent) || "",
      online: navigator && typeof navigator.onLine === "boolean" ? navigator.onLine : null,
      version: ctx.version || APP_VERSION,
      uid: ctx.uid || null,
      admin: !!ctx.isAdmin,
      viewport: (window.innerWidth || 0) + "x" + (window.innerHeight || 0),
    };
  }
  function enqueue(ev) {
    if (sent >= MAX_PER_SESSION) return;
    var now = Date.now();
    var fp = fingerprint(ev);
    if (seen[fp] && now - seen[fp] < 10000) return;
    seen[fp] = now;
    var rec = base();
    for (var k in ev) if (ev.hasOwnProperty(k)) rec[k] = ev[k];
    queue.push(rec);
    flush();
  }
  function flush() {
    if (!ready || !fb) return;
    var now = Date.now();
    if (now - lastAt < MIN_INTERVAL_MS) {
      setTimeout(flush, MIN_INTERVAL_MS);
      return;
    }
    while (queue.length && sent < MAX_PER_SESSION) {
      var rec = queue.shift();
      lastAt = Date.now();
      sent++;
      try { fb.database().ref("logs").push(rec); } catch (e) {}
    }
  }

  window.addEventListener(
    "error",
    function (e) {
      if (e && e.target && (e.target.src || e.target.href) && !e.message) {
        enqueue({
          type: "resource",
          message: "Gagal memuat: " + (e.target.src || e.target.href),
          tag: (e.target.tagName || "").toLowerCase(),
        });
        return;
      }
      enqueue({
        type: "error",
        message: (e && e.message) || "Unknown error",
        source: (e && e.filename) || "",
        line: (e && e.lineno) || 0,
        col: (e && e.colno) || 0,
        stack: e && e.error && e.error.stack ? String(e.error.stack).slice(0, 1500) : "",
      });
    },
    true
  );
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    enqueue({
      type: "promise",
      message: (r && (r.message || String(r))) || "Unhandled rejection",
      stack: r && r.stack ? String(r.stack).slice(0, 1500) : "",
    });
  });

  window.PNWLog = {
    ready: function (firebaseNs, context) {
      fb = firebaseNs || (typeof firebase !== "undefined" ? firebase : null);
      if (context) for (var k in context) if (context.hasOwnProperty(k)) ctx[k] = context[k];
      ready = !!fb;
      flush();
    },
    setContext: function (context) {
      if (context) for (var k in context) if (context.hasOwnProperty(k)) ctx[k] = context[k];
    },
    event: function (type, data) {
      var ev = { type: type || "event" };
      if (typeof data === "string") ev.message = data;
      else if (data) for (var k in data) if (data.hasOwnProperty(k)) ev[k] = data[k];
      enqueue(ev);
    },
  };
})();
