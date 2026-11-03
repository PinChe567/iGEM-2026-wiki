"""Read-only site/source inventory. Writes audit JSON only; makes no network requests."""
from pathlib import Path
from collections import defaultdict, Counter
from urllib.parse import urlsplit, unquote, quote
import hashlib, json, os, re
from datetime import datetime, timezone
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[3]
SITE = ROOT / 'aerosense-wiki'
GIT = ROOT / 'gitlab/nthu'
OUT = Path(__file__).parent
FINAL = SITE / 'audit/final-publication-20261021'
BASE = 'https://gitlab.igem.org/2026/nthu'
STATUS = BASE + '/-/blob/main/docs/aerosense/archive-status.md'
RX = re.compile(r'https://gitlab\.igem\.org/2026/nthu(?:/[^\s\"\'<>`\\\)\]\}]+)?')

def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

cdn = defaultdict(list)
proofs = [SITE/'igem-upload/verified-official-urls.json']
proofs += [FINAL/x for x in ('verified-new-download-mapping.json','verified-new-svg-mapping.json','verified-new-game-art-mapping.json','official-readback.json','new-download-readback.json','new-svg-readback.json','new-game-art-readback.json')]
for proof in proofs:
    if not proof.exists(): continue
    data=json.loads(proof.read_text(encoding='utf8'))
    rows=data if isinstance(data,list) else data.get('mappings',data.get('assets',data.get('results',[])))
    for r in rows:
        url=r.get('official_url',r.get('url'))
        if not url or not url.startswith('https://static.igem.wiki/'): continue
        a=r.get('source_sha256'); b=r.get('response_sha256')
        if a and a==b:
            cdn[a].append({'url':url,'proof':proof.relative_to(ROOT).as_posix(),'full_byte_sha256':a})
        elif r.get('ok') and r.get('hash_verified') and r.get('sha256') in r.get('expected_sha256',[]):
            sha=r['sha256']; cdn[sha].append({'url':url,'proof':proof.relative_to(ROOT).as_posix(),'full_byte_sha256':sha})

references=defaultdict(list)
scanned=[]
skip={'audit','igem-upload','node_modules','.git','vendor','tests','scripts','hardware information','design_system'}
for folder, dirs, files in os.walk(SITE):
    dirs[:]=[d for d in dirs if d not in skip]
    for name in files:
        p=Path(folder)/name
        if p.suffix.lower() not in {'.html','.js','.mjs','.json'}: continue
        # Skip unreferenced archive/source evidence; include translations and runtime assets.
        rel=p.relative_to(SITE).as_posix()
        try: body=p.read_text(encoding='utf8')
        except (UnicodeDecodeError,OSError): continue
        if BASE not in body: continue
        scanned.append(rel)
        seen=set()
        if p.suffix.lower()=='.html':
            soup=BeautifulSoup(body,'html.parser')
            for tag in soup.find_all(True):
                for attr,val in tag.attrs.items():
                    if not isinstance(val,str) or not val.startswith(BASE): continue
                    url=val.rstrip('.,;')
                    context=tag.find_parent(['p','li','tr','article','section']) or tag
                    row={'source':rel,'kind':'root_html_anchor' if p.parent==SITE and tag.name=='a' and attr=='href' else 'html_attribute','tag':tag.name,'attribute':attr,'label':tag.get_text(' ',strip=True)[:220],'context':context.get_text(' ',strip=True)[:650]}
                    references[url].append(row); seen.add(url)
        for match in RX.finditer(body):
            url=match.group().rstrip('.,;')
            if url in seen: continue
            seen.add(url)
            kind='locale_overlay_or_generated' if rel.startswith(('locales/','js/i18n/')) else 'runtime_or_embedded_reference'
            line=body.count('\n',0,match.start())+1
            references[url].append({'source':rel,'kind':kind,'line':line,'context':body[max(0,match.start()-90):match.end()+90]})

