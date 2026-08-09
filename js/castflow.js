/* PNW-FILE-GUIDE
   js/castflow.js — lapisan CastFlow (v7.2). HANYA dimuat di castflow.html,
   PALING AKHIR (setelah yv-timeline.js).
   Isi:
   1. i18n dwibahasa — default ENGLISH, toggle EN/ID di bar atas.
   2. Pratinjau ATAS: resizable tinggi + PILIHAN RASIO/RESOLUSI (fit, 16:9,
      4:3, 1:1, 9:16) dengan letterbox, tersimpan di localStorage.
   3. Drag & drop gambar/video ke pratinjau -> latar (IndexedDB -> setBg).
   4. Library font besar + tambah font Google manual.
   5. SPLIT PANES — semua kolom panel bisa di-resize (splitter drag,
      double-click reset, transisi mulus, tersimpan) + drawer timeline
      bisa diubah tingginya dari tepi atasnya.
*/
(function () {
  "use strict";

  var CF_VERSION = "v7.2";
  var LANG_KEY = "pnwCastflowLang";
  var PREV_H_KEY = "pnwCastflowPrevH";
  var FONTS_KEY = "pnwCastflowFonts.v1";
  var COLS_KEY = "pnwCastflowCols.v1";
  var RATIO_KEY = "pnwCastflowPrevRatio";
  var TLH_KEY = "pnwCastflowTlH";

  function qa(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  }
  function safe(name, fn) {
    try {
      return fn();
    } catch (e) {
      try {
        if (window.PNWLog && window.PNWLog.event)
          window.PNWLog.event("castflow:" + name, {
            lvl: "error",
            message: String((e && e.message) || e),
            stack: e && e.stack ? String(e.stack).slice(0, 800) : "",
          });
      } catch (x) {}
    }
  }

  /* ================= 1. i18n ================= */
  var DICT = {
    "← Aplikasi utama": "← Main app",
    "Memuat data lagu…": "Loading songs…",
    "Buka jendela Output": "Open Output Window",
    "Masuk dengan Google": "Sign in with Google",
    "Keluar": "Sign out",
    "Log Error": "Error Log",
    "Belum masuk — hanya bisa melihat": "Not signed in — view only",
    "Pengguna": "User",
    " · boleh siaran": " · can broadcast",
    " · belum admin": " · not admin",

    "Playlist / Rundown": "Playlist / Rundown",
    "Baru": "New",
    "Simpan": "Save",
    "Belum ada item. Tambahkan lagu dari library.": "No items yet. Add songs from the library.",

    "Lagu": "Songs",
    "Alkitab": "Bible",
    "Teks": "Text",
    "Media": "Media",
    "Template": "Templates",
    "Cari lagu / filter library...": "Search songs / filter library...",
    "Semua": "All",
    "Di rencana": "In plan",
    "Buka slide": "Open slides",
    "+ Rundown": "+ Rundown",
    "Cari online": "Search online",
    "+ Daftarkan lagu": "+ Register song",

    "Tayangkan": "Go Live",
    "Bersihkan Layar": "Clear Screen",
    "Slide sebelumnya (←)": "Previous slide (←)",
    "Slide berikutnya (→ / Spasi)": "Next slide (→ / Space)",
    "Pengaturan Teks Sesi": "Session Text Settings",
    "Ukuran": "Size",
    "Baris per slide": "Lines per slide",
    "Perataan": "Alignment",
    "Bayangan": "Shadow",
    "Lembut": "Soft",
    "Tegas": "Strong",
    "Tanpa bayangan": "No shadow",
    "Kiri": "Left",
    "Tengah": "Center",
    "Kanan": "Right",

    "Latar Belakang": "Background",
    "Warna": "Color",
    "Animasi": "Animation",
    "Preset": "Presets",
    "Studio": "Studio",
    "Tempel URL gambar / video .mp4 sendiri": "Paste your own image / .mp4 video URL",
    "Transparan (papan catur)": "Transparent (checkerboard)",

    "Pratinjau": "Preview",
    "Contoh teks lirik": "Sample lyric text",
    "Seret gambar / video / animasi ke sini untuk latar": "Drag image / video / animation here for background",
    "Lepaskan media untuk latar": "Drop media for background",
    "Tarik untuk mengubah tinggi pratinjau": "Drag to resize preview",
    "Resolusi pratinjau": "Preview resolution",
    "Pas ke layar": "Fit to screen",
    "Seret untuk mengubah lebar · klik 2x untuk reset": "Drag to resize · double-click to reset",
    "Seret untuk mengubah tinggi timeline": "Drag to resize timeline height",

    "Fitur": "Features",
    "Tampilan": "Display",
    "Teks & Font": "Text & Font",
    "Latar": "Background",
    "Pratinjau & Output": "Preview & Output",

    "+ Lagu": "+ Song",
    "+ Teks": "+ Text",
    "+ Ayat": "+ Scripture",
    "+ Countdown": "+ Countdown",
    "+ Latar": "+ Background",
    "+ Media": "+ Media",
    "+ Overlay": "+ Overlay",
    "Hapus": "Delete",
    "Edit": "Edit",

    "Ke awal": "Go to start",
    "Putar / jeda (Spasi)": "Play / pause (Space)",
    "Stop & bersihkan layar": "Stop & clear screen",
    "Susun otomatis dari rundown": "Auto-arrange from rundown",
    "Belah clip terpilih di playhead (S)": "Split selected clip at playhead (S)",
    "Hapus clip terpilih (Del)": "Delete selected clip (Del)",
    "Urungkan (Ctrl+Z)": "Undo (Ctrl+Z)",
    "Ulangi (Ctrl+Shift+Z)": "Redo (Ctrl+Shift+Z)",
    "Snap ke detik & tepi clip": "Snap to seconds & clip edges",
    "Zoom timeline": "Zoom timeline",
    "Perkecil (-)": "Zoom out (-)",
    "Perbesar (+)": "Zoom in (+)",
    "Pas seluruh proyek (F)": "Fit entire project (F)",
    "Proyek timeline": "Timeline project",
    "Hapus proyek aktif": "Delete active project",
    "Edit clip terpilih (klik 2x pada clip)": "Edit selected clip (double-click clip)",
    "Tutup (T)": "Close (T)",
    "Hapus clip & rapatkan celah (Shift+Del)": "Delete clip & close gap (Shift+Del)",
    "Tambah marker di playhead (M)": "Add marker at playhead (M)",
    "Kunci track (lindungi dari edit)": "Lock track (protect from edits)",
    "Sembunyikan track ini di output": "Hide this track on output",
    "Lirik": "Lyrics",
    "Overlay": "Overlay",

    "Menunggu live dimulai…": "Waiting for live to start…",
    "Lagu terpilih": "Selected song",
    "Pilih lagu…": "Select song…",
  };
  var RULES = [
    [/^Lagu termuat: (\d+) \((.+)\)$/, function (m) {
      return "Songs loaded: " + m[1] + " (" + (m[2] === "perangkat ini" ? "this device" : m[2]) + ")";
    }],
    [/^Cloud tidak terbaca/, function () {
      return "Cloud unreadable — using this device's data.";
    }],
    [/^Siaran DITOLAK server \((.+)\)/, function (m) {
      return "Broadcast REJECTED by server (" + m[1] + ") — publish rules v83 / check admin login.";
    }],
    [/^Perintah bersihkan layar DITOLAK \((.+)\)/, function (m) {
      return "Clear-screen command REJECTED (" + m[1] + ").";
    }],
    [/^Siaran tidak bisa dibaca \((.+)\)/, function (m) {
      return "Broadcast unreadable (" + m[1] + "). Operator: publish Firebase rules v83 (live channel readable without login).";
    }],
    [/^Firebase tidak tersedia/, function () {
      return "Firebase is unavailable.";
    }],
    [/^♪ Lagu$/, function () { return "♪ Song"; }],
    [/^✝ Ayat$/, function () { return "✝ Scripture"; }],
    [/^(Gambar|Video|Animasi|Latar|Warna):\s/, function (m, s) {
      var map = { Gambar: "Image", Video: "Video", Animasi: "Animation", Latar: "Background", Warna: "Color" };
      return (map[m[1]] || m[1]) + ":" + s.slice(m[0].length - 1);
    }],
    [/^Memuat: (.+)$/, function (m) { return "Loading: " + m[1]; }],
    [/^Memuat lagu/, function () { return "Loading song…"; }],
  ];
  var RDICT = {};
  (function () {
    for (var k in DICT) if (DICT.hasOwnProperty(k)) RDICT[DICT[k]] = k;
  })();

  function lang() {
    try {
      return localStorage.getItem(LANG_KEY) === "id" ? "id" : "en";
    } catch (e) {
      return "en";
    }
  }
  function translateOne(s, to) {
    if (!s) return s;
    if (to === "en") {
      if (DICT[s]) return DICT[s];
      for (var i = 0; i < RULES.length; i++) {
        var m = s.match(RULES[i][0]);
        if (m) return RULES[i][1](m, s);
      }
      return s;
    }
    return RDICT[s] || s;
  }
  window.CFt = function (s) {
    try {
      return translateOne(String(s || ""), lang());
    } catch (e) {
      return s;
    }
  };

  function sweep(to) {
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (n) {
          if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          var p = n.parentNode;
          if (!p || !p.tagName) return NodeFilter.FILTER_REJECT;
          var tag = p.tagName.toLowerCase();
          if (tag === "script" || tag === "style") return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (t) {
      var raw = t.nodeValue;
      var trimmed = raw.replace(/^\s+|\s+$/g, "");
      var out = translateOne(trimmed, to);
      if (out !== trimmed) t.nodeValue = raw.replace(trimmed, out);
    });
    qa("[placeholder]").forEach(function (el2) {
      var cur = el2.getAttribute("placeholder");
      var out = translateOne(cur, to);
      if (out !== cur) el2.setAttribute("placeholder", out);
    });
    qa("[title]").forEach(function (el2) {
      var cur = el2.getAttribute("title");
      var out = translateOne(cur, to);
      if (out !== cur) el2.setAttribute("title", out);
    });
  }
  function paintLangSeg() {
    qa("#cfLangSeg [data-cflang]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-cflang") === lang());
    });
  }
  function applyLang() {
    paintLangSeg();
    if (lang() === "en") sweep("en");
    else sweep("id");
  }
  function initLang() {
    qa("#cfLangSeg [data-cflang]").forEach(function (b) {
      b.onclick = function () {
        try {
          localStorage.setItem(LANG_KEY, b.getAttribute("data-cflang"));
        } catch (e) {}
        applyLang();
      };
    });
    applyLang();
    setInterval(function () {
      if (lang() === "en") safe("sweep", function () { sweep("en"); });
    }, 1500);
  }

  /* ================= 2. pratinjau atas: tinggi + rasio ================= */
  var SIZES = { s: 140, m: 220, l: 330 };
  var RATIOS = { fit: 0, "16:9": 16 / 9, "4:3": 4 / 3, "1:1": 1, "9:16": 9 / 16 };
  function stage() {
    return document.getElementById("cfPrevStage");
  }
  function setPrevH(h, persist) {
    var st = stage();
    if (!st) return;
    h = Math.max(110, Math.min(560, Math.round(h)));
    st.style.height = h + "px";
    qa(".cfPrevSize").forEach(function (b) {
      var v = SIZES[b.getAttribute("data-cfsize")];
      b.classList.toggle("on", Math.abs(v - h) < 5);
    });
    if (persist !== false)
      try {
        localStorage.setItem(PREV_H_KEY, String(h));
      } catch (e) {}
    fitPreview();
  }
  function curRatio() {
    try {
      return localStorage.getItem(RATIO_KEY) || "fit";
    } catch (e) {
      return "fit";
    }
  }
  /* pasang rasio pratinjau: letterbox di tengah stage (fit = penuh) */
  function fitPreview() {
    var st = stage();
    var pv = document.getElementById("projPreview");
    if (!st || !pv) return;
    var r = RATIOS[curRatio()] || 0;
    if (!r) {
      pv.style.position = "";
      pv.style.inset = "";
      pv.style.left = "";
      pv.style.top = "";
      pv.style.transform = "";
      pv.style.width = "";
      pv.style.height = "";
      return;
    }
    var w = st.clientWidth;
    var h = st.clientHeight;
    if (!w || !h) return;
    var pw = w;
    var ph = pw / r;
    if (ph > h) {
      ph = h;
      pw = ph * r;
    }
    pv.style.position = "absolute";
    pv.style.inset = "auto";
    pv.style.left = "50%";
    pv.style.top = "50%";
    pv.style.transform = "translate(-50%,-50%)";
    pv.style.width = Math.round(pw) + "px";
    pv.style.height = Math.round(ph) + "px";
  }
  function initRatio() {
    var sel = document.getElementById("cfPrevRatio");
    if (!sel) return;
    sel.value = curRatio();
    sel.addEventListener("change", function () {
      try {
        localStorage.setItem(RATIO_KEY, sel.value);
      } catch (e) {}
      fitPreview();
    });
    fitPreview();
    if (window.ResizeObserver) {
      var st = stage();
      if (st) new ResizeObserver(function () { fitPreview(); }).observe(st);
    }
  }
  function initResize() {
    var rz = document.getElementById("cfPrevResizer");
    if (!rz || rz.__cfBound) return;
    rz.__cfBound = true;
    rz.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      var st = stage();
      if (!st) return;
      var y0 = ev.clientY;
      var h0 = st.getBoundingClientRect().height;
      function mv(e2) {
        setPrevH(h0 + (e2.clientY - y0), false);
      }
      function up(e2) {
        setPrevH(h0 + (e2.clientY - y0), true);
        document.removeEventListener("pointermove", mv);
        document.removeEventListener("pointerup", up);
      }
      document.addEventListener("pointermove", mv);
      document.addEventListener("pointerup", up);
    });
    qa(".cfPrevSize").forEach(function (b) {
      b.addEventListener("click", function () {
        setPrevH(SIZES[b.getAttribute("data-cfsize")] || 220, true);
      });
    });
    var saved = 0;
    try {
      saved = parseInt(localStorage.getItem(PREV_H_KEY) || "0", 10) || 0;
    } catch (e) {}
    setPrevH(saved || SIZES.m, !saved);
  }

  /* ================= 3. drag & drop media -> latar ================= */
  function notify2(msg, kind) {
    var tl = window.PNWProjector && window.PNWProjector.__tl;
    if (tl && tl.notify) return tl.notify(translateOne(msg, lang()), kind);
    if (window.toast) return window.toast(translateOne(msg, lang()), kind);
  }
  DICT["Hanya file gambar / video yang bisa di-drop."] = "Only image / video files can be dropped.";
  DICT["PNWMedia belum siap."] = "Media store not ready.";
  DICT["Latar diganti dari file drop."] = "Background replaced from dropped file.";
  DICT["Gagal menyimpan media"] = "Failed to save media";

  function initDrop() {
    var st = stage();
    if (!st || st.__cfDrop) return;
    st.__cfDrop = true;
    ["dragenter", "dragover"].forEach(function (ev2) {
      st.addEventListener(ev2, function (e) {
        e.preventDefault();
        e.stopPropagation();
        st.classList.add("drag");
      });
    });
    st.addEventListener("dragleave", function (e) {
      if (e.target === st) st.classList.remove("drag");
    });
    st.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      st.classList.remove("drag");
      var f =
        e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length
          ? e.dataTransfer.files[0]
          : null;
      if (!f) return;
      var mime = f.type || "";
      if (!/^image\//.test(mime) && !/^video\//.test(mime)) {
        notify2("Hanya file gambar / video yang bisa di-drop.", "error");
        return;
      }
      if (!window.PNWMedia || !window.PNWMedia.put) {
        notify2("PNWMedia belum siap.", "error");
        return;
      }
      window.PNWMedia.put(f)
        .then(function (id) {
          var bg = /^video\//.test(mime)
            ? { kind: "upload", value: "idb:" + id, mime: mime }
            : { kind: "image", value: "idb:" + id, mime: mime };
          var tl = window.PNWProjector && window.PNWProjector.__tl;
          if (tl && tl.setBg) tl.setBg(bg);
          notify2("Latar diganti dari file drop.", "success");
        })
        .catch(function (err) {
          notify2("Gagal menyimpan media: " + ((err && err.message) || err), "error");
        });
    });
    ["dragover", "drop"].forEach(function (ev2) {
      document.addEventListener(ev2, function (e) {
        e.preventDefault();
      });
    });
  }

  /* ================= 4. library font besar ================= */
  var MORE_FONTS = [
    "TikTok Sans",
    "Abril Fatface", "Acme", "Alata", "Alegreya", "Alegreya Sans", "Alfa Slab One",
    "Alice", "Amatic SC", "Amiri", "Anonymous Pro", "Archivo Black", "Archivo Narrow",
    "Arimo", "Arvo", "Asap", "Asap Condensed", "Assistant", "Atkinson Hyperlegible",
    "Baloo 2", "Barlow Semi Condensed", "Besley", "Big Shoulders Display", "BioRhyme",
    "Bitter", "Bodoni Moda", "Bree Serif", "Bricolage Grotesque", "Bungee", "Cantarell",
    "Cardo", "Catamaran", "Caveat", "Chivo", "Cinzel", "Comfortaa", "Cookie",
    "Cormorant", "Courgette", "Crimson Text", "Cuprum", "Dancing Script", "Didact Gothic",
    "DM Mono", "DM Serif Display", "Domine", "EB Garamond", "Epilogue", "Familjen Grotesk",
    "Faustina", "Fira Code", "Fira Sans Condensed", "Fjalla One", "Fragment Mono",
    "Francois One", "Gloock", "Gloria Hallelujah", "Golos Text", "Great Vibes",
    "Hedvig Letters Sans", "IBM Plex Mono", "IBM Plex Sans", "IBM Plex Serif", "Inconsolata",
    "Instrument Sans", "Instrument Serif", "Inter Tight", "Josefin Slab", "Kalnia",
    "Kaushan Script", "Kurale", "Lalezar", "League Spartan", "Libre Caslon Text",
    "Libre Franklin", "Literata", "Lobster", "Lora", "Marcellus", "Martian Mono",
    "Maven Pro", "Merriweather Sans", "Mukta", "Newsreader", "Noticia Text", "Noto Sans",
    "Noto Serif", "Old Standard TT", "Oleo Script", "Pacifico", "Patrick Hand",
    "Permanent Marker", "Philosopher", "Play", "Playball", "Prata", "Prompt",
    "PT Sans Narrow", "Public Sans", "Quattrocento", "Quattrocento Sans", "Questrial",
    "Red Hat Display", "Red Hat Text", "Righteous", "Roboto Mono", "Rokkitt", "Rufina",
    "Sacramento", "Saira", "Saira Condensed", "Satisfy", "Schibsted Grotesk", "Sen",
    "Shrikhand", "Signika Negative", "Slabo 27px", "Sora", "Source Serif 4", "Space Mono",
    "Spectral", "Syne", "Tinos", "Varela Round", "Vollkorn", "Zilla Slab",
    "Azeret Mono", "Ballet", "Baskervville", "Be Vietnam Pro", "Brygada 1918", "Cairo",
    "Chakra Petch", "Exo", "Forum", "Gantari", "Geologica", "Gudea", "Hind Siliguri",
    "Imprima", "Jura", "Karma", "Kumbh Sans", "League Gothic", "Monda", "News Cycle",
    "Orienta", "Padauk", "Palanquin", "Rationale", "Rosario", "Share", "Strait",
    "Texturina", "Tomorrow", "Varta", "Yantramanav", "Zen Kaku Gothic New", "Zen Loop",
  ];
  function customFonts() {
    try {
      var v = JSON.parse(localStorage.getItem(FONTS_KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }
  function extendFonts() {
    var P = window.PNWProjector;
    if (!P || !P.fonts || !P.fonts.length) return;
    var have = {};
    P.fonts.forEach(function (f) {
      have[f] = true;
    });
    MORE_FONTS.concat(customFonts()).forEach(function (f) {
      if (f && !have[f]) {
        P.fonts.push(f);
        have[f] = true;
      }
    });
  }
  function addCustomFont(name) {
    name = String(name || "").trim();
    if (!name) return;
    var P = window.PNWProjector;
    var YV = window.PNWYouthViews;
    if (YV && YV.ensureFont) YV.ensureFont(name);
    if (P && P.fonts && P.fonts.indexOf(name) < 0) {
      P.fonts.push(name);
      var list = customFonts();
      if (list.indexOf(name) < 0) {
        list.push(name);
        try {
          localStorage.setItem(FONTS_KEY, JSON.stringify(list));
        } catch (e) {}
      }
    }
    var sel = document.getElementById("projFont");
    if (sel) {
      var opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
      sel.value = name;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  function initCustomFont() {
    var sel = document.getElementById("projFont");
    if (!sel) return;
    var field = sel.closest ? sel.closest(".projField") : null;
    if (!field || field.__cfFont) return;
    field.__cfFont = true;
    var row = document.createElement("div");
    row.style.cssText = "display:flex;gap:6px;margin-top:6px;";
    var inp = document.createElement("input");
    inp.type = "text";
    inp.id = "cfFontName";
    inp.placeholder = "Tambah font Google apa pun…";
    inp.style.cssText =
      "flex:1;background:#1e1e21;border:1px solid #3a3a40;color:#eceef2;border-radius:8px;padding:6px 9px;font-size:12px;";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "+";
    btn.title = "Tambah font";
    btn.style.cssText =
      "background:#1282a2;border:1px solid #1282a2;color:#eaf7fb;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:700;";
    DICT["Tambah font Google apa pun…"] = "Add any Google font…";
    DICT["Tambah font"] = "Add font";
    function go() {
      addCustomFont(inp.value);
      inp.value = "";
    }
    btn.onclick = go;
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") go();
    });
    row.appendChild(inp);
    row.appendChild(btn);
    field.appendChild(row);
  }

  /* ================= 5. SPLIT PANES (kolom resizable) ================= */
  /* Susunan grid: rail | L | CENTER(1fr) | R. Splitter di antara kolom;
     lebar kolom tetap (px) kecuali CENTER yang selalu fleksibel. */
  function gridPanes() {
    var g = document.querySelector(".projGrid");
    if (!g) return null;
    var kids = qa(".projPane", g).filter(function (el2) {
      return el2.parentNode === g;
    });
    return kids.length >= 3 ? { g: g, kids: kids } : null;
  }
  function defCols(n) {
    return n >= 4 ? [148, 224, 336] : [224, 336];
  }
  function colClamp(n, i, v) {
    var mins = n >= 4 ? [96, 170, 260] : [170, 260];
    var maxs = n >= 4 ? [220, 340, 480] : [340, 480];
    return Math.max(mins[i] || 120, Math.min(maxs[i] || 520, v));
  }
  function loadCols(n) {
    try {
      var v = JSON.parse(localStorage.getItem(COLS_KEY) || "null");
      if (v && Array.isArray(v.w) && v.n === n) return v.w;
    } catch (e) {}
    return defCols(n);
  }
  function saveCols(n, w) {
    try {
      localStorage.setItem(COLS_KEY, JSON.stringify({ n: n, w: w }));
    } catch (e) {}
  }
  /* indeks widths[] melewatkan kolom CENTER (kedua dari kanan) */
  function wIdx(n, paneIdx) {
    return paneIdx < n - 2 ? paneIdx : paneIdx - 1;
  }
  function applyCols(widths, smooth) {
    var pk = gridPanes();
    if (!pk) return;
    var g = pk.g;
    var n = pk.kids.length;
    if (window.innerWidth <= 900) return; /* mobile: grid 1 kolom bawaan */
    var parts = [];
    for (var i = 0; i < n; i++) {
      parts.push(i === n - 2 ? "minmax(0,1fr)" : colClamp(n, wIdx(n, i), widths[wIdx(n, i)]) + "px");
      if (i < n - 1) parts.push("5px");
    }
    if (smooth) {
      g.classList.add("cfSmooth");
      setTimeout(function () {
        g.classList.remove("cfSmooth");
      }, 240);
    }
    /* inline + important mengalahkan grid-template-columns !important di design.css */
    g.style.setProperty("grid-template-columns", parts.join(" "), "important");
    g.style.setProperty("gap", "0", "important");
  }
  function buildSplitters() {
    var pk = gridPanes();
    if (!pk || pk.g.__cfSplit) return;
    var g = pk.g;
    var kids = pk.kids;
    var n = kids.length;
    pk.g.__cfSplit = true;
    for (var i = 0; i < n - 1; i++) {
      var sp = document.createElement("div");
      sp.className = "cfSplitter";
      sp.setAttribute("data-sp", String(i));
      sp.title = "Seret untuk mengubah lebar · klik 2x untuk reset";
      g.insertBefore(sp, kids[i + 1]);
    }
    var widths = loadCols(n);
    applyCols(widths, false);
    qa(".cfSplitter", g).forEach(function (sp) {
      sp.addEventListener("pointerdown", function (ev) {
        ev.preventDefault();
        var idx = parseInt(sp.getAttribute("data-sp"), 10);
        var x0 = ev.clientX;
        var pk2 = gridPanes();
        if (!pk2) return;
        var n2 = pk2.kids.length;
        var start = loadCols(n2);
        sp.classList.add("dragging");
        document.body.classList.add("cfColResize");
        function mv(e2) {
          var dx = e2.clientX - x0;
          var w2 = start.slice();
          if (idx === n2 - 2) {
            /* splitter sebelum kolom terakhir: atur kolom KANAN (terbalik) */
            var ri = n2 - 2; /* indeks widths untuk pane terakhir */
            w2[ri] = colClamp(n2, ri, start[ri] - dx);
          } else {
            var fi = idx < n2 - 2 ? idx : idx - 1;
            w2[fi] = colClamp(n2, fi, start[fi] + dx);
          }
          widths = w2;
          applyCols(w2, false);
        }
        function up() {
          document.removeEventListener("pointermove", mv);
          document.removeEventListener("pointerup", up);
          sp.classList.remove("dragging");
          document.body.classList.remove("cfColResize");
          saveCols(n2, widths);
        }
        document.addEventListener("pointermove", mv);
        document.addEventListener("pointerup", up);
      });
      sp.addEventListener("dblclick", function () {
        var pk3 = gridPanes();
        if (!pk3) return;
        widths = defCols(pk3.kids.length);
        applyCols(widths, true);
        saveCols(pk3.kids.length, widths);
      });
    });
  }
  function initSplitPanes() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      /* tunggu rail disisipkan projector.js (biasanya <100ms setelah open) */
      var pk = gridPanes();
      if (pk && pk.kids.length >= 3 && !pk.g.__cfSplit) buildSplitters();
      if ((pk && pk.g.__cfSplit) || tries > 60) clearInterval(iv);
    }, 250);
    window.addEventListener("resize", function () {
      safe("splitResize", function () {
        var g = document.querySelector(".projGrid");
        if (!g || !g.__cfSplit) return;
        if (window.innerWidth <= 900) g.style.removeProperty("grid-template-columns");
        else applyCols(loadCols(gridPanes().kids.length), false);
      });
    });
  }

  /* ================= 6. drawer timeline: tinggi resizable ================= */
  function initTlResizer() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var d = document.getElementById("tlDrawer");
      if (d && !d.__cfResz) {
        d.__cfResz = true;
        var h = document.createElement("div");
        h.className = "cfTlResizer";
        h.title = "Seret untuk mengubah tinggi timeline";
        h.innerHTML = "<span></span>";
        d.appendChild(h);
        var saved = 0;
        try {
          saved = parseInt(localStorage.getItem(TLH_KEY) || "0", 10) || 0;
        } catch (e) {}
        if (saved) d.style.setProperty("height", saved + "px", "important");
        h.addEventListener("pointerdown", function (ev) {
          ev.preventDefault();
          var y0 = ev.clientY;
          var h0 = d.getBoundingClientRect().height;
          function mv(e2) {
            var nh = Math.max(170, Math.min(window.innerHeight * 0.82, h0 + (y0 - e2.clientY)));
            d.style.setProperty("height", Math.round(nh) + "px", "important");
          }
          function up() {
            document.removeEventListener("pointermove", mv);
            document.removeEventListener("pointerup", up);
            try {
              localStorage.setItem(
                TLH_KEY,
                String(Math.round(d.getBoundingClientRect().height)),
              );
            } catch (e) {}
          }
          document.addEventListener("pointermove", mv);
          document.addEventListener("pointerup", up);
        });
        clearInterval(iv);
      }
      if (tries > 80) clearInterval(iv);
    }, 400);
  }

  /* ================= boot ================= */
  function boot() {
    safe("fonts", extendFonts);
    safe("lang", initLang);
    safe("resize", initResize);
    safe("ratio", initRatio);
    safe("drop", initDrop);
    safe("customFont", initCustomFont);
    safe("splitPanes", initSplitPanes);
    safe("tlResizer", initTlResizer);
  }
  window.CastFlow = {
    version: CF_VERSION,
    lang: lang,
    setLang: function (l) {
      try {
        localStorage.setItem(LANG_KEY, l === "id" ? "id" : "en");
      } catch (e) {}
      applyLang();
    },
    applyLang: applyLang,
    translate: translateOne,
    addCustomFont: addCustomFont,
    setPreviewHeight: setPrevH,
    setRatio: function (r) {
      try {
        localStorage.setItem(RATIO_KEY, r);
      } catch (e) {}
      var sel = document.getElementById("cfPrevRatio");
      if (sel) sel.value = r;
      fitPreview();
    },
    resetColumns: function () {
      var pk = gridPanes();
      if (!pk) return;
      applyCols(defCols(pk.kids.length), true);
      saveCols(pk.kids.length, defCols(pk.kids.length));
    },
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
