# Membrane and liquid transport

This is a one-dimensional transport screening study. It does not establish cellular exposure, viability or GCaMP response. The simulated reference is **100 µL** in a 4 × 2.8 mm well: liquid depth 8.929 mm and gas gap 3.571 mm. This is not a validated physical working volume.

**Decision:** PDMS is not selected for the current prototype. First measure no-film delivery and define the target VOC, interferents and material properties. Deep stagnant liquid can dominate the delay.

## Files and reproduction

- `code/`: Python sources and requirements.
- `code/data/`: source provenance, assumptions, numerical validation and summary JSON. These are necessary scientific inputs and records.
- `results/`: complete CSV sweeps, histories, numerical checks and blank measurement templates.
- `figures/`: seven publication figures. There is no membrane movie.

From this folder, redraw saved data without recomputing the model:

```text
python -m pip install -r code/requirements.txt
python -B code/plot.py
```

To recompute the deterministic model and its separate gas-CFD coupling:

```text
python -B code/run.py --plots
python -B code/integrate_airflow.py
```

The coupling reads `../airflow/results/gas_transport_results/shelf_w8_e0p2_D10_dx0.4_dt0.5.csv` and the matching JSON under `../airflow/code/data/gas_transport_results/`. No external CAD or commercial solver is required. A supplied rim history can be used with:

```text
python -B code/couple_gas_history.py --csv PATH --time time_s --column RIM_COLUMN
```

The CSV must start at zero and contain increasing times and nonnegative, consistently normalized concentrations. Use a rim value, not a headspace average. The liquid model already includes the headspace.

## Method and results

The finite-volume model solves `K du/dt = d(D K du/dx)/dx`, with physical concentration `c=K u`. Interface resistances conserve flux. A symmetric matrix exponential propagates the system. Piecewise-linear forcing is integrated analytically. The initial concentration is zero, the rim steps to one, and the bottom is impermeable. Convection, reaction, binding and cellular consumption are excluded.

Nominal properties are assumptions: liquid D=1e-9 m²/s and liquid/gas K=10; PDMS D=1e-10 m²/s and PDMS/gas K=100. No pair is assigned to a named VOC or PDMS formulation. There are 243 membrane conditions, 108 mixing/feed conditions and 25 interface-resistance cases. Seventy-four t90 results are censored at seven days. Blank CSV cells do not mean zero time. Seven days is a numerical horizon, not a permitted incubation time.

For an ideal surface step, `t90=1.031105 L²/D`. At 100 µL, liquid D=0.5/1/2 × 1e-9 m²/s gives t90=45.67/22.83/11.42 h. These are conditional diffusion times, not measured device latency. The gas gap alone gives t90≈1.315 s at D=1e-5 m²/s, even at zero velocity. Faster gas flow does not prove liquid mixing.

Representative full-layer t90 is 22.85 h without film, 23.39 h with nominal 100 µm PDMS, and 23.55 h with that film plus a 1 mL/min finite-feed reservoir. Film time lag `L²/(6D)` is not cell-bottom t90. Partitioning changes storage as well as permeability. A short pulse can peak at the bottom hours later.

The saved CFD-rim chain ends at 300 s; rim t50/t90 are 48.78/149.02 s. The bottom remains below the numerical reporting floor in that interval. Explicit continuation assumptions give no-film t90=22.87–23.62 h and nominal-film t90=23.41–24.18 h. These are not 23-hour CFD calculations. Coupling is one-way: upstream gas has an impermeable liquid boundary and is not recalculated for uptake.

The oxygen example gives about 0.75 pmol/s capacity per well under its assumed stagnant conditions. Demand is not a cell count or measured HEK293 respiration. No oxygenation, water retention, CO2/pH or sterility claim follows.

Numerical checks give membrane-lag error 0.00305%, exact liquid-t90 error 0.000762%, representative liquid-mesh t90 change 0.00405%, and worst normalized mass residual about 2.17e-5. These test implementation under assumptions, not biological validity.

## Figures for the Wiki

| Figure | Interpretation |
|---|---|
| [01 gas/liquid times](../../../../hardware%20information/AeroSense%20v2/02_simulation/membrane/figures/01_gas_and_liquid_times.png) | Gas and stagnant-liquid time scales; arrival is not biological response. |
| [02 depth/mixing](../../../../hardware%20information/AeroSense%20v2/02_simulation/membrane/figures/02_depth_and_mixing.png) | Fill and effective-D sensitivity; no physical fill is selected. |
| [03 intrinsic PDMS](../../../../hardware%20information/AeroSense%20v2/02_simulation/membrane/figures/03_intrinsic_PDMS.png) | Permeance and intrinsic lag; not bottom-cell t90. |
| [04 coupled sweep](../../../../hardware%20information/AeroSense%20v2/02_simulation/membrane/figures/04_PDMS_coupled_sweep.png) | Conditional D/K/thickness grid; censored times remain censored. |
| [05 pulse/storage](../../../../hardware%20information/AeroSense%20v2/02_simulation/membrane/figures/05_pulse_and_storage.png) | Diffusion memory; no receptor adaptation model. |
| [06 oxygen](../../../../hardware%20information/AeroSense%20v2/02_simulation/membrane/figures/06_oxygen_capacity.png) | Assumed capacity ceiling, not safe cell loading. |
| [07 numerical checks](../../../../hardware%20information/AeroSense%20v2/02_simulation/membrane/figures/07_numerical_validation.png) | Analytical and mesh checks, not experimental confidence intervals. |

## Primary sources

Hydrophobicity does not imply low water-vapor transport: [Bian et al.](https://onlinelibrary.wiley.com/doi/10.1002/marc.202000682). Evaporation and osmolality: [Heo et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC2605290/). Oxygen permeability and surface resistance: [Firpo et al.](https://www.mdpi.com/2073-4360/11/5/910). Sorption and swelling: [Toepke and Beebe](https://pubmed.ncbi.nlm.nih.gov/17203151/), [Lee et al.](https://pubmed.ncbi.nlm.nih.gov/14640726/). Species/formulation dependence: [Lue et al.](https://www.sciencedirect.com/science/article/pii/S0376738809008783). Detailed provenance remains in `code/data/sources.json`.

