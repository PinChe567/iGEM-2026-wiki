from pathlib import Path
from collections import defaultdict
import csv, json

ROOT=Path(__file__).resolve().parents[3]
SITE=ROOT/'aerosense-wiki';Z=ROOT/'zenodo-release'
result=json.loads((Path(__file__).parent/'cleanup-reauthorized-result.json').read_text(encoding='utf-8-sig'))
assert result['executed'] and result['deleted_odor_folder'] and result['deleted_videos']==23
cleanup_path=SITE/'audit/video-cleanup-20261021.json'
cleanup=json.loads(cleanup_path.read_text(encoding='utf-8'))
for item in cleanup['targets']:assert not Path(item['path']).exists()
for item in result['odor_backup_verified']:assert Path(item['archive']).is_file()
for item in result['original_avi_retained']:assert Path(item['path']).is_file()
cleanup.update(status='completed after renewed explicit user authorization',deleted_count=23,targets_remaining=0,
 previous_attempt={'status':'blocked by automatic approval review before execution','reason':'blocked by policy'},
 current_attempt='completed; all targets verified immediately before deletion',original_avi_retained=7)
cleanup.pop('block_reason',None)
cleanup_path.write_text(json.dumps(cleanup,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
removed=[]
for item in cleanup['targets']:
    p=Path(item['path'])
    if p.is_relative_to(Z):removed.append(item|{'destination_relative':p.relative_to(Z).as_posix()})
assert len(removed)==19
removed_dest={r['destination_relative']for r in removed}
mp=Z/'manifest.csv'
with mp.open(encoding='utf-8-sig',newline='')as f:
    reader=csv.DictReader(f);fields=reader.fieldnames;old=list(reader)
remaining=[r for r in old if r['destination_relative'] not in removed_dest]
with mp.open('w',encoding='utf-8',newline='')as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(remaining)
mapping={'status':'local copies removed at user request; originals in AVI retained',
         'retained_avi_files':result['original_avi_retained'],'published_video_replacements':removed}
(Z/'published-video-replacements.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
unique={r['destination_relative']:r for r in remaining};categories=defaultdict(lambda:{'files':0,'bytes':0})
for r in unique.values():categories[r['category']]['files']+=1;categories[r['category']]['bytes']+=int(r['bytes'])
sp=Z/'summary.json';d=json.loads(sp.read_text(encoding='utf-8'))
d.update(payload_files=len(unique),payload_bytes=sum(int(r['bytes'])for r in unique.values()),manifest_source_records=len(remaining),categories=dict(categories))
d['recorded_manifest_payload_bytes']=d['payload_bytes']
d['authorized_media_cleanup_completed_2026_10_21']={'odor_original_folder_removed':True,'odor_archived_xlsx_retained':12,'video_copies_removed':23,'zenodo_video_copies_removed':19,'original_avi_retained':7,'bytes_removed':sum(r['bytes']for r in cleanup['targets']),'github_untouched':True,'external_uploads':False,'source_version_note':'All 12 odor sources matched their archived copies immediately before deletion; later user reports an update, newer version not yet located.'}
d['current_publication_status']['videos']='All 15 mapped videos publicly accessible; 23 corresponding local MP4/WebM copies removed at renewed user request. Seven original AVI retained.'
d['odor_hardware_revision_2026_10_21']['video_deletion']={'authorized':True,'targets':23,'deleted':23,'original_AVI_retained':True,'completed_after_renewed_authorization':True}
sp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(d['authorized_media_cleanup_completed_2026_10_21'],ensure_ascii=False))
