/* PNW-FILE-GUIDE
   js/castflow.js — lapisan CastFlow (v7.0). HANYA dimuat di castflow.html,
   PALING AKHIR (setelah yv-timeline.js).
   Isi:
   1. i18n dwibahasa — default ENGLISH, toggle EN/ID di bar atas. Menerjemahkan
      teks statis (sweep text node + placeholder + title) dan string dinamis
      lewat window.CFt (dipakai yv-standalone.js untuk status bar).
   2. Pratinjau ATAS yang bisa diubah tingginya (drag handle + preset S/M/L,
      tersimpan di localStorage "pnwCastflowPrevH").
   3. Drag & drop gambar/video ke pratinjau -> simpan ke IndexedDB (PNWMedia)
      -> jadi latar sesi lewat PNWProjector.__tl.setBg.
   4. Perluasan library font (katalog besar + tambah font Google manual).
*/
(function () {
  "use strict";

  var CF_VERSION = "v7.0";
  var LANG_KEY = "pnwCastflowLang";
  var PREV_H_KEY = "pnwCastflowPrevH";
  var FONTS_KEY = "pnwCastflowFonts.v1";

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
  /* Kamus: sumber (Indonesia) -> English. Pembalikan otomatis untuk mode ID. */
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
  /* Aturan regex untuk string dinamis (status bar dsb). */
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
  /* Peta balik EN -> ID (untuk saat pengguna ganti ke Indonesia). */
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
  /* dipakai yv-standalone.js untuk status dinamis */
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
    /* konten dinamis (kartu lagu, toast, status) dirender ulang terus —
       sapuan berkala hanya perlu saat mode Inggris. */
    setInterval(function () {
      if (lang() === "en") safe("sweep", function () { sweep("en"); });
    }, 1500);
  }

  /* ================= 2. pratinjau atas resizable ================= */
  var SIZES = { s: 140, m: 220, l: 330 };
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
      try {
        rz.setPointerCapture(ev.pointerId);
      } catch (e) {}
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
    /* jangan biarkan drop di luar stage membuka file di tab yang sama */
    ["dragover", "drop"].forEach(function (ev2) {
      document.addEventListener(ev2, function (e) {
        e.preventDefault();
      });
    });
  }

  /* ================= 4. library font besar ================= */
  var MORE_FONTS = [
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
      "flex:1;background:#101b3a;border:1px solid #034078;color:#e8eef8;border-radius:8px;padding:6px 9px;font-size:12px;";
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

  /* ================= boot ================= */
  function boot() {
    safe("fonts", extendFonts);
    safe("lang", initLang);
    safe("resize", initResize);
    safe("drop", initDrop);
    safe("customFont", initCustomFont);
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
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
