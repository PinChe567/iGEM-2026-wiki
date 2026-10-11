"""Recreate publication figures and animation from saved numerical fields.
python plot_and_video.py --video
Animation: RK2 trajectories in steady CFD, at 1 mL/min Stokes-normalized flow.
It is not a transient CFD simulation, molecular motion or cell motion.
"""
from pathlib import Path
import argparse,csv,json,math,subprocess
import numpy as np
from PIL import Image,ImageDraw,ImageFont
import run_flow as f
HERE=Path(__file__).resolve().parent;OUT=HERE/'figures';OUT.mkdir(exist_ok=True)
def font(n,bold=False):
 for p in ([r'C:\Windows\Fonts\arialbd.ttf',r'C:\Windows\Fonts\arial.ttf'] if bold else [r'C:\Windows\Fonts\arial.ttf',r'C:\Windows\Fonts\DejaVuSans.ttf']):
  if Path(p).exists():return ImageFont.truetype(p,n)
 try:return ImageFont.truetype('DejaVuSans.ttf',n)
 except:return ImageFont.load_default()
BG='#ffffff';TEXT='#17232c';MUTED='#52606b';GRID='#dce2e7';TEAL='#187b82';GOLD='#d38a27';BLUE='#6665ab'
def color(v,lo=-4,hi=1):
 t=float(np.clip((math.log10(max(float(v),10**lo))-lo)/(hi-lo),0,1));a=np.array([42,86,155]);b=np.array([56,222,183]);c=np.array([255,210,102]);r=a+(b-a)*t*2 if t<.5 else b+(c-b)*(t-.5)*2
 return tuple(r.astype(int))
def records():return [json.loads((HERE/'results'/f'{k}_dx0.4.json').read_text()) for k in f.CASES]
def summarize():
 rows=records();base=rows[0]
 keys=['case','dx_mm','converged','dp_at_1mLmin_Pa','worst_mouth_downward_momentum_N','summed_mouth_downward_momentum_N','mouth_flux_CV','worst_near_liquid_p95_mm_s','worst_near_liquid_downward_p95_mm_s','blocks_inlet_axis']
 with (HERE/'sweep_summary.csv').open('w',newline='') as out:w=csv.DictWriter(out,keys);w.writeheader();w.writerows({k:r[k] for k in keys} for r in rows)
 height=285+len(rows)*62
 im=Image.new('RGB',(1900,height),BG);d=ImageDraw.Draw(im)
 d.text((65,30),'Baffle screening',font=font(40,True),fill=TEXT)
 metrics=[('worst_mouth_downward_momentum_N','A  Downward momentum','J / J(open)'),('worst_near_liquid_p95_mm_s','B  Near-liquid speed','u95 / u95(open)'),('dp_at_1mLmin_Pa','C  Pressure drop','Delta p [Pa]')]
 for panel,(key,title,note) in enumerate(metrics):
  x0=440+panel*465;y0=175;xw=370;vals=[r[key]/base[key] for r in rows] if panel<2 else [r[key] for r in rows]
  if panel<2:
   lo=math.floor(math.log10(min(vals)));hi=math.ceil(math.log10(max(vals)));hi=max(hi,lo+1);mapping=lambda v:x0+xw*(math.log10(v)-lo)/(hi-lo);ticks=[10**e for e in range(lo,hi+1)]
  else:
   vmax=max(vals)*1.08;mapping=lambda v:x0+xw*v/vmax;ticks=np.linspace(0,vmax,5)
  d.text((x0,92),title,font=font(25,True),fill=TEXT);d.text((x0,134),note,font=font(22),fill=MUTED)
  for tick in ticks:
   xx=mapping(tick);d.line((xx,y0-4,xx,y0+len(rows)*62),fill=GRID,width=1);d.text((xx-12,y0+len(rows)*62+5),f'{tick:g}' if panel<2 else f'{tick:.4f}',font=font(16),fill=MUTED)
  for i,(r,v) in enumerate(zip(rows,vals)):
   y=y0+i*62;col=GOLD if r['case']=='open' else BLUE if r['case']=='perforated' else TEAL
   xx=mapping(v);base_x=mapping(1) if panel<2 else x0;d.line((base_x,y+24,xx,y+24),fill=col,width=10);d.ellipse((xx-6,y+18,xx+6,y+30),fill=col);d.text((xx+8,y+8),f'{v:.2f}' if panel<2 else f'{v:.5f}',font=font(16),fill=TEXT)
   if panel==0:d.text((68,y+10),r['case'].replace('_',' ').replace('1p5','1.5').replace('3p6','3.6').replace('0p2','0.2'),font=font(24),fill=TEXT)
 im.save(OUT/'design_comparison.png',dpi=(300,300))
 return rows
