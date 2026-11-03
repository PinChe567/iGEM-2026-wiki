"""Replace only this task's frozen placeholders after byte-identical CDN readback."""
from pathlib import Path
import hashlib,json,datetime
A=Path(__file__).resolve().parent
R=A.parents[2]
S=R/'aerosense-wiki'
queue=json.loads((A/'official-upload-queue.json').read_text(encoding='utf-8'))['queue']
assert len(queue)==17 and all(x.get('verification_status') for x in queue)
mapping={}
for item in queue:
    for path in item['source_paths']:
        p=R/path
        assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256']
        mapping['../'+path]=item['official_url']
        if item['batch']=='pattern':
            suffix=path.split('hardware-wetlab-pattern-comparison-2026-10-21/',1)[1]
            mapping['resources/hardware-wetlab-pattern-2026-10-21/'+suffix]=item['official_url']
wet='../zenodo-release/aerosense-wiki/data/odor-complete-curves-2026-10-21/'
software='https://gitlab.igem.org/2026/software/nthu/aerosense/-/blob/main/code/aerosense/wetlab/aerosense-wiki/data/odor-complete-curves-2026-10-21/'
for path in ('README.md','METHODS.md','analysis/build_complete_curves.py','requirements.txt'):
    mapping[wet+path]=software+path
changes=[]
for name in ('results.html','hardware.html','measurement.html'):
    p=S/name
    before=p.read_text(encoding='utf-8')
    text=before
    applied=[]
    for old,new in mapping.items():
        count=text.count(old)
        if count:
            text=text.replace(old,new)
            applied.append({'old':old,'new':new,'count':count})
    assert 'resources/hardware-wetlab-pattern-2026-10-21/' not in text
    assert wet not in text
    if text!=before:p.write_text(text,encoding='utf-8',newline='')
    changes.append({'page':name,'changed':text!=before,'replacements':applied,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(A/'site-official-link-integration.json').write_text(json.dumps({'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'pages':changes},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pages':[(x['page'],sum(r['count'] for r in x['replacements'])) for x in changes]}))
