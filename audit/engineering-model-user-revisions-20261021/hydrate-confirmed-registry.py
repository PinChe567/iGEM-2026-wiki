"""Hydrate current confirmed-map publication targets and exact Markdown mirrors."""
from pathlib import Path
import hashlib,json,re,datetime
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
targets=json.loads((OUT/'registry-confirmed-map-targets.json').read_text('utf8'))['targets']+json.loads((OUT/'registry-additional-mapping-only-patches.json').read_text('utf8'))['patches']
images={x['entry_key']:x for x in json.loads((OUT/'registry-confirmed-map-images.json').read_text('utf8'))}
base=json.loads((ROOT/'aerosense-wiki/audit/final-publication-20261021/registry-upload-documentation-payload.json').read_text('utf8'));entries={e['entry_key']:e for pg in base['pages'] for e in pg['entries']}
ready=[];files={}
for t in targets:
 body=t.get('body_template',t.get('body_markdown'));placeholder=t.get('image_placeholder')
 if placeholder:
  if t['entry_key'] not in images:continue
  body=body.replace(placeholder,images[t['entry_key']]['url'])
 e=entries[t['entry_key']];e['body_markdown']=body;e['body_sha256']=hashlib.sha256(body.encode()).hexdigest()
 ready.append({**t,'body_markdown':body,'body_sha256':e['body_sha256']})
 local=ROOT/t['source_path'];mirror=ROOT/'gitlab/aerosense-software/docs/aerosense/parts'/local.name
 for p in (local,mirror):
  text=p.read_text('utf8');before=sha(p)
  pattern=r'(Title: '+re.escape(t['title'])+r'\nAffiliation: [^\n]+\n={78}\n\n)(.*?)(?=\n={78}\nENTRY|\n<!-- END ODOR 2026-10-21 -->|\Z)'
  found=re.search(pattern,text,re.S);assert found,(p,t['title'])
  newbody=body.rstrip()
  if t['type']=='Design' and '### Additional system-level characterization' in newbody:
   newbody=newbody.replace('### Additional system-level characterization','<!-- BEGIN ODOR 2026-10-21 -->\n\n### Additional system-level characterization',1)
  updated=text[:found.start(2)]+newbody+'\n'+text[found.end(2):]
  p.write_text(updated,encoding='utf8',newline='\n');files[p.relative_to(ROOT).as_posix()]={'path':p.relative_to(ROOT).as_posix(),'before_sha256':before,'sha256':sha(p),'bytes':p.stat().st_size}
for pg in base['pages']:
 p=ROOT/pg['source_path']
 if p.exists():pg['source_sha256']=sha(p)
base['status']='Experimenter-confirmed Test2 label correction and F1-only supplementary reanalysis; current public status is in per-UUID readback receipt.'
base['confirmed_mapping_update']={'prepared_existing_entries':len(ready),'new_entries':0,'original_raw_unchanged':True}
(OUT/'registry-confirmed-map-ready-payload.json').write_text(json.dumps(base,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(OUT/'registry-confirmed-map-ready-targets.json').write_text(json.dumps({'targets':ready},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
# Record direct publication assets against their preserved, actual source PNG.
linkpath=ROOT/'registry_docs_v2/publication-links.json';links=json.loads(linkpath.read_text('utf8'))
for t in ready:
 if not t.get('image_placeholder'):continue
 p=Path(t['upload_path']);relative='figures/signal-metric-confirmed-map-2026-10-21/'+p.name
 links['links'][relative]={'url':images[t['entry_key']]['url'],'sha256':sha(p),'canonical_archive_path':p.relative_to(ROOT).as_posix(),'relation':'Registry converts the canonical PNG to AVIF; remote byte equality is not asserted.'}
linkpath.write_text(json.dumps(links,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for path in ['registry_docs_v2/integrate_disturbance_characterisation.py','gitlab/aerosense-software/code/aerosense/parts-analysis/integrate_disturbance_characterisation.py']:
 p=ROOT/path;files[path]={'path':path,'sha256':sha(p),'bytes':p.stat().st_size}
receipt={'prepared_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'entries_prepared':len(ready),'files':list(files.values()),'complete':len(ready)==21,'source_mirrors_identical':all((ROOT/t['source_path']).read_bytes()==(ROOT/'gitlab/aerosense-software/docs/aerosense/parts'/Path(t['source_path']).name).read_bytes() for t in ready)}
(OUT/'registry-confirmed-map-source-freeze.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'entries':len(ready),'files':len(files),'mirror_match':receipt['source_mirrors_identical'],'payload_sha256':sha(OUT/'registry-confirmed-map-ready-payload.json')},indent=2))
