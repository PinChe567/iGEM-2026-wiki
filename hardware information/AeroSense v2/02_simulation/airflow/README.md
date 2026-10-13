<<<<<<< HEAD
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
=======
# AeroSense airflow | 氣流分析

**Read `Airflow_Analysis_ZH.md` or `Airflow_Analysis_EN.md` first.** The selected geometry is an integrated wide inlet shelf, not a perforated plate or a vertical wall. This is a manufacturing/cleanability/flow-direction trade-off, not a biologically proven optimum.

先讀中英文分析。選定版是「入口下方寬台階」，不是孔板或直立擋板；最佳化指標與代價都有保留，沒有宣稱細胞保護或均勻氣味濃度。

## Paper figures and added studies / 論文圖與新增計算

`Figure_Guide_ZH.md` / `Figure_Guide_EN.md` index a separate bilingual Markdown note for every figure, movie poster, MP4 and interactive HTML. Each note contains the publication caption, method, result, axes/legend, reading instructions, source data and limitations. Images contain only short titles, panel names, axes and legends. `captions.json` contains reusable captions keyed by artifact basename.

原始28次速度求解及18種異質幾何保留不變；另有真正的18組孔板掃描與2次細化。孔徑、節距、板高度各自變化；固定六孔，因此「節距」不是全板孔密度。`hole_sweep_3d.html`是無需網路的互動散點圖，資料是`hole_sweep.csv`；每個點均有實際求解與原始JSON。

The original28 velocity solves are preserved. The additional18-point factorial hole sweep and two refined cases are in `hole_sweep_results/`; the fixed six-hole layout varies diameter, pitch and elevation. Pitch is not global hole-count density. `hole_sweep_3d.html` is self-contained and offline; hover points for raw-case links. Node/data tests are provided; browser interaction was not verified in this session.

`gas_transport.py` adds nine 3D gas-only scalar calculations and a separate1D analytic benchmark, using saved velocities and SciPy sparse implicit solves. `gas_transport_results/` contains concentration histories, snapshots and mass ledgers. A gas cell may have tiny mean velocity yet receive VOC by molecular diffusion. The liquid surface is impermeable in this model: this does not predict arrival at bottom cells. Liquid/PDMS scenarios are in the adjacent `../membrane/` folder. `supplemental_summary.json` is the additional-work ledger; `validation.json` retains the original28-solve ledger.

## What is in this folder / 檔案用途

| File | Purpose / 用途 |
|---|---|
| `run_flow.py` | Geometry, 18 cases, actual CFD wrapper and NumPy reference stepping / 幾何與CFD求解 |
| `lbm_reference.py` | D3Q19 vectors, weights, equilibrium and macroscopic fields / 參考方程 |
| `LbmCoreFast.cs` | Fixed τ0.8 double-precision accelerator / 篩選求解器 |
| `LbmCorePhysical.cs` | Variable τ accelerator, near-operating-flow checks / 接近實際流量求解器 |
| `build_solver.ps1` | Build both C# programs using Windows .NET compiler / 本機編譯 |
| `geometry_and_cases.json` | Authoritative simulated dimensions and every candidate / 模擬幾何 |
| `selection.json` | Selected CAD solid coordinates, trade-offs and numerical evidence / CAD決策依據 |
| `results/` | JSON metrics, NPZ physical fields, convergence CSV, solver logs / 原始結果 |
| `sweep_summary.csv` | All18 geometry comparisons at0.4 mm / 全部掃參數結果 |
| `mesh_refinement.csv` | Open/shelf results at0.4,0.3,0.2 mm / 網格敏感性 |
| `validation.json` | Convergence, analytic tube checks, NumPy comparison, actual-flow checks / 數值檢查 |
| `analyze.py` | Rebuild selection, validation, mesh figure and bilingual reports / 重建報告 |
| `plot_and_video.py` | Rebuild comparison figures, field sections and trajectory video / 重建圖與影片 |
| `airflow_comparison.mp4` |20 s, 1600×1000, three cases,60 s simulated time / 氣流比較影片 |
| `video_metadata.json` | Timing, seed and integration details / 影片設定 |
| `figures/` | Publication figures and preview frames / 圖表及影片截圖 |
| `reproduce.py` | Full replay into a new directory, or replot supplied fields / 重現入口 |

## Replot supplied data / 用已提供資料重新畫圖

Install Python dependencies once (network needed):

```powershell
python -m pip install -r requirements.txt
python reproduce.py
python reproduce.py --video
```

If ffmpeg is already installed, the video accepts its executable path:

```powershell
python reproduce.py --video --ffmpeg C:\path\to\ffmpeg.exe
```

## Fresh full solve / 從零重跑

Supported full-replay platform: Windows with the .NET Framework C# compiler and Python3.11+. Source code is included; precompiled executables are not required. The NumPy solver can run individual cases on other operating systems, but the complete accelerated replay script here targets Windows.

```powershell
python reproduce.py --fresh-dir replay --video
```

