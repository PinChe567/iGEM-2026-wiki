from pathlib import Path
from bs4 import BeautifulSoup, Comment
import json,re

SITE=Path(__file__).resolve().parents[2]
p=SITE/'results.html';s=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
lp=SITE/'locales/extras/zh-Hant/results.json';tr=json.loads(lp.read_text(encoding='utf-8'))
def put(node,en,zh):
    node.clear();node.append(en);tr[en]=zh
def findp(id,prefix):return next(x for x in s.select(f'#{id} > p') if x.get_text().startswith(prefix))
def caption(id,n,en,zh):
    e=s.select_one(f'#{id} figcaption');e.clear()
    b=s.new_tag('strong',attrs={'class':'media-caption__label'});b.string=f'Figure {n}. ';e.append(b);e.append(en);tr[en]=zh

# Keep processing details with the existing collapsed numerical audit.
audit=s.select_one('#results-supplement-odor21 .supplementary-data__body')
processing=s.new_tag('div',id='odor-processing-details')
h=s.new_tag('h3',attrs={'class':'reading-heading--topic'});h.string='Processing definitions';processing.append(h);tr['Processing definitions']='資料處理定義'
controls=s.find(id='kinetic-controls')
for e in list(controls.find_all('p',recursive=False)):
    if e.get_text().startswith(('For the current assay,','The current subtraction','Control behavior remains')) or 'assay-formula' in e.get('class',[]):processing.append(e.extract())
method=s.select_one('#kinetic-map .p2-comparison-method')
if method:processing.append(method.extract())
a=s.new_tag('a',href='fig/odor-2026-10-21/supplementary-correction-components.svg');a.string='View the full processing components';tr[a.string]='查看完整處理分量圖';processing.append(a)
audit.append(processing)

put(findp('kinetic-pilot','We followed'),
 'We followed fluorescence over time in ten OR + ORCO conditions, ORCO-only cells and untransfected cells. Figures 11–14 present Test 1 and Test 2 through their time courses, condition comparisons, corrected signals and control-referenced response maps.',
 '我們追蹤十組 OR + ORCO、僅含 ORCO 與未轉染細胞的螢光時間變化。圖 11–14 依序以時間曲線、條件比較、校正訊號與參照對照組的反應圖呈現 Test 1 和 Test 2。')
put(findp('kinetic-pilot','In the current VUAA1 wells'),
 'In Test 2, ten of twelve VUAA1 time courses end above their first reading, while eleven conditions have a positive corrected change. Or7a + ORCO and untransfected cells end lower; a positive corrected score does not necessarily mean that the measured trace rises.',
 'Test 2 的十二條 VUAA1 曲線有十條終點高於起點，十一組條件的校正變化為正。Or7a + ORCO 與未轉染細胞的終點較低；校正分數為正不一定代表量測曲線上升。')
put(controls.h3,'VUAA1 signals and control behavior','VUAA1 訊號與對照行為')
intro=s.new_tag('p');put(intro,
 'Figure 12 compares all twelve cell conditions. Figure 13 focuses on selected VUAA1 and control wells, making it easier to see whether a positive corrected signal also occurs in the controls. In Test 2, corrected changes are +36.67 pp for Or35a + ORCO, +18.69 pp for ORCO only and −0.11 pp for untransfected cells.',
 '圖 12 比較全部十二組細胞條件。圖 13 聚焦於部分 VUAA1 與對照孔，方便觀察對照是否也出現正向校正訊號。Test 2 中，Or35a + ORCO 的校正變化為 +36.67 pp、僅含 ORCO 為 +18.69 pp，未轉染細胞為 −0.11 pp。');controls.h3.insert_after(intro)
outro=s.new_tag('p');put(outro,
 'Test 1 includes a large positive buffer-control signal, whereas the twelve Test 2 DMSO-control scores range from −1.79 to −0.31 pp. The corrected values are descriptive results from individual wells, rather than activation thresholds.',
 'Test 1 中有緩衝液對照呈現明顯正向訊號；Test 2 的十二組 DMSO 對照分數則介於 −1.79 至 −0.31 pp。這些校正值是單孔的描述性結果，並非活化判定門檻。');s.find(id='fig-p2-correction').insert_after(outro)

caption('fig-p2-traces',11,
 'Normalized VUAA1 and control time courses in Test 1 and Test 2. Test 1 uses each well’s paired baseline; Test 2 uses the first post-addition reading. Each trace represents one well, and panels have independent vertical scales.',
 'Test 1 與 Test 2 的 VUAA1 及對照正規化曲線。Test 1 使用各孔配對基線，Test 2 使用加樣後第一筆讀值。每條曲線代表一孔，各圖採獨立縱軸範圍。')
