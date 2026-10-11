# airflow_comparison.mp4

## Publication caption

Movie | A–C areRK2 tracers in saved steady velocity fields;D independently shows selected-shelf gas concentration atDgas10.60physical seconds play in20seconds.

## Method

400markers/case:140inlet,120plenum,35in each headspace;marker density is not concentration. RK2dt0.02s,trilinearvelocity;outlet markers re-seeded without drawing jumps. Liquid is a boundary,not a fabricated flow field.

## Results

Headspace3.57mm and100µL liquiddepth8.93mm. Concentration increase and marker displacement are different observables.

## Reading, axes and legend

Aopen,Boriginal12-hole plate,Cshelf;log colour isgas speedmm/s;pale blue isunsolved liquid. D x:time s,y:C/Cin,NE/NWcurves. Bottomt isphysical time. Tiny headspace displacements represent low velocity,not a missing calculation.

## Data and reproduction

`plot_and_video.py --video --ffmpeg PATH`; original fields, baseline gas CSV, `video_metadata.json`.

## Limits

Gas speed or downward mouth momentum is not stress on submerged cells. Velocity CFD does not solve concentration; the added scalar model still excludes liquid, PDMS, adsorption and cells.
