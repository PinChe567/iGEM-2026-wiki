# AeroSense — Plate P2 鈣螢光測定 分析報告

測定日期 2026-10-10 22:11 – 10-11 00:35 · 分析日期 2026-10-11
操作者 IJUNG · NTHU iGEM 2026 · BMG CLARIOstar Plus

---

## 一句話結論

**VUAA1 在 ORCO-only 細胞株產生明確反應(ΔF_corr = 0.215),untransfected 完全平坦(0.004)——融合蛋白進膜且有功能,平台成立。**
**六種氣味在 10 株 tuning OR 細胞株都沒有可判讀的反應**,原因見「為什麼氣味結果不能下結論」。

---

## 檔案

| 檔案 | 內容 |
|---|---|
| `01_per_well_results.csv` | 96 孔逐孔:F0a、F0b、ΔF_blank、ΔF_test、ΔF_corr、ΔF_norm、有效性 |
| `02_matrix_dF_corr.csv` | 8 化合物 × 12 細胞株矩陣 |
| `03_matrix_dF_norm.csv` | 同上,除以該管柱 VUAA1 的 ΔF_corr |
| `04_gain_consistency_QC.csv` | 每列 gain 一致性檢查 |
| `fig1_VUAA1_validation.png` | VUAA1 列的 ΔF_corr 長條圖 |
| `fig2_heatmap_dF_corr.png` | 8 × 12 熱圖 |
| `fig3_kinetics_all.png` | 八個化合物的動力學曲線 |
| `fig4_ORCO_VUAA1_trace.png` | **關鍵圖**:ORCO vs untransfected 對 VUAA1 的原始曲線 |
| `../P2_20261010_renamed/` | 32 個原始 CSV,已按化合物命名,含 `00_filename_map.csv` |

---

## 盤面

列 = 化合物,管柱 = 細胞株。

| 列 | 化合物 | runs | | 管柱 | 細胞株 |
|---|---|---|---|---|---|
| A | VUAA1 50 µM | 904–907 | | 1 | Or7a+ORCO |
| B | ethyl propionate | 908–911 | | 2 | Or19a+ORCO |
| C | isopentyl acetate | 912–915 | | 3 | Or42a+ORCO |
| D | 3-octanol | 916–919 | | 4 | Or98a+ORCO |
| E | benzaldehyde | 920–923 | | 5 | Or22a+ORCO |
| F | 2-heptanone | 924–927 | | 6 | Or67a+ORCO |
| G | valeric acid | 928–931 | | 7 | Or67b+ORCO |
| H | Control(純 buffer) | 932–935 | | 8 | Or59b+ORCO |
| | | | | 9 | Or85b+ORCO |
| | | | | 10 | Or35a+ORCO |
| | | | | 11 | **ORCO**(無 tuning OR) |
| | | | | 12 | **blank**(untransfected) |

每列四次讀取:`F0a` → 加 50 µL 純 buffer → `blank` → `F0b` → 加 50 µL 4× 化合物 → `test`
體積 100 → 150 → 200 µL,化合物以 4× 加入,最終佔 1/4。

---

## 計算方式

```
F0        = 該次 F0 讀取 5 個 cycle 的平均
F_MAX     = 3-cycle 移動平均的最大值(降低單點雜訊造成的正偏差)
ΔF_blank  = (F_MAX(blank) − F0a) / F0a
ΔF_test   = (F_MAX(test)  − F0b) / F0b
ΔF_corr   = ΔF_test − ΔF_blank
ΔF_norm   = ΔF_corr ÷ ΔF_corr(同管柱 VUAA1 列)
```

**偵測門檻**:untransfected 孔(第 12 管柱)在所有 gain 有效列的 ΔF_corr,SD = **0.045**,取 3 SD → **ΔF_corr ≥ 0.134** 才視為訊號。

---

## 資料品質:gain 在 run 之間變動過

