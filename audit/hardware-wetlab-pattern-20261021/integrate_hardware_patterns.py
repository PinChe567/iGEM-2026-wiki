"""Apply the reviewed, narrow Hardware page addition once; no global rebuild."""
from pathlib import Path
import csv,json,re

SITE=Path(__file__).resolve().parents[2]
DATA=SITE.parent/'zenodo-release/aerosense-wiki/data/hardware-wetlab-pattern-comparison-2026-10-21'
PATH=SITE/'hardware.html'
text=PATH.read_text(encoding='utf-8')
assert 'id="reader-wetlab-pattern-comparison"' not in text
prefix='resources/hardware-wetlab-pattern-2026-10-21/'
translations={}
def tr(en,zh):translations[en]=zh;return en
heading=tr('Comparison with wet-lab kinetics','與濕實驗動態曲線比較')
intro=tr('We compared the VUAA1 trajectories with the corresponding Test 2 wells, using each acquisition’s first reading as its own reference. D2 shows the clearest shared rise, while D1 changes in the opposite direction.', '我們以各次量測的第一筆讀值為各自基準，比較 VUAA1 動態與 Test 2 的對應孔位。D2 呈現最清楚的共同上升趨勢，D1 則朝相反方向變化。')
cap1=tr('Ten hardware points (0–54 s) and six Test 2 points (0–60 s) are shown as F/Fstart on nominal sampling times. Pearson r and Spearman ρ use only the five native points at 0, 12, 24, 36 and 48 s.', '圖中以名義取樣時間呈現十個硬體讀值（0–54 秒）與六個 Test 2 讀值（0–60 秒）的 F/Fstart。Pearson r 與 Spearman ρ 僅使用 0、12、24、36、48 秒的五個原生讀值。')
alt1=tr('Four matched hardware and wet-lab VUAA1 time courses, each normalized to its own first reading, with five-point Pearson and Spearman correlations.', '四組對應的硬體與濕實驗 VUAA1 動態曲線，各自除以首筆讀值，並標示五點 Pearson 與 Spearman 相關係數。')
stats=tr('For D1–D4, the matched Pearson correlations are −0.942, +0.972, +0.756 and +0.948; Spearman correlations are −0.70, +0.90, +0.40 and +0.90. The corresponding first-difference correlations are −0.886, +0.650, +0.079 and −0.125, showing less shared step-to-step variation for D3 and D4 than their level correlations suggest.', 'D1–D4 對應配對的 Pearson 相關係數為 −0.942、+0.972、+0.756、+0.948；Spearman 相關係數為 −0.70、+0.90、+0.40、+0.90。相鄰差分的相關係數則為 −0.886、+0.650、+0.079、−0.125，顯示 D3 與 D4 逐步變化的相似程度低於訊號值相關所呈現的程度。')
cap2=tr('All 16 hardware–wet-lab pairings are shown; outlined cells identify the intended construct matches. Levels use five nominal time points and first differences use four intervals, which are serial observations rather than biological replicates.', '圖中呈現全部 16 組硬體與濕實驗配對，框線標示預定的相同構築配對。訊號值使用五個名義時間點，差分使用四個區間；這些是序列觀測，並非生物重複。')
alt2=tr('Two four-by-four Pearson correlation maps compare signal levels and first differences, with intended construct matches outlined.', '兩張四乘四 Pearson 相關矩陣分別比較訊號值與相鄰差分，框線標示相同構築的配對。')
def figure(number,id,stem,alt,caption,width,height):
 return f'''<figure class="hw-v2-fig hw-cell-figure" data-static-figure-number="{number}" id="{id}"><a href="{prefix}figures/{stem}.svg" target="_blank" rel="noopener"><picture><source media="(max-width: 640px)" srcset="{prefix}figures/{stem}-mobile.svg"><img src="{prefix}figures/{stem}.svg" alt="{alt}" width="{width}" height="{height}" loading="lazy" decoding="async"></picture></a><figcaption><strong class="media-caption__label">Figure {number}. </strong>{caption}</figcaption></figure>'''
