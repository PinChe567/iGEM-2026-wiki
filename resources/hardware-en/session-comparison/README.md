# Comparing concentration recovery across the two measurement sessions

This package reproduces the updated Hardware concentration and optical-comparison figures from the original measurements. It does not change any raw file, and it does not pool incompatible raw voltages or claim that leakage has been fully removed from arbitrary mixtures.

## What is in the main concentration figure

**Earlier session — open triangles.** The uniform standards are 0, 0.1, 1 and 10 µM, with three independently prepared standards per concentration. A separate free-intercept linear magnitude calibration is fitted to each channel using only those 12 standards. Five unequal-well loadings are withheld entirely from calibration. Their 13 acquisitions yield 20 well/loading means: two A layouts (10/1/0.1/0 µM in D1/D2/D3/D4) and three B layouts (0/0.1/1/10 µM). Test1 and Test5 are A; Test2, Test3 and Test4 are B. Test1 has one read; each other loading has three technical reads. Every loading receives equal weight.

Replicate provenance: the original study record, `fluorescein_2026-10-19/README.md`, section “Samples and replication”, explicitly records that the user confirmed three independently prepared standards per concentration. Its location in the preserved project record is `zenodo-release/aerosense-wiki/hardware information/AeroSense v2/07_validation/fluorescein_2026-10-19/README.md`. The later `fluorescein_2026-10-20/revision/README.md` instead identifies suffixes 1–3 as consecutive technical reads of one loading. These statements, not filenames alone, determine the replicate treatment.

The raw complex I/Q is corrected by the recorded active-blank mean before taking magnitude, exactly as in the original session analysis. The linear inverse is `(amplitude_mV - intercept_mV) / slope_mV_per_uM`. These are apparent concentrations indicated by uniform standards; no validated arbitrary-mixture unmixing is claimed. The archived earlier predictions and layout assignments are checked during reproduction.

**Later session — filled circles.** The primary uniform calibration uses 0, 1, 5, 10 and 20 µM. The same-session water mean is subtracted in complex I/Q, and each channel's isolated-well control supplies its phase direction. The same exponential family is used for all four channels, with channel-specific coefficients: `y = a + b × expm1(k c/20) / expm1(k)`. The complete uniform 1, 5 or 10 µM level is left out in turn, the curve is refitted without its three readings, and the held mean is converted to concentration. This produces 12 channel/level means from nine acquisitions. No held concentration is used in its own curve fit. The original archived holdout results are checked during reproduction.

The later curve family and exclusion of the 2.5 µM loading were selected during the earlier exploratory analysis. Consequently this is not an unbiased prospective evaluation of a locked final model. Concentration is nominal, without propagated preparation uncertainty.

The two sessions therefore appear together **after their own calibration to µM**, with distinct symbols and separate statistics. They are different validation configurations and are not pooled into one accuracy estimate. The 32 markers represent 32 channel/loading means from 22 acquisitions, not 32 independent preparations; channels within the same loading are dependent. Within-loading technical SD and all individual-read estimates are retained in the CSVs.

| Check | Well/loading means | Predictive R² | RMSE (µM) |
|---|---:|---:|---:|
| Earlier withheld unequal-well loadings | 20 | 0.880661 | 1.447280 |
| Later whole-concentration holdouts | 12 | 0.879015 | 1.280634 |

R² is `1 - sum((prediction - prepared)^2) / sum((prepared - mean(prepared))^2)` for each check separately, not squared correlation. The broad concentration range influences this metric. Residual plots retain low-level bias and imperfect mixture recovery. The later 0 and 20 µM concentrations are calibration-range anchors and are not independent holdout observations. The two 2.5 µM loadings remain in the full archive and QC sensitivity analyses; neither is relabeled as an additional validated point.

## Why a shared gain was not used to pool raw signals

The filenames mean `C = 0.1 µM`, `10C = 1 µM`, `25C = 2.5 µM`, `50C = 5 µM`, `100C = 10 µM`, and `200C = 20 µM`. Both sessions use 100 µL per well, 4 kHz sampling, 8,000 samples per acquisition, 25% duty, and 41/67/89/113 Hz frequency tags.

