"""Incrementally refresh indexes; do not rehash the 25 GB historical payload."""
from pathlib import Path
from datetime import datetime, timezone
import csv, hashlib, json, runpy

AUD=Path(__file__).resolve().parent
ROOT=AUD.parents[2]
ARC=ROOT/'zenodo-release'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
module=runpy.run_path(str(ARC/'00-guide/archive_tools.py'))
assert module['package_id']('aerosense-wiki/data/signal-metric-clarification-2026-10-21/figures/example.svg')=='01'
assert module['package_id']('aerosense-wiki/data/education-learning-comparison-2026-10-21/reported-summary.json')=='05'
module['plan']()
path=ARC/'FILE_MANIFEST.csv'
before=sha(path)
with path.open(encoding='utf-8-sig',newline='') as stream:
    reader=csv.DictReader(stream);fields=reader.fieldnames;old={r['path']:r for r in reader}
categories=module['source_categories']()
actual={p.relative_to(ARC).as_posix():p for p in module['all_files']() if p.name not in ['FILE_MANIFEST.csv','CHECKSUMS.sha256'] or p.parent!=ARC}
missing=sorted(set(old)-set(actual))
assert not missing, f'Unreviewed removed paths: {missing}'
rows=[];hashed=[];reused=0
for rel,p in sorted(actual.items()):
    previous=old.get(rel)
    mutable='/' not in rel or rel.startswith(('00-guide/','00-provenance/'))
    changed_size=previous is not None and int(previous['bytes'])!=p.stat().st_size
    if previous is None or mutable or changed_size:
        digest=sha(p)
        hashed.append({'path':rel,'bytes':p.stat().st_size,'sha256':digest,'reason':'new' if previous is None else 'metadata' if mutable else 'size changed'})
    else:
        digest=previous['sha256'];reused+=1
    rows.append({'path':rel,'bytes':p.stat().st_size,'sha256':digest,'role':module['classify'](rel),
                 'historical_source_categories':';'.join(sorted(categories.get(rel,set())))})
with path.open('w',encoding='utf-8-sig',newline='') as stream:
    writer=csv.DictWriter(stream,fieldnames=fields);writer.writeheader();writer.writerows(rows)
checks=[(r['path'],r['sha256']) for r in rows]+[('FILE_MANIFEST.csv',sha(path))]
(ARC/'CHECKSUMS.sha256').write_text(''.join(f'{h}  {p}\n' for p,h in sorted(checks)),encoding='utf8')
receipt={'at_utc':datetime.now(timezone.utc).isoformat(),'method':'Incremental inventory; prior unchanged payload hashes reused, not a new full archive integrity verification.',
    'old_inventory_rows':len(old),'new_inventory_rows':len(rows),'physical_files':len(rows)+2,'new_paths':len(set(actual)-set(old)),
    'hashed_files':len(hashed),'hashed_bytes':sum(r['bytes'] for r in hashed),'historic_hashes_reused':reused,
    'missing_paths':missing,'file_manifest_before_sha256':before,'file_manifest_sha256':sha(path),
    'checksums_sha256':sha(ARC/'CHECKSUMS.sha256'),'package_map_sha256':sha(ARC/'00-guide/PACKAGE_MAP.csv'),
    'package_mappings':{'signal-metric-clarification':'01 odor assays and microscopy','education-learning-comparison':'05 education'},
    'no_research_data_modified':True,'no_deletions':True,'hashed':hashed}
(AUD/'incremental-archive-inventory.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in receipt.items() if k!='hashed'},indent=2))
