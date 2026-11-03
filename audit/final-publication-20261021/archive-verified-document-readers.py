"""Preserve exact verified PDF readers and their reproduction evidence once by SHA."""
from pathlib import Path
import csv,json,hashlib,collections,datetime,os
A=Path(__file__).resolve().parent;R=A.parents[2];Z=R/'zenodo-release';C=A/'cdn-document-conversions'
DEST=Z/'reproduction-source/document-publication-20261021'
def native(p):return Path('\\\\?\\'+str(p.absolute())) if os.name=='nt' else p
def sha(p):return hashlib.sha256(native(p).read_bytes()).hexdigest()
with (Z/'manifest.csv').open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);fields=reader.fieldnames;rows=list(reader)
byhash=collections.defaultdict(list)
for row in rows:byhash[row['sha256']].append(Z/row['destination_relative'])
saved=[]
def preserve(source,relative,category,expected=None):
    source=Path(source);h=sha(source);size=native(source).stat().st_size
    if expected:assert h==expected,(source,h,expected)
    canonical=None
    for candidate in byhash.get(h,[]):
        if native(candidate).is_file() and sha(candidate)==h:canonical=candidate;break
    new=canonical is None
    if new:
        canonical=DEST/relative
        assert not native(canonical).exists() or sha(canonical)==h,canonical
        native(canonical.parent).mkdir(parents=True,exist_ok=True)
        if not native(canonical).exists():native(canonical).write_bytes(native(source).read_bytes())
        assert sha(canonical)==h
        rows.append({'source_relative':source.relative_to(R).as_posix(),'destination_relative':canonical.relative_to(Z).as_posix(),'category':category,'sha256':h,'bytes':str(size),'source_mtime_utc':datetime.datetime.fromtimestamp(native(source).stat().st_mtime,datetime.timezone.utc).isoformat(),'corresponding_pages':'official CDN document reading editions','direct_references':''})
        byhash[h].append(canonical)
    record={'source':source.relative_to(R).as_posix(),'canonical_archive':canonical.relative_to(R).as_posix(),'sha256':h,'bytes':size,'new_canonical':new,'source_still_present':True}
    saved.append(record);return record
source_manifest=json.loads((R/'gitlab/nthu/code/aerosense/source-manifest.json').read_text(encoding='utf-8'))
excluded={x['path']:x for x in source_manifest['excluded_artifacts']}
documents=[]
for name in ['verified-cdn-hardware-documents-mapping.json','verified-cdn-research-documents-mapping.json']:
    data=json.loads((A/name).read_text(encoding='utf-8'))
    for row in data['files']:
        assert row['verified'] and row['sha256']==row['response_sha256'] and row['bytes']==row['response_bytes']
        src=R/row['local_paths'][0]
        dest=preserve(src,'pdf/'+src.name,'verified-document-reader-pdf',row['sha256'])
        old=excluded[row['source_document'].removeprefix('gitlab/nthu/')]
        assert old['sha256']==row['source_document_sha256']
        original=R/old['canonical_archive'];assert sha(original)==old['sha256']
        documents.append({**dest,'source_document':row['source_document'],'original_canonical_archive':old['canonical_archive'],'original_sha256':old['sha256'],'official_url':row['official_url'],'pages':row['pages'],'reading_edition_not_byte_identity_with_original':True})
    preserve(A/name,'provenance/'+name,'document-publication-provenance')
assert len(documents)==10
receipt=json.loads((C/'html-document-render-receipt.json').read_text(encoding='utf-8'))
for row in receipt['historical_image_receipts']:
    source=Path(row['cache_path'])
    item=preserve(source,'historical-images/'+source.name,'historical-document-image',row['sha256'])
    item['original_url']=row['url']
for name in ['conversion-receipt.json','html-document-conversion-qa.json','html-document-render-plan.json','html-document-render-receipt.json']:
    preserve(C/name,'provenance/'+name,'document-publication-provenance')
for source in sorted(C.glob('*.print.html')):
    preserve(source,'prepared-html/'+source.name,'document-rendering-input')
for name in ['prepare-html-document-pdfs.py','render-html-document-pdfs.cjs','qa-html-document-pdfs.py','verify-pdf-reader-routing.py']:
    source=R/'aerosense-wiki/audit/release-20261021'/name
    preserve(source,'source/'+name,'document-rendering-source')
with (Z/'manifest.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(rows)
unique={r['destination_relative']:r for r in rows};categories={}
for r in unique.values():
    group=categories.setdefault(r['category'],{'files':0,'bytes':0});group['files']+=1;group['bytes']+=int(r['bytes'])
summary=json.loads((Z/'summary.json').read_text(encoding='utf-8'))
summary.update(payload_files=len(unique),payload_bytes=sum(int(r['bytes']) for r in unique.values()),manifest_source_records=len(rows),categories=categories)
out={'completed_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'documents':documents,'files':saved,'pdf_files':10,'historical_images':3,'new_canonical_files':sum(r['new_canonical'] for r in saved),'new_canonical_bytes':sum(r['bytes'] for r in saved if r['new_canonical']),'all_saved_hashes_verified':True,'audit_files_removed':0,'original_research_files_modified':0,'reproduction_scope':'Exact PDF editions, original-source references, prepared HTML, recovered historical image bytes, generation and QA source are preserved. Re-running the conversion may require the original workspace-relative archive layout and verified external rendering dependencies; identical PDF bytes across software versions are not claimed.'}
summary['document_reader_preservation_2026_10_21']={k:v for k,v in out.items() if k not in ['documents','files']}
(Z/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(A/'verified-document-reader-preservation.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in out.items() if k not in ['documents','files']},ensure_ascii=False))
