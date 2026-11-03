"""Anonymous paced readback of confirmed UI updates; no remote writes."""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import argparse,datetime,hashlib,json,time
P=Path(__file__).resolve().parent
ap=argparse.ArgumentParser();ap.add_argument('--receptor');ap.add_argument('--resume',action='store_true');args=ap.parse_args()
sha=lambda b:hashlib.sha256(b).hexdigest()
patches=json.loads((P/'registry-metric-clarification-patches.json').read_text('utf8'))['patches']
mapping={r['entry_key']:r for r in json.loads((P/'registry-uploaded-metric-images.json').read_text('utf8'))}
receipt=P/'registry-metric-public-readback.json'
out=json.loads(receipt.read_text('utf8')) if receipt.exists() else {'checks':[]}
for p in patches:
 if p['entry_key'] not in mapping or (args.receptor and p['receptor']!=args.receptor):continue
 body=p['body_template'].replace(p['image_placeholder'],mapping[p['entry_key']]['url']);expected=sha(body.encode())
 if args.resume and any(r.get('pass') and r.get('expected_body_sha256')==expected and r['entry_key']==p['entry_key'] for r in out['checks']):continue
 row={'entry_key':p['entry_key'],'receptor':p['receptor'],'remote_entry_id':p['remote_entry_id'],'expected_body_sha256':expected,'expected_characters':len(body)}
 url=f"https://api.registry.igem.org/v1/parts/{p['part_uuid']}/documentation"
 try:
  with urlopen(Request(url,headers={'User-Agent':'AeroSense-public-readback/1.0'}),timeout=30) as response:
   raw=response.read();records=json.loads(raw)['data'];row['status']=response.status
  current=[r for r in records if r['uuid']==p['remote_entry_id']];assert len(current)==1
  r=current[0];value=r['value'];row.update(actual_body_sha256=sha(value.encode()),actual_characters=len(value),title_matches=r['title']==p['title'],type_matches=r['type'].lower()==p['type'].lower(),body_matches=value==body,first_80_characters=value[:80],response_sha256=sha(raw),duplicate_title_count=sum(x['title']==p['title'] and x['type']==r['type'] for x in records))
  row['pass']=row['body_matches'] and row['title_matches'] and row['type_matches'] and row['duplicate_title_count']==1
 except HTTPError as ex:
  row.update(status=ex.code,error=str(ex),retry_after=ex.headers.get('Retry-After'),pass_=False)
 except Exception as ex:row.update(error=str(ex),pass_=False)
 row['checked_utc']=datetime.datetime.now(datetime.timezone.utc).isoformat()
 out['checks']=[old for old in out['checks'] if old['entry_key']!=row['entry_key']]+[row]
 out.update(exact_pass_count=sum(r.get('pass',False) for r in out['checks']),expected_updates=11)
 receipt.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps(row,ensure_ascii=False),flush=True)
 if row.get('status')==429:break
 time.sleep(2)
