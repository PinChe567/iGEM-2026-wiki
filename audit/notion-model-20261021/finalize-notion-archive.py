"""Finish the interrupted receipt and preserve only the new public source proof."""
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
import csv, hashlib, json, shutil
ROOT=Path(__file__).resolve().parents[3];AUD=Path(__file__).resolve().parent;ARC=ROOT/'zenodo-release'
PKG=ARC/'aerosense-wiki/data/notion-model-2026-10-21'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,value):p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
now=datetime.now(timezone.utc).isoformat()
master=ARC/'manifest.csv';before=sha(master)
with master.open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);fields=reader.fieldnames;records=list(reader)
prefix=PKG.relative_to(ARC).as_posix()+'/'
initial=[row for row in records if row['destination_relative'].startswith(prefix)]
assert len(initial)==29
assert sum(int(row['bytes']) for row in initial)==4264162
for row in initial:
    path=ARC/row['destination_relative']
    assert sha(path)==row['sha256'] and path.stat().st_size==int(row['bytes'])
publication=read(AUD/'software-publication-readback.json')
assert publication['all_pass'] and publication['passed']==5
target=PKG/'verification/software-publication-readback.json'
assert not target.exists()
shutil.copyfile(AUD/'software-publication-readback.json',target)
digest=sha(target)
assert not any(row['sha256']==digest for row in records)
added={'source_relative':(AUD/'software-publication-readback.json').relative_to(ROOT).as_posix(),
       'destination_relative':target.relative_to(ARC).as_posix(),'category':'notion-model-source-and-figures',
       'sha256':digest,'bytes':str(target.stat().st_size),
       'source_mtime_utc':datetime.fromtimestamp(target.stat().st_mtime,timezone.utc).isoformat(),
       'corresponding_pages':'Model; Engineering; Software manuscript source','direct_references':''}
records.append(added)
assert sha(master)==before,'Concurrent archive manifest change; retry after coordination.'
with master.open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(records)
known={row['destination_relative']:row for row in records}
cats=defaultdict(lambda:{'files':0,'bytes':0})
for row in known.values():cats[row['category']]['files']+=1;cats[row['category']]['bytes']+=int(row['bytes'])
summary=read(ARC/'summary.json')
summary.update(manifest_source_records=len(records),payload_files=len(known),payload_bytes=sum(int(row['bytes']) for row in known.values()),categories=dict(cats))
batch=summary['notion_model_update_2026_10_21']
batch.update(status='Canonical source preserved; four new source files and manifest published and verified. Wiki deployment is separate.',
             new_canonical_files=30,new_canonical_bytes=4264162+target.stat().st_size,
             software_commit=publication['commit'],software_public_raw_GET_pass='5/5',
             software_source_files=1254,software_source_bytes=12105891,
             software_manifest_sha256=publication['source_manifest_sha256'],
             public_readback_canonical=added['destination_relative'],
             root_navigation_preserved=True,
             pending_txt_note='PENDING.txt was removed or moved by concurrent archive organization before status write. Not recreated; README/START_HERE/00-guide navigation preserved.')
write(ARC/'summary.json',summary)
receipt={'completed_at_utc':now,'initial_registration_files':29,'initial_registration_bytes':4264162,
         'new_canonical_files':30,'new_canonical_bytes':batch['new_canonical_bytes'],
         'payload_files':len(known),'payload_bytes':summary['payload_bytes'],'manifest_records':len(records),
         'master_manifest_sha256':sha(master),'all_30_package_files_verified':True,
         'new_records':initial+[added],'software_commit':publication['commit'],'software_full_public_GET_SHA_pass':'5/5',
         'existing_archive_navigation_preserved':True,'PENDING_recreated':False,
         'independent_archive_reorganization_observed':'README/START_HERE now point to 00-guide/00-provenance; one preexisting extra record is outside this 30-file package.',
         'only_new_package_files_hashed':True,'cloud_zenodo_publication':False,'site_or_github_edits':False,
         'protected_83_blocked_files_touched':False,
         'temporary_removals_this_task':{'files':2,'bytes':247691,'receipts':['removed-uncredited-anatomy-candidate.json','removed-transient-pathway-avif.json']}}
write(AUD/'archive-package-registration.json',receipt)
print(json.dumps({k:v for k,v in receipt.items() if k!='new_records'},indent=2))
