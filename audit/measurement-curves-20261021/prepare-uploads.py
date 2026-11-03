"""Stage only frozen analysis assets, using content-specific upload names."""
from pathlib import Path
import argparse, datetime, hashlib, json, shutil

A=Path(__file__).resolve().parent; R=A.parents[2]
parser=argparse.ArgumentParser(); parser.add_argument('batch',choices=['odor','pattern']);args=parser.parse_args()
sets={
 'odor':('odor-complete-curves-2026-10-21',[
  'figures/odor-complete-timecourses.svg','derived/raw-curves.csv',
  'derived/test2-vuaa1-referenced-curves.csv','derived/test2-endpoint-audit.csv',
  'derived/test1-peak-metric-audit.csv','source-manifest.json']),
 'pattern':('hardware-wetlab-pattern-comparison-2026-10-21',[
  'figures/matched-curves.svg','figures/matched-curves-mobile.svg',
  'figures/pairwise-correlations.svg','figures/pairwise-correlations-mobile.svg',
  'input-observations.csv','aligned-timepoints.csv','all-pair-correlations.csv',
  'matched-correlations.csv','specificity-summary.csv','descriptive-linear-trends.csv','analysis-summary.json'])
}
folder,names=sets[args.batch]; base=R/'zenodo-release/aerosense-wiki/data'/folder
stage=A/'upload-staging';stage.mkdir(exist_ok=True)
queue_path=A/'official-upload-queue.json'
queue=json.loads(queue_path.read_text(encoding='utf-8')) if queue_path.exists() else {'status':'prepared; not uploaded','queue':[]}
known={r['source_paths'][0]:r for r in queue['queue']}
for name in names:
 p=base/name;data=p.read_bytes();digest=hashlib.sha256(data).hexdigest();rel=p.relative_to(R).as_posix()
 if rel in known:
  assert known[rel]['sha256']==digest,'Frozen asset changed: '+rel
  continue
 upload_name=digest[:12]+'-'+args.batch+'-'+p.name
 target=stage/upload_name;assert target.resolve().is_relative_to(stage.resolve())
 if target.exists():assert hashlib.sha256(target.read_bytes()).hexdigest()==digest
 else:shutil.copyfile(p,target)
 queue['queue'].append({'batch':args.batch,'source_paths':[rel],'upload_name':upload_name,
   'upload_file':str(target),'bytes':len(data),'sha256':digest,'official_url':None})
queue['prepared_at_utc']=datetime.datetime.now(datetime.timezone.utc).isoformat()
queue_path.write_text(json.dumps(queue,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'batch':args.batch,'new_queue_count':len(queue['queue']),
 'batch_upload_files':[r['upload_file'] for r in queue['queue'] if r['batch']==args.batch]},ensure_ascii=False,indent=2))
