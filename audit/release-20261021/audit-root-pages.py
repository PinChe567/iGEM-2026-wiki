from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlsplit
import json,re,hashlib,collections
base=Path(__file__).parent;root=base.parents[1]
names=['safety-and-security','credits','index','members','glossary','attributions','notebook','human-practices','education','entrepreneurship','sustainability']
out={}
for name in names:
 s=BeautifulSoup((root/(name+'.html')).read_text(encoding='utf-8'),'html.parser');main=s.select_one('main') or s
 refs=[]
 for a in s.select('main a[href], #references a[href]'):
  u=urlsplit(a['href'])
  if u.scheme in ['http','https']:
   refs.append({'url':a['href'],'text':a.get_text(' ',strip=True)})
 media=[]
 for e in main.select('img,video,source,iframe'):
  for key in ['src','srcset','poster']:
   if e.get(key):media.append({'tag':e.name,'attribute':key,'value':e[key]})
 external=[];local=[]
 for item in media:
  u=urlsplit(item['value'].split(' ')[0])
  if u.scheme in ['http','https']:
   if not (u.hostname or '').endswith(('static.igem.wiki','video.igem.org','teams.igem.org')):external.append(item)
  elif not item['value'].startswith(('data:','blob:')):local.append(item)
 dated=[];versions=[]
 for text in main.find_all(string=True):
  if text.find_parent(['script','style','code','pre']):continue
  val=str(text).strip()
  if re.search(r'\b20\d\d[-/]\d{1,2}[-/]\d{1,2}\b|\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b',val):
   parent=text.find_parent(['section','li','div']);dated.append({'text':val[:400],'context':parent.get('id')if parent else None})
  if re.search(r'\b[Vv]\d+(?:\.\d+)*\b|\bversion\s*\d',val):versions.append(val[:250])
 out[name]={'main_text_sha256':hashlib.sha256(main.get_text(' ',strip=True).encode()).hexdigest(),'headings':[h.get_text(' ',strip=True)for h in s.select('main h2, #references h2')],'reference_domains':dict(collections.Counter(urlsplit(v['url']).hostname for v in refs)),'external_reference_links':refs,'nonofficial_remote_media':external,'official_embed_exception':'Required official Attributions form at teams.igem.org' if name=='attributions' else None,'local_media':local,'calendar_dates_in_visible_text':dated,'visible_version_labels':versions,'text_edit_permitted':name=='safety-and-security'}
(base/'root-pages-structure-hosting-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({n:{'h2':len(v['headings']),'nonofficial_remote_media':v['nonofficial_remote_media'],'local_media_count':len(v['local_media']),'calendar_dates':len(v['calendar_dates_in_visible_text']),'versions':len(v['visible_version_labels']),'external_ref_domains':v['reference_domains']}for n,v in out.items()},ensure_ascii=False,indent=2))
