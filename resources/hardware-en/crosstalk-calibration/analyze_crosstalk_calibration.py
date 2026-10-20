"""Measured cross-talk correction; retained signed diagnostics, not a validated assay.
python analyze_crosstalk_calibration.py --workspace-root <wiki>
"""
from pathlib import Path
import argparse,json,csv,hashlib
import numpy as np
from scipy.optimize import nnls
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from calibration_core import load,Model,writecsv,CHANNELS,COLORS,LEVELS,LAYOUTS

LAMBDAS=[0.,1e-6,1e-5,1e-4,1e-3,1e-2,.1,1.]

def stack(z):return np.r_[np.real(z),np.imag(z)]
def blank(records):return np.mean([r['z'] for r in records if r['group']=='DDW'],axis=0)
def matrix(records):
 b=blank(records);mc=np.array([np.mean([r['z'] for r in records if r['group']==f'D{i}-100C'],axis=0)-b for i in range(1,5)]).T/10
 return b,np.vstack([mc.real,mc.imag]),mc

def solve(m,y,lam=0.,nonnegative=False):
 s=np.linalg.svd(m,compute_uv=False)[0]**2
 if nonnegative:
  return nnls(np.vstack([m,np.sqrt(lam*s)*np.eye(4)]),np.r_[y,np.zeros(4)])[0]
 if lam==0:return np.linalg.lstsq(m,y,rcond=None)[0]
 return np.linalg.solve(m.T@m+lam*s*np.eye(4),m.T@y)

def metric(rows):
 x=np.array([r['actual_uM'] for r in rows]);p=np.array([r['predicted_uM'] for r in rows]);ok=np.isfinite(p);e=p[ok]-x[ok]
 return dict(n=len(rows),n_finite=int(sum(ok)),rmse_uM=float(np.sqrt(np.mean(e**2))),mae_uM=float(np.mean(abs(e))),bias_uM=float(e.mean()),descriptive_R2=float(1-sum(e**2)/sum((x[ok]-x[ok].mean())**2)),negative_estimates=int(sum(p<0)),max_absolute_error_uM=float(max(abs(e))))

