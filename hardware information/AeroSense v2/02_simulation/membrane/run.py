"""Run all molecular-transport screening calculations; deterministic, no fitting.
python run.py [--plots]
Only numpy and Pillow are required. Results are screening assumptions, not
material data or proof of living-cell response. No CAD/STL/BOM is modified.
"""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
from pathlib import Path
import argparse,csv,json,hashlib,sys
import numpy as np
from model import Layer,Diffusion,well,slab_bottom,root_slab
HERE=Path(__file__).resolve().parent;OUT=HERE/'results';OUT.mkdir(exist_ok=True)

def save(name,rows):
    with (OUT/(name+'.csv')).open('w',newline='',encoding='utf-8-sig') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
def times(m):return {f't{int(f*100)}_s':m.time_to(f) for f in [.1,.5,.9]}

def verify():
    rows=[]
    for n in [16,32,64,128]:
        L=100e-6;D=1e-10;K=100
        m=Diffusion([Layer('PDMS',L,D,K,n)],sink=True)
        t=np.geomspace(.001,8*L*L/D,240)
        Jss=D*K/L;lag=t[-1]-m.gn*m.integral([t[-1]])[0,-1]/Jss
        exact=L*L/(6*D)
        liquid=Diffusion([Layer('liquid',100/11.2*1e-3,1e-9,1,n)])
        t90=liquid.time_to(.9);t90_exact=root_slab(.9)*(100/11.2*1e-3)**2/1e-9
        gridt=np.geomspace(1,3e5,150)
        err=np.max(abs(liquid.response(gridt)[:,-1]-slab_bottom(gridt,100/11.2*1e-3,1e-9)))
        rows.append(dict(cells=n,membrane_lag_s=lag,analytic_lag_s=exact,lag_relative_error=abs(lag/exact-1),
                         liquid_t90_s=t90,analytic_t90_s=t90_exact,liquid_t90_relative_error=abs(t90/t90_exact-1),
                         liquid_max_absolute_step_error=float(err),mass_balance_relative=m.mass_balance(t)))
    # Full multilayer + finite supply: conservation and spatial convergence.
    coupled=[]
    for n in [24,48,96]:
        m=well(n=n,thickness_um=100,feed_Q=1)
        t=np.geomspace(.001,7*86400,180);u=m.response(t)
        coupled.append(dict(liquid_cells=n,**times(m),mass_balance_relative=m.mass_balance(t),
                            min_u=float(u.min()),max_u=float(u.max())))
    assert rows[-1]['lag_relative_error']<2e-4
    assert rows[-1]['liquid_t90_relative_error']<2e-4
    assert max(r['mass_balance_relative'] for r in rows+coupled)<1e-5
    assert abs(coupled[-1]['t90_s']/coupled[-2]['t90_s']-1)<.005
    # Independent forcing recurrence must recover the built-in step response.
    forced_model=well(thickness_um=100)
    forced_t=np.r_[0.,np.geomspace(.001,7*86400,250)]
    forcing_error=float(np.max(np.abs(forced_model.forced(forced_t,np.ones_like(forced_t))-forced_model.response(forced_t))))
    assert forcing_error<1e-7
    save('numerical_validation',rows);save('coupled_convergence',coupled)
    return {'passed':True,'slab_and_time_lag':rows,'coupled':coupled,
            'prescribed_constant_step_max_absolute_error':forcing_error,
            'spatial_scheme':'harmonic-face conservative finite volume; exact matrix exponential in time',
            'no_cell_consumption':True,'horizon_s':7*86400}

