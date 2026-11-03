"""One-time, scoped editorial pass; preserves scientific figures, tables and IDs."""
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
import json, re, hashlib, collections
ROOT=Path(__file__).resolve().parents[2]
PAGES=['description','design','results','measurement','experiments','parts','contribution']
docs={n:BeautifulSoup((ROOT/(n+'.html')).read_text(encoding='utf-8'),'html.parser') for n in PAGES}
changes=[];zh={n:{} for n in PAGES}
def text(x):return x.get_text(' ',strip=True)
def snapshot(s):
    article=s.select_one('article.page-article');main=s.select_one('main')
    digest=lambda v:hashlib.sha256(v.encode()).hexdigest()
    return dict(section_order=[{'id':x.get('id'),'heading':text(x.find(re.compile('^h[2-4]$')))} for x in article.find_all('section',recursive=False)],all_ids=sorted(x['id'] for x in s.select('[id]')),figures=[{'id':x.get('id'),'hash':digest(str(x))} for x in s.find_all('figure')],media=sorted(json.dumps(dict(x.attrs),sort_keys=True) for x in s.select('img,video,source,iframe,canvas')),table_text_hashes=sorted(digest(text(x)) for x in s.find_all('table')),scripts=[digest(str(x)) for x in s.find_all('script')],numeric_tokens=dict(collections.Counter(re.findall(r'[-−]?\d+(?:[.,]\d+)*',text(main)))),word_count=len(text(article).split()))
before={n:snapshot(s) for n,s in docs.items()}
def edit(n,tag,html,translation=None):
    before=text(tag);tag.clear()
    for x in list(BeautifulSoup(html,'html.parser').contents):tag.append(x)
    after=text(tag)
    changes.append(dict(page=n,kind='prose',before=before,after=after))
    if translation:zh[n][after]=translation
def para(n,prefix,html,translation=None):
    items=[p for p in docs[n].select('main p') if text(p).startswith(prefix)]
    assert len(items)==1,(n,prefix,len(items))
    edit(n,items[0],html,translation);return items[0]
def heading(n,selector,word,translation):edit(n,docs[n].select_one(selector),word,translation)
def move(n,tag,dest):
    old=(tag.find_parent('section') or {}).get('id');dest.append(tag.extract())
    changes.append(dict(page=n,kind='move',from_section=old,to_section=dest.get('id'),text=text(tag)))
def newp(n,parent,html,translation):
    p=docs[n].new_tag('p');parent.append(p);edit(n,p,html,translation);return p
def replace_text(n,old,new,translation=None):
    count=0
    for x in list(docs[n].find_all(string=True)):
        if x.parent.name in ['script','style'] or x.find_parent(['table','figure','code','pre']):continue
        if old in str(x):
            v=str(x).replace(old,new);x.replace_with(v);count+=1
    if count:changes.append(dict(page=n,kind='wording',before=old,after=new,count=count))
    if translation:zh[n][new]=translation
    return count

