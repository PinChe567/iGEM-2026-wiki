# operating_sweep_3d.html

## 圖說

互動操作參數圖：21個真正計算條件，可切換反應時間、顏色與暫定目標。

## 方法

固定STL、21組守恆三維氣相對流擴散；低Re速度場按Q縮放，液面不吸收。

## 結果

在此次取樣範圍中，符合預先聲明條件的最小流量候選為 **3 mL/min**，最差井／最差D的氣相t90為 **50.00秒**。

## 如何閱讀／所有座標與圖例

X為Q對數刻度、Y為Dgas，Z可選最差井t10/t50/t90秒。顏色可選氣速、氣室壓降、入口Re或t90；描邊表示所有D都過條件的最低Q。D不是控制鈕，改目標不改已生成報告。

## 資料與重現

`operating_sweep.csv`, `operating_results/*.csv/*.json`, `operating_sweep_config.json`; `python operating_sweep.py --run --checks --refine --selected-checks`; `python operating_figures.py`; `node test_operating.cjs`.

## 限制

氣側時間不是細胞反應時間。0.01 mm/s不是生物安全值；管路、濾器、液體、吸附、細胞皆未模擬。數值檢查見Flow_Operation_ZH.md；互動只做Node／資料測試，未做瀏覽器操作驗證。