def load(case,dx=.4):
 dat=np.load(HERE/'results'/f'{case}_dx{dx:g}_field.npz');p=dat['xyz_mm'];ijk=dat['ijk'];h=float(dat['dx_mm']);shape=tuple(dat['shape']);vel=dat['velocity_m_s']/float(dat['Q_mL_min'])*1000
 origin=p[0]-ijk[0]*h;grid=np.zeros(shape+(3,));grid[tuple(ijk.T)]=vel;mask=np.zeros(shape,bool);mask[tuple(ijk.T)]=True
 return p,vel,grid,mask,origin,h
def interp(pos,grid,origin,h):
 ij=(pos-origin)/h;lo=np.floor(ij).astype(int);a=ij-lo;out=np.zeros_like(pos)
 for i in [0,1]:
  for j in [0,1]:
   for k in [0,1]:
    ix=lo+np.array([i,j,k]);ok=np.all((ix>=0)&(ix<np.array(grid.shape[:3])),1);w=np.prod(np.where(np.array([i,j,k]),a,1-a),1);out[ok]+=grid[tuple(ix[ok].T)]*w[ok,None]
 return out
def tracks(case,seconds=60,frames=240):
 p,v,grid,mask,origin,h=load(case);rng=np.random.default_rng(926);g=f.GEOM
 # Seed in inlet and headspaces. Deliberately disclose initial distribution.
 rr=.8*np.sqrt(rng.random(140));phi=rng.uniform(0,2*np.pi,140)
 port=np.column_stack([rng.uniform(-17.7,-7.6,140),rr*np.cos(phi),g['port_z']+rr*np.sin(phi)])
 sel=np.where((abs(p[:,0])<7.2)&(abs(p[:,1])<5.8)&(p[:,2]>g['plenum_bottom']))[0];parts=[p[rng.choice(sel,120,replace=False)]]
 for cx,cy in g['well_centers']:
  ids=np.flatnonzero((abs(p[:,0]-cx)<2)&(abs(p[:,1]-cy)<1.4)&(p[:,2]<g['well_top']))
  parts.append(p[rng.choice(ids,35,replace=False)])
 inside=np.concatenate(parts)
 pos=np.concatenate([port,inside]);dt=.02;nstep=round(seconds/dt);targets=np.rint(np.linspace(0,nstep,frames)).astype(int)
 allpos=[pos.copy()];allspeed=[np.linalg.norm(interp(pos,grid,origin,h),axis=1)];next_frame=1
 for st in range(1,nstep+1):
  v0=interp(pos,grid,origin,h);mid=pos+.5*dt*v0;vm=interp(mid,grid,origin,h);new=pos+dt*vm;good=f.gas_points(new,f.CASES[case]);pos[good]=new[good]
  # Reset only particles leaving outlet, disclosed in movie.
  exit=pos[:,0]>17.5
  pos[exit]=np.column_stack([np.full(exit.sum(),-17.5),rng.uniform(-.6,.6,exit.sum()),g['port_z']+rng.uniform(-.6,.6,exit.sum())])
  if next_frame<frames and st==targets[next_frame]:
   allpos.append(pos.copy());allspeed.append(np.linalg.norm(vm,axis=1));next_frame+=1
 assert len(allpos)==frames and targets[-1]*dt==seconds
 return np.array(allpos),np.array(allspeed)
