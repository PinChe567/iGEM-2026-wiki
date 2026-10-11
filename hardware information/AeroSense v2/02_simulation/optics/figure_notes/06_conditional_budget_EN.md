# 06_conditional_budget · Conditional noise threshold

## Publication caption

Maximum lock-in amplitude RMS noise compatible with an engineering SNR target of five, for the stated optical model and quantum yield 0.6.

## Generation and assumptions

Scale the original ideal-filter NE green power by LED-on power and quantum yield. Multiply ΔF/F by the 25%-duty fundamental factor 2sin(π/4)/π≈0.450; divide the resulting amplitude change by five. The CSV also contains quantum yields 0.1, 0.3 and 1.

## Results

Stronger LED excitation and larger fractional response permit a larger noise budget in this linear model. This is a requirement on repeated demodulated amplitudes, not a measured detector noise level.

## How to read: axes and legends

Columns: LED-on radiant power, mW. Rows: ΔF/F, percent. Numbers/color: maximum amplitude RMS noise, pW; color is logarithmic. Every cell uses QY=0.6 and the same reference absorption assumption.

## Limitations

No inferred odor limit, phototoxicity limit or detection guarantee follows. This budget uses the original ideal-green-filter reference, whereas the conditional movie uses OD3-case green collection with emission transmission 0.9. Different reference powers are intentional and labeled here.

## Data and reproduction

results/conditional_photon_budget.csv; results/summary.json; publication.py budget()

```text
python run.py --plots
```
