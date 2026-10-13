"""Execute prescribed CFD-rim forcing, with explicitly conditional continuations.

python integrate_airflow.py
This is one-way coupling. Upstream gas CFD has zero liquid uptake and is NOT
rerun after a membrane/liquid sink is added. No hours-long CFD is fabricated.
"""
from pathlib import Path
import argparse,csv,json,hashlib
import numpy as np
from model import well

HERE=Path(__file__).resolve().parent
DEFAULT=HERE.parent.parent/'airflow/results/gas_transport_results/shelf_w8_e0p2_D10_dx0.4_dt0.5.csv'

def save(path,rows):
    with path.open('w',newline='',encoding='utf-8-sig') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)

def continuation(model,initial,c):
    coefficients=model.V.T@(model.root*(initial-c*model.steady))
    def bottom(elapsed):
        return float(c*model.steady[-1]+np.dot(np.exp(elapsed*model.eigenvalues)*coefficients,model.V[-1])/model.root[-1])
    return bottom

def crossing(bottom,fraction,start,horizon=7*86400):
    if bottom(horizon-start)<fraction:return None
    lo=0.;hi=horizon-start
    for _ in range(60):
        mid=(hi+lo)/2
        if bottom(mid)<fraction:lo=mid
        else:hi=mid
    return start+(lo+hi)/2

def main():
    p=argparse.ArgumentParser();p.add_argument('--csv',type=Path,default=DEFAULT);p.add_argument('--column',default='NE_rim');a=p.parse_args()
    rs=list(csv.DictReader(a.csv.open(encoding='utf-8-sig')))
    t=np.array([float(r['time_s']) for r in rs]);c=np.array([float(r[a.column]) for r in rs])
    if np.any(np.diff(c)<-1e-9) or not 0<c[-1]<1.000001:raise ValueError('Continuation bounds require a nondecreasing normalized inlet-step history in [0,1]')
    metadata=HERE.parent.parent/'airflow/code/data/gas_transport_results'/a.csv.with_suffix('.json').name
    meta=json.loads(metadata.read_text())
    end=float(t[-1]);out=HERE.parent/'results';out.mkdir(exist_ok=True)
    actual=[];tails=[];cases=[];continuation_check_errors=[]
    for label,film in [('no_membrane',0),('PDMS_100um_nominal',100)]:
        m=well(thickness_um=film);state=m.forced(t,c);terminal=state[-1]
        test_tail=continuation(m,m.response([end])[0],1.)
        test_error=max(abs(test_tail(dt)-m.scalar(end+dt)) for dt in [0,1,100,1e4,1e5])
        assert test_error<1e-8
        continuation_check_errors.append(test_error)
        for ti,ci,ui in zip(t,c,state[:,-1]):actual.append({'case':label,'time_s':ti,'rim_C_over_Cinlet':ci,'bottom_C_over_Kliquid_Cinlet':ui})
        case={'case':label,'PDMS_um':film,'bottom_fraction_at_CFD_end_raw':float(state[-1,-1]),
              'bottom_fraction_reporting_floor':1e-10,'bottom_below_reporting_floor':bool(abs(state[-1,-1])<1e-10),
              'ideal_rim_step':{f't{int(f*100)}_s':m.time_to(f) for f in [.1,.5,.9]},'conditional_continuations':{}}
        for scenario,level in [('hold_final_CFD_rim',float(c[-1])),('instant_rim_step_to_one',1.)]:
            bottom=continuation(m,terminal,level)
            tt=np.r_[end,end+np.geomspace(.001,7*86400-end,450)]
            for ti in tt:tails.append({'case':label,'continuation_ASSUMPTION':scenario,'time_s':ti,'prescribed_rim_after_CFD':level,'bottom_C_over_Kliquid_Cinlet':bottom(ti-end)})
            vals={f't{int(f*100)}_s':crossing(bottom,f,end) for f in [.1,.5,.9]}
            vals['added_t90_vs_ideal_rim_step_s']=vals['t90_s']-case['ideal_rim_step']['t90_s'] if vals['t90_s'] is not None else None
            vals['future_rim_C_over_Cinlet']=level
            case['conditional_continuations'][scenario]=vals
        assert case['conditional_continuations']['instant_rim_step_to_one']['t90_s']<=case['conditional_continuations']['hold_final_CFD_rim']['t90_s']
        cases.append(case)
    save(out/'CFD_rim_supplied_history.csv',actual)
    save(out/'CFD_rim_conditional_continuations.csv',tails)
    summary={'evidence':'Executed one-way CFD-rim forcing; no feedback to upstream gas CFD.',
             'source_relative_to_membrane':'../airflow/results/gas_transport_results/'+a.csv.name,
             'source_sha256':hashlib.sha256(a.csv.read_bytes()).hexdigest(),
             'source_metadata_sha256':hashlib.sha256(metadata.read_bytes()).hexdigest(),
             'source_column':a.column,'CFD_time_end_s':end,'CFD_last_rim_fraction':float(c[-1]),
             'CFD_rim_t50_s':meta['t50_s'][a.column],'CFD_rim_t90_s':meta['t90_s'][a.column],
             'CFD_upstream_deficit_integral_to_end_s':float(np.trapezoid(1-c,t)),
             'rim_sampling':meta['sampling'][a.column.split('_')[0]],
             'sampling_limit':'Nearest gas cell plane is used as a well-rim boundary proxy; 1D model retains nominal full headspace depth.',
             'assumptions':{'liquid_uL':100,'D_liquid_m2_s':1e-9,'K_liquid_gas':10,'D_PDMS_m2_s':1e-10,'K_PDMS_gas':100,'no_liquid_mixing_consumption_binding':True},
             'continuation_limit':'After source end, two assumed constant rim values bound histories only if the future rim remains between its last value and 1. These are not CFD predictions.',
             'physical_coupled_mass_conservation_validated':False,
             'continuation_numerical_check':{'passed':True,'constant_step_reconstruction_max_absolute_error':max(continuation_check_errors),'t90_bound_order_checked':True},
             'no_biological_response_or_actual_exposure_validation':True,
             'cases':cases,'code_sha256':{n:hashlib.sha256((HERE/n).read_bytes()).hexdigest() for n in ['model.py','integrate_airflow.py']}}
    (HERE/'data'/'CFD_rim_coupling_summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    print(json.dumps(summary,indent=2))

if __name__=='__main__':main()
