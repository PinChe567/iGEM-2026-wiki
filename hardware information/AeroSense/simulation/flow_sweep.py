""" perforated-plate screening. Case solver used by the 27-case full factorial plus no-plate CFD control.
Actual CFD does NOT silently substitute a resistance formula for a velocity field.
Windows accelerator: compile LbmCore.cs with csc; otherwise --engine numpy.
python flow_sweep.py --case base --dx .4
python flow_sweep.py --all --dx .4 --workers 2
"""
from pathlib import Path
import numpy as np,json,csv,struct,subprocess,time,argparse,concurrent.futures,itertools
import airflow_lbm as lb
HERE=Path(__file__).resolve().parent
ZLIQ=43+150/(4.7*3.4)
CASES={
 'base':dict(d=1.6,nx=4,ny=3,gap=1.5,plate=True),
 'no_plate':dict(d=1.6,nx=4,ny=3,gap=1.5,plate=False),
 'diameter_2p0':dict(d=2.,nx=4,ny=3,gap=1.5,plate=True),
 'diameter_2p4':dict(d=2.4,nx=4,ny=3,gap=1.5,plate=True),
 'holes_4':dict(d=1.6,nx=2,ny=2,gap=1.5,plate=True),
 'holes_6':dict(d=1.6,nx=3,ny=2,gap=1.5,plate=True),
 'gap_3p0':dict(d=1.6,nx=4,ny=3,gap=3.,plate=True),
 'gap_4p5':dict(d=1.6,nx=4,ny=3,gap=4.5,plate=True)}

def configure(cfg):
 zin=64.2+cfg['gap'];roof=zin+3.3
 def gas(p,baffle=True):
  x,y,z=p.T;m=(abs(x)<7)&(abs(y)<5.5)&(z>60)&(z<roof-1.8)
  for sx,sy in [(1,1),(-1,1),(-1,-1),(1,-1)]:m|=(abs(x-sx*3.3)<2.35)&(abs(y-sy*2.65)<1.7)&(z>ZLIQ)&(z<60.01)
  m|=(x>-23)&(x<-6.9)&(y*y+(z-zin)**2<1.2**2)
  m|=(x>6.9)&(x<23)&(y*y+(z-61.5)**2<1.2**2)
  if cfg['plate']:
   holes=np.zeros(len(p),bool)
   for xx in np.linspace(-4.8,4.8,cfg['nx']):
    for yy in np.linspace(-3.4,3.4,cfg['ny']):holes|=(x-xx)**2+(y-yy)**2<(cfg['d']/2)**2
   m&=~((z>63)&(z<64.2)&~holes)
  return m
 lb.in_gas=gas;lb.ZLIQ=ZLIQ;lb.DOMAIN_TOP=roof-1.6

