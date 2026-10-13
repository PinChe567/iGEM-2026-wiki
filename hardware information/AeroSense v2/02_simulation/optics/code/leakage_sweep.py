"""Additional four-LED excitation-rejection MC; preserves the original 24 cases."""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
from pathlib import Path
import json,argparse,concurrent.futures
import numpy as np
import run
NAMES=['NE','NW','SW','SE']
def one(job):
 od,j=job;name=f'leakage_OD{od}_{NAMES[j]}'
 run.CASES[name]=dict(led=j,filter_T_ex=10.**(-od),filter_T_em=.9)
 return run.run_case(name)
def summarize():
 rows=[]
 for od in [3,4,5]:
  for j,q in enumerate(NAMES):
   a=json.loads((run.OUT/f'leakage_OD{od}_{q}.json').read_text());v=a['runs'];blue=np.array([r['blue']['power_nW'] for r in v]);green=np.array([r['green']['power_nW'] for r in v]);ref=np.array([r['blue']['power_nW']*r['blue']['fraction_with_Fresnel_reflection'] for r in v])
   rows.append(dict(OD=od,channel=q,blue_nW=float(blue.mean()),blue_SE_nW=float(blue.std(ddof=1)/np.sqrt(3)),reflected_blue_nW=float(ref.mean()),green_nW=float(green.mean()),green_SE_nW=float(green.std(ddof=1)/np.sqrt(3)),blue_detected_packets=[r['blue']['detected_packets'] for r in v],max_energy_error=max(abs(r[k]['ledger']['sum']-1) for r in v for k in ['green','blue'])))
 summary=dict(cases=rows,LED_order=NAMES,additional_MC_cases=12,replicates=3,N_ex=24000,N_em=60000,additional_primary_packets=12*3*84000,assumptions='Same frozen geometry, absorptive filter proxy. Emission normal transmittance 0.9 is held constant for all ODs. Existing 24-case results unchanged.',max_energy_error=max(r['max_energy_error'] for r in rows))
 (run.OUT/'leakage_MC_summary.json').write_text(json.dumps(summary,indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--workers',type=int,default=2);p.add_argument('--summarize-only',action='store_true');a=p.parse_args()
 if not a.summarize_only:
  with concurrent.futures.ProcessPoolExecutor(max_workers=a.workers) as pool:list(pool.map(one,[(od,j) for od in [3,4,5] for j in range(4)]))
 summarize()
