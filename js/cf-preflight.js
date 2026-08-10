/* PNW-FILE-GUIDE
   js/cf-preflight.js — PREFLIGHT CHECK v101 (Sprint 2: S2-04 + S3-05 dasar).
   Pemeriksaan sebelum live (06_QA_CHECKLIST §3): storage, network, Firebase
   SDK, auth/role, tulis-rules (probe ke node heartbeat), output heartbeat,
   font utama, dan media hilang (resolve idb: pada rundown).
   Hasil mengikuti schema 02_TECH_SPEC §13: {status, checks[], generatedAt}.
   Masuk lewat menu Avatar -> "Preflight Check", atau CastFlowKernel.preflight.
   Visibilitas modal memakai kelas .on (BUKAN atribut hidden — pelajaran v81).
   Dimuat SETELAH cf-kernel.js dan cf-health.js.
 */
(function () {
  "use strict";
  var K = window.CastFlowKernel;
  if (!K) return;

  var overlay = null;
  var listEl = null;
  var summaryEl = null;
  var running = false;

  /* ---------------- util ---------------- */
  function wait(ms) {
    return new Promise(function (res) {
      setTimeout(res, ms);
    });
  }
  function worst(checks) {
    var w = "pass";
    checks.forEach(function (c) {
      if (c.status === "fail") w = "fail";
      else if (c.status === "warn" && w !== "fail") w = "warn";
    });
    return w;
  }
  function db() {
    try {
      if (window.firebase && firebase.apps && firebase.apps.length) return firebase.database();
    } catch (e) {}
    return null;
  }

  /* ---------------- daftar pemeriksaan ---------------- */
  function checkStorage() {
    try {
      K.storage.set("diagnostics:probe", { t: Date.now() });
      var ok = !!(K.storage.get("diagnostics:probe", null) || {}).t;
      K.storage.remove("diagnostics:probe");
      return { id: "storage", status: ok ? "pass" : "fail", message: ok ? "Storage adapter OK" : "Storage adapter gagal menulis" };
    } catch (e) {
      return { id: "storage", status: "fail", message: "Storage error: " + e };
    }
  }
  function checkNetwork() {
    return navigator.onLine
      ? { id: "network", status: "pass", message: "Jaringan online" }
      : { id: "network", status: "warn", message: "Offline — fitur cloud nonaktif, output lokal tetap jalan" };
  }
  function checkFirebase() {
    return db()
      ? { id: "firebase", status: "pass", message: "Firebase SDK termuat" }
      : { id: "firebase", status: "warn", message: "Firebase SDK belum siap (offline?) — cek koneksi" };
  }
  function checkAuth() {
    try {
      var u = firebase.auth().currentUser;
      if (u) return { id: "auth", status: "pass", message: "Login sebagai " + (u.email || u.uid) };
      return { id: "auth", status: "warn", message: "Belum login — mode view-only, Go Live butuh admin" };
    } catch (e) {
      return { id: "auth", status: "warn", message: "Auth belum siap: " + e };
    }
  }
  function checkRules() {
    var d = db();
    if (!d) return Promise.resolve({ id: "rules", status: "warn", message: "Dilewati — Firebase offline" });
    return d
      .ref("pujianYouth/youthviews/heartbeat")
      .set({ ts: Date.now(), sig: "preflight-probe", kind: "", slide: -1, mode: "probe", v: K.LABEL })
      .then(function () {
        return { id: "rules", status: "pass", message: "Rules OK — heartbeat node bisa ditulis" };
      })
      .catch(function (e) {
        var denied = /PERMISSION_DENIED/i.test(String((e && e.code) || e));
        return {
          id: "rules",
          status: "fail",
          message: denied
            ? "PERMISSION_DENIED — publish database.rules.json v101 (lihat CARA-PASANG-RULES-v101.txt)"
            : "Tulis rules gagal: " + e,
        };
      });
  }
  function checkOutput() {
    var o = K.store.slice("connection").output;
    if (o.status === "connected") return { id: "output", status: "pass", message: "Output terhubung (heartbeat aktif)" };
    if (o.status === "stale") return { id: "output", status: "warn", message: "Heartbeat output lambat (>5 dtk)" };
    return { id: "output", status: "fail", message: "Output belum terhubung — buka jendela Output atau Preview Live" };
  }
  function checkFonts() {
    try {
      var ok = document.fonts && document.fonts.check('12px "TikTok Sans"');
      return ok
        ? { id: "fonts", status: "pass", message: "TikTok Sans termuat" }
        : { id: "fonts", status: "warn", message: "TikTok Sans belum termuat — fallback sistem dipakai" };
    } catch (e) {
      return { id: "fonts", status: "warn", message: "Font check tidak tersedia" };
    }
  }
  function checkMedia() {
    try {
      var tl = window.PNWProjector && PNWProjector.__tl;
      if (!tl || typeof tl.plan !== "function")
        return Promise.resolve({ id: "media", status: "warn", message: "Rundown belum terbaca" });
      var plan = tl.plan() || [];
      var ids = [];
      plan.forEach(function (it) {
        var bg = it && it.bg;
        var v = bg && bg.value;
        if (typeof v === "string" && v.indexOf("idb:") === 0) ids.push(v.slice(4));
      });
      if (!ids.length) return Promise.resolve({ id: "media", status: "pass", message: "Tidak ada media lokal di rundown" });
      if (!window.PNWMedia || !PNWMedia.resolve)
        return Promise.resolve({ id: "media", status: "warn", message: "PNWMedia tidak tersedia" });
      var missing = [];
      var chain = Promise.resolve();
      ids.forEach(function (id) {
        chain = chain.then(function () {
          return Promise.race([PNWMedia.resolve("idb:" + id).then(function () { return true; }), wait(1500).then(function () { return false; })])
            .then(function (ok) {
              if (!ok) missing.push(id);
            })
            .catch(function () {
              missing.push(id);
            });
        });
      });
      return chain.then(function () {
        if (missing.length) {
          K.bus.emit(K.Events.MEDIA_MISSING, { ids: missing });
          return { id: "media", status: "warn", message: missing.length + " media hilang dari IndexedDB (id: " + missing.slice(0, 3).join(", ") + (missing.length > 3 ? "…" : "") + ")" };
        }
        return { id: "media", status: "pass", message: ids.length + " media lokal ter-resolve" };
      });
    } catch (e) {
      return Promise.resolve({ id: "media", status: "warn", message: "Media check error: " + e });
    }
  }
  var CHECKS = [checkStorage, checkNetwork, checkFirebase, checkAuth, checkRules, checkOutput, checkFonts, checkMedia];

  /* ---------------- UI modal ---------------- */
  function buildUi() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.id = "cfPreflightOverlay";
    overlay.className = "cfPreflightOverlay";
    overlay.innerHTML =
      '<div class="cfPreflightPanel" role="dialog" aria-modal="true" aria-labelledby="cfPreflightTitle">' +
      '<div class="cfPreflightHead"><h3 id="cfPreflightTitle">Preflight Check</h3>' +
      '<button type="button" class="cfPreflightX" id="cfPreflightClose" aria-label="Close">×</button></div>' +
      '<p class="cfPreflightHint">Jalankan sebelum ibadah dimulai. Fail berarti harus diperbaiki dulu.</p>' +
      '<div class="cfPreflightList" id="cfPreflightList"></div>' +
      '<div class="cfPreflightSummary" id="cfPreflightSummary"></div>' +
      '<div class="cfPreflightFoot"><button type="button" class="cfPreflightBtn" id="cfPreflightRun">Run again</button>' +
      '<button type="button" class="cfPreflightBtn primary" id="cfPreflightOk">Done</button></div>' +
      "</div>";
    document.body.appendChild(overlay);
    listEl = overlay.querySelector("#cfPreflightList");
    summaryEl = overlay.querySelector("#cfPreflightSummary");
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    overlay.querySelector("#cfPreflightClose").addEventListener("click", close);
    overlay.querySelector("#cfPreflightOk").addEventListener("click", close);
    overlay.querySelector("#cfPreflightRun").addEventListener("click", run);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("on")) close();
    });
  }
  function open() {
    buildUi();
    overlay.classList.add("on");
    run();
  }
  function close() {
    if (overlay) overlay.classList.remove("on");
  }
  function paintRows(rows) {
    if (!listEl) return;
    listEl.innerHTML = rows
      .map(function (r) {
        return (
          '<div class="cfPreflightRow" data-status="' +
          r.status +
          '"><span class="cfPreflightBadge">' +
          r.status.toUpperCase() +
          '</span><span class="cfPreflightName">' +
          r.id +
          '</span><span class="cfPreflightMsg">' +
          r.message +
          "</span></div>"
        );
      })
      .join("");
  }

  function run() {
    if (running) return;
    running = true;
    buildUi();
    K.bus.emit(K.Events.PREFLIGHT_STARTED, { at: Date.now() });
    var rows = CHECKS.map(function (c, i) {
      return { id: "check-" + (i + 1), status: "warn", message: "memeriksa…" };
    });
    paintRows(rows);
    if (summaryEl) summaryEl.textContent = "Running…";
    var results = [];
    var chain = Promise.resolve();
    CHECKS.forEach(function (fn, i) {
      chain = chain
        .then(function () {
          return Promise.resolve()
            .then(fn)
            .catch(function (e) {
              return { id: "check-" + (i + 1), status: "fail", message: "crash: " + e };
            });
        })
        .then(function (r) {
          results.push(r);
          rows[i] = r;
          paintRows(rows);
        });
    });
    chain.then(function () {
      var result = { status: worst(results), checks: results, generatedAt: new Date().toISOString() };
      K.store.set("diagnostics", { preflight: result });
      K.storage.set("diagnostics:lastPreflight", result);
      K.bus.emit(K.Events.PREFLIGHT_FINISHED, result);
      if (summaryEl) {
        summaryEl.setAttribute("data-status", result.status);
        summaryEl.textContent =
          "Result: " + result.status.toUpperCase() + " — " + results.filter(function (r) { return r.status === "pass"; }).length + "/" + results.length + " pass";
      }
      running = false;
    });
  }

  /* ---------------- pintu masuk: menu Avatar ---------------- */
  var menuTries = 0;
  function addMenuItem() {
    menuTries++;
    var menu = document.getElementById("cfUserMenu");
    if (menu) {
      if (!document.getElementById("cfPreflightItem")) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "cfUserItem";
        b.id = "cfPreflightItem";
        b.textContent = "Preflight Check";
        b.addEventListener("click", function () {
          menu.hidden = true;
          open();
        });
        menu.appendChild(b);
      }
      return;
    }
    if (menuTries < 40) setTimeout(addMenuItem, 500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addMenuItem);
  else addMenuItem();

  K.preflight = { open: open, run: run, close: close };
})();