def solve(case,dx=.4,engine='csharp',max_steps=24000,benchmark=False,warm_grid=None):
 cfg=CASES[case];configure(cfg);tag=('tube' if benchmark else case)+f'_dx{dx:g}';out=HERE/'flow'/tag;out.parent.mkdir(exist_ok=True)
 prev=None
 if Path(str(out)+'.json').exists():
  prev=json.loads(Path(str(out)+'.json').read_text())
  if prev['converged']:return prev
  # Preserve an unconverged trial and continue from its macroscopic field.
  import shutil
  for ext in ['.json','_convergence.csv']:
   shutil.copy2(Path(str(out)+ext),Path(str(out)+'_unconverged_trial'+ext))
 start=time.time();p,ijk,mask,links,ins,outs,bi,bo,axes=lb.domain(dx,True,benchmark);n=len(p)
 inp=Path(str(out)+'.input');drho=.001
 with inp.open('wb') as f:
  f.write(struct.pack('<iidd',n,max_steps,drho,dx))
  for a in [links.ravel(),ins,outs,bi,bo]:f.write(struct.pack('<i',len(a)));f.write(np.array(a,dtype='<i4').tobytes())
  init=1+drho*(p[:,0].max()-p[:,0])/(p[:,0].max()-p[:,0].min());vel0=np.zeros((n,3))
  if prev:
   old=np.load(Path(str(out)+'_field.npz'));assert np.allclose(old['xyz_mm'],p)
   init=1+old['pressure_Pa']/(lb.RHO*(.15/dx)**2/3);vel0=old['velocity_m_s']/(.15/dx)
  elif warm_grid:
   # Nearest-cell warm start only. Final convergence must still be established.
   old=np.load(warm_grid);po=old['xyz_mm'];do=float(old['dx_mm']);dims=old['shape'];lookup=np.full(tuple(dims),-1,int);lookup[tuple(old['ijk'].T)]=np.arange(len(po))
   origin=po[0]-old['ijk'][0]*do;ix=np.rint((p-origin)/do).astype(int);valid=np.all((ix>=0)&(ix<dims),axis=1);ids=np.full(n,-1,int);ids[valid]=lookup[tuple(ix[valid].T)];good=ids>=0
   init[good]=1+old['pressure_Pa'][ids[good]]/(lb.RHO*(.15/do)**2/3)
   vel0[good]=old['velocity_m_s'][ids[good]]*(do/dx)**2/(.15/dx)
  f.write(init.astype('<f8').tobytes());f.write(vel0.astype('<f8').tobytes())
 if engine=='numpy':
  import shutil
  native=out.parent/('numpy_'+tag);native.mkdir(exist_ok=True);old_here=lb.HERE;lb.HERE=native
  rr=lb.solve(dx,True,benchmark,max_steps=max_steps,resume_from=Path(str(out)+'_field.npz') if prev else None);lb.HERE=old_here
  nt=('benchmark' if benchmark else 'baffle')+f'_dx{dx:g}_drho0.001'
  ff=np.load(native/(nt+'_field.npz'));steps=rr['steps'];converged=rr['converged_by_declared_criteria']
  rho=1+ff['pressure_Pa']/(lb.RHO*(.15/dx)**2/3);u=ff['velocity_m_s']/(.15/dx)
  shutil.copy2(native/(nt+'_convergence.csv'),Path(str(out)+'_convergence.csv'))
 else:
  core=HERE/'LbmCoreFast.exe'
  if not core.exists():core=HERE/'LbmCore.exe'
  with Path(str(out)+'.log').open('w') as log:subprocess.run([str(core),str(inp),str(out)],stdout=log,stderr=subprocess.STDOUT,check=True)
  raw=Path(str(out)+'.bin').read_bytes();steps,converged=struct.unpack_from('<i?',raw);a=np.frombuffer(raw,dtype='<f8',offset=5).reshape(n,4);rho=a[:,0];u=a[:,1:]
 uscale=.15/dx;pscale=lb.RHO*uscale**2/3;dm=dx*.001;vel=u*uscale;pres=(rho-1)*pscale
 qvol=(u[bi,0].sum()+u[bo,0].sum())*.5*uscale*dm*dm;qml=qvol*6e7;dp=drho*pscale;s=1/qml
 speed=np.linalg.norm(vel,axis=1);heads=[]
 for quad,(sx,sy) in zip(['NE','NW','SW','SE'],[(1,1),(-1,1),(-1,-1),(1,-1)]):
  sel=(abs(p[:,0]-sx*3.3)<2.35)&(abs(p[:,1]-sy*2.65)<1.7)&(p[:,2]<58.3)
  surface=sel&(p[:,2]<ZLIQ+dx*1.1)
  if not benchmark:heads.append(dict(quadrant=quad,mean_speed_at_1mLmin_mm_s=float(speed[sel].mean()*s*1000),surface_max_speed_at_1mLmin_mm_s=float(speed[surface].max()*s*1000)))
 hist=list(csv.DictReader(Path(str(out)+'_convergence.csv').open()));last={k:float(v) for k,v in hist[-1].items()}
 res=dict(case=case,configuration=cfg,dx_mm=dx,engine='C# double-precision D3Q19 BGK; same equations as NumPy reference',fluid_nodes=n,steps=steps,total_steps=steps+(prev.get('total_steps',prev['steps']) if prev else 0),warm_start=bool(prev),converged=converged,last_residual=last,Q_actual_mL_min=qml,dp_actual_Pa=dp,dp_at_1mLmin_Pa=dp*s,Q_at_0p01Pa_mL_min=qml*.01/dp,max_speed_at_1mLmin_mm_s=float(speed.max()*s*1000),well_headspaces=heads,gas_volume_voxel_uL=n*dx**3,runtime_seconds=time.time()-start,port_Re_actual=float(lb.RHO*qvol/(np.pi*.0012**2)*.0024/lb.MU),assumptions='Isothermal low-Re air; rigid no-slip gas/liquid interfaces; no evaporation, mass transfer, cells, filter or external tubing. Fixed-Q and fixed-dp results use Stokes scaling, not additional solved cases.')
 if benchmark:
  L=np.ptp(p[:,0])*.001;exact=np.pi*.0012**4*dp/(8*lb.MU*L);res['tube_Q_relative_error']=qvol/exact-1
 else:
  zplane=axes[2][np.argmin(abs(axes[2]-63.6))];at=abs(p[:,2]-zplane)<dx*.1
  res['plate_downward_net_flux_mL_min']=float(-vel[at,2].sum()*dm*dm*6e7)
  res['plate_flux_relative_difference_vs_terminal_Q']=res['plate_downward_net_flux_mL_min']/qml-1
 np.savez_compressed(Path(str(out)+'_field.npz'),xyz_mm=p,velocity_m_s=vel,pressure_Pa=pres,ijk=ijk,shape=np.array(mask.shape),dx_mm=dx,Q_mL_min=qml)
 res['engine']='NumPy reference' if engine=='numpy' else 'C# double-precision D3Q19 BGK accelerator'
 res['coarser_grid_warm_start']=str(warm_grid) if warm_grid else None
 Path(str(out)+'.json').write_text(json.dumps(res,indent=2));inp.unlink()
 if Path(str(out)+'.bin').exists():Path(str(out)+'.bin').unlink()
 print(tag,'done',steps,round(res['runtime_seconds'],1),'seconds',flush=True);return res

