"""Stage the reviewed 13 paths or read back their normally pushed commit."""
from pathlib import Path
from datetime import datetime,timezone
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
from urllib.request import Request,urlopen
from urllib.parse import quote
from urllib.error import HTTPError
import argparse,subprocess,hashlib,json,csv,shutil
ROOT=Path(__file__).resolve().parents[3];SOFT=ROOT/'gitlab/aerosense-software';ARC=ROOT/'zenodo-release';AUD=Path(__file__).resolve().parent
def git(*args):return subprocess.check_output(['git','-C',str(SOFT),*args])
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['stage','readback']);args=parser.parse_args()
prepared=read(AUD/'registry-footer-source-preparation.json');paths=prepared['software_changed_paths'];assert len(paths)==13
assert git('branch','--show-current').decode().strip()=='main'
assert git('remote','get-url','origin').decode().strip().rstrip('/').removesuffix('.git')=='https://gitlab.igem.org/2026/software/nthu/aerosense'
if args.mode=='stage':
 assert git('rev-parse','HEAD').decode().strip()==prepared['base_commit'] and not git('diff','--cached','--name-only')
 actual=set(filter(None,git('diff','--name-only','-z').decode().split('\0')))
 assert actual==set(paths) and not git('ls-files','--others','--exclude-standard')
 assert sha(SOFT/'code/aerosense/source-manifest.json')==prepared['software_manifest_sha256']
 subprocess.run(['git','-C',str(SOFT),'add','--',*paths],check=True)
 assert set(filter(None,git('diff','--cached','--name-only','-z').decode().split('\0')))==set(paths)
 files=[]
 for p in paths:
  blob=git('show',':'+p);assert blob==(SOFT/p).read_bytes()
  files.append({'path':p,'bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest()})
 subprocess.run(['git','-C',str(SOFT),'-c','core.whitespace=cr-at-eol','diff','--cached','--check'],check=True)
 result={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'status':'passed','staged_files':13,'exact_blob_workingtree_matches':13,'files':files,
  'base_commit':prepared['base_commit'],'manifest_sha256':prepared['software_manifest_sha256'],'no_other_source_changes':True}
 write(AUD/'registry-footer-staged-verification.json',result);print(json.dumps({k:v for k,v in result.items() if k!='files'},indent=2));raise SystemExit(0)
commit=git('rev-parse','HEAD').decode().strip();assert git('rev-parse','HEAD^').decode().strip()==prepared['base_commit']
assert not git('status','--porcelain')
staged=read(AUD/'registry-footer-staged-verification.json')
files=[]
for row in staged['files']:
 blob=git('show',commit+':'+row['path']);assert hashlib.sha256(blob).hexdigest()==row['sha256']
 files.append(dict(row,url='https://gitlab.igem.org/2026/software/nthu/aerosense/-/raw/main/'+quote(row['path'],safe='/')))
def fetch(row):
 result=dict(row)
 try:
  with urlopen(Request(row['url'],headers={'User-Agent':'AeroSense-publication-readback/1.0','Cache-Control':'no-cache'}),timeout=60) as response:
   data=response.read();result.update(http_status=response.status,final_url=response.url,response_bytes=len(data),response_sha256=hashlib.sha256(data).hexdigest())
  result['status']='passed' if result['http_status']==200 and len(data)==row['bytes'] and result['response_sha256']==row['sha256'] else 'failed'
 except HTTPError as e:result.update(status='unverified' if e.code in {403,429} else 'failed',http_status=e.code,error=str(e))
 except Exception as e:result.update(status='unverified',error=repr(e))
 return result
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(fetch,files))
result={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'repository':'https://gitlab.igem.org/2026/software/nthu/aerosense',
 'commit':commit,'parent_commit':prepared['base_commit'],'normal_push_confirmed':True,'anonymous_requests':True,'concurrency':4,
 'targets':13,'passed':sum(r['status']=='passed' for r in results),'failed':sum(r['status']=='failed' for r in results),'unverified':sum(r['status']=='unverified' for r in results),
 'manifest_sha256':prepared['software_manifest_sha256'],'expected_source':'Exact committed blobs and selected canonical source bytes','files':results}
output=AUD/'registry-footer-software-readback.json';write(output,result)
assert result['passed']==13,'Public verification incomplete; preserve failure receipt and stop.'
target=ARC/'reproduction-source/registry-publication-footer-cleanup-20261021/PUBLICATION-READBACK.json';assert not target.exists()
shutil.copyfile(output,target);assert sha(target)==sha(output)
master=ARC/'manifest.csv'
with master.open(encoding='utf-8-sig',newline='') as f:
 rd=csv.DictReader(f);fields=rd.fieldnames;records=list(rd)
relative=target.relative_to(ARC).as_posix();assert not any(r['destination_relative']==relative for r in records)
records.append({'source_relative':output.relative_to(ROOT).as_posix(),'destination_relative':relative,'category':'publication-source-provenance',
 'sha256':sha(target),'bytes':str(target.stat().st_size),'source_mtime_utc':datetime.fromtimestamp(target.stat().st_mtime,timezone.utc).isoformat(),
 'corresponding_pages':'Registry Test2 administrative footer cleanup; source publication','direct_references':result['repository']})
with master.open('w',encoding='utf-8-sig',newline='') as f:
 wr=csv.DictWriter(f,fieldnames=fields);wr.writeheader();wr.writerows(records)
unique={r['destination_relative']:r for r in records};cats=defaultdict(lambda:{'files':0,'bytes':0})
for r in unique.values():cats[r['category']]['files']+=1;cats[r['category']]['bytes']+=int(r['bytes'])
summary=read(ARC/'summary.json');summary.update(manifest_source_records=len(records),payload_files=len(unique),payload_bytes=sum(int(r['bytes']) for r in unique.values()),categories=dict(cats))
summary['registry_administrative_footer_cleanup_2026_10_21'].update(status='Software source edition normally published and13/13rawGETSHA passed; final11Registry resaves/readback remain separate',software_public_commit=commit,source_readback_passed=13)
write(ARC/'summary.json',summary)
write(AUD/'registry-footer-source-publication-completion.json',dict({k:v for k,v in result.items() if k!='files'},software_source_files=1250,
 software_source_bytes=prepared['software_source_bytes'],payload_files=len(unique),payload_bytes=summary['payload_bytes'],manifest_records=len(records),master_manifest_sha256=sha(master)))
print(json.dumps({k:v for k,v in result.items() if k!='files'},indent=2))
