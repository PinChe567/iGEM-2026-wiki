"""AeroSense screening MC. numpy only; mm; fixed two wavelengths.
Piecewise rectangular approximation of the delivered CSG, not a calibrated device.
Run: python optical_mc.py --quick  (or omit --quick for the saved report settings).
"""
from pathlib import Path
import numpy as np,json,argparse,time
HERE=Path(__file__).resolve().parent
EPS=1e-8
ZLIQ=43+150/(4.7*3.4)
PD_OFFSET=(0.,-.4)  # drawing top-view, towards anode end; assembly orientation provisional
PD_SIZE=(3.,2.5) # equal-area sensitive rectangle, NOT a measured die outline
QUADS=[(1,1),(-1,1),(-1,-1),(1,-1)]

def medium(p,baffle=False,seal=False):
 x,y,z=p.T;a=np.abs(x);b=np.abs(y);r=np.zeros(len(p),np.int16)
 # PCB is the lower absorbing boundary. The PD package is rotated 4 x 5 mm.
 pd=(a<2)&(b<2.5)&(z<40.5);r[pd]=3
 r[(abs(x-PD_OFFSET[0])<PD_SIZE[0]/2)&(abs(y-PD_OFFSET[1])<PD_SIZE[1]/2)&(z<40.5)]=5  # 7.5 mm2 active rectangular approximation
 # PDF-inferred component boxes, same as CAD clearance envelopes; heights unverified.
 c21=(np.abs(x-3.5)<.625)&(np.abs(y-1.3)<1.5)&(z<40.8)
 r27=(np.abs(x-5.1)<.625)&(np.abs(y-1.3)<1.5)&(z<40.8)
 u8=(np.abs(x-9.0)<2.5)&(np.abs(y-.3)<4.0)&(z<41.35)
 r[c21|r27|u8]=3
 cross=((a<.25)&(b<4.9))|((b<.25)&(a<6.2))
 cross&=(z>39.8)&(z<58.1)
 cross&=~((a<6.5)&(b<3.1)&(z<42.5))
 r[cross]=3
 arm=(x>-10.15)&(x<-3.15)&(b<.3)&(z>40.8)&(z<42.2)
 stem=(x>-13)&(x<-7)&(b<3)&(z>40.8)&(z<54)
 tray=(a<3.2)&(b<2.7)&(z>40.8)&(z<42.2)
 tray&=~((a<2.7)&(b<2.2)&(z>41.1))
 tray&=~((a<2.4)&(b<1.9))
 r[arm|stem|tray]=3
 r[(a<2.6)&(b<2.1)&(z>41.1)&(z<42.1)]=4
 deck=(z>54)&(z<56.8)
 slots=np.zeros(len(p),bool)
 for sx,sy in QUADS:
  slots|=(np.abs(x-sx*3.3)<3.05)&(np.abs(y-sy*2.65)<2.4)
 r[deck&~slots]=3
 for j,(sx,sy) in enumerate(QUADS):
  xx=x*sx;yy=y*sy
  body=(xx>.4)&(xx<6.2)&(yy>.4)&(yy<4.9)&(z>39.8)&(z<58.3)
  body&=(z>42.5)
  flange=(xx>.4)&(xx<6.9)&(yy>.4)&(yy<5.6)&(z>56.8)&(z<58.3)
  inner=(xx>.95)&(xx<5.65)&(yy>.95)&(yy<4.35)
  cavity=inner&(z>43)&(z<58.3)
  r[(body|flange)&~cavity]=1
  wet=cavity&(z<ZLIQ);r[wet]=2
  cells=wet&(z>43)&(z<43.02)
  r[cells]=10+j
  if baffle:
   shelf=(xx>3.3)&(xx<5.5)&(yy>2.2)&(yy<4.2)&(z>56)&(z<56.6)
   support=(xx>3.3)&(xx<3.9)&(yy>2.2)&(yy<4.2)&(z>56.6)&(z<58.9)
   r[shelf|support]=3
 #  horizontal plate. Equal-area square optical approximations of circular holes.
 # Remote ports approximated black; this is rectilinear tracking, not general STL tracing.
 r[z>58.9]=3
 gas=(a<7)&(b<5.5)&(z>60)&(z<67.2)
 for sx,sy in QUADS:
  gas|=(np.abs(x-sx*3.3)<2.35)&(np.abs(y-sy*2.65)<1.7)&(z>58.9)&(z<60)
 r[gas]=0
 holes=np.zeros(len(p),bool);half=np.sqrt(np.pi)*.8/2
 for xx in [-4.8,-1.6,1.6,4.8]:
  for yy in [-3.4,0,3.4]:holes|=(abs(x-xx)<half)&(abs(y-yy)<half)
 r[(z>63)&(z<64.2)&~holes]=3
 # The compressed opaque gasket occupies land, not the four rectangular openings.
 gap=(a<6.9)&(b<5.6)&(z>58.3)&(z<58.9)
 for sx,sy in QUADS:
  gap&=~((np.abs(x-sx*3.3)<2.35)&(np.abs(y-sy*2.65)<1.7))
 r[gap]=3
 if seal:
  ring=(a<2)&(b<2)&(z>40.5)&(z<41.1)&~((a<1.5)&(b<1.7))
  r[ring]=3  # compressed soft opaque ring; not a printed hard contact
 return r

