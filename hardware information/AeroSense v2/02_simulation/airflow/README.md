# Gas flow and gas delivery

This model screens chamber geometry and operating flow. It solves gas velocity and gas concentration. It does not establish cell shear, viability, dissolved VOC exposure or GCaMP activation.

**Current candidate:** the wide inlet shelf, `shelf_w8_e0p2`. It reduces downward gas momentum at the well mouths while keeping a simple, accessible geometry. It is an engineering tradeoff, not a global optimum. The conditional operating candidate is approximately **3 mL/min**, subject to physical measurement.

Open the [airflow movie](videos/airflow_comparison.mp4). Read the figures and limitations below before interpreting moving markers as sample delivery.

## Files and reproduction

- `code/`: Python and C# sources, Windows compiler helper and requirements.
- `code/data/`: necessary JSON configurations, numerical records and NPZ velocity/concentration fields. Subgroups preserve the original solve identities. These are inputs for fast offline reproduction, not disposable cache.
- `results/`: CSV summary tables and convergence histories. Gas and operating concentration histories have their own subgroups.
- `figures/`: seven static scientific figures.
- `videos/`: one MP4. Interactive HTML, compiled executables, repeated reports, log files and movie screenshots are omitted.

From this folder, redraw all seven figures without running CFD:

```text
python -m pip install -r code/requirements.txt
python -B code/reproduce.py
```

Add `--video` to regenerate the MP4. Imageio-ffmpeg supplies the encoder. An optional `--ffmpeg PATH` selects another executable.

To rebuild the complete solver pipeline on Windows:

```text
python -B code/reproduce.py --solve --video
```

This command compiles the included C# sources with the Windows .NET Framework compiler. It can be expensive. Existing compatible converged velocity records are reused. To force a selected velocity recomputation, run `python -B code/run_flow.py --case CASE --force`. The NumPy engine is available through `--engine numpy`; it is slower. The full replay helper selects the C# engine.

Individual stages are available:

```text
python -B code/hole_sweep.py --run --refine
python -B code/gas_transport.py --run --checks
python -B code/operating_sweep.py --run --checks --refine --selected-checks
```

The solvers use analytic geometry in `run_flow.py`. They do not import STL files or require CAD software. The shelf bounds are x=-7.4 to -0.2 mm, y=-4 to 4 mm and z=58.2 to 59.4 mm. Update the model explicitly if the printed geometry changes. The external CAD remains the source for manufacturing, not a runtime dependency.

## Geometry study

The baseline uses a 100 µL liquid reference in each 4 × 2.8 mm well. The liquid depth is 8.929 mm. The gas gap to the well rim is 3.571 mm. This is a modeling reference, not a validated physical working volume.

Velocity is solved with D3Q19 BGK lattice Boltzmann, rigid no-slip walls and a stationary no-slip liquid boundary. The model is isothermal and nearly incompressible. Screening fields are normalized to 1 mL/min. There are 18 original geometry cases, plus mesh, operating-flow and tube checks. The original velocity result group contains 28 solves.

The selected shelf reduces worst well-mouth downward momentum by approximately 30.9%, 30.1% and 36.1% on 0.4, 0.3 and 0.2 mm grids. Gas-circulation symmetry becomes worse. The results do not establish grid-independent absolute local velocities. A separate near-1 mL/min calculation checks the operating scale. The tube benchmark and independent NumPy/C# comparison are recorded in `code/data/validation.json`.

The perforated study uses 18 actual solved geometries. Hole diameter is 1.2/1.8/2.4 mm, pitch is 3.6/4.2/4.8 mm, and plate height has two values. Six holes remain fixed. Pitch therefore changes spacing, not total hole count or global hole density. Two designs have finer-grid checks. The coarse minimum momentum ratio is about 0.0246 relative to open; its fine-grid value is about 0.0351. Some perforated designs increase momentum. This study did not change the selected manufacturing geometry.

## Gas-species delivery

Conservative finite volume uses upwind advection, centered diffusion and backward Euler. Face fluxes are projected to satisfy discrete conservation. The inlet concentration steps from zero to C/Cin=1. The outlet has convective transport and zero diffusive flux. Solid surfaces and the liquid interface have no uptake.

Gas diffusivities of 5, 10 and 20 mm²/s are sensitivity assumptions. They are not an identified VOC property or an adjustable pump control. Nine scalar cases and a one-dimensional diffusion benchmark are preserved. Mass balance, uniform-field residual and concentration bounds are saved with each case.

At 1 mL/min, near-liquid gas P95 speeds are roughly 0.00049–0.00093 mm/s. For D=10 mm²/s, the local gas-gap Peclet number is about 0.00018–0.00033. Diffusion matters even when velocity markers barely move. The selected-shelf NE gas response reaches t90 around 149 s. The approximately 1.276 s local gap diffusion scale does not include transport through the inlet and plenum. Neither value is a cellular response time.

The membrane model can use the saved NE rim history through [its coupling script](../membrane/code/integrate_airflow.py). This is one-way coupling. Gas CFD has no liquid sink and is not recomputed after uptake is added. See the [liquid/membrane README](../membrane/README.md).

## Operating flow study

The first stage uses Q=0.25/0.5/1/2/5 mL/min and D=5/10/20 mm²/s. Q=2.5 and 3 mL/min were added to resolve the bracket around a provisional 60 s gas t90 target. There are 21 operating cases, six scalar numerical checks and one direct near-5 mL/min velocity check.

