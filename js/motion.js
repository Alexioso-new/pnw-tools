/* HOSANA YOUTH TOOLS — lapisan gerak (v61)
   Token durasi/easing + helper animasi berbasis GSAP.

   Prinsip yang dipakai (arketipe "Premium"):
   - entrance = decelerate (ease-out), exit = accelerate (ease-in)
   - durasi kartu 200-350ms, transisi halaman 400-600ms
   - total stagger WAJIB di bawah 500ms
   - hanya menganimasikan transform + opacity (GPU, tanpa reflow)
   - hormati prefers-reduced-motion

   AMAN: jika GSAP tidak termuat atau pengguna minta gerak minimum,
   semua helper menjadi no-op sehingga tampilan tetap normal. */
(function () {
  "use strict";

  var G = window.gsap || null;

  var reduce = false;
  try {
    reduce = !!(
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch (e) {}

  // Palet durasi (detik) — lihat tabel durasi motion-design.
  var DUR = { micro: 0.1, quick: 0.18, normal: 0.3, slow: 0.45 };

  // Easing tanda tangan. Premium = cubic-bezier(0.4, 0, 0.2, 1), overshoot 0%.
  var EASE = "power2.out";
  var EASE_IN = "power2.in";

  if (G && G.registerPlugin && window.CustomEase) {
    try {
      G.registerPlugin(window.CustomEase);
      window.CustomEase.create("pnwSig", "0.4,0,0.2,1");
      EASE = "pnwSig";
    } catch (e) {}
  }

  var on = !!G && !reduce;

  function kids(scope) {
    if (!scope) return [];
    return Array.prototype.slice.call(scope.children);
  }

  var API = {
    ok: on,
    hasGsap: !!G,
    reduced: reduce,
    DUR: DUR,
    EASE: EASE,
    EASE_IN: EASE_IN,

    /* Entrance bertahap untuk daftar kartu (Song Bank dll).
       Stagger dibatasi supaya total tidak lewat ~350ms. */
    stagger: function (scope) {
      if (!on || !scope) return;
      var els = kids(scope);
      if (!els.length) return;
      var n = Math.min(els.length, 14);
      var head = els.slice(0, n);
      var tail = els.slice(n);
      var step = Math.min(0.055, 0.33 / n);
      try {
        G.killTweensOf(els);
        G.fromTo(
          head,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: DUR.normal,
            ease: EASE,
            stagger: step,
            clearProps: "opacity,transform",
          },
        );
        if (tail.length) G.set(tail, { clearProps: "opacity,transform" });
      } catch (e) {}
    },

    /* Transisi lirik mode proyektor. Dipanggil hanya saat lagu/nada berganti,
       bukan tiap polling, supaya tidak berkedip. */
    revealLines: function (scope) {
      if (!on || !scope) return;
      var els = Array.prototype.slice.call(scope.querySelectorAll(".section, .line"));
      try {
        if (!els.length) {
          G.fromTo(
            scope,
            { opacity: 0 },
            { opacity: 1, duration: DUR.normal, ease: EASE, clearProps: "opacity" },
          );
          return;
        }
        var n = Math.min(els.length, 18);
        var step = Math.min(0.03, 0.24 / n);
        G.killTweensOf(els);
        G.fromTo(
          els.slice(0, n),
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: DUR.normal,
            ease: EASE,
            stagger: step,
            clearProps: "opacity,transform",
          },
        );
        if (els.length > n) G.set(els.slice(n), { clearProps: "opacity,transform" });
      } catch (e) {}
    },

    /* Fade masuk sederhana untuk panel/kartu tunggal. */
    fadeIn: function (el, dy) {
      if (!on || !el) return;
      try {
        G.fromTo(
          el,
          { opacity: 0, y: dy == null ? 10 : dy },
          {
            opacity: 1,
            y: 0,
            duration: DUR.normal,
            ease: EASE,
            clearProps: "opacity,transform",
          },
        );
      } catch (e) {}
    },
  };

  window.PNWMotion = API;
})();
