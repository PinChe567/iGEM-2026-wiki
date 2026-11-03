"""Preserve only missing exact research/software source editions before migration."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,os,shutil
ROOT=Path(__file__).resolve().parents[3];AUD=ROOT/'aerosense-wiki/audit/final-publication-20261021'
DEST=ROOT/'zenodo-release/reproduction-source/software-source-before-migration-20261021'
def native(p):
 s=str(p.absolute());return Path('\\\\?\\'+s) if os.name=='nt' and len(s)>=240 and not s.startswith('\\\\?\\') else p
def sha(p):
 h=hashlib.sha256()
 with native(p).open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
audit=json.loads((AUD/'pre-migration-source-canonical-audit.json').read_text(encoding='utf8'));rows=[];saved={};new=0;newbytes=0
for r in audit['files']:
 src=ROOT/'gitlab/nthu'/r['repository_path'];assert sha(src)==r['sha256'],r['repository_path']
 if r['canonical_candidates']:
  existing=ROOT/r['canonical_candidates'][0];assert sha(existing)==r['sha256'];target=existing;action='reuse_existing_exact_canonical'
 elif r['sha256'] in saved:
  target=saved[r['sha256']];action='reuse_same_hash_preserved_once'
 else:
  target=DEST/r['repository_path'];assert target.resolve().is_relative_to(DEST.resolve())
  if native(target).exists():assert sha(target)==r['sha256'];action='reuse_prior_run_exact'
  else:
   native(target.parent).mkdir(parents=True,exist_ok=True);shutil.copyfile(native(src),native(target));new+=1;newbytes+=r['bytes'];action='preserve_missing_exact_source'
  assert sha(target)==r['sha256'];saved[r['sha256']]=target
 rows.append({'repository_path':r['repository_path'],'canonical':target.relative_to(ROOT).as_posix(),'sha256':r['sha256'],'bytes':r['bytes'],'action':action})
DEST.mkdir(parents=True,exist_ok=True)
manifest={'created_at_utc':datetime.now(timezone.utc).isoformat(),'purpose':'Exact research and software source edition before transfer from the Wiki repository to the official Software repository. Only bytes absent from the existing archive were copied; entries can reuse other canonical locations. This is not a full website backup or a public-deposit claim.','historical_publication_urls':'URLs in this edition can reference the previous Wiki repository location. The final Software publication edition, license and commit will be documented separately after routing is frozen.','source_manifest_sha256':audit['source_manifest_sha256'],'files_checked':len(rows),'new_unique_files':new,'new_unique_bytes':newbytes,'files':rows}
(DEST/'PRESERVATION-MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(AUD/'pre-migration-source-preservation-receipt.json').write_text(json.dumps({k:v for k,v in manifest.items() if k!='files'}|{'manifest':(DEST/'PRESERVATION-MANIFEST.json').relative_to(ROOT).as_posix(),'manifest_sha256':sha(DEST/'PRESERVATION-MANIFEST.json'),'all1220_exact_preserved':True,'source_files_modified':0,'source_files_deleted':0},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'checked':len(rows),'new_unique_files':new,'new_unique_bytes':newbytes,'receipt':'pre-migration-source-preservation-receipt.json'}))
