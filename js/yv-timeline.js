/* PNW-FILE-GUIDE
   js/yv-timeline.js — TIMELINE EDITOR youTh Views (v6.2 / v84).
   HANYA dipakai oleh youthviews.html (halaman kontrol). Editor multi-track
   ala editor video: track LATAR / MEDIA / LIRIK & TEKS / OVERLAY, clip yang
   bisa digeser/ditrim/di-split, transisi & gaya per clip, undo/redo, snap,
   zoom, countdown, overlay logo & lower-third, multi-proyek (cloud + lokal).
   Pemutaran: OPERATOR menekan Play -> jam master berjalan -> payload live
   dikirim lewat engine().broadcast() (kanal pujianYouth/youthviews/live),
   jadi jendela output cukup "bodoh" seperti biasa.
   Bergantung pada: window.PNWYouthViews (yv-standalone.js) dan
   window.PNWProjector.__tl (hook di projector.js). Tidak mengubah keduanya
   secara internal; hanya memakai API publiknya.
 */
(function () {
  "use strict";

  var VERSION = "v6.2-timeline";
  var TL_REF = "pujianYouth/projector/timelines";
  var LOCAL_TL = "pnwYvTimelines.v1";

  var TRACKS = [
    { id: "bg", name: "LATAR", desc: "warna / animasi / gambar" },
    { id: "media", name: "MEDIA", desc: "gambar & video layar penuh" },
    { id: "lyrics", name: "LIRIK & TEKS", desc: "lagu · teks · ayat · countdown", tall: true },
    { id: "overlay", name: "OVERLAY", desc: "logo & lower-third" },
  ];
  var TRANS = [
    { id: "cut", name: "Cut" },
    { id: "fade", name: "Fade" },
    { id: "zoom", name: "Zoom" },
    { id: "slide", name: "Slide" },
  ];

  /* ---------------- state ---------------- */
  var _proj = null;
  var _projects = {};
  var _open = false;
  var _sel = null; // { track, id }
  var _undo = [];
  var _redo = [];
  var _pps = 12; // px per detik (zoom)
  var _snap = true;
  var _play = { on: false, t0: 0, off: 0 };
  var _playhead = 0; // detik saat pause
  var _lastSig = "__none__";
  var _iv = null;
  var _paint = null;

  /* ---------------- util ---------------- */
  function el(id) {
    return document.getElementById(id);
  }
  function q(s, r) {
    return (r || document).querySelector(s);
  }
  function qa(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  }
  function uid(p) {
    return (p || "c") + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }
  function safe(name, fn, fallback) {
    try {
      return fn();
    } catch (e) {
      var log = (window.PNWDiag = window.PNWDiag || []);
      log.push({ feature: "yv.timeline." + name, error: String((e && e.message) || e), at: Date.now() });
      if (window.console && console.warn) console.warn("[timeline] gagal:", name, e);
      return fallback;
    }
  }
  function toast(m, k) {
    if (typeof window.toast === "function") window.toast(m, k || "info");
  }
  function engine() {
    return window.PNWYouthViews || null;
  }
  function P() {
    return (window.PNWProjector && window.PNWProjector.__tl) || null;
  }
  function fmt(t) {
    t = Math.max(0, t || 0);
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function fmtD(t) {
    return fmt(t) + "." + Math.floor(((t || 0) % 1) * 10);
  }

  /* ---------------- model ---------------- */
  function newProject(name) {
    return {
      id: uid("tl"),
      name: name || "Timeline baru",
      updatedAt: Date.now(),
      settings: { defDur: 8, defTrans: "fade" },
      tracks: { bg: [], media: [], lyrics: [], overlay: [] },
    };
  }
  function proj() {
    if (!_proj) {
      var list = listProjects();
      _proj = list.length ? clone(list[0]) : newProject("Ibadah " + new Date().toLocaleDateString("id-ID"));
      normalize(_proj);
    }
    return _proj;
  }
  function normalize(p) {
    p.settings = Object.assign({ defDur: 8, defTrans: "fade" }, p.settings || {});
    TRACKS.forEach(function (t) {
      if (!Array.isArray(p.tracks[t.id])) p.tracks[t.id] = [];
      p.tracks[t.id].forEach(function (c) {
        c.start = Math.max(0, +c.start || 0);
        c.dur = Math.max(0.5, +c.dur || 0.5);
        if (!c.transition) c.transition = "fade";
      });
      sortTrack(p.tracks[t.id]);
    });
  }
  function sortTrack(arr) {
    arr.sort(function (a, b) {
      return a.start - b.start;
    });
  }
  function totalDur(p) {
    p = p || _proj;
    var m = 30;
    TRACKS.forEach(function (t) {
      ((p && p.tracks[t.id]) || []).forEach(function (c) {
        m = Math.max(m, c.start + c.dur);
      });
    });
    return m;
  }
  function findClip(track, id) {
    var arr = proj().tracks[track] || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function findClipAnywhere(id) {
    var found = null;
    TRACKS.forEach(function (t) {
      if (!found) found = findClip(t.id, id);
    });
    return found;
  }
  function trackOf(id) {
    var tr = null;
    TRACKS.forEach(function (t) {
      if (!tr && findClip(t.id, id)) tr = t.id;
    });
    return tr;
  }

  /* ---------------- riwayat (undo/redo) ---------------- */
  function hist() {
    _undo.push(JSON.stringify(_proj));
    if (_undo.length > 60) _undo.shift();
    _redo = [];
    paintHist();
  }
  function undo() {
    if (!_undo.length) return;
    _redo.push(JSON.stringify(_proj));
    _proj = JSON.parse(_undo.pop());
    _sel = null;
    renderAll();
    paintHist();
  }
  function redo() {
    if (!_redo.length) return;
    _undo.push(JSON.stringify(_proj));
    _proj = JSON.parse(_redo.pop());
    _sel = null;
    renderAll();
    paintHist();
  }
  function paintHist() {
    var u = el("tlUndo"),
      r = el("tlRedo");
    if (u) u.disabled = !_undo.length;
    if (r) r.disabled = !_redo.length;
  }

  /* ---------------- penyimpanan (lokal + cloud) ---------------- */
  function loadLocalAll() {
    try {
      _projects = JSON.parse(localStorage.getItem(LOCAL_TL) || "{}") || {};
    } catch (e) {
      _projects = {};
    }
  }
  function saveLocalAll() {
    safe("saveLocal", function () {
      localStorage.setItem(LOCAL_TL, JSON.stringify(_projects));
    });
  }
  function tlRef() {
    try {
      if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) return null;
      return firebase.database().ref(TL_REF);
    } catch (e) {
      return null;
    }
  }
  function listProjects() {
    loadLocalAll();
    return Object.keys(_projects)
      .map(function (k) {
        return _projects[k];
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
  }
  function saveProject(silent) {
    return safe("save", function () {
      _proj.updatedAt = Date.now();
      _projects[_proj.id] = clone(_proj);
      saveLocalAll();
      var r = tlRef();
      if (r) {
        var w = r.child(_proj.id).set(_proj);
        if (w && w.catch)
          w.catch(function (err) {
            toast("Timeline tersimpan lokal; cloud DITOLAK (" + String((err && err.code) || err) + ").", "error");
          });
      }
      paintProjects();
      if (!silent) toast("Proyek timeline disimpan.", "success");
      return true;
    });
  }
  function loadProject(id) {
    loadLocalAll();
    if (!_projects[id]) return false;
    _proj = clone(_projects[id]);
    normalize(_proj);
    _sel = null;
    _undo = [];
    _redo = [];
    _playhead = 0;
    renderAll();
    return true;
  }
  function deleteProject(id) {
    loadLocalAll();
    delete _projects[id];
    saveLocalAll();
    var r = tlRef();
    if (r) r.child(id).remove();
    if (_proj && _proj.id === id) {
      _proj = null;
      proj();
    }
    renderAll();
  }
  function watchCloud() {
    var r = tlRef();
    if (!r) return;
    safe("watchCloud", function () {
      r.on("value", function (s) {
        var v = s.val() || {};
        var changed = false;
        Object.keys(v).forEach(function (k) {
          var c = v[k];
          if (!c || !c.id) return;
          var l = _projects[k];
          if (!l || (c.updatedAt || 0) > (l.updatedAt || 0)) {
            _projects[k] = c;
            changed = true;
          }
        });
        if (changed) {
          saveLocalAll();
          paintProjects();
        }
      });
    });
  }

  /* ---------------- operasi clip ---------------- */
  function endOfTrack(track) {
    var m = 0;
    (proj().tracks[track] || []).forEach(function (c) {
      m = Math.max(m, c.start + c.dur);
    });
    return m;
  }
  function addClip(track, data, opts) {
    return safe("addClip", function () {
      opts = opts || {};
      if (!opts.skipHist) hist();
      var p = proj();
      var c = {
        id: uid(),
        start: opts.at != null ? Math.max(0, opts.at) : endOfTrack(track),
        dur: data.dur || p.settings.defDur || 8,
        transition: data.transition || p.settings.defTrans || "fade",
      };
      Object.assign(c, data);
      if (c.kind === "countdown") c.dur = Math.max(1, data.dur || 60);
      p.tracks[track].push(c);
      sortTrack(p.tracks[track]);
      saveProject(true);
      renderAll();
      return c;
    });
  }
  function removeClip(track, id) {
    hist();
    var p = proj();
    p.tracks[track] = p.tracks[track].filter(function (c) {
      return c.id !== id;
    });
    if (_sel && _sel.id === id) _sel = null;
    saveProject(true);
    renderAll();
  }
  function splitClip(track, id, at) {
    return safe("split", function () {
      var c = findClip(track, id);
      if (!c) return false;
      if (at <= c.start + 0.25 || at >= c.start + c.dur - 0.25) return false;
      hist();
      var right = clone(c);
      right.id = uid();
      right.start = at;
      right.dur = c.start + c.dur - at;
      c.dur = at - c.start;
      // lagu multi-slide: bagi array slides di titik potong
      if (c.kind === "song" && Array.isArray(c.slides) && c.slides.length > 1) {
        var frac = (at - c.start) / (c.dur + right.dur);
        var cut = Math.max(1, Math.min(c.slides.length - 1, Math.round(frac * c.slides.length)));
        right.slides = c.slides.slice(cut);
        c.slides = c.slides.slice(0, cut);
      }
      proj().tracks[track].push(right);
      sortTrack(proj().tracks[track]);
      saveProject(true);
      renderAll();
      return true;
    });
  }
  function clipLabel(c) {
    if (!c) return "";
    if (c.kind === "song") return "♪ " + (c.title || "Lagu");
    if (c.kind === "text") return "✎ " + String(c.text || "").split("\n")[0].slice(0, 34);
    if (c.kind === "verse") return "✝ " + (c.ref || "Ayat");
    if (c.kind === "countdown") return "⏱ " + (c.title || "Countdown");
    if (c.overlay) return c.overlay.kind === "logo" ? "Logo" : "Lower-third: " + (c.overlay.text || "");
    if (c.media) return (c.media.kind === "video" ? "Video: " : "Gambar: ") + String(c.media.value || "").split("/").pop().slice(0, 26);
    if (c.bg) {
      if (c.bg.kind === "color") return "Warna " + c.bg.value;
      if (c.bg.kind === "motion" || c.bg.kind === "studio") return "Animasi " + c.bg.value;
      return "Latar: " + String(c.bg.value || "").split("/").pop().slice(0, 26);
    }
    return "Clip";
  }

  /* ---------------- auto dari rundown ---------------- */
  function autoFromPlan() {
    return safe("autoFromPlan", function () {
      var api = P();
      if (!api) {
        toast("Modul rundown belum siap.", "info");
        return false;
      }
      var plan = api.plan() || [];
      if (!plan.length) {
        toast("Rundown masih kosong — isi dulu di panel kiri.", "info");
        return false;
      }
      hist();
      var p = proj();
      var defDur = p.settings.defDur || 8;
      var n = 0;
      var t = 0;
      plan.forEach(function (it) {
        if (!(it && (it.songId || it.kind === "Lagu"))) return;
        var song = api.songById(it.songId);
        if (!song) return;
        var slides = api.slidesOf(song);
        var t0 = t;
        slides.forEach(function (sl) {
          p.tracks.lyrics.push({
            id: uid(),
            start: t,
            dur: defDur,
            transition: p.settings.defTrans,
            kind: "song",
            songId: song.id,
            title: song.title || "Tanpa judul",
            label: sl.label || "",
            slides: [clone(sl)],
          });
          t += defDur;
          n++;
        });
        if (song.bg)
          p.tracks.bg.push({
            id: uid(),
            start: t0,
            dur: Math.max(defDur, slides.length * defDur),
            transition: "fade",
            bg: { kind: "image", value: song.bg },
          });
      });
      if (!n) {
        _undo.pop(); // batalkan hist kosong
        toast("Tidak ada lagu di rundown yang bisa dipetakan.", "info");
        return false;
      }
      TRACKS.forEach(function (tr) {
        sortTrack(p.tracks[tr.id]);
      });
      saveProject(true);
      renderAll();
      toast("Timeline dibuat dari rundown: " + n + " clip lirik.", "success");
      return true;
    });
  }


  /* ---------------- pemutaran: operator Play -> output ikut live ---------------- */
  function curT() {
    return _play.on ? _play.off + (performance.now() - _play.t0) / 1000 : _playhead;
  }
  function clipAt(track, t) {
    var arr = proj().tracks[track] || [];
    for (var i = 0; i < arr.length; i++) {
      var c = arr[i];
      if (t >= c.start && t < c.start + c.dur) return c;
    }
    return null;
  }
  function stateAt(t) {
    return {
      t: t,
      lyrics: clipAt("lyrics", t),
      bg: clipAt("bg", t),
      media: clipAt("media", t),
      overlay: clipAt("overlay", t),
    };
  }
  function mergedStyle(clipStyle) {
    var ses = (P() && P().settings()) || {};
    var base = {
      font: ses.font || "Montserrat",
      size: ses.size || 56,
      align: ses.align || "center",
      shadow: ses.shadow || "strong",
    };
    return Object.assign(base, clipStyle || {});
  }
  /* Bangun payload live pada detik t. Bentuknya SAMA dengan payload
     projector.js biasa + field baru: overlay, transition, kind "blank" dan
     "countdown" (keduanya dipahami output v6.2). _sig dipakai internal untuk
     mencegah kirim ulang yang identik. */
  function payloadAt(t) {
    var st = stateAt(t);
    var ses = (P() && P().settings()) || {};
    var bgC = st.media
      ? { kind: st.media.media.kind === "video" ? "video" : "image", value: st.media.media.value }
      : st.bg
        ? st.bg.bg
        : ses.bg || null;
    var ovC = st.overlay ? st.overlay.overlay : null;
    var bgSig = bgC ? bgC.kind + "|" + String(bgC.value || "") : "ses";
    var ovSig = ovC ? ovC.kind + "|" + (ovC.text || "") + "|" + (ovC.sub || "") : "";
    var lc = st.lyrics;
    var p = { active: true, showTitle: true, showMeta: true };
    if (bgC) p.bg = bgC;
    if (ovC) p.overlay = ovC;
    if (!lc) {
      p.kind = "blank";
      p.style = mergedStyle(null);
      p.transition = "fade";
      p._sig = "blank|" + bgSig + "|" + ovSig;
      return p;
    }
    p.style = mergedStyle(lc.style);
    p.transition = lc.transition || "cut";
    if (lc.kind === "song") {
      var slides = lc.slides || [];
      var n = Math.max(1, slides.length);
      var idx = Math.min(n - 1, Math.floor((t - lc.start) / (lc.dur / n)));
      var sl = slides[idx] || { label: "", lines: [] };
      p.kind = "song";
      p.songId = lc.songId;
      p.songTitle = lc.title || "";
      p.lines = (sl.lines || []).slice(0, 24);
      p.label = sl.label || lc.label || "";
      p.slideIndex = idx;
      p.slideTotal = n;
      p._sig = lc.id + "|" + idx + "|" + bgSig + "|" + ovSig;
    } else if (lc.kind === "text") {
      p.kind = "text";
      p.text = lc.text || "";
      p._sig = lc.id + "|" + bgSig + "|" + ovSig;
    } else if (lc.kind === "verse") {
      p.kind = "verse";
      p.text = lc.text || "";
      p.ref = lc.ref || "";
      p._sig = lc.id + "|" + bgSig + "|" + ovSig;
    } else if (lc.kind === "countdown") {
      var remain = Math.max(0, lc.start + lc.dur - t);
      p.kind = "countdown";
      p.title = lc.title || "";
      p.endsAt = Date.now() + Math.round(remain * 1000);
      // sig sengaja TIDAK memuat endsAt: output menghitung mundur sendiri.
      p._sig = lc.id + "|" + bgSig + "|" + ovSig;
    } else {
      return null;
    }
    return p;
  }
  function tick() {
    var t = curT();
    var p = payloadAt(t);
    var sig = p ? p._sig : "";
    if (sig !== _lastSig) {
      _lastSig = sig;
      var e = engine();
      if (e && p) {
        delete p._sig;
        e.broadcast(p);
      }
    }
    if (t >= totalDur()) {
      stopPlay();
      toast("Timeline selesai.", "success");
    }
    paintTime(t);
  }
  function play() {
    if (_play.on) {
      pause();
      return;
    }
    var e = engine();
    if (!e || !e.canBroadcast()) {
      toast("Login admin dulu supaya bisa menayangkan timeline.", "info");
      return;
    }
    if (_playhead >= totalDur()) _playhead = 0;
    _play.on = true;
    _play.t0 = performance.now();
    _play.off = _playhead;
    _lastSig = "__none__"; // paksa kirim ulang (mis. sambung countdown)
    _iv = setInterval(tick, 100);
    tick();
    paintTransport();
  }
  function pause() {
    if (!_play.on) return;
    _playhead = curT();
    _play.on = false;
    if (_iv) clearInterval(_iv);
    _iv = null;
    paintTransport();
  }
  function stopPlay() {
    var was = _play.on;
    pause();
    _playhead = 0;
    _lastSig = "__none__";
    var e = engine();
    if (was && e && e.clear) e.clear();
    paintTime(0);
    paintTransport();
  }


  /* ---------------- UI: drawer ---------------- */
  function escH(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function buildDrawer() {
    if (el("tlDrawer")) return;
    var host = el("projPage");
    if (!host) return;
    var d = document.createElement("div");
    d.className = "tlDrawer";
    d.id = "tlDrawer";
    d.innerHTML =
      '<div class="tlBar">' +
      '<div class="tlGroup">' +
      '<button class="tlBtn" id="tlHome" type="button" title="Ke awal">⏮</button>' +
      '<button class="tlBtn primary" id="tlPlay" type="button" title="Putar / jeda (Spasi)">▶</button>' +
      '<button class="tlBtn" id="tlStop" type="button" title="Stop & bersihkan layar">⏹</button>' +
      '<span class="tlTime" id="tlTime">0:00.0</span>' +
      '<span class="tlLive" id="tlLive">LIVE</span>' +
      "</div>" +
      '<div class="tlGroup">' +
      '<button class="tlBtn" id="tlAuto" type="button" title="Susun otomatis dari rundown">⚡ Rundown</button>' +
      '<button class="tlBtn" id="tlAddSong" type="button">+ Lagu</button>' +
      '<button class="tlBtn" id="tlAddText" type="button">+ Teks</button>' +
      '<button class="tlBtn" id="tlAddVerse" type="button">+ Ayat</button>' +
      '<button class="tlBtn" id="tlAddCd" type="button">+ Countdown</button>' +
      '<button class="tlBtn" id="tlAddBg" type="button">+ Latar</button>' +
      '<button class="tlBtn" id="tlAddMedia" type="button">+ Media</button>' +
      '<button class="tlBtn" id="tlAddOv" type="button">+ Overlay</button>' +
      "</div>" +
      '<div class="tlGroup">' +
      '<button class="tlBtn" id="tlSplit" type="button" title="Belah clip terpilih di playhead (S)">Split</button>' +
      '<button class="tlBtn danger" id="tlDel" type="button" title="Hapus clip terpilih (Del)">Hapus</button>' +
      '<button class="tlBtn" id="tlUndo" type="button" title="Urungkan (Ctrl+Z)">↺</button>' +
      '<button class="tlBtn" id="tlRedo" type="button" title="Ulangi (Ctrl+Shift+Z)">↻</button>' +
      "</div>" +
      '<div class="tlGroup">' +
      '<button class="tlBtn on" id="tlSnap" type="button" title="Snap ke detik & tepi clip">Snap</button>' +
      '<span class="tlZoom"><input type="range" id="tlZoom" min="3" max="60" step="1" value="12" title="Zoom timeline" /></span>' +
      "</div>" +
      '<div class="tlGroup">' +
      '<select id="tlProjects" title="Proyek timeline"></select>' +
      '<button class="tlBtn" id="tlSave" type="button">Simpan</button>' +
      '<button class="tlBtn" id="tlNew" type="button">Baru</button>' +
      '<button class="tlBtn danger" id="tlDelProj" type="button" title="Hapus proyek aktif">Hapus</button>' +
      "</div>" +
      '<div class="tlGroup">' +
      '<span class="tlSelInfo" id="tlSelInfo"></span>' +
      '<button class="tlBtn" id="tlEdit" type="button" title="Edit clip terpilih (klik 2x pada clip)">Edit</button>' +
      '<button class="tlBtn" id="tlClose" type="button" title="Tutup (T)">✕</button>' +
      "</div>" +
      "</div>" +
      '<div class="tlBody">' +
      '<div class="tlHead" id="tlHeadL"></div>' +
      '<div class="tlScroll" id="tlScroll"><div class="tlCanvas" id="tlCanvas"></div></div>' +
      "</div>";
    host.appendChild(d);
    var head = "";
    TRACKS.forEach(function (t) {
      head +=
        '<div class="tlTrackHead' +
        (t.tall ? " tall" : "") +
        '"><b>' +
        t.name +
        "</b><span>" +
        t.desc +
        "</span></div>";
    });
    el("tlHeadL").innerHTML = head;
    bindBar();
  }

  function renderAll() {
    if (!_open) return;
    paintProjects();
    renderTracks();
    paintTime(curT());
    paintTransport();
    paintHist();
    paintSel();
  }
  function renderTracks() {
    var cv = el("tlCanvas");
    if (!cv) return;
    var p = proj();
    var dur = totalDur(p);
    var sc = el("tlScroll");
    var w = Math.max(dur * _pps + 240, (sc && sc.clientWidth) || 600);
    cv.style.width = w + "px";
    var step = _pps >= 20 ? 1 : _pps >= 8 ? 2 : 5;
    var rh = '<div class="tlRuler" id="tlRuler">';
    for (var s = 0; s <= Math.ceil(dur) + 5; s += step) {
      var major = s % 5 === 0;
      if (!major && step > 1 && s % step !== 0) continue;
      rh +=
        '<div class="tlTick' +
        (major ? " major" : "") +
        '" style="left:' +
        s * _pps +
        'px">' +
        (major ? fmt(s) : "") +
        "</div>";
    }
    rh += "</div>";
    var th = "";
    TRACKS.forEach(function (t) {
      th += '<div class="tlTrack' + (t.tall ? " tall" : "") + '" data-track="' + t.id + '">';
      (p.tracks[t.id] || []).forEach(function (c) {
        th += clipHtml(t.id, c);
      });
      th += "</div>";
    });
    cv.innerHTML = rh + th + '<div class="tlPlayhead" id="tlPlayhead"></div>';
    bindClips();
    bindRuler();
    paintPlayhead();
  }
  function clipHtml(track, c) {
    var sel = _sel && _sel.id === c.id ? " sel" : "";
    var cd = c.kind === "countdown" ? " cd" : "";
    var trans =
      c.transition && c.transition !== "cut"
        ? '<span class="tlTrans">⋈ ' + c.transition + "</span>"
        : "";
    return (
      '<div class="tlClip tr-' +
      track +
      cd +
      sel +
      '" data-id="' +
      c.id +
      '" data-track="' +
      track +
      '" style="left:' +
      c.start * _pps +
      "px;width:" +
      Math.max(14, c.dur * _pps) +
      'px" title="' +
      escH(clipLabel(c)) +
      '">' +
      '<span class="tlEdge l"></span><span class="tlEdge r"></span>' +
      escH(clipLabel(c)) +
      "<small>" +
      fmt(c.start) +
      " → " +
      fmt(c.start + c.dur) +
      "</small>" +
      trans +
      "</div>"
    );
  }

  /* ---------------- snap & geser ---------------- */
  function snapT(t, ignoreId) {
    if (!_snap) return Math.max(0, Math.round(t * 10) / 10);
    var cand = [Math.round(t)];
    TRACKS.forEach(function (tr) {
      (proj().tracks[tr.id] || []).forEach(function (c) {
        if (c.id === ignoreId) return;
        cand.push(c.start, c.start + c.dur);
      });
    });
    var best = t,
      bestD = 9 / _pps + 0.001; // ambang 9px
    cand.forEach(function (x) {
      var d = Math.abs(t - x);
      if (d <= bestD) {
        best = x;
        bestD = d;
      }
    });
    return Math.max(0, best);
  }

  var _drag = null;
  function bindClips() {
    qa(".tlClip", el("tlCanvas")).forEach(function (node) {
      node.addEventListener("pointerdown", function (ev) {
        if (ev.button != null && ev.button !== 0) return;
        var id = node.getAttribute("data-id");
        var track = node.getAttribute("data-track");
        var c = findClip(track, id);
        if (!c) return;
        _sel = { track: track, id: id };
        paintSel();
        var edge = null;
        if (ev.target && ev.target.classList && ev.target.classList.contains("tlEdge"))
          edge = ev.target.classList.contains("l") ? "l" : "r";
        hist(); // titik pulih = sebelum drag; di-pop bila ternyata tak bergerak
        _drag = { id: id, track: track, edge: edge, x0: ev.clientX, start0: c.start, dur0: c.dur, moved: false };
        try {
          node.setPointerCapture(ev.pointerId);
        } catch (e) {}
        ev.preventDefault();
      });
      node.addEventListener("pointermove", function (ev) {
        if (!_drag || _drag.id !== node.getAttribute("data-id")) return;
        var c = findClip(_drag.track, _drag.id);
        if (!c) return;
        var dt = (ev.clientX - _drag.x0) / _pps;
        if (Math.abs(dt) > 0.02) _drag.moved = true;
        if (_drag.edge === "l") {
          var ns = Math.max(0, Math.min(snapT(_drag.start0 + dt, _drag.id), _drag.start0 + _drag.dur0 - 0.5));
          c.dur = _drag.start0 + _drag.dur0 - ns;
          c.start = ns;
        } else if (_drag.edge === "r") {
          c.dur = Math.max(0.5, snapT(_drag.start0 + _drag.dur0 + dt, _drag.id) - _drag.start0);
        } else {
          c.start = Math.max(0, snapT(_drag.start0 + dt, _drag.id));
        }
        node.style.left = c.start * _pps + "px";
        node.style.width = Math.max(14, c.dur * _pps) + "px";
      });
      node.addEventListener("pointerup", function () {
        if (!_drag || _drag.id !== node.getAttribute("data-id")) return;
        var moved = _drag.moved;
        _drag = null;
        if (!moved) {
          _undo.pop();
          paintHist();
        }
        sortTrack(proj().tracks[node.getAttribute("data-track")]);
        saveProject(true);
        renderTracks();
        paintSel();
      });
      node.addEventListener("dblclick", function (ev) {
        openEditor(node.getAttribute("data-id"));
        ev.stopPropagation();
      });
    });
  }
  function bindRuler() {
    var r = el("tlRuler");
    if (!r) return;
    r.addEventListener("pointerdown", function (ev) {
      var rect = r.getBoundingClientRect();
      seek((ev.clientX - rect.left) / _pps);
      var mv = function (e2) {
        seek((e2.clientX - rect.left) / _pps);
      };
      var up = function () {
        document.removeEventListener("pointermove", mv);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", mv);
      document.addEventListener("pointerup", up);
      ev.preventDefault();
    });
  }
  function seek(t) {
    t = Math.max(0, Math.min(totalDur(), t));
    if (_play.on) {
      _play.off = t;
      _play.t0 = performance.now();
      _lastSig = "__none__";
    } else {
      _playhead = t;
    }
    paintPlayhead();
    paintTime(t);
  }

  /* ---------------- cat ulang kecil ---------------- */
  function paintPlayhead() {
    var ph = el("tlPlayhead");
    if (ph) ph.style.left = curT() * _pps + "px";
  }
  function paintTime(t) {
    var e2 = el("tlTime");
    if (e2) e2.textContent = fmtD(t != null ? t : curT()) + " / " + fmt(totalDur());
  }
  function paintTransport() {
    var b = el("tlPlay");
    if (b) b.textContent = _play.on ? "⏸" : "▶";
    var lv = el("tlLive");
    if (lv) lv.classList.toggle("on", _play.on);
  }
  function paintSel() {
    qa(".tlClip", el("tlCanvas")).forEach(function (n) {
      n.classList.toggle("sel", !!_sel && n.getAttribute("data-id") === _sel.id);
    });
    var info = el("tlSelInfo");
    var c = _sel && findClipAnywhere(_sel.id);
    if (info) info.textContent = c ? clipLabel(c) + " · " + fmtD(c.dur) : "";
  }
  function paintProjects() {
    var sel = el("tlProjects");
    if (!sel) return;
    var list = listProjects();
    var cur = proj();
    if (
      !list.some(function (p) {
        return p.id === cur.id;
      })
    )
      list.unshift(cur);
    sel.innerHTML = list
      .map(function (p) {
        return '<option value="' + p.id + '"' + (p.id === cur.id ? " selected" : "") + ">" + escH(p.name) + "</option>";
      })
      .join("");
  }

  /* ---------------- toolbar ---------------- */
  function bindBar() {
    el("tlPlay").onclick = play;
    el("tlStop").onclick = function () {
      stopPlay();
    };
    el("tlHome").onclick = function () {
      seek(0);
    };
    el("tlAuto").onclick = function () {
      autoFromPlan();
    };
    el("tlAddSong").onclick = openSongPicker;
    el("tlAddText").onclick = function () {
      openEditor(null, "text");
    };
    el("tlAddVerse").onclick = function () {
      openEditor(null, "verse");
    };
    el("tlAddCd").onclick = function () {
      openEditor(null, "countdown");
    };
    el("tlAddBg").onclick = function () {
      openEditor(null, "bg");
    };
    el("tlAddMedia").onclick = function () {
      openEditor(null, "media");
    };
    el("tlAddOv").onclick = function () {
      openEditor(null, "overlay");
    };
    el("tlSplit").onclick = splitSel;
    el("tlDel").onclick = function () {
      if (_sel) removeClip(_sel.track, _sel.id);
    };
    el("tlUndo").onclick = undo;
    el("tlRedo").onclick = redo;
    el("tlSnap").onclick = function () {
      _snap = !_snap;
      el("tlSnap").classList.toggle("on", _snap);
    };
    el("tlZoom").oninput = function () {
      _pps = parseInt(this.value, 10) || 12;
      renderTracks();
    };
    el("tlSave").onclick = function () {
      saveProject();
    };
    el("tlNew").onclick = function () {
      var nm = prompt("Nama proyek timeline:", "Ibadah " + new Date().toLocaleDateString("id-ID"));
      if (nm === null) return;
      _proj = newProject(nm || undefined);
      _sel = null;
      _undo = [];
      _redo = [];
      saveProject(true);
      renderAll();
    };
    el("tlDelProj").onclick = function () {
      if (!confirm('Hapus proyek timeline "' + proj().name + '"?')) return;
      deleteProject(proj().id);
      renderAll();
    };
    el("tlProjects").onchange = function () {
      loadProject(this.value);
    };
    el("tlClose").onclick = close;
    el("tlEdit").onclick = function () {
      if (_sel) openEditor(_sel.id);
    };
  }
  function splitSel() {
    if (!_sel) {
      toast("Pilih clip dulu, lalu geser playhead ke titik potong.", "info");
      return;
    }
    if (!splitClip(_sel.track, _sel.id, curT())) toast("Playhead harus berada di dalam clip terpilih.", "info");
  }


  /* ---------------- popover editor clip ---------------- */
  function kindToTrack(k) {
    return k === "bg" ? "bg" : k === "media" ? "media" : k === "overlay" ? "overlay" : "lyrics";
  }
  function defaultClip(k) {
    var p = proj();
    var base = {
      id: uid(),
      start: Math.round(curT()),
      dur: p.settings.defDur || 8,
      transition: p.settings.defTrans || "fade",
    };
    if (k === "text") {
      base.kind = "text";
      base.text = "";
    } else if (k === "verse") {
      base.kind = "verse";
      base.ref = "";
      base.text = "";
    } else if (k === "countdown") {
      base.kind = "countdown";
      base.title = "Ibadah segera dimulai";
      base.dur = 300;
    } else if (k === "bg") {
      base.bg = { kind: "color", value: "#0b0e14" };
    } else if (k === "media") {
      base.media = { kind: "image", value: "" };
    } else if (k === "overlay") {
      base.overlay = { kind: "third", text: "", sub: "" };
      base.dur = 6;
    }
    return base;
  }
  function fonts() {
    return (window.PNWProjector && window.PNWProjector.fonts) || ["Inter", "Montserrat"];
  }
  function styleFieldset(d) {
    var st = d.style || {};
    var fo = '<option value="">— ikut sesi —</option>';
    fonts().forEach(function (f) {
      fo += '<option value="' + escH(f) + '"' + (st.font === f ? " selected" : "") + ">" + escH(f) + "</option>";
    });
    return (
      '<div class="row">' +
      "<label>Font<select id=\"tlEFont\">" +
      fo +
      "</select></label>" +
      '<label>Ukuran px<input type="number" id="tlESize" min="20" max="140" step="2" value="' +
      (st.size || "") +
      '" placeholder="ikut sesi" /></label>' +
      '<label>Posisi<select id="tlEPos">' +
      '<option value="">Tengah</option>' +
      '<option value="top"' +
      (st.pos === "top" ? " selected" : "") +
      ">Atas</option>" +
      '<option value="bottom"' +
      (st.pos === "bottom" ? " selected" : "") +
      ">Bawah</option>" +
      "</select></label>" +
      "</div>" +
      '<div class="row">' +
      '<label>Perataan<select id="tlEAlign">' +
      '<option value="">— ikut sesi —</option>' +
      '<option value="left"' +
      (st.align === "left" ? " selected" : "") +
      ">Kiri</option>" +
      '<option value="center"' +
      (st.align === "center" ? " selected" : "") +
      ">Tengah</option>" +
      '<option value="right"' +
      (st.align === "right" ? " selected" : "") +
      ">Kanan</option>" +
      "</select></label>" +
      '<label>Bayangan<select id="tlEShadow">' +
      '<option value="">— ikut sesi —</option>' +
      '<option value="soft"' +
      (st.shadow === "soft" ? " selected" : "") +
      ">Lembut</option>" +
      '<option value="strong"' +
      (st.shadow === "strong" ? " selected" : "") +
      ">Tegas</option>" +
      '<option value="none"' +
      (st.shadow === "none" ? " selected" : "") +
      ">Tanpa</option>" +
      "</select></label>" +
      '<label>Warna teks<input type="text" id="tlEColor" value="' +
      escH(st.color || "") +
      '" placeholder="#ffffff (kosong = ikut sesi)" /></label>' +
      "</div>"
    );
  }
  function readStyle() {
    var st = {};
    var f = el("tlEFont"),
      sz = el("tlESize"),
      ps = el("tlEPos"),
      al = el("tlEAlign"),
      sh = el("tlEShadow"),
      co = el("tlEColor");
    if (f && f.value) st.font = f.value;
    if (sz && sz.value) st.size = parseInt(sz.value, 10);
    if (ps && ps.value) st.pos = ps.value;
    if (al && al.value) st.align = al.value;
    if (sh && sh.value) st.shadow = sh.value;
    if (co && co.value.trim()) st.color = co.value.trim();
    return Object.keys(st).length ? st : null;
  }
  function commonRow(d) {
    var to = "";
    TRANS.forEach(function (t) {
      to += '<option value="' + t.id + '"' + (d.transition === t.id ? " selected" : "") + ">" + t.name + "</option>";
    });
    return (
      '<div class="row">' +
      '<label>Mulai (detik)<input type="number" id="tlEStart" min="0" step="0.5" value="' +
      (Math.round(d.start * 10) / 10) +
      '" /></label>' +
      '<label>Durasi (detik)<input type="number" id="tlEDur" min="0.5" step="0.5" value="' +
      (Math.round(d.dur * 10) / 10) +
      '" /></label>' +
      '<label>Transisi<select id="tlETrans">' +
      to +
      "</select></label>" +
      "</div>"
    );
  }
  function bgFields(d) {
    var kinds = [
      ["color", "Warna solid"],
      ["motion", "Animasi (preset)"],
      ["studio", "Animasi Studio (kustom)"],
      ["image", "Gambar (URL / idb:)"],
      ["video", "Video (URL mp4 / idb:)"],
    ];
    var ko = "";
    kinds.forEach(function (k) {
      ko += '<option value="' + k[0] + '"' + (d.bg && d.bg.kind === k[0] ? " selected" : "") + ">" + k[1] + "</option>";
    });
    var sw = "";
    var solids = (P() && P().SOLIDS) || ["#000000", "#0b0e14", "#12243d"];
    solids.forEach(function (hex) {
      sw +=
        '<button type="button" data-sw="' +
        hex +
        '" style="background:' +
        hex +
        '" title="' +
        hex +
        '"></button>';
    });
    var mo = "";
    var presets = [];
    var eng = window.PNWYVMotion || window.PNWMotion;
    if (eng && eng.presetList)
      safe("presetList", function () {
        presets = eng.presetList();
      });
    if (!presets.length && P())
      presets = (P().MOTIONS || []).map(function (m) {
        return { id: m.id, name: m.name };
      });
    presets.forEach(function (m) {
      mo += '<option value="' + m.id + '"' + (d.bg && d.bg.value === m.id ? " selected" : "") + ">" + escH(m.name || m.id) + "</option>";
    });
    return (
      '<div class="row"><label>Jenis latar<select id="tlEBgKind">' +
      ko +
      "</select></label></div>" +
      '<div class="row"><label>Warna<div class="tlSwatches" id="tlESwatches">' +
      sw +
      '</div></label></div>' +
      '<div class="row"><label>Preset animasi<select id="tlEBgPreset">' +
      mo +
      "</select></label></div>" +
      '<div class="row"><label>URL gambar / video<input type="text" id="tlEBgUrl" value="' +
      escH(d.bg && (d.bg.kind === "image" || d.bg.kind === "video") ? d.bg.value : "") +
      '" placeholder="https://… atau idb:…" /></label></div>'
    );
  }
  function openEditor(clipId, forceKind) {
    return safe("editor", function () {
      var isNew = !clipId;
      var c = clipId ? findClipAnywhere(clipId) : null;
      if (!c && !isNew) return;
      var track = clipId ? trackOf(clipId) : kindToTrack(forceKind);
      var d = c ? clone(c) : defaultClip(forceKind);
      var kind = d.kind || (d.bg ? "bg" : d.media ? "media" : d.overlay ? "overlay" : "text");
      var title =
        (isNew ? "Tambah clip — " : "Edit clip — ") +
        (kind === "song" ? "Lagu" : kind === "text" ? "Teks" : kind === "verse" ? "Ayat" : kind === "countdown" ? "Countdown" : kind === "bg" ? "Latar" : kind === "media" ? "Media" : "Overlay");
      var body = "";
      if (kind === "song") {
        body +=
          '<div class="tlSlides" id="tlESlides">' +
          (d.slides || [])
            .map(function (sl, i) {
              return (
                '<div class="tlSlideRow"><b>Slide ' +
                (i + 1) +
                (sl.label ? " · " + escH(sl.label) : "") +
                '</b><textarea data-slide="' +
                i +
                '">' +
                escH((sl.lines || []).join("\n")) +
                "</textarea></div>"
              );
            })
            .join("") +
          "</div>";
        body += styleFieldset(d);
      } else if (kind === "text") {
        body += '<div class="row"><label>Isi teks / pengumuman<textarea id="tlEText">' + escH(d.text || "") + "</textarea></label></div>";
        body += styleFieldset(d);
      } else if (kind === "verse") {
        body +=
          '<div class="row"><label>Referensi<input type="text" id="tlERef" value="' +
          escH(d.ref || "") +
          '" placeholder="Yohanes 3:16" /></label></div>' +
          '<div class="row"><label>Isi ayat<textarea id="tlEText">' +
          escH(d.text || "") +
          "</textarea></label></div>";
        body += styleFieldset(d);
      } else if (kind === "countdown") {
        body +=
          '<div class="row"><label>Judul di layar<input type="text" id="tlETitle" value="' +
          escH(d.title || "") +
          '" placeholder="Ibadah segera dimulai" /></label></div>';
        body += styleFieldset(d);
      } else if (kind === "bg") {
        body += bgFields(d);
      } else if (kind === "media") {
        body +=
          '<div class="row"><label>Jenis<select id="tlEMediaKind">' +
          '<option value="image"' +
          (d.media && d.media.kind === "image" ? " selected" : "") +
          ">Gambar</option>" +
          '<option value="video"' +
          (d.media && d.media.kind === "video" ? " selected" : "") +
          ">Video</option>" +
          "</select></label></div>" +
          '<div class="row"><label>URL media<input type="text" id="tlEMediaUrl" value="' +
          escH((d.media && d.media.value) || "") +
          '" placeholder="https://… .mp4 atau idb:… (unggah di tab Media)" /></label></div>';
      } else if (kind === "overlay") {
        body +=
          '<div class="row"><label>Jenis overlay<select id="tlEOvKind">' +
          '<option value="third"' +
          (d.overlay && d.overlay.kind === "third" ? " selected" : "") +
          ">Lower-third (pita teks)</option>" +
          '<option value="logo"' +
          (d.overlay && d.overlay.kind === "logo" ? " selected" : "") +
          ">Logo (pojok kanan atas)</option>" +
          "</select></label></div>" +
          '<div class="row"><label>Teks utama<input type="text" id="tlEOvText" value="' +
          escH((d.overlay && d.overlay.text) || "") +
          '" placeholder="Pdt. Yohan" /></label>' +
          '<label>Sub-teks<input type="text" id="tlEOvSub" value="' +
          escH((d.overlay && d.overlay.sub) || "") +
          '" placeholder="Khotbah hari ini" /></label></div>';
      }
      body += commonRow(d);

      var wrap = document.createElement("div");
      wrap.className = "tlEditWrap";
      wrap.id = "tlEditWrap";
      wrap.innerHTML =
        '<div class="tlEdit"><h4>' +
        escH(title) +
        "</h4>" +
        body +
        '<div class="tlBtns">' +
        '<button class="tlBtn" id="tlECancel" type="button">Batal</button>' +
        '<button class="tlBtn primary" id="tlESave" type="button">Simpan</button>' +
        "</div></div>";
      (el("projPage") || document.body).appendChild(wrap);
      wrap.addEventListener("pointerdown", function (ev) {
        if (ev.target === wrap) closeEditor();
      });
      el("tlECancel").onclick = closeEditor;
      var sw2 = el("tlESwatches");
      if (sw2)
        qa("button", sw2).forEach(function (b) {
          b.onclick = function () {
            qa("button", sw2).forEach(function (x) {
              x.classList.remove("on");
            });
            b.classList.add("on");
          };
        });
      el("tlESave").onclick = function () {
        saveEditor(isNew, track, d, kind);
      };
    });
  }
  function closeEditor() {
    var w = el("tlEditWrap");
    if (w) w.parentNode.removeChild(w);
  }
  function saveEditor(isNew, track, d, kind) {
    safe("saveEditor", function () {
      var nd = clone(d);
      nd.start = Math.max(0, parseFloat(el("tlEStart").value) || 0);
      nd.dur = Math.max(kind === "countdown" ? 1 : 0.5, parseFloat(el("tlEDur").value) || 1);
      nd.transition = el("tlETrans").value || "fade";
      if (kind === "song") {
        var slides = [];
        qa("textarea", el("tlESlides")).forEach(function (ta, i) {
          var lines = ta.value
            .split("\n")
            .map(function (x) {
              return x.trim();
            })
            .filter(Boolean);
          var label = (d.slides[i] && d.slides[i].label) || "";
          if (lines.length) slides.push({ label: label, lines: lines });
        });
        if (!slides.length) {
          toast("Minimal satu slide harus berisi lirik.", "error");
          return;
        }
        nd.slides = slides;
        nd.style = readStyle() || undefined;
      } else if (kind === "text") {
        nd.text = el("tlEText").value.trim();
        if (!nd.text) {
          toast("Isi teks dulu.", "error");
          return;
        }
        nd.style = readStyle() || undefined;
      } else if (kind === "verse") {
        nd.ref = el("tlERef").value.trim();
        nd.text = el("tlEText").value.trim();
        if (!nd.text) {
          toast("Isi ayat dulu.", "error");
          return;
        }
        nd.style = readStyle() || undefined;
      } else if (kind === "countdown") {
        nd.title = el("tlETitle").value.trim();
        nd.style = readStyle() || undefined;
      } else if (kind === "bg") {
        var bk = el("tlEBgKind").value;
        var val = "";
        if (bk === "color") {
          var on = q("#tlESwatches button.on");
          val = on ? on.getAttribute("data-sw") : (d.bg && d.bg.kind === "color" ? d.bg.value : "#0b0e14");
        } else if (bk === "motion" || bk === "studio") {
          val = el("tlEBgPreset").value;
        } else {
          val = el("tlEBgUrl").value.trim();
          if (!val) {
            toast("Tempel URL gambar/video dulu.", "error");
            return;
          }
        }
        nd.bg = { kind: bk, value: val };
      } else if (kind === "media") {
        var mv = el("tlEMediaUrl").value.trim();
        if (!mv) {
          toast("Tempel URL media dulu.", "error");
          return;
        }
        nd.media = { kind: el("tlEMediaKind").value, value: mv };
      } else if (kind === "overlay") {
        nd.overlay = {
          kind: el("tlEOvKind").value,
          text: el("tlEOvText").value.trim(),
          sub: el("tlEOvSub").value.trim(),
        };
      }
      if (!isNew) hist();
      if (isNew) {
        addClip(track, nd, { at: nd.start });
      } else {
        var arr = proj().tracks[track];
        for (var i = 0; i < arr.length; i++)
          if (arr[i].id === nd.id) {
            arr[i] = nd;
            break;
          }
        sortTrack(arr);
        saveProject(true);
        renderAll();
      }
      closeEditor();
      toast("Clip disimpan.", "success");
    });
  }

  /* ---------------- pemilih lagu ---------------- */
  function openSongPicker() {
    return safe("picker", function () {
      var list = (engine() && engine().getSongs()) || [];
      if (!list.length) {
        toast("Data lagu belum termuat.", "info");
        return;
      }
      var wrap = document.createElement("div");
      wrap.className = "tlEditWrap";
      wrap.id = "tlEditWrap";
      wrap.innerHTML =
        '<div class="tlEdit"><h4>Tambah lagu ke timeline</h4>' +
        '<div class="row"><label>Cari<input type="text" id="tlPSearch" placeholder="ketik judul lagu…" /></label></div>' +
        '<div id="tlPList"></div>' +
        '<div class="tlBtns"><button class="tlBtn" id="tlECancel" type="button">Tutup</button></div></div>';
      (el("projPage") || document.body).appendChild(wrap);
      wrap.addEventListener("pointerdown", function (ev) {
        if (ev.target === wrap) closeEditor();
      });
      el("tlECancel").onclick = closeEditor;
      function paint(filter) {
        var f = String(filter || "").toLowerCase();
        var html = "";
        list
          .filter(function (s) {
            return !f || String(s.title || "").toLowerCase().indexOf(f) !== -1;
          })
          .slice(0, 30)
          .forEach(function (s) {
            html +=
              '<div class="tlPickItem" data-id="' +
              escH(s.id) +
              '"><span>' +
              escH(s.title || "Tanpa judul") +
              "</span><small>" +
              escH(s.originalKey || "") +
              "</small></div>";
          });
        el("tlPList").innerHTML = html || '<p style="color:#6b7c99;font-size:12px">Tidak ada hasil.</p>';
        qa(".tlPickItem", el("tlPList")).forEach(function (it) {
          it.onclick = function () {
            var song = engine().getSong(it.getAttribute("data-id"));
            if (!song) return;
            var slides = (P() && P().slidesOf(song)) || [{ label: "", lines: [song.title || ""] }];
            var p = proj();
            addClip("lyrics", {
              kind: "song",
              songId: song.id,
              title: song.title || "Tanpa judul",
              slides: clone(slides),
              dur: slides.length * (p.settings.defDur || 8),
            });
            closeEditor();
            toast('Lagu "' + (song.title || "") + '" masuk timeline (' + slides.length + " slide).", "success");
          };
        });
      }
      paint("");
      el("tlPSearch").oninput = function () {
        paint(this.value);
      };
    });
  }

  /* ---------------- keyboard ---------------- */
  function onKey(e) {
    var t = e.target;
    var tag = (t && t.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
    if (el("tlEditWrap")) {
      if (e.key === "Escape") closeEditor();
      return;
    }
    var ctrl = e.ctrlKey || e.metaKey;
    var k = (e.key || "").toLowerCase();
    if (ctrl) {
      if (!_open) return;
      if (k === "z" && e.shiftKey) {
        redo();
        e.preventDefault();
      } else if (k === "z") {
        undo();
        e.preventDefault();
      } else if (k === "y") {
        redo();
        e.preventDefault();
      }
      return;
    }
    if (e.altKey) return;
    if (k === "t" && !ctrl) {
      toggle();
      e.preventDefault();
      return;
    }
    if (!_open) return;
    if (e.code === "Space" || e.key === " ") {
      play();
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      seek(curT() - (e.shiftKey ? 5 : 1));
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      seek(curT() + (e.shiftKey ? 5 : 1));
      e.preventDefault();
    } else if (k === "s") {
      splitSel();
      e.preventDefault();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      if (_sel) {
        removeClip(_sel.track, _sel.id);
        e.preventDefault();
      }
    } else if (e.key === "Escape") {
      close();
    }
  }

  /* ---------------- buka/tutup + integrasi rail ---------------- */
  function open() {
    var pg = el("projPage");
    if (!pg) return;
    buildDrawer();
    _open = true;
    el("tlDrawer").classList.add("on");
    proj();
    renderAll();
    watchCloud();
    startPaintLoop();
  }
  function close() {
    _open = false;
    if (_play.on) stopPlay();
    closeEditor();
    var d = el("tlDrawer");
    if (d) d.classList.remove("on");
    stopPaintLoop();
    var railBtn = q('#projRail [data-rail="timeline"]');
    if (railBtn) railBtn.classList.remove("on");
  }
  function toggle() {
    if (_open) close();
    else open();
  }
  function startPaintLoop() {
    stopPaintLoop();
    _paint = setInterval(function () {
      paintPlayhead();
      if (!_play.on) paintTime();
    }, 150);
  }
  function stopPaintLoop() {
    if (_paint) clearInterval(_paint);
    _paint = null;
  }
  function injectRail() {
    var rail = el("projRail");
    if (!rail || rail.querySelector('[data-rail="timeline"]')) return;
    var b = document.createElement("button");
    b.className = "projRailBtn";
    b.type = "button";
    b.setAttribute("data-rail", "timeline");
    b.innerHTML = '<span class="ic">⏱</span><span>Timeline</span>';
    b.onclick = function () {
      qa(".projRailBtn", rail).forEach(function (x) {
        x.classList.remove("on");
      });
      b.classList.add("on");
      open();
    };
    rail.appendChild(b);
  }
  function hook() {
    try {
      var mo = new MutationObserver(function () {
        if (el("projRail")) injectRail();
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
    document.addEventListener("keydown", onKey);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();

  window.PNWTimeline = {
    version: VERSION,
    open: open,
    close: close,
    toggle: toggle,
    isOpen: function () {
      return _open;
    },
    addClip: addClip,
    removeClip: removeClip,
    splitClip: splitClip,
    undo: undo,
    redo: redo,
    play: play,
    pause: pause,
    stop: stopPlay,
    seek: seek,
    curT: curT,
    stateAt: stateAt,
    payloadAt: payloadAt,
    project: function () {
      return proj();
    },
    listProjects: listProjects,
    loadProject: loadProject,
    deleteProject: deleteProject,
    saveProject: saveProject,
    autoFromPlan: autoFromPlan,
    clipLabel: clipLabel,
    totalDur: totalDur,
    _setSnap: function (v) {
      _snap = !!v;
    },
    _setPps: function (v) {
      _pps = v;
    },
    _reset: function () {
      _proj = newProject("QA");
      _undo = [];
      _redo = [];
      _sel = null;
      _playhead = 0;
    },
  };
})();
