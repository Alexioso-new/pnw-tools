/* CastFlow v100 — Features-first workspace */
(function () {
  "use strict";
  var VISUAL_KEY = "pnwCastflowVisualStyle.v2";
  var PREVIEW_KEY = "pnwCastflowPreviewMode.v2";
  var FLOW = { lagu: "LYRIC", alkitab: "BIBLE EDIT", teks: "TEXT", media: "MEDIA", template: "TEMPLATE" };
  var MOTIONS = ["cut", "fade", "rise", "slide-left", "zoom", "blur", "pop", "typewriter"];
  var flowMode = "lagu";

  function q(s, r) { return (r || document).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function safe(n, fn) {
    try { return fn(); }
    catch (e) { (window.PNWDiag = window.PNWDiag || []).push({ feature: "castflow.v100." + n, error: String((e && e.message) || e), at: Date.now() }); }
  }

  function buildTopBrand() {
    var bar = document.getElementById("yvBar");
    if (!bar) return false;
    var hero = q(".cfHeroLogo");
    if (hero) hero.remove();
    if (!document.getElementById("cfTopBrand")) {
      var img = document.createElement("img");
      img.id = "cfTopBrand"; img.className = "cfTopBrand";
      img.src = "./castflow-topbar.png"; img.alt = "CastFlow";
      bar.appendChild(img);
    }
    var main = q(".yvBar > a.yvBarBtn"); if (main) main.textContent = "Main app";
    var avatar = document.getElementById("cfAvatarBtn");
    if (avatar) {
      avatar.innerHTML = '<span class="cfUserGlyph" aria-hidden="true"><span></span></span><span class="cfSrOnly">Account</span>';
      avatar.title = "Account";
    }
    var duplicateTimeline = q('.cfC-menu [data-rail="timeline"]'); if (duplicateTimeline) duplicateTimeline.remove();
    var si = q(".cfGSIcon"); if (si) si.remove();
    var gs = document.getElementById("cfGlobalSearch"); if (gs) gs.placeholder = "Search songs, verses, media";
    var pop = document.getElementById("cfPopBtn"); if (pop) { pop.textContent = "Pop out"; pop.title = "Open floating preview"; }
    var prev = document.getElementById("projPrevSlide"); if (prev) prev.textContent = "Prev";
    var next = document.getElementById("projNextSlide"); if (next) next.textContent = "Next";
    var empty = q(".cfPrevEmpty"); if (empty) empty.textContent = "Preview is floating. Use Dock to restore it.";
    var dock = document.getElementById("cfDockBtn"); if (dock) dock.textContent = "Dock";
    return true;
  }

  function updateFlowHeader() {
    var cell = q(".cfC-lyric"), title = q(".cfLyricTitle"), toggle = q(".cfViewToggle");
    if (!cell || !title) return;
    cell.setAttribute("data-flow-mode", flowMode);
    if (toggle) toggle.hidden = flowMode !== "lagu";
    title.textContent = flowMode === "lagu" ? (cell.classList.contains("showTl") ? "TIMELINE" : "LYRIC") : (FLOW[flowMode] || "FLOW");
  }
  function setFlowMode(mode, clickTab) {
    if (!FLOW[mode]) mode = "lagu";
    flowMode = mode;
    if (mode !== "lagu" && window.CastFlow && CastFlow.setLyricView) CastFlow.setLyricView("lyric");
    if (clickTab) { var tab = q('#projTabs [data-tab="' + mode + '"]'); if (tab) tab.click(); }
    updateFlowHeader();
  }
  function hookFeatures() {
    var rail = document.getElementById("projRail"), cell = q(".cfC-lyric");
    if (!rail || !cell) return false;
    qa(".cfViewToggle [data-cfview]", cell).forEach(function (b) {
      b.textContent = b.getAttribute("data-cfview") === "timeline" ? "Timeline" : "Lyric";
      if (!b.__v100) { b.__v100 = true; b.addEventListener("click", function () { setTimeout(updateFlowHeader, 20); }); }
    });
    qa(".projRailBtn[data-rail]", rail).forEach(function (b) {
      if (b.__v100) return; b.__v100 = true;
      b.addEventListener("click", function () { var id = b.getAttribute("data-rail"); if (FLOW[id]) setTimeout(function () { setFlowMode(id, false); }, 20); });
    });
    var tabs = document.getElementById("projTabs");
    if (tabs && !tabs.__v100) {
      tabs.__v100 = true;
      qa("[data-tab]", tabs).forEach(function (b) { b.addEventListener("click", function () { var m = b.getAttribute("data-tab"); if (FLOW[m]) setTimeout(function () { setFlowMode(m, false); }, 10); }); });
    }
    setFlowMode(flowMode, false);
    return true;
  }

  function copyBg(to, from) {
    var cs = from ? getComputedStyle(from) : null;
    to.style.backgroundColor = cs ? cs.backgroundColor : "#141414";
    to.style.backgroundImage = cs ? cs.backgroundImage : "none";
    to.style.backgroundSize = cs ? cs.backgroundSize : "cover";
    to.style.backgroundPosition = cs ? cs.backgroundPosition : "center";
    to.setAttribute("data-bg", from ? (from.getAttribute("data-bg") || "") : "");
  }
  function syncMiniPreviews() {
    var src = document.getElementById("projPreview"), srcText = document.getElementById("projPreviewText");
    qa(".projSlideCard").forEach(function (card) {
      var body = q(".projSlideBody", card); if (!body) return;
      var text = (body.innerText || body.textContent || "").trim();
      var vis = q(".cfMiniPreview", card);
      if (!vis) {
        vis = document.createElement("span"); vis.className = "cfMiniPreview";
        vis.innerHTML = '<span class="cfMiniPreviewText"></span><span class="cfMiniMotionBadge">Motion</span>';
        card.insertBefore(vis, body);
      }
      var t = q(".cfMiniPreviewText", vis);
      card.classList.toggle("cfMiniEmpty", !text); vis.classList.toggle("empty", !text);
      if (!text) { t.textContent = ""; vis.style.backgroundImage = ""; vis.style.backgroundColor = ""; }
      else {
        copyBg(vis, src); t.textContent = text;
        if (srcText) {
          var st = getComputedStyle(srcText);
          t.style.fontFamily = st.fontFamily; t.style.fontWeight = st.fontWeight;
          t.style.textAlign = st.textAlign; t.style.color = st.color;
          t.style.letterSpacing = st.letterSpacing; t.style.lineHeight = st.lineHeight;
        }
      }
      vis.classList.toggle("has-motion", !!text && !!(src && (src.querySelector("video") || src.getAttribute("data-bg"))));
    });
  }

  function visual() {
    var v = { color: "#ffffff", weight: 500, spacing: 0, lineHeight: 1.2, opacity: 1, transform: "none", pos: "middle", transition: "fade", duration: .55 };
    try { var x = JSON.parse(localStorage.getItem(VISUAL_KEY) || "null"); if (x) Object.keys(x).forEach(function (k) { v[k] = x[k]; }); } catch (e) {}
    return v;
  }
  function saveVisual(v) { try { localStorage.setItem(VISUAL_KEY, JSON.stringify(v)); } catch (e) {} applyVisual(v, true); }
  function applyVisual(v, replay) {
    var t = document.getElementById("projPreviewText"); if (!t) return;
    t.style.color = v.color; t.style.fontWeight = String(v.weight); t.style.letterSpacing = (+v.spacing || 0) + "px";
    t.style.lineHeight = String(+v.lineHeight || 1.2); t.style.opacity = String(v.opacity == null ? 1 : v.opacity);
    t.style.textTransform = v.transform || "none"; t.setAttribute("data-position", v.pos || "middle");
    t.style.setProperty("--cf-motion-duration", (+v.duration || .55) + "s");
    if (replay) { MOTIONS.forEach(function (m) { t.classList.remove("cfTextAnim-" + m); }); void t.offsetWidth; if (v.transition !== "cut") t.classList.add("cfTextAnim-" + v.transition); }
    syncMiniPreviews();
  }

  function updateFontButton() {
    var sel = document.getElementById("projFont"), btn = document.getElementById("cfFontPickerBtn"), sample = document.getElementById("cfFontSample");
    if (!sel) return; var name = sel.value || "Montserrat";
    if (btn) { btn.textContent = name; btn.style.fontFamily = '"' + name + '", sans-serif'; }
    if (sample) { sample.style.fontFamily = '"' + name + '", sans-serif'; q("b", sample).textContent = name; }
    qa("option", sel).forEach(function (o) { o.style.fontFamily = '"' + o.value + '", sans-serif'; });
    if (window.PNWYouthViews && PNWYouthViews.ensureFont) PNWYouthViews.ensureFont(name);
  }
  function renderFontList(filter) {
    var list = document.getElementById("cfFontList"), sel = document.getElementById("projFont"); if (!list || !sel) return;
    var names = window.PNWProjector && PNWProjector.fonts ? PNWProjector.fonts.slice() : qa("option", sel).map(function (o) { return o.value; });
    var f = String(filter || "").toLowerCase(); if (f) names = names.filter(function (n) { return n.toLowerCase().indexOf(f) >= 0; });
    list.innerHTML = "";
    names.slice(0, 80).forEach(function (name) {
      var b = document.createElement("button"); b.type = "button"; b.className = "cfFontOption" + (name === sel.value ? " on" : "");
      b.textContent = name; b.style.fontFamily = '"' + name + '", sans-serif';
      b.onmouseenter = function () { if (window.PNWYouthViews && PNWYouthViews.ensureFont) PNWYouthViews.ensureFont(name); };
      b.onclick = function () { sel.value = name; sel.dispatchEvent(new Event("change", { bubbles: true })); document.getElementById("cfFontMenu").hidden = true; updateFontButton(); };
      list.appendChild(b);
    });
  }
  function buildFontPicker() {
    var sel = document.getElementById("projFont"); if (!sel || document.getElementById("cfFontPickerBtn")) return;
    var field = sel.closest(".projField") || sel.parentNode; sel.classList.add("cfNativeFontSelect");
    var btn = document.createElement("button"); btn.type = "button"; btn.id = "cfFontPickerBtn"; btn.className = "cfFontPickerBtn"; field.insertBefore(btn, sel);
    var sample = document.createElement("div"); sample.id = "cfFontSample"; sample.className = "cfFontSample";
    sample.innerHTML = '<span>Aa</span><div><b>Montserrat</b><small>The quick brown fox 123</small></div>'; field.insertBefore(sample, sel.nextSibling);
    var menu = document.createElement("div"); menu.id = "cfFontMenu"; menu.className = "cfFontMenu"; menu.hidden = true;
    menu.innerHTML = '<input type="search" id="cfFontSearch" placeholder="Search fonts"><div id="cfFontList" class="cfFontList"></div>'; document.body.appendChild(menu);
    btn.onclick = function (e) { e.stopPropagation(); menu.hidden = !menu.hidden; if (!menu.hidden) { var r = btn.getBoundingClientRect(); menu.style.left = Math.max(8, r.left) + "px"; menu.style.top = Math.max(8, Math.min(innerHeight - 360, r.bottom + 6)) + "px"; menu.style.width = Math.max(230, r.width) + "px"; renderFontList(document.getElementById("cfFontSearch").value); document.getElementById("cfFontSearch").focus(); } };
    document.getElementById("cfFontSearch").oninput = function () { renderFontList(this.value); };
    document.addEventListener("click", function (e) { if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) menu.hidden = true; });
    sel.addEventListener("change", updateFontButton); updateFontButton();
  }

  function row(label, ctl) { return '<label class="cfDesignRow"><span>' + label + "</span>" + ctl + "</label>"; }
  function syncValues(v) {
    var vals = { cfTextSpacingVal: (+v.spacing || 0).toFixed(1) + "px", cfTextLineVal: (+v.lineHeight || 1.2).toFixed(2), cfTextOpacityVal: Math.round((v.opacity == null ? 1 : +v.opacity) * 100) + "%", cfMotionDurationVal: (+v.duration || .55).toFixed(2) + "s" };
    Object.keys(vals).forEach(function (id) { var e = document.getElementById(id); if (e) e.textContent = vals[id]; });
    qa(".cfMotionChoice").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-motion") === v.transition); });
  }
  function buildDesignPro() {
    var pane = q(".projPaneR"), tabs = document.getElementById("projBgTabs"); if (!pane || !tabs || document.getElementById("cfDesignPro")) return;
    var h = q(".projPaneHead h3", pane); if (h) h.textContent = "DESIGN PANEL";
    var pro = document.createElement("div"); pro.id = "cfDesignPro"; pro.className = "cfDesignPro";
    pro.innerHTML = '<details class="cfDesignGroup" open><summary>Typography</summary><div class="cfDesignGroupBody">' +
      row("Text color", '<input id="cfTextColor" type="color">') +
      row("Weight", '<select id="cfTextWeight"><option>300</option><option>400</option><option>500</option><option>600</option><option>700</option><option>800</option></select>') +
      row("Letter spacing", '<span class="cfRangeWithValue"><input id="cfTextSpacing" type="range" min="-2" max="12" step=".2"><output id="cfTextSpacingVal"></output></span>') +
      row("Line height", '<span class="cfRangeWithValue"><input id="cfTextLine" type="range" min=".8" max="2" step=".05"><output id="cfTextLineVal"></output></span>') +
      row("Opacity", '<span class="cfRangeWithValue"><input id="cfTextOpacity" type="range" min=".2" max="1" step=".05"><output id="cfTextOpacityVal"></output></span>') +
      row("Case", '<select id="cfTextTransform"><option value="none">As typed</option><option value="uppercase">UPPERCASE</option><option value="lowercase">lowercase</option></select>') +
      row("Position", '<select id="cfTextPosition"><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select>') +
      '</div></details><details class="cfDesignGroup" open><summary>Text motion & transition</summary><div class="cfDesignGroupBody"><div class="cfMotionGrid" id="cfMotionGrid"></div>' +
      row("Duration", '<span class="cfRangeWithValue"><input id="cfMotionDuration" type="range" min=".15" max="2" step=".05"><output id="cfMotionDurationVal"></output></span>') +
      '<button type="button" class="cfDesignPreviewBtn" id="cfReplayMotion">Preview animation</button></div></details>';
    var bgLabel = tabs.previousElementSibling; pane.insertBefore(pro, bgLabel || tabs); if (bgLabel && bgLabel.classList.contains("label")) bgLabel.textContent = "BACKGROUND & VISUAL ASSETS";
    var grid = document.getElementById("cfMotionGrid");
    MOTIONS.forEach(function (m) { var b = document.createElement("button"); b.type = "button"; b.className = "cfMotionChoice"; b.setAttribute("data-motion", m); b.innerHTML = '<span class="cfMotionDemo"></span><b>' + m.replace("slide-left", "slide") + "</b>"; grid.appendChild(b); });
    var v = visual();
    var map = { cfTextColor: "color", cfTextWeight: "weight", cfTextSpacing: "spacing", cfTextLine: "lineHeight", cfTextOpacity: "opacity", cfTextTransform: "transform", cfTextPosition: "pos", cfMotionDuration: "duration" };
    Object.keys(map).forEach(function (id) { var e = document.getElementById(id), key = map[id]; if (!e) return; e.value = v[key]; e.addEventListener(e.type === "range" ? "input" : "change", function () { v[key] = (e.type === "range" || key === "weight") ? parseFloat(e.value) : e.value; saveVisual(v); syncValues(v); }); });
    qa(".cfMotionChoice", grid).forEach(function (b) { b.onclick = function () { v.transition = b.getAttribute("data-motion"); saveVisual(v); syncValues(v); }; });
    document.getElementById("cfReplayMotion").onclick = function () { applyVisual(v, true); };
    syncValues(v); applyVisual(v, false);
  }
  function enhanceDesign() {
    var pane = q(".projPaneR"); if (!pane) return false;
    var h = q(".projPaneHead h3", pane); if (h) h.textContent = "DESIGN PANEL";
    var firstLabel = q("p.label", pane); if (firstLabel) firstLabel.textContent = "TEXT STYLE";
    buildFontPicker(); buildDesignPro(); updateFontButton(); return true;
  }

  function setPreviewMode(mode) {
    if (["edit", "live", "dual"].indexOf(mode) < 0) mode = "edit";
    var stage = document.getElementById("cfPrevStage"); if (!stage) return;
    stage.setAttribute("data-preview-mode", mode);
    qa("#cfPreviewModes [data-preview-mode]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-preview-mode") === mode); });
    try { localStorage.setItem(PREVIEW_KEY, mode); } catch (e) {}
  }
  function buildPreviewModes() {
    var head = q(".cfC-preview .cfPrevHead"), stage = document.getElementById("cfPrevStage"); if (!head || !stage) return false;
    if (!document.getElementById("cfPreviewModes")) {
      var m = document.createElement("span"); m.id = "cfPreviewModes"; m.className = "cfPreviewModes";
      m.innerHTML = '<button type="button" data-preview-mode="edit">Edit</button><button type="button" data-preview-mode="live">Live</button><button type="button" data-preview-mode="dual">Dual</button>';
      head.insertBefore(m, q(".cfPrevSpacer", head) || head.firstChild);
      qa("button", m).forEach(function (b) { b.onclick = function () { setPreviewMode(b.getAttribute("data-preview-mode")); }; });
    }
    if (!document.getElementById("cfLiveFrame")) {
      var f = document.createElement("iframe"); f.id = "cfLiveFrame"; f.className = "cfLiveFrame"; f.title = "Current live projector output"; f.src = "./castflow.html?mode=display&embed=1"; stage.appendChild(f);
      var a = document.createElement("span"); a.className = "cfPreviewPaneLabel cfEditLabel"; a.textContent = "EDIT"; stage.appendChild(a);
      var b = document.createElement("span"); b.className = "cfPreviewPaneLabel cfLiveLabel"; b.textContent = "LIVE"; stage.appendChild(b);
    }
    var saved = "edit"; try { saved = localStorage.getItem(PREVIEW_KEY) || "edit"; } catch (e) {} setPreviewMode(saved); return true;
  }

  function init() {
    var n = 0, iv = setInterval(function () {
      n++; safe("top", buildTopBrand); safe("features", hookFeatures); safe("design", enhanceDesign); safe("preview", buildPreviewModes); safe("mini", syncMiniPreviews);
      if (n > 160) clearInterval(iv);
    }, 250);
    setInterval(function () { safe("title", updateFlowHeader); safe("brand", buildTopBrand); safe("mini", syncMiniPreviews); safe("font", updateFontButton); var h = q(".cfC-design .projPaneHead h3"); if (h) h.textContent = "DESIGN PANEL"; }, 900);
  }

  window.CastFlowV100 = { version: "v9.0", setFlowMode: function (m) { setFlowMode(m, true); }, setPreviewMode: setPreviewMode, readVisual: visual, applyVisualPreview: applyVisual, syncMiniPreviews: syncMiniPreviews };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
