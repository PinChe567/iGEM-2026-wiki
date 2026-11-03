"""Stage only the 50 release-owner-reviewed Software paths and verify Git blobs."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[3];REPO=ROOT/'gitlab/aerosense-software';AUD=Path(__file__).resolve().parent
def git(*args):return subprocess.check_output(['git','-C',str(REPO),*args])
review=json.loads((AUD/'source-only-final-review.json').read_text(encoding='utf8'))
assert review['status']=='passed' and review['changed_files_including_manifest']==50
paths=review['paths']
assert git('branch','--show-current').decode().strip()=='main'
assert git('rev-parse','HEAD').decode().strip()=='861ce244564c0d012954d77b94ebfda4f473f617'
assert git('remote','get-url','origin').decode().strip().rstrip('/').removesuffix('.git')=='https://gitlab.igem.org/2026/software/nthu/aerosense'
assert not git('diff','--cached','--name-only')
assert hashlib.sha256((REPO/'code/aerosense/source-manifest.json').read_bytes()).hexdigest()==review['manifest_sha256']
subprocess.run(['git','-C',str(REPO),'add','--',*paths],check=True)
staged=set(git('diff','--cached','--name-only','-z').decode().split('\0'));staged.discard('')
assert staged==set(paths)
files=[]
for p in paths:
    blob=git('show',':'+p);working=(REPO/p).read_bytes()
    assert blob==working,p
    files.append({'path':p,'bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest()})
subprocess.run(['git','-C',str(REPO),'-c','core.whitespace=cr-at-eol','diff','--cached','--check'],check=True)
receipt={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'status':'passed','base_commit':git('rev-parse','HEAD').decode().strip(),
    'staged_files':len(files),'exact_workingtree_matches':len(files),'files':files,'no_other_paths_staged':True,
    'manifest_sha256':review['manifest_sha256'],'no_commit_push_yet':True}
(AUD/'software-staged-verification.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in receipt.items() if k!='files'},indent=2))
