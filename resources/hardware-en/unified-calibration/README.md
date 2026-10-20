# Unified concentration display and calibration-family audit

This package puts the available concentration checks in one figure, with one symbol per channel color and no acquisition-date categories. It preserves the origin, calibration and validation design of every observation in CSV. It does **not** merge raw voltages as if the optical configurations were identical.

## What was corrected

The previous figure had not aligned all three shared levels. It used a separate linear magnitude calibration for one acquisition set and an exponential signed-response calibration for the other. Its separate transfer diagnostic used water plus 10 µM, then checked the unused 1 µM level. The present analysis explicitly audits the three shared levels, curve families and common-shape transfer alternatives.

`DDW = 0 µM`, `C = 0.1 µM`, `10C = 1 µM`, `25C = 2.5 µM`, `50C = 5 µM`, `100C = 10 µM`, and `200C = 20 µM`. Every well contains 100 µL. Acquisition settings are 4 kHz sampling, 8,000 samples and frequency tags 41/67/89/113 Hz.

All 58 report/raw pairs are retained and their 116 file hashes recorded. The ADC reconstructions reproduce the exported I/Q within 6.81 × 10⁻¹⁰ V. Raw inputs are never changed.

## Signal processing

For both calibration sets use the same signed-signal definition:

1. Form `z = 1000 × (I_V + i Q_V)` in mV.
2. Subtract the mean of the **same acquisition set's DDW controls**, not the older blank saved inside the acquisition interface.
3. Project onto the calibration phase direction: `y = Re((z − blank) × conjugate(phase))`.

Set A has no isolated-source controls; its highest available **training** uniform standard defines the phase direction. Set B uses its separate isolated-source controls, independently of the uniform concentration being held out. In every transfer/common-shape fold, a held concentration is excluded from set A's phase reference as well as curve fitting. DDW remains the baseline anchor throughout; it is not advertised as a withheld validation sample.

This updates set A from the older saved-blank/magnitude processing. Signed negative values are retained instead of folded positive by an absolute value. Projection removes the measured blank and defines a demodulation direction; it does not prove that arbitrary mixtures have been unmixed.

## Why the three shared levels do not identify one reliable transfer curve

After blank subtraction, the 1 µM response as a fraction of the 10 µM response is:

| Channel | Calibration set A | Calibration set B |
|---|---:|---:|
| D1 | 3.77% | 10.04% |
| D2 | 6.14% | 9.35% |
| D3 | 7.38% | 4.24% |
| D4 | 0.86% | 16.18% |

A constant channel gain cannot remove those differences. In set A, D4's 0.1 µM mean also exceeds its 1 µM mean. The data do not identify whether that discrepancy arises from preparation, background drift, positioning or another factor.

`three_anchor_transfer_candidates.csv` fits affine, quadratic, exponential, power and PCHIP mappings to the three shared **measured signal means**. Several flexible mappings pass exactly through them. That is calibration-point interpolation, not validation. The direct quadratic mappings for D1 and D4 reverse direction within the interval; they are unsuitable concentration conversions. With one shared nonblank level held out, only two shared points remain: a three-parameter nonlinear transfer is not identifiable, and PCHIP reduces to a straight line. The affine held-1 µM check is interpolation; held-10 µM is a separate endpoint extrapolation challenge. These are distinguished in `transfer_holdouts.csv`, including the phase reference actually used in each fold.

A stronger alternative jointly fits all standard levels with one curve shape and a separate offset/gain for each set. Every tested concentration is then omitted from **both** sets and all transfer/phase estimation before prediction. The 20 genuinely interpolated channel/concentration predictions are compared separately from four set-A 10 µM endpoint extrapolations:

| Shared-shape candidate | Finite / in-range predictions | Interpolation RMSE (µM) | Decision |
|---|---:|---:|---|
| Linear | 20 / 20 | 2.379 | Valid but larger error |
| Quadratic | 16 / 16 | 1.731 on finite values only | Missing inverses and non-monotone fits |
| Exponential | 20 / 19 | 1.036 | One negative inverse; not all in range |
| Power | 16 / 16 | 1.388 on finite values only | Four missing inverses |

RMSEs computed on different numbers of finite observations are not treated as a fair ranking. The near-equal 1.036 vs 1.043 µM scores are not evidence of a statistically significant difference. The retained method below gives an inverse within its calibration interval for all 20 standard holdouts. No three-point nonlinear warp is adopted or claimed to have aligned the raw signals.

## Choosing the concentration function

Every candidate is fitted to equal-weight standard-level means, not three technical reads counted as three separate levels. The same five candidate families are compared for D1–D4. A family is eligible only if every full fit and fold fit is increasing on the calibrated interval and every held standard has a unique finite inverse within that interval.

