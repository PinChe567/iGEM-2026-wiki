"""Sync final Registry prose routes and refresh the already-approved source selection."""
from pathlib import Path
import json,hashlib,datetime,os
A=Path(__file__).resolve().parent;R=A.parents[2];REPO=R/'gitlab/nthu'
def native(p):return Path('\\\\?\\'+str(p.absolute())) if os.name=='nt' else p
def sha(p):return hashlib.sha256(native(p).read_bytes()).hexdigest()
index_before=sha(REPO/'.git/index')
receipt=json.loads((A/'registry-final-routing-receipt.json').read_text(encoding='utf-8'))
synced=[]
for row in receipt['changed_documents']:
    source=R/row['path'];assert sha(source)==row['after_sha256']
    dest=REPO/'docs/aerosense/parts'/source.name
    assert dest.is_file(),dest
    before=sha(dest);dest.write_bytes(source.read_bytes());assert sha(dest)==sha(source)
    synced.append({'source':row['path'],'path':dest.relative_to(REPO).as_posix(),'before_sha256':before,'sha256':sha(dest),'bytes':dest.stat().st_size})
readme=REPO/'README.md';text=readme.read_text(encoding='utf-8')
assert text.count('contains supporting documents.')+text.count('contains editable documentation sources.')==1
readme.write_text(text.replace('contains supporting documents.','contains editable documentation sources.'),encoding='utf-8')
manifest_path=REPO/'code/aerosense/source-manifest.json';manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
changed=[]
for row in manifest['files']:
    path=REPO/row['path'];assert native(path).is_file(),path
    current=sha(path);size=native(path).stat().st_size
    if current!=row['sha256']:
        changed.append({'path':row['path'],'before_sha256':row['sha256'],'sha256':current,'bytes':size})
        row['previous_manifest_sha256']=row['sha256'];row['sha256']=current;row['bytes']=size
        matching=next((x for x in synced if x['path']==row['path']),None)
        if matching:
            row.update(source=matching['source'],source_sha256=current,source_bytes=size,selection='Registry Markdown with finalized verified CDN attachment routes; scientific content unchanged.')
for row in manifest['excluded_artifacts']:
    assert not native(REPO/row['path']).exists(),row['path']
    canonical=R/row['canonical_archive'];assert native(canonical).is_file() and sha(canonical)==row['sha256']
    row['repository_copy_removed']=True
for name in ['verified-cdn-hardware-documents-mapping.json','verified-cdn-research-documents-mapping.json']:
    for rendered in json.loads((A/name).read_text(encoding='utf-8'))['files']:
        rel=rendered['source_document'].removeprefix('gitlab/nthu/')
        row=next(x for x in manifest['excluded_artifacts'] if x['path']==rel)
        assert row['sha256']==rendered['source_document_sha256']
        row['verified_document_rendering']={'official_url':rendered['official_url'],'pdf_sha256':rendered['sha256'],'source_document_sha256':rendered['source_document_sha256'],'meaning':'Readable PDF edition; different-format rendering, not byte identity with the original.'}
expected={r['path'] for r in manifest['files']}|{'code/aerosense/source-manifest.json'}
actual=set()
for prefix in ['code/aerosense','docs/aerosense']:
    for current,dirs,files in os.walk(native(REPO/prefix)):
        for name in files:
            absolute=Path(str(Path(current)/name).removeprefix('\\\\?\\'))
            actual.add(absolute.relative_to(REPO).as_posix())
ignored_generated_cache_files=sorted(x for x in actual-expected if '/__pycache__/' in x and x.endswith('.pyc'))
assert actual-set(ignored_generated_cache_files)==expected,{'unexpected':sorted(actual-expected-set(ignored_generated_cache_files)),'missing':sorted(expected-actual)}
manifest['status']='Approved source-only working tree after canonical-guarded removal of 550 publication copies. Final Registry Markdown attachment routes included. No successful push/deployment is claimed by this manifest.'
manifest['summary'].update(retained_manifest_files=len(manifest['files']),retained_bytes=sum(x['bytes'] for x in manifest['files']),excluded_artifact_removal_complete=True,index_changed=False)
manifest['finalized_at_utc']=datetime.datetime.now(datetime.timezone.utc).isoformat()
manifest['removal_receipt']='aerosense-wiki/audit/final-publication-20261021/executed-source-only-artifact-copy-cleanup.json'
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert sha(REPO/'.git/index')==index_before
out={'finalized_at_utc':manifest['finalized_at_utc'],'retained_files':len(manifest['files']),'retained_bytes':manifest['summary']['retained_bytes'],'excluded_copies_removed':550,'excluded_bytes':108211247,'registry_markdown_synced':synced,'manifest_changed_entries':changed,'manifest_sha256':sha(manifest_path),'source_manifest_path':manifest_path.relative_to(R).as_posix(),'index_unchanged':True,'index_sha256':index_before,'extra_unlisted_code_docs_files':[],'ignored_generated_cache_files':ignored_generated_cache_files,'main_readme_wording':'editable documentation sources'}
(A/'source-only-final-source-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in out.items() if k not in ['registry_markdown_synced','manifest_changed_entries']},ensure_ascii=False))
