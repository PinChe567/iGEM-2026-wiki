"""Check printed solids against declared BOARD/FAN/component envelopes.
Component heights are assumptions, not measured vendor STEP certification.
"""
from pathlib import Path
import json,subprocess,tempfile,shutil,numpy as np,argparse
from render_core import geo
from mesh_checks import write
R=Path(__file__).resolve().parent;p=argparse.ArgumentParser();p.add_argument('--openscad',default='openscad');a=p.parse_args()
T=Path(tempfile.mkdtemp(prefix='aerosense-fit-'));names=['01_base_BLACK','02_black_hood_BLACK','03_gas_lid_BLACK']+[f'{i:02d}_well_{q}_CLEAR' for i,q in zip(range(4,8),['NE','NW','SW','SE'])]
for n in names:
 v,f=geo(n);write(T/(n+'.stl'),v,f)
board='difference(){translate([-50,-45,38])cube([100,90,1.6]);for(x=[-45,45])for(y=[-40,40])translate([x,y,37])cylinder(r=1.7,h=4,$fn=32);}'
fan='translate([-47,-25,6])cube([40,40,10]);'
comp='union(){translate([-2,-2.5,39.6])cube([4,5,.9]);translate([2.875,-.2,39.6])cube([1.25,3,1.2]);translate([4.475,-.2,39.6])cube([1.25,3,1.2]);translate([6.5,-3.7,39.6])cube([5,8,1.75]);}'
cases=[('base_vs_bare_PCB',[names[0]],board),('base_vs_nominal_fan',[names[0]],fan),('optics_vs_PD_C21_R27_U8_envelopes',names[1:],comp)]
rows=[]
for label,parts,shape in cases:
 s=T/'case.scad';out=T/'case.stl'
 if out.exists():out.unlink()
 s.write_text('intersection(){union(){'+''.join(f'import("{n}.stl");' for n in parts)+'}'+shape+'}',encoding='utf8')
 run=subprocess.run([a.openscad,'--export-format','binstl','-o',str(out),str(s)],cwd=T,capture_output=True,text=True);log=run.stdout+run.stderr
 assert "Can't open" not in log,log
 if out.exists():
  dt=np.dtype([('n','<f4',3),('v','<f4',(3,3)),('a','<u2')]);t=np.frombuffer(out.read_bytes(),dt,offset=84)['v'].astype(float);vol=abs(np.einsum('ij,ij->i',t[:,0],np.cross(t[:,1],t[:,2])).sum()/6)
 else:assert 'empty' in log.lower(),log;vol=0
 rows.append({'case':label,'intersection_mm3':float(vol),'nominal_pass':bool(vol<1e-6)});print(label,vol,flush=True)
 (R/'checks'/(label+'.log')).write_text(log,encoding='utf8')
data={'status':'Nominal proxies only; actual PCB not fabricated. These checks do not certify clearances or unknown components.','envelopes':{'board':[100,90,1.6],'fan':[40,40,10],'PD':[4,5,.9],'C21_R27_each':[1.25,3,1.2],'U8':[5,8,1.75]},'checks':rows,'clearance_notes':{'C21_to_relief_vertical_mm':.5,'fan_to_bare_PCB_mm':22,'fan_cradle_lateral_mm':.3,'well_slot_lateral_mm':.15,'unknown':'LED detailed package, battery holder including battery, underside power components, solder, cables; measure before full assembly.'}}
(R/'checks/nominal_board_check.json').write_text(json.dumps(data,indent=2),encoding='utf8');assert all(x['nominal_pass'] for x in rows)
