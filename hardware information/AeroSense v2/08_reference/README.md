# Reference originals / 原始參考資料

These are copies of the user-supplied vendor schematic, top/bottom layout PDFs and BOM. Their internal V1 filenames are vendor identifiers, not a second print option. The current enclosure targets this supplied 100 x 90 mm board package.

這裡是使用者提供的原理圖、TOP/BOT圖與BOM原件。原始檔名中的V1是廠商命名，並非另一套可印外殼。

No source file has been modified. The locked board archive was not decrypted and is not included as an editable CAD source. A certified populated STEP, full purchasing MPN list, fabrication package and redistribution permission remain vendor inputs. References retain their original rights; do not apply a new blanket license to vendor documents or research papers. Research papers are cited by source links in the analysis, not republished in this package.

原件未修改。鎖定版圖未解鎖，不當成可編輯製造來源。含完整高度的STEP、完整採購料號與製造資料仍需供應商提供。原始文件保留原權利，不把論文／廠商資料套用新的統一授權。




# Gas delivery and drift reference

Updated 2026-10-06. [繁體中文](README.md). This note supplies provenance; it changes neither saved CFD results nor printable geometry.

## Citation

Alexander Vergara, Shankar Vembu, Tuba Ayhan, Margaret A. Ryan, Margie L. Homer, Ramón Huerta. Chemical gas sensor drift compensation using classifier ensembles. *Sensors and Actuators B: Chemical*, 166–167 (2012), 320–329. ISSN 0925-4005. [DOI 10.1016/j.snb.2012.01.074](https://doi.org/10.1016/j.snb.2012.01.074). Importable citation: [references.bib](references.bib).

Sources are the user-supplied abstract, publisher DOI and author-deposited [UCI Gas Sensor Array Drift Dataset](https://archive.ics.uci.edu/dataset/224/gas%2Bsensor%2Barray%2Bdrift%2Bdataset). UCI describes 13,910 measurements from 16 chemical sensors exposed to six gases, organized across time batches. The full methods were not retrieved in this review; no unverified paper-specific flow rate, chamber volume or switching duration is quoted.

## Relevance to AeroSense

The work motivates controlled delivery and time/batch records when assessing chemical-sensor drift. Record measured flow through the complete tubing/filter assembly, sample/blank switching times, concentration provenance, temperature/humidity when measured, cell batch, optical calibration and date. Retained blanks and a fixed standard can expose changes between sessions; they do not implement or validate the paper's classifier ensemble.

AeroSense uses a shared headspace and one regulated downstream suction pump. Its 3 mL/min candidate comes from the project's fixed-CAD transport sweep. Metal-oxide sensor evidence does not validate HEK293T operation, this flow rate, approximately 50-s gas t90, cell viability or VOC uptake. Do not convert a literature sensor flow into a cell-safe rate by simple scaling.

## Suggested wiki text

“Controlled delivery and batch records support reproducible chemical sensing. Vergara et al. studied drift compensation using long-term gas-sensor measurements, motivating our retention of flow, switching and batch metadata. Our chamber operating candidate is separately derived from a fixed-geometry transport model and awaits physical measurement; this reference does not establish a safe flow for the cell system.”

Place this in Model's gas-methods section and Hardware's delivery/data-recording section. Cite the same study rather than treating these as separate evidence. Measured complex-blank DLIA correction has its own methodological sources and must not be attributed to Vergara's classifier ensemble.


# 氣體供應與漂移文獻

更新日期：2026-10-06。[English](README.md)。本文件補充文獻脈絡，不改變已保存的 CFD 結果或列印幾何。

## 完整引用

Alexander Vergara, Shankar Vembu, Tuba Ayhan, Margaret A. Ryan, Margie L. Homer, Ramón Huerta. Chemical gas sensor drift compensation using classifier ensembles. *Sensors and Actuators B: Chemical*, 166–167 (2012), 320–329. ISSN 0925-4005. [DOI 10.1016/j.snb.2012.01.074](https://doi.org/10.1016/j.snb.2012.01.074)。可匯入的引用：[references.bib](references.bib)。

主要來源是使用者提供的摘要、出版者 DOI，以及作者存放的 [UCI Gas Sensor Array Drift Dataset](https://archive.ics.uci.edu/dataset/224/gas%2Bsensor%2Barray%2Bdrift%2Bdataset)。UCI 說明以 16 個化學感測器量測六種氣體、共 13,910 筆量測，並記錄不同時間批次。全文方法此次未取得，因此沒有引用無法核對的原文流量、氣室容積或切換時序。

## 可用在本專案的地方

這篇工作說明受控供氣、跨時間批次與漂移會影響氣體感測資料的判讀。AeroSense 因此應記錄完整管路下的實際流量、樣本與空白的切換時間、濃度來源、溫濕度（有量才填）、細胞批次、光學校正及量測日期。固定標準品與保留空白能幫助辨認日間差異；它們不等同於已完成論文的分類器集成方法。

本系統採共用氣室、單一下游受控抽氣，3 mL/min 是本專案固定 CAD 掃描下的條件式候選。Vergara 等人的金屬氧化物感測器不能替代 HEK293T 的實驗，也不替 3 mL/min、約 50 秒氣相 t90、細胞存活或 VOC 吸收背書。不要把文獻的感測器流量直接縮放成細胞安全流量。

## 可放進 Wiki 的文字

「受控供氣與跨批次資料紀錄是化學感測可重現性的重要條件。Vergara 等人使用長期氣體感測資料研究漂移補償，提醒我們保留流量、切換時序與批次資訊。我們的氣室操作值另由固定幾何的傳輸模型提出，並仍需實際量測；該文獻並非細胞系統的流量安全驗證。」

這段放 Model 的氣體模型方法與 Hardware 的供氣／資料紀錄段落，各引用同一篇文獻即可。DLIA 實測複數空白校正有自己的方法來源，不應誤標成 Vergara 分類器方法。