# Exact source URL requested by the parent; do not confuse the older script with this one.
optical=GIT/'code/aerosense/visualization/aerosense-wiki/resources/hardware-en/optical-validation/analyze_optical_validation.py'
source_ext={'.py','.js','.mjs','.css','.cpp','.c','.h','.hpp','.ino','.scad','.kicad_pcb','.md','.txt','.yml','.yaml','.toml','.sh','.ps1','.r'}
data_ext={'.csv','.tsv','.json','.xlsx','.xls'}
archive_ext={'.zip','.7z','.tar','.gz','.avi','.mp4','.tif','.tiff','.stl','.brd','.npy','.npz','.h5','.hdf5','.pkl','.pt','.pth'}
semantic_source={'measurement-record.schema.json','design_parameters.json','nuclear-object-parameters.json'}
bulk_names={'plate-p2-timeseries.csv','nuclear-object-measurements.csv','surface_arrival.csv','transfect.xlsx','counts.csv','functional-seven-measurements.csv'}
pdf_report=OUT/'document-pdf-reader-routing.json'
pdf_readers={r['current_url']:r for r in json.loads(pdf_report.read_text(encoding='utf8'))['records']} if pdf_report.exists() else {}
package_sources={
 'crosstalk-calibration.zip':('code/aerosense/hardware/07_validation/crosstalk-calibration','Cross-talk calibration analysis source — GitLab'),
 'session-comparison.zip':('code/aerosense/hardware/07_validation/session-comparison','Session comparison analysis source — GitLab'),
 'fluorescein-analysis.zip':('code/aerosense/hardware/07_validation/reproduction-source/fluorescein-analysis','Fluorescein calibration analysis source — GitLab'),
 'unified-calibration.zip':('code/aerosense/hardware/07_validation/reproduction-source/unified-calibration','Per-channel calibration analysis source — GitLab')
}
package_receipt=FINAL/'zip-source-extraction-receipt.json'
records=[]
for url, refs in sorted(references.items()):
    record={'current_url':url,'references':refs,'root_anchor_count':sum(r['kind']=='root_html_anchor' for r in refs)}
    m=re.match(re.escape(BASE)+r'/-/(raw|blob|tree)/([^/]+)/(.*)',url)
    if not m:
        record.update(action='retain_repository_navigation',reason='Repository navigation/source identity; not a file download.',proposed_url=url)
        records.append(record); continue
    mode,branch,path=m.groups(); path=unquote(urlsplit('/'+path).path.lstrip('/'))
    local=GIT/path
    record.update(mode=mode,branch=branch,repository_path=path,local_path=local.relative_to(ROOT).as_posix(),local_exists=local.exists())
    labels=' '.join(x.get('label','') for x in refs)
    if mode=='tree':
        data_claim=any(x.lower() in labels.lower() for x in ('tables','numerical dataset','derived summaries','records','geometry'))
        if ('description_lightsheet/results/' in path):
            record.update(action='archive_dataset_directory',reason='The link promises a numerical light-sheet dataset; source code cannot replace these data.',proposed_url=STATUS,proposed_label=Path(path).name+' numerical dataset availability')
        elif data_claim:
            target=path
            if path=='code/aerosense/receptor-engineering/wiki-site/assets/receptor-engineering': target='code/aerosense/receptor-engineering/wiki-site/scripts'
            record.update(action='retain_source_directory_relabel',reason='Keep the actual code/source directory only; change dataset/table/geometry claims to the precise source role, and describe data availability separately.',proposed_url=BASE+'/-/tree/'+branch+'/'+quote(target,safe='/'),proposed_label='Analysis and rendering source — GitLab')
        else:
            record.update(action='retain_source_directory',reason='Editable implementation/source navigation; not a dataset download.',proposed_url=url)
        records.append(record); continue
    if not local.is_file():
        record.update(action='missing_local_source_review',reason='No local file available for exact-content verification. Do not invent a CDN replacement.')
        records.append(record); continue
    sha=digest(local); size=local.stat().st_size; ext=local.suffix.lower(); name=local.name
    record.update(sha256=sha,bytes=size,extension=ext)
    if url in pdf_readers:
        reader=pdf_readers[url]
        assert reader['source_sha256']==sha
        record.update(action='replace_verified_pdf_reader',reason=reader['format_semantics'],proposed_url=reader['proposed_url'],proposed_label=reader['proposed_label'],pdf_reader_evidence=reader)
    elif local.name in package_sources and package_receipt.exists():
        target,label=package_sources[local.name]
        assert (GIT/target).is_dir()
        record.update(action='replace_package_with_exact_source_tree',reason='Exact Python/README members were extracted and hash-verified separately; this link exposes analysis source only. Full raw/output package remains archived.',proposed_url=BASE+'/-/tree/'+branch+'/'+quote(target,safe='/'),proposed_label=label,source_extraction_receipt=package_receipt.relative_to(ROOT).as_posix())
    elif sha in cdn:
        evidence=sorted(cdn[sha],key=lambda x:x['url'])
        record.update(action='replace_verified_exact_cdn',reason='An existing official CDN asset has the identical complete file SHA-256. Reuse without a network request or filename-only matching.',proposed_url=evidence[0]['url'],cdn_evidence=evidence)
    elif name in semantic_source or ext in source_ext:
        record.update(action='retain_source',reason='Editable source/configuration/documentation text. Keep its source role; do not describe the GitLab blob as a rendered attachment or dataset package.',proposed_url=url)
    elif ext=='.html':
        record.update(action='pending_document_pdf_render',category='generated_report_or_historical_method_document',reason='Content inspection identifies a static analysis report or historical methods document, not executable/editable program source. No corresponding verified public PDF is present. Render and verify a true PDF reading edition, or label the archived document availability accurately.',proposed_url=None)
    elif ext in archive_ext or name in bulk_names or '/raw/' in path or size>5*1024*1024:
        record.update(action='archive_data_or_model',reason='Raw/full observation data, a bulk research archive, or a binary model. Preserve locally for the research archive; no verified public deposit is currently available.',proposed_url=STATUS,proposed_label=name+' — archive availability')
        if ext=='.zip':
            record['alternative']='Where the link promises code, replace it with the exact available source tree and label it Source code; keep archive availability separately. Do not call a source tree a ZIP download.'
    elif ext in {'.docx','.doc','.pptx','.xlsx','.xls','.rpt'}:
        record.update(action='pending_document_pdf_render',category='static_document',reason='No already-published same-document PDF is verified. Render full actual document content to PDF and verify the upload before updating the link. Never rename the extension or substitute a different document.',proposed_url=None)
    elif ext in data_ext or ext=='.pdf':
        category='static_document' if ext in {'.pdf','.docx','.doc','.pptx','.xlsx','.xls','.rpt'} else 'derived_chart_table_or_template'
        record.update(action='pending_static_cdn_upload',category=category,reason='No exact byte-identical published CDN match exists in current verified receipts. Candidate static document/derived table attachment; upload and full-byte verification must precede any URL rewrite.',proposed_url=None)
    else:
        record.update(action='unclassified_policy_review',reason='Not clearly an allowed source file or a verified static asset; publication role must be determined before routing.')
    records.append(record)

