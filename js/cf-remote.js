/* PNW-FILE-GUIDE: js/cf-remote.js — CastFlow Remote Control + Stage Message + Timer (v107 / v9.7)
   Tiga peran dalam satu berkas, dipilih dari URL:
   1. ?mode=remote  -> panel Remote Control (HP/tablet): Prev/Next/GoLive/Black/Logo/Clear
      + kirim Stage Message. Menulis perintah ke RTDB pujianYouth/youthviews/remote.
   2. Halaman operator (castflow.html biasa) -> mendengar kanal remote, mengeksekusi
      perintah lewat PNWProjector.__remote + window.__cfRemoteActions, dedupe by id.
   3. ?mode=stage -> mendengar pujianYouth/youthviews/stagemsg dan menampilkan
      overlay pesan panggung + timer panggung (tanpa login, .read: true di
      rules v105). Pesan & timer berbagi node stagemsg via update(). */
(function () {
  "use strict";

  var VERSION = "v9.7-remote";
  var REMOTE_PATH = "pujianYouth/youthviews/remote";
  var MSG_PATH = "pujianYouth/youthviews/stagemsg";
  var LAST_KEY = "pnwCastflowRemoteLast.v1";
  /* v107: preset pesan panggung sekali-tap (bisa diedit di sini). */
  var MSG_PRESETS = [
    "Ulangi Chorus",
    "Ulangi Verse",
    "Naik 1 Nada",
    "Turun 1 Nada",
    "Acapella",
    "Instrumen Saja",
    "Sekali Lagi",
    "Bersiap Closing",
  ];

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

  /* ========== OVERLAY STAGE MESSAGE + TIMER (mode=stage & QA) ========== */
  var _msgHideAt = null; // timeout auto-hide pesan (field until)
  var _stageTimer = null; // payload timer terakhir
  var _tickTimer = null; // interval 500 mdtk penggerak timer

  function _fmtClock(d) {
    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }
  function _fmtDur(sec) {
    var neg = sec < 0;
    var a = Math.abs(Math.round(sec));
    return (
      (neg ? "-" : "") +
      ("0" + Math.floor(a / 60)).slice(-2) +
      ":" +
      ("0" + (a % 60)).slice(-2)
    );
  }
  function _tickStageTimer() {
    var pill = el("cfStageTimer");
    var t = _stageTimer;
    if (!pill || !t) return;
    var now = Date.now();
    var over = false;
    var txt = "";
    if (t.mode === "clock") txt = _fmtClock(new Date(now));
    else if (t.mode === "down" && t.endsAt) {
      var rem = Math.round((t.endsAt - now) / 1000);
      over = rem < 0; // lewat nol: lanjut menghitung naik sebagai overrun (merah)
      txt = (over ? "▲ " : "▼ ") + _fmtDur(rem);
    } else if (t.mode === "up" && t.startedAt)
      txt = "▲ " + _fmtDur((now - t.startedAt) / 1000);
    pill.textContent = txt;
    pill.classList.toggle("over", over);
  }
  function _paintStageTimer(t) {
    _stageTimer = t && t.mode && t.mode !== "off" ? t : null;
    var pill = el("cfStageTimer");
    if (!_stageTimer) {
      if (pill) pill.classList.remove("on");
      if (_tickTimer) {
        clearInterval(_tickTimer);
        _tickTimer = null;
      }
      return;
    }
    var host = el("displayScreen") || document.body;
    if (!pill) {
      pill = document.createElement("div");
      pill.id = "cfStageTimer";
      host.appendChild(pill);
    }
    pill.classList.add("on");
    _tickStageTimer();
    if (!_tickTimer) _tickTimer = setInterval(_tickStageTimer, 500);
  }
  function renderStageMsg(m) {
    var host = el("displayScreen") || document.body;
    var ov = el("cfStageMsg");
    var expired = !!(m && m.until && Date.now() > m.until);
    var showMsg = !!(m && m.active && m.text && !expired);
    if (!showMsg) {
      if (ov) ov.classList.remove("on");
    } else {
      if (!ov) {
        ov = document.createElement("div");
        ov.id = "cfStageMsg";
        host.appendChild(ov);
      }
      ov.innerHTML =
        '<div class="cfStageMsgBox' +
        (m.flash ? " flash" : "") +
        '">' +
        esc(m.text) +
        "</div>";
      ov.classList.add("on");
      if (m.until) {
        if (_msgHideAt) clearTimeout(_msgHideAt);
        _msgHideAt = setTimeout(function () {
          renderStageMsg(m);
        }, Math.max(250, m.until - Date.now()));
      }
    }
    _paintStageTimer(m && m.timer);
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
    ref.on(
      "value",
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

  /* v107: payload pesan & timer dibangun murni (diekspor untuk QA), lalu
     ditulis via update() supaya pesan dan timer TIDAK saling menimpa. */
  function msgPayload(text, opts) {
    opts = opts || {};
    return {
      active: !!text,
      text: text || "",
      flash: !!(text && opts.flash),
      until: text && opts.autoSec ? Date.now() + opts.autoSec * 1000 : null,
      t: Date.now(),
      by: _uid || "anon",
    };
  }
  function timerPayload(mode, mins) {
    var now = Date.now();
    if (mode === "down") {
      mins = Math.max(1, parseInt(mins, 10) || 5);
      return { mode: "down", endsAt: now + mins * 60000 };
    }
    if (mode === "up") return { mode: "up", startedAt: now };
    if (mode === "clock") return { mode: "clock" };
    return { mode: "off" };
  }
  function sendMsg(text, opts) {
    var ref = dbRef(MSG_PATH);
    if (!ref) {
      setStatus("Belum terhubung", false);
      return;
    }
    try {
      var w = ref.update(msgPayload(text, opts));
      if (w && w.catch)
        w.catch(function (err) {
          setStatus("Ditolak: " + String((err && err.code) || err), false);
        });
      setStatus(text ? "Pesan panggung terkirim" : "Pesan panggung dihapus", true);
    } catch (e) {
      setStatus("Gagal kirim pesan", false);
    }
  }
  function sendTimer(mode, mins) {
    var ref = dbRef(MSG_PATH);
    if (!ref) {
      setStatus("Belum terhubung", false);
      return;
    }
    try {
      var w = ref.update({
        timer: timerPayload(mode, mins),
        t: Date.now(),
        by: _uid || "anon",
      });
      if (w && w.catch)
        w.catch(function (err) {
          setStatus("Ditolak: " + String((err && err.code) || err), false);
        });
      setStatus(
        mode === "off" ? "Timer panggung dimatikan" : "Timer panggung jalan",
        true,
      );
    } catch (e) {
      setStatus("Gagal kirim timer", false);
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
      '<div class="cfRemChips" id="cfRemChips"></div>' +
      '<input id="cfRemMsgIn" type="text" maxlength="120" placeholder="Pesan ke panggung…">' +
      '<div class="cfRemMsgOpts">' +
      '<label class="cfRemTgl"><input type="checkbox" id="cfRemFlash"> Kedip</label>' +
      '<select id="cfRemAuto" class="cfRemSel">' +
      '<option value="0">Tetap tampil</option>' +
      '<option value="10">Hilang 10 dtk</option>' +
      '<option value="20">Hilang 20 dtk</option>' +
      '<option value="30">Hilang 30 dtk</option>' +
      "</select>" +
      "</div>" +
      '<div class="cfRemMsgOps">' +
      '<button id="cfRemMsgSend" type="button" class="cfRemBtn cfRemPrimary">Kirim</button>' +
      '<button id="cfRemMsgClear" type="button" class="cfRemBtn">Hapus</button>' +
      "</div></div>" +
      '<div class="cfRemMsg cfRemTimerBox">' +
      '<div class="cfRemMsgTitle">TIMER PANGGUNG</div>' +
      '<div class="cfRemTMode" id="cfRemTMode">' +
      '<button type="button" class="cfRemBtn" data-tmode="clock">Jam</button>' +
      '<button type="button" class="cfRemBtn on" data-tmode="down">Mundur</button>' +
      '<button type="button" class="cfRemBtn" data-tmode="up">Jalan</button>' +
      "</div>" +
      '<div class="cfRemTRow">' +
      '<input id="cfRemTMins" type="number" min="1" max="180" value="30" inputmode="numeric">' +
      '<span class="cfRemTUnit">menit (khusus Mundur)</span>' +
      "</div>" +
      '<div class="cfRemMsgOps">' +
      '<button id="cfRemTStart" type="button" class="cfRemBtn cfRemPrimary">Mulai Timer</button>' +
      '<button id="cfRemTStop" type="button" class="cfRemBtn">Matikan</button>' +
      "</div></div>" +
      '<div id="cfRemNow" class="cfRemNow"></div>' +
      "</div>";
    document.body.appendChild(wrap);

    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cmd]");
      if (b) send(b.getAttribute("data-cmd"));
    });
    function _msgOpts() {
      return {
        flash: !!(el("cfRemFlash") && el("cfRemFlash").checked),
        autoSec: parseInt((el("cfRemAuto") || {}).value || "0", 10) || 0,
      };
    }
    el("cfRemMsgSend").onclick = function () {
      sendMsg((el("cfRemMsgIn").value || "").trim(), _msgOpts());
    };
    el("cfRemMsgClear").onclick = function () {
      el("cfRemMsgIn").value = "";
      sendMsg("");
    };
    var chipsBox = el("cfRemChips");
    if (chipsBox)
      MSG_PRESETS.forEach(function (p) {
        var c = document.createElement("button");
        c.type = "button";
        c.className = "cfRemChip";
        c.textContent = p;
        c.onclick = function () {
          el("cfRemMsgIn").value = p;
          sendMsg(p, _msgOpts());
        };
        chipsBox.appendChild(c);
      });
    var _tMode = "down";
    var tModeBox = el("cfRemTMode");
    if (tModeBox)
      tModeBox.addEventListener("click", function (e) {
        var b = e.target.closest("[data-tmode]");
        if (!b) return;
        _tMode = b.getAttribute("data-tmode");
        var bs = tModeBox.querySelectorAll("[data-tmode]");
        for (var i = 0; i < bs.length; i++)
          bs[i].classList.toggle("on", bs[i] === b);
      });
    el("cfRemTStart").onclick = function () {
      sendTimer(_tMode, (el("cfRemTMins") || {}).value);
    };
    el("cfRemTStop").onclick = function () {
      sendTimer("off");
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
    sendMsg: sendMsg,
    sendTimer: sendTimer,
    _msgPayload: msgPayload,
    _timerPayload: timerPayload,
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
