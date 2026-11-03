"""Register narrow source preservation and reconcile completed cleanup receipts."""
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
import csv, hashlib, json, os

ROOT=Path(__file__).resolve().parents[3]
ARCHIVE=ROOT/'zenodo-release'
AUDIT=ROOT/'aerosense-wiki/audit/final-publication-20261021'
RELEASE=ROOT/'aerosense-wiki/audit/release-20261021'

def native(p):
    s=str(p.absolute())
    return Path('\\\\?\\'+s) if os.name=='nt' and len(s)>=240 and not s.startswith('\\\\?\\') else p

def sha(p):
    h=hashlib.sha256()
    with native(p).open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()

def read(p): return json.loads(native(p).read_text(encoding='utf-8-sig'))
def write(p,data): native(p).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

now=datetime.now(timezone.utc).isoformat()
master=ARCHIVE/'manifest.csv'
with master.open(encoding='utf-8-sig',newline='') as stream:
    reader=csv.DictReader(stream);fields=reader.fieldnames;records=list(reader)
before=len(records);known={r['destination_relative']:r for r in records};additions=[]
for folder,category,source_prefix in [
    ('software-source-before-migration-20261021','software-source-pre-migration','historical-wiki-publication-source'),
    ('software-publication-source-20261021','software-source-publication','gitlab/aerosense-software'),
]:
    base=ARCHIVE/'reproduction-source'/folder
    preservation=read(base/'PRESERVATION-MANIFEST.json')
    payload={r['canonical']:r for r in preservation['files'] if r['canonical'].startswith(base.relative_to(ROOT).as_posix()+'/')}
    entries=[]
    for relative,record in payload.items():
        path=ROOT/relative
        assert sha(path)==record['sha256'] and native(path).stat().st_size==record['bytes']
        entries.append((path,source_prefix+'/'+record['repository_path'],category))
    entries.append((base/'PRESERVATION-MANIFEST.json',base.relative_to(ROOT).as_posix()+'/PRESERVATION-MANIFEST.json','publication-source-provenance'))
    for path,source,kind in entries:
        destination=path.relative_to(ARCHIVE).as_posix();digest=sha(path);size=native(path).stat().st_size
        if destination in known:
            assert known[destination]['sha256']==digest and int(known[destination]['bytes'])==size
            continue
        row={'source_relative':source,'destination_relative':destination,'category':kind,'sha256':digest,'bytes':str(size),'source_mtime_utc':datetime.fromtimestamp(native(path).stat().st_mtime,timezone.utc).isoformat(),'corresponding_pages':'research source, Registry documentation and publication provenance','direct_references':''}
        records.append(row);known[destination]=row;additions.append(row)

with master.open('w',encoding='utf-8-sig',newline='') as stream:
    writer=csv.DictWriter(stream,fieldnames=fields);writer.writeheader();writer.writerows(records)
unique={}
for record in records:
    key=record['destination_relative']
    if key in unique: assert (unique[key]['sha256'],int(unique[key]['bytes']))==(record['sha256'],int(record['bytes']))
    else: unique[key]=record
categories=defaultdict(lambda:{'files':0,'bytes':0})
for record in unique.values():
    categories[record['category']]['files']+=1;categories[record['category']]['bytes']+=int(record['bytes'])

summary=read(ARCHIVE/'summary.json')
cleanup=summary['final_publication_cleanup_2026_10_21']
receipt_records=cleanup['nonoverlapping_receipts']
extra=[
    ('aerosense-wiki/audit/release-20261021/executed-final-staging-cleanup.json',165,37359240),
    ('aerosense-wiki/audit/release-20261021/executed-obsolete-generated-build-cleanup.json',1564,114406623),
    ('aerosense-wiki/audit/release-20261021/executed-software-links-build-cleanup.json',578,39432425),
    ('aerosense-wiki/audit/final-publication-20261021/executed-wiki-software-copy-cleanup.json',1220,12831491),
]
existing_receipts={r['receipt'] for r in receipt_records}
for path,count,size in extra:
    if path not in existing_receipts:receipt_records.append({'receipt':path,'files':count,'bytes':size})
removed_paths=set()
for record in receipt_records:
    receipt=read(ROOT/record['receipt'])
    rows=next(v for k,v in receipt.items() if k in ['removed_files','removed','files'] and isinstance(v,list))
    assert len(rows)==record['files'],record['receipt']
    assert int(receipt['removed_bytes'])==record['bytes'],record['receipt']
    for row in rows:
        source=row if isinstance(row,str) else row.get('source')
        if source is None:source='gitlab/nthu/'+row['repository_relative']
        absolute=Path(source) if Path(source).is_absolute() else ROOT/source
        normalized=os.path.normcase(str(absolute.resolve()))
        assert normalized not in removed_paths, 'Overlapping cleanup source: '+source
        assert not native(absolute).exists(), 'Removed source is present again: '+source
        removed_paths.add(normalized)
