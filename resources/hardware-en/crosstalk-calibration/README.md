# Measured cross-talk matrix: correction and transfer diagnostics

This package actually applies the measured four-well mixing matrix before interpreting the results. The resulting estimates expose a failure of transfer to simultaneous loading. They are **10 µM-reference-equivalent diagnostic estimates, not validated final concentrations**. No negative result is removed or replaced by a known target concentration.

## Experimental conditions and provenance

The user confirmed during this revision that each isolated-source control contains 100 µL of 10 µM fluorescein in the selected source well and 100 µL DDW in each of the other three wells. Uniform controls contain 100 µL fluorescein solution per well. Therefore the discrepancy cannot be explained by comparing empty versus filled neighboring wells. The supplied records do not isolate its physical cause.

The 58 original acquisitions are read without modification from `hardware_test/`, `hardware_test2/`, and `hardware_test2/new_25C/`. All 116 report/raw files are listed with SHA-256 hashes. Reconstructed I/Q agrees with the stored exports within 6.81 × 10⁻¹⁰ V. Acquisition settings are 4 kHz, 8,000 samples and 41/67/89/113 Hz tags.

Nominal labels: DDW = 0 µM, C = 0.1 µM, 10C = 1 µM, 25C = 2.5 µM, 50C = 5 µM, 100C = 10 µM and 200C = 20 µM.

## Frozen correction pipeline

1. Retain `z = 1000 × (I_V + i Q_V)` in mV, and subtract the mean DDW of the same calibration set.
2. For each isolated 10 µM source, divide its mean net complex response by 10. The four columns form a 4 × 4 complex matrix in mV/µM. Stack the four real rows and four imaginary rows into the real 8 × 4 matrix M. Its condition number is 10.613.
3. Solve the signed ridge system

   `c_hat = (MᵀM + λ σ_max² I)^−1 Mᵀ y`,

   where y contains the four I and four Q readings, and σ_max is M's largest singular value. λ = 0.0001 is chosen **only among signed linear solvers**, using the technical-control procedure below.
4. Preserve every signed coordinate. The four output coordinates represent source-well components, not the four input readout-channel measurements. In the CSVs the legacy `channel` field D1–D4 denotes the output source component for `concentration_checks`, `individual_read_checks` and `channel_residual_means`; `measured_complex_matrix` distinguishes readout rows from source columns explicitly.
5. Check whether a subsequent increasing concentration curve can be justified. None of the tested post-matrix families qualifies for all four components, so no such curve is applied to the supplementary matrix diagnostic figure.

This is actual measured-matrix subtraction/inversion, not merely blank subtraction or four separate response curves.

## Solver selection uses only technical controls

Fifteen acquisition-level folds hold out one of the 12 isolated-source or three DDW recordings. The blank and source matrix are recomputed from the remaining controls in every fold. Held isolated controls have the corresponding source component 10 µM and other components zero; held DDW has four zeros. Each fold yields four component errors, totaling 60 dependent component predictions.

| Solver | Technical-control RMSE (µM) |
|---|---:|
| Unregularized least squares | 0.331 |
| Selected signed ridge, λ = 0.0001 | 0.328 |
| Nonnegative least squares | 0.212 |

The ridge search grid is 0, 10⁻⁶, 10⁻⁵, 10⁻⁴, 10⁻³, 10⁻², 0.1 and 1. No uniform or unequal-loading target is used to tune this penalty. Ridge is not claimed to outperform nonnegative least squares overall: it is retained among signed solvers so that negative estimates remain visible as model diagnostics. Nonnegative least squares is a separate constrained optimization, **not simple post-hoc clipping**. Its complete alternative predictions are retained.

These are technical holdouts of already measured preparations, not independent preparation or prospective assay validation. The chosen penalty's score is exploratory on the same folds used for selection.

## The additivity check

At 10 µM, every fixed additive source model must predict the all-well response as the sum of the four isolated-source net vectors. Changing a scalar curve after that fixed matrix does not remove this requirement at its own calibration point.

| Readout | Sum of isolated 10 µM controls (mV) | Measured uniform 10 µM (mV) | Measured / additive prediction |
|---|---:|---:|---:|
| D1 | 17.567 | 12.015 | 68.4% |
| D2 | 30.514 | 21.172 | 69.4% |
| D3 | 87.151 | 42.060 | 48.3% |
| D4 | 20.787 | 13.630 | 65.6% |

