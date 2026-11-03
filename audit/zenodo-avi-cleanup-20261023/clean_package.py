"""Remove explicitly selected AVI presentations, preserving all TIFF/CSV inputs."""
import argparse,csv,hashlib,importlib.util,json,os,runpy,sys,time,zipfile
from pathlib import Path

HERE=Path(__file__).resolve().parent; WORK=HERE.parents[2]
ROOT=WORK/'zenodo-release'; OUT=WORK/'zenodo-upload'
UP=WORK/'aerosense-wiki/audit/zenodo-upload-20261021'
sys.path.insert(0,str(UP))
import upload_to_zenodo as u
PREFIX='AeroSense-NTHU-2026/'
LS='aerosense-wiki/wetlab results/description_lightsheet/'
URLS={'TH':'https://video.igem.org/w/6Pa3Sqm3YFAzEAcJW8krwB',
      '03':'https://video.igem.org/w/bhCd2DjM8qbRkZLh4yo2TJ',
      '04':'https://video.igem.org/w/4mG6jqCpdgUfyZkwtrg5Cw'}

def digest(path):
    h=hashlib.sha256();m=hashlib.md5();n=0
    with path.open('rb') as f:
        for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b);m.update(b);n+=len(b)
    return {'sha256':h.hexdigest(),'md5':m.hexdigest(),'bytes':n}
def snapshot(root):return {p.relative_to(root).as_posix():[p.stat().st_size,p.stat().st_mtime_ns] for p in root.rglob('*') if p.is_file()}
def readcsv(path):
    with path.open(encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f);return reader.fieldnames,list(reader)
def writecsv(path,fields,rows):
    with path.open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(rows)
