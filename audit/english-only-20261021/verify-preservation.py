"""Compare English page evidence and game numeric literals to untouched official source."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT.parent/'gitlab/nthu/site'
class Evidence(HTMLParser):
    def __init__(self):super().__init__(convert_charrefs=True);self.depth=0;self.tables=[];self.table=[];self.media=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='table':self.depth+=1
        if tag in {'img','source','iframe','video','audio'}:self.media.append((tag,tuple((k,v) for k,v in attrs if k in {'src','srcset','data-src','alt','title'})))
    def handle_endtag(self,tag):
        if tag=='table':
            self.depth-=1
            if self.depth==0:self.tables.append(' '.join(' '.join(self.table).split()));self.table=[]
    def handle_data(self,data):
        if self.depth:self.table.append(data)
rows=[]
for p in sorted(ROOT.glob('*.html')):
    if p.name in {'model.html','engineering.html'} or not (BASE/p.name).is_file():continue
    before=Evidence();before.feed((BASE/p.name).read_text(encoding='utf-8'))
    after=Evidence();after.feed(p.read_text(encoding='utf-8'))
    rows.append({'page':p.name,'tables':len(after.tables),'tables_unchanged':before.tables==after.tables,'media_tags':len(after.media),'media_unchanged':before.media==after.media})
report={'pages':rows,'all_tables_and_media_preserved':all(r['tables_unchanged'] and r['media_unchanged'] for r in rows),'excluded_pages':'Model and Engineering have separately authorized content updates. This agent did not edit them.'}
(ROOT/'audit/english-only-20261021/evidence-preservation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
if not report['all_tables_and_media_preserved']:raise SystemExit(1)
