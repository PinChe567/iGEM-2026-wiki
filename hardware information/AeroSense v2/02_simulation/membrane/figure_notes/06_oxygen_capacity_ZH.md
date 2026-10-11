# 06_oxygen_capacity

![06_oxygen_capacity](../figures/06_oxygen_capacity.png)

## 可供引用的圖說

293 K氧傳遞容量示例，不是存活預測。引用PDMS P／D配合假設液相D=2×10⁻9 m²/s與液面溶氧0.30 mol/m³。(A) 井底濃度為零時的最大穩態供給。(B) 100 µm膜下固定耗氧負載的井底比例，曲線在容量上限停止。負載不是HEK293T實測耗氧；氣體、培養液與37°C控制未經驗證。

## 如何閱讀

井底零濃度的數字是偏有利的容量上限；溫度、培養液、供氣已知後，才能與實測耗氧比較。

## 假設與限制

PDMS資料於293 K；液相D與0.30 mol/m³溶氧是假設。忽略的細胞動態、表面阻力及外部邊界層可能降低供給。

## 原始資料與重跑

`results/oxygen_capacity.csv`, `results/summary.json`.

`python run.py --plots`

參閱[分析報告](../Analysis_ZH.md)的方程、單位、來源與假設。
