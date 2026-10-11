"""Sparse publication graphics. Methods/captions are generated separately."""
from pathlib import Path
import json,csv,math,subprocess
import numpy as np
from PIL import Image,ImageDraw,ImageFont
import signal_model as sig
P=Path(__file__).resolve().parent;R=P/'results';F=P/'figures';F.mkdir(exist_ok=True)
INK='#172a38';GRID='#dce4e9';BLUE='#3573bc';GREEN='#16866b';ORANGE='#c56528';PURPLE='#9355a6';COLS=['#188b99','#cb8034','#8062ae','#c85371'];NAMES=sig.NAMES
def font(s,b=False):
 for p in [('C:/Windows/Fonts/segoeuib.ttf' if b else 'C:/Windows/Fonts/segoeui.ttf'),'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
  if Path(p).exists():return ImageFont.truetype(p,s)
 return ImageFont.load_default(size=s)
def ct(d,x,y,t,s=20,c=INK,b=False):
 f=font(s,b);w=d.textbbox((0,0),str(t),font=f)[2];d.text((x-w/2,y),str(t),font=f,fill=c)
def canvas(title,w=1500,h=1000):
 im=Image.new('RGB',(w,h),'white');d=ImageDraw.Draw(im);d.text((42,24),title,font=font(31,True),fill=INK);return im,d
def panel(d,x,y,t):d.text((x,y),t,font=font(24,True),fill=INK)
def color(v):
 a=np.array([[40,30,80],[47,102,145],[40,161,144],[136,206,88],[246,226,64]],float);q=np.clip(v,0,1)*4;i=min(int(q),3);return tuple((a[i]*(1-q+i)+a[i+1]*(q-i)).astype(int))
def legend(d,x,y,items,s=19):
 for t,c in items:d.line((x,y+11,x+28,y+11),fill=c,width=4);d.text((x+36,y),t,font=font(s),fill=INK);x+=d.textbbox((0,0),t,font=font(s))[2]+70
def axes(d,rect,xlim,ylim,xt,yt,xlabel='',ylabel='',s=18):
 x,y,w,h=rect
 for v,t in yt:
  py=y+h-(v-ylim[0])/(ylim[1]-ylim[0])*h;d.line((x,py,x+w,py),fill=GRID);tw=d.textbbox((0,0),str(t),font=font(s))[2];d.text((x-tw-13,py-12),str(t),font=font(s),fill=INK)
 for v,t in xt:
  px=x+(v-xlim[0])/(xlim[1]-xlim[0])*w;d.line((px,y+h,px,y+h+6),fill=INK);ct(d,px,y+h+11,t,s)
 d.line((x,y,x,y+h,x+w,y+h),fill=INK,width=2)
 if xlabel:ct(d,x+w/2,y+h+43,xlabel,s+1)
 if ylabel:d.text((x,y-27),ylabel,font=font(s),fill=INK)
def line(d,xx,yy,rect,xlim,ylim,c,w=2):
 x,y,ww,h=rect;xx=np.asarray(xx);yy=np.asarray(yy);ok=np.isfinite(xx)&np.isfinite(yy)&(xx>=xlim[0])&(xx<=xlim[1]);xx=xx[ok];yy=yy[ok]
 if not len(xx):return
 points=np.column_stack([x+(xx-xlim[0])/(xlim[1]-xlim[0])*ww,y+h-(yy-ylim[0])/(ylim[1]-ylim[0])*h])
 if len(points)>1:d.line([tuple(p) for p in points],fill=c,width=w)
 return points[-1]
def bar(d,x,y,w,h,lo,hi,label,log=False):
 for k in range(h):d.line((x,y+k,x+w,y+k),fill=color(1-k/(h-1)))
 for v in np.linspace(lo,hi,5):
  yy=y+h-(v-lo)/(hi-lo)*h;d.text((x+w+10,yy-10),f'{10**v:.2g}' if log else f'{v:.3g}',font=font(17),fill=INK)
 d.text((x-10,y-30),label,font=font(19),fill=INK)
def save(im,name):im.save(F/name)
def summary():return json.loads((R/'summary.json').read_text())
def matrix(title,name,m,unit,percentage=False):
 im,d=canvas(title,1160,850);x0,y0,cw,ch=230,170,175,125;hi=100 if percentage else float(m.max())
 for i in range(4):
  ct(d,160,y0+i*ch+43,NAMES[i],23)
  for j in range(4):
   x=x0+j*cw;y=y0+i*ch;v=m[i,j];q=v/hi;d.rectangle((x,y,x+cw-3,y+ch-3),fill=color(q));ct(d,x+cw/2,y+43,f'{v:.1f}' if percentage else f'{v:.3f}',25,'white' if q<.6 else INK,True)
   if i==0:ct(d,x+cw/2,y-40,NAMES[j],23)
 d.text((42,98),'Active LED',font=font(21),fill=INK);ct(d,x0+2*cw,y0+4*ch+30,'Fluorescent source well',23);bar(d,990,y0,24,4*ch-3,0,hi,unit);save(im,name)
def figures():
 s=summary();rows=s['cases'];im,d=canvas('Optical power sensitivity',1500,1260);rect=(355,130,970,1008);mx=max(r['green_nW']+r['green_SE_nW'] for r in rows)*1.08
 axes(d,rect,(0,mx),(0,24),[(v,f'{v:.2f}') for v in np.linspace(0,mx,6)],[],'Received green power (nW)');legend(d,355,83,[('Mean ± 1 SE',GREEN)])
 for i,r in enumerate(rows):
  y=rect[1]+i*42+8;v=r['green_nW']/mx*rect[2];e=r['green_SE_nW']/mx*rect[2];d.text((42,y),r['case'],font=font(20),fill=INK);d.rectangle((rect[0],y+3,rect[0]+v,y+25),fill=GREEN);d.line((rect[0]+v-e,y+14,rect[0]+v+e,y+14),fill=INK,width=3)
 save(im,'01_parameter_sweep.png')
 a=np.load(R/'spatial_maps.npz');im,d=canvas('Cell-floor irradiance and collection',1660,1090)
 for b,(data,title,unit) in enumerate([(a['floor_irradiance_uW_mm2'],'A  Transmitted irradiance','µW/mm²'),(a['eta']*100,'B  Collection efficiency','%')]):
  panel(d,42,92+b*490,title);hi=float(data.max())
  for j in range(4):
   x=103+j*355;y=167+b*490;ct(d,x+128,y-37,NAMES[j],22,COLS[j],True)
   for ii in range(8):
    for jj in range(7):d.rectangle((x+ii*32,y+(6-jj)*32,x+(ii+1)*32-1,y+(7-jj)*32-1),fill=color(data[j,ii,jj]/hi))
   axes(d,(x,y,256,224),(1.3,5.3),(1.25,4.05),[(v,str(v)) for v in [1.3,3.3,5.3]],[(v,str(v)) for v in [1.25,2.65,4.05]],'Local x (mm)','Local y (mm)',16)
  bar(d,1535,167+b*490,20,224,0,hi,unit)
 save(im,'02_floor_maps.png');matrix('Cell-layer optical transfer','03_well_transfer.png',np.array(s['LED_by_well_nW']),'nW')
 vv=np.array([[r['green']['angular_power_nW'][str(a)] for a in [20,30,45,65,90]] for r in json.loads((R/'ideal_NE.json').read_text())['runs']]);v=vv.mean(0);e=vv.std(0,ddof=1)/np.sqrt(3);im,d=canvas('Detector angular acceptance',1200,760);rect=(140,163,915,440);yl=(0,max(v+e)*1.12)
 axes(d,rect,(0,90),yl,[(x,str(x)) for x in [0,20,30,45,65,90]],[(x,f'{x:.2f}') for x in np.linspace(*yl,5)],'Acceptance half-angle (°)','Cumulative green power (nW)');legend(d,140,94,[('Mean ± 1 SE',GREEN)]);line(d,[20,30,45,65,90],v,rect,(0,90),yl,GREEN,3)
 for xx,yy,ee in zip([20,30,45,65,90],v,e):
  px=rect[0]+xx/90*rect[2];py=rect[1]+rect[3]-yy/yl[1]*rect[3];dh=ee/yl[1]*rect[3];d.line((px,py-dh,px,py+dh),fill=INK,width=2);d.ellipse((px-5,py-5,px+5,py+5),fill=GREEN)
 save(im,'04_detector_angles.png');sig.generate();signal_figures();budget();path_figure();m=np.array(json.loads((R/'volume_standard_summary.json').read_text())['row_normalized'])*100;matrix('Uniform-volume optical transfer','08_volume_standard_validation.png',m,'%',True)
def signal_figures():
 a=np.load(R/'frequency_traces.npz');report=json.loads((R/'frequency_summary.json').read_text());t=a['t_s']*1000;sel=t<=120;im,d=canvas('Conditional detector signals',1500,1200);yl=(-.08,max(a['received_nW'][sel].max(),a['ideal_nW'][sel].max())*1.05)
 for i,(title,key,c) in enumerate([('A  Clean fluorescence','ideal_nW',GREEN),('B  Conditional received signal','received_nW',ORANGE),('C  Overlay','overlay',INK),('D  Interference residual','residual_nW',PURPLE)]):
  y=145+i*255;rect=(140,y,1250,145);panel(d,60,y-65,title);lim=yl if i<3 else (min(0,float(a['residual_nW'][sel].min()))-.02,float(a['residual_nW'][sel].max())+.02)
  axes(d,rect,(0,120),lim,[(x,str(x)) for x in [0,30,60,90,120]],[(v,f'{v:.2f}') for v in np.linspace(*lim,4)],'Time (ms)' if i==3 else '', 'Green-equivalent power (nW)',17)
  if key=='overlay':line(d,t[sel],a['received_nW'][sel],rect,(0,120),lim,ORANGE);line(d,t[sel],a['ideal_nW'][sel],rect,(0,120),lim,GREEN);legend(d,770,y-57,[('Ideal',GREEN),('Received',ORANGE)],18)
  else:line(d,t[sel],a[key][sel],rect,(0,120),lim,c)
 save(im,'05_frequency_recovery.png')
 im,d=canvas('Spectral interference and demodulation',1500,1110);rect=(145,160,1220,345);sf=a['spectrum_frequency_Hz'];top=math.ceil(math.log10(max(a['spectrum_nW'].max(),a['ideal_spectrum_nW'].max())));yl=(-5,float(top));panel(d,50,83,'A  Amplitude spectrum')
 axes(d,rect,(0,180),yl,[(v,str(v)) for v in [0,30,60,90,120,150,180]],[(v,f'10^{int(v)}') for v in np.arange(yl[0],yl[1]+1)],'Frequency (Hz)','Green-equivalent amplitude (nW)');line(d,sf,np.log10(np.maximum(a['spectrum_nW'],1e-5)),rect,(0,180),yl,ORANGE);line(d,sf,np.log10(np.maximum(a['ideal_spectrum_nW'],1e-5)),rect,(0,180),yl,GREEN);legend(d,900,86,[('Ideal',GREEN),('Received',ORANGE)])
 order=np.argsort(sig.FREQ);st=report['metrics'];bias=np.array(st['amplitude_bias_percent'])[order];ce=np.array(st['complex_relative_error_percent'])[order];sn=np.array(st['demodulation_SINR_dB'])[order]
 for k,rect in enumerate([(135,720,540,250),(860,720,500,250)]):
  panel(d,rect[0]-50,626,'B  DLIA error' if k==0 else 'C  Error-inclusive SINR');lim=(0,float(max(bias.max(),ce.max())*1.2)) if k==0 else (0,float(np.ceil(sn.max()/10)*10))
  axes(d,rect,(-.5,3.5),lim,[(j,str(int(sig.FREQ[order[j]]))) for j in range(4)],[(v,f'{v:.1f}') for v in np.linspace(*lim,5)],'LED frequency (Hz)','Error (%)' if k==0 else '20 log10(|Cideal| / |ΔC|), dB')
  if k==0:legend(d,140,671,[('Amplitude bias',ORANGE),('Complex error',PURPLE)],17)
  for j in range(4):
   x=rect[0]+(j+.5)/4*rect[2]
   for dx,val,col,ww in ([(-28,bias[j],ORANGE,24),(5,ce[j],PURPLE,24)] if k==0 else [(-25,sn[j],BLUE,50)]):d.rectangle((x+dx,rect[1]+rect[3]-val/lim[1]*rect[3],x+dx+ww,rect[1]+rect[3]),fill=col)
 save(im,'09_interference_metrics.png');sweep_figure()
def sweep_figure():
 rows=list(csv.DictReader((R/'interference_sweep.csv').open()));im,d=canvas('Interference and noise sensitivity',1510,1080);ods=['ideal','3','4','5'];ambs=list(sig.AMBIENT);labels=['None','DC','100.3 Hz','67 Hz']
 for k,key in enumerate(['mean_complex_relative_error_percent','median_demodulation_SINR_dB']):
  m=np.zeros((4,4))
  for i,amb in enumerate(ambs):
   for j,od in enumerate(ods):
    vals=[float(r[key]) for r in rows if r['OD']==od and r['ambient']==amb and float(r['noise_sigma_nW'])==.005 and float(r['responsivity_ratio'])==.8];m[i,j]=max(vals) if k==0 else min(vals)
  x0=160+k*720;y0=180;cw,ch=112,82;lo=0 if k==0 else float(np.floor(m.min()/10)*10);hi=float(np.ceil(m.max()));panel(d,45+k*720,101,'A  Worst-channel complex error' if k==0 else 'B  Lowest-channel median SINR')
  for i in range(4):
   d.text((x0-112,y0+i*ch+24),labels[i],font=font(19),fill=INK)
   for j in range(4):
    x=x0+j*cw;y=y0+i*ch;v=m[i,j];q=(v-lo)/(hi-lo);d.rectangle((x,y,x+cw-3,y+ch-3),fill=color(q));ct(d,x+cw/2,y+26,f'{v:.2f}' if k==0 else f'{v:.1f}',21,'white' if q<.6 else INK)
    if i==0:ct(d,x+cw/2,y-33,'∞' if j==0 else ods[j],22)
  ct(d,x0+2*cw,y0+4*ch+18,'Excitation rejection OD',21);bar(d,x0+4*cw+24,y0,20,4*ch-3,lo,hi,'%' if k==0 else 'dB')
 panel(d,50,630,'C  Noise-only demodulation SNR');rect=(170,735,1150,220);axes(d,rect,(0,25),(45,80),[(v,str(v)) for v in [0,5,10,15,20,25]],[(v,str(v)) for v in [45,55,65,75]],'Electronic noise RMS (pW/sample)','Vector SNR (dB)')
 for j,q in enumerate(NAMES):
  vals=[next(r for r in rows if r['OD']=='ideal' and r['ambient']=='none' and float(r['noise_sigma_nW'])==n and r['channel']==q and float(r['responsivity_ratio'])==.8) for n in [.005,.02]];line(d,[5,20],[float(r['noise_only_demodulation_SNR_dB']) for r in vals],rect,(0,25),(45,80),COLS[j],3)
 legend(d,700,648,[(f'{int(sig.FREQ[j])} Hz',COLS[j]) for j in range(4)],17);save(im,'10_interference_sweep.png')
def budget():
 rows=[];base=summary()['cases'][0]['green_nW']
 for led,qy,rsp in __import__('itertools').product([.05,.1,.5,1.,2.],[.1,.3,.6,1.],[.01,.05,.1,.5]):
  p=base*led/.5*qy;mod=2*np.sin(np.pi*.25)/np.pi;dp=p*rsp*mod;rows.append(dict(LED_on_mW=led,duty=.25,QY=qy,cell_absorption_per_mm=.5,baseline_green_on_nW=p,baseline_green_average_nW=p*.25,fundamental_amplitude_nW=p*mod,deltaF_over_F=rsp,delta_fundamental_pW=dp*1000,max_lockin_amplitude_RMS_noise_pW_for_SNR5=dp*1000/5,photons_arriving_at_PD_per_s_on=p*1e-9*520e-9/(6.62607015e-34*299792458)))
 sig.write_csv(R/'conditional_photon_budget.csv',rows);im,d=canvas('Conditional noise threshold for SNR = 5',1400,830);x0,y0,cw,ch=260,178,185,120
 for i,rsp in enumerate([.01,.05,.1,.5]):
  ct(d,160,y0+i*ch+40,f'{rsp*100:g}',23)
  for j,led in enumerate([.05,.1,.5,1.,2.]):
   rr=next(r for r in rows if r['QY']==.6 and r['deltaF_over_F']==rsp and r['LED_on_mW']==led);v=rr['max_lockin_amplitude_RMS_noise_pW_for_SNR5'];q=(np.log10(v)+2)/4;x=x0+j*cw;y=y0+i*ch;d.rectangle((x,y,x+cw-3,y+ch-3),fill=color(q));ct(d,x+cw/2,y+40,f'{v:.2f}',25,'white' if q<.6 else INK)
   if i==0:ct(d,x+cw/2,y-42,f'{led:g}',23)
 d.text((48,98),'ΔF/F (%)',font=font(22),fill=INK);ct(d,x0+2.5*cw,y0+4*ch+30,'LED-on power (mW)',23);bar(d,1230,y0,20,4*ch-3,-2,2,'pW RMS',True);save(im,'06_conditional_budget.png')
def project(p,o,s):
 x,y,z=np.asarray(p);return o[0]+s*(.83*x-.56*y),o[1]-s*(z-40+.25*x+.36*y)
def box(d,x0,x1,y0,y1,z0,z1,c,o,s):
 pp=np.array([[x,y,z] for z in [z0,z1] for y in [y0,y1] for x in [x0,x1]])
 for ii in [[0,1,3,2],[0,2,6,4],[1,3,7,5],[4,5,7,6]]:d.polygon([project(pp[i],o,s) for i in ii],fill=c,outline='#78909b')
def geometry(d,o,s):
 for args in [(-8,8,-7,7,39.5,39.6,'#698e83'),(-.65,.65,-6,6,44.2,55.5,'#263842'),(-7.3,7.3,-.6,.6,44.2,55.5,'#324b58'),(-2,2,-2.5,2.5,39.6,40.5,'#203139'),(-2.6,2.6,-2.1,2.1,41.1,42.1,'#c1d5df')]:box(d,*args,o,s)
 for j,(sx,sy) in enumerate([(1,1),(-1,1),(-1,-1),(1,-1)]):
  box(d,sx*3.3-1.8,sx*3.3+1.8,sy*5.7-.7,sy*5.7+.7,39.6,41.3,'#cfb77b',o,s);x0=sx*3.3-2.5;x1=x0+5;y0=sy*2.65-1.9;y1=y0+3.8
  for x in [x0,x1]:d.line([project([x,y0,42.5],o,s),project([x,y0,55.5],o,s),project([x,y1,55.5],o,s)],fill='#9aaeb8',width=2)
  pp=[project([x,y,43],o,s) for x,y in [(x0+.5,y0+.5),(x1-.5,y0+.5),(x1-.5,y1-.5),(x0+.5,y1-.5)]];d.polygon(pp,fill='#e0ecd7',outline=COLS[j],width=2);x,y=project([sx*3.3,sy*2.65,55.8],o,s);ct(d,x,y-28,NAMES[j],20,COLS[j],True)
def paths_draw(d,paths,o,s,quads):
 for sx,sy in quads:
  for wave,col,num in [('ex',BLUE,12),('em',GREEN,8)]:
   for raw in paths[wave][:num]:
    q=np.array(raw).copy();q[:,0]*=sx;q[:,1]*=sy;ok=(q[:,2]>=39.6)&(q[:,2]<=55.5)&(abs(q[:,0])<9)&(abs(q[:,1])<8)
    for start in np.where(ok&~np.r_[False,ok[:-1]])[0]:
     end=start+1
     while end<len(q) and ok[end]:end+=1
     if end-start>1:d.line([project(p,o,s) for p in q[start:end]],fill=col,width=2)
def path_figure():
 im,d=canvas('Sampled optical paths',1200,1070);o=(600,880);geometry(d,o,38);paths_draw(d,json.loads((R/'animation_paths.json').read_text()),o,38,[(1,1)]);legend(d,210,90,[('Excitation',BLUE),('Fluorescence',GREEN)])
 p=np.array([-7.,-5.,40.]);a=project(p,o,38)
 for delta,label in [([2,0,0],'x'),([0,2,0],'y'),([0,0,2],'z')]:
  b=project(p+delta,o,38);d.line([a,b],fill=INK,width=3);d.text((b[0]+3,b[1]-5),label,font=font(21),fill=INK)
 x,y=project([0,-.4,40.5],o,38);d.line((x-6,y,x+6,y),fill=PURPLE,width=2);d.line((x,y-6,x,y+6),fill=PURPLE,width=2);d.text((x+10,y),'PD',font=font(20),fill=PURPLE)
 ct(d,170,1000,'2 mm',21);save(im,'07_sample_paths.png')
def movie_state(k,fps=10,slow=100):
 sample=int(round(k*sig.FS/(fps*slow)));t=sample/sig.FS;return sample,t,sig.gates(t).astype(int)
def render_frame(k,dat,paths):
 sample,t,on=movie_state(k);im,d=canvas('MC paths and conditional detector signals',1600,1030);d.text((1205,30),f't = {t*1000:5.1f} ms | 100×',font=font(24),fill=INK);panel(d,35,108,'A  NE sampled paths');o=(380,790);geometry(d,o,27);quads=[(1,1),(-1,1),(-1,-1),(1,-1)];paths_draw(d,paths,o,27,[(1,1)] if on[0] else [])
 for j,(sx,sy) in enumerate(quads):
  x,y=project([sx*3.3,sy*5.7,40.2],o,27);d.ellipse((x-7,y-7,x+7,y+7),fill=COLS[j] if on[j] else '#a3abb1')
 x,y=project([0,-.4,40.5],o,27);d.line((x-5,y,x+5,y),fill=PURPLE,width=2);d.line((x,y-5,x,y+5),fill=PURPLE,width=2);d.text((x+8,y),'PD',font=font(18),fill=PURPLE)
 legend(d,65,157,[('Excitation',BLUE),('Fluorescence',GREEN)])
 for j,q in enumerate(NAMES):
  x=45+(j%2)*325;y=932+(j//2)*42;d.ellipse((x,y+5,x+17,y+22),fill=COLS[j] if on[j] else '#a3abb1');d.text((x+28,y),f'{q}: {int(sig.FREQ[j])} Hz',font=font(22),fill=INK)
 tms=dat['t_s'][:sample+1]*1000;yl=(-.08,max(dat['received_nW'][:800].max(),dat['ideal_nW'][:800].max())*1.05)
 for i,(title,key,col) in enumerate([('B  Ideal','ideal_nW',GREEN),('C  Received','received_nW',ORANGE),('D  Overlay','overlay',INK),('E  Residual','residual_nW',PURPLE)]):
  y=175+i*207;rect=(890,y,635,113);panel(d,822,y-67,title);lim=yl if i<3 else (min(0,float(dat['residual_nW'][:800].min()))-.02,float(dat['residual_nW'][:800].max())+.02)
  axes(d,rect,(0,200),lim,[(v,str(v)) for v in [0,50,100,150,200]],[(v,f'{v:.1f}') for v in np.linspace(*lim,3)],'Time (ms)' if i==3 else '', 'Green-equivalent power (nW)',15);x=rect[0]+t/.2*rect[2];d.line((x,rect[1],x,rect[1]+rect[3]),fill='#a7b3bb')
  for kk,cc in ([('received_nW',ORANGE),('ideal_nW',GREEN)] if key=='overlay' else [(key,col)]):
   pp=line(d,tms,dat[kk][:sample+1],rect,(0,200),lim,cc)
   if pp is not None:xx,yy=pp;d.ellipse((xx-4,yy-4,xx+4,yy+4),fill=cc)
  if i==2:legend(d,1180,y-57,[('Ideal',GREEN),('Received',ORANGE)],16)
 return im,dict(frame=k,time_s=t,sample_index=sample,LED_states=on.tolist(),ideal_nW=float(dat['ideal_nW'][sample]),received_nW=float(dat['received_nW'][sample]),residual_nW=float(dat['residual_nW'][sample]),history_last_sample=sample)
def video(ffmpeg=None,frame_dir=None):
 dat=np.load(R/'frequency_traces.npz');paths=json.loads((R/'animation_paths.json').read_text());gif=[];records=[];proc=None
 if frame_dir:frame_dir=Path(frame_dir);frame_dir.mkdir(parents=True,exist_ok=True)
 if ffmpeg:proc=subprocess.Popen([ffmpeg,'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s','1600x1030','-r','10','-i','-','-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','19','-movflags','+faststart',str(P/'optical_slow_motion.mp4')],stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 for k in range(200):
  im,record=render_frame(k,dat,paths);records.append(record)
  if frame_dir:im.save(frame_dir/f'frame_{k:03d}.png')
  if proc:proc.stdin.write(im.tobytes())
  gif.append(im.resize((1000,644),Image.Resampling.LANCZOS).quantize(colors=96))
 if proc:
  proc.stdin.close();err=proc.stderr.read();ret=proc.wait()
  if ret:raise RuntimeError(err.decode(errors='replace'))
 gif[0].save(P/'optical_slow_motion.gif',save_all=True,append_images=gif[1:],duration=100,loop=0,optimize=False)
 for row in records:
  assert row['sample_index']==row['history_last_sample'];assert np.array_equal(dat['pulses'][row['sample_index']].astype(int),row['LED_states']);assert abs(row['received_nW']-row['ideal_nW']-row['residual_nW'])<1e-12
 assert records[0]['time_s']==0 and records[0]['sample_index']==0
 (R/'video_frame_alignment.json').write_text(json.dumps(dict(pass_test=True,frames=records,time_definition='sample = round(frame*4000/(10*100)); all panels read the same sample and reveal no future samples.',no_flight_delay='Complete paths pulse at the same gate instant; no arbitrary traveling dot or propagation delay.'),indent=2))
 (R/'video_metadata.json').write_text(json.dumps(dict(frames=200,fps=10,video_duration_seconds=20,first_modulation_time_s=0,last_modulation_time_s=records[-1]['time_s'],physical_modulation_duration_s=.2,slow_factor=100,GIF_frames=200,GIF_frame_duration_ms=100,source='animation_paths.json and frequency_traces.npz',geometry='Actual NE sample paths only; four LED indicators share the clock. No mirrored paths. Local cutaway, not an STL viewer.',frame_output='Streamed MP4 or externally encoded optional PNG frames; in-memory GIF.',limits='Reflected fluorescence retained in ideal signal. Residual contains excitation leakage plus assumed ambient/noise. No calcium response or physical photon flight time.'),indent=2));print('Synchronized video generated',flush=True)

