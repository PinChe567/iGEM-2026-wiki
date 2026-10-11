"""Nominal CAD solid-intersection audit, not a populated-PCB clearance certificate."""
from pathlib import Path
import subprocess,argparse,json,tempfile,shutil
import numpy as np
from mesh_checks import read,write
from render_core import geo
R=Path(__file__).resolve().parent;p=argparse.ArgumentParser();p.add_argument('--openscad',default='openscad');a=p.parse_args()
names=['01_base_BLACK','02_black_hood_BLACK','03_gas_lid_BLACK','04_well_NE_CLEAR','05_well_NW_CLEAR','06_well_SW_CLEAR','07_well_SE_CLEAR']
names.append('08_gas_compression_plate_BLACK')
pairs=[(0,1),(0,2),(1,2)]+[(1,i) for i in range(3,7)]+[(2,i) for i in range(3,7)]+[(i,j) for i in range(3,7) for j in range(i+1,7)]
pairs += [(1,7),(2,7)]+[(i,7) for i in range(3,7)]
checks=R/'checks';rows=[]
stage=Path(tempfile.mkdtemp(prefix='aerosense-cad-'))
for name in names:
 v,f=geo(name);write(stage/(name+'.stl'),v,f)
for i,j in pairs:
 sc=stage/'intersection.scad';out=stage/'intersection.stl'
 if out.exists():out.unlink()
 sc.write_text('intersection(){'+''.join('import("'+names[k]+'.stl");' for k in [i,j])+'}',encoding='utf8')
 run=subprocess.run([a.openscad,'--export-format','binstl','-o',str(out),str(sc)],capture_output=True,text=True,cwd=stage)
 log=run.stdout+run.stderr
 (checks/(names[i]+'__'+names[j]+'.log')).write_text(log,encoding='utf8')
 assert "Can't open" not in log,log
 if out.exists():
  raw=out.read_bytes();dt=np.dtype([('normal','<f4',3),('v','<f4',(3,3)),('attr','<u2')]);tri=np.frombuffer(raw,dt,offset=84)['v'].astype(float)
  volume=abs(np.einsum('ij,ij->i',tri[:,0],np.cross(tri[:,1],tri[:,2])).sum()/6)
  status='INTERSECTION' if volume>1e-6 else 'zero_volume_bearing_contact'
 else:
  assert 'empty' in log.lower(),(run.returncode,log)
  status='no_positive_volume_intersection';volume=0
 rows.append(dict(a=names[i],b=names[j],volume_mm3=volume,status=status));print(names[i],names[j],status,volume,flush=True)
(checks/'nominal_intersections.json').write_text(json.dumps({'scope':'Printed solids only. Excludes real component bodies, tolerances, deflection and assembly process. Zero-volume intended bearing contacts allowed.','checks':rows},indent=2),encoding='utf8')
assert all(r['volume_mm3']<1e-6 for r in rows)
