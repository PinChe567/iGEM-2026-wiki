"""Selected-shelf operating sweep. Gas-only FV; no biology or liquid uptake.
Compute: python operating_sweep.py --run --checks --refine --selected-checks
Postprocess without SciPy: python operating_figures.py
"""
from pathlib import Path
import argparse,csv,hashlib,json,time
import numpy as np
P=Path(__file__).resolve().parent
OUT=P/'operating_results'; CASE='shelf_w8_e0p2'
CONFIG=json.loads((P/'operating_sweep_config.json').read_text())
QS=CONFIG['Q_mL_min']; DS=CONFIG['Dgas_mm2_s']; WELLS=['NE','NW','SW','SE']

def solve(Q,D,dx=.4,dt=None,T=None,field_path=None,label=''):
 import gas_transport as gt
 from scipy import sparse
 from scipy.sparse.linalg import factorized
 if dt is None:dt=1. if Q<=.5 else .5 if Q<=2 else .25
 if T is None:T=max(150.,300./Q)
 OUT.mkdir(exist_ok=True)
 tag=f'Q{Q:g}_D{D:g}_dx{dx:g}_dt{dt:g}'+label; dest=OUT/tag
 jf=Path(str(dest)+'.json')
 if jf.exists():
  old=json.loads(jf.read_text())
  if old['end_time_s']==T and old.get('field_override')==(str(field_path.relative_to(P)) if field_path else None):return old
 start=time.time()
 if field_path:
  # Reuse conservative construction while selecting a separately solved velocity field.
  f=load_override(field_path)
 else:f=gt.load_field(CASE,dx)
 for k in ['v','q','qi','qo']:f[k]=f[k]*Q
 f['stats']['max_residual_divergence_mm3_s']*=Q
 f['stats']['net_boundary_Q_mm3_s']*=Q
 A,b=gt.operator(f,D,True);V=f['h']**3
 step=factorized(A+sparse.eye(f['n'],format='csc')*(V/dt));c=np.zeros(f['n'])
 regs,sampling=gt.regions(f);names=list(regs);hist=[];balance=[];cum=0.;mi=0.;ma=0.;maxerr=0.;snap=[];ts=[]
 for k in range(round(T/dt)+1):
  t=k*dt;hist.append([t]+[float(c[m].mean()) for m in regs.values()])
  if abs(t/10-round(t/10))<1e-8:snap.append(c.astype(np.float32));ts.append(t)
  if k==round(T/dt):break
  oldmass=float(c.sum()*V);c=step(c*(V/dt)+b)
  diff_in=float(np.sum(2*D*f['h']*(1-c[f['ins']])));adv_in=float(f['qi'].sum());adv_out=float(np.dot(f['qo'],c[f['outs']]))
  net=diff_in+adv_in-adv_out;cum+=net*dt;mass=float(c.sum()*V);err=mass-oldmass-net*dt
  maxerr=max(maxerr,abs(err));mi=min(mi,float(c.min()));ma=max(ma,float(c.max()));balance.append([t+dt,mass,cum,mass-cum,diff_in,adv_in,adv_out,err])
 data=np.array(hist)
 for suffix,header,rows in [('.csv',['time_s']+names,hist),('_balance.csv',['time_s','stored_Cin_mm3','cumulative_net_Cin_mm3','global_residual_Cin_mm3','diffusive_in_Cin_mm3_s','advective_in_Cin_mm3_s','advective_out_Cin_mm3_s','step_residual_Cin_mm3'],balance)]:
  with Path(str(dest)+suffix).open('w',newline='') as h:w=csv.writer(h);w.writerow(header);w.writerows(rows)
 np.savez_compressed(Path(str(dest)+'_snapshots.npz'),xyz_mm=f['x'],times_s=ts,C_over_Cin=np.array(snap))
 L=55.5-(43+100/11.2);vel=[]
 for well in WELLS:
  u=float(np.percentile(np.linalg.norm(f['v'][regs[well+'_near_liquid']],axis=1),95));vel.append(dict(well=well,speed_p95_mm_s=u,Re_p95=u*L/15,Pe_p95=u*L/D))
 basepath=field_path.with_name(field_path.name.replace('_field.npz','.json')) if field_path else P/'results'/f'{CASE}_dx{dx:g}.json'
 fluid=json.loads(basepath.read_text());pres=fluid['dp_at_1mLmin_Pa']*Q
 summary=dict(tag=tag,case=CASE,Q_mL_min=Q,Dgas_mm2_s=D,dx_mm=dx,dt_s=dt,end_time_s=T,field_override=str(field_path.relative_to(P)) if field_path else None,field_sha256=f['stats']['field_sha256'],source_velocity_actual_Q_mL_min=fluid['Q_actual_mL_min'],gas_volume_mL=f['n']*V/1000,nominal_port_diameter_mm=2.4,port_mean_speed_mm_s=(Q*1000/60)/(np.pi*1.2**2),port_Re=Q*.5894627522,chamber_pressure_drop_Pa=pres,velocity_scales=vel,sampling=sampling,projection=f['stats'],concentration_min=mi,concentration_max=ma,max_step_mass_residual_Cin_mm3=maxerr,relative_global_mass_residual=float(abs(balance[-1][3])/max(balance[-1][1],1e-30)),uniform_operator_residual=float(np.linalg.norm(A@np.ones(f['n'])-b)/np.linalg.norm(b)),runtime_s=time.time()-start)
 for quantile in [10,50,90]:summary[f't{quantile}_s']={n:gt.crossing(data[:,0],data[:,j+1],quantile/100) for j,n in enumerate(names)}
 summary['worst_near_liquid_t90_s']=max(summary['t90_s'][w+'_near_liquid'] for w in WELLS) if all(summary['t90_s'][w+'_near_liquid'] is not None for w in WELLS) else None
 summary['worst_near_liquid_speed_p95_mm_s']=max(q['speed_p95_mm_s'] for q in vel)
 summary['method']='Conservative FV backward Euler/upwind advection/central diffusion. Saved velocity and projected face fluxes linearly scaled to prescribed Q. A direct-field check is identified by field_override.'
 summary['boundary']='Initial gas C=0; upstream terminal C=1 step; outlet zero diffusive flux with convective exit; impermeable solid AND liquid walls.'
 summary['scope']='Gas-side concentration only. No dissolved transport, cell activation, shear injury, evaporation, filters or tubing. Pressure is chamber only. D values are assumptions, not selected to change a real odor.'
 jf.write_text(json.dumps(summary,indent=2));print(tag,'seconds',round(summary['runtime_s'],1),'worst t90',summary['worst_near_liquid_t90_s'],flush=True);return summary

