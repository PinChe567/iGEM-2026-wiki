"""Reproduce calibration selection and a unified display, without changing raw data.
Run: python analyze_unified_calibration.py --workspace-root <wiki folder>
Requirements: numpy, scipy, matplotlib. Output defaults beside this script.
Use --archive-root <zenodo-release> to read the canonical archived raw data,
and --output-dir <directory> to reproduce without overwriting retained outputs.
"""
from pathlib import Path
import argparse,csv,hashlib,json,io
import numpy as np
from scipy.optimize import least_squares, brentq
from scipy.interpolate import PchipInterpolator
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

CHANNELS=['D1','D2','D3','D4']; COLORS=['#246680','#bb6843','#5a8a65','#9162a0'];FREQ=np.array([41,67,89,113])
FAMILIES=['linear','quadratic','exponential','power','pchip']
LEVELS={'A':{'DDW':0.,'C':.1,'10C':1.,'100C':10.},'B':{'DDW':0.,'10C':1.,'50C':5.,'100C':10.,'200C':20.}}
LAYOUTS={'Test1':[10,1,.1,0],'Test2':[0,.1,1,10],'Test3':[0,.1,1,10],'Test4':[0,.1,1,10],'Test5':[10,1,.1,0]}

def writecsv(path,rows):
    fields=list(dict.fromkeys(k for r in rows for k in r))
    with path.open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)

def load(folder,verify=True):
    result=[]
    for p in sorted(folder.glob('*_report_*.json')):
        d=json.loads(p.read_text(encoding='utf-8-sig'));r=d['records'][0]
        z=1000*(np.array(r['inPhaseV'])+1j*np.array(r['quadratureV']))
        cp=p.with_name(p.name.replace('_report_','_raw_')).with_suffix('.csv');err=0.
        if verify:
            table=np.genfromtxt(io.StringIO(cp.read_text(encoding='utf-8-sig')),delimiter=',',names=True,dtype=None,encoding='utf-8')
            v=table['adc_counts']*2.5/65536*1000;t=(np.arange(len(v))+1)/4000
            reconstructed=2/len(v)*(np.cos(2*np.pi*FREQ[:,None]*t)@(v-v.mean())+1j*np.sin(2*np.pi*FREQ[:,None]*t)@(v-v.mean()))
            assert len(v)==8000 and r['sampleRateHz']==4000 and r['frequenciesHz']==list(FREQ)
            assert r['valid'] and not r['timingFault'] and r['railSamples']==0
            err=float(np.max(abs(reconstructed-z)));assert err<1e-5
        result.append(dict(group=r['conditionTag'][:-1],tag=r['conditionTag'],z=z,record=r['id'],
                           report_file=str(p),raw_file=str(cp),iq_error_mV=err))
    return result

def prepare(records,set_name,excluded=()):
    """Blank and phase directions are not selected using a held target response."""
    b=np.mean([r['z'] for r in records if r['group']=='DDW'],axis=0)
    levels=LEVELS[set_name]
    if set_name=='A':
        # Set A has no isolated-source controls. Use highest TRAINING standard.
        ref_group=max((g for g in levels if levels[g] not in excluded),key=lambda g:levels[g])
        ref=np.mean([r['z'] for r in records if r['group']==ref_group],axis=0)-b
        phase_source=ref_group
    else:
        isolated=np.array([np.mean([r['z'] for r in records if r['group']==f'D{i}-100C'],axis=0)-b for i in range(1,5)]).T
        ref=np.diag(isolated);phase_source='isolated-source controls, separate from uniform holdouts'
    phase=ref/abs(ref)
    signals=np.array([np.real((r['z']-b)*np.conj(phase)) for r in records])
    x=np.array(list(levels.values()))
    y=np.array([np.mean([v for r,v in zip(records,signals) if r['group']==g],axis=0) for g in levels])
    return x,y,signals,b,phase,phase_source

