"""Render the bilingual documents from their editable Markdown sources.
Uses ReportLab and Pillow; output PDFs remain in the user-facing folders.
"""
from pathlib import Path
import re,html,json,argparse
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
   t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
   t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dce8ee')),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,0),.7,colors.HexColor('#879aaa')),('LINEBELOW',(0,1),(-1,-1),.25,colors.HexColor('#d7dfe5')),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]));out+=[t,Spacer(1,10)];continue
  if s in ['---','***']:out.append(Spacer(1,8));continue
  if s.startswith('>'):s=s.lstrip('> ')
  out.append(Paragraph(inline(s),ST['body']))
 return out
def footer(c,d):
 c.saveState();c.setStrokeColor(colors.HexColor('#c8d3dd'));c.line(47,39,548,39);c.setFont('J',8);c.setFillColor(colors.HexColor('#526779'));c.drawString(47,25,'AeroSense | 2026-10-08 | Engineering prototype');c.drawRightString(548,25,str(d.page));c.restoreState()

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
   ST[key].leading=14.4 if '_EN' in target.stem else (15 if target.stem=='Assembly_Manual_ZH' else 16)
   ST[key].spaceAfter=6 if '_EN' in target.stem else (7 if target.stem=='Assembly_Manual_ZH' else 8)
  elif key=='h2':
   ST[key].spaceBefore=13 if '_EN' in target.stem else 17
 story=[]
 for i,src in enumerate(sources):
  if i:story.append(PageBreak())
  story+=parse(src)
  if target.stem.startswith('Simulation_Analysis') and src.parent.name in ['optics','airflow','membrane'] and src.stem.startswith(('Analysis_','Airflow_Analysis_')):
   lang='ZH' if '_ZH' in target.stem else 'EN'
   captions={}
   for line in src.read_text(encoding='utf8').splitlines():
    if line.startswith('|') and '.png' in line:
     cells=line.strip('|').split('|')
     if len(cells)>1:captions[cells[0].strip()]=cells[1].strip()
   explicit_caps_path=src.parent/'captions.json'
   explicit_caps=json.loads(explicit_caps_path.read_text(encoding='utf8')) if explicit_caps_path.exists() else {}
   extra={
    'design_comparison.png':('18組氣流設計比較；同一流量歸一化，不能把局部速度改善當成細胞存活證明。','Comparison of 18 designs at matched normalized flow; local velocity reduction is not evidence of cell survival.'),
    'velocity_sections.png':('入口與井上方速度剖面；流場為穩態，液面固定。','Inlet and well velocity sections; steady gas flow with fixed liquid surfaces.'),
    'mesh_and_tradeoff.png':('三種網格的敏感度與取捨；方向一致但局部數值尚未網格獨立。','Three-grid sensitivity and trade-offs; directional agreement does not establish grid-independent local magnitudes.')}
   for fp in sorted((src.parent/'figures').glob('*.png')):
    row=explicit_caps.get(fp.name,explicit_caps.get('figures',{}).get(fp.name,{}))
    explicit=row.get(lang,row.get('caption_'+lang,'')) if isinstance(row,dict) else row
    if isinstance(explicit,dict):explicit=explicit.get('caption','')
    cap=explicit or captions.get(fp.name,extra.get(fp.name,('模擬圖；完整方法、座標與圖例見同資料夾Figure Guide。','Simulation figure; methods, axes and legends are in the accompanying Figure Guide.'))[0 if lang=='ZH' else 1])
    if fp.stem.startswith('airflow_movie_') and not explicit:
     seconds=int(fp.stem.rsplit('_',1)[1])*60/239
     cap=(f'穩態速度場示蹤於物理時間{seconds:.1f}秒；顏色表示速度，粒子不是細胞或氣味濃度。' if lang=='ZH' else f'Steady-field tracers at {seconds:.1f} physical seconds. Colour encodes speed; markers are not cells or odor concentration.')
    group_titles={'optics':('光學模擬圖','Optical figure'),'airflow':('氣流與氣相傳輸','Airflow and gas transport'),'membrane':('PDMS與液體傳輸','PDMS and liquid transport')}
    title=group_titles[src.parent.name][0 if lang=='ZH' else 1]
    story+=[PageBreak(),Paragraph(inline(title+' / '+fp.stem),ST['h2'])]
    cap_paragraph=Paragraph(inline(cap),ST['body']);_,cap_height=cap_paragraph.wrap(500,700)
    w,h=PI.open(fp).size;factor=min(500/w,max(180,min(520,640-cap_height))/h)
    story+=[Image(str(fp),width=w*factor,height=h*factor),Spacer(1,12),cap_paragraph,Paragraph(inline(str(fp.relative_to(R))),ST['small'])]
 BookmarkedDocument(str(target),pagesize=A4,leftMargin=47,rightMargin=48,topMargin=42,bottomMargin=53,title=target.stem,author='AeroSense project documentation').build(story,onFirstPage=footer,onLaterPages=footer)
 print(target.relative_to(R),flush=True)
p=argparse.ArgumentParser();p.add_argument('--analysis',action='store_true');p.add_argument('--assembly-only',action='store_true');p.add_argument('--operations-only',action='store_true');p.add_argument('--validation-only',action='store_true');a=p.parse_args()
for lang in ['ZH','EN']:
 if a.analysis:
  sources=[R/'04_manuals'/f'Design_Analysis_{lang}.md',R/'02_simulation/optics'/f'Analysis_{lang}.md',R/'02_simulation/airflow'/f'Flow_Operation_{lang}.md',R/'02_simulation/airflow'/f'Airflow_Analysis_{lang}.md']
  membrane=R/'02_simulation/membrane'/f'Analysis_{lang}.md'
  if membrane.exists():sources.append(membrane)
  build(R/'04_manuals'/f'Simulation_Analysis_{lang}.pdf',sources)
 else:
  if a.validation_only:
   build(R/'07_validation'/f'Validation_Plan_{lang}.pdf',[R/'07_validation'/f'Validation_Plan_{lang}.md']);continue
  if not a.operations_only:build(R/'04_manuals'/f'Assembly_Manual_{lang}.pdf',[R/'04_manuals'/f'Assembly_Manual_{lang}.md'])
  if a.assembly_only:continue
  op=R/'03_software/guides'/('操作與設定_ZH.md' if lang=='ZH' else 'Operation_and_Setup_EN.md')
  build(R/'04_manuals'/f'Operation_and_Setup_{lang}.pdf',[op,R/'03_software/guides'/f'Measured_Correction_{lang}.md'])
  if a.operations_only:continue
  for stem in ['Validation_Plan','User_Feedback']:
   build(R/'07_validation'/f'{stem}_{lang}.pdf',[R/'07_validation'/f'{stem}_{lang}.md'])
