# 03_intrinsic_PDMS

![03_intrinsic_PDMS](../figures/03_intrinsic_PDMS.png)

## Publication caption

Bulk solution–diffusion screening over25–500µm, not a selected film. (A) Time lag L²/(6D) for assumed PDMS diffusivities. This lag is not bottom-cell t90. (B) Concentration-based permeance DK/L at D=10⁻10m²/s and four assumed dimensionless PDMS/gas partition ratios. Surface resistance, swelling and mixed-species effects are excluded from these intrinsic curves.

## How to read

Separate thickness-driven delay from permeance. D and K are independently uncertain and may not be independently adjustable in a real material.

## Assumptions and limits

The film has ideal interfaces. The25µm end is especially sensitive to omitted surface resistance; surface_resistance_sensitivity.csv tests that uncertainty.

## Source data and reproduction

`results/intrinsic_properties.csv`.

`python run.py --plots`

See [Analysis](../Analysis_EN.md) for equations,units,sources and assumptions.
