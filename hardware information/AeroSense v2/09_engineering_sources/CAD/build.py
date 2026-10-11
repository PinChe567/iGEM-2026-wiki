"""Rebuild the eight operating STLs and check closed meshes. Python + numpy + OpenSCAD.
python build.py --openscad "C:/Program Files/OpenSCAD/openscad.com"
STL coordinates are millimetres. Package 01_print meshes are translated to z=0,
not pre-supported or automatically oriented for resin printing.
"""
from pathlib import Path
import argparse,subprocess,json,sys,tempfile
import numpy as np
from mesh_checks import read,write
ROOT=Path(__file__).resolve().parent
PRINT_DIR=ROOT.parents[1]/'01_print'; PRINT_DIR.mkdir(exist_ok=True)
p=argparse.ArgumentParser();p.add_argument('--openscad',default='openscad');args=p.parse_args()
specs=[('01_base_BLACK','base',1,1,'PC/GF-like Black'),('02_black_hood_BLACK','hood',1,1,'PC/GF-like Black'),('03_gas_lid_BLACK','lid',1,1,'PC/GF-like Black'),('04_well_NE_CLEAR','well',1,1,'Aqua Clear Plus'),('05_well_NW_CLEAR','well',-1,1,'Aqua Clear Plus'),('06_well_SW_CLEAR','well',-1,-1,'Aqua Clear Plus'),('07_well_SE_CLEAR','well',1,-1,'Aqua Clear Plus')]
specs.append(('08_gas_compression_plate_BLACK','compression_plate',1,1,'PC/GF-like Black'))
for n in ['checks','drawings']:(ROOT/n).mkdir(exist_ok=True)
temporary_assembly=tempfile.TemporaryDirectory(prefix='aerosense-export-')
assembly_dir=Path(temporary_assembly.name)
def components(f):
 parent=np.arange(f.max()+1)
 def find(a):
  while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
  return a
 for tri in f:
  for a,b in zip(tri[:2],tri[1:]):parent[find(a)]=find(b)
 return len(set(find(i) for i in range(len(parent))))
report=[]
for name,part,sx,sy,mat in specs:
 path=assembly_dir/(name+'.stl')
 cmd=[args.openscad,'--export-format','binstl','-o',str(path),'-D',f'part="{part}"','-D',f'sx={sx}','-D',f'sy={sy}',str(ROOT/'aerosense.scad')]
 run=subprocess.run(cmd,capture_output=True,text=True);(ROOT/'checks'/(name+'.log')).write_text(run.stdout+run.stderr,encoding='utf8');run.check_returncode()
 v,f,vol,deg=read(path);n=components(f);print(name,'components',n,'volume_cm3',vol/1000,flush=True)
 assert n==1,(name,'disconnected solids',n)
 write(path,v,f)
 lo=v.min(0);hi=v.max(0);dest=PRINT_DIR/(name+'.stl');write(dest,v-np.array([0,0,lo[2]]),f)
 report.append(dict(file=dest.name,qty=1,material=mat,triangles=len(f),watertight_edges=True,connected_components=n,volume_cm3=vol/1000,assembly_min_mm=lo.tolist(),assembly_max_mm=hi.tolist(),size_mm=(hi-lo).tolist(),degenerate_removed=deg))
(ROOT/'checks/mesh_report.json').write_text(json.dumps(report,indent=2),encoding='utf8')
temporary_assembly.cleanup()
print('PASS: eight watertight connected operating meshes exported to package 01_print.')