# Description: the user-authored abstract is preserved verbatim.
abstract="Fungal deterioration causes substantial crop losses, highlighting the need for accessible tools for early, on-site detection. Our project, AeroSense, is a modular biohybrid olfactory platform designed for agricultural screening, with banana production as its intended first application. The platform brings together a cell-based sensing array expressing Drosophila odorant receptors and their coreceptor ORCO in HEK293 cells, GCaMP6f fluorescence reporting, a compact four-channel optical reader, and a fly-inspired neural network for odor-pattern decoding. We documented reporter expression and conducted exploratory measurements of fluorescence kinetics. We also built and tested the optical reader using fluorescent standards, with transport and optical modeling informing its design. In parallel, computational studies evaluated odor-pattern decoding on external sensor datasets. Discussions with agricultural researchers and potential users shaped the proposed screening workflow and a shared-access deployment strategy. Together with reusable analysis code, hardware documentation, and educational resources, this work lays the groundwork for an accessible screening tool to guide follow-up inspection and confirmatory testing."
edit('description',docs['description'].select_one('#abstract p'),abstract,'真菌劣變造成大量作物損失，凸顯便於使用的早期現場檢測工具之需求。AeroSense 是為農業篩檢設計的模組化生物混合嗅覺平台，預定以香蕉生產作為首個應用情境。平台整合在 HEK293 細胞中表達果蠅嗅覺受體及其共同受體 ORCO 的細胞感測陣列、GCaMP6f 螢光報導、精巧的四通道光學讀取器，以及受果蠅啟發的氣味模式解碼神經網路。我們記錄了報導蛋白表達，並進行探索性的螢光動態量測；也使用螢光標準品建立及測試光學讀取器，以傳輸與光學模型支持設計。同時，計算研究使用外部感測器資料集評估氣味模式解碼。與農業研究人員及潛在使用者的討論，形成了擬議的篩檢流程及共享使用部署策略。這些工作連同可重用的分析程式、硬體文件與教育資源，為引導後續檢查及確認檢驗的可及篩檢工具奠定基礎。')
oldpilot=next(p for p in docs['description'].select('#abstract p') if text(p).startswith('In the single-plate'))
move('description',oldpilot,docs['description'].select_one('#evidence-ladder'))
replace_text('description','P2','Test 1')
para('description','AeroSense begins with a question:','AeroSense follows a measurement chain: receptor recognition, fluorescence readout, pattern decoding and a screening decision. Each layer has a defined input, output and validation question.','AeroSense 依序連結受體辨識、螢光讀取、模式解碼與篩檢決策；每一層都有明確的輸入、輸出及驗證問題。')
para('description','The Description page states','The pages below develop the biological design, measurement system and validation evidence behind this architecture.','以下頁面進一步說明這套架構的生物設計、量測系統與驗證證據。')
para('description','The use of Drosophila OR/Orco','Published mammalian OR/Orco sensing establishes the biological starting point for AeroSense.','已發表的哺乳類細胞 OR/Orco 感測研究，是 AeroSense 的生物設計起點。')
para('description','AeroSense builds on that established architecture.','Our contribution is the integration and evaluation of receptor modules, weak-fluorescence hardware and structured decoding within a traceable measurement workflow.','我們的貢獻是在可追溯的量測流程中，整合並評估受體模組、弱螢光硬體與結構化解碼。')
replace_text('description','Our first application in 2026 is','Our initial application is')
replace_text('description','2026 focus','Application focus','應用重點')
replace_text('description','We narrowed the 2026 application','We narrowed the initial application')

# Results: keep the measured findings central; consolidate interpretive limits.
r=docs['results'];e=docs['experiments'];discussion=r.select_one('#limitations')
p=para('results','Test 2 contains 72 wells','Test 2 contains 72 wells and 1,440 readings across ten OR + ORCO conditions, ORCO-only cells and untransfected cells. Each construct × stimulus has one well.','Test 2 包含 72 孔、1,440 筆讀值，涵蓋十種 OR + ORCO 條件、僅 ORCO 細胞及未轉染細胞；每個構築體與刺激組合各一孔。')
methods=e.select_one('#exp-p2-kinetics')
h=e.new_tag('h3',id='exp-test2-kinetics');methods.append(h);edit('experiments',h,'Test 2: two-acquisition odor panel','Test 2：兩階段讀取的氣味測試')
newp('experiments',methods,'Test 2 contains 72 wells and 1,440 readings. Rows A, D, E, F, G and H contain VUAA1, isopentyl acetate, 2-heptanone, valeric acid, pentyl acetate and DMSO control, respectively. VUAA1 was diluted 1:100; the odor solutions were diluted 1:1,000, with 0.1% DMSO reported. Stock concentrations were not supplied.','Test 2 包含 72 孔與 1,440 筆讀值。A、D、E、F、G、H 列分別為 VUAA1、乙酸異戊酯、2-庚酮、戊酸、乙酸戊酯及 DMSO 對照。VUAA1 稀釋 1:100，氣味溶液稀釋 1:1,000，使用者記錄 DMSO 為 0.1%；未提供原液濃度。')
newp('experiments',methods,'Positions 1–12 are Or7a + ORCO, Or19a + ORCO, Or22a + ORCO, Or35a + ORCO, Or42a + ORCO, Or59b + ORCO, Or67a + ORCO, Or67b + ORCO, Or85b + ORCO, Or98a + ORCO, ORCO only and no transfect. F0 contains five reads over 0–48 s; F1 contains fifteen reads over 0–168 s, both at 12 s intervals. Each acquisition starts its own clock. <a href="results.html#vuaa1-reference-method">Results defines the endpoint correction and VUAA1-reference normalization.</a>','位置 1–12 依序為 Or7a + ORCO、Or19a + ORCO、Or22a + ORCO、Or35a + ORCO、Or42a + ORCO、Or59b + ORCO、Or67a + ORCO、Or67b + ORCO、Or85b + ORCO、Or98a + ORCO、僅 ORCO 及未轉染。F0 在 0–48 秒讀取五次，F1 在 0–168 秒讀取十五次，間隔皆為 12 秒，各階段獨立計時。Results 說明端點校正及 VUAA1 參考正規化。')
for prefix in ['These are differences between separate control wells','This map shows response relative to each construct’s reference']:
    p=next(p for p in r.select('main p') if text(p).startswith(prefix));move('results',p,discussion)
