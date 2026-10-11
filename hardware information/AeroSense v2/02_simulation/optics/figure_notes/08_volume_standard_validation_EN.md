# 08_volume_standard_validation · Uniform-volume standard transfer

## Publication caption

Row-normalized source-well contributions for a weakly absorbing uniform fluorescent liquid, distinct from a bottom cell layer.

## Generation and assumptions

Four LEDs × three seeds use the same 100 µL geometry, but absorption 0.001/mm is distributed through the liquid. The additional model contains 1,008,000 packets. Each row is divided by its received green total.

## Results

Off-diagonal contributions remain. This gives a matched-model comparison for a simple single-well standard-liquid experiment, without claiming that the same matrix applies to cells.

## How to read: axes and legends

Rows: illuminated LED position. Columns: source well. Numbers and color: percent of received fluorescence from each well, so each row sums to 100% apart from displayed rounding. Unlike Figure 03, this figure is normalized rather than nW.

## Limitations

Use complex blank-subtracted measured signals before taking amplitudes and normalizing. Match fill and geometry. Unknown concentration, spectrum, quantum yield and LED power limit absolute-power validation. A uniform-liquid matrix does not calibrate a localized cell layer.

## Data and reproduction

results/volume_standard_summary.json; results/volume_standard_LED_by_well_fraction.csv

```text
python run.py --plots
```
