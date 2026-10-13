# AeroSense hardware and physical models

English publication set · source revision 11 October 2026.

The package documents a proposed four-well reader, numerical models and executable software. No physical-board acceptance, living-cell response or participant results are supplied. The historical simulations use 100 µL; 80 µL is only a provisional physical working fill. The possible headspace mismatch must be resolved before adopting the gas operating point.

## Manuals and use

- [Developer manual](04_manuals/Developer_Manual_EN.html) · [PDF](../../hardware%20information/AeroSense%20v2/04_manuals/Developer_Manual_EN.pdf)
- [User manual](04_manuals/User_Manual_EN.html) · [PDF](../../hardware%20information/AeroSense%20v2/04_manuals/User_Manual_EN.pdf)
- [English BOM, USD](BOM_EN.xlsx)
- [Fluorescence and cell protocol](07_validation/Fluorescence_and_Cell_Test_EN.html)
- [Cell-free validation](07_validation/Validation_Plan_EN.html)
- [Completion plan](07_validation/Completion_Plan_EN.html)
- [Short feedback form](07_validation/User_Feedback_EN.html)

## Reproduce the design studies

- [Optical transport and current four-filter comparison](02_simulation/optics/README.html)
- [Airflow and gas delivery](02_simulation/airflow/README.html)
- [Membrane and liquid transport](02_simulation/membrane/README.html)
- [Device software and setup](03_software/README.html)
- [English source archive](aerosense-source-EN.zip)
- [English manuals and BOM archive](hardware-documents-EN.zip)
- [Published file manifest](publication-manifest.json)

The source archive preserves the firmware, actual UI, analyses, numerical inputs and CSV results. English document versions are included. Large saved numerical fields and generated media are omitted, so read its fresh-replay commands before attempting to plot. Full MC/CFD replay can be expensive. The executable UI retains its original internal language dictionary; no Chinese document version is included. Private settings, databases, caches, CTB print jobs and vendor originals are excluded.

The documentation archive supplies the current English PDF/Markdown manuals and USD workbook. Original Chinese documents remain in the local source folder and are not part of this publication set. Selecting files for publication does not establish a general hardware or source-code license.

## Version and scientific limits

The current optical comparison uses no filter, one or two LEE101 layers, and a constructed 500nm OD4 longpass scenario. The older path movie uses different fixed-OD assumptions. Filter transmission and signal/noise are model scenarios, not real reader performance. Separate dark, illuminated blank, fluorescence phase reference and living-cell baseline records are required.

The source reports 78 host/calibration/correction/UI checks, separately from numerical model checks. Keep BOARD_VALIDATED=false until physical electrical checks pass. A desktop DEMO check is not a board measurement. The cell protocol distinguishes a full dye-first route from an exploratory early-culture branch; later calibration cannot retrospectively validate earlier uncalibrated records.

[Hardware](../../hardware.html) · [Model](../../model.html)
