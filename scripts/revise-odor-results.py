"""Integrate the confirmed F0-change analysis into the existing odor figures."""
from pathlib import Path
from bs4 import BeautifulSoup, Comment
import csv, json, re

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
p = SITE / 'results.html'
s = BeautifulSoup(p.read_text(encoding='utf-8'), 'html.parser')
lp = SITE / 'locales/extras/zh-Hant/results.json'
tr = json.loads(lp.read_text(encoding='utf-8'))
def t(en, zh):
    tr[en] = zh
    return en
def para(en, zh): return '<p>'+t(en,zh)+'</p>'
def replace(id, html):
    s.find(id=id).replace_with(BeautifulSoup(html,'html.parser'))
def fig(id,n,files,caption,zh):
    labels = {'integrated-vuaa1-traces':'VUAA1 and control time courses in the earlier and current assays',
      'integrated-condition-comparison':'All twelve cell conditions in the earlier and current assays',
      'integrated-correction-components':'Fluorescence changes before and after disturbance subtraction',
      'integrated-response-map':'Corrected response maps from both odor assays',
      'integrated-control-contrasts':'Vehicle and untransfected control contrasts from both assays'}
    images=''.join(f'<a href="fig/odor-2026-10-21/{f}.svg"><img src="fig/odor-2026-10-21/{f}.svg" alt="{labels[f]}" loading="lazy" decoding="async"/></a>' for f in files)
    return f'<figure class="wiki-figure final-assay-figure final-assay-figure--integrated" id="{id}" data-static-figure-number="{n}"><p class="final-assay-pan-hint">Scroll across to read the chart, or open the full-size figure.</p>{images}<figcaption><strong class="media-caption__label">Figure {n}. </strong>{t(caption,zh)}</figcaption></figure>'

pilot = '<section class="section-block final-assay" data-reveal="" id="kinetic-pilot"><span class="anchor-alias" id="odor-screen-20261021"></span><p class="final-assay-kicker">05 · Odor testing</p><h2 class="reading-heading--chapter">Odor testing</h2>'
pilot += para('We followed fluorescence over time in ten OR + ORCO conditions, ORCO-only cells and untransfected cells. Figures 11–14 place the current assay beside the earlier assay, following the same sequence: time courses, condition comparison, disturbance subtraction and control-referenced response maps.', '我們追蹤十組 OR + ORCO、僅含 ORCO 與未轉染細胞的螢光時間變化。圖 11–14 將本次與先前測試並列，依序呈現時間曲線、條件比較、擾動扣除及參照對照組的反應圖。')
pilot += para('The current assay contains 72 wells and 1,440 readings. Rows A, D, E, F, G and H contain VUAA1, isopentyl acetate, 2-heptanone, valeric acid, pentyl acetate and DMSO control, respectively. VUAA1 was diluted 1:100; the odor solutions were diluted 1:1,000, with 0.1% DMSO reported. Stock concentrations were not supplied. Each construct × stimulus has one well; repeated time points are not independent biological replicates.', '本次測試包含 72 孔及 1,440 筆讀值。A、D、E、F、G、H 列依序為 VUAA1、乙酸異戊酯、2-庚酮、戊酸、乙酸戊酯及 DMSO 對照。VUAA1 稀釋 100 倍，氣味溶液稀釋 1,000 倍，回報 DMSO 為 0.1%；未提供原液濃度。每個構築體 × 刺激條件只有一孔，重複時間點並非獨立生物重複。')
pilot += '<p>'+t('VUAA1 is an established Orco agonist used in heterologous receptor assays. Here we report VUAA1-associated fluorescence; these measurements alone do not identify its mechanism.', 'VUAA1 是異源受體測試中使用的已知 Orco 致效劑。此處報告與 VUAA1 相關的螢光變化，單憑這些量測無法確定其機制。')+' <a class="cite" href="#p2-ref-jones" id="cite-p2-jones" aria-label="Reference 2">[2]</a> <a class="cite" href="#p2-ref-zboray" id="cite-p2-zboray" aria-label="Reference 3">[3]</a></p>'
pilot += fig('fig-p2-traces',11,['integrated-vuaa1-traces'],
 'VUAA1 and control time courses. Upper panels retain the earlier assay, normalized to each well’s paired baseline. Lower panels add the current assay: each F0 and F1 trace is normalized to its own first reading. Dashed F0 traces span 0–48 s; solid F1 traces span 0–168 s. Acquisition clocks start separately, and addition-to-read delays are unknown. Each curve represents one well. The panels use different vertical scales.',
 'VUAA1 與對照的時間曲線。上排保留先前測試，以各孔配對基線正規化；下排加入本次測試，F0 與 F1 各自對其第一筆讀值正規化。虛線 F0 為 0–48 秒，實線 F1 為 0–168 秒。兩段擷取各自計時，加樣至讀取的延遲未知。每條曲線代表一孔；各圖的縱軸範圍不同。')
