# AeroSense complete handoff

Document baseline: 2026-10-06. [Traditional Chinese](handoff.md). [Start here](START_HERE.html). This directory is the authoritative complete package. `appendix` is its publication subset, not another design. No live wiki update, vendor message, purchase or physical-board flashing has been performed.

## 1. Current decision and evidence boundary

The design retains the approximately 100×90 mm PCB, four LEDs, one offset PD and four liquid-separated wells sharing the same gas sample. The user confirmed bottom-adherent HEK293T cells and 100 µL per well. **The eight selected STLs are unchanged. The package supports a cell-free engineering prototype; it does not guarantee populated-board fit, adequate cellular sensitivity, independent wells or odor recognition.**

The fixed-geometry gas operating candidate is **3 mL/min**, with a worst gas-side t90 of approximately 50 s across the declared wells and diffusivity assumptions. This is not the time to bottom-cell exposure or GCaMP activation. The next priority is supplier mechanical confirmation, essential electrical/ADC preflight and one cell-free fluorescence-standard experiment, rather than more uncalibrated simulation or neural-network training.

## 2. Package map

| Location | Purpose |
|---|---|
| [01_print](01_print) | Eight operating STLs in mm at 100% scale; preserved user CTBs and cost.md. Slicer settings have not thereby been validated. |
| [09_engineering_sources/CAD](09_engineering_sources/CAD) | OpenSCAD, dimensions, export/interference-check scripts, drawings and 1:1 gasket templates. No second printable option set. |
| [02_simulation](02_simulation/INDEX_EN.html) | Optical, gas-flow and separate liquid/PDMS studies; source, raw data, figures, movies, interactive plots and individual bilingual notes. |
| [03_software](03_software/README_EN.md) | ESP32 firmware, LittleFS phone UI, optional private-LAN server, offline DLIA/research classifier, test and build evidence. No validated odor classifier or deployed cloud service. |
| [04_manuals](04_manuals/README.md) | Separate assembly, operation, design/simulation documents, supplier questions and PDF/Word deliverables. |
| [05_BOM](05_BOM/README_EN.md) | Bilingual workbooks: 8 print rows, 61 original PCB rows, 26 purchase rows in Required, Developer and Future classes; eight matching CSV exports. |
| [06_wiki](06_wiki/hardware_EN.html) | Unpublished local previews, Cycles 4/5, integration maps, current-site audit and three-page editorial drafts. |
| [07_validation](07_validation/Validation_Plan_EN.md) | One standard-liquid experiment, quick_check.py, empty records, user feedback forms and Hardware evidence mapping. No completed measurements or participant results. |
| [08_reference](08_reference/README.md) | Vendor schematic, TOP/BOT PDFs, original BOM and website snapshots. The locked board was not decrypted; complete fabrication data and redistribution rights remain supplier inputs. |
| [appendix](appendix/INDEX_EN.html) | Four indexed publication archives: optics, airflow, transport sensitivity and hardware/software/documents. Extract all into the same empty directory. Private settings, databases, toolchains, user CTBs and vendor originals are excluded. |
| [file_catalog.csv](file_catalog.csv), [manifest.sha256](manifest.sha256), [RELEASE_CHECKS.json](RELEASE_CHECKS.json) | File roles, hashes and executed release checks. Rebuild after changes; old validation cannot certify new files. |

## 3. Printing and mechanical dependencies

| STL | Resin and function |
|---|---|
| [01_base_BLACK.stl](01_print/01_base_BLACK.stl) | PC/GF-like Black: base, integral fan cradle, access openings and feet. |
| [02_black_hood_BLACK.stl](01_print/02_black_hood_BLACK.stl) | PC/GF-like Black: well registration, opaque sleeves and central walls. |
| [03_gas_lid_BLACK.stl](01_print/03_gas_lid_BLACK.stl) | PC/GF-like Black: gas lid with the selected integral shelf. |
| [04_well_NE_CLEAR.stl](01_print/04_well_NE_CLEAR.stl), [05_well_NW_CLEAR.stl](01_print/05_well_NW_CLEAR.stl), [06_well_SW_CLEAR.stl](01_print/06_well_SW_CLEAR.stl), [07_well_SE_CLEAR.stl](01_print/07_well_SE_CLEAR.stl) | Aqua-Clear Plus: four separate, replaceable flat-bottom wells. |
| [08_gas_compression_plate_BLACK.stl](01_print/08_gas_compression_plate_BLACK.stl) | PC/GF-like Black: removable plate loading the four well-rim seals; do not omit it. |