newp('results',discussion,'Test 2 concentrations are reported as dilution factors because stock concentrations were not supplied. Repeated time points describe each well’s trajectory; biological replication requires independent cultures.','Test 2 以稀釋倍數記錄濃度，因為未提供原液濃度。重複時間點描述單孔的軌跡；生物重複需來自獨立培養。')
para('results','The blank yielded 1/170','The blank yielded 1/170 eligible objects above each channel threshold. The mCherry-free Orco-only condition yielded 0/342 RED-positive and 24/342 GREEN-positive objects, separating the two reporter channels within this image set.','空白組各通道有 1/170 個合格物件超過閾值；不含 mCherry 的僅 Orco 條件有 0/342 個 RED 陽性及 24/342 個 GREEN 陽性物件，在這批影像中區分了兩種報導通道。')
newp('results',discussion,'The blank also set the positivity threshold. Its 1/170 fraction is therefore a calibration diagnostic rather than an independently estimated false-positive rate.','空白組同時用於設定陽性閾值，因此 1/170 是校準診斷值，而非獨立估計的偽陽性率。')
for a in list(r.select('#kinetic-pilot .final-assay-links a[href="#results-odor21-source-files"]')):
    a.decompose();changes.append(dict(page='results',kind='duplicate_link_removed',target='#results-odor21-source-files'))

# Design: retain design logic, put catalogues after conclusion/data availability.
d=docs['design'];article=d.select_one('article.page-article')
heading('design','#design-discussion h2','Discussion','討論')
heading('design','#design-data h2','Data availability','資料取得')
for ident in ['limitations','design-future-work']:
    section=d.select_one('#'+ident);d.select_one('#design-discussion').append(section.extract())
    h=section.find('h2')
    if h:h.name='h3'
    changes.append(dict(page='design',kind='section_move',section=ident,to='design-discussion'))
for ident in ['design-feature-catalog','design-or-catalog']:
    article.append(d.select_one('#'+ident).extract());changes.append(dict(page='design',kind='section_move',section=ident,to='after-design-data'))
heading('design','#design-feature-catalog h2','Supplementary data · cassette features','補充資料：表達盒元件')
heading('design','#design-or-catalog h2','Supplementary data · receptor notes','補充資料：受體說明')
edit('design',d.select_one('#assay-design .design-callout--evidence li'),'mCherry provides an IRES-dependent expression marker translated from the same Module 1 transcript as the tuning receptor.','mCherry 是由與調諧受體相同的 Module 1 轉錄本，經 IRES 依賴轉譯產生的表達標記。')
para('design','Sequence checks, synthesis, Sanger reads','The verification framework distinguishes sequence review, synthesis, Sanger reads and living-cell function, with a separate evidence status for each.','驗證架構將序列審查、合成、Sanger 定序及活細胞功能分開，分別記錄各層證據狀態。')
para('design','The P2 data provide','The acquired odor tests are reported on Results.','已取得的氣味測試結果呈現於 Results。')
replace_text('design','The P2 record documents','The odor-test record documents')