pilot += para('In the current VUAA1 wells, F1 ends above its first reading in 10 of 12 conditions. Or35a + ORCO rises by 34.09%, Or85b + ORCO by 16.44%, Or98a + ORCO by 26.78%, and ORCO only by 17.56%. Or7a + ORCO and untransfected cells end lower. Subtracting the F0 change gives a positive corrected value in 11 of 12 conditions; this does not mean that every F1 trace rises.', '本次 VUAA1 的 12 組中有 10 組 F1 終點高於起點。Or35a + ORCO 上升 34.09%、Or85b + ORCO 上升 16.44%、Or98a + ORCO 上升 26.78%，僅含 ORCO 上升 17.56%；Or7a + ORCO 與未轉染細胞的終點較低。扣除 F0 變化後，12 組中有 11 組校正值為正，但這不代表每條 F1 曲線都上升。')
pilot += '<p class="final-assay-links"><a href="experiments.html#exp-p2-kinetics">Executed method and analysis definitions →</a><a href="#results-odor21-source-files">Data and analysis files →</a></p></section>'
replace('kinetic-pilot',pilot)

controls='<section class="section-block final-assay" data-reveal="" id="kinetic-controls"><h3 class="reading-heading--topic">'+t('Separating fluorescence changes from disturbance','區分螢光變化與擾動')+'</h3>'
controls+=para('For the current assay, we calculate the endpoint change within each acquisition and subtract the F0 change from the F1 change. S is expressed in percentage points (pp). For Or35a + ORCO with VUAA1, +34.09% − (−2.57%) gives +36.67 pp. ORCO only gives +18.69 pp, while untransfected cells give −0.11 pp.', '本次測試先計算每段擷取內的起終點變化，再以 F1 變化扣除 F0 變化；S 的單位為百分點（pp）。Or35a + ORCO 的 VUAA1 結果為 +34.09% −（−2.57%）= +36.67 pp。僅含 ORCO 為 +18.69 pp，未轉染細胞為 −0.11 pp。')
controls+='<p class="assay-formula"><code>ΔF1 = 100 × (F1last / F1first − 1)</code><br/><code>ΔF0 = 100 × (F0last / F0first − 1)</code><br/><code>S = ΔF1 − ΔF0</code></p>'
controls+=fig('fig-p2-condition-comparison',12,['integrated-condition-comparison'],
 'All twelve conditions. Left: the earlier assay’s peak test excursion relative to its paired baseline (%), with VUAA1 and separate buffer-only wells. Right: the current assay’s F0-subtracted endpoint change S (pp), with VUAA1 and separate DMSO-control wells. Receptors are aligned by name. The two panels use different, explicitly defined summaries and are not pooled as replicates.',
 '全部十二組條件。左：先前測試相對配對基線的峰值變化（%），比較 VUAA1 與獨立的緩衝液對照孔。右：本次測試扣除 F0 後的起終點變化 S（pp），比較 VUAA1 與獨立的 DMSO 對照孔。兩側按受體名稱對齊，但摘要算法不同，不合併視為重複。')
