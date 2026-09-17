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

  function stageFromHash() {
    var id = (location.hash || "").replace("#", "");
    if (!id) return null;
    return root.querySelector('.desc-flow__stage[id="' + id + '"]');
  }

  function activateFromLink(anchor, scrollPanel) {
    var href = anchor.getAttribute("href") || "";
    var id = href.split("#")[1];
    if (!id) return false;
    var stage = root.querySelector('.desc-flow__stage[id="' + id + '"]');
    if (!stage) return false;
    setScene(stage.getAttribute("data-layer"));
    if (history.replaceState) {
      history.replaceState(null, "", "#" + id);
    }
    if (scrollPanel) {
      var panel = document.getElementById("pipeline") || root;
      panel.scrollIntoView({ block: "start" });
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
    var link = event.target && event.target.closest && event.target.closest('a[href="#sense"], a[href="#read"], a[href="#decode"], a[href="#act"]');
    if (!link || ticks.indexOf(link) !== -1) return;
    if (activateFromLink(link, true)) event.preventDefault();
  });

  window.addEventListener("hashchange", function () {
    var stage = stageFromHash();
    if (stage) setScene(stage.getAttribute("data-layer"));
  });
})();
