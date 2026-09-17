/**
 * AeroSense Notebook — structured event dataset.
 *
 * Scientific source (canonical): ../../notebook_content.md
 * This file is a maintainable projection for Calendar / Timeline / Gantt UIs.
 * Do not invent dates, people, measurements, or conclusions beyond the source.
 *
 * Browser: window.AerosenseNotebook
 * Node:    module.exports (for coverage / status checks)
 *
 * Status vocabulary:
 *   completed    — source describes work that was performed (may still have needsUpdate gaps)
 *   ongoing      — source explicitly marks Ongoing / In Progress
 *   planned      — source marks Planned work / Planned tests / future windows
 *   needs-update — source is too incomplete or internally contradictory to treat as settled
 *
 * datePrecision: day | range | month
 * stream: wetlab | drylab | igem
 * substream: hardware | model | null
 *   Technical workstreams: Wet Lab | Dry Lab.
 *   Hardware and Model are Dry Lab substreams, not peers of Wet Lab.
 *   Official iGEM milestones stay on stream igem (substream null).
 *   Human Practices is a separate project stream and is not invented here.
 *
 * Extra fields (beyond the page schema, for integrity):
 *   output, hypothesis, interpretation, problem,
 *   needsUpdate[], contradictions[], pendingOutputs[], sourceSection
 */
