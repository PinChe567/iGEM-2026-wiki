"""Second scoped prose pass. Run once after apply_editorial.py."""
from pathlib import Path
base=Path(__file__).parent
exec((base/'apply_editorial.py').read_text(encoding='utf-8').split('# Description:')[0])
initial=json.loads((base/'editorial-before.json').read_text(encoding='utf-8'))
prior=json.loads((base/'editorial-changes.json').read_text(encoding='utf-8'))
def remove(n,tag,reason):
    assert not tag.select('[id]') and not tag.get('id')
    changes.append(dict(page=n,kind='consolidated',text=text(tag),reason=reason));tag.decompose()

# Keep Results centered on observations and merge repeated limitations.
r=docs['results'];rd=r.select_one('#limitations')
p=next(p for p in r.select('#kinetic-pilot p') if text(p).startswith('VUAA1 is an established'))
citations=' '.join(str(a) for a in p.select('a.cite'))
edit('results',p,'VUAA1 is an established Orco agonist used in heterologous receptor assays. '+citations,'VUAA1 是用於異源受體測試的已知 Orco 致效劑。[2] [3]')
para('results','The control comparisons use separate wells.','Control comparisons use separate single wells and describe fluorescence patterns rather than receptor-specific activation. Test 2 includes a DMSO reference; Test 1 lacks a matched vehicle control. Unrecorded gain, cell-state variation and dilution-only concentration records limit interpretation. Vehicle-matched tests at documented doses in independent cultures are needed to separate these effects.','對照比較來自不同的單孔，描述的是螢光模式而非受體專一性活化。Test 2 有 DMSO 參考；Test 1 缺乏匹配的溶劑對照。未記錄的增益、細胞狀態差異，以及僅以稀釋倍數記錄的濃度限制了解讀；需在獨立培養中使用匹配溶劑與明確劑量，才能區分這些影響。')
remove('results',next(p for p in rd.find_all('p') if text(p).startswith('These are differences between separate control wells')),'Merged with the adjacent control-comparison limitation; metrics remain defined in captions and supplement.')
para('results','Test 2 concentrations are reported as dilution factors','Stock concentrations were not supplied for Test 2. Repeated time points describe within-well trajectories and do not provide independent biological replication.','Test 2 未提供原液濃度；重複時間點描述單孔內的軌跡，不提供獨立生物重複。')
p=next(p for p in r.select('#conclusion p') if text(p).startswith('The odor assays provide'))
edit('results',p,text(p).replace('; independent replication is still needed to assess reproducibility and receptor specificity.','.'),'氣味測試提供 VUAA1 相關螢光的時間序列證據。Test 2 扣除 F0 變化後，Or35a + ORCO 為 +36.67 個百分點、Or85b + ORCO 為 +17.52、Or98a + ORCO 為 +29.46、僅 ORCO 為 +18.69，未轉染細胞則為 −0.11。對照圖與保留的原始紀錄使這些觀察可供檢視。')
for a in list(r.select('#fly-lightsheet-results p.final-assay-links a')):
    if text(a)=='Data availability':remove('results',a,'Data links remain in Data availability; method navigation retained.')

# Measurement: retain the nominal model beside its numbers, centralize scope.
m=docs['measurement'];md=m.select_one('#discussion')
para('measurement','The numerator is the number','The selected-object fraction divides reporter-positive DAPI-connected objects by all objects passing the same geometric and background rules. A channel-specific blank threshold defines positivity. This denominator describes resolvable objects, not all cells in the culture.','選定物件比例以報導訊號陽性的 DAPI 連通物件數，除以通過相同幾何與背景規則的所有物件數。各通道的空白閾值定義陽性；分母描述可分辨的物件，而非整體培養中的所有細胞。')
para('measurement','The untransfected blank estimates','The untransfected blank sets the image-background threshold. The Orco-only condition contains the green reporter module without the mCherry sensing cassette, providing a channel-specific RED negative control. The primary blank’s 1/170 positive-object fraction summarizes the same fields used for calibration.','未轉染空白組用於設定影像背景閾值。僅 Orco 條件包含綠色報導模組、不含 mCherry 感測表達盒，提供 RED 通道專用的陰性對照。原始空白的 1/170 陽性物件比例，來自用於校準的同一批視野。')
para('measurement','We therefore added a post-hoc','We assessed threshold sensitivity by leaving out each blank field in turn: calibrate with two fields and evaluate the third. All three splits are reported.','我們依序保留一個空白視野，用另外兩個視野校準，再評估保留視野，以檢查閾值敏感度；三種分法皆完整呈現。')
para('measurement','The asymmetry identifies field','The asymmetry identifies field 1 as influential in calibration.','結果的不對稱顯示視野 1 對校準具有較大影響。')
para('measurement','These diagnostics assume independent objects','The nominal object-level tests assume independence. Discussion addresses clustering, shared preparation and threshold-estimation uncertainty.','名義上的物件層級檢定假設觀察值獨立；Discussion 說明群聚、共用製備及閾值估計的不確定性。')
newp('measurement',md,'Objects in one field share exposure, density and preparation; fields from one culture are not independent biological replicates. The fitted blank and field-holdout results describe within-batch threshold behavior, not independent-day specificity. Fisher tests and Wilson intervals therefore quantify nominal object-level contrasts and counting uncertainty, without accounting for clustering, segmentation error or threshold estimation. A separately prepared blank is needed to assess specificity.','同一視野的物件共享曝光、密度與製備條件，同一培養的多個視野並非獨立生物重複。空白擬合與保留視野分析描述批次內的閾值行為，而非跨日特異性。Fisher 檢定與 Wilson 區間因此僅量化名義上的物件對比及計數不確定性，未納入群聚、分割誤差或閾值估計；特異性評估需要另行製備的空白。')
para('measurement','The analyzed material is one transfection batch.','The image set represents one transfection batch without a live/dead stain. Additional fields improve spatial coverage but do not establish viability, whole-culture transfection efficiency, reproducibility or receptor function.','影像集來自一批轉染，未包含活死染色。增加視野可提升空間涵蓋率，但不能建立存活率、整體培養轉染效率、再現性或受體功能。')
for prefix in ['The supplied image set has no independent','The selected-object fraction does not estimate']:
    remove('measurement',next(p for p in md.find_all('p') if text(p).startswith(prefix)),'Consolidated into the single-batch scope paragraph.')
