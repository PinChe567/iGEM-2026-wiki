"""Reproduce both-session concentration checks without pooling incompatible signals.

Usage: python analyze_session_comparison.py --workspace-root <wiki folder>
Raw inputs are read-only. Dependencies: numpy, scipy, matplotlib.
"""
from pathlib import Path
import argparse, csv, hashlib, json, io
import numpy as np
from scipy.optimize import least_squares, brentq
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import TwoSlopeNorm

FREQ=np.array([41,67,89,113]); CHANNELS=['D1','D2','D3','D4']
COLORS=['#246680','#bb6843','#5a8a65','#9162a0']

def writecsv(path,rows):
    with path.open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)

def z(r): return 1000*(np.array(r['inPhaseV'])+1j*np.array(r['quadratureV']))
def load(folder):
    result=[]
    for p in sorted(folder.glob('*_report_*.json')):
        d=json.loads(p.read_text(encoding='utf-8-sig'));r=d['records'][0]
        cp=p.with_name(p.name.replace('_report_','_raw_')).with_suffix('.csv')
        table=np.genfromtxt(io.StringIO(cp.read_text(encoding='utf-8-sig')),delimiter=',',names=True,dtype=None,encoding='utf-8')
        v=table['adc_counts']*2.5/65536*1000;t=(np.arange(len(v))+1)/4000
        measured=2/len(v)*(np.cos(2*np.pi*FREQ[:,None]*t)@(v-v.mean())+1j*np.sin(2*np.pi*FREQ[:,None]*t)@(v-v.mean()))
        assert len(v)==8000 and r['sampleRateHz']==4000 and r['frequenciesHz']==list(FREQ)
        assert r['valid'] and not r['timingFault'] and r['railSamples']==0
        error=float(np.max(abs(measured-z(r))))
        assert error<1e-5
        result.append(dict(group=r['conditionTag'][:-1],tag=r['conditionTag'],z=z(r),
            saved_blank=np.mean([z(b) for b in d['measuredCalibration']['blank']],axis=0),
            record=r['id'],report_file=str(p),raw_file=str(cp),iq_error_mV=error))
    return result

def expfit(x,y):
    def formula(p,xx):
        u=np.asarray(xx)/20;k=p[2]
        return p[0]+p[1]*(u if abs(k)<1e-6 else np.expm1(k*u)/np.expm1(k))
    candidates=[least_squares(lambda p:formula(p,x)-y,[y[0],max(y[-1]-y[0],.01),k],
         bounds=([-np.inf,0,-8],[np.inf,np.inf,8]),max_nfev=4000) for k in [-2,.1,2,5]]
    res=min(candidates,key=lambda q:sum(q.fun**2))
    return lambda xx:formula(res.x,xx),res.x

def inverse(f,y):
    g=np.linspace(0,20,4001);v=f(g)-y
    roots=list(g[np.isclose(v,0,atol=1e-9,rtol=0)])
    roots += [brentq(lambda x:float(f(x)-y),g[i],g[i+1]) for i in np.where(v[:-1]*v[1:]<0)[0]]
    unique=[]
    for r in sorted(roots):
        if not unique or abs(r-unique[-1])>1e-5:unique.append(r)
    return unique[0] if len(unique)==1 else np.nan

