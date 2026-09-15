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
      section: "Engineering principle",
      excerpt: "Design → Build → Test → Learn → Redesign. A cycle closes only when evidence forced a redesign or a deliberate refusal to change.",
      keywords: "DBTL engineering cycle Design Build Test Learn Redesign",
      url: "engineering.html",
      anchor: "engineering-principle",
    },
    {
      pageTitle: "Engineering",
      section: "Engineering map",
      excerpt: "SENSE Wet Lab, READ Hardware, DECODE Dry Lab, ACT integrated decisions. Hardware shown first as the clearest completed track.",
      keywords: "Sense Read Decode Act engineering map Hardware Wet Lab Dry Lab",
      url: "engineering.html",
      anchor: "engineering-map",
    },
    {
      pageTitle: "Engineering",
      section: "Hardware Cycle 1",
      excerpt: "V1 LED→PD→TIA→ADC→ESP32; August 2 archive 73 DRC / 4 unconnected / 7 ERC errors / 11 ERC warnings; high gain ≠ high sensitivity; measurement-integrity V2 redesign. REVIEW-SUPPORTED.",
      keywords: "hw-cycle-1 DRC ERC LMP7721 ADS8866 measurement integrity 100 MΩ iST",
      url: "engineering.html",
      anchor: "hw-cycle-1",
    },
    {
      pageTitle: "Engineering",
      section: "Hardware Cycle 2",
      excerpt: "Architecture review: ESP32 + Raspberry Pi → functional decomposition → ESP32 standalone with battery/USB-C power-path. REVIEW-SUPPORTED, not physical validation.",
      keywords: "hw-cycle-2 Raspberry Pi ESP32 standalone battery USB-C architecture review",
      url: "engineering.html",
      anchor: "hw-cycle-2",
    },
    {
      pageTitle: "Engineering",
      section: "Hardware Cycle 3",
      excerpt: "From PCB to instrument: V2 layout ~100×90 mm; Learn/Redesign pending; validation ladder 10 steps all PLANNED.",
      keywords: "hw-cycle-3 validation ladder FDM DLIA dark noise IN PROGRESS",
      url: "engineering.html",
      anchor: "hw-cycle-3",
    },
    {
      pageTitle: "Engineering",
      section: "Hardware change log",
      excerpt: "Hardware evidence → learning → design change table, including pending physical and user-test rows.",
      keywords: "hw-change-log ADS8866 3V3_ANA guarding Raspberry Pi",
      url: "engineering.html",
      anchor: "hw-change-log",
    },
    {
      pageTitle: "Engineering",
      section: "Professional engineering review",
      excerpt: "iST Group external schematic/layout review — labeled external engineering support, not team-authored work.",
      keywords: "hw-professional-review iST Group external attribution",
      url: "engineering.html",
      anchor: "hw-professional-review",
    },
    {
      pageTitle: "Engineering",
      section: "Hardware track",
      excerpt: "READ layer cycles: measurable circuit, ESP32-standalone after Raspberry Pi removal, PCB-to-instrument still open.",
      keywords: "track-hardware hw-cycle measurement integrity ESP32 Raspberry Pi V2",
      url: "engineering.html",
      anchor: "track-hardware",
    },
    {
      pageTitle: "Engineering",
      section: "Wet Lab Cycle 0",
      excerpt: "Cloning backbone lacked mammalian promoter/polyA; all ten constructs migrated to pcDNA3.1(+). Verify host elements before synthesis.",
      keywords: "wl-cycle-0 pcDNA3.1 promoter polyA transcription-competent",
      url: "engineering.html",
      anchor: "wl-cycle-0",
    },
    {
      pageTitle: "Engineering",
      section: "Wet Lab Cycle 1",
      excerpt: "Orco–IRES–GCaMP6: real but weak VUAA1 fluorescence; revised hypothesis points to IRES-downstream reporter abundance/proximity. MEASURED.",
      keywords: "wl-cycle-1 Orco IRES GCaMP6 VUAA1 weak signal",
      url: "engineering.html",
      anchor: "wl-cycle-1",
    },
    {
      pageTitle: "Engineering",
      section: "Wet Lab Cycle 2",
      excerpt: "GCaMP6f–(GGGGS)3–Orco fusion BBa_26E11Z80 built; imaging pending. Success criteria vs observed result separated. BUILT — TEST PENDING.",
      keywords: "wl-cycle-2 fusion GCaMP6f Orco topology BBa_26E11Z80",
      url: "engineering.html",
      anchor: "wl-cycle-2",
    },
    {
      pageTitle: "Engineering",
      section: "Wet Lab diagnostic logic",
      excerpt: "Ionomycin × VUAA1 matrix separates reporter vs channel failure modes.",
      keywords: "wl-diagnostic-logic ionomycin VUAA1 diagnostic matrix",
      url: "engineering.html",
      anchor: "wl-diagnostic-logic",
    },
    {
      pageTitle: "Engineering",
      section: "Wet Lab track",
      excerpt: "SENSE layer cycles: transcription-competent vector, Orco–IRES–GCaMP6 weak signal, GCaMP6f–Orco fusion in progress.",
      keywords: "track-wetlab wl-cycle Orco IRES GCaMP6 fusion VUAA1",
      url: "engineering.html",
      anchor: "track-wetlab",
    },
    {
      pageTitle: "Engineering",
      section: "Dry Lab Cycle 0",
      excerpt: "Multi-seed honesty (~0.90 luck vs ~0.85 mean); pca_dim=5 stability; SNN missing StandardScaler caused sensor-importance contradiction. MEASURED.",
      keywords: "dl-cycle-0 multi-seed StandardScaler PCA sensor importance",
      url: "engineering.html",
      anchor: "dl-cycle-0",
    },
    {
      pageTitle: "Engineering",
      section: "Dry Lab Cycle 1",
      excerpt: "Quantize_states clock bug self.dt 1ms vs defaultclock.dt 0.1ms; 9/10 steps unquantized; bit-sweep INVALIDATED. w_kc_mbon=13 candidate gate pending.",
      keywords: "dl-cycle-1 quantization Brian2 bug w_kc_mbon validation gate",
      url: "engineering.html",
      anchor: "dl-cycle-1",
    },
    {
      pageTitle: "Engineering",
      section: "Dry Lab modeling practice",
      excerpt: "Multi-seed by default; audit preprocessing; validation gates; bugs invalidate conclusions.",
      keywords: "dl-practice modeling integrity validation",
      url: "engineering.html",
      anchor: "dl-practice",
    },
    {
      pageTitle: "Engineering",
      section: "Dry Lab track",
      excerpt: "DECODE layer cycles: data integrity and multi-seed discipline; precision budget sweep gated pending validation.",
      keywords: "track-drylab dl-cycle neuromorphic F1 PCA precision budget",
      url: "engineering.html",
      anchor: "track-drylab",
    },
    {
      pageTitle: "Engineering",
      section: "When external evidence changed the design",
      excerpt: "Three compact ACT cases: beachhead narrowing, screening-layer repositioning, VOC≠safety claim boundary. Not biological evidence.",
      keywords: "beyond the bench external evidence Problem loop Human Practices",
      url: "engineering.html",
      anchor: "track-integrated",
    },
    {
      pageTitle: "Engineering",
      section: "Case · beachhead",
      excerpt: "Six-crop assumption → mentor review → banana beachhead focus.",
      keywords: "xcase-beachhead FITI mentor banana",
      url: "engineering.html",
      anchor: "xcase-beachhead",
    },
    {
      pageTitle: "Engineering",
      section: "Case · screening layer",
      excerpt: "Cheaper than GC-MS assumption → instrumentation interview → Fast On-site Low operator dependence.",
      keywords: "xcase-screening GC-MS screening layer",
      url: "engineering.html",
      anchor: "xcase-screening",
    },
    {
      pageTitle: "Engineering",
      section: "Case · claim boundary",
      excerpt: "VOC detection ≠ food-safety verdict → Chia-Nien interview → careful claim framing.",
      keywords: "xcase-claims VOC aflatoxin Or49b",
      url: "engineering.html",
      anchor: "xcase-claims",
    },
    {
      pageTitle: "Engineering",
      section: "Integrated decisions",
      excerpt: "ACT track: Entrepreneurship beachhead cycles complete; Education playtest data still pending.",
      keywords: "track-integrated Human Practices entrepreneurship education",
      url: "engineering.html",
      anchor: "track-integrated",
    },
    {
      pageTitle: "Engineering",
      section: "What remains unknown",
      excerpt: "Open items: Hardware C3 physical tests, Wet Lab C2 imaging, Dry Lab validation gate, education playtests, end-to-end integration.",
      keywords: "unknown pending validation incomplete Learn Redesign",
      url: "engineering.html",
      anchor: "what-remains-unknown",
    },
    {
      pageTitle: "Engineering",
      section: "Engineering change log",
      excerpt: "Evidence → learning → design-change ledger across Hardware, Wet Lab, Dry Lab, and Human Practices.",
      keywords: "change log evidence learning redesign",
      url: "engineering.html",
      anchor: "change-log",
    },
    {
      pageTitle: "Engineering",
      section: "Reproduce / reuse this work",
      excerpt: "Available now vs in preparation vs not yet available: V1/V2 design files, construct maps, DRC/ERC reports, and honest gaps for firmware, sequences, and dry-lab packages.",
      keywords: "reproduce reuse availability BOM KiCad schematic firmware construct maps DRC ERC validation ladder not released yet",
      url: "engineering.html",
      anchor: "reproduce-reuse",
    },
    {
      pageTitle: "Engineering",
      section: "References",
      excerpt: "Consolidated Hardware, Wet Lab, Dry Lab, and Human Practices citations: datasheets, literature DOIs, and team documentation.",
      keywords: "references citations bibliography H1 H2 H3 W1 W2 W3 W4 W5 W6 D1 I1 I2 Jones Chen Zboray Benton Butterwick LMP7721 ADS8866 ESP32 Brian2 Stimberg iST datasheet",
      url: "engineering.html",
      anchor: "references",
    },

    /* Safety */
    {
      pageTitle: "Safety & Security",
      section: "Safety at a glance",
      excerpt: "Six domains, one vocabulary: Verified means a measurement, inspection, or formal record; Implemented is a procedure in use; Planned is not done; Restricted is out of scope.",
      keywords: "safety security SDS SOP risk overview glance verified implemented planned restricted",
      url: "safety-and-security.html",
      anchor: "safety-at-a-glance",
    },
    {
      pageTitle: "Safety & Security",
      section: "Our safety case",
      excerpt: "Safety follows Sense → Read → Decode → Act. A control in a schematic is not a verified result.",
      keywords: "safety case sense read decode act hazard control verification",
      url: "safety-and-security.html",
      anchor: "our-safety-case",
    },
    {
      pageTitle: "Safety & Security",
      section: "Biological materials",
      excerpt: "Named cloning and sensing materials include E. coli DH5α and HEK293/HEK293T. Chassis identity is not frozen. Final project organism inventory pending team confirmation.",
      keywords: "HEK293 HEK293T biological materials chassis containment Drosophila DH5α",
      url: "safety-and-security.html",
      anchor: "biological-materials",
    },
    {
      pageTitle: "Safety & Security",
      section: "Chemical safety",
      excerpt: "Concentrated VOC stocks, VUAA1, and DMSO are the higher exposure risk. An SDS pack is not published. Assay concentrations are a specified method, not a completed record.",
      keywords: "VOC chemical VUAA1 DMSO SDS handling fume hood",
      url: "safety-and-security.html",
      anchor: "chemical-voc",
    },
    {
      pageTitle: "Safety & Security",
      section: "Hardware and physical hazards",
      excerpt: "Low-voltage reader architecture, visible ~470 nm LEDs, and a future cartridge interface. Datasheet features are not assembled-system tests.",
      keywords: "hardware hazards LED laser electrical thermal enclosure battery",
      url: "safety-and-security.html",
      anchor: "hardware-hazards",
    },
    {
      pageTitle: "Safety & Security",
      section: "Safe to interpret",
      excerpt: "Signal detected, measurement valid, and food-safety confirmed are three different questions. AeroSense does not answer the third.",
      keywords: "measurement integrity false negative false positive diagnostic screening Q1 Q2 Q3",
      url: "safety-and-security.html",
      anchor: "safe-to-interpret",
    },
    {
      pageTitle: "Safety & Security",
      section: "Safe to deploy",
      excerpt: "iGEM 2026 scope is laboratory contained-use only. Extra-lab live engineered-cell cartridges are not authorized on this wiki.",
      keywords: "deployment containment cartridge field laboratory restricted",
      url: "safety-and-security.html",
      anchor: "safe-to-deploy",
    },
    {
      pageTitle: "Safety & Security",
      section: "People and data",
      excerpt: "Named quotations or identifiable professional comments are published only where explicit permission for attribution has been obtained. No IRB determination is claimed.",
      keywords: "people data privacy survey interview consent IRB training",
      url: "safety-and-security.html",
      anchor: "people-and-data",
    },
    {
      pageTitle: "Safety & Security",
      section: "Biosecurity and dual use",
      excerpt: "AeroSense currently has low but non-zero dual-use relevance. Modular receptor expansion should trigger renewed review.",
      keywords: "biosecurity dual-use misuse access control receptor swap",
      url: "safety-and-security.html",
      anchor: "biosecurity",
    },
    {
      pageTitle: "Safety & Security",
      section: "Risk register",
      excerpt: "Thirty hazards across wet lab, hardware, measurement, people, and deployment. No row is marked Verified.",
      keywords: "risk register hazard control verification planned restricted",
      url: "safety-and-security.html",
      anchor: "risk-register",
    },
    {
      pageTitle: "Safety & Security",
      section: "AeroSafe",
      excerpt: "A project-derived safety-case chain for living biosensors. Not an established community standard. Downloadable templates are planned, not published.",
      keywords: "AeroSafe contribution safety-case template living biosensor",
      url: "safety-and-security.html",
      anchor: "aerosafe",
    },
    {
      pageTitle: "Safety & Security",
      section: "2026 Safety & Security award map",
      excerpt: "Judge navigation: contribution, platform, existing tools, managed risks, and real-world use, each with evidence, inspection links, and remaining gaps.",
      keywords: "award map safety security judging evidence gap",
      url: "safety-and-security.html",
      anchor: "award-map",
    },

    /* Members / Attributions */
    {
      pageTitle: "Members",
      section: "Team memories",
      excerpt: "Team memory album: cover artwork and group photographs.",
      keywords: "members team memories photographs album cover members01 members02",
      url: "members.html",
      anchor: "team-memories",
    },
    {
      pageTitle: "Members",
      section: "Team index",
      excerpt: "Short index of student team members, advisors, and PIs.",
      keywords: "team index roster students advisors PI",
      url: "members.html",
      anchor: "team-index",
    },
    {
      pageTitle: "Members",
      section: "Student team",
      excerpt: "Jeffrey (Pin-Che Huang) leads hardware and wiki design. Tim (Chun-Ting Chou) works on the model.",
      keywords: "Jeffrey Pin-Che Huang 黃品喆 Tim Chun-Ting Chou 周峻廷 student team leader hardware wiki design model",
      url: "members.html",
      anchor: "student-team",
    },
    {
      pageTitle: "Members",
      section: "Advisors",
      excerpt: "Jerry (Ching-Che Charng) is an advisor at the Brain Research Center.",
      keywords: "Jerry Ching-Che Charng 強敬哲 advisor Brain Research Center",
      url: "members.html",
      anchor: "advisors",
    },
    {
      pageTitle: "Members",
      section: "PIs",
      excerpt: "Primary and Secondary PI profiles coming soon.",
      keywords: "PI principal investigator Primary Secondary",
      url: "members.html",
      anchor: "pis",
    },
    {
      pageTitle: "Members",
      section: "Keep in touch",
      excerpt: "AeroSense on Instagram, LinkedIn, and email.",
      keywords: "contact Instagram LinkedIn email aerosensebio igem_tsinghua keep in touch",
      url: "members.html",
      anchor: "team-contact",
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
      section: "AeroSense Parts Collection",
      excerpt: "A modular Drosophila olfactory toolkit for building nine receptor-specific living-cell odor sensors with one shared fluorescence readout. 14 new basic, 10 new composites, 2 reused Registry parts.",
      keywords: "parts collection Registry BBa_ basic composite reused sensing lines Or7a GCaMP6f",
      url: "parts.html",
      anchor: "main",
    },
    {
      pageTitle: "Parts",
      section: "One collection, three layers",
      excerpt: "Input: nine tuning ORs. Transduction: DmOrco. Output: GCaMP6f as the intended fluorescence readout. mCherry is an expression marker, not the measurement.",
      keywords: "three layers input OR Orco GCaMP6f mCherry marker ion channel",
      url: "parts.html",
      anchor: "three-layers",
    },
    {
      pageTitle: "Parts",
      section: "Build an AeroSense sensor",
      excerpt: "Choose one of nine final-panel ORs. Only the OR CDS changes. Membrane schematic with OR, Orco, cytosolic GCaMP6f, and mCherry as a separate marker.",
      keywords: "sensing reporting Kozak IRES mCherry GCaMP6f linker DmOrco cassette Or7a Or22a Or35a Or42a Or59b Or67a Or85b Or98a Or19a",
      url: "parts.html",
      anchor: "build-sensor",
    },
    {
      pageTitle: "Parts",
      section: "Parts catalogue",
      excerpt: "14 new basic parts, 10 new composites, and 2 reused Registry parts. Search by name or Registry ID.",
      keywords: "catalogue catalog composite basic reused search RFC 1000 Or67b BBa_26E11Z80 BBa_K5490030 BBa_K4177005",
      url: "parts.html",
      anchor: "explore",
    },
    {
      pageTitle: "Parts",
      section: "Design decisions that matter",
      excerpt: "N-terminal GCaMP6f, codon optimisation that preserves protein sequence, Registry reuse of IRES and mCherry, and Or67b kept as first-generation documentation.",
      keywords: "N-terminal topology codon optimisation reuse Or67b IRES mCherry",
      url: "parts.html",
      anchor: "design-decisions",
    },
    {
      pageTitle: "Parts",
      section: "Before you reuse these parts",
      excerpt: "HEK293 literature covers four panel receptors; only Or85b and Or98a overlap the VOC-responsive Zboray panel. mCherry does not prove trafficking.",
      keywords: "HEK293 Zboray Or85b Or98a Or7a Or19a mCherry NLS reuse notes",
      url: "parts.html",
      anchor: "reuse-notes",
    },
    {
      pageTitle: "Parts",
      section: "Assembly and sequence QC",
      excerpt: "RFC 1000 compatible sensing composites: Or85b, Or59b, Or42a, Or98a. In-silico sequence QC is computational, not experimental sequencing.",
      keywords: "RFC 1000 PstI in-silico sequence QC pcDNA3.1 BsaI SapI",
      url: "parts.html",
      anchor: "assembly-qc",
    },
    {
      pageTitle: "Parts",
      section: "Plasmid atlas",
      excerpt: "Nine final sensing maps plus the GCaMP6f–Orco reporter map. Or67b pTwist image is first-generation, not a counted composite. Maps show experimental plasmids; registered composites are inserts, not the backbone.",
      keywords: "plasmid atlas maps Or67b pTwist GCaMP6f_GGGGSx3_DmOrco pcDNA3.1 backbone insert",
      url: "parts.html",
      anchor: "plasmid-atlas",
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
      section: "Experimental workflow",
      excerpt: "One canonical protocol sequence: molecular cloning, mammalian cell culture, transfection, stable-line selection, expression/functional validation, calcium imaging assay, and data analysis.",
      keywords: "workflow cloning culture transfection G418 validation calcium imaging data analysis figure 1 EXP-AS-01 EXP-AS-02 EXP-AS-03 EXP-AS-04 EXP-AS-05 EXP-AS-07",
      url: "experiments.html",
      anchor: "workflow",
    },
    {
      pageTitle: "Experiments",
      section: "Molecular cloning",
      excerpt: "Sequence-checked, endotoxin-free plasmids: DH5α propagation, maxiprep, T7/BGH junction sequencing. Bacterial prep is part of cloning, not a separate numbered step.",
      keywords: "pcDNA3.1 GenScript DH5α T7 BGH GGGGS plasmids Ampicillin cloning EXP-AS-01",
      url: "experiments.html",
      anchor: "molecular-cloning",
    },
    {
      pageTitle: "Experiments",
      section: "Mammalian cell culture",
      excerpt: "Current protocol specification names HEK293 in DMEM with 10 % FBS, passaged at ~80 % confluence, detached with TrypLE Express. HEK293 vs HEK293T is unresolved.",
      keywords: "HEK293 DMEM TrypLE FBS penicillin culture EXP-AS-02",
      url: "experiments.html",
      anchor: "cell-culture",
    },
    {
      pageTitle: "Experiments",
      section: "Transfection",
      excerpt: "Current specification: electroporation in suspension, ~5 µg DNA, OR plasmid : Orco plasmid DNA mass ratio 2:1, antibiotic-free recovery. Pulse parameters pending. Zboray FuGene HD is not substituted.",
      keywords: "electroporation DNA mass ratio 2:1 OR Orco plasmid transfection EXP-AS-02",
      url: "experiments.html",
      anchor: "transfection",
    },
    {
      pageTitle: "Experiments",
      section: "Stable-line selection",
      excerpt: "G418 protocol target / literature-informed starting condition: 100 µg/mL, then 150 µg/mL, maintenance ~75 µg/mL. Not an AeroSense-validated kill curve.",
      keywords: "G418 NeoR protocol target stable selection",
      url: "experiments.html",
      anchor: "stable-selection",
    },
    {
      pageTitle: "Experiments",
      section: "Expression / functional validation",
      excerpt: "Core methods: mCherry transcription readout and VUAA1 as a synthetic Orco agonist functional positive control. Ionomycin and Western blot optional / implementation details pending.",
      keywords: "mCherry GCaMP6f VUAA1 Orco functional positive control EXP-AS-03 EXP-AS-04 expression",
      url: "experiments.html",
      anchor: "expression-validation",
    },
    {
      pageTitle: "Experiments",
      section: "Calcium imaging assay",
      excerpt: "384-well two-round injection adapted from Zboray et al.: 20 µL buffer, 7 µL vehicle, 9 µL of 4× VOC. 50 µM VUAA1 reference. Plate-reader model not specified.",
      keywords: "VOC 384-well calcium imaging injection buffer VUAA1 50 µM EXP-AS-05 Zboray",
      url: "experiments.html",
      anchor: "calcium-imaging",
    },
    {
      pageTitle: "Experiments",
      section: "Two-round calcium assay",
      excerpt: "20 µL assay buffer plus 7 µL vehicle equals 27 µL; plus 9 µL of 4× VOC equals 36 µL. 9/36 = 1/4, so a 4× stock is 1× final. Round 1 vehicle then round 2 odorant.",
      keywords: "two-round injection 20 µL 7 µL 9 µL 36 µL 4× vehicle VOC figure 3 Zboray",
      url: "experiments.html",
      anchor: "fig-two-round",
    },
    {
      pageTitle: "Experiments",
      section: "Reagent preparation",
      excerpt: "VUAA1 50 mM DMSO stock stored at −20 °C; VOC working solutions prepared fresh; concentrated stocks in amber glass with PTFE-lined caps.",
      keywords: "VUAA1 DMSO VOC PTFE reagent preparation stock",
      url: "experiments.html",
      anchor: "reagent-preparation",
    },
    {
      pageTitle: "Experiments",
      section: "Data analysis",
      excerpt: "R = (Fmax − F0) / F0. R_norm = R_VOC / mean(R_VUAA1 of the corresponding cell line, same plate/day). Zboray et al. denote R as ΔF. Values ≤ 0.05 treated as zero; Grubbs’ test α not specified here.",
      keywords: "R R_norm VUAA1 normalisation plate day mean Grubbs Model EXP-AS-07",
      url: "experiments.html",
      anchor: "data-analysis",
    },
    {
      pageTitle: "Experiments",
      section: "Controls",
      excerpt: "Electroporation controls, untransfected G418 well, vehicle injection, plate/day VUAA1 mean reference, Ca2+-free specificity control, and matched DMSO.",
      keywords: "control matrix vehicle VUAA1 Orco G418",
      url: "experiments.html",
      anchor: "controls",
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
      section: "Engineering / validation history",
      excerpt: "Multi-seed lesson, missing StandardScaler on SNN PCA, quantization clock bug, and gated w_kc_mbon=13 candidate — linked to Engineering Dry Lab DBTL.",
      keywords: "multi-seed StandardScaler quantize_states defaultclock w_kc_mbon validation history Engineering Dry Lab",
      url: "model.html",
      anchor: "engineering-validation-history",
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
      section: "What changed because of Human Practices",
      excerpt: "Fast summary of application focus, sensing priorities, claim language, and target discipline revisions driven by stakeholders.",
      keywords: "summary what changed human practices beachhead claim language",
      url: "human-practices.html",
      anchor: "summary",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "Stakeholder ecosystem",
      excerpt: "Interactive map of field, industry, science, business, governance, and public stakeholders with Engaged, Ongoing, and Planned status labels.",
      keywords: "stakeholder ecosystem constellation farmers FITI Chia-Nien analytical instrumentation CSO survey planned gap",
      url: "human-practices.html",
      anchor: "stakeholders",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "Analytical-instrumentation interview",
      excerpt: "2026-09-13 industry interview that shifted AeroSense from cheaper GC–MS substitute to Fast · On-site · Low operator dependence screening layer.",
      keywords: "analytical instrumentation GC-MS LC-MS screening layer institutional buyers 2026-09-13",
      url: "human-practices.html",
      anchor: "st-analytical",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "The AeroSense decision trail",
      excerpt: "Provenance chains from assumption through external input, insight, change, and next evidence — including beachhead, screening role, claim boundaries, and target selection.",
      keywords: "decision trail provenance assumption insight change FITI Chia-Nien analytical screening beachhead",
      url: "human-practices.html",
      anchor: "decision-trail",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "Eight questions that changed our project",
      excerpt: "Evidence journey from early detection and e-nose limits through biology, targets, hardware, beachhead, claim boundaries, and wrong-score risk design.",
      keywords: "journey eight questions early detection electronic nose biology molecules hardware beachhead claims false negative",
      url: "human-practices.html",
      anchor: "journey",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "Engagements / events",
      excerpt: "Consequence-first engagement cards in Feedback, Network, Public, and Mentorship buckets. SynBioBeta listed as network-only; filters for Technical, Field, Commercial, Governance, Public, Community.",
      keywords: "engagements events FITI Garage SynBioBeta Chia-Nien Taoyuan analytical survey mentorship filter",
      url: "human-practices.html",
      anchor: "engagements",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "Public survey",
      excerpt: "Directional n=28 consumer diagnostic with published x/n counts. Not a population estimate; 100% discard claim held as unverified placeholder.",
      keywords: "public survey n=28 misconception false negative storage discard limitations convenience sample",
      url: "human-practices.html",
      anchor: "public-survey",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "What is worth detecting?",
      excerpt: "Detectability × Consequence × Unmet Need × Willingness to Pay with qualitative statuses and an evidence ladder that stops short of unvalidated application claims.",
      keywords: "target selection detectability consequence unmet need willingness Or49b indole banana mold evidence ladder",
      url: "human-practices.html",
      anchor: "target-selection",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "Responsible implementation & impact",
      excerpt: "Two-sided enable vs harm analysis, SCREEN→TRIAGE→CONFIRM principle, conceptual risk-tier UI without SAFE, non-claims, and concrete validation requirements. Regulatory working hypothesis — confirmation required.",
      keywords: "responsibility screen triage confirm SAFE false negative false positive cartridge regulatory non-claims risk tier confidence QC",
      url: "human-practices.html",
      anchor: "responsibility",
    },
    {
      pageTitle: "Integrated Human Practices",
      section: "What we still do not know",
      excerpt: "Visible continuation roadmap: open technical questions and missing stakeholder evidence with Next / In progress / Blocked labels — not failures and not completed work.",
      keywords: "limitations open questions still unknown exporter packing-house regulatory cartridge false negative field pilot WTP",
      url: "human-practices.html",
      anchor: "limitations",
    },

    /* Education */
    {
      pageTitle: "Education",
      section: "Two education tracks",
      excerpt: "Track A diagnoses residual food-safety decision misconceptions. Track B turns a curious visitor toward synthetic-biology participation. They are not one learning-gain number.",
      keywords: "education two tracks food safety olfactory coding learning lab",
      url: "education.html",
      anchor: "tracks",
    },
    {
      pageTitle: "Education",
      section: "Why we changed the question",
      excerpt: "An initial n=28 diagnostic suggested high mold-risk awareness and residual heat and look/smell habits. That changed what Education chose to teach.",
      keywords: "assumption diagnosis survey n=28 misconception heat smell",
      url: "education.html",
      anchor: "why-we-changed",
    },
    {
      pageTitle: "Education",
      section: "AeroSense Learning Lab",
      excerpt: "Five live modules from Discover to Decide. Module 2 bridges Track A. Cohort learning outcomes not yet reported.",
      keywords: "learning lab discover question build decode decide module 2",
      url: "education.html",
      anchor: "learning-lab",
    },
    {
      pageTitle: "Education",
      section: "Odor Pixel Suite",
      excerpt: "Three playable browser games teach odor patterns, navigation with scent, and mixture decoding. Live public deployment; formal learning evaluation pending. Not a food-safety misconception test.",
      keywords: "odor pixel lab pattern recognition scentbound labyrinth scent mixer fingerprint playable now",
      url: "education.html",
      anchor: "odor-pixel",
    },
    {
      pageTitle: "Education",
      section: "Reach is not the same as learning",
      excerpt: "Social posts distribute claims. Views and comments are not paired knowledge gain. Reach, engagement, and learning evidence are not reported yet.",
      keywords: "social media reels instagram reach engagement not learning",
      url: "education.html",
      anchor: "social-media",
    },
    {
      pageTitle: "Education",
      section: "Where AeroSense’s next scientists begin",
      excerpt: "Learning Lab is live. University workshop and elementary camp are planned deployment environments, not completed events.",
      keywords: "university workshop elementary camp participation ladder Chung-Chuan Lo",
      url: "education.html",
      anchor: "next-scientists",
    },
    {
      pageTitle: "Education",
      section: "Evidence View",
      excerpt: "Optional view on the Education page. Highlights status, method, limitation, reuse, and dialogue without hiding the narrative.",
      keywords: "evidence view story view labels measurement iteration reuse limitation dialogue status method",
      url: "education.html?view=evidence",
      anchor: "",
    },
    {
      pageTitle: "Education",
      section: "What evidence we actually have",
      excerpt: "Learning, dialogue, and reach are separate. Live artifacts are not measured learning gains. Formal cohort evaluation pending.",
      keywords: "evaluation learning dialogue reach delivery pending paired pre post",
      url: "education.html",
      anchor: "how-we-measure",
    },
    {
      pageTitle: "Education",
      section: "Misconception items",
      excerpt: "Three mycotoxin misconception item IDs used by the survey and Learning Lab Module 2. Paired correction rates are not published yet.",
      keywords: "MYTH_MOLD_REMOVE MYTH_HEAT_DESTROY MYTH_LOOK_SMELL_SAFE survey module 2",
      url: "education.html",
      anchor: "misconception-chain",
    },
    {
      pageTitle: "Education",
      section: "Reuse the AeroSense Education Framework",
      excerpt: "Playable Odor Pixel Suite, live Learning Lab, study protocol, question bank, and data dictionary. Teacher toolkit file still in preparation.",
      keywords: "reuse study protocol question bank data dictionary learning lab toolkit",
      url: "education.html",
      anchor: "reuse",
    },

    /* Entrepreneurship */
    {
      pageTitle: "Entrepreneurship",
      section: "Overview",
      excerpt: "From odor to action — before loss becomes visible. Bio-digital VOC screening for food and agricultural supply chains. Screening layer, not a definitive food-safety diagnostic.",
      keywords: "entrepreneurship AeroSense Bio beachhead banana VOC screening B2B venture",
      url: "entrepreneurship.html",
      anchor: "overview",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "How our work addresses Best Entrepreneurship",
      excerpt: "Five judging questions mapped to customers, solution evidence, development plan, capabilities, and long-term impacts.",
      keywords: "Best Entrepreneurship judging evidence map first customer MVP roadmap impacts",
      url: "entrepreneurship.html",
      anchor: "judging-map",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "Choosing Our Beachhead",
      excerpt: "Leading Beachhead Under Validation: banana fungal-disease early detection in Taiwan’s export supply chain. Qualitative Detectability × Consequence × Unmet Need × WTP matrix — no fabricated scores.",
      keywords: "beachhead banana mango tea FITI mentor market thesis matrix Detectability Willingness to Pay",
      url: "entrepreneurship.html",
      anchor: "beachhead",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "The Decision Problem",
      excerpt: "Illustrative batch journey from harvest to shipment. AeroSense is an early screening layer, not a replacement for confirmatory laboratory analysis.",
      keywords: "batch journey packing storage screening layer confirmatory GC-MS visual inspection",
      url: "entrepreneurship.html",
      anchor: "decision-problem",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "Who Actually Needs This?",
      excerpt: "Customer ≠ User ≠ Payer. Roles: QC operator, associations/cooperatives, exporters, labs and certifiers. Individual farmers are not the default buyer.",
      keywords: "user buyer payer validator farmers association packing house certification",
      url: "entrepreneurship.html",
      anchor: "who-needs-this",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "What We Learned Outside the Lab",
      excerpt: "Assumption → insight → decision cards from mentor reviews, field interviews, CSO, Chia-Nien, analytical instrumentation, and public survey.",
      keywords: "FITI mentor Chia-Nien GC-MS survey evidence timeline beachhead pivot",
      url: "entrepreneurship.html",
      anchor: "what-we-learned",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "MVP & Evidence",
      excerpt: "Evidence ladder: concept framing confirmed; engineering design completed (ESP32 V2, Sept 2026); bench prototype through commercial pilot still planned. No fake accuracy or detection limits.",
      keywords: "MVP evidence ladder ESP32 V2 PCB validation pending Disease Risk dark noise DLIA",
      url: "entrepreneurship.html",
      anchor: "mvp-evidence",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "AeroSense 1.0",
      excerpt: "Product system: Sensor Cartridge, ESP32-standalone Reader, Analysis/Decision. Sense→Read→Decode→Act. Screening layer, not confirmatory lab replacement.",
      keywords: "AeroSense 1.0 cartridge reader ESP32 FDM DLIA Sense Read Decode Act modular OR",
      url: "entrepreneurship.html",
      anchor: "aerosense-10",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "Existing Alternatives",
      excerpt: "Workflow comparison: visual inspection, confirmatory lab, conventional e-nose, and AeroSense as an upstream screening layer — not a GC–MS replacement.",
      keywords: "alternatives visual inspection GC-MS electronic nose e-nose Alpha MOS Aryballe Sensigent screening confirmation workflow",
      url: "entrepreneurship.html",
      anchor: "existing-alternatives",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "Business Model",
      excerpt: "Hardware + consumable cartridges + service/analysis. Purchase, lease, and detection-as-a-service are business-model options — not customer-validated. BMC in detailed framework.",
      keywords: "business model hardware consumable cartridge service lease purchase detection-as-a-service BMC",
      url: "entrepreneurship.html",
      anchor: "business-model",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "Go-to-Market",
      excerpt: "Three phases: Validate (interviews confirmed, device pilot planned), Pilot (no device pilot claimed), Scale. Status tags: Confirmed / Prospective / Planned.",
      keywords: "go-to-market GTM validate pilot scale exit gate Taoyuan association exporter",
      url: "entrepreneurship.html",
      anchor: "go-to-market",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "Unit Economics & Financials",
      excerpt: "Unit economics still to validate (no priced COGS). Illustrative 3-year model — not contracted revenue. TAM/SAM/SOM with calculation method. Cap table collapsed.",
      keywords: "unit economics COGS financials TAM SAM SOM revenue model cartridge NT$120000 illustrative",
      url: "entrepreneurship.html",
      anchor: "unit-economics",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "TAM / SAM / SOM",
      excerpt: "Team-modeled market sizing: TAM ~NT$113.6B, SAM ~NT$15–18B, SOM ~NT$20M beachhead. Source, year, currency, and method exposed.",
      keywords: "TAM SAM SOM market sizing banana beachhead NT dollar bottom-up",
      url: "entrepreneurship.html",
      anchor: "tam-sam-som",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "Development Roadmap & Risks",
      excerpt: "Seven development gates from biological sensing to commercial pilot, plus a filterable risk explorer across technical, biosafety, commercial, and financial risks.",
      keywords: "roadmap gates risk explorer hardware validation pilot biosafety financial runway",
      url: "entrepreneurship.html",
      anchor: "roadmap-risks",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "Team, Capabilities & Stakeholders",
      excerpt: "Capability matrix with explicit gaps in manufacturing, regulatory, and IP. Stakeholder ecosystem with Confirmed / Interviewed / Prospective / Needed labels.",
      keywords: "capability matrix team stakeholders FITI Garage Lo Charng manufacturing gap",
      url: "entrepreneurship.html",
      anchor: "team-stakeholders",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "What exists beyond the business plan?",
      excerpt: "Real traction only: FITI, Garage+, field interviews, SynBioBeta poster, V2 PCB layout, iST review. No LOI or device pilot claimed.",
      keywords: "traction FITI SynBioBeta Garage PCB iST interviews completed ongoing planned",
      url: "entrepreneurship.html",
      anchor: "traction",
    },
    {
      pageTitle: "Entrepreneurship",
      section: "Responsible Scaling",
      excerpt: "Potential value vs new risks (false negatives, cartridge waste, data ownership). Design/governance responses. SDGs as secondary framing.",
      keywords: "responsible scaling false negative biosafety data governance SDG sustainability safety",
      url: "entrepreneurship.html",
      anchor: "responsible-scaling",
    },

    {
      pageTitle: "Sustainability",
      section: "Sustainability is not a badge",
      excerpt: "Trade-off ledger for AeroSense VOC screening: evidence separated from expectation. Scope A iGEM Food & Nutrition vs Scope B agri beachhead hypothesis.",
      keywords: "sustainability trade-off SDG badge systems food loss LCA evidence ledger",
      url: "sustainability.html",
      anchor: "hero",
    },
    {
      pageTitle: "Sustainability",
      section: "Food decision pathway",
      excerpt: "Interactive system map: Food → VOC → AeroSense screening → Risk information → Decision → Outcome, with engagement-labeled actors.",
      keywords: "food pathway VOC screening decision outcome stakeholder packing association laboratory",
      url: "sustainability.html",
      anchor: "food-pathway",
    },
    {
      pageTitle: "Sustainability",
      section: "Sustainability at a glance",
      excerpt: "Primary SDGs 2, 9, 12, 17 and supporting 3, 10. Status legend: Measured, Stakeholder-backed, Estimated, Designed, Hypothesis, Open gap.",
      keywords: "SDG Zero Hunger Industry Responsible Consumption Partnerships status legend",
      url: "sustainability.html",
      anchor: "at-a-glance",
    },
    {
      pageTitle: "Sustainability",
      section: "Define the system boundary",
      excerpt: "Inside and outside the boundary. Scope A vs Scope B table. Short sustainability lens — not a Brundtland-first opener.",
      keywords: "system boundary scope banana mango screening diagnostic LCA",
      url: "sustainability.html",
      anchor: "system-boundary",
    },
    {
      pageTitle: "Sustainability",
      section: "How stakeholders changed AeroSense",
      excerpt: "FITI, Taoyuan, analytical interview, Chia-Nien, CSO paraphrase, n=28 survey — Thought / Heard / Changed / Still open cards.",
      keywords: "stakeholder change interview mentorship beachhead buyer association",
      url: "sustainability.html",
      anchor: "stakeholder-changes",
    },
    {
      pageTitle: "Sustainability",
      section: "Who changed our thinking?",
      excerpt: "Traceable BEFORE → HEARD → CHANGED → WHERE IT APPEARS cards. Engagement, collaboration, mentorship, prospective partnership — no formal partnership claimed.",
      keywords: "who changed thinking engagement mentorship Chia-Nien Taoyuan survey advisors FITI",
      url: "sustainability.html",
      anchor: "who-changed-title",
    },
    {
      pageTitle: "Sustainability",
      section: "SDG interaction map",
      excerpt: "Interactive 6×6 map of synergies, tensions, and unresolved links among SDGs 2, 3, 9, 10, 12, 17. Interview is not partnership.",
      keywords: "SDG interaction matrix synergy tension unresolved trade-off inequality IP false negative",
      url: "sustainability.html",
      anchor: "tradeoff-map",
    },
    {
      pageTitle: "Sustainability",
      section: "Primary impact pathways",
      excerpt: "SDG 2, 9, 12, 17 pathways with Target Problem Mechanism Evidence Boundary Next. ESP32-standalone; no fake food-loss reduction.",
      keywords: "pathway SDG2 SDG9 SDG12 SDG17 ESP32 cartridge footprint partnership",
      url: "sustainability.html",
      anchor: "primary-pathways",
    },
    {
      pageTitle: "Sustainability",
      section: "Evidence ledger",
      excerpt: "What is measured vs estimated vs hypothesized vs open gap. NT$3.51B desk estimate; survey verify queue; patents planned not filed.",
      keywords: "evidence ledger measured estimated hypothesis open gap NT dollar LCA",
      url: "sustainability.html",
      anchor: "evidence-ledger",
    },
    {
      pageTitle: "Sustainability",
      section: "What do we actually know?",
      excerpt: "Filterable evidence ledger with claim language guide. Separates measured survey counts from hypotheses like food-waste reduction and open gaps like LCA.",
      keywords: "what we actually know claim language filter MEASURED HYPOTHESIS OPEN GAP food waste cartridge",
      url: "sustainability.html",
      anchor: "evidence-ledger-title",
    },
    {
      pageTitle: "Sustainability",
      section: "Our own footprint",
      excerpt: "System boundary inputs-process-outputs. Not a formal LCA. Streams marked Not yet quantified. Pre-freeze measurement checklist.",
      keywords: "own footprint LCA inputs outputs plastics electricity cartridge biological waste checklist",
      url: "sustainability.html",
      anchor: "own-footprint",
    },
    {
      pageTitle: "Sustainability",
      section: "AeroSense Sustainability Evidence Canvas",
      excerpt: "Reusable ten-field canvas for future iGEM teams: SDG, stakeholder, pathways, evidence type, uncertainty, next measurement. Filled example plus blank copy template.",
      keywords: "evidence canvas toolkit future teams copy template SDG pathway uncertainty",
      url: "sustainability.html",
      anchor: "toolkit",
    },
    {
      pageTitle: "Sustainability",
      section: "Reusable sustainability toolkit",
      excerpt: "Future team toolkit centered on the AeroSense Sustainability Evidence Canvas — method for after 2026, not an impact certificate.",
      keywords: "toolkit future teams reuse evidence canvas self-footprint",
      url: "sustainability.html",
      anchor: "canvas-title",
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
