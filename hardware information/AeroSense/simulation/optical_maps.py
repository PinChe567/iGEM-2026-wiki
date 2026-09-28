""" spatial Monte Carlo estimators. Real point-source sweep and track-length tallies.
No measured resin/GCaMP data: absolute powers are conditional scenarios, not predictions.
Run python optical_maps.py; requires numpy only. Fixed random seeds.
"""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
from pathlib import Path
import numpy as np,json,time,argparse
import optical_transport as mc
HERE=Path(__file__).resolve().parent
SC=dict(name='low_loss_with_PD_soft_seal_ASSUMED',resin_mua_ex=.01,resin_mua_em=.005,resin_mus=.01,liquid_mus=.05,black_reflectance=.02,seal=True)
E=np.array([3.3,5.7]);E/=np.linalg.norm(E)

def acceptance(N=32768):
 start=time.time();rs=np.arange(-1.5,7.51,.25);zs=np.arange(39.85,52.36,.5)
 rr,zz=np.meshgrid(rs,zs,indexing='ij');p=np.column_stack([rr.ravel()*E[0],rr.ravel()*E[1],zz.ravel()])
 labels=mc.medium(p,seal=True);valid=(labels==2)|(labels>=10);ids=np.flatnonzero(valid)
 mean=np.full(len(p),np.nan);se=mean.copy();hits=np.zeros(len(p),int);ledgers=[]
 grid=mc.make_grid(seal=True)
 for b in range(0,len(ids),16):
  ii=ids[b:b+16];rng=np.random.default_rng(260925+b)
  pp=np.repeat(p[ii],N,axis=0);out=mc.trace(pp,mc.unit_dirs(rng,len(pp)),rng,SC,'em',grid_override=grid)
  d=out['det'].reshape(len(ii),N);mean[ii]=d.mean(1);se[ii]=d.std(1,ddof=1)/np.sqrt(N);hits[ii]=np.count_nonzero(d,axis=1)
  ledgers.append(out['ledger']);print('acceptance',b+len(ii),'/',len(ids),'max',np.nanmax(mean),flush=True)
 np.savez_compressed(HERE/'acceptance_map.npz',r_mm=rs,z_mm=zs,xyz_mm=p,eta=mean.reshape(rr.shape),SE=se.reshape(rr.shape),detected_packets=hits.reshape(rr.shape),material=labels.reshape(rr.shape),N_per_point=N,radial_unit_xy=E)
 report=dict(meaning='eta(r)=mean detected packet weight from N isotropic unit-weight sources at each liquid position; NO peak normalization',source_points=len(ids),packets_per_point=N,packets_total=N*len(ids),max_eta=float(np.nanmax(mean)),median_relative_SE=float(np.nanmedian(se[valid]/np.maximum(mean[valid],1e-300))),zero_hit_points=int(np.sum(hits[valid]==0)),max_energy_imbalance=max(abs(d['sum']-1) for d in ledgers),max_unfinished_fraction=max(d['unfinished'] for d in ledgers),runtime_seconds=time.time()-start,scenario=SC,energy_ledgers=ledgers)
 (HERE/'acceptance_map.json').write_text(json.dumps(report,indent=2));return report

