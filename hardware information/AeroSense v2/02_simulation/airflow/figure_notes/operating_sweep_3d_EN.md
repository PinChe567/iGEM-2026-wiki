# operating_sweep_3d.html

## Publication caption

Interactive operating map of 21 actually solved conditions with selectable response, colour and provisional targets.

## Method

Fixed STL; 21 conservative 3D gas advection–diffusion cases with Q-scaled low-Re velocity and no liquid uptake.

## Results

The lowest sampled operating candidate satisfying the prespecified conditions is **3 mL/min**, with a worst-well/worst-D gas t90 of **50.00 s**.

## Reading / axes and legend

X=logQ, Y=Dgas, Z=worst-well t10/t50/t90 seconds. Colour selects gas speed, chamber drop, port Re or t90. Outlines identify the lowest Q meeting constraints across D. D is not a control; exploring targets does not rewrite the report.

## Data and reproduction

`operating_sweep.csv`, `operating_results/*.csv/*.json`, `operating_sweep_config.json`; `python operating_sweep.py --run --checks --refine --selected-checks`; `python operating_figures.py`; `node test_operating.cjs`.

## Limits

Gas-side time is not cell response. The 0.01-mm/s cap is not a biological safety threshold. Tubing, filters, liquid, adsorption and cells are absent. Numerical checks are in Flow_Operation_EN.md. Interactive checks use Node/data tests; browser interaction is unverified.
