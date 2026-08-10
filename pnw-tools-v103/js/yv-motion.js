/* PNW-FILE-GUIDE
   js/yv-motion.js — Mesin animasi latar belakang CastFlow (v5.5).
   • window.PNWMotion : mesin canvas generatif (8 engine) yang bisa diedit dari web
     dan bereaksi mengikuti alur lirik (pulse per baris + mood per bagian lagu).
   • window.PNWMedia  : penyimpan file lokal (IndexedDB) untuk video/GIF hasil
     ekspor Canva dsb, supaya jendela output bisa membacanya lintas tab — offline.
   Tidak bergantung file lain. Dimuat sebelum js/app.js.
 */
(function () {
  "use strict";

  /* =====================================================================
     1. PNWMedia — simpan file besar di IndexedDB (lintas tab, offline)
     ===================================================================== */
  var DB_NAME = "pnwYvMedia";
  var STORE = "files";

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error("IndexedDB tidak tersedia"));
      var rq = indexedDB.open(DB_NAME, 1);
      rq.onupgradeneeded = function () {
        var db = rq.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      };
      rq.onsuccess = function () { resolve(rq.result); };
      rq.onerror = function () { reject(rq.error || new Error("gagal buka database")); };
    });
  }
  function tx(mode) {
    return openDb().then(function (db) {
      return db.transaction(STORE, mode).objectStore(STORE);
    });
  }
  var _urlCache = {};

  var PNWMedia = {
    put: function (file) {
      var id = "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      return tx("readwrite").then(function (st) {
        return new Promise(function (resolve, reject) {
          var rec = { id: id, name: file.name || "media", type: file.type || "", size: file.size || 0, at: Date.now(), blob: file };
          var rq = st.put(rec);
          rq.onsuccess = function () { resolve(id); };
          rq.onerror = function () { reject(rq.error); };
        });
      });
    },
    get: function (id) {
      return tx("readonly").then(function (st) {
        return new Promise(function (resolve, reject) {
          var rq = st.get(id);
          rq.onsuccess = function () { resolve(rq.result || null); };
          rq.onerror = function () { reject(rq.error); };
        });
      });
    },
    list: function () {
      return tx("readonly").then(function (st) {
        return new Promise(function (resolve, reject) {
          var out = [];
          var rq = st.openCursor();
          rq.onsuccess = function () {
            var c = rq.result;
            if (!c) return resolve(out.sort(function (a, b) { return b.at - a.at; }));
            var v = c.value;
            out.push({ id: v.id, name: v.name, type: v.type, size: v.size, at: v.at });
            c.continue();
          };
          rq.onerror = function () { reject(rq.error); };
        });
      });
    },
    del: function (id) {
      return tx("readwrite").then(function (st) {
        return new Promise(function (resolve) {
          var rq = st.delete(id);
          rq.onsuccess = function () { resolve(true); };
          rq.onerror = function () { resolve(false); };
        });
      });
    },
    // "idb:<id>" -> object URL lokal di tab ini
    resolve: function (value) {
      var v = String(value || "");
      if (v.indexOf("idb:") !== 0) return Promise.resolve(v);
      var id = v.slice(4);
      if (_urlCache[id]) return Promise.resolve(_urlCache[id]);
      return PNWMedia.get(id).then(function (rec) {
        if (!rec || !rec.blob) throw new Error("file tidak ditemukan");
        var url = URL.createObjectURL(rec.blob);
        _urlCache[id] = url;
        return url;
      });
    },
  };
  window.PNWMedia = PNWMedia;

  /* =====================================================================
     2. PNWMotion — mesin animasi latar generatif
     ===================================================================== */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hexToRgb(hex) {
    var h = String(hex || "#000000").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return { r: 0, g: 0, b: 0 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgba(hex, a) {
    var c = hexToRgb(hex);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }

  function defaults() {
    return {
      engine: "particles",
      color1: "#070b18",
      color2: "#182a5c",
      accent: "#8fb8ff",
      speed: 1,
      density: 1,
      size: 1,
      glow: 0.7,
      vignette: 0.55,
      grain: 0.06,
      reactivity: 0.9,
      angle: 160,
    };
  }

  // Preset siap pakai — gaya yang lazim dipakai ibadah modern
  var PRESETS = {
    ember:      { name: "Ember",        engine: "particles", color1: "#120604", color2: "#4a1206", accent: "#ffa347", speed: 0.9, density: 1.2, size: 1.1, glow: 0.9, vignette: 0.6, grain: 0.08, reactivity: 1.1, angle: 0 },
    aurora:     { name: "Aurora",       engine: "smoke",     color1: "#04070f", color2: "#0d2a4a", accent: "#57f7c8", speed: 0.6, density: 1, size: 1.4, glow: 0.8, vignette: 0.5, grain: 0.05, reactivity: 0.9, angle: 200 },
    starfall:   { name: "Starfall",     engine: "starfield", color1: "#04060e", color2: "#101a36", accent: "#ffffff", speed: 1.1, density: 1.4, size: 0.8, glow: 0.6, vignette: 0.65, grain: 0.04, reactivity: 1, angle: 180 },
    oceanic:    { name: "Oceanic",      engine: "waves",     color1: "#03121c", color2: "#0a3550", accent: "#63d2ff", speed: 0.7, density: 1, size: 1.2, glow: 0.5, vignette: 0.5, grain: 0.05, reactivity: 0.8, angle: 170 },
    bokehGlow:  { name: "Bokeh Glow",   engine: "bokeh",     color1: "#0a0713", color2: "#2a1440", accent: "#ffd6a5", speed: 0.5, density: 0.9, size: 1.6, glow: 1, vignette: 0.55, grain: 0.07, reactivity: 0.7, angle: 150 },
    lightRays:  { name: "Light Rays",   engine: "rays",      color1: "#050a16", color2: "#16305e", accent: "#ffe9b8", speed: 0.4, density: 1, size: 1, glow: 0.8, vignette: 0.6, grain: 0.06, reactivity: 0.85, angle: 190 },
    nebula:     { name: "Nebula",       engine: "smoke",     color1: "#0a0512", color2: "#3b1055", accent: "#c98bff", speed: 0.5, density: 1.1, size: 1.5, glow: 0.9, vignette: 0.6, grain: 0.08, reactivity: 0.95, angle: 210 },
    holyGrid:   { name: "Holy Grid",    engine: "grid",      color1: "#04060f", color2: "#0b2140", accent: "#7c8cff", speed: 0.8, density: 1, size: 1, glow: 0.6, vignette: 0.7, grain: 0.05, reactivity: 1, angle: 180 },
    dust:       { name: "Golden Dust",  engine: "particles", color1: "#0b0a06", color2: "#2e2410", accent: "#ffdc8a", speed: 0.5, density: 1.5, size: 0.7, glow: 0.8, vignette: 0.5, grain: 0.06, reactivity: 0.8, angle: 160 },
    pulseWave:  { name: "Pulse Wave",   engine: "rings",     color1: "#04060f", color2: "#122a4d", accent: "#8fe9ff", speed: 1, density: 1, size: 1, glow: 0.85, vignette: 0.6, grain: 0.05, reactivity: 1.3, angle: 180 },
  };

  // mood mengikuti bagian lagu (flow lirik)
  var MOODS = [
    { re: /(reff|chorus|refrein)/i, energy: 1.35, zoom: 1.05 },
    { re: /(bridge|interlude|musik|solo)/i, energy: 1.15, zoom: 1.02 },
    { re: /(intro|ending|outro|coda)/i, energy: 0.65, zoom: 0.98 },
    { re: /(bait|verse|pre)/i, energy: 0.85, zoom: 1 },
  ];
  function moodOf(label) {
    var s = String(label || "");
    for (var i = 0; i < MOODS.length; i++) if (MOODS[i].re.test(s)) return MOODS[i];
    return { energy: 1, zoom: 1 };
  }

  var _sprites = {};
  function sprite(color) {
    if (_sprites[color]) return _sprites[color];
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var g = c.getContext("2d");
    var rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, rgba(color, 1));
    rg.addColorStop(0.25, rgba(color, 0.55));
    rg.addColorStop(1, rgba(color, 0));
    g.fillStyle = rg;
    g.fillRect(0, 0, 64, 64);
    _sprites[color] = c;
    return c;
  }

  function create(canvas) {
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext("2d");
    var P = defaults();
    var W = 0, H = 0, DPR = 1;
    var raf = 0, last = 0, t = 0;
    var energy = 0;      // hentakan sesaat (per baris / per slide)
    var mood = { energy: 1, zoom: 1 };
    var moodMix = 1;
    var items = [];
    var running = false;
    var seedKey = "";

    function resize() {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width || canvas.clientWidth || 640));
      var h = Math.max(1, Math.round(r.height || canvas.clientHeight || 360));
      DPR = Math.min(1.5, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(w * DPR) || canvas.height !== Math.round(h * DPR)) {
        canvas.width = Math.round(w * DPR);
        canvas.height = Math.round(h * DPR);
      }
      W = w; H = h;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function seed(force) {
      var key = P.engine + "|" + P.density + "|" + Math.round(W) + "x" + Math.round(H);
      if (!force && key === seedKey) return;
      seedKey = key;
      items = [];
      var area = Math.max(1, (W * H) / (1280 * 720));
      var n;
      if (P.engine === "particles") n = Math.round(70 * P.density * area);
      else if (P.engine === "bokeh") n = Math.round(16 * P.density * area);
      else if (P.engine === "starfield") n = Math.round(120 * P.density * area);
      else if (P.engine === "smoke") n = Math.round(6 * P.density);
      else if (P.engine === "rings") n = 5;
      else n = 0;
      n = clamp(n, 0, 400);
      for (var i = 0; i < n; i++) {
        items.push({
          x: Math.random() * W,
          y: Math.random() * H,
          z: Math.random(),
          r: 0.4 + Math.random() * 1.6,
          ph: Math.random() * Math.PI * 2,
          sp: 0.4 + Math.random(),
        });
      }
    }

    function paintBase() {
      var a = ((P.angle || 180) * Math.PI) / 180;
      var dx = Math.cos(a) * W * 0.5, dy = Math.sin(a) * H * 0.5;
      var g = ctx.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy);
      g.addColorStop(0, P.color1);
      g.addColorStop(1, P.color2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    function paintParticles(boost) {
      var sp = sprite(P.accent);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        p.y -= (6 + p.sp * 16) * P.speed * boost * 0.016;
        p.x += Math.sin(t * 0.4 + p.ph) * 0.25 * P.speed;
        if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
        var s = p.r * 26 * P.size * (0.8 + 0.4 * Math.sin(t + p.ph));
        ctx.globalAlpha = clamp(0.16 * P.glow * (0.6 + p.z) * boost, 0, 0.9);
        ctx.drawImage(sp, p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    function paintBokeh(boost) {
      var sp = sprite(P.accent);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        var x = p.x + Math.sin(t * 0.18 * P.speed + p.ph) * 40;
        var y = p.y + Math.cos(t * 0.14 * P.speed + p.ph) * 30;
        var s = (60 + p.z * 190) * P.size * (1 + 0.06 * Math.sin(t + p.ph));
        ctx.globalAlpha = clamp(0.1 * P.glow * boost * (0.4 + p.z), 0, 0.7);
        ctx.drawImage(sp, x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    function paintSmoke(boost) {
      var sp = sprite(P.accent);
      ctx.globalCompositeOperation = "screen";
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        var x = W * 0.5 + Math.sin(t * 0.12 * P.speed + p.ph) * W * 0.42;
        var y = H * 0.5 + Math.cos(t * 0.09 * P.speed + p.ph * 1.7) * H * 0.38;
        var s = (W * 0.5 + p.z * W * 0.35) * P.size * (0.9 + 0.1 * Math.sin(t * 0.5 + p.ph));
        ctx.globalAlpha = clamp(0.1 * P.glow * boost, 0, 0.5);
        ctx.drawImage(sp, x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    function paintStarfield(boost) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = P.accent;
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        p.z -= 0.0022 * P.speed * boost;
        if (p.z <= 0.02) { p.z = 1; p.x = Math.random() * W; p.y = Math.random() * H; }
        var k = 1 / p.z;
        var x = W / 2 + (p.x - W / 2) * k * 0.5;
        var y = H / 2 + (p.y - H / 2) * k * 0.5;
        if (x < -50 || x > W + 50 || y < -50 || y > H + 50) continue;
        var s = clamp(k * 0.9 * P.size, 0.3, 4);
        ctx.globalAlpha = clamp((1 - p.z) * P.glow * boost, 0, 1);
        ctx.fillRect(x, y, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    function paintWaves(boost) {
      ctx.globalCompositeOperation = "lighter";
      var bands = 3;
      for (var b = 0; b < bands; b++) {
        var amp = (14 + b * 12) * P.size * boost;
        var yBase = H * (0.55 + b * 0.13);
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (var x = 0; x <= W; x += 12) {
          var y = yBase + Math.sin(x * 0.006 + t * (0.5 + b * 0.22) * P.speed) * amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = rgba(P.accent, clamp(0.05 * P.glow * boost, 0, 0.28));
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function paintRays(boost) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(W * 0.5, -H * 0.15);
      ctx.rotate(Math.sin(t * 0.08 * P.speed) * 0.14);
      var n = Math.round(12 * P.density);
      var len = H * 1.7;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI - Math.PI / 2;
        var wRay = (0.014 + 0.012 * Math.sin(t * 0.6 + i)) * P.size;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - wRay) * len, Math.sin(a - wRay) * len + len * 0.2);
        ctx.lineTo(Math.cos(a + wRay) * len, Math.sin(a + wRay) * len + len * 0.2);
        ctx.closePath();
        ctx.fillStyle = rgba(P.accent, clamp(0.035 * P.glow * boost, 0, 0.2));
        ctx.fill();
      }
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    }

    function paintGrid(boost) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgba(P.accent, clamp(0.16 * P.glow * boost, 0, 0.5));
      ctx.lineWidth = 1;
      var horizon = H * 0.55;
      var off = (t * 26 * P.speed) % 40;
      for (var y = horizon + off; y < H + 40; y += 40) {
        var k = (y - horizon) / (H - horizon);
        ctx.globalAlpha = clamp(k, 0, 1);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.globalAlpha = 0.5;
      var cols = Math.round(16 * P.density);
      for (var i = 0; i <= cols; i++) {
        var fx = (i / cols - 0.5) * 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 + fx * W * 0.08, horizon);
        ctx.lineTo(W / 2 + fx * W * 1.6, H);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    function paintRings(boost) {
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        var phase = (t * 0.22 * P.speed + i / items.length) % 1;
        var rad = phase * Math.max(W, H) * 0.75 * P.size * boost;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, rad, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(P.accent, clamp((1 - phase) * 0.28 * P.glow * boost, 0, 0.6));
        ctx.lineWidth = 2 + 6 * (1 - phase) * P.size;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function paintVignette() {
      if (P.vignette <= 0) return;
      var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0," + clamp(P.vignette, 0, 0.95) + ")");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    var grainTile = null;
    function paintGrain() {
      if (P.grain <= 0) return;
      if (!grainTile) {
        grainTile = document.createElement("canvas");
        grainTile.width = grainTile.height = 96;
        var g = grainTile.getContext("2d");
        var img = g.createImageData(96, 96);
        for (var i = 0; i < img.data.length; i += 4) {
          var v = 128 + ((Math.random() * 90) | 0) - 45;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
        g.putImageData(img, 0, 0);
      }
      ctx.save();
      ctx.globalAlpha = clamp(P.grain, 0, 0.25);
      ctx.globalCompositeOperation = "overlay";
      var pat = ctx.createPattern(grainTile, "repeat");
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    function frame(ts) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;
      t += dt;
      energy *= Math.exp(-dt * 2.6);            // hentakan meluruh halus
      moodMix += (mood.energy - moodMix) * Math.min(1, dt * 2);
      var boost = moodMix * (1 + energy * 1.1 * P.reactivity);

      resize();
      seed(false);
      paintBase();
      var e = P.engine;
      if (e === "particles") paintParticles(boost);
      else if (e === "bokeh") paintBokeh(boost);
      else if (e === "smoke") paintSmoke(boost);
      else if (e === "starfield") paintStarfield(boost);
      else if (e === "waves") paintWaves(boost);
      else if (e === "rays") paintRays(boost);
      else if (e === "grid") paintGrid(boost);
      else if (e === "rings") paintRings(boost);
      paintVignette();
      paintGrain();
    }

    var inst = {
      params: function () { return JSON.parse(JSON.stringify(P)); },
      apply: function (p) {
        if (p && typeof p === "object") {
          Object.keys(p).forEach(function (k) {
            if (k !== "name" && p[k] !== undefined && p[k] !== null) P[k] = p[k];
          });
        }
        resize();
        seed(true);
        return inst;
      },
      start: function (p) {
        inst.apply(p);
        if (running) return inst;
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
        return inst;
      },
      stop: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        return inst;
      },
      // hentakan mengikuti lirik: 1 = ganti slide, 0.3 = per baris
      pulse: function (s) {
        energy = clamp(energy + (typeof s === "number" ? s : 1), 0, 2.2);
        return inst;
      },
      // mood mengikuti bagian lagu (Verse / Chorus / Bridge ...)
      setMood: function (label) {
        mood = moodOf(label);
        return inst;
      },
      resize: resize,
      isRunning: function () { return running; },
    };
    return inst;
  }

  var YV_ENGINE = {
    create: create,
    defaults: defaults,
    presets: PRESETS,
    presetList: function () {
      return Object.keys(PRESETS).map(function (k) {
        return { id: k, name: PRESETS[k].name };
      });
    },
    preset: function (id) {
      var p = PRESETS[id];
      return p ? Object.assign(defaults(), p) : defaults();
    },
    engines: [
      { id: "particles", name: "Partikel naik" },
      { id: "bokeh", name: "Bokeh" },
      { id: "smoke", name: "Asap / Nebula" },
      { id: "starfield", name: "Bintang" },
      { id: "waves", name: "Gelombang" },
      { id: "rays", name: "Sinar" },
      { id: "grid", name: "Grid" },
      { id: "rings", name: "Cincin pulsa" },
    ],
  };

  // v5.8: gabungkan, jangan timpa. js/motion.js memasang stagger &
  // revealLines di window.PNWMotion dan dipakai Song Bank + output lirik.
  window.PNWYVMotion = YV_ENGINE;
  window.PNWMotion = Object.assign({}, window.PNWMotion || {}, YV_ENGINE);
})();
