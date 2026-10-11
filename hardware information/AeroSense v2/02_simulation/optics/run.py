"""Reproducible ideal-material photon transport + parameter sweeps. All mm/uW.
python run.py --verify --run --maps --plots --video
Actual MC: no fitted image; source positions registered to LEDs, not PD datum.
Numpy and Pillow required; video also requires imageio-ffmpeg or --ffmpeg PATH.
"""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
from pathlib import Path
import argparse,json,csv,time,concurrent.futures
import numpy as np
import transport as mc
HERE=Path(__file__).resolve().parent;OUT=HERE/'results';OUT.mkdir(exist_ok=True)
BASE=dict(resin_mua_ex=0.,resin_mua_em=0.,resin_mus=0.,liquid_mus=0.,liquid_mua=0.,cell_mua=.5,black_reflectance=0.,filter_T_ex=1e-300,filter_T_em=1.,seal=True)
CASES={
 'ideal_NE':{},'ideal_NW':{'led':1},'ideal_SW':{'led':2},'ideal_SE':{'led':3},
 'black_R02':{'black_reflectance':.02},'black_R10':{'black_reflectance':.1},
 'liquid_scatter_0p1':{'liquid_mus':.1},'liquid_scatter_1':{'liquid_mus':1.},
 'filter_OD3':{'filter_T_ex':1e-3,'filter_T_em':.9},
 'filter_OD4':{'filter_T_ex':1e-4,'filter_T_em':.9},
 'filter_OD5':{'filter_T_ex':1e-5,'filter_T_em':.9},
 'no_filter_rejection':{'filter_T_ex':1.,'filter_T_em':1.},
 'PD_reversed':{'offset':(0,.4)},'PD_centered':{'offset':(0,0)},
 'seal_removed':{'seal':False},'sleeves_removed':{'sleeves':False},
 'sleeve_start_43p5':{'sleeve_start':43.5},'sleeve_start_45':{'sleeve_start':45.},
 'cell_abs_0p1':{'cell_mua':.1},'cell_abs_1':{'cell_mua':1.},
 'fill_50':{'fill':50},'fill_125':{'fill':125},
 'LED_z_minus_0p15':{'dz':-.15},'LED_z_plus_0p15':{'dz':.15},
}
def setup(cfg):
 mc.PD_OFFSET=cfg.get('offset',(0.,-.4));mc.ZLIQ=43+cfg.get('fill',100)/11.2
 mc.SLEEVES=cfg.get('sleeves',True);mc.SLEEVE_START=cfg.get('sleeve_start',44.2)
 mc.SEAL_INNER=cfg.get('seal_inner',(3.,3.4));mc.SEAL_OUTER=cfg.get('seal_outer',(4.,4.))
 mc.CELL_MODE=cfg.get('cell_mode','floor')
 return BASE|{k:v for k,v in cfg.items() if k in BASE}
def source(rng,n,led=0,dz=0.):
 sx,sy=mc.QUADS[led]
 p=np.column_stack([sx*(3.3+rng.uniform(-.5,.5,n)),np.full(n,sy*5.19),40.2+rng.uniform(-.15,.15,n)+dz])
 co=np.sqrt(rng.random(n));si=np.sqrt(1-co*co);ph=rng.uniform(0,2*np.pi,n)
 return p,np.column_stack([si*np.cos(ph),-sy*co,si*np.sin(ph)])
def detail(out,factor):
 d=out['det'];total=float(d.sum());den=max(total,1e-300)
 return dict(power_nW=float(d.mean()*factor),detected_packets=int(np.count_nonzero(d)),
  fraction_with_Fresnel_reflection=float(d[out['reflections']>0].sum()/den),
  fraction_with_black_reflection=float(d[out['black_bounces']>0].sum()/den),
  fraction_with_bulk_scattering=float(d[out['scatterings']>0].sum()/den),
  angular_power_nW={str(a):float(d[out['arrival_cos']>=np.cos(np.deg2rad(a))].sum()/len(d)*factor) for a in [20,30,45,65,90]},
  ledger=out['ledger'])
