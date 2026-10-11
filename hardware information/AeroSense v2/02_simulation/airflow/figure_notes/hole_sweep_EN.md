# hole_sweep.png

## Publication caption

Figure4 | Actual18-point perforated-plate factorial sweep; small holes do not by themselves establish a better device.

## Method

3D D3Q19 BGK gas-velocity solves with a fixed no-slip liquid surface; low-Re fields normalized to1 mL/min. These are computations, not device or cell measurements. Fixed3×2 array of six circular holes; diameters1.2/1.8/2.4mm,pitches3.6/4.2/4.8mm,plate bottomsZ57.9/58.2mm,thickness1.2mm,grid0.3mm.

## Results

All18 distinct voxel geometries converge. J ratios span0.0246–2.489;the coarse minimum becomes0.0351 on refinement,so0.0246 is not a precise optimum.

## Reading, axes and legend

x:diameter mm;y:pitch mm;panels:vertical distance from inlet centre to plate top1.7/1.4mm. Log colour:J/Jopen. Each cell is a solved geometry. Pitch is not global hole-count density; six holes are fixed.

## Data and reproduction

`hole_sweep.csv`, `hole_sweep_cases.json`, `hole_sweep_results/`; `python hole_sweep.py --run --refine`; `python supplemental_figures.py`.

## Limits

Minimum hole4cells,web4cells,lower gap2–3cells;two cases refined to0.2mm. Staircase/gap error remains. No extra printable option is supplied.
