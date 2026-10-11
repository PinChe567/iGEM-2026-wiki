# design_comparison.png

## Publication caption

Figure1 | Original18-geometry baffle screening. A: worst-well downward momentum and B: near-liquid P95 speed normalized to the open plenum; C: internal pressure drop.

## Method

3D D3Q19 BGK gas-velocity solves with a fixed no-slip liquid surface; low-Re fields normalized to1 mL/min. These are computations, not device or cell measurements. Grid0.4mm; this heterogeneous set is not a hole-diameter factorial sweep.

## Results

Vertical walls can redirect flow downward and worsen the proxy. The shelf balances direction, cleaning and part count; it does not minimize every metric.

## Reading, axes and legend

Rows are computed cases. A/B horizontal axes are logarithmic ratios,1=open; C is Pa. Orange=open,purple=original12-hole plate,teal=other geometries. J=ρΣmax(−uz,0)²ΔA at1mm below the rim.

## Data and reproduction

`sweep_summary.csv`, `results/*_dx0.4.json`; `python plot_and_video.py`.

## Limits

Gas speed or downward mouth momentum is not stress on submerged cells. Velocity CFD does not solve concentration; the added scalar model still excludes liquid, PDMS, adsorption and cells.