def transfer(a,b,excluded=()):
 """Complex affine signal mapping on shared STANDARD means only, before M inversion."""
 ba=blank(a);bb=blank(b);groups={'DDW':0.,'10C':1.,'100C':10.};gs=[g for g,c in groups.items() if c not in excluded]
 za=np.array([np.mean([r['z'] for r in a if r['group']==g],axis=0)-ba for g in gs]);zb=np.array([np.mean([r['z'] for r in b if r['group']==g],axis=0)-bb for g in gs]);coef=[]
 for j in range(4):coef.append(np.linalg.lstsq(np.c_[np.ones(len(gs)),za[:,j]],zb[:,j],rcond=None)[0])
 coef=np.array(coef);return ba,bb,coef[:,0],coef[:,1],gs

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--workspace-root',type=Path,default=Path(__file__).resolve().parents[4]);args=ap.parse_args();root=args.workspace_root;out=Path(__file__).resolve().parent
 a=load(root/'hardware_test');b=load(root/'hardware_test2');extra=load(root/'hardware_test2'/'new_25C');assert(len(a),len(b),len(extra))==(25,30,3)
 controls=[r for r in b if r['group']=='DDW' or r['group'].startswith('D') and '-100C' in r['group']]
 assert len(controls)==15
 cv=[];cv_summary=[]
 for label,lam,nonnegative in [('OLS',0.,False)]+[(f'Ridge {lam:g}',lam,False) for lam in LAMBDAS[1:]]+[('Nonnegative LS',0.,True)]:
  rows=[]
  for held in controls:
   training=[r for r in b if r['record']!=held['record']];bb,m,mc=matrix(training);pred=solve(m,stack(held['z']-bb),lam,nonnegative);truth=np.zeros(4)
   if held['group']!='DDW':truth[int(held['group'][1])-1]=10
   for j,ch in enumerate(CHANNELS):
    row=dict(method=label,relative_penalty=lam,held_group=held['group'],held_record=held['record'],channel=ch,actual_uM=float(truth[j]),predicted_uM=float(pred[j]),residual_uM=float(pred[j]-truth[j]),nonnegative_constraint=nonnegative)
    cv.append(row);rows.append(row)
  cv_summary.append(dict(method=label,relative_penalty=lam,nonnegative_constraint=nonnegative,**metric(rows)))
 signed=[r for r in cv_summary if not r['nonnegative_constraint']];selected=min(signed,key=lambda r:r['rmse_uM']);lam=selected['relative_penalty'];bb,m,mc=matrix(b)
 ba,_,offset,gain,shared=transfer(a,b)
 coefs=[dict(channel=ch,blank_A_I_mV=ba[j].real,blank_A_Q_mV=ba[j].imag,blank_B_I_mV=bb[j].real,blank_B_Q_mV=bb[j].imag,offset_I_mV=offset[j].real,offset_Q_mV=offset[j].imag,gain_real=gain[j].real,gain_imag=gain[j].imag,shared_groups=';'.join(shared)) for j,ch in enumerate(CHANNELS)]
 estimates=[];reads=[]
 for group,truth in LAYOUTS.items():
  rr=[r for r in a if r['group']==group];pp=np.array([solve(m,stack(offset+gain*(r['z']-ba)),lam) for r in rr])
  for j,ch in enumerate(CHANNELS):
   p=float(pp[:,j].mean());estimates.append(dict(calibration_set='A',group=group,channel=ch,actual_uM=float(truth[j]),predicted_uM=p,residual_uM=p-truth[j],n_records=len(rr),technical_sd_uM=float(np.std(pp[:,j],ddof=1)) if len(rr)>1 else '',status='cross-session matrix-shape transfer assumption unvalidated'))
   for r,v in zip(rr,pp[:,j]):reads.append(dict(calibration_set='A',group=group,record=r['record'],channel=ch,actual_uM=float(truth[j]),predicted_uM=float(v)))
 for group,c in [('10C',1.),('50C',5.),('100C',10.)]:
  rr=[r for r in b if r['group']==group];pp=np.array([solve(m,stack(r['z']-bb),lam) for r in rr])
  for j,ch in enumerate(CHANNELS):
   p=float(pp[:,j].mean());estimates.append(dict(calibration_set='B',group=group,channel=ch,actual_uM=c,predicted_uM=p,residual_uM=p-c,n_records=3,technical_sd_uM=float(np.std(pp[:,j],ddof=1)),status='uniform loading held from matrix fit; isolated10 controls calibrate matrix'))
   for r,v in zip(rr,pp[:,j]):reads.append(dict(calibration_set='B',group=group,record=r['record'],channel=ch,actual_uM=c,predicted_uM=float(v)))
 assert len(estimates)==32 and len(reads)==88
 diagnostics=[];uniform_comparison=[];matrix_rows=[]
 for i,ch in enumerate(CHANNELS):
  for j,source in enumerate(CHANNELS):matrix_rows.append(dict(readout=ch,source=source,response_I_mV_per_uM=mc[i,j].real,response_Q_mV_per_uM=mc[i,j].imag))
 for group,c in [('DDW',0.),('10C',1.),('25C',2.5),('50C',5.),('100C',10.),('200C',20.)]:
  zz=np.mean([r['z'] for r in b if r['group']==group],axis=0)-bb
  for name,pred in [('OLS',solve(m,stack(zz))),('Selected signed ridge',solve(m,stack(zz),lam)),('Nonnegative LS',solve(m,stack(zz),0,True))]:
   for j,ch in enumerate(CHANNELS):uniform_comparison.append(dict(method=name,group=group,channel=ch,actual_uM=c,predicted_uM=float(pred[j]),residual_uM=float(pred[j]-c)))
 # No curve is accepted by merely flipping the sign of a failed physical source coordinate.
 families=[];family_folds=[];ys=np.array([solve(m,stack(np.mean([r['z'] for r in b if r['group']==g],axis=0)-bb),lam) for g in LEVELS['B']]);xx=np.array(list(LEVELS['B'].values()))
 for fam in ['linear','quadratic','exponential','power','pchip']:
  rows=[];monotone=True
  for j,ch in enumerate(CHANNELS):
   full=Model(fam,xx,ys[:,j]);monotone &= full.monotonic
   for k in [1,2,3]:
    keep=np.arange(5)!=k;mdl=Model(fam,xx[keep],ys[keep,j]);p=mdl.inverse(ys[k,j]);monotone &= mdl.monotonic
    r=dict(family=fam,channel=ch,actual_uM=float(xx[k]),predicted_uM=float(p),fit_levels_uM=';'.join(str(v) for v in xx[keep]),monotonic=mdl.monotonic,in_range=bool(np.isfinite(p) and 0<=p<=20));rows.append(r);family_folds.append(r)
  families.append(dict(family=fam,increasing_full_and_fold_fits=bool(monotone),valid_in_range=sum(r['in_range'] for r in rows),eligible=bool(monotone and all(r['in_range'] for r in rows)),**metric(rows)))
 # Additivity is assessed at the actual measured 10 uM controls, not fitted away.
 phase=np.diag(mc)/abs(np.diag(mc));actual=np.mean([r['z'] for r in b if r['group']=='100C'],axis=0)-bb;predicted=mc@np.full(4,10.)
 for j,ch in enumerate(CHANNELS):
  one=float(np.real(predicted[j]*np.conj(phase[j])));obs=float(np.real(actual[j]*np.conj(phase[j])));diagnostics.append(dict(channel=ch,sum_isolated10_mV=one,uniform10_measured_mV=obs,uniform_to_additive_ratio=obs/one,complex_discrepancy_mV=float(abs(actual[j]-predicted[j]))))
 transfer_fit=[]
 for group,c in [('DDW',0.),('10C',1.),('100C',10.)]:
  aa=np.mean([r['z'] for r in a if r['group']==group],axis=0)-ba;zz=np.mean([r['z'] for r in b if r['group']==group],axis=0)-bb
  for j,ch in enumerate(CHANNELS):transfer_fit.append(dict(channel=ch,concentration_uM=c,complex_signal_error_mV=float(abs(offset[j]+gain[j]*aa[j]-zz[j])),stage='training anchor residual, not validation'))
 means=[]
 for ch in CHANNELS:
  rr=[r for r in estimates if r['channel']==ch];e=np.array([r['residual_uM'] for r in rr]);means.append(dict(channel=ch,n=len(rr),mean_residual_uM=float(e.mean()),median_residual_uM=float(np.median(e)),min_residual_uM=float(e.min()),max_residual_uM=float(e.max())))
 # A same-loading benchmark before matrix correction, kept separate from its interpretation.
 benchmark=[]
 prior=out.parent/'unified-calibration'/'concentration_checks.csv'
 if prior.exists():
  for r in csv.DictReader(prior.open(encoding='utf-8')):benchmark.append(dict(actual_uM=float(r['actual_uM']),predicted_uM=float(r['predicted_uM'])))
 unif_test=[r for r in uniform_comparison if r['group'] in ['10C','50C','100C']];tests=[]
 for meth in ['OLS','Selected signed ridge','Nonnegative LS']:tests.append(dict(method=meth,**metric([r for r in unif_test if r['method']==meth])))
 manifest=[]
 for r in a+b+extra:
  for key in ['report_file','raw_file']:
   p=Path(r[key]);manifest.append(dict(path=str(p.relative_to(root)),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bytes=p.stat().st_size))
 files={'single_source_cv.csv':cv,'solver_comparison.csv':cv_summary,'measured_complex_matrix.csv':matrix_rows,'transfer_coefficients.csv':coefs,'transfer_anchor_residuals.csv':transfer_fit,'concentration_checks.csv':estimates,'individual_read_checks.csv':reads,'uniform_solver_comparison.csv':uniform_comparison,'uniform_test_summary.csv':tests,'postmatrix_family_comparison.csv':families,'postmatrix_family_holdouts.csv':family_folds,'additivity_check.csv':diagnostics,'channel_residual_means.csv':means,'raw_input_manifest.csv':manifest}
 for name,rows in files.items():writecsv(out/name,rows)
 summary=dict(selected_signed_solver=selected,matrix_condition_number=float(np.linalg.cond(m)),matrix_units='mV per uM in four I rows and four Q rows',matrix_training='same-session DDW and four isolated10 controls only',
  combined_diagnostics=metric(estimates),uniform_loading_diagnostics=tests,channel_residual_means=means,postmatrix_family_comparison=families,additivity=diagnostics,
  benchmark_without_explicit_crosstalk=metric(benchmark) if benchmark else None,raw_acquisitions=58,displayed_means=32,displayed_acquisitions=22,individual_well_read_estimates=88,
  max_raw_reconstruction_error_V=max(r['iq_error_mV'] for r in a+b+extra)/1000,limitations=['Signed matrix estimates are 10 uM-equivalent diagnostics, not validated final concentrations.',
  'Technical holdouts do not establish independent preparation reproducibility. Nonnegative constraints cannot prove that a missing source is absent.',
  'A has no measured four-source matrix; three shared standard means fit a complex affine transfer, and applying B matrix assumes unchanged source-mixing shape.',
  'Uniform10 validation holds out that loading only; isolated-source10 controls remain in matrix calibration.',
  'No postmatrix nonlinear family is adopted when all four channels do not satisfy increasing/in-range validity.',
  'The 2.5 uM recordings and high20 endpoint are retained as diagnostics, not included in the same32-mean comparison.'])
 (out/'summary.json').write_text(json.dumps(summary,indent=2,allow_nan=True),encoding='utf-8');plot(out,estimates,summary,cv_summary,diagnostics)
 print(json.dumps({k:summary[k] for k in ['selected_signed_solver','matrix_condition_number','combined_diagnostics','uniform_loading_diagnostics','postmatrix_family_comparison','channel_residual_means']},indent=2))