There is no additional “best option lid” to print. Aqua 8K Gray is not used in this operating set; a gray trial part is not a validated black optical barrier. Wells locate by their flanges and lift vertically after releasing the compression plate; brittle printed resin is not repeatedly flexed as a spring latch. Black opacity, clear-resin transmission/autofluorescence and cell compatibility remain unmeasured. Ideal clear optics do not qualify the purple tint or culture compatibility of Aqua-Clear Plus.

The nominal envelope is 108×108×66 mm, with a 40×40×10 mm fan under the PCB. Well interiors are 4×2.8×12.5 mm with 0.5-mm flat floors: 140 µL geometric brim capacity, 100 µL operating fill. Centers follow the LEDs at X=±3.3,Y=±2.65 mm. The PD uses an offset sensitive-area proxy, not the package center. A minimum 1.2-mm black central wall leaves the bottom optical band open, so cross-well light remains possible.

[CAD checks](09_engineering_sources/CAD/checks) cover the eight meshes and modeled nominal clearances, not every unknown component or a populated STEP. Confirm board thickness/holes, face mirroring, loaded battery-holder height, C21/R27/U8, connector bodies, solder and wiring envelopes. A provisional 0.5-mm clearance check around real components still requires location-specific tolerance assessment. Do not force fit with screws. Record unresolved items in [Vendor Confirmation](04_manuals/Vendor_Confirmation_EN.md).

**ESP32 check from the supplied photos and vendor drawing:** the base already has a23-mm-wide through-wall antenna aperture at X[-8,15],Y[-56,-44],Z[27,39.6] mm. The upper insertion tongue is tighter:7.2 mm permitted overhang versus approximately6.54 mm in the drawn antenna area, leaving only0.66 mm nominal insertion clearance. The drawing is not a certified physical outline. Confirm actual overhang, module width and underside height before assembly. All eight STLs, all four wells and registration interfaces remain unchanged. Mechanical clearance is not RF qualification; the present opening does not establish Espressif’s recommended15-mm clearance in all directions. Use the [antenna audit](09_engineering_sources/CAD/checks/Antenna_Clearance_EN.md) and updated assembly manual, including an open/closed-housing phone check.

## 4. Purchases, cost and editable documents

Use [BOM_EN.xlsx](05_BOM/BOM_EN.xlsx): one 5-V fan; four M3×8, two M3×16 and two M3×35 screws; eight M3 nuts and six washers; 0.8-mm opaque silicone sheet, wiring/insulation, suitable power, inlet/exhaust filters, short tubing/adapters and a fluorescence filter. The fan bracket and deflector are integral; no four-valve set or hinge kit is required. Gas source/pump, flow measurement and independent pressure limiting remain unquoted shared equipment. Borrow where practical and verify actual flow; do not select a pump solely from the tiny modeled chamber pressure drop.

The PCB quote is **NT$131,250 for two boards including design/setup**; NT$65,625 is its allocated share, not a production price. The current BOM separates item name, specification, quantity/unit and installation/function. Screw names are M3×8, M3×16 and M3×35, with locations in a separate field. The 61 PCB source rows retain supplier quantities/references; missing package, tolerance and rating information is explicitly identified rather than invented.

2026-10-08. Workbooks show NTD and USD. Required, Developer and Future are the primary classes. Printed parts, PCB records and purchases retain separate detail. Specifications, purpose, price source and unresolved compatibility are distinguished. Required includes eight prints, the PCB and 13 purchased assembly lines. Developer includes 10 external programming, measurement, gas-delivery and tool lines. Borrowing is acceptable; gas delivery and flow verification remain necessary for gas experiments. Future contains PDMS, valve development and environment sensing. These three lines are excluded from current device budgets. **These are budgets, not an order-ready total.** The device includes NTD 12,000 for a custom thin emission filter. Edmund 67-016 lists at USD 284, but its 12.5 mm diameter and approximately 2 mm thickness do not fit the 5.2 × 4.2 × 1.0 mm seat. Cutting the outline alone does not fix thickness. Obtain a dimensional, angular-spectrum and fabrication quotation. See [BOM basis](05_BOM/README_EN.md).

