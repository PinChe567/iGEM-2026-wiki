"""Preserve and index only the 12 approved stale-footer removals; no Git writes."""
from pathlib import Path
from datetime import datetime,timezone
from collections import defaultdict
import csv,json,hashlib,shutil,subprocess
ROOT=Path(__file__).resolve().parents[3];ARC=ROOT/'zenodo-release';SOFT=ROOT/'gitlab/aerosense-software';AUD=Path(__file__).resolve().parent
DEST=ARC/'reproduction-source/registry-publication-footer-cleanup-20261021'
BASE='df7b3bc9731fc03205e0a1ac907e90e634d693fb'
REMOVAL=' These Markdown entries are prepared for Registry. A public attachment URL does not establish that the corresponding Registry documentation has been saved.'
GENERATOR='code/aerosense/parts-analysis/integrate_disturbance_characterisation.py'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def git(*args):return subprocess.check_output(['git','-C',str(SOFT),*args])
assert git('rev-parse','HEAD').decode().strip()==BASE
assert not git('diff','--cached','--name-only') and not git('ls-files','--others','--exclude-standard')
paths=[x for x in git('diff','--name-only','-z').decode().split('\0') if x]
assert len(paths)==12 and GENERATOR in paths
assert sum(p.startswith('docs/aerosense/parts/') and p.endswith('.md') for p in paths)==11
assert not DEST.exists(),'Immutable footer-cleanup source edition already prepared.'
manifest_path=SOFT/'code/aerosense/source-manifest.json';manifest=read(manifest_path)
freeze_path=ROOT/'aerosense-wiki/audit/final-publication-20261021/registry-footer-cleanup-source-receipt.json'
freeze=read(freeze_path);assert freeze['exact_removed_text']==REMOVAL and freeze['replacement']==''
manifest_before=sha(manifest_path);assert manifest_before=='b2ad891d8eb8bdfadd1ad100ef855df71dd08d1a5545096a3faec81988573e2e'
rows={x['path']:x for x in manifest['files']}
master=ARC/'manifest.csv'
with master.open(encoding='utf-8-sig',newline='') as f:
 rd=csv.DictReader(f);fields=rd.fieldnames;records=list(rd)
known={r['destination_relative']:r for r in records};bysha={r['sha256']:ARC/r['destination_relative'] for r in records}
changes=[];new=[];now=datetime.now(timezone.utc).isoformat()
for path in paths:
 before=git('show','HEAD:'+path);after=(SOFT/path).read_bytes()
 old=before.decode('utf8').replace('\r\n','\n');current=after.decode('utf8').replace('\r\n','\n')
 assert old.count(REMOVAL)==1 and current==old.replace(REMOVAL,''),path
 if path.endswith('.md'):assert sha(ROOT/'registry_docs_v2'/Path(path).name)==sha(SOFT/path)
 digest=hashlib.sha256(after).hexdigest();target=bysha.get(digest);reused=target is not None
 if target is None:
  target=DEST/'sources'/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(SOFT/path,target)
  assert sha(target)==digest;new.append((target,(SOFT/path).relative_to(ROOT).as_posix()));bysha[digest]=target
 else:assert sha(target)==digest
 rows[path].update(source=target.relative_to(ROOT).as_posix(),source_bytes=len(after),source_sha256=digest,bytes=len(after),sha256=digest,
  selection='Only the two obsolete prepublication administrative sentences removed; all scientific text, titles, tables, values, image paths and links otherwise byte-equivalent after newline normalization.')
 changes.append({'path':path,'before_sha256':hashlib.sha256(before).hexdigest(),'sha256':digest,'bytes':len(after),
  'canonical':target.relative_to(ROOT).as_posix(),'reused_existing_canonical':reused,'exact_footer_only_change':True})
