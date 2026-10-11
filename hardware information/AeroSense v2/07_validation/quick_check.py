"""Analyze one labelled cell-free standard-liquid session; never synthesize measurements.
Usage: python quick_check.py --input session.json --mapping SW,SE,NE,NW
Mapping is the OBSERVED D1..D4 -> well mapping, not an automatic PCB assumption.
Use --self-test for in-memory synthetic checks; no experimental files are generated.
"""
from pathlib import Path
import argparse,csv,json,hashlib
import numpy as np
P=Path(__file__).resolve().parent
STATES=['B_CAL','B_CHECK','NE_C','NW_C','SW_C','SE_C','ALL_HALF','ALL_C','ALL_HALF_REPEAT']
WELLS=['NE','NW','SW','SE']
def analyse(records,mapping):
 if sorted(mapping)!=sorted(WELLS):raise ValueError('Confirm observed D1..D4 mapping; list each quadrant once.')
 rows=[];seen=set();excluded=[];contexts={};ignored=0;last_time=-1
 def finite_number(x):return isinstance(x,(int,float)) and not isinstance(x,bool) and np.isfinite(x)
 context_fields=['mode','deviceId','bootId','firmware','processingSchema','iqConvention','sampleRateHz','samples','dutyPercent','ledMask','frequenciesHz','acquisitionSignature']
 for r in records:
  if not isinstance(r,dict):raise ValueError('Each acquisition record must be an object.')
  if str(r.get('mode','')).lower()=='demo' or r.get('demo') is True:raise ValueError('DEMO records are not experimental evidence.')
  label=str(r.get('conditionTag') or r.get('notes') or '').strip().upper()
  if label not in STATES:ignored+=1;continue
  if r.get('mode')!='hardware':raise ValueError('Formal states require explicit hardware mode; missing/simulation mode is not measured evidence.')
  if any(not isinstance(r.get(k),str) or not r[k].strip() for k in ['deviceId','bootId','id','firmware','acquisitionSignature']):raise ValueError('Nonempty deviceId, bootId, id, firmware and acquisitionSignature strings are required.')
  if r.get('processingSchema')!=2 or r.get('iqConvention')!='I_cos_Q_sin_peak_V':raise ValueError('Use processingSchema 2 and I_cos_Q_sin_peak_V firmware records.')
  if r.get('frequenciesHz')!=[41,67,89,113] or r.get('sampleRateHz')!=4000 or r.get('samples')!=8000:raise ValueError('Expected four frequencies [41,67,89,113] Hz, 4000 Hz sampling and 8000 samples.')
  duty=r.get('dutyPercent')
  if not isinstance(duty,int) or isinstance(duty,bool) or not 1<=duty<=50:raise ValueError('Need integer dutyPercent between 1 and 50.')
  stamp=r.get('deviceTimeMs')
  if not finite_number(stamp) or stamp<0 or stamp<=last_time:raise ValueError('Formal records must be in strictly increasing deviceTimeMs order within one boot.')
  last_time=stamp
  identity=(r.get('deviceId'),r.get('bootId'),r.get('id'))
  if identity in seen:raise ValueError('Duplicate block ID; do not count repeated exports as replicates.')
  seen.add(identity)
  arrays={}
  for key in ['inPhaseV','quadratureV','amplitudeV']:
   value=r.get(key)
   if not isinstance(value,list) or len(value)!=4 or not all(finite_number(v) for v in value):raise ValueError('Need four finite numeric values in each raw I, Q and amplitude array; broadcasting is not permitted.')
   arrays[key]=np.asarray(value,float)
  iq=arrays['inPhaseV']+1j*arrays['quadratureV']
  reasons=[]
  if r.get('valid') is not True:reasons.append('firmware invalid')
  if r.get('ledMask')!=15:reasons.append('not all four LEDs')
  if r.get('railSamples')!=0:reasons.append('ADC rail or missing railSamples')
  if not finite_number(r.get('maxIntervalErrorUs')) or not 0<=r['maxIntervalErrorUs']<=50:reasons.append('timing maximum missing or outside 0..50 us')
  if not finite_number(r.get('rmsIntervalErrorUs')) or r['rmsIntervalErrorUs']<0:reasons.append('timing RMS missing or negative')
  if reasons:excluded.append({'id':r['id'],'condition':label,'reason':'; '.join(reasons)});continue
  context={k:r[k] for k in context_fields};contexts[json.dumps(context,sort_keys=True)]=context
  rows.append((label,iq,r))
 if len(contexts)!=1:raise ValueError('Use one device, boot and acquisition setting for the comparison.')
 groups={s:np.array([iq for label,iq,_ in rows if label==s]) for s in STATES}
 counts={s:len(v) for s,v in groups.items()}
 if any(v<5 for v in counts.values()):raise ValueError('Need >=5 independent valid blocks per state: '+json.dumps(counts))
 blank=groups['B_CAL'].mean(axis=0)
 corrected={s:z-blank for s,z in groups.items()}
 ref=corrected['ALL_C'].mean(axis=0)
 # Same conservative phase guard as correction.js; not a validated optical LOD.
 phase_uncertainty=np.maximum(2.5/65536,np.sqrt(np.var(groups['B_CAL'],axis=0,ddof=1)/counts['B_CAL']+np.var(groups['ALL_C'],axis=0,ddof=1)/counts['ALL_C']))
 if np.any(abs(ref)<=5*phase_uncertainty):raise ValueError('ALL_C phase reference is below the five-uncertainty guard; do not infer a stable signed response.')
 if min(r['deviceTimeMs'] for label,_,r in rows if label=='ALL_HALF_REPEAT')<=max(r['deviceTimeMs'] for label,_,r in rows if label=='ALL_HALF'):raise ValueError('ALL_HALF_REPEAT must be acquired after all ALL_HALF blocks.')
 unit=np.conj(ref)/abs(ref)
 projected={s:np.real(z*unit) for s,z in corrected.items()}
 sigma=np.maximum(projected['B_CHECK'].std(axis=0,ddof=1),1e-12)
 source_matrix=np.column_stack([abs(corrected[w+'_C'].mean(axis=0)) for w in WELLS])
 order=[mapping.index(w) for w in WELLS];matrix=source_matrix[order]
 if np.any(matrix.sum(axis=1)<=1e-12):raise ValueError('Zero matrix row; signal insufficient for normalized transfer.')
 normalized=matrix/matrix.sum(axis=1,keepdims=True)
 levels={s:dict(mean_V=projected[s].mean(axis=0).tolist(),SD_V=projected[s].std(axis=0,ddof=1).tolist(),n=counts[s]) for s in ['B_CHECK','ALL_HALF','ALL_C','ALL_HALF_REPEAT']}
 full=projected['ALL_C'].mean(axis=0);half=projected['ALL_HALF'].mean(axis=0);rep=projected['ALL_HALF_REPEAT'].mean(axis=0)
 ratio=half/full;drift=(rep-half)/np.maximum(abs(half),1e-12)
 cv={s:(projected[s].std(axis=0,ddof=1)/np.maximum(abs(projected[s].mean(axis=0)),1e-12)).tolist() for s in ['ALL_HALF','ALL_C']}
 heldout_mean=projected['B_CHECK'].mean(axis=0);half_margin=half-heldout_mean
 criteria=dict(no_invalid_blocks=len(excluded)==0,half_above_5sigma=bool(np.all(half_margin>5*sigma)),monotonic=bool(np.all((full>half)&(half>heldout_mean))),half_ratio_0p35_to_0p65=bool(np.all((ratio>=.35)&(ratio<=.65))),technical_CV_le_10percent=all(v<=.1 for a in cv.values() for v in a),half_repeat_drift_le_10percent=bool(np.all(abs(drift)<=.1)),largest_signal_expected_well=bool(np.all(np.argmax(normalized,axis=1)==np.arange(4))),diagonal_fraction_gt_0p6=bool(np.all(np.diag(normalized)>.6)))
 condition=float(np.linalg.cond(matrix))
 return dict(state='MEASURED_CELL_FREE_SESSION',analysis_schema=2,acquisition_context=next(iter(contexts.values())),counts=counts,excluded=excluded,ignored_unlabelled_or_other_condition_records=ignored,block_ids_by_state={s:[r['id'] for label,_,r in rows if label==s] for s in STATES},device_time_range_ms=[rows[0][2]['deviceTimeMs'],rows[-1][2]['deviceTimeMs']],mapping_D1_D4=mapping,raw_blank_complex_V=[[float(v.real),float(v.imag)] for v in blank],heldout_blank_raw_mean_magnitude_V=abs(groups['B_CHECK'].mean(axis=0)).tolist(),heldout_blank_corrected_mean_magnitude_V=abs(corrected['B_CHECK'].mean(axis=0)).tolist(),heldout_projection_SD_V=sigma.tolist(),half_minus_heldout_blank_V=half_margin.tolist(),phase_reference_uncertainty_guard_V=phase_uncertainty.tolist(),levels=levels,half_to_full_ratio=ratio.tolist(),repeat_half_relative_drift=drift.tolist(),technical_CV=cv,transfer_matrix_V=matrix.tolist(),row_normalized=normalized.tolist(),matrix_condition_number=condition if np.isfinite(condition) else None,matrix_condition_status='finite' if np.isfinite(condition) else 'singular_or_nonfinite',criteria=criteria,criteria_definitions={'half_above_5sigma':'Mean ALL_HALF projection minus independent B_CHECK mean must exceed five B_CHECK block SDs in every channel; not a formal LOD.'},all_provisional_criteria_met=all(criteria.values()),claim='Cell-free optical/electronic prototype only; no VOC delivery, cell viability or odor identification validation.',n_definition='Acquisition blocks are technical repeats, not biological replicates.',processing='Subtract independent LED-on B_CAL complex mean; signed level projections use measured ALL_C phase after a five-uncertainty guard. Matrix uses magnitudes of complex means. No EMA, neural network or simulated unmixing is used.',uncertainty='n>=5 is a rapid development check, not a formal LOD or precision validation; magnitude matrix retains low-SNR positive bias. Hardware metadata cannot authenticate whether supplied records were physically measured.')