class Model:
    def __init__(self,family,x,y):
        self.family=family;self.scale=float(max(x));u=np.asarray(x)/self.scale;y=np.asarray(y)
        self.knots=np.asarray(x);self.ys=y
        if family in ['linear','quadratic']:
            self.p=np.polynomial.polynomial.polyfit(u,y,1 if family=='linear' else 2)
        elif family=='pchip':
            self.p=[];self.interpolator=PchipInterpolator(x,y,extrapolate=True)
        else:
            start=[-2,.1,2,5] if family=='exponential' else [.5,1,2,4]
            bounds=([-np.inf,1e-10,-8],[np.inf,np.inf,8]) if family=='exponential' else ([-np.inf,1e-10,.1],[np.inf,np.inf,8])
            def form(p):return p[0]+p[1]*self.base(family,p[2],u)
            candidates=[least_squares(lambda p:form(p)-y,[y[0],max(y[-1]-y[0],.01),k],bounds=bounds,max_nfev=4000) for k in start]
            self.p=min(candidates,key=lambda r:sum(r.fun**2)).x
        if family=='linear':self.monotonic=bool(self.p[1]>0)
        elif family=='quadratic':self.monotonic=bool(min(self.p[1],self.p[1]+2*self.p[2])>0)
        elif family=='pchip':self.monotonic=bool(np.all(np.diff(y)>0))
        else:self.monotonic=True # constrained positive scale, strictly increasing family
    @staticmethod
    def base(family,k,u):
        if family=='exponential':return u if abs(k)<1e-7 else np.expm1(k*u)/np.expm1(k)
        return np.maximum(u,0)**k
    def __call__(self,c):
        u=np.asarray(c)/self.scale
        if self.family in ['linear','quadratic']:return np.polynomial.polynomial.polyval(u,self.p)
        if self.family=='pchip':return self.interpolator(c)
        return self.p[0]+self.p[1]*self.base(self.family,self.p[2],u)
    def inverse(self,y):
        # Preserve signed/out-of-range diagnostic values. Never clip them to 0.
        if self.family=='linear':return float(self.scale*(y-self.p[0])/self.p[1])
        if self.family=='exponential':
            k=self.p[2];t=(y-self.p[0])/self.p[1]
            if abs(k)<1e-7:return float(self.scale*t)
            v=t*np.expm1(k)
            return float(self.scale*np.log1p(v)/k) if v>-1 else np.nan
        if self.family=='power':
            t=(y-self.p[0])/self.p[1]
            return float(self.scale*t**(1/self.p[2])) if t>=0 else np.nan
        if self.family=='quadratic':
            p=np.array(self.p);p[0]-=y;rr=np.polynomial.polynomial.polyroots(p)
            roots=[float(v.real*self.scale) for v in rr if abs(v.imag)<1e-7]
        else:
            grid=np.linspace(-.5*self.scale,1.5*self.scale,4001);vv=self(grid)-y
            roots=[float(v) for v in grid[np.isclose(vv,0,atol=1e-10,rtol=0)]]
            roots += [brentq(lambda c:float(self(c)-y),grid[k],grid[k+1]) for k in np.where(vv[:-1]*vv[1:]<0)[0]]
        roots=sorted(set(round(v,9) for v in roots));inside=[r for r in roots if 0<=r<=self.scale]
        if len(inside)==1:return inside[0]
        return roots[0] if len(roots)==1 else np.nan