For display only, those complex values are projected onto each channel's own-source phase. The actual inversion uses the full eight I/Q components. The large mismatch means the single-source matrix does not transfer reliably to the all-well configuration. It does not establish which physical mechanism causes the difference.

At uniform 10 µM, signed ridge estimates are approximately [9.016, 8.715, −2.294, 10.464] µM. These negative/biased outputs are retained. Nonnegative least squares makes the D3 component zero; that boundary result does not demonstrate that the prepared D3 source is absent.

For the 12 source-component means at uniform 1, 5 and 10 µM:

| Solver | RMSE (µM) | Descriptive R² |
|---|---:|---:|
| Unregularized | 4.164 | −0.279 |
| Selected signed ridge | 4.146 | −0.268 |
| Nonnegative least squares | 3.659 | 0.012 |

Uniform 10 µM is withheld as a **loading configuration** from matrix training, while isolated-source 10 µM controls remain. It is incorrect to call this removal of every 10 µM record.

## Post-matrix curve audit

The unmixing outputs for uniform 0, 1, 5, 10 and 20 µM are tested with linear, quadratic, exponential, power and PCHIP families. All reads at uniform 1, 5 or 10 µM are held out from each scalar curve fit in turn. The matrix remains fixed from independent isolated-source/blank controls. Validity requires an increasing full/fold curve and unique finite inverses within 0–20 µM for all four components.

None qualifies. In particular, the inferred D3 component declines over part of the series. A decreasing linear curve could reverse it mathematically, but would not validate the intended source-contribution interpretation. Constrained increasing exponential/power fits instead fail inverses or produce out-of-range estimates. All failures are retained, including the extreme numerical extrapolation of the invalid power fit; RMSEs calculated from unequal finite subsets are not used to rank those invalid candidates.

This conclusion applies to the tested **scalar curves after a fixed measured matrix inversion**. It does not rule out other nonlinear forward models, such as a detector nonlinearity acting before matrix inversion. The current data have not validated such alternatives.

## How the 32 means are combined

The supplementary matrix scatter/violin figures use one color and one symbol for each output well, without earlier/later labels. Provenance is retained in every CSV row.

- Calibration set A supplies five unequal-well loadings (20 means, 13 acquisitions). Test1 and Test5 have [10, 1, 0.1, 0] µM in D1–D4; Test2–Test4 have [0, 0.1, 1, 10] µM. Test1 has one reading; each other loading has three technical readings. These mixed targets never enter transfer or matrix fitting.
- Calibration set B supplies uniform 1, 5 and 10 µM (12 means, nine acquisitions), all omitted from the isolated-source matrix training.

Set A has no independently measured four-source matrix. Its uniform source direction and two distinct unequal concentration patterns span only three source-design directions. The exact unresolved direction is [0.09, −1, 1, −0.09], so those data cannot identify an unrestricted four-source matrix. Technical repeats do not increase that rank.

To include its 20 means transparently, subtract its own DDW and fit a per-readout complex affine mapping to set B using the three shared standard means only:

`z_B,net ≈ offset + gain × z_A,net`, at DDW, 10C and 100C.

Then apply the independently measured set-B matrix to the mapped vector. All three shared levels are used in this least-squares mapping; they are not forced to agree exactly and their residuals remain in `transfer_anchor_residuals.csv`. This is calibration, not independent validation of transfer. Applying set B's matrix assumes that the four-source mixing shape is unchanged across sets after that affine mapping. That assumption remains unverified. No unequal-loading truth is used to tune the map.

## Supplementary matrix figure interpretation

Panel A is the matrix-derived 10 µM-equivalent estimate versus prepared concentration. It intentionally retains all 32 means, including 10 negative outputs. Descriptive `R² = 1 − SSE/SST = −0.276`, RMSE = 4.738 µM. Negative R² means these diagnostic estimates do worse than the displayed observations' mean-concentration reference under that summary; it is not proof of a negative physical concentration.

Panel B is a violin per source well with all eight residual means overlaid. Residual is `estimate − prepared concentration`, and the numeric average is:

| Source well | Mean residual (µM) |
|---|---:|
| D1 | +0.029 |
| D2 | −0.840 |
| D3 | −4.409 |
| D4 | −0.016 |

The violin is a smoothed descriptive density of only eight means per well; it is not an inferred population distribution. A near-zero average does not remove the large spread. All vertical point coordinates are actual values; small horizontal offsets prevent overlap and do not encode acquisition set.

