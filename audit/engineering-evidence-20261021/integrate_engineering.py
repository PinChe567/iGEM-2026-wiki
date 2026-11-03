from pathlib import Path
import json
root=Path.cwd();page=root/'aerosense-wiki/engineering.html';s=page.read_text(encoding='utf-8')
assert 'engineering-power-control' not in s
prefix='resources/engineering-source-evidence-2026-10-21/'
translations={}
def T(en,zh):translations[en]=zh;return en
def fig(ident,num,name,caption,zh,alt,mobile=None,width=1300,height=1120):
    T(caption,zh);url=prefix+'figures/'+name
    image=f'<img src="{url}" alt="{alt}" width="{width}" height="{height}" loading="lazy" decoding="async" style="display:block;width:100%;height:auto;max-height:none;object-fit:contain"/>'
    if mobile:image=f'<picture><source media="(max-width: 600px)" srcset="{prefix}figures/{mobile}"/>{image}</picture>'
    return f'<figure class="eng-cycle__figure" id="{ident}" data-static-figure-number="{num}"><a href="{url}" target="_blank" rel="noopener noreferrer">{image}</a><figcaption><strong class="media-caption__label">Figure {num}. </strong>{caption}</figcaption></figure>'
power=fig('engineering-power-control',5,'power-control.svg','The reviewed power design moved the user switch from the 5 V output path to the TPS61023 enable logic. Battery undervoltage control and the switch jointly drive EN; this redraw isolates that design change.','審查後的供電設計將使用者開關由 5 V 輸出路徑移至 TPS61023 啟用邏輯。電池欠壓控制與開關共同控制 EN；此重繪圖只呈現這項設計變更。','Initial output switch and revised AND-gate enable control for TPS61023',width=625,height=665)
old='<p>The simplified board set the enclosure constraints. Component and power details: <a href="hardware.html">Hardware</a>.</p>'
new='<p>'+T('The correspondence made the power requirements concrete: USB-C charging and power-path management, a single cell, a 5 V boost rail and an ESP32 programming interface. A follow-up review moved the ON/OFF function into the boost enable logic.','往來紀錄將供電需求具體化：USB-C 充電與電源路徑管理、單顆電池、5 V 升壓電源，以及 ESP32 燒錄介面。後續審查將 ON/OFF 功能移至升壓晶片的啟用邏輯。')+'</p>'+power+old
assert old in s;s=s.replace(old,new,1)
# Existing architecture figure retains its identity and media, with the next reading-order number.
s=s.replace('data-static-figure-number="5" id="fig-e-h3"','data-static-figure-number="6" id="fig-e-h3"')
i=s.index('id="fig-e-h3"');j=s.index('</figure>',i);fragment=s[i:j].replace('Figure 5. ','Figure 6. ');s=s[:i]+fragment+s[j:]
cad=fig('engineering-historical-cad',7,'historical-cad.webp','Historical STL geometry: body, service tray, hinged lid and one of four wells. Each part is independently framed; dimensions are bounding extents in the CAD workflow’s millimetre convention. These views do not reconstruct assembly alignment.','歷史 STL 幾何：主體、維修托盤、鉸接上蓋，以及四個樣本槽之一。各零件獨立取景；尺寸為依既有 CAD 毫米慣例計算的外框範圍。這些視圖不推定組裝對位。','Exact historical STL views of the body, service tray, hinged lid and sample well',mobile='historical-cad-mobile.webp')
cap=fig('engineering-cap-iteration',8,'cap-iteration.webp','The optional two-piece cap exposes the internal geometry for cleaning and curing. It replaces the one-piece cap with an upper and lower print; the source specifies longer thumbscrews and an additional silicone ring.','選配的雙件上蓋讓內部幾何可接近，以便清潔與固化。上、下兩件列印件取代原本的一體式上蓋；來源另指定較長的手轉螺絲與額外矽膠環。','Exact original one-piece cap and alternative lower and upper STL pieces',mobile='cap-iteration-mobile.webp',width=1950,height=560)
needle='<p>Parameter sweeps, outputs and manuals accompany the build sources.'
assert needle in s
addition='<p>'+T('Before the current enclosure, the archive retained a larger integrated body, a removable service tray and a hinged lid. Reviewing the actual meshes makes the mechanical iteration visible without treating the historical dimensions as the current specification.','在目前外殼之前，封存資料保留了較大的整合主體、可拆維修托盤及鉸接上蓋。檢視實際網格可呈現機構迭代，同時區分歷史尺寸與現行規格。')+'</p>'+cad+cap
s=s.replace(needle,addition+needle,1)
diag=fig('engineering-tia-diagnostic',9,'tia-diagnostic.svg','The partner’s follow-up reports persistent saturation after changing feedback resistance from 100 MΩ to 10 kΩ, followed by an observed short from the TIA inverting input to ground. The record ends with the cause still under investigation.','合作夥伴的後續紀錄指出，回授電阻由 100 MΩ 改為 10 kΩ 後仍持續飽和，隨後量得 TIA 反相輸入對地短路。該紀錄結束時仍在調查原因。','Reported gain reduction, observed input-to-ground short, and unresolved diagnostic status',mobile='tia-diagnostic-mobile.svg',width=1180,height=430)
changes={
'Adjusting photodiode amplifier gain':T('Investigating a fixed amplifier output','調查放大器固定輸出的原因'),
'Bench tests completed; lower-gain retest defined':T('Lower-gain retest reported; input-node fault unresolved','已回報降低增益後的重測；輸入節點故障尚未解決'),
'Board diagnosis informs the next gain test':T('A lower-gain retest redirects the board diagnosis','降低增益後的重測改變了電路診斷方向'),
'We plan to test lower feedback resistance values under controlled illumination. For each value, we will repeat the dark, covered-detector and illuminated-detector tests.':T('The follow-up changed the next step from gain selection to locating the reported input-to-ground short. After resolving that connection, the same dark, covered-detector and illuminated-detector checks should be repeated.','後續紀錄使下一步由選擇增益轉為找出所回報的輸入對地短路。解決該連接問題後，應重複相同的暗場、遮蔽偵測器與照明偵測器檢查。'),
'The diagnostic record ended with resistor replacement and verification tests proposed for the next iteration.':T('The supplied record does not document a completed repair or a successful post-repair optical test.','提供的紀錄未記載完成修復或修復後成功的光學測試。')}
for old,new in changes.items():assert old in s;s=s.replace(old,new)
needle='<p>The gain explanation remains unconfirmed because photodiode current was not measured.'
assert needle in s
added='<p>'+T('iST subsequently reported replacing the TIA feedback resistance from 100 MΩ to 10 kΩ without eliminating output saturation. They then observed that the inverting input was shorted to ground and were still investigating the cause.','iST 隨後回報將 TIA 回授電阻由 100 MΩ 改為 10 kΩ，仍未消除輸出飽和。接著量得反相輸入對地短路，當時仍在調查原因。')+'</p>'+diag
s=s.replace(needle,added+needle,1)
needle='<p>The DRC report names final.kicad_pcb;'
extra='<p>'+T('The correspondence records design requests and partner observations, not a measured improvement in noise, standby current or repaired-board performance. The historical split-cap option also lacks seal and biocompatibility validation. The unresolved short cannot be assigned a confirmed root cause from the supplied update.','往來紀錄呈現設計需求及合作夥伴的觀察，並非雜訊、待機電流或修復後電路效能的改善量測。歷史雙件上蓋選項也尚未驗證密封與生物相容性。提供的更新不足以確認短路的根本原因。')+'</p>'
assert needle in s;s=s.replace(needle,extra+needle,1)
needle='<h3>Financial planning workbook</h3>'
da='<h3>'+T('Technical engineering evidence','技術工程證據')+'</h3><p>'+T('The public guide brings together the reviewed power change, historical CAD geometry and unresolved TIA diagnostic. Original correspondence remains private; the technical summary omits contact and invoice details.','公開指南整合經審查的供電變更、歷史 CAD 幾何與尚未解決的 TIA 診斷。原始往來郵件保持私人保存；技術摘要不包含聯絡與發票資訊。')+'</p><p><a href="'+prefix+'engineering-evidence-guide.pdf" target="_blank" rel="noopener noreferrer">'+T('Illustrated engineering evidence guide · PDF','工程證據圖解指南 · PDF')+'</a></p>'
assert needle in s;s=s.replace(needle,da+needle,1)
page.write_text(s,encoding='utf-8')
locale=root/'aerosense-wiki/locales/extras/zh-Hant/engineering.json';data=json.loads(locale.read_text(encoding='utf-8'));data.update(translations);locale.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(Path(__file__).parent/'integration-receipt.json').write_text(json.dumps({'figures_added':4,'existing_figure_retained_and_renumbered':'fig-e-h3: 5 to 6','locale_entries':len(translations),'placeholder_prefix':prefix,'touched':['engineering.html','locales/extras/zh-Hant/engineering.json']},indent=2),encoding='utf-8')
print('Engineering figures and evidence integrated; locale entries',len(translations))