def joint_fit(family,x,s,y):
    """Common curve shape + independently estimated offset/gain per acquisition set."""
    x=np.asarray(x);s=np.asarray(s);y=np.asarray(y);u=x/20
    def base(k,u):
        if family=='linear':return u
        if family=='quadratic':return (1-k)*u+k*u*u
        return Model.base(family,k,u)
    def formula(p,u,s):return p[2*s]+p[2*s+1]*base(p[-1] if family!='linear' else 1,u)
    initial=[]
    for sn in [0,1]:
        yy=y[s==sn];xx=x[s==sn];initial += [yy[0],max(yy[-1]-yy[0],.1)*20/max(xx)]
    klo,khi=([-8,8] if family=='exponential' else [.1,8] if family=='power' else [-5,5])
    starts=[0] if family=='linear' else [-2,.1,2,5] if family=='exponential' else [.5,1,2,4] if family=='power' else [-1,0,.5,1]
    candidates=[]
    for k in starts:
        p=initial+([k] if family!='linear' else []);lo=[-np.inf,1e-9,-np.inf,1e-9]+([klo] if family!='linear' else []);hi=[np.inf]*4+([khi] if family!='linear' else [])
        candidates.append(least_squares(lambda p:formula(p,u,s)-y,p,bounds=(lo,hi),max_nfev=4000))
    p=min(candidates,key=lambda r:sum(r.fun**2)).x
    mono=family!='quadratic' or min(1-p[-1],1+p[-1])>0
    def inverse(yy,sn):
        t=(yy-p[2*sn])/p[2*sn+1]
        if family=='linear':return float(t*20)
        if family=='exponential':
            v=t*np.expm1(p[-1]);return float(np.log1p(v)/p[-1]*20) if v>-1 else np.nan
        if family=='power':return float(t**(1/p[-1])*20) if t>=0 else np.nan
        roots=np.roots([p[-1],1-p[-1],-t])*20;roots=[float(r.real) for r in roots if abs(r.imag)<1e-9 and 0<=r.real<=20]
        return roots[0] if len(roots)==1 else np.nan
    return inverse,bool(mono),p

