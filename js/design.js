/**
 * Design page interactions — explain architecture, not decorate it.
 * Progressive enhancement. Copy lives in design.html (from design_content.md).
 * Without JS, cassette/receptor hits are in-page links to the static records.
 */
(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("page-design")) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function catalogArticle(moduleId, feature) {
    return qs(
      '#design-feature-catalog [data-module="' + moduleId + '"][data-feature="' + feature + '"]'
    );
  }

  function setCurrent(el, on) {
    if (el.hasAttribute("aria-pressed")) {
      el.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (el.hasAttribute("aria-current")) {
      el.setAttribute("aria-current", on ? "true" : "false");
    }
    el.classList.toggle("is-active", on);
  }

  /* ---------- A. Plasmid inspector ---------- */
  function initInspectors() {
    var catalog = qs("#design-feature-catalog");
    var svg = qs("#fig-constructs svg");
    if (!catalog) return;

    var inspectors = qsa("[data-inspector]");

    function matches(el, moduleId, feature) {
      return (
        String(el.getAttribute("data-module")) === String(moduleId) &&
        el.getAttribute("data-feature") === feature
      );
    }

    function allHits() {
      return qsa("a[data-module][data-feature], #fig-constructs svg g[data-feature]");
    }

    function show(moduleId, feature, announce) {
      var article = catalogArticle(moduleId, feature);
      if (!article) return;

      inspectors.forEach(function (root) {
        var scoped = root.getAttribute("data-inspector");
        var panel = qs("[data-inspector-panel]", root);
        var live = qs("[data-inspector-live]", root);
        var empty = qs("[data-inspector-empty]", root);
        if (!panel) return;
        if (scoped && scoped !== "overview" && scoped !== String(moduleId)) {
          if (empty) panel.innerHTML = empty.innerHTML;
          if (live) live.textContent = "";
          return;
        }
        panel.innerHTML = article.innerHTML;
        if (live) {
          live.textContent = announce ? panel.textContent.replace(/\s+/g, " ").trim() : "";
        }
      });

      allHits().forEach(function (el) {
        setCurrent(el, matches(el, moduleId, feature));
      });

      if (svg) svg.classList.add("is-inspecting");
    }

    function clear() {
      inspectors.forEach(function (root) {
        var panel = qs("[data-inspector-panel]", root);
        var empty = qs("[data-inspector-empty]", root);
        var live = qs("[data-inspector-live]", root);
        if (panel && empty) panel.innerHTML = empty.innerHTML;
        if (live) live.textContent = "";
      });
      allHits().forEach(function (el) {
        setCurrent(el, false);
      });
      if (svg) svg.classList.remove("is-inspecting");
    }

    function activate(el, announce) {
      var moduleId = el.getAttribute("data-module");
      var feature = el.getAttribute("data-feature");
      if (!moduleId || !feature) return;
      var already =
        el.getAttribute("aria-current") === "true" ||
        el.getAttribute("aria-pressed") === "true" ||
        el.classList.contains("is-active");
      var coarse = window.matchMedia("(hover: none)").matches;
      if (already && coarse) {
        clear();
        return;
      }
      show(moduleId, feature, announce);
    }

    qsa("a[data-module][data-feature]").forEach(function (hit) {
      hit.addEventListener("click", function (event) {
        event.preventDefault();
        activate(hit, true);
      });
      hit.addEventListener("mouseenter", function () {
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          show(hit.getAttribute("data-module"), hit.getAttribute("data-feature"), false);
        }
      });
      hit.addEventListener("focus", function () {
        if (window.matchMedia("(hover: none)").matches) return;
        show(hit.getAttribute("data-module"), hit.getAttribute("data-feature"), true);
      });
    });

    if (svg) {
      qsa("g[data-feature]", svg).forEach(function (g) {
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.addEventListener("click", function () {
          activate(g, true);
        });
        g.addEventListener("keydown", function (event) {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          activate(g, true);
        });
        g.addEventListener("mouseenter", function () {
          if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            show(g.getAttribute("data-module"), g.getAttribute("data-feature"), false);
          }
        });
        g.addEventListener("focus", function () {
          if (window.matchMedia("(hover: none)").matches) return;
          show(g.getAttribute("data-module"), g.getAttribute("data-feature"), true);
        });
      });
    }

    initInspectors.show = show;
    initInspectors.clear = clear;
  }

  /* ---------- B. Reporter before / after ---------- */
  function initReporterSwitch() {
    var root = qs("[data-reporter-switch]");
    if (!root) return;

    var tabs = qsa("[data-reporter-tab]", root);
    var figure = qs("#fig-reporter-evolution");

    function select(state) {
      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-reporter-tab") === state;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.setAttribute("tabindex", on ? "0" : "-1");
      });
      qsa("[data-reporter-panel]", root).forEach(function (panel) {
        var on = panel.getAttribute("data-reporter-panel") === state;
        panel.hidden = !on;
      });
      if (figure) figure.setAttribute("data-reporter-state", state);
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(tab.getAttribute("data-reporter-tab"));
      });
      tab.addEventListener("keydown", function (event) {
        var next = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
          next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[next].focus();
        select(tabs[next].getAttribute("data-reporter-tab"));
      });
    });

    select("final");
  }

  /* ---------- C. Topology states ---------- */
  function initTopology() {
    var root = qs("[data-topo-switch]");
    var figure = qs("#fig-topology");
    if (!root || !figure) return;

    var buttons = qsa("[data-topo]", root);

    function select(state) {
      buttons.forEach(function (btn) {
        var on = btn.getAttribute("data-topo") === state;
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      figure.setAttribute("data-topo-state", state);
      qsa("[data-topo-panel]").forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-topo-panel") !== state;
      });
    }

    buttons.forEach(function (btn, index) {
      btn.addEventListener("click", function () {
        select(btn.getAttribute("data-topo"));
      });
      btn.addEventListener("keydown", function (event) {
        var next = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % buttons.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
          next = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;
        else return;
        event.preventDefault();
        buttons[next].focus();
        select(buttons[next].getAttribute("data-topo"));
      });
    });

    select("orientation");
  }

  /* ---------- D. Receptor panel ---------- */
  function initReceptorGrid() {
    var root = qs("[data-or-grid]");
    if (!root) return;

    var buttons = qsa("[data-or]", root);
    var panel = qs("[data-or-panel]", root);
    var empty = qs("[data-or-empty]", root);

    function show(name) {
      var card = qs('#design-or-catalog [data-or="' + name + '"]');
      if (!panel || !card) return;
      panel.innerHTML = card.innerHTML;
      buttons.forEach(function (btn) {
        var on = btn.getAttribute("data-or") === name;
        setCurrent(btn, on);
      });
    }

    function clear() {
      if (panel && empty) panel.innerHTML = empty.innerHTML;
      buttons.forEach(function (btn) {
        setCurrent(btn, false);
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        if (btn.tagName === "A") event.preventDefault();
        if (btn.getAttribute("aria-current") === "true" || btn.getAttribute("aria-pressed") === "true") {
          clear();
          return;
        }
        show(btn.getAttribute("data-or"));
      });
      btn.addEventListener("focus", function () {
        if (window.matchMedia("(hover: none)").matches) return;
        show(btn.getAttribute("data-or"));
      });
    });

    initReceptorGrid.show = show;
  }

  function applyHash() {
    var id = (window.location.hash || "").replace(/^#/, "");
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var moduleId = target.getAttribute("data-module");
    var feature = target.getAttribute("data-feature");
    var orName = target.getAttribute("data-or");
    if (moduleId && feature && initInspectors.show) {
      initInspectors.show(moduleId, feature, true);
      var map = qs("#fig-constructs");
      if (map && map.scrollIntoView) map.scrollIntoView({ block: "nearest" });
    }
    if (orName && initReceptorGrid.show) {
      initReceptorGrid.show(orName);
      var grid = qs("#receptor-panel");
      if (grid && grid.scrollIntoView) grid.scrollIntoView({ block: "nearest" });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add("is-design-enhanced");
    qsa(".design-static-record").forEach(function (record) {
      record.hidden = true;
    });
    initInspectors();
    initReporterSwitch();
    initTopology();
    initReceptorGrid();
    applyHash();
    window.addEventListener("hashchange", applyHash);
    if (reduceMotion) {
      document.documentElement.classList.add("design-reduced-motion");
    }
  });
})();
