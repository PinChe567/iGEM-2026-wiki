"""Gas-only conservative 3D finite-volume scalar step response.
Uses saved LBM velocity; no liquid, membrane, cells, reactions or adsorption.
python gas_transport.py --run
All lengths mm, time s, D mm²/s, flow mm³/s; concentration C/C_inlet.
"""
from pathlib import Path
import argparse,csv,hashlib,json,time
import numpy as np
from scipy import sparse
from scipy.sparse.linalg import spsolve,factorized
import run_flow as flow
CODE=Path(__file__).resolve().parent
P=CODE/'data'
CSV=CODE.parent/'results'
OUT=P/'gas_transport_results'
CSVDIR=CSV/'gas_transport_results'
def edges(ijk,shape):
 ids=np.full(shape,-1,dtype=int);ids[tuple(ijk.T)]=np.arange(len(ijk));ii=[];jj=[];aa=[]
 for axis in range(3):
  nxt=ijk.copy();nxt[:,axis]+=1;ok=nxt[:,axis]<shape[axis];i=np.flatnonzero(ok);j=ids[tuple(nxt[ok].T)];keep=j>=0;ii.append(i[keep]);jj.append(j[keep]);aa.append(np.full(keep.sum(),axis))
 return np.concatenate(ii),np.concatenate(jj),np.concatenate(aa)
def load_field(case,dx):
 path=P/('hole_sweep_results' if case.startswith('hole_') else 'results')/f'{case}_dx{dx:g}_field.npz';d=np.load(path);x=d['xyz_mm'];ijk=d['ijk'];h=float(d['dx_mm']);n=len(x);v=d['velocity_m_s']/float(d['Q_mL_min'])*1000
 i,j,axis=edges(ijk,tuple(d['shape']));q=.5*(v[i,axis]+v[j,axis])*h*h
 ins=np.flatnonzero(ijk[:,0]==0);outs=np.flatnonzero(ijk[:,0]==max(ijk[:,0]));Q=1000/60
 qi=np.maximum(v[ins,0],0);qi=qi/qi.sum()*Q;qo=np.maximum(v[outs,0],0);qo=qo/qo.sum()*Q
 # Project interpolated face fluxes onto exact discrete incompressibility.
 # This conservative correction is quantified; it is not another Navier–Stokes solve.
 div=np.bincount(i,weights=q,minlength=n)-np.bincount(j,weights=q,minlength=n);div[ins]-=qi;div[outs]+=qo
 L=sparse.coo_matrix((np.r_[np.ones(len(i)),np.ones(len(i)),-np.ones(len(i)),-np.ones(len(i))],(np.r_[i,j,i,j],np.r_[i,j,j,i])),shape=(n,n)).tocsr()
 phi=np.zeros(n);phi[1:]=spsolve(L[1:,1:],div[1:]);correction=phi[i]-phi[j];qc=q-correction
 rem=np.bincount(i,weights=qc,minlength=n)-np.bincount(j,weights=qc,minlength=n);rem[ins]-=qi;rem[outs]+=qo
 stats=dict(flux_projection_relative_L2=float(np.linalg.norm(correction)/np.linalg.norm(q)),max_residual_divergence_mm3_s=float(abs(rem).max()),net_boundary_Q_mm3_s=float(qo.sum()-qi.sum()),field_sha256=hashlib.sha256(path.read_bytes()).hexdigest())
 return dict(x=x,v=v,h=h,n=n,i=i,j=j,q=qc,ins=ins,outs=outs,qi=qi,qo=qo,stats=stats)
def operator(f,D,advection=True):
 i,j,q=f['i'],f['j'],f['q'] if advection else np.zeros(len(f['q']));n=f['n'];g=D*f['h'];qp=np.maximum(q,0);qm=np.minimum(q,0)
 a=sparse.coo_matrix((np.r_[g+qp,g-qm,-g+qm,-g-qp],(np.r_[i,j,i,j],np.r_[i,j,j,i])),shape=(n,n)).tocsc()
 diag=np.zeros(n);b=np.zeros(n);gd=2*D*f['h'];diag[f['ins']]+=gd;b[f['ins']]+=gd
 if advection:diag[f['outs']]+=f['qo'];b[f['ins']]+=f['qi']
 a+=sparse.diags(diag);return a,b
