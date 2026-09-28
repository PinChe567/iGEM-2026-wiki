"""Plot every solved factorial case and animate passive markers in saved steady fields.
python flow_figures_video.py [--video] [--ffmpeg /path/to/ffmpeg]
Video is not a transient Navier-Stokes or gas/medium mass-transfer simulation.
"""
from pathlib import Path
import json,csv,argparse,subprocess,shutil
import numpy as np
from PIL import Image,ImageDraw
from plot_results import font,jet
from full_flow_sweep import NAMES
S=Path(__file__).resolve().parent;OUT=S.parent/'results';I=OUT/'images'
def summarize():
 rows=[]
 for name in NAMES+['no_plate']:
  r=json.loads((S/'flow'/(name+'_dx0.4.json')).read_text());c=r['configuration'];heads=np.array([x['mean_speed_at_1mLmin_mm_s'] for x in r['well_headspaces']])
  rows.append(dict(case=name,d_mm=c['d'],holes=c['nx']*c['ny'] if c['plate'] else 0,gap_mm=c['gap'],converged=r['converged'],dp_Pa=r['dp_at_1mLmin_Pa'],mean_head_mm_s=heads.mean(),worst_head_mm_s=heads.max(),mean_head_fixed_dp_mm_s=heads.mean()*r['Q_at_0p01Pa_mL_min'],Q_at_0p01Pa=r['Q_at_0p01Pa_mL_min'],mass_imbalance=r['last_residual']['mass_flux_imbalance']))
 with (OUT/'CFD_full_factorial.csv').open('w',newline='') as f:w=csv.DictWriter(f,rows[0]);w.writeheader();w.writerows(rows)
 im=Image.new('RGB',(1450,1000),'white');d=ImageDraw.Draw(im);d.text((30,25),'27 actual 3-D CFD cases + no-plate control',font=font(30),fill='#17384b')
 for band,(key,label) in enumerate([('dp_Pa','Pressure drop (Pa), Q=1 mL/min'),('mean_head_mm_s','Mean headspace speed (mm/s), Q=1 mL/min')]):
  low=min(r[key] for r in rows[:-1]);high=max(r[key] for r in rows[:-1]);d.text((35,90+band*440),label,font=font(27),fill='#17384b')
  for hi,h in enumerate([1.5,3,4.5]):
   x0=110+hi*450;y0=175+band*440;d.text((x0,y0-40),f'Inlet standoff {h:g} mm',font=font(22),fill='#17384b')
   for j,n in enumerate([4,6,12]):
    d.text((x0-45,y0+j*85+25),str(n),font=font(21),fill='#17384b')
    for k,diam in enumerate([1.6,2,2.4]):
     r=next(r for r in rows if r['holes']==n and r['d_mm']==diam and r['gap_mm']==h);v=r[key];col=tuple(np.uint8(jet(.15+.7*(v-low)/(high-low))*255));x=x0+k*112;y=y0+j*85
     d.rectangle((x,y,x+108,y+80),fill=col);d.text((x+9,y+28),f'{v:.4g}',font=font(19),fill='black');
     if not r['converged']:d.text((x+5,y+5),'NOT CONV',font=font(14),fill='red')
   for k,diam in enumerate([1.6,2,2.4]):d.text((x0+k*112+30,y0+265),str(diam),font=font(21),fill='#17384b')
   d.text((x0,y0+302),'Columns: hole diameter (mm)',font=font(19),fill='#17384b')
 d.text((30,965),'Rows: hole count. Coarse 0.4 mm grid. Stokes rescaling; filters/tubes and submerged-cell stress excluded.',font=font(21),fill='#924a2c');im.save(I/'CFD_full_factorial.png')
 control=rows[-1];best=min(rows[:-1],key=lambda r:r['mean_head_mm_s']);report=dict(cases=rows,converged_count=sum(r['converged'] for r in rows),control=control,minimum_plate_headspace_speed_case=best,all_plate_headspace_speeds_above_control=all(r['mean_head_mm_s']>control['mean_head_mm_s'] for r in rows[:-1]),max_mass_imbalance=max(r['mass_imbalance'] for r in rows),mesh_independence_established=False)
 (OUT/'CFD_summary.json').write_text(json.dumps(report,indent=2));return report
