"""Exact source copy to the confirmed official software checkout; no removals or Git writes."""
from pathlib import Path
import json,hashlib,os,stat,datetime,subprocess
A=Path(__file__).resolve().parent;R=A.parents[2];OLD=R/'gitlab/nthu';NEW=R/'gitlab/aerosense-software'
def native(p):return Path('\\\\?\\'+str(p.absolute())) if os.name=='nt' else p
def sha(p):return hashlib.sha256(native(p).read_bytes()).hexdigest()
def guard(p,boundary):
    assert p.is_relative_to(boundary) and p!=boundary and p.resolve()==p,p
    for q in (p,*p.parents):
        if native(q).exists():assert not(getattr(native(q).lstat(),'st_file_attributes',0)&stat.FILE_ATTRIBUTE_REPARSE_POINT),q
        if q==R:break
plan=json.loads((A/'software-repository-source-transfer-plan.json').read_text(encoding='utf-8'))
assert len(plan['files'])==1220
remote=subprocess.check_output(['git','remote','get-url','origin'],cwd=NEW,text=True).strip()
assert remote=='https://gitlab.igem.org/2026/software/nthu/aerosense.git',remote
indices={str(p):sha(p) for p in [OLD/'.git/index',NEW/'.git/index']}
assert sha(OLD/'code/aerosense/source-manifest.json')==plan['source_manifest_sha256']
copied=[]
for row in plan['files']:
    s=Path(row['source_absolute']);d=NEW/row['destination_repository_relative']
    guard(s,OLD);guard(d,NEW)
    assert row['destination_repository_relative'].startswith(('code/aerosense/','docs/aerosense/'))
    assert sha(s)==row['sha256_before_transfer'] and native(s).stat().st_size==row['bytes']
    if native(d).exists():assert sha(d)==row['sha256_before_transfer'],d
    else:
        native(d.parent).mkdir(parents=True,exist_ok=True)
        native(d).write_bytes(native(s).read_bytes())
    assert sha(d)==row['sha256_before_transfer']
    copied.append({'source_relative':s.relative_to(R).as_posix(),'destination_relative':d.relative_to(R).as_posix(),'repository_relative':row['destination_repository_relative'],'sha256':sha(d),'bytes':row['bytes']})
assert all(sha(Path(p))==h for p,h in indices.items())
out={'completed_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'confirmed_software_repository':remote.removesuffix('.git'),'files':copied,'copied_files':len(copied),'copied_bytes':sum(x['bytes'] for x in copied),'all_exact_hashes_match':True,'old_copies_removed':0,'index_changed':False,'license_changed':False,'note':'Initial Apache template was not treated as authorization for team original source; license decision is separate.'}
(A/'software-repository-source-copy.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in out.items() if k!='files'},ensure_ascii=False))
