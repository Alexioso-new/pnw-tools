/* PNW-FILE-GUIDE
   js/presenter-logo.js — logo animasi + jam untuk LAYAR STANDBY proyektor.
   Aktif HANYA di mode tampilan (?mode=display) atau window.__FORCE_DISPLAY (QA).
   Lottie: window.__PRESENTER_LOGO (js/presenter-logo-data.js), lazy-load lottie.min.js.
   Target: #dispLogoAnim; elemen jam #dispClock dibuat di .dispIdleInner.
   TIDAK mengubah bentuk data pujianYouth/live.
*/
(function () {
  "use strict";
  var isDisplay =
    /[?&]mode=(display|stage)/.test(location.search) || !!window.__FORCE_DISPLAY;
  if (!isDisplay) return;

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

  function mountLogo() {
    var host = document.getElementById("dispLogoAnim");
    if (!host || host._pnwLogo) return;
    var data = window.__PRESENTER_LOGO;
    if (!data) return;
    ensureLottie(function (ok) {
      if (!ok || host._pnwLogo) return;
      try {
        host._pnwLogo = window.lottie.loadAnimation({
          container: host,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: data,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
            progressiveLoad: false,
          },
        });
        var wrap = document.getElementById("dispLogo");
        if (wrap) wrap.classList.add("hasLogo");
      } catch (e) {}
    });
  }

  function two(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function mountClock() {
    var inner = document.querySelector("#dispIdle .dispIdleInner");
    if (!inner) return;
    var el = document.getElementById("dispClock");
    if (!el) {
      el = document.createElement("div");
      el.id = "dispClock";
      el.className = "dispClock";
      el.setAttribute("aria-hidden", "true");
      inner.appendChild(el);
    }
    function tick() {
      var d = new Date();
      el.textContent = two(d.getHours()) + ":" + two(d.getMinutes());
    }
    tick();
    setInterval(tick, 10000);
  }

  function init() {
    mountLogo();
    mountClock();
    setTimeout(mountLogo, 1400);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

  window.PNWPresenterLogo = { mount: mountLogo };
})();