There are 32 well/loading means, 22 acquisitions and 88 underlying well/read estimates—not 32 independent preparations. Channels/wells within a loading are dependent. The additional transfer assumption for set A and the different validation configurations prevent interpreting the combined score as a single validated accuracy specification.

The previous curve-only benchmark has descriptive R² 0.886 and RMSE 1.415 µM for the corresponding displayed checks. That pipeline did **not** perform this matrix correction and used calibration curves from the uniform standards. Its apparently better score must not be described as successful cross-talk subtraction. This package records that benchmark as context only.

## Retained data and reproduction

The 2.5 µM original loading and 20 µM endpoint are retained in `uniform_solver_comparison.csv`. The additional 2.5 µM input precedes its matching blank and remains preserved in the raw manifest and the earlier QC sensitivity archive; it is not silently added as another independent validated point. No raw acquisition is removed or edited.

Run with Python, NumPy, SciPy and Matplotlib:

```text
python analyze_crosstalk_calibration.py --workspace-root "path/to/wiki"
```

Keep `calibration_core.py` beside the script. It contains the raw reconstruction and scalar candidate helpers copied into this package for standalone reproduction. An optional existing sibling `unified-calibration/concentration_checks.csv` supplies the curve-only benchmark; its absence does not affect the matrix estimates or diagnostic plots.

Files include:

- `measured_complex_matrix.csv`: real/imaginary source columns and channel rows.
- `single_source_cv.csv`, `solver_comparison.csv`: every control holdout and all regularization strengths.
- `transfer_coefficients.csv`, `transfer_anchor_residuals.csv`: three-level calibration mapping and its residuals.
- `concentration_checks.csv`, `individual_read_checks.csv`: 32 means and 88 well/read values.
- `uniform_solver_comparison.csv`, `uniform_test_summary.csv`: unregularized, signed-ridge and nonnegative alternatives, including negative and boundary values.
- `postmatrix_family_holdouts.csv`, `postmatrix_family_comparison.csv`: all post-matrix curve failures.
- `additivity_check.csv`: measured versus summed isolated-control responses.
- `channel_residual_means.csv`: eight output-well residuals summarized per well.
- `raw_input_manifest.csv`, `summary.json`: provenance, counts, assumptions and metrics.
- `crosstalk-method-check.svg/png`, `crosstalk-concentration-check.svg/png`: final figures.
- `integration-copy.json`: bilingual captions and integration text.

An independent read-only review reconstructed all 32 predictions from raw reports (maximum difference 2.5 × 10⁻¹⁴ µM), verified all 116 input hashes, and checked that mixed truths were absent from transfer/solver selection. The final reproducible run was performed in the local editing workspace only.


## Simplified main-page additivity figure

The main-page illustration is `single-well-additivity.svg/png`, titled **Predicted and measured four-well signals**, reproduced by:

```text
python plot_additivity_comparison.py
```

It reads the existing `additivity_check.csv` without recomputing or modifying the analysis. For each readout channel, the sum of the four separate, blank-corrected single-well 10 µM controls is defined as **100%** (the dashed reference line). The four bars show the corresponding all-four-wells-together measurement:

`relative signal (%) = 100 × uniform10_measured_mV / sum_isolated10_mV`.

D1–D4 are 68.3974564%, 69.3835655%, 48.2609194% and 65.5693576%, displayed as **68.4%, 69.4%, 48.3% and 65.6%**. If the separate signals added directly, these bars would reach the 100% line. They do not, so an unchanged additive matrix cannot be assumed to describe the simultaneous measurement. These percentages compare **readout signals**, not concentration recovery, detection efficiency or assay accuracy. Each percentage uses its own channel's summed controls as denominator.

The values retain the existing same-channel phase projection recorded in the CSV. `single-well-additivity-metadata.json` records exact values, the formula, source hash and experimental conditions. The four isolated controls each have one 100 µL 10 µM fluorescein well and three 100 µL DDW wells; the simultaneous measurement has four 100 µL 10 µM fluorescein wells.

The older solver comparison (`crosstalk-method-check`) and matrix-derived scatter/violin (`crosstalk-concentration-check`) remain unchanged for supplementary inspection. The separate main-page concentration figure has been restored to the per-channel curve-calibrated result in `../unified-calibration/concentration-recovery-violin.svg`; it must not be described as validated matrix-corrected concentration. This display change alters neither the underlying measurements nor the matrix diagnostic conclusions.
