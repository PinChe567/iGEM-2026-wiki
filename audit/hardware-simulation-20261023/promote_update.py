"""Promote verified staged ZIPs only while no upload worker is active."""
from pathlib import Path
import csv
import hashlib
import importlib.util
import json
import os
import runpy

AUDIT=Path(__file__).resolve().parent;WORK=AUDIT.parents[2]
ROOT=WORK/'zenodo-release';OUT=WORK/'zenodo-upload';STAGE=AUDIT/'package-staging'
UPLOADER=WORK/'aerosense-wiki/audit/zenodo-upload-20261021'
def hashes(p):
    md5=hashlib.md5();sha=hashlib.sha256()
    with p.open('rb') as stream:
        for block in iter(lambda:stream.read(8*1024*1024),b''):md5.update(block);sha.update(block)
    return {'bytes':p.stat().st_size,'sha256':sha.hexdigest(),'md5':md5.hexdigest()}
def stat(p):return {'bytes':p.stat().st_size,'mtime_ns':p.stat().st_mtime_ns}
def save(p,data):
    temporary=p.with_suffix(p.suffix+'.tmp');temporary.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8');os.replace(temporary,p)
assert not (AUDIT/'delivery-update-receipt.json').exists(),'Already promoted; inspect the receipt.'
spec=importlib.util.spec_from_file_location('uploader',UPLOADER/'upload_to_zenodo.py')
uploader=importlib.util.module_from_spec(spec);spec.loader.exec_module(uploader)
lock=uploader.acquire_upload_lock(UPLOADER)
try:
    expected=json.loads((AUDIT/'after-source-snapshot.json').read_text(encoding='utf-8'))
    actual={p.relative_to(ROOT).as_posix():stat(p) for p in ROOT.rglob('*') if p.is_file()}
    assert actual==expected,'Archive source changed after validation.'
    old_index=json.loads((AUDIT/'before-package-index.json').read_text(encoding='utf-8'))
    current=list(csv.DictReader((OUT/'PACKAGE_INDEX.csv').open(encoding='utf-8-sig')))
    assert current==old_index,'Delivery index changed concurrently.'
    staged=list(csv.DictReader((STAGE/'PACKAGE_INDEX.csv').open(encoding='utf-8-sig')))
    assert {r['package_id'] for r in staged}=={'00','03'}
    old={};new_paths={}
    for row in old_index:
        if row['package_id'] not in {'00','03'}:continue
        path=(OUT/row['local_zip_path']).resolve();assert path.is_relative_to(OUT.resolve())
        old[row['zip_filename']]=hashes(path);assert old[row['zip_filename']]['sha256']==row['sha256']
    for name in uploader.ATTACHMENTS:old[name]=hashes(OUT/name)
    receipts=json.loads((UPLOADER/'upload-receipts.json').read_text(encoding='utf-8'))['files']
    for name,entry in old.items():
        assert receipts[name]['verified'] and receipts[name]['md5']==entry['md5'] and receipts[name]['bytes']==entry['bytes'],name
    save(AUDIT/'previous-upload-hashes.json',old)
    index={r['package_id']:r for r in old_index}
    for row in staged:
        source=(STAGE/row['local_zip_path']).resolve();target=(OUT/row['local_zip_path']).resolve()
        assert source.is_relative_to(STAGE.resolve()) and target.is_relative_to(OUT.resolve())
        assert hashes(source)['sha256']==row['sha256']
        os.replace(source,target);index[row['package_id']]=row;new_paths[row['zip_filename']]=target
    rows=[index[key] for key in sorted(index)]
    with (OUT/'PACKAGE_INDEX.csv').open('w',encoding='utf-8-sig',newline='') as stream:
        writer=csv.DictWriter(stream,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    (OUT/'ARCHIVE_CHECKSUMS.sha256').write_text(''.join(f"{r['sha256']}  {r['zip_filename']}\n" for r in rows),encoding='utf-8')
    runpy.run_path(str(WORK/'aerosense-wiki/audit/zenodo-thematic-20261021/build_delivery_guide.py'))
    new_paths.update({name:OUT/name for name in uploader.ATTACHMENTS})
    new={name:hashes(path) for name,path in new_paths.items()}
    plan={'record_id':23469212,'doi':'10.5281/zenodo.23469212','mode':'hardware-simulation-update',
          'reason':'Team requested explicit simulation classification, measured-versus-simulated comparisons and corresponding derived JSON, then update the existing Zenodo draft.',
          'file_names':list(new),'files':{name:{'previous':old[name],'replacement':new[name]} for name in new},
          'other_remote_files':'Preserve all other remote files. Continue pending original light-sheet archives. Never publish or create a new record.'}
    save(UPLOADER/'approved-replacements.json',plan)
    uploader.selected_files(uploader.collect_files(OUT),UPLOADER,scope='full-record')
    receipt={'prepared':True,'record_id':23469212,'doi':'10.5281/zenodo.23469212','updated_archives':staged,
             'update_file_count':len(new),'update_bytes':sum(v['bytes'] for v in new.values()),
             'unchanged_archive_count':8,'upload_plan':plan,'remote_update_verified':False}
    save(AUDIT/'delivery-update-receipt.json',receipt)
    print(json.dumps({key:receipt[key] for key in ('prepared','update_file_count','update_bytes','unchanged_archive_count','remote_update_verified')},indent=2))
finally:lock.close()
