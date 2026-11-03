"""Rebuild only affected archives, validate, then replace their delivery files."""
from pathlib import Path
import csv,hashlib,importlib.util,json,os,runpy,shutil,sys

AUDIT=Path(__file__).resolve().parent;WORK=AUDIT.parents[2]
ROOT=WORK/'zenodo-release';OUT=WORK/'zenodo-upload'
STAGE=AUDIT/'package-staging'
UPLOADER=WORK/'aerosense-wiki/audit/zenodo-upload-20261021'
old_index=json.loads((AUDIT/'before-package-index.json').read_text(encoding='utf-8'))
affected={'00','03','06'}
def hashes(p):
    md5=hashlib.md5();sha=hashlib.sha256()
    with p.open('rb') as f:
        for block in iter(lambda:f.read(8*1024*1024),b''):md5.update(block);sha.update(block)
    return {'bytes':p.stat().st_size,'md5':md5.hexdigest(),'sha256':sha.hexdigest()}
old={}
for row in old_index:
    if row['package_id'] in affected:
        old[row['zip_filename']]=hashes(OUT/row['local_zip_path'])
        assert old[row['zip_filename']]['sha256']==row['sha256']
for name in ['UPLOAD_README.txt','PACKAGE_INDEX.csv','ARCHIVE_CHECKSUMS.sha256']:old[name]=hashes(OUT/name)
(AUDIT/'previous-upload-hashes.json').write_text(json.dumps(old,indent=2),encoding='utf-8')
spec=importlib.util.spec_from_file_location('archive_tools',ROOT/'00-guide/archive_tools.py')
tool=importlib.util.module_from_spec(spec);spec.loader.exec_module(tool)
tool.package(STAGE,only='00,03,06')
rows=list(csv.DictReader((STAGE/'PACKAGE_INDEX.csv').open(encoding='utf-8-sig')))
now={p.relative_to(ROOT).as_posix():{'bytes':p.stat().st_size,'mtime_ns':p.stat().st_mtime_ns} for p in tool.all_files()}
expected=json.loads((AUDIT/'after-source-snapshot.json').read_text(encoding='utf-8'))
assert now==expected,'Source changed during final packaging.'
index={r['package_id']:r for r in old_index}
for row in rows:
    source=(STAGE/row['local_zip_path']).resolve();target=(OUT/row['local_zip_path']).resolve()
    assert source.is_relative_to(STAGE.resolve()) and target.is_relative_to(OUT.resolve())
    os.replace(source,target);index[row['package_id']]=row
ordered=[index[k] for k in sorted(index)]
with (OUT/'PACKAGE_INDEX.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(ordered[0]));w.writeheader();w.writerows(ordered)
(OUT/'ARCHIVE_CHECKSUMS.sha256').write_text(''.join(f"{r['sha256']}  {r['zip_filename']}\n" for r in ordered),encoding='utf-8')
runpy.run_path(str(WORK/'aerosense-wiki/audit/zenodo-thematic-20261021/build_delivery_guide.py'))
new_paths={r['zip_filename']:OUT/r['local_zip_path'] for r in rows}
new_paths.update({name:OUT/name for name in ['UPLOAD_README.txt','PACKAGE_INDEX.csv','ARCHIVE_CHECKSUMS.sha256']})
new={name:hashes(p) for name,p in new_paths.items()}
plan={'record_id':23469212,'doi':'10.5281/zenodo.23469212','mode':'record19-update',
      'reason':'User requested the selected record-19 revision be suffixed _sti and the supplied original-named CSV/JSON be placed alongside it.',
      'file_names':list(new),'files':{name:{'previous':old[name],'replacement':new[name]} for name in new},
      'other_remote_files':'Leave all other remote files unchanged. Do not publish or create a record.'}
(UPLOADER/'approved-replacements.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
(AUDIT/'delivery-update-receipt.json').write_text(json.dumps({'affected_packages':rows,'upload_plan':plan,
    'physical_source_files':len(now),'untouched_archive_count':7,'source_snapshot_stable':True},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'ready':True,'update_upload_files':len(new),'update_upload_bytes':sum(v['bytes'] for v in new.values()),'total_source_files':len(now),'untouched_archives':7}),flush=True)
