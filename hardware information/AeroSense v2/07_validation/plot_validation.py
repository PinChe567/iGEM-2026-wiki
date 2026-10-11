"""Analyze REAL records in the provided CSV schema; never generate example data.
python plot_validation.py --input measurements --output measured_results
Requires NumPy and Pillow. Empty templates produce only a no-data status JSON.
"""
from pathlib import Path
import argparse,csv,json,math,re
from collections import defaultdict
import numpy as np
from PIL import Image,ImageDraw,ImageFont
POSITIONS=['NE','NW','SW','SE'];COLORS=['#0b8891','#7759b7','#b76b22','#3d8a5a']
def truth(s):return str(s).strip().lower() in ['true','1','yes']
def load(p):return list(csv.DictReader(p.open(encoding='utf-8-sig'))) if p.exists() else []
def safe(s):return re.sub('[^A-Za-z0-9_-]+','_',s)[:70]
def font(n):
 try:return ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf',n)
 except:
  try:return ImageFont.truetype('DejaVuSans.ttf',n)
  except:return ImageFont.load_default()
def canvas(title,subtitle,w=1300,h=820):
 im=Image.new('RGB',(w,h),'white');d=ImageDraw.Draw(im);d.text((45,28),title,font=font(31),fill='#17354a');d.text((45,74),subtitle,font=font(18),fill='#536676');return im,d
def lineplot(path,title,subtitle,series,xlabel):
 im,d=canvas(title,subtitle);left,top,width,height=100,160,1060,540
 xs=[p[0] for _,points in series for p in points];ys=[max(p[1]+p[2],max(p[4]) if len(p)>4 else p[1]) for _,points in series for p in points]
 if not xs:return
 xmin=min(xs);xmax=max(xs);xrange=max(xmax-xmin,1);ymax=max(max(ys)*1.15,1e-12)
 for val in np.linspace(0,ymax,6):
  yy=top+height*(1-val/ymax);d.line((left,yy,left+width,yy),fill='#e0e7eb');d.text((8,yy-8),f'{val:.3g}',font=font(16),fill='#536676')
 for val in sorted(set(xs)):
  xx=left+width*(val-xmin)/xrange;d.text((xx-15,top+height+15),f'{val:g}',font=font(18),fill='#17354a')
 for si,(name,points) in enumerate(series):
  color=COLORS[si%4];coords=[]
  for point in points:
   x,y,sd,n=point[:4]
   xx=left+width*(x-xmin)/xrange;yy=top+height*(1-y/ymax);coords.append((xx,yy));low=top+height*(1-(y-sd)/ymax);high=top+height*(1-(y+sd)/ymax);d.line((xx,low,xx,high),fill=color,width=2);d.ellipse((xx-5,yy-5,xx+5,yy+5),fill=color)
   if len(point)>4:
    for jitter,value in zip(np.linspace(-10,10,len(point[4])),point[4]):
     yyraw=top+height*(1-value/ymax);d.ellipse((xx+jitter-2,yyraw-2,xx+jitter+2,yyraw+2),fill=color)
  if len(coords)>1:d.line(coords,fill=color,width=3)
  d.text((100+si*260,120),name,font=font(21),fill=color)
 d.text((470,760),xlabel,font=font(22),fill='#17354a');d.text((90,97),'Response [V]; error bars = SD',font=font(16),fill='#536676');im.save(path)
def heatmap(path,measured,model,title):
 im,d=canvas(title,'Rows = physical LED; columns = single fluorescent well. Each row sums to 1.',w=1400,h=800)
 for panel,(name,mat) in enumerate([('Measured volume standard',measured),('Idealized volume-standard MC',model)]):
  x0=110+panel*700;y0=205;size=120;d.text((x0,130),name,font=font(24),fill='#17354a')
  if mat is None:d.text((x0,210),'Model unavailable',font=font(24),fill='#536676');continue
  for i,label in enumerate(POSITIONS):d.text((x0-55,y0+i*size+40),label,font=font(24),fill='#17354a');d.text((x0+i*size+38,y0-45),label,font=font(24),fill='#17354a')
  for i in range(4):
   for j in range(4):
    v=float(mat[i,j]);t=np.clip(v,0,1);c=tuple((np.array([239,247,249])*(1-t)+np.array([15,128,139])*t).astype(int));x=x0+j*size;y=y0+i*size;d.rectangle((x,y,x+size-2,y+size-2),fill=c);d.text((x+30,y+42),f'{v:.3f}',font=font(23),fill='white' if v>.55 else '#17354a')
 d.text((50,735),'Ratios support a geometric comparison. This is not the bottom-cell-layer unmixing matrix or an absolute power validation.',font=font(18),fill='#536676');im.save(path)