controls+=fig('fig-p2-correction',13,['integrated-correction-components'],
 'Before and after disturbance subtraction. Upper panels retain six selected cases from the earlier assay: peak test excursion minus the preceding buffer excursion, each using its own five-reading baseline. Lower panels add the corresponding current conditions: F1 endpoint change minus F0 endpoint change, each relative to its own first reading. Left axes show percent change; right axes show percentage-point differences. The subtracted component is printed beside each condition.',
 '扣除擾動前後的比較。上排保留先前測試的六組案例：峰值測試變化扣除前一段緩衝液變化，兩段各使用自己的五筆基線平均。下排加入本次對應條件：F1 起終點變化扣除 F0 起終點變化，兩段各相對自己的第一筆讀值。左側為百分比變化，右側為百分點差值；各條件旁標示被扣除的項目。')
controls+=para('The current subtraction compares a 168 s F1 window with a 48 s F0 window. It is a descriptive disturbance correction, not a fitted bleaching correction. A matched 0–48 s calculation is included in the numerical audit: the eleven receptor-containing VUAA1 conditions remain positive, while the untransfected value is −7.83 pp. The shorter window preserves the direction but changes the magnitude.', '本次扣除比較 168 秒的 F1 與 48 秒的 F0，屬描述性的擾動校正，並非擬合漂白校正。數值稽核另提供配對 0–48 秒計算：十一組含受體的 VUAA1 條件仍為正，未轉染組為 −7.83 pp。較短視窗保留方向，但會改變幅度。')
controls+=para('Control behavior remains important. In the earlier assay, the Or35a + ORCO buffer-only well had a 35.25% excursion. In the current assay, all twelve DMSO-control S values lie between −1.79 and −0.31 pp. Or7a + ORCO has a small positive S of +0.40 pp even though its F1 signal falls by 1.47%, because F0 falls further. These examples show why both subtraction components accompany the corrected values.', '對照行為仍是判讀重點。先前測試的 Or35a + ORCO 緩衝液對照孔有 35.25% 的變化；本次十二組 DMSO 對照的 S 均介於 −1.79 至 −0.31 pp。Or7a + ORCO 的 F1 雖下降 1.47%，但因 F0 下降更多，S 仍為微幅正值 +0.40 pp。這些例子說明校正值必須連同兩個扣除項目呈現。')
controls+='<p class="supplementary-data__link"><a href="#results-supplement-odor21">'+t('Current assay: all 72 corrected values →','本次測試：全部 72 個校正值 →')+'</a></p></section>'
replace('kinetic-controls',controls)

maps='<section class="section-block final-assay" data-reveal="" id="kinetic-map"><h3 class="reading-heading--topic">Responses relative to buffer and untransfected controls</h3>'
maps+=para('Figure 14 adds the current six-stimulus screen to the original response maps. Current VUAA1 S values range from −0.11 to +39.23 pp. Valeric acid spans −0.77 to +8.17 pp; the other three odor rows range from −2.06 to +1.36 pp. We show vehicle subtraction and the untransfected adjustment separately so that control-dependent changes remain visible.', '圖 14 在原有反應圖加入本次六種刺激。VUAA1 的 S 介於 −0.11 至 +39.23 pp；戊酸介於 −0.77 至 +8.17 pp；其餘三種氣味介於 −2.06 至 +1.36 pp。溶劑扣除與未轉染校正分開呈現，讓對照造成的變化保持可見。')
maps+=fig('fig-p2-map',14,['integrated-response-map','integrated-control-contrasts'],
 'Response maps and control contrasts. Both assays use the same receptor order and a −60 to +60 pp color scale. The first maps show the earlier buffer-corrected excursion and the current F0-subtracted change S. The following maps show each assay after subtracting its own buffer or DMSO-control well, then after subtracting the corresponding untransfected contrast. The earlier isopentyl-acetate row remains excluded for reported gain mismatch; its ethyl-propionate row is omitted. Current rows contain all six supplied stimuli. Control rows or columns that become zero by subtraction may be omitted. Each cell is one well, not a replicated estimate.',
 '反應圖與對照差值。兩次測試採相同受體順序及 −60 至 +60 pp 色階。第一組圖為先前扣除緩衝液變化的結果，以及本次扣除 F0 的 S；後續圖先扣除各自的緩衝液或 DMSO 對照孔，再扣除對應的未轉染差值。先前乙酸異戊酯因回報增益不一致而排除，乙酸乙酯以外的 ethyl propionate 列未顯示。本次完整呈現六種刺激。扣除後必為零的對照列或欄可能省略。每格為單一孔，並非重複實驗估計。')
