"""AeroSense gas-only design screening; actual D3Q19 BGK velocity solves.
python run_flow.py --all --dx .4 --workers 2
python run_flow.py --case wall_w6_g0 --dx .3
No turbulence, cellular shear or odor transport is asserted by this model.
"""
from pathlib import Path
import argparse, concurrent.futures, csv, json, math, struct, subprocess, time
import numpy as np
import lbm_reference as lb
HERE=Path(__file__).resolve().parent
GEOM=dict(well_centers=[[3.3,2.65],[-3.3,2.65],[-3.3,-2.65],[3.3,-2.65]],inner_width=4.,inner_depth=2.8,liquid_uL=100.,floor=43.,well_top=55.5,plenum_bottom=57.3,plenum_top=62.5,plenum_half_x=7.4,plenum_half_y=6.,port_z=60.8,port_radius=1.2,port_end=18.,wall_xmin=-4.8,wall_xmax=-3.6,compression_plate_bottom=56.1,compression_plate_top=57.3,upper_perimeter_gasket_bottom=57.3,upper_perimeter_gasket_top=57.9)
CASES={'open':dict(kind='open'),'perforated':dict(kind='perforated',diameter=1.6,nx=4,ny=3,plate_bottom=58.2,plate_top=59.4)}
for width in [4,6,8]:
 for gap in [0,1.5,3]:
  CASES[f'wall_w{width}_g{str(gap).replace(".","p")}']=dict(kind='wall',width=width,bottom_gap=gap)
for width in [4,6,8]:
 CASES[f'hood_w{width}']=dict(kind='hood',width=width,shelf_bottom=58.2,shelf_top=59.4,shelf_end=-3.6)
for width in [4,8]:
 for end in [-3.6,-.2]:
  CASES[f'shelf_w{width}_e{str(-end).replace(".","p")}']=dict(kind='shelf',width=width,shelf_bottom=58.2,shelf_top=59.4,shelf_end=end)
def gas_points(points, cfg):
 x,y,z=points.T;g=GEOM;zl=g['floor']+g['liquid_uL']/(g['inner_width']*g['inner_depth'])
 m=(abs(x)<g['plenum_half_x'])&(abs(y)<g['plenum_half_y'])&(z>g['plenum_bottom'])&(z<g['plenum_top'])
 for cx,cy in g['well_centers']:
  m|=(abs(x-cx)<g['inner_width']/2)&(abs(y-cy)<g['inner_depth']/2)&(z>zl)&(z<g['plenum_bottom']+.001)
 m|=(x>-g['port_end'])&(x<-g['plenum_half_x']+.01)&(y*y+(z-g['port_z'])**2<g['port_radius']**2)
 m|=(x>g['plenum_half_x']-.01)&(x<g['port_end'])&(y*y+(z-g['port_z'])**2<g['port_radius']**2)
 if cfg['kind']=='wall':
  m&=~((x>g['wall_xmin'])&(x<g['wall_xmax'])&(abs(y)<cfg['width']/2)&(z>g['plenum_bottom']+cfg['bottom_gap']))
 if cfg['kind'] in ['hood','shelf']:
  m&=~((x>-g['plenum_half_x'])&(x<cfg['shelf_end'])&(abs(y)<cfg['width']/2)&(z>cfg['shelf_bottom'])&(z<cfg['shelf_top']))
  if cfg['kind']=='hood':m&=~((x>g['wall_xmin'])&(x<g['wall_xmax'])&(abs(y)<cfg['width']/2)&(z>cfg['shelf_top']))
 if cfg['kind']=='perforated':
  holes=np.zeros(len(points),bool)
  centers=cfg.get('centers',[[float(xx),float(yy)] for xx in np.linspace(-4.8,4.8,cfg.get('nx',4)) for yy in np.linspace(-3.4,3.4,cfg.get('ny',3))])
  for xx,yy in centers:holes|=(x-xx)**2+(y-yy)**2<(cfg['diameter']/2)**2
  m&=~((z>cfg['plate_bottom'])&(z<cfg['plate_top'])&~holes)
 return m
def domain(dx,cfg,benchmark=False):
 if benchmark:
  axes=[np.arange(-6+dx/2,6,dx),np.arange(-1.2+dx/2,1.2,dx),np.arange(-1.2+dx/2,1.2,dx)]
 else:
  z=GEOM['floor']+GEOM['liquid_uL']/(GEOM['inner_width']*GEOM['inner_depth'])
  axes=[np.arange(-GEOM['port_end']+dx/2,GEOM['port_end'],dx),np.arange(-6+dx/2,6,dx),np.arange(z+dx/2,GEOM['plenum_top'],dx)]
 xyz=np.stack(np.meshgrid(*axes,indexing='ij'),-1)
 mask=(xyz[...,1]**2+xyz[...,2]**2<1.2**2) if benchmark else gas_points(xyz.reshape(-1,3),cfg).reshape(xyz.shape[:-1])
 ijk=np.argwhere(mask);p=xyz[mask];n=len(p);ids=np.full(mask.shape,-1,int);ids[mask]=np.arange(n)
 links=np.empty((19,n),np.int64)
 for q,c in enumerate(lb.C):
  src=ijk-c;valid=np.all((src>=0)&(src<mask.shape),1);a=np.full(n,-1,int);a[valid]=ids[tuple(src[valid].T)]
  links[q]=np.where(a>=0,q*n+a,lb.OPP[q]*n+np.arange(n))
 inlet=np.where(ijk[:,0]==0)[0];outlet=np.where(ijk[:,0]==mask.shape[0]-1)[0]
 bi=ids[tuple((ijk[inlet]+[1,0,0]).T)];bo=ids[tuple((ijk[outlet]-[1,0,0]).T)]
 assert len(inlet)>0 and len(outlet)>0 and np.all(bi>=0) and np.all(bo>=0)
 return p,ijk,mask,links,inlet,outlet,bi,bo,axes
