# 03_well_transfer · Cell-layer optical transfer

## Publication caption

Received green power resolved by active LED and the well where fluorescence originated, for the ideal-material bottom-cell-layer model.

## Generation and assumptions

Weighted absorption events seed isotropic fluorescence. Each detected packet retains its source-well label. Means from three independent seeds form a 4 × 4 matrix; each row corresponds to one illuminated LED.

## Results

Intended-well fractions span 88.6–90.9%; matrix condition number is 1.86. The bottom shared optical band still couples wells.

## How to read: axes and legends

Rows: active LED position; columns: fluorescent source well. Cell numbers and color bar: received optical nW. Diagonal entries are intended-well contributions; off-diagonal entries quantify modeled mixing. Row sums are the total fluorescence for each LED.

## Limitations

A source frequency identifies the LED, not an isolated well. This is not a measured calibration matrix. Cell distribution, reseating and the actual PD location can change the matrix. The volume-standard matrix in Figure 08 cannot replace this cell-layer matrix.

## Data and reproduction

results/LED_by_well_nW.csv; results/summary.json

```text
python run.py --plots
```
