"""Synthetic code-path test only; generates no biological-performance claim."""
from pathlib import Path
import csv,tempfile,sys,json
import numpy as np
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'analysis'))
from odor_model import train,predict
def main():
 with tempfile.TemporaryDirectory() as tmp:
  p=Path(tmp);f=p/'synthetic.csv';rng=np.random.default_rng(99)
  with f.open('w',newline='') as fp:
   w=csv.writer(fp);w.writerow(['sample_id','group','label','D1','D2','D3','D4'])
   for g in range(3):
    for k in range(12):w.writerow([f'{g}-{k}',f'batch{g}',f'class{k%2}',*(rng.normal(0,.1,4)+(k%2))])
  r=train(f,['batch2'],p/'model',epochs=100)
  model=json.loads((p/'model/model.json').read_text())
  assert model['train_groups']==['batch0','batch1'] and model['holdout_groups']==['batch2']
  assert model['validated_for_odor_claims'] is False
  assert predict(model,[100]*4)['status']=='out_of_distribution'
  out=predict(model,[0]*4);assert abs(sum(out['probabilities'].values())-1)<1e-12
  try:predict(model,[float('nan')]*4);raise AssertionError('NaN accepted')
  except ValueError:pass
  result={'passed':True,'checks':4,'data':'synthetic only','biological_model_delivered':False,'checks_description':['held-out groups excluded from training','out-of-distribution rejection','finite probability sum','NaN rejected']}
  dest=ROOT.parent/'validation';dest.mkdir(exist_ok=True);(dest/'model_code_tests.json').write_text(json.dumps(result,indent=2));print(result)
if __name__=='__main__':main()
