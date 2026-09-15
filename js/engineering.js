/**
 * Engineering page interactions.
 * - Map track switcher
 * - Reusable Engineering Cycle stage switcher (data-eng-cycle)
 *
 * Progressive enhancement:
 * - Without JS, map panels and all DBTL stage panels remain readable in document order.
 * - No scroll-jacking; native anchors and history still work.
 * - Animations only explain selected-stage changes (short opacity/transform).
 */
(function () {
  "use strict";

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function initMap(root) {
    var tabs = qsa('[role="tab"][data-eng-track]', root);
    var panels = qsa("[data-eng-panel]", root);
    var live = qs("[data-eng-map-live]", root);
    if (!tabs.length || !panels.length) return;

    document.body.classList.add("eng-map-enhanced");
    root.classList.add("is-enhanced");

    var labels = {
      read: "Showing READ · Hardware",
      sense: "Showing SENSE · Wet Lab",
      decode: "Showing DECODE · Dry Lab",
      act: "Showing ACT · External evidence cases",
    };

    function select(tab, moveFocus) {
      var id = tab.getAttribute("data-eng-track");
      tabs.forEach(function (btn) {
        var on = btn === tab;
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.setAttribute("tabindex", on ? "0" : "-1");
        btn.classList.toggle("is-active", on);
      });
      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-eng-panel") === id;
        panel.classList.toggle("is-active", on);
        panel.hidden = !on;
      });
      if (live) {
        live.textContent = labels[id] || ("Showing " + id);
      }
      syncSignalActive(id);
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

    function syncFromHash() {
      var hash = (location.hash || "").replace(/^#/, "");
      if (!hash) return;
      var map = {
        "hw-cycle-1": "read",
        "hw-cycle-2": "read",
        "hw-cycle-3": "read",
        "track-hardware": "read",
        "hw-change-log": "read",
        "hw-professional-review": "read",
        "hw-do-differently": "read",
        "hw-validation-ladder": "read",
        "hw-c1-panel-design": "read",
        "hw-c1-panel-build": "read",
        "hw-c1-panel-test": "read",
        "hw-c1-panel-learn": "read",
        "hw-c1-panel-redesign": "read",
        "fig-e-h1a": "read",
        "fig-e-h1b": "read",
        "fig-e-h1c": "read",
        "fig-e-h1d": "read",
        "fig-e-h2": "read",
        "fig-e-h3": "read",
        "wl-cycle-0": "sense",
        "wl-cycle-1": "sense",
        "wl-cycle-2": "sense",
        "wl-side-decisions": "sense",
        "wl-diagnostic-logic": "sense",
        "fig-e-w0": "sense",
        "fig-e-w1": "sense",
        "fig-e-w2": "sense",
        "track-wetlab": "sense",
        "dl-cycle-0": "decode",
        "dl-cycle-1": "decode",
        "dl-practice": "decode",
        "fig-e-d1": "decode",
        "fig-e-d2": "decode",
        "fig-e-d3": "decode",
        "fig-e-d4": "decode",
        "fig-e-d5": "decode",
        "track-drylab": "decode",
        "hp-ent-cycles": "act",
        "hp-edu-cycles": "act",
        "track-integrated": "act",
        "beyond-the-bench": "act",
        "xcase-beachhead": "act",
        "xcase-screening": "act",
        "xcase-claims": "act",
      };
      var track = map[hash];
      if (!track) return;
      var tab = tabs.filter(function (t) {
        return t.getAttribute("data-eng-track") === track;
      })[0];
      if (tab) select(tab, false);
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
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
        return label ? ("Showing " + label) : (key === "after" ? "Showing After" : "Showing Before");
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

  /**
   * Reusable Engineering Cycle stage switcher.
   */
  function initCycle(root) {
    var tabs = qsa(".eng-cycle__stage-btn[data-eng-stage]", root);
    var panels = qsa("[data-eng-stage-panel]", root);
    var live = qs("[data-eng-stage-live]", root);
    if (!tabs.length || !panels.length) return;

    root.classList.add("is-enhanced");

    var stageLabels = {
      design: "Showing Design",
      build: "Showing Build",
      test: "Showing Test",
      learn: "Showing Learn",
      redesign: "Showing Redesign",
    };

    var elc = qs("[data-eng-elc]", root);

    function updateElcLink(stage) {
      if (!elc) return;
      var link = stage === "redesign" || stage === "learn";
      elc.classList.toggle("is-linked", link);
      elc.classList.toggle("is-linked-redesign", stage === "redesign");
      elc.classList.toggle("is-linked-learn", stage === "learn");
    }

    bindTablist(tabs, panels, {
      live: live,
      getKey: function (tab) {
        return tab.getAttribute("data-eng-stage");
      },
      panelKey: function (panel) {
        return panel.getAttribute("data-eng-stage-panel");
      },
      labelFor: function (key, tab) {
        var nameEl = tab && qs(".eng-cycle__stage-name", tab);
        if (nameEl && nameEl.textContent) {
          return "Showing " + nameEl.textContent.trim();
        }
        return stageLabels[key] || ("Showing " + key);
      },
      onSelect: function (key) {
        updateElcLink(key);
      },
    });

    function syncStageFromHash() {
      var hash = (location.hash || "").replace(/^#/, "");
      if (!hash) return;
      var panel = null;
      try {
        panel = qs("#" + (window.CSS && CSS.escape ? CSS.escape(hash) : hash.replace(/([^a-zA-Z0-9_-])/g, "\\$1")), root);
      } catch (err) {
        panel = null;
      }
      if (!panel || !panel.hasAttribute("data-eng-stage-panel")) return;
      var stage = panel.getAttribute("data-eng-stage-panel");
      var tab = tabs.filter(function (t) {
        return t.getAttribute("data-eng-stage") === stage;
      })[0];
      if (tab) {
        tab.click();
      }
    }

    syncStageFromHash();
    window.addEventListener("hashchange", syncStageFromHash);
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function syncSignalActive(trackId) {
    var signal = qs("[data-eng-signal]");
    if (!signal) return;
    qsa("[data-eng-signal-node]", signal).forEach(function (node) {
      var on = node.getAttribute("data-eng-signal-node") === trackId;
      node.classList.toggle("is-active", on);
    });
  }

  function observeInView(el, className) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add(className);
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            el.classList.add(className);
            if (!prefersReducedMotion()) {
              el.classList.add("is-animating");
            }
          }
        });
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
  }

  function initSignalPath() {
    var signal = qs("[data-eng-signal]");
    if (!signal) return;
    observeInView(signal, "is-inview");
    qsa(".eng-signal-path").forEach(function (path) {
      observeInView(path, "is-inview");
    });
  }

  function initHeroLoop() {
    var loop = qs("[data-eng-hero-loop]");
    if (!loop) return;
    if (prefersReducedMotion()) {
      loop.classList.add("is-static");
      return;
    }
    observeInView(loop, "is-inview");
  }

  function initOrientationSync() {
    var mq = window.matchMedia("(min-width: 1024px)");
    function apply() {
      var horizontal = mq.matches;
      qsa("[data-eng-orient]").forEach(function (el) {
        el.setAttribute("aria-orientation", horizontal ? "horizontal" : "vertical");
      });
    }
    apply();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(apply);
    }
  }

  /**
   * Collapse long figure captions / evidence notes so Related figure columns
   * stay compact. Always keep figure id + title (and evidence kicker/title/status) visible.
   * Without JS, full caption text remains readable in the document.
   */
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
      var rest = qsa(
        ".eng-evidence-card__detail, .eng-evidence-card__missing",
        card
      );
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

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var map = qs("[data-eng-map]");
    if (map) initMap(map);

    qsa("[data-eng-cycle]").forEach(initCycle);
    qsa("[data-eng-ba]").forEach(initBeforeAfter);
    qsa("[data-eng-ladder]").forEach(initLadder);
    qsa("[data-eng-diag]").forEach(initDiag);
    initSignalPath();
    initHeroLoop();
    initOrientationSync();
    initFigureDisclosures();
  });
})();
