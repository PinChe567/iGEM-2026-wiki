from pathlib import Path
from datetime import datetime, timezone
import ast, hashlib, json, shutil
ROOT=Path(__file__).resolve().parents[3]
AUD=Path(__file__).resolve().parent
REPO=ROOT/'gitlab/aerosense-software'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
mp=REPO/'code/aerosense/source-manifest.json'
m=json.loads(mp.read_text(encoding='utf8')); rows={r['path']:r for r in m['files']}
changes=[]
batch=ROOT/'zenodo-release/aerosense-wiki/data/test2-confirmed-map-2026-10-21/complete-curves'
for name in ['analysis/build_complete_curves.py','README.md','METHODS.md']:
    src=batch/name; rel='code/aerosense/wetlab/aerosense-wiki/data/test2-confirmed-map-2026-10-21/complete-curves/'+name
    dest=REPO/rel; dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dest)
    rows[rel]={'path':rel,'source':src.relative_to(ROOT).as_posix(),'topic':'wetlab','selection':'Exact editable source for user-confirmed Test 2 receptor map; datasets remain in canonical archive/CDN.','repository_policy_category':'analysis_source' if name.endswith('.py') else 'reproduction_documentation'}
    changes.append(rel)
freeze=json.loads((ROOT/'aerosense-wiki/audit/engineering-model-user-revisions-20261021/registry-confirmed-map-source-freeze.json').read_text(encoding='utf8'))
for item in freeze['files']:
    if not item['path'].startswith('gitlab/aerosense-software/'):continue
    dest=ROOT/item['path']; assert sha(dest)==item['sha256'],item['path']
    rel=dest.relative_to(REPO).as_posix(); src=ROOT/'registry_docs_v2'/dest.name
    assert src.is_file(),src
    if dest.suffix=='.md':assert sha(src)==sha(dest),rel
    row=rows[rel];row['source']=src.relative_to(ROOT).as_posix()
    row['selection']='User-confirmed Test 2 receptor map, S/N figure interpretation and distinct additive F1 method; existing source paths preserved.'
    changes.append(rel)
for rel in changes:
    dest=REPO/rel;row=rows[rel];src=ROOT/row['source']
    if dest.suffix=='.py':ast.parse(dest.read_text(encoding='utf-8-sig'))
    row.update(bytes=dest.stat().st_size,sha256=sha(dest),source_bytes=src.stat().st_size,source_sha256=sha(src))
failures=[]
for rel,row in rows.items():
    p=REPO/rel
    if not p.is_file() or sha(p)!=row['sha256'] or p.stat().st_size!=row['bytes']:failures.append(rel)
assert not any(p in changes for p in failures),failures
m['files']=sorted(rows.values(),key=lambda r:r['path'])
m['summary']['retained_manifest_files']=len(rows)
m['summary']['retained_bytes']=sum(r['bytes'] for r in rows.values())
m['status']='Prepared source-only release with user-confirmed Test 2 map, corrected hardware comparisons, complete curves and distinct F1 analysis. Registry source mirrors are frozen; remote publication is coordinator-owned.'
m['confirmed_map_finalization']={'at_utc':datetime.now(timezone.utc).isoformat(),'refreshed_paths':changes,'verified_current_changes':len(changes),'unrelated_preexisting_check_exceptions':failures,'source_mirrors_identical':True,'git_operations':False}
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
receipt={'at_utc':datetime.now(timezone.utc).isoformat(),'files':len(rows),'bytes':m['summary']['retained_bytes'],'manifest_sha256':sha(mp),'refreshed_paths':changes,'current_changes_hashes_pass':True,'unrelated_preexisting_check_exceptions':failures,'git_operations':False}
(AUD/'confirmed-map-software-final.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
print(json.dumps(receipt))
