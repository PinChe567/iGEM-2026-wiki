from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import csv
import json

WORK=Path(__file__).resolve().parents[3]
OUT=WORK/'zenodo-upload'
class Links(HTMLParser):
    def __init__(self): super().__init__(); self.links=[]
    def handle_starttag(self, tag, attrs):
        if tag=='a':
            self.links += [v for k,v in attrs if k=='href' and v]
p=Links(); p.feed((OUT/'START_HERE.html').read_text(encoding='utf-8'))
missing=[]
for href in p.links:
    parsed=urlsplit(href)
    if parsed.scheme or not parsed.path: continue
    target=(OUT/unquote(parsed.path)).resolve()
    if not target.exists(): missing.append(href)
assert not missing, missing
rows=list(csv.DictReader((OUT/'PACKAGE_INDEX.csv').open(encoding='utf-8-sig')))
zips=sorted(OUT.rglob('*.zip'))
assert len(rows)==len(zips) and 1<=len(rows)<=96
assert set(p.resolve() for p in zips)=={(OUT/r['local_zip_path']).resolve() for r in rows}
attachments=[OUT/n for n in ['UPLOAD_README.txt','PACKAGE_INDEX.csv','ARCHIVE_CHECKSUMS.sha256']]
if (OUT/'GH146_FILE_MAP.csv').exists(): attachments.append(OUT/'GH146_FILE_MAP.csv')
assert all(p.is_file() for p in attachments)
assert len(zips)+len(attachments)<=100
total=sum(p.stat().st_size for p in zips+attachments)
assert total<50_000_000_000
assert len((OUT/'ARCHIVE_CHECKSUMS.sha256').read_text(encoding='utf-8').splitlines())==len(zips)
print(json.dumps({'ready':True,'upload_files':len(zips)+len(attachments),'zip_count':len(zips),'total_upload_bytes':total,'total_upload_gb':round(total/1e9,3),'retained_source_files':sum(int(r['source_files']) for r in rows),'local_guide_broken_links':0},ensure_ascii=False))
