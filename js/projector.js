/* PNW-FILE-GUIDE
   js/projector.js — youTh Views (presenter ala ProPresenter/EasyWorship).
   Controller TUNGGAL untuk #projPage. Memakai mesin window.PNWYouthViews (js/app.js).
   RTDB: pujianYouth/projector/plan + /settings, tayang lewat pujianYouth/live.
   Output: 1 halaman, lirik saja, keluar bertahap per slide (bukan seluruh lirik).
   Setiap bagian dibungkus safe() supaya 1 fitur error tidak mematikan fitur lain.
 */
(function () {
  "use strict";

  var PLAN_REF = "pujianYouth/projector/plan";
  var SET_REF = "pujianYouth/projector/settings";
  var LOCAL_PLAN = "pnwProjectorPlan.v1";
  var LOCAL_SET = "pnwYouthViewsSettings.v2";
  var LOCAL_KEYS = "pnwYouthViewsApiKeys.v1";

  /* ---------------- isolasi error ---------------- */
  function safe(name, fn, fallback) {
    try {
      return fn();
    } catch (e) {
      var log = (window.PNWDiag = window.PNWDiag || []);
      log.push({ feature: "youthviews." + name, error: String((e && e.message) || e), at: Date.now() });
      if (window.console && console.warn) console.warn("[youTh Views] gagal:", name, e);
      return fallback;
    }
  }
  function engine() {
    return window.PNWYouthViews || null;
  }

  /* ---------------- 50 font ala ProPresenter ---------------- */
  var FONTS = [
    "Inter", "Montserrat", "Open Sans", "Lato", "Roboto", "Poppins", "Raleway", "Oswald",
    "Nunito", "Nunito Sans", "Source Sans 3", "Bebas Neue", "Anton", "Archivo", "Barlow",
    "Barlow Condensed", "Cabin", "Dosis", "Exo 2", "Figtree", "Fira Sans", "Heebo", "Hind",
    "Josefin Sans", "Jost", "Kanit", "Karla", "Lexend", "Libre Baskerville", "Manrope",
    "Merriweather", "Mulish", "Outfit", "Overpass", "Playfair Display", "Plus Jakarta Sans",
    "PT Sans", "PT Serif", "Quicksand", "Roboto Condensed", "Roboto Slab", "Rubik",
    "Space Grotesk", "Teko", "Titillium Web", "Ubuntu", "Urbanist", "Work Sans",
    "Yanone Kaffeesatz", "Cormorant Garamond", "DM Sans", "Signika", "JetBrains Mono",
  ];

  /* ---------------- latar belakang ---------------- */
  var SOLIDS = ["#000000", "#0b0e14", "#111621", "#12243d", "#0d3b3b", "#1b2a1f", "#2d1719", "#251a2e", "#2a2213", "#1a1a2e"];
  var MOTIONS = [
    { id: "aurora", name: "Aurora" },
    { id: "waves", name: "Waves" },
    { id: "fire", name: "Fire" },
    { id: "space", name: "Star Field" },
    { id: "deep", name: "Deep" },
    { id: "cerulean", name: "Cerulean" },
    { id: "purple", name: "Purple Haze" },
    { id: "glow", name: "Soft Glow" },
    { id: "rays", name: "Light Rays" },
    { id: "bokeh", name: "Bokeh" },
  ];
  var LOCAL_PRESETS = [
    { name: "Praise", url: "./img/praise.jpg" },
    { name: "Worship", url: "./img/worship.jpg" },
  ];
  // Kata kunci latar yang lazim dipakai gereja/worship (bukan aset milik GMS)
  var BG_CHIPS = [
    "worship background", "light rays", "clouds timelapse", "abstract gradient",
    "particles", "bokeh lights", "smoke", "starry sky", "ocean waves", "mountain fog",
    "sunrise sky", "golden light",
  ];

  var DEFAULTS = {
    font: "Montserrat",
    size: 56,
    align: "center",
    shadow: "strong",
    maxLines: 4,
    showTitle: true,
    showMeta: true,
    bg: { kind: "motion", value: "aurora" },
  };

  var _plan = [];
  var _set = null;
  var _active = null; // { kind:'song', songId, slideIndex } | { kind:'text' } | { kind:'verse' }
  var _deckSong = null; // lagu yang sedang dibuka slide-nya
  var _tab = "lagu";
  var _bgTab = "warna";
  var _q = "";
  var _filter = "semua";
  var _watching = false;
  var _text = "";
  var _verse = { ref: "", text: "" };

  /* ---------------- util ---------------- */
  function el(id) {
    return document.getElementById(id);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function notify(m, kind) {
    if (typeof window.toast === "function") window.toast(m, kind || "info");
  }
  function fb() {
    if (typeof firebase === "undefined") return null;
    if (!firebase.apps || !firebase.apps.length) return null;
    return firebase;
  }
  function ref(path) {
    var f = fb();
    if (!f || !f.database) return null;
    try {
      return f.database().ref(path);
    } catch (e) {
      return null;
    }
  }
  function settings() {
    if (!_set) {
      var raw = null;
      try {
        raw = JSON.parse(localStorage.getItem(LOCAL_SET) || "null");
      } catch (e) {}
      _set = Object.assign({}, DEFAULTS, raw || {});
      if (!_set.bg || typeof _set.bg !== "object") _set.bg = { kind: "motion", value: "aurora" };
    }
    return _set;
  }
  function saveSettings() {
    safe("saveSettings", function () {
      localStorage.setItem(LOCAL_SET, JSON.stringify(_set));
      var r = ref(SET_REF);
      if (r) r.set(_set);
    });
  }
  function apiKeys() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEYS) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function saveApiKey(provider, key) {
    safe("saveApiKey", function () {
      var k = apiKeys();
      k[provider] = key;
      localStorage.setItem(LOCAL_KEYS, JSON.stringify(k));
    });
  }
  function savePlan() {
    safe("savePlan", function () {
      localStorage.setItem(LOCAL_PLAN, JSON.stringify(_plan));
      var r = ref(PLAN_REF);
      if (r) r.set(_plan);
    });
  }
  function loadLocalPlan() {
    safe("loadPlan", function () {
      var p = JSON.parse(localStorage.getItem(LOCAL_PLAN) || "null");
      if (Array.isArray(p)) _plan = p;
    });
  }
  function songs() {
    var e = engine();
    if (e) return e.getSongs();
    return Array.isArray(window.songs) ? window.songs : [];
  }
  function songById(id) {
    var e = engine();
    if (e) return e.getSong(id);
    return songs().find(function (s) {
      return s && String(s.id) === String(id);
    }) || null;
  }
  function slidesOf(song) {
    var e = engine();
    if (e) return e.buildSlides(song, settings().maxLines);
    return [{ label: "", lines: [(song && song.title) || ""] }];
  }

  /* ---------------- tayang ---------------- */
  function payload() {
    var s = settings();
    var style = { font: s.font, size: s.size, align: s.align, shadow: s.shadow };
    var base = { active: true, style: style, bg: s.bg, showTitle: s.showTitle, showMeta: s.showMeta };
    if (!_active) return null;
    if (_active.kind === "song") {
      var song = songById(_active.songId);
      if (!song) return null;
      var deck = slidesOf(song);
      var idx = Math.max(0, Math.min(deck.length - 1, _active.slideIndex || 0));
      return Object.assign(base, {
        kind: "song",
        songId: song.id,
        songTitle: song.title || "",
        key: song.originalKey || "",
        slideIndex: idx,
        slideMax: settings().maxLines,
        showChords: false,
      });
    }
    if (_active.kind === "text") {
      var t = String(_text || "").trim();
      if (!t) return null;
      return Object.assign(base, { kind: "text", text: t });
    }
    if (_active.kind === "verse") {
      var vt = String(_verse.text || "").trim();
      if (!vt) return null;
      return Object.assign(base, { kind: "verse", text: vt, ref: String(_verse.ref || "").trim() });
    }
    return null;
  }
  function goLive() {
    safe("goLive", function () {
      var e = engine();
      if (!e || !e.canBroadcast()) {
        notify("Login admin dulu supaya bisa menayangkan.", "info");
        return;
      }
      var p = payload();
      if (!p) {
        notify("Pilih slide / isi konten dulu.", "info");
        return;
      }
      if (e.broadcast(p)) notify("Tayang di youTh Views.", "success");
      else notify("Gagal menayangkan.", "info");
    });
  }
  function clearScreen() {
    safe("clear", function () {
      var e = engine();
      if (e && e.clear()) notify("Layar dibersihkan.", "info");
    });
  }
  function step(dir) {
    safe("step", function () {
      if (!_active || _active.kind !== "song") return;
      var song = songById(_active.songId);
      if (!song) return;
      var deck = slidesOf(song);
      var next = Math.max(0, Math.min(deck.length - 1, (_active.slideIndex || 0) + dir));
      if (next === _active.slideIndex) return;
      _active.slideIndex = next;
      renderActive();
      renderDeck();
      goLive();
    });
  }

  /* ---------------- panel kiri: rundown ---------------- */
  function renderPlan() {
    safe("renderPlan", function () {
      var host = el("projPlanList");
      if (!host) return;
      if (!_plan.length) {
        host.innerHTML = '<p class="projEmpty">Belum ada item. Tambahkan lagu dari library.</p>';
        return;
      }
      host.innerHTML = _plan
        .map(function (it, i) {
          var on = _active && _active.kind === "song" && _active.songId === it.songId;
          return (
            '<div class="projPlanItem' + (on ? " isActive" : "") + '" data-uid="' + esc(it.uid) + '">' +
            '<span class="projPlanNo">' + (i + 1) + "</span>" +
            '<span class="projPlanBody"><span class="projPlanTitle">' + esc(it.title) + "</span>" +
            '<span class="projPlanKind">' + esc(it.kind || "Lagu") + (it.key ? " \u00b7 " + esc(it.key) : "") + "</span></span>" +
            '<span class="projPlanOps">' +
            '<button class="projIconBtn" data-op="up" title="Naik" type="button">\u2191</button>' +
            '<button class="projIconBtn" data-op="down" title="Turun" type="button">\u2193</button>' +
            '<button class="projIconBtn" data-op="del" title="Hapus" type="button">\u2715</button>' +
            "</span></div>"
          );
        })
        .join("");
      host.querySelectorAll(".projPlanItem").forEach(function (row) {
        var uid = row.getAttribute("data-uid");
        row.querySelectorAll("[data-op]").forEach(function (b) {
          b.onclick = function (ev) {
            ev.stopPropagation();
            var op = b.getAttribute("data-op");
            var i = _plan.findIndex(function (x) {
              return x.uid === uid;
            });
            if (i < 0) return;
            if (op === "del") _plan.splice(i, 1);
            if (op === "up" && i > 0) _plan.splice(i - 1, 0, _plan.splice(i, 1)[0]);
            if (op === "down" && i < _plan.length - 1) _plan.splice(i + 1, 0, _plan.splice(i, 1)[0]);
            savePlan();
            renderPlan();
          };
        });
        row.onclick = function () {
          var it = _plan.find(function (x) {
            return x.uid === uid;
          });
          if (!it) return;
          openDeck(it.songId);
        };
      });
    });
  }
  function addToPlan(song) {
    _plan.push({
      uid: "i" + Date.now() + Math.random().toString(36).slice(2, 6),
      kind: "Lagu",
      songId: song.id,
      title: song.title || "Tanpa judul",
      key: song.originalKey || "",
    });
    savePlan();
    renderPlan();
    notify("Ditambahkan ke rundown.", "success");
  }

  /* ---------------- panel tengah ---------------- */
  function openDeck(songId) {
    _deckSong = songById(songId);
    if (!_deckSong) return;
    _active = { kind: "song", songId: _deckSong.id, slideIndex: 0 };
    _tab = "lagu";
    syncTabs();
    renderCatalog();
    renderActive();
  }
  function renderDeck() {
    safe("renderDeck", function () {
      var host = el("projSlideGrid");
      if (!host) return;
      if (!_deckSong) {
        host.hidden = true;
        host.innerHTML = "";
        return;
      }
      host.hidden = false;
      var deck = slidesOf(_deckSong);
      var cur = _active && _active.kind === "song" ? _active.slideIndex || 0 : -1;
      host.innerHTML =
        '<div class="projDeckHead"><b>' + esc(_deckSong.title || "") + "</b>" +
        '<span>' + deck.length + " slide \u00b7 " + settings().maxLines + " baris/slide</span>" +
        '<button class="projMiniBtn" data-op="back" type="button">\u2190 Library</button></div>' +
        '<div class="projDeckGrid">' +
        deck
          .map(function (s, i) {
            return (
              '<button class="projSlideCard' + (i === cur ? " on" : "") + '" type="button" data-i="' + i + '">' +
              '<span class="projSlideNo">' + (i + 1) + (s.label ? " \u00b7 " + esc(s.label) : "") + "</span>" +
              '<span class="projSlideBody">' + (s.lines || []).map(esc).join("<br>") + "</span></button>"
            );
          })
          .join("") +
        "</div>";
      var back = host.querySelector('[data-op="back"]');
      if (back)
        back.onclick = function () {
          _deckSong = null;
          renderCatalog();
        };
      host.querySelectorAll(".projSlideCard").forEach(function (b) {
        b.onclick = function () {
          _active = { kind: "song", songId: _deckSong.id, slideIndex: parseInt(b.getAttribute("data-i"), 10) || 0 };
          renderDeck();
          renderActive();
          goLive();
        };
      });
    });
  }
  function renderCatalog() {
    safe("renderCatalog", function () {
      var host = el("projCatalogList");
      var grid = el("projSlideGrid");
      if (!host) return;

      if (_tab === "lagu" && _deckSong) {
        host.innerHTML = "";
        host.hidden = true;
        renderDeck();
        return;
      }
      host.hidden = false;
      if (grid) {
        grid.hidden = true;
        grid.innerHTML = "";
      }

      if (_tab === "lagu") {
        var list = songs();
        var q = _q.trim().toLowerCase();
        if (q)
          list = list.filter(function (s) {
            return String(s.title || "").toLowerCase().indexOf(q) >= 0;
          });
        if (_filter === "rencana") {
          var ids = _plan.map(function (p) {
            return p.songId;
          });
          list = list.filter(function (s) {
            return ids.indexOf(s.id) >= 0;
          });
        }
        var cnt = el("projCountAll");
        if (cnt) cnt.textContent = String(songs().length);
        if (!list.length) {
          host.innerHTML = '<p class="projEmpty">Tidak ada lagu yang cocok.</p>';
          return;
        }
        host.innerHTML = list
          .slice(0, 300)
          .map(function (s) {
            var n = slidesOf(s).length;
            return (
              '<div class="projCard2" data-id="' + esc(s.id) + '">' +
              '<div class="projCard2Main"><b>' + esc((s.num ? s.num + ". " : "") + (s.title || "Tanpa judul")) + "</b>" +
              "<small>" + (s.originalKey ? "Nada " + esc(s.originalKey) : "Tanpa nada") + " \u00b7 " + n + " slide</small></div>" +
              '<div class="projCard2Ops">' +
              '<button class="projMiniBtn primary" data-op="open" type="button">Buka slide</button>' +
              '<button class="projMiniBtn" data-op="plan" type="button">+ Rundown</button>' +
              "</div></div>"
            );
          })
          .join("");
        host.querySelectorAll(".projCard2").forEach(function (card) {
          var id = card.getAttribute("data-id");
          var openBtn = card.querySelector('[data-op="open"]');
          var planBtn = card.querySelector('[data-op="plan"]');
          if (openBtn) openBtn.onclick = function () { openDeck(id); };
          if (planBtn)
            planBtn.onclick = function () {
              var s = songById(id);
              if (s) addToPlan(s);
            };
        });
        return;
      }

      if (_tab === "teks") {
        host.innerHTML =
          '<div class="projComposer"><h3>Teks / Pengumuman</h3>' +
          "<p>Tampil sebagai satu halaman penuh di output youTh Views.</p>" +
          '<textarea id="projTextInput" rows="7" placeholder="Tulis pengumuman, arahan ibadah, atau teks bebas..."></textarea>' +
          '<div class="projComposerOps"><button class="projMiniBtn primary" id="projTextGo" type="button">Tampilkan teks</button>' +
          '<button class="projMiniBtn" id="projTextClear" type="button">Bersihkan layar</button></div></div>';
        var ti = el("projTextInput");
        if (ti) {
          ti.value = _text;
          ti.oninput = function () {
            _text = ti.value;
          };
        }
        var tg = el("projTextGo");
        if (tg)
          tg.onclick = function () {
            _active = { kind: "text" };
            renderActive();
            goLive();
          };
        var tc = el("projTextClear");
        if (tc) tc.onclick = clearScreen;
        return;
      }

      if (_tab === "alkitab") {
        host.innerHTML =
          '<div class="projComposer"><h3>Ayat Alkitab</h3>' +
          "<p>Isi referensi dan teks ayat. Referensi tampil di bawah ayat.</p>" +
          '<input id="projVerseRef" placeholder="Referensi \u2014 mis. Yohanes 3:16" />' +
          '<textarea id="projVerseInput" rows="6" placeholder="Isi ayat..."></textarea>' +
          '<div class="projComposerOps"><button class="projMiniBtn primary" id="projVerseGo" type="button">Tampilkan ayat</button>' +
          '<button class="projMiniBtn" id="projVerseClear" type="button">Bersihkan layar</button></div></div>';
        var vr = el("projVerseRef"), vi = el("projVerseInput");
        if (vr) {
          vr.value = _verse.ref;
          vr.oninput = function () { _verse.ref = vr.value; };
        }
        if (vi) {
          vi.value = _verse.text;
          vi.oninput = function () { _verse.text = vi.value; };
        }
        var vg = el("projVerseGo");
        if (vg)
          vg.onclick = function () {
            _active = { kind: "verse" };
            renderActive();
            goLive();
          };
        var vc = el("projVerseClear");
        if (vc) vc.onclick = clearScreen;
        return;
      }

      if (_tab === "media") {
        host.innerHTML =
          '<div class="projComposer"><h3>Media &amp; Latar Belakang</h3>' +
          "<p>Atur latar di panel kanan: <b>Warna</b>, <b>Animasi</b> (offline), <b>Preset</b>, atau <b>API</b> foto/video.</p>" +
          "<ul><li><b>API</b>: Pexels / Pixabay pakai API key gratis milikmu sendiri; Picsum tanpa key.</li>" +
          "<li><b>Video</b> (.mp4) otomatis diputar berulang sebagai latar bergerak.</li>" +
          "<li>Semua latar diberi lapisan gelap + bayangan teks supaya lirik tetap terbaca.</li></ul></div>";
        return;
      }

      // template = audit fitur
      host.innerHTML = '<div class="projComposer"><h3>Audit Fitur</h3><p>Cek kesehatan tiap fitur. Satu fitur gagal tidak mematikan yang lain.</p>' +
        '<div class="projComposerOps"><button class="projMiniBtn primary" id="projAuditRun" type="button">Jalankan audit</button></div>' +
        '<div id="projAuditOut" class="projAuditOut"></div></div>';
      var ar = el("projAuditRun");
      if (ar) ar.onclick = runAudit;
      runAudit();
    });
  }

  /* ---------------- audit ---------------- */
  function runAudit() {
    safe("audit", function () {
      var out = el("projAuditOut");
      if (!out) return;
      var checks = [];
      function add(name, fn) {
        try {
          var r = fn();
          checks.push({ name: name, ok: !!r.ok, note: r.note || "" });
        } catch (e) {
          checks.push({ name: name, ok: false, note: String((e && e.message) || e) });
        }
      }
      add("Mesin youTh Views", function () {
        var e = engine();
        return { ok: !!e, note: e ? "aktif " + e.version : "js/app.js tidak memuat mesin" };
      });
      add("Data lagu", function () {
        var n = songs().length;
        return { ok: n > 0, note: n + " lagu terbaca" };
      });
      add("Pemecah slide", function () {
        var s = songs()[0];
        if (!s) return { ok: false, note: "belum ada lagu" };
        var d = slidesOf(s);
        return { ok: d.length > 0, note: d.length + " slide dari lagu pertama" };
      });
      add("Lirik tanpa chord", function () {
        var e = engine();
        if (!e) return { ok: false, note: "mesin tidak ada" };
        var t = e.stripChords("[C]Kasih[G] setia-Mu");
        return { ok: t.indexOf("[") < 0, note: 'hasil: "' + t + '"' };
      });
      add("Koneksi realtime", function () {
        return { ok: !!fb(), note: fb() ? "Firebase siap" : "offline / lokal" };
      });
      add("Hak tayang admin", function () {
        var e = engine();
        var can = !!(e && e.canBroadcast());
        return { ok: can, note: can ? "boleh menayangkan" : "login admin dulu" };
      });
      add("Penyimpanan lokal", function () {
        localStorage.setItem("pnwYvPing", "1");
        localStorage.removeItem("pnwYvPing");
        return { ok: true, note: "bisa menyimpan pengaturan" };
      });
      add("Rundown", function () {
        return { ok: true, note: _plan.length + " item" };
      });
      add("Font terpilih", function () {
        return { ok: FONTS.indexOf(settings().font) >= 0, note: settings().font + " (" + FONTS.length + " font tersedia)" };
      });
      add("Latar belakang", function () {
        var b = settings().bg || {};
        return { ok: !!b.kind, note: b.kind + (b.value ? ": " + String(b.value).slice(0, 40) : "") };
      });

      var errs = (window.PNWDiag || []).slice(-8);
      out.innerHTML =
        '<div class="projAuditList">' +
        checks
          .map(function (c) {
            return (
              '<div class="projAuditRow ' + (c.ok ? "ok" : "bad") + '"><span>' + (c.ok ? "\u2713" : "!") + "</span>" +
              "<b>" + esc(c.name) + "</b><small>" + esc(c.note) + "</small></div>"
            );
          })
          .join("") +
        "</div>" +
        (errs.length
          ? '<p class="projSub">Log error terakhir</p><div class="projAuditLog">' +
            errs.map(function (e) { return "<div>" + esc(e.feature) + ": " + esc(e.error) + "</div>"; }).join("") +
            "</div>"
          : '<p class="projSub">Tidak ada error tercatat.</p>');
    });
  }

  /* ---------------- panel kanan ---------------- */
  function renderActive() {
    safe("renderActive", function () {
      var host = el("projActiveBody");
      if (!host) return;
      if (!_active) {
        host.innerHTML = '<p class="projEmpty">Belum ada item aktif. Buka slide lagu, teks, atau ayat.</p>';
        return;
      }
      if (_active.kind === "song") {
        var song = songById(_active.songId);
        var deck = slidesOf(song);
        var i = Math.max(0, Math.min(deck.length - 1, _active.slideIndex || 0));
        var sl = deck[i] || { lines: [] };
        host.innerHTML =
          '<p class="projActiveTitle">' + esc((song && song.title) || "Lagu") + "</p>" +
          '<p class="projActiveKind">Slide ' + (i + 1) + " / " + deck.length + (sl.label ? " \u00b7 " + esc(sl.label) : "") + "</p>" +
          '<div class="projActiveLines">' + (sl.lines || []).map(esc).join("<br>") + "</div>" +
          (deck[i + 1] ? '<p class="projNextLbl">Berikutnya</p><div class="projNextLines">' + (deck[i + 1].lines || []).map(esc).join("<br>") + "</div>" : "");
        return;
      }
      host.innerHTML =
        '<p class="projActiveTitle">' + (_active.kind === "verse" ? "Ayat Alkitab" : "Teks / Pengumuman") + "</p>" +
        '<div class="projActiveLines">' + esc((_active.kind === "verse" ? _verse.text : _text) || "(kosong)").slice(0, 220) + "</div>";
    });
  }

  function renderFontPicker() {
    safe("fonts", function () {
      var f = el("projFont");
      if (!f) return;
      var s = settings();
      if (f.options.length !== FONTS.length) {
        f.innerHTML = FONTS.map(function (n) {
          return '<option value="' + esc(n) + '">' + esc(n) + "</option>";
        }).join("");
      }
      f.value = s.font;
      var e = engine();
      if (e && e.ensureFont) e.ensureFont(s.font);
    });
  }

  function renderBgControls() {
    safe("bgControls", function () {
      ensureBgTabs();
      ensureApiExtras();
      var s = settings();
      var solids = el("projSolids"), presets = el("projPresets"), api = el("projBgApi"), urlEl = el("projBgUrl");
      document.querySelectorAll("#projBgTabs [data-bgtab]").forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-bgtab") === _bgTab);
      });
      if (solids) solids.hidden = _bgTab !== "warna";
      if (presets) presets.hidden = !(_bgTab === "animasi" || _bgTab === "preset");
      if (api) api.hidden = _bgTab !== "api";
      var studioHost = ensureStudioHost();
      if (studioHost) studioHost.hidden = _bgTab !== "studio";
      var mediaHost = ensureMediaHost();
      if (mediaHost) mediaHost.hidden = _bgTab !== "media";
      if (_bgTab === "studio") renderStudio();
      if (_bgTab === "media") renderMediaLib();

      if (solids && _bgTab === "warna") {
        solids.innerHTML = SOLIDS.map(function (c) {
          var on = s.bg && s.bg.kind === "color" && s.bg.value === c;
          return '<button class="projSwatch' + (on ? " on" : "") + '" type="button" data-color="' + c + '" style="background:' + c + '"></button>';
        }).join("");
        solids.querySelectorAll("[data-color]").forEach(function (b) {
          b.onclick = function () {
            setBg({ kind: "color", value: b.getAttribute("data-color") });
          };
        });
      }
      if (presets && _bgTab === "animasi") {
        presets.innerHTML = MOTIONS.map(function (m) {
          var on = s.bg && s.bg.kind === "motion" && s.bg.value === m.id;
          return '<button class="projMotion' + (on ? " on" : "") + '" type="button" data-motion="' + m.id + '"><span class="projMotionThumb" data-bg="' + m.id + '"></span><span>' + esc(m.name) + "</span></button>";
        }).join("");
        presets.querySelectorAll("[data-motion]").forEach(function (b) {
          b.onclick = function () {
            setBg({ kind: "motion", value: b.getAttribute("data-motion") });
          };
        });
      }
      if (presets && _bgTab === "preset") {
        presets.innerHTML = LOCAL_PRESETS.map(function (p) {
          var on = s.bg && s.bg.kind === "image" && s.bg.value === p.url;
          return '<button class="projPreset' + (on ? " on" : "") + '" type="button" data-url="' + esc(p.url) + '"><img src="' + esc(p.url) + '" alt="' + esc(p.name) + '" /><span>' + esc(p.name) + "</span></button>";
        }).join("");
        presets.querySelectorAll("[data-url]").forEach(function (b) {
          b.onclick = function () {
            setBg({ kind: "image", value: b.getAttribute("data-url") });
          };
        });
      }
      if (api && _bgTab === "api") {
        var chips = el("projBgChips");
        if (chips && !chips.children.length) {
          chips.innerHTML = BG_CHIPS.map(function (c) {
            return '<button class="projChip" type="button" data-q="' + esc(c) + '">' + esc(c) + "</button>";
          }).join("");
          chips.querySelectorAll("[data-q]").forEach(function (b) {
            b.onclick = function () {
              var q = el("projBgQuery");
              if (q) q.value = b.getAttribute("data-q");
              searchBg();
            };
          });
        }
        var prov = el("projBgProvider"), keyEl = el("projBgKey");
        if (prov && keyEl) keyEl.value = apiKeys()[prov.value] || "";
      }
      if (urlEl && document.activeElement !== urlEl) {
        urlEl.value = s.bg && (s.bg.kind === "image" || s.bg.kind === "video") ? s.bg.value : "";
      }
      renderPreview();
    });
  }

  /* ---------------- Studio animasi + Pustaka media ---------------- */
  var LOCAL_STUDIO = "pnwYouthViewsStudio.v1";
  var _studioInst = null;
  var _studioP = null;

  function ensureBgTabs() {
    var tabs = el("projBgTabs");
    if (!tabs || tabs.querySelector('[data-bgtab="studio"]')) return;
    [["studio", "Studio"], ["media", "Media"]].forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "projBgTab";
      b.setAttribute("data-bgtab", pair[0]);
      b.textContent = pair[1];
      b.onclick = function () { _bgTab = pair[0]; renderBgControls(); };
      tabs.appendChild(b);
    });
  }

  function ensureApiExtras() {
    var api = el("projBgApi");
    if (!api || el("projBgMedia")) return;
    var row = document.createElement("div");
    row.className = "projBgApiRow";
    row.innerHTML =
      '<select id="projBgMedia" class="projSel"><option value="photo">Foto</option><option value="video">Video</option></select>' +
      '<span class="projSub">Pexels &amp; Pixabay punya bank video gratis</span>';
    api.insertBefore(row, api.firstChild ? api.firstChild.nextSibling : null);
    var sel = row.querySelector("#projBgMedia");
    if (sel) sel.onchange = function () { searchBg(); };
  }

  function hostAfter(anchorId, id, cls) {
    var found = el(id);
    if (found) return found;
    var anchor = el(anchorId);
    if (!anchor || !anchor.parentNode) return null;
    var d = document.createElement("div");
    d.id = id;
    d.className = cls;
    d.hidden = true;
    anchor.parentNode.insertBefore(d, anchor.nextSibling);
    return d;
  }
  function ensureStudioHost() { return hostAfter("projBgApi", "projBgStudio", "projStudio"); }
  function ensureMediaHost() { return hostAfter("projBgStudio", "projBgMediaLib", "projMediaLib"); }

  function studioSaved() {
    try { return JSON.parse(localStorage.getItem(LOCAL_STUDIO) || "[]") || []; } catch (e) { return []; }
  }
  function studioSaveList(list) {
    try { localStorage.setItem(LOCAL_STUDIO, JSON.stringify(list)); } catch (e) {}
  }
  function studioParams() {
    if (_studioP) return _studioP;
    var s = settings();
    if (s.bg && s.bg.kind === "studio" && s.bg.params) _studioP = Object.assign({}, s.bg.params);
    else _studioP = window.PNWMotion ? window.PNWMotion.preset("aurora") : {};
    return _studioP;
  }

  var SLIDERS = [
    ["speed", "Kecepatan", 0.1, 3, 0.05],
    ["density", "Kepadatan", 0.2, 2.5, 0.05],
    ["size", "Ukuran", 0.3, 2.5, 0.05],
    ["glow", "Cahaya", 0, 1.5, 0.05],
    ["vignette", "Vignette", 0, 0.95, 0.05],
    ["grain", "Grain", 0, 0.25, 0.01],
    ["reactivity", "Reaksi ke lirik", 0, 2, 0.05],
    ["angle", "Sudut gradasi", 0, 360, 5],
  ];

  function renderStudio() {
    safe("studio", function () {
      var host = ensureStudioHost();
      if (!host) return;
      if (!window.PNWMotion) {
        host.innerHTML = '<p class="projEmpty">Mesin animasi belum termuat (js/yv-motion.js).</p>';
        return;
      }
      var P = studioParams();
      if (host.getAttribute("data-built") !== "1") {
        var presets = window.PNWMotion.presetList().map(function (p) {
          return '<button class="projChip" type="button" data-preset="' + p.id + '">' + esc(p.name) + "</button>";
        }).join("");
        var engines = window.PNWMotion.engines.map(function (e) {
          return '<option value="' + e.id + '">' + esc(e.name) + "</option>";
        }).join("");
        var sliders = SLIDERS.map(function (f) {
          return '<label class="projField"><span>' + esc(f[1]) + ' <b id="sv_' + f[0] + '"></b></span>' +
            '<input type="range" id="sp_' + f[0] + '" min="' + f[2] + '" max="' + f[3] + '" step="' + f[4] + '" /></label>';
        }).join("");
        host.innerHTML =
          '<canvas class="projStudioCv" id="projStudioCv"></canvas>' +
          '<div class="projChips">' + presets + "</div>" +
          '<label class="projField"><span>Jenis animasi</span><select class="projSel" id="projStudioEngine">' + engines + "</select></label>" +
          '<div class="projColors">' +
            '<label class="projField"><span>Warna 1</span><input type="color" id="sp_color1" /></label>' +
            '<label class="projField"><span>Warna 2</span><input type="color" id="sp_color2" /></label>' +
            '<label class="projField"><span>Aksen</span><input type="color" id="sp_accent" /></label>' +
          "</div>" +
          sliders +
          '<div class="projStudioOps">' +
            '<button class="projBtn primary" type="button" id="projStudioUse">Pakai di Output</button>' +
            '<button class="projBtn" type="button" id="projStudioSave">Simpan preset</button>' +
          "</div>" +
          '<div class="projChips" id="projStudioSaved"></div>' +
          '<label class="projField"><span>Animasi Lottie (JSON dari LottieFiles)</span>' +
          '<input class="projBgUrl" id="projLottieUrl" placeholder="https://.../animation.json" /></label>' +
          '<button class="projBtn" type="button" id="projLottieUse">Pakai Lottie</button>';
        host.setAttribute("data-built", "1");

        _studioInst = window.PNWMotion.create(el("projStudioCv"));
        if (_studioInst) _studioInst.start(P);

        host.querySelectorAll("[data-preset]").forEach(function (b) {
          b.onclick = function () {
            _studioP = window.PNWMotion.preset(b.getAttribute("data-preset"));
            _studioP.presetId = b.getAttribute("data-preset");
            renderStudio();
            pushStudio();
          };
        });
        var eng = el("projStudioEngine");
        if (eng) eng.onchange = function () { studioParams().engine = eng.value; syncStudio(true); };
        ["color1", "color2", "accent"].forEach(function (k) {
          var c = el("sp_" + k);
          if (!c) return;
          c.oninput = function () { studioParams()[k] = c.value; syncStudio(false); };
          c.onchange = function () { pushStudio(); };
        });
        SLIDERS.forEach(function (f) {
          var r = el("sp_" + f[0]);
          if (!r) return;
          r.oninput = function () { studioParams()[f[0]] = parseFloat(r.value); syncStudio(false); };
          r.onchange = function () { pushStudio(); };
        });
        var use = el("projStudioUse");
        if (use) use.onclick = function () { pushStudio(true); };
        var sv = el("projStudioSave");
        if (sv) sv.onclick = function () {
          var name = window.prompt("Nama preset:", "Preset saya");
          if (!name) return;
          var list = studioSaved();
          list.unshift({ id: "u" + Date.now().toString(36), name: name, params: Object.assign({}, studioParams()) });
          studioSaveList(list.slice(0, 24));
          paintSavedPresets();
          notify("Preset tersimpan");
        };
        var lu = el("projLottieUse");
        if (lu) lu.onclick = function () {
          var v = ((el("projLottieUrl") || {}).value || "").trim();
          if (!v) return notify("Tempel URL file .json Lottie dulu");
          setBg({ kind: "lottie", value: v });
        };
      }
      syncStudio(true);
      paintSavedPresets();
    });
  }

  function paintSavedPresets() {
    var box = el("projStudioSaved");
    if (!box) return;
    var list = studioSaved();
    if (!list.length) {
      box.innerHTML = '<span class="projSub">Belum ada preset simpanan.</span>';
      return;
    }
    box.innerHTML = list.map(function (p) {
      return '<span class="projChipWrap"><button class="projChip" type="button" data-use="' + p.id + '">' + esc(p.name) +
        '</button><button class="projChipX" type="button" data-del="' + p.id + '">&times;</button></span>';
    }).join("");
    box.querySelectorAll("[data-use]").forEach(function (b) {
      b.onclick = function () {
        var f = studioSaved().filter(function (x) { return x.id === b.getAttribute("data-use"); })[0];
        if (!f) return;
        _studioP = Object.assign({}, f.params);
        renderStudio();
        pushStudio();
      };
    });
    box.querySelectorAll("[data-del]").forEach(function (b) {
      b.onclick = function () {
        studioSaveList(studioSaved().filter(function (x) { return x.id !== b.getAttribute("data-del"); }));
        paintSavedPresets();
      };
    });
  }

  function syncStudio(fillInputs) {
    var P = studioParams();
    if (fillInputs) {
      var eng = el("projStudioEngine");
      if (eng && P.engine) eng.value = P.engine;
      ["color1", "color2", "accent"].forEach(function (k) {
        var c = el("sp_" + k);
        if (c && P[k]) c.value = P[k];
      });
      SLIDERS.forEach(function (f) {
        var r = el("sp_" + f[0]);
        if (r && P[f[0]] != null) r.value = P[f[0]];
      });
    }
    SLIDERS.forEach(function (f) {
      var lab = el("sv_" + f[0]);
      if (lab) lab.textContent = String(Math.round((P[f[0]] || 0) * 100) / 100);
    });
    if (_studioInst) _studioInst.apply(P);
  }

  function pushStudio(force) {
    var s = settings();
    var live = s.bg && s.bg.kind === "studio";
    if (!live && !force) return;
    var P = studioParams();
    setBg({ kind: "studio", value: P.presetId || "custom", params: Object.assign({}, P) });
  }

  function fmtSize(n) {
    var k = (n || 0) / 1024;
    return k > 1024 ? (k / 1024).toFixed(1) + " MB" : Math.round(k) + " KB";
  }

  function renderMediaLib() {
    safe("mediaLib", function () {
      var host = ensureMediaHost();
      if (!host) return;
      if (host.getAttribute("data-built") !== "1") {
        host.innerHTML =
          '<p class="projSub">Unggah video / GIF / gambar dari perangkat (mis. hasil ekspor Canva atau After Effects). File disimpan di browser, jadi tetap jalan tanpa internet.</p>' +
          '<input type="file" id="projMediaFile" accept="video/*,image/*,.json" />' +
          '<div class="projMediaGrid" id="projMediaGrid"></div>';
        host.setAttribute("data-built", "1");
        var f = el("projMediaFile");
        if (f) f.onchange = function () {
          var file = f.files && f.files[0];
          if (!file || !window.PNWMedia) return;
          notify("Menyimpan " + file.name + "...");
          window.PNWMedia.put(file)
            .then(function () { f.value = ""; paintMedia(); notify("File tersimpan"); })
            .catch(function (e) { notify("Gagal simpan: " + (e.message || e)); });
        };
      }
      paintMedia();
    });
  }

  function paintMedia() {
    var grid = el("projMediaGrid");
    if (!grid || !window.PNWMedia) return;
    window.PNWMedia.list().then(function (list) {
      if (!list.length) {
        grid.innerHTML = '<p class="projEmpty">Belum ada file. Ekspor animasi dari Canva sebagai MP4 lalu unggah di sini.</p>';
        return;
      }
      grid.innerHTML = list.map(function (m) {
        var isJson = /json/i.test(m.type) || /\.json$/i.test(m.name);
        return '<div class="projMediaItem"><b>' + esc(m.name) + "</b><span>" + fmtSize(m.size) + " · " + (isJson ? "Lottie" : /video/i.test(m.type) ? "Video" : "Gambar") + "</span>" +
          '<div class="projMediaOps"><button class="projBtn primary" type="button" data-use="' + m.id + '" data-kind="' + (isJson ? "lottie" : "upload") + '" data-mime="' + esc(m.type) + '">Pakai</button>' +
          '<button class="projBtn" type="button" data-del="' + m.id + '">Hapus</button></div></div>';
      }).join("");
      grid.querySelectorAll("[data-use]").forEach(function (b) {
        b.onclick = function () {
          setBg({ kind: b.getAttribute("data-kind"), value: "idb:" + b.getAttribute("data-use"), mime: b.getAttribute("data-mime") });
        };
      });
      grid.querySelectorAll("[data-del]").forEach(function (b) {
        b.onclick = function () {
          window.PNWMedia.del(b.getAttribute("data-del")).then(paintMedia);
        };
      });
    }).catch(function (e) {
      grid.innerHTML = '<p class="projEmpty">Penyimpanan lokal tidak tersedia: ' + esc(String(e.message || e)) + "</p>";
    });
  }

  function setBg(bg) {
    _set = settings();
    _set.bg = bg;
    saveSettings();
    renderBgControls();
    if (_active) goLive();
  }

  /* ---------------- API latar belakang ---------------- */
  function searchBg() {
    safe("bgSearch", function () {
      var prov = (el("projBgProvider") || {}).value || "pexels";
      var key = ((el("projBgKey") || {}).value || "").trim();
      var q = ((el("projBgQuery") || {}).value || "worship background").trim();
      var out = el("projBgResults");
      if (!out) return;
      if (key) saveApiKey(prov, key);
      out.innerHTML = '<p class="projSub">Mencari\u2026</p>';

      if (prov === "picsum") {
        var items = [];
        for (var i = 0; i < 12; i++) {
          var seed = encodeURIComponent(q.replace(/\s+/g, "-") + "-" + i);
          items.push({ thumb: "https://picsum.photos/seed/" + seed + "/240/135", url: "https://picsum.photos/seed/" + seed + "/1920/1080", kind: "image" });
        }
        paintResults(items);
        return;
      }
      if (!key) {
        out.innerHTML = '<p class="projEmpty">Provider ini butuh API key gratis. Daftar di situs provider, tempel key-nya di atas, lalu cari lagi. Atau pakai Picsum / tab Animasi yang tanpa key.</p>';
        return;
      }

      var media = ((el("projBgMedia") || {}).value) || "photo";
      var url, opts = {};
      if (prov === "pexels") {
        url = media === "video"
          ? "https://api.pexels.com/videos/search?per_page=12&query=" + encodeURIComponent(q)
          : "https://api.pexels.com/v1/search?per_page=12&query=" + encodeURIComponent(q);
        opts.headers = { Authorization: key };
      } else {
        url = media === "video"
          ? "https://pixabay.com/api/videos/?per_page=12&key=" + encodeURIComponent(key) + "&q=" + encodeURIComponent(q)
          : "https://pixabay.com/api/?per_page=12&image_type=photo&key=" + encodeURIComponent(key) + "&q=" + encodeURIComponent(q);
      }
      fetch(url, opts)
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then(function (data) {
          var items = [];
          if (data && data.videos) {
            items = data.videos.map(function (v) {
              var files = (v.video_files || []).slice().sort(function (a, b) { return (a.width || 0) - (b.width || 0); });
              var pick = files.filter(function (f) { return (f.width || 0) >= 1280; })[0] || files[files.length - 1];
              return { thumb: v.image, url: (pick && pick.link) || "", kind: "video" };
            }).filter(function (it) { return !!it.url; });
          } else if (prov === "pexels" && data && data.photos) {
            items = data.photos.map(function (p) {
              return { thumb: p.src && p.src.tiny, url: (p.src && (p.src.large2x || p.src.large)) || "", kind: "image" };
            });
          } else if (data && data.hits) {
            items = data.hits.map(function (p) {
              if (p.videos) {
                var V = p.videos || {};
                var vv =
                  (V.large && V.large.url ? V.large : null) ||
                  (V.medium && V.medium.url ? V.medium : null) ||
                  (V.small && V.small.url ? V.small : null) ||
                  (V.tiny && V.tiny.url ? V.tiny : null) || {};
                var th =
                  (V.large && V.large.thumbnail) ||
                  (V.medium && V.medium.thumbnail) ||
                  (V.small && V.small.thumbnail) ||
                  (V.tiny && V.tiny.thumbnail) ||
                  (p.picture_id ? "https://i.vimeocdn.com/video/" + p.picture_id + "_295x166.jpg" : "");
                return { thumb: th, url: vv.url || "", kind: "video" };
              }
              return { thumb: p.previewURL, url: p.largeImageURL || p.webformatURL, kind: "image" };
            }).filter(function (it) { return !!it.url; });
          }
          if (!items.length) {
            out.innerHTML = '<p class="projEmpty">Tidak ada hasil.</p>';
            return;
          }
          paintResults(items);
        })
        .catch(function (e) {
          out.innerHTML = '<p class="projEmpty">Gagal memuat: ' + esc(String(e.message || e)) + ". Cek API key / koneksi.</p>";
          (window.PNWDiag = window.PNWDiag || []).push({ feature: "youthviews.bgApi", error: String(e.message || e), at: Date.now() });
        });
    });
  }
  function paintResults(items) {
    var out = el("projBgResults");
    if (!out) return;
    out.innerHTML = items
      .map(function (it, i) {
        var isVid = (it.kind || "image") === "video";
        // penting: untuk video HANYA thumbnail. Dulu URL .mp4 dipakai sebagai
        // src <img> sehingga 12 video terunduh sekaligus -> tab crash.
        var t = isVid ? it.thumb || "" : it.thumb || it.url || "";
        var img = t
          ? '<img loading="lazy" src="' + esc(t) + '" alt="" />'
          : "";
        return (
          '<button class="projBgThumb' + (t ? "" : " noThumb") + '" type="button" data-i="' + i + '">' +
          img +
          (isVid ? '<span class="projBgVid">VIDEO</span>' : "") +
          "</button>"
        );
      })
      .join("");
    // gambar rusak -> jadikan kotak placeholder, bukan ikon patah
    out.querySelectorAll(".projBgThumb img").forEach(function (im) {
      im.onerror = function () {
        im.style.display = "none";
        if (im.parentNode) im.parentNode.classList.add("noThumb");
      };
    });
    out.querySelectorAll(".projBgThumb").forEach(function (b) {
      b.onclick = function () {
        var it = items[parseInt(b.getAttribute("data-i"), 10) || 0];
        if (it) setBg({ kind: it.kind || "image", value: it.url });
      };
    });
  }

  /* ---------------- pratinjau ---------------- */
  function renderPreview() {
    safe("preview", function () {
      var p = el("projPreview");
      if (!p) return;
      var s = settings();
      p.className = "projPreview";
      p.removeAttribute("data-bg");
      p.style.background = "";
      p.style.backgroundImage = "";
      var b = s.bg || {};
      if (b.kind === "color") p.style.background = b.value;
      else if (b.kind === "motion") p.setAttribute("data-bg", b.value);
      else if (b.kind === "image")
        p.style.background = "#000 center/cover no-repeat url('" + String(b.value).replace(/'/g, "%27") + "')";
      else if (b.kind === "studio" || b.kind === "lottie") p.style.background = "#0b1020";
      // video / unggahan: WAJIB elemen <video>. Kalau dipasang sebagai
      // background-image, browser mengunduh seluruh berkas .mp4 dan hang.
      var pv = p.querySelector(".projPvVideo");
      if (b.kind === "video" || b.kind === "upload") {
        p.style.background = "#000";
        if (!pv) {
          pv = document.createElement("video");
          pv.className = "projPvVideo";
          pv.muted = true;
          pv.loop = true;
          pv.autoplay = true;
          pv.setAttribute("playsinline", "");
          pv.setAttribute("preload", "metadata");
          pv.onerror = function () {
            pv.style.display = "none";
          };
          p.insertBefore(pv, p.firstChild);
        }
        pv.style.display = "";
        if (b.kind === "upload") {
          if (window.PNWMedia && window.PNWMedia.resolve && pv.getAttribute("data-src") !== b.value) {
            pv.setAttribute("data-src", b.value);
            window.PNWMedia.resolve(b.value)
              .then(function (u) { if (u) pv.src = u; })
              .catch(function () {});
          }
        } else if (pv.getAttribute("data-src") !== b.value) {
          pv.setAttribute("data-src", b.value);
          pv.src = b.value;
        }
      } else if (pv) {
        try {
          pv.pause();
          pv.removeAttribute("src");
          pv.load();
        } catch (e) {}
        pv.remove();
      }
      var t = el("projPreviewText");
      if (!t) return;
      t.style.fontFamily = '"' + s.font + '", Inter, sans-serif';
      t.style.fontSize = Math.max(13, Math.round(s.size * 0.34)) + "px";
      t.style.textAlign = s.align;
      t.style.textShadow = s.shadow === "none" ? "none" : s.shadow === "strong" ? "0 4px 18px rgba(0,0,0,.9)" : "0 2px 8px rgba(0,0,0,.7)";
      var txt = "Contoh teks lirik";
      if (_active && _active.kind === "song") {
        var song = songById(_active.songId);
        var deck = slidesOf(song);
        var sl = deck[_active.slideIndex || 0];
        if (sl && sl.lines && sl.lines.length) txt = sl.lines[0];
      }
      t.textContent = txt;
    });
  }

  function renderSettings() {
    safe("renderSettings", function () {
      var s = settings();
      renderFontPicker();
      var sz = el("projSize");
      if (sz) sz.value = s.size;
      var szv = el("projSizeVal");
      if (szv) szv.textContent = s.size + "px";
      var ml = el("projMaxLines");
      if (ml) ml.value = s.maxLines;
      var mlv = el("projMaxLinesVal");
      if (mlv) mlv.textContent = s.maxLines;
      var sh = el("projShadow");
      if (sh) sh.value = s.shadow;
      document.querySelectorAll("#projAlign [data-align]").forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-align") === s.align);
      });
      renderBgControls();
    });
  }

  /* ---------------- sinkron ---------------- */
  function watch() {
    if (_watching) return;
    safe("watch", function () {
      var rp = ref(PLAN_REF), rs = ref(SET_REF);
      if (!rp && !rs) return;
      _watching = true;
      if (rp)
        rp.on("value", function (snap) {
          var v = snap && snap.val ? snap.val() : null;
          if (Array.isArray(v)) {
            _plan = v;
            renderPlan();
          }
        });
      if (rs)
        rs.on("value", function (snap) {
          var v = snap && snap.val ? snap.val() : null;
          if (v && typeof v === "object") {
            _set = Object.assign({}, DEFAULTS, v);
            if (!_set.bg || typeof _set.bg !== "object") _set.bg = { kind: "motion", value: "aurora" };
            renderSettings();
          }
        });
    });
  }

  function syncTabs() {
    document.querySelectorAll("#projTabs [data-tab]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-tab") === _tab);
    });
  }

  /* ---------------- buka / tutup ---------------- */
  function open() {
    safe("open", function () {
      var pg = el("projPage");
      if (!pg) return;
      pg.classList.add("open");
      pg.setAttribute("aria-hidden", "false");
      document.body.classList.add("projOpen");
      loadLocalPlan();
      watch();
      syncTabs();
      renderPlan();
      renderCatalog();
      renderActive();
      renderSettings();
    });
  }
  function close() {
    safe("close", function () {
      var pg = el("projPage");
      if (!pg) return;
      pg.classList.remove("open");
      pg.setAttribute("aria-hidden", "true");
      document.body.classList.remove("projOpen");
    });
  }
  function isOpen() {
    var pg = el("projPage");
    return !!(pg && pg.classList.contains("open"));
  }

  function init() {
    safe("init", function () {
      var ob = el("openProjBtn");
      if (ob)
        ob.onclick = function () {
          if (typeof window.closeMenu === "function") window.closeMenu();
          open();
        };
      var cb = el("closeProjBtn");
      if (cb) cb.onclick = close;
      var odb = el("openDisplayBtn");
      if (odb)
        odb.onclick = function () {
          window.open(location.origin + location.pathname + "?mode=youthviews", "_blank");
        };

      document.querySelectorAll("#projTabs [data-tab]").forEach(function (b) {
        b.onclick = function () {
          _tab = b.getAttribute("data-tab");
          if (_tab !== "lagu") _deckSong = null;
          syncTabs();
          renderCatalog();
        };
      });
      document.querySelectorAll("#projFilters [data-filter]").forEach(function (b) {
        b.onclick = function () {
          _filter = b.getAttribute("data-filter");
          document.querySelectorAll("#projFilters [data-filter]").forEach(function (x) {
            x.classList.toggle("on", x === b);
          });
          renderCatalog();
        };
      });
      document.querySelectorAll("#projBgTabs [data-bgtab]").forEach(function (b) {
        b.onclick = function () {
          _bgTab = b.getAttribute("data-bgtab");
          renderBgControls();
        };
      });
      var q = el("projSearch");
      if (q)
        q.oninput = function () {
          _q = q.value || "";
          _deckSong = null;
          renderCatalog();
        };

      var nb = el("projNewPlan");
      if (nb)
        nb.onclick = function () {
          if (_plan.length && !confirm("Kosongkan rundown?")) return;
          _plan = [];
          savePlan();
          renderPlan();
        };
      var sb = el("projSavePlan");
      if (sb)
        sb.onclick = function () {
          savePlan();
          notify("Rundown disimpan.", "success");
        };

      var lv = el("projGoLive");
      if (lv) lv.onclick = goLive;
      var cl = el("projClear");
      if (cl) cl.onclick = clearScreen;
      var pv = el("projPrevSlide");
      if (pv) pv.onclick = function () { step(-1); };
      var nx = el("projNextSlide");
      if (nx) nx.onclick = function () { step(1); };

      var f = el("projFont");
      if (f)
        f.onchange = function () {
          _set = settings();
          _set.font = f.value;
          var e = engine();
          if (e && e.ensureFont) e.ensureFont(_set.font);
          saveSettings();
          renderPreview();
          if (_active) goLive();
        };
      var sz = el("projSize");
      if (sz)
        sz.oninput = function () {
          _set = settings();
          _set.size = parseInt(sz.value, 10) || 56;
          var v = el("projSizeVal");
          if (v) v.textContent = _set.size + "px";
          saveSettings();
          renderPreview();
        };
      if (sz) sz.onchange = function () { if (_active) goLive(); };
      var ml = el("projMaxLines");
      if (ml)
        ml.oninput = function () {
          _set = settings();
          _set.maxLines = parseInt(ml.value, 10) || 4;
          var v = el("projMaxLinesVal");
          if (v) v.textContent = _set.maxLines;
          saveSettings();
        };
      if (ml)
        ml.onchange = function () {
          if (_active && _active.kind === "song") _active.slideIndex = 0;
          renderDeck();
          renderActive();
          if (_active) goLive();
        };
      var sh = el("projShadow");
      if (sh)
        sh.onchange = function () {
          _set = settings();
          _set.shadow = sh.value;
          saveSettings();
          renderPreview();
          if (_active) goLive();
        };
      document.querySelectorAll("#projAlign [data-align]").forEach(function (b) {
        b.onclick = function () {
          _set = settings();
          _set.align = b.getAttribute("data-align");
          saveSettings();
          renderSettings();
          if (_active) goLive();
        };
      });
      var bs = el("projBgSearch");
      if (bs) bs.onclick = searchBg;
      var bq = el("projBgQuery");
      if (bq)
        bq.onkeydown = function (ev) {
          if (ev.key === "Enter") searchBg();
        };
      var bp = el("projBgProvider");
      if (bp) bp.onchange = renderBgControls;
      var bu = el("projBgUrl");
      if (bu)
        bu.onchange = function () {
          var v = (bu.value || "").trim();
          if (!v) return;
          setBg({ kind: /\.(mp4|webm|mov)(\?|$)/i.test(v) ? "video" : "image", value: v });
        };

      // keyboard ala presenter
      document.addEventListener("keydown", function (ev) {
        if (!isOpen()) return;
        var t = ev.target && ev.target.tagName;
        if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
        if (ev.key === "ArrowRight" || ev.key === " " || ev.key === "PageDown") {
          ev.preventDefault();
          step(1);
        } else if (ev.key === "ArrowLeft" || ev.key === "PageUp") {
          ev.preventDefault();
          step(-1);
        } else if (ev.key === "Escape") {
          close();
        }
      });

      loadLocalPlan();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.PNWProjector = { open: open, close: close, init: init, audit: runAudit, fonts: FONTS };
})();


/* ============ v5.7 - rail navigasi: satu fitur satu kolom ============ */
(function () {
  "use strict";
  var ITEMS = [
    { id: "rundown", ic: "\u2630", label: "Rundown", pane: "L" },
    { id: "lagu", ic: "\u266B", label: "Lagu", tab: "lagu" },
    { id: "alkitab", ic: "\u271D", label: "Alkitab", tab: "alkitab" },
    { id: "teks", ic: "\u270E", label: "Teks", tab: "teks" },
    { id: "media", ic: "\u25A3", label: "Media", tab: "media" },
    { id: "template", ic: "\u2699", label: "Template", tab: "template" },
    { id: "tampilan", ic: "A", label: "Teks & Font", pane: "R", find: "PENGATURAN TEKS" },
    { id: "latar", ic: "\u25D1", label: "Latar", pane: "R", find: "LATAR BELAKANG" },
    { id: "pratinjau", ic: "\u25A0", label: "Pratinjau", pane: "R", find: "PRATINJAU" },
  ];

  function q(s, r) { return (r || document).querySelector(s); }

  function scrollToLabel(pane, text) {
    if (!pane) return;
    var found = null;
    pane.querySelectorAll("h3, h4, .projSecTitle, .projPaneHead, label, b, strong").forEach(function (n) {
      if (found) return;
      var t = (n.textContent || "").trim().toUpperCase();
      if (t.indexOf(String(text).toUpperCase()) === 0) found = n;
    });
    if (found && found.scrollIntoView) found.scrollIntoView({ block: "start", behavior: "smooth" });
    else pane.scrollTop = 0;
  }

  function activate(it, btn) {
    var rail = q("#projRail");
    if (rail) rail.querySelectorAll(".projRailBtn").forEach(function (b) { b.classList.remove("on"); });
    if (btn) btn.classList.add("on");
    try {
      if (it.tab) {
        var t = q('#projTabs [data-tab="' + it.tab + '"]');
        if (t) t.click();
        var pc = q(".projPaneC");
        if (pc) pc.scrollTop = 0;
      } else if (it.pane === "L") {
        var pl = q(".projPaneL");
        if (pl && pl.scrollIntoView) pl.scrollIntoView({ block: "nearest", behavior: "smooth" });
        if (pl) pl.scrollTop = 0;
      } else if (it.pane === "R") {
        scrollToLabel(q(".projPaneR"), it.find);
      }
    } catch (e) {
      (window.PNWDiag = window.PNWDiag || []).push({
        feature: "youthviews.rail",
        error: String((e && e.message) || e),
        at: Date.now(),
      });
    }
  }

  function buildRail() {
    var grid = q("#projPage .projGrid");
    if (!grid || q("#projRail")) return;
    var rail = document.createElement("nav");
    rail.className = "projPane projRail";
    rail.id = "projRail";
    rail.setAttribute("aria-label", "Navigasi fitur youTh Views");
    var html = '<div class="projRailTitle">Fitur</div>';
    ITEMS.forEach(function (it, i) {
      if (i === 6) html += '<div class="projRailTitle">Tampilan</div>';
      html +=
        '<button class="projRailBtn" type="button" data-rail="' + it.id + '">' +
        '<span class="ic">' + it.ic + "</span><span>" + it.label + "</span></button>";
    });
    rail.innerHTML = html;
    grid.insertBefore(rail, grid.firstChild);
    rail.querySelectorAll(".projRailBtn").forEach(function (b) {
      var it = ITEMS.filter(function (x) { return x.id === b.getAttribute("data-rail"); })[0];
      if (!it) return;
      b.onclick = function () { activate(it, b); };
    });
    var first = rail.querySelector('[data-rail="lagu"]');
    if (first) first.classList.add("on");
  }

  function hook() {
    try {
      if (window.PNWProjector && typeof window.PNWProjector.open === "function" && !window.PNWProjector.__railed) {
        var open0 = window.PNWProjector.open;
        window.PNWProjector.open = function () {
          var r = open0.apply(this, arguments);
          try { buildRail(); } catch (e) {}
          return r;
        };
        window.PNWProjector.__railed = true;
      }
    } catch (e) {}
    var page = document.getElementById("projPage");
    if (page) {
      if (page.classList.contains("open")) buildRail();
      try {
        new MutationObserver(function () {
          if (page.classList.contains("open")) buildRail();
        }).observe(page, { attributes: true, attributeFilter: ["class"] });
      } catch (e) {}
    }
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", hook);
  else hook();
})();