Word copies are editable authoring documents; PDFs are for reading/printing, while Markdown remains the current scripted publishing source:

| Document | Chinese Word | English Word | Source |
|---|---|---|---|
| Assembly | [Assembly_Manual_ZH.docx](04_manuals/Assembly_Manual_ZH.docx) | [Assembly_Manual_EN.docx](04_manuals/Assembly_Manual_EN.docx) | [ZH Markdown](04_manuals/Assembly_Manual_ZH.md) / [EN Markdown](04_manuals/Assembly_Manual_EN.md) |
| Operation/setup | [Operation_and_Setup_ZH.docx](04_manuals/Operation_and_Setup_ZH.docx) | [Operation_and_Setup_EN.docx](04_manuals/Operation_and_Setup_EN.docx) | [ZH guide](03_software/guides/操作與設定_ZH.md) / [EN guide](03_software/guides/Operation_and_Setup_EN.md) |
| User feedback | [User_Feedback_ZH.docx](07_validation/User_Feedback_ZH.docx) | [User_Feedback_EN.docx](07_validation/User_Feedback_EN.docx) | [ZH Markdown](07_validation/User_Feedback_ZH.md) / [EN Markdown](07_validation/User_Feedback_EN.md) |

**Word edits do not automatically update Markdown, PDFs, wiki pages or archives.** Assign a document owner to reconcile accepted changes manually into both language sources, then regenerate and inspect Word/PDF/publication outputs. Do not assume separately edited formats are synchronized. Save completed questionnaires as participant records, retaining blank templates.

## 5. Optical, interference and software evidence

The main MC uses 24 cases × 3 seeds and 6,048,000 packets. Separate calculations include 600,000 floor-irradiance packets, 224 collection points × 65,536 packets, a uniform-volume standard model, and 12 LED/filter cases × 3 seeds adding 3,024,000 packets. The conditional detector study has 144 scenarios × 32 noise repetitions, not PCB experiments. Sources and reproduction instructions are in the [optical README](02_simulation/optics/README_EN.md), [primary summary](02_simulation/optics/results/summary.json) and [figure guide](02_simulation/optics/Figure_Guide_EN.md).

At the assumed 500-µW LED-on power, 20-µm bottom cell layer, absorption 0.5/mm and quantum yield 1, the NE case gives 0.593±0.035 nW at the ideal PD (three-seed mean ± 1 SE). Intended-well contributions are 88.6–90.9%, the mixing-matrix condition number is approximately 1.86, and NE floor irradiance CV is approximately 46.2%. This supports a conditional collection path with remaining nonuniformity/mixing, not sufficient cellular sensitivity, a measured detection limit or independent wells.

DLIA at 41/67/89/113 Hz retains excitation leakage and other-well light synchronous with each LED. Reflection is not inherently noise: useful fluorescence can reflect before detection. Read the ideal/received/residual/noise plots and synchronized movie using the units and assumptions in [Analysis](02_simulation/optics/Analysis_EN.md); animation is neither real photon flight time nor cell footage.

The phone UI provides [measured correction](03_software/guides/Measured_Correction_EN.md): independently measure a cell-free illuminated blank, subtract it once in complex I/Q space, and separately measure a fluorescence phase reference. Preserve raw, unsmoothed corrected and signed-projection values. Living-cell F0 is a biological baseline, not unwanted blank. Timestamp-based EMA is display averaging. Constant subtraction cannot eliminate random noise, clipping or interference that changes after calibration; the simulated mixing matrix is not automatically applied.

The [software evidence summary](03_software/evidence/software_validation_summary.json) records current firmware/LittleFS builds, 23 host tests, 10 calibration checks, 33 measured-correction checks, 12 DOM/API integration checks, 4 synthetic model checks and 48 DLIA scenarios. These heterogeneous counts are not experimental sample sizes. Current controls lack full visual-browser validation. No board was flashed; `BOARD_VALIDATED=false` remains. There are no battery, cell-temperature, flow or fan-speed sensors and no validated odor classifier.

