# AeroSense User Manual

Revision: 2026-10-11. Use this manual with a reader that passed developer checks. The cell procedure uses your existing GCaMP6f-expressing HEK293 and Gibco DMEM.

The procedures use ASD-STE100 Issue 9 writing principles. They use short sentences, stable terms, and one instruction per step. Full vocabulary and rule compliance has not been audited. This document does not claim formal ASD-STE100 compliance. [Writing reference](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf).

Use the [Developer Manual](../../../hardware%20information/AeroSense%20v2/04_manuals/Developer_Manual_EN.pdf) for assembly and programming. The [sample guide](../../../hardware%20information/AeroSense%20v2/07_validation/Fluorescence_and_Cell_Test_EN.pdf) gives detailed preparation and supporting sources. The [USD BOM](../BOM_EN.xlsx) and [feedback form](../../../hardware%20information/AeroSense%20v2/07_validation/User_Feedback_EN.pdf) are separate.

## 1 Prepare the reader

Preparation: Obtain a checked reader, its Wi-Fi password, and its API key. Obtain the verified duty, working fill, filter configuration, and measured LED directions.

| Term | Meaning |
|---|---|
| Working fill | Measured volume that permits closure without leakage |
| Block | One two-second acquisition |
| Illuminated blank | Nonfluorescent, cell-free sample with LEDs on |
| Phase reference | Stable fluorescence standard used to establish signal phase |
| F0 | Unstimulated living-cell baseline after optical correction |
| Condition ID | Common assembly and acquisition configuration |
| Sample label | Contents of the current measurement, such as B_CAL or ALL_C |

The four liquids share one gas space and one PD. Displayed channels correspond to LED frequencies. They are not automatically separated into independent well signals. The reader has no validated odor classifier. It does not control temperature, CO2, humidity, or gas flow.

Steps:

1. Inspect the reader for moisture.
2. Check tubes for pinching.
3. Check visible wires for looseness.
4. Confirm that the working fill passed closure and leakage tests.
5. Confirm the installed filter configuration.

Check: Start filter trials with one LEE 101 layer. The reported physical wells are nearly full at 100 µL. An 80 µL working fill is provisional. Use it only after physical checks. Keep the verified fill equal across wells and controls. Historical simulations used 100 µL.

Failure action: If the reader leaks or has loose wiring, do not power it. Return it to the developer. If BOARD_VALIDATED is locked, perform dark tests only.

## 2 Connect the phone

Preparation: Keep the assembled reader dry. Locate physical SW1 before starting. Direct phone control does not require internet access.

Steps:

1. Switch on the reader.
2. Join AeroSense Wi-Fi on the phone.
3. Enter the Wi-Fi password.
4. If the phone reports no internet, keep the connection.
5. Open http://192.168.4.1/ in the browser.
6. Enter the supplied API key.
7. Press Connect.
8. Confirm HARDWARE at the top.
9. Locate Stop / LEDs off.
10. Keep the page in the foreground during acquisition.
11. Keep the phone awake during acquisition.

Check: The Wi-Fi password and API key have different purposes. DEMO DATA means synthetic practice data. Installing a real sample does not change DEMO into a measurement.

Failure action: If network control cannot stop the reader, use SW1 to remove power. Reconnection does not recover unsaved browser data automatically.

For practice, ask the developer to start Demo. Open http://127.0.0.1:8765/ on that computer. [README.md](../README.md) is the document index. It is not the control interface.

## 3 Read the interface

Use the upper-right language button to change language. The table follows the current interface order.

| Area | Function | Check |
|---|---|---|
| Mode and connection | Device mode, API key, and connection errors | HARDWARE for measurements |
| Acquisition schedule | Blocks, interval, duty, LEDs, Start, and Stop | Review settings before Start |
| Quality and sensors | ADC and timing status | valid covers implemented QC only |
| Four frequency channels | Raw channel amplitudes and history | No blank subtraction or τ smoothing on this plot |
| Measured background correction | Blank, phase reference, subtraction, and smoothing | Enable subtraction explicitly |
| Calibration and normalization | Dark, Baseline, Reference, and automatic capture | Collect living-cell F0 separately |
| Records and export | Sample label, notes, JSON, CSV, and raw ADC | Export before page reload |

### Acquisition controls

