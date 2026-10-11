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
| `evidence/` | Executed software checks and schematic review evidence |

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

## Known limits

The PCB has not arrived. `BOARD_VALIDATED=false` permits only all-LEDs-off acquisition. Enable LEDs only after electrical power, ADC timing and single-LED waveforms pass bench checks. Physical flashing and 4 kHz acquisition with Wi-Fi remain untested.

The grounded TIA noninverting input and ADC negative input can place the dark signal near the ADC lower rail. If dark data are clipped, retain the failure record and ask an electronics collaborator to inspect the operating point. Do not disable validity checks to manufacture a calibration result.

Reflected excitation and LED-synchronous material background remain in the corresponding DLIA channel. Four frequencies do not automatically provide four independent wells; measure optical mixing separately.

The device stores at most eight pending summaries and only the latest raw ADC block in RAM. Rebooting loses RAM. The browser keeps up to 1,000 observed summaries; export after each experiment.

There are no battery-level, cell-temperature, gas-flow or fan-speed sensors, and no connected valve-control circuit. The UI does not fabricate those values. Public internet deployment is not provided; use direct connection or a private LAN for the first two-week prototype campaign.
