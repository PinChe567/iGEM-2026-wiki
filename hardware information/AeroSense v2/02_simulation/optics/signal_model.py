"""Reproducible conditional detector model. No new ray transport is performed.

MC supplies geometric fluorescence/leakage gains. Ambient light, spectral
responsivity ratio and electronic noise below are explicit synthetic assumptions.
All signals use green-equivalent incident nW, not measured current/voltage.
"""
from pathlib import Path
import json,csv,itertools
import numpy as np
HERE=Path(__file__).resolve().parent;R=HERE/'results'
NAMES=['NE','NW','SW','SE'];FREQ=np.array([89.,113.,41.,67.])
FS=4000;N=8000;DUTY=.25;SEED=100506;REPS=32
RESP_RATIO=.8 # assumed R(470)/R(520), not measured for this detector
R520=.3 # A/W, assumed, not measured. Discrete 4 kHz sample-hold approximation.
E_CHARGE=1.602176634e-19
ELECTRONS_PER_NW_SAMPLE=1e-9*R520/(FS*E_CHARGE)
AMBIENT={
 'none':dict(dc=0.,amplitude=0.,frequency=0.,phase=.4),
 'DC':dict(dc=.15,amplitude=0.,frequency=0.,phase=.4),
 '100p3_Hz':dict(dc=.15,amplitude=.05,frequency=100.3,phase=.4),
 '67_Hz':dict(dc=.15,amplitude=.05,frequency=67.,phase=.4),
}
def data():return json.loads((R/'summary.json').read_text())
def gates(t):
 t=np.asarray(t)
 return ((t[...,None]*FREQ)%1<DUTY).astype(float)
def design(t):return np.column_stack([np.ones(len(t))]+[v for f in FREQ for v in (np.cos(2*np.pi*f*t),np.sin(2*np.pi*f*t))])
def complex_coeff(y,pinv):
 b=np.asarray(y)@pinv.T
 return b[...,1::2]-1j*b[...,2::2]
def ratio_db(a,b):
 a=np.asarray(a);b=np.asarray(b)
 return np.where(b>1e-15,20*np.log10(np.maximum(a,1e-300)/np.maximum(b,1e-300)),np.inf)
def finite(v):return None if not np.isfinite(v) else float(v)
def read_blue(od):
 if od=='ideal':return np.zeros(4),np.zeros(4),np.zeros(4)
 rows=json.loads((R/'leakage_MC_summary.json').read_text())['cases'];v=[next(r for r in rows if r['OD']==int(od) and r['channel']==q) for q in NAMES]
 return tuple(np.array([r[k] for r in v]) for k in ['blue_nW','reflected_blue_nW','blue_SE_nW'])
def components(t,green,od='3',ambient='100p3_Hz',responsivity_ratio=RESP_RATIO):
 u=gates(t);b,ref,bse=read_blue(od);a=AMBIENT[ambient]
 ideal=u@green;leak=u@(b*responsivity_ratio);reflected=u@(ref*responsivity_ratio)
 amb=a['dc']+a['amplitude']*np.cos(2*np.pi*a['frequency']*t+a['phase'])
 return dict(ideal=ideal,leakage=leak,reflected_excitation=reflected,ambient=amb,background=leak+amb,pulses=u)
def stats(ideal,received,c0,c1):
 r=received-ideal;ac=r-r.mean();signal_ac=ideal-ideal.mean();ce=c1-c0
 return dict(time_RMSE_nW=float(np.sqrt(np.mean(r*r))),residual_DC_nW=float(r.mean()),AC_residual_RMS_nW=float(np.sqrt(np.mean(ac*ac))),desired_AC_RMS_nW=float(np.std(ideal)),waveform_AC_SINR_dB=finite(ratio_db(np.std(ideal),np.std(r))),
 amplitude_bias_percent=(100*(abs(c1)-abs(c0))/abs(c0)).tolist(),complex_relative_error_percent=(100*abs(ce)/abs(c0)).tolist(),phase_error_degrees=np.angle(c1/c0,deg=True).tolist(),demodulation_SINR_dB=[finite(v) for v in ratio_db(abs(c0),abs(ce))])
