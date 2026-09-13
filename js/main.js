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

    var tocPinned = btn.classList.contains("page-toc__top");
    var wide = window.matchMedia("(min-width: 960px)");

    function update() {
      if (tocPinned && wide.matches) {
        btn.classList.add("is-visible");
        return;
      }
      var y = window.scrollY || doc.documentElement.scrollTop;
      btn.classList.toggle("is-visible", y > 480);
    }

    window.addEventListener("scroll", update, { passive: true });
    if (wide.addEventListener) wide.addEventListener("change", update);
    else if (wide.addListener) wide.addListener(update);
    update();
  }

  /* ---------- TOC current section ---------- */
  function initTocSpy() {
    var links = qsa('.page-toc a[href^="#"], .desc-jump a[href^="#"]');
    if (!links.length) return;

    function mark(id) {
      links.forEach(function (link) {
        link.removeAttribute("aria-current");
      });
      links.forEach(function (link) {
        if (link.getAttribute("href") === "#" + id) {
          link.setAttribute("aria-current", "true");
        }
      });
    }

    if (location.hash) mark(location.hash.slice(1));

    if (!("IntersectionObserver" in window)) return;

    var map = {};
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      if (id) map[id] = link;
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          mark(entry.target.id);
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

    function reveal(node) {
      node.classList.remove("is-pending");
      node.classList.add("is-visible");
    }

    nodes.forEach(function (node) {
      node.classList.add("is-pending");
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      /* threshold 0: tall sections (e.g. Hardware "Engineering the reader")
         can be taller than the viewport, so a 12% ratio never fires. */
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );

    nodes.forEach(function (node) {
      var top = node.getBoundingClientRect().top;
      if (top < window.innerHeight) {
        reveal(node);
        return;
      }
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

  /* ---------- TOC: keep numbers on one line; wrap title text ---------- */
  function initTocLabelWrap() {
    qsa(".page-toc a").forEach(function (link) {
      if (link.querySelector(".toc-text")) return;
      var label = qs(".tech-label", link);
      var text = doc.createElement("span");
      text.className = "toc-text";
      Array.prototype.slice.call(link.childNodes).forEach(function (node) {
        if (node !== label) text.appendChild(node);
      });
      if (!text.textContent.trim() && !text.childNodes.length) return;
      link.appendChild(text);
    });
  }

  /* ---------- References: cited passages + paper highlights ---------- */
  var REF_HIGHLIGHTS = {
    "ref-gu-2019": [
      "Electronic-nose discrimination of Aspergillus contamination in rice kernels, including early growth tracking.",
      "Literature context for VOC signals that can precede visible fungal growth (not AeroSense data).",
    ],
    "ref-jiarpinijnun-2020": [
      "Electronic nose plus chemometrics for early fungal infection on stored Jasmine brown rice.",
      "Supports the Description-page claim that volatile fingerprints can change before spoilage is obvious.",
    ],
    "ref-gu-2022": [
      "Headspace GC–IMS differentiation and growth tracking of fungal contamination in rice grains.",
      "Analytical-method context for early fungal VOC detection under controlled conditions.",
    ],
    "ref-sanislav-2025": [
      "Review of sensor-based electronic noses for food quality and safety.",
      "Used to state remaining e-nose challenges (drift, calibration, generalization) without claiming AeroSense replaces them.",
    ],
    "ref-zboray-2023": [
      "Heterologous insect olfactory receptors expressed in mammalian cell lines for odorant / volatile profiling.",
      "Demonstrates a living-cell sensor route for plant-related VOC biomarker detection (literature context, not AeroSense data).",
    ],
    "ref-chen-2013": [
      "Introduces ultrasensitive GCaMP6 fluorescent calcium indicators for imaging activity.",
      "Supports calcium / fluorescence reporting as an optical readout modality (contextual literature).",
    ],
    "ref-tovar-2019": [
      "Frequency-division multiplexing of fluorescence excitation onto a shared detector.",
      "Prior-art context for AeroSense FDM readout — not an AeroSense measurement.",
    ],
    "ref-harvie-2023": [
      "Open-source digital lock-in amplifier (OLIA) for recovering weak periodic optical signals.",
      "Supports lock-in detection as an established method, not an AeroSense invention.",
    ],
    "ref-caron-2013": [
      "Random convergence of olfactory inputs onto Kenyon cells in the Drosophila mushroom body.",
      "Biological inspiration for sparse high-dimensional odor representations (computational analogy only).",
    ],
    "ref-dasgupta-2017": [
      "Connects fly mushroom-body sparse coding ideas to locality-sensitive hashing for similarity search.",
      "Provides a computational rationale for sparse, efficient odor-pattern representations.",
    ],
    "ref-jones-2011": [
      "Reports functional agonism of insect odorant receptor ion channels.",
      "Supports VUAA1 as an Orco-family agonist useful for functional controls.",
    ],
    "ref-butterwick-2018": [
      "Cryo-EM structure of an insect odorant receptor / Orco ion channel complex.",
      "Structural context for OR–Orco channel architecture in design discussions.",
    ],
    "ref-robertson-2003": [
      "Molecular characterization of Drosophila odorant receptors and the Orco co-receptor family.",
      "Background for selecting insect OR / Orco components in heterologous systems.",
    ],
    "ref-pacalon-2023": [
      "Structural and mutagenesis work on Orco / VUAA1-related binding and channel mechanisms.",
      "Later literature context for Orco agonist controls (see also the 2024 author correction).",
    ],
    "ref-pacalon-2024-corr": [
      "Author correction to Pacalon et al. (2023).",
      "Team should read the correction alongside the original paper before citing structural details.",
    ],
    "ref-wilson-2009": [
      "Reviews early olfactory processing in the antennal lobe.",
      "Motivates AL-inspired contrast / lateral-interaction ideas as computational analogy only.",
    ],
    "ref-liu-2023": [
      "Literature context cited for the sensing / VOC challenge framing on Description.",
      "Does not substitute for AeroSense experimental results.",
    ],
    "ref-zhai-2024": [
      "Literature context cited for the sensing / VOC challenge framing on Description.",
      "Does not substitute for AeroSense experimental results.",
    ],
    "ref-igem-project-safety": [
      "iGEM Project Safety Form guidance for team responsibility documentation.",
    ],
    "ref-igem-check-in": [
      "iGEM Check-In Form guidance for materials that require advance review.",
    ],
    "ref-igem-deliverables": [
      "iGEM deliverables / attribution expectations for team documentation.",
    ],
    "ref-cc-by-40": [
      "Creative Commons Attribution 4.0 license text for wiki reuse terms.",
    ],
  };

  function excerptAroundCite(citeEl) {
    var host =
      citeEl.closest("p, li, td, dd, dt, figcaption, .notice, .home-lead, .page-lede") ||
      citeEl.parentElement;
    if (!host) return "";
    var text = (host.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length > 220) text = text.slice(0, 217).trim() + "…";
    return text;
  }

  function sectionLabelFor(el) {
    var section = el.closest("section[id], article[id]");
    if (!section) return "This page";
    var heading = qs("h2, h3", section);
    if (heading && heading.textContent) return heading.textContent.trim();
    return section.id || "This page";
  }

  function initReferencesEnhance() {
    var items = qsa(".ref-list > li[id]");
    if (!items.length) return;

    items.forEach(function (item) {
      var refId = item.id;
      var cites = qsa('a.cite[href="#' + refId + '"]');
      var backlinks = qsa(".ref-backlink", item);

      /* Paper highlights (collapsed by default) */
      if (!qs(".ref-highlights", item) && REF_HIGHLIGHTS[refId]) {
        var details = doc.createElement("details");
        details.className = "ref-highlights";
        var summary = doc.createElement("summary");
        summary.textContent = "Paper highlights";
        var body = doc.createElement("div");
        body.className = "ref-highlights__body";
        var ul = doc.createElement("ul");
        REF_HIGHLIGHTS[refId].forEach(function (point) {
          var li = doc.createElement("li");
          li.textContent = point;
          ul.appendChild(li);
        });
        var note = doc.createElement("p");
        note.className = "ref-highlights__note";
        note.textContent =
          "Short team reading notes for navigation — not a substitute for the paper.";
        body.appendChild(ul);
        body.appendChild(note);
        details.appendChild(summary);
        details.appendChild(body);
        item.appendChild(details);
      }

      if (!backlinks.length) return;

      /* Wrap backlinks and attach cited-passage preview */
      var group = doc.createElement("div");
      group.className = "ref-backlink-group";
      backlinks[0].parentNode.insertBefore(group, backlinks[0]);
      backlinks.forEach(function (link) {
        group.appendChild(link);
      });

      var panel = doc.createElement("div");
      panel.className = "ref-passages";
      panel.setAttribute("role", "tooltip");
      panel.hidden = false;

      var title = doc.createElement("p");
      title.className = "ref-passages__title";
      title.textContent =
        cites.length === 1
          ? "1 passage on this page cites this source"
          : cites.length + " passages on this page cite this source";
      panel.appendChild(title);

      if (!cites.length) {
        var empty = doc.createElement("p");
        empty.textContent = "No in-text citation markers currently point to this entry.";
        panel.appendChild(empty);
      } else {
        var ol = doc.createElement("ol");
        cites.forEach(function (cite, index) {
          if (!cite.id) {
            cite.id = "cite-auto-" + refId + "-" + (index + 1);
          }
          var li = doc.createElement("li");
          var label = doc.createElement("strong");
          label.textContent = sectionLabelFor(cite) + ": ";
          li.appendChild(label);
          li.appendChild(doc.createTextNode(excerptAroundCite(cite)));
          li.appendChild(doc.createTextNode(" "));
          var jump = doc.createElement("a");
          jump.href = "#" + cite.id;
          jump.textContent = "Jump to cite";
          li.appendChild(jump);
          ol.appendChild(li);
        });
        panel.appendChild(ol);
      }

      group.appendChild(panel);

      function openPanel() {
        panel.classList.add("is-open");
      }
      function closePanel() {
        if (!group.contains(doc.activeElement)) panel.classList.remove("is-open");
      }

      group.addEventListener("mouseenter", openPanel);
      group.addEventListener("mouseleave", closePanel);
      group.addEventListener("focusin", openPanel);
      group.addEventListener("focusout", function () {
        window.setTimeout(closePanel, 0);
      });
    });
  }

  doc.addEventListener("DOMContentLoaded", function () {
    initNav();
    initProgress();
    initBackToTop();
    initTocLabelWrap();
    initTocSpy();
    initReveal();
    initTocDetails();
    initContributionFilter();
    initNotebookFilter();
    initNotebookCalendar();
    initReferencesEnhance();
  });
})();
