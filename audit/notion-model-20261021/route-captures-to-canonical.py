"""Point the historical one-shot integrator at canonical captures; do not run it."""
from pathlib import Path
from datetime import datetime,timezone
import ast,csv,hashlib,json
ROOT=Path(__file__).resolve().parents[3];A=Path(__file__).resolve().parent;Z=ROOT/'zenodo-release'
P=Z/'aerosense-wiki/data/notion-model-2026-10-21'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
site_before={n:sha(ROOT/'aerosense-wiki'/n) for n in ['model.html','engineering.html']}
audit=A/'integrate-notion-model.py';canonical=P/'sources/integrate-notion-model.py'
assert sha(audit)==sha(canonical)
before=sha(canonical);old=canonical.read_text(encoding='utf8')
text=old.replace("AUDIT = Path(__file__).resolve().parent\nSITE = AUDIT.parents[1]", "WORKSPACE = next(parent for parent in Path(__file__).resolve().parents if (parent / 'aerosense-wiki').is_dir() and (parent / 'zenodo-release').is_dir())\nSITE = WORKSPACE / 'aerosense-wiki'\nAUDIT = SITE / 'audit/notion-model-20261021'\nCAPTURES = WORKSPACE / 'zenodo-release/aerosense-wiki/data/notion-model-2026-10-21/sources'")
assert text!=old
assert text.count("AUDIT / 'model-blocks.json'")==1 and text.count("AUDIT/'engineering-blocks.json'")==1
text=text.replace("AUDIT / 'model-blocks.json'", "CAPTURES / 'model-blocks.json'").replace("AUDIT/'engineering-blocks.json'", "CAPTURES/'engineering-blocks.json'")
ast.parse(text)
for path in [audit,canonical]:path.write_text(text,encoding='utf8',newline='\n')
assert sha(audit)==sha(canonical)
checks=[]
for name,count in [('model-blocks.json',150),('engineering-blocks.json',31)]:
    src=A/name;dst=P/'sources'/name
    assert sha(src)==sha(dst) and len(read(dst)['blocks'])==count
    checks.append({'audit_path':str(src),'canonical_path':str(dst),'sha256':sha(dst),'bytes':dst.stat().st_size,'blocks':count})
master=Z/'manifest.csv';before_master=sha(master)
with master.open(encoding='utf-8-sig',newline='') as f:
    rd=csv.DictReader(f);fields=rd.fieldnames;rows=list(rd)
matches=[r for r in rows if r['destination_relative']==canonical.relative_to(Z).as_posix()]
assert len(matches)==1 and matches[0]['sha256']==before
delta=canonical.stat().st_size-int(matches[0]['bytes'])
matches[0].update(sha256=sha(canonical),bytes=str(canonical.stat().st_size),source_mtime_utc=datetime.now(timezone.utc).isoformat())
assert sha(master)==before_master
with master.open('w',encoding='utf-8-sig',newline='') as f:
    wr=csv.DictWriter(f,fieldnames=fields);wr.writeheader();wr.writerows(rows)
summary=read(Z/'summary.json')
summary['payload_bytes']+=delta
summary['categories']['notion-model-source-and-figures']['bytes']+=delta
summary['notion_model_update_2026_10_21']['new_canonical_bytes']+=delta
summary['notion_model_update_2026_10_21']['capture_lookup']='Integration/extraction read canonical sources; duplicate audit raw JSON copies eligible for exact removal.'
write(Z/'summary.json',summary)
assert site_before=={n:sha(ROOT/'aerosense-wiki'/n) for n in site_before}
receipt={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'captures':checks,
         'integrator_before_sha256':before,'integrator_sha256':sha(canonical),'integrator_bytes_delta':delta,
         'integrator_not_executed':True,'syntax_parse_pass':True,'published_extractor_already_uses_archive_root':True,
         'site_hashes_unchanged':site_before,'master_manifest_sha256':sha(master),
         'new_package_bytes':summary['notion_model_update_2026_10_21']['new_canonical_bytes'],
         'audit_markdown_duplicates':[],'deletion_performed':False}
write(A/'canonical-capture-reference-check.json',receipt)
print(json.dumps(receipt,indent=2))
