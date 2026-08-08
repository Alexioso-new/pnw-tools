/* PNW-FILE-GUIDE
   js/projector.js — Proyektor 3 panel (window.PNWProjector).
   RTDB: pujianYouth/projector/plan + /settings. Memakai mekanisme live pujianYouth/live (JANGAN ubah bentuknya).
   Dibuka dari #openProjBtn di drawer (index.html). Gaya di css/design.css (.proj*).
 */

/* =========================================================================
   PROYEKTOR - MODE PERSIAPAN (v65, dalam masa pengembangan)
   Tata letak 3 panel mengikuti pola web presenter PraiseDeck:
     kiri   : Rencana Ibadah (daftar item pelayanan)
     tengah : Katalog bertab (Lagu / Alkitab / Teks / Media / Template)
     kanan  : Item Aktif + pengaturan teks & latar belakang
   Rencana dan pengaturan tersinkron realtime lewat RTDB.
   Menayangkan memakai bentuk data pujianYouth/live yang sudah ada,
   jadi layar proyektor lama tetap berfungsi.
   ========================================================================= */
(function () {
  "use strict";

  var PLAN_REF = "pujianYouth/projector/plan";
  var SET_REF = "pujianYouth/projector/settings";
  var LIVE_REF = "pujianYouth/live";
  var SONGS_KEY = "pujianYouthChordSongs.v3";
  var LOCAL_PLAN = "pnwProjectorPlan.v1";
  var LOCAL_SET = "pnwProjectorSettings.v1";

  var DEFAULTS = {
    font: "Inter",
    size: 40,
    align: "center",
    shadow: "soft",
    bg: "#0b0e14",
    bgImage: "",
  };

  var SOLIDS = [
    "#0b0e14",
    "#000000",
    "#111621",
    "#12243d",
    "#1b2a1f",
    "#2d1719",
    "#251a2e",
    "#2a2213",
  ];
  var PRESETS = [
    { name: "Praise", url: "./img/praise.jpg" },
    { name: "Worship", url: "./img/worship.jpg" },
  ];

  var _plan = [];
  var _set = null;
  var _active = null;
  var _tab = "lagu";
  var _filter = "semua";
  var _q = "";
  var _watching = false;

  /* ---------- util ---------- */
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
  function el(id) {
    return document.getElementById(id);
  }
  function notify(m) {
    if (typeof window.toast === "function") window.toast(m);
  }
  function settings() {
    if (!_set) {
      var raw = null;
      try {
        raw = JSON.parse(localStorage.getItem(LOCAL_SET) || "null");
      } catch (e) {}
      _set = Object.assign({}, DEFAULTS, raw || {});
    }
    return _set;
  }
  function saveSettings() {
    try {
      localStorage.setItem(LOCAL_SET, JSON.stringify(_set));
    } catch (e) {}
    var r = ref(SET_REF);
    if (r) r.set(_set);
  }
  function savePlan() {
    try {
      localStorage.setItem(LOCAL_PLAN, JSON.stringify(_plan));
    } catch (e) {}
    var r = ref(PLAN_REF);
    if (r) r.set(_plan);
  }
  function loadLocalPlan() {
    try {
      var p = JSON.parse(localStorage.getItem(LOCAL_PLAN) || "null");
      if (Array.isArray(p)) _plan = p;
    } catch (e) {}
  }

  /* ---------- sumber lagu ---------- */
  function allSongs() {
    if (Array.isArray(window.songs) && window.songs.length) return window.songs;
    try {
      var raw = JSON.parse(localStorage.getItem(SONGS_KEY) || "null");
      if (Array.isArray(raw)) return raw;
    } catch (e) {}
    return [];
  }
  function sectionCount(s) {
    var body = (s && (s.body || s.lyrics || s.text)) || "";
    var m = String(body).match(/^\s*\[[^\]]+\]/gm);
    return m ? m.length : 0;
  }

  /* ---------- panel kiri: rencana ---------- */
  function renderPlan() {
    var host = el("projPlanList");
    if (!host) return;
    if (!_plan.length) {
      host.innerHTML =
        '<p class="projEmpty">Belum ada item. Pilih lagu dari katalog untuk menambah.</p>';
      return;
    }
    host.innerHTML = _plan
      .map(function (it, i) {
        var on = _active && _active.uid === it.uid;
        return (
          '<div class="projPlanItem' +
          (on ? " isActive" : "") +
          '" data-uid="' +
          esc(it.uid) +
          '">' +
          '<span class="projPlanNo">' +
          (i + 1) +
          "</span>" +
          '<span class="projPlanBody"><span class="projPlanTitle">' +
          esc(it.title) +
          '</span><span class="projPlanKind">' +
          esc(it.kind || "Lagu") +
          (it.key ? " \u00b7 " + esc(it.key) : "") +
          "</span></span>" +
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
          if (op === "up" && i > 0)
            _plan.splice(i - 1, 0, _plan.splice(i, 1)[0]);
          if (op === "down" && i < _plan.length - 1)
            _plan.splice(i + 1, 0, _plan.splice(i, 1)[0]);
          savePlan();
          renderPlan();
        };
      });
      row.onclick = function () {
        _active =
          _plan.find(function (x) {
            return x.uid === uid;
          }) || null;
        renderPlan();
        renderActive();
      };
    });
  }

  function addToPlan(song) {
    _plan.push({
      uid: "i" + Date.now() + Math.random().toString(36).slice(2, 6),
      kind: "Lagu",
      songId: song.id,
      title: song.title || "Tanpa judul",
      key: song.key || "",
    });
    savePlan();
    renderPlan();
    notify("Ditambahkan ke rencana.");
  }

  /* ---------- panel tengah: katalog ---------- */
  function renderCatalog() {
    var host = el("projCatalogList");
    if (!host) return;

    if (_tab !== "lagu") {
      host.innerHTML =
        '<div class="projSoon"><p class="projSoonTitle">' +
        esc(tabLabel(_tab)) +
        "</p>" +
        '<p class="projSoonNote">Bagian ini masih dalam masa pengembangan.</p></div>';
      return;
    }

    var list = allSongs();
    var q = _q.trim().toLowerCase();
    if (q)
      list = list.filter(function (s) {
        return (
          String(s.title || "")
            .toLowerCase()
            .indexOf(q) >= 0
        );
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
    if (cnt) cnt.textContent = String(allSongs().length);

    if (!list.length) {
      host.innerHTML = '<p class="projEmpty">Tidak ada lagu yang cocok.</p>';
      return;
    }

    host.innerHTML = list
      .slice(0, 200)
      .map(function (s) {
        var n = sectionCount(s);
        return (
          '<button class="projCard" type="button" data-id="' +
          esc(s.id) +
          '">' +
          '<span class="projCardTitle">' +
          esc(s.title || "Tanpa judul") +
          "</span>" +
          '<span class="projCardMeta">' +
          (s.key ? "Nada " + esc(s.key) : "Tanpa nada") +
          (n ? " \u00b7 " + n + " bagian" : "") +
          "</span></button>"
        );
      })
      .join("");

    host.querySelectorAll(".projCard").forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-id");
        var s = allSongs().find(function (x) {
          return String(x.id) === String(id);
        });
        if (s) addToPlan(s);
      };
    });
  }

  function tabLabel(t) {
    return (
      {
        lagu: "Lagu",
        alkitab: "Alkitab",
        teks: "Teks",
        media: "Media",
        template: "Template",
      }[t] || t
    );
  }

  /* ---------- panel kanan: item aktif ---------- */
  function renderActive() {
    var host = el("projActiveBody");
    if (!host) return;
    if (!_active) {
      host.innerHTML =
        '<p class="projEmpty">Belum ada item aktif. Klik salah satu item di Rencana Ibadah.</p>';
      return;
    }
    host.innerHTML =
      '<p class="projActiveTitle">' +
      esc(_active.title) +
      "</p>" +
      '<p class="projActiveKind">' +
      esc(_active.kind || "Lagu") +
      (_active.key ? " \u00b7 Nada " + esc(_active.key) : "") +
      "</p>";
  }

  function goLive() {
    if (!_active) {
      notify("Pilih item aktif lebih dulu.");
      return;
    }
    var r = ref(LIVE_REF);
    if (!r) {
      notify("Butuh koneksi untuk menayangkan.");
      return;
    }
    try {
      r.set({
        active: true,
        songId: _active.songId,
        key: _active.key || "",
        scroll: 0,
        showChords: !!settings().showChords,
        songTitle: _active.title || "",
        t: Date.now(),
      });
      notify("Ditayangkan ke layar proyektor.");
    } catch (e) {
      notify("Gagal menayangkan.");
    }
  }

  function clearScreen() {
    var r = ref(LIVE_REF);
    if (!r) return;
    try {
      r.set({ active: false, t: Date.now() });
      notify("Layar dibersihkan.");
    } catch (e) {}
  }

  /* ---------- pengaturan teks & latar ---------- */
  function renderSettings() {
    var s = settings();
    var f = el("projFont");
    if (f) f.value = s.font;
    var sz = el("projSize");
    if (sz) sz.value = s.size;
    var szv = el("projSizeVal");
    if (szv) szv.textContent = s.size + "px";
    var sh = el("projShadow");
    if (sh) sh.value = s.shadow;
    document.querySelectorAll("#projAlign [data-align]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-align") === s.align);
    });

    var solids = el("projSolids");
    if (solids)
      solids.innerHTML = SOLIDS.map(function (c) {
        return (
          '<button class="projSwatch' +
          (s.bg === c && !s.bgImage ? " on" : "") +
          '" type="button" data-color="' +
          c +
          '" style="background:' +
          c +
          '" title="' +
          c +
          '"></button>'
        );
      }).join("");

    var imgs = el("projPresets");
    if (imgs)
      imgs.innerHTML = PRESETS.map(function (p) {
        return (
          '<button class="projPreset' +
          (s.bgImage === p.url ? " on" : "") +
          '" type="button" data-url="' +
          esc(p.url) +
          '"><img src="' +
          esc(p.url) +
          '" alt="' +
          esc(p.name) +
          '" /><span>' +
          esc(p.name) +
          "</span></button>"
        );
      }).join("");

    if (solids)
      solids.querySelectorAll("[data-color]").forEach(function (b) {
        b.onclick = function () {
          _set.bg = b.getAttribute("data-color");
          _set.bgImage = "";
          saveSettings();
          renderSettings();
          renderPreview();
        };
      });
    if (imgs)
      imgs.querySelectorAll("[data-url]").forEach(function (b) {
        b.onclick = function () {
          _set.bgImage = b.getAttribute("data-url");
          saveSettings();
          renderSettings();
          renderPreview();
        };
      });

    renderPreview();
  }

  function renderPreview() {
    var p = el("projPreview");
    if (!p) return;
    var s = settings();
    p.style.background = s.bgImage
      ? "#000 center/cover no-repeat url('" + s.bgImage + "')"
      : s.bg;
    var t = el("projPreviewText");
    if (!t) return;
    t.style.fontFamily =
      s.font === "JetBrains Mono"
        ? '"JetBrains Mono", monospace'
        : '"' + s.font + '", "Inter", sans-serif';
    t.style.fontSize = Math.max(14, Math.round(s.size * 0.45)) + "px";
    t.style.textAlign = s.align;
    t.style.textShadow =
      s.shadow === "none"
        ? "none"
        : s.shadow === "strong"
          ? "0 4px 18px rgba(0,0,0,.95)"
          : "0 2px 8px rgba(0,0,0,.7)";
    t.textContent = _active ? _active.title : "Contoh teks lirik";
  }

  /* ---------- sinkron ---------- */
  function watch() {
    if (_watching) return;
    var rp = ref(PLAN_REF),
      rs = ref(SET_REF);
    if (!rp && !rs) return;
    _watching = true;
    if (rp)
      rp.on("value", function (snap) {
        var v = snap && snap.val ? snap.val() : null;
        if (Array.isArray(v)) {
          _plan = v;
          renderPlan();
          renderCatalog();
        }
      });
    if (rs)
      rs.on("value", function (snap) {
        var v = snap && snap.val ? snap.val() : null;
        if (v && typeof v === "object") {
          _set = Object.assign({}, DEFAULTS, v);
          renderSettings();
        }
      });
  }

  /* ---------- buka / tutup ---------- */
  function open() {
    var pg = el("projPage");
    if (!pg) return;
    pg.classList.add("open");
    pg.setAttribute("aria-hidden", "false");
    document.body.classList.add("projOpen");
    loadLocalPlan();
    watch();
    renderPlan();
    renderCatalog();
    renderActive();
    renderSettings();
  }
  function close() {
    var pg = el("projPage");
    if (!pg) return;
    pg.classList.remove("open");
    pg.setAttribute("aria-hidden", "true");
    document.body.classList.remove("projOpen");
  }

  function init() {
    var ob = el("openProjBtn");
    if (ob)
      ob.onclick = function () {
        if (typeof window.closeMenu === "function") window.closeMenu();
        open();
      };
    var cb = el("closeProjBtn");
    if (cb) cb.onclick = close;

    // tab katalog
    document.querySelectorAll("#projTabs [data-tab]").forEach(function (b) {
      b.onclick = function () {
        _tab = b.getAttribute("data-tab");
        document.querySelectorAll("#projTabs [data-tab]").forEach(function (x) {
          x.classList.toggle("on", x === b);
        });
        renderCatalog();
      };
    });
    // filter
    document
      .querySelectorAll("#projFilters [data-filter]")
      .forEach(function (b) {
        b.onclick = function () {
          _filter = b.getAttribute("data-filter");
          document
            .querySelectorAll("#projFilters [data-filter]")
            .forEach(function (x) {
              x.classList.toggle("on", x === b);
            });
          renderCatalog();
        };
      });
    var q = el("projSearch");
    if (q)
      q.oninput = function () {
        _q = q.value || "";
        renderCatalog();
      };

    // rencana
    var nb = el("projNewPlan");
    if (nb)
      nb.onclick = function () {
        if (_plan.length && !confirm("Kosongkan rencana ibadah?")) return;
        _plan = [];
        _active = null;
        savePlan();
        renderPlan();
        renderActive();
      };
    var sb = el("projSavePlan");
    if (sb)
      sb.onclick = function () {
        savePlan();
        notify("Rencana disimpan.");
      };

    // aksi layar
    var lv = el("projGoLive");
    if (lv) lv.onclick = goLive;
    var cl = el("projClear");
    if (cl) cl.onclick = clearScreen;

    // pengaturan teks
    var f = el("projFont");
    if (f)
      f.onchange = function () {
        _set.font = f.value;
        saveSettings();
        renderPreview();
      };
    var sz = el("projSize");
    if (sz)
      sz.oninput = function () {
        _set.size = parseInt(sz.value, 10) || 40;
        var v = el("projSizeVal");
        if (v) v.textContent = _set.size + "px";
        saveSettings();
        renderPreview();
      };
    var sh = el("projShadow");
    if (sh)
      sh.onchange = function () {
        _set.shadow = sh.value;
        saveSettings();
        renderPreview();
      };
    document.querySelectorAll("#projAlign [data-align]").forEach(function (b) {
      b.onclick = function () {
        _set.align = b.getAttribute("data-align");
        saveSettings();
        renderSettings();
      };
    });

    loadLocalPlan();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

  window.PNWProjector = { open: open, close: close, init: init };
})();
