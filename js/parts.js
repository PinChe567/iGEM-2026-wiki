/**
 * Parts page — collection tabs and the Build-an-AeroSense-Sensor explorer.
 * Progressive enhancement: without JS, architectures, tables, and part anchors remain usable.
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
        role: "Cap-independent re-initiation of mCherry",
        used: "All nine final-panel sensing composites",
        body: "Reused Registry part. After the OR CDS stops, the IRES restarts translation so mCherry is a separate polypeptide — not fused to the receptor.",
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
        caption = "Shared reporting fusion in pcDNA3.1(+). Common to every AeroSense line.";
        alt = "Compact construct map of GCaMP6f-(GGGGS)3-DmOrco (BBa_26E11Z80).";
      } else {
        var sensing = currentSensing();
        var composite = sensing.composite;
        name = composite ? composite.displayName : currentOr + "-IRES-mCherry";
        id = composite ? composite.id : "";
        src = composite && composite.plasmidMap ? composite.plasmidMap : "plasmid/" + currentOr + "_IRES_mCherry.png";
        caption =
          "Experimental plasmid of the selected sensing cassette in pcDNA3.1(+). Only this preview changes with the receptor.";
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
        setText("[data-or-rfc]", composite.rfc1000 ? "Yes" : "No");
      }

      var cdsLabel = qs("[data-or-cds-label]", root);
      var cdsHit = qs('.construct-map__hit[data-feature="or"]', root);
      if (cds) {
        if (cdsLabel) cdsLabel.textContent = cds.displayName;
        if (cdsHit) {
          cdsHit.setAttribute("href", "#part-" + cds.id);
          cdsHit.setAttribute("data-part-id", cds.id);
        }
      }

      if (currentFeature === "or") showFeature("or", announce);
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

      qsa(".parts-hotspot-bar button[data-feature]", root).forEach(function (btn) {
        btn.setAttribute("tabindex", btn.getAttribute("data-feature") === feature ? "0" : "-1");
      });

      setText("[data-insp-title]", copy.title);
      var idEl = qs("[data-insp-id]", root);
      if (idEl) {
        idEl.textContent = copy.id || "Not a registered part";
        idEl.hidden = false;
      }
      setText("[data-insp-length]", copy.length);
      setText("[data-insp-role]", copy.role);
      setText("[data-insp-used]", copy.used);
      setText("[data-insp-body]", copy.body);

      var reuse = qs("[data-insp-reuse]", root);
      if (reuse) reuse.hidden = !copy.reuse;

      var topo = qs("[data-insp-topo]", root);
      if (topo) topo.hidden = !copy.topo;

      var table = qs("[data-insp-table]", root);
      if (table) {
        if (copy.tableId) {
          table.hidden = false;
          table.setAttribute("href", "#part-" + copy.tableId);
          table.textContent = "View in collection table";
        } else {
          table.hidden = true;
          table.removeAttribute("href");
        }
        var jumpWrap = table.parentElement;
        if (jumpWrap && jumpWrap.classList.contains("parts-inspector__jump")) {
          jumpWrap.hidden = !copy.tableId;
        }
      }

      var registry = qs("[data-insp-registry]", root);
      if (registry) {
        if (copy.registryUrl) {
          registry.hidden = false;
          registry.innerHTML =
            '<a class="btn" href="' +
            copy.registryUrl +
            '" rel="noopener noreferrer">Open Registry entry</a>';
        } else {
          registry.hidden = true;
          registry.innerHTML = "";
        }
      }

      if (feature === "gcamp" || feature === "orco" || feature === "rset" || feature === "linker") {
        setMapMode("reporting");
      } else if (feature === "or" || feature === "ires" || feature === "mcherry") {
        setMapMode("sensing");
      } else if (origin) {
        if (origin.closest && origin.closest("#map-reporting")) setMapMode("reporting");
        else if (origin.closest && origin.closest("#map-sensing")) setMapMode("sensing");
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
        if (key === "rfc-yes" && row.getAttribute("data-rfc") !== "yes") return false;
        if (key === "rfc-no" && row.getAttribute("data-rfc") !== "no") return false;
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
            : "No parts match this search or filter.";
        }
      }

      if (announceCount) {
        announce(here + " part" + (here === 1 ? "" : "s") + " shown in this view.");
      }
    }

    function showFilterGroup(setName) {
      groups.forEach(function (group) {
        var on = group.getAttribute("data-filter-group") === setName;
        group.hidden = !on;
        if (!on) {
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
        exclusivePress(btn);
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

  initMetrics();
  initCollectionTabs();
  initExplorer();
  initCatalog();
  initLightbox();
  if (location.hash) {
    window.dispatchEvent(new Event("hashchange"));
  }
})();

