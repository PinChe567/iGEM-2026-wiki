# 04_PDMS_coupled_sweep

![04_PDMS_coupled_sweep](../figures/04_PDMS_coupled_sweep.png)

## 可供引用的圖說

100 µL、D液=10⁻9 m²/s、K液=10的PDMS–氣體–液體疊層井底t90。(A) K膜/氣=1；(B) K膜/氣=100。列為假設膜D，欄為厚度，格內數字為小時；灰格表示168小時仍未達90%。不能將這些假設對應成某VOC或固化配比的量測值。

## 如何閱讀

畫出的40格是243組中的切片。灰格是未達門檻，不是完全沒有傳遞；未知目標物性時沒有通用最佳厚度。

## 假設與限制

指定井口階躍、100 µL、無液體對流／反應及固定線性分配；長時間數學計算不表示細胞能穩定維持。

## 原始資料與重跑

`results/membrane_sweep.csv`.

`python run.py --plots`

參閱[分析報告](../Analysis_ZH.md)的方程、單位、來源與假設。
