/**
 * Engineering page — in-place cycle viewer, DBTLR dial, figure notes.
 * Without JS, Cycle 1 remains visible in each track.
 */
(function () {
  "use strict";

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function bindTablist(tabs, panels, options) {
    options = options || {};
    var live = options.live;
    var getKey = options.getKey;
    var panelKey = options.panelKey;
    var onSelect = options.onSelect;
    var labelFor = options.labelFor || function (key) {
      return String(key);
    };

    function select(tab, moveFocus) {
      var key = getKey(tab);
      tabs.forEach(function (btn) {
        var on = btn === tab;
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.setAttribute("tabindex", on ? "0" : "-1");
        btn.classList.toggle("is-active", on);
      });
      panels.forEach(function (panel) {
        var on = panelKey(panel) === key;
        panel.classList.toggle("is-active", on);
        panel.hidden = !on;
      });
      if (live) {
        live.textContent = labelFor(key, tab);
      }
      if (typeof onSelect === "function") {
        onSelect(key, tab);
      }
      if (moveFocus) {
        tab.focus();
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(tab, false);
      });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          next = tabs[(index + 1) % tabs.length];
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          next = tabs[(index - 1 + tabs.length) % tabs.length];
        } else if (event.key === "Home") {
          next = tabs[0];
        } else if (event.key === "End") {
          next = tabs[tabs.length - 1];
        }
        if (next) {
          event.preventDefault();
          select(next, true);
        }
      });
    });

    var initial =
      tabs.filter(function (t) {
        return t.getAttribute("aria-selected") === "true";
      })[0] || tabs[0];
    select(initial, false);
    return select;
  }

  function initBeforeAfter(root) {
    var tabs = qsa("[data-eng-ba-btn]", root);
    var panels = qsa("[data-eng-ba-panel]", root);
    var live = qs("[data-eng-ba-live]", root);
    if (!tabs.length || !panels.length) return;
    root.classList.add("is-enhanced");
    bindTablist(tabs, panels, {
      live: live,
      getKey: function (tab) {
        return tab.getAttribute("data-eng-ba-btn");
      },
      panelKey: function (panel) {
        return panel.getAttribute("data-eng-ba-panel");
      },
      labelFor: function (key, tab) {
        var label = tab && tab.textContent ? tab.textContent.trim() : "";
        return label ? "Showing " + label : key === "after" ? "Showing After" : "Showing Before";
      },
    });
  }

  function initLadder(root) {
    var tabs = qsa("[data-eng-ladder-step]", root);
    var panels = qsa("[data-eng-ladder-panel]", root);
    var live = qs("[data-eng-ladder-live]", root);
    if (!tabs.length || !panels.length) return;
    root.classList.add("is-enhanced");
    var names = {
      "1": "Electrical bring-up",
      "2": "Dark noise and drift",
      "3": "Excitation leakage",
      "4": "Standard fluorescence calibration",
      "5": "FDM recovery",
      "6": "Channel crosstalk",
      "7": "DLIA SNR improvement",
      "8": "Biological fluorescence",
      "9": "Battery / system stability",
      "10": "User workflow",
    };
    bindTablist(tabs, panels, {
      live: live,
      getKey: function (tab) {
        return tab.getAttribute("data-eng-ladder-step");
      },
      panelKey: function (panel) {
        return panel.getAttribute("data-eng-ladder-panel");
      },
      labelFor: function (key) {
        return "Step " + key + " · " + (names[key] || "") + " · PLANNED";
      },
    });
  }

  function initDiag(root) {
    var tabs = qsa("[data-eng-diag-btn]", root);
    var panels = qsa("[data-eng-diag-panel]", root);
    var live = qs("[data-eng-diag-live]", root);
    if (!tabs.length || !panels.length) return;
    root.classList.add("is-enhanced");
    var labels = {
      both: "Pattern: ionomycin ↑ and VUAA1 ↑",
      reporter: "Pattern: ionomycin ↑, VUAA1 no response",
      sensor: "Pattern: ionomycin no response, VUAA1 no response",
    };
    bindTablist(tabs, panels, {
      live: live,
      getKey: function (tab) {
        return tab.getAttribute("data-eng-diag-btn");
      },
      panelKey: function (panel) {
        return panel.getAttribute("data-eng-diag-panel");
      },
      labelFor: function (key) {
        return labels[key] || ("Pattern: " + key);
      },
    });
  }

  function initFigureDisclosures() {
    var keepCaption = {
      "eng-cycle__figure-id": true,
      "eng-cycle__figure-title": true,
      "eng-cycle__figure-cap": true,
    };

    qsa(".eng-cycle__figure > figcaption").forEach(function (cap) {
      if (cap.querySelector(":scope > .eng-cycle__figure-meta")) return;
      var rest = Array.prototype.filter.call(cap.children, function (el) {
        if (el.tagName === "DETAILS") return false;
        var cls = el.className || "";
        return !Object.keys(keepCaption).some(function (k) {
          return cls.indexOf(k) !== -1;
        });
      });
      if (!rest.length) return;

      var details = document.createElement("details");
      details.className = "eng-cycle__figure-meta";
      var summary = document.createElement("summary");
      summary.className = "eng-cycle__figure-meta-summary";
      summary.textContent = "Caption & limits";
      details.appendChild(summary);
      rest.forEach(function (el) {
        details.appendChild(el);
      });
      cap.appendChild(details);
    });

    qsa(".eng-cycle__figure .eng-evidence-card").forEach(function (card) {
      if (card.querySelector(":scope > .eng-evidence-card__more")) return;
      var rest = qsa(".eng-evidence-card__detail, .eng-evidence-card__missing", card);
      if (!rest.length) return;
      var details = document.createElement("details");
      details.className = "eng-evidence-card__more";
      var summary = document.createElement("summary");
      summary.className = "eng-evidence-card__more-summary";
      summary.textContent = "Evidence note";
      details.appendChild(summary);
      rest.forEach(function (el) {
        details.appendChild(el);
      });
      card.appendChild(details);
    });

    document.body.classList.add("eng-figures-collapsed");
  }

  function initGlanceThumbs() {
    qsa(".eng-glance__thumb img").forEach(function (img) {
      function markMissing() {
        var fig = img.closest ? img.closest(".eng-glance__thumb") : img.parentElement;
        if (fig) fig.classList.add("is-missing");
        img.hidden = true;
      }
      img.addEventListener("error", markMissing);
      if (img.complete && img.naturalWidth === 0) markMissing();
    });
  }

  var HASH_OPEN = {
    "engineering-map": "engineering-at-a-glance",
    "engineering-principle": "engineering-at-a-glance",
    "tab-read": "group-hardware",
    "map-panel-read": "group-hardware",
    "track-hardware": "group-hardware",
    "tab-sense": "stream-wetlab",
    "map-panel-sense": "stream-wetlab",
    "track-wetlab": "stream-wetlab",
    "tab-decode": "group-model",
    "map-panel-decode": "group-model",
    "track-drylab": "group-model",
    "tab-act": "beyond-the-bench",
    "map-panel-act": "beyond-the-bench",
    "track-integrated": "beyond-the-bench",
    "glance-wetlab": "stream-wetlab",
    "glance-hardware": "group-hardware",
    "glance-model": "group-model",
    "glance-hp": "beyond-the-bench",
    "wl-cycle-0": "wl-cycle-1",
    "dl-cycle-0": "dl-cycle-1",
    "model-cycle-1": "dl-cycle-1",
    "model-cycle-2": "dl-cycle-2",
    "hw-cycle-0": "hw-cycle-1",
  };

  var STAGE_LABELS = {
    design: "Design",
    build: "Build",
    test: "Test",
    learn: "Learn",
    redesign: "Redesign",
  };
  var STAGE_INDEX = {
    design: 0,
    build: 1,
    test: 2,
    learn: 3,
    redesign: 4,
  };

  var viewers = [];
  var dial = null;
  var dialLive = null;
  var stageObserver = null;
  var observedStages = [];

  function trackHeading(viewer) {
    return qs(".eng-track__title", viewer) || qs(".eng-track__head", viewer) || viewer;
  }

  function selectCycle(viewer, cycle, options) {
    options = options || {};
    var cycleKey = String(cycle);
    var tabs = qsa("[data-cycle-tab]", viewer);
    var panels = qsa("[data-cycle-panel]", viewer);
    var activePanel = null;

    tabs.forEach(function (tab) {
      var on = tab.getAttribute("data-cycle-tab") === cycleKey;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.setAttribute("tabindex", on ? "0" : "-1");
      tab.classList.toggle("is-active", on);
    });
    panels.forEach(function (panel) {
      var on = panel.getAttribute("data-cycle-panel") === cycleKey;
      panel.hidden = !on;
      panel.classList.toggle("is-active", on);
      if (on) activePanel = panel;
    });

    if (options.hash !== false && activePanel && activePanel.id) {
      var next = "#" + activePanel.id;
      if (location.hash !== next) {
        if (options.hash === "push") {
          history.pushState(null, "", next);
        } else {
          history.replaceState(null, "", next);
        }
      }
    }

    refreshStageObserver();
    updateDialFromViewport();

    if (options.scroll === "track") {
      var heading = trackHeading(viewer);
      if (heading && typeof heading.scrollIntoView === "function") {
        heading.scrollIntoView({ block: "start" });
      }
    }
    return activePanel;
  }

  function initCycleViewer(viewer) {
    var tabs = qsa("[data-cycle-tab]", viewer);
    var panels = qsa("[data-cycle-panel]", viewer);
    if (!tabs.length || !panels.length) return;
    viewers.push(viewer);

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        selectCycle(viewer, tab.getAttribute("data-cycle-tab"), { hash: "replace", scroll: "none" });
      });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          next = tabs[(index + 1) % tabs.length];
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          next = tabs[(index - 1 + tabs.length) % tabs.length];
        } else if (event.key === "Home") {
          next = tabs[0];
        } else if (event.key === "End") {
          next = tabs[tabs.length - 1];
        }
        if (!next) return;
        event.preventDefault();
        selectCycle(viewer, next.getAttribute("data-cycle-tab"), { hash: "replace", scroll: "none" });
        next.focus();
      });
    });
  }

  function visibleStages() {
    return qsa("[data-cycle-panel]:not([hidden]) [data-eng-stage]");
  }

  function nearestStage() {
    var stages = visibleStages();
    if (!stages.length) return null;
    var mark = window.innerHeight * 0.4;
    var best = null;
    var bestDist = Infinity;
    stages.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      var dist = Math.abs(rect.top - mark);
      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    });
    return best;
  }

  function setDial(stage, track) {
    if (!dial) return;
    if (!stage) {
      dial.hidden = true;
      return;
    }
    dial.hidden = false;
    var prev = dial.getAttribute("data-dbtlr-dial");
    dial.setAttribute("data-dbtlr-dial", stage);
    if (track) dial.setAttribute("data-dbtlr-track", track);
    if (dialLive) dialLive.textContent = STAGE_LABELS[stage] || stage;
    dial.style.setProperty("--dbtlr-index", String(STAGE_INDEX[stage] || 0));
    if (prev && prev !== stage) {
      dial.classList.remove("is-ticking");
      void dial.offsetWidth;
      dial.classList.add("is-ticking");
    }
  }

  function updateDialFromViewport() {
    var stageEl = nearestStage();
    if (!stageEl) {
      setDial(null);
      return;
    }
    var viewer = stageEl.closest("[data-cycle-viewer]");
    var track = viewer ? viewer.getAttribute("data-eng-track") : "";
    setDial(stageEl.getAttribute("data-eng-stage"), track);
  }

  function refreshStageObserver() {
    if (!window.IntersectionObserver) {
      updateDialFromViewport();
      return;
    }
    if (!stageObserver) {
      stageObserver = new IntersectionObserver(
        function () {
          updateDialFromViewport();
        },
        {
          root: null,
          rootMargin: "-35% 0px -45% 0px",
          threshold: [0, 0.15, 0.35, 0.6, 1],
        }
      );
    }
    observedStages.forEach(function (el) {
      stageObserver.unobserve(el);
    });
    observedStages = visibleStages();
    observedStages.forEach(function (el) {
      stageObserver.observe(el);
    });
    updateDialFromViewport();
  }

  function resolveHash(hash) {
    hash = (hash || "").replace(/^#/, "");
    if (!hash) return null;
    var mapped = HASH_OPEN[hash] || hash;
    var el = document.getElementById(mapped) || document.getElementById(hash);
    if (!el) return null;
    var panel = null;
    if (el.hasAttribute && el.hasAttribute("data-cycle-panel")) {
      panel = el;
    } else if (el.closest) {
      panel = el.closest("[data-cycle-panel]");
    }
    var viewer = panel && panel.closest ? panel.closest("[data-cycle-viewer]") : null;
    if (!viewer && el.closest) {
      viewer = el.closest("[data-cycle-viewer]");
    }
    return {
      hash: hash,
      mapped: mapped,
      el: el,
      panel: panel,
      viewer: viewer,
      cycle: panel ? panel.getAttribute("data-cycle-panel") : null,
      isCycleId: !!(panel && (el === panel || HASH_OPEN[hash])),
    };
  }

  function syncFromHash(options) {
    options = options || {};
    var ctx = resolveHash(location.hash);
    if (!ctx) return;
    if (ctx.viewer && ctx.cycle) {
      selectCycle(ctx.viewer, ctx.cycle, { hash: false, scroll: "none" });
      if (options.scroll !== false) {
        var heading = trackHeading(ctx.viewer);
        if (heading && typeof heading.scrollIntoView === "function") {
          heading.scrollIntoView({ block: "start" });
        }
      }
      return;
    }
    if (options.scroll !== false && ctx.el && typeof ctx.el.scrollIntoView === "function") {
      ctx.el.scrollIntoView({ block: "start" });
    }
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    dial = qs("[data-dbtlr-dial]");
    dialLive = qs("[data-dbtlr-live]");
    qsa("[data-cycle-viewer]").forEach(initCycleViewer);
    qsa("[data-eng-ba]").forEach(initBeforeAfter);
    qsa("[data-eng-ladder]").forEach(initLadder);
    qsa("[data-eng-diag]").forEach(initDiag);
    initFigureDisclosures();
    initGlanceThumbs();
    refreshStageObserver();
    window.addEventListener("scroll", updateDialFromViewport, { passive: true });
    window.addEventListener("resize", updateDialFromViewport);

    document.addEventListener("click", function (event) {
      var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var href = link.getAttribute("href") || "";
      if (href.length < 2) return;
      var ctx = resolveHash(href);
      if (!ctx || !ctx.viewer || !ctx.cycle) return;
      event.preventDefault();
      selectCycle(ctx.viewer, ctx.cycle, { hash: "push", scroll: "track" });
    });

    syncFromHash({ scroll: true });
    window.addEventListener("hashchange", function () {
      syncFromHash({ scroll: true });
    });
    window.addEventListener("popstate", function () {
      syncFromHash({ scroll: false });
    });
  });
})();