def solve(case,dx=.4,drho=.0002,max_steps=20000,benchmark=False,engine='csharp',tag_suffix='',tau=.8,force=False,result_subdir='results'):
 cfg=CASES[case];tag=('tube' if benchmark else case)+f'_dx{dx:g}'+tag_suffix;out=HERE/result_subdir/tag;out.parent.mkdir(exist_ok=True)
 if Path(str(out)+'.json').exists() and not force:
  r=json.loads(Path(str(out)+'.json').read_text())
  if r['converged'] and r.get('geometry')==GEOM and r.get('configuration')==cfg and abs(r['drho']-drho)<1e-15 and abs(r.get('tau',.8)-tau)<1e-15:return r
 start=time.time();p,ijk,mask,links,ins,outs,bi,bo,axes=domain(dx,cfg,benchmark);n=len(p)
 init=1+drho*(p[:,0].max()-p[:,0])/(p[:,0].max()-p[:,0].min());vel0=np.zeros((n,3))
 inp=Path(str(out)+'.input')
 with inp.open('wb') as f:
  f.write(struct.pack('<iidd',n,max_steps,drho,dx))
  for a in [links.ravel(),ins,outs,bi,bo]:f.write(struct.pack('<i',len(a)));f.write(np.array(a,dtype='<i4').tobytes())
  f.write(init.astype('<f8').tobytes());f.write(vel0.astype('<f8').tobytes());f.write(struct.pack('<d',tau))
 if engine=='csharp':
  exe=HERE/('LbmCoreFast.exe' if tau==.8 else 'LbmCorePhysical.exe')
  if not exe.exists():raise FileNotFoundError('Build LbmCoreFast.exe with build_solver.ps1, or select --engine numpy')
  with Path(str(out)+'.log').open('w') as log:subprocess.run([str(exe),str(inp),str(out)],stdout=log,stderr=subprocess.STDOUT,check=True)
  raw=Path(str(out)+'.bin').read_bytes();steps,converged=struct.unpack_from('<i?',raw);a=np.frombuffer(raw,dtype='<f8',offset=5).reshape(n,4);rho=a[:,0];u=a[:,1:]
 else:
  f=lb.W[:,None]*init[None,:];uold=np.zeros((3,n));history=[];stable=0
  for step in range(1,max_steps+1):
   rho,u=lb.macro(f);post=f-(f-lb.equilibrium(rho,u))/tau;f=post.ravel()[links]
   for face,near,target in [(ins,bi,1+drho),(outs,bo,1.)]:
    rn,un=lb.macro(f[:,near]);f[:,face]=lb.equilibrium(np.full(len(face),target),un)+f[:,near]-lb.equilibrium(rn,un)
   if step%200==0:
    rho,u=lb.macro(f);qi=float((rho[bi]*u[0,bi]).sum());qo=float((rho[bo]*u[0,bo]).sum());change=float(np.linalg.norm(u-uold)/(np.linalg.norm(u)+1e-30));imb=abs(qi-qo)/max(abs(qi),abs(qo),1e-30)
    history.append(dict(step=step,velocity_relative_change_over_200_steps=change,mass_flux_imbalance=imb,max_Mach=float(np.linalg.norm(u,axis=0).max()*np.sqrt(3)),Q_in_mL_min=qi*(.045/(tau-.5)/dx)*(dx*.001)**2*6e7));uold=u.copy()
    stable=stable+1 if change<2e-5 and imb<.002 else 0
    if stable>=3:break
  rho,u=lb.macro(f);u=u.T;steps=step;converged=stable>=3
  with Path(str(out)+'_convergence.csv').open('w',newline='') as f:w=csv.DictWriter(f,list(history[0]));w.writeheader();w.writerows(history)
 uscale=.045/(tau-.5)/dx;pscale=lb.RHO*uscale**2/3;dm=dx*.001;vel=u*uscale;pres=(rho-1)*pscale
 qvol=(u[bi,0].sum()+u[bo,0].sum())*.5*uscale*dm*dm;qml=qvol*6e7;dp=drho*pscale;s=1/qml
 hist=list(csv.DictReader(Path(str(out)+'_convergence.csv').open()));last={k:float(v) for k,v in hist[-1].items()}
 r=dict(case=case,configuration=cfg,geometry=GEOM,dx_mm=dx,drho=drho,tau=tau,relative_density_range=float((rho.max()-rho.min())/rho.mean()),engine=engine,fluid_nodes=n,steps=steps,converged=converged,last_residual=last,Q_actual_mL_min=qml,dp_actual_Pa=dp,dp_at_1mLmin_Pa=dp*s,gas_volume_voxel_uL=n*dx**3,port_Re_actual=float(lb.RHO*qvol/(np.pi*.0012**2)*.0024/lb.MU),port_Re_at_1mLmin=.5894627522,runtime_seconds=time.time()-start)
 if benchmark:
  L=np.ptp(p[:,0])*.001;exact=np.pi*.0012**4*dp/(8*lb.MU*L);r['tube_Q_relative_error']=qvol/exact-1
 else:
  zl=GEOM['floor']+GEOM['liquid_uL']/(GEOM['inner_width']*GEOM['inner_depth']);vn=vel*s;heads=[];speed=np.linalg.norm(vn,axis=1)
  # A physical sampling plane one mm below the well rim, not the no-slip first cell.
  plane=float(axes[2][np.argmin(abs(axes[2]-(GEOM['well_top']-1)))])
  for quad,(cx,cy) in zip(['NE','NW','SW','SE'],GEOM['well_centers']):
   inside=(abs(p[:,0]-cx)<2)&(abs(p[:,1]-cy)<1.4)
   near=inside&(p[:,2]>=zl+.6)&(p[:,2]<=zl+1.4)
   sample=inside&(abs(p[:,2]-plane)<dx*.1)
   down=np.maximum(-vn[sample,2],0);down_near=np.maximum(-vn[near,2],0)
   heads.append(dict(well=quad,near_liquid_speed_p95_mm_s=float(np.percentile(speed[near]*1000,95)),near_liquid_downward_speed_p95_mm_s=float(np.percentile(down_near*1000,95)),mouth_downward_momentum_N=float(lb.RHO*np.sum(down**2)*dm**2),mouth_downward_gross_flux_mL_min=float(np.sum(down)*dm**2*6e7),sample_plane_z_mm=plane))
  j=np.array([h['mouth_downward_momentum_N'] for h in heads]);flux=np.array([h['mouth_downward_gross_flux_mL_min'] for h in heads])
  r.update(wells=heads,worst_mouth_downward_momentum_N=float(j.max()),summed_mouth_downward_momentum_N=float(j.sum()),mouth_flux_CV=float(flux.std()/flux.mean()) if flux.mean()>0 else None,worst_near_liquid_p95_mm_s=max(h['near_liquid_speed_p95_mm_s'] for h in heads),worst_near_liquid_downward_p95_mm_s=max(h['near_liquid_downward_speed_p95_mm_s'] for h in heads),blocks_inlet_axis=cfg['kind'] in ['wall','hood'])
  r['scope']='Gas-only isothermal rigid-wall CFD. Stationary no-slip liquid boundary. No cells, liquid motion, aerosols, evaporation, dissolved odor, external filters or tubing. All 1 mL/min fields/metrics are linear Stokes-normalized unless a target-flow confirmation is identified. Mouth momentum is a gas-direction proxy, NOT cell shear or measured damage. Gas circulation flux is NOT odor exchange rate.'
 np.savez_compressed(Path(str(out)+'_field.npz'),xyz_mm=p,velocity_m_s=vel,pressure_Pa=pres,ijk=ijk,shape=np.array(mask.shape),dx_mm=dx,Q_mL_min=qml)
 Path(str(out)+'.json').write_text(json.dumps(r,indent=2));inp.unlink()
 if Path(str(out)+'.bin').exists():Path(str(out)+'.bin').unlink()
 print(tag,'converged',converged,'steps',steps,'seconds',round(time.time()-start,1),flush=True)
 return r
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--case',choices=CASES,default='open');ap.add_argument('--all',action='store_true');ap.add_argument('--dx',type=float,default=.4);ap.add_argument('--workers',type=int,default=2);ap.add_argument('--drho',type=float,default=.0002);ap.add_argument('--max-steps',type=int,default=20000);ap.add_argument('--benchmark',action='store_true');ap.add_argument('--engine',choices=['csharp','numpy'],default='csharp');ap.add_argument('--tag-suffix',default='');ap.add_argument('--tau',type=float,default=.8);ap.add_argument('--force',action='store_true');a=ap.parse_args()
 (HERE/'geometry_and_cases.json').write_text(json.dumps(dict(geometry=GEOM,cases=CASES),indent=2))
 if a.all:
  with concurrent.futures.ProcessPoolExecutor(a.workers) as ex:
   futures=[ex.submit(solve,k,a.dx,a.drho,a.max_steps,False,a.engine,a.tag_suffix,a.tau,a.force) for k in CASES]
   for f in concurrent.futures.as_completed(futures):
    if not f.result()['converged']:raise RuntimeError('A case failed convergence; inspect residuals')
 else:solve(a.case,a.dx,a.drho,a.max_steps,a.benchmark,a.engine,a.tag_suffix,a.tau,a.force)
if __name__=='__main__':main()
