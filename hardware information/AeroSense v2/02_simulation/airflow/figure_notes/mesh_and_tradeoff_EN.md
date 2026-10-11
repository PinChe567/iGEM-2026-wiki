# mesh_and_tradeoff.png

## Publication caption

Figure2 | Mesh sensitivity of the selected shelf relative to the open plenum.

## Method

3D D3Q19 BGK gas-velocity solves with a fixed no-slip liquid surface; low-Re fields normalized to1 mL/min. These are computations, not device or cell measurements. Paired0.4/0.3/0.2mm grids.

## Results

Momentum ratios0.691,0.699,0.639 support the direction but not grid-independent absolute local metrics.

## Reading, axes and legend

Horizontal:grid spacing mm. A vertical:J/Jopen; B:u95/u95open. Points are mesh calculations,not experimental repeats/error bars.

## Data and reproduction

`mesh_refinement.csv`; `python analyze.py`.

## Limits

Gas speed or downward mouth momentum is not stress on submerged cells. Velocity CFD does not solve concentration; the added scalar model still excludes liquid, PDMS, adsorption and cells.
