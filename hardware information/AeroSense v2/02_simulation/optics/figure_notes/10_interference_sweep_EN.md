# 10_interference_sweep · Interference and noise sensitivity

## Publication caption

A/B summarize worst-channel complex error and lowest-channel median SINR at electronic RMS 5 pW/sample and assumed responsivity ratio 0.8. C varies electronic noise; all panels also include assumed photoelectron shot noise.

## Generation and assumptions

The full sweep has 144 scenarios: four excitation-rejection settings, four ambient cases, three electronic RMS levels and three responsivity ratios. Each has 32 deterministic-seed noise repetitions. MC means stay fixed; only Poisson counts and electronic noise vary.

## Results

Greater excitation rejection reduces the excitation-leakage term, but cannot remove ambient light at a modulation frequency. DC affects raw waveform error without necessarily biasing the fitted AC coefficients. A higher noise-only SNR does not remove systematic leakage bias.

## How to read: axes and legends

A/B columns: excitation OD, with ∞ denoting zero excitation leakage; rows: none, DC, 100.3 Hz flicker, or 67 Hz coherent ambient. A color/numbers: maximum across four channel mean complex errors, percent. B: minimum channel median SINR, dB. C x: electronic RMS pW/sample; y: repeat-to-repeat noise-only vector SNR, dB; colored curves identify LED frequencies.

## Limitations

R520=0.3 A/W and R470/R520=0.6/0.8/1 are assumptions. No ranking is a measured optimum. Electronic noise and ambient cases are illustrative, MC uncertainty is not propagated, and the chosen sample-hold photon model omits true PWM-edge integration and analog filtering.

## Data and reproduction

results/interference_sweep.csv; results/interference_sweep_replicates.csv; results/interference_sweep_summary.json

```text
python run.py --plots
```
