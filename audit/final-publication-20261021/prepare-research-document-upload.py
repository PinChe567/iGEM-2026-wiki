from pathlib import Path
import hashlib, json, re, shutil
OUT=Path(__file__).resolve().parent
WORK=OUT.parents[2]
qa=json.loads((OUT/'cdn-document-conversions/html-document-conversion-qa.json').read_text(encoding='utf-8'))
assert qa['ready_for_cdn_upload']
stage=OUT/'cdn-corrections-staging'
stage.mkdir(exist_ok=True)
rows=[]
for doc in qa['files']:
    assert doc['automated_pass'] and doc['source_unchanged']
    source=WORK/doc['pdf_path']
    assert source.stat().st_size==doc['bytes'] and hashlib.sha256(source.read_bytes()).hexdigest()==doc['sha256']
    name=doc['sha256'][:12]+'-'+re.sub(r'[^a-z0-9.-]+','-',source.name.lower())
    target=stage/name
    if target.exists(): assert hashlib.sha256(target.read_bytes()).hexdigest()==doc['sha256']
    else: shutil.copy2(source,target)
    rows.append({'local_paths':[doc['pdf_path']],'source_document':doc['source_document'],'source_document_sha256':doc['source_document_sha256'],'sha256':doc['sha256'],'bytes':doc['bytes'],'filename':name,'staging_path':str(target),'pages':doc['pages']})
(OUT/'cdn-research-documents-upload-queue.json').write_text(json.dumps({'files':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'files':len(rows),'bytes':sum(r['bytes'] for r in rows)}))
