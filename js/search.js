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
    {
        "pageTitle": "Hardware",
        "section": "Explore the reader",
        "excerpt": "A cinematic assembly connects the optical path, gas delivery, PCB, enclosure and local phone interface. Select a part to read its design chapter.",
        "keywords": "3D exploded view product optics gas PCB enclosure cooling phone 爆炸圖 產品 光學 氣流 散熱",
        "url": "hardware.html",
        "anchor": "reader-story"
    },
    {
        "pageTitle": "Hardware",
        "section": "Signal and control",
        "excerpt": "Follow power, LED excitation, photodiode readout and ESP32 control, including J2 power, J3 programming, SW2 reset and SW3 boot selection.",
        "keywords": "PCB signal control SW2 SW3 J2 J3 flow chart firmware flashing 電路 訊號 流程 燒錄",
        "url": "hardware.html",
        "anchor": "pcb-controls"
    },
    {
        "pageTitle": "Hardware",
        "section": "System evidence",
        "excerpt": "Software builds and 78 recorded checks connect to the model and biological evidence. Separate result areas cover cell survival in our wells, reader verification, feedback and an integrated demonstration.",
        "keywords": "verification software tests cell survival well culture feedback demo 實驗 驗證 細胞 培養 存活 回饋",
        "url": "hardware.html",
        "anchor": "hardware-verification"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Molecular features in sequence-based response prediction",
        "excerpt": "Molecular weight is already in the baseline. Compare matched chemical-group and receptor holdouts for measured IR, quantum modes and OpenPOM.",
        "keywords": "Dry Lab 序列反應模型中的分子特徵 molecular weight IR EVA PCA POM 振動 頻譜 分子量 LORAX",
        "url": "model.html",
        "anchor": "receptor-molecular-features"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Measured IR and molecular-weight ablation",
        "excerpt": "82 odorants; measured spectra did not improve chemical-group prediction. Weight and size ablation effects depend on model and split.",
        "keywords": "Dry Lab 實測紅外線頻譜與分子量消融 molecular weight IR EVA PCA POM 振動 頻譜 分子量 LORAX",
        "url": "model.html",
        "anchor": "receptor-measured-ir"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Quantum vibrations, EVA and computed IR",
        "excerpt": "85 accepted mode sets; 67 odors overlap measured IR. Full and PCA-compressed features did not establish a stable gain.",
        "keywords": "Dry Lab 量子振動、EVA 與計算 IR molecular weight IR EVA PCA POM 振動 頻譜 分子量 LORAX",
        "url": "model.html",
        "anchor": "receptor-quantum-vibrations"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "OpenPOM AI odor features",
        "excerpt": "Across 109 odorants, ExtraTrees point scores increased while HGB decreased. All POM R²-gain intervals crossed zero; the matched baseline was retained.",
        "keywords": "Dry Lab OpenPOM AI 氣味特徵 molecular weight IR EVA PCA POM 振動 頻譜 分子量 LORAX",
        "url": "model.html",
        "anchor": "receptor-ai-odor-features"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "What are 8V00 and 8V02?",
        "excerpt": "Experimental cryo-EM structures of Aedes aegypti OR10 with three Apocrypta bakeri Orco subunits: 8V00 is odorant-free; 8V02 binds o-cresol. Compare their meaning and uses, with author–year references.",
        "keywords": "8V00 8V02 PDB apo holo cryo-EM Orco o-cresol 結構 未結合 結合 鄰甲酚 名詞 參考文獻",
        "url": "model.html",
        "anchor": "receptor-structure-guide"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Data foundation and evaluation design",
        "excerpt": "The main benchmark contains 24 Drosophila receptors and 110 odorants: 2,640 receptor–odorant responses in spikes/s, with no missing response or duplicate pair ID in the curated table. A response threshold of 50 spikes/s was used for some classification compari",
        "keywords": "Dry Lab receptor engineering 資料基礎與評估設計",
        "url": "model.html",
        "anchor": "receptor-data-foundation"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Complete model comparisons",
        "excerpt": "The six feature sets use the same histogram gradient boosting settings, the same response pairs and fixed folds. L denotes ligand descriptors; S combines sequence descriptors and ESM2; P adds pocket features; D adds Vina and contact summaries; M adds multiple-",
        "keywords": "Dry Lab receptor engineering 完整模型比較",
        "url": "model.html",
        "anchor": "receptor-model-evidence"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Mutation design and the odor panel",
        "excerpt": "We proposed 35 single-residue substitutions across Or35a, Or22a, Or85b, Or98a and Or67a and checked the original amino acid at every position. The first structural screen used 12 substitutions plus Or22a/Or35a wild types, giving 14 ColabFold models. These are ",
        "keywords": "Dry Lab receptor engineering 突變設計與氣味組合",
        "url": "model.html",
        "anchor": "receptor-mutation-design"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Cross-species exploration: can function transfer?",
        "excerpt": "We tested whether fly-derived information can help prioritize mosquito receptors. Carey et al. provide 50 Anopheles gambiae receptors × 113 odorants, or 5,650 responses with SEM; 40 odorants overlap the fly panel. This Anopheles transfer study is separate from",
        "keywords": "Dry Lab receptor engineering 跨物種探索：功能資訊能否轉移？ cross-species 跨物種 Anopheles Drosophila mosquito fragment 31-aa",
        "url": "model.html",
        "anchor": "receptor-cross-species"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "How the membrane models were built and checked",
        "excerpt": "8V02 is the o-cresol-bound Aedes aegypti OR10 complex with three Apocrypta bakeri Orco subunits; 8V00 is its unbound structural reference. AlphaFold supports the missing-region hypotheses and fly-receptor features, while ColabFold supplies the mutation models.",
        "keywords": "Dry Lab receptor engineering 膜模型如何建立與檢查",
        "url": "model.html",
        "anchor": "receptor-md-methods"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Bound-state MD: from 5 ns to 20 ns",
        "excerpt": "Matched bound-state trajectories were extended from 5 to 20 ns without positional restraints during the extension. The prespecified summary windows are 3–5 ns and 15–20 ns. All completed trajectories passed the saved-frame geometry checks without detected chir",
        "keywords": "Dry Lab receptor engineering 結合態 MD：從 5 ns 到 20 ns",
        "url": "model.html",
        "anchor": "receptor-holo-validation"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Two functional assays, kept separate",
        "excerpt": "The initial functional dataset contains seven odorants and 63 published oocyte-current observations with AaegOR10/AaegOrco. Screening concentration remains unresolved in the inspected records, and dose-response tables have normalization/labeling questions. The",
        "keywords": "Dry Lab receptor engineering 兩套功能 assay，分開比較",
        "url": "model.html",
        "anchor": "receptor-functional-panels"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Molecular availability: one versus twenty odorants",
        "excerpt": "The concentration exploration used the same initial receptor snapshot and box for paired 1- and 20-o-cresol conditions. The first ligand position was shared and the additional molecules were placed in the external water layer with collision exclusions. Initial",
        "keywords": "Dry Lab receptor engineering 分子可接觸性：1 個與 20 個氣味分子",
        "url": "model.html",
        "anchor": "receptor-concentration-study"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "How the steering experiments evolved",
        "excerpt": "The first SMD design pulled o-cresol outward along candidate guidance lines and would reverse an accepted exit path for entry testing. All outward attempts encountered excessive target lag before satisfying exit criteria. Consequently, no accepted outward path",
        "keywords": "Dry Lab receptor engineering 牽引與入口引導如何逐步演進",
        "url": "model.html",
        "anchor": "receptor-steering-development"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "From empty-space probes to a whole-molecule path",
        "excerpt": "A widest-path graph search on saved conformations identified candidate space near S3/S6. The 47.6 ns snapshot suggested a lateral route near I132/Y285/M288; the 59 ns snapshot suggested a lower-membrane-coordinate route near L128/I184/Q292. “Lower” refers to t",
        "keywords": "Dry Lab receptor engineering 從空隙探針到完整分子路徑",
        "url": "model.html",
        "anchor": "receptor-pathway-development"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "What the complete evidence supports",
        "excerpt": "The work establishes curated data, controlled feature comparisons, mutation audits, a cross-species transfer test and a membrane-MD/pathway workflow. Sequence features improve within-species prediction, while added structural features, proposed selectivity mut",
        "keywords": "Dry Lab receptor engineering 完整證據支持到哪裡",
        "url": "model.html",
        "anchor": "receptor-evidence-limits"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Turn odor-response data into design candidates",
        "excerpt": "Adding receptor sequence features improved prediction for held-out receptors. Or22a and Or35a showed useful target-versus-control response differences in the published data.",
        "keywords": "Dry Lab receptor engineering AlphaFold ColabFold docking MD OR10 Or22a Or35a pathway odor selectivity 把氣味反應資料轉為受體設計候選",
        "url": "model.html",
        "anchor": "receptor-cycle-1"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Test whether a better docking score supports selectivity",
        "excerpt": "F34Y and E196Q lacked direct mutated-side-chain contacts in the inspected poses. Their relative preference changed with docking setup; no robust positive winner emerged.",
        "keywords": "Dry Lab receptor engineering AlphaFold ColabFold docking MD OR10 Or22a Or35a pathway odor selectivity 較好的 docking 分數，能否支持專一性？",
        "url": "model.html",
        "anchor": "receptor-cycle-2"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Ask whether receptor motion improves odor ranking",
        "excerpt": "MD supplied alternative pockets, but their docking–response correlations did not exceed the static apo reference in the expanded odor panel.",
        "keywords": "Dry Lab receptor engineering AlphaFold ColabFold docking MD OR10 Or22a Or35a pathway odor selectivity 受體動態能否改善氣味反應排序？",
        "url": "model.html",
        "anchor": "receptor-cycle-3"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Reduce the distance between an odorant and its candidate entrance",
        "excerpt": "Odorants contacted the membrane or receptor, but the analyzed trajectories did not meet the sustained pocket-entry criterion, including near-entrance simulations lasting 10 ns.",
        "keywords": "Dry Lab receptor engineering AlphaFold ColabFold docking MD OR10 Or22a Or35a pathway odor selectivity 縮短分子與候選入口的距離",
        "url": "model.html",
        "anchor": "receptor-cycle-4"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Test whether opening the entrance and waiting permits release",
        "excerpt": "Initial outward steering encountered resistance. Guiding S3/S6 distances and extending the observation to 70 ns changed entrance geometry but produced no sustained exit.",
        "keywords": "Dry Lab receptor engineering AlphaFold ColabFold docking MD OR10 Or22a Or35a pathway odor selectivity 入口變寬、等待更久，分子就能離開嗎？",
        "url": "model.html",
        "anchor": "receptor-cycle-5"
    },
    {
        "pageTitle": "Model · Receptor engineering",
        "section": "Move from empty space to a testable molecular pathway",
        "excerpt": "Two candidate directions emerged, but whole-ligand searches across 24 saved conformations found no collision-free complete route. Dynamic route-following and longer local waiting also produced no complete exit.",
        "keywords": "Dry Lab receptor engineering AlphaFold ColabFold docking MD OR10 Or22a Or35a pathway odor selectivity 從幾何空隙，走向可檢驗的分子路徑",
        "url": "model.html",
        "anchor": "receptor-cycle-6"
    },
    {
        "pageTitle": "Alternative Platform",
        "section": "HEK293 host rationale and evidence",
        "excerpt": "Why a mammalian host was selected, what endpoint expression supports, and the validation still required.",
        "keywords": "HEK293 alternative platform host receptor OR Orco",
        "url": "alternative-platform.html",
        "anchor": "main"
    },
    {
        "pageTitle": "Measurement",
        "section": "Endpoint microscopy measurement",
        "excerpt": "Measurand, controls, excluded dense regions, threshold sensitivity, and limits of a one-batch study.",
        "keywords": "measurement DAPI uncertainty Fisher Holm blank density",
        "url": "measurement.html",
        "anchor": "main"
    },
    {
        "pageTitle": "Website credits",
        "section": "Responsible AI",
        "excerpt": "AI-assisted code, editing and conceptual artwork; retained raw data and scientific limits.",
        "keywords": "AI disclosure authors contributions responsibility",
        "url": "credits.html",
        "anchor": "responsible-ai"
    },
    {
        "pageTitle": "Model",
        "section": "Explore the odor circuit",
        "excerpt": "Step through odor encoding, sparse Kenyon-cell activity and a scripted learning example. A conceptual guide to the decoding model.",
        "keywords": "neural circuit PN KC MBON train test interactive fly brain",
        "url": "model.html",
        "anchor": "neural-circuit-demo"
    },
    {
        "pageTitle": "Contribution",
        "section": "Released analysis package",
        "excerpt": "Reproduce the endpoint fluorescence analysis and its exploratory control comparison.",
        "keywords": "download microscopy Python CSV controls package",
        "url": "contribution.html",
        "anchor": "released-contribution"
    },
    {
        "pageTitle": "Home",
        "section": "Opening film",
        "excerpt": "AeroSense is trying to finish a story that begins before spoilage is visible: living cells, a portable reader, and a fly-inspired decoder for fungal-associated odor-pattern change.",
        "keywords": "AeroSense Bio film scanner visible scan opening cinematic fungal detection Neuromorphic Olfactory Platform",
        "url": "index.html",
        "anchor": "home-film"
    },
    {
        "pageTitle": "Home",
        "section": "Project in 30 seconds",
        "excerpt": "AeroSense turns odor into information: biological recognition, optical readout, neuromorphic decoding, then a screening decision.",
        "keywords": "intro Sense Read Decode Act olfactory receptors fluorescence hardware fly-inspired screening",
        "url": "index.html",
        "anchor": "intro"
    },
    {
        "pageTitle": "Home",
        "section": "Explore AeroSense",
        "excerpt": "One system, four ways in: biology, hardware, model, and human practices.",
        "keywords": "explore biology hardware model human practices Wet Lab Dry Lab",
        "url": "index.html",
        "anchor": "explore"
    },
    {
        "pageTitle": "Home",
        "section": "The promotion film",
        "excerpt": "Watch the AeroSense promotion film.",
        "keywords": "watch promotion film YouTube story video",
        "url": "index.html",
        "anchor": "watch"
    },
    {
        "pageTitle": "Home",
        "section": "Experience AeroSense",
        "excerpt": "Follow the signal, play Odor Pixel, and enter the Learning Lab.",
        "keywords": "experience follow the signal odor pixel learning lab games",
        "url": "index.html",
        "anchor": "experience"
    },
    {
        "pageTitle": "Home",
        "section": "From our field notebook",
        "excerpt": "Browse the shared calendar of dated laboratory, hardware, modeling and Human Practices work.",
        "keywords": "journey notebook engineering timeline",
        "url": "index.html",
        "anchor": "journey"
    },
    {
        "pageTitle": "Home",
        "section": "The team behind AeroSense",
        "excerpt": "Students across synthetic biology, neuroscience, electronics, modeling, design, and human practices are building one system around a deceptively simple question.",
        "keywords": "team members AeroSense NTHU iGEM food-quality",
        "url": "index.html",
        "anchor": "team"
    },
    {
        "pageTitle": "Home",
        "section": "Collaborators and sponsors",
        "excerpt": "Logo strip for named collaborators and sponsors. See Attributions for the full list.",
        "keywords": "collaborators sponsors iST NTHU logos partners",
        "url": "index.html",
        "anchor": "partners"
    },
    {
        "pageTitle": "Home",
        "section": "Follow AeroSense",
        "excerpt": "AeroSense, NTHU iGEM 2026. LinkedIn, Instagram, and YouTube.",
        "keywords": "follow social LinkedIn Instagram YouTube AeroSense",
        "url": "index.html",
        "anchor": "follow"
    },
    {
        "pageTitle": "Description",
        "section": "The Problem",
        "excerpt": "When spoilage becomes visible, fungal and storage deterioration may already be underway. VOC fingerprints can precede obvious visual signs.",
        "keywords": "problem spoilage late VOC rice electronic nose GC-IMS screening window Figure 1 conceptual schematic",
        "url": "description.html",
        "anchor": "the-problem"
    },
    {
        "pageTitle": "Description",
        "section": "Why Biological Olfaction?",
        "excerpt": "Odorant to OR/Orco to calcium to GCaMP fluorescence to optical output. Heterologous Drosophila sensing is published prior work; AeroSense asks how to integrate it.",
        "keywords": "olfaction Drosophila OR Orco GCaMP6 VUAA1 VOC Zboray Jones HEK293 schematic Figure 2",
        "url": "description.html",
        "anchor": "why-olfaction"
    },
    {
        "pageTitle": "Description",
        "section": "Follow the signal",
        "excerpt": "Conceptual interactive walkthrough of odor, receptors, fluorescence, readout, and action. Not experimental data.",
        "keywords": "follow the signal flight journey conceptual interactive",
        "url": "description.html",
        "anchor": "follow-the-signal"
    },
    {
        "pageTitle": "Description",
        "section": "Sense → Read → Decode → Act",
        "excerpt": "Functional system architecture (not the team workstream hierarchy): VOC to GCaMP fluorescence to demodulated digital signal to sparse pattern to a risk-oriented decision.",
        "keywords": "pipeline architecture Sense Read Decode Act Figure 3 LMP7721 ADS8866 ESP32 FDM DLIA",
        "url": "description.html",
        "anchor": "pipeline"
    },
    {
        "pageTitle": "Description",
        "section": "SENSE",
        "excerpt": "Drosophila OR/Orco in HEK293 with GCaMP fluorescence, using VUAA1 as a functional positive control.",
        "keywords": "Sense biological OR Orco HEK293 GCaMP mCherry VUAA1 construct",
        "url": "description.html",
        "anchor": "sense"
    },
    {
        "pageTitle": "Description",
        "section": "READ",
        "excerpt": "Custom weak-fluorescence reader with modulated excitation, photodiode, TIA, ADC, FDM and digital lock-in detection.",
        "keywords": "Read hardware photodiode TIA LMP7721 ADS8866 ESP32 FDM DLIA",
        "url": "description.html",
        "anchor": "read"
    },
    {
        "pageTitle": "Description",
        "section": "DECODE",
        "excerpt": "AL-inspired contrast and MB-inspired sparse representation used as computational inspiration, judged against simpler baselines.",
        "keywords": "Decode antennal lobe mushroom body Kenyon sparse LSH Dasgupta",
        "url": "description.html",
        "anchor": "decode"
    },
    {
        "pageTitle": "Description",
        "section": "ACT",
        "excerpt": "Combine biological response with QC, confidence, and calibration status to recommend remeasure, monitor, isolate, or confirmatory testing.",
        "keywords": "Act decision QC confidence risk screening follow-up",
        "url": "description.html",
        "anchor": "act"
    },
    {
        "pageTitle": "Description",
        "section": "What we build on",
        "excerpt": "Published literature versus AeroSense-specific engineering. Contribution is integration of a measurement chain, not reinventing each component.",
        "keywords": "prior work contribution Zboray Jones Chen Tovar Harvie Caron Dasgupta established",
        "url": "description.html",
        "anchor": "prior-work"
    },
    {
        "pageTitle": "Description",
        "section": "How the layers depend",
        "excerpt": "AeroSense is one chain: construct, functional sensing, VOC characterization, measurement, decode, integration, then food context.",
        "keywords": "layers construct VUAA1 VOC measurement decode integration food",
        "url": "description.html",
        "anchor": "evidence-ladder"
    },
    {
        "pageTitle": "Description",
        "section": "Human Practices",
        "excerpt": "External feedback narrowed 2026 to early fungal-risk screening and changed the output from a detected signal to a follow-up action.",
        "keywords": "human practices fungal-risk screening storage incoming QC decision insight design",
        "url": "description.html",
        "anchor": "human-practices"
    },
    {
        "pageTitle": "Description",
        "section": "What AeroSense is and is not",
        "excerpt": "AeroSense is a screening platform, not a mycotoxin assay, regulatory test replacement, or validated diagnostic device.",
        "keywords": "boundaries screening mycotoxin GC-MS diagnostic not claimed",
        "url": "description.html",
        "anchor": "is-and-is-not"
    },
    {
        "pageTitle": "Description",
        "section": "What comes next",
        "excerpt": "Receptor assays, V2 reader characterization, response dataset and decoder, screening decision, and containment for field use.",
        "keywords": "next steps receptor assays reader decoder screening containment",
        "url": "description.html",
        "anchor": "next-steps"
    },
    {
        "pageTitle": "Description",
        "section": "Continue exploring",
        "excerpt": "Continue to Design, Experiments, Hardware, Model, Engineering, Human Practices, and Results for layer detail.",
        "keywords": "related wiki pages Design Experiments Hardware Model Engineering Results",
        "url": "description.html",
        "anchor": "continue-exploring"
    },
    {
        "pageTitle": "Description",
        "section": "Figure 1. From invisible change to visible loss",
        "excerpt": "Conceptual screening-window schematic. Not experimental data and not adapted from a published figure.",
        "keywords": "Figure 1 screening window conceptual schematic VOC deterioration",
        "url": "description.html",
        "anchor": "fig-screening-window"
    },
    {
        "pageTitle": "Description",
        "section": "Figure 2. From odorant to a measurable optical output",
        "excerpt": "Explanatory schematic of VOC to OR/Orco to calcium to GCaMP fluorescence. Not experimental data.",
        "keywords": "Figure 2 mechanism schematic OR Orco GCaMP conceptual",
        "url": "description.html",
        "anchor": "fig-bio-mechanism"
    },
    {
        "pageTitle": "Description",
        "section": "Figure 3. The AeroSense measurement chain",
        "excerpt": "Design illustration of Sense, Read, Decode, and Act. Proposed architecture, not experimental data.",
        "keywords": "Figure 3 pipeline measurement chain our design LMP7721 ESP32",
        "url": "description.html",
        "anchor": "fig-pipeline"
    },
    {
        "pageTitle": "Description",
        "section": "References",
        "excerpt": "Numbered bibliography [1]–[11] with DOI links and backlinks to first in-text citations.",
        "keywords": "references bibliography DOI Gu Zboray Jones Chen Tovar Harvie Caron Dasgupta",
        "url": "description.html",
        "anchor": "references"
    },
    {
        "pageTitle": "Contribution",
        "section": "Released resources",
        "excerpt": "Download endpoint-image and P2 kinetic analysis packages, hardware source files, metadata contracts and reusable recording templates.",
        "keywords": "contribution reuse reproducibility hub future teams documentation only",
        "url": "contribution.html",
        "anchor": "main"
    },
    {
        "pageTitle": "Contribution",
        "section": "AeroSense reuse map",
        "excerpt": "Reuse chain: Wet Lab → Dry Lab Hardware → Data Contract → Dry Lab Model → Engineering / Human Practices knowledge. Distinct from Sense → Read → Decode → Act (functional architecture, not team workstreams).",
        "keywords": "reuse map biology hardware data model human practices chain",
        "url": "contribution.html",
        "anchor": "library"
    },
    {
        "pageTitle": "Contribution",
        "section": "Biological sensing package",
        "excerpt": "Adaptation map: published OR/Orco precedent and the AeroSense implementation in HEK293. Construct architecture, reproducible workflows and available biological evidence are linked separately.",
        "keywords": "OR Orco HEK293 GCaMP VUAA1 Zboray parts constructs wet lab",
        "url": "contribution.html",
        "anchor": "pkg-biology"
    },
    {
        "pageTitle": "Contribution",
        "section": "Weak-fluorescence hardware package",
        "excerpt": "ESP32-standalone reader documentation: photodiode, TIA, ADC, FDM and digital lock-in. Reproduction files not released. Raspberry Pi is a retired iteration.",
        "keywords": "hardware TIA ADC ESP32 LMP7721 ADS8866 FDM DLIA photodiode contribution",
        "url": "contribution.html",
        "anchor": "pkg-hardware"
    },
    {
        "pageTitle": "Contribution",
        "section": "Measurement and data contract",
        "excerpt": "Shared experimental, hardware and model-ready metadata fields. Example datasets and data_dictionary.csv are not released.",
        "keywords": "data contract metadata schema wet lab hardware model QC",
        "url": "contribution.html",
        "anchor": "pkg-data"
    },
    {
        "pageTitle": "Contribution",
        "section": "Neuromorphic odor-decoding package",
        "excerpt": "Completed decoder comparisons on external metal-oxide sensor data, with physical-simulation downloads and a documented quantization-audit correction.",
        "keywords": "model mushroom body Kenyon AL MB SNN baselines contribution",
        "url": "contribution.html",
        "anchor": "pkg-model"
    },
    {
        "pageTitle": "Contribution",
        "section": "Human-practices-to-engineering traceability",
        "excerpt": "Reusable traceability method: Stakeholder → Observation → Insight → Design decision → Evidence needed → Re-evaluation. Example input-to-consequence mappings. Template file not released.",
        "keywords": "human practices traceability stakeholder design contribution",
        "url": "contribution.html",
        "anchor": "pkg-hp"
    },
    {
        "pageTitle": "Contribution",
        "section": "Engineering Lessons Worth Reusing",
        "excerpt": "Decision records from measurement-integrity and ESP32-standalone cycles: TIA leakage, ADC vs sensitivity, optical leakage, FDM identity, calibration ladder, retired Raspberry Pi.",
        "keywords": "engineering lessons failure knowledge TIA leakage Raspberry Pi ESP32 measurement integrity calibration",
        "url": "contribution.html",
        "anchor": "lessons"
    },
    {
        "pageTitle": "Contribution",
        "section": "Reproducibility matrix",
        "excerpt": "Evidence dashboard for eleven contribution items: open files, reproduced, quantitatively validated, and where to find each one. Expand a row for limits. Nothing is released or validated on this page.",
        "keywords": "reproducibility matrix dashboard open files validated not released evidence",
        "url": "contribution.html",
        "anchor": "repro-matrix"
    },
    {
        "pageTitle": "Engineering",
        "section": "Engineering map",
        "excerpt": "Six paths through design decisions: Wet Lab, Hardware, Model, Entrepreneurship, Education and Wiki Design. Each keeps its own question, evidence and redesign record.",
        "keywords": "Wet Lab Dry Lab Hardware Model Entrepreneurship Education Wiki Design engineering map overview workstream",
        "url": "engineering.html",
        "anchor": "engineering-at-a-glance"
    },
    {
        "pageTitle": "Engineering",
        "section": "Hardware Cycle 1",
        "excerpt": "V1 LED→PD→TIA→ADC→ESP32; August 2 archive 73 DRC / 4 unconnected / 7 ERC errors / 11 ERC warnings; high gain ≠ high sensitivity; measurement-integrity V2 redesign. REVIEW-SUPPORTED.",
        "keywords": "hw-cycle-1 DRC ERC LMP7721 ADS8866 measurement integrity 100 MΩ iST",
        "url": "engineering.html",
        "anchor": "hw-cycle-1"
    },
    {
        "pageTitle": "Engineering",
        "section": "Hardware Cycle 2",
        "excerpt": "Architecture review: ESP32 + Raspberry Pi → functional decomposition → ESP32 standalone with battery/USB-C power-path. REVIEW-SUPPORTED, not physical validation.",
        "keywords": "hw-cycle-2 Raspberry Pi ESP32 standalone battery USB-C architecture review",
        "url": "engineering.html",
        "anchor": "hw-cycle-2"
    },
    {
        "pageTitle": "Engineering",
        "section": "Hardware Cycle 3",
        "excerpt": "V2 PCB layout, enclosure CAD, compiled software and integration documents define the reader design. The supplied record contains no physical performance measurements.",
        "keywords": "hw-cycle-3 validation ladder FDM DLIA dark noise IN PROGRESS",
        "url": "engineering.html",
        "anchor": "hw-cycle-3"
    },
    {
        "pageTitle": "Engineering",
        "section": "Hardware Cycle 4 · Optical and gas co-design",
        "excerpt": "Completed optical and gas computations informed an eight-part enclosure, one LEE 101 filter layer and an integral gas-lid shelf.",
        "keywords": "hw-cycle-4 optics airflow membrane CAD enclosure simulation PDMS diffusion",
        "url": "engineering.html",
        "anchor": "hw-cycle-4"
    },
    {
        "pageTitle": "Engineering",
        "section": "Hardware Cycle 5 · Reproducible assembly",
        "excerpt": "Released bilingual assembly and operation manuals, a local reader interface and a blank manual-evaluation form.",
        "keywords": "hw-cycle-5 assembly manual user study usability feedback documentation validation",
        "url": "engineering.html",
        "anchor": "hw-cycle-5"
    },
    {
        "pageTitle": "Engineering",
        "section": "Hardware change log",
        "excerpt": "Dated circuit and architecture revisions, their engineering rationale, and links to the corresponding evidence.",
        "keywords": "hw-change-log ADS8866 3V3_ANA guarding Raspberry Pi",
        "url": "engineering.html",
        "anchor": "hw-change-log"
    },
    {
        "pageTitle": "Engineering",
        "section": "Professional engineering review",
        "excerpt": "iST Group external schematic/layout review — labeled external engineering support, not team-authored work.",
        "keywords": "hw-professional-review iST Group external attribution",
        "url": "engineering.html",
        "anchor": "hw-professional-review"
    },
    {
        "pageTitle": "Engineering",
        "section": "Wet Lab Cycle 1",
        "excerpt": "Cloning backbone lacked mammalian promoter/polyA; all ten constructs migrated to pcDNA3.1(+). Verify host elements before synthesis.",
        "keywords": "wl-cycle-1 pcDNA3.1 promoter polyA transcription-competent",
        "url": "engineering.html",
        "anchor": "wl-cycle-1"
    },
    {
        "pageTitle": "Engineering",
        "section": "Wet Lab Cycle 2",
        "excerpt": "Preliminary weak fluorescence in the Orco–IRES–GCaMP6 design prompted hypotheses about reporter abundance and localization, with controls needed to separate the causes.",
        "keywords": "wl-cycle-2 Orco IRES GCaMP6 VUAA1 weak signal",
        "url": "engineering.html",
        "anchor": "wl-cycle-2"
    },
    {
        "pageTitle": "Engineering",
        "section": "Wet Lab Cycle 3",
        "excerpt": "BBa_26E11Z80 was synthesized as an 8,293 bp GCaMP6f–(GGGGS)3–Orco plasmid. Sequence-design checks and fixed-field expression are documented separately from functional comparison.",
        "keywords": "wl-cycle-3 fusion GCaMP6f Orco topology BBa_26E11Z80",
        "url": "engineering.html",
        "anchor": "wl-cycle-3"
    },
    {
        "pageTitle": "Engineering",
        "section": "Wet Lab diagnostic logic",
        "excerpt": "Ionomycin × VUAA1 matrix separates reporter vs channel failure modes.",
        "keywords": "wl-diagnostic-logic ionomycin VUAA1 diagnostic matrix",
        "url": "engineering.html",
        "anchor": "wl-diagnostic-logic"
    },
    {
        "pageTitle": "Engineering",
        "section": "Dry Lab · Model Cycle 1",
        "excerpt": "Multi-seed comparisons and preprocessing checks exposed instability hidden by one favorable run. A missing StandardScaler caused a contradiction in sensor importance.",
        "keywords": "dl-cycle-1 multi-seed StandardScaler PCA sensor importance",
        "url": "engineering.html",
        "anchor": "dl-cycle-1"
    },
    {
        "pageTitle": "Engineering",
        "section": "Dry Lab · Model Cycle 2",
        "excerpt": "A 1 ms quantization clock versus 0.1 ms integration left 9/10 substeps unquantized, invalidating the bit sweep. The w_kc_mbon=13 result remains a separate fixed-seed observation.",
        "keywords": "dl-cycle-2 quantization Brian2 bug w_kc_mbon validation gate",
        "url": "engineering.html",
        "anchor": "dl-cycle-2"
    },
    {
        "pageTitle": "Engineering",
        "section": "Dry Lab modeling practice",
        "excerpt": "Multi-seed by default; audit preprocessing; validation gates; bugs invalidate conclusions.",
        "keywords": "dl-practice modeling integrity validation",
        "url": "engineering.html",
        "anchor": "dl-practice"
    },
    {
        "pageTitle": "Engineering",
        "section": "Entrepreneurship engineering",
        "excerpt": "Three external reviews refined the banana-export use case, intended buyer, pitch and screening-service position, with laboratory confirmation as the next step.",
        "keywords": "entrepreneurship engineering business development FITI buyer use case pitch screening mentor review Human Practices",
        "url": "engineering.html",
        "anchor": "entrepreneurship-engineering"
    },
    {
        "pageTitle": "Engineering",
        "section": "Case · beachhead",
        "excerpt": "Six-crop assumption → mentor review → banana beachhead focus.",
        "keywords": "xcase-beachhead FITI mentor banana",
        "url": "engineering.html",
        "anchor": "hp-ent-1"
    },
    {
        "pageTitle": "Engineering",
        "section": "Case · screening layer",
        "excerpt": "Cheaper than GC-MS assumption → instrumentation interview → Fast On-site Low operator dependence.",
        "keywords": "xcase-screening GC-MS screening layer",
        "url": "engineering.html",
        "anchor": "hp-ent-3"
    },
    {
        "pageTitle": "Engineering",
        "section": "Case · claim boundary",
        "excerpt": "VOC detection ≠ food-safety verdict → Challenge Bioproducts Co., Ltd. interview → careful claim framing.",
        "keywords": "xcase-claims VOC aflatoxin Or49b",
        "url": "engineering.html",
        "anchor": "hp-ent-3"
    },
    {
        "pageTitle": "Engineering",
        "section": "Education engineering",
        "excerpt": "Three cycles connect the public questionnaire, Odor Pixel Suite and the five-module Learning Lab through explicit teaching objectives and audience-evaluation questions.",
        "keywords": "education engineering learning design questionnaire games Odor Pixel Learning Lab teaching evaluation Human Practices",
        "url": "engineering.html",
        "anchor": "education-engineering"
    },
    {
        "pageTitle": "Engineering",
        "section": "Wiki Design",
        "excerpt": "Two interface-design cycles show how page reviews and informal reader feedback shaped term definitions, Project Search and section-specific Ask the Fly questions.",
        "keywords": "wiki design interface reading experience usability help glossary search Ask the Fly feedback DBTLR",
        "url": "engineering.html",
        "anchor": "wiki-design"
    },
    {
        "pageTitle": "Engineering",
        "section": "Wiki Design Cycle 1 · Three tools, three reading needs",
        "excerpt": "In-text definitions explain a term, Glossary supports wider browsing, Project Search locates a page or section, and Ask the Fly addresses questions about the passage.",
        "keywords": "glossary definition Wikipedia tooltip Project Search Ask the Fly information architecture duplicate help tools",
        "url": "engineering.html",
        "anchor": "wiki-cycle-1"
    },
    {
        "pageTitle": "Engineering",
        "section": "Wiki Design Cycle 2 · Questions about this section",
        "excerpt": "Recurring questions from informal wiki-reader feedback informed a curated, local question bank. Ask the Fly selects questions for the current section and links to the project explanation.",
        "keywords": "Ask the Fly FAQ contextual questions reader feedback common questions curated local answer guide wiki design",
        "url": "engineering.html",
        "anchor": "wiki-cycle-2"
    },
    {
        "pageTitle": "Engineering",
        "section": "Completed work and evidence limits",
        "excerpt": "Recorded biological, hardware and decoder outputs, with the conclusions each record can and cannot support.",
        "keywords": "evidence limits biology hardware decoder design results 證據 限制 設計 結果",
        "url": "engineering.html",
        "anchor": "what-we-would-do-differently"
    },
    {
        "pageTitle": "Engineering",
        "section": "Engineering change log",
        "excerpt": "Evidence → learning → design-change ledger across Wet Lab, Dry Lab (Hardware | Model), and Human Practices boundary conditions.",
        "keywords": "change log evidence learning redesign",
        "url": "engineering.html",
        "anchor": "change-log"
    },
    {
        "pageTitle": "Contribution",
        "section": "Reuse library",
        "excerpt": "Source files, protocols and reusable project documentation, organized by workstream.",
        "keywords": "reuse reproduce hardware parts code source protocols",
        "url": "contribution.html",
        "anchor": "library"
    },
    {
        "pageTitle": "Engineering",
        "section": "References",
        "excerpt": "Numbered scholarly bibliography: Zboray, Jones, Ibrahimi, Chen, Benton, Butterwick, and Stimberg.",
        "keywords": "references citations bibliography Jones Chen Zboray Benton Butterwick Stimberg Brian2 scholarly literature",
        "url": "engineering.html",
        "anchor": "references"
    },
    {
        "pageTitle": "Engineering",
        "section": "Technical sources & project files",
        "excerpt": "Unnumbered datasheets (LMP7721, ADS8866, ESP32) and iGEM engineering / Human Practices criteria.",
        "keywords": "technical sources datasheet LMP7721 ADS8866 ESP32 iGEM criteria engineering",
        "url": "engineering.html",
        "anchor": "technical-sources"
    },
    {
        "pageTitle": "Safety & Security",
        "section": "Safety at a glance",
        "excerpt": "Six safety domains connect laboratory practices, reader design controls and the contained laboratory-use boundary.",
        "keywords": "safety security biological chemical hardware measurement people deployment laboratory containment 安全 生物 化學 硬體 量測 封閉使用",
        "url": "safety-and-security.html",
        "anchor": "safety-at-a-glance"
    },
    {
        "pageTitle": "Safety & Security",
        "section": "Our safety case",
        "excerpt": "Safety follows Sense → Read → Decode → Act (functional system architecture, not team workstreams). A control in a schematic is not a verified result.",
        "keywords": "safety case sense read decode act hazard control verification",
        "url": "safety-and-security.html",
        "anchor": "our-safety-case"
    },
    {
        "pageTitle": "Safety & Security",
        "section": "Biological materials",
        "excerpt": "Named cloning and sensing materials include E. coli DH5α and HEK293. The team has confirmed HEK293 for all wet-lab experiments; cell-stock and institutional records remain separate documentation.",
        "keywords": "HEK293 HEK293 biological materials chassis containment Drosophila DH5α",
        "url": "safety-and-security.html",
        "anchor": "biological-materials"
    },
    {
        "pageTitle": "Safety & Security",
        "section": "Chemical safety",
        "excerpt": "Concentrated VOC stocks, VUAA1, and DMSO are the higher exposure risk. An SDS pack is not published. Assay concentrations are a specified method, not a completed record.",
        "keywords": "VOC chemical VUAA1 DMSO SDS handling fume hood",
        "url": "safety-and-security.html",
        "anchor": "chemical-voc"
    },
    {
        "pageTitle": "Safety & Security",
        "section": "Equipment",
        "excerpt": "Equipment controls address high voltage, autoclave steam and pressure, and sharps.",
        "keywords": "equipment safety high voltage autoclave steam pressure sharps 設備安全 高壓 滅菌鍋 蒸氣 壓力 尖銳物",
        "url": "safety-and-security.html",
        "anchor": "hardware-hazards"
    },
    {
        "pageTitle": "Safety & Security",
        "section": "Safe to interpret",
        "excerpt": "Signal detected, measurement valid, and food-safety confirmed are three different questions. AeroSense does not answer the third.",
        "keywords": "measurement integrity false negative false positive diagnostic screening Q1 Q2 Q3",
        "url": "safety-and-security.html",
        "anchor": "safe-to-interpret"
    },
    {
        "pageTitle": "Safety & Security",
        "section": "Safe to deploy",
        "excerpt": "iGEM 2026 scope is laboratory contained-use only. Extra-lab live engineered-cell cartridges are not authorized on this wiki.",
        "keywords": "deployment containment cartridge field laboratory restricted",
        "url": "safety-and-security.html",
        "anchor": "safe-to-deploy"
    },
    {
        "pageTitle": "Safety & Security",
        "section": "People and data",
        "excerpt": "Named quotations or identifiable professional comments are published only where explicit permission for attribution has been obtained. No IRB determination is claimed.",
        "keywords": "people data privacy survey interview consent IRB training",
        "url": "safety-and-security.html",
        "anchor": "people-and-data"
    },
    {
        "pageTitle": "Safety & Security",
        "section": "Biosecurity and dual use",
        "excerpt": "AeroSense currently has low but non-zero dual-use relevance. Modular receptor expansion should trigger renewed review.",
        "keywords": "biosecurity dual-use misuse access control receptor swap",
        "url": "safety-and-security.html",
        "anchor": "biosecurity"
    },
    {
        "pageTitle": "Safety & Security",
        "section": "Risk register",
        "excerpt": "Thirty hazards with control specifications and evidence statuses. Numerical risk scoring and verified outcome files are not supplied.",
        "keywords": "risk register hazard control evidence biological chemical hardware measurement people deployment 風險登錄 危害 控制 證據狀態",
        "url": "safety-and-security.html",
        "anchor": "risk-register"
    },
    {
        "pageTitle": "Safety & Security",
        "section": "2026 Safety & Security award map",
        "excerpt": "Judge navigation: contribution, platform, existing tools, managed risks, and real-world use, each with evidence, inspection links, and remaining gaps.",
        "keywords": "award map safety security judging evidence gap",
        "url": "safety-and-security.html",
        "anchor": "award-map"
    },
    {
        "pageTitle": "Members",
        "section": "Team memories",
        "excerpt": "Team memory album: cover artwork and group photographs.",
        "keywords": "members team memories photographs album cover members01 members02",
        "url": "members.html",
        "anchor": "team-memories"
    },
    {
        "pageTitle": "Members",
        "section": "Team index",
        "excerpt": "Short index of student team members, advisors, and PIs.",
        "keywords": "team index roster students advisors PI",
        "url": "members.html",
        "anchor": "team-index"
    },
    {
        "pageTitle": "Members",
        "section": "Student team",
        "excerpt": "Meet Jeffrey, Evangeline, Tim, Bennett and Pterosaur through their personal introductions.",
        "keywords": "Jeffrey Pin-Che Huang 黃品喆 Evangeline Yi-Chia Fang 方以佳 Tim Chun-Ting Chou 周峻廷 Bennett Kuan-hua Lin 林冠樺 Pterosaur I-jung Chen student team introductions",
        "url": "members.html",
        "anchor": "student-team"
    },
    {
        "pageTitle": "Members",
        "section": "Advisors",
        "excerpt": "Jerry (Ching-Che Charng) is an advisor at the Brain Research Center.",
        "keywords": "Jerry Ching-Che Charng 強敬哲 advisor Brain Research Center",
        "url": "members.html",
        "anchor": "advisors"
    },
    {
        "pageTitle": "Members",
        "section": "PIs",
        "excerpt": "Meet our primary and vice principal investigators.",
        "keywords": "PI principal investigator Primary Secondary",
        "url": "members.html",
        "anchor": "pis"
    },
    {
        "pageTitle": "Members",
        "section": "Keep in touch",
        "excerpt": "AeroSense on Instagram, LinkedIn, and email.",
        "keywords": "contact Instagram LinkedIn email aerosensebio igem_tsinghua keep in touch",
        "url": "members.html",
        "anchor": "team-contact"
    },
    {
        "pageTitle": "Attributions",
        "section": "Official Project Attributions Form",
        "excerpt": "NTHU Team 6460’s official Project Attributions Form, embedded with team contributions, AI tool use, partner offers, external contributions, and timeline.",
        "keywords": "attributions official form 6460 iGEM credits team contributions external support timeline",
        "url": "attributions.html",
        "anchor": "official-form"
    },
    {
        "pageTitle": "Parts",
        "section": "AeroSense Parts Collection",
        "excerpt": "A modular Drosophila olfactory toolkit for building nine receptor-specific living-cell odor sensors with one shared fluorescence readout. 14 new basic, 10 new composites, 2 reused Registry parts.",
        "keywords": "parts collection Registry BBa_ basic composite reused sensing lines Or7a GCaMP6f",
        "url": "parts.html",
        "anchor": "main"
    },
    {
        "pageTitle": "Parts",
        "section": "One collection, three layers",
        "excerpt": "Input: nine tuning ORs. Transduction: DmOrco. Output: GCaMP6f as the intended fluorescence readout. mCherry is an expression marker, not the measurement.",
        "keywords": "three layers input OR Orco GCaMP6f mCherry marker ion channel",
        "url": "parts.html",
        "anchor": "collection"
    },
    {
        "pageTitle": "Parts",
        "section": "Build an AeroSense sensor",
        "excerpt": "Choose one of nine tuning ORs while the shared GCaMP6f–Orco fusion reporter stays fixed. Inspect the DNA architecture, membrane channel and separate mCherry expression marker.",
        "keywords": "sensing reporting Kozak IRES mCherry GCaMP6f linker DmOrco cassette Or7a Or22a Or35a Or42a Or59b Or67a Or85b Or98a Or19a",
        "url": "parts.html",
        "anchor": "sensor-builder"
    },
    {
        "pageTitle": "Parts",
        "section": "Parts catalogue",
        "excerpt": "14 new basic parts, 10 new composites, and 2 reused Registry parts. Search by name or Registry ID.",
        "keywords": "catalogue catalog composite basic reused search RFC 1000 Or67b BBa_26E11Z80 BBa_K5490030 BBa_K4177005",
        "url": "parts.html",
        "anchor": "explore"
    },
    {
        "pageTitle": "Parts",
        "section": "Design decisions that matter",
        "excerpt": "N-terminal GCaMP6f, codon optimisation that preserves protein sequence, Registry reuse of IRES and mCherry, and Or67b kept as first-generation documentation.",
        "keywords": "N-terminal topology codon optimisation reuse Or67b IRES mCherry",
        "url": "parts.html",
        "anchor": "characterization"
    },
    {
        "pageTitle": "Parts",
        "section": "Before you reuse these parts",
        "excerpt": "HEK293 literature covers four panel receptors; only Or85b and Or98a overlap the VOC-responsive Zboray panel. mCherry does not prove trafficking.",
        "keywords": "HEK293 Zboray Or85b Or98a Or7a Or19a mCherry NLS reuse notes",
        "url": "parts.html",
        "anchor": "reuse-qc"
    },
    {
        "pageTitle": "Parts",
        "section": "Assembly and sequence QC",
        "excerpt": "RFC 1000 compatible sensing composites: Or85b, Or59b, Or42a, Or98a. In-silico sequence QC is computational, not experimental sequencing.",
        "keywords": "RFC 1000 PstI in-silico sequence QC pcDNA3.1 BsaI SapI",
        "url": "parts.html",
        "anchor": "reuse-qc"
    },
    {
        "pageTitle": "Parts",
        "section": "Plasmid atlas",
        "excerpt": "Nine final sensing maps plus the GCaMP6f–Orco reporter map. Or67b pTwist image is first-generation, not a counted composite. Maps show experimental plasmids; registered composites are inserts, not the backbone.",
        "keywords": "plasmid atlas maps Or67b pTwist GCaMP6f_GGGGSx3_DmOrco pcDNA3.1 backbone insert",
        "url": "parts.html",
        "anchor": "plasmid-atlas"
    },
    {
        "pageTitle": "Design",
        "section": "Design question",
        "excerpt": "How can insect olfactory receptors in mammalian cells, fly-inspired decoding, and portable optics form one VOC sensing platform?",
        "keywords": "design question VOC receptor platform",
        "url": "design.html",
        "anchor": "design-abstract"
    },
    {
        "pageTitle": "Design",
        "section": "Interfaces with Model and Hardware",
        "excerpt": "Design interfaces specify feature handoffs to Model and optical constraints for Hardware.",
        "keywords": "interfaces model hardware feature file optical",
        "url": "design.html",
        "anchor": "assay-design"
    },
    {
        "pageTitle": "Experiments",
        "section": "Experimental workflow",
        "excerpt": "Six stages connect colony plates, DNA gels, transfection assessment, pre-selection odor testing, G418 selection and post-selection odor testing. Fly-brain imaging is a separate track.",
        "keywords": "workflow cloning culture transfection G418 validation calcium imaging data analysis figure 1 EXP-AS-01 EXP-AS-02 EXP-AS-03 EXP-AS-04 EXP-AS-05 EXP-AS-07",
        "url": "experiments.html",
        "anchor": "workflow"
    },
    {
        "pageTitle": "Experiments",
        "section": "Molecular cloning",
        "excerpt": "Colony photographs document plate growth. The method links colony identity to plasmid preparation; yields, gel lane maps and linked sequence reads are absent from the supplied archive.",
        "keywords": "pcDNA3.1 GenScript DH5α T7 BGH GGGGS plasmids Ampicillin cloning EXP-AS-01",
        "url": "experiments.html",
        "anchor": "molecular-cloning"
    },
    {
        "pageTitle": "Experiments",
        "section": "Mammalian cell culture",
        "excerpt": "Current protocol specification names HEK293 in DMEM with 10 % FBS, passaged at ~80 % confluence, detached with TrypLE Express. The team has confirmed HEK293 as its wet-lab host.",
        "keywords": "HEK293 DMEM TrypLE FBS penicillin culture EXP-AS-02",
        "url": "experiments.html",
        "anchor": "cell-culture"
    },
    {
        "pageTitle": "Experiments",
        "section": "Transfection",
        "excerpt": "The earlier electroporation specification and workbook listing P3000/Lipofectamine 3000 are distinct source records. Delivery method for the supplied image set is not confirmed. HEK293 images were acquired 44–48 h after transfection, before G418.",
        "keywords": "electroporation lipofectamine P3000 OR Orco plasmid transfection HEK293 EXP-AS-02 source record",
        "url": "experiments.html",
        "anchor": "transfection"
    },
    {
        "pageTitle": "Experiments",
        "section": "G418 selection record",
        "excerpt": "G418 selection activities are team-confirmed as completed, without a supplied selection trajectory or endpoint dataset. Both microscopy and P2 measurements precede selection.",
        "keywords": "G418 NeoR protocol target stable selection",
        "url": "experiments.html",
        "anchor": "stable-selection"
    },
    {
        "pageTitle": "Experiments",
        "section": "Expression / functional validation",
        "excerpt": "Fixed HEK293 endpoint images and P2 fluorescence time courses are archived in Results. Expression readouts and functional-response controls are assessed separately.",
        "keywords": "mCherry GCaMP6f VUAA1 Orco functional positive control EXP-AS-03 EXP-AS-04 expression",
        "url": "experiments.html",
        "anchor": "expression-validation"
    },
    {
        "pageTitle": "Experiments",
        "section": "384-well assay specification",
        "excerpt": "A literature-based 384-well specification uses 20 µL buffer, 7 µL vehicle and 9 µL of 4× VOC. It is distinct from the acquired manual-addition 96-well P2 pilot.",
        "keywords": "VOC 384-well calcium imaging injection buffer VUAA1 50 µM EXP-AS-05 Zboray",
        "url": "experiments.html",
        "anchor": "calcium-imaging"
    },
    {
        "pageTitle": "Experiments",
        "section": "Two-round assay specification",
        "excerpt": "The assay diagram specifies 20 µL buffer plus 7 µL vehicle, then 9 µL of 4× VOC: 36 µL total, with the stock diluted to 1×.",
        "keywords": "two-round injection 20 µL 7 µL 9 µL 36 µL 4× vehicle VOC figure 3 Zboray",
        "url": "experiments.html",
        "anchor": "fig-two-round"
    },
    {
        "pageTitle": "Experiments",
        "section": "Reagent preparation",
        "excerpt": "The reference preparation specifies a 50 mM VUAA1 stock in DMSO at −20 °C and fresh VOC working dilutions. P2 stimulus metadata are documented separately.",
        "keywords": "VUAA1 DMSO VOC PTFE reagent preparation stock",
        "url": "experiments.html",
        "anchor": "reagent-preparation"
    },
    {
        "pageTitle": "Experiments",
        "section": "Reference response analysis",
        "excerpt": "The cited relative-response method defines R=(Fmax−F0)/F0 and same-plate VUAA1 normalization. Acquired P2 kinetics and endpoint microscopy use their own linked analysis methods.",
        "keywords": "R R_norm VUAA1 normalisation plate day mean Grubbs Model EXP-AS-07",
        "url": "experiments.html",
        "anchor": "data-analysis"
    },
    {
        "pageTitle": "Experiments",
        "section": "Controls",
        "excerpt": "Reference controls distinguish delivery stress, expression and receptor/reporting function. DNA quality, recovery medium and the separate P2 control analysis are documented.",
        "keywords": "control matrix vehicle VUAA1 Orco G418",
        "url": "experiments.html",
        "anchor": "controls"
    },
    {
        "pageTitle": "Description",
        "section": "TH, GH146 and the fly olfactory circuit",
        "excerpt": "The teaching circuit separates sensory relay from dopamine modulation. The 5137;TH recording uses TH-driven mCD8::GFP membrane labeling; GH146 × UAS-GCaMP6f is a separate preparation.",
        "keywords": "TH 5137 TH-GFP mCD8 GFP membrane label GH146 PN UAS-GCaMP6f projection neuron dopamine mushroom body MBON antennal lobe light-sheet",
        "url": "description.html",
        "anchor": "fly-neural-circuit"
    },
    {
        "pageTitle": "Notebook",
        "section": "20 April · TH light-sheet record",
        "excerpt": "The 20 April recording used 5137;TH (TH-GFP) membrane labeling. Its normalized GFP fluorescence does not establish a calcium response or neural activity.",
        "keywords": "April 20 4/20 TH 5137 TH-GFP mCD8 GFP membrane reporter fly brain light-sheet notebook",
        "url": "notebook.html",
        "anchor": "wet-th-lightsheet-20260420"
    },
    {
        "pageTitle": "Notebook",
        "section": "4 May · PN preparation",
        "excerpt": "The 4 May record documents preparation of GH146 × UAS-GCaMP6f for imaging, separate from the acquired TH-GFP recording.",
        "keywords": "May 4 5/4 PN GH146 UAS-GCaMP6f confirmed reporter projection neuron fly brain notebook preparation",
        "url": "notebook.html",
        "anchor": "wet-pn-preparation-20260504"
    },
    {
        "pageTitle": "Notebook",
        "section": "Actual notebook entries",
        "excerpt": "Dated laboratory, model, hardware and Human Practices records share one calendar and reading dataset. Completion records include unsuccessful attempts and preserve missing evidence.",
        "keywords": "notebook lab notes calendar timeline Gantt hardware PCB enclosure recruitment project planning wiki games",
        "url": "notebook.html",
        "anchor": "chronicle-views"
    },
    {
        "pageTitle": "Results",
        "section": "Wet Lab results",
        "excerpt": "Browse all 25 fields: original fluorescence channels, brightfield, matched-channel merges and DAPI-object overlays. Compare per-field reporter-positive fractions and threshold sensitivity without treating fields as biological repeats.",
        "keywords": "biological sensing results fluorescence HEK293 wet lab dense cluster DAPI merge transfection efficiency analysis",
        "url": "results.html",
        "anchor": "wet-lab"
    },
    {
        "pageTitle": "Results",
        "section": "Fluorescence data and downloads",
        "excerpt": "Download the P2 archive of 32 exports and 3,840 readings, plus endpoint-image inputs, analysis scripts, source hashes and object-level tables.",
        "keywords": "P2 VUAA1 3840 32 exports kinetics microscopy DAPI scripts hashes downloads 螢光 時間序列 資料 下載",
        "url": "results.html",
        "anchor": "data-availability"
    },
    {
        "pageTitle": "Experiments",
        "section": "Three experimental tracks",
        "excerpt": "Follow three separate workflows: molecular cloning, HEK293 cell experiments and odor testing, and exploratory fly-brain imaging. Each has its own methods and evidence boundary.",
        "keywords": "cloning transformation miniprep DNA gel HEK293 odor fly light-sheet three workflows",
        "url": "experiments.html",
        "anchor": "cloning-track"
    },
    {
        "pageTitle": "Experiments",
        "section": "Endpoint microscopy methods",
        "excerpt": "Acquisition metadata, DAPI-object segmentation, blank-derived reporter thresholds and display processing for the 25 pre-G418 fields. These methods estimate a selected-object fluorescence fraction, not whole-population transfection efficiency.",
        "keywords": "DAPI PFA microscopy methods segmentation threshold sensitivity transfection efficiency GCaMP mCherry dense cells",
        "url": "experiments.html",
        "anchor": "microscopy-analysis"
    },
    {
        "pageTitle": "Results",
        "section": "Cloning plate photographs",
        "excerpt": "Three bacterial plate photographs show discrete colonies and denser growth. The archive contains no annotated gel or linked sequence-confirmation result.",
        "keywords": "cloning bacteria plate colony transformation miniprep DNA gel",
        "url": "results.html",
        "anchor": "cloning-results"
    },
    {
        "pageTitle": "Model",
        "section": "Question and role in the project",
        "excerpt": "The updated decoder record separates KT random five-fold and unseen-day tests, readout diagnosis, UCI drift calibration and single-run sequential learning. Physical models separately guide the reader.",
        "keywords": "model question KT UCI metal oxide macro F1 0.87 0.73 SNN physical measurement optics gas",
        "url": "model.html",
        "anchor": "evidence-snapshot"
    },
    {
        "pageTitle": "Model",
        "section": "Fly-inspired neural architecture",
        "excerpt": "The biological inspiration connects projection neurons, sparse Kenyon-cell activity, APL-like inhibition and MBON readout. The implementation encodes PCA features in PN bins before the spiking network.",
        "keywords": "fly brain PN KC APL MBON mushroom body sparse coding PCA bins",
        "url": "model.html",
        "anchor": "why-fly-brain"
    },
    {
        "pageTitle": "Model",
        "section": "MB-inspired layer",
        "excerpt": "Mushroom-body-inspired sparse projection expands and sparsifies representations before classification.",
        "keywords": "MB mushroom body Kenyon sparse coding LSH",
        "url": "model.html",
        "anchor": "network"
    },
    {
        "pageTitle": "Model",
        "section": "Preprocessing and response extraction",
        "excerpt": "The KT benchmark extracts metal-oxide sensor response features and applies training-only preprocessing before spike encoding. Transfer to AeroSense fluorescence remains a separate step.",
        "keywords": "preprocessing KT metal oxide sensor delta features PCA train only spike encoding",
        "url": "model.html",
        "anchor": "sensor-to-spikes"
    },
    {
        "pageTitle": "Model",
        "section": "Training and evaluation",
        "excerpt": "Training-only preprocessing and explicit exposure partitions separate random five-fold validation, whole-day holdout and the chronological SNN tests still required.",
        "keywords": "validation five fold random day holdout chronological split training presentations unique exposures leakage",
        "url": "model.html",
        "anchor": "training-evaluation"
    },
    {
        "pageTitle": "Model",
        "section": "Generalization and sensitivity",
        "excerpt": "Performance falls on unseen measurement days. Learning curves and parameter sweeps motivate better collection schedules and split-resolved validation.",
        "keywords": "learning curve sensitivity parameter sweep random unseen days five fold generalization",
        "url": "model.html",
        "anchor": "what-we-learned"
    },
    {
        "pageTitle": "Model",
        "section": "Reproducibility",
        "excerpt": "Figures and settings document the study; independent reproduction still requires decoder code, resolved configurations, fold membership, sampling seeds and predictions.",
        "keywords": "reproducibility code seed fold environment TOML prediction logs preprocessing",
        "url": "model.html",
        "anchor": "reproduce"
    },
    {
        "pageTitle": "Model",
        "section": "Decoder classification results",
        "excerpt": "KT random-split five-fold macro-F1 is reported as 0.87 ± 0.03, falling to about 0.73 on unseen days. The displayed single diagnostic run is reported separately.",
        "keywords": "performance macro F1 0.87 0.73 five fold confusion matrix gas classification KT",
        "url": "model.html",
        "anchor": "performance"
    },
    {
        "pageTitle": "Model",
        "section": "Readout diagnosis",
        "excerpt": "Layerwise probes compare PN, KC and learned MBON representations on matched data. Offline readout comparisons motivate an error-driven learning test.",
        "keywords": "readout bottleneck MBON PN KC linear SVM Hebbian learning teacher diagnostic",
        "url": "model.html",
        "anchor": "readout-bottleneck"
    },
    {
        "pageTitle": "Model",
        "section": "Drift and reference-gas correction",
        "excerpt": "On UCI sensor records, ten ethanol references per new batch increased mean cross-batch SVM accuracy from 33% to 58%. This is a conventional-classifier calibration result.",
        "keywords": "UCI drift 36 months calibration ethanol reference gas SVM 33 58 concentration batch",
        "url": "model.html",
        "anchor": "drift-robustness"
    },
    {
        "pageTitle": "Model",
        "section": "Sequential learning",
        "excerpt": "One NH3-only learning run raises new-gas recognition from 0% to 72%, while old classes lose 4–10 percentage points. Retention across seeds and class orders remains untested.",
        "keywords": "continual sequential learning NH3 ammonia dopamine teacher catastrophic forgetting retention",
        "url": "model.html",
        "anchor": "continual-learning"
    },
    {
        "pageTitle": "Model",
        "section": "Figures and data availability",
        "excerpt": "Seventeen decoder figures open at full resolution. UCI data are linked; KT thesis metadata, redistribution permission and decoder reproduction artifacts remain unresolved.",
        "keywords": "data availability figures KT thesis UCI source code full resolution reproduction",
        "url": "model.html",
        "anchor": "model-data"
    },
    {
        "pageTitle": "Model",
        "section": "Physical measurement models",
        "excerpt": "Optical transport, detector interference and gas-to-liquid-interface delivery inform the reader design under explicit assumptions. These are computational results, separate from the SNN benchmark.",
        "keywords": "physical model Monte Carlo optical transport finite detector CFD airflow gas liquid 100 µL 80 µL",
        "url": "model.html",
        "anchor": "physical-models"
    },
    {
        "pageTitle": "Model",
        "section": "Optical transport and well mixing",
        "excerpt": "The current optical model predicts a conditional collection path, nonuniform floor illumination and nonzero well mixing; a dye standard uses a separate volume-source model.",
        "keywords": "optical transport Monte Carlo photodiode well mixing matrix floor irradiance standard fluorescence",
        "url": "model.html",
        "anchor": "optical-transport"
    },
    {
        "pageTitle": "Model",
        "section": "Detector interference",
        "excerpt": "Frequency tagging retains LED-synchronous excitation leakage and other-well light. Declared synthetic signal comparisons inform measured I/Q blank correction.",
        "keywords": "interference lock in DLIA I/Q blank correction reflected light noise SINR OD",
        "url": "model.html",
        "anchor": "detector-interference"
    },
    {
        "pageTitle": "Model",
        "section": "Gas and liquid transport",
        "excerpt": "The fixed-CAD operating sweep conditionally selects 3 mL/min with worst near-liquid gas t90 about 50 seconds. Gas arrival does not establish bottom-cell exposure or safety.",
        "keywords": "gas liquid transport CFD diffusion airflow t90 3 mL min 50 seconds PDMS boundary",
        "url": "model.html",
        "anchor": "gas-and-liquid-transport"
    },
    {
        "pageTitle": "Model",
        "section": "Optical simulation video",
        "excerpt": "Watch the original optical paths and modulated detector traces. The 100× slow-motion movie shows sampled paths and conditional optical signals, not measured cellular responses.",
        "keywords": "optical simulation video movie MP4 photon paths slow motion fluorescence LED",
        "url": "model.html",
        "anchor": "optical-simulation-video"
    },
    {
        "pageTitle": "Model",
        "section": "Airflow simulation video",
        "excerpt": "Watch the original airflow comparison at 1 mL/min. Sixty physical seconds are shown in twenty playback seconds; the separate operating sweep evaluates the 3 mL/min candidate.",
        "keywords": "airflow simulation video movie MP4 CFD wash in gas flow",
        "url": "model.html",
        "anchor": "airflow-simulation-video"
    },
    {
        "pageTitle": "Model",
        "section": "Liquid and membrane transport",
        "excerpt": "Liquid depth, diffusion and membrane assumptions affect delivery to cells. Gas wash-in does not by itself establish a biological response time.",
        "keywords": "liquid membrane PDMS transport diffusion depth cell exposure",
        "url": "model.html",
        "anchor": "liquid-transport"
    },
    {
        "pageTitle": "Model",
        "section": "Model to build",
        "excerpt": "Each computational question links evidence to a concrete hardware choice and the independent physical measurement still required.",
        "keywords": "model build decision optical calibration gas shelf measured validation hardware",
        "url": "model.html",
        "anchor": "model-to-build"
    },
    {
        "pageTitle": "Hardware",
        "section": "PCB design and engineering revisions",
        "excerpt": "The electronics record starts with the V1 audit, then follows the V2 layout, guarded TIA, ADC interface and ESP32 acquisition decisions.",
        "keywords": "PCB V1 V2 DRC ERC guard TIA ADC ESP32 measurement integrity",
        "url": "hardware.html",
        "anchor": "electronics-bridge"
    },
    {
        "pageTitle": "Hardware",
        "section": "How AeroSense reads light",
        "excerpt": "The sensing chain is 470 nm LED, sample, photodiode, TIA, 16-bit ADC, ESP32, then DLIA or preprocessing.",
        "keywords": "signal chain LED photodiode TIA LMP7721 ADS8866 ESP32 VEMD5060X01",
        "url": "hardware.html",
        "anchor": "electronics-bridge"
    },
    {
        "pageTitle": "Hardware",
        "section": "The measurement challenge",
        "excerpt": "Excitation leakage, ambient light, electronic noise, PCB leakage, drift, and optical crosstalk make measurement integrity more important than ADC bits.",
        "keywords": "measurement challenge leakage noise drift crosstalk high-impedance",
        "url": "hardware.html",
        "anchor": "optical-question"
    },
    {
        "pageTitle": "Hardware",
        "section": "Engineering iterations",
        "excerpt": "The dated electronics history follows V1 review into the V2 layout. The October package adds current CAD, a categorized BOM, manuals and compiled software while physical validation remains open.",
        "keywords": "PCB V1 V2 DRC ERC ESP32 Raspberry Pi standalone LMP7721 ADS8866 guard high-impedance",
        "url": "engineering.html",
        "anchor": "group-hardware"
    },
    {
        "pageTitle": "Hardware",
        "section": "Standard-sequence specification",
        "excerpt": "A nine-condition fluorescence-standard specification defines independent blanks, single-well signals and concentration comparisons, with at least five valid technical blocks per condition.",
        "keywords": "fluorescein standard blank single well calibration technical repeats 螢光素 標準 空白 校正 技術重複",
        "url": "hardware.html",
        "anchor": "validation-boundary"
    },
    {
        "pageTitle": "Hardware",
        "section": "Built for reproduction",
        "excerpt": "Eight current operating STLs, CAD, bilingual assembly and setup manuals, categorized BOM, software and simulation sources are available, with key evidence readable on the page.",
        "keywords": "reproducibility STL CAD BOM firmware enclosure downloads assembly manuals eight parts",
        "url": "hardware.html",
        "anchor": "mechanical-package"
    },
    {
        "pageTitle": "Hardware",
        "section": "Reader verification specification",
        "excerpt": "The released verification protocol defines electrical, optical, biological and workflow checks. The reader design and measured instrument performance remain separate evidence categories.",
        "keywords": "reader verification specification electronics optics workflow 驗證 規格 電性 光學 流程",
        "url": "hardware.html",
        "anchor": "validation-boundary"
    },
    {
        "pageTitle": "Hardware",
        "section": "BOM and document previews",
        "excerpt": "Inspect the development-device, shared-equipment and optional-item budgets, PCB components and assembly documents. Estimates and allowances retain their source labels.",
        "keywords": "BOM budget cost required developer future PDF preview XLSX 79873.79 custom filter manuals",
        "url": "hardware.html",
        "anchor": "cost-and-reproduction"
    },
    {
        "pageTitle": "Integrated Human Practices",
        "section": "Engagements / events",
        "excerpt": "Consequence-first engagement cards in Feedback, Network, Public, and Mentorship buckets. SynBioBeta listed as network-only; filters for Technical, Field, Commercial, Governance, Public, Community.",
        "keywords": "engagements events FITI Garage SynBioBeta Challenge Bioproducts Co., Ltd. Taoyuan analytical survey mentorship filter",
        "url": "human-practices.html",
        "anchor": "engagements"
    },
    {
        "pageTitle": "Integrated Human Practices",
        "section": "Responsible implementation & impact",
        "excerpt": "Two-sided enable vs harm analysis, SCREEN→TRIAGE→CONFIRM principle, conceptual risk-tier UI without SAFE, non-claims, and concrete validation requirements. Regulatory working hypothesis — confirmation required.",
        "keywords": "responsibility screen triage confirm SAFE false negative false positive cartridge regulatory non-claims risk tier confidence QC",
        "url": "human-practices.html",
        "anchor": "responsibility"
    },
    {
        "pageTitle": "Education",
        "section": "Our education journey through the fly brain",
        "excerpt": "Three teaching regions connect broad participation, structured learning and public exchange: antennal lobe, mushroom-body calyx and MBON output. The brain route is an educational metaphor.",
        "keywords": "education journey antennal lobe mushroom body calyx MBON survey games social learning exchange",
        "url": "education.html",
        "anchor": "education-journey"
    },
    {
        "pageTitle": "Education",
        "section": "Why we changed the question",
        "excerpt": "A 28-response survey shifted teaching from general mold awareness to decisions about heat, smell and visible spoilage.",
        "keywords": "education survey 28 teaching mold heat smell spoilage 問卷 教育 黴菌 加熱 氣味 變質",
        "url": "education.html",
        "anchor": "why-we-changed"
    },
    {
        "pageTitle": "Education",
        "section": "AeroSense Learning Lab",
        "excerpt": "Five self-paced modules connect odor sensing, biology, decoding and screening decisions, with short assessments and browser-local progress.",
        "keywords": "learning lab discover question build decode decide curriculum assessment 學習平台 自主學習 課程 評量 氣味 感測 決策",
        "url": "education.html",
        "anchor": "learning-lab"
    },
    {
        "pageTitle": "Education",
        "section": "Odor Pixel Suite",
        "excerpt": "Three browser games explore odor-pattern recognition, scent-guided navigation and mixture decoding. An optional educator protocol supports paired responses.",
        "keywords": "odor pixel lab pattern recognition odor maze scentbound labyrinth fingerprint mixer browser games educator 氣味遊戲 模式辨識 迷宮 混合解碼 教育者",
        "url": "education.html",
        "anchor": "odor-pixel"
    },
    {
        "pageTitle": "Education",
        "section": "Science in a social feed",
        "excerpt": "Published Parts Design graphics explain receptor and reporter designs. Four sustainability question cards connect project choices to SDGs.",
        "keywords": "social media instagram Parts Design receptor reporter sustainability pop quiz SDG 社群 科普 受體 報導蛋白 永續 問答",
        "url": "education.html",
        "anchor": "social-media"
    },
    {
        "pageTitle": "Education",
        "section": "Evidence View",
        "excerpt": "Optional view on the Education page. Highlights status, method, limitation, reuse, and dialogue without hiding the narrative.",
        "keywords": "evidence view story view labels measurement iteration reuse limitation dialogue status method",
        "url": "education.html?view=evidence",
        "anchor": ""
    },
    {
        "pageTitle": "Education",
        "section": "Reuse the AeroSense Education Framework",
        "excerpt": "Playable Odor Pixel Suite, live Learning Lab, study protocol, question bank, and data dictionary. Teacher toolkit file still in preparation.",
        "keywords": "reuse study protocol question bank data dictionary learning lab toolkit",
        "url": "education.html",
        "anchor": "reuse"
    },
    {
        "pageTitle": "Education",
        "section": "Exchange and teaching records",
        "excerpt": "SynBioBeta's poster setting, the China Medical University neuroscience session and the iGEM TAU team exchange brought AeroSense to different audiences. Activity records and the conference poster are available.",
        "keywords": "SynBioBeta CMU China Medical University neuroscience Ching-Che Charng TAU Israel meetup poster",
        "url": "education.html",
        "anchor": "region-output"
    },
    {
        "pageTitle": "Integrated Human Practices",
        "section": "Six encounters in the project record",
        "excerpt": "Photographs and event narratives document Garage+, Dao Foundation, SynBioBeta, FITI, China Medical University and the iGEM team exchange, with their roles in the project explained.",
        "keywords": "events photos Garage Dao Foundation SynBioBeta FITI CMU iGEM exchange",
        "url": "human-practices.html",
        "anchor": "events"
    },
    {
        "pageTitle": "Hardware",
        "section": "Membrane design decision",
        "excerpt": "The conditional PDMS thickness and diffusivity sweep informs the decision not to make a film compulsory in the current enclosure. It does not establish measured transport or containment performance.",
        "keywords": "PDMS membrane thickness diffusivity gas transport enclosure film simulation",
        "url": "hardware.html",
        "anchor": "membrane-design-results"
    },
    {
        "pageTitle": "Hardware",
        "section": "Reader interface and functions",
        "excerpt": "The delivered interface supports connection, scheduling, signal inspection and JSON/CSV export. Published screenshots were captured from the local DEMO server.",
        "keywords": "UI interface phone demo data acquisition schedule raw signal export",
        "url": "hardware.html",
        "anchor": "reader-interface"
    },
    {
        "pageTitle": "Hardware",
        "section": "Recording templates and manuals",
        "excerpt": "Blank performance and task-feedback templates accompany the assembly and operation manuals, with fields for measurements, observations and revisions.",
        "keywords": "forms feedback assembly manuals performance recording 範本 回饋 組裝 手冊 紀錄",
        "url": "hardware.html",
        "anchor": "forms-and-results"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Overview",
        "excerpt": "From odor to action — before loss becomes visible. Bio-digital VOC screening for food and agricultural supply chains. Screening layer, not a definitive food-safety diagnostic.",
        "keywords": "entrepreneurship AeroSense Bio beachhead banana VOC screening B2B venture",
        "url": "entrepreneurship.html",
        "anchor": "overview"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "How our work addresses Best Entrepreneurship",
        "excerpt": "Five judging questions mapped to customers, solution evidence, development plan, capabilities, and long-term impacts.",
        "keywords": "Best Entrepreneurship judging evidence map first customer MVP roadmap impacts",
        "url": "entrepreneurship.html",
        "anchor": "judging-map"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Choosing Our Beachhead",
        "excerpt": "Leading Beachhead Under Validation: banana fungal-disease early detection in Taiwan’s export supply chain. Qualitative Detectability × Consequence × Unmet Need × WTP matrix — no fabricated scores.",
        "keywords": "beachhead banana mango tea FITI mentor market thesis matrix Detectability Willingness to Pay",
        "url": "entrepreneurship.html",
        "anchor": "beachhead"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "The Decision Problem",
        "excerpt": "Illustrative batch journey from harvest to shipment. AeroSense is an early screening layer, not a replacement for confirmatory laboratory analysis.",
        "keywords": "batch journey packing storage screening layer confirmatory GC-MS visual inspection",
        "url": "entrepreneurship.html",
        "anchor": "decision-problem"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Who Actually Needs This?",
        "excerpt": "Customer ≠ User ≠ Payer. Roles: QC operator, associations/cooperatives, exporters, labs and certifiers. Individual farmers are not the default buyer.",
        "keywords": "user buyer payer validator farmers association packing house certification",
        "url": "entrepreneurship.html",
        "anchor": "who-needs-this"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "What We Learned Outside the Lab",
        "excerpt": "Assumption → insight → decision cards from mentor reviews, field interviews, CSO, Challenge Bioproducts Co., Ltd., analytical instrumentation, and public survey.",
        "keywords": "FITI mentor Challenge Bioproducts Co., Ltd. GC-MS survey evidence timeline beachhead pivot",
        "url": "entrepreneurship.html",
        "anchor": "what-we-learned"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Product evidence",
        "excerpt": "The product record combines receptor/fluorescence evidence, the ESP32 V2 reader design and decoder benchmarks on an external sensor dataset. Each supports a different level of inference.",
        "keywords": "MVP evidence ESP32 V2 PCB fluorescence decoder 產品 證據 螢光 解碼器",
        "url": "entrepreneurship.html",
        "anchor": "mvp-evidence"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "AeroSense 1.0",
        "excerpt": "Product system: Sensor Cartridge, ESP32-standalone Reader, Analysis/Decision. Sense→Read→Decode→Act. Screening layer, not confirmatory lab replacement.",
        "keywords": "AeroSense 1.0 cartridge reader ESP32 FDM DLIA Sense Read Decode Act modular OR",
        "url": "entrepreneurship.html",
        "anchor": "aerosense-10"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Existing Alternatives",
        "excerpt": "Workflow comparison: visual inspection, confirmatory lab, conventional e-nose, and AeroSense as an upstream screening layer — not a GC–MS replacement.",
        "keywords": "alternatives visual inspection GC-MS electronic nose e-nose Alpha MOS Aryballe Sensigent screening confirmation workflow",
        "url": "entrepreneurship.html",
        "anchor": "existing-alternatives"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Business Model",
        "excerpt": "Hardware + consumable cartridges + service/analysis. Purchase, lease, and detection-as-a-service are business-model options — not customer-validated. BMC in detailed framework.",
        "keywords": "business model hardware consumable cartridge service lease purchase detection-as-a-service BMC",
        "url": "entrepreneurship.html",
        "anchor": "business-model"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Go-to-Market",
        "excerpt": "Field and industry interviews define buyer roles and workflow requirements for the documented commercialization model.",
        "keywords": "go-to-market GTM validate pilot scale exit gate Taoyuan association exporter",
        "url": "entrepreneurship.html",
        "anchor": "go-to-market"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Unit Economics & Financials",
        "excerpt": "The current prototype budget is available; recurring production COGS and operating cost remain unverified. The three-year financial model and market estimates remain illustrative, not contracted revenue.",
        "keywords": "unit economics COGS prototype budget financials TAM SAM SOM revenue model cartridge illustrative",
        "url": "entrepreneurship.html",
        "anchor": "unit-economics"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Prototype cost and adoption gaps",
        "excerpt": "The required-device budget is NTD 79,873.79, including allocated PCB development cost and a custom-filter allowance. Assembly usability, target-buyer demand and field performance are separate evidence gates.",
        "keywords": "prototype cost hardware BOM 79873.79 development budget custom filter assembly adoption usability customer pilot",
        "url": "entrepreneurship.html",
        "anchor": "prototype-cost"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "TAM / SAM / SOM",
        "excerpt": "Team-modeled market sizing: TAM ~NT$113.6B, SAM ~NT$15–18B, SOM ~NT$20M beachhead. Source, year, currency, and method exposed.",
        "keywords": "TAM SAM SOM market sizing banana beachhead NT dollar bottom-up",
        "url": "entrepreneurship.html",
        "anchor": "tam-sam-som"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Development Roadmap & Risks",
        "excerpt": "Seven development gates from biological sensing to commercial pilot, plus a filterable risk explorer across technical, biosafety, commercial, and financial risks.",
        "keywords": "roadmap gates risk explorer hardware validation pilot biosafety financial runway",
        "url": "entrepreneurship.html",
        "anchor": "roadmap-risks"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Team, Capabilities & Stakeholders",
        "excerpt": "Capability matrix with explicit gaps in manufacturing, regulatory, and IP. Stakeholder ecosystem with Confirmed / Interviewed / Prospective / Needed labels.",
        "keywords": "capability matrix team stakeholders FITI Garage Lo Charng manufacturing gap",
        "url": "entrepreneurship.html",
        "anchor": "team-stakeholders"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "What exists beyond the business plan?",
        "excerpt": "Dated FITI reviews, Garage+ participation, field and industry interviews, a SynBioBeta poster and PCB review document progress beyond the business plan.",
        "keywords": "traction FITI SynBioBeta Garage PCB iST interviews venture reviews 訪談 審查 育成 進展",
        "url": "entrepreneurship.html",
        "anchor": "traction"
    },
    {
        "pageTitle": "Entrepreneurship",
        "section": "Responsible Scaling",
        "excerpt": "Potential value vs new risks (false negatives, cartridge waste, data ownership). Design/governance responses. SDGs as secondary framing.",
        "keywords": "responsible scaling false negative biosafety data governance SDG sustainability safety",
        "url": "entrepreneurship.html",
        "anchor": "responsible-scaling"
    },
    {
        "pageTitle": "Sustainability",
        "section": "Sustainability is not a badge",
        "excerpt": "Trade-off ledger for AeroSense VOC screening: evidence separated from expectation. Scope A iGEM Food & Nutrition vs Scope B agri beachhead hypothesis.",
        "keywords": "sustainability trade-off SDG badge systems food loss LCA evidence ledger",
        "url": "sustainability.html",
        "anchor": "hero"
    },
    {
        "pageTitle": "Sustainability",
        "section": "Food decision pathway",
        "excerpt": "Interactive system map: Food → VOC → AeroSense screening → Risk information → Decision → Outcome, with engagement-labeled actors.",
        "keywords": "food pathway VOC screening decision outcome stakeholder packing association laboratory",
        "url": "sustainability.html",
        "anchor": "food-pathway"
    },
    {
        "pageTitle": "Sustainability",
        "section": "Sustainability at a glance",
        "excerpt": "Primary SDGs 2, 9, 12, 17 and supporting 3, 10. Status legend: Measured, Stakeholder-backed, Estimated, Designed, Hypothesis, Open gap.",
        "keywords": "SDG Zero Hunger Industry Responsible Consumption Partnerships status legend",
        "url": "sustainability.html",
        "anchor": "at-a-glance"
    },
    {
        "pageTitle": "Sustainability",
        "section": "Benefits, burdens and evidence",
        "excerpt": "Export-supply-chain and stored-food screening share a sensing stack but require separate evidence. The scope connects food decisions, access and resource use.",
        "keywords": "sustainability system boundary export stored food Track A Track B screening access resources 永續 系統邊界 出口 儲存食品 篩檢 資源",
        "url": "sustainability.html",
        "anchor": "system-boundary"
    },
    {
        "pageTitle": "Sustainability",
        "section": "Feedback into design",
        "excerpt": "Interviews, mentor reviews and the 28-response survey shaped biological sensing priorities, institutional buyers, teaching and screening claim boundaries.",
        "keywords": "stakeholder feedback FITI Garage Taoyuan analytical instrumentation Challenge Bioproducts survey 28 利害關係人 訪談 導師 問卷 買方 篩檢 教學",
        "url": "sustainability.html",
        "anchor": "stakeholder-changes"
    },
    {
        "pageTitle": "Sustainability",
        "section": "Who changed our thinking?",
        "excerpt": "Traceable BEFORE → HEARD → CHANGED → WHERE IT APPEARS cards. Engagement, collaboration, mentorship, prospective partnership — no formal partnership claimed.",
        "keywords": "who changed thinking engagement mentorship Challenge Bioproducts Co., Ltd. Taoyuan survey advisors FITI",
        "url": "sustainability.html",
        "anchor": "who-changed-title"
    },
    {
        "pageTitle": "Sustainability",
        "section": "SDG interaction map",
        "excerpt": "Interactive 6×6 map of synergies, tensions, and unresolved links among SDGs 2, 3, 9, 10, 12, 17. Interview is not partnership.",
        "keywords": "SDG interaction matrix synergy tension unresolved trade-off inequality IP false negative",
        "url": "sustainability.html",
        "anchor": "tradeoff-map"
    },
    {
        "pageTitle": "Sustainability",
        "section": "Primary impact pathways",
        "excerpt": "SDG 2, 9, 12, 17 pathways with Target Problem Mechanism Evidence Boundary Next. ESP32-standalone; no fake food-loss reduction.",
        "keywords": "pathway SDG2 SDG9 SDG12 SDG17 ESP32 cartridge footprint partnership",
        "url": "sustainability.html",
        "anchor": "primary-pathways"
    },
    {
        "pageTitle": "Sustainability",
        "section": "Evidence ledger",
        "excerpt": "Source-linked records distinguish survey-guided teaching, stakeholder decisions, reader architecture, screening risk tiers and cartridge-reuse design.",
        "keywords": "evidence ledger survey stakeholder reader architecture screening risk tiers cartridge reuse 證據紀錄 問卷 利害關係人 讀取器 風險分級 重複使用",
        "url": "sustainability.html",
        "anchor": "evidence-ledger"
    },
    {
        "pageTitle": "Sustainability",
        "section": "Evidence ledger",
        "excerpt": "Filter documented inputs and design decisions by evidence type, with links to their sources and interpretation limits.",
        "keywords": "evidence ledger filter stakeholder designed sources limitations 證據紀錄 篩選 設計 來源 限制",
        "url": "sustainability.html",
        "anchor": "evidence-ledger-title"
    },
    {
        "pageTitle": "Sustainability",
        "section": "Our own footprint",
        "excerpt": "The inventory identifies culture media, plastics, cartridges, electronics, energy and maintenance streams. Quantities and net life-cycle benefit remain unmeasured.",
        "keywords": "footprint LCA inputs outputs culture media plastics cartridge electronics energy waste 環境足跡 生命週期 盤查 培養基 塑膠 電子廢棄物 能源",
        "url": "sustainability.html",
        "anchor": "own-footprint"
    },
    {
        "pageTitle": "Sustainability",
        "section": "AeroSense Sustainability Evidence Canvas",
        "excerpt": "A reusable ten-field canvas links stakeholders, positive and negative pathways, evidence, uncertainty and measurement needs. Includes a filled example and blank template.",
        "keywords": "sustainability evidence canvas toolkit SDG stakeholder pathways uncertainty template 永續 證據畫布 工具包 利害關係人 不確定性 範本",
        "url": "sustainability.html",
        "anchor": "toolkit"
    },
    {
        "pageTitle": "Sustainability",
        "section": "Reusable sustainability toolkit",
        "excerpt": "The banana-screening example and copyable blank canvas show how to record a proposed benefit alongside evidence and resource burdens.",
        "keywords": "toolkit sustainability canvas banana screening example copy template benefits burdens 永續工具包 畫布 香蕉 篩檢 範例 複製 範本",
        "url": "sustainability.html",
        "anchor": "canvas-title"
    },
    {
        "pageTitle": "Learning Lab",
        "section": "Your learning journey",
        "excerpt": "Five open modules from odor patterns to responsible screening decisions. Progress stays in this browser.",
        "keywords": "learning lab journey modules dashboard progress odor biosensor",
        "url": "learning-platform.html",
        "anchor": "learn-journey"
    },
    {
        "pageTitle": "Learning Lab",
        "section": "Your learning dashboard",
        "excerpt": "Personal module status, pre/post scores, knowledge gain in percentage points, and reflections stored on this device only.",
        "keywords": "dashboard progress score pre post knowledge gain reflection reset local",
        "url": "learning-platform/progress.html",
        "anchor": ""
    }
];

  var LIVE_THROTTLE_MS = 300;
  var activeIndex = -1;
  var lastLiveText = "";
  var liveTimer = null;

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_+#./-]+/gu, " ")
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
    if (/[\u3400-\u9fff]/.test(phrase)) return hay.indexOf(phrase) !== -1;
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

    var translated = function(value) { return window.AeroSenseI18n ? window.AeroSenseI18n.lookup(value) : value; };
    var title = normalize(entry.pageTitle + ' ' + translated(entry.pageTitle));
    var section = normalize(entry.section + ' ' + translated(entry.section));
    var excerpt = normalize(entry.excerpt + ' ' + translated(entry.excerpt));
    var keywords = normalize(entry.keywords);
    var hay = title + " " + section + " " + excerpt + " " + keywords;
    var score = 0;

    if (normalize(entry.pageTitle) === q || normalize(translated(entry.pageTitle)) === q) score += 1000;
    else if (hasPhrase(title, q)) score += 700;

    if (normalize(entry.section) === q || normalize(translated(entry.section)) === q) score += 900;
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
      var pageName=document.createElement('span'), sectionName=document.createElement('span');
      pageName.textContent=entry.pageTitle;sectionName.textContent=entry.section;
      meta.append(pageName,document.createTextNode(' · '),sectionName);

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