def project(p,rect):
 x0,y0,w,h=rect;pp=np.asarray(p);return np.column_stack([x0+w/2+(pp[:,0]+.50*pp[:,1])*w/42,y0+h*.5+(-.35*pp[:,1]-(pp[:,2]-53))*h/26])
def box(d,lo,hi,rect,fill,outline):
 x0,y0,z0=lo;x1,y1,z1=hi;p=np.array([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]);s=project(p,rect)
 for ids in [[0,1,2,3],[0,1,5,4],[1,2,6,5]]:d.polygon([tuple(s[i]) for i in ids],fill=fill,outline=outline,width=2)
 for a,b in [(0,4),(1,5),(2,6),(3,7),(4,5),(5,6),(6,7),(7,4)]:d.line([tuple(s[a]),tuple(s[b])],fill=outline,width=2)
def view(d,rect,case,positions,speeds,history=None):
 g=f.GEOM;cfg=f.CASES[case];zl=g['floor']+100/11.2
 for cx,cy in g['well_centers']:
  box(d,(cx-2,cy-1.4,g['floor']),(cx+2,cy+1.4,zl),rect,'#deedf4','#9fb9c6')
  box(d,(cx-2,cy-1.4,zl),(cx+2,cy+1.4,g['plenum_bottom']),rect,None,'#82949d')
  pts=project(np.array([[cx-2,cy-1.4,zl],[cx+2,cy-1.4,zl],[cx+2,cy+1.4,zl],[cx-2,cy+1.4,zl]]),rect);d.polygon([tuple(q) for q in pts],fill='#c5e1ec',outline='#5797ac',width=2)
 box(d,(-7.4,-6,g['plenum_bottom']),(7.4,6,62.5),rect,None,'#a6b2bb')
 for x0,x1 in [(-18,-7.4),(7.4,18)]:
  p=project(np.array([[x0,0,60.8],[x1,0,60.8]]),rect);d.line([tuple(q) for q in p],fill='#a8b8c1',width=14);d.line([tuple(q) for q in p],fill='#edf2f5',width=8)
 if cfg['kind']=='wall':box(d,(-4.8,-cfg['width']/2,g['plenum_bottom']+cfg['bottom_gap']),(-3.6,cfg['width']/2,62.5),rect,'#657284','#b6c1ce')
 if cfg['kind'] in ['hood','shelf']:
  box(d,(-7.4,-cfg['width']/2,cfg['shelf_bottom']),(cfg['shelf_end'],cfg['width']/2,cfg['shelf_top']),rect,'#abb6bd','#63737d')
  if cfg['kind']=='hood':box(d,(-4.8,-cfg['width']/2,cfg['shelf_top']),(-3.6,cfg['width']/2,62.5),rect,'#657284','#b6c1ce')
 if cfg['kind']=='perforated':
  box(d,(-7.4,-6,58.2),(7.4,6,59.4),rect,'#abb6bd','#63737d')
  for xx in np.linspace(-4.8,4.8,4):
   for yy in np.linspace(-3.4,3.4,3):
    pt=project(np.array([[xx,yy,59.4]]),rect)[0];d.ellipse((pt[0]-4,pt[1]-2,pt[0]+4,pt[1]+2),fill=BG)
 if history is not None:
  for j in range(0,len(positions),2):
   pp=project(history[:,j],rect)
   # Never draw the bookkeeping jump from outlet back to inlet as a trajectory.
   for k in range(1,len(pp)):
    if np.linalg.norm(history[k,j]-history[k-1,j])<3:d.line([tuple(pp[k-1]),tuple(pp[k])],fill=color(speeds[j]),width=2)
 s=project(positions,rect)
 for i in np.argsort(positions[:,1])[::-1]:
  x,y=s[i];d.ellipse((x-2,y-2,x+2,y+2),fill=color(speeds[i]))