Each session is corrected by its own water-blank mean. A complex gain is estimated from the overlap at 10 µM, and the unused 1 µM standard is checked after alignment. The remaining complex discrepancies on the earlier-session scale are 0.878, 0.625, 0.665 and 3.066 mV for D1–D4. Thus the same 0 + 10 µM transfer does not align the unused 1 µM response. Fitting an arbitrary nonlinear warp through all three overlaps would use the check concentration to enforce agreement, rather than validate transfer. The main figure uses separate session calibrations instead. No raw values are adjusted retrospectively toward their known concentration.

## Leakage and residual correction

The isolated-source matrix supports source identification within its own technical holdouts, but does not transfer reliably to simultaneous all-well loading. Applying that matrix to uniform 10 µM gives D1–D4 = 9.09, 8.72, −2.37 and 10.51 µM. The negative D3 result is retained in the previous full analysis and website supplementary methods. The final uniform concentration curve is a calibration for that loading configuration, not proof of arbitrary-mixture leakage removal.

The previously tested extra residual adjustments remain available in `../fluorescein-revision/nested_residual_correction_summary.csv`: nested holdout RMSE is 1.281 µM without extra adjustment, 1.340 µM with constant adjustment and 19.573 µM with affine residual adjustment. The affine adjustment overfits and is not adopted. These findings are retained even though the main concentration figure now has only panels A and B.

## The second figure: simulation and measurement

Panels A and B are optical simulations, with the archived matrices unchanged: A places a 20 µm fluorescent layer at the floor with absorption coefficient 0.5 mm⁻¹; B distributes fluorescence through 100 µL with absorption coefficient 0.001 mm⁻¹ in the same geometry. Panel C is measured, not simulated: three technical reads of each isolated 10 µM well, complex blank subtraction, and signed projection using the own-well phase reference. Each row is divided by its signed sum.

The displayed percentages describe normalized response patterns, not percentages of total emitted fluorescence. Off-diagonal measured signals combine the actual optical path and electronic readout; an optical-only model cannot uniquely assign their causes. Measured off-diagonal responses are larger than modeled, so the two models have not quantitatively validated general cross-talk removal.

## Files and reproduction

- `concentration_checks.csv`: all 32 displayed loading/channel estimates, residuals, technical SD, training levels and exclusion rule.
- `individual_read_checks.csv`: all 88 well/read inverse estimates behind the displayed checks.
- `session_coefficients.csv`: each session's full calibration coefficients; holdout curves are refitted by the script.
- `overlap_transfer_check.csv`: gain estimated at 0 + 10 µM and unused 1 µM check.
- `raw_input_manifest.csv`: SHA-256 and byte count for all 58 JSON reports and 58 raw ADC CSVs.
- `reference_mixed_loading_summary.csv`, `reference_primary_holdouts.csv`: archived regression references, checked to prevent changes to prior results or sample mappings.
- `simulation_comparison_source.csv`: unchanged input matrices for the optical-comparison figure.
- `summary.json`: counts, separate metrics, raw I/Q reconstruction error and analysis limitations.
- `concentration-recovery.svg` / `.png` and `simulation-and-measurement.svg` / `.png`: publication figures and previews.
- `analyze_session_comparison.py`: the complete calculation and plotting script.

Use Python with NumPy, SciPy and Matplotlib. Place the original first-session raw files in `hardware_test/`, the second-session originals in `hardware_test2/`, and the additional 2.5 µM files in `hardware_test2/new_25C/` under one working folder. The website raw-data archive contains the same files under its dated study folders; their identities are recorded in the manifest. Keep this package together, then run:

```text
python analyze_session_comparison.py --workspace-root "path/to/working-folder"
```

The script reads the raw folders, recomputes every I/Q component from ADC counts, verifies acquisition settings, reproduces both session calculations, checks the archived reference values, and regenerates the CSVs, summary and figures in its own directory. All 58 recordings reproduce stored I/Q within 6.81 × 10⁻¹⁰ V. Raw files are never written.