addition=f'<div class="hw-topic-block" id="reader-wetlab-pattern-comparison"><h3 class="reading-heading--topic">{heading}</h3><p>{intro}</p>'+figure(19,'reader-wetlab-matched-curves','matched-curves',alt1,cap1,1200,800)+f'<p>{stats}</p>'+figure(20,'reader-wetlab-pairwise-correlations','pairwise-correlations',alt2,cap2,1200,560)+'</div>'
start=text.index('id="reader-integrated-demo"');end=text.index('</section>',start);text=text[:end]+addition+text[end:]
discussion1=tr('The correlations are not specific to the intended pairings. D2 correlates with its matched Or85b trace at r = 0.9719, but also with Or35a at r = 0.9671, a difference of only 0.00476; D3 and D4 correlate more strongly with the Or35a trace than with their matched constructs. Similar recovery can therefore reflect shared handling or acquisition effects.', '這些相關性並不專屬於預定配對。D2 與對應 Or85b 曲線的 r = 0.9719，但與 Or35a 也達 r = 0.9671，僅相差 0.00476；D3 與 D4 和 Or35a 的相關性都高於各自的對應構築。相似的恢復趨勢因此也可能反映共同的操作或量測效應。')
discussion2=tr('The first-point and timing checks distinguish these patterns. Removing the first shared point lowers D3’s r from 0.756 to 0.114. D2 remains positively correlated after omitting the first point (r = 0.970) and on the original device clock (r = 0.981). The nominal comparison does not establish synchronized response kinetics.', '首點與時間檢查可區分這些趨勢。移除第一個共同時間點後，D3 的 r 從 0.756 降至 0.114。D2 在移除首點後（r = 0.970）與採用原始裝置時鐘時（r = 0.981）仍呈正相關。名義時間比較無法證明兩平台反應動態已同步。')
discussion3=tr('Subtracting each platform’s own-start control curve gives matched r values of −0.903, +0.975, +0.798 and +0.966. This sensitivity preserves D2’s shared rise, but the hardware medium series precedes addition and the wet-lab DMSO measurements come from separate wells. Serial time points and interpolated values do not supply independent biological replication or significance tests.', '扣除各平台控制組的首點正規化曲線後，對應配對 r 為 −0.903、+0.975、+0.798、+0.966。這項敏感性分析保留了 D2 的共同上升趨勢，但硬體 medium 序列是在加液前取得，濕實驗 DMSO 則來自不同孔位。序列時間點與內插值無法提供獨立生物重複或顯著性檢定。')
start=text.index('id="hardware-discussion"');end=text.index('</section>',start);text=text[:end]+''.join(f'<p>{p}</p>' for p in [discussion1,discussion2,discussion3])+text[end:]
suppheading=tr('Cross-platform timing sensitivity','跨平台時間敏感性分析')
suppintro=tr('Pearson r is shown for four matched pairs. Native-point and control-adjusted comparisons use five native nominal points; first-point omission uses four points, and the original-device-clock comparison interpolates hardware to six wet-lab times from 0 to 60 s.', '表中呈現四組對應配對的 Pearson r。原生時間點及控制扣除比較使用五個原生名義時間點；移除首點後為四點，原始裝置時鐘比較則將硬體內插至 0–60 秒的六個濕實驗時間點。')
headings=[tr('Channel and construct','通道與構築'),tr('Native nominal points','原生名義時間點'),tr('First point omitted','移除首點'),tr('Original device clock','原始裝置時鐘'),tr('Control-adjusted','控制扣除')]
rows=list(csv.DictReader((DATA/'matched-correlations.csv').open(encoding='utf-8')))
scenarios=['nominal_native5_selected','nominal_native4_omit19','actual_clock_native6_original19','control_adjusted_native5_selected']
body=''
for i,label in enumerate(['Or35a + ORCO','Or85b + ORCO','Or98a + ORCO','ORCO only'],1):
 values=[float(next(r['pearson_level'] for r in rows if r['scenario']==s and r['channel']==f'D{i}')) for s in scenarios]
 body+=f'<tr><th scope="row">D{i} · {label}</th>'+''.join(f'<td>{v:+.3f}</td>' for v in values)+'</tr>'
