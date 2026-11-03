"""Apply the release owner's narrow browser-test scope correction before commit."""
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone
import json,csv,hashlib,shutil
ROOT=Path(__file__).resolve().parents[3]
ARC=ROOT/'zenodo-release';SOFT=ROOT/'gitlab/aerosense-software';AUD=Path(__file__).resolve().parent
BACK=ARC/'reproduction-source/hardware-odor-backend-20261021'
SNAP=ARC/'reproduction-source/backend-engineering-registry-publication-20261021'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
guide=BACK/'publication/PUBLICATION_GUIDE.md';before=sha(guide)
assert before=='ca6c068ecd4357729ee35689e62588d7e41a59ae74e215f9c8db10c76d282861'
text=guide.read_text(encoding='utf8').replace('node test_history_browser.cjs\n','')
needle='These tests use synthetic measurements, loopback HTTP fixtures and a virtual DOM.'
assert text.count(needle)==1
after='The optional `node test_history_browser.cjs` check launches a real browser through Playwright and requires Playwright and its browser dependency. It was not executed in this publication review because that dependency was unavailable; it is separate from the virtual-DOM checks above.\n\n'
text=text.replace('`test_adc_firmware.py` additionally',after+'`test_adc_firmware.py` additionally',1)
guide.write_text(text,encoding='utf8')
software_path='code/aerosense/hardware/03_software/PUBLICATION_GUIDE.md'
shutil.copyfile(guide,SOFT/software_path)
# Preserve the correction in the local authoring helper as well; it is not a Git source.
helper=AUD/'finalize-public-source.py'
h=helper.read_text(encoding='utf8').replace('node test_history_browser.cjs\n','')
h=h.replace('`test_adc_firmware.py` additionally',after+'`test_adc_firmware.py` additionally',1)
helper.write_text(h,encoding='utf8')
prepared=read(AUD/'backend-software-preparation.json')
for row in prepared['items']:
 if row['path']==software_path:row.update(sha256=sha(guide),bytes=guide.stat().st_size)
prepared['manifest_registration']='Complete; reviewed source update ready for authorized normal commit/push.'
write(AUD/'backend-software-preparation.json',prepared)
mapping=read(BACK/'SOURCE-MAPPING.json');mapping['software_source_selection']=prepared['items'];write(BACK/'SOURCE-MAPPING.json',mapping)
manifest_path=SOFT/'code/aerosense/source-manifest.json';manifest=read(manifest_path);oldmanifest=sha(manifest_path)
for row in manifest['files']:
 if row['path']==software_path:row.update(sha256=sha(guide),bytes=guide.stat().st_size,source_sha256=sha(guide),source_bytes=guide.stat().st_size)
manifest['summary']['retained_bytes']=sum(r['bytes'] for r in manifest['files'])
manifest['finalized_at_utc']=datetime.now(timezone.utc).isoformat()
write(manifest_path,manifest);shutil.copyfile(manifest_path,SNAP/'source-manifest.json')
prov=read(SNAP/'PROVENANCE.json');prov['source_manifest_after_sha256']=sha(manifest_path)
for row in prov['changed_sources']:
 if row['path']==software_path:row.update(sha256=sha(guide),bytes=guide.stat().st_size,source_sha256=sha(guide),source_bytes=guide.stat().st_size)
prov['prepublication_guide_correction']={'previous_sha256':before,'current_sha256':sha(guide),'scope':'Separate optional real-Playwright history test from synthetic/virtual-DOM tests; explicitly record not executed. No code or numerical changes.'}
write(SNAP/'PROVENANCE.json',prov)
updated=[guide,BACK/'SOURCE-MAPPING.json',SNAP/'source-manifest.json',SNAP/'PROVENANCE.json']
master=ARC/'manifest.csv'
with master.open(encoding='utf-8-sig',newline='') as f:
 rd=csv.DictReader(f);fields=rd.fieldnames;records=list(rd)
updates={p.relative_to(ARC).as_posix():p for p in updated}
for row in records:
 if row['destination_relative'] in updates:
  p=updates[row['destination_relative']];row.update(sha256=sha(p),bytes=str(p.stat().st_size),source_mtime_utc=datetime.fromtimestamp(p.stat().st_mtime,timezone.utc).isoformat())
with master.open('w',encoding='utf-8-sig',newline='') as f:
 wr=csv.DictWriter(f,fieldnames=fields);wr.writeheader();wr.writerows(records)
unique={r['destination_relative']:r for r in records};cats=defaultdict(lambda:{'files':0,'bytes':0})
for row in unique.values():cats[row['category']]['files']+=1;cats[row['category']]['bytes']+=int(row['bytes'])
summary=read(ARC/'summary.json');summary.update(payload_bytes=sum(int(r['bytes']) for r in unique.values()),categories=dict(cats))
status=summary['backend_engineering_registry_2026_10_21'];status.update(software_manifest_sha256=sha(manifest_path),software_source_bytes=manifest['summary']['retained_bytes'])
registration=read(AUD/'unified-source-registration.json')
new_paths={x['destination_relative'] for x in registration['new_archive_records']}
status['new_registered_bytes']=sum(int(unique[p]['bytes']) for p in new_paths)
write(ARC/'summary.json',summary)
receipt={'corrected_at_utc':datetime.now(timezone.utc).isoformat(),'guide_before_sha256':before,'guide_after_sha256':sha(guide),
 'manifest_before_sha256':oldmanifest,'manifest_after_sha256':sha(manifest_path),'software_source_bytes':manifest['summary']['retained_bytes'],
 'payload_files':len(unique),'payload_bytes':summary['payload_bytes'],'updated_registered_paths':sorted(updates),
 'master_manifest_sha256':sha(master),'no_numeric_or_executable_code_changes':True}
write(AUD/'guide-test-scope-correction.json',receipt)
print(json.dumps(receipt,indent=2))
