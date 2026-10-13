AeroSense microscopy control comparison | rerun 2026-10-13

Run python compare_controls.py in this folder or from any working directory.
Python 3; numpy, scipy, matplotlib. Exact run versions and SHA-256 input hashes
are in control-comparison-summary.json. All six input files are included.
No original image, primary score, segmentation or threshold is overwritten.
The primary CSVs were regenerated after the team's 2026-10-13 condition/field
reassignment. Image bytes are unchanged; condition-pooled counts and comparisons
have been recomputed. See source-revision-2026-10-13.json in the main package.

control-comparison.csv: one-sided Fisher exact test (greater) versus the blank,
Holm adjustment over 11 nonblank comparisons SEPARATELY within each channel;
absolute difference in percentage points; nominal 95% Wilson intervals.
These calculations ASSUME independent objects. Objects share fields/cultures,
there is one experiment, and the primary blank fitted the positivity cutoff.
The resulting p values are exploratory, conditional numerical summaries only.
They are not valid culture-level significance, transfection efficiency,
specificity, or biological-repeat uncertainty. Holm does not fix these issues.
Wilson limits do not include clustering, segmentation or threshold uncertainty.

blank-field-holdout.csv: post-hoc leave-one-blank-field-out audit. Each held field
is evaluated with the maximum of the two OTHER fields' 99th score percentiles.
All three splits are reported without selecting a favorable split. These are
same-batch technical fields and do not establish independent specificity.
The original published P99 cutoff and condition calls remain unchanged.

area-object-comparison.csv and correlations: compare median fluorescence-area
diagnostics with pooled object fractions. Different denominators and estimands
mean that this is a diagnostic comparison, not interchangeability validation.
area-object-agreement.png/.svg are plots of those exact CSV values.

or98a-export-diagnostics.csv separates broad elevated background from clipping:
high area above a blank threshold does not mean camera/export saturation.
Original camera dynamic range remains unknown for these 8-bit exports.

The microscopy primary scripts and original TIFF links are available in the
wiki Results data-availability section. This package reproduces the added
statistical audit from published CSVs; it does not rerun image segmentation.
