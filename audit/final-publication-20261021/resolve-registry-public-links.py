"""Resolve only SHA-verified official attachment links, retaining local canonical files."""
from pathlib import Path
import datetime,hashlib,json,re
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];DOCS=ROOT/'registry_docs_v2'
verified=json.loads((ROOT/'aerosense-wiki/igem-upload/verified-official-urls.json').read_text(encoding='utf-8'))
mapping={}
for r in verified:
    if r['source_sha256']!=r['response_sha256']:continue
    for source in r.get('workspace_source_paths',[]):
        if source.startswith('registry_docs_v2/'):
            p=ROOT/source
            assert hashlib.sha256(p.read_bytes()).hexdigest()==r['source_sha256'],source
            mapping[p.relative_to(DOCS).as_posix()]={'url':r['official_url'],'sha256':r['source_sha256']}
assert len(mapping)>=18
(DOCS/'publication-links.json').write_text(json.dumps({'verification':'Full-byte anonymous HTTPS readback, matching current local attachment SHA-256. Canonical local attachments are retained.','links':mapping},indent=2)+'\n',encoding='utf-8')
changes=[]
for p in DOCS.glob('*.md'):
    t=p.read_text(encoding='utf-8');before=t;count=0
    for rel,info in mapping.items():
        count+=t.count(']('+rel+')');t=t.replace(']('+rel+')',']('+info['url']+')')
    if p.name=='00_INDEX.md':
        t=t.replace('Relative assets are in `figures/odor-2026-10-21/` and `data/odor-2026-10-21/`. Preserve these folders with the Markdown. Dates and source identifiers remain in provenance. New relative assets have not been uploaded or assigned public URLs.','Canonical attachments remain in `figures/odor-2026-10-21/` and `data/odor-2026-10-21/`. Preserve these folders with the Markdown. Dates and source identifiers remain in provenance. Public figure links use official iGEM CDN URLs after full-byte SHA-256 verification; `publication-links.json` preserves the local-to-public mapping. Registry entry publication is a separate step.')
    if t!=before:
        p.write_text(t,encoding='utf-8',newline='\n');changes.append({'file':p.name,'links_resolved':count,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
report={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'attachment_count':len(mapping),'link_occurrences_replaced':sum(r['links_resolved'] for r in changes),'changed_documents':changes,'raw_data_changed':False,'numeric_tables_changed':False,'remote_registry_entries_written':False}
(OUT/'registry-public-link-resolution.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'attachments':len(mapping),'links_replaced':report['link_occurrences_replaced'],'docs':len(changes)}))
