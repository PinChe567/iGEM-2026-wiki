"""Verify the complete proposed Git tree, including removals from the old template."""
from pathlib import Path
from collections import Counter
import json, subprocess, hashlib, sys
OUT=Path(__file__).resolve().parent
SOFTWARE = '--software' in sys.argv
REPO=OUT.parents[2]/('gitlab/aerosense-software' if SOFTWARE else 'gitlab/nthu')
def git(*args, **kw): return subprocess.check_output(['git','-C',str(REPO),*args],**kw)
names=[p for p in git('ls-files','-z').decode('utf-8').split('\0') if p]
data=git('cat-file','--batch',input=''.join(':'+p+'\n' for p in names).encode('utf-8'))
forbidden_ext={'.zip','.7z','.rar','.pdf','.docx','.xlsx','.xls','.pptx','.png','.jpg','.jpeg','.gif','.svg','.webp','.avif','.woff','.woff2','.mp4','.avi','.mov','.csv','.tsv','.rpt','.stl','.brd','.pyc','.npy','.npz','.pkl','.pickle','.pt','.pth','.onnx','.tif','.tiff'}
failures=[]; files=[]; pos=0
for name in names:
    end=data.index(b'\n',pos); header=data[pos:end].decode(); pos=end+1
    if header.endswith(' missing'):
        failures.append({'path':name,'reason':'missing index object'}); continue
    oid,kind,size=header.split(); size=int(size); body=data[pos:pos+size];pos+=size+1
    reasons=[]
    if not SOFTWARE and size > 1_000_000: reasons.append('exceeds official Wiki Git 1 MB file limit')
    if Path(name).suffix.lower() in forbidden_ext: reasons.append('disallowed artifact extension')
    if b'\x00' in body: reasons.append('binary NUL byte')
    if name.startswith(('static/','wiki/','public/','.build-check/','.npm/')): reasons.append('legacy or generated path')
    if any(x in name for x in ['/node_modules/','/dist/','/__pycache__/']): reasons.append('generated dependency/cache')
    if name in ('app.py','dependencies.txt'): reasons.append('obsolete Flask deployment')
    if reasons: failures.append({'path':name,'reasons':reasons})
    files.append({'path':name,'bytes':size,'sha256':hashlib.sha256(body).hexdigest(),'git_blob':oid})
required=(['.claude/RESPONSIBLE_AI_USE.md','LICENSE','.gitattributes','code/aerosense/source-manifest.json'] if SOFTWARE else ['.claude/RESPONSIBLE_AI_USE.md','LICENSE','.gitlab-ci.yml','.gitattributes','site/publication-files.json'])
for name in names:
    if not SOFTWARE and name.startswith(('code/aerosense/','docs/aerosense/')):
        failures.append({'path':name,'reason':'research source belongs in official Software repository'})
for name in required:
    if name not in names: failures.append({'path':name,'reason':'required source missing'})
report={'checked':len(files),'bytes':sum(x['bytes'] for x in files),'failures':failures,'extensions':dict(Counter(Path(x['path']).suffix.lower() for x in files)),'files':files}
(OUT/('software-source-only-index-verification.json' if SOFTWARE else 'source-only-index-verification.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='files'},indent=2))
raise SystemExit(bool(failures))
