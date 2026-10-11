"""Reference DLIA, optical unmixing and reproducible synthetic robustness sweeps.
python dlia.py --sweep
Complex amplitudes preserve phase. Frequency channel is NOT automatically a well.
"""
from pathlib import Path
import numpy as np,json,csv,argparse,sys
F=np.array([41.,67.,89.,113.]);FS=4000
def demodulate(t,v,f=F):
 t=np.asarray(t);v=np.asarray(v)
 if len(t)!=len(v) or np.any(np.diff(t)<=0):raise ValueError('Invalid timestamps')
 # Joint least squares handles DC, linear drift, nonuniform samples and cross terms.
 A=np.column_stack([np.ones(len(t)),t-t.mean()]+[g(2*np.pi*q*t) for q in f for g in [np.cos,np.sin]])
 b,_,_,_=np.linalg.lstsq(A,v,rcond=None);pred=A@b
 return dict(complex_amplitude=b[2::2]-1j*b[3::2],amplitude=np.hypot(b[2::2],b[3::2]),residual_rms=float(np.sqrt(np.mean((v-pred)**2))),condition=float(np.linalg.cond(A)))
def unmix(y,M,max_condition=30):
 M=np.asarray(M,dtype=complex);y=np.asarray(y,dtype=complex)
 if M.shape!=(4,4) or np.linalg.cond(M)>max_condition:raise ValueError('Unstable or invalid measured mixing matrix')
 return np.linalg.solve(M,y)
def sweep():
 out=Path(__file__).resolve().parents[2]/'results';out.mkdir(exist_ok=True);rng=np.random.default_rng(92661);rows=[]
 amp=np.array([.01,.02,.03,.04]);phase=np.array([.3,.7,-.2,1.1]);tests=0
 for duration in [.5,1,2,4]:
  for noise in [.0001,.001,.01]:
   for jitter in [0,1,10,50]:
    t=np.arange(int(FS*duration))/FS;rngj=np.random.default_rng(200+int(duration*10)+jitter)
    t=t+rngj.uniform(-jitter,jitter,len(t))*1e-6
    v=.3+.01*t+sum(a*np.cos(2*np.pi*f*t+p) for a,f,p in zip(amp,F,phase))+rng.normal(0,noise,len(t));r=demodulate(t,v)
    rows.append(dict(duration_s=duration,noise_V=noise,timestamp_jitter_us=jitter,max_relative_amplitude_error=float(np.max(abs(r['amplitude']/amp-1))),residual_rms_V=r['residual_rms']))
 t=np.arange(8000)/FS;v=.3+sum(a*np.cos(2*np.pi*f*t+p) for a,f,p in zip(amp,F,phase));r=demodulate(t,v);assert np.allclose(r['amplitude'],amp,rtol=1e-10);tests+=1
 M=np.eye(4)+.02*(np.ones((4,4))-np.eye(4));x=amp*np.exp(1j*phase);assert np.allclose(unmix(M@x,M),x);tests+=1
 try:unmix(x,np.ones((4,4)));raise AssertionError('Singular matrix accepted')
 except ValueError:tests+=1
 # Actual square DDS harmonics/aliasing under the implemented 4 kHz phase accumulator.
 ticks=np.arange(1,8001);gate=np.array([((ticks*int(f))%FS)<FS*.25 for f in F],float)
 B=np.array([[abs(np.mean(g*np.exp(-2j*np.pi*f*ticks/FS))*2) for f in F] for g in gate]);leak=B/np.diag(B)[:,None];np.fill_diagonal(leak,0)
 with (out/'DLIA_sweep.csv').open('w',newline='') as f:w=csv.DictWriter(f,rows[0]);w.writeheader();w.writerows(rows)
 sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'simulation'));from plot_results import font
 from PIL import Image,ImageDraw
 im=Image.new('RGB',(1300,800),'white');d=ImageDraw.Draw(im);d.text((35,25),'DLIA numerical sweep - synthetic signals, measured timestamps',font=font(27),fill='#163d50')
 colors=['#169598','#705bb5','#be732d']
 for ni,noise in enumerate([.0001,.001,.01]):
  d.text((50+ni*410,95),f'noise = {noise*1000:g} mV RMS',font=font(24),fill=colors[ni])
  for j,jit in enumerate([0,1,10,50]):
   vals=[r for r in rows if r['noise_V']==noise and r['timestamp_jitter_us']==jit]
   for i,r in enumerate(vals):
    x=60+ni*410+i*90;y=190+j*135;e=r['max_relative_amplitude_error'];d.rectangle((x,y,x+65,y+70),fill=colors[ni]);d.text((x,y+15),f'{100*e:.2f}%',font=font(18),fill='white');d.text((x,y+80),f'{r["duration_s"]:g}s',font=font(18),fill='#163d50')
   d.text((60+ni*410,155+j*135),f'jitter +/- {jit} us',font=font(19),fill='#163d50')
 im.save(out/'images/DLIA_sweep.png')
 report=dict(tests_passed=tests,synthetic_cases=len(rows),worst_relative_error=max(r['max_relative_amplitude_error'] for r in rows),DDS_25percent_cross_channel_amplitude_ratio=leak.tolist(),worst_DDS_leakage=float(leak.max()),feedback_RC_pole_Hz=1/(2*np.pi*100e6*2.2e-12),analog_RC_magnitude_at_frequencies=(1/np.sqrt(1+(2*np.pi*F*100e6*2.2e-12)**2)).tolist(),caution='RC pole is only a feedback estimate, not measured closed-loop bandwidth or phase margin. Joint LS reference is not identical to firmware rectangular IQ under timestamp jitter.')
 (out/'DLIA_validation.json').write_text(json.dumps(report,indent=2));print(report)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--sweep',action='store_true');a=p.parse_args()
 if a.sweep:sweep()
