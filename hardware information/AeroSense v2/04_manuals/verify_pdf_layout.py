"""Render selected current PDFs to uniquely named files in the existing OS temp folder.
No new project directories. Rendering does not itself assert visual review.
"""
from pathlib import Path
import argparse, hashlib, json, tempfile
from pdf2image import convert_from_path
from pypdf import PdfReader
from PIL import Image, ImageDraw

R=Path(__file__).resolve().parents[1]
POPPLER=Path('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')
p=argparse.ArgumentParser();p.add_argument('paths',nargs='+');a=p.parse_args()
records=[]
for rel in a.paths:
    src=R/rel; reader=PdfReader(src)
    texts=[page.extract_text() or '' for page in reader.pages]
    assert all(len(t.strip())>25 for t in texts), f'Unexpected blank page: {rel}'
    pages=convert_from_path(str(src),dpi=110,poppler_path=str(POPPLER),thread_count=2)
    contacts=[]
    for i in range(0,len(pages),2):
        group=pages[i:i+2]
        canvas=Image.new('RGB',(sum(im.width for im in group),max(im.height for im in group)+28),'#dde3e8')
        draw=ImageDraw.Draw(canvas);x=0
        for n,im in enumerate(group,i+1):
            canvas.paste(im,(x,28));draw.text((x+12,6),f'{src.name}  page {n}',fill='black');x+=im.width
        target=Path(tempfile.gettempdir())/f'AeroSense_20261011_{src.stem}_{i+1:03d}.png'
        canvas.save(target);contacts.append(str(target))
    record=dict(file=src.relative_to(R).as_posix(),pages=len(pages),characters=sum(map(len,texts)),sha256=hashlib.sha256(src.read_bytes()).hexdigest(),rendered=True,renderer='Bundled Poppler 110 dpi',visual_review=False,contacts=contacts)
    records.append(record)
    print(json.dumps(dict(file=record['file'],pages=record['pages'],contacts=contacts),ensure_ascii=False),flush=True)
out=Path(tempfile.gettempdir())/'AeroSense_pdf_review_pending.json'
prior=json.loads(out.read_text(encoding='utf8')) if out.exists() else []
changed={r['file'] for r in records}
out.write_text(json.dumps([r for r in prior if r['file'] not in changed]+records,indent=2,ensure_ascii=False),encoding='utf8')
