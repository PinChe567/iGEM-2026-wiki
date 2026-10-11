# 05_frequency_recovery · 四種 PD 訊號比較

## 可投稿圖說

A：理想、無雜訊的收到螢光。B：加入 MC 激發漏光與假設環境光、光電子散粒雜訊及電子雜訊。C：疊圖。D：收到訊號減掉理想訊號。

## 如何生成與假設

使用四顆 LED 各自的 OD3 綠光／漏光 MC 增益；NE／NW／SW／SE 對應 89／113／41／67 Hz、25% duty。預設 R470/R520=0.8、R520=0.3 A/W；環境光為 0.15+0.05 cos(2π100.3t+0.4) nW 等效值；電子 RMS 0.005 nW。Poisson 計數以 250 µs 離散取樣格計算，將閘門保持在該取樣時刻狀態，沒有積分格內 PWM 邊緣。

## 結果

完整兩秒的 RMSE 為 0.17631 nW，殘差 DC 為 0.17155 nW、AC RMS 為 0.04067 nW，波形 AC SINR 為 23.40 dB。這些只量化指定情境，不是實板準確度。

## 如何讀圖：座標與圖例

橫軸皆為前 120 ms；縱軸是綠光等效 nW。A／B／C 使用相同縱軸，D 另有尺度。綠為理想、橘為收到訊號、紫為殘差。理想螢光仍保留有效的反射綠光與既有井間混合。

## 限制

環境光、雜訊及響應度都是假設，不是實測。等效 nW 不是單純光功率或 ADC 電壓。殘差包含漏光、環境光、散粒與電子雜訊，不能全部叫反射干擾。未模擬細胞活化、TIA 頻寬、飽和、暗電流及時序抖動。

## 資料與重現

results/frequency_traces.npz; results/frequency_summary.json; results/leakage_MC_summary.json; signal_model.py

```text
python run.py --plots
```
