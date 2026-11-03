"""Replace two GH146 delivery ZIPs with independently extractable small ZIPs."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import copy,csv,hashlib,json,sys,zipfile

HERE=Path(__file__).resolve().parent
WORK=HERE.parents[2];OUT=WORK/'zenodo-upload';SOURCE=WORK/'zenodo-release'
UPLOADER=HERE.parent/'zenodo-upload-20261021';STAGE=HERE/'staging'
sys.path.insert(0,str(UPLOADER))
import upload_to_zenodo as uploader
from upload_power_guard import AwakeLease
LIMIT=500_000_000
PREFIX='AeroSense-NTHU-2026/'
OLD_NAMES={'02c':'AeroSense-02c-lightsheet-GH146-run03-raw.zip',
           '02d':'AeroSense-02d-lightsheet-GH146-run04-raw.zip'}

def save(name,data):
    path=HERE/name;temp=path.with_suffix(path.suffix+'.tmp')
    temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');temp.replace(path)

def hashes(path):
    sha=hashlib.sha256();md5=hashlib.md5()
    with path.open('rb') as stream:
        for data in iter(lambda:stream.read(8*1024*1024),b''):
            sha.update(data);md5.update(data)
    return {'bytes':path.stat().st_size,'sha256':sha.hexdigest(),'md5':md5.hexdigest()}

def snapshot(root):
    return {p.relative_to(root).as_posix():[p.stat().st_size,p.stat().st_mtime_ns]
            for p in root.rglob('*') if p.is_file()}

def main():
    lock=uploader.acquire_upload_lock(UPLOADER)
    try:
        with AwakeLease():
            STAGE.mkdir(exist_ok=True)
            rows=list(csv.DictReader((OUT/'PACKAGE_INDEX.csv').open(encoding='utf-8-sig',newline='')))
            selected=[r for r in rows if r['package_id'] in OLD_NAMES]
            assert len(selected)==2
            expected={r['path']:r for r in csv.DictReader((SOURCE/'FILE_MANIFEST.csv').open(encoding='utf-8-sig',newline=''))}
            before=snapshot(SOURCE);save('source-before.json',before)
            save('upload-before.json',snapshot(OUT));save('package-index-before.json',rows)
            save('attachments-before.json',{n:hashes(OUT/n) for n in uploader.ATTACHMENTS})
            def split(row):
                source=(OUT/row['local_zip_path']).resolve(strict=True)
                assert source.is_relative_to(OUT.resolve()) and source.name==OLD_NAMES[row['package_id']]
                original_hash=hashes(source)
                assert original_hash['sha256']==row['sha256']
                result=[];mapping=[]
                with zipfile.ZipFile(source) as original:
                    infos=original.infolist();groups=[];group=[];size=1000
                    assert len(infos)==int(row['source_files'])==706
                    assert len({i.filename for i in infos})==706
                    for info in infos:
                        cost=info.compress_size+1024+2*len(info.filename.encode('utf-8'))
                        if group and size+cost>LIMIT:groups.append(group);group=[];size=1000
                        group.append(info);size+=cost
                    if group:groups.append(group)
                    run='03' if row['package_id']=='02c' else '04'
                    for number,members in enumerate(groups,1):
                        name=source.stem+f'-part{number:02}-of{len(groups):02}.zip'
                        path=STAGE/name
                        assert path.resolve().parent==STAGE.resolve() and not path.exists()
                        members_checked=[]
                        with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=1,allowZip64=True) as target:
                            for info in members:
                                assert not info.is_dir() and info.filename.startswith(PREFIX)
                                rel=info.filename[len(PREFIX):]
                                data=original.read(info);sha=hashlib.sha256(data).hexdigest()
                                assert sha==expected[rel]['sha256'] and len(data)==int(expected[rel]['bytes'])
                                target.writestr(copy.copy(info),data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=1)
                                members_checked.append({'run':run,'part':number,'parts':len(groups),
                                    'path':rel,'zip_filename':name,'bytes':len(data),'sha256':sha})
                        with zipfile.ZipFile(path) as target:
                            assert [i.filename for i in target.infolist()]==[PREFIX+m['path'] for m in members_checked]
                            for member in members_checked:
                                data=target.read(PREFIX+member['path'])
                                assert len(data)==member['bytes'] and hashlib.sha256(data).hexdigest()==member['sha256']
                        digest=hashes(path);assert digest['bytes']<=LIMIT
                        new_row={**row,'package_id':f"{row['package_id']}-{number:02}",
                            'zip_filename':name,'local_zip_path':'02-lightsheet-imaging/'+name,
                            'title':f'GH146 run {run} raw acquisition, part {number:02}/{len(groups):02}',
                            'title_zh':f'GH146 run {run} 光片原始影像（{number:02}/{len(groups):02}）',
                            'source_files':str(len(members_checked)),
                            'source_bytes':str(sum(m['bytes'] for m in members_checked)),
                            'zip_bytes':str(digest['bytes']),'sha256':digest['sha256']}
                        result.append({'row':new_row,'hashes':digest});mapping.extend(members_checked)
                        save(f'progress-{run}.json',{'verified_parts':number,'total_parts':len(groups),
                            'verified_members':len(mapping),'total_members':706})
                assert len(mapping)==706 and len({m['path'] for m in mapping})==706
                return {'original':row,'original_hashes':original_hash,'parts':result,'mapping':mapping}
            with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(split,selected))
            assert snapshot(SOURCE)==before
            mapping=[m for result in results for m in result['mapping']]
            assert len(mapping)==len({m['path'] for m in mapping})==1412
            with (STAGE/'GH146_FILE_MAP.csv').open('w',encoding='utf-8-sig',newline='') as stream:
                writer=csv.DictWriter(stream,fieldnames=list(mapping[0]));writer.writeheader();writer.writerows(mapping)
            protected=[r for r in rows if r['package_id'] not in OLD_NAMES]
            required=len(protected)+sum(len(r['parts']) for r in results)+4
            assert required+3<=100
            save('split-receipt.json',{'prepared':True,'promoted':False,'record_id':23469212,
                'doi':'10.5281/zenodo.23469212','max_part_bytes':LIMIT,'results':results,
                'verified_members':1412,'source_tree_unchanged':True,
                'new_zip_count':sum(len(r['parts']) for r in results),'required_upload_files':required,
                'remote_split_verified':False})
            print(json.dumps({'prepared':True,'new_zip_count':sum(len(r['parts']) for r in results),
                'verified_members':1412,'required_upload_files':required}),flush=True)
    finally:lock.close()

if __name__=='__main__':main()
