"""Generate bilingual, per-figure publication captions and interpretation notes."""
from pathlib import Path
import json,csv,re
import numpy as np
P=Path(__file__).resolve().parent;R=P/'results';D=P/'figure_notes';D.mkdir(exist_ok=True)
def generate():
 s=json.loads((R/'summary.json').read_text());m=json.loads((R/'maps_summary.json').read_text());f=json.loads((R/'frequency_summary.json').read_text());st=f['metrics'];ls=json.loads((R/'leakage_MC_summary.json').read_text());sw=json.loads((R/'interference_sweep_summary.json').read_text());ne=s['cases'][0];names=['NE','NW','SW','SE'];bias=', '.join(f'{x:.2f}%' for x in st['amplitude_bias_percent']);sinr=', '.join(f'{x:.2f}' for x in st['demodulation_SINR_dB'])
 # Each entry: title, caption, method, findings, reading/axes/legend, limitations, inputs.
 notes={
 '01_parameter_sweep':dict(EN=[
 'Optical power sensitivity',
 'Conditional received green power for 24 optical cases. Bars are means and error bars are one Monte Carlo standard error across three seeds; they are not confidence intervals for device performance.',
 'Each seed launches 24,000 excitation packets and 60,000 weighted fluorescence packets. The original 24-case sweep totals 6,048,000 packets. Powers assume 500 µW LED-on excitation, a 20 µm bottom absorbing layer, excitation absorption 0.5/mm, and quantum yield 1. This figure reuses the frozen optical calculations.',
 f'The reference NE result is {ne["green_nW"]:.3f} ± {ne["green_SE_nW"]:.3f} nW. Changing PD placement, seal, scatter or filter assumptions changes collected power; an increase alone does not establish better well isolation or biological sensitivity.',
 'Horizontal axis: received green optical power, nW. Vertical labels: case names matching parameter_sweep.csv. Green bars: seed means; black horizontal marks: ±1 SE. Read relative changes together with their uncertainty, then inspect the named parameter in run.py.',
 'All values are model outputs. Only three seeds are used; geometry, material and biological uncertainty are not represented by these bars. The PCB substrate is a lower loss boundary, and real detector/filter angular response is unmeasured.',
 'results/parameter_sweep.csv; results/summary.json; results/<case>.json; run.py; transport.py'],ZH=[
 '光學功率敏感度',
 '24 組條件下的綠光收光功率。長條為三個蒙地卡羅種子的平均，誤差線為一個標準誤；不是實機效能的信賴區間。',
 '每個種子追蹤 24,000 個激發封包與 60,000 個加權螢光封包，原始掃描共 6,048,000 個。假設 LED 開啟功率 500 µW、底部吸收層厚 20 µm、激發吸收係數 0.5/mm、量子產率 1。本圖使用凍結的原始光學運算。',
 f'NE 基準為 {ne["green_nW"]:.3f} ± {ne["green_SE_nW"]:.3f} nW。PD 位置、密封圈、散射及濾光假設會改變收光；功率上升本身不代表井間隔離或生物靈敏度改善。',
 '橫軸：收到的綠光光功率，nW。縱向標籤：與 parameter_sweep.csv 一致的案例名稱。綠色長條為平均、黑線為 ±1 SE。先把差異與誤差一起看，再依案例名稱到 run.py 查變動參數。',
 '全部為模型結果。三個種子的誤差線不包含幾何、材料及生物參數的不確定性。PCB 基板設為下方損失邊界；真實 PD 與濾片的角度響應仍未知。',
 'results/parameter_sweep.csv; results/summary.json; results/<case>.json; run.py; transport.py']),
 '02_floor_maps':dict(EN=[
 'Cell-floor irradiance and collection',
 'A: upward excitation power transmitted across the resin–liquid floor under NE illumination. B: isotropic point-source power reaching the PD. Each row shares one color scale across all four wells.',
 'The floor field uses 600,000 excitation packets and scores after Fresnel transmission, not resin-side incidence. Collection uses 224 source positions, each with 65,536 packets. Pixels are 0.5 × 0.4 mm. SE and Wilson 95% bounds are saved with the collection map.',
 f'NE mean floor irradiance is {m["floor_mean_uW_mm2"][0]:.3f} µW/mm² and spatial CV is {m["floor_CV"][0]*100:.1f}%. Median relative collection-map SE is {m["median_eta_relative_SE"]*100:.1f}%. Flatness therefore does not imply uniform excitation.',
 'Each map uses mirrored local x=1.3–5.3 mm and y=1.25–4.05 mm. A color bar: µW/mm²; B color bar: percent of emitted source power. NE/NW/SW/SE identify wells. Compare corresponding locations using the shared scales; the maps are not separately normalized to 100%.',
 'Directional floor irradiance is not all-direction fluence. Finite Monte Carlo noise contributes to spatial variation. A zero-count region is not proof of zero coupling. Tissue-photometry fluence images use different geometries and scoring quantities.',
 'results/spatial_maps.npz; results/maps_summary.json; run.py maps()'],ZH=[
 '井底照度與位置相關收光',
 'A：NE LED 打光時，通過樹脂／液體井底介面的向上激發光。B：各位置等向性光源中有多少功率抵達 PD。同一列四井共用色階。',
 '井底圖使用 600,000 個激發封包，計算 Fresnel 穿透後的功率，不是入射到樹脂側的功率。收光圖為 224 個位置，每點 65,536 個封包；像素 0.5 × 0.4 mm。另保存收光標準誤及 Wilson 95% 區間。',
 f'NE 平均井底照度為 {m["floor_mean_uW_mm2"][0]:.3f} µW/mm²，空間 CV 為 {m["floor_CV"][0]*100:.1f}%；收光圖相對標準誤中位數為 {m["median_eta_relative_SE"]*100:.1f}%。平底並不等於均勻打光。',
 '各井使用鏡射後的局部座標，x=1.3–5.3 mm、y=1.25–4.05 mm。A 色條為 µW/mm²，B 為源功率百分比。NE／NW／SW／SE 表示井。應依同列共同色階比較，而不是把每井都正規化為 100%。',
 '方向性井底照度不是所有方向加總的 fluence；抽樣誤差也會形成斑塊。零命中不能證明沒有串擾。文獻組織光學圖的介質、幾何與計分量不同，不能只比圖形外觀。',
 'results/spatial_maps.npz; results/maps_summary.json; run.py maps()']),
 '03_well_transfer':dict(EN=[
 'Cell-layer optical transfer',
 'Received green power resolved by active LED and the well where fluorescence originated, for the ideal-material bottom-cell-layer model.',
 'Weighted absorption events seed isotropic fluorescence. Each detected packet retains its source-well label. Means from three independent seeds form a 4 × 4 matrix; each row corresponds to one illuminated LED.',
 f'Intended-well fractions span {min(s["intended_well_fraction"])*100:.1f}–{max(s["intended_well_fraction"])*100:.1f}%; matrix condition number is {s["condition_number"]:.2f}. The bottom shared optical band still couples wells.',
 'Rows: active LED position; columns: fluorescent source well. Cell numbers and color bar: received optical nW. Diagonal entries are intended-well contributions; off-diagonal entries quantify modeled mixing. Row sums are the total fluorescence for each LED.',
 'A source frequency identifies the LED, not an isolated well. This is not a measured calibration matrix. Cell distribution, reseating and the actual PD location can change the matrix. The volume-standard matrix in Figure 08 cannot replace this cell-layer matrix.',
 'results/LED_by_well_nW.csv; results/summary.json'],ZH=[
 '細胞底層的井間混合矩陣',
 '在理想材料、底部細胞層假設下，將 PD 收到的綠光依點亮 LED 與螢光來源井分開。',
 '依吸收權重抽取螢光來源，再追蹤等向性放射；每個命中封包保留來源井標籤。三個獨立種子的平均構成 4 × 4 矩陣，每列點亮一顆 LED。',
 f'目標井貢獻占 {min(s["intended_well_fraction"])*100:.1f}–{max(s["intended_well_fraction"])*100:.1f}%，矩陣條件數 {s["condition_number"]:.2f}。底部共用光學通道仍造成井間耦合。',
 '列是 LED 位置、欄是螢光来源井，格內數字及色條單位為 nW。對角線為目標井，非對角線為混合。每列相加才是該 LED 的總螢光。',
 '頻率標記辨認的是 LED，不保證井獨立。這不是實測校正矩陣；細胞分布、重裝及 PD 位置會改變它。圖 08 的體積標準液矩陣不可直接替代。',
 'results/LED_by_well_nW.csv; results/summary.json']),
 '04_detector_angles':dict(EN=[
 'Detector angular acceptance',
 'Cumulative NE green power admitted by artificial detector acceptance cones. Points are three-seed means with ±1 SE.',
 'Detected packet arrival directions are post-filtered at half-angles 20°, 30°, 45°, 65° and 90°. This does not reroute rays or assert that the real detector has a sharp cone cutoff.',
 'Collection rises as oblique rays are admitted. The graph shows why an on-axis filter specification is insufficient for this geometry.',
 'Horizontal axis: acceptance half-angle relative to the PD normal, degrees. Vertical axis: cumulative received green power, nW. Green line/points: means; black vertical bars: Monte Carlo SE. At 90° all top-surface arrivals are retained.',
 'The PD uses a 7.5 mm² equal-area proxy, offset (0,−0.4) mm. Real active-area shape, package optics and spectral/angular response remain unmeasured; the curve is a diagnostic, not a component specification.',
 'results/ideal_NE.json; green.angular_power_nW'],ZH=[
 'PD 收光角度診斷',
 '以人工接受角限制，統計 NE 綠光的累積收光量；點為三種子平均，誤差線為 ±1 SE。',
 '把已命中 PD 的封包依相對法線的入射角分成 20°、30°、45°、65°、90° 以內。這是事後篩選，不會重新導光，也不代表真實 PD 有如此銳利的截止角。',
 '允許更多斜射光後收光量增加；因此不能只用濾片正入射規格評估這個幾何。',
 '橫軸：相對 PD 法線的接受半角，度。縱軸：累積綠光功率，nW。綠線／點為平均，黑直線為蒙地卡羅標準誤。90° 包含所有由頂面抵達的光。',
 'PD 使用 7.5 mm² 等面積代理，中心偏移 (0,−0.4) mm。實際感光區形狀、封裝與波長／角度響應未測得，因此本圖是診斷，不是零件規格。',
 'results/ideal_NE.json; green.angular_power_nW']),
 '05_frequency_recovery':dict(EN=[
 'Four detector-signal comparisons',
 'A: ideal noise-free received fluorescence. B: conditional received signal including MC excitation leakage and assumed ambient, photoelectron shot noise and electronics noise. C: overlay. D: received minus ideal.',
 'Four independent OD3 MC green/leakage gains feed 25%-duty 89/113/41/67 Hz gates in NE/NW/SW/SE order. The default has R470/R520=0.8, R520=0.3 A/W, ambient 0.15+0.05 cos(2π100.3t+0.4) nW equivalent, and electronic RMS 0.005 nW. Poisson counts use a discrete 250 µs bin with its gate held at the sampled state; PWM-edge fractions are not integrated.',
 f'Over the full two seconds, RMSE is {st["time_RMSE_nW"]:.5f} nW, DC residual {st["residual_DC_nW"]:.5f} nW and AC residual RMS {st["AC_residual_RMS_nW"]:.5f} nW. The waveform AC SINR is {st["waveform_AC_SINR_dB"]:.2f} dB. These quantify the chosen scenario, not hardware accuracy.',
 'All x axes show time, ms, for the first 120 ms. Y axes show green-equivalent nW; A/B/C use the same limits while D has its own scale. Green is ideal, orange is received, purple is residual. The ideal trace retains useful reflected green fluorescence and the modeled well mixing.',
 'Ambient/noise/responsivity are assumptions, not measurements. nW equivalent is not measured optical-only power or ADC voltage. The residual is not purely reflection: it includes leak, ambient, shot noise and electronic noise. No cell activation dynamics, TIA bandwidth, saturation, dark current or timing jitter are modeled.',
 'results/frequency_traces.npz; results/frequency_summary.json; results/leakage_MC_summary.json; signal_model.py'],ZH=[
 '四種 PD 訊號比較',
 'A：理想、無雜訊的收到螢光。B：加入 MC 激發漏光與假設環境光、光電子散粒雜訊及電子雜訊。C：疊圖。D：收到訊號減掉理想訊號。',
 '使用四顆 LED 各自的 OD3 綠光／漏光 MC 增益；NE／NW／SW／SE 對應 89／113／41／67 Hz、25% duty。預設 R470/R520=0.8、R520=0.3 A/W；環境光為 0.15+0.05 cos(2π100.3t+0.4) nW 等效值；電子 RMS 0.005 nW。Poisson 計數以 250 µs 離散取樣格計算，將閘門保持在該取樣時刻狀態，沒有積分格內 PWM 邊緣。',
 f'完整兩秒的 RMSE 為 {st["time_RMSE_nW"]:.5f} nW，殘差 DC 為 {st["residual_DC_nW"]:.5f} nW、AC RMS 為 {st["AC_residual_RMS_nW"]:.5f} nW，波形 AC SINR 為 {st["waveform_AC_SINR_dB"]:.2f} dB。這些只量化指定情境，不是實板準確度。',
 '橫軸皆為前 120 ms；縱軸是綠光等效 nW。A／B／C 使用相同縱軸，D 另有尺度。綠為理想、橘為收到訊號、紫為殘差。理想螢光仍保留有效的反射綠光與既有井間混合。',
 '環境光、雜訊及響應度都是假設，不是實測。等效 nW 不是單純光功率或 ADC 電壓。殘差包含漏光、環境光、散粒與電子雜訊，不能全部叫反射干擾。未模擬細胞活化、TIA 頻寬、飽和、暗電流及時序抖動。',
 'results/frequency_traces.npz; results/frequency_summary.json; results/leakage_MC_summary.json; signal_model.py']),
 '06_conditional_budget':dict(EN=[
 'Conditional noise threshold',
 'Maximum lock-in amplitude RMS noise compatible with an engineering SNR target of five, for the stated optical model and quantum yield 0.6.',
 'Scale the original ideal-filter NE green power by LED-on power and quantum yield. Multiply ΔF/F by the 25%-duty fundamental factor 2sin(π/4)/π≈0.450; divide the resulting amplitude change by five. The CSV also contains quantum yields 0.1, 0.3 and 1.',
 'Stronger LED excitation and larger fractional response permit a larger noise budget in this linear model. This is a requirement on repeated demodulated amplitudes, not a measured detector noise level.',
 'Columns: LED-on radiant power, mW. Rows: ΔF/F, percent. Numbers/color: maximum amplitude RMS noise, pW; color is logarithmic. Every cell uses QY=0.6 and the same reference absorption assumption.',
 'No inferred odor limit, phototoxicity limit or detection guarantee follows. This budget uses the original ideal-green-filter reference, whereas the conditional movie uses OD3-case green collection with emission transmission 0.9. Different reference powers are intentional and labeled here.',
 'results/conditional_photon_budget.csv; results/summary.json; publication.py budget()'],ZH=[
 '條件式雜訊門檻',
 '在指定光學模型、量子產率 0.6 下，若工程目標 SNR=5，鎖相振幅所能容許的最大 RMS 雜訊。',
 '把原始理想綠光濾片的 NE 功率依 LED 開啟功率與量子產率縮放，再乘 ΔF/F 及 25% duty 基頻因子 2sin(π/4)/π≈0.450，最後除以五。CSV 另包含 QY 0.1、0.3、1。',
 '在線性假設下，更強打光或更大反應幅度可容許較大的雜訊。這是重複解調後振幅的要求，不是已量到的 PD 雜訊。',
 '欄：LED 開啟時光功率，mW。列：ΔF/F，百分比。數字／顏色：最大振幅 RMS 雜訊，pW，色階為對數。全圖固定 QY=0.6 與參考吸收假設。',
 '不能由此得到氣味檢測極限、光毒性門檻或成功保證。本圖沿用理想綠光濾片基準；影片則用放射正常穿透率 0.9 的 OD3 綠光收光，因此兩者基準功率不同。',
 'results/conditional_photon_budget.csv; results/summary.json; publication.py budget()']),
 '07_sample_paths':dict(EN=[
 'Selected NE optical paths',
 'A cutaway rendering of actual sampled NE excitation and fluorescence trajectories. Selected detected fluorescence paths are emphasized; line density is not optical intensity.',
 'Read the saved deterministic animation_paths.json. Display contiguous visible segments only, with no artificial connection across clipped excursions. The central carrier is a cutaway; roof, compression plate and outer walls are removed for visibility.',
 'There are trajectories from LED through the well to the finite off-center PD. This does not imply uniform illumination or sufficient biological signal. The purple PD cross is at the provisional active center (0,−0.4,40.5) mm.',
 'Blue lines: excitation; green lines: fluorescence. NE/NW/SW/SE are well labels. x/y/z triad arrows are each 2 mm. The view is an oblique projection, not an equal-scale 2D slice. The marked PD position is an optical datum rather than the package center.',
 'Only NE trajectories are shown; none are mirrored to stand in for other LEDs. Path selection deliberately makes rare detected rays visible, so counting lines cannot estimate collection efficiency. This is not a manufacturing drawing or time-of-flight simulation.',
 'results/animation_paths.json; publication.py path_figure()'],ZH=[
 'NE 抽樣光路',
 '剖視圖呈現實際抽樣的 NE 激發及螢光軌跡；特別顯示部分命中 PD 的螢光路徑，線條密度不是光強。',
 '讀取固定種子的 animation_paths.json，只連接連續可見的片段，沒有跨越被裁掉的路徑直接拉線。圖為局部剖視，屋頂、壓板及外牆為了可見性而隱去。',
 '可以看到 LED 經井到有限面積偏心 PD 的光路，但不能因此宣稱均勻或生物訊號足夠。紫色 PD 十字位於暫定感光中心 (0,−0.4,40.5) mm。',
 '藍線為激發、綠線為螢光；NE／NW／SW／SE 是井標籤；x／y／z 三個箭頭各代表 2 mm。圖是斜投影，不是等比例二维切片。PD 標記是光學基準，不是封裝中心。',
 '只顯示 NE 真實抽樣軌跡，不鏡射冒充其他 LED。為了看清楚，刻意挑出稀少的命中光線，所以不能數線估計效率。本圖不是製造圖或光子飛行時間模擬。',
 'results/animation_paths.json; publication.py path_figure()']),
 '08_volume_standard_validation':dict(EN=[
 'Uniform-volume standard transfer',
 'Row-normalized source-well contributions for a weakly absorbing uniform fluorescent liquid, distinct from a bottom cell layer.',
 'Four LEDs × three seeds use the same 100 µL geometry, but absorption 0.001/mm is distributed through the liquid. The additional model contains 1,008,000 packets. Each row is divided by its received green total.',
 'Off-diagonal contributions remain. This gives a matched-model comparison for a simple single-well standard-liquid experiment, without claiming that the same matrix applies to cells.',
 'Rows: illuminated LED position. Columns: source well. Numbers and color: percent of received fluorescence from each well, so each row sums to 100% apart from displayed rounding. Unlike Figure 03, this figure is normalized rather than nW.',
 'Use complex blank-subtracted measured signals before taking amplitudes and normalizing. Match fill and geometry. Unknown concentration, spectrum, quantum yield and LED power limit absolute-power validation. A uniform-liquid matrix does not calibrate a localized cell layer.',
 'results/volume_standard_summary.json; results/volume_standard_LED_by_well_fraction.csv'],ZH=[
 '均勻標準液的混合矩陣',
 '弱吸收、均勻螢光液體的來源井比例，每列正規化；此模型與底部細胞層不同。',
 '四 LED × 三種子，液量與幾何同為 100 µL，但 0.001/mm 的吸收分布在整個液體，額外追蹤 1,008,000 個封包。每列除以其收到的總綠光。',
 '仍存在非對角貢獻。這讓簡易的單井標準液實驗有相同來源分布的模型可比較，不代表同一矩陣適用於細胞。',
 '列為 LED 位置、欄為來源井；數字及色條是 PD 綠光的來源百分比，每列合計約 100%。與圖 03 的 nW 不同，本圖是正規化比例。',
 '量測資料應先以複數 I/Q 扣空白，再取振幅與正規化；需匹配液量與幾何。未知濃度、光譜、量子產率及 LED 功率限制絕對值比較，不能用標準液矩陣直接校正底部細胞層。',
 'results/volume_standard_summary.json; results/volume_standard_LED_by_well_fraction.csv']),
 '09_interference_metrics':dict(EN=[
 'Spectral and four-channel errors',
 'A: ideal/received amplitude spectra. B: signed amplitude bias and complex relative error after joint four-frequency demodulation. C: signal-to-error ratio including systematic contamination and random noise.',
 'Use the full 8,000-sample record. FFT amplitudes are 2|FFT|/N after mean removal. Joint least squares fits an intercept plus sine/cosine pairs at all four LED frequencies. Complex coefficient C=cosine−i sine; error ΔC=Creceived−Cideal.',
 f'In NE/NW/SW/SE order, amplitude biases are {bias}; error-inclusive SINR values are {sinr} dB. Detecting all four frequency peaks therefore does not establish uncontaminated fluorescence.',
 'A x: Hz, y: log amplitude nW equivalent, plotted down to 10^-5; lower values are visually floored only. Green ideal/orange received. B x: LED frequency, y: percent; orange amplitude bias, purple |ΔC|/|Cideal|. C y: 20log10(|Cideal|/|ΔC|), dB. This is SINR/error ratio, not noise-only SNR.',
 'Ambient and both noise sources are synthetic. Positive amplitude bias does not mean a real cell response. Same-frequency excitation leakage survives demodulation; reflected green fluorescence remains in the desired comparator. Scalar amplitude subtraction is not equivalent to complex background correction.',
 'results/frequency_recovery.csv; results/frequency_traces.npz; results/frequency_summary.json'],ZH=[
 '頻譜與四通道解調誤差',
 'A：理想／收到訊號的振幅頻譜。B：聯合四頻解調後的振幅偏差與複數相對誤差。C：把系統性污染與隨機雜訊一起計入的訊號／誤差比。',
 '使用完整 8,000 點；扣平均後 FFT 振幅為 2|FFT|/N。最小平方法同時擬合截距及四個 LED 頻率的 sin／cos。複數係數 C=cos 係數−i sin 係數，ΔC=收到−理想。',
 f'依 NE／NW／SW／SE，振幅偏差為 {bias}，誤差包含式 SINR 為 {sinr} dB。能看到四個頻率尖峰，不代表沒有螢光污染。',
 'A 橫軸 Hz，縱軸為對數的等效 nW 振幅，顯示下限 10^-5；更小值只在畫圖時截至下限。綠為理想、橘為收到。B 橫軸 LED 頻率、縱軸百分比；橘為振幅偏差、紫為 |ΔC|/|Cideal|。C 是 20log10(|Cideal|/|ΔC|)，dB；不是只有隨機雜訊的 SNR。',
 '環境光及兩種雜訊都是合成假設。正振幅偏差不代表真實細胞反應。同頻激發漏光會留下；反射綠光仍屬於理想訊號。純量振幅相減也不等於複數背景校正。',
 'results/frequency_recovery.csv; results/frequency_traces.npz; results/frequency_summary.json']),
 '10_interference_sweep':dict(EN=[
 'Interference and noise sensitivity',
 'A/B summarize worst-channel complex error and lowest-channel median SINR at electronic RMS 5 pW/sample and assumed responsivity ratio 0.8. C varies electronic noise; all panels also include assumed photoelectron shot noise.',
 f'The full sweep has {sw["scenarios"]} scenarios: four excitation-rejection settings, four ambient cases, three electronic RMS levels and three responsivity ratios. Each has {sw["noise_replicates"]} deterministic-seed noise repetitions. MC means stay fixed; only Poisson counts and electronic noise vary.',
 'Greater excitation rejection reduces the excitation-leakage term, but cannot remove ambient light at a modulation frequency. DC affects raw waveform error without necessarily biasing the fitted AC coefficients. A higher noise-only SNR does not remove systematic leakage bias.',
 'A/B columns: excitation OD, with ∞ denoting zero excitation leakage; rows: none, DC, 100.3 Hz flicker, or 67 Hz coherent ambient. A color/numbers: maximum across four channel mean complex errors, percent. B: minimum channel median SINR, dB. C x: electronic RMS pW/sample; y: repeat-to-repeat noise-only vector SNR, dB; colored curves identify LED frequencies.',
 'R520=0.3 A/W and R470/R520=0.6/0.8/1 are assumptions. No ranking is a measured optimum. Electronic noise and ambient cases are illustrative, MC uncertainty is not propagated, and the chosen sample-hold photon model omits true PWM-edge integration and analog filtering.',
 'results/interference_sweep.csv; results/interference_sweep_replicates.csv; results/interference_sweep_summary.json'],ZH=[
 '干擾與雜訊掃參數',
 'A／B 固定電子 RMS 5 pW/sample、假設響應度比 0.8，呈現最差通道的複數誤差及最低通道 SINR 中位數；C 改變電子雜訊。所有面板也包含假設的光電子散粒雜訊。',
 f'完整掃描 {sw["scenarios"]} 組：四種激發阻擋、四種環境光、三種電子 RMS、三種響應度比；每組 {sw["noise_replicates"]} 次固定種子的雜訊重複。MC 平均增益固定，變動的是 Poisson 計數與電子雜訊。',
 '提高激發阻擋可減少激發漏光，但無法去除恰好與 LED 同頻的環境光。DC 會影響原始波形誤差，却不一定偏移 AC 解調係數。只有隨機雜訊的 SNR 再高，也不能取消固定漏光偏差。',
 'A／B 欄為激發 OD，∞ 表示零激發漏光；列為無、DC、100.3 Hz 閃爍或 67 Hz 同頻環境光。A 數字／色為四通道中最大的平均複數誤差，%；B 為最低通道 SINR 中位數，dB。C 橫軸電子 RMS pW/sample、縱軸重複間雜訊向量 SNR；不同顏色表示 LED 頻率。',
 'R520=0.3 A/W、R470/R520=0.6／0.8／1 都是假設，沒有實測最佳解。情境只用於敏感度分析，未傳遞 MC 不確定性；取樣保持光電子模型也忽略真實 PWM 邊緣積分與類比濾波。',
 'results/interference_sweep.csv; results/interference_sweep_replicates.csv; results/interference_sweep_summary.json']),
 'optical_slow_motion':dict(EN=[
 'Synchronized optical movie',
 'NE sampled optical paths and four LED state indicators share one time clock with ideal, received, overlaid and residual detector traces. Playback is 100× slow; the 20-second movie covers 0.2 seconds of modulation.',
 'Frame k uses sample round(k×4000/(10×100)). The LED states, visible NE paths, trace endpoints and cursor all read that sample. Frame zero displays sample zero in every panel; no future samples are revealed. There are 200 frames at 10 fps, from t=0 to 199 ms, with the final frame held for the remaining 1 ms of physical time.',
 'The earlier moving-window display exposed a future 0–60 ms trace while the schematic advanced, creating an apparent delay. The fixed window now reveals history only through the current sample. This is a display correction, not a change to photon flight physics or CAD.',
 'A: actual NE trajectories only; other LEDs have synchronized state markers but no mirrored rays. B: ideal; C: conditional received; D: green/orange overlay; E: purple residual. Each signal x-axis is 0–200 ms and the vertical cursor marks the common time. Y units are green-equivalent nW; residual uses its own range. The purple PD cross marks (0,−0.4,40.5) mm.',
 'Paths switch together at the LED state; there are no traveling photon dots or fabricated millisecond flight delay. Useful reflected fluorescence remains in ideal; same-frequency excitation contamination remains in received. The movie is neither a cell-response measurement nor a complete electronic timing model. The GIF and MP4 use the same 200 frame times.',
 'results/video_frame_alignment.json; results/video_metadata.json; results/animation_paths.json; results/frequency_traces.npz; publication.py render_frame()/video()'],ZH=[
 '同步光學影片',
 'NE 抽樣光路、四顆 LED 狀態與理想、收到、疊圖、殘差訊號共用同一時鐘。播放放慢 100 倍，20 秒影片呈現 0.2 秒調變。',
 '第 k 格使用 sample=round(k×4000/(10×100))。LED 狀態、NE 路徑、曲線終點與游標皆讀同一取樣。第零格全部使用 sample 0，不先畫未来訊號。共 200 格、10 fps，時間為 0–199 ms；最後一格停留涵蓋剩餘 1 ms 物理時間。',
 '先前移動視窗會在開頭固定呈現未來的 0–60 ms 曲線，而左圖已前進，造成不同步觀感。現在固定視窗只揭露截至當下的歷史。這是顯示修正，不是修改光子飛行物理或 CAD。',
 'A 只畫 NE 真實轨跡；其他 LED 顯示同步狀態，但不鏡射光線。B 理想、C 收到、D 綠／橘疊圖、E 紫色殘差。橫軸皆 0–200 ms，直線游標為共同時間；縱軸綠光等效 nW，殘差另有尺度。紫色 PD 十字標示 (0,−0.4,40.5) mm。',
 '光路依 LED 状態同步亮滅，沒有移動光點或捏造的毫秒飛行延遲。反射螢光仍在理想訊號；同頻激發污染仍在收到訊號。影片不是細胞實測或完整電子時序模型；GIF 與 MP4 共用相同 200 個時間點。',
 'results/video_frame_alignment.json; results/video_metadata.json; results/animation_paths.json; results/frequency_traces.npz; publication.py render_frame()/video()'])}
 captions={}
 for stem,langs in notes.items():
  for lang,v in langs.items():
   title,caption,method,result,reading,limit,inputs=v
   heads=['Publication caption','Generation and assumptions','Results','How to read: axes and legends','Limitations','Data and reproduction'] if lang=='EN' else ['可投稿圖說','如何生成與假設','結果','如何讀圖：座標與圖例','限制','資料與重現']
   body=f'# {stem} · {title}\n\n'+''.join(f'## {h}\n\n{p}\n\n' for h,p in zip(heads,[caption,method,result,reading,limit,inputs]))
   body+='```text\npython run.py --plots\n'+('python run.py --plots --video --ffmpeg C:/path/to/ffmpeg.exe\n' if stem=='optical_slow_motion' else '')+'```\n'
   (D/f'{stem}_{lang}.md').write_text(body,encoding='utf-8')
  for ext in (['mp4','gif'] if stem=='optical_slow_motion' else ['png']):captions[stem+'.'+ext]={lang:v[1] for lang,v in langs.items()}
 (P/'captions.json').write_text(json.dumps(captions,ensure_ascii=False,indent=2),encoding='utf-8')
 for lang in ['EN','ZH']:
  en=lang=='EN';text='# '+('Optical figure and movie guide' if en else '光學圖表與影片指南')+'\n\n'
  text+=('Each artifact has its own detailed bilingual note. Figures intentionally contain only titles, panel labels, axes, legends and data annotations. Read the caption and assumptions before using a figure in a paper or wiki.\n\n' if en else '每一張圖與影片都有獨立中英文說明。圖中僅保留標題、面板、座標、圖例與數值標示；放入 paper／wiki 前，請連同圖說與假設閱讀。\n\n')
  for stem,v in notes.items():text+=f'- [{stem} · {v[lang][0]}](figure_notes/{stem}_{lang}.md)\n'
  text+='\n'+('The original geometric MC and the conditional detector model are different evidence layers. Reflected green light remains useful fluorescence; parasitic blue light can share exactly the same LED frequency. Ambient, responsivity and both noise sources are declared assumptions. No plot here establishes real PCB accuracy or cell sensitivity.\n\n' if en else '原始幾何 MC 與條件式接收器模型是不同層次的證據。反射綠光仍可能是有效螢光；寄生藍光可能與 LED 完全同頻。環境光、響應度與兩種雜訊均為明列假設，任何圖都不證明實板準確度或細胞靈敏度。\n\n')
  text+=('Full rebuild, from this folder:\n' if en else '在此資料夾完整重建：\n')+'```text\npython run.py --verify --run --maps --convergence --standard --workers 4\npython leakage_sweep.py --workers 4\npython run.py --plots --video --ffmpeg C:/path/to/ffmpeg.exe\npython validate_publication.py\n```\n'
  (P/f'Figure_Guide_{lang}.md').write_text(text,encoding='utf-8')
 update_analysis(f,st,ls,sw)