- Set A standards: 0, 0.1, 1 and 10 µM. The 0.1 and 1 µM levels are withheld in turn, yielding eight channel/level predictions. The highest calibration endpoint stays in the training set, so these are interpolation checks.
- Set B primary standards: 0, 1, 5, 10 and 20 µM. The 1, 5 and 10 µM levels are withheld in turn, yielding 12 channel/level predictions.

| Family | Set A holdout RMSE (µM) | Set B holdout RMSE (µM) | Eligibility |
|---|---:|---:|---|
| Linear | 0.508 | 3.043 | Both valid |
| Quadratic | 0.707 | 1.774 | Non-monotone full/fold fits |
| Exponential | 0.834 | 1.281 | Both valid |
| Power | 0.714 | 1.363 | Both valid |
| PCHIP | 0.728 | 1.674 | Set A is non-monotone |

Thus set A uses linear and set B uses exponential calibration, selected from the standard holdouts without using unequal-well test concentrations to optimize a transfer or curve. This is selection among empirical calibration functions; it is not a claim that fluorescence follows one universal physical polynomial order.

All coefficients are in `model_coefficients.csv`. With `u = c / scale`:

- Linear: `y = a + b u`, inverse `c = scale × (y − a) / b` (set A scale 10 µM).
- Exponential: `y = a + b × expm1(k u) / expm1(k)`, inverse `c = scale / k × log1p((y − a) × expm1(k) / b)` (set B scale 20 µM).
- Quadratic: `y = a + b u + d u²`.
- Power: `y = a + b u^p`, positive b and p.
- PCHIP: interpolation through the standard-level mean knots, accepted only where the entire calibration curve is increasing.

The selected standard-holdout RMSE is 1.043 µM across 20 channel/level means. **This is exploratory model selection on the same folds, not a nested or prospective unbiased performance estimate.** Set A's low-concentration evaluation contains only two held concentration levels and remains weak even though its absolute RMSE is the smallest among the tested candidates. Broad-range R² must not be substituted for this low-level evidence.

## The integrated result figure

`concentration-recovery-violin.svg` / `.png` contains 32 channel/loading means from 22 acquisitions, in a single visual series per channel:

- 20 means from five unequal-well loadings entirely excluded from set A calibration. Test1 and Test5 contain [10, 1, 0.1, 0] µM in D1–D4; Test2–Test4 contain [0, 0.1, 1, 10] µM. Test1 has one acquisition, the others three technical readings. The three uniform standards per concentration were recorded in the study's original replication documentation as independently prepared; the mixed-load technical readings do not gain that status.
- 12 set-B whole-concentration holdouts from nine acquisitions. All reads at the held uniform concentration are omitted from its curve.

Panel A compares predicted with prepared concentration. Panel B groups the residual `prediction − prepared` by the same prepared concentrations and shows a violin, all original colored points, and the group mean. Concentrations 0, 0.1, 1, 5 and 10 µM are equally spaced categorical positions only in panel B, so the 0 and 0.1 µM groups remain distinct. Every vertical observation is unchanged. No points are jittered toward their target or removed to improve agreement. Two set-A estimates are negative (−0.0326 and −0.0133 µM): they are retained as signed diagnostic results and are **not reportable concentrations**. The other 30/32 displayed means are within their calibrated ranges.

The combined descriptive `R² = 1 − SSE/SST = 0.886`, RMSE 1.415 µM, maximum absolute error 3.468 µM. These describe the displayed, heterogeneous checks; they are not a single independently validated accuracy specification. Channels in one loading are dependent, repeated reads are technical repeats, and the acquisition sets involve different loading configurations. R² is not squared correlation and is strongly affected by the concentration span. Neither family selection nor the earlier QC decision was blinded to this already explored dataset.

Separate provenance metrics remain available: set-A unequal-well checks R² 0.874, RMSE 1.490 µM; set-B concentration holdouts R² 0.879, RMSE 1.281 µM. Shared units allow a common presentation without claiming that raw signals or validation designs became identical.

## The 2.5 µM recordings and endpoints

The original 2.5 µM D3 readings are unstable (about 30% technical amplitude CV). The additional 2.5 µM recordings are stable but precede the matching water baseline and yield negative blank-subtracted signals in D3/D4. All six original/additional recordings remain in the raw manifest and `qc_sensitivity.csv`; all-original and replacement sensitivity fits are also retained for every candidate family. These exploratory exclusions cannot establish a general detection limit.

