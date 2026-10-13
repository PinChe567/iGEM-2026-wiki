"""Render the bilingual documents from their editable Markdown sources.
Uses ReportLab and Pillow; output PDFs remain in the user-facing folders.
"""
from pathlib import Path
import re,html,json,argparse,sys
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Image,Table,TableStyle,PageBreak,KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PI
R=Path(__file__).resolve().parents[1]
pdfmetrics.registerFont(TTFont('J','C:/Windows/Fonts/msjh.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('JB','C:/Windows/Fonts/msjhbd.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('Mono','C:/Windows/Fonts/consola.ttf'))
ST={
 'body':ParagraphStyle('body',fontName='J',fontSize=10,leading=16,spaceAfter=8,wordWrap='CJK',allowWidows=0,allowOrphans=0),
 'title':ParagraphStyle('title',fontName='JB',fontSize=23,leading=30,textColor=colors.HexColor('#172b4d'),spaceAfter=20,keepWithNext=True,wordWrap='CJK'),
 'h2':ParagraphStyle('h2',fontName='JB',fontSize=14,leading=21,textColor=colors.HexColor('#174e66'),spaceBefore=17,spaceAfter=9,keepWithNext=True,wordWrap='CJK'),
 'h3':ParagraphStyle('h3',fontName='JB',fontSize=11,leading=17,spaceBefore=9,spaceAfter=6,keepWithNext=True,wordWrap='CJK'),
 'small':ParagraphStyle('small',fontName='J',fontSize=8,leading=12,spaceAfter=6,wordWrap='CJK',textColor=colors.HexColor('#536878')),
 'cell':ParagraphStyle('cell',fontName='J',fontSize=8,leading=12,wordWrap='CJK'),
 'code':ParagraphStyle('code',fontName='Mono',fontSize=8,leading=11,spaceAfter=10,wordWrap='CJK',backColor=colors.HexColor('#edf2f6'),borderPadding=7)
}
def inline(s):
 s=s.replace('CO₂','CO2')
 # Microsoft JhengHei lacks several scientific superscript/comparison glyphs.
 # Preserve their meaning as ASCII instead of rendering empty squares.
 s=s.replace('≤','<=').replace('≥','>=').replace('≠','!=').replace('≈','~').replace('∂','partial ')
 supers=str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺','0123456789-+')
 s=re.sub(r'[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+',lambda m:'^'+m[0].translate(supers),s)
 s=html.escape(s.replace('\u2011','-').replace('\u2013','-').replace('\u2014','-').replace('\u2212','-'))
 s=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',s)
 s=re.sub(r'`([^`]+)`',r'<font color="#174e66">\1</font>',s)
 s=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)',r'<link href="\2" color="#176e98">\1</link>',s)
 s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'\1 (\2)',s)
 return s
