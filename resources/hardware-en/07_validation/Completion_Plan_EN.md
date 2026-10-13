# Completion plan: 11–20 October


GCaMP6f-expressing HEK293 cells and Gibco DMEM are available. PCB readiness, cell health, resin suitability, and the number of available well sets remain unconfirmed. These dates specify conditional work, not completed work. LEE 101 could arrive on 14–16 October or as late as 20 October. The main schedule requires a usable filter **by 16 October**.

## Seven tasks and their evidence

| Task | Available now | Next action and completion condition | Preserve |
|---|---|---|---|
| 1 Assemble printed parts | Eight STLs, exploded view, gasket template, and reported physical capacity | Keep four-well geometry and alignment unchanged. Check antenna, board height, and battery clearance without power. Check capacity and leakage away from the PCB. | Overall, interface, and well-seat photos; dimensions and problems |
| 2 Flash and operate | Buildable firmware, LittleFS, and developer manual; physical results remain unconfirmed | The developer completes flashing with 3.3 V UART. Check supply, ADC, start, stop, export, and D1–D4 orientation. | Firmware identity, settings, physical JSON, and video; DEMO is not hardware evidence |
| 3 Complete main manuals | Bilingual developer/user Markdown and PDFs, including assembly illustrations and supplier checklist | Add actual assembly photos and difficult steps. Put accepted changes into current sources. Rebuild affected documents. | Current manuals, photos, and reasons for changes |
| 4 Short user trial | Existing blank bilingual questionnaires | Ask 2–3 non-designers to try empty wells, DEMO, and CSV export. Revise 1–2 main problems and retest. | Anonymous observations; problem → change → retest; untested tasks |
| 5 Fluorescence standard | Preparation procedure, complete sequence, and analysis | Use sodium fluorescein. In the main route, complete illuminated blanks, single-well conditions, and concentrations for one filter configuration first. | Raw JSON, specified raw ADC, standard details, and three analysis figures |
| 6 Cell comparison | Existing GCaMP6f HEK293 and DMEM; no device cell results | In the main route, measure cells after optical validation passes. The accelerated branch requires the checks, calibration, and controls below. | Device/reference traces, batches, stimulus timing, vehicle, and positive controls |
| 7 Prepare Wiki | Local drafts, model figures, reproduction sources, and Wiki downloads | Show methods, evidence, and limits on main pages. Link reproduction sources and Wiki downloads. Trace numbers to original files. | Captions, actual sample units, sources, and usable downloads |

## Dates and decision points

| Date | Required work | Parallel work and conditions |
|---|---|---|
| 11–13 October | Assemble. Check capacity and leakage away from the PCB. Flash firmware. Check dark ADC, stop, and export. Resolve faults that prevent measurement. | Prepare standards and equipment. Book the reference instrument and participants. Check cell health and positive response. Draft Wiki methods and model sections. |
| 14–16 October | Install one LEE 101 layer after delivery. Check leakage, clipping, and fluorescent response. In the main route, complete the full standard series next. | Start culture early only with suitable spare wells and an established calibration-transfer method. One four-well set cannot support PBS testing and culture together. |
| By 17 October | Finish standard analysis and necessary corrections. Confirm cell materials, health, controls, environment, and available same-day calibration. | Seeding on 17 October gives 48 hours only on 19 October. There is almost no reserve. Remove cell results from required deliverables if conditions fail. |
| 18–19 October | Compare cells only when ready. Keep controls. Complete fault corrections and user-trial retests. | In the accelerated branch, complete later dye tests and combined interpretation. Freeze original data, exclusions, and conclusions on the evening of 19 October. |
| 20 October | Finish figures, feedback, English, citations, costs, and downloads. Check videos and pages. Upload the package. | Check that uploaded files and backups open. State pass, fail, or not done. Do not add unsupported claims. |

The earlier plan estimated 60–120 minutes for a complete standard series with familiar operations and no faults. Reserve half a day for exchange, analysis, and troubleshooting. Sampling time for 45 blocks is not the complete experiment duration.

If delivery by 16 October is unlikely, seek the same LEE filter on loan. If delivery occurs on 17–18 October, prioritize cell-free testing. Keep cells only in a branch that is already prepared. If delivery occurs on 19–20 October, do not promise device cell results in this round. Delivery on 20 October is after the experiment freeze. If another filter is used, describe and calibrate that actual filter.

Protect this sequence: assembly → physical readout → standard result → independent use and revision → Wiki. A complete test with one LEE layer does not validate all four filter configurations. Label the other configurations as simulated or pending.

## Work before filter delivery

1. Complete assembly and electrical checks in the [developer manual](../04_manuals/Developer_Manual_EN.md).
2. Check working volume, closure, and leakage away from the PCB.
3. Confirm that small-volume exchange keeps liquid away from the powered PCB.
4. Practice stop, labels, export, and analysis with data marked DEMO.
5. Prepare sodium fluorescein, one PBS batch, tips, and light-protected containers.
6. Prepare fresh dye working solutions on the experiment day.
7. Maintain healthy cells in standard culture vessels with the established DMEM conditions.
8. Confirm availability of the reference instrument, vehicle, and known positive control.
9. Arrange the short empty-well and DEMO trial below.

