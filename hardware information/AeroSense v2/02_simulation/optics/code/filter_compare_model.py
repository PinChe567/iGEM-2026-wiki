"""Four detector-screen scenarios. Run locally; no new directories are created.

python filter_compare_model.py --geometry --video
The saved source curves support offline rebuilding. The Edmund curve is an
explicit scenario. It is NOT a measured curve or a pointwise OD guarantee.
The original publication movie and its validation records are never rewritten.
"""
from pathlib import Path
import argparse
import csv
import hashlib
import itertools
import json
import subprocess
import sys

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

CODE = Path(__file__).resolve().parent
P = CODE.parent
O = CODE / 'data'
CSV = P / 'results'
F = P / 'figures'
F.mkdir(exist_ok=True)
W = np.arange(405., 700.0001, .1)
LABELS = ['No filter', 'LEE 101 x1', 'LEE 101 x2', '500 nm OD4 x1*']
KEYS = ['none', 'lee101_1', 'lee101_2', 'edmund_29190_scenario']
CHANNELS = ['NE', 'NW', 'SW', 'SE']
FREQ = np.array([89., 113., 41., 67.])
FS, N, DUTY, Q = 4000, 8000, .25, 1.602176634e-19
BLANKS, REPEATS = 5, 64
ELECTRONIC_RMS_NA, DARK_NA = .0015, .2
SEED = 20261011
COLORS = ['#64748b', '#e5a500', '#c26d00', '#147d92']


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def save_json(name, value):
    (O / name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')


def save_csv(name, rows):
    with (CSV/name).open('w', encoding='utf-8', newline='') as f:
        wr = csv.DictWriter(f, fieldnames=rows[0])
        wr.writeheader()
        wr.writerows(rows)


def norm(s):
    return s / np.trapezoid(s, W)


def led(peak=468., width=25.):
    return norm(np.exp(-4*np.log(2)*((W-peak)/width)**2))


def green(mode=515., left=10., right=25.):
    # Shape sensitivity only. This is not a measured GCaMP6f spectrum.
    return norm(np.exp(-.5*((W-mode)/np.where(W < mode, left, right))**2))


def lp(cuton=500., plateau=.90, shape='log', leak=1e-4):
    # Cut-on at T=50% is an analyst definition for this constructed curve.
    # The product gives averaged specifications, not these pointwise values.
    t = np.full_like(W, leak)
    m = (W > 482.7) & (W <= cuton)
    x = (W[m]-482.7)/(cuton-482.7)
    t[m] = np.exp(np.log(leak)+(np.log(.5)-np.log(leak))*x) if shape == 'log' else leak+(.5-leak)*x
    m = (W > cuton) & (W < 517.7)
    t[m] = .5+(plateau-.5)*(W[m]-cuton)/(517.7-cuton)
    t[W >= 517.7] = plateau
    return t


def curves():
    a = np.genfromtxt(CSV/'lee101_official_spectrum.csv', delimiter=',', names=True)
    b = np.genfromtxt(CSV/'VEMD5060X01_typical_response.csv', delimiter=',', names=True)
    lt = np.interp(W, a['wavelength_nm'], a['transmission_percent']/100)
    r = np.interp(W, b['wavelength_nm'], b['typical_responsivity_A_W'])
    return np.array([np.ones_like(W), lt, lt**2, lp()]), r


def integrate(s, r, tf):
    return np.trapezoid(s*r*tf, W, axis=-1)


def geometry(rebuild=False):
    if rebuild:
        import run
        for j, q in enumerate(CHANNELS):
            key = 'spectral_unfiltered_'+q
            run.CASES[key] = dict(led=j, filter_T_ex=1., filter_T_em=1.)
            run.run_case(key)
    means, se, rows = [], [], []
    for q in CHANNELS:
        data = json.loads((O/('spectral_unfiltered_'+q+'.json')).read_text())
        x = np.array([[v[c]['power_nW'] for c in ['green','blue']] for v in data['runs']])
        means.append(x.mean(axis=0))
        se.append(x.std(axis=0, ddof=1)/np.sqrt(len(x)))
        rows.append(dict(LED=q, green_nW=float(means[-1][0]), green_MC_SE_nW=float(se[-1][0]),
                         blue_nW=float(means[-1][1]), blue_MC_SE_nW=float(se[-1][1]),
                         blue_detected_packets=sum(v['blue']['detected_packets'] for v in data['runs']),
                         green_detected_packets=sum(v['green']['detected_packets'] for v in data['runs'])))
    save_csv('filter_comparison_geometry.csv', rows)
    return np.array(means), np.array(se), rows


def coefficient(y, pinv):
    b = np.asarray(y) @ pinv.T
    return b[...,1::2] - 1j*b[...,2::2]


def reconstruct(c, t):
    return np.sum(np.real(c[...,None,:]*np.exp(2j*np.pi*t[:,None]*FREQ)), axis=-1)


def noisy(mean, seed, average=1):
    # Independent photoelectron/dark-carrier shot noise and readout noise.
    # An averaged blank uses a Poisson sum and Gaussian sigma/sqrt(M).
    rng = np.random.default_rng(seed)
    electrons = mean*1e-9/(FS*Q)
    shot = (rng.poisson(electrons*average)/average-electrons)*(FS*Q)*1e9
    electronic = np.random.default_rng(seed+987654).normal(0,ELECTRONIC_RMS_NA/np.sqrt(average),len(mean))
    return mean+shot+electronic, shot, electronic


def sensitivity(tf, r):
    rows = []
    for peak, width in itertools.product([463.,468.,473.], [20.,25.,30.]):
        s = led(peak,width)
        for cut, plateau, shape in itertools.product([490.,500.,510.], [.86,.90,.95], ['log','linear']):
            row = dict(LED_peak_nm=peak, LED_FWHM_nm=width, assumed_cuton_nm=cut,
                       assumed_passband=plateau, assumed_transition=shape)
            tt = lp(cut,plateau,shape)
            row.update(LED_power_fraction=float(integrate(s,1,tt)),
                       LED_current_fraction=float(integrate(s,r,tt)/integrate(s,r,1)),
                       green_current_fraction=float(integrate(green(),r,tt)/integrate(green(),r,1)))
            rows.append(row)
    save_csv('filter_comparison_longpass_scenarios.csv',rows)
    other=[]
    for peak,width,mode,right,bypass in itertools.product([463.,468.,473.],[20.,25.,30.],[510.,515.,520.],[15.,25.,35.],[0.,.001,.01]):
        for k in range(4):
            tt=bypass+(1-bypass)*tf[k]
            other.append(dict(case=KEYS[k],LED_peak_nm=peak,LED_FWHM_nm=width,green_proxy_mode_nm=mode,
                              green_proxy_right_sigma_nm=right,bypass_fraction=bypass,
                              LED_current_fraction=float(integrate(led(peak,width),r,tt)/integrate(led(peak,width),r,1)),
                              green_current_fraction=float(integrate(green(mode,right=right),r,tt)/integrate(green(mode,right=right),r,1))))
    save_csv('filter_comparison_spectral_sensitivity.csv',other)
    return dict(longpass_constructed_LED_current_fraction_min=min(x['LED_current_fraction'] for x in rows),
                longpass_constructed_LED_current_fraction_max=max(x['LED_current_fraction'] for x in rows),
                longpass_constructed_green_current_fraction_min=min(x['green_current_fraction'] for x in rows),
                longpass_constructed_green_current_fraction_max=max(x['green_current_fraction'] for x in rows),
                warning='These constructed scenarios are neither confidence intervals nor guaranteed bounds.')


def model():
    tf,r = curves()
    save_json('filter_comparison_sources.json',dict(
        accessed_date='2026-10-11',
        Edmund=dict(url='https://www.edmundoptics.com/p/500nm-125mm-ultra-thin-od4-longpass-filter/53064/',
            stock='29-190',material='Flexible polymer/dye (Everix)',diameter_mm=12.45,diameter_tolerance_mm=.15,
            thickness_mm=.30,clear_aperture_percent=90,average_OD_min=4.,average_OD_band_nm=[420.8,482.7],
            cut_on_nm=500,cut_on_tolerance_nm=10,average_transmission_min_exclusive=.85,
            average_transmission_band_nm=[517.7,1100],
            pointwise_curve_status='Not obtained for this exact product. Constructed scenario only; averaged specifications do not guarantee pointwise OD.',
            nominal_assumptions=dict(blocked_T=.0001,log_transition_to_half_T_nm=500,linear_transition_to_pass_nm=517.7,pass_T=.9)),
        LEE=dict(url='https://leefilters.com/colour/101-yellow/',numeric_source='lee101_official_spectrum.csv',capture='Numerical values preserved in CSV; original URL in this record',resolution_nm=5),
        PD=dict(url='https://www.vishay.com/docs/84278/vemd5060x01.pdf',numeric_source='VEMD5060X01_typical_response.csv',provenance='VEMD5060X01_response_source.json'),
        LED=dict(url='https://www.we-online.com/components/products/datasheet/155124BS73200.pdf',status='Typical peak and width support an assumed Gaussian; not a measured spectral shape.'),
        green=dict(url='https://www.nature.com/articles/s41592-019-0435-6',status='Primary spectral reference only. No pointwise curve is extracted from this paper. Green shape is an analyst proxy.')))
    powers,se,geo = geometry()
    s,g = led(),green()
    ambient_s = norm(((W >= 500)&(W <= 650)).astype(float))
    rg,rb,ra = [integrate(z,r,tf) for z in [g,s,ambient_s]]
    optical_g,optical_b = [integrate(z,1,tf) for z in [g,s]]
    t=np.arange(N)/FS
    gates=((t[:,None]*FREQ)%1 < DUTY).astype(float)
    design=np.column_stack([np.ones(N)]+[fun(2*np.pi*f*t) for f in FREQ for fun in [np.cos,np.sin]])
    pinv=np.linalg.pinv(design)
    ideal_pre=gates@(powers[:,0]*rg[0])
    raw,ideal,blue,ambient,shot,electronic,blank,recovered=[],[],[],[],[],[],[],[]
    summary,metrics,repeats,drift_rows,noise_sensitivity=[],[],[],[],[]
    for k,key in enumerate(KEYS):
        fg=gates@(powers[:,0]*rg[k]); bx=gates@(powers[:,1]*rb[k])
        amb=(.15+.05*np.cos(2*np.pi*100.3*t+.4))*ra[k]
        blank_mean=bx+amb+DARK_NA
        mu=fg+blank_mean
        y,ns,ne=noisy(mu,SEED)
        b,_,_=noisy(blank_mean,SEED+1000,BLANKS)
        ci=coefficient(fg,pinv); cr=coefficient(y,pinv); cb=coefficient(b,pinv); cc=cr-cb
        cpre=coefficient(ideal_pre,pinv)
        deterministic_bias=coefficient(blank_mean,pinv)
        rr=[]
        for n in range(REPEATS):
            yy,_,_=noisy(mu,SEED+10000+n)
            bb,_,_=noisy(blank_mean,SEED+20000+n,BLANKS)
            rr.append(coefficient(yy,pinv)-coefficient(bb,pinv))
        rr=np.array(rr); centered=rr-rr.mean(axis=0)
        noise=np.sqrt(np.mean(np.abs(centered)**2,axis=0))
        shot_variance=mu*1e-9*FS*Q*1e18
        blank_variance=(blank_mean*1e-9*FS*Q*1e18+ELECTRONIC_RMS_NA**2)/BLANKS
        # Variance of cosine and sine coefficients adds for complex mean-square.
        theory=np.sqrt((pinv[1::2]**2+pinv[2::2]**2)@(shot_variance+ELECTRONIC_RMS_NA**2+blank_variance))
        cb_only=coefficient(bx,pinv)
        for drift in [0.,.0001,.001,.01]:
            for j,q in enumerate(CHANNELS):
                drift_rows.append(dict(case=key,LED=q,fractional_blue_drift=drift,
                    residual_relative_to_green_F0_percent=float(100*drift*abs(cb_only[j])/abs(ci[j])),
                    residual_relative_to_one_percent_deltaF=float(drift*abs(cb_only[j])/(.01*abs(ci[j])))))
        for erms,dark in itertools.product([0.,.0015,.006],[0.,.2,2.]):
            m2=mu-DARK_NA+dark; b2=blank_mean-DARK_NA+dark
            variance=(m2+b2/BLANKS)*1e-9*FS*Q*1e18+erms**2*(1+1/BLANKS)
            nn=np.sqrt((pinv[1::2]**2+pinv[2::2]**2)@variance)
            noise_sensitivity.append(dict(case=key,electronic_RMS_nA=erms,dark_current_nA=dark,
                smallest_one_percent_deltaF_theory_SNR=float(np.min(.01*abs(ci)/nn))))
        for j,q in enumerate(CHANNELS):
            metrics.append(dict(case=key,LED=q,frequency_Hz=FREQ[j],
                green_unfiltered_amplitude_nA=abs(cpre[j]),green_filtered_amplitude_nA=abs(ci[j]),
                raw_amplitude_nA=abs(cr[j]),blank_corrected_amplitude_nA=abs(cc[j]),
                raw_complex_error_percent=100*abs(cr[j]-ci[j])/abs(ci[j]),
                blank_corrected_complex_error_percent=100*abs(cc[j]-ci[j])/abs(ci[j]),
                deterministic_raw_bias_percent=100*abs(deterministic_bias[j])/abs(ci[j]),
                noise_complex_RMS_nA=float(noise[j]),noise_theory_RMS_nA=float(theory[j]),
                noise_only_SNR_dB=float(20*np.log10(abs(ci[j])/noise[j])),
                one_percent_deltaF_SNR=float(.01*abs(ci[j])/noise[j]),
                one_percent_deltaF_theory_SNR=float(.01*abs(ci[j])/theory[j])))
            for n in range(REPEATS):
                repeats.append(dict(case=key,LED=q,repeat=n,corrected_real_nA=rr[n,j].real,
                                    corrected_imag_nA=rr[n,j].imag))
        summary.append(dict(case=key,label=LABELS[k],green_power_fraction=float(optical_g[k]),
            LED_power_fraction=float(optical_b[k]),green_current_fraction=float(rg[k]/rg[0]),
            LED_current_fraction=float(rb[k]/rb[0]),green_515_fraction=float(np.interp(515,W,tf[k])),
            green_520_fraction=float(np.interp(520,W,tf[k])),R_green_A_W=float(rg[k]),R_LED_A_W=float(rb[k]),
            raw_peak_nA=float(y.max()),raw_mean_nA=float(y.mean()),
            residual_RMS_nA=float(np.sqrt(np.mean((y-fg)**2))),
            residual_AC_RMS_nA=float(np.std(y-fg)),shot_RMS_nA=float(np.std(ns)),
            electronic_RMS_nA=float(np.std(ne)),
            worst_raw_complex_error_percent=max(m['raw_complex_error_percent'] for m in metrics if m['case']==key),
            worst_corrected_complex_error_percent=max(m['blank_corrected_complex_error_percent'] for m in metrics if m['case']==key),
            minimum_one_percent_deltaF_SNR=float(np.min(.01*abs(ci)/noise)),
            minimum_one_percent_deltaF_theory_SNR=float(np.min(.01*abs(ci)/theory)),
            max_Rf_for_assumed_1V_headroom_Mohm=float(1000/mu.max())))
        raw.append(y);ideal.append(fg);blue.append(bx);ambient.append(amb)
        shot.append(ns);electronic.append(ne);blank.append(b);recovered.append(reconstruct(cc,t))
    data=dict(t=t,gates=gates,ideal_pre=ideal_pre,raw=np.array(raw),ideal=np.array(ideal),
              blue=np.array(blue),ambient=np.array(ambient),shot=np.array(shot),electronic=np.array(electronic),
              blank=np.array(blank),corrected_fundamental=np.array(recovered),
              ideal_fundamental=np.array([reconstruct(coefficient(i,pinv),t) for i in ideal]))
    data['residual']=data['raw']-data['ideal']
    data['corrected_residual_fundamental']=data['corrected_fundamental']-data['ideal_fundamental']
    np.savez_compressed(O/'filter_comparison_traces.npz',**data)
    columns={'time_s':t,'ideal_unfiltered_nA':ideal_pre}
    for j,q in enumerate(CHANNELS):columns['LED_'+q+'_gate']=gates[:,j]
    for k,key in enumerate(KEYS):
        for field in ['raw','ideal','blue','ambient','shot','electronic','blank','residual','corrected_fundamental','ideal_fundamental','corrected_residual_fundamental']:
            columns[key+'_'+field+'_nA']=data[field][k]
    np.savetxt(CSV/'filter_comparison_traces.csv',np.column_stack(list(columns.values())),delimiter=',',header=','.join(columns),comments='',fmt='%.12g')
    save_csv('filter_comparison_metrics.csv',metrics)
    save_csv('filter_comparison_noise_replicates.csv',repeats)
    save_csv('filter_comparison_blank_drift.csv',drift_rows)
    save_csv('filter_comparison_noise_sensitivity.csv',noise_sensitivity)
    save_csv('filter_comparison_summary.csv',summary)
    spectra=[]
    for i,w in enumerate(W):
        spectra.append(dict(wavelength_nm=w,assumed_LED_power_density=s[i],assumed_green_power_density=g[i],
                            PD_typical_A_W=r[i],**{key+'_T':tf[k,i] for k,key in enumerate(KEYS)}))
    save_csv('filter_comparison_spectra.csv',spectra)
    sensitivity_summary=sensitivity(tf,r)
    record=dict(cases=summary,geometry=geo,sensitivity=sensitivity_summary,
        parameters=dict(FS_Hz=FS,samples=N,duration_s=N/FS,duty=DUTY,frequencies_Hz=FREQ.tolist(),
                        signal_seed=SEED,blank_seed=SEED+1000,blank_records_averaged=BLANKS,
                        noise_replicates=REPEATS,electronic_RMS_nA=ELECTRONIC_RMS_NA,dark_nA=DARK_NA,
                        LED_peak_nm=468,LED_FWHM_nm=25,green_proxy_mode_nm=515,green_proxy_sigma_left_nm=10,
                        green_proxy_sigma_right_nm=25,ambient_mean_nW=.15,ambient_amplitude_nW=.05,
                        ambient_frequency_Hz=100.3,ambient_phase_rad=.4,ambient_spectrum='Uniform 500-650 nm'),
        semantics=dict(ideal_pre='Fluorescence only, before the detector screen.',
                       ideal='Same fluorescence, after this detector screen.',
                       raw='Filtered fluorescence + blue leakage + ambient + dark + shot noise + electronic noise.',
                       residual='Raw minus filtered ideal; includes DC and systematic contamination.',
                       corrected_fundamental='Independent mean of five blank I/Q records subtracted in the complex domain. Four AC fundamentals are reconstructed. DC and PWM harmonics are absent.',
                       corrected_residual_fundamental='Corrected four-frequency reconstruction minus identically projected filtered ideal.',
                       units='All traces are modeled PD input current in nA. No TIA or ADC conversion is modeled.'),
        limitations=['All gains use frozen MC means; MC error is reported separately, not propagated into noise repetitions.',
                     'GCaMP emission and LED source spectra are declared shapes, not measured cell or LED spectra.',
                     'Edmund pointwise transmission is constructed; averaged product specifications do not guarantee this curve.',
                     'A normal-incidence scalar spectral screen multiplies detected powers. Angle, polarization, layer interfaces, fit, collection aperture and back reflection are not retraced.',
                     'Five blank records have exactly the same deterministic leakage. Drift, medium changes and cell scattering changes are excluded.',
                     'Point-sampled PWM state is held for each 250 us bin. Analog filtering, ADC clipping, LED kinetics and jitter are omitted.',
                     'Shared deterministic seeds support comparison. Different Poisson means produce different photon realizations. Electronic noise is identical across cases.'])
    save_json('filter_comparison_summary.json',record)
    return data,record,tf,r


def spectral_figure(summary,tf,r):
    """Rebuild panel A-D from saved spectra and summary, without rerunning the model."""
    plt.rcParams.update({'font.size':10,'axes.spines.top':False,'axes.spines.right':False,'savefig.facecolor':'white'})
    fig,axes=plt.subplots(2,2,figsize=(13,8),layout='constrained')
    for k in range(4):
        axes[0,0].plot(W,100*tf[k],color=COLORS[k],label=LABELS[k])
    axes[0,0].set(xlim=(430,570),ylim=(0,105),xlabel='Wavelength (nm)',ylabel='Transmission (%)',title='A  Four detector-screen scenarios')
    axes[0,0].legend(fontsize=8)
    axes[0,1].plot(W,led()/led().max(),color='#2563eb',label='Assumed LED')
    axes[0,1].plot(W,green()/green().max(),color='#16804a',label='Assumed green proxy')
    axes[0,1].plot(W,r/r.max(),color='#7e22ce',label='Typical PD response (scaled)')
    axes[0,1].axvline(482.7,color='#64748b',linestyle=':',label='OD-average band ends')
    axes[0,1].set(xlim=(430,600),ylim=(0,1.1),xlabel='Wavelength (nm)',ylabel='Normalized shape',title='B  Spectral weighting matters')
    axes[0,1].legend(fontsize=8)
    x=np.arange(4);ss=summary['cases']
    axes[1,0].bar(x-.18,[100*s['LED_current_fraction'] for s in ss],.36,color='#2563eb',label='Blue current retained')
    axes[1,0].bar(x+.18,[100*s['green_current_fraction'] for s in ss],.36,color='#16804a',label='Green current retained')
    axes[1,0].set(yscale='linear',ylim=(0,100),yticks=np.arange(0,101,20),xticks=x,xticklabels=LABELS,ylabel='Current retained (%)',title='C  Relative to no filter')
    axes[1,0].legend(fontsize=8,loc='upper center',bbox_to_anchor=(.58,1))
    for i,s in enumerate(ss):
        for dx,key in [(-.18,'LED_current_fraction'),(.18,'green_current_fraction')]:
            value=100*s[key]
            # Labels for the 100% baseline stay inside the bar; small fractions
            # remain labelled even when they are short on the linear axis.
            axes[1,0].text(i+dx,95 if value>=98 else value+2,f'{value:.3g}',
                           ha='center',va='top' if value>=98 else 'bottom',
                           color='white' if value>=98 else 'black',fontsize=8)
    axes[1,1].bar(x,[s['minimum_one_percent_deltaF_theory_SNR'] for s in ss],color=COLORS)
    axes[1,1].set(xticks=x,xticklabels=LABELS,ylabel='Smallest channel signal / noise',title='D  A 1% fluorescence change, after blank correction')
    for i,s in enumerate(ss):axes[1,1].text(i,s['minimum_one_percent_deltaF_theory_SNR']+.03,f"{s['minimum_one_percent_deltaF_theory_SNR']:.2f}",ha='center')
    fig.suptitle('Four-filter comparison | *OD4 pointwise curve is an explicit scenario',fontsize=15)
    fig.savefig(F/'12_filter_spectral_comparison.png',dpi=170)
    plt.close(fig)


def static_figures(data,summary,tf,r):
    spectral_figure(summary,tf,r)
    fig,ax=plt.subplots(4,3,figsize=(17,12),layout='constrained')
    keep=data['t'] <= .2;t=data['t'][keep]*1000
    for k in range(4):
        a=ax[k,0]
        a.plot(t,data['raw'][k,keep],color='#ea7b18',lw=1,label='Received raw')
        a.plot(t,data['ideal_pre'][keep],color='#94a3b8',linestyle='--',lw=1.2,label='Ideal before filter')
        a.plot(t,data['ideal'][k,keep],color='#12834b',lw=1.2,label='Ideal after filter')
        ax[k,1].plot(t,data['residual'][k,keep],color='#7e22ce',lw=1,label='Raw - filtered ideal')
        ax[k,2].plot(t,data['corrected_fundamental'][k,keep],color='#2563eb',lw=1,label='Blank-corrected AC')
        ax[k,2].plot(t,data['ideal_fundamental'][k,keep],color='#12834b',lw=1,linestyle='--',label='Ideal, same AC basis')
        a.set_ylabel(LABELS[k]+'\nPD input (nA)')
        for z in ax[k]:z.set(xlim=(0,200),xlabel='Time (ms)');z.grid(alpha=.15)
        if k==0:
            for z in ax[k]:z.legend(loc='upper right',fontsize=8)
    for a,title in zip(ax[0],['Raw and both ideal comparators','Raw residual (includes DC and blue)','Four fundamentals only, after independent blank']):a.set_title(title,fontsize=11)
    fig.suptitle('Same source powers, clock and noise seeds | Read each vertical scale | *OD4 is a scenario',fontsize=15)
    fig.savefig(F/'13_filter_waveform_comparison.png',dpi=150)
    plt.close(fig)
    fig,ax=plt.subplots(1,2,figsize=(14,5.5),layout='constrained')
    for k in range(4):
        ax[0].plot(t,1000*data['corrected_residual_fundamental'][k,keep],color=COLORS[k],label=LABELS[k],lw=1.3)
    ax[0].set(xlim=(0,200),xlabel='Time (ms)',ylabel='Corrected minus ideal (pA)',title='A  Residual of the same four AC fundamentals')
    ax[0].legend(fontsize=9)
    dr=np.genfromtxt(CSV/'filter_comparison_blank_drift.csv',delimiter=',',names=True,dtype=None,encoding='utf-8')
    ds=np.array([.0001,.001,.01])
    for k,key in enumerate(KEYS):
        vals=[max(z['residual_relative_to_one_percent_deltaF'] for z in dr if z['case']==key and abs(z['fractional_blue_drift']-a)<1e-12) for a in ds]
        ax[1].plot(100*ds,vals,'o-',color=COLORS[k],label=LABELS[k])
    ax[1].axhline(.1,color='#334155',linestyle=':',label='Example drift budget: 10% of deltaF')
    ax[1].set(xscale='log',yscale='log',xlabel='Blue gain change after blank (%)',ylabel='Largest channel bias / a 1% fluorescence change',title='B  Drift sensitivity (blue I/Q only)')
    ax[1].legend(fontsize=8)
    for a in ax:a.grid(alpha=.15)
    fig.suptitle('Residual zoom and blank stability | *OD4 is a scenario | No hardware drift is measured',fontsize=14)
    fig.savefig(F/'14_filter_residual_and_drift.png',dpi=170)
    plt.close(fig)


def validation(data,record,tf,r):
    passed=[]
    def check(name,truth):
        assert truth,name
        passed.append(name)
    check('Exactly four comparison cases',len(record['cases'])==4)
    check('Physical transmission is between zero and one',bool(np.all((tf>=0)&(tf<=1))))
    check('LEE two layers use the squared measured single-layer curve',bool(np.allclose(tf[2],tf[1]**2)))
    check('No-filter transmission and ideal identity',bool(np.all(tf[0]==1) and np.array_equal(data['ideal'][0],data['ideal_pre'])))
    check('All raw traces decompose into named physical terms',bool(np.allclose(data['raw'],data['ideal']+data['blue']+data['ambient']+DARK_NA+data['shot']+data['electronic'],rtol=1e-12,atol=1e-12)))
    check('Every raw residual uses the matching filtered ideal',bool(np.array_equal(data['residual'],data['raw']-data['ideal'])))
    check('Electronic realization is identical across all four cases',bool(all(np.array_equal(data['electronic'][0],z) for z in data['electronic'][1:])))
    check('Independent blank seed differs from signal seed',SEED != SEED+1000)
    check('Corrected and ideal AC reconstructions have zero mean',bool(np.max(abs(data['corrected_fundamental'].mean(axis=1)))<1e-12 and np.max(abs(data['ideal_fundamental'].mean(axis=1)))<1e-12))
    t=data['t'];A=np.column_stack([np.ones(N)]+[fun(2*np.pi*f*t) for f in FREQ for fun in [np.cos,np.sin]])
    pinv=np.linalg.pinv(A)
    # Under the stated stable-blank model, deterministic correction is exact.
    fg=data['ideal'];bm=data['blue']+data['ambient']+DARK_NA
    check('Noise-free complex blank subtraction recovers each filtered ideal',bool(np.allclose(coefficient(fg+bm,pinv)-coefficient(bm,pinv),coefficient(fg,pinv),atol=1e-12)))
    check('PD response is positive and wavelength-dependent',bool(np.all(r>0) and np.ptp(r)>.05))
    for key in ['raw','ideal','residual','blank','corrected_fundamental']:
        check(key+' is finite with shape (4,8000)',data[key].shape==(4,N) and np.all(np.isfinite(data[key])))
    # Independent analytical photon/readout covariance checks the repeated draws.
    m=np.genfromtxt(CSV/'filter_comparison_metrics.csv',delimiter=',',names=True,dtype=None,encoding='utf-8')
    ratios=m['noise_complex_RMS_nA']/m['noise_theory_RMS_nA']
    check('64 noise repetitions agree with analytic complex RMS within 25%',bool(np.all((ratios>.75)&(ratios<1.25))))
    paths=['filter_compare_model.py','filter_compare_visuals.py']
    inputs=['lee101_official_spectrum.csv','VEMD5060X01_typical_response.csv','VEMD5060X01_response_source.json']+['spectral_unfiltered_'+q+'.json' for q in CHANNELS]
    result=dict(schema='filter-comparison-v1',pass_test=True,checks=passed,
                runtime=dict(python=sys.version,numpy=np.__version__,matplotlib=matplotlib.__version__),
                noise_empirical_to_analytic_RMS_range=[float(ratios.min()),float(ratios.max())],
                figure_SHA256={p.name:sha(p) for p in F.glob('1[234]_filter*.png')},
                source_SHA256={p:sha(CODE/p) for p in paths if (CODE/p).exists()},
                input_SHA256={p:sha((CSV if p.endswith('.csv') else O)/p) for p in inputs},
                data_SHA256={p.name:sha(p) for p in list(O.glob('filter_comparison*'))+list(CSV.glob('filter_comparison*')) if p.suffix in ['.csv','.npz']},
                validation_scope='Four-filter model and named figures. No claim is made about real hardware or old publication artifacts.')
    save_json('filter_comparison_validation.json',result)
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--geometry',action='store_true',help='Regenerate four unfiltered MC cases before analysis.')
    parser.add_argument('--video',action='store_true',help='Encode the new comparison MP4. Preserve the old movie.')
    args=parser.parse_args()
    if args.geometry:geometry(True)
    data,record,tf,r=model()
    static_figures(data,record,tf,r)
    names=['12_filter_spectral_comparison.png','13_filter_waveform_comparison.png','14_filter_residual_and_drift.png']
    hashes=[sha(F/name) for name in names]
    static_figures(data,record,tf,r)
    assert hashes==[sha(F/name) for name in names]
    v=validation(data,record,tf,r)
    v['all_figures_reproduced']=True
    save_json('filter_comparison_validation.json',v)
    if args.video:
        from filter_compare_visuals import video
        video(data,record)
    print(json.dumps(record['cases'],indent=2))


if __name__=='__main__':main()
