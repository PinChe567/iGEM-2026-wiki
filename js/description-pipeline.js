/**
 * Description page — Sense → Read → Decode → Act panels
 * (functional system architecture, not team workstream hierarchy).
 * Click left ticks to switch the right-hand stage. No scroll-jacking.
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-desc-flow]");
  if (!root) return;

  var stages = Array.prototype.slice.call(root.querySelectorAll(".desc-flow__stage[data-layer]"));
  var signal = root.querySelector("[data-desc-signal]");
  var label = root.querySelector("[data-signal-label]");
  var ticks = Array.prototype.slice.call(root.querySelectorAll("[data-flow-tick]"));
  if (!stages.length) return;

  var LABELS = {
    sense: "VOC → biological fluorescence",
    read: "fluorescence → demodulated digital signal",
    decode: "receptor pattern → sparse representation",
    act: "pattern → risk-oriented decision",
  };

  var current = "";

  function setScene(name) {
    if (!name) return;
    current = name;
    root.setAttribute("data-scene", name);
    if (signal) signal.setAttribute("data-scene", name);
    if (label) label.textContent = LABELS[name] || LABELS.sense;
    stages.forEach(function (stage) {
      var on = stage.getAttribute("data-layer") === name;
      stage.classList.toggle("is-current", on);
      stage.hidden = !on;
      if (on) {
        stage.classList.add("is-visible");
        stage.classList.remove("is-pending");
      }
    });
    ticks.forEach(function (tick) {
      tick.setAttribute("aria-current", tick.getAttribute("data-flow-tick") === name ? "true" : "false");
    });
  }

  function targetFromHash(hash) {
    var id;
    try { id = decodeURIComponent((hash || "").replace(/^#/, "")); } catch (_) { return null; }
    var target = id && document.getElementById(id);
    return target && root.contains(target) ? target : null;
  }

  function stageForTarget(target) {
    return target && target.closest(".desc-flow__stage[data-layer]");
  }

  function stageFromHash() {
    return stageForTarget(targetFromHash(location.hash));
  }

  function activateFromLink(anchor, scrollPanel) {
    var href = anchor.getAttribute("href") || "";
    var id = href.split("#")[1];
    if (!id) return false;
    var target = targetFromHash("#" + id);
    var stage = stageForTarget(target);
    if (!stage) return false;
    setScene(stage.getAttribute("data-layer"));
    if (history.replaceState) {
      history.replaceState(null, "", "#" + id);
    }
    if (scrollPanel) {
      // Reveal the selected explanation itself; the four links must not all
      // land at the same pipeline heading above the active content.
      target.scrollIntoView({ block: "start", behavior: "smooth" });
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
    return true;
  }

  var initial = stageFromHash();
  setScene(initial ? initial.getAttribute("data-layer") : root.getAttribute("data-scene") || "sense");

  ticks.forEach(function (tick) {
    tick.addEventListener("click", function (event) {
      event.preventDefault();
      activateFromLink(tick, false);
    });
  });

  document.addEventListener("click", function (event) {
    var link = event.target && event.target.closest && event.target.closest('a[href^="#"]');
    if (!link || ticks.indexOf(link) !== -1) return;
    if (activateFromLink(link, true)) event.preventDefault();
  });

  window.addEventListener("hashchange", function () {
    var stage = stageFromHash();
    if (stage) setScene(stage.getAttribute("data-layer"));
  });
})();