If resin suitability is unconfirmed, first perform the resin-well comparison in the [sample guide](Fluorescence_and_Cell_Test_EN.md). Use standard culture vessels as controls. This work can run beside hardware preparation, but it still requires wells and cells. A near delivery date does not establish compatibility. LED checks without a filter still require electrical checks and the clipping stop rule.

## Main route and accelerated branch with early culture

**Main route: complete dye validation → pass analysis → measure cells.** Follow the [validation plan](Validation_Plan_EN.md). Use a separate complete series for each filter configuration. The formal nine conditions require 45 valid blocks. Save DARK separately. Collect five additional blocks for live phase calibration. Download B_CAL and ALL_C raw ADC immediately after each condition. The next condition can overwrite this data.

**Accelerated exploratory branch: short optical pilot and valid same-day calibration → prepared cells → complete dye validation → combined interpretation.** Early culture can remove waiting after delivery. It does not establish material or measurement suitability. This order differs from the current validation plan. Initially classify the cell data as exploratory. Define conclusions after optical and biological controls are assessed. A later dye pass does not automatically validate earlier quantitative cell results.

### Minimum checks on the delivery day

1. Fix the final filter, well set, working volume, and LED settings.
2. Check DARK raw ADC and timing.
3. Measure an illuminated cell-free blank with the actual DMEM or assay matrix.
4. Check for clipping, abnormal drift, and unstable background.
5. Use a known fluorescent reference to confirm a response distinguishable from the blank.
6. Collect at least five valid blank-calibration blocks with the existing collector.
7. Collect a suitable phase reference and an independent blank check.
8. Install cells with the established well-exchange and calibration-transfer method.
9. Check actual sample temperature, pH, volume, and attachment.
10. Collect stable unstimulated F0 before the established stimulus and control procedure.

The phase collector also requires at least five valid blocks. Observe cell F0 for 2–5 minutes, as specified in the sample guide. Save at least five valid baseline blocks. Maintain verified actual sample temperature at 37°C and suitable DMEM conditions. Keep the gas pump off during the first cell pilot.

These checks distinguish useful signal from background. They do not serve only to complete a checklist. If fluorescence is indistinguishable, clipping occurs, or calibration fails, resolve the cause first.

Check attachment after 4–6 hours. Check morphology and contamination after 18–24 hours. Assess health and positive response after 24–48 hours. **The 24–48-hour period is an assessment window, not a guaranteed preparation time.** If only frozen cells are available, complete the established recovery procedure first. Time after thawing does not establish readiness in the wells.

### One well set or two well sets

| Configuration | Possible sequence | Required condition |
|---|---|---|
| One four-well set, not seeded | Complete PBS/dye testing first. Prepare for cells with qualified cleaning and aseptic procedures. | Cell testing still needs valid same-day medium blank and phase calibration. Do not reuse calibration from an earlier day or boot automatically. |
| One four-well set, all seeded | Preserve raw cell signals as exploratory observations. | The same set cannot provide a cell-free DMEM blank and dye reference simultaneously. Without validated transfer, do not claim reliable calibrated ΔF/F0. |
| Two compatible well sets | Keep A for same-day cell-free blanks and references. Culture cells early in B. | Establish exchange alignment, resin background, and optical differences first. Identical design files or resin do not guarantee equivalent calibration. |

If B was seeded without comparable A↔B blank and transfer evidence, A can still check the reader. Quantitative background in B still depends on an unresolved assumption. A reboot requires valid calibration for that boot. Reusing a context name does not remove assembly changes.

One empty well beside three cell wells is not a whole-device cell-free blank. This device has one PD, and the four wells have optical crosstalk. Do not store live cells as the optical blank. A PBS blank cannot replace the actual DMEM blank.

### What later dye testing can establish

Later testing can assess concentration response, single-well transfer, fixed-background correction, and technical repeatability at the end of testing. Together with earlier checks, it can help identify reader changes. After cell removal, confirm cleaning and absence of carryover. Cells, proteins, and residual medium can contaminate the dye blank.

Later testing cannot recover earlier clipped data, incorrect timing, missed fast peaks, or unmeasured DMEM blanks and phase references. It cannot establish earlier cell health or stimulus effectiveness. If data is missing, retain the original result and limit the conclusion. Do not use a later pass to reconstruct earlier calibration.

## Different meanings of “at least three times”

| Meaning | What it can support | Report |
|---|---|---|
| Three readout blocks from the same sample | Short-term technical readout behavior | Three technical blocks, not three cell experiments. Keep the required calibration and baseline block counts. |
| Three stimuli in the same well and culture | Repeated measurements or stimuli in one sample | One sample, three stimuli. Confirm recovery and baseline through the established assay. Do not force unrecovered repetitions. |
| Three independently prepared, cultured, and tested runs | Reproducibility across complete experiments | Actual culture batches, independent runs, and controls in each run. Three waveforms alone are insufficient. |

