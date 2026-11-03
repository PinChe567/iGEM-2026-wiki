"""Anonymous, four-worker full-GET readback of the 50 changed source files."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from urllib.request import Request,urlopen
from urllib.parse import quote
from urllib.error import HTTPError
import hashlib,json,subprocess

ROOT=Path(__file__).resolve().parents[3];REPO=ROOT/'gitlab/aerosense-software';AUD=Path(__file__).resolve().parent
def git(*args):return subprocess.check_output(['git','-C',str(REPO),*args])
staged=json.loads((AUD/'software-staged-verification.json').read_text(encoding='utf8'))
commit=git('rev-parse','HEAD').decode().strip()
assert commit=='df7b3bc9731fc03205e0a1ac907e90e634d693fb'
assert not git('status','--porcelain')
files=[]
for row in staged['files']:
    blob=git('show',commit+':'+row['path'])
    assert len(blob)==row['bytes'] and hashlib.sha256(blob).hexdigest()==row['sha256']
    files.append(dict(row,url='https://gitlab.igem.org/2026/software/nthu/aerosense/-/raw/main/'+quote(row['path'],safe='/')))
assert len(files)==50 and len({x['url'] for x in files})==50
started=datetime.now(timezone.utc).isoformat()
def fetch(row):
    result=dict(row)
    try:
        request=Request(row['url'],headers={'User-Agent':'AeroSense-publication-readback/1.0','Cache-Control':'no-cache'})
        with urlopen(request,timeout=60) as response:
            data=response.read();result.update(http_status=response.status,final_url=response.url,content_type=response.headers.get('Content-Type'),response_bytes=len(data),response_sha256=hashlib.sha256(data).hexdigest())
        result['status']='passed' if result['http_status']==200 and len(data)==row['bytes'] and result['response_sha256']==row['sha256'] else 'failed'
    except HTTPError as e:
        result.update(status='unverified' if e.code in {403,429} else 'failed',http_status=e.code,error=str(e))
    except Exception as e:
        result.update(status='unverified',error=repr(e))
    return result
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(fetch,files))
receipt={'started_at_utc':started,'completed_at_utc':datetime.now(timezone.utc).isoformat(),'repository':'https://gitlab.igem.org/2026/software/nthu/aerosense',
 'commit':commit,'parent_commit':git('rev-parse','HEAD^').decode().strip(),'normal_push_confirmed':True,'anonymous_requests':True,
 'concurrency':4,'expected_source':'Exact committed Git blobs; already equal to selected canonical bytes and reviewed working tree',
 'targets':len(results),'passed':sum(x['status']=='passed' for x in results),'unverified':sum(x['status']=='unverified' for x in results),'failed':sum(x['status']=='failed' for x in results),
 'total_response_bytes':sum(x.get('response_bytes',0) for x in results),'manifest_sha256':staged['manifest_sha256'],
 'source_only':True,'raw_reference_dataset_in_git':False,'files':results}
output=AUD/'software-publication-readback.json'
output.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in receipt.items() if k!='files'},indent=2))
if receipt['passed']!=50:raise SystemExit(1)
