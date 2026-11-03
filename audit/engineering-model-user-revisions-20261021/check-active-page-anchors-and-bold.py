"""Read-only static checks of active daily root pages; never controls a browser."""
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlsplit,unquote
import datetime,hashlib,json,re
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1]
pages=sorted(ROOT.glob('*.html'));parsed={p:BeautifulSoup(p.read_text('utf8'),'html.parser') for p in pages}
ids={p:{n['id'] for n in s.select('[id]')} for p,s in parsed.items()}
missing=[];bold=[];checks=0;mentions=0;duplicates=[]
for p,s in parsed.items():
 allids=[n['id'] for n in s.select('[id]')]
 for i in set(allids):
  if allids.count(i)>1:duplicates.append({'page':p.name,'id':i,'count':allids.count(i)})
 for a in s.select('a[href]'):
  u=urlsplit(a['href'])
  if not u.fragment or u.scheme or u.netloc:continue
  path=unquote(u.path)
  if not path:target=p
  elif path.startswith('/nthu/'):target=ROOT/path[6:]
  elif path.startswith('/'):continue
  else:target=p.parent/path
  if not target.suffix:target=target.with_suffix('.html')
  target=target.resolve()
  if target not in ids:continue
  checks+=1
  if unquote(u.fragment) not in ids[target]:missing.append({'page':p.name,'href':a['href'],'text':a.get_text(' ',strip=True)[:120]})
 for text in s.find_all(string=re.compile(r'\b(?:Figure|Video)\s+\d+',re.I)):
  if text.parent.name in ('script','style','title'):continue
  for m in re.finditer(r'\b(?:Figure|Video)\s+\d+',str(text),re.I):
   mentions+=1
   if not any(n.name in ('strong','b','h1','h2','h3','h4','h5','h6') or 'media-caption__label' in (n.get('class') or []) for n in text.parents):bold.append({'page':p.name,'mention':m.group(),'text':str(text)[:160]})
result={'checked_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'pages':len(pages),'local_anchor_links_checked':checks,'missing_targets':missing,'duplicate_ids':duplicates,'figure_video_mentions':mentions,'unbolded_candidates':bold,'source_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in pages},'scope':'Static authored HTML; no browser/computed-style claim. Generated runtime citation IDs require browser checks.'}
(OUT/'active-pages-shared-readonly-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in result.items() if k!='source_sha256'},ensure_ascii=False,indent=2))
