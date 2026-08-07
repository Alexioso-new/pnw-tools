/* PNW-FILE-GUIDE
   js/guide.js — Buku Panduan PDF (window.PNWGuide).
   PDF -> Storage path guide/..., metadata -> RTDB pujianYouth/guide (tulis hanya OWNER_UID).
   Dibuka dari #openGuideBtn di drawer (index.html).
 */

/* =========================================================================
   GUIDE BOOK - HOSANA YOUTH TOOLS v65
   Admin mengunggah PDF panduan ke Firebase Storage, seluruh pengguna
   membacanya online. Metadata disimpan di RTDB agar tersinkron realtime.
   Bergantung pada firebase compat (app, database, storage) yang dimuat
   di index.html. Aman jika Firebase belum siap: tampil pesan, tidak crash.
   ========================================================================= */
(function () {
  "use strict";

  var GUIDE_REF = "pujianYouth/guide";
  var STORE_DIR = "guide";
  var MAX_PDF = 25 * 1024 * 1024; // 25 MB
  var OWNER_UID = "l9U1ktYog2X3vSA81JdsjHln5qu1";

  var _meta = null;
  var _watching = false;

  /* ---------- util ---------- */
  function fb() {
    if (typeof firebase === "undefined") return null;
    if (!firebase.apps || !firebase.apps.length) return null;
    return firebase;
  }
  function dbRef() {
    var f = fb();
    if (!f || !f.database) return null;
    try {
      return f.database().ref(GUIDE_REF);
    } catch (e) {
      return null;
    }
  }
  function storageAvail() {
    var f = fb();
    if (!f || !f.storage) return false;
    try {
      f.storage();
      return true;
    } catch (e) {
      return false;
    }
  }
  function whoAmI() {
    var f = fb();
    try {
      var u = f && f.auth ? f.auth().currentUser : null;
      return u
        ? { uid: u.uid, name: u.displayName || u.email || "Pengguna" }
        : null;
    } catch (e) {
      return null;
    }
  }
  function isOwner() {
    var me = whoAmI();
    return !!(me && me.uid === OWNER_UID);
  }
  function fmtSize(b) {
    if (!b && b !== 0) return "";
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(0) + " KB";
    return (b / 1024 / 1024).toFixed(1) + " MB";
  }
  function fmtDate(ts) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "";
    }
  }
  function notify(msg) {
    if (typeof window.toast === "function") window.toast(msg);
    else alert(msg);
  }

  /* ---------- render ---------- */
  function body() {
    return document.getElementById("guideBody");
  }

  function renderEmpty(host) {
    var owner = isOwner();
    host.innerHTML =
      '<div class="guideEmpty">' +
      '<p class="guideEmptyTitle">Panduan belum tersedia</p>' +
      '<p class="guideEmptyNote">' +
      (owner
        ? "Unggah berkas PDF panduan penggunaan di bawah ini."
        : "Pengurus belum mengunggah buku panduan.") +
      "</p></div>";
  }

  function renderDoc(host, m) {
    var owner = isOwner();
    var meta = [];
    if (m.size) meta.push(fmtSize(m.size));
    if (m.ts) meta.push("Diperbarui " + fmtDate(m.ts));
    if (m.byName) meta.push("oleh " + m.byName);

    host.innerHTML =
      '<div class="guideDocHead">' +
      '<div class="guideDocInfo">' +
      '<p class="guideDocName">' +
      escapeHtml(m.name || "Panduan.pdf") +
      "</p>" +
      '<p class="guideDocMeta">' +
      escapeHtml(meta.join(" \u00b7 ")) +
      "</p>" +
      "</div>" +
      '<div class="guideDocActions">' +
      '<a class="actionBtn" id="guideOpenTab" target="_blank" rel="noopener" href="' +
      escapeAttr(m.url) +
      '">Buka tab baru</a>' +
      '<a class="actionBtn secondary" id="guideDl" download href="' +
      escapeAttr(m.url) +
      '">Unduh</a>' +
      "</div></div>" +
      '<div class="guideViewer"><iframe id="guideFrame" title="Buku panduan" src="' +
      escapeAttr(m.url) +
      '#view=FitH"></iframe></div>' +
      (owner
        ? '<button class="actionBtn danger guideDel" id="guideDelBtn" type="button">Hapus panduan</button>'
        : "");

    if (owner) {
      var del = document.getElementById("guideDelBtn");
      if (del) del.onclick = removeGuide;
    }
  }

  function escapeHtml(s) {
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
  function escapeAttr(s) {
    return escapeHtml(s);
  }

  function renderUploader(host) {
    if (!isOwner()) return;
    var wrap = document.createElement("div");
    wrap.className = "guideUp";
    wrap.innerHTML =
      '<p class="label">Unggah panduan (PDF)</p>' +
      '<input type="file" id="guideFile" accept="application/pdf" />' +
      '<p class="guideHint" id="guideHint">Maksimal 25 MB. Mengunggah berkas baru akan menggantikan panduan lama.</p>';
    host.appendChild(wrap);
    var inp = document.getElementById("guideFile");
    if (inp) inp.onchange = onPick;
  }

  function render() {
    var host = body();
    if (!host) return;
    if (!fb()) {
      host.innerHTML =
        '<div class="guideEmpty"><p class="guideEmptyTitle">Butuh koneksi</p>' +
        '<p class="guideEmptyNote">Buku panduan tersimpan online. Sambungkan internet lalu buka lagi.</p></div>';
      return;
    }
    if (_meta && _meta.url) renderDoc(host, _meta);
    else renderEmpty(host);
    renderUploader(host);
  }

  /* ---------- unggah ---------- */
  function setHint(msg) {
    var h = document.getElementById("guideHint");
    if (h) h.textContent = msg;
  }

  function onPick(ev) {
    var file = ev && ev.target && ev.target.files ? ev.target.files[0] : null;
    if (!file) return;
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      setHint("Berkas harus PDF.");
      return;
    }
    if (file.size > MAX_PDF) {
      setHint("Berkas terlalu besar. Maksimal 25 MB.");
      return;
    }
    if (!storageAvail()) {
      setHint(
        "Penyimpanan online belum aktif. Aktifkan Firebase Storage lebih dulu.",
      );
      return;
    }
    uploadPdf(file);
  }

  function uploadPdf(file) {
    var f = fb();
    var me = whoAmI();
    var path = STORE_DIR + "/panduan-" + Date.now() + ".pdf";
    setHint("Mengunggah 0%");
    var task;
    try {
      task = f
        .storage()
        .ref()
        .child(path)
        .put(file, { contentType: "application/pdf" });
    } catch (e) {
      setHint("Gagal memulai unggahan.");
      return;
    }
    task.on(
      "state_changed",
      function (snap) {
        if (!snap.totalBytes) return;
        var pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setHint("Mengunggah " + pct + "%");
      },
      function (err) {
        var code = err && err.code ? String(err.code) : "";
        if (code.indexOf("unauthorized") >= 0)
          setHint("Tidak diizinkan. Periksa aturan keamanan Storage.");
        else if (code.indexOf("retry") >= 0 || code.indexOf("unknown") >= 0)
          setHint("Unggahan gagal. Pastikan Firebase Storage sudah aktif.");
        else setHint("Unggahan gagal: " + code);
      },
      function () {
        task.snapshot.ref
          .getDownloadURL()
          .then(function (url) {
            var meta = {
              name: file.name,
              size: file.size,
              url: url,
              path: path,
              ts: Date.now(),
              by: me ? me.uid : null,
              byName: me ? me.name : "Pengurus",
            };
            var r = dbRef();
            var prev = _meta;
            if (r) r.set(meta);
            _meta = meta;
            render();
            notify("Panduan berhasil diunggah.");
            // buang berkas lama agar kuota tidak menumpuk
            if (prev && prev.path && prev.path !== path) {
              try {
                f.storage().ref().child(prev.path).delete();
              } catch (e) {}
            }
          })
          .catch(function () {
            setHint("Berkas terunggah tetapi tautan gagal dibuat.");
          });
      },
    );
  }

  function removeGuide() {
    if (!isOwner()) return;
    if (!confirm("Hapus buku panduan ini?")) return;
    var f = fb();
    var old = _meta;
    var r = dbRef();
    if (r) r.remove();
    _meta = null;
    render();
    if (old && old.path && f && f.storage) {
      try {
        f.storage().ref().child(old.path).delete();
      } catch (e) {}
    }
    notify("Panduan dihapus.");
  }

  /* ---------- sinkron ---------- */
  function watch() {
    if (_watching) return;
    var r = dbRef();
    if (!r) return;
    _watching = true;
    r.on("value", function (snap) {
      _meta = snap && snap.val ? snap.val() : null;
      var bd = document.getElementById("guideModal");
      if (bd && bd.classList.contains("open")) render();
    });
  }

  /* ---------- buka / tutup ---------- */
  function open() {
    var bd = document.getElementById("guideModal");
    if (!bd) return;
    bd.classList.add("open");
    bd.setAttribute("aria-hidden", "false");
    watch();
    render();
  }
  function close() {
    var bd = document.getElementById("guideModal");
    if (!bd) return;
    bd.classList.remove("open");
    bd.setAttribute("aria-hidden", "true");
  }

  function init() {
    var openBtn = document.getElementById("openGuideBtn");
    if (openBtn)
      openBtn.onclick = function () {
        if (typeof window.closeMenu === "function") window.closeMenu();
        open();
      };
    var x = document.getElementById("closeGuideBtn");
    if (x) x.onclick = close;
    var bd = document.getElementById("guideModal");
    if (bd)
      bd.addEventListener("click", function (e) {
        if (e.target === bd) close();
      });
    watch();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

  window.PNWGuide = { open: open, close: close, render: render, init: init };
})();