def run_case(name,ne=24000,nm=60000,reps=3):
 cfg=CASES[name];sc=setup(cfg);grid=mc.make_grid(seal=sc['seal']);rows=[];start=time.time()
 for k in range(reps):
  rng=np.random.default_rng(100500+k);p,d=source(rng,ne,cfg.get('led',0),cfg.get('dz',0.))
  ex=mc.trace(p,d,rng,sc,'ex',grid_override=grid)
  pc,wc,jc=ex['cloud'];absfrac=wc.sum()/ne
  if not len(wc):raise ValueError('No excitation absorption events')
  ix=rng.choice(len(wc),nm,p=wc/wc.sum())
  em=mc.trace(pc[ix],mc.unit_dirs(rng,nm),rng,sc,'em',source_well=jc[ix],grid_override=grid)
  factor=500000*absfrac*470/520 # nW at QY=1
  row=dict(seed=100500+k,green=detail(em,factor),blue=detail(ex,500000),
   green_by_well_nW=[float(em['det'][jc[ix]==j].sum()/nm*factor) for j in range(4)],
   absorbed_fraction_by_well=ex['absorbed_by_well'].tolist(),
   floor_incident_fraction=[float(ex['floor_hits'][ex['floor_hits'][:,4]==j,3].sum()/ne) for j in range(4)],
   source_absorption_event_count=len(wc))
  rows.append(row)
 report=dict(case=name,configuration=cfg,scenario=sc,N_ex=ne,N_em=nm,replicates=reps,runs=rows,runtime_seconds=time.time()-start)
 (OUT/(name+'.json')).write_text(json.dumps(report,indent=2));print(name,round(report['runtime_seconds'],1),flush=True);return report
def collection_block(job):
 j,b,q,point_n=job;sc=setup({});grid=mc.make_grid(seal=True);rng=np.random.default_rng(100520+j*100+b)
 points=np.repeat(q,point_n,axis=0);o=mc.trace(points,mc.unit_dirs(rng,len(points)),rng,sc,'em',grid_override=grid)
 v=o['det'].reshape(-1,point_n)
 return j,b,v.mean(1),v.std(1,ddof=1)/np.sqrt(point_n),o['ledger']
def maps(n=600000,point_n=65536,workers=2):
 sc=setup({});grid=mc.make_grid(seal=True);rng=np.random.default_rng(100503)
 p,d=source(rng,n);ex=mc.trace(p,d,rng,sc,'ex',grid_override=grid)
 hit=ex['floor_transmitted_hits'];edgesx=np.linspace(1.3,5.3,9);edgesy=np.linspace(1.25,4.05,8)
 floor=[];eta=np.zeros((4,56));eta_se=np.zeros((4,56));ledgers=[ex['ledger']];jobs=[]
 for j,(sx,sy) in enumerate(mc.QUADS):
  h=hit[hit[:,4]==j];hist=np.histogram2d(h[:,0]*sx,h[:,1]*sy,bins=(edgesx,edgesy),weights=h[:,3])[0]
  floor.append(hist/n*500/(.5*.4)) # directional power crossing floor / actual pixel area
  cx=(edgesx[1:]+edgesx[:-1])/2;cy=(edgesy[1:]+edgesy[:-1])/2
  xy=np.array([(x*sx,y*sy) for x in cx for y in cy]);q=np.column_stack([xy,np.full(len(xy),43.01)])
  for b in range(0,len(q),8):
   jobs.append((j,b,q[b:b+8],point_n))
 with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as pool:
  for i,(j,b,vals,errs,ledger) in enumerate(pool.map(collection_block,jobs)):
   eta[j,b:b+len(vals)]=vals;eta_se[j,b:b+len(vals)]=errs;ledgers.append(ledger);print('collection block',i+1,'/',len(jobs),flush=True)
 eta=eta.reshape(4,8,7);eta_se=eta_se.reshape(4,8,7)
 pc,wc,jc=ex['cloud'];ix=rng.choice(len(wc),30000,p=wc/wc.sum());em=mc.trace(pc[ix],mc.unit_dirs(rng,len(ix)),rng,sc,'em',grid_override=grid)
 angles=np.rad2deg(np.arccos(em['arrival_cos'][em['det']>0]));weights=em['det'][em['det']>0]
 ev=np.array(eta);zz=1.95996398454;center=(ev+zz*zz/(2*point_n))/(1+zz*zz/point_n);half=zz*np.sqrt(ev*(1-ev)/point_n+zz*zz/(4*point_n*point_n))/(1+zz*zz/point_n)
 np.savez_compressed(OUT/'spatial_maps.npz',floor_irradiance_uW_mm2=np.array(floor),eta=ev,eta_SE=np.array(eta_se),eta_CI95_low=center-half,eta_CI95_high=center+half,x_edges_mm=edgesx,y_edges_mm=edgesy,arrival_angle_deg=angles,arrival_weights=weights,N_per_point=point_n)
 (OUT/'maps_summary.json').write_text(json.dumps(dict(excitation_packets=n,point_sources=224,packets_per_point=point_n,emission_packets_for_angle_histogram=30000,eta_mean_by_well=[float(np.mean(v)) for v in eta],floor_mean_uW_mm2=[float(np.mean(v)) for v in floor],floor_CV=[float(np.std(v)/max(np.mean(v),1e-300)) for v in floor],median_eta_relative_SE=float(np.median(np.array(eta_se)[ev>0]/ev[ev>0])),zero_hit_pixels=int((ev==0).sum()),max_energy_error=max(abs(v['sum']-1) for v in ledgers),source='NE LED only; side emitter Lambertian; source radiant power 500 uW',cell_mu_a_per_mm=.5,quantum_yield=1.,geometry='rectilinear common carrier / clear flat wells; ports treated black; no ambient leakage prediction'),indent=2))