def parse(path):
 lines=path.read_text(encoding='utf8').splitlines();out=[];i=0
 while i<len(lines):
  s=lines[i].strip();i+=1
  if not s:continue
  if s.startswith('```'):
   code=[]
   while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
   i+=1
   rendered=[]
   for x in code:
    line=html.escape(x).replace(' ','&#160;')
    if re.search(r'[\u3400-\u9fff]',x):line='<font name="J">'+line+'</font>'
    rendered.append(line)
   out.append(Paragraph('<br/>'.join(rendered),ST['code']));continue
  if s.startswith('#'):
   n=len(s)-len(s.lstrip('#'));out.append(Paragraph(inline(s[n:].strip()),ST['title' if n==1 else 'h2' if n==2 else 'h3']));continue
  m=re.fullmatch(r'!\[([^\]]*)\]\(([^)]+)\)',s)
  if m:
   fp=(path.parent/m[2]).resolve();assert fp.exists(),fp
   w,h=PI.open(fp).size;scale=min(500/w,360/h);out.append(KeepTogether([Image(str(fp),width=w*scale,height=h*scale),Paragraph(inline(m[1]),ST['small'])]));continue
  if s.startswith('|') and i<len(lines) and re.match(r'^\|[\s:|-]+\|?$',lines[i].strip()):
   table=[s];i+=1
   while i<len(lines) and lines[i].strip().startswith('|'):table.append(lines[i].strip());i+=1
   cells=[[Paragraph(inline(x.strip()),ST['cell']) for x in r.strip('|').split('|')] for r in table]
   n=len(cells[0]);cells=[r for r in cells if len(r)==n]
   widths=[500/n]*n
   if n==2:widths=[155,345]
   if n==5 and path.stem.startswith('User_Feedback'):widths=[180,50,80,55,135]
   if n==7 and path.stem.startswith('User_Feedback'):widths=[275,36,36,36,36,36,45]
   row_heights=None
   if path.stem.startswith('User_Feedback'):
    row_heights=[None if any(x.strip() for x in row.strip('|').split('|')) else 30 for row in table]
   t=Table(cells,colWidths=widths,rowHeights=row_heights,repeatRows=1,hAlign='LEFT')
   t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dce8ee')),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,0),.7,colors.HexColor('#879aaa')),('LINEBELOW',(0,1),(-1,-1),.25,colors.HexColor('#d7dfe5')),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]));out+=[t,Spacer(1,10)];continue
  if s in ['---','***']:out.append(Spacer(1,8));continue
  if s.startswith('>'):s=s.lstrip('> ')
  out.append(Paragraph(inline(s),ST['body']))
 return out
def footer(c,d):
 c.saveState();c.setStrokeColor(colors.HexColor('#c8d3dd'));c.line(47,39,548,39);c.setFont('J',8);c.setFillColor(colors.HexColor('#526779'));c.drawString(47,25,'AeroSense | 2026-10-11 | Engineering prototype');c.drawRightString(548,25,str(d.page));c.restoreState()

class BookmarkedDocument(SimpleDocTemplate):
 def afterFlowable(self, flowable):
  if isinstance(flowable,Paragraph) and flowable.style.name in ['title','h2']:
   n=getattr(self,'_bookmark_count',0)+1;self._bookmark_count=n
   key=f'section_{n}';self.canv.bookmarkPage(key)
   self.canv.addOutlineEntry(flowable.getPlainText(),key,0 if flowable.style.name=='title' else 1,False)
def build(target,sources):
 for key in ['body','h2','h3']:
  if key=='body':
   ST[key].fontSize=9.5 if '_EN' in target.stem else 10
   ST[key].leading=14.4 if '_EN' in target.stem else 16
   ST[key].spaceAfter=6 if '_EN' in target.stem else 8
  elif key=='h2':
   ST[key].spaceBefore=13 if '_EN' in target.stem else 17
 story=[]
 for i,src in enumerate(sources):
  if i:story.append(PageBreak())
  story+=parse(src)
 BookmarkedDocument(str(target),pagesize=A4,leftMargin=47,rightMargin=48,topMargin=42,bottomMargin=53,title=target.stem,author='AeroSense project documentation').build(story,onFirstPage=footer,onLaterPages=footer)
 print(target.relative_to(R),flush=True)
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--roles',action='store_true',help='Build only the four main manuals.')
p.add_argument('--validation-only',action='store_true',help='Build only the six experiment/questionnaire PDFs.')
p.add_argument('--files',nargs='+',help='Selected Markdown files relative to the package root.')
p.add_argument('--language',nargs='+',choices=['ZH','EN'],default=['ZH','EN'])
a=p.parse_args()
if a.files:
 for rel in a.files:
  src=(R/rel).resolve()
  assert src.is_relative_to(R.resolve()) and src.suffix=='.md' and src.is_file(),rel
  build(src.with_suffix('.pdf'),[src])
 sys.exit(0)
for lang in a.language:
 if not a.validation_only:
  for stem in ['Developer_Manual','User_Manual']:
   src=R/'04_manuals'/f'{stem}_{lang}.md';build(src.with_suffix('.pdf'),[src])
 if not a.roles:
  for stem in ['Fluorescence_and_Cell_Test','Validation_Plan','User_Feedback']:
   src=R/'07_validation'/f'{stem}_{lang}.md';build(src.with_suffix('.pdf'),[src])
