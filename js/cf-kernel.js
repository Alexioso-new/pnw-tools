/* PNW-FILE-GUIDE
   js/cf-kernel.js — KERNEL v104 (Sprint 1 + S3-06 storage registry + S4 store).
   Satu sumber kebenaran untuk arsitektur baru CastFlow:
     • bus      : event bus (on/off/once/emit) — komunikasi antar modul.
     • store    : state global per slice (app/connection/program/diagnostics/workspace).
     • storage  : persistence adapter, semua key BARU ber-namespace
                  castflow:v101: (namespace mengikuti SKEMA, bukan nomor rilis),
                  plus registry migrasi legacy (MIGRATIONS + migratedGet).
     • flags    : feature flags tersimpan (bisa dipakai mematikan fitur baru).
     • errors   : global error handler -> PNWLog + event app:error.
   ATURAN (04_AGENT_RULES): modul baru WAJIB lewat kernel ini; dilarang
   menulis localStorage langsung dan dilarang polling untuk berkomunikasi.
   Dimuat SEBELUM semua modul cf-* lainnya.
 */
(function () {
  "use strict";
  if (window.CastFlowKernel) return;

  var VERSION = "v104";
  var LABEL = "v9.4";
  var NS = "castflow:v101:"; /* namespace skema — JANGAN diganti per rilis */

  /* Event catalog (02_TECH_SPEC §8 + tambahan v102/v103) — daftar resmi. */
  var Events = {
    APP_INIT: "app:init",
    APP_READY: "app:ready",
    APP_ERROR: "app:error",
    PROGRAM_GO_LIVE: "program:go-live",
    PROGRAM_CLEAR: "program:clear",
    OUTPUT_HEARTBEAT: "output:heartbeat",
    OUTPUT_CONNECTED: "output:connected",
    OUTPUT_STALE: "output:stale",
    OUTPUT_DISCONNECTED: "output:disconnected",
    OUTPUT_SLIDE_ACK: "output:slide-ack",
    OUTPUT_RECONNECT: "output:request-reconnect",
    PREFLIGHT_STARTED: "diagnostics:preflight-started",
    PREFLIGHT_FINISHED: "diagnostics:preflight-finished",
    MEDIA_MISSING: "media:missing-detected",
    MEDIA_RESOLVED: "media:resolved",
    PROJECT_EXPORTED: "project:exported",
    PROJECT_IMPORTED: "project:imported",
    PROJECT_IMPORT_FAILED: "project:import-failed",
    WORKSPACE_LAYOUT_CHANGED: "workspace:layout-changed",
    WORKSPACE_LAYOUT_SAVED: "workspace:layout-saved",
    WORKSPACE_LAYOUT_RESET: "workspace:layout-reset",
    PERFORMANCE_SAMPLE: "diagnostics:performance-sample",
    A11Y_AUDIT_FINISHED: "a11y:audit-finished",
    SOAK_STARTED: "diagnostics:soak-started",
    SOAK_FINISHED: "diagnostics:soak-finished",
  };

  function logWarn(msg, meta) {
    try {
      if (window.PNWLog && window.PNWLog.warn) window.PNWLog.warn(msg, meta);
    } catch (e) {}
  }
  function logError(msg, meta) {
    try {
      if (window.PNWLog && window.PNWLog.error) window.PNWLog.error(msg, meta);
    } catch (e) {}
  }

  /* ---------------- Event Bus (S1-01) ---------------- */
  function createBus() {
    var map = {};
    function list(ev) {
      return map[ev] || (map[ev] = []);
    }
    return {
      on: function (ev, fn) {
        if (typeof fn !== "function") return function () {};
        list(ev).push(fn);
        return function () {
          bus.off(ev, fn);
        };
      },
      once: function (ev, fn) {
        var off;
        off = bus.on(ev, function (p) {
          off();
          fn(p);
        });
        return off;
      },
      off: function (ev, fn) {
        var l = map[ev];
        if (!l) return;
        var i = l.indexOf(fn);
        if (i >= 0) l.splice(i, 1);
      },
      emit: function (ev, payload) {
        var l = (map[ev] || []).slice();
        for (var i = 0; i < l.length; i++) {
          try {
            l[i](payload);
          } catch (e) {
            logError("bus handler gagal: " + ev, { error: String(e) });
          }
        }
      },
      _count: function (ev) {
        return (map[ev] || []).length;
      },
    };
  }
  var bus = createBus();

  /* ---------------- Global Store (S1-02) ---------------- */
  var state = {
    app: { version: VERSION, label: LABEL, mode: "operator", initialized: false, locale: "en" },
    connection: {
      firebase: "unknown",
      output: { status: "idle", lastSeen: 0, sig: "", kind: "", slide: -1, mode: "" },
    },
    program: { lastSentSig: "", lastSentAt: 0, lastAckSig: "", ackAt: 0 },
    diagnostics: { preflight: null, errors: [], performance: null, a11y: null, soak: null },
    workspace: { preset: "custom", snapshotAt: 0 },
  };
  var subs = []; /* {slice, fn} — slice null = semua perubahan */
  var store = {
    get: function () {
      return state;
    },
    slice: function (name) {
      return state[name] || {};
    },
    set: function (slice, patch) {
      if (!state[slice]) state[slice] = {};
      var changed = false;
      for (var k in patch) {
        if (state[slice][k] !== patch[k]) {
          state[slice][k] = patch[k];
          changed = true;
        }
      }
      if (!changed) return;
      for (var i = 0; i < subs.length; i++) {
        if (subs[i].slice === slice || subs[i].slice === null) {
          try {
            subs[i].fn(state[slice], slice);
          } catch (e) {
            logError("store subscriber gagal", { slice: slice, error: String(e) });
          }
        }
      }
    },
    subscribe: function (slice, fn) {
      var s = { slice: slice || null, fn: fn };
      subs.push(s);
      return function () {
        var i = subs.indexOf(s);
        if (i >= 0) subs.splice(i, 1);
      };
    },
  };


  /* ---------------- Lifecycle Scheduler (S5-04) ----------------
     Timer UI berhenti total saat tab tersembunyi dan dilanjutkan saat tampak.
     Timer kritis heartbeat/countdown/playback tetap memakai mekanisme sendiri. */
  function createScheduler() {
    var jobs = [];
    var nextId = 1;
    function drop(job) {
      var i = jobs.indexOf(job);
      if (i >= 0) jobs.splice(i, 1);
    }
    function arm(job, delay) {
      if (!job.active || job.timer || (document.hidden && !job.runHidden)) return;
      job.timer = setTimeout(function () {
        job.timer = null;
        if (!job.active) return;
        if (!document.hidden || job.runHidden) {
          try {
            job.fn();
            job.runs++;
            job.lastRunAt = Date.now();
          } catch (e) {
            logError("scheduler job gagal", { name: job.name, error: String(e) });
          }
        }
        arm(job, job.ms);
      }, Math.max(0, delay));
    }
    function cancel(job) {
      if (!job || !job.active) return;
      job.active = false;
      if (job.timer) clearTimeout(job.timer);
      job.timer = null;
      drop(job);
    }
    function every(fn, ms, opts) {
      opts = opts || {};
      var job = {
        id: nextId++,
        name: opts.name || "job",
        fn: fn,
        ms: Math.max(50, Number(ms) || 1000),
        runHidden: !!opts.runHidden,
        active: true,
        timer: null,
        runs: 0,
        lastRunAt: 0,
      };
      jobs.push(job);
      arm(job, opts.immediate ? 0 : job.ms);
      return function () {
        cancel(job);
      };
    }
    function idle(fn, timeout) {
      var active = true;
      var id;
      function run(deadline) {
        if (!active) return;
        active = false;
        fn(deadline || { didTimeout: true, timeRemaining: function () { return 0; } });
      }
      if (window.requestIdleCallback) id = requestIdleCallback(run, { timeout: timeout || 1000 });
      else id = setTimeout(run, Math.min(timeout || 50, 50));
      return function () {
        active = false;
        if (window.cancelIdleCallback && typeof id === "number") cancelIdleCallback(id);
        else clearTimeout(id);
      };
    }
    function stats() {
      return {
        active: jobs.length,
        hidden: !!document.hidden,
        jobs: jobs.map(function (j) {
          return { id: j.id, name: j.name, ms: j.ms, runs: j.runs, runHidden: j.runHidden };
        }),
      };
    }
    function stopAll() {
      jobs.slice().forEach(cancel);
    }
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) jobs.slice().forEach(function (j) { arm(j, 0); });
    });
    window.addEventListener("pagehide", function (e) {
      if (!e.persisted) stopAll();
    });
    return { every: every, idle: idle, stats: stats, stopAll: stopAll };
  }
  var scheduler = createScheduler();

  /* ---------------- Persistence Adapter (S1-04 + S3-06) ---------------- */
  function skey(key) {
    return NS + key;
  }

  /* Registry migrasi legacy -> key baru (S3-06). Sifatnya: baca-baru-dulu,
     kalau kosong baca legacy LALU SALIN ke key baru (write-through).
     Key legacy TIDAK dihapus — rollback selalu aman. */
  var MIGRATIONS = {
    "workspace:layout": "pnwCastflowGrid.v1",
    "preview:mode": "pnwCastflowPreviewMode.v2",
    "preview:ratio": "pnwCastflowPrevRatio",
    "design:visual": "pnwCastflowVisualStyle.v2",
    lang: "pnwCastflowLang",
    "media:tags": "pnwCastflowMediaTags.v1",
    "bible:version": "pnwCastflowBibleVer",
    "fonts:custom": "pnwCastflowFonts.v1",
    "preview:float": "pnwCastflowFloat.v1",
    "timeline:height": "pnwCastflowTlH",
    "lyric:view": "pnwCastflowLyricView",
  };

  var storage = {
    NS: NS,
    key: skey,
    MIGRATIONS: MIGRATIONS,
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(skey(key));
        if (raw == null) return fallback;
        return JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(skey(key), JSON.stringify(value));
        return true;
      } catch (e) {
        logWarn("storage set gagal", { key: key, error: String(e) });
        return false;
      }
    },
    remove: function (key) {
      try {
        localStorage.removeItem(skey(key));
      } catch (e) {}
    },
    /* migratedGet: baca key baru; bila kosong dan ada pasangan legacy,
       salin nilai legacy ke key baru lalu kembalikan. (S3-06) */
    migratedGet: function (key, fallback) {
      var v = storage.get(key, undefined);
      if (typeof v !== "undefined") return v;
      var legacyKey = MIGRATIONS[key];
      if (!legacyKey) return fallback;
      var lv = storage.legacyRead(legacyKey, undefined);
      if (typeof lv === "undefined" || lv === null) return fallback;
      storage.set(key, lv); /* write-through, legacy tetap ada */
      return lv;
    },
    /* Baca key legacy (pnw*) TANPA memigrasikan — jembatan strangler. */
    legacyRead: function (legacyKey, fallback) {
      try {
        var raw = localStorage.getItem(legacyKey);
        if (raw == null) return fallback;
        return JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    /* Tulis key legacy — HANYA untuk interop masa transisi (mis. importer
       menulis pnwCastflowVisualStyle.v2, workspace menulis grid v94). */
    legacyWrite: function (legacyKey, value) {
      try {
        localStorage.setItem(legacyKey, JSON.stringify(value));
        return true;
      } catch (e) {
        logWarn("legacyWrite gagal", { key: legacyKey, error: String(e) });
        return false;
      }
    },
  };

  /* ---------------- Feature Flags ---------------- */
  var flags = {
    get: function (name, def) {
      var all = storage.get("flags", {});
      return typeof all[name] === "undefined" ? def : !!all[name];
    },
    set: function (name, val) {
      var all = storage.get("flags", {});
      all[name] = !!val;
      storage.set("flags", all);
    },
  };

  /* ---------------- Global Error Handler (S1-05) ---------------- */
  function pushError(entry) {
    var errs = state.diagnostics.errors.slice();
    errs.push(entry);
    if (errs.length > 20) errs = errs.slice(errs.length - 20);
    state.diagnostics.errors = errs;
  }
  window.addEventListener("error", function (ev) {
    if (!ev) return;
    /* Resource error (script/img/link) punya target != window — catat warn saja. */
    if (ev.target && ev.target !== window) {
      logWarn("resource gagal dimuat", { src: String(ev.target.src || ev.target.href || "") });
      return;
    }
    var entry = { message: String(ev.message || "error"), at: Date.now(), source: "window.onerror" };
    pushError(entry);
    logError(entry.message, { source: entry.source });
    bus.emit(Events.APP_ERROR, entry);
  });
  window.addEventListener("unhandledrejection", function (ev) {
    var entry = {
      message: "unhandled rejection: " + String((ev.reason && (ev.reason.message || ev.reason)) || "unknown"),
      at: Date.now(),
      source: "unhandledrejection",
    };
    pushError(entry);
    logError(entry.message, { source: entry.source });
    bus.emit(Events.APP_ERROR, entry);
  });

  /* ---------------- Mode & boot ---------------- */
  var isOutput = /[?&]mode=(display|stage|youthviews|youth-views|views)/.test(location.search);
  state.app.mode = isOutput ? (/[?&]mode=stage/.test(location.search) ? "stage" : "output") : "operator";

  bus.emit(Events.APP_INIT, { version: VERSION, mode: state.app.mode });
  function ready() {
    state.app.initialized = true;
    bus.emit(Events.APP_READY, { version: VERSION, mode: state.app.mode });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();

  window.CastFlowKernel = {
    VERSION: VERSION,
    LABEL: LABEL,
    NS: NS,
    Events: Events,
    bus: bus,
    store: store,
    scheduler: scheduler,
    storage: storage,
    flags: flags,
  };
})();
