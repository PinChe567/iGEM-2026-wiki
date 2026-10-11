""" horizontal perforated partition, genuine 3-D D3Q19 BGK lattice-Boltzmann screening solver (NumPy only).
mm geometry; SI output. Fixed 150 uL liquid in each well. Gas only.
Halfway bounce-back on all solid AND stationary liquid-surface boundaries.
Pressure planes: non-equilibrium extrapolation using adjacent interior plane.
This is our own implementation, not a run of Palabos/OpenFOAM.
Run: python airflow_lbm.py --dx 0.4 --baffle 1
Benchmark: python airflow_lbm.py --benchmark --dx 0.2
"""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
os.environ.setdefault('OMP_NUM_THREADS','1')
from pathlib import Path
import numpy as np, json, argparse, time, csv
C=np.array([[0,0,0],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],
 [1,1,0],[-1,-1,0],[1,-1,0],[-1,1,0],[1,0,1],[-1,0,-1],[1,0,-1],[-1,0,1],
 [0,1,1],[0,-1,-1],[0,1,-1],[0,-1,1]],dtype=int)
W=np.array([1/3]+[1/18]*6+[1/36]*12)
OPP=np.array([np.where(np.all(C==-c,axis=1))[0][0] for c in C])
HERE=Path(__file__).resolve().parent
RHO=1.2; MU=1.8e-5; NU=MU/RHO; TAU=.8; NUL=(TAU-.5)/3
ZLIQ=43+150/(4.7*3.4)
DOMAIN_TOP=67.4

HOLE_X=[-4.8,-1.6,1.6,4.8]
HOLE_Y=[-3.4,0,3.4]
def in_gas(p,baffle=True):
 x,y,z=p.T
 m=(abs(x)<7)&(abs(y)<5.5)&(z>60)&(z<67.2)
 for sx,sy in [(1,1),(-1,1),(-1,-1),(1,-1)]:
  m|=(abs(x-sx*3.3)<2.35)&(abs(y-sy*2.65)<1.7)&(z>ZLIQ)&(z<60.01)
 m|=(x>-23)&(x<-6.9)&(y*y+(z-65.7)**2<1.2**2)
 m|=(x>6.9)&(x<23)&(y*y+(z-61.5)**2<1.2**2)
 if baffle:
  holes=np.zeros(len(p),bool)
  for xx in HOLE_X:
   for yy in HOLE_Y:holes|=(x-xx)**2+(y-yy)**2<.8**2
  m&=~((z>63)&(z<64.2)&~holes)
 return m

def domain(dx,baffle,benchmark):
 # Cell-centred nodes; X terminal planes one half-cell inside STL port ends.
 if benchmark:
  axes=[np.arange(-6+dx/2,6,dx),np.arange(-1.2+dx/2,1.2,dx),np.arange(-1.2+dx/2,1.2,dx)]
 else:axes=[np.arange(-23+dx/2,23,dx),np.arange(-5.7+dx/2,5.7,dx),np.arange(ZLIQ+dx/2,DOMAIN_TOP,dx)]
 xyz=np.stack(np.meshgrid(*axes,indexing='ij'),-1)
 mask=(xyz[...,1]**2+xyz[...,2]**2<1.2**2) if benchmark else in_gas(xyz.reshape(-1,3),baffle).reshape(xyz.shape[:-1])
 ijk=np.argwhere(mask);p=xyz[mask];N=len(p);ids=np.full(mask.shape,-1,int);ids[mask]=np.arange(N)
 links=np.empty((19,N),np.int64)
 for q,c in enumerate(C):
  src=ijk-c;valid=np.all((src>=0)&(src<mask.shape),axis=1);n=np.full(N,-1,int)
  n[valid]=ids[tuple(src[valid].T)];ok=n>=0
  links[q]=np.where(ok,q*N+n,OPP[q]*N+np.arange(N))
 inlet=np.where(ijk[:,0]==0)[0];outlet=np.where(ijk[:,0]==mask.shape[0]-1)[0]
 # Fluid terminals must have identical interior neighbours, else BC is unsupported.
 bi=ids[tuple((ijk[inlet]+[1,0,0]).T)];bo=ids[tuple((ijk[outlet]-[1,0,0]).T)]
 assert len(inlet)>0 and len(outlet)>0 and np.all(bi>=0) and np.all(bo>=0)
 return p,ijk,mask,links,inlet,outlet,bi,bo,axes