def make_grid(baffle=False,seal=False,scoring_dx=None):
 xs=[.25,.4,.95,1.25,1.5,2,2.4,2.6,2.7,3.15,3.2,3.3,3.9,5.5,5.65,6.2,6.35,6.5,6.9,7,10.15,13]
 ys=[.25,.3,.4,.95,1.5,1.7,1.9,2,2.1,2.2,2.4,2.5,2.7,2.9,3,3.1,3.45,4.2,4.35,4.9,5.05,5.6,9]
 xs += [4.2,5.4]
 ys += [5.5]
 xs += [2.875,4.125,4.475,5.725,11.5]
 ys += [.2,2.8,3.7,4.3]
 axes=[np.array(sorted(set([-q for q in xs]+[0]+xs))),np.array(sorted(set([-q for q in ys]+[0]+ys))),np.array([39.6,39.8,40.3,40.32,40.5,40.8,41.1,41.35,42.1,42.2,42.5,43,43.02,ZLIQ,54,56,56.6,56.8,58.1,58.3,58.9,60,63,64.2,67.2,69])]
 half=np.sqrt(np.pi)*.8/2
 for k,centres in [(0,[-4.8,-1.6,1.6,4.8]),(1,[-3.4,0,3.4])]:
  axes[k]=np.unique(np.r_[axes[k],[q+d for q in centres for d in [-half,half]]])
 if scoring_dx:axes=[np.unique(np.r_[ax,np.arange(ax[0],ax[-1],scoring_dx)]) for ax in axes]
 for k in [0,1]: axes[k]=np.unique(np.r_[axes[k],PD_OFFSET[k]-PD_SIZE[k]/2,PD_OFFSET[k]+PD_SIZE[k]/2])
 center=[(a[1:]+a[:-1])/2 for a in axes]
 p=np.stack(np.meshgrid(*center,indexing='ij'),axis=-1)
 grid=medium(p.reshape(-1,3),baffle,seal).reshape(p.shape[:-1])
 return axes,grid

def unit_dirs(rng,n):
 c=rng.uniform(-1,1,n);s=np.sqrt(1-c*c);ph=rng.uniform(0,2*np.pi,n)
 return np.column_stack([s*np.cos(ph),s*np.sin(ph),c])

def scatter_hg(rng,d,g):
 u=rng.random(len(d));c=np.empty_like(u);iso=np.abs(g)<1e-9
 c[iso]=2*u[iso]-1
 g1=g[~iso];c[~iso]=(1+g1*g1-((1-g1*g1)/(1-g1+2*g1*u[~iso]))**2)/(2*g1)
 c=np.clip(c,-1,1);s=np.sqrt(1-c*c);phi=rng.uniform(0,2*np.pi,len(d))
 helper=np.tile([0.,0.,1.],(len(d),1));helper[np.abs(d[:,2])>.9]=[1,0,0]
 v=np.cross(d,helper);v/=np.linalg.norm(v,axis=1)[:,None];u2=np.cross(v,d)
 return c[:,None]*d+s[:,None]*(np.cos(phi)[:,None]*u2+np.sin(phi)[:,None]*v)

def fresnel(ci,n1,n2):
 eta=n1/n2;sin2=eta*eta*(1-ci*ci);ct=np.sqrt(np.maximum(0,1-sin2))
 rs=(n1*ci-n2*ct)/(n1*ci+n2*ct+1e-30)
 rp=(n1*ct-n2*ci)/(n1*ct+n2*ci+1e-30)
 return np.where(sin2>=1,1,.5*(rs*rs+rp*rp)),ct

