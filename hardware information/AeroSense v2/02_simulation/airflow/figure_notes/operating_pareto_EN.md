# operating_pareto.png

## Publication caption

Nondominated tradeoff between gas delivery time and near-liquid speed; the ring marks the lowest sampled flow meeting the provisional constraints.

## Method

Fixed STL; 21 conservative 3D gas advection–diffusion cases with Q-scaled low-Re velocity and no liquid uptake.

## Results

The lowest sampled operating candidate satisfying the prespecified conditions is **3 mL/min**, with a worst-well/worst-D gas t90 of **50.00 s**.

## Reading / axes and legend

X=near-liquid gas P95 speed mm/s; Y=worst-well/worst-D t90 seconds. Point labels are Q mL/min; dashed line=60 s; black ring=conditional selection, not a global optimum.

## Data and reproduction

`operating_sweep.csv`, `operating_results/*.csv/*.json`, `operating_sweep_config.json`; `python operating_sweep.py --run --checks --refine --selected-checks`; `python operating_figures.py`; `node test_operating.cjs`.

## Limits

Gas-side time is not cell response. The 0.01-mm/s cap is not a biological safety threshold. Tubing, filters, liquid, adsorption and cells are absent. Numerical checks are in Flow_Operation_EN.md. Interactive checks use Node/data tests; browser interaction is unverified.
