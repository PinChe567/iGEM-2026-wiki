# CAD 工程來源 / CAD engineering source

組裝者只需列印本package的01_print，八件各一。本區是修改設計、重現圖面與幾何檢查的來源，不增加任何要列印的零件。已選导流台一體化於03上蓋。

Builders use the eight files in package01_print, one each. This directory contains the editable design and verification records. The selected shelf is integral to lid03.

## 內容 / Contents

- aerosense.scad: unchanged parametric source corresponding to the delivered geometry. The standard exporter selects only the eight operating parts; historical development selectors are not delivery choices.
- design_parameters.json: dimensions and selected design. Update this record and SCAD together; JSON is not automatically imported by OpenSCAD.
- build.py: builds exactly eight operating STLs into package01_print. Temporary assembly-coordinate meshes are removed after export.
- mesh_checks.py and checks/: closedness, connected-component and nominal intersection records. Unknown populated PCB geometry is not certified.
- render_core.py: restores assembly Z coordinates from the selected STLs and mesh_report.json in memory. No second STL set is needed.
- check_intersections.py and check_nominal_board.py: reconstruct inspection geometry into a temporary workspace for OpenSCAD checks.
- drawings.py and drawings/: actual-geometry illustrations and the1:1 silicone cutting template. Print the SVG at100% and verify its20 mm scale bar.

## 重現 / Reproduce

Python3.11+, NumPy, Pillow and official OpenSCAD are required. Run from this directory:

```text
python -m pip install numpy==2.3.5 Pillow==12.3.0
python build.py --openscad "C:/Program Files/OpenSCAD/openscad.com"
python check_intersections.py --openscad "C:/Program Files/OpenSCAD/openscad.com"
python check_nominal_board.py --openscad "C:/Program Files/OpenSCAD/openscad.com"
python drawings.py
```

Drawing/check scripts also work directly with the shipped eight STLs; rebuild CAD after changing geometry. Changes require checking the affected BOM, optics and airflow models. The simulation solvers use documented geometric approximations, not automatic arbitrary-STL physics.

材料固定為01、02、03、08：PC/GF-like Black；04–07：Aqua Clear Plus。先用本組02黑罩與04井檢查尺寸，在實際黑罩測漏光。沒有額外校正片。細胞材料相容性與實板配合仍待驗證。
