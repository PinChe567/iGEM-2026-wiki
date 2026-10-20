"""Raw I/Q reconstruction and scalar candidate helpers for the measured-matrix audit."""
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