def video(name,ffmpeg):
 f=np.load(S/'flow'/(name+'_dx0.4_field.npz'));xyz=f['xyz_mm'];v=f['velocity_m_s']/float(f['Q_mL_min'])*1000;dx=float(f['dx_mm']);shape=tuple(f['shape']);ids=f['ijk'];origin=xyz[0]-ids[0]*dx
 lut=np.full(shape,-1,int);lut[tuple(ids.T)]=np.arange(len(xyz));rng=np.random.default_rng(9267)
 def lookup(p):
  ii=np.rint((p-origin)/dx).astype(int);inside=np.all((ii>=0)&(ii<shape),axis=1);out=np.full(len(p),-1,int);out[inside]=lut[tuple(ii[inside].T)];return out
 # Start throughout the domain, rather than implying every gas molecule follows one inlet streamline.
 p=xyz[rng.choice(len(xyz),650,replace=False)].copy();frames=[];dt=.02;duration=60;fps=12
 dst=OUT/('airflow_'+name+'.mp4');cmd=[ffmpeg,'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s','1200x640','-r',str(fps),'-i','-','-an','-vcodec','libx264','-pix_fmt','yuv420p','-crf','21',str(dst)]
 proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 for frame in range(120):
  for _ in range(25):
   k=lookup(p);good=k>=0;trial=p.copy();trial[good]+=v[k[good]]*dt;kk=lookup(trial);move=good&(kk>=0);p[move]=trial[move]
  im=Image.new('RGB',(1200,640),'#f5f8f9');d=ImageDraw.Draw(im);d.text((35,22),f'{name} | steady CFD passive-marker advection | t={(frame+1)*.5:.1f} s',font=font(26),fill='#17384b')
  def point(p):return (50+(p[0]+23)/46*1100,530-(p[2]-52)/20*420)
  # Gray is actual near-Y=0 section. Colored markers project all Y positions.
  sel=abs(xyz[:,1])<dx*.6
  for q in xyz[sel]:
   x,y=point(q);d.rectangle((x-4.6,y-4.6,x+4.6,y+4.6),fill='#d6e1e5')
  for q in p:
   x,y=point(q);col='#007f89' if q[2]>60 else '#b45a32';d.ellipse((x-2,y-2,x+2,y+2),fill=col)
  d.text((35,553),'Q = 1 mL/min (Stokes scaled); 60 s physical time shown in 10 s video; projection along Y.',font=font(21),fill='#17384b')
  d.text((35,590),'No diffusion, evaporation, gas dissolution or cell mechanics. Marker motion is visualization only.',font=font(20),fill='#924a2c');proc.stdin.write(im.tobytes())
  if frame in [0,60,119]:im.save(I/f'airflow_{name}_{frame:03}.png')
 proc.stdin.close();err=proc.stderr.read();proc.wait();assert proc.returncode==0,err.decode(errors='replace')
 return dict(case=name,seed=9267,advection_dt_s=dt,physical_duration_s=duration,frames=120,fps=fps,video_duration_s=10,velocity_interpolation='nearest voxel; stop at solid; no diffusion',Q_mLmin=1)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--video',action='store_true');p.add_argument('--ffmpeg');a=p.parse_args();r=summarize()
 if a.video:
  exe=a.ffmpeg or shutil.which('ffmpeg')
  if not exe:
   import imageio_ffmpeg;exe=imageio_ffmpeg.get_ffmpeg_exe()
  cases=['no_plate','base',r['minimum_plate_headspace_speed_case']['case']];meta=[video(n,exe) for n in dict.fromkeys(cases)]
  (OUT/'video_metadata.json').write_text(json.dumps(meta,indent=2))
