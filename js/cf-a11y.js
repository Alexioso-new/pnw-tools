/* PNW-FILE-GUIDE
   js/cf-a11y.js — ACCESSIBILITY GUARD v104 (Sprint 5: S5-03).
   Progressive enhancement tanpa mengubah layout visual:
     • nama aksesibel untuk kontrol ikon / input dinamis,
     • landmark workspace + skip link,
     • semantics menu, tab, toggle, dan bahasa,
     • focus trap generik untuk dialog + pulihkan fokus saat tutup,
     • audit terukur ke store/storage + event a11y:audit-finished.
   MutationObserver hanya memproses node baru / perubahan visibilitas dan
   didebounce lewat scheduler.idle — tidak ada polling interval baru.
 */
(function () {
  "use strict";
  var K = window.CastFlowKernel;
  if (!K) return;

  var LABELS = {
    closeProjBtn: "Close CastFlow",
    cfPopBtn: "Pop out or dock preview",
    projPrevSlide: "Previous slide",
    projNextSlide: "Next slide",
    cfAvatarBtn: "Account and settings",
    cfHkBtn: "Keyboard shortcuts",
    cfFontPickerBtn: "Choose lyric font",
    cfOutputChip: "Output status and reconnect",
    cfAfX: "Close Auto-Format Lyrics",
    cfDiagClose: "Close Diagnostics",
    cfPreflightClose: "Close Preflight Check",
  };
  var GLYPHS = {
    "✕": "Close",
    "×": "Close",
    "◀": "Previous",
    "▶": "Next",
    "⧉": "Pop out or dock",
    "?": "Help",
    "+": "Add",
  };
  var scheduled = false;
  var lastDialog = null;
  var restoreFocus = null;

  function list(root, selector) {
    var out = [];
    if (root && root.nodeType === 1 && root.matches && root.matches(selector)) out.push(root);
    var base = root && root.querySelectorAll ? root : document;
    return out.concat(Array.prototype.slice.call(base.querySelectorAll(selector)));
  }
  function clean(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }
  function labelledByText(el) {
    var ids = clean(el.getAttribute("aria-labelledby"));
    if (!ids) return "";
    return ids
      .split(/\s+/)
      .map(function (id) {
        var n = document.getElementById(id);
        return n ? clean(n.textContent) : "";
      })
      .join(" ")
      .trim();
  }
  function accessibleName(el) {
    if (!el) return "";
    var aria = clean(el.getAttribute("aria-label"));
    if (aria) return aria;
    var by = labelledByText(el);
    if (by) return by;
    var title = clean(el.getAttribute("title"));
    var text = clean(el.textContent);
    if (text) return text;
    if (title) return title;
    var img = el.querySelector && el.querySelector("img[alt]");
    return img ? clean(img.getAttribute("alt")) : "";
  }
  function ignored(el) {
    if (!el || el.hidden || el.getAttribute("aria-hidden") === "true") return true;
    if (el.closest && el.closest('[hidden],[aria-hidden="true"]')) return true;
    try {
      var cs = getComputedStyle(el);
      return cs.display === "none" || cs.visibility === "hidden";
    } catch (e) {
      return false;
    }
  }
  function setName(el, value) {
    if (!el || !value || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return;
    el.setAttribute("aria-label", value);
  }
  function deriveFieldName(el) {
    var ph = clean(el.getAttribute("placeholder"));
    if (ph) return ph.replace(/[…:]+$/, "");
    var title = clean(el.getAttribute("title"));
    if (title) return title;
    var field = el.closest && el.closest(".projField,.cfUserLang,.cfDiagRow");
    if (field) {
      var lab = field.querySelector("label,.label,b");
      if (lab) return clean(lab.textContent);
    }
    return el.id ? el.id.replace(/^cf|^proj/, "").replace(/([a-z])([A-Z])/g, "$1 $2") : "Input";
  }
  function ensureSkipLink() {
    if (K.store.slice("app").mode !== "operator" || document.getElementById("cfSkipLink")) return;
    var a = document.createElement("a");
    a.id = "cfSkipLink";
    a.className = "cfSkipLink";
    a.href = "#projPage";
    a.textContent = "Skip to CastFlow workspace";
    document.body.insertBefore(a, document.body.firstChild);
  }
  function syncStates() {
    var main = document.getElementById("projPage");
    if (main) {
      main.setAttribute("role", "main");
      main.setAttribute("aria-label", "CastFlow presenter workspace");
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    }
    var avatar = document.getElementById("cfAvatarBtn");
    var menu = document.getElementById("cfUserMenu");
    if (avatar) {
      setName(avatar, LABELS.cfAvatarBtn);
      avatar.setAttribute("aria-haspopup", "menu");
      avatar.setAttribute("aria-controls", "cfUserMenu");
      avatar.setAttribute("aria-expanded", menu && !menu.hidden ? "true" : "false");
    }
    if (menu) {
      menu.setAttribute("role", "menu");
      menu.setAttribute("aria-label", "Account and CastFlow settings");
      list(menu, "button,.cfUserItem").forEach(function (x) {
        if (x.tagName === "BUTTON") x.setAttribute("role", "menuitem");
      });
    }
    ["cfPreviewModes", "cfLangSeg"].forEach(function (id) {
      var group = document.getElementById(id);
      if (group) group.setAttribute("role", id === "cfPreviewModes" ? "tablist" : "group");
    });
    list(document, ".cfViewToggle").forEach(function (x) {
      x.setAttribute("role", "tablist");
      x.setAttribute("aria-label", "Lyric or timeline view");
    });
    list(document, "[data-preview-mode],[data-cfview],[data-tab]").forEach(function (x) {
      x.setAttribute("role", "tab");
      var on = x.classList.contains("on") || x.getAttribute("aria-selected") === "true";
      x.setAttribute("aria-selected", on ? "true" : "false");
      x.setAttribute("tabindex", on ? "0" : "-1");
    });
    list(document, "[data-cflang],[data-cflang2]").forEach(function (x) {
      var on = x.classList.contains("on");
      x.setAttribute("aria-pressed", on ? "true" : "false");
      var code = x.getAttribute("data-cflang") || x.getAttribute("data-cflang2") || clean(x.textContent);
      setName(x, code === "id" ? "Bahasa Indonesia" : "English");
    });
  }
  function repair(root) {
    document.documentElement.lang = window.CastFlow && CastFlow.lang ? CastFlow.lang() : "en";
    ensureSkipLink();
    Object.keys(LABELS).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) setName(el, LABELS[id]);
    });
    list(root || document, "button").forEach(function (b) {
      if (accessibleName(b)) {
        var text = clean(b.textContent);
        if (!b.getAttribute("aria-label") && b.getAttribute("title") && (text.length <= 2 || GLYPHS[text]))
          setName(b, clean(b.getAttribute("title")));
        return;
      }
      var glyph = GLYPHS[clean(b.textContent)];
      setName(b, glyph || (b.id ? b.id.replace(/([a-z])([A-Z])/g, "$1 $2") : "Button"));
    });
    list(root || document, "input,select,textarea").forEach(function (el) {
      if (!accessibleName(el)) setName(el, deriveFieldName(el));
    });
    list(root || document, "img").forEach(function (img) {
      if (!img.hasAttribute("alt")) img.setAttribute("alt", img.id === "cfTopBrand" ? "CastFlow" : "");
    });
    list(root || document, '[role="dialog"]').forEach(function (d) {
      if (!d.hasAttribute("tabindex")) d.setAttribute("tabindex", "-1");
      if (!accessibleName(d)) {
        var h = d.querySelector("h1,h2,h3,h4,.cfAfHead b");
        setName(d, h ? clean(h.textContent) : "Dialog");
      }
    });
    syncStates();
  }
  function activeDialog() {
    var dialogs = list(document, '[role="dialog"]');
    for (var i = dialogs.length - 1; i >= 0; i--) if (!ignored(dialogs[i])) return dialogs[i];
    return null;
  }
  function syncDialogFocus() {
    var d = activeDialog();
    if (d && d !== lastDialog) {
      restoreFocus = document.activeElement;
      lastDialog = d;
      setTimeout(function () {
        var target = d.querySelector('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
        (target || d).focus();
      }, 0);
    } else if (!d && lastDialog) {
      lastDialog = null;
      if (restoreFocus && restoreFocus.isConnected && restoreFocus.focus) restoreFocus.focus();
      restoreFocus = null;
    }
  }
  function audit(announce) {
    repair(document);
    var interactive = list(document, 'button,a[href],input:not([type="hidden"]),select,textarea,[role="button"],[role="tab"],[role="menuitem"]');
    var unlabeled = [];
    interactive.forEach(function (el) {
      if (!ignored(el) && !accessibleName(el)) unlabeled.push(el.id || el.className || el.tagName.toLowerCase());
    });
    var imageIssues = list(document, "img:not([alt])").filter(function (x) { return !ignored(x); }).length;
    var dialogIssues = list(document, '[role="dialog"]').filter(function (x) { return !accessibleName(x); }).length;
    var main = !!document.querySelector('[role="main"]');
    var langOk = !!document.documentElement.lang;
    var score = Math.max(0, 100 - unlabeled.length * 8 - imageIssues * 5 - dialogIssues * 10 - (main ? 0 : 8) - (langOk ? 0 : 4));
    var report = {
      generatedAt: new Date().toISOString(),
      status: score >= 95 && !unlabeled.length && !dialogIssues ? "pass" : score >= 80 ? "warn" : "fail",
      score: score,
      interactive: interactive.filter(function (x) { return !ignored(x); }).length,
      unlabeled: unlabeled.slice(0, 20),
      imageIssues: imageIssues,
      dialogIssues: dialogIssues,
      mainLandmark: main,
      lang: document.documentElement.lang || "",
    };
    K.store.set("diagnostics", { a11y: report });
    K.storage.set("diagnostics:lastA11y", report);
    K.bus.emit(K.Events.A11Y_AUDIT_FINISHED, report);
    if (announce && K.toast) {
      var msg = "Accessibility " + report.score + "/100 · " + report.status.toUpperCase();
      report.status === "pass" ? K.toast.success(msg) : K.toast.warn(msg);
    }
    return report;
  }
  function schedule(root) {
    if (root && root.nodeType === 1) repair(root);
    if (scheduled) return;
    scheduled = true;
    var run = function () {
      scheduled = false;
      repair(document);
      syncDialogFocus();
    };
    if (K.scheduler && K.scheduler.idle) K.scheduler.idle(run, 500);
    else setTimeout(run, 50);
  }
  function init() {
    repair(document);
    audit(false);
    syncDialogFocus();
    try {
      var mo = new MutationObserver(function (records) {
        records.forEach(function (r) {
          for (var i = 0; i < r.addedNodes.length; i++) schedule(r.addedNodes[i]);
        });
        schedule();
      });
      mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class"] });
    } catch (e) {}
    document.addEventListener("click", function () { schedule(); }, true);
    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Tab") return;
        var d = activeDialog();
        if (!d) return;
        var f = list(d, 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])').filter(function (x) { return !ignored(x); });
        if (!f.length) {
          e.preventDefault();
          d.focus();
          return;
        }
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      },
      true
    );
  }

  K.a11y = { repair: repair, scan: function () { schedule(); }, audit: audit, accessibleName: accessibleName };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
