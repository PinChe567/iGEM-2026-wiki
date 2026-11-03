"""Preserve unsupported attachment bytes in official GitLab publication paths."""
from pathlib import Path
from collections import defaultdict
import datetime,hashlib,json,os,shutil,urllib.parse
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];REPO=ROOT/'gitlab/nthu'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
queue=json.loads((OUT/'official-download-upload-queue.json').read_text(encoding='utf-8'))
unsupported=[r for r in queue['queue'] if Path(r['canonical_path']).suffix.lower() in {'.zip','.xlsx','.txt','.md'}]
assert len(unsupported)==13
size_index=defaultdict(list)
for tree in ['code','docs']:
    for directory,dirs,files in os.walk(REPO/tree):
        dirs[:]=[d for d in dirs if d not in {'node_modules','__pycache__','.git'}]
        for filename in files:
            p=Path(directory)/filename
            if p.suffix.lower() not in {'.zip','.xlsx','.txt','.md'}:continue
            size_index[p.stat().st_size].append(p)
rows=[]
for r in unsupported:
    source=ROOT/r['canonical_path'];h=sha(source);assert h==r['sha256']
    matches=[p for p in size_index[r['bytes']] if p.suffix.lower()==source.suffix.lower() and sha(p)==h]
    if matches:dest=sorted(matches,key=lambda p:(len(str(p)),str(p)))[0];copied=False
    else:
        if source.suffix=='.zip':rel='code/aerosense/reproducibility-packages/hardware/'+source.name
        elif source.suffix=='.xlsx':rel='docs/aerosense/entrepreneurship/'+source.name
        elif source.suffix=='.txt':rel='code/aerosense/visualization/aerosense-wiki/assets/licenses/'+source.name
        else:rel='docs/aerosense/hardware/reproduction/'+source.parent.name+'-README.md'
        dest=REPO/rel
        assert not dest.exists(),('Refusing to overwrite different publication content',dest)
        dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dest);copied=True
    assert sha(dest)==h
    route='raw' if source.suffix in {'.zip','.xlsx'} else 'blob'
    relative=dest.relative_to(REPO).as_posix()
    rows.append({'source_paths':r['source_paths'],'sha256':h,'bytes':r['bytes'],'destination':relative,'official_url':'https://gitlab.igem.org/2026/nthu/-/'+route+'/main/'+urllib.parse.quote(relative,safe='/'),'url_role':'download' if route=='raw' else 'readable source/document','reuse_existing_byte_identical_gitlab_copy':not copied,'copied_now':copied,'status':'local GitLab fallback prepared; publication/readback pending','cdn_status':'Uploader rejected tested extension; no CDN file created','references':r['references']})
report={'prepared_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'count':len(rows),'bytes':sum(r['bytes'] for r in rows),'new_files':sum(r['copied_now'] for r in rows),'existing_reused':sum(not r['copied_now'] for r in rows),'reason':'Authenticated upload UI accepted CSV/JSON/SVG but rejected individual XLSX, TXT, MD and ZIP attempts (root-observed server Object error; no file created). Official GitLab is used for these source/download artifacts.','files':rows,'limitations':['These URLs are proposed official GitLab publication targets, not claimed HTTP-verified before commit/push.','No new ZIP was generated. All six bundles retain existing canonical bytes.','License TXT stays with the published visualization source.','Do not state that every static download is on the CDN; these thirteen use the official source repository.']}
(OUT/'official-gitlab-download-fallbacks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['count','bytes','new_files','existing_reused']}))
