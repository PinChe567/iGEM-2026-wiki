# operating_delivery.png

## Publication caption

Flow–diffusivity sweep for the fixed shelf; each cell is the slowest-well gas t10, t50 or t90.

## Method

Fixed STL; 21 conservative 3D gas advection–diffusion cases with Q-scaled low-Re velocity and no liquid uptake.

## Results

The lowest sampled operating candidate satisfying the prespecified conditions is **3 mL/min**, with a worst-well/worst-D gas t90 of **50.00 s**.

## Reading / axes and legend

Panels are t10, t50 and t90; X=Q mL/min, Y=Dgas mm²/s. Shared logarithmic colour denotes seconds; cell text gives actual seconds.

## Data and reproduction

`operating_sweep.csv`, `operating_results/*.csv/*.json`, `operating_sweep_config.json`; `python operating_sweep.py --run --checks --refine --selected-checks`; `python operating_figures.py`; `node test_operating.cjs`.

## Limits

Gas-side time is not cell response. The 0.01-mm/s cap is not a biological safety threshold. Tubing, filters, liquid, adsorption and cells are absent. Numerical checks are in Flow_Operation_EN.md. Interactive checks use Node/data tests; browser interaction is unverified.