def optical(rows,out,model_path):
 for r in rows:
  if r['led_position'] not in POSITIONS:raise ValueError('Unknown physical LED position.')
  if r['sample_kind'] not in ['blank','level','single_well']:raise ValueError('Unknown sample_kind.')
  if any(not math.isfinite(float(r[k])) for k in ['I_V','Q_V','level_relative','volume_uL','duty_percent','sample_rate_Hz','frequency_Hz']):raise ValueError('Nonfinite optical input.')
 summary=[];sessions=sorted(set(r['session_id'] for r in rows))
 for session in sessions:
  raw=[r for r in rows if r['session_id']==session];good=[r for r in raw if truth(r['valid'])];key=[(r['block_id'],r['led_position']) for r in raw]
  if len(set(key))!=len(key):raise ValueError(f'Duplicate block/channel IDs in {session}')
  stats={'session':session,'channel_rows':len(raw),'invalid_channel_rows':len(raw)-len(good),'technical_blocks':len(set(r['block_id'] for r in raw)),'warning':'Repeated blocks are technical readings, not independent biological samples.'}
  series=[];matrix=np.full((4,4),np.nan);complex_matrix=np.full((4,4),complex(np.nan,np.nan));levels_summary=[]
  for i,led in enumerate(POSITIONS):
   rr=[r for r in good if r['led_position']==led]
   signatures={tuple(float(r[k]) for k in ['volume_uL','duty_percent','sample_rate_Hz','frequency_Hz']) for r in rr}
   if len(signatures)>1:raise ValueError(f'Mixed volume/acquisition settings for {session}/{led}; use separate matched sessions.')
   blanks=[complex(float(r['I_V']),float(r['Q_V'])) for r in rr if r['sample_kind']=='blank']
   if len(blanks)<5:stats[led]={'status':'requires_at_least_5_valid_matched_blank_blocks'};continue
   b=np.array(blanks);mean=b.mean();noise=max(float(b.real.std(ddof=1)),float(b.imag.std(ddof=1)));pts=[]
   levels=sorted(set(float(r['level_relative']) for r in rr if r['sample_kind']=='level'))
   for level in levels:
    samples=np.array([abs(complex(float(r['I_V']),float(r['Q_V']))-mean) for r in rr if r['sample_kind']=='level' and float(r['level_relative'])==level]);avg=float(samples.mean());sd=float(samples.std(ddof=1)) if len(samples)>1 else 0.;pts.append((level,avg,sd,len(samples),samples.tolist()));levels_summary.append(dict(led=led,relative_level=level,mean_corrected_V=avg,SD_V=sd,technical_blocks=len(samples),CV=sd/avg if avg else None,blank_noise_IQ_V=noise,signal_to_3sigma_blank=avg/(3*noise) if noise>0 else None))
   series.append((led,pts));stats[led]={'blank_blocks':len(b),'blank_I_mean_V':float(mean.real),'blank_Q_mean_V':float(mean.imag),'blank_noise_IQ_V':noise}
   for j,well in enumerate(POSITIONS):
    vals=[complex(float(r['I_V']),float(r['Q_V']))-mean for r in rr if r['sample_kind']=='single_well' and r['source_well']==well]
    if vals:complex_matrix[i,j]=np.mean(vals);matrix[i,j]=abs(complex_matrix[i,j])
  if any(pts for _,pts in series):lineplot(out/(safe(session)+'_levels.png'),'Measured optical standard response','Points are means of technical blocks; blank is subtracted in complex I/Q.',series,'Relative standard level')
  stats['levels']=levels_summary
  if np.all(np.isfinite(matrix)) and np.all(matrix.sum(1)>0):
   norm=matrix/matrix.sum(1)[:,None];model=None
   if model_path.exists():
    modeldoc=json.loads(model_path.read_text());assert modeldoc.get('row_order')==POSITIONS and modeldoc.get('column_order')==POSITIONS,'Model physical ordering must be explicit';model=np.array(modeldoc['row_normalized'])
   heatmap(out/(safe(session)+'_matrix.png'),norm,model,'Measured vs simulated single-well matrix')
   cond=float(np.linalg.cond(complex_matrix));stats.update(amplitude_matrix_V=matrix.tolist(),complex_matrix_real_V=complex_matrix.real.tolist(),complex_matrix_imaginary_V=complex_matrix.imag.tolist(),row_normalized=norm.tolist(),complex_matrix_condition_number=cond if math.isfinite(cond) else None,condition_number_status='finite' if math.isfinite(cond) else 'singular_or_nonfinite',mean_absolute_row_proportion_error_vs_MC=float(np.abs(norm-model).mean()) if model is not None else None)
  else:stats['matrix_status']='incomplete; all16 LED/well combinations are required'
  summary.append(stats)
 return summary