def illustrative_paths():
 sc=setup({});grid=mc.make_grid(seal=True);rng=np.random.default_rng(100510)
 p,d=source(rng,16000);ex=mc.trace(p,d,rng,sc,'ex',grid_override=grid);pc,wc,jc=ex['cloud']
 pp,dd=source(rng,512);xp=mc.trace(pp,dd,rng,sc,'ex',grid_override=grid,record_paths=True)
 ix=rng.choice(len(wc),512,p=wc/wc.sum());ep=mc.trace(pc[ix],mc.unit_dirs(rng,512),rng,sc,'em',grid_override=grid,record_paths=True)
 # Rejection-select a few actually detected isotropic paths for explanation.
 # This improves visibility only; selection is NOT a new collection estimate.
 selected=[ep['illustrative_paths'][i] for i in np.where(ep['det']>0)[0]];searched=512
 for b in range(40):
  if len(selected)>=4:break
  rg=np.random.default_rng(120000+b);ix=rg.choice(len(wc),512,p=wc/wc.sum());pp=pc[ix];dd=mc.unit_dirs(rg,512)
  rng_state=rg.bit_generator.state;trial=mc.trace(pp.copy(),dd.copy(),rg,sc,'em',grid_override=grid);searched+=512
  if np.any(trial['det']>0):
   rg.bit_generator.state=rng_state;rr=mc.trace(pp.copy(),dd.copy(),rg,sc,'em',grid_override=grid,record_paths=True)
   selected.extend(rr['illustrative_paths'][i] for i in np.where(rr['det']>0)[0])
 paths=dict(ex=xp['illustrative_paths'],em=selected+ep['illustrative_paths'],ex_detected=xp['det'][:512].tolist(),em_detected=[1]*len(selected)+ep['det'][:512].tolist(),source_seed=100510,selected_detected_paths=len(selected),additional_illustrative_packets_searched=searched,meaning='Actual random paths; a few detected emission paths are deliberately placed first for visibility. Selected path density is NOT collection probability. Display dots advance schematically, not at physical photon flight time.')
 (OUT/'animation_paths.json').write_text(json.dumps(paths))
def summarize():
 rows=[];data={}
 for name in CASES:
  a=json.loads((OUT/(name+'.json')).read_text());data[name]=a;r=a['runs']
  g=np.array([v['green']['power_nW'] for v in r]);b=np.array([v['blue']['power_nW'] for v in r])
  row=dict(case=name,green_nW=float(g.mean()),green_SE_nW=float(g.std(ddof=1)/np.sqrt(len(g))),blue_nW=float(b.mean()),blue_SE_nW=float(b.std(ddof=1)/np.sqrt(len(b))),replicates=len(r),packets_per_replicate=a['N_ex']+a['N_em'])
  row.update({f'well_{j}_nW':float(np.mean([v['green_by_well_nW'][j] for v in r])) for j in range(4)})
  for q in ['fraction_with_Fresnel_reflection','fraction_with_black_reflection','fraction_with_bulk_scattering']:row[q]=float(np.mean([v['green'][q] for v in r]))
  rows.append(row)
 with (OUT/'parameter_sweep.csv').open('w',newline='') as f:w=csv.DictWriter(f,rows[0]);w.writeheader();w.writerows(rows)
 mat=np.array([[r[f'well_{j}_nW'] for j in range(4)] for r in rows[:4]])
 report=dict(cases=rows,row_order=['NE','NW','SW','SE'],column_order=['NE','NW','SW','SE'],LED_by_well_nW=mat.tolist(),condition_number=float(np.linalg.cond(mat)),intended_well_fraction=(np.diag(mat)/mat.sum(1)).tolist(),max_energy_error=max(abs(v[q]['ledger']['sum']-1) for a in data.values() for v in a['runs'] for q in ['green','blue']),max_unfinished_fraction=max(v[q]['ledger']['unfinished'] for a in data.values() for v in a['runs'] for q in ['green','blue']),total_primary_packets=sum((a['N_ex']+a['N_em'])*a['replicates'] for a in data.values()))
 (OUT/'summary.json').write_text(json.dumps(report,indent=2));np.savetxt(OUT/'LED_by_well_nW.csv',mat,delimiter=',',header='NE,NW,SW,SE',comments='')
 return report
