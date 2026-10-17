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

  function initReferencesEnhance() {
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
      cites.forEach(function(cite,index){if(!cite.id)cite.id='cite-auto-'+refId+'-'+(index+1);});
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
  }

  window.AeroSenseEnhanceReferences = initReferencesEnhance;

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
  });
})();
