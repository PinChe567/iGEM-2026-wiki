"""Prepare one read-only import payload; publication and remote matching are separate."""
from pathlib import Path
from collections import Counter
import datetime,hashlib,json,re,subprocess
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[2]
DOCS=ROOT/'registry_docs_v2'
OLD=ROOT/'gitlab/nthu/docs/aerosense/parts'
COLLECTION_ID='40067138-a3dd-4e5b-b8a4-50b097ee0156'
COLLECTION_URL='https://registry.igem.org/collections/'+COLLECTION_ID
PAT=re.compile(r'^={10,}\s*\nENTRY · Type: \*\*(?P<type>[^*]+)\*\*\s*\nTitle: (?P<title>[^\n]+)\nAffiliation: (?P<affiliation>[^\n]+)\n={10,}\s*\n',re.M)
def sha(text):return hashlib.sha256(text.encode()).hexdigest()
def parse_text(text):
    matches=list(PAT.finditer(text));entries=[]
    for i,m in enumerate(matches):
        body=text[m.end():matches[i+1].start() if i+1<len(matches) else len(text)]
        body=re.sub(r'<!-- (?:BEGIN|END) ODOR 2026-10-21 -->','',body).strip()
        entries.append({'type':m['type'],'title':m['title'],'affiliation':m['affiliation'],'body_markdown':body,'body_sha256':sha(body),'section_headings':re.findall(r'^#{2,6}\s+(.+)$',body,re.M)})
    return entries
def parse(p):return parse_text(p.read_text(encoding='utf-8'))

