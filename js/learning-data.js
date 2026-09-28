/**
 * AeroSense Learning Lab — structured module catalog and ITEM_BANK.
 * Lesson copy, quizzes, and teaching numbers live here — not duplicated in HTML.
 *
 * Question IDs (item.id) are storage keys. Never rename an existing id.
 * Shared misconception IDs stay stable across tools:
 *   survey            — initial public diagnostic (wording match only; not stored here)
 *   game              — Odor Pixel Suite (G1/G2/G3 IDs live in the game repo, not this file)
 *   learning-platform — Learning Lab pre/post (this catalog)
 * Do not tag an item with a source unless that instrument actually uses the ID.
 * Keep the same item.id on pre-test and post-test. No backend yet.
 *
 * Adding a quiz item:
 *   1. Add an object to ITEM_BANK with a new stable id (SCREAMING_SNAKE).
 *   2. Include question, choices[{id,text}], correctAnswer, explanation.
 *   3. Push ITEM_BANK.YOUR_ID into the module’s quiz array (same array = pre and post).
 *   4. Do not put the keyed answer or explanation in Learn-section copy.
 *
 * Adding a new module:
 *   1. Copy a learning-0N-*.html shell; set data-learn-module and titles.
 *   2. Append a MODULES object (id matching the two-digit code, href, quiz, sections).
 *   3. Add that same id to IDS in js/learning-storage.js.
 *   4. Link it from learning-platform.html and education.html module lists.
 */
