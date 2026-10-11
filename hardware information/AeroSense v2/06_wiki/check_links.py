"""Check local artifact links and duplicated IDs in the standalone wiki drafts."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote,urlparse
import json
P=Path(__file__).resolve().parent
class Scan(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  for key in ['href','src']:
   if key in a:self.links.append(a[key])
report={}
for path in sorted(P.glob('*.html')):
 scan=Scan();scan.feed(path.read_text(encoding='utf-8'));missing=[]
 for raw in scan.links:
  u=urlparse(raw)
  if u.scheme or u.netloc or not u.path:continue
  if not (path.parent/unquote(u.path)).exists():missing.append(raw)
 dup=sorted({i for i in scan.ids if scan.ids.count(i)>1})
 report[path.name]=dict(local_links_checked=sum(not urlparse(v).scheme and bool(urlparse(v).path) for v in scan.links),missing=missing,duplicate_ids=dup)
(P/'link_check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
raise SystemExit(int(any(v['missing'] or v['duplicate_ids'] for v in report.values())))
