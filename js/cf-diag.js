/* PNW-FILE-GUIDE
   js/cf-diag.js — DIAGNOSTIC PANEL v104 (Sprint 4 + Sprint 5).
   Satu panel status: app, output, preflight, media, errors, storage,
   performance, accessibility, dan reliability/soak test 2 jam.
   Semua data dibaca dari store; panel subscribe hanya saat terbuka dan
   unsubscribe saat tutup. Visibilitas via kelas .on (bukan [hidden]).
 */
(function () {
  "use strict";
  var K = window.CastFlowKernel;
  if (!K) return;

  var overlay = null;
  var bodyEl = null;
  var unsub = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function ago(ts) {
    if (!ts) return "belum ada";
    var s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    return s < 90 ? s + "s lalu" : Math.round(s / 60) + "m lalu";
  }
  function duration(ms) {
    ms = Math.max(0, Number(ms) || 0);
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    var s = Math.floor((ms % 60000) / 1000);
    return h ? h + "j " + m + "m" : m ? m + "m " + s + "d" : s + "d";
  }
  function row(status, title, body) {
    return '<div class="cfDiagRow" role="status" data-status="' + esc(status || "info") + '"><b>' + esc(title) + "</b><span>" + body + "</span></div>";
  }

  function render() {
    if (!bodyEl) return;
    var app = K.store.slice("app");
    var out = K.store.slice("connection").output || {};
    var prog = K.store.slice("program");
    var d = K.store.slice("diagnostics");
    var pf = d.preflight;
    var errs = d.errors || [];
    var perf = d.performance || null;
    var a11y = d.a11y || K.storage.get("diagnostics:lastA11y", null);
    var soak = d.soak || (K.reliability && K.reliability.status ? K.reliability.status() : null);
    var lastSoak = K.reliability && K.reliability.lastReport ? K.reliability.lastReport() : K.storage.get("diagnostics:lastSoak", null);
    var missing = K.media && K.media.listMissing ? K.media.listMissing() : [];
    var nsKeys = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) if (String(localStorage.key(i)).indexOf(K.NS) === 0) nsKeys++;
    } catch (e) {}

    var html = "";
    html += row("info", "App", esc(app.label) + " · " + esc(app.version || K.VERSION) + " · mode " + esc(app.mode));
    html += row(
      out.status || "idle",
      "Output",
      esc(out.status || "idle") + " · heartbeat " + esc(ago(out.lastSeen)) + " · ACK " + (prog.lastAckSig ? "diterima " + esc(ago(prog.ackAt)) : "belum")
    );
    html += pf
      ? row(pf.status, "Preflight", esc(pf.status.toUpperCase()) + " · " + esc(ago(Date.parse(pf.generatedAt) || 0)) + ' — <button type="button" class="cfDiagBtn" id="cfDiagRunPf">Run</button>')
      : row("warn", "Preflight", 'belum pernah dijalankan — <button type="button" class="cfDiagBtn" id="cfDiagRunPf">Run</button>');
    html += row(
      missing.length ? "warn" : "pass",
      "Media",
      (missing.length ? missing.length + " hilang: " + esc(missing.slice(0, 3).join(", ")) + (missing.length > 3 ? "…" : "") : "tidak ada yang hilang") +
        ' — <button type="button" class="cfDiagBtn" id="cfDiagScan">Scan now</button>'
    );
    html += row(errs.length ? "warn" : "pass", "Errors", errs.length ? errs.length + " tercatat" : "bersih");
    if (errs.length) {
      html += '<div class="cfDiagErrs">' +
        errs
          .slice(-5)
          .map(function (e) {
            return "<div>· " + esc(e.message) + "</div>";
          })
          .join("") +
        "</div>";
    }
    html += row("info", "Storage", nsKeys + " key ber-namespace " + esc(K.NS));

    if (perf) {
      var perfStatus = perf.errors ? "warn" : perf.eventLoopLagMs > 500 ? "fail" : perf.eventLoopLagMs > 200 ? "warn" : "pass";
      html += row(
        perfStatus,
        "Performance",
        perf.domNodes + " DOM · " + (perf.heapMB == null ? "heap n/a" : perf.heapMB + " MB") + " · lag " + perf.eventLoopLagMs + " ms · long task " + perf.longTaskMaxMs +
          ' ms — <button type="button" class="cfDiagBtn" id="cfDiagPerf">Sample</button>'
      );
    } else {
      html += row("info", "Performance", 'menunggu sampel — <button type="button" class="cfDiagBtn" id="cfDiagPerf">Sample</button>');
    }

    html += a11y
      ? row(
          a11y.status,
          "Accessibility",
          a11y.score + "/100 · " + a11y.unlabeled.length + ' tanpa label — <button type="button" class="cfDiagBtn" id="cfDiagA11y">Run audit</button>'
        )
      : row("info", "Accessibility", 'belum diaudit — <button type="button" class="cfDiagBtn" id="cfDiagA11y">Run audit</button>');

    if (soak && soak.running) {
      html += row(
        "running",
        "Reliability",
        esc(soak.progress) + "% · " + esc(duration(soak.elapsedMs)) + " / " + esc(duration(soak.durationMs)) + " · disconnect " + esc(soak.disconnects) +
          ' — <button type="button" class="cfDiagBtn" id="cfDiagSoakStop">Stop</button>'
      );
    } else {
      var last = lastSoak ? "terakhir " + String(lastSoak.status || "").toUpperCase() + " · " + duration(lastSoak.actualDurationMs) : "belum pernah dijalankan";
      html += row(
        lastSoak ? lastSoak.status : "info",
        "Reliability",
        esc(last) + ' — <button type="button" class="cfDiagBtn" id="cfDiagSoakStart">Start 2h</button>' +
          (lastSoak ? ' <button type="button" class="cfDiagBtn" id="cfDiagSoakExport">Export</button>' : "")
      );
    }

    bodyEl.innerHTML = html;

    var runPf = document.getElementById("cfDiagRunPf");
    if (runPf)
      runPf.addEventListener("click", function () {
        close();
        if (K.preflight) K.preflight.open();
      });
    var scan = document.getElementById("cfDiagScan");
    if (scan)
      scan.addEventListener("click", function () {
        if (!K.media) return;
        scan.textContent = "scanning…";
        K.media.scanPlan().then(function (miss) {
          if (K.toast) miss.length ? K.toast.warn(miss.length + " media hilang.") : K.toast.success("Semua media rundown ter-resolve.");
          render();
        });
      });
    var perfBtn = document.getElementById("cfDiagPerf");
    if (perfBtn)
      perfBtn.addEventListener("click", function () {
        if (K.reliability) K.reliability.sample();
      });
    var a11yBtn = document.getElementById("cfDiagA11y");
    if (a11yBtn)
      a11yBtn.addEventListener("click", function () {
        if (K.a11y) K.a11y.audit(true);
      });
    var start = document.getElementById("cfDiagSoakStart");
    if (start)
      start.addEventListener("click", function () {
        if (K.reliability) K.reliability.startSoak({ durationMs: 2 * 60 * 60 * 1000, label: "production-2h" });
      });
    var stop = document.getElementById("cfDiagSoakStop");
    if (stop)
      stop.addEventListener("click", function () {
        if (K.reliability) K.reliability.stopSoak("manual");
      });
    var exp = document.getElementById("cfDiagSoakExport");
    if (exp)
      exp.addEventListener("click", function () {
        if (K.reliability) K.reliability.exportReport();
      });
  }

  function buildUi() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.id = "cfDiagOverlay";
    overlay.className = "cfDiagOverlay";
    overlay.innerHTML =
      '<div class="cfDiagPanel" role="dialog" aria-modal="true" aria-labelledby="cfDiagTitle">' +
      '<div class="cfDiagHead"><h3 id="cfDiagTitle">Diagnostics</h3>' +
      '<button type="button" class="cfDiagX" id="cfDiagClose" aria-label="Close">×</button></div>' +
      '<div class="cfDiagBody" id="cfDiagBody"></div>' +
      '<div class="cfDiagFoot"><button type="button" class="cfDiagBtn primary" id="cfDiagOk">Done</button></div>' +
      "</div>";
    document.body.appendChild(overlay);
    bodyEl = overlay.querySelector("#cfDiagBody");
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    overlay.querySelector("#cfDiagClose").addEventListener("click", close);
    overlay.querySelector("#cfDiagOk").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("on")) close();
    });
  }
  function open() {
    buildUi();
    overlay.classList.add("on");
    render();
    /* v104: fokus awal eksplisit; cf-a11y menjaga Tab tetap di dialog. */
    setTimeout(function () {
      var first = overlay && overlay.querySelector("#cfDiagClose");
      if (first) first.focus();
    }, 0);
    if (!unsub) unsub = K.store.subscribe(null, render);
  }
  function close() {
    if (overlay) overlay.classList.remove("on");
    if (unsub) {
      unsub();
      unsub = null;
    }
  }

  var menuTries = 0;
  function addMenuItem() {
    menuTries++;
    var menu = document.getElementById("cfUserMenu");
    if (menu) {
      if (!document.getElementById("cfDiagItem")) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "cfUserItem";
        b.id = "cfDiagItem";
        b.textContent = "Diagnostics";
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

  K.diag = { open: open, close: close, render: render };
})();
