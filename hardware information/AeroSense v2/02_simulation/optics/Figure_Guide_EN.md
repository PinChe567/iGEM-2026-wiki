# Optical figure and movie guide

Each artifact has its own detailed bilingual note. Figures intentionally contain only titles, panel labels, axes, legends and data annotations. Read the caption and assumptions before using a figure in a paper or wiki.

- [01_parameter_sweep · Optical power sensitivity](figure_notes/01_parameter_sweep_EN.md)
- [02_floor_maps · Cell-floor irradiance and collection](figure_notes/02_floor_maps_EN.md)
- [03_well_transfer · Cell-layer optical transfer](figure_notes/03_well_transfer_EN.md)
- [04_detector_angles · Detector angular acceptance](figure_notes/04_detector_angles_EN.md)
- [05_frequency_recovery · Four detector-signal comparisons](figure_notes/05_frequency_recovery_EN.md)
- [06_conditional_budget · Conditional noise threshold](figure_notes/06_conditional_budget_EN.md)
- [07_sample_paths · Selected NE optical paths](figure_notes/07_sample_paths_EN.md)
- [08_volume_standard_validation · Uniform-volume standard transfer](figure_notes/08_volume_standard_validation_EN.md)
- [09_interference_metrics · Spectral and four-channel errors](figure_notes/09_interference_metrics_EN.md)
- [10_interference_sweep · Interference and noise sensitivity](figure_notes/10_interference_sweep_EN.md)
- [optical_slow_motion · Synchronized optical movie](figure_notes/optical_slow_motion_EN.md)

The original geometric MC and the conditional detector model are different evidence layers. Reflected green light remains useful fluorescence; parasitic blue light can share exactly the same LED frequency. Ambient, responsivity and both noise sources are declared assumptions. No plot here establishes real PCB accuracy or cell sensitivity.

Full rebuild, from this folder:
```text
python run.py --verify --run --maps --convergence --standard --workers 4
python leakage_sweep.py --workers 4
python run.py --plots --video --ffmpeg C:/path/to/ffmpeg.exe
python validate_publication.py
```
