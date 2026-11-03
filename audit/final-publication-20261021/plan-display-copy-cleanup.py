"""Inspect display duplicates against official receipts and canonical archive; never delete."""
from pathlib import Path
from collections import defaultdict,Counter
import csv,datetime,hashlib,json,os
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];SITE=ROOT/'aerosense-wiki';ARCHIVE=ROOT/'zenodo-release'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest=list(csv.DictReader((ARCHIVE/'manifest.csv').open(encoding='utf-8-sig',newline='')))
archive_by_hash=defaultdict(list)
for r in manifest:archive_by_hash[r['sha256']].append(ARCHIVE/r['destination_relative'])
receipts=json.loads((SITE/'igem-upload/verified-official-urls.json').read_text(encoding='utf-8'))
remote_by_source=defaultdict(list)
for r in receipts:remote_by_source[r['source_sha256']].append(r)
fresh={}
for name in ['official-readback.json','new-svg-readback.json','new-download-readback.json','new-game-art-readback.json']:
    p=OUT/name
    if not p.exists():continue
    for r in json.loads(p.read_text(encoding='utf-8')).get('assets',json.loads(p.read_text(encoding='utf-8')).get('results',[])):
        if r.get('ok'):fresh[r.get('official_url',r.get('url'))]=r.get('response_sha256',r.get('sha256'))
inventory=json.loads((OUT/'all-assets-inventory.json').read_text(encoding='utf-8'))
live={p:a['referenced_by'] for a in inventory['assets'] for p in a['paths']}
extensions={'.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.woff','.woff2','.ttf','.otf'}
archive_by_size=defaultdict(list)
for directory,dirs,files in os.walk(ARCHIVE):
    dirs[:]=[d for d in dirs if d not in {'node_modules','.git','__pycache__'}]
    for filename in files:
        candidate=Path(directory)/filename
        if candidate.suffix.lower() in extensions:archive_by_size[candidate.stat().st_size].append(candidate)
archive_hash_cache={}
allitems=[]
for tree in [SITE,ROOT/'registry_docs_v2/figures']:
    for directory,dirs,files in os.walk(tree):
        dirs[:]=[d for d in dirs if d not in {'audit','node_modules','.git','__pycache__'}]
        for filename in files:
            p=Path(directory)/filename
            if p.suffix.lower() not in extensions:continue
            h=sha(p);matches=[]
            for candidate in set(archive_by_hash[h]+archive_by_size[p.stat().st_size]):
                if candidate not in archive_hash_cache:archive_hash_cache[candidate]=sha(candidate) if candidate.is_file() else None
                if archive_hash_cache[candidate]==h:matches.append(candidate.relative_to(ROOT).as_posix())
            references=live.get(p.relative_to(SITE).as_posix(),[]) if p.is_relative_to(SITE) else []
            if p.is_relative_to(ROOT/'registry_docs_v2'):
                rel=p.relative_to(ROOT/'registry_docs_v2').as_posix()
                references=[x.relative_to(ROOT).as_posix() for x in (ROOT/'registry_docs_v2').glob('*.md') if ']('+rel+')' in x.read_text(encoding='utf-8')]
            official=[]
            for r in remote_by_source[h]:
                official.append({'url':r['official_url'],'source_sha256':h,'response_sha256':r['response_sha256'],'verification_grade':r['verification_grade'],'fresh_readback_matches':fresh.get(r['official_url'])==r['response_sha256']})
            eligible=bool(matches) and any(r['fresh_readback_matches'] for r in official) and not references
            allitems.append({'source':p.relative_to(ROOT).as_posix(),'absolute_source':str(p),'bytes':p.stat().st_size,'sha256':h,'canonical_matches':matches,'official_matches':official,'remaining_local_references':references,'eligible_after_immediate_recheck':eligible,'reasons_not_eligible':([] if matches else ['No byte-identical current canonical archive file found in manifest'])+([] if any(r['fresh_readback_matches'] for r in official) else ['No official mapping with fresh verified response bytes'])+([] if not references else ['Still referenced locally in current dependency snapshot']),'preserve_reproduction_output_mapping':p.is_relative_to(ROOT/'registry_docs_v2/figures')})
eligible=[r for r in allitems if r['eligible_after_immediate_recheck']]
report={'prepared_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'Proposal only; no media removed or archived','inspected_count':len(allitems),'eligible_count':len(eligible),'eligible_bytes':sum(r['bytes'] for r in eligible),'groups':dict(Counter('/'.join(Path(r['source']).parts[:3]) for r in eligible)),'eligible_files':eligible,'retained_or_pending':[r for r in allitems if not r['eligible_after_immediate_recheck']],'guard_policy':['Rebuild the live dependency graph after root completes every public URL rewrite, then immediately recheck source and surviving archive SHA and approved absolute path before removing individual files.','Preserve all canonical Zenodo originals, github entire tree, .git, all audit proofs and upload-staging.','A previously sanitized SVG is eligible only when the existing receipt records lossless/pixel-identical treatment and the fresh official bytes match that approved receipt; original source bytes must survive in Zenodo.','Registry figure importers currently verify local attachment bytes. If deleting their local copies, first adapt the importer to validate the surviving canonical archive copy while retaining publication-links.json.','Files lacking an archive counterpart are not deletion candidates. Stage any new archive copies and manifest updates explicitly before reconsidering.']}
(OUT/'proposed-display-media-cleanup.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'inspected':len(allitems),'eligible':len(eligible),'eligible_bytes':report['eligible_bytes'],'pending':len(allitems)-len(eligible),'groups':report['groups']}))
