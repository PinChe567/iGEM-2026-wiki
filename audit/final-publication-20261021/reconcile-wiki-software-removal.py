"""Read-only reconcile completed copies after a concurrently changed Wiki index guard."""
from pathlib import Path
import datetime,hashlib,json,os
A=Path(__file__).resolve().parent;R=A.parents[2]
def n(p):return Path('\\\\?\\'+str(p.absolute())) if os.name=='nt' else p
def h(p):return hashlib.sha256(n(p).read_bytes()).hexdigest()
pre=json.loads((A/'wiki-software-removal-preflight.json').read_text(encoding='utf-8-sig'))
rows=pre['files'];assert len(rows)==1220
for r in rows:
    assert not n(Path(r['source'])).exists(),r['source']
    for k in ['software','canonical']:
        p=Path(r[k]);assert h(p)==r['sha256'] and n(p).stat().st_size==r['bytes'],p
index={p:{'before':v,'after':h(Path(p)),'changed':v!=h(Path(p))} for p,v in pre['index_hashes'].items()}
caches=['code/aerosense/hardware/07_validation/__pycache__/build_pdfs.cpython-312.pyc','code/aerosense/hardware/07_validation/fluorescein_2026-10-20/__pycache__/analyze_fluorescein.cpython-311.pyc']
assert all(n(R/'gitlab/nthu'/p).exists() for p in caches)
out={'completed_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':rows,'removed_files':len(rows),'removed_bytes':sum(r['bytes'] for r in rows),'canonical_and_software_hashes_rechecked':True,'indices_unchanged':all(not r['changed'] for r in index.values()),'index_observations':index,'ignored_cache_files_not_touched':2,'directory_deletions':0,'independent_reconciliation':'All planned sources absent, every surviving Software and canonical file hash/size verified. Original PowerShell operation completed removals but its final index guard detected a concurrent Wiki index change; no Git command or index write occurs in the removal script.','known_concurrent_index_change':'Root confirmed staging final Wiki site/ci/root files and removing 25 obsolete static/wiki template paths from the Wiki index during this operation. Root did not stage code/docs or touch the Software index; this explains the observed Wiki index change.'}
(A/'executed-wiki-software-copy-cleanup.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in out.items() if k!='files'},ensure_ascii=False))
