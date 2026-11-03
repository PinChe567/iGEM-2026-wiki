from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import datetime,hashlib,json,re,urllib.parse,urllib.request
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];DOCS=ROOT/'registry_docs_v2'
urls=set(u for p in DOCS.glob('*.md') for u in re.findall(r'https://static\.igem\.wiki/[^)\s]+\.svg',p.read_text(encoding='utf-8')))
sources={p.name:p for p in (DOCS/'figures').glob('*.svg')};items=[]
for url in sorted(urls):
    name=Path(urllib.parse.urlsplit(url).path).name
    if name in sources:items.append((url,sources[name]))
def check(item):
    url,p=item;expected=hashlib.sha256(p.read_bytes()).hexdigest()
    try:
        with urllib.request.urlopen(url,timeout=35) as response:body=response.read();status=response.status
        actual=hashlib.sha256(body).hexdigest()
        return {'official_url':url,'source_sha256':expected,'response_sha256':actual,'status':status,'bytes':len(body),'ok':status==200 and actual==expected,'source_paths':[p.relative_to(ROOT).as_posix()],'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    except Exception as e:return {'official_url':url,'source_sha256':expected,'ok':False,'error':str(e)}
with ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(check,items))
(OUT/'existing-registry-figures-readback.json').write_text(json.dumps({'count':len(results),'passed':sum(r['ok'] for r in results),'results':results},indent=2)+'\n',encoding='utf-8')
receipt=ROOT/'aerosense-wiki/igem-upload/verified-official-urls.json';records=json.loads(receipt.read_text(encoding='utf-8'));known={(r['official_url'],r['source_sha256']) for r in records}
for r in results:
    if r['ok'] and (r['official_url'],r['source_sha256']) not in known:
        records.append({'source_paths':['../'+p for p in r['source_paths']],'workspace_source_paths':r['source_paths'],'official_url':r['official_url'],'source_sha256':r['source_sha256'],'response_sha256':r['response_sha256'],'verification_grade':'byte_identical_original','verified_at_utc':r['checked_at_utc'],'verification_policy':'strict-original-full-byte-sha256'})
receipt.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'count':len(results),'passed':sum(r['ok'] for r in results),'failed':[r for r in results if not r['ok']]}))