caption('fig-p2-condition-comparison',12,
 'All twelve cell conditions. Test 1 shows peak test excursions (%), while Test 2 shows corrected changes (pp); these test-specific summaries are displayed separately.',
 '全部十二組細胞條件。Test 1 顯示峰值測試變化（%），Test 2 顯示校正變化（pp）；兩種測試摘要分開呈現。')
caption('fig-p2-correction',13,
 'Corrected VUAA1 signals alongside control signals for selected cell conditions. Test 1 uses buffer controls and Test 2 uses DMSO controls; each test retains its own correction method, documented in the supplementary analysis.',
 '部分細胞條件的校正 VUAA1 訊號與對照訊號並列。Test 1 使用緩衝液對照，Test 2 使用 DMSO 對照；兩次測試各自的校正方法記錄於補充分析。')
caption('fig-p2-map',14,
 'Response maps with receptors in rows and stimuli in columns, using a shared −60 to +60 pp scale. Hatched Test 1 isopentyl-acetate cells remain excluded; the control maps subtract separate wells and do not establish receptor specificity.',
 '反應圖以受體為列、刺激為欄，共用 −60 至 +60 pp 色階。Test 1 斜線標示的乙酸異戊酯格維持排除；對照差值圖扣除不同孔的訊號，尚無法確立受體專一性。')

for id,base in [('fig-p2-traces','integrated-vuaa1-traces'),('fig-p2-condition-comparison','integrated-condition-comparison'),('fig-p2-correction','integrated-correction-components')]:
    f=s.find(id=id);img=f.find('img');anchor=img.find_parent('a')
    oldpic=img.find_parent('picture')
    if oldpic:oldpic.unwrap()
    pic=s.new_tag('picture');source=s.new_tag('source',attrs={'media':'(max-width: 650px)','srcset':f'fig/odor-2026-10-21/{base}-mobile.svg'})
    pic.append(source);pic.append(img.extract());anchor.append(pic)
    if id=='fig-p2-correction':img['alt']='Corrected VUAA1 and control signals for selected conditions in Test 1 and Test 2'
for e in list(s.select('.final-assay-pan-hint')):e.decompose()

def rename(text):
    for pat,value in [(r'\b[Ee]arlier assay\b','Test 1'),(r'\b[Cc]urrent assay\b','Test 2'),(r'\b[Ee]arlier kinetic assay\b','Test 1 kinetic assay'),(r'\b[Cc]urrent odor-assay\b','Test 2 odor-assay'),(r'\b[Cc]urrent odor assay\b','Test 2 odor assay')]:text=re.sub(pat,value,text)
    text=text.replace('The Test 1','Test 1').replace('the Test 1','Test 1').replace('The Test 2','Test 2').replace('the Test 2','Test 2')
    return text
# Include core translations when existing source text is renamed.
src=json.loads((SITE/'locales/source/results.json').read_text(encoding='utf-8'))
zh=json.loads((SITE/'locales/zh-Hant/results.json').read_text(encoding='utf-8'))
catalog={v['text']:zh[k]for k,v in src.items()if k in zh};catalog.update(tr)
for node in list(s.find_all(string=True)):
    if isinstance(node,Comment)or node.parent.name in ['script','style']:continue
    old=str(node);new=rename(old)
    if new!=old:
        node.replace_with(new)
        key=old.strip()
        if key in catalog:tr[new.strip()]=catalog[key].replace('先前測試','Test 1').replace('先前的測試','Test 1').replace('本次測試','Test 2').replace('本次氣味測試','Test 2 氣味測試')
for e in s.select('[alt],[aria-label]'):
    for attr in ['alt','aria-label']:
        if e.has_attr(attr):e[attr]=rename(e[attr])
# Remove residual relative batch wording in map prose and availability headings.
for node in list(s.find_all(string=True)):
    if node.parent.name in ['script','style']:continue
    old=str(node);new=old.replace('Current VUAA1 S values','Test 2 corrected VUAA1 values').replace('the current six-stimulus screen','the six-stimulus Test 2 screen').replace('The current DMSO control','The Test 2 DMSO control').replace('The current batch','The Test 2 batch')
    if new!=old:
        node.replace_with(new)
        if old.strip()in tr:tr[new.strip()]=tr[old.strip()].replace('本次','Test 2')
p.write_text(str(s),encoding='utf-8')
lp.write_text(json.dumps(tr,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Results display simplified; processing moved to existing supplementary audit; responsive figures connected.')
