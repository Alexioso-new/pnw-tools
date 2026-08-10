/* PNW-FILE-GUIDE
   js/castflow.js — lapisan CastFlow (v7.7). HANYA dimuat di castflow.html,
   PALING AKHIR (setelah yv-timeline.js).
   Isi:
   1. i18n dwibahasa (default English, toggle EN/ID).
   2. Pratinjau: rasio/resolusi (fit/16:9/4:3/1:1/9:16/KUSTOM) dengan letterbox.
   3. Drag & drop gambar/video ke pratinjau -> latar (IndexedDB).
   4. Library font besar + tambah font Google manual.
   5. WORKSPACE 2D (mockup): MENU | PREVIEW | DESIGN / PLAYLIST | LYRIC|TIMELINE
      — semua celah = splitter resizable (kolom + baris), tersimpan.
   6. Toggle Lyric Control <-> Timeline di sel tengah-bawah.
   7. Pratinjau melayang (pop-out) drag + resize bebas + penyembuhan diri.
   8. Drawer timeline bisa diubah tingginya (mode overlay).
*/
(function () {
  "use strict";

  var CF_VERSION = "v8.0";
  var LANG_KEY = "pnwCastflowLang";
  var FONTS_KEY = "pnwCastflowFonts.v1";
  var GRID_KEY = "pnwCastflowGrid.v1";
  var RATIO_KEY = "pnwCastflowPrevRatio";
  var TLH_KEY = "pnwCastflowTlH";
  var FLOAT_KEY = "pnwCastflowFloat.v1";
  var TL_VIEW_KEY = "pnwCastflowLyricView";

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
    "Resolusi pratinjau": "Preview resolution",
    "Pas ke layar": "Fit to screen",
    "Kustom…": "Custom…",
    "Lebar": "Width",
    "Tinggi": "Height",
    "Terapkan": "Apply",
    "Lepas / sematkan pratinjau": "Pop out / dock preview",
    "Pratinjau sedang melayang — tekan ⧉ atau ⤓ Dock untuk mengembalikan.":
      "Preview is floating — press ⧉ or ⤓ Dock to bring it back.",
    "Seret untuk mengubah tata letak · klik 2x untuk reset":
      "Drag to resize layout · double-click to reset",
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

  /* ================= 2. pratinjau: rasio + resolusi kustom ================= */
  var RATIOS = { fit: 0, "16:9": 16 / 9, "4:3": 4 / 3, "1:1": 1, "9:16": 9 / 16 };
  function stage() {
    return document.getElementById("cfPrevStage");
  }
  function curRatio() {
    try {
      return localStorage.getItem(RATIO_KEY) || "fit";
    } catch (e) {
      return "fit";
    }
  }
  function customRes() {
    try {
      var v = JSON.parse(localStorage.getItem("pnwCastflowCustomRes") || "null");
      if (v && v.w > 0 && v.h > 0) return v;
    } catch (e) {}
    return { w: 1920, h: 1080 };
  }
  function ratioVal() {
    if (curRatio() === "custom") {
      var r2 = customRes();
      return r2.w / r2.h;
    }
    return RATIOS[curRatio()] || 0;
  }
  /* letterbox rasio di tengah stage (fit = penuh) */
  function fitPreview() {
    var st = stage();
    var pv = document.getElementById("projPreview");
    if (!st || !pv) return;
    var r = ratioVal();
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
      var cr = document.getElementById("cfCustomRes");
      if (cr) cr.hidden = sel.value !== "custom";
      fitPreview();
    });
    var cr0 = document.getElementById("cfCustomRes");
    if (cr0) cr0.hidden = sel.value !== "custom";
    var ap = document.getElementById("cfResApply");
    if (ap)
      ap.addEventListener("click", function () {
        var w = parseInt((document.getElementById("cfResW") || {}).value, 10) || 1920;
        var h = parseInt((document.getElementById("cfResH") || {}).value, 10) || 1080;
        w = Math.max(16, Math.min(7680, w));
        h = Math.max(16, Math.min(7680, h));
        try {
          localStorage.setItem("pnwCastflowCustomRes", JSON.stringify({ w: w, h: h }));
        } catch (e) {}
        fitPreview();
      });
    fitPreview();
    if (window.ResizeObserver) {
      var st = stage();
      if (st) new ResizeObserver(function () { fitPreview(); }).observe(st);
    }
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

  /* ================= 3b. pratinjau melayang (pop-out bebas) ================= */
  function floatState() {
    try {
      return JSON.parse(localStorage.getItem(FLOAT_KEY) || "null") || {};
    } catch (e) {
      return {};
    }
  }
  function saveFloat(s2) {
    try {
      localStorage.setItem(FLOAT_KEY, JSON.stringify(s2));
    } catch (e) {}
  }
  function isPopped() {
    var w = document.getElementById("cfFloatWin");
    return !!(w && !w.hidden);
  }
  function buildFloat() {
    if (document.getElementById("cfFloatWin")) return;
    var w = document.createElement("div");
    w.className = "cfFloatWin";
    w.id = "cfFloatWin";
    w.hidden = true;
    w.innerHTML =
      '<div class="cfFloatBar" id="cfFloatBar">' +
      '<span class="t">Preview</span>' +
      '<span class="sp"></span>' +
      '<button type="button" id="cfDockBtn">⤓ Dock</button>' +
      "</div>" +
      '<div class="cfFloatBody" id="cfFloatBody"></div>' +
      '<div class="cfFloatResize" id="cfFloatResize"></div>';
    document.body.appendChild(w);
    var bar = document.getElementById("cfFloatBar");
    bar.addEventListener("pointerdown", function (ev) {
      if (ev.target && ev.target.tagName === "BUTTON") return;
      ev.preventDefault();
      var x0 = ev.clientX;
      var y0 = ev.clientY;
      var l0 = w.offsetLeft;
      var t0 = w.offsetTop;
      function mv(e2) {
        var nl = Math.max(0, Math.min(window.innerWidth - 120, l0 + (e2.clientX - x0)));
        var nt = Math.max(0, Math.min(window.innerHeight - 90, t0 + (e2.clientY - y0)));
        w.style.left = nl + "px";
        w.style.top = nt + "px";
      }
      function up() {
        document.removeEventListener("pointermove", mv);
        document.removeEventListener("pointerup", up);
        var s2 = floatState();
        s2.x = w.offsetLeft;
        s2.y = w.offsetTop;
        saveFloat(s2);
      }
      document.addEventListener("pointermove", mv);
      document.addEventListener("pointerup", up);
    });
    var rz = document.getElementById("cfFloatResize");
    rz.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var x0 = ev.clientX;
      var y0 = ev.clientY;
      var w0 = w.offsetWidth;
      var h0 = w.offsetHeight;
      function mv(e2) {
        w.style.width =
          Math.max(240, Math.min(window.innerWidth - 8, w0 + (e2.clientX - x0))) + "px";
        w.style.height =
          Math.max(150, Math.min(window.innerHeight - 8, h0 + (e2.clientY - y0))) + "px";
        fitPreview();
      }
      function up() {
        document.removeEventListener("pointermove", mv);
        document.removeEventListener("pointerup", up);
        var s2 = floatState();
        s2.w = w.offsetWidth;
        s2.h = w.offsetHeight;
        saveFloat(s2);
      }
      document.addEventListener("pointermove", mv);
      document.addEventListener("pointerup", up);
    });
    document.getElementById("cfDockBtn").onclick = function () {
      dockPreview();
    };
  }
  function popPreview() {
    safe("pop", function () {
      buildFloat();
      var w = document.getElementById("cfFloatWin");
      var st = stage();
      var cell = document.querySelector(".cfC-preview");
      if (!w || !st || !cell) return;
      document.getElementById("cfFloatBody").appendChild(st);
      st.style.height = "100%";
      var s2 = floatState();
      var defW = Math.min(720, window.innerWidth - 80);
      var defH = Math.round((defW * 9) / 16) + 30;
      w.style.left = (s2.x != null ? s2.x : Math.round((window.innerWidth - defW) / 2)) + "px";
      w.style.top = (s2.y != null ? s2.y : 70) + "px";
      w.style.width = (s2.w || defW) + "px";
      w.style.height = (s2.h || defH) + "px";
      cell.classList.add("popped");
      w.hidden = false;
      s2.popped = true;
      saveFloat(s2);
      fitPreview();
      /* penyembuhan diri: bila jendela di luar layar / nol, kembalikan */
      var r = w.getBoundingClientRect();
      var onScreen =
        r.width > 10 && r.height > 10 && r.left < window.innerWidth &&
        r.top < window.innerHeight && r.right > 0 && r.bottom > 0;
      if (!onScreen) dockPreview();
    });
  }
  function dockPreview() {
    safe("dock", function () {
      var w = document.getElementById("cfFloatWin");
      var st = stage();
      var cell = document.querySelector(".cfC-preview");
      if (!w || !st || !cell) return;
      var empty = cell.querySelector(".cfPrevEmpty");
      if (empty) cell.insertBefore(st, empty);
      else cell.appendChild(st);
      st.style.height = "";
      w.hidden = true;
      cell.classList.remove("popped");
      var s2 = floatState();
      s2.popped = false;
      saveFloat(s2);
      fitPreview();
    });
  }
  function initFloat() {
    buildFloat();
    var pb = document.getElementById("cfPopBtn");
    if (pb && !pb.__cfPop) {
      pb.__cfPop = true;
      pb.onclick = function () {
        if (isPopped()) dockPreview();
        else popPreview();
      };
    }
    /* restore state melayang dilakukan dari buildWorkspace (setelah sel ada) */
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

  /* ================= 4b. chip warna section (Verse/Chorus/…) ================= */
  var SEC_COLORS = {
    verse: "#2f6fb2",
    chorus: "#2e9e6b",
    "pre-chorus": "#8b5cf6",
    interlude: "#64748b",
    coda: "#e0653a",
  };
  function paintSectionChips() {
    qa(".projSlideCard .projSlideNo").forEach(function (no) {
      if (no.__cfChip) return;
      no.__cfChip = 1;
      var m = (no.textContent || "").match(
        /^(.*?)\u00b7\s*(VERSE|CHORUS|PRE-CHORUS|INTERLUDE|CODA)\s*$/i,
      );
      if (!m) return;
      var num = (m[1] || "").trim();
      var lab = m[2].toUpperCase();
      no.innerHTML = "";
      if (num) {
        var ns = document.createElement("span");
        ns.className = "cfSlideNum";
        ns.textContent = num;
        no.appendChild(ns);
      }
      var chip = document.createElement("span");
      chip.className = "cfSecChip";
      chip.setAttribute("data-sec", lab.toLowerCase());
      chip.textContent = lab;
      no.appendChild(chip);
    });
  }

  /* ================= 5. WORKSPACE 2D (mockup) ================= */
  function loadGrid() {
    try {
      var v = JSON.parse(localStorage.getItem(GRID_KEY) || "null");
      if (v && v.l > 0 && v.r > 0 && v.t > 0) return v;
    } catch (e) {}
    return { l: 300, r: 330, t: 0.46 };
  }
  function saveGrid(v) {
    try {
      localStorage.setItem(GRID_KEY, JSON.stringify(v));
    } catch (e) {}
  }
  function applyGrid(state, smooth) {
    var g = document.querySelector(".projGrid.cfWork");
    if (!g || window.innerWidth <= 900) return;
    var avail = g.clientHeight || 600;
    var tPx = Math.max(140, Math.min(avail - 140, Math.round(avail * state.t)));
    var cols = Math.round(state.l) + "px 7px minmax(0,1fr) 7px " + Math.round(state.r) + "px";
    var rows = tPx + "px 7px minmax(0,1fr)";
    if (smooth) {
      g.classList.add("cfSmooth");
      setTimeout(function () {
        g.classList.remove("cfSmooth");
      }, 240);
    }
    g.style.setProperty("grid-template-columns", cols, "important");
    g.style.setProperty("grid-template-rows", rows, "important");
  }
  function clampN(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function wireSplitters(state) {
    function bind(id, horizontal, onMove) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("pointerdown", function (ev) {
        ev.preventDefault();
        el.classList.add("dragging");
        document.body.classList.add(horizontal ? "cfRowResize" : "cfColResize");
        var x0 = ev.clientX;
        var y0 = ev.clientY;
        var g = document.querySelector(".projGrid.cfWork");
        var start = { l: state.l, r: state.r, t: state.t };
        var avail = g ? g.clientHeight || 600 : 600;
        function mv(e2) {
          onMove(e2.clientX - x0, e2.clientY - y0, start, avail);
          applyGrid(state, false);
        }
        function up() {
          document.removeEventListener("pointermove", mv);
          document.removeEventListener("pointerup", up);
          el.classList.remove("dragging");
          document.body.classList.remove("cfColResize");
          document.body.classList.remove("cfRowResize");
          saveGrid(state);
        }
        document.addEventListener("pointermove", mv);
        document.addEventListener("pointerup", up);
      });
      el.addEventListener("dblclick", function () {
        var def = loadGridDefault();
        state.l = def.l;
        state.r = def.r;
        state.t = def.t;
        applyGrid(state, true);
        saveGrid(state);
      });
    }
    function loadGridDefault() {
      return { l: 300, r: 330, t: 0.46 };
    }
    /* kolom kiri (vsp1): drag kanan -> kiri lebih lebar */
    bind("cfSpV1", false, function (dx, dy, s) {
      state.l = clampN(s.l + dx, 200, 480);
    });
    /* kolom kanan (vsp2): drag -> kanan (terbalik) */
    bind("cfSpV2", false, function (dx, dy, s) {
      state.r = clampN(s.r - dx, 240, 540);
    });
    /* baris atas (hsp kiri & tengah): ubah tinggi pratinjau/menu */
    function rowMove(dy, s, avail) {
      state.t = clampN((s.t * avail + dy) / avail, 0.18, 0.72);
    }
    bind("cfSpHL", true, function (dx, dy, s, avail) {
      rowMove(dy, s, avail);
    });
    bind("cfSpHC", true, function (dx, dy, s, avail) {
      rowMove(dy, s, avail);
    });
  }

  /* toggle Lyric Control <-> Timeline */
  function currentLyricView() {
    try {
      return localStorage.getItem(TL_VIEW_KEY) === "timeline" ? "timeline" : "lyric";
    } catch (e) {
      return "lyric";
    }
  }
  function dockTimelineInline(on) {
    var d = document.getElementById("tlDrawer");
    var cell = document.querySelector(".cfC-lyric");
    if (on) {
      if (!d && window.PNWTimeline && PNWTimeline.open) {
        try { PNWTimeline.open(); } catch (e) {}
        d = document.getElementById("tlDrawer");
      }
      if (!d || !cell) return;
      d.classList.add("cfTlInline");
      cell.appendChild(d);
      if (window.PNWTimeline && PNWTimeline.open && !d.classList.contains("on")) {
        try { PNWTimeline.open(); } catch (e) {}
      }
    } else if (d) {
      d.classList.remove("cfTlInline");
      var host = document.getElementById("projPage") || document.body;
      host.appendChild(d);
      if (window.PNWTimeline && PNWTimeline.close) {
        try { PNWTimeline.close(); } catch (e) {}
      }
    }
  }
  function setLyricView(view) {
    var cell = document.querySelector(".cfC-lyric");
    if (!cell) return;
    var isTl = view === "timeline";
    cell.classList.toggle("showTl", isTl);
    try {
      localStorage.setItem(TL_VIEW_KEY, isTl ? "timeline" : "lyric");
    } catch (e) {}
    qa(".cfViewToggle [data-cfview]", cell).forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-cfview") === (isTl ? "timeline" : "lyric"));
    });
    dockTimelineInline(isTl);
  }
  function addLyricToggle(cLyr, paneC) {
    /* header PERMANEN di sel (BUKAN di dalam paneC) supaya tombol toggle tetap
       terlihat saat paneC disembunyikan oleh mode Timeline — memperbaiki bug
       "stuck di timeline, tidak bisa balik ke Lyric". */
    var head = document.createElement("div");
    head.className = "cfCellHead cfLyricHead";
    var lbl = document.createElement("span");
    lbl.className = "cfLyricTitle";
    lbl.textContent = "Lyric Control / Timeline";
    head.appendChild(lbl);
    var t = document.createElement("span");
    t.className = "cfViewToggle";
    t.innerHTML =
      '<button type="button" data-cfview="lyric">🎬 Lyric</button>' +
      '<button type="button" data-cfview="timeline">⏱ Timeline</button>';
    head.appendChild(t);
    cLyr.insertBefore(head, cLyr.firstChild);
    qa("[data-cfview]", t).forEach(function (b) {
      b.onclick = function () {
        setLyricView(b.getAttribute("data-cfview"));
      };
    });
  }

  function doBuildWorkspace() {
    var g = document.querySelector(".projGrid");
    var rail = document.getElementById("projRail");
    var L = document.querySelector(".projPaneL");
    var C = document.querySelector(".projPaneC");
    var R = document.querySelector(".projPaneR");
    var wrap = document.getElementById("cfPrevWrap");
    if (!g || !rail || !L || !C || !R || !wrap) return false;
    if (g.__cfWork) return true;
    g.__cfWork = true;

    var head = wrap.querySelector(".cfPrevHead");
    var stage = document.getElementById("cfPrevStage");

    g.classList.add("cfWork");

    function cell(cls) {
      var d = document.createElement("div");
      d.className = "cfCell " + cls;
      return d;
    }
    var cMenu = cell("cfC-menu");
    var cPlay = cell("cfC-playlist");
    var cPrev = cell("cfC-preview");
    var cLyr = cell("cfC-lyric");
    var cDes = cell("cfC-design");

    function sp(cls, id, col, row) {
      var d = document.createElement("div");
      d.className = "cfSp " + cls;
      d.id = id;
      d.title = "Seret untuk mengubah tata letak · klik 2x untuk reset";
      d.style.gridColumn = col;
      d.style.gridRow = row;
      return d;
    }
    var vsp1 = sp("cfSpV", "cfSpV1", "2", "1 / 4");
    var vsp2 = sp("cfSpV", "cfSpV2", "4", "1 / 4");
    var hspL = sp("cfSpH", "cfSpHL", "1", "2");
    var hspC = sp("cfSpH", "cfSpHC", "3", "2");

    /* kosongkan grid lalu susun ulang (kita pegang referensi pane) */
    g.innerHTML = "";
    [cMenu, vsp1, cPrev, vsp2, cDes, hspL, hspC, cPlay, cLyr].forEach(function (el) {
      g.appendChild(el);
    });

    /* MENU: logo hero + rail nav */
    var menuBody = document.createElement("div");
    menuBody.className = "cfCellBody";
    var hero = document.createElement("img");
    hero.className = "cfHeroLogo";
    hero.src = "./castflow-logo-light.svg";
    hero.alt = "CastFlow";
    menuBody.appendChild(hero);
    menuBody.appendChild(rail);
    cMenu.appendChild(menuBody);

    /* PREVIEW: head kontrol + stage + placeholder melayang */
    if (head) {
      qa(".cfPrevSize", head).forEach(function (b) {
        b.remove();
      });
      cPrev.appendChild(head);
    }
    if (stage) cPrev.appendChild(stage);
    var empty = document.createElement("div");
    empty.className = "cfPrevEmpty";
    empty.textContent = "Preview is floating — press ⧉ or ⤓ Dock to bring it back.";
    cPrev.appendChild(empty);

    /* PLAYLIST / LYRIC / DESIGN: pindahkan pane, isi penuh sel */
    var fill = ";flex:1 1 auto;min-height:0;border:0;border-radius:0;background:transparent;";
    L.style.cssText += fill;
    C.style.cssText += fill;
    R.style.cssText += fill;
    cPlay.appendChild(L);
    cLyr.appendChild(C);
    addLyricToggle(cLyr, C);
    cDes.appendChild(R);

    /* buang strip lama yang kini kosong */
    if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);

    /* splitter + state */
    var state = loadGrid();
    applyGrid(state, false);
    wireSplitters(state);

    /* pulihkan tampilan lyric/timeline + pratinjau melayang */
    setLyricView(currentLyricView());
    safe("restoreFloat", function () {
      if (floatState().popped) popPreview();
    });

    return true;
  }
  function buildWorkspace() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var done = false;
      safe("buildWorkspace", function () {
        done = doBuildWorkspace();
      });
      if (done || tries > 80) clearInterval(iv);
    }, 250);
    window.addEventListener("resize", function () {
      safe("wsResize", function () {
        var g = document.querySelector(".projGrid.cfWork");
        if (g) applyGrid(loadGrid(), false);
      });
    });
  }

  /* ================= 6. drawer timeline: resizer (mode overlay) ================= */
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
              localStorage.setItem(TLH_KEY, String(Math.round(d.getBoundingClientRect().height)));
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

  /* ================= 7. PANEL REVISI A–E (v8.0) ================= */
  /* ---- A1. indikator status offline yang elegan ---- */
  function paintNetStatus() {
    var el = document.getElementById("yvStatus");
    if (!el) return;
    var txt = (el.textContent || "").trim();
    var offline = /tidak terbaca|unreadable|permission_denied|offline|tidak ada koneksi|no connection/i.test(txt);
    if (offline) {
      if (!el.__cfOff) {
        el.__cfOff = true;
        el.__cfOrig = txt;
        el.innerHTML = '<span class="cfNetChip off"><span class="cfNetDot"></span>Offline Mode</span>';
      }
    } else if (el.__cfOff) {
      el.__cfOff = false;
      el.textContent = el.__cfOrig || txt;
    }
  }

  /* ---- A2. view-only: kunci aksi saat belum login ---- */
  function applyViewOnly() {
    var login = document.getElementById("yvLoginBtn");
    var who = document.getElementById("yvWho");
    var loggedOut = false;
    if (login && (login.textContent || "").trim()) {
      /* "Masuk dengan Google"/"Sign in" => belum login; "Keluar"/"Sign out" => sudah */
      loggedOut = /masuk|sign in|log ?in/i.test(login.textContent);
    } else if (who) {
      loggedOut = /belum masuk|not signed in|view only|hanya bisa melihat/i.test(who.textContent || "");
    }
    document.body.classList.toggle("cfViewOnly", !!loggedOut);
  }

  /* ---- A3. menu Avatar/Profile (gabung Sign in + Bahasa + Error Log) ---- */
  function buildUserMenu() {
    var bar = document.getElementById("yvBar");
    if (!bar || document.getElementById("cfAvatarBtn")) return;
    var login = document.getElementById("yvLoginBtn");
    var log = document.getElementById("yvLogBtn");
    var lang = document.getElementById("cfLangSeg");
    [login, log, lang].forEach(function (x) { if (x) x.classList.add("cfMovedToMenu"); });
    var av = document.createElement("button");
    av.type = "button";
    av.id = "cfAvatarBtn";
    av.className = "yvBarBtn cfAvatarBtn";
    av.title = "Account / Settings";
    av.textContent = "\uD83D\uDC64";
    var menu = document.createElement("div");
    menu.id = "cfUserMenu";
    menu.className = "cfUserMenu";
    menu.hidden = true;
    menu.innerHTML =
      '<div class="cfUserWho" id="cfUserWho">—</div>' +
      '<button type="button" class="cfUserItem" id="cfUserLogin">Sign in</button>' +
      '<div class="cfUserItem cfUserLang"><span>Language</span>' +
      '<span class="cfSeg"><button type="button" data-cflang2="en">EN</button><button type="button" data-cflang2="id">ID</button></span></div>' +
      '<button type="button" class="cfUserItem" id="cfUserLog">Error Log</button>';
    bar.appendChild(av);
    document.body.appendChild(menu);
    function syncMenu() {
      var who = document.getElementById("yvWho");
      var lw = document.getElementById("cfUserWho");
      if (lw && who) lw.textContent = who.textContent || "—";
      var lb = document.getElementById("cfUserLogin");
      if (lb && login) lb.textContent = login.textContent || "Sign in";
      qa("[data-cflang2]", menu).forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-cflang2") === lang());
      });
    }
    var menuOpen = false;
    function setMenu(o) {
      menuOpen = o;
      menu.hidden = !o;
      if (o) {
        syncMenu();
        var r = av.getBoundingClientRect();
        menu.style.top = r.bottom + 6 + "px";
        menu.style.right = Math.max(8, window.innerWidth - r.right) + "px";
      }
    }
    av.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenu(!menuOpen);
    });
    document.addEventListener("click", function (e) {
      if (menuOpen && !menu.contains(e.target) && e.target !== av) setMenu(false);
    });
    document.getElementById("cfUserLogin").onclick = function () { if (login) login.click(); menu.hidden = true; };
    document.getElementById("cfUserLog").onclick = function () { if (log) log.click(); menu.hidden = true; };
    qa("[data-cflang2]", menu).forEach(function (b) {
      b.onclick = function () {
        var real = document.querySelector('#cfLangSeg [data-cflang="' + b.getAttribute("data-cflang2") + '"]');
        if (real) real.click();
        syncMenu();
      };
    });
  }

  /* ---- B2. hotkeys presenter (B=Black, L=Logo, Enter=Live, Esc=Clear, panah=nav) ---- */
  var _cfBlack = false;
  var _cfLogo = false;
  function liveBlank(extra) {
    var YV = window.PNWYouthViews;
    if (!YV || !YV.broadcast) return;
    var p = { active: true, kind: "blank", bg: { kind: "color", value: "#000000" }, showTitle: false, showMeta: false };
    if (extra) for (var k in extra) p[k] = extra[k];
    try { YV.broadcast(p); } catch (e) {}
  }
  function cfClearLive() {
    var YV = window.PNWYouthViews;
    if (YV && YV.clear) { try { YV.clear(); } catch (e) {} }
  }
  function toggleBlack() {
    _cfBlack = !_cfBlack;
    if (_cfBlack) { _cfLogo = false; liveBlank(); } else cfClearLive();
  }
  function toggleLogo() {
    _cfLogo = !_cfLogo;
    if (_cfLogo) { _cfBlack = false; liveBlank({ overlay: { kind: "image", value: "./castflow-logo-light.svg", pos: "center" } }); }
    else cfClearLive();
  }
  function initHotkeys() {
    document.addEventListener("keydown", function (e) {
      var t = e.target;
      var tag = ((t && t.tagName) || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || (t && t.isContentEditable)) return;
      var tld = document.getElementById("tlDrawer");
      var tlOpen = !!(tld && tld.classList.contains("on"));
      function click(id) { var b = document.getElementById(id); if (b) b.click(); }
      var k = e.key;
      if (k === "b" || k === "B") { toggleBlack(); e.preventDefault(); }
      else if (k === "l" || k === "L") { toggleLogo(); e.preventDefault(); }
      else if (k === "Enter") { click("projGoLive"); e.preventDefault(); }
      else if (k === "Escape") { click("projClear"); e.preventDefault(); }
      else if (!tlOpen && (k === " " || k === "ArrowRight" || k === "ArrowDown" || k === "PageDown")) { click("projNextSlide"); e.preventDefault(); }
      else if (!tlOpen && (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp")) { click("projPrevSlide"); e.preventDefault(); }
    });
  }

  /* ---- C1. pindahkan kontrol rasio ke popover Settings (⚙) ---- */
  function buildPrevSettings() {
    var head = document.querySelector(".cfPrevHead");
    var ratio = document.getElementById("cfPrevRatio");
    if (!head || !ratio || document.getElementById("cfPrevSettingsBtn")) return;
    var custom = document.getElementById("cfCustomRes");
    var pop = document.createElement("div");
    pop.className = "cfPrevSettings";
    pop.id = "cfPrevSettings";
    pop.hidden = true;
    var lab = document.createElement("div");
    lab.className = "cfPrevSettingsTitle";
    lab.textContent = "Resolution";
    pop.appendChild(lab);
    pop.appendChild(ratio);
    if (custom) pop.appendChild(custom);
    document.body.appendChild(pop);
    var gear = document.createElement("button");
    gear.type = "button";
    gear.id = "cfPrevSettingsBtn";
    gear.className = "cfIconBtn";
    gear.title = "Preview settings";
    gear.textContent = "\u2699";
    head.insertBefore(gear, document.getElementById("cfPopBtn") || null);
    gear.onclick = function (e) {
      e.stopPropagation();
      pop.hidden = !pop.hidden;
      if (!pop.hidden) {
        var r = gear.getBoundingClientRect();
        pop.style.top = r.bottom + 6 + "px";
        pop.style.right = Math.max(8, window.innerWidth - r.right) + "px";
      }
    };
    document.addEventListener("click", function (e) {
      if (!pop.hidden && !pop.contains(e.target) && e.target !== gear) pop.hidden = true;
    });
  }

  /* ---- D2. kartu bantuan hotkey ---- */
  function buildHotkeyHint() {
    var cell = document.querySelector(".cfC-lyric");
    var head = cell ? cell.querySelector(".cfLyricHead") : null;
    if (!head || document.getElementById("cfHkBtn")) return;
    function hk(k, d) { return '<div class="row"><span class="k">' + k + '</span><span class="d">' + d + "</span></div>"; }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "cfHkBtn";
    btn.className = "cfIconBtn";
    btn.title = "Keyboard shortcuts";
    btn.textContent = "?";
    head.appendChild(btn);
    var card = document.createElement("div");
    card.className = "cfHkCard";
    card.id = "cfHkCard";
    card.hidden = true;
    card.innerHTML =
      '<div class="t">Keyboard Shortcuts</div>' +
      hk("Spasi / \u2192 / \u2193", "Slide berikutnya") +
      hk("\u2190 / \u2191", "Slide sebelumnya") +
      hk("Enter", "Tayangkan (Go Live)") +
      hk("B", "Layar hitam (Black)") +
      hk("L", "Logo") +
      hk("Esc", "Bersihkan layar");
    document.body.appendChild(card);
    btn.onclick = function (e) {
      e.stopPropagation();
      card.hidden = !card.hidden;
      if (!card.hidden) {
        var r = btn.getBoundingClientRect();
        card.style.bottom = window.innerHeight - r.top + 6 + "px";
        card.style.left = Math.max(8, r.left - 170) + "px";
      }
    };
    document.addEventListener("click", function (e) {
      if (!card.hidden && !card.contains(e.target) && e.target !== btn) card.hidden = true;
    });
  }

  /* ---- E1. Global Search (lagu: judul + lirik) ---- */
  function buildGlobalSearch() {
    var paneC = document.querySelector(".projPaneC");
    var tabs = document.getElementById("projTabs");
    if (!paneC || !tabs || document.getElementById("cfGlobalSearch")) return;
    var box = document.createElement("div");
    box.className = "cfGSWrap";
    box.innerHTML = '<span class="cfGSIcon">\uD83D\uDD0E</span><input type="search" id="cfGlobalSearch" placeholder="Search songs, verses, media\u2026" autocomplete="off">';
    paneC.insertBefore(box, tabs);
    var inp = box.querySelector("#cfGlobalSearch");
    var res = document.createElement("div");
    res.className = "cfGSResults";
    res.hidden = true;
    box.appendChild(res);
    inp.addEventListener("input", function () {
      var q = (inp.value || "").trim().toLowerCase();
      res.innerHTML = "";
      if (!q) { res.hidden = true; return; }
      var hits = [];
      try {
        var songs = (window.PNWYouthViews && PNWYouthViews.getSongs) ? PNWYouthViews.getSongs() : [];
        (songs || []).forEach(function (s) {
          var lyrics = Array.isArray(s.lines) ? s.lines.join(" ") : (s.lyrics || s.text || "");
          var hay = ((s.title || "") + " " + lyrics).toLowerCase();
          if (hay.indexOf(q) >= 0) hits.push({ title: s.title || "?", id: s.id });
        });
      } catch (e) {}
      hits = hits.slice(0, 12);
      if (!hits.length) {
        res.innerHTML = '<div class="cfGSEmpty">Tidak ada hasil</div>';
      } else {
        hits.forEach(function (h) {
          var it = document.createElement("button");
          it.type = "button";
          it.className = "cfGSItem";
          it.innerHTML = '<span class="cfGSTag">\uD83C\uDFB5 Lagu</span><span>' + h.title + "</span>";
          it.onclick = function () {
            inp.value = "";
            res.hidden = true;
            var real = document.getElementById("projSearch");
            if (real) { real.value = h.title; real.dispatchEvent(new Event("input", { bubbles: true })); }
          };
          res.appendChild(it);
        });
      }
      res.hidden = false;
    });
    document.addEventListener("click", function (e) { if (!box.contains(e.target)) res.hidden = true; });
  }

  /* ---- E2. pilih versi Alkitab ---- */
  var BIBLE_VER_KEY = "pnwCastflowBibleVer";
  function buildBibleVersion() {
    var tabs = document.getElementById("projTabs");
    if (!tabs || document.getElementById("cfBibleVer")) return;
    var sel = document.createElement("select");
    sel.id = "cfBibleVer";
    sel.className = "cfBibleVer";
    sel.title = "Bible version";
    ["TB", "BIS", "NIV", "ESV"].forEach(function (v) {
      var o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
    try { sel.value = localStorage.getItem(BIBLE_VER_KEY) || "TB"; } catch (e) {}
    sel.onchange = function () { try { localStorage.setItem(BIBLE_VER_KEY, sel.value); } catch (e) {} };
    tabs.parentNode.insertBefore(sel, tabs.nextSibling);
    function sync() {
      var act = tabs.querySelector('[data-tab].on') || tabs.querySelector('[data-tab][aria-selected="true"]');
      sel.style.display = act && act.getAttribute("data-tab") === "alkitab" ? "" : "none";
    }
    tabs.addEventListener("click", function () { setTimeout(sync, 30); });
    setInterval(sync, 700);
    sync();
  }

  /* pemanggil panel (idempoten, polling sampai DOM siap) */
  function initPanels() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      safe("userMenu", buildUserMenu);
      safe("prevSettings", buildPrevSettings);
      safe("hkHint", buildHotkeyHint);
      safe("globalSearch", buildGlobalSearch);
      safe("bibleVer", buildBibleVersion);
      if (tries > 80) clearInterval(iv);
    }, 300);
  }

  /* ================= 8. ROADMAP LANJUTAN (v8.1) ================= */
  /* ---- 1. Auto-Format Lyrics ---- */
  var CF_SEC_RX = [
    [/^(pre[- ]?chorus|prechorus)/i, "Pre-Chorus"],
    [/^(chorus|reff?|refrain)/i, "Chorus"],
    [/^(bridge)/i, "Interlude"],
    [/^(interlude|interlud|instrumental|solo|intro)/i, "Interlude"],
    [/^(coda|ending|outro|akhir)/i, "Coda"],
    [/^(verse|bait|stanza|v\s*\d+)/i, "Verse"],
  ];
  function cfAutoFormat(raw) {
    var lines = String(raw || "").replace(/\r\n?/g, "\n").split("\n");
    var blocks = [];
    var cur = [];
    lines.forEach(function (ln) {
      if (ln.trim() === "") { if (cur.length) { blocks.push(cur); cur = []; } }
      else cur.push(ln.trim());
    });
    if (cur.length) blocks.push(cur);
    var out = [];
    var vCount = 0;
    blocks.forEach(function (blk) {
      var label = null;
      var body = blk;
      var first = (blk[0] || "").trim();
      if (first && first.length <= 24) {
        for (var i = 0; i < CF_SEC_RX.length; i++) {
          if (CF_SEC_RX[i][0].test(first)) { label = CF_SEC_RX[i][1]; break; }
        }
      }
      if (label) body = blk.slice(1);
      if (!label || label === "Verse") { vCount++; label = "Verse " + vCount; }
      if (!body.length) body = [first];
      out.push({ label: label, lines: body });
    });
    return out;
  }
  function buildAutoFormat() {
    var gs = document.querySelector(".cfGSWrap");
    if (!gs || document.getElementById("cfAfBtn")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "cfAfBtn";
    btn.className = "cfIconBtn";
    btn.title = "Auto-format lyrics";
    btn.textContent = "\u26A1";
    gs.appendChild(btn);
    var ov = document.createElement("div");
    ov.className = "cfAfOverlay"; ov.id = "cfAfOverlay"; ov.hidden = true;
    ov.innerHTML =
      '<div class="cfAfModal">' +
      '<div class="cfAfHead"><b>Auto-Format Lyrics</b><button type="button" class="cfAfX" id="cfAfX">\u2715</button></div>' +
      '<textarea id="cfAfIn" placeholder="Tempel lirik mentah dari internet di sini\u2026" rows="8"></textarea>' +
      '<div class="cfAfOps"><button type="button" class="projMiniBtn primary" id="cfAfGo">Format</button>' +
      '<button type="button" class="projMiniBtn" id="cfAfCopy">Salin</button>' +
      '<button type="button" class="projMiniBtn" id="cfAfUse">Pakai di Teks</button></div>' +
      '<div class="cfAfPreview" id="cfAfPreview"></div>' +
      "</div>";
    document.body.appendChild(ov);
    btn.onclick = function () { ov.hidden = false; };
    ov.querySelector("#cfAfX").onclick = function () { ov.hidden = true; };
    ov.addEventListener("click", function (e) { if (e.target === ov) ov.hidden = true; });
    var formatted = [];
    function toText() { return formatted.map(function (s) { return "[" + s.label + "]\n" + s.lines.join("\n"); }).join("\n\n"); }
    ov.querySelector("#cfAfGo").onclick = function () {
      formatted = cfAutoFormat(ov.querySelector("#cfAfIn").value);
      ov.querySelector("#cfAfPreview").innerHTML = formatted.map(function (s) {
        return '<div class="cfAfSec"><span class="cfSecChip" data-sec="' + s.label.split(" ")[0].toLowerCase() + '">' + s.label + "</span> " + s.lines.join(" \u00b7 ") + "</div>";
      }).join("") || '<div class="cfGSEmpty">Tidak ada isi</div>';
    };
    ov.querySelector("#cfAfCopy").onclick = function () { try { navigator.clipboard.writeText(toText()); } catch (e) {} };
    ov.querySelector("#cfAfUse").onclick = function () {
      var ti = document.getElementById("projTextInput");
      if (ti) { ti.value = toText(); ti.dispatchEvent(new Event("input", { bubbles: true })); }
      ov.hidden = true;
    };
  }

  /* ---- 2. Next Slide Thumbnail ---- */
  function initNextThumb() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var des = document.querySelector(".cfC-design");
      if (des && !document.getElementById("cfNextThumb")) {
        var card = document.createElement("div");
        card.className = "cfNextThumb";
        card.id = "cfNextThumb";
        card.innerHTML = '<div class="t">Next</div><div class="b" id="cfNextThumbBody">—</div>';
        des.insertBefore(card, des.firstChild);
      }
      var grid = document.getElementById("projSlideGrid");
      var body = document.getElementById("cfNextThumbBody");
      if (grid && body) {
        var cur = grid.querySelector(".projSlideCard.on");
        var txt = "—";
        if (cur) {
          var nx = cur.nextElementSibling;
          while (nx && !nx.classList.contains("projSlideCard")) nx = nx.nextElementSibling;
          if (nx) {
            var b = nx.querySelector(".projSlideBody");
            var no = nx.querySelector(".projSlideNo");
            txt = (no ? no.textContent.trim() + "  " : "") + (b ? b.textContent.trim().slice(0, 70) : "");
          } else txt = "Slide terakhir";
        }
        if (body.textContent !== txt) body.textContent = txt;
      }
      if (tries > 400) clearInterval(iv);
    }, 800);
  }

  /* ---- 3. Media tagging ---- */
  var MEDIATAG_KEY = "pnwCastflowMediaTags.v1";
  function mediaTags() { try { return JSON.parse(localStorage.getItem(MEDIATAG_KEY) || "{}"); } catch (e) { return {}; } }
  function saveMediaTags(t) { try { localStorage.setItem(MEDIATAG_KEY, JSON.stringify(t)); } catch (e) {} }
  function initMediaTags() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var grid = document.getElementById("projMediaGrid");
      if (!grid) { if (tries > 200) clearInterval(iv); return; }
      if (!document.getElementById("cfMediaFilter")) {
        var fb = document.createElement("input");
        fb.id = "cfMediaFilter";
        fb.className = "cfMediaFilter";
        fb.placeholder = "Filter media (nama/tag)\u2026";
        grid.parentNode.insertBefore(fb, grid);
        fb.addEventListener("input", function () {
          var q = (fb.value || "").trim().toLowerCase();
          var tags = mediaTags();
          qa(".projMediaItem", grid).forEach(function (it) {
            var id = it.getAttribute("data-mid") || "";
            var hay = ((it.textContent || "") + " " + (tags[id] || "")).toLowerCase();
            it.style.display = !q || hay.indexOf(q) >= 0 ? "" : "none";
          });
        });
      }
      var tags = mediaTags();
      qa(".projMediaItem", grid).forEach(function (it) {
        if (it.__cfTag) return;
        it.__cfTag = 1;
        var ub = it.querySelector("[data-use]");
        var db = it.querySelector("[data-del]");
        var mid = ub ? ub.getAttribute("data-use") : (db ? db.getAttribute("data-del") : "");
        it.setAttribute("data-mid", mid);
        var ti = document.createElement("input");
        ti.className = "cfMediaTag";
        ti.placeholder = "+ tag";
        ti.value = tags[mid] || "";
        ti.onchange = function () {
          var t2 = mediaTags();
          if (ti.value.trim()) t2[mid] = ti.value.trim(); else delete t2[mid];
          saveMediaTags(t2);
        };
        it.appendChild(ti);
      });
      if (tries > 200) clearInterval(iv);
    }, 900);
  }

  /* ---- 4. Stage Display: item di menu avatar ---- */
  function addStageMenuItem() {
    var menu = document.getElementById("cfUserMenu");
    if (!menu || document.getElementById("cfStageItem")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cfUserItem";
    b.id = "cfStageItem";
    b.textContent = "Open Stage Display";
    b.onclick = function () {
      window.open("./castflow.html?mode=stage", "_blank", "noopener");
      menu.hidden = true;
    };
    menu.appendChild(b);
  }

  function initRoadmap() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      safe("autoFormat", buildAutoFormat);
      safe("stageItem", addStageMenuItem);
      if (tries > 80) clearInterval(iv);
    }, 300);
    initNextThumb();
    initMediaTags();
  }

  /* ================= boot ================= */
  function boot() {
    safe("fonts", extendFonts);
    safe("lang", initLang);
    safe("ratio", initRatio);
    safe("drop", initDrop);
    safe("customFont", initCustomFont);
    safe("chips", function () {
      paintSectionChips();
      setInterval(paintSectionChips, 900);
    });
    safe("workspace", buildWorkspace);
    safe("float", initFloat);
    safe("tlResizer", initTlResizer);
    /* panel revisi A–E (v8.0) */
    safe("panels", initPanels);
    safe("hotkeys", initHotkeys);
    safe("roadmap", initRoadmap);
    setInterval(function () {
      safe("net", paintNetStatus);
      safe("viewOnly", applyViewOnly);
    }, 1200);
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
    setRatio: function (r) {
      try {
        localStorage.setItem(RATIO_KEY, r);
      } catch (e) {}
      var sel = document.getElementById("cfPrevRatio");
      if (sel) sel.value = r;
      fitPreview();
    },
    setLyricView: setLyricView,
    popPreview: popPreview,
    dockPreview: dockPreview,
    isPopped: isPopped,
    resetLayout: function () {
      var def = { l: 300, r: 330, t: 0.46 };
      applyGrid(def, true);
      saveGrid(def);
    },
    paintNetStatus: paintNetStatus,
    applyViewOnly: applyViewOnly,
    autoFormat: cfAutoFormat,
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
