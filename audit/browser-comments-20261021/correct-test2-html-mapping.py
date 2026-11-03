from pathlib import Path
from bs4 import BeautifulSoup
import re,json,hashlib
ROOT=Path(__file__).resolve().parents[2]
mapping={'Or22a':'Or42a','Or35a':'Or98a','Or42a':'Or22a','Or59b':'Or67a','Or67a':'Or67b','Or67b':'Or59b','Or98a':'Or35a'}
pattern=re.compile(r'\b(?:'+ '|'.join(mapping)+r')\b')
def swap(t):return pattern.sub(lambda m:mapping[m[0]],t)
def bounds(text,id,tag=None):
 m=re.search(r'<('+ (tag or r'[\w-]+')+r')\b[^>]*\bid="'+re.escape(id)+r'"[^>]*>',text);assert m,id
 depth=0
 for x in re.finditer(r'<(/?)'+m.group(1)+r'\b[^>]*>',text[m.start():],re.I):
  depth+=-1 if x.group(1) else 1
  if depth==0:return m.start(),m.start()+x.end()
 raise AssertionError(id)
def block(text,id):a,b=bounds(text,id);return text[a:b]
def setblock(text,id,new):a,b=bounds(text,id);return text[:a]+new+text[b:]
def digest(t):return hashlib.sha256(t.encode()).hexdigest()
report={'mapping_authority':'User correction confirmed by root on 2026-10-21, superseding earlier positional instruction','positions':['Or7a','Or19a','Or42a','Or98a','Or22a','Or67a','Or67b','Or59b','Or85b','Or35a','ORCO only','No transfect'],'changed':[]}
p=ROOT/'results.html';text=p.read_text(encoding='utf-8');before=text
test1before=block(text,'results-supplement-kinetics')
microbefore=block(text,'wet-lab')
# Only old Test 2 numerical tables: the well-ordered values stay unchanged.
id='results-supplement-odor21';old=block(text,id);new=old
heads=re.findall(r'<th\b[^>]*scope="row"[^>]*>.*?</th>',new,re.S)
changed=0
for h in heads:
 nh=swap(h)
 if nh!=h:changed+=1
 new=new.replace(h,nh,1)
# Simultaneous per-token conversion above must not cascade when duplicate rows recur.
# Rebuild using a single regex callback on the original block.
new=re.sub(r'<th\b[^>]*scope="row"[^>]*>.*?</th>',lambda m:swap(m[0]),old,flags=re.S)
old_example='For Or35a + ORCO with VUAA1, +34.09%'
assert old_example in new;new=new.replace(old_example,'For Or98a + ORCO with VUAA1, +34.09%')
text=setblock(text,id,new);report['changed'].append({'page':'results.html','section':id,'row_labels_changed':sum(swap(h)!=h for h in heads),'numerical_text_unchanged':True})
for id in ['kinetic-controls','conclusion']:
 old=block(text,id);new=swap(old);assert old!=new,id;text=setblock(text,id,new);report['changed'].append({'page':'results.html','section':id})
assert block(text,'results-supplement-kinetics')==test1before
assert block(text,'wet-lab')==microbefore
# Numeric cells are invariant under the corrected condition labels.
bo=BeautifulSoup(before,'html.parser').find(id='results-supplement-odor21');ao=BeautifulSoup(text,'html.parser').find(id='results-supplement-odor21')
assert [x.get_text() for x in bo.find_all('td')]==[x.get_text() for x in ao.find_all('td')]
p.write_text(text,encoding='utf-8');report['results_sha256']=digest(text);report['unchanged_test1_sha256']=digest(test1before);report['unchanged_microscopy_sha256']=digest(microbefore)
p=ROOT/'experiments.html';text=p.read_text(encoding='utf-8')
old='Positions 1–12 are Or7a + ORCO, Or19a + ORCO, Or22a + ORCO, Or35a + ORCO, Or42a + ORCO, Or59b + ORCO, Or67a + ORCO, Or67b + ORCO, Or85b + ORCO, Or98a + ORCO, ORCO only and no transfect.'
new='Positions 1–12 are Or7a + ORCO, Or19a + ORCO, Or42a + ORCO, Or98a + ORCO, Or22a + ORCO, Or67a + ORCO, Or67b + ORCO, Or59b + ORCO, Or85b + ORCO, Or35a + ORCO, ORCO only and no transfect.'
assert text.count(old)==1;text=text.replace(old,new);p.write_text(text,encoding='utf-8');report['changed'].append({'page':'experiments.html','change':'Test 2 positions paragraph only'});report['experiments_sha256']=digest(text)
report['scope']='No raw values, calculations, Test 1, microscopy, new F1 section, figures or URLs changed. Figure and data replacement handled separately.'
(Path(__file__).parent/'test2-html-mapping-correction.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
