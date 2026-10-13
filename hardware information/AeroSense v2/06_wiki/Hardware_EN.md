# Hardware: current engineering evidence

<a id="hardware-status"></a>
## What has been completed

AeroSense's reader is a computationally designed prototype without recorded physical acceptance for comparing four living-cell fluorescence samples with four modulated LEDs and one shared photodiode. The current release includes eight operating STL files, PCB-referenced CAD, a complete vendor-component transcription, separate printed/purchased-material lists, bilingual assembly and operating instructions, firmware, a phone interface, reproducible simulations and a short validation plan. Physical PCB fit, optical performance and gas-to-cell response remain to be measured.

<a id="hardware-build"></a>
## A compact carrier built around the PCB

The candidate body is approximately 108 × 108 × 66 mm, excluding external fittings. The base integrates a 40 mm fan seat beneath the PCB, while the CAD provides service access for the board's connectors. Four separate flat-floor wells sit within black optical shielding; their locations follow the LED layout rather than assuming the photodiode is centered. The PD active-area offset is included provisionally and must be confirmed against the manufactured board and package orientation.

Each well has a 4 × 2.8 mm internal cross-section and a historical 100 µL model fill. The provisional operating fill is 80 µL. Confirm it on the physical wells before use. Four wells share sample gas while their liquids remain separate. A compression plate and cut silicone seals form the intended gas interface. These are mechanical design features, not a demonstrated sterile barrier. Optical/filter openings retain clear paths, so shielding does not imply zero well-to-well optical mixing.

Use PC/GF-like Black for the final structural and shielding prints. Aqua Clear Plus wells remain fit and cell-free material-evaluation parts until their optical background and HEK293-GCaMP6f compatibility are tested. No new print alternatives or mandatory PDMS film are selected by the current simulations.

See the [assembly manual](../04_manuals/Developer_Manual_EN.pdf), [BOM](../05_BOM/BOM_EN.xlsx) and [editable CAD](../09_engineering_sources/CAD/aerosense.scad). The BOM separates quoted costs from missing prices; the PCB quote includes design/setup and is not a production unit price.

<a id="hardware-optics"></a>
## The optical path exists in the model, but calibration remains necessary

Under the stated ideal-material cell-layer model, NE illumination produced 0.593 ± 0.035 nW at the detector (mean ± Monte Carlo SE across three seeds). This is a conditional prediction using 500 µW LED-on power, a specified thin absorbing cell layer and quantum yield 1; it is not measured GCaMP power or an established detection limit. The NE floor-irradiance coefficient of variation was about 46.2%, showing that a flat bottom alone does not make the light field uniform. Across the four LED rows, roughly 88.6–90.9% of modeled detected fluorescence originated in the intended well. The remaining contributions must not be called zero crosstalk.

