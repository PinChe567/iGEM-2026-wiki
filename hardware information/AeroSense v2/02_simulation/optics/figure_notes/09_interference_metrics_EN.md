# 09_interference_metrics · Spectral and four-channel errors

## Publication caption

A: ideal/received amplitude spectra. B: signed amplitude bias and complex relative error after joint four-frequency demodulation. C: signal-to-error ratio including systematic contamination and random noise.

## Generation and assumptions

Use the full 8,000-sample record. FFT amplitudes are 2|FFT|/N after mean removal. Joint least squares fits an intercept plus sine/cosine pairs at all four LED frequencies. Complex coefficient C=cosine−i sine; error ΔC=Creceived−Cideal.

## Results

In NE/NW/SW/SE order, amplitude biases are 2.78%, 2.63%, 3.28%, 3.52%; error-inclusive SINR values are 31.12, 31.61, 29.67, 29.07 dB. Detecting all four frequency peaks therefore does not establish uncontaminated fluorescence.

## How to read: axes and legends

A x: Hz, y: log amplitude nW equivalent, plotted down to 10^-5; lower values are visually floored only. Green ideal/orange received. B x: LED frequency, y: percent; orange amplitude bias, purple |ΔC|/|Cideal|. C y: 20log10(|Cideal|/|ΔC|), dB. This is SINR/error ratio, not noise-only SNR.

## Limitations

Ambient and both noise sources are synthetic. Positive amplitude bias does not mean a real cell response. Same-frequency excitation leakage survives demodulation; reflected green fluorescence remains in the desired comparator. Scalar amplitude subtraction is not equivalent to complex background correction.

## Data and reproduction

results/frequency_recovery.csv; results/frequency_traces.npz; results/frequency_summary.json

```text
python run.py --plots
```
