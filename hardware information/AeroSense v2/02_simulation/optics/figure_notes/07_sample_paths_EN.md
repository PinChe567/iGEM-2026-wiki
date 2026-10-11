# 07_sample_paths · Selected NE optical paths

## Publication caption

A cutaway rendering of actual sampled NE excitation and fluorescence trajectories. Selected detected fluorescence paths are emphasized; line density is not optical intensity.

## Generation and assumptions

Read the saved deterministic animation_paths.json. Display contiguous visible segments only, with no artificial connection across clipped excursions. The central carrier is a cutaway; roof, compression plate and outer walls are removed for visibility.

## Results

There are trajectories from LED through the well to the finite off-center PD. This does not imply uniform illumination or sufficient biological signal. The purple PD cross is at the provisional active center (0,−0.4,40.5) mm.

## How to read: axes and legends

Blue lines: excitation; green lines: fluorescence. NE/NW/SW/SE are well labels. x/y/z triad arrows are each 2 mm. The view is an oblique projection, not an equal-scale 2D slice. The marked PD position is an optical datum rather than the package center.

## Limitations

Only NE trajectories are shown; none are mirrored to stand in for other LEDs. Path selection deliberately makes rare detected rays visible, so counting lines cannot estimate collection efficiency. This is not a manufacturing drawing or time-of-flight simulation.

## Data and reproduction

results/animation_paths.json; publication.py path_figure()

```text
python run.py --plots
```