def update_analysis(f,st,ls,sw):
 table_en='\n'.join(f'| {q} | {g:.5f} | {b:.5f} | {e:.5f} | {bias:.3f} | {sn:.2f} |' for q,g,b,e,bias,sn in zip(['NE','NW','SW','SE'],f['green_gains_nW'],f['MC_blue_by_LED_nW'],f['MC_blue_by_LED_SE_nW'],st['amplitude_bias_percent'],st['demodulation_SINR_dB']))
 for lang in ['EN','ZH']:
  path=P/f'Analysis_{lang}.md';text=path.read_text(encoding='utf-8');en=lang=='EN'
  if en:
   anchor='The synthetic example' if 'The synthetic example' in text else 'The detector comparison now uses';begin=text.index(anchor);end=text.index('## Is the intensity sufficient?',begin)
   block=f'''The detector comparison now uses a separate three-seed MC calculation for each LED at OD3, OD4 and OD5: 12 additional cases and 3,024,000 packets. The original 24-case results are unchanged. Each LED has its own blue leakage; no NE gain is reused as another LED's prediction. The desired green comparator uses the OD3 green means (emission normal transmittance 0.9), retains reflected fluorescence, and stays fixed across the synthetic rejection sweep.

| LED | Desired green on-state nW | Blue optical on-state nW | Blue MC SE nW | Amplitude bias % | Error-inclusive SINR dB |
|---|---:|---:|---:|---:|---:|
{table_en}

All four frequency signals use 4 kHz sampling, two seconds and 25% duty. The default assumes R470/R520=0.8 and R520=0.3 A/W; these are not measured detector specifications. Plots use green-equivalent nW, not measured current or voltage. Ambient is 0.15 nW DC plus a 0.05 nW cosine at 100.3 Hz, phase 0.4 rad. Independent photoelectron counts obey Poisson statistics at the total fluorescence + leakage + ambient rate; electronic white noise has 0.005 nW per-sample RMS. The gate is held at its point-sampled state during each 250 µs bin; true PWM-edge overlap, TIA bandwidth, ADC response, dark current and jitter are omitted.

The ideal comparator removes parasitic excitation, ambient and both noise sources while preserving the same green trajectory. The residual therefore is not “all reflected light.” Default waveform RMSE is {st['time_RMSE_nW']:.5f} nW; DC residual {st['residual_DC_nW']:.5f} nW; AC residual RMS {st['AC_residual_RMS_nW']:.5f} nW; waveform AC SINR {st['waveform_AC_SINR_dB']:.2f} dB. Default shot/electronic RMS are {st['shot_noise_RMS_nW']:.6f}/{st['electronic_noise_RMS_nW']:.6f} nW. Joint sine/cosine least squares gives complex C; error-inclusive SINR is 20log10(|Cideal|/|Creceived−Cideal|). Noise-only SNR instead uses repeat-to-repeat fluctuations and excludes systematic bias.

The synthetic sweep has {sw['scenarios']} scenarios × {sw['noise_replicates']} repetitions: OD∞/3/4/5, four ambient cases, electronic RMS 0/5/20 pW and responsivity ratios 0.6/0.8/1.0. Its 18,432 channel records and 576 aggregated rows are saved in interference_sweep*.csv. MC means are held fixed, so these repeated seeds do not propagate MC or biological uncertainty. Same-frequency ambient remains even with ideal excitation rejection; a high noise-only SNR can coexist with biased amplitude.

The 20-second MP4/GIF uses 200 common timestamps at 10 fps and 100× slow playback. Every panel starts at sample zero. Cursor, trace endpoint, LED state and path gating share the same sample index. Only actual NE sampled paths are drawn; no mirrored paths are presented as other LEDs' trajectories. The PD active-center cross marks the provisional offset (0,−0.4) mm. Paths switch together, without fabricated travel delays. This does not simulate calcium dynamics or validate hardware timing. Detailed methods, results, axes, legends and limitations for all ten figures and the movie are in Figure_Guide_EN.md and figure_notes/.

'''
  else:
   anchor='頻率展示以' if '頻率展示以' in text else '接收器比較新增';begin=text.index(anchor);end=text.index('## 光強到底夠不夠',begin)
   block=f'''接收器比較新增四顆 LED 各自的 OD3／OD4／OD5 三種子 MC，共 12 組、3,024,000 封包；原始 24 組結果不變。每路使用自己的藍光漏光，不再把 NE 當作其他 LED 的預測。理想螢光比較基準取 OD3 綠光平均（放射正常穿透率 0.9），保留有效反射螢光，並在合成阻擋掃描中固定。

| LED | 目標綠光開啟功率 nW | 藍光開啟功率 nW | 藍光 MC SE nW | 振幅偏差 % | 含偏差 SINR dB |
|---|---:|---:|---:|---:|---:|
{table_en}

四路為 4 kHz 取樣、兩秒、25% duty。預設 R470/R520=0.8、R520=0.3 A/W，均非實測規格。圖以綠光等效 nW 表示，不是量到的電流／電壓。環境光假設為 0.15 nW DC 加 100.3 Hz、振幅 0.05 nW、相位 0.4 rad 的餘弦。光電子計數依螢光＋漏光＋環境光總量作 Poisson 取樣；另加每樣本 RMS 0.005 nW 的白電子雜訊。每個 250 µs 格將 LED 狀態保持在取樣點的值，未積分格內真實 PWM 邊緣，也未模擬 TIA 頻寬、ADC、暗電流及抖動。

理想比較保留相同綠光軌跡，取消寄生激發、環境光及兩種雜訊。因此殘差不能全部稱作反射光。預設波形 RMSE {st['time_RMSE_nW']:.5f} nW、殘差 DC {st['residual_DC_nW']:.5f} nW、AC RMS {st['AC_residual_RMS_nW']:.5f} nW、波形 AC SINR {st['waveform_AC_SINR_dB']:.2f} dB；散粒／電子 RMS 為 {st['shot_noise_RMS_nW']:.6f}／{st['electronic_noise_RMS_nW']:.6f} nW。共同 sin／cos 最小平方法得到複數 C；含偏差 SINR=20log10(|Cideal|/|Creceived−Cideal|)。只有雜訊的 SNR 則依重複間波動計算，不含系統偏差。

合成掃描共 {sw['scenarios']} 組 × {sw['noise_replicates']} 次：OD∞／3／4／5、四環境光、電子 RMS 0／5／20 pW、響應度比 0.6／0.8／1。保存 18,432 筆通道記錄與 576 筆彙整。MC 平均固定，不能把雜訊重複當作已傳遞 MC 或生物不確定性。同頻環境光即使理想激發阻擋也會留下；高 noise-only SNR 仍可能伴隨偏差。

MP4／GIF 為 20 秒、10 fps、200 個共同時間、100 倍慢放。所有面板从 sample 0 開始，游標、終點、LED 狀態與光路亮滅皆讀同一 sample。只顯示 NE 真實軌跡，不鏡射冒充其他 LED；PD 十字標示暫定感光中心偏移 (0,−0.4) mm。整條路徑同步亮滅，沒有捏造飛行延遲。影片不模擬鈣動態，也不驗證硬體時序。十張圖與影片的完整方法、結果、座標、圖例及限制，見 Figure_Guide_ZH.md 與 figure_notes/。

'''
  text=text[:begin]+block+text[end:]
  heading='## Figures and reproducibility' if en else '## 圖片與可用圖說';cut=text.index(heading);caps=json.loads((P/'captions.json').read_text())
  table='\n'.join(f'| {name} | {v[lang]} |' for name,v in caps.items() if name.endswith('.png'))
  text=text[:cut]+heading+'\n\n| '+('File | Caption' if en else '檔案 | 圖說')+' |\n|---|---|\n'+table+'\n\n'+('Detailed per-figure methods and reading instructions: ' if en else '各圖完整方法與讀圖說明：')+f'[Figure_Guide_{lang}.md](Figure_Guide_{lang}.md).\n'
  text=text.replace('All figures are generated in `visualize.py`','All figures are generated in `publication.py` (via `visualize.py`)')
  (path).write_text(text,encoding='utf-8')
if __name__=='__main__':generate()