| Control | Range or action | Initial use |
|---|---|---|
| Blocks | 1–60 | One trial block; five distinct valid calibration blocks |
| Interval | 3–300 s after each two-second block | 3 s gives about one record per 5 s |
| PWM duty | 1–50% | Developer-approved value; initial engineering test uses 5% |
| LED selector | Dark, one LED, or D1–D4 | Select Dark explicitly for dark checks |
| Start session | Starts a finite schedule | Press after settings review |
| Stop / LEDs off | Cancels remaining blocks | Incomplete block is discarded |
| Display smoothing τ | 0–120 s | Start at 0; larger values delay changes |
| Condition ID | Assembly and acquisition identity | Change after physical or setting changes |
| Current sample label | Labels new records | Does not relabel previous records |

D1 is 41 Hz. D2 is 67 Hz. D3 is 89 Hz. D4 is 113 Hz. Use measured directions to associate these channels with wells. Duty is not calibrated optical power.

### Calibration controls

| Control | Function |
|---|---|
| 1. Collect illuminated blank | Starts five blocks for the current blank |
| 2. Collect fluorescence phase reference | Starts five blocks for the fluorescence standard |
| 3. Enable measured blank subtraction | Applies the measured complex blank once |
| Clear background correction | Removes the measured blank and phase calibration |
| Add dark / baseline / reference | Adds the latest eligible valid block |
| Automatic capture | Adds subsequent valid blocks until the selected stage has five |
| Clear calibration | Clears the Dark, Baseline, and Reference sets |

Automatic capture needs the page open. Select its stage before starting acquisition. Do not add the same block repeatedly. Updating the blank or phase reference invalidates old F0 and Reference values.

Dark tests check electronics with LEDs off. The illuminated blank already includes the dark background. Do not subtract dark again after measured blank subtraction.

Baseline supplies F0. Reference supports a comparison with an established reference stimulus. It is not an odor classifier. The legacy Dark/Baseline/Reference workflow is separate. Use the [detailed correction guide](../03_software/guides/Measured_Correction_EN.md) when interpreting older records.

### Quality and storage

valid indicates implemented sample-count, rail, and timing checks. railSamples counts samples near ADC limits. maxIntervalErrorUs describes departures from the nominal 250 µs interval. These fields do not prove biological validity.

Battery level, cell temperature, fan speed, and flow are not measured. The upper history plot always shows raw amplitudes. τ affects corrected displays and processed values. Raw and unsmoothed values remain available.

## 4 Prepare the fluorescence standards

Preparation: Use sodium fluorescein, CAS 518-47-8. Use one batch of 1× PBS at approximately pH 7.4. Prepare pipettes, clean tubes, and light protection. This PBS procedure is cell-free.

Use PBS for stock, dilutions, and blank. No DMSO or ethanol is needed. Do not substitute FITC, highlighter ink, or unspecified dye. Do not put fluorescein into the reporter cells.

For a documented 1 mM stock, use this dilution table:

| Solution | Mix | Final concentration |
|---|---|---|
| Intermediate | 10 µL stock + 990 µL PBS | 10 µM in 1.00 mL |
| C | 50 µL intermediate + 4.950 mL PBS | 100 nM in 5.00 mL |
| 0.5C | 2.50 mL C + 2.50 mL PBS | 50 nM in 5.00 mL |
| Blank | Same PBS without dye | 0 nM; at least 10 mL plus rinse volume |

If only powder is available, use the bottle's identity and assay information. For anhydrous sodium fluorescein, 37.627 mg in a final 10.00 mL gives nominal 10 mM. The formula mass is 376.27 g/mol. Diluting 100 µL of that stock with 900 µL PBS gives 1 mM. The [sample guide](../../../hardware%20information/AeroSense%20v2/07_validation/Fluorescence_and_Cell_Test_EN.pdf) explains purity and hydration corrections.

Steps:

1. Prepare the intermediate solution.
2. Mix the intermediate gently.
3. Prepare C from the mixed intermediate.
4. Mix C gently.
5. Prepare 0.5C from C.
6. Mix 0.5C gently.
7. Protect the tubes from unnecessary light.
8. Dispense the same verified working fill into each well.

Check: Concentrations, PBS, pH, temperature, and light exposure are consistent. Use fresh working dilutions for the session. Follow bottle instructions for stock storage.

Failure action: If stock identity or concentration is uncertain, use a documented laboratory stock. Do not weigh the nanogram amount needed for one well. If signal is weak, inspect the optical path before changing concentration.

## 5 Select the filter configuration

Preparation: Ask the developer to install and verify the filter. Start with one LEE 101 layer. Keep the same duty and working fill during each comparison.

