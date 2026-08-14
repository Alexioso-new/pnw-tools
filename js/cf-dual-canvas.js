/* PNW-FILE-GUIDE: js/cf-dual-canvas.js — Dual Free Canvas ala Figma
   (v118 / v9.18). Hanya aktif di operator castflow.html ketika Preview=Dual.
   Pan/zoom, frame output drag+resize, add/remove/duplicate/lock/front/pop-out,
   custom browser URL, minimap, maximize, keyboard, dan layout persisten. */
(function () {
  "use strict";

  var VERSION = "v9.18";
  var STORE_KEY = "pnwCastflowDualCanvas.v1";
  var MIN_ZOOM = 0.12;
  var MAX_ZOOM = 3;
  var HEAD_H = 30;
  var mode = "";
  try {
    mode = new URLSearchParams(location.search).get("mode") || "";
  } catch (e) {}
  /* Penting: jangan membuat iframe bersarang rekursif di output/stage/remote. */
  if (/^(display|stage|remote|youthviews)$/i.test(mode)) return;

  var stage = null;
  var root = null;
  var viewport = null;
  var world = null;
  var addMenu = null;
  var helpPanel = null;
  var zoomText = null;
  var mini = null;
  var empty = null;
  var editMarker = null;
  var liveMarker = null;
  var state = null;
  var selected = "";
  var active = false;
  var spaceDown = false;
  var op = null;
  var saveTimer = 0;
  var miniRaf = 0;
  var miniTimer = 0;
  var miniLast = 0;
  var paintRaf = 0;
  var viewDirty = false;
  var nodeDirty = {};
  var visibilityRaf = 0;
  var freshState = false;

  function queuePaint() {
    if (paintRaf) return;
    paintRaf = requestAnimationFrame(function () {
      paintRaf = 0;
      flushPaint();
    });
  }
  function flushPaint() {
    if (paintRaf) {
      cancelAnimationFrame(paintRaf);
      paintRaf = 0;
    }
    if (viewDirty) {
      viewDirty = false;
      paintViewNow();
    }
    var ids = Object.keys(nodeDirty);
    nodeDirty = {};
    ids.forEach(function (id) {
      var n = nodeById(id);
      if (n) paintNodeNow(n);
    });
  }

  function el(id) {
    return document.getElementById(id);
  }
  function clamp(v, a, b) {
    v = Number(v);
    if (!isFinite(v)) v = a;
    return Math.max(a, Math.min(b, v));
  }
  function uid(prefix) {
    return (
      (prefix || "dc") +
      "-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 7)
    );
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }
  function typeInfo(type) {
    var map = {
      edit: {
        label: "Edit Preview",
        short: "EDIT",
        src: "",
        icon: "✎",
      },
      live: {
        label: "Live Output",
        short: "LIVE",
        src: "./castflow.html?mode=display&embed=1",
        icon: "●",
      },
      stage: {
        label: "Stage Display",
        short: "STAGE",
        src: "./castflow.html?mode=stage&embed=1",
        icon: "▣",
      },
      remote: {
        label: "Remote Control",
        short: "REMOTE",
        src: "./castflow.html?mode=remote&embed=1",
        icon: "⌁",
      },
      browser: {
        label: "Browser / URL",
        short: "WEB",
        src: "about:blank",
        icon: "◎",
      },
    };
    return map[type] || map.browser;
  }
  function makeNode(type, extra) {
    extra = extra || {};
    var info = typeInfo(type);
    return {
      id: extra.id || uid(type),
      type: type,
      title: String(extra.title || info.label).slice(0, 80),
      src: String(extra.src || info.src || "").slice(0, 2000),
      x: Number(extra.x) || 0,
      y: Number(extra.y) || 0,
      w: clamp(extra.w == null ? 640 : extra.w, 240, 2600),
      h: clamp(extra.h == null ? 390 : extra.h, 165, 1800),
      z: clamp(extra.z == null ? 1 : extra.z, 1, 99999),
      locked: !!extra.locked,
      ratio: extra.ratio !== false,
    };
  }
  function defaultState() {
    return {
      view: { x: 70, y: 58, zoom: 0.72 },
      grid: true,
      nodes: [
        makeNode("edit", { id: "dc-edit", x: 40, y: 70, z: 1 }),
        makeNode("live", { id: "dc-live", x: 740, y: 70, z: 2 }),
      ],
    };
  }
  function sanitize(raw) {
    if (!raw || typeof raw !== "object") return defaultState();
    var out = {
      view: {
        x: clamp(raw.view && raw.view.x, -100000, 100000),
        y: clamp(raw.view && raw.view.y, -100000, 100000),
        zoom: clamp(raw.view && raw.view.zoom, MIN_ZOOM, MAX_ZOOM),
      },
      grid: raw.grid !== false,
      nodes: [],
    };
    if (Array.isArray(raw.nodes)) {
      var seenEdit = false;
      raw.nodes.slice(0, 40).forEach(function (n, i) {
        if (!n || ["edit", "live", "stage", "remote", "browser"].indexOf(n.type) < 0)
          return;
        if (n.type === "edit") {
          if (seenEdit) return;
          seenEdit = true;
        }
        out.nodes.push(
          makeNode(n.type, {
            id: String(n.id || uid(n.type)).slice(0, 120),
            title: n.title,
            src: n.src,
            x: clamp(n.x, -100000, 100000),
            y: clamp(n.y, -100000, 100000),
            w: n.w,
            h: n.h,
            z: n.z == null ? i + 1 : n.z,
            locked: n.locked,
            ratio: n.ratio,
          }),
        );
      });
    }
    return out;
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      freshState = !raw;
      return sanitize(raw ? JSON.parse(raw) : null);
    } catch (e) {
      freshState = true;
      return defaultState();
    }
  }
  function saveNow() {
    if (!state) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {}
    try {
      document.dispatchEvent(
        new CustomEvent("cf:dualCanvasChanged", { detail: getState() }),
      );
    } catch (e) {}
  }
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 120);
  }
  function getState() {
    try {
      return JSON.parse(JSON.stringify(state));
    } catch (e) {
      return state;
    }
  }
  function nodeById(id) {
    if (!state) return null;
    for (var i = 0; i < state.nodes.length; i++) {
      if (state.nodes[i].id === id) return state.nodes[i];
    }
    return null;
  }
  function maxZ() {
    var z = 0;
    state.nodes.forEach(function (n) {
      z = Math.max(z, n.z || 0);
    });
    return z;
  }
  function makeMarker(node, name) {
    if (!node || !node.parentNode) return null;
    var marker = document.createComment("cf-dual-" + name);
    node.parentNode.insertBefore(marker, node);
    return marker;
  }
  function restoreNode(node, marker) {
    if (!node || !marker || !marker.parentNode) return;
    if (node.parentNode !== marker.parentNode || node.previousSibling !== marker)
      marker.parentNode.insertBefore(node, marker.nextSibling);
  }
  function restoreNative() {
    restoreNode(el("projPreview"), editMarker);
    restoreNode(el("cfLiveFrame"), liveMarker);
  }
  function makeIframe(src, title, cls) {
    var f = document.createElement("iframe");
    f.className = "cfDcIframe" + (cls ? " " + cls : "");
    f.title = title || "Output";
    f.src = src || "about:blank";
    f.setAttribute("loading", "lazy");
    f.setAttribute("allow", "autoplay; fullscreen; clipboard-read; clipboard-write");
    f.addEventListener("load", function () {
      var box = f.closest ? f.closest(".cfDcFrame") : null;
      postPreviewVisibility(f, !!(active && box && !box.classList.contains("is-offscreen")));
    });
    return f;
  }
  function paintNodeNow(node) {
    var box = world && world.querySelector('[data-dc-id="' + node.id + '"]');
    if (!box) return;
    /* Posisi frame tetap memakai ukuran asli; pan/zoom ada pada satu layer world. */
    box.style.left = node.x + "px";
    box.style.top = node.y + "px";
    box.style.width = node.w + "px";
    box.style.height = node.h + "px";
    box.style.zIndex = String(node.z || 1);
    box.classList.toggle("is-locked", !!node.locked);
    box.classList.toggle("is-selected", selected === node.id);
    var ratio = box.querySelector('[data-dc-act="ratio"]');
    if (ratio) ratio.classList.toggle("on", !!node.ratio);
    var lock = box.querySelector('[data-dc-act="lock"]');
    if (lock) lock.textContent = node.locked ? "🔒" : "♢";
    scheduleMini();
    scheduleFrameVisibility();
  }
  function applyNodeStyle(node, immediate) {
    if (!node) return;
    nodeDirty[node.id] = true;
    if (immediate) flushPaint();
    else queuePaint();
  }
  function renderNodes() {
    if (!world) return;
    restoreNative();
    world.innerHTML = "";
    var usedEdit = false;
    var usedLive = false;
    var ordered = state.nodes.slice().sort(function (a, b) {
      return (a.z || 0) - (b.z || 0);
    });
    ordered.forEach(function (node) {
      var info = typeInfo(node.type);
      var box = document.createElement("section");
      box.className =
        "cfDcFrame cfDcType-" + node.type + (selected === node.id ? " is-selected" : "");
      box.setAttribute("data-dc-id", node.id);
      box.tabIndex = 0;
      box.setAttribute("aria-label", node.title);
      box.innerHTML =
        '<header class="cfDcFrameHead">' +
        '<span class="cfDcTypeChip">' + esc(info.short) + "</span>" +
        '<span class="cfDcFrameTitle" title="Double-click untuk ubah nama">' +
        esc(node.title) +
        "</span>" +
        '<span class="cfDcFrameOps">' +
        '<button type="button" data-dc-act="ratio" title="Kunci rasio 16:9">16:9</button>' +
        '<button type="button" data-dc-act="lock" title="Kunci / buka frame">♢</button>' +
        '<button type="button" data-dc-act="front" title="Bawa ke depan">↑</button>' +
        (node.type === "edit"
          ? ""
          : '<button type="button" data-dc-act="duplicate" title="Duplikat frame">⧉</button>') +
        '<button type="button" data-dc-act="pop" title="Buka sebagai jendela">↗</button>' +
        '<button type="button" data-dc-act="remove" title="Keluarkan dari canvas">×</button>' +
        "</span></header>" +
        '<div class="cfDcFrameBody"></div>' +
        '<span class="cfDcResize" title="Tarik untuk resize"></span>';
      world.appendChild(box);
      var body = box.querySelector(".cfDcFrameBody");
      if (node.type === "edit" && !usedEdit) {
        var edit = el("projPreview");
        if (edit) {
          body.appendChild(edit);
          usedEdit = true;
        }
      } else if (node.type === "live" && !usedLive) {
        var live = el("cfLiveFrame");
        if (live) {
          body.appendChild(live);
          usedLive = true;
        } else body.appendChild(makeIframe(info.src, node.title));
      } else if (node.type === "browser" && !node.src) {
        body.innerHTML = '<div class="cfDcUnavailable">Masukkan URL dari menu + Output.</div>';
      } else {
        body.appendChild(makeIframe(node.src || info.src, node.title));
      }
      applyNodeStyle(node);
    });
    if (empty) empty.hidden = state.nodes.length > 0;
    syncAddButtons();
    /* Struktur frame berubah jarang; render sinkron agar minimap tidak sempat basi. */
    renderMini();
  }
  function syncSelection() {
    if (!world) return;
    var boxes = world.querySelectorAll(".cfDcFrame");
    for (var i = 0; i < boxes.length; i++)
      boxes[i].classList.toggle(
        "is-selected",
        boxes[i].getAttribute("data-dc-id") === selected,
      );
  }
  function select(id) {
    selected = nodeById(id) ? id : "";
    syncSelection();
    scheduleMini();
  }
  function addNode(type, extra) {
    if (!state || !viewport) return "";
    if (type === "edit") {
      for (var i = 0; i < state.nodes.length; i++) {
        if (state.nodes[i].type === "edit") {
          select(state.nodes[i].id);
          centerOnNode(state.nodes[i].id);
          return state.nodes[i].id;
        }
      }
    }
    extra = extra || {};
    var rect = viewport.getBoundingClientRect();
    var w = clamp(extra.w == null ? 640 : extra.w, 240, 2600);
    var h = clamp(extra.h == null ? 390 : extra.h, 165, 1800);
    var cx = (rect.width / 2 - state.view.x) / state.view.zoom;
    var cy = (rect.height / 2 - state.view.y) / state.view.zoom;
    var n = makeNode(type, {
      title: extra.title,
      src: extra.src,
      x: extra.x == null ? cx - w / 2 + state.nodes.length * 18 : extra.x,
      y: extra.y == null ? cy - h / 2 + state.nodes.length * 18 : extra.y,
      w: w,
      h: h,
      z: maxZ() + 1,
      ratio: extra.ratio,
    });
    state.nodes.push(n);
    selected = n.id;
    renderNodes();
    saveNow();
    return n.id;
  }
  function removeNode(id) {
    var before = state.nodes.length;
    state.nodes = state.nodes.filter(function (n) {
      return n.id !== id;
    });
    if (state.nodes.length === before) return false;
    if (selected === id) selected = "";
    renderNodes();
    saveNow();
    return true;
  }
  function duplicateNode(id) {
    var n = nodeById(id);
    if (!n || n.type === "edit") return "";
    return addNode(n.type, {
      title: n.title + " Copy",
      src: n.src,
      x: n.x + 42,
      y: n.y + 42,
      w: n.w,
      h: n.h,
      ratio: n.ratio,
    });
  }
  function frontNode(id) {
    var n = nodeById(id);
    if (!n) return;
    n.z = maxZ() + 1;
    applyNodeStyle(n);
    saveSoon();
  }
  function popNode(id) {
    var n = nodeById(id);
    if (!n) return;
    if (n.type === "edit") {
      var b = el("cfPopBtn");
      if (b) b.click();
      return;
    }
    var src = n.src || typeInfo(n.type).src;
    if (!src) return;
    try {
      window.open(src.replace(/([?&])embed=1(&|$)/, "$1").replace(/[?&]$/, ""), "_blank");
    } catch (e) {}
  }
  function centerOnNode(id) {
    var n = nodeById(id);
    if (!n || !viewport) return;
    var r = viewport.getBoundingClientRect();
    state.view.x = r.width / 2 - (n.x + n.w / 2) * state.view.zoom;
    state.view.y = r.height / 2 - (n.y + n.h / 2) * state.view.zoom;
    applyView();
    saveSoon();
  }
  function fitAll(persist) {
    if (!viewport || !state.nodes.length) {
      state.view = { x: 60, y: 60, zoom: 1 };
      applyView();
      if (persist !== false) saveSoon();
      return;
    }
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    state.nodes.forEach(function (n) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
    });
    var r = viewport.getBoundingClientRect();
    var bw = Math.max(1, maxX - minX);
    var bh = Math.max(1, maxY - minY);
    var z = clamp(Math.min((r.width - 100) / bw, (r.height - 100) / bh), MIN_ZOOM, 1.5);
    state.view.zoom = z;
    state.view.x = (r.width - bw * z) / 2 - minX * z;
    state.view.y = (r.height - bh * z) / 2 - minY * z;
    applyView();
    if (persist !== false) saveSoon();
  }
  function actualSize() {
    if (!viewport) return;
    var r = viewport.getBoundingClientRect();
    var old = state.view.zoom;
    var cx = (r.width / 2 - state.view.x) / old;
    var cy = (r.height / 2 - state.view.y) / old;
    state.view.zoom = 1;
    state.view.x = r.width / 2 - cx;
    state.view.y = r.height / 2 - cy;
    applyView();
    saveSoon();
  }
  function zoomAt(clientX, clientY, next) {
    if (!viewport) return;
    var r = viewport.getBoundingClientRect();
    var px = clientX - r.left;
    var py = clientY - r.top;
    var old = state.view.zoom;
    var wx = (px - state.view.x) / old;
    var wy = (py - state.view.y) / old;
    next = clamp(next, MIN_ZOOM, MAX_ZOOM);
    state.view.zoom = next;
    state.view.x = px - wx * next;
    state.view.y = py - wy * next;
    applyView();
    saveSoon();
  }
  function zoomCenter(factor) {
    var r = viewport.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, state.view.zoom * factor);
  }
  function paintViewNow() {
    if (!world || !state) return;
    world.style.transform =
      "translate3d(" + state.view.x + "px," + state.view.y + "px,0) scale(" + state.view.zoom + ")";
    if (zoomText) zoomText.textContent = Math.round(state.view.zoom * 100) + "%";
    if (root) root.classList.toggle("no-grid", !state.grid);
    var s1 = Math.max(6, 20 * state.view.zoom);
    var s2 = Math.max(30, 100 * state.view.zoom);
    viewport.style.setProperty("--dc-grid-small", s1 + "px");
    viewport.style.setProperty("--dc-grid-big", s2 + "px");
    viewport.style.setProperty("--dc-grid-x", state.view.x + "px");
    viewport.style.setProperty("--dc-grid-y", state.view.y + "px");
    scheduleMini();
    scheduleFrameVisibility();
  }
  function applyView(immediate) {
    viewDirty = true;
    if (immediate) flushPaint();
    else queuePaint();
  }
  function scheduleFrameVisibility() {
    if (visibilityRaf || !active) return;
    visibilityRaf = requestAnimationFrame(function () {
      visibilityRaf = 0;
      updateFrameVisibility();
    });
  }
  function updateFrameVisibility() {
    if (!active || !viewport || !world || !state) return;
    var vr = viewport.getBoundingClientRect();
    var z = state.view.zoom || 1;
    var vx = -state.view.x / z;
    var vy = -state.view.y / z;
    var vw = vr.width / z;
    var vh = vr.height / z;
    var pad = 120 / z;
    state.nodes.forEach(function (n) {
      var visible = n.x + n.w >= vx - pad && n.y + n.h >= vy - pad &&
        n.x <= vx + vw + pad && n.y <= vy + vh + pad;
      var box = world.querySelector('[data-dc-id="' + n.id + '"]');
      if (!box) return;
      box.classList.toggle("is-offscreen", !visible);
      if (box._cfVisible === visible) return;
      box._cfVisible = visible;
      Array.prototype.forEach.call(box.querySelectorAll("iframe"), function (f) {
        try { f.contentWindow.postMessage({ type: "cf:previewVisibility", visible: visible }, "*"); } catch (e) {}
      });
      try {
        document.dispatchEvent(new CustomEvent("cf:dualFrameVisibility", {
          detail: { id: n.id, type: n.type, visible: visible },
        }));
      } catch (e) {}
    });
  }
  function scheduleMini() {
    if (miniRaf || miniTimer) return;
    var now = performance.now();
    var delay = Math.max(0, 66 - (now - miniLast));
    if (delay > 1) {
      miniTimer = setTimeout(function () {
        miniTimer = 0;
        scheduleMini();
      }, delay);
      return;
    }
    miniRaf = requestAnimationFrame(function () {
      miniRaf = 0;
      miniLast = performance.now();
      renderMini();
    });
  }
  function renderMini() {
    if (!mini || !viewport || !state) return;
    mini.innerHTML = "";
    if (!state.nodes.length) return;
    var vr = viewport.getBoundingClientRect();
    var vx = -state.view.x / state.view.zoom;
    var vy = -state.view.y / state.view.zoom;
    var vw = vr.width / state.view.zoom;
    var vh = vr.height / state.view.zoom;
    var minX = vx;
    var minY = vy;
    var maxX = vx + vw;
    var maxY = vy + vh;
    state.nodes.forEach(function (n) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
    });
    var pad = 40;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    var mw = mini.clientWidth || 150;
    var mh = mini.clientHeight || 92;
    var sc = Math.min(mw / Math.max(1, maxX - minX), mh / Math.max(1, maxY - minY));
    state.nodes.forEach(function (n) {
      var d = document.createElement("i");
      d.className = "cfDcMiniNode" + (n.id === selected ? " on" : "");
      d.style.left = (n.x - minX) * sc + "px";
      d.style.top = (n.y - minY) * sc + "px";
      d.style.width = Math.max(3, n.w * sc) + "px";
      d.style.height = Math.max(2, n.h * sc) + "px";
      mini.appendChild(d);
    });
    var view = document.createElement("b");
    view.className = "cfDcMiniView";
    view.style.left = (vx - minX) * sc + "px";
    view.style.top = (vy - minY) * sc + "px";
    view.style.width = Math.max(4, vw * sc) + "px";
    view.style.height = Math.max(3, vh * sc) + "px";
    mini.appendChild(view);
  }
  function syncAddButtons() {
    if (!addMenu) return;
    var hasEdit = state.nodes.some(function (n) {
      return n.type === "edit";
    });
    var b = addMenu.querySelector('[data-dc-add="edit"]');
    if (b) {
      b.disabled = hasEdit;
      b.title = hasEdit ? "Edit Preview sudah ada di canvas" : "";
    }
  }
  function toggleMenu(force) {
    if (!addMenu) return;
    var show = force == null ? addMenu.hidden : !!force;
    addMenu.hidden = !show;
    if (show) helpPanel.hidden = true;
  }
  function toggleHelp(force) {
    if (!helpPanel) return;
    var show = force == null ? helpPanel.hidden : !!force;
    helpPanel.hidden = !show;
    if (show) addMenu.hidden = true;
  }
  function normalizeUrl(v) {
    v = String(v || "").trim();
    if (!v) return "";
    try {
      if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return new URL(v).href;
      if (/^\//.test(v) || /^\./.test(v)) return new URL(v, location.href).href;
      return new URL("https://" + v).href;
    } catch (e) {
      return "";
    }
  }
  function resetAll() {
    state = defaultState();
    selected = "";
    renderNodes();
    requestAnimationFrame(function () {
      fitAll(true);
    });
    saveNow();
  }
  function toggleMax(force) {
    if (!stage) return;
    var on = force == null ? !stage.classList.contains("cfDcMax") : !!force;
    stage.classList.toggle("cfDcMax", on);
    var b = root.querySelector('[data-dc-tool="max"]');
    if (b) b.classList.toggle("on", on);
    setTimeout(function () {
      applyView();
    }, 50);
  }
  function frameAction(action, id) {
    var n = nodeById(id);
    if (!n) return;
    if (action === "remove") removeNode(id);
    else if (action === "duplicate") duplicateNode(id);
    else if (action === "front") frontNode(id);
    else if (action === "pop") popNode(id);
    else if (action === "lock") {
      n.locked = !n.locked;
      applyNodeStyle(n);
      saveNow();
    } else if (action === "ratio") {
      n.ratio = !n.ratio;
      applyNodeStyle(n);
      saveNow();
    }
  }
  function beginPointer(e) {
    if (!active || e.button > 1) return;
    var target = e.target;
    var resize = target.closest && target.closest(".cfDcResize");
    var frame = target.closest && target.closest(".cfDcFrame");
    var head = target.closest && target.closest(".cfDcFrameHead");
    var id = frame && frame.getAttribute("data-dc-id");
    if (spaceDown || e.button === 1) {
      op = {
        kind: "pan",
        pointer: e.pointerId,
        sx: e.clientX,
        sy: e.clientY,
        x: state.view.x,
        y: state.view.y,
      };
      root.classList.add("is-panning");
      try {
        root.setPointerCapture(e.pointerId);
      } catch (x) {}
      e.preventDefault();
      return;
    }
    if (resize && id) {
      var rn = nodeById(id);
      if (!rn || rn.locked) return;
      select(id);
      frontNode(id);
      op = {
        kind: "resize",
        pointer: e.pointerId,
        id: id,
        sx: e.clientX,
        sy: e.clientY,
        w: rn.w,
        h: rn.h,
      };
      root.classList.add("is-resizing");
      try {
        root.setPointerCapture(e.pointerId);
      } catch (x) {}
      e.preventDefault();
      return;
    }
    if (head && id && !(target.closest && target.closest("button"))) {
      var dn = nodeById(id);
      select(id);
      frontNode(id);
      if (!dn || dn.locked) return;
      op = {
        kind: "drag",
        pointer: e.pointerId,
        id: id,
        sx: e.clientX,
        sy: e.clientY,
        x: dn.x,
        y: dn.y,
      };
      root.classList.add("is-dragging");
      try {
        root.setPointerCapture(e.pointerId);
      } catch (x) {}
      e.preventDefault();
      return;
    }
    if (frame && id) {
      select(id);
      return;
    }
    if (target === viewport || target === world || target === empty) {
      select("");
      op = {
        kind: "pan",
        pointer: e.pointerId,
        sx: e.clientX,
        sy: e.clientY,
        x: state.view.x,
        y: state.view.y,
      };
      root.classList.add("is-panning");
      try {
        root.setPointerCapture(e.pointerId);
      } catch (x) {}
      e.preventDefault();
    }
  }
  function movePointer(e) {
    if (!op || e.pointerId !== op.pointer) return;
    var dx = e.clientX - op.sx;
    var dy = e.clientY - op.sy;
    if (op.kind === "pan") {
      state.view.x = op.x + dx;
      state.view.y = op.y + dy;
      applyView();
    } else if (op.kind === "drag") {
      var n = nodeById(op.id);
      if (!n) return;
      n.x = op.x + dx / state.view.zoom;
      n.y = op.y + dy / state.view.zoom;
      if (e.shiftKey) {
        n.x = Math.round(n.x / 10) * 10;
        n.y = Math.round(n.y / 10) * 10;
      }
      applyNodeStyle(n);
    } else if (op.kind === "resize") {
      var r = nodeById(op.id);
      if (!r) return;
      var nw = clamp(op.w + dx / state.view.zoom, 240, 2600);
      var nh = clamp(op.h + dy / state.view.zoom, 165, 1800);
      if (r.ratio && !e.altKey) nh = clamp((nw * 9) / 16 + HEAD_H, 165, 1800);
      r.w = nw;
      r.h = nh;
      applyNodeStyle(r);
    }
    e.preventDefault();
  }
  function endPointer(e) {
    if (!op || (e.pointerId != null && e.pointerId !== op.pointer)) return;
    flushPaint();
    updateFrameVisibility();
    op = null;
    if (root)
      root.classList.remove("is-panning", "is-dragging", "is-resizing");
    saveNow();
  }
  function onWheel(e) {
    if (!active) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey || e.altKey) {
      var factor = Math.exp(-e.deltaY * 0.002);
      zoomAt(e.clientX, e.clientY, state.view.zoom * factor);
    } else {
      state.view.x -= e.deltaX;
      state.view.y -= e.deltaY;
      applyView();
      saveSoon();
    }
  }
  function keyTarget(e) {
    var t = e.target;
    var tag = ((t && t.tagName) || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || (t && t.isContentEditable);
  }
  function onKeyDown(e) {
    if (!active || keyTarget(e)) return;
    var k = (e.key || "").toLowerCase();
    if (e.key === " " || e.code === "Space") {
      spaceDown = true;
      root.classList.add("is-space");
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (e.key === "Escape") {
      if (stage.classList.contains("cfDcMax")) toggleMax(false);
      else {
        toggleMenu(false);
        toggleHelp(false);
        select("");
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    var ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && k === "d" && selected) {
      duplicateNode(selected);
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (k === "0") {
      fitAll(true);
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (k === "1") {
      actualSize();
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (selected) removeNode(selected);
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (/^Arrow(Left|Right|Up|Down)$/.test(e.key)) {
      var n = nodeById(selected);
      var d = e.shiftKey ? 10 : 1;
      if (n && !n.locked) {
        if (e.key === "ArrowLeft") n.x -= d;
        if (e.key === "ArrowRight") n.x += d;
        if (e.key === "ArrowUp") n.y -= d;
        if (e.key === "ArrowDown") n.y += d;
        applyNodeStyle(n);
        saveSoon();
      } else {
        if (e.key === "ArrowLeft") state.view.x += 36;
        if (e.key === "ArrowRight") state.view.x -= 36;
        if (e.key === "ArrowUp") state.view.y += 36;
        if (e.key === "ArrowDown") state.view.y -= 36;
        applyView();
        saveSoon();
      }
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  function onKeyUp(e) {
    if (e.key === " " || e.code === "Space") {
      spaceDown = false;
      if (root) root.classList.remove("is-space");
    }
  }
  function onToolbar(e) {
    var b = e.target.closest && e.target.closest("[data-dc-tool]");
    if (!b) return;
    var act = b.getAttribute("data-dc-tool");
    if (act === "add") toggleMenu();
    else if (act === "zoom-in") zoomCenter(1.2);
    else if (act === "zoom-out") zoomCenter(1 / 1.2);
    else if (act === "fit") fitAll(true);
    else if (act === "actual") actualSize();
    else if (act === "grid") {
      state.grid = !state.grid;
      b.classList.toggle("on", state.grid);
      applyView();
      saveNow();
    } else if (act === "reset") resetAll();
    else if (act === "max") toggleMax();
    else if (act === "help") toggleHelp();
    e.preventDefault();
  }
  function onWorldClick(e) {
    var act = e.target.closest && e.target.closest("[data-dc-act]");
    var box = e.target.closest && e.target.closest(".cfDcFrame");
    if (act && box) {
      frameAction(
        act.getAttribute("data-dc-act"),
        box.getAttribute("data-dc-id"),
      );
      e.preventDefault();
      e.stopPropagation();
    }
  }
  function onWorldDblClick(e) {
    var title = e.target.closest && e.target.closest(".cfDcFrameTitle");
    var box = e.target.closest && e.target.closest(".cfDcFrame");
    if (!title || !box) return;
    var n = nodeById(box.getAttribute("data-dc-id"));
    if (!n) return;
    var next = window.prompt("Nama frame", n.title);
    if (next != null && String(next).trim()) {
      n.title = String(next).trim().slice(0, 80);
      title.textContent = n.title;
      box.setAttribute("aria-label", n.title);
      saveNow();
    }
  }
  function onAddMenu(e) {
    var b = e.target.closest && e.target.closest("[data-dc-add]");
    if (b && !b.disabled) {
      addNode(b.getAttribute("data-dc-add"));
      toggleMenu(false);
      return;
    }
    if (e.target && e.target.id === "cfDcAddUrl") {
      var input = el("cfDcUrlInput");
      var src = normalizeUrl(input && input.value);
      if (!src) {
        if (input) input.classList.add("bad");
        return;
      }
      if (input) input.classList.remove("bad");
      addNode("browser", {
        title: (input && input.value) || "Browser",
        src: src,
        ratio: false,
      });
      if (input) input.value = "";
      toggleMenu(false);
    }
  }
  function postPreviewVisibility(frame, visible) {
    if (!frame || !frame.contentWindow) return;
    try { frame.contentWindow.postMessage({ type: "cf:previewVisibility", visible: !!visible }, "*"); } catch (e) {}
  }
  function syncModeVisibility() {
    if (!stage) return;
    var pmode = stage.getAttribute("data-preview-mode") || "edit";
    var live = el("cfLiveFrame");
    postPreviewVisibility(live, !active && pmode === "live");
    if (root && !active) {
      Array.prototype.forEach.call(root.querySelectorAll("iframe"), function (f) {
        if (f !== live) postPreviewVisibility(f, false);
      });
    }
    try {
      document.dispatchEvent(new CustomEvent("cf:dualFrameVisibility", {
        detail: { id: "edit-native", type: "edit", visible: !active && pmode === "edit" },
      }));
    } catch (e) {}
  }
  function activate() {
    if (!root || active) return;
    active = true;
    root.hidden = false;
    root.classList.add("is-active");
    stage.classList.add("cfDcMode");
    renderNodes();
    applyView();
    if (freshState) {
      freshState = false;
      requestAnimationFrame(function () {
        fitAll(true);
      });
    }
  }
  function deactivate() {
    if (!root) return;
    var wasActive = active;
    active = false;
    root.classList.remove("is-active");
    spaceDown = false;
    op = null;
    root.hidden = true;
    root.classList.remove("is-space", "is-panning", "is-dragging", "is-resizing");
    stage.classList.remove("cfDcMode", "cfDcMax");
    if (wasActive) restoreNative();
    toggleMenu(false);
    toggleHelp(false);
    syncModeVisibility();
  }
  function setActive(on) {
    if (on) activate();
    else deactivate();
  }
  function build() {
    stage = el("cfPrevStage");
    var edit = el("projPreview");
    var live = el("cfLiveFrame");
    if (!stage || !edit || !live || el("cfDualCanvas")) return false;
    editMarker = makeMarker(edit, "edit-home");
    liveMarker = makeMarker(live, "live-home");
    live.addEventListener("load", function () {
      if (active) updateFrameVisibility();
      else syncModeVisibility();
    });
    state = loadState();
    root = document.createElement("div");
    root.id = "cfDualCanvas";
    root.className = "cfDualCanvas";
    root.hidden = true;
    root.innerHTML =
      '<div class="cfDcToolbar" role="toolbar" aria-label="Dual canvas controls">' +
      '<button type="button" class="cfDcPrimary" data-dc-tool="add">＋ Output</button>' +
      '<span class="cfDcSep"></span>' +
      '<button type="button" data-dc-tool="zoom-out" title="Zoom out">−</button>' +
      '<button type="button" class="cfDcZoom" data-dc-tool="actual" title="100% (1)">100%</button>' +
      '<button type="button" data-dc-tool="zoom-in" title="Zoom in">＋</button>' +
      '<button type="button" data-dc-tool="fit" title="Fit all (0)">Fit</button>' +
      '<span class="cfDcSep"></span>' +
      '<button type="button" data-dc-tool="grid" class="on" title="Grid">Grid</button>' +
      '<button type="button" data-dc-tool="reset" title="Reset layout">Reset</button>' +
      '<button type="button" data-dc-tool="max" title="Maximize canvas">⛶</button>' +
      '<button type="button" data-dc-tool="help" title="Shortcuts">?</button>' +
      '<span class="cfDcHint">Drag kosong = pan · Ctrl/⌘ + wheel = zoom</span>' +
      "</div>" +
      '<div class="cfDcViewport" tabindex="0" aria-label="Dual free canvas">' +
      '<div class="cfDcWorld"></div>' +
      '<div class="cfDcEmpty" hidden><b>Canvas kosong</b><span>Gunakan + Output untuk menambahkan layar.</span></div>' +
      '<div class="cfDcMini" title="Minimap · klik untuk Fit"></div>' +
      "</div>" +
      '<div class="cfDcAddMenu" hidden>' +
      '<b>Tambah output</b>' +
      '<button type="button" data-dc-add="edit"><span>✎</span>Edit Preview</button>' +
      '<button type="button" data-dc-add="live"><span>●</span>Live Output</button>' +
      '<button type="button" data-dc-add="stage"><span>▣</span>Stage Display</button>' +
      '<button type="button" data-dc-add="remote"><span>⌁</span>Remote Control</button>' +
      '<label>Browser / URL</label>' +
      '<div class="cfDcUrlRow"><input id="cfDcUrlInput" type="text" placeholder="https://…"><button id="cfDcAddUrl" type="button">Tambah</button></div>' +
      "</div>" +
      '<div class="cfDcHelp" hidden>' +
      '<b>Dual Free Canvas</b>' +
      '<span><kbd>Space</kbd> + drag / drag area kosong — Pan</span>' +
      '<span><kbd>Ctrl/⌘</kbd> + wheel — Zoom pada pointer</span>' +
      '<span><kbd>Arrow</kbd> — Geser frame terpilih 1 px</span>' +
      '<span><kbd>Shift</kbd> + Arrow — Geser 10 px</span>' +
      '<span><kbd>Ctrl/⌘ D</kbd> — Duplikat frame</span>' +
      '<span><kbd>Delete</kbd> — Keluarkan frame</span>' +
      '<span><kbd>0</kbd> Fit all · <kbd>1</kbd> 100% · <kbd>Esc</kbd> tutup</span>' +
      '<small>Alt saat resize melepas kunci rasio sementara.</small>' +
      "</div>";
    stage.appendChild(root);
    viewport = root.querySelector(".cfDcViewport");
    world = root.querySelector(".cfDcWorld");
    addMenu = root.querySelector(".cfDcAddMenu");
    helpPanel = root.querySelector(".cfDcHelp");
    zoomText = root.querySelector(".cfDcZoom");
    mini = root.querySelector(".cfDcMini");
    empty = root.querySelector(".cfDcEmpty");
    root.querySelector(".cfDcToolbar").addEventListener("click", onToolbar);
    addMenu.addEventListener("click", onAddMenu);
    world.addEventListener("click", onWorldClick);
    world.addEventListener("dblclick", onWorldDblClick);
    root.addEventListener("pointerdown", beginPointer);
    root.addEventListener("pointermove", movePointer);
    root.addEventListener("pointerup", endPointer);
    root.addEventListener("pointercancel", endPointer);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    mini.addEventListener("click", function () {
      fitAll(true);
    });
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", function () {
      spaceDown = false;
      if (root) root.classList.remove("is-space");
    });
    window.addEventListener("resize", function () {
      if (active) applyView();
    });
    var obs = new MutationObserver(function () {
      setActive(stage.getAttribute("data-preview-mode") === "dual");
    });
    obs.observe(stage, { attributes: true, attributeFilter: ["data-preview-mode"] });
    setActive(stage.getAttribute("data-preview-mode") === "dual");
    return true;
  }
  function boot() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (build() || tries > 80) clearInterval(iv);
    }, 100);
  }

  window.CastFlowDualCanvas = {
    version: VERSION,
    setActive: setActive,
    isActive: function () {
      return active;
    },
    add: addNode,
    remove: removeNode,
    duplicate: duplicateNode,
    select: select,
    fit: fitAll,
    actualSize: actualSize,
    reset: resetAll,
    centerOn: centerOnNode,
    getState: getState,
    save: saveNow,
    render: renderNodes,
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
