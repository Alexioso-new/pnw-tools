/* PNW-FILE-GUIDE
   js/cf-workspace.js — WORKSPACE MANAGER v103 (Sprint 4: S4-04, fondasi).
   Isi:
     • REGISTRY — daftar resmi panel workspace (kontrak untuk fitur docking).
     • Store slice `workspace` — state layout ada di store, bukan hanya DOM.
     • Serializer — snapshot grid inline saat ini ke storage adapter.
     • Preset layout — Default / Wide Preview / Focus Design / Focus Lyric.
   INTEROP STRANGLER: layout grid v94 hidup di key legacy `pnwCastflowGrid.v1`
   dengan bentuk {l:px, r:px, t:frac}. Modul ini menulis LEWAT
   storage.legacyWrite ke key itu (format persis sama) LALU reload agar
   applyGrid() lama menerapkannya — tidak ada format baru yang dikarang.
   Menu: Avatar -> Workspace (Reset + 4 preset + Save Snapshot).
   Dimuat SETELAH cf-kernel.js dan cf-toast.js.
 */
(function () {
  "use strict";
  var K = window.CastFlowKernel;
  if (!K) return;

  var LEGACY_GRID = "pnwCastflowGrid.v1";

  var REGISTRY = [
    { id: "features", title: "Features", selector: ".cfC-menu" },
    { id: "playlist", title: "Playlist / Rundown", selector: ".cfC-playlist" },
    { id: "preview", title: "Preview", selector: ".cfC-preview" },
    { id: "flow", title: "Lyric / Timeline", selector: ".cfC-lyric" },
    { id: "design", title: "Design Panel", selector: ".cfC-design" },
  ];

  /* Preset memakai bentuk legacy {l, r, t} — default dari loadGrid() v94. */
  var PRESETS = [
    { id: "default", title: "Default", grid: { l: 300, r: 330, t: 0.46 } },
    { id: "wide-preview", title: "Wide Preview", grid: { l: 240, r: 280, t: 0.56 } },
    { id: "focus-design", title: "Focus Design", grid: { l: 260, r: 430, t: 0.42 } },
    { id: "focus-lyric", title: "Focus Lyric", grid: { l: 280, r: 300, t: 0.3 } },
  ];

  K.store.set("workspace", { preset: "custom", snapshotAt: 0 });

  function serialize() {
    var g = document.querySelector(".projGrid.cfWork");
    if (!g) return null;
    return {
      cols: g.style.gridTemplateColumns || "",
      rows: g.style.gridTemplateRows || "",
    };
  }

  function saveSnapshot() {
    var s = serialize();
    if (!s) return null;
    var rec = { grid: s, at: Date.now() };
    K.storage.set("workspace:layout", rec);
    K.store.set("workspace", { snapshotAt: rec.at });
    K.bus.emit(K.Events.WORKSPACE_LAYOUT_SAVED, rec);
    if (K.toast) K.toast.success("Snapshot layout tersimpan.");
    return rec;
  }

  function applyPreset(id, opts) {
    var p = null;
    PRESETS.forEach(function (x) {
      if (x.id === id) p = x;
    });
    if (!p) return false;
    /* tulis format legacy + snapshot baru, lalu reload agar applyGrid v94 jalan */
    K.storage.legacyWrite(LEGACY_GRID, p.grid);
    K.storage.set("workspace:layout", { preset: p.id, grid: p.grid, at: Date.now() });
    K.store.set("workspace", { preset: p.id });
    K.bus.emit(K.Events.WORKSPACE_LAYOUT_CHANGED, { preset: p.id, grid: p.grid });
    if (K.toast) K.toast.info("Layout: " + p.title + " — memuat ulang…");
    if (!opts || opts.reload !== false) setTimeout(function () { location.reload(); }, 700);
    return true;
  }

  function resetLayout(opts) {
    try {
      localStorage.removeItem(LEGACY_GRID);
    } catch (e) {}
    K.storage.remove("workspace:layout");
    K.store.set("workspace", { preset: "default" });
    K.bus.emit(K.Events.WORKSPACE_LAYOUT_RESET, {});
    if (K.toast) K.toast.info("Layout direset — memuat ulang…");
    if (!opts || opts.reload !== false) setTimeout(function () { location.reload(); }, 700);
    return true;
  }

  /* ---------------- UI: menu Avatar ---------------- */
  var menuTries = 0;
  function addMenuItems() {
    menuTries++;
    var menu = document.getElementById("cfUserMenu");
    if (menu) {
      if (!document.getElementById("cfWsSnapItem")) {
        var snap = document.createElement("button");
        snap.type = "button";
        snap.className = "cfUserItem";
        snap.id = "cfWsSnapItem";
        snap.textContent = "Save Layout Snapshot";
        snap.addEventListener("click", function () {
          menu.hidden = true;
          saveSnapshot();
        });
        menu.appendChild(snap);
      }
      if (!document.getElementById("cfWsPresetSel")) {
        var row = document.createElement("div");
        row.className = "cfUserItem cfUserLang";
        row.id = "cfWsPresetRow";
        var lab = document.createElement("span");
        lab.textContent = "Layout";
        var sel = document.createElement("select");
        sel.id = "cfWsPresetSel";
        sel.className = "cfWsPresetSel";
        var cur = K.storage.get("workspace:layout", null);
        var curPreset = cur && cur.preset ? cur.preset : "custom";
        var optCustom = document.createElement("option");
        optCustom.value = "custom";
        optCustom.textContent = "Custom";
        sel.appendChild(optCustom);
        PRESETS.forEach(function (p) {
          var o = document.createElement("option");
          o.value = p.id;
          o.textContent = p.title;
          sel.appendChild(o);
        });
        sel.value = curPreset;
        sel.addEventListener("change", function () {
          if (sel.value !== "custom") {
            menu.hidden = true;
            applyPreset(sel.value);
          }
        });
        row.appendChild(lab);
        row.appendChild(sel);
        menu.appendChild(row);
      }
      if (!document.getElementById("cfWsResetItem")) {
        var rs = document.createElement("button");
        rs.type = "button";
        rs.className = "cfUserItem";
        rs.id = "cfWsResetItem";
        rs.textContent = "Reset Layout";
        rs.addEventListener("click", function () {
          menu.hidden = true;
          resetLayout();
        });
        menu.appendChild(rs);
      }
      return;
    }
    if (menuTries < 40) setTimeout(addMenuItems, 500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addMenuItems);
  else addMenuItems();

  K.workspace = {
    REGISTRY: REGISTRY,
    PRESETS: PRESETS,
    serialize: serialize,
    saveSnapshot: saveSnapshot,
    applyPreset: applyPreset,
    resetLayout: resetLayout,
  };
})();
