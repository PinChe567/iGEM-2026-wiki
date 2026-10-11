# AeroSense technical appendix

This is a publication subset of the authoritative chatgpt version package, not another design version. The selected eight STL meshes are unchanged. Extract all four archives into the SAME empty folder; paths are designed to merge. They contain source, saved raw simulation outputs, scripts for figures, software, current manuals and the selected print files. Large user slicer CTBs, private configuration, local databases, toolchains and vendor originals are excluded.

- [optics_code_data.zip](optics_code_data.zip) - Optical Monte Carlo, synthetic DLIA, figures and movies (16.3 MB)
- [airflow_code_data.zip](airflow_code_data.zip) - Fixed-CAD gas flow, parameter scans, raw fields and 3D explorer (95.3 MB)
- [transport_sensitivity.zip](transport_sensitivity.zip) - Separate liquid/PDMS transport assumptions and sensitivity (0.6 MB)
- [hardware_software_documents.zip](hardware_software_documents.zip) - Eight STLs, CAD, firmware/UI, BOM, manuals, single-experiment analysis and wiki drafts (8.8 MB)

## Interpretation

The primary flow question is gas arrival near the liquid surface: conditional Q=3 mL/min, approximately 50 s worst t90 under declared assumptions. No uptake/cell-safety claim follows. The separate liquid/PDMS study is a no-protein/no-mixing counterfactual sensitivity. Measured blank subtraction removes a stable complex mean, not unknown variable interference or shot noise. No biological or physical test results are invented.

## Reproduction

After extracting, start with each simulation README, 03_software/README_EN.md and 07_validation/Validation_Plan_EN.md. Dependencies are declared separately; rebuilding an image from saved output is not a new Monte Carlo sample or CFD solve. CAD scripts require OpenSCAD. Follow the safe-default firmware guide before hardware use. Source/data hashes inside model validation files support provenance; appendix_manifest.json fixes these four downloads. The included handoff maps the full package; links to excluded vendor originals or local page previews require that full package. Editable Word editions accompany the reading PDFs; accepted edits must be reconciled with Markdown before rebuilding.

## Publication

Keep essential methods, results, limitations and the model-to-hardware decision on the main official wiki. GitHub may mirror these supporting downloads. No repository or live wiki was updated. Confirm current iGEM hosting rules, contributor attribution and licenses before public release; this package does not grant redistribution rights to vendor PCB files. Update this appendix after new real measurements or manual changes.
