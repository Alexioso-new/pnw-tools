/* PNW-FILE-GUIDE: CapCut-style Timeline UX — v118 / v9.18
   Lapisan ini mempertahankan model/payload yv-timeline.js, lalu menambahkan
   toolbar profesional, duplicate/copy/paste, context menu, collapse track,
   Ctrl+wheel zoom pada pointer, filmstrip/waveform, smooth playhead & follow. */
(function () {
  "use strict";
  var VERSION = "v9.18-timeline-ui";
  var runMode = "";
  try { runMode = new URLSearchParams(location.search).get("mode") || ""; } catch (e) {}
  if (/^(display|stage|remote|youthviews)$/i.test(runMode)) return;
  var UI_KEY = "pnwTimelineUi.v117";
  var clipboard = null;
  var drawer = null;
  var canvas = null;
  var scroll = null;
  var observer = null;
  var raf = 0;
  var bound = false;
  var ui = loadUi();

  function el(id) { return document.getElementById(id); }
  function api() { return window.PNWTimeline || null; }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function loadUi() {
    try {
      return Object.assign({ follow: true, collapsed: {} }, JSON.parse(localStorage.getItem(UI_KEY) || "{}"));
    } catch (e) {
      return { follow: true, collapsed: {} };
    }
  }
  function saveUi() {
    try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (e) {}
  }
  function selectedRef(node) {
    node = node || document.querySelector("#tlCanvas .tlClip.sel");
    if (!node) return null;
    var track = node.getAttribute("data-track");
    var id = node.getAttribute("data-id");
    var p = api() && api().project();
    var arr = p && p.tracks && p.tracks[track];
    var clip = null;
    (arr || []).some(function (c) {
      if (c.id === id) { clip = c; return true; }
      return false;
    });
    return clip ? { track: track, id: id, clip: clip, node: node } : null;
  }
  function copySelected() {
    var r = selectedRef();
    if (!r) return false;
    clipboard = { track: r.track, clip: clone(r.clip) };
    var p = el("tlVPaste");
    if (p) p.disabled = false;
    return true;
  }
  function pasteClip(at) {
    if (!clipboard || !api()) return false;
    var data = clone(clipboard.clip);
    delete data.id;
    delete data.start;
    at = at == null ? api().curT() : at;
    api().addClip(clipboard.track, data, { at: Math.max(0, at) });
    return true;
  }
  function duplicateSelected() {
    var r = selectedRef();
    if (!r || !api()) return false;
    var data = clone(r.clip);
    delete data.id;
    delete data.start;
    api().addClip(r.track, data, { at: r.clip.start + Math.max(0.25, r.clip.dur + 0.12) });
    return true;
  }
  function splitRef(r) {
    if (!r || !api()) return false;
    return api().splitClip(r.track, r.id, api().curT());
  }
  function removeRef(r, ripple) {
    if (!r || !api()) return false;
    if (ripple) return api().rippleDelete(r.track, r.id);
    api().removeClip(r.track, r.id);
    return true;
  }
  function iconize() {
    var map = {
      tlHome: ["|◀", "Ke awal"], tlPlay: ["▶", "Play / Pause"], tlStop: ["■", "Stop"],
      tlAuto: ["⚡", "Susun dari Rundown"], tlAddSong: ["♪+", "Tambah Lagu"],
      tlAddText: ["T+", "Tambah Teks"], tlAddVerse: ["✝+", "Tambah Ayat"],
      tlAddCd: ["◷+", "Tambah Countdown"], tlAddBg: ["▧+", "Tambah Latar"],
      tlAddMedia: ["▣+", "Tambah Media"], tlAddOv: ["◆+", "Tambah Overlay"],
      tlSplit: ["✂", "Split pada playhead"], tlRipple: ["⇤", "Ripple Delete"],
      tlDel: ["⌫", "Hapus clip"], tlMark: ["◇+", "Tambah Marker"],
      tlUndo: ["↶", "Undo"], tlRedo: ["↷", "Redo"], tlSnap: ["⌁", "Snapping"],
      tlZoomOut: ["−", "Zoom out"], tlZoomIn: ["+", "Zoom in"], tlFit: ["↔", "Fit timeline"],
      tlSave: ["✓", "Simpan proyek"], tlNew: ["＋", "Proyek baru"], tlDelProj: ["⌫", "Hapus proyek"],
      tlEdit: ["✎", "Edit clip"], tlClose: ["×", "Tutup Timeline"],
    };
    Object.keys(map).forEach(function (id) {
      var b = el(id);
      if (!b) return;
      b.textContent = map[id][0];
      b.setAttribute("aria-label", map[id][1]);
      b.title = map[id][1] + (b.title && b.title.indexOf("(") >= 0 ? " " + b.title.slice(b.title.indexOf("(")) : "");
      b.setAttribute("data-tip", map[id][1]);
    });
  }
  function addProTools() {
    var bar = drawer && drawer.querySelector(".tlBar");
    if (!bar || el("tlVSelect")) return;
    var group = document.createElement("div");
    group.className = "tlGroup tlProTools";
    group.innerHTML =
      '<button class="tlBtn on" id="tlVSelect" type="button" title="Select tool (V)">⌁</button>' +
      '<button class="tlBtn" id="tlVDuplicate" type="button" title="Duplicate (Ctrl+D)">⧉</button>' +
      '<button class="tlBtn" id="tlVCopy" type="button" title="Copy (Ctrl+C)">⎘</button>' +
      '<button class="tlBtn" id="tlVPaste" type="button" title="Paste di playhead (Ctrl+V)" disabled>▣</button>' +
      '<button class="tlBtn on" id="tlVFollow" type="button" title="Auto-follow playhead">⇥</button>';
    bar.insertBefore(group, bar.firstChild);
    el("tlVDuplicate").onclick = duplicateSelected;
    el("tlVCopy").onclick = copySelected;
    el("tlVPaste").onclick = function () { pasteClip(); };
    el("tlVFollow").onclick = function () {
      ui.follow = !ui.follow;
      this.classList.toggle("on", ui.follow);
      saveUi();
    };
    el("tlVFollow").classList.toggle("on", ui.follow);
  }
  function ensureContext() {
    if (!drawer || el("tlVContext")) return;
    var m = document.createElement("div");
    m.id = "tlVContext";
    m.className = "tlVContext";
    m.hidden = true;
    m.innerHTML =
      '<button data-cmd="edit">✎ <span>Edit clip</span><kbd>Double click</kbd></button>' +
      '<button data-cmd="split">✂ <span>Split di playhead</span><kbd>S</kbd></button>' +
      '<button data-cmd="duplicate">⧉ <span>Duplicate</span><kbd>Ctrl+D</kbd></button>' +
      '<button data-cmd="copy">⎘ <span>Copy</span><kbd>Ctrl+C</kbd></button>' +
      '<button data-cmd="paste">▣ <span>Paste sesudah clip</span><kbd>Ctrl+V</kbd></button>' +
      '<i></i><button data-cmd="delete" class="danger">⌫ <span>Delete</span><kbd>Del</kbd></button>' +
      '<button data-cmd="ripple" class="danger">⇤ <span>Ripple delete</span><kbd>Shift+Del</kbd></button>';
    drawer.appendChild(m);
    m.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cmd]");
      if (!b) return;
      var r = selectedRef(m._clipNode);
      var cmd = b.getAttribute("data-cmd");
      if (cmd === "edit" && r) r.node.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      else if (cmd === "split") splitRef(r);
      else if (cmd === "duplicate") duplicateSelected();
      else if (cmd === "copy") copySelected();
      else if (cmd === "paste") pasteClip(r ? r.clip.start + r.clip.dur : null);
      else if (cmd === "delete") removeRef(r, false);
      else if (cmd === "ripple") removeRef(r, true);
      hideContext();
    });
  }
  function showContext(e, node) {
    ensureContext();
    var m = el("tlVContext");
    if (!m) return;
    m._clipNode = node;
    node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 991, pointerType: "mouse", button: 0 }));
    node.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 991, pointerType: "mouse", button: 0 }));
    var rect = drawer.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(rect.width - 230, e.clientX - rect.left)) + "px";
    m.style.top = Math.max(44, Math.min(rect.height - 260, e.clientY - rect.top)) + "px";
    m.hidden = false;
  }
  function hideContext() { var m = el("tlVContext"); if (m) m.hidden = true; }
  function visualFor(r) {
    var c = r.clip;
    var v = document.createElement("span");
    v.className = "tlVVisual kind-" + (c.kind || (c.media ? "media" : c.bg ? "bg" : c.overlay ? "overlay" : "clip"));
    var count = c.media || c.bg ? 12 : 28;
    var seed = String(c.title || c.text || c.ref || c.kind || c.id);
    for (var i = 0; i < count; i++) {
      var x = document.createElement("i");
      var code = seed.charCodeAt(i % Math.max(1, seed.length)) || 7;
      x.style.setProperty("--h", 20 + ((code * (i + 3)) % 75) + "%");
      v.appendChild(x);
    }
    return v;
  }
  function decorateClips() {
    if (!canvas) return;
    Array.prototype.forEach.call(canvas.querySelectorAll(".tlClip"), function (n) {
      if (n.getAttribute("data-v117") === "1") return;
      n.setAttribute("data-v117", "1");
      var r = selectedRef(n);
      if (r) n.insertBefore(visualFor(r), n.firstChild);
    });
    applyCollapsed();
  }
  function trackMeta() {
    return [
      { id: "bg", icon: "▧", color: "#7b8496" },
      { id: "media", icon: "▣", color: "#00a6a6" },
      { id: "lyrics", icon: "T", color: "#19b5d1" },
      { id: "overlay", icon: "◆", color: "#a879ff" },
    ];
  }
  function enhanceTrackHeads() {
    var heads = drawer.querySelectorAll(".tlTrackHead");
    trackMeta().forEach(function (meta, i) {
      var h = heads[i];
      if (!h || h.getAttribute("data-v117") === "1") return;
      h.setAttribute("data-v117", "1");
      h.setAttribute("data-track-id", meta.id);
      h.style.setProperty("--track-color", meta.color);
      var ic = document.createElement("span");
      ic.className = "tlVTrackIcon";
      ic.textContent = meta.icon;
      h.insertBefore(ic, h.firstChild);
      var fold = document.createElement("button");
      fold.className = "tlTOp tlVCollapse";
      fold.type = "button";
      fold.title = "Collapse track";
      fold.textContent = "⌄";
      fold.setAttribute("data-collapse", meta.id);
      var ops = h.querySelector(".tlTrackOps");
      if (ops) ops.insertBefore(fold, ops.firstChild);
      fold.onclick = function () {
        ui.collapsed[meta.id] = !ui.collapsed[meta.id];
        saveUi();
        applyCollapsed();
      };
    });
    applyCollapsed();
  }
  function applyCollapsed() {
    trackMeta().forEach(function (meta) {
      var on = !!ui.collapsed[meta.id];
      var h = drawer && drawer.querySelector('.tlTrackHead[data-track-id="' + meta.id + '"]');
      var t = canvas && canvas.querySelector('.tlTrack[data-track="' + meta.id + '"]');
      if (h) {
        h.classList.toggle("collapsed", on);
        var b = h.querySelector("[data-collapse]");
        if (b) b.textContent = on ? "›" : "⌄";
      }
      if (t) t.classList.toggle("collapsed", on);
    });
  }
  function bindTimelineEvents() {
    if (bound || !drawer) return;
    bound = true;
    drawer.addEventListener("contextmenu", function (e) {
      var clip = e.target.closest(".tlClip");
      if (!clip) return;
      e.preventDefault();
      showContext(e, clip);
    });
    drawer.addEventListener("pointerdown", function (e) {
      if (!e.target.closest("#tlVContext")) hideContext();
    });
    scroll.addEventListener("wheel", function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      var z = el("tlZoom");
      if (!z) return;
      var oldPps = parseInt(z.value, 10) || 12;
      var rect = scroll.getBoundingClientRect();
      var px = e.clientX - rect.left;
      var time = (scroll.scrollLeft + px) / oldPps;
      var next = Math.max(3, Math.min(60, Math.round(oldPps * Math.exp(-e.deltaY * 0.002))));
      z.value = next;
      z.dispatchEvent(new Event("input", { bubbles: true }));
      scroll.scrollLeft = Math.max(0, time * next - px);
    }, { passive: false });
    document.addEventListener("keydown", function (e) {
      var menu = el("tlVContext");
      if (e.key === "Escape" && menu && !menu.hidden) {
        hideContext();
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (!api() || !api().isOpen()) return;
      var t = e.target;
      var tag = ((t && t.tagName) || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || (t && t.isContentEditable)) return;
      var ctrl = e.ctrlKey || e.metaKey;
      var k = (e.key || "").toLowerCase();
      if (ctrl && k === "c") { if (copySelected()) e.preventDefault(); }
      else if (ctrl && k === "v") { if (pasteClip()) e.preventDefault(); }
      else if (ctrl && k === "d") { if (duplicateSelected()) e.preventDefault(); }
    }, true);
  }
  function startSmooth() {
    if (!raf && drawer && drawer.classList.contains("on"))
      raf = requestAnimationFrame(smoothLoop);
  }
  function smoothLoop() {
    if (!drawer || !drawer.classList.contains("on")) { raf = 0; return; }
    raf = requestAnimationFrame(smoothLoop);
    if (document.hidden || !api()) return;
    var ph = el("tlPlayhead");
    var z = el("tlZoom");
    if (!ph || !z) return;
    var pps = parseInt(z.value, 10) || 12;
    var x = api().curT() * pps;
    ph.style.left = "0px";
    ph.style.transform = "translate3d(" + x + "px,0,0)";
    var live = el("tlLive");
    if (ui.follow && live && live.classList.contains("on") && scroll) {
      var rel = x - scroll.scrollLeft;
      if (rel > scroll.clientWidth * 0.78 || rel < scroll.clientWidth * 0.1)
        scroll.scrollLeft = Math.max(0, x - scroll.clientWidth * 0.42);
    }
    var perf = el("tlVPerf");
    if (perf && window.CastFlowPerformance) {
      var s = window.CastFlowPerformance.getStats();
      perf.textContent = s.fps + " FPS";
      perf.classList.toggle("warn", s.fps > 0 && s.fps < 48);
    }
  }
  function ensurePerf() {
    var bar = drawer.querySelector(".tlBar");
    if (!bar || el("tlVPerf")) return;
    var p = document.createElement("span");
    p.id = "tlVPerf";
    p.className = "tlVPerf";
    p.textContent = "-- FPS";
    bar.appendChild(p);
  }
  function enhance() {
    drawer = el("tlDrawer");
    canvas = el("tlCanvas");
    scroll = el("tlScroll");
    if (!drawer || !canvas || !scroll) return false;
    drawer.classList.add("tlV117");
    iconize();
    addProTools();
    ensureContext();
    ensurePerf();
    enhanceTrackHeads();
    decorateClips();
    bindTimelineEvents();
    if (!observer) {
      observer = new MutationObserver(function () {
        canvas = el("tlCanvas");
        decorateClips();
      });
      observer.observe(canvas, { childList: true, subtree: true });
    }
    if (!drawer._cfV117ClassWatch) {
      drawer._cfV117ClassWatch = new MutationObserver(function () { startSmooth(); });
      drawer._cfV117ClassWatch.observe(drawer, { attributes: true, attributeFilter: ["class"] });
    }
    startSmooth();
    return true;
  }
  function boot() {
    var n = 0;
    var timer = setInterval(function () {
      n++;
      if (enhance() || n > 120) clearInterval(timer);
    }, 150);
    var bodyObserver = new MutationObserver(function () {
      if (enhance()) bodyObserver.disconnect();
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }
  window.CastFlowTimelineV117 = {
    version: VERSION,
    enhance: enhance,
    copy: copySelected,
    paste: pasteClip,
    duplicate: duplicateSelected,
    getClipboard: function () { return clipboard ? clone(clipboard) : null; },
    getUi: function () { return clone(ui); },
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
