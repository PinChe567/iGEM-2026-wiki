# AeroSense: start here

Engineering prototype package, 2026-10-06. Open `START_HERE.html` for an offline index, not the ESP32 control interface. Read the [English handoff](handoff_EN.md) or [中文交接](handoff.md) for the complete handoff. Use this package consistently; do not mix geometry or results from older folders.
**This `chatgpt version` folder is the single complete package. The ZIP with the same name contains the same delivery for sharing. Previous work is outside this package in `舊資料備份_勿列印`.**

**Available now:** dimensional review, fit printing, reproducible simulations, demo UI, firmware compilation and validation preparation. **Not established:** populated-board fit, physical timing/fluorescence sensitivity, HEK293T compatibility or odor recognition. The PCB has not arrived.

## First three steps

1. Read the[assembly manual](04_manuals/Assembly_Manual_EN.pdf) and obtain answers to the[vendor confirmation sheet](04_manuals/Vendor_Confirmation_EN.md). It is a draft, not a sent message.
2. Print the eight STLs in `01_print`, one each. The selected deflector is integral to lid03. Check fit first using well04 and hood02 from this same set; no extra coupon or alternative lid is needed.
3. Exercise DEMO using the[operation guide](04_manuals/Operation_and_Setup_EN.pdf). After PCB arrival, follow the[single standard-liquid experiment](07_validation/Validation_Plan_EN.pdf) before making hardware claims.

## Editable Word and reading PDFs

| Document | Chinese edition | English edition |
|---|---|---|
| Assembly manual | [PDF](04_manuals/Assembly_Manual_ZH.pdf) · [Editable Word](04_manuals/Assembly_Manual_ZH.docx) | [PDF](04_manuals/Assembly_Manual_EN.pdf) · [Editable Word](04_manuals/Assembly_Manual_EN.docx) |
| Operation and setup | [PDF](04_manuals/Operation_and_Setup_ZH.pdf) · [Editable Word](04_manuals/Operation_and_Setup_ZH.docx) | [PDF](04_manuals/Operation_and_Setup_EN.pdf) · [Editable Word](04_manuals/Operation_and_Setup_EN.docx) |
| User feedback form | [PDF](07_validation/User_Feedback_ZH.pdf) · [Editable Word](07_validation/User_Feedback_ZH.docx) | [PDF](07_validation/User_Feedback_EN.pdf) · [Editable Word](07_validation/User_Feedback_EN.docx) |

Use Word for collaborative editing and PDF for reading/printing. **Word edits do not automatically update the Markdown sources, PDFs or wiki.** Before future builds, manually reconcile accepted edits into both language sources, then regenerate and review each format. [build_word_documents.py](04_manuals/build_word_documents.py) replaces all six Word outputs from their sources; preserve unreconciled edits first. Save completed questionnaires separately from blank templates. See the [English handoff](handoff_EN.md) / [中文交接](handoff.md) for source relationships and the update workflow.

## Print list

| STL | Role | Resin | Quantity |
|---|---|---|---:|
| [01_base_BLACK.stl](01_print/01_base_BLACK.stl) | Base, fan cradle and service openings | PC/GF-like Black | 1 |
| [02_black_hood_BLACK.stl](01_print/02_black_hood_BLACK.stl) | Black hood, four sleeves and filter seat | PC/GF-like Black | 1 |
| [03_gas_lid_BLACK.stl](01_print/03_gas_lid_BLACK.stl) | Removable lid, gas cap and deflector | PC/GF-like Black | 1 |
| [04_well_NE_CLEAR.stl](01_print/04_well_NE_CLEAR.stl) | NE flat-bottom well | Aqua Clear Plus | 1 |
| [05_well_NW_CLEAR.stl](01_print/05_well_NW_CLEAR.stl) | NW flat-bottom well | Aqua Clear Plus | 1 |
| [06_well_SW_CLEAR.stl](01_print/06_well_SW_CLEAR.stl) | SW flat-bottom well | Aqua Clear Plus | 1 |
| [07_well_SE_CLEAR.stl](01_print/07_well_SE_CLEAR.stl) | SE flat-bottom well | Aqua Clear Plus | 1 |
| [08_gas_compression_plate_BLACK.stl](01_print/08_gas_compression_plate_BLACK.stl) | Four-hole seal compression plate | PC/GF-like Black | 1 |

Aqua Clear Plus wells initially support dimensional and cell-free material tests; HEK293T compatibility is unqualified. Aqua8K Gray does not replace the required black shielding. STL units are mm, scale100%. Meshes have Z=0 build origins but no automatic supports or validated printing orientations. Protect optical and sealing surfaces as directed in the manual.

## Folder map