def load_override(path):
 # Same face construction/projection as gas_transport.load_field, for an explicit saved field.
 import gas_transport as gt
 from scipy import sparse
 from scipy.sparse.linalg import spsolve
 d=np.load(path);x=d['xyz_mm'];ijk=d['ijk'];h=float(d['dx_mm']);n=len(x);v=d['velocity_m_s']/float(d['Q_mL_min'])*1000
 i,j,axis=gt.edges(ijk,tuple(d['shape']));q=.5*(v[i,axis]+v[j,axis])*h*h
 ins=np.flatnonzero(ijk[:,0]==0);outs=np.flatnonzero(ijk[:,0]==max(ijk[:,0]));Q=1000/60
 qi=np.maximum(v[ins,0],0);qi=qi/qi.sum()*Q;qo=np.maximum(v[outs,0],0);qo=qo/qo.sum()*Q
 div=np.bincount(i,weights=q,minlength=n)-np.bincount(j,weights=q,minlength=n);div[ins]-=qi;div[outs]+=qo
 L=sparse.coo_matrix((np.r_[np.ones(len(i)),np.ones(len(i)),-np.ones(len(i)),-np.ones(len(i))],(np.r_[i,j,i,j],np.r_[i,j,j,i])),shape=(n,n)).tocsr()
 phi=np.zeros(n);phi[1:]=spsolve(L[1:,1:],div[1:]);correction=phi[i]-phi[j];qc=q-correction
 rem=np.bincount(i,weights=qc,minlength=n)-np.bincount(j,weights=qc,minlength=n);rem[ins]-=qi;rem[outs]+=qo
 stats=dict(flux_projection_relative_L2=float(np.linalg.norm(correction)/np.linalg.norm(q)),max_residual_divergence_mm3_s=float(abs(rem).max()),net_boundary_Q_mm3_s=float(qo.sum()-qi.sum()),field_sha256=hashlib.sha256(path.read_bytes()).hexdigest())
 return dict(x=x,v=v,h=h,n=n,i=i,j=j,q=qc,ins=ins,outs=outs,qi=qi,qo=qo,stats=stats)

