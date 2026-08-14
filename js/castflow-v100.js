/* CastFlow v100 UI architecture layer
   Features-first navigation · dynamic Flow · Design Panel · Edit/Live/Dual preview */
(function () {
  "use strict";

  var runMode = "";
  try { runMode = new URLSearchParams(location.search).get("mode") || ""; } catch (e) {}
  /* Lapisan UI operator tidak dijalankan ulang di iframe output. */
  if (/^(display|stage|remote|youthviews)$/i.test(runMode)) return;

  var VISUAL_KEY = "pnwCastflowVisualStyle.v2";
  var PREVIEW_MODE_KEY = "pnwCastflowPreviewMode.v2";
  var FLOW_TITLES = {
    lagu: "LYRIC",
    alkitab: "BIBLE EDIT",
    teks: "TEXT",
    media: "MEDIA",
    template: "TEMPLATE",
  };
  /* v118: pilihan gerak lokal/offline. Transform + opacity diprioritaskan
     supaya lancar; tidak bergantung API eksternal. */
  var TRANSITIONS_IN = [
    { id: "cut", label: "Cut" },
    { id: "fade", label: "Fade" },
    { id: "rise", label: "Rise" },
    { id: "drop", label: "Drop" },
    { id: "slide-left", label: "Slide Kiri" },
    { id: "slide-right", label: "Slide Kanan" },
    { id: "zoom-in", label: "Zoom In" },
    { id: "zoom-out", label: "Zoom Out" },
    { id: "blur", label: "Blur" },
    { id: "pop", label: "Pop" },
    { id: "flip", label: "Flip" },
    { id: "wipe", label: "Wipe" },
    { id: "skew", label: "Skew" },
    { id: "typewriter", label: "Typewriter" },
    { id: "stagger", label: "Per Baris" },
  ];
  var TRANSITIONS_OUT = [
    { id: "cut", label: "Cut" },
    { id: "fade", label: "Fade" },
    { id: "sink", label: "Turun" },
    { id: "lift", label: "Naik" },
    { id: "slide-left", label: "Ke Kiri" },
    { id: "slide-right", label: "Ke Kanan" },
    { id: "zoom", label: "Zoom" },
    { id: "blur", label: "Blur" },
    { id: "flip", label: "Flip" },
    { id: "wipe", label: "Wipe" },
  ];
  var DESIGN_SNAPSHOT_KEY = "pnwCastflowDesignSnapshot.v118";
  var _designDirty = false;
  var _previewAnimTimer = 0;
  var _previewAnimToken = 0;

  /* v111: TEMA — preset gaya lirik sekali-tap. Hanya menyentuh kunci visual
     v2 (bukan font/ukuran — itu tetap milik kontrol sesi). */
  var THEMES = [
    {
      id: "standar",
      label: "Standar",
      set: { weight: 500, transform: "none", lineHeight: 1.2, spacing: 0, opacity: 1, pos: "middle", transition: "fade", transitionOut: "fade", duration: 0.55, durationOut: 0.28, color: "#ffffff" },
    },
    {
      id: "megah",
      label: "Megah",
      set: { weight: 800, transform: "uppercase", lineHeight: 1.15, spacing: 0.5, transition: "rise", transitionOut: "lift", duration: 0.5, durationOut: 0.3, color: "#ffffff" },
    },
    {
      id: "lembut",
      label: "Lembut Doa",
      set: { weight: 300, lineHeight: 1.55, transition: "blur", transitionOut: "fade", duration: 0.9, durationOut: 0.45, opacity: 0.92, transform: "none", pos: "middle", color: "#e8edf7" },
    },
    {
      id: "pengumuman",
      label: "Pengumuman",
      set: { weight: 600, pos: "bottom", transition: "slide-left", transitionOut: "slide-right", duration: 0.45, durationOut: 0.28, transform: "none", lineHeight: 1.3, color: "#dbeafe", opacity: 1, spacing: 0 },
    },
  ];
  var THEME_INPUT = {
    color: "cfTextColor",
    weight: "cfTextWeight",
    spacing: "cfTextSpacing",
    lineHeight: "cfTextLine",
    opacity: "cfTextOpacity",
    transform: "cfTextTransform",
    pos: "cfTextPosition",
    duration: "cfMotionDuration",
    durationOut: "cfMotionOutDuration",
  };
  var _themeId = "";
  function markThemeRow() {
    qa(".cfThemeChip").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-theme") === _themeId);
    });
  }
  function applyTheme(id) {
    var t = null;
    THEMES.forEach(function (x) {
      if (x.id === id) t = x;
    });
    if (!t) return;
    var v = readVisual();
    Object.keys(t.set).forEach(function (k) {
      v[k] = t.set[k];
      var inp = document.getElementById(THEME_INPUT[k]);
      if (inp) inp.value = v[k];
    });
    _themeId = id;
    saveVisual(v, true);
    syncDesignValues(v);
    markThemeRow();
  }
  function buildThemeRow() {
    var host = document.getElementById("cfThemeRow");
    if (host && !host.childElementCount) {
      THEMES.forEach(function (t) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "cfThemeChip";
        b.textContent = t.label;
        b.setAttribute("data-theme", t.id);
        b.onclick = function () {
          applyTheme(t.id);
        };
        host.appendChild(b);
      });
    }
    var rf = document.getElementById("cfReflow");
    if (rf && !rf.__cfBound) {
      rf.__cfBound = 1;
      try {
        rf.checked = localStorage.getItem("pnwCastflowReflow.v1") === "1";
      } catch (e) {}
      rf.onchange = function () {
        try {
          localStorage.setItem("pnwCastflowReflow.v1", rf.checked ? "1" : "0");
        } catch (e) {}
      };
    }
  }

  function q(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function safe(name, fn) {
    try {
      return fn();
    } catch (e) {
      (window.PNWDiag = window.PNWDiag || []).push({
        feature: "castflow.v100." + name,
        error: String((e && e.message) || e),
        at: Date.now(),
      });
    }
  }

  function uiEvery(fn, ms, name) {
    if (window.CastFlowKernel && CastFlowKernel.scheduler)
      return CastFlowKernel.scheduler.every(fn, ms, { name: name || "castflow-v100-ui" });
    var id = setInterval(fn, ms);
    return function () { clearInterval(id); };
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------- top brand + icon cleanup ---------------- */
  function buildTopBrand() {
    var bar = document.getElementById("yvBar");
    if (!bar) return false;
    var hero = q(".cfHeroLogo");
    if (hero) hero.remove();
    if (!document.getElementById("cfTopBrand")) {
      var img = document.createElement("img");
      img.id = "cfTopBrand";
      img.className = "cfTopBrand";
      img.src = "./castflow-logo-light.svg";
      img.alt = "CastFlow";
      bar.appendChild(img);
    }
    var main = q(".yvBar > a.yvBarBtn");
    if (main) main.textContent = "Main app";
    var avatar = document.getElementById("cfAvatarBtn");
    if (avatar) {
      avatar.innerHTML = '<span class="cfUserGlyph" aria-hidden="true"><span></span></span><span class="cfSrOnly">Account</span>';
      avatar.title = "Account";
    }
    var searchIcon = q(".cfGSIcon");
    if (searchIcon) searchIcon.remove();
    var gs = document.getElementById("cfGlobalSearch");
    if (gs) gs.placeholder = "Search songs, verses, media";
    var pop = document.getElementById("cfPopBtn");
    if (pop) {
      pop.textContent = "Pop out";
      pop.title = "Open floating preview";
    }
    var prev = document.getElementById("projPrevSlide");
    var next = document.getElementById("projNextSlide");
    if (prev) prev.textContent = "Prev";
    if (next) next.textContent = "Next";
    var empty = q(".cfPrevEmpty");
    if (empty) empty.textContent = "Preview is floating. Use Dock to restore it.";
    var dock = document.getElementById("cfDockBtn");
    if (dock) dock.textContent = "Dock";
    return true;
  }

  /* ---------------- Features -> dynamic flow ---------------- */
  var _flowMode = "lagu";
  function updateFlowHeader() {
    var cell = q(".cfC-lyric");
    var title = q(".cfLyricTitle", cell || document);
    var toggle = q(".cfViewToggle", cell || document);
    if (!cell || !title) return;
    var lyricMode = _flowMode === "lagu";
    if (toggle) toggle.hidden = !lyricMode;
    if (lyricMode) title.textContent = cell.classList.contains("showTl") ? "TIMELINE" : "LYRIC";
    else title.textContent = FLOW_TITLES[_flowMode] || "FLOW";
    cell.setAttribute("data-flow-mode", _flowMode);
  }
  function setFlowMode(mode, clickTab) {
    if (!FLOW_TITLES[mode]) mode = "lagu";
    _flowMode = mode;
    var cell = q(".cfC-lyric");
    if (mode !== "lagu" && window.CastFlow && CastFlow.setLyricView) {
      CastFlow.setLyricView("lyric");
    }
    if (clickTab) {
      var tab = q('#projTabs [data-tab="' + mode + '"]');
      if (tab) tab.click();
    }
    if (cell) cell.scrollTop = 0;
    updateFlowHeader();
  }
  function hookFeatures() {
    var rail = document.getElementById("projRail");
    var cell = q(".cfC-lyric");
    if (!rail || !cell) return false;
    qa(".cfViewToggle [data-cfview]", cell).forEach(function (b) {
      b.textContent = b.getAttribute("data-cfview") === "timeline" ? "Timeline" : "Lyric";
      if (!b.__cfV100) {
        b.__cfV100 = true;
        b.addEventListener("click", function () {
          setTimeout(updateFlowHeader, 20);
        });
      }
    });
    qa(".projRailBtn[data-rail]", rail).forEach(function (b) {
      if (b.__cfV100) return;
      b.__cfV100 = true;
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-rail");
        if (FLOW_TITLES[id]) setTimeout(function () { setFlowMode(id, false); }, 20);
      });
    });
    var tabs = document.getElementById("projTabs");
    if (tabs && !tabs.__cfV100) {
      tabs.__cfV100 = true;
      qa("[data-tab]", tabs).forEach(function (b) {
        b.addEventListener("click", function () {
          var mode = b.getAttribute("data-tab");
          if (FLOW_TITLES[mode]) setTimeout(function () { setFlowMode(mode, false); }, 10);
        });
      });
    }
    var searchIcon = q(".cfGSIcon");
    if (searchIcon) searchIcon.remove();
    setFlowMode(_flowMode, false);
    return true;
  }

  /* ---------------- mini preview cards ---------------- */
  /* ---------------- mini preview cards + alur operator v118 ---------------- */
  function readDesignSnapshot() {
    try {
      var x = JSON.parse(localStorage.getItem(DESIGN_SNAPSHOT_KEY) || "null");
      return x && typeof x === "object" ? x : null;
    } catch (e) {
      return null;
    }
  }
  function cloneJson(x, fallback) {
    try { return JSON.parse(JSON.stringify(x)); } catch (e) { return fallback; }
  }
  function captureDesignSnapshot() {
    var s = {};
    try {
      if (window.PNWProjector && PNWProjector.__tl && PNWProjector.__tl.settings)
        s = PNWProjector.__tl.settings() || {};
    } catch (e) {}
    return {
      version: 1,
      at: Date.now(),
      visual: cloneJson(readVisual(), {}),
      font: s.font || "Montserrat",
      size: parseInt(s.size, 10) || 56,
      align: s.align || "center",
      shadow: s.shadow || "strong",
      bg: cloneJson(s.bg || { kind: "none" }, { kind: "none" }),
    };
  }
  function paletteForMotion(id) {
    var map = {
      aurora: ["#07182a", "#08758a", "#8bf4ff"],
      ember: ["#170906", "#8d2f14", "#ffbf66"],
      starfall: ["#050713", "#182d69", "#9ecbff"],
      oceanic: ["#031a27", "#075a73", "#56d9e8"],
      bokehGlow: ["#160b22", "#6d2e87", "#e8a7ff"],
      lightRays: ["#0b1020", "#4d3b15", "#ffe7a1"],
      nebula: ["#09071b", "#402064", "#da84ff"],
      holyGrid: ["#081216", "#14444c", "#82e9f1"],
      dust: ["#17120d", "#63513c", "#e9d1a7"],
      pulseWave: ["#06121d", "#123d77", "#6cbcff"],
    };
    return map[id] || ["#09141d", "#12576a", "#69d7e8"];
  }
  function setMiniImage(vis, url, token) {
    if (!url) return;
    var safeUrl = String(url).replace(/"/g, "%22");
    if (vis.getAttribute("data-snapshot-token") !== token) return;
    vis.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.35)),url("' + safeUrl + '")';
    vis.style.backgroundSize = "cover";
    vis.style.backgroundPosition = "center";
  }
  function applySnapshotBackground(vis, snap) {
    vis.style.background = "";
    vis.style.backgroundColor = "";
    vis.style.backgroundImage = "";
    vis.style.backgroundSize = "";
    vis.style.backgroundPosition = "";
    vis.style.alignItems = "center";
    vis.removeAttribute("data-preview-kind");
    if (!snap) return;
    var bg = snap.bg || { kind: "none" };
    var kind = String(bg.kind || "none");
    var token = String(snap.at || 0) + "|" + kind + "|" + String(bg.value || "");
    vis.setAttribute("data-snapshot-token", token);
    vis.setAttribute("data-preview-kind", kind);
    if (kind === "color") {
      vis.style.backgroundColor = String(bg.value || "#141414");
    } else if (kind === "image") {
      if (String(bg.value || "").indexOf("idb:") === 0 && window.PNWMedia && PNWMedia.resolve) {
        vis.style.background = "linear-gradient(135deg,#172129,#0a1116)";
        PNWMedia.resolve(bg.value).then(function (u) { setMiniImage(vis, u, token); }).catch(function () {});
      } else setMiniImage(vis, bg.value, token);
    } else if (kind === "studio") {
      var p = bg.params || {};
      var a = p.color1 || "#061827", b = p.color2 || "#0b6076", c = p.accent || "#8af5ff";
      var ang = parseInt(p.angle, 10) || 25;
      vis.style.backgroundImage = "radial-gradient(circle at 72% 28%," + c + "55,transparent 38%),linear-gradient(" + ang + "deg," + a + "," + b + ")";
    } else if (kind === "motion") {
      var pal = paletteForMotion(bg.value), c1 = pal[0], c2 = pal[1], ac = pal[2];
      vis.style.backgroundImage = "radial-gradient(circle at 35% 35%," + ac + "55,transparent 32%),linear-gradient(135deg," + c1 + "," + c2 + ")";
    } else if (kind === "video" || kind === "upload" || kind === "lottie") {
      vis.style.backgroundImage = "radial-gradient(circle at 68% 25%,rgba(112,223,240,.35),transparent 30%),linear-gradient(135deg,#0b1820,#143942)";
    } else {
      vis.style.background = "linear-gradient(145deg,#171a1e,#0d0f12)";
    }
    var pos = (snap.visual || {}).pos || "middle";
    vis.style.alignItems = pos === "top" ? "flex-start" : pos === "bottom" ? "flex-end" : "center";
  }
  function updateDesignCommit() {
    var box = document.getElementById("cfDesignCommit");
    var status = document.getElementById("cfDesignCommitStatus");
    var btn = document.getElementById("cfApplyDesign");
    var snap = readDesignSnapshot();
    if (!box || !status || !btn) return;
    box.classList.toggle("is-applied", !!snap && !_designDirty);
    box.classList.toggle("is-dirty", !!snap && _designDirty);
    box.classList.toggle("is-pending", !snap);
    status.textContent = !snap ? "Belum diterapkan" : _designDirty ? "Ada perubahan belum diterapkan" : "Aktif di kotak Lyric";
    btn.textContent = !snap ? "Terapkan desain" : _designDirty ? "Perbarui kotak Lyric" : "Terapkan ulang";
  }
  function markDesignDirty() {
    if (!readDesignSnapshot()) return updateDesignCommit();
    _designDirty = true;
    updateDesignCommit();
    updateOperatorStory();
  }
  function applyDesignSnapshot() {
    var snap = captureDesignSnapshot();
    try { localStorage.setItem(DESIGN_SNAPSHOT_KEY, JSON.stringify(snap)); } catch (e) {}
    _designDirty = false;
    updateDesignCommit();
    syncMiniPreviews();
    try { document.dispatchEvent(new CustomEvent("cf:designApplied", { detail: snap })); } catch (e) {}
  }
  function buildDesignCommit() {
    var pane = q(".projPaneR");
    if (!pane) return false;
    var box = document.getElementById("cfDesignCommit");
    if (!box) {
      box = document.createElement("div");
      box.id = "cfDesignCommit";
      box.className = "cfDesignCommit";
      box.innerHTML = '<div><b>HASIL DESAIN LYRIC</b><span id="cfDesignCommitStatus"></span></div><button type="button" id="cfApplyDesign">Terapkan desain</button>';
      var head = q(".projPaneHead", pane);
      if (head && head.nextSibling) pane.insertBefore(box, head.nextSibling);
      else pane.insertBefore(box, pane.firstChild);
      document.getElementById("cfApplyDesign").onclick = applyDesignSnapshot;
    }
    if (!document.__cfDesignChangedV118) {
      document.__cfDesignChangedV118 = true;
      document.addEventListener("cf:designChanged", markDesignDirty);
    }
    updateDesignCommit();
    return true;
  }
  function buildOperatorStory() {
    var head = q(".cfLyricHead");
    if (!head) return false;
    var flow = document.getElementById("cfOperatorFlow");
    if (!flow) {
      flow = document.createElement("span");
      flow.id = "cfOperatorFlow";
      flow.className = "cfOperatorFlow";
      flow.setAttribute("aria-label", "Alur kerja cepat CastFlow");
      flow.innerHTML = '<button type="button" data-step="1"><i>1</i><span>Pilih</span></button><b>›</b><button type="button" data-step="2"><i>2</i><span>Desain</span></button><b>›</b><button type="button" data-step="3"><i>3</i><span>Tayang</span></button>';
      var toggle = q(".cfViewToggle", head);
      head.insertBefore(flow, toggle || null);
      flow.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest("[data-step]");
        if (!b) return;
        var n = b.getAttribute("data-step");
        if (n === "1") setFlowMode("lagu", true);
        if (n === "2") {
          var pane = q(".cfC-design .projPaneR");
          if (pane) pane.scrollTop = 0;
          var commit = document.getElementById("cfDesignCommit");
          if (commit) { commit.classList.remove("cfPulseOnce"); void commit.offsetWidth; commit.classList.add("cfPulseOnce"); }
        }
        if (n === "3") {
          var live = document.getElementById("projGoLive");
          if (live) { live.focus(); live.classList.remove("cfPulseOnce"); void live.offsetWidth; live.classList.add("cfPulseOnce"); }
        }
      });
    }
    updateOperatorStory();
    return true;
  }
  function updateOperatorStory() {
    var flow = document.getElementById("cfOperatorFlow");
    if (!flow) return;
    var hasLyric = !!document.querySelector(".projSlideCard");
    var applied = !!readDesignSnapshot();
    var stage = !hasLyric ? 1 : !applied || _designDirty ? 2 : 3;
    qa("[data-step]", flow).forEach(function (b) {
      var n = parseInt(b.getAttribute("data-step"), 10);
      b.classList.toggle("on", n === stage);
      b.classList.toggle("done", n < stage);
    });
  }
  function syncMiniPreviews() {
    var snap = readDesignSnapshot();
    qa(".projSlideCard").forEach(function (card) {
      var body = q(".projSlideBody", card);
      if (!body) return;
      var text = (body.innerText || body.textContent || "").trim();
      var vis = q(".cfMiniPreview", card);
      if (!vis) {
        vis = document.createElement("span");
        vis.className = "cfMiniPreview";
        vis.innerHTML = '<span class="cfMiniPreviewText"></span><span class="cfMiniMotionBadge"></span>';
        card.insertBefore(vis, body);
      }
      var t = q(".cfMiniPreviewText", vis);
      var badge = q(".cfMiniMotionBadge", vis);
      card.classList.toggle("cfMiniPending", !snap);
      vis.classList.toggle("pending", !snap);
      vis.classList.toggle("applied", !!snap);
      applySnapshotBackground(vis, snap);
      if (!snap) {
        t.textContent = "";
        if (badge) badge.textContent = "";
        return;
      }
      var v = snap.visual || {};
      t.textContent = text;
      t.style.fontFamily = '"' + (snap.font || "Montserrat") + '", sans-serif';
      t.style.fontWeight = String(v.weight || 500);
      t.style.textAlign = snap.align || "center";
      t.style.color = v.color || "#ffffff";
      t.style.letterSpacing = (parseFloat(v.spacing) || 0) * 0.18 + "px";
      t.style.lineHeight = String(parseFloat(v.lineHeight) || 1.2);
      t.style.textTransform = v.transform || "none";
      t.style.opacity = String(v.opacity == null ? 1 : v.opacity);
      t.style.fontSize = Math.max(7.5, Math.min(12, (parseInt(snap.size, 10) || 56) * 0.17)) + "px";
      var kind = String((snap.bg || {}).kind || "none");
      var motion = /^(motion|studio|video|upload|lottie)$/.test(kind);
      vis.classList.toggle("has-motion", motion);
      if (badge) badge.textContent = motion ? (kind === "studio" ? "Studio" : kind === "video" || kind === "upload" ? "Video" : "Motion") : "";
    });
    updateOperatorStory();
    updateDesignCommit();
  }

  /* ---------------- visual design state ---------------- */
  function readVisual() {
    var d = {
      color: "#ffffff",
      weight: 500,
      spacing: 0,
      lineHeight: 1.2,
      opacity: 1,
      transform: "none",
      pos: "middle",
      transition: "fade",
      transitionOut: "fade",
      duration: 0.55,
      durationOut: 0.28,
    };
    try {
      var x = JSON.parse(localStorage.getItem(VISUAL_KEY) || "null");
      if (x && typeof x === "object") Object.keys(x).forEach(function (k) { d[k] = x[k]; });
    } catch (e) {}
    return d;
  }
  function saveVisual(v, replay) {
    try { localStorage.setItem(VISUAL_KEY, JSON.stringify(v)); } catch (e) {}
    markDesignDirty();
    applyVisualPreview(v, !!replay);
  }
  function removePreviewMotionClasses(t) {
    TRANSITIONS_IN.forEach(function (tr) { t.classList.remove("cfTextIn-" + tr.id, "cfTextAnim-" + tr.id); });
    TRANSITIONS_OUT.forEach(function (tr) { t.classList.remove("cfTextOut-" + tr.id); });
  }
  function applyVisualPreview(v, replay) {
    var t = document.getElementById("projPreviewText");
    if (!t) return;
    t.style.color = v.color || "#ffffff";
    t.style.fontWeight = String(v.weight || 500);
    t.style.letterSpacing = (parseFloat(v.spacing) || 0) + "px";
    t.style.lineHeight = String(parseFloat(v.lineHeight) || 1.2);
    t.style.opacity = String(v.opacity == null ? 1 : v.opacity);
    t.style.textTransform = v.transform || "none";
    t.setAttribute("data-position", v.pos || "middle");
    t.style.setProperty("--cf-motion-duration", (parseFloat(v.duration) || 0.55) + "s");
    t.style.setProperty("--cf-motion-out-duration", (parseFloat(v.durationOut) || 0.28) + "s");
    if (_previewAnimTimer) clearTimeout(_previewAnimTimer);
    var token = ++_previewAnimToken;
    removePreviewMotionClasses(t);
    if (replay) {
      var outId = v.transitionOut || "fade";
      var inId = v.transition || "fade";
      var enter = function () {
        if (token !== _previewAnimToken) return;
        removePreviewMotionClasses(t);
        void t.offsetWidth;
        if (inId !== "cut") t.classList.add("cfTextIn-" + inId);
      };
      if (outId !== "cut") {
        t.classList.add("cfTextOut-" + outId);
        _previewAnimTimer = setTimeout(enter, Math.max(80, (parseFloat(v.durationOut) || 0.28) * 1000));
      } else enter();
    }
    syncMiniPreviews();
  }

  function updateFontButton() {
    var select = document.getElementById("projFont");
    var btn = document.getElementById("cfFontPickerBtn");
    var sample = document.getElementById("cfFontSample");
    if (!select) return;
    var name = select.value || "Montserrat";
    if (btn) {
      btn.textContent = name;
      btn.style.fontFamily = '"' + name + '", sans-serif';
    }
    if (sample) {
      sample.style.fontFamily = '"' + name + '", sans-serif';
      sample.querySelector("b").textContent = name;
    }
    if (window.PNWYouthViews && PNWYouthViews.ensureFont) PNWYouthViews.ensureFont(name);
    qa("option", select).forEach(function (o) { o.style.fontFamily = '"' + o.value + '", sans-serif'; });
  }
  function renderFontList(filter) {
    var list = document.getElementById("cfFontList");
    var select = document.getElementById("projFont");
    if (!list || !select) return;
    var names = (window.PNWProjector && PNWProjector.fonts) ? PNWProjector.fonts.slice() : qa("option", select).map(function (o) { return o.value; });
    var f = String(filter || "").trim().toLowerCase();
    if (f) names = names.filter(function (n) { return String(n).toLowerCase().indexOf(f) >= 0; });
    names = names.slice(0, 80);
    list.innerHTML = "";
    names.forEach(function (name) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cfFontOption" + (name === select.value ? " on" : "");
      b.textContent = name;
      b.style.fontFamily = '"' + name + '", sans-serif';
      b.onmouseenter = function () { if (window.PNWYouthViews && PNWYouthViews.ensureFont) PNWYouthViews.ensureFont(name); };
      b.onclick = function () {
        select.value = name;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        var menu = document.getElementById("cfFontMenu");
        if (menu) menu.hidden = true;
        updateFontButton();
      };
      list.appendChild(b);
    });
  }
  function buildFontPicker() {
    var select = document.getElementById("projFont");
    if (!select || document.getElementById("cfFontPickerBtn")) return;
    var field = select.closest(".projField") || select.parentNode;
    select.classList.add("cfNativeFontSelect");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "cfFontPickerBtn";
    btn.className = "cfFontPickerBtn";
    field.insertBefore(btn, select);
    var sample = document.createElement("div");
    sample.id = "cfFontSample";
    sample.className = "cfFontSample";
    sample.innerHTML = '<span>Aa</span><div><b>Montserrat</b><small>The quick brown fox 123</small></div>';
    field.insertBefore(sample, select.nextSibling);
    var menu = document.createElement("div");
    menu.id = "cfFontMenu";
    menu.className = "cfFontMenu";
    menu.hidden = true;
    menu.innerHTML = '<input type="search" id="cfFontSearch" placeholder="Search fonts"><div id="cfFontList" class="cfFontList"></div>';
    document.body.appendChild(menu);
    btn.onclick = function (e) {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      if (!menu.hidden) {
        var r = btn.getBoundingClientRect();
        menu.style.left = Math.max(8, r.left) + "px";
        menu.style.top = Math.min(window.innerHeight - 360, r.bottom + 6) + "px";
        menu.style.width = Math.max(230, r.width) + "px";
        renderFontList(document.getElementById("cfFontSearch").value);
        document.getElementById("cfFontSearch").focus();
      }
    };
    document.getElementById("cfFontSearch").oninput = function () { renderFontList(this.value); };
    document.addEventListener("click", function (e) {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) menu.hidden = true;
    });
    select.addEventListener("change", updateFontButton);
    updateFontButton();
  }

  function fieldRow(label, control) {
    return '<label class="cfDesignRow"><span>' + label + "</span>" + control + "</label>";
  }
  function paintMotionButtons(host, list, kind) {
    if (!host) return;
    list.forEach(function (tr) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cfMotionChoice";
      b.setAttribute("data-motion-" + kind, tr.id);
      b.innerHTML = '<span class="cfMotionDemo cfMotionDemo-' + tr.id + '"></span><b>' + tr.label + "</b>";
      host.appendChild(b);
    });
  }
  function buildAdvancedDesign() {
    var pane = q(".projPaneR");
    var bgTabs = document.getElementById("projBgTabs");
    if (!pane || !bgTabs || document.getElementById("cfDesignPro")) return;
    var h3 = q(".projPaneHead h3", pane);
    if (h3) h3.textContent = "DESIGN PANEL";
    var live = document.getElementById("projLiveDot");
    if (live) live.title = "Status tayangan saat ini";
    var pro = document.createElement("div");
    pro.id = "cfDesignPro";
    pro.className = "cfDesignPro";
    pro.innerHTML =
      '<details class="cfDesignGroup" open><summary>Tipografi</summary><div class="cfDesignGroupBody">' +
      fieldRow("Warna teks", '<input id="cfTextColor" type="color">') +
      fieldRow("Ketebalan", '<select id="cfTextWeight"><option>300</option><option>400</option><option selected>500</option><option>600</option><option>700</option><option>800</option></select>') +
      fieldRow("Jarak huruf", '<span class="cfRangeWithValue"><input id="cfTextSpacing" type="range" min="-2" max="12" step="0.2"><output id="cfTextSpacingVal"></output></span>') +
      fieldRow("Jarak baris", '<span class="cfRangeWithValue"><input id="cfTextLine" type="range" min="0.8" max="2" step="0.05"><output id="cfTextLineVal"></output></span>') +
      fieldRow("Opacity", '<span class="cfRangeWithValue"><input id="cfTextOpacity" type="range" min="0.2" max="1" step="0.05"><output id="cfTextOpacityVal"></output></span>') +
      fieldRow("Huruf", '<select id="cfTextTransform"><option value="none">Sesuai teks</option><option value="uppercase">KAPITAL</option><option value="lowercase">huruf kecil</option></select>') +
      fieldRow("Posisi", '<select id="cfTextPosition"><option value="top">Atas</option><option value="middle">Tengah</option><option value="bottom">Bawah</option></select>') +
      "</div></details>" +
      '<details class="cfDesignGroup" open><summary>Animasi masuk</summary><div class="cfDesignGroupBody">' +
      '<div class="cfMotionGrid cfMotionGridIn" id="cfMotionGridIn"></div>' +
      fieldRow("Durasi masuk", '<span class="cfRangeWithValue"><input id="cfMotionDuration" type="range" min="0.15" max="2" step="0.05"><output id="cfMotionDurationVal"></output></span>') +
      "</div></details>" +
      '<details class="cfDesignGroup"><summary>Animasi keluar</summary><div class="cfDesignGroupBody">' +
      '<div class="cfMotionGrid cfMotionGridOut" id="cfMotionGridOut"></div>' +
      fieldRow("Durasi keluar", '<span class="cfRangeWithValue"><input id="cfMotionOutDuration" type="range" min="0.1" max="1.2" step="0.05"><output id="cfMotionOutDurationVal"></output></span>') +
      "</div></details>" +
      '<button type="button" class="cfDesignPreviewBtn" id="cfReplayMotion">Preview masuk + keluar</button>';
    var bgLabel = bgTabs.previousElementSibling;
    pane.insertBefore(pro, bgLabel || bgTabs);
    if (bgLabel && bgLabel.classList.contains("label")) bgLabel.textContent = "LATAR & ASET VISUAL";
    paintMotionButtons(document.getElementById("cfMotionGridIn"), TRANSITIONS_IN, "in");
    paintMotionButtons(document.getElementById("cfMotionGridOut"), TRANSITIONS_OUT, "out");
    var v = readVisual();
    var ids = {
      cfTextColor: "color",
      cfTextWeight: "weight",
      cfTextSpacing: "spacing",
      cfTextLine: "lineHeight",
      cfTextOpacity: "opacity",
      cfTextTransform: "transform",
      cfTextPosition: "pos",
      cfMotionDuration: "duration",
      cfMotionOutDuration: "durationOut",
    };
    Object.keys(ids).forEach(function (id) {
      var input = document.getElementById(id);
      var key = ids[id];
      if (!input) return;
      input.value = v[key];
      var fn = function () {
        v[key] = input.type === "range" || key === "weight" ? parseFloat(input.value) : input.value;
        saveVisual(v, false);
        syncDesignValues(v);
      };
      input.addEventListener(input.type === "range" || input.type === "color" ? "input" : "change", fn);
    });
    qa("[data-motion-in]", pro).forEach(function (b) {
      b.onclick = function () {
        v.transition = b.getAttribute("data-motion-in");
        saveVisual(v, true);
        syncDesignValues(v);
      };
    });
    qa("[data-motion-out]", pro).forEach(function (b) {
      b.onclick = function () {
        v.transitionOut = b.getAttribute("data-motion-out");
        saveVisual(v, true);
        syncDesignValues(v);
      };
    });
    document.getElementById("cfReplayMotion").onclick = function () { applyVisualPreview(v, true); };
    syncDesignValues(v);
    applyVisualPreview(v, false);
  }
  function syncDesignValues(v) {
    var values = {
      cfTextSpacingVal: (parseFloat(v.spacing) || 0).toFixed(1) + "px",
      cfTextLineVal: (parseFloat(v.lineHeight) || 1.2).toFixed(2),
      cfTextOpacityVal: Math.round((parseFloat(v.opacity) || 1) * 100) + "%",
      cfMotionDurationVal: (parseFloat(v.duration) || 0.55).toFixed(2) + "s",
      cfMotionOutDurationVal: (parseFloat(v.durationOut) || 0.28).toFixed(2) + "s",
    };
    Object.keys(values).forEach(function (id) { var x = document.getElementById(id); if (x) x.textContent = values[id]; });
    qa("[data-motion-in]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-motion-in") === (v.transition || "fade")); });
    qa("[data-motion-out]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-motion-out") === (v.transitionOut || "fade")); });
  }
  /* ---- v112: Mask — pengaman proyeksi (bar hitam atas/bawah, %) ---- */
  var MASK_KEY = "pnwCastflowMask.v1";
  function maskClamp(v) {
    v = parseInt(v, 10);
    if (isNaN(v) || v < 0) return 0;
    return Math.min(30, v);
  }
  function readMask() {
    try {
      var m = JSON.parse(localStorage.getItem(MASK_KEY) || "null");
      if (m && typeof m === "object")
        return { top: maskClamp(m.top), bottom: maskClamp(m.bottom) };
    } catch (e) {}
    return { top: 0, bottom: 0 };
  }
  function saveMask(m) {
    try {
      localStorage.setItem(MASK_KEY, JSON.stringify(m));
    } catch (e) {}
  }
  function buildMaskRow() {
    var row = document.getElementById("cfMaskRow");
    if (!row || row.dataset.built) return;
    row.dataset.built = "1";
    var m = readMask();
    row.innerHTML =
      '<span class="cfMaskLbl">MASK</span>' +
      '<label>Atas <input id="cfMaskTop" type="number" min="0" max="30" value="' + m.top + '"></label>' +
      '<label>Bawah <input id="cfMaskBottom" type="number" min="0" max="30" value="' + m.bottom + '"></label>' +
      '<span class="cfMaskUnit">%</span>';
    function onCh() {
      saveMask({
        top: maskClamp((document.getElementById("cfMaskTop") || {}).value),
        bottom: maskClamp((document.getElementById("cfMaskBottom") || {}).value),
      });
    }
    var ins = row.querySelectorAll("input");
    for (var i = 0; i < ins.length; i++) ins[i].onchange = onCh;
  }

  function enhanceDesignPanel() {
    var pane = q(".projPaneR");
    if (!pane) return false;
    var h3 = q(".projPaneHead h3", pane);
    if (h3) h3.textContent = "DESIGN PANEL";
    buildFontPicker();
    buildDesignCommit();
    buildAdvancedDesign();
    buildThemeRow();
    buildMaskRow();
    buildOperatorStory();
    updateFontButton();
    return true;
  }

  /* ---------------- Edit / Live / Dual preview ---------------- */
  function setPreviewMode(mode) {
    if (["edit", "live", "dual"].indexOf(mode) < 0) mode = "edit";
    var stage = document.getElementById("cfPrevStage");
    if (!stage) return;
    stage.setAttribute("data-preview-mode", mode);
    qa("#cfPreviewModes [data-preview-mode]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-preview-mode") === mode);
    });
    try { localStorage.setItem(PREVIEW_MODE_KEY, mode); } catch (e) {}
    /* v116: Dual bukan split 50/50 lagi; delegasikan ke Free Canvas. */
    try {
      if (
        window.CastFlowDualCanvas &&
        typeof window.CastFlowDualCanvas.setActive === "function"
      )
        window.CastFlowDualCanvas.setActive(mode === "dual");
    } catch (e) {}
  }
  function buildPreviewModes() {
    var head = q(".cfC-preview .cfPrevHead");
    var stage = document.getElementById("cfPrevStage");
    if (!head || !stage) return false;
    if (!document.getElementById("cfPreviewModes")) {
      var modes = document.createElement("span");
      modes.id = "cfPreviewModes";
      modes.className = "cfPreviewModes";
      modes.innerHTML = '<button type="button" data-preview-mode="edit">Edit</button><button type="button" data-preview-mode="live">Live</button><button type="button" data-preview-mode="dual">Dual</button>';
      var spacer = q(".cfPrevSpacer", head);
      head.insertBefore(modes, spacer || head.firstChild);
      qa("[data-preview-mode]", modes).forEach(function (b) {
        b.onclick = function () { setPreviewMode(b.getAttribute("data-preview-mode")); };
      });
    }
    if (!document.getElementById("cfLiveFrame")) {
      var frame = document.createElement("iframe");
      frame.id = "cfLiveFrame";
      frame.className = "cfLiveFrame";
      frame.title = "Current live projector output";
      frame.src = "./castflow.html?mode=display&embed=1";
      stage.appendChild(frame);
      var editLabel = document.createElement("span");
      editLabel.className = "cfPreviewPaneLabel cfEditLabel";
      editLabel.textContent = "EDIT";
      stage.appendChild(editLabel);
      var liveLabel = document.createElement("span");
      liveLabel.className = "cfPreviewPaneLabel cfLiveLabel";
      liveLabel.textContent = "LIVE";
      stage.appendChild(liveLabel);
    }
    var saved = "edit";
    try { saved = localStorage.getItem(PREVIEW_MODE_KEY) || "edit"; } catch (e) {}
    setPreviewMode(saved);
    return true;
  }

  /* ---------------- orchestration ---------------- */
  function init() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      safe("top", buildTopBrand);
      safe("features", hookFeatures);
      safe("design", enhanceDesignPanel);
      safe("previewModes", buildPreviewModes);
      safe("mini", syncMiniPreviews);
      if (tries > 160) clearInterval(iv);
    }, 250);
    uiEvery(function () {
      safe("title", updateFlowHeader);
      safe("brand", buildTopBrand);
      safe("mini", syncMiniPreviews);
      safe("font", updateFontButton);
      safe("designTitle", function () {
        var h = q(".cfC-design .projPaneHead h3");
        if (h && h.textContent !== "DESIGN PANEL") h.textContent = "DESIGN PANEL";
      });
    }, 900, "flow-design-sync");
  }

  window.CastFlowV100 = {
    version: "v9.18",
    setFlowMode: function (mode) { setFlowMode(mode, true); },
    setPreviewMode: setPreviewMode,
    readVisual: readVisual,
    applyTheme: applyTheme,
    buildThemeRow: buildThemeRow,
    THEMES: THEMES,
    readMask: readMask,
    buildMaskRow: buildMaskRow,
    applyVisualPreview: applyVisualPreview,
    syncMiniPreviews: syncMiniPreviews,
    applyDesignSnapshot: applyDesignSnapshot,
    readDesignSnapshot: readDesignSnapshot,
    transitionsIn: TRANSITIONS_IN,
    transitionsOut: TRANSITIONS_OUT,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
