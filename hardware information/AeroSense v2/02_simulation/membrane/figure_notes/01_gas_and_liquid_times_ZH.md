# 01_gas_and_liquid_times

![01_gas_and_liquid_times](../figures/01_gas_and_liquid_times.png)

## 可供引用的圖說

無膜、無反應的一維擴散階躍。(A) 已確認8.929 mm液柱在三個假設液相擴散係數下的井底解析解；液面瞬間固定，並非實測細胞反應。(B) 孤立3.571 mm氣層，井口濃度瞬間固定、底部不可穿透；零氣速、假設D=10⁻5 m²/s時t90約1.315秒。它不含上游換氣與液體吸收，不是入口到井口約149秒的CFD結果。兩圖時間單位不同。

## 如何閱讀

注意小時與秒：氣體到達和液相傳遞是不同過程。

## 假設與限制

8.929 mm液柱已確認；D、靜止液體及液面瞬間固定是假設。未模擬細胞吸收、結合、混合與GCaMP。

## 原始資料與重跑

`results/liquid_depth_sweep.csv`, `results/summary.json`.

`python run.py --plots`

參閱[分析報告](../Analysis_ZH.md)的方程、單位、來源與假設。