def main():
 p=argparse.ArgumentParser();p.add_argument('--input',default='templates');p.add_argument('--output',default='measured_results');p.add_argument('--model',default=str(Path(__file__).resolve().parents[1]/'02_simulation/optics/results/volume_standard_summary.json'));a=p.parse_args();src=Path(a.input);out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
 files=['electronics','led_mapping','optical','fit_checks','reassembly','water_flow','manual_tasks','manual_ratings','manual_changes'];data={k:load(src/(k+'.csv')) for k in files};status=dict(state='measured_rows_present' if any(data.values()) else 'NO_EXPERIMENTAL_DATA',rows={k:len(v) for k,v in data.items()})
 if data['optical']:status['optical']=optical(data['optical'],out,Path(a.model))
 if data['reassembly']:
  rr=[r for r in data['reassembly'] if truth(r['valid'])];assemblies=[]
  for session in sorted(set(r['session_id'] for r in rr)):
   series=[]
   for led in POSITIONS:
    points=[]
    for cycle in sorted(set(int(r['assembly_cycle']) for r in rr if r['session_id']==session and r['condition']=='reassembly')):
     vals=[float(r['reference_signal_V']) for r in rr if r['session_id']==session and r['led_position']==led and int(r['assembly_cycle'])==cycle and r['condition']=='reassembly']
     if vals:points.append((cycle,float(np.mean(vals)),float(np.std(vals,ddof=1)) if len(vals)>1 else 0,len(vals),vals))
    if points:
     means=np.array([v[1] for v in points]);assemblies.append(dict(session=session,led=led,assembly_cycles=len(means),CV_across_assembly_means=float(means.std(ddof=1)/means.mean()) if len(means)>1 and means.mean()!=0 else None));series.append((led,points))
   if series:lineplot(out/(safe(session)+'_reassembly.png'),'Measured reassembly repeatability','Each point is one assembly mean; error bars describe within-assembly technical blocks.',series,'Assembly cycle')
  status['reassembly']=assemblies
 if data['manual_tasks']:
  status['manual_tasks']=[dict(round=r,task_id=t,participants=len(z),median_time_s=float(np.median([float(x['time_seconds']) for x in z])),independent_completions=sum(x['outcome']=='independent' for x in z),assisted_completions=sum(x['outcome']=='assisted' for x in z),incomplete=sum(x['outcome']=='incomplete' for x in z)) for r in sorted(set(x['round'] for x in data['manual_tasks'])) for t in sorted(set(x['task_id'] for x in data['manual_tasks'])) for z in [[x for x in data['manual_tasks'] if x['round']==r and x['task_id']==t]] if z]
 (out/'analysis_summary.json').write_text(json.dumps(status,indent=2,allow_nan=False),encoding='utf-8');print(status['state']);print('No automatic hardware-pass, LOD, biological-n or usability-population claim is generated.')
if __name__=='__main__':main()
