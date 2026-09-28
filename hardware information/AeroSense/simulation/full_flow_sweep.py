"""Full 3x3x3 factorial CFD, not a resistance surrogate. Resume-safe per-case fields.
python full_flow_sweep.py --workers 2 --engine csharp
"""
import itertools,concurrent.futures,argparse,json
from pathlib import Path
import flow_sweep as fs
NAMES=[]
for d,(nx,ny),gap in itertools.product([1.6,2.,2.4],[(2,2),(3,2),(4,3)],[1.5,3.,4.5]):
 cfg=dict(d=d,nx=nx,ny=ny,gap=gap,plate=True);old=next((n for n,c in fs.CASES.items() if c==cfg),None)
 name=old or f'd{d:g}_n{nx*ny}_h{gap:g}'.replace('.','p');fs.CASES[name]=cfg;NAMES.append(name)
def job(name,engine):
 warm=fs.HERE/'flow/base_dx0.4_field.npz'
 return fs.solve(name,.4,engine,60000,warm_grid=warm if warm.exists() else None)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--workers',type=int,default=2);p.add_argument('--engine',default='numpy',choices=['numpy','csharp']);a=p.parse_args()
 fs.solve('base',.4,a.engine,60000)
 fs.solve('no_plate',.4,a.engine,60000)
 with concurrent.futures.ProcessPoolExecutor(a.workers) as ex:
  jobs=[ex.submit(job,n,a.engine) for n in NAMES]
  for f in concurrent.futures.as_completed(jobs):
   r=f.result()
   if not r['converged']:raise RuntimeError('Case failed declared convergence: '+r['case'])
 (fs.HERE/'full_factorial_design.json').write_text(json.dumps({n:fs.CASES[n] for n in NAMES},indent=2))