def field(ne=40000,nm=100000,reps=3):
 start=time.time();grid=mc.make_grid(seal=True,scoring_dx=.5);axes,mat=grid
 dv=np.diff(axes[0])[:,None,None]*np.diff(axes[1])[None,:,None]*np.diff(axes[2])[None,None,:]
 exmaps=[];emmaps=[];runs=[]
 P_LED_uW=500.;QY=1.0
 for k in range(reps):
  rng=np.random.default_rng(2609250+k)
  p=np.column_stack([3.3+rng.uniform(-.5,.5,ne),np.full(ne,5.19),40.2+rng.uniform(-.15,.15,ne)])
  co=np.sqrt(rng.random(ne));si=np.sqrt(1-co*co);ph=rng.uniform(0,2*np.pi,ne);d=np.column_stack([si*np.cos(ph),-co,si*np.sin(ph)])
  ex=mc.trace(p,d,rng,SC,'ex',grid_override=grid,score_fluence=True)
  pc,wc,jc=ex['cloud'];absfrac=wc.sum()/ne
  ix=rng.choice(len(wc),nm,p=wc/wc.sum());em=mc.trace(pc[ix],mc.unit_dirs(rng,nm),rng,SC,'em',grid_override=grid,score_fluence=True)
  emitted=P_LED_uW*absfrac*QY*470/520
  exmaps.append(ex['fluence_tracklength']/dv*P_LED_uW)
  emmaps.append(em['fluence_tracklength']/dv*emitted)
  runs.append(dict(seed=2609250+k,N_ex=ne,N_em=nm,absorbed_by_well=ex['absorbed_by_well'].tolist(),emitted_power_uW=emitted,PD_emission_power_uW=em['det'].mean()*emitted,PD_blue_power_uW=ex['det'].mean()*P_LED_uW,excitation_ledger=ex['ledger'],emission_ledger=em['ledger']))
  print('field replicate',k+1,'emitted uW',emitted,'PD uW',runs[-1]['PD_emission_power_uW'],flush=True)
 exa=np.stack(exmaps);ema=np.stack(emmaps)
 np.savez_compressed(HERE/'fluence_3D.npz',x_mm=axes[0],y_mm=axes[1],z_mm=axes[2],material=mat,voxel_volume_mm3=dv,excitation_fluence_uW_mm2=exa.mean(0),emission_fluence_uW_mm2=ema.mean(0),excitation_SE_uW_mm2=exa.std(0,ddof=1)/np.sqrt(reps),emission_SE_uW_mm2=ema.std(0,ddof=1)/np.sqrt(reps),radial_unit_xy=E)
 report=dict(estimator='sum integral(packet_weight dl)/(N*voxel_volume), multiplied by radiant source power; scalar fluence rate, not net irradiance',source='Only NE LED on, Lambertian 1.0 x 0.3 mm emitter, other LEDs off',P_LED_uW_ASSUMED=P_LED_uW,photon_quantum_yield_ASSUMED=QY,emission_power_conversion='P_LED*cell_absorbed_fraction*QY*470/520',cell_absorption_per_mm_ASSUMED=.5,cell_layer_mm_ASSUMED=.02,scoring_max_cell_edge_mm=.5,grid_shape=list(mat.shape),scenario=SC,runs=runs,runtime_seconds=time.time()-start,not_calibrated=['resin spectrum and autofluorescence','cell density, GCaMP concentration and calcium','emission spectrum, quantum yield','filter angle response and leakage','surface roughness','PCB component positions/heights'],geometry_approximations=['axis-aligned material interfaces; cylindrical upper-cap holes replaced with equal-area squares','ports black; curved emitter lens omitted','150 uL in each well, flat interfaces, 20 um floor cells'])
 (HERE/'fluence_3D.json').write_text(json.dumps(report,indent=2));return report

def verify():
 b=mc.benchmarks()
 # Exercise the implemented tally in a homogeneous slab at a known path length.
 ax=[np.array([-1.,1.]),np.array([-1.,1.]),np.array([0.,3.])];grid=np.full((1,1,1),2,np.int16)
 sc=SC.copy();sc['liquid_mus']=0
 p=np.array([[0.,0.,.5]]);d=np.array([[0.,0.,1.]])
 out=mc.trace(p,d,np.random.default_rng(1),sc,'em',score_fluence=True,grid_override=(ax,grid))
 expected=-np.expm1(-.0004*2.5)/.0004
 obs=float(out['fluence_tracklength'].sum());assert abs(obs-expected)<1e-10
 b['tracklength_homogeneous_expected_mm']=expected;b['tracklength_observed_mm']=obs
 (HERE/'optical_benchmarks.json').write_text(json.dumps(b,indent=2))
 print('Benchmarks passed',flush=True)

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--mode',choices=['field','acceptance','verify','all'],default='all');a=ap.parse_args()
 if a.mode in ['verify','all']:verify()
 if a.mode in ['field','all']:field()
 if a.mode in ['acceptance','all']:acceptance()
