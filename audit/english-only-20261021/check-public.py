from pathlib import Path
from html.parser import HTMLParser
import json,io,zipfile
OUT=Path(__file__).resolve().parent
WORK=OUT.parents[2]
SITE=WORK/'gitlab/nthu/site'
PUBLIC=WORK/'gitlab/nthu/.build-check/english-only-20261021-public'
paths=json.loads((SITE/'publication-files.json').read_text(encoding='utf-8'))
bad=[];retired=[];langs=[]
for rel in paths:
    current=SITE
    for part in Path(rel).parts:
        if part not in [p.name for p in current.iterdir()]:bad.append(rel);break
        current=current/part
class Lang(HTMLParser):
    def __init__(self):super().__init__();self.value=None
    def handle_starttag(self,tag,attrs):
        if tag=='html':self.value=dict(attrs).get('lang')
files=sorted(p for p in PUBLIC.rglob('*') if p.is_file())
for p in files:
    if 'i18n-' in p.name or p.name=='language-v19.js':retired.append(p.relative_to(PUBLIC).as_posix())
    if p.suffix=='.html':
        s=p.read_text(encoding='utf-8');parser=Lang();parser.feed(s)
        if 'data-language-toggle' in s or 'local-language-v19' in s:retired.append(p.relative_to(PUBLIC).as_posix())
        if parser.value!='en':langs.append(p.relative_to(PUBLIC).as_posix())
buffer=io.BytesIO()
with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for p in files:archive.writestr(p.relative_to(PUBLIC).as_posix(),p.read_bytes())
report={'publication_files':len(files),'zip_estimate_level6_bytes':len(buffer.getvalue()),'path_case_mismatches':bad,'retired_translation_hooks_or_files':retired,'non_english_html_lang':langs}
(OUT/'public-structural-qa.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
assert not bad and not retired and not langs
