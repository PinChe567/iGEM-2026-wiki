# operating_delivery.png

## 圖說

固定平台的流量與氣相擴散係數掃描；每格為四井最慢氣相t10、t50或t90。

## 方法

固定STL、21組守恆三維氣相對流擴散；低Re速度場按Q縮放，液面不吸收。

## 結果

在此次取樣範圍中，符合預先聲明條件的最小流量候選為 **3 mL/min**，最差井／最差D的氣相t90為 **50.00秒**。

## 如何閱讀／所有座標與圖例

三面板依序t10、t50、t90；X為Q mL/min、Y為Dgas mm²/s，色条為共同對數時間秒，格內是實際秒數。

## 資料與重現

`operating_sweep.csv`, `operating_results/*.csv/*.json`, `operating_sweep_config.json`; `python operating_sweep.py --run --checks --refine --selected-checks`; `python operating_figures.py`; `node test_operating.cjs`.

## 限制

氣側時間不是細胞反應時間。0.01 mm/s不是生物安全值；管路、濾器、液體、吸附、細胞皆未模擬。數值檢查見Flow_Operation_ZH.md；互動只做Node／資料測試，未做瀏覽器操作驗證。
