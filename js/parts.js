/**
 * Parts page — collection builder, catalogue drawer, and progressive enhancement.
 * Without JS, architectures, tables, and part anchors remain usable.
 */
(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("page-parts")) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var catalog = window.AerosenseParts || null;

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function formatCount(n) {
    return Number(n).toLocaleString("en-US");
  }

  function partById(id) {
    if (!id) return null;
    if (catalog && typeof catalog.getPart === "function") return catalog.getPart(id) || null;
    return null;
  }

  function usedInLabel(part) {
    if (!catalog || !part) return "";
    var parents = (catalog.PARTS || []).filter(function (item) {
      return item.childIds && item.childIds.indexOf(part.id) !== -1;
    });
    if (!parents.length) return "";
    if (part.category === "reused" && parents.length >= 9) {
      return "All nine final-panel sensing composites";
    }
    return parents
      .map(function (item) {
        return item.displayName + " (" + item.id + ")";
      })
      .join("; ");
  }

  function lengthLabel(part) {
    if (!part) return "";
    var bits = [];
    if (typeof part.lengthBp === "number") bits.push(formatCount(part.lengthBp) + " bp");
    if (typeof part.proteinLengthAa === "number") bits.push(part.proteinLengthAa + " aa");
    return bits.join(" · ");
  }

  function rfcDisplay(value) {
    if (catalog && typeof catalog.rfcLabel === "function") return catalog.rfcLabel(value);
    if (value === true) return "Compatible";
    if (value === false) return "Incompatible";
    return "Unknown";
  }

  function typeLabel(part) {
    if (!part) return "Architecture annotation";
    var bits = [part.category];
    if (part.biologicalRole) bits.push(part.biologicalRole);
    if (part.inFinalPanel) bits.push("final panel");
    if (part.firstGeneration) bits.push("first-generation");
    return bits.join(" · ");
  }

  var openPartDrawer = function () {};
  var sensor3d = {
    focus: function () {},
    setExploded: function () {},
    setMembrane: function () {},
    reset: function () {},
    setOrName: function () {},
  };

  function featureCopy(feature, sensing) {
    var cds = sensing && sensing.cds ? sensing.cds : partById("BBa_26VGDFA1");
    var composite = sensing && sensing.composite ? sensing.composite : partById("BBa_26ZAGFK0");
    var staticCopy = {
      kozak: {
        title: "Kozak sequence",
        id: "",
        length: "Initiation context — not a registered part",
        role: "Translation initiation context",
        used: "Present at the start of both modules",
        body: "A short ribosome initiation context. Kozak is an architecture annotation on this page, not a separately registered Basic Part.",
        reuse: false,
        topo: false,
        tableId: "",
      },
      cmv: {
        title: "CMV promoter",
        id: "",
        length: "pcDNA3.1(+) backbone — not a registered AeroSense part",
        role: "Constitutive RNA polymerase II promoter",
        used: "Both Module A and Module B inserts are expressed from CMV in pcDNA3.1(+)",
        body: "The CMV promoter is a backbone feature of pcDNA3.1(+). It is not a separately registered AeroSense Basic Part.",
        reuse: false,
        topo: false,
        tableId: "",
      },
      bgh: {
        title: "BGH poly(A)",
        id: "",
        length: "pcDNA3.1(+) backbone — not a registered AeroSense part",
        role: "Transcription terminator / polyadenylation signal",
        used: "Both Module A and Module B transcripts",
        body: "The BGH polyadenylation signal is a backbone feature of pcDNA3.1(+). It is not a separately registered AeroSense Basic Part.",
        reuse: false,
        topo: false,
        tableId: "",
      },
      stop: {
        title: "Stop codon",
        id: "",
        length: "Translation terminator — not a registered part",
        role: "Terminates translation of the preceding CDS",
        used: "Closes the OR CDS, mCherry, and the reporting fusion",
        body: "A stop codon. It is an architecture annotation on this page, not a separately registered Basic Part.",
        reuse: false,
        topo: false,
        tableId: "",
      },
      ires: {
        title: "EMCV IRES",
        partId: "BBa_K5490030",
        role: "RNA translation element — not a protein product",
        used: "All nine final-panel sensing composites",
        body: "Reused Registry part. IRES is an RNA translation element: after the OR CDS stops, it restarts translation so mCherry is a separate polypeptide. It is not itself a protein product.",
        reuse: true,
        topo: false,
      },
      mcherry: {
        title: "mCherry",
        partId: "BBa_K4177005",
        role: "Transcription / expression marker — not the measurement",
        used: "All nine final-panel sensing composites",
        body: "Reused Registry part. Red fluorescence, if observed, reports that the sensing cassette is transcribed and that the IRES is active. It is not part of the ion channel and is not the AeroSense readout.",
        reuse: true,
        topo: false,
      },
      rset: {
        title: "RSET leader",
        partId: "BBa_262WP16P",
        role: "N-terminal leader inherited with GCaMP6f",
        used: "Reporting composite BBa_26E11Z80 (GCaMP6f-(GGGGS)3-DmOrco)",
        body: "Leader CDS region from pGP-CMV-GCaMP6f (Addgene #40755). It is part of the reporting open reading frame, not a targeting signal peptide.",
        reuse: false,
        topo: false,
      },
      gcamp: {
        title: "GCaMP6f",
        partId: "BBa_26QHYP02",
        role: "Cytosolic calcium indicator — intended fluorescence readout",
        used: "Reporting composite BBa_26E11Z80 (GCaMP6f-(GGGGS)3-DmOrco)",
        body: "Fused N-terminal to DmOrco so the indicator stays in the cytosol at the channel mouth. This fluorescence change is the designed AeroSense readout, not a measured trace on this page.",
        reuse: false,
        topo: true,
      },
      linker: {
        title: "(GGGGS)₃ linker",
        partId: "BBa_26E21OEQ",
        role: "Flexible peptide linker in the reporting fusion",
        used: "Reporting composite BBa_26E11Z80 (GCaMP6f-(GGGGS)3-DmOrco)",
        body: "Synthetic 15-aa linker between GCaMP6f and DmOrco. One open reading frame; one fusion protein.",
        reuse: false,
        topo: false,
      },
      orco: {
        title: "DmOrco",
        partId: "BBa_26LWIKBQ",
        role: "Shared co-receptor / ion-channel subunit",
        used: "Reporting composite BBa_26E11Z80 (GCaMP6f-(GGGGS)3-DmOrco)",
        body: "Forms a heteromeric ligand-gated channel with the tuning OR and chaperones it to the membrane (Sato 2008; Benton 2006). Subunit stoichiometry is not specified here. Common to every AeroSense line.",
        reuse: false,
        topo: true,
      },
    };

    if (feature === "or") {
      var orName = cds && cds.receptorKey ? cds.receptorKey : "OR";
      return {
        title: orName + " CDS",
        id: cds ? cds.id : "",
        length: lengthLabel(cds),
        role: "Tuning odorant receptor · input / specificity",
        used: composite
          ? "Sensing composite " + composite.id + " (" + composite.displayName + ")"
          : "Sensing module",
        body: "The swappable specificity element. Changing this CDS retargets the sensor; Orco, GCaMP6f, IRES, and mCherry stay the same.",
        reuse: false,
        topo: false,
        tableId: cds ? cds.id : "",
      };
    }

    var copy = staticCopy[feature];
    if (!copy) return null;
    var part = copy.partId ? partById(copy.partId) : null;
    return {
      title: copy.title,
      id: part ? part.id : copy.id || "",
      length: part ? lengthLabel(part) : copy.length,
      role: copy.role,
      used: (part && usedInLabel(part)) || copy.used || "",
      body: copy.body,
      reuse: !!copy.reuse,
      topo: !!copy.topo,
      tableId: part ? part.id : copy.tableId || "",
      registryUrl: part && part.registryUrl ? part.registryUrl : "",
    };
  }

  function initCollectionTabs() {
    var root = qs("[data-parts-tabs]");
    if (!root) return;

    var tabs = qsa('[role="tab"]', root);
    var panels = qsa('[role="tabpanel"]', root);
    if (!tabs.length || !panels.length) return;

    function select(id, announce) {
      tabs.forEach(function (tab) {
        var on = tab.getAttribute("aria-controls") === id;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.setAttribute("tabindex", on ? "0" : "-1");
      });
      panels.forEach(function (panel) {
        var on = panel.id === id;
        panel.hidden = !on;
      });
      if (announce) {
        var live = qs("[data-parts-tabs-live]", root);
        var panel = document.getElementById(id);
        if (live && panel) {
          var heading = qs("h3", panel);
          live.textContent = heading ? heading.textContent : panel.id;
        }
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(tab.getAttribute("aria-controls"), true);
      });
      tab.addEventListener("keydown", function (event) {
        var next = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
          next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[next].focus();
        select(tabs[next].getAttribute("aria-controls"), true);
      });
    });

    var initial = tabs.filter(function (tab) {
      return tab.getAttribute("aria-selected") === "true";
    })[0];
    select((initial || tabs[0]).getAttribute("aria-controls"), false);

    function revealHash() {
      var id = location.hash.replace(/^#/, "");
      if (!id) return;
      var el = document.getElementById(id);
      if (!el) return;
      var panel = el.closest('[role="tabpanel"]');
      if (panel && panel.id) select(panel.id, false);
      if (typeof initCatalog.ensureVisible === "function" && el.getAttribute("data-part-record") !== null) {
        initCatalog.ensureVisible(el);
      }
    }

    window.addEventListener("hashchange", revealHash);
    revealHash();
    initCollectionTabs.select = select;
  }

  function initExplorer() {
    var root = qs("[data-parts-explorer]");
    if (!root) return;

    var radios = qsa('[role="radiogroup"] [role="radio"]', root);
    var featureHits = qsa("[data-feature]", root);
    var activateBtn = qs("[data-parts-activate]", root);
    var activateLive = qs("[data-parts-activate-live]", root);
    var mechanism = qs(".parts-mechanism", root);
    var currentFeature = "or";
    var currentOr = root.getAttribute("data-or") || "Or7a";
    var activating = false;

    function sensingFor(orKey, compositeId, cdsId, radio) {
      var composite = partById(compositeId);
      var cds = partById(cdsId);
      if (!composite && catalog && typeof catalog.finalPanelSensing === "function") {
        composite = catalog.finalPanelSensing().filter(function (item) {
          return item.receptorKey === orKey;
        })[0];
      }
      if (!cds && composite && composite.childIds) {
        cds = partById(composite.childIds[0]);
      }
      if (!composite && radio) {
        composite = {
          id: compositeId,
          displayName: radio.getAttribute("data-name") || orKey + "-IRES-mCherry",
          lengthBp: Number(radio.getAttribute("data-bp")),
          orProteinLengthAa: Number(radio.getAttribute("data-aa")),
          rfc1000: radio.getAttribute("data-rfc") === "true",
          rfc10: "unknown",
          plasmidMap: radio.getAttribute("data-map"),
        };
      }
      if (!cds && radio) {
        cds = {
          id: cdsId,
          displayName: orKey + " CDS",
          receptorKey: orKey,
          lengthBp: Number(radio.getAttribute("data-cds-bp")),
          proteinLengthAa: Number(radio.getAttribute("data-aa")),
        };
      }
      return { orKey: orKey, composite: composite, cds: cds };
    }

    function currentSensing() {
      var selected = radios.filter(function (radio) {
        return radio.getAttribute("aria-checked") === "true";
      })[0];
      return sensingFor(
        selected ? selected.getAttribute("data-or") : currentOr,
        selected ? selected.getAttribute("data-composite") : "",
        selected ? selected.getAttribute("data-cds") : "",
        selected
      );
    }

    function setText(sel, value) {
      var el = qs(sel, root);
      if (el) el.textContent = value;
    }

    var mapCredit =
      "Team construct map. The image shows the full experimental plasmid. The registered composite is the insert, not the pcDNA3.1(+) backbone.";

    function setMapMode(mode) {
      var preview = qs("[data-map-preview]", root);
      if (!preview) return;
      if (mode !== "reporting") mode = "sensing";
      preview.setAttribute("data-map-mode", mode);
      qsa('[role="tab"][data-map-mode]', preview).forEach(function (tab) {
        var on = tab.getAttribute("data-map-mode") === mode;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.setAttribute("tabindex", on ? "0" : "-1");
      });
      var panel = qs("#map-preview-panel", preview);
      if (panel) {
        panel.setAttribute("aria-labelledby", mode === "reporting" ? "map-tab-reporting" : "map-tab-sensing");
      }

      var name;
      var id;
      var src;
      var caption;
      var alt;
      if (mode === "reporting") {
        name = "GCaMP6f-(GGGGS)3-DmOrco";
        id = "BBa_26E11Z80";
        src = "plasmid/GCaMP6f_GGGGSx3_DmOrco.png";
        caption = "Shared reporting fusion — common to every AeroSense line.";
        alt = "Compact construct map of GCaMP6f-(GGGGS)3-DmOrco (BBa_26E11Z80).";
      } else {
        var sensing = currentSensing();
        var composite = sensing.composite;
        name = composite ? composite.displayName : currentOr + "-IRES-mCherry";
        id = composite ? composite.id : "";
        src = composite && composite.plasmidMap ? composite.plasmidMap : "plasmid/" + currentOr + "_IRES_mCherry.png";
        caption = "Selected sensing cassette — only the OR module changes with the receptor buttons.";
        alt = "Compact construct map of " + name + (id ? " (" + id + ")" : "") + ".";
      }

      setText("[data-map-name]", name.replace("GCaMP6f-(GGGGS)3-DmOrco", "GCaMP6f-(GGGGS)\u2083-DmOrco"));
      setText("[data-map-id]", id);
      setText("[data-map-caption]", caption);
      var img = qs("[data-or-map]", root);
      var open = qs("[data-map-open]", root);
      if (img) {
        img.setAttribute("src", src);
        img.setAttribute("alt", alt);
      }
      if (open) {
        open.setAttribute("href", src);
        open.setAttribute("data-lightbox-src", src);
        open.setAttribute("data-lightbox-title", name + (id ? " (" + id + ")" : ""));
        open.setAttribute("data-lightbox-alt", alt.replace("Compact ", "Construct "));
        open.setAttribute("data-lightbox-caption", mapCredit);
      }
    }

    function selectReceptor(radio, announce) {
      var orKey = radio.getAttribute("data-or");
      var compositeId = radio.getAttribute("data-composite");
      var cdsId = radio.getAttribute("data-cds");
      var sensing = sensingFor(orKey, compositeId, cdsId, radio);
      var composite = sensing.composite;
      var cds = sensing.cds;

      radios.forEach(function (item) {
        var on = item === radio;
        item.setAttribute("aria-checked", on ? "true" : "false");
        item.setAttribute("aria-selected", on ? "true" : "false");
        item.setAttribute("tabindex", on ? "0" : "-1");
      });

      root.setAttribute("data-or", orKey);
      currentOr = orKey;

      if (!reduceMotion && announce) {
        root.classList.remove("is-or-changing");
        void root.offsetWidth;
        root.classList.add("is-or-changing");
        window.setTimeout(function () {
          root.classList.remove("is-or-changing");
        }, 420);
      }

      if (composite) {
        setText("[data-or-name]", composite.displayName);
        setText("[data-or-id]", composite.id);
        setText("[data-or-aa]", String(composite.orProteinLengthAa || (cds && cds.proteinLengthAa) || ""));
        setText("[data-or-bp]", formatCount(composite.lengthBp));
        setText("[data-or-rfc]", rfcDisplay(composite.rfc1000));
        setText("[data-or-rfc10]", rfcDisplay(composite.rfc10));
      }

      var cdsLabel = qs("[data-or-cds-label]", root);
      var cdsHit = qs('.parts-dna__block[data-feature="or"]', root);
      var proteinHit = qs('.parts-protein[data-feature="or"]', root);
      if (cds) {
        if (cdsLabel) cdsLabel.textContent = orKey;
        setText("[data-or-protein-label]", orKey + " protein");
        setText("[data-or-3d-label]", orKey);
        if (cdsHit) {
          cdsHit.setAttribute("href", "#part-" + cds.id);
          cdsHit.setAttribute("data-part-id", cds.id);
        }
        if (proteinHit) proteinHit.setAttribute("data-part-id", cds.id);
      } else if (cdsLabel) {
        cdsLabel.textContent = orKey;
        setText("[data-or-protein-label]", orKey + " protein");
      }

      sensor3d.setOrName(orKey);

      /* Receptor choice updates ONLY the specificity module; keep OR highlighted. */
      showFeature("or", announce);
      setMapMode("sensing");
    }

    function showFeature(feature, announce, origin) {
      var copy = featureCopy(feature, currentSensing());
      if (!copy) return;
      currentFeature = feature;
      root.setAttribute("data-feature", feature);

      featureHits.forEach(function (hit) {
        var on = hit.getAttribute("data-feature") === feature;
        if (hit.hasAttribute("aria-pressed")) {
          hit.setAttribute("aria-pressed", on ? "true" : "false");
        }
        hit.classList.toggle("is-active", on);
      });

      qsa(".parts-protein[data-feature], .parts-dna__block[data-feature]", root).forEach(function (el) {
        el.classList.toggle("is-active", el.getAttribute("data-feature") === feature);
      });

      var iresNote = qs("[data-ires-note]", root);
      if (iresNote) iresNote.hidden = feature !== "ires";

      qsa(".parts-hotspot-bar button[data-feature]", root).forEach(function (btn) {
        btn.setAttribute("tabindex", btn.getAttribute("data-feature") === feature ? "0" : "-1");
      });

      sensor3d.focus(feature);

      if (origin || announce) {
        if (copy.tableId) openPartDrawer(copy.tableId, origin || null);
        else openPartDrawer(null, origin || null, copy);
      }

      if (feature === "gcamp" || feature === "orco" || feature === "rset" || feature === "linker") {
        setMapMode("reporting");
      } else if (feature === "or" || feature === "ires" || feature === "mcherry") {
        setMapMode("sensing");
      } else if (origin) {
        if (origin.closest && origin.closest('[data-arch="reporting"]')) setMapMode("reporting");
        else if (origin.closest && origin.closest('[data-arch="sensing"]')) setMapMode("sensing");
      }
    }

    function onFeatureActivate(event, feature) {
      if (!feature) return;
      if (event) event.preventDefault();
      showFeature(feature, true, event && event.currentTarget);
    }

    radios.forEach(function (radio, index) {
      radio.addEventListener("click", function (event) {
        event.preventDefault();
        selectReceptor(radio, true);
      });
      radio.addEventListener("keydown", function (event) {
        var next = index;
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          selectReceptor(radio, true);
          return;
        }
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % radios.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
          next = (index - 1 + radios.length) % radios.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = radios.length - 1;
        else return;
        event.preventDefault();
        radios[next].focus();
        selectReceptor(radios[next], true);
      });
    });

    featureHits.forEach(function (hit) {
      hit.addEventListener("click", function (event) {
        onFeatureActivate(event, hit.getAttribute("data-feature"));
      });
      hit.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (hit.tagName === "BUTTON") return;
        event.preventDefault();
        onFeatureActivate(event, hit.getAttribute("data-feature"));
      });
    });

    qsa(".parts-hotspot-bar button[data-feature]", root).forEach(function (btn, index, tools) {
      btn.addEventListener("keydown", function (event) {
        var next = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tools.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
          next = (index - 1 + tools.length) % tools.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tools.length - 1;
        else return;
        event.preventDefault();
        tools[next].focus();
        showFeature(tools[next].getAttribute("data-feature"), true, tools[next]);
      });
    });

    if (activateBtn) {
      if (reduceMotion) {
        var wrap = activateBtn.closest(".parts-activate");
        if (wrap) wrap.hidden = true;
        activateBtn.disabled = true;
      } else {
        activateBtn.addEventListener("click", function () {
          if (activating || !mechanism) return;
          activating = true;
          mechanism.classList.remove("is-activating");
          void mechanism.offsetWidth;
          mechanism.classList.add("is-activating");
          if (activateLive) {
            activateLive.textContent =
              "Schematic activation: VOC approaches, the channel opens, calcium enters, GCaMP6f fluoresces. Not experimental data.";
          }
          window.setTimeout(function () {
            mechanism.classList.remove("is-activating");
            activating = false;
          }, 1400);
        });
      }
    }

    qsa('[role="tab"][data-map-mode]', root).forEach(function (tab) {
      tab.addEventListener("click", function () {
        setMapMode(tab.getAttribute("data-map-mode"));
      });
      tab.addEventListener("keydown", function (event) {
        var tabs = qsa('[role="tab"][data-map-mode]', root);
        var index = tabs.indexOf(tab);
        var next = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
          next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[next].focus();
        setMapMode(tabs[next].getAttribute("data-map-mode"));
      });
    });

    if (radios[0]) selectReceptor(radios[0], false);
    showFeature("or", false);

    var explodeBtn = qs("[data-3d-explode]", root);
    var membraneBtn = qs("[data-3d-membrane]", root);
    var resetBtn = qs("[data-3d-reset]", root);
    var fusionEl = qs("[data-fusion]", root);

    function setExploded(on) {
      if (explodeBtn) explodeBtn.setAttribute("aria-pressed", on ? "true" : "false");
      if (fusionEl) fusionEl.setAttribute("data-exploded", on ? "true" : "false");
      sensor3d.setExploded(on);
    }

    if (explodeBtn) {
      explodeBtn.addEventListener("click", function () {
        setExploded(explodeBtn.getAttribute("aria-pressed") !== "true");
      });
    }
    if (membraneBtn) {
      membraneBtn.addEventListener("click", function () {
        var on = membraneBtn.getAttribute("aria-pressed") !== "true";
        membraneBtn.setAttribute("aria-pressed", on ? "true" : "false");
        sensor3d.setMembrane(on);
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        sensor3d.reset();
      });
    }

    sensor3d.pick = function (feature) {
      showFeature(feature, true, qs('[data-feature="' + feature + '"]', root));
    };
  }

  function initLightbox() {
    var dlg = document.getElementById("parts-map-lightbox");
    if (!dlg) return;

    var img = qs("[data-lightbox-img]", dlg);
    var title = document.getElementById("parts-lightbox-title");
    var caption = qs("[data-lightbox-caption]", dlg);
    var lastFocus = null;

    function focusables() {
      return qsa("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", dlg).filter(
        function (el) {
          return !el.disabled && el.getAttribute("aria-hidden") !== "true";
        }
      );
    }

    function openFrom(trigger) {
      var src = trigger.getAttribute("data-lightbox-src") || trigger.getAttribute("href");
      if (!src) return;
      lastFocus = trigger;
      if (title) title.textContent = trigger.getAttribute("data-lightbox-title") || "Construct map";
      if (caption) caption.textContent = trigger.getAttribute("data-lightbox-caption") || "";
      if (img) {
        img.setAttribute("src", src);
        img.setAttribute("alt", trigger.getAttribute("data-lightbox-alt") || (title ? title.textContent : "Construct map"));
      }
      if (typeof dlg.showModal === "function") {
        if (!dlg.open) dlg.showModal();
      } else if (!dlg.hasAttribute("open")) {
        dlg.setAttribute("open", "");
      }
      var closeBtn = qs("[data-lightbox-close]", dlg);
      if (closeBtn) closeBtn.focus();
    }

    function closeDlg() {
      if (typeof dlg.close === "function" && dlg.open) dlg.close();
      else dlg.removeAttribute("open");
      if (lastFocus && typeof lastFocus.focus === "function") {
        try {
          lastFocus.focus();
        } catch (err) {
          /* ignore */
        }
      }
      lastFocus = null;
    }

    dlg.addEventListener("close", function () {
      if (lastFocus && typeof lastFocus.focus === "function") {
        try {
          lastFocus.focus();
        } catch (err) {
          /* ignore */
        }
      }
      lastFocus = null;
    });

    dlg.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeDlg();
    });

    dlg.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDlg();
        return;
      }
      if (event.key !== "Tab") return;
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (items.length === 1) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    qsa("[data-lightbox-close]", dlg).forEach(function (btn) {
      btn.addEventListener("click", closeDlg);
    });

    dlg.addEventListener("click", function (event) {
      if (event.target === dlg) closeDlg();
    });

    document.addEventListener("click", function (event) {
      if (event.defaultPrevented) return;
      if (event.button && event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var trigger = event.target.closest("[data-lightbox]");
      if (!trigger || !document.body.contains(trigger)) return;
      event.preventDefault();
      openFrom(trigger);
    });
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

  function initCatalog() {
    var root = qs("[data-parts-catalog]");
    if (!root) return;

    var searchForm = qs("[data-parts-search]", root);
    var searchInput = qs("#parts-catalog-q", root);
    var live = qs("[data-parts-catalog-live]", root);
    var empty = qs("[data-parts-empty]", root);
    var filterRoot = qs("[data-parts-filters]", root);
    var rows = qsa("[data-part-record]", root);
    var groups = qsa("[data-filter-group]", root);

    function announce(text) {
      if (!live) return;
      live.textContent = "";
      window.setTimeout(function () {
        live.textContent = text;
      }, 50);
    }

    function activePanel() {
      return qsa('[role="tabpanel"]', root).filter(function (panel) {
        return !panel.hidden;
      })[0];
    }

    function activeFilters() {
      return qsa("[data-filter][aria-pressed='true']", root).map(function (btn) {
        return btn.getAttribute("data-filter");
      });
    }

    function rowMatch(row, query, filters) {
      if (query) {
        var hay = (row.getAttribute("data-search") || "").toLowerCase();
        if (hay.indexOf(query) === -1) return false;
      }
      var i;
      for (i = 0; i < filters.length; i += 1) {
        var key = filters[i];
        if (key === "rfc10-yes" && row.getAttribute("data-rfc10") !== "yes") return false;
        if (key === "rfc10-no" && row.getAttribute("data-rfc10") !== "no") return false;
        if (key === "rfc10-unknown" && row.getAttribute("data-rfc10") !== "unknown") return false;
        if (key === "rfc1000-yes" && row.getAttribute("data-rfc1000") !== "yes") return false;
        if (key === "rfc1000-no" && row.getAttribute("data-rfc1000") !== "no") return false;
        if (key === "rfc1000-unknown" && row.getAttribute("data-rfc1000") !== "unknown") return false;
        if (key === "rfc-yes" && row.getAttribute("data-rfc1000") !== "yes" && row.getAttribute("data-rfc") !== "yes") return false;
        if (key === "rfc-no" && row.getAttribute("data-rfc1000") !== "no" && row.getAttribute("data-rfc") !== "no") return false;
        if (key === "final" && row.getAttribute("data-final-panel") !== "true") return false;
        if (key === "first-gen" && row.getAttribute("data-first-gen") !== "true") return false;
      }
      return true;
    }

    function apply(announceCount) {
      var query = searchInput ? searchInput.value.replace(/\s+/g, " ").trim().toLowerCase() : "";
      var filters = activeFilters();
      var shown = 0;
      var shownByPanel = {};

      rows.forEach(function (row) {
        var on = rowMatch(row, query, filters);
        row.hidden = !on;
        if (on) {
          shown += 1;
          var panel = row.closest('[role="tabpanel"]');
          if (panel && panel.id) shownByPanel[panel.id] = (shownByPanel[panel.id] || 0) + 1;
        }
      });

      qsa("tbody[data-family]", root).forEach(function (tbody) {
        var visible = qsa(".parts-catalog__row", tbody).some(function (row) {
          return !row.hidden;
        });
        var group = qs(".parts-catalog__group", tbody);
        if (group) group.hidden = !visible;
        tbody.hidden = !visible;
      });

      var panel = activePanel();
      var here = panel && shownByPanel[panel.id] ? shownByPanel[panel.id] : 0;
      if (empty) {
        empty.hidden = here !== 0;
        if (here === 0) {
          var hints = [];
          qsa('[role="tab"]', root).forEach(function (tab) {
            var id = tab.getAttribute("aria-controls");
            if (id && shownByPanel[id] && (!panel || id !== panel.id)) {
              hints.push(shownByPanel[id] + " in " + tab.textContent.replace(/\s+/g, " ").trim());
            }
          });
          empty.textContent = hints.length
            ? "No parts match in this view. " + hints.join("; ") + "."
            : filters.indexOf("rfc10-yes") !== -1
              ? "No parts in this view are recorded as RFC 10 compatible. RFC 10 stays Unknown unless independently verified."
              : "No parts match this search or filter.";
        }
      }

      if (announceCount) {
        announce(here + " part" + (here === 1 ? "" : "s") + " shown in this view.");
      }
    }

    function showFilterGroup(setName) {
      groups.forEach(function (group) {
        var name = group.getAttribute("data-filter-group");
        var on = name === "rfc" || name === setName;
        group.hidden = !on;
        if (!on && name !== "rfc") {
          qsa("[data-filter]", group).forEach(function (btn) {
            btn.setAttribute("aria-pressed", "false");
          });
        }
      });
    }

    function exclusivePress(btn) {
      var pack = btn.parentElement;
      if (!pack) return;
      qsa("[data-filter]", pack).forEach(function (other) {
        if (other !== btn) other.setAttribute("aria-pressed", "false");
      });
      var on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }

    function syncFiltersToTab() {
      var panel = activePanel();
      var setName = panel ? panel.getAttribute("data-filter-set") : "none";
      showFilterGroup(setName === "none" ? "" : setName);
    }

    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        apply(true);
      });
    }
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        apply(false);
      });
    }

    qsa("[data-filter]", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.closest('[data-filter-group="rfc"]')) {
          var pressed = btn.getAttribute("aria-pressed") !== "true";
          btn.setAttribute("aria-pressed", pressed ? "true" : "false");
        } else {
          exclusivePress(btn);
        }
        apply(true);
      });
    });

    root.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-copy-id]");
      if (!btn || !root.contains(btn)) return;
      var id = btn.getAttribute("data-copy-id");
      if (!id) return;
      copyText(id).then(
        function () {
          announce("Copied " + id);
        },
        function () {
          announce("Copy failed. Select the Registry ID and copy it manually.");
        }
      );
    });

    qsa('[role="tab"]', root).forEach(function (tab) {
      tab.addEventListener("click", function () {
        window.setTimeout(function () {
          syncFiltersToTab();
          apply(false);
        }, 0);
      });
      tab.addEventListener("keydown", function () {
        window.setTimeout(function () {
          syncFiltersToTab();
          apply(false);
        }, 0);
      });
    });

    function ensureVisible(el) {
      if (searchInput) searchInput.value = "";
      qsa("[data-filter]", root).forEach(function (btn) {
        btn.setAttribute("aria-pressed", "false");
      });
      syncFiltersToTab();
      apply(false);
      if (el && el.hidden) el.hidden = false;
    }

    syncFiltersToTab();
    apply(false);

    initCatalog.ensureVisible = ensureVisible;
    initCatalog.apply = apply;
  }

  function initSensor3D() {
    var host = qs("[data-parts-3d]");
    var canvas = qs("[data-parts-3d-canvas]");
    var fallback = qs("[data-parts-3d-fallback]");
    if (!host || !canvas) return;

    var exploded = false;
    var showMembrane = true;
    var currentFocus = "or";
    var orName = "Or7a";
    var disposed = false;

    function fail() {
      canvas.hidden = true;
      if (fallback) fallback.hidden = false;
    }

    var scriptEl = document.querySelector('script[src$="js/parts.js"]');
    var base = scriptEl && scriptEl.src ? scriptEl.src : window.location.href;
    var threeUrl = new URL("vendor/three.module.js", base).href;

    import(threeUrl)
      .then(function (THREE) {
        if (!window.WebGLRenderingContext) {
          fail();
          return;
        }

        var renderer;
        try {
          renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: !reduceMotion,
            alpha: true,
            powerPreference: "low-power",
          });
        } catch (err) {
          fail();
          return;
        }
        if (!renderer.getContext()) {
          fail();
          return;
        }

        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, reduceMotion ? 1 : 2));

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
        var theta = 0.55;
        var phi = 1.15;
        var radius = 9;
        var target = new THREE.Vector3(0, 0.35, 0);

        function placeCamera() {
          camera.position.set(
            target.x + radius * Math.sin(phi) * Math.cos(theta),
            target.y + radius * Math.cos(phi),
            target.z + radius * Math.sin(phi) * Math.sin(theta)
          );
          camera.lookAt(target);
        }
        placeCamera();

        scene.add(new THREE.HemisphereLight(0xf3efe6, 0x3a4a3a, 0.9));
        var key = new THREE.DirectionalLight(0xffffff, 0.85);
        key.position.set(4, 8, 6);
        scene.add(key);
        var fill = new THREE.DirectionalLight(0xcde8ff, 0.25);
        fill.position.set(-6, 2, -4);
        scene.add(fill);

        function mat(color, opts) {
          opts = opts || {};
          return new THREE.MeshStandardMaterial({
            color: color,
            roughness: opts.roughness != null ? opts.roughness : 0.45,
            metalness: opts.metalness != null ? opts.metalness : 0.05,
            transparent: !!opts.transparent,
            opacity: opts.opacity != null ? opts.opacity : 1,
            side: opts.side || THREE.FrontSide,
            emissive: opts.emissive || 0x000000,
            emissiveIntensity: opts.emissiveIntensity || 0,
          });
        }

        function helixBundle(color) {
          var group = new THREE.Group();
          var geo = new THREE.CylinderGeometry(0.11, 0.11, 2.35, 10);
          var material = mat(color);
          var i;
          for (i = 0; i < 7; i += 1) {
            var mesh = new THREE.Mesh(geo, material);
            var a = (i / 7) * Math.PI * 2;
            mesh.position.set(Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36);
            group.add(mesh);
          }
          return group;
        }

        function globular(color, sx, sy, sz) {
          var mesh = new THREE.Mesh(new THREE.SphereGeometry(0.72, 28, 20), mat(color, { roughness: 0.35 }));
          mesh.scale.set(sx || 1.15, sy || 0.9, sz || 1);
          return mesh;
        }

        var pickables = [];

        function mark(object, feature) {
          object.traverse(function (child) {
            if (child.isMesh) {
              child.userData.feature = feature;
              pickables.push(child);
            }
          });
        }

        var orGroup = helixBundle(0x1f2a24);
        orGroup.position.set(-2.55, 0, 0);
        mark(orGroup, "or");
        scene.add(orGroup);

        var mcherry = globular(0x9c3d3d, 1, 0.85, 0.95);
        mcherry.position.set(-2.55, 2.05, 0.35);
        mark(mcherry, "mcherry");
        scene.add(mcherry);

        var fusion = new THREE.Group();
        fusion.position.set(1.55, 0, 0);
        scene.add(fusion);

        var gcamp = globular(0x2f7d4a, 1.2, 0.95, 1.05);
        gcamp.position.set(0, 1.55, 0);
        mark(gcamp, "gcamp");
        fusion.add(gcamp);

        var linkerCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 1.05, 0),
          new THREE.Vector3(0.55, 0.7, 0.25),
          new THREE.Vector3(0.15, 0.28, 0),
        ]);
        var linker = new THREE.Mesh(
          new THREE.TubeGeometry(linkerCurve, 24, 0.07, 8, false),
          mat(0x7a7468, { roughness: 0.7 })
        );
        mark(linker, "linker");
        fusion.add(linker);

        var orco = helixBundle(0x8a5a18);
        orco.position.set(0.15, 0, 0);
        mark(orco, "orco");
        fusion.add(orco);

        var rest = {
          gcamp: gcamp.position.clone(),
          linker: linker.position.clone(),
          orco: orco.position.clone(),
        };

        var membrane = new THREE.Group();
        var slabMat = mat(0x6a9bb8, { transparent: true, opacity: 0.22, side: THREE.DoubleSide, roughness: 0.8 });
        var plane = new THREE.PlaneGeometry(8.4, 5.2);
        var top = new THREE.Mesh(plane, slabMat);
        var bot = new THREE.Mesh(plane, slabMat.clone());
        top.rotation.x = -Math.PI / 2;
        bot.rotation.x = -Math.PI / 2;
        top.position.y = 0.16;
        bot.position.y = -0.16;
        membrane.add(top);
        membrane.add(bot);
        scene.add(membrane);

        var materials = [];
        scene.traverse(function (child) {
          if (child.isMesh && child.material) materials.push(child.material);
        });

        function applyExplode(on) {
          exploded = on;
          var dx = on ? 1.15 : 0;
          if (reduceMotion) {
            gcamp.position.set(rest.gcamp.x, rest.gcamp.y + (on ? 1.35 : 0), rest.gcamp.z);
            linker.position.set(rest.linker.x + (on ? 0.35 : 0), rest.linker.y + (on ? 0.55 : 0), rest.linker.z);
            orco.position.set(rest.orco.x + (on ? 0.85 : 0), rest.orco.y, rest.orco.z);
            return;
          }
          gcamp.userData.goal = new THREE.Vector3(rest.gcamp.x, rest.gcamp.y + (on ? 1.35 : 0), rest.gcamp.z);
          linker.userData.goal = new THREE.Vector3(rest.linker.x + (on ? 0.35 : 0), rest.linker.y + (on ? 0.55 : 0), rest.linker.z);
          orco.userData.goal = new THREE.Vector3(rest.orco.x + dx * 0.75, rest.orco.y, rest.orco.z);
        }

        function applyFocus(feature) {
          currentFocus = feature;
          materials.forEach(function (m) {
            if (!m.emissive) return;
            m.emissive.setHex(0x000000);
            m.emissiveIntensity = 0;
          });
          pickables.forEach(function (mesh) {
            if (mesh.userData.feature === feature && mesh.material && mesh.material.emissive) {
              mesh.material.emissive.setHex(0xc9a227);
              mesh.material.emissiveIntensity = 0.28;
            }
          });
        }

        function size() {
          var w = host.clientWidth || 640;
          var h = Math.max(280, Math.round(w * 0.52));
          renderer.setSize(w, h, false);
          canvas.style.width = "100%";
          canvas.style.height = h + "px";
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }
        size();
        if (typeof ResizeObserver === "function") {
          new ResizeObserver(size).observe(host);
        } else {
          window.addEventListener("resize", size);
        }

        var raycaster = new THREE.Raycaster();
        var pointer = new THREE.Vector2();
        var dragging = false;
        var moved = false;
        var lastX = 0;
        var lastY = 0;
        var pointers = {};

        function ndc(event) {
          var rect = canvas.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        }

        function pick(event) {
          ndc(event);
          raycaster.setFromCamera(pointer, camera);
          var hits = raycaster.intersectObjects(pickables, false);
          if (!hits.length) return;
          var feature = hits[0].object.userData.feature;
          if (!feature) return;
          applyFocus(feature);
          if (typeof sensor3d.pick === "function") sensor3d.pick(feature);
        }

        canvas.addEventListener("pointerdown", function (event) {
          canvas.setPointerCapture(event.pointerId);
          pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
          dragging = true;
          moved = false;
          lastX = event.clientX;
          lastY = event.clientY;
        });
        canvas.addEventListener("pointermove", function (event) {
          if (pointers[event.pointerId]) {
            pointers[event.pointerId].x = event.clientX;
            pointers[event.pointerId].y = event.clientY;
          }
          var ids = Object.keys(pointers);
          if (ids.length === 2) {
            var a = pointers[ids[0]];
            var b = pointers[ids[1]];
            var dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (canvas._pinch == null) canvas._pinch = dist;
            var delta = dist - canvas._pinch;
            canvas._pinch = dist;
            radius = Math.min(16, Math.max(5, radius - delta * 0.02));
            placeCamera();
            return;
          }
          if (!dragging) return;
          var dx = event.clientX - lastX;
          var dy = event.clientY - lastY;
          if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
          lastX = event.clientX;
          lastY = event.clientY;
          theta += dx * 0.008;
          phi = Math.min(Math.PI - 0.2, Math.max(0.2, phi - dy * 0.008));
          placeCamera();
        });
        function endPointer(event) {
          delete pointers[event.pointerId];
          canvas._pinch = null;
          if (!dragging) return;
          dragging = false;
          if (!moved) pick(event);
        }
        canvas.addEventListener("pointerup", endPointer);
        canvas.addEventListener("pointercancel", endPointer);
        canvas.addEventListener(
          "wheel",
          function (event) {
            event.preventDefault();
            radius = Math.min(16, Math.max(5, radius + event.deltaY * 0.01));
            placeCamera();
          },
          { passive: false }
        );

        var visible = true;
        if (typeof IntersectionObserver === "function") {
          new IntersectionObserver(function (entries) {
            visible = entries[0] && entries[0].isIntersecting;
          }, { threshold: 0.05 }).observe(host);
        }

        function tick() {
          if (disposed) return;
          requestAnimationFrame(tick);
          if (!visible) return;
          [gcamp, linker, orco].forEach(function (obj) {
            if (!obj.userData.goal) return;
            obj.position.lerp(obj.userData.goal, reduceMotion ? 1 : 0.12);
          });
          renderer.render(scene, camera);
        }
        tick();

        sensor3d.focus = applyFocus;
        sensor3d.setExploded = applyExplode;
        sensor3d.setMembrane = function (on) {
          showMembrane = !!on;
          membrane.visible = showMembrane;
        };
        sensor3d.reset = function () {
          theta = 0.55;
          phi = 1.15;
          radius = 9;
          placeCamera();
        };
        sensor3d.setOrName = function (name) {
          orName = name || "OR";
          var label = qs("[data-or-3d-label]");
          if (label) label.textContent = orName;
        };
        applyFocus(currentFocus);
      })
      .catch(function () {
        fail();
      });

    sensor3d.pick = sensor3d.pick || function () {};
  }

  function initMetrics() {
    if (!catalog || typeof catalog.validateCounts !== "function") return;
    var result = catalog.validateCounts();
    if (!result || !result.counts) return;
    qsa("[data-count]").forEach(function (el) {
      var key = el.getAttribute("data-count");
      if (key && typeof result.counts[key] === "number") {
        el.textContent = String(result.counts[key]);
      }
    });
  }

  function initDrawer() {
    var dlg = document.getElementById("parts-drawer");
    var catalogRoot = qs("[data-parts-catalog]");
    if (!dlg || !catalogRoot) return;

    var lastFocus = null;
    var litLabels = {
      "voc-responsive-overlap": "Literature: VOC-responsive HEK293 overlap (Zboray et al.) — not AeroSense data",
      "expressed-vuaa1-no-voc": "Literature: expressed / VUAA1-responsive, no VOC panel response (Zboray et al.) — not AeroSense data",
      "not-in-zboray-hek293-set": "No matching Zboray HEK293 VOC-panel note for this receptor",
    };

    function setDrawer(sel, value) {
      var el = qs(sel, dlg);
      if (el) el.textContent = value || "—";
    }

    function evidenceFor(part) {
      if (!part) return "Pending — no AeroSense characterization claimed on this page";
      if (part.characterization) return String(part.characterization);
      if (part.hek293Literature && part.hek293Literature.aerosenseCharacterization === false) {
        return "Pending — AeroSense assay data not claimed; see literature note";
      }
      return "Pending — no AeroSense characterization claimed on this page";
    }

    function litFor(part) {
      if (!part || !part.hek293Literature) return "No literature note attached in the collection index";
      var status = part.hek293Literature.status;
      return litLabels[status] || part.hek293Literature.source || "Literature note present";
    }

    function reuseFor(part) {
      if (!part) return "—";
      if (part.reuseRationale) return part.reuseRationale;
      if (part.rejectedAlternateNote) return part.rejectedAlternateNote;
      if (part.category === "reused") return "Reused Registry part — see catalogue row";
      if (part.firstGeneration) return "First-generation / traceability entry — not a final-panel sensing composite";
      if (part.biologicalRole === "sensing-module") {
        return "Swap this OR module; keep shared reporting cassette BBa_26E11Z80";
      }
      if (part.biologicalRole === "reporting-module") {
        return "Shared across all nine sensing lines — do not treat as receptor-specific";
      }
      return "See Reuse & QC for collection-level caveats";
    }

    function roleFor(part) {
      if (!part) return "—";
      if (part.shortDescription) return part.shortDescription;
      return (part.biologicalRole || part.signalLayer || part.category || "—").toString();
    }

    function sequenceFor(part) {
      if (part && part.registryUrl) return part.registryUrl;
      var portal =
        catalog && catalog.COLLECTION && catalog.COLLECTION.registryPortalUrl
          ? catalog.COLLECTION.registryPortalUrl
          : "https://registry.igem.org/";
      return "Sequence: iGEM Registry is the source of record. No verified per-part Registry URL is recorded on this wiki. Portal: " + portal;
    }

    function dnaLength(part) {
      if (!part || typeof part.lengthBp !== "number") return "—";
      return formatCount(part.lengthBp) + " bp";
    }

    function proteinLength(part) {
      if (!part) return "Not a protein product";
      if (typeof part.proteinLengthAa === "number") return part.proteinLengthAa + " aa";
      if (typeof part.orProteinLengthAa === "number") return part.orProteinLengthAa + " aa (OR CDS)";
      if (part.biologicalRole === "ires" || part.id === "BBa_K5490030") return "Not a protein product";
      if (part.biologicalRole === "expression-marker" || part.id === "BBa_K4177005") {
        return "Separate polypeptide — amino-acid length not recorded in this index";
      }
      if (part.category === "composite" && part.biologicalRole === "sensing-module") {
        return "Two polypeptides (OR + mCherry); see child CDS parts";
      }
      return "—";
    }

    function openPart(partId, trigger, annotation) {
      var part = partId ? partById(partId) : null;
      lastFocus = trigger || null;
      var title = qs("#parts-drawer-title", dlg);
      var name = (part && part.displayName) || (annotation && annotation.title) || partId || "Part detail";
      if (title) title.textContent = name;
      setDrawer("[data-drawer-name]", name);
      setDrawer("[data-drawer-id]", (part && part.id) || (annotation && annotation.id) || partId || "Not a registered part");
      setDrawer("[data-drawer-type]", part ? typeLabel(part) : (annotation && annotation.role) || "Architecture annotation");
      setDrawer("[data-drawer-dna]", part ? dnaLength(part) : (annotation && annotation.length) || "—");
      setDrawer(
        "[data-drawer-protein]",
        part ? proteinLength(part) : annotation && /IRES/i.test(annotation.title || "")
          ? "Not a protein product"
          : "Not a protein product"
      );
      setDrawer("[data-drawer-role]", part ? roleFor(part) : (annotation && (annotation.body || annotation.role)) || "—");
      setDrawer("[data-drawer-rfc10]", part ? rfcDisplay(part.rfc10) : "Unknown");
      setDrawer("[data-drawer-rfc]", part ? rfcDisplay(part.rfc1000) : "Unknown");
      if (part && part.rfc1000Note) {
        setDrawer("[data-drawer-rfc]", rfcDisplay(part.rfc1000) + " · " + part.rfc1000Note);
      }
      setDrawer("[data-drawer-used]", part ? usedInLabel(part) || (annotation && annotation.used) || "—" : (annotation && annotation.used) || "—");
      setDrawer("[data-drawer-sequence]", part ? sequenceFor(part) : "Not a registered part — no Registry sequence page.");
      setDrawer("[data-drawer-evidence]", part ? evidenceFor(part) : "Architecture annotation — not an experimental result");
      setDrawer("[data-drawer-lit]", part ? litFor(part) : "—");
      setDrawer("[data-drawer-reuse]", part ? reuseFor(part) : (annotation && annotation.body) || "—");

      if (typeof dlg.showModal === "function") {
        if (!dlg.open) dlg.showModal();
      } else {
        dlg.setAttribute("open", "");
      }
      var closeBtn = qs("[data-parts-drawer-close]", dlg);
      if (closeBtn) closeBtn.focus();
    }

    openPartDrawer = openPart;

    function closeDlg() {
      if (typeof dlg.close === "function" && dlg.open) dlg.close();
      else dlg.removeAttribute("open");
      if (lastFocus && typeof lastFocus.focus === "function") {
        try {
          lastFocus.focus();
        } catch (err) {
          /* ignore */
        }
      }
      lastFocus = null;
    }

    qsa("[data-parts-drawer-close]", dlg).forEach(function (btn) {
      btn.addEventListener("click", closeDlg);
    });
    dlg.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeDlg();
    });
    dlg.addEventListener("click", function (event) {
      if (event.target === dlg) closeDlg();
    });

    catalogRoot.addEventListener("click", function (event) {
      if (event.target.closest("[data-copy-id]")) return;
      if (event.target.closest("a[href]")) return;
      var row = event.target.closest("[data-part-record]");
      if (!row || !catalogRoot.contains(row)) return;
      var id = row.getAttribute("data-part-id");
      if (!id) return;
      openPart(id, row);
    });

    catalogRoot.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target.closest("[data-copy-id], a, button, input")) return;
      var row = event.target.closest("[data-part-record]");
      if (!row || !catalogRoot.contains(row)) return;
      event.preventDefault();
      openPart(row.getAttribute("data-part-id"), row);
    });

    qsa("[data-part-record]", catalogRoot).forEach(function (row) {
      if (!row.hasAttribute("tabindex")) row.setAttribute("tabindex", "0");
      row.setAttribute("aria-haspopup", "dialog");
    });
  }

  initMetrics();
  initCollectionTabs();
  initExplorer();
  initCatalog();
  initDrawer();
  initSensor3D();
  initLightbox();
  if (location.hash) {
    window.dispatchEvent(new Event("hashchange"));
  }
})();

