"""Apply the requested Results layout and exploratory VUAA1 reference view."""
from pathlib import Path
from bs4 import BeautifulSoup
import json, re

SITE = Path(__file__).resolve().parents[2]
p = SITE / 'results.html'
html = p.read_text(encoding='utf-8')
translations = {}

def prose(en, zh):
    translations[en] = zh
    return en

old = 'We followed fluorescence over time in ten OR + ORCO conditions, ORCO-only cells and untransfected cells. Figures 11–14 present Test 1 and Test 2 through their time courses, condition comparisons, corrected signals and control-referenced response maps.'
new = prose('We followed fluorescence over time in ten OR + ORCO conditions, ORCO-only cells and untransfected cells. Figures 11–14 show Test 1 and Test 2 time courses, condition comparisons, control-referenced maps and the Test 2 VUAA1-referenced map.', '我們追蹤十種 OR + ORCO、僅 ORCO 及未轉染細胞的螢光時間變化。圖 11–14 呈現 Test 1 與 Test 2 的時間曲線、條件比較、對照參照圖，以及 Test 2 的 VUAA1 參照圖。')
html = html.replace(old, new)
html = html.replace('in the earlier and current assays', 'in Test 1 and Test 2')
html, removed = re.subn(r'<figure\b[^>]*id="fig-p2-correction"[^>]*>.*?</figure>', '', html, flags=re.S)
assert removed == 1 or 'id="fig-p2-correction"' not in html
old = 'Figure 12 compares all twelve cell conditions. Figure 13 focuses on selected VUAA1 and control wells, making it easier to see whether a positive corrected signal also occurs in the controls. In Test 2, corrected changes are +36.67 pp for Or35a + ORCO, +18.69 pp for ORCO only and −0.11 pp for untransfected cells.'
new = prose('Figure 12 compares all twelve cell conditions. In Test 2, corrected changes are +36.67 pp for Or35a + ORCO, +18.69 pp for ORCO only and −0.11 pp for untransfected cells.', '圖 12 比較全部十二種細胞條件。在 Test 2 中，Or35a + ORCO、僅 ORCO 及未轉染細胞的校正後變化分別為 +36.67、+18.69 及 −0.11 個百分點。')
html = html.replace(old, new)
match = re.search(r'<section\b[^>]*id="kinetic-map"[^>]*>.*?</section>', html, re.S)
assert match
section = BeautifulSoup(match.group(), 'html.parser')
fig = section.select_one('#fig-p2-map')
fig['data-static-figure-number'] = '13'
fig.select_one('.media-caption__label').string = 'Figure 13. '
intro = section.select_one('p')
intro.string = prose('Figure 13 adds the six-stimulus Test 2 screen to the original response maps. Test 2 corrected VUAA1 values range from −0.11 to +39.23 pp. Valeric acid spans −0.77 to +8.17 pp; the other three odor rows range from −2.06 to +1.36 pp. We show vehicle subtraction and the untransfected adjustment separately so that control-dependent changes remain visible.', '圖 13 在原有反應圖中加入 Test 2 的六種刺激條件。Test 2 校正後的 VUAA1 值介於 −0.11 至 +39.23 個百分點；戊酸介於 −0.77 至 +8.17 個百分點，其餘三種氣味介於 −2.06 至 +1.36 個百分點。我們分別呈現溶劑扣除及未轉染細胞調整，讓對照造成的差異清楚可見。')
cap = prose('Response maps with two heatmaps per row, receptors in rows and stimuli in columns, on a shared −60 to +60 pp scale. The first ten receptor labels denote OR + ORCO; hatched Test 1 isopentyl-acetate cells remain excluded, and separate-well control subtraction does not establish receptor specificity.', '每排並列兩張反應熱圖，列為受體、欄為刺激條件，使用共同的 −60 至 +60 個百分點色階。前十個受體標籤皆代表 OR + ORCO；Test 1 的醋酸異戊酯斜線格仍排除分析，不同孔的對照扣除無法單獨確立受體專一性。')
# Use the standard Chinese name without an explanatory detour.
translations[cap] = '每排並列兩張反應熱圖，列為受體、欄為刺激條件，使用共同的 −60 至 +60 個百分點色階。前十個受體標籤皆代表 OR + ORCO；Test 1 的醋酸異戊酯斜線格仍排除分析，不同孔的對照扣除無法單獨確立受體專一性。'
fig.select_one('figcaption').clear()
fig.select_one('figcaption').append(BeautifulSoup('<strong class="media-caption__label">Figure 13. </strong>', 'html.parser'))
fig.select_one('figcaption').append(cap)

