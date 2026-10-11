# 氣體供應與漂移文獻

更新日期：2026-10-06。[English](Gas_Delivery_Reference_EN.md)。本文件補充文獻脈絡，不改變已保存的 CFD 結果或列印幾何。

## 完整引用

Alexander Vergara, Shankar Vembu, Tuba Ayhan, Margaret A. Ryan, Margie L. Homer, Ramón Huerta. Chemical gas sensor drift compensation using classifier ensembles. *Sensors and Actuators B: Chemical*, 166–167 (2012), 320–329. ISSN 0925-4005. [DOI 10.1016/j.snb.2012.01.074](https://doi.org/10.1016/j.snb.2012.01.074)。可匯入的引用：[references.bib](references.bib)。

主要來源是使用者提供的摘要、出版者 DOI，以及作者存放的 [UCI Gas Sensor Array Drift Dataset](https://archive.ics.uci.edu/dataset/224/gas%2Bsensor%2Barray%2Bdrift%2Bdataset)。UCI 說明以 16 個化學感測器量測六種氣體、共 13,910 筆量測，並記錄不同時間批次。全文方法此次未取得，因此沒有引用無法核對的原文流量、氣室容積或切換時序。

## 可用在本專案的地方

這篇工作說明受控供氣、跨時間批次與漂移會影響氣體感測資料的判讀。AeroSense 因此應記錄完整管路下的實際流量、樣本與空白的切換時間、濃度來源、溫濕度（有量才填）、細胞批次、光學校正及量測日期。固定標準品與保留空白能幫助辨認日間差異；它們不等同於已完成論文的分類器集成方法。

本系統採共用氣室、單一下游受控抽氣，3 mL/min 是本專案固定 CAD 掃描下的條件式候選。Vergara 等人的金屬氧化物感測器不能替代 HEK293T 的實驗，也不替 3 mL/min、約 50 秒氣相 t90、細胞存活或 VOC 吸收背書。不要把文獻的感測器流量直接縮放成細胞安全流量。

## 可放進 Wiki 的文字

「受控供氣與跨批次資料紀錄是化學感測可重現性的重要條件。Vergara 等人使用長期氣體感測資料研究漂移補償，提醒我們保留流量、切換時序與批次資訊。我們的氣室操作值另由固定幾何的傳輸模型提出，並仍需實際量測；該文獻並非細胞系統的流量安全驗證。」

這段放 Model 的氣體模型方法與 Hardware 的供氣／資料紀錄段落，各引用同一篇文獻即可。DLIA 實測複數空白校正有自己的方法來源，不應誤標成 Vergara 分類器方法。