def fields():
 selection=json.loads((HERE/'selection.json').read_text());case=selection['selected_case'];cases=['open','perforated',case]
 im=Image.new('RGB',(1900,1520),BG);d=ImageDraw.Draw(im);d.text((55,32),'Gas velocity',font=font(40,True),fill=TEXT)
 for ci,k in enumerate(cases):
  p,v,grid,mask,origin,h=load(k);x0=65+ci*610;d.text((x0,125),['Open','Perforated','Selected shelf'][ci],font=font(29,True),fill=TEXT)
  for row,(ax,ay,axis,val) in enumerate([(0,1,2,60.8),(0,2,1,0),(0,2,1,2.65)]):
   ya=220+row*370;sel=abs(p[:,axis]-val)<h*.55;ss=p[sel];vv=np.linalg.norm(v[sel],axis=1)
   for pt,speed in zip(ss,vv):
    xx=x0+(pt[ax]+18)*15;yy=ya+(6-pt[ay])*20 if row==0 else ya+(63-pt[ay])*25
    d.rectangle((xx,yy,xx+h*15+1,yy+h*(20 if row==0 else 25)+1),fill=color(speed))
   d.text((x0,ya-34),chr(65+row*3+ci)+'  '+('z = 60.8 mm' if row==0 else ('y = 0 mm' if row==1 else 'y = 2.65 mm')),font=font(21),fill=MUTED)
   yaxis=ya+(240 if row==0 else 280)
   d.line((x0,yaxis,x0+540,yaxis),fill=MUTED,width=1)
   for tick in [-18,-9,0,9,18]:
    xt=x0+(tick+18)*15;d.line((xt,yaxis,xt,yaxis+7),fill=MUTED);d.text((xt-10,yaxis+10),str(tick),font=font(16),fill=MUTED)
   d.text((x0+475,yaxis+30),'X [mm]',font=font(17),fill=MUTED)
   for tick in ([6,0,-6] if row==0 else [62,58,54]):
    yt=ya+(6-tick)*20 if row==0 else ya+(63-tick)*25;d.text((x0-35,yt-7),str(tick),font=font(16),fill=MUTED)
   d.text((x0-35,ya-30),'Y' if row==0 else 'Z',font=font(17),fill=MUTED)
 d.text((55,1415),'Speed [mm/s]',font=font(24),fill=TEXT)
 for i in range(600):d.line((310+i,1416,310+i,1440),fill=color(10**(-4+5*i/599)))
 for i,label in enumerate(['0.0001','0.001','0.01','0.1','1','10']):d.text((292+i*120,1448),label,font=font(18),fill=MUTED)
 im.save(OUT/'velocity_sections.png',dpi=(300,300))
