# 05_frequency_recovery · Four detector-signal comparisons

## Publication caption

A: ideal noise-free received fluorescence. B: conditional received signal including MC excitation leakage and assumed ambient, photoelectron shot noise and electronics noise. C: overlay. D: received minus ideal.

## Generation and assumptions

Four independent OD3 MC green/leakage gains feed 25%-duty 89/113/41/67 Hz gates in NE/NW/SW/SE order. The default has R470/R520=0.8, R520=0.3 A/W, ambient 0.15+0.05 cos(2π100.3t+0.4) nW equivalent, and electronic RMS 0.005 nW. Poisson counts use a discrete 250 µs bin with its gate held at the sampled state; PWM-edge fractions are not integrated.

## Results

Over the full two seconds, RMSE is 0.17631 nW, DC residual 0.17155 nW and AC residual RMS 0.04067 nW. The waveform AC SINR is 23.40 dB. These quantify the chosen scenario, not hardware accuracy.

## How to read: axes and legends

All x axes show time, ms, for the first 120 ms. Y axes show green-equivalent nW; A/B/C use the same limits while D has its own scale. Green is ideal, orange is received, purple is residual. The ideal trace retains useful reflected green fluorescence and the modeled well mixing.

## Limitations

Ambient/noise/responsivity are assumptions, not measurements. nW equivalent is not measured optical-only power or ADC voltage. The residual is not purely reflection: it includes leak, ambient, shot noise and electronic noise. No cell activation dynamics, TIA bandwidth, saturation, dark current or timing jitter are modeled.

## Data and reproduction

results/frequency_traces.npz; results/frequency_summary.json; results/leakage_MC_summary.json; signal_model.py

```text
python run.py --plots
```
