# gas_delivery.png

## 圖說

圖5｜氣體可以在速度示蹤點幾乎不動時由分子擴散到達井內。

## 方法

保存速度場上做保守有限體積法：後向Euler、迎風對流、中心擴散；入口C/Cin=1階躍、初始0、出口對流、壁面及液面無通量。Dgas=5/10/20mm²/s是敏感性假設。

## 結果

選定平台D=10時NE近液面氣相t90=149.55s；局部Pe95≈0.000334、Re95≈0.000222。3.57mm氣隙L²/D≈1.276s，但整個入口／氣室供樣約150s，兩者不可混為一談。

## 如何閱讀與座標／圖例

A橫軸秒、縱軸近液面氣相平均C/Cin，四色NE/NW/SW/SE；B橫軸Dgas mm²/s、縱軸四井最慢t90秒，兩線為無擋板與平台。D增加未必使此開放流動邊界問題的t90單調下降。

## 原始資料與重現

`gas_transport_results/*.csv/*.json`; `python gas_transport.py --run --checks`; `python supplemental_figures.py`.

## 限制

這是液面上方氣體，不是底部HEK293T收到刺激的時間。液深8.93mm；見`../../membrane/Analysis_ZH.md`的液體／PDMS情境。無吸收液面假設不能代表有吸收時的雙向耦合。
