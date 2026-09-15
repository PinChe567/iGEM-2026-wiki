/**
 * Sustainability interactions:
 * 1) Food-decision pathway
 * 2) SDG interaction map
 * Progressive enhancement — all detail copy remains in the DOM.
 */
(function () {
  "use strict";

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function initToggleGroup(options) {
    var root = options.root;
    var triggers = qsa(options.triggerSel, root);
    var details = qsa(options.detailSel, root);
    var live = options.liveSel ? qs(options.liveSel, root) : null;
    var panel = options.panelSel ? qs(options.panelSel, root) : null;
    var idAttr = options.idAttr;
    var titleAttr = options.titleAttr || "data-sust-title";
    if (!triggers.length || !details.length) return;

    root.classList.add("is-enhanced");

    function activate(id, opts) {
      var conf = opts || {};
      var matched = false;

      details.forEach(function (detail) {
        var on = detail.getAttribute(idAttr) === id;
        detail.classList.toggle("is-active", on);
        if (on) {
          detail.removeAttribute("hidden");
          matched = true;
        } else {
          detail.setAttribute("hidden", "");
        }
      });

      triggers.forEach(function (node) {
        var on = node.getAttribute(options.triggerIdAttr) === id;
        node.setAttribute("aria-pressed", on ? "true" : "false");
        node.classList.toggle("is-active", on);
      });

      if (!matched) return;

      if (live) {
        var active = qs("[" + idAttr + '="' + id + '"]', root);
        var title = active ? active.getAttribute(titleAttr) || id : id;
        live.textContent = "Showing detail: " + title + ".";
      }

      if (conf.focusPanel && panel) {
        panel.focus({ preventScroll: true });
      }

      if (conf.scroll && panel && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        var rect = panel.getBoundingClientRect();
        if (rect.top < 80 || rect.bottom > window.innerHeight) {
          panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    }

    triggers.forEach(function (node) {
      node.addEventListener("click", function () {
        activate(node.getAttribute(options.triggerIdAttr), { focusPanel: false, scroll: true });
      });

      node.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate(node.getAttribute(options.triggerIdAttr), { focusPanel: true, scroll: true });
      });
    });

    var initialNode =
      qs(options.triggerSel + ".is-active", root) || triggers[0];
    activate(initialNode.getAttribute(options.triggerIdAttr), {
      focusPanel: false,
      scroll: false,
    });
  }

  function initPathway(root) {
    initToggleGroup({
      root: root,
      triggerSel: "[data-sust-node]",
      detailSel: "[data-sust-detail]",
      liveSel: "[data-sust-path-live]",
      panelSel: "[data-sust-path-panel]",
      triggerIdAttr: "data-sust-node",
      idAttr: "data-sust-detail",
      titleAttr: "data-sust-title",
    });
  }

  function initSdgMap(root) {
    initToggleGroup({
      root: root,
      triggerSel: "[data-sust-link]",
      detailSel: "[data-sust-sdg-detail]",
      liveSel: "[data-sust-sdg-live]",
      panelSel: "[data-sust-sdg-panel]",
      triggerIdAttr: "data-sust-link",
      idAttr: "data-sust-sdg-detail",
      titleAttr: "data-sust-title",
    });

    /* Cards remain the accessible control set; matrix stays clickable for pointer users. */
    var matrix = qs(".sust-sdgmap__matrix-wrap", root);
    if (!matrix) return;
    var cells = qsa(".sust-sdgmap__cell", matrix);

    function syncMatrixA11y() {
      matrix.setAttribute("aria-hidden", "true");
      matrix.removeAttribute("tabindex");
      cells.forEach(function (cell) {
        cell.setAttribute("tabindex", "-1");
      });
    }

    syncMatrixA11y();
  }

  function initLedger(root) {
    var buttons = qsa("[data-sust-ledger-filter]", root);
    var cards = qsa("[data-sust-ledger-status]", root);
    var count = qs("[data-sust-ledger-count]", root);
    var noscript = qs(".sust-ledger-noscript", root);
    if (!buttons.length || !cards.length) return;

    root.classList.add("is-enhanced");
    if (noscript) noscript.hidden = true;

    function apply(filter) {
      var visible = 0;
      cards.forEach(function (card) {
        var status = card.getAttribute("data-sust-ledger-status");
        var show = filter === "all" || status === filter;
        card.hidden = !show;
        card.classList.toggle("is-filtered-out", !show);
        if (show) visible += 1;
      });

      buttons.forEach(function (btn) {
        var on = btn.getAttribute("data-sust-ledger-filter") === filter;
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.classList.toggle("is-active", on);
      });

      if (count) {
        if (filter === "all") {
          count.textContent = "Showing all " + visible + " entries";
        } else {
          count.textContent = "Showing " + visible + " · filter: " + filter;
        }
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(btn.getAttribute("data-sust-ledger-filter"));
      });
    });

    apply("all");
  }

  function initCanvasCopy(root) {
    var btn = qs("[data-sust-canvas-copy]", root);
    var plain = qs("[data-sust-canvas-plain]", root);
    var status = qs("[data-sust-canvas-copy-status]", root);
    if (!btn || !plain) return;

    var idleLabel = btn.textContent;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function copyFallback(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(ta);
      return ok;
    }

    btn.addEventListener("click", function () {
      var text = (plain.textContent || "").replace(/^\s+|\s+$/g, "");
      function succeed() {
        setStatus("Template copied to clipboard.");
        btn.textContent = "Copied";
        window.setTimeout(function () {
          btn.textContent = idleLabel;
        }, 2000);
      }
      function fail() {
        setStatus("Copy failed — select the blank canvas text and copy manually.");
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(succeed).catch(function () {
          if (copyFallback(text)) succeed();
          else fail();
        });
      } else if (copyFallback(text)) {
        succeed();
      } else {
        fail();
      }
    });
  }

  function boot() {
    qsa("[data-sust-pathway]").forEach(initPathway);
    qsa("[data-sust-sdg-map]").forEach(initSdgMap);
    qsa("[data-sust-ledger]").forEach(initLedger);
    qsa("[data-sust-canvas-blank]").forEach(initCanvasCopy);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
