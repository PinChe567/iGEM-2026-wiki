"""Refresh changed/new small files after the completed full scientific read.

Reuse only original research digests with unchanged size and an mtime earlier
than this run's initial audit. A completed full read compared the original
scientific payload to these digests; ZIP readback will verify them again.
All administrative files and all newer/new files are hashed here.
"""
from pathlib import Path
import csv
import importlib.util
import json
import sys
sys.dont_write_bytecode=True
WORK=Path(__file__).resolve().parents[3]
ROOT=WORK/'zenodo-release'
AUDIT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('archive_tools',ROOT/'00-guide/archive_tools.py')
tool=importlib.util.module_from_spec(spec);spec.loader.exec_module(tool)
baseline_path=AUDIT/'pre-repack-inventory.json'
baseline=json.loads(baseline_path.read_text(encoding='utf-8'))
cutoff=baseline_path.stat().st_mtime_ns

# Topic references can overlap. Recount their unique union, never add directory
# counts naively. This keeps late additions visible without rewriting science.
catalog=ROOT/'00-guide/DATA_CATALOG.csv'
with catalog.open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);fields=reader.fieldnames;topics=list(reader)
for row in topics:
    refs=set()
    for key in ['raw_or_input_paths','code_paths','output_or_document_paths']:
        for rel in filter(None,row[key].split(';')):
            p=ROOT/rel
            if not p.exists():raise RuntimeError('Missing topic path: '+rel)
            if p.is_file():refs.add(p)
            else:refs.update(q for q in p.rglob('*') if q.is_file())
    row['referenced_unique_file_count']=len(refs)
    row['referenced_bytes']=sum(p.stat().st_size for p in refs)
with catalog.open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(topics)
tool.plan()
files=tool.all_files()
before={p.relative_to(ROOT).as_posix():(p.stat().st_size,p.stat().st_mtime_ns) for p in files}
categories=tool.source_categories();rows=[];reused=0;hashed=0;hashed_bytes=0
for p in files:
    rel=p.relative_to(ROOT).as_posix()
    if rel in [tool.INVENTORY,tool.CHECKSUMS]:continue
    st=p.stat();old=baseline.get(rel)
    cache_ok=('/' in rel and not rel.startswith(('00-guide/','00-provenance/'))
              and old and old['bytes']==st.st_size and st.st_mtime_ns<cutoff)
    if cache_ok:checksum=old['sha256'];reused+=1
    else:checksum=tool.sha(p);hashed+=1;hashed_bytes+=st.st_size
    if (st.st_size,st.st_mtime_ns)!=(p.stat().st_size,p.stat().st_mtime_ns):
        raise RuntimeError('Source changed during final inventory: '+rel)
    rows.append({'path':rel,'bytes':st.st_size,'sha256':checksum,
        'role':tool.classify(rel),'historical_source_categories':';'.join(sorted(categories.get(rel,set())))})
after={p.relative_to(ROOT).as_posix():(p.stat().st_size,p.stat().st_mtime_ns) for p in tool.all_files()}
if before!=after:raise RuntimeError('Source changed during final inventory; retry after edits finish.')
with (ROOT/tool.INVENTORY).open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['path','bytes','sha256','role','historical_source_categories']);w.writeheader();w.writerows(rows)
hashes=[(r['path'],r['sha256']) for r in rows]+[(tool.INVENTORY,tool.sha(ROOT/tool.INVENTORY))]
(ROOT/tool.CHECKSUMS).write_text(''.join(f'{h}  {p}\n' for p,h in sorted(hashes)),encoding='utf-8')
original_science={r:info for r,info in baseline.items() if '/' in r and not r.startswith(('00-guide/','00-provenance/'))}
new={r['path']:r for r in rows}
missing=sorted(set(original_science)-set(new))
changed=[r for r in original_science if r in new and original_science[r]['sha256']!=new[r]['sha256']]
if missing or changed:raise RuntimeError('Previously retained science differs: '+str({'missing':missing,'changed':changed}))
snap={p.relative_to(ROOT).as_posix():{'bytes':p.stat().st_size,'mtime_ns':p.stat().st_mtime_ns} for p in tool.all_files()}
(AUDIT/'final-source-snapshot.json').write_text(json.dumps(snap,ensure_ascii=False,indent=2),encoding='utf-8')
receipt={'physical_files':len(snap),'total_bytes':sum(x['bytes'] for x in snap.values()),
 'retained_original_scientific_files':len(original_science),'original_scientific_missing':0,'original_scientific_changed':0,
 'stable_verified_digests_reused':reused,'new_or_changed_files_hashed':hashed,'new_or_changed_bytes_hashed':hashed_bytes,
 'all_archived_bytes_will_be_verified_by_zip_readback':True,'topics':len(topics)}
(AUDIT/'final-inventory-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(receipt,ensure_ascii=False))
