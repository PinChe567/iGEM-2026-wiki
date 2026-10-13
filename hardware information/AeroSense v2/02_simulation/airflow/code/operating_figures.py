"""Regenerate operating-condition figures, HTML, bilingual reports and notes from solved data.
No SciPy import or solver call is required by this script.
"""
from pathlib import Path
import csv,hashlib,json,math
import numpy as np
from PIL import Image,ImageDraw
from plot_and_video import font,BG,TEXT,GRID,TEAL,BLUE,GOLD
from supplemental_figures import palette
CODE=Path(__file__).resolve().parent
P=CODE/'data'
CSV=CODE.parent/'results'
WELLS=['NE','NW','SW','SE']
def read(p):return json.loads((P/p).read_text(encoding='utf-8'))
def filename(Q,D,dx=.4,dt=None,label=''):
 if dt is None:dt=1. if Q<=.5 else .5 if Q<=2 else .25
 return f'operating_results/Q{Q:g}_D{D:g}_dx{dx:g}_dt{dt:g}{label}.json'
def percentile(r,k):return max(r[k][w+'_near_liquid'] for w in WELLS)
def pareto(rows):return [a for a in rows if not any(b['worst_t90_s']<=a['worst_t90_s'] and b['gas_speed_p95_mm_s']<=a['gas_speed_p95_mm_s'] and (b['worst_t90_s']<a['worst_t90_s'] or b['gas_speed_p95_mm_s']<a['gas_speed_p95_mm_s']) for b in rows)]
def collect():
 cfg=read('operating_sweep_config.json');refine=read('operating_refinement_config.json');cfg['stage1_Q_mL_min']=list(cfg['Q_mL_min']);cfg['Q_mL_min']=sorted(set(cfg['Q_mL_min']+refine['Q_mL_min']));cfg['adaptive_refinement']=refine;rows=[];raw=[]
 for Q in cfg['Q_mL_min']:
  for D in cfg['Dgas_mm2_s']:
   fn=filename(Q,D);r=read(fn);raw.append(r)
   rows.append(dict(Q_mL_min=Q,Dgas_mm2_s=D,t10_s=percentile(r,'t10_s'),t50_s=percentile(r,'t50_s'),t90_s=percentile(r,'t90_s'),gas_speed_p95_mm_s=r['worst_near_liquid_speed_p95_mm_s'],port_mean_speed_mm_s=r['port_mean_speed_mm_s'],port_Re=r['port_Re'],chamber_pressure_drop_Pa=r['chamber_pressure_drop_Pa'],raw_json='../code/data/'+fn))
 with (CSV/'operating_sweep.csv').open('w',newline='') as f:w=csv.DictWriter(f,list(rows[0]));w.writeheader();w.writerows(rows)
 agg=[];targets=cfg['targets']
 for Q in cfg['Q_mL_min']:
  a=[r for r in rows if r['Q_mL_min']==Q];r=a[0];worst=max(a,key=lambda q:q['t90_s']);j=dict(Q_mL_min=Q,worst_t90_s=worst['t90_s'],worst_Dgas_mm2_s=worst['Dgas_mm2_s'],gas_speed_p95_mm_s=r['gas_speed_p95_mm_s'],port_Re=r['port_Re'],port_mean_speed_mm_s=r['port_mean_speed_mm_s'],chamber_pressure_drop_Pa=r['chamber_pressure_drop_Pa']);j['meets_declared_targets']=j['worst_t90_s']<=targets['worst_well_worst_D_t90_max_s'] and j['gas_speed_p95_mm_s']<=targets['near_liquid_gas_P95_speed_max_mm_s'] and j['port_Re']<=targets['port_Re_max'];agg.append(j)
 feasible=[a for a in agg if a['meets_declared_targets']];chosen=min(feasible,key=lambda a:a['Q_mL_min']) if feasible else None
 checks={};base5=read(filename(5,10));base025=read(filename(.25,10))
 for name,fn,ref in [('upper_flow_grid',filename(5,10,.3,.25),base5),('upper_flow_timestep',filename(5,10,.4,.125),base5),('lower_flow_timestep',filename(.25,10,.4,.5),base025),('upper_flow_direct_field',filename(5,10,.3,.25,'_direct5'),read(filename(5,10,.3,.25)))]:
  r=read(fn);checks[name]=dict(raw_json=fn,worst_t90_s=r['worst_near_liquid_t90_s'],relative_change_t90=r['worst_near_liquid_t90_s']/ref['worst_near_liquid_t90_s']-1,gas_speed_p95_mm_s=r['worst_near_liquid_speed_p95_mm_s'],relative_change_gas_speed=r['worst_near_liquid_speed_p95_mm_s']/ref['worst_near_liquid_speed_p95_mm_s']-1)
 selected_cfg=read('operating_selected_check_config.json');ref=read(filename(selected_cfg['Q_mL_min'],selected_cfg['Dgas_mm2_s']))
 for name,setting in zip(['selected_point_grid','selected_point_timestep'],selected_cfg['checks']):
  fn=filename(selected_cfg['Q_mL_min'],selected_cfg['Dgas_mm2_s'],setting['dx_mm'],setting['dt_s']);r=read(fn)
  checks[name]=dict(raw_json=fn,worst_t90_s=r['worst_near_liquid_t90_s'],relative_change_t90=r['worst_near_liquid_t90_s']/ref['worst_near_liquid_t90_s']-1,gas_speed_p95_mm_s=r['worst_near_liquid_speed_p95_mm_s'],relative_change_gas_speed=r['worst_near_liquid_speed_p95_mm_s']/ref['worst_near_liquid_speed_p95_mm_s']-1)
 allruns=[json.loads(f.read_text()) for f in (P/'operating_results').glob('*.json')]
 summary=dict(configuration=cfg,stage1_screening_solves=15,stage2_adaptive_screening_solves=6,screening_scalar_solves=len(rows),validation_scalar_solves=len(checks),direct_velocity_solves=1,chosen_conditional_point=chosen,decision_status='Conditional operating candidate; provisional targets, numerical checks only, no physical or biological validation.',flow_aggregates=agg,pareto_Q_mL_min=[r['Q_mL_min'] for r in pareto(agg)],numerical_checks=checks,direct_flow_check=read('operating_direct_flow_check.json'),max_relative_global_mass_residual=max(r['relative_global_mass_residual'] for r in allruns),max_uniform_operator_residual=max(r['uniform_operator_residual'] for r in allruns),concentration_bounds=[min(r['concentration_min'] for r in allruns),max(r['concentration_max'] for r in allruns)],old_raw_files_modified=False,CAD_changed=False,scope='Conditional lowest-flow choice from seven sampled Q levels for fixed geometry, robust only over the three assumed gas diffusivities. Gas concentration, not cell exposure or safety. No weighted objective or global optimum is claimed.',source_config_sha256=hashlib.sha256((P/'operating_sweep_config.json').read_bytes()).hexdigest(),refinement_config_sha256=hashlib.sha256((P/'operating_refinement_config.json').read_bytes()).hexdigest(),selected_check_config_sha256=hashlib.sha256((P/'operating_selected_check_config.json').read_bytes()).hexdigest())
 # Baseline repeats must reproduce the preserved previous history (within roundoff).
 baseline=[]
 for D in cfg['Dgas_mm2_s']:
  prior=read(f'gas_transport_results/shelf_w8_e0p2_D{D:g}_dx0.4_dt0.5.json');new=read(filename(1,D));baseline.append(abs(new['t90_s']['NE_near_liquid']-prior['t90_s']['NE_near_liquid']))
 summary['repeated_Q1_baseline_max_abs_t90_difference_s']=max(baseline)
 (P/'operating_sweep_summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8');return rows,summary

