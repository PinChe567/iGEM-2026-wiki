/**
 * Contribution explorer, matrix tally, and development-only integrity checks.
 * Progressive enhancement: the page remains readable without this file.
 */
(function () {
  "use strict";

  var ROLES = ["all", "wet-lab", "hardware", "data", "model", "hp"];

  var COPY = {
    all:
      "Showing all reusable packages. Biology, measurement hardware, the data contract, the neuromorphic model, and human-practices knowledge are equally available.",
    "wet-lab":
      "For Wet Lab teams: start with the OR/Orco adaptation map, the VUAA1 functional-assay protocol, the HEK293T transfection protocol, and the minimum experimental metadata in the data contract.",
    hardware:
      "For Hardware teams: start with the weak-fluorescence reader, calibration workflow, FDM/DLIA implementation and troubleshooting notes.",
    data:
      "For Data teams: start with the shared measurement contract — experimental metadata, hardware metadata, and model-ready output — then the planned data dictionary and example datasets.",
    model:
      "For Model teams: start with the baseline comparison ladder, AL-inspired processing, MB-inspired sparse projection, and the model-ready data contract.",
    hp:
      "For Human Practices teams: start with the stakeholder-to-design traceability format: Stakeholder → Observation → Insight → Design decision → Evidence needed → Re-evaluation.",
  };

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function validRole(role) {
    return ROLES.indexOf(role) !== -1 ? role : "all";
  }

  function hasAudience(el, role) {
    if (role === "all") return true;
    var raw = el.getAttribute("data-audience") || "";
    if (!raw) return false;
    return raw.split(",").some(function (part) {
      return part.trim() === role;
    });
  }

  function readRoleFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var role = params.get("role");
      if (role) return validRole(role);
    } catch (e) {
      /* ignore */
    }
    return "all";
  }

  function writeRoleToUrl(role) {
    try {
      var url = new URL(window.location.href);
      if (role === "all") url.searchParams.delete("role");
      else url.searchParams.set("role", role);
      var next = url.pathname + url.search + url.hash;
      if (next !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.replaceState(null, "", next);
      }
    } catch (e) {
      /* ignore */
    }
  }

  function setTally(name, value) {
    qsa("[data-tally=\"" + name + "\"]").forEach(function (el) {
      el.textContent = String(value);
    });
  }

  function updateMatrixTally(role) {
    var rows = qsa("[data-contrib-matrix] tbody tr[data-audience]");
    if (!rows.length) return;

    var visible = rows.filter(function (row) {
      return hasAudience(row, role);
    });

    setTally("open-total", visible.length);
    setTally(
      "released",
      visible.filter(function (row) {
        return row.getAttribute("data-matrix-open") === "released";
      }).length
    );

    var reproApplicable = visible.filter(function (row) {
      return row.getAttribute("data-matrix-reproduced") !== "na";
    });
    setTally("reproduced-total", reproApplicable.length);
    setTally(
      "reproduced",
      reproApplicable.filter(function (row) {
        return row.getAttribute("data-matrix-reproduced") === "demonstrated";
      }).length
    );

    var validApplicable = visible.filter(function (row) {
      return row.getAttribute("data-matrix-validated") !== "na";
    });
    setTally("validated-total", validApplicable.length);
    setTally(
      "validated",
      validApplicable.filter(function (row) {
        return row.getAttribute("data-matrix-validated") === "demonstrated";
      }).length
    );
  }

  function isPlaceholderHref(href) {
    if (href == null) return true;
    var value = String(href).trim();
    return value === "" || value === "#" || value === "#!";
  }

  function isPublicResourceUrl(href) {
    if (isPlaceholderHref(href)) return false;
    try {
      var url = new URL(href, window.location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:") return false;
      if (url.hash && url.pathname === window.location.pathname && !url.search) {
        /* in-page hash only — documentation location, not a file release */
        if (href.charAt(0) === "#") return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function isEvidenceDestination(href) {
    if (isPlaceholderHref(href)) return false;
    try {
      var url = new URL(href, window.location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:" && url.protocol !== "file:") {
        return false;
      }
      return url.pathname !== "" || url.hash.length > 1;
    } catch (e) {
      return false;
    }
  }

  function collectCommentTodos(root) {
    var found = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf("FREEZE-TODO") !== -1) {
        found.push(node.nodeValue.replace(/\s+/g, " ").trim());
      }
    }
    return found;
  }

  function isDevIntegrity() {
    try {
      if (/\bcontrib-debug=1\b/.test(window.location.search)) return true;
      if (window.location.protocol === "file:") return true;
      var host = window.location.hostname;
      return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
    } catch (e) {
      return false;
    }
  }

  function initIntegrityChecker() {
    if (!isDevIntegrity()) return;

    var page = qs(".page-contribution") || document.body;
    var issues = [];

    qsa(
      ".contrib-pkg[data-contrib-state=\"validated\"], .contrib-rcard [data-contrib-state=\"validated\"], [data-contrib-matrix] [data-contrib-state=\"validated\"], [data-matrix-validated=\"validated\"], [data-matrix-validated=\"demonstrated\"]"
    ).forEach(function (el) {
      var dest = el.getAttribute("data-evidence") || el.getAttribute("data-evidence-href");
      if (!dest) {
        var host = el.closest("tr, .contrib-pkg, .contrib-rcard") || el;
        var evidenceLink = qs("a[data-evidence], [data-evidence]", host);
        dest = evidenceLink
          ? evidenceLink.getAttribute("data-evidence") || evidenceLink.getAttribute("data-evidence-href") || evidenceLink.getAttribute("href")
          : "";
      }
      if (!isEvidenceDestination(dest)) {
        issues.push("Validated/demonstrated item has no evidence destination: " + (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80));
      }
    });

    qsa(
      ".contrib-pkg[data-contrib-state=\"released\"], .contrib-rcard [data-contrib-state=\"released\"], [data-matrix-open=\"released\"]"
    ).forEach(function (el) {
      var href = el.getAttribute("data-resource") || el.getAttribute("data-resource-href");
      if (!href) {
        var resourceLink = qs("a[data-resource]", el);
        href = resourceLink ? resourceLink.getAttribute("href") : "";
      }
      if (!isPublicResourceUrl(href)) {
        issues.push("Released item has no public resource URL: " + (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80));
      }
    });

    qsa("a[href]", page).forEach(function (link) {
      var href = link.getAttribute("href");
      if (isPlaceholderHref(href)) {
        issues.push("Placeholder href=\"#\" (or empty) on: " + (link.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80));
      }
    });

    collectCommentTodos(page).forEach(function (todo) {
      issues.push(todo);
    });

    if (!issues.length) {
      console.info("[contrib-integrity] No status/evidence issues on this page.");
      return;
    }

    console.groupCollapsed("[contrib-integrity] " + issues.length + " development warning(s) — not shown to visitors");
    issues.forEach(function (issue) {
      console.warn(issue);
    });
    console.groupEnd();
  }

  function initExplorer() {
    var root = qs("[data-contrib-explorer]");
    var page = document.querySelector(".page-contribution") || document.body;

    if (!root) {
      updateMatrixTally("all");
      return;
    }

    var chooser = qs(".contrib-chooser", root);
    var controls = qsa("[data-audience-filter]", chooser || root);
    var resetBtn = qs("[data-explorer-reset] [data-audience-filter]", root);
    var live = qs("[data-explorer-live]", root);
    var resetWrap = qs("[data-explorer-reset]", root);
    var targets = qsa("[data-audience]");

    if (!controls.length) {
      updateMatrixTally("all");
      return;
    }

    page.classList.add("is-explorer-ready");

    function apply(role, fromUser) {
      role = validRole(role);

      page.setAttribute("data-explorer-role", role);
      page.classList.toggle("is-explorer-filtered", role !== "all");

      controls.forEach(function (ctrl) {
        var on = ctrl.getAttribute("data-audience-filter") === role;
        ctrl.setAttribute("aria-pressed", on ? "true" : "false");
        ctrl.classList.toggle("is-active", on);
        if (on) ctrl.setAttribute("aria-current", "true");
        else ctrl.removeAttribute("aria-current");
      });

      targets.forEach(function (el) {
        var match = hasAudience(el, role);
        el.classList.toggle("is-priority", role !== "all" && match);
        el.classList.toggle("is-muted", role !== "all" && !match);
        var spot = el.getAttribute("data-spotlight");
        el.classList.toggle("is-spotlight", role !== "all" && !!spot && spot === role);
      });

      if (live) live.textContent = COPY[role] || COPY.all;
      if (resetWrap) resetWrap.hidden = role === "all";
      updateMatrixTally(role);

      if (fromUser) writeRoleToUrl(role);
    }

    function activate(ctrl) {
      apply(validRole(ctrl.getAttribute("data-audience-filter")), true);
    }

    function bindControl(ctrl) {
      if (!ctrl) return;
      ctrl.setAttribute("role", "button");
      ctrl.addEventListener("click", function (event) {
        event.preventDefault();
        activate(ctrl);
      });
      ctrl.addEventListener("keydown", function (event) {
        if (event.key !== " " && event.key !== "Spacebar") return;
        event.preventDefault();
        activate(ctrl);
      });
    }

    controls.forEach(bindControl);
    bindControl(resetBtn);

    if (chooser) {
      chooser.addEventListener("keydown", function (event) {
        var keys = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1, Home: "home", End: "end" };
        if (!(event.key in keys)) return;
        var group = event.target.closest("[data-audience-filter]");
        if (!group || controls.indexOf(group) === -1) return;
        event.preventDefault();
        var i = controls.indexOf(group);
        var next;
        if (event.key === "Home") next = controls[0];
        else if (event.key === "End") next = controls[controls.length - 1];
        else next = controls[(i + keys[event.key] + controls.length) % controls.length];
        if (!next) return;
        next.focus();
        activate(next);
      });
    }

    apply(readRoleFromUrl(), false);
  }

  function initPrintExpand() {
    var article = qs(".page-article");
    if (!article) return;

    var opened = [];
    var printing = false;

    function expand() {
      if (printing) return;
      printing = true;
      opened = [];
      qsa("details:not([open])", article).forEach(function (el) {
        el.setAttribute("open", "");
        opened.push(el);
      });
    }

    function restore() {
      if (!printing) return;
      opened.forEach(function (el) {
        el.removeAttribute("open");
      });
      opened = [];
      printing = false;
    }

    window.addEventListener("beforeprint", expand);
    window.addEventListener("afterprint", restore);

    if (typeof window.matchMedia === "function") {
      var mq = window.matchMedia("print");
      if (mq.addEventListener) {
        mq.addEventListener("change", function (event) {
          if (event.matches) expand();
          else restore();
        });
      }
    }
  }

  function boot() {
    initExplorer();
    initPrintExpand();
    initIntegrityChecker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