# Use the correct chemical name in the translation.
tr[next(k for k in tr if k.startswith('Response maps and control contrasts.'))]=tr[next(k for k in tr if k.startswith('Response maps and control contrasts.'))].replace('乙酸乙酯以外的 ethyl propionate','丙酸乙酯')
maps+=para('These are differences between separate control wells, expressed in percentage points. They describe the observed fluorescence pattern without establishing receptor specificity. The current DMSO control strengthens the comparison, but unknown acquisition gain and one well per condition still limit interpretation.', '這些數值是獨立對照孔間的差值，以百分點表示，用於描述觀察到的螢光模式，尚無法確立受體專一性。本次 DMSO 對照使比較更完整，但未知的擷取增益與每條件僅一孔仍限制判讀。')
maps+='<details class="p2-comparison-method"><summary>Calculation and interpretation</summary><p><code>B(s,c) = S(s,c) − S(DMSO,c)</code><br/><code>C(s,c) = B(s,c) − B(s,no transfect)</code></p>'+para('For the earlier assay, the same between-well operations use its buffer-corrected excursion and buffer-only row. The earlier four-acquisition protocol and the current two-acquisition protocol have different within-well definitions; their magnitudes are not interchangeable. The original earlier numerical tables are retained in the audit.', '先前測試以其扣除緩衝液後的變化及緩衝液對照列進行相同孔間運算。先前四段擷取與本次兩段擷取的孔內定義不同，幅度不可互換；先前原始數值表保留於稽核資料。')+'</details></section>'
replace('kinetic-map',maps)

# Remove the redundant dated section and its navigation entries, preserving its anchor above.
for e in list(s.select('section#odor-screen-20261021')): e.decompose()
for a in list(s.select('a[href="#odor-screen-20261021"]')):
    if a.parent.name=='li': a.parent.decompose()

rows=list(csv.DictReader((ROOT/'zenodo-release/aerosense-wiki/data/odor-2026-10-21/derived/change-summary.csv').open(encoding='utf-8-sig')))
def table(field,title,zh):
    header=['VUAA1','Isopentyl acetate','2-Heptanone','Valeric acid','Pentyl acetate','DMSO control']
    body=''
    for pos in range(1,13):
        rr=[r for r in rows if int(r['position'])==pos]
        body+='<tr><th scope="row">'+rr[0]['construct']+'</th>'+''.join(f'<td>{float(r[field]):+.2f}</td>' for r in rr)+'</tr>'
    return '<div class="table-scroll" role="region" tabindex="0" aria-label="'+title+'"><table class="goal-table"><caption>'+t(title,zh)+'</caption><thead><tr><th scope="col">Construct</th>'+''.join('<th scope="col">'+h+'</th>' for h in header)+'</tr></thead><tbody>'+body+'</tbody></table></div>'
supp='<details class="supplementary-data__group odor-screen" id="results-supplement-odor21"><summary>'+t('Current odor assay: all 72 corrected values','本次氣味測試：全部 72 個校正值')+'</summary><div class="supplementary-data__body">'
supp+=para('Each table follows the current plate order. S uses F1 0–168 s minus F0 0–48 s. S48 uses both acquisitions over 0–48 s. Values are percentage points; one well contributes to each condition. Negative values and all controls are retained.', '各表依本次孔盤順序排列。S 使用 F1 的 0–168 秒變化扣除 F0 的 0–48 秒變化；S48 兩段均使用 0–48 秒。單位為百分點，每條件只有一孔；保留負值與所有對照。')
for field,en,zh in [('change_contrast_pp','F0-subtracted change S (pp)','扣除 F0 變化的 S（pp）'),('vehicle_contrast_pp','DMSO-subtracted change (pp)','扣除 DMSO 的差值（pp）'),('double_difference_pp','DMSO and untransfected double difference (pp)','DMSO 與未轉染雙重差值（pp）'),('matched48_change_contrast_pp','Matched 0–48 s change S48 (pp)','配對 0–48 秒的 S48（pp）')]: supp+=table(field,en,zh)
supp+='</div></details>'
replace('results-supplement-odor21',supp)

