/**
 * AeroSense Parts collection — structured inventory for the Parts page.
 *
 * Scientific source: ../../parts_content.md (authoritative).
 * Plasmid maps: ../plasmid/*.png (final construct images).
 *
 * Do not invent nucleotide sequences, Registry URLs, or assay results.
 * Per-part registryUrl stays null until a verified part-page route exists
 * in the repo or source markdown. The Registry portal URL is stored once.
 *
 * Browser: window.AerosenseParts
 * Node:    module.exports (for count / asset checks)
 */
(function (root) {
  "use strict";

  var REGISTRY_PORTAL_URL = "https://registry.igem.org/";

  var SENSING_ARCHITECTURE = "Kozak → OR CDS → STOP → EMCV IRES → mCherry → STOP";
  var REPORTING_ARCHITECTURE = "Kozak → RSET leader → GCaMP6f → (GGGGS)₃ → DmOrco → STOP";

  var HEK293_LITERATURE = {
    vocResponsiveOverlap: "voc-responsive-overlap",
    expressedVuaa1NoVoc: "expressed-vuaa1-no-voc",
    notInZborayHek293Set: "not-in-zboray-hek293-set",
  };

  var LITERATURE_HEK293 =
    "Published HEK293 evidence exists for four receptors in our final panel, but only two belong to the previously reported VOC-responsive panel. Zboray et al. reported seven VOC-responsive Drosophila OR cell lines; among our nine final receptors, Or85b and Or98a overlap that responsive panel. The same study also generated Or7a and Or19a HEK293 lines that expressed the reporter and responded to the Orco agonist VUAA1, but did not show VOC-specific responses to the tested ligand panel.";

  function hekLit(status) {
    return {
      source: "Zboray et al., 2023",
      citeId: "ref-zboray-2023",
      status: status,
      aerosenseCharacterization: false,
    };
  }

  var PARTS = [
    /* ---------- 9 final-panel sensing composites ---------- */
    {
      id: "BBa_26ZAGFK0",
      displayName: "Or7a-IRES-mCherry",
      category: "composite",
      biologicalRole: "sensing-module",
      signalLayer: null,
      receptorKey: "Or7a",
      lengthBp: 2546,
      proteinLengthAa: null,
      orProteinLengthAa: 413,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: false,
      childIds: ["BBa_26VGDFA1", "BBa_K5490030", "BBa_K4177005"],
      plasmidMap: "plasmid/Or7a_IRES_mCherry.png",
      architecture: SENSING_ARCHITECTURE,
      hek293Literature: hekLit(HEK293_LITERATURE.expressedVuaa1NoVoc),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Final-panel bicistronic sensing module: Or7a CDS, EMCV IRES, and mCherry as a separate polypeptide.",
    },
    {
      id: "BBa_26WOX4B1",
      displayName: "Or22a-IRES-mCherry",
      category: "composite",
      biologicalRole: "sensing-module",
      signalLayer: null,
      receptorKey: "Or22a",
      lengthBp: 2498,
      proteinLengthAa: null,
      orProteinLengthAa: 397,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: false,
      childIds: ["BBa_26AIIWHV", "BBa_K5490030", "BBa_K4177005"],
      plasmidMap: "plasmid/Or22a_IRES_mCherry.png",
      architecture: SENSING_ARCHITECTURE,
      hek293Literature: hekLit(HEK293_LITERATURE.notInZborayHek293Set),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Final-panel bicistronic sensing module: Or22a CDS, EMCV IRES, and mCherry as a separate polypeptide.",
    },
    {
      id: "BBa_26LLF3LM",
      displayName: "Or35a-IRES-mCherry",
      category: "composite",
      biologicalRole: "sensing-module",
      signalLayer: null,
      receptorKey: "Or35a",
      lengthBp: 2534,
      proteinLengthAa: null,
      orProteinLengthAa: 409,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: false,
      childIds: ["BBa_26HJ1RUT", "BBa_K5490030", "BBa_K4177005"],
      plasmidMap: "plasmid/Or35a_IRES_mCherry.png",
      architecture: SENSING_ARCHITECTURE,
      hek293Literature: hekLit(HEK293_LITERATURE.notInZborayHek293Set),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Final-panel bicistronic sensing module: Or35a CDS, EMCV IRES, and mCherry as a separate polypeptide.",
    },
    {
      id: "BBa_26Q1Q094",
      displayName: "Or42a-IRES-mCherry",
      category: "composite",
      biologicalRole: "sensing-module",
      signalLayer: null,
      receptorKey: "Or42a",
      lengthBp: 2525,
      proteinLengthAa: null,
      orProteinLengthAa: 406,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: true,
      childIds: ["BBa_26UHN7NT", "BBa_K5490030", "BBa_K4177005"],
      plasmidMap: "plasmid/Or42a_IRES_mCherry.png",
      architecture: SENSING_ARCHITECTURE,
      hek293Literature: hekLit(HEK293_LITERATURE.notInZborayHek293Set),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Final-panel bicistronic sensing module: Or42a CDS, EMCV IRES, and mCherry as a separate polypeptide. RFC 1000 compatible.",
    },
    {
      id: "BBa_26Y7CI2H",
      displayName: "Or59b-IRES-mCherry",
      category: "composite",
      biologicalRole: "sensing-module",
      signalLayer: null,
      receptorKey: "Or59b",
      lengthBp: 2501,
      proteinLengthAa: null,
      orProteinLengthAa: 398,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: true,
      childIds: ["BBa_26OJ8HGO", "BBa_K5490030", "BBa_K4177005"],
      plasmidMap: "plasmid/Or59b_IRES_mCherry.png",
      architecture: SENSING_ARCHITECTURE,
      hek293Literature: hekLit(HEK293_LITERATURE.notInZborayHek293Set),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Final-panel bicistronic sensing module: Or59b CDS, EMCV IRES, and mCherry as a separate polypeptide. RFC 1000 compatible.",
    },
    {
      id: "BBa_265G8CE1",
      displayName: "Or67a-IRES-mCherry",
      category: "composite",
      biologicalRole: "sensing-module",
      signalLayer: null,
      receptorKey: "Or67a",
      lengthBp: 2528,
      proteinLengthAa: null,
      orProteinLengthAa: 407,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: false,
      childIds: ["BBa_26XXP4K7", "BBa_K5490030", "BBa_K4177005"],
      plasmidMap: "plasmid/Or67a_IRES_mCherry.png",
      architecture: SENSING_ARCHITECTURE,
      hek293Literature: hekLit(HEK293_LITERATURE.notInZborayHek293Set),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Final-panel bicistronic sensing module: Or67a CDS, EMCV IRES, and mCherry as a separate polypeptide.",
    },
    {
      id: "BBa_26K1TU11",
      displayName: "Or85b-IRES-mCherry",
      category: "composite",
      biologicalRole: "sensing-module",
      signalLayer: null,
      receptorKey: "Or85b",
      lengthBp: 2477,
      proteinLengthAa: null,
      orProteinLengthAa: 390,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: true,
      childIds: ["BBa_26DVVZIA", "BBa_K5490030", "BBa_K4177005"],
      plasmidMap: "plasmid/Or85b_IRES_mCherry.png",
      architecture: SENSING_ARCHITECTURE,
      hek293Literature: hekLit(HEK293_LITERATURE.vocResponsiveOverlap),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Final-panel bicistronic sensing module: Or85b CDS, EMCV IRES, and mCherry as a separate polypeptide. RFC 1000 compatible.",
    },
    {
      id: "BBa_26TZLBMJ",
      displayName: "Or98a-IRES-mCherry",
      category: "composite",
      biologicalRole: "sensing-module",
      signalLayer: null,
      receptorKey: "Or98a",
      lengthBp: 2498,
      proteinLengthAa: null,
      orProteinLengthAa: 397,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: true,
      childIds: ["BBa_26DG1NPK", "BBa_K5490030", "BBa_K4177005"],
      plasmidMap: "plasmid/Or98a_IRES_mCherry.png",
      architecture: SENSING_ARCHITECTURE,
      hek293Literature: hekLit(HEK293_LITERATURE.vocResponsiveOverlap),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Final-panel bicistronic sensing module: Or98a CDS, EMCV IRES, and mCherry as a separate polypeptide. RFC 1000 compatible.",
    },
    {
      id: "BBa_2629NIWH",
      displayName: "Or19a-IRES-mCherry",
      category: "composite",
      biologicalRole: "sensing-module",
      signalLayer: null,
      receptorKey: "Or19a",
      lengthBp: 2468,
      proteinLengthAa: null,
      orProteinLengthAa: 387,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: false,
      childIds: ["BBa_26HTXB02", "BBa_K5490030", "BBa_K4177005"],
      plasmidMap: "plasmid/Or19a_IRES_mCherry.png",
      architecture: SENSING_ARCHITECTURE,
      hek293Literature: hekLit(HEK293_LITERATURE.expressedVuaa1NoVoc),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Final-panel bicistronic sensing module: Or19a CDS, EMCV IRES, and mCherry as a separate polypeptide.",
    },

    /* ---------- 1 reporting composite ---------- */
    {
      id: "BBa_26E11Z80",
      displayName: "GCaMP6f-(GGGGS)3-DmOrco",
      category: "composite",
      biologicalRole: "reporting-module",
      signalLayer: null,
      receptorKey: null,
      lengthBp: 2862,
      codingSequenceBp: 2856,
      proteinLengthAa: 951,
      proteinMassKdaApprox: 105,
      orcoProteinLengthAa: 486,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: false,
      rfc1000Note: "BsaI inherited from DmOrco",
      childIds: ["BBa_262WP16P", "BBa_26QHYP02", "BBa_26E21OEQ", "BBa_26LWIKBQ"],
      plasmidMap: "plasmid/GCaMP6f_GGGGSx3_DmOrco.png",
      architecture: REPORTING_ARCHITECTURE,
      codonOptimizedForHumanExpression: null,
      shortDescription:
        "Reporting-module fusion: N-terminal GCaMP6f, (GGGGS)₃ linker, and DmOrco as one open reading frame.",
    },

    /* ---------- 14 new basic parts ---------- */
    {
      id: "BBa_26LWIKBQ",
      displayName: "DmOrco CDS",
      category: "basic",
      biologicalRole: "orco",
      signalLayer: "transduction",
      receptorKey: "DmOrco",
      lengthBp: 1461,
      proteinLengthAa: 486,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: false,
      rfc1000Note: "BsaI inherited from DmOrco (stated on the reporting composite)",
      childIds: [],
      plasmidMap: null,
      sourceOrganism: "Drosophila melanogaster",
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Human codon-optimised DmOrco coding sequence. Common transduction subunit of every AeroSense cell line.",
    },
    {
      id: "BBa_26AIIWHV",
      displayName: "Or22a CDS",
      category: "basic",
      biologicalRole: "tuning-or",
      signalLayer: "input",
      receptorKey: "Or22a",
      lengthBp: 1194,
      proteinLengthAa: 397,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      sourceOrganism: "Drosophila melanogaster",
      hek293Literature: hekLit(HEK293_LITERATURE.notInZborayHek293Set),
      codonOptimizedForHumanExpression: true,
      shortDescription: "Human codon-optimised Or22a coding sequence. Final-panel tuning receptor.",
    },
    {
      id: "BBa_26DVVZIA",
      displayName: "Or85b CDS",
      category: "basic",
      biologicalRole: "tuning-or",
      signalLayer: "input",
      receptorKey: "Or85b",
      lengthBp: 1173,
      proteinLengthAa: 390,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      sourceOrganism: "Drosophila melanogaster",
      hek293Literature: hekLit(HEK293_LITERATURE.vocResponsiveOverlap),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Human codon-optimised Or85b coding sequence. Final-panel tuning receptor; overlaps the Zboray VOC-responsive HEK293 panel.",
    },
    {
      id: "BBa_26HJ1RUT",
      displayName: "Or35a CDS",
      category: "basic",
      biologicalRole: "tuning-or",
      signalLayer: "input",
      receptorKey: "Or35a",
      lengthBp: 1230,
      proteinLengthAa: 409,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      sourceOrganism: "Drosophila melanogaster",
      hek293Literature: hekLit(HEK293_LITERATURE.notInZborayHek293Set),
      codonOptimizedForHumanExpression: true,
      shortDescription: "Human codon-optimised Or35a coding sequence. Final-panel tuning receptor.",
    },
    {
      id: "BBa_26XXP4K7",
      displayName: "Or67a CDS",
      category: "basic",
      biologicalRole: "tuning-or",
      signalLayer: "input",
      receptorKey: "Or67a",
      lengthBp: 1224,
      proteinLengthAa: 407,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      sourceOrganism: "Drosophila melanogaster",
      hek293Literature: hekLit(HEK293_LITERATURE.notInZborayHek293Set),
      codonOptimizedForHumanExpression: true,
      shortDescription: "Human codon-optimised Or67a coding sequence. Final-panel tuning receptor.",
    },
    {
      id: "BBa_26VGDFA1",
      displayName: "Or7a CDS",
      category: "basic",
      biologicalRole: "tuning-or",
      signalLayer: "input",
      receptorKey: "Or7a",
      lengthBp: 1242,
      proteinLengthAa: 413,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      sourceOrganism: "Drosophila melanogaster",
      hek293Literature: hekLit(HEK293_LITERATURE.expressedVuaa1NoVoc),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Human codon-optimised Or7a coding sequence. Final-panel tuning receptor. Zboray HEK293 line responded to VUAA1 but not to the tested VOC panel.",
    },
    {
      id: "BBa_26OJ8HGO",
      displayName: "Or59b CDS",
      category: "basic",
      biologicalRole: "tuning-or",
      signalLayer: "input",
      receptorKey: "Or59b",
      lengthBp: 1197,
      proteinLengthAa: 398,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      sourceOrganism: "Drosophila melanogaster",
      hek293Literature: hekLit(HEK293_LITERATURE.notInZborayHek293Set),
      codonOptimizedForHumanExpression: true,
      shortDescription: "Human codon-optimised Or59b coding sequence. Final-panel tuning receptor.",
    },
    {
      id: "BBa_26UHN7NT",
      displayName: "Or42a CDS",
      category: "basic",
      biologicalRole: "tuning-or",
      signalLayer: "input",
      receptorKey: "Or42a",
      lengthBp: 1221,
      proteinLengthAa: 406,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      sourceOrganism: "Drosophila melanogaster",
      hek293Literature: hekLit(HEK293_LITERATURE.notInZborayHek293Set),
      codonOptimizedForHumanExpression: true,
      shortDescription: "Human codon-optimised Or42a coding sequence. Final-panel tuning receptor.",
    },
    {
      id: "BBa_26DG1NPK",
      displayName: "Or98a CDS",
      category: "basic",
      biologicalRole: "tuning-or",
      signalLayer: "input",
      receptorKey: "Or98a",
      lengthBp: 1194,
      proteinLengthAa: 397,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      sourceOrganism: "Drosophila melanogaster",
      hek293Literature: hekLit(HEK293_LITERATURE.vocResponsiveOverlap),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Human codon-optimised Or98a coding sequence. Final-panel tuning receptor; overlaps the Zboray VOC-responsive HEK293 panel.",
    },
    {
      id: "BBa_26HTXB02",
      displayName: "Or19a CDS",
      category: "basic",
      biologicalRole: "tuning-or",
      signalLayer: "input",
      receptorKey: "Or19a",
      lengthBp: 1164,
      proteinLengthAa: 387,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      sourceOrganism: "Drosophila melanogaster",
      hek293Literature: hekLit(HEK293_LITERATURE.expressedVuaa1NoVoc),
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "Human codon-optimised Or19a coding sequence. Final-panel tuning receptor. Zboray HEK293 line responded to VUAA1 but not to the tested VOC panel.",
    },
    {
      id: "BBa_26ACVV3R",
      displayName: "Or67b CDS",
      category: "basic",
      biologicalRole: "tuning-or",
      signalLayer: "input",
      receptorKey: "Or67b",
      lengthBp: 1266,
      proteinLengthAa: null,
      inFinalPanel: false,
      firstGeneration: true,
      rfc1000: null,
      childIds: [],
      plasmidMap: "plasmid/Or67b_IRES_mCherry_pTwist.png",
      plasmidMapKind: "legacy-construct",
      sourceOrganism: "Drosophila melanogaster",
      codonOptimizedForHumanExpression: true,
      shortDescription:
        "First-generation Or67b coding sequence. Registered for traceability; not one of the nine final-panel receptors. The accompanying pTwist construct image is not a counted composite part.",
    },
    {
      id: "BBa_26QHYP02",
      displayName: "GCaMP6f",
      category: "basic",
      biologicalRole: "calcium-indicator",
      signalLayer: "output-readout",
      receptorKey: null,
      lengthBp: 1245,
      proteinLengthAa: null,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      derivedFrom: "pGP-CMV-GCaMP6f (Addgene #40755)",
      codonOptimizedForHumanExpression: null,
      shortDescription:
        "GCaMP6f CDS region used at the N-terminus of the reporting-module fusion. Intended AeroSense fluorescence readout.",
    },
    {
      id: "BBa_262WP16P",
      displayName: "RSET leader",
      category: "basic",
      biologicalRole: "n-terminal-leader",
      signalLayer: null,
      receptorKey: null,
      lengthBp: 105,
      proteinLengthAa: null,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      derivedFrom: "Inherited from pGP-CMV-GCaMP6f (Addgene #40755)",
      codonOptimizedForHumanExpression: null,
      shortDescription: "RSET leader CDS region inherited from the GCaMP6f parent plasmid.",
    },
    {
      id: "BBa_26E21OEQ",
      displayName: "(GGGGS)₃ linker",
      category: "basic",
      biologicalRole: "peptide-linker",
      signalLayer: null,
      receptorKey: null,
      lengthBp: 45,
      proteinLengthAa: 15,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      origin: "synthetic",
      codonOptimizedForHumanExpression: null,
      shortDescription:
        "Synthetic (GGGGS)₃ linker between N-terminal GCaMP6f and DmOrco in the reporting-module fusion.",
    },

    /* ---------- 2 reused existing Registry parts ---------- */
    {
      id: "BBa_K5490030",
      displayName: "EMCV IRES",
      category: "reused",
      biologicalRole: "ires",
      signalLayer: null,
      receptorKey: null,
      lengthBp: 587,
      proteinLengthAa: null,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      reuseRationale: "Byte-identical Registry match; referenced rather than duplicated.",
      codonOptimizedForHumanExpression: null,
      shortDescription:
        "Existing EMCV IRES part reused in every sensing-module composite for cap-independent mCherry translation.",
    },
    {
      id: "BBa_K4177005",
      displayName: "mCherry",
      category: "reused",
      biologicalRole: "expression-marker",
      signalLayer: "output-marker",
      receptorKey: null,
      lengthBp: 711,
      proteinLengthAa: null,
      inFinalPanel: true,
      firstGeneration: false,
      rfc1000: null,
      childIds: [],
      plasmidMap: null,
      reuseRationale: "Byte-identical Registry match; referenced rather than duplicated.",
      rejectedAlternateId: "BBa_25V0ZX3W",
      rejectedAlternateNote:
        "Registry part named “mCherry NLS” is sequence-identical to plain mCherry with no NLS. Not used.",
      codonOptimizedForHumanExpression: null,
      shortDescription:
        "Existing mCherry CDS reused as a transcription / IRES quality-control marker, not the measurement.",
    },
  ];

  var EXPECTED_SENSING = [
    ["BBa_26ZAGFK0", "Or7a-IRES-mCherry", "plasmid/Or7a_IRES_mCherry.png"],
    ["BBa_26WOX4B1", "Or22a-IRES-mCherry", "plasmid/Or22a_IRES_mCherry.png"],
    ["BBa_26LLF3LM", "Or35a-IRES-mCherry", "plasmid/Or35a_IRES_mCherry.png"],
    ["BBa_26Q1Q094", "Or42a-IRES-mCherry", "plasmid/Or42a_IRES_mCherry.png"],
    ["BBa_26Y7CI2H", "Or59b-IRES-mCherry", "plasmid/Or59b_IRES_mCherry.png"],
    ["BBa_265G8CE1", "Or67a-IRES-mCherry", "plasmid/Or67a_IRES_mCherry.png"],
    ["BBa_26K1TU11", "Or85b-IRES-mCherry", "plasmid/Or85b_IRES_mCherry.png"],
    ["BBa_26TZLBMJ", "Or98a-IRES-mCherry", "plasmid/Or98a_IRES_mCherry.png"],
    ["BBa_2629NIWH", "Or19a-IRES-mCherry", "plasmid/Or19a_IRES_mCherry.png"],
  ];

  var RFC1000_COMPATIBLE_IDS = [
    "BBa_26Q1Q094",
    "BBa_26Y7CI2H",
    "BBa_26K1TU11",
    "BBa_26TZLBMJ",
  ];

  var COLLECTION = {
    team: "AeroSense · NTHU iGEM 2026",
    source: "parts_content.md",
    registryPortalUrl: REGISTRY_PORTAL_URL,
    expectedCounts: {
      basic: 14,
      composite: 10,
      reused: 2,
      finalPanelSensingComposites: 9,
      reportingComposites: 1,
      firstGenerationBasic: 1,
    },
    backbone: "pcDNA3.1(+)",
    sensingArchitecture: SENSING_ARCHITECTURE,
    reportingArchitecture: REPORTING_ARCHITECTURE,
    hek293LiteratureSummary: LITERATURE_HEK293,
    signalLayers: [
      {
        id: "input",
        label: "Input (specificity)",
        parts: "Nine tuning odorant receptors",
        function:
          "Binds a distinct set of VOCs. The swappable element — changing the OR retargets the whole sensor.",
      },
      {
        id: "transduction",
        label: "Transduction",
        parts: "DmOrco",
        function:
          "Forms the ion-conducting pore with any tuning OR and chaperones it to the plasma membrane. Common to every cell line.",
      },
      {
        id: "output-readout",
        label: "Output (readout)",
        parts: "GCaMP6f",
        function:
          "Converts channel opening into a quantifiable fluorescence change — this is the intended fluorescence readout.",
      },
      {
        id: "output-marker",
        label: "Output (marker)",
        parts: "mCherry",
        function: "Reports transcription of the OR cassette. Quality control only, not the measurement.",
      },
    ],
    documentationNotes: [
      {
        id: "hek293-literature",
        title: "Published HEK293 evidence in this platform",
        body: LITERATURE_HEK293,
      },
      {
        id: "expression-not-detection",
        title: "Expression and channel function do not guarantee ligand detection",
        body:
          "Zboray et al. reported OR lines that expressed well and responded to the Orco agonist VUAA1 yet gave no VOC-specific response — including lines for Or7a and Or19a, two receptors in our panel. Receptor-level functional validation is a separate milestone, not an assumption.",
      },
      {
        id: "mcherry-reports",
        title: "What mCherry does and does not report",
        body:
          "In the bicistronic sensing modules, mCherry is translated from the same transcript but as a separate protein. Red fluorescence, if observed, reports transcription and IRES activity. It does not report receptor folding or trafficking to the plasma membrane. These constructs carry no epitope tag, so a calcium response — if obtained — would be the available evidence of receptor expression at the membrane. That assay is not reported on this page.",
      },
      {
        id: "mislabelled-mcherry-nls",
        title: "A Registry part is mislabelled",
        body:
          "BBa_25V0ZX3W is named “mCherry NLS”, but its sequence is identical to plain mCherry with no nuclear localisation signal present. AeroSense selected BBa_K4177005 instead.",
      },
    ],
    assemblyNotes: {
      cloningHostIntent: "seamless cloning into pcDNA3.1(+)",
      rfc1000CompatibleSensing: ["Or85b", "Or59b", "Or42a", "Or98a"],
      rfc1000ViolationCount: 7,
      avoidDiagnosticEnzyme: "PstI",
      recodingChoice:
        "RFC 1000 violations could be removed by synonymous substitutions; DNA was already synthesised, so recoding was not performed.",
    },
    sequenceVerification: {
      computationalChecks:
        "Reading frame, internal stop codons, Kozak context, domain boundaries and order, junction integrity, cloning-strategy sites, tandem repeats, and homopolymer runs.",
      flybaseIdentity:
        "All eleven codon-optimised coding sequences encode proteins identical to the FlyBase reference.",
      junctionSites:
        "Assembling the sub-parts creates no new restriction sites at any junction in any of the ten composites.",
      preOrderCorrections: [
        "promoterless backbone in an earlier design round",
        "tandem-repeat linker",
      ],
    },
    legacyConstructs: [
      {
        image: "plasmid/Or67b_IRES_mCherry_pTwist.png",
        relatedBasicId: "BBa_26ACVV3R",
        registeredCompositeId: null,
        inFinalCompositeCount: false,
        note:
          "First-generation Or67b–IRES–mCherry construct image on pTwist. No registered composite ID is given in parts_content.md, so this image is not a tenth/eleventh composite part.",
      },
    ],
    references: [
      {
        id: "ref-sato-2008",
        n: 1,
        text:
          "Sato K. et al. (2008) Insect olfactory receptors are heteromeric ligand-gated ion channels. Nature 452, 1002–1006. doi:10.1038/nature06850",
      },
      {
        id: "ref-roberts-2021",
        n: 2,
        text:
          "Roberts R.E., Yuvaraj J.K., Andersson M.N. (2021) Codon optimization of insect odorant receptor genes may increase their stable expression for functional characterization in HEK293 cells. Frontiers in Cellular Neuroscience 15, 744401. doi:10.3389/fncel.2021.744401",
      },
      {
        id: "ref-benton-2006",
        n: 3,
        text:
          "Benton R. et al. (2006) Atypical membrane topology and heteromeric function of Drosophila odorant receptors in vivo. PLoS Biology 4, e20. doi:10.1371/journal.pbio.0040020",
      },
      {
        id: "ref-butterwick-2018",
        n: 4,
        text:
          "Butterwick J.A. et al. (2018) Cryo-EM structure of the insect olfactory receptor Orco. Nature 560, 447–452. doi:10.1038/s41586-018-0420-8",
      },
      {
        id: "ref-zboray-2023",
        n: 5,
        text:
          "Zboray K. et al. (2023) High-throughput ligand profile characterization in novel cell lines expressing seven heterologous insect olfactory receptors for the detection of volatile plant biomarkers. Scientific Reports 13, 21757. doi:10.1038/s41598-023-47455-4",
      },
      {
        id: "ref-chen-2013",
        n: 6,
        text:
          "Chen T.-W. et al. (2013) Ultrasensitive fluorescent proteins for imaging neuronal activity. Nature 499, 295–300. doi:10.1038/nature12354",
      },
    ],
  };

  function applyDefaults(part) {
    if (!part.registryUrl) part.registryUrl = null;
    if (!part.parentIds) part.parentIds = [];
    if (!part.childIds) part.childIds = [];
    if (typeof part.rfc1000 === "undefined") part.rfc1000 = null;
    if (typeof part.plasmidMap === "undefined") part.plasmidMap = null;
    if (typeof part.characterization === "undefined") part.characterization = null;
    return part;
  }

  PARTS.forEach(applyDefaults);

  var BY_ID = {};
  PARTS.forEach(function (part) {
    BY_ID[part.id] = part;
  });

  PARTS.forEach(function (part) {
    part.childIds.forEach(function (childId) {
      var child = BY_ID[childId];
      if (!child) return;
      if (child.parentIds.indexOf(part.id) === -1) child.parentIds.push(part.id);
    });
  });

  function listByCategory(category) {
    return PARTS.filter(function (part) {
      return part.category === category;
    });
  }

  function getPart(id) {
    return BY_ID[id] || null;
  }

  function finalPanelSensing() {
    return PARTS.filter(function (part) {
      return part.category === "composite" && part.biologicalRole === "sensing-module" && part.inFinalPanel;
    });
  }

  function countOf(fn) {
    var n = 0;
    PARTS.forEach(function (part) {
      if (fn(part)) n += 1;
    });
    return n;
  }

  function addError(errors, message) {
    errors.push(message);
  }

  function validateCounts() {
    var errors = [];
    var basic = listByCategory("basic");
    var composite = listByCategory("composite");
    var reused = listByCategory("reused");
    var sensing = finalPanelSensing();
    var reporting = PARTS.filter(function (part) {
      return part.category === "composite" && part.biologicalRole === "reporting-module";
    });
    var firstGenBasic = PARTS.filter(function (part) {
      return part.category === "basic" && part.firstGeneration;
    });
    var rfcTrue = PARTS.filter(function (part) {
      return part.rfc1000 === true;
    });

    if (basic.length !== 14) addError(errors, "basic count " + basic.length + " !== 14");
    if (composite.length !== 10) addError(errors, "composite count " + composite.length + " !== 10");
    if (reused.length !== 2) addError(errors, "reused count " + reused.length + " !== 2");
    if (sensing.length !== 9) addError(errors, "final-panel sensing composites " + sensing.length + " !== 9");
    if (reporting.length !== 1) addError(errors, "reporting composites " + reporting.length + " !== 1");
    if (firstGenBasic.length !== 1) {
      addError(errors, "first-generation basic parts " + firstGenBasic.length + " !== 1");
    }

    var ids = {};
    PARTS.forEach(function (part) {
      if (ids[part.id]) addError(errors, "duplicate id " + part.id);
      ids[part.id] = true;
      if (part.registryUrl) {
        addError(errors, part.id + " has a registryUrl but no verified per-part URL scheme exists");
      }
    });

    EXPECTED_SENSING.forEach(function (row) {
      var part = BY_ID[row[0]];
      if (!part) {
        addError(errors, "missing sensing composite " + row[0]);
        return;
      }
      if (part.displayName !== row[1]) {
        addError(errors, row[0] + " name " + part.displayName + " !== " + row[1]);
      }
      if (part.plasmidMap !== row[2]) {
        addError(errors, row[0] + " map " + part.plasmidMap + " !== " + row[2]);
      }
      if (part.category !== "composite" || !part.inFinalPanel || part.firstGeneration) {
        addError(errors, row[0] + " is not a final-panel composite");
      }
      if (part.childIds.length !== 3) {
        addError(errors, row[0] + " should have 3 children (OR CDS, IRES, mCherry)");
      }
      if (part.childIds.indexOf("BBa_K5490030") === -1 || part.childIds.indexOf("BBa_K4177005") === -1) {
        addError(errors, row[0] + " missing reused IRES or mCherry child");
      }
    });

    var report = BY_ID["BBa_26E11Z80"];
    if (!report) addError(errors, "missing reporting composite BBa_26E11Z80");
    else {
      if (report.displayName !== "GCaMP6f-(GGGGS)3-DmOrco") {
        addError(errors, "reporting displayName mismatch");
      }
      if (report.plasmidMap !== "plasmid/GCaMP6f_GGGGSx3_DmOrco.png") {
        addError(errors, "reporting map mismatch");
      }
      if (report.childIds.join(",") !== "BBa_262WP16P,BBa_26QHYP02,BBa_26E21OEQ,BBa_26LWIKBQ") {
        addError(errors, "reporting children mismatch");
      }
    }

    var or67b = BY_ID["BBa_26ACVV3R"];
    if (!or67b) addError(errors, "missing Or67b basic part");
    else {
      if (or67b.category !== "basic") addError(errors, "Or67b must remain a basic part");
      if (or67b.inFinalPanel) addError(errors, "Or67b must not be in the final panel");
      if (!or67b.firstGeneration) addError(errors, "Or67b must be marked first-generation");
      if (or67b.plasmidMap !== "plasmid/Or67b_IRES_mCherry_pTwist.png") {
        addError(errors, "Or67b legacy map mismatch");
      }
    }

    var or67bAsComposite = PARTS.filter(function (part) {
      return part.category === "composite" && (part.receptorKey === "Or67b" || /Or67b/i.test(part.displayName));
    });
    if (or67bAsComposite.length) {
      addError(errors, "Or67b must not be counted as a composite part");
    }

    PARTS.forEach(function (part) {
      part.childIds.forEach(function (childId) {
        if (!BY_ID[childId]) addError(errors, part.id + " missing child " + childId);
      });
    });

    RFC1000_COMPATIBLE_IDS.forEach(function (id) {
      var part = BY_ID[id];
      if (!part || part.rfc1000 !== true) addError(errors, id + " should be RFC 1000 compatible");
    });
    if (rfcTrue.length !== 4) {
      addError(errors, "RFC 1000 compatible parts " + rfcTrue.length + " !== 4");
    }
    if (report && report.rfc1000 !== false) {
      addError(errors, "reporting composite should be RFC 1000 incompatible");
    }

    var vocOverlap = countOf(function (part) {
      return (
        part.category === "basic" &&
        part.inFinalPanel &&
        part.hek293Literature &&
        part.hek293Literature.status === HEK293_LITERATURE.vocResponsiveOverlap
      );
    });
    var vuaa1Only = countOf(function (part) {
      return (
        part.category === "basic" &&
        part.inFinalPanel &&
        part.hek293Literature &&
        part.hek293Literature.status === HEK293_LITERATURE.expressedVuaa1NoVoc
      );
    });
    if (vocOverlap !== 2) addError(errors, "VOC-responsive overlap CDS count " + vocOverlap + " !== 2");
    if (vuaa1Only !== 2) addError(errors, "VUAA1-only HEK293 CDS count " + vuaa1Only + " !== 2");

    return {
      ok: errors.length === 0,
      errors: errors,
      counts: {
        basic: basic.length,
        composite: composite.length,
        reused: reused.length,
        finalPanelSensingComposites: sensing.length,
        reportingComposites: reporting.length,
        firstGenerationBasic: firstGenBasic.length,
        rfc1000CompatibleComposites: rfcTrue.length,
        total: PARTS.length,
      },
    };
  }

  function validateAssets() {
    var missing = [];
    var checked = [];
    var fs;
    var path;
    try {
      fs = require("fs");
      path = require("path");
    } catch (err) {
      return { skipped: true, checked: checked, missing: missing };
    }

    var wikiRoot = path.join(__dirname, "..");
    function check(rel) {
      if (!rel) return;
      checked.push(rel);
      var abs = path.join(wikiRoot, rel.replace(/\//g, path.sep));
      if (!fs.existsSync(abs)) missing.push(rel);
    }

    PARTS.forEach(function (part) {
      check(part.plasmidMap);
    });
    COLLECTION.legacyConstructs.forEach(function (item) {
      check(item.image);
    });

    return { skipped: false, checked: checked, missing: missing };
  }

  function validate() {
    var counts = validateCounts();
    var assets = validateAssets();
    var errors = counts.errors.slice();
    if (!assets.skipped && assets.missing.length) {
      assets.missing.forEach(function (rel) {
        errors.push("missing asset " + rel);
      });
    }
    return {
      ok: errors.length === 0,
      errors: errors,
      counts: counts.counts,
      assets: assets,
      registry: {
        portalUrl: REGISTRY_PORTAL_URL,
        perPartUrlsAssigned: 0,
        perPartUrlSchemeVerified: false,
      },
    };
  }

  var api = {
    COLLECTION: COLLECTION,
    PARTS: PARTS,
    BY_ID: BY_ID,
    HEK293_LITERATURE: HEK293_LITERATURE,
    getPart: getPart,
    listByCategory: listByCategory,
    finalPanelSensing: finalPanelSensing,
    validateCounts: validateCounts,
    validateAssets: validateAssets,
    validate: validate,
  };

  root.AerosenseParts = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this);
