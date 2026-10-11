# Simulations: figures, movies and individual notes

Start with the [figure and movie gallery](INDEX_EN.html). Figures retain titles, panel letters, axes and legends. Captions and individual Markdown notes contain the detailed explanation.

| Area | Content | Entry |
|---|---|---|
| Optics | Ideal and interfered signals, overlay, residuals, frequency recovery and parameter sweeps | [Figure Guide](optics/Figure_Guide_EN.md) |
| Airflow | Velocity, hole diameter/pitch/position sweep, interactive3D plot and transient gas concentration | [Figure Guide](airflow/Figure_Guide_EN.md) |
| PDMS/liquid | Membrane thickness and transport sensitivity, water-vapor/oxygen limits, and liquid-column delivery | [Figure Guide](membrane/Figure_Guide_EN.md) |

Each `figure_notes` directory contains separate English and Chinese notes per figure: publication caption, methods, results, interpretation, axes and legends, data provenance and reproduction command. Plotting programs rebuild the figures; after changing a model, also check and update the accompanying explanations.

## Three separate questions

1. **Has the analyte reached the gas space above the well?** Read gas advection–diffusion results. Slowly moving velocity markers do not imply absent molecular diffusion.
2. **Has it reached the cells at the bottom?** The user confirms bottom-adherent cells with100 µL per well. The4×2.8 mm internal cross-section gives approximately8.93 mm liquid depth. Gas arrival is not cell exposure; liquid transport assumptions and experiments must be considered separately.
3. **Can the optics resolve a fluorescence change?** Monte Carlo collection and conditional detector-signal comparisons are predictions. Actual LED power, filter performance, detector response, electronics noise and cell responses remain unmeasured.

PDMS hydrophobicity does not establish a water-vapor barrier. The membrane study uses declared transport-property assumptions and sensitivity ranges. An unmeasured mixing ratio cannot be converted into a known permeability. Adding the membrane study does not add PDMS to the selected operating assembly or mandatory purchase list.

## Reproduce

Each area's README and Figure Guide describe dependencies and replay commands. Rebuild each area, run `python build_gallery.py` here, then run `python prepare_release.py` in the package root to update the manifest and ZIP. Do not relabel synthetic signals, assumed properties or numerical results as measurements.
