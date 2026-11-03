"""Combine fully verified partial packages; check the final union without
rehashing unchanged 22 GB raw acquisitions a second time.
"""
from pathlib import Path
import csv
import hashlib
import json
import zipfile

AUDIT=Path(__file__).resolve().parent
WORK=AUDIT.parents[2]
ROOT=WORK/'zenodo-release'
OUT=WORK/'zenodo-upload'
PREFIX='AeroSense-NTHU-2026/'
logs=['raw-package.log','supporting-package.log','final-package.log']
packages={};evidence={}
for name in logs:
    p=AUDIT/name
    lines=[x for x in p.read_text(encoding='utf-8-sig').splitlines() if x.startswith('VERIFIED ')]
    if not lines:raise RuntimeError('No successful verification receipt: '+name)
    receipt=json.loads(lines[-1][9:])
    assert receipt['all_member_sha256_and_crc_verified'] is True
    for row in receipt['packages']:
        packages[row['package_id']]=row
        evidence[row['package_id']]={'log':name,'mtime_ns':p.stat().st_mtime_ns}
assert set(packages)=={'00','01','02a','02b','02c','02d','03','04','05','06'}
source_snapshot=json.loads((AUDIT/'final-source-snapshot.json').read_text(encoding='utf-8'))
support_snapshot=json.loads((AUDIT/'verified-support-source-snapshot.json').read_text(encoding='utf-8'))
actual={p.relative_to(ROOT).as_posix():{'bytes':p.stat().st_size,'mtime_ns':p.stat().st_mtime_ns} for p in ROOT.rglob('*') if p.is_file()}
if source_snapshot!=actual:raise RuntimeError('Source changed after final inventory.')
mapping={r['path']:r['package_id'] for r in csv.DictReader((ROOT/'00-guide/PACKAGE_MAP.csv').open(encoding='utf-8-sig'))}
if set(mapping)!=set(actual):raise RuntimeError('Final package map differs from source set.')
seen=set()
for pid,row in sorted(packages.items()):
    path=OUT/row['local_zip_path'];st=path.stat()
    if st.st_size!=row['zip_bytes'] or st.st_mtime_ns>evidence[pid]['mtime_ns']:
        raise RuntimeError('Archive changed since its complete SHA/CRC readback: '+str(path))
    expected={r for r,g in mapping.items() if g==pid}
    with zipfile.ZipFile(path) as z:
        infos=z.infolist()
        if len(infos)!=len(expected) or {i.filename for i in infos}!={PREFIX+r for r in expected}:
            raise RuntimeError('Archive members differ from final map: '+pid)
        for info in infos:
            rel=info.filename[len(PREFIX):]
            if rel in seen:raise RuntimeError('Duplicate archived path: '+rel)
            if info.file_size!=actual[rel]['bytes']:raise RuntimeError('Member size differs: '+rel)
            if pid not in {'00','01','03'} and support_snapshot.get(rel)!=actual[rel]:
                raise RuntimeError('Previously verified source changed: '+rel)
            seen.add(rel)
if seen!=set(actual):raise RuntimeError('Missing archived source files.')
ordered=[packages[k] for k in sorted(packages)]
with (OUT/'PACKAGE_INDEX.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(ordered[0]));w.writeheader();w.writerows(ordered)
(OUT/'ARCHIVE_CHECKSUMS.sha256').write_text(''.join(f"{r['sha256']}  {r['zip_filename']}\n" for r in ordered),encoding='utf-8')
receipt={'archive_count':len(ordered),'physical_source_files':len(seen),
 'source_bytes':sum(x['bytes'] for x in actual.values()),'archive_bytes':sum(x['zip_bytes'] for x in ordered),
 'each_member_verified_with_full_sha256_and_crc':True,'duplicate_paths_across_archives':0,
 'missing_files':0,'unchanged_completed_archives_reused':7,
 'reuse_checks':'Earlier full member SHA-256+CRC readback; unchanged source size/mtime; unchanged archive size/mtime; final member-list/size union compared against final source inventory.',
 'verification_logs':logs,'packages':ordered}
(AUDIT/'final-delivery-verification.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in receipt.items() if k!='packages'},ensure_ascii=False))
