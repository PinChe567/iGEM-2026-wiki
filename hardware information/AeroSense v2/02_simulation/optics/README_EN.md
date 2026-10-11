# Optical simulation and publication figures

Start with [Figure_Guide_EN.md](Figure_Guide_EN.md). Each of the ten figures and the synchronized movie has a separate bilingual note under `figure_notes/`, including a publication caption, generation method, results, axes/legend, inputs and limitations. `captions.json` provides machine-readable English/Chinese captions. [Analysis_EN.md](Analysis_EN.md) contains the complete optical interpretation.

The evidence layers are deliberately separate:

- Frozen geometry MC: original 24 cases × 3 seeds, spatial maps and the volume-standard model.
- Additional per-LED rejection MC: 12 cases (four LEDs × OD3/4/5), each with three seeds, adding 3,024,000 packets. Each LED has its own excitation leakage; none inherits another LED's blue gain.
- Conditional detector model: 144 scenarios × 32 noise repetitions. Ambient, electronic noise, R520=0.3 A/W and R470/R520=0.6/0.8/1.0 are assumptions. Poisson photoelectron counts use a discrete sample-hold approximation, not exact integration across PWM edges or an analog TIA model.

The ideal trace retains all modeled green fluorescence, including useful reflected fluorescence. The residual contains excitation leakage, ambient, shot noise and electronics noise. It is incorrect to label every reflected photon as noise. Frequency separation does not remove contamination at the LED frequency. Model power, green-equivalent detector power and measured ADC voltage are different quantities.

## Reproduce

From this folder, with Python 3.11 and the pinned requirements:

```text
python -m pip install -r requirements.txt
python run.py --verify --run --maps --convergence --standard --workers 4
python leakage_sweep.py --workers 4
python run.py --plots --video --ffmpeg C:/path/to/ffmpeg.exe
python validate_publication.py
```

To use the supplied MC results and rebuild only figures, derived signals, captions and reports:

```text
python run.py --plots
```

To rebuild the movie, add `--video --ffmpeg PATH`. Without ffmpeg, a GIF is generated; MP4 requires the supplied executable. MP4 frames stream directly to the encoder and GIF frames remain in memory: no public frame folder is produced. The 20-second MP4 and GIF both contain 200 frames at 10 fps, covering 0–199 ms plus the final frame interval, at 100× slow playback.

Every movie panel uses the same sample index, including frame zero. Only actual NE sampled paths are drawn; the four LED indicators use their respective gates. There are no mirrored paths or invented photon flight delays. `results/video_frame_alignment.json` records every frame's time, LED state and displayed sample.

## Code and outputs

| File | Role |
|---|---|
| `transport.py`, `run.py` | Original optical transport, parameter sweep and maps |
| `leakage_sweep.py` | Additional per-LED OD3/4/5 MC |
| `signal_model.py` | Ideal/contaminated comparison, decomposition, 144-scenario sensitivity and numerical checks |
| `publication.py`, `visualize.py` | Ten sparse figures and synchronized movie |
| `write_analysis.py`, `write_figure_guide.py` | Bilingual analysis and per-figure notes/captions |
| `validate_publication.py` | Replot/hash comparison, unchanged-MC check, caption coverage, timing and encoded-duration checks |
| `results/leakage_MC_summary.json` | Per-LED blue/green means, MC SE and packet counts |
| `results/frequency_traces.npz` | Ideal, received, residual, leakage, reflected excitation, ambient, shot/electronic noise |
| `results/interference_sweep*.csv` | 18,432 per-channel replicate records and 576 aggregate rows |
| `results/publication_validation.json` | Reproducibility and timing checks actually executed |

Fixed seeds and pinned NumPy reproduce numerical outputs; fonts can change image pixels on another OS. MC uncertainty is reported separately and is not propagated into the synthetic noise repetitions. No plot establishes a working PCB, adequate biological sensitivity or a measured detection limit. CAD source remains in `../../09_engineering_sources/CAD/`; physical geometry is unchanged by this figure update.