Set-B 0 and 20 µM anchors participate in calibration; they are not plotted as new independent holdout results. Merely putting them on the identity line would not add validation. All individual inverse predictions, including out-of-range or unavailable values, remain in CSV.

## Reproduction and output files

Run with Python, NumPy, SciPy and Matplotlib:

```text
python analyze_unified_calibration.py --workspace-root "path/to/wiki"
```

The input folders are `hardware_test/`, `hardware_test2/` and `hardware_test2/new_25C/`. The same original records are in the website raw-data archive. `--skip-raw-reconstruction` is an optional development shortcut, clearly marked in the summary; the final reproducible run did not use it.

- `analyze_unified_calibration.py`: complete calculations, validation splits and plotting.
- `raw_input_manifest.csv`: hashes and paths for all 116 raw/report files.
- `calibration_training.csv`, `model_coefficients.csv`: signed standard means, blank/phase references and all family coefficients.
- `model_holdouts.csv`, `model_comparison.csv`: every standard-level prediction and selection diagnostics.
- `overlap_anchors.csv`, `three_anchor_transfer_candidates.csv`, `transfer_holdouts.csv`: actual shared means and explicit transfer audit.
- `joint_shape_coefficients.csv`, `joint_shape_holdouts.csv`, `joint_shape_comparison.csv`: shared-shape alternative with interpolation and endpoint extrapolation separated.
- `concentration_checks.csv`, `individual_read_checks.csv`: all 32 plotted means and 88 underlying well/read inverses.
- `qc_sensitivity.csv`: both 2.5 µM recordings and full-data alternative fits, including failures.
- `summary.json`: selected methods, counts, metrics and limitations.
- `calibration-model-selection.svg` / `.png`: curve selection comparison.
- `concentration-recovery-violin.svg` / `.png`: current concentration panel and residual violins grouped by prepared concentration.
- `concentration-recovery.svg` / `.png`: retained previous scatter-only presentation of the same data.
- `residual_means_by_prepared_concentration.csv`: group sizes and residual summary values for the current violin panel.
- `integration-copy.json`: suggested bilingual site copy; it does not alter raw data or calculation.

An independent read-only review checked whole-concentration exclusions, combined metrics, raw-file manifest and signed out-of-range estimates. Its phase-reference holdout finding was corrected in the transfer audit before the final reproducible run.


## Reproduce from the retained research archive

The current program can read all 116 original files directly from the canonical
Zenodo preparation tree, without recreating the former workspace folders:

```text
python analyze_unified_calibration.py --archive-root PATH_TO_zenodo-release --output-dir PATH_TO_NEW_OUTPUT_DIRECTORY
```

`--archive-root` selects the two raw directories under
`aerosense-wiki/hardware information/AeroSense v2/07_validation/`, including
`fluorescein_2026-10-20/raw/new_25C`. `--workspace-root` remains available for
the original `hardware_test` / `hardware_test2` layout. Use `--output-dir` to
keep retained outputs unchanged. The archive form writes canonical paths into
its new raw-input manifest; the underlying 116 hashes and numerical results
are compared independently of those path aliases. These options change input
and output locations only, not the calibration or validation calculations.

The review environment is Python 3.11 with NumPy 2.4.6, SciPy 1.17.1 and
Matplotlib 3.11.1. This workflow covers 58 acquisitions across both sets;
it is distinct from the earlier 33-acquisition shared-family revision.


## Residual violin presentation

The current figure is `concentration-recovery-violin.svg/png`. Panel A preserves the per-channel curve-calibrated scatter and its descriptive R² 0.8861819979 / RMSE 1.4148308464 µM; it is not the separate measured-matrix diagnostic. Its annotation does not include a sample-count sentence.

Panel B uses equally spaced categories of **prepared concentration**, rather than grouping by channel or acquisition set. The 32 original channel/loading means remain visible with their channel colors. A dark horizontal line and a numeric label indicate each arithmetic mean residual:

| Prepared concentration (µM) | Means shown | Mean residual (µM) |
|---|---:|---:|
| 0 | 5 | +0.990423123 |
| 0.1 | 5 | +0.232148086 |
| 1 | 9 | +1.182969043 |
| 5 | 4 | −1.117742479 |
| 10 | 9 | −0.784460673 |

The violin is a smoothed description of these few observations; its width does not imply independent sample counts or a population distribution. Horizontal point offsets only prevent overlap; vertical residual values are unchanged. The group counts sum to 32. `residual_means_by_prepared_concentration.csv` records exact means, medians, standard deviations and extrema. The plotting function in `analyze_unified_calibration.py` reproduces this figure and summary directly from the existing estimates; no calibration value is changed by the presentation update.
