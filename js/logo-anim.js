/* PNW-FILE-GUIDE
   js/logo-anim.js — animasi logo api -> logo lama.
   Butuh lottie (di-lazy-load) + window.__HOSANA_FLAME (js/hosana-flame-data.js).
   Target elemen: #brandMark, #brandFlame, #brandLogo di index.html.
 */

/* PNW TOOLS v63 - animasi logo api Hosana (Lottie) lalu logo lama (fade).
   PERBAIKAN v63: data animasi kini di-embed sebagai <script> biasa
   (window.__HOSANA_FLAME) sehingga TIDAK bergantung pada fetch().
   Di sebagian browser HP, service worker lama / mode offline membuat
   fetch("./js/hosana-flame.json") gagal diam-diam sehingga animasi
   tidak pernah tampil. */
(function () {
  "use strict";
  var mark = document.getElementById("brandMark");
  var host = document.getElementById("brandFlame");
  var logo = document.getElementById("brandLogo");
  if (!mark || !logo) return;

  var done = false;
  var anim = null;

  function showLogo(instant) {
    if (done) return;
    done = true;
    if (instant) mark.classList.add("noAnim");
    mark.classList.add("logoIn");
    setTimeout(
      function () {
        mark.classList.add("flameGone");
        try {
          if (anim && anim.destroy) anim.destroy();
        } catch (e) {}
        anim = null;
        if (host) host.innerHTML = "";
      },
      instant ? 0 : 760,
    );
  }

  // hormati pengaturan "kurangi gerak" di iOS/Android
  var reduced = false;
  try {
    reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}
  if (reduced || !host) {
    showLogo(true);
    return;
  }

  // pengaman mutlak: apa pun yang gagal, logo tetap wajib muncul
  setTimeout(function () {
    showLogo(false);
  }, 3600);

  function ensureLottie(cb) {
    if (window.lottie && window.lottie.loadAnimation) return cb(true);
    var ex = document.getElementById("lottieLib");
    if (ex) {
      ex.addEventListener("load", function () {
        cb(!!(window.lottie && window.lottie.loadAnimation));
      });
      ex.addEventListener("error", function () {
        cb(false);
      });
      return;
    }
    var s = document.createElement("script");
    s.id = "lottieLib";
    s.src = "./lottie.min.js";
    s.onload = function () {
      cb(!!(window.lottie && window.lottie.loadAnimation));
    };
    s.onerror = function () {
      cb(false);
    };
    document.head.appendChild(s);
  }

  function withData(cb) {
    // 1) data yang sudah ikut termuat sebagai script (paling andal)
    if (window.__HOSANA_FLAME) return cb(window.__HOSANA_FLAME);
    // 2) cadangan: ambil lewat jaringan
    try {
      fetch("./js/hosana-flame.json", { cache: "force-cache" })
        .then(function (r) {
          return r && r.ok ? r.json() : null;
        })
        .then(function (j) {
          cb(j);
        })
        .catch(function () {
          cb(null);
        });
    } catch (e) {
      cb(null);
    }
  }

  function start() {
    ensureLottie(function (ok) {
      if (!ok) return showLogo(false);
      withData(function (data) {
        if (!data) return showLogo(false);
        try {
          anim = window.lottie.loadAnimation({
            container: host,
            renderer: "svg",
            loop: false,
            autoplay: true,
            animationData: data,
            rendererSettings: {
              preserveAspectRatio: "xMidYMid meet",
              progressiveLoad: false,
            },
          });
        } catch (e) {
          return showLogo(false);
        }
        mark.classList.add("flameOn");
        anim.addEventListener("complete", function () {
          showLogo(false);
        });
        anim.addEventListener("data_failed", function () {
          showLogo(false);
        });
      });
    });
  }

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(start, 0);
  } else {
    document.addEventListener("DOMContentLoaded", start);
  }
})();