| Configuration | Use |
|---|---|
| No filter | Engineering leakage comparison; stop for ADC clipping |
| One LEE 101 layer | Preferred first practical test |
| Two LEE 101 layers | Test whether extra rejection improves measured SNR |
| One 500 nm 12.5 mm Ultra-Thin OD4 Longpass | Candidate after mechanical fit is resolved |

LEE 101 belongs over the PD receiver. LED excitation paths stay open. Layers reduce blue leakage and green fluorescence. A lower blank alone does not establish a better measurement.

The OD4 candidate is an Everix flexible polymer/dye filter, Edmund Optics #29-190. Thickness is 0.30 mm. Diameter is 12.45 ± 0.15 mm. It does not fit the existing 5.2 × 4.2 mm seat. Supplier-approved mounting or cutting and edge sealing remain unresolved. Do not force the disc into the reader. Angular transmission also needs confirmation.

Check: Select a configuration with adequate signal, acceptable noise, and no clipping. Recalibrate after every filter change. The [filter report](../02_simulation/optics/README.md) provides numerical comparisons and model limits.

Failure action: If the blank clips, stop acquisition. Ask the developer to correct leakage or settings. Blank subtraction cannot remove photon noise, clipping, or changing leakage.

## 6 Calibrate the routine interface

Preparation: Fix the well set, working fill, filter, duty, LEDs, and medium. Use an illuminated blank matching the sample medium. Use a separate stable fluorescence standard.

### Collect the illuminated blank

1. Enter a Condition ID, such as board01_wellA_80uL_LEE101x1.
2. Load the matching cell-free blank into all four wells.
3. Close the light shield.
4. Set Current sample label to B_CAL.
5. Press 1. Collect illuminated blank.
6. Wait for five distinct valid blocks.
7. Check that calibration status is complete.
8. Download the latest raw ADC block before another acquisition.

Use 80uL in the identifier only when that volume passed the physical checks.

### Collect the phase reference

1. Stop the schedule before solution exchange.
2. Confirm that LEDs are off.
3. Stop external gas flow.
4. Put the same stable fluorescence standard in all four wells.
5. Close the light shield.
6. Set Current sample label to PHASE_REF.
7. Press 2. Collect fluorescence phase reference.
8. Wait for five valid blocks.
9. Check each channel's reference status.
10. Enable 3. Enable measured blank subtraction.
11. Set Display smoothing τ to 0.

### Check the independent blank

1. Stop acquisition before solution exchange.
2. Replace the standard with matched blank.
3. Close the light shield.
4. Set Current sample label to B_CHECK.
5. Set Blocks to 5.
6. Press Start session.
7. Inspect all five new blocks.

Check: B_CHECK is independent. Do not add it to B_CAL. A weak reference, unstable blank, or QC error prevents reliable interpretation.

Failure action: If a check fails, retain the records. Correct the cause before a new complete calibration. Do not use smoothing to hide the failure.

Routine PHASE_REF calibration and the formal dye series serve different purposes. Formal quick_check.py uses ALL_C for phase. It ignores extra PHASE_REF records.

## 7 Run the formal dye series

Preparation: Complete the developer preflight. Establish spill-free solution exchange that preserves one boot and optical alignment. Use C = 100 nM and 0.5C = 50 nM initially.

| Order | Sample label | Contents |
|---:|---|---|
| 1 | DARK | Four blanks; LEDs off |
| 2 | B_CAL | Four blanks; LEDs on |
| 3 | B_CHECK | Four blanks; five new blocks |
| 4–7 | NE_C, NW_C, SW_C, SE_C | C only in the named well; blank elsewhere |
| 8 | ALL_HALF | 0.5C in all wells |
| 9 | ALL_C | C in all wells |
| 10 | ALL_HALF_REPEAT | Fresh 0.5C in all wells |

Steps:

1. Set the sample label before each condition.
2. Close the light shield before acquisition.
3. Collect five distinct valid blocks per formal illuminated condition.
4. Immediately after B_CAL, save its latest raw ADC block.
5. Immediately after ALL_C, save its latest raw ADC block.
6. Before each solution exchange, stop the schedule.
7. Confirm that LEDs are off.
8. Stop external flow.
9. Use the established rinse and exchange method.
10. After the final condition, export the complete session JSON.

Check: The nine illuminated conditions contain 45 valid blocks. DARK is separate. Use unchanged settings throughout. Keep the Condition ID fixed for this common configuration. Change the sample label for each solution.

Failure action: If residue prevents a clean blank, stop the series. If reboot or optical disassembly is necessary, start a new complete series afterward. Do not combine partial series across boots.