def macro(f):
 rho=f.sum(0);u=(C.T@f)/rho
 return rho,u

def equilibrium(rho,u):
 cu=C@u;us=(u*u).sum(0)
 return W[:,None]*rho[None,:]*(1+3*cu+4.5*cu*cu-1.5*us[None,:])

def solve(dx=.4,baffle=True,benchmark=False,drho=.001,max_steps=24000,resume_from=None):
 start=time.time();p,ijk,mask,links,ins,outs,bi,bo,axes=domain(dx,baffle,benchmark);N=len(p)
 rho0=1+drho*(p[:,0].max()-p[:,0])/(p[:,0].max()-p[:,0].min())
 f=W[:,None]*rho0[None,:];uold=np.zeros((3,N));history=[];stable=0
 d_m=dx*.001;dt=NUL*d_m*d_m/NU;uscale=d_m/dt;pscale=RHO*uscale**2/3
 if resume_from:
  old=np.load(resume_from);assert np.allclose(old['xyz_mm'],p)
  f=equilibrium(1+old['pressure_Pa']/pscale,old['velocity_m_s'].T/uscale)
 for step in range(1,max_steps+1):
  rho,u=macro(f);feq=equilibrium(rho,u);post=f-(f-feq)/TAU
  f=post.ravel()[links]
  for face,near,target in [(ins,bi,1+drho),(outs,bo,1.)]:
   rn,un=macro(f[:,near])
   f[:,face]=equilibrium(np.full(len(face),target),un)+f[:,near]-equilibrium(rn,un)
  if step%200==0:
   rho,u=macro(f);qin=float((rho[bi]*u[0,bi]).sum());qout=float((rho[bo]*u[0,bo]).sum())
   change=float(np.linalg.norm(u-uold)/(np.linalg.norm(u)+1e-30));imb=abs(qin-qout)/max(abs(qin),abs(qout),1e-30)
   rec={'step':step,'velocity_relative_change_over_200_steps':change,'mass_flux_imbalance':imb,'max_Mach':float(np.linalg.norm(u,axis=0).max()*np.sqrt(3)),'Q_in_mL_min':qin*uscale*d_m*d_m*6e7}
   history.append(rec);uold=u.copy()
   if step%1000==0:print('progress',dx,baffle,benchmark,rec,flush=True)
   if change<2e-5 and imb<.002:stable+=1
   else:stable=0
   if stable>=3:break
   if not np.all(np.isfinite(f)) or np.max(abs(u))>.2:raise RuntimeError('Unstable LBM')
 rho,u=macro(f);vel=u.T*uscale;pressure=(rho-1)*pscale
 qvol=(u[0,bi].sum()+u[0,bo].sum())*.5*uscale*d_m*d_m
 qml=qvol*6e7;delta_p=drho*pscale
 refscale=1/qml
 res={'revision':'','method':'3D D3Q19 BGK LBM, halfway no-slip bounce-back, non-equilibrium extrapolation pressure boundaries','dx_mm':dx,'baffle':baffle,'benchmark_circular_tube':benchmark,'fluid_nodes':N,'steps':step,'warm_start_from':str(resume_from) if resume_from else None,'converged_by_declared_criteria':stable>=3,'criteria':'velocity change over 200 steps <2e-5 AND inlet/outlet mass imbalance <0.2%, three consecutive reports','density_in_minus_out':drho,'relative_density_range':float((rho.max()-rho.min())/rho.mean()),'relaxation_tau':TAU,'dt_seconds':dt,'Q_actual_simulation_mL_min':qml,'pressure_drop_actual_simulation_Pa':delta_p,'resistance_Pa_s_per_m3':delta_p/qvol,'port_Re_at_actual_flow':RHO*qvol/(np.pi*.0012**2)*.0024/MU,'last_residual':history[-1],'runtime_seconds':time.time()-start,'boundary_notes':'Solid walls and flat fixed liquid surfaces no-slip. Gas is isothermal; no free surface, evaporation, aerosol, cells or gas dissolution. Filters/external tubing omitted. Outlet pressure is gauge reference, not a measured filter pressure.'}
 if benchmark:
  L=(p[:,0].max()-p[:,0].min())*.001;exact_q=np.pi*(.0012**4)*delta_p/(8*MU*L)
  mid=abs(p[:,0]-.5*(p[:,0].min()+p[:,0].max()))<dx*.501
  exact_u=delta_p/(4*MU*L)*(.0012**2-(p[mid,1]**2+p[mid,2]**2)*1e-6)
  res.update(analytic_Hagen_Poiseuille_Q_mL_min=exact_q*6e7,Q_relative_error=(qvol-exact_q)/exact_q,velocity_profile_relative_L2=float(np.linalg.norm(vel[mid,0]-exact_u)/np.linalg.norm(exact_u)))
 else:
  speed=np.linalg.norm(vel,axis=1);areas=[]
  for sx,sy in [(1,1),(-1,1),(-1,-1),(1,-1)]:
   sel=(abs(p[:,0]-sx*3.3)<2.35)&(abs(p[:,1]-sy*2.65)<1.7)&(p[:,2]<58.3)
   surface=sel&(p[:,2]<ZLIQ+dx*1.1)
   areas.append({'quadrant':['NE','NW','SW','SE'][len(areas)],'headspace_mean_speed_at_1mLmin_mm_s':float(speed[sel].mean()*refscale*1e3),'near_surface_max_speed_at_1mLmin_mm_s':float(speed[surface].max()*refscale*1e3),'wall_shear_proxy_at_1mLmin_Pa':float(MU*speed[surface].max()*refscale/(.5*d_m))})
  res.update(linear_Stokes_scaling_reference_mL_min=1,scaled_pressure_drop_at_1mLmin_Pa=delta_p*refscale,scaled_max_speed_at_1mLmin_mm_s=float(speed.max()*refscale*1000),gas_volume_voxel_uL=N*dx**3,well_headspaces=areas,scaling_warning='1 mL/min is a linear low-Re extrapolation; actual solved flow is reported above. Shear proxy is first-cell velocity divided by half cell width, NOT stress on submerged cells. Mean speed is NOT gas exchange rate.')
 tag=('benchmark' if benchmark else ('baffle' if baffle else 'plain'))+f'_dx{dx:g}_drho{drho:g}'
 (HERE/(tag+'.json')).write_text(json.dumps(res,indent=2),encoding='utf-8')
 with (HERE/(tag+'_convergence.csv')).open('w',newline='') as h:
  wr=csv.DictWriter(h,fieldnames=list(history[0]));wr.writeheader();wr.writerows(history)
 np.savez_compressed(HERE/(tag+'_field.npz'),xyz_mm=p,velocity_m_s=vel,pressure_Pa=pressure,ijk=ijk,shape=np.array(mask.shape),dx_mm=dx,Q_mL_min=qml)
 print('RESULT',tag,json.dumps(res),flush=True)
 return res

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--dx',type=float,default=.4);ap.add_argument('--baffle',type=int,default=1);ap.add_argument('--benchmark',action='store_true');ap.add_argument('--drho',type=float,default=.001);ap.add_argument('--max-steps',type=int,default=24000);ap.add_argument('--resume-from');a=ap.parse_args()
 solve(a.dx,bool(a.baffle),a.benchmark,a.drho,a.max_steps,a.resume_from)
