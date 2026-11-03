from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
import json,hashlib,re,collections
ROOT=Path('aerosense-wiki'); OUT=ROOT/'audit/release-20261021'; OUT.mkdir(parents=True,exist_ok=True)
changes=[]; chronology=[]
def sha(x):return hashlib.sha256(x.encode()).hexdigest()
def snapshot(s):
 return {'ids':collections.Counter(x['id']for x in s.select('[id]')),'hrefs':collections.Counter(a['href']for a in s.select('a[href]')),'media':[(x.name,tuple((k,str(v))for k,v in sorted(x.attrs.items())if k in ['src','srcset','poster','data-src','data-video-url','data-pdf-preview-src']))for x in s.select('img,source,video,audio,iframe,embed,object')],'scripts':[str(x)for x in s.select('script')],'svg':[str(x)for x in s.select('svg')],'tables':[[c.get_text(' ',strip=True)for c in x.select('th,td')]for x in s.select('table')],'figures':[[x.get('id'),[(i.get('src'),i.get('srcset'))for i in x.select('img,source')]]for x in s.select('figure')]}
def para(s,prefix):
 found=[p for p in s.select('main p')if p.get_text(' ',strip=True).startswith(prefix)]
 if len(found)!=1:raise ValueError((prefix,len(found)))
 return found[0]
def replace_p(s,prefix,html,page):
 p=para(s,prefix);old=p.get_text(' ',strip=True);p.clear()
 for c in list(BeautifulSoup(html,'html.parser').contents):p.append(c)
 changes.append({'page':page,'action':'rewrite paragraph','old':old,'new':p.get_text(' ',strip=True)})
def add_p(s,target,html):
 p=s.new_tag('p')
 for c in list(BeautifulSoup(html,'html.parser').contents):p.append(c)
 s.find(id=target).append(p);return p
def move_p(s,prefix,target,page):
 p=para(s,prefix);changes.append({'page':page,'action':'move paragraph','text':p.get_text(' ',strip=True),'destination':target});s.find(id=target).append(p.extract())
def replace_text(s,old,new,page):
 found=[x for x in s.find_all(string=True)if isinstance(x,NavigableString)and old in str(x)and x.parent.name not in ['script','style']]
 if len(found)!=1:raise ValueError(('text',old,len(found)))
 found[0].replace_with(str(found[0]).replace(old,new));changes.append({'page':page,'action':'text','old':old,'new':new})