def movie(ffmpeg=None,preview=False,frame_dir=None):
 sel=json.loads((HERE/'selection.json').read_text());case=sel['selected_case'];cases=['open','perforated',case];alltracks=[tracks(k) for k in cases];frames=min(len(t[0]) for t in alltracks);W,H=1600,1120
 scalar=np.genfromtxt(HERE/'gas_transport_results/shelf_w8_e0p2_D10_dx0.4_dt0.5.csv',delimiter=',',names=True)
 out=HERE/'airflow_comparison.mp4';proc=None
 if frame_dir:frame_dir=Path(frame_dir);frame_dir.mkdir(parents=True,exist_ok=True)
 if not preview and not frame_dir:
  if ffmpeg:ff=ffmpeg
  else:
   import imageio_ffmpeg
   ff=imageio_ffmpeg.get_ffmpeg_exe()
  proc=subprocess.Popen([ff,'-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','12','-i','-','-an','-vcodec','libx264','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(out)],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
 for fr in range(frames):
  if preview and fr not in [0,80,160]:continue
  im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im);d.text((46,25),'Gas advection and diffusion',font=font(37,True),fill=TEXT)
  rects=[(35,150,745,345),(825,150,745,345),(35,600,745,345)]
  for ci,(k,(pos,spd),rect) in enumerate(zip(cases,alltracks,rects)):
   x,y,w,h=rect;d.text((x+10,y-40),['A  Open','B  Perforated','C  Selected shelf'][ci],font=font(27,True),fill=TEXT);view(d,rect,k,pos[fr],spd[fr],pos[max(0,fr-6):fr+1])
  # PanelD uses computed scalar PDE, not marker density or fabricated Brownian motion.
  x0,y0,pw,ph=890,640,570,280;t=fr/(frames-1)*60
  d.text((840,560),'D  Near-liquid gas concentration',font=font(26,True),fill=TEXT)
  for val in [0,.25,.5,.75,1]:
   yy=y0+ph*(1-val);d.line((x0,yy,x0+pw,yy),fill=GRID);d.text((x0-48,yy-10),str(val),font=font(17),fill=TEXT)
  for val in [0,15,30,45,60]:d.text((x0+pw*val/60-10,y0+ph+12),str(val),font=font(18),fill=TEXT)
  for well,col in [('NE',TEAL),('NW',BLUE)]:
   take=scalar['time_s']<=t;xx=scalar['time_s'][take];cc=scalar[well+'_near_liquid'][take]
   if len(xx)>1:d.line([(x0+pw*a/60,y0+ph*(1-b)) for a,b in zip(xx,cc)],fill=col,width=4)
  d.text((x0,y0-35),'C / Cin',font=font(21),fill=TEXT);d.text((x0+230,y0+ph+48),'Time [s]',font=font(21),fill=TEXT)
  for j,(name,col) in enumerate([('NE',TEAL),('NW',BLUE)]):d.line((x0+30+j*130,y0+25,x0+65+j*130,y0+25),fill=col,width=4);d.text((x0+72+j*130,y0+10),name,font=font(20),fill=TEXT)
  d.text((46,995),'Speed [mm/s]',font=font(22),fill=TEXT)
  for col in range(490):d.line((230+col,1000,230+col,1020),fill=color(10**(-4+5*col/489)))
  for j,lab in enumerate(['0.0001','0.001','0.01','0.1','1','10']):d.text((218+j*98,1030),lab,font=font(17),fill=TEXT)
  d.rectangle((850,1000,880,1020),fill='#c5e1ec',outline='#5797ac');d.text((895,992),'Liquid boundary (not solved)',font=font(21),fill=TEXT)
  d.text((46,1070),f't = {t:5.1f} s',font=font(23,True),fill=TEXT)
  if fr in [0,80,160]:im.save(OUT/f'airflow_movie_{fr:03d}.png')
  if frame_dir:im.save(frame_dir/f'frame_{fr:03d}.png')
  if proc:proc.stdin.write(im.tobytes())
 if proc:
  proc.stdin.close();rc=proc.wait()
  if rc:raise RuntimeError('ffmpeg failed')
 if preview:return
 (HERE/'video_metadata.json').write_text(json.dumps(dict(file=out.name,cases=cases,frames=frames,fps=12,physical_seconds=60,physical_start_seconds=0,physical_end_seconds=60,frame_sampling='240 requested times rounded to nearest0.02s;first0,last60',playback_seconds=frames/12,particle_count_per_case=400,random_seed=926,initial_marker_distribution='140 inlet,120 plenum,35 in each of4 gas headspaces; marker count is not concentration',integrator='RK2,dt0.02s;trilinearvelocity;wallcrossingreject;outletreseeding;reinjectionjumpsnotdrawn',scalar_panel='Independent finite-volume gas advection-diffusion result,D10mm²/s,selectedshelf;NE/NWnearliquidC',scope='PanelsA-C steady-field advection only;PanelD gas scalar PDE. Liquid and cells not solved.',resolution=[W,H]),indent=2))
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--video',action='store_true');ap.add_argument('--preview',action='store_true');ap.add_argument('--ffmpeg');ap.add_argument('--frames-dir',help='Save full-resolution PNG frames for an external encoder');a=ap.parse_args();summarize();fields()
 if a.video or a.preview or a.frames_dir:movie(a.ffmpeg,a.preview,a.frames_dir)