def plots(rows,s):
 fig=CODE.parent/'figures';fig.mkdir(exist_ok=True);cfg=s['configuration'];Q=cfg['Q_mL_min'];Ds=cfg['Dgas_mm2_s'];im=Image.new('RGB',(1860,900),BG);d=ImageDraw.Draw(im);d.text((45,24),'Gas delivery across operating conditions',font=font(35,True),fill=TEXT)
 lo=min(r['t10_s'] for r in rows);hi=max(r['t90_s'] for r in rows)
 for panel,key in enumerate(['t10_s','t50_s','t90_s']):
  x0=100+panel*605;y0=170;cw=500/len(Q);ch=150;d.text((x0,100),f'{chr(65+panel)}  {key[:3].replace("_","")} [s]',font=font(28,True),fill=TEXT)
  for r in rows:
   i=Q.index(r['Q_mL_min']);j=Ds.index(r['Dgas_mm2_s']);t=(math.log10(r[key])-math.log10(lo))/(math.log10(hi)-math.log10(lo));x=x0+i*cw;y=y0+(2-j)*ch;d.rectangle((x,y,x+cw-2,y+ch-2),fill=palette(t));d.text((x+6,y+60),f'{r[key]:.1f}',font=font(20,True),fill='white' if t<.35 else TEXT)
  for i,q in enumerate(Q):d.text((x0+i*cw+25,y0+3*ch+16),f'{q:g}',font=font(23),fill=TEXT)
  for j,dd in enumerate(Ds[::-1]):d.text((x0-46,y0+j*ch+60),f'{dd:g}',font=font(23),fill=TEXT)
  d.text((x0+135,690),'Q [mL/min]',font=font(25),fill=TEXT);d.text((x0,135),'Dgas [mm²/s]',font=font(21),fill=TEXT)
 d.text((290,776),'Time [s]',font=font(22),fill=TEXT)
 for k in range(900):d.line((450+k,780,450+k,806),fill=palette(k/899))
 for j in range(6):d.text((433+180*j,824),f'{10**(math.log10(lo)+j/5*(math.log10(hi)-math.log10(lo))):.1f}',font=font(19),fill=TEXT)
 im.save(fig/'operating_delivery.png',dpi=(300,300))
 im=Image.new('RGB',(1650,900),BG);d=ImageDraw.Draw(im);d.text((45,24),'Flow-rate tradeoff',font=font(36,True),fill=TEXT);a=s['flow_aggregates'];x0,y0,w,h=130,165,1320,535;xmax=max(r['gas_speed_p95_mm_s'] for r in a)*1.15;ymax=math.ceil(max(r['worst_t90_s'] for r in a)/100)*100
 # Axis resolves the sampled speeds; the separate comparison cap remains in configuration/report.
 for val in np.linspace(0,ymax,6):yy=y0+h*(1-val/ymax);d.line((x0,yy,x0+w,yy),fill=GRID);d.text((x0-65,yy-14),f'{val:g}',font=font(21),fill=TEXT)
 for val in np.linspace(0,xmax,6):xx=x0+w*val/xmax;d.text((xx-30,y0+h+16),f'{val:.3f}',font=font(21),fill=TEXT)
 d.line((x0,y0,x0,y0+h,x0+w,y0+h),fill=TEXT,width=2);target=cfg['targets']['worst_well_worst_D_t90_max_s'];yy=y0+h*(1-target/ymax)
 for x in range(x0,x0+w,20):d.line((x,yy,x+10,yy),fill='#93637c',width=2)
 d.text((x0+850,yy-29),f't90 target {target:g} s',font=font(21),fill='#93637c')
 pts=[(x0+w*r['gas_speed_p95_mm_s']/xmax,y0+h*(1-r['worst_t90_s']/ymax)) for r in a];d.line(pts,fill=TEAL,width=3)
 for idx,(r,(x,y)) in enumerate(zip(a,pts)):
  d.ellipse((x-7,y-7,x+7,y+7),fill=TEAL);d.text((x+12,y+[-36,-40,12][idx%3]),f'Q={r["Q_mL_min"]:g}',font=font(24),fill=TEXT)
  if s['chosen_conditional_point'] and r['Q_mL_min']==s['chosen_conditional_point']['Q_mL_min']:d.ellipse((x-13,y-13,x+13,y+13),outline=TEXT,width=3)
 d.text((x0,112),'Worst-well / worst-D t90 [s]',font=font(26),fill=TEXT);d.text((x0+320,775),'Near-liquid gas P95 speed [mm/s]',font=font(26),fill=TEXT)
 im.save(fig/'operating_pareto.png',dpi=(300,300))

def main():
 rows,s=collect();plots(rows,s);print('Rebuilt 2 operating figures from saved fields.')
if __name__=='__main__':main()
