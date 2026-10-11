"""Build bilingual analysis text directly from saved numerical results."""
from pathlib import Path
import json,re,numpy as np
P=Path(__file__).resolve().parent;R=P/'results'
s=json.loads((R/'summary.json').read_text());m=json.loads((R/'maps_summary.json').read_text());r={x['case']:x for x in s['cases']};b=r['ideal_NE'];g=b['green_nW'];se=b['green_SE_nW']
standard=json.loads((R/'volume_standard_summary.json').read_text());standard_matrix='\n'.join('| '+q+' | '+' | '.join(f'{v*100:.1f}%' for v in row)+' |' for q,row in zip(['NE','NW','SW','SE'],standard['row_normalized']))
unresolved=max(v['green']['power_nW']*v['green']['ledger']['unfinished']/max(v['green']['ledger']['detected'],1e-300) for name in r for v in json.loads((R/(name+'.json')).read_text())['runs'])
removed_share=r['sleeves_removed']['well_0_nW']/r['sleeves_removed']['green_nW']*100
scatter_share=r['liquid_scatter_1']['well_0_nW']/r['liquid_scatter_1']['green_nW']*100
matrix='\n'.join('| '+q+' | '+' | '.join(f'{v:.4f}' for v in row)+' |' for q,row in zip(['NE','NW','SW','SE'],s['LED_by_well_nW']))
ang=json.loads((R/'ideal_NE.json').read_text());a45=np.mean([x['green']['angular_power_nW']['45'] for x in ang['runs']]);a65=np.mean([x['green']['angular_power_nW']['65'] for x in ang['runs']]);mod=2*np.sin(np.pi*.25)/np.pi;example=g*.6*.1*mod*1000
zh=f'''# 光學路徑與頻率解讀分析

## 決策結論

新黑色套筒有可收集的光路，可以進入無細胞光學原型驗證；它尚未證明四井完全隔離、照明均勻或細胞反應訊號足夠。四井依 LED 中心定位，不把 PD 封裝中心誤當感光中心。本次計算使用 PD 感光中心偏移 (0, −0.4) mm；方向仍須廠商確認貼裝旋轉與底視鏡像。

套筒的四周與中央隔牆均為理想不透光黑色材料，中央最薄隔牆 1.2 mm。只有底部 Z=42.5–44.2 mm 留出光路。相較完全包住光路，這保留 LED 到細胞及細胞到 PD 的通道，但底部仍是共享空間，不能宣稱零串擾。實際黑樹脂能否在這個厚度遮住 470／520 nm，仍須空井點燈確認。

採取的方向：保留新黑套筒、平底井與 PD 密封圈；優先確認濾光與裝配重現性。不要為增加收光而拆掉密封圈，也不要把增加散射／反射造成的總光變強直接當作設計改善。

## 模型幾何與物理假設

| 項目 | 使用值／意義 |
|---|---|
| LED 中心 | (±3.3, ±5.7) mm；朝中央 Y 方向的侧發光源 |
| 發光面 | 1.0×0.3 mm，中心 Z=40.2 mm，Lambertian；封裝透鏡未建模 |
| 井中心 | (±3.3, ±2.65) mm，沿 LED 定位 |
| 井外形／內腔 | 5×3.8 mm／4×2.8 mm，外底 Z42.5、內底 Z43、頂 Z55.5 mm |
| 液量 | 每井 100 µL，水平液面 Z51.93 mm；50／125 µL 為敏感度案例 |
| 黑套筒 | 外包絡 20×18 mm，四個 5.3×4.1 mm 孔，從 Z44.2 到55.5 mm |
| 四井壓板 | 20×18 mm、Z56.1–57.3，四個4×2.8 mm孔；下方55.5–56.1為四孔密封片 |
| 共用氣蓋 | 周邊密封圈57.3–57.9，內開口14.8×12；蓋外18.4×15.6、下緣57.9、內頂62.5、外頂64 mm |
| 進氣導流平台 | X−7.4..−0.2、Y±4、Z58.2..59.4 mm，已列入黑色材料邊界 |
| PD | Z40.5 mm 頂面；3×2.5 mm 的 7.5 mm² 等面積感光矩形代理，不是真實晶粒輪廓 |
| PD 密封圈 | 外 4×4、內 3×3.4 mm，壓縮後 Z40.5–41.1 mm |
| 濾片 | 5.2×4.2×1 mm，Z41.1–42.1；均勻吸收式光譜代理 |
| 折射率 | 空氣1.0、液體1.333、透明材料1.5；保留 Fresnel 反射與全反射 |
| 理想透明材料 | 吸收=0、散射=0；不把紫色樹脂問題混入本次主案例 |
| 細胞層 | 底部20 µm，激發吸收係數0.5/mm；不是已測得的HEK293T參數 |
| 代表波長 | 激發470 nm、放射520 nm；不是完整GCaMP6f光譜積分 |
| LED功率／量子效率 | 點亮期間500 µW、QY=1為上限條件；不是購買LED的已量功率 |

GCaMP 的鈣反應改變螢光包絡，不代表細胞要跟著每秒41–113次做鈣反應。快速LED調變與較慢生物反應是兩個不同時間尺度。GCaMP6原始研究不能直接提供本專案的表現量、細胞密度、氣味反應幅度或光毒性門檻。[Chen et al., Nature 2013](https://www.nature.com/articles/nature12354)

Z39.6 的 PCB 表面作為下方離開／損失邊界，未計算基板反射回來的光。黑壁反射率掃描作用於模型中的黑色外殼與元件；不等於已量測 PCB 阻焊、金屬焊點與 LED 封裝的反射特性。因此實機空白漏光測試仍不可省略。

這是矩形材料邊界追蹤，並非把 STL 的每個三角形完整放進光學軟體。主要井及上緣凸邊、套筒及凸邊座孔、四井壓板、進氣平台、PD、濾片與鄰近元件包絡有建模；濾片支臂 X−8.35..−3.05／Y±0.3／Z40.9..42.1、立柱 X−9.5..−7.5／Y±1／Z40.9..50.9，以及 C21 底部避空亦納入。遠端外殼與結構橫樑使用矩形代理，圓角與接孔當成不透光邊界。細小倒角、光學透鏡、粗糙表面與氣管口外部漏光未完整建模。模型的黑外邊界不能用來宣稱成品已完全遮光。

## 真正重跑的數值工作

主掃描為24組×3種子；每次24,000激發封包＋60,000放射封包，共 **{s['total_primary_packets']:,}** 個封包。吸收事件依權重選取螢光來源，再以各向同性放射追蹤到PD。功率換算為 P_LED × 吸收分率 × QY × 470/520 × 收光分率。這使用能量與光子數的正確波長比，不把每一顆LED光子都當成可被細胞吸收。

另外重跑井底照度 {m['excitation_packets']:,} 個激發封包、224個收光來源點×{m['packets_per_point']:,} 封包，以及PD到達角度樣本。收光圖是「某位置各向同性放射的功率有多少抵达PD」，没有各自正規化成100%。保存逐點SE與95% Wilson区间；中位相對SE為 **{m.get('median_eta_relative_SE',float('nan'))*100:.1f}%**，{m.get('zero_hit_pixels',0)}格無命中。零命中不能解讀為真實效率完全是零。

主掃描每個誤差棒為3種子的 **1 SE**，不是95%信賴區間，也不包括幾何、材料及生物參數的不確定性。三種子樣本很少，不應用小幅排序差異宣布最佳解。

解析立體角、Fresnel正常入射4%反射、全反射、HG平均散射角與隨機10,000點材料分類均通過。最大能量帳誤差 {s['max_energy_error']:.2g}。主掃描2500事件上限的最大片段未結束權重為 {s['max_unfinished_fraction']*100:.4f}%；對單次綠光而言保守未完成上限最高約{unresolved:.3f} nW，與隨機誤差不同。额外三組更高封包數比較2500／10000事件上限，結果另存event_limit_convergence.json。這個檢查針對NE基準，不是所有參數都已完全收斂的證明。

## 收光強度與照明均勻性

NE LED 的理想接收綠光為 **{g:.3f} ± {se:.3f} nW**；NW、SW、SE分別為 {r['ideal_NW']['green_nW']:.3f}、{r['ideal_SW']['green_nW']:.3f}、{r['ideal_SE']['green_nW']:.3f} nW。這些是LED點亮期間的功率。25%占空比的平均值約乘0.25；正弦鎖相解調的基本頻率振幅約乘 2sin(π×0.25)/π = 0.450。不能把點亮功率直接當成鎖相振幅。

NE井底上行照度平均 **{m['floor_mean_uW_mm2'][0]:.3f} µW/mm²**，格點變異係數 **{m['floor_CV'][0]*100:.1f}%**。這是穿過內底平面向上進入細胞層的輻照度，不是所有方向的總fluence，也不包括細胞分布差異。**平底不等於均勻照明**：斜側光、元件陰影與全反射仍造成強弱不均。

把PD偏移方向反轉，NE收光變為 {r['PD_reversed']['green_nW']:.3f} nW；設於封裝中心為 {r['PD_centered']['green_nW']:.3f} nW。拆除密封圈變為 {r['seal_removed']['green_nW']:.3f} nW，但代價是取消遮光／密封邊界，因此不是建議配置。這些差異顯示感光中心與密封圈不能靠目測假定。

NE接收綠光中，僅 **{a45/g*100:.1f}%** 在法線±45°內，**{a65/g*100:.1f}%** 在±65°內。這是人工截角診斷，不是真實PD的完整角度響應。VEMD5060X01資料表的±65°是半靈敏度角，不是硬截止角；模型未據此額外乘一次cosθ，因為有限面積命中的投影效果已在幾何裡。實際封裝角度響應、濾片斜入射通帶位移與側漏仍未量測。[Vishay資料表](https://www.vishay.com/docs/84278/vemd5060x01.pdf)

## 四井串擾與反射

| 點亮LED／螢光來源井 | NE | NW | SW | SE |
|---|---:|---:|---:|---:|
{matrix}

表中單位nW；每列是點亮一顆LED後，收到的螢光由哪個井產生。目標井比例 **{min(s['intended_well_fraction'])*100:.1f}–{max(s['intended_well_fraction'])*100:.1f}%**；約{(1-max(s['intended_well_fraction']))*100:.1f}–{(1-min(s['intended_well_fraction']))*100:.1f}%來自其他井。有限抽樣出現0不能當成零串擾。矩陣條件數 **{s['condition_number']:.2f}** 代表在這組理想假設下有機會做數學分離，但真實矩陣必須用單井螢光標準逐井量測；不同液量、細胞量與拆裝會改變它。

理想NE收到的綠光有約 **{b['fraction_with_Fresnel_reflection']*100:.1f}%** 在「螢光放射之後」曾經歷至少一次Fresnel反射。這不全是干擾：本井放射後反射進PD仍可能是有效訊號；別井螢光和藍光背景才須另行分辨。數值沒有把激發前半段的反射歷史加到放射後半段上。

黑壁反射率0.02／0.10時NE綠光為 {r['black_R02']['green_nW']:.3f}／{r['black_R10']['green_nW']:.3f} nW；液體散射0.1／1.0每mm時為 {r['liquid_scatter_0p1']['green_nW']:.3f}／{r['liquid_scatter_1']['green_nW']:.3f} nW。這是敏感度測試，不是建議故意做混濁或反光的井。增加功率不保證保留各井獨立性。

液體散射1/mm時目標井占比為{scatter_share:.1f}%。另一方面，移除上半部黑套後，NE目標井占比{removed_share:.2f}%，保留套筒為{s['intended_well_fraction'][0]*100:.2f}%；應連同有限抽樣誤差解讀，**不能宣稱套筒已消除共享底部的串擾**。套筒提供結構定位與外壁遮光，其真實遮光效能須額外以空井外照檢查。

## 濾光與DLIA的硬限制

不拒斥激發光時，藍光約 **{r['no_filter_rejection']['blue_nW']:.1f} nW**，為該案例綠光的 {r['no_filter_rejection']['blue_nW']/r['no_filter_rejection']['green_nW']:.0f} 倍。OD3／OD4／OD5吸收式代理下的藍光分別約 **{r['filter_OD3']['blue_nW']:.5f}／{r['filter_OD4']['blue_nW']:.5f}／{r['filter_OD5']['blue_nW']:.5f} nW**。這些OD是模型正常穿透值，斜射在本吸收式模型走更長路徑；不能套用為真實干涉濾片的斜射規格。

模型使用 y(t)=Σ[g_j(c)+b_j]u_j(t)+n(t)。g_j是细胞螢光增益，b_j是與第j顆LED同步的漏光背景。反射主要改變光路與權重，**不會自動把41Hz變成別的頻率**；因此锁相會一起收到同頻背景。它可減少不相關頻率的干擾，不能保證消除反射藍光。

頻率展示以4kHz取樣2秒、25%占空比、41／67／89／113Hz，四個綠光增益取自實際MC。為說明背景，將NE的OD3藍光值套用到四路，這個背景配置是合成示例，不是四路藍光的獨立預測；另加入每樣本5pW的任意白雜訊。硬體映射採D1=GPIO25=41Hz、D2=26=67Hz、D3=27=89Hz、D4=32=113Hz。實體方位暫採D1SW、D2SE、D3NE、D4NW，底視鏡像仍待實板確認。

20秒影片顯示0.2秒LED時間，相當100倍慢放。移動光點只是已取樣MC路徑的示意播放，並不是把真實飛行時間數值畫成毫秒。為方便看見 PD 收光，畫面優先顯示幾條實際抽樣中命中 PD 的路徑；路徑密度不是收光機率。NE路徑鏡射到其他井只是可視化；PD偏移使真實四路不完全對稱，數字仍以四路各自MC為準。20mm光路、n1.5的飛行時間約0.10ns；10ns螢光壽命示例在113Hz只有約0.000407°相位差。影片沒有模擬鈣反應、生長、ADC飽和、TIA頻率響應或實際韌體時間抖動。

## 光強到底夠不夠

目前能回答「存在非零收光」；不能回答「已經足夠辨識氣味」。真正關鍵是刺激後ΔF和量測雜訊，而不是總綠光。`conditional_photon_budget.csv`掃描LED點亮功率0.05–2mW、QY0.1–1、ΔF/F1–50%，包含25%調變基本頻率因子。

例如500µW LED、QY0.6、ΔF/F10%，其預測鎖相振幅變化約 **{example:.2f} pW**；若選擇SNR≥5為工程目標，重複量測得到的鎖相振幅RMS雜訊須低於 **{example/5:.2f} pW等效入射功率**。這不是單一ADC樣本的雜訊門檻。沒有實測PD響應度、增益、濾光、基線漂移與GCaMP表現量，就不能把它換成可信的檢測極限。

## 兩週內最小驗證

1. **暗與空井背景**：相同設定下各收10個2秒區塊。先確認沒有飽和／時序錯誤；觀察四路鎖相背景與標準差。
2. **一井標準、四路讀取**：其他井放相同空白液；逐井放入同一螢光標準，每次量四LED，即得到該標準品的實測4×4串擾矩陣。比較正規化比例，不先硬比nW絕對值。保留空白扣除前後的I/Q。均勻溶液請對照下方體積來源模型，不要套用到底部細胞層解混。
3. **拆裝三次**：相同標準濃度、液量、設定下，取下再裝回三次。將各次均值及CV記錄下來。可先以CV≤10%、標準訊號相對空白雜訊SNR≥5作內部目標；這是預設通過條件，尚未達成，也不是官方iGEM或臨床標準。

若空井同步背景很大，先處理濾片／遮光與漏光；不要用normalize把故障隱藏。若重裝差异大，先修配合與密封受力。只有通過這些低成本測試，再用細胞確認生物反應。想驗證照明圖可額外拍攝平面螢光標準的空間分布，但在時間不足時，優先完成上述三項。

## 給標準液實驗的對照模型

均勻螢光溶液會在整個液體體積發光，不能和只有20µm厚底層的細胞模型混為一談。因此額外跑四LED×三種子的弱吸收體積標準（100µL、激發吸收係數0.001/mm，另1,008,000封包）。同一LED列中，各井來源占例如下：

| 點亮LED／標準品所在井 | NE | NW | SW | SE |
|---|---:|---:|---:|---:|
{standard_matrix}

這提供最簡單的標準液功能驗證對照；不需新增另一套實驗。實際染料濃度、光譜、量子效率和LED功率未知時先比較方向與正規化比例，不要求絕對功率一致。若要用矩陣真正解出底層細胞井訊號，仍需底層螢光標準或細胞條件的獨立校正。不要把溶液矩陣直接當成細胞矩陣。

## 圖片與可用圖說

| 圖 | 圖說 |
|---|---|
| 01_parameter_sweep.png | 理想透明材料的24條件掃描；LED-on綠光功率，3種子平均±1SE；不是生物實測。 |
| 02_floor_maps.png | 上排NE LED造成的四井底上行照度；下排每個底部來源位置的各向同性PD收光效率。共享色階、無各圖最大值正規化。 |
| 03_well_transfer.png | LED×螢光來源井矩陣；展示底部共享光路的殘留串擾。 |
| 04_detector_angles.png | 對接收光人工加入角度截止的敏感度；不是PD真實半靈敏度曲線。 |
| 05_frequency_recovery.png | 由MC增益合成的四頻訊號與頻譜；同步漏光會保留在同一頻率。 |
| 06_conditional_budget.png | 固定吸收與QY0.6下，SNR5所需的鎖相振幅雜訊上限。 |
| 07_sample_paths.png | 真正MC取樣光路的剖視示意；顯示數量不是光強比例。 |
| 08_volume_standard_validation.png | 額外體積螢光來源模型，供均勻標準液的單井測試對照；非底層細胞矩陣。 |

所有圖的程式在 `visualize.py`；所有傳播與掃描程式在 `transport.py`、`run.py`。重現方法見 `README_ZH.md`。光學模型與資料屬本專案工程模擬；引用GCaMP／PD來源不代表來源作者認證本設計。
'''
for old,new in {'侧':'側','抵达':'抵達','没有':'沒有','区间':'區間','细胞':'細胞','锁相':'鎖相','差异':'差異'}.items():zh=zh.replace(old,new)
(P/'Analysis_ZH.md').write_text(zh,encoding='utf-8')
en=f'''# Optical-path and frequency analysis

## Design decision

The new opaque carrier has nonzero optical collection and is suitable for a cell-free optical prototype. It has not demonstrated complete well isolation, uniform illumination or sufficient biological detection sensitivity. Wells are registered to the LEDs. The modeled PD-sensitive center is offset (0, −0.4) mm from the package datum; assembly rotation and bottom-view mirroring still require vendor confirmation.

The carrier encloses the clear walls from Z44.2 to55.5 mm, with a minimum central opaque web of1.2 mm. The bottom band Z42.5–44.2 remains open for excitation and collection. That shared band preserves the optical path but also permits cross-well excitation. Actual black resin opacity at470/520nm has not been measured. Retain the carrier, flat-bottom wells and PD seal; test filtering and reseating repeatability before cell work. Do not remove the seal merely because the predicted signal increases.

## Geometry and assumptions

| Item | Model |
|---|---|
| LED centers | (±3.3,±5.7)mm; side emitters facing central Y direction |
| Emitting area | 1.0×0.3mm, Z40.2mm; Lambertian, no package lens |
| Well centers | (±3.3,±2.65)mm |
| Outer/cavity dimensions | 5×3.8mm /4×2.8mm; outer floor42.5, inner floor43, top55.5mm |
| Fill | 100µL per well; flat meniscusZ51.93mm |
| Opaque carrier |20×18mm outside; four5.3×4.1mm clearance pockets |
| Four-well compression plate |20×18mm,Z56.1–57.3,four4×2.8mm holes; four-hole lower gasketZ55.5–56.1 |
| Common cap |Upper perimeter sealZ57.3–57.9,14.8×12mm opening; cap outside18.4×15.6mm,lower57.9,inside roof62.5,outside roof64mm |
| Inlet shelf |X−7.4..−0.2,Y±4,Z58.2..59.4mm, represented as an opaque solid |
| PD | TopZ40.5mm;3×2.5mm equal-area7.5mm² rectangular proxy, not measured die shape |
| PD seal | Outer4×4mm, aperture3×3.4mm, compressedZ40.5–41.1mm |
| Filter | 5.2×4.2×1mm, Z41.1–42.1mm; homogeneous absorptive proxy |
| Refractive indices | Air1.0, liquid1.333, clear material1.5; Fresnel/TIR retained |
| Ideal clear material | Zero parasitic absorption and scattering |
| Cell layer | 20µm at the floor; excitation absorption0.5/mm, assumed |
| Representative wavelengths | Excitation470nm/emission520nm; no spectral integration |
| Reference radiant power | LED-on500µW, QY1 upper-bound scenario; not measured LED output |

GCaMP calcium dynamics change the fluorescence envelope; the cell does not have to perform41–113 calcium responses per second to follow optical excitation modulation. The original GCaMP6 study does not supply this project's expression, cell density, odor response or phototoxicity threshold. [Chen et al., Nature2013](https://www.nature.com/articles/nature12354)

The PCB plane at Z39.6 is a lower escape/loss boundary; substrate back-reflection is not modeled. The black-reflectance sweep applies to the represented enclosure and component solids, not measured solder-mask, metal-pad or LED-package reflectance. The real empty-well leakage test therefore remains essential.

This is rectilinear material-boundary transport, not arbitrary STL triangle tracing. Main wells including top flanges, carrier including flange pockets, compression plate, inlet shelf, PD, filter and nearby component envelopes are represented. The filter arm is X−8.35..−3.05/Y±0.3/Z40.9..42.1; its column is X−9.5..−7.5/Y±1/Z40.9..50.9. The underside relief above C21 is included. Remote enclosure walls and structural bridges use rectangular proxies; rounded corners and external service apertures are treated opaque. Curved lenses, chamfers, roughness and ambient light through external gas ports are not fully represented. A black outer model boundary cannot certify a light-tight product.

## Computation and checks

The primary sweep contains24conditions×3seeds,24,000excitation and60,000emission packets per run: **{s['total_primary_packets']:,} packets**. Cell absorption events seed isotropic fluorescence with appropriate absorption weights. Power conversion is P_LED×absorbed_fraction×QY×470/520×collection_fraction.

Additional maps use {m['excitation_packets']:,} excitation packets and224isotropic source locations×{m['packets_per_point']:,} packets. Collection means the fraction of source power reaching the PD, not peak-normalized brightness. Per-pixel SE and95% Wilson intervals are saved. Median relative SE is **{m.get('median_eta_relative_SE',float('nan'))*100:.1f}%**, with {m.get('zero_hit_pixels',0)} zero-hit pixels. A zero-hit estimate is not proof of zero collection.

Sweep bars are **mean±1SE across three seeds**, not95% confidence intervals, and exclude material/biological/model uncertainty. With only three seeds, small rankings should not be interpreted as optimization proof.

Analytic rectangular solid angle,4% normal-incidence Fresnel reflection, TIR, HG mean cosine and10,000random material-classification points passed. Maximum energy-ledger error was {s['max_energy_error']:.2g}. Primary runs cap transport at2500events; maximum unfinished fraction was {s['max_unfinished_fraction']*100:.4f}%, with a worst conservative unresolved green-power bound of approximately{unresolved:.3f}nW in an individual run. Three additional higher-packet NE comparisons at2500/10000events are saved in event_limit_convergence.json. This check addresses the reference condition, not full convergence for every case.

## Power and uniformity

NE reference green power is **{g:.3f}±{se:.3f}nW**; NW/SW/SE are {r['ideal_NW']['green_nW']:.3f}/{r['ideal_SW']['green_nW']:.3f}/{r['ideal_SE']['green_nW']:.3f}nW. These are LED-on powers. At25% duty, time-average power is0.25times the on-state power and the sinusoidal fundamental amplitude is approximately0.450times it. On-state power must not be substituted directly for lock-in amplitude.

Mean upward NE floor irradiance is **{m['floor_mean_uW_mm2'][0]:.3f}µW/mm²**, with spatial pixelCV **{m['floor_CV'][0]*100:.1f}%**. This is upward crossing flux per floor area, not all-direction fluence. It excludes cellular distribution variation. **A flat floor does not imply uniform illumination.** Side illumination, component shadows and refractive interfaces still create spatial structure.

Reversing PD offset gives {r['PD_reversed']['green_nW']:.3f}nW; centering it gives {r['PD_centered']['green_nW']:.3f}nW. Removing the seal gives {r['seal_removed']['green_nW']:.3f}nW, but sacrifices the light/sealing boundary and is not recommended.

Only **{a45/g*100:.1f}%** of collected reference green power is within45° of the normal and **{a65/g*100:.1f}%** within65°. These are artificial acceptance-cone diagnostics. The VEMD5060X01's±65° specification is a half-sensitivity angle, not a hard cutoff. The model does not multiply an additional cosθ factor because finite-area geometric projection is already included. The actual package response and oblique-incidence filter spectrum remain uncalibrated. [Vishay datasheet](https://www.vishay.com/docs/84278/vemd5060x01.pdf)

## Cross-well transfer and reflection

| ActiveLED /emitting well | NE | NW | SW | SE |
|---|---:|---:|---:|---:|
{matrix}

Units:nW. Each row separates received fluorescence by its well of origin. Intended-well fractions are **{min(s['intended_well_fraction'])*100:.1f}–{max(s['intended_well_fraction'])*100:.1f}%**; approximately{(1-max(s['intended_well_fraction']))*100:.1f}–{(1-min(s['intended_well_fraction']))*100:.1f}%comes from other wells. Finite-sampling zeros do not establish perfect isolation. The simulated matrix condition number is **{s['condition_number']:.2f}**. This suggests possible numerical separation under these assumptions, but the actual4×4matrix must be measured using a single fluorescent standard well at a time. Fill, cell distribution and reseating can change it.

Approximately **{b['fraction_with_Fresnel_reflection']*100:.1f}%** of received NE green power underwent at least one Fresnel reflection **after fluorescence emission**. Reflection is not automatically interference: reflected target-well fluorescence can still be useful signal. This counter does not combine the earlier excitation-path history with the emission history.

Black reflectance0.02/0.10 gives {r['black_R02']['green_nW']:.3f}/{r['black_R10']['green_nW']:.3f}nW; liquid scattering0.1/1.0mm⁻¹ gives {r['liquid_scatter_0p1']['green_nW']:.3f}/{r['liquid_scatter_1']['green_nW']:.3f}nW. These are sensitivity cases, not recommendations to make wells reflective or cloudy. Higher total collection does not establish better channel independence.

At liquid scattering1/mm, the intended-well fraction is{scatter_share:.1f}%. Removing the upper carrier gives an NE intended fraction of{removed_share:.2f}%, versus{s['intended_well_fraction'][0]*100:.2f}%with the carrier. These comparisons must be read with finite-sampling uncertainty. **The sleeve does not eliminate shared-bottom cross-talk.** The carrier provides positioning and external-wall shielding; actual ambient-light rejection needs an empty-well illumination test.

## Filtering and synchronous background

Without excitation rejection, received blue power is **{r['no_filter_rejection']['blue_nW']:.1f}nW**, approximately {r['no_filter_rejection']['blue_nW']/r['no_filter_rejection']['green_nW']:.0f} times that case's green power. Absorptive OD3/4/5proxies give blue powers **{r['filter_OD3']['blue_nW']:.5f}/{r['filter_OD4']['blue_nW']:.5f}/{r['filter_OD5']['blue_nW']:.5f}nW**. Oblique rays travel farther in this absorptive model. These values must not be applied as real interference-filter angular specifications.

The linear signal is y(t)=Σ[g_j(c)+b_j]u_j(t)+n(t). Cell-fluorescence gain g_j and synchronous background b_j both retain their LED's modulation. Reflection changes path/weight; it does not automatically turn41Hz into another frequency. Lock-in extraction suppresses unrelated-frequency noise but cannot guarantee removal of reflected excitation light.

The synthetic example samples4kHz for2s at25%duty and41/67/89/113Hz. Four green gains come from separate MC runs. NE OD3blue leakage is reused for all channels solely to demonstrate synchronous background; it is not a four-channel leakage prediction. Per-sample5pW white noise is arbitrary, not a measured electronic noise model. Firmware mapping is D1=GPIO25=41Hz,D2=26=67Hz,D3=27=89Hz,D4=32=113Hz. Physical quadrants are provisionally D1SW,D2SE,D3NE,D4NW; confirm bottom-view mirroring on hardware.

The20s video displays0.2s modulation time,100×slower. Photon dots traverse actual sampled MC paths schematically, not at a physical flight speed. A few actually detected random paths are deliberately shown first so collection is visible; drawn path density is not detection probability. NE paths are mirrored for visualization; the offset PD means true channels are not symmetric, and powers still use separate MC results. A20mm,n1.5path takes approximately0.10ns; an illustrative10ns lifetime contributes only0.000407°at113Hz. The movie does not simulate calcium response, growth, ADC saturation, TIA response or measured firmware jitter.

## Is the intensity sufficient?

Nonzero collection is established in the model; odor detection is not. The relevant quantity is ΔF relative to measured noise. `conditional_photon_budget.csv` varies LED-on power0.05–2mW,QY0.1–1,andΔF/F1–50%, including the25%duty fundamental factor.

At500µW,QY0.6,andΔF/F10%, predicted lock-in amplitude change is **{example:.2f}pW**. If SNR≥5is chosen as an engineering target, repeated lock-in amplitude RMS noise must be below **{example/5:.2f}pW equivalent input power**. This is not a per-ADC-sample noise limit. Without measured responsivity, gain, filtering, baseline drift and GCaMP expression, it is not a defensible detection limit.

## Minimal two-week validation

1. **Dark and empty-well background:** collect ten2s blocks at identical settings; check saturation/timing errors and each channel's mean/SD.
2. **One standard well, four readouts:** put the same fluorescent standard in one well and matched blank in the others; repeat for all wells to obtain the measured4×4matrix for that standard. Compare normalized ratios before claiming absolute nW agreement. Preserve raw and blank-subtracted I/Q. Uniform liquid standards should be compared with the volume-source model below, not used directly for cell-layer unmixing.
3. **Three reseatings:** repeat removal/reassembly at fixed concentration, volume and settings. Record channel means andCV. CV≤10%and standard-vs-blank SNR≥5can be initial internal targets; they are not achieved results, official iGEM requirements or clinical standards.

Large synchronous blanks require filtering/light-leak correction, not normalization that conceals faults. Poor reseating repeatability requires a mechanical fix. Proceed to cells after these inexpensive checks. A fluorescent flat film image is an optional spatial-uniformity validation, not a required extra experiment under the two-week schedule.

## Forward model for the liquid-standard experiment

A homogeneous fluorescent liquid emits throughout its volume, unlike the20µm floor cell layer. An additional fourLED×three-seed weak-absorption volume model uses100µL and0.001/mm excitation absorption, transporting another1,008,000packets. Row-normalized source-well fractions are:

| ActiveLED /standard well | NE | NW | SW | SE |
|---|---:|---:|---:|---:|
{standard_matrix}

This is a comparison for the same simple standard-liquid test, not an additional required experiment. With unknown dye concentration, spectrum, quantum yield and LED power, compare direction and normalized ratios first, not absolute power. Actual floor-cell unmixing requires a localized bottom standard or independent calibration under cell conditions. Do not substitute a liquid-standard matrix for the cell-layer matrix.

## Figures and reproducibility

| File | Caption |
|---|---|
| 01_parameter_sweep.png |24-condition ideal-material sweep; LED-on green powers,3-seed mean±1SE; not biological measurements. |
| 02_floor_maps.png |Top: upward floor irradiance under NE excitation. Bottom: isotropic source-to-PD efficiency; shared scales, no individual peak normalization. |
| 03_well_transfer.png |LED×emitting-well transfer matrix showing residual shared-bottom cross-talk. |
| 04_detector_angles.png |Artificial angular-acceptance cutoff diagnostic, not the PD's measured angular curve. |
| 05_frequency_recovery.png |MC-gain synthetic time traces/spectrum; synchronous background remains in the corresponding frequency. |
| 06_conditional_budget.png |Maximum lock-in amplitude noise forSNR5at fixed absorption,QY0.6and25%duty. |
| 07_sample_paths.png |Actual sampled paths in an explanatory cutaway; drawn path density is not irradiance. |
| 08_volume_standard_validation.png |Additional homogeneous-volume-source model for single-well standard-liquid validation; not the floor-cell matrix. |

All figures are generated in`visualize.py`; propagation/sweeps are in`transport.py`and`run.py`. See`README_EN.md`. Citations describe component/indicator evidence; they do not certify this project design.
'''
protected=[]
def protect(match):
 protected.append(match.group());return 'TOKEN'+chr(65+len(protected)//26)+chr(65+len(protected)%26)+'TOKEN'
en=re.sub(r'https?://[^\s)]+|`[^`]+`|VEMD5060X01|GCaMP6|GPIO\d+|\b[CUDR]\d+\b',protect,en)
en=re.sub(r'(?<=[A-Za-z])(?=\d)|(?<=\d)(?=[A-Za-zµ])|(?<=[%°])(?=[A-Za-z])',' ',en)
for i,value in enumerate(protected,1):en=en.replace('TOKEN'+chr(65+i//26)+chr(65+i%26)+'TOKEN',value)
for old,new in {'meniscusZ':'meniscus Z','TopZ':'Top Z','compressedZ':'compressed Z','fourLED':'four LED','ActiveLED':'Active LED','forSNR':'for SNR','Units:nW':'Units: nW','seeds,24':'seeds, 24','angle,4':'angle, 4','powers,3':'powers, 3','absorption,QY':'absorption, QY','in`':'in `','`and`':'` and `','See`':'See `'}.items():en=en.replace(old,new)
for old,new in {'gasketZ':'gasket Z','sealZ':'seal Z','pixelCV':'pixel CV','|20':'| 20','|Upper':'| Upper','|X':'| X',',four':', four',',lower':', lower',',inside':', inside',',outside':', outside'}.items():en=en.replace(old,new)
en=re.sub(r'(\d) e([+-]\d+)',r'\1e\2',en)
(P/'Analysis_EN.md').write_text(en,encoding='utf-8')
print('Wrote bilingual optical analyses')
from write_figure_guide import generate
generate()
