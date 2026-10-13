# AeroSense P2: reproducible kinetic fluorescence pilot

This package contains the 32 unmodified instrument CSV exports for plate P2 (runs 904–935), their original filename map, four supplied analysis CSVs and the supplied analysis report, a fresh independent calculation, and the figures used on the wiki. The source report is preserved as a historical input; its interpretation is not adopted without qualification. No original file is overwritten.

## Reproduce the numerical analysis

Requires Python 3.10 or newer, standard library only. From the extracted folder:

```text
python analyze_plate_p2.py --input raw --reported reported --output derived-rerun
```

Expected: 32 raw files, 96 wells, 3,840 RFU observations, 420 comparisons to supplied numeric entries and zero differences beyond the source's four-decimal rounding. Each well has 5 F0a readings, 15 buffer-response readings, 5 F0b readings and 15 test-response readings. The first/last run-start timestamps are in the summary JSON. Times are recorded as local instrument times with no encoded timezone.

To regenerate figures, install matplotlib and numpy, then run:

```text
python plot_plate_p2.py --data derived-rerun --output figures-rerun
```

The published plots were generated with Python 3.11.9, matplotlib 3.11.1 and numpy 2.4.6. Numeric analysis was also run with the bundled Python runtime. SVGs keep editable text. PNGs are rendered at 180 dpi. Figures show observations and calculated summaries without imputation, fitted curves, gain rescaling, uncertainty intervals or response calls.

## Experimental unit and provenance

The team confirmed on 11 October 2026 that P2 was measured approximately 72 h after HEK293 transfection, before any G418 selection, and is the only available plate for this experiment. The supplied row/column map and 96 unique well identifiers establish one well per cell condition × stimulus; this count is derived from the plate layout. Fifteen response readings of one well are not 15 replicates. No independent biological-replicate variance can be estimated. These cells are not demonstrated stable clonal lines and are not automatically linked to the earlier 44–48 h fixed-cell microscopy batch.

VUAA1 is listed at a nominal final 50 µM in the supplied report; preparation records do not independently confirm it. The team confirmed DMSO as its solvent but not the final DMSO fraction. VOCs were prepared initially in water and diluted into assay buffer; their final concentrations are unknown. A matching DMSO-only vehicle condition is not documented. Confirmed assay buffer and the distinction between source-reported settings and CSV-verified metadata are in `experiment-metadata.json`. The standalone `plate-p2-methods.html` is the executed-method record, not the separate unrun 384-well specification.

## Calculations

F0a and F0b are the means of their five readings. Each response summary is the largest of the thirteen contiguous three-reading means in its 15-point series. This maximum is a descriptive peak estimator, not an unbiased effect estimate. Its timestamp is the center of the earliest maximum window. The test and first-buffer excursions are `(peak3 − paired F0) / paired F0`. The corrected metric is `test excursion − buffer excursion`; these terms have different baselines and well volumes. The result is dimensionless and is not a calibrated calcium concentration. Multiplication by 100 expresses the corrected difference in percentage points.

Source-reported gain mismatch excludes both pairs in row B and the first pair in row C. All 96 wells remain in the data, including unmasked arithmetic for audit; only 72 corrected metrics are retained for exploratory plotting. Numeric gain is absent from the exports. Coherent intensity changes support concern about B/C but do not identify the actual gain or prove the remaining runs are gain-matched. RFU amplitudes across rows are not comparable without calibration. No gain correction is guessed from the untransfected wells. No common background subtraction is applied because a cell-free, gain-matched background record is unavailable.

Time zero is the first reading of a run, not a measured injection time. The addition-to-read delay is unknown. A rapid biological onset and an optical/vehicle effect cannot be separated simply by calling the first point an instantaneous step. Curves from row H are different wells from row A; they are not repeat exposures of the same cells.

## What changed from the supplied interpretation

- A11 (ORCO only, nominal VUAA1) has a +0.11860 test excursion, a −0.09624 earlier buffer excursion, and a +0.21484 corrected metric. Thus the corrected value is not a 21.48% increase during the test. Its first-to-last test reading rises 10.87% (2,227 to 2,469 RFU).
- A12 (untransfected, nominal VUAA1) has a corrected metric of +0.00407. H11 is a separate ORCO-only buffer well, with −0.01672. These are useful comparator observations but do not supply replicate variance or a matched DMSO control.
- H10 (Or35a+ORCO, buffer only) itself rises, with a +0.35253 test excursion and +0.44865 corrected metric. H03 (Or42a+ORCO, buffer only) has only a +0.01424 test excursion, but subtraction of a −0.30080 first-buffer excursion produces +0.31504. This exposes both nonspecific changes and the influence of the correction.
- The six retained untransfected corrected values reproduce SD 0.04483 and 3 SD 0.13448. These heterogeneous single wells are not a blank calibration or a validated detection limit. The wiki does not call results positive/negative using that threshold or label A10 a weak positive.
- The supplied VUAA1-normalized matrix uses a negative Or7a denominator (−0.05490), reversing signs. Single small or unvalidated VUAA1 denominators do not support a calibrated response scale. That normalization is preserved only in the supplied source CSV; new plots omit it.
- The supplied QC field `median_col12_F0a` equals the first reading in all eight rows and differs from the actual median in six rows. Its ratio algorithm is not specified. `plate-p2-run-qc.csv` independently reports first/mean/median readings and explicit median-across-wells ratios of run means; these are descriptive diagnostics, not inferred instrument gain.
- Fluorescence does not demonstrate membrane localization, Ca2+ influx specificity, stable expression, or ligand-specific receptor activation. A rising trace is not a mechanism test; the buffer-only H10 trace also rises. Detachment was reported but not measured here, so it cannot be assigned as the proven cause.

## File dictionary

- `raw/`: exact 32 instrument exports and original filename map; SHA-256 in the derived checksum table.
- `reported/`: unmodified source analysis CSVs and original report; historical input, not independent validation.
- `derived/plate-p2-timeseries.csv`: one fluorescence observation per row, with well, stage, run, within-run time, condition, source file, paired-baseline ratio and inclusion flag.
- `derived/plate-p2-well-summary.csv`: 96 well summaries; `*_computed` retains unmasked arithmetic, whereas `*_retained` is empty for excluded pairs/metrics. Empty means excluded, never zero. Biological-repeat count is not fabricated.
- `derived/plate-p2-run-qc.csv`: transparent intensity diagnostics and metadata limits.
- `derived/plate-p2-source-number-audit.csv`: all 420 numerical comparisons.
- `derived/plate-p2-source-qc-audit.csv`: original QC labels alongside reproducible values.
- `derived/plate-p2-analysis-summary.json`: counts, ranges, audit results and key wells.
- `figures/`: vector SVG and PNG versions of five data figures, including raw control kinetics and the complete 12-condition VUAA1/buffer test-excursion comparison. Mobile layouts are provided for the principal time-course, condition-comparison and correction-component figures. The all-condition comparison shows 24 individual well summaries without connecting separate wells, imposing a response threshold or estimating uncertainty.
- `experiment-metadata.json`: data source and confirmation status for experimental settings.
- `plate-p2-methods.html`: portable English executed-method record.

No significance test, confidence interval, smoothing beyond the stated summary estimator, biological-replicate claim or trained classifier is included. The data establish an auditable kinetic pilot and guide the next controlled experiment.