def stats(rows):
    xx=np.array([r['actual_uM'] for r in rows]);pp=np.array([r['predicted_uM'] for r in rows]);valid=np.isfinite(pp)
    xx=xx[valid];pp=pp[valid];e=pp-xx
    return dict(n=len(rows),n_finite=int(sum(valid)),rmse_uM=float(np.sqrt(np.mean(e**2))),mae_uM=float(np.mean(abs(e))),bias_uM=float(np.mean(e)),
                prediction_R2=float(1-sum(e**2)/sum((xx-xx.mean())**2)),max_absolute_error_uM=float(max(abs(e))))

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--workspace-root',type=Path,default=Path(__file__).resolve().parents[4]);ap.add_argument('--archive-root',type=Path);ap.add_argument('--output-dir',type=Path);ap.add_argument('--skip-raw-reconstruction',action='store_true');args=ap.parse_args()
    root=(args.archive_root or args.workspace_root).resolve();out=args.output_dir or Path(__file__).resolve().parent
    out.mkdir(parents=True,exist_ok=True)
    if args.archive_root:
        validation=root/'aerosense-wiki'/'hardware information'/'AeroSense v2'/'07_validation'
        inputs={'A':validation/'fluorescein_2026-10-19'/'raw','B':validation/'fluorescein_2026-10-20'/'raw'}
    else:
        inputs={'A':root/'hardware_test','B':root/'hardware_test2'}
    data={s:load(folder,not args.skip_raw_reconstruction) for s,folder in inputs.items()}
    extra=load(inputs['B']/'new_25C',not args.skip_raw_reconstruction)
    assert (len(data['A']),len(data['B']),len(extra))==(25,30,3)
    prepared={s:prepare(data[s],s) for s in ['A','B']}
    training=[];coefficients=[];folds=[];comparisons=[];selected={};models={}
    for s in ['A','B']:
        x,y,signals,blank,phase,phase_source=prepared[s]
        for j,ch in enumerate(CHANNELS):
            for k,c in enumerate(x):
                group=list(LEVELS[s])[k];values=[v[j] for r,v in zip(data[s],signals) if r['group']==group]
                training.append(dict(calibration_set=s,channel=ch,concentration_uM=c,mean_signal_mV=y[k,j],sd_mV=float(np.std(values,ddof=1)),n_records=len(values),blank_I_mV=blank[j].real,blank_Q_mV=blank[j].imag,phase_real=phase[j].real,phase_imag=phase[j].imag,phase_reference=phase_source))
        for family in FAMILIES:
            full=[Model(family,x,y[:,j]) for j in range(4)]
            for j,ch in enumerate(CHANNELS):
                coefficients.append(dict(calibration_set=s,channel=ch,family=family,scale_uM=full[j].scale,coefficients=json.dumps([float(v) for v in full[j].p]),monotonic=full[j].monotonic,levels_uM=';'.join(f'{c:g}' for c in x)))
            rows=[];allmono=all(m.monotonic for m in full)
            for k in range(1,len(x)-1):
                keep=np.arange(len(x))!=k
                # Highest standard is never held in these interpolation checks.
                for j,ch in enumerate(CHANNELS):
                    m=Model(family,x[keep],y[keep,j]);p=m.inverse(y[k,j]);allmono &= m.monotonic
                    r=dict(calibration_set=s,family=family,channel=ch,actual_uM=float(x[k]),predicted_uM=p,residual_uM=p-x[k],fit_levels_uM=';'.join(f'{c:g}' for c in x[keep]),monotonic=m.monotonic,in_range=bool(np.isfinite(p) and 0<=p<=max(x[keep])),holdout='all acquisitions at concentration')
                    rows.append(r);folds.append(r)
            met=stats(rows);eligible=allmono and all(r['in_range'] for r in rows)
            comparisons.append(dict(calibration_set=s,family=family,eligible=eligible,all_full_and_fold_fits_monotonic=allmono,n_in_range=sum(r['in_range'] for r in rows),**met))
        eligible=[r for r in comparisons if r['calibration_set']==s and r['eligible']]
        chosen=min(eligible,key=lambda r:r['rmse_uM'])['family'];selected[s]=chosen;models[s]=[Model(chosen,x,y[:,j]) for j in range(4)]
    assert selected=={'A':'linear','B':'exponential'}
    # Test observations have not been used to pick a family or transfer function.
    displayed=[];individual=[]
    for group,actual in LAYOUTS.items():
        indices=[k for k,r in enumerate(data['A']) if r['group']==group]
        for j,ch in enumerate(CHANNELS):
            pp=[models['A'][j].inverse(prepared['A'][2][k,j]) for k in indices]
            p=float(np.mean(pp));displayed.append(dict(calibration_set='A',validation='withheld unequal-well loading',group=group,channel=ch,actual_uM=float(actual[j]),predicted_uM=p,residual_uM=p-actual[j],n_records=len(indices),within_loading_sd_uM=float(np.std(pp,ddof=1)) if len(pp)>1 else '',family=selected['A'],fit_levels_uM='0;0.1;1;10',reportable_range=bool(0<=p<=10)))
            for k,v in zip(indices,pp):individual.append(dict(calibration_set='A',group=group,record=data['A'][k]['record'],channel=ch,actual_uM=actual[j],predicted_uM=v))
    x,y,signals,*_=prepared['B']
    for k in [1,2,3]:
        keep=np.arange(len(x))!=k;group=list(LEVELS['B'])[k];indices=[n for n,r in enumerate(data['B']) if r['group']==group]
        for j,ch in enumerate(CHANNELS):
            model=Model(selected['B'],x[keep],y[keep,j]);p=model.inverse(y[k,j]);pp=[model.inverse(signals[n,j]) for n in indices]
            displayed.append(dict(calibration_set='B',validation='whole-concentration holdout',group=group,channel=ch,actual_uM=float(x[k]),predicted_uM=p,residual_uM=p-x[k],n_records=3,within_loading_sd_uM=float(np.std(pp,ddof=1)),family=selected['B'],fit_levels_uM=';'.join(f'{c:g}' for c in x[keep]),reportable_range=bool(0<=p<=20)))
            for n,v in zip(indices,pp):individual.append(dict(calibration_set='B',group=group,record=data['B'][n]['record'],channel=ch,actual_uM=x[k],predicted_uM=v))
    assert len(displayed)==32 and len(individual)==88
    # Three shared-level mapping: actual means are preserved, never shifted to force agreement.
    anchors=[];transfer=[];transfer_holdouts=[]
    ax=np.array([0.,1.,10.]);ay={s:prepared[s][1][[list(LEVELS[s].values()).index(c) for c in ax]] for s in ['A','B']}
    for j,ch in enumerate(CHANNELS):
        for k,c in enumerate(ax):anchors.append(dict(channel=ch,concentration_uM=c,set_A_signal_mV=ay['A'][k,j],set_B_signal_mV=ay['B'][k,j],A_fraction_of_10uM=ay['A'][k,j]/ay['A'][2,j],B_fraction_of_10uM=ay['B'][k,j]/ay['B'][2,j]))
        for family in FAMILIES:
            m=Model(family,ay['A'][:,j],ay['B'][:,j]);err=m(ay['A'][:,j])-ay['B'][:,j]
            transfer.append(dict(channel=ch,family=family,training_signal_rmse_mV=float(np.sqrt(np.mean(err**2))),monotonic=m.monotonic,parameters=json.dumps([float(v) for v in m.p]),validation='two remaining shared points cannot identify a three-parameter warp' if family in ['quadratic','exponential','power'] else 'PCHIP becomes a straight line with two anchors' if family=='pchip' else 'leave one nonblank shared level out'))
        for k in [1,2]:
            keep=np.arange(3)!=k
            foldprep={sn:prepare(data[sn],sn,excluded=(ax[k],)) for sn in ['A','B']}
            foldanchors={sn:foldprep[sn][1][[list(LEVELS[sn].values()).index(c) for c in ax]] for sn in ['A','B']}
            m=Model('linear',foldanchors['A'][keep,j],foldanchors['B'][keep,j]);p=float(m(foldanchors['A'][k,j]))
            transfer_holdouts.append(dict(channel=ch,held_concentration_uM=ax[k],training_levels_uM=';'.join(str(c) for c in ax[keep]),measured_B_mV=foldanchors['B'][k,j],predicted_B_mV=p,error_mV=p-foldanchors['B'][k,j],check_type='interpolation' if k==1 else 'endpoint extrapolation',baseline='same-session DDW always used',A_phase_reference=foldprep['A'][5],held_level_removed_from_phase_reference=True))
    # Joint shape models use all shared levels in the full fit; each validation level
    # is removed from BOTH calibration sets, from transfer anchors, and from A phase.
    joint_rows=[];joint_comparison=[];joint_coeff=[]
    xx=np.r_[prepared['A'][0],prepared['B'][0]];ss=np.r_[np.zeros(4,int),np.ones(5,int)]
    for family in FAMILIES[:-1]:
        allmono=True
        full_y=np.vstack([prepared['A'][1],prepared['B'][1]])
        for j,ch in enumerate(CHANNELS):
            inv,mono,p=joint_fit(family,xx,ss,full_y[:,j]);allmono &= mono
            joint_coeff.append(dict(family=family,channel=ch,coefficients=json.dumps([float(v) for v in p]),monotonic=mono))
        rows=[]
        for c in [.1,1.,5.,10.]:
            heldprep={s:prepare(data[s],s,excluded=(c,)) for s in ['A','B']};yy=np.vstack([heldprep['A'][1],heldprep['B'][1]])
            keep=xx!=c
            for j,ch in enumerate(CHANNELS):
                inv,mono,p=joint_fit(family,xx[keep],ss[keep],yy[keep,j]);allmono &= mono
                for k in np.where(~keep)[0]:
                    pred=inv(yy[k,j],ss[k]);setname=['A','B'][ss[k]];hi=float(max(xx[(ss==ss[k])&keep]));check='endpoint extrapolation' if c>hi else 'interpolation'
                    row=dict(family=family,calibration_set=setname,channel=ch,actual_uM=float(c),predicted_uM=pred,residual_uM=pred-c,check_type=check,in_range=bool(np.isfinite(pred) and 0<=pred<=hi),monotonic=mono,held_level_removed_from_both_sets=True)
                    rows.append(row);joint_rows.append(row)
        interp=[r for r in rows if r['check_type']=='interpolation'];met=stats(interp)
        joint_comparison.append(dict(family=family,eligible=bool(allmono and all(r['in_range'] for r in interp)),all_full_and_fold_fits_monotonic=allmono,n_in_range=sum(r['in_range'] for r in interp),**met))
    # Preserve every 2.5 uM acquisition as an explicitly separate sensitivity check.
    sensitivity=[]
    for label,records in [('original_25C',[r for r in data['B'] if r['group']=='25C']),('additional_25C',extra)]:
        b=prepared['B'][3];ph=prepared['B'][4];sigs=np.array([np.real((r['z']-b)*np.conj(ph)) for r in records])
        for j,ch in enumerate(CHANNELS):
            yy=float(np.mean(sigs[:,j]));p=models['B'][j].inverse(yy)
            sensitivity.append(dict(loading=label,channel=ch,actual_uM=2.5,mean_signal_mV=yy,sd_signal_mV=float(np.std(sigs[:,j],ddof=1)),predicted_uM=p,in_range=bool(np.isfinite(p) and 0<=p<=20),reason='original D3 signal unstable; additional loading predates matching blank'))
    # Full-data alternatives keep the unfavorable 2.5 uM material visible.
    for label,records in [('all_original',data['B']),('additional_substitution',[r for r in data['B'] if r['group']!='25C']+extra)]:
        b=prepared['B'][3];ph=prepared['B'][4];xl=np.array([0.,1.,2.5,5.,10.,20.]);groups=['DDW','10C','25C','50C','100C','200C']
        yl=np.array([np.mean([np.real((r['z']-b)*np.conj(ph)) for r in records if r['group']==g],axis=0) for g in groups])
        for family in FAMILIES:
            sr=[];mono=all(Model(family,xl,yl[:,j]).monotonic for j in range(4))
            for k in range(1,5):
                keep=np.arange(6)!=k
                for j,ch in enumerate(CHANNELS):
                    m=Model(family,xl[keep],yl[keep,j]);p=m.inverse(yl[k,j]);mono &= m.monotonic
                    sr.append(dict(actual_uM=float(xl[k]),predicted_uM=p,in_range=bool(np.isfinite(p) and 0<=p<=20)))
            sensitivity.append(dict(loading=label,channel='all',family=family,eligible=bool(mono and all(r['in_range'] for r in sr)),n_in_range=sum(r['in_range'] for r in sr),**stats(sr)))
    manifest=[]
    for r in data['A']+data['B']+extra:
        for key in ['report_file','raw_file']:
            p=Path(r[key]);manifest.append(dict(path=str(p.relative_to(root)),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bytes=p.stat().st_size))
    results={'calibration_training.csv':training,'model_coefficients.csv':coefficients,'model_holdouts.csv':folds,'model_comparison.csv':comparisons,'concentration_checks.csv':displayed,'individual_read_checks.csv':individual,'overlap_anchors.csv':anchors,'three_anchor_transfer_candidates.csv':transfer,'transfer_holdouts.csv':transfer_holdouts,'joint_shape_holdouts.csv':joint_rows,'joint_shape_comparison.csv':joint_comparison,'joint_shape_coefficients.csv':joint_coeff,'qc_sensitivity.csv':sensitivity,'raw_input_manifest.csv':manifest}
    for name,rows in results.items():writecsv(out/name,rows)
    chosen_folds=[r for r in folds if r['family']==selected[r['calibration_set']]]
    summary=dict(selected_models=selected,standard_holdout_metrics=stats(chosen_folds),descriptive_combined_metrics=stats(displayed),
       validation_metrics={s:stats([r for r in displayed if r['calibration_set']==s]) for s in ['A','B']},
       model_comparison=comparisons,joint_shape_comparison=joint_comparison,displayed_loading_channel_means=32,displayed_acquisitions=22,individual_well_read_estimates=88,
       raw_acquisitions=58,raw_reconstruction_verified=not args.skip_raw_reconstruction,max_recomputed_iq_error_V=max(r['iq_error_mV'] for r in data['A']+data['B']+extra)/1000,
       limitations=['Combined R2/RMSE are descriptive summaries across distinct validation configurations, not a pooled independent accuracy estimate.',
       'Calibration family selection and 2.5 uM QC exclusion are exploratory, not nested prospective validation.',
       'Channels share loadings; technical reads are not independent preparations.',
       'Zero and 20 uM set-B anchors are not held-out predictions; out-of-range and missing estimates are never clipped.',
       'No common three-anchor signal warp is adopted. Fresh within-set blank correction and per-set inverse curves put results in common uM units.',
       'Signed phase projection does not establish arbitrary-mixture leakage subtraction.'])
    (out/'summary.json').write_text(json.dumps(summary,indent=2,allow_nan=True),encoding='utf-8')
    plot(out,displayed,comparisons,chosen_folds,summary)
    print(json.dumps({k:v for k,v in summary.items() if k not in ['model_comparison','joint_shape_comparison','limitations']},indent=2))