The selection rule chooses the lowest sampled flow satisfying all three provisional conditions: worst-well/worst-D gas t90 ≤60 s, port Re ≤3, and near-liquid gas P95 speed ≤0.01 mm/s. The speed cap is an engineering comparison value, not a cell-safety threshold.

| Q, mL/min | Worst gas t90, s | Near-liquid gas P95, mm/s | Port Re |
|---:|---:|---:|---:|
| 0.25 | 549.592 | 0.000234 | 0.147 |
| 0.5 | 299.092 | 0.000467 | 0.295 |
| 1 | 149.546 | 0.000934 | 0.589 |
| 2 | 75.072 | 0.001869 | 1.179 |
| 2.5 | 60.036 | 0.002336 | 1.474 |
| 3 | 49.998 | 0.002803 | 1.768 |
| 5 | 31.953 | 0.004672 | 2.947 |

Q=2.5 mL/min gives about 60.04 s. Its nominal 0.04 s miss is smaller than numerical sensitivity. It is not proven physically inadequate. Q=3 mL/min gives about 50 s and provides more model timing margin. Connecting lines in the Pareto plot connect sampled cases; they do not certify intermediate flow settings.

The main scalar grid is 0.4 mm. Time steps are 1 s at Q≤0.5, 0.5 s at Q=1/2 and 0.25 s at Q≥2.5. End time is max(150,300/Q) s. Refinement checks change mesh, time step and the high-flow velocity field. `code/data/operating_sweep_summary.json` retains each numerical difference. Repeated Q=1 cases agree with prior gas histories within roundoff. Concentrations were not clipped to improve the figures.

Use one regulated downstream suction pump and measure flow through the complete assembled path. In a sealed steady series path, inlet and outlet mass flow are equal. At the same pressure and temperature, Qin is approximately Qout. Independent pumps with unequal setpoints cause pressure storage or compensating leakage, neither of which is modeled.

The computed pressure drop covers the chamber and short modeled ports. It excludes filters, external tubing and connectors. It cannot alone specify a pump. First use a cell-free water surrogate at low flow. Confirm an open outlet, no visible liquid displacement and no leaks. Measure actual flow with all intended filters and tubing installed. A UI flow entry is a record, not a flow controller or proof of achieved flow.

## Figures and movie interpretation

| Figure | Read it as |
|---|---|
| [Design comparison](figures/design_comparison.png) | Original cases: downward momentum ratio, near-liquid speed ratio and chamber pressure drop at 1 mL/min. Lower is not automatically biologically safer. |
| [Mesh sensitivity](figures/mesh_and_tradeoff.png) | Shelf/open momentum and speed ratios against grid spacing. Residual mesh sensitivity remains. |
| [Velocity sections](figures/velocity_sections.png) | Open, perforated and selected-shelf gas-speed sections. Color is logarithmic mm/s. |
| [Hole sweep](figures/hole_sweep.png) | Eighteen perforated designs and refinement checks. Parameter effects come from new CFD solves. |
| [Gas delivery](figures/gas_delivery.png) | Normalized gas concentration histories and diffusion sensitivity. The liquid does not absorb. |
| [Operating delivery](figures/operating_delivery.png) | Worst-well t10/t50/t90 versus Q and assumed D. Color shows logarithmic seconds. |
| [Operating tradeoff](figures/operating_pareto.png) | Worst-well/worst-D t90 versus near-liquid gas speed. The ring marks the conditional Q=3 candidate. |

The movie is 240 frames at 12 fps: 20 s playback represents 60 s physical advection. Panels A–C use RK2 trajectories in steady 1 mL/min velocity fields with dt=0.02 s. Markers are seeded in the inlet, plenum and four headspaces. There are 400 markers per case. Marker color is speed, not concentration. Wall crossings are rejected; markers leaving the outlet are reseeded at the inlet. Reinjection jumps are not drawn. Panel D separately displays the finite-volume gas concentration history for D=10 mm²/s. No liquid, cell motion or Brownian molecular trajectory is shown.

## Limitations and scientific records

No turbulence, aerosols, evaporation, sterility, adsorption, dissolved transport, cell protection or odor uniformity is established. All wells share a gas path. Low gas momentum is not measured cell shear. The printed surface and port geometry are approximated on stair-step grids. Material compatibility and external plumbing require physical verification.

Keep `code/data/geometry_and_cases.json`, the three operating configuration JSONs, `selection.json`, numerical summaries and all field NPZs with this code. CSV `raw_json` entries resolve relative to the CSV's directory. References inside summary JSON remain relative to `code/data/`.

## 中文重點

此模型只計算氣體速度與氣相濃度，不代表細胞受力、安全性或 GCaMP 反應。寬入口台階是流向、清潔性與低零件數的工程取捨；沒有宣稱全域最佳。100 µL 是模型參考液量，並非已驗證實體井可用體積。

主候選流量約 3 mL/min，最差假設下氣相 t90 約 50 秒。2.5 mL/min 約 60.04 秒，差 0.04 秒小於數值敏感性，因此不能說實物一定不合格。液體中的傳輸通常更慢，請另讀膜／液體模型。

使用一個下游可調泵，實際量測整條管路流量。入口與出口在同壓溫穩態下流量應相同。不能拿模型內很小的氣室壓降直接選泵，也不能把 UI 填入的流量當成硬體已控制成功。

影片移動點表示穩態速度場上的示蹤軌跡，顏色是速度而非氣味濃度；右下角才是獨立求解的氣相濃度。`code/data` 的 JSON/NPZ 是快速重現必要資料。一般只需執行 `python -B code/reproduce.py` 重畫，不需要重跑昂貴 CFD，也不需要外部 CAD。
