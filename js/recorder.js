/* PNW TOOLS v62 - Rekaman latihan per lagu
 * Menyimpan rekaman suara di IndexedDB perangkat (tidak diunggah ke server).
 * Dipakai lewat window.PNWRec
 */
(function () {
  "use strict";

  var DB_NAME = "pnwRecordings";
  var DB_VER = 1;
  var STORE = "rec";
  var _db = null;
  var _counts = {};
  var _openFor = null; // { id, title }
  var _mr = null;
  var _chunks = [];
  var _startAt = 0;
  var _timerId = 0;
  var _stream = null;
  var _playingUrl = null;
  var _playingAudio = null;

  function log() {
    try {
      if (window.PNWLog && window.PNWLog.debug) console.log.apply(console, arguments);
    } catch (e) {}
  }

  function toast(msg, type) {
    try {
      if (typeof window.pnwToast === "function") return window.pnwToast(msg, type);
    } catch (e) {}
    try {
      console.log("[rekaman] " + msg);
    } catch (e) {}
    return null;
  }

  /* ---------------- IndexedDB ---------------- */
  function openDb() {
    return new Promise(function (resolve, reject) {
      if (_db) return resolve(_db);
      if (!window.indexedDB) return reject(new Error("IndexedDB tidak tersedia"));
      var req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          var os = db.createObjectStore(STORE, { keyPath: "id" });
          os.createIndex("songId", "songId", { unique: false });
          os.createIndex("ts", "ts", { unique: false });
        }
      };
      req.onsuccess = function () {
        _db = req.result;
        resolve(_db);
      };
      req.onerror = function () {
        reject(req.error || new Error("gagal membuka database rekaman"));
      };
    });
  }

  function tx(mode) {
    return openDb().then(function (db) {
      return db.transaction(STORE, mode).objectStore(STORE);
    });
  }

  function allRecords() {
    return tx("readonly").then(function (os) {
      return new Promise(function (resolve, reject) {
        var out = [];
        var req = os.openCursor();
        req.onsuccess = function (e) {
          var c = e.target.result;
          if (!c) return resolve(out);
          var v = c.value;
          out.push({
            id: v.id,
            songId: v.songId,
            songTitle: v.songTitle,
            name: v.name,
            ts: v.ts,
            dur: v.dur,
            size: v.blob ? v.blob.size : 0,
            type: v.type,
          });
          c.continue();
        };
        req.onerror = function () {
          reject(req.error);
        };
      });
    });
  }

  function getBlob(id) {
    return tx("readonly").then(function (os) {
      return new Promise(function (resolve, reject) {
        var r = os.get(id);
        r.onsuccess = function () {
          resolve(r.result || null);
        };
        r.onerror = function () {
          reject(r.error);
        };
      });
    });
  }

  function putRecord(rec) {
    return tx("readwrite").then(function (os) {
      return new Promise(function (resolve, reject) {
        var r = os.put(rec);
        r.onsuccess = function () {
          resolve(rec);
        };
        r.onerror = function () {
          reject(r.error);
        };
      });
    });
  }

  function delRecord(id) {
    return tx("readwrite").then(function (os) {
      return new Promise(function (resolve, reject) {
        var r = os.delete(id);
        r.onsuccess = function () {
          resolve(true);
        };
        r.onerror = function () {
          reject(r.error);
        };
      });
    });
  }

  function refreshCounts() {
    return allRecords()
      .then(function (list) {
        var m = {};
        list.forEach(function (r) {
          var k = String(r.songId);
          m[k] = (m[k] || 0) + 1;
        });
        _counts = m;
        decorate();
        return m;
      })
      .catch(function () {
        return {};
      });
  }

  /* ---------------- util ---------------- */
  function fmtDur(ms) {
    var s = Math.max(0, Math.round((ms || 0) / 1000));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function fmtSize(b) {
    if (!b) return "-";
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(0) + " KB";
    return (b / 1024 / 1024).toFixed(1) + " MB";
  }

  function fmtDate(ts) {
    try {
      var d = new Date(ts);
      var p = function (n) {
        return (n < 10 ? "0" : "") + n;
      };
      return p(d.getDate()) + "/" + p(d.getMonth() + 1) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
    } catch (e) {
      return "";
    }
  }

  function pickMime() {
    var opts = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    for (var i = 0; i < opts.length; i++) {
      try {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(opts[i])) return opts[i];
      } catch (e) {}
    }
    return "";
  }

  function extFor(mime) {
    if (!mime) return "webm";
    if (mime.indexOf("mp4") >= 0) return "m4a";
    if (mime.indexOf("ogg") >= 0) return "ogg";
    return "webm";
  }

  /* ---------------- panel UI ---------------- */
  var el = {};

  function buildPanel() {
    if (el.back) return;
    var back = document.createElement("div");
    back.className = "modalBackdrop no-print recBack";
    back.id = "recModal";
    back.innerHTML = [
      '<div class="modal recModal" role="dialog" aria-label="Rekaman latihan">',
      '  <div class="recHead">',
      '    <div>',
      '      <p class="recTitle" id="recSongTitle">Lagu</p>',
      '      <p class="recSub">Rekaman latihan tersimpan di perangkat ini</p>',
      "    </div>",
      '    <button class="recX" id="recClose" type="button" aria-label="Tutup">&times;</button>',
      "  </div>",
      '  <div class="recStage">',
      '    <button class="recDot" id="recDot" type="button" aria-label="Mulai merekam"><span class="recDotIn"></span></button>',
      '    <div class="recMeta">',
      '      <span class="recTime" id="recTime">0:00</span>',
      '      <span class="recHint" id="recHint">Tekan untuk mulai merekam</span>',
      "    </div>",
      '    <div class="recWave" id="recWave" aria-hidden="true"></div>',
      "  </div>",
      '  <div class="recList" id="recList"></div>',
      '  <div class="recFoot">',
      '    <span class="recNote" id="recNote"></span>',
      '    <button class="actionBtn secondary" id="recDone" type="button">Selesai</button>',
      "  </div>",
      "</div>",
    ].join("");
    document.body.appendChild(back);

    el.back = back;
    el.title = back.querySelector("#recSongTitle");
    el.dot = back.querySelector("#recDot");
    el.time = back.querySelector("#recTime");
    el.hint = back.querySelector("#recHint");
    el.list = back.querySelector("#recList");
    el.note = back.querySelector("#recNote");
    el.wave = back.querySelector("#recWave");

    for (var i = 0; i < 5; i++) {
      var b = document.createElement("i");
      b.style.setProperty("--i", String(i));
      el.wave.appendChild(b);
    }

    back.querySelector("#recClose").onclick = close;
    back.querySelector("#recDone").onclick = close;
    back.addEventListener("click", function (e) {
      if (e.target === back) close();
    });
    el.dot.onclick = function () {
      if (_mr && _mr.state === "recording") stopRec();
      else startRec();
    };
  }

  function setRecordingUi(on) {
    if (!el.back) return;
    el.back.classList.toggle("isRec", !!on);
    el.hint.textContent = on ? "Sedang merekam - tekan lagi untuk berhenti" : "Tekan untuk mulai merekam";
    el.dot.setAttribute("aria-label", on ? "Berhenti merekam" : "Mulai merekam");
  }

  function tick() {
    if (!_startAt) return;
    el.time.textContent = fmtDur(Date.now() - _startAt);
  }

  function startRec() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast("Perangkat/browser ini tidak mendukung perekaman suara.", "error");
      return;
    }
    if (!window.MediaRecorder) {
      toast("Browser ini belum mendukung MediaRecorder.", "error");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      .then(function (stream) {
        _stream = stream;
        _chunks = [];
        var mime = pickMime();
        try {
          _mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        } catch (e) {
          _mr = new MediaRecorder(stream);
        }
        _mr.ondataavailable = function (e) {
          if (e.data && e.data.size) _chunks.push(e.data);
        };
        _mr.onstop = function () {
          var dur = Date.now() - _startAt;
          var type = (_mr && _mr.mimeType) || mime || "audio/webm";
          var blob = new Blob(_chunks, { type: type });
          _chunks = [];
          _startAt = 0;
          clearInterval(_timerId);
          _timerId = 0;
          setRecordingUi(false);
          el.time.textContent = "0:00";
          try {
            if (_stream) _stream.getTracks().forEach(function (t) { t.stop(); });
          } catch (e) {}
          _stream = null;
          if (!blob.size || dur < 700) {
            toast("Rekaman terlalu pendek, tidak disimpan.", "info");
            return;
          }
          var song = _openFor || { id: "lepas", title: "Tanpa lagu" };
          var rec = {
            id: "r" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
            songId: String(song.id),
            songTitle: song.title,
            name: "Latihan " + fmtDate(Date.now()),
            ts: Date.now(),
            dur: dur,
            type: type,
            blob: blob,
          };
          putRecord(rec)
            .then(function () {
              toast("Rekaman disimpan (" + fmtDur(dur) + ").", "success");
              return refreshCounts();
            })
            .then(renderList)
            .catch(function (err) {
              toast("Gagal menyimpan rekaman: " + (err && err.message ? err.message : err), "error");
            });
        };
        _mr.start();
        _startAt = Date.now();
        setRecordingUi(true);
        tick();
        _timerId = setInterval(tick, 250);
      })
      .catch(function (err) {
        var m = err && err.name === "NotAllowedError"
          ? "Izin mikrofon ditolak. Aktifkan izin mikrofon untuk situs ini."
          : "Tidak bisa mengakses mikrofon: " + (err && err.message ? err.message : err);
        toast(m, "error");
      });
  }

  function stopRec() {
    try {
      if (_mr && _mr.state === "recording") _mr.stop();
    } catch (e) {}
  }

  function stopPlayback() {
    try {
      if (_playingAudio) {
        _playingAudio.pause();
        _playingAudio.src = "";
      }
    } catch (e) {}
    if (_playingUrl) {
      try {
        URL.revokeObjectURL(_playingUrl);
      } catch (e) {}
      _playingUrl = null;
    }
    _playingAudio = null;
    if (el.list) {
      Array.prototype.forEach.call(el.list.querySelectorAll(".recItem.playing"), function (n) {
        n.classList.remove("playing");
      });
    }
  }

  function playRec(id, itemEl) {
    var wasPlaying = itemEl && itemEl.classList.contains("playing");
    stopPlayback();
    if (wasPlaying) return;
    getBlob(id).then(function (r) {
      if (!r || !r.blob) return;
      _playingUrl = URL.createObjectURL(r.blob);
      _playingAudio = new Audio(_playingUrl);
      if (itemEl) itemEl.classList.add("playing");
      _playingAudio.onended = stopPlayback;
      _playingAudio.onerror = stopPlayback;
      _playingAudio.play().catch(function () {
        stopPlayback();
        toast("Tidak bisa memutar rekaman.", "error");
      });
    });
  }

  function downloadRec(id) {
    getBlob(id).then(function (r) {
      if (!r || !r.blob) return;
      var url = URL.createObjectURL(r.blob);
      var a = document.createElement("a");
      var safe = String(r.songTitle || "lagu").replace(/[^\w\- ]+/g, "").trim() || "lagu";
      a.href = url;
      a.download = safe + " - " + (r.name || "rekaman") + "." + extFor(r.type);
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 600);
    });
  }

  function renderList() {
    if (!el.list) return Promise.resolve();
    return allRecords().then(function (list) {
      var sid = _openFor ? String(_openFor.id) : null;
      var mine = list
        .filter(function (r) {
          return !sid || String(r.songId) === sid;
        })
        .sort(function (a, b) {
          return b.ts - a.ts;
        });
      el.list.innerHTML = "";
      if (!mine.length) {
        var p = document.createElement("p");
        p.className = "recEmpty";
        p.textContent = "Belum ada rekaman untuk lagu ini.";
        el.list.appendChild(p);
      }
      var total = 0;
      list.forEach(function (r) {
        total += r.size || 0;
      });
      mine.forEach(function (r) {
        var row = document.createElement("div");
        row.className = "recItem";
        row.dataset.id = r.id;

        var play = document.createElement("button");
        play.type = "button";
        play.className = "recPlay";
        play.setAttribute("aria-label", "Putar rekaman");
        play.onclick = function () {
          playRec(r.id, row);
        };

        var mid = document.createElement("div");
        mid.className = "recInfo";
        var nm = document.createElement("button");
        nm.type = "button";
        nm.className = "recName";
        nm.textContent = r.name || "Rekaman";
        nm.title = "Ubah nama";
        nm.onclick = function () {
          var v = prompt("Nama rekaman:", r.name || "");
          if (v === null) return;
          v = v.trim();
          if (!v) return;
          getBlob(r.id).then(function (full) {
            if (!full) return;
            full.name = v;
            putRecord(full).then(renderList);
          });
        };
        var meta = document.createElement("span");
        meta.className = "recItemMeta";
        meta.textContent = fmtDur(r.dur) + " \u00b7 " + fmtSize(r.size) + " \u00b7 " + fmtDate(r.ts);
        mid.appendChild(nm);
        mid.appendChild(meta);

        var dl = document.createElement("button");
        dl.type = "button";
        dl.className = "recMini";
        dl.textContent = "Unduh";
        dl.onclick = function () {
          downloadRec(r.id);
        };

        var del = document.createElement("button");
        del.type = "button";
        del.className = "recMini danger";
        del.textContent = "Hapus";
        del.onclick = function () {
          if (!confirm('Hapus rekaman "' + (r.name || "") + '"?')) return;
          stopPlayback();
          delRecord(r.id)
            .then(refreshCounts)
            .then(renderList);
        };

        row.appendChild(play);
        row.appendChild(mid);
        row.appendChild(dl);
        row.appendChild(del);
        el.list.appendChild(row);
      });
      if (el.note) {
        el.note.textContent =
          mine.length + " rekaman lagu ini \u00b7 total semua lagu " + fmtSize(total);
      }
    });
  }

  function open(songId, songTitle) {
    buildPanel();
    _openFor = { id: songId == null ? "lepas" : songId, title: songTitle || "Lagu" };
    el.title.textContent = _openFor.title;
    el.time.textContent = "0:00";
    setRecordingUi(false);
    el.back.classList.add("show");
    document.body.classList.add("noScroll");
    renderList();
  }

  function close() {
    stopRec();
    stopPlayback();
    if (el.back) el.back.classList.remove("show");
    document.body.classList.remove("noScroll");
  }

  /* --------- lencana jumlah rekaman di daftar lagu --------- */
  function decorate() {
    try {
      var rows = document.querySelectorAll(".songRow");
      Array.prototype.forEach.call(rows, function (row) {
        var id = row.dataset.id;
        var n = _counts[String(id)] || 0;
        var badge = row.querySelector(".recBadge");
        if (!n) {
          if (badge) badge.remove();
          return;
        }
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "recBadge";
          badge.title = "Jumlah rekaman latihan";
          var btn = row.querySelector(".songBtn");
          if (btn) btn.appendChild(badge);
          else row.appendChild(badge);
        }
        badge.textContent = "\u25cf " + n;
      });
    } catch (e) {}
  }

  window.PNWRec = {
    open: open,
    close: close,
    decorate: decorate,
    refresh: refreshCounts,
    countFor: function (id) {
      return _counts[String(id)] || 0;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      refreshCounts();
    });
  } else {
    refreshCounts();
  }
})();