Gain 不隨 protocol 儲存,每次在 Start Measurement 對話框決定。本次有數次未固定。用第 12 管柱(untransfected,不應對任何東西反應)的絕對值當標尺:

| 列 | F0a / blank / F0b / test 的 col-12 值 | 判定 |
|---|---|---|
| A | 1610 / 1579 / 1601 / 1607 | ✅ 有效 |
| **B** | 1408 / **1826** / 1432 / **1950** | ❌ F0 與 resp 不同 gain,ΔF 不可計算 |
| **C** | 551 / **1753** / 563 / 576 | ⚠️ blank 不同 gain,只有 ΔF_test 可用 |
| D | 2182 / 2180 / 2191 / 2274 | ✅ |
| E | 1946 / 1866 / 1902 / 1963 | ✅ |
| F | 2437 / 2358 / 2403 / 2452 | ✅ |
| G | 1731 / 1760 / 1757 / 1746 | ✅ |
| H | 18726 / 18526 / 18369 / 17852 | ✅ 列內一致(但 gain 約為其他列的 10 倍) |

ΔF 是**同一孔內的比值**,所以列與列之間 gain 不同不影響 ΔF;**但同一列的 F0 與其配對讀取必須同 gain**。B 列不符,整列作廢;C 列的 blank 不符。

**→ 下次:gain 調整一次、抄下數值,之後每一次測量都手動鍵入同一個值,`Gain Adjustment` 全程不勾。**

---

## 唯一可下的結論:VUAA1 → ORCO

`fig4_ORCO_VUAA1_trace.png`

| 孔 | 細胞株 | F0b | F_MAX | ΔF_test | ΔF_blank | **ΔF_corr** |
|---|---|---|---|---|---|---|
| A11 | ORCO only | 2210.8 | 2473.0 | 0.119 | −0.096 | **0.215** |
| A12 | untransfected | 1596.0 | 1611.7 | 0.010 | 0.006 | **0.004** |

- 上升為**漸進式**,約 60 秒進平台 —— 配體閘控離子通道該有的動力學
- 同一孔在 blank round(只加純 buffer)沒有上升 → 不是加液的機械假訊號
- 同一列的 untransfected 完全平坦 → 不是全盤的光學漂移
- H 列(第二次也只加 buffer)的 ORCO 孔 ΔF_corr = −0.017 → 同一孔在沒有配體時不動

四個對照互相支持。**GCaMP6f-ORCO 融合蛋白有表現、有進膜、有功能。**

另外 A10(Or35a+ORCO)ΔF_corr = 0.137,剛好在門檻上,視為弱陽性。
**其餘 9 株 tuning OR 細胞株對 VUAA1 沒有反應**(ΔF_corr −0.05 ~ 0.05)。VUAA1 作用在 ORCO 上,理論上 11 株含 ORCO 的都該反應,實際只有 2 株 → **多數細胞株的表現量不足**,這是下一步要解決的主要問題。

---

## 為什麼氣味結果不能下結論

三個獨立理由,任一個單獨成立就夠:

**1. Control 列產生了全盤最大的兩個值**
H 列第二次加的是純 buffer,理論上全部該是 0。實際:Or35a **0.449**、Or42a **0.315**、Or22a 0.127、Or67a −0.134。這兩個值比任何氣味列都大。**在這個雜訊水準下,任何「氣味陽性」都無法與假陽性區分。**

**2. ORCO 管柱在每一個氣味列都動,唯獨在 buffer 列不動**

| 列 | ORCO 的 ΔF_corr |
|---|---|
| A VUAA1 | 0.215 |
| D 3-octanol | 0.073 |
| E benzaldehyde | 0.138 |
| F 2-heptanone | 0.186 |
| G valeric acid | 0.158 |
| **H Control(buffer)** | **−0.017** |

