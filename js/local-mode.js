/* PNW-FILE-GUIDE
   js/local-mode.js — mode hotspot lokal (tanpa internet).
   Catatan: saat ini tidak dimuat di index.html; disiapkan untuk pemakaian khusus.
 */

/* ===================================================================
   HOSANA YOUTH TOOLS - MODE LOKAL (pengganti Firebase)
   -------------------------------------------------------------------
   Berkas ini HANYA dimuat ketika web disajikan oleh pnw-server.js dari
   jaringan lokal (hotspot tanpa internet). Di situs online berkas ini
   tidak pernah dipanggil sama sekali.

   Tugasnya: menyediakan objek window.firebase palsu yang meniru bagian
   Realtime Database yang dipakai app.js, tetapi datanya disimpan di
   server lokal dan disiarkan ke semua perangkat lewat SSE.
   =================================================================== */
(function () {
  "use strict";

  var mirror = {};
  var ready = false;
  var readyQueue = [];
  var listeners = [];
  var connListeners = [];
  var connected = false;

  function log() {
    try {
      console.log.apply(
        console,
        ["[Mode Lokal]"].concat([].slice.call(arguments)),
      );
    } catch (e) {}
  }

  function splitPath(p) {
    return String(p || "")
      .split("/")
      .filter(function (x) {
        return x !== "";
      });
  }

  function joinPath(p) {
    return splitPath(p).join("/");
  }

  function readPath(p) {
    var parts = splitPath(p);
    var cur = mirror;
    for (var i = 0; i < parts.length; i++) {
      if (cur === null || typeof cur !== "object") return null;
      cur = cur[parts[i]];
      if (cur === undefined) return null;
    }
    return cur === undefined ? null : cur;
  }

  function writeMirror(p, value) {
    var parts = splitPath(p);
    if (!parts.length) {
      mirror = value && typeof value === "object" ? value : {};
      return;
    }
    var cur = mirror;
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      if (cur[k] === null || typeof cur[k] !== "object") cur[k] = {};
      cur = cur[k];
    }
    var last = parts[parts.length - 1];
    if (value === null || value === undefined) delete cur[last];
    else cur[last] = value;
  }

  // sebuah listener terpengaruh bila path-nya sama, induk, atau anak dari path yang berubah
  function isAffected(listenPath, changedPath) {
    var a = joinPath(listenPath);
    var b = joinPath(changedPath);
    if (b === "") return true;
    return a === b || a.indexOf(b + "/") === 0 || b.indexOf(a + "/") === 0;
  }

  function makeSnap(p) {
    var value = readPath(p);
    return {
      val: function () {
        return value;
      },
      exists: function () {
        return value !== null && value !== undefined;
      },
      key: splitPath(p).pop() || null,
      child: function (k) {
        return makeSnap(joinPath(p) + "/" + k);
      },
      forEach: function (fn) {
        if (value && typeof value === "object") {
          Object.keys(value).forEach(function (k) {
            fn(makeSnap(joinPath(p) + "/" + k));
          });
        }
      },
    };
  }

  function fireFor(changedPath) {
    listeners.forEach(function (L) {
      if (isAffected(L.path, changedPath)) {
        try {
          L.cb(makeSnap(L.path));
        } catch (e) {
          log("listener error", e);
        }
      }
    });
  }

  function boolSnap(v) {
    return {
      val: function () {
        return v;
      },
      exists: function () {
        return true;
      },
    };
  }

  function setConnected(v) {
    connected = v;
    connListeners.forEach(function (cb) {
      try {
        cb(boolSnap(v));
      } catch (e) {}
    });
  }

  function api(url, body) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    })
      .then(function (r) {
        return r.json();
      })
      .catch(function (e) {
        log("gagal kirim ke server", e);
        return { ok: false };
      });
  }

  /* ---------------------- muat data awal ---------------------- */
  fetch("/api/state")
    .then(function (r) {
      return r.json();
    })
    .then(function (j) {
      mirror = j && typeof j === "object" ? j : {};
      ready = true;
      log("data awal dimuat dari server lokal");
      var q = readyQueue.splice(0);
      fireFor("");
      q.forEach(function (f) {
        try {
          f();
        } catch (e) {}
      });
      seedFromDevice();
    })
    .catch(function (e) {
      log("server lokal tidak menjawab", e);
      ready = true;
      fireFor("");
    });

  /* --------------------- siaran perubahan --------------------- */
  function openStream() {
    try {
      var es = new EventSource("/api/stream");
      es.onopen = function () {
        setConnected(true);
        log("tersambung ke server lokal");
      };
      es.onerror = function () {
        setConnected(false);
      };
      es.onmessage = function (ev) {
        var m = null;
        try {
          m = JSON.parse(ev.data);
        } catch (e) {
          return;
        }
        if (!m) return;
        if (m.type === "hello") {
          setConnected(true);
          return;
        }
        if (m.type === "set") {
          writeMirror(m.path, m.value === undefined ? null : m.value);
          fireFor(m.path);
        }
      };
    } catch (e) {
      log("EventSource tidak tersedia", e);
    }
  }
  openStream();

  /* ---- kirim data perangkat ini kalau server masih kosong ---- */
  function seedFromDevice() {
    try {
      var songs = readPath("pujianYouth/songs");
      var bank = readPath("pujianYouth/songBank");
      var localSongs = null;
      var localBank = null;
      // v62 - kunci penyimpanan yang benar (dulu salah tulis sehingga
      // data perangkat tidak pernah terbaca saat Mode Lokal menyalakan server)
      try {
        localSongs = JSON.parse(
          localStorage.getItem("pujianYouthChordSongs.v3") ||
            localStorage.getItem("pujianYouthSongs") ||
            "null",
        );
      } catch (e) {}
      try {
        localBank = JSON.parse(
          localStorage.getItem("pujianYouthSongBank.v1") ||
            localStorage.getItem("pujianYouthBank") ||
            "null",
        );
      } catch (e) {}
      var isEmpty = function (v) {
        return (
          !v ||
          (Array.isArray(v) && !v.length) ||
          (typeof v === "object" && !Object.keys(v).length)
        );
      };
      if (isEmpty(songs) && localSongs && localSongs.length) {
        log(
          "server masih kosong - mengunggah " +
            localSongs.length +
            " lagu dari perangkat ini",
        );
        setPathRemote("pujianYouth/songs", localSongs);
      }
      if (isEmpty(bank) && localBank && localBank.length) {
        log(
          "mengunggah " +
            localBank.length +
            " lagu Song Bank dari perangkat ini",
        );
        setPathRemote("pujianYouth/songBank", localBank);
      }
    } catch (e) {}
  }

  function setPathRemote(p, v) {
    writeMirror(p, v);
    fireFor(p);
    return api("/api/set", { path: joinPath(p), value: v });
  }

  /* ------------------- tiruan Firebase Ref -------------------- */
  function makeRef(p) {
    var full = joinPath(p);

    // ref khusus status koneksi
    if (full === ".info/connected" || full === ".info connected") {
      return {
        on: function (evt, cb) {
          if (typeof cb !== "function") return cb;
          connListeners.push(cb);
          setTimeout(function () {
            try {
              cb(boolSnap(connected));
            } catch (e) {}
          }, 0);
          return cb;
        },
        off: function () {
          connListeners.length = 0;
        },
        once: function () {
          return Promise.resolve(boolSnap(connected));
        },
      };
    }

    var ref = {
      key: splitPath(full).pop() || null,
      toString: function () {
        return "local://" + full;
      },
      child: function (k) {
        return makeRef(full + "/" + k);
      },
      parent: function () {
        var parts = splitPath(full);
        parts.pop();
        return makeRef(parts.join("/"));
      },
      on: function (evt, cb) {
        if (evt !== "value" || typeof cb !== "function") return cb;
        listeners.push({ path: full, cb: cb });
        if (ready) {
          setTimeout(function () {
            try {
              cb(makeSnap(full));
            } catch (e) {}
          }, 0);
        }
        return cb;
      },
      off: function (evt, cb) {
        listeners = listeners.filter(function (L) {
          return !(L.path === full && (!cb || L.cb === cb));
        });
      },
      once: function () {
        if (ready) return Promise.resolve(makeSnap(full));
        return new Promise(function (resolve) {
          readyQueue.push(function () {
            resolve(makeSnap(full));
          });
        });
      },
      set: function (v) {
        return setPathRemote(full, v === undefined ? null : v);
      },
      update: function (obj) {
        var cur = readPath(full);
        if (cur === null || typeof cur !== "object") cur = {};
        Object.keys(obj || {}).forEach(function (k) {
          if (obj[k] === null) delete cur[k];
          else cur[k] = obj[k];
        });
        writeMirror(full, cur);
        fireFor(full);
        return api("/api/update", { path: full, value: obj || {} });
      },
      remove: function () {
        return setPathRemote(full, null);
      },
      push: function (v) {
        var key =
          "-L" +
          Date.now().toString(36) +
          Math.random().toString(36).slice(2, 8);
        var childRef = makeRef(full + "/" + key);
        if (v !== undefined) childRef.set(v);
        return childRef;
      },
      transaction: function (fn) {
        var cur = readPath(full);
        var next;
        try {
          next = fn(cur);
        } catch (e) {
          next = cur;
        }
        if (next === undefined) next = cur;
        if (typeof cur === "number" || typeof next === "number") {
          var delta = Number(next || 0) - Number(cur || 0);
          writeMirror(full, Number(next || 0));
          fireFor(full);
          return api("/api/incr", { path: full, delta: delta }).then(
            function () {
              return { committed: true, snapshot: makeSnap(full) };
            },
          );
        }
        return setPathRemote(full, next).then(function () {
          return { committed: true, snapshot: makeSnap(full) };
        });
      },
    };
    return ref;
  }

  /* -------------------- tiruan Firebase Auth ------------------- */
  // Tanpa internet, autentikasi Google/Firebase mustahil.
  // Login tetap bisa lewat akun lokal yang sudah ada di app.js.
  function makeAuth() {
    var authObj = {
      currentUser: null,
      onAuthStateChanged: function (cb) {
        if (typeof cb === "function") {
          setTimeout(function () {
            try {
              cb(null);
            } catch (e) {}
          }, 0);
        }
        return function () {};
      },
      signInAnonymously: function () {
        return Promise.resolve({ user: null });
      },
      signOut: function () {
        return Promise.resolve();
      },
      createUserWithEmailAndPassword: function () {
        return Promise.reject(
          new Error(
            "Mode Lokal: pendaftaran akun butuh internet. Pakai login admin lokal.",
          ),
        );
      },
      signInWithEmailAndPassword: function () {
        return Promise.reject(
          new Error(
            "Mode Lokal: login email butuh internet. Pakai login admin lokal.",
          ),
        );
      },
      signInWithPopup: function () {
        return Promise.reject(
          new Error(
            "Mode Lokal: login Google butuh internet. Pakai login admin lokal.",
          ),
        );
      },
    };
    return authObj;
  }

  var authSingleton = makeAuth();
  var dbSingleton = {
    ref: function (p) {
      return makeRef(p);
    },
    goOnline: function () {},
    goOffline: function () {},
  };

  var shim = {
    __localMode: true,
    initializeApp: function () {
      return { name: "pnw-local" };
    },
    app: function () {
      return { name: "pnw-local" };
    },
    apps: [{ name: "pnw-local" }],
    database: function () {
      return dbSingleton;
    },
    auth: function () {
      return authSingleton;
    },
  };
  // sengaja TIDAK menyediakan firebase.auth.GoogleAuthProvider,
  // supaya app.js otomatis menyembunyikan tombol login Google.

  // Kunci objeknya: kalau ternyata perangkat masih punya data seluler dan
  // SDK Firebase asli sempat termuat, jangan sampai menimpa shim ini.
  try {
    Object.defineProperty(window, "firebase", {
      get: function () {
        return shim;
      },
      set: function () {
        /* abaikan SDK asli selama Mode Lokal */
      },
      configurable: false,
    });
  } catch (e) {
    window.firebase = shim;
  }

  window.__PNW_LOCAL = true;
  log("aktif - data disimpan di server laptop, bukan Firebase");
})();
