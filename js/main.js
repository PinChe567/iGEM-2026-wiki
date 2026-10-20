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

    function setMobileNavOpen(open) {
      if (!toggle) return;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
    }

    function closeMobileNav() {
      setMobileNavOpen(false);
    }

    function closeAllMenus() {
      closeSubmenus(null);
      closeMobileNav();
    }

    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        setMobileNavOpen(!open);
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

    function pinnedToToc() {
      return btn.parentElement && btn.parentElement.classList.contains("page-toc-slot")
        && window.matchMedia("(min-width: 1100px)").matches;
    }

    function update() {
      if (pinnedToToc()) {
        btn.classList.add("is-visible");
        return;
      }
      var y = window.scrollY || doc.documentElement.scrollTop;
      btn.classList.toggle("is-visible", y > 480);
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Shared contents navigation and current section ---------- */
  function initTocSpy() {
    if (window.AeroSenseToc) return;
    var selector = '.page-toc nav a[href^="#"], .audit-mobile-jump nav a[href^="#"], .lm-sticky__stages a[href^="#"]';
    var links = qsa(selector);
    if (!links.length) return;
    var frame = 0, navigation = 0, stopFollowing = function () {}, current = '';
    function targetFor(hash) {
      try { return doc.getElementById(decodeURIComponent(hash.slice(1))); }
      catch (_) { return null; }
    }
    var targets = [];
    links.forEach(function (link) {
      var target = targetFor(link.hash);
      if (target && targets.indexOf(target) < 0) targets.push(target);
    });
    function shown(node) {
      return node && !node.closest('[hidden],dialog:not([open])') && node.getClientRects().length > 0;
    }
    function offset() {
      var header = qs('.site-header');
      var bottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
      var menu = qs('.audit-mobile-jump');
      if (shown(menu)) bottom += menu.getBoundingClientRect().height;
      var stages = qs('.lm-sticky');
      if (shown(stages)) bottom += stages.getBoundingClientRect().height;
      return Math.ceil(bottom + 24);
    }
    function mark(id) {
      if (id === current) return;
      current = id;
      links.forEach(function (link) {
        if (link.hash === '#' + id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }
    function update() {
      frame = 0;
      var line = offset() + 32, before = null, after = null;
      targets.forEach(function (target) {
        if (!shown(target)) return;
        var top = target.getBoundingClientRect().top;
        if (top <= line && (!before || top >= before.top)) before = { target: target, top: top };
        else if (top > line && (!after || top < after.top)) after = { target: target, top: top };
      });
      var selected = before || after;
      if (selected) mark(selected.target.id);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    function prepare(target, source) {
      var menu = qs('.audit-mobile-jump');
      if (menu) menu.open = false;
      doc.dispatchEvent(new CustomEvent('aerosense:before-anchor', {
        detail: { target: target, hash: '#' + target.id, source: source }
      }));
      for (var node = target; node; node = node.parentElement) {
        if (node.tagName === 'DETAILS') node.open = true;
        if (node.hasAttribute('data-reveal')) {
          node.classList.remove('is-pending'); node.classList.add('is-visible');
        }
      }
      // A topic link reveals the same technical record as the product diagram.
      if (target.matches('[data-hardware-inline-topic]')) {
        qsa('[data-hardware-topic-details]', target).forEach(function (detail) { detail.open = true; });
      }
    }
    function navigate(target, options) {
      options = options || {};
      stopFollowing();
      var ticket = ++navigation;
      prepare(target, options.source || 'toc');
      if (options.push && location.hash !== '#' + target.id) {
        history.pushState(history.state, '', '#' + target.id);
      }
      // Two layout frames let tab/disclosure handlers settle before measuring.
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        if (ticket !== navigation || !shown(target)) return;
        function align() {
          if (ticket !== navigation || !shown(target)) return;
          var top = Math.max(0, Math.min(
            scrollY + target.getBoundingClientRect().top - offset(),
            doc.documentElement.scrollHeight - innerHeight
          ));
          if (Math.abs(top - scrollY) > 1) window.scrollTo({ top: top, behavior: 'instant' });
          mark(target.id);
        }
        align();
        if (options.focus) {
          if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
            target.addEventListener('blur', function () { target.removeAttribute('tabindex'); }, { once: true });
          }
          target.focus({ preventScroll: true });
        }
        // Correct late image/font/disclosure layout once it changes, never fight
        // the reader: wheel, touch, pointer and navigation keys cancel at once.
        var resize, settleFrame = 0, timer;
        function settle() {
          cancelAnimationFrame(settleFrame);
          settleFrame = requestAnimationFrame(align);
        }
        function cancel(event) {
          if (event && event.type === 'keydown' && !['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) return;
          ++navigation;
          stopFollowing();
        }
        if ('ResizeObserver' in window) {
          resize = new ResizeObserver(settle);
          resize.observe(doc.body);
          var header = qs('.site-header'); if (header) resize.observe(header);
        }
        ['wheel','touchstart','pointerdown','keydown'].forEach(function (type) {
          window.addEventListener(type, cancel, { passive: true });
        });
        stopFollowing = function () {
          clearTimeout(timer); cancelAnimationFrame(settleFrame);
          if (resize) resize.disconnect();
          ['wheel','touchstart','pointerdown','keydown'].forEach(function (type) { window.removeEventListener(type, cancel); });
          stopFollowing = function () {};
        };
        timer = setTimeout(stopFollowing, 1600);
      }); });
    }
    // The shared handler owns TOC scrolling; page-specific hooks only reveal
    // their content, avoiding native scroll-margin + scroll-padding duplication.
    doc.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest(selector);
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var target = targetFor(link.hash);
      if (!target) return;
      event.preventDefault(); event.stopImmediatePropagation();
      navigate(target, { push: true, focus: true, source: 'toc' });
    }, true);
    function fromLocation() {
      var target = targetFor(location.hash);
      if (targets.indexOf(target) >= 0) navigate(target, { source: 'location' });
      else schedule();
    }
    window.AeroSenseToc = { refresh: schedule, navigate: navigate, offset: offset };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', fromLocation);
    window.addEventListener('popstate', fromLocation);
    doc.addEventListener('aerosense:languagechange', schedule);
    doc.addEventListener('toggle', schedule, true);
    var initialHash = location.hash;
    function initial() { if (navigation === 0 && location.hash === initialHash) fromLocation(); }
    Promise.all([
      doc.readyState === 'complete' ? Promise.resolve() : new Promise(function (done) { window.addEventListener('load', done, { once: true }); }),
      doc.fonts ? doc.fonts.ready : Promise.resolve()
    ]).then(initial);
    schedule();
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
      if (window.matchMedia("(min-width: 1100px)").matches) {
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
    qsa(".page-toc a:not(.back-to-top)").forEach(function (link) {
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
    "ref-w-zboray-2023": [
      "Heterologous insect olfactory receptors expressed in mammalian cell lines for odorant / volatile profiling.",
      "Demonstrates a living-cell sensor route for plant-related VOC biomarker detection (literature context, not AeroSense data).",
    ],
    "ref-chen-2013": [
      "Introduces ultrasensitive GCaMP6 fluorescent calcium indicators for imaging activity.",
      "Supports calcium / fluorescence reporting as an optical readout modality (contextual literature).",
    ],
    "ref-w-chen-2013": [
      "Introduces ultrasensitive GCaMP6 fluorescent calcium indicators for imaging activity.",
      "Supports calcium / fluorescence reporting as an optical readout modality (contextual literature).",
    ],
    "ref-sato-2008": [
      "Shows insect odorant receptors form heteromeric ligand-gated ion channels with Orco.",
      "Core mechanistic rationale for OR–Orco sensing without a GPCR cascade in heterologous hosts.",
    ],
    "ref-roberts-2021": [
      "Codon optimization can improve stable expression of insect OR genes in HEK293 cells.",
      "Supports expression-engineering choices for heterologous OR panels.",
    ],
    "ref-benton-2006": [
      "Demonstrates atypical membrane topology and heteromeric OR–Orco function in vivo.",
      "Topology evidence used when placing reporters relative to Orco termini.",
    ],
    "ref-w-benton-2006": [
      "Demonstrates atypical membrane topology and heteromeric OR–Orco function in vivo.",
      "Topology evidence used when placing reporters relative to Orco termini.",
    ],
    "ref-ibrahimi-2009": [
      "Characterizes multicistronic lentiviral vectors using 2A peptides and related co-expression strategies.",
      "Literature context for IRES / multicistronic reporter expression trade-offs.",
    ],
    "ref-w-ibrahimi-2009": [
      "Characterizes multicistronic lentiviral vectors using 2A peptides and related co-expression strategies.",
      "Literature context for IRES / multicistronic reporter expression trade-offs.",
    ],
    "ref-miazzi-2019": [
      "Optimizes trafficking and functional expression of insect ORs in transient HEK293 assays.",
      "Supports assay and expression-design choices for heterologous OR testing.",
    ],
    "ref-w-jones-2011": [
      "Reports functional agonism of insect odorant receptor ion channels.",
      "Supports VUAA1 as an Orco-family agonist useful for functional controls.",
    ],
    "ref-w-butterwick-2018": [
      "Cryo-EM structure of the insect olfactory co-receptor Orco.",
      "Structural context for the Orco channel in design discussions.",
    ],
    "ref-scofield-1994": [
      "Classic frequency-domain description of lock-in amplification.",
      "Foundational context for digital lock-in recovery of weak periodic optical signals.",
    ],
    "ref-marco-2012": [
      "Reviews signal and data processing for machine olfaction / electronic noses.",
      "Background for conventional e-nose pipelines that AeroSense compares against conceptually.",
    ],
    "ref-vergara-2012": [
      "Public chemical gas sensor drift dataset used widely in e-nose machine learning.",
      "Dataset context for drift-robust classification benchmarks (not AeroSense wet-lab data).",
    ],
    "ref-turner-2008": [
      "Olfactory representations and coding ideas that motivate sparse / combinatorial models.",
      "Biological inspiration only — not an AeroSense measurement.",
    ],
    "ref-lin-2014": [
      "Mushroom-body circuit organization relevant to sparse odor coding analogies.",
      "Supports fly-inspired computational framing on the Model page.",
    ],
    "ref-aso-2014": [
      "Comprehensive mushroom-body output neuron map in Drosophila.",
      "Anatomical inspiration for MBON-style readout stages in the computational analogy.",
    ],
    "ref-schmuker-2007": [
      "Early computational olfaction / classification work used as baseline inspiration.",
      "Historical context for sparse or biologically motivated odor classifiers.",
    ],
    "ref-imam-2020": [
      "Neuromorphic / olfactory-computation framing for rapid odor identification.",
      "Supports discussing biologically inspired algorithms versus conventional ML baselines.",
    ],
    "ref-jolliffe-2002": [
      "Standard reference on principal component analysis.",
      "Used when discussing conventional dimensionality reduction baselines.",
    ],
    "ref-stimberg-2019": [
      "Brian 2 simulator for spiking neural networks.",
      "Software context for the Dry Lab / Model Brian2 experiments.",
    ],
    "ref-d-stimberg-2019": [
      "Brian 2 simulator for spiking neural networks.",
      "Software context for the Dry Lab / Model Brian2 experiments.",
    ],
    "ref-song-2000": [
      "Spike-timing-dependent plasticity (STDP) classic reference.",
      "Learning-rule context for spiking-network training discussions.",
    ],
    "ref-cheng-2025": [
      "Hybrid neural networks in the Drosophila mushroom body linked to olfactory preference.",
      "Research lineage / inspiration — not AeroSense field accuracy claims.",
    ],
    "ref-wced-1987": [
      "Brundtland Report definition of sustainable development.",
      "Foundational sustainability framing used on the Sustainability page.",
    ],
    "ref-meadows-2008": [
      "Systems-thinking primer used when discussing leverage points and trade-offs.",
      "Conceptual framing for sustainability pathway mapping.",
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
      "Cryo-EM structure of the insect olfactory co-receptor Orco.",
      "Structural context for the Orco channel in design discussions.",
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
  };

  function excerptAroundCite(citeEl) {
    var host =
      citeEl.closest("p, li, td, dd, dt, figcaption, .notice, .home-lead, .page-lede") ||
      citeEl.parentElement;
    if (!host) return "";
    var text = (window.AeroSenseI18n?.sourceText(host) || host.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length > 220) text = text.slice(0, 217).trim() + "…";
    return text;
  }

  function sectionLabelFor(el) {
    var section = el.closest("section[id], article[id]");
    if (!section) return "This page";
    var heading = qs("h2, h3", section);
    if (heading && heading.textContent) return (window.AeroSenseI18n?.sourceText(heading) || heading.textContent).trim();
    return section.id || "This page";
  }

  // One viewport-bound layer for reference previews. Hidden panels have no layout
  // box; open panels leave transformed/overflow-clipped article ancestors.
  var citationPanels = (function () {
    var active=null, closeTimer=0, frame=0, restoring=false, dismissedAnchor=null;
    var bridge=doc.createElement('div');bridge.className='reading-popover-bridge';bridge.hidden=true;bridge.setAttribute('aria-hidden','true');
    function cancelClose(){window.clearTimeout(closeTimer);closeTimer=0;}
    function hide(panel,restoreFocus){
      if(!active||(panel&&active.panel!==panel))return;
      cancelClose();var previous=active;active=null;restoring=true;
      previous.panel.classList.remove('is-open');previous.panel.hidden=true;bridge.hidden=true;
      if(previous.next&&previous.next.parentNode===previous.home)previous.home.insertBefore(previous.panel,previous.next);else previous.home.appendChild(previous.panel);
      previous.anchor.setAttribute('aria-expanded','false');
      if(previous.onClose)previous.onClose();
      if(restoreFocus){
        previous.anchor.focus({preventScroll:true});dismissedAnchor=previous.anchor;
        var clearDismissed=function(){if(dismissedAnchor===previous.anchor)dismissedAnchor=null;};
        previous.region.addEventListener('mouseleave',clearDismissed,{once:true});
        previous.anchor.addEventListener('blur',clearDismissed,{once:true});
      }
      restoring=false;
    }
    function place(){
      frame=0;if(!active)return;
      var vp=window.visualViewport,vl=vp?vp.offsetLeft:0,vt=vp?vp.offsetTop:0,vw=vp?vp.width:window.innerWidth,vh=vp?vp.height:window.innerHeight;
      var a=active.anchor.getBoundingClientRect(),panel=active.panel,margin=12,gap=4;
      if(a.bottom<vt||a.top>vt+vh||a.right<vl||a.left>vl+vw){hide();return;}
      var above=Math.max(0,a.top-vt-margin-gap),below=Math.max(0,vt+vh-a.bottom-margin-gap);
      var useBelow=below>=180||below>=above;
      var available=Math.min(vh-2*margin,Math.max(80,useBelow?below:above));
      panel.style.setProperty('--reading-panel-width',Math.max(100,Math.min(panel.classList.contains('ref-passages')?440:352,vw-2*margin))+'px');
      panel.style.setProperty('--reading-panel-height',available+'px');
      var p=panel.getBoundingClientRect();
      var left=Math.max(vl+margin,Math.min(a.left,vl+vw-margin-p.width));
      var top=useBelow?a.bottom+gap:a.top-p.height-gap;
      top=Math.max(vt+margin,Math.min(top,vt+vh-margin-p.height));
      panel.style.setProperty('--reading-panel-left',left+'px');panel.style.setProperty('--reading-panel-top',top+'px');
      var edgeTop=useBelow?a.bottom:top+p.height,edgeBottom=useBelow?top:a.top;
      bridge.hidden=edgeBottom<=edgeTop;
      bridge.style.left=Math.min(left,a.left)+'px';bridge.style.top=edgeTop+'px';
      bridge.style.width=(Math.max(left+p.width,a.right)-Math.min(left,a.left))+'px';bridge.style.height=Math.max(0,edgeBottom-edgeTop)+'px';
    }
    function requestPlace(){if(active&&!frame)frame=requestAnimationFrame(place);}
    function show(anchor,panel,region,onClose){
      if(restoring||anchor===dismissedAnchor)return;
      dismissedAnchor=null;
      cancelClose();
      if(active&&active.panel===panel){active.anchor.setAttribute('aria-expanded','false');active.anchor=anchor;anchor.setAttribute('aria-expanded','true');place();return;}
      hide();
      active={anchor:anchor,panel:panel,region:region||anchor,home:panel.parentNode,next:panel.nextSibling,onClose:onClose};
      panel.classList.add('reading-popover');panel.setAttribute('role','dialog');
      panel.setAttribute('aria-label',panel.classList.contains('ref-passages')?'Cited passages':'Reference preview');
      if(!panel.querySelector('.reading-popover__close')){
        var close=doc.createElement('button');close.type='button';close.className='reading-popover__close';close.textContent='×';close.setAttribute('aria-label','Close reference preview');
        close.addEventListener('click',function(){hide(panel,true);});panel.prepend(close);
        panel.addEventListener('mouseenter',cancelClose);panel.addEventListener('mouseleave',scheduleClose);
        panel.addEventListener('focusin',cancelClose);panel.addEventListener('focusout',scheduleClose);
      }
      var overlayHost=anchor.closest('dialog[open]')||doc.body;
      overlayHost.appendChild(bridge);
      overlayHost.appendChild(panel);panel.hidden=false;panel.classList.add('is-open');anchor.setAttribute('aria-expanded','true');place();
    }
    function scheduleClose(){
      cancelClose();closeTimer=window.setTimeout(function(){
        if(!active)return;
        if(active.panel.contains(doc.activeElement)||active.region.contains(doc.activeElement)||active.panel.matches(':hover')||active.region.matches(':hover')||bridge.matches(':hover'))return;
        hide();
      },220);
    }
    bridge.addEventListener('mouseenter',cancelClose);bridge.addEventListener('mouseleave',scheduleClose);
    doc.addEventListener('pointerdown',function(event){if(active&&!active.panel.contains(event.target)&&!active.region.contains(event.target)&&event.target!==bridge)hide();});
    doc.addEventListener('keydown',function(event){
      if(!active)return;
      if(event.key==='Escape'){event.preventDefault();hide(null,true);return;}
      if(event.key!=='Tab')return;
      var links=Array.prototype.slice.call(active.panel.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]'));
      if(!links.length)return;
      if(active.region.contains(doc.activeElement)&&!event.shiftKey){event.preventDefault();links[0].focus();return;}
      if(doc.activeElement===links[0]&&event.shiftKey){event.preventDefault();var anchor=active.anchor;hide();anchor.focus({preventScroll:true});return;}
      if(doc.activeElement===links[links.length-1]&&!event.shiftKey){
        event.preventDefault();var current=active,all=Array.prototype.slice.call(doc.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(function(el){return !current.panel.contains(el)&&el.getClientRects().length;});
        var next=all[all.indexOf(current.anchor)+1];hide();if(next)next.focus({preventScroll:true});else current.anchor.focus({preventScroll:true});
      }
    });
    window.addEventListener('resize',requestPlace);
    doc.addEventListener('scroll',function(event){if(active&&!active.panel.contains(event.target))requestPlace();},true);
    if(window.visualViewport){window.visualViewport.addEventListener('resize',requestPlace);window.visualViewport.addEventListener('scroll',requestPlace);}
    return {show:show,hide:hide,scheduleClose:scheduleClose,cancelClose:cancelClose,isRestoring:function(){return restoring;}};
  }());
  window.AeroSenseCitationPanels=citationPanels;

  // Unnumbered technical sources and new references use the same reading tools.
  // Explicit context maps place uncited background reading near its actual topic;
  // they never attach a new paper as evidence for an experimental result.
  var REFERENCE_CONTEXTS = {
    'engineering.html': {'ref-w-zboray-2023':'#stream-wetlab','ref-w-ibrahimi-2009':'#stream-wetlab','ref-w-chen-2013':'#stream-wetlab','ref-w-benton-2006':'#stream-wetlab','ref-w-butterwick-2018':'#stream-wetlab','ref-d-stimberg-2019':'#group-model','tech-ti-lmp7721':'#group-hardware','tech-igem-eng':'#engineering-methods','tech-igem-hp':'#entrepreneurship-engineering'},
    'entrepreneurship.html': {'ref-cheng-2025':'#aerosense-10'},
    'human-practices.html': {'ref-zboray-2023':'#ihp','ref-cheng-2025':'#ihp'},
    'parts.html': {'ref-sato-2008':'#sensor-builder','ref-benton-2006':'#sensor-builder','ref-butterwick-2018':'#sensor-builder','ref-chen-2013':'#sensor-builder'},
    'results.html': {'micro-ref-2':'#wet-lab','micro-ref-3':'#limitations','micro-ref-6':'#supplementary'},
    'hardware.html': {'reference-auto-11':'#cost-and-reproduction','reference-auto-12':'#optical-question'},
    'safety-and-security.html': {'tech-ti-bq2407x':'#safe-to-measure','tech-ti-tps61023':'#safe-to-measure','tech-wurth-155124':'#safe-to-measure','tech-ti-lmp7721':'#safe-to-measure','tech-igem-rules':'#compliance','tech-igem-whitelist':'#safe-to-build','tech-igem-release':'#safe-to-deploy','tech-igem-human-subjects':'#people-and-data','tech-igem-surveys':'#people-and-data','tech-igem-project-safety':'#compliance','tech-igem-check-in':'#compliance','tech-igem-special-awards':'#award-map'},
    'sustainability.html': {'ref-cheng-2025':'#system-boundary','ref-wced-1987':'#system-boundary','ref-meadows-2008':'#tradeoff-map','tech-fao-flw':'#food-pathway'}
  };
  var NEW_REFERENCE_HIGHLIGHTS = {
    'ref-avishai-2025':'Published context for dopaminergic modulation in the fly antennal lobe; independent of the team light-sheet experiment.',
    'ref-gh146-flybase':'Curated expression evidence for GH146. Driver expression includes projection neurons and non-PN cells.',
    'ref-aso-architecture':'Mushroom-body circuit anatomy: Kenyon cells, dopaminergic inputs and compartmental organization.',
    'ref-aso-output':'Mushroom-body output neurons and their role in valence and memory-guided behavior.',
    'ref-th-driver':'TH regulatory sequences used to target gene expression in dopaminergic cells; the driver is not a complete identity check for every labeled cell.',
    'ref-mao-davis':'Anatomical and physiological diversity of dopaminergic inputs to the mushroom body.',
    'ref-bdsc-5137':'BDSC 5137 is a UAS-mCD8::GFP reporter stock, consistent with the team’s clarified 5137;TH (TH-GFP) recording. The full experimental cross remains to be documented.',
    'ref-liu-apl':'The APL neuron contributes inhibitory feedback in the mushroom body and is relevant to interpreting GH146 expression.',
    'ref-dapi-guidance':'Manufacturer guidance for DAPI nuclear labeling; staining conditions affect how the nuclear signal can be interpreted.',
    'ref-microscopy-reporting':'Reporting guidance for reproducible fluorescence microscopy, including acquisition and image-analysis methods.',
    'ref-image-integrity':'Editorial standards for preserving image evidence and disclosing image processing.',
    'ref-burton-2020':'Published photometry-system engineering used as design context; its device performance is not an AeroSense result.',
    'micro-ref-1':'GCaMP6 calcium-indicator development. Basal brightness alone is not a functional calcium-response assay.',
    'micro-ref-2':'DAPI nuclear-labeling guidance relevant to preparation and denominator limits.',
    'micro-ref-3':'Reproducible fluorescence-microscopy reporting: acquisition conditions, processing and analysis should be traceable.',
    'micro-ref-4':'Independent viability assays measure features such as membrane integrity or esterase activity. mCherry fluorescence alone does not establish viability.',
    'micro-ref-5':'Stable-line selection requires selection conditions and parental-cell kill-curve guidance; pre-selection images do not demonstrate a stable selected line.',
    'micro-ref-6':'Image-integrity guidance for source preservation and disclosure of display adjustments.',
    'tech-un-2015':'The UN 2030 Agenda supplies the SDG framework; it is not a measurement of this project\'s impact.',
    'tech-fao-flw':'Food-loss and post-harvest context. These resources do not establish Taiwan banana losses or AeroSense effectiveness.',
    'tech-igem-eng':'Official judging context for describing engineering iteration and its evidence.',
    'tech-igem-hp':'Official judging context for integrated Human Practices, Education and Entrepreneurship.',
    'tech-igem-rules':'Official safety-policy framework relevant to the project safety case.',
    'tech-igem-whitelist':'Official organism and activity screening guidance; applicable approvals still depend on the actual project.',
    'tech-igem-release':'Official rules concerning release beyond containment.',
    'tech-igem-human-subjects':'Official guidance for research involving human participants.',
    'tech-igem-surveys':'Official guidance for surveys and interviews, relevant to participant information and consent.',
    'tech-igem-project-safety':'Official Project Safety Form and reporting requirements.',
    'tech-igem-check-in':'Official check-in process for work requiring further safety review.',
    'tech-igem-special-awards':'Official award criteria used to organize the safety-and-security evidence.',
    'tech-igem-official-milestone':'Official iGEM guidance cited for this competition milestone. This is an external competition date, separate from the team\'s experimental or project activities.'
  };

  function revealCitation(target) {
    var ancestor = target.parentElement;
    while (ancestor) {
      if (ancestor.tagName === 'DETAILS') ancestor.open = true;
      // Existing tab controls own visibility of engineering-cycle panels.
      if (ancestor.getAttribute('role') === 'tabpanel' && ancestor.id) {
        var controller = qs('[role="tab"][aria-controls="' + ancestor.id + '"]');
        if (controller) controller.click();
      }
      ancestor = ancestor.parentElement;
    }
    qsa('.is-citation-highlight').forEach(function (el) { el.classList.remove('is-citation-highlight'); });
    var passage = target.closest('p,td,dd,figcaption') || target.closest('li') || target;
    passage.classList.add('is-citation-highlight');
    target.focus({preventScroll:true});
    target.scrollIntoView({behavior:reduceMotion ? 'auto' : 'smooth',block:'center'});
    window.setTimeout(function () {passage.classList.remove('is-citation-highlight');},5000);
  }

  var referenceFamilies = [
    {key:'paper', label:'Research papers'},
    {key:'web', label:'Web resources'},
    {key:'datasheet', label:'Datasheets'},
    {key:'other', label:'Books and reports'}
  ];
  var referenceOriginalOrder = new WeakMap(), referenceSequence = 0;
  function referenceFamily(item) {
    var explicit = item.dataset.referenceType;
    if (referenceFamilies.some(function (family) { return family.key === explicit; })) return explicit;
    var copy = item.cloneNode(true);
    qsa('.ref-highlights, .ref-return-tools, .ref-backlink, .ref-citation-popover, .cite-preview', copy).forEach(function (node) { node.remove(); });
    var text = copy.textContent.replace(/\s+/g,' ').trim();
    var urls = qsa('a[href]',copy).map(function (link) { return link.getAttribute('href'); }).join(' ');
    if (/^ref-edu-source-[3-7]$/.test(item.id)) return 'paper';
    if (item.id === 'ref-edu-source-8') return 'other';
    if (/\bdatasheets?\b|data[-_ ]sheets?|\/lit\/ds\//i.test(text+' '+urls)) return 'datasheet';
    // A dataset DOI identifies a deposited resource, not a research article.
    if (/\[(?:dataset|database|software)(?:[\];]| documentation)/i.test(text) || /^(ref-uci-270|ref-malecns-dataset)$/.test(item.id)) return 'web';
    if (/^(ref-jolliffe-2002|ref-meadows-2008|ref-wced-1987|ref-mccloskey-1989)$/.test(item.id) || /\bISBN\b/.test(text)) return 'other';
    if (/\b10\.\d{4,9}\//.test(text+' '+urls) || /arxiv\.org\/(abs|pdf)\/|proceedings\.iclr\.cc\/|eprints\.whiterose\.ac\.uk\/|tsapps\.nist\.gov\/publication\//i.test(urls)) return 'paper';
    if (/\b(?:Nature|Science|Scientific Reports|eLife|PNAS|Journal of|Proceedings of|IEEE Transactions|European Journal|Frontiers in|Food Chemistry)\b/.test(text) && /\b(?:19|20)\d{2}\b/.test(text)) return 'paper';
    return /https?:\/\//.test(urls) ? 'web' : 'other';
  }
  function organizeReferences() {
    var listSelector = '.ref-list, .tech-source-list, .reference-list';
    // The Notion-derived Education bibliography uses authored block divs. Wrap
    // those existing records once so the same numbering and return tools apply.
    qsa('.edu-source-reference[id]').forEach(function (record) {
      if (record.closest(listSelector)) return;
      var section=record.closest('#references');if(!section)return;
      section.classList.add('references');
      var list=qs(':scope > .ref-list',section);
      if(!list){list=doc.createElement('ol');list.className='ref-list';section.appendChild(list);}
      var item=doc.createElement('li');item.id=record.id;record.removeAttribute('id');
      var first=record.querySelector('p')?.firstChild;
      if(first?.nodeType===3)first.data=first.data.replace(/^\s*\[\d+\]\s*/,'');
      item.appendChild(record);list.appendChild(item);
    });
    var items = qsa('.ref-list > li, .tech-source-list > li, .reference-list > li');
    if (!items.length) return;
    var first = new Map(), byId = new Map(), byUrl = new Map();
    items.forEach(function (item) {
      if (!referenceOriginalOrder.has(item)) referenceOriginalOrder.set(item,referenceSequence++);
      if (!item.id) {
        var suffix = referenceOriginalOrder.get(item)+1;
        while (doc.getElementById('reference-auto-'+suffix)) suffix++;
        item.id = 'reference-auto-'+suffix;
      }
      byId.set(item.id,item);
      qsa('a[href]',item).filter(function (link) { return !link.closest('.ref-highlights, .ref-return-tools') && !link.getAttribute('href').startsWith('#'); }).forEach(function (link) {
        var sources = byUrl.get(link.href) || [];sources.push(item);byUrl.set(link.href,sources);
      });
    });
    qsa('main a[href], .page-article a[href]').forEach(function (anchor,index) {
      if (anchor.closest(listSelector+', .reference-reading-note, .cite-preview, .page-toc, .audit-mobile-jump') || anchor.classList.contains('cite--background')) return;
      var href = anchor.getAttribute('href'), targets = href.startsWith('#') ? [byId.get(href.slice(1))] : (byUrl.get(anchor.href) || []);
      targets.forEach(function (item) { if (item && !first.has(item)) first.set(item,index); });
    });
    var records = items.map(function (item) { return {item:item,family:referenceFamily(item),first:first.has(item)?first.get(item):Infinity,original:referenceOriginalOrder.get(item)}; });
    var rank = Object.fromEntries(referenceFamilies.map(function (family,index) { return [family.key,index]; }));
    records.sort(function (a,b) { return rank[a.family]-rank[b.family] || a.first-b.first || a.original-b.original; });
    var sections = new Map();
    records.forEach(function (record,index) {
      var item = record.item, number = index+1, section = item.closest('.references') || item.parentElement.parentElement;
      item.value = number;item.dataset.referenceFamily = record.family;
      var groups = sections.get(section) || [];groups.push(record);sections.set(section,groups);
      qsa('a[href="#'+CSS.escape(item.id)+'"]').filter(function (anchor) { return !anchor.closest(listSelector); }).forEach(function (anchor) {
        if (/^\s*\[\d+\]\s*$/.test(anchor.textContent)) anchor.textContent='['+number+']';
        if (anchor.classList.contains('cite')) anchor.setAttribute('aria-label','Reference ['+number+']');
      });
    });
    sections.forEach(function (sectionRecords,section) {
      var previousLists = qsa(listSelector,section);
      referenceFamilies.forEach(function (family) {
        var members = sectionRecords.filter(function (record) { return record.family===family.key; });
        var group = qs(':scope > .reference-group[data-reference-family="'+family.key+'"]',section);
        if (!members.length) { if(group)group.hidden=true;return; }
        if (!group) {
          group=doc.createElement('div');group.className='reference-group';group.dataset.referenceFamily=family.key;
          var heading=doc.createElement('h3');heading.className='reference-group__heading';heading.textContent=family.label;
          var list=doc.createElement('ol');list.className='ref-list';list.dataset.referenceOrder='category-then-first-citation';
          group.append(heading,list);section.appendChild(group);
        }
        var target=qs('.ref-list',group);target.start=Number(members[0].item.value);
        members.forEach(function (record) { target.appendChild(record.item); });
        group.hidden=false;section.appendChild(group);
      });
      previousLists.forEach(function (list) { if(!list.children.length)list.hidden=true; });
      // Keep the old study anchors as aliases. The model controller filters the
      // same reference nodes inside the shared source families after grouping.
      qsa('.model-reference-group',section).forEach(function (group) {
        if (group.dataset.referenceLegacy) return;
        if (group.id) {
          var alias=doc.createElement('span');alias.id=group.id;alias.className='anchor-alias';alias.dataset.modelReferenceGroup=group.dataset.modelReferenceGroup;
          group.removeAttribute('id');group.before(alias);
        }
        group.removeAttribute('data-model-reference-group');group.dataset.referenceLegacy='true';group.hidden=true;
      });
      section.dataset.referenceOrder='category-then-first-citation';
    });
    doc.dispatchEvent(new CustomEvent('aerosense:referenceschange'));
  }
  window.AeroSenseOrganizeReferences = organizeReferences;

  // Keep references before the sentence stop without replacing anchors or their
  // event handlers. Translation restores these display-only edits before looking
  // up the authored sentence, then reapplies them to the selected language.
  var citationPunctuationEdits = [];
  var citationFormattingReady = doc.readyState === 'complete';
  doc.addEventListener('DOMContentLoaded', function () {
    // A microtask can run between DOMContentLoaded listeners. Wait one task so
    // glossary annotation and citation previews finish reading the source first.
    window.setTimeout(function () {
      citationFormattingReady = true;
      if (window.AeroSenseI18n) window.AeroSenseI18n.refresh();
      else normalizeCitationPunctuation();
    }, 0);
  });
  function citationDisplayText(node, value) {
    if (window.AeroSenseI18n && window.AeroSenseI18n.setDisplayText) window.AeroSenseI18n.setDisplayText(node, value);
    else node.data = value;
  }
  function restoreCitationPunctuation() {
    citationPunctuationEdits.forEach(function (edit) {
      if (edit.node.data === edit.display) citationDisplayText(edit.node, edit.source);
      if (edit.stop) edit.stop.remove();
    });
    citationPunctuationEdits = [];
  }
  function normalizeCitationPunctuation() {
    if (!citationFormattingReady) return;
    restoreCitationPunctuation();
    var excluded = '.ref-list, .tech-source-list, .reference-list, .references, .ref-highlights, .cite-preview, .reference-reading-note, script, style, code, pre';
    var blocks = new Set();
    function citation(element) {
      if (!element.matches('a.cite[href^="#"]')) return false;
      var id = element.getAttribute('href').slice(1), target = doc.getElementById(id);
      return !!target && !!target.closest('.ref-list, .tech-source-list, .reference-list');
    }
    qsa('a.cite[href^="#"]').forEach(function (anchor) {
      if (!anchor.closest(excluded) && citation(anchor)) blocks.add(anchor.closest('p, li, td, th, dd, dt, figcaption, blockquote, .notice, .home-lead, .page-lede, h1, h2, h3, h4, h5, h6') || anchor.parentElement);
    });
    blocks.forEach(function (block) {
      var tokens = [];
      function walk(node) {
        if (node.nodeType === 3) { tokens.push({text:node}); return; }
        if (node.nodeType !== 1 || node.matches(excluded)) return;
        if (citation(node)) { tokens.push({cite:node}); return; }
        if (node.matches('.cite-wrap, sup') && Array.from(node.querySelectorAll('a.cite[href^="#"]')).some(citation)) { tokens.push({cite:node}); return; }
        if (node.tagName === 'BR') { tokens.push({boundary:true}); return; }
        Array.from(node.childNodes).forEach(walk);
      }
      Array.from(block.childNodes).forEach(walk);
      tokens.forEach(function (token, index) {
        if (!token.cite) return;
        var previous = index - 1;
        while (previous >= 0 && tokens[previous].text && !tokens[previous].text.data.trim()) previous--;
        var node = previous >= 0 && tokens[previous].text;
        if (!node) return;
        var match = /([.。])(\s*)$/.exec(node.data);
        if (!match || (match[1] === '.' && node.data.charAt(match.index - 1) === '.')) return;
        var last = token.cite, cursor = index + 1;
        while (cursor < tokens.length) {
          if (tokens[cursor].cite) { last = tokens[cursor].cite; cursor++; continue; }
          if (tokens[cursor].text && /^[\s,，;；]*$/.test(tokens[cursor].text.data)) { cursor++; continue; }
          break;
        }
        var separated = tokens.slice(previous + 1, index).some(function (part) { return part.text && /\s/.test(part.text.data); });
        var source = node.data, display = source.slice(0, match.index) + (match[2] || (separated ? '' : ' '));
        var following = tokens[cursor] && tokens[cursor].text;
        var stop = null;
        // A few older passages already have a stop on both sides of the marker.
        // Keep the existing final stop rather than creating a second one.
        if (!following || !/^[\s]*[.。]/.test(following.data)) {
          stop = doc.createElement('span');stop.dataset.citationStop = '';stop.setAttribute('translate','no');stop.textContent = match[1];
          last.after(stop);
        }
        citationDisplayText(node, display);
        citationPunctuationEdits.push({node:node, source:source, display:display, stop:stop});
      });
    });
  }
  window.AeroSenseCitationPunctuation = {restore:restoreCitationPunctuation, normalize:normalizeCitationPunctuation};

  function initReferencesEnhance() {
    organizeReferences();
    var listSelector = '.ref-list, .tech-source-list, .reference-list';
    var items = qsa('.ref-list > li, .tech-source-list > li, .reference-list > li');
    var pageName = location.pathname.split('/').pop() || 'index.html';
    var contextMap = REFERENCE_CONTEXTS[pageName] || {};
    items.forEach(function (item, itemIndex) {
      if (item.dataset.referenceEnhanced) return;
      item.dataset.referenceEnhanced = 'true';
      if (!item.id) item.id = 'reference-auto-' + (itemIndex + 1);
      var refId = item.id;
      var originalText = item.textContent.replace(/\s+/g,' ').trim();
      var sourceLinks = qsa('a[href]', item).filter(function (a) {return !a.classList.contains('ref-backlink') && a.getAttribute('href').charAt(0) !== '#';});
      var cites = qsa('a[href="#' + refId + '"]').filter(function (a) {return !a.closest(listSelector);});
      var authoredCites = cites.filter(function (a) { return !a.classList.contains('cite--background') && !a.closest('.reference-reading-note'); });
      if (authoredCites.length) cites = authoredCites;
      // Direct source hyperlinks are already genuine citations, including ones
      // that predate the numbered-reference system.
      if (!cites.length) {
        var urls = sourceLinks.map(function(a){return a.href;});
        cites = qsa('main a[href], .page-article a[href]').filter(function(a){return !a.closest(listSelector) && !a.closest('.page-toc') && urls.indexOf(a.href) !== -1;});
      }
      if (!cites.length) {
        var contextSelector = item.dataset.referenceContext || contextMap[refId];
        var context = contextSelector && qs(contextSelector);
        if (!context) context = qs('main .page-article > section:not(.references), main .page-article, main article, main');
        if (!context) return;
        var reading = qs(':scope > .reference-reading-note', context);
        if (!reading) {reading=doc.createElement('p');reading.className='reference-reading-note';reading.appendChild(doc.createTextNode('Further reading: '));context.appendChild(reading);}
        else reading.appendChild(doc.createTextNode(' · '));
        var marker=doc.createElement('a');marker.href='#'+refId;marker.className='cite cite--background';
        marker.textContent=item.hasAttribute('value') ? '['+item.getAttribute('value')+']' : (sourceLinks[0] ? sourceLinks[0].textContent.replace(/\s+/g,' ').trim().slice(0,76) : originalText.slice(0,70));
        marker.setAttribute('aria-label','Further reading: '+originalText.slice(0,140));reading.appendChild(marker);cites=[marker];
      }
      cites.forEach(function(cite,index){
        if(cite.id)return;
        var suffix=index+1;
        while(doc.getElementById('cite-auto-'+refId+'-'+suffix))suffix++;
        cite.id='cite-auto-'+refId+'-'+suffix;
      });
      if (!qs('.ref-highlights',item)) {
        var details=doc.createElement('details');details.className='ref-highlights';
        var summary=doc.createElement('summary');summary.textContent='Source highlights';details.appendChild(summary);
        var body=doc.createElement('div');body.className='ref-highlights__body';
        var sourceId=item.dataset.referenceSource || refId;
        var points=REF_HIGHLIGHTS[sourceId] || (NEW_REFERENCE_HIGHLIGHTS[sourceId] ? [NEW_REFERENCE_HIGHLIGHTS[sourceId]] : null);
        if (!points) {
          var isDatasheet=/datasheet/i.test(originalText);
          points=isDatasheet ? ['Component specifications and operating limits from the manufacturer. Used for design or safety context; not a measurement of the assembled AeroSense device.'] : ['Reading context: '+sectionLabelFor(cites[0])+'.',originalText.replace(/Back to (first )?citation/g,'').trim()];
        }
        var ul=doc.createElement('ul');points.forEach(function(point){var li=doc.createElement('li');li.textContent=point;ul.appendChild(li);});body.appendChild(ul);details.appendChild(body);item.appendChild(details);
      }
      qsa('.ref-return-tools, .ref-backlink, .ref-backlink-group',item).forEach(function(el){el.remove();});
      var group=doc.createElement('div');group.className='ref-return-tools';
      var back=doc.createElement('a');back.className='ref-backlink';back.href='#'+cites[0].id;back.textContent='Back to citation';group.appendChild(back);
      var selected=0,openPicker;
      if(cites.length>1){
        var panel=doc.createElement('div');panel.className='ref-citation-popover';panel.id='return-'+refId;panel.hidden=true;
        var caption=doc.createElement('p');caption.className='ref-citation-popover__title';caption.textContent='Cited passages';panel.appendChild(caption);
        var passages=doc.createElement('ol');panel.appendChild(passages);
        var closeTimer;
        function closePicker(){panel.hidden=true;back.setAttribute('aria-expanded','false');}
        openPicker=function(){
          window.clearTimeout(closeTimer);panel.hidden=false;back.setAttribute('aria-expanded','true');
          var box=back.getBoundingClientRect();
          panel.style.width=Math.min(380,window.innerWidth-32)+'px';
          panel.style.left=Math.max(16,Math.min(box.left,window.innerWidth-panel.offsetWidth-16))+'px';
          var height=panel.offsetHeight;
          panel.style.top=(box.bottom+height+12<window.innerHeight ? box.bottom+8 : Math.max(12,box.top-height-8))+'px';
        };
        back.setAttribute('aria-expanded','false');back.setAttribute('aria-controls',panel.id);
        cites.forEach(function(cite,index){
          var row=doc.createElement('li');var link=doc.createElement('a');
          link.href='#'+cite.id;link.textContent=sectionLabelFor(cite);link.dataset.citationIndex=String(index);
          link.addEventListener('click',function(event){event.preventDefault();selected=index;back.href=link.href;closePicker();history.replaceState(null,'','#'+cite.id);revealCitation(cite);});
          row.appendChild(link);passages.appendChild(row);
        });
        group.appendChild(panel);
        group.addEventListener('pointerenter',function(event){if(event.pointerType!=='touch')openPicker();});
        group.addEventListener('pointerleave',function(){closeTimer=window.setTimeout(closePicker,180);});
        group.addEventListener('focusin',openPicker);
        group.addEventListener('focusout',function(event){if(!group.contains(event.relatedTarget))closePicker();});
        group.addEventListener('keydown',function(event){if(event.key==='Escape'){back.focus({preventScroll:true});closePicker();event.preventDefault();}if(event.key==='ArrowDown'&&event.target===back){openPicker();passages.querySelector('a').focus({preventScroll:true});event.preventDefault();}});
        doc.addEventListener('pointerdown',function(event){if(!group.contains(event.target))closePicker();});
        window.addEventListener('resize',closePicker);
        doc.addEventListener('scroll',function(event){if(!panel.contains(event.target))closePicker();},true);
      }
      back.addEventListener('click',function(event){event.preventDefault();if(cites.length>1){openPicker();passages.querySelectorAll('a')[selected].focus({preventScroll:true});return;}if(!back.closest('dialog'))history.replaceState(null,'','#'+cites[selected].id);revealCitation(cites[selected]);});
      item.appendChild(group);
      cites.forEach(function(cite,index){
        if(cite.getAttribute('href')!=='#'+refId)return;
        cite.addEventListener('click',function(event){selected=index;back.href='#'+cite.id;if(cite.closest('dialog')){event.preventDefault();item.setAttribute('tabindex','-1');item.focus({preventScroll:true});item.scrollIntoView({block:'center',behavior:reduceMotion?'auto':'smooth'});}item.classList.add('is-citation-highlight');window.setTimeout(function(){item.classList.remove('is-citation-highlight');},5000);});
      });
    });
    // Glossary and language initialization still need the untouched sentence.
    // Request a display pass after the other DOMContentLoaded handlers finish.
    queueMicrotask(function () {
      if (window.AeroSenseI18n) window.AeroSenseI18n.refresh();
      else normalizeCitationPunctuation();
    });
  }

  window.AeroSenseEnhanceReferences = initReferencesEnhance;

  /* ---------- Shared media readiness: a state, never a decorative timer ---------- */
  function createMediaLoader(container, target, kind, retryAction, officialUrl) {
    container.classList.add('media-loader-host');
    if (getComputedStyle(container).position === 'static') container.classList.add('media-loader-host--positioned');
    var overlay = doc.createElement('div'); overlay.className = 'media-loader'; overlay.hidden = true;
    overlay.setAttribute('translate', 'no'); overlay.setAttribute('role', 'status'); overlay.setAttribute('aria-live', 'polite');
    var card = doc.createElement('div'); card.className = 'media-loader__card';
    card.innerHTML = "<svg class=\"media-loader__scene\" viewBox=\"0 0 160 170\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\">\n    <circle cx=\"80\" cy=\"79\" r=\"61\" stroke=\"currentColor\" stroke-width=\".7\" stroke-dasharray=\"2 6\" opacity=\".6\"/>\n    <ellipse cx=\"80\" cy=\"79\" rx=\"38\" ry=\"69\" transform=\"rotate(35 80 79)\" stroke=\"currentColor\" stroke-width=\".8\" opacity=\".45\"/>\n    <g class=\"media-loader__dance\">\n      <g class=\"media-loader__wing media-loader__wing--left\">\n        <path d=\"M83 57C63 33 20 38 32 67 37 81 61 83 82 76\" fill=\"#cbd9ae\" fill-opacity=\".5\" stroke=\"#73845b\" stroke-width=\"1.4\"/>\n        <path d=\"M82 73 54 59\" stroke=\"#73845b\" stroke-width=\"1.5\"/>\n      </g>\n      <g class=\"media-loader__wing media-loader__wing--right\">\n        <path d=\"M85 57C100 20 139 27 128 55 122 69 105 74 85 77\" fill=\"#cbd9ae\" fill-opacity=\".5\" stroke=\"#73845b\" stroke-width=\"1.4\"/>\n        <path d=\"M85 68 115 43\" stroke=\"#73845b\" stroke-width=\"1.5\"/>\n      </g>\n      <g class=\"media-loader__legs media-loader__legs--left\" stroke=\"#73845b\" stroke-width=\"1.5\"><path d=\"M75 88 54 98 43 116M75 78 51 78 39 86\"/></g>\n      <g class=\"media-loader__legs media-loader__legs--right\" stroke=\"#73845b\" stroke-width=\"1.5\"><path d=\"M92 88 116 96 125 112M95 75 121 73 133 78\"/></g>\n      <ellipse cx=\"84\" cy=\"88\" rx=\"10\" ry=\"26\" transform=\"rotate(-8 84 88)\" fill=\"#d7b367\" stroke=\"#6f744c\" stroke-width=\"1.4\"/>\n      <path d=\"M75 84 94 82M75 94 94 91M78 103 92 100\" stroke=\"#8e7950\" stroke-width=\"2\"/>\n      <ellipse cx=\"83\" cy=\"61\" rx=\"11\" ry=\"12\" fill=\"#bbc690\" stroke=\"#6f744c\" stroke-width=\"1.4\"/>\n      <circle cx=\"76\" cy=\"60\" r=\"4\" fill=\"#b96950\"/><circle cx=\"90\" cy=\"58\" r=\"4\" fill=\"#b96950\"/>\n      <path d=\"M79 50 75 38M86 49 90 38\" stroke=\"#6f744c\" stroke-width=\"1.4\" stroke-linecap=\"round\"/>\n    </g>\n    <circle cx=\"29\" cy=\"120\" r=\"4\" fill=\"#c47a57\"/><circle cx=\"135\" cy=\"100\" r=\"3\" fill=\"#b1c590\"/><circle cx=\"114\" cy=\"145\" r=\"4\" fill=\"#e0c47c\"/>\n    <path d=\"M49 151h63M66 158h30\" stroke=\"#a5af8b\" stroke-width=\"1\"/>\n  </svg>";
    var label = doc.createElement('span'); label.className = 'media-loader__label'; card.appendChild(label);
    var retry = doc.createElement('button'); retry.type = 'button'; retry.className = 'media-loader__retry'; retry.hidden = true;
    if (retryAction) retry.addEventListener('click', retryAction); card.appendChild(retry);
    var original;
    if (officialUrl) { original = doc.createElement('a'); original.href = officialUrl; original.target = '_blank'; original.rel = 'noopener noreferrer'; original.className = 'media-loader__original'; original.hidden = true; card.appendChild(original); }
    overlay.appendChild(card); container.appendChild(overlay);
    var state = 'idle';
    function labels() {
      var zh = /^zh/i.test(root.lang);
      label.textContent = state === 'error' ? (zh ? '內容尚未載入，請重試或開啟原始檔。' : 'This content could not load. Retry or open the original.') : kind === 'pdf' ? (zh ? '正在顯示 PDF…' : 'Rendering PDF…') : (zh ? '正在載入影片…' : 'Loading video…');
      retry.textContent = zh ? '重試' : 'Retry'; if (original) original.textContent = zh ? '開啟原始檔' : 'Open original';
    }
    function change(next) { state = next; overlay.dataset.state = state; overlay.hidden = state === 'ready' || state === 'idle'; overlay.classList.toggle('is-error', state === 'error'); retry.hidden = state !== 'error' || !retryAction; if (original) original.hidden = state !== 'error'; target.setAttribute('aria-busy', String(state === 'loading')); labels(); }
    doc.addEventListener('aerosense:languagechange', labels);
    return { start: function () { change('loading'); }, finish: function () { change('ready'); }, fail: function () { change('error'); }, hide: function () { change('idle'); }, element: overlay };
  }
  window.AeroSenseMediaLoader = { create: createMediaLoader };

  function initMediaReadiness() {
    var serial = 910000, activeFrames = [];
    function nativeVideo(video) {
      if (video.dataset.readinessEnhanced || video.closest('[data-asc]')) return;
      video.dataset.readinessEnhanced = 'true';
      var host = doc.createElement('div'); host.className = 'media-player-frame'; video.before(host); host.appendChild(video);
      var loader = createMediaLoader(host, video, 'video', function () { loader.start(); video.load(); });
      var frameRequest = 0;
      function visibleFrame() {
        if (video.readyState < 2) return;
        var ticket = ++frameRequest;
        if (video.requestVideoFrameCallback && !video.paused) video.requestVideoFrameCallback(function () { if (ticket === frameRequest) loader.finish(); });
        else requestAnimationFrame(function () { if (ticket === frameRequest && video.readyState >= 2) loader.finish(); });
      }
      ['loadstart', 'waiting', 'seeking'].forEach(function (name) { video.addEventListener(name, function () { ++frameRequest; loader.start(); }); });
      ['loadeddata', 'canplay', 'playing', 'seeked'].forEach(function (name) { video.addEventListener(name, visibleFrame); });
      video.addEventListener('error', function () { ++frameRequest; loader.fail(); });
      if (video.readyState >= 2) visibleFrame(); else if (video.currentSrc || video.getAttribute('src')) loader.start();
    }
    function officialPlayer(frame) {
      if (frame.dataset.readinessEnhanced || frame.closest('[data-asc]')) return;
      var initial = frame.getAttribute('src') || frame.getAttribute('data-video-src');
      var url;
      try { url = new URL(initial, doc.baseURI); if (url.origin !== 'https://video.igem.org' || !url.pathname.startsWith('/videos/embed/')) return; } catch (_) { return; }
      frame.dataset.readinessEnhanced = 'true'; url.searchParams.set('api', '1');
      var host = doc.createElement('div'); host.className = 'media-player-frame'; frame.before(host); host.appendChild(frame);
      var watch = 'https://video.igem.org/w/' + url.pathname.split('/').pop();
      var connected = false, ready = false, running = false, timer, deadline, lastPosition = -1, lastAdvance = 0, playing = false, imageSupported = true, imagePending = false, frameDecoded = false;
      var calls = new Map();
      var loader = createMediaLoader(host, frame, 'video', function () { reset(); frame.src = url.href; begin(); }, watch);
      function send(message) { if (frame.contentWindow) frame.contentWindow.postMessage(JSON.stringify(message), url.origin); }
      function rpc(method, callback) { var id = ++serial; calls.set(id, {method:method, callback:callback, time:Date.now()}); send({id:id,method:'peertube::'+method}); }
      function reset() { clearInterval(timer); clearTimeout(deadline); calls.clear(); connected = ready = running = playing = imagePending = frameDecoded = false; lastPosition = -1; }
      function markReady() { ready = true; clearTimeout(deadline); loader.finish(); }
      function checkFrame() {
        if (!imageSupported || imagePending) return;
        imagePending = true;
        rpc('getImageDataUrl', function (result, error) {
          imagePending = false;
          // Older official players may not support snapshots. Playback progress
          // remains the fallback; an unsupported RPC is not a playback failure.
          if (error) { imageSupported = false; return; }
          if (typeof result === 'string' && /^data:image\//.test(result) && result.length > 1000) { frameDecoded = true; if (lastAdvance && Date.now()-lastAdvance < 1800) loader.finish(); }
        });
      }
      function tick() {
        if (!frame.isConnected) { reset(); return; }
        if (doc.hidden || !frame.getClientRects().length) return;
        if (!ready) {
          send({method:'peertube::__ready',params:{type:'publish-request',publish:[]}});
          if (connected && !Array.from(calls.values()).some(function (call) { return call.method === 'isReady'; })) rpc('isReady', function (value) { if (value === true) markReady(); });
        } else if (playing && lastAdvance && Date.now()-lastAdvance > 2200) {
          loader.start();
          if (Date.now()-lastAdvance > 45000) { loader.fail(); playing = false; }
        }
        calls.forEach(function (call,id) { if (Date.now()-call.time > 8000) { calls.delete(id); call.callback(null,true); } });
      }
      function begin() {
        if (running || !frame.getAttribute('src') || frame.hidden) return;
        running = true; if (ready) loader.finish(); else loader.start(); timer = setInterval(tick, 900); tick();
        if (!ready) deadline = setTimeout(function () { if (!ready) loader.fail(); }, 45000);
      }
      function message(event) {
        if (event.origin !== url.origin || event.source !== frame.contentWindow) return;
        var m; try { m = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch (_) { return; }
        if (!m || typeof m !== 'object') return;
        if (m.method === 'peertube::__ready') {
          if (m.params && m.params.type === 'publish-request') send({method:'peertube::__ready',params:{type:'publish-reply',publish:[]}});
          connected = true; tick();
        } else if (m.method === 'peertube::ready') { if (m.params === true) markReady(); else if (m.params === false) loader.fail(); }
        else if (calls.has(m.id)) { var call = calls.get(m.id); calls.delete(m.id); call.callback(m.result, m.error); }
        else if (m.method === 'peertube::playbackStatusChange') { playing = m.params === 'playing'; if (playing) { lastAdvance = Date.now(); frameDecoded = false; loader.start(); checkFrame(); } }
        else if (m.method === 'peertube::playbackStatusUpdate' && m.params) {
          var update = m.params; playing = update.playbackState === 'playing';
          if (playing && Number.isFinite(update.position) && update.position !== lastPosition) { lastAdvance = Date.now(); lastPosition = update.position; if (frameDecoded || !imageSupported) loader.finish(); else checkFrame(); }
          else if (update.playbackState === 'ended' || update.playbackState === 'paused') { if (ready) loader.finish(); }
        }
      }
      window.addEventListener('message', message);
      // iframe.load starts negotiation only. It never dismisses the loader.
      frame.addEventListener('load', function () { if (!running) begin(); tick(); });
      frame.addEventListener('error', loader.fail);
      new MutationObserver(function () { if (frame.getAttribute('src')) begin(); }).observe(frame,{attributes:true,attributeFilter:['src','hidden']});
      if (frame.hasAttribute('data-video-src')) frame.setAttribute('data-video-src', url.href);
      if (frame.getAttribute('src') && frame.getAttribute('src') !== url.href) frame.src = url.href;
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) { if (entries.some(function (entry) { return entry.isIntersecting; })) { begin(); io.disconnect(); } },{rootMargin:'240px 0px'}); io.observe(host);
      } else begin();
      activeFrames.push({frame:frame,stop:reset});
    }
    function scan(scope) { qsa('video,iframe',scope).forEach(function (el) { if (el.tagName === 'VIDEO') nativeVideo(el); else officialPlayer(el); }); }
    scan(doc);
    new MutationObserver(function (records) { records.forEach(function (record) { record.addedNodes.forEach(function (node) { if (node.nodeType !== 1) return; if (node.matches('iframe')) officialPlayer(node); else if (node.matches('video')) nativeVideo(node); scan(node); }); }); }).observe(doc.body,{subtree:true,childList:true});
    window.addEventListener('pagehide',function () { activeFrames.forEach(function (entry) { entry.stop(); }); });
  }

  /* ---------- One named PDF preview per team attachment ---------- */
  function initPdfPreviews() {
    var main = qs('main'); if (!main) return;
    var existing = Object.create(null), readers = [], jumps = [], nativeActions = [], counter = 0;
    function pdfUrl(value) { try { var url = new URL(value,doc.baseURI); if (!/\.pdf$/i.test(url.pathname) || !/^(https?:|file:)$/.test(url.protocol)) return null; url.hash=''; return url; } catch (_) { return null; } }
    function isAttachment(url,link) { return url.origin === new URL(doc.baseURI).origin || /^(static\.igem\.wiki|gitlab\.igem\.org)$/.test(url.hostname) || link.getAttribute('data-pdf-preview') === 'true'; }
    function sourceText(link) { return (window.AeroSenseI18n ? window.AeroSenseI18n.sourceText(link) : link.textContent).trim(); }
    function title(value) { return value.replace(/^(?:Read|Open|Download)\s+/i,'').replace(/(?:_compressed)?\.pdf\b/ig,'').replace(/\s*[·—–-]?\s*\(?PDF(?:,\s*\d+\s*pages)?\)?/ig,'').replace(/\s*[—·]\s*GitLab\s*$/i,'').replace(/\s*↗\s*$/,'').trim() || 'Document'; }
    function translated(value) { return title(window.AeroSenseI18n ? window.AeroSenseI18n.t(value) : value); }
    function targetId(target) { if (!target.id) target.id='pdf-document-'+(++counter); return target.id; }
    function reveal(target) { var ancestor=target; while (ancestor) { if (ancestor.tagName==='DETAILS') ancestor.open=true; ancestor=ancestor.parentElement; } target.scrollIntoView({block:'start',behavior:reduceMotion?'auto':'smooth'}); var focus=target.querySelector('summary') || target; if (!focus.hasAttribute('tabindex') && focus.tagName!=='SUMMARY') focus.tabIndex=-1; focus.focus({preventScroll:true}); }
    qsa('iframe[src],iframe[data-src]',main).forEach(function (frame) {
      var url=pdfUrl(frame.getAttribute('src')||frame.getAttribute('data-src')); if (!url) return;
      var card=frame.closest('.hw-manual-document,.ent-document,details')||frame.parentElement;
      targetId(card); existing[url.href]=card;
      qsa('a[data-pdf-preview-src]',card).forEach(function (link) { var publicUrl=pdfUrl(link.getAttribute('href')); if (publicUrl) existing[publicUrl.href]=card; });
    });
    qsa('a[href]',main).forEach(function (link) {
      var url=pdfUrl(link.getAttribute('href')),localPreview=pdfUrl(link.getAttribute('data-pdf-preview-src'));
      if (localPreview && localPreview.origin!==new URL(doc.baseURI).origin) localPreview=null;
      var previewUrl=localPreview||url;
      if (!url||!isAttachment(url,link)||link.closest('[data-pdf-preview="false"],[data-hw-v2-preview]')||(url.hostname==='gitlab.igem.org'&&!localPreview)) return;
      var prior=existing[url.href]||existing[previewUrl.href];
      if (prior) {
        if (prior.contains(link)) {
          // The existing card already has its document heading. Use a concise
          // action inside that card instead of repeating the file name.
          link.setAttribute('translate','no'); nativeActions.push({link:link,download:link.hasAttribute('download')}); return;
        }
        var jumpSource=sourceText(link); link.href='#'+targetId(prior); link.removeAttribute('target'); link.removeAttribute('download'); link.removeAttribute('data-pdf-preview-src'); link.setAttribute('translate','no');
        link.addEventListener('click',function (event) { event.preventDefault(); reveal(prior); }); jumps.push({link:link,source:jumpSource}); return;
      }
      var labelSource=sourceText(link); var details=doc.createElement('details'); details.className='pdf-preview'; details.setAttribute('translate','no'); targetId(details);
      existing[url.href]=existing[previewUrl.href]=details;
      var summary=doc.createElement('summary'),name=doc.createElement('span'),badge=doc.createElement('span'); name.className='pdf-preview__title'; badge.className='pdf-preview__badge'; badge.textContent='PDF'; badge.setAttribute('aria-hidden','true'); summary.append(name,badge);
      var body=doc.createElement('div'); body.className='pdf-preview__body';
      var actions=doc.createElement('p'); actions.className='pdf-preview__actions';
      var open=doc.createElement('a'); open.href=url.href; open.target='_blank'; open.rel='noopener noreferrer';
      var download=doc.createElement('a'); download.href=url.href; download.setAttribute('download','');
      var close=doc.createElement('button'); close.type='button';
      var frame=doc.createElement('iframe'); frame.className='pdf-preview__frame'; frame.loading='lazy'; frame.setAttribute('data-pdf-preview-src',previewUrl.href);
      var fallback=doc.createElement('p'); fallback.className='pdf-preview__fallback';
      actions.append(open,download,close); body.append(actions,frame,fallback); details.append(summary,body);
      var anchor=link.closest('p,li,dd,td,th')||link;
      // Replace a standalone document link rather than repeating it above the reader.
      if (anchor.tagName==='P' && anchor.textContent.trim()===link.textContent.trim() && anchor.querySelectorAll('a').length===1) { if(anchor.id)details.id=anchor.id; anchor.replaceWith(details); }
      else if (/^(LI|DD|TD|TH)$/.test(anchor.tagName)) { link.replaceWith(details); }
      else {
        anchor.after(details);
        if (anchor===link) link.remove();
        else { link.remove(); if (anchor.firstChild && anchor.firstChild.nodeType===3) anchor.firstChild.data=anchor.firstChild.data.replace(/^\s*[·|]\s*/,''); }
      }
      function syncFrame() {
        var visible=details.open,parent=details.parentElement;
        while(parent) { if(parent.hidden||(parent.tagName==='DETAILS'&&!parent.open))visible=false; parent=parent.parentElement; }
        var reader=frame._aeroSensePdfReader;
        if(visible&&!reader&&window.AeroSensePdfReader)reader=window.AeroSensePdfReader.enhance(frame);
        if(reader){reader.setActive(visible);return;}
        if(visible&&frame.isConnected){if(!frame.hasAttribute('src'))frame.src=previewUrl.href+'#view=FitH';}else frame.removeAttribute('src');
      }
      function closeReader(){details.open=false;syncFrame();summary.focus();}
      details.addEventListener('toggle',syncFrame);
      var parent=details.parentElement;while(parent){if(parent.tagName==='DETAILS')parent.addEventListener('toggle',syncFrame);parent=parent.parentElement;}
      close.addEventListener('click',closeReader);details.addEventListener('keydown',function(event){if(event.key==='Escape'&&details.open){event.preventDefault();closeReader();}});
      readers.push({name:name,open:open,download:download,close:close,frame:frame,fallback:fallback,source:labelSource});
    });
    function updateLabels(){var zh=/^zh/i.test(root.lang);nativeActions.forEach(function(action){action.link.textContent=action.download?(zh?'下載 PDF':'Download PDF'):(zh?'另開 PDF':'Open PDF');});readers.forEach(function(reader){var label=translated(reader.source);reader.name.textContent=label;reader.open.textContent=zh?'另開 PDF':'Open PDF';reader.download.textContent=zh?'下載 PDF':'Download PDF';reader.close.textContent=zh?'收起預覽':'Close preview';reader.frame.title=(zh?'PDF 預覽：':'PDF preview: ')+label;if(reader.frame._aeroSensePdfReader)reader.frame._aeroSensePdfReader.setTitle(reader.frame.title);reader.fallback.textContent=zh?'若未顯示預覽，可另開或下載 PDF。':'If the preview is unavailable, open or download the PDF.';});jumps.forEach(function(jump){jump.link.textContent=translated(jump.source)+(zh?' — 前往預覽':' — view preview');});}
    updateLabels();doc.addEventListener('aerosense:languagechange',updateLabels);
  }

  function initIllustrationCredits() {
    // These exact official filenames are tied by verified-official-urls.json
    // to object metadata recording built-in image_gen. Do not infer an image's
    // provenance from the historical "claude-source" CSS label.
    var verified = new Set([
      "0a94eb9ed729-learning-04-decode.webp", "2931213df1bd-notebook.webp",
      "387d48bdbdec-index.webp", "3e7460e423d9-experiments.webp",
      "4b1bb6846acb-measurement.webp", "4e95484b7359-members.webp",
      "4f0478388e07-description.webp", "6574e767d19a-contribution.webp",
      "6d2d793c6144-entrepreneurship.webp", "7ed69fc660e2-learning-03-synbio.webp",
      "80498231178d-design.webp", "80c2022bdb46-education.webp",
      "81923740ea45-parts.webp", "8e9d0ac54c68-learning-platform.webp",
      "9cb8fece8726-learning-05-act.webp", "a38b84e66327-sustainability.webp",
      "a4349884e17d-hardware.webp", "af31e611f889-human-practices.webp",
      "c8f90001c37d-safety-and-security.webp", "d2b3c9f70478-results.webp",
      "ddfebb6ea12d-learning-01-smell.webp", "efe9d6a342b0-model.webp",
      "f2b53410a3fc-engineering.webp", "f53a138df142-learning-02-mold.webp",
      "fb4aa54013d7-attributions.webp"
    ]);
    var sourceScript = doc.querySelector('script[src*="js/main.js"],script[src*="js/home.bundle.js"]');
    var creditsUrl = sourceScript ? new URL('../credits.html#responsible-ai', sourceScript.src).href : 'credits.html#responsible-ai';
    function scan() {
      qsa('.ds-hero-art img[src],.learning-claude-art img[src]').forEach(function (img) {
        var url;try { url = new URL(img.src, doc.baseURI); } catch (_) { return; }
        if (url.hostname !== 'static.igem.wiki' || !verified.has(url.pathname.split('/').pop())) return;
        var art=img.closest('.ds-hero-art,.learning-claude-art'),hero=art.parentElement;
        if(hero.querySelector(':scope > .illustration-credit'))return;
        var credit=doc.createElement('p'),tool=doc.createElement('a'),license=doc.createElement('a');
        credit.className='illustration-credit';credit.setAttribute('data-i18n-ignore','');
        tool.href=creditsUrl;tool.className='illustration-credit__source';
        license.href='https://creativecommons.org/licenses/by/4.0/';license.textContent='CC BY 4.0';license.rel='license noopener noreferrer';
        credit.append(tool,doc.createTextNode(' · '),license);art.after(credit);
      });
      updateLabels();
    }
    function updateLabels() {
      var zh=/^zh/i.test(doc.documentElement.lang);
      qsa('.illustration-credit__source').forEach(function (link) {
        var label=zh?'AI 插畫：OpenAI 圖像生成':'AI illustration: OpenAI image generation';
        if(link.textContent!==label)link.textContent=label;
      });
    }
    scan();
    var main=doc.querySelector('main');
    if(main)new MutationObserver(function(records){
      if(records.some(function(r){return Array.from(r.addedNodes).some(function(n){return n.nodeType===1&&(n.matches('.ds-hero-art,.learning-claude-art')||n.querySelector('.ds-hero-art,.learning-claude-art'))})}))scan();
    }).observe(main,{childList:true,subtree:true});
    doc.addEventListener('aerosense:languagechange',updateLabels);
  }

  doc.addEventListener("DOMContentLoaded", function () {
    initNav();
    initProgress();
    initBackToTop();
    initTocLabelWrap();
    // Lesson stage links are rendered by the module after the shell is ready.
    if (doc.body.classList.contains('page-learn-module')) setTimeout(initTocSpy, 0);
    else initTocSpy();
    initReveal();
    initTocDetails();
    initContributionFilter();
    initNotebookFilter();
    initNotebookCalendar();
    initReferencesEnhance();
    initPdfPreviews();
    initMediaReadiness();
    initIllustrationCredits();
  });
})();
