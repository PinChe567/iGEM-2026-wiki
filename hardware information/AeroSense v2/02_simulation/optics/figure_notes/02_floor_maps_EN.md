# 02_floor_maps · Cell-floor irradiance and collection

## Publication caption

A: upward excitation power transmitted across the resin–liquid floor under NE illumination. B: isotropic point-source power reaching the PD. Each row shares one color scale across all four wells.

## Generation and assumptions

The floor field uses 600,000 excitation packets and scores after Fresnel transmission, not resin-side incidence. Collection uses 224 source positions, each with 65,536 packets. Pixels are 0.5 × 0.4 mm. SE and Wilson 95% bounds are saved with the collection map.

## Results

NE mean floor irradiance is 4.366 µW/mm² and spatial CV is 46.2%. Median relative collection-map SE is 17.3%. Flatness therefore does not imply uniform excitation.

## How to read: axes and legends

Each map uses mirrored local x=1.3–5.3 mm and y=1.25–4.05 mm. A color bar: µW/mm²; B color bar: percent of emitted source power. NE/NW/SW/SE identify wells. Compare corresponding locations using the shared scales; the maps are not separately normalized to 100%.

## Limitations

Directional floor irradiance is not all-direction fluence. Finite Monte Carlo noise contributes to spatial variation. A zero-count region is not proof of zero coupling. Tissue-photometry fluence images use different geometries and scoring quantities.

## Data and reproduction

results/spatial_maps.npz; results/maps_summary.json; run.py maps()

```text
python run.py --plots
```
