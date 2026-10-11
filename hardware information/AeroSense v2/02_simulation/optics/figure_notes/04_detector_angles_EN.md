# 04_detector_angles · Detector angular acceptance

## Publication caption

Cumulative NE green power admitted by artificial detector acceptance cones. Points are three-seed means with ±1 SE.

## Generation and assumptions

Detected packet arrival directions are post-filtered at half-angles 20°, 30°, 45°, 65° and 90°. This does not reroute rays or assert that the real detector has a sharp cone cutoff.

## Results

Collection rises as oblique rays are admitted. The graph shows why an on-axis filter specification is insufficient for this geometry.

## How to read: axes and legends

Horizontal axis: acceptance half-angle relative to the PD normal, degrees. Vertical axis: cumulative received green power, nW. Green line/points: means; black vertical bars: Monte Carlo SE. At 90° all top-surface arrivals are retained.

## Limitations

The PD uses a 7.5 mm² equal-area proxy, offset (0,−0.4) mm. Real active-area shape, package optics and spectral/angular response remain unmeasured; the curve is a diagnostic, not a component specification.

## Data and reproduction

results/ideal_NE.json; green.angular_power_nW

```text
python run.py --plots
```
