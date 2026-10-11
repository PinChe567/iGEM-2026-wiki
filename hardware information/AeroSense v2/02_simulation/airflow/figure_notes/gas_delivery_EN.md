# gas_delivery.png

## Publication caption

Figure5 | Gas species can reach a well by diffusion while velocity tracers barely move.

## Method

Conservative FV on saved velocity fields:backwardEuler,upwindadvection,centraldiffusion;inletC/Cin step1,initial0,convectiveoutlet,and no-flux walls/liquid. Dgas5/10/20mm²/s are sensitivity assumptions.

## Results

Selected-shelf D10 gives NE near-liquid gas t90=149.55s;localPe95≈0.000334,Re95≈0.000222. L²/D≈1.276s across3.57mm,whereas whole inlet/plenum delivery is about150s;these are different scales.

## Reading, axes and legend

A x:seconds,y:near-liquid gas meanC/Cin;four coloursNE/NW/SW/SE. B x:Dgas mm²/s,y:slowest-well t90 seconds;linesopen/shelf. t90 need not vary monotonically withD in this flowing open-boundary problem.

## Data and reproduction

`gas_transport_results/*.csv/*.json`; `python gas_transport.py --run --checks`; `python supplemental_figures.py`.

## Limits

These are gas concentrations above liquid,not arrival at bottom HEK293T cells. Liquid depth8.93mm;see`../../membrane/Analysis_EN.md` for liquid/PDMS scenarios. A no-uptake liquid boundary is not a two-way coupled uptake model.
