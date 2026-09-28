/**
 * Model page — fly map + data pipeline interactions.
 * Keyboard/touch first. Lazy-init via IntersectionObserver.
 * Respects prefers-reduced-motion. No external dependencies.
 */
(function () {
  "use strict";

  var STAGES = {
    input: {
      title: "Sensor / encoded input",
      biology:
        "In the fly, odor information originates at olfactory receptor neurons and is formatted before higher centers act on it. On this page the sensor array is an engineering analogue of that sensory front end — not a claim of anatomical identity.",
      computation:
        "KT Batch1–3 metal-oxide exposures are converted to delta-peak / steady-state feature vectors, median-imputed, then reduced by PCA fit on the training split only.",
      params: "14 sensors · delta feature suite · pca_dim = 8 (baseline)",
      robustness:
        "Hypothesis: starting from relative, baseline-referenced features may emphasize pattern over absolute scale — a possible ingredient for later robustness tests, not a demonstrated drift fix.",
    },
    pn: {
      title: "PN-like units",
      biology:
        "Projection neurons relay olfactory information from the antennal lobe toward the mushroom body.",
      computation:
        "Each principal-component axis is discretized into pn_bins = 20 bins; a sample activates one PN spike index per axis, forming a sparse combinatorial PN pattern.",
      params: "pca_dim = 8 · pn_bins = 20",
      robustness:
        "Hypothesis: a combinatorial PN code may preserve relative structure across inputs even when absolute sensor amplitudes shift — to be tested under cross-batch evaluation, not assumed.",
    },
    expansion: {
      title: "Sparse random PN→KC expansion",
      biology:
        "In Drosophila, Kenyon cells receive sparse, largely random PN→KC connectivity — a divergent expansion into a larger population.",
      computation:
        "PN units project to kc_num = 1000 Kenyon cells through fixed-weight random synapses with connection probability p_pn_kc = 0.05.",
      params: "kc_num = 1000 · p_pn_kc = 0.05",
      robustness:
        "Hypothesis: random expansion can separate overlapping sensor patterns in a higher-dimensional space (the expand step of expand–sparsify–learn), which may help later classification under distribution shift — unvalidated for our drift setting until cross-batch results exist.",
    },
    apl: {
      title: "APL-mediated global inhibition",
      biology:
        "The anterior paired lateral (APL) neuron provides global feedback inhibition that helps keep Kenyon-cell activity sparse and decorrelated.",
      computation:
        "A global inhibitory pathway parameterized by w_apl_kc and lateral feeds back onto all KCs, analogous to APL. An intrinsic-plasticity term (ip) can further adapt KC thresholds.",
      params: "w_apl_kc · lateral · ip",
      robustness:
        "Hypothesis: enforcing sparse, decorrelated KC codes may reduce sensitivity to correlated sensor drift shared across channels — a mechanistic conjecture, not a measured result on this page.",
    },
    kc: {
      title: "Sparse KC population",
      biology:
        "Kenyon cells form a large mushroom-body population whose activity is typically sparse for a given odor, supporting discriminable representations.",
      computation:
        "After expansion and APL-like inhibition, only a minority of the 1000 KC units fire strongly for a given exposure — the diagram lights a small active subset to illustrate that sparsity.",
      params: "kc_num = 1000 · sparsity shaped by inhibition + ip",
      robustness:
        "Hypothesis: sparse codes may remain separable when inputs slowly warp, because odor identity lives in which KCs fire rather than in raw sensor voltages — still an open evaluation question for cross-batch drift.",
    },
    mbon: {
      title: "KC→MBON learned readout",
      biology:
        "MBONs read Kenyon-cell activity through synapses shaped by learning and help link odor representations to meaning or action.",
      computation:
        "All-to-all excitatory KC→MBON weights evolve under an event-driven, pair-based STDP rule (learning_rate). Only these readout weights are plastic during the reported training cycles.",
      params: "w_kc_mbon = 10 (baseline) · learning_rate = 0.025 · cycles = 300",
      robustness:
        "Hypothesis: fixing the random expansion while learning only the readout may adapt class boundaries without re-fitting an explicit drift model — not yet evidenced by a temporal/cross-batch test here.",
    },
    output: {
      title: "Gas / odor class",
      biology:
        "In the fly, MBON activity contributes to odor-guided choices. Here the endpoint is a gas-class label for an e-nose exposure.",
      computation:
        "Held-out exposures are classified by taking the MBON unit with the strongest response (argmax), scored with macro-averaged precision, recall, and F1.",
      params: "test_iterations = 50 · macro F1 = 0.868 (pooled split · seed 100)",
      robustness:
        "The reported macro F1 is a pooled random-split baseline — not a cross-batch drift validation. Class decisions under sensor aging remain a planned evaluation.",
    },
  };

  var STAGE_ORDER = ["input", "pn", "expansion", "apl", "kc", "mbon", "output"];

  var PIPE_STEPS = {
    raw: {
      title: "Raw KT recording",
      body:
        "A multi-channel metal-oxide time series for one experimental run on the KT Batch1–3 corpus. Recordings alternate clean-air and gas-exposure segments before any feature is computed.",
    },
    dilute: {
      title: "Dilute baseline",
      body:
        "The Dilute segment is clean air. The baseline for the following Test is the median of this Dilute segment’s final readings — a local reference, not a global dataset mean.",
    },
    test: {
      title: "Test exposure",
      body:
        "The Test segment is the gas exposure (one of SO₂, NO₂, toluene, ethanol, or NH₃, at a recorded concentration/humidity condition). All delta features are computed from this segment relative to the preceding Dilute baseline.",
    },
    delta: {
      title: "Delta features",
      body:
        "Per sensor, extract signed delta-median, delta-steady, and delta-peak, plus baseline-relative counterparts. Across 14 sensors this yields the exposure’s feature vector. See the conceptual diagram below for definitions.",
    },
    impute: {
      title: "Missing-value handling",
      body:
        "Missing feature entries are median-imputed. Under the Leakage Guard, imputation statistics follow the training split — held-out data do not set those medians.",
    },
    pca: {
      title: "Train-only PCA",
      body:
        "PCA is fit exclusively on the training split (pca_dim = 8 in the v0 baseline), then applied to transform features. Test exposures are projected with that fixed train-fit — never used to refit PCA.",
    },
    bins: {
      title: "Discretization / PN bins",
      body:
        "Each principal-component axis is cut into pn_bins = 20 bins. A sample’s location on an axis selects one bin index — the PN-like unit that will spike for that axis.",
    },
    spikes: {
      title: "PN spike representation",
      body:
        "Activating one bin per PC axis produces a sparse combinatorial PN spike pattern — the network’s input code, analogous to glomerular / PN output in the fly motif.",
    },
    snn: {
      title: "SNN",
      body:
        "PN spikes drive the Brian2 PN→KC→APL→MBON network. Only KC→MBON synapses learn (STDP) during the reported training cycles. Continue in Inside the network and Training & Evaluation.",
    },
  };

  var PIPE_ORDER = [
    "raw",
    "dilute",
    "test",
    "delta",
    "impute",
    "pca",
    "bins",
    "spikes",
    "snn",
  ];

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function canHoverFine() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function isCompactLayout() {
    return window.matchMedia("(max-width: 1099px)").matches;
  }

  function renderPanel(root, stageId) {
    var data = STAGES[stageId];
    var panel = qs("[data-map-panel]", root);
    if (!panel || !data) return;

    panel.hidden = false;
    panel.dataset.activeStage = stageId;
    panel.innerHTML =
      '<h4 class="model-map__panel-title">' +
      data.title +
      "</h4>" +
      '<dl class="model-map__panel-grid">' +
      "<div><dt>Biological role</dt><dd>" +
      data.biology +
      "</dd></div>" +
      "<div><dt>Computational implementation</dt><dd>" +
      data.computation +
      "</dd></div>" +
      "<div><dt>Key parameter(s)</dt><dd><code>" +
      data.params +
      "</code></dd></div>" +
      "<div><dt>Why it may matter for robustness</dt><dd>" +
      data.robustness +
      "</dd></div>" +
      "</dl>";
  }

  function setActiveStage(root, stageId, opts) {
    opts = opts || {};
    qsa("[data-map-stage]", root).forEach(function (btn) {
      var on = btn.getAttribute("data-map-stage") === stageId;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
    });

    qsa("[data-map-node]", root).forEach(function (node) {
      node.classList.toggle(
        "is-active",
        node.getAttribute("data-map-node") === stageId
      );
    });

    root.setAttribute("data-active-stage", stageId);
    renderPanel(root, stageId);

    if (opts.focusPanel) {
      var panel = qs("[data-map-panel]", root);
      if (panel) {
        panel.setAttribute("tabindex", "-1");
        try {
          panel.focus({ preventScroll: true });
        } catch (err) {
          panel.focus();
        }
      }
    }
  }

  function setView(root, view) {
    root.setAttribute("data-map-view", view);
    qsa("[data-map-view]", root).forEach(function (btn) {
      var on = btn.getAttribute("data-map-view") === view;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function clearDemoClasses(root) {
    root.classList.remove(
      "is-demo-running",
      "is-demo-pulse-input",
      "is-demo-pulse-pn",
      "is-demo-pulse-expansion",
      "is-demo-pulse-apl",
      "is-demo-sparse",
      "is-demo-pulse-mbon",
      "is-demo-pulse-output",
      "is-demo-done"
    );
  }

  function setPanelLive(root, mode) {
    var panel = qs("[data-map-panel]", root);
    if (panel) panel.setAttribute("aria-live", mode);
  }

  function runDemo(root) {
    var play = qs("[data-map-play]", root);
    if (root.classList.contains("is-demo-running")) return;

    clearDemoClasses(root);

    if (prefersReducedMotion()) {
      root.classList.add("is-demo-sparse", "is-demo-done");
      setActiveStage(root, "kc");
      if (play) play.textContent = "Show sparse pattern";
      return;
    }

    var steps = [
      { cls: "is-demo-pulse-input", stage: "input", ms: 0 },
      { cls: "is-demo-pulse-pn", stage: "pn", ms: 550 },
      { cls: "is-demo-pulse-expansion", stage: "expansion", ms: 1100 },
      { cls: "is-demo-pulse-apl", stage: "apl", ms: 1650 },
      { cls: "is-demo-sparse", stage: "kc", ms: 2200 },
      { cls: "is-demo-pulse-mbon", stage: "mbon", ms: 2900 },
      { cls: "is-demo-pulse-output", stage: "output", ms: 3450 },
    ];

    root.classList.add("is-demo-running");
    setPanelLive(root, "off");
    if (play) {
      play.disabled = true;
      play.setAttribute("aria-busy", "true");
      play.textContent = "Running demo…";
    }

    var timers = [];
    root._mapDemoTimers = timers;

    steps.forEach(function (step) {
      timers.push(
        window.setTimeout(function () {
          root.classList.add(step.cls);
          setActiveStage(root, step.stage);
        }, step.ms)
      );
    });

    timers.push(
      window.setTimeout(function () {
        root.classList.remove("is-demo-running");
        root.classList.add("is-demo-done");
        setPanelLive(root, "polite");
        if (play) {
          play.disabled = false;
          play.removeAttribute("aria-busy");
          play.textContent = "Replay sparse-coding demo";
        }
      }, 4000)
    );
  }

  function stopDemo(root) {
    var timers = root._mapDemoTimers || [];
    timers.forEach(function (id) {
      window.clearTimeout(id);
    });
    root._mapDemoTimers = [];
    clearDemoClasses(root);
    setPanelLive(root, "polite");
    var play = qs("[data-map-play]", root);
    if (play) {
      play.disabled = false;
      play.removeAttribute("aria-busy");
      play.textContent = prefersReducedMotion()
        ? "Show sparse pattern"
        : "Play sparse-coding demo";
    }
  }

  function initMap(root) {
    if (root.getAttribute("data-map-ready") === "true") return;
    root.setAttribute("data-map-ready", "true");

    setView(root, "bio");
    setActiveStage(root, "pn");

    root.addEventListener("click", function (event) {
      var stageBtn = event.target.closest("[data-map-stage]");
      if (stageBtn && root.contains(stageBtn)) {
        setActiveStage(root, stageBtn.getAttribute("data-map-stage"), {
          focusPanel: isCompactLayout(),
        });
        return;
      }

      var viewBtn = event.target.closest("[data-map-view]");
      if (viewBtn && root.contains(viewBtn)) {
        setView(root, viewBtn.getAttribute("data-map-view"));
        return;
      }

      var playBtn = event.target.closest("[data-map-play]");
      if (playBtn && root.contains(playBtn)) {
        stopDemo(root);
        runDemo(root);
      }
    });

    /* Selection is click / Enter / Space / arrow keys — not mere focus (avoids tabbing rewriting the panel). */

    /* Hover highlights diagram only on fine pointers; selection stays click/tap/keyboard activate. */
    if (canHoverFine()) {
      root.addEventListener("mouseover", function (event) {
        var stageBtn = event.target.closest("[data-map-stage]");
        if (!stageBtn || !root.contains(stageBtn)) return;
        if (root.classList.contains("is-demo-running")) return;
        var stageId = stageBtn.getAttribute("data-map-stage");
        qsa("[data-map-node]", root).forEach(function (node) {
          node.classList.toggle(
            "is-hover",
            node.getAttribute("data-map-node") === stageId
          );
        });
      });

      root.addEventListener("mouseleave", function () {
        qsa("[data-map-node]", root).forEach(function (node) {
          node.classList.remove("is-hover");
        });
      });
    }

    root.addEventListener("keydown", function (event) {
      var stageBtn = event.target.closest("[data-map-stage]");
      if (!stageBtn || !root.contains(stageBtn)) return;

      var idx = STAGE_ORDER.indexOf(stageBtn.getAttribute("data-map-stage"));
      if (idx < 0) return;

      var next = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        next = STAGE_ORDER[Math.min(STAGE_ORDER.length - 1, idx + 1)];
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        next = STAGE_ORDER[Math.max(0, idx - 1)];
      } else if (event.key === "Home") {
        next = STAGE_ORDER[0];
      } else if (event.key === "End") {
        next = STAGE_ORDER[STAGE_ORDER.length - 1];
      }

      if (!next) return;
      event.preventDefault();
      var target = qs('[data-map-stage="' + next + '"]', root);
      if (target) {
        target.focus();
        setActiveStage(root, next);
      }
    });

    var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var onMotionChange = function () {
      stopDemo(root);
      if (motionQuery.matches) root.classList.add("is-demo-sparse");
    };
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", onMotionChange);
    } else if (motionQuery.addListener) {
      motionQuery.addListener(onMotionChange);
    }

    if (prefersReducedMotion()) {
      root.classList.add("is-demo-sparse");
      var play = qs("[data-map-play]", root);
      if (play) play.textContent = "Show sparse pattern";
    }
  }

  function renderPipePanel(root, stepId) {
    var data = PIPE_STEPS[stepId];
    var panel = qs("[data-pipe-panel]", root);
    if (!panel || !data) return;
    panel.innerHTML =
      '<h4 class="model-pipe__panel-title">' +
      data.title +
      "</h4><p>" +
      data.body +
      "</p>";
  }

  function setPipeStep(root, stepId) {
    root.setAttribute("data-active-step", stepId);
    qsa("[data-pipe-step]", root).forEach(function (btn) {
      var on = btn.getAttribute("data-pipe-step") === stepId;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
    });
    renderPipePanel(root, stepId);
  }

  function initPipe(root) {
    if (root.getAttribute("data-pipe-ready") === "true") return;
    root.setAttribute("data-pipe-ready", "true");

    setPipeStep(root, root.getAttribute("data-active-step") || "raw");

    root.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-pipe-step]");
      if (!btn || !root.contains(btn)) return;
      setPipeStep(root, btn.getAttribute("data-pipe-step"));
    });

    root.addEventListener("keydown", function (event) {
      var btn = event.target.closest("[data-pipe-step]");
      if (!btn || !root.contains(btn)) return;
      var idx = PIPE_ORDER.indexOf(btn.getAttribute("data-pipe-step"));
      if (idx < 0) return;
      var next = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        next = PIPE_ORDER[Math.min(PIPE_ORDER.length - 1, idx + 1)];
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        next = PIPE_ORDER[Math.max(0, idx - 1)];
      } else if (event.key === "Home") {
        next = PIPE_ORDER[0];
      } else if (event.key === "End") {
        next = PIPE_ORDER[PIPE_ORDER.length - 1];
      }
      if (!next) return;
      event.preventDefault();
      var target = qs('[data-pipe-step="' + next + '"]', root);
      if (target) {
        target.focus();
        setPipeStep(root, next);
      }
    });
  }

  function syncDisclose(details) {
    var open = details.open;
    details.setAttribute("aria-expanded", open ? "true" : "false");
    var summary = details.querySelector("summary");
    if (summary) summary.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function initDiscloses() {
    qsa(".page-model details.model-disclose, .page-model details.page-toc").forEach(
      function (details) {
        syncDisclose(details);
        details.addEventListener("toggle", function () {
          syncDisclose(details);
        });
      }
    );
  }

  function whenVisible(el, callback) {
    if (!("IntersectionObserver" in window)) {
      callback();
      return;
    }
    var once = false;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || once) return;
          once = true;
          io.disconnect();
          callback();
        });
      },
      { rootMargin: "120px 0px", threshold: 0.01 }
    );
    io.observe(el);
  }

  function init() {
    initDiscloses();

    qsa("[data-model-map]").forEach(function (root) {
      whenVisible(root, function () {
        initMap(root);
      });
    });

    qsa("[data-model-pipe]").forEach(function (root) {
      whenVisible(root, function () {
        initPipe(root);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