def regions(f):
 x=f['x'];zl=flow.GEOM['floor']+100/11.2;regs={};sampling={}
 for well,(cx,cy) in zip(['NE','NW','SW','SE'],flow.GEOM['well_centers']):
  inside=(abs(x[:,0]-cx)<2)&(abs(x[:,1]-cy)<1.4);zs=np.unique(x[inside,2]);rim=zs[np.argmin(abs(zs-55.5))]
  regs[well+'_rim']=inside&(abs(x[:,2]-rim)<f['h']*.1)
  regs[well+'_headspace']=inside&(x[:,2]>zl)&(x[:,2]<55.5)
  regs[well+'_near_liquid']=inside&(x[:,2]>=zl+.6)&(x[:,2]<=zl+1.4)
  sampling[well]=dict(rim_sample_z_mm=float(rim),liquid_surface_z_mm=zl,well_rim_z_mm=55.5,headspace_depth_mm=55.5-zl,near_liquid_band_mm=[zl+.6,zl+1.4])
 regs['whole_gas']=np.ones(f['n'],bool)
 return regs,sampling
def crossing(t,c,value):
 ids=np.flatnonzero(c>=value)
 if not len(ids):return None
 k=ids[0]
 return float(t[k]) if k==0 else float(np.interp(value,[c[k-1],c[k]],[t[k-1],t[k]]))
def solve(case,D=10,dx=.4,dt=.5,T=300,advection=True):
 CSVDIR.mkdir(parents=True,exist_ok=True)
 OUT.mkdir(exist_ok=True);tag=f'{case}_D{D:g}_dx{dx:g}_dt{dt:g}'+('' if advection else '_diffusion_only');out=OUT/tag
 if Path(str(out)+'.json').exists():
  cached=json.loads(Path(str(out)+'.json').read_text())
  if not advection:
   for v in cached['velocity_scales']:v.update(near_liquid_speed_p95_mm_s=0.,local_Re_p95=0.,local_Pe_p95=0.,advective_L_over_U_s=None)
   Path(str(out)+'.json').write_text(json.dumps(cached,indent=2))
  return cached
 start=time.time();f=load_field(case,dx);a,b=operator(f,D,advection);V=f['h']**3;step=factorized(a+sparse.eye(f['n'],format='csc')*(V/dt));c=np.zeros(f['n']);regs,sampling=regions(f);names=list(regs);history=[];balance=[];snap=[];snap_times=[];cum=0.;minc=0.;maxc=0.;maxerr=0.
 for k in range(round(T/dt)+1):
  t=k*dt;history.append([t]+[float(c[m].mean()) for m in regs.values()])
  if abs(t/10-round(t/10))<1e-8:snap.append(c.astype(np.float32));snap_times.append(t)
  if k==round(T/dt):break
  oldmass=c.sum()*V;c=step(c*(V/dt)+b)
  # Backward-Euler flux at the new time must balance mass exactly.
  diff_in=float(np.sum(2*D*f['h']*(1-c[f['ins']])))
  adv_in=float(f['qi'].sum()) if advection else 0.;adv_out=float(np.dot(f['qo'],c[f['outs']])) if advection else 0.
  net=diff_in+adv_in-adv_out;cum+=net*dt;mass=float(c.sum()*V);err=mass-oldmass-net*dt;maxerr=max(maxerr,abs(err));minc=min(minc,float(c.min()));maxc=max(maxc,float(c.max()));balance.append([t+dt,mass,cum,mass-cum,diff_in,adv_in,adv_out,err])
 data=np.array(history)
 with (CSVDIR/(out.name+'.csv')).open('w',newline='') as h:w=csv.writer(h);w.writerow(['time_s']+names);w.writerows(history)
 with (CSVDIR/(out.name+'_balance.csv')).open('w',newline='') as h:w=csv.writer(h);w.writerow(['time_s','stored_Cin_mm3','cumulative_net_Cin_mm3','global_residual_Cin_mm3','diffusive_in_Cin_mm3_s','advective_in_Cin_mm3_s','advective_out_Cin_mm3_s','step_residual_Cin_mm3']);w.writerows(balance)
 np.savez_compressed(Path(str(out)+'_snapshots.npz'),xyz_mm=f['x'],times_s=snap_times,C_over_Cin=np.array(snap))
 L=55.5-(43+100/11.2);vel=[]
 for well in ['NE','NW','SW','SE']:
  speed=np.linalg.norm(f['v'][regs[well+'_near_liquid']],axis=1);u=float(np.percentile(speed,95)) if advection else 0.;vel.append(dict(well=well,near_liquid_speed_p95_mm_s=u,local_Re_p95=u*L/15,local_Pe_p95=u*L/D,advective_L_over_U_s=L/u if u>0 else None,diffusive_L2_over_D_s=L*L/D))
 summary=dict(case=case,tag=tag,Dgas_mm2_s=D,dx_mm=dx,dt_s=dt,end_time_s=T,advection=advection,Q_mL_min=1 if advection else 0,method='Cell-centered conservative FV; backward Euler, first-order upwind advection, central diffusion. Face-flux projection enforces discrete incompressibility.',boundary='C=1 at upstream inlet terminal; zero diffusive outlet flux; convective outlet; impermeable solid AND liquid boundaries; initially C=0 throughout gas.',scope='Gas only. No odor identity, membrane, liquid, adsorption, reaction, cells, filters, external tubing. D is a sensitivity assumption, not a measured target-VOC coefficient.',sampling=sampling,t50_s={n:crossing(data[:,0],data[:,j+1],.5) for j,n in enumerate(names)},t90_s={n:crossing(data[:,0],data[:,j+1],.9) for j,n in enumerate(names)},final_C={n:float(data[-1,j+1]) for j,n in enumerate(names)},velocity_scales=vel,concentration_min=minc,concentration_max=maxc,max_step_mass_residual_Cin_mm3=maxerr,final_global_mass_residual_Cin_mm3=float(balance[-1][3]),relative_global_mass_residual=float(abs(balance[-1][3])/max(balance[-1][1],1e-30)),uniform_field_operator_residual_relative=float(np.linalg.norm(a@np.ones(f['n'])-b)/np.linalg.norm(b)),projection=f['stats'],runtime_s=time.time()-start)
 Path(str(out)+'.json').write_text(json.dumps(summary,indent=2));print(tag,'runtime',round(summary['runtime_s'],1),'t90',summary['t90_s']['NE_near_liquid'],flush=True);return summary
