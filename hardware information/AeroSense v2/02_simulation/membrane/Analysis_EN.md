# Molecular delivery and the proposed PDMS film

This is a **one-dimensional transport screening study**, separate from the three-dimensional gas-flow CFD and from biological response. The confirmed operating geometry is 100 µL in a 4 × 2.8 mm well, with HEK293T cells attached to the bottom. Thus the nominal liquid column is 8.929 mm and the gas space below the rim is 3.571 mm. The calculations do not establish actual cell exposure, viability, receptor response or GCaMP response time.

## Decision for the current build

Keep the current eight-part mechanical set as the experimental carrier. **Do not add PDMS to the selected build or mandatory BOM yet.** Neither the target VOCs nor their membrane/medium transport properties are established. The current carrier is not thereby validated for rapid gas-to-cell delivery: the deep liquid column is an unresolved transport constraint that should be measured before making a rapid-response claim. Thicknesses in this study are a research grid, not alternative print files.

PDMS can be useful as a selective permeation layer under a maintained concentration gradient. It is not a universal VOC-only gate. A membrane that admits a compound still allows it to equilibrate in a closed receiver; without a sink, this model's final downstream gas-equivalent concentration equals upstream concentration. Selectivity primarily affects delivery rate, transient composition and retention, not permanent rejection at equilibrium. The molecular target, interferents, humidity, acceptable delay and recovery criterion must therefore be defined first.

## What the literature supports

