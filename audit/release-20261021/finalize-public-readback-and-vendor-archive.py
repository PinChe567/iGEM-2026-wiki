"""Register verified vendor preservation and final source-link readback results."""
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
import csv, hashlib, json, os, shutil

ROOT=Path(__file__).resolve().parents[3];ARC=ROOT/'zenodo-release'
AUD=ROOT/'aerosense-wiki/audit/final-publication-20261021';REL=ROOT/'aerosense-wiki/audit/release-20261021'
def native(p):
 s=str(p.absolute());return Path('\\\\?\\'+s)if os.name=='nt' and len(s)>=240 and not s.startswith('\\\\?\\')else p
def sha(p):
 h=hashlib.sha256()
 with native(p).open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def read(p):return json.loads(native(p).read_text(encoding='utf-8-sig'))
def write(p,d):native(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

vendor_receipt=AUD/'pdfjs-canonical-vendor-preservation.json';vendor=read(vendor_receipt)
assert len(vendor['files'])==3
for row in vendor['files']:
 p=ROOT/row['canonical'];assert sha(p)==row['sha256'] and native(p).stat().st_size==row['bytes']
canonical_receipt=ARC/'reproduction-source/wiki-pdfjs-6.4.299/PRESERVATION-RECEIPT.json'
if canonical_receipt.exists():assert sha(canonical_receipt)==sha(vendor_receipt)
else:shutil.copyfile(vendor_receipt,canonical_receipt)
master=ARC/'manifest.csv'
with master.open(encoding='utf-8-sig',newline='')as f:
 reader=csv.DictReader(f);fields=reader.fieldnames;records=list(reader)
known={r['destination_relative']:r for r in records};added=[]
entries=[(ROOT/r['canonical'],r['source'],'verified-pdfjs-vendor-original')for r in vendor['files']]
entries.append((canonical_receipt,vendor_receipt.relative_to(ROOT).as_posix(),'publication-source-provenance'))
for p,source,category in entries:
 relative=p.relative_to(ARC).as_posix();digest=sha(p);size=native(p).stat().st_size
 if relative in known:assert known[relative]['sha256']==digest;continue
 row={'source_relative':source,'destination_relative':relative,'category':category,'sha256':digest,'bytes':str(size),'source_mtime_utc':datetime.fromtimestamp(native(p).stat().st_mtime,timezone.utc).isoformat(),'corresponding_pages':'PDF document reader; exact originals underlying official CDN modules','direct_references':''};records.append(row);known[relative]=row;added.append(row)
with master.open('w',encoding='utf-8-sig',newline='')as f:
 writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(records)
unique={}
for r in records:
 if r['destination_relative']in unique:assert unique[r['destination_relative']]['sha256']==r['sha256']
 else:unique[r['destination_relative']]=r
cats=defaultdict(lambda:{'files':0,'bytes':0})
for r in unique.values():cats[r['category']]['files']+=1;cats[r['category']]['bytes']+=int(r['bytes'])

s=read(ARC/'summary.json');cleanup=s['final_publication_cleanup_2026_10_21'];prior=set()
for entry in cleanup['nonoverlapping_receipts']:
 d=read(ROOT/entry['receipt']);rows=next(v for k,v in d.items()if k in ['removed_files','removed','files']and isinstance(v,list))
 for row in rows:
  p=row if isinstance(row,str)else row.get('source')or row.get('path')or 'gitlab/nthu/'+row['repository_relative'];p=Path(p)if Path(p).is_absolute()else ROOT/p
  key=os.path.normcase(str(p.resolve()));assert key not in prior;prior.add(key)
for name,count,size in [('executed-pdfjs-cdn-duplicate-cleanup.json',6,9271593),('executed-pdfjs-cdn-obsolete-public-cleanup.json',289,19716828)]:
 p=AUD/name;d=read(p);relative=p.relative_to(ROOT).as_posix();assert d['completed']and not d['pyc_touched'];assert d['removed_count']==count and int(d['removed_bytes'])==size
 assert all(r['receipt']!=relative for r in cleanup['nonoverlapping_receipts'])
 for row in d['removed_files']:
  removed=(ROOT/row['path']).resolve();key=os.path.normcase(str(removed));assert key not in prior and not native(removed).exists();prior.add(key)
 cleanup['nonoverlapping_receipts'].append({'receipt':relative,'files':count,'bytes':size})
cleanup.update({'checked_at_utc':datetime.now(timezone.utc).isoformat(),'scoped_removed_files':sum(r['files']for r in cleanup['nonoverlapping_receipts']),'scoped_removed_bytes':sum(r['bytes']for r in cleanup['nonoverlapping_receipts']),'unique_removed_paths_verified_absent':len(prior),'scope_note':'Fourteen path-disjoint completed cleanup receipts, including the final CDN-backed PDF module copies and obsolete compiled outputs. Earlier odor/video/education cleanup remains separate. No canonical research source loss or full-archive rehash is claimed.'})
assert(cleanup['scoped_removed_files'],cleanup['scoped_removed_bytes'])==(5202,454335309)

report=read(REL/'public-download-readback.json');plan=read(REL/'public-download-readback-plan.json')
assert report['all_verified']and report['counts']=={'success':81}and len(report['results'])==81
assert all(r['status']=='success'for r in report['results'])
assert report['plan_sha256']==sha(REL/'public-download-readback-plan.json')
wiki='32d9f06ab6c29da742dc2a816bc285dd02f633ac';software='e09ec6dc273cbffe92ccccdaca2814f3d2a57960'
assert report['commits']=={'wiki':wiki,'software':software}
s.update({'payload_files':len(unique),'payload_bytes':sum(int(r['bytes'])for r in unique.values()),'manifest_source_records':len(records),'categories':dict(cats)})
s['verified_pdfjs_vendor_preservation_2026_10_21']={'files':3,'bytes':sum(r['bytes']for r in vendor['files']),'canonical_receipt':canonical_receipt.relative_to(ROOT).as_posix(),'canonical_receipt_sha256':sha(canonical_receipt),'master_registered_files':len(added),'master_registered_bytes':sum(int(r['bytes'])for r in added),'license_scope':'Upstream Apache notice retained beside exact vendor modules; team MIT does not relicense third-party code.','receipt':vendor_receipt.relative_to(ROOT).as_posix()}
s['frozen_public_download_readback_2026_10_21'].update({'plan_sha256':sha(REL/'public-download-readback-plan.json'),'counts':plan['counts'],'source_hashes_frozen':True,'network_executed':True,'network_completed_at_utc':report['finished_at_utc'],'all_verified':True,'result_counts':report['counts'],'successful_commits_reported_by_root':report['commits'],'wiki_local_commit':wiki,'wiki_ci_success_pending':False,'wiki_pipeline':791186,'wiki_ci_receipt':'aerosense-wiki/audit/final-publication-20261021/official-ci-791186.json','result_receipt':'aerosense-wiki/audit/release-20261021/public-download-readback.json','result_receipt_sha256':sha(REL/'public-download-readback.json'),'verification_scope':'81 linked GitLab routes: 46 exact committed source file GETs plus 35 repository/path/title checks. Reuses 549 existing CDN GET proofs. Not a GET of every file in either repository and not a full deployed-site browser audit.'})
s['current_publication_status'].update({'checked_at_utc':datetime.now(timezone.utc).isoformat(),'gitlab':'Final normal pushes successful: Software '+software+' and Wiki '+wiki+'. Official Wiki pipeline 791186 passed locales/client/pages. All 81 linked GitLab source routes passed public readback.','wiki':'Official pipeline 791186 passed for commit '+wiki+'. PDF.js uses two exact-byte verified official CDN JavaScript modules; runtime publication has 287 files and the source runtime manifest has 259 entries. Locked reproduction recipe and Apache notice remain; CI no longer generates or packages the modules. Deployed-page/browser validation is recorded separately by root.','software':'MIT-scoped Software commit '+software+' is public. Root browser verified MIT License; linked source file/page checks in the 81-URL readback all passed. Final 1,227-item local source/canonical verification remains recorded separately; this does not claim every repository file was fetched by HTTP.','official_cdn':'Previous exact-byte proof retained, including 100 final routing attachments and two newly verified PDF.js modules. The two JavaScript modules passed full GET/SHA, text/javascript MIME and Access-Control-Allow-Origin:*; original modules/Apache notice are preserved.','readback':'Completed: 81/81 GitLab success, zero failed and zero not_verified. 46 complete raw responses match successful-commit Git blob SHA256/bytes; 35 repository/path/title routes verified. 549 earlier CDN proofs reused without repeat GETs. Expected source bytes account for Git newline normalization.'})
write(ARC/'summary.json',s)
receipt={'completed_at_utc':datetime.now(timezone.utc).isoformat(),'public_commits':report['commits'],'wiki_pipeline':791186,'readback_success':81,'readback_failed':0,'readback_not_verified':0,'raw_full_get_sha_checks':46,'repository_html_checks':35,'cdn_proofs_reused':549,'readback_report_sha256':sha(REL/'public-download-readback.json'),'vendor_master_registration_files':len(added),'vendor_master_registration_bytes':sum(int(r['bytes'])for r in added),'payload_files':len(unique),'payload_bytes':s['payload_bytes'],'manifest_records':len(records),'master_manifest_sha256':sha(master),'cleanup_receipts':len(cleanup['nonoverlapping_receipts']),'cleanup_files':5202,'cleanup_bytes':454335309,'blocked_pyc_remaining':2,'source_or_index_modified':False,'full_archive_rehashed':False}
write(AUD/'completed-public-readback-and-archive-rollup.json',receipt)
print(json.dumps(receipt,ensure_ascii=False))
