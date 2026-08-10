/* PNW-FILE-GUIDE
   js/cf-diag.js — DIAGNOSTIC PANEL v103 (Sprint 4: S4-06).
   Satu panel untuk tim operator/teknis melihat kondisi sistem:
     app (versi/mode) · output (status + umur heartbeat + ACK, LIVE dari store)
     preflight (hasil terakhir + tombol Run) · media hilang (daftar + Scan now)
     error terbaru (dari store) · storage (jumlah key namespace).
   Semua data dibaca dari store kernel — panel ini TIDAK menyimpan state.
   Visibilitas via kelas .on (bukan [hidden] — pelajaran v81). Esc/backdrop tutup.
   Menu: Avatar -> "Diagnostics". Dimuat SETELAH cf-kernel.js.
 */
(function () {
  "use strict";
  var K = window.CastFlowKernel;
  if (!K) return;

  var overlay = null;
  var bodyEl = null;
  var unsub = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }
  function ago(ts) {
    if (!ts) return "belum ada";
    var s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    return s < 90 ? s + "s lalu" : Math.round(s / 60) + "m lalu";
  }

  function render() {
    if (!bodyEl) return;
    var app = K.store.slice("app");
    var out = K.store.slice("connection").output || {};
    var prog = K.store.slice("program");
    var pf = K.store.slice("diagnostics").preflight;
    var errs = K.store.slice("diagnostics").errors || [];
    var missing = K.media && K.media.listMissing ? K.media.listMissing() : [];
    var nsKeys = 0;
    try {
      for (var i = 0; i < localStorage.length; i++)
        if (String(localStorage.key(i)).indexOf(K.NS) === 0) nsKeys++;
    } catch (e) {}

    var html = "";
    html += '<div class="cfDiagRow" data-status="info"><b>App</b><span>' + esc(app.label) + " · " + esc(app.release || app.version) + " · mode " + esc(app.mode) + "</span></div>";
    html +=
      '<div class="cfDiagRow" data-status="' + esc(out.status || "idle") + '"><b>Output</b><span>' +
      esc(out.status || "idle") + " · heartbeat " + esc(ago(out.lastSeen)) + " · ACK " + (prog.lastAckSig ? "diterima " + esc(ago(prog.ackAt)) : "belum") +
      "</span></div>";
    html += pf
      ? '<div class="cfDiagRow" data-status="' + esc(pf.status) + '"><b>Preflight</b><span>' + esc(pf.status.toUpperCase()) + " · " + esc(ago(Date.parse(pf.generatedAt) || 0)) + ' — <button type="button" class="cfDiagBtn" id="cfDiagRunPf">Run</button></span></div>'
      : '<div class="cfDiagRow" data-status="warn"><b>Preflight</b><span>belum pernah dijalankan — <button type="button" class="cfDiagBtn" id="cfDiagRunPf">Run</button></span></div>';
    html +=
      '<div class="cfDiagRow" data-status="' + (missing.length ? "warn" : "pass") + '"><b>Media</b><span>' +
      (missing.length ? missing.length + " hilang: " + esc(missing.slice(0, 3).join(", ")) + (missing.length > 3 ? "…" : "") : "tidak ada yang hilang") +
      ' — <button type="button" class="cfDiagBtn" id="cfDiagScan">Scan now</button></span></div>';
    html += '<div class="cfDiagRow" data-status="' + (errs.length ? "warn" : "pass") + '"><b>Errors</b><span>' + (errs.length ? errs.length + " tercatat" : "bersih") + "</span></div>";
    if (errs.length) {
      html += '<div class="cfDiagErrs">' + errs.slice(-5).map(function (e) { return "<div>· " + esc(e.message) + "</div>"; }).join("") + "</div>";
    }
    html += '<div class="cfDiagRow" data-status="info"><b>Storage</b><span>' + nsKeys + " key ber-namespace " + esc(K.NS) + "</span></div>";
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
          if (K.toast)
            miss.length ? K.toast.warn(miss.length + " media hilang.") : K.toast.success("Semua media rundown ter-resolve.");
          render();
        });
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
    unsub = K.store.subscribe(null, render); /* live refresh dari store */
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