# Measurement: preserve definitions and validity qualifications, relocate prep.
m=docs['measurement'];md=m.select_one('#discussion')
heading('measurement','#discussion h2','Discussion · measurement uncertainty','討論：量測不確定性')
heading('measurement','#kinetic-measurement h2','Test 1: separate the trace from the correction','Test 1：區分原始軌跡與校正值')
para('measurement','WL-MIC-01. HEK293 cells','WL-MIC-01 contains matched fluorescence channels from the same HEK293 fields, with 1–3 fields per condition. The source images are 8-bit exports. Biological preparation, fixation and staining are documented in <a href="experiments.html#expression-validation">Experiments</a>.','WL-MIC-01 包含同一 HEK293 視野的配對螢光通道，各條件有 1–3 個視野，來源影像為 8 位元匯出檔。生物樣本準備、固定與染色記錄於 Experiments。')
old=next(p for p in m.select('main p') if text(p).startswith('The experimental date, operator'))
move('measurement',old,md)
newp('measurement',md,'The supplied image set has no independent biological repeat or live/dead stain. These limits apply to population and viability claims, while the analysis remains reproducible at the selected-object level.','這批影像沒有獨立生物重複或活死染色，因此對族群及存活率推論有限；選定物件層級的分析仍可重現。')
para('measurement','The acquired P2 pilot adds','Test 1 adds kinetic fluorescence measurements from one 96-well HEK293 plate. Each condition × stimulus has one well; fifteen sequential readings describe its time course. The biological preparation is documented in <a href="experiments.html#exp-p2-kinetics">Experiments</a>.','Test 1 提供一盤 96 孔 HEK293 的動態螢光量測；每個條件與刺激組合各一孔，十五次連續讀值描述其時間軌跡。生物樣本準備記錄於 Experiments。')
newp('measurement',md,'Test 1 was acquired approximately 72 h after transfection without G418 selection, separately from the 44–48 h fixed-cell images. Fifteen reads of one well remain technical observations rather than independent samples.','Test 1 在轉染後約 72 小時、未經 G418 篩選時量測，與轉染後 44–48 小時的固定細胞影像屬不同紀錄。單孔十五次讀值仍是技術觀察，而非獨立樣本。')
replace_text('measurement','P2 adds acquired','Test 1 adds acquired')
para('measurement','The analysis defines a reproducible','The analysis produces a reproducible selected-object fraction, quantifies threshold sensitivity and distinguishes local reporter contrast from broad fluorescent area. These defined measurements support comparison within the acquired image set.','本分析產生可重現的選定物件比例、量化閾值敏感度，並區分局部報導訊號對比與廣泛螢光面積，支持在已取得影像集內進行定義明確的比較。')
newp('measurement',md,'The selected-object fraction does not estimate whole-culture transfection efficiency, biological reproducibility or receptor function.','選定物件比例不代表整體培養的轉染效率、生物再現性或受體功能。')
for section_id in ['pipeline','controls','area-versus-objects','kinetic-measurement']:
    section=m.select_one('#'+section_id)
    for a in list(section.select('a')):
        if text(a)=='Data availability':
            a.decompose();changes.append(dict(page='measurement',kind='duplicate_link_removed',target='#reproducibility'))
# Keep the substantive formula sentence but collect its duplicate code links below.
implementation_links=docs['measurement'].select('#pipeline p a')
if implementation_links:
    linkp=m.new_tag('p');m.select_one('#reproducibility').append(linkp)
    linkp.append('Object segmentation and parameters: ')
    for i,a in enumerate(implementation_links):
        if i:linkp.append(' · ')
        linkp.append(a.extract())
para('measurement','The signal score is','The signal score is q90(signal pixels) − median(background-ring pixels). Units are exported digital numbers (DN). The primary segmentation and thresholds are retained in the control audit; source code and parameter files are collected under Data availability.','訊號分數為 q90（訊號像素）減去背景環像素中位數，單位為匯出數位值 DN。控制審核保留原始分割及閾值；程式與參數檔集中於資料取得區。')
newp('measurement',md,'Exported digital numbers are not calibrated photon counts or calcium concentrations.','匯出數位值尚未校準為光子計數或鈣離子濃度。')