ORCO-only 沒有 tuning OR,不該對氣味分子有專一反應。「對所有氣味液都動、對純 buffer 不動」的模式,比較像是**氣味工作液本身與 assay buffer 有某種物理差異**(折射率、溫度、殘留溶劑、pH),而不是受體活化。

**3. 動力學形狀不一致**(`fig3_kinetics_all.png`)
- A 列(VUAA1):~60 秒漸進上升 → 生物反應的形狀
- E、F、G 列:**t=0 瞬間階躍,之後完全平坦** → 光學/物理變化的形狀,不是鈣內流
- D 列(3-octanol):約 60 秒後才開始爬,到 168 秒還沒停 → 第三種形狀

一個機制不會產生三種形狀。

---

## 下一次要改的事(依重要性)

1. **Gain 固定**:調整一次 → 抄下數值 → 之後全部手動鍵入,`Gain Adjustment` 不勾。這是本次最大的資料損失來源(B、C 兩列)。
2. **盤子鍍 poly-D-lysine**。P1 整盤細胞脫落;P2 也有脫落。這是雜訊 SD 0.045(對照 P1 早期的 0.004)和 Control 列散佈過大的根源。
3. **加一列「假氣味」對照**:第二次加液用「跟氣味工作液同樣稀釋流程、但不含氣味」的溶液。這一列直接檢驗上面第 2 點的假說——如果 ORCO 在這一列也階躍,就確定是溶液的物理差異,與受體無關。
4. **縮短全程時間**:換 assay buffer 到測完壓在 40 分鐘內,不要像這次跑 2.5 小時。必要時一盤只跑 4 列。
5. **提升表現量**:11 株含 ORCO 的細胞株只有 2 株對 VUAA1 有反應。確認 doxycycline 誘導(Zboray et al. 2023 用 1 µg/mL,播種後 48–72 h)與轉染效率。
6. **自動匯出**:SMART Control → `Settings | Data Output` → 勾 ASCII → `Define format`,Header 選 `Full header`,Calculation 分頁的 `Store blank corrected values` **取消勾選**。設定一次,之後每次測量自動寫 CSV。

---

## 儀器設定(本次)

```
BMG CLARIOstar Plus,SMART Control / MARS
Fluorescence intensity,plate mode,kinetic,bottom optic
Ex F: 482-16 / Dichroic F: LP 504 / Em F: 530-40
Focal height  -4.1 mm
Flashes/well/cycle  20       Settling time  0.5 s
Cycle time  12 s (軟體最小值 10 s)
Enhanced dynamic range  OFF   滿量程 260,000 RFU
Temperature control  OFF(室溫)
Microplate  GREINER 96 F-BOTTOM
Protocol「20261010 1」F0 版   5 cycles
Protocol「20261010 2」resp 版 15 cycles,無搖晃
加液:8 道吸管,第 1–8 管柱後第 9–12 管柱,順序固定
Gain  未固定 —— 見上方 QC 表
```

---

## 參考

- Zboray K. et al. (2023) *Scientific Reports* 13:21757 — GCaMP6-ORCO 融合蛋白細胞株、VUAA1 50 µM 正控制、ΔF=(F_MAX−F0)/F0、VUAA1 歸一化、assay buffer 配方(140 mM NaCl, 5 mM KCl, 2 mM CaCl₂, 1 mM MgCl₂, 5 mM HEPES-Na, 20 mM glucose, pH 7.3, 340 mOsm)、無鈣 buffer 下對 ORCO 致效劑無反應、1 µg/mL doxycycline 誘導 48–72 h、該文 ΔF 範圍 124–462%
- BMG LABTECH SMART Control Software Manual Part II(0430F0049A, 2022-09-09)— §3.4 Data Output(p.22)、§3.4.1 檔名與路徑(p.23)、§3.4.2 Data Format / Full header(p.25)、§3.4.3 Store blank corrected values(p.27)、§6.5 Plate Identification(p.61)、§6.6 Sample IDs(p.64)
