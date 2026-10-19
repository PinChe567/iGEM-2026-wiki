# Cell-free fluorescence verification

This procedure tests the assembled reader with sodium fluorescein in PBS. It does not test cell survival or odor recognition. The procedure follows ASD-STE100 Issue 9 writing principles. A complete approved-vocabulary audit has not been performed.

## 1. Prepare the experiment

1. Read the [Developer Manual](Developer_Manual_EN.pdf).
2. Complete its electrical checks.
3. Read the [User Manual](User_Manual_EN.pdf).
4. Prepare the solutions with the [sample guide](Fluorescence_and_Cell_Test_EN.md).
5. Use the same PBS batch for the blank and both fluorescein concentrations.
6. Start the pilot with C = 100 nM and 0.5C = 50 nM.
7. Use the selected 100 µL in each well.
8. Before electrical installation, confirm lid closure and leakage with this volume.
9. If overflow occurs, decrease the volume in all wells and controls equally.
10. Keep the actual working volume constant throughout the series.

The latest reported full volume is approximately 120 µL. The selected operating fill and the nominal model fill are 100 µL. These values do not establish clearance, leakage resistance or cell compatibility. The current airflow study stops at the gas above the liquid; it excludes OBP binding and liquid transfer. Fluorescein brightness depends on pH. Different diluents can cause a false concentration difference. [Manufacturer information](https://documents.thermofisher.com/TFS-Assets/LSG/manuals/mp36915.pdf)

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

```text
python -m pip install -r requirements.txt
python quick_check.py --input my_session.json --mapping SW,SE,NE,NW
```

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