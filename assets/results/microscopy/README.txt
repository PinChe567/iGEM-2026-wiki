AeroSense HEK293 microscopy analysis, 2026-10-10

This package contains analysis scripts, parameters, source hashes and data tables.
The original TIFFs are not duplicated in the ZIP. They are linked in the wiki Results Data availability section.
Reproduction: retain the repository layout, install numpy/Pillow/scipy/matplotlib in a Python 3 environment, then run analyze_microscopy.py, analyze_nuclear_objects.py, and publish_results.py in that order.
All three scripts live at assets/results/microscopy/.
For text/layout updates without recomputing or redrawing measurements, run publish_results.py --text-only.
The canonical published methods fragment is assets/experiments/microscopy-methods.html.

Read analysis-report.html for methods and limitations. Object fractions are NOT validated transfection efficiencies or viable-cell fractions.
The companion source workbook and input TIFFs are opened read-only.

Per-field records are technical observations; no independent biological repeats were supplied.
RED/GREEN calls are local contrast above the maximum blank-field 99th score percentile.
Density exclusions and threshold sensitivity materially limit interpretation.

Added 2026-10-11: compare_controls.py reproduces object-level Fisher/Holm diagnostics, nominal Wilson intervals, all three blank-field holdouts, and area/object comparisons from the preserved CSVs. Run it after the primary CSVs exist. Read CONTROL-COMPARISON-README.txt for the pseudoreplication and fitted-threshold limitations. This added analysis changes no primary image, segmentation or threshold. The website text is maintained separately from the legacy publish_results.py output.
