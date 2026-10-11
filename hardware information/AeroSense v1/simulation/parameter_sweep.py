"""Actual photon transport sweeps. Reproducible seeds; all powers conditional, not measured.
python parameter_sweep.py --run --plots; python parameter_sweep.py --plots
Requires numpy and Pillow. Outputs raw per-replicate JSON, CSV and plotted error bars.
"""
from pathlib import Path
import numpy as np,json,csv,argparse,copy,time
import optical_transport as mc
from optical_maps import SC
from plot_results import font
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent; OUT=HERE/'optical_sweep';OUT.mkdir(exist_ok=True)
CASES={'baseline':{},'PD_centered':{'offset':(0,0)},'PD_reversed':{'offset':(0,.4)},'PD_x_minus':{'offset':(-.2,-.4)},'PD_x_plus':{'offset':(.2,-.4)},
 'resin_abs_0p1':{'resin_mua_ex':.1,'resin_mua_em':.05},'resin_abs_0p5':{'resin_mua_ex':.5,'resin_mua_em':.25},'resin_scatter_0p1':{'resin_mus':.1},'resin_scatter_1':{'resin_mus':1.},
 'liquid_scatter_0':{'liquid_mus':0},'liquid_scatter_1':{'liquid_mus':1.},'black_R_0':{'black_reflectance':0},'black_R_0p1':{'black_reflectance':.1},
 'filter_OD3':{'filter_T_ex':1e-3},'filter_OD4':{'filter_T_ex':1e-4},'filter_Tem_0p6':{'filter_T_em':.6},
 'fill_75uL':{'fill':75},'fill_200uL':{'fill':200},'LED_x_minus':{'dx':-.15},'LED_x_plus':{'dx':.15},'LED_z_plus':{'dz':.15},
 'LED_NW':{'led':1},'LED_SW':{'led':2},'LED_SE':{'led':3}}

def run_case(name,ne=16000,nm=40000,reps=3):
 cfg=CASES[name];dest=OUT/(name+'.json')
 if dest.exists():return json.loads(dest.read_text())
 sc=SC|{k:v for k,v in cfg.items() if k in SC or k.startswith('filter_')}
 mc.PD_OFFSET=cfg.get('offset',(0,-.4));mc.ZLIQ=43+cfg.get('fill',150)/15.98
 grid=mc.make_grid(seal=True);rows=[];sx,sy=mc.QUADS[cfg.get('led',0)];start=time.time()
 for k in range(reps):
  seed=926000+k;rng=np.random.default_rng(seed)
  p=np.column_stack([sx*(3.3+rng.uniform(-.5,.5,ne))+cfg.get('dx',0),np.full(ne,sy*5.19),40.2+rng.uniform(-.15,.15,ne)+cfg.get('dz',0)])
  co=np.sqrt(rng.random(ne));si=np.sqrt(1-co*co);ph=rng.uniform(0,2*np.pi,ne);d=np.column_stack([si*np.cos(ph),-sy*co,si*np.sin(ph)])
  ex=mc.trace(p,d,rng,sc,'ex',grid_override=grid);pc,wc,jc=ex['cloud'];a=wc.sum()/ne
  if len(wc)==0:raise ValueError('No cell absorption events; increase packets')
  ix=rng.choice(len(wc),nm,p=wc/wc.sum());em=mc.trace(pc[ix],mc.unit_dirs(rng,nm),rng,sc,'em',source_well=jc[ix],grid_override=grid)
  factor=500*a*470/520*1000
  contrib=[float(np.sum(em['det'][jc[ix]==j])/nm*factor) for j in range(4)]
  rows.append(dict(seed=seed,PD_green_nW=float(em['det'].mean()*factor),PD_blue_nW=float(ex['det'].mean()*500000),green_by_well_nW=contrib,cell_absorbed_fraction=ex['absorbed_by_well'].tolist(),green_detected_packets=int(np.count_nonzero(em['det'])),ex_ledger=ex['ledger'],em_ledger=em['ledger']))
 r=dict(case=name,configuration=cfg,PD_offset_mm=mc.PD_OFFSET,PD_equal_area_rectangle_mm=mc.PD_SIZE,N_ex=ne,N_em=nm,replicates=reps,scenario=sc,runs=rows,runtime_s=time.time()-start)
 dest.write_text(json.dumps(r,indent=2));print(name,round(r['runtime_s'],1),flush=True);return r

def plots():
 rows=[]
 for name in CASES:
  f=OUT/(name+'.json')
  if not f.exists():continue
  a=json.loads(f.read_text());g=np.array([r['PD_green_nW'] for r in a['runs']]);b=np.array([r['PD_blue_nW'] for r in a['runs']]);c=np.mean([r['green_by_well_nW'] for r in a['runs']],axis=0)
  row=dict(case=name,green_mean_nW=g.mean(),green_SE_nW=g.std(ddof=1)/np.sqrt(len(g)),blue_mean_nW=b.mean(),blue_SE_nW=b.std(ddof=1)/np.sqrt(len(b)),replicates=len(g),packets_per_rep=a['N_ex']+a['N_em'])
  row.update({q+'_green_nW':c[j] for j,q in enumerate(['NE','NW','SW','SE'])});rows.append(row)
 with (OUT/'summary.csv').open('w',newline='') as f:w=csv.DictWriter(f,rows[0]);w.writeheader();w.writerows(rows)
 im=Image.new('RGB',(1400,150+len(rows)*43),'white');d=ImageDraw.Draw(im);d.text((35,20),'Optical parameter sweep - actual Monte Carlo transport',font=font(28),fill='#163d50')
 d.text((35,60),'500 uW LED; QY=1 assumption. Bars: mean +/- 1 SE, three seeds. Not calibrated.',font=font(21),fill='#794326')
 mx=max(r['green_mean_nW']+r['green_SE_nW'] for r in rows)*1.05
 for j,r in enumerate(rows):
  y=105+j*43;x=310;v=r['green_mean_nW']/mx*850;e=r['green_SE_nW']/mx*850
  d.text((35,y),r['case'],font=font(22),fill='#163d50');d.rectangle((x,y+3,x+v,y+26),fill='#26979a');d.line((x+v-e,y+15,x+v+e,y+15),fill='black',width=3)
  d.text((1180,y),f"{r['green_mean_nW']:.3g} nW",font=font(21),fill='#163d50')
 im.save(HERE.parent/'results/images/optical_parameter_sweep.png')
 mat=np.array([[r[q+'_green_nW'] for q in ['NE','NW','SW','SE']] for r in rows if r['case'] in ['baseline','LED_NW','LED_SW','LED_SE']])
 # Rows follow excitation LED, columns show well-origin fluorescence. This is NOT an experimentally measured unmixing matrix.
 np.savetxt(OUT/'LED_by_well_simulated_nW.csv',mat,delimiter=',',header='NE,NW,SW,SE',comments='')
 (OUT/'summary.json').write_text(json.dumps(dict(cases=rows,simulated_transfer_matrix=mat.tolist(),condition_number=float(np.linalg.cond(mat)),max_energy_error=max(abs(z[l]['sum']-1) for n in CASES for z in json.loads((OUT/(n+'.json')).read_text())['runs'] for l in ['ex_ledger','em_ledger'])),indent=2))
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--run',action='store_true');ap.add_argument('--plots',action='store_true');a=ap.parse_args()
 if a.run:
  for name in CASES:run_case(name)
 if a.plots:plots()