`replay` must not exist. The script creates new files, compiles both solvers, computes18 cases, five refinement cases, two near-operating-flow cases and three benchmark/reference cases (28 solves), and creates reports/figures/video. It does not delete or overwrite an existing folder. Typical runtime is several minutes to tens of minutes depending on CPU. Repeated low-level calls reuse already-converged matching outputs; use the NEW-directory replay to force a fresh calculation.

The fresh replay also computes the18+2 perforated cases and gas scalar suite, then rebuilds all publication plots, HTML and notes. All component computations were executed; the final expanded fresh-directory wrapper has not been timed end-to-end. The standalone commands are:

```powershell
python hole_sweep.py --run --refine --workers 2
python gas_transport.py --run --checks
python supplemental_figures.py
python publication_notes.py
node test_interactive.cjs
```

Only the last test needs Node. All render/analysis Python dependencies are pinned in `requirements.txt`. Replotting supplied fields does not require rerunning CFD. Installing dependencies is separate from changing the prototype CAD; this folder exports no additional printable option.

單獨求解例子：

```powershell
python run_flow.py --case shelf_w8_e0p2 --dx .4
python run_flow.py --case open --dx .3 --engine numpy --tag-suffix _reference
```

Do not start two solver processes with the same case/grid/suffix; they share temporary filenames. Comparison plots require the complete delivered case set. The analytical tube test and C#/NumPy comparison test numerical implementation, not physical prototype performance.

## Field interpretation / 資料判讀

NPZ `xyz_mm` is the cell-center position; `velocity_m_s` and `pressure_Pa` correspond to the **actual solved** flow `Q_mL_min`. To obtain the plotted1 mL/min estimate, multiply velocity and pressure by `1/Q_mL_min`. Most sweeps solve at very low forcing. The two `near1mLmin` files solve approximately0.94 mL/min directly (τ0.55), then need only a small rescaling. Pressure is gauge pressure; external filters/tubing are omitted.

Geometry is a Cartesian staircase approximation. All28 original solves meet declared iterative convergence, but local quantities are **not grid independent**. Three grids consistently favor the wide shelf's downward-momentum proxy; the momentum reduction is30.9%,30.1%,36.1% across the three grids. Its inter-well gas-circulation symmetry becomes worse. The added scalar solves predict gas-only concentration under assumed diffusivity; no liquid/cell delivery, cell shear, toxicity, sterility, aerosol or biological activation is predicted.

Movie panelsA–C follow a steady field with RK2,dt0.02s and trilinear interpolation. Markers begin in the inlet,plenum and all four gas headspaces. Outlet markers are reinjected; the jump is excluded from traces. Marker colour is speed,not concentration. PanelD separately plots the computed scalar concentration. The movie does not display transient Navier–Stokes,turbulence,liquid motion or cellular response.

All codes and geometry in this subfolder were generated for the AeroSense prototype; method references are in the analysis reports. Do not cite the project-specific numbers as experimental measurements.

## Fixed-STL operating sweep / 固定STL的操作流量

Read [Flow_Operation_ZH.md](Flow_Operation_ZH.md) or [Flow_Operation_EN.md](Flow_Operation_EN.md) for the conditional flow choice, actual t10/t50/t90, numerical checks and a single-pump operating concept. The original 1 mL/min movie remains a baseline; it has not been relabeled as the new operating point.

Stage 1 uses five Q values × three assumed gas diffusivities (15 scalar cases). After Q2 and Q5 bracketed the provisional 60-s gas t90 target, a separate stage-2 config declares Q2.5 and Q3 across the same D values (six adaptive cases). Six scalar checks and one direct velocity check quantify timestep, grid and flow-scaling sensitivity. Earlier velocity/scalar files are preserved.

```powershell
python operating_sweep.py --run --checks --refine --selected-checks
python operating_figures.py
python publication_notes.py
node test_operating.cjs
```

The offline [operating explorer](operating_sweep_3d.html) uses Q and D as its two inputs and a computed time as the third axis. D is an uncertain species property, not a controllable setting. Exploring another t90 or gas-speed cap does not rewrite the report selection. Gas speed is not cellular shear, and gas arrival is not cellular activation. The full fresh-directory wrapper includes these cases; the expanded wrapper has not been replayed end-to-end after this extension.
## Gas delivery reference / 供氣文獻

Vergara et al. (2012), *Chemical gas sensor drift compensation using classifier ensembles*, doi:[10.1016/j.snb.2012.01.074](https://doi.org/10.1016/j.snb.2012.01.074), is added for controlled delivery and time/batch metadata. It does not validate this cell chamber's flow or gas t90. 本文引用用於受控供氣與漂移／批次紀錄；不是本氣室3 mL/min或HEK293T安全的實驗依據。完整引用與適用範圍：[中文](../../08_reference/Gas_Delivery_Reference_ZH.md)／[English](../../08_reference/Gas_Delivery_Reference_EN.md)。Saved simulations and the selected STL are unchanged.

>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0
