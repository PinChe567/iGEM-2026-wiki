"""Finalize reviewed Software rows; exclude unresolved F1-label source additions.

No source copy, archive-index change or Git operation. Existing source-manifest
rows outside the explicit Registry paths remain unchanged. Four F1 source files
remain unregistered and must not be staged with this release.
"""
from pathlib import Path
from datetime import datetime, timezone
import argparse, ast, hashlib, json

AUD=Path(__file__).resolve().parent
ROOT=AUD.parents[2]
REPO=ROOT/'gitlab/aerosense-software'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--source-frozen',action='store_true');args=ap.parse_args()
if not args.source_frozen:raise SystemExit('Await Registry source freeze and confirmation that unresolved F1 additions are excluded.')
path=REPO/'code/aerosense/source-manifest.json';before_sha=sha(path);manifest=read(path)
rows={r['path']:r for r in manifest['files']};changed=[];added=[]
receipt=read(ROOT/'aerosense-wiki/audit/engineering-model-user-revisions-20261021/registry-metric-source-updates.json')
prefix='gitlab/aerosense-software/'
expected=sorted({r['path'][len(prefix):] for r in receipt['files'] if r['path'].startswith(prefix)})
assert len(expected)==12,expected
for relative in expected:
    p=REPO/relative;row=rows[relative]
    source=ROOT/'registry_docs_v2'/p.name
    assert source.is_file()
    if p.suffix=='.md':assert sha(source)==sha(p), f'Registry mirror not final: {relative}'
    if p.suffix=='.py':ast.parse(p.read_text(encoding='utf-8-sig'))
    previous={'sha256':row['sha256'],'bytes':row['bytes'],'source':row.get('source')}
    row.update(bytes=p.stat().st_size,sha256=sha(p),source=source.relative_to(ROOT).as_posix(),source_bytes=source.stat().st_size,source_sha256=sha(source),
               selection='Latest approved Registry S/N clarification and separately scoped additive methods; existing tables and original full-trace links retained. Generator retains repository-specific path adaptation.')
    row['browser_comment_revision']={'previous':previous,'prepared_at_utc':datetime.now(timezone.utc).isoformat(),'source_body_sha_is_publication_proof':False}
    changed.append({'path':relative,'sha256':row['sha256'],'bytes':row['bytes'],'previous':previous})
assert not any('/odor-f1-dynamic/' in key for key in rows), 'Unresolved F1 sources must remain outside this release manifest.'
for row in read(AUD/'source-preparation-qa.json')['source_files']:
    assert sha(REPO/row['path'])==row['sha256'],row['path']
assert all((REPO/r['path']).stat().st_size<1_000_000 for r in added)
manifest['files']=sorted(rows.values(),key=lambda r:r['path'])
manifest['summary']['retained_manifest_files']=len(rows)
manifest['summary']['retained_bytes']=sum(r['bytes'] for r in rows.values())
manifest['status']='Reviewed local source update: six metric/Education sources and final Registry S/N Markdown/generator revisions. Unresolved F1-label sources are excluded. Commit, push and public readback remain coordinator-owned.'
manifest['browser_comment_final_source_revision']={'prepared_at_utc':datetime.now(timezone.utc).isoformat(),'registry_updated_sources':changed,'f1_added_sources':added,
    'metric_education_sources_already_registered':6,'before_manifest_sha256':before_sha,'no_raw_or_derived_data_added':True,'git_operations':False,
    'f1_additions_excluded':'Same underlying observations are associated with conflicting receptor maps; awaiting source clarification.'}
write(path,manifest)
out={'manifest_before_sha256':before_sha,'manifest_sha256':sha(path),'source_count':len(rows),'source_bytes':manifest['summary']['retained_bytes'],
     'changed_existing':changed,'added_f1':added,'six_previous_new_sources_unchanged':True,'all_new_python_syntax_pass':True,'git_operations':False,'archive_indexes_changed':False}
write(AUD/'final-software-manifest.json',out)
write(AUD/'final-software-source-manifest-snapshot.json',manifest)
print(json.dumps({k:v for k,v in out.items() if k not in ['changed_existing','added_f1']},indent=2))
