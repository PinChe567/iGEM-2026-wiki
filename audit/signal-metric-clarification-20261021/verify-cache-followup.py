from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import importlib.util,json,urllib.request,re,html,datetime
A=Path(__file__).resolve().parent;B=A.parent/'notion-model-20261021'
spec=importlib.util.spec_from_file_location('verify',B/'verify-official-deployment.py');v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
readback=json.loads((B/'official-wiki-deployment-readback-799043.json').read_text(encoding='utf8'))
artifact=json.loads((B/'official-ci-public-hash-manifest-799043.json').read_text(encoding='utf8'))
failed=[r for r in readback['responses'] if not r['ok']];requests=[]
for old in failed:
    requests.append({k:old[k] for k in ['url','expected_path','kind']})
    rel=old['expected_path']
    if rel.endswith('.css'):
        page='contribution.html' if 'contribution' in rel else 'description.html'
        with urllib.request.urlopen(v.BASE+page,timeout=30) as response:text=response.read().decode('utf8')
        links=re.findall(r'(?:href|src)=["\']([^"\']+)["\']',text)
        link=next(html.unescape(x) for x in links if x.startswith(rel+'?'))
        url=v.BASE+link;kind='Actual hash-qualified stylesheet referenced by deployed HTML'
    else:
        url=old['url']+'?deployment=e5ef0ff8752f';kind='Fresh-query cache diagnostic; bare path result retained separately'
    requests.append({'url':url,'expected_path':rel,'kind':kind})
with ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(lambda r:v.fetch(r,artifact['files']),requests))
out={'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_changed':False,'original_readback_preserved':True,'responses':results,'passed':sum(x['ok'] for x in results),'total':len(results)}
(A/'deployment-cache-followup.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8')
print(json.dumps({'passed':out['passed'],'total':out['total'],'results':[{'url':r['url'],'ok':r['ok'],'error':r.get('error'),'sha':r.get('sha256')} for r in results]}))