def convergence():
 sc=setup({});grid=mc.make_grid(seal=True);rows=[]
 for k in range(3):
  rng=np.random.default_rng(107000+k);p,d=source(rng,48000);ex=mc.trace(p,d,rng,sc,'ex',grid_override=grid,max_events=10000)
  pc,wc,jc=ex['cloud'];ix=rng.choice(len(wc),120000,p=wc/wc.sum());ep=pc[ix];ed=mc.unit_dirs(rng,len(ix));factor=500000*wc.sum()/48000*470/520
  vals={}
  for limit in [2500,10000]:
   out=mc.trace(ep,ed,np.random.default_rng(107100+k),sc,'em',grid_override=grid,max_events=limit)
   vals[str(limit)]=dict(green_nW=float(out['det'].mean()*factor),unresolved_green_upper_bound_nW=out['ledger']['unfinished']*factor,ledger=out['ledger'])
  rows.append(dict(seed=107000+k,N_ex=48000,N_em=120000,limits=vals));print('convergence',k,flush=True)
 (OUT/'event_limit_convergence.json').write_text(json.dumps(dict(runs=rows,interpretation='Upper bound assumes every unresolved packet would eventually hit PD; actual lossless trapped paths may never exit. Identical launched emission positions/directions and RNG compare event limits.'),indent=2))
def run_standard(name):
 led=['standard_NE','standard_NW','standard_SW','standard_SE'].index(name)
 CASES[name]=dict(led=led,cell_mode='volume',cell_mua=.001)
 return run_case(name)
def standard(workers=2):
 names=['standard_NE','standard_NW','standard_SW','standard_SE']
 with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as pool:runs=list(pool.map(run_standard,names))
 mat=np.array([np.mean([r['green_by_well_nW'] for r in a['runs']],axis=0) for a in runs]);norm=mat/mat.sum(1)[:,None]
 np.savetxt(OUT/'volume_standard_LED_by_well_nW.csv',mat,delimiter=',',header='NE,NW,SW,SE',comments='')
 np.savetxt(OUT/'volume_standard_LED_by_well_fraction.csv',norm,delimiter=',',header='NE,NW,SW,SE',comments='')
 report=dict(model='Homogeneous weakly absorbing volume standard; NOT the floor cell layer',row_order=['NE','NW','SW','SE'],column_order=['NE','NW','SW','SE'],absorption_per_mm=.001,fill_uL=100,reference_QY=1,LED_on_uW=500,LED_by_well_nW=mat.tolist(),row_normalized=norm.tolist(),condition_number=float(np.linalg.cond(mat)),validation='Compare normalized ratios for a uniform liquid fluorescent standard. Do not use this as the biological cell-layer unmixing matrix.',additional_packets=4*3*(24000+60000))
 (OUT/'volume_standard_summary.json').write_text(json.dumps(report,indent=2))
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--run',action='store_true');ap.add_argument('--maps',action='store_true');ap.add_argument('--convergence',action='store_true');ap.add_argument('--standard',action='store_true');ap.add_argument('--verify',action='store_true');ap.add_argument('--plots',action='store_true');ap.add_argument('--video',action='store_true');ap.add_argument('--workers',type=int,default=2);ap.add_argument('--ffmpeg');a=ap.parse_args()
 if a.verify:(OUT/'benchmarks.json').write_text(json.dumps(mc.benchmarks(),indent=2));print('verification passed')
 if a.run:
  with concurrent.futures.ProcessPoolExecutor(max_workers=a.workers) as pool:list(pool.map(run_case,CASES))
  summarize()
 if a.maps:maps(workers=a.workers)
 if a.convergence:convergence()
 if a.standard:standard(a.workers)
 if a.plots or a.video:
  if a.run or not (OUT/'animation_paths.json').exists():illustrative_paths()
  import visualize
  visualize.figures()
  if a.video:visualize.video(a.ffmpeg)
  import runpy
  runpy.run_path(str(HERE/'write_analysis.py'))
