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

  var CF_VERSION = "v7.7";
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
    var head = paneC.querySelector(".projPaneHead");
    if (!head) {
      /* pane katalog tidak punya .projPaneHead — buat toolbar toggle sendiri */
      head = document.createElement("div");
      head.className = "cfCellHead";
      head.style.cssText = "display:flex;align-items:center;gap:8px;";
      var lbl = document.createElement("span");
      lbl.textContent = "Lyric Control / Timeline";
      head.appendChild(lbl);
      paneC.insertBefore(head, paneC.firstChild);
    }
    var t = document.createElement("span");
    t.className = "cfViewToggle";
    t.innerHTML =
      '<button type="button" data-cfview="lyric">🎬 Lyric</button>' +
      '<button type="button" data-cfview="timeline">⏱ Timeline</button>';
    head.appendChild(t);
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

  /* ================= boot ================= */
  function boot() {
    safe("fonts", extendFonts);
    safe("lang", initLang);
    safe("ratio", initRatio);
    safe("drop", initDrop);
    safe("customFont", initCustomFont);
    safe("workspace", buildWorkspace);
    safe("float", initFloat);
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
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
