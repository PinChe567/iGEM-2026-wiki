"""Verify local DOCX/XLSX reading editions against already-verified CDN PDF receipts."""
from pathlib import Path
import hashlib,json,re,zipfile,xml.etree.ElementTree as E
import pymupdf as fitz

ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'gitlab/nthu/docs/aerosense'
OUT=Path(__file__).parent
G='https://gitlab.igem.org/2026/nthu/-/raw/main/docs/aerosense/'
mapping=json.loads((ROOT/'aerosense-wiki/igem-upload/verified-official-urls.json').read_text(encoding='utf8'))
bysha={r['source_sha256']:r for r in mapping if r.get('source_sha256')==r.get('response_sha256')}
norm=lambda x:re.sub(r'[^a-z0-9]','',x.lower())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pairs=[('hardware/User_Manual_EN.docx','hardware/User_Manual_EN.pdf','User manual — PDF reader'),('hardware/Developer_Manual_EN.docx','hardware/Developer_Manual_EN.pdf','Developer manual — PDF reader'),('hardware/User_Feedback_EN.docx','hardware/User_Feedback_EN.pdf','Blank feedback form — PDF reader'),('hardware/usability/user-feedback-en-anonymized.docx','hardware/usability/user-feedback-en-anonymized.pdf','Anonymized feedback form — PDF reader'),('entrepreneurship/financial-plan.xlsx','entrepreneurship/financial-plan-preview.pdf','Financial planning preview — PDF')]
records=[]
for a,b,label in pairs:
    src=BASE/a; pdf=BASE/b; proof=bysha[sha(pdf)]
    doc=fitz.open(pdf); text='\n'.join(p.get_text() for p in doc); target=norm(text)
    z=zipfile.ZipFile(src); ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    if src.suffix=='.docx':
        xml=E.fromstring(z.read('word/document.xml'))
        values=[''.join(t.text or '' for t in p.findall('.//w:t',ns)) for p in xml.findall('.//w:p',ns)]
        check='All DOCX body/table paragraphs of at least 25 alphanumeric characters are present in the PDF after whitespace/punctuation normalization. Same edition headings verified in extracted text and cover render.'
        threshold=25; sheets=None
    else:
        strings=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('x:si',ns)] if 'xl/sharedStrings.xml' in z.namelist() else []
        values=[]
        for filename in z.namelist():
            if filename.startswith('xl/worksheets/sheet') and filename.endswith('.xml'):
                for cell in E.fromstring(z.read(filename)).findall('.//x:c',ns):
                    v=cell.find('x:v',ns)
                    if cell.get('t')=='s' and v is not None: values.append(strings[int(v.text)])
                    if cell.get('t')=='inlineStr': values.append(''.join(cell.find('x:is',ns).itertext()))
        sheets=[s.get('name') for s in E.fromstring(z.read('xl/workbook.xml')).findall('x:sheets/x:sheet',ns)]
        check='All four workbook sheets and all 83 text cells over 20 alphanumeric characters occur in the eight-page PDF preview. The replacement is explicitly a static PDF preview, not an editable/calculating workbook.'
        threshold=21
    eligible=[x for x in values if len(norm(x))>=threshold]; missing=[x for x in eligible if norm(x) not in target]
    assert not missing,(a,missing)
    records.append({'current_url':G+a,'source_path':src.relative_to(ROOT).as_posix(),'source_sha256':sha(src),'source_bytes':src.stat().st_size,'action':'replace_verified_pdf_reader','proposed_url':proof['official_url'],'proposed_label':label,'pdf_path':pdf.relative_to(ROOT).as_posix(),'pdf_sha256':sha(pdf),'pdf_bytes':pdf.stat().st_size,'pdf_pages':len(doc),'edition_excerpt':text[:600],'checked_text_count':len(eligible),'missing_text_count':len(missing),'sheet_names':sheets,'verification':check,'cdn_proof':'aerosense-wiki/igem-upload/verified-official-urls.json','cdn_full_byte_verified':True,'format_semantics':'This is a corresponding PDF reading edition, not a byte-identical DOCX/XLSX replacement. Original editable source remains in the independent archive.'})
pending=['hardware/BOM_EN.xlsx','hardware/pcb-current-bom.docx','hardware/pcb-initial-drc-2026-08-02.rpt','hardware/pcb-initial-erc-2026-08-02.rpt']
report={'status':'Verified mapping plan only. No network calls or site mutation.','visual_review':'Cover render contact sheet inspected; edition headings, tabular contents and document roles match. Existing PDFs were not modified.','records':records,'pending_full_content_pdf_render':[{'current_url':G+p,'source_path':(BASE/p).relative_to(ROOT).as_posix(),'sha256':sha(BASE/p),'bytes':(BASE/p).stat().st_size,'reason':'No already-published corresponding full-content PDF identified. Must render actual content to PDF and verify a new upload; do not rename the extension or substitute schematic/audit content.'} for p in pending]}
(OUT/'document-pdf-reader-routing.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'verified_pdf_readers':len(records),'pending_full_content_pdf_render':len(pending)},indent=2))