def generate():
 t=np.arange(N)/FS;pinv=np.linalg.pinv(design(t));s=data();lookup={r['case']:r for r in s['cases']}
 mcrows=json.loads((R/'leakage_MC_summary.json').read_text())['cases']
 green=np.array([next(r['green_nW'] for r in mcrows if r['OD']==3 and r['channel']==q) for q in NAMES]);v=components(t,green);noise=np.random.default_rng(SEED).normal(0,.005,N)
 deterministic=v['ideal']+v['background'];counts=np.random.default_rng(SEED+1).poisson(np.maximum(deterministic,0)*ELECTRONS_PER_NW_SAMPLE);shot=counts/ELECTRONS_PER_NW_SAMPLE-deterministic
 received=deterministic+shot+noise;residual=received-v['ideal'];c0=complex_coeff(v['ideal'],pinv);c1=complex_coeff(received,pinv);cb=complex_coeff(v['background'],pinv)
 sf=np.fft.rfftfreq(N,1/FS)
 spectrum=lambda y:2*abs(np.fft.rfft(y-y.mean()))/N
 np.savez_compressed(R/'frequency_traces.npz',t_s=t,pulses=v['pulses'],ideal_nW=v['ideal'],green_only_nW=v['ideal'],received_nW=received,detector_nW=received,residual_nW=residual,leakage_nW=v['leakage'],reflected_excitation_nW=v['reflected_excitation'],ambient_nW=v['ambient'],noise_nW=noise,shot_noise_nW=shot,photoelectron_counts=counts,frequency_Hz=FREQ,spectrum_frequency_Hz=sf,spectrum_nW=spectrum(received),ideal_spectrum_nW=spectrum(v['ideal']),residual_spectrum_nW=spectrum(residual))
 st=stats(v['ideal'],received,c0,c1);rows=[]
 cleak=complex_coeff(v['leakage'],pinv);camb=complex_coeff(v['ambient'],pinv)
 for j in range(4):
  rows.append(dict(channel=NAMES[j],frequency_Hz=FREQ[j],green_fundamental_nW=abs(c0[j]),blue_fundamental_nW=abs(cleak[j]),ambient_fundamental_nW=abs(camb[j]),combined_fit_nW=abs(c1[j]),ideal_I_nW=c0[j].real,ideal_Q_nW=c0[j].imag,received_I_nW=c1[j].real,received_Q_nW=c1[j].imag,complex_error_nW=abs(c1[j]-c0[j]),amplitude_bias_percent=st['amplitude_bias_percent'][j],phase_error_degrees=st['phase_error_degrees'][j],demodulation_SINR_dB=st['demodulation_SINR_dB'][j]))
 write_csv(R/'frequency_recovery.csv',rows)
 blue,blue_ref,blue_se=read_blue('3')
 report=dict(kind='conditional synthetic detector superposition using saved MC geometric gains',sampling_Hz=FS,duration_s=N/FS,duty=DUTY,seed=SEED,noise_per_sample_nW=.005,green_gains_nW=green.tolist(),blue_gains_nW=(blue*RESP_RATIO).tolist(),MC_blue_by_LED_nW=blue.tolist(),MC_blue_by_LED_SE_nW=blue_se.tolist(),MC_reflected_blue_by_LED_nW=blue_ref.tolist(),assumed_responsivity_ratio_R470_over_R520=RESP_RATIO,ambient_case='100p3_Hz',ambient=AMBIENT['100p3_Hz'],quadrant_frequency_Hz=dict(zip(NAMES,FREQ.tolist())),quadrant_mapping='PROVISIONAL D1 SW/41, D2 SE/67, D3 NE/89, D4 NW/113; physical bottom-view mirror unconfirmed.',blue_assumption='Each LED has its own 3-seed OD3/4/5 MC calculation; gains and MC standard errors are in leakage_MC_summary.json.',desired_signal='All OD3-case MC green collection, including reflected fluorescence and existing source-well mixing. Reflected green fluorescence is not automatically interference.',ideal_comparator='Same green gains, waveforms and sampling, but zero parasitic excitation, ambient and electronic noise. Green gains are held at OD3 means across the rejection sweep; emission filter transmittance is 0.9 in every extra MC case.',units='nW equivalent at green wavelength. Excitation optical nW is multiplied by assumed R470/R520. Ambient and noise are already green-equivalent; no current/voltage prediction.',metrics=st,limits='No measured ambient, noise, responsivity, TIA/ADC transfer, saturation, jitter, biological dynamics or shot noise. MC sampling/model uncertainty is not noise in the synthetic sweep.',lifetime_assumption_ns=10,max_phase_shift_at_113Hz_deg=360*113*10e-9,photon_flight_distance_example_mm=20,flight_delay_ns_at_n1p5=20/299792458*1.5e6)
 report['assumed_shot_noise']=dict(R520_A_W=R520,integration_time_s=1/FS,electrons_per_nW_sample=ELECTRONS_PER_NW_SAMPLE,seed=SEED+1,model='Independent Poisson photoelectron counts from total fluorescence + leakage + DC/flickering ambient. Gate state is held over each 250 us sample bin; true PWM-edge overlap is not integrated. No TIA bandwidth or dark-current model.')
 report['limits']=report['limits'].replace(' or shot noise','');report['metrics']['shot_noise_RMS_nW']=float(np.std(shot));report['metrics']['electronic_noise_RMS_nW']=float(np.std(noise))
 (R/'frequency_summary.json').write_text(json.dumps(report,indent=2,allow_nan=False))
 sweep(t,pinv,green,c0)
 validate(t,pinv,green,v,received,c0,c1)
 return report
