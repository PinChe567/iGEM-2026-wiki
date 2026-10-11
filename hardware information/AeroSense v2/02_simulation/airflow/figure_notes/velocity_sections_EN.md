# velocity_sections.png

## Publication caption

Figure3 | Velocity sections for open, original perforated and selected-shelf cases.

## Method

3D D3Q19 BGK gas-velocity solves with a fixed no-slip liquid surface; low-Re fields normalized to1 mL/min. These are computations, not device or cell measurements. A shared colour scale is used; white regions are outside gas.

## Results

Gas speed near the fixed liquid surface is small; molecular diffusion can still deliver species.

## Reading, axes and legend

Columns:open,original12-hole plate,selectedshelf. Rows:XY atz≈60.8mm;XZ aty≈0;XZ aty≈2.65. Axes:mm. Log colour:speed10⁻⁴–10mm/s. Nearest available voxel planes are used.

## Data and reproduction

`results/*_dx0.4_field.npz`; `python plot_and_video.py`.

## Limits

Gas speed or downward mouth momentum is not stress on submerged cells. Velocity CFD does not solve concentration; the added scalar model still excludes liquid, PDMS, adsorption and cells.
