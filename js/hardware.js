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

  function initSchem(root) {
    var tabs = qsa(".hw-schem__tab", root);
    var panels = qsa("[data-schem-panel]", root);
    var live = qs("[data-hw-schem-live]", root);
    var dialog = qs("[data-hw-schem-dialog]");
    var dialogImg = dialog ? qs("[data-hw-schem-dialog-img]", dialog) : null;
    if (!tabs.length) return;

    function select(tab) {
      var id = tab.getAttribute("data-schem");
      tabs.forEach(function (btn) {
        var on = btn === tab;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-schem-panel") === id;
        panel.hidden = !on;
        panel.classList.toggle("is-active", on);
      });
      if (live) {
        live.textContent = "Showing " + (tab.textContent || id).trim() + " schematic.";
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        select(tab);
        window.requestAnimationFrame(function () {
          var panel = qs('[data-schem-panel="' + tab.getAttribute("data-schem") + '"]', root);
          var vp = panel ? qs("[data-schem-viewport]", panel) : null;
          if (vp && typeof vp._fitImage === "function") vp._fitImage();
        });
      });
    });

    var initial =
      qs(".hw-schem__tab.is-active", root) ||
      qs('.hw-schem__tab[data-schem="v2-power"]', root) ||
      tabs[0];
    select(initial);

    qsa("[data-schem-enlarge]", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var src = btn.getAttribute("data-schem-enlarge");
        if (!dialog || !dialogImg || !src) return;
        dialogImg.src = src;
        dialogImg.alt = "Enlarged schematic render";
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          window.open(src, "_blank", "noopener");
        }
      });
    });

    qsa("[data-schem-viewport]", root).forEach(function (vp) {
      var img = qs("[data-schem-img]", vp);
      var panel = vp.closest("[data-schem-panel]") || root;
      if (!img) return;

      var scale = 1;
      var ox = 0;
      var oy = 0;
      var userZoomed = false;
      var dragging = false;
      var sx = 0;
      var sy = 0;
      var startOx = 0;
      var startOy = 0;

      function applyTransform() {
        img.style.transform = "translate(" + ox + "px," + oy + "px) scale(" + scale + ")";
      }

      function fitImage() {
        var cw = vp.clientWidth;
        var ch = vp.clientHeight;
        var nw = img.naturalWidth || Number(img.getAttribute("width")) || 1;
        var nh = img.naturalHeight || Number(img.getAttribute("height")) || 1;
        if (!cw || !ch || !nw || !nh) return;
        scale = Math.min(cw / nw, ch / nh);
        ox = (cw - nw * scale) / 2;
        oy = (ch - nh * scale) / 2;
        userZoomed = false;
        applyTransform();
      }

      function zoomBy(delta) {
        var rect = vp.getBoundingClientRect();
        var cx = rect.width / 2;
        var cy = rect.height / 2;
        var next = Math.min(8, Math.max(0.05, scale * (delta > 0 ? 1.2 : 1 / 1.2)));
        var k = next / scale;
        ox = cx - (cx - ox) * k;
        oy = cy - (cy - oy) * k;
        scale = next;
        userZoomed = true;
        applyTransform();
      }

      function bindFit() {
        if (img.complete && img.naturalWidth) fitImage();
        else img.addEventListener("load", fitImage, { once: true });
      }
      bindFit();

      if (typeof ResizeObserver === "function") {
        new ResizeObserver(function () {
          if (!userZoomed) fitImage();
        }).observe(vp);
      } else {
        window.addEventListener("resize", function () {
          if (!userZoomed) fitImage();
        });
      }

      vp.addEventListener(
        "wheel",
        function (event) {
          event.preventDefault();
          zoomBy(event.deltaY < 0 ? 1 : -1);
        },
        { passive: false }
      );

      vp.addEventListener("pointerdown", function (event) {
        dragging = true;
        sx = event.clientX;
        sy = event.clientY;
        startOx = ox;
        startOy = oy;
        vp.setPointerCapture(event.pointerId);
      });
      vp.addEventListener("pointermove", function (event) {
        if (!dragging) return;
        if (Math.abs(event.clientX - sx) + Math.abs(event.clientY - sy) > 2) userZoomed = true;
        ox = startOx + (event.clientX - sx);
        oy = startOy + (event.clientY - sy);
        applyTransform();
      });
      vp.addEventListener("pointerup", function () {
        dragging = false;
      });
      vp.addEventListener("dblclick", function () {
        fitImage();
      });

      var zoomIn = qs("[data-schem-zoom-in]", panel);
      var zoomOut = qs("[data-schem-zoom-out]", panel);
      var reset = qs("[data-schem-reset]", panel);
      if (zoomIn) zoomIn.addEventListener("click", function () { zoomBy(1); });
      if (zoomOut) zoomOut.addEventListener("click", function () { zoomBy(-1); });
      if (reset) reset.addEventListener("click", fitImage);

      vp._fitImage = fitImage;
    });

    window.requestAnimationFrame(function () {
      qsa("[data-schem-viewport]", root).forEach(function (vp) {
        if (vp.offsetParent && typeof vp._fitImage === "function") vp._fitImage();
      });
    });
  }

  function initBom(root) {
    var data = window.AEROSENSE_HW_BOM;
    var body = qs("[data-bom-body]", root);
    var live = qs("[data-bom-live]", root);
    var search = qs("[data-bom-q]", root);
    if (!data || !body) {
      if (body) body.innerHTML = "<tr><td colspan=\"6\">BOM data file missing.</td></tr>";
      return;
    }

    var cat = "all";
    var q = "";

    var catLabel = {
      power: "Power",
      control: "Control",
      analog: "Analog",
      "adc-ref": "ADC/reference",
      "optics-led": "Optics/LED",
      "mech-if": "Mechanical/interface"
    };

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function rows() {
      return data.v2 || [];
    }

    function render() {
      var list = rows().filter(function (row) {
        if (cat !== "all" && row.category !== cat) return false;
        if (!q) return true;
        var blob = [
          row.ref,
          row.value,
          row.mpn,
          row.function,
          row.manufacturer,
          row.notes,
          row.param_raw
        ]
          .join(" ")
          .toLowerCase();
        return blob.indexOf(q) !== -1;
      });

      if (!list.length) {
        body.innerHTML = "<tr><td colspan=\"6\">No rows match this filter.</td></tr>";
      } else {
        body.innerHTML = list
          .map(function (row) {
            return (
              "<tr>" +
              "<td>" +
              escapeHtml(row.ref) +
              "</td>" +
              "<td>" +
              escapeHtml(row.qty) +
              "</td>" +
              "<td>" +
              escapeHtml(row.value) +
              "</td>" +
              "<td>" +
              escapeHtml(row.mpn) +
              "</td>" +
              "<td>" +
              escapeHtml(row.function) +
              "</td>" +
              "<td>" +
              escapeHtml(catLabel[row.category] || row.category) +
              "</td>" +
              "</tr>"
            );
          })
          .join("");
      }

      if (live) {
        live.textContent =
          "Current board · " +
          list.length +
          " row" +
          (list.length === 1 ? "" : "s") +
          (cat === "all" ? "" : " · " + (catLabel[cat] || cat));
      }
    }

    qsa("[data-bom-cat]", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        cat = btn.getAttribute("data-bom-cat") || "all";
        qsa("[data-bom-cat]", root).forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        render();
      });
    });

    if (search) {
      search.addEventListener("input", function () {
        q = (search.value || "").trim().toLowerCase();
        render();
      });
    }

    render();
  }

  function init() {
    qsa("[data-hw-explorer]").forEach(initExplorer);
    qsa("[data-hw-optics]").forEach(initOptics);
    qsa("[data-hw-gain]").forEach(initGain);
    qsa("[data-hw-fdm]").forEach(initFdm);
    qsa("[data-hw-diff]").forEach(initDiff);
    qsa("[data-hw-pcb]").forEach(initPcb);
    qsa("[data-hw-schem]").forEach(initSchem);
    qsa("[data-hw-bom]").forEach(initBom);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
