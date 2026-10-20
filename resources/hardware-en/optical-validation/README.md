# Optical simulation and measured channel patterns

The primary comparison uses **one unchanged optical simulation**: the original
20 µm fluorescent layer at the well floor, with absorption coefficient
0.5 mm⁻¹, quantum yield 1 and the original CAD geometry. This is the design
model already used in Hardware and Model. The different uniform-volume
simulation remains in the earlier archived analysis; it is not substituted
to improve agreement with measurements.

## Reproduce

Run `python analyze_optical_validation.py` in an environment containing NumPy,
SciPy and Matplotlib. The adjacent source tables are sufficient to reproduce
all CSVs, the numerical summary, PNGs and SVGs. `provenance.json` records the
original read-only input paths and SHA-256 checksums.

- `simulation-source.json` preserves the original raw nW matrix, ordered
  NE, NW, SW, SE. The site registration D1–D4 is SW, SE, NE, NW. Both axes
  are reordered together. No matrix value or source parameter is fitted.
- `measurement-source.csv` preserves the signed mV response matrix from the
  single-well experiment: one well contains 100 µL of 10 µM fluorescein;
  each of the other three wells contains 100 µL DDW.
  Each source condition has three consecutive technical reads.
  See `../fluorescein-revision/README.md` for the raw-record reconstruction:
  subtract the current water blank in complex I/Q space, then project each
  channel onto the phase measured with its own source well.

## Why the previous figure values looked different

The optics figure originally showed received power in **nW**. The validation
figure showed a **percentage of the row sum**. They were the same floor-layer
matrix in different units. For example, D4 own-well power is 0.657063 nW
and its row total is 0.722560 nW; the same result is 90.935% after normalization.
The earlier validation also displayed a second, physically different,
liquid-volume simulation. The primary website comparison now consistently
shows the original floor-layer model as row-normalized percentages.

For either matrix, `percentage[i,j] = 100 * value[i,j] / sum(value[i,:])`.
Measured values retain their signs; the negative D4/D1 projection is not
clipped. Percentages compare channel composition, not absolute optical power
or the percentage of total fluorescence emitted from a source.

## Primary comparison: simulation, measurement and paired scatter

The current image is `simulation-measurement-paired-comparison.svg` (and PNG).
Its three panels are arranged in one compact row. **A and B are unchanged**:
the same row-normalized simulation and signed measurement matrices.

**C pairs each of the 16 corresponding entries**, with simulation A on the
horizontal axis and original measurement B on the vertical axis. Pearson
**r = 0.809800** is calculated from those original full-precision A/B values,
including the negative measured response. Point color identifies the readout
channel. The dashed line is B = A, not a fitted regression.
This correlation is descriptive: entries share row normalization and source
measurements and are not 16 independent experimental samples. A strong
diagonal contributes substantially to the overall association; it does not
establish equal response magnitude. Restricting the comparison to the 12
off-diagonal entries gives **Pearson r = 0.257022**, so the overall r = 0.810
must not be presented as quantitative agreement of the leakage pattern.

`paired-response-values.csv` is the current primary data table: readout
channel, source well, simulated A percentage, measured B percentage and
whether the entry is a same-well diagonal. It contains all 16 corresponding
entries, with no scaling, deletion, clipping or fitted adjustment.

## Historical range-scaled comparison (removed from the primary figure)

The earlier `simulation-measurement-scaled-comparison.svg` (and PNG) is kept
as a revision artifact. Its removed D panel used one global min–max mapping
of the entire B matrix, with the formula:

```
B′ = A_min + (B − B_min) / (B_max − B_min) × (A_max − A_min)
D  = 100 × (B′ − A) / (A_max − A_min)
```

The bounds come from all 16 displayed-matrix values before rounding:

| Bound | Value |
|---|---:|
| A_min | 0.0000000000 |
| A_max | 90.9354558899 |
| B_min | −3.0728721451 |
| B_max | 69.5430897914 |

Thus `B′ = 1.2522791610 × B + 3.8480937518`. No individual row, column
or cell is fitted separately. The signed D values are:

| Readout \ source | D1 | D2 | D3 | D4 |
|---|---:|---:|---:|---:|
| D1 | −24.0107 | 18.9350 | 32.1069 | 17.6381 |
| D2 | 27.4701 | −18.4223 | 26.1391 | 9.4824 |
| D3 | 46.1145 | 46.7735 | −43.4183 | −4.8003 |
| D4 | −0.4720 | 8.2425 | 36.8989 | 0.0000 |

D's unit is **percent of A's global maximum–minimum range**. It is not the
raw B − A residual in percentage points. This transform deliberately removes
one overall offset and range from B, then shows the remaining signed spatial
differences. It is not a measured physical gain calibration or a leakage
correction. The D4/D4 cell becomes zero by construction because it is the
global maximum in both A and B; its raw responses remain 90.9% and 69.5%.
The B minimum maps to A's minimum, but A/B and the original signed B values
are never changed.

`paired-response-comparison.csv` contains all A, B, B′ and D values with their
readout/source labels. `summary.json` records the exact bounds, affine
coefficients, Pearson r and D matrix. The symmetric D color scale is −50 to
+50 percent of A's range; these are plotting limits, not acceptance limits.

## Historical mean absolute difference (not the primary figure)

The previous image `simulation-measurement-difference.svg` (and PNG) is
retained as a revision artifact. Its panel C contained one row and four
columns, one for each readout channel D1–D4. This is no longer the current
primary panel C.

For each readout row, compare the same four source-well entries:

`MAE[i] = mean_j(abs(measured_percentage[i,j] - simulated_percentage[i,j]))`.

