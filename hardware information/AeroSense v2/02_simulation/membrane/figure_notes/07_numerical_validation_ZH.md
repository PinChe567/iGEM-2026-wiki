# 07_numerical_validation

![07_numerical_validation](../figures/07_numerical_validation.png)

## 可供引用的圖說

程式數值檢查。(A) 膜延遲與液柱井底t90對解析解的空間細化誤差。(B) 100 µm膜、1 mL/min混合氣腔供氣代表例，48→96液體格的t90變化約0.00405%。時間採矩陣指數；小數值誤差不代表物性假設或生物效能已驗證。

## 如何閱讀

看的是數值誤差百分比，不是生物可信度；細化表示离散模型收斂到對應解析基準。

## 假設與限制

B圖含多層及有限供氣氣腔；吻合不能代替實測膜D／K，也不證明气體到細胞感測成立。

## 原始資料與重跑

`results/numerical_validation.csv`, `results/coupled_convergence.csv`, `results/validation.json`.

`python run.py --plots`

參閱[分析報告](../Analysis_ZH.md)的方程、單位、來源與假設。
