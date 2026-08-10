/* PNW-FILE-GUIDE
   js/cf-health.js — OUTPUT RELIABILITY v101 (Sprint 2: S2-01..S2-05).
   Dua peran dalam satu service (dipilih dari URL):
     • OUTPUT (mode=display/stage): mengirim heartbeat tiap 2 dtk lewat
       BroadcastChannel (sama-browser, tanpa login) + best-effort Firebase
       node pujianYouth/youthviews/heartbeat (butuh rules v101).
       Signature slide diterima lewat event cf:output:rendered (dipancarkan
       yv-standalone.js setiap renderDisplay selesai).
     • OPERATOR: mengawasi heartbeat, menghitung status
       idle/connecting/connected/stale(>5d)/disconnected(>10d), menampilkan
       chip status di top bar, tombol reconnect, dan slide acknowledgement
       (membandingkan sig output dengan sig terakhir yang dikirim operator).
   Interval di file ini adalah service-owned watchdog (diizinkan aturan);
   modul lain dilarang menambah polling sendiri untuk hal yang sama.
   Dimuat SETELAH cf-kernel.js.
 */
(function () {
  "use strict";
  var K = window.CastFlowKernel;
  if (!K) return;
  if (!K.flags.get("outputHeartbeat", true)) return;

  var HB_MS = 2000;
  var FB_MS = 4000;
  var STALE_MS = 5000;
  var DEAD_MS = 10000;
  var CH = "castflow:v101:live";
  var HB_PATH = "pujianYouth/youthviews/heartbeat";

  var isOutput = /[?&]mode=(display|stage|youthviews|youth-views|views)/.test(location.search);
  var mode = /[?&]mode=stage/.test(location.search) ? "stage" : isOutput ? "display" : "operator";
  var bc = "BroadcastChannel" in window ? new BroadcastChannel(CH) : null;

  function sigOf(v) {
    if (!v || typeof v !== "object") return "idle";
    var si = typeof v.slideIndex === "number" ? v.slideIndex : -1;
    return [v.kind || "", v.songId || "", si].join("|");
  }

  /* ================= PENGIRIM (halaman output) ================= */
  var lastSig = "idle";
  var lastKind = "";
  var lastSlide = -1;
  var lastActive = false;
  window.addEventListener("cf:output:rendered", function (ev) {
    var d = (ev && ev.detail) || {};
    lastSig = d.sig || "idle";
    lastKind = d.kind || "";
    lastSlide = typeof d.slideIndex === "number" ? d.slideIndex : -1;
    lastActive = !!d.active;
    beat(true);
  });

  var hbRef = null;
  var fbAt = 0;
  var fbDenied = false;
  function fbRef() {
    if (fbDenied) return null;
    try {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        if (!hbRef) hbRef = firebase.database().ref(HB_PATH);
        return hbRef;
      }
    } catch (e) {}
    return null;
  }
  function payload() {
    return {
      type: "output:heartbeat",
      ts: Date.now(),
      sig: lastSig,
      kind: lastKind,
      slide: lastSlide,
      active: lastActive,
      mode: mode,
      v: K.LABEL,
    };
  }
  function beat(now) {
    var p = payload();
    if (bc) {
      try {
        bc.postMessage(p);
      } catch (e) {}
    }
    var r = fbRef();
    var n = Date.now();
    if (r && (now || n - fbAt >= FB_MS)) {
      fbAt = n;
      var rec = { ts: p.ts, sig: p.sig, kind: p.kind, slide: p.slide, mode: p.mode, v: p.v };
      try {
        Promise.resolve(r.set(rec)).catch(function (e) {
          if (!fbDenied) {
            fbDenied = true;
            try {
              if (window.PNWLog)
                PNWLog.warn("heartbeat cloud ditolak (rules v101 belum dipublish?)", {
                  error: String((e && e.code) || e),
                });
            } catch (e2) {}
          }
        });
      } catch (e) {}
    }
  }

  if (isOutput) {
    setInterval(function () {
      beat(false);
    }, HB_MS);
    beat(true);
    return; /* halaman output selesai di sini — sisa file ini milik operator */
  }

  /* ================= PENGAWAS (halaman operator) ================= */
  var bootAt = Date.now();
  var status = "idle";

  function onBeat(p) {
    if (!p || p.type !== "output:heartbeat") return;
    var prevSig = K.store.slice("connection").output.sig;
    K.store.set("connection", {
      output: {
        status: status,
        lastSeen: p.ts || Date.now(),
        sig: p.sig || "",
        kind: p.kind || "",
        slide: typeof p.slide === "number" ? p.slide : -1,
        mode: p.mode || "",
      },
    });
    K.bus.emit(K.Events.OUTPUT_HEARTBEAT, p);
    /* Slide acknowledgement: sig output == sig yang terakhir dikirim operator */
    var sent = K.store.slice("program").lastSentSig;
    if (p.sig && p.sig !== "idle" && sent && p.sig === sent && p.sig !== prevSig) {
      K.store.set("program", { lastAckSig: p.sig, ackAt: Date.now() });
      K.bus.emit(K.Events.OUTPUT_SLIDE_ACK, { sig: p.sig, at: Date.now() });
      paintChip();
    }
  }
  if (bc)
    bc.onmessage = function (ev) {
      onBeat(ev.data);
    };

  /* Listener Firebase (dipasang begitu SDK siap; retry terbatas, bukan polling liar) */
  var fbTries = 0;
  function attachFb() {
    fbTries++;
    try {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        firebase
          .database()
          .ref(HB_PATH)
          .on("value", function (s) {
            var v = s.val();
            if (v)
              onBeat({
                type: "output:heartbeat",
                ts: v.ts,
                sig: v.sig,
                kind: v.kind,
                slide: v.slide,
                mode: v.mode,
              });
          });
        return;
      }
    } catch (e) {}
    if (fbTries < 10) setTimeout(attachFb, 1000);
  }
  if (document.readyState === "complete") attachFb();
  else window.addEventListener("load", attachFb);

  /* Bungkus broadcast untuk mencatat sig terakhir yang dikirim (contract ack). */
  var wrapTries = 0;
  function wrapBroadcast() {
    wrapTries++;
    var E = window.PNWYouthViews;
    if (E && typeof E.broadcast === "function") {
      if (!E.broadcast.__cfWrapped) {
        var orig = E.broadcast;
        E.broadcast = function (p) {
          try {
            var sig = sigOf(p);
            K.store.set("program", { lastSentSig: sig, lastSentAt: Date.now() });
            K.bus.emit(K.Events.PROGRAM_GO_LIVE, { sig: sig });
            paintChip();
          } catch (e) {}
          return orig.apply(this, arguments);
        };
        E.broadcast.__cfWrapped = true;
      }
      return;
    }
    if (wrapTries < 20) setTimeout(wrapBroadcast, 500);
  }
  wrapBroadcast();

  /* ---------------- Chip status di top bar ---------------- */
  var chip = null;
  function buildChip() {
    var bar = document.getElementById("yvBar");
    if (!bar || document.getElementById("cfOutputChip")) return !!document.getElementById("cfOutputChip");
    chip = document.createElement("button");
    chip.type = "button";
    chip.id = "cfOutputChip";
    chip.className = "cfOutputChip";
    chip.setAttribute("data-status", "idle");
    chip.setAttribute("data-ack", "none");
    chip.innerHTML = '<span class="cfOutputDot" aria-hidden="true"></span><span class="cfOutputTxt">Output: Idle</span>';
    chip.title = "Output status — klik untuk reconnect";
    chip.addEventListener("click", reconnect);
    var avatar = document.getElementById("cfAvatarBtn");
    bar.insertBefore(chip, avatar || null);
    return true;
  }
  var chipTries = 0;
  (function ensureChip() {
    chipTries++;
    if (!buildChip() && chipTries < 40) setTimeout(ensureChip, 250);
  })();

  var LABELS = {
    idle: "Output: Idle",
    connecting: "Output: Connecting",
    connected: "Output: Connected",
    stale: "Output: Stale",
    disconnected: "Output: Offline",
    error: "Output: Error",
  };
  function paintChip() {
    if (!chip) chip = document.getElementById("cfOutputChip");
    if (!chip) return;
    chip.setAttribute("data-status", status);
    var ack = K.store.slice("program").lastAckSig ? "ok" : "none";
    chip.setAttribute("data-ack", ack);
    var txt = chip.querySelector(".cfOutputTxt");
    if (txt) txt.textContent = LABELS[status] || LABELS.idle;
    var o = K.store.slice("connection").output;
    var age = o.lastSeen ? Math.max(0, Math.round((Date.now() - o.lastSeen) / 1000)) + "s lalu" : "belum ada";
    chip.title =
      "Status: " + status + " · heartbeat: " + age + " · slide ack: " + (ack === "ok" ? "diterima" : "belum") + " — klik untuk reconnect";
  }

  function setStatus(next) {
    if (next === status) return;
    var prev = status;
    status = next;
    var o = K.store.slice("connection").output;
    o.status = next;
    K.store.set("connection", { output: o });
    paintChip();
    if (next === "connected") K.bus.emit(K.Events.OUTPUT_CONNECTED, { from: prev });
    if (next === "stale") K.bus.emit(K.Events.OUTPUT_STALE, { from: prev });
    if (next === "disconnected") {
      K.bus.emit(K.Events.OUTPUT_DISCONNECTED, { from: prev });
      try {
        if (window.PNWProjector && PNWProjector.__tl && PNWProjector.__tl.notify)
          PNWProjector.__tl.notify("Output terputus — cek jendela output / klik chip untuk reconnect.", "warn");
        if (window.PNWLog) PNWLog.warn("output disconnected", { from: prev });
      } catch (e) {}
    }
  }

  /* Watchdog status — satu-satunya interval milik service ini. */
  setInterval(function () {
    var o = K.store.slice("connection").output;
    var now = Date.now();
    if (!o.lastSeen) {
      setStatus(now - bootAt > DEAD_MS ? "disconnected" : now - bootAt > STALE_MS ? "connecting" : "idle");
      return;
    }
    var age = now - o.lastSeen;
    setStatus(age <= STALE_MS ? "connected" : age <= DEAD_MS ? "stale" : "disconnected");
  }, 1000);

  function reconnect() {
    K.bus.emit(K.Events.OUTPUT_RECONNECT, { at: Date.now() });
    try {
      var frame = document.getElementById("cfLiveFrame");
      if (frame) {
        var src = frame.getAttribute("src") || "./castflow.html?mode=display&embed=1";
        frame.setAttribute("src", src);
      }
      bootAt = Date.now();
      setStatus("connecting");
      if (window.PNWProjector && PNWProjector.__tl && PNWProjector.__tl.notify)
        PNWProjector.__tl.notify("Menyambung ulang output…", "info");
    } catch (e) {}
  }

  K.outputHealth = {
    status: function () {
      return status;
    },
    reconnect: reconnect,
    sigOf: sigOf,
  };
  paintChip();
})();
