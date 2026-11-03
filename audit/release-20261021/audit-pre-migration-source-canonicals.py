"""Read-only exact-byte comparison of research source against all local archive files."""
from pathlib import Path
from collections import Counter
import hashlib,json,os,subprocess
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'aerosense-wiki/audit/final-publication-20261021'
REPO=ROOT/'gitlab/nthu';MAN=REPO/'code/aerosense/source-manifest.json'
def native(p):
 s=str(p.absolute());return Path('\\\\?\\'+s) if os.name=='nt' and len(s)>=240 and not s.startswith('\\\\?\\') else p
def sha(p):
 h=hashlib.sha256()
 with native(p).open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
manifest=json.loads(MAN.read_text(encoding='utf8'));source=[]
for r in manifest['files']:
 p=REPO/r['path'];digest=sha(p);assert digest==r['sha256'],r['path']
 source.append({'repository_path':r['path'],'sha256':digest,'bytes':native(p).stat().st_size,'topic':r.get('topic'),'canonical_candidates':[]})
source.append({'repository_path':'code/aerosense/source-manifest.json','sha256':sha(MAN),'bytes':MAN.stat().st_size,'topic':'publication_manifest','canonical_candidates':[]})
wanted={r['sha256'] for r in source};sizes={r['bytes'] for r in source};found={};scanned=0
paths=subprocess.check_output(['rg','--files','zenodo-release'],cwd=ROOT,text=True,encoding='utf8').splitlines()
for name in paths:
 p=ROOT/name
 try:
  if native(p).stat().st_size not in sizes:continue
 except FileNotFoundError:continue
 scanned+=1;digest=sha(p)
 if digest in wanted:found.setdefault(digest,[]).append(Path(name).as_posix())
for r in source:
 r['canonical_candidates']=found.get(r['sha256'],[]);r['exact_existing_canonical']=bool(r['canonical_candidates'])
report={'scope':'Read-only pre-migration research source exact-byte canonical audit; no copies/deletions, no whole-website snapshot. Existing candidates are actual full-file SHA matches, not just stale manifest claims.','source_manifest_sha256':sha(MAN),'source_files':len(source),'canonical_size_candidates_hashed':scanned,'with_exact_canonical':sum(r['exact_existing_canonical'] for r in source),'without_exact_canonical':sum(not r['exact_existing_canonical'] for r in source),'missing_by_topic':dict(Counter(r['topic'] for r in source if not r['exact_existing_canonical'])),'files':source}
(OUT/'pre-migration-source-canonical-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:report[k] for k in ['source_files','canonical_size_candidates_hashed','with_exact_canonical','without_exact_canonical','missing_by_topic']},ensure_ascii=False))