def properties(scenario,wave):
 n=np.ones(14);n[1]=1.5;n[2]=1.333;n[4]=1.5;n[10:]=1.333
 a=np.zeros(14);s=np.zeros(14);g=np.zeros(14)
 a[1]=scenario['resin_mua_ex' if wave=='ex' else 'resin_mua_em'];s[1]=scenario['resin_mus'];g[1]=.8
 a[2]=.0004;s[2]=scenario['liquid_mus'];g[2]=.85
 a[4]=-np.log(scenario.get('filter_T_ex',1e-5) if wave=='ex' else scenario.get('filter_T_em',.9)) # one mm absorptive-filter proxy
 a[10:]=.5 if wave=='ex' else .0004;s[10:]=s[2];g[10:]=g[2]
 return n,a,s,g

def trace(p,d,rng,scenario,wave,source_well=None,max_events=2500,record_paths=False,score_fluence=False,grid_override=None):
 axes,grid=grid_override if grid_override is not None else make_grid(seal=scenario.get('seal',False));n,a,s,g=properties(scenario,wave)
 tally=np.zeros(grid.size) if score_fluence else None
 N=len(p);p=p.copy();d=d.copy();w=np.ones(N);alive=np.ones(N,bool)
 paths=[[[float(x) for x in q]] for q in p[:min(N,48)]] if record_paths else []
 if source_well is None:source_well=np.full(N,-1)
 det=np.zeros(N);depos=np.zeros(4);absorb=escape=cutoff=0.;pts=[];weights=[];wells=[];filter_incident=0
 for step in range(max_events):
  ids=np.flatnonzero(alive)
  if len(ids)==0:break
  pos=p[ids];dirs=d[ids];ix=np.column_stack([np.searchsorted(ax,pos[:,k],side='right')-1 for k,ax in enumerate(axes)])
  inside=np.all((ix>=0)&(ix<np.array(grid.shape)),axis=1)
  gone=ids[~inside];escape+=w[gone].sum();alive[gone]=False
  ids=ids[inside];ix=ix[inside];pos=pos[inside];dirs=dirs[inside]
  if not len(ids):continue
  mat=grid[ix[:,0],ix[:,1],ix[:,2]]
  dt=np.column_stack([(ax[ix[:,k]+(dirs[:,k]>0)]-pos[:,k])/np.where(abs(dirs[:,k])<1e-30,1e-30,dirs[:,k]) for k,ax in enumerate(axes)])
  dt[np.abs(dirs)<1e-30]=np.inf
  axis=np.argmin(dt,axis=1);edge=dt[np.arange(len(ids)),axis]
  sc=np.where(s[mat]>0,-np.log(np.maximum(rng.random(len(ids)),1e-300))/np.maximum(s[mat],1e-300),np.inf)
  dist=np.maximum(0,np.minimum(edge,sc));dw=w[ids]*(-np.expm1(-a[mat]*dist))
  if score_fluence:
   aa=a[mat];integ=np.where(aa>0,dw/np.maximum(aa,1e-300),w[ids]*dist)
   np.add.at(tally,np.ravel_multi_index(ix.T,grid.shape),integ)
  absorb+=dw.sum()
  fluor=(mat>=10)&(wave=='ex')&(dw>1e-15)
  if np.any(fluor):
   fi=np.flatnonzero(fluor);draw=rng.random(len(fi));length=-np.log1p(-draw*(-np.expm1(-a[mat[fi]]*dist[fi])))/a[mat[fi]]
   pts.append(pos[fi]+dirs[fi]*length[:,None]);weights.append(dw[fi]);wells.append(mat[fi]-10)
   depos+=np.bincount(mat[fi]-10,weights=dw[fi],minlength=4)
  w[ids]-=dw;p[ids]+=dirs*dist[:,None]
  scattered=sc<edge
  sid=ids[scattered]
  if len(sid):d[sid]=scatter_hg(rng,d[sid],g[mat[scattered]])
  bid=ids[~scattered];old=mat[~scattered];baxis=axis[~scattered]
  if len(bid):
   newpos=p[bid]+d[bid]*EPS
   idx=np.column_stack([np.searchsorted(ax,newpos[:,k],side='right')-1 for k,ax in enumerate(axes)])
   in2=np.all((idx>=0)&(idx<np.array(grid.shape)),axis=1)
   gone=bid[~in2];escape+=w[gone].sum();alive[gone]=False
   bid=bid[in2];old=old[in2];baxis=baxis[in2];idx=idx[in2]
   new=grid[idx[:,0],idx[:,1],idx[:,2]]
   norm=np.zeros((len(bid),3));norm[np.arange(len(bid)),baxis]=np.sign(d[bid,baxis])
   hit=new==5;valid=hit&(baxis==2)&(d[bid,2]<0)
   det[bid[valid]]=w[bid[valid]];absorb+=w[bid[hit&~valid]].sum();alive[bid[hit]]=False
   black=new==3
   if np.any(black):
    qq=bid[black];rho=scenario['black_reflectance'];absorb+=(w[qq]*(1-rho)).sum();w[qq]*=rho
    outnormal=-norm[black];v=unit_dirs(rng,len(qq));v+=outnormal;v/=np.linalg.norm(v,axis=1)[:,None];d[qq]=v
   ordinary=~(hit|black);qq=bid[ordinary];oo=old[ordinary];nn=new[ordinary];no=norm[ordinary]
   if len(qq):
    filter_incident+=np.count_nonzero((nn==4)&(oo!=4))
    ci=np.sum(d[qq]*no,axis=1);rf,ct=fresnel(ci,n[oo],n[nn]);reflect=rng.random(len(qq))<rf
    eta=n[oo]/n[nn];dd=eta[:,None]*d[qq]+(ct-eta*ci)[:,None]*no
    dd[reflect]=d[qq[reflect]]-2*ci[reflect,None]*no[reflect];d[qq]=dd
   p[bid]+=d[bid]*EPS
  tiny=alive&(w<1e-12);cutoff+=w[tiny].sum();alive[tiny]=False
  if record_paths:
   for k in range(len(paths)):
    if np.linalg.norm(p[k]-np.array(paths[k][-1]))>1e-7:paths[k].append(p[k].tolist())
 remain=w[alive].sum();ledger={'absorbed':absorb/N,'escaped':escape/N,'detected':det.sum()/N,'cutoff':cutoff/N,'unfinished':remain/N,'sum':(absorb+escape+det.sum()+cutoff+remain)/N,'events':step+1}
 assert abs(ledger['sum']-1)<1e-8,ledger
 assert np.all(np.isfinite(p)) and np.all(np.isfinite(d))
 cloud=(np.concatenate(pts),np.concatenate(weights),np.concatenate(wells)) if pts else (np.empty((0,3)),np.empty(0),np.empty(0,dtype=int))
 return {'det':det,'source_well':source_well,'absorbed_by_well':depos/N,'cloud':cloud,'ledger':ledger,'filter_surface_encounters':filter_incident,'illustrative_paths':paths,'fluence_tracklength':tally.reshape(grid.shape)/N if score_fluence else None}