J2 USB-C supplies power/charging; J3 is 3.3-V UART. Follow the wiring guide rather than improvising. Check rails, raw dark ADC, single-LED mapping and timing before LED operation. A grounded TIA/ADC operating point may clip at the lower rail; correct the circuit problem rather than disabling QC or hiding it by subtraction. Start with a device connection or private LAN. Public cloud security, access control, TLS and backups are not deployed features of this package.

## 6. Gas operating candidate and unresolved cellular delivery

The gas ledger preserves 28 original velocity solves, including 18 geometries; adds 18 hole cases + 2 refinements, 9 baseline scalar cases + 1 analytic benchmark, then 21 operating points + 6 scalar checks + 1 direct velocity confirmation. See the [supplemental ledger](02_simulation/airflow/supplemental_summary.json) and [operating summary](02_simulation/airflow/operating_sweep_summary.json). Solver counts are not experimental replicates.

The shelf is already in lid 03; no STL switch is required. Selection balances redirection, cleaning and part count, not turbulence or every metric's minimum. The retained 1-mL/min, Dgas 10-mm²/s baseline has NE near-liquid gas t90 = 149.55 s. The Q×D study applies provisional targets: worst gas t90≤60 s, port Re≤3 and gas P95≤0.01 mm/s. The lowest qualifying sampled candidate is 3 mL/min: worst t90 = 50.00 s, refined grid 50.98 s, half timestep 49.85 s. Q2.5 gives approximately 60.04 s and is numerically borderline, not physically proven inadequate. **The gas-speed cap is an engineering comparison limit, not a cell-injury threshold.**

Use one externally regulated downstream pump and measure approximately 3 mL/min with all tubing/filters installed. At a common pressure/temperature reference, steady inlet/outlet volume rates match; do not independently prescribe unequal push/pull flows. Modeled chamber drop is approximately 0.02737 Pa, excluding external tubing/filters. A UI flow entry is not physical flow control or measurement. [Flow_Operation](02_simulation/airflow/Flow_Operation_EN.md) provides assumptions, local speeds and the interactive sweep.

At 100 µL, liquid depth is approximately 8.93 mm and sub-rim gas depth 3.57 mm. Very slow gas markers do not preclude molecular diffusion, but arrival above liquid does not establish bottom-cell exposure. The separate [liquid/PDMS analysis](02_simulation/membrane/Analysis_EN.md) includes 243 membrane conditions and additional sensitivities. A no-protein/no-mixing scenario with liquid D=10⁻⁹ m²/s and an ideal surface step yields approximately 22.83-h bottom t90. This is a specified boundary case, not a measured receptor response or a result transferable without considering mixing, partitioning and reaction. PDMS is not in the operating assembly/required BOM; hydrophobicity does not establish a water-vapor barrier. Full two-phase/cellular coupling remains unvalidated.

The proposed capture protein lacks an exact identity/sequence/accession and reproducible project docking inputs, poses and logs. Read the documented search scope in [Docking/OBP Evidence](06_wiki/content_plan/Docking_OBP_Evidence_EN.md); absence in that scope does not prove the team did nothing elsewhere. At present this is a hypothesis. Docking scores cannot become measured Kd, uptake rates or activation evidence, nor demonstrate that the delivery limitation has been solved.

The added [Vergara et al.2012 reference](08_reference/Gas_Delivery_Reference_EN.md) motivates controlled delivery and time/batch records. Its MOX sensor drift study does not validate this chamber flow, HEK293T safety or our DLIA correction. Full citation and BibTeX are provided; no unverified paper flow setting was adopted.

## 7. One main experiment after board arrival

Follow the [single-experiment plan](07_validation/Validation_Plan_EN.md). Essential unpowered fit/off-board water-leak checks, rails/ADC, DARK, stop command and observed D1–D4 mapping precede illuminated B_CAL, held-out B_CHECK, four single-well C conditions, all-well 0.5C, all-well C and repeated 0.5C. These are nine illuminated analytical conditions, each with at least five distinct valid 2-s blocks; retain DARK separately. Plan 60–120 minutes once assembly/flashing and handling are familiar. Faults must be resolved rather than bypassed to meet that estimate.