def plot(out,displayed,comparisons,chosen_folds,summary,concentration_only=False):
    plt.rcParams.update({'font.family':'sans-serif','font.sans-serif':['Arial','DejaVu Sans'],'font.size':12,'axes.spines.top':False,'axes.spines.right':False,'axes.labelcolor':'#233845','text.color':'#233845','svg.fonttype':'none'})
    fig,axs=plt.subplots(1,2,figsize=(11,5.15),layout='constrained')
    for ax,letter,title in zip(axs,['A','B'],['Calibrated concentration recovery','Residual distribution by concentration']):
        ax.text(0,1.02,letter,transform=ax.transAxes,weight='bold',fontsize=16,va='bottom');ax.set_title(title,pad=18,fontsize=12)
        ax.grid(alpha=.14);ax.set_axisbelow(True);ax.set_xlabel('Prepared concentration (µM)')
    for ch,color in zip(CHANNELS,COLORS):
        rows=[r for r in displayed if r['channel']==ch];x=np.array([r['actual_uM'] for r in rows]);y=np.array([r['predicted_uM'] for r in rows])
        axs[0].scatter(x,y,color=color,s=47,alpha=.78,edgecolor='white',lw=.55,label=ch,zorder=3)
    axs[0].plot([-.5,12.5],[-.5,12.5],ls='--',color='#80919a',lw=1);axs[0].set(xlim=(-.35,12.4),ylim=(-.5,12.4),ylabel='Predicted concentration (µM)')
    # Categories retain prepared concentration; equal spacing avoids overlapping 0 and 0.1 uM violins.
    levels=sorted({float(r['actual_uM']) for r in displayed})
    groups=[[r for r in displayed if float(r['actual_uM'])==level] for level in levels]
    residuals=[np.array([float(r['predicted_uM'])-float(r['actual_uM']) for r in group]) for group in groups]
    positions=np.arange(len(levels))
    violins=axs[1].violinplot(residuals,positions=positions,widths=.68,showmeans=False,showextrema=False,bw_method=.5)
    for body in violins['bodies']:
        body.set_facecolor('#ccd9df');body.set_edgecolor('#8da4b0');body.set_alpha(.48);body.set_linewidth(1.0)
    group_stats=[]
    for position,level,group,values in zip(positions,levels,groups,residuals):
        # Only horizontal positions are offset, deterministically; all 32 vertical data values are unchanged.
        offsets=np.linspace(-.16,.16,len(group))
        for offset,row,value in zip(offsets,group,values):
            color=COLORS[CHANNELS.index(row['channel'])]
            axs[1].scatter(position+offset,value,color=color,s=43,alpha=.9,edgecolor='white',lw=.6,zorder=3)
        mean=float(np.mean(values))
        axs[1].plot([position-.23,position+.23],[mean,mean],color='#233845',lw=2.2,zorder=4)
        axs[1].text(position,float(max(values))+.18,f'Mean {mean:+.2f}',ha='center',va='bottom',fontsize=10.4,weight='bold',color='#233845')
        group_stats.append(dict(prepared_concentration_uM=level,n_channel_loading_means=len(group),mean_residual_uM=mean,median_residual_uM=float(np.median(values)),sd_residual_uM=float(np.std(values,ddof=1)),min_residual_uM=float(min(values)),max_residual_uM=float(max(values))))
    writecsv(out/'residual_means_by_prepared_concentration.csv',group_stats)
    all_residuals=np.concatenate(residuals)
    axs[1].axhline(0,ls='--',color='#80919a',lw=1)
    axs[1].set(xlim=(-.55,len(levels)-.45),ylim=(float(min(all_residuals))-.25,float(max(all_residuals))+.6),xticks=positions,xticklabels=[f'{level:g}' for level in levels],ylabel='Prediction − prepared concentration (µM)')
    axs[1].set_xlabel('Prepared concentration (µM)\nEqually spaced categories',fontsize=11)
    met=summary['descriptive_combined_metrics']
    axs[0].text(.055,.95,f"Descriptive R² = {met['prediction_R2']:.3f}\nRMSE = {met['rmse_uM']:.2f} µM",transform=axs[0].transAxes,va='top',fontsize=11.5,bbox=dict(fc='white',ec='none',alpha=.94))
    axs[0].legend(loc='lower right',ncol=2,frameon=False)
    fig.savefig(out/'concentration-recovery-violin.svg',bbox_inches='tight',metadata={'Date':None});fig.savefig(out/'concentration-recovery-violin.png',dpi=180,bbox_inches='tight');plt.close(fig)
    if concentration_only:return
    # No fitted-sample R2 is used to justify model degree.
    fig,ax=plt.subplots(figsize=(10.5,5.4),layout='constrained')
    labels=['Linear','Quadratic','Exponential','Power','PCHIP','Selected per\ncalibration set'];values=[];eligible=[]
    for fam in FAMILIES:
        rows=[r for r in comparisons if r['family']==fam];n=sum(r['n'] for r in rows)
        values.append(np.sqrt(sum(r['rmse_uM']**2*r['n_finite'] for r in rows)/sum(r['n_finite'] for r in rows)));eligible.append(all(r['eligible'] for r in rows))
    values.append(summary['standard_holdout_metrics']['rmse_uM']);eligible.append(True)
    colors=['#8daab9' if valid else '#ddd5d2' for valid in eligible];colors[-1]='#276c83'
    bars=ax.bar(range(6),values,color=colors,width=.62)
    for i,(b,v,valid) in enumerate(zip(bars,values,eligible)):
        ax.text(b.get_x()+b.get_width()/2,v+.05,f'{v:.2f}',ha='center',weight='bold',fontsize=13)
        if not valid:
            b.set_hatch('//');ax.text(b.get_x()+b.get_width()/2,.08,'Non-monotone\nfit(s)',ha='center',va='bottom',fontsize=10.5,color='#684c46')
    ax.set_xticks(range(6),labels);ax.set_ylabel('Whole-concentration holdout RMSE (µM)');ax.set_ylim(0,max(values)+.55);ax.set_title('Choose the curve with held-out concentrations',pad=15)
    ax.grid(axis='y',alpha=.15);ax.set_axisbelow(True)
    fig.text(.5,-.015,'20 channel / concentration means · same 5 candidate families · endpoints retained as calibration anchors',ha='center',fontsize=10.5)
    fig.savefig(out/'calibration-model-selection.svg',bbox_inches='tight');fig.savefig(out/'calibration-model-selection.png',dpi=180,bbox_inches='tight');plt.close(fig)

if __name__=='__main__':main()