| Folder | Contents |
|---|---|
| 01_print |Only the eight operating STL files, one each |
| 02_simulation |Optical/airflow source, sweeps, raw data, plotting code, MP4/GIF and bilingual analyses |
| 03_software |ESP32 firmware, bilingual UI, optional LAN server, DLIA/research-NN code and executed checks |
| 04_manuals |Bilingual assembly, setup/operation and full-analysis PDFs; vendor questions |
| 05_BOM |Bilingual Excel: Summary/Printed/Purchase/PCB; CSVs and price provenance |
| 06_wiki |Bilingual hardware pages, Cycle4/5 fragments and integration map; not deployed |
| 07_validation |Single-experiment plan, feedback forms, ten empty data tables, importer/plots and evidence mapping |
| 08_reference |Original vendor drawings/BOM with rights boundaries; not a complete open fabrication package |
| 09_engineering_sources |CAD source, drawings and validation records for reproduction/editing; no extra prints |

## Essential conclusions

- Body108×108×66 mm. Each well holds100 µL nominally with4×2.8 mm inner section and0.5 mm flat floor. These are reduced-size wells, not96-well geometry.
- Ideal optical transport predicts collection, but intended-well share is88.6–90.9% and NE floor illumination CV46.2%. Reflected background keeps the LED frequency; DLIA does not automatically remove it.
- The selected shelf is already integrated into lid03. Across three grids, downward momentum falls approximately30–36%, with worse inter-well circulation symmetry. This is neither a global optimum nor cell-protection proof.
- J2 USB-C is power/charging; J3 is the UART programming interface. BOARD_VALIDATED=false defaults to dark-only bring-up.
- Known non-PCB material cost is approximatelyNT$768–1,041; required unquoted items prevent a complete total. The NT$131,250/two-board quote includes design/setup.
- Measured-data templates are blank. DEMO, synthetic tests and simulations must never be relabelled as physical or biological results.

`file_catalog.csv` lists every public deliverable and its role. `manifest.sha256` fixes the release files. Geometry edits require regenerated STLs, BOM and corresponding simulations; renaming old outputs is not a rerun.

## Simulation figures, movies and interpretation

Open the [complete figure and movie index](02_simulation/INDEX_EN.html). Every figure has a caption and individual Markdown notes; [reproduction entry points](02_simulation/README_EN.md) identify each model.

Cells are confirmed bottom-adherent with100 µL per well, giving approximately8.93 mm liquid depth. Gas reaching the well rim is distinct from odor reaching the cells. With stagnant liquid and an assumed diffusivity of1×10⁻⁹ m²/s, the ideal surface-step bottom t90 is approximately22.83 h. This is a conditional design sensitivity, not a measured cellular response time.

PDMS thickness and transport properties have been swept. Unknown target VOCs and real material properties prevent selecting a best formulation; hydrophobicity does not establish a water-vapor barrier. The selected build remains eight STLs with the integral flow shelf; no PDMS film or purchase item is added.

The interactive HTML includes offline data and controls. Local browser preview was blocked by the browser security policy, so actual browser interaction remains unverified.

User-provided `01_print/*.ctb` and `01_print/cost.md` are preserved unchanged. Slicer settings are unvalidated. The BOM uses the source formula recalculated from recorded resin subtotals and printing times: **NT$1,115.39** across three batches. The handwritten batch totals and old resin-only model are not used in current totals. This remains an estimate, not an invoice.


## Current operating and analysis decision

The eight STL files are unchanged. The fixed-geometry flow sweep selects **3 mL/min as a conditional starting point**: nominal worst gas t90=50.00 s; finer-grid check=50.98 s; half-timestep=49.85 s. This uses a provisional 60 s / 90% inlet-concentration target, not a known biological threshold. Use one externally regulated downstream pump and physically verify flow; software settings do not measure or regulate flow. The protein-assisted capture mechanism remains unvalidated.

The UI now supports measured illuminated-blank I/Q subtraction, a measured fluorescence phase reference, unsmoothed corrected export and timestamp-based display EMA. Raw data remain intact. Constant subtraction cannot remove changing same-frequency contamination or shot noise. One cell-free standard-liquid experiment tests hardware response and optical transfer; it does not establish odor sensing.

- [Flow operation / 氣流操作](02_simulation/airflow/Flow_Operation_EN.md) · [3D scan / 3D 掃描](02_simulation/airflow/operating_sweep_3d.html)
- [Measured correction / 實測校正](03_software/guides/Measured_Correction_EN.md)
- [Wiki placement / 三頁配置](06_wiki/content_plan/Placement_Plan_EN.md)
- [Publication appendix / 發布附錄](appendix/INDEX_EN.html)


## Immediate assembly and evidence work

Use the [completion checklist](07_validation/Completion_Plan_EN.md), [antenna clearance audit](09_engineering_sources/CAD/checks/Antenna_Clearance_EN.md), [fluorescence/cell test guide](07_validation/Fluorescence_and_Cell_Test_EN.md) and [gas-delivery reference](08_reference/Gas_Delivery_Reference_EN.md). All eight STLs and the wells already being printed are unchanged. The BOM now uses recalculated batch formulas and separate item/specification/use columns, without adding resin twice.
