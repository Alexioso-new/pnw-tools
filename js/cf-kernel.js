/* PNW-FILE-GUIDE
   js/cf-kernel.js — KERNEL v101 (Sprint 1: S1-01..S1-05).
   Satu sumber kebenaran untuk arsitektur baru CastFlow:
     • bus      : event bus (on/off/once/emit) — komunikasi antar modul.
     • store    : state global per slice (app/connection/program/diagnostics).
     • storage  : persistence adapter, semua key ber-namespace castflow:v101:.
     • flags    : feature flags tersimpan (bisa dipakai mematikan fitur baru).
     • errors   : global error handler -> PNWLog + event app:error.
   ATURAN (04_AGENT_RULES): modul baru WAJIB lewat kernel ini; dilarang
   menulis localStorage langsung dan dilarang polling untuk berkomunikasi.
   Dimuat SEBELUM cf-health.js / cf-preflight.js, SETELAH logger.js.
 */
(function () {
  "use strict";
  if (window.CastFlowKernel) return;

  var VERSION = "v101";
  var LABEL = "v9.1";
  var NS = "castflow:v101:";

  /* Event catalog (02_TECH_SPEC §8) — daftar resmi event v101. */
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
    diagnostics: { preflight: null, errors: [] },
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

  /* ---------------- Persistence Adapter (S1-04) ---------------- */
  function skey(key) {
    return NS + key;
  }
  var storage = {
    NS: NS,
    key: skey,
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
    storage: storage,
    flags: flags,
  };
})();