assert len(manifest['files'])==1250
manifest['summary']['retained_bytes']=sum(r['bytes'] for r in manifest['files'])
manifest['status']='Reviewed source edition with obsolete administrative footer removed. Previous backend/Engineering edition df7b3bc is public; this narrow prose-only edition is prepared for authorized normal publication.'
manifest['finalized_at_utc']=now
manifest['backend_engineering_registry_update']['publication_status']='Published in df7b3bc9731fc03205e0a1ac907e90e634d693fb; all50 changed files passed anonymous raw GET/SHA.'
manifest['registry_footer_cleanup']={'base_public_commit':BASE,'changed_sources':12,'affected_markdown_documents':11,
 'scientific_data_title_links_images_unchanged':True,'exact_removed_text':REMOVAL.strip(),'paths':paths,
 'source_manifest_before_sha256':manifest_before,'publication_status':'Prepared for authorized normal commit/push; public Registry entries require separate resave/readback.'}
write(manifest_path,manifest);shutil.copyfile(manifest_path,DEST/'source-manifest.json');new.append((DEST/'source-manifest.json',manifest_path.relative_to(ROOT).as_posix()))
provenance={'prepared_at_utc':now,'base_commit':BASE,'exact_removed_text':REMOVAL.strip(),'changes':changes,
 'source_manifest_sha256':sha(manifest_path),'scientific_prose_changed':False,'scientific_data_title_links_images_unchanged':True,
 'source_freeze_receipt_sha256':sha(freeze_path),
 'no_full_payload_image_or_website_copy':True,'old_exact_source_editions_retained':True,'no_network_or_git_operations':True}
write(DEST/'PROVENANCE.json',provenance);new.append((DEST/'PROVENANCE.json','Approved administrative footer cleanup provenance'))
additions=[]
for p,source in new:
 relative=p.relative_to(ARC).as_posix();assert relative not in known
 row={'source_relative':source,'destination_relative':relative,'category':'registry-publication-source',
  'sha256':sha(p),'bytes':str(p.stat().st_size),'source_mtime_utc':datetime.fromtimestamp(p.stat().st_mtime,timezone.utc).isoformat(),
  'corresponding_pages':'Registry Test2 characterisation source; administrative footer cleanup','direct_references':''}
 records.append(row);known[relative]=row;additions.append(row)
with master.open('w',encoding='utf-8-sig',newline='') as f:
 wr=csv.DictWriter(f,fieldnames=fields);wr.writeheader();wr.writerows(records)
cats=defaultdict(lambda:{'files':0,'bytes':0})
for row in known.values():cats[row['category']]['files']+=1;cats[row['category']]['bytes']+=int(row['bytes'])
summary=read(ARC/'summary.json');summary.update(manifest_source_records=len(records),payload_files=len(known),payload_bytes=sum(int(r['bytes']) for r in known.values()),categories=dict(cats))
summary['registry_administrative_footer_cleanup_2026_10_21']={'status':'Source edition prepared; public source and11Registry resaves pending',
 'sources':12,'new_canonical_files':len(additions),'new_canonical_bytes':sum(int(r['bytes']) for r in additions),
 'source_manifest_sha256':sha(manifest_path),'software_source_bytes':manifest['summary']['retained_bytes'],
 'data_values_titles_links_images_changed':False,'full_archive_rehashed':False}
write(ARC/'summary.json',summary)
receipt={'prepared_at_utc':now,'base_commit':BASE,'changes':changes,'software_changed_paths':sorted(paths+['code/aerosense/source-manifest.json']),
 'software_manifest_sha256':sha(manifest_path),'software_source_files':1250,'software_source_bytes':manifest['summary']['retained_bytes'],
 'new_archive_files':len(additions),'new_archive_bytes':sum(int(r['bytes']) for r in additions),
 'payload_files':len(known),'payload_bytes':summary['payload_bytes'],'manifest_records':len(records),
 'master_manifest_sha256':sha(master),'no_git_index_commit_push':True,'new_archive_records':additions}
write(AUD/'registry-footer-source-preparation.json',receipt)
print(json.dumps({k:v for k,v in receipt.items() if k not in {'changes','software_changed_paths','new_archive_records'}},indent=2))
