/* HOSANA YOUTH TOOLS - animasi logo api (v62)
   Urutan: api biru menyala dari dasar (Lottie) -> fade -> logo lama tampil.
   Aman: kalau Lottie/JSON gagal, logo lama langsung tampil. */
(function () {
  "use strict";

  var mark = document.getElementById("brandMark");
  var host = document.getElementById("brandFlame");
  var logo = document.getElementById("brandLogo");
  if (!mark || !host || !logo) return;

  var done = false;

  function showLogo(instant) {
    if (done) return;
    done = true;
    if (instant) mark.classList.add("noAnim");
    mark.classList.add("logoIn");
    // bersihkan panggung api setelah transisi selesai
    setTimeout(
      function () {
        mark.classList.add("flameGone");
        try {
          if (host.__anim) host.__anim.destroy();
        } catch (e) {}
        host.innerHTML = "";
      },
      instant ? 0 : 760
    );
  }

  var reduced = false;
  try {
    reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  if (reduced) {
    showLogo(true);
    return;
  }

  // pengaman: apa pun yang terjadi, logo wajib tampil maksimal 3,2 detik
  var failSafe = setTimeout(function () {
    showLogo(false);
  }, 3200);

  function ensureLottie(cb) {
    if (window.lottie && window.lottie.loadAnimation) return cb(true);
    var s = document.createElement("script");
    s.src = "./lottie.min.js";
    s.onload = function () {
      cb(!!(window.lottie && window.lottie.loadAnimation));
    };
    s.onerror = function () {
      cb(false);
    };
    document.head.appendChild(s);
  }

  function start() {
    ensureLottie(function (ok) {
      if (!ok) {
        clearTimeout(failSafe);
        showLogo(true);
        return;
      }
      fetch("./js/hosana-flame.json", { cache: "force-cache" })
        .then(function (r) {
          if (!r.ok) throw new Error("http " + r.status);
          return r.json();
        })
        .then(function (data) {
          var anim = window.lottie.loadAnimation({
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
          host.__anim = anim;
          mark.classList.add("flameOn");
          anim.addEventListener("complete", function () {
            clearTimeout(failSafe);
            showLogo(false);
          });
          anim.addEventListener("data_failed", function () {
            clearTimeout(failSafe);
            showLogo(true);
          });
        })
        .catch(function () {
          clearTimeout(failSafe);
          showLogo(true);
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
