from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,requests,time
base=Path(__file__).parent
records=json.loads((base/'doi-link-routing-proposal.json').read_text(encoding='utf-8'))['records']
records=[r for r in records if r['route']=='verified_corresponding_video']
def check(row):
    time.sleep(.15)
    session=requests.Session();session.trust_env=False
    response=session.get('https://video.igem.org/api/v1/videos/'+row['proposed_url'].rsplit('/',1)[-1],timeout=(5,15))
    result={'page':row['page'],'label':row['proposed_label'],'url':row['proposed_url'],'http':response.status_code}
    if response.status_code==200:
        data=response.json();result.update(name=data.get('name'),privacy=data.get('privacy'),state=data.get('state'),uuid=data.get('uuid'))
    return result
with ThreadPoolExecutor(max_workers=3) as pool: results=list(pool.map(check,records))
(base/'doi-video-readback.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert all(r['http']==200 and r['privacy']['id']==1 and r['state']['id']==1 for r in results),results
print(json.dumps({'public_published_corresponding_videos':len(results)}))
