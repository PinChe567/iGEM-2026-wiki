/**
 * AeroSense Learning Lab — personal dashboard.
 * Reads aerosense.learn.v2 in this browser only. No class averages.
 */
(function () {
  "use strict";

  var STATUS_LABELS = {
    "not-started": "Not started",
    "in-progress": "In progress",
    completed: "Completed",
  };

  var CHAIN = [
    { label: "odor molecule", moduleId: "01" },
    { label: "receptor", moduleId: "01" },
    { label: "fluorescence", moduleId: "03" },
    { label: "measurement", moduleId: "04" },
    { label: "pattern", moduleId: "04" },
    { label: "risk screening", moduleId: "02" },
    { label: "human decision", moduleId: "05" },
  ];

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function assetRoot() {
    var raw = document.body.getAttribute("data-asset-root") || "";
    if (!raw) return "";
    return raw.charAt(raw.length - 1) === "/" ? raw : raw + "/";
  }

  function withRoot(path) {
    if (!path) return assetRoot();
    if (path.charAt(0) === "#" || path.charAt(0) === "/" || /^[a-z]+:/i.test(path)) return path;
    return assetRoot() + path;
  }

  function statusOf(rec) {
    if (rec && rec.completed) return "completed";
    return (rec && rec.status) || "not-started";
  }

  function formatPct(n) {
    return n == null ? "—" : n + "%";
  }

  function formatDelta(delta) {
    if (delta > 0) return "+" + delta + " percentage points";
    if (delta < 0) return "−" + Math.abs(delta) + " percentage points";
    return "0 percentage points";
  }

  function barWidth(n) {
    if (n == null) return "0%";
    if (n < 0) return "0%";
    if (n > 100) return "100%";
    return n + "%";
  }

  function renderJourney(modules, store, state) {
    var cards = modules
      .map(function (mod) {
        var rec = store.getModule(state, mod.id);
        var status = statusOf(rec);
        return (
          '<li>' +
          '<a class="lp-card" href="' +
          escapeHtml(withRoot(mod.href)) +
          '">' +
          '<span class="lp-card__index">' +
          escapeHtml(mod.number) +
          " · " +
          escapeHtml(mod.category) +
          "</span>" +
          "<h3>" +
          escapeHtml(mod.shortTitle) +
          "</h3>" +
          '<p class="lp-card__title">' +
          escapeHtml(mod.title) +
          "</p>" +
          '<p class="learn-status" data-status="' +
          status +
          '">' +
          '<span class="learn-status__mark" aria-hidden="true"></span>' +
          '<span class="learn-status__text">' +
          escapeHtml(STATUS_LABELS[status]) +
          "</span></p></a></li>"
        );
      })
      .join("");
    return (
      '<section class="lp-section" id="your-journey">' +
      '<p class="learn-kicker">Section 1</p>' +
      "<h2>Your journey</h2>" +
      "<p>Five modules. Status is for this browser only.</p>" +
      '<ol class="lp-cards">' +
      cards +
      "</ol></section>"
    );
  }

  function scoreCell(kind, score) {
    var label = kind === "pre" ? "pre-test" : "post-test";
    return (
      '<div class="lp-chart__bar lp-chart__bar--' +
      kind +
      '">' +
      '<span class="lp-chart__track" aria-hidden="true"><span class="lp-chart__fill" style="width:' +
      barWidth(score) +
      '"></span></span>' +
      "<span>" +
      formatPct(score) +
      '<span class="visually-hidden"> ' +
      label +
      "</span></span></div>"
    );
  }

  function renderScoreChart(modules, store, state) {
    var anyScore = modules.some(function (mod) {
      var rec = store.getModule(state, mod.id);
      return rec.preScore != null || rec.postScore != null;
    });
    var cards = modules
      .map(function (mod) {
        var rec = store.getModule(state, mod.id);
        return (
          '<article class="lp-score">' +
          "<h3>" +
          escapeHtml(mod.number + " · " + mod.shortTitle) +
          "</h3>" +
          '<p class="lp-score__label">Pre-test</p>' +
          scoreCell("pre", rec.preScore) +
          '<p class="lp-score__label">Post-test</p>' +
          scoreCell("post", rec.postScore) +
          "</article>"
        );
      })
      .join("");
    var empty = anyScore
      ? ""
      : '<p class="lp-empty">No pre-test or post-test scores are stored in this browser yet.</p>';
    return (
      '<section class="lp-section" id="score-change">' +
      '<p class="learn-kicker">Section 2</p>' +
      "<h2>Your score change</h2>" +
      "<p>Pre-test and post-test percentages for the same module, on a 0–100% scale. This is this browser’s record, not a class average.</p>" +
      empty +
      '<figure class="lp-chart">' +
      "<figcaption>Outlined bar is pre-test. Solid bar is post-test. The number beside each bar is the same value.</figcaption>" +
      '<div class="lp-scores">' +
      cards +
      "</div></figure></section>"
    );
  }

  function renderGain(modules, store, state) {
    var items = modules
      .map(function (mod) {
        var rec = store.getModule(state, mod.id);
        var ready = rec.preScore != null && rec.postScore != null;
        var body = ready
          ? formatDelta(rec.postScore - rec.preScore)
          : "Not enough scores (needs both a pre-test and a post-test).";
        return (
          "<li><span>" +
          escapeHtml(mod.number + " · " + mod.shortTitle) +
          "</span><strong>" +
          escapeHtml(body) +
          "</strong></li>"
        );
      })
      .join("");
    return (
      '<section class="lp-section" id="knowledge-gain">' +
      '<p class="learn-kicker">Section 3</p>' +
      "<h2>Knowledge gain</h2>" +
      "<p>Knowledge gain is post-test percentage minus pre-test percentage for the same module in this browser. It is not a claim that anyone became “smarter,” and it is not a published educational outcome.</p>" +
      '<ul class="lp-gain">' +
      items +
      "</ul></section>"
    );
  }

  function renderReflections(modules, store, state) {
    var blocks = modules
      .map(function (mod) {
        var rec = store.getModule(state, mod.id);
        var text = rec.reflection && String(rec.reflection).trim();
        var body = text
          ? "<blockquote><p>" + escapeHtml(text) + "</p></blockquote>"
          : '<p class="lp-empty">No reflection saved for this module.</p>';
        return (
          '<article class="lp-note">' +
          "<h3>" +
          escapeHtml(mod.number + " · " + mod.shortTitle) +
          "</h3>" +
          body +
          "</article>"
        );
      })
      .join("");
    return (
      '<section class="lp-section" id="what-changed">' +
      '<p class="learn-kicker">Section 4</p>' +
      "<h2>What changed?</h2>" +
      "<p>Reflections you typed in a module. Stored on this device. They stay here unless this page is later connected to an approved data-collection backend.</p>" +
      blocks +
      '<p class="lp-local">Stored on this device.</p></section>'
    );
  }

  function renderChain(modules, store, state) {
    var byId = {};
    modules.forEach(function (mod) {
      byId[mod.id] = mod;
    });
    var completed = store.completedCount(state);
    var nodes = CHAIN.map(function (node, i) {
      var mod = byId[node.moduleId];
      var rec = store.getModule(state, node.moduleId);
      var status = statusOf(rec);
      var arrow =
        i === 0
          ? ""
          : '<li class="lp-chain__arrow" aria-hidden="true">→</li>';
      return (
        arrow +
        "<li>" +
        '<a class="lp-node" data-status="' +
        status +
        '" href="' +
        escapeHtml(withRoot(mod.href)) +
        '">' +
        '<span class="lp-node__label">' +
        escapeHtml(node.label) +
        "</span>" +
        '<span class="lp-node__mod">Module ' +
        escapeHtml(mod.number) +
        " · " +
        escapeHtml(STATUS_LABELS[status]) +
        "</span></a></li>"
      );
    }).join("");
    var payoff =
      completed === 5
        ? "<p>You completed the five modules, so this is the whole chain from odor molecule to human decision.</p>"
        : "<p>Each node opens the module that teaches that step. The chain is complete when all five modules are marked completed.</p>";
    return (
      '<section class="lp-section" id="concept-map">' +
      '<p class="learn-kicker">Section 5</p>' +
      "<h2>Concept map</h2>" +
      payoff +
      '<ol class="lp-chain" aria-label="From odor molecule to human decision">' +
      nodes +
      "</ol></section>"
    );
  }

  function renderReset() {
    return (
      '<section class="lp-section" id="reset-progress">' +
      '<p class="learn-kicker">Section 6</p>' +
      "<h2>Reset</h2>" +
      "<p>Clear this browser’s Learning Lab record: module status, pre/post answers, reflections, QC choices, and local feedback. This does not contact a server and cannot undo itself.</p>" +
      '<button type="button" class="btn btn--secondary" data-reset-open>Reset my learning progress</button>' +
      '<p class="lp-reset-live" data-reset-live aria-live="polite"></p>' +
      '<dialog class="lp-reset" id="lp-reset-dialog" aria-labelledby="lp-reset-title">' +
      '<div class="lp-reset__panel">' +
      '<h3 id="lp-reset-title">Reset this browser’s learning progress?</h3>' +
      "<p>This will erase scores, reflections, and other Learning Lab notes stored on this device. Other people and other browsers are not affected. This cannot be undone.</p>" +
      '<div class="lp-reset__actions">' +
      '<button type="button" class="btn btn--primary" data-reset-cancel>Cancel</button>' +
      '<button type="button" class="btn btn--secondary" data-reset-confirm>Reset my learning progress</button>' +
      "</div></div></dialog></section>"
    );
  }

  function renderPage(modules, store, state) {
    var count = store.completedCount(state);
    return (
      '<p class="lp-banner">Personal record · this browser only · not a published learning outcome · not a class average</p>' +
      "<p>Completed in this browser: <strong>" +
      count +
      " of 5</strong> modules.</p>" +
      renderJourney(modules, store, state) +
      renderScoreChart(modules, store, state) +
      renderGain(modules, store, state) +
      renderReflections(modules, store, state) +
      renderChain(modules, store, state) +
      renderReset()
    );
  }

  function bindReset(rootEl, store, paint) {
    var dialog = qs("#lp-reset-dialog", rootEl);
    var openBtn = qs("[data-reset-open]", rootEl);
    var cancelBtn = qs("[data-reset-cancel]", rootEl);
    var confirmBtn = qs("[data-reset-confirm]", rootEl);
    var live = qs("[data-reset-live]", rootEl);
    if (!dialog || !openBtn) return;

    function closeDialog() {
      if (typeof dialog.close === "function" && dialog.open) dialog.close();
      else dialog.removeAttribute("open");
      openBtn.focus();
    }

    function openDialog() {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      if (cancelBtn) cancelBtn.focus();
    }

    openBtn.addEventListener("click", openDialog);
    if (cancelBtn) cancelBtn.addEventListener("click", closeDialog);
    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeDialog();
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeDialog();
    });
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        store.state = store.resetAll();
        closeDialog();
        paint();
        var note = qs("[data-reset-live]");
        if (note) {
          note.textContent = "Learning progress on this device was cleared.";
        } else if (live) {
          live.textContent = "Learning progress on this device was cleared.";
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var Learn = window.AerosenseLearn;
    var mount = qs("[data-progress-root]");
    if (!Learn || !Learn.STORAGE || !Learn.MODULES || !mount) return;

    var store = Learn.STORAGE;
    var modules = Learn.MODULES;

    function paint() {
      store.state = store.read();
      mount.innerHTML = renderPage(modules, store, store.state);
      bindReset(mount, store, paint);
    }

    paint();
  });
})();
