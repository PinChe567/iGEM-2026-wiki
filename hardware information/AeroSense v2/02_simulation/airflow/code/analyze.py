"""Rebuild validation, design selection and bilingual findings from saved solves."""
from pathlib import Path
import csv,json
import numpy as np
import run_flow as f
from plot_and_video import BG,TEXT,MUTED,TEAL,GOLD,GRID,font
from PIL import Image,ImageDraw
CODE=Path(__file__).resolve().parent
P=CODE/'data'
CSV=CODE.parent/'results'
def read(tag):return json.loads((P/'results'/f'{tag}.json').read_text())
def main():
 rows=[read(f'{k}_dx0.4') for k in f.CASES];chosen='shelf_w8_e0p2';grid=[]
 for dx in [.4,.3,.2]:
  a=read(f'open_dx{dx:g}');b=read(f'{chosen}_dx{dx:g}')
  grid.append(dict(dx_mm=dx,open_J_N=a['worst_mouth_downward_momentum_N'],shelf_J_N=b['worst_mouth_downward_momentum_N'],J_ratio=b['worst_mouth_downward_momentum_N']/a['worst_mouth_downward_momentum_N'],open_P95_mm_s=a['worst_near_liquid_p95_mm_s'],shelf_P95_mm_s=b['worst_near_liquid_p95_mm_s'],speed_ratio=b['worst_near_liquid_p95_mm_s']/a['worst_near_liquid_p95_mm_s'],open_pressure_Pa=a['dp_at_1mLmin_Pa'],shelf_pressure_Pa=b['dp_at_1mLmin_Pa'],open_flux_CV=a['mouth_flux_CV'],shelf_flux_CV=b['mouth_flux_CV']))
 with (CSV/'mesh_refinement.csv').open('w',newline='') as o:w=csv.DictWriter(o,list(grid[0]));w.writeheader();w.writerows(grid)
 a=read('open_dx0.3_near1mLmin');b=read(chosen+'_dx0.3_near1mLmin')
 confirm=dict(open_actual_Q_mL_min=a['Q_actual_mL_min'],shelf_actual_Q_mL_min=b['Q_actual_mL_min'],shelf_Re=b['port_Re_actual'],shelf_relative_density_range=b['relative_density_range'],J_ratio=b['worst_mouth_downward_momentum_N']/a['worst_mouth_downward_momentum_N'],speed_ratio=b['worst_near_liquid_p95_mm_s']/a['worst_near_liquid_p95_mm_s'],tau=.55,dx_mm=.3,note='Separate near-operating-flow solves; metrics normalized by <6.5% to 1 mL/min. Changing tau also changes stair-step boundary error, so this is not a pure isolated inertia experiment.')
 nr=np.load(P/'results/tube_dx0.3_numpy_field.npz');cr=np.load(P/'results/tube_dx0.3_field.npz');error=float(np.linalg.norm(nr['velocity_m_s']-cr['velocity_m_s'])/np.linalg.norm(nr['velocity_m_s']))
 allres=[json.loads(x.read_text()) for x in (P/'results').glob('*.json')]
 checks=dict(all_run_count=len(allres),screening_case_count=len(rows),all_declared_converged=all(r['converged'] for r in allres),max_final_mass_imbalance=max(r['last_residual']['mass_flux_imbalance'] for r in allres),max_final_velocity_change=max(r['last_residual']['velocity_relative_change_over_200_steps'] for r in allres),Csharp_vs_numpy_velocity_relative_L2=error,tube_flow_error_tau08=read('tube_dx0.3')['tube_Q_relative_error'],tube_flow_error_tau055=read('tube_dx0.3_tau055')['tube_Q_relative_error'],grid_independence_established=False,operating_flow_confirmation=confirm)
 (P/'validation.json').write_text(json.dumps(checks,indent=2))
 selection=dict(selected_case=chosen,status='selected engineering prototype candidate; not a global optimum or biologically validated design',CAD_solid_box_mm=dict(minimum=[-7.4,-4,58.2],maximum=[-.2,4,59.4]),geometry=f.GEOM,geometry_source='geometry_and_cases.json',configuration=f.CASES[chosen],mesh_refinement=grid,operating_flow_confirmation=confirm,decision='Minimize extra parts and inaccessible surfaces; reduce well-mouth downward momentum compared with open plenum without major pressure penalty. Accept worsened gas-circulation symmetry. Do not claim lowest near-liquid velocity or improved cell survival.',unsupported_claims=['turbulence','sterility','no cross-well gas communication','cell protection','odor concentration uniformity','grid-independent absolute local velocity'])
 (P/'selection.json').write_text(json.dumps(selection,indent=2))
 im=Image.new('RGB',(1700,860),BG);d=ImageDraw.Draw(im);d.text((60,35),'Mesh sensitivity',font=font(40,True),fill=TEXT)
 for pane,(key,title) in enumerate([('J_ratio','Downward momentum ratio'),('speed_ratio','Near-liquid P95 speed ratio')]):
  x0=100+pane*820;y0=215;w=620;h=500;d.text((x0,135),chr(65+pane)+'  '+title,font=font(27,True),fill=TEXT)
  for val in [0,.25,.5,.75,1]:
   yy=y0+h*(1-val/1.1);d.line((x0,yy,x0+w,yy),fill=GRID,width=2);d.text((x0-40,yy-12),f'{val:.2f}',font=font(20),fill=MUTED)
  pts=[]
  for i,r in enumerate(grid):
   xx=x0+70+i*240;yy=y0+h*(1-r[key]/1.1);pts.append((xx,yy));d.text((xx-24,y0+h+17),str(r['dx_mm']),font=font(25),fill=TEXT);d.text((xx-30,yy-40),f'{r[key]:.3f}',font=font(22,True),fill=TEAL)
  d.line(pts,fill=TEAL,width=5)
  for xx,yy in pts:d.ellipse((xx-7,yy-7,xx+7,yy+7),fill=TEAL)
  d.text((x0+160,y0+h+62),'Grid spacing [mm]',font=font(25),fill=MUTED)
 im.save(CODE.parent/'figures/mesh_and_tradeoff.png',dpi=(300,300))
 finest=read(chosen+'_dx0.2');gas_volume=finest['gas_volume_voxel_uL'];bulk_time=gas_volume/1000*60

if __name__=='__main__':main()
