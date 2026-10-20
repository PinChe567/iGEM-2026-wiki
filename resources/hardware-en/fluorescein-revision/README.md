# Shared-family calibration revision

The main quantitative result is a common exponential calibration family for
the four readout channels in the **uniform-loading configuration**. Leaving one
whole internal concentration out gives 12/12 unique in-range estimates, with
pooled RMSE 1.281 µM. At actual 10 µM the estimates are 11.594, 10.927, 11.235
and 10.994 µM for D1–D4. These are concentration-level checks, not fitted-point
agreement or a new blinded experimental batch.

The isolated-source experiment separately demonstrates source discrimination:
the earlier analysis identified the filled well in 12/12 technical holdouts.
Its one-concentration matrix does **not** transfer reliably to all-well loading.
The two operating configurations therefore remain distinct.

## Inputs and repeat structure

- Original raw data: `../raw/`, 30 paired JSON/CSV acquisitions.
- Additional 2.5 µM loading: `../raw/new_25C/`, three paired JSON/CSV acquisitions.
- Each named loading is independently prepared; suffixes 1–3 are consecutive
  technical readings of that one loading. Three reads do not constitute three
  independently prepared samples.
- Each well contains 100 µL. Original nominal levels are 0, 1, 2.5, 5, 10 and
  20 µM. The primary QC sensitivity analysis uses 0, 1, 5, 10 and 20 µM.
- The additional loading was acquired **earlier**, despite being supplied later:
  device records 4–6, compared with 38–40 for the original 2.5 µM loading.

No raw values are modified or discarded. The original full dataset and the
additional-loading substitution are retained in the model comparison.

## Processing before the calibration fit

For each channel, retain the complex I/Q measurement in mV:

`z = 1000 × (I_V + i Q_V)`.

Subtract the mean of the current-session water readings:

`z_net = z − mean(z_water)`.

Let `s_j` be the complex net signal measured in readout channel j when only
source j contains 10 µM. Set the channel phase to `p_j = s_j / |s_j|` and use

`y_j = Re(z_net,j × conjugate(p_j))`.

This phase is determined from the isolated-source readings, independently of
the uniform-standard concentration labels. Signed signals are retained.
The fresh-session blank replaces the older blank embedded in the UI exports.

This operation removes the measured blank and establishes a consistent
demodulation direction. It **does not remove arbitrary inter-well mixing**.
That requested extra operation was explicitly tested and is reported below.
Technical averaging reduces read noise; the supplied records cannot identify
all time-varying optical-background changes.

## One curve family for D1–D4

All four channels use:

`y(c) = a + b × expm1(k c / 20) / expm1(k)`.

The concentration inverse is:

`c = (20 / k) × log1p((y − a) × expm1(k) / b)`.

The linear limit applies as k approaches zero. Channel-specific a, b and k are
in `calibration_coefficients.csv`, together with blank I/Q and phase. A reading
is reportable only if it has exactly one inverse in 0–20 µM. Values below the
fitted range are not silently assigned zero; out-of-range readings are flagged.
The fitted blank for D2/D4 lies above the observed mean blank, so those blank
training inverses are correctly missing rather than forced to zero.

| Channel | a (mV) | b (mV) | k |
|---|---:|---:|---:|
| D1 | −0.002626 | 62.627272 | 2.968472 |
| D2 | 0.073352 | 87.517083 | 2.359810 |
| D3 | −1.212188 | 125.528229 | 1.395567 |
| D4 | 0.521921 | 74.730046 | 3.153173 |

The concentrations 1, 5 and 10 µM are each withheld in turn, including all three
technical readings. Models are refitted on the remaining four levels; the held
mean is converted into a predicted concentration. The endpoint levels 0 and
20 µM remain as range anchors and are not claimed as extrapolation validation.

Common linear, quadratic, exponential and power families are compared using
equal-weight loading means. Pooled primary holdout RMSE is 3.043 µM for linear,
1.774 µM for quadratic, 1.281 µM for exponential, and 1.363 µM for power.
Quadratic fits fail the full-range monotonicity check and are ineligible even
though these particular held observations have unique inverses. Exponential
has the lowest RMSE among candidates with monotonic full and fold fits and
all valid inverses. The same family is used for every channel. Family selection and QC exclusion
were exploratory, so the reported score is not an unbiased prospective accuracy
estimate of a locked final method.

## Residual correction

Residual is defined as `e = c_predicted − c_actual`. Constant and affine residual
models are fitted **within each outer training set**, using inner concentration
holdouts. They never use the outer held concentration. The deployable form is