The [validation plan](../../../hardware%20information/AeroSense%20v2/07_validation/Validation_Plan_EN.pdf) gives analysis commands and acceptance criteria. Sodium fluorescein verifies an optical measurement. It does not establish cellular sensitivity or odor recognition.

## 8 Prepare complete Gibco DMEM

Preparation: Use your existing GCaMP6f-expressing HEK293. Use the existing Gibco DMEM and FBS used successfully for these cells. No new reporter-expression procedure is required.

Steps for 50 mL complete medium:

1. Read the DMEM bottle label.
2. Check whether the medium is basal or already complete.
3. Check whether L-glutamine or GlutaMAX is present.
4. If the medium is already complete, use it without adding FBS again.
5. If it is basal DMEM, transfer 45.00 mL to a sterile container.
6. Add 5.00 mL of the existing suitable FBS.
7. Mix gently.
8. Label the final 50.00 mL as DMEM with 10% FBS.

Check: If L-glutamine or GlutaMAX is present, do not add more automatically. If absent, use the established supplement recipe and product instructions. Include added supplements within the final 50 mL. Reduce basal DMEM by their combined volume.

For an established recipe requiring 2 mM added glutamine, use 0.50 mL of 200 mM stock. Combine 44.50 mL basal DMEM, 5.00 mL FBS, and that supplement. This conditional example does not prescribe extra glutamine for every Gibco product.

Keep established reporter selection conditions. Do not add new antibiotics, pyruvate, or other supplements without a reason in the existing procedure. Do not heat-inactivate FBS unless that procedure requires it.

Environment steps:

1. Set the incubator to 37°C.
2. Use the established CO2 setting for these cells and this DMEM.
3. If the established setting is 5%, retain humidified 5% CO2.
4. Check medium pH after equilibration.

Failure action: If the bottle formulation changed, check its instructions before changing CO2 or supplements. Gibco DMEM formulations differ. Some specify 5–10% CO2. Keep the successful culture recipe for the first device comparison. EMEM is not a required purchase. See the [complete medium guide](../07_validation/Fluorescence_and_Cell_Test_EN.md).

## 9 Seed the wells and check readiness

Preparation: Use a healthy expanding culture. Prepare the removable wells away from electronics. Use a qualified aseptic process compatible with the resin. Keep a matched standard-cultureware control.

The nominal well floor is 0.112 cm². Start with 3,000 viable cells per well. At 80 µL, this requires 3.75 × 10^4 viable cells/mL. This is a starting estimate, not a measured optimum.

Four wells require 320 µL. Prepare at least 400 µL for handling losses. If the counted stock contains 1.00 × 10^6 viable cells/mL, use 15 µL stock plus 385 µL complete DMEM. This gives 400 µL at the target concentration. Count viable cells, not total particles.

If the verified fill changes, use 3,000 × 1,000 / fill_in_µL viable cells/mL. Match control cultureware by cells/cm².

Steps:

1. Prepare a suspension with the laboratory's established dissociation procedure.
2. Count viable cells.
3. Dilute the suspension to the calculated concentration in complete DMEM.
4. Put the removable wells level in a sterile secondary culture dish.
5. Mix the cell suspension gently before dispensing.
6. Dispense 80 µL slowly along each well wall.
7. Inspect for bubbles.
8. Cover the secondary dish with a suitable gas-exchange cover.
9. Incubate under the conditions in Section 8.
10. Inspect attachment at 4–6 hours.
11. Inspect morphology and coverage at 18–24 hours.
12. Check health and reporter response at 24–48 hours.

Use 80 µL only when the working-fill test passed. Do not incubate the PCB or battery in a humid incubator. If starting from a frozen vial, recover it in standard cultureware first.

Check: Cells are attached and healthy. There is no visible contamination or marked detachment. A provisional coverage target is 60–80%. The known positive control responds on the reference instrument. Elapsed time alone is insufficient.

Aqua Clear Plus has no demonstrated culture-compatibility process in this project. Compare resin wells with standard cultureware. The sample guide proposes viability of at least 80% of the matched control. It also specifies background and attachment checks.

Failure action: If plastic passes but resin fails, resolve the material or surface process first. Do not assume another fixed incubation period will correct poor attachment. Do not assume UV, alcohol, or a coating proves compatibility.

Check evaporation with a matched cell-free well. More than 10% volume loss is a proposed rework threshold. At 80 µL, that is 8 µL. Do not top up blindly and treat the result as unchanged.

