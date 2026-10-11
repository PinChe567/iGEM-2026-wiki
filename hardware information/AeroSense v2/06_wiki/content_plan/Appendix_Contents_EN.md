# Appendix placement and reading guide

Prepared 2026-10-05. The appendix supports the main Hardware and Model pages. Keep the question, methods, key results, design decision and limits on those pages; use the appendix for full settings, raw outputs, checks and reproducible code. These files are computational and engineering evidence. They do not become physical measurements by being archived.

## Four archives, one package

The main `chatgpt version` folder is authoritative. Its `appendix` folder will contain four topic archives: `optics_code_data.zip`, `airflow_code_data.zip`, `transport_sensitivity.zip`, and `hardware_software_documents.zip`. **Extract all four into the same empty directory, preserving their original relative paths.** Some scripts and documents refer across topics; separate extraction locations break those relationships. The hardware archive contains the same eight selected STLs, manuals, BOM, firmware/UI, validation plan, CAD sources and this content plan. These are copies for distribution, not alternative designs. They contain no CTB exposure files, private configuration, bundled toolchain or original vendor attachments. Use the main package manifests and archive index to check the final delivered files.

## What belongs in each topic

| Topic | Include and read first | Main-page message |
|---|---|---|
| Optical model | [Optical analysis](../../02_simulation/optics/Analysis_EN.md), model source, MC outputs, figure notes and synchronized movie | Geometry-dependent transport and four-channel contributions are modeled. Detector interference/noise scenarios remain explicitly conditional. |
| Gas delivery | [Airflow analysis](../../02_simulation/airflow/Airflow_Analysis_EN.md), [fixed-STL flow operation](../../02_simulation/airflow/Flow_Operation_EN.md), [operating summary](../../02_simulation/airflow/operating_sweep_summary.json), raw curves and numerical checks | Gas can reach the region above the liquid under the modeled boundary conditions; this is not a demonstrated cellular exposure or response time. |
| Liquid/membrane sensitivity | [Separate transport analysis](../../02_simulation/membrane/Analysis_EN.md), equations, parameter grids, raw results and one-way coupling records | This is a counterfactual with no protein-assisted uptake and no liquid mixing. It identifies unresolved assumptions without predicting an observed cell response. |
| Hardware, software and use | Eight STLs, CAD/geometry checks, assembly/BOM, phone interface/firmware, [minimal validation plan](../../07_validation/Validation_Plan_EN.md), feedback form and editable raw-data templates | The build and test process is reproducible; physical performance remains to be established from real PCB data. |

## Gas result to carry onto the main pages

For the unchanged selected shelf and STL, 21 operating conditions covered seven sampled flow rates and three assumed gas diffusivities. The lowest sampled candidate meeting the provisional engineering limits was **3 mL/min**, with worst-well/worst-diffusivity near-liquid gas t90 **50.00 s**. The selected-point finer-grid and half-timestep checks give **50.98 s (+1.97%)** and **49.85 s (−0.30%)**. The 2.5 mL/min case is numerically borderline at 60.04 s; its tiny nominal miss does not prove physical inadequacy. This is an adaptive bounded comparison, not a global optimum or an independently preregistered experiment.

The gas model treats the liquid surface as impermeable and excludes dissolution, binding, uptake and cellular activation. Its gas P95 speed is not cell shear stress or a biological injury threshold. Chamber pressure excludes external filters/tubing. The cooling fan does not set sample-gas flow; the latter must be measured through the assembled path. Keep these boundaries beside the timing result.

## How to place the older liquid calculation

Label it **“Counterfactual: stagnant liquid without protein-assisted uptake.”** At 100 µL and assumed liquid diffusivity 10⁻⁹ m²/s, the separate no-film example gives a bottom-concentration t90 around 22.85 h. This number follows from a deep, unmixed, nonreacting liquid assumption. It is neither measured AeroSense response nor a GCaMP activation prediction, and should not dominate the main-page headline. Faster gas delivery does not establish faster dissolved transport, while a hypothesized binding/uptake protein does not establish the opposite without its identity and functional data.

The earlier one-way calculation uses the original **1 mL/min** gas-rim history ending at 300 s, followed by disclosed boundary continuations. It has not been recomputed for the 3 mL/min candidate and is not a two-way mass-conserving gas–liquid uptake solution. Do not merge its hours with the new gas t90 into a claimed end-to-end response. PDMS remains a research sensitivity, not a mandatory part or extra STL.

## Evidence still to add

The immediate priority is the single cell-free optical/electronic experiment in the validation plan, with raw JSON, actual LED-quadrant mapping, held-out blank and standard levels. Real results should carry their own dates, settings, exclusions and photographs; never fill templates with synthetic examples. No extra liquid or gas study is required merely to populate the appendix. Docking remains exploratory until the actual files and exact protein/receptor identity are supplied; use the [molecular evidence guidance](Docking_OBP_Evidence_EN.md). A score is not measured affinity, uptake or receptor function.
