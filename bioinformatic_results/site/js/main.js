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

  /* ---------- TOC current section ---------- */
  function initTocSpy() {
    var links = qsa('.page-toc a[href^="#"]:not(.back-to-top)');
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
      "Cryo-EM structure of an insect odorant receptor / Orco ion channel complex.",
      "Structural context for OR–Orco channel architecture in design discussions.",
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

  // One viewport-bound layer for reference previews. Hidden panels have no layout
  // box; open panels leave transformed/overflow-clipped article ancestors.
  var citationPanels = (function () {
    var active=null, closeTimer=0, frame=0, restoring=false;
    var bridge=doc.createElement('div');bridge.className='reading-popover-bridge';bridge.hidden=true;bridge.setAttribute('aria-hidden','true');
    function cancelClose(){window.clearTimeout(closeTimer);closeTimer=0;}
    function hide(panel,restoreFocus){
      if(!active||(panel&&active.panel!==panel))return;
      cancelClose();var previous=active;active=null;
      previous.panel.classList.remove('is-open');previous.panel.hidden=true;bridge.hidden=true;
      if(previous.next&&previous.next.parentNode===previous.home)previous.home.insertBefore(previous.panel,previous.next);else previous.home.appendChild(previous.panel);
      previous.anchor.setAttribute('aria-expanded','false');
      if(previous.onClose)previous.onClose();
      if(restoreFocus){restoring=true;previous.anchor.focus({preventScroll:true});restoring=false;}
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
      if(restoring)return;
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
      if(!bridge.isConnected)doc.body.appendChild(bridge);
      doc.body.appendChild(panel);panel.hidden=false;panel.classList.add('is-open');anchor.setAttribute('aria-expanded','true');place();
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

  function initReferencesEnhance() {
    var items = qsa(".ref-list > li[id]");
    if (!items.length) return;

    items.forEach(function (item) {
      var refId = item.id;
      var cites = qsa('a.cite[href="#' + refId + '"]');
      var backlinks = qsa(".ref-backlink", item);

      /* Source highlights (collapsed by default) */
      if (!qs(".ref-highlights", item) && REF_HIGHLIGHTS[refId]) {
        var details = doc.createElement("details");
        details.className = "ref-highlights";
        var summary = doc.createElement("summary");
        summary.textContent = "Source highlights";
        var body = doc.createElement("div");
        body.className = "ref-highlights__body";
        var ul = doc.createElement("ul");
        REF_HIGHLIGHTS[refId].forEach(function (point) {
          var li = doc.createElement("li");
          li.textContent = point;
          ul.appendChild(li);
        });
        body.appendChild(ul);
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
      panel.hidden = true;

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

      function openPanel(event) {
        var anchor=event&&event.target.closest?event.target.closest('.ref-backlink'):null;
        citationPanels.show(anchor||backlinks[0],panel,group);
      }
      function closePanel() {
        citationPanels.scheduleClose();
      }

      group.addEventListener("mouseenter", openPanel);
      group.addEventListener("mouseleave", closePanel);
      group.addEventListener("focusin", openPanel);
      group.addEventListener("focusout", function () {
        window.setTimeout(closePanel, 0);
      });
      panel.addEventListener('click',function(event){if(event.target.closest('a[href]'))citationPanels.hide(panel);});
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
