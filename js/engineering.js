/**
 * Engineering page — accordion architecture + cycle stage switchers.
 * Without JS, native <details> remain fully usable.
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

  function initCycle(root) {
    /* DBTL stages stay stacked in the document. Stage links are in-page jumps. */
    var live = qs("[data-eng-stage-live]", root);
    if (live) live.hidden = true;
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

  var suppressExclusive = false;

  function isAccordionDetails(node) {
    return node && node.tagName === "DETAILS" && node.classList && node.classList.contains("eng-acc");
  }

  function openAncestors(el) {
    var node = el;
    while (node && node !== document.body) {
      if (isAccordionDetails(node)) node.open = true;
      node = node.parentElement;
    }
  }

  function closeOtherStreams(keep) {
    qsa(".eng-acc--stream").forEach(function (acc) {
      if (acc !== keep) acc.open = false;
    });
  }

  function closeSiblingCycles(keep) {
    var parent = keep.parentElement;
    if (!parent) return;
    Array.prototype.forEach.call(parent.children, function (el) {
      if (el !== keep && el.hasAttribute && el.hasAttribute("data-eng-cycle-acc")) {
        el.open = false;
      }
    });
  }

  function closeAllAccordions() {
    qsa(".eng-acc--stream, .eng-acc--group, .eng-acc--cycle, .eng-acc--log").forEach(function (acc) {
      acc.open = false;
    });
  }

  function initAccordion() {
    /* Cycle and stream records are visible articles. Remaining details are figure/evidence notes. */
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
  };

  function syncFromHash() {
    var hash = (location.hash || "").replace(/^#/, "");
    if (!hash) return;
    var mapped = HASH_OPEN[hash] || hash;
    var target = document.getElementById(mapped) || document.getElementById(hash);
    if (!target) return;

    suppressExclusive = true;

    var cycleAcc = null;
    if (target.hasAttribute && target.hasAttribute("data-eng-cycle-acc")) {
      cycleAcc = target;
    } else if (target.closest) {
      cycleAcc = target.closest("[data-eng-cycle-acc]");
    }
    if (cycleAcc) {
      cycleAcc.open = true;
    }

    openAncestors(target);

    suppressExclusive = false;

    window.requestAnimationFrame(function () {
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ block: "start" });
      }
    });
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    qsa("[data-eng-cycle]").forEach(initCycle);
    qsa("[data-eng-ba]").forEach(initBeforeAfter);
    qsa("[data-eng-ladder]").forEach(initLadder);
    qsa("[data-eng-diag]").forEach(initDiag);
    initOrientationSync();
    initFigureDisclosures();
    initAccordion();
    initGlanceThumbs();
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
  });
})();