Record the standard, medium/pH, fill, wells, filter, duty and frequencies. Export raw JSON with the observed quadrant mapping and run [quick_check.py](07_validation/quick_check.py). It produces concentration response, a 4×4 single-well matrix and held-out blank before/after plots, rejecting DEMO, duplicate or incompatible records. Five blocks are technical repeats, not five biological experiments. Compare the standard matrix with homogeneous-volume MC, not the bottom-cell model. This experiment cannot establish VOC capture, gas t90, cell survival or classification accuracy.

Separately, ask 2–3 non-designers to use the manual, recording completion, time, assistance, orientation/seal errors and specific suggestions. Fix the most important 1–2 issues and repeat the relevant tasks; retain unresolved problems and any same-participant learning effect. Cycle 5 remains planned until observations, changes and retests exist. Add cells only under an established laboratory workflow with matched controls; this handoff invents no culture or stimulus recipe.

The practical standard is **sodium fluorescein**, preferably borrowed as a traceable reagent/stock. Follow [the standard and cell comparison guide](07_validation/Fluorescence_and_Cell_Test_EN.md); it specifies a provisional50/100-nM pilot and separates optical validation from gas/cell claims. Current acquisition averages2-s blocks with at least3-s idle, approximately one record every5s: rapid GCaMP6f peaks may be missed. Use an established sustained response for a matched same-batch wet-lab comparison, with an unshifted common window. The [completion checklist](07_validation/Completion_Plan_EN.md) maps the seven pending tasks to a ten-day working sequence plus final review buffer. Physical fit, flashing, participants and biological outcomes remain pending.

## 8. Exact wiki placement

Use [Placement_Plan_EN.md](06_wiki/content_plan/Placement_Plan_EN.md) and the [Integration Map](06_wiki/Integration_Map_EN_ZH.md). Keep the evidence organized by purpose rather than copying this entire package into one page.

| Page/current anchors | Main-page content | Appendix/download content |
|---|---|---|
| Hardware: `hardware-architecture`, `mechanical-package`, `reader-assembly` | Need, current CAD/exploded view, ports/fan, eight-part/resin list, assembly route and pending populated fit. | Full CAD/STLs/BOM/manuals and nominal checks. |
| Hardware: `optical-question`, `well-floor-results`, `gas-path-results` | Conditional optical path, nonuniformity/mixing, deflector tradeoff and Q3 candidate. Replace figures/captions/numbers together; do not mix old geometry. | Full hole/Q×D sweeps, raw fields and convergence records. |
| Hardware: `electronics-bridge`, `cost-and-reproduction`, `validation-boundary` | Measured I/Q correction, known/unknown cost, one experiment and remaining evidence gaps. | Firmware/UI, test logs, blank templates and analysis code. |
| Model: add Read physics at `aerosense-bridge`; new `optical-transport`, `detector-interference`, `gas-and-liquid-transport`, `model-to-build` | Question, method, units, numerical checks, central results and their design consequences. Focus gas-to-interface delivery; mark protein-assisted capture as untested. | Complete code/seeds/tables/notes; detailed liquid/PDMS boundary cases and docking only when genuine inputs exist. |
| Model: existing `evidence-snapshot`, `network`, `training-evaluation`, `performance`, `limitations`, `reproduce` | Preserve the separate KT metal-oxide SNN benchmark. F1=0.868 is not AeroSense cell data or new validation by this package. | Existing training-source gaps remain; optical/flow code cannot replace them. |
| Description: `read`, `decode`, `evidence-ladder` | Concise gas→liquid/cells→fluorescence→PD/ADC→phone diagram, evidence status and Hardware/Model links. | Avoid dense parameter plots here. OBP can appear only as a distinct future hypothesis. |
| Engineering: preserve `hw-cycle-1`–`hw-cycle-3` under `group-hardware`; add 4/5 | Cycle 4: requirements→CAD/computation→conditional operation→pending bench evidence. Cycle 5: task→observed difficulty→change→retest, without invented outcomes. | [Cycle 4/5 fragments and preview](06_wiki/engineering_cycles_EN.html), original measurements and user records. |