def analytic():
 rows=[];mu=1.8e-5;Q=1e-6/60
 for d,(nx,ny),gap in itertools.product([1.6,2.,2.4],[(2,2),(3,2),(4,3)],[1.5,3.,4.5]):
  n=nx*ny;area=n*np.pi*(d/2)**2;r=d*.001/2;t=.0012
  # Short-hole estimate: Poiseuille bore + Sampson entrance resistance, parallel holes.
  Rh=(8*mu*t/(np.pi*r**4)+3*mu/r**3)/n
  rows.append(dict(hole_d_mm=d,holes=n,nx=nx,ny=ny,inlet_axis_to_plate_top_mm=gap,open_area_fraction=area/154,hole_mean_axial_speed_mm_s=1000/60/area,hole_Re=lb.RHO*(1000/60/area*.001)*(d*.001)/mu,plate_only_dp_Pa_at_1mLmin=Rh*Q,plate_to_liquid_gap_mm=63-ZLIQ,model='Reduced resistance estimate only. Gap has no effect in this lumped model; CFD required.'))
 with (HERE/'analytic_27_cases.csv').open('w',newline='') as f:w=csv.DictWriter(f,rows[0]);w.writeheader();w.writerows(rows)
 (HERE/'sweep_design.json').write_text(json.dumps(dict(actual_3D_OAT_cases=CASES,analytic_full_factorial_count=27,dimensions=['diameter','hole count / density','inlet-axis-to-plate top vertical distance'],notes='Inlet is horizontal. Gap is a vertical standoff, not the curved streamline length. OAT CFD does not resolve factor interactions.'),indent=2))

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--case',choices=CASES,default='base');ap.add_argument('--all',action='store_true');ap.add_argument('--dx',type=float,default=.4);ap.add_argument('--workers',type=int,default=2);ap.add_argument('--engine',choices=['csharp','numpy'],default='csharp');ap.add_argument('--max-steps',type=int,default=24000);ap.add_argument('--benchmark',action='store_true');ap.add_argument('--warm-grid');a=ap.parse_args();analytic()
 if a.all:
  with concurrent.futures.ProcessPoolExecutor(a.workers) as ex:
   futures=[ex.submit(solve,k,a.dx,a.engine,a.max_steps,False) for k in CASES]
   for f in concurrent.futures.as_completed(futures):f.result()
 else:solve(a.case,a.dx,a.engine,a.max_steps,a.benchmark,a.warm_grid)
if __name__=='__main__':main()