def save(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def addtext(path,text):path.write_text(path.read_text(encoding='utf-8')+text,encoding='utf-8')
def display(rel):return URLS['TH' if '/TH/' in rel else Path(rel).stem[-2:]]

def main(remove_run02):
    assert not (HERE/'cleanup-receipt.json').exists(),'Already applied.'
    lock=u.acquire_upload_lock(UP)
    try:
        before=snapshot(ROOT);upload_before=snapshot(OUT)
        fields,oldrows=readcsv(OUT/'PACKAGE_INDEX.csv')
        invfields,invrows=readcsv(ROOT/'FILE_MANIFEST.csv');baseline={r['path']:r for r in invrows}
        _,oldmap=readcsv(ROOT/'00-guide/PACKAGE_MAP.csv')
        receipts=json.loads((UP/'upload-receipts.json').read_text(encoding='utf-8'))['files']
        oldplan=u.approved_plan(UP)
        selected=sorted(p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*.avi') if remove_run02 or p.name!='MAX_02.avi')
        assert len(selected)==(7 if remove_run02 else 6)
        assert all(rel.startswith(LS+'videos/') for rel in selected)
        originals={rel:digest(ROOT/rel) for rel in selected}
        assert all(d['sha256']==baseline[rel]['sha256'] and d['bytes']==int(baseline[rel]['bytes']) for rel,d in originals.items())
        previous={}
        for name in ('AeroSense-00-guides-and-provenance.zip','AeroSense-02a-lightsheet-analysis-and-media.zip',*u.ATTACHMENTS):
            row=next((r for r in oldrows if r['zip_filename']==name),None)
            path=OUT/(row['local_zip_path'] if row else name)
            value=digest(path);receipt=receipts[name]
            assert receipt['verified'] and all(receipt[k]==value[k] for k in value)
            previous[name]=value
        save(HERE/'baseline.json',{'source':before,'upload':upload_before,'removed':originals,'previous':previous})
        for rel in selected:
            path=(ROOT/rel).resolve(strict=True)
            assert path.is_relative_to((ROOT/LS/'videos').resolve()) and path.suffix.lower()=='.avi'
            path.unlink()

        note=('\n\nAVI PRESENTATION FILES\n'
              'AVI presentation copies of TH and GH146 runs 03/04 are omitted from this deposit.\n'
              'Original TIFFs, numerical CSVs, acquisition timestamps and analysis sources remain unchanged.\n'
              'Display recordings are linked on iGEM Video Universe; they do not replace the raw TIFFs for analysis.\n'
              +('Historical GH146 run02 MAX_02.avi is also omitted at the team\'s explicit request; its full TIFF series was not supplied.\n' if remove_run02 else 'Historical GH146 run02 MAX_02.avi is retained because its full TIFF series was not supplied.\n')
              +''.join(f'{key}: {url}\n' for key,url in URLS.items()))
        for path in (ROOT/'README.txt',ROOT/'00-guide/KNOWN_GAPS.txt',ROOT/'00-guide/REPRODUCE.txt'):
            addtext(path,note)
        if remove_run02:
            p=ROOT/'00-guide/KNOWN_GAPS.txt';s=p.read_text(encoding='utf-8')
            s=s.replace('GH146 run 02 retains MAX_02.avi, ROI CSV and RoiSet.zip, but its complete TIFF',
                        'GH146 run 02 retains ROI CSV and RoiSet.zip; its AVI is omitted by request. Its complete TIFF')
            p.write_text(s,encoding='utf-8')
        p=ROOT/'START_HERE.html';s=p.read_text(encoding='utf-8')
        block='<section><h2>光片影片與原始影像</h2><p>TH、GH146 run03／04 的 AVI 展示影片已從資料包移除；原始 TIFF、CSV 與分析程式保留。'
        block+=('歷史 run02 AVI 亦依團隊要求移除；其完整 TIFF 未提供。' if remove_run02 else '歷史 run02 缺少完整 TIFF，因此保留 MAX_02.avi。')
        block+='</p><p>'+ ' · '.join(f'<a href="{url}">{key} — iGEM Video Universe</a>' for key,url in URLS.items())+'</p></section>'
        assert '</header>' in s;p.write_text(s.replace('</header>','</header>'+block,1),encoding='utf-8')
        p=ROOT/'00-provenance/published-video-replacements.json';d=json.loads(p.read_text(encoding='utf-8'))
        d['retained_avi_files']=[r for r in d['retained_avi_files'] if Path(r['path']).name not in {Path(v).name for v in selected}]
        d['status']='Published presentation videos are linked; selected AVI copies removed at user request; raw TIFF and numerical data unchanged.'
        d['avi_cleanup']={'removed':[{'path':rel,**value,'display_reference':display(rel) if not rel.endswith('MAX_02.avi') else None} for rel,value in originals.items()],
                          'retained_run02_avi':not remove_run02,'display_references_are_not_original_file_downloads':True}
        save(p,d)
        p=ROOT/'00-provenance/availability-links.csv';f,rows=readcsv(p)
        if 'published_display_url' not in f:f.append('published_display_url')
        for r in rows:
            rel='aerosense-wiki/'+r['resolved_source']
            if rel in selected:r.update(status='AVI omitted; display online; raw TIFF retained',published_display_url=display(rel))
        writecsv(p,f,rows)
        for kind in ('TH','GH146'):
            p=ROOT/(LS+'results/'+kind+'/index.html');s=p.read_text(encoding='utf-8')
            for rel in selected:
                name=Path(rel).name
                old='../../videos/'+kind+'/'+name
                if old in s:
                    s=s.replace(f'href="{old}" type="video/x-msvideo"',f'href="{display(rel)}"')
                    s=s.replace(f'href="{old}"',f'href="{display(rel)}"')
                    s=s.replace('>'+name+'</a>','>Watch on iGEM Video Universe</a>')
            p.write_text(s,encoding='utf-8')
        for p in (ROOT/(LS+'videos')).rglob('*_frames.json'):
            d=json.loads(p.read_text(encoding='utf-8'))
            if d.get('source') in {Path(r).name for r in selected}:
                rel=next(r for r in selected if Path(r).name==d['source'])
                d['sourceArchiveAvailability']='Historical AVI provenance retained; AVI omitted from this deposit; original TIFFs retained.'
                d['displayUrl']=display(rel);save(p,d)
        p=ROOT/'reports/lightsheet-v47/reproducibility/GH146/source_manifest.json';d=json.loads(p.read_text(encoding='utf-8'))
        d['integrity_before_avi_cleanup']=d['integrity']
        d['integrity']='All supplied raw CSV/ROI and current run03/04 TIFF inputs are retained unchanged. AVI presentation copies of runs03/04 were omitted; online display references are in the archive guide. '+('Historical run02 AVI is omitted at team request; full run02 TIFF/Settings were not supplied.' if remove_run02 else 'Historical run02 MAX_02.avi remains because its full TIFF/Settings were not supplied.')
        save(p,d)
        for filename in ('ZENODO_UPLOAD.txt','ZENODO_FORM.txt'):
            p=ROOT/'00-guide'/filename;s=p.read_text(encoding='utf-8')
            s=s.replace('10 個 ZIP','22 個 ZIP').replace('十個 ZIP','22 個 ZIP').replace('十份標題','一份標題').replace('13 個','26 個').replace('13 檔','26 檔').replace('約 25 GB','約 17 GB')
            s=s.replace('AeroSense-02c-lightsheet-GH146-run03-raw.zip','AeroSense-02c-lightsheet-GH146-run03-raw-part01-of07.zip 至 part07-of07.zip')
            s=s.replace('AeroSense-02d-lightsheet-GH146-run04-raw.zip','AeroSense-02d-lightsheet-GH146-run04-raw-part01-of07.zip 至 part07-of07.zip')
            s+='\n另須上傳外層 GH146_FILE_MAP.csv（分包對照），共 22 個 ZIP 與 4 個附件。\n目前檔名、大小和 SHA-256 以外層 PACKAGE_INDEX.csv 為準。\n'+note
            p.write_text(s,encoding='utf-8')
        p=ROOT/'00-guide/DATA_CATALOG.csv';f,rows=readcsv(p)
        for row in rows:
            if row['dataset_id']=='05-lightsheet':
                row['description']='TH, GH146 runs03/04 each retain 696 raw TIFFs; ROI traces, analysis and online display links'
                row['notes']+=' AVI presentations omitted; original raw TIFFs unchanged. '+('Historical run02 AVI also omitted by request.' if remove_run02 else 'Historical run02 AVI retained.')
            refs=set()
            for key in ('raw_or_input_paths','code_paths','output_or_document_paths'):
                for rel in filter(None,row[key].split(';')):
                    q=ROOT/rel;assert q.exists(),rel
                    refs.update([q] if q.is_file() else [v for v in q.rglob('*') if v.is_file()])
            row['referenced_unique_file_count']=len(refs);row['referenced_bytes']=sum(q.stat().st_size for q in refs)
        writecsv(p,f,rows)
        p=ROOT/'manifest.csv';f,rows=readcsv(p);rows=[r for r in rows if r['destination_relative'] not in selected]
        for row in rows:
            q=ROOT/row['destination_relative']
            if q.exists() and before.get(row['destination_relative'])!=[q.stat().st_size,q.stat().st_mtime_ns]:
                value=digest(q);row['sha256']=value['sha256'];row['bytes']=value['bytes']
        writecsv(p,f,rows)
        p=ROOT/'summary.json';d=json.loads(p.read_text(encoding='utf-8'))
        unique={r['destination_relative']:int(r['bytes']) for r in rows}
        d.update(payload_files=len(unique),payload_bytes=sum(unique.values()))
        d['avi_cleanup_2026_10_23']={'removed_files':selected,'removed_bytes':sum(v['bytes'] for v in originals.values()),'run02_avi_retained':not remove_run02,'original_tiff_and_csv_changed':False,'historical_import_records_do_not_describe_current_file_presence':True}
        save(p,d)

        # Keep the current 14-part GH146 mapping while updating the two affected themes.
        chunkfields,chunks=readcsv(OUT/u.CHUNK_MAP);chunk_by_path={r['path']:r for r in chunks}
        byname={r['zip_filename']:r for r in oldrows};byid={r['package_id']:r for r in oldrows}
        old_by_path={r['path']:r for r in oldmap}
        current=snapshot(ROOT);maprows=[]
        for rel in sorted(current):
            if rel in chunk_by_path:package=byname[chunk_by_path[rel]['zip_filename']]
            else:package=byid[old_by_path[rel]['package_id']]
            maprows.append({'path':rel,'package_id':package['package_id'],'zip_filename':package['zip_filename'],'local_zip_path':package['local_zip_path'],'topic':package['title']})
        writecsv(ROOT/'00-guide/PACKAGE_MAP.csv',['path','package_id','zip_filename','local_zip_path','topic'],maprows)
        inventory=[]
        for rel,stat in snapshot(ROOT).items():
            if rel in ('FILE_MANIFEST.csv','CHECKSUMS.sha256'):continue
            old=baseline[rel];row=dict(old)
            if before[rel]!=stat:row.update(bytes=stat[0],sha256=digest(ROOT/rel)['sha256'])
            inventory.append(row)
        inventory.sort(key=lambda r:r['path'])
        writecsv(ROOT/'FILE_MANIFEST.csv',invfields,inventory)
        checks={r['path']:r['sha256'] for r in inventory}
        checks['FILE_MANIFEST.csv']=digest(ROOT/'FILE_MANIFEST.csv')['sha256']
        (ROOT/'CHECKSUMS.sha256').write_text(''.join(f'{h}  {rel}\n' for rel,h in sorted(checks.items())),encoding='utf-8')
        checks['CHECKSUMS.sha256']=digest(ROOT/'CHECKSUMS.sha256')['sha256']
        after=snapshot(ROOT)
        assert set(before)-set(after)==set(selected) and not(set(after)-set(before))
        changed={rel for rel in after if before[rel]!=after[rel]}
        mapping={r['path']:r['package_id'] for r in maprows}
        assert {mapping[r] for r in changed}=={'00','02a'}
        assert all(before[rel]==after[rel] for rel in after if Path(rel).suffix.lower() in ('.tif','.tiff') or '/raw_data/' in rel)
        stage=HERE/'staging';stage.mkdir(exist_ok=True)
        newrows=[]
        for original in oldrows:
            if original['package_id'] not in ('00','02a'):newrows.append(original);continue
            rels=sorted(r['path'] for r in maprows if r['package_id']==original['package_id'])
            target=stage/original['zip_filename'];assert not target.exists()
            with zipfile.ZipFile(target,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
                for rel in rels:z.write(ROOT/rel,PREFIX+rel)
            with zipfile.ZipFile(target) as z:
                assert z.namelist()==[PREFIX+rel for rel in rels]
                for info in z.infolist():
                    rel=info.filename[len(PREFIX):]
                    with z.open(info) as f:
                        h=hashlib.sha256()
                        for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b)
                    assert h.hexdigest()==checks[rel] and info.file_size==after[rel][0]
            value=digest(target);row=dict(original)
            row.update(source_files=str(len(rels)),source_bytes=str(sum(after[r][0] for r in rels)),zip_bytes=str(value['bytes']),sha256=value['sha256'])
            newrows.append(row)
        assert snapshot(ROOT)==after and snapshot(OUT)==upload_before
        for row in newrows:
            if row['package_id'] in ('00','02a'):os.replace(stage/row['zip_filename'],OUT/row['local_zip_path'])
        writecsv(OUT/'PACKAGE_INDEX.csv',fields,newrows)
        (OUT/'ARCHIVE_CHECKSUMS.sha256').write_text(''.join(f"{r['sha256']}  {r['zip_filename']}\n" for r in newrows),encoding='utf-8')
        argv=sys.argv;sys.argv=[str(WORK/'aerosense-wiki/audit/zenodo-thematic-20261021/build_delivery_guide.py')]
        try:runpy.run_path(sys.argv[0])
        finally:sys.argv=argv
        entries=dict(oldplan['files'])
        for name,prior in previous.items():
            row=next((r for r in newrows if r['zip_filename']==name),None)
            entries[name]={'previous':prior,'replacement':digest(OUT/(row['local_zip_path'] if row else name))}
        plan={**oldplan,'mode':'gh146-chunked-avi-cleanup','reason':'User requested removal of redundant AVI presentations; replace only 00/02a and current indexes, then continue unchanged GH146 raw parts.',
              'file_names':list(entries),'files':entries,'protected_completed_zips':[n for n in oldplan['protected_completed_zips'] if n not in previous]}
        save(UP/'approved-replacements.json',plan)
        assert len(u.selected_files(u.collect_files(OUT),UP,scope='full-record'))==26
        unchanged=[r for r in newrows if r['package_id'] not in ('00','02a')]
        out_after=snapshot(OUT)
        assert all(out_after[r['local_zip_path']]==upload_before[r['local_zip_path']] for r in unchanged)
        stage.rmdir()
        report={'completed_local':True,'cloud_updated':False,'record_id':23469212,'removed_avi':originals,
                'removed_avi_count':len(selected),'removed_avi_bytes':sum(v['bytes'] for v in originals.values()),
                'retained_run02_avi':not remove_run02,'raw_files_unchanged':True,'source_files':len(after),
                'changed_source_files':sorted(changed),'changed_zip_names':list(previous)[:2],
                'unchanged_zip_count':len(unchanged),'new_02a_bytes':next(int(r['zip_bytes']) for r in newrows if r['package_id']=='02a'),
                'required_upload_files':26,'unchanged_remaining_gh146_bytes':sum(int(r['zip_bytes']) for r in newrows if r['package_id'].startswith(('02c-','02d-')))}
        save(HERE/'cleanup-receipt.json',report)
        print(json.dumps({k:v for k,v in report.items() if k not in ('removed_avi','changed_source_files')},ensure_ascii=True),flush=True)
    finally:lock.close()

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--remove-run02',action='store_true')
    main(parser.parse_args().remove_run02)