- Hydrophobicity describes wetting by liquid water. It does not establish low water-vapor transmission. Bian et al. measured water-vapor transport through 8–160 µm cross-linked PDMS films; the thinnest samples also showed that surface kinetics can invalidate simple inverse-thickness extrapolation. This material was not a certified match to the team's formulation. [Primary study](https://onlinelibrary.wiley.com/doi/10.1002/marc.202000682)
- Heo et al. measured evaporation and medium-osmolality changes through PDMS, including humidified incubation. Their conditions and cell systems differ from AeroSense; the paper supports checking water loss, not predicting AeroSense viability from it. [Primary study](https://pmc.ncbi.nlm.nih.gov/articles/PMC2605290/)
- PDMS admits oxygen and carbon dioxide. Firpo et al. report, at 293 K, oxygen permeability 2.8 × 10⁻¹³ mol m⁻¹ s⁻¹ Pa⁻¹ and diffusivity 3.1 × 10⁻⁹ m²/s. Their measured surface resistance also cautions against treating thin films as bulk-only barriers. These are reference data, not measurements of the proposed film. [Primary study, Table 1](https://www.mdpi.com/2073-4360/11/5/910)
- Small molecules can partition into PDMS, and solvent exposure can cause swelling. Retained analyte and later desorption can alter delivered pulses and create carryover; the magnitude is species- and condition-dependent. [Toepke and Beebe](https://pubmed.ncbi.nlm.nih.gov/17203151/), [Lee, Park and Whitesides](https://pubmed.ncbi.nlm.nih.gov/14640726/)
- Lue et al. measured toluene/nitrogen mixtures with two cross-linker formulations and concentration-dependent transport. This does not supply a universal 5:1 → 10:1 → 20:1 permeability law. We assign no diffusivity, permeability, selectivity or optimum to those ratios. [Primary study](https://www.sciencedirect.com/science/article/pii/S0376738809008783)

## Model and boundaries

For each layer, physical concentration is c = K u, where u is gas-equivalent concentration and K = c_layer/c_gas at equilibrium, using the same mol/m³ concentration units. Gas has K = 1. The equation is K ∂u/∂t = ∂(D K ∂u/∂x)/∂x. Interface fluxes conserve mass and use the sum of both half-cell diffusion resistances. Optional surface resistance adds 1/h at each PDMS interface; h uses gas-equivalent concentration units, m/s.

The ordered layers are optional PDMS at the well mouth, gas headspace, and liquid. Sidewalls are impermeable; the bottom has zero flux, representing an initially unloaded, non-consuming transport probe at the cell position. Initial concentration is zero and the upstream concentration steps to one. The reported bottom fraction is c_liquid/(K_liquid c_gas,input). Instantaneous partition equilibrium, dilute linear sorption, constant D and K, uniform cross section, no liquid convection, no binding, no chemical reaction and no cell consumption are assumed. A real surface meniscus, PDMS deflection, leaks and bypass around a film are excluded.

The default input is a step immediately above the well rim. It omits upstream tubing, filters and plenum wash-in and is therefore favorable with respect to arrival delay. A separate sensitivity replaces it with a perfectly mixed 0.8544 mL plenum supplied at 0.1, 1 or 10 mL/min, with four identical wells drawing from that reservoir. That approximate volume is the rectangular plenum minus the shelf; ports are excluded. This is a reduced model, not the CFD flow field. `couple_gas_history.py` accepts a measured/CFD rim history; it is one-way forcing and does not recalculate gas transport after absorption changes the boundary.

The finite-volume system is transformed to a symmetric operator and propagated by its matrix exponential. There is no finite time-step error for step forcing. The last liquid-cell value approximates the impermeable bottom and is checked by spatial refinement. `forced()` integrates a piecewise-linear upstream history analytically in time. All governing units are SI; plotted hours and µm are converted from seconds and metres.

## Inputs: measured geometry versus assumed properties

| Input | Values | Status |
|---|---|---|
| Well area / operating fill | 11.2 mm² / 100 µL | Current geometry and user-confirmed fill |
| PDMS thickness | 25, 50, 100, 250, 500 µm; plus no film | Hypothetical research grid, not a chosen membrane |
| VOC diffusivity in PDMS | 10⁻¹², 10⁻¹¹, 10⁻¹⁰, 10⁻⁹ m²/s | Broad sensitivity bounds; no species assignment |
| PDMS/gas partition K | 1, 10, 100, 1000 | Assumed dimensionless concentration ratios |
| Liquid/gas partition K | 0.1, 10, 1000 | Assumed; not a measured Henry coefficient |
| Molecular liquid D | 0.5, 1, 2 × 10⁻⁹ m²/s | Illustrative sensitivity, not a target-VOC measurement |
| Gas D | 10⁻⁵ m²/s | Screening assumption; zero convection in the 1D gas layer |
| Effective liquid D multiplier | 1, 10, 100 | Mixing sensitivity proxy, not a solved mixing flow |
| Surface h | Ideal equilibrium or 10⁻⁶–10⁻³ m/s | Assumed kinetic-resistance sensitivity |
| Horizon | 7 days | Numerical censoring limit; not a permitted cell incubation |

The generic VOC sweep is isothermal with no assigned chemical species or fitted temperature law; its D/K values are independent assumed inputs. Changing temperature requires corresponding measured properties. Only the separate oxygen example explicitly uses 293 K reference data. A water drying rate is not calculated: PDMS-water partitioning/permeability, relative humidity, temperature and external transfer resistance remain unknown.

## Main calculation results

For an ideal step fixed at the liquid surface and a stagnant, nonreacting liquid with an impermeable bottom, the exact series solution gives t10 = 0.130159 L²/D, t50 = 0.378748 L²/D and t90 = 1.031105 L²/D. These are concentration arrival times, not receptor/GCaMP timing.

| Assumed liquid D (m²/s) | t10 | t50 | t90 |
|---|---:|---:|---:|
| 0.5 × 10⁻⁹ | 5.76 h | 16.77 h | 45.67 h |
| 1 × 10⁻⁹ | 2.88 h | 8.39 h | 22.83 h |
| 2 × 10⁻⁹ | 1.44 h | 4.19 h | 11.42 h |

This is a serious **conditional bottleneck**, not a measurement that the actual device must take 23 hours. Convection, mixing, binding and species-specific solubility may change delivery. Faster gas flow above the well is not evidence that the liquid column has mixed. In the same analytical benchmark, the 3.571 mm gas layer at assumed D = 10⁻⁵ m²/s has t90 ≈ 1.315 s despite zero velocity: molecular diffusion remains active when advective tracers appear stationary.

At fixed cross section and D, the liquid diffusion time scales as fill volume squared. The 25 µL counterfactual gives t90 ≈ 1.43 h at D = 10⁻⁹ m²/s. It is a sensitivity result, not permission to lower the confirmed operating fill or an automatically selected new well. At 100 µL, multiplying effective liquid D by 100 reduces the no-film screening t90 to about 0.25 h; adding a nominal 100 µm PDMS film raises it to about 0.85 h. A membrane can become the limiting resistance once liquid transport is faster.

The full grid contains 243 conditions, including three no-film baselines. Seventy-four do not reach t90 within seven days; their CSV time is blank and the figure marks `>168 h`. Do not replace these with zero. Representative 100 µL, D_liquid = 10⁻⁹, K_liquid = 10 results are: no film t90 ≈ 22.85 h; 100 µm PDMS with assumed D = 10⁻¹⁰ and K = 100, t90 ≈ 23.39 h; the same film with a 1 mL/min finite-feed reservoir, ≈ 23.55 h. These examples identify sensitivities and do not identify an optimal commercial PDMS.

Intrinsic concentration permeability is P_c = D K in m²/s; bulk permeance is D K/L in m/s. Pressure-based permeability is P_p = D K/(R T) in mol m⁻¹ s⁻¹ Pa⁻¹. They must not be interchanged numerically. Intrinsic A/B flux selectivity under comparable maintained gradients is (D_A K_A)/(D_B K_B). Film thickness changes both permeances together in this bulk model and does not itself change that intrinsic selectivity. Surface kinetics, mixed sorption and swelling can break this simple result.

The bulk time lag L²/(6D) is not the bottom-cell t90. For 100 µm and D = 10⁻¹⁰ it is 16.67 s, while the liquid-column response remains hours. A 20-minute input pulse can also produce a delayed, broad bottom concentration peak after input has stopped. In the no-film example its peak is approximately 2.78% of the input equilibrium reference near 3.92 h. The plotted storage/pulse curves demonstrate reversible diffusion memory only; irreversible adsorption and receptor adaptation are not modeled. Increasing K increases both storage and permeability, so it does not universally increase response delay.

## Executed one-way chain from the gas CFD

`integrate_airflow.py` propagates the selected shelf case's NE-rim history (Q = 1 mL/min, assumed gas D = 10 mm²/s) through the 100 µL no-film and nominal 100 µm examples. The source CFD ends at 300 s; its rim t50 is 48.78 s and t90 is 149.02 s. The sampled plane is Z = 55.329 mm, used as a proxy for the nominal rim at 55.5 mm. The liquid-bottom fraction remains below a numerical reporting floor of 10⁻¹⁰ in both examples at 300 s. Tiny signed raw values are floating-point cancellation, not negative physical concentration or a validated detection limit.

For a transparent long-time comparison, two explicitly assumed continuations begin at 300 s: the rim immediately reaches one, or it remains at its final CFD value 0.991144. They bound future histories only if the future rim stays between those values. Relative to the original inlet reference, no-film t90 is 22.87–23.62 h and nominal-film t90 is 23.41–24.18 h. The immediate-to-one continuation adds about 67.3 s to the respective ideal-rim-step t90. The larger held-value shift includes the permanently lower boundary concentration; it is not entirely a gas wash-in delay. No 23-hour CFD has been run or implied.

This chain preserves the 1D solver's conservation for its prescribed boundary, but it is not a mass-conserving, two-way coupled gas–membrane–liquid simulation. The upstream CFD imposes an impermeable liquid boundary and is not recalculated after liquid or PDMS uptake. The example shows that the assumed deep stagnant liquid still dominates the time scale; it does not establish actual exposure or whole-device mass balance. Input hashes, assumptions, supplied-time histories and separate continuation histories are in `results/CFD_rim_coupling_summary.json` and the associated CSVs.

## Oxygen, carbon dioxide and water

The oxygen calculation is a capacity ceiling under assumed steady, stagnant transport. It uses the cited 293 K PDMS P/D, assumed liquid D = 2 × 10⁻⁹ m²/s, assumed surface dissolved oxygen 0.30 mol/m³ and gas oxygen partial pressure 21,278 Pa. At 100 µL, maximum supply to a zero-concentration bottom is about 0.75 pmol/s per well; a 100 µm film barely changes this example because liquid resistance dominates. The demand sweep 0.01–5 pmol/s is an assumed load, not a measured HEK293T respiration rate or a cell count. Above capacity, the zero-order stationary solution is infeasible; negative concentration is not reported as physical.

This does not establish safe oxygenation, CO2/pH balance or a 37°C culture condition. Medium composition, gas composition, cell number, respiration, mixing and target dissolved oxygen must be measured. Likewise, water-repellent PDMS can still lose water vapor. No film is promoted as a moisture barrier, sterile barrier, validated pressure seal or guaranteed analyte filter.

## Numerical checks and the minimum next evidence

The 128-cell standalone membrane test reproduces L²/(6D) within 0.00305%; the liquid-bottom t90 error versus the exact series is 0.000762%. In the representative coupled model, increasing liquid cells from 48 to 96 changes t90 by 0.00405%. The worst normalized mass-balance residual across the broad membrane sweep is about 2.17 × 10⁻⁵; all sampled concentrations stay within numerical tolerance of [0,1]. These checks validate the implementation under its assumptions, not the assumptions themselves. Full results are in `results/validation.json`, `membrane_sweep.csv` and `summary.json`.

Before adding a film, define one target VOC and one relevant interferent, the gas concentration units, humidity, temperature, formulation and acceptable delay/recovery. Use the blank measurement templates to record the actual film thickness and condition. Measure a no-film baseline and a film comparison with an independent concentration assay; GCaMP alone cannot separate transport, receptor sensitivity and optical effects. Measure the actual 100 µL bottom-delivery behavior first. A calibrated cell-free tracer can test liquid mixing, but a different molecule does not establish target-VOC partitioning or membrane selectivity. These are priorities, not an instruction to perform every point in the large simulated grid.

Keep the mechanical set unchanged while those data are obtained. If rapid bottom exposure is not achieved, liquid-path redesign or verified mixing must be considered before presenting a rapid biosensor. Adding PDMS without resolving that bottleneck is not supported by these results.
