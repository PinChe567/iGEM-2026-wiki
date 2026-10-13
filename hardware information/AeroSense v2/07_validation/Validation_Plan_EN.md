<<<<<<< HEAD
# Cell-free fluorescence verification

This procedure tests the assembled reader with sodium fluorescein in PBS. It does not test cell survival or odor recognition. The procedure follows ASD-STE100 Issue 9 writing principles. A complete approved-vocabulary audit has not been performed.

## 1. Prepare the experiment

1. Read the [Developer Manual](../04_manuals/Developer_Manual_EN.md).
2. Complete its electrical checks.
3. Read the [User Manual](../04_manuals/User_Manual_EN.md).
4. Prepare the solutions with the [sample guide](Fluorescence_and_Cell_Test_EN.md).
5. Use the same PBS batch for the blank and both fluorescein concentrations.
6. Start the pilot with C = 100 nM and 0.5C = 50 nM.
7. Use a provisional 80 µL in each well.
8. Before electrical installation, confirm lid closure and leakage with this volume.
9. If overflow occurs, decrease the volume in all wells and controls equally.
10. Keep the actual working volume constant throughout the series.

The historical simulations use 100 µL. They do not prove that this volume fits the closed physical well. Fluorescein brightness depends on pH. Different diluents can cause a false concentration difference. [Manufacturer information](https://documents.thermofisher.com/TFS-Assets/LSG/manuals/mp36915.pdf)

The cell procedure is separate. It uses the available Gibco DMEM and HEK293 cells that express GCaMP6f. DMEM is not the diluent for this PBS experiment.

## 2. Complete the preflight checks

1. Disconnect power.
2. Examine the PCB supports and well assembly.
3. Make sure that the assembly does not press on components.
4. Make sure that each connector remains accessible.
5. Turn the fan manually.
6. Make sure that the fan does not touch the housing.
7. Complete the supply and ADC-reference checks in the Developer Manual.
8. Load the firmware and web filesystem.
9. Connect the phone to the device.
10. Select hardware mode.
11. Keep all LEDs off.
12. Collect one raw ADC block.
13. Check the ADC range and timing quality.
14. If clipping, heating or timing failure occurs, stop the test.
15. Correct the fault before you continue.
16. After electrical verification, release the developer LED lock.
17. Set a low LED duty for the first optical check.
18. Activate one LED at a time.
19. Identify the physical well for each LED channel.
20. Check the stop control.

J2 supplies power and charging. J3 is the 3.3 V UART interface. The Developer Manual gives the connector instructions. Software settings do not prove physical timing accuracy.

## 3. Select one filter configuration

The current cases are no filter, one LEE 101 layer, two LEE 101 layers and one 500 nm OD4 longpass.

1. Start with one LEE 101 layer for the initial prototype.
2. Install the filter over the PD path only.
3. Close light paths around the filter edges.
4. Run a short blank and C pilot.
5. Check raw ADC clipping and fluorescence response.
6. If the range is unsuitable, change the settings before the formal series.
7. If you change the settings, collect a new blank calibration.
8. For another filter, collect a complete separate series.
9. Keep the same settings for the first comparison between filters.
10. If one configuration clips, identify that comparison as invalid at those settings.

The 12.45 mm OD4 part does not directly fit the current 5.2 × 4.2 mm seat. Its 0.30 mm thickness does not solve the outline mismatch. The Developer Manual gives the installation checks. No mechanical change is included here.

## 4. Keep the conditions constant

1. Use the same wells and filter throughout each formal series.
2. Keep LED frequencies and duty constant.
3. Keep room lighting constant.
4. If you use gas flow, keep its measured flow and pump position constant.
5. Before solution exchange, stop the schedule.
6. Stop the LEDs and gas flow.
7. Use an established exchange method that prevents liquid reaching the powered PCB.
8. Keep the same boot and optical alignment during the formal series.
9. If you must reboot or change the assembly, start a new complete series.
10. Do not combine partial series from different boots or settings.

Initial seeding, leak tests and major disassembly take place away from the disconnected PCB. The reader has no validated liquid-handling mechanism. If safe exchange is not possible, improve the setup before the formal test.

## 5. Collect the formal sequence

1. Close the lid before each acquisition.
2. Set the condition tag before you collect its blocks.
3. Collect five different valid two-second blocks per formal condition.
4. Use the permitted interval between blocks.
5. Keep invalid blocks and their failure flags.
6. Do not replace original values with smoothed values.

| Tag | Contents | Action |
|---|---|---|
| DARK | PBS in all wells; LEDs off | Save dark QC and raw ADC. |
| B_CAL | PBS in all wells; four LEDs on | Collect five blank-calibration blocks. Freeze this calibration. |
| PHASE_REF | C in all wells | For the live phase display, collect five additional reference blocks. |
| B_CHECK | Fresh matched PBS in all wells | Collect five independent blank-check blocks. |
| NE_C | C in NE; PBS elsewhere | Collect five blocks. |
| NW_C | C in NW; PBS elsewhere | Collect five blocks. |
| SW_C | C in SW; PBS elsewhere | Collect five blocks. |
| SE_C | C in SE; PBS elsewhere | Collect five blocks. |
| ALL_HALF | 0.5C in all wells | Collect five blocks. |
| ALL_C | C in all wells | Collect five blocks. Save raw ADC before the next condition. |
| ALL_HALF_REPEAT | Fresh 0.5C in all wells | Collect five blocks to check refill and time effects. |

There are 45 formal blocks, excluding DARK. PHASE_REF adds five blocks when used. The offline analyzer uses ALL_C for its phase reference. It does not use PHASE_REF as an extra formal condition.

1. Save B_CAL raw ADC immediately after B_CAL.
2. Save it before you start PHASE_REF or another condition.
3. Between single-well conditions, use the established rinse procedure.
4. If fluorescence remains after rinsing, stop treating that well as a clean blank.
5. At the end, export the complete JSON.
6. Confirm that the export contains every condition tag.
7. Save the downloaded raw ADC files with the JSON.
8. Before you clear browser data, check the saved files.

The raw ADC export contains the latest block. The complete JSON does not preserve every ADC waveform. Each record preserves its condition tag and acquisition context.

## 6. Analyze the data

1. Install the analysis dependencies from the existing validation folder.
2. Replace the example mapping with the observed D1–D4 physical mapping.
3. Run the analyzer with the complete exported session.
=======
# One cell-free experiment: from four-well fluorescence to phone data

This is the main PCB-arrival experiment. One continuous workflow checks fluorescence detection, measured background correction, relative-concentration response, well/channel mapping and data export. Allow approximately60–120 minutes once familiar with operation; first assembly/flashing is separate. No physical results have been generated. This experiment alone cannot establish odor recognition, cell survival or gas-to-cell delivery time.

## Essential10–15-minute preflight

1. With power off, check that the PCB fits without force, connectors remain accessible and the fan does not rub. Check the wells away from electronics with water and tissue, then dry them.
2. Ask an electronics-capable colleague to verify supply rails and ADC reference against the schematic. J2 USB-C is power/charging; J3 is3.3 V UART. Flash both firmware and the web filesystem following the operation guide.
3. Record raw ADC with all LEDs off. Stop for clipping, failed timing QC or unexpected heating; subtraction cannot repair a clipped signal. Only after supply/ADC checks should the responsible person release BOARD_VALIDATED for LED tests.
4. Briefly activate one LED at a time at low duty without cells and record the OBSERVED D1–D4 quadrant mapping. Test the phone stop command. Check modulation with a borrowed scope if immediately available; otherwise mark physical timing unmeasured.

These are short gates against wiring, saturation and mapping errors. If a fault appears, troubleshooting time cannot be skipped to produce an apparent pass.

## Materials and fixed conditions

Use an existing stable green fluorescent standard, such as suitable fluorescein reference solution, with the same medium and pH for blank, C and0.5C. C denotes the selected working concentration, not an assumed GCaMP concentration or detection limit. Prepare it using the product/laboratory instructions and record chemical, lot, actual concentration and pH. Manufacturer documentation shows fluorescein intensity depends on pH, so unmatched diluents confound the comparison. [Manufacturer reference](https://documents.thermofisher.com/TFS-Assets/LSG/manuals/mp36915.pdf)

Use100 µL per well, the same well set/filter, fixed four-LED frequencies/duty and fixed room lighting. A short C pilot may identify clipping or an undetectable range. If the working concentration/settings change, restart the complete blank and formal series and retain the pilot. Do not tune settings during the formal series for a nicer plot.

No additional gas detector is required for this optical experiment. If airflow is enabled, measure/document the flow and pump placement and keep them constant; that does not validate the CFD concentration curve. Fixed-enclosure operating recommendations are in Flow_Operation.

## The single experimental sequence

Collect five different valid2-second blocks per condition, using the UI's permitted inter-block interval. Stop scheduling before changing solution. Close the lid and set the condition tag listed below. The correction context ID identifies the common assembly/acquisition configuration and should not change merely because the concentration tag changes.

| Tag | Contents | Action |
|---|---|---|
| DARK | Four blanks; LEDs off | Save dark QC and raw ADC. |
| B_CAL | Four blanks; four LEDs on | Collect five illuminated-blank calibration blocks and freeze this calibration. |
| B_CHECK | Same blank; five new blocks | Held-out check; do not add these to calibration. |
| NE_C | C in NE only; other wells blank | Five blocks of all four raw I/Q channels. |
| NW_C | C in NW only | Same. |
| SW_C | C in SW only | Same. |
| SE_C | C in SE only | Same. |
| ALL_HALF |0.5C in all four wells | Five blocks for the middle concentration. |
| ALL_C | C in all four wells | Five blocks; also eligible as a fluorescence phase reference. |
| ALL_HALF_REPEAT | Refill four wells with0.5C | Five blocks to assess refill/time differences. |

Use the laboratory's appropriate rinse between single-well conditions. If the resin retains visible fluorescence after rinsing, record it and stop treating that well as clean blank. Do not delete carryover. Use existing pipettes/consumables; no additional printed parts are required.

Each incoming record snapshots its condition tag and notes. Export the complete JSON at the end and download at least one blank and one C raw-ADC block. Confirm tags exist in the export before clearing browser data. Keep invalid blocks, calibration records and all original values.

## Interpret three figures

1. **0,0.5C,C response:** subtract the independent B_CAL complex mean from raw I/Q, then project onto the phase measured from ALL_C. Plot mean and technical-block SD without smoothing; compare the repeated half concentration.
2. **4×4 single-well matrix:** rows are physically observed LED quadrants; columns identify the only fluorescent well. Normalize within rows and compare proportions/dominant wells with the homogeneous-standard-liquid MC. It is not the bottom-cell transfer model and is not automatically used to unmix cells.
3. **Held-out blank before/after:** use B_CHECK to quantify stable offset removal. Subtracting a fixed background does not remove random noise or establish infinite SNR.

### One analysis command

In07_validation, with the documented analysis dependencies installed:
>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0

```text
python -m pip install -r requirements.txt
python quick_check.py --input my_session.json --mapping SW,SE,NE,NW
```

<<<<<<< HEAD
The mapping above is an example, not a verified orientation. The analyzer rejects DEMO records, duplicates and mixed devices or settings. It also checks hardware metadata, clipping and timing. Each formal condition needs five valid blocks. A weak ALL_C phase reference stops the analysis.

Results use the existing measured-results workflow. The command does not create measurements by itself. The self-test uses synthetic inputs only.

| Output | Interpretation |
|---|---|
| Blank, 0.5C and C response | Subtract the B_CAL complex mean. Project onto the ALL_C phase. Compare mean and block SD. |
| Four-by-four single-well matrix | Use the magnitude of each mean corrected complex response. Normalize each LED row. Check the expected well. |
| Independent blank comparison | Use B_CHECK to test stable-offset removal. Retain random noise and drift. |

The matrix is not a signed phase-projection matrix. Magnitude has a positive bias near the noise floor. It does not automatically separate cellular signals from different wells. Blank subtraction cannot remove shot noise or restore a clipped waveform.

## 7. Apply the provisional criteria

These are project development criteria. They are not formal detection limits or biological acceptance criteria.

| Check | Provisional target |
|---|---|
| Acquisition quality | Every formal block passes clipping and timing checks. |
| Detection margin | Mean 0.5C projection minus mean B_CHECK exceeds five times the B_CHECK block SD in every channel. |
| Concentration order | The response increases from B_CHECK to 0.5C to C. |
| Half/full ratio | The ratio is 0.35–0.65. |
| Technical variation | CV is at most 10% at both fluorescent levels. |
| Repeated half concentration | Mean drift is at most 10%. |
| Well mapping | Each LED row peaks in the expected well. Its normalized diagonal exceeds 0.60. |

1. Report each criterion separately.
2. Keep the absolute SD when the mean approaches zero.
3. If a criterion fails, examine clipping, mapping, drift and filter leakage.
4. Correct the cause before you use the reader with cells.

The detection-margin calculation subtracts the check-blank mean for that criterion only. It does not apply a second correction to stored response curves. Five blocks are technical repeats. They are not five biological experiments.

## 8. State the result correctly

A successful test supports fluorescence detection, phone control, four-frequency acquisition and data export under the recorded conditions. It also tests background correction and single-well optical transfer.

It does not establish GCaMP6f cell response, VOC selectivity, cell survival or gas delivery time. Standard-liquid brightness does not establish cellular sensitivity.

1. For cells, follow the separate sample guide.
2. Compare the same cell batch on this device and an established fluorescence reader.
3. Use the established negative and positive controls.
4. Compare prespecified ΔF/F0 windows without arbitrary time shifts.

Liquid stimulation and gas stimulation are not automatically equal doses. Shared gas does not give four independently exposed odor replicates.

1. For usability, use the separate blank questionnaire.
2. Ask two or three non-designers to follow the manual.
3. Record assistance and difficulty.
4. Revise the main problems before a second trial.
=======
The mapping lists the OBSERVED D1,D2,D3,D4 quadrants. This example is not permission to assume an unmeasured orientation. The analyzer requires current hardware metadata and chronological raw records, rejects DEMO, duplicate records, mixed devices/settings and states with fewer than five valid blocks, and independently checks clipping/timing fields. A weak ALL_C phase reference stops analysis. Outputs in measured_results/single_experiment contain three plots, acquisition settings, block IDs, values, exclusions and notes. `--self-test` checks code only and generates no experimental results.

## Provisional development criteria fixed before data

These are project engineering targets, not iGEM rules or formal detection limits: all formal blocks pass clipping/timing QC; the mean 0.5C projection minus the independent B_CHECK mean exceeds five times the B_CHECK block SD in every channel; response rises from B_CHECK to 0.5C to C; half/full ratio lies between 0.35 and 0.65; technical CV at both fluorescent levels≤10%; repeated-half mean drift≤10%; each LED's largest response comes from its expected well and its row-normalized diagonal exceeds 0.60. All projections already subtract B_CAL once; subtracting the held-out mean for the detection-margin test prevents a shifted blank from appearing to pass. It is not a second background correction applied to the stored response curves.

Report each criterion separately. Five blocks are technical repeats, not five biological experiments. Near-zero CV is unstable, so retain absolute SD and raw values. Near-threshold results are not precise pass/fail certification. Investigate mapping, background drift, filtering or clipping before using a neural network.

## What the wiki may claim

After successful measurement: “With the stated100 µL fluorescence standard, the assembled prototype demonstrated phone control, four-frequency acquisition, independent illuminated-blank correction and data export, with measured concentration response and single-well optical transfer.” Include the device photo, three figures and raw JSON. Leave unmeasured fields blank.

This does not establish GCaMP cell response, VOC selectivity, gas concentration arrival, sterility or long-term culture. Standard-liquid brightness does not directly establish cellular sensitivity.

## Use the remaining time

Finish assembly/flashing first. Ask2–3 non-designers to follow the manual; record time, difficulty and assistance using the existing questionnaire. Revise the most serious1–2 issues and retest. Report this user-feedback cycle separately from the optical experiment.

If the wet-lab receptor/GCaMP and stimulus workflow is already established, compare matched samples from the same cell batch on this device and the established reader, preserving existing negative/positive controls. Record stimulus start, flow and raw time series. Compare prespecifiedΔF/F0 without arbitrary time shifts. Liquid stimulation on one reader versus gas stimulation here is not an equal-dose comparison; report conditional trends and delivery differences. Shared gas means the four wells are not four independently exposed odor replicates. Protein-assisted capture remains an unvalidated mechanism.
>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0
