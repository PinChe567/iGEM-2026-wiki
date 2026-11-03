"""Replace obsolete publication routes with byte-verified CDN attachments."""
from pathlib import Path
import hashlib,json,re,datetime
A=Path(__file__).resolve().parent;R=A.parents[2];D=R/'registry_docs_v2'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
mapping={};evidence=[]
for name in ['verified-cdn-corrections-mapping.json','verified-cdn-research-documents-mapping.json']:
    for row in json.loads((A/name).read_text(encoding='utf-8'))['files']:
        assert row['verified'] and row['sha256']==row['response_sha256']
        for old in row.get('current_urls',[]):mapping[old]=row['official_url']
        if row.get('source_document'):
            rel=row['source_document'].removeprefix('gitlab/nthu/')
            for kind in ['raw','blob']:mapping[f'https://gitlab.igem.org/2026/nthu/-/{kind}/main/{rel}']=row['official_url']
        evidence.append(row)
collection='https://registry.igem.org/collections/40067138-a3dd-4e5b-b8a4-50b097ee0156'
changed=[]
for p in sorted(D.glob('*.md')):
    old=p.read_text(encoding='utf-8');new=old;edits=[]
    for before,after in mapping.items():
        n=new.count(before)
        if n:
            new=new.replace(before,after);edits.append({'old':before,'new':after,'count':n})
    if p.name=='00_COLLECTION.md' and '](00_INDEX.md)' in new:
        n=new.count('](00_INDEX.md)');new=new.replace('](00_INDEX.md)',']('+collection+')')
        edits.append({'old':'00_INDEX.md','new':collection,'count':n})
    if new!=old:
        # Routing changes only: no scientific values or prose rewritten.
        restored=new
        for e in reversed(edits):
            if e['old']=='00_INDEX.md':restored=restored.replace(']('+e['new']+')','](00_INDEX.md)',e['count'])
            else:restored=restored.replace(e['new'],e['old'],e['count'])
        assert restored==old,p
        before=sha(p);p.write_text(new,encoding='utf-8')
        changed.append({'path':p.relative_to(R).as_posix(),'before_sha256':before,'after_sha256':sha(p),'edits':edits})
links_path=D/'publication-links.json';links=json.loads(links_path.read_text(encoding='utf-8'))
for row in evidence:
    for rel in row.get('local_paths',[]):
        prefix='gitlab/nthu/docs/aerosense/parts/'
        if rel.startswith(prefix):
            links['links'][rel[len(prefix):]]={'url':row['official_url'],'sha256':row['sha256'],'verification':'Exact-byte CDN readback; source preserved separately in canonical research archive.'}
    if row.get('source_document','').endswith('/plate-p2-methods.html'):
        links['links']['executed-methods-pdf']={'url':row['official_url'],'sha256':row['sha256'],'source_document_sha256':row['source_document_sha256'],'verification':'PDF reading edition; original HTML preserved separately. Different formats, not byte-identical.'}
links_path.write_text(json.dumps(links,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(A/'registry-final-routing-receipt.json').write_text(json.dumps({'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'changed_documents':changed,'url_replacements':sum(e['count'] for r in changed for e in r['edits']),'scientific_narrative_unchanged':True,'registry_remote_mutations':0},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'changed_documents':len(changed),'url_replacements':sum(e['count'] for r in changed for e in r['edits'])}))
