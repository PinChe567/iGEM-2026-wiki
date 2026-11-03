from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
import csv,datetime,hashlib,json,shutil,urllib.request
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];DOCS=ROOT/'registry_docs_v2';ARCHIVE=ROOT/'zenodo-release'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
receipts=json.loads((ROOT/'aerosense-wiki/igem-upload/verified-official-urls.json').read_text(encoding='utf-8'))
sources=list(DOCS.glob('*.png'));assert len(sources)==14
items=[]
for p in sources:
    assert not any(']('+p.name+')' in md.read_text(encoding='utf-8') for md in DOCS.glob('*.md'))
    match=[r for r in receipts if r['source_sha256']==sha(p)];assert len(match)==1
    items.append((p,match[0]))
def check(item):
    p,r=item
    with urllib.request.urlopen(r['official_url'],timeout=40) as response:body=response.read();status=response.status
    assert status==200 and hashlib.sha256(body).hexdigest()==r['response_sha256'],r['official_url']
    return {'source':p.relative_to(ROOT).as_posix(),'source_absolute':str(p),'bytes':p.stat().st_size,'sha256':sha(p),'official_url':r['official_url'],'remote_sha256':r['response_sha256'],'verification_grade':r['verification_grade'],'note':'Original PNG is preserved unchanged. Existing iGEM AVIF conversion is verified against its recorded remote hash; PNG and AVIF are not claimed byte-identical.'}
with ThreadPoolExecutor(max_workers=8) as pool:records=list(pool.map(check,items))
manifest=ARCHIVE/'manifest.csv'
with manifest.open(encoding='utf-8-sig',newline='') as f:reader=csv.DictReader(f);columns=reader.fieldnames;rows=list(reader)
byhash=defaultdict(list)
for r in rows:byhash[r['sha256']].append(ARCHIVE/r['destination_relative'])
new_count=0
for r in records:
    source=ROOT/r['source'];matches=[p for p in set(byhash[r['sha256']]) if p.is_file() and sha(p)==r['sha256']]
    if matches:canonical=sorted(matches,key=lambda p:(len(str(p)),str(p)))[0]
    else:
        canonical=ARCHIVE/'aerosense-wiki/data/odor-2026-10-21/figures/registry/legacy-curves'/source.name
        assert not canonical.exists();canonical.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,canonical);new_count+=1
    assert sha(canonical)==r['sha256'];r.update(retain_canonical=canonical.relative_to(ROOT).as_posix(),retain_canonical_absolute=str(canonical))
    rows.append({'source_relative':r['source'],'destination_relative':canonical.relative_to(ARCHIVE).as_posix(),'category':'registry-original-historical-curve','sha256':r['sha256'],'bytes':str(r['bytes']),'source_mtime_utc':datetime.datetime.fromtimestamp(source.stat().st_mtime,datetime.timezone.utc).isoformat(),'corresponding_pages':'Registry documentation','direct_references':'Unmodified original PNG retained; official AVIF counterpart verified against existing receipt.'})
with manifest.open('w',encoding='utf-8',newline='') as f:w=csv.DictWriter(f,fieldnames=columns);w.writeheader();w.writerows(rows)
destinations={r['destination_relative']:r for r in rows};categories=defaultdict(lambda:{'files':0,'bytes':0})
for r in destinations.values():categories[r['category']]['files']+=1;categories[r['category']]['bytes']+=int(r['bytes'])
p=ARCHIVE/'summary.json';s=json.loads(p.read_text(encoding='utf-8'));s.update(payload_files=len(destinations),payload_bytes=sum(int(r['bytes']) for r in destinations.values()),manifest_source_records=len(rows),categories=dict(categories));s['registry_original_curve_preservation_2026_10_21']={'original_pngs':14,'original_bytes':sum(r['bytes'] for r in records),'new_canonical_files':new_count,'official_avif_existing_hash_checks':14,'pixel_or_byte_identity_between_formats_claimed':False};p.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUT/'verified-registry-root-png-cleanup-plan.json').write_text(json.dumps({'count':14,'bytes':sum(r['bytes'] for r in records),'new_canonical_files':new_count,'files':records},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pngs_archived':14,'new_canonical_files':new_count,'remote_readbacks':14,'bytes':sum(r['bytes'] for r in records)}))
