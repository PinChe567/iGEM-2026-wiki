/**
 * Experiments page — navigation, scrollspy, print, and copy.
 * Progressive enhancement only. Protocols remain in the HTML without JS.
 * TOC spy for .page-toc also runs in main.js.
 */
(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("page-experiments")) return;

  var reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduceMotion = reduceMotionMQ.matches;
  if (reduceMotionMQ.addEventListener) {
    reduceMotionMQ.addEventListener("change", function (e) {
      reduceMotion = e.matches;
    });
  } else if (reduceMotionMQ.addListener) {
    reduceMotionMQ.addListener(function (e) {
      reduceMotion = e.matches;
    });
  }

  var PROTOCOL_IDS = [
    "molecular-cloning",
    "cell-culture",
    "transfection",
    "stable-selection",
    "expression-validation",
    "calcium-imaging",
    "data-analysis"
  ];

  var SPY_IDS = ["workflow"]
    .concat(PROTOCOL_IDS)
    .concat(["safety", "references"]);

  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll("[data-exp-flow] a[href^='#'], [data-exp-glance] a[href^='#']")
  );

  var live = document.querySelector("[data-exp-live]");

  function announce(message) {
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () {
      live.textContent = message;
    }, 20);
  }

  function scrollBehavior() {
    return reduceMotion ? "auto" : "smooth";
  }

  function headerOffsetPx() {
    var header = document.querySelector(".site-header");
    var h = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    return h + 24;
  }

  function scrollToId(id, behavior) {
    var el = document.getElementById(id);
    if (!el) return false;
    var top = window.pageYOffset + el.getBoundingClientRect().top - headerOffsetPx();
    window.scrollTo({
      top: Math.max(0, top),
      behavior: behavior || scrollBehavior()
    });
    return true;
  }

  function markNav(id) {
    navLinks.forEach(function (link) {
      var href = link.getAttribute("href");
      if (href === "#" + id && PROTOCOL_IDS.indexOf(id) !== -1) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function setHash(id) {
    var next = "#" + id;
    if (location.hash === next) return;
    if (history.pushState) {
      history.pushState(null, "", next);
    } else {
      location.hash = id;
    }
  }

  /* A. Same-page hash links: smooth or instant scroll, hash in the URL, history intact. */
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest("a[href^='#']") : null;
    if (!a || a.getAttribute("target") === "_blank") return;
    var href = a.getAttribute("href");
    if (!href || href === "#") return;
    var id;
    try {
      id = decodeURIComponent(href.slice(1));
    } catch (err) {
      return;
    }
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    scrollToId(id);
    setHash(id);
    markNav(id);
  });

  window.addEventListener("popstate", function () {
    var id = location.hash ? location.hash.slice(1) : "";
    if (id && document.getElementById(id)) {
      scrollToId(id, "auto");
      markNav(id);
    }
  });

  if (location.hash) {
    var initial = location.hash.slice(1);
    if (PROTOCOL_IDS.indexOf(initial) !== -1) markNav(initial);
  }

  /* B. Scrollspy — IntersectionObserver, no scroll-loop. */
  if ("IntersectionObserver" in window) {
    var visible = {};
    var spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting;
        });
        var current = null;
        SPY_IDS.forEach(function (id) {
          if (visible[id]) current = id;
        });
        if (current) markNav(current);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
    );

    SPY_IDS.forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spyObserver.observe(section);
    });
  }

  /* TOC open only when the two-column layout is actually used. */
  var toc = document.querySelector(".page-toc");
  var tocWide = window.matchMedia("(min-width: 1100px)");
  function syncToc() {
    if (!toc) return;
    if (tocWide.matches) toc.setAttribute("open", "");
    else toc.removeAttribute("open");
  }
  document.addEventListener("DOMContentLoaded", function () {
    syncToc();
    window.addEventListener("resize", syncToc);
    if (tocWide.addEventListener) tocWide.addEventListener("change", syncToc);
    else if (tocWide.addListener) tocWide.addListener(syncToc);
  });

  /* D. Arrow keys scroll a focused table region without trapping Tab. */
  Array.prototype.forEach.call(
    document.querySelectorAll(".page-experiments .table-scroll"),
    function (region) {
      region.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        if (region.scrollWidth <= region.clientWidth + 1) return;
        e.preventDefault();
        region.scrollLeft += e.key === "ArrowRight" ? 72 : -72;
      });
    }
  );

  /* E. Print — button is hidden until this runs. */
  var printBtn = document.querySelector("[data-exp-print]");
  if (printBtn && typeof window.print === "function") {
    printBtn.hidden = false;
    printBtn.addEventListener("click", function () {
      window.print();
    });
  }

  /* F. Copy selected parameter tables as plain text, not markup. */
  function tableToText(table) {
    var lines = [];
    Array.prototype.forEach.call(table.querySelectorAll("tr"), function (tr) {
      var cells = [];
      Array.prototype.forEach.call(tr.querySelectorAll("th, td"), function (cell) {
        cells.push(cell.textContent.replace(/\s+/g, " ").trim());
      });
      if (cells.length) lines.push(cells.join("\t"));
    });
    return lines.join("\n");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      document.body.removeChild(ta);
      if (ok) resolve();
      else reject(new Error("copy failed"));
    });
  }

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-exp-copy-block]"),
    function (block) {
      var btn = block.querySelector("[data-exp-copy]");
      var table = block.querySelector("table");
      var region = block.querySelector(".table-scroll");
      if (!btn || !table) return;
      btn.hidden = false;
      var label = region && region.getAttribute("aria-label")
        ? region.getAttribute("aria-label").replace(/\.?\s*Scroll horizontally.*$/i, "")
        : "parameters";
      btn.setAttribute("aria-label", "Copy " + label + " as text");
      btn.addEventListener("click", function () {
        var text = tableToText(table);
        if (!text) {
          announce("Nothing to copy.");
          return;
        }
        copyText(text).then(
          function () {
            announce("Copied " + label + " as text.");
          },
          function () {
            announce("Copy failed. Select the table and copy it manually.");
          }
        );
      });
    }
  );
})();
