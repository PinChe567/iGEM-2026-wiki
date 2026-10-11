# hole_sweep_3d.html

## 圖說

互動圖｜每一點對應一個已計算的孔板幾何。

## 方法

使用同一份hole_sweep.csv的18筆資料，瀏覽器內原生投影，不依賴網路或CDN。

## 結果

可檢查孔徑、節距、位置的交互影響；顏色可切換動量、近液面氣速、壓降或開孔率。

## 如何閱讀與座標／圖例

X孔徑、Y節距、Z入口中心至孔板頂距離，皆mm；並非孔密度軸。拖曳/方向鍵旋轉，滾輪縮放，移到點上看值與原始JSON。

## 原始資料與重現

`hole_sweep.csv`; `scatter_math.js`, `scatter_ui.js`; `python supplemental_figures.py`; `node test_interactive.cjs`.

## 限制

只做來源、資料、旋轉數學與控制對應測試；本次工作環境限制導致沒有瀏覽器互動實測。
