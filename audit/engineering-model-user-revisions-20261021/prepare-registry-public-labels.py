from pathlib import Path
import json,re,hashlib,datetime
OUT=Path('aerosense-wiki/audit/engineering-model-user-revisions-20261021'); ROOT=Path.cwd()
sha=lambda x:hashlib.sha256(x).hexdigest()
base=json.loads((OUT/'registry-confirmed-map-ready-payload.json').read_text('utf8'))
oldtargets={x['entry_key']:x for x in json.loads((OUT/'registry-confirmed-map-ready-targets.json').read_text('utf8'))['targets']}
def plain(s):
    for a,b in [('F0a', 'baseline before the blank addition'), ('F0b', 'baseline before the test addition'), ('F1-only dynamic reanalysis','Post-addition dynamic response'),('F1-only dynamics compared with DoOR','Post-addition dynamics compared with DoOR'),('F1-only','post-addition-only'),('within-F1','within the post-addition acquisition'),('within-F0','within the pre-addition acquisition'),('F0-stage','pre-addition'),('F1-stage','post-addition'),('F0-subtracted','baseline-subtracted'),('Full F1/DoOR comparison','Full dynamic-response/DoOR comparison'),('ΔF1','ΔF_post'),('ΔF0','ΔF_pre')]:s=s.replace(a,b)
    s=re.sub(r'\bF1\s*\(', 'F_post(',s);s=re.sub(r'\bF0\s*\(', 'F_pre(',s)
    s=re.sub(r'\bF1\b','post-addition fluorescence',s);s=re.sub(r'\bF0\b','pre-addition fluorescence',s)
    s=s.replace('post-addition fluorescence fluorescence','post-addition fluorescence').replace('pre-addition fluorescence fluorescence','pre-addition fluorescence')
    s=s.replace('This post-addition-only metric','This post-addition dynamic metric')
    return s
# Preserve identifiers, archival filenames and all link destinations.
def convert(s):
    chunks=re.split(r'(https?://[^\s)<>]+|<[^>]+>|`[^`]+`)',s)
    return ''.join(x if i%2 else plain(x) for i,x in enumerate(chunks))
def number_signature(s):
    s=re.sub(r'https?://[^\s)<>]+|<[^>]+>|`[^`]+`','',s)
    s=re.sub(r'F[01]|F_(?:pre|post)','F_STAGE',s)
    return re.findall(r'(?<![A-Za-z_])[-+]?\d+(?:\.\d+)?',s)
changes=[];filechanges={}
for page in base['pages']:
 for e in page['entries']:
  old=e['body_markdown'];new=convert(old)
  if new==old:continue
  assert number_signature(old)==number_signature(new),e['entry_key']
  assert re.findall(r'https?://[^\s)<>]+',old)==re.findall(r'https?://[^\s)<>]+',new),e['entry_key']
  e['body_markdown']=new;e['body_sha256']=sha(new.encode());e['section_headings']=[convert(x) for x in e.get('section_headings',[])]
  key=e['entry_key'];t=oldtargets.get(key,{})
  kind='collections' if page['kind']=='collection' else 'parts'; ident=page.get('collection_uuid') if kind=='collections' else page.get('slug');ident=ident or page.get('part_id','').lower().replace('_','-')
  edit=t.get('edit_url') or e.get('live_matching',{}).get('edit_url_pattern') or page['url']+'/documentation/'+e['remote_entry_id']+'/modify'
  receptor=t.get('receptor') or next((x for x in re.findall(r'Or\d+[a-z]',Path(page['source_path']).name)), 'ORCO only' if 'GCaMP6f' in page['source_path'] else 'Collection' if kind=='collections' else page['part_id'])
  item={'entry_key':key,'remote_entry_id':e['remote_entry_id'],'edit_url':edit,'page_url':page['url'],'title':e['title'],'type':e['type'],'receptor':receptor,'source_path':page['source_path'],'body_markdown':new,'body_sha256':e['body_sha256'],'before_body_sha256':sha(old.encode())}
  changes.append(item)
  for p in (ROOT/page['source_path'],ROOT/'gitlab/aerosense-software/docs/aerosense/parts'/Path(page['source_path']).name):
   text=p.read_text('utf8');before=sha(p.read_bytes());pattern=r'(Title: '+re.escape(e['title'])+r'\nAffiliation: [^\n]+\n={78}\n\n)(.*?)(?=\n={78}\nENTRY|\n<!-- END ODOR 2026-10-21 -->|\Z)';found=re.search(pattern,text,re.S);assert found,(p,e['title'])
   body=new.rstrip()
   if e['type']=='Design' and '### Additional system-level characterization' in body:body=body.replace('### Additional system-level characterization','<!-- BEGIN ODOR 2026-10-21 -->\n\n### Additional system-level characterization',1)
   text=text[:found.start(2)]+body+'\n'+text[found.end(2):];p.write_text(text,encoding='utf8',newline='\n');rel=p.relative_to(ROOT).as_posix();filechanges[rel]={'path':rel,'before_sha256':filechanges.get(rel,{}).get('before_sha256',before),'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size}
priority=[x for x in changes if x['entry_key'].endswith(':characterisation:2') and not x['entry_key'].startswith('collection:') or x['entry_key']=='collection:experiment:2']
assert len(priority)==12,len(priority)
remaining=[x for x in changes if x not in priority]
for name,rows in [('registry-public-label-priority12.json',priority),('registry-public-label-remaining27.json',remaining),('registry-public-label-all-targets.json',changes)]:
 (OUT/name).write_text(json.dumps({'targets':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for page in base['pages']:page['source_sha256']=sha((ROOT/page['source_path']).read_bytes())
base['status']='Public terminology cleanup prepared; readback of earlier wording remains historical, these revised bodies await native Registry Save.'
(OUT/'registry-public-label-ready-payload.json').write_text(json.dumps(base,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
receipt={'prepared_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'affected_entries':len(changes),'priority_entries':12,'remaining_entries':len(remaining),'numerical_sequences_unchanged':True,'urls_unchanged':True,'canonical_archive_modified':False,'files':list(filechanges.values()),'mirrors_identical':all((ROOT/x['source_path']).read_bytes()==(ROOT/'gitlab/aerosense-software/docs/aerosense/parts'/Path(x['source_path']).name).read_bytes() for x in changes)}
(OUT/'registry-public-label-source-freeze.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in receipt.items() if k!='files'}));print('PAYLOAD',sha((OUT/'registry-public-label-ready-payload.json').read_bytes()))