def direct_check():
 import run_flow as flow
 low=json.loads((P/'results'/f'{CASE}_dx0.3_near1mLmin.json').read_text());drho=low['drho']/low['Q_actual_mL_min']*5
 high=flow.solve(CASE,dx=.3,drho=drho,tau=.55,max_steps=80000,tag_suffix='_near5mLmin',result_subdir='operating_velocity_results')
 assert high['converged']
 a=np.load(P/'results'/f'{CASE}_dx0.3_near1mLmin_field.npz');b=np.load(P/'operating_velocity_results'/f'{CASE}_dx0.3_near5mLmin_field.npz')
 v1=a['velocity_m_s']/float(a['Q_mL_min']);v5=b['velocity_m_s']/float(b['Q_mL_min'])
 result=dict(reference_flow_mL_min=low['Q_actual_mL_min'],high_flow_mL_min=high['Q_actual_mL_min'],same_grid_mm=.3,same_tau=.55,normalized_velocity_relative_L2=float(np.linalg.norm(v5-v1)/np.linalg.norm(v1)),normalized_pressure_drop_relative_change=high['dp_at_1mLmin_Pa']/low['dp_at_1mLmin_Pa']-1,normalized_near_liquid_P95_relative_change=high['worst_near_liquid_p95_mm_s']/low['worst_near_liquid_p95_mm_s']-1,max_Mach=high['last_residual']['max_Mach'],relative_density_range=high['relative_density_range'],converged=high['converged'],scope='Same grid and relaxation parameter comparison, flow amplitude differs. Finite-inertia and boundary effects remain; not a continuum grid-independence proof.')
 (P/'operating_direct_flow_check.json').write_text(json.dumps(result,indent=2));return P/'operating_velocity_results'/f'{CASE}_dx0.3_near5mLmin_field.npz'

def main():
 p=argparse.ArgumentParser();p.add_argument('--run',action='store_true');p.add_argument('--checks',action='store_true');p.add_argument('--refine',action='store_true');p.add_argument('--selected-checks',action='store_true');a=p.parse_args()
 if a.run:
  for Q in QS:
   for D in DS:solve(Q,D)
 if a.refine:
  refinement=json.loads((P/'operating_refinement_config.json').read_text())
  for Q in refinement['Q_mL_min']:
   for D in refinement['Dgas_mm2_s']:solve(Q,D)
 if a.checks:
  # Upper sampled flow is checked before any target-based recommendation is made.
  solve(5,10,dt=.125);solve(5,10,dx=.3,dt=.25)
  path=direct_check();solve(5,10,dx=.3,dt=.25,field_path=path,label='_direct5')
  solve(.25,10,dt=.5)
 if a.selected_checks:
  cfg=json.loads((P/'operating_selected_check_config.json').read_text())
  for check in cfg['checks']:solve(cfg['Q_mL_min'],cfg['Dgas_mm2_s'],dx=check['dx_mm'],dt=check['dt_s'])
if __name__=='__main__':main()
