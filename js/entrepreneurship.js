/**
 * Entrepreneurship page — chapter nav, progressive disclosure, tab switchers.
 * Relies on main.js for reveal, TOC, mobile nav, reading progress.
 */
(function () {
  "use strict";

  var doc = document;
  if (!doc.body || !doc.body.classList.contains("page-entrepreneurship")) return;

  function qs(sel, ctx) {
    return (ctx || doc).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }

  /* Keep <details> disclosure summaries in sync with aria-expanded */
  function initDisclose() {
    qsa("details.ent-disclose").forEach(function (el) {
      var summary = qs("summary", el);
      if (!summary) return;
      var id = el.id || "";
      if (id && !summary.getAttribute("aria-controls")) {
        var body = qs(".ent-disclose__body", el);
        if (body) {
          if (!body.id) body.id = id + "-body";
          summary.setAttribute("aria-controls", body.id);
        }
      }
      function sync() {
        summary.setAttribute("aria-expanded", el.open ? "true" : "false");
      }
      sync();
      el.addEventListener("toggle", sync);
    });
  }

  /* Sync horizontal chapter nav + sticky TOC current section */
  function initChapterCurrent() {
    var links = qsa(".page-toc a[href^='#']:not(.back-to-top)");
    if (!links.length) return;

    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      if (!map[id]) map[id] = [];
      map[id].push(a);
    });

    var ids = Object.keys(map);
    if (!ids.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          links.forEach(function (a) {
            a.removeAttribute("aria-current");
          });
          (map[id] || []).forEach(function (a) {
            a.setAttribute("aria-current", "true");
          });
        });
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
    );

    ids.forEach(function (id) {
      var section = doc.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* Tablet chapter nav: open by default below sticky-TOC breakpoint */
  function initChapterDetails() {
    var nav = qs(".ent-chapternav");
    if (!nav) return;
    function sync() {
      if (window.matchMedia("(max-width: 959px)").matches) {
        nav.setAttribute("open", "");
      }
    }
    sync();
    window.addEventListener("resize", sync);
  }

  /* Accessible tablists for batch journey + role switcher */
  function initTabs() {
    qsa("[data-ent-tabs]").forEach(function (root) {
      var tabs = qsa('[role="tab"]', root);
      var panels = qsa('[role="tabpanel"]', root);
      if (!tabs.length || !panels.length) return;

      function activate(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", on ? "true" : "false");
          t.tabIndex = on ? 0 : -1;
        });
        panels.forEach(function (p) {
          var match = p.id === tab.getAttribute("aria-controls");
          if (match) {
            p.removeAttribute("hidden");
          } else {
            p.setAttribute("hidden", "");
          }
        });
        if (focus) tab.focus();
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener("click", function () {
          activate(tab, false);
        });
        tab.addEventListener("keydown", function (event) {
          var key = event.key;
          var next = null;
          if (key === "ArrowRight" || key === "ArrowDown") {
            next = tabs[(index + 1) % tabs.length];
          } else if (key === "ArrowLeft" || key === "ArrowUp") {
            next = tabs[(index - 1 + tabs.length) % tabs.length];
          } else if (key === "Home") {
            next = tabs[0];
          } else if (key === "End") {
            next = tabs[tabs.length - 1];
          } else if (key === "Enter" || key === " ") {
            event.preventDefault();
            activate(tab, false);
            return;
          }
          if (next) {
            event.preventDefault();
            activate(next, true);
          }
        });
      });
    });
  }

  function initRiskFilter() {
    var root = qs("[data-ent-risk-filter]");
    if (!root) return;
    var chips = qsa("[data-risk-filter]", root);
    var cards = qsa(".ent-risk", root);
    if (!chips.length || !cards.length) return;

    function apply(filter) {
      chips.forEach(function (chip) {
        var on = chip.getAttribute("data-risk-filter") === filter;
        chip.classList.toggle("is-active", on);
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      });
      cards.forEach(function (card) {
        var cats = (card.getAttribute("data-risk-cat") || "").split(/\s+/);
        var show = filter === "all" || cats.indexOf(filter) !== -1;
        card.hidden = !show;
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        apply(chip.getAttribute("data-risk-filter") || "all");
      });
    });
  }

  function boot() {
    initDisclose();
    initChapterCurrent();
    initChapterDetails();
    initTabs();
    initRiskFilter();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
