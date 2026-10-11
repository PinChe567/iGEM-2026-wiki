# AeroSense engineering package

Start here, then read `docs/EN/Assembly_Manual_EN.pdf`. This is a reproducible engineering prototype with executed simulations, compiled firmware and an operable demo UI. The PCB is not fabricated. Board operation, biological compatibility and odor-recognition performance have not been established.

## Files

|Purpose|Location|
|---|---|
|Print meshes, CAD, drawings|`STL/`, `CAD/`, `docs/EN/Design_Drawings_EN.pdf`|
|Simulation analysis and numerical results|`docs/EN/Simulation_Analysis_EN.pdf`, `results/`|
|Reproduce calculations/figures/movies|`reproduce.py`, `simulation/`, `requirements.txt`|
|Printed, purchased and PCB BOM|`BOM/BOM_EN.xlsx`|
|Assembly|`docs/EN/Assembly_Manual_EN.pdf`|
|UI, firmware, server|`software/`, `docs/EN/Software_Guide_EN.pdf`|
|Operation, normalization, performance|`docs/EN/Operating_Protocols_EN.pdf`|
|Feedback form|`docs/EN/User_Feedback_EN.pdf`|

Each document has Chinese and editable Markdown versions. `manifest.json` provides SHA-256 hashes. Original vendor PDFs and papers are referenced, not redistributed.

## Quick start

Run `python software/server/server.py --demo` from the package root. On the same computer, open `http://127.0.0.1:8765`, enter API key `local-demo-key`, connect and start. All records are explicitly DEMO. This does not operate a PCB.

Print one well for dimensional/material screening before committing to the large enclosure. The baseline has eight parts. The accessible cap replaces one cap with two, giving nine operating prints. Do not purchase both configurations as additive assemblies.

Ask the vendor to complete `validation/fit_measurements.csv` and provide a populated STEP model. Nominal fit is not guaranteed physical clearance. Start electronics with LEDs off; only set `BOARD_VALIDATED=true` after measured power, ADC and LED-waveform checks.

## Materials

|Part|Quantity|Resin|
|---|---:|---|
|01 body, 03 lid, 04 cap|1 each|Rigid PC/GF-like Black|
|02 tray|1|Aqua 8K Gray|
|05 monolithic wells|4|Aqua Clear Plus; fit/material test only, not qualified for direct HEK293T culture|

Both well-floor surfaces are flat, 0.5 mm thick; nominal fill is 150 uL. Flat floors do not ensure uniform illumination. Polishing does not remove bulk purple absorption or autofluorescence; measure transmission/background at the relevant excitation/emission wavelengths and change materials or culture-vessel architecture if unacceptable.

## Reproduction

Python 3.12 is recommended. Install `python -m pip install -r requirements.txt` in an isolated environment. From the extracted root:

```text
python reproduce.py --out ../AeroSense_replot --plots
python reproduce.py --out ../AeroSense_movies --video
python reproduce.py --out ../AeroSense_optics --optics
python reproduce.py --out ../AeroSense_flow --flow --engine csharp --workers 2
python reproduce.py --out ../AeroSense_cad --cad
```

`--out` must be a new directory. Full optical/CFD calculations can be lengthy. CFD runs 27 plate cases plus one no-plate control. The Windows C# accelerator builds from included source using the .NET Framework compiler. Use `--engine numpy` elsewhere, with lower speed. CAD requires OpenSCAD; a non-default location can be supplied to `python CAD/build.py --out new_directory --openscad executable_path`. The CAD combines parametric CSG and canonical meshes; it is not a fully parametric reconstruction of the vendor PCB.

Additional baseline mesh refinement (0.3/0.2 mm results already included):

```text
python simulation/flow_sweep.py --case base --dx .3 --engine csharp --max-steps 60000
python simulation/flow_sweep.py --case base --dx .2 --engine csharp --max-steps 60000
```

Converged files are resume-safe and skipped. Use a fresh output directory for genuine recalculation. Movies advect passive markers in stored steady fields, not time-dependent Navier–Stokes, cell shear, dissolution or growth.

Figure I estimates source-to-PD collection fraction; Figure J multiplies emission fluence rate by collection fraction. Neither is normalized arbitrarily to make the image resemble the paper. Different geometry, media and filters imply different fields and magnitudes.

## Evidence and limits

Executed: 24 optical conditions with three seeds, 247 collection-map points, 27 plate CFD cases plus control, 48 synthetic DLIA cases, UI/API/calibration/model code tests, firmware and LittleFS builds. Validation records distinguish these from physical testing.

All plate cases have higher mean four-well headspace speed than the no-plate control under the stated metric. Mesh independence is not established. Do not claim cell protection from these calculations.

PD offset is modeled, while its signed direction still requires vendor rotation/mirroring confirmation. Wells follow LEDs; they are not forced into exact 90-degree radial spacing about the PD. Four frequency amplitudes from one PD are LED channels, not automatically independent well signals. Measure the optical mixing matrix before unmixing.

The neural-network training/held-out-group/inference pipeline is supplied without a fabricated trained model or odor accuracy. Templates are under `software/templates/`. No cloud account or external deployment has been created; internet access requires HTTPS and authentication configuration.

Known partial device cost is TWD66,749–67,182 including this quote's allocated PCB design/setup. Essential optical/gas items and shared equipment remain unquoted; this is not a complete or production cost.

The package supports wiki design, methods and simulation evidence. Add real photographs, calibration curves, cell data, independent-batch evaluation and participant feedback before claiming demonstrated hardware performance. Select the team's publication licenses and check third-party rights before public release.