(function (root) {
  "use strict";

  var META = {
    sourceFile: "notebook_content.md",
    yearContext: 2026,
    note:
      "Dates without an explicit year in the source are recorded as 2026 to match the AeroSense iGEM 2026 notebook context. Month-only and range precision are preserved; no day dates were invented.",
    duplicateRemoved:
      "Dry lab June 'Code Audit and Clarifying the Data Pipeline' appeared twice identically in notebook_content.md; the duplicate block was removed from the markdown and is represented once here as dry-code-audit.",
    igemOfficialLayerNote:
      "Official iGEM competition milestones live in IGEM_OFFICIAL_EVENTS (separate from EVENTS). Only verified dates with preserved source URLs are included — never inferred from team work.",
    evidenceImagesNote:
      "evidenceImages[] may list only repository assets that exist on disk. Captions explain evidentiary role. No stock, simulated microscope, fake plots, or invented PCB screenshots.",
  };

  /**
   * Official iGEM 2026 milestones — externally sourced, NOT team accomplishments.
   * Schema: id, title, startDate, endDate, status, sourceLabel, sourceUrl, lastChecked, note
   * Add entries only when the date is verified on an official iGEM 2026 page (sourceUrl required).
   */
  function officialEvent(partial) {
    return {
      id: partial.id,
      title: partial.title,
      startDate: partial.startDate,
      endDate: partial.endDate == null ? partial.startDate : partial.endDate,
      status: partial.status || "official",
      sourceLabel: partial.sourceLabel,
      sourceUrl: partial.sourceUrl,
      lastChecked: partial.lastChecked,
      note: partial.note || "",
      category: partial.category || "",
      tags: partial.tags || [],
    };
  }

  var IGEM_OFFICIAL_EVENTS = [
    officialEvent({
      id: "igem-roster-freeze-2026",
      title: "Final deadline to add/remove Team Roster members",
      startDate: "2026-09-16",
      endDate: "2026-09-16",
      status: "official",
      sourceLabel:
        "iGEM 2026 Team Roster — Deadline / Freeze (competition.igem.org)",
      sourceUrl: "https://competition.igem.org/registration/team-roster",
      lastChecked: "2026-09-15",
      note:
        "Official Team Roster freeze. After this deadline, no new members can be added. Each participant must submit an individual consent form (via teams.igem.org) before appearing on the roster. Source also lists 11:00 a.m. EDT on this date.",
      category: "registration / roster",
      tags: ["roster", "consent", "registration"],
    }),
  ];

  /** Project official milestones into the chronicle view model (stream: igem). */
  function projectOfficialEvent(official) {
    return {
      id: official.id,
      startDate: official.startDate,
      endDate: official.endDate,
      datePrecision: "day",
      stream: "igem",
      substream: null,
      category: official.category || "",
      status: "official",
      title: official.title,
      shortSummary: official.note || "",
      isOfficial: true,
      sourceLabel: official.sourceLabel,
      sourceUrl: official.sourceUrl,
      lastChecked: official.lastChecked,
      note: official.note || "",
      tags: official.tags || [],
    };
  }

  function event(partial) {
    return {
      id: partial.id,
      startDate: partial.startDate,
      endDate: partial.endDate == null ? partial.startDate : partial.endDate,
      datePrecision: partial.datePrecision,
      stream: partial.stream,
      substream: partial.substream == null ? null : partial.substream,
      category: partial.category || "",
      status: partial.status,
      title: partial.title,
      shortSummary: partial.shortSummary || "",
      objective: partial.objective || null,
      work: partial.work || null,
      observation: partial.observation || null,
      result: partial.result || null,
      output: partial.output || null,
      decision: partial.decision || null,
      learning: partial.learning || null,
      hypothesis: partial.hypothesis || null,
      interpretation: partial.interpretation || null,
      problem: partial.problem || null,
      nextQuestion: partial.nextQuestion || null,
      nextStep: partial.nextStep || null,
      responsible: partial.responsible || [],
      contributors: partial.contributors || [],
      evidence: partial.evidence || [],
      evidenceImages: partial.evidenceImages || [],
      relatedLinks: partial.relatedLinks || [],
      references: partial.references || [],
      tags: partial.tags || [],
      needsUpdate: partial.needsUpdate || [],
      contradictions: partial.contradictions || [],
      pendingOutputs: partial.pendingOutputs || [],
      sourceSection: partial.sourceSection || "",
      sourceNote: partial.sourceNote || null,
    };
  }

  var HARDWARE_REFS = {
    "1": {
      id: "hw-ref-1",
      text: "NTHU iGEM 2026 AeroSense Bio. Fluorescence Detection Hardware Module Design Report. Team documentation.",
    },
    "2": {
      id: "hw-ref-2",
      text: "iGEM Foundation. 2026 Special Awards — Best Hardware.",
    },
    "3": {
      id: "hw-ref-3",
      text: "NTHU iGEM 2026 AeroSense Bio. PCB V1 KiCad Design Archive, BOM, ERC and DRC Reports. August 2026.",
    },
    "4": {
      id: "hw-ref-4",
      text: "NTHU iGEM 2026 AeroSense Bio. Professional Hardware Review Log. August–September 2026.",
    },
    "5": {
      id: "hw-ref-5",
      text: "NTHU iGEM 2026 AeroSense Bio / iST Group. PCB V2 Development and Manufacturing Schedule. September 2026.",
    },
  };

  /* =========================================================================
   * HARDWARE
   * ========================================================================= */
  var HARDWARE_EVENTS = [
    event({
      id: "hw-ideation",
      startDate: "2026-04-01",
      endDate: "2026-04-21",
      datePrecision: "range",
      stream: "drylab",
      substream: "hardware",
      category: "project-setup",
      status: "completed",
      title: "Project Ideation and Team Formation",
      shortSummary:
        "Established AeroSense direction and defined hardware as the fluorescence-to-digital measurement bridge.",
      work:
        "We established the initial AeroSense project direction and divided responsibilities among wet-lab, modeling, hardware and other project groups. For hardware, the central task was defined as building the measurement bridge between a fluorescence-producing biological sensor and a digital analysis system.",
      output: [
        "Initial system concept",
        "Hardware responsibility established",
      ],
      nextQuestion:
        "How can weak biological fluorescence be converted into a stable digital measurement?",
      tags: ["ideation", "team"],
      sourceSection: "Hardware · April 1–21 · Project Ideation and Team Formation",
    }),

    event({
      id: "hw-literature-requirements",
      startDate: "2026-04-22",
      endDate: "2026-05-09",
      datePrecision: "range",
      stream: "drylab",
      substream: "hardware",
      category: "requirements",
      status: "completed",
      title: "Literature Review and Hardware Requirements",
      shortSummary:
        "Reviewed fluorescence readout architectures and defined LED → sample → photodiode → TIA → ADC → MCU with major measurement risks.",
      work:
        "We reviewed fluorescence readout, photodiodes, transimpedance amplification, ADC architectures and lock-in detection. The preliminary signal chain was defined as LED → sample → photodiode → TIA → ADC → MCU. Major measurement risks identified: excitation leakage; ambient light; photodiode noise; high-impedance leakage; ADC/reference stability; and optical/electrical crosstalk.",
      output: [
        "Initial system architecture",
        "Hardware requirements",
        "Candidate component list",
      ],
      references: [HARDWARE_REFS["1"]],
      tags: ["literature", "signal-chain", "requirements"],
      sourceSection:
        "Hardware · April 22–May 9 · Literature Review and Hardware Requirements",
    }),

    event({
      id: "hw-component-selection",
      startDate: "2026-05-10",
      endDate: "2026-06",
      datePrecision: "range",
      stream: "drylab",
      substream: "hardware",
      category: "design",
      status: "completed",
      title: "Component Selection and First-Order Calculations",
      shortSummary:
        "Converged on LED/PD/TIA/ADC/reference/ESP32 candidates; selected 100 MΩ as initial TIA feedback working point.",
      work:
        "We compared candidate excitation LEDs, photodiodes, amplifiers, ADCs, precision references and passive components. The architecture converged toward: Würth 155124BS73200 LED; Vishay VEMD5060X01 photodiode; TI LMP7721 TIA; TI ADS8866 ADC; LTC6655 2.5 V reference; and ESP32 controller. We calculated first-pass LED current, TIA gain, ADC resolution and feedback-network ranges.",
      decision:
        "Selected 100 MΩ as the initial TIA feedback-resistor working point, retaining the principle that final gain should be decided experimentally.",
      output: [
        "Component-selection report",
        "Initial BOM strategy",
        "TIA and LED design calculations",
      ],
      tags: ["bom", "tia", "component-selection"],
      sourceNote:
        "Source heading is 'May 10–June' (day start, month-only end). End date kept as 2026-06 without inventing a day.",
      sourceSection:
        "Hardware · May 10–June · Component Selection and First-Order Calculations",
    }),

    event({
      id: "hw-v1-schematic",
      startDate: "2026-06",
      endDate: "2026-07",
      datePrecision: "range",
      stream: "drylab",
      substream: "hardware",
      category: "pcb-design",
      status: "completed",
      title: "PCB V1 Schematic and Footprint Development",
      shortSummary:
        "Integrated the V1 signal chain in KiCad, including symbols/footprints and initial Raspberry Pi integration.",
      work:
        "We began integrating the complete signal chain in KiCad. This stage required creation or import of several non-trivial symbols and footprints, including the photodiode, LMP7721, ADC and voltage-reference devices. Defined: four LED switching channels; analog and digital power rails; TIA feedback components; ADC interface; ESP32 control; and initial Raspberry Pi integration.",
      output: [
        "PCB V1 schematic",
        "Component footprints",
        "Initial 3D component models",
      ],
      learning:
        "Critical footprints must be checked manually against manufacturer package drawings rather than trusted solely because they were downloaded from a CAD library.",
      tags: ["kicad", "pcb-v1", "schematic"],
      relatedLinks: [
        { label: "Engineering · Hardware Cycle 1", href: "engineering.html#hw-cycle-1" },
        { label: "Hardware page", href: "hardware.html" },
      ],
      sourceSection:
        "Hardware · June–July · PCB V1 Schematic and Footprint Development",
    }),

    event({
      id: "hw-v1-drc-review",
      startDate: "2026-07",
      endDate: "2026-08-02",
      datePrecision: "range",
      stream: "drylab",
      substream: "hardware",
      category: "pcb-design",
      status: "completed",
      title: "PCB V1 Layout — ERC/DRC Evaluation",
      shortSummary:
        "Completed four-layer V1 layout; ERC/DRC found 73 DRC violations, 4 unconnected items, 7 ERC errors, 11 ERC warnings. Decision: do not fabricate V1.",
      work:
        "We completed the first full PCB layout as a four-layer board and generated a 3D representation of the system. The V1 design integrated the optical driver, analog front end, ADC/reference, ESP32, regulators and Raspberry Pi interface. ERC and DRC were run before manufacturing.",
      result:
        "73 DRC violations; 4 unconnected items; 7 ERC errors; 11 ERC warnings. The archive contains design-rule/ERC/DRC evaluation rather than evidence of a complete circuit simulation.",
      decision:
        "Do not fabricate V1. Use the design-rule findings as the first engineering test and obtain professional review.",
      evidence: [
        {
          label: "PCB V1 KiCad archive, BOM, ERC and DRC reports",
          status: "cited-in-source",
          refId: "hw-ref-3",
        },
        {
          label: "V1 layout / schematic PDF (final.pdf)",
          href: "hardware%20information/pcb%20v1/final.pdf",
          status: "repository-file",
        },
        {
          label: "V1 DRC report (2026-08-02)",
          href: "fig/engineering/v1-drc-2026-08-02.rpt",
          status: "repository-file",
        },
        {
          label: "V1 ERC report (2026-08-02)",
          href: "fig/engineering/v1-erc-2026-08-02.rpt",
          status: "repository-file",
        },
      ],
      references: [HARDWARE_REFS["3"]],
      tags: ["pcb-v1", "drc", "erc", "negative-result"],
      relatedLinks: [
        { label: "Engineering · Hardware Cycle 1", href: "engineering.html#hw-cycle-1" },
        { label: "Hardware page", href: "hardware.html" },
      ],
      sourceNote:
        "Source heading 'July–August 2'. End day preserved as 2026-08-02; July start kept month-precision within a range (no July day invented).",
      sourceSection: "Hardware · July–August 2 · PCB V1 Layout",
    }),

    event({
      id: "hw-review-prep",
      startDate: "2026-08-02",
      endDate: "2026-08-28",
      datePrecision: "range",
      stream: "drylab",
      substream: "hardware",
      category: "external-review",
      status: "completed",
      title: "Preparing for Professional PCB Review",
      shortSummary:
        "Contacted iST Group and prepared the KiCad/BOM/ERC-DRC package for external schematic and layout review.",
      work:
        "We contacted iST Group and prepared the design package for external review. Requested scope included: schematic correctness; PCB layout; component pinout; symbols and footprints; ERC/DRC; high-impedance TIA/guard design; power design; BOM; manufacturability; and later fabrication/assembly support. Files prepared: KiCad project, schematic, PCB layout, initial BOM, ERC/DRC reports, component/datasheet notes. The original correspondence confirms this review scope.",
      tags: ["ist-group", "review-prep"],
      relatedLinks: [
        {
          label: "Attributions · iST Group",
          href: "attributions.html#attr-ist-group",
        },
        {
          label: "Engineering · Professional review",
          href: "engineering.html#hw-professional-review",
        },
      ],
      sourceSection:
        "Hardware · August 2–28 · Preparing for Professional PCB Review",
    }),

    event({
      id: "hw-professional-review-cycle-1",
      startDate: "2026-08-28",
      endDate: "2026-09-03",
      datePrecision: "range",
      stream: "drylab",
      substream: "hardware",
      category: "engineering-cycle",
      status: "completed",
      title: "Engineering Cycle 1: Professional Review",
      shortSummary:
        "Professional review and internal re-evaluation identified correction needs across TIA/guard, ADC, reference, and ESP32 control paths.",
      work:
        "Professional review and internal re-evaluation identified several areas requiring correction or stronger verification, including: LMP7721 pin mapping; high-impedance guard routing; photodiode pad interpretation; TIA feedback placement; ADC decoupling and input network; precision-reference circuitry; ESP32 EN/BOOT behavior; and placement of critical capacitors.",
      learning:
        "The performance of a weak-light reader cannot be predicted from ADC resolution or TIA gain alone. The entire signal path must be designed around leakage, noise, parasitics and calibration.",
      output: [
        "V2 correction list",
        "Professional review record",
        "Revised design requirements",
      ],
      evidence: [
        {
          label: "Professional Hardware Review Log",
          status: "cited-in-source",
          refId: "hw-ref-4",
        },
      ],
      references: [HARDWARE_REFS["4"]],
      tags: ["engineering-cycle", "professional-review", "v2"],
      relatedLinks: [
        {
          label: "Engineering · Hardware Cycle 1",
          href: "engineering.html#hw-cycle-1",
        },
        {
          label: "Engineering · Professional review",
          href: "engineering.html#hw-professional-review",
        },
      ],
      sourceSection:
        "Hardware · August 28–September 3 · Engineering Cycle 1: Professional Review",
    }),

    event({
      id: "hw-v2-simplification",
      startDate: "2026-08-29",
      endDate: "2026-09",
      datePrecision: "range",
      stream: "drylab",
      substream: "hardware",
      category: "engineering-cycle",
      status: "ongoing",
      title: "Engineering Cycle 2: System Simplification and PCB V2",
      shortSummary:
        "Redesign removes Raspberry Pi in favor of ESP32-standalone power/I/O architecture. Source status: Ongoing.",
      work:
        "During redesign, we reconsidered the function of the Raspberry Pi. Because the ESP32 already provides low-level acquisition, digital processing and wireless communication, while heavier computational analysis can run externally, we decided to remove the Raspberry Pi from the reader. V2 therefore moves toward: ESP32 standalone operation; rechargeable battery power; USB-C charging; battery power-path; 5 V boost; physical ON/OFF control; and external programming/debug access.",
      decision:
        "Reduce hardware complexity instead of adding more computation to the reader.",
      evidenceImages: [
        {
          src: "fig/hardware/v2-pcb-top.png",
          alt: "KiCad 3D render of PCB V2 digital face used in the ESP32-standalone redesign",
          caption:
            "Same V2 digital-face render indexed here because Cycle 2’s architecture change (ESP32-only) is embodied in this layout — still a design render, not bring-up evidence.",
        },
      ],
      tags: ["pcb-v2", "esp32", "ongoing"],
      contradictions: [
        "Source marks this Engineering Cycle 2 entry as Ongoing (August 29–September), while the adjacent September 3–11 entry reports V2 PCB layout complete on September 11. Both statuses are preserved; do not collapse Cycle 2 into Completed solely because layout completion is recorded elsewhere.",
      ],
      relatedLinks: [
        {
          label: "Engineering · Hardware Cycle 2",
          href: "engineering.html#hw-cycle-2",
        },
        { label: "Hardware page", href: "hardware.html" },
      ],
      sourceNote:
        "Status kept as ongoing per source. End bound is month-only September (2026-09).",
      sourceSection:
        "Hardware · August 29–September · Engineering Cycle 2: System Simplification and PCB V2",
    }),

    event({
      id: "hw-v2-layout",
      startDate: "2026-09-03",
      endDate: "2026-09-11",
      datePrecision: "range",
      stream: "drylab",
      substream: "hardware",
      category: "pcb-design",
      status: "completed",
      title: "V2 Schematic Correction and PCB Layout",
      shortSummary:
        "On September 11, the V2 PCB layout was reported complete. Fabrication/assembly and final reviews remain pending.",
      work:
        "The V2 schematic and layout underwent detailed professional review. Major changes included: retaining a low-noise LP5907-3.3 supply for the analog PD/TIA/ADC rail while separating the digital 3.3 V supply; retaining the external pull-up on the LTC6655 shutdown input; rebuilding the ADS8866 schematic symbol from the manufacturer's actual 10-pin pinout; configuring the ADS8866 in 3-wire CS mode with DIN held high; adding 47 Ω series damping resistors to SCLK and CONVST; implementing a guarded, shortened photodiode–TIA high-impedance path; moving the TIA close to the photodiode while preserving the main LED optical path; and expanding the PCB to approximately 100 × 90 mm for the revised standalone architecture.",
      result:
        "On September 11, the V2 PCB layout was reported complete. Final schematic/BOM confirmation, DRC/DFM/electrical review, fabrication and assembly remain pending.",
      output: [
        "V2 PCB placement and layout",
        "Updated analog/digital power architecture",
        "Corrected ADC interface",
        "Implemented high-impedance guard strategy",
      ],
      evidence: [
        {
          label: "V2 schematic PDF",
          href: "hardware%20information/pcb%20v2/NTHU_TEST_BOARD_Schematic.pdf",
          status: "repository-file",
        },
      ],
      evidenceImages: [
        {
          src: "fig/hardware/v2-pcb-top.png",
          alt: "KiCad 3D render of AeroSense PCB V2 digital face with ESP32 and connectors",
          caption:
            "V2 digital-face KiCad 3D render — evidence of the ESP32-standalone board layout after Raspberry Pi removal, not a fabricated-board photograph.",
        },
        {
          src: "fig/hardware/v2-pcb-bottom.png",
          alt: "KiCad 3D render of AeroSense PCB V2 optical face with photodiode and TIA region",
          caption:
            "V2 optical-face KiCad 3D render — documents photodiode / TIA placement used for the guarded high-impedance path on the completed V2 layout.",
        },
      ],
      tags: ["pcb-v2", "layout-complete", "milestone"],
      relatedLinks: [
        {
          label: "Engineering · Hardware Cycle 2",
          href: "engineering.html#hw-cycle-2",
        },
        { label: "Hardware page", href: "hardware.html" },
      ],
      sourceNote:
        "Layout-complete is recorded as completed design work only. Fabrication, bring-up, and validation are separate planned events.",
      sourceSection:
        "Hardware · September 3–11 · V2 Schematic Correction and PCB Layout",
    }),

    event({
      id: "hw-enclosure-planned",
      startDate: "2026-09",
      endDate: "2026-09",
      datePrecision: "month",
      stream: "drylab",
      substream: "hardware",
      category: "mechanical",
      status: "planned",
      title: "Mechanical Enclosure (Planned)",
      shortSummary:
        "Planned opaque SolidWorks enclosure for optical geometry, ambient-light control, and sample placement.",
      work:
        "Planned work: develop an opaque SolidWorks enclosure that fixes LED/sample/photodiode geometry; reduces ambient-light leakage; accommodates an emission filter/baffle; protects electronics; holds the battery; and provides repeatable sample/cartridge placement.",
      pendingOutputs: [
        "SolidWorks source",
        "STEP",
        "STL",
        "3D-printed prototype",
      ],
      tags: ["enclosure", "planned", "pending-output"],
      sourceSection: "Hardware · September · Mechanical Enclosure",
    }),

    event({
      id: "hw-fabrication-planned",
      startDate: "2026-09",
      endDate: "2026-09",
      datePrecision: "month",
      stream: "drylab",
      substream: "hardware",
      category: "manufacturing",
      status: "planned",
      title: "PCB Fabrication and Assembly (Planned)",
      shortSummary:
        "Vendor-estimated fabrication/SMT through late September. Actual dates must replace forecast before freeze.",
      work:
        "Planned work: the current vendor estimate places schematic/layout finalization, PCB fabrication, SMT assembly and inspection during September, with estimated delivery near the end of the month. Because this schedule is vendor-dependent, the final Notebook will record the actual fabrication and delivery dates, not only the forecast. The current schedule supplied by iST lists schematic work, layout, PCB manufacture, SMT and inspection as sequential stages through late September.",
      needsUpdate: [
        "BEFORE FREEZE — Replace planned dates with actual fabrication and delivery dates.",
      ],
      references: [HARDWARE_REFS["5"]],
      tags: ["fabrication", "planned", "needs-update"],
      sourceNote:
        "Kept as Planned. Mid–Late September is recorded as month precision 2026-09; no day invented.",
      sourceSection: "Hardware · Mid–Late September · PCB Fabrication and Assembly",
    }),

    event({
      id: "hw-bringup-planned",
      startDate: "2026-09",
      endDate: "2026-10",
      datePrecision: "range",
      stream: "drylab",
      substream: "hardware",
      category: "validation",
      status: "planned",
      title: "Electrical Bring-Up (Planned)",
      shortSummary:
        "Planned rail, ESP32, ADC, LED, and current-consumption bring-up tests after assembly.",
      work:
        "Planned tests: 5 V rail; digital 3.3 V rail; analog 3.3 V rail; 2.5 V reference; ESP32 startup; ADC communication; LED switching; current consumption.",
      pendingOutputs: [
        "Voltage table",
        "Power-consumption table",
        "Oscilloscope/logic-analyzer evidence",
      ],
      tags: ["bring-up", "planned", "pending-output"],
      relatedLinks: [
        {
          label: "Engineering · Validation ladder",
          href: "engineering.html#hw-validation-ladder",
        },
      ],
      sourceNote:
        "Source heading 'Late September–October' — preserved as month-bounded range 2026-09 to 2026-10.",
      sourceSection: "Hardware · Late September–October · Electrical Bring-Up",
    }),

    event({
      id: "hw-weak-signal-validation-planned",
      startDate: "2026-10",
      endDate: "2026-10",
      datePrecision: "month",
      stream: "drylab",
      substream: "hardware",
      category: "validation",
      status: "planned",
      title: "Weak-Signal Validation (Planned)",
      shortSummary:
        "Planned dark-noise, leakage, calibration, FDM, crosstalk, SNR, and biological fluorescence measurements.",
      work:
        "Planned tests: (1) Dark-noise measurement; (2) Excitation-leakage measurement; (3) Standard fluorescence calibration; (4) FDM frequency recovery; (5) Channel-crosstalk matrix; (6) Raw vs DLIA SNR; (7) Biological fluorescence measurement. The planned validation ladder and corresponding metrics are already defined in the hardware design report.",
      pendingOutputs: [
        "Dark trace",
        "Calibration curve",
        "FFT spectrum",
        "Crosstalk heatmap",
        "SNR comparison",
        "Biological comparison",
      ],
      references: [HARDWARE_REFS["1"]],
      tags: ["validation", "planned", "pending-output"],
      relatedLinks: [
        {
          label: "Engineering · Validation ladder",
          href: "engineering.html#hw-validation-ladder",
        },
        { label: "Experiments · EXP-AS-08", href: "experiments.html#exp-as-08" },
      ],
      sourceSection: "Hardware · October · Weak-Signal Validation",
    }),

    event({
      id: "hw-user-testing-planned",
      startDate: "2026-10",
      endDate: "2026-10",
      datePrecision: "month",
      stream: "drylab",
      substream: "hardware",
      category: "user-testing",
      status: "planned",
      title: "System and User Testing (Planned)",
      shortSummary:
        "Planned workflow tests with users not involved in hardware design, after basic electronic/optical validation.",
      work:
        "Planned work: once the electronic and optical measurement chain has passed basic validation, users who were not involved in hardware design will be asked to perform the intended workflow (prepare/insert sensing unit; power on; start measurement; interpret QC; identify invalid measurement; export; shut down/charge). Record task success, completion time, errors, help required, user comments, and resulting design changes.",
      pendingOutputs: [
        "User feedback linked to specific design changes",
      ],
      needsUpdate: [
        "ADD RESULT — User feedback must be linked to specific changes when testing occurs.",
      ],
      references: [HARDWARE_REFS["2"]],
      tags: ["user-testing", "planned", "pending-output"],
      sourceSection: "Hardware · October · System and User Testing",
    }),
  ];

  /* =========================================================================
   * WET LAB
   * ========================================================================= */
  var WETLAB_EVENTS = [
    event({
      id: "wet-ideation",
      startDate: "2026-04",
      endDate: "2026-04",
      datePrecision: "month",
      stream: "wetlab",
      category: "project-setup",
      status: "needs-update",
      title: "Project Ideation and Receptor Panel Selection",
      shortSummary:
        "Defined wet-lab scope around HEK293 OR + Orco–calcium-indicator lines. Exact April dates still need confirmation.",
      work:
        "Defined wet-lab scope around HEK293 OR + Orco–calcium-indicator lines. Mechanism and topology: Design — not restated here.",
      output: [
        "Project concept and receptor panel scope",
        "Wet-lab responsibility established",
      ],
      nextQuestion: "Which receptors, and how do we read out channel opening?",
      needsUpdate: [
        "Confirm exact dates within April (source marked 🟥 Confirm dates).",
      ],
      tags: ["ideation", "needs-update"],
      sourceSection:
        "Wet lab · April · Project ideation and receptor panel selection",
    }),

    event({
      id: "wet-literature-design",
      startDate: "2026-04",
      endDate: "2026-05",
      datePrecision: "range",
      stream: "wetlab",
      category: "design",
      status: "completed",
      title: "Literature Review and System Design",
      shortSummary:
        "Adopted insect OR–Orco ion-channel assay architecture in HEK293 with a nine-OR panel, following Zboray et al. (2023) as reference platform.",
      work:
        "April–May literature review closed the assay architecture choice (OR + Orco–GCaMP in HEK293; nine-OR panel; Zboray et al. 2023 as reference). Construct WHY and topology: Design — not restated here.",
      output: [
        "System architecture decision logged (see Design)",
        "Receptor panel: nine Drosophila ORs",
        "Assay design based on Zboray et al.",
      ],
      references: [
        {
          id: "wet-ref-zboray-2023",
          text: "Zboray et al. (2023) — assay architecture reference platform (as cited in notebook_content.md).",
        },
      ],
      tags: ["literature", "assay-design", "orco"],
      relatedLinks: [
        { label: "Design · Module 2 / topology", href: "design.html#module-2" },
        { label: "Parts page", href: "parts.html" },
      ],
      sourceSection: "Wet lab · April–May · Literature review and system design",
    }),

    event({
      id: "wet-vector-rescue",
      startDate: "2026-05",
      endDate: "2026-07",
      datePrecision: "range",
      stream: "wetlab",
      category: "engineering-cycle",
      status: "needs-update",
      title: "Engineering Cycle 0 — Vector Rescue",
      shortSummary:
        "First synthesised constructs lacked mammalian promoter/polyA; decision to consolidate onto pcDNA3.1(+). Exact dates within May–July still flagged.",
      work:
        "Our first synthesised constructs were delivered in a high-copy cloning backbone. Full annotation of the backbone showed a ColE1 origin, a β-lactamase gene and sequencing adapters — but no mammalian promoter and no polyadenylation signal. The constructs could be propagated in E. coli but could never be transcribed in HEK293. We evaluated rescuing the inserts by overlap-extension PCR into a linear CMV–insert–polyA cassette, versus moving to a proper mammalian expression vector.",
      decision:
        "Consolidate all constructs onto pcDNA3.1(+), which supplies a CMV promoter, BGH poly(A) and a NeoR cassette for G418 selection.",
      learning:
        "Verify that a synthesised construct carries every element required by the intended host before ordering, not after delivery.",
      evidenceImages: [
        {
          src: "plasmid/Or67b_IRES_mCherry_pTwist.png",
          alt: "Plasmid map of Or67b–IRES–mCherry in a pTwist cloning backbone",
          caption:
            "Early Or67b–IRES–mCherry map on a pTwist-class backbone — illustrates the cloning-vector generation that lacked a mammalian promoter/polyA and motivated the pcDNA3.1(+) rescue.",
        },
      ],
      needsUpdate: [
        "Replace 🟥 May–July heading with an exact date or narrower verified range before wiki freeze.",
      ],
      tags: ["vector", "pcdna3.1", "engineering-cycle", "needs-update"],
      relatedLinks: [
        { label: "Engineering · Wet lab track", href: "engineering.html#track-wetlab" },
        { label: "Design · shared backbone", href: "design.html#shared-backbone" },
      ],
      sourceSection: "Wet lab · 🟥 May–July · Engineering Cycle 0 — vector rescue",
    }),

    event({
      id: "wet-orco-ires-weak-signal",
      startDate: null,
      endDate: null,
      datePrecision: "range",
      stream: "wetlab",
      category: "engineering-cycle",
      status: "needs-update",
      title: "Engineering Cycle 1 — Orco–IRES–GCaMP6 Weak Fluorescence Response",
      shortSummary:
        "VUAA1 challenge of Orco→IRES→GCaMP6 produced a very weak green fluorescence increase that could not be recorded reliably. Date and assay metadata missing.",
      work:
        "VUAA1 challenge of first-generation Orco → IRES → GCaMP6 (date / assay metadata incomplete in source).",
      observation:
        "Real but very weak green fluorescence increase — too small to record reliably or quantify.",
      result:
        "Observation only. No quantified ΔF/F₀ and no archived trace in this notebook entry.",
      hypothesis:
        "Source initially hypothesized poor Orco expression; later reframed as possible IRES-downstream reporter bottleneck (see Engineering).",
      interpretation: null,
      learning:
        "Chronology only here. Failure analysis: Engineering · Cycle 1. Planned IRES vs fusion comparison: Experiments / Results when data exist.",
      nextQuestion:
        "Can we restore sensor amplitude with a fusion reporter? (→ Cycle 2)",
      needsUpdate: [
        "Record date (source heading is 🟥 [date]).",
        "Record cell line, transfection method, VUAA1 concentration, and observation method.",
        "Attach image or trace if available; if only observed by eye, state that explicitly.",
      ],
      tags: [
        "orco",
        "ires",
        "gcamp",
        "vuaa1",
        "weak-signal",
        "needs-update",
        "negative-or-inconclusive",
      ],
      relatedLinks: [
        { label: "Engineering · Wet Lab Cycle 1", href: "engineering.html#wl-cycle-1" },
        { label: "Design · Module 2", href: "design.html#module-2" },
        { label: "Experiments · EXP-AS-04", href: "experiments.html#exp-as-04" },
      ],
      sourceNote:
        "startDate/endDate left null because the source provides only 🟥 [date]. Do not invent a calendar day. UI should render this as Needs update / undated.",
      sourceSection:
        "Wet lab · 🟥 [date] · Engineering Cycle 1 — Orco–IRES–GCaMP6 gives an undetectable signal",
    }),

    event({
      id: "wet-fusion-redesign",
      startDate: "2026-07",
      endDate: "2026-08",
      datePrecision: "range",
      stream: "wetlab",
      category: "engineering-cycle",
      status: "needs-update",
      title: "Engineering Cycle 2 — Redesign as a Translational Fusion",
      shortSummary:
        "Redesigned reporter as GCaMP6f–(GGGGS)₃–DmOrco; in-silico verification of ten constructs before synthesis. Exact July–August dates still flagged.",
      work:
        "July–August: redesigned reporter as single ORF GCaMP6f–(GGGGS)₃–DmOrco; finalised nine OR modules; in-silico checks before synthesis (frame, stops, Kozak, junctions; linker synonymous-codon diversification). Construct WHY: Design · Module 2.",
      hypothesis:
        "Design intent: 1:1 stoichiometry and pore-proximal sensor — not a measured wet-lab outcome in this entry. See Engineering · Cycle 2.",
      output: [
        "Ten verified construct sequences",
        "Orco module: 8,293 bp in pcDNA3.1(+), ORF 2,856 bp → 951 aa",
        "Nine OR modules: ≈ 7.9–8.0 kb each",
      ],
      evidenceImages: [
        {
          src: "plasmid/GCaMP6f_GGGGSx3_DmOrco.png",
          alt: "Plasmid map of GCaMP6f–(GGGGS)3–DmOrco fusion reporter in pcDNA3.1(+)",
          caption:
            "Fusion reporter map (GCaMP6f–linker–DmOrco) — design evidence for the Cycle 2 translational-fusion redesign, not fluorescence assay data.",
        },
        {
          src: "plasmid/Or22a_IRES_mCherry.png",
          alt: "Plasmid map of Or22a–IRES–mCherry sensing module",
          caption:
            "Representative OR–IRES–mCherry sensing-module map from the ten-construct package finalized alongside the fusion reporter.",
        },
      ],
      needsUpdate: [
        "Replace 🟥 July–August heading with exact dates or a narrower verified range before wiki freeze.",
      ],
      tags: ["fusion", "gcamp6f", "orco", "construct-design", "needs-update"],
      relatedLinks: [
        { label: "Engineering · Wet Lab Cycle 2", href: "engineering.html#wl-cycle-2" },
        { label: "Design · Module 2", href: "design.html#module-2" },
        { label: "Parts page", href: "parts.html" },
      ],
    }),

    event({
      id: "wet-plasmid-order",
      startDate: "2026-08-10",
      endDate: "2026-08-10",
      datePrecision: "day",
      stream: "wetlab",
      category: "synthesis",
      status: "completed",
      title: "Plasmid Synthesis Ordered",
      shortSummary:
        "Ordered ten GenScript plasmids (nine OR modules + one Orco–GCaMP6f reporter) in pcDNA3.1(+).",
      work:
        "Ten plasmids ordered from GenScript: nine OR sensing modules (Or22a, Or85b, Or35a, Or67a, Or7a, Or59b, Or42a, Or98a, Or19a) and one Orco–GCaMP6f reporting module, all pre-cloned into pcDNA3.1(+).",
      output: ["Purchase order placed"],
      evidenceImages: [
        {
          src: "plasmid/GCaMP6f_GGGGSx3_DmOrco.png",
          alt: "Plasmid map corresponding to the Orco–GCaMP6f reporter ordered from GenScript",
          caption:
            "Ordered fusion-reporter map — indexes what was submitted for synthesis on 10 Aug 2026; not delivery or sequence-verification evidence.",
        },
      ],
      needsUpdate: [
        "Optional: record quote reference if the team wishes to archive it.",
      ],
      tags: ["genscript", "plasmid-order"],
      sourceSection: "Wet lab · August 10 · Plasmid synthesis ordered",
    }),

    event({
      id: "wet-plasmids-received",
      startDate: "2026-09-04",
      endDate: "2026-09-04",
      datePrecision: "day",
      stream: "wetlab",
      category: "synthesis",
      status: "needs-update",
      title: "Plasmids Received",
      shortSummary:
        "Ten constructs delivered September 4; vendor sequences were checked base-by-base, but verification outcome is still marked for recording.",
      work:
        "All ten constructs delivered. The vendor's returned sequences were checked against our designs base-by-base.",
      result:
        "Verification outcome not yet recorded in the source (did every construct match the submitted design? any vendor-side changes?).",
      output: ["Ten plasmids in hand (sequence-verification claim unresolved — see contradictions)"],
      pendingOutputs: ["Vendor sequence files archived"],
      needsUpdate: [
        "Record the verification outcome: did every construct match the submitted design? Note any vendor-side changes.",
        "Archive vendor sequence files (🟦 pending).",
      ],
      contradictions: [
        "Source Output states 'Ten sequence-verified plasmids in hand' while Result still has 🟥 instructing to record whether every construct matched. Treat sequence verification as unresolved until the outcome is filled in; do not present plasmids as fully verified on the wiki.",
      ],
      tags: ["plasmid-delivery", "needs-update", "contradiction"],
      sourceSection: "Wet lab · September 4 · Plasmids received",
    }),

    event({
      id: "wet-maxiprep",
      startDate: "2026-09",
      endDate: "2026-09",
      datePrecision: "month",
      stream: "wetlab",
      category: "molecular-cloning",
      status: "needs-update",
      title: "Bacterial Transformation and Plasmid Preparation",
      shortSummary:
        "September transformation/maxiprep/Sanger checklist is labeled 'Planned / completed' in the source — execution status unresolved; QC outputs pending.",
      work:
        "Listed steps: transformation into E. coli DH5α, ampicillin selection; colony picking and overnight culture; endotoxin-free maxiprep; Sanger verification across both junctions (T7 forward, BGH reverse, plus internal primers; one read across the linker region of the Orco construct). Note: avoid PstI for diagnostic digests — most coding sequences contain internal PstI sites.",
      pendingOutputs: [
        "Plasmid yields and A260/A280, A260/A230",
        "Sequencing chromatograms",
      ],
      needsUpdate: [
        "Resolve whether listed steps were completed or remain planned (source heading 'Planned / completed work').",
        "Replace 🟥 September with exact dates when known.",
        "Attach yields and chromatograms when available.",
      ],
      contradictions: [
        "Source section title uses 'Planned / completed work' without stating which bullets were actually performed. Status set to needs-update rather than completed or planned.",
      ],
      tags: ["maxiprep", "sanger", "needs-update"],
      relatedLinks: [
        { label: "Experiments · EXP-AS-01", href: "experiments.html#exp-as-01" },
        { label: "Notebook slot nb-EXP-AS-01", href: "notebook.html#nb-EXP-AS-01" },
      ],
      sourceSection:
        "Wet lab · 🟥 September · Bacterial transformation and plasmid preparation",
    }),

    event({
      id: "wet-transfection-planned",
      startDate: "2026-09",
      endDate: "2026-10",
      datePrecision: "range",
      stream: "wetlab",
      category: "cell-engineering",
      status: "planned",
      title: "Transfection and Stable Line Generation (Planned)",
      shortSummary:
        "Planned G418 kill curve, OR:Orco co-transfection by electroporation, and stable-pool selection.",
      work:
        "Planned work: kill curve on untransfected HEK293 (0–800 µg/mL G418); co-transfection by electroporation, ~5 µg DNA at 2:1 OR : Orco per reaction; G418 selection from 24–48 h post-transfection: 100 µg/mL for two weeks, then 150 µg/mL for one week; untransfected control well at the same dose. Expected timeline noted in source: no visible effect for 1–2 days, bulk cell death at days 3–5, discrete resistant colonies by days 10–14.",
      pendingOutputs: [
        "Kill-curve table",
        "Transfection efficiency (mCherry-positive fraction)",
        "Stable pools for each of the nine receptors",
      ],
      needsUpdate: [
        "Replace 🟥 September–October with actual execution dates when work occurs.",
      ],
      tags: ["transfection", "g418", "planned", "pending-output"],
      relatedLinks: [
        { label: "Experiments · EXP-AS-02", href: "experiments.html#exp-as-02" },
        { label: "Notebook slot nb-EXP-AS-02", href: "notebook.html#nb-EXP-AS-02" },
      ],
      sourceSection:
        "Wet lab · 🟥 September–October · Transfection and stable line generation",
    }),

    event({
      id: "wet-expression-validation-planned",
      startDate: "2026-10",
      endDate: "2026-10",
      datePrecision: "month",
      stream: "wetlab",
      category: "assay",
      status: "planned",
      title: "Expression Validation (Planned)",
      shortSummary:
        "Planned microscopy, anti-His blot, ionomycin, and 50 µM VUAA1 chain tests, including IRES vs fusion comparison.",
      work:
        "Planned tests: (1) Fluorescence microscopy — mCherry and GCaMP6f baseline; (2) Anti-His western blot — full-length Orco–GCaMP6f fusion at ≈ 105 kDa; (3) Ionomycin — isolates the reporter; (4) VUAA1, 50 µM — tests the whole chain. Acceptance criterion defined in advance: a VUAA1-evoked ΔF/F₀ large enough to quantify on the plate reader, clearly separated from vehicle, and abolished in Ca²⁺-free buffer.",
      pendingOutputs: [
        "VUAA1-evoked ΔF/F₀ for Orco–IRES–GCaMP6 versus GCaMP6f–(GGGGS)₃–Orco on the same plate under identical conditions",
      ],
      needsUpdate: [
        "Replace 🟥 October with actual assay dates when performed.",
      ],
      tags: ["expression", "vuaa1", "planned", "pending-output"],
      relatedLinks: [
        { label: "Experiments · EXP-AS-03", href: "experiments.html#exp-as-03" },
        { label: "Experiments · EXP-AS-04", href: "experiments.html#exp-as-04" },
        { label: "Notebook slot nb-EXP-AS-04", href: "notebook.html#nb-EXP-AS-04" },
      ],
      sourceSection: "Wet lab · 🟥 October · Expression validation",
    }),

    event({
      id: "wet-voc-imaging-planned",
      startDate: "2026-10",
      endDate: "2026-10",
      datePrecision: "month",
      stream: "wetlab",
      category: "assay",
      status: "planned",
      title: "Calcium Imaging — VOC Panel (Planned)",
      shortSummary:
        "Planned 384-well VOC panel with VUAA1 normalisation across nine receptors.",
      work:
        "Planned work: 384-well plates, 12,000–18,000 cells/well seeded 48–72 h ahead; two-round injection (7 µL vehicle, then 9 µL of 4× VOC); ex 485 / em 535 nm; VOCs at 1, 10 and 100 µM; 50 µM VUAA1 on every plate for normalisation; each VOC–OR pair measured on at least three separate days.",
      pendingOutputs: [
        "Dose–response curves",
        "Response matrix: nine receptors × VOC panel",
        "Ca²⁺-free specificity control",
      ],
      needsUpdate: [
        "Replace 🟥 October with actual imaging dates when performed.",
      ],
      tags: ["voc", "calcium-imaging", "planned", "pending-output"],
      relatedLinks: [
        { label: "Experiments · EXP-AS-05", href: "experiments.html#exp-as-05" },
        { label: "Results · res-EXP-AS-05", href: "results.html#res-EXP-AS-05" },
      ],
      sourceSection: "Wet lab · 🟥 October · Calcium imaging — VOC panel",
    }),
  ];

  /* =========================================================================
   * DRY LAB
   * ========================================================================= */
  var DRYLAB_EVENTS = [
    event({
      id: "dry-direction",
      startDate: "2026-04",
      endDate: "2026-04",
      datePrecision: "month",
      stream: "drylab",
      substream: "model",
      category: "project-setup",
      status: "completed",
      title: "Establishing the Project Direction and Team Assignments",
      shortSummary:
        "Chose a fly-inspired SNN (PN → KC → MBON) direction for gas classification with emphasis on sensor-drift robustness; no concrete model data yet.",
      objective:
        "Decide on AeroSense's research direction and feasibility: is the electronic-nose gas classification problem a good fit for a spiking neural network inspired by the fly olfactory circuit (PN → KC → MBON)?",
      work:
        "Established initial AeroSense project direction and divided responsibilities among wet-lab, modeling, hardware, and other groups. Literature review of fly olfactory circuit architecture, SNN fundamentals, and insect odorant receptor biology (Sato et al., 2008; Jones et al., 2011). Surveyed existing electronic-nose datasets and classification methods (SVM, ELM, other baselines). Discussed inherited analysis code and dataset with the advisor / previous researcher.",
      result:
        "No concrete data yet; the modeling team settled on the direction: a fly-inspired SNN for gas classification, emphasizing robustness to sensor drift (architecture following Caron et al., 2013).",
      problem:
        "Not yet familiar with Brian2 / STDP / the existing codebase's architecture; the original code's execution environment differs from the environment to be used going forward.",
      nextStep:
        "In May–June, focus on understanding and verifying the existing code rather than rushing to rewrite it.",
      references: [
        { id: "dry-ref-sato-2008", text: "Sato et al. (2008)" },
        { id: "dry-ref-jones-2011", text: "Jones et al. (2011)" },
        { id: "dry-ref-caron-2013", text: "Caron et al. (2013)" },
        { id: "dry-ref-gardner-1994", text: "Gardner & Bartlett (1994)" },
      ],
      tags: ["snn", "direction", "literature"],
      relatedLinks: [{ label: "Model page", href: "model.html" }],
      sourceSection:
        "Dry lab · April · Establishing the Project Direction and Team Assignments",
    }),

    event({
      id: "dry-code-familiarization",
      startDate: "2026-05",
      endDate: "2026-05",
      datePrecision: "month",
      stream: "drylab",
      substream: "model",
      category: "codebase",
      status: "completed",
      title: "Getting Familiar with the Inherited Code and Data",
      shortSummary:
        "Confirmed Brian2/original SNN could run in the new environment; noted dataset naming issues and suspected contamination.",
      objective:
        "Understand and clarify the implementation details of the PN-KC-MBON model.",
      work:
        "Read the original analysis scripts and draft handover documents. Surveyed scale and format of the existing gas-sensor dataset: multiple batches, five gases, several sensor devices. Small-scale dry runs of the existing code, without modifying the original files.",
      result:
        "Confirmed the new environment could get Brian2 installed and run the original SNN; no new experimental data yet.",
      observation:
        "The original dataset's naming conventions were not intuitive, and there were suspected duplicates/contamination that would need cleaning up later.",
      problem:
        "Some original scripts had hard-coded paths and environment dependencies that couldn't be carried over to the new machine as-is.",
      nextStep: "Start a formal code audit and pipeline cleanup in June.",
      references: [
        { id: "dry-ref-marco-2012", text: "Marco & Gutiérrez-Gálvez (2012)" },
        { id: "dry-ref-vergara-2012", text: "Vergara et al. (2012)" },
      ],
      tags: ["brian2", "dataset", "handover"],
      relatedLinks: [{ label: "Model page", href: "model.html" }],
      sourceSection:
        "Dry lab · May · Getting Familiar with the Inherited Code and Data",
    }),

    event({
      id: "dry-code-audit",
      startDate: "2026-06",
      endDate: "2026-06",
      datePrecision: "month",
      stream: "drylab",
      substream: "model",
      category: "codebase",
      status: "completed",
      title: "Code Audit and Clarifying the Data Pipeline",
      shortSummary:
        "Verified inherited scripts; documented PC3×20 oracle ~0.85 F1 and SVM/ELM ~0.83; early SNN MBON readout only 0.34–0.55 F1.",
      objective:
        "Confirm the inherited code runs correctly, and clarify how the PN-KC-MBON architecture maps onto the dataset, to set up for formal experiments.",
      work:
        "Ran syntax checks and dry-run verification on every existing analysis script across several analysis lines (pure-odor PCA, trace-coding, KC ablation, etc.). Clarified data representation: delta_peak features from 14 sensors, PCA-3, a 60-dimensional PN multi-hot encoding, and the PN-KC-MBON architecture (KC 500–1000, APL lateral inhibition, 5 MBON classes), following Caron et al. (2013), Turner et al. (2008), and Litwin-Kumar et al. (2017).",
      result:
        "Under the PC3×20 digitized representation, the theoretical-oracle macro F1 is about 0.85, with SVM/ELM baselines around 0.83.",
      observation:
        "Early versions of the PN-KC-MBON architecture had unstable MBON readout (F1 only 0.34–0.55), far below the SVM/ELM baselines — suggesting the bottleneck was in the SNN's coding/readout rather than a lack of information in the data itself.",
      nextStep:
        "Starting in July, formally run SVM/DAELM baselines and fly-SNN parameter sweeps, treating MBON learning/readout as the main open problem.",
      references: [
        { id: "dry-ref-caron-2013", text: "Caron et al. (2013)" },
        { id: "dry-ref-turner-2008", text: "Turner et al. (2008)" },
        { id: "dry-ref-litwin-kumar-2017", text: "Litwin-Kumar et al. (2017)" },
        { id: "dry-ref-bi-poo-1998", text: "Bi & Poo (1998)" },
      ],
      tags: ["audit", "pca", "snn", "baseline-prep"],
      relatedLinks: [
        { label: "Model page", href: "model.html" },
        { label: "Engineering · Dry lab track", href: "engineering.html#track-drylab" },
      ],
      sourceNote:
        "Duplicate identical June section in notebook_content.md was collapsed to this single event.",
      sourceSection:
        "Dry lab · June · Code Audit and Clarifying the Data Pipeline (unique copy; duplicate removed)",
    }),

    event({
      id: "dry-snn-baseline",
      startDate: "2026-07",
      endDate: "2026-07",
      datePrecision: "month",
      stream: "drylab",
      substream: "model",
      category: "modeling",
      status: "completed",
      title: "Establishing Baselines: SVM/DAELM + Initial Fly-SNN Sweeps",
      shortSummary:
        "DAELM improved batch accuracies; best early fly-SNN single-run F1 ~0.545 with unstable non-monotonic learning curves.",
      objective:
        "Establish trustworthy traditional-classifier baselines (SVM/DAELM), get the fly-SNN to a usable result, and locate the SNN's performance bottleneck.",
      work:
        "SVM baselines under PCA/ICA/no-reduction settings; cross-batch (drift) classification remained hard. PCA-5 source ELM + DAELM calibration comparing source-only / IPCA-only / DAELM / IPCA+DAELM. 10-seed benchmark of PC3×20 digitized representation (theoretical oracle / SVM RBF / ELM). Parameter sweeps of fly-SNN (PN-KC-MBON) on a pooled random split: KC=500/1000, inhibitory plasticity (IP), PN→KC sparsity p, W(PN→KC)/W(KC→MBON)/learning rate, and training-cycle checkpoints (0–500).",
      result:
        "DAELM calibration: one batch's known-class accuracy rose from 0.741 (source-only) to 0.867 (DAELM); another batch rose from 0.567 to 0.603. Fly-SNN best single-run F1 was about 0.545 (KC=1000, IP=0, p=0.05, Wpn=450, Wmbon=15, lr=0.05, 200 cycles), but the checkpoint curve was non-monotonic — learning was unstable.",
      problem:
        "STDP/MBON dynamics weren't converging stably across cycles — the same parameter set produced wildly different F1 at different cycle counts, making it hard to tell whether training longer actually helped.",
      nextStep:
        "Starting in August, focus on fly-SNN hyperparameters and data preprocessing (PCA dimensionality, normalization, cleaning contaminated data) to determine whether the stuck readout was a tuning problem or a fundamental limitation.",
      references: [
        { id: "dry-ref-huang-2006", text: "Huang et al. (2006)" },
        { id: "dry-ref-zhang-2015", text: "Zhang & Zhang (2015)" },
        { id: "dry-ref-vergara-2012", text: "Vergara et al. (2012)" },
      ],
      tags: ["svm", "daelm", "snn", "baseline", "unstable-learning"],
      relatedLinks: [
        { label: "Model · evidence baseline", href: "model.html#evidence-baseline" },
        { label: "Experiments · EXP-AS-07", href: "experiments.html#exp-as-07" },
      ],
      sourceSection:
        "Dry lab · July · Establishing Baselines: SVM/DAELM Classifiers + Initial Fly-SNN Sweeps",
    }),

    event({
      id: "dry-snn-hyperparameter-breakthrough",
      startDate: "2026-08",
      endDate: "2026-08",
      datePrecision: "month",
      stream: "drylab",
      substream: "model",
      category: "modeling",
      status: "completed",
      title:
        "Data Cleaning, Hyperparameter Breakthrough, Sensor/Precision Analysis, Repo Reorganization",
      shortSummary:
        "Contaminated rows removed (9726→8421); denser PN→KC + weaker lateral inhibition reached F1 0.800 (pca-3); documented baseline F1 0.868 under stated settings.",
      objective:
        "Resolve July's unstable MBON readout problem, examine sensor quality and data-precision requirements, and clean up the repo structure.",
      work:
        "Found and isolated some contaminated data; exposure-row count dropped from 9726 to 8421; contamination had little effect on PCA structure (only +0.7pp of cumulative variance). Raising PN→KC sparsity from 0.05 to 0.2 combined with loosening lateral inhibition from 2000 to 500 pushed F1 to 0.800 under pca-3, overturning the earlier conclusion that readout was fundamentally capped. Computing delta_peak from only the first 100 seconds of each exposure raised cumulative variance of the top 3 PCA components from 88.7% to 89.7%. Compared amplitude-type against rate-type features; swept feature combinations × time windows × representation (SVM, 378 CV runs), confirming the peak feature is the strongest single feature and that a 60-second window already saturates performance.",
      result:
        "Baseline setting: PCA-8, p=0.05, ip=2, KC=1000, lateral=2000, lr=0.025 → Precision 0.877 / Recall 0.872 / F1 0.868.",
      observation:
        "Methodological finding reported in source: the SNN's PCA wasn't standardized — this was described as explaining anomalous sensor-importance ranking and inconsistent SVM/SNN reactions to removing the low-magnitude sensor.",
      problem:
        "Performance numbers still depend heavily on a single random split / single seed, with no rigorous k-fold validation yet; some window-sweep analysis tools and their intermediate tables were removed in September, breaking that line of analysis for now.",
      nextStep:
        "In September, first fully clean up the repo structure and data pipeline, then return to more rigorous validation and new optimization methods.",
      references: [
        { id: "dry-ref-huang-2006", text: "Huang et al. (2006)" },
        { id: "dry-ref-zhang-2015", text: "Zhang & Zhang (2015)" },
        { id: "dry-ref-vergara-2012", text: "Vergara et al. (2012)" },
      ],
      tags: ["hyperparameter", "data-cleaning", "f1-0.868", "pca"],
      relatedLinks: [
        { label: "Model · evidence baseline", href: "model.html#evidence-baseline" },
        { label: "Model page", href: "model.html" },
      ],
      sourceSection:
        "Dry lab · August · Data Cleaning, a Key Hyperparameter Breakthrough, Sensor/Precision Analysis, Repo Reorganization",
    }),

    event({
      id: "dry-pipeline-cleanup",
      startDate: "2026-09",
      endDate: "2026-09",
      datePrecision: "month",
      stream: "drylab",
      substream: "model",
      category: "modeling",
      status: "ongoing",
      title:
        "Pipeline Cleanup, Baseline Confirmation, New Optimization/Validation Methods (In Progress)",
      shortSummary:
        "September work in progress: reproducible reference remains F1=0.868; candidate F1=0.887 not k-fold-validated; CMA-ES and continual-learning pilots incomplete.",
      objective:
        "Clear out August's remaining technical debt so the baseline result can be trusted and reproduced, and start exploring optimization/validation methods more systematic than manual grid search.",
      work:
        "Added a second candidate baseline setting (macro F1 0.887, but not yet k-fold-validated, so it can't yet be called better than the original baseline). Started a CMA-ES pilot: bypassing STDP learning and directly searching the KC→MBON weight matrix with CMA-ES as a capacity-ceiling probe. Started a continual-learning experiment: training in two phases (first on 4 gases, then introducing the 5th), using dopamine-gated STDP. Added a PN/KC representation similarity-compression analysis referencing Dasgupta et al. (2017).",
      result:
        "The only clearly documented, reproducible reference point so far is F1=0.868; the second candidate setting (F1=0.887) is not yet k-fold-validated; the CMA-ES pilot and continual-learning experiment are both still at an early stage without complete results.",
      problem:
        "No multi-seed variance estimate for baseline yet; no drift evaluation for the SNN pipeline (train on an earlier batch, test on a later one — only the classical SVM baseline has been drift-tested so far); synaptic weight quantization hasn't been tested.",
      references: [
        { id: "dry-ref-hansen-2016", text: "Hansen (2016)" },
        { id: "dry-ref-dasgupta-2017", text: "Dasgupta et al. (2017)" },
        { id: "dry-ref-babadi-2014", text: "Babadi & Sompolinsky (2014)" },
        { id: "dry-ref-cassenaer-2012", text: "Cassenaer & Laurent (2012)" },
        { id: "dry-ref-mccloskey-1989", text: "McCloskey & Cohen (1989)" },
        { id: "dry-ref-kirkpatrick-2017", text: "Kirkpatrick et al. (2017)" },
        { id: "dry-ref-fremaux-2016", text: "Frémaux & Gerstner (2016)" },
      ],
      tags: ["ongoing", "baseline", "cma-es", "continual-learning"],
      relatedLinks: [
        { label: "Model · limitations", href: "model.html#limitations" },
        { label: "Model · drift robustness", href: "model.html#drift-robustness" },
      ],
      sourceNote:
        "Source title includes '(In Progress)'. Status kept ongoing — not completed.",
      sourceSection:
        "Dry lab · September · Pipeline Cleanup, Baseline Confirmation, New Optimization/Validation Methods (In Progress)",
    }),

    event({
      id: "dry-oct-nov-planned",
      startDate: "2026-10",
      endDate: "2026-11",
      datePrecision: "range",
      stream: "drylab",
      substream: "model",
      category: "modeling",
      status: "planned",
      title: "October and November Evaluation Agenda (Planned)",
      shortSummary:
        "Planned continual-learning analysis, SNN drift evaluation, weight quantization tests, and final model packaging decisions.",
      objective:
        "Fill in drift-related evaluation and precision/quantization experiments, converging toward deliverable/publishable results, and coordinate with the hardware team on deployment requirements for the quantized model.",
      work:
        "Planned: complete full analysis of the two-phase continual-learning experiment; add drift evaluation for the SNN pipeline (train earlier batch, test later) following Vergara et al. (2012); test synaptic weight quantization of learned KC→MBON weights to N bits; depending on October validation results, decide on the final model version, organize results/figures, and prepare a report/paper outline.",
      references: [
        { id: "dry-ref-vergara-2012", text: "Vergara et al. (2012)" },
        { id: "dry-ref-davies-2018", text: "Davies et al. (2018)" },
      ],
      tags: ["planned", "drift", "quantization", "continual-learning"],
      relatedLinks: [
        { label: "Model · drift robustness", href: "model.html#drift-robustness" },
        { label: "Hardware page", href: "hardware.html" },
      ],
      sourceSection: "Dry lab · October and November (Planned)",
    }),
  ];

  var EVENTS = HARDWARE_EVENTS.concat(WETLAB_EVENTS, DRYLAB_EVENTS);

  /**
   * Turning points — curated only from documented decisions in notebook_content.md.
   * Each card links back to one or more EVENT ids. Do not invent pivots.
   */
  var TURNING_POINTS = [
    {
      id: "tp-vector-rescue",
      eventIds: ["wet-vector-rescue"],
      stream: "wetlab",
      substream: null,
      title: "Mammalian expression vector rescue",
      before:
        "First synthesised constructs arrived in a high-copy cloning backbone that could be propagated in E. coli.",
      evidence:
        "Backbone annotation showed ColE1, β-lactamase and sequencing adapters — but no mammalian promoter and no polyadenylation signal, so the inserts could never be transcribed in HEK293.",
      decision:
        "Consolidate all constructs onto pcDNA3.1(+), supplying CMV promoter, BGH poly(A) and NeoR for G418 selection.",
      after:
        "Subsequent construct work proceeded on a host-appropriate mammalian expression backbone rather than attempting a one-off PCR rescue into a linear cassette.",
    },
    {
      id: "tp-orco-reporter-redesign",
      eventIds: ["wet-orco-ires-weak-signal", "wet-fusion-redesign"],
      stream: "wetlab",
      substream: null,
      title: "Orco reporter redesign after weak VUAA1 signal",
      before:
        "First-generation reporting module used a bicistronic Orco → IRES → GCaMP6 architecture.",
      evidence:
        "VUAA1 challenge produced a real but very weak green fluorescence increase — visible on careful inspection, too small to record reliably or quantify. Assay metadata and traces remain incomplete in the source.",
      decision:
        "Redesign the reporter as a single ORF translational fusion: GCaMP6f–(GGGGS)₃–DmOrco (N-terminal sensor), with in-silico verification before resynthesis.",
      after:
        "Ten construct sequences were prepared for synthesis on pcDNA3.1(+); quantified IRES-versus-fusion comparison remains a planned validation, not yet a measured outcome.",
    },
    {
      id: "tp-v1-do-not-fabricate",
      eventIds: ["hw-v1-drc-review"],
      stream: "drylab",
      substream: "hardware",
      title: "Do not fabricate PCB V1",
      before:
        "A complete four-layer V1 layout integrated the optical driver, analog front end, ADC/reference, ESP32, regulators and Raspberry Pi interface.",
      evidence:
        "Pre-manufacturing ERC/DRC evaluation returned 73 DRC violations, 4 unconnected items, 7 ERC errors and 11 ERC warnings. The archive is design-rule evaluation, not a full circuit simulation.",
      decision:
        "Do not fabricate V1. Treat the findings as the first engineering test and obtain professional review.",
      after:
        "Hardware work shifted from fabrication toward correction lists, external review packaging and a V2 redesign path.",
    },
    {
      id: "tp-professional-review",
      eventIds: ["hw-professional-review-cycle-1"],
      stream: "drylab",
      substream: "hardware",
      title: "Professional review resets design priorities",
      before:
        "V1 was prepared as a package for external schematic/layout review (including high-impedance TIA/guard and manufacturability scope).",
      evidence:
        "Professional review and internal re-evaluation flagged LMP7721 pin mapping, guard routing, photodiode pad interpretation, TIA feedback placement, ADC networks, precision-reference circuitry and ESP32 EN/BOOT behavior.",
      decision:
        "Produce a V2 correction list and revise requirements around the whole weak-light signal path — not ADC resolution or TIA gain alone.",
      after:
        "Design attention centered on leakage, noise, parasitics and calibration as first-class constraints for the next layout.",
    },
    {
      id: "tp-remove-raspberry-pi",
      eventIds: ["hw-v2-simplification"],
      stream: "drylab",
      substream: "hardware",
      title: "Remove Raspberry Pi from the standalone reader",
      before:
        "V1 integrated a Raspberry Pi interface alongside ESP32 control.",
      evidence:
        "ESP32 already provides low-level acquisition, digital processing and wireless communication; heavier computational analysis can run externally.",
      decision:
        "Reduce hardware complexity: remove the Raspberry Pi and move toward ESP32-standalone operation with battery power, USB-C charging and local power-path control.",
      after:
        "V2 architecture work continued as an ESP32-first reader (layout later reported complete 11 Sep 2026; fabrication still planned/pending).",
    },
    {
      id: "tp-snn-hyperparameter-breakthrough",
      eventIds: ["dry-snn-baseline", "dry-snn-hyperparameter-breakthrough"],
      stream: "drylab",
      substream: "model",
      title: "SNN readout is tunable, not fundamentally capped",
      before:
        "July fly-SNN sweeps on a pooled split reached only ~0.545 best single-run F1 with unstable, non-monotonic learning curves, suggesting a stuck MBON readout.",
      evidence:
        "August cleaning reduced exposures 9726→8421; raising PN→KC sparsity 0.05→0.2 and loosening lateral inhibition 2000→500 pushed F1 to 0.800 under pca-3, overturning the earlier “fundamentally capped” reading. A documented baseline setting later reached F1 0.868 (single-split/seed limitations remain).",
      decision:
        "Treat the bottleneck as hyperparameter and representation/preprocessing work rather than an inherent ceiling; continue cleanup and more rigorous validation.",
      after:
        "September work is ongoing around pipeline cleanup, a second unverified candidate baseline (F1 0.887), and early CMA-ES / continual-learning pilots without complete results.",
    },
  ];

  /* -------- Coverage map: every unique source section → event id -------- */
  var SOURCE_COVERAGE = [
    { section: "Hardware · April 1–21 · Project Ideation and Team Formation", eventId: "hw-ideation" },
    { section: "Hardware · April 22–May 9 · Literature Review and Hardware Requirements", eventId: "hw-literature-requirements" },
    { section: "Hardware · May 10–June · Component Selection and First-Order Calculations", eventId: "hw-component-selection" },
    { section: "Hardware · June–July · PCB V1 Schematic and Footprint Development", eventId: "hw-v1-schematic" },
    { section: "Hardware · July–August 2 · PCB V1 Layout", eventId: "hw-v1-drc-review" },
    { section: "Hardware · August 2–28 · Preparing for Professional PCB Review", eventId: "hw-review-prep" },
    { section: "Hardware · August 28–September 3 · Engineering Cycle 1: Professional Review", eventId: "hw-professional-review-cycle-1" },
    { section: "Hardware · August 29–September · Engineering Cycle 2: System Simplification and PCB V2", eventId: "hw-v2-simplification" },
    { section: "Hardware · September 3–11 · V2 Schematic Correction and PCB Layout", eventId: "hw-v2-layout" },
    { section: "Hardware · September · Mechanical Enclosure", eventId: "hw-enclosure-planned" },
    { section: "Hardware · Mid–Late September · PCB Fabrication and Assembly", eventId: "hw-fabrication-planned" },
    { section: "Hardware · Late September–October · Electrical Bring-Up", eventId: "hw-bringup-planned" },
    { section: "Hardware · October · Weak-Signal Validation", eventId: "hw-weak-signal-validation-planned" },
    { section: "Hardware · October · System and User Testing", eventId: "hw-user-testing-planned" },
    { section: "Wet lab · April · Project ideation and receptor panel selection", eventId: "wet-ideation" },
    { section: "Wet lab · April–May · Literature review and system design", eventId: "wet-literature-design" },
    { section: "Wet lab · 🟥 May–July · Engineering Cycle 0 — vector rescue", eventId: "wet-vector-rescue" },
    { section: "Wet lab · 🟥 [date] · Engineering Cycle 1 — Orco–IRES–GCaMP6", eventId: "wet-orco-ires-weak-signal" },
    { section: "Wet lab · 🟥 July–August · Engineering Cycle 2 — fusion redesign", eventId: "wet-fusion-redesign" },
    { section: "Wet lab · August 10 · Plasmid synthesis ordered", eventId: "wet-plasmid-order" },
    { section: "Wet lab · September 4 · Plasmids received", eventId: "wet-plasmids-received" },
    { section: "Wet lab · 🟥 September · Bacterial transformation and plasmid preparation", eventId: "wet-maxiprep" },
    { section: "Wet lab · 🟥 September–October · Transfection and stable line generation", eventId: "wet-transfection-planned" },
    { section: "Wet lab · 🟥 October · Expression validation", eventId: "wet-expression-validation-planned" },
    { section: "Wet lab · 🟥 October · Calcium imaging — VOC panel", eventId: "wet-voc-imaging-planned" },
    { section: "Dry lab · April · Project direction", eventId: "dry-direction" },
    { section: "Dry lab · May · Inherited code familiarization", eventId: "dry-code-familiarization" },
    { section: "Dry lab · June · Code audit (duplicate collapsed)", eventId: "dry-code-audit" },
    { section: "Dry lab · July · SVM/DAELM + fly-SNN baselines", eventId: "dry-snn-baseline" },
    { section: "Dry lab · August · Hyperparameter breakthrough", eventId: "dry-snn-hyperparameter-breakthrough" },
    { section: "Dry lab · September · Pipeline cleanup (In Progress)", eventId: "dry-pipeline-cleanup" },
    { section: "Dry lab · October and November (Planned)", eventId: "dry-oct-nov-planned" },
  ];

  function byId(id) {
    for (var i = 0; i < EVENTS.length; i += 1) {
      if (EVENTS[i].id === id) return EVENTS[i];
    }
    return null;
  }

  function summarize() {
    var byStream = { wetlab: 0, drylab: 0, igem: 0 };
    var bySubstream = { hardware: 0, model: 0 };
    var byStatus = { completed: 0, ongoing: 0, planned: 0, "needs-update": 0 };
    var needsUpdateFields = [];
    var contradictions = [];
    var i;
    var ev;
    var j;

    for (i = 0; i < EVENTS.length; i += 1) {
      ev = EVENTS[i];
      if (byStream[ev.stream] != null) byStream[ev.stream] += 1;
      if (ev.substream && bySubstream[ev.substream] != null) {
        bySubstream[ev.substream] += 1;
      }
      if (byStatus[ev.status] != null) byStatus[ev.status] += 1;
      if (ev.needsUpdate && ev.needsUpdate.length) {
        needsUpdateFields.push({ id: ev.id, items: ev.needsUpdate.slice() });
      }
      if (ev.contradictions && ev.contradictions.length) {
        contradictions.push({ id: ev.id, items: ev.contradictions.slice() });
      }
      if (ev.startDate == null) {
        needsUpdateFields.push({
          id: ev.id,
          items: ["startDate/endDate missing (undated source section)"],
        });
      }
    }

    return {
      totalEvents: EVENTS.length,
      igemOfficialEvents: IGEM_OFFICIAL_EVENTS.length,
      sourceSectionsCovered: SOURCE_COVERAGE.length,
      byStream: byStream,
      bySubstream: bySubstream,
      byStatus: byStatus,
      needsUpdateFields: needsUpdateFields,
      contradictions: contradictions,
      duplicateRemoved: META.duplicateRemoved,
    };
  }

  function officialById(id) {
    for (var j = 0; j < IGEM_OFFICIAL_EVENTS.length; j += 1) {
      if (IGEM_OFFICIAL_EVENTS[j].id === id) return IGEM_OFFICIAL_EVENTS[j];
    }
    return null;
  }

  function chronicleById(id) {
    var team = byId(id);
    if (team) return team;
    var official = officialById(id);
    return official ? projectOfficialEvent(official) : null;
  }

  var api = {
    META: META,
    HARDWARE_REFS: HARDWARE_REFS,
    EVENTS: EVENTS,
    IGEM_OFFICIAL_EVENTS: IGEM_OFFICIAL_EVENTS,
    TURNING_POINTS: TURNING_POINTS,
    SOURCE_COVERAGE: SOURCE_COVERAGE,
    byId: byId,
    officialById: officialById,
    chronicleById: chronicleById,
    projectOfficialEvent: projectOfficialEvent,
    summarize: summarize,
  };

  root.AerosenseNotebook = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