supp=f'<details class="hw-v2-disclose" id="reader-crossplatform-sensitivity"><summary>{suppheading}</summary><div class="hw-v2-disclose__body"><p>{suppintro}</p><div class="table-scroll" role="region" tabindex="0" aria-label="{suppheading}"><table class="hw-v2-table"><caption>Pearson r</caption><thead><tr>'+''.join(f'<th scope="col">{h}</th>' for h in headings)+'</tr></thead><tbody>'+body+'</tbody></table></div></div></details>'
start=text.index('id="hardware-supplementary"');insert=text.index('</h2>',start)+len('</h2>');text=text[:insert]+supp+text[insert:]
daheading=tr('Hardware and wet-lab curve comparison','硬體與濕實驗曲線比較')
links=[('input-observations.csv',tr('Source observations · CSV','來源觀測值 · CSV')),('aligned-timepoints.csv',tr('Comparison time points · CSV','比較時間點 · CSV')),('matched-correlations.csv',tr('Matched pairs and all sensitivities · CSV','對應配對與全部敏感性分析 · CSV')),('all-pair-correlations.csv',tr('All 4 × 4 pairings · CSV','全部 4 × 4 配對 · CSV')),('specificity-summary.csv',tr('Matched and off-diagonal comparisons · CSV','對應與非對應配對比較 · CSV')),('descriptive-linear-trends.csv',tr('Descriptive linear trends · CSV','描述性線性趨勢 · CSV')),('analysis-summary.json',tr('Definitions, timing and provenance · JSON','定義、時間與來源 · JSON'))]
code_label=tr('Reproducible analysis and verification source · GitLab','可重現分析與驗證原始碼 · GitLab')
da=f'<div id="hardware-crossplatform-data"><h3>{daheading}</h3><ul>'+''.join(f'<li><a href="{prefix}{name}">{label}</a></li>' for name,label in links)+f'<li><a href="https://gitlab.igem.org/2026/software/nthu/aerosense/-/tree/main/code/aerosense/hardware/07_validation/hardware-wetlab-pattern-comparison">{code_label}</a></li></ul></div>'
start=text.index('id="hardware-data-availability"');end=text.index('<details',start);text=text[:end]+da+text[end:]
for id,old,new in [('figure-12',19,21),('figure-13',20,22)]:
 pattern=rf'<figure\b[^>]*\bid="{id}"[^>]*>.*?</figure>'
 match=re.search(pattern,text,re.S);assert match
 segment=match.group().replace(f'Figure {old}.',f'Figure {new}.')
 segment=segment.replace(f'data-static-figure-number="{old}"',f'data-static-figure-number="{new}"')
 text=text[:match.start()]+segment+text[match.end():]
PATH.write_text(text,encoding='utf-8',newline='')
locale=SITE/'locales/extras/zh-Hant/hardware.json';catalog=json.loads(locale.read_text(encoding='utf-8'));catalog.update(translations)
locale.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
receipt={'page':'hardware.html','new_figure_ids':['reader-wetlab-matched-curves','reader-wetlab-pairwise-correlations'],'new_figure_numbers':[19,20],'existing_CAD_caption_numbers_changed':{'figure-12':21,'figure-13':22},'canonical_prefix':prefix,'canonical_data':DATA.as_posix(),'translations_added':len(translations),'global_css_changed':False,'placeholder_links_require_verified_CDN_mapping':True}
(Path(__file__).parent/'hardware-integration-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt,ensure_ascii=False,indent=2))
