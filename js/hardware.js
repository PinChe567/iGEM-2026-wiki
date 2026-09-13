/**
 * Hardware signal-chain explorer.
 * Progressive enhancement: all stage cards remain readable without JS.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function initExplorer(root) {
    var tabs = qsa(".hw-explorer__tab", root);
    var panels = qsa("[data-hw-card]", root);
    var live = qs("[data-hw-live]", root);
    if (!tabs.length || !panels.length) return;

    root.classList.add("is-enhanced");

    tabs.forEach(function (tab) {
      tab.setAttribute("role", "tab");
      tab.setAttribute("type", "button");
    });
    var track = qs(".hw-explorer__track", root);
    if (!track) return;
    track.setAttribute("role", "tablist");
    track.setAttribute("aria-label", "READ-layer signal-chain stages");

    var selectWrap = document.createElement("div");
    selectWrap.className = "hw-explorer__select-wrap";
    var selectLab = document.createElement("label");
    selectLab.setAttribute("for", "hw-explorer-select");
    selectLab.textContent = "Signal-chain stage";
    var stageSelect = document.createElement("select");
    stageSelect.id = "hw-explorer-select";
    stageSelect.className = "hw-explorer__select";
    stageSelect.setAttribute("aria-label", "Signal-chain stage");
    tabs.forEach(function (tab, i) {
      var opt = document.createElement("option");
      opt.value = tab.getAttribute("data-hw-stage");
      opt.textContent = (i + 1) + ". " + (tab.getAttribute("data-hw-label") || tab.textContent.trim());
      stageSelect.appendChild(opt);
    });
    selectWrap.appendChild(selectLab);
    selectWrap.appendChild(stageSelect);
    track.parentNode.insertBefore(selectWrap, track);

    panels.forEach(function (panel) {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("tabindex", "0");
    });

    function indexOfTab(tab) {
      return tabs.indexOf(tab);
    }

    function select(tab, moveFocus) {
      var id = tab.getAttribute("data-hw-stage");
      var label = tab.getAttribute("data-hw-label") || tab.textContent.trim();

      tabs.forEach(function (btn) {
        var on = btn === tab;
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.setAttribute("tabindex", on ? "0" : "-1");
        btn.classList.toggle("is-active", on);
      });

      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-hw-card") === id;
        panel.classList.toggle("is-active", on);
        panel.hidden = !on;
        if (on) {
          var heading = qs(".hw-explorer__title", panel);
          if (heading) {
            panel.setAttribute("aria-labelledby", heading.id);
          }
        }
      });

      if (live) {
        live.textContent = "Showing " + label + ".";
      }

      if (stageSelect) {
        stageSelect.value = id;
      }

      if (moveFocus) {
        tab.focus();
      }
    }

    stageSelect.addEventListener("change", function () {
      var match = qs('.hw-explorer__tab[data-hw-stage="' + stageSelect.value + '"]', root);
      if (match) select(match, false);
    });

    var initial =
      qs('.hw-explorer__tab[aria-selected="true"]', root) || tabs[0];
    select(initial, false);

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        select(tab, false);
      });

      tab.addEventListener("keydown", function (event) {
        var i = indexOfTab(tab);
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          next = tabs[(i + 1) % tabs.length];
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          next = tabs[(i - 1 + tabs.length) % tabs.length];
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

    if (!reduceMotion) {
      root.classList.add("hw-explorer--motion");
    }
  }

  function initOptics(root) {
    var inputs = qsa('input[name="hw-opt-view"]', root);
    var notes = qsa("[data-opt-note]", root);
    var live = qs("[data-hw-opt-live]", root);
    if (!inputs.length) return;

    root.classList.add("is-enhanced");

    function apply() {
      var selected = qs('input[name="hw-opt-view"]:checked', root) || inputs[0];
      var view = selected.value;
      root.setAttribute("data-view", view);
      notes.forEach(function (note) {
        var on = note.getAttribute("data-opt-note") === view;
        note.hidden = !on;
        note.classList.toggle("is-active", on);
      });
      if (live) {
        live.textContent = selected.getAttribute("data-live") || "";
      }
    }

    inputs.forEach(function (input) {
      input.addEventListener("change", apply);
    });
    apply();
  }

  function initGain(root) {
    var inputs = qsa('input[name="hw-gain-rf"]', root);
    var panels = qsa("[data-gain]", root);
    var live = qs("[data-hw-gain-live]", root);
    if (!inputs.length || !panels.length) return;

    root.classList.add("is-enhanced");

    function apply() {
      var selected = qs('input[name="hw-gain-rf"]:checked', root) || inputs[0];
      var id = selected.value;
      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-gain") === id;
        panel.hidden = !on;
        panel.classList.toggle("is-active", on);
      });
      if (live) {
        live.textContent = "Showing design values for " + selected.getAttribute("data-label") + ".";
      }
    }

    inputs.forEach(function (input) {
      input.addEventListener("change", apply);
    });
    apply();
  }

  function initFdm(root) {
    var form = qs(".hw-fdm__form", root);
    var interf = qs("#hw-fdm-interf", root);
    var dlia = qs("#hw-fdm-dlia", root);
    var cleanBtn = qs("[data-fdm-clean]", root);
    var notes = qsa("[data-fdm-note]", root);
    var live = qs("[data-hw-fdm-live]", root);
    if (!interf || !dlia) return;

    root.classList.add("is-enhanced");

    function modeKey() {
      var hasInterf = interf.checked;
      var hasDlia = dlia.checked;
      if (hasInterf && hasDlia) return "both";
      if (hasInterf) return "interf";
      if (hasDlia) return "dlia";
      return "clean";
    }

    function apply() {
      var key = modeKey();
      root.setAttribute("data-interf", interf.checked ? "on" : "off");
      root.setAttribute("data-dlia", dlia.checked ? "on" : "off");
      notes.forEach(function (note) {
        var on = note.getAttribute("data-fdm-note") === key;
        note.hidden = !on;
        note.classList.toggle("is-active", on);
      });
      if (cleanBtn) {
        cleanBtn.setAttribute("aria-pressed", key === "clean" ? "true" : "false");
      }
      if (live) {
        var messages = {
          clean: "Clean conceptual view. Four provisional tags, no added interference, DLIA off.",
          interf: "Conceptual interference added. Not measured amplitudes.",
          dlia: "Conceptual DLIA on. Synchronous components preferentially retained. Not a measured SNR.",
          both: "Conceptual interference plus DLIA. Isolation and SNR remain unmeasured."
        };
        live.textContent = messages[key];
      }
    }

    interf.addEventListener("change", apply);
    dlia.addEventListener("change", apply);

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
      });
      form.addEventListener("reset", function () {
        window.setTimeout(apply, 0);
      });
    }

    apply();
  }

  function initDiff(root) {
    var inputs = qsa('input[name="hw-diff-issue"]', root);
    var panels = qsa("[data-diff]", root);
    var live = qs("[data-hw-diff-live]", root);
    if (!inputs.length || !panels.length) return;

    root.classList.add("is-enhanced");

    function apply() {
      var selected = qs('input[name="hw-diff-issue"]:checked', root) || inputs[0];
      var id = selected.value;
      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-diff") === id;
        panel.hidden = !on;
        panel.classList.toggle("is-active", on);
      });
      if (live) {
        live.textContent = "Showing engineering diff: " + selected.nextElementSibling.textContent.trim() + ".";
      }
    }

    inputs.forEach(function (input) {
      input.addEventListener("change", apply);
    });
    apply();
  }

  function initPcb(root) {
    var faces = qsa('input[name="hw-pcb-face"]', root);
    var views = qsa("[data-pcb-face]", root).filter(function (el) {
      return el.classList.contains("hw-pcb__view");
    });
    var pins = qsa(".hw-pcb__pin", root);
    var notes = qsa(".hw-pcb__note", root);
    var live = qs("[data-hw-pcb-live]", root);
    if (!faces.length) return;

    root.classList.add("is-enhanced");

    var currentHotspot = {
      top: "esp32",
      bottom: "pd"
    };

    function faceValue() {
      var selected = qs('input[name="hw-pcb-face"]:checked', root) || faces[0];
      return selected.value;
    }

    function apply() {
      var face = faceValue();
      var mobile = window.matchMedia("(max-width: 800px)").matches;
      var hotspot = currentHotspot[face];
      root.setAttribute("data-face", face);

      views.forEach(function (view) {
        var on = view.getAttribute("data-pcb-face") === face;
        view.hidden = !on;
      });

      notes.forEach(function (note) {
        var noteFace = note.getAttribute("data-pcb-face");
        var on = noteFace === face && (mobile || note.getAttribute("data-pcb-hotspot") === hotspot);
        note.hidden = !on;
        note.classList.toggle("is-active", on && note.getAttribute("data-pcb-hotspot") === hotspot);
      });

      pins.forEach(function (pin) {
        var view = pin.closest(".hw-pcb__view");
        var onFace = view && view.getAttribute("data-pcb-face") === face;
        var on = pin.getAttribute("data-pcb-hotspot") === hotspot;
        pin.tabIndex = onFace ? 0 : -1;
        pin.setAttribute("aria-pressed", on && onFace ? "true" : "false");
        pin.classList.toggle("is-active", on && onFace);
      });

      if (live) {
        live.textContent = face === "top" ? "Digital face. Select a numbered region." : "Optical face. Select a numbered region.";
      }
    }

    faces.forEach(function (input) {
      input.addEventListener("change", apply);
    });

    if (window.matchMedia) {
      var mq = window.matchMedia("(max-width: 800px)");
      if (mq.addEventListener) {
        mq.addEventListener("change", apply);
      } else if (mq.addListener) {
        mq.addListener(apply);
      }
    }

    pins.forEach(function (pin) {
      pin.addEventListener("click", function () {
        var id = pin.getAttribute("data-pcb-hotspot");
        var note = qs('.hw-pcb__note[data-pcb-hotspot="' + id + '"]', root);
        if (!note) return;
        currentHotspot[note.getAttribute("data-pcb-face")] = id;
        apply();
      });
    });

    apply();
  }

  function init() {
    qsa("[data-hw-explorer]").forEach(initExplorer);
    qsa("[data-hw-optics]").forEach(initOptics);
    qsa("[data-hw-gain]").forEach(initGain);
    qsa("[data-hw-fdm]").forEach(initFdm);
    qsa("[data-hw-diff]").forEach(initDiff);
    qsa("[data-hw-pcb]").forEach(initPcb);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
