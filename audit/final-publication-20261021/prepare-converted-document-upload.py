from pathlib import Path
import hashlib, json, re, shutil
OUT=Path(__file__).resolve().parent
WORK=OUT.parents[2]
documents=json.loads((OUT/'cdn-document-conversions/conversion-receipt.json').read_text(encoding='utf-8'))['documents']
stage=OUT/'cdn-corrections-staging'
stage.mkdir(exist_ok=True)
rows=[]
for doc in documents:
    assert 'pending' not in doc['visual_review'].lower()
    source=Path(doc['pdf'])
    assert source.stat().st_size==doc['pdf_bytes'] and hashlib.sha256(source.read_bytes()).hexdigest()==doc['pdf_sha256']
    name=doc['pdf_sha256'][:12]+'-'+re.sub(r'[^a-z0-9.-]+','-',source.name.lower())
    target=stage/name
    if target.exists(): assert hashlib.sha256(target.read_bytes()).hexdigest()==doc['pdf_sha256']
    else: shutil.copy2(source,target)
    rows.append({'local_paths':[source.relative_to(WORK).as_posix()],'source_document':str(Path(doc['source']).relative_to(WORK).as_posix()),'source_document_sha256':doc['source_sha256'],'sha256':doc['pdf_sha256'],'bytes':doc['pdf_bytes'],'filename':name,'staging_path':str(target),'pages':doc['pages']})
(OUT/'cdn-hardware-documents-upload-queue.json').write_text(json.dumps({'files':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'files':len(rows),'bytes':sum(r['bytes'] for r in rows)}))