For three wells from one culture batch, report “3 wells, 1 culture batch.” Independence depends on separate treatment and the research question. Three wells do not automatically establish three biological replicates. Four wells receiving one shared gas exposure are not four independent exposures. See the [experimental-unit methods paper](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.2005282).

## Essential short checks and stop conditions

Without power, check antenna, battery, and underside clearance. Keep liquid off the PCB. With power, check supply, abnormal heating, ADC limits, and stop control. If leakage, mechanical interference, overheating, clipping, or failed stopping occurs, resolve the fault first. Do not conceal faults with increased LED power, background subtraction, or a classifier.

Use the same phone, distance, and orientation. Operate for about two minutes each with the housing open and closed. Record command success, missing data, and timestamps. This checks communication at the intended distance. It is not RF certification. If it fails, inspect the nearby battery, metal, wiring, and housing.

Use the standard preparation in the [sample guide](Fluorescence_and_Cell_Test_EN.md). Dye checks fluorescent readout, mixing, and concentration response. It does not establish GCaMP sensitivity, gas-phase t90, or odor recognition. Current two-second blocks and idle intervals of at least three seconds can miss fast peaks. Use an established sustained response, a faster reference trace, and the same comparison window.

## User trial: shortened tasks in 5–10 minutes

Use the updated [short blank questionnaire](User_Feedback_EN.md). Plan 5–10 minutes. The developer prepares dry, unpowered empty-well demonstration parts and a connectable DEMO interface. Prepare connection settings and the download location. Participants do not flash firmware, connect power, or handle cells. The developer separately completes physical-board, standard-liquid, and required functional validation. Mark omitted tasks as untested or not applicable.

1. Ask 2–3 non-designers to read the [user manual](../04_manuals/User_Manual_EN.md).
2. With dry, unpowered hardware, ask each participant to identify empty-well orientation and replacement.
3. Ask each participant to open the prepared UI, connect to DEMO, and identify its label.
4. Ask each participant to start and stop one demonstration measurement.
5. Ask each participant to find and export CSV.
6. Ask each participant to check that the downloaded file opens.
7. Record completion, time, help, errors, and direct comments.
8. Correct the most important one or two instruction problems.
9. Retest affected tasks and keep both records.

DEMO CSV supports interface and export usability only. It is not hardware or cell data. Do not describe these shortened tasks as a complete assembly-usability test. If the same participant repeats a task, record the possible learning effect.

Put usability evidence in Hardware. Put observation → revision → retest in Engineering Cycle 5. Needs and adoption barriers can support Entrepreneurship. Learning objectives, discussion, and learning evidence can support Education. Follow the [official judging questions](https://competition.igem.org/judging/special-prizes) for the actual activity. A peer score alone does not establish customer validation or educational impact.

## Hardware evidence and claim limits

| Official topic | Evidence for this round | Claim limit |
|---|---|---|
| Synthetic-biology need | Need → specification → design; workflow limits; sourced comparisons | Support dimensions, mass, and cost. Do not only call the device cheap or portable. |
| User testing and learning | Shortened tasks, anonymous observations, changes, and retests | Blank forms are not results. State participant count, task scope, and learning effects. |
| Functional hardware proof of concept | Physical waveforms, blank/concentration plots, single-well matrix, and reassembly records | Simulation and compilation do not replace measurements. Dye does not validate cellular odor recognition. |
| Reproduction by another team | STL/CAD, BOM, main manuals, firmware, raw data, and analysis | Disclose uncertain dimensions, material suitability, and unquoted items. |

Keep the enclosure cycle: interface, fan, shielding, seal, and flow problems → design → calculations → measurements. Keep the manual cycle: difficult task → revision → task retest. Simulation alone supports a testing direction. Passed cell-free validation supports a cell-free proof of concept. Biological conclusions cover only tested samples and controls. Without real labeled data and evaluation separated by batch, do not report classification accuracy. Check the [official judge handbook](https://competition.igem.org/judging/handbook) before publication. This table does not promise an award.

## Actions today

- [ ] Assign owners for assembly/firmware, wet lab/standards, and documentation/Wiki.
- [ ] Check PCB and well-set readiness, including availability of a second compatible set.
- [ ] Confirm LEE delivery or a loan of the same filter.
- [ ] Check supply, screws, fan, gasket, and borrowed equipment against the current BOM.
- [ ] Maintain healthy cells. Start early well culture only when its conditions are met.
- [ ] Book the reference instrument and 2–3 participants for the shortened tasks.
- [ ] Fix the evening of 19 October for data freeze and 20 October for preparation and upload.
- [ ] Save original data after every measurement session. Do not retain screenshots alone.