title = prose('Responses relative to each construct’s VUAA1 reference', '相對於各構築體 VUAA1 參照的反應')
intro2 = prose('Figure 14 compares each Test 2 odor response with the VUAA1 reference for the same construct, after subtracting its DMSO control. Construct-specific VUAA1 referencing has been used in heterologous receptor assays.', '圖 14 將 Test 2 每種氣味反應扣除其 DMSO 對照後，與同一構築體的 VUAA1 參照比較。異源受體分析已有使用各構築體 VUAA1 作為參照的先例。')
cap2 = prose('Test 2 VUAA1-referenced responses, with DMSO set to 0 and VUAA1 to 1 for each construct; the first ten receptor labels denote OR + ORCO. Negative values retain their sign and a separate color; †Or7a has a small VUAA1 reference (2.19 pp), making its ratios particularly sensitive to that reference.', 'Test 2 的 VUAA1 參照反應：各構築體的 DMSO 設為 0、VUAA1 設為 1；前十個受體標籤皆代表 OR + ORCO。負值保留正負號並使用不同顏色；†Or7a 的 VUAA1 參照較小（2.19 個百分點），其比值因此特別受參照值影響。')
interpret = prose('This map shows response relative to each construct’s reference, not measured transfection efficiency or absolute sensing strength. Each stimulus and reference comes from a separate single well. Or7a’s near-one valeric-acid ratio therefore does not identify it as the strongest responder; the corrected values in Figure 13 preserve the corrected-change magnitudes.', '此圖呈現各構築體相對於自身參照的反應，並非量測到的轉染效率或絕對感測強度。每個刺激與參照皆來自不同的單一孔。因此，Or7a 對戊酸接近 1 的比值不代表它的反應最強；圖 13 的校正值保留校正後變化幅度的比較。')
linklabel = prose('Normalization definition and complete ratios →', '標準化定義與完整比值 →')
addition = f'''<div id="vuaa1-referenced-response"><h3 class="reading-heading--topic">{title}</h3><p>{intro2} <a class="cite" href="#p2-ref-zboray" id="cite-vuaa1-reference-zboray" aria-label="Reference 3">[3]</a></p><figure class="wiki-figure final-assay-figure final-assay-figure--integrated final-assay-figure--reference" id="fig-vuaa1-reference" data-static-figure-number="14"><a href="fig/odor-2026-10-21/test2-vuaa1-referenced-map.svg"><img src="fig/odor-2026-10-21/test2-vuaa1-referenced-map.svg" alt="Test 2 odor responses normalized to the DMSO-subtracted VUAA1 response of each construct" loading="lazy" decoding="async"/></a><figcaption><strong class="media-caption__label">Figure 14. </strong>{cap2}</figcaption></figure><p>{interpret}</p><p class="supplementary-data__link"><a href="#vuaa1-reference-method">{linklabel}</a></p></div>'''
existing = section.select_one('#vuaa1-referenced-response')
if existing:
    existing.decompose()
section.section.append(BeautifulSoup(addition, 'html.parser'))
html = html[:match.start()] + str(section) + html[match.end():]

methodtitle = prose('VUAA1-reference normalization', 'VUAA1 參照標準化')
method1 = prose('For Test 2, S is the F0-subtracted change defined above. For each construct c and stimulus s, N(s,c) = [S(s,c) − S(DMSO,c)] / [S(VUAA1,c) − S(DMSO,c)]. This sets the measured DMSO and VUAA1 reference wells to 0 and 1; it does not impose a biological response bound. Negative ratios and ratios above 1 remain valid numerical outcomes and are not clipped.', 'Test 2 的 S 為上述扣除 F0 後的變化。對每個構築體 c 與刺激 s，N(s,c) = [S(s,c) − S(DMSO,c)] / [S(VUAA1,c) − S(DMSO,c)]。此計算將量測到的 DMSO 與 VUAA1 參照孔設為 0 與 1，並未設定生物反應的上下限。負值及大於 1 的比值皆保留，不會裁切。')
method2 = prose('All eleven Test 2 receptor-containing denominators are positive (2.19–39.54 pp). Seven of the 44 odor ratios are negative, and none exceeds 1. Or7a’s denominator is only 2.19 pp, compared with at least 9.43 pp for the other constructs; its valeric-acid ratio of 0.972 comes from a 2.13 pp vehicle-subtracted response. Untransfected cells are omitted because they are not a receptor-containing positive-reference condition.', 'Test 2 十一種含受體條件的分母皆為正（2.19–39.54 個百分點）。44 個氣味比值中有 7 個為負，沒有大於 1 的值。Or7a 的分母僅 2.19 個百分點，其餘構築體至少為 9.43 個百分點；其戊酸比值 0.972 來自扣除溶劑後 2.13 個百分點的反應。未轉染細胞不屬於含受體的陽性參照條件，因此未納入此圖。')
method3 = prose('Test 1 is not shown in this normalized map: eight of its eleven buffer-referenced VUAA1 denominators are nonpositive, and its buffer row is not a matched DMSO vehicle. Direct and control-referenced ratios for both tests are retained in the research audit. These single-well ratios cannot remove well-to-well transfection differences or supply uncertainty estimates.', '此標準化圖未納入 Test 1：十一個扣除 buffer 的 VUAA1 分母中有八個非正值，且其 buffer 列並非相匹配的 DMSO 溶劑對照。兩次測試的直接比值及對照參照比值皆保留於研究稽核資料。這些單孔比值無法消除孔間轉染差異，也無法提供不確定性估計。')
method = f'<div id="vuaa1-reference-method"><h3 class="reading-heading--topic">{methodtitle}</h3><p>{method1}</p><p>{method2}</p><p>{method3}</p><div id="vuaa1-reference-table"></div></div>'
if 'id="vuaa1-reference-method"' not in html:
    html = html.replace('<div id="odor-processing-details">', method + '<div id="odor-processing-details">')
p.write_text(html, encoding='utf-8')
lp = SITE/'locales/extras/zh-Hant/results.json'
data = json.loads(lp.read_text(encoding='utf-8'))
data.update(translations)
lp.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'figure_removed': removed, 'new_figure': 'fig-vuaa1-reference', 'translations':len(translations)}))
