/* Authored reading questions, keyed to existing wiki section IDs.
   Answers summarize the cited page; they do not generate claims or collect data.
   A missing tuple href means the question's own page and section. */
(() => {
  'use strict';
  const pages = {
    'index.html': {
      '*': [
        ['What is the problem AeroSense is trying to solve?', 'Odor chemistry can change before deterioration becomes visible. AeroSense connects living receptors, fluorescence readout, and pattern decoding to support earlier screening decisions.', 'description.html#the-problem'],
        ['Are the glowing food scenes actual measurements?', 'The film is a conceptual visualization. Experimental observations and their interpretation are reported separately on Results.', 'results.html#evidence-overview'],
        ['Does a screening result mean that food is safe?', 'AeroSense is positioned as a screening layer. It can prompt further investigation; it is not a standalone food-safety or mycotoxin verdict.', 'description.html#is-and-is-not']
      ],
      'home-film': [
        ['Why does this wiki look so incredible?', 'Pin-Che: I know, right? Haha, thank you! Come for the science, stay for the tiny details. Peek at Engineering’s Wiki Design section to see how the little touches came together.', 'engineering.html#wiki-design'],
        ['What does the revealed glow represent?', 'It visualizes otherwise invisible odor-pattern changes. The glow is part of the story, not a measurement of contamination in the pictured food.'],
        ['What changes when I click the product?', 'The product activates the film’s sensing view: the paired scene reveals conceptual odor cues around your cursor. The two views share the same story timeline.']
      ],
      'intro': [
        ['Is the fruit fly itself the sensor?', 'The fly provides the biological inspiration. The proposed sensor uses engineered cells expressing insect odorant receptors.', 'design.html#how-aerosense-senses'],
        ['Why combine biology with electronics?', 'In the proposed chain, cells translate receptor activation into fluorescence. The reader is designed to measure that weak signal for pattern decoding.', 'description.html#pipeline']
      ],
      'signal-wordmark': [
        ['Why does this wiki look so incredible?', 'Pin-Che: I know, right? Haha, thank you! Come for the science, stay for the tiny details. Peek at Engineering’s Wiki Design section to see how the little touches came together.', 'engineering.html#wiki-design'],
        ['Why is a fruit fly part of the identity?', 'Both receptor-based sensing and the decoding architecture draw inspiration from insect olfaction. They contribute different layers to AeroSense.', 'description.html#why-olfaction'],
        ['Does the animated fly represent an experiment?', 'It is a visual guide through the project. Scientific observations, engineering simulations, and conceptual illustrations have separate roles on the wiki.', 'description.html#evidence-ladder']
      ],
      'explore': [
        ['Why does this wiki look so incredible?', 'Pin-Che: I know, right? Haha, thank you! Come for the science, stay for the tiny details. Peek at Engineering’s Wiki Design section to see how the little touches came together.', 'engineering.html#wiki-design'],
        ['How do the four workstreams depend on each other?', 'Wet Lab designs the biological response, Hardware measures light, Model interprets patterns, and Human Practices shapes useful and responsible decisions.'],
        ['Which result establishes the whole system?', 'A result from one layer does not validate the entire chain. Description explains the dependencies, and the individual evidence pages report their scope.', 'description.html#evidence-ladder']
      ],
      'watch': [
        ['Is this film the scientific evidence?', 'The film introduces the project story. Results and the technical pages provide the observations, methods, and analyses behind the research.', 'results.html'],
        ['What should I read after the film?', 'Description connects the initial fluorescence observation to the proposed sensing, readout, and decoding chain.', 'description.html#lightsheet-observation']
      ],
      'experience': [
        ['Why does this wiki look so incredible?', 'Pin-Che: I know, right? Haha, thank you! Come for the science, stay for the tiny details. Peek at Engineering’s Wiki Design section to see how the little touches came together.', 'engineering.html#wiki-design'],
        ['What should the 3D journey teach me?', 'It traces a conceptual signal from odor source to receptor, reader, and decoder. It illustrates the architecture rather than simulating a biological experiment.', 'description.html#follow-the-signal'],
        ['What is different about the games and the research?', 'The games teach odor coding as a pattern. Their availability demonstrates an educational resource, not measured learning gains or sensor accuracy.', 'education.html#track-b']
      ],
      'team': [
        ['Why does this wiki look so incredible?', 'Pin-Che: I know, right? Haha, thank you! Come for the science, stay for the tiny details. Peek at Engineering’s Wiki Design section to see how the little touches came together.', 'engineering.html#wiki-design'],
        ['Does everyone work on just one layer?', 'The team index shows overlapping workstreams where applicable. Individual roles and contributions are documented separately.', 'members.html#student-team'],
        ['How are outside contributions credited?', 'Attributions distinguishes student work, advisor support, external services, reused work, and media or software credits.', 'attributions.html#student-work']
      ],
      'journey': [
        ['Why does this wiki look so incredible?', 'Pin-Che: I know, right? Haha, thank you! Come for the science, stay for the tiny details. Peek at Engineering’s Wiki Design section to see how the little touches came together.', 'engineering.html#wiki-design'],
        ['Does the calendar contain completed work only?', 'Notebook distinguishes dated records from future work and goals. Workstream filters do not turn a planned entry into a completed experiment.', 'notebook.html#chronicle-views'],
        ['How do I connect a date to a design decision?', 'Notebook gives the chronology; Engineering records the evidence, learning, and redesign associated with each cycle.', 'engineering.html#engineering-cycles']
      ],
      'partners': [
        ['Does a logo mean a product was validated?', 'Support and collaboration are different from experimental validation. The contribution record explains what each organization actually provided.', 'attributions.html#external'],
        ['Which conversations changed the project?', 'Integrated Human Practices follows checkpoints where external feedback changed the target, buyer, claim boundary, or technical approach.', 'human-practices.html#road']
      ]
    },
    'description.html': {
      '*': [
        ['What is the shortest accurate explanation of AeroSense?', 'An engineered receptor panel is intended to turn odor-dependent calcium responses into fluorescence, which a dedicated reader measures and a decoder interprets.', 'description.html#pipeline'],
        ['Is this a direct mycotoxin measurement?', 'No. VOC-pattern screening and direct toxin quantification are different claims. AeroSense is framed as a cue for follow-up decisions.', 'description.html#is-and-is-not'],
        ['What observation started this design?', 'The light-sheet recording showed regional fluorescence changes around three odor presentations in a fly preparation, motivating the measurement-chain question.', 'description.html#lightsheet-observation']
      ],
      'glance': [
        ['What actually flows between the four steps?', 'The intended chain connects an odor cue to a cellular optical response, an electronic measurement, a pattern interpretation, and a human decision.', 'description.html#pipeline'],
        ['Where does biology end and computation begin?', 'In the design, biology produces fluorescence, hardware measures it, and computation interprets the response pattern. Each interface has its own evidence requirements.', 'description.html#pipeline']
      ],
      'the-problem': [
        ['Why look for odors before visible spoilage?', 'Fungi and deteriorating materials release VOC mixtures that can change with growth and conditions. The project investigates these as earlier screening cues.'],
        ['Can one odor identify every spoiled food?', 'No universal single-odor rule is proposed. VOC patterns depend on organisms, substrates, growth stage, and environmental conditions.']
      ],
      'why-olfaction': [
        ['Why use several receptors instead of one specific detector?', 'Biological olfaction represents odors through combinations of receptor activity. A panel provides a response pattern for downstream discrimination.'],
        ['What does Orco add to a tuning receptor?', 'The tuning OR contributes odor recognition; Orco is its conserved channel partner. Their activation links recognition to ion entry.', 'design.html#how-aerosense-senses']
      ],
      'lightsheet-observation': [
        ['Is this the engineered cell sensor responding?', 'The recordings are from a fly preparation. They motivated AeroSense but are not a functional validation of the engineered OR/Orco–GCaMP6f cell sensor.'],
        ['Which odors were presented in the recording?', 'The record includes isopentyl acetate, 3-octanol, and 4-methylcyclohexanol. Selected regional traces illustrate fluorescence changes around those presentations.']
      ],
      'follow-the-signal': [
        ['Does entering the fly mean AeroSense measures inside a fly?', 'No. The perspective change is a storytelling device. The later engineered cell, optical reader, and decoder are separate parts of the proposed system.'],
        ['Are the journey’s particles and scores scientific data?', 'They are interactive teaching elements. They do not represent measured molecule counts, receptor kinetics, or experimental accuracy.']
      ],
      'pipeline': [
        ['Why is the final step a decision rather than a diagnosis?', 'A screening pattern can identify a batch needing attention. Confirmatory testing and the responsible operator determine the subsequent action.'],
        ['Why can’t fluorescence alone be the answer?', 'A fluorescence change needs controls, calibrated readout, and interpretation in context. Brightness by itself does not establish odor identity or food safety.']
      ],
      'prior-work': [
        ['Which part is AeroSense’s contribution?', 'The page separates established receptor, reporter, optical, and computational ideas from AeroSense-specific integration and engineering decisions.'],
        ['Does using a published method transfer its performance to this device?', 'No. A literature method can motivate design, but its performance is not a result measured on AeroSense.']
      ],
      'evidence-ladder': [
        ['Why separate sequence, expression, and function?', 'They answer different questions: whether the construct is correct, whether it is expressed, and whether the intended biological response occurs.'],
        ['Can a successful model benchmark validate the sensor?', 'No. A decoding benchmark depends on its input data and evaluation protocol; it does not establish the biological or optical layer’s performance.']
      ],
      'human-practices': [
        ['How did feedback change the original idea?', 'Feedback narrowed the application and clarified what the output should mean, moving away from a general-purpose sensing story toward a specific screening decision.'],
        ['What makes this integration rather than a list of interviews?', 'The Human Practices record links external input to concrete changes in the project’s target, buyer, claims, and design constraints.', 'human-practices.html#road']
      ],
      'is-and-is-not': [
        ['Can a low signal clear food for consumption?', 'A screening output is not a standalone food-safety clearance. The page defines the need for follow-up and the limits of the proposed use.'],
        ['Would the engineered cells touch food?', 'The field-facing concept requires physical containment of the engineered sensing element and separation from food, users, and the environment.']
      ],
      'next-steps': [
        ['Which experiments connect the layers?', 'The stated sequence links controlled OR/Orco–GCaMP responses, calibrated optical readout, and project-relevant data for decoding.'],
        ['Why calibrate light before using living-cell fluorescence?', 'A controlled optical input helps separate reader behavior from biological variability when the layers are connected.', 'hardware.html#validation-boundary']
      ],
      'continue-exploring': [
        ['How are Design and Results different?', 'Design explains the architecture and rationale. Results presents observations and their interpretation. Methods are maintained on Experiments.'],
        ['Where can I inspect why the architecture changed?', 'Engineering preserves the design–build–test–learn–redesign records instead of repeating only the final architecture.', 'engineering.html#engineering-cycles']
      ]
    },
    'design.html': {
      '*': [
        ['Why are recognition and reporting separate modules?', 'One shared Orco–GCaMP6f reporting module can pair with each tuning OR, keeping the intended receptor identity change explicit.', 'design.html#current-architecture'],
        ['What makes the green reporter light up?', 'GCaMP6f reports calcium-dependent fluorescence changes downstream of OR–Orco channel activation.', 'design.html#how-aerosense-senses'],
        ['Does red fluorescence mean an odor was detected?', 'mCherry is an expression marker. It is not the calcium-responsive signal used to interpret receptor activation.', 'design.html#assay-design']
      ],
      'design-requirements': [
        ['Why does the design emphasize comparability?', 'The goal is a receptor-response vector, so differences between channels should reflect receptor behavior rather than inconsistent expression context.'],
        ['Why are there ten plasmids for nine tuning receptors?', 'Nine plasmids provide interchangeable OR sensing modules. The tenth provides the shared GCaMP6f–Orco reporting module.']
      ],
      'how-aerosense-senses': [
        ['Is OR–Orco a GPCR pathway?', 'The cited insect OR–Orco complex is a heteromeric ligand-gated ion channel, rather than a GPCR signaling cascade.'],
        ['How does receptor activation become an optical signal?', 'Channel activation permits calcium entry. The calcium-responsive GCaMP6f reporter translates that change into a green fluorescence response.']
      ],
      'current-architecture': [
        ['What stays constant when the tuning receptor changes?', 'The shared reporting module and expression context remain the comparison framework; the tuning OR supplies the intended specificity change.'],
        ['Does the construct map prove the sensor works?', 'A map describes the intended genetic architecture. Sequence verification, expression, and functional measurements are separate evidence steps.', 'design.html#verification']
      ],
      'receptor-panel': [
        ['Why standardize the vector and reporter?', 'Shared expression context helps make receptor identity the intended biological variable when comparing responses across the panel.'],
        ['Were all nine receptors characterized in the cited platform?', 'The page identifies Or85b and Or98a as overlapping with the receptors characterized by Zboray and colleagues; it does not assign published platform validation to all nine.']
      ],
      'reporter-topology': [
        ['Why put GCaMP6f at Orco’s N-terminus?', 'The placement follows published receptor topology so the calcium reporter is oriented toward the intracellular signal.'],
        ['Is the fusion equivalent to separately expressing both proteins?', 'Fusion and bicistronic expression impose different architectures. Engineering records the redesign; the reporter’s intended function still requires its own evidence.']
      ],
      'shared-backbone': [
        ['Why use the same backbone for all plasmids?', 'The shared pcDNA3.1(+) context simplifies cloning, sequencing, selection, and interpretation across constructs.'],
        ['Are HEK293 and HEK293T interchangeable in every claim?', 'The page distinguishes general heterologous expression in HEK293 from the SV40-origin context associated with HEK293T. Host-specific claims should retain that distinction.']
      ],
      'assay-design': [
        ['Why include a vehicle control?', 'A matched vehicle condition helps separate the stimulus response from injection, solvent, and other non-target effects.'],
        ['Why use VUAA1 as well as a target odor?', 'VUAA1 provides an Orco-related functional reference before interpreting a tuning receptor’s response to the target VOC.', 'experiments.html#expression-validation']
      ],
      'limitations': [
        ['What does the architecture leave for experimental evaluation?', 'Expression, membrane localization, fusion behavior, and controlled functional responses must be distinguished from the intended construct design.'],
        ['Why not infer function from a bright reporter image?', 'Expression and calcium-responsive function are different. Assay controls are needed before brightness can be interpreted as receptor activity.', 'design.html#assay-design']
      ],
      'verification': [
        ['What does Sanger verification establish?', 'It addresses sequence identity in the checked region. It does not by itself establish expression, localization, or odor-evoked function.'],
        ['Why list synthesis and living-cell function separately?', 'Obtaining the intended DNA and demonstrating a biological response are separate milestones with different evidence.']
      ],
      'continue': [
        ['Which page owns the measured biological evidence?', 'Results presents the observations; Design explains architecture, and Experiments gives the corresponding methods.', 'results.html#wet-lab'],
        ['What can another team reuse?', 'Parts provides the component and construct record, while Contribution gathers reusable files and design lessons.', 'parts.html#explore']
      ],
      'design-feature-catalog': [
        ['What do the clickable sequence blocks explain?', 'Each feature note states its role, the reason for using it, and relevant interpretation caveats within the cassette.'],
        ['Why read a feature’s caveat as well as its role?', 'A feature’s intended role does not guarantee the assembled sensor’s performance. The catalog keeps design rationale separate from functional evidence.']
      ],
      'design-or-catalog': [
        ['Does a receptor name imply a validated ligand in this cell system?', 'No. The receptor notes avoid transferring ligand or platform-validation claims that are not supported for the specific system.'],
        ['What is the special status of Or85b and Or98a?', 'They are the two panel receptors identified as overlapping with the cited Zboray platform; the other seven are treated separately.']
      ]
    },
    'results.html': {
      '*': [
        ['What is the observation on this page?', 'The page presents exploratory regional fluorescence changes in a light-sheet recording of a fly preparation during odor presentations.', 'results.html#evidence-overview'],
        ['Is this a validated food-spoilage classifier?', 'No. The light-sheet observation, engineered-cell assay logic, and decoder benchmark are different evidence types.', 'results.html#limitations'],
        ['How should I connect a result with its method?', 'Each biological assay question links to the corresponding Experiments method and Notebook record.', 'results.html#wet-lab']
      ],
      'evidence-overview': [
        ['What does TH-associated fluorescence refer to here?', 'It identifies the fluorescent signal followed in the supplied fly preparation. The recording is not presented as an engineered AeroSense cell assay.'],
        ['Do the regional traces establish a dose response?', 'They illustrate fluorescence changes around the recorded odor presentations. Replicated dose-response evidence is a separate claim.', 'results.html#limitations']
      ],
      'wet-lab': [
        ['Why divide the assay sequence into separate questions?', 'Assembly, expression, channel activity, and target-odor response need different controls and support different conclusions.'],
        ['What would distinguish channel function from expression?', 'Expression measurements indicate that a construct is present or transcribed. Functional validation asks whether the expected controlled response occurs.', 'experiments.html#expression-validation']
      ],
      'what-changed': [
        ['How did these observations shape engineering?', 'They motivated a traceable fluorescence measurement chain and the separation of receptor identity from a shared optical reporter.'],
        ['Where is the rationale for the final fusion architecture?', 'Reporter topology describes the final orientation; the Wet Lab engineering record preserves the redesign logic.', 'design.html#reporter-topology']
      ],
      'data-availability': [
        ['What should accompany a plotted fluorescence trace?', 'The recording, region selection, processing method, stimulus timing, and controls determine how the trace can be interpreted. This section indexes the available record.'],
        ['Can a downloadable plot substitute for biological replicates?', 'A plot is an analysis artifact. Replication and uncertainty have to come from the experimental design and supporting data.', 'results.html#limitations']
      ],
      'limitations': [
        ['Can the recording validate the engineered receptor panel?', 'No. The exploratory fly-preparation recording does not validate the engineered OR/Orco–GCaMP6f sensor or classify food spoilage.'],
        ['What matters when interpreting the trace changes?', 'Biological replication, stimulus timing, region selection, controls, and uncertainty determine whether the visual observation supports a broader conclusion.']
      ]
    },
    'experiments.html': {
      '*': [
        ['Why does the workflow test expression before odors?', 'The sequence checks the construct and reporter/channel function before interpreting a target-odor response.', 'experiments.html#workflow'],
        ['Is a dim resting GCaMP image a failed experiment?', 'GCaMP6f is dim at rest. The protocol distinguishes baseline appearance from the controlled calcium response.', 'experiments.html#expression-validation'],
        ['How are responses made comparable across measurements?', 'The analysis uses a defined relative response and a plate/day VUAA1 reference, with processing choices documented separately.', 'experiments.html#data-analysis']
      ],
      'workflow': [
        ['Does the numbered workflow prove every step is complete?', 'It is the canonical method sequence. Completion and observations are traced through Results and Notebook rather than inferred from the diagram.'],
        ['Why is bacterial propagation inside molecular cloning?', 'It supports plasmid preparation for the mammalian assay; it is not a separate biological sensing stage.']
      ],
      'molecular-cloning': [
        ['Why prepare endotoxin-free plasmids?', 'The method specifies sequence-checked, endotoxin-free DNA for mammalian transfection, with concentrated, low-salt preparation.'],
        ['Does a construct map replace sequence checking?', 'No. The map records intended architecture; sequence checks address the material that will be used for transfection.', 'design.html#verification']
      ],
      'cell-culture': [
        ['Why document growth and handling conditions?', 'Cell state is part of a comparable assay. The method records growth, washing, and detachment conditions for the mammalian host.'],
        ['Which safety record applies to the mammalian work?', 'The page links mammalian handling to the project’s laboratory safety and containment record.', 'safety-and-security.html#safe-to-build']
      ],
      'transfection': [
        ['Is this an adherent-cell transfection protocol?', 'The supplied method specifies transfection in suspension, with the DNA mass, plasmid ratio, buffer volume, and recovery medium listed.'],
        ['Why preserve the OR-to-Orco plasmid ratio?', 'The ratio is part of the defined assay context. Changing it can introduce another variable into comparisons between receptor conditions.']
      ],
      'stable-selection': [
        ['What does G418 selection establish?', 'It selects resistant mammalian cells under the specified protocol. Resistance is not itself proof of target-odor sensing.'],
        ['Is the stated selection target a measured kill curve?', 'The section labels the protocol target separately from a validated kill curve; those should not be treated as the same evidence.']
      ],
      'expression-validation': [
        ['Why might green fluorescence be weak before stimulation?', 'GCaMP6f is calcium-responsive and dim at rest. Baseline brightness alone is not the functional test.'],
        ['Does mCherry report the same signal as GCaMP6f?', 'No. mCherry marks expression, while GCaMP6f is used for the calcium-responsive optical readout.']
      ],
      'calcium-imaging': [
        ['Why include a matched vehicle injection?', 'It provides a reference for non-target effects associated with the injection and solvent, supporting interpretation of the VOC-evoked response.'],
        ['Which part of the assay was adapted from literature?', 'The calcium-response assay follows the cited Zboray method; AeroSense-specific construct, transfection, and validation procedures are documented separately.']
      ],
      'data-analysis': [
        ['Why normalize to a plate/day VUAA1 mean?', 'The protocol uses that functional reference to express receptor–stimulus responses on a defined relative scale across the assay context.'],
        ['Are the response floor and outlier rule arbitrary display choices?', 'The page attributes the relative-response definition, floor, normalization, and Grubbs procedure to the cited assay method. They are analysis choices to report explicitly.']
      ],
      'safety': [
        ['Are VOC handling and cell containment the same precaution?', 'They address different hazards. The method specifies containment for the biological work and fume-hood handling of aromatic ligands according to their SDS.'],
        ['Does this protocol permit environmental release?', 'No. The experimental work is described as contained laboratory work.', 'safety-and-security.html#safe-to-deploy']
      ]
    },
    'parts.html': {
      '*': [
        ['What is modular about the sensor?', 'Nine interchangeable OR sensing composites pair with one shared GCaMP6f–Orco reporting module.', 'parts.html#collection'],
        ['Are the 3D protein drawings measured structures?', 'The viewer explains component roles. Construct maps, sequence records, and functional evidence must be interpreted separately.', 'parts.html#sensor-builder'],
        ['Which fluorescent protein reports calcium?', 'GCaMP6f provides the intended green calcium response. mCherry is a red expression marker.', 'parts.html#sensor-builder']
      ],
      'collection': [
        ['Why is there only one reporting module?', 'The same GCaMP6f–Orco module can be paired with different tuning receptors, supporting a shared reporting context.'],
        ['Is every item a new part?', 'The catalog distinguishes new basic parts, new composites, and reused Registry parts rather than labeling the entire collection as newly invented.']
      ],
      'sensor-builder': [
        ['What changes when I select another OR?', 'The specificity module changes to the selected tuning receptor. The shared reporting cassette stays the same.'],
        ['Why show genetic parts and translation products separately?', 'A DNA feature and its protein role are different levels of explanation. The viewer connects cassette organization with the resulting sensing mechanism.']
      ],
      'explore': [
        ['How many records are in the catalog?', 'The page lists 14 new basic parts, 10 new composites, and 2 reused Registry parts: 26 records.'],
        ['Why are full sequences not repeated in each row?', 'The table is the technical index. It points readers to the relevant Registry sequence records rather than maintaining duplicate sequence copies.']
      ],
      'characterization': [
        ['Does Registry registration mean the part has been functionally validated?', 'No. Registration, construct architecture, and functional assay evidence are separate claims.'],
        ['How can I evaluate characterization without duplicating figures?', 'This section links to the authoritative design, methods, biological results, and engineering records.']
      ],
      'reuse-qc': [
        ['What must a reusing team check besides the sequence?', 'The reuse table includes mammalian expression, topology, reporter interpretation, assembly standards, restriction sites, and verification requirements.'],
        ['Can published HEK293 expression be treated as AeroSense VOC proof?', 'No. Host/platform knowledge informs design; the specific receptor system needs its own controlled functional evidence.']
      ],
      'plasmid-atlas': [
        ['Does the plasmid map show the registered insert or the whole vector?', 'The maps show the full pcDNA3.1(+) context. The registered sensing composites are the inserts.'],
        ['What differs among the sensing plasmids?', 'The tuning OR coding sequence differs; the maps make the shared construct context visible.']
      ],
      'references': [
        ['Do numbered citations include datasheets and Registry pages?', 'This page reserves numbered in-text markers for papers. Other source types are identified separately.'],
        ['How do references relate to characterization?', 'Published work supports component choice and mechanism. Team-specific functional characterization remains a separate evidence claim.', 'parts.html#characterization']
      ]
    },
    'hardware.html': {
      '*': [
        ['Why use one photodiode for four wells?', 'The design frequency-tags the LED excitations, so the proposed readout can separate channels from a shared photodiode signal.', 'hardware.html#electronics-bridge'],
        ['Is an optical simulation a measured detection limit?', 'No. The optical model describes excitation and collection under stated assumptions; reader sensitivity needs physical calibration and measurement.', 'hardware.html#optical-question'],
        ['What connects the cells to the decoder?', 'The chain runs through fluorescence collection, a photodiode/TIA, ADC, and ESP32 signal processing.', 'hardware.html#hardware-architecture']
      ],
      'hardware-architecture': [
        ['Are the four wells optically independent detectors?', 'The geometry has four LED-aligned wells sharing an upper gas space and a single photodiode. Channel separation is an electronics and processing design question.'],
        ['Why is a transimpedance amplifier needed?', 'The TIA converts photodiode current into a voltage for the acquisition chain. Its high-impedance input makes weak-signal handling important.', 'hardware.html#electronics-bridge']
      ],
      'optical-question': [
        ['What does the collection fraction mean?', 'The model defines it as received power divided by power emitted from an isotropic point source at a given location.'],
        ['Why combine excitation and collection maps?', 'A region contributes usefully only if it is excited and its emission reaches the detector. Their spatial correspondence exposes that overlap.']
      ],
      'well-floor-results': [
        ['Why sweep parameters rather than report one attractive simulation?', 'The sweep tests how the result changes with detector position, resin optics, liquid scattering, reflection, fill, and other assumptions.'],
        ['What does repeating seeds add?', 'The optical sweep uses three seeds per condition to expose sampling variation in the simulated packet transport. This does not replace physical validation.']
      ],
      'gas-path-results': [
        ['Did the perforated plate improve the chosen metric?', 'The section reports that the plate did not reduce the selected headspace-speed metric relative to the no-plate comparison.'],
        ['Does solver convergence prove a good gas-distribution design?', 'Convergence and mass balance describe the numerical solution. Design usefulness still depends on the chosen metric and its relationship to the experiment.']
      ],
      'mechanical-package': [
        ['What should the exploded view help me inspect?', 'It shows how the enclosure, lid, shared well assembly, and service components fit together. Assembly coordinates and printing coordinates have different purposes.'],
        ['Does a transparent printed well establish cell-culture compatibility?', 'Optical transparency and fit are not biocompatibility evidence. The mechanical record distinguishes cell-free trials from direct culture qualification.']
      ],
      'electronics-bridge': [
        ['Why tag the LED channels with different frequencies?', 'The proposed frequency-domain readout separates excitations in the shared detector signal using synchronous I/Q processing.'],
        ['Why must sampling and excitation be designed together?', 'Channel frequencies, sample timing, acquisition length, and analog behavior jointly determine how well the measured channels can be separated.']
      ],
      'cost-and-reproduction': [
        ['Is the listed priced subset the finished product’s cost?', 'No. The workbook separates priced materials and hardware from unquoted or incomplete items; a subtotal is not full manufactured COGS.'],
        ['What does a reproducing team need beyond STL files?', 'The mechanical package, assembly context, electronics, BOM, calibration, and verification record work together; a printable shape alone is not a reproducible instrument.']
      ],
      'validation-boundary': [
        ['Why test calibrated light before cell fluorescence?', 'It separates reader response from biological variability and supports measurement of dark noise, linearity, gain, and leakage.'],
        ['What must be checked before a sealed device is used?', 'The listed checks include fit, seals, inlet/exhaust filtration, flow, pressure, and repeatable assembly, beginning with cell-free liquid.']
      ]
    },
    'model.html': {
      '*': [
        ['Was the decoder benchmark measured on AeroSense fluorescence?', 'No. The reported baseline uses the KT gas-sensor corpus as a surrogate for Decode development.', 'model.html#data-and-network'],
        ['What does the reported macro-F1 of 0.868 mean?', 'It is the reported pooled baseline classification result under the stated evaluation protocol, not a field food-spoilage accuracy claim.', 'model.html#performance'],
        ['Does the baseline establish drift robustness?', 'The pooled, stratified split does not test temporal or cross-batch drift. That requires a different evaluation.', 'model.html#training-evaluation']
      ],
      'evidence-snapshot': [
        ['Can I read the baseline score as system accuracy?', 'The score belongs to the specified surrogate-data benchmark. It does not validate the biological sensor, reader, or food application.'],
        ['Why show evidence type beside a headline result?', 'The dataset and split determine what the number supports; intended later work is not interchangeable with the completed benchmark.']
      ],
      'drift-problem': [
        ['What makes sensor drift difficult for an odor classifier?', 'A changing sensor response can shift the input pattern without an equivalent change in the underlying gas identity.'],
        ['Does recognizing the drift problem mean it was solved here?', 'No. The problem motivates the architecture, while drift-specific evaluation is separate from the pooled baseline.', 'model.html#training-evaluation']
      ],
      'why-fly-brain': [
        ['What is useful about mushroom-body inspiration?', 'The architecture takes inspiration from expanded, sparse Kenyon-cell representations downstream of projection-neuron input.'],
        ['Is this a complete simulation of a fruit fly brain?', 'It is a task-focused, fly-inspired decoding model. The implemented PN–KC–APL–MBON network is described at the level used for the benchmark.', 'model.html#network']
      ],
      'sensor-to-spikes': [
        ['Why convert continuous features into spikes?', 'The preprocessing route encodes a gas exposure as a sparse projection-neuron input pattern for the spiking network.'],
        ['How is preprocessing leakage avoided?', 'PCA and preprocessing parameters are fitted on training data only, so held-out exposures do not define the learned transformation.']
      ],
      'data-and-network': [
        ['What does KT stand for in the evidence chain?', 'It is the public sensor corpus used as a surrogate aging dataset for decoding development, rather than AeroSense’s own cellular fluorescence.'],
        ['Why state the included batches and excluded devices?', 'Those choices define the actual benchmark population and are needed to interpret or reproduce the reported evaluation.']
      ],
      'network': [
        ['What do PN, KC, APL, and MBON represent?', 'They label input, expansion, inhibitory-regulation, and output stages inspired by fly olfactory circuitry. The page documents their implemented roles.'],
        ['Where does the baseline learn its classification readout?', 'The stated baseline trains the KC-to-MBON readout with STDP; it does not claim that every connection is trained.', 'model.html#training-evaluation']
      ],
      'training-evaluation': [
        ['Why distinguish a pooled split from a time-based split?', 'A pooled split estimates classification within that mixed-data protocol. A temporal or cross-batch split asks whether performance transfers across drift.'],
        ['What is the learning rule used for the baseline readout?', 'The record describes STDP learning at the KC-to-MBON readout, followed by scoring on held-out exposures.']
      ],
      'performance': [
        ['Does macro-F1 measure every practical cost of an error?', 'It summarizes classification performance across classes. Deployment still requires application-specific analysis of false negatives, false positives, and decisions.'],
        ['Can this number be compared directly with another paper’s score?', 'Only after checking datasets, exclusions, features, splits, and scoring. Different protocols can make headline scores incomparable.']
      ],
      'what-we-learned': [
        ['What makes an engineering lesson supported?', 'The cards connect evidence to interpretation and then to a design consequence, rather than presenting a plausible idea as a measured finding.'],
        ['How do model results influence experimental design?', 'The page traces model-to-experiment decisions separately from assumptions that still require project-specific validation.', 'model.html#aerosense-bridge']
      ],
      'aerosense-bridge': [
        ['What has to change when moving from KT to AeroSense?', 'The input becomes the project’s fluorescence-derived response data. The sensing, readout, calibration, and data representation must support that transfer.'],
        ['Why is transfer a separate evidence step?', 'Performance on a surrogate sensor corpus does not automatically establish performance on a different biological and optical measurement system.']
      ],
      'reproduce': [
        ['What is needed to reproduce more than the headline score?', 'A reproducer needs the data selection, preprocessing, network configuration, training protocol, and evaluation split described in the record.'],
        ['Does a repository link guarantee an executable model package?', 'Use the resource status and actual files listed here. A proposed release location is not itself a runnable reproduction package.']
      ],
      'limitations': [
        ['Why request conventional ML baselines?', 'Matched baselines help identify whether the fly-inspired architecture adds value under the same data and evaluation protocol.'],
        ['Which test would address drift more directly?', 'A temporal or cross-batch evaluation would address transfer across sensor aging more directly than the reported pooled split.']
      ]
    }
  };
  Object.assign(pages, {
    'engineering.html': {
      '*': [
        ['What makes this an engineering cycle rather than a progress report?', 'Each cycle connects a design, build, test, interpretation, and redesign decision, so the reasoning behind a change can be inspected.', 'engineering.html#engineering-cycles'],
        ['Why include results that did not support the first design?', 'A negative or incomplete result can change the next design choice. The engineering record preserves that connection rather than showing only the final layout.', 'engineering.html#what-we-would-do-differently'],
        ['How is this different from Notebook?', 'Notebook records when work happened. Engineering explains why evidence caused a design change.', 'notebook.html#turning-points']
      ],
      'engineering-at-a-glance': [
        ['Why show six paths on this page?', 'Technical development, business development, learning design and wiki design ask different questions. Their cycle records keep the evidence and resulting decisions distinct.'],
        ['Does a completed design step imply a completed experiment?', 'No. The cycle separates design artifacts, builds, tests, and the conclusions each supports.']
      ],
      'engineering-cycles': [
        ['What should I look for after a test?', 'The learning and redesign should explain what the evidence changed, rather than simply restating the test outcome.'],
        ['Why keep multiple iterations inside a cycle?', 'They preserve the sequence from an initial idea through evidence-driven revisions while keeping the workstream’s question in view.']
      ],
      'entrepreneurship-engineering': [
        ['What did the business reviews change?', 'The cycles trace a shift from a broad multi-crop platform to a banana-export use case, a clearer buyer and a screening service connected to laboratory confirmation.', 'engineering.html#hp-ent-1'],
        ['Does mentor feedback establish customer demand?', 'A review can improve positioning and challenge assumptions. It does not by itself establish purchasing behavior, revenue or field performance.', 'entrepreneurship.html#who-needs-this']
      ],
      'education-engineering': [
        ['Why separate Education from Entrepreneurship?', 'Learning design asks what an audience understands and can reason about. Business development asks who needs, uses and pays for a screening service. They require different evidence.'],
        ['Does building a game prove that learners understand more?', 'A playable tool establishes an educational artifact. Paired audience responses and feedback address its learning effect.', 'education.html#measurement-chain']
      ],
      'wiki-design': [
        ['Why does this wiki look so incredible?', 'Pin-Che: I know, right? Haha, thank you! Come for the science, stay for the tiny details. Peek at Engineering’s Wiki Design section to see how the little touches came together.', 'engineering.html#wiki-design'],
        ['Why include Wiki Design in this record?', 'The section documents interface-design decisions using the same cycle structure. Its evidence concerns the reading experience; it does not substitute for biological or hardware validation.'],
        ['How did readers influence Ask the Fly?', 'The team asked people around them to browse the wiki, collected recurring questions and used that informal feedback to shape the curated question bank.', 'engineering.html#wiki-cycle-2']
      ],
      'wiki-cycle-1': [
        ['How are Glossary, Project Search and Ask the Fly different?', 'Definitions explain a term. Glossary lets you browse concepts, Project Search finds a page or section, and Ask the Fly addresses questions about the passage you are reading.', 'engineering.html#wiki-cycle-1-redesign'],
        ['Can I understand a technical word without leaving the paragraph?', 'Marked terms open a short in-place definition. These definitions share the dictionary used by the Glossary page.', 'glossary.html']
      ],
      'wiki-cycle-2': [
        ['Is Ask the Fly a generative chatbot?', 'No. It displays team-written questions and answers from a local bank, selects the relevant section, and links to the project explanation. It does not generate new answers or upload visitor questions.', 'engineering.html#wiki-engineering-summary'],
        ['What kind of reader feedback supports this design?', 'The team describes informal feedback and recurring questions from people who browsed the wiki. This is qualitative design input, not a controlled usability or learning-gain measurement.', 'engineering.html#wiki-cycle-2-test'],
        ['Why do the suggested questions change as I read?', 'A receptor mechanism, an optical measurement and a screening decision raise different questions. The guide checks the current page and section when you open it.', 'engineering.html#wiki-cycle-2-redesign']
      ],
      'change-log': [
        ['Why not repeat every experiment in the change log?', 'This log summarizes READ-layer decisions. Detailed cycle evidence and dated chronology remain in their dedicated records.'],
        ['How can I find the date behind a redesign?', 'Use Notebook for the dated work record, then return to the engineering cycle for its decision logic.', 'notebook.html#chronicle-views']
      ],
      'what-we-would-do-differently': [
        ['What makes a reflection useful to another team?', 'It identifies a specific design or validation choice that could be improved, with a reason grounded in the work record.'],
        ['Where is the final reader specification?', 'Hardware contains the READ-layer theory, mechanical and electronics record, BOM, simulations, and verification narrative.', 'hardware.html#hardware-architecture']
      ],
      'references': [
        ['What distinguishes a cited method from a team result?', 'A paper supports an established method or rationale. The cycle’s own evidence must establish what happened in AeroSense.'],
        ['Are datasheets treated as experimental validation?', 'No. Component specifications and design documents support choices; they do not replace a test of the assembled system.']
      ]
    },
    'human-practices.html': {
      '*': [
        ['What did stakeholders change?', 'The record connects feedback to the application, buyer, technical constraints, output claims, and deployment model.', 'human-practices.html#road'],
        ['Is an interview the same as a device pilot?', 'No. An interview can inform a decision without demonstrating device performance in the field.', 'human-practices.html#engagements'],
        ['Why is the project framed as screening?', 'Analytical and industry feedback helped distinguish an early cue for follow-up from a definitive food-safety verdict.', 'human-practices.html#responsibility']
      ],
      'ihp': [
        ['What was too broad about the original framing?', 'The initial platform story spanned many possible crops and applications. Stakeholder input pushed the team to define a more specific problem and decision.'],
        ['Why does the before-and-after record matter?', 'It shows whether engagement actually changed the project rather than simply endorsing an existing plan.']
      ],
      'how-we-worked': [
        ['Why separate stakeholder groups on the map?', 'Different groups informed different decisions, from agricultural context and user needs to analytical claims and business direction.'],
        ['Why are not all contacts on the main road?', 'The main road highlights project-changing checkpoints; the archive holds contextual and planned contacts so their roles are not conflated.']
      ],
      'road': [
        ['How do I see the evidence behind a decision?', 'Choose a checkpoint. Its full record connects the conversation’s context, challenge, project change, and subsequent question.'],
        ['Why distinguish farmers from the eventual buyer?', 'Field users, institutional channels, exporters, and payers can have different needs. The recorded feedback challenged the assumption that every grower is the buyer.']
      ],
      'responsibility': [
        ['How could an early screen cause harm?', 'An output could be over-trusted or used as a definitive safety judgment. The implementation principle therefore keeps confirmation, containment, and responsible use explicit.'],
        ['Does a containment concept authorize deployment?', 'No. Safety design, evidence of containment, and authorization for a particular use are separate requirements.', 'safety-and-security.html#safe-to-deploy']
      ],
      'engagements': [
        ['Why keep supporting voices outside the main decision trail?', 'Their contextual contribution is valuable, but the archive avoids presenting every contact as a project-changing checkpoint.'],
        ['Can public survey responses substitute for exporter interviews?', 'The public sample provides contextual input. It is not the same population or decision as the proposed export-supply-chain buyer.']
      ],
      'references': [
        ['What is the difference between stakeholder evidence and a paper?', 'An interview records a contextual perspective; a paper supports a published scientific claim. Their provenance and roles remain distinct.'],
        ['Does a stakeholder’s recommendation establish product performance?', 'No. Recommendations shape requirements and choices; technical performance must be measured under an appropriate test.']
      ],
      'cp-taoyuan': [
        ['How did the plant-protection interview change the starting point?', 'The conversation supported narrowing from a generic multi-crop electronic-nose pitch toward an agricultural disease-detection use case with a specific timing problem.'],
        ['Does identifying an early-warning gap establish field performance?', 'No. This checkpoint records agricultural context and a design direction. It does not report a device pilot or measured disease-detection performance.']
      ],
      'cp-field': [
        ['What changed after the agricultural interviews?', 'The record emphasizes institutional channels and distinguishes user needs from the assumption that every individual grower will buy the device.'],
        ['Do these conversations prove willingness to pay?', 'They inform the problem and channel hypothesis. Buyer-side purchasing evidence is a separate question.', 'entrepreneurship.html#who-needs-this']
      ],
      'cp-enose': [
        ['Why did the sensing element become important in this discussion?', 'The recorded industry feedback identifies the sensing element, rather than electronics alone, as a persistent bottleneck.'],
        ['Does this mean better electronics is unnecessary?', 'No. It shifts attention to the whole chain: a useful biological response still needs reliable measurement and decoding.', 'description.html#pipeline']
      ],
      'cp-challenge': [
        ['Why distinguish a VOC signal from a food-safety verdict?', 'The conversation sharpened the claim boundary: an odor-associated response cannot by itself establish toxin content or food safety.'],
        ['How did this influence application selection?', 'The commercial comparison uses detectability, consequence, unmet need, and willingness to pay rather than selecting a market only because it is large.', 'entrepreneurship.html#beachhead']
      ],
      'cp-analytical': [
        ['Why position AeroSense before confirmatory analysis?', 'The recorded perspective favors on-site screening to guide follow-up, rather than presenting AeroSense as a cheaper replacement for comprehensive laboratory analysis.'],
        ['Does a low-cost reader make its information equivalent to GC–MS?', 'No. Cost, measurement scope, and the decision supported are different dimensions of the comparison.', 'entrepreneurship.html#existing-alternatives']
      ],
      'cp-fiti': [
        ['What did the mentor reviews narrow?', 'The record moves toward a specific expensive problem and a focused beachhead rather than a general-purpose electronic-nose pitch.'],
        ['Is selection into a program evidence of sales?', 'It is venture-development traction. It does not establish customer purchases or validated field performance.', 'entrepreneurship.html#traction']
      ],
      'cp-revalidate': [
        ['Why keep revalidation on the road?', 'A changed hypothesis needs another test. This checkpoint identifies the buyer and deployment questions that the revised direction must answer.'],
        ['Can a project-changing interview close every later question?', 'No. A decision can be well motivated while still requiring direct testing in the proposed user workflow.']
      ]
    },
    'entrepreneurship.html': {
      '*': [
        ['Who is the proposed first market?', 'The page identifies Taiwan banana-export fungal-disease screening as the leading candidate beachhead, with other applications treated separately.', 'entrepreneurship.html#beachhead'],
        ['What exactly would the product sell?', 'The proposed system combines a living-cell cartridge, dedicated optical reader, and analysis/decision layer; the business model considers hardware, consumables, and service.', 'entrepreneurship.html#business-model'],
        ['Does market size demonstrate customer demand?', 'No. Market estimates describe a modeled opportunity. Buyer evidence, willingness to pay, and workflow fit need their own support.', 'entrepreneurship.html#who-needs-this']
      ],
      'judging-map': [
        ['What is the purpose of the award evidence map?', 'It connects the entrepreneurship questions to the underlying problem, customer, product, and evidence sections. It is a navigation aid, not a claim of an award.'],
        ['Why keep the conclusion visible outside the diagrams?', 'The core commercial reasoning should be assessable without requiring animation or discovery of every interactive region.']
      ],
      'strategy-diagrams': [
        ['Do the strategy diagrams add new evidence?', 'No. They organize the page’s current business reasoning and link back to the underlying record.'],
        ['Why use more than one business framework?', 'Each asks a different question: purpose, customer fit, operating model, market scope, external conditions, or risk. Their usefulness depends on the evidence behind them.']
      ],
      'decision-problem': [
        ['What decision would an earlier signal change?', 'The section focuses on choices such as shipping, mixing, storing, holding, or investigating a batch before visible deterioration becomes the trigger.'],
        ['Why begin with a decision instead of TAM?', 'A market total does not show whether a specific workflow benefits from a screening result or who would act on it.']
      ],
      'who-needs-this': [
        ['Why separate customer, user, and payer?', 'The person operating a screen, the organization buying it, and the party carrying the economic risk may be different.'],
        ['Why not assume individual farmers are the first buyers?', 'Field and industry conversations challenged that assumption and directed attention toward institutional and supply-chain channels.']
      ],
      'what-we-learned': [
        ['How is this different from the IHP interview record?', 'IHP preserves the stakeholder context; this section extracts the commercial consequence of each documented external signal.'],
        ['What counts as a meaningful commercial change?', 'A narrower beachhead, different buyer assumption, revised comparison, or explicit validation gate is more informative than a generic claim that feedback was positive.']
      ],
      'beachhead': [
        ['Why are the matrix entries qualitative rather than numeric scores?', 'They distinguish evidence strength without inventing precision. The criteria cover detectability, consequence, need, willingness to pay, and validation access.'],
        ['Does the leading beachhead mean the first customer is confirmed?', 'No. It is the current candidate after narrowing. The page separates that strategic choice from buyer contracts and direct purchasing evidence.']
      ],
      'aerosense-10': [
        ['Why package the system as cartridge, reader, and analysis?', 'The layers correspond to biological sensing, optical acquisition, and interpretation, with different functions and practical constraints.'],
        ['Is the reader designed around a Raspberry Pi?', 'The current product architecture on this page follows the ESP32-standalone Hardware record. Older interface wording is not the current design.']
      ],
      'mvp-evidence': [
        ['Why use an evidence ladder for the MVP?', 'A construct design, fabricated reader, integrated assay, and application pilot establish different kinds of readiness.'],
        ['Can a CAD model demonstrate a working MVP?', 'It demonstrates design work. Operation, calibration, integrated sensing, and user-workflow performance require separate evidence.']
      ],
      'existing-alternatives': [
        ['Is AeroSense intended to replace GC–MS?', 'The positioning is upstream screening to move a decision earlier, while confirmatory laboratory analysis retains its distinct role.'],
        ['What makes an alternative comparison useful?', 'Compare workflow fit, information produced, time, cost, and the decision supported instead of claiming that every method does the same job.']
      ],
      'business-model': [
        ['Why combine hardware with consumables and service?', 'The proposed value is delivered by a reusable reader, a biological sensing element, and support for interpretation and use.'],
        ['Is the software fee already a validated customer preference?', 'The page treats software/analysis fees as part of the internal model rather than established SaaS demand.']
      ],
      'go-to-market': [
        ['Why use exit gates between commercialization stages?', 'A gate states what evidence must justify progression from validation to pilot and later scaling.'],
        ['Does an institutional interview count as a pilot site?', 'An interview informs discovery. A device pilot requires actual use under a defined workflow and evaluation.']
      ],
      'unit-economics': [
        ['Are the market estimates booked revenue?', 'No. TAM, SAM, SOM, and illustrative financial scenarios are modeled quantities with stated assumptions.'],
        ['Can a materials subtotal be used as the sales margin?', 'Margin requires a complete cost boundary and price assumptions. Reader components alone omit other manufacturing, consumable, service, and operating costs.']
      ],
      'roadmap-risks': [
        ['What makes this roadmap testable?', 'Its gates connect development decisions to evidence rather than relying only on dates or a presentation timeline.'],
        ['Why show risks alongside milestones?', 'A milestone matters only if the biological, technical, buyer, and deployment assumptions supporting it survive evaluation.']
      ],
      'team-stakeholders': [
        ['What does the capability map add beyond member profiles?', 'It relates internal, advisor, and external capabilities to the work needed for the venture, rather than repeating a photo gallery.'],
        ['Does an organization’s presence mean a formal partnership?', 'The page distinguishes interviewees, mentors, prospective buyers, and other stakeholder roles. Their relationship status should be read explicitly.']
      ],
      'traction': [
        ['What counts as traction in this record?', 'The section lists actual venture-development and engagement actions, keeping them separate from projected revenue and intended partnerships.'],
        ['Why not combine mentorship, pilots, and sales into one metric?', 'They answer different questions about progress. Treating them as equivalent would hide what was actually demonstrated.']
      ],
      'responsible-scaling': [
        ['Could scaling a screening device create new risks?', 'Yes. Over-trust, containment, consumable waste, access, and governance can matter alongside the intended benefit.'],
        ['Do SDG links prove a positive net impact?', 'They map potential mechanisms and trade-offs. Measured food-loss reduction and the device’s own footprint require evidence.', 'sustainability.html#own-footprint']
      ]
    },
    'sustainability.html': {
      '*': [
        ['Where would sustainability benefits actually occur?', 'Any benefit would occur through decisions in a food workflow, balanced against the cartridge, reader, energy, and other resources required.', 'sustainability.html#food-pathway'],
        ['Do the SDG icons mean AeroSense is certified sustainable?', 'No. They organize potential impact pathways and trade-offs; they are not certification or measured impact.', 'sustainability.html#primary-pathways'],
        ['What is included in the device’s own footprint?', 'The inventory includes the biological sensing workflow, consumables, reader, and other system resources. It is not a completed life-cycle assessment.', 'sustainability.html#own-footprint']
      ],
      'food-pathway': [
        ['Why does the pathway continue beyond the sensor?', 'A measurement changes outcomes only through interpretation and a human or institutional decision. That chain can create benefits or harms.'],
        ['Can the same screen reduce loss and create waste?', 'Yes. An earlier decision might avoid food loss while cartridges, electronics, or unnecessary follow-up create additional burdens.']
      ],
      'at-a-glance': [
        ['Why distinguish primary and supporting SDGs?', 'The page gives most detail to the four pathways most directly connected to the project’s work, while keeping additional connections narrower.'],
        ['Why show evidence labels beside impact claims?', 'Measured outcomes, stakeholder input, designs, and hypotheses support different conclusions and should not look interchangeable.']
      ],
      'system-boundary': [
        ['Why define a system boundary first?', 'The boundary determines which materials, activities, users, and downstream decisions are counted when discussing impact.'],
        ['Why separate the research scope from the commercial hypothesis?', 'The current laboratory work and a later export-supply-chain deployment involve different evidence, stakeholders, and consequences.']
      ],
      'stakeholder-changes': [
        ['What makes a stakeholder connection relevant to sustainability?', 'The record links an input to a changed requirement, decision, or impact question rather than relying on an organization’s logo.'],
        ['Are interviews and partnerships equivalent?', 'No. Engagement, mentorship, collaboration, and prospective partnership are distinct relationship types on this page.']
      ],
      'primary-pathways': [
        ['What connects an SDG target to AeroSense?', 'Each pathway names the problem, proposed mechanism, evidence, boundary or risk, and the next measurement.'],
        ['Why include a possible downside in an impact pathway?', 'A useful assessment must account for costs and failure modes as well as the intended benefit.']
      ],
      'supporting-connections': [
        ['Why are health and inequality treated as supporting links?', 'They surfaced in the project’s evidence and deployment questions, but are not presented as equally established primary impact pathways.'],
        ['Could an accessible technology still exclude some users?', 'Cost, expertise, infrastructure, and purchasing power can determine who benefits, even when the intended application is socially useful.', 'sustainability.html#who-benefits']
      ],
      'tradeoff-map': [
        ['What does a connection in the SDG map mean?', 'It identifies a proposed interaction between impact pathways, with an explanation of the relationship rather than a numerical impact score.'],
        ['Does an empty cell mean the goals are unrelated?', 'No. It means this page does not assert a project-specific relationship without support.']
      ],
      'evidence-ledger': [
        ['What should I check before accepting an impact claim?', 'Check the evidence type, what it directly supports, and whether the claimed outcome has actually been measured.'],
        ['Does stakeholder support establish food-loss reduction?', 'It can support the relevance of a problem or requirement. Reduction in food loss is an outcome that needs its own measurement.']
      ],
      'own-footprint': [
        ['Is this a complete life-cycle assessment?', 'No. The page presents a system-boundary inventory and separates unquantified items from measured quantities.'],
        ['Why not treat missing energy or waste data as zero?', 'An unmeasured burden is unknown, not absent. Treating it as zero would bias the net-impact comparison.']
      ],
      'who-benefits': [
        ['Who might be excluded from the intended benefit?', 'Access depends on who can buy, operate, maintain, and act on the system. The section considers these distributional questions.'],
        ['Why evaluate who pays for false results?', 'The cost of unnecessary follow-up or a missed risk may fall on different participants in the supply chain.']
      ],
      'toolkit': [
        ['What can a future team reuse from this page?', 'The toolkit offers a structured way to connect stakeholders, mechanisms, evidence, risks, and required measurements.'],
        ['Does reusing the template certify a project’s impact?', 'No. The template organizes evidence; each team must supply and evaluate its own project-specific evidence.']
      ],
      'limitations-next': [
        ['What would strengthen the net-benefit argument?', 'Measurements must connect actual user decisions and avoided losses with the materials, energy, waste, and failures introduced by the system.'],
        ['Why keep trade-offs in the final interpretation?', 'Progress toward one goal can impose costs on another. A complete interpretation makes those interactions visible.']
      ],
      'references': [
        ['What role do sustainability references play?', 'They support the assessment framework and relevant mechanisms. They do not supply AeroSense-specific measured impact.'],
        ['Can a general SDG source validate this project’s outcome?', 'No. Project outcomes need evidence within the stated system boundary.', 'sustainability.html#evidence-ledger']
      ]
    },
    'members.html': {
      '*': [
        ['Why are some people listed in more than one workstream?', 'Workstream labels describe overlapping responsibilities rather than separate teams of unique people.', 'members.html#student-team'],
        ['How do profiles differ from formal attribution?', 'Profiles introduce the people. Attributions records the work and support associated with the project.', 'attributions.html#student-work'],
        ['What do the album photographs document?', 'They are team memories. They are not presented as evidence of a specific experiment, interview, or device pilot.', 'members.html#team-memories']
      ],
      'team-memories': [
        ['Why is the team page arranged as a memory book?', 'The album presents the people and shared moments behind AeroSense, alongside the more formal role index below.'],
        ['Do the photographs replace the contribution record?', 'No. Personal introductions and memories complement the separate record of who did what.', 'attributions.html#student-work']
      ],
      'team-index': [
        ['Why does the index separate students, advisors, and PIs?', 'Those groups have different project roles. The index keeps student work and supporting roles easy to distinguish.'],
        ['How can I identify responsibility for a particular layer?', 'Student workstream labels identify roles, while the attribution table gives the work-package record.', 'attributions.html#student-work']
      ],
      'student-team': [
        ['What does a workstream filter change?', 'It shows people associated with the selected role. A person can appear in multiple filters when responsibilities overlap.'],
        ['Which workstreams are listed for Jeffrey?', 'Jeffrey is listed for Hardware and Leadership, matching the team leader/hardware role shown in his profile.']
      ],
      'advisors': [
        ['How is advisor support distinguished from student work?', 'Profiles introduce advisors; the attribution record should identify the specific guidance or support they provided.', 'attributions.html#advisors-support'],
        ['Does a shared affiliation imply the same project contribution?', 'No. Credit follows the actual role or support, not affiliation alone.', 'attributions.html#advisors-support']
      ],
      'pis': [
        ['What is Chung-Chuan Lo’s research background?', 'His profile describes computational neuroscience, neural circuits, and brain-inspired artificial intelligence at NTHU.'],
        ['Where is PI support connected to the project record?', 'Attributions distinguishes advisor, instructor, and institutional support from the student work packages.', 'attributions.html#advisors-support']
      ],
      'team-contact': [
        ['Which contact channels are public?', 'The team contact section lists the public channels supplied for AeroSense.'],
        ['Where should I look before asking who contributed something?', 'The attribution record organizes contributions by student work, advisors, external support, and reused resources.', 'attributions.html']
      ]
    },
    'notebook.html': {
      '*': [
        ['What does the calendar bring together?', 'It brings dated Wet Lab, Dry Lab, Human Practices, and official iGEM records into one chronology.', 'notebook.html#chronicle-views'],
        ['Can I distinguish future goals from completed work?', 'Yes. Planned work stays distinct, and longer-term goals have their own section after the chronology.', 'notebook.html#future-work'],
        ['Where does the meaning of an iteration appear?', 'Notebook preserves dates and turning points; Engineering explains the evidence-to-redesign logic.', 'engineering.html#engineering-cycles']
      ],
      'chronicle-controls': [
        ['Does filtering change an entry’s completion status?', 'No. Filters choose which records to display; they do not reclassify planned work as completed.'],
        ['Why are Hardware and Model inside Dry Lab?', 'They are substreams of the shared chronology, so their records can be examined together or separately.']
      ],
      'chronicle-views': [
        ['What happens when I open a date?', 'The day view gathers that date’s matching records across workstreams, keeping the shared project timeline intact.'],
        ['Does an empty date mean no one worked that day?', 'It means no matching entry is shown in this record and filter view; it is not a measured account of every team activity.']
      ],
      'turning-points': [
        ['What qualifies as a turning point here?', 'It is a documented build–test–learn pivot, including negative or incomplete evidence that changed a decision.'],
        ['Why not show only successful milestones?', 'A chronology is more informative when it preserves the evidence that redirected the work, not just the final outcomes.']
      ],
      'future-work': [
        ['Why move future goals after the dated record?', 'It separates intended work from completed chronology while preserving the rationale for next experiments or engagements.'],
        ['Which pages explain the deployment goals?', 'Human Practices and Entrepreneurship connect later user-workflow and deployment questions to the project’s rationale.', 'human-practices.html#responsibility']
      ]
    },
    'contribution.html': {
      '*': [
        ['What can another team take from AeroSense?', 'The page organizes reusable biological, hardware, computational, and design knowledge, with the files and evidence actually available.', 'contribution.html#library'],
        ['How is contribution different from engineering history?', 'Contribution extracts transferable resources and lessons. Engineering preserves the iterations that produced them.', 'contribution.html#lessons'],
        ['Does every documented idea have a download?', 'No. The reproducibility matrix is limited to resources with public files; design knowledge can be documented without a downloadable package.', 'contribution.html#repro-matrix']
      ],
      'library': [
        ['What is inside a reusable package?', 'Each package pairs its overview with the relevant evidence, limits, and files, so a reusing team can judge what it can actually do with it.'],
        ['Can I reuse one layer without rebuilding the whole system?', 'That is the modular goal: the page separates resources so another team can adopt a layer or lesson independently.']
      ],
      'lessons': [
        ['Why are these lessons separated from the DBTL cycles?', 'They are reusable design principles rather than the full chronology of iterations and troubleshooting.'],
        ['What makes a lesson transferable?', 'It states the decision and reason in a form another team can apply, while keeping its assumptions and verification needs visible.']
      ],
      'repro-matrix': [
        ['What qualifies for the reproduction table?', 'A resource needs an actual public file on this wiki. A planned package or external release intention is not enough.'],
        ['Why is a file’s scope as important as its download link?', 'A construct map, source code, BOM, and measurement dataset support different reproduction tasks and should not be treated as equivalent.']
      ],
      'one-sentence': [
        ['What connects the separate contribution packages?', 'They document a path from engineered receptors through weak-signal measurement and structured data to computational odor decoding.'],
        ['What is the practical reuse goal?', 'A future biological-olfaction team should be able to reuse one layer without inheriting the whole AeroSense project.']
      ]
    }
  });
  Object.assign(pages, {
    'safety-and-security.html': {
      '*': [
        ['Why is measurement reliability a safety issue?', 'A contained instrument can still cause harm if a misleading result is treated as a biological or food-safety verdict.', 'safety-and-security.html#safe-to-measure'],
        ['Does this wiki authorize a living-cell device for field use?', 'No. The page separates the current laboratory work, a future cartridge concept, and later deployment authorization.', 'safety-and-security.html#safe-to-deploy'],
        ['How are safety claims connected to evidence?', 'The risk register links each hazard to its consequence, control, verification, and current status.', 'safety-and-security.html#risk-register']
      ],
      'lab-door-labels': [
        ['What do the BSL door photographs establish?', 'They show the posted facility labels. They do not certify a construct, document every experiment’s room, or authorize field deployment.'],
        ['Why are location and contact details cropped?', 'The public images show the relevant safety labels while omitting identifying facility contact details.']
      ],
      'safety-at-a-glance': [
        ['What is the difference between implemented and verified?', 'Implemented describes a documented control in use or design. Verified requires a measurement, inspection, or formal record supporting the claim.'],
        ['Can a planned control be read as an existing protection?', 'No. The section keeps planned, implemented, verified, and restricted states distinct.']
      ],
      'our-safety-case': [
        ['Why follow Sense, Read, Decode, and Act for safety?', 'Risks can arise in the cells, instrument, interpretation, or downstream decision. The safety case follows that full functional chain.'],
        ['Why keep detailed hazards in one register?', 'A single Hazard–Consequence–Control–Verification record makes it easier to inspect evidence without duplicating inconsistent claims across sections.', 'safety-and-security.html#risk-register']
      ],
      'safe-to-build': [
        ['Why separate biological, chemical, and equipment hazards?', 'They need different controls. Containment alone does not address solvent exposure, equipment practice, or waste handling.'],
        ['Does a low-risk organism settle all project safety questions?', 'No. Organism choice, construct, procedure, chemicals, containment, and institutional requirements must be considered in their actual context.']
      ],
      'safe-to-measure': [
        ['How can an optical reader create an interpretation risk?', 'Noise, leakage, gain, timing, or other measurement errors can produce a misleading signal if the acquisition chain is not calibrated and checked.'],
        ['Is a protection feature in the schematic a verified control?', 'It is design evidence. Verification requires the relevant inspection or measurement on the system.']
      ],
      'safe-to-interpret': [
        ['Why not label a low-risk output as safe?', 'That wording can turn a screening cue into a false clearance claim. The stated use is early screening and risk indication with follow-up.'],
        ['Can a classifier output establish toxin concentration?', 'Not by itself. Classification of a measured pattern and confirmatory chemical quantification are different kinds of evidence.']
      ],
      'safe-to-deploy': [
        ['What is the current deployment boundary?', 'The page separates contained laboratory work from a conceptual future cartridge and any later partner-site or commercial use.'],
        ['Why is containment design different from deployment permission?', 'A containment concept needs verification, and a particular deployment needs the applicable institutional and use-specific authorization.']
      ],
      'people-and-data': [
        ['Does having no primary human biological material mean there is no human data?', 'No. The project also includes interviews and an educational public diagnostic, which require their own data-handling considerations.'],
        ['Does the wiki claim ethics-board approval for those activities?', 'The page does not claim an ethics-board approval or IRB exemption. The documented activity and any formal authorization must remain distinct.']
      ],
      'biosecurity': [
        ['Why consider dual use for a sensing platform?', 'The modular receptor architecture can change sensing targets, so a substantially different application may change the risk assessment.'],
        ['Would a new pathogen-associated target use the same review automatically?', 'The page calls for renewed review when the target or application expands, rather than assuming the original assessment transfers unchanged.']
      ],
      'risk-register': [
        ['What should I check in a risk-register row?', 'Identify the hazard, possible consequence, control, evidence of verification, and status; a listed control alone does not show that it works.'],
        ['Does a blank risk score mean zero risk?', 'No. Missing likelihood or severity values are not interpreted as absence of risk.']
      ],
      'safety-contribution': [
        ['Is AeroSafe an official safety standard?', 'No. It is a team-developed framework for structuring a living-biosensor safety case, not an established standard or iGEM committee method.'],
        ['What can another team reuse from AeroSafe?', 'The structure connects cells, containment, the reader, computation, and decisions to controls and verification, while requiring each team’s own evidence.']
      ],
      'compliance': [
        ['Does this page replace official Safety Forms or SOPs?', 'No. The wiki summary complements institutional procedures, chemical SDS files, and the official iGEM safety process.'],
        ['Are White List eligibility, Check-In, and BSL assignment identical?', 'They are separate questions. One status should not be used as proof of the others.']
      ],
      'award-map': [
        ['Does this map answer the official judging form?', 'It links safety award questions to the relevant evidence. It does not replace the official form or make an award claim.'],
        ['What is stronger than a safety checklist?', 'A traceable safety case explaining why a control addresses a hazard and how that control was checked.', 'safety-and-security.html#risk-register']
      ]
    },
    'education.html': {
      '*': [
        ['Why split education into two tracks?', 'One track concerns food-safety decisions; the other develops olfactory and synthetic-biology understanding and participation. They have different evaluation questions.', 'education.html#tracks'],
        ['Do the games prove that people learned?', 'The live games demonstrate that a resource was built. Learning improvement needs audience evaluation matched to its objective.', 'education.html#how-we-measure'],
        ['What does the public diagnostic contribute?', 'It tests the initial assumption about public understanding and informs educational design. Its interpretation depends on the actual response record.', 'education.html#why-we-changed']
      ],
      'tracks': [
        ['Why not combine both tracks into one impact score?', 'Food-safety judgment and synthetic-biology literacy are different learning jobs. Combining them would obscure what each activity actually measures.'],
        ['Can the same Learning Lab support both tracks?', 'Yes. Module 2 is associated with the food-safety track; the other modules support the wider olfaction and synthetic-biology pathway.']
      ],
      'measurement-chain': [
        ['Why distinguish delivery from evaluation?', 'Building or delivering a resource is one fact; demonstrating a change in understanding or decision-making is another.'],
        ['Why retain item IDs when evaluating the same learning job?', 'Matched items make the measurement chain traceable instead of comparing unrelated questions as though they measured the same change.']
      ],
      'project-map': [
        ['What does the project map organize?', 'It connects named education activities with their delivery and evidence status, making their different roles visible.'],
        ['Why are statuses written out as well as colored?', 'Text makes the evidence state explicit and keeps the map interpretable without relying on color perception.']
      ],
      'why-we-changed': [
        ['What initial assumption did the team test?', 'The initial idea was that broad misconceptions about mold risk called mainly for more explanation. The diagnostic was used to examine that assumption.'],
        ['Why diagnose understanding before designing an intervention?', 'It helps target the actual decision or misunderstanding rather than building an activity around an untested assumption.']
      ],
      'decide-first': [
        ['Will my answers become part of the research sample?', 'No. This interaction states that choices stay in the browser tab and are not stored, sent, logged, or added to the reported sample.'],
        ['What is the purpose of choosing before reading the explanation?', 'It makes the decision being discussed explicit, so the explanation can address a concrete claim rather than a general slogan.']
      ],
      'track-a': [
        ['What is the specific job of Track A?', 'It addresses food-safety decisions through diagnosis, matched misconception challenges, and evaluation tied to those decisions.'],
        ['Does the reported n = 107 establish an intervention’s effect?', 'It describes the reported diagnostic response count. An intervention effect requires the appropriate evaluated audience and item-level evidence.']
      ],
      'track-b': [
        ['What do the odor-coding games teach?', 'They help learners approach smell as a pattern and connect that idea to the biology-to-decision chain.'],
        ['Is Track B another copy of the food-safety survey?', 'No. It supports olfactory and synthetic-biology understanding and participation, with a different educational aim.']
      ],
      'next-scientists': [
        ['Why include participation beyond factual explanation?', 'The pathway aims to help someone understand, question, and potentially take part in synthetic biology, not only recall information.'],
        ['How do self-paced tools and face-to-face activities relate?', 'They are different parts of the proposed participation pathway, with the record distinguishing existing resources from planned activities.']
      ],
      'how-we-measure': [
        ['What is the difference between reach and learning?', 'Reach describes who encountered an activity; learning concerns a demonstrated change in the targeted understanding or decision.'],
        ['Can a successful website interaction be counted as educational impact?', 'It establishes that the interaction works. Educational impact requires evidence matched to the learning objective and audience.']
      ],
      'what-changed': [
        ['Why show impact on the team as well as on the audience?', 'The record asks how evidence changed the education design, rather than presenting only an outreach summary.'],
        ['Are internal design reviews equivalent to participant feedback?', 'No. The page distinguishes internal reviews from audience evidence and does not present them as participant quotations.']
      ],
      'reuse': [
        ['What makes the education framework reusable?', 'It includes not only activities, but the logic another team needs to run and evaluate them.'],
        ['Does a listed resource always have a downloadable file?', 'Only resources that actually exist are linked. The page avoids presenting missing files as available downloads.']
      ],
      'limitations': [
        ['What claim can be made from a live learning resource alone?', 'It supports the claim that the tool exists. It does not establish learning gain, reach, or successful audience dialogue without evaluation.'],
        ['Why keep diagnostic and intervention evidence separate?', 'They answer different questions: what people initially think and what changes after a particular educational experience.']
      ],
      'leave-behind': [
        ['What is the core educational contribution?', 'The team tested an initial assumption and built tools for two distinct jobs: food-safety decisions and synthetic-biology understanding.'],
        ['How can another team use the work responsibly?', 'Reuse the available tools together with their evaluation framework, keeping the learning objective and actual audience evidence explicit.', 'education.html#reuse']
      ]
    },
    'attributions.html': {
      '*': [
        ['How is project credit organized?', 'The page separates student work, advisor and institutional support, external contributions, prior work, software, and media.', 'attributions.html#student-work'],
        ['Does the wiki replace the official attribution form?', 'No. The official form and its verified team-specific link are separate deliverables.', 'attributions.html#official-form'],
        ['How is AI assistance distinguished from scientific evidence?', 'The page records assistance and its verification boundary; generated scientific data, experimental results, stakeholder quotations, and citations are outside the stated intended use.', 'attributions.html#ai-boundaries']
      ],
      'official-form': [
        ['Why link the official attribution process separately?', 'A wiki summary is not the official project attribution form. The page distinguishes the public record from the required deliverable.'],
        ['Does a dashboard link prove the team form is submitted?', 'No. A dashboard route provides access; a team-specific form and its submission state require their own verified record.']
      ],
      'student-work': [
        ['Why organize student credit by work package?', 'It ties credit to actual project work rather than distributing identical descriptions across everyone.'],
        ['Does a workstream label capture the whole contribution?', 'It is an overview. The attribution table provides the more specific work-package account.']
      ],
      'advisors-support': [
        ['How should advisor help be described?', 'The record should name the specific guidance, training, or institutional support received rather than using generic credit such as “everything.”'],
        ['Why distinguish student execution from outside support?', 'It makes the project’s provenance clear and lets a reader understand how the work was actually produced.']
      ],
      'external': [
        ['Is a sponsor the same as a scientific collaborator?', 'No. The page distinguishes intellectual contribution, training, material donation, paid services, and sponsorship.'],
        ['What should accompany an external logo or contribution?', 'The specific role and the relevant publication permission or license should be recorded rather than inferred from the logo alone.']
      ],
      'prior-work': [
        ['Why name adaptations as well as citations?', 'A citation supports a source claim; an adaptation statement explains how reused ideas, tools, or resources entered this project.'],
        ['Does acknowledging prior work reduce the new contribution?', 'It defines the starting point, allowing the AeroSense-specific integration and engineering work to be identified accurately.']
      ],
      'software-licenses': [
        ['Does publicly accessible software automatically mean open source?', 'No. The stated license determines reuse conditions; access alone does not establish an open-source license.'],
        ['Why list software licenses individually?', 'Different components can have different obligations, so the project’s overall license should not be assumed to replace each dependency’s terms.']
      ],
      'asset-credits': [
        ['Can a team logo or supplied image be published without checking its terms?', 'The attribution record calls for checking the relationship and publication permission or compatible license for third-party assets.'],
        ['Why distinguish original team media from third-party media?', 'Their authorship and reuse rights differ, and a clear credit record preserves that distinction.']
      ],
      'responsible-ai': [
        ['What should an AI-use disclosure record?', 'It should identify the assistance actually used and the information visible to the operator, without guessing a hidden model or version.'],
        ['Does AI assistance remove the need for team verification?', 'No. Scientific statements, citations, data interpretations, and the final published content still require responsible human review.']
      ],
      'ai-boundaries': [
        ['Can an illustrative animation be treated as experimental evidence?', 'No. Illustration and interface assistance must remain distinct from scientific data, microscopy, results, and stakeholder quotations.'],
        ['Does a written AI policy prove every use followed it?', 'The section distinguishes the intended boundary from the team review needed to confirm actual practice.']
      ],
      'license': [
        ['Does the wiki’s license cover every linked asset?', 'The team-authored content’s intended CC BY 4.0 release does not replace the separate terms of third-party software, photographs, logos, or documents.'],
        ['What does reuse of team-authored content require?', 'The stated CC BY 4.0 terms include attribution. Check separately licensed components before assuming the same permissions apply.']
      ]
    },
    'glossary.html': {
      '*': [
        ['How is Glossary different from Project Search?', 'Glossary explains terminology. Project Search finds pages and sections; the fly’s field guide explains questions about the current reading context.', 'glossary.html#glossary-index'],
        ['Are the dotted terms on other pages different definitions?', 'They open the same glossary explanations by hover, keyboard focus, or tap, so terminology is consistent across the wiki.', 'glossary.html#glossary-index'],
        ['Does knowing a term explain how AeroSense uses it?', 'A definition gives the general meaning. The linked project context explains the role, design choice, and evidence in AeroSense.', 'description.html#pipeline']
      ],
      'glossary-index': [
        ['Why separate a definition from an experimental claim?', 'A term can describe an established mechanism without demonstrating that a specific AeroSense construct or device performs as intended.'],
        ['What should I read after a definition?', 'Follow the relevant project page for the mechanism’s role and evidence; Description introduces the measurement chain.', 'description.html#pipeline']
      ]
    }
  });
  // Assessment guidance is shared because the five modules use the same local
  // pre/post engine. It deliberately does not disclose the keyed quiz answers.
  const assessmentQuestions = {
    'lm-pre': [
      ['Why answer before reading the lesson?', 'The three questions record your starting point so you can compare it with your own post-lesson score. Choose what you currently think; explanations come after the lesson.'],
      ['Who receives my starting score?', 'The learning record is stored in this browser. This activity does not send your answers to the team or produce a published class result.']
    ],
    'lm-post': [
      ['Why do the same ideas appear again?', 'The post-test revisits the pre-test concepts so the comparison concerns the same learning targets. Option order can change, and explanations follow each answer.'],
      ['Does a correct answer demonstrate a working sensor?', 'It checks your understanding of the lesson. It is separate from experimental evidence about AeroSense or an evaluation of the resource with a learner group.']
    ],
    'lm-gain': [
      ['What does this score change measure?', 'It compares your pre- and post-test scores within this module on this device. It is not a class average or a published educational-effectiveness result.'],
      ['Can one score change prove the lesson caused learning?', 'A personal comparison is useful feedback. Establishing an intervention effect requires a suitable evaluation design and evidence beyond one browser record.', 'education.html#how-we-measure']
    ]
  };
  Object.assign(pages, {
    'learning-platform.html': {
      '*': [
        ['Is the Learning Lab a demonstration of the actual sensor?', 'It is a set of interactive lessons about the sensing chain. Illustrative patterns and fictional QC cases teach reasoning; the research pages report project evidence.', 'learning-platform.html#layers'],
        ['Do I have to complete the modules in order?', 'No module is locked. The suggested order follows molecules, food-risk questions, sensing biology, decoding, and responsible action.', 'learning-platform.html#learn-journey'],
        ['Does this website send my learning scores to the team?', 'The dashboard reads a local browser record of progress, scores, and reflections. It is not a collection of class results.', 'learning-platform.html#learn-progress']
      ],
      'why': [
        ['Why use an interaction to explain something invisible?', 'Changing a pattern or a decision makes hidden steps easier to compare: molecule recognition, fluorescence, representation, and the action that follows.'],
        ['What should I learn beyond the project vocabulary?', 'The activities ask what an observation supports and where another measurement is needed, so knowing a term becomes reasoning about evidence.']
      ],
      'learn-journey': [
        ['Why does the journey start with smell rather than the device?', 'Combinatorial odor coding explains why the project uses a receptor panel and later interprets a pattern instead of relying on one channel.'],
        ['Can I jump directly to the decision activity?', 'Yes. The five modules are open independently; Module 5 explores how a screening result changes a next action.', 'learning-05-act.html#lm-interact']
      ],
      'layers': [
        ['Why separate biology, engineering, and decision-making?', 'A receptor event, a trustworthy optical reading, and a responsible action are different steps. A useful conclusion depends on the links between them.'],
        ['Why is fluorescence not already the final answer?', 'A glow needs measurement and interpretation. The lesson follows the detector and electronics, then asks what the resulting pattern can justify.']
      ],
      'different': [
        ['Does the progress feature mean learning effectiveness has been measured?', 'It provides an individual pre/post comparison. Published learning outcomes require an audience evaluation, which is a different kind of evidence.'],
        ['Why include uncertainty in a beginner activity?', 'A learner should understand both the useful information in a signal and the limits of the conclusion, especially when a screening result guides a food-risk decision.']
      ],
      'learn-progress': [
        ['Why is my progress different on another device?', 'The record belongs to this browser; it is not an account synced to a server. Another device has its own local record.'],
        ['Does the completed-module count describe other learners?', 'No. It summarizes this browser’s module status, scores, and reflections rather than the number of participants or a class outcome.']
      ],
      'educators': [
        ['What can I use for a class right now?', 'This section contains module summaries, a suggested sequence, and printable discussion prompts. Use the available lesson pages; a listed future toolkit is not a downloadable resource.'],
        ['Does the module order match the team’s workstream chart?', 'It follows the functional sensing chain, from odor recognition to a decision. That is different from organizing a team into Wet Lab, Hardware, Model, and Human Practices.']
      ],
      'start': [
        ['What is a useful first question to carry into Module 1?', 'Ask why one odor can activate several receptors and why a shared receptor response does not mean two odors are identical.', 'learning-01-smell.html#lm-learn'],
        ['Where should a learner with limited time begin?', 'Choose the module closest to the question you want to understand. All modules remain accessible without completing earlier quizzes.', 'learning-platform.html#learn-journey']
      ]
    },
    'learning-01-smell.html': {
      ...assessmentQuestions,
      '*': [
        ['Does one odor activate just one receptor?', 'The lesson presents combinatorial coding: overlapping combinations of receptor responses carry information about an odor.', 'learning-01-smell.html#one-odor'],
        ['Are the colored receptor values biological recordings?', 'They are normalized teaching values for a conceptual simulation. They are not experimental AeroSense measurements.', 'learning-01-smell.html#lm-interact'],
        ['Does a sparse pattern identify the odor by itself?', 'Sparse coding changes the representation. A downstream comparison or readout still has to interpret the remaining pattern.', 'learning-01-smell.html#sparse-codes']
      ],
      'lm-hero': [
        ['Why distinguish an airborne molecule from the experience of smell?', 'Molecules reach receptors first; the experience is assembled from the resulting activity. The lesson follows that information pathway.'],
        ['Is the fly pathway shown here AeroSense hardware?', 'No. It is a teaching sketch of biological inspiration. The engineered sensing and readout architecture is documented separately.', 'description.html#pipeline']
      ],
      'lm-objectives': [
        ['What should I be able to explain at the end?', 'Explain how molecules reach receptors, how overlapping receptor combinations encode odors, and why a sparse representation can help distinguish similar patterns.'],
        ['Does this module teach odor identification from a single channel?', 'It teaches why a whole response pattern matters. One channel can participate in more than one odor representation.']
      ],
      'lm-learn': [
        ['Are all odorant molecules VOCs?', 'The lesson deliberately avoids that generalization. Its central point is that airborne molecules reach receptors before perception is constructed.'],
        ['Why is broad receptor tuning useful?', 'Overlapping responses let a limited receptor family represent many odors through different combinations rather than a separate receptor for every odor.']
      ],
      'what-is-smell': [
        ['What does volatility contribute to sensing?', 'It concerns how readily a molecule can leave a source and travel in air to a receptor. Reaching the receptor comes before interpreting its response.'],
        ['Does a molecule’s name fully describe how it smells?', 'This lesson separates the arriving chemistry from the perception assembled from receptor activity. The two are not interchangeable descriptions.']
      ],
      'one-odor': [
        ['Why can two odors share an active receptor?', 'A receptor can respond to more than one odor. Different combinations across the panel can still distinguish their response patterns.'],
        ['Can I cite the matrix values as experimental sensitivity?', 'No. The 0–1 values are normalized teaching examples rather than measured receptor sensitivities.']
      ],
      'sparse-codes': [
        ['What changes when a representation becomes sparse?', 'Only a small subset remains active. This can make overlapping patterns easier for a later readout to separate, without naming the odor on its own.'],
        ['Is a sparser image automatically a better measurement?', 'No. Sparsity is a representation choice; usefulness depends on which differences remain and how the downstream task is evaluated.']
      ],
      'lm-interact': [
        ['What should I compare when adding background noise?', 'Compare the entire receptor row for Odors A and B across raw, contrast-enhanced, and sparse views. Notice which differences survive the transformation.'],
        ['Does the activity report an AeroSense accuracy score?', 'No. It uses fictional odors to show representation changes, not a calibrated sensor, biological recording, or classifier-performance result.']
      ],
      'lm-reflect': [
        ['What makes a useful reflection here?', 'Explain what you would avoid concluding from one receptor after seeing overlapping raw patterns and their transformed views.'],
        ['Will saving a reflection send it to the researchers?', 'No. The optional reflection stays in this browser and is not transmitted to a server.']
      ],
      'lm-takeaway': [
        ['What is the central idea to remember?', 'An odor is represented by a pattern of activity. A shared receptor response does not make the entire pattern identical.'],
        ['What is the limit of the sparse-coding analogy?', 'It explains a possible representation strategy. Whether it improves a real decoder requires an appropriate empirical comparison.', 'model.html#training-evaluation']
      ],
      'lm-next': [
        ['Why study mold after learning odor patterns?', 'Module 2 asks what a sensory cue can support and separates odor change, fungal growth, and mycotoxin status.', 'learning-02-mold.html#lm-learn'],
        ['Can I revisit the pattern exercise later?', 'Yes. Modules remain open independently; navigation does not require a particular quiz score.', 'learning-01-smell.html#lm-interact']
      ]
    },
    'learning-02-mold.html': {
      ...assessmentQuestions,
      '*': [
        ['Why separate mold from mycotoxins?', 'Mold is a living fungus; mycotoxins are chemical metabolites some molds produce. An observation of one does not quantify the other.', 'learning-02-mold.html#two-claims'],
        ['Is the nut-batch activity a real AeroSense result?', 'It is a fictional teaching file used to examine what sensory observations and storage records can support.', 'learning-02-mold.html#lm-interact'],
        ['What kind of conclusion is the lesson teaching?', 'Match the conclusion to the evidence. An odor-pattern cue is different from a confirmatory chemical measurement or food-safety clearance.', 'learning-02-mold.html#two-paths']
      ],
      'lm-hero': [
        ['Why call this a risk you cannot see?', 'The lesson distinguishes visible appearance from chemical status. It asks which measurement is needed for each kind of claim.'],
        ['Is this page a food-disposal decision chart?', 'It is an evidence-literacy lesson built around common claims, not an individual food diagnosis or a replacement for food-specific safety guidance.']
      ],
      'lm-objectives': [
        ['What distinctions should I be able to make?', 'Separate fungal growth, odor-pattern change, and toxin contamination, then examine the evidence behind a food-safety claim.'],
        ['Why pay attention to words such as always or completely?', 'An absolute claim can promise more than a sensory observation or a treatment step establishes. The lesson asks you to inspect that logical gap.']
      ],
      'lm-learn': [
        ['What do the three myth cases have in common?', 'Each asks whether an everyday observation or action can settle a broader chemical-safety question. The relevant evidence and conclusion are shown separately.'],
        ['How does this connect to AeroSense?', 'The project investigates odor-pattern screening. A chemical toxin concentration remains a distinct question with a different measurement pathway.', 'description.html#is-and-is-not']
      ],
      'two-claims': [
        ['Why can’t a visible colony serve as a toxin concentration?', 'Growth and chemical metabolites are different objects of measurement. Seeing a colony does not supply a quantitative chemical result.'],
        ['Why retain separate language for odor, mold, and toxin?', 'It keeps a useful screening cue from being mistaken for the identity or concentration of a hazardous chemical.']
      ],
      'myth-remove': [
        ['What is this case asking me to examine?', 'Examine whether a rule about removing a visible region can be generalized across food structures and chemical questions. Read the evidence before choosing the scope of the claim.'],
        ['Does this activity provide a rule for a specific food in my kitchen?', 'No. It explains the limits of generalization and points to appropriate food-specific guidance; it is not an assessment of your food.']
      ],
      'myth-heat': [
        ['Why distinguish an organism from its metabolites?', 'A treatment’s effect on living cells and its effect on a chemical compound are separate claims that require relevant evidence.'],
        ['Is the lesson claiming all processing methods have identical effects?', 'No. The case examines an absolute claim about complete risk removal rather than treating every toxin, process, and condition as the same.']
      ],
      'myth-look': [
        ['What kind of evidence does sensory inspection provide?', 'It provides observations about appearance and smell. The lesson asks whether those observations answer the separate chemical-status question.'],
        ['Why does sampling matter when interpreting a normal appearance?', 'The inspected surface is only part of the food or batch. A sensory observation should not silently become a claim about every part of it.']
      ],
      'two-paths': [
        ['Why draw two pathways instead of one continuous diagnosis?', 'Fungal metabolism may change volatile patterns, while mycotoxin concentration calls for a defined chemical test. The two claims should remain explicit.'],
        ['What role could an odor-pattern screen play?', 'It could help prioritize follow-up investigation. It would not become a toxin assay simply because its cue is associated with deterioration.']
      ],
      'lm-interact': [
        ['Are these observations from a real stored batch?', 'No. The nuts, storage notes, and observations are fictional exhibits for an evidence-reasoning exercise.'],
        ['How should I approach the investigation?', 'Inspect all exhibits, separate observations from assumptions, and choose a conclusion no stronger than the file supports. Feedback explains the reasoning after your choice.']
      ],
      'lm-reflect': [
        ['What should my reflection focus on?', 'Choose a claim whose evidence boundary became clearer: what a look, smell, or treatment step can support, and what would need another kind of test.'],
        ['Is my written reflection part of a research dataset?', 'It is an optional local browser record. Saving it does not submit it to the team.']
      ],
      'lm-takeaway': [
        ['Does an invisible hazard mean every uncertain batch is contaminated?', 'No. Uncertainty is a reason to match the next assessment to the unanswered question, not proof of contamination.'],
        ['What should an AeroSense explanation avoid promising?', 'It should not turn odor-pattern screening into a direct mycotoxin concentration or a declaration that food is legally safe.']
      ],
      'lm-next': [
        ['How does the next module address this measurement problem?', 'Module 3 explains the proposed receptor, co-receptor, and fluorescent reporter pathway that would turn molecular recognition into a readable signal.', 'learning-03-synbio.html#lm-learn'],
        ['Where are the project’s research boundaries described?', 'Description explains what AeroSense is intended to screen and how that differs from confirmatory toxin testing.', 'description.html#is-and-is-not']
      ]
    },
    'learning-03-synbio.html': {
      ...assessmentQuestions,
      '*': [
        ['Is AeroSense putting a whole fly nose into food?', 'No. The lesson describes selected insect receptor proteins expressed in a mammalian-cell chassis as an engineered information pathway.', 'learning-03-synbio.html#not-a-nose'],
        ['Are GCaMP and mCherry doing the same job?', 'GCaMP reports a calcium change; mCherry serves as an expression marker. The lesson separates sensing conversion from evidence that a construct is expressed.', 'learning-03-synbio.html#three-parts'],
        ['Does completing the assembly prove the construct works?', 'The activity is a conceptual assembly, not a plasmid map or functional experiment. Research observations are reported separately.', 'learning-03-synbio.html#lm-interact']
      ],
      'lm-hero': [
        ['What makes this a living sensor concept?', 'The proposed pathway places odor-recognition proteins and a calcium reporter in living cells, followed by an external optical readout.'],
        ['Is the light itself a food-safety decision?', 'No. A fluorescent response would be one measurement layer; interpretation and responsible follow-up come afterward.']
      ],
      'lm-objectives': [
        ['Why ask what happens when a component is removed?', 'It tests whether you understand each component’s role in the chain, rather than only remembering the names.'],
        ['Why is containment one of the learning objectives?', 'A living sensing system needs a boundary between engineered cells and the food-handling environment. That boundary is part of the system design.']
      ],
      'lm-learn': [
        ['Where does recognition happen, and where does readout happen?', 'The proposed OR/Orco layer recognizes and transduces the odor cue. GCaMP links calcium to fluorescence; an external detector reads that light.'],
        ['Why does the lesson separate published inspiration from team evidence?', 'A published receptor-reporter method motivates the architecture but does not establish that a specific AeroSense construct functions in the team’s system.']
      ],
      'not-a-nose': [
        ['What does heterologous expression mean here?', 'It means expressing insect receptor components in the HEK293T host-cell system, rather than measuring a complete fly nose.'],
        ['Where should I look for exact construct maps?', 'Parts documents the construct architecture and sequence resources; this lesson keeps the functional pathway in the foreground.', 'parts.html#sensor-builder']
      ],
      'three-parts': [
        ['Why are the photodiode and classifier outside the biological layer?', 'The photodiode reads emitted light, and computation interprets measured patterns. Neither is a protein that performs recognition inside the cell.'],
        ['Why keep an expression marker separate from a calcium reporter?', 'Expression and function answer different questions. An expression marker indicates a construct’s presence, while a calcium reporter supports a controlled response assay.']
      ],
      'lm-interact': [
        ['Do I need to drag with a mouse?', 'No. You can tap a part and then tap a destination zone. Pointer dragging is an additional way to use the same activity.'],
        ['What does the assembly challenge represent?', 'It organizes the conceptual biological, readout, and computation layers. It is not a cloning protocol or evidence of measured sensor performance.']
      ],
      'lm-reflect': [
        ['What should I explain about a missing part?', 'Describe which link in recognition, reporting, measurement, or containment would be affected and why that role matters.'],
        ['Is the optional reflection uploaded?', 'No. It is saved only in this browser; it is not a message to the team.']
      ],
      'lm-takeaway': [
        ['What is the key synthetic-biology idea?', 'Molecular recognition can be connected to a reporter as an engineered information pathway. Each link has a distinct function.'],
        ['Does building the information pathway remove the need for safety design?', 'No. Containment remains a separate requirement for a living sensing system.', 'safety-and-security.html#safe-to-deploy']
      ],
      'lm-next': [
        ['Why move from one fluorescent response to a pattern?', 'A panel produces several channels. Module 4 examines how those channels form a fingerprint and how representation affects interpretation.', 'learning-04-decode.html#lm-learn'],
        ['Where can I examine the actual design rationale?', 'Design connects receptor choice, reporter topology, and the experimental verification logic.', 'design.html#current-architecture']
      ]
    },
    'learning-04-decode.html': {
      ...assessmentQuestions,
      '*': [
        ['Is this interactive canvas the AeroSense decoder?', 'No. It is a teaching simulation of pattern representations, not the project model or a report of experimental accuracy.', 'learning-04-decode.html#signal-to-pattern'],
        ['What does the activity’s output mean?', 'It shows teaching resemblance between illustrative patterns. It is not a calibrated probability, model score, or food-safety verdict.', 'learning-04-decode.html#lm-interact'],
        ['Can a classifier repair an unreliable measurement?', 'The classifier can interpret only the information it receives. Measurement quality and validation remain necessary upstream.', 'learning-04-decode.html#upstream']
      ],
      'lm-hero': [
        ['What makes a response fingerprint different from a single signal?', 'The fingerprint combines several channels. Its information lies in their pattern, including overlap and differences.'],
        ['Does a confident-looking label prove a sample belongs to a class?', 'A label still depends on input quality, suitable reference data, and validation. Its appearance alone supplies none of those.']
      ],
      'lm-objectives': [
        ['Why learn contrast and sparse coding before interpreting labels?', 'They are transformations of a representation. Understanding their role helps separate a useful visualization from a validated classification claim.'],
        ['What should I look for when two patterns are similar?', 'Compare which channel differences persist, what noise changes, and whether a mixture remains ambiguous after transformation.']
      ],
      'lm-learn': [
        ['Why can a mixture be harder to classify than a reference sample?', 'A multi-channel row can lie between reference patterns without belonging cleanly to either. The lesson uses that ambiguity to examine label confidence.'],
        ['What does ablation mean in this lesson?', 'A processing step is switched off to examine what it contributes. The comparison is conceptual; an experimental benefit requires a real evaluation.']
      ],
      'signal-to-pattern': [
        ['Are the AL-like and MB-like stages anatomical simulations?', 'They are teaching analogies for contrast enhancement and sparse representation. They are not a detailed anatomical model or the project’s trained decoder.'],
        ['Does a transformed pattern by itself identify a chemical?', 'No. A representation still needs a relevant comparison or readout, and the resulting label requires appropriate validation.']
      ],
      'upstream': [
        ['Why trace the pathway before the classifier?', 'Biology, optical measurement, and calibration shape the input. The last processing step cannot establish that those earlier steps were trustworthy.'],
        ['Why does an attractive sparse plot need a separate performance test?', 'The plot shows a representation. A performance claim needs a defined task, dataset, and evaluation protocol.', 'model.html#training-evaluation']
      ],
      'lm-interact': [
        ['What should I change to explore the representation?', 'Compare Sample A, Sample B, and a mixture; then add noise or disable a processing stage. Watch how the whole row changes, not only its brightest channel.'],
        ['Can I report the teaching resemblance as model accuracy?', 'No. The activity is illustrative and does not compute experimental AeroSense accuracy or validated confidence.']
      ],
      'lm-reflect': [
        ['What makes a useful response to the reflection prompt?', 'Identify a conclusion you would withhold after seeing an ambiguous mixture, and explain which evidence would be needed before accepting a confident label.'],
        ['Does the team automatically receive my policy or critique?', 'No. The optional text remains in this browser and is not transmitted.']
      ],
      'lm-takeaway': [
        ['What is the main limit of computational decoding?', 'It depends on the information available in the input. A downstream interpretation does not repair missing or unreliable upstream evidence.'],
        ['Where is the actual decoder benchmark explained?', 'Model specifies its surrogate corpus, representation, evaluation protocol, and reported performance separately from this educational activity.', 'model.html#data-and-network']
      ],
      'lm-next': [
        ['Why does the learning journey end with action?', 'An interpreted pattern matters through the decision it informs. Module 5 examines signal quality, error trade-offs, and appropriate follow-up.', 'learning-05-act.html#lm-learn'],
        ['Should an uncertain mixture receive the same action as a clean reference?', 'The next module asks you to consider evidence quality and uncertainty when selecting the next step, instead of relying on the label alone.', 'learning-05-act.html#lm-interact']
      ]
    },
    'learning-05-act.html': {
      ...assessmentQuestions,
      '*': [
        ['Are low, medium, and high risk toxin concentrations?', 'No. They are teaching action prompts for a screen, not a chemical concentration or a product-release certificate.', 'learning-05-act.html#screening-vs-confirm'],
        ['Are the four QC files real warehouse data?', 'They are fictional batches designed to compare evidence quality, history, and next actions. They are not experimental AeroSense results.', 'learning-05-act.html#lm-interact'],
        ['Why consider false positives as well as false negatives?', 'A missed concern and an unnecessary hold or test have different consequences. A decision policy needs to state that trade-off.', 'learning-05-act.html#errors']
      ],
      'lm-hero': [
        ['What changes when I become the QC manager in this activity?', 'You move from interpreting a signal to choosing a defensible next action with incomplete evidence. The task is about reasoning, not declaring a toxin result.'],
        ['Does every screening result have one universal action?', 'The activity asks you to consider the band alongside quality, history, and storage context. A label alone does not determine every operational choice.']
      ],
      'lm-objectives': [
        ['What should I be able to explain after this module?', 'Distinguish screening from confirmation, interpret risk bands cautiously, and explain how error costs and uncertainty affect decisions.'],
        ['Why is uncertainty part of the decision rather than a footnote?', 'The trustworthiness of the signal changes which action is justified. Poor-quality evidence should not be treated as a finished risk measurement.']
      ],
      'lm-learn': [
        ['Why separate an early warning from a confirmatory assay?', 'They answer different questions. A screen can prioritize attention, while a confirmatory method addresses a defined analyte under its own procedure.'],
        ['Who determines how costly each error is?', 'That is an operational policy choice tied to consequences. The lesson does not invent a universal cost ratio or threshold.']
      ],
      'screening-vs-confirm': [
        ['What should a screening band do?', 'It should help choose a next assessment or action. It should not be silently converted into a chemical concentration or legal clearance.'],
        ['Why keep the confirmatory pathway visible?', 'It shows how an unresolved chemical question will be answered rather than allowing a convenient screening label to end the inquiry.']
      ],
      'errors': [
        ['What is different about the two error types?', 'A false negative misses a concern that deserved scrutiny; a false positive can trigger additional tests, holds, or waste. Their consequences differ.'],
        ['Why can’t one accuracy number choose the policy?', 'A decision depends on the relative consequences of errors as well as evidence quality. The operating trade-off needs to be documented.']
      ],
      'lm-interact': [
        ['What information should I read before choosing an action?', 'Inspect the screening band together with signal quality, confidence, history, and storage notes. The exercise compares your reasoning with the evidence in each file.'],
        ['Does the exercise prescribe actions for a real food batch?', 'No. Its fictional files teach distinctions between screening, uncertainty, and confirmation; they are not a real warehouse assessment.']
      ],
      'lm-reflect': [
        ['What should the policy note explain?', 'Explain how different consequences of missing a concern and sending an extra sample for confirmation would affect your decision threshold. Avoid inventing a performance number.'],
        ['Who can read the policy note when I save it?', 'It stays in this browser. Saving does not send it to the team or add it to an evaluated audience dataset.']
      ],
      'lm-takeaway': [
        ['What does responsible sensing mean in this lesson?', 'Understand both the information a system detects and the conclusions that information cannot support. Then select a next action that matches the evidence.'],
        ['Does completing this lesson certify food-safety competence?', 'It records an educational activity and local quiz performance. It is not a professional qualification or food-safety authorization.']
      ],
      'lm-feedback': [
        ['Why ask which information would make a warning trustworthy?', 'The choices make communication needs explicit: quality, confidence, history, reasons, and follow-up information can shape how a warning is understood.'],
        ['Is this feedback automatically submitted to AeroSense?', 'No. The current form saves only on this device. Its structured fields are not evidence that a response was transmitted or reviewed.']
      ],
      'lm-next': [
        ['What should I read after completing the learning journey?', 'Education explains why the resources were designed and how evidence of understanding is separated from simply building a resource.', 'education.html#measurement-chain'],
        ['Where can I review my own progress?', 'The learning dashboard links to the record stored in this browser. It represents your local activity, not a published evaluation.', 'learning-platform.html#learn-progress']
      ]
    }
  });
  const output = {};
  for (const [page, sections] of Object.entries(pages)) {
    output[page] = {};
    for (const [section, rows] of Object.entries(sections)) {
      output[page][section] = rows.map(([q, a, href]) => ({q, a, href:href || page + (section === '*' ? '' : '#' + section)}));
    }
  }
  window.AEROSENSE_SECTION_QUESTIONS = output;
})();
