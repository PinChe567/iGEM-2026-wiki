# hole_sweep_3d.html

## Publication caption

Interactive figure | Each point is one computed perforated-plate geometry.

## Method

Uses the same18 CSV rows with native browser projection and no network/CDN.

## Results

Inspect interactions of diameter,pitch and location; colour selects momentum,speed,pressure or open-area fraction.

## Reading, axes and legend

X diameter,Y pitch,Z inlet-centre-to-plate-top distance,all mm;not a hole-density axis. Drag/arrow keys rotate,wheel zoom,hover reveals values/raw JSON.

## Data and reproduction

`hole_sweep.csv`; `scatter_math.js`, `scatter_ui.js`; `python supplemental_figures.py`; `node test_interactive.cjs`.

## Limits

Source,data,rotation mathematics and control mappings are tested; browser interaction was not tested because of session restrictions.
