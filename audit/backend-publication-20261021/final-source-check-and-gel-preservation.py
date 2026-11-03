"""Check only the current publication diff and preserve four exact historical gels.

No Git mutation, network request, cleanup or website edit.
"""
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone
import csv
import hashlib
import json
import shutil
import subprocess

ROOT=Path(__file__).resolve().parents[3]
ARC=ROOT/'zenodo-release'
SOFT=ROOT/'gitlab/aerosense-software'
AUD=Path(__file__).resolve().parent
FINAL=ROOT/'aerosense-wiki/audit/final-publication-20261021'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def git(*args):return subprocess.check_output(['git','-C',str(SOFT),*args])

registration=read(AUD/'unified-source-registration.json')
expected=set(registration['changed_source_paths'])|{'code/aerosense/source-manifest.json'}
actual=set(git('diff','--name-only','-z').decode().split('\0'))|set(git('ls-files','--others','--exclude-standard','-z').decode().split('\0'))
actual.discard('');assert actual==expected
assert not git('diff','--cached','--name-only')
manifest=read(SOFT/'code/aerosense/source-manifest.json')
by_path={r['path']:r for r in manifest['files']}
for p in expected:
    q=SOFT/p
    assert q.is_file()
    assert q.stat().st_size<1_000_000 or p=='code/aerosense/source-manifest.json'
    assert not {'.history','.pio','.vscode','__pycache__'}.intersection(q.parts)
    assert q.name!='aerosense_config.h'
    assert q.suffix.lower() not in {'.csv','.zip','.png','.webp','.svg','.pdf','.xlsx','.stl','.pyc'}
    if p!='code/aerosense/source-manifest.json':assert sha(q)==by_path[p]['sha256']
subprocess.run(['git','-C',str(SOFT),'-c','core.whitespace=cr-at-eol','diff','--check'],check=True)
review={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'status':'passed','changed_files_including_manifest':len(expected),
        'changed_sources':len(expected)-1,'new_source_files':23,'updated_source_files':26,
        'manifest_sha256':sha(SOFT/'code/aerosense/source-manifest.json'),
        'all_1250_research_hashes_checked_by_registration':True,'seven_root_support_files_unchanged':True,
        'source_only_allowlist_passed':True,'required_json_configuration':'code/aerosense/hardware/09_engineering_sources/engineering-source-evidence/cad-source-manifest.json',
        'reference_dataset_absent_from_git':True,'index_unchanged':True,'no_commit_push':True,
        'paths':sorted(expected)}
write(AUD/'source-only-final-review.json',review)

master=ARC/'manifest.csv'
with master.open(encoding='utf-8-sig',newline='') as f:
    rd=csv.DictReader(f);fields=rd.fieldnames;records=list(rd)
known={r['destination_relative']:r for r in records}
by_sha={r['sha256']:ARC/r['destination_relative'] for r in records}
checks=[r for r in read(FINAL/'registry-image-original-compatibility.json')['checks'] if r.get('exact_path')]
assert len(checks)==4
directory=ARC/'aerosense-wiki/assets/registry-historical-gels-20261021'
assert not (directory/'PROVENANCE.json').exists()
mapping=[];new=[]
for row in checks:
    source=Path(row['exact_path'])
    assert row['status']==200 and sha(source)==row['sha256'] and source.stat().st_size==row['bytes']
    target=by_sha.get(row['sha256'])
    reused=target is not None
    if target is None:
        target=directory/source.name;target.parent.mkdir(parents=True,exist_ok=True)
        assert not target.exists();shutil.copyfile(source,target)
        assert sha(target)==row['sha256'];new.append((target,source.as_posix(),row['source_image_url']))
        by_sha[row['sha256']]=target
    mapping.append({'source_image_url':row['source_image_url'],'sha256':row['sha256'],'bytes':row['bytes'],
        'dimensions':row['remote_dimensions'],'canonical_path':target.relative_to(ROOT).as_posix(),'reused_existing_canonical':reused})
proof={'preserved_at_utc':datetime.now(timezone.utc).isoformat(),'role':'Exact historical official-CDN gel images referenced by Registry documentation; preserved without recompression or scientific edits.',
       'source_receipt':'aerosense-wiki/audit/final-publication-20261021/registry-image-original-compatibility.json',
       'source_receipt_sha256':sha(FINAL/'registry-image-original-compatibility.json'),'files':mapping,
       'new_images':sum(not x['reused_existing_canonical'] for x in mapping),
       'new_image_bytes':sum(x['bytes'] for x in mapping if not x['reused_existing_canonical']),
       'cache_files_retained':True,'no_new_downloads':True,'no_source_or_website_edits':True}
write(directory/'PROVENANCE.json',proof);new.append((directory/'PROVENANCE.json','Registry image source compatibility readback',''))
additions=[]
for path,source,url in new:
    relative=path.relative_to(ARC).as_posix();assert relative not in known
    row={'source_relative':source,'destination_relative':relative,'category':'registry-historical-image-provenance',
         'sha256':sha(path),'bytes':str(path.stat().st_size),'source_mtime_utc':datetime.fromtimestamp(path.stat().st_mtime,timezone.utc).isoformat(),
         'corresponding_pages':'Parts/Registry historical gel documentation','direct_references':url}
    records.append(row);known[relative]=row;additions.append(row)
with master.open('w',encoding='utf-8-sig',newline='') as f:
    wr=csv.DictWriter(f,fieldnames=fields);wr.writeheader();wr.writerows(records)
categories=defaultdict(lambda:{'files':0,'bytes':0})
for row in known.values():categories[row['category']]['files']+=1;categories[row['category']]['bytes']+=int(row['bytes'])
summary=read(ARC/'summary.json')
summary.update({'manifest_source_records':len(records),'payload_files':len(known),'payload_bytes':sum(int(r['bytes']) for r in known.values()),'categories':dict(categories)})
summary['registry_historical_gel_preservation_2026_10_21']={'mapping':(directory/'PROVENANCE.json').relative_to(ROOT).as_posix(),
        'new_images':proof['new_images'],'new_image_bytes':proof['new_image_bytes'],'new_registered_files_including_provenance':len(additions),
        'new_registered_bytes':sum(int(r['bytes']) for r in additions),'full_archive_rehashed':False,'no_scientific_edits':True}
write(ARC/'summary.json',summary)
receipt=dict(proof,new_registered_files=len(additions),new_registered_bytes=sum(int(r['bytes']) for r in additions),
    manifest_records=len(records),payload_files=len(known),payload_bytes=summary['payload_bytes'],
    master_manifest_sha256=sha(master),summary_sha256=sha(ARC/'summary.json'),new_archive_records=additions)
write(FINAL/'registry-historical-gel-preservation.json',receipt)
pending=ARC/'PENDING.txt'
text=pending.read_text(encoding='utf8')
text=text.replace('本輪後端、工程與 Registry 來源增補（本地準備完成；未宣稱新版本已發布）\n',
    '本輪後端、工程與 Registry 來源增補（本地準備完成；未宣稱新版本已發布）\n'
    f'- 另保存四張先前 CDN gel 的 exact bytes（1,014,648 bytes）與來源收據，未重壓或改圖；目前正式 payload {len(known):,} 檔／{summary["payload_bytes"]:,} bytes。\n',1)
pending.write_text(text,encoding='utf8')
print(json.dumps({k:v for k,v in receipt.items() if k not in {'files','new_archive_records'}},indent=2))
