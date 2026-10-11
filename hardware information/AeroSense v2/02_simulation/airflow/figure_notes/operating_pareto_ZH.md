# operating_pareto.png

## 圖說

氣相供樣時間與近液面氣速的非支配取捨；圓圈標出符合預設條件的最低取樣流量。

## 方法

固定STL、21組守恆三維氣相對流擴散；低Re速度場按Q縮放，液面不吸收。

## 結果

在此次取樣範圍中，符合預先聲明條件的最小流量候選為 **3 mL/min**，最差井／最差D的氣相t90為 **50.00秒**。

## 如何閱讀／所有座標與圖例

X近液面氣體P95速度mm/s；Y四井／三D最慢t90秒。点旁Q是mL/min；虛線60秒；黑圈為條件式選擇，非全域最優。

## 資料與重現

`operating_sweep.csv`, `operating_results/*.csv/*.json`, `operating_sweep_config.json`; `python operating_sweep.py --run --checks --refine --selected-checks`; `python operating_figures.py`; `node test_operating.cjs`.

## 限制

氣側時間不是細胞反應時間。0.01 mm/s不是生物安全值；管路、濾器、液體、吸附、細胞皆未模擬。數值檢查見Flow_Operation_ZH.md；互動只做Node／資料測試，未做瀏覽器操作驗證。
