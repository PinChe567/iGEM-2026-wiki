"""Preserve only the final navigation sources; defer final status until CI."""
from pathlib import Path
from datetime import datetime,timezone
import csv,hashlib,json,os,shutil,subprocess
ROOT=Path(__file__).resolve().parents[3];REPO=ROOT/'gitlab/nthu';ARC=ROOT/'zenodo-release'
AUD=ROOT/'aerosense-wiki/audit/final-publication-20261021';DEST=ARC/'reproduction-source/wiki-navigation-source-20261021'
COMMIT='79608d64aac297b48bca47bcb396f82d72e6fc67'
def native(p):
 s=str(p.absolute());return Path('\\\\?\\'+s)if os.name=='nt'and len(s)>=240 and not s.startswith('\\\\?\\')else p
def sha(p):return hashlib.sha256(native(p).read_bytes()).hexdigest()
def write(p,d):native(p.parent).mkdir(parents=True,exist_ok=True);native(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()==COMMIT
selected={'site/js/main.js':'Preserves inline document titles and same-page reference navigation.','site/scripts/build-publication.py':'Makes each clean route use its own source HTML as base, preserving resource resolution and local anchors.','site/publication-files.json':'Unchanged runtime path manifest reused; cache values are generated from source during the normal build.'}
sources=[]
for path,role in selected.items():
 p=REPO/path;normalized=subprocess.check_output(['git','hash-object','--path='+path,str(p)],cwd=REPO,text=True).strip();blob=subprocess.check_output(['git','rev-parse',COMMIT+':'+path],cwd=REPO,text=True).strip();assert normalized==blob
 body=subprocess.check_output(['git','show',COMMIT+':'+path],cwd=REPO)
 sources.append({'repository_path':path,'role':role,'sha256':sha(p),'bytes':native(p).stat().st_size,'committed_git_blob':blob,'committed_sha256':hashlib.sha256(body).hexdigest(),'committed_bytes':len(body)})
wanted={r['sha256']for r in sources};sizes={r['bytes']for r in sources};existing={}
for relative in subprocess.check_output(['rg','--files','--hidden','zenodo-release'],cwd=ROOT,text=True,encoding='utf8').splitlines():
 p=ROOT/relative
 if native(p).stat().st_size not in sizes:continue
 digest=sha(p)
 if digest in wanted:existing.setdefault(digest,[]).append(p)
rows=[];new=[]
for row in sources:
 candidates=existing.get(row['sha256'],[])
 if candidates:target=min(candidates,key=lambda p:(len(str(p)),str(p)));action='reuse_exact_canonical'
 else:
  target=DEST/row['repository_path'];assert not native(target).exists();native(target.parent).mkdir(parents=True,exist_ok=True);shutil.copyfile(native(REPO/row['repository_path']),native(target));assert sha(target)==row['sha256'];new.append({**row,'canonical':target.relative_to(ROOT).as_posix()});action='preserve_navigation_source_difference'
 rows.append({**row,'canonical':target.relative_to(ROOT).as_posix(),'action':action})
for r in rows:assert sha(REPO/r['repository_path'])==r['sha256']and sha(ROOT/r['canonical'])==r['sha256']
metadata={'created_at_utc':datetime.now(timezone.utc).isoformat(),'repository':'https://gitlab.igem.org/2026/nthu','commit':COMMIT,'scope':'Only two changed navigation/publication sources plus a reused runtime manifest. Scientific prose, data, external download URLs and Software source are unchanged. Generated page cache hashes are reproducible build output, not archived as whole-site duplicates.','ci_status_at_preservation':'Await root-confirmed final pipeline success.','files_checked':len(rows),'new_source_files':len(new),'new_source_bytes':sum(r['bytes']for r in new),'files':rows}
mapping=DEST/'PROVENANCE.json';write(mapping,metadata)
master=ARC/'manifest.csv'
with master.open(encoding='utf-8-sig',newline='')as f:
 reader=csv.DictReader(f);fields=reader.fieldnames;records=list(reader)
known={r['destination_relative']:r for r in records};added=[]
for p,source,category in [(ROOT/r['canonical'],'gitlab/nthu/'+r['repository_path'],'wiki-publication-navigation-source')for r in new]+[(mapping,mapping.relative_to(ROOT).as_posix(),'publication-source-provenance')]:
 relative=p.relative_to(ARC).as_posix();digest=sha(p);size=native(p).stat().st_size
 if relative in known:assert known[relative]['sha256']==digest;continue
 record={'source_relative':source,'destination_relative':relative,'category':category,'sha256':digest,'bytes':str(size),'source_mtime_utc':datetime.fromtimestamp(native(p).stat().st_mtime,timezone.utc).isoformat(),'corresponding_pages':'clean-route page navigation and inline PDF titles','direct_references':''};records.append(record);known[relative]=record;added.append(record)
with master.open('w',encoding='utf-8-sig',newline='')as f:
 writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(records)
receipt={k:v for k,v in metadata.items()if k!='files'};receipt.update({'canonical_mapping':mapping.relative_to(ROOT).as_posix(),'canonical_mapping_sha256':sha(mapping),'new_registered_files':len(added),'new_registered_bytes':sum(int(r['bytes'])for r in added),'master_manifest_sha256':sha(master),'manifest_records':len(records),'payload_files':len(known),'payload_bytes':sum(int(r['bytes'])for r in known.values()),'source_or_index_modified':False,'http_requests':0,'final_status_update_deferred_until_ci':True})
write(AUD/'navigation-source-preservation.json',receipt);print(json.dumps(receipt,ensure_ascii=False))
