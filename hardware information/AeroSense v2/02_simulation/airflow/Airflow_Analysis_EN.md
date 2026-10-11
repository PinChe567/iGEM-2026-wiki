# Airflow design analysis

## Decision and geometry

The selected engineering prototype is the wide inlet shelf (`shelf_w8_e0p2`), integrated into the left gas-cap wall. The shelf adds no component or fastener; the separate compression plate required for sealing is included in the eight-part assembly. It is a practical trade-off, not a global optimum or a biologically validated protective device.

Shelf solid: X −7.4 to −0.2 mm, Y −4 to +4 mm, Z 58.2 to 59.4 mm. Common plenum X±7.4, Y±6.0, Z 57.3–62.5 mm. Both horizontal ports: ID 2.4 mm, Y=0, Z=60.8, end X=±18 mm. The local cap roof is 1.5 mm thick to Z64, and the outer lid panel continues to Z66; the CFD inner roof remains Z62.5. A removable compression plate occupies Z56.1–57.3 with four 4×2.8 mm openings; the upper perimeter gasket spans Z57.3–57.9 while the center remains gas. The cap lower edge is 57.9. This sealing design requires eight operating prints. Four liquid cavities center (±3.3,±2.65), cross-section 4×2.8 mm, floor Z43, rim Z55.5. A 100 µL fill gives surface Z51.9286 mm. Shared gas; separate liquids.

## What was compared

The objective is to avoid concentrated flow directed toward the liquid, not to create turbulence. Port Re≈0.589 at 1 mL/min; directional redistribution is laminar. Eighteen actual CFD geometries cover an open plenum, an adapted 12-hole plate, nine vertical walls, three L-shaped hoods, and four shelves. Vertical walls redirected part of the inlet flow downward and increased the worst-well downward-momentum proxy. The wide shelf reduced this proxy on all three grids while remaining open and accessible for cleaning.

## Results and trade-offs

The directional metric is the maximum across wells of ρΣmax(−uz,0)²ΔA at a plane 1 mm below the rim. Near-liquid gas speed P95 is evaluated 0.6–1.4 mm above the fixed liquid surface. Neither is stress on submerged cells.

| At 1 mL/min, finest 0.2 mm grid | Open plenum | Selected shelf |
|---|---:|---:|
| Worst-well downward-momentum proxy, N | 1.058e-17 | 6.767e-18 |
| Worst-well near-liquid P95 speed, mm/s | 0.000970 | 0.000775 |
| Internal pressure drop, Pa | 0.008537 | 0.008607 |
| CV of downward gas-circulation flux across wells | 0.0098 | 0.3691 |

The momentum reduction is 30.9%, 30.1%, and 36.1% on 0.4, 0.3, and 0.2 mm grids, respectively. All three grids support the direction of improvement, while absolute local quantities remain grid sensitive. Near-liquid P95 decreases by 20.1% on the finest grid; this is not evidence of cell protection or uniform exposure. Gas-circulation symmetry worsens. This CV is not an odor-concentration CV; the velocity metric alone does not establish concentration; see the added gas-scalar analysis below. The perforated plate reduces near-liquid speed more on the coarse grid, and reduces mouth momentum, but creates a less accessible upper cavity. The selected design therefore includes an explicit cleanability/part-count trade-off.

## Numerical method and checks

Custom double-precision 3D D3Q19 BGK lattice-Boltzmann implementation; screening τ=0.8, air ρ=1.2 kg/m³ and μ=1.8e−5 Pa·s. Halfway bounce-back on rigid walls and stationary liquid surfaces; non-equilibrium-extrapolation pressure terminals. Convergence requires relative velocity change over 200 steps <2e−5 and inlet/outlet mass imbalance <0.2%, for three consecutive reports. All 28 solves meet these declared criteria; maximum final imbalance is 0.0444%. C# versus NumPy tube-field relative L2 difference is 3.09e-12. Hagen–Poiseuille tube-flow errors are 2.54% at τ=0.8 and -1.13% at τ=0.55. Numerical benchmarks are not experimental device validation.

Screening fields were solved at small pressure forcing and Stokes-normalized to 1 mL/min. Separate τ=0.55 runs actually produced 0.9400 mL/min (open) and 0.9401 mL/min (shelf); shelf Re=0.554, relative density range 0.234%. Their normalized momentum ratio is 0.641, supporting the same directional trend near the intended operating flow. Changing τ also changes staircase-boundary error, so this is not an isolated inertia study.

