"""Preserve exact published download bytes without overwriting older research variants."""
from pathlib import Path
from collections import defaultdict
import csv,datetime,hashlib,json,shutil
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];ARCHIVE=ROOT/'zenodo-release'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
pending=[r for r in json.loads((OUT/'upload-staging-cleanup-plan.json').read_text(encoding='utf-8'))['items'] if not r['canonical']]
queue=json.loads((OUT/'official-download-upload-queue.json').read_text(encoding='utf-8'))['queue'];lookup={r['sha256']:r for r in queue}
assert len(pending)==24
manifest=ARCHIVE/'manifest.csv'
with manifest.open(encoding='utf-8-sig',newline='') as f:reader=csv.DictReader(f);columns=reader.fieldnames;rows=list(reader)
byhash=defaultdict(list)
for r in rows:byhash[r['sha256']].append(ARCHIVE/r['destination_relative'])
records=[]
for item in pending:
    q=lookup[item['sha256']];source=ROOT/q['source_paths'][0];assert sha(source)==item['sha256']
    matches=[p for p in set(byhash[item['sha256']]) if p.is_file() and sha(p)==item['sha256']]
    collision=None;created=False
    if matches:canonical=sorted(matches,key=lambda p:(len(str(p)),str(p)))[0]
    else:
        canonical=ARCHIVE/q['source_paths'][0]
        if canonical.exists() and sha(canonical)!=item['sha256']:
            collision={'retained_older_path':canonical.relative_to(ROOT).as_posix(),'retained_older_sha256':sha(canonical)}
            canonical=canonical.parent/'publication-versions-20261021'/(item['sha256'][:12]+'-'+canonical.name)
        canonical.parent.mkdir(parents=True,exist_ok=True)
        if not canonical.exists():shutil.copy2(source,canonical);created=True
    assert sha(canonical)==item['sha256'] and canonical.stat().st_size==item['bytes']
    for source_path in q['source_paths']:
        assert sha(ROOT/source_path)==item['sha256']
        rows.append({'source_relative':source_path,'destination_relative':canonical.relative_to(ARCHIVE).as_posix(),'category':'verified-publication-download-copy','sha256':item['sha256'],'bytes':str(item['bytes']),'source_mtime_utc':datetime.datetime.fromtimestamp((ROOT/source_path).stat().st_mtime,datetime.timezone.utc).isoformat(),'corresponding_pages':';'.join(sorted({p for ref in q['references'] for p in ref['referenced_by']})),'direct_references':'Exact website publication download bytes retained; official CDN full-byte readback recorded separately.'})
    records.append({'staging_source':item['source'],'source_paths':q['source_paths'],'canonical':canonical.relative_to(ROOT).as_posix(),'sha256':item['sha256'],'bytes':item['bytes'],'created_new_canonical':created,'preserved_prior_variant':collision,'official_url':q['official_url']})
with manifest.open('w',encoding='utf-8',newline='') as f:w=csv.DictWriter(f,fieldnames=columns);w.writeheader();w.writerows(rows)
destinations={r['destination_relative']:r for r in rows};categories=defaultdict(lambda:{'files':0,'bytes':0})
for r in destinations.values():categories[r['category']]['files']+=1;categories[r['category']]['bytes']+=int(r['bytes'])
p=ARCHIVE/'summary.json';s=json.loads(p.read_text(encoding='utf-8'));s.update(payload_files=len(destinations),payload_bytes=sum(int(r['bytes']) for r in destinations.values()),manifest_source_records=len(rows),categories=dict(categories));s['publication_download_exact_copy_archive_2026_10_21']={'files':len(records),'bytes':sum(r['bytes'] for r in records),'new_canonical_files':sum(r['created_new_canonical'] for r in records),'preserved_prior_variants':sum(bool(r['preserved_prior_variant']) for r in records)};p.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'files':records,'count':len(records),'bytes':sum(r['bytes'] for r in records),'new_canonical_files':sum(r['created_new_canonical'] for r in records),'source_copies_or_staging_removed':False}
(OUT/'publication-download-archive-receipt.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['count','bytes','new_canonical_files']}))
