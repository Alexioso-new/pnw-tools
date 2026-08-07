/* PNW-FILE-GUIDE
   js/recorder.js — fitur Rekaman Latihan (window.PNWRec).
   Audio -> Firebase Storage path: recordings/<songId>/<recId>.<ext>.
   Metadata -> RTDB: pujianYouth/recordings/<songId>/<recId> (rules: .read true, .write auth).
   Edit (updateRecMeta) & hapus (deleteCloud) menulis ke RTDB -> terpantau semua member via watchCloud (ref.on value).
   Terhubung: js/app.js (window.pnwToast), css/design.css (.recDock, .recItem, .recEdit).
 */

/* PNW TOOLS v64 - Rekaman latihan per lagu
 * Simpan lokal (IndexedDB) + unggah online (Firebase Storage + indeks RTDB).
 * Rekaman online bisa dibuka & diunduh dari perangkat mana pun.
 * Dipakai lewat window.PNWRec
 */
(function () {
  "use strict";

  var DB_NAME = "pnwRecordings";
  var DB_VER = 1;
  var STORE = "rec";
  var CLOUD_PATH = "pujianYouth/recordings";
  var MAX_UPLOAD = 25 * 1024 * 1024; // 25 MB

  var _db = null;
  var _counts = {};
  var _openFor = null; // { id, title }
  var _dockFor = null; // { id, title }
  var _mr = null;
  var _chunks = [];
  var _startAt = 0;
  var _timerId = 0;
  var _stream = null;
  var _playingUrl = null;
  var _playingAudio = null;
  var _playingId = null;
  var _cloudCache = {}; // songId -> array meta
  var _watching = {}; // songId -> true

  function log() {
    try {
      if (window.PNWLog && window.PNWLog.debug)
        console.log.apply(console, arguments);
    } catch (e) {}
  }

  function toast(msg, type) {
    try {
      if (typeof window.pnwToast === "function")
        return window.pnwToast(msg, type);
    } catch (e) {}
    try {
      console.log("[rekaman] " + msg);
    } catch (e) {}
    return null;
  }

  /* ---------------- Firebase helpers ---------------- */
  function fb() {
    try {
      if (
        typeof firebase === "undefined" ||
        !firebase.apps ||
        !firebase.apps.length
      )
        return null;
      return firebase;
    } catch (e) {
      return null;
    }
  }

  function dbRefFor(songId) {
    var f = fb();
    if (!f || !f.database) return null;
    try {
      return f.database().ref(CLOUD_PATH + "/" + safeKey(songId));
    } catch (e) {
      return null;
    }
  }

  function storageAvail() {
    var f = fb();
    if (!f || typeof f.storage !== "function") return false;
    try {
      f.storage();
      return true;
    } catch (e) {
      return false;
    }
  }

  /* Status sinkronisasi online yang jujur — memberi tahu ALASAN bila masih lokal. */
  function cloudStatusText() {
    var f = fb();
    if (!f) return "Tidak ada koneksi · tersimpan di perangkat ini";
    if (!storageAvail())
      return "Penyimpanan online belum aktif (upgrade Blaze) · tersimpan di perangkat ini";
    var me = whoAmI();
    if (!me.uid) return "Masuk dulu agar rekaman ikut tersimpan online";
    return "Tersimpan online, bisa dibuka di perangkat lain";
  }

  function safeKey(v) {
    return String(v == null ? "lepas" : v).replace(/[.#$/\[\]]/g, "_");
  }

  function whoAmI() {
    var f = fb();
    try {
      var u = f && f.auth ? f.auth().currentUser : null;
      if (!u) return { uid: "", name: "" };
      return { uid: u.uid || "", name: u.displayName || u.email || "" };
    } catch (e) {
      return { uid: "", name: "" };
    }
  }

  /* ---------------- IndexedDB ---------------- */
  function openDb() {
    return new Promise(function (resolve, reject) {
      if (_db) return resolve(_db);
      if (!window.indexedDB)
        return reject(new Error("IndexedDB tidak tersedia"));
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
            size: v.blob ? v.blob.size : v.size || 0,
            type: v.type,
            url: v.url || "",
            path: v.path || "",
            synced: !!v.url,
            local: true,
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

  /* ---------------- cloud index ---------------- */
  function cloudList(songId) {
    var ref = dbRefFor(songId);
    if (!ref) return Promise.resolve([]);
    return ref
      .once("value")
      .then(function (snap) {
        var v = snap.val() || {};
        var out = [];
        Object.keys(v).forEach(function (k) {
          var r = v[k] || {};
          out.push({
            id: k,
            songId: String(songId),
            songTitle: r.songTitle || "",
            name: r.name || "Rekaman",
            note: r.note || "",
            ts: r.ts || 0,
            dur: r.dur || 0,
            size: r.size || 0,
            type: r.type || "audio/webm",
            url: r.url || "",
            path: r.path || "",
            by: r.byName || "",
            synced: true,
            cloud: true,
          });
        });
        _cloudCache[String(songId)] = out;
        return out;
      })
      .catch(function () {
        return _cloudCache[String(songId)] || [];
      });
  }

  function watchCloud(songId, cb) {
    var key = String(songId);
    var ref = dbRefFor(songId);
    if (!ref || _watching[key]) return;
    _watching[key] = true;
    try {
      ref.on("value", function () {
        cloudList(songId).then(function () {
          if (typeof cb === "function") cb();
        });
      });
    } catch (e) {
      _watching[key] = false;
    }
  }

  function uploadRec(rec) {
    if (!storageAvail()) return Promise.resolve(null);
    if (!rec || !rec.blob) return Promise.resolve(null);
    if (rec.blob.size > MAX_UPLOAD) {
      toast(
        "Rekaman terlalu besar untuk diunggah, disimpan lokal saja.",
        "info",
      );
      return Promise.resolve(null);
    }
    var f = fb();
    var me = whoAmI();
    var path =
      "recordings/" +
      safeKey(rec.songId) +
      "/" +
      rec.id +
      "." +
      extFor(rec.type);
    var sref;
    try {
      sref = f.storage().ref(path);
    } catch (e) {
      return Promise.resolve(null);
    }
    return sref
      .put(rec.blob, { contentType: rec.type || "audio/webm" })
      .then(function () {
        return sref.getDownloadURL();
      })
      .then(function (url) {
        var meta = {
          name: rec.name,
          songTitle: rec.songTitle || "",
          ts: rec.ts,
          dur: rec.dur,
          size: rec.blob.size,
          type: rec.type,
          url: url,
          path: path,
          note: rec.note || "",
          by: me.uid,
          byName: me.name,
        };
        var ref = dbRefFor(rec.songId);
        if (!ref) return url;
        return ref
          .child(rec.id)
          .set(meta)
          .then(function () {
            return url;
          });
      })
      .catch(function (err) {
        log("upload gagal", err);
        return null;
      });
  }

  function deleteCloud(rec) {
    var jobs = [];
    var ref = dbRefFor(rec.songId);
    if (ref)
      jobs.push(
        ref
          .child(rec.id)
          .remove()
          .catch(function () {}),
      );
    if (rec.path && storageAvail()) {
      try {
        jobs.push(
          fb()
            .storage()
            .ref(rec.path)
            .delete()
            .catch(function () {}),
        );
      } catch (e) {}
    }
    return Promise.all(jobs);
  }

  /* Ubah judul + keterangan rekaman. Menyimpan ke IndexedDB (lokal) DAN
   * RTDB (online), sehingga hasil edit terlihat oleh semua member yang
   * memantau lewat watchCloud(). Terhubung: rules RTDB node 'recordings'. */
  function updateRecMeta(rec, fields) {
    var jobs = [];
    jobs.push(
      getBlob(rec.id).then(function (full) {
        if (!full) return null;
        if (fields.name != null) full.name = fields.name;
        if (fields.note != null) full.note = fields.note;
        return putRecord(full);
      }),
    );
    var ref = dbRefFor(rec.songId);
    if (ref && (rec.cloud || rec.url)) {
      var upd = {};
      if (fields.name != null) upd.name = fields.name;
      if (fields.note != null) upd.note = fields.note;
      jobs.push(
        ref
          .child(rec.id)
          .update(upd)
          .catch(function () {}),
      );
    }
    return Promise.all(jobs);
  }

  /* ---------------- merged list ---------------- */
  function mergedList(songId) {
    var sid = String(songId == null ? "lepas" : songId);
    return Promise.all([allRecords(), cloudList(sid)]).then(function (res) {
      var local = res[0].filter(function (r) {
        return String(r.songId) === sid;
      });
      var cloud = res[1];
      var byId = {};
      cloud.forEach(function (r) {
        byId[r.id] = r;
      });
      local.forEach(function (r) {
        if (byId[r.id]) {
          byId[r.id].local = true;
          byId[r.id].size = byId[r.id].size || r.size;
        } else {
          byId[r.id] = r;
        }
      });
      return Object.keys(byId)
        .map(function (k) {
          return byId[k];
        })
        .sort(function (a, b) {
          return (b.ts || 0) - (a.ts || 0);
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
        Object.keys(_cloudCache).forEach(function (sid) {
          var seen = {};
          (_cloudCache[sid] || []).forEach(function (r) {
            seen[r.id] = true;
          });
          var extra = Object.keys(seen).length;
          if (extra > (m[sid] || 0)) m[sid] = extra;
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
      return (
        p(d.getDate()) +
        "/" +
        p(d.getMonth() + 1) +
        " " +
        p(d.getHours()) +
        ":" +
        p(d.getMinutes())
      );
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
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(opts[i]))
          return opts[i];
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

  function fileNameFor(r) {
    var safe =
      String(r.songTitle || "lagu")
        .replace(/[^\w\- ]+/g, "")
        .trim() || "lagu";
    return safe + " - " + (r.name || "rekaman") + "." + extFor(r.type);
  }

  /* ---------------- playback ---------------- */
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
    _playingId = null;
    Array.prototype.forEach.call(
      document.querySelectorAll(".recItem.playing"),
      function (n) {
        n.classList.remove("playing");
      },
    );
  }

  function srcFor(rec) {
    return getBlob(rec.id).then(function (full) {
      if (full && full.blob) {
        _playingUrl = URL.createObjectURL(full.blob);
        return _playingUrl;
      }
      if (rec.url) return rec.url;
      return null;
    });
  }

  function playRec(rec, itemEl) {
    var wasPlaying = _playingId === rec.id;
    stopPlayback();
    if (wasPlaying) return;
    srcFor(rec).then(function (src) {
      if (!src) return toast("Rekaman tidak tersedia.", "error");
      _playingAudio = new Audio(src);
      _playingId = rec.id;
      if (itemEl) itemEl.classList.add("playing");
      _playingAudio.onended = stopPlayback;
      _playingAudio.onerror = function () {
        stopPlayback();
        toast("Tidak bisa memutar rekaman.", "error");
      };
      _playingAudio.play().catch(function () {
        stopPlayback();
        toast("Tidak bisa memutar rekaman.", "error");
      });
    });
  }

  function triggerDownload(blobOrUrl, filename) {
    var isBlob = blobOrUrl instanceof Blob;
    var url = isBlob ? URL.createObjectURL(blobOrUrl) : blobOrUrl;
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      try {
        document.body.removeChild(a);
      } catch (e) {}
      if (isBlob) URL.revokeObjectURL(url);
    }, 800);
  }

  function downloadRec(rec) {
    getBlob(rec.id).then(function (full) {
      if (full && full.blob)
        return triggerDownload(full.blob, fileNameFor(rec));
      if (!rec.url) return toast("Rekaman tidak tersedia.", "error");
      fetch(rec.url)
        .then(function (r) {
          if (!r.ok) throw new Error("http " + r.status);
          return r.blob();
        })
        .then(function (b) {
          triggerDownload(b, fileNameFor(rec));
        })
        .catch(function () {
          window.open(rec.url, "_blank", "noopener");
        });
    });
  }

  /* ---------------- row builder (dipakai modal & dok) ---------------- */
  function buildRow(r, onChange) {
    var row = document.createElement("div");
    row.className = "recItem";
    row.dataset.id = r.id;
    if (_playingId === r.id) row.classList.add("playing");

    var play = document.createElement("button");
    play.type = "button";
    play.className = "recPlay";
    play.setAttribute("aria-label", "Putar rekaman");
    play.onclick = function () {
      playRec(r, row);
    };

    var mid = document.createElement("div");
    mid.className = "recInfo";

    var nm = document.createElement("span");
    nm.className = "recName";
    nm.textContent = r.name || "Rekaman";

    var meta = document.createElement("span");
    meta.className = "recItemMeta";
    var bits = [fmtDur(r.dur), fmtSize(r.size), fmtDate(r.ts)];
    if (r.by) bits.push(r.by);
    meta.textContent = bits.join(" \u00b7 ");

    mid.appendChild(nm);
    mid.appendChild(meta);
    if (r.note) {
      var nt = document.createElement("span");
      nt.className = "recItemNote";
      nt.textContent = r.note;
      mid.appendChild(nt);
    }

    var tag = document.createElement("span");
    tag.className = "recTag " + (r.synced ? "isOnline" : "isLocal");
    tag.textContent = r.synced ? "Online" : "Lokal";

    var edit = document.createElement("button");
    edit.type = "button";
    edit.className = "recMini";
    edit.textContent = "Edit";
    edit.title = "Ubah judul & keterangan";
    edit.onclick = function () {
      openRecEditor(row, r, onChange);
    };

    var dl = document.createElement("button");
    dl.type = "button";
    dl.className = "recMini";
    dl.textContent = "Unduh";
    dl.onclick = function () {
      downloadRec(r);
    };

    var del = document.createElement("button");
    del.type = "button";
    del.className = "recMini danger";
    del.textContent = "Hapus";
    del.onclick = function () {
      if (
        !confirm(
          'Hapus rekaman "' +
            (r.name || "") +
            '"? Rekaman ini juga terhapus di perangkat anggota lain.',
        )
      )
        return;
      if (_playingId === r.id) stopPlayback();
      var jobs = [delRecord(r.id)];
      if (r.cloud || r.url) jobs.push(deleteCloud(r));
      Promise.all(jobs).then(refreshCounts).then(onChange);
    };

    row.appendChild(play);
    row.appendChild(mid);
    row.appendChild(tag);
    row.appendChild(edit);
    row.appendChild(dl);
    row.appendChild(del);
    return row;
  }

  /* Form edit inline di dalam baris: judul + keterangan. */
  function openRecEditor(row, r, onChange) {
    row.innerHTML = "";
    row.classList.add("editing");

    var form = document.createElement("div");
    form.className = "recEdit";

    var fName = document.createElement("input");
    fName.type = "text";
    fName.className = "recEditInput";
    fName.placeholder = "Judul rekaman";
    fName.value = r.name || "";

    var fNote = document.createElement("input");
    fNote.type = "text";
    fNote.className = "recEditInput";
    fNote.placeholder = "Keterangan (opsional) - mis. take 2, tempo 90";
    fNote.value = r.note || "";

    var actions = document.createElement("div");
    actions.className = "recEditActions";

    var save = document.createElement("button");
    save.type = "button";
    save.className = "recMini primary";
    save.textContent = "Simpan";

    var cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "recMini";
    cancel.textContent = "Batal";

    save.onclick = function () {
      var name = fName.value.trim();
      var note = fNote.value.trim();
      if (!name) {
        toast("Judul tidak boleh kosong.", "error");
        return;
      }
      updateRecMeta(r, { name: name, note: note })
        .then(function () {
          toast("Rekaman diperbarui untuk semua anggota.", "success");
        })
        .then(onChange);
    };
    cancel.onclick = function () {
      onChange();
    };

    actions.appendChild(save);
    actions.appendChild(cancel);
    form.appendChild(fName);
    form.appendChild(fNote);
    form.appendChild(actions);
    row.appendChild(form);
    try {
      fName.focus();
    } catch (e) {}
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
      "    <div>",
      '      <p class="recTitle" id="recSongTitle">Lagu</p>',
      '      <p class="recSub" id="recSub">Tersimpan online</p>',
      "    </div>",
      '    <button class="recX" id="recClose" type="button" aria-label="Tutup">&times;</button>',
      "  </div>",
      '  <div class="recStage">',
      '    <button class="recDot" id="recDot" type="button" aria-label="Mulai merekam"><span class="recDotIn"></span></button>',
      '    <div class="recMeta">',
      '      <span class="recTime" id="recTime">0:00</span>',
      '      <span class="recHint" id="recHint">Tekan untuk merekam</span>',
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
    el.sub = back.querySelector("#recSub");
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
    if (el.back) {
      el.back.classList.toggle("isRec", !!on);
      el.hint.textContent = on
        ? "Merekam \u2014 tekan untuk berhenti"
        : "Tekan untuk merekam";
      el.dot.setAttribute(
        "aria-label",
        on ? "Berhenti merekam" : "Mulai merekam",
      );
    }
    var dock = document.getElementById("recDock");
    if (dock) {
      dock.classList.toggle("isRec", !!on);
      var db = dock.querySelector("#recDockBtn");
      if (db) {
        db.classList.toggle("isRec", !!on);
        db.setAttribute(
          "aria-label",
          on ? "Berhenti merekam" : "Mulai merekam",
        );
      }
      var dt = dock.querySelector("#recDockTime");
      if (dt) dt.classList.toggle("isRec", !!on);
    }
  }

  function tick() {
    if (!_startAt) return;
    var t = fmtDur(Date.now() - _startAt);
    if (el.time) el.time.textContent = t;
    var dt = document.getElementById("recDockTime");
    if (dt) dt.textContent = t;
  }

  /* ---------------- rekam ---------------- */
  function targetSong() {
    return _openFor || _dockFor || { id: "lepas", title: "Tanpa lagu" };
  }

  function startRec() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast("Browser ini tidak mendukung perekaman suara.", "error");
      return;
    }
    if (!window.MediaRecorder) {
      toast("Browser ini belum mendukung MediaRecorder.", "error");
      return;
    }
    if (!window.isSecureContext && location.hostname !== "localhost") {
      toast("Mikrofon butuh koneksi HTTPS.", "error");
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
          _mr = mime
            ? new MediaRecorder(stream, { mimeType: mime })
            : new MediaRecorder(stream);
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
          if (el.time) el.time.textContent = "0:00";
          var dt = document.getElementById("recDockTime");
          if (dt) dt.textContent = "0:00";
          try {
            if (_stream)
              _stream.getTracks().forEach(function (t) {
                t.stop();
              });
          } catch (e) {}
          _stream = null;
          if (!blob.size || dur < 700) {
            toast("Rekaman terlalu pendek, tidak disimpan.", "info");
            return;
          }
          var song = targetSong();
          var rec = {
            id: "r" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
            songId: String(song.id),
            songTitle: song.title,
            name: "Latihan " + fmtDate(Date.now()),
            ts: Date.now(),
            dur: dur,
            type: type,
            blob: blob,
            url: "",
            path: "",
          };
          putRecord(rec)
            .then(function () {
              toast("Rekaman disimpan (" + fmtDur(dur) + ").", "success");
              renderAll();
              return uploadRec(rec);
            })
            .then(function (url) {
              if (url) {
                rec.url = url;
                rec.path =
                  "recordings/" +
                  safeKey(rec.songId) +
                  "/" +
                  rec.id +
                  "." +
                  extFor(rec.type);
                return putRecord(rec).then(function () {
                  toast("Rekaman tersimpan online.", "success");
                });
              }
              toast(
                "Tersimpan di perangkat. " +
                  (storageAvail()
                    ? "Masuk dulu agar ikut online."
                    : "Aktifkan Blaze agar bisa online."),
                "info",
              );
            })
            .then(refreshCounts)
            .then(renderAll)
            .catch(function (err) {
              toast(
                "Gagal menyimpan rekaman: " +
                  (err && err.message ? err.message : err),
                "error",
              );
            });
        };
        _mr.start();
        _startAt = Date.now();
        setRecordingUi(true);
        tick();
        _timerId = setInterval(tick, 250);
      })
      .catch(function (err) {
        var n = err && err.name;
        var m =
          n === "NotAllowedError"
            ? "Izin mikrofon ditolak. Aktifkan izin mikrofon untuk situs ini."
            : n === "NotFoundError"
              ? "Mikrofon tidak ditemukan di perangkat ini."
              : "Tidak bisa mengakses mikrofon: " +
                (err && err.message ? err.message : err);
        toast(m, "error");
      });
  }

  function stopRec() {
    try {
      if (_mr && _mr.state === "recording") _mr.stop();
    } catch (e) {}
  }

  /* ---------------- render modal ---------------- */
  function renderList() {
    if (!el.list) return Promise.resolve();
    var song = _openFor || { id: "lepas" };
    return mergedList(song.id).then(function (mine) {
      el.list.innerHTML = "";
      if (!mine.length) {
        var p = document.createElement("p");
        p.className = "recEmpty";
        p.textContent = "Belum ada rekaman untuk lagu ini.";
        el.list.appendChild(p);
      }
      mine.forEach(function (r) {
        el.list.appendChild(buildRow(r, renderAll));
      });
      if (el.note) {
        var online = mine.filter(function (r) {
          return r.synced;
        }).length;
        el.note.textContent =
          mine.length + " rekaman \u00b7 " + online + " online";
      }
      if (el.sub) {
        el.sub.textContent = cloudStatusText();
      }
    });
  }

  /* ---------------- dok di bawah pemutar ---------------- */
  function renderDock() {
    var dock = document.getElementById("recDock");
    if (!dock || !_dockFor) return Promise.resolve();
    var list = dock.querySelector("#recDockList");
    var cnt = dock.querySelector("#recDockCount");
    if (!list) return Promise.resolve();
    return mergedList(_dockFor.id).then(function (mine) {
      list.innerHTML = "";
      if (!mine.length) {
        var p = document.createElement("p");
        p.className = "recEmpty";
        p.textContent = "Belum ada rekaman. Tekan tombol rekam untuk mulai.";
        list.appendChild(p);
      }
      mine.forEach(function (r) {
        list.appendChild(buildRow(r, renderAll));
      });
      if (cnt) {
        var online = mine.filter(function (r) {
          return r.synced;
        }).length;
        cnt.textContent = mine.length
          ? mine.length + " rekaman \u00b7 " + online + " online"
          : "";
      }
    });
  }

  function renderAll() {
    return Promise.all([renderList(), renderDock()]);
  }

  function mountDock(songId, songTitle) {
    var dock = document.getElementById("recDock");
    if (!dock) return;
    _dockFor = {
      id: songId == null ? "lepas" : songId,
      title: songTitle || "Lagu",
    };
    if (!dock.dataset.built) {
      dock.dataset.built = "1";
      dock.innerHTML = [
        '<div class="recDockHead">',
        '  <button class="recDockBtn" id="recDockBtn" type="button" aria-label="Mulai merekam"><span class="recDotIn"></span></button>',
        '  <div class="recDockLbl">',
        "    <span>Rekaman latihan</span>",
        '    <span class="recDockCount" id="recDockCount"></span>',
        "  </div>",
        '  <span class="recDockTime" id="recDockTime">0:00</span>',
        '  <button class="recDockMore" id="recDockMore" type="button">Kelola</button>',
        "</div>",
        '<div class="recDockList" id="recDockList"></div>',
      ].join("");
      dock.querySelector("#recDockBtn").onclick = function () {
        if (_mr && _mr.state === "recording") stopRec();
        else startRec();
      };
      dock.querySelector("#recDockMore").onclick = function () {
        open(_dockFor.id, _dockFor.title);
      };
    }
    watchCloud(_dockFor.id, renderAll);
    renderDock();
  }

  function open(songId, songTitle) {
    buildPanel();
    _openFor = {
      id: songId == null ? "lepas" : songId,
      title: songTitle || "Lagu",
    };
    el.title.textContent = _openFor.title;
    el.time.textContent = "0:00";
    setRecordingUi(false);
    el.back.classList.add("show");
    el.back.classList.add("open");
    document.body.classList.add("noScroll");
    watchCloud(_openFor.id, renderAll);
    renderList();
  }

  function close() {
    stopRec();
    stopPlayback();
    if (el.back) {
      el.back.classList.remove("show");
      el.back.classList.remove("open");
    }
    document.body.classList.remove("noScroll");
    _openFor = null;
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
    mountDock: mountDock,
    render: renderAll,
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
