"""Promote verified GH146 ZIPs and their three small delivery indexes only."""
from pathlib import Path
import csv
import hashlib
import json
import os
import runpy
import sys
import time
from repack_pending import HERE,WORK,OUT,SOURCE,UPLOADER,STAGE,IDS,hashes,snapshot,save
import upload_to_zenodo as uploader

def main():
    lock=uploader.acquire_upload_lock(UPLOADER)
    try:
        report=json.loads((HERE/'repack-receipt.json').read_text(encoding='utf-8'))
        assert report['prepared'] and not report['promoted']
        assert report['verified_members']==1412
        assert snapshot(SOURCE)==json.loads((HERE/'source-snapshot-before.json').read_text(encoding='utf-8'))
        before=json.loads((HERE/'upload-snapshot-before.json').read_text(encoding='utf-8'))
        assert snapshot(OUT)==before,'Upload payloads changed while compression was running.'
        rows=list(csv.DictReader((OUT/'PACKAGE_INDEX.csv').open(encoding='utf-8-sig',newline='')))
        assert rows==json.loads((HERE/'package-index-before.json').read_text(encoding='utf-8'))
        previous=json.loads((HERE/'attachments-before.json').read_text(encoding='utf-8'))
        receipts=json.loads((UPLOADER/'upload-receipts.json').read_text(encoding='utf-8'))['files']
        for name,expected in previous.items():
            assert hashes(OUT/name)==expected
            assert receipts[name]['verified'] and all(receipts[name][k]==expected[k] for k in ('bytes','sha256','md5'))
        archives={r['package_id']:r for r in report['archives']}
        protected=[]
        for row in rows:
            path=(OUT/row['local_zip_path']).resolve(strict=True)
            assert path.is_relative_to(OUT.resolve())
            if row['package_id'] not in IDS:
                receipt=receipts[row['zip_filename']]
                assert receipt['verified'] and receipt['bytes']==path.stat().st_size
                assert receipt['mtime_ns']==path.stat().st_mtime_ns and receipt['sha256']==row['sha256']
                protected.append(row['zip_filename'])
        for row in rows:
            if row['package_id'] not in IDS:continue
            item=archives[row['package_id']]
            stage=(STAGE/row['zip_filename']).resolve(strict=True)
            target=(OUT/row['local_zip_path']).resolve(strict=True)
            assert stage.parent==STAGE.resolve() and target.is_relative_to(OUT.resolve())
            assert hashes(stage)==item['replacement']
            previous[row['zip_filename']]=item['previous']
        for row in rows:
            if row['package_id'] not in IDS:continue
            item=archives[row['package_id']]
            stage=STAGE/row['zip_filename']
            target=OUT/row['local_zip_path']
            # Atomic replacement removes only the superseded local delivery ZIP.
            # Canonical research sources and all completed ZIPs stay untouched.
            os.replace(stage,target)
            row['zip_bytes']=str(item['replacement']['bytes'])
            row['sha256']=item['replacement']['sha256']
        with (OUT/'PACKAGE_INDEX.csv').open('w',encoding='utf-8-sig',newline='') as stream:
            writer=csv.DictWriter(stream,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
        (OUT/'ARCHIVE_CHECKSUMS.sha256').write_text(''.join(f"{r['sha256']}  {r['zip_filename']}\n" for r in rows),encoding='utf-8')
        runpy.run_path(str(WORK/'aerosense-wiki/audit/zenodo-thematic-20261021/build_delivery_guide.py'))
        new={a['filename']:a['replacement'] for a in report['archives']}
        new.update({name:hashes(OUT/name) for name in uploader.ATTACHMENTS})
        plan={'record_id':23469212,'doi':'10.5281/zenodo.23469212','mode':'gh146-lossless-repack',
              'reason':'User requested lossless compression of only the remaining two GH146 raw ZIPs; preserve all original data and never re-upload the other completed ZIPs.',
              'file_names':list(new),'files':{name:{'previous':previous[name],'replacement':new[name]} for name in new},
              'protected_completed_zips':protected,
              'other_remote_files':'Verify and skip eight completed ZIPs. Update only the two GH146 ZIPs and three small delivery indexes. Preserve the same draft and DOI; never publish.'}
        uploader.Uploader('local-preparation-no-network',[],UPLOADER).save_json(UPLOADER/'approved-replacements.json',plan)
        ready=uploader.selected_files(uploader.collect_files(OUT),UPLOADER,scope='full-record')
        after=snapshot(OUT)
        allowed={r['local_zip_path'] for r in rows if r['package_id'] in IDS}|set(uploader.ATTACHMENTS)|{'START_HERE.html'}
        assert set(before)==set(after)
        changed={p for p in before if before[p]!=after[p]}
        assert changed<=allowed,changed-allowed
        assert all(before[r['local_zip_path']]==after[r['local_zip_path']] for r in rows if r['package_id'] not in IDS)
        assert snapshot(SOURCE)==json.loads((HERE/'source-snapshot-before.json').read_text(encoding='utf-8'))
        report.update(promoted=True,promoted_at_unix=time.time(),upload_plan=plan,
                      protected_completed_zip_count=len(protected),upload_file_count=len(ready),
                      total_upload_bytes=sum(f['bytes'] for f in ready),remote_repack_verified=False)
        save('repack-receipt.json',report)
        if STAGE.exists() and not any(STAGE.iterdir()):
            assert STAGE.resolve().parent==HERE.resolve()
            STAGE.rmdir()
        print(json.dumps({k:report[k] for k in ('promoted','original_bytes','compressed_bytes','verified_members','protected_completed_zip_count','total_upload_bytes')},indent=2))
    finally:
        lock.close()

if __name__=='__main__':
    main()
