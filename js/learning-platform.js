/**
 * AeroSense Learning Lab — landing shell.
 * Progress is local to this browser. No remote requests.
 */
(function () {
  "use strict";

  var LABELS = {
    "not-started": "Not started",
    "in-progress": "In progress",
    completed: "Completed",
  };

  function storeApi() {
    return window.AerosenseLearn && window.AerosenseLearn.STORAGE;
  }

  function paintStatus(root, api, state) {
    var nodes = root.querySelectorAll("[data-learn-status]");
    nodes.forEach(function (el) {
      var id = el.getAttribute("data-learn-status");
      var rec = api.getModule(state, id);
      var status = rec.completed ? "completed" : rec.status || "not-started";
      el.setAttribute("data-status", status);
      var text = el.querySelector(".learn-status__text");
      if (text) text.textContent = LABELS[status] || LABELS["not-started"];
    });

    var live = root.querySelector("[data-learn-progress-live]");
    if (live) {
      live.textContent =
        "Your browser progress: " +
        api.completedCount(state) +
        " of 5 modules completed. Status is stored only on this device and is not a published learning outcome.";
    }

    var dockCount = root.querySelector("[data-learn-dock-count]");
    if (dockCount) {
      dockCount.textContent = api.completedCount(state) + " / 5 completed";
    }
  }

  function initLayers(root) {
    var cards = root.querySelectorAll("[data-learn-layer]");
    cards.forEach(function (card) {
      var btn = card.querySelector(".learn-layer__hit");
      if (!btn) return;

      function syncExpanded() {
        btn.setAttribute("aria-expanded", card.classList.contains("is-open") ? "true" : "false");
      }

      btn.addEventListener("click", function () {
        card.classList.toggle("is-open");
        syncExpanded();
      });
      card.addEventListener("focusin", function () {
        btn.setAttribute("aria-expanded", "true");
      });
      card.addEventListener("focusout", function (event) {
        if (card.contains(event.relatedTarget)) return;
        if (!card.classList.contains("is-open")) btn.setAttribute("aria-expanded", "false");
      });
      syncExpanded();
    });
  }

  function initDrawer(root) {
    var dock = root.querySelector("[data-learn-dock]");
    var drawer = root.querySelector("#learn-modules-drawer");
    if (!dock || !drawer) return;

    function openDrawer() {
      if (typeof drawer.showModal === "function") {
        if (!drawer.open) drawer.showModal();
      } else drawer.setAttribute("open", "");
      dock.setAttribute("aria-expanded", "true");
    }

    function closeDrawer() {
      var restore = document.activeElement && drawer.contains(document.activeElement);
      if (typeof drawer.close === "function" && drawer.open) drawer.close();
      else drawer.removeAttribute("open");
      dock.setAttribute("aria-expanded", "false");
      if (restore) dock.focus();
    }

    dock.addEventListener("click", function () {
      if (drawer.open) closeDrawer();
      else openDrawer();
    });
    var closeBtn = drawer.querySelector("[data-learn-drawer-close]");
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    drawer.addEventListener("click", function (event) {
      if (event.target === drawer) closeDrawer();
    });
    drawer.addEventListener("close", function () {
      dock.setAttribute("aria-expanded", "false");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var api = storeApi();
    var state = api ? api.read() : { modules: {} };
    if (api) paintStatus(document, api, state);
    initLayers(document);
    initDrawer(document);

    document.querySelectorAll("[data-learn-module]").forEach(function (link) {
      link.addEventListener("click", function () {
        if (!api) return;
        var id = link.getAttribute("data-learn-module");
        if (!id) return;
        api.markInProgress(state, id);
        paintStatus(document, api, state);
      });
    });
  });
})();