`c_adjusted = c_predicted − (alpha + beta × c_predicted)`.

This expression needs only the measured prediction at use time, not the unknown
true concentration. With only two inner levels per outer fold, the affine
correction is unstable. Pooled outer-test RMSE is:

| Extra correction | RMSE (µM) | Out-of-range estimates |
|---|---:|---:|
| None | 1.281 | 0 |
| Constant offset | 1.340 | 0 |
| Linear residual | 19.573 | 3 |

Thus the additional offset/linear correction is not adopted. Its coefficients
and every untrimmed result remain available. The residual pattern changes with
concentration; applying one retrospectively fitted offset does not improve this
validation. At 1 µM, predictions span 1.004–3.266 µM; low-level quantification
needs a denser independently prepared calibration series and contemporaneous
blanks before a lower reportable limit can be established.

## Requested interference subtraction and regularization

The net complex vectors from isolated D1–D4 10 µM loadings form an 8×4 real
design matrix by stacking I and Q. Its condition number is 10.613.
Unconstrained least squares preserves negative estimates. Uniform 10 µM gives
`[9.091, 8.721, −2.369, 10.508] µM`; uniform 20 µM gives approximately
`[60.538, 34.688, −43.807, 72.549] µM`.

These failures are not repaired by choosing a different ordinary increasing
curve independently for D3. The full requested matrix-before-curve route is
retained in `shared_family_comparison.csv`.

Ridge regularization was tuned **only** on source/blank technical holdouts,
not on uniform concentrations. Its relative penalty is 0.0001 and technical
component RMSE is 0.345 µM. Uniform 10 µM still gives
`[9.016, 8.715, −2.294, 10.464] µM`. Noise-amplification control alone therefore
does not explain or remove the configuration-dependent response.

The direct-matrix failure indicates that one fixed source matrix from these
loadings is insufficient for arbitrary mixtures. Optical-background changes,
sample geometry and concentration-dependent source responses are plausible
contributors; the supplied dataset does not isolate their individual causes.
No nominal-concentration-based leakage subtraction or arbitrary row rescaling
is advertised as a validated correction.

## Additional 2.5 µM loading

The additional loading is technically stable: raw-amplitude CV is 0.201%,
0.177%, 0.290% and 0.416% for D1–D4, compared with 1.404%, 5.295%, 30.273% and
1.289% for the original loading. The original D3 first-to-second read rises
about 81%.

However, the additional loading predates the session's water reads and yields
net D3/D4 signals −4.986/−8.158 mV with that later blank (slight phase-method
rounding differences are retained in the revision CSV). It cannot simply
replace the old loading because a matching optical baseline is absent.
The primary exclusion is a post hoc QC decision, with all-original and
substitution sensitivities available. It is not evidence that every low
concentration is unmeasurable or that the additional raw recordings are invalid.

## Statistics and figure symbols

The calibration figure's single `*` represents an **exploratory joint
four-channel Spearman trend** on the five original retained loading means.
All concentration labels are permuted jointly across the four channels,
preserving their dependence. Mean rho is 1 and exact two-sided p is 0.016667
over 5! permutations. Three technical readings are averaged before this test.

Individual two-sided Spearman p values are each 0.016667; Holm correction for
four channels gives 0.066667, so individual channels are not assigned separate
stars in the primary analysis. No pairwise preparation-level significance is
claimed from technical triplicates. Full-original and all-seven-loading
sensitivity statistics are in `trend_statistics.csv`. Acquisition order was
not randomized; permutation inference assumes exchangeable loading outcomes
under the null and does not isolate concentration from time/state confounding.

All signed heatmaps use red for positive and blue for negative. The empirical
matrix diagnostic and the separately generated optical comparison both use
signed row fractions, calculated with the same isolated-source phase direction.
Each row is divided by its signed sum; negative entries remain visible.

## Reproduce

Python requirements are NumPy, SciPy and Matplotlib. From a checkout containing
the original acquisition parser:

```text
python revise_calibration.py --data-root PATH_TO_STUDY --preview-dir PATH_TO_PREVIEWS
```

`--new-25-root` optionally overrides `PATH_TO_STUDY/raw/new_25C`.
The script and its companion parser are copied into this revision directory.
Outputs include all fitted coefficients, inverse/training checks, full
concentration holdouts, nested residual checks, regularization selection,
source-matrix estimates, QC summaries, statistics and four SVG figures.
These are local archive materials; their presence does not assert a new Zenodo
release or an external repository push.