# Experiments is the single biological-method destination. Keep execution status.
heading('experiments','#exp-p2-kinetics header h3','Odor-test acquisition and analysis','氣味測試的讀取與分析')
replace_text('experiments','P2','Test 1')
para('experiments','The team confirms that the supplied HEK293 images','The supplied HEK293 images were acquired approximately 44–48 h after transfection and before G418 selection. Cells were fixed with 2% paraformaldehyde, without permeabilization, then stained with DAPI. Blue images show DAPI; matching field numbers identify the same field across channels. Exposure was held constant within each channel across groups, and blank calibration was performed. Fixation duration, numerical exposure settings and the complete acquisition log were not supplied.','這批 HEK293 影像於轉染後約 44–48 小時、G418 篩選前取得。細胞以 2% 多聚甲醛固定，不進行通透化，之後以 DAPI 染色。藍色通道為 DAPI；相同視野編號代表跨通道的同一視野。各組同通道曝光一致，並進行空白校準；未提供固定時間、數值曝光設定及完整讀取紀錄。')
para('experiments','Zboray et al. used FuGene HD','The reference study used FuGene HD in HEK293 stable lines <a aria-label="Reference 2" class="cite" href="#ref-zboray-2023" id="cite-auto-ref-zboray-2023-1">[2]</a>. AeroSense retains its own delivery specification and sample record.','參考研究在 HEK293 穩定細胞株使用 FuGene HD [2]；AeroSense 保留自己的遞送規格與樣本紀錄。')

# Parts and Contribution: concise reuse routes; retain inventory and statuses.
heading('parts','#parts-documentation h2','Data availability','資料取得')
para('parts','Select a block to highlight','Select a block to trace its expression pathway. CMV and BGH poly(A) are shared pcDNA3.1(+) backbone features; the catalogue identifies the registered AeroSense parts.','選取方塊可追蹤其表達路徑。CMV 與 BGH poly(A) 為共用的 pcDNA3.1(+) 骨架元件；目錄另列出已登錄的 AeroSense 元件。')
para('parts','Select a protein in the diagram','Select a protein to highlight its translation product. The diagram represents the designed topology; structural and functional evidence is documented separately.','選取蛋白質可標示其轉譯產物。此圖呈現設計拓樸，結構及功能證據另行記錄。')
heading('contribution','#p2-contribution h2','Reuse the kinetic odor assays','重用動態氣味測試')
replace_text('contribution','P2','Test 1')
heading('contribution','#resource-roadmap h2','Discussion · reuse scope','討論：重用範圍')
heading('contribution','#one-sentence h2','Conclusion','結論')
para('contribution','AeroSense documents a path','AeroSense provides reusable biological designs, weak-signal measurement methods and structured odor-decoding resources. Teams can adopt one layer and trace its inputs, analysis and evidence independently.','AeroSense 提供可重用的生物設計、弱訊號量測方法及結構化氣味解碼資源。其他團隊可採用其中一層，並獨立追溯其輸入、分析及證據。')
# Move duplicate download controls from the two opening evidence sections into DA.
da=docs['contribution'].select_one('#contribution-data-availability')
for ident in ['released-contribution','p2-contribution']:
    for p in list(docs['contribution'].select_one('#'+ident).find_all('p')):
        if p.find_parent(['figure','table']):continue
        anchors=p.find_all('a')
        if anchors and ('GitLab' in text(p)) and len(text(p))<150:
            move('contribution',p,da)

# Update only page-specific editable overlays. Global runtime build belongs to root.
after={n:snapshot(s) for n,s in docs.items()}
for n in PAGES:
    for field in ['media','table_text_hashes','scripts']:
        assert before[n][field]==after[n][field],(n,field)
    assert before[n]['figures']==after[n]['figures'],(n,'figures')
    lost=set(before[n]['all_ids'])-set(after[n]['all_ids'])
    assert not lost,(n,'lost IDs',lost)
(Path(__file__).parent/'editorial-before.json').write_text(json.dumps(before,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(Path(__file__).parent/'editorial-after.json').write_text(json.dumps(after,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for n in PAGES:
    (ROOT/(n+'.html')).write_text(str(docs[n]),encoding='utf-8')
    path=ROOT/'locales/extras/zh-Hant'/f'{n}.json'
    content=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    content.update(zh[n]);path.write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(Path(__file__).parent/'editorial-changes.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'changes':len(changes),'by_page':dict(collections.Counter(x['page'] for x in changes))},indent=2))