para('measurement','Test 1 adds acquired baseline','Test 1 extends the analysis to baseline, buffer and VUAA1 time courses. <a href="experiments.html#calcium-imaging">Experiments</a> separates acquired methods from the proposed time-course specification.','Test 1 將分析延伸至基準、緩衝液及 VUAA1 時間軌跡。Experiments 區分已執行的方法與規劃中的時間序列規格。')
for p in m.select('article p'):
    if text(p)=='Inspect the disagreement plot · .':
        edit('measurement',p,'<a href="results.html#control-comparison">Inspect the disagreement plot</a>.','檢視兩種指標的差異圖。')
    elif text(p).endswith('Executed method ·'):
        last=p.contents[-1]
        if isinstance(last,NavigableString):last.replace_with(str(last).rstrip(' ·'))
replace_text('measurement','P2: original','Test 1: original')

# Design: scope belongs in Discussion; Data availability is a resource index.
d=docs['design'];dd=d.select_one('#design-discussion')
newp('design',dd,'The sequence-check record is distinct from raw Sanger chromatograms, localization measurements and replicated VOC-response data. The available evidence does not include those validation layers. Schematics explain the architecture and are not sequence or structural measurements.','序列檢查紀錄與原始 Sanger 色譜、定位量測及具重複的 VOC 反應資料屬不同驗證層次；現有證據尚未包含這些層次。示意圖用於解釋架構，不是序列或結構量測。')
para('design','The cassette feature record','The <a href="#design-feature-catalog">cassette feature record</a> and <a href="#design-or-catalog">receptor notes</a> accompany the interactive diagrams. <a href="parts.html">Parts</a> indexes components and Registry records; <a href="experiments.html">Experiments</a> documents methods; <a href="engineering.html#stream-wetlab">Engineering</a> records design iterations. Biological images and analysis files are indexed in <a href="results.html#data-availability">Results · Data availability</a>.','表達盒元件紀錄與受體說明補充互動圖。Parts 索引元件與 Registry 紀錄，Experiments 記錄方法，Engineering 記錄設計迭代；生物影像與分析檔案集中於 Results 的資料取得區。')

# Contribution resources remain findable through one download destination.
c=docs['contribution'];da=c.select_one('#contribution-data-availability')
move('contribution',next(p for p in c.select('#released-contribution p') if text(p).startswith('The control-comparison files')),da)
for a in list(da.select('a[href="#contribution-data-availability"]')):
    remove('contribution',a,'Duplicate self-link; canonical resource links already in the same section.')
for div in c.select('.audit-resource-links'):
    for a in list(div.select('a[href="#contribution-data-availability"]')):
        remove('contribution',a,'Opening-section download buttons consolidated in Data availability.')
    for v in list(div.contents):
        if isinstance(v,NavigableString) and str(v).strip()=='·':v.extract()
remove('contribution',next(p for p in c.select('#one-sentence p') if text(p).startswith('Each AeroSense layer')),'Duplicate conclusion merged into the preceding paragraph.')
for p in da.find_all('p'):
    if text(p).startswith('The control-comparison files'):
        para('contribution','The control-comparison files','The control-comparison package contains aggregate inputs, executable analysis, source hashes and output tables. The protocol record distinguishes executed procedures from assay specifications.','控制比較資料包包含彙整輸入、可執行分析、來源雜湊值與輸出表格；流程紀錄區分已執行的程序與測試規格。')

# Parts uses the same test labels as Results; source names and URLs remain intact.
replace_text('parts','exploratory P2 measurements','the two exploratory odor tests')
replace_text('parts','P2 well summary','Test 1 well summary')
replace_text('parts','P2 control contrasts','Test 1 control contrasts')

# Validate against the original pre-edit snapshot; never alter scientific assets.
after={n:snapshot(s) for n,s in docs.items()}
for n in PAGES:
    for f in ['media','table_text_hashes','scripts','figures']:
        assert initial[n][f]==after[n][f],(n,f)
    assert not set(initial[n]['all_ids'])-set(after[n]['all_ids']),(n,'lost IDs')
for n in PAGES:
    (ROOT/(n+'.html')).write_text(str(docs[n]),encoding='utf-8')
    path=ROOT/'locales/extras/zh-Hant'/f'{n}.json'
    content=json.loads(path.read_text(encoding='utf-8'));content.update(zh[n]);path.write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(base/'editorial-after.json').write_text(json.dumps(after,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(base/'editorial-changes.json').write_text(json.dumps(prior+changes,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'extra_changes':len(changes),'by_page':dict(collections.Counter(x['page'] for x in changes))},indent=2))