counts=Counter(r['action'] for r in records)
root_counts=Counter(r['action'] for r in records if r['root_anchor_count'])
root_refs=Counter()
for r in records: root_refs[r['action']]+=r['root_anchor_count']
uploads={}
for r in records:
    if r['action']=='pending_static_cdn_upload':
        item=uploads.setdefault(r['sha256'],{'sha256':r['sha256'],'bytes':r['bytes'],'category':r['category'],'local_paths':[],'current_urls':[],'source_pages':set()})
        item['local_paths'].append(r['local_path']); item['current_urls'].append(r['current_url'])
        item['source_pages'].update(x['source'] for x in r['references'])
for item in uploads.values(): item['source_pages']=sorted(item['source_pages'])
plan={'prepared_at_utc':datetime.now(timezone.utc).isoformat(),'scope':'Read-only scan of daily website HTML, JS/MJS and JSON runtime/translation sources, excluding audit, upload staging, vendor, tests and build scripts. Includes all root HTML anchors and embedded/viewer attributes. No network requests and no site/source/document mutations.','publication_status':'Parent reports failed GitLab push; remote remains 423ecab283ffead1bee3f5981ea9dbadea5eb1c9. A local GitLab path is not evidence of publication. Source retain/proposed URLs still require the successful source-only push and readback.','source_reference_files':scanned,'verified_cdn_sha_count':len(cdn),'summary':{'unique_urls':len(records),'references':sum(len(r['references']) for r in records),'unique_root_anchor_urls':sum(bool(r['root_anchor_count']) for r in records),'root_anchor_references':sum(r['root_anchor_count'] for r in records),'actions_all':dict(counts),'actions_root_unique':dict(root_counts),'actions_root_references':dict(root_refs),'pending_upload_unique_sha':len(uploads),'pending_upload_bytes':sum(x['bytes'] for x in uploads.values())},'important_rules':['Retained source links are permitted source roles, not claims of a successful public push.','Only full-byte SHA matches from existing verified CDN receipts are proposed as already-public replacements.','Pending static attachments have no proposed public URL; root decides uploads and publication policy.','Raw/bulk datasets, research ZIPs and binary models remain in the independent local research archive until a verified public deposit is available.','The archive-status Markdown note itself must be included in a successful source-only push before its public link is verified.','No scientific table, figure or numerical content is modified by this plan.'],'additional_required_source_fix':{'source_path':'aerosense-wiki/resources/hardware-en/optical-validation/analyze_optical_validation.py','exact_gitlab_source_path':optical.relative_to(ROOT).as_posix(),'proposed_url':BASE+'/-/blob/main/code/aerosense/visualization/aerosense-wiki/resources/hardware-en/optical-validation/analyze_optical_validation.py','local_exists':optical.exists(),'sha256':digest(optical) if optical.is_file() else None,'bytes':optical.stat().st_size if optical.is_file() else None,'note':'Parent authorized preserving the exact 14,265-byte local source; do not substitute the different 8,466-byte earlier script.'},'records':records}
(OUT/'gitlab-hosting-correction-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(OUT/'pending-static-download-upload-candidates.json').write_text(json.dumps({'status':'Plan only; no public URLs invented and no uploads made. Root must approve hosting class and verify upload before URL edits.','count':len(uploads),'bytes':sum(x['bytes'] for x in uploads.values()),'files':list(uploads.values())},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(plan['summary'],ensure_ascii=False,indent=2))
