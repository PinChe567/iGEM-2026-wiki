# 01_parameter_sweep · Optical power sensitivity

## Publication caption

Conditional received green power for 24 optical cases. Bars are means and error bars are one Monte Carlo standard error across three seeds; they are not confidence intervals for device performance.

## Generation and assumptions

Each seed launches 24,000 excitation packets and 60,000 weighted fluorescence packets. The original 24-case sweep totals 6,048,000 packets. Powers assume 500 µW LED-on excitation, a 20 µm bottom absorbing layer, excitation absorption 0.5/mm, and quantum yield 1. This figure reuses the frozen optical calculations.

## Results

The reference NE result is 0.593 ± 0.035 nW. Changing PD placement, seal, scatter or filter assumptions changes collected power; an increase alone does not establish better well isolation or biological sensitivity.

## How to read: axes and legends

Horizontal axis: received green optical power, nW. Vertical labels: case names matching parameter_sweep.csv. Green bars: seed means; black horizontal marks: ±1 SE. Read relative changes together with their uncertainty, then inspect the named parameter in run.py.

## Limitations

All values are model outputs. Only three seeds are used; geometry, material and biological uncertainty are not represented by these bars. The PCB substrate is a lower loss boundary, and real detector/filter angular response is unmeasured.

## Data and reproduction

results/parameter_sweep.csv; results/summary.json; results/<case>.json; run.py; transport.py

```text
python run.py --plots
```
