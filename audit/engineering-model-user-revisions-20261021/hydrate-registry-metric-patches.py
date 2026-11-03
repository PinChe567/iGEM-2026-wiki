"""Apply observed Registry image URLs to prepared existing-entry source mirrors."""
from pathlib import Path
import datetime,hashlib,json,re
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
patches=json.loads((OUT/'registry-metric-clarification-patches.json').read_text('utf8'))
uploads={r['entry_key']:r for r in json.loads((OUT/'registry-uploaded-metric-images.json').read_text('utf8'))}
basepath=ROOT/'aerosense-wiki/audit/final-publication-20261021/registry-upload-documentation-payload.json'
payload=json.loads(basepath.read_text('utf8'));entrymap={e['entry_key']:e for p in payload['pages'] for e in p['entries']}
publicpath=ROOT/'registry_docs_v2/publication-links.json';links=json.loads(publicpath.read_text('utf8'))
receiptpath=OUT/'registry-metric-source-updates.json'
receipt=json.loads(receiptpath.read_text('utf8')) if receiptpath.exists() else {'files':[]}
oldrows={r['path']:r for r in receipt['files']};changed=[];ready=[]
for p in patches['patches']:
 if p['entry_key'] not in uploads:continue
 url=uploads[p['entry_key']]['url'];assert url.startswith('https://registry.igem.wiki/documentation/')
 body=p['body_template'].replace(p['image_placeholder'],url)
 assert p['image_placeholder'] not in body
 e=entrymap[p['entry_key']];e['body_markdown']=body;e['body_sha256']=hashlib.sha256(body.encode()).hexdigest()
 e['metric_display_update']={'scope':'Same S endpoints plus matching VUAA1 reference N display','remote_entry_id':p['remote_entry_id'],'public_save_status':'Requires exact readback receipt'}
 source=ROOT/p['source_path'];mirror=ROOT/'gitlab/aerosense-software/docs/aerosense/parts'/source.name
 for target in (source,mirror):
  text=target.read_text('utf8');before=sha(target)
  start=text.index('<a id="odor-2026-10-21"></a>',text.index('<!-- BEGIN ODOR 2026-10-21 -->'))
  end=text.index('<!-- END ODOR 2026-10-21 -->',start)
  new=text[:start]+body.rstrip()+'\n\n'+text[end:]
  assert re.findall(r'(?m)^\|.*\|$',text)==re.findall(r'(?m)^\|.*\|$',new)
  target.write_text(new,encoding='utf8',newline='\n')
  key=target.relative_to(ROOT).as_posix();record={'path':key,'before_sha256':oldrows.get(key,{}).get('before_sha256',before),'sha256':sha(target),'bytes':target.stat().st_size,'entry_key':p['entry_key']}
  oldrows[key]=record;changed.append(record)
 relative='figures/signal-metric-clarification-2026-10-21/'+Path(p['upload_path']).name
 links['links'][relative]={'url':url,'sha256':p['upload_sha256'],'canonical_archive_path':Path(p['upload_path']).relative_to(ROOT).as_posix(),'relation':'Registry-generated AVIF from this canonical PNG; source SHA verifies the input, not byte-identical remote transcoding.'}
 ready.append({**p,'body_markdown':body,'body_sha256':e['body_sha256'],'registry_image_url':url})
# Keep the repository-specific path/CLI adaptation; copy only the scientific template function.
local=ROOT/'registry_docs_v2/integrate_disturbance_characterisation.py'
remote=ROOT/'gitlab/aerosense-software/code/aerosense/parts-analysis/integrate_disturbance_characterisation.py'
source=local.read_text('utf8');dest=remote.read_text('utf8');before=sha(remote)
fn=re.search(r'def condition_block\(.*?(?=\ndef ratio_supplement\()',source,re.S).group(0)
dest=re.sub(r'def condition_block\(.*?(?=\ndef ratio_supplement\()',lambda m:fn,dest,flags=re.S)
if 'CLARIFICATION_BATCH = ' not in dest:dest=dest.replace('RATIO_FIGURE = "test2-vuaa1-referenced-map.svg"','RATIO_FIGURE = "test2-vuaa1-referenced-map.svg"\nCLARIFICATION_BATCH = "signal-metric-clarification-2026-10-21"')
remote.write_text(dest,encoding='utf8',newline='\n')
key=remote.relative_to(ROOT).as_posix();oldrows[key]={'path':key,'before_sha256':oldrows.get(key,{}).get('before_sha256',before),'sha256':sha(remote),'bytes':remote.stat().st_size,'scope':'Rerun-safe matching S/N display template; repository path/CLI adaptation preserved'}
publicpath.write_text(json.dumps(links,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
payload['status']='Metric-display clarification prepared; exact public status is recorded per existing UUID in registry-metric-public-readback.json.'
payload['metric_clarification']={'prepared_entries':len(ready),'no_new_entries':True,'tables_unchanged':True}
for pg in payload['pages']:
 f=ROOT/pg['source_path']
 if f.exists():pg['source_sha256']=sha(f)
(OUT/'registry-metric-clarification-ready-payload.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(OUT/'registry-metric-ready-patches.json').write_text(json.dumps({'patches':ready},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
receipt.update(updated_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),prepared_entries=len(ready),files=list(oldrows.values()),scope='Only 11 existing Test2 scientific Markdown bodies and their generator; all data tables preserved. Source preparation does not certify public Save.')
receiptpath.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'prepared_entries':len(ready),'source_records':len(oldrows),'ready_payload_sha256':sha(OUT/'registry-metric-clarification-ready-payload.json')},indent=2))
