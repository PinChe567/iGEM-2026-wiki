from html.parser import HTMLParser
from pathlib import Path
import re,json,sys
root=Path(__file__).resolve().parents[2]
pattern=re.compile(r'\b(?:Figures?|Videos?)\s+S?\d+[A-Za-z]?(?:\s*(?:[–—-]|and|,|to|&)\s*S?\d+[A-Za-z]?)*')
void={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
skip={'strong','b','script','style','code','pre','textarea','title','option'}
class BoldRefs(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=False); self.text=text;self.stack=[];self.edits=[];self.offsets=[0]
  for m in re.finditer('\n',text):self.offsets.append(m.end())
 def handle_starttag(self,tag,attrs):
  if tag not in void:self.stack.append(tag)
 def handle_startendtag(self,tag,attrs):pass
 def handle_endtag(self,tag):
  if tag in self.stack:self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]
 def handle_data(self,data):
  if 'body' not in self.stack or skip.intersection(self.stack):return
  row,col=self.getpos();base=self.offsets[row-1]+col
  for m in pattern.finditer(data):self.edits.append((base+m.start(),base+m.end(),m.group()))
report=[]
for p in sorted(root.glob('*.html')):
 if p.name in sys.argv[1:]:continue
 text=p.read_text(encoding='utf-8');parser=BoldRefs(text);parser.feed(text)
 for start,end,label in reversed(parser.edits):text=text[:start]+'<strong class="media-reference">'+label+'</strong>'+text[end:]
 if parser.edits:p.write_text(text,encoding='utf-8')
 report.append({'file':p.name,'references_bolded':len(parser.edits)})
receipt=Path(__file__).with_name('global-media-reference-bold.json')
receipt.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'files_updated':sum(x['references_bolded']>0 for x in report),'references_bolded':sum(x['references_bolded'] for x in report)}))
