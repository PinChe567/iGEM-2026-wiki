"""Stage approved numerical figure attachments without renaming their formats."""
from pathlib import Path
import hashlib, json, re, shutil
OUT=Path(__file__).resolve().parent
WORK=OUT.parents[2]
candidate=json.loads((OUT.parent/'release-20261021/pending-static-download-upload-candidates.json').read_text(encoding='utf-8'))
stage=OUT/'cdn-corrections-staging'
stage.mkdir(exist_ok=True)
rows=[]
for item in candidate['files']:
    source=(WORK/item['local_paths'][0]).resolve()
    assert source.is_relative_to(WORK.resolve())
    if source.suffix.lower() not in ('.csv','.json'): continue
    assert source.stat().st_size==item['bytes']
    assert hashlib.sha256(source.read_bytes()).hexdigest()==item['sha256']
    name=item['sha256'][:12]+'-'+re.sub(r'[^a-z0-9.-]+','-',source.name.lower())
    target=stage/name
    if target.exists(): assert hashlib.sha256(target.read_bytes()).hexdigest()==item['sha256']
    else: shutil.copy2(source,target)
    rows.append({**item,'staging_path':str(target),'filename':name,'status':'prepared; upload and public readback pending'})
report={'count':len(rows),'bytes':sum(r['bytes'] for r in rows),'files':rows}
(OUT/'cdn-corrections-upload-queue.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='files'}))