def plot(out,rows,summary,solvers,additivity):
 plt.rcParams.update({'font.family':'sans-serif','font.sans-serif':['Arial','DejaVu Sans'],'font.size':12,'axes.spines.top':False,'axes.spines.right':False,'axes.labelcolor':'#233845','text.color':'#233845','svg.fonttype':'none'})
 fig,axs=plt.subplots(1,2,figsize=(11.2,5.2),layout='constrained')
 for ax,letter,title in zip(axs,['A','B'],['After matrix unmixing','Residual distribution by well']):
  ax.text(0,1.02,letter,transform=ax.transAxes,weight='bold',fontsize=16,va='bottom');ax.set_title(title,pad=19,fontsize=12);ax.grid(alpha=.14);ax.set_axisbelow(True)
 for ch,color in zip(CHANNELS,COLORS):
  rr=[r for r in rows if r['channel']==ch];axs[0].scatter([r['actual_uM'] for r in rr],[r['predicted_uM'] for r in rr],color=color,s=45,alpha=.85,edgecolor='white',lw=.55,label=ch,zorder=3)
 vals=[np.array([r['residual_uM'] for r in rows if r['channel']==ch]) for ch in CHANNELS]
 violin=axs[1].violinplot(vals,positions=range(1,5),widths=.75,showextrema=False,bw_method=.45)
 for i,body in enumerate(violin['bodies']):body.set_facecolor(COLORS[i]);body.set_edgecolor(COLORS[i]);body.set_alpha(.23)
 for i,(v,c) in enumerate(zip(vals,COLORS),1):
  # Deterministic sideways offsets only; vertical data values are untouched.
  offsets=np.linspace(-.14,.14,len(v));axs[1].scatter(i+offsets,v,color=c,s=35,edgecolor='white',lw=.55,zorder=3)
  mean=float(np.mean(v));axs[1].plot([i-.22,i+.22],[mean,mean],color=c,lw=2.6,zorder=4);axs[1].annotate(f'Mean {mean:+.2f}',(i,mean),xytext=(0,9),textcoords='offset points',ha='center',fontsize=10.5,weight='bold',bbox=dict(fc='white',ec='none',alpha=.85))
 xx=[r['actual_uM'] for r in rows];yy=[r['predicted_uM'] for r in rows];lo=min(-.5,min(yy)-1);hi=max(12,max(yy)+1)
 axs[0].plot([lo,hi],[lo,hi],ls='--',color='#80919a',lw=1);axs[0].set(xlim=(-.4,11),ylim=(lo,hi),xlabel='Prepared concentration (µM)',ylabel='10 µM-equivalent estimate (µM)')
 met=summary['combined_diagnostics'];axs[0].text(.055,.95,f"Descriptive R² = {met['descriptive_R2']:.3f}\nRMSE = {met['rmse_uM']:.2f} µM",transform=axs[0].transAxes,va='top',bbox=dict(fc='white',ec='none',alpha=.94));axs[0].legend(loc='lower right',ncol=2,frameon=False)
 axs[1].axhline(0,ls='--',color='#80919a',lw=1);axs[1].set(xticks=range(1,5),xticklabels=CHANNELS,ylabel='Estimate − prepared concentration (µM)',xlabel='Source well')
 fig.savefig(out/'crosstalk-concentration-check.svg',bbox_inches='tight');fig.savefig(out/'crosstalk-concentration-check.png',dpi=180,bbox_inches='tight');plt.close(fig)
 fig,axs=plt.subplots(1,2,figsize=(11.2,5.2),layout='constrained');sel=summary['selected_signed_solver'];sr=[next(r for r in solvers if r['method']=='OLS'),sel,next(r for r in solvers if r['method']=='Nonnegative LS')]
 for ax,letter,title in zip(axs,['A','B'],['Technical control checks','Does the source matrix add up?']):
  ax.text(0,1.02,letter,transform=ax.transAxes,weight='bold',fontsize=16,va='bottom');ax.set_title(title,pad=19,fontsize=12);ax.grid(axis='y',alpha=.14);ax.set_axisbelow(True)
 bars=axs[0].bar(range(3),[r['rmse_uM'] for r in sr],color=['#8daab9','#276c83','#cab6a7'],width=.58)
 for b,r in zip(bars,sr):axs[0].text(b.get_x()+b.get_width()/2,b.get_height()+.01,f"{r['rmse_uM']:.3f}",ha='center',weight='bold')
 axs[0].set(xticks=range(3),xticklabels=['Unregularized','Signed ridge','Nonnegative LS'],ylabel='Single-source / blank holdout RMSE (µM)',ylim=(0,max(r['rmse_uM'] for r in sr)*1.25))
 x=np.arange(4);axs[1].bar(x-.18,[r['sum_isolated10_mV'] for r in additivity],width=.36,color='#8daab9',label='Sum of isolated 10 µM controls');axs[1].bar(x+.18,[r['uniform10_measured_mV'] for r in additivity],width=.36,color='#276c83',label='Measured all-well 10 µM')
 axs[1].set(xticks=x,xticklabels=CHANNELS,ylabel='Signed response (mV)');axs[1].legend(frameon=False,fontsize=9.5,loc='upper left')
 fig.savefig(out/'crosstalk-method-check.svg',bbox_inches='tight');fig.savefig(out/'crosstalk-method-check.png',dpi=180,bbox_inches='tight');plt.close(fig)

if __name__=='__main__':main()
