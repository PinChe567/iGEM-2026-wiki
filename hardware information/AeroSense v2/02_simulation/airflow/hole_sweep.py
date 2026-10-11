"""Actual perforated-plate factorial CFD; original 28 solves remain untouched.
python hole_sweep.py --run --workers 2
Hole diameter 1.2/1.8/2.4 mm; pitch 3.6/4.2/4.8 mm; bottom Z57.9/58.2.
All plates 1.2 mm thick and below the inlet bore. No printable option is exported.
"""
from pathlib import Path
import argparse,concurrent.futures,csv,json,math
import numpy as np
import run_flow as f
P=Path(__file__).resolve().parent
CASES={}
for diameter in [1.2,1.8,2.4]:
 for pitch in [3.6,4.2,4.8]:
  # Fixed 3x3 topology isolates pitch from hole count; density is 1/pitch².
  # Maximum hole radius + pitch=6.0 mm leaves >1.2 mm X-edge margin,
  # but the maximum Y edge is flush at6.0 mm: omit that invalid combination.
  # Use 3x2 holes, centered at y=±pitch/2, for a positive margin in every case.
  centers=[[float(x),float(y)] for x in [-pitch,0,pitch] for y in [-pitch/2,pitch/2]]
  for bottom in [57.9,58.2]:
   name=f'hole_d{diameter:g}_p{pitch:g}_z{bottom:g}'.replace('.','p')
   CASES[name]=dict(kind='perforated',diameter=diameter,pitch=pitch,centers=centers,nx=3,ny=2,plate_bottom=bottom,plate_top=bottom+1.2)
f.CASES.update(CASES)
def run_one(args):
 case,dx=args
 return f.solve(case,dx=dx,max_steps=40000,result_subdir='hole_sweep_results')
def summarize():
 rows=[];base=json.loads((P/'results/open_dx0.3.json').read_text())
 for k,c in CASES.items():
  p=P/'hole_sweep_results'/f'{k}_dx0.3.json'
  if not p.exists():continue
  r=json.loads(p.read_text());area=len(c['centers'])*math.pi*c['diameter']**2/4
  rows.append(dict(case=k,diameter_mm=c['diameter'],pitch_mm=c['pitch'],nominal_lattice_density_per_mm2=1/c['pitch']**2,hole_count=len(c['centers']),global_hole_density_per_mm2=len(c['centers'])/(14.8*12),plate_bottom_z_mm=c['plate_bottom'],inlet_center_to_plate_top_mm=60.8-c['plate_top'],lower_gap_mm=c['plate_bottom']-57.3,plate_thickness_mm=1.2,open_area_fraction=area/(14.8*12),dx_mm=r['dx_mm'],diameter_cells=c['diameter']/r['dx_mm'],web_cells=(c['pitch']-c['diameter'])/r['dx_mm'],lower_gap_cells=(c['plate_bottom']-57.3)/r['dx_mm'],converged=r['converged'],J_ratio_to_open=r['worst_mouth_downward_momentum_N']/base['worst_mouth_downward_momentum_N'],near_liquid_P95_ratio_to_open=r['worst_near_liquid_p95_mm_s']/base['worst_near_liquid_p95_mm_s'],pressure_Pa=r['dp_at_1mLmin_Pa'],mouth_flux_CV=r['mouth_flux_CV'],mass_imbalance=r['last_residual']['mass_flux_imbalance'],velocity_relative_change=r['last_residual']['velocity_relative_change_over_200_steps'],raw_json=str(p.relative_to(P)).replace('\\','/')))
 if rows:
  with (P/'hole_sweep.csv').open('w',newline='',encoding='utf-8') as h:w=csv.DictWriter(h,list(rows[0]));w.writeheader();w.writerows(rows)
 (P/'hole_sweep_cases.json').write_text(json.dumps(dict(cases=CASES,geometry=f.GEOM,scope='18 actual CFD cases; fixed six-hole count. Pitch changes spacing, NOT global hole density. Original heterogeneous screening remains separate.',Q_mL_min=1,dx_mm=.3),indent=2))
 return rows
def main():
 a=argparse.ArgumentParser();a.add_argument('--run',action='store_true');a.add_argument('--workers',type=int,default=2);a.add_argument('--case',choices=CASES);a.add_argument('--refine',action='store_true');args=a.parse_args()
 if args.run:
  jobs=[(k,.3) for k in ([args.case] if args.case else CASES)]
  with concurrent.futures.ProcessPoolExecutor(args.workers) as pool:
   for r in pool.map(run_one,jobs):
    if not r['converged']:raise RuntimeError('Nonconverged hole case: '+r['case'])
 rows=summarize()
 if args.refine:
  if len(rows)!=18:raise RuntimeError('Run all18 coarse cases first')
  # Predeclared extremes + lowest momentum at screening grid; unique cases.
  names=list(dict.fromkeys([min(rows,key=lambda r:r['J_ratio_to_open'])['case'],next(k for k,c in CASES.items() if c['diameter']==1.2 and c['pitch']==4.8 and c['plate_bottom']==57.9)]))
  with concurrent.futures.ProcessPoolExecutor(args.workers) as pool:
   for r in pool.map(run_one,[(k,.2) for k in names]):
    if not r['converged']:raise RuntimeError('Nonconverged refinement')
  (P/'hole_refinement_cases.json').write_text(json.dumps(names,indent=2))
 print('Computed coarse cases:',len(rows))
if __name__=='__main__':main()
