"""Install verified GH146 chunks and indexes, preserving the eight saved ZIPs."""
import csv,json,os,runpy,time
from prepare_chunks import HERE,WORK,OUT,SOURCE,UPLOADER,STAGE,OLD_NAMES,hashes,snapshot,save,uploader

def main():
    lock=uploader.acquire_upload_lock(UPLOADER)
    try:
        report=json.loads((HERE/'split-receipt.json').read_text(encoding='utf-8'))
        assert report['prepared'] and not report['promoted'] and report['new_zip_count']==14
        source_before=json.loads((HERE/'source-before.json').read_text(encoding='utf-8'))
        upload_before=json.loads((HERE/'upload-before.json').read_text(encoding='utf-8'))
        assert snapshot(SOURCE)==source_before and snapshot(OUT)==upload_before
        rows=json.loads((HERE/'package-index-before.json').read_text(encoding='utf-8'))
        previous=json.loads((HERE/'attachments-before.json').read_text(encoding='utf-8'))
        receipts=json.loads((UPLOADER/'upload-receipts.json').read_text(encoding='utf-8'))['files']
        protected=[r for r in rows if r['package_id'] not in OLD_NAMES]
        assert len(protected)==8
        for row in protected:
            receipt=receipts[row['zip_filename']];path=OUT/row['local_zip_path']
            assert receipt['verified'] and receipt['bytes']==path.stat().st_size
            assert receipt['mtime_ns']==path.stat().st_mtime_ns and receipt['sha256']==row['sha256']
        for name,digest in previous.items():
            assert hashes(OUT/name)==digest
            assert receipts[name]['verified'] and all(receipts[name][k]==digest[k] for k in ('bytes','sha256','md5'))
        parts=[part for result in report['results'] for part in result['parts']]
        for part in parts:
            path=(STAGE/part['row']['zip_filename']).resolve(strict=True)
            assert path.parent==STAGE.resolve() and hashes(path)==part['hashes']
        mapping=list(csv.DictReader((STAGE/uploader.CHUNK_MAP).open(encoding='utf-8-sig',newline='')))
        assert len(mapping)==len({m['path'] for m in mapping})==1412
        rows=sorted(protected+[p['row'] for p in parts],key=lambda row:row['package_id'])
        assert len(rows)==22 and sum(int(r['source_files']) for r in rows)==8211
        for part in parts:
            target=(OUT/part['row']['local_zip_path']).resolve()
            assert target.parent==(OUT/'02-lightsheet-imaging').resolve() and not target.exists()
            os.replace(STAGE/part['row']['zip_filename'],target)
        assert not (OUT/uploader.CHUNK_MAP).exists()
        os.replace(STAGE/uploader.CHUNK_MAP,OUT/uploader.CHUNK_MAP)
        with (OUT/'PACKAGE_INDEX.csv').open('w',encoding='utf-8-sig',newline='') as stream:
            writer=csv.DictWriter(stream,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
        (OUT/'ARCHIVE_CHECKSUMS.sha256').write_text(''.join(f"{r['sha256']}  {r['zip_filename']}\n" for r in rows),encoding='utf-8')
        runpy.run_path(str(WORK/'aerosense-wiki/audit/zenodo-thematic-20261021/build_delivery_guide.py'))
        new={part['row']['zip_filename']:part['hashes'] for part in parts}
        new.update({name:hashes(OUT/name) for name in (*uploader.ATTACHMENTS,uploader.CHUNK_MAP)})
        plan={'record_id':23469212,'doi':'10.5281/zenodo.23469212','mode':'gh146-chunked',
              'reason':'User requested fewer independent smaller ZIPs for the two remaining GH146 series, about 500 MB each; preserve original data and completed ZIPs.',
              'chunk_counts':{r['original']['package_id']:len(r['parts']) for r in report['results']},
              'retired_pending_files':list(OLD_NAMES.values()),
              'file_names':list(new),'files':{name:{'previous':previous.get(name),'replacement':digest} for name,digest in new.items()},
              'protected_completed_zips':[r['zip_filename'] for r in protected],
              'other_remote_files':'Skip eight completed ZIPs. After all current files are verified, remove only the two retired empty Pending placeholders. Preserve all other remote items and the original DOI. Never publish.'}
        helper=uploader.Uploader('local-preparation-no-network',[],UPLOADER)
        helper.save_json(UPLOADER/'approved-replacements.json',plan)
        ready=uploader.selected_files(uploader.collect_files(OUT),UPLOADER,scope='full-record')
        assert len(ready)==26
        for result in report['results']:
            old=(OUT/result['original']['local_zip_path']).resolve(strict=True)
            assert old.parent==(OUT/'02-lightsheet-imaging').resolve() and old.name in OLD_NAMES.values()
            assert [old.stat().st_size,old.stat().st_mtime_ns]==upload_before[old.relative_to(OUT).as_posix()]
            old.unlink()
        after=snapshot(OUT)
        assert all(after[row['local_zip_path']]==upload_before[row['local_zip_path']] for row in protected)
        assert snapshot(SOURCE)==source_before
        report.update(promoted=True,promoted_at_unix=time.time(),upload_plan=plan,
            protected_completed_zip_count=8,total_upload_files=26,total_zip_count=22,
            new_zip_total_bytes=sum(p['hashes']['bytes'] for p in parts),
            smallest_part_bytes=min(p['hashes']['bytes'] for p in parts),
            largest_part_bytes=max(p['hashes']['bytes'] for p in parts))
        save('split-receipt.json',report)
        if not any(STAGE.iterdir()):
            assert STAGE.resolve().parent==HERE.resolve();STAGE.rmdir()
        print(json.dumps({key:report[key] for key in ('promoted','new_zip_count','verified_members',
            'total_upload_files','total_zip_count','new_zip_total_bytes','smallest_part_bytes','largest_part_bytes')},indent=2))
    finally:lock.close()

if __name__=='__main__':main()