cleanup.update({'checked_at_utc':now,'scoped_removed_files':sum(r['files']for r in receipt_records),'scoped_removed_bytes':sum(r['bytes']for r in receipt_records),'nonoverlapping_receipts':receipt_records,'scope_note':'Eleven completed, path-disjoint receipts; all listed removed paths were checked absent. Covers working/display/upload copies, rejected publication artifacts, obsolete generated builds, and verified redundant Wiki code/docs after Software migration. Earlier odor/video/education cleanup remains separate. No full-archive rehash claimed.','unique_removed_paths_verified_absent':len(removed_paths),'diagnostic_body_trim':{'receipt':'aerosense-wiki/audit/final-publication-20261021/registry-frontend-diagnostic-cleanup.json','downloaded_chunk_bodies_removed':4,'bytes_before':31563,'bytes_after':1382,'bytes_removed':30181,'counted_as_file_deletions':False},'blocked_bytecode_caches_retained':2})
assert cleanup['scoped_removed_files']==4618 and cleanup['scoped_removed_bytes']==405630466

final=read(AUDIT/'final-software-source-preservation-receipt.json')
pre=read(AUDIT/'pre-migration-source-preservation-receipt.json')
plan=read(RELEASE/'public-download-readback-plan.json')
assert plan['source_hashes_frozen'] and not plan['local_issues']
assert final['source_manifest_sha256']=='819d852c36542dec1e4f4557c577c674e92d838cc09114583050ba400277e221'
summary.update({'destination_requested_by_user':'Zenodo for the full raw research archive; official iGEM Wiki repository for website source, official AeroSense Software repository for software/Markdown source, official CDN for static documents and chart attachments.','payload_files':len(unique),'payload_bytes':sum(int(r['bytes'])for r in unique.values()),'manifest_source_records':len(records),'categories':dict(categories)})
summary['source_only_working_tree_preparation_2026_10_21']['historical_scope_note']='This entry records the earlier Wiki source-only preparation, before migration. Current Software state and exact canonical source preservation are recorded separately below.'
summary['software_publication_source_preservation_2026_10_21']={
    'checked_at_utc':now,'repository':'https://gitlab.igem.org/2026/software/nthu/aerosense','status':'LOCALLY PREPARED AND EXACT-BYTE PRESERVED; TEAM LICENSE AND PUBLICATION PENDING','source_manifest_sha256':final['source_manifest_sha256'],'research_files':final['source_entries'],'research_bytes':final['source_bytes'],'support_files':final['support_entries'],'support_bytes':final['support_bytes'],'all_items_including_manifest':final['all_items_checked'],'registry_md_exact_mirrors':final['registry_exact_mirror_count'],'new_final_unique_source_files':final['new_unique_source_files'],'new_final_unique_source_bytes':final['new_unique_source_bytes'],'pre_migration_new_unique_source_files':pre['new_unique_files'],'pre_migration_new_unique_source_bytes':pre['new_unique_bytes'],'source_manifest_included':True,'license_status':final['license_status'],'canonical_manifest':final['preservation_manifest'],'canonical_manifest_sha256':final['preservation_manifest_sha256'],'receipt':'aerosense-wiki/audit/final-publication-20261021/final-software-source-preservation-receipt.json','pre_migration_receipt':'aerosense-wiki/audit/final-publication-20261021/pre-migration-source-preservation-receipt.json','whole_website_backup_created':False,'remote_publication_verified':False,
}
summary['frozen_public_download_readback_2026_10_21']={'plan':'aerosense-wiki/audit/release-20261021/public-download-readback-plan.json','plan_sha256':sha(RELEASE/'public-download-readback-plan.json'),'source_hashes_frozen':True,'counts':plan['counts'],'local_issues':0,'network_executed':False,'wiki_local_commit':'32b7ca151c6c47fff0ea036eaec9382179671ddc','wiki_push_verified':False,'software_commit_pending':True,'license_decision_pending':True,'execution_requires':'Root-confirmed successful commits and CI for both repositories. Expected public file hashes derive from committed Git blobs to account for configured newline normalization.'}
write(ARCHIVE/'summary.json',summary)
receipt={'completed_at_utc':now,'master_manifest_rows_before':before,'master_manifest_rows_after':len(records),'physical_canonical_files_registered':len(additions),'physical_canonical_bytes_registered':sum(int(r['bytes'])for r in additions),'payload_files':len(unique),'payload_bytes':summary['payload_bytes'],'master_manifest_sha256':sha(master),'registered_files':[{k:r[k]for k in ['destination_relative','category','sha256','bytes']}for r in additions],'cleanup_receipts':len(receipt_records),'cleanup_removed_files':cleanup['scoped_removed_files'],'cleanup_removed_bytes':cleanup['scoped_removed_bytes'],'cleanup_paths_disjoint_and_absent':True,'full_archive_rehashed':False,'readback_plan_sha256':sha(RELEASE/'public-download-readback-plan.json'),'http_requests':0}
write(AUDIT/'final-source-archive-registration.json',receipt)
print(json.dumps({k:v for k,v in receipt.items()if k not in ['registered_files']},ensure_ascii=False))
