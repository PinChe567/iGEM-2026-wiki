AeroSense HEK293 microscopy analysis, rerun 2026-10-13

This package contains analysis scripts, parameters, source hashes and data tables.
The original TIFFs are not duplicated in the ZIP. They are linked in the wiki Results Data availability section.
Reproduction: retain the repository layout, install numpy/Pillow/scipy/matplotlib in a Python 3 environment, then run analyze_microscopy.py, analyze_nuclear_objects.py, compare_controls.py, and render_analysis_artifacts.py in that order.
All four scripts live at assets/results/microscopy/. The final script updates only analysis artifacts; it does not modify wiki pages or measured CSVs.
publish_results.py is a retained legacy script. Do not run it against the current wiki: both normal and --text-only modes overwrite Results and Experiments with an earlier page template.
The canonical published methods fragment is assets/experiments/microscopy-methods.html.

Read analysis-report.html for methods and limitations. Object fractions are NOT validated transfection efficiencies or viable-cell fractions.
The companion source workbook and input TIFFs are opened read-only.

Per-field records are technical observations; no independent biological repeats were supplied.
RED/GREEN calls are local contrast above the maximum blank-field 99th score percentile.
Density exclusions and threshold sensitivity materially limit interpretation.

Added 2026-10-11, rerun 2026-10-13: compare_controls.py reproduces object-level Fisher/Holm diagnostics, nominal Wilson intervals, all three blank-field holdouts, and area/object comparisons from the preserved CSVs. Run it after the primary CSVs exist. Read CONTROL-COMPARISON-README.txt for the pseudoreplication and fitted-threshold limitations. This added analysis changes no primary image, segmentation or threshold. The website text is maintained separately from the legacy publish_results.py output.

Source revision, 2026-10-13: the updated team folders contain the same 113 unique source-file hashes (112 TIFFs and transfect.xlsx). Four complete four-channel fields were reassigned to corrected conditions, and two were renumbered within a condition. No new image acquisition or biological repeat is inferred. The current source-manifest.json records the updated paths; source-revision-2026-10-13.json preserves every old-to-new file and field mapping. There are still 12 conditions, 25 fields, 100 measured channel TIFFs and 12 original merge TIFFs. Blank and ORCO-only each have 3 fields; Or85b has 1; the other 9 receptor conditions each have 2. All numerical outputs and gallery labels were rerun against these corrected folders using the unchanged algorithms and thresholds. The team-confirmed 2026-10-10 acquisition metadata retains its original date.
