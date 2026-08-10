/* PNW-FILE-GUIDE
   js/logger.js — window.PNWLog, pencatat error & diagnostik (v85).
   Dimuat PALING AWAL (defer) di index.html & youthviews.html supaya
   menangkap error sedini mungkin. Dipanggil juga oleh js/app.js,
   js/recorder.js, js/yv-standalone.js.

   v85 — Log Error & Diagnostik:
   1. Menangkap: error JS, unhandledrejection, gagal muat resource,
      console.error / console.warn, event "yv:sendError", panggilan manual.
   2. Ring buffer LOKAL di localStorage "pnwErrorLog.v1" (maks 250 entri)
      -> log selamat walau offline atau Firebase menolak.
   3. Panel penampil PNWLog.open(): filter level, pencarian, stack yang
      bisa dibentangkan, Salin / Unduh .txt / Bersihkan.
   4. Badge merah pada elemen .pnwLogBadge = jumlah error sejak panel
      terakhir dibuka.
   5. Tetap mengirim ke Firebase node "/logs" (throttle + dedupe), dan bisa
      MEMBACA balik log cloud semua perangkat (khusus admin, bila rules
      mengizinkan).
   Tombol #openLogBtn (menu aplikasi) & #yvLogBtn (bar CastFlow)
   terpasang otomatis. Tombol keyboard L = buka/tutup panel (berguna di
   layar output yang tanpa tombol).
*/
(function () {
  "use strict";

  var FALLBACK_VERSION = "v9.3";
  var STORE_KEY = "pnwErrorLog.v1";
  var OPEN_KEY = "pnwErrorLog.lastOpenAt";
  var MAX_LOCAL = 250;
  var MAX_BYTES = 160000;
  var MAX_PER_SESSION = 30;
  var MIN_INTERVAL_MS = 800;
  var MERGE_MS = 60000;

  var entries = [];
  var queue = [];
  var sent = 0;
  var lastAt = 0;
  var seen = {};
  var fb = null;
  var ctx = {};
  var readyCloud = false;
  var persistTimer = null;
  var overlay = null;
  var isOpen = false;
  var curFilter = "all";
  var curQuery = "";
  var cloudRows = null;
  var cloudMsg = "";
  var inConsole = false;

  /* ---------------- util ---------------- */
  function nowIso() {
    try {
      return new Date().toISOString();
    } catch (e) {
      return "";
    }
  }
  function pad2(n) {
    return n < 10 ? "0" + n : "" + n;
  }
  function fmtClock(ts) {
    try {
      var d = new Date(ts);
      return pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
    } catch (e) {
      return "";
    }
  }
  function safeStr(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    try {
      return String(v);
    } catch (e) {
      return "?";
    }
  }
  function safeJson(v) {
    try {
      return JSON.stringify(v, null, 1);
    } catch (e) {
      return safeStr(v);
    }
  }
  function pageName() {
    try {
      var p = location.pathname || "";
      var pg = p.indexOf("youthviews") >= 0 ? "youthviews" : "index";
      if (/[?&]mode=(display|youthviews|youth-views|views)/.test(location.search || ""))
        pg += ":output";
      else if (/[?&]mode=stage/.test(location.search || "")) pg += ":stage";
      return pg;
    } catch (e) {
      return "?";
    }
  }
  function domVersion() {
    try {
      var el = document.getElementById("appVer");
      var t = el ? el.textContent : "";
      var m = /v[\d.]+/.exec(t || "");
      return m ? m[0] : "";
    } catch (e) {
      return "";
    }
  }
  function resolveVersion() {
    return domVersion() || ctx.version || FALLBACK_VERSION;
  }

  /* ---------------- penyimpanan lokal ---------------- */
  function loadLocal() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var v = raw ? JSON.parse(raw) : [];
      if (Array.isArray(v)) entries = v.slice(-MAX_LOCAL);
    } catch (e) {
      entries = [];
    }
  }
  function persistNow() {
    try {
      var s = JSON.stringify(entries);
      while (s.length > MAX_BYTES && entries.length > 10) {
        entries.splice(0, Math.max(5, (entries.length / 10) | 0));
        s = JSON.stringify(entries);
      }
      localStorage.setItem(STORE_KEY, s);
    } catch (e) {}
  }
  function schedulePersist() {
    if (persistTimer) return;
    persistTimer = setTimeout(function () {
      persistTimer = null;
      persistNow();
    }, 400);
  }

  /* ---------------- inti pencatatan ---------------- */
  function fingerprint(e) {
    return (
      (e.lvl || "") +
      "|" +
      (e.type || "") +
      "|" +
      (e.message || "") +
      "|" +
      (e.source || "") +
      "|" +
      (e.line || "")
    );
  }
  function base() {
    return {
      at: nowIso(),
      ts: Date.now(),
      lvl: "info",
      page: pageName(),
      version: resolveVersion(),
      url: (location && location.href) || "",
      viewport: (window.innerWidth || 0) + "x" + (window.innerHeight || 0),
      online:
        navigator && typeof navigator.onLine === "boolean" ? navigator.onLine : null,
    };
  }
  function enqueue(ev) {
    var rec = base();
    for (var k in ev) if (ev.hasOwnProperty(k)) rec[k] = ev[k];
    if (!rec.lvl) rec.lvl = "info";
    rec.message = safeStr(rec.message).slice(0, 600);
    rec.stack = safeStr(rec.stack).slice(0, 1500);

    /* gabungkan entri identik yang berulang dalam 60 detik (count++) */
    var fp = fingerprint(rec);
    var last = entries.length ? entries[entries.length - 1] : null;
    if (last && fingerprint(last) === fp && rec.ts - (last.ts || 0) < MERGE_MS) {
      last.count = (last.count || 1) + 1;
      last.ts = rec.ts;
      last.at = rec.at;
    } else {
      rec.count = 1;
      entries.push(rec);
      if (entries.length > MAX_LOCAL) entries.splice(0, entries.length - MAX_LOCAL);
    }
    schedulePersist();
    badgeUpdate();

    /* antrean cloud: dedupe 10 dtk + batas 30 per sesi (perilaku lama) */
    if (sent < MAX_PER_SESSION) {
      var now = Date.now();
      if (!(seen[fp] && now - seen[fp] < 10000)) {
        seen[fp] = now;
        var c = {};
        for (var k2 in rec) if (rec.hasOwnProperty(k2)) c[k2] = rec[k2];
        c.uid = ctx.uid || null;
        c.admin = !!ctx.isAdmin;
        c.ua = (navigator && navigator.userAgent) || "";
        queue.push(c);
        flush();
      }
    }
  }
  function flush() {
    if (!readyCloud || !fb) return;
    var now = Date.now();
    if (now - lastAt < MIN_INTERVAL_MS) {
      setTimeout(flush, MIN_INTERVAL_MS);
      return;
    }
    while (queue.length && sent < MAX_PER_SESSION) {
      var rec = queue.shift();
      lastAt = Date.now();
      sent++;
      try {
        fb.database().ref("logs").push(rec);
      } catch (e) {}
    }
  }

  /* ---------------- penangkap global ---------------- */
  window.addEventListener(
    "error",
    function (e) {
      try {
        if (e && e.target && (e.target.src || e.target.href) && !e.message) {
          enqueue({
            lvl: "error",
            type: "resource",
            message: "Gagal memuat: " + (e.target.src || e.target.href),
            source: (e.target.tagName || "").toLowerCase(),
          });
          return;
        }
        enqueue({
          lvl: "error",
          type: "error",
          message: (e && e.message) || "Unknown error",
          source: (e && e.filename) || "",
          line: (e && e.lineno) || 0,
          col: (e && e.colno) || 0,
          stack: e && e.error && e.error.stack ? String(e.error.stack) : "",
        });
      } catch (x) {}
    },
    true,
  );
  window.addEventListener("unhandledrejection", function (e) {
    try {
      var r = e && e.reason;
      enqueue({
        lvl: "error",
        type: "promise",
        message: (r && (r.message || String(r))) || "Unhandled rejection",
        stack: r && r.stack ? String(r.stack) : "",
      });
    } catch (x) {}
  });

  /* v85: tangkap console.error / console.warn. SDK Firebase melaporkan
     PERMISSION_DENIED lewat console — sekarang ikut tercatat tanpa perlu
     mengubah js/app.js. */
  function wrapConsole(method, lvl) {
    try {
      var orig = console[method];
      if (typeof orig !== "function") return;
      console[method] = function () {
        try {
          if (!inConsole) {
            inConsole = true;
            var parts = [];
            for (var i = 0; i < arguments.length; i++) {
              var a = arguments[i];
              parts.push(
                typeof a === "string" ? a : a && a.message ? safeStr(a.message) : safeJson(a),
              );
            }
            inConsole = false;
            enqueue({
              lvl: lvl,
              type: "console." + (method === "error" ? "error" : "warn"),
              message: parts.join(" "),
            });
          }
        } catch (x) {
          inConsole = false;
        }
        return orig.apply(console, arguments);
      };
    } catch (e) {}
  }
  wrapConsole("error", "error");
  wrapConsole("warn", "warn");

  /* v85: kanal siaran CastFlow menolak -> tercatat otomatis. */
  try {
    document.addEventListener("yv:sendError", function (e) {
      enqueue({
        lvl: "error",
        type: "yv:sendError",
        message:
          "Siaran/aksi Firebase ditolak server: " +
          safeStr(e && e.detail) +
          " — publish rules v83 / cek login admin.",
      });
    });
  } catch (e) {}

  window.addEventListener("pagehide", function () {
    persistNow();
  });

  /* ---------------- badge jumlah error ---------------- */
  function lastOpenAt() {
    try {
      return parseInt(localStorage.getItem(OPEN_KEY) || "0", 10) || 0;
    } catch (e) {
      return 0;
    }
  }
  function unreadErrors() {
    var since = lastOpenAt();
    var n = 0;
    for (var i = 0; i < entries.length; i++)
      if (entries[i].lvl === "error" && (entries[i].ts || 0) > since)
        n += entries[i].count || 1;
    return n;
  }
  function badgeUpdate() {
    try {
      var n = unreadErrors();
      var els = document.querySelectorAll(".pnwLogBadge");
      for (var i = 0; i < els.length; i++) {
        els[i].textContent = n > 99 ? "99+" : String(n);
        els[i].hidden = n <= 0;
      }
    } catch (e) {}
  }

  /* ---------------- CSS panel (scoped, disuntik sendiri) ---------------- */
  var CSS = [
    "#pnwLogOverlay{position:fixed;inset:0;z-index:200000;display:none;align-items:center;justify-content:center;background:rgba(3,5,10,.72);backdrop-filter:blur(4px);padding:14px;box-sizing:border-box;}",
    "#pnwLogOverlay.on{display:flex;}",
    "#pnwLogOverlay *{box-sizing:border-box;}",
    ".pnwLogPanel{width:min(760px,100%);max-height:88vh;display:flex;flex-direction:column;background:#0b0e14;border:1px solid #2a3348;border-radius:12px;color:#e8edf7;font:500 13px/1.45 Inter,system-ui,sans-serif;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.55);}",
    ".pnwLogHead{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #2a3348;background:#111621;}",
    ".pnwLogHead b{font-size:14px;}",
    ".pnwLogMeta{flex:1;color:#94a3bc;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".pnwLogX{appearance:none;border:1px solid #2a3348;background:#1f2637;color:#e8edf7;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:14px;line-height:1;}",
    ".pnwLogTools{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 14px 6px;}",
    ".pnwLogChip{appearance:none;border:1px solid #2a3348;background:#111621;color:#94a3bc;border-radius:999px;padding:4px 11px;cursor:pointer;font:600 11px/1.4 Inter,system-ui,sans-serif;}",
    ".pnwLogChip.on{background:#1f2637;color:#e8edf7;border-color:#3b9eff;}",
    ".pnwLogChip .n{opacity:.7;font-weight:500;}",
    ".pnwLogSearch{flex:1;min-width:130px;background:#111621;border:1px solid #2a3348;color:#e8edf7;border-radius:8px;padding:6px 10px;font:500 12px/1.3 Inter,system-ui,sans-serif;}",
    ".pnwLogStats{padding:0 14px 6px;color:#6b7c99;font-size:11px;}",
    ".pnwLogList{flex:1;overflow-y:auto;padding:0 14px 8px;min-height:120px;}",
    ".pnwLogRow{border:1px solid #232c40;border-left:3px solid #6b7c99;border-radius:8px;margin:6px 0;background:#111621;cursor:pointer;}",
    ".pnwLogRow.lvl-error{border-left-color:#f87171;}",
    ".pnwLogRow.lvl-warn{border-left-color:#fbbf24;}",
    ".pnwLogRow.lvl-info{border-left-color:#38bdf8;}",
    ".pnwLogRowTop{display:flex;align-items:baseline;gap:8px;padding:8px 10px;}",
    ".pnwLogTime{color:#6b7c99;font:500 11px/1.4 'JetBrains Mono',ui-monospace,monospace;flex:none;}",
    ".pnwLogLvl{flex:none;font:700 9px/1.6 Inter,system-ui,sans-serif;letter-spacing:.4px;border-radius:4px;padding:1px 6px;}",
    ".lvl-error .pnwLogLvl{background:rgba(248,113,113,.14);color:#f87171;}",
    ".lvl-warn .pnwLogLvl{background:rgba(251,191,36,.14);color:#fbbf24;}",
    ".lvl-info .pnwLogLvl,.lvl-event .pnwLogLvl{background:rgba(56,189,248,.14);color:#38bdf8;}",
    ".pnwLogType{color:#6b7c99;font-size:10px;flex:none;}",
    ".pnwLogMsg{flex:1;word-break:break-word;}",
    ".pnwLogCount{flex:none;color:#fbbf24;font-size:10px;}",
    ".pnwLogDetail{display:none;padding:0 10px 9px;border-top:1px dashed #232c40;}",
    ".pnwLogRow.open .pnwLogDetail{display:block;}",
    ".pnwLogDetail pre{margin:7px 0 0;padding:8px;background:#070a10;border:1px solid #1a2233;border-radius:6px;color:#94a3bc;font:500 11px/1.5 'JetBrains Mono',ui-monospace,monospace;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow:auto;}",
    ".pnwLogSrc{color:#6b7c99;font-size:11px;margin-top:7px;display:block;}",
    ".pnwLogEmpty{padding:26px 10px;text-align:center;color:#6b7c99;}",
    ".pnwLogCloud{border-top:1px solid #2a3348;padding:8px 14px;}",
    ".pnwLogCloudHead{display:flex;align-items:center;gap:8px;}",
    ".pnwLogCloudHead b{font-size:12px;flex:1;}",
    ".pnwLogCloudMsg{color:#94a3bc;font-size:11px;margin-top:6px;}",
    ".pnwLogCloudList{max-height:170px;overflow-y:auto;margin-top:6px;}",
    ".pnwLogDev{color:#34d399;font-size:10px;flex:none;font-family:'JetBrains Mono',ui-monospace,monospace;}",
    ".pnwLogFoot{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 14px;border-top:1px solid #2a3348;background:#111621;}",
    ".pnwLogBtn{appearance:none;border:1px solid #2a3348;background:#1f2637;color:#e8edf7;border-radius:8px;padding:7px 13px;cursor:pointer;font:600 12px/1 Inter,system-ui,sans-serif;}",
    ".pnwLogBtn:hover{background:#252d40;}",
    ".pnwLogBtn.primary{background:#3b9eff;border-color:#3b9eff;color:#04121f;}",
    ".pnwLogBtn.danger{color:#f87171;}",
    ".pnwLogHint{flex:1;min-width:140px;color:#6b7c99;font-size:10.5px;}",
    ".pnwLogBadge{background:#f87171;color:#04121f;border-radius:999px;padding:1px 7px;font:700 10px/1.6 Inter,system-ui,sans-serif;margin-left:2px;}",
    "@media (max-width:560px){.pnwLogPanel{max-height:94vh;}.pnwLogMeta{display:none;}}",
  ].join("\n");
  function injectCss() {
    try {
      if (document.getElementById("pnwLogCss")) return;
      var st = document.createElement("style");
      st.id = "pnwLogCss";
      st.textContent = CSS;
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
  }

  /* ---------------- panel penampil ---------------- */
  function el(tag, cls, text) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (text != null) d.textContent = text;
    return d;
  }
  function lvlLabel(lvl) {
    return lvl === "error" ? "ERROR" : lvl === "warn" ? "WARN" : lvl === "event" ? "EVENT" : "INFO";
  }
  function rowMatches(r) {
    if (curFilter !== "all" && r.lvl !== curFilter) return false;
    if (curQuery) {
      var hay = (r.message + " " + (r.source || "") + " " + (r.stack || "")).toLowerCase();
      if (hay.indexOf(curQuery) < 0) return false;
    }
    return true;
  }
  function buildRow(r, cloud) {
    var row = el("div", "pnwLogRow lvl-" + (r.lvl === "warn" ? "warn" : r.lvl === "error" ? "error" : r.lvl === "event" ? "event" : "info"));
    var top = el("div", "pnwLogRowTop");
    top.appendChild(el("span", "pnwLogTime", fmtClock(r.ts || Date.parse(r.at) || 0)));
    top.appendChild(el("span", "pnwLogLvl", lvlLabel(r.lvl)));
    top.appendChild(el("span", "pnwLogType", r.type || ""));
    if (cloud)
      top.appendChild(
        el(
          "span",
          "pnwLogDev",
          (r.uid ? String(r.uid).slice(0, 6) : "anon") + " · " + (r.version || "?"),
        ),
      );
    top.appendChild(el("span", "pnwLogMsg", r.message || ""));
    if ((r.count || 1) > 1) top.appendChild(el("span", "pnwLogCount", "×" + r.count));
    row.appendChild(top);

    var det = el("div", "pnwLogDetail");
    var bits = [];
    if (r.source) bits.push(r.source + (r.line ? ":" + r.line : "") + (r.col ? ":" + r.col : ""));
    if (r.page) bits.push("halaman: " + r.page);
    if (r.version && !cloud) bits.push("versi: " + r.version);
    if (r.online != null) bits.push("online: " + (r.online ? "ya" : "tidak"));
    if (r.at) bits.push(r.at);
    if (bits.length) det.appendChild(el("span", "pnwLogSrc", bits.join("  ·  ")));
    if (r.stack) det.appendChild(el("pre", null, r.stack));
    row.appendChild(det);

    top.onclick = function () {
      row.classList.toggle("open");
    };
    return row;
  }
  function renderList() {
    if (!overlay) return;
    var list = overlay.querySelector(".pnwLogList");
    if (!list) return;
    list.innerHTML = "";
    var shown = 0;
    for (var i = entries.length - 1; i >= 0; i--) {
      if (!rowMatches(entries[i])) continue;
      list.appendChild(buildRow(entries[i], false));
      shown++;
    }
    if (!shown)
      list.appendChild(
        el(
          "div",
          "pnwLogEmpty",
          entries.length
            ? "Tidak ada entri yang cocok dengan filter."
            : "Belum ada error tercatat di perangkat ini. Bagus!",
        ),
      );
    var nErr = 0,
      nWarn = 0;
    for (var j = 0; j < entries.length; j++) {
      if (entries[j].lvl === "error") nErr += entries[j].count || 1;
      if (entries[j].lvl === "warn") nWarn += entries[j].count || 1;
    }
    var stats = overlay.querySelector(".pnwLogStats");
    if (stats)
      stats.textContent =
        entries.length +
        " entri tersimpan · " +
        nErr +
        " error · " +
        nWarn +
        " peringatan · menampilkan " +
        shown;
    var chips = overlay.querySelectorAll(".pnwLogChip");
    for (var c = 0; c < chips.length; c++)
      chips[c].classList.toggle("on", chips[c].getAttribute("data-f") === curFilter);
  }
  function renderCloud() {
    if (!overlay) return;
    var box = overlay.querySelector(".pnwLogCloudList");
    var msg = overlay.querySelector(".pnwLogCloudMsg");
    if (!box || !msg) return;
    box.innerHTML = "";
    msg.textContent = cloudMsg;
    if (cloudRows) {
      if (!cloudRows.length) msg.textContent = "Log cloud kosong.";
      for (var i = cloudRows.length - 1; i >= 0; i--)
        box.appendChild(buildRow(cloudRows[i], true));
    }
  }
  function loadCloud() {
    cloudRows = null;
    cloudMsg = "Memuat log cloud…";
    renderCloud();
    if (!readyCloud || !fb) {
      cloudMsg =
        "Firebase belum siap (offline / belum termuat). Log cloud butuh koneksi.";
      renderCloud();
      return;
    }
    try {
      fb.database()
        .ref("logs")
        .limitToLast(150)
        .once("value")
        .then(function (s) {
          var v = s.val() || {};
          var rows = Object.keys(v).map(function (k) {
            return v[k];
          });
          rows.sort(function (a, b) {
            return (a.ts || 0) - (b.ts || 0);
          });
          cloudRows = rows;
          cloudMsg =
            rows.length +
            " entri dari semua perangkat (terbaru di atas).";
          renderCloud();
        })
        .catch(function (err) {
          cloudRows = [];
          cloudMsg =
            "Baca log cloud ditolak (" +
            safeStr(err && err.code) +
            "). Aktifkan aturan baca node logs untuk admin — lihat CATATAN-v85.txt.";
          renderCloud();
        });
    } catch (e) {
      cloudMsg = "Gagal membaca log cloud: " + safeStr(e && e.message);
      renderCloud();
    }
  }

  function exportText() {
    var lines = [];
    lines.push("PNW TOOLS — Log Error & Diagnostik");
    lines.push("Diekspor: " + nowIso());
    lines.push(
      "Versi: " +
        resolveVersion() +
        " · Halaman: " +
        pageName() +
        " · Viewport: " +
        ((window.innerWidth || 0) + "x" + (window.innerHeight || 0)) +
        " · Online: " +
        (navigator.onLine ? "ya" : "tidak"),
    );
    lines.push("URL: " + ((location && location.href) || ""));
    lines.push("UA: " + ((navigator && navigator.userAgent) || ""));
    lines.push("Jumlah entri: " + entries.length);
    lines.push("");
    for (var i = entries.length - 1; i >= 0; i--) {
      var r = entries[i];
      lines.push(
        "[" +
          (r.at || "") +
          "] [" +
          lvlLabel(r.lvl) +
          "] [" +
          (r.type || "") +
          "] " +
          (r.message || "") +
          ((r.count || 1) > 1 ? "  (×" + r.count + ")" : ""),
      );
      if (r.source)
        lines.push("    di " + r.source + (r.line ? ":" + r.line : "") + (r.col ? ":" + r.col : ""));
      lines.push(
        "    [" + (r.page || "") + " · " + (r.version || "") + " · " + (r.viewport || "") + "]",
      );
      if (r.stack) lines.push("    " + String(r.stack).replace(/\n/g, "\n    "));
    }
    lines.push("");
    return lines.join("\n");
  }
  function footStatus(msg) {
    if (!overlay) return;
    var s = overlay.querySelector(".pnwLogHint");
    if (s) {
      s.textContent = msg;
      setTimeout(function () {
        if (s) s.textContent = "Kirim file log ini ke Alex saat melapor bug. Tombol L = buka/tutup panel.";
      }, 2600);
    }
  }
  function copyAll() {
    var txt = exportText();
    function ok() {
      footStatus("Tersalin ✓ tempel di chat untuk melapor.");
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(ok, function () {
          legacy();
        });
        return;
      }
      legacy();
    } catch (e) {
      legacy();
    }
    function legacy() {
      try {
        var ta = document.createElement("textarea");
        ta.value = txt;
        ta.style.cssText = "position:fixed;opacity:0;";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        ok();
      } catch (e2) {
        footStatus("Gagal menyalin — pakai tombol Unduh.");
      }
    }
  }
  function downloadTxt() {
    try {
      var d = new Date();
      var name =
        "pnw-log-" +
        d.getFullYear() +
        pad2(d.getMonth() + 1) +
        pad2(d.getDate()) +
        "-" +
        pad2(d.getHours()) +
        pad2(d.getMinutes()) +
        ".txt";
      var blob = new Blob([exportText()], { type: "text/plain;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        try {
          URL.revokeObjectURL(a.href);
          if (a.parentNode) a.parentNode.removeChild(a);
        } catch (e) {}
      }, 800);
      footStatus("File log diunduh ✓");
    } catch (e) {
      footStatus("Gagal mengunduh: " + safeStr(e && e.message));
    }
  }
  function clearAll() {
    if (!window.confirm("Hapus semua log di perangkat ini?")) return;
    entries = [];
    persistNow();
    badgeUpdate();
    renderList();
  }

  function buildOverlay() {
    if (overlay) return overlay;
    injectCss();
    overlay = el("div", "");
    overlay.id = "pnwLogOverlay";

    var panel = el("div", "pnwLogPanel");

    var head = el("div", "pnwLogHead");
    head.appendChild(el("b", null, "Log Error & Diagnostik"));
    head.appendChild(el("span", "pnwLogMeta", ""));
    var x = el("button", "pnwLogX", "✕");
    x.type = "button";
    x.setAttribute("aria-label", "Tutup");
    x.onclick = function () {
      closeViewer();
    };
    head.appendChild(x);
    panel.appendChild(head);

    var tools = el("div", "pnwLogTools");
    [
      ["all", "Semua"],
      ["error", "Error"],
      ["warn", "Warning"],
      ["info", "Info"],
    ].forEach(function (pair) {
      var c = el("button", "pnwLogChip", pair[1]);
      c.type = "button";
      c.setAttribute("data-f", pair[0]);
      c.onclick = function () {
        curFilter = pair[0];
        renderList();
      };
      tools.appendChild(c);
    });
    var search = el("input", "pnwLogSearch");
    search.type = "search";
    search.placeholder = "Cari pesan / sumber / stack…";
    search.oninput = function () {
      curQuery = (search.value || "").toLowerCase();
      renderList();
    };
    tools.appendChild(search);
    panel.appendChild(tools);

    panel.appendChild(el("div", "pnwLogStats", ""));
    panel.appendChild(el("div", "pnwLogList", ""));

    var cloud = el("div", "pnwLogCloud");
    var cHead = el("div", "pnwLogCloudHead");
    cHead.appendChild(el("b", null, "Log cloud (semua perangkat)"));
    var cBtn = el("button", "pnwLogBtn", "Muat");
    cBtn.type = "button";
    cBtn.onclick = loadCloud;
    cHead.appendChild(cBtn);
    cloud.appendChild(cHead);
    cloud.appendChild(el("div", "pnwLogCloudMsg", "Belum dimuat. Tombol Muat membaca node /logs (khusus admin)."));
    cloud.appendChild(el("div", "pnwLogCloudList", ""));
    panel.appendChild(cloud);

    var foot = el("div", "pnwLogFoot");
    var bCopy = el("button", "pnwLogBtn primary", "Salin semua");
    bCopy.type = "button";
    bCopy.onclick = copyAll;
    var bDl = el("button", "pnwLogBtn", "Unduh .txt");
    bDl.type = "button";
    bDl.onclick = downloadTxt;
    var bClear = el("button", "pnwLogBtn danger", "Bersihkan");
    bClear.type = "button";
    bClear.onclick = clearAll;
    foot.appendChild(bCopy);
    foot.appendChild(bDl);
    foot.appendChild(bClear);
    foot.appendChild(el("span", "pnwLogHint", "Kirim file log ini ke Alex saat melapor bug. Tombol L = buka/tutup panel."));
    panel.appendChild(foot);

    overlay.appendChild(panel);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeViewer();
    });
    document.body.appendChild(overlay);
    return overlay;
  }
  function openViewer() {
    try {
      buildOverlay();
      var meta = overlay.querySelector(".pnwLogMeta");
      if (meta)
        meta.textContent =
          resolveVersion() +
          " · " +
          pageName() +
          " · " +
          ((window.innerWidth || 0) + "x" + (window.innerHeight || 0)) +
          " · " +
          (navigator.onLine ? "online" : "offline");
      overlay.classList.add("on");
      isOpen = true;
      try {
        localStorage.setItem(OPEN_KEY, String(Date.now()));
      } catch (e) {}
      badgeUpdate();
      renderList();
      renderCloud();
    } catch (e) {}
  }
  function closeViewer() {
    if (!overlay) return;
    overlay.classList.remove("on");
    isOpen = false;
  }
  function toggleViewer() {
    if (isOpen) closeViewer();
    else openViewer();
  }

  /* tombol pembuka + shortcut L */
  function bindButtons() {
    try {
      var ids = ["openLogBtn", "yvLogBtn"];
      for (var i = 0; i < ids.length; i++) {
        var b = document.getElementById(ids[i]);
        if (b && !b.__pnwLogBound) {
          b.__pnwLogBound = true;
          b.addEventListener("click", function (ev) {
            ev.preventDefault();
            openViewer();
          });
        }
      }
    } catch (e) {}
  }
  try {
    document.addEventListener("keydown", function (e) {
      if (!e || e.ctrlKey || e.altKey || e.metaKey) return;
      var k = e.key || "";
      if (k !== "l" && k !== "L") return;
      var t = e.target;
      var tag = t && t.tagName ? t.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (t && t.isContentEditable) return;
      toggleViewer();
    });
    document.addEventListener("keydown", function (e) {
      if (e && e.key === "Escape" && isOpen) closeViewer();
    });
  } catch (e) {}

  /* ---------------- API publik (kompatibel dengan versi lama) -------- */
  window.PNWLog = {
    ready: function (firebaseNs, context) {
      fb = firebaseNs || (typeof firebase !== "undefined" ? firebase : null);
      if (context)
        for (var k in context) if (context.hasOwnProperty(k)) ctx[k] = context[k];
      readyCloud = !!fb;
      flush();
    },
    setContext: function (context) {
      if (context)
        for (var k in context) if (context.hasOwnProperty(k)) ctx[k] = context[k];
    },
    event: function (type, data) {
      var ev = { type: type || "event", lvl: "info" };
      if (typeof data === "string") ev.message = data;
      else if (data)
        for (var k in data) if (data.hasOwnProperty(k)) ev[k] = data[k];
      if (ev.lvl !== "error" && ev.lvl !== "warn" && ev.lvl !== "info")
        ev.lvl = ev.type === "event" ? "event" : ev.lvl || "info";
      enqueue(ev);
    },
    error: function (msg, data) {
      var ev = { lvl: "error", type: "manual", message: msg };
      if (data) for (var k in data) if (data.hasOwnProperty(k)) ev[k] = data[k];
      enqueue(ev);
    },
    warn: function (msg, data) {
      var ev = { lvl: "warn", type: "manual", message: msg };
      if (data) for (var k in data) if (data.hasOwnProperty(k)) ev[k] = data[k];
      enqueue(ev);
    },
    info: function (msg, data) {
      var ev = { lvl: "info", type: "manual", message: msg };
      if (data) for (var k in data) if (data.hasOwnProperty(k)) ev[k] = data[k];
      enqueue(ev);
    },
    open: openViewer,
    close: closeViewer,
    toggle: toggleViewer,
    list: function () {
      return entries.slice();
    },
    clear: clearAll,
    exportText: exportText,
    unread: unreadErrors,
  };

  /* ---------------- boot ---------------- */
  loadLocal();
  injectCss();
  bindButtons();
  badgeUpdate();
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", function () {
      bindButtons();
      badgeUpdate();
    });
})();
