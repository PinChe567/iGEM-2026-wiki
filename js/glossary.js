/**
 * AeroSense glossary — accessible term popovers.
 * Definitions are provisional and must be team-reviewed.
 */
(function () {
  "use strict";

  var DEFINITIONS = {
    voc: {
      term: "VOC",
      def: "Volatile organic compound — a carbon-containing chemical that readily enters the gas phase at ambient conditions.",
    },
    mycotoxin: {
      term: "Mycotoxin",
      def: "A toxic secondary metabolite that some fungi can produce. Detecting mold growth is not the same measurement as quantifying a mycotoxin.",
    },
    sds: {
      term: "SDS",
      def: "Safety Data Sheet — a supplier document describing chemical hazards, handling, and emergency information for a substance.",
    },
    sop: {
      term: "SOP",
      def: "Standard operating procedure — an institution-approved written method for performing a task safely and consistently.",
    },
    rg: {
      term: "Risk group",
      def: "A classification of biological agents by the relative risk they pose; institutional assignment must be confirmed locally.",
    },

    or: {
      term: "OR",
      def: "Olfactory receptor — a receptor protein that binds odorant molecules and initiates an olfactory signal.",
    },
    orco: {
      term: "Orco",
      def: "Odorant receptor co-receptor — an insect co-receptor that partners with ORs to form ligand-gated ion channels.",
    },
    drosophila: {
      term: "Drosophila",
      def: "A genus of flies. AeroSense documents chemically synthesised odorant-receptor sequences from Drosophila melanogaster as a design reference. Final project organism inventory pending team confirmation.",
    },
    vuaa1: {
      term: "VUAA1",
      def: "A synthetic Orco-family agonist specified for activating insect odorant receptor co-receptor channels. Named as a planned research reagent, not as a completed assay record on this wiki.",
    },
    hek293t: {
      term: "HEK293T",
      def: "A human embryonic kidney cell line commonly used for heterologous protein expression.",
    },
    gcamp6: {
      term: "GCaMP6",
      def: "A genetically encoded fluorescent calcium indicator used to report intracellular Ca²⁺ changes.",
    },
    gcamp: {
      term: "GCaMP",
      def: "A family of genetically encoded fluorescent calcium indicators. AeroSense plans a GCaMP-class reporter; the exact variant is a map-level detail.",
    },
    "delta-f-over-f0": {
      term: "ΔF/F₀",
      def: "Relative fluorescence change — the change in fluorescence divided by a baseline fluorescence level.",
    },
    obp: {
      term: "OBP",
      def: "Odorant-binding protein — a soluble protein that can bind and help transport hydrophobic odorants.",
    },
    al: {
      term: "AL",
      def: "Antennal lobe — the insect brain center that receives primary olfactory input and performs early odor processing.",
    },
    pn: {
      term: "PN",
      def: "Projection neuron — a neuron that relays processed olfactory information from the antennal lobe to higher centers.",
    },
    mb: {
      term: "MB",
      def: "Mushroom body — an insect brain structure involved in olfactory learning, memory, and sparse odor coding.",
    },
    kc: {
      term: "KC",
      def: "Kenyon cell — a mushroom-body neuron that typically participates in sparse, high-dimensional odor representations.",
    },
    mbon: {
      term: "MBON",
      def: "Mushroom body output neuron — a neuron that reads mushroom-body activity and contributes to behavioral decisions.",
    },
    "lateral-inhibition": {
      term: "Lateral inhibition",
      def: "A circuit motif in which active units suppress neighbors, often increasing contrast between signals.",
    },
    "sparse-coding": {
      term: "Sparse coding",
      def: "A representation strategy in which only a small fraction of units are strongly active for a given input.",
    },
    lsh: {
      term: "LSH",
      def: "Locality-sensitive hashing — a method that maps similar inputs to nearby codes with high probability.",
    },
    snn: {
      term: "SNN",
      def: "Spiking neural network — a neural model that communicates with discrete spike events over time.",
    },
    ali: {
      term: "ALI",
      def: "Air–liquid interface — a culture or sampling setup where cells contact gas above a liquid medium.",
    },
    fdm: {
      term: "FDM",
      def: "Frequency-division multiplexing — assigning distinct carrier frequencies so multiple optical channels can share a detector path.",
    },
    dlia: {
      term: "DLIA",
      def: "Digital lock-in amplifier — a digital method that extracts a signal at a known reference frequency while rejecting other noise.",
    },
    tia: {
      term: "TIA",
      def: "Transimpedance amplifier — a circuit that converts a small input current into a usable output voltage.",
    },
    adc: {
      term: "ADC",
      def: "Analog-to-digital converter — hardware that samples an analog voltage and encodes it as a digital value.",
    },
    poc: {
      term: "POC",
      def: "Proof of concept — an early demonstration that a core idea can work under defined conditions.",
    },
    rfc1000: {
      term: "RFC1000",
      def: "iGEM Registry assembly standard for composing BioBrick/RFC-compatible parts with defined prefix and suffix sites.",
    },
    biobrick: {
      term: "BioBrick",
      def: "A standardized genetic part format used in iGEM and related registries for modular DNA assembly.",
    },
    ies: {
      term: "IRES",
      def: "Internal ribosome entry site — an RNA element that can initiate translation of a downstream open reading frame independently of the 5′ cap.",
    },
    ires: {
      term: "IRES",
      def: "Internal ribosome entry site — an RNA element that can initiate translation of a downstream open reading frame independently of the 5′ cap.",
    },
    pcb: {
      term: "PCB",
      def: "Printed circuit board — the fabricated board that mounts and interconnects electronic components in the AeroSense reader.",
    },
    spi: {
      term: "SPI",
      def: "Serial Peripheral Interface — a synchronous serial bus commonly used between a microcontroller and peripherals such as ADCs.",
    },
  };

  var activeTerm = null;
  var popover = null;
  var hoverTimer = null;

  function ensurePopover() {
    if (popover) return popover;
    popover = document.createElement("div");
    popover.id = "glossary-popover";
    popover.className = "glossary-popover";
    popover.setAttribute("role", "tooltip");
    popover.hidden = true;
    popover.innerHTML =
      '<p class="glossary-popover__term"></p>' +
      '<p class="glossary-popover__def"></p>' +
      '<p class="glossary-popover__note">Definition pending team review.</p>';
    document.body.appendChild(popover);
    return popover;
  }

  function closePopover() {
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    if (!popover || !activeTerm) return;
    popover.hidden = true;
    popover.style.visibility = "";
    activeTerm.setAttribute("aria-expanded", "false");
    activeTerm.removeAttribute("aria-describedby");
    activeTerm = null;
  }

  function positionPopover(termEl) {
    var tip = ensurePopover();
    /* Force layout so tipRect is accurate after content update */
    tip.style.visibility = "hidden";
    tip.hidden = false;
    var rect = termEl.getBoundingClientRect();
    var tipRect = tip.getBoundingClientRect();
    var margin = 10;
    var gap = 12;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var narrow = vw < 640;

    var left;
    if (narrow) {
      left = Math.max(margin, (vw - tipRect.width) / 2) + window.scrollX;
    } else {
      left = rect.left + window.scrollX;
      if (left + tipRect.width > window.scrollX + vw - margin) {
        left = window.scrollX + vw - tipRect.width - margin;
      }
      if (left < window.scrollX + margin) left = window.scrollX + margin;
    }

    var spaceBelow = vh - rect.bottom;
    var spaceAbove = rect.top;
    var top;
    /* Prefer below the term so the focused word stays visible */
    if (spaceBelow >= tipRect.height + gap || spaceBelow >= spaceAbove) {
      top = rect.bottom + window.scrollY + gap;
    } else {
      top = rect.top + window.scrollY - tipRect.height - gap;
    }

    /* Final clamp: never overlap the term's vertical band */
    var tipTopView = top - window.scrollY;
    var tipBottomView = tipTopView + tipRect.height;
    if (tipTopView < rect.bottom + gap && tipBottomView > rect.top - gap) {
      if (spaceBelow >= spaceAbove) {
        top = rect.bottom + window.scrollY + gap;
      } else {
        top = rect.top + window.scrollY - tipRect.height - gap;
      }
    }

    tip.style.left = Math.max(0, left) + "px";
    tip.style.top = Math.max(0, top) + "px";
    tip.style.visibility = "";
  }

  function openPopover(termEl, opts) {
    opts = opts || {};
    var key = (termEl.getAttribute("data-term") || "").toLowerCase();
    var entry = DEFINITIONS[key];
    if (!entry) return;

    var tip = ensurePopover();
    if (activeTerm && activeTerm !== termEl) {
      activeTerm.setAttribute("aria-expanded", "false");
      activeTerm.removeAttribute("aria-describedby");
    }

    tip.querySelector(".glossary-popover__term").textContent = entry.term;
    tip.querySelector(".glossary-popover__def").textContent = entry.def;
    tip.hidden = false;
    tip.setAttribute("aria-hidden", "false");

    termEl.setAttribute("aria-expanded", "true");
    termEl.setAttribute("aria-describedby", tip.id);
    activeTerm = termEl;
    positionPopover(termEl);

    if (opts.focusReturn === false) {
      /* keep focus on term */
    }
  }

  function onTermActivate(termEl) {
    if (activeTerm === termEl && !ensurePopover().hidden) {
      closePopover();
      return;
    }
    openPopover(termEl);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var terms = document.querySelectorAll("dfn.term[data-term]");
    if (!terms.length) return;

    ensurePopover();

    Array.prototype.forEach.call(terms, function (termEl) {
      if (!termEl.hasAttribute("tabindex")) termEl.setAttribute("tabindex", "0");
      termEl.setAttribute("aria-expanded", "false");
      termEl.setAttribute("role", "button");

      termEl.addEventListener("mouseenter", function () {
        if (window.matchMedia("(hover: hover)").matches) {
          hoverTimer = window.setTimeout(function () {
            openPopover(termEl);
          }, 80);
        }
      });

      termEl.addEventListener("mouseleave", function () {
        if (hoverTimer) {
          window.clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        /* Keep open if term still focused */
        if (document.activeElement !== termEl) closePopover();
      });

      termEl.addEventListener("focus", function () {
        openPopover(termEl);
      });

      termEl.addEventListener("blur", function () {
        window.setTimeout(function () {
          if (activeTerm === termEl && document.activeElement !== termEl) {
            closePopover();
          }
        }, 0);
      });

      termEl.addEventListener("click", function (event) {
        event.preventDefault();
        onTermActivate(termEl);
      });

      termEl.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onTermActivate(termEl);
        } else if (event.key === "Escape") {
          event.preventDefault();
          closePopover();
          termEl.focus();
        }
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        var previous = activeTerm;
        closePopover();
        if (previous) previous.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!activeTerm) return;
      var tip = ensurePopover();
      if (activeTerm.contains(event.target) || tip.contains(event.target)) return;
      closePopover();
    });

    window.addEventListener(
      "scroll",
      function () {
        if (activeTerm && popover && !popover.hidden) positionPopover(activeTerm);
      },
      { passive: true }
    );

    window.addEventListener("resize", function () {
      if (activeTerm && popover && !popover.hidden) positionPopover(activeTerm);
    });
  });
})();