## 10 Calibrate and measure the reporter cells

Preparation: Use the established assay medium when possible. Existing DMEM is the first route when its required environment can be maintained. Keep its CO2 condition and verify 37°C at the sample. The reader does not supply these controls.

PBS dye solution is not cell-growth medium. HEPES does not control temperature. The alternative measurement-buffer procedure in the sample guide is optional. It is not a required purchase.

Optical preparation:

1. Prepare a cell-free blank with the actual assay medium.
2. Use the final filter, duty, working fill, and optical arrangement.
3. Collect the illuminated blank with Section 6.
4. Collect the matched phase reference with Section 6.
5. Check an independent blank.
6. Install the cell sample with the established calibration-transfer procedure.

Check: A different well insert can change resin background and alignment. Verify repeated insert exchange in the cell-free pilot. Do not conceal a changed assembly with an unchanged Condition ID. A restart needs a valid calibration-transfer procedure and new F0.

Cell measurement steps:

1. Confirm sample temperature and medium pH.
2. Inspect cell attachment before measurement.
3. Set a sample label for the unstimulated cells.
4. Select Automatic capture Baseline.
5. Start the unstimulated acquisition.
6. Collect at least five distinct valid baseline blocks.
7. Keep a stable 2–5 minute baseline record when the assay permits.
8. Record the stimulus start time.
9. Apply the laboratory's established stimulus procedure.
10. Collect the response with unchanged settings.
11. Export raw and unsmoothed corrected data.
12. Inspect attachment after measurement.

Check: The cells already express GCaMP6f. A known positive control still checks whether the reporter response is functional. Include matched vehicle and reference-instrument controls. Use existing non-reporter controls when available.

Use a first 10–15 minute measurement as a feasibility trial. This is a planning duration, not a proven safe exposure. Keep the gas pump off for the initial optical/cell comparison. Do not add fluorescein to the cells.

Failure action: If temperature, pH, attachment, or QC fails, stop interpretation. If F0 is near zero or below noise, do not force a ratio. If environmental control is unavailable, continue cell-free work first.

Compute ΔF/F0 from the living-cell baseline after one independent blank subtraction. Never save living cells as the optical blank. A PBS blank cannot replace the actual-medium blank.

Each block averages two seconds, followed by at least three seconds idle. Rapid GCaMP6f peaks can be missed. Compare an established sustained response over a prespecified time window. Align traces to recorded stimulus time. Do not shift curves to improve agreement.

Four shared-gas wells are not four independent exposure replicates. Gas arrival above liquid does not prove cell exposure. A general calcium-positive response does not establish odor specificity.

## 11 Export data and finish

Preparation: Keep the browser open until export finishes. JSON preserves the fullest session record. CSV is convenient for inspection.

Steps:

1. Enter sample and condition information in the notes.
2. Press Export JSON.
3. Press Export CSV.
4. Check that both files were saved.
5. If a raw waveform is required, download the latest raw ADC before another block.
6. Press Stop / LEDs off.
7. Confirm that the LEDs are off.
8. Stop external gas flow.
9. Equalize pressure through the open outlet.
10. Switch off power before disassembly or cleaning.

Check: Preserve calibration records, raw values, failed blocks, and exclusion reasons. Useful filenames include date, device, sample, condition, and replicate. Screenshots alone are insufficient.

The device keeps only the latest raw ADC block. Its RAM upload queue holds eight summaries. Rebooting loses pending summaries. The browser retains at most 1,000 observed blocks. Export before refresh or closure.

Failure action: If export is incomplete, keep the page open. Resolve the download before clearing records. Do not label recovered partial data as a complete series.

## 12 Correct problems

| Symptom | Action |
|---|---|
| Webpage 404 | Ask the developer to check LittleFS upload |
| 401 | Check the current device API key |
| board_not_validated | Keep Dark; request developer checks |
| ADC_rail, timing, or jitter | Stop; preserve raw ADC for diagnosis |
| Large blank or clipping | Check shielding, filter bypass, and duty before recalibration |
| Weak phase reference | Check standard, alignment, and blank |
| baseline_below_noise | Check F0 and reporter response; do not force ratios |
| Network failure prevents stopping | Remove power with SW1 |
| Leakage or abnormal heating | Disconnect power and stop gas flow |
| Cell detachment or pH change | Stop the cell test and restore the established culture environment |

Use the separate feedback form for actual observations. Leave unperformed tasks blank. Keep device checks, dye results, and cell results separate.