def benchmark():
 # Analytic average for a sealed-end slab after a fixed-concentration boundary step.
 n=100;h=1/n;D=1.;dt=.0005;T=.1;i=np.arange(n-1);g=D/h
 a=sparse.coo_matrix((np.r_[np.full(n-1,g),np.full(n-1,g),np.full(n-1,-g),np.full(n-1,-g)],(np.r_[i,i+1,i,i+1],np.r_[i,i+1,i+1,i])),shape=(n,n)).tocsc();a[0,0]+=2*g;b=np.zeros(n);b[0]=2*g;step=factorized(a+sparse.eye(n,format='csc')*(h/dt));c=np.zeros(n)
 for _ in range(round(T/dt)):c=step(h/dt*c+b)
 odd=2*np.arange(1000)+1;exact=1-np.sum(8/(np.pi**2*odd**2)*np.exp(-D*(odd*np.pi/2)**2*T));r=dict(test='1D diffusion slab; inletDirichlet1,outletNeumann0,initial0',L_mm=1,D_mm2_s=D,dx_mm=h,dt_s=dt,time_s=T,numerical_mean=float(c.mean()),analytic_mean=float(exact),absolute_error=float(abs(c.mean()-exact)));OUT.mkdir(exist_ok=True);(OUT/'analytic_benchmark.json').write_text(json.dumps(r,indent=2));assert r['absolute_error']<.002;return r
def main():
 p=argparse.ArgumentParser();p.add_argument('--run',action='store_true');p.add_argument('--case');p.add_argument('--D',type=float);p.add_argument('--dx',type=float,default=.4);p.add_argument('--checks',action='store_true');a=p.parse_args()
 if a.run:
  for case in ([a.case] if a.case else ['open','shelf_w8_e0p2']):
   for D in ([a.D] if a.D else [5.,10.,20.]):solve(case,D,dx=a.dx)
 if a.checks:solve('shelf_w8_e0p2',10,dx=.3);solve('shelf_w8_e0p2',10,dt=.25);solve('shelf_w8_e0p2',10,advection=False);benchmark()
if __name__=='__main__':main()