def draw(report,out):
 from PIL import Image,ImageDraw,ImageFont
 def font(size):
  for f in ['C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
   if Path(f).exists():return ImageFont.truetype(f,size)
  return ImageFont.load_default(size=size)
 colors=['#007f86','#456cb2','#c78020','#a04f8c'];ink='#163745'
 def canvas(title):
  im=Image.new('RGB',(1400,900),'white');d=ImageDraw.Draw(im);d.text((70,35),title,font=font(36),fill=ink);return im,d
 def axes(d,low,high,ylabel):
  d.text((75,102),ylabel,font=font(26),fill=ink)
  for k in range(6):
   y=745-k*115;v=low+(high-low)*k/5;d.line((150,y,1260,y),fill='#dce4e7',width=2);d.text((137,y),f'{v:.3g}',anchor='rm',font=font(24),fill=ink)
  d.line((150,170,150,745,1260,745),fill=ink,width=3)
  return lambda v:745-(v-low)/(high-low)*575
 im,d=canvas('Cell-free response');names=['B_CHECK','ALL_HALF','ALL_C']
 yy=np.array([report['levels'][s]['mean_V'] for s in names])*1e3;ee=np.array([report['levels'][s]['SD_V'] for s in names])*1e3
 low=min(0,float((yy-ee).min()));high=max(float((yy+ee).max())*1.12,low+1e-6);Y=axes(d,low,high,'Blank-corrected projection [mV]')
 for j,col in enumerate(colors):
  pts=[(230+i*460,Y(yy[i,j])) for i in range(3)];d.line(pts,fill=col,width=4)
  for i,(x,y) in enumerate(pts):
   lo,hi=Y(yy[i,j]-ee[i,j]),Y(yy[i,j]+ee[i,j]);d.line((x,lo,x,hi),fill=col,width=3);d.line((x-8,lo,x+8,lo),fill=col,width=3);d.line((x-8,hi,x+8,hi),fill=col,width=3);d.ellipse((x-7,y-7,x+7,y+7),fill=col)
  d.text((880+j*105,103),'D'+str(j+1),font=font(25),fill=col)
 for i,v in enumerate([0,.5,1]):d.text((230+i*460,775),str(v),anchor='mm',font=font(26),fill=ink)
 d.text((700,830),'Relative standard concentration',anchor='mm',font=font(28),fill=ink);im.save(out/'01_standard_response.png')
 im,d=canvas('Measured optical transfer');a=np.array(report['row_normalized']);x0,y0,cw,ch=290,210,200,125
 d.text((290,120),'Observed LED quadrant',font=font(26),fill=ink)
 for i in range(4):
  d.text((260,y0+(i+.5)*ch),WELLS[i],anchor='rm',font=font(28),fill=ink)
  for j in range(4):
   v=float(a[i,j]);col=tuple(int((1-v)*b+v*t) for b,t in zip((232,243,246),(8,117,130)));x=x0+j*cw;y=y0+i*ch;d.rectangle((x,y,x+cw-3,y+ch-3),fill=col);d.text((x+cw/2,y+ch/2),f'{v:.3f}',anchor='mm',font=font(29),fill='white' if v>.5 else ink)
 for j,w in enumerate(WELLS):d.text((x0+(j+.5)*cw,750),w,anchor='mm',font=font(28),fill=ink)
 d.text((690,810),'Fluorescent source well',anchor='mm',font=font(28),fill=ink);d.text((1090,150),'Row fraction',anchor='rm',font=font(24),fill=ink);im.save(out/'02_measured_transfer.png')
 im,d=canvas('Held-out blank');before=np.array(report['heldout_blank_raw_mean_magnitude_V'])*1e3;after=np.array(report['heldout_blank_corrected_mean_magnitude_V'])*1e3;Y=axes(d,0,max(float(max(before.max(),after.max()))*1.2,1e-6),'Magnitude of mean I/Q [mV]')
 d.text((710,100),'Raw blank',font=font(25),fill=colors[1]);d.text((900,100),'After subtraction',font=font(25),fill=colors[0])
 for j in range(4):
  x=260+j*280;d.rectangle((x-65,Y(before[j]),x-5,745),fill=colors[1]);d.rectangle((x+5,Y(after[j]),x+65,745),fill=colors[0]);d.text((x,785),'D'+str(j+1),anchor='mm',font=font(28),fill=ink)
 im.save(out/'03_heldout_blank.png')
def self_test():
 import copy
 rng=np.random.default_rng(791);mapping=WELLS.copy();M=np.eye(4)*.010+np.ones((4,4))*.0003;B=np.array([.002+.001j]*4);rows=[];checks=[]
 for state in STATES:
  if state.startswith('B_'):s=np.zeros(4)
  elif state in ['ALL_HALF','ALL_HALF_REPEAT']:s=M.sum(axis=1)*.5
  elif state=='ALL_C':s=M.sum(axis=1)
  else:s=M[:,WELLS.index(state.split('_')[0])]
  for k in range(6):
   z=B+s+rng.normal(0,1e-6,4)+1j*rng.normal(0,1e-6,4)
   rows.append(dict(id='test-'+str(len(rows)+1),deviceId='synthetic-test',bootId='test',firmware='AeroSense',mode='hardware',valid=True,ledMask=15,conditionTag=state,inPhaseV=z.real.tolist(),quadratureV=z.imag.tolist(),amplitudeV=abs(z).tolist(),acquisitionSignature='DDS4k_IQ8000_ADC2p5V_v2_41_67_89_113_duty25_mask15',processingSchema=2,iqConvention='I_cos_Q_sin_peak_V',sampleRateHz=4000,samples=8000,dutyPercent=25,frequenciesHz=[41,67,89,113],deviceTimeMs=1000+2500*len(rows),railSamples=0,maxIntervalErrorUs=2,rmsIntervalErrorUs=1))
 def rejects(name,alter):
  trial=copy.deepcopy(rows);alter(trial)
  try:analyse(trial,mapping)
  except ValueError:checks.append(name)
  else:raise AssertionError(name+' was accepted')
 r=analyse(rows,mapping);assert r['all_provisional_criteria_met'];assert np.max(abs(np.array(r['half_to_full_ratio'])-.5))<.001;assert r['acquisition_context']['dutyPercent']==25;json.dumps(r,allow_nan=False);checks.append('known response and report context')
 for mode in ['demo','simulation','']:
  rejects('reject '+repr(mode)+' mode',lambda a,m=mode:a[0].update(mode=m))
 rejects('duplicate identity',lambda a:a[-1].update(id=a[0]['id']))
 rejects('missing state',lambda a:a.__setitem__(slice(None),[r for r in a if r['conditionTag']!='SE_C']))
 rejects('changed duty despite same signature',lambda a:a[-1].update(dutyPercent=30))
 rejects('changed frequencies despite same signature',lambda a:a[-1].update(frequenciesHz=[42,67,89,113]))
 rejects('changed sample count',lambda a:a[-1].update(samples=7999))
 rejects('missing signature',lambda a:a[-1].pop('acquisitionSignature'))
 rejects('missing dutyPercent',lambda a:a[-1].pop('dutyPercent'))
 rejects('wrong I/Q convention',lambda a:a[-1].update(iqConvention='unknown'))
 rejects('cross boot',lambda a:a[-1].update(bootId='second-boot'))
 rejects('reversed time',lambda a:a.reverse())
 for key in ['inPhaseV','quadratureV','amplitudeV']:
  rejects('no broadcasting '+key,lambda a,k=key:a[0].update({k:[0.0]}))
  rejects('nonfinite '+key,lambda a,k=key:a[0].update({k:[0,0,float('nan'),0]}))
 for changes in [{'railSamples':1},{'maxIntervalErrorUs':51},{'rmsIntervalErrorUs':-1}]:
  trial=copy.deepcopy(rows);trial[0].update(changes);bad=analyse(trial,mapping)
  assert not bad['criteria']['no_invalid_blocks'] and len(bad['excluded'])==1 and bad['counts']['B_CAL']==5;checks.append('independent QC '+next(iter(changes)))
 trial=copy.deepcopy(rows);h=np.mean([np.asarray(r['inPhaseV'])+1j*np.asarray(r['quadratureV']) for r in trial if r['conditionTag']=='ALL_HALF'],axis=0)
 for k,row in enumerate(r for r in trial if r['conditionTag']=='B_CHECK'):
  z=h-1e-7+(k-2.5)*1e-6;row.update(inPhaseV=z.real.tolist(),quadratureV=z.imag.tolist(),amplitudeV=abs(z).tolist())
 shifted=analyse(trial,mapping);assert not shifted['criteria']['half_above_5sigma'] and shifted['criteria']['monotonic'];assert not shifted['all_provisional_criteria_met'];checks.append('shifted held-out blank cannot pass five-SD gate')
 def weaken(a):
  for row in a:
   if row['conditionTag']=='ALL_C':
    z=B+1e-6;row.update(inPhaseV=z.real.tolist(),quadratureV=z.imag.tolist(),amplitudeV=abs(z).tolist())
 rejects('weak phase reference',weaken)
 print(json.dumps({'passed':True,'checks':checks,'count':len(checks),'scope':'Deterministic in-memory synthetic tests only; no measured data or files generated.'},indent=2))
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input');ap.add_argument('--mapping',help='OBSERVED D1,D2,D3,D4 quadrants');ap.add_argument('--output',default=str(P/'measured_results/single_experiment'));ap.add_argument('--self-test',action='store_true');a=ap.parse_args()
 if a.self_test:self_test();return
 if not a.input or not a.mapping:ap.error('Supply real session JSON and observed --mapping, or --self-test.')
 src=Path(a.input);data=json.loads(src.read_text(encoding='utf-8-sig'));r=analyse(data['records'],[s.strip().upper() for s in a.mapping.split(',')]);r['source_SHA256']=hashlib.sha256(src.read_bytes()).hexdigest()
 model=P.parent/'02_simulation/optics/results/volume_standard_summary.json'
 if model.exists():
  sim=np.array(json.loads(model.read_text())['row_normalized']);r['comparison_to_volume_MC']=dict(mean_absolute_fraction_difference=float(np.mean(abs(np.array(r['row_normalized'])-sim))),scope='Normalized direction/proportion only; not matched spectral/quantum-yield calibration or cell-layer validation.')
 out=Path(a.output);out.mkdir(parents=True,exist_ok=True);(out/'summary.json').write_text(json.dumps(r,indent=2,allow_nan=False),encoding='utf8');draw(r,out)
 (out/'Figure_notes_EN_ZH.md').write_text('''# Measured cell-free figures / 無細胞實測圖

01: Relative0,0.5,1 standards versus blank-corrected signed I/Q projection. Error bars are SD across technical blocks; phase is measured from ALL_C. 相對濃度對扣空白投影；誤差棒是技術區塊SD，不是生物複本。

02: Single-well matrix, normalized within each observed LED row. Rows are physical LED quadrants after manual mapping; columns are the only fluorescent well. 每列為實際LED方向，每欄為唯一發光井；列內正規化，不等於細胞解混矩陣。

03: Held-out blank complex-mean magnitude before/after subtraction of separate calibration blank. This tests stable background, not removal of random noise. 獨立空白校正前後比較；固定背景下降不等於隨機雜訊消失。

All processing uses raw, unsmoothed I/Q. 全部使用未平滑原始I/Q。See summary.json for settings, counts, exclusions and provisional criteria. 圖與實驗不證明氣味輸送、細胞存活或氣味辨識。
''',encoding='utf8');print(json.dumps({'output':str(out),'criteria':r['criteria']},indent=2))
if __name__=='__main__':main()
