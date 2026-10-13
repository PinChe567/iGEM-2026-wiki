MaleCNS reference anatomy — AeroSense local rendering

Source data: MaleCNS v1.0, FlyEM/HHMI Janelia, University of Cambridge,
MRC Laboratory of Molecular Biology and Google Research.
Official data: https://male-cns.janelia.org/download/
License: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/

Run python render_reference.py with numpy, matplotlib and pillow installed.
The package contains all local inputs needed for the static rendering:
24 unchanged SWC centerline files and 13 simplified mesh NPZ files.
No network call is made by the renderer. Mesh coordinates are micrometres;
SWC coordinates are converted from 8 nm units to micrometres during rendering.
Display transformation is x,y,z -> x,z,-y, followed by an orthographic camera.

Changes from the source: selection of example cells, surface mesh decimation,
camera projection, colors by cell class, anatomical annotations and typography.
Skeleton centerlines and parent links are unchanged. No branches, synapses,
or inter-neuron tracer paths were generated or inferred. Mesh decimation is
for a contextual surface, not a new quantitative anatomical measurement.

Read provenance.json, selected-neurons.json, geometry-manifest.json and
source-downloads.json for identities, source URLs, hashes and transformations.
The original full-resolution meshes (68 MB total source downloads) and full
annotation Feather are not duplicated here. Original mesh download paths in
source-downloads.json describe the acquisition cache, not package contents;
their exact official URLs and hashes allow re-fetching the original geometry.

Important: these are another fly's published EM reconstructions, not the team's
light-sheet specimen, and not TH or GH146 driver expression maps. They do not
establish connections among the chosen cells. The selected cells have right
soma annotations; their processes are not constrained to one hemisphere.
The user's reference scene was v0.9; this render explicitly uses v1.0.

Generated PNG and WebP are derived from the cited CC BY 4.0 data. Please retain
attribution and indicate adaptations if redistributing. AeroSense selection
and rendering do not imply endorsement by the dataset authors.
