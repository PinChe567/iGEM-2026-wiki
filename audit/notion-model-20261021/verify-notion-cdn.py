"""Verify the newly observed official figure URLs; append byte-identical proofs."""
from pathlib import Path
from datetime import datetime,timezone
from concurrent.futures import ThreadPoolExecutor
import json,hashlib,urllib.request,urllib.parse
A=Path(__file__).resolve().parent;R=A.parents[2];S=R/'aerosense-wiki'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
write=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
sha=lambda b:hashlib.sha256(b).hexdigest()
source=read(A/'notion-figure-preservation.json')['figures'];source=[x for x in source if x['label']!='model-fly-anatomy']
urls=read(A/'official-image-links.json');unique={x['sha256']:x for x in source};assert len(unique)==11
for x in unique.values():
    matches=[u for u in urls if urllib.parse.urlsplit(u).path.split('/')[-1]==Path(x['canonical_path']).name]
    assert len(matches)==1,(x['label'],matches);x['official_url']=matches[0]
def verify(x):
    with urllib.request.urlopen(x['official_url'],timeout=60) as r:b=r.read();status=r.status;ct=r.headers.get('Content-Type');final=r.url
    assert status==200 and sha(b)==x['sha256'] and len(b)==x['bytes'],x['label']
    return {'official_url':x['official_url'],'canonical_path':x['canonical_path'],'source_sha256':x['sha256'],'response_sha256':sha(b),'bytes':len(b),'status':status,'content_type':ct,'final_url':final,'passed':True}
with ThreadPoolExecutor(max_workers=3) as pool:proofs=list(pool.map(verify,unique.values()))
now=datetime.now(timezone.utc).isoformat();bysha={x['source_sha256']:x for x in proofs};mapping=[]
for x in source:mapping.append({k:x[k] for k in ['label','page','source_block_id','source_url','sha256','canonical_path','dimensions','caption']}|{'official_url':bysha[x['sha256']]['official_url']})
lp=S/'igem-upload/verified-official-urls.json';ledger=read(lp);known={x['official_url']:x for x in ledger};added=[]
for p in proofs:
    if p['official_url'] in known:assert known[p['official_url']]['response_sha256']==p['response_sha256'];continue
    relative=Path(p['canonical_path']).relative_to(R).as_posix()
    ledger.append({'source_paths':['../'+relative],'workspace_source_paths':[relative],'official_url':p['official_url'],'source_sha256':p['source_sha256'],'response_sha256':p['response_sha256'],'verification_grade':'byte_identical_original','verified_at_utc':now,'verification_policy':'strict-original-full-byte-sha256'});added.append(p['official_url'])
write(lp,ledger)
write(A/'verified-notion-figures-mapping.json',{'verified_at_utc':now,'unique_files':11,'figure_references':12,'all_passed':True,'files':proofs,'mapping':mapping,'ledger_added_urls':added,'excluded_original_anatomy':True})
print(json.dumps({'passed':len(proofs),'references':len(mapping),'ledger_added':len(added)}))
