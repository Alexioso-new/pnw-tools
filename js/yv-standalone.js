/* PNW-FILE-GUIDE
   js/yv-standalone.js — mesin CastFlow MANDIRI (v6.4).
   Dipakai HANYA oleh youthviews.html. TIDAK memuat js/app.js.

   Prinsip:
   1. Hanya mengambil DATA LAGU (pujianYouth/songs + songBank, fallback
      localStorage). Tidak menyentuh jadwal, izin, rekaman, dsb.
   2. Siaran keluar lewat kanal SENDIRI: pujianYouth/youthviews/live.
      Kanal lama pujianYouth/live dipakai fitur Spectate aplikasi utama,
      jadi output CastFlow TIDAK PERNAH lagi memicu mode spectate.
   3. Menyediakan window.PNWYouthViews dengan bentuk yang sama seperti di
      js/app.js supaya js/projector.js jalan tanpa perubahan.
 */
(function () {
  "use strict";

  var VERSION = "v7.6-standalone";
  var YV_LIVE_PATH = "pujianYouth/youthviews/live";
  var SONGS_PATH = "pujianYouth/songs";
  var BANK_PATH = "pujianYouth/songBank";
  var ADMINS_PATH = "pujianYouth/admins";
  var LOCAL_SONGS = "pujianYouthChordSongs.v3";
  var LOCAL_BANK = "pujianYouthSongBank.v1";
  var OWNER_UID = "l9U1ktYog2X3vSA81JdsjHln5qu1";

  var firebaseConfig = {
    apiKey: "AIzaSyAj9FTRA3y_ZJQ3si-VU6doIV7OttTOpeM",
    authDomain: "chord-youth-hosana.firebaseapp.com",
    databaseURL:
      "https://chord-youth-hosana-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chord-youth-hosana",
    storageBucket: "chord-youth-hosana.firebasestorage.app",
    messagingSenderId: "692806682904",
    appId: "1:692806682904:web:dc50c1c97ea5c72797f66d",
  };

  /* ---------------- diagnostik + isolasi error ---------------- */
  window.PNWDiag = window.PNWDiag || [];
  window.PNWSafe = window.PNWSafe || {
    run: function (name, fn) {
      try {
        return { ok: true, value: fn() };
      } catch (e) {
        window.PNWDiag.push({
          feature: name,
          error: String((e && e.message) || e),
          at: Date.now(),
        });
        if (window.console && console.warn)
          console.warn("[CastFlow] gagal:", name, e);
        return { ok: false, error: e };
      }
    },
  };
  function safe(name, fn, fallback) {
    try {
      return fn();
    } catch (e) {
      window.PNWDiag.push({
        feature: "yv." + name,
        error: String((e && e.message) || e),
        at: Date.now(),
      });
      return fallback;
    }
  }
  try {
    window.addEventListener("error", function (ev) {
      window.PNWDiag.push({
        feature: "window",
        error: String((ev && ev.message) || "error"),
        at: Date.now(),
      });
    });
  } catch (e) {}

  /* v83: toast mini mandiri. projector.js memanggil window.toast lewat
     notify(), tetapi fungsi itu aslinya milik js/app.js yang TIDAK dimuat
     di halaman ini -- akibatnya SEMUA umpan balik operator ("Tayang...",
     "Gagal...") hilang tanpa jejak. Sediakan versi sederhana. */
  if (typeof window.toast !== "function") {
    window.toast = function (msg, kind) {
      safe("toast", function () {
        var host = document.getElementById("yvToastHost");
        if (!host) {
          host = document.createElement("div");
          host.id = "yvToastHost";
          host.style.cssText =
            "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;";
          document.body.appendChild(host);
        }
        var t = document.createElement("div");
        t.textContent = msg;
        t.style.cssText =
          "background:" +
          (kind === "error"
            ? "#b3261e"
            : kind === "success"
              ? "#146c43"
              : "#1f2637") +
          ";color:#fff;padding:10px 16px;border-radius:10px;font:600 13px/1.35 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.45);max-width:82vw;text-align:center;";
        host.appendChild(t);
        setTimeout(function () {
          t.style.transition = "opacity .4s";
          t.style.opacity = "0";
        }, 2600);
        setTimeout(function () {
          if (t.parentNode) t.parentNode.removeChild(t);
        }, 3100);
      });
    };
  }

  var DISPLAY_MODE =
    /[?&]mode=(display|stage|youthviews|youth-views|views)/.test(
      location.search,
    );

  /* ---------------- keadaan ---------------- */
  var songs = [];
  var bankSongs = [];
  var isAdmin = false;
  var db = null;
  var liveRef = null;
  var _lastLive = null;
  var _dispSig = "";
  var _lastBg = "";
  var _yvMotion = null;
  var _cdTimer = null;

  /* ---------------- Firebase ---------------- */
  function initFirebase() {
    if (typeof firebase === "undefined") return false;
    try {
      if (!firebase.apps || !firebase.apps.length)
        firebase.initializeApp(firebaseConfig);
      db = firebase.database();
      liveRef = db.ref(YV_LIVE_PATH);
      return true;
    } catch (e) {
      window.PNWDiag.push({
        feature: "yv.firebase",
        error: String((e && e.message) || e),
        at: Date.now(),
      });
      return false;
    }
  }

  /* ---------------- DATA LAGU (satu-satunya data yang diambil) -------- */
  function readLocal(key) {
    try {
      var raw = localStorage.getItem(key);
      var v = raw ? JSON.parse(raw) : null;
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }
  function normalizeSongs(v) {
    if (Array.isArray(v)) return v.filter(Boolean);
    if (v && typeof v === "object")
      return Object.keys(v)
        .map(function (k) {
          return v[k];
        })
        .filter(Boolean);
    return [];
  }
  function setSongs(list, from) {
    songs = normalizeSongs(list);
    status("Lagu termuat: " + songs.length + " (" + from + ")");
    try {
      if (window.PNWProjector && window.PNWProjector.__refreshCatalog)
        window.PNWProjector.__refreshCatalog();
    } catch (e) {}
    document.dispatchEvent(new CustomEvent("yv:songs", { detail: songs.length }));
  }
  function loadSongs() {
    var local = readLocal(LOCAL_SONGS);
    if (local.length) setSongs(local, "perangkat ini");
    bankSongs = readLocal(LOCAL_BANK);
    if (!db) return;
    safe("watchSongs", function () {
      db.ref(SONGS_PATH).on(
        "value",
        function (s) {
          var v = normalizeSongs(s.val());
          if (v.length) setSongs(v, "cloud");
        },
        function () {
          status("Cloud tidak terbaca — memakai data perangkat ini.");
        },
      );
      db.ref(BANK_PATH).on(
        "value",
        function (s) {
          var v = normalizeSongs(s.val());
          if (v.length) bankSongs = v;
        },
        function () {},
      );
    });
  }

  /* ---------------- hak siar ---------------- */
  function watchAuth() {
    if (typeof firebase === "undefined" || !firebase.auth) return;
    safe("auth", function () {
      firebase.auth().onAuthStateChanged(function (u) {
        if (!u) {
          isAdmin = false;
          paintAuth(null);
          return;
        }
        if (u.uid === OWNER_UID) {
          isAdmin = true;
          paintAuth(u);
          return;
        }
        db.ref(ADMINS_PATH + "/" + u.uid)
          .once("value")
          .then(function (s) {
            isAdmin = !!s.val();
            paintAuth(u);
          })
          .catch(function () {
            isAdmin = false;
            paintAuth(u);
          });
      });
    });
  }
  function paintAuth(u) {
    var el = document.getElementById("yvWho");
    if (el)
      el.textContent = !u
        ? "Belum masuk — hanya bisa melihat"
        : (u.displayName || u.email || "Pengguna") +
          (isAdmin ? " · boleh siaran" : " · belum admin");
    var b = document.getElementById("yvLoginBtn");
    if (b) b.textContent = u ? "Keluar" : "Masuk dengan Google";
    /* v85: konteks identitas untuk entri log cloud. */
    try {
      if (window.PNWLog && window.PNWLog.setContext)
        window.PNWLog.setContext({ uid: u ? u.uid : null, isAdmin: !!isAdmin });
    } catch (e) {}
  }
  function toggleLogin() {
    if (typeof firebase === "undefined" || !firebase.auth) return;
    var cur = firebase.auth().currentUser;
    if (cur) {
      firebase.auth().signOut();
      return;
    }
    safe("login", function () {
      var p = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(p);
    });
  }

  /* ---------------- pembuat slide (lirik saja, tanpa chord) ---------- */
  var sectionWords =
    /^(Intro|Bait|Verse|Reff|Refrain|Chorus|Pre-?Chorus|Post-?Chorus|Breakdown|Modulation|Overtune|Key ?Change|Bridge|Musik|Instrumen(tal)?|Interlude|Transition|Transisi|Solo|Ending|Outro|Outtro|Coda)(\s|:|$)/i;
  var CHORD_RE =
    /^[A-G](#|b)?(maj|min|m|M|sus|add|dim|aug|\+|°)?\d*(sus\d)?(\/[A-G](#|b)?)?$/;

  function stripChords(line) {
    return String(line || "")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function isChordLine(line) {
    var t = String(line || "").trim();
    if (!t) return false;
    if (sectionWords.test(t)) return false;
    var toks = t
      .replace(/\[[^\]]*\]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    if (!toks.length) return true;
    for (var i = 0; i < toks.length; i++) {
      if (!CHORD_RE.test(toks[i].replace(/[|,.]/g, ""))) return false;
    }
    return true;
  }
  /* v87: label bagian dibatasi 5 kanonik (permintaan pemilik).
     Pengenalan baris TIDAK berubah; hanya NAMA label dipetakan. */
  var SECTION_CANON = [
    [/^(pre-?chorus)\b/i, "Pre-Chorus"],
    [/^(reff|refrain|chorus)\b/i, "Chorus"],
    [/^(bait|verse)\b/i, "Verse"],
    [/^(coda|ending|outro|outtro)\b/i, "Coda"],
    [/^(intro|interlude|bridge|musik|instrumen(tal)?|solo|transition|transisi|breakdown|modulation|overtune|key ?change)\b/i, "Interlude"],
  ];
  function canonSection(label) {
    var t = String(label || "").trim();
    for (var i = 0; i < SECTION_CANON.length; i++)
      if (SECTION_CANON[i][0].test(t)) return SECTION_CANON[i][1];
    return t;
  }
  function sectionLabel(line) {
    return canonSection(
      stripChords(line)
        .replace(/[:\-—]+$/, "")
        .replace(/\s*\+\s*\d+\s*$/, "")
        .trim()
    );
  }
  function buildSlides(song, maxLines) {
    var max = Math.max(1, parseInt(maxLines, 10) || 4);
    var out = [];
    var label = "";
    var buf = [];
    function flush() {
      if (buf.length) {
        out.push({ label: label, lines: buf.slice() });
        buf = [];
      }
    }
    ((song && song.lines) || []).forEach(function (raw) {
      var t = String(raw == null ? "" : raw);
      if (sectionWords.test(t.trim())) {
        flush();
        label = sectionLabel(t);
        return;
      }
      if (isChordLine(t)) return;
      var lyric = stripChords(t);
      if (!lyric) {
        flush();
        return;
      }
      buf.push(lyric);
      if (buf.length >= max) flush();
    });
    flush();
    if (!out.length)
      out.push({ label: "", lines: [(song && song.title) || ""] });
    return out;
  }

  /* ---------------- font ---------------- */
  var _fonts = {};
  function ensureFont(name) {
    var f = String(name || "").trim();
    if (!f || _fonts[f] || f === "Inter" || f === "JetBrains Mono") return;
    _fonts[f] = true;
    safe("font", function () {
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href =
        "https://fonts.googleapis.com/css2?family=" +
        f.replace(/ /g, "+") +
        ":wght@400;600;700;800&display=swap";
      document.head.appendChild(l);
    });
  }

  /* ---------------- lapisan animasi ---------------- */
  function motionEngine() {
    return window.PNWYVMotion || window.PNWMotion || null;
  }
  function motionInst() {
    var cv = document.getElementById("dispMotion");
    var eng = motionEngine();
    if (!cv || !eng || !eng.create) return null;
    if (!_yvMotion) _yvMotion = eng.create(cv);
    return _yvMotion;
  }
  function cue(label, strength) {
    if (!_yvMotion) return;
    safe("cue", function () {
      if (label != null && _yvMotion.setMood) _yvMotion.setMood(label);
      if (_yvMotion.pulse)
        _yvMotion.pulse(typeof strength === "number" ? strength : 1);
    });
  }
  function stopMotion() {
    if (_yvMotion) safe("stopMotion", function () { _yvMotion.stop(); });
    var cv = document.getElementById("dispMotion");
    if (cv) cv.classList.remove("on");
  }

  /* ---------------- output ---------------- */
  function applyViewStyle(style) {
    var screen = document.getElementById("displayScreen");
    if (!screen) return;
    var st = style || {};
    screen.style.setProperty(
      "--yv-font",
      st.font ? '"' + st.font + '"' : "Inter",
    );
    screen.style.setProperty("--yv-size", (parseInt(st.size, 10) || 56) + "px");
    screen.style.setProperty("--yv-align", st.align || "center");
    screen.classList.remove("yvShadowNone", "yvShadowSoft", "yvShadowStrong");
    screen.classList.add(
      st.shadow === "none"
        ? "yvShadowNone"
        : st.shadow === "soft"
          ? "yvShadowSoft"
          : "yvShadowStrong",
    );
    if (st.font) ensureFont(st.font);
    // v84: gaya per-clip dari timeline (warna teks + posisi vertikal).
    screen.style.setProperty("--yv-color", st.color || "#f4f8ff");
    screen.classList.toggle("yvPosTop", st.pos === "top");
    screen.classList.toggle("yvPosBottom", st.pos === "bottom");
  }
  function bgFromLive(v, song) {
    if (v && v.bg && typeof v.bg === "object" && v.bg.kind) return v.bg;
    if (v && typeof v.bg === "string" && v.bg)
      return { kind: "image", value: v.bg };
    if (v && v.bgPreset) return { kind: "motion", value: v.bgPreset };
    if (song && song.bg) return { kind: "image", value: song.bg };
    return null;
  }
  function applyBackground(bg) {
    var layer = document.getElementById("dispBg");
    var vid = document.getElementById("dispVideo");
    if (!layer) return;
    var b = bg && bg.kind ? bg : null;
    var sig = b
      ? b.kind + "|" + b.value + "|" + (b.params ? JSON.stringify(b.params) : "")
      : "none";
    if (sig === _lastBg) return;
    _lastBg = sig;
    layer.className = "dispBg";
    layer.style.backgroundImage = "";
    layer.style.background = "";
    if (vid) {
      safe("vidReset", function () {
        vid.pause();
        vid.removeAttribute("src");
        vid.load();
      });
      vid.classList.remove("on");
    }
    if (!b || (b.kind !== "studio" && b.kind !== "motion")) stopMotion();
    if (!b) return;

    if (b.kind === "color") {
      layer.style.background = b.value || "#000";
      return;
    }
    if (b.kind === "image") {
      resolveSrc(b.value).then(function (url) {
        layer.style.backgroundImage = 'url("' + url + '")';
        layer.classList.add("on");
      });
      return;
    }
    if (b.kind === "video" || b.kind === "upload") {
      if (!vid) return;
      resolveSrc(b.value).then(function (url) {
        /* JANGAN taruh URL video di background-image (v5.7: bikin tab crash). */
        vid.src = url;
        vid.classList.add("on");
        safe("vidPlay", function () {
          var p = vid.play();
          if (p && p.catch) p.catch(function () {});
        });
      });
      return;
    }
    if (b.kind === "studio" || b.kind === "motion") {
      var mo = motionInst();
      var cv = document.getElementById("dispMotion");
      if (!mo || !cv) return;
      cv.classList.add("on");
      safe("motionApply", function () {
        var eng = motionEngine();
        var params =
          b.params ||
          (eng && eng.preset ? eng.preset(b.value || "aurora") : null);
        if (params && mo.apply) mo.apply(params);
        if (mo.resize) mo.resize();
        if (mo.start) mo.start();
      });
      return;
    }
  }
  function resolveSrc(v) {
    var s = String(v || "");
    if (window.PNWMedia && window.PNWMedia.resolve && s.indexOf("idb:") === 0)
      return window.PNWMedia.resolve(s);
    return Promise.resolve(s);
  }

  /* v84: countdown besar di layar output (dari clip countdown timeline).
     Output menghitung mundur SENDIRI dari endsAt -- kontrol tidak perlu
     menyiarkan tiap detik. */
  function paintCountdown(container, endsAt) {
    if (!container) return;
    container.innerHTML = "";
    var d = document.createElement("div");
    d.className = "dispCountdown";
    d.textContent = "--:--";
    container.appendChild(d);
    function tickCd() {
      var remain = Math.max(0, Math.round(((endsAt || Date.now()) - Date.now()) / 1000));
      var m = Math.floor(remain / 60);
      var s = remain % 60;
      d.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
      if (remain <= 0 && _cdTimer) {
        clearInterval(_cdTimer);
        _cdTimer = null;
      }
    }
    tickCd();
    _cdTimer = setInterval(tickCd, 250);
  }

  function paintLines(container, lines, trans) {
    if (!container) return;
    container.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className =
      "dispTextBlock" + (trans && trans !== "cut" ? " tlAnim tlAnim-" + trans : "");
    (lines || []).forEach(function (line) {
      var d = document.createElement("div");
      d.className = "dispTextLine";
      d.textContent = line;
      wrap.appendChild(d);
    });
    container.appendChild(wrap);
    if (window.PNWMotion && window.PNWMotion.revealLines)
      safe("reveal", function () {
        window.PNWMotion.revealLines(container);
      });
  }

  function _renderMain(v) {
    return safe("output", function () {
      var screen = document.getElementById("displayScreen");
      if (!screen) return;
      var idle = document.getElementById("dispIdle");
      var stage = document.getElementById("dispStage");
      var titleEl = document.getElementById("dispTitle");
      var keyEl = document.getElementById("dispKey");
      var body = document.getElementById("dispContent");
      var wait = document.getElementById("dispWait");

      if (v && v.active) applyViewStyle(v.style || {});

      if (!v || !v.active) {
        _dispSig = "";
        applyBackground(null);
        applyViewStyle({});
        // v81: buang class + konten basi. Tanpa ini slide lama tetap menutupi
        // layar karena .yvSlideMode .dispStage{position:absolute;inset:0}.
        screen.classList.remove("yvSlideMode");
        screen.classList.remove("dispTextMode");
        screen.classList.remove("hideChords");
        if (body) body.innerHTML = "";
        if (titleEl) titleEl.textContent = "";
        if (keyEl) keyEl.textContent = "";
        if (stage) stage.hidden = true;
        if (idle) idle.hidden = false;
        if (wait) wait.textContent = "Menunggu live dimulai\u2026";
        return;
      }

      if (idle) idle.hidden = true;
      if (stage) stage.hidden = false;
      screen.classList.add("hideChords");

      // v84: clip kosong antar-clip -> hanya latar yang tampil.
      if (v.kind === "blank") {
        applyBackground(bgFromLive(v, null));
        screen.classList.remove("dispTextMode");
        screen.classList.add("yvSlideMode");
        if ("blank" !== _dispSig) {
          _dispSig = "blank";
          if (titleEl) titleEl.textContent = "";
          if (keyEl) keyEl.textContent = "";
          if (body) body.innerHTML = "";
        }
        return;
      }
      // v84: clip countdown -> angka besar menghitung mundur.
      if (v.kind === "countdown") {
        applyBackground(bgFromLive(v, null));
        screen.classList.remove("dispTextMode");
        screen.classList.add("yvSlideMode");
        var cSig =
          "cd|" +
          (v.title || "") +
          "|" +
          String(v.endsAt || 0) +
          "|" +
          JSON.stringify(v.style || {});
        // repaint juga bila timer mati (mis. event nilai berulang dari
        // reconnect) supaya angka tidak membeku.
        if (cSig !== _dispSig || !_cdTimer) {
          _dispSig = cSig;
          if (titleEl) titleEl.textContent = v.title || "";
          if (keyEl) keyEl.textContent = "";
          paintCountdown(body, v.endsAt || Date.now());
        }
        return;
      }
      if (v.kind === "text" || v.kind === "verse") {
        applyBackground(bgFromLive(v, null));
        screen.classList.remove("yvSlideMode");
        screen.classList.add("dispTextMode");
        var sigT = v.kind + "|" + (v.ref || "") + "|" + (v.text || "");
        if (sigT === _dispSig) return;
        _dispSig = sigT;
        if (titleEl) titleEl.textContent = "";
        if (keyEl) keyEl.textContent = v.kind === "verse" ? v.ref || "" : "";
        paintLines(body, String(v.text || "").replace(/\r/g, "").split("\n"), v.transition);
        cue(v.kind, 1);
        return;
      }

      screen.classList.remove("dispTextMode");
      // v81: PAYLOAD MANDIRI -> render langsung dari lirik di siaran, tanpa
      // perlu daftar lagu (perangkat output tidak wajib login).
      if (v.lines && v.lines.length) {
        applyBackground(bgFromLive(v, null));
        var pIdx = Math.max(0, parseInt(v.slideIndex, 10) || 0);
        var pSig = "mandiri|" + (v.songId || "") + "|" + pIdx + "|" + v.lines.join("\n") + "|" + JSON.stringify(v.style || {});
        if (pSig === _dispSig) return;
        _dispSig = pSig;
        screen.classList.add("yvSlideMode");
        if (titleEl) titleEl.textContent = v.showTitle === false ? "" : v.songTitle || "";
        if (keyEl)
          keyEl.textContent =
            v.showMeta === false
              ? ""
              : "Slide " + (pIdx + 1) + " / " + (v.slideTotal || pIdx + 1) + (v.label ? " \u00b7 " + v.label : "");
        paintLines(body, v.lines, v.transition);
        cue(v.label || "", 1);
        return;
      }
      var song = getSong(v.songId);
      if (!song) {
        _dispSig = "";
        applyBackground(null);
        screen.classList.remove("yvSlideMode");
        if (body) body.innerHTML = "";
        if (titleEl) titleEl.textContent = "";
        if (keyEl) keyEl.textContent = "";
        if (idle) idle.hidden = false;
        if (stage) stage.hidden = true;
        if (wait)
          wait.textContent = v.songTitle
            ? "Memuat: " + v.songTitle
            : "Memuat lagu\u2026";
        return;
      }
      applyBackground(bgFromLive(v, song));
      var deck = buildSlides(song, v.slideMax || 4);
      var idx = Math.max(
        0,
        Math.min(deck.length - 1, parseInt(v.slideIndex, 10) || 0),
      );
      var slide = deck[idx] || deck[0];
      var sig =
        song.id + "|s" + idx + "/" + deck.length + "|" + JSON.stringify(v.style || {});
      if (sig === _dispSig) return;
      _dispSig = sig;
      screen.classList.add("yvSlideMode");
      if (titleEl)
        titleEl.textContent = v.showTitle === false ? "" : song.title || "";
      if (keyEl)
        keyEl.textContent =
          v.showMeta === false
            ? ""
            : "Slide " +
              (idx + 1) +
              " / " +
              deck.length +
              (slide.label ? " · " + slide.label : "");
      paintLines(body, slide.lines, v.transition);
      cue(slide.label || "", 1);
    });
  }

  /* v84: lapisan overlay (logo / lower-third) dirender TERPISAH dari konten
     supaya ganti slide tidak mengedipkan overlay. */
  var _lastOv = "__none__";
  function renderOverlay(v) {
    safe("overlay", function () {
      var host = document.getElementById("dispOverlay");
      if (!host) return;
      var ov = v && v.active && v.overlay && v.overlay.kind ? v.overlay : null;
      var sig = ov ? JSON.stringify(ov) : "";
      if (sig === _lastOv) return;
      _lastOv = sig;
      host.innerHTML = "";
      if (!ov) {
        host.classList.remove("on");
        return;
      }
      host.classList.add("on");
      if (ov.kind === "logo") {
        var box = document.createElement("div");
        box.className = "dispOvLogo";
        var img = document.createElement("img");
        img.src = "./icon-192.png";
        img.alt = "";
        box.appendChild(img);
        host.appendChild(box);
      } else if (ov.kind === "third") {
        var b = document.createElement("div");
        b.className = "dispThird";
        var t1 = document.createElement("b");
        t1.textContent = ov.text || "";
        var t2 = document.createElement("span");
        t2.textContent = ov.sub || "";
        b.appendChild(t1);
        if (ov.sub) b.appendChild(t2);
        host.appendChild(b);
      }
    });
  }
  function renderDisplay(v) {
    if (_cdTimer) {
      clearInterval(_cdTimer);
      _cdTimer = null;
    }
    _renderMain(v);
    renderOverlay(v);
  }

  function dispStatus(online) {
    var d = document.getElementById("dispDot");
    if (!d) return;
    d.className = "dispDot " + (online ? "on" : "off");
    d.title = online ? "Terhubung" : "Terputus";
  }

  /* ---------------- API untuk js/projector.js ---------------- */
  function getSong(id) {
    return (
      songs.find(function (s) {
        return s && String(s.id) === String(id);
      }) || null
    );
  }
  window.PNWYouthViews = {
    version: VERSION,
    standalone: true,
    getSongs: function () {
      return songs;
    },
    getSong: getSong,
    buildSlides: buildSlides,
    stripChords: stripChords,
    isAdmin: function () {
      return !!isAdmin;
    },
    canBroadcast: function () {
      return !!(isAdmin && liveRef);
    },
    broadcast: function (payload) {
      if (!isAdmin || !liveRef) return false;
      return (
        safe(
          "broadcast",
          function () {
            var p = Object.assign({ t: Date.now(), src: "youthviews" }, payload || {});
            // v81: sertakan lirik jadi supaya output tidak wajib login.
            if (p.active && p.songId && !p.lines) {
              var sg = getSong(p.songId);
              if (sg) {
                var dk = buildSlides(sg, p.slideMax || 4);
                var ix = Math.max(0, Math.min(dk.length - 1, parseInt(p.slideIndex, 10) || 0));
                var sl = dk[ix] || dk[0] || { lines: [], label: "" };
                p.lines = (sl.lines || []).slice(0, 24);
                p.label = sl.label || "";
                p.slideTotal = dk.length;
                if (!p.songTitle) p.songTitle = sg.title || "";
              }
            }
            var w = liveRef.set(p);
            if (w && w.catch)
              w.catch(function (err) {
                // v83: tulisan ditolak server -> beri tahu operator. Dulu
                // toast "Tayang" tampil padahal siaran tak pernah keluar.
                var code = String((err && err.code) || err || "error");
                window.PNWDiag.push({
                  feature: "yv.broadcast",
                  error: code,
                  at: Date.now(),
                });
                status(
                  "Siaran DITOLAK server (" +
                    code +
                    ") - publish rules v83 / cek login admin.",
                );
                try {
                  document.dispatchEvent(
                    new CustomEvent("yv:sendError", { detail: code }),
                  );
                } catch (e) {}
              });
            return true;
          },
          false,
        ) || false
      );
    },
    clear: function () {
      if (!isAdmin || !liveRef) return false;
      return (
        safe(
          "clear",
          function () {
            var w = liveRef.set({
              active: false,
              src: "youthviews",
              t: Date.now(),
            });
            if (w && w.catch)
              w.catch(function (err) {
                var code = String((err && err.code) || err || "error");
                window.PNWDiag.push({
                  feature: "yv.clear",
                  error: code,
                  at: Date.now(),
                });
                status("Perintah bersihkan layar DITOLAK (" + code + ").");
                try {
                  document.dispatchEvent(
                    new CustomEvent("yv:sendError", { detail: code }),
                  );
                } catch (e) {}
              });
            return true;
          },
          false,
        ) || false
      );
    },
    selectedKey: function () {
      return "";
    },
    ensureFont: ensureFont,
    motion: function () {
      return _yvMotion;
    },
    cue: cue,
    diagnostics: function () {
      return window.PNWDiag.slice(-50);
    },
    _renderForQA: function (v) {
      return renderDisplay(v);
    },
  };

  /* ---------------- status bar ---------------- */
  function status(msg) {
    /* v87: CastFlow dwibahasa — status diterjemahkan bila perlu. */
    try {
      if (window.CFt) msg = window.CFt(msg);
    } catch (e) {}
    var el = document.getElementById("yvStatus");
    if (el) el.textContent = msg;
  }

  /* ---------------- boot ---------------- */
  function bootDisplay() {
    document.body.classList.add("display-mode");
    var screen = document.getElementById("displayScreen");
    if (screen) screen.hidden = false;
    var bar = document.getElementById("yvBar");
    if (bar) bar.hidden = true;
    var pg = document.getElementById("projPage");
    if (pg) pg.remove();
    safe("wakeLock", function () {
      if (navigator.wakeLock && navigator.wakeLock.request)
        navigator.wakeLock.request("screen").catch(function () {});
    });
    if (!liveRef) {
      status("Firebase tidak tersedia.");
      return;
    }
    liveRef.on(
      "value",
      function (s) {
        _lastLive = s.val();
        dispStatus(true);
        renderDisplay(_lastLive);
      },
      function (err) {
        // v83: JANGAN diam saja saat baca ditolak (rules lama / belum
        // dipublish). Dulu output hang selamanya di "Menunggu live...".
        dispStatus(false);
        var wait = document.getElementById("dispWait");
        if (wait)
          wait.textContent =
            "Siaran tidak bisa dibaca (" +
            String((err && err.code) || err || "error") +
            "). Operator: publish rules Firebase v83 (kanal live boleh dibaca tanpa login).";
        window.PNWDiag.push({
          feature: "yv.liveRead",
          error: String((err && err.code) || err),
          at: Date.now(),
        });
        /* v85: catat ke Log Error supaya pengurus bisa melapor lengkap. */
        try {
          if (window.PNWLog && window.PNWLog.event)
            window.PNWLog.event("yv:liveRead", {
              lvl: "error",
              message:
                "Kanal live ditolak (" +
                String((err && err.code) || err) +
                ") — rules Firebase v83 belum dipublish?",
            });
        } catch (e) {}
      },
    );
    safe("conn", function () {
      db.ref(".info/connected").on("value", function (s) {
        dispStatus(!!s.val());
      });
    });
  }

  function bootControl() {
    loadSongs();
    watchAuth();
    var lb = document.getElementById("yvLoginBtn");
    if (lb) lb.onclick = toggleLogin;
    var ob = document.getElementById("yvOutputBtn");
    if (ob)
      ob.onclick = function () {
        window.open("./castflow.html?mode=display", "yvOutput");
      };
    var cb = document.getElementById("closeProjBtn");
    if (cb)
      cb.onclick = function () {
        location.href = "./index.html";
      };
    /* Panel CastFlow selalu terbuka di halaman ini. */
    setTimeout(function () {
      safe("openPanel", function () {
        if (window.PNWProjector && window.PNWProjector.open)
          window.PNWProjector.open();
      });
    }, 60);
  }

  function boot() {
    /* v85: aktifkan Log Error sedini mungkin. PNWLog.ready tetap dipanggil
       walau Firebase TIDAK termuat (offline) — log tersimpan lokal. */
    safe("pnwlog", function () {
      if (window.PNWLog && window.PNWLog.ready)
        window.PNWLog.ready(
          typeof firebase !== "undefined" ? firebase : null,
          { version: VERSION, page: "youthviews" }
        );
    });
    initFirebase();
    if (DISPLAY_MODE) bootDisplay();
    else bootControl();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
