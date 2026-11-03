"""Losslessly repack only the two pending GH146 archives; never edit sources."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import copy
import csv
import hashlib
import json
import sys
import time
import zipfile

HERE=Path(__file__).resolve().parent
WORK=HERE.parents[2]
OUT=WORK/'zenodo-upload'
SOURCE=WORK/'zenodo-release'
UPLOADER=HERE.parent/'zenodo-upload-20261021'
sys.path.insert(0,str(UPLOADER))
import upload_to_zenodo as uploader
from upload_power_guard import AwakeLease

IDS=('02c','02d')
PREFIX='AeroSense-NTHU-2026/'
STAGE=HERE/'staging'

def save(name,data):
    path=HERE/name
    temporary=path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    temporary.replace(path)

def hashes(path):
    sha=hashlib.sha256();md5=hashlib.md5()
    with path.open('rb') as stream:
        for block in iter(lambda:stream.read(8*1024*1024),b''):
            sha.update(block);md5.update(block)
    return {'bytes':path.stat().st_size,'sha256':sha.hexdigest(),'md5':md5.hexdigest()}

def snapshot(root):
    return {p.relative_to(root).as_posix():{'bytes':p.stat().st_size,'mtime_ns':p.stat().st_mtime_ns}
            for p in root.rglob('*') if p.is_file()}

def main():
    lock=uploader.acquire_upload_lock(UPLOADER)
    try:
        with AwakeLease():
            STAGE.mkdir(exist_ok=True)
            rows=list(csv.DictReader((OUT/'PACKAGE_INDEX.csv').open(encoding='utf-8-sig',newline='')))
            selected=[r for r in rows if r['package_id'] in IDS]
            assert len(selected)==2
            expected={r['path']:r for r in csv.DictReader((SOURCE/'FILE_MANIFEST.csv').open(encoding='utf-8-sig',newline=''))}
            before=snapshot(SOURCE)
            save('source-snapshot-before.json',before)
            save('package-index-before.json',rows)
            save('upload-snapshot-before.json',snapshot(OUT))
            attachments={n:hashes(OUT/n) for n in uploader.ATTACHMENTS}
            save('attachments-before.json',attachments)

            def repack(row):
                target=(STAGE/row['zip_filename']).resolve()
                source=(OUT/row['local_zip_path']).resolve(strict=True)
                assert target.parent==STAGE.resolve() and source.is_relative_to(OUT.resolve())
                assert not target.exists(), 'Do not silently restart over a staged package.'
                old=hashes(source)
                assert old['sha256']==row['sha256'] and old['bytes']==int(row['zip_bytes'])
                save(f"progress-{row['package_id']}.json",{'stage':'compressing','completed':0,'total':int(row['source_files'])})
                records=[]
                with zipfile.ZipFile(source,'r') as original, zipfile.ZipFile(target,'w',
                        compression=zipfile.ZIP_DEFLATED,compresslevel=1,allowZip64=True) as output:
                    infos=original.infolist()
                    assert len(infos)==int(row['source_files'])
                    assert len({i.filename for i in infos})==len(infos)
                    output.comment=original.comment
                    for number,info in enumerate(infos,1):
                        assert not info.is_dir() and info.filename.startswith(PREFIX)
                        rel=info.filename[len(PREFIX):]
                        assert rel in expected and '..' not in Path(rel).parts
                        data=original.read(info)
                        sha=hashlib.sha256(data).hexdigest()
                        assert sha==expected[rel]['sha256'] and len(data)==int(expected[rel]['bytes']),rel
                        new_info=copy.copy(info)
                        output.writestr(new_info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=1)
                        records.append({'path':rel,'bytes':len(data),'sha256':sha,'crc32':info.CRC})
                        if number%50==0 or number==len(infos):
                            save(f"progress-{row['package_id']}.json",{'stage':'compressing','completed':number,'total':len(infos)})
                with zipfile.ZipFile(target,'r') as compressed:
                    assert [i.filename for i in compressed.infolist()]==[PREFIX+r['path'] for r in records]
                    for number,record in enumerate(records,1):
                        entry=compressed.getinfo(PREFIX+record['path'])
                        data=compressed.read(entry)
                        assert entry.compress_type==zipfile.ZIP_DEFLATED
                        assert entry.CRC==record['crc32'] and len(data)==record['bytes']
                        assert hashlib.sha256(data).hexdigest()==record['sha256'],record['path']
                        if number%100==0 or number==len(records):
                            save(f"progress-{row['package_id']}.json",{'stage':'verifying_decompressed_bytes','completed':number,'total':len(records)})
                new=hashes(target)
                assert new['bytes']<old['bytes']
                report={'package_id':row['package_id'],'filename':row['zip_filename'],
                        'previous':old,'replacement':new,'member_count':len(records),
                        'compression':'ZIP DEFLATE level 1 (lossless)',
                        'member_names_order_and_bytes_unchanged':True,'members':records,
                        'verified_against_source_manifest':True}
                save(f"verified-{row['package_id']}.json",report)
                save(f"progress-{row['package_id']}.json",{'stage':'verified','completed':len(records),'total':len(records),'zip_bytes':new['bytes']})
                return {k:v for k,v in report.items() if k!='members'}

            with ThreadPoolExecutor(max_workers=2) as pool:
                reports=list(pool.map(repack,selected))
            assert snapshot(SOURCE)==before,'Research source tree changed during packaging.'
            report={'prepared':True,'record_id':23469212,'doi':'10.5281/zenodo.23469212',
                    'source_tree_unchanged':True,'source_snapshot_files':len(before),
                    'archives':reports,'original_bytes':sum(r['previous']['bytes'] for r in reports),
                    'compressed_bytes':sum(r['replacement']['bytes'] for r in reports),
                    'verified_members':sum(r['member_count'] for r in reports),'promoted':False}
            save('repack-receipt.json',report)
            print(json.dumps({k:v for k,v in report.items() if k!='archives'},ensure_ascii=False),flush=True)
    finally:
        lock.close()

if __name__=='__main__':
    main()
