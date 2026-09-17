/**
 * Safety case explorer: Sense → Read → Decode → Act functional architecture
 * (not the team workstream hierarchy).
 * Progressive enhancement — every layer remains readable without JS.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var narrowMq = window.matchMedia("(max-width: 768px)");

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function initCase(root) {
    var tabs = qsa(".saf-case__node", root);
    var panels = qsa("[data-saf-panel]", root);
    var live = qs("[data-saf-live]", root);
    var track = qs(".saf-case__track", root);
    if (!tabs.length || !panels.length) return;

    root.classList.add("is-enhanced");
    if (!reduceMotion) root.classList.add("saf-case--motion");

    var panelsRoot = qs(".saf-case__panels", root);
    var stageOrder = ["sense", "read", "decode", "act"];

    function restorePanels() {
      if (!panelsRoot) return;
      stageOrder.forEach(function (id) {
        var panel = qs('[data-saf-panel="' + id + '"]', root);
        if (panel) panelsRoot.appendChild(panel);
      });
    }

    function placePanel(tab) {
      var id = tab.getAttribute("data-saf-stage");
      var panel = qs('[data-saf-panel="' + id + '"]', root);
      if (!panel) return;
      restorePanels();
      if (narrowMq.matches && tab.parentElement) {
        tab.parentElement.appendChild(panel);
      }
    }

    function applyPattern() {
      var vertical = narrowMq.matches;
      if (vertical) {
        if (track) {
          track.removeAttribute("role");
          track.removeAttribute("aria-label");
          qsa("li", track).forEach(function (item) {
            item.removeAttribute("role");
          });
        }
        tabs.forEach(function (tab) {
          tab.removeAttribute("role");
          tab.removeAttribute("aria-selected");
          tab.setAttribute("tabindex", "0");
          tab.setAttribute(
            "aria-expanded",
            tab.classList.contains("is-active") ? "true" : "false"
          );
        });
        panels.forEach(function (panel) {
          panel.removeAttribute("role");
        });
      } else {
        if (track) {
          track.setAttribute("role", "tablist");
          track.setAttribute("aria-label", "Sense, Read, Decode, Act");
          qsa("li", track).forEach(function (item) {
            item.setAttribute("role", "presentation");
          });
        }
        tabs.forEach(function (tab) {
          tab.setAttribute("role", "tab");
          tab.removeAttribute("aria-expanded");
        });
        panels.forEach(function (panel) {
          panel.setAttribute("role", "tabpanel");
        });
      }
    }

    function indexOf(tab) {
      return tabs.indexOf(tab);
    }

    function select(tab, moveFocus) {
      var id = tab.getAttribute("data-saf-stage");
      var label = tab.getAttribute("data-saf-label") || tab.textContent.trim();
      var vertical = narrowMq.matches;

      tabs.forEach(function (btn) {
        var on = btn === tab;
        btn.classList.toggle("is-active", on);
        if (vertical) {
          btn.setAttribute("tabindex", "0");
          btn.setAttribute("aria-expanded", on ? "true" : "false");
        } else {
          btn.setAttribute("aria-selected", on ? "true" : "false");
          btn.setAttribute("tabindex", on ? "0" : "-1");
        }
      });

      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-saf-panel") === id;
        panel.classList.toggle("is-active", on);
        panel.setAttribute("tabindex", "-1");
        if (on) {
          panel.removeAttribute("aria-hidden");
        } else {
          panel.setAttribute("aria-hidden", "true");
        }
      });

      placePanel(tab);
      applyPattern();

      if (live) {
        live.textContent = "Showing " + label + ".";
      }

      if (moveFocus) tab.focus();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        select(tab, false);
      });

      tab.addEventListener("keydown", function (event) {
        var i = indexOf(tab);
        var next = null;
        var vertical = narrowMq.matches;
        if (event.key === "ArrowRight" || (event.key === "ArrowDown" && vertical)) {
          next = tabs[(i + 1) % tabs.length];
        } else if (event.key === "ArrowLeft" || (event.key === "ArrowUp" && vertical)) {
          next = tabs[(i - 1 + tabs.length) % tabs.length];
        } else if (!vertical && event.key === "ArrowDown") {
          var active = qs("[data-saf-panel].is-active", root);
          if (active) {
            event.preventDefault();
            active.focus();
          }
          return;
        } else if (event.key === "Home") {
          next = tabs[0];
        } else if (event.key === "End") {
          next = tabs[tabs.length - 1];
        }
        if (!next) return;
        event.preventDefault();
        select(next, true);
      });
    });

    var initial = qs('.saf-case__node[aria-selected="true"]', root) || tabs[0];
    select(initial, false);

    function onWidthChange() {
      var current =
        qs(".saf-case__node.is-active", root) ||
        qs('.saf-case__node[aria-selected="true"]', root) ||
        tabs[0];
      select(current, false);
    }

    if (narrowMq.addEventListener) {
      narrowMq.addEventListener("change", onWidthChange);
    } else if (narrowMq.addListener) {
      narrowMq.addListener(onWidthChange);
    }
  }

  function initChem(root) {
    var groups = qsa("details.saf-chem__group", root);
    if (!groups.length) return;

    root.classList.add("is-enhanced");
    groups.forEach(function (group, index) {
      group.open = index === 0;
    });

    window.addEventListener("beforeprint", function () {
      groups.forEach(function (group) {
        group.open = true;
      });
    });
  }

  function initTree(root) {
    var gates = qsa("[data-saf-gate]", root);
    if (!gates.length) return;

    root.classList.add("is-enhanced");

    function setActive(gate) {
      gates.forEach(function (el) {
        var on = el === gate;
        el.classList.toggle("is-active", on);
        if (on) {
          el.setAttribute("aria-current", "step");
        } else {
          el.removeAttribute("aria-current");
        }
      });
    }

    gates.forEach(function (gate) {
      gate.setAttribute("tabindex", "0");
      gate.setAttribute("role", "button");
      gate.addEventListener("click", function () {
        setActive(gate);
      });
      gate.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setActive(gate);
      });
    });
  }

  function initRegister(root) {
    var domainBtns = qsa("[data-saf-domain]", root);
    var statusBtns = qsa("[data-saf-status-filter]", root);
    var rows = qsa("[data-saf-row]", root);
    var live = qs("[data-saf-register-live]", root);
    var empty = qs("[data-saf-register-empty]", root);
    if (!rows.length) return;

    root.classList.add("is-enhanced");

    var domain = "all";
    var status = "all";

    function matchDomain(value) {
      if (domain === "all") return true;
      if (domain === "hardware") return value === "hardware" || value === "optical";
      if (domain === "people") return value === "human";
      if (domain === "biological") return value === "biological" || value === "biosecurity";
      return value === domain;
    }

    function syncButtons(buttons, current, attr) {
      buttons.forEach(function (btn) {
        var on = (btn.getAttribute(attr) || "") === current;
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function apply() {
      var shown = 0;
      rows.forEach(function (row) {
        var on =
          matchDomain(row.getAttribute("data-domain") || "") &&
          (status === "all" || (row.getAttribute("data-status") || "") === status);
        row.hidden = !on;
        if (on) shown += 1;
      });
      syncButtons(domainBtns, domain, "data-saf-domain");
      syncButtons(statusBtns, status, "data-saf-status-filter");
      if (live) {
        live.textContent =
          "Showing " + shown + " of " + rows.length + " rows" +
          (domain === "all" && status === "all"
            ? "."
            : " for the current filters.");
      }
      if (empty) {
        empty.hidden = shown !== 0;
      }
    }

    function bindGroup(buttons, setter) {
      buttons.forEach(function (btn, index) {
        btn.addEventListener("click", function () {
          setter(btn);
          apply();
        });
        btn.addEventListener("keydown", function (event) {
          var next = index;
          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            next = (index + 1) % buttons.length;
          } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            next = (index - 1 + buttons.length) % buttons.length;
          } else if (event.key === "Home") {
            next = 0;
          } else if (event.key === "End") {
            next = buttons.length - 1;
          } else {
            return;
          }
          event.preventDefault();
          buttons[next].focus();
          setter(buttons[next]);
          apply();
        });
      });
    }

    bindGroup(domainBtns, function (btn) {
      domain = btn.getAttribute("data-saf-domain") || "all";
    });
    bindGroup(statusBtns, function (btn) {
      status = btn.getAttribute("data-saf-status-filter") || "all";
    });

    window.addEventListener("beforeprint", function () {
      rows.forEach(function (row) {
        row.hidden = false;
      });
      if (live) {
        live.textContent = "Print view shows all " + rows.length + " rows.";
      }
      if (empty) empty.hidden = true;
    });
    window.addEventListener("afterprint", apply);

    apply();
  }

  document.addEventListener("DOMContentLoaded", function () {
    qsa("[data-saf-case]").forEach(initCase);
    qsa("[data-saf-chem]").forEach(initChem);
    qsa("[data-saf-tree]").forEach(initTree);
    qsa("[data-saf-register]").forEach(initRegister);
  });
})();