Editable page drafts: [Hardware](06_wiki/content_plan/Hardware_Sections_EN.md), [Model](06_wiki/content_plan/Model_Sections_EN.md), [Description](06_wiki/content_plan/Description_Sections_EN.md). Core methods, figures and conclusions must remain visible on the main pages; indexed archives support reproduction rather than hide the evidence. Best Hardware emphasizes need, user input, functional evidence and reproduction; use the [evidence matrix](07_validation/Hardware_Evidence_Matrix_EN.md). No additional Overgrad SNR/cost threshold or award guarantee is invented. Before publication, verify current team-platform hosting requirements, attribution, vendor rights and consent. A GitHub preview is not the official submission.

Assembly usability evidence belongs primarily in Hardware, and revisions/retests in Engineering Cycle5. Entrepreneurship may cross-link actual target-user adoption barriers; Education requires a learning objective, dialogue and learning evidence. A peer assembly questionnaire alone is neither customer validation nor demonstrated educational impact. Keep one underlying study and distinguish its uses; see [Completion Plan](07_validation/Completion_Plan_EN.md).

## 9. Update workflow for the next collaborator

1. **Freeze inputs.** Retain supplier answers, physical dimensions, date/operator/version and failed raw records; preserve user CTBs/cost notes. Geometry changes start in [design_parameters.json](09_engineering_sources/CAD/design_parameters.json) and OpenSCAD, followed by STL export, checks and affected model updates.
2. **Distinguish solving from replotting.** Follow the [optical README](02_simulation/optics/README_EN.md). Airflow `python reproduce.py` redraws saved output; `--fresh-dir` creates a new solve directory. Individual components were executed, but the final expanded full fresh-directory wrapper has not been rerun end-to-end. Model READMEs specify dependencies and video commands; animation adds no experimental evidence.
3. **Promote claims only with raw data.** Run the documented single-experiment analysis and retain exclusions. Replace a wiki pending label only with a scoped measured result. Do not tune a classifier to conceal unstable acquisition.
4. **Reconcile authoring sources.** Manually transfer accepted Word edits into both Markdown/guide editions, rebuild Word/PDF and inspect layout. Run relevant existing tests after code changes; rebuild firmware and LittleFS separately. Keep credentials private.
5. **Rebuild the release.** Refresh the simulation gallery, `06_wiki/build_wiki.py`, local link checks, appendix ZIPs, catalog, manifest and RELEASE_CHECKS using the release scripts. Sources, captions, BOM, manuals and pages must describe the same data. Publish only after team review. Interactive plots have code/data tests, not complete browser or hardware qualification.

Leave unperformed hardware, biological and participant measurements blank. The handoff should let the next person obtain, interpret and preserve the next credible piece of evidence.

## Manual and cost use

Assembly and operation manuals now use ASD-STE100 Issue 9 writing principles in English and corresponding Chinese procedures. Tasks separate preparation, actions, checks and corrective actions. Full vocabulary compliance was not audited; do not claim ASD-STE100 certification. The questionnaire remains separate. The reported approximately 100 µL physical brim capacity takes precedence over a CAD estimate. The 80 µL working volume remains provisional; existing 100 µL simulations were not rerun. The lid has an integral horizontal shelf, and internal tube tails connect through side slots. STLs and firmware are unchanged.

Hardware should show assembly, present limitations and required-device budget. Engineering should document assembly observations, changes and retests. Link editable Word, detailed BOM and sources through the appendix. Model retains its original assumptions; 80 µL is not a recalculated simulation condition. Separate developer and future costs. Do not describe allowances or proxies as paid or production prices.


2026-10-08 document status: English assembly and operation procedures use ASD-STE100 Issue 9 writing principles with corresponding Chinese steps; no formal compliance certification is claimed. All four PDFs were visually inspected. Editable Word content, structure and source hashes were checked, but Word startup stalled and actual pagination is unverified. Previous manual render approval does not apply. Use PDF for reading/printing; check Word pagination locally before printing. STL, four wells and firmware are unchanged.
