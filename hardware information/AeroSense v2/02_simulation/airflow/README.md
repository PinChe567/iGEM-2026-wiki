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

