# Fluorescence standard first; a matched cell comparison second

Status: proposed experiment, not measured results. Prepared 2026-10-06. This is a practical supplement to [Validation_Plan_EN.md](Validation_Plan_EN.md), not another large study. Complete the existing electrical, leak, optical-filter and timing preflight first. The primary experiment should fit into one afternoon after the hardware works; the cell comparison is conditional on an already established laboratory assay.

## 1. Use sodium fluorescein

Borrow a small amount of **fluorescein sodium salt / sodium fluorescein, CAS 518-47-8**, preferably a documented laboratory stock or fluorescence-grade reagent. An identifiable purchase example is Sigma/Merck 46960; local stock and price have not been confirmed. It is a fluorescent molecule, not simply a coloured or pH-indicator solution. Avoid substituting FITC, highlighter ink or unspecified tracer mixtures. The supplier lists excitation/emission at 490/514 nm in 0.1 M Tris, pH 8.0; these are condition-specific values, not guaranteed peaks in PBS. [Supplier identity and spectral information](https://www.sigmaaldrich.com/US/en/product/sigma/46960)

The PCB's specified Würth 155124BS73200 LED has a typical 468 nm peak, 470 nm dominant wavelength and 25 nm spectral bandwidth at the datasheet's 20 mA test condition. Thus fluorescein is a practical candidate for this blue-excitation/green-detection path, although excitation is away from its alkaline-solution maximum. This overlap is an engineering inference; the actual assembled sensitivity remains to be measured. Datasheet current and luminous intensity do not establish the PCB's optical power. [Actual LED datasheet, page 2](https://www.we-online.com/components/products/datasheet/155124BS73200.pdf)

Keep buffer, pH, temperature and light exposure consistent. Fluorescein changes with pH and can bleach; increasing concentration can introduce nonlinearity, self-quenching or absorption/reabsorption effects. Published thresholds from a different cuvette or buffer are not acceptance thresholds for our wells. [Manufacturer handbook](https://www.thermofisher.com/us/en/home/references/molecular-probes-the-handbook/fluorophores-and-their-amine-reactive-derivatives/fluorescein-oregon-green-and-rhodamine-green-dyes.html), [primary sodium-fluorescein study](https://pubmed.ncbi.nlm.nih.gov/20444121/), [NIST fluorescence guidance](https://nvlpubs.nist.gov/nistpubs/ir/2007/ir7457.pdf)

## 2. Minimal materials and one starting dilution series

Use existing pipettes, tips, tubes, foil for light protection, the four finished wells and the installed emission filter. No new printed part, second dye, spectrometer or certified reference kit is required. Use one batch of **1× PBS at recorded pH approximately 7.4** for this cell-free test only. This is not a recommendation to maintain cells in PBS. All blanks and dye solutions must have matching buffer composition. Do not introduce culture-medium additives into only one concentration.

Start with **C = 0.10 µM = 100 nM** and **0.5C = 0.05 µM = 50 nM**, using 100 µL per well. These are a proposed low-concentration starting range, not an established sensitivity limit or a guaranteed detectable range for this untested PCB.

From a documented **1 mM sodium-fluorescein stock made in the same PBS**:

| Prepare | Mix | Final amount and concentration |
|---|---|---|
| Intermediate | 10 µL of 1 mM stock + 990 µL PBS | 1.00 mL at 10 µM |
| C | 50 µL of intermediate + 4.950 mL PBS | 5.00 mL at 0.10 µM |
| 0.5C | 2.50 mL of C + 2.50 mL PBS | 5.00 mL at 0.05 µM |
| Blank | Same PBS without dye | Prepare at least 10 mL, plus rinse volume |

Mix each tube before the next dilution. Have an experienced lab member check the pipette ranges and calculations. Do not weigh nanogram quantities directly. If only powder is available, **37.627 mg brought to a final 10.00 mL** gives nominal 10 mM for the anhydrous formula mass 376.27 g/mol; dilute 100 µL of that stock with 900 µL PBS to make 1 mM. Confirm the actual bottle's identity, hydration state and assay first; use its certificate when a valid mass-fraction correction is available. HPLC area percentage is not automatically a mass fraction. Otherwise label the concentration nominal and retain the weighed mass and preparation record.

Prepare working dilutions fresh for the session and protect them from unnecessary light; follow the bottle instructions for stock storage. A certified NIST-traceable fluorescein product exists, but its calibration is supplied in a different buffer and does not confer traceability on these ordinary powder dilutions. It is not a required purchase here. [Certified-standard instructions and matrix matching](https://documents.thermofisher.com/TFS-Assets/LSG/manuals/mp36915.pdf)

## 3. Brief pilot, then freeze the formal experiment

1. Finish the preflight in the main validation plan. Observe and record which physical quadrant each D1–D4 LED illuminates; do not infer this from an assumed board orientation.
2. With 100 µL per well, briefly compare blank and C at a fixed, bench-checked low LED duty. Check raw ADC clipping, timing QC and whether the response is distinguishable from the blank. Use the actual filter and closed enclosure.
3. If clipped, reduce duty or concentration and restart. If apparently undetectable, inspect mapping, filter orientation, optical alignment and raw acquisition before increasing dye. If these checks pass, one bounded fallback pilot is **C = 0.50 µM**, made with 250 µL of the 10 µM intermediate plus 4.750 mL PBS; dilute it 1:1 for 0.25 µM. This stronger range must still pass the concentration-ratio test. It is not a preferred or universally linear range.
4. If the fallback also fails, stop and diagnose the instrument. Do not keep increasing dye until a desired answer appears. Retain every pilot, then freeze concentration, duty, filter, well set, fill, room light and acquisition settings before the formal sequence. Any later setting change requires a fresh calibration and complete formal series.

## 4. One formal sequence, 45 technical blocks

Stop scheduling before opening/refilling. Fill without bubbles, dry the exterior and close the lid before measurement. Keep the same assembly/acquisition correction context; change the condition tag before collecting each state. All four LEDs operate at their configured frequencies during illuminated states.

| Tag | Contents of the four wells | Acquisition |
|---|---|---|
| DARK | All PBS; LEDs off | Save raw ADC and dark QC; separate from the 45 blocks |
| B_CAL | All PBS; LEDs on | Five valid blocks, then freeze illuminated-blank calibration |
| B_CHECK | Same PBS, new acquisitions | Five held-out blocks; never add these to calibration |
| NE_C | C only in NE; PBS in the other three | Five blocks |
| NW_C | C only in NW; PBS in the other three | Five blocks |
| SW_C | C only in SW; PBS in the other three | Five blocks |
| SE_C | C only in SE; PBS in the other three | Five blocks |
| ALL_HALF | 0.5C in all four | Five blocks |
| ALL_C | C in all four | Five blocks; also supplies the fluorescence phase reference |
| ALL_HALF_REPEAT | Fresh refill of 0.5C in all four | Five blocks |

Each block is a distinct valid 2-second acquisition, followed by the permitted idle interval of at least 3 seconds. Five blocks are technical repeats, not five biological samples. Between conditions, rinse using the laboratory's appropriate procedure and fresh matched buffer. An apparently clean-looking well does not prove zero dye carryover. If a rinse check shows persistent fluorescence, retain that record and stop treating the well as blank; do not mask retention with a new background fit. Record whether carryover was checked. Dye retention in printed resin remains a possible explanation for order-dependent results.

Keep airflow off for this first optical test, or document and hold it fixed if operation requires it. This experiment does not test gas delivery. Immediately export the session JSON and at least one blank and one fluorescent raw-ADC block; preserve settings, block IDs, invalid records and pilot data. For correction controls follow [Measured_Correction_EN.md](../03_software/guides/Measured_Correction_EN.md). Use raw I/Q for analysis, not an already corrected value from which the background would be subtracted again.

## 5. Three outputs and the correct model comparison

Run the existing `quick_check.py` as documented in the main validation plan, using the physically observed D1–D4 mapping. It produces the three needed figures: concentration response with technical SD; the single-well 4×4 transfer matrix; and independent B_CHECK before/after the frozen background subtraction. Use unsmoothed values. The predeclared criteria remain those in the main plan; do not replace failed criteria after seeing data. The half/full ratio target 0.35–0.65 is a project screening target, not a published law.

For comparison, use [volume_standard_summary.json](../02_simulation/optics/results/volume_standard_summary.json), **not the model of cells on the floor**. Rows are physical LED quadrants and columns are the fluorescent well, both ordered NE, NW, SW, SE. Normalize each measured row by its sum only after checking the signed, blank-subtracted responses are interpretable; do not silently clip negative results to force a positive matrix. The existing model's dominant-well row fractions are approximately **80.6%, 86.8%, 86.7% and 82.5%** in that order. These are simulated proportions, not measured isolation. A simulated zero from finite sampling does not prove no optical coupling.

The volume model assumes uniform weak absorption of 0.001 mm⁻¹, reference quantum yield 1, 100 µL fill, 500 µW LED on-power and ideal transparent material. The proposed dye concentration has **not** been assigned that absorption coefficient or quantum yield. Compare the dominant-well pattern and relative proportions first; do not compare measured ADC units directly with simulated nW or call a match absolute-power validation. If a calibrated absorbance instrument is already available, measuring the actual solution at excitation wavelengths can support a later matched model: μa = ln(10) × absorbance / optical path length in mm. This optional measurement is not needed to complete the compact screen.

Successful results support **assembled-device fluorescence detection, short-session repeatability, concentration dependence, physical channel mapping and stable-background correction**. They do not establish GCaMP sensitivity, receptor selectivity, cell compatibility, sterility, gas-to-liquid transfer or neural-network accuracy. Frequency separation cannot remove unknown fluorescence-channel background that carries the same LED frequency.

## 6. Follow-on cells: use the existing assay, not a new stimulus recipe

Proceed only if the team already has a working HEK293T/receptor/GCaMP6f assay, an established reference reader, validated negative/vehicle and positive controls, and a suitable cell-contact material/handling process. Fluorescein success does not qualify printed resin for living cells. If these prerequisites are absent, publish the cell-free engineering result and mark the cell comparison pending.

Use matched sister samples from **one existing cell batch** on AeroSense and the established reader. Record construct/receptor, batch, passage, expression timing, cell loading/confluence, medium, volume, temperature and exposure timing. Allocate matched samples to the two instruments before seeing results. Keep the laboratory's validated stimulus identity, concentration, solvent and timing unchanged; this document does not invent a drug or odor dose. Use a vehicle session and a known-positive session. A general calcium-positive control tests reporter readout, not odor-receptor specificity. Do not add fluorescein to the GCaMP cells.

The biological matrix needs its own illuminated, cell-free **assay-medium blank** and appropriate fluorescence phase reference, then a **living-cell baseline F0 before stimulation**. PBS dye calibration is not a substitute for the medium blank or living-cell F0. Follow the existing correction guide; recalibrating the blank/phase invalidates the old F0. Use the qualified handling process to avoid transferring calibration dye into cell samples. Retain any existing non-reporter control used by the established assay; a medium blank alone cannot separate changing cellular autofluorescence from GCaMP.

**Temporal limit:** current firmware measures a 2-second I/Q block followed by at least 3 seconds idle, so successive observations are roughly 5 seconds apart or slower. The 41/67/89/113 Hz carriers label illumination sources; they do not provide four high-speed cellular recordings. GCaMP6f can report fast changes, but this schedule can average or miss a short event. A negative device trace is not proof of no cellular response. [Original GCaMP6 study](https://www.nature.com/articles/nature12354)

Choose an already validated sustained/repeatable response for this quick comparison. Record stimulus start against each instrument's clock and retain the faster reference trace. Before collecting data, choose one post-stimulus time window from the established assay and compare **mean unsmoothed ΔF/F0 over that same window**, together with baseline variability and the vehicle trace. For a fair time-resolution illustration, also average the reference over AeroSense's actual 2-second acquisition windows; do not interpolate across idle gaps and present that as measured device data. Align only to documented stimulus time, without a best-fitting delay or separate peak normalization. If the only established response is a brief transient, timing/firmware development is required before making a temporal-performance claim.

Use identical cell/stimulus conditions in all four device wells for the simplest first biological comparison; retain all four channel traces. They remain optically mixed channels, not automatically four isolated cell measurements. Shared gas exposure is not four independent exposure replicates. Liquid dosing on a plate reader and gas dosing in the device are not equal-dose experiments: report this as a conditional trend comparison, with delivery differences explicit. Dye data cannot verify the protein-assisted gas-uptake hypothesis.

## 7. Small final evidence set

Keep one device photo, the three cell-free figures, the complete raw session JSON, the preparation/settings log and a short table stating which predeclared criteria passed or failed. If the conditional cell comparison is completed, add one figure with both unsmoothed time courses, vehicle traces, stimulus markers and the fixed comparison window; include matched reference data and the actual number of independent cell batches. One batch is a feasibility pilot. Neither agreement nor disagreement should be concealed by normalization, selective channels or shifted time axes.

Reference metadata and claim boundaries are in [Fluorescence_Test_References.json](Fluorescence_Test_References.json). Source retrieval date is 2026-10-06; older publication dates remain identified there.
