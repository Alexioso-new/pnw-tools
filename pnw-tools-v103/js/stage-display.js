/* PNW-FILE-GUIDE
   js/stage-display.js — Stage Display untuk musisi (?mode=stage).
   Menumpang layar output (#displayScreen) + renderDisplay(app.js): menandai
   body.stage-mode, menampilkan jam besar di bar atas, label STAGE, dan chord
   SELALU tampil (dipaksa di app.js). TIDAK mengubah data pujianYouth/live.
   QA: set window.__FORCE_STAGE.
*/
(function () {
  "use strict";
  if (!/[?&]mode=stage/.test(location.search) && !window.__FORCE_STAGE) return;

  function two(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function build() {
    var screen = document.getElementById("displayScreen");
    if (!screen) return;
    document.body.classList.add("stage-mode");
    var brand = screen.querySelector(".dispBrand");
    if (brand) brand.textContent = "PNW TOOLS \u2014 Stage Display";
    var clock = document.getElementById("stageClock");
    if (!clock) {
      clock = document.createElement("div");
      clock.id = "stageClock";
      clock.className = "stageClock";
      clock.setAttribute("aria-hidden", "true");
      var bar = screen.querySelector(".dispBar");
      if (bar) bar.appendChild(clock);
      else screen.appendChild(clock);
    }
    function tick() {
      var d = new Date();
      clock.textContent = two(d.getHours()) + ":" + two(d.getMinutes());
    }
    tick();
    setInterval(tick, 10000);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", build);
  else build();
})();