Four modulation frequencies distinguish excitation channels. They cannot identify the biological origin of every collected photon, and excitation leakage carrying the same frequency remains in that channel. The [physical-model section](Model_EN.md#optical-transport) explains how reflection, filtering, detector acceptance and well mixing were represented. The [signal comparison](Model_EN.md#detector-interference) separates clean fluorescence from a conditional contaminated detector signal. A measured blank and four-well mixing matrix are required before independent well responses can be claimed.

<a id="hardware-gas"></a>
## Directing gas without claiming turbulence or cell protection

The selected CAD incorporates one shelf rather than adding a removable part. At the finest 0.2 mm grid in the stated comparison, its downward well-mouth momentum proxy was about 36.1% below the open-plenum case and near-liquid P95 gas speed about 20.1% lower. Gas-exchange distribution became less symmetric. This is a transparent tradeoff between directional flow, assembly, cleanability and distribution—not a global optimum or evidence of improved cell survival.

The additional 18-case perforated-plate sweep found lower momentum proxies for some small-hole geometries, but coarse rankings changed on refinement and narrow passages introduce print and cleaning concerns. Those models are exploratory; the package still recommends the same eight operating STLs.

Molecular delivery requires a concentration calculation, not just animated velocity tracers. The 1 mL/min baseline gave gas near the liquid a t90 of about 150 s under the selected gas-diffusion assumptions. A fixed-CAD flow-rate/diffusivity sweep evaluates faster operating points; its selected point and criteria must be read with the [operating-point record](../02_simulation/airflow/README.md). These calculations concern the gas–liquid interface. Proposed protein-assisted uptake and downstream receptor/GCaMP response have not been measured. See [gas transport and uptake scope](Model_EN.md#gas-and-liquid-transport).

The combined 21-condition sweep conditionally selects **3 mL/min sample-gas flow** as the lowest sampled flow meeting the declared nominal-grid criteria. Its worst near-liquid gas t90 across four wells and the three assumed diffusivities is about **50.0 s**. The 2.5 mL/min point is about 60.04 s and numerically borderline, not proven physically inadequate. This operating choice changes no STL. It requires measured sample-flow control; the PCB cooling fan is not the sample-gas controller. Numerical refinement records and actual filter/tubing pressure remain part of the qualification, and no cell-response speed or biological safety is inferred.

<a id="hardware-operation"></a>
## From phone controls to a usable measurement

The software supports a local phone interface, measurement settings, acquisition, calibration records and export. Demonstration data are explicitly labeled. Firmware compilation and software checks are completed numerical/software evidence; they do not confirm flashing or acquisition on this PCB. The supplied firmware initially disables LED operation until electrical checks are completed. It does not invent battery, temperature, flow, fan-speed or valve status for sensors and circuits that are absent.

Follow the [operation and setup guide](../03_software/guides/Operation_and_Setup_EN.md): inspect power and ADC operating point, collect dark data, verify individual LED waveforms, measure a blank and fluorescence reference, then calibrate and acquire. Calibration determines instrument relationships; normalization rescales a sample relative to a defined reference. Neither fixes clipping, drift, wrong channel mapping or biological variability automatically. Model training requires traceable experimental data; no validated trained odor model is supplied.

<a id="hardware-validation"></a>
## The next evidence is deliberately small and practical

The [validation plan](../07_validation/Validation_Plan_EN.pdf) prioritizes a physical fit/assembly check, electrical and optical blank/standard measurements, a gas-delivery comparison and an short routine-use trial. These have not been claimed as completed. A collaborator's useful contribution is a documented observation that changes the design or instructions, followed by a repeat test. Functional proof still requires the real device and real measurements.

Keep Engineering Cycles 1–3 as dated history. Cycle 4 can document the current needs → CAD/simulation → numerical checks → unresolved physical-test loop. Cycle 5 should document manual testing only after a participant attempts the specified tasks; until then publish the protocol and blank feedback form. The reader can then distinguish a design decision, a software check, a simulation and a physical result without guessing.


## Assembly readiness and next evidence

The existing base has a through-wall antenna aperture. The nominal vendor antenna area clears its insertion tongue by only0.66 mm; populated-board dimensions and print tolerances must be checked before claiming fit. [Antenna audit](../09_engineering_sources/CAD/checks/Antenna_Clearance_EN.md). The four printed wells and optical registration remain unchanged. The English BOM uses USD throughout: USD 35.07 for three recalculated print batches and USD 448.00 for the required non-PCB budget, including a USD 377.30 custom-filter allowance. The required device budget is USD 2,511.36, including USD 2,063.35 allocated from the two-board design/setup quote. These are budgets rather than order-ready quotations. Conversion retains the recorded 31.805 NTD/USD snapshot dated 2026-10-05 15:13. Separate Required, Developer and Future classes and retain each price basis.

The next optical check uses sodium fluorescein and an independent illuminated blank; subsequent same-batch cell comparison requires established wet-lab controls and acknowledges approximately5-s device records. [Protocol](../07_validation/Fluorescence_and_Cell_Test_EN.md). Short routine-use feedback remains a Hardware result even when Entrepreneurship/Education cross-link its relevant findings. [Task plan](../07_validation/Completion_Plan_EN.md).

Controlled delivery and time/batch metadata are motivated by [Vergara et al.2012](../08_reference/README.md). Its MOX drift evidence does not validate the chosen flow rate or cell safety.
