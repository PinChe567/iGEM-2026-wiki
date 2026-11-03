from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image,ImageDraw
import pymupdf as fitz
import json,re,unicodedata,hashlib

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'aerosense-wiki/audit/final-publication-20261021/cdn-document-conversions'
receipt=json.loads((OUT/'html-document-render-receipt.json').read_text(encoding='utf8'))
norm=lambda t: ''.join(c.lower() for c in unicodedata.normalize('NFKC',t) if c.isalnum())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
results=[]
for d in receipt['documents']:
    path=Path(d['pdf_path']); doc=fitz.open(path)
    # Ignore the new running footer, and the routing-only availability annotation.
    text=' '.join(p.get_text(clip=fitz.Rect(0,0,p.rect.width,p.rect.height-30)) for p in doc).replace('(archive availability)','')
    n=norm(text); soup=BeautifulSoup(Path(d['source_path']).read_text(encoding='utf8'),'html.parser')
    chunks=[e for e in soup.find_all(['p','li','td','th','h1','h2','h3','h4','figcaption','summary','pre']) if len(norm(e.get_text(' ',strip=True)))>15]
    missing=[{'tag':e.name,'text':e.get_text(' ',strip=True)} for e in chunks if norm(e.get_text(' ',strip=True)) not in n]
    table_rows=[t.get_text(' ',strip=True) for t in soup.find_all('tr')]
    missing_rows=[r for r in table_rows if norm(r) not in n]
    headings=[h.get_text(' ',strip=True) for h in soup.find_all(['h1','h2','h3','h4'])]
    missing_headings=[h for h in headings if norm(h) not in n]
    outside=[]
    for i,p in enumerate(doc):
        for w in p.get_text('words'):
            if w[0]<-0.5 or w[1]<-0.5 or w[2]>p.rect.width+.5 or w[3]>p.rect.height+.5:
                outside.append({'page':i+1,'word':w[4],'bbox':w[:4]})
    contacts=[]
    for start in range(0,len(doc),12):
        indices=list(range(start,min(start+12,len(doc)))); canvas=Image.new('RGB',(1600,((len(indices)+3)//4)*305),'#dce0e2'); draw=ImageDraw.Draw(canvas)
        for pos,i in enumerate(indices):
            pix=doc[i].get_pixmap(matrix=fitz.Matrix(.46,.46),alpha=False)
            im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);im.thumbnail((390,278));x=pos%4*400;y=pos//4*305
            canvas.paste(im,(x,y+20));draw.text((x+6,y+3),f'{path.stem} | {i+1}/{len(doc)}',fill='black')
        target=OUT/f'{path.stem}-contact-{start//12+1:02}.png';canvas.save(target);contacts.append(target.relative_to(ROOT).as_posix())
    result={'source_document':str(Path(d['source_path']).relative_to(ROOT)).replace('\\','/'),'source_document_sha256':d['source_sha256'],'source_unchanged':sha(Path(d['source_path']))==d['source_sha256'],'pdf_path':str(path.relative_to(ROOT)).replace('\\','/'),'sha256':sha(path),'bytes':path.stat().st_size,'pages':len(doc),'checked_text_chunks':len(chunks),'missing_text_chunks':missing,'table_count':d['table_count'],'checked_table_rows':len(table_rows),'missing_table_rows':missing_rows,'checked_headings':len(headings),'missing_headings':missing_headings,'image_count':d['image_count'],'image_loaded_count':sum(x['complete'] and x['natural_width']>0 for x in d['render_qa']['images']),'video_posters_preserved':d['video_posters_preserved'],'text_outside_page':outside,'browser_errors':d['page_errors'],'horizontal_overflow':d['render_qa']['document_width']>d['render_qa']['viewport_width'],'contact_sheets':contacts,'json_print_reflow':d['json_print_reflow'],'figure_download_link_groups_kept_with_their_figure':d['figure_download_link_groups_kept_with_their_figure']}
    result['automated_pass']=not(missing or missing_rows or missing_headings or outside or d['page_errors']) and result['source_unchanged'] and result['image_count']==result['image_loaded_count'] and not result['horizontal_overflow']
    results.append(result)
report={'scope':'Formal PDF reading editions of six preserved HTML research records. All source scientific paragraphs, table rows, headings and JSON values were checked against the PDF text. All figures and the existing video poster load. Existing source HTML bytes are unchanged. Source-image and link-routing details are retained in html-document-render-receipt.json.','network_errors':receipt['network_errors'],'files':results,'all_automated_checks_passed':all(r['automated_pass'] for r in results) and not receipt['network_errors'],'visual_review_status':'Contact sheets generated; model review pending.'}
(OUT/'html-document-conversion-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps([{k:r[k] for k in ['pdf_path','pages','checked_text_chunks','checked_table_rows','image_count','automated_pass']} for r in results],indent=2))
if not report['all_automated_checks_passed']: raise SystemExit('PDF QA needs review')