abstract=s.select_one('#abstract p:nth-of-type(2)')
abstract.clear(); abstract.append(t('Three light-sheet recordings show regional signals during odor delivery. Colony plates and DNA gels document construct preparation; microscopy fields and two kinetic odor assays show reporter-associated fluorescence alongside their controls.', '三段光片影像呈現氣味輸送時的區域訊號。菌落培養皿與 DNA 膠體記錄構築準備；顯微視野與兩次氣味動態測試呈現報導螢光及其對照。'))
limit=s.select_one('#limitations > p'); limit.clear(); limit.append(t('The current VUAA1 time courses show within-acquisition rises in most receptor conditions. After subtracting each well’s F0 change, eleven conditions are positive and the untransfected value is close to zero. The earlier assay and current assay use different control designs and calculations, so they provide separate observations rather than interchangeable estimates.', '本次 VUAA1 時間曲線在多數受體條件中於擷取期間上升。扣除各孔 F0 變化後，十一組為正，未轉染組接近零。先前與本次測試的對照設計及算法不同，因此屬於獨立觀察，不可視為可互換的估計。'))
cp=s.select('#conclusion > p')[1]; cp.clear(); cp.append(t('The odor assays provide time-resolved evidence of VUAA1-associated fluorescence. In the current assay, F0-subtracted VUAA1 changes are +36.67 pp for Or35a + ORCO, +17.52 pp for Or85b + ORCO, +29.46 pp for Or98a + ORCO, and +18.69 pp for ORCO only, compared with −0.11 pp in untransfected cells. The control maps and retained raw records make these observations inspectable; independent replication is still needed to assess reproducibility and receptor specificity.', '氣味測試提供與 VUAA1 相關的時間解析螢光證據。本次扣除 F0 後，Or35a + ORCO 為 +36.67 pp、Or85b + ORCO 為 +17.52 pp、Or98a + ORCO 為 +29.46 pp，僅含 ORCO 為 +18.69 pp，未轉染細胞為 −0.11 pp。對照圖與完整原始紀錄讓結果可供查核；重現性與受體專一性仍需要獨立重複測試。'))
replace('results-odor21-source-files','<div class="final-assay-downloads" id="results-odor21-source-files"><h3 class="reading-heading--topic">'+t('Current odor-assay archive','本次氣味測試資料包')+'</h3>'+para('The current batch is prepared locally for the next research-data update; its inclusion in the linked public Zenodo record has not yet been confirmed. The package contains twelve unchanged XLSX exports, checksums, 1,440 observations with source-cell references, 72 corrected summaries, matched-window sensitivity values and reproducible analysis scripts. The earlier mean-ratio calculation is retained only as a secondary audit metric. All corrected values are available in the supplementary tables.', '本次資料已在本機整理，供下一次研究資料更新使用；尚未確認收錄於所連結的公開 Zenodo 紀錄。資料包包含十二份未修改的 XLSX、校驗碼、附來源儲存格的 1,440 筆觀察、72 組校正摘要、配對視窗敏感度數值及可重現分析程式。先前的整段平均比值僅保留作次要稽核指標。全部校正值可於補充表格查閱。')+'</div>')

# Update displayed old batch labels without changing provenance IDs/URLs.
changed={}
for node in list(s.find_all(string=True)):
    if isinstance(node,Comment) or node.parent.name in ['script','style']: continue
    old=str(node); new=re.sub(r'\bP2\b','earlier assay',old)
    new=new.replace('Figure 18','Figure 15').replace('Figure 19','Figure 16')
    if new!=old:
        node.replace_with(new)
        if old.strip() in tr: tr[new.strip()]=tr[old.strip()].replace('P2','先前測試')
for e in s.find_all(attrs={'alt':True}): e['alt']=re.sub(r'\bP2\b','earlier assay',e['alt'])
for id,n in [('figure-measure-disagreement',15),('fig-p2-raw-controls',16)]:
    e=s.find(id=id)
    if e:e['data-static-figure-number']=str(n)
tr['05 · Odor testing']='05 · 氣味測試'
tr['Construct']='構築體'
p.write_text(str(s),encoding='utf-8')
lp.write_text(json.dumps(tr,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Integrated four existing figures; replaced current tables; updated bilingual prose.')
