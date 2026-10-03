/**
 * AeroSense glossary — accessible term popovers.
 * Short, plain-language definitions for readers throughout the wiki.
 */
/* The decorative definition-orb geometry below is adapted from thinking-orbs,
 * src/engine/core.ts and src/engine/orbits.ts, by Jakub Antalik.
 * https://github.com/Jakubantalik/thinking-orbs
 *
 * MIT License
 * Copyright (c) 2026 Jakub Antalik
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
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
      term: "Odorant receptor (OR)",
      def: "An insect receptor protein that helps turn binding by an odor molecule into a cellular signal, usually in partnership with Orco.",
    },
    orco: {
      term: "Orco",
      def: "Odorant receptor co-receptor — an insect co-receptor that partners with ORs to form ligand-gated ion channels.",
    },
    drosophila: {
      term: "Drosophila",
      def: "A genus of flies. The fruit fly Drosophila melanogaster is a source of well-studied odorant receptors and inspired the project's sensing and coding designs.",
    },
    vuaa1: {
      term: "VUAA1",
      def: "A synthetic compound used to activate Orco-containing insect odorant-receptor channels; useful as a pathway control.",
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
      def: "A family of genetically encoded fluorescent reporters that become brighter when calcium inside a cell rises.",
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
    cfd: { term: "CFD", def: "Computational fluid dynamics — numerical calculations of fluid motion, used here to compare airflow and pressure through the reader." },
    "monte-carlo": { term: "Monte Carlo simulation", def: "A numerical method that follows many randomly sampled events. In the optical model, simulated photon paths estimate how much light reaches the detector." },
    fluence: { term: "Optical fluence", def: "Light energy incident per unit area, integrated over time. In a steady optical calculation, the corresponding fluence rate describes light power per unit area arriving from all directions." },
    "quantum-yield": { term: "Fluorescence quantum yield", def: "The ratio of emitted fluorescence photons to absorbed excitation photons. It describes emission efficiency, not how much light the detector collects." },
    responsivity: { term: "Photodiode responsivity", def: "Photocurrent produced per unit of incident optical power, usually expressed in amperes per watt. It depends on the wavelength of the light." },
    ldo: { term: "LDO", def: "Low-dropout regulator — a circuit that maintains a regulated supply voltage with a small required voltage difference between input and output." },
    sar: { term: "SAR ADC", def: "Successive-approximation-register analog-to-digital converter — a converter that determines a voltage's digital value through a sequence of comparisons." },
    gpio: { term: "GPIO", def: "General-purpose input/output — programmable microcontroller pins that read or drive digital signals." },
    dds: { term: "DDS", def: "Direct digital synthesis — generating a periodic waveform using a digital phase accumulator and a reference clock." },
    "iq-demodulation": { term: "I/Q demodulation", def: "Comparing a measured signal with two reference waves separated by a quarter cycle. Their in-phase and quadrature components describe the signal's amplitude and phase at a selected frequency." },
    "high-impedance": { term: "High impedance", def: "A large opposition to current flow. In a photodiode receiver, high-impedance input nodes require careful layout because small leakage currents can interfere with the measured signal." },
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
      def: "Printed circuit board — the physical board that connects electronic components. A CAD layout is a board design, not proof that a board was manufactured.",
    },
    spi: {
      term: "SPI",
      def: "Serial Peripheral Interface — a synchronous serial bus commonly used between a microcontroller and peripherals such as ADCs.",
    },
    "e-nose": { term: "Electronic nose", def: "An instrument that combines chemical sensors and pattern analysis to distinguish odor mixtures." },
    "headspace": { term: "Headspace", def: "The gas above a liquid or solid sample; volatile molecules from the sample may enter this space." },
    "aflatoxin": { term: "Aflatoxin", def: "A family of mycotoxins produced by some Aspergillus fungi. Detecting an odor associated with a fungus does not measure toxin concentration." },
    "indole": { term: "Indole", def: "A volatile organic compound that can occur in microbial metabolism; a signal of indole alone cannot identify a pathogen." },
    "or49b": { term: "Or49b", def: "A fruit-fly odorant receptor considered in the project's receptor library for indole-related sensing research." },
    "fluorescence": { term: "Fluorescence", def: "Light emitted by a molecule after it absorbs light at another wavelength. AeroSense uses a calcium-sensitive fluorescent reporter in its sensing design." },
    "photodiode": { term: "Photodiode", def: "An electronic component that converts incoming light into a small electrical current." },
    "excitation": { term: "Excitation light", def: "Light used to stimulate a fluorescent reporter; it must be separated from the weaker light emitted by the reporter." },
    "detection-limit": { term: "Detection limit", def: "The lowest signal or concentration that a specified method can reliably distinguish from its blank under stated conditions." },
    "snr": { term: "SNR", def: "Signal-to-noise ratio — how large the useful signal is compared with unwanted variation or background." },
    "dark-noise": { term: "Dark noise", def: "Electrical output from a light-detection system even when no intended light reaches its sensor." },
    "calibration": { term: "Calibration", def: "Comparing an instrument with a known reference so its response can be interpreted or corrected." },
    "bom": { term: "BOM", def: "Bill of materials — the list of parts, quantities, and specifications needed to build a device." },
    "drc": { term: "DRC", def: "Design-rule check — software checks whether a PCB layout follows specified spacing and manufacturing rules." },
    "erc": { term: "ERC", def: "Electrical-rule check — software checks for possible connection mistakes in a circuit schematic." },
    "kicad": { term: "KiCad", def: "Open-source software for designing circuit schematics and printed circuit boards." },
    "esp32": { term: "ESP32", def: "A family of microcontrollers that can control electronics and process data on a compact board." },
    "gc-ms": { term: "GC–MS", def: "Gas chromatography–mass spectrometry — a laboratory method that separates volatile compounds and helps identify them by mass." },
    "lc-ms": { term: "LC–MS", def: "Liquid chromatography–mass spectrometry — a laboratory method that separates compounds in a liquid sample and analyzes their masses." },
    "screening": { term: "Screening", def: "An early check that identifies samples needing closer attention. A screening result is not a certified safety verdict." },
    "confirmatory": { term: "Confirmatory testing", def: "A follow-up test using an appropriate validated method to investigate a screening signal." },
    "risk-tier": { term: "Risk tier", def: "A category such as low, medium, or high used to guide the next action; it is not a direct measurement of food safety." },
    "false-positive": { term: "False positive", def: "A test flags a problem when the reference condition says that problem is absent." },
    "false-negative": { term: "False negative", def: "A test misses a problem that the reference condition says is present." },
    "sensitivity": { term: "Sensitivity", def: "In electronics, how strongly a device responds to a small input. In classification, the proportion of true positives correctly detected. The intended meaning needs context." },
    "specificity": { term: "Specificity", def: "In sensing, how selectively a system responds to a target. In classification, the proportion of true negatives correctly identified." },
    "f1-score": { term: "F1 score", def: "A classification score combining precision and recall. Its meaning depends on the dataset and evaluation split." },
    "cross-validation": { term: "Cross-validation", def: "Evaluating a model across multiple training/test splits to estimate how it performs on unseen data." },
    "data-leakage": { term: "Data leakage", def: "Information from the test set enters model training, making performance appear better than it would be on truly new data." },
    "confusion-matrix": { term: "Confusion matrix", def: "A table comparing predicted classes with reference labels, including correct and incorrect decisions." },
    "baseline-model": { term: "Baseline model", def: "A simple comparison method used to judge whether a more complex model actually adds value." },
    "dbtlr": { term: "DBTLR", def: "Design → Build → Test → Learn → Redesign: a cycle that records a decision, its test, what was learned, and the next change." },
    "ihp": { term: "Integrated Human Practices", def: "The way stakeholder input changes a project's choices throughout development, with the change and its evidence documented." },
    "sdg": { term: "SDG", def: "United Nations Sustainable Development Goal — a shared framework for describing social and environmental aims, not proof that an aim has been achieved." },
    "b2b": { term: "B2B", def: "Business-to-business: a product or service sold to an organization rather than directly to individual consumers." },
    "beachhead": { term: "Beachhead market", def: "The first narrowly defined customer group and use case a team chooses to test before expanding." },
    "mvp": { term: "MVP", def: "Minimum viable product — the smallest usable product that can test a specific customer need." },
    "tam": { term: "TAM", def: "Total addressable market — the broadest plausible market for a defined product, under stated assumptions." },
    "sam": { term: "SAM", def: "Serviceable available market — the part of TAM the product could realistically serve given its scope and geography." },
    "som": { term: "SOM", def: "Serviceable obtainable market — the share a team could plausibly capture within a stated period and sales plan." },
    "fiti": { term: "FITI", def: "Taiwan's From IP to IPO innovation and entrepreneurship program, which provided business-plan and pitch feedback to the team." },
    "willingness-to-pay": { term: "Willingness to pay", def: "How much a specified buyer would pay for a defined solution; it must be tested with the actual buyer, not inferred from general interest." },
    "lca": { term: "Life-cycle assessment", def: "A method for estimating environmental impacts across a product's materials, manufacture, use, and disposal." },
    "registry": { term: "iGEM Registry", def: "The shared database where teams document biological parts, including their identity, sequence, and characterization." },
    "part-collection": { term: "Part collection", def: "A coordinated set of biological parts with a clear purpose and documentation showing how the parts work together." },
    "cds": { term: "CDS", def: "Coding sequence — the DNA segment whose information is translated into a protein." },
    "cmv": { term: "CMV promoter", def: "A promoter derived from cytomegalovirus that is commonly used to drive gene expression in mammalian cells." },
    "kozak": { term: "Kozak sequence", def: "A short sequence around a start codon that helps a mammalian ribosome begin protein translation." },
    "mcherry": { term: "mCherry", def: "A red fluorescent protein used here as an expression marker; it is distinct from the calcium-sensitive sensing readout." },
    "pcdna": { term: "pcDNA3.1(+) plasmid", def: "A mammalian expression plasmid that carries inserted DNA and regulatory elements needed for expression in cultured cells." },
    "plasmid": { term: "Plasmid", def: "A circular DNA molecule used as a carrier for genes or other genetic elements in an experiment." },
    "composite-part": { term: "Composite part", def: "A genetic construct assembled from multiple functional DNA elements to perform a defined role." },
    "rfc10": { term: "RFC 10", def: "An iGEM BioBrick assembly standard. Compatibility with it must be checked independently of other standards." },
    "codon-optimization": { term: "Codon optimization", def: "Changing a gene's DNA codons while preserving its protein sequence, often to suit the expression host." },
    "sanger": { term: "Sanger sequencing", def: "A DNA sequencing method often used to verify a cloned sequence or junction." },
    "bsai": { term: "BsaI", def: "A type IIS restriction enzyme used in some DNA assembly workflows; an internal site can interfere with that assembly method." },
    "ionomycin": { term: "Ionomycin", def: "A compound that raises intracellular calcium and can test whether a calcium reporter responds independently of the odorant-receptor channel." },
    "poly-a": { term: "Poly(A) signal", def: "A DNA signal that directs formation of the 3′ end and poly(A) tail of a messenger RNA in a eukaryotic cell." },
    "emcv": { term: "EMCV IRES", def: "An internal ribosome entry site derived from encephalomyocarditis virus, used to translate a downstream protein from the same mRNA." },
    "neor": { term: "NeoR", def: "A gene giving resistance to neomycin-family selection drugs such as G418, used to select cells carrying an expression vector." },
    "g418": { term: "G418", def: "An antibiotic used to select mammalian cells carrying a compatible resistance gene." },
    "pca": { term: "PCA", def: "Principal component analysis — a method that summarizes variation in many measurements using a smaller set of combined axes." },
    "svm": { term: "SVM", def: "Support vector machine — a model that learns a boundary between classes from labeled examples." },
    "loso": { term: "LOSO", def: "Leave-one-sensor-out analysis — remove one sensor at a time and see how a model's performance changes." },
    "anova-f": { term: "ANOVA F score", def: "A statistical score comparing variation between groups with variation within groups; used here as one feature-ranking check." },
    "stdp": { term: "STDP", def: "Spike-timing-dependent plasticity — a learning rule that changes connection strength based on the timing of neuron-like spikes." },
    "standardscaler": { term: "StandardScaler", def: "A preprocessing step that centers features and scales them by their training-set standard deviation; it must be fitted without test-set leakage." },
    "sar": { term: "SAR ADC", def: "Successive-approximation analog-to-digital converter — a circuit that samples a voltage and resolves its digital value by successive comparisons." },
    "vref": { term: "VREF", def: "Voltage reference — a stable comparison voltage that helps an ADC convert an input signal into numbers." },
    "bsl": { term: "BSL", def: "Biosafety level — a set of containment practices and facilities matched to the organisms and procedures in a laboratory." },
    "irb": { term: "IRB", def: "Institutional Review Board — a body that reviews certain research involving human participants; whether review is required depends on the activity and local rules." },
    "loi": { term: "LOI", def: "Letter of intent — a written statement that an organization is interested in a defined next step; it is not the same as a purchase." },
    "iso17025": { term: "ISO/IEC 17025", def: "An international standard for the competence of testing and calibration laboratories. A future certification goal is not current accreditation." },
  };

  var activeTerm = null;
  var popover = null;
  var hoverTimer = null;
  var closeTimer = null;
  var definitionOrb = null;
  var ILLUSTRATIONS = {
    drosophila: { src: 'fig/fly.jpg', alt: 'Fruit fly, the organism inspiring the receptor and coding designs', caption: 'Fruit-fly visual' },
    gcamp: { src: 'fig/engineering/GCaMP6f_GGGGSx3_DmOrco.png', alt: 'Team construct map showing GCaMP6f linked to Orco', caption: 'Our reporter construct map · not a protein structure' },
    pcb: { src: 'fig/hardware/v2-pcb-top.png', alt: 'Team reader-board top layout', caption: 'Reader-board design · not a built-device photo' }
  };

  // One small, decorative Canvas 2D mark. This is not a loading/AI status:
  // definitions are authored locally and appear immediately. No global loop.
  function makeDefinitionOrb(canvas, requestedSize) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return { setOpen: function () {} };
    var size = requestedSize || 40, dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.scale(dpr * size / 40, dpr * size / 40);
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var open = false, visible = true, raf = 0, previous = 0, phase = 1.5;
    var ink = "#355d4b", orbits = [], tau = Math.PI * 2;
    function hash(a, b) { var n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return n - Math.floor(n); }
    for (var i = 0; i < 6; i++) {
      var h1 = hash(i, 1.7), h2 = hash(i, 5.2), h3 = hash(i, 8.9);
      var theta = h1 * tau, phi = Math.acos(2 * h2 - 1);
      var nx = Math.sin(phi) * Math.cos(theta), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(theta);
      var norm = Math.max(.000001, Math.hypot(ny, nx)), ux = -ny / norm, uy = nx / norm;
      var orbit = { u:[ux,uy,0], v:[-nz*uy,nz*ux,nx*uy-ny*ux], r:16.4*(.45+.52*h1), speed:(.25+.55*h3)*(h3>.5?1:-1), phase:h2*6, ghost:[] };
      for (var j = 0; j < 18; j++) orbit.ghost.push(j / 18 * tau);
      orbits.push(orbit);
    }
    function paint() {
      ctx.clearRect(0,0,40,40);
      var dots = [], yaw = phase * .12, sy = Math.sin(yaw), cy = Math.cos(yaw), st = Math.sin(.3), ct = Math.cos(.3);
      function dot(orbit, angle, moving) {
        var ca = Math.cos(angle), sa = Math.sin(angle);
        var x = (orbit.u[0]*ca+orbit.v[0]*sa)*orbit.r, y = (orbit.u[1]*ca+orbit.v[1]*sa)*orbit.r, z = orbit.v[2]*sa*orbit.r;
        var px = x*cy+z*sy, pz = -x*sy+z*cy, py = y*ct-pz*st, depth = y*st+pz*ct;
        var f = (depth/orbit.r+1)/2;
        dots.push({x:20+px,y:20-py,z:depth,r:moving?.65+.6*f:.35,a:moving?.62+.38*f:.12+.2*f});
      }
      orbits.forEach(function (o) {
        o.ghost.forEach(function (angle) { dot(o,angle,false); });
        for (var k=0;k<2;k++) dot(o,phase*o.speed+k*Math.PI+o.phase,true);
      });
      dots.sort(function (a,b) { return a.z-b.z; });ctx.fillStyle=ink;
      dots.forEach(function (d) { ctx.globalAlpha=d.a;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,tau);ctx.fill(); });
      ctx.globalAlpha=1;
    }
    function allowed() { return open && visible && !document.hidden && !reduced.matches; }
    function tick(now) {
      raf=0;if(!allowed())return;
      if(!previous)previous=now;
      if(now-previous>=1000/24){phase+=Math.min(.1,(now-previous)/1000)*.65;previous=now;paint();}
      raf=requestAnimationFrame(tick);
    }
    function sync() {
      if(raf){cancelAnimationFrame(raf);raf=0;}previous=0;
      if(open){ink=getComputedStyle(canvas).color;paint();}
      if(allowed())raf=requestAnimationFrame(tick);
    }
    if(window.IntersectionObserver)new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync();}).observe(canvas);
    document.addEventListener("visibilitychange",sync);
    reduced.addEventListener("change",sync);
    return {setOpen:function(value){open=value;sync();}};
  }

  function ensurePopover() {
    if (popover) return popover;
    popover = document.createElement("div");
    popover.id = "glossary-popover";
    popover.className = "glossary-popover";
    popover.setAttribute("role", "tooltip");
    popover.hidden = true;
    popover.innerHTML =
      '<div class="glossary-popover__sender"><canvas class="glossary-popover__orb" aria-hidden="true"></canvas><span>Field dictionary</span></div>' +
      '<p class="glossary-popover__term"></p>' +
      '<p class="glossary-popover__def"></p>' +
      '<figure class="glossary-popover__visual" hidden><img alt=""><figcaption></figcaption></figure>' +
      '<p class="glossary-popover__note">Quick definition · press Esc to close</p>';
    document.body.appendChild(popover);
    definitionOrb = makeDefinitionOrb(popover.querySelector('.glossary-popover__orb'));
    popover.addEventListener('mouseenter', function(){if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}});
    popover.addEventListener('mouseleave', function(){if(activeTerm&&document.activeElement!==activeTerm)closePopover();});
    return popover;
  }

  function closePopover() {
    if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    if (!popover || !activeTerm) return;
    popover.hidden = true;
    if(definitionOrb)definitionOrb.setOpen(false);
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
    if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}
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
    var visual = tip.querySelector('.glossary-popover__visual');
    var illustration = ILLUSTRATIONS[key];
    visual.hidden = !illustration;
    if (illustration) { visual.querySelector('img').src = illustration.src; visual.querySelector('img').alt = illustration.alt; visual.querySelector('figcaption').textContent = illustration.caption; }
    tip.hidden = false;
    tip.setAttribute("aria-hidden", "false");

    termEl.setAttribute("aria-expanded", "true");
    termEl.setAttribute("aria-describedby", tip.id);
    activeTerm = termEl;
    positionPopover(termEl);
    if(definitionOrb)definitionOrb.setOpen(true);

    if (opts.focusReturn === false) {
      /* keep focus on term */
    }
  }

  function onTermActivate(termEl) {
    openPopover(termEl);
  }

  // One unobtrusive explanation per concept on each page. Existing hand-placed
  // definitions remain in place; links, controls, code, references and headings
  // are never rewritten.
  var AUTO_ALIASES = {
    voc: ["VOCs", "VOC", "volatile organic compounds"],
    mycotoxin: ["mycotoxins", "mycotoxin"],
    aflatoxin: ["aflatoxins", "aflatoxin"],
    "e-nose": ["electronic nose", "electronic-nose", "e-nose"],
    headspace: ["headspace"],
    indole: ["indole"],
    or49b: ["Or49b"],
    orco: ["Orco"],
    or: ["odorant receptor", "odorant receptors", "OR"],
    drosophila: ["Drosophila"],
    vuaa1: ["VUAA1"],
    hek293t: ["HEK293T"],
    gcamp6: ["GCaMP6", "GCaMP6f"],
    gcamp: ["GCaMP"],
    obp: ["OBP"],
    al: ["antennal lobe", "AL"],
    pn: ["projection neuron", "PN"],
    mb: ["mushroom body", "MB"],
    kc: ["Kenyon cell", "KC"],
    mbon: ["MBON"],
    "lateral-inhibition": ["lateral inhibition"],
    "sparse-coding": ["sparse coding"],
    lsh: ["LSH"],
    snn: ["SNN"],
    ali: ["air–liquid interface", "air-liquid interface", "ALI"],
    fluorescence: ["fluorescence"],
    photodiode: ["photodiode"],
    excitation: ["excitation light"],
    fdm: ["FDM"],
    dlia: ["DLIA"],
    tia: ["TIA", "transimpedance amplifier"],
    adc: ["ADC", "analog-to-digital converter"],
    cfd: ["CFD", "computational fluid dynamics"],
    "monte-carlo": ["Monte Carlo"],
    fluence: ["fluence"],
    "quantum-yield": ["quantum yield"],
    responsivity: ["responsivity"],
    ldo: ["LDO"],
    gpio: ["GPIO"],
    dds: ["DDS"],
    "iq-demodulation": ["I/Q"],
    "high-impedance": ["high-impedance"],
    "detection-limit": ["detection limit", "limit of detection"],
    snr: ["SNR", "signal-to-noise ratio"],
    "dark-noise": ["dark noise"],
    calibration: ["calibration"],
    bom: ["BOM", "bill of materials"],
    drc: ["DRC"],
    erc: ["ERC"],
    kicad: ["KiCad"],
    esp32: ["ESP32"],
    spi: ["SPI"],
    pcb: ["PCB", "printed circuit board"],
    "gc-ms": ["GC–MS", "GC-MS"],
    "lc-ms": ["LC–MS", "LC-MS"],
    screening: ["screening"],
    confirmatory: ["confirmatory testing", "confirmatory laboratory testing"],
    "risk-tier": ["risk tier", "risk-tier", "risk tiers"],
    "false-positive": ["false positive", "false positives"],
    "false-negative": ["false negative", "false negatives"],
    sensitivity: ["sensitivity"],
    "f1-score": ["F1", "F1 score"],
    "cross-validation": ["cross-validation", "k-fold"],
    "data-leakage": ["data leakage"],
    "confusion-matrix": ["confusion matrix"],
    "baseline-model": ["baseline model"],
    dbtlr: ["DBTLR", "Design → Build → Test → Learn → Redesign"],
    ihp: ["Integrated Human Practices", "IHP"],
    sdg: ["SDGs", "SDG"],
    b2b: ["B2B"],
    beachhead: ["beachhead"],
    mvp: ["MVP"],
    tam: ["TAM"],
    sam: ["SAM"],
    som: ["SOM"],
    fiti: ["FITI"],
    "willingness-to-pay": ["willingness to pay", "willingness-to-pay"],
    lca: ["life-cycle assessment", "LCA"],
    registry: ["iGEM Registry", "Registry"],
    "part-collection": ["part collection"],
    sds: ["SDS"],
    sop: ["SOP"],
    rg: ["risk group"],
    poc: ["proof of concept", "POC"],
    biobrick: ["BioBrick"],
    ires: ["IRES"],
    rfc1000: ["RFC 1000", "RFC1000"],
    cds: ["CDS", "coding sequence"],
    cmv: ["CMV"],
    kozak: ["Kozak"],
    mcherry: ["mCherry"],
    pcdna: ["pcDNA3.1(+)"],
    plasmid: ["plasmid", "plasmids"],
    "composite-part": ["composite part", "composite parts"],
    rfc10: ["RFC 10"],
    "codon-optimization": ["codon optimization", "codon-optimised", "codon-optimized"],
    sanger: ["Sanger sequencing", "Sanger"],
    bsai: ["BsaI"],
    ionomycin: ["ionomycin"],
    "poly-a": ["polyadenylation signal", "poly(A) signal"],
    emcv: ["EMCV IRES"],
    neor: ["NeoR"],
    g418: ["G418"],
    pca: ["PCA"],
    svm: ["SVM"],
    loso: ["LOSO"],
    "anova-f": ["ANOVA-F"],
    stdp: ["STDP"],
    standardscaler: ["StandardScaler"],
    sar: ["SAR ADC", "SAR"],
    vref: ["VREF"],
    bsl: ["BSL"],
    irb: ["IRB"],
    loi: ["LOI"],
    iso17025: ["ISO 17025", "ISO/IEC 17025"]
  };

  function autoAnnotateTerms(root) {
    var main = root || document.querySelector("main");
    if (!main) return;
    var patterns = [];
    Object.keys(AUTO_ALIASES).forEach(function (key) {
      if (!DEFINITIONS[key]) return;
      AUTO_ALIASES[key].forEach(function (alias) {
        var special = "\\^$.*+?()[]{}|";
        var escaped = alias.split("").map(function (character) {
          return special.indexOf(character) >= 0 ? "\\" + character : character;
        }).join("");
        var flags = alias.length <= 4 && alias === alias.toUpperCase() ? "" : "i";
        patterns.push({ key: key, re: new RegExp("(?<![A-Za-z0-9])" + escaped + "(?![A-Za-z0-9])", flags) });
      });
    });
    var used = new Set();
    var nodes = [];
    var walker = document.createTreeWalker(main, 4);
    while (walker.nextNode()) {
      var node = walker.currentNode;
      var parent = node.parentElement;
      if (!parent || !node.nodeValue.trim()) continue;
      if (!parent.closest("p, li, dd, dt, td, th, figcaption, blockquote")) continue;
      if (parent.closest("a, button, dfn, code, pre, script, style, textarea, nav, header, footer, svg, .cite-wrap, .cite-preview, .glossary-popover, .references, .aerosense-cinematic")) continue;
      nodes.push(node);
    }
    var count = 0;
    nodes.some(function (node) {
      if (count >= 48) return true;
      var remaining = node.nodeValue;
      var fragment = document.createDocumentFragment();
      var replacements = 0;
      while (remaining && replacements < 2 && count < 48) {
        var best = null;
        patterns.forEach(function (item) {
          if (used.has(item.key)) return;
          var match = item.re.exec(remaining);
          if (match && (!best || match.index < best.index || (match.index === best.index && match[0].length > best.text.length))) {
            best = { key: item.key, index: match.index, text: match[0] };
          }
        });
        if (!best) break;
        fragment.appendChild(document.createTextNode(remaining.slice(0, best.index)));
        var term = document.createElement("dfn");
        term.className = "term";
        term.setAttribute("data-term", best.key);
        term.setAttribute("data-glossary-auto", "");
        term.textContent = best.text;
        fragment.appendChild(term);
        remaining = remaining.slice(best.index + best.text.length);
        used.add(best.key);
        replacements += 1;
        count += 1;
      }
      if (replacements) {
        fragment.appendChild(document.createTextNode(remaining));
        node.parentNode.replaceChild(fragment, node);
      }
      return false;
    });
  }

  function renderGlossaryIndex() {
    var list = document.getElementById("glossary-index");
    var input = document.getElementById("glossary-search");
    var count = document.getElementById("glossary-count");
    if (!list || !input || !count) return;
    var topic = 'all';
    var topics = [
      {id:'all',name:'All terms',mark:'a.'},
      {id:'biology',name:'Living sensors',mark:'OR'},
      {id:'hardware',name:'Reading light',mark:'λ'},
      {id:'model',name:'Decoding',mark:'Σ'},
      {id:'people',name:'People & impact',mark:'↗'}
    ];
    function category(key,entry) {
      // Explicit subjects keep short acronyms and cross-disciplinary definitions
      // in the topic where this project explains them. Definition prose often
      // mentions another field, so it is not used as a keyword classifier.
      var known = {
        biology: 'voc mycotoxin or orco drosophila vuaa1 hek293t gcamp6 gcamp delta-f-over-f0 obp ali rfc1000 biobrick ies ires headspace aflatoxin indole or49b fluorescence gc-ms lc-ms registry part-collection cds cmv kozak mcherry pcdna plasmid composite-part rfc10 codon-optimization sanger bsai ionomycin poly-a emcv neor g418',
        hardware: 'fdm dlia tia adc cfd monte-carlo fluence quantum-yield responsivity ldo sar gpio dds iq-demodulation high-impedance pcb spi e-nose photodiode excitation detection-limit snr dark-noise calibration bom drc erc kicad esp32 vref',
        model: 'al pn mb kc mbon lateral-inhibition sparse-coding lsh snn false-positive false-negative sensitivity specificity f1-score cross-validation data-leakage confusion-matrix baseline-model pca svm loso anova-f stdp standardscaler',
        people: 'sds sop rg poc screening confirmatory risk-tier dbtlr ihp sdg b2b beachhead mvp tam sam som fiti willingness-to-pay lca bsl irb loi iso17025'
      };
      for (var subject in known) {
        if (known[subject].split(' ').indexOf(key) !== -1) return subject;
      }
      if (/^(sds|sop|rg|bsl|irb|loi|iso17025|beachhead|mvp|tam|sam|som|fiti|willingness-to-pay|lca|registry|part-collection)$/.test(key) || /stakeholder|human practices|consent|market|sustainab|safety|biosecurity/i.test(entry.term)) return 'people';
      if (/photodiode|transimpedance|resistor|capacitor|amplifier|voltage|analog|circuit|pcb|led|adc|tia|i2c|esp32|ble|bom|snr|op-amp|sar|vref|optical|filter|firmware|lock-in/i.test(key+' '+entry.term)) return 'hardware';
      if (/model|classifier|feature|neuron|spike|neuromorphic|pca|svm|loso|anova|stdp|standardscaler|accuracy|precision|recall|false|training|validation|cross-validation|f1|data leakage/i.test(key+' '+entry.term)) return 'model';
      return 'biology';
    }
    var entries = Object.keys(DEFINITIONS).map(function (key) {
      return Object.assign({key:key,topic:category(key,DEFINITIONS[key])},DEFINITIONS[key]);
    }).filter(function (entry, index, all) {
      return all.findIndex(function (candidate) { return candidate.term === entry.term; }) === index;
    }).sort(function (a, b) { return a.term.localeCompare(b.term, "en"); });
    entries.forEach(function (entry,index) {
      var article = document.createElement("article");
      article.className = "glossary-entry";
      article.dataset.topic = entry.topic;
      article.setAttribute("data-glossary-search", (entry.term + " " + entry.def).toLowerCase());
      var meta = document.createElement('p'); meta.className='glossary-entry__meta';
      meta.textContent=topics.find(function(row){return row.id===entry.topic;}).name+' / '+String(index+1).padStart(2,'0');
      var heading = document.createElement("h2");
      heading.textContent = entry.term;
      var definition = document.createElement("p");
      definition.textContent = entry.def;
      article.appendChild(meta); article.appendChild(heading);
      article.appendChild(definition);
      list.appendChild(article);
    });
    function filter() {
      var query = input.value.trim().toLowerCase();
      var shown = 0;
      Array.prototype.forEach.call(list.children, function (item) {
        var match = (topic==='all'||item.dataset.topic===topic) && (!query || item.getAttribute("data-glossary-search").indexOf(query) >= 0);
        item.hidden = !match;
        if (match) shown += 1;
      });
      count.textContent = shown + " of " + entries.length + " definitions";
    }
    input.addEventListener("input", filter);
    var topicNav=document.querySelector('[data-glossary-topics]');
    if(topicNav)topics.forEach(function(row){
      var button=document.createElement('button');button.type='button';button.dataset.topic=row.id;
      button.setAttribute('aria-pressed',String(row.id===topic));
      var ring=document.createElement('span');ring.className='glossary-story-ring';ring.textContent=row.mark;ring.setAttribute('aria-hidden','true');
      var name=document.createElement('span');name.textContent=row.name;button.append(ring,name);
      button.addEventListener('click',function(){
        topic=row.id;topicNav.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b===button));});
        var featured=topic==='all'?DEFINITIONS.orco:entries.find(function(e){return e.topic===topic;});
        document.querySelector('[data-glossary-feature-term]').textContent=featured.term;
        document.querySelector('[data-glossary-feature-definition]').textContent=featured.def;
        var chat=document.querySelector('.glossary-chat');chat.dataset.topic=topic;
        if(!matchMedia('(prefers-reduced-motion: reduce)').matches)chat.animate([{opacity:.2,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:350,easing:'ease-out'});
        filter();
      });topicNav.append(button);
    });
    var orb=document.querySelector('.glossary-conversation-orb');if(orb)makeDefinitionOrb(orb,160).setOpen(true);
    filter();
  }

  function bindTerms(root) {
    var terms = root.querySelectorAll("dfn.term[data-term]");
    if (!terms.length) return;

    ensurePopover();

    Array.prototype.forEach.call(terms, function (termEl) {
      if (termEl.dataset.glossaryBound) return;
      termEl.dataset.glossaryBound = "true";
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
        if (document.activeElement !== termEl) closeTimer=window.setTimeout(closePopover,180);
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

  }

  // Component inspectors can replace their text without losing the same
  // keyboard-accessible glossary behavior used by the surrounding article.
  window.AeroSenseGlossary = {
    enhance: function (root) {
      if (!root) return;
      if (activeTerm && !activeTerm.isConnected) closePopover();
      autoAnnotateTerms(root);
      bindTerms(root);
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    autoAnnotateTerms();
    renderGlossaryIndex();
    bindTerms(document);

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