def metrics(rows):
    x=np.array([r['actual_uM'] for r in rows]); y=np.array([r['predicted_uM'] for r in rows])
    e=y-x
    return dict(n_loading_channel_means=len(x),rmse_uM=float(np.sqrt(np.mean(e**2))),
                prediction_R2=float(1-sum(e**2)/sum((x-x.mean())**2)),bias_uM=float(e.mean()),
                max_absolute_error_uM=float(max(abs(e))))

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--workspace-root',type=Path,default=Path(__file__).resolve().parents[4]);args=parser.parse_args()
    root=args.workspace_root;out=Path(__file__).resolve().parent
    old=load(root/'hardware_test');new=load(root/'hardware_test2');extra=load(root/'hardware_test2'/'new_25C')
    assert (len(old),len(new),len(extra))==(25,30,3)
    means=[];recordrows=[];coefs=[]
    # Earlier mixed loadings are absent from the independent uniform-standard fit.
    c_of={'DDW':0.,'C':.1,'10C':1.,'100C':10.}
    standards=[r for r in old if r['group'] in c_of]
    assert len(standards)==12
    sx=np.array([c_of[r['group']] for r in standards])
    sy=np.array([abs(r['z']-r['saved_blank']) for r in standards])
    intercept,slope=np.linalg.lstsq(np.c_[np.ones(12),sx],sy,rcond=None)[0]
    layouts={'Test1':[10,1,.1,0],'Test2':[0,.1,1,10],'Test3':[0,.1,1,10],'Test4':[0,.1,1,10],'Test5':[10,1,.1,0]}
    for j,ch in enumerate(CHANNELS):
        coefs.append(dict(session='Earlier',channel=ch,model='Linear magnitude',a_mV=float(intercept[j]),b=float(slope[j]),k='',fit_levels_uM='0;0.1;1;10'))
    for group,actuals in layouts.items():
        records=[r for r in old if r['group']==group];assert len(records)==(1 if group=='Test1' else 3)
        pred=np.array([(abs(r['z']-r['saved_blank'])-intercept)/slope for r in records])
        for j,ch in enumerate(CHANNELS):
            means.append(dict(session='Earlier',check='Held-out unequal-well loading',group=group,channel=ch,
              actual_uM=actuals[j],predicted_uM=float(pred[:,j].mean()),residual_uM=float(pred[:,j].mean()-actuals[j]),
              n_records=len(records),within_loading_sd_uM=float(np.std(pred[:,j],ddof=1)) if len(records)>1 else '',
              held_out_from='All mixed loadings excluded from calibration',fit_levels_uM='0;0.1;1;10'))
            for r,p in zip(records,pred[:,j]):recordrows.append(dict(session='Earlier',group=group,record=r['record'],channel=ch,actual_uM=actuals[j],predicted_uM=float(p)))
    # Later curve family and QC choice are fixed from the prior exploratory analysis.
    levels=np.array([0.,1.,5.,10.,20.]);groups=['DDW','10C','50C','100C','200C']
    blank=np.mean([r['z'] for r in new if r['group']=='DDW'],axis=0)
    single=np.array([np.mean([r['z'] for r in new if r['group']==f'D{i}-100C'],axis=0)-blank for i in range(1,5)]).T
    phase=np.diag(single)/abs(np.diag(single))
    ym=np.array([np.mean([np.real((r['z']-blank)*np.conj(phase)) for r in new if r['group']==g],axis=0) for g in groups])
    for j,ch in enumerate(CHANNELS):
        f,p=expfit(levels,ym[:,j]);coefs.append(dict(session='Later',channel=ch,model='Exponential signed projection',a_mV=p[0],b=p[1],k=p[2],fit_levels_uM='0;1;5;10;20'))
    for k in [1,2,3]:
        keep=np.arange(5)!=k
        for j,ch in enumerate(CHANNELS):
            f,_=expfit(levels[keep],ym[keep,j]);prediction=inverse(f,ym[k,j]);assert np.isfinite(prediction)
            records=[r for r in new if r['group']==groups[k]]
            preds=[inverse(f,np.real((r['z'][j]-blank[j])*np.conj(phase[j]))) for r in records]
            means.append(dict(session='Later',check='Whole-concentration holdout',group=groups[k],channel=ch,
               actual_uM=float(levels[k]),predicted_uM=float(prediction),residual_uM=float(prediction-levels[k]),n_records=3,
               within_loading_sd_uM=float(np.std(preds,ddof=1)),held_out_from='All reads at this concentration excluded',
               fit_levels_uM=';'.join(f'{c:g}' for c in levels[keep])))
            for r,p in zip(records,preds):recordrows.append(dict(session='Later',group=groups[k],record=r['record'],channel=ch,actual_uM=float(levels[k]),predicted_uM=float(p)))
    # Confirm earlier archived computations, avoiding an accidental calibration change.
    archive=out/'reference_mixed_loading_summary.csv'
    canonical=list(csv.DictReader(archive.open(encoding='utf-8')))
    for r in means[:20]:
        expected=next(e for e in canonical if e['loading_group']==r['group'] and e['channel']==r['channel'])
        assert r['actual_uM']==float(expected['assigned_concentration_uM'])
        assert abs(r['predicted_uM']-float(expected['amplitude_calibrated_mean_uM']))<1e-7
    primary=list(csv.DictReader((out/'reference_primary_holdouts.csv').open(encoding='utf-8')))
    for r in means[20:]:
        expected=next(e for e in primary if e['channel']==r['channel'] and float(e['held_concentration_uM'])==r['actual_uM'])
        assert abs(r['predicted_uM']-float(expected['predicted_concentration_uM']))<1e-6
    # A transfer is tested on an unused standard, never fitted to that same check.
    ob=np.mean([r['z'] for r in old if r['group']=='DDW'],axis=0)
    o10=np.mean([r['z'] for r in old if r['group']=='100C'],axis=0)-ob
    n10=np.mean([r['z'] for r in new if r['group']=='100C'],axis=0)-blank
    o1=np.mean([r['z'] for r in old if r['group']=='10C'],axis=0)-ob
    n1=np.mean([r['z'] for r in new if r['group']=='10C'],axis=0)-blank
    gain=n10/o10;aligned=n1/gain;transfer=[]
    for j,ch in enumerate(CHANNELS):transfer.append(dict(channel=ch,complex_gain_real=float(gain[j].real),complex_gain_imag=float(gain[j].imag),
         held_1uM_complex_difference_mV=float(abs(aligned[j]-o1[j])),alignment_standards_uM='0;10',unused_check_uM=1))
    stat={session:metrics([r for r in means if r['session']==session]) for session in ['Earlier','Later']}
    manifest=[]
    for r in old+new+extra:
        for key in ['report_file','raw_file']:
            p=Path(r[key]);manifest.append(dict(path=str(p.relative_to(root)),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bytes=p.stat().st_size))
    writecsv(out/'concentration_checks.csv',means);writecsv(out/'individual_read_checks.csv',recordrows)
    writecsv(out/'session_coefficients.csv',coefs);writecsv(out/'overlap_transfer_check.csv',transfer);writecsv(out/'raw_input_manifest.csv',manifest)
    summary=dict(raw_acquisitions=58,max_recomputed_iq_error_V=max(r['iq_error_mV'] for r in old+new+extra)/1000,
                 displayed_loading_channel_means=32,displayed_acquisitions=22,metrics=stat,session_transfer=transfer,
                 limitations=['Different loading configurations and calibration families; no pooled accuracy claim.',
                 'Later family selection and 2.5 uM QC exclusions were exploratory.',
                 'Mixed wells were not unmixed by an unsupported transferred matrix.',
                 '0 and 20 uM later anchors are not independent holdout observations.'])
    (out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
    plt.rcParams.update({'font.family':'sans-serif','font.sans-serif':['Arial','DejaVu Sans'],'font.size':12,'axes.spines.top':False,'axes.spines.right':False,'axes.labelcolor':'#233845','text.color':'#233845','svg.fonttype':'none'})
    fig,axs=plt.subplots(1,2,figsize=(10.5,5.15),layout='constrained')
    for ax,letter,title in zip(axs,['A','B'],['Calibrated concentration recovery','Residual after calibration']):
        ax.text(0,.995,letter,transform=ax.transAxes,weight='bold',fontsize=16,va='top',ha='left',bbox=dict(fc='white',ec='none',alpha=.9))
        ax.set_title(title,pad=14,fontsize=12);ax.grid(alpha=.14);ax.set_axisbelow(True);ax.set_xlabel('Prepared concentration (µM)')
    for session,marker,fill in [('Earlier','^',False),('Later','o',True)]:
        for j,ch in enumerate(CHANNELS):
            rows=[r for r in means if r['session']==session and r['channel']==ch]
            x=np.array([r['actual_uM'] for r in rows]); y=np.array([r['predicted_uM'] for r in rows])
            for ax,values in [(axs[0],y),(axs[1],y-x)]:
                ax.scatter(x,values,marker=marker,s=47,facecolor=COLORS[j] if fill else 'white',edgecolor=COLORS[j],linewidth=1.2,zorder=3,alpha=.9)
    axs[0].plot([0,12.4],[0,12.4],ls='--',color='#80919a',lw=1)
    axs[0].set(xlim=(-.3,12.4),ylim=(-.4,13),ylabel='Predicted concentration (µM)')
    axs[1].axhline(0,ls='--',color='#80919a',lw=1);axs[1].set(xlim=(-.3,10.4),ylabel='Prediction − prepared concentration (µM)')
    axs[0].text(.06,.91,'Later uniform: '+f"R² = {stat['Later']['prediction_R2']:.3f}\n"+'Earlier mixed: '+f"R² = {stat['Earlier']['prediction_R2']:.3f}",transform=axs[0].transAxes,fontsize=11.5,va='top',bbox=dict(fc='white',ec='none',alpha=.92))
    from matplotlib.lines import Line2D
    colors=[Line2D([],[],marker='o',color='none',markerfacecolor=c,markeredgecolor=c,label=ch) for c,ch in zip(COLORS,CHANNELS)]
    sessions=[Line2D([],[],marker='^',ls='none',mfc='white',mec='#233845',label='Earlier: unequal-well loading'),Line2D([],[],marker='o',ls='none',color='#233845',label='Later: uniform concentration holdout')]
    axs[0].legend(handles=colors,loc='lower right',ncol=2,frameon=False,fontsize=11.5)
    axs[1].legend(handles=sessions,loc='lower left',frameon=False,fontsize=10.5)
    fig.savefig(out/'concentration-recovery.svg',bbox_inches='tight');fig.savefig(out/'concentration-recovery.png',dpi=160,bbox_inches='tight');plt.close(fig)
    comparison=list(csv.DictReader((out/'simulation_comparison_source.csv').open(encoding='utf-8')))
    fig,axs=plt.subplots(1,3,figsize=(10.8,4.6),layout='constrained');norm=TwoSlopeNorm(vmin=-100,vcenter=0,vmax=100)
    for ax,letter,title,key in zip(axs,['A','B','C'],['SIMULATION\nWell-floor fluorescent layer','SIMULATION\nFluorescent liquid volume','MEASUREMENT\nSingle-well 10 µM controls'],['floor_layer_row_percent','volume_row_percent','measured_row_percent']):
        mat=np.array([float(r[key]) for r in comparison]).reshape(4,4)
        im=ax.imshow(mat,cmap='RdBu_r',norm=norm);ax.text(-.10,1.20,letter,transform=ax.transAxes,weight='bold',fontsize=16,va='top',ha='left')
        ax.set_title(title,fontsize=12,pad=12);ax.set(xticks=range(4),xticklabels=CHANNELS,yticks=range(4),yticklabels=CHANNELS,xlabel='Fluorescent source well',ylabel='Readout channel')
        for i in range(4):
            for j in range(4):ax.text(j,i,f'{mat[i,j]:.1f}',ha='center',va='center',fontsize=11.5,color='white' if abs(mat[i,j])>60 else '#233845')
    fig.colorbar(im,ax=axs,shrink=.84,label='Row-normalized response (%)',ticks=[-100,-50,0,50,100])
    fig.savefig(out/'simulation-and-measurement.svg',bbox_inches='tight');fig.savefig(out/'simulation-and-measurement.png',dpi=160,bbox_inches='tight');plt.close(fig)
    print(json.dumps(summary,indent=2))
if __name__=='__main__':main()
