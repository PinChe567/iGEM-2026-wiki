"""Read public Registry records and map them to approved entries; never write remotely."""
from pathlib import Path
import urllib.request,urllib.error,json,hashlib,datetime,time,collections
A=Path(__file__).resolve().parent
payload_path=A/'registry-documentation-payload.json'
p=json.loads(payload_path.read_text(encoding='utf-8'))
author='c24b0a06-7fb2-4092-8980-3730248873a1'
def sha(s):return hashlib.sha256(s.encode('utf-8')).hexdigest()
pages=[];mapped=[];conflicts=[]
for page in p['pages']:
    entity='collections' if page['kind']=='collection' else 'parts'
    uid=page['collection_uuid'] if page['kind']=='collection' else page['part_uuid']
    if not uid:
        conflicts.append({'page_key':page['page_key'],'error':'UUID missing from saved public identity audit; resolve in official UI, do not request a None identifier.'})
        continue
    url=f'https://api.registry.igem.org/v1/{entity}/{uid}/documentation'
    try:
        with urllib.request.urlopen(url,timeout=30) as response:
            raw=response.read();live=json.loads(raw)
        records=live['data'];assert len(records)==live['total'],(page['page_key'],live['total'])
    except Exception as error:
        conflicts.append({'page_key':page['page_key'],'url':url,'error':str(error)})
        if isinstance(error,urllib.error.HTTPError) and error.code==429:
            conflicts.append({'reason':'Stopped immediately on rate limit; no further requests. Resume only when coordinated with root UI work.'})
            break
        continue
    for r in records:r['body_sha256']=sha(r['value'])
    pages.append({'page_key':page['page_key'],'api_url':url,'response_sha256':hashlib.sha256(raw).hexdigest(),'total':live['total'],'records':records})
    used=set()
    for entry in page['entries']:
        same=[r for r in records if r['type'].lower()==entry['type'].lower() and r['uuid'] not in used]
        exact=[r for r in same if r['title']==entry['title']]
        match=None
        if len(exact)==1:match=exact[0]
        elif len(exact)>1:conflicts.append({'entry_key':entry['entry_key'],'reason':'Duplicate exact title/type','ids':[r['uuid'] for r in exact]})
        elif entry['type_ordinal']==1 and len(same)==1:match=same[0]
        elif entry['type_ordinal']==1 and len(same)>1:conflicts.append({'entry_key':entry['entry_key'],'reason':'Multiple existing entries of type; UI semantic review required','ids':[r['uuid'] for r in same]})
        if match:
            if match['authorUUID']!=author:
                conflicts.append({'entry_key':entry['entry_key'],'reason':'Existing entry has another author; preserve','uuid':match['uuid']});continue
            used.add(match['uuid']);action='update_existing'
        else:action='create_if_absent'
        info={'entry_key':entry['entry_key'],'page_key':page['page_key'],'type':entry['type'],'type_ordinal':entry['type_ordinal'],'action':action,'remote_entry_id':match['uuid'] if match else None,'old_title':match['title'] if match else None,'old_body_sha256':match['body_sha256'] if match else None,'old_body_markdown':match['value'] if match else None,'new_title':entry['title'],'new_body_sha256':entry['body_sha256'],'url':page['url'],'modify_url':page['url']+'/documentation/'+match['uuid']+'/modify' if match else None,'author_verified':bool(match),'source':'Anonymous read-only official API; current records, not GitLab baseline.'}
        entry['remote_entry_id']=info['remote_entry_id'];entry['live_matching']=info
        mapped.append(info)
    unused=[r for r in records if r['uuid'] not in used]
    if unused:conflicts.append({'page_key':page['page_key'],'reason':'Existing records not mapped; preserve','ids':[r['uuid'] for r in unused]})
    time.sleep(8)
counts=dict(collections.Counter(r['action'] for r in mapped))
out={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'READ ONLY; no remote mutations','authenticated_account_evidence':'Root UI confirmed Ijung Chen and Opted in; public record authors independently matched by UUID.','live_pages':pages,'mapping':mapped,'counts':counts,'conflicts':conflicts,'mapped_entries':len(mapped),'live_existing_records':sum(x['total'] for x in pages),'rules':['Never use the older GitLab baseline to skip an update.','Update the exact existing UUID/type; preserve other authors.','Before creating, refresh the page to ensure no matching new entry was already saved.','If the current UI differs from this snapshot, compare title/type/content and refresh the mapping before writing.']}
(A/'registry-live-documentation-mapping.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p['status']='ready-auth-Ijung; finalized CDN routes; live IDs mapped from public API; no writes by this preparation workflow'
p['live_mapping_summary']={k:out[k] for k in ['checked_at_utc','counts','conflicts','mapped_entries','live_existing_records']}
payload_path.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(p['live_mapping_summary'],ensure_ascii=False))
