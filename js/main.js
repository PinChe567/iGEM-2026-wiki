/**
 * AeroSense shared shell behaviors.
 * Progressive enhancement only — content and nav links work without JS.
 */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function qs(sel, ctx) {
    return (ctx || doc).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }

  /* ---------- Mobile nav + dropdowns ---------- */
  function initNav() {
    var header = qs(".site-header");
    var nav = qs("#site-nav");
    var toggle = qs(".nav-toggle");
    if (!header || !nav) return;

    var triggers = qsa(".nav-trigger", nav);
    var submenus = qsa(".nav-submenu", nav);

    function closeSubmenus(except) {
      triggers.forEach(function (btn) {
        if (except && btn === except) return;
        btn.setAttribute("aria-expanded", "false");
        var id = btn.getAttribute("aria-controls");
        var panel = id ? doc.getElementById(id) : null;
        if (panel) panel.classList.remove("is-open");
      });
    }

    function closeMobileNav() {
      if (!toggle) return;
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    }

    function closeAllMenus() {
      closeSubmenus(null);
      closeMobileNav();
    }

    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
        nav.classList.toggle("is-open", !open);
        if (open) closeSubmenus(null);
      });
    }

    triggers.forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        var expanded = btn.getAttribute("aria-expanded") === "true";
        closeSubmenus(btn);
        btn.setAttribute("aria-expanded", expanded ? "false" : "true");
        var id = btn.getAttribute("aria-controls");
        var panel = id ? doc.getElementById(id) : null;
        if (panel) panel.classList.toggle("is-open", !expanded);
      });

      btn.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          btn.setAttribute("aria-expanded", "false");
          var id = btn.getAttribute("aria-controls");
          var panel = id ? doc.getElementById(id) : null;
          if (panel) panel.classList.remove("is-open");
          btn.focus();
        }
      });
    });

    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeAllMenus();
    });

    doc.addEventListener("click", function (event) {
      if (!header.contains(event.target)) closeAllMenus();
    });

    /* Keep desktop dropdowns usable with Tab; close when focus leaves item */
    qsa(".nav-item--dropdown", nav).forEach(function (item) {
      item.addEventListener("focusout", function (event) {
        if (!item.contains(event.relatedTarget)) {
          var btn = qs(".nav-trigger", item);
          var panel = qs(".nav-submenu", item);
          if (btn) btn.setAttribute("aria-expanded", "false");
          if (panel) panel.classList.remove("is-open");
        }
      });
    });

    /* Expose for resize sanity */
    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        closeMobileNav();
      }
    });
  }

  /* ---------- Reading progress ---------- */
  function initProgress() {
    var bar = qs(".reading-progress");
    if (!bar) return;

    function update() {
      var el = doc.documentElement;
      var scrollTop = el.scrollTop || doc.body.scrollTop;
      var height = el.scrollHeight - el.clientHeight;
      var pct = height > 0 ? (scrollTop / height) * 100 : 0;
      bar.style.width = pct + "%";
      bar.setAttribute("aria-valuenow", String(Math.round(pct)));
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Back to top ---------- */
  function initBackToTop() {
    var btn = qs(".back-to-top");
    if (!btn) return;

    function update() {
      var y = window.scrollY || doc.documentElement.scrollTop;
      btn.classList.toggle("is-visible", y > 480);
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- TOC current section ---------- */
  function initTocSpy() {
    var links = qsa('.page-toc a[href^="#"]');
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      if (id) map[id] = link;
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          links.forEach(function (link) {
            link.removeAttribute("aria-current");
          });
          if (map[id]) map[id].setAttribute("aria-current", "true");
        });
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: 0,
      }
    );

    Object.keys(map).forEach(function (id) {
      var section = doc.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* ---------- Restrained reveal ---------- */
  function initReveal() {
    var nodes = qsa("[data-reveal]");
    if (!nodes.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    nodes.forEach(function (node) {
      node.classList.add("is-pending");
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove("is-pending");
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  /* ---------- Wide TOC details always open ---------- */
  function initTocDetails() {
    var toc = qs(".page-toc");
    if (!toc) return;

    function sync() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        toc.setAttribute("open", "");
      }
    }

    sync();
    window.addEventListener("resize", sync);
  }

  /* ---------- Contribution status filter ---------- */
  function initContributionFilter() {
    var root = qs("[data-contrib-filter]");
    if (!root) return;

    var buttons = qsa("[data-filter]", root);
    var packages = qsa(".contrib-package[data-contrib-status]");
    var rows = qsa(".contrib-table tbody tr[data-contrib-status]");

    function apply(filter) {
      buttons.forEach(function (btn) {
        var active = btn.getAttribute("data-filter") === filter;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });

      function match(status) {
        return filter === "all" || status === filter;
      }

      packages.forEach(function (node) {
        var status = node.getAttribute("data-contrib-status") || "";
        node.hidden = !match(status);
      });

      rows.forEach(function (node) {
        var status = node.getAttribute("data-contrib-status") || "";
        node.hidden = !match(status);
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(btn.getAttribute("data-filter") || "all");
      });
    });
  }

  /* ---------- Notebook filter (progressive enhancement) ---------- */
  function initNotebookFilter() {
    var form = qs("[data-notebook-filter]");
    if (!form) return;

    var live = qs("[data-notebook-filter-live]");
    var cards = qsa(
      ".nb-entry-list .nb-entry, .nb-milestone-list .nb-milestone, .nb-slot-list .nb-pending"
    );

    function val(name) {
      var el = form.elements.namedItem(name);
      return el && el.value ? el.value : "all";
    }

    function attrMatch(card, key, filter) {
      if (filter === "all") return true;
      var raw = card.getAttribute("data-" + key) || "";
      if (!raw || raw === "all") return true; /* wildcard slots */
      if (key === "month" && raw.indexOf(filter) !== -1) return true;
      return raw === filter;
    }

    function apply() {
      var month = val("month");
      var subteam = val("subteam");
      var exp = val("exp");
      var stream = val("stream");
      var status = val("status");
      var shown = 0;

      cards.forEach(function (card) {
        var ok =
          attrMatch(card, "month", month) &&
          attrMatch(card, "subteam", subteam) &&
          attrMatch(card, "exp", exp) &&
          attrMatch(card, "stream", stream) &&
          attrMatch(card, "status", status);
        card.hidden = !ok;
        if (ok) shown += 1;
      });

      if (live) {
        live.textContent =
          "Showing " + shown + " of " + cards.length + " filterable cards.";
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      apply();
    });

    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        cards.forEach(function (card) {
          card.hidden = false;
        });
        if (live) {
          live.textContent = "Filter reset. All filterable cards are shown.";
        }
      }, 0);
    });
  }

  /* ---------- Notebook 2026 calendar / Gantt detail panel ---------- */
  function initNotebookCalendar() {
    var root = qs("[data-notebook-calendar]");
    if (!root) return;

    var detail = qs("#nb-cal-detail", root);
    var titleEl = qs("[data-cal-detail-title]", root);
    var bodyEl = qs("[data-cal-detail-body]", root);
    var milestoneLink = qs("[data-cal-detail-milestone]", root);
    var expLink = qs("[data-cal-detail-exp]", root);
    var nbLink = qs("[data-cal-detail-nb]", root);
    var closeBtn = qs("[data-cal-detail-close]", root);
    var triggers = qsa("[data-cal-target]", root);
    var lastTrigger = null;

    function clearPressed() {
      triggers.forEach(function (btn) {
        if (btn.hasAttribute("aria-pressed")) btn.setAttribute("aria-pressed", "false");
      });
    }

    function openTarget(id, trigger) {
      var milestone = doc.getElementById(id);
      if (!milestone || !detail) return;

      clearPressed();
      if (trigger && trigger.hasAttribute("aria-pressed")) {
        trigger.setAttribute("aria-pressed", "true");
      }
      lastTrigger = trigger || null;

      var title =
        milestone.getAttribute("data-cal-title") ||
        (qs("h3", milestone) ? qs("h3", milestone).textContent : id);
      var summary = "";
      var paras = qsa("p", milestone);
      if (paras.length) {
        summary = paras[0].textContent || "";
      }

      if (titleEl) titleEl.textContent = title;
      if (bodyEl) {
        bodyEl.textContent =
          summary +
          " No dated work-performed notebook entry is published for this band yet.";
      }
      if (milestoneLink) {
        milestoneLink.href = "#" + id;
        milestoneLink.textContent = "Open milestone";
      }
      if (expLink) {
        expLink.href = milestone.getAttribute("data-cal-exp") || "experiments.html";
      }
      if (nbLink) {
        nbLink.href = milestone.getAttribute("data-cal-nb") || "#missing-records";
      }

      detail.hidden = false;
      detail.focus && detail.setAttribute("tabindex", "-1");
      try {
        detail.focus();
      } catch (e) {
        /* ignore */
      }
    }

    function closeDetail() {
      if (!detail) return;
      detail.hidden = true;
      clearPressed();
      if (lastTrigger) lastTrigger.focus();
    }

    triggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        openTarget(btn.getAttribute("data-cal-target"), btn);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closeDetail);
    }

    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && detail && !detail.hidden) {
        closeDetail();
      }
    });
  }

  doc.addEventListener("DOMContentLoaded", function () {
    initNav();
    initProgress();
    initBackToTop();
    initTocSpy();
    initReveal();
    initTocDetails();
    initContributionFilter();
    initNotebookFilter();
    initNotebookCalendar();
  });
})();
