/* PNW-FILE-GUIDE
   js/cf-package.js — PROJECT PACKAGE: SCHEMA + EXPORT + IMPORT v102
   (Sprint 3: S3-01, S3-02, S3-03; fondasi roadmap v102 Portability).
   Format paket (schemaVersion 1):
     { format:"castflow-project", schemaVersion:1, name, exportedAt,
       app:{release,label}, rundown:[...], settings:{...}, visual:{...}|null,
       mediaRefs:[{ref:"idb:..."}] }
   - Ekspor mengunduh satu file .cfproj.json (rundown + pengaturan + style +
     daftar referensi media).
   - Impor memvalidasi schema DULU (file rusak/salah = ditolak dengan pesan
     jelas, state tidak disentuh), lalu menerapkan rundown lewat kontrak resmi
     PNWProjector.__tl.setPlan (v102), visual style lewat legacyWrite +
     CastFlowV100.applyVisualPreview, dan memindai mediaRefs — media yang
     tidak ada di perangkat ini dilaporkan sebagai warning (tidak diam-diam).
   Pintu masuk UI: menu Avatar -> "Export Project" / "Import Project".
   Dimuat SETELAH cf-kernel.js dan cf-media.js.
 */
(function () {
  "use strict";
  var K = window.CastFlowKernel;
  if (!K) return;
  var FORMAT = "castflow-project";
  var SCHEMA = 1;

  function tl() {
    return (window.PNWProjector && PNWProjector.__tl) || null;
  }
  function notify(msg, kind) {
    try {
      var t = tl();
      if (t && t.notify) t.notify(msg, kind || "info");
    } catch (e) {}
  }

  /* ---------------- S3-01: schema ---------------- */
  function buildPackage(name) {
    var t = tl();
    var rundown = t && t.plan ? (t.plan() || []).slice() : [];
    var settings = t && t.settings ? t.settings() || {} : {};
    var visual = K.storage.legacyRead("pnwCastflowVisualStyle.v2", null);
    var refs = K.media && K.media.collectRefsFromPlan ? K.media.collectRefsFromPlan() : [];
    return {
      format: FORMAT,
      schemaVersion: SCHEMA,
      name: name || "Service " + new Date().toISOString().slice(0, 10),
      exportedAt: new Date().toISOString(),
      app: { release: K.VERSION, label: K.LABEL },
      rundown: rundown,
      settings: settings,
      visual: visual,
      mediaRefs: refs.map(function (r) {
        return { ref: r };
      }),
    };
  }
  function validate(pkg) {
    if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) return "File bukan paket JSON yang valid";
    if (pkg.format !== FORMAT) return "Bukan project CastFlow (format: " + (pkg.format || "tidak dikenal") + ")";
    if (typeof pkg.schemaVersion !== "number" || pkg.schemaVersion > SCHEMA)
      return "Versi schema tidak didukung: " + String(pkg.schemaVersion);
    if (!Array.isArray(pkg.rundown)) return "Isi rundown tidak valid";
    return null;
  }

  /* ---------------- S3-02: export ---------------- */
  function exportProject() {
    var pkg = buildPackage();
    try {
      var blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (pkg.name.replace(/[^\w\-]+/g, "-").toLowerCase() || "castflow-project") + ".cfproj.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
      }, 4000);
    } catch (e) {}
    K.bus.emit(K.Events.PROJECT_EXPORTED, { name: pkg.name, items: pkg.rundown.length, media: pkg.mediaRefs.length });
    K.storage.set("project:lastExport", { at: pkg.exportedAt, items: pkg.rundown.length });
    notify("Project diekspor (" + pkg.rundown.length + " item, " + pkg.mediaRefs.length + " media).", "info");
    return pkg;
  }

  /* ---------------- S3-03: import ---------------- */
  function applyImportData(pkg) {
    var err = validate(pkg);
    if (err) {
      K.bus.emit(K.Events.PROJECT_IMPORT_FAILED, { reason: err });
      notify("Impor gagal: " + err, "warn");
      return Promise.resolve({ ok: false, reason: err });
    }
    var t = tl();
    if (!t || typeof t.setPlan !== "function") {
      var reason = "Presenter belum siap (kontrak setPlan tidak ada)";
      K.bus.emit(K.Events.PROJECT_IMPORT_FAILED, { reason: reason });
      notify("Impor gagal: " + reason, "warn");
      return Promise.resolve({ ok: false, reason: reason });
    }
    /* Rundown lewat kontrak resmi — persist + repaint otomatis. */
    t.setPlan(pkg.rundown);
    /* Visual style — tulis legacy + terapkan langsung (transisi strangler). */
    if (pkg.visual && typeof pkg.visual === "object" && !Array.isArray(pkg.visual)) {
      K.storage.legacyWrite("pnwCastflowVisualStyle.v2", pkg.visual);
      try {
        if (window.CastFlowV100 && CastFlowV100.applyVisualPreview) {
          CastFlowV100.applyVisualPreview(pkg.visual, false);
          CastFlowV100.syncMiniPreviews();
        }
      } catch (e) {}
    }
    var refs = (pkg.mediaRefs || [])
      .map(function (m) {
        return m && m.ref;
      })
      .filter(Boolean);
    var finish = function (missingIds) {
      var res = { ok: true, items: pkg.rundown.length, missing: missingIds };
      K.bus.emit(K.Events.PROJECT_IMPORTED, { name: pkg.name, items: res.items, missing: missingIds.length });
      if (missingIds.length)
        notify("Project diimpor, tetapi " + missingIds.length + " media tidak ada di perangkat ini — ganti media lalu simpan ulang.", "warn");
      else notify("Project diimpor (" + res.items + " item).", "info");
      return res;
    };
    if (refs.length && K.media && K.media.scanRefs) return K.media.scanRefs(refs).then(finish);
    return Promise.resolve(finish([]));
  }
  function importFile(file) {
    return new Promise(function (res) {
      var rd = new FileReader();
      rd.onload = function () {
        var pkg = null;
        try {
          pkg = JSON.parse(String(rd.result || ""));
        } catch (e) {
          K.bus.emit(K.Events.PROJECT_IMPORT_FAILED, { reason: "File bukan JSON" });
          notify("Impor gagal: file bukan JSON valid.", "warn");
          return res({ ok: false, reason: "invalid json" });
        }
        applyImportData(pkg).then(res);
      };
      rd.onerror = function () {
        res({ ok: false, reason: "read error" });
      };
      rd.readAsText(file);
    });
  }

  /* ---------------- UI: menu Avatar ---------------- */
  var fileInput = null;
  function ensureInput() {
    if (fileInput) return;
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "cfImportInput";
    fileInput.accept = ".json,.cfproj.json,application/json";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
    fileInput.addEventListener("change", function () {
      var f = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      if (f) importFile(f);
    });
  }
  var menuTries = 0;
  function addMenuItems() {
    menuTries++;
    var menu = document.getElementById("cfUserMenu");
    if (menu) {
      if (!document.getElementById("cfExportItem")) {
        var ex = document.createElement("button");
        ex.type = "button";
        ex.className = "cfUserItem";
        ex.id = "cfExportItem";
        ex.textContent = "Export Project";
        ex.addEventListener("click", function () {
          menu.hidden = true;
          exportProject();
        });
        menu.appendChild(ex);
      }
      if (!document.getElementById("cfImportItem")) {
        var im = document.createElement("button");
        im.type = "button";
        im.className = "cfUserItem";
        im.id = "cfImportItem";
        im.textContent = "Import Project";
        im.addEventListener("click", function () {
          menu.hidden = true;
          ensureInput();
          fileInput.click();
        });
        menu.appendChild(im);
      }
      return;
    }
    if (menuTries < 40) setTimeout(addMenuItems, 500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addMenuItems);
  else addMenuItems();

  K.pkg = {
    FORMAT: FORMAT,
    SCHEMA: SCHEMA,
    buildPackage: buildPackage,
    validate: validate,
    exportProject: exportProject,
    applyImportData: applyImportData,
    importFile: importFile,
  };
})();
