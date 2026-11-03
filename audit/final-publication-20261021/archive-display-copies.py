"""Archive authorized derived display outputs without overwriting any original."""
from pathlib import Path
from collections import defaultdict
import csv,datetime,hashlib,json,os,shutil
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];SITE=ROOT/'aerosense-wiki';ARCHIVE=ROOT/'zenodo-release'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
prior=json.loads((OUT/'proposed-display-media-cleanup.json').read_text(encoding='utf-8'))
items=prior['eligible_files']+prior['retained_or_pending']
protected={'aerosense-wiki/assets/editorial/claude-v13/hero-draft-contact-sheet.png','aerosense-wiki/design_system/assets/signal-atlas-icons.svg'}
items=sorted([r for r in items if r['source'] not in protected],key=lambda r:r['source'])
inventory=json.loads((OUT/'all-assets-inventory.json').read_text(encoding='utf-8'))
live={p:a['referenced_by'] for a in inventory['assets'] for p in a['paths']}
receipts=json.loads((SITE/'igem-upload/verified-official-urls.json').read_text(encoding='utf-8'))
byhash=defaultdict(list)
for r in receipts:byhash[r['source_sha256']].append(r)
fresh={}
for name in ['official-readback.json','new-svg-readback.json','new-game-art-readback.json','existing-registry-figures-readback.json']:
    d=json.loads((OUT/name).read_text(encoding='utf-8'))
    for r in d.get('assets',d.get('results',[])):
        if r.get('ok'):fresh[r.get('official_url',r.get('url'))]=r.get('response_sha256',r.get('sha256'))
manifest_path=ARCHIVE/'manifest.csv'
with manifest_path.open(encoding='utf-8-sig',newline='') as f:reader=csv.DictReader(f);columns=reader.fieldnames;rows=list(reader)
canonical_by_hash=defaultdict(list);sizes={r['bytes'] for r in items}
for directory,dirs,files in os.walk(ARCHIVE):
    dirs[:]=[d for d in dirs if d not in {'node_modules','.git','__pycache__'}]
    for filename in files:
        p=Path(directory)/filename
        if p.suffix.lower() not in {'.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.woff','.woff2','.ttf','.otf'}:continue
        if p.stat().st_size in sizes:canonical_by_hash[sha(p)].append(p)
existing_rows={(r['source_relative'],r['destination_relative'],r['sha256']) for r in rows}
archived=[];pending=[];new_count=0;new_bytes=0
for item in items:
    source=ROOT/item['source'];h=sha(source);assert h==item['sha256']
    references=live.get(source.relative_to(SITE).as_posix(),[]) if source.is_relative_to(SITE) else []
    if source.is_relative_to(ROOT/'registry_docs_v2'):
        rel=source.relative_to(ROOT/'registry_docs_v2').as_posix()
        references=[p.name for p in (ROOT/'registry_docs_v2').glob('*.md') if ']('+rel+')' in p.read_text(encoding='utf-8')]
    if references:pending.append({'source':item['source'],'reason':'Still locally referenced','references':references});continue
    verified=[r for r in byhash[h] if fresh.get(r['official_url'])==r['response_sha256']]
    # All selected trees are generated scientific output or the eight migrated game SVGs.
    if '/game/' in item['source'] and not verified:pending.append({'source':item['source'],'reason':'Game art lacks verified official replacement'});continue
    matches=canonical_by_hash[h]
    created=False;collision=None
    if matches:canonical=sorted(matches,key=lambda p:(len(str(p)),str(p)))[0]
    else:
        if source.is_relative_to(ROOT/'registry_docs_v2/figures'):
            canonical=ARCHIVE/'aerosense-wiki/data/odor-2026-10-21/figures/registry'/source.relative_to(ROOT/'registry_docs_v2/figures')
        elif source.is_relative_to(SITE/'game'):
            canonical=ARCHIVE/'aerosense-wiki/reproduction-source/game'/source.relative_to(SITE/'game')
        else:canonical=ARCHIVE/source.relative_to(ROOT)
        if canonical.exists() and sha(canonical)!=h:
            collision={'existing':canonical.relative_to(ROOT).as_posix(),'retained_sha256':sha(canonical)}
            canonical=canonical.with_name(canonical.stem+'-'+h[:12]+canonical.suffix)
        canonical.parent.mkdir(parents=True,exist_ok=True)
        if not canonical.exists():shutil.copy2(source,canonical);created=True;new_count+=1;new_bytes+=source.stat().st_size
        assert sha(canonical)==h
        canonical_by_hash[h].append(canonical)
    assert sha(canonical)==h and canonical.stat().st_size==item['bytes']
    destination=canonical.relative_to(ARCHIVE).as_posix()
    key=(item['source'],destination,h)
    if key not in existing_rows:
        rows.append({'source_relative':item['source'],'destination_relative':destination,'category':'publication-derived-display-output','sha256':h,'bytes':str(item['bytes']),'source_mtime_utc':datetime.datetime.fromtimestamp(source.stat().st_mtime,datetime.timezone.utc).isoformat(),'corresponding_pages':'Registry documentation' if item['source'].startswith('registry_docs_v2/') else 'education.html' if '/game/' in item['source'] else 'results.html' if '/fig/odor-' in item['source'] else 'hardware.html','direct_references':'Canonical original retained after authorized display-copy cleanup; public figures use verified official URLs.'});existing_rows.add(key)
    archived.append({'source':item['source'],'source_absolute':str(source),'retain_canonical':canonical.relative_to(ROOT).as_posix(),'retain_canonical_absolute':str(canonical),'bytes':item['bytes'],'sha256':h,'created_new_canonical':created,'preserved_older_artifact':collision,'verified_official_urls':[r['official_url'] for r in verified],'classification':'published official replacement' if verified else 'unreferenced generated scientific/historical output; no CDN upload needed','local_references':[]})
with manifest_path.open('w',encoding='utf-8',newline='') as f:writer=csv.DictWriter(f,fieldnames=columns);writer.writeheader();writer.writerows(rows)
destinations={r['destination_relative']:r for r in rows};categories=defaultdict(lambda:{'files':0,'bytes':0})
for r in destinations.values():categories[r['category']]['files']+=1;categories[r['category']]['bytes']+=int(r['bytes'])
summary_path=ARCHIVE/'summary.json';summary=json.loads(summary_path.read_text(encoding='utf-8'))
summary.update(payload_files=len(destinations),payload_bytes=sum(int(r['bytes']) for r in destinations.values()),manifest_source_records=len(rows),categories=dict(categories),destination_updated_local_date='2026-10-21')
summary['display_output_archival_2026_10_21']={'checked_at_utc':now(),'display_source_files':len(archived),'new_canonical_files':new_count,'new_canonical_bytes':new_bytes,'deduplicated_existing_or_same_run':len(archived)-new_count,'status':'All source/canonical pairs SHA-verified; local display removal is a separate guarded step','protected_editable_sources':sorted(protected),'full_archive_rehashed':False}
summary_path.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'checked_at_utc':now(),'status':'Archived and verified; authorized for guarded individual duplicate removal','files':archived,'count':len(archived),'bytes':sum(r['bytes'] for r in archived),'new_canonical_files':new_count,'new_canonical_bytes':new_bytes,'pending':pending,'protected_editable_sources':sorted(protected),'manifest_sha256':sha(manifest_path),'summary_sha256':sha(summary_path)}
(OUT/'verified-display-cleanup-plan.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['count','bytes','new_canonical_files','new_canonical_bytes','pending']}))