def write_csv(path,rows):
 with path.open('w',newline='',encoding='utf-8') as f:w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
def sweep(t,pinv,green,c0):
 detail=[];aggregate=[];scenario_count=0
 # Common random numbers allow paired comparisons across OD/ambient cases.
 normals=np.array([np.random.default_rng(200000+i).normal(size=N) for i in range(REPS)])
 for od,amb,sigma,rho in itertools.product(['ideal','3','4','5'],AMBIENT,[0.,.005,.02],[.6,.8,1.]):
  scenario_count+=1;v=components(t,green,od,amb,rho);optical=v['ideal']+v['background'];counts=np.array([np.random.default_rng(400000+i).poisson(np.maximum(optical,0)*ELECTRONS_PER_NW_SAMPLE) for i in range(REPS)]);yy=counts/ELECTRONS_PER_NW_SAMPLE+sigma*normals;cc=complex_coeff(yy,pinv)
  deterministic=complex_coeff(v['ideal']+v['background'],pinv);noise_vector_rms=np.sqrt(np.mean(abs(cc-deterministic)**2,axis=0))
  for i in range(REPS):
   st=stats(v['ideal'],yy[i],c0,cc[i])
   for j in range(4):detail.append(dict(OD=od,ambient=amb,noise_sigma_nW=sigma,responsivity_ratio=rho,seed=200000+i,channel=NAMES[j],frequency_Hz=FREQ[j],time_RMSE_nW=st['time_RMSE_nW'],AC_residual_RMS_nW=st['AC_residual_RMS_nW'],waveform_AC_SINR_dB=st['waveform_AC_SINR_dB'],amplitude_bias_percent=st['amplitude_bias_percent'][j],complex_relative_error_percent=st['complex_relative_error_percent'][j],phase_error_degrees=st['phase_error_degrees'][j],demodulation_SINR_dB=st['demodulation_SINR_dB'][j]))
  for j in range(4):
   bias=100*(abs(cc[:,j])-abs(c0[j]))/abs(c0[j]);err=100*abs(cc[:,j]-c0[j])/abs(c0[j]);sinr=ratio_db(abs(c0[j]),abs(cc[:,j]-c0[j]))
   aggregate.append(dict(OD=od,ambient=amb,noise_sigma_nW=sigma,responsivity_ratio=rho,channel=NAMES[j],frequency_Hz=FREQ[j],replicates=REPS,mean_amplitude_bias_percent=float(bias.mean()),SD_amplitude_bias_percent=float(bias.std(ddof=1)),mean_complex_relative_error_percent=float(err.mean()),median_demodulation_SINR_dB=finite(np.median(sinr)),noise_only_vector_RMS_nW=float(noise_vector_rms[j]),noise_only_demodulation_SNR_dB=finite(ratio_db(abs(c0[j]),noise_vector_rms[j])),mean_time_RMSE_nW=float(np.sqrt(np.mean((yy-v['ideal'])**2,axis=1)).mean())))
 write_csv(R/'interference_sweep_replicates.csv',detail);write_csv(R/'interference_sweep.csv',aggregate)
 (R/'interference_sweep_summary.json').write_text(json.dumps(dict(scenarios=scenario_count,noise_replicates=REPS,records=len(detail),aggregate_records=len(aggregate),OD=['ideal',3,4,5],ambient=AMBIENT,noise_sigma_nW=[0,.005,.02],assumed_responsivity_ratios=[.6,.8,1.],common_electronic_normal_draws=True,shot_noise='Poisson, R520=0.3 A/W assumed, independent 250 us bins with point-sampled, held gate state; fixed seeds per replicate, rate changes by scenario.',metrics='SINR includes systematic complex error plus noise. Noise-only SNR uses shot + electronic replicate fluctuations around each deterministic contaminated signal; it does not include bias. Null dB means +infinity for zero denominator.',MC_uncertainty='Not propagated; gains are fixed MC means. Replicates vary synthetic photoelectron counts and electronic noise.'),indent=2))
