/**
 * Project Search — local, self-contained index (no network, no libraries).
 */
(function () {
  "use strict";

  /**
   * Curated index of visible reviewed content.
   * Fields: pageTitle, section, excerpt, keywords, url, anchor
   * Do not index nav/footer boilerplate, emails, or reference lists as primary hits.
   */
  var SEARCH_INDEX = [
    /* Home */
    {
      pageTitle: "Home",
      section: "The signal we are missing",
      excerpt: "Patterns of volatile organic compounds (VOCs) in air can carry information relevant to agriculture, environmental monitoring, food safety, and health.",
      keywords: "VOC VOCs airborne odor electronic nose e-nose mixture",
      url: "index.html",
      anchor: "signal-missing",
    },
    {
      pageTitle: "Home",
      section: "One signal, three engineered layers",
      excerpt: "HEK293T receptor cells, fly-inspired computation, and portable optical readout are designed as three coupled research tracks.",
      keywords: "HEK293T Orco Drosophila GCaMP6 layers living sensor neural decoder hardware",
      url: "index.html",
      anchor: "system-overview",
    },
    {
      pageTitle: "Home",
      section: "How a measurement moves through AeroSense",
      excerpt: "A planned measurement path runs from VOC sample exposure through fluorescence features to a documented pattern call.",
      keywords: "workflow measurement fluorescence pattern call pipeline",
      url: "index.html",
      anchor: "workflow",
    },
    {
      pageTitle: "Home",
      section: "Explore AeroSense",
      excerpt: "Entry links to Description, Design, Model, Hardware, Results, and Human Practices pages.",
      keywords: "explore navigate sitemap overview",
      url: "index.html",
      anchor: "explore",
    },

    /* Description */
    {
      pageTitle: "Description",
      section: "The challenge",
      excerpt: "Complex VOC mixtures remain hard for conventional sensors when stability and selectivity matter over time.",
      keywords: "challenge VOC mixture selectivity stability sensing",
      url: "description.html",
      anchor: "the-challenge",
    },
    {
      pageTitle: "Description",
      section: "Why learn from olfaction?",
      excerpt: "Insect olfaction provides receptor diversity and circuit motifs that motivate AeroSense design choices.",
      keywords: "olfaction insect Drosophila OR Orco antennal lobe mushroom body",
      url: "description.html",
      anchor: "why-olfaction",
    },
    {
      pageTitle: "Description",
      section: "The AeroSense concept",
      excerpt: "AeroSense is planned as a bio-digital platform linking living-cell sensors, fly-inspired computation, and portable optical readout.",
      keywords: "concept platform bio-digital architecture",
      url: "description.html",
      anchor: "concept",
    },
    {
      pageTitle: "Description",
      section: "Biological sensing layer",
      excerpt: "Selected Drosophila olfactory receptors with Orco are planned for heterologous expression in HEK293T with GCaMP6 readout.",
      keywords: "biological sensing HEK293T Orco GCaMP6 receptor calcium fluorescence",
      url: "description.html",
      anchor: "biological-sensing",
    },
    {
      pageTitle: "Description",
      section: "Computational layer",
      excerpt: "Response vectors are intended to pass through antennal-lobe-inspired contrast and mushroom-body-inspired sparse coding.",
      keywords: "computational AL MB sparse coding LSH classifier model",
      url: "description.html",
      anchor: "computational-layer",
    },
    {
      pageTitle: "Description",
      section: "Hardware layer",
      excerpt: "Portable optical excitation, photodiode detection, and edge preprocessing form the planned hardware track.",
      keywords: "hardware optical photodiode TIA ADC edge portable",
      url: "description.html",
      anchor: "hardware-layer",
    },
    {
      pageTitle: "Description",
      section: "Design requirements",
      excerpt: "Design requirements connect biological, computational, and hardware constraints for a coherent 2026 prototype path.",
      keywords: "requirements design goals constraints",
      url: "description.html",
      anchor: "design-requirements",
    },
    {
      pageTitle: "Description",
      section: "Intended context and boundaries",
      excerpt: "Candidate application domains remain proposal framing until Human Practices evidence selects a primary context.",
      keywords: "context boundaries agriculture environment food medical application",
      url: "description.html",
      anchor: "context-boundaries",
    },
    {
      pageTitle: "Description",
      section: "Continue exploring",
      excerpt: "Continue to Design, Model, Hardware, Human Practices, Engineering, and Results for layer detail and evidence status.",
      keywords: "continue exploring cross-links Design Model Hardware Results",
      url: "description.html",
      anchor: "continue-exploring",
    },

    /* Contribution */
    {
      pageTitle: "Contribution",
      section: "Candidate contribution packages",
      excerpt: "Packages track parts documentation, assay methods, model code, hardware files, and education materials with reuse status.",
      keywords: "contribution packages parts assay model hardware education reuse Bronze",
      url: "contribution.html",
      anchor: "candidate-packages",
    },
    {
      pageTitle: "Contribution",
      section: "Registry documentation",
      excerpt: "Registry documentation will list real BBa_ identifiers only after verified sequences and part pages exist.",
      keywords: "Registry BBa_ parts documentation deposit",
      url: "contribution.html",
      anchor: "registry",
    },
    {
      pageTitle: "Contribution",
      section: "How to reuse our work",
      excerpt: "Reuse guidance explains prerequisites, context dependence, and what is not claimed as Available yet.",
      keywords: "reuse future teams prerequisites limitations",
      url: "contribution.html",
      anchor: "how-to-reuse",
    },

    /* Engineering */
    {
      pageTitle: "Engineering",
      section: "How to read this page",
      excerpt: "Each cycle uses Design, Build, Test, Learn, and Change stages; citations are not AeroSense test evidence.",
      keywords: "DBTL engineering cycle Design Build Test Learn Change",
      url: "engineering.html",
      anchor: "how-to-read",
    },
    {
      pageTitle: "Engineering",
      section: "Biological sensing cycles",
      excerpt: "Planned living-cell sensor and fluorescence assay-control cycles for OR/Orco/GCaMP6 work in HEK293T.",
      keywords: "biological cycle HEK293T Orco VUAA1 assay controls",
      url: "engineering.html",
      anchor: "biological-cycles",
    },
    {
      pageTitle: "Engineering",
      section: "Cycle C1 · Living-cell sensor",
      excerpt: "Design requirement to co-express selected Drosophila OR(s) with Orco and GCaMP6 in HEK293T for optical readout.",
      keywords: "bio-c1 living-cell sensor transfection construct",
      url: "engineering.html",
      anchor: "bio-c1",
    },
    {
      pageTitle: "Engineering",
      section: "Cycle C1 · Fluorescence assay controls",
      excerpt: "Control matrix planned to separate Orco-dependent responses from reporter-only or vehicle effects.",
      keywords: "bio-assay-c1 VUAA1 vehicle controls fluorescence",
      url: "engineering.html",
      anchor: "bio-assay-c1",
    },
    {
      pageTitle: "Engineering",
      section: "Model cycles",
      excerpt: "Model engineering must show how data changed preprocessing, architecture, parameters, or validation.",
      keywords: "model-c1 AL MB baseline pipeline validation",
      url: "engineering.html",
      anchor: "model-cycles",
    },
    {
      pageTitle: "Engineering",
      section: "Hardware cycles",
      excerpt: "Optical-path and PCB/signal-chain cycles require bench records before engineering claims.",
      keywords: "hw-optical-c1 hw-pcb-c1 optics PCB TIA ADC",
      url: "engineering.html",
      anchor: "hardware-cycles",
    },
    {
      pageTitle: "Engineering",
      section: "Integration cycle",
      excerpt: "Integration means documented handoffs among wet lab, model, and hardware—not parallel subsystem progress alone.",
      keywords: "integration-c1 handoff end-to-end joint run",
      url: "engineering.html",
      anchor: "integration-cycle",
    },

    /* Safety */
    {
      pageTitle: "Safety & Security",
      section: "Safety at a glance",
      excerpt: "Wiki safety summary covers biological, chemical, optical, electrical, biosecurity, and data considerations without replacing official forms.",
      keywords: "safety security SDS SOP risk overview",
      url: "safety-and-security.html",
      anchor: "safety-at-a-glance",
    },
    {
      pageTitle: "Safety & Security",
      section: "Biological materials",
      excerpt: "Planned materials include HEK293T and Escherichia coli DH5α with selected Drosophila OR/Orco/GCaMP6 constructs.",
      keywords: "HEK293T biological materials chassis containment",
      url: "safety-and-security.html",
      anchor: "biological-materials",
    },
    {
      pageTitle: "Safety & Security",
      section: "Chemical and VOC handling",
      excerpt: "VOC panel chemicals and VUAA1/DMSO handling require SDS registration and institution-approved procedures.",
      keywords: "VOC chemical VUAA1 DMSO SDS handling",
      url: "safety-and-security.html",
      anchor: "chemical-voc",
    },
    {
      pageTitle: "Safety & Security",
      section: "Hardware and physical hazards",
      excerpt: "Optical, electrical, and thermal hazards from the portable reader must be assessed before deployment.",
      keywords: "hardware hazards LED laser electrical thermal enclosure",
      url: "safety-and-security.html",
      anchor: "hardware-hazards",
    },
    {
      pageTitle: "Safety & Security",
      section: "Biosecurity and dual-use reflection",
      excerpt: "Biosecurity reflection addresses access control and dual-use concerns for engineered materials.",
      keywords: "biosecurity dual-use misuse access control",
      url: "safety-and-security.html",
      anchor: "biosecurity",
    },

    /* Members / Attributions */
    {
      pageTitle: "Members",
      section: "Student team",
      excerpt: "Student roster slots document roles across wet lab, dry lab, human practices, and wiki work packages.",
      keywords: "members team roster students NTHU",
      url: "members.html",
      anchor: "student-team",
    },
    {
      pageTitle: "Attributions",
      section: "Asset and media credits",
      excerpt: "Asset register records creator, source, license, and modifications for third-party and team media.",
      keywords: "attributions credits assets license CC BY",
      url: "attributions.html",
      anchor: "asset-credits",
    },
    {
      pageTitle: "Attributions",
      section: "Responsible AI use",
      excerpt: "Responsible AI boundaries prohibit inventing scientific evidence images, data, or unverified research prose.",
      keywords: "responsible AI boundaries wiki writing",
      url: "attributions.html",
      anchor: "responsible-ai",
    },

    /* Parts */
    {
      pageTitle: "Parts",
      section: "Parts at a glance",
      excerpt: "No verified Registry-submitted AeroSense parts are published yet; proposal constructs A and B are design documentation.",
      keywords: "parts inventory Registry BBa_ Construct A Construct B",
      url: "parts.html",
      anchor: "at-a-glance",
    },
    {
      pageTitle: "Parts",
      section: "Part inventory",
      excerpt: "Inventory rows cover planned promoters, OR CDS, Orco, GCaMP6, IRES, and reporter elements without fabricated BBa_ IDs.",
      keywords: "inventory CAG Orco GCaMP6 IRES mCherry promoter CDS",
      url: "parts.html",
      anchor: "inventory",
    },
    {
      pageTitle: "Parts",
      section: "Proposed sensing constructs",
      excerpt: "Construct A follows an OR–IRES–mCherry style; Construct B follows a GCaMP–Orco fusion style as proposal architecture.",
      keywords: "constructs sensing OR IRES mCherry GCaMP Orco fusion",
      url: "parts.html",
      anchor: "constructs",
    },
    {
      pageTitle: "Parts",
      section: "Characterization",
      excerpt: "No AeroSense part characterization package is published; VUAA1 is noted only as a planned functional-control concept.",
      keywords: "characterization VUAA1 assay controls dose response",
      url: "parts.html",
      anchor: "characterization",
    },
    {
      pageTitle: "Parts",
      section: "Part-related contribution",
      excerpt: "Part contribution tracks to the Biological construct and part documentation package on Contribution.",
      keywords: "contribution pkg-parts Registry documentation",
      url: "parts.html",
      anchor: "contribution-link",
    },

    /* Design */
    {
      pageTitle: "Design",
      section: "Design question",
      excerpt: "How can insect olfactory receptors in mammalian cells, fly-inspired decoding, and portable optics form one VOC sensing platform?",
      keywords: "design question VOC receptor platform",
      url: "design.html",
      anchor: "design-question",
    },
    {
      pageTitle: "Design",
      section: "Why HEK293T?",
      excerpt: "HEK293T is the planned heterologous host for OR/Orco expression and fluorescence reporting.",
      keywords: "HEK293T host chassis mammalian expression",
      url: "design.html",
      anchor: "why-hek293t",
    },
    {
      pageTitle: "Design",
      section: "Receptor selection",
      excerpt: "Receptor selection plans a Drosophila OR panel with Orco co-expression for ligand coverage.",
      keywords: "receptor selection OR panel Orco ligand Drosophila",
      url: "design.html",
      anchor: "receptor-selection",
    },
    {
      pageTitle: "Design",
      section: "Functional validation design",
      excerpt: "Functional validation design includes agonist, vehicle, and omission controls before VOC panel claims.",
      keywords: "functional validation VUAA1 controls GCaMP6",
      url: "design.html",
      anchor: "functional-validation",
    },
    {
      pageTitle: "Design",
      section: "VOC-response assay design",
      excerpt: "VOC-response assay design defines exposure, fluorescence readout, and control structure for panel testing.",
      keywords: "VOC assay ΔF/F0 fluorescence plate reader",
      url: "design.html",
      anchor: "voc-assay",
    },
    {
      pageTitle: "Design",
      section: "Interfaces with Model and Hardware",
      excerpt: "Design interfaces specify feature handoffs to Model and optical constraints for Hardware.",
      keywords: "interfaces model hardware feature file optical",
      url: "design.html",
      anchor: "interfaces",
    },

    /* Experiments */
    {
      pageTitle: "Experiments",
      section: "Protocol index",
      excerpt: "Protocol index lists EXP-AS-01 through EXP-AS-08 as scaffolds for cloning, transfection, assays, model, and hardware tests.",
      keywords: "protocol index EXP-AS-01 EXP-AS-02 EXP-AS-03 EXP-AS-04 EXP-AS-05 EXP-AS-06 EXP-AS-07 EXP-AS-08",
      url: "experiments.html",
      anchor: "protocol-index",
    },
    {
      pageTitle: "Experiments",
      section: "Core protocols",
      excerpt: "Core protocol scaffolds cover construct assembly, HEK293T transfection, fluorescence controls, VOC exposure, model features, and hardware validation.",
      keywords: "core protocols cloning transfection fluorescence VOC hardware model",
      url: "experiments.html",
      anchor: "core-protocols",
    },
    {
      pageTitle: "Experiments",
      section: "Control matrix",
      excerpt: "Control matrix separates vehicle, reporter-only, incomplete receptor, and Orco-agonist conditions.",
      keywords: "control matrix vehicle VUAA1 Orco reporter-only",
      url: "experiments.html",
      anchor: "control-matrix",
    },

    /* Notebook / Results */
    {
      pageTitle: "Notebook",
      section: "Actual notebook entries",
      excerpt: "No dated laboratory notebook entries are published yet; planned EXP-AS slots reserve anchors for future records.",
      keywords: "notebook lab notes entries EXP-AS slots",
      url: "notebook.html",
      anchor: "actual-entries",
    },
    {
      pageTitle: "Notebook",
      section: "Planned milestones",
      excerpt: "Planned milestone slots map to EXP-AS-01 through EXP-AS-08 for wet lab, model, and hardware streams.",
      keywords: "milestones planned EXP-AS notebook slots",
      url: "notebook.html",
      anchor: "planned-milestones",
    },
    {
      pageTitle: "Results",
      section: "Evidence overview",
      excerpt: "Results slots remain unpublished; biological, model, hardware, and integrated-system evidence is not claimed.",
      keywords: "results evidence overview unpublished",
      url: "results.html",
      anchor: "evidence-overview",
    },
    {
      pageTitle: "Results",
      section: "Biological sensing results",
      excerpt: "Biological sensing result slots await measured fluorescence and control data linked from experiments.",
      keywords: "biological sensing results fluorescence HEK293T",
      url: "results.html",
      anchor: "biological-sensing",
    },
    {
      pageTitle: "Results",
      section: "Model results",
      excerpt: "Model result slots await validated metrics against provenance-labeled features.",
      keywords: "model results classifier metrics validation",
      url: "results.html",
      anchor: "model-results",
    },
    {
      pageTitle: "Results",
      section: "Hardware results",
      excerpt: "Hardware result slots await optical and electronics verification records.",
      keywords: "hardware results optical PCB verification",
      url: "results.html",
      anchor: "hardware-results",
    },
    {
      pageTitle: "Results",
      section: "Integrated-system evidence",
      excerpt: "Integrated-system evidence requires joint wet-lab, model, and hardware runs—not subsystem tests alone.",
      keywords: "integrated system end-to-end joint evidence",
      url: "results.html",
      anchor: "integrated-system",
    },

    /* Model */
    {
      pageTitle: "Model",
      section: "Question and role in the project",
      excerpt: "The model asks whether fly-inspired AL/MB steps improve odor-pattern decoding over simpler baselines on fluorescence features.",
      keywords: "model question role AL MB sparse coding",
      url: "model.html",
      anchor: "question-and-role",
    },
    {
      pageTitle: "Model",
      section: "AL-inspired layer",
      excerpt: "Antennal-lobe-inspired processing is designed as a contrast or lateral-interaction step on receptor-like channels.",
      keywords: "AL antennal lobe lateral inhibition contrast",
      url: "model.html",
      anchor: "al-inspired",
    },
    {
      pageTitle: "Model",
      section: "MB-inspired layer",
      excerpt: "Mushroom-body-inspired sparse projection expands and sparsifies representations before classification.",
      keywords: "MB mushroom body Kenyon sparse coding LSH",
      url: "model.html",
      anchor: "mb-inspired",
    },
    {
      pageTitle: "Model",
      section: "Preprocessing and response extraction",
      excerpt: "Preprocessing extracts ΔF/F₀-style fluorescence responses with documented provenance labels.",
      keywords: "preprocessing delta F F0 fluorescence features",
      url: "model.html",
      anchor: "preprocessing",
    },
    {
      pageTitle: "Model",
      section: "Validation",
      excerpt: "Validation plans compare fly-inspired pipelines against baselines with held-out or cross-validated splits.",
      keywords: "validation baseline cross-validation metrics",
      url: "model.html",
      anchor: "validation",
    },
    {
      pageTitle: "Model",
      section: "Reproducibility",
      excerpt: "Reproducibility requires code revision, seed, data provenance, and environment notes before claiming model results.",
      keywords: "reproducibility code seed environment",
      url: "model.html",
      anchor: "reproducibility",
    },

    /* Hardware */
    {
      pageTitle: "Hardware",
      section: "The need",
      excerpt: "Portable optical readout is needed so fluorescence-class signals can be acquired outside a full plate-reader bench.",
      keywords: "need portable reader fluorescence optical",
      url: "hardware.html",
      anchor: "the-need",
    },
    {
      pageTitle: "Hardware",
      section: "Optical design",
      excerpt: "Optical design covers excitation, emission filtering, and photodiode collection to limit excitation bleed-through.",
      keywords: "optical design LED filter photodiode excitation emission",
      url: "hardware.html",
      anchor: "optical-design",
    },
    {
      pageTitle: "Hardware",
      section: "Analog and mixed-signal chain",
      excerpt: "The planned chain is photodiode to TIA to ADC with noise and isolation targets still to freeze.",
      keywords: "analog TIA ADC photodiode signal chain noise",
      url: "hardware.html",
      anchor: "analog-chain",
    },
    {
      pageTitle: "Hardware",
      section: "Multiplexing and signal processing",
      excerpt: "Frequency-division multiplexing and digital lock-in concepts are discussed for multi-channel optical readout.",
      keywords: "multiplexing FDM DLIA lock-in channel frequency",
      url: "hardware.html",
      anchor: "multiplexing",
    },
    {
      pageTitle: "Hardware",
      section: "PCB design",
      excerpt: "PCB design work includes KiCad drafts; fabricator stack-up and wiki download packages remain unpublished.",
      keywords: "PCB KiCad BOM DRC layout ESP32",
      url: "hardware.html",
      anchor: "pcb-design",
    },
    {
      pageTitle: "Hardware",
      section: "Verification",
      excerpt: "Verification slots for dark/noise, filter bleed, and channel isolation await bench records.",
      keywords: "verification dark noise filter bleed isolation",
      url: "hardware.html",
      anchor: "verification",
    },
    {
      pageTitle: "Hardware",
      section: "User testing and feedback",
      excerpt: "User testing with operators is not published; Human Practices should link any future feedback that changes hardware.",
      keywords: "user testing operators feedback usability",
      url: "hardware.html",
      anchor: "user-testing",
    },

    /* Human Practices */
    {
      pageTitle: "Integrated Human Practices",
      section: "Our responsibility question",
      excerpt: "Human Practices asks how AeroSense should choose application context, claim language, and safety boundaries with stakeholders.",
      keywords: "responsibility human practices stakeholders ethics",
      url: "human-practices.html",
      anchor: "responsibility-question",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "Stakeholder map",
      excerpt: "Stakeholder map tracks potential operators, domain experts, educators, regulators, and community audiences.",
      keywords: "stakeholder map operators educators regulators community",
      url: "human-practices.html",
      anchor: "stakeholder-map",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "Insight to change to evidence",
      excerpt: "Integration cases must link stakeholder evidence to a concrete technical change and a test destination; none are published yet.",
      keywords: "integration cases insight change evidence Design Hardware",
      url: "human-practices.html",
      anchor: "integration-cases",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "How Human Practices changed the technical project",
      excerpt: "No HP-driven technical changes are recorded yet; summary table tracks planned link targets when cases exist.",
      keywords: "how HP changed technical project scope",
      url: "human-practices.html",
      anchor: "how-hp-changed",
    },

    /* Education */
    {
      pageTitle: "Education",
      section: "Educational purpose",
      excerpt: "Education programs aim to explain olfactory sensing concepts and responsible synthetic biology without overstating results.",
      keywords: "education purpose outreach learning synthetic biology",
      url: "education.html",
      anchor: "educational-purpose",
    },
    {
      pageTitle: "Education",
      section: "Program portfolio",
      excerpt: "Program portfolio scaffolds audiences, activities, and evaluation instruments pending delivered events.",
      keywords: "program portfolio workshop school activity",
      url: "education.html",
      anchor: "program-portfolio",
    },
    {
      pageTitle: "Education",
      section: "Reusable education toolkit",
      excerpt: "Reusable toolkit materials will link to Contribution package pkg-education when licenses and files are ready.",
      keywords: "toolkit reusable contribution pkg-education lesson",
      url: "education.html",
      anchor: "toolkit",
    },
    {
      pageTitle: "Education",
      section: "Interactive tools",
      excerpt: "Interactive odor-learning tools are described as under development and not hosted as playable wiki downloads yet.",
      keywords: "interactive tools games software odor pixel",
      url: "education.html",
      anchor: "interactive-tools",
    },
  ];

  var LIVE_THROTTLE_MS = 300;
  var activeIndex = -1;
  var lastLiveText = "";
  var liveTimer = null;

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\u00C0-\u024F+#./-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    var n = normalize(text);
    if (!n) return [];
    var parts = [];
    n.split(" ").forEach(function (tok) {
      if (!tok) return;
      parts.push(tok);
      tok.split(/[-/]/).forEach(function (piece) {
        if (piece && piece !== tok) parts.push(piece);
      });
    });
    return parts.filter(function (t) {
      return t.length > 1 || /^[a-z0-9]$/i.test(t);
    });
  }

  function hasToken(tokens, tok) {
    return tokens.indexOf(tok) !== -1;
  }

  function hasPhrase(hay, phrase) {
    if (!phrase) return false;
    if (phrase.length <= 2) {
      return new RegExp(
        "(^|[\\s\\-/])" + phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([\\s\\-/]|$)"
      ).test(hay);
    }
    return hay.indexOf(phrase) !== -1;
  }

  function scoreEntry(query, entry) {
    var q = normalize(query);
    if (!q) return 0;

    var title = normalize(entry.pageTitle);
    var section = normalize(entry.section);
    var excerpt = normalize(entry.excerpt);
    var keywords = normalize(entry.keywords);
    var hay = title + " " + section + " " + excerpt + " " + keywords;
    var score = 0;

    if (title === q) score += 1000;
    else if (hasPhrase(title, q)) score += 700;

    if (section === q) score += 900;
    else if (hasPhrase(section, q)) score += 600;

    if (hasPhrase(keywords, q)) score += 350;
    if (hasPhrase(excerpt, q)) score += 250;
    if (hasPhrase(hay, q)) score += 80;

    var qTokens = tokenize(query);
    var titleTokens = tokenize(entry.pageTitle);
    var sectionTokens = tokenize(entry.section);
    var keywordTokens = tokenize(entry.keywords);
    var excerptTokens = tokenize(entry.excerpt);

    qTokens.forEach(function (tok) {
      if (hasToken(titleTokens, tok)) score += 120;
      if (hasToken(sectionTokens, tok)) score += 90;
      if (hasToken(keywordTokens, tok)) score += 55;
      if (hasToken(excerptTokens, tok)) score += 35;
    });

    return score;
  }

  function search(query) {
    var q = String(query || "").trim();
    if (!q) return [];

    var scored = [];
    SEARCH_INDEX.forEach(function (entry, i) {
      var s = scoreEntry(q, entry);
      if (s > 0) {
        scored.push({ entry: entry, score: s, order: i });
      }
    });

    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.order - b.order;
    });

    return scored;
  }

  function hrefFor(entry) {
    return entry.url + (entry.anchor ? "#" + entry.anchor : "");
  }

  function clearChildren(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function setLiveCount(countEl, text) {
    if (!countEl) return;
    if (liveTimer) window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(function () {
      if (text !== lastLiveText) {
        countEl.textContent = text;
        lastLiveText = text;
      }
    }, LIVE_THROTTLE_MS);
  }

  function renderResults(dialog, hits, query) {
    var resultsEl = dialog.querySelector("#project-search-results");
    var countEl = dialog.querySelector("#project-search-count");
    if (!resultsEl) return;

    clearChildren(resultsEl);
    activeIndex = -1;

    var q = String(query || "").trim();
    if (!q) {
      setLiveCount(countEl, "0 results");
      var empty = document.createElement("p");
      empty.className = "search-dialog__empty";
      empty.textContent = "Enter a term to search page titles, section headings, and excerpts.";
      resultsEl.appendChild(empty);
      return;
    }

    setLiveCount(countEl, hits.length === 1 ? "1 result" : hits.length + " results");

    if (!hits.length) {
      var none = document.createElement("p");
      none.className = "search-dialog__empty";
      none.textContent = "No matching sections. Try another keyword (for example VOC, Orco, or Hardware).";
      resultsEl.appendChild(none);
      return;
    }

    hits.forEach(function (hit, index) {
      var entry = hit.entry;
      var option = document.createElement("div");
      option.className = "search-result";
      option.setAttribute("role", "option");
      option.id = "project-search-option-" + index;
      option.setAttribute("aria-selected", "false");
      option.dataset.href = hrefFor(entry);

      var meta = document.createElement("p");
      meta.className = "search-result__meta";
      meta.textContent = entry.pageTitle + " · " + entry.section;

      var excerpt = document.createElement("p");
      excerpt.className = "search-result__excerpt";
      excerpt.textContent = entry.excerpt;

      var actions = document.createElement("p");
      actions.className = "search-result__actions";
      var open = document.createElement("a");
      open.className = "search-result__open";
      open.href = hrefFor(entry);
      open.textContent = "Open section";
      open.addEventListener("click", function () {
        /* allow navigation; dialog closes via page change */
      });
      actions.appendChild(open);

      option.appendChild(meta);
      option.appendChild(excerpt);
      option.appendChild(actions);

      option.addEventListener("click", function (event) {
        if (event.target === open) return;
        window.location.href = hrefFor(entry);
      });

      resultsEl.appendChild(option);
    });
  }

  function setActiveOption(dialog, index) {
    var options = dialog.querySelectorAll(".search-result");
    if (!options.length) {
      activeIndex = -1;
      return;
    }
    if (index < 0) index = options.length - 1;
    if (index >= options.length) index = 0;
    activeIndex = index;

    Array.prototype.forEach.call(options, function (opt, i) {
      var selected = i === activeIndex;
      opt.setAttribute("aria-selected", selected ? "true" : "false");
      opt.classList.toggle("is-active", selected);
    });

    var input = dialog.querySelector("#project-search-input");
    if (input) {
      input.setAttribute("aria-activedescendant", options[activeIndex].id);
    }
    options[activeIndex].scrollIntoView({ block: "nearest" });
  }

  function openActive(dialog) {
    var options = dialog.querySelectorAll(".search-result");
    if (activeIndex < 0 || !options[activeIndex]) return;
    var href = options[activeIndex].dataset.href;
    if (href) window.location.href = href;
  }

  function isTypingTarget(el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (el.isContentEditable) return true;
    return false;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var openBtn = document.querySelector(".btn-search");
    var dialog = document.getElementById("project-search");
    if (!openBtn || !dialog || typeof dialog.showModal !== "function") return;

    var input = dialog.querySelector("#project-search-input");
    var clearBtn = dialog.querySelector("[data-search-clear]");
    var closeBtns = dialog.querySelectorAll("[data-search-close]");
    var form = dialog.querySelector("form");

    function runSearch() {
      var q = input ? input.value : "";
      if (clearBtn) clearBtn.hidden = !String(q).trim();
      renderResults(dialog, search(q), q);
    }

    function openDialog() {
      if (!dialog.open) dialog.showModal();
      if (input) {
        input.focus();
        input.select();
      }
      runSearch();
    }

    function closeDialog() {
      if (dialog.open) dialog.close();
      openBtn.focus();
    }

    openBtn.addEventListener("click", function (event) {
      event.preventDefault();
      openDialog();
    });

    Array.prototype.forEach.call(closeBtns, function (btn) {
      btn.addEventListener("click", function () {
        closeDialog();
      });
    });

    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeDialog();
    });

    if (clearBtn && input) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        clearBtn.hidden = true;
        runSearch();
        input.focus();
      });
    }

    if (input) {
      input.addEventListener("input", runSearch);
      input.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActiveOption(dialog, activeIndex + 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setActiveOption(dialog, activeIndex - 1);
        } else if (event.key === "Enter") {
          if (activeIndex >= 0) {
            event.preventDefault();
            openActive(dialog);
          }
        } else if (event.key === "Escape") {
          event.preventDefault();
          closeDialog();
        }
      });
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (activeIndex >= 0) {
          openActive(dialog);
          return;
        }
        runSearch();
        var options = dialog.querySelectorAll(".search-result");
        if (options.length === 1) {
          window.location.href = options[0].dataset.href;
        } else if (options.length > 0) {
          setActiveOption(dialog, 0);
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      if (isTypingTarget(event.target) && event.target.closest && !event.target.closest("#project-search")) {
        return;
      }
      if (isTypingTarget(event.target) && event.target.id !== "project-search-input") {
        return;
      }

      var key = event.key;
      var isSlash = key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey;
      var isChord =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        (key === "k" || key === "K");

      if (isSlash || isChord) {
        if (isTypingTarget(event.target) && event.target.id !== "project-search-input") return;
        event.preventDefault();
        openDialog();
      }
    });

    renderResults(dialog, [], "");
  });
})();