(function (root) {
  "use strict";

  var ITEM_SOURCES = ["survey", "game", "learning-platform"];

  var ITEM_BANK = {
    MYTH_MOLD_REMOVE: {
      id: "MYTH_MOLD_REMOVE",
      sources: ["survey", "learning-platform"],
      construct: "visible-mold-vs-remaining-food",
      question: "“If I remove the moldy part, the rest is always safe.” What is the most accurate evaluation?",
      choices: [
        {
          id: "a",
          text: "Always true: once the visible colony is gone, the remaining food has no chemical risk.",
        },
        {
          id: "b",
          text: "Not always. In many foods, growth and some metabolites can extend beyond the visible spot.",
        },
        {
          id: "c",
          text: "Visible mold is only cosmetic and never related to chemical contamination.",
        },
      ],
      correctAnswer: "b",
      explanation:
        "Removing a visible colony does not automatically make the rest of a food safe. In some firm foods, public guidance allows cutting away a margin; in soft, moist, or porous foods, mycelium and some mycotoxins can extend beyond what you see. “Always safe” is the over-claim.",
    },
    MYTH_HEAT_DESTROY: {
      id: "MYTH_HEAT_DESTROY",
      sources: ["survey", "learning-platform"],
      construct: "heating-vs-mycotoxin-stability",
      question: "“Heating completely removes all mycotoxin risk.” What is the most accurate evaluation?",
      choices: [
        {
          id: "a",
          text: "True: ordinary cooking destroys both molds and all mycotoxins.",
        },
        {
          id: "b",
          text: "False as a blanket claim. Heat may inactivate molds without eliminating heat-stable mycotoxins.",
        },
        {
          id: "c",
          text: "Heating converts any toxin into an odor that certifies the food as safe.",
        },
      ],
      correctAnswer: "b",
      explanation:
        "Killing or reducing mold is not the same as removing mycotoxins. Several mycotoxins of food-safety concern are relatively heat-stable under ordinary cooking. This lesson does not claim that no industrial process ever reduces any toxin — only that “heating completely removes all risk” is not a safe general rule.",
    },
    MYTH_LOOK_SMELL_SAFE: {
      id: "MYTH_LOOK_SMELL_SAFE",
      sources: ["survey", "learning-platform"],
      construct: "sensory-inspection-vs-mycotoxin-status",
      question: "If food looks and smells normal, can mycotoxin risk be ruled out?",
      choices: [
        {
          id: "a",
          text: "Yes. Normal appearance and smell prove there is no mycotoxin contamination.",
        },
        {
          id: "b",
          text: "No. Sensory inspection cannot establish mycotoxin status.",
        },
        {
          id: "c",
          text: "Yes, if the food has also been stored for less than one week.",
        },
      ],
      correctAnswer: "b",
      explanation:
        "Appearance and smell can miss contamination and can also over-read harmless variation. They are not a mycotoxin assay. Absence of an off-odor does not prove absence of toxin; presence of mold does not by itself quantify a toxin.",
    },
    SYN_SENSE_ELEMENT: {
      id: "SYN_SENSE_ELEMENT",
      sources: ["learning-platform"],
      construct: "biological-sensing-element",
      question: "What is AeroSense’s planned biological sensing element?",
      choices: [
        {
          id: "a",
          text: "Living HEK293T cells that express insect OR/Orco proteins and a calcium reporter.",
        },
        {
          id: "b",
          text: "A photodiode that binds odorant molecules in place of a receptor.",
        },
        {
          id: "c",
          text: "An AI classifier that is itself the living sensor.",
        },
      ],
      correctAnswer: "a",
      explanation:
        "The planned biological element is a living cell chassis (HEK293T) that expresses insect odorant receptors with Orco, plus a GCaMP-class reporter. Optics and AI sit downstream. They are not the receptor.",
    },
    SYN_GCAMP_ROLE: {
      id: "SYN_GCAMP_ROLE",
      sources: ["learning-platform"],
      construct: "gcamp-as-optical-reporter",
      question: "What role does GCaMP play in this sensing chain?",
      choices: [
        {
          id: "a",
          text: "It binds odorants instead of the olfactory receptor.",
        },
        {
          id: "b",
          text: "It reports a calcium change as fluorescence, which can then be measured optically.",
        },
        {
          id: "c",
          text: "It legally certifies food as safe once it glows.",
        },
      ],
      correctAnswer: "b",
      explanation:
        "GCaMP is a genetically encoded calcium indicator. In this design it converts a Ca²⁺ change that can follow receptor activation into a fluorescence readout. It does not bind the odorant in place of OR, and a glow is not a food certificate.",
    },
    SYN_CONTAINMENT: {
      id: "SYN_CONTAINMENT",
      sources: ["learning-platform"],
      construct: "living-sensor-containment",
      question: "Why is containment necessary for a living odor sensor?",
      choices: [
        {
          id: "a",
          text: "Engineered living cells should stay physically isolated from food, users, and the open environment.",
        },
        {
          id: "b",
          text: "Containment is optional if the cells look healthy under a microscope.",
        },
        {
          id: "c",
          text: "Containment exists so the AI can smell the room from outside the laboratory.",
        },
      ],
      correctAnswer: "a",
      explanation:
        "HEK293T cells engineered to express heterologous receptors are living genetically modified material. They belong behind a sealed cartridge or other containment concept, with responsible handling and waste. They should not contact the food being screened.",
    },
    DEC_PATTERN_CODE: {
      id: "DEC_PATTERN_CODE",
      sources: ["learning-platform"],
      construct: "odor-as-receptor-pattern",
      question: "A single odor is generally represented by what?",
      choices: [
        {
          id: "a",
          text: "A pattern of activity across multiple receptors, not one private switch.",
        },
        {
          id: "b",
          text: "A single dedicated receptor that fires only for that odor.",
        },
        {
          id: "c",
          text: "An AI confidence percentage that exists before any receptor responds.",
        },
      ],
      correctAnswer: "a",
      explanation:
        "Odor identity, when it can be recovered at all, is typically read from a combination of receptor responses. One channel is usually shared across odors; the row is the fingerprint.",
    },
    DEC_SPARSE_WHY: {
      id: "DEC_SPARSE_WHY",
      sources: ["learning-platform"],
      construct: "why-contrast-and-sparse",
      question: "Why use contrast enhancement or sparse representation in a pattern pipeline?",
      choices: [
        {
          id: "a",
          text: "They magically name the odor, so validation is unnecessary.",
        },
        {
          id: "b",
          text: "They can transform overlapping raw rows into representations that are easier for a later step to separate — still without proving a real model works.",
        },
        {
          id: "c",
          text: "They replace the need to measure anything at the receptor.",
        },
      ],
      correctAnswer: "b",
      explanation:
        "AL-like contrast and MB-like sparse codes are representation tools. They may make neighboring patterns easier to tell apart. Whether they help a real AeroSense model is an empirical question, not a property of the cartoon.",
    },
    DEC_AI_RELIABLE: {
      id: "DEC_AI_RELIABLE",
      sources: ["learning-platform"],
      construct: "ai-does-not-auto-validate",
      question: "Does AI automatically make a sensor result reliable?",
      choices: [
        {
          id: "a",
          text: "Yes. Once a classifier runs, the measurement quality no longer matters.",
        },
        {
          id: "b",
          text: "No. Model output depends on measurement quality, validation, and appropriate data.",
        },
        {
          id: "c",
          text: "Yes, if the interface prints a high-looking score.",
        },
      ],
      correctAnswer: "b",
      explanation:
        "A classifier can only interpret the information it receives. Poor calibration, missing controls, or the wrong training distribution still produce a number or a label. Reliability is demonstrated by measurement quality plus validation — not by the presence of AI.",
    },
    ACT_SCREENING_MEANS: {
      id: "ACT_SCREENING_MEANS",
      sources: ["learning-platform"],
      construct: "screening-not-verdict",
      question: "What does an AeroSense screening result represent?",
      choices: [
        {
          id: "a",
          text: "An early, incomplete clue that can guide the next action — not a legal safety certificate.",
        },
        {
          id: "b",
          text: "A direct measurement of mycotoxin concentration that replaces the laboratory.",
        },
        {
          id: "c",
          text: "A finished verdict that food may be released without any further thought.",
        },
      ],
      correctAnswer: "a",
      explanation:
        "As planned, AeroSense would screen odor-pattern change associated with fungal risk. That can help prioritize batches. It does not certify food as legally safe and does not quantify mycotoxin by itself.",
    },
    ACT_MEDIUM_TRIGGER: {
      id: "ACT_MEDIUM_TRIGGER",
      sources: ["learning-platform"],
      construct: "medium-risk-next-action",
      question: "What should a medium-risk screening result generally trigger?",
      choices: [
        {
          id: "a",
          text: "Automatic legal certification that the batch is safe to ignore.",
        },
        {
          id: "b",
          text: "A next action such as increased monitoring, retesting, or confirmatory analysis — not a pretend clearance.",
        },
        {
          id: "c",
          text: "Immediate public recall language, because medium already means a proven toxin.",
        },
      ],
      correctAnswer: "b",
      explanation:
        "Medium is a screening band, not a toxin assay. With good signal quality it usually justifies more attention — monitoring, retest, or confirmation — rather than “release and forget” or “treat as proven contamination.”",
    },
    ACT_REPLACE_CONFIRM: {
      id: "ACT_REPLACE_CONFIRM",
      sources: ["learning-platform"],
      construct: "screening-cannot-replace-confirmatory",
      question:
        "True or false: An early-warning sensing platform should automatically replace official confirmatory testing.",
      choices: [
        { id: "a", text: "True" },
        { id: "b", text: "False" },
      ],
      correctAnswer: "b",
      explanation:
        "False. Screening can flag, rank, and trigger confirmation. Official or validated confirmatory testing answers a different question. Replacing it automatically would over-claim what an early-warning platform can support.",
    },
    q1: {
      id: "q1",
      sources: ["learning-platform"],
      construct: "olfaction-first-detects-molecules",
      question: "What does the olfactory system first detect?",
      choices: [
        {
          id: "a",
          text: "Airborne chemical molecules interacting with receptors.",
        },
        {
          id: "b",
          text: "A finished odor name, such as “coffee,” formed before any molecule arrives.",
        },
        {
          id: "c",
          text: "A single exclusive receptor reserved for each familiar smell.",
        },
      ],
      correctAnswer: "a",
      explanation:
        "Odor perception begins when airborne chemical molecules reach receptor proteins. The later experience of a named smell is constructed from receptor and circuit activity; it is not what arrives first.",
    },
    q2: {
      id: "q2",
      sources: ["learning-platform"],
      construct: "combinatorial-receptor-coding",
      question: "How can a limited number of receptors represent many odors?",
      choices: [
        {
          id: "a",
          text: "Each odor occupies one private receptor that never overlaps with any other odor.",
        },
        {
          id: "b",
          text: "Different combinations, or patterns, of receptor activation.",
        },
        {
          id: "c",
          text: "Receptors wait until air temperature itself supplies an odor name.",
        },
      ],
      correctAnswer: "b",
      explanation:
        "Combinatorial receptor coding uses overlapping combinations. A compact receptor set can cover a large odor space because identity lives in the pattern across channels, not in a one-to-one private switch.",
    },
    q3: {
      id: "q3",
      sources: ["learning-platform"],
      construct: "odor-not-one-receptor",
      question: "True or false: An odor must activate exactly one receptor to be identified.",
      choices: [
        { id: "a", text: "True" },
        { id: "b", text: "False" },
      ],
      correctAnswer: "b",
      explanation:
        "False. Typical odorants activate more than one receptor type, and receptor types are shared across odors. Identification, when it occurs, is recovered from the combination — and even a sparse later code is still a pattern, not a single dedicated switch.",
    },
  };

  var MODULES = [
    {
      id: "01",
      slug: "smell",
      href: "learning-01-smell.html",
      number: "01",
      category: "Discover",
      title: "How do we smell?",
      shortTitle: "How We Smell",
      hook: "Your nose does not identify an odor with a single sensor. It reads a pattern.",
      duration: "~8 min",
      ready: true,
      objectives: [
        "Explain why odor perception begins with volatile molecules interacting with receptors.",
        "Explain combinatorial receptor coding.",
        "Describe why sparse neural representations can help distinguish similar odors.",
      ],
      teaching: {
        label: "Illustrative simulation",
        scale: "Normalized teaching scale (0–1). Not experimental measurements.",
        receptors: ["R1", "R2", "R3", "R4", "R5", "R6"],
        odors: [
          { id: "A", name: "Odor A", values: [0.82, 0.48, 0.28, 0.22, 0.7, 0.12] },
          { id: "B", name: "Odor B", values: [0.78, 0.45, 0.32, 0.26, 0.14, 0.68] },
          { id: "C", name: "Odor C", values: [0.1, 0.2, 0.88, 0.75, 0.18, 0.4] },
        ],
        noise: {
          A: [0.16, -0.12, 0.1, -0.08, 0.09, -0.14],
          B: [0.12, -0.1, 0.08, -0.11, 0.14, -0.07],
          C: [-0.09, 0.13, 0.07, -0.12, 0.1, 0.11],
        },
      },
      sections: [
        {
          id: "what-is-smell",
          heading: "What exactly is a smell?",
          paragraphs: [
            "A smell begins as chemistry in air. Airborne odorant molecules reach receptor proteins. Binding starts a signal. The experience of an odor is assembled later from that activity.",
            "Many odorants that reach the nose are volatile chemicals, including volatile organic compounds. This lesson does not treat every odor molecule as a VOC. The teaching point is simpler: molecules arrive first; perception is constructed afterward.",
          ],
          widget: "molecule-drift",
          ideaCard: "Molecules first. Perception later.",
          deeper:
            "Volatility describes how readily a molecule can leave a surface or mixture and travel in air to a receptor. AeroSense later asks about food-associated airborne patterns; that is a sensing question, not a claim that every odorant is a VOC or that perception equals a molecule name.",
        },
        {
          id: "one-odor",
          heading: "One odor ≠ one receptor",
          paragraphs: [
            "A limited receptor set can still cover many odors because each odor lights a combination of receptors, and those combinations overlap. One channel is shared; the row is not.",
            "The matrix below uses normalized teaching values on a 0–1 scale. It is an illustrative simulation, not a biological recording.",
          ],
          widget: "receptor-matrix",
          ideaCard: "The identity is encoded by the pattern, not one receptor alone.",
          deeper:
            "Combinatorial receptor coding means identity is read from which receptors are co-active. Broad tuning is expected: a receptor that responds to more than one odor is not a design failure. It is how a compact receptor family can represent a large odor space.",
        },
        {
          id: "sparse-codes",
          heading: "Why sparse patterns can help",
          paragraphs: [
            "Similar odors can produce overlapping receptor rows. A later stage can keep only a small active subset. That sparse code does not magically name the odor. It can make neighboring patterns easier for a downstream step to tell apart.",
            "Insect circuits are one biological example of this idea: receptor neurons feed the antennal lobe, then projection neurons, then mushroom-body Kenyon cells, which are typically sparsely active. The pathway in the activity is a teaching sketch, not an anatomical atlas and not AeroSense hardware.",
          ],
          widget: "",
          deeper:
            "Sparse coding is a representation strategy, not an identification algorithm. Whether a later classifier, a Kenyon-cell-like layer, or a human reader can separate two odors still depends on the remaining differences after the transform.",
        },
      ],
      interaction: {
        type: "odor-fingerprint",
        title: "Build an odor fingerprint",
        challenge:
          "Choose a fictional odor sample, inspect six receptor channels, add background noise, and switch among raw, contrast-enhanced, and sparse views. Then compare Odor A and Odor B.",
        explanation:
          "Raw rows can overlap. Contrast can sharpen differences. Sparse views keep a small active subset. None of these steps names the odor by itself; they change how separable the pattern can be.",
        disclaimer: "Conceptual simulation — not experimental AeroSense data.",
        compareCaption:
          "Sparse coding does not magically identify an odor. It can transform overlapping representations into patterns that are easier for downstream systems to separate.",
        patternCaption: "The identity is encoded by the pattern, not one receptor alone.",
      },
      quiz: [ITEM_BANK.q1, ITEM_BANK.q2, ITEM_BANK.q3],
      reflection:
        "After seeing overlapping raw rows and a sparser view, what would you now refuse to conclude from a single receptor channel?",
      takeaway: {
        sentence: "One odor is not one signal — it is a pattern.",
        canExplain: [
          "Why odor perception begins with airborne molecules interacting with receptors.",
          "How combinatorial receptor coding lets a limited receptor set represent many odors.",
          "Why a sparse later representation can make similar odors easier to separate, without naming them by itself.",
        ],
        nextPrompt: "Module 2 — When does mold become a food risk?",
      },
    },
    {
      id: "02",
      slug: "mold",
      href: "learning-02-mold.html",
      number: "02",
      category: "Question",
      theme: "casefile",
      eyebrow: "Food safety",
      title: "Mold, Mycotoxins, and the Risk You Cannot See",
      shortTitle: "Mold & Mycotoxins",
      heroTitle: "If it looks fine, is it safe?",
      heroTitleLines: ["If it looks fine,", "is it safe?"],
      hook: "Visible mold and chemical risk are not the same thing.",
      duration: "~8 min",
      ready: true,
      objectives: [
        "Distinguish mold growth from mycotoxin contamination.",
        "Identify why visual or smell-based inspection alone may be insufficient.",
        "Evaluate common food-safety claims using scientific evidence.",
      ],
      sections: [
        {
          id: "two-claims",
          heading: "Two claims, not one",
          paragraphs: [
            "Mold is a living fungus. Mycotoxins are chemical metabolites that some molds can produce. Seeing growth is not the same measurement as finding a toxin, and finding a toxin is not the same as smelling a change in air.",
            "This module investigates three common claims. It is not a panic guide and not a kitchen-diagnosis chart. The aim is to separate what a look, a sniff, or a heating step can support from what still needs a different kind of test.",
          ],
          widget: "method-strip",
          ideaCard: "Growth, odor-pattern change, and toxin status are related questions — they are not interchangeable answers.",
          deeper:
            "AeroSense later asks whether fungal metabolism can shift a volatile pattern in stored food. That is a screening question. It does not establish mycotoxin concentration and does not replace food-safety certification.",
        },
        {
          id: "myth-remove",
          heading: "Myth 01",
          widget: "myth-case",
          itemId: "MYTH_MOLD_REMOVE",
          myth: "If I remove the moldy part, the rest is always safe.",
          guessPrompt: "Your guess — is this claim true, false, or does it depend?",
          evidence: [
            "Visible colonies are the part you can see. Hyphae can grow into a food, and some mycotoxins can diffuse beyond the colony.",
            "For some firm foods, public guidance allows cutting away a generous margin. For soft, moist, or porous foods — bread, jams, soft cheeses, nuts — removing the spot is not a reliable clearance of the rest.",
          ],
          verdict:
            "The word “always” is the error. Food structure matters. Cutting is not a chemical assay.",
          action:
            "Do not generalize from one cheese rule to every food. Follow guidance for that food type. If mycotoxin status is the question, it still needs appropriate confirmatory testing — not a knife.",
          paragraphs: [],
          deeper: "",
        },
        {
          id: "myth-heat",
          heading: "Myth 02",
          widget: "myth-case",
          itemId: "MYTH_HEAT_DESTROY",
          myth: "Heating completely removes all mycotoxin risk.",
          guessPrompt: "Your guess — is this claim true, false, or does it depend?",
          evidence: [
            "Heat can reduce or kill molds. That is a biological claim about living cells.",
            "Several mycotoxins of food-safety concern are relatively heat-stable at ordinary cooking temperatures. Killing the organism does not automatically destroy the metabolite.",
          ],
          verdict:
            "False as a blanket rule. Heating is not a complete mycotoxin-removal step in the kitchen.",
          action:
            "Do not treat cooked-from-moldy as chemically cleared. This lesson does not say that no process ever reduces any toxin. It says “completely removes all risk” over-claims what household heating can support.",
          paragraphs: [],
          deeper: "",
        },
        {
          id: "myth-look",
          heading: "Myth 03",
          widget: "myth-case",
          itemId: "MYTH_LOOK_SMELL_SAFE",
          myth: "If food looks and smells normal, there is no mycotoxin risk.",
          guessPrompt: "Your guess — is this claim true, false, or does it depend?",
          evidence: [
            "Sensory inspection is fast and useful for obvious spoilage. It is still not a toxin measurement.",
            "Mycotoxin contamination can be uneven and is not guaranteed to produce an off-odor or a visible colony on the surface you inspected.",
          ],
          verdict:
            "False as a clearance rule. Normal look and smell cannot establish mycotoxin status — and visible mold does not, by itself, quantify a toxin either.",
          action:
            "Use look and smell as incomplete clues, not as a certificate. When chemical status matters, use an appropriate confirmatory test. An odor-pattern screen, if developed, would still not be that test.",
          paragraphs: [],
          deeper: "",
        },
        {
          id: "two-paths",
          heading: "Two paths that must stay separate",
          paragraphs: [
            "Fungal growth can change metabolism, and a volatile profile may shift. AeroSense is being designed to screen that odor-pattern change. Mycotoxin concentration is a different question and needs a different test.",
          ],
          widget: "claim-paths",
          deeper: "",
        },
      ],
      interaction: {
        type: "food-investigate",
        title: "Investigate the food",
        challenge:
          "A fictional batch of stored nuts. Inspect the exhibits, then decide what the evidence can support — without leaping to a toxin number.",
        explanation:
          "Appearance and smell alone cannot establish mycotoxin status. Storage notes can change how incomplete the file is. They still do not replace confirmatory testing.",
        disclaimer: "Fictional teaching scenario — not experimental AeroSense data and not a real batch record.",
        scenario: {
          name: "Stored nut batch · teaching file",
          setting: "Dried nuts held in a storeroom after several months.",
        },
        exhibits: [
          {
            id: "appearance",
            label: "Appearance",
            note: "Sampled nuts look largely uniform. No obvious discoloration on the inspected surface.",
          },
          {
            id: "smell",
            label: "Smell",
            note: "No strong off-odor is noted in this teaching sketch. A quiet smell is still not a chemical result.",
          },
          {
            id: "humidity",
            label: "Storage humidity",
            note: "Humidity is logged as elevated for this batch. That is a storage condition, not a toxin measurement.",
          },
          {
            id: "duration",
            label: "Storage duration",
            note: "The file lists several months in store. Time under poor conditions can raise a reason to assess further. It does not prove a toxin is present.",
          },
          {
            id: "mold",
            label: "Visible mold",
            note: "No colony is observed on the inspected surface. Absence of visible mold is not a mycotoxin clearance.",
          },
        ],
        prompt: "What would you conclude?",
        options: [
          { id: "safe", label: "Safe" },
          { id: "assess", label: "Needs further assessment" },
          { id: "unsafe", label: "Unsafe" },
        ],
        key: "assess",
        reveal:
          "Appearance and smell alone cannot establish mycotoxin status. In this file they look quiet; humidity and duration still leave the chemical question open. The supported conclusion is further assessment — not a safety certificate and not a toxin conviction.",
        feedback: {
          safe: "“Safe” over-reads a quiet look and smell. Those exhibits cannot close a mycotoxin question.",
          assess:
            "That matches what the file can support: incomplete sensory evidence, storage notes that justify more testing, and no toxin number.",
          unsafe:
            "“Unsafe” would also over-claim. This teaching file does not include a confirmatory mycotoxin result. The honest next step is further assessment, not a conviction.",
        },
      },
      quiz: [
        ITEM_BANK.MYTH_MOLD_REMOVE,
        ITEM_BANK.MYTH_HEAT_DESTROY,
        ITEM_BANK.MYTH_LOOK_SMELL_SAFE,
      ],
      reflection:
        "Which claim would you now refuse to treat as settled by look, smell, or a kitchen heating step?",
      takeaway: {
        sentence: "What you cannot see can still require measurement.",
        canExplain: [
          "Why mold growth is not the same claim as mycotoxin contamination.",
          "Why visual or smell-based inspection cannot establish mycotoxin status.",
          "Why AeroSense, as planned, would screen odor-pattern change and would not quantify mycotoxins or certify food as legally safe.",
        ],
        nextPrompt: "Can we engineer biology itself to sense those changes?",
      },
    },
    {
      id: "03",
      slug: "synbio",
      href: "learning-03-synbio.html",
      number: "03",
      category: "Build",
      theme: "bench",
      eyebrow: "Synthetic biology",
      title: "Building a Living Odor Sensor",
      shortTitle: "Living Sensor",
      heroTitle: "Can a cell learn to smell?",
      heroTitleLines: ["Can a cell", "learn to smell?"],
      hook: "We do not give a cell a nose. We give it molecular components that convert odor recognition into a measurable signal.",
      duration: "~8 min",
      ready: true,
      objectives: [
        "Explain the roles of OR, Orco and GCaMP in the AeroSense sensing chain.",
        "Predict what happens when one required component is removed.",
        "Recognize why containment and biosafety matter for a living sensor.",
      ],
      sections: [
        {
          id: "not-a-nose",
          heading: "Not a nose — a pathway",
          paragraphs: [
            "AeroSense does not transplant a fly’s nose into food. The plan is heterologous: selected insect odorant receptors, with Orco, expressed in HEK293T cells, with a GCaMP-class reporter that can turn a calcium change into light.",
            "That is an engineered information pathway. Fluorescence is still not a food verdict, and this lesson does not claim a working device in hand.",
          ],
          widget: "method-strip",
          steps: [
            "Odorant",
            "OR / Orco activation",
            "Ca²⁺ response",
            "GCaMP fluorescence",
            "Measurement",
          ],
          ideaCard: "Recognition happens at the receptor. Measurement happens after a reporter converts that event into a signal.",
          deeper:
            "Proposal-level assemblies keep construct details off the main path: Construct A is an OR–IRES–mCherry style expression cassette; Construct B is a GCaMP–Orco fusion style cassette. Exact maps, restriction sites, and cloning steps belong in Parts and Experiments — not here.",
        },
        {
          id: "three-parts",
          heading: "Three molecules, three jobs",
          paragraphs: [
            "OR recognizes odorant. Orco partners with insect ORs so the receptor can function as a ligand-gated ion channel in this heterologous plan. GCaMP reports a calcium change as fluorescence.",
            "mCherry, when used, is an expression marker — a way to see that a construct is present — not the odor-to-light conversion. A photodiode reads light outside the cell. An AI classifier, if used, sits even later, in computation.",
          ],
          widget: "",
          deeper:
            "Published HEK insect-OR panels that combine Orco and GCaMP motivate this architecture. They are starting points, not drop-in proof that AeroSense DNA already works in the team’s hands.",
        },
      ],
      interaction: {
        type: "sensor-bench",
        title: "Build the sensor",
        challenge:
          "Assemble the minimum biological sensing chain, then park the detector and the classifier in the right layers. Tap a part, then tap a zone. Drag works on a pointer too.",
        explanation:
          "HEK293T, OR, Orco, and GCaMP belong in the cell. The photodiode belongs in readout, outside the cell. The AI classifier belongs in computation. mCherry can ride in the cell as an expression reporter; it is not required for the odor-to-fluorescence conversion.",
        disclaimer: "Conceptual assembly — not experimental AeroSense data and not a plasmid map.",
        parts: [
          {
            id: "hek",
            label: "HEK293T",
            role: "Living chassis that hosts the proteins.",
          },
          {
            id: "or",
            label: "OR",
            role: "Olfactory receptor. Binds odorant in this design.",
          },
          {
            id: "orco",
            label: "Orco",
            role: "Co-receptor. Insect ORs typically need Orco to form a functional channel here.",
          },
          {
            id: "gcamp",
            label: "GCaMP",
            role: "Calcium reporter. Converts a Ca²⁺ change into fluorescence.",
          },
          {
            id: "mcherry",
            label: "mCherry",
            role: "Expression reporter. Useful, not the core sensing conversion.",
          },
          {
            id: "diode",
            label: "Photodiode",
            role: "Optical detector. Reads light outside the cell.",
          },
          {
            id: "ai",
            label: "AI classifier",
            role: "Later computation. Reads a pattern; it is not a protein in the cell.",
          },
        ],
        zones: [
          { id: "cell", label: "Cell", hint: "Living sensing biology" },
          { id: "readout", label: "Readout", hint: "Optical detection, outside the cell" },
          { id: "computation", label: "Computation", hint: "Pattern reading after measurement" },
        ],
        coreCell: ["hek", "or", "orco", "gcamp"],
        readout: ["diode"],
        computation: ["ai"],
        optionalCell: ["mcherry"],
      },
      quiz: [
        ITEM_BANK.SYN_SENSE_ELEMENT,
        ITEM_BANK.SYN_GCAMP_ROLE,
        ITEM_BANK.SYN_CONTAINMENT,
      ],
      reflection:
        "Which missing part would you now refuse to ignore — OR, Orco, GCaMP, or the containment barrier?",
      takeaway: {
        sentence: "Synthetic biology turns molecular recognition into an engineered information pathway.",
        canExplain: [
          "What OR, Orco, and GCaMP each contribute in the planned sensing chain.",
          "What fails conceptually if OR, Orco, or GCaMP is removed.",
          "Why engineered cells should not contact the food being screened.",
        ],
        nextPrompt: "Now that a cell generates a signal, how do we read a complex odor pattern?",
      },
    },
    {
      id: "04",
      slug: "decode",
      href: "learning-04-decode.html",
      number: "04",
      category: "Decode",
      theme: "decode",
      eyebrow: "Neuromorphic computing",
      title: "Decoding an Odor Fingerprint",
      shortTitle: "Decoding Odors",
      heroTitle: "An odor is a pattern",
      heroTitleLines: ["An odor", "is a pattern"],
      hook: "When multiple receptors respond at once, the challenge changes from sensing a signal to interpreting a pattern.",
      duration: "~8 min",
      ready: true,
      objectives: [
        "Interpret a multi-receptor response fingerprint.",
        "Explain conceptually how contrast enhancement and sparse coding can transform a representation.",
        "Evaluate why classification requires validation and uncertainty awareness.",
      ],
      teaching: {
        label: "Illustrative educational classifier",
        receptors: ["R1", "R2", "R3", "R4", "R5", "R6"],
        samples: [
          { id: "A", name: "Sample A", values: [0.82, 0.48, 0.28, 0.22, 0.7, 0.12] },
          { id: "B", name: "Sample B", values: [0.78, 0.45, 0.32, 0.26, 0.14, 0.68] },
          { id: "M", name: "Mixture", values: [0.8, 0.465, 0.3, 0.24, 0.42, 0.4] },
        ],
        noise: {
          A: [0.16, -0.12, 0.1, -0.08, 0.09, -0.14],
          B: [0.12, -0.1, 0.08, -0.11, 0.14, -0.07],
          M: [0.11, 0.09, -0.12, 0.1, -0.13, 0.08],
        },
      },
      sections: [
        {
          id: "signal-to-pattern",
          heading: "From a signal to a fingerprint",
          paragraphs: [
            "One receptor channel is a measurement. Several channels together are a fingerprint. That is why a mixture is hard: the row can sit between two references without belonging cleanly to either.",
            "This module is an educational simulation. It is not the AeroSense model, and it does not report experimental accuracy.",
          ],
          widget: "method-strip",
          steps: ["Raw input", "AL-like contrast", "MB-like sparse code", "Teaching comparison"],
          ideaCard: "A label is a claim about a pattern. It is not proof that the upstream measurement was good.",
          deeper:
            "Insect-inspired pipelines often use an antennal-lobe-like contrast step and a mushroom-body-like sparse projection before a later readout. AeroSense may test whether those stages help. That test has to be empirical. This canvas cannot substitute for it.",
        },
        {
          id: "upstream",
          heading: "The model is not the first step",
          paragraphs: [
            "A classifier sits at the end of a chain: biology reports fluorescence, hardware turns that into a calibrated signal, a model builds a representation, and a person sees risk information. If the first steps are noisy or unvalidated, the last step still produces a label.",
          ],
          widget: "signal-path",
          deeper:
            "Ablation — turning a processing step off — is how engineers ask whether that step contributed. A prettier sparse picture in this lesson is not a published performance result.",
        },
      ],
      interaction: {
        type: "pattern-lab",
        title: "Odor pattern lab",
        challenge:
          "Select Sample A, Sample B, or a mixture. Watch raw, contrast-enhanced, and sparse views. Add noise and switch ablation modes. The output is a teaching resemblance, not a model score.",
        explanation:
          "Sparse coding and contrast can make overlapping rows easier to tell apart in this sketch. Whether they help a real decoder still has to be shown with real measurements and validation.",
        disclaimer: "Conceptual simulation — not the AeroSense model and not experimental data.",
      },
      quiz: [
        ITEM_BANK.DEC_PATTERN_CODE,
        ITEM_BANK.DEC_SPARSE_WHY,
        ITEM_BANK.DEC_AI_RELIABLE,
      ],
      reflection:
        "After seeing an ambiguous mixture, what would you now refuse to conclude from a confident-looking label?",
      takeaway: {
        sentence: "AI cannot rescue bad measurements — it can only interpret the information it receives.",
        canExplain: [
          "Why an odor is generally a multi-receptor pattern.",
          "What contrast enhancement and sparse coding are for, without treating them as identification.",
          "Why a classifier still depends on measurement quality, validation, and appropriate data.",
        ],
        nextPrompt: "What should a person actually do with the result?",
      },
    },
    {
      id: "05",
      slug: "act",
      href: "learning-05-act.html",
      number: "05",
      category: "Decide",
      theme: "qc",
      capstone: true,
      eyebrow: "Responsible application",
      title: "From Signal to Responsible Decision",
      shortTitle: "Responsible Decisions",
      heroTitle: "A signal is not a verdict",
      heroTitleLines: ["A signal", "is not a verdict"],
      hook: "The hardest part of sensing is not producing a number. It is deciding what that number is allowed to mean.",
      duration: "~8 min",
      ready: true,
      objectives: [
        "Distinguish screening from confirmatory testing.",
        "Interpret low / medium / high risk outputs cautiously.",
        "Explain false positives, false negatives and why uncertainty changes decisions.",
      ],
      sections: [
        {
          id: "screening-vs-confirm",
          heading: "Screening is not confirmation",
          paragraphs: [
            "You are no longer only a learner. In this module you sit as a QC manager. A screening band can change what you do next. It cannot finish the chemical or legal question.",
            "Low, medium, and high are action prompts. They are not mycotoxin concentrations and not a release stamp.",
          ],
          widget: "bounds-card",
          ideaCard: "Use the screen to choose the next test or hold — not to replace the test.",
          deeper:
            "Confirmatory assays, when they exist, are designed to answer a defined analyte question under a method. An odor-pattern screen is a different measurement. Mixing those claims is how early-warning language becomes over-claim.",
        },
        {
          id: "errors",
          heading: "Two ways to be wrong",
          paragraphs: [
            "A false negative can miss a batch that deserved more scrutiny. A false positive can send extra samples to confirmation, hold product, or create waste. Which error is costlier is a policy choice, not a universal number this lesson can invent.",
          ],
          widget: "confusion-matrix",
          deeper:
            "If missing a dangerous batch is much more costly than sending one extra sample for confirmation, a team may choose a more sensitive operating point. That is a documented tradeoff. It is not a hidden accuracy percentage.",
        },
      ],
      interaction: {
        type: "qc-desk",
        title: "You are the QC manager",
        challenge:
          "Four fictional batches. Read screening band, signal quality, confidence, history, and storage. Choose a next action. There is not one correct stamp for every file.",
        explanation:
          "Screening should guide the next action. It should not pretend to replace confirmatory analysis, and a poor-quality signal should not be treated as a finished risk number.",
        disclaimer: "Fictional QC files — not experimental AeroSense data and not a real warehouse record.",
        actions: [
          { id: "release", label: "Release normally" },
          { id: "monitor", label: "Increase monitoring" },
          { id: "retest", label: "Retest" },
          { id: "isolate", label: "Isolate batch" },
          { id: "confirm", label: "Send for confirmatory testing" },
          { id: "discard", label: "Discard immediately" },
        ],
        batches: [
          {
            id: "A",
            name: "Batch A",
            risk: "Low risk",
            quality: "Good signal quality",
            confidence: "Stable teaching band",
            history: "No prior flags in this file",
            storage: "Cool, dry store logged",
            defensible: ["release", "monitor"],
            stretch: ["retest"],
            over: ["discard", "isolate"],
            under: [],
            note: "A quiet, good-quality low band can support routine release or slightly tighter watching. It still is not a legal certificate. Immediate discard would treat a screen as a toxin assay.",
          },
          {
            id: "B",
            name: "Batch B",
            risk: "Medium risk",
            quality: "Good signal quality",
            confidence: "Band is resolved enough to act on",
            history: "First medium flag this month",
            storage: "Humidity logged as moderate",
            defensible: ["monitor", "retest", "confirm"],
            stretch: ["isolate"],
            over: ["discard"],
            under: ["release"],
            note: "Medium with a good signal usually means more attention: watch, retest, or confirm. Releasing as if cleared under-reads the screen. Discarding as if the toxin were proven over-reads it.",
          },
          {
            id: "C",
            name: "Batch C",
            risk: "High risk",
            quality: "Good signal quality",
            confidence: "Band is strong in this teaching file",
            history: "Second high flag on the same silo",
            storage: "Warm store, longer dwell",
            defensible: ["isolate", "confirm", "retest"],
            stretch: ["discard"],
            over: [],
            under: ["release", "monitor"],
            note: "High plus good quality justifies hold-and-confirm, not a shrug. Discard can be an operational choice, but this file still has not measured a mycotoxin. Release would ignore the screen.",
          },
          {
            id: "D",
            name: "Batch D",
            risk: "Medium risk",
            quality: "Poor signal quality",
            confidence: "Unstable — treat the band as incomplete",
            history: "Reader flagged a weak optical lock",
            storage: "Same store as Batch B",
            defensible: ["retest", "confirm"],
            stretch: ["isolate", "monitor"],
            over: ["discard"],
            under: ["release"],
            note: "Poor quality means the medium label is not ready to spend. Retest or confirm. Do not release on a weak lock, and do not discard as if a toxin were proven by a bad measurement.",
          },
        ],
      },
      feedback: {
        id: "ACT_TRUST_INFO",
        question: "What information would you need before trusting an early-warning result?",
        allowMultiple: true,
        options: [
          { id: "signal-quality", label: "Signal quality" },
          { id: "confidence", label: "Confidence" },
          { id: "trend-history", label: "Trend / history" },
          { id: "reason-for-warning", label: "Reason for warning" },
          { id: "recommended-next-action", label: "Recommended next action" },
          { id: "confirmatory-pathway", label: "Confirmatory-test pathway" },
          { id: "other", label: "Other" },
        ],
      },
      quiz: [
        ITEM_BANK.ACT_SCREENING_MEANS,
        ITEM_BANK.ACT_MEDIUM_TRIGGER,
        ITEM_BANK.ACT_REPLACE_CONFIRM,
      ],
      reflection:
        "If missing a dangerous batch is much more costly than sending one additional sample for confirmation, should the decision threshold stay the same? Write a short policy note — not a fake accuracy number.",
      takeaway: {
        sentence:
          "Responsible sensing means knowing both what your system detects and what it cannot conclude.",
        canExplain: [
          "The difference between screening and confirmatory testing.",
          "Why low, medium, and high bands change the next action rather than ending the question.",
          "How false positives, false negatives, and poor signal quality should change a QC decision.",
        ],
        completeLine: "You completed: From Nose → Biosensor → Decision",
      },
    },
  ];

  function getModule(id) {
    var i;
    for (i = 0; i < MODULES.length; i += 1) {
      if (MODULES[i].id === id) return MODULES[i];
    }
    return null;
  }

  function nextModule(id) {
    var i;
    for (i = 0; i < MODULES.length; i += 1) {
      if (MODULES[i].id === id) return MODULES[i + 1] || null;
    }
    return null;
  }

  root.AerosenseLearn = root.AerosenseLearn || {};
  root.AerosenseLearn.MODULES = MODULES;
  root.AerosenseLearn.getModule = getModule;
  root.AerosenseLearn.nextModule = nextModule;
  root.AerosenseLearn.ITEM_BANK = ITEM_BANK;
  root.AerosenseLearn.ITEM_SOURCES = ITEM_SOURCES;
})(window);