def main():
    p=argparse.ArgumentParser();p.add_argument('--plots',action='store_true');a=p.parse_args()
    validation=verify();(OUT/'validation.json').write_text(json.dumps(validation,indent=2))
    coeff={str(f):root_slab(f) for f in [.1,.5,.9]}
    depth=[]
    for volume in [10,25,50,75,100,125]:
        for D in [0.5e-9,1e-9,2e-9]:
            L=volume/11.2*1e-3
            depth.append(dict(liquid_uL=volume,depth_mm=L*1e3,D_liquid_m2_s=D,**{f't{int(float(f)*100)}_s':v*L*L/D for f,v in coeff.items()}))
    save('liquid_depth_sweep',depth)
    # 5 thicknesses x 4 diffusivities x 4 partitions x 3 liquid partitions.
    sweep=[]
    for Kl in [.1,10,1000]:
        for L in [0,25,50,100,250,500]:
            for D in ([1e-10] if L==0 else [1e-12,1e-11,1e-10,1e-9]):
                for K in ([100] if L==0 else [1,10,100,1000]):
                    m=well(thickness_um=L,Dm=D,Km=K,Kl=Kl)
                    check_t=np.geomspace(.01,7*86400,18);check_u=m.response(check_t);balance=m.mass_balance(check_t)
                    assert balance<1e-4 and check_u.min()>-1e-7 and check_u.max()<1+1e-7
                    sweep.append(dict(thickness_um=L,D_PDMS_m2_s=D if L else '',K_PDMS_gas=K if L else '',K_liquid_gas=Kl,
                                      concentration_permeability_m2_s=D*K if L else '',permeance_m_s=D*K/(L*1e-6) if L else '',
                                      bulk_lag_s=(L*1e-6)**2/(6*D) if L else 0,mass_balance_relative=balance,min_u=float(check_u.min()),max_u=float(check_u.max()),**times(m)))
    save('membrane_sweep',sweep)
    sensitivity=[]
    for mode in ['stagnant','effective_D_x10','effective_D_x100']:
        mult={'stagnant':1,'effective_D_x10':10,'effective_D_x100':100}[mode]
        for Kl in [.1,10,1000]:
            for L in [0,100,500]:
                for Q in [None,.1,1,10]:
                    m=well(thickness_um=L,Kl=Kl,Dl=1e-9*mult,feed_Q=Q)
                    sensitivity.append(dict(liquid_transport=mode,K_liquid_gas=Kl,thickness_um=L,feed_mL_min='ideal_step' if Q is None else Q,**times(m)))
    save('mixing_feed_sensitivity',sensitivity)
    surface=[]
    for L in [25,50,100,250,500]:
        for h in [float('inf'),1e-6,1e-5,1e-4,1e-3]:
            m=well(thickness_um=L,h=h)
            surface.append(dict(thickness_um=L,gas_equivalent_surface_h_m_s='ideal_interface' if not np.isfinite(h) else h,**times(m)))
    save('surface_resistance_sensitivity',surface)
    # A gas step can cross a stagnant headspace: velocity is deliberately zero.
    gas=Diffusion([Layer('gas',3.571428571e-3,1e-5,1,96)])
    gas_times=times(gas)
    t=np.r_[0,np.geomspace(.001,7*86400,550)]
    cases={'no_membrane':{},'PDMS_100um_nominal':{'thickness_um':100},
           'PDMS_500um_slow':{'thickness_um':500,'Dm':1e-12,'Km':1},
           'PDMS_100um_storage':{'thickness_um':100,'Km':1000},
           'PDMS_100um_feed1':{'thickness_um':100,'feed_Q':1}}
    hist=[];pulse=[];pulse_duration=1200;summary_cases=[]
    for name,cfg in cases.items():
        m=well(**cfg);u=m.response(t);late=m.response(np.maximum(0,t-pulse_duration));v=u-late*(t[:,None]>=pulse_duration)
        mask=np.array(m.names)=='PDMS';stored=v[:,mask]@m.M[mask] if mask.any() else np.zeros(len(t))
        summary_cases.append(dict(case=name,**times(m),pulse_peak_at_s=float(t[np.argmax(v[:,-1])]),pulse_peak_fraction=float(v[:,-1].max()),mass_balance_relative=m.mass_balance(t)))
        for k,x in enumerate(t):
            hist.append(dict(case=name,time_s=x,bottom_fraction=u[k,-1]))
            pulse.append(dict(case=name,time_s=x,bottom_fraction=v[k,-1],PDMS_stored_per_Cgas_m=stored[k]))
    save('step_histories',hist);save('pulse_histories',pulse);save('case_summary',summary_cases)
    # Oxygen capacity: published PDMS P at293K; liquid values ASSUMED here.
    # Zero bottom concentration is the maximum stationary supply, not viability.
    R=8.314462618;T=293.;P=2.8e-13;Doxygen=3.1e-9;Koxygen=P*R*T/Doxygen
    pO2=.21*101325;Cgas=pO2/(R*T);Csat=.30;KlO=Csat/Cgas;A=11.2e-6
    oxygen=[]
    for volume in [10,25,50,100]:
        Lliq=volume/11.2*1e-3;Lg=(12.5-volume/11.2)*1e-3
        for film in [0,25,50,100,250,500]:
            resist=Lg/(1e-5)+Lliq/(2e-9*KlO)+(film*1e-6/(Doxygen*Koxygen))
            capacity=A*Cgas/resist
            for load in [.01,.1,.5,1,5]:
                frac=1-load*1e-12/capacity
                oxygen.append(dict(liquid_uL=volume,PDMS_um=film,max_supply_pmol_s=capacity*1e12,
                                   assumed_demand_pmol_s=load,constant_load_bottom_fraction=frac if frac>=0 else '',demand_exceeds_capacity=frac<0))
    save('oxygen_capacity',oxygen)
    intrinsic=[]
    for L in [25,50,100,250,500]:
        for D in [1e-12,1e-11,1e-10,1e-9]:
            for K in [1,10,100,1000]:
                intrinsic.append(dict(thickness_um=L,D_PDMS_m2_s=D,K_PDMS_gas=K,permeability_m2_s=D*K,
                                      pressure_permeability_mol_m_s_Pa=D*K/(R*T),permeance_m_s=D*K/(L*1e-6),lag_s=(L*1e-6)**2/(6*D)))
    save('intrinsic_properties',intrinsic)
    # Dilute linear selectivity is a flux ratio under a maintained sink, not a
    # permanent downstream composition filter in a closed equilibrated well.
    sel=[]
    for Dratio in [.01,.1,1,10,100]:
        for Kratio in [.01,.1,1,10,100]:
            sel.append(dict(D_A_over_B=Dratio,K_A_over_B=Kratio,intrinsic_flux_selectivity=Dratio*Kratio,equilibrium_gas_ratio_change=1))
    save('selectivity_sensitivity',sel)
    summary={'evidence_type':'assumption-based 1D transport screening, not measured membrane or cell data',
             'liquid_geometry_confirmed_by_user':'HEK293T adherent to bottom;100 uL in4x2.8mm',
             'exact_bottom_time_coefficients_L2_over_D':coeff,'stagnant_gas_3p571mm_D1e_5':gas_times,
             '100uL_analytic_liquid':[r for r in depth if r['liquid_uL']==100],
             'screening_cases':len(sweep),'censored_t90_cases':sum(r['t90_s'] is None for r in sweep),
             'sensitivity_cases':len(sensitivity),'surface_cases':len(surface),'cases':summary_cases,
             'sweep_max_mass_balance_relative':max(r['mass_balance_relative'] for r in sweep),
             'oxygen_inputs':{'temperature_K':T,'PDMS_P_mol_m_s_Pa':P,'PDMS_D_m2_s':Doxygen,'PDMS_source':'https://www.mdpi.com/2073-4360/11/5/910',
                              'water_D_ASSUMED_m2_s':2e-9,'surface_water_O2_ASSUMED_mol_m3':Csat,'pO2_assumed_Pa':pO2},
             'water_vapor':'No drying-rate prediction: species sorption/permeability,RH,temperature and external mass-transfer resistance not measured.',
             'concentration_dependence':'Linear dilute model; normalized histories independent of input concentration. No empirical saturation/crosslink law supplied.',
             'CAD_change':False,'BOM_change':False,'numerical_validation_passed':validation['passed'],
             'code_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [HERE/'model.py',HERE/'run.py']}}
    (OUT/'summary.json').write_text(json.dumps(summary,indent=2))
    print(json.dumps({'passed':True,'screening_cases':len(sweep),'censored_t90':summary['censored_t90_cases'],'100uL':summary['100uL_analytic_liquid'],'gas_times':gas_times},indent=2))
    if a.plots:
        import plot;plot.main()
if __name__=='__main__':main()