def benchmarks():
 r=np.random.default_rng(531);N=200000;d=unit_dirs(r,N);h=5.;t=-h/np.where(abs(d[:,2])<1e-15,1e-15,d[:,2]);q=d*t[:,None];hit=(d[:,2]<0)&(abs(q[:,0])<1.25)&(abs(q[:,1])<1.5)
 exact=np.arctan(1.25*1.5/(h*np.sqrt(h*h+1.25**2+1.5**2)))/np.pi
 obs=hit.mean();se=np.sqrt(exact*(1-exact)/N);assert abs(obs-exact)<4*se
 f,_=fresnel(np.array([1.]),np.array([1.]),np.array([1.5]));assert abs(f[0]-.04)<1e-12
 f,_=fresnel(np.array([.5]),np.array([1.5]),np.array([1.]));assert f[0]==1
 dirs=np.tile([0.,0.,1.],(N,1));hg=scatter_hg(r,dirs,np.full(N,.85));assert abs(hg[:,2].mean()-.85)<.004
 # Grid-center and off-center samples: supported surface planes must represent CSG labels.
 axes,grid=make_grid();p=r.uniform([-12.99,-8.99,39.61],[12.99,8.99,68.99],(10000,3));ix=np.column_stack([np.searchsorted(ax,p[:,k])-1 for k,ax in enumerate(axes)])
 assert np.array_equal(grid[ix[:,0],ix[:,1],ix[:,2]],medium(p))
 return {'rectangle_acceptance_exact':exact,'rectangle_MC':obs,'MC_standard_error':se,'normal_Fresnel_R':.04,'TIR_pass':True,'HG_mean_cosine':float(hg[:,2].mean()),'Beer_Lambert_example_T_mu0p3_L0p55':float(np.exp(-.3*.55)),'geometry_random_classification_points':10000}
