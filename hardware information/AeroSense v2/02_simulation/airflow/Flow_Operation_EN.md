# Gas operating conditions for the fixed enclosure

The lowest sampled operating candidate satisfying the prespecified conditions is **3 mL/min**, with a worst-well/worst-D gas t90 of **50.00 s**. This is a conditional choice for the fixed shelf and fixed STL in a gas-side model, **not a global optimum, a HEK293T safety result, or a demonstrated time to GCaMP activation**. CAD is unchanged.

## Prespecified selection rule

Before inspecting the new outputs, `operating_sweep_config.json` fixed Q=0.25/0.5/1/2/5 mL/min and Dgas=5/10/20 mm²/s. The assumed targets are worst-well/worst-D gas t90≤60 s, port Re≤3, and near-liquid gas P95 speed≤0.01 mm/s. Choose the smallest qualifying Q without a weighted score. These response times assume a sustained inlet concentration step, not a brief odor pulse or cellular response. The 60-s target is provisional; the speed cap is an engineering comparison limit, not a cell-injury threshold. D is an uncertain species/environment property, not a knob to tune like pump flow.

| Q (mL/min) | Worst gas t90 (s) | P95 gas speed (mm/s) | Port speed (mm/s) | Port Re | Chamber Δp (Pa) | Meets targets |
|---:|---:|---:|---:|---:|---:|:---:|
| 0.25 | 549.59 | 0.000234 | 0.921 | 0.147 | 0.00228 | False |
| 0.5 | 299.09 | 0.000467 | 1.842 | 0.295 | 0.00456 | False |
| 1 | 149.55 | 0.000934 | 3.684 | 0.589 | 0.00912 | False |
| 2 | 75.07 | 0.001869 | 7.368 | 1.179 | 0.01825 | False |
| 2.5 | 60.04 | 0.002336 | 9.210 | 1.474 | 0.02281 | False |
| 3 | 50.00 | 0.002803 | 11.052 | 1.768 | 0.02737 | True |
| 5 | 31.95 | 0.004672 | 18.421 | 2.947 | 0.04562 | True |

Each t value takes the slowest of four near-liquid gas sampling bands, 0.6–1.4 mm above the liquid; it is not a liquid or cellular concentration. Worst-case D need not be monotonic because upstream diffusion contributes at the prescribed inlet step. V/Q alone is not a response-time calculation. Raw CSV/JSON retain t10, t50, t90 and complete per-well curves. Q2.5 gives about 60.04 s: its 0.04-s nominal miss is smaller than numerical sensitivity, so it is not demonstrated physically inadequate. Q3 gives about 50 s and a larger within-model timing margin; physical testing remains necessary. A rounded figure value of 60.0 is not exact target compliance.

## Pareto tradeoff and limits

The nondominated sampled flows are 0.25, 0.5, 1, 2, 2.5, 3, 5 mL/min: lower gas speed generally costs delivery time. Connecting lines join discrete cases and do not certify interpolated operating regions. Port Re approaches 3 at the upper endpoint, so linear low-Re scaling requires checks. Tubing, filters, leaks, adsorption, dissolution and cell response are absent. With 100 µL, the liquid depth is 8.93 mm; delivery to bottom-adherent cells remains a separate [liquid/membrane problem](../membrane/Analysis_EN.md).

## Numerical method and checks

The main grid is 0.4 mm. Saved rigid-wall/no-slip-liquid gas velocity is linearly scaled with Q; projected face fluxes enforce discrete conservation. Conservative finite volume uses upwind advection, central diffusion and backward Euler. Initially C=0; the inlet terminal steps to C/Cin=1; the outlet is convective with zero diffusion; solid and liquid walls are impermeable. Timesteps are 1 s for Q≤0.5, 0.5 s for Q1/2 and 0.25 s for Q≥2.5. End time is max(150,300/Q) s.

There are 15 initial operating scalar solves and 6 adaptive bracket-refinement solves at Q2.5/3, declared in a separate stage-2 config after Q2/5 bracketed 60 s. Thus 21 operating conditions, 6 scalar validation solves and 1 direct near 5-mL/min velocity solve. Previous data are preserved. Recomputed Q1 t90 differs from prior baselines by at most 0 s. Maximum relative global mass residual is 9.12e-12; concentration spans 0–1, without display-driven clipping.

| Check | t90 relative change |
|---|---:|
| upper_flow_grid | +2.070% |
| upper_flow_timestep | -0.557% |
| lower_flow_timestep | -0.138% |
| upper_flow_direct_field | +0.084% |
| selected_point_grid | +1.968% |
| selected_point_timestep | -0.304% |

The direct velocity run reaches Q=4.9708 mL/min. At the same 0.3-mm grid and τ0.55, its normalized field differs from the near 1-mL/min run by 1.650% in velocity L2 and 0.294% in near-liquid P95. This quantifies inertia/boundary sensitivity, not continuum grid independence. A separately stored scalar history uses the direct field after normalization to the same comparison Q.

## One-pump operation

Use **one regulated downstream suction pump**, with actual flow measured or calibrated through the complete assembled path and suitable inlet filtration. A sealed steady series path has the same mass flow at inlet and outlet; at equal pressure/temperature under this nearly incompressible model, Qin≈Qout. Independent inlet and outlet pumps cannot impose unequal steady flows without pressure storage, leaks or compensating flow, none of which is represented here. At the Q3 candidate, one pump draws about 3 mL/min and both port rates refer to the same pressure/temperature basis. This simulation supplies no pump driver or flow-control loop; a UI record of a flow setting is not proof that physical flow was reached.

Tabulated pressure drop covers only the modeled chamber and short port segments, not filters or external tubing; it cannot alone specify a pump. Do not apply a pump's maximum vacuum to sealed culture wells. First use a cell-free water surrogate at low flow to confirm an open outlet, no visible liquid displacement and no leaks, then measure flow with all intended filters/tubes installed. This is a mechanical flow check, not a cell or sterility validation.

## Reproduction and interpretation

`python operating_sweep.py --run --checks --refine --selected-checks` computes the cases. `python operating_figures.py` regenerates plots, offline HTML and this report; `node test_operating.cjs` tests data and interaction mathematics. In `operating_sweep_3d.html`, targets can be explored without changing the report's prespecified selection. X=Q, Y=D, Z=a computed time response; the third axis is not an independent control. No PCA/UMAP cluster is used to claim an optimum. Separate bilingual notes are in figure_notes.
