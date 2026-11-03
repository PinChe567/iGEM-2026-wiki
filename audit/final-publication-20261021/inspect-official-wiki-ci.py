"""Read anonymous official CI status and save compact evidence, without credentials."""
from pathlib import Path
import argparse,datetime,json,urllib.request
A=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--commit',required=True);args=parser.parse_args()
BASE='https://gitlab.igem.org/api/v4/projects/5133'
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'AeroSense-public-deployment-verification/1.0'}),timeout=30) as response:return json.load(response)
pipelines=get(BASE+'/pipelines?sha='+args.commit)
assert pipelines,'No pipeline exists for the supplied commit'
pipeline=get(BASE+'/pipelines/'+str(pipelines[0]['id']))
assert pipeline['sha']==args.commit
jobs=get(BASE+'/pipelines/'+str(pipeline['id'])+'/jobs')
out={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'anonymous_read_only':True,'pipeline':{k:pipeline.get(k) for k in ['id','iid','project_id','sha','ref','status','web_url','created_at','updated_at','started_at','finished_at','duration','yaml_errors']},'jobs':[{k:r.get(k) for k in ['id','name','stage','status','web_url','created_at','started_at','finished_at','duration','artifacts_file','artifacts_expire_at']} for r in jobs]}
(A/f"official-ci-{pipeline['id']}.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,ensure_ascii=False))
