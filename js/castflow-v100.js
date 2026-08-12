/* CastFlow v100 UI architecture layer
   Features-first navigation · dynamic Flow · Design Panel · Edit/Live/Dual preview */
(function () {
  "use strict";

  var VISUAL_KEY = "pnwCastflowVisualStyle.v2";
  var PREVIEW_MODE_KEY = "pnwCastflowPreviewMode.v2";
  var FLOW_TITLES = {
    lagu: "LYRIC",
    alkitab: "BIBLE EDIT",
    teks: "TEXT",
    media: "MEDIA",
    template: "TEMPLATE",
  };
  var TRANSITIONS = [
    { id: "cut", label: "Cut" },
    { id: "fade", label: "Fade" },
    { id: "rise", label: "Rise" },
    { id: "slide-left", label: "Slide" },
    { id: "zoom", label: "Zoom" },
    { id: "blur", label: "Blur" },
    { id: "pop", label: "Pop" },
    { id: "typewriter", label: "Type" },
  ];

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
  function copyPreviewBackground(vis, source) {
    var cs = source ? getComputedStyle(source) : null;
    vis.style.backgroundColor = cs ? cs.backgroundColor : "#141414";
    vis.style.backgroundImage = cs ? cs.backgroundImage : "none";
    vis.style.backgroundSize = cs ? cs.backgroundSize : "cover";
    vis.style.backgroundPosition = cs ? cs.backgroundPosition : "center";
    var db = source ? source.getAttribute("data-bg") : "";
    vis.setAttribute("data-bg", db || "");
  }
  function syncMiniPreviews() {
    var source = document.getElementById("projPreview");
    var sourceText = document.getElementById("projPreviewText");
    qa(".projSlideCard").forEach(function (card) {
      var body = q(".projSlideBody", card);
      if (!body) return;
      var text = (body.innerText || body.textContent || "").trim();
      var vis = q(".cfMiniPreview", card);
      if (!vis) {
        vis = document.createElement("span");
        vis.className = "cfMiniPreview";
        vis.innerHTML = '<span class="cfMiniPreviewText"></span><span class="cfMiniMotionBadge">Motion</span>';
        card.insertBefore(vis, body);
      }
      var t = q(".cfMiniPreviewText", vis);
      card.classList.toggle("cfMiniEmpty", !text);
      vis.classList.toggle("empty", !text);
      if (!text) {
        t.textContent = "";
        vis.style.backgroundImage = "";
        vis.style.backgroundColor = "";
      } else {
        copyPreviewBackground(vis, source);
        t.textContent = text;
        if (sourceText) {
          var ts = getComputedStyle(sourceText);
          t.style.fontFamily = ts.fontFamily;
          t.style.fontWeight = ts.fontWeight;
          t.style.textAlign = ts.textAlign;
          t.style.color = ts.color;
          t.style.letterSpacing = ts.letterSpacing;
          t.style.lineHeight = ts.lineHeight;
        }
      }
      var hasMotion = !!(source && (source.querySelector("video") || source.getAttribute("data-bg")));
      vis.classList.toggle("has-motion", hasMotion && !!text);
    });
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
      duration: 0.55,
    };
    try {
      var x = JSON.parse(localStorage.getItem(VISUAL_KEY) || "null");
      if (x && typeof x === "object") Object.keys(x).forEach(function (k) { d[k] = x[k]; });
    } catch (e) {}
    return d;
  }
  function saveVisual(v) {
    try { localStorage.setItem(VISUAL_KEY, JSON.stringify(v)); } catch (e) {}
    applyVisualPreview(v, true);
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
    if (replay) {
      TRANSITIONS.forEach(function (tr) { t.classList.remove("cfTextAnim-" + tr.id); });
      void t.offsetWidth;
      if (v.transition && v.transition !== "cut") t.classList.add("cfTextAnim-" + v.transition);
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
  function buildAdvancedDesign() {
    var pane = q(".projPaneR");
    var bgTabs = document.getElementById("projBgTabs");
    if (!pane || !bgTabs || document.getElementById("cfDesignPro")) return;
    var h3 = q(".projPaneHead h3", pane);
    if (h3) h3.textContent = "DESIGN PANEL";
    var live = document.getElementById("projLiveDot");
    if (live) live.title = "Current live state";
    var pro = document.createElement("div");
    pro.id = "cfDesignPro";
    pro.className = "cfDesignPro";
    pro.innerHTML =
      '<details class="cfDesignGroup" open><summary>Typography</summary><div class="cfDesignGroupBody">' +
      fieldRow("Text color", '<input id="cfTextColor" type="color">') +
      fieldRow("Weight", '<select id="cfTextWeight"><option>300</option><option>400</option><option selected>500</option><option>600</option><option>700</option><option>800</option></select>') +
      fieldRow("Letter spacing", '<span class="cfRangeWithValue"><input id="cfTextSpacing" type="range" min="-2" max="12" step="0.2"><output id="cfTextSpacingVal"></output></span>') +
      fieldRow("Line height", '<span class="cfRangeWithValue"><input id="cfTextLine" type="range" min="0.8" max="2" step="0.05"><output id="cfTextLineVal"></output></span>') +
      fieldRow("Opacity", '<span class="cfRangeWithValue"><input id="cfTextOpacity" type="range" min="0.2" max="1" step="0.05"><output id="cfTextOpacityVal"></output></span>') +
      fieldRow("Case", '<select id="cfTextTransform"><option value="none">As typed</option><option value="uppercase">UPPERCASE</option><option value="lowercase">lowercase</option></select>') +
      fieldRow("Position", '<select id="cfTextPosition"><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select>') +
      "</div></details>" +
      '<details class="cfDesignGroup" open><summary>Text motion & transition</summary><div class="cfDesignGroupBody">' +
      '<div class="cfMotionGrid" id="cfMotionGrid"></div>' +
      fieldRow("Duration", '<span class="cfRangeWithValue"><input id="cfMotionDuration" type="range" min="0.15" max="2" step="0.05"><output id="cfMotionDurationVal"></output></span>') +
      '<button type="button" class="cfDesignPreviewBtn" id="cfReplayMotion">Preview animation</button>' +
      "</div></details>";
    var bgLabel = bgTabs.previousElementSibling;
    pane.insertBefore(pro, bgLabel || bgTabs);
    if (bgLabel && bgLabel.classList.contains("label")) bgLabel.textContent = "BACKGROUND & VISUAL ASSETS";
    var grid = document.getElementById("cfMotionGrid");
    TRANSITIONS.forEach(function (tr) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cfMotionChoice";
      b.setAttribute("data-motion", tr.id);
      b.innerHTML = '<span class="cfMotionDemo cfMotionDemo-' + tr.id + '"></span><b>' + tr.label + "</b>";
      grid.appendChild(b);
    });
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
    };
    Object.keys(ids).forEach(function (id) {
      var el = document.getElementById(id);
      var key = ids[id];
      if (!el) return;
      el.value = v[key];
      var fn = function () {
        v[key] = el.type === "range" || key === "weight" ? parseFloat(el.value) : el.value;
        saveVisual(v);
        syncDesignValues(v);
      };
      el.addEventListener(el.type === "range" ? "input" : "change", fn);
    });
    qa(".cfMotionChoice", grid).forEach(function (b) {
      b.onclick = function () {
        v.transition = b.getAttribute("data-motion");
        saveVisual(v);
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
    };
    Object.keys(values).forEach(function (id) { var x = document.getElementById(id); if (x) x.textContent = values[id]; });
    qa(".cfMotionChoice").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-motion") === v.transition); });
  }
  function enhanceDesignPanel() {
    var pane = q(".projPaneR");
    if (!pane) return false;
    var h3 = q(".projPaneHead h3", pane);
    if (h3) h3.textContent = "DESIGN PANEL";
    buildFontPicker();
    buildAdvancedDesign();
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
    version: "v9.8",
    setFlowMode: function (mode) { setFlowMode(mode, true); },
    setPreviewMode: setPreviewMode,
    readVisual: readVisual,
    applyVisualPreview: applyVisualPreview,
    syncMiniPreviews: syncMiniPreviews,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
