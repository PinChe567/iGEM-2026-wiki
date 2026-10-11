# 10_interference_sweep · 干擾與雜訊掃參數

## 可投稿圖說

A／B 固定電子 RMS 5 pW/sample、假設響應度比 0.8，呈現最差通道的複數誤差及最低通道 SINR 中位數；C 改變電子雜訊。所有面板也包含假設的光電子散粒雜訊。

## 如何生成與假設

完整掃描 144 組：四種激發阻擋、四種環境光、三種電子 RMS、三種響應度比；每組 32 次固定種子的雜訊重複。MC 平均增益固定，變動的是 Poisson 計數與電子雜訊。

## 結果

提高激發阻擋可減少激發漏光，但無法去除恰好與 LED 同頻的環境光。DC 會影響原始波形誤差，却不一定偏移 AC 解調係數。只有隨機雜訊的 SNR 再高，也不能取消固定漏光偏差。

## 如何讀圖：座標與圖例

A／B 欄為激發 OD，∞ 表示零激發漏光；列為無、DC、100.3 Hz 閃爍或 67 Hz 同頻環境光。A 數字／色為四通道中最大的平均複數誤差，%；B 為最低通道 SINR 中位數，dB。C 橫軸電子 RMS pW/sample、縱軸重複間雜訊向量 SNR；不同顏色表示 LED 頻率。

## 限制

R520=0.3 A/W、R470/R520=0.6／0.8／1 都是假設，沒有實測最佳解。情境只用於敏感度分析，未傳遞 MC 不確定性；取樣保持光電子模型也忽略真實 PWM 邊緣積分與類比濾波。

## 資料與重現

results/interference_sweep.csv; results/interference_sweep_replicates.csv; results/interference_sweep_summary.json

```text
python run.py --plots
```