Local metrics are not grid independent. The original velocity solver did not include species transport; the added gas-scalar model below still omits liquid dissolution, evaporation, moving liquid, cell injury, external filter or tubing is modeled. Internal pressure drop must not be used alone to size a pump. There is no prediction of sterility, cell viability, receptor activation or uniform exposure.

The finest-grid gas volume is approximately 1.193 mL. At 1 mL/min, V/Q is 71.6 seconds. This is only a bulk volume/flow scale, not a well-concentration equilibration time or a complete biological measurement duration. Keep the 2-second acquisition window distinct from the full odor-exposure duration.

## Figures, video and reproduction

`figures/design_comparison.png`: 18-case screening. `figures/velocity_sections.png`: inlet and well sections. `figures/mesh_and_tradeoff.png`: grid sensitivity. `airflow_comparison.mp4`: three-case RK2 tracer visualization from saved steady velocity fields; 60 physical seconds in 20 playback seconds. Four hundred markers begin in the inlet and gas spaces; exited markers are reinjected. A–C show steady velocity tracers; D separately plots gas advection-diffusion concentration. No liquid/cell motion or turbulence is depicted. The raw JSON/NPZ/convergence CSV files are in `results/`; geometry, selection and verification are machine-readable.

## Short experimental check

First use water-only wells to check leakage and establish external flow. Do not interpret a dyed-liquid flow experiment as equivalent to this gas CFD. Compare the selected cap and an otherwise identical no-shelf control at the same flow, liquid volume, temperature and cell batch. Record baseline stability and per-well response timing/amplitude. Without local gas-concentration or velocity instrumentation, describe this as a whole-system exposure comparison, not a validated velocity-field measurement. Detecting a large inter-well asymmetry is a reasonable two-week priority; elaborate flow visualization is unnecessary.

## Method references

Guo, Zheng & Shi (2002), non-equilibrium extrapolation: https://cpb.iphy.ac.cn/en/article/doi/10.1088/1009-1963/11/4/310 . Nash et al., boundary-condition and curved-wall accuracy comparison: https://arxiv.org/abs/1211.0205 . The implementation is custom; citing these methods does not imply those authors validated this code.


## Added: perforated sweep and gas species delivery

The original28 velocity solves are intact. Eighteen actual hole geometries plus two refined cases vary diameter1.2/1.8/2.4mm,pitch3.6/4.2/4.8mm andplate-bottomZ57.9/58.2mm. Six holes are fixed,so pitch is not global hole-count density. Minimum coarseJ/open0.0246 becomes0.0351 at0.2mm;maximum coarse ratio is2.489. Reduced circulation is not proven better cell exposure. The cleanable shelfCAD remains selected;no additional print option is released.

At100µL,liquiddepth is8.93mm and actual sub-rim gasheadspace3.57mm. Selected-shelf near-liquidP95 speed is about0.00049–0.00093mm/s on0.4mm cells. LocalPe atD10mm²/s is0.00018–0.00033,so diffusion can supply gas despite tiny tracer displacements. L²/D across the gasgap is1.276s;whole inlet/plenum delivery givesNE near-liquidt90=149.55s,versus152.09s on0.3mm cells. Delivery through liquid to bottom cells is distinct;see the adjacent membrane analysis.

The gas scalar uses conservative cell-centredFV,backwardEuler,upwind advection andcentral diffusion. Interpolated face fluxes are projected to discrete incompressibility;baseline correctionL2 is1.54%. Inlet concentration steps to1 from initial0;outlet isconvective with no diffusiveflux;walls andliquid areimpermeable. D5/10/20mm²/s are unmeasured VOC sensitivity assumptions. Maximum relative mass-ledger error8.65e-12;1D analytic mean-concentration error0.000246;baseline t90 changes+1.70% ongridrefinement and−0.20% with halveddt. These are numerical checks,not fullgrid independence or physical validation.

Paper-style figures have separate bilingual notes indexed byFigure_Guide. Every offline3D point comes fromhole_sweep.csv. Browserinteraction was not tested;source/data/rotation-math checks are reported separately. Gas concentration does not establish liquid uptake,PDMS transfer,cellresponse,filters or externaltubing behaviour.

Method background:[NIST FiPy conservation equation](https://pages.nist.gov/fipy/en/latest/numerical/equation.html),[cell-centred finitevolume](https://pages.nist.gov/fipy/en/master/numerical/discret.html). This customimplementation does not useFiPy or implyNIST validation.


For the added fixed-STL flow-rate selection, see [Gas operating conditions](Flow_Operation_EN.md). The1-mL/min results above remain the baseline.