def validate(t,pinv,green,v,received,c0,c1):
 clean=components(t,green,'ideal','none');assert np.array_equal(clean['ideal'],v['ideal']);assert np.all(clean['background']==0)
 cclean=complex_coeff(clean['ideal'],pinv);assert np.max(abs(cclean-c0))==0
 b=np.zeros(design(t).shape[1]);b[0]=.2;b[1:]=np.arange(1,len(b))*.01
 recovered=design(t)@b@pinv.T;assert np.max(abs(recovered-b))<1e-12
 # A DC background is rejected by the fit intercept, but same-frequency leakage is retained.
 cdc=complex_coeff(v['ideal']+.15,pinv);assert np.max(abs(cdc-c0))<1e-12
 cb=complex_coeff(v['leakage'],pinv);cassert=complex_coeff(v['ideal']+v['leakage'],pinv)-c0;assert np.max(abs(cassert-cb))<1e-12 and np.min(abs(cb))>0
 # Statistical check on mean complex recovery over independent noise draws.
 noise=np.array([np.random.default_rng(300000+i).normal(0,.005,N) for i in range(64)]);cn=complex_coeff(noise,pinv)
 expected=.005*np.sqrt(4/N);observed=np.sqrt(np.mean(abs(cn)**2,axis=0));assert np.all((observed/expected>.7)&(observed/expected<1.3))
 zz=np.load(R/'frequency_traces.npz');decomp=v['leakage']+v['ambient']+zz['noise_nW']+zz['shot_noise_nW'];assert np.max(abs(received-v['ideal']-decomp))<1e-12
 counts=np.random.default_rng(7658).poisson(1000,size=300000);assert abs(counts.mean()-1000)<5*np.sqrt(1000/len(counts));assert abs(counts.var()/1000-1)<.02
 report=dict(pass_test=True,clean_equals_reference_exactly=True,known_multisine_max_coefficient_error=float(np.max(abs(recovered-b))),DC_complex_change_max_nW=float(np.max(abs(cdc-c0))),synchronous_leakage_recovered_exactly=True,noise_expected_complex_RMS_nW=expected,noise_observed_complex_RMS_nW=observed.tolist(),Poisson_test_mean=float(counts.mean()),Poisson_test_variance=float(counts.var()),additive_decomposition_max_error_nW=float(np.max(abs(received-v['ideal']-decomp))),meaning='Numerical synthetic tests, not hardware accuracy or biological validation.')
 (R/'frequency_validation.json').write_text(json.dumps(report,indent=2))
if __name__=='__main__':generate()

