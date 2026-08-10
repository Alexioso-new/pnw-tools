/* PNW-FILE-GUIDE
   js/cf-toast.js — TOAST SYSTEM TERPUSAT v103 (Sprint 4: S4-05).
   Satu sistem umpan balik non-blocking untuk SEMUA modul baru:
     K.toast.show(msg, kind, ms)  /  .success .warn .error .info
   - Antrian: maksimal 3 kartu; yang terlama dibuang saat penuh.
   - Auto-dismiss (error lebih lama), klik kartu = tutup cepat.
   - ARIA: host aria-live=polite, kartu role=status. TANPA emoji (aturan v100).
   Jembatan legacy: projector.js notify() mendelegasikan ke sini (patch v103),
   jadi SEMUA toast lama otomatis memakai sistem ini tanpa mengubah call site.
   Dimuat SETELAH cf-kernel.js. Style: css/cf-v103.css.
 */
(function () {
  "use strict";
  var K = window.CastFlowKernel;
  if (!K) return;

  var host = null;
  var MAX = 3;
  var KINDS = ["success", "warn", "error", "info"];

  function ensureHost() {
    if (host && document.body && document.body.contains(host)) return host;
    host = document.createElement("div");
    host.id = "cfToastHost";
    host.className = "cfToastHost";
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
    return host;
  }

  function show(msg, kind, ms) {
    kind = KINDS.indexOf(kind) >= 0 ? kind : "info";
    var h = ensureHost();
    while (h.children.length >= MAX) h.removeChild(h.firstChild);
    var card = document.createElement("div");
    card.className = "cfToast cfToast-" + kind;
    card.setAttribute("role", "status");
    var badge = document.createElement("span");
    badge.className = "cfToastKind";
    badge.textContent = kind.toUpperCase();
    var body = document.createElement("span");
    body.className = "cfToastMsg";
    body.textContent = String(msg || "");
    card.appendChild(badge);
    card.appendChild(body);
    h.appendChild(card);
    var life = ms || (kind === "error" ? 6000 : 3500);
    var timer = setTimeout(dismiss, life);
    function dismiss() {
      clearTimeout(timer);
      if (!card.parentNode) return;
      card.classList.add("out");
      setTimeout(function () {
        if (card.parentNode) card.parentNode.removeChild(card);
      }, 180);
    }
    card.addEventListener("click", dismiss);
    return dismiss;
  }

  K.toast = {
    show: show,
    success: function (m, ms) {
      return show(m, "success", ms);
    },
    warn: function (m, ms) {
      return show(m, "warn", ms);
    },
    error: function (m, ms) {
      return show(m, "error", ms);
    },
    info: function (m, ms) {
      return show(m, "info", ms);
    },
  };
})();
