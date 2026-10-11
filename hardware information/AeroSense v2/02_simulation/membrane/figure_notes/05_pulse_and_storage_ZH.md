# 05_pulse_and_storage

![05_pulse_and_storage](../figures/05_pulse_and_storage.png)

## 可供引用的圖說

代表性100 µL疊層的20分鐘指定氣體脈衝。(A) 井底濃度除以K液乘輸入氣相濃度，峰值可在停氣後才出現。(B) 可逆PDMS儲存量除以輸入氣相濃度，換成每井氣相等效體積。D膜=10⁻10、D液=10⁻9 m²/s、K液=10；未模擬不可逆吸附或受體適應。

## 如何閱讀

部分井底曲線重疊是計算結果，不是漏資料；K提高同時增加導度與儲存，因此延遲不一定變長。

## 假設與限制

20分鐘方波、線性可逆分配、固定物性且無化學或受體動力學；不是已量測的清洗回復時間。

## 原始資料與重跑

`results/pulse_histories.csv`, `results/case_summary.csv`.

`python run.py --plots`

參閱[分析報告](../Analysis_ZH.md)的方程、單位、來源與假設。
