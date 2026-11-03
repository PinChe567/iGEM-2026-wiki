"""Small numpy MLP, grouped holdout, no pre-trained biological model supplied.
CSV: sample_id,group,label,D1,D2,D3,D4 ; features are predeclared deltaF/F0.
python odor_model.py train data.csv --holdout batch3 --out trained_model
Groups must separate independent cell batch/day/device, not windows of one run.
"""
from pathlib import Path
import numpy as np,json,csv,argparse,hashlib
def predict(model,x):
 x=np.asarray(x,float)
 if x.shape!=(4,) or not np.all(np.isfinite(x)):raise ValueError('four_finite_features_required')
 z=(x-np.array(model['mean']))/np.array(model['scale'])
 if np.any(np.abs(z)>5):return {'status':'out_of_distribution','probabilities':None}
 h=np.tanh(z@np.array(model['W1'])+np.array(model['b1']));a=h@np.array(model['W2'])+np.array(model['b2']);p=np.exp(a-a.max());p/=p.sum()
 return dict(status='research_model_not_independently_validated',label=model['labels'][int(p.argmax())],probabilities=dict(zip(model['labels'],p.tolist())),model_id=model['id'],note='Softmax probabilities are uncalibrated; no clinical or universal odor claim')
def train(file,holdout,out,epochs=1500):
 rows=list(csv.DictReader(Path(file).open(encoding='utf-8-sig')))
 if len({r['sample_id'] for r in rows})!=len(rows):raise ValueError('Duplicate sample_id')
 X=np.array([[float(r['D'+str(j)]) for j in range(1,5)] for r in rows]);groups=np.array([r['group'] for r in rows]);labels=sorted(set(r['label'] for r in rows));y=np.array([labels.index(r['label']) for r in rows]);test=np.isin(groups,holdout);tr=~test
 if len(set(groups))<3 or test.sum()<2 or tr.sum()<8 or len(labels)<2:raise ValueError('Need >=3 independent groups, >=8 training and >=2 holdout observations, >=2 labels')
 if len(set(y[tr]))!=len(labels):raise ValueError('Training set lacks a class')
 if not np.all(np.isfinite(X)):raise ValueError('Nonfinite data')
 mu=X[tr].mean(0);sd=X[tr].std(0);sd[sd<1e-8]=1;A=(X[tr]-mu)/sd;Y=np.eye(len(labels))[y[tr]];rng=np.random.default_rng(926);
 w1=rng.normal(0,.25,(4,8));b1=np.zeros(8);w2=rng.normal(0,.25,(8,len(labels)));b2=np.zeros(len(labels));loss=[]
 for step in range(epochs):
  h=np.tanh(A@w1+b1);v=h@w2+b2;p=np.exp(v-v.max(1,keepdims=True));p/=p.sum(1,keepdims=True);loss.append(float(-np.mean(np.log(np.maximum(p[np.arange(len(A)),y[tr]],1e-12)))))
  g=(p-Y)/len(A);dh=(g@w2.T)*(1-h*h);w2-=.03*(h.T@g+.001*w2);b2-=.03*g.sum(0);w1-=.03*(A.T@dh+.001*w1);b1-=.03*dh.sum(0)
 model=dict(id=hashlib.sha256(Path(file).read_bytes()).hexdigest()[:16],feature_kind='deltaFOverF0_LED_channels',labels=labels,mean=mu.tolist(),scale=sd.tolist(),W1=w1.tolist(),b1=b1.tolist(),W2=w2.tolist(),b2=b2.tolist(),train_groups=sorted(set(groups[tr])),holdout_groups=sorted(set(groups[test])),validated_for_odor_claims=False,seed=926)
 logits=np.tanh(((X[test]-mu)/sd)@w1+b1)@w2+b2;pred=logits.argmax(1);cm=np.zeros((len(labels),len(labels)),int)
 for a,b in zip(y[test],pred):cm[a,b]+=1
 report=dict(holdout_accuracy=float(np.mean(pred==y[test])),holdout_n=int(test.sum()),train_n=int(tr.sum()),labels=labels,confusion_matrix=cm.tolist(),train_groups=model['train_groups'],holdout_groups=model['holdout_groups'],note='Single predeclared grouped holdout. No hyperparameter selection on holdout. Independent prospective validation remains required.')
 out=Path(out);out.mkdir(parents=True,exist_ok=True);(out/'model.json').write_text(json.dumps(model,indent=2));(out/'evaluation.json').write_text(json.dumps(report,indent=2));np.savetxt(out/'training_loss.csv',np.column_stack([np.arange(epochs),loss]),delimiter=',',header='epoch,training_cross_entropy',comments='');return report
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('command',choices=['train']);p.add_argument('csv');p.add_argument('--holdout',nargs='+',required=True);p.add_argument('--out',default='trained_model');a=p.parse_args();print(train(a.csv,a.holdout,a.out))
