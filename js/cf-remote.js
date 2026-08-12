/* PNW-FILE-GUIDE: js/cf-remote.js — CastFlow Remote Control + Stage Message (v105 / v9.5)
   Tiga peran dalam satu berkas, dipilih dari URL:
   1. ?mode=remote  -> panel Remote Control (HP/tablet): Prev/Next/GoLive/Black/Logo/Clear
      + kirim Stage Message. Menulis perintah ke RTDB pujianYouth/youthviews/remote.
   2. Halaman operator (castflow.html biasa) -> mendengar kanal remote, mengeksekusi
      perintah lewat PNWProjector.__remote + window.__cfRemoteActions, dedupe by id.
   3. ?mode=stage -> mendengar pujianYouth/youthviews/stagemsg dan menampilkan
      overlay pesan panggung (tanpa login, .read: true di rules v105). */
(function () {
  "use strict";

  var VERSION = "v9.5-remote";
  var REMOTE_PATH = "pujianYouth/youthviews/remote";
  var MSG_PATH = "pujianYouth/youthviews/stagemsg";
  var LAST_KEY = "pnwCastflowRemoteLast.v1";

  var IS_REMOTE = /[?&]mode=remote/.test(location.search);
  var IS_STAGE = /[?&]mode=stage/.test(location.search);
  var IS_DISPLAY = /[?&]mode=(display|youthviews|youth-views|views)/.test(
    location.search,
  );

  function q(s, r) {
    return (r || document).querySelector(s);
  }
  function el(id) {
    return document.getElementById(id);
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
  function log(feat, msg) {
    try {
      if (window.PNWLog && window.PNWLog.event)
        window.PNWLog.event(feat, msg);
    } catch (e) {}
  }
  function dbRef(path) {
    try {
      if (
        typeof firebase !== "undefined" &&
        firebase.apps &&
        firebase.apps.length
      )
        return firebase.database().ref(path);
    } catch (e) {}
    return null;
  }

  /* ================= EKSEKUSI PERINTAH (dipakai operator & QA) ================= */
  function exec(cmd) {
    if (!cmd || !cmd.cmd) return false;
    var c = String(cmd.cmd);
    /* Dedupe + anti-basi: satu id hanya dieksekusi sekali, dan perintah
       lebih tua dari 30 detik diabaikan (mis. burst saat reconnect). */
    if (cmd.id) {
      if (String(cmd.id) === lastSeenId()) return false;
      if (cmd.t && Date.now() - cmd.t > 30000) return false;
      markSeen(String(cmd.id));
    }
    var P = window.PNWProjector;
    var R = (P && P.__remote) || {};
    var A = window.__cfRemoteActions || {};
    var ok = false;
    try {
      if (c === "next" && R.step) {
        R.step(1);
        ok = true;
      } else if (c === "prev" && R.step) {
        R.step(-1);
        ok = true;
      } else if (c === "golive" && R.goLive) {
        R.goLive();
        ok = true;
      } else if (c === "clear") {
        if (A.clear) A.clear();
        else if (R.clear) R.clear();
        ok = true;
      } else if (c === "black" && A.black) {
        A.black();
        ok = true;
      } else if (c === "logo" && A.logo) {
        A.logo();
        ok = true;
      }
    } catch (e) {
      log("remote.exec", String(e));
      return false;
    }
    if (ok) {
      log("remote.exec", c);
      try {
        if (window.CastFlowKernel && window.CastFlowKernel.store)
          window.CastFlowKernel.store.set("diagnostics", {
            remoteLast: c,
            remoteAt: Date.now(),
          });
      } catch (e) {}
    }
    return ok;
  }

  /* ================= OVERLAY STAGE MESSAGE (mode=stage & QA) ================= */
  function renderStageMsg(m) {
    var host = el("displayScreen") || document.body;
    var ov = el("cfStageMsg");
    if (!m || !m.active || !m.text) {
      if (ov) ov.classList.remove("on");
      return;
    }
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "cfStageMsg";
      host.appendChild(ov);
    }
    ov.innerHTML = '<div class="cfStageMsgBox">' + esc(m.text) + "</div>";
    ov.classList.add("on");
  }

  /* ================= MODE STAGE: dengarkan stagemsg ================= */
  function bootStageMsg() {
    var ref = dbRef(MSG_PATH);
    if (!ref) return;
    ref.on(
      "value",
      function (snap) {
        renderStageMsg(snap.val());
      },
      function () {},
    );
  }

  /* ================= OPERATOR: dengarkan kanal remote ================= */
  function lastSeenId() {
    try {
      return localStorage.getItem(LAST_KEY) || "";
    } catch (e) {
      return "";
    }
  }
  function markSeen(id) {
    try {
      localStorage.setItem(LAST_KEY, id);
    } catch (e) {}
  }
  function bootOperator() {
    var ref = dbRef(REMOTE_PATH);
    if (!ref) return;
    ref.limitToLast(1).on(
      "child_added",
      function (snap) {
        var v = snap.val();
        if (!v || !v.cmd || !v.id) return;
        exec(v); // dedupe + anti-basi ada di dalam exec()
      },
      function () {},
    );
  }

  /* ================= MODE REMOTE: panel kontrol ================= */
  var _remoteRef = null;
  var _uid = "";

  function send(cmd, data) {
    if (!_remoteRef) {
      setStatus("Belum terhubung", false);
      return false;
    }
    var payload = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      cmd: cmd,
      t: Date.now(),
      by: _uid || "anon",
    };
    if (data) payload.data = data;
    try {
      var w = _remoteRef.set(payload);
      if (w && w.catch)
        w.catch(function (err) {
          setStatus("Ditolak: " + String((err && err.code) || err), false);
        });
      setStatus("Terkirim: " + cmd, true);
      return true;
    } catch (e) {
      setStatus("Gagal: " + String(e), false);
      return false;
    }
  }

  function sendMsg(text) {
    var ref = dbRef(MSG_PATH);
    if (!ref) {
      setStatus("Belum terhubung", false);
      return;
    }
    try {
      ref.set({ active: !!text, text: text || "", t: Date.now(), by: _uid });
      setStatus(text ? "Pesan panggung terkirim" : "Pesan panggung dihapus", true);
    } catch (e) {
      setStatus("Gagal kirim pesan", false);
    }
  }

  function setStatus(txt, ok) {
    var s = el("cfRemStatus");
    if (s) {
      s.textContent = txt;
      s.className = "cfRemStatus " + (ok ? "ok" : "bad");
    }
  }

  function buildRemoteUI() {
    document.body.classList.add("remote-mode");
    var wrap = document.createElement("div");
    wrap.id = "cfRemote";
    wrap.innerHTML =
      '<div class="cfRemHead">' +
      '<img src="./castflow-topbar.png" alt="CastFlow" class="cfRemLogo">' +
      '<div class="cfRemTitle">REMOTE</div>' +
      "</div>" +
      '<div id="cfRemAuth" class="cfRemAuth">' +
      '<button id="cfRemLogin" type="button" class="cfRemBtn cfRemPrimary">Sign in dengan Google</button>' +
      '<p class="cfRemHint">Login akun pengurus untuk memakai remote.</p>' +
      "</div>" +
      '<div id="cfRemPanel" class="cfRemPanel" hidden>' +
      '<div id="cfRemStatus" class="cfRemStatus">Menghubungkan…</div>' +
      '<div class="cfRemGrid">' +
      '<button type="button" class="cfRemBtn" data-cmd="prev">◀ Prev</button>' +
      '<button type="button" class="cfRemBtn" data-cmd="next">Next ▶</button>' +
      '<button type="button" class="cfRemBtn cfRemPrimary" data-cmd="golive">Go Live</button>' +
      '<button type="button" class="cfRemBtn" data-cmd="clear">Clear</button>' +
      '<button type="button" class="cfRemBtn" data-cmd="black">Black</button>' +
      '<button type="button" class="cfRemBtn" data-cmd="logo">Logo</button>' +
      "</div>" +
      '<div class="cfRemMsg">' +
      '<div class="cfRemMsgTitle">STAGE MESSAGE</div>' +
      '<input id="cfRemMsgIn" type="text" maxlength="120" placeholder="Pesan ke panggung…">' +
      '<div class="cfRemMsgOps">' +
      '<button id="cfRemMsgSend" type="button" class="cfRemBtn cfRemPrimary">Kirim</button>' +
      '<button id="cfRemMsgClear" type="button" class="cfRemBtn">Hapus</button>' +
      "</div></div>" +
      '<div id="cfRemNow" class="cfRemNow"></div>' +
      "</div>";
    document.body.appendChild(wrap);

    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cmd]");
      if (b) send(b.getAttribute("data-cmd"));
    });
    el("cfRemMsgSend").onclick = function () {
      sendMsg((el("cfRemMsgIn").value || "").trim());
    };
    el("cfRemMsgClear").onclick = function () {
      el("cfRemMsgIn").value = "";
      sendMsg("");
    };
    el("cfRemLogin").onclick = function () {
      try {
        firebase
          .auth()
          .signInWithPopup(new firebase.auth.GoogleAuthProvider());
      } catch (e) {
        setStatus("Login gagal: " + String(e), false);
      }
    };

    try {
      firebase.auth().onAuthStateChanged(function (u) {
        var authed = !!u;
        el("cfRemAuth").hidden = authed;
        el("cfRemPanel").hidden = !authed;
        if (authed) {
          _uid = u.uid || "";
          _remoteRef = dbRef(REMOTE_PATH);
          setStatus(_remoteRef ? "Terhubung" : "Firebase belum siap", !!_remoteRef);
          // Info lagu aktif untuk operator remote
          var live = dbRef("pujianYouth/youthviews/live");
          if (live)
            live.on("value", function (snap) {
              var v = snap.val();
              var n = el("cfRemNow");
              if (n)
                n.textContent =
                  v && v.active
                    ? "Live: " + (v.songTitle || v.kind || "") +
                      (v.label ? " · " + v.label : "")
                    : "Layar kosong";
            });
        }
      });
    } catch (e) {
      setStatus("Auth tidak tersedia", false);
    }
  }

  /* ================= boot ================= */
  function boot() {
    if (IS_REMOTE) buildRemoteUI();
    else if (IS_STAGE) bootStageMsg();
    else if (!IS_DISPLAY && el("projPage")) bootOperator();
  }

  window.CastFlowRemote = {
    version: VERSION,
    send: send,
    exec: exec,
    _exec: exec,
    _renderStageMsg: renderStageMsg,
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
