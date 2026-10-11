# Membrane and liquid-transport screening

Read `Analysis_EN.md` first. This module does not modify the eight selected STLs or install PDMS in the current build. It screens an optional future PDMS film and the confirmed 100 µL bottom-cell transport path.

From this folder, with Python 3.11+:

```text
python -m pip install -r requirements.txt
python run.py --plots
```

This reruns analytical verification, 243 membrane conditions, 108 liquid-mixing/feed conditions, 25 interface-resistance conditions, depth/oxygen/selectivity calculations and seven figures. `python plot.py` redraws figures from existing CSVs. Numerical calculations are deterministic; rendering fonts may differ between computers. The source uses NumPy and Pillow, with no paid solver, downloaded model or hidden geometry cache. Runtime depends on the computer; there is no fitted biological dataset.

| File/folder | Purpose |
|---|---|
| `model.py` | Conservative layered diffusion/partition solver and exact slab solution |
| `run.py` | Explicit assumptions, sweeps, checks and CSV/JSON generation |
| `plot.py` | All figure-generation code |
| `couple_gas_history.py` | Prescribed rim concentration history; one-way coupling only |
| `integrate_airflow.py` | Executed NE-rim CFD chain and explicitly assumed continuation bounds |
| `results/summary.json` | Key numerical results and evidence boundary |
| `results/validation.json` | Analytical/convergence checks |
| `results/*.csv` | Complete sweep and time-history tables; blank times are censored |
| `figures/` | Seven publication-style figures with brief labels |
| `Figure_Guide_EN.md`, `figure_notes/` | Full figure explanations in both languages |
| `captions.json` | Bilingual captions indexed by PNG filename |
| `sources.json` | Input provenance and primary source links |
| `templates/` | Blank experimental records, no fabricated measurements |
| `decision.json` | PDMS is not selected for the current build |

Change `run.py` sweep lists and explicit assumptions, or call `model.well()` with documented SI values. Do not assign a species or formulation to a D/K pair without data. The default generic case is D_PDMS=10⁻¹⁰ m²/s, K_PDMS/gas=100, D_liquid=10⁻⁹ m²/s and K_liquid/gas=10; these are assumptions, not measured properties of a named VOC.

To apply a gas-CFD or measured rim history:

```text
python couple_gas_history.py --csv PATH_TO_CSV --time time_s --column RIM_COLUMN
```

The CSV must start at time zero, increase strictly, and contain nonnegative concentrations normalized to a common gas reference. Use a well-mouth/rim value, not a headspace or near-liquid average, because this solver already includes the headspace. A gas CFD run with no uptake does not become a self-consistent membrane/liquid solution by exporting its history. No t90 should be inferred beyond a short source history.

Current conclusion: slow gas streamlines do not eliminate molecular diffusion; the 8.93 mm stagnant-liquid path can impose hours of delay under the stated assumptions. This is a test priority, not a measured response-time guarantee. PDMS is not assumed to block water vapor or guarantee oxygen supply.

The delivered gas-CFD baseline has also been propagated through the no-film and nominal 100 µm examples. Reproduce it with `python integrate_airflow.py`; it reads the sibling airflow module's `gas_transport_results/shelf_w8_e0p2_D10_dx0.4_dt0.5.csv`. The supplied CFD ends at 300 s. The separately named continuation CSV holds its final rim value or sets the rim to one thereafter as explicit scenarios; it does not contain extended CFD. See `results/CFD_rim_coupling_summary.json`. Re-running `run.py --plots` does not automatically regenerate this cross-module analysis.
