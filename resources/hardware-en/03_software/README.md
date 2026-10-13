# AeroSense software: from power-on to a saved measurement

This folder contains the executable phone UI, ESP32 firmware, host server and analysis code. Start with `guides/Operation_and_Setup_EN.md`: demonstration, wiring and flashing, dark acquisition, LED checks, calibration, then measurement. A rented cloud server is not required for first use.

For measured LED-on background subtraction, signed phase projection and optional display averaging, follow [Measured correction](guides/Measured_Correction_EN.md). This is opt-in browser processing of preserved raw I/Q. Collect a cell-free illuminated blank and a separate fluorescence phase reference; do not substitute a simulated waveform or a living-cell F0 for the blank.

| Location | Purpose |
|---|---|
| `firmware/src/main.cpp` | LED timing, external ADC acquisition, DLIA, local API and result uploads |
| `firmware/src/config.example.h` | Copy to `aerosense_config.h` in the same folder and enter private settings |
| `firmware/data/` | Bilingual phone UI; upload the LittleFS filesystem as well as firmware |
| `firmware/data/correction.js` | Measured complex blank subtraction, reference phase projection, QC and timestamp-based display EMA |
| `server/server.py` | Host command queue, SQLite storage and explicitly labelled demonstration mode |
| `analysis/dlia.py` | Offline raw-data demodulation; not identical to the MCU rectangular I/Q estimator |
| `analysis/odor_model.py` | Small research neural-network pipeline; no fabricated trained odor model supplied |
| `guides/` | Setup, controls, calibration, operation and troubleshooting |
| `templates/` | Empty experiment and model-training tables |
| `evidence/` | Consolidated software checks, build records, and DLIA results |

## Try the interface without a PCB

Open a terminal in this folder:

```powershell
python server/server.py --demo
```

On the same computer, open `http://127.0.0.1:8765/`, enter API key `local-demo-key`, then Connect. The banner must say DEMO DATA. These numbers are interface exercises, not experimental evidence.

## Repeat software checks

With Python 3.11 or later and Node.js installed:

```powershell
python -m pip install -r requirements.txt
python test_software.py
python test_model.py
node test_calibration.cjs
node test_correction.cjs
node test_ui.cjs
node --check firmware/data/app.js
```

JSON evidence is written to `evidence/`. Firmware compilation uses PlatformIO as explained in the guide. Software tests do not exercise a physical ADC or demonstrate fluorescence detection.

## Check functions before filter delivery and after flashing

Updated 2026-10-11. Use a dry, cell-free device. Test the interface, power, dark acquisition, exports, and stop control before filter delivery.

| Step | Action | Acceptance and evidence |
|---|---|---|
| 1 Demo interface | Start DEMO above. Connect. Set three blocks and a three-second interval. Start, then stop. | Confirm DEMO. Confirm cancellation of the remaining schedule. This does not test the PCB. |
| 2 Complete flashing | Upload firmware and LittleFS with the setup guide. | Require SUCCESS for both uploads. Restart and open the page. J2 supplies power; J3 carries programming signals. |
| 3 Board connection | Connect the phone to AeroSense. Open http://192.168.4.1/. Enter the private API_KEY. | Confirm HARDWARE. Do not report DEMO records as board measurements. |
| 4 Dark acquisition | Keep BOARD_VALIDATED=false. Select Dark. Set Blocks=1 and Interval=3. | Check the 8,000-sample block, valid, railSamples, and timing fields. Resolve clipping or timing failures. |
| 5 Save data | Set a sample label before acquisition. Export JSON, CSV, and the latest raw ADC. | Check file contents and the label. Download raw ADC before another block overwrites it. |
| 6 Stop control | Start three dark blocks. After one block, select Stop. | Confirm cancellation of remaining blocks. Check that SW1 removes power when network control is unavailable. |
| 7 One LED | An electronics collaborator must first check power, ADC operating point, and timing. Then unlock, rebuild, and flash. Test each LED at 5% duty. | Check physical well mapping, LED waveforms, ADC range, and stop control. Unfiltered signals do not establish fluorescence performance. |
| 8 Final optics | Install the selected filter. Measure a cell-free blank and a known fluorescent reference. | Require distinguishable fluorescence, valid timing, and no clipping. Follow the measured-correction guide before cell measurements. |

A displayed number does not establish hardware acceptance. Retain failed records. Do not disable QC to obtain valid=true. See the [setup guide](guides/Operation_and_Setup_EN.md).

The current read-only rerun passed 23 host, 10 calibration, 33 measured-correction, and 12 UI DOM/API checks. All 78 checks passed. The app.js syntax check passed. Existing evidence files were preserved. These checks exclude physical flashing, browser visual inspection, ADC timing, optics, and cells.

## GitLab hardware source attachment

The target is `code/aerosense` in the team Wiki repository. It supports Hardware reproduction. It is not the dedicated Best Software submission.

Include firmware, phone UI, server, analysis, tests, dependencies, blank templates, and guides. Exclude private settings, databases, model weights, build caches, working copies, and vendor drawings. Keep placeholders in the example configuration. Inspect the actual upload contents; ignore rules alone do not establish confidentiality.

Preserve the Wiki root LICENSE and deployment settings. Uploading source does not update the ESP32. After firmware changes, rebuild, flash, and check the board. Record the source revision used for each experiment.

## Known limits

This package has no recorded physical-board acceptance. `BOARD_VALIDATED=false` permits only all-LEDs-off acquisition. Enable LEDs only after electrical power, ADC timing and single-LED waveforms pass bench checks. Physical flashing and 4 kHz acquisition with Wi-Fi remain untested.

The grounded TIA noninverting input and ADC negative input can place the dark signal near the ADC lower rail. If dark data are clipped, retain the failure record and ask an electronics collaborator to inspect the operating point. Do not disable validity checks to manufacture a calibration result.

Reflected excitation and LED-synchronous material background remain in the corresponding DLIA channel. Four frequencies do not automatically provide four independent wells; measure optical mixing separately.

The device stores at most eight pending summaries and only the latest raw ADC block in RAM. Rebooting loses RAM. The browser keeps up to 1,000 observed summaries; export after each experiment.

There are no battery-level, cell-temperature, gas-flow or fan-speed sensors, and no connected valve-control circuit. The UI does not fabricate those values. Public internet deployment is not provided; use direct connection or a private LAN for the first two-week prototype campaign.


---

## Reproduction attachment and current browser check

A separate browser check on 2026-10-11 confirmed DEMO connection, language switching, Start, Stop, and JSON/CSV export. Stop changed six pending blocks to zero. Two exported DEMO records retained the sample tag and raw I/Q fields. This was a desktop check. It did not test a physical board or all mobile layouts.

To rebuild the public source archive, run from this folder:

```text
python -B package_source.py --output C:/path/outside-this-package/aerosense-source.zip
```

The archive contains device software, three simulation models, required numerical inputs, CSV results, and validation analysis. It excludes private settings, vendor drawings, generated media, saved numerical fields, caches, and binaries. This keeps the file below the GitLab 10 MB limit. Read the archive's root README for fresh solver commands before plotting. Full replay can be expensive. The local delivery retains all saved numerical fields for fast plotting. The internal manifest lists file hashes. Preserve the full directory structure after extraction. The upload location is `code/aerosense` in the team GitLab repository.

