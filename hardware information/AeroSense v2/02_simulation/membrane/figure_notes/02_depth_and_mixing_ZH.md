# 02_depth_and_mixing

![02_depth_and_mixing](../figures/02_depth_and_mixing.png)

## 可供引用的圖說

液體路徑敏感度。(A) 固定11.2 mm²截面時井底t90隨液量平方增加；只有100 µL為已確認條件。(B) 有效D倍數只是混合代理，不是已求解流場。100 µm膜使用假設D膜=10⁻10 m²/s、K膜=100、K液=10；液相變快後，膜阻力的重要性上升。

## 如何閱讀

減液量與混合是反事實敏感度，不能據此自行修改100 µL操作。

## 假設與限制

有效D倍數是經驗代理，沒有求解攪拌轉速、細胞剪切力或新CAD。

## 原始資料與重跑

`results/liquid_depth_sweep.csv`, `results/mixing_feed_sensitivity.csv`.

`python run.py --plots`

參閱[分析報告](../Analysis_ZH.md)的方程、單位、來源與假設。
