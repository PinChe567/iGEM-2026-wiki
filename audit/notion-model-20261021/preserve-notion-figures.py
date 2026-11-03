"""Preserve only observed public Notion figure resources, de-duplicated by SHA."""
from pathlib import Path
from datetime import datetime,timezone
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import csv,hashlib,json,re,urllib.request,urllib.parse
from PIL import Image
A=Path(__file__).resolve().parent;R=A.parents[2];Z=R/'zenodo-release';D=Z/'aerosense-wiki/data/notion-model-2026-10-21/figures'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
sha=lambda b:hashlib.sha256(b).hexdigest()
ledger=load(R/'aerosense-wiki/igem-upload/verified-official-urls.json')
known={}
for r in csv.DictReader((Z/'manifest.csv').open(encoding='utf-8-sig',newline='')):known.setdefault(r['sha256'],r['destination_relative'])
observed=[]
for page in ['model','engineering']:
    blocks=load(A/(page+'-blocks.json'))['blocks']; bundle=load(A/(page+'-asset-bundle.json'))
    assets={urllib.parse.parse_qs(urllib.parse.urlsplit(x['url']).query)['id'][0]:x for x in bundle['assets']+bundle['failures']}
    for i,b in enumerate(blocks):
        if 'image-block' not in b.get('cls',''):continue
        asset=assets[b['id']];caption=blocks[i+1]['text'];n=re.match(r'Figure (\d+)\.',caption)
        label=f'{page}-figure-{n.group(1)}' if n else page+'-fly-anatomy'
        observed.append({'page':page,'label':label,'source_block_id':b['id'],'caption':caption,'asset':asset})
assert len(observed)==13
def obtain(x):
    asset=x['asset'];local=Path(asset['path']) if asset.get('path') else None
    if local and local.is_file():
        b=local.read_bytes();ct=asset.get('contentType');method='existing browser asset bundle';status=None
    else:
        req=urllib.request.Request(asset['url'],headers={'User-Agent':'Mozilla/5.0','Accept':'image/avif,image/webp,image/*,*/*;q=0.8'})
        with urllib.request.urlopen(req,timeout=60) as resp:
            status=resp.status;ct=resp.headers.get('Content-Type');b=resp.read()
        method='anonymous GET of observed public image URL'
    with Image.open(BytesIO(b)) as im:
        fmt=im.format;size=im.size;im.verify()
    ext={'WEBP':'.webp','PNG':'.png','JPEG':'.jpg','GIF':'.gif','AVIF':'.avif'}[fmt]
    return x,b,{'sha256':sha(b),'bytes':len(b),'actual_format':fmt,'extension':ext,'dimensions':list(size),'content_type':ct,'acquisition':method,'http_status':status}
with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(obtain,observed))
D.mkdir(parents=True,exist_ok=True);rows=[];new=[]
for x,b,meta in results:
    h=meta['sha256'];dest=Z/known[h] if h in known else D/(h[:12]+'-'+x['label']+meta['extension'])
    if dest.exists():assert sha(dest.read_bytes())==h
    else:dest.write_bytes(b);assert sha(dest.read_bytes())==h;new.append(str(dest.relative_to(Z)))
    known[h]=str(dest.relative_to(Z));official=sorted({y['official_url'] for y in ledger if y.get('response_sha256')==h})
    rows.append({k:x[k] for k in ['page','label','source_block_id','caption']}|meta|{'source_url':x['asset']['url'],'canonical_path':str(dest.resolve()),'canonical_relative':str(dest.relative_to(Z)).replace('\\','/'),'existing_official_urls':official,'upload_required':not bool(official)})
receipt={'created_at_utc':datetime.now(timezone.utc).isoformat(),'status':'all observed figures preserved','expected_references':13,'figure_references':len(rows),'unique_payloads':len({x['sha256'] for x in rows}),'new_canonical_files':new,'new_canonical_bytes':sum((Z/p).stat().st_size for p in new),'sources':[{ 'file':name,'sha256':sha((A/name).read_bytes())} for name in ['model-blocks.json','engineering-blocks.json','model-asset-bundle.json','engineering-asset-bundle.json']],'figures':rows,'limitations':['Notion proxy responses are the source supplied for this update; no unobserved higher-resolution/original URL was invented.','Correct extensions follow detected file formats; bytes were not re-encoded.','Anatomy figure credit is unresolved in the supplied source. Preservation is not a license assertion.','Master archive registration will follow source-package freeze.']}
(A/'notion-figure-preservation.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
unique={x['sha256']:x for x in rows if x['upload_required']}
(A/'notion-figure-upload-queue.json').write_text(json.dumps({'files':list(unique.values()),'references':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(A/'notion-figure-upload-paths.txt').write_text('\n'.join(x['canonical_path'] for x in unique.values())+'\n',encoding='utf8')
print(json.dumps({'references':len(rows),'unique':receipt['unique_payloads'],'new_files':len(new),'new_bytes':receipt['new_canonical_bytes'],'upload_unique':len(unique),'formats':sorted({x['actual_format'] for x in rows})}))