for page in ['hardware','model','engineering']:
 path=ROOT/(page+'.html');original=path.read_text(encoding='utf-8');s=BeautifulSoup(original,'html.parser');before=snapshot(s)
 if page=='hardware':
  replace_p(s,'AeroSense is a compact reader','AeroSense combines four replaceable 100 µL wells, frequency-tagged blue LEDs, a filtered photodiode, ESP32 acquisition and a local phone interface. An eight-part enclosure fixes the optical geometry and separates sample gas from electronics cooling. Optical and airflow simulations guided filter selection and the inlet shelf; assembly feedback informed the manual. Fluorescein measurements resolve four frequency channels, quantify cross-well responses and test calibration under isolated and simultaneous loading.',page)
  replace_p(s,'Verification follows the measured signal:','Verification follows the measured signal from frequency separation through cross-talk comparison, multi-well additivity and concentration checks. Raw records, calibration calculations and residuals link each result to its acquisition conditions.',page)
  old=para(s,'Pairing matching matrix entries').get_text(' ',strip=True)
  replace_p(s,'Pairing matching matrix entries','The overall Pearson correlation is r = 0.810 across all 16 corresponding matrix entries; the 12 off-diagonal cross-talk entries give r = 0.257.',page)
  add_p(s,'hardware-discussion',old)
  move_p(s,'The simulation is an ideal floor-layer source','hardware-discussion',page)
  p=para(s,'All four measured responses fall below');old=p.get_text(' ',strip=True)
  replace_p(s,'All four measured responses fall below','All four measured responses fall below the sum of the isolated-well predictions; D3 reaches only 48.3%. This comparison tests the additivity required to use isolated-well responses for simultaneous loading.',page)
  add_p(s,'hardware-discussion','The additivity mismatch limits direct transfer of isolated-well proportions to simultaneous loading. The measurements do not identify its physical cause; the supplementary matrix calculations retain the resulting estimates and residuals.')
  p=para(s,'Low concentrations and unequal-well loadings');old=p.get_text(' ',strip=True)
  replace_p(s,'Low concentrations and unequal-well loadings','The checks resolve how calibration error changes with prepared concentration and loading pattern. Low concentrations and unequal-well loadings show the largest deviations.',page)
  add_p(s,'hardware-discussion',old)
  move_p(s,'Liquid addition may contribute','hardware-discussion',page)
  replace_p(s,'AeroSense integrates removable wells, filtered','AeroSense integrates removable wells, filtered optical collection, shared-photodiode electronics and a local phone interface. Fluorescein measurements demonstrate four-frequency separation and quantify source mixing. The measured I/Q matrix, concentration checks and cell-containing-well traces provide a reproducible basis for selecting the next calibration and biological-control experiments.',page)
  # Keep document-preview openers in place; consolidate download actions.
  ul=s.new_tag('ul');ul['class']='hw-verification-downloads'
  for card in s.select('#hardware-topic-manual .hw-manual-document'):
   downloads=card.select('a[download]')
   if downloads:
    li=s.new_tag('li');label=s.new_tag('strong');label.string=card.find('h3').get_text(' ',strip=True)+': ';li.append(label)
    for i,a in enumerate(downloads):
     if i:li.append(' · ')
     li.append(a.extract())
    ul.append(li)
  if ul.contents:
   h=s.new_tag('h3');h['class']='reading-heading--topic';h.string='Manuals and assembly feedback';s.find(id='hardware-data-availability').append(h);s.find(id='hardware-data-availability').append(ul)
  # Resource-only paragraphs move intact; links to on-page analysis remain functional.
  resources=[]
  for p in list(s.select('main p')):
   if p.find_parent(id='hardware-data-availability') or p.find_parent(id='references'):continue
   a=p.find_all('a',href=True)
   if a and any(re.search(r'\.(zip|csv|md)(?:$|\?)',x['href'])for x in a):
    remaining=p.get_text(' ',strip=True)
    for x in a:remaining=remaining.replace(x.get_text(' ',strip=True),'')
    if re.sub(r'[\s·|→.]','',remaining)=='':resources.append(p)
  if resources:
   h=s.new_tag('h3');h['class']='reading-heading--topic';h.string='Calibration data and reproducible analyses';s.find(id='hardware-data-availability').append(h)
   for p in resources:s.find(id='hardware-data-availability').append(p.extract())
  old='on 20 October 2026';chronology.append({'page':page,'context':'PCB currency conversion USD1=NTD32.615; Bank of Taiwan spot-rate midpoint','date':'20 October 2026'})
  replace_text(s,old,'in the recorded conversion snapshot',page)
  for frame in s.select('iframe[title]'):
   if ' R6 ' in frame['title']:frame['title']=frame['title'].replace(' R6 ',' ')
 elif page=='model':
  replace_text(s,'Simulate the reader before building','Physical model overview',page)
  replace_text(s,'Transport and measurement come first','Transport and measurement assumptions',page)
  p=para(s,'The four strong same-well entries');a=p.find('a',href=True)
  if a:
   da=s.find(id='model-data-availability');li=s.new_tag('p');li.append(a.extract());da.append(li)
  move_p(s,'The four strong same-well entries','hardware-model-discussion',page)
  p=para(s,'The D3 reference yields');sentence='The SE excludes uncertain LED power, resin optics, detector orientation, filter-angle response and cellular expression.'
  html=p.decode_contents();assert sentence in html;p.clear()
  for c in list(BeautifulSoup(html.replace(sentence,''),'html.parser').contents):p.append(c)
  add_p(s,'hardware-model-discussion',sentence)
  replace_p(s,'The current comparison tests no filter','The comparison tests no filter, one or two LEE101 layers, and a constructed 500 nm OD4 longpass scenario. The model integrates wavelength-dependent source power, filter transmission and detector responsivity to predict photodiode current in nA under the stated optical assumptions.',page)
  add_p(s,'hardware-model-discussion','The predicted photodiode currents describe the optical input; they do not include measured electronics or cell responses.')
  move_p(s,'This one-factor sensitivity study is exploratory.','aerosense-bridge',page)
  # Generic limitation moved; the experimental-null result remains beside each figure.
  p=para(s,'This organization suggests a practical division:');sentence='Expansion alone does not guarantee robustness: its benefit depends on input statistics, connectivity and sparseness.'
  html=p.decode_contents();assert sentence in html;p.clear()
  for c in list(BeautifulSoup(html.replace(sentence,'The contribution of expansion depends on input statistics, connectivity and sparseness.'),'html.parser').contents):p.append(c)
  # Keep all existing study scopes; their discussions/conclusions precede shared data/supplement/references.
 elif page=='engineering':
  replace_text(s,'How to read the cycles','Engineering approach',page)
  h=s.find(id='what-we-would-do-differently').find('h2');h.string='Discussion'
  # Chronological dates stay in the dated record; iteration labels remain on Engineering.
  replacements=[('16 October 2026: board diagnosis informs the next gain test','Board diagnosis informs the next gain test'),('8 October update.','Earlier integration package.'),('By early August, V1 had','V1 included'),('The 2 August archive recorded','The V1 archive recorded'),('The 11 October workbook recorded','The historical workbook recorded'),(' is dated 5 October 2026, 15:13',' records the historical quotation basis'),('As of 16 October 2026, resistor replacement and these verification tests were pending.','The diagnostic record ended with resistor replacement and verification tests proposed for the next iteration.')]
  for old,new in replacements:
   chronology.append({'page':page,'original':old,'replacement':new});replace_text(s,old,new,page)
  p=para(s,'BBa_26E11Z80:');old=p.get_text(' ',strip=True);chronology.append({'page':page,'original':old,'note':'Registry documentation status was a historical check, not a statement of current online status.'})
  for x in list(p.find_all(string=True)):
   if 'Verified on 11 October 2026; the Documentation section was empty.'in str(x):x.replace_with(str(x).replace('Verified on 11 October 2026; the Documentation section was empty.','The dated documentation review is recorded in Notebook.'))
  p=para(s,'The available microscopy record now covers');html=p.decode_contents()
  html=html.replace('The available microscopy record now covers 25 fields across 12 conditions before G418 selection, imaged about 44–48 hours after transfection. DAPI followed 2% PFA fixation.','The microscopy record covers 25 fields across 12 conditions before G418 selection.')
  p.clear()
  for c in list(BeautifulSoup(html,'html.parser').contents):p.append(c)
  # Remove a duplicated standalone limitation from the narrative, preserving source labels at evidence cards.
  move_p(s,'The archive contains the V2 design and verification protocol; no V3 revision','what-we-would-do-differently',page)
  # The report-to-file mismatch belongs with the engineering evidence limits.
  move_p(s,'The DRC report names final.kicad_pcb;','what-we-would-do-differently',page)
  for p in list(s.select('#hw-c5-panel-redesign p')):
   if any('user-feedback-en.pdf'in a.get('href','')for a in p.find_all('a')):s.find(id='engineering-data').append(p.extract())
  # Both date/version headers in the table are iteration labels, not dates.
  for x in s.select('#hw-change-log [data-label="Date / version"]'):x['data-label']='Version'
  for x in s.select('#hw-change-log th'):
   if x.get_text(strip=True)=='Date / version':x.string='Version'
 after=snapshot(s)
 assert before['ids']==after['ids'],(page,'ids changed')
 assert not(before['hrefs']-after['hrefs']),(page,'link destination lost',before['hrefs']-after['hrefs'])
 assert before['media']==after['media'],(page,'media refs changed')
 assert before['scripts']==after['scripts'],(page,'scripts changed')
 assert before['svg']==after['svg'],(page,'inline diagrams changed')
 # Only Engineering's nonnumeric Date/version table heading was refined.
 if page=='engineering':
  bt=[[v.replace('Date / version','Version')for v in row]for row in before['tables']]
  assert bt==after['tables'],(page,'table content changed')
 else:assert before['tables']==after['tables'],(page,'table content changed')
 assert before['figures']==after['figures'],(page,'figures changed')
 # Protected family text in embedded Engineering summaries remains exactly unchanged.
 if page=='engineering':
  original_s=BeautifulSoup(original,'html.parser')
  for id in ['entrepreneurship-engineering','education-engineering']:
   assert original_s.find(id=id).get_text()==s.find(id=id).get_text(),(page,id,'protected text')
 assert path.read_text(encoding='utf-8')==original,'Concurrent page change; abort before overwrite'
 path.write_text(str(s),encoding='utf-8')
 changes.append({'page':page,'action':'verification','all_original_links_retained':True,'media_refs_unchanged':True,'inline_svg_unchanged':True,'scripts_unchanged':True,'table_values_unchanged':True,'ids_preserved':True,'before_sha256':sha(original),'after_sha256':sha(str(s))})
(OUT/'owned-pages-editorial-changes.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUT/'chronology-for-notebook.json').write_text(json.dumps(chronology,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'changes':len(changes),'chronology_records':len(chronology),'pages':['hardware','model','engineering']},indent=2))