| Readout channel | Mean absolute difference (percentage points) |
|---|---:|
| D1 | 19.256618 |
| D2 | 17.154071 |
| D3 | 30.367131 |
| D4 | 12.447227 |

Lower values mean closer agreement across that channel's four displayed
source positions. The plot uses one decimal place: **19.3, 17.2, 30.4, 12.4**.
This is an equal-weight descriptive difference, not a correlation coefficient,
classification score, probability distance, significance test or accuracy
estimate across independent samples.

The calculation uses the exact values underlying panels A/B, not the rounded
labels. `difference-matrix.csv` stores every signed B − A difference and its
absolute value; `readout-distribution-difference.csv` stores the four means.
The measured D4 response to source D1 remains −3.072872%, so its difference
from the simulated +0.429216% is −3.502089 percentage points. No negative
response is clipped or treated as a physical negative emitted-light fraction.
Absolute differences remain mathematically defined for these signed responses.

The sequential color scale runs from 0 to 40 percentage points for display;
40 is a plotting range, not a theoretical bound or an acceptance threshold.
D4 has the smallest average discrepancy and D3 the largest in these data.
The physical source and readout limitations below still apply.

## Historical correlation checks (not the primary figure)

All statistics are descriptive. The 16 matrix cells share channel
normalizations and source measurements; they are not 16 independent samples.
No significance tests, p-values or confidence intervals are reported.
These earlier correlation analyses and their CSVs are retained for the
revision record. They do not define the current panel C.

| Comparison | Entries | Pearson r | Spearman ρ |
|---|---:|---:|---:|
| All matrix cells | 16 | 0.809800 | 0.698585 |
| Off-diagonal cells only | 12 | 0.257022 | 0.275543 |
| Diagonal only | 4 | 0.838833 | 0.800000 |

The previous correlation heatmap had **two rows by four columns**. Each
column identifies the same D1–D4 in the simulation and measurement.

- **By source well:** hold one fluorescent source well fixed, then compare
  its four responses across the LED-frequency/readout channels. This uses
  the matching **column of the original nW matrix** and the **column of
  the original signed mV matrix**, before row normalization.
- **By readout channel:** hold one LED-frequency/readout channel fixed,
  then compare its responses to the four separately loaded source wells.
  This uses the matching **row** of the same original matrices. Normalizing
  that whole row by its positive sum leaves its Pearson correlation unchanged.

| Direction | D1 r | D2 r | D3 r | D4 r |
|---|---:|---:|---:|---:|
| By source well | −0.125186 | 0.192995 | 0.999293 | 0.986733 |
| By readout channel | 0.970777 | 0.945360 | 0.377165 | 0.931852 |

`same-channel-directional-correlations.csv` records both Pearson r and
Spearman ρ for each comparison. Each correlation uses four positions,
not independent repetitions. A high Pearson value can be dominated by
one strong response: source D4 has Pearson r = 0.987 but Spearman ρ = 0.316.
This is not evidence that all smaller contributions have the correct ordering.

Do not compute the source-column comparison from panels A/B's
row-normalized matrices. That would divide different channels by different
row sums and change the source distribution being compared. For example,
it would change the D1 source Pearson result from −0.125 to +0.772.
The raw nW and mV units do not prevent Pearson correlation, which is invariant
to one positive scale factor applied to an entire vector. Unequal channel
gains, however, can change a source-column pattern and are part of the
measured response; no fabricated gain correction is applied here.

The reader has **one photodiode**, with four frequency-tagged readout
channels. “By source well” is a distribution of measured responses across
those channels, not four physical detectors or a fraction of all photons
emitted by a well. “By readout channel” is the response to separate source
loadings, not an independently measured LED illumination map. All eight
correlations are pattern summaries, not cross-talk-removal coefficients.

The earlier cross-channel 4 × 4 row-pattern comparison is retained in
`channel-pattern-correlations.csv` for reproducibility, but is not shown
in the primary figure.

The full-matrix correlation is partly driven by the common dominant diagonal.
The weak off-diagonal agreement and weak D3 row agreement mean that detailed
cross-talk is not reproduced by the ideal optical model. A good pattern
correlation does not imply equal magnitude.

## D4 example and direction

D4 has the largest same-well share in both matrices: 90.9% simulated versus
69.5% measured. In the **D4 readout row**, D3 is the strongest non-own source:
8.6% simulated versus 30.6% measured. This means **light from source well D3
contributes to readout D4**.

The reverse direction is a different entry: source D4 in readout D3 is
8.5% simulated versus 0.3% measured. It does not show the same agreement.
Overall, the strongest non-own source matches in D2 and D4 (2 of 4 rows);
it differs in D1 and D3.

## Scope

The simulation describes an ideal floor source; the experimental standard
emits through liquid volume and the readout also contains electronic effects.
Printed geometry, alignment, resin optics and electrical cross-talk could
contribute to discrepancies, but this comparison does not identify their
individual contributions. No measured manufacturing tolerance is inferred.
The source-distribution difference also means this is a trend comparison
against the design model, not a matched-condition quantitative validation
of the cell-layer assumption or a calibration for arbitrary mixed samples.

## Reproduce without overwriting retained outputs

```text
python analyze_optical_validation.py --output-dir PATH_TO_NEW_OUTPUT_DIRECTORY
```

The two input tables remain beside the script; only newly generated results
are written to the selected directory. This output-location option does not
change normalization, correlations or model values. The review environment
is Python 3.11, NumPy 2.4.6, SciPy 1.17.1 and Matplotlib 3.11.1.

Within the research archive, the historical `../fluorescein-revision/` source
reference maps to the study's
`aerosense-wiki/hardware information/AeroSense v2/07_validation/fluorescein_2026-10-20/revision/`.
The original measurement table and its SHA-256 remain recorded in provenance.
