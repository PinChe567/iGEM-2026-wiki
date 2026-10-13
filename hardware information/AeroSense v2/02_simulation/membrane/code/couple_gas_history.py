"""Prescribe a measured/CFD well-rim gas history, without two-way feedback.
python couple_gas_history.py --csv PATH --time time_s --column well_NE_rim_C
Do not feed headspace or near-liquid averages: that repeats the modeled gas
layer. Output is 1D bottom concentration, not receptor/GCaMP response.
"""
from pathlib import Path
import argparse,csv,json,hashlib
import numpy as np
from model import well
p=argparse.ArgumentParser();p.add_argument('--csv',required=True);p.add_argument('--time',default='time_s');p.add_argument('--column',required=True)
p.add_argument('--PDMS-um',type=float,default=0);p.add_argument('--D-PDMS',type=float,default=1e-10);p.add_argument('--K-PDMS',type=float,default=100)
p.add_argument('--D-liquid',type=float,default=1e-9);p.add_argument('--K-liquid',type=float,default=10);p.add_argument('--out',default=None);a=p.parse_args()
source=Path(a.csv);rs=list(csv.DictReader(source.open(encoding='utf-8-sig')))
t=np.array([float(r[a.time]) for r in rs]);c=np.array([float(r[a.column]) for r in rs])
m=well(thickness_um=a.PDMS_um,Dm=a.D_PDMS,Km=a.K_PDMS,Dl=a.D_liquid,Kl=a.K_liquid)
u=m.forced(t,c);out=Path(a.out) if a.out else Path(__file__).resolve().parent.parent/'results'/'prescribed_rim_response.csv'
out.parent.mkdir(parents=True,exist_ok=True)
with out.open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.writer(f);w.writerow(['time_s','rim_C_over_Cref','bottom_liquid_C_over_Kliquid_Cref']);w.writerows(zip(t,c,u[:,-1]))
(Path(__file__).resolve().parent/'data'/(out.stem+'.json')).write_text(json.dumps({'source':str(source.name),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
 'input_column':a.column,'PDMS_um':a.PDMS_um,'D_PDMS':a.D_PDMS,'K_PDMS':a.K_PDMS,'D_liquid':a.D_liquid,'K_liquid':a.K_liquid,
 'scope':'Prescribed rim concentration, one-way uncoupled screening. Gas CFD without absorption is not recomputed after membrane/liquid uptake.',
 'bottom_unit':'C_liquid/(K_liquid*C_gas_reference)','no_biological_response_model':True},indent=2))
print(out)