baseline_path=OUT/'registry-existing-baseline.json'
if baseline_path.exists():baseline=json.loads(baseline_path.read_text(encoding='utf-8'))
else:
    repository=ROOT/'gitlab/nthu'
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repository,text=True).strip()
    baseline={'evidence':'Committed GitLab documentation baseline before this publication sync; not an authenticated Registry read.','commit':commit,'pages':{}}
    for path in [DOCS/'00_COLLECTION.md',*sorted(DOCS.glob('BBa_*.md'))]:
        result=subprocess.run(['git','show',commit+':docs/aerosense/parts/'+path.name],cwd=repository,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        baseline['pages'][path.name]=parse_text(result.stdout.decode('utf-8')) if result.returncode==0 else []
    baseline_path.write_text(json.dumps(baseline,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

queue=json.loads((OUT/'official-upload-queue.json').read_text(encoding='utf-8'))
upload_by_path={p:q for q in queue['queue'] for p in q['source_paths']}
verified=json.loads((ROOT/'aerosense-wiki/igem-upload/verified-official-urls.json').read_text(encoding='utf-8'))
verified_urls={r['official_url'].split('?')[0]:r['response_sha256'] for r in verified}
for r in json.loads((ROOT/'aerosense-wiki/audit/media-readback.json').read_text(encoding='utf-8'))['assets']:
    if r.get('ok'):verified_urls[r['url'].split('?')[0]]=r['sha256']
api=json.loads((OUT/'registry-publication-audit.json').read_text(encoding='utf-8'))
ids={r['part_id']:r.get('uuid') for r in api.get('anonymous_api_readback',{}).get('results',[]) if r.get('uuid')}
pages=[]
for path in [DOCS/'00_COLLECTION.md',*sorted(DOCS.glob('BBa_*.md'))]:
    iscollection=path.name=='00_COLLECTION.md';part=path.name.split('__')[0]
    pagekey='collection' if iscollection else part
    slug=None if iscollection else part.lower().replace('_','-')
    entries=parse(path);old=baseline['pages'].get(path.name,[])
    seen=Counter()
    for index,entry in enumerate(entries):
        seen[entry['type']]+=1;ordinal=seen[entry['type']]
        same=[e for e in old if e['type']==entry['type']]
        previous=same[ordinal-1] if ordinal<=len(same) else None
        entry.update(entry_key=f'{pagekey}:{entry["type"].lower()}:{ordinal}',position=index+1,type_ordinal=ordinal,remote_entry_id=None)
        entry['matching']={'suggested_action':'match existing type/title then overwrite only with author/editor permission' if previous else 'check online duplicates then create if absent','evidence':baseline['evidence'],'baseline_commit':baseline['commit'],'old_title':previous['title'] if previous else None,'old_body_sha256':previous['body_sha256'] if previous else None,'title_changed':bool(previous and previous['title']!=entry['title']),'body_changed':bool(previous and previous['body_sha256']!=entry['body_sha256'])}
        links=[]
        for match in re.finditer(r'(?P<image>!)?\[(?P<label>[^\]]*)\]\((?P<target>[^)]+)\)',entry['body_markdown']):
            target=match['target'];item={'target':target,'image':bool(match['image']),'label':match['label']}
            if '://' in target:
                item['kind']='existing public URL'
                if target.startswith('https://static.igem.wiki/'):
                    item['historically_verified_sha256']=verified_urls.get(target.split('?')[0])
            elif target.startswith('#'):item['kind']='in-page anchor'
            else:
                filename,_,anchor=target.partition('#');local=DOCS/filename
                item['local_path']=local.relative_to(ROOT).as_posix()
                if filename.startswith('BBa_') and filename.endswith('.md'):
                    item.update(kind='Registry part link',publication_target='https://registry.igem.org/parts/'+filename.split('__')[0].lower().replace('_','-')+('#'+anchor if anchor else ''))
                elif filename=='00_COLLECTION.md':item.update(kind='observed existing Registry collection link',publication_target=COLLECTION_URL+('#'+anchor if anchor else ''),anchor=anchor)
                elif local.suffix.lower()=='.svg':
                    q=upload_by_path.get(item['local_path'])
                    item.update(kind='pending official SVG upload',sha256=hashlib.sha256(local.read_bytes()).hexdigest(),upload_filename=q['proposed_filename'] if q else None,publication_target=q.get('official_url') if q else None)
                else:item.update(kind='GitLab data/document attachment pending sync/readback',proposed_gitlab_path='docs/aerosense/parts/'+filename,publication_target=None)
            links.append(item)
        entry['link_resolution']=links
        entry['source_body_sha256']=entry['body_sha256']
        for item in links:
            if item.get('publication_target'):
                entry['body_markdown']=entry['body_markdown'].replace(']('+item['target']+')',']('+item['publication_target']+')')
        entry['body_sha256']=sha(entry['body_markdown'])
        assert not re.search(r'^ENTRY · Type:|^Affiliation:|^={10,}|^# ',entry['body_markdown'],re.M)
    pages.append({'page_key':pagekey,'kind':'collection' if iscollection else 'part','part_id':None if iscollection else part,'part_uuid':ids.get(part),'collection_uuid':COLLECTION_ID if iscollection else None,'slug':slug,'url':COLLECTION_URL if iscollection else 'https://registry.igem.org/parts/'+slug,'source_path':path.relative_to(ROOT).as_posix(),'source_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'entry_count':len(entries),'entries':entries})
total=sum(p['entry_count'] for p in pages);assert total==76 and len(pages)==26
form=(DOCS/'00_COLLECTION_form.md').read_text(encoding='utf-8')
description=form.split('Description (',1)[1].split('\n\n',1)[1].split('\n\n',1)[0]
payload={'prepared_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'prepared; not posted; 25 attachment URLs verified and existing collection resolved; account author permission remains pending','page_count':26,'entry_count':76,'part_count':25,'part_entry_count':69,'collection_entry_count':7,'collection_form':{'existing_collection_uuid':COLLECTION_ID,'existing_collection_url':COLLECTION_URL,'title':'Drosophila odorant receptor calcium-reporter platform','description':description,'affiliation':'NTHU (2026)','part_ids':[p['part_id'] for p in pages if p['kind']=='part']},'pages':pages,'import_rules':['Use type/title/affiliation metadata as form fields; do not duplicate them or source-file page headers in entry bodies.','Resolve every local link with returned official URLs and verified GitLab downloads before saving.','Match actual online entry ID/type/title and preserve other contributors. Local GitLab baseline is a hint, not proof of an existing Registry entry.','Use the same collection after discovering or creating its actual UUID; do not create duplicates.','Do not alter part sequences or existing short descriptions as a side effect of documentation publication.'],'summary':{'baseline_matches':sum(bool(e['matching']['old_title']) for p in pages for e in p['entries']),'new_relative_to_local_gitlab_baseline':sum(not e['matching']['old_title'] for p in pages for e in p['entries']),'entry_types':dict(Counter(e['type'] for p in pages for e in p['entries']))}}
live_path=OUT/'registry-live-documentation-mapping.json'
if live_path.exists():
    live=json.loads(live_path.read_text(encoding='utf-8'))
    bykey={record['entry_key']:record for record in live.get('mapping',[])}
    for page in pages:
        for entry in page['entries']:
            if entry['entry_key'] in bykey:
                record=bykey[entry['entry_key']]
                entry['remote_entry_id']=record.get('remote_entry_id')
                entry['live_matching']=record
    payload['status']='ready-auth-Ijung snapshot; final routes prepared; live ID map is partial and must be checked against current official UI before saving'
    payload['live_mapping_summary']={k:live.get(k) for k in ['checked_at_utc','counts','mapped_entries','live_existing_records']}
(OUT/'registry-documentation-payload.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pages':len(pages),'entries':total,**payload['summary']},indent=2))
