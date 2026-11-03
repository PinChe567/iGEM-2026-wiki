"""Register only the canonical source differences introduced by MIT approval."""
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
import csv, hashlib, json, os

ROOT=Path(__file__).resolve().parents[3]
ARCHIVE=ROOT/'zenodo-release'
AUDIT=ROOT/'aerosense-wiki/audit/final-publication-20261021'
RELEASE=ROOT/'aerosense-wiki/audit/release-20261021'
RECEIPT=AUDIT/'mit-software-source-preservation-receipt.json'

def native(p):
    s=str(p.absolute())
    return Path('\\\\?\\'+s) if os.name=='nt' and len(s)>=240 and not s.startswith('\\\\?\\') else p
def sha(p):
    h=hashlib.sha256()
    with native(p).open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()
def read(p):return json.loads(native(p).read_text(encoding='utf-8-sig'))
def write(p,d):native(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

receipt=read(RECEIPT)
assert 'TEAM MIT LICENSE APPROVED' in receipt['status']
preservation_path=ROOT/receipt['preservation_manifest']
assert sha(preservation_path)==receipt['preservation_manifest_sha256']
preservation=read(preservation_path);base=preservation_path.parent
source_manifest=ROOT/'gitlab/aerosense-software/code/aerosense/source-manifest.json'
assert sha(source_manifest)==receipt['source_manifest_sha256']
plan=read(RELEASE/'public-download-readback-plan.json')
assert plan['source_hashes_frozen'] and not plan['network_started'] and not plan['local_issues']
assert any(r['path']==source_manifest.relative_to(ROOT).as_posix() and r['sha256']==receipt['source_manifest_sha256'] for r in plan['input_files'])
master=ARCHIVE/'manifest.csv'
with master.open(encoding='utf-8-sig',newline='') as stream:
    reader=csv.DictReader(stream);fields=reader.fieldnames;records=list(reader)
before=len(records);known={r['destination_relative']:r for r in records};added=[]
payload={r['canonical']:r for r in preservation['files'] if r['canonical'].startswith(base.relative_to(ROOT).as_posix()+'/')}
entries=[(ROOT/path,'gitlab/aerosense-software/'+r['repository_path'],'software-source-mit-publication')for path,r in payload.items()]
entries.append((preservation_path,preservation_path.relative_to(ROOT).as_posix(),'publication-source-provenance'))
for path,source,category in entries:
    relative=path.relative_to(ARCHIVE).as_posix();digest=sha(path);size=native(path).stat().st_size
    if relative in known:
        assert known[relative]['sha256']==digest and int(known[relative]['bytes'])==size
        continue
    row={'source_relative':source,'destination_relative':relative,'category':category,'sha256':digest,'bytes':str(size),'source_mtime_utc':datetime.fromtimestamp(native(path).stat().st_mtime,timezone.utc).isoformat(),'corresponding_pages':'MIT-approved team software publication source; third-party scope preserved','direct_references':''}
    records.append(row);known[relative]=row;added.append(row)
with master.open('w',encoding='utf-8-sig',newline='') as stream:
    writer=csv.DictWriter(stream,fieldnames=fields);writer.writeheader();writer.writerows(records)
unique={}
for r in records:
    key=r['destination_relative']
    if key in unique:assert (unique[key]['sha256'],int(unique[key]['bytes']))==(r['sha256'],int(r['bytes']))
    else:unique[key]=r
categories=defaultdict(lambda:{'files':0,'bytes':0})
for r in unique.values():categories[r['category']]['files']+=1;categories[r['category']]['bytes']+=int(r['bytes'])

summary=read(ARCHIVE/'summary.json');now=datetime.now(timezone.utc).isoformat()
summary.setdefault('software_publication_source_pre_license_2026_10_21',summary['software_publication_source_preservation_2026_10_21'])
summary['software_publication_source_preservation_2026_10_21']={
    'checked_at_utc':now,'repository':receipt['software_repository'],'status':receipt['status'],'source_manifest_sha256':receipt['source_manifest_sha256'],'research_files':receipt['source_entries'],'research_bytes':receipt['source_bytes'],'support_files':receipt['support_entries'],'support_bytes':receipt['support_bytes'],'all_items_including_manifest':receipt['all_items_checked'],'registry_md_exact_mirrors':receipt['registry_exact_mirror_count'],'new_mit_unique_source_files':receipt['new_unique_source_files'],'new_mit_unique_source_bytes':receipt['new_unique_source_bytes'],'license_status':receipt['license_status'],'canonical_manifest':receipt['preservation_manifest'],'canonical_manifest_sha256':receipt['preservation_manifest_sha256'],'receipt':RECEIPT.relative_to(ROOT).as_posix(),'previous_edition':'software_publication_source_pre_license_2026_10_21','whole_website_backup_created':False,'remote_publication_verified':False,
}
summary.update({'payload_files':len(unique),'payload_bytes':sum(int(r['bytes'])for r in unique.values()),'manifest_source_records':len(records),'categories':dict(categories)})
summary['frozen_public_download_readback_2026_10_21'].update({'plan_sha256':sha(RELEASE/'public-download-readback-plan.json'),'source_hashes_frozen':True,'counts':plan['counts'],'network_executed':False,'license_decision_pending':False,'team_license':'MIT for team-authored Software source; third-party scopes preserved','software_commit_pending':True,'publication_manifest_and_support_files_guarded':1+receipt['support_entries']})
status=summary['current_publication_status']
status.update({'checked_at_utc':now,'software':f"MIT approved for team-authored Software source, with third-party notices/scopes preserved. Frozen source manifest {receipt['source_manifest_sha256']}: {receipt['source_entries']} research sources / {receipt['source_bytes']} bytes, {receipt['support_entries']} support files / {receipt['support_bytes']} bytes, plus manifest = {receipt['all_items_checked']} items. Exact canonical differences preserved. No new successful Software commit/push/CI/public readback has been reported to this audit yet.",'readback':'Dual-repository source hashes refreshed after MIT approval; 81 GitLab URLs (46 full GET/SHA, 35 repository/path title), 547 existing CDN proofs reused, zero local issues. No HTTP executed. Await root-confirmed successful commits and applicable CI; expected public file bytes derive from committed Git blobs.'})
write(ARCHIVE/'summary.json',summary)
out={'completed_at_utc':now,'source_manifest_sha256':receipt['source_manifest_sha256'],'master_manifest_rows_before':before,'master_manifest_rows_after':len(records),'physical_canonical_files_registered':len(added),'physical_canonical_bytes_registered':sum(int(r['bytes'])for r in added),'payload_files':len(unique),'payload_bytes':summary['payload_bytes'],'master_manifest_sha256':sha(master),'registered_files':[{k:r[k]for k in ['destination_relative','category','sha256','bytes']}for r in added],'readback_plan_sha256':sha(RELEASE/'public-download-readback-plan.json'),'license_approved':'MIT scoped to team-authored source','wiki_data_image_license_changed':False,'full_archive_rehashed':False,'http_requests':0}
write(AUDIT/'mit-source-archive-registration.json',out)
print(json.dumps({k:v for k,v in out.items()if k!='registered_files'},ensure_ascii=False))
