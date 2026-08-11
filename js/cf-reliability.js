/* PNW-FILE-GUIDE
   js/cf-reliability.js — PERFORMANCE + SOAK MONITOR v104 (Sprint 5).
   Monitor ringan (15 dtk, berhenti saat tab tersembunyi): DOM nodes, resource,
   JS heap bila tersedia, error, output state, event-loop lag, Long Tasks.
   Uji reliability/soak default 2 jam: baseline -> transisi output -> ambang
   error/DOM/heap/lag/long-task -> laporan JSON tersimpan + dapat diunduh.
   API QA mendukung durationMs pendek; produksi selalu memakai 2 jam dari UI.
 */
(function () {
  "use strict";
  var K = window.CastFlowKernel;
  if (!K || !K.scheduler) return;

  var SAMPLE_MS = 15000;
  var samples = [];
  var lastSampleAt = 0;
  var longTasks = { count: 0, totalMs: 0, maxMs: 0 };
  var soak = null;
  var soakStopTimer = null;
  var offEvents = [];

  function round(n, p) {
    var m = Math.pow(10, p || 0);
    return Math.round(n * m) / m;
  }
  function heapMB() {
    try {
      return performance.memory ? round(performance.memory.usedJSHeapSize / 1048576, 2) : null;
    } catch (e) {
      return null;
    }
  }
  function errorsNow() {
    var d = K.store.slice("diagnostics");
    return (d.errors || []).length;
  }
  function publicSoak() {
    if (!soak) return null;
    var now = Date.now();
    return {
      running: !!soak.running,
      label: soak.label,
      startedAt: soak.startedAt,
      endsAt: soak.endsAt,
      durationMs: soak.durationMs,
      elapsedMs: Math.max(0, Math.min(soak.durationMs, now - soak.startedAt)),
      progress: round(Math.max(0, Math.min(1, (now - soak.startedAt) / soak.durationMs)) * 100, 1),
      disconnects: soak.disconnects || 0,
      stale: soak.stale || 0,
    };
  }
  function syncSoak() {
    K.store.set("diagnostics", { soak: publicSoak() });
    if (soak && soak.running) K.storage.set("diagnostics:activeSoak", soak);
  }
  function updateSoak(s) {
    if (!soak || !soak.running) return;
    soak.maxDom = Math.max(soak.maxDom || 0, s.domNodes || 0);
    if (s.heapMB != null) soak.maxHeapMB = Math.max(soak.maxHeapMB || 0, s.heapMB);
    soak.maxLagMs = Math.max(soak.maxLagMs || 0, s.eventLoopLagMs || 0);
    soak.maxLongTaskMs = Math.max(soak.maxLongTaskMs || 0, s.longTaskMaxMs || 0);
    syncSoak();
  }
  function sample() {
    var now = Date.now();
    var out = K.store.slice("connection").output || {};
    var s = {
      at: now,
      domNodes: document.getElementsByTagName("*").length,
      resources: performance.getEntriesByType ? performance.getEntriesByType("resource").length : 0,
      heapMB: heapMB(),
      errors: errorsNow(),
      outputStatus: out.status || "idle",
      eventLoopLagMs: lastSampleAt ? Math.max(0, Math.round(now - lastSampleAt - SAMPLE_MS)) : 0,
      longTaskCount: longTasks.count,
      longTaskTotalMs: round(longTasks.totalMs, 1),
      longTaskMaxMs: round(longTasks.maxMs, 1),
      schedulerJobs: K.scheduler.stats().active,
    };
    lastSampleAt = now;
    samples.push(s);
    if (samples.length > 480) samples = samples.slice(samples.length - 480);
    K.store.set("diagnostics", { performance: s });
    K.bus.emit(K.Events.PERFORMANCE_SAMPLE, s);
    updateSoak(s);
    return s;
  }
  function attachSoakEvents() {
    offEvents.forEach(function (off) { off(); });
    offEvents = [
      K.bus.on(K.Events.OUTPUT_DISCONNECTED, function () { if (soak) soak.disconnects = (soak.disconnects || 0) + 1; }),
      K.bus.on(K.Events.OUTPUT_STALE, function () { if (soak) soak.stale = (soak.stale || 0) + 1; }),
      K.bus.on(K.Events.OUTPUT_CONNECTED, function () { if (soak) soak.reconnects = (soak.reconnects || 0) + 1; }),
    ];
  }
  function detachSoakEvents() {
    offEvents.forEach(function (off) { off(); });
    offEvents = [];
  }
  function scheduleSoakEnd() {
    if (soakStopTimer) soakStopTimer();
    if (!soak || !soak.running) return;
    var tickMs = Math.min(5000, Math.max(250, Math.round(soak.durationMs / 4)));
    soakStopTimer = K.scheduler.every(
      function () {
        syncSoak();
        if (soak && Date.now() >= soak.endsAt) stopSoak("completed");
      },
      tickMs,
      { name: "soak-watch" }
    );
  }
  function startSoak(opts) {
    opts = opts || {};
    if (soak && soak.running) return false;
    var duration = Math.max(500, Number(opts.durationMs) || 2 * 60 * 60 * 1000);
    var base = sample();
    soak = {
      running: true,
      label: opts.label || "production-2h",
      startedAt: Date.now(),
      endsAt: Date.now() + duration,
      durationMs: duration,
      baseline: base,
      baselineLongTasks: longTasks.count,
      disconnects: 0,
      stale: 0,
      reconnects: 0,
      maxDom: base.domNodes,
      maxHeapMB: base.heapMB || 0,
      maxLagMs: 0,
      maxLongTaskMs: 0,
    };
    attachSoakEvents();
    scheduleSoakEnd();
    syncSoak();
    K.bus.emit(K.Events.SOAK_STARTED, publicSoak());
    if (K.toast && !opts.silent) K.toast.info("Reliability test dimulai (2 jam).", 5000);
    return true;
  }
  function grade(id, value, passMax, warnMax, unit) {
    var status = value <= passMax ? "pass" : value <= warnMax ? "warn" : "fail";
    return { id: id, status: status, value: round(value, 2), unit: unit || "", passMax: passMax, warnMax: warnMax };
  }
  function stopSoak(reason, opts) {
    opts = opts || {};
    if (!soak || !soak.running) return K.storage.get("diagnostics:lastSoak", null);
    var end = sample();
    soak.running = false;
    if (soakStopTimer) {
      soakStopTimer();
      soakStopTimer = null;
    }
    detachSoakEvents();
    var heapGrowth = end.heapMB != null && soak.baseline.heapMB != null ? Math.max(0, end.heapMB - soak.baseline.heapMB) : 0;
    var checks = [
      grade("new-errors", Math.max(0, end.errors - soak.baseline.errors), 0, 1, "errors"),
      grade("dom-growth", Math.max(0, soak.maxDom - soak.baseline.domNodes), 200, 500, "nodes"),
      grade("heap-growth", heapGrowth, 25, 50, "MB"),
      grade("event-loop-lag", soak.maxLagMs || 0, 200, 500, "ms"),
      grade("long-task-max", soak.maxLongTaskMs || 0, 250, 1000, "ms"),
      grade("output-disconnects", soak.disconnects || 0, 0, 2, "events"),
    ];
    var status = checks.some(function (x) { return x.status === "fail"; })
      ? "fail"
      : checks.some(function (x) { return x.status === "warn"; })
        ? "warn"
        : "pass";
    var report = {
      format: "castflow-reliability-report",
      schemaVersion: 1,
      app: { release: K.VERSION, label: K.LABEL },
      label: soak.label,
      reason: reason || "manual",
      status: status,
      startedAt: new Date(soak.startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      requestedDurationMs: soak.durationMs,
      actualDurationMs: Date.now() - soak.startedAt,
      baseline: soak.baseline,
      final: end,
      transitions: { disconnected: soak.disconnects || 0, stale: soak.stale || 0, reconnected: soak.reconnects || 0 },
      checks: checks,
      sampleCount: samples.filter(function (x) { return x.at >= soak.startedAt; }).length,
    };
    K.storage.set("diagnostics:lastSoak", report);
    K.storage.remove("diagnostics:activeSoak");
    K.store.set("diagnostics", { soak: { running: false, lastReport: report } });
    K.bus.emit(K.Events.SOAK_FINISHED, report);
    if (K.toast && !opts.silent) {
      var msg = "Reliability test " + status.toUpperCase() + " — laporan siap.";
      status === "pass" ? K.toast.success(msg, 5000) : K.toast.warn(msg, 6000);
    }
    soak = null;
    return report;
  }
  function exportReport(report) {
    report = report || K.storage.get("diagnostics:lastSoak", null);
    if (!report) return false;
    var blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "castflow-reliability-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return true;
  }
  function resume() {
    var saved = K.storage.get("diagnostics:activeSoak", null);
    if (!saved || !saved.running) return;
    soak = saved;
    attachSoakEvents();
    if (Date.now() >= soak.endsAt) stopSoak("completed-after-resume", { silent: true });
    else {
      scheduleSoakEnd();
      syncSoak();
    }
  }

  try {
    if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.indexOf("longtask") >= 0) {
      var po = new PerformanceObserver(function (entries) {
        entries.getEntries().forEach(function (e) {
          longTasks.count++;
          longTasks.totalMs += e.duration || 0;
          longTasks.maxMs = Math.max(longTasks.maxMs, e.duration || 0);
          if (soak && soak.running) soak.maxLongTaskMs = Math.max(soak.maxLongTaskMs || 0, e.duration || 0);
        });
      });
      po.observe({ type: "longtask", buffered: true });
    }
  } catch (e) {}

  K.reliability = {
    sample: sample,
    samples: function () { return samples.slice(); },
    startSoak: startSoak,
    stopSoak: stopSoak,
    exportReport: exportReport,
    status: publicSoak,
    lastReport: function () { return K.storage.get("diagnostics:lastSoak", null); },
    longTasks: function () { return { count: longTasks.count, totalMs: longTasks.totalMs, maxMs: longTasks.maxMs }; },
  };
  sample();
  K.scheduler.every(sample, SAMPLE_MS, { name: "performance-sample" });
  resume();
})();
