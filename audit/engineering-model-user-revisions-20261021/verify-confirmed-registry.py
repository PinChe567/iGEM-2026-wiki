"""Public GET verification of the 21 existing records affected by the confirmed map."""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import argparse,datetime,hashlib,json,time
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
ap=argparse.ArgumentParser();ap.add_argument('--receptor');ap.add_argument('--resume',action='store_true');args=ap.parse_args()
targets=json.loads((OUT/'registry-confirmed-map-targets.json').read_text('utf8'))['targets']+json.loads((OUT/'registry-additional-mapping-only-patches.json').read_text('utf8'))['patches']
maps={r['entry_key']:r for r in json.loads((OUT/'registry-confirmed-map-images.json').read_text('utf8'))}
base=json.loads((ROOT/'aerosense-wiki/audit/final-publication-20261021/registry-upload-documentation-payload.json').read_text('utf8'))
pages={p['url']:p for p in base['pages']};sha=lambda x:hashlib.sha256(x.encode()).hexdigest()
receipt=OUT/'registry-confirmed-map-public-readback.json';report=json.loads(receipt.read_text('utf8')) if receipt.exists() else {'checks':[]}
cache={}
for t in targets:
 if args.receptor and t.get('receptor')!=args.receptor:continue
 body=t.get('body_template',t.get('body_markdown'));placeholder=t.get('image_placeholder')
 if placeholder:
  if t['entry_key'] not in maps:continue
  body=body.replace(placeholder,maps[t['entry_key']]['url'])
 expected=sha(body)
 if args.resume and any(r['entry_key']==t['entry_key'] and r.get('pass') and r['expected_body_sha256']==expected for r in report['checks']):continue
 pg=pages[t['page_url']];url=('https://api.registry.igem.org/v1/collections/'+pg['collection_uuid'] if pg['kind']=='collection' else 'https://api.registry.igem.org/v1/parts/'+pg['part_uuid'])+'/documentation'
 r={'entry_key':t['entry_key'],'remote_entry_id':t['remote_entry_id'],'expected_body_sha256':expected,'expected_characters':len(body),'checked_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 try:
  if url not in cache:
   with urlopen(Request(url,headers={'User-Agent':'AeroSense-confirmed-map-readback/1.0'}),timeout=25) as res:raw=res.read();cache[url]=json.loads(raw)['data']
   time.sleep(2)
  records=cache[url];found=[x for x in records if x['uuid']==t['remote_entry_id']];assert len(found)==1
  item=found[0];actual=item['value'];r.update(status=200,actual_body_sha256=sha(actual),actual_characters=len(actual),body_matches=actual==body,title_matches=item['title']==t['title'],type_matches=item['type'].lower()==t['type'].lower(),literal_backslash_newlines=actual.count('\\n'),first_50_characters=actual[:50],duplicate_title_count=sum(x['title']==t['title'] and x['type']==item['type'] for x in records))
  r['pass']=r['body_matches'] and r['title_matches'] and r['type_matches'] and r['duplicate_title_count']==1
 except HTTPError as ex:r.update(status=ex.code,error=str(ex),retry_after=ex.headers.get('Retry-After'),pass_=False)
 except Exception as ex:r.update(error=str(ex),pass_=False)
 report['checks']=[x for x in report['checks'] if x['entry_key']!=r['entry_key']]+[r];report['exact_pass_count']=sum(x.get('pass',False) for x in report['checks']);report['expected_updates']=21
 receipt.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps(r,ensure_ascii=False),flush=True)
 if r.get('status')==429:break
