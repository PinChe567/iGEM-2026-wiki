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

```text
python -m pip install -r requirements.txt
python quick_check.py --input my_session.json --mapping SW,SE,NE,NW
```

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
