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
      section: "Opening film",
      excerpt: "AeroSense is trying to finish a story that begins before spoilage is visible: living cells, a portable reader, and a fly-inspired decoder for fungal-associated odor-pattern change.",
      keywords: "AeroSense Bio film scanner visible scan opening cinematic fungal detection Neuromorphic Olfactory Platform",
      url: "index.html",
      anchor: "home-film",
    },
    {
      pageTitle: "Home",
      section: "Explore AeroSense",
      excerpt: "One system, four ways in: biology, hardware, model, and human practices.",
      keywords: "explore biology hardware model human practices OR Orco GCaMP HEK293T TIA FDM DLIA AL MB",
      url: "index.html",
      anchor: "explore",
    },
    {
      pageTitle: "Home",
      section: "The team behind AeroSense",
      excerpt: "Students across synthetic biology, neuroscience, electronics, modeling, design, and human practices are building one system around a deceptively simple question.",
      keywords: "team members AeroSense Bio NTHU iGEM food-quality",
      url: "index.html",
      anchor: "team",
    },
    {
      pageTitle: "Home",
      section: "The AeroSense story",
      excerpt: "Watch the AeroSense promotion film.",
      keywords: "watch promotion film YouTube story video",
      url: "index.html",
      anchor: "watch",
    },
    {
      pageTitle: "Home",
      section: "Follow AeroSense Bio",
      excerpt: "AeroSense Bio, NTHU iGEM 2026. LinkedIn, Instagram, and YouTube.",
      keywords: "follow social LinkedIn Instagram YouTube AeroSense Bio",
      url: "index.html",
      anchor: "follow",
    },

    /* Description */
    {
      pageTitle: "Description",
      section: "Project at a glance",
      excerpt: "Four-stage overview: Sense (OR/Orco + HEK293T + GCaMP), Read (weak-fluorescence reader), Decode (AL/MB-inspired), Act (QC and follow-up).",
      keywords: "AeroSense Bio glance thesis Sense Read Decode Act screening fungal risk",
      url: "description.html",
      anchor: "glance",
    },
    {
      pageTitle: "Description",
      section: "The Problem",
      excerpt: "When spoilage becomes visible, fungal and storage deterioration may already be underway. VOC fingerprints can precede obvious visual signs.",
      keywords: "problem spoilage late VOC rice electronic nose GC-IMS screening window Figure 1 conceptual schematic",
      url: "description.html",
      anchor: "the-problem",
    },
    {
      pageTitle: "Description",
      section: "Why Biological Olfaction?",
      excerpt: "Odorant to OR/Orco to calcium to GCaMP fluorescence to optical output. Heterologous Drosophila sensing is published prior work; AeroSense asks how to integrate it.",
      keywords: "olfaction Drosophila OR Orco GCaMP6 VUAA1 VOC Zboray Jones HEK293 schematic Figure 2",
      url: "description.html",
      anchor: "why-olfaction",
    },
    {
      pageTitle: "Description",
      section: "Follow the signal",
      excerpt: "Conceptual interactive walkthrough of odor, receptors, fluorescence, readout, and action. Not experimental data.",
      keywords: "follow the signal flight journey conceptual interactive",
      url: "description.html",
      anchor: "follow-the-signal",
    },
    {
      pageTitle: "Description",
      section: "Sense → Read → Decode → Act",
      excerpt: "One information chain: VOC to GCaMP fluorescence to demodulated digital signal to sparse pattern to a risk-oriented decision.",
      keywords: "pipeline architecture Sense Read Decode Act Figure 3 LMP7721 ADS8866 ESP32 FDM DLIA",
      url: "description.html",
      anchor: "pipeline",
    },
    {
      pageTitle: "Description",
      section: "SENSE",
      excerpt: "Drosophila OR/Orco in HEK293T with GCaMP fluorescence, using VUAA1 as a functional positive control.",
      keywords: "Sense biological OR Orco HEK293T GCaMP mCherry VUAA1 construct",
      url: "description.html",
      anchor: "sense",
    },
    {
      pageTitle: "Description",
      section: "READ",
      excerpt: "Custom weak-fluorescence reader with modulated excitation, photodiode, TIA, ADC, FDM and digital lock-in detection.",
      keywords: "Read hardware photodiode TIA LMP7721 ADS8866 ESP32 FDM DLIA",
      url: "description.html",
      anchor: "read",
    },
    {
      pageTitle: "Description",
      section: "DECODE",
      excerpt: "AL-inspired contrast and MB-inspired sparse representation used as computational inspiration, judged against simpler baselines.",
      keywords: "Decode antennal lobe mushroom body Kenyon sparse LSH Dasgupta",
      url: "description.html",
      anchor: "decode",
    },
    {
      pageTitle: "Description",
      section: "ACT",
      excerpt: "Combine biological response with QC, confidence, and calibration status to recommend remeasure, monitor, isolate, or confirmatory testing.",
      keywords: "Act decision QC confidence risk screening follow-up",
      url: "description.html",
      anchor: "act",
    },
    {
      pageTitle: "Description",
      section: "What we build on",
      excerpt: "Published literature versus AeroSense-specific engineering. Contribution is integration of a measurement chain, not reinventing each component.",
      keywords: "prior work contribution Zboray Jones Chen Tovar Harvie Caron Dasgupta established",
      url: "description.html",
      anchor: "prior-work",
    },
    {
      pageTitle: "Description",
      section: "Evidence ladder",
      excerpt: "Validation ladder A–G with designed versus planned/pending labels applied only from explicit Description source text.",
      keywords: "evidence ladder construct VUAA1 VOC measurement decode integration food designed planned",
      url: "description.html",
      anchor: "evidence-ladder",
    },
    {
      pageTitle: "Description",
      section: "Current project status",
      excerpt: "Hardware is the most mature subsystem. Schematic and PCB design are completed or under review. Wet Lab, Hardware, and Model experimental performance are not yet reported here.",
      keywords: "current status designed built measured validated hardware schematic PCB",
      url: "description.html",
      anchor: "current-status",
    },
    {
      pageTitle: "Description",
      section: "Human Practices",
      excerpt: "External feedback narrowed 2026 to early fungal-risk screening and changed the output from a detected signal to a follow-up action.",
      keywords: "human practices fungal-risk screening storage incoming QC decision insight design",
      url: "description.html",
      anchor: "human-practices",
    },
    {
      pageTitle: "Description",
      section: "What AeroSense is and is not",
      excerpt: "AeroSense is a screening platform, not a mycotoxin assay, regulatory test replacement, or validated diagnostic device.",
      keywords: "boundaries screening mycotoxin GC-MS diagnostic not claimed",
      url: "description.html",
      anchor: "is-and-is-not",
    },
    {
      pageTitle: "Description",
      section: "Our 2026 Goal",
      excerpt: "Establish the smallest complete evidence chain from engineered receptor response to calibrated measurement and interpretable odor-pattern information.",
      keywords: "2026 goal evidence chain GCaMP calibrated measurement decoding",
      url: "description.html",
      anchor: "goals-2026",
    },
    {
      pageTitle: "Description",
      section: "Continue exploring",
      excerpt: "Continue to Design, Experiments, Hardware, Model, Engineering, Human Practices, and Results for layer detail.",
      keywords: "related wiki pages Design Experiments Hardware Model Engineering Results",
      url: "description.html",
      anchor: "continue-exploring",
    },
    {
      pageTitle: "Description",
      section: "Figure 1. From invisible change to visible loss",
      excerpt: "Conceptual screening-window schematic. Not experimental data and not adapted from a published figure.",
      keywords: "Figure 1 screening window conceptual schematic VOC deterioration",
      url: "description.html",
      anchor: "fig-screening-window",
    },
    {
      pageTitle: "Description",
      section: "Figure 2. From odorant to a measurable optical output",
      excerpt: "Explanatory schematic of VOC to OR/Orco to calcium to GCaMP fluorescence. Not experimental data.",
      keywords: "Figure 2 mechanism schematic OR Orco GCaMP conceptual",
      url: "description.html",
      anchor: "fig-bio-mechanism",
    },
    {
      pageTitle: "Description",
      section: "Figure 3. The AeroSense measurement chain",
      excerpt: "Design illustration of Sense, Read, Decode, and Act. Proposed architecture, not experimental data.",
      keywords: "Figure 3 pipeline measurement chain our design LMP7721 ESP32",
      url: "description.html",
      anchor: "fig-pipeline",
    },
    {
      pageTitle: "Description",
      section: "References",
      excerpt: "Numbered bibliography [1]–[11] with DOI links and backlinks to first in-text citations.",
      keywords: "references bibliography DOI Gu Zboray Jones Chen Tovar Harvie Caron Dasgupta",
      url: "description.html",
      anchor: "references",
    },

    /* Contribution */
    {
      pageTitle: "Contribution",
      section: "What Can the Next iGEM Team Reuse?",
      excerpt: "Reuse and reproducibility hub: interfaces, design decisions, protocols, files and failures across the bio-digital sensing chain. No package is labeled Released or Validated on this page.",
      keywords: "contribution reuse reproducibility hub future teams documentation only",
      url: "contribution.html",
      anchor: "main",
    },
    {
      pageTitle: "Contribution",
      section: "AeroSense reuse map",
      excerpt: "Biology → Measurement Hardware → Data Contract → Neuromorphic Model → Engineering / Human Practices Knowledge. Distinct from Sense → Read → Decode → Act.",
      keywords: "reuse map biology hardware data model human practices chain",
      url: "contribution.html",
      anchor: "reuse-map",
    },
    {
      pageTitle: "Contribution",
      section: "Biological sensing package",
      excerpt: "Adaptation map: published OR/Orco precedent versus AeroSense implementation. HEK293T and GCaMP–Orco linker pending verification. No validated AeroSense construct results on this page.",
      keywords: "OR Orco HEK293T GCaMP VUAA1 Zboray parts constructs wet lab",
      url: "contribution.html",
      anchor: "pkg-biology",
    },
    {
      pageTitle: "Contribution",
      section: "Weak-fluorescence hardware package",
      excerpt: "ESP32-standalone reader documentation: photodiode, TIA, ADC, FDM and digital lock-in. Reproduction files not released. Raspberry Pi is a retired iteration.",
      keywords: "hardware TIA ADC ESP32 LMP7721 ADS8866 FDM DLIA photodiode contribution",
      url: "contribution.html",
      anchor: "pkg-hardware",
    },
    {
      pageTitle: "Contribution",
      section: "Measurement and data contract",
      excerpt: "Shared experimental, hardware and model-ready metadata fields. Example datasets and data_dictionary.csv are not released.",
      keywords: "data contract metadata schema wet lab hardware model QC",
      url: "contribution.html",
      anchor: "pkg-data",
    },
    {
      pageTitle: "Contribution",
      section: "Neuromorphic odor-decoding package",
      excerpt: "Fly-inspired decoding with planned baselines, ablations and example input/output. No quantitative results reported here.",
      keywords: "model mushroom body Kenyon AL MB SNN baselines contribution",
      url: "contribution.html",
      anchor: "pkg-model",
    },
    {
      pageTitle: "Contribution",
      section: "Human-practices-to-engineering traceability",
      excerpt: "Reusable traceability method: Stakeholder → Observation → Insight → Design decision → Evidence needed → Re-evaluation. Example input-to-consequence mappings. Template file not released.",
      keywords: "human practices traceability stakeholder design contribution",
      url: "contribution.html",
      anchor: "pkg-hp",
    },
    {
      pageTitle: "Contribution",
      section: "Engineering Lessons Worth Reusing",
      excerpt: "Decision records from measurement-integrity and ESP32-standalone cycles: TIA leakage, ADC vs sensitivity, optical leakage, FDM identity, calibration ladder, retired Raspberry Pi.",
      keywords: "engineering lessons failure knowledge TIA leakage Raspberry Pi ESP32 measurement integrity calibration",
      url: "contribution.html",
      anchor: "lessons",
    },
    {
      pageTitle: "Contribution",
      section: "Reproducibility matrix",
      excerpt: "Evidence dashboard for eleven contribution items: open files, reproduced, quantitatively validated, and where to find each one. Expand a row for limits. Nothing is released or validated on this page.",
      keywords: "reproducibility matrix dashboard open files validated not released evidence",
      url: "contribution.html",
      anchor: "repro-matrix",
    },
    {
      pageTitle: "Contribution",
      section: "What We Have Not Yet Contributed",
      excerpt: "Incomplete work remains visible. Architecture documentation is not biological detection performance.",
      keywords: "limitations incomplete not yet contributed freeze",
      url: "contribution.html",
      anchor: "not-yet",
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
      keywords: "contribution pkg-biology pkg-parts Registry documentation",
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
      section: "Why hardware?",
      excerpt: "Hardware is the READ layer: it must convert weak GCaMP fluorescence into digital measurements while preserving measurement integrity.",
      keywords: "need READ layer GCaMP fluorescence measurement integrity HEK293T Orco",
      url: "hardware.html",
      anchor: "why-hardware",
    },
    {
      pageTitle: "Hardware",
      section: "How AeroSense reads light",
      excerpt: "The sensing chain is 470 nm LED, sample, photodiode, TIA, 16-bit ADC, ESP32, then DLIA or preprocessing.",
      keywords: "signal chain LED photodiode TIA LMP7721 ADS8866 ESP32 VEMD5060X01",
      url: "hardware.html",
      anchor: "how-aerosense-reads",
    },
    {
      pageTitle: "Hardware",
      section: "The measurement challenge",
      excerpt: "Excitation leakage, ambient light, electronic noise, PCB leakage, drift, and optical crosstalk make measurement integrity more important than ADC bits.",
      keywords: "measurement challenge leakage noise drift crosstalk high-impedance",
      url: "hardware.html",
      anchor: "measurement-challenge",
    },
    {
      pageTitle: "Hardware",
      section: "Optical design",
      excerpt: "Four approximately 470 nm side-view LEDs and an intended orthogonal collection path; filter and enclosure remain measurement requirements.",
      keywords: "optical design LED filter photodiode excitation 470 nm Würth",
      url: "hardware.html",
      anchor: "optical-design",
    },
    {
      pageTitle: "Hardware",
      section: "Multiplexing the signal",
      excerpt: "Provisional FDM tones at 137, 173, 211, and 257 Hz plus digital lock-in remain hypotheses until measured. Figure H5 is a conceptual demonstration, not a spectrum or SNR result.",
      keywords: "multiplexing FDM DLIA lock-in 137 173 211 257 Hz conceptual demonstration",
      url: "hardware.html",
      anchor: "multiplexing",
    },
    {
      pageTitle: "Hardware",
      section: "Engineering iterations",
      excerpt: "V1 failed a 2 August DRC/ERC audit (73 DRC, 4 unconnected, 7 ERC errors, 11 ERC warnings). Review informed the 11 September V2 layout; fabrication is pending.",
      keywords: "PCB V1 V2 DRC ERC ESP32 Raspberry Pi standalone LMP7721 ADS8866 guard high-impedance",
      url: "hardware.html",
      anchor: "engineering-iterations",
    },
    {
      pageTitle: "Hardware",
      section: "Validation and evidence",
      excerpt: "No assembled-reader measurements are reported. Design evidence is separated from a ten-stage validation ladder that is entirely pending.",
      keywords: "validation dark noise crosstalk fluorescence calibration pending ladder bring-up user testing",
      url: "hardware.html",
      anchor: "validation-evidence",
    },
    {
      pageTitle: "Hardware",
      section: "Can someone other than us use it?",
      excerpt: "User testing is pending. Final UI is not finalized. No operator sessions are recorded.",
      keywords: "user testing usability task success feedback pending UI",
      url: "hardware.html",
      anchor: "user-testing",
    },
    {
      pageTitle: "Hardware",
      section: "Built for reproduction",
      excerpt: "Build AeroSense lists electronics, mechanical, firmware, and validation files. None are published as wiki downloads yet.",
      keywords: "reproducibility KiCad Gerber BOM firmware enclosure downloads Build AeroSense",
      url: "hardware.html",
      anchor: "reproducibility",
    },
    {
      pageTitle: "Hardware",
      section: "Limitations and next build",
      excerpt: "No experimental detection limit is assigned yet; filter, enclosure, power, UI, and FDM/DLIA characterization remain open.",
      keywords: "limitations detection limit enclosure user testing pending validation",
      url: "hardware.html",
      anchor: "limitations",
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
      section: "Education philosophy",
      excerpt: "AeroSense Education is a loop: learn, play, question, measure, listen, iterate. This page is the documented story for judges, not the course.",
      keywords: "education purpose philosophy loop learn play question measure listen iterate",
      url: "education.html",
      anchor: "philosophy",
    },
    {
      pageTitle: "Education",
      section: "From outreach to mutual learning",
      excerpt: "Education is not successful because we reached people. It is successful only if something changed — for them or for us.",
      keywords: "outreach mutual learning feedback measure change",
      url: "education.html",
      anchor: "from-outreach",
    },
    {
      pageTitle: "Education",
      section: "Interactive Learning Platform",
      excerpt: "Five-module online curriculum with same-concept pre/post assessment and stable item IDs.",
      keywords: "learning platform curriculum modules pre post knowledge gain",
      url: "education.html",
      anchor: "learning-platform",
    },
    {
      pageTitle: "Education",
      section: "Education through play",
      excerpt: "Games share the EducationEvidenceLoop with workshops and the Learning Lab. Odor Pixel Suite is not hosted. Not an Education medal evidence item until licensed and evaluated.",
      keywords: "interactive tools games odor pixel pattern mixture evidence loop",
      url: "education.html",
      anchor: "interactive-tools",
    },
    {
      pageTitle: "Education",
      section: "Workshops & talks",
      excerpt: "No face-to-face event is published. The empty evidence loop is the standard the next workshop must fill.",
      keywords: "workshops talks face-to-face attendance evidence loop unpublished",
      url: "education.html",
      anchor: "workshops",
    },
    {
      pageTitle: "Education",
      section: "Evidence View",
      excerpt: "Optional view on the Education page. Highlights dialogue, measurement, iteration, project change, reusable resource, and limitation labels without hiding the narrative.",
      keywords: "evidence view story view labels measurement iteration project change reusable resource limitation dialogue",
      url: "education.html?view=evidence",
      anchor: "",
    },
    {
      pageTitle: "Education",
      section: "Education evidence loop",
      excerpt: "Every activity uses the same seven steps: question, design, engage, evidence, learn, change, reuse. Compact timeline or detailed case study.",
      keywords: "EducationEvidenceLoop question design engage evidence learn change reuse compact timeline case study",
      url: "education.html",
      anchor: "learning-platform",
    },
    {
      pageTitle: "Education",
      section: "Did people actually learn?",
      excerpt: "Methodology for same-concept pre/post scoring. No published cohort results. Knowledge gain is not a complete measure of scientific literacy.",
      keywords: "evaluation measuring pre post knowledge gain item ID survey",
      url: "education.html",
      anchor: "measuring",
    },
    {
      pageTitle: "Education",
      section: "The same question, three experiences",
      excerpt: "Three mycotoxin misconception items designed for survey, game, and Learning Lab. Analysis pending.",
      keywords: "MYTH_MOLD_REMOVE MYTH_HEAT_DESTROY MYTH_LOOK_SMELL_SAFE survey game platform",
      url: "education.html",
      anchor: "three-experiences",
    },
    {
      pageTitle: "Education",
      section: "Open educational resources",
      excerpt: "Learning Lab and item-ID schema are live. Teacher guide, game files, and graphics remain in preparation. No fake downloads.",
      keywords: "toolkit reusable contribution pkg-education lesson resources",
      url: "education.html",
      anchor: "toolkit",
    },
    {
      pageTitle: "Learning Lab",
      section: "Your learning journey",
      excerpt: "Five open modules from odor patterns to responsible screening decisions. Progress stays in this browser.",
      keywords: "learning lab journey modules dashboard progress odor biosensor",
      url: "learning-platform.html",
      anchor: "learn-journey",
    },
    {
      pageTitle: "Learning Lab",
      section: "Your learning dashboard",
      excerpt: "Personal module status, pre/post scores, knowledge gain in percentage points, and reflections stored on this device only.",
      keywords: "dashboard progress score pre post knowledge gain reflection reset local",
      url: "learning-platform/progress.html",
      anchor: "",
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

  function assetRoot() {
    var raw = document.body && document.body.getAttribute("data-asset-root");
    if (!raw) return "";
    return raw.charAt(raw.length - 1) === "/" ? raw : raw + "/";
  }

  function hrefFor(entry) {
    var path = entry.url + (entry.anchor ? "#" + entry.anchor : "");
    if (!path || path.charAt(0) === "#" || path.charAt(0) === "/" || /^[a-z]+:/i.test(path)) {
      return path;
    }
    return assetRoot() + path;
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

    if (input) {
      input.setAttribute("role", "combobox");
      input.setAttribute("aria-autocomplete", "list");
      input.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-haspopup", "listbox");
    }

    function runSearch() {
      var q = input ? input.value : "";
      if (clearBtn) clearBtn.hidden = !String(q).trim();
      renderResults(dialog, search(q), q);
    }

    function openDialog() {
      if (!dialog.open) dialog.showModal();
      if (input) {
        input.setAttribute("aria-expanded", "true");
        input.focus();
        input.select();
      }
      runSearch();
    }

    function closeDialog() {
      if (dialog.open) dialog.close();
      if (input) input.setAttribute("aria-expanded", "false");
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
