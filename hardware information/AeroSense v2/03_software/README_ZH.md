# AeroSense 軟體：從開機到存下第一筆資料

本資料夾包含真正可執行的手機網頁、ESP32 韌體、電腦伺服器與分析程式。先讀 `guides/操作與設定_ZH.md`，照「示範 → 接線燒錄 → 暗訊號 → 開燈檢查 → 校正 → 量測」順序操作。第一次不需要租雲端伺服器。

要使用亮燈背景扣除、有號相位投影與畫面時間平均，請接著讀[實測背景校正](guides/Measured_Correction_ZH.md)。這是使用者主動啟用的瀏覽器處理，原始 I/Q 保留。必須量測無細胞亮燈空白及另外的螢光相位參考；不能用模擬波形或活細胞 F0 代替空白。

| 位置 | 用途 |
|---|---|
| `firmware/src/main.cpp` | ESP32 控制 LED、讀外接 ADC、DLIA、提供本機 API、上傳結果 |
| `firmware/src/config.example.h` | 設定範本；複製為同目錄的 `aerosense_config.h` 再填私人設定 |
| `firmware/data/` | 中英文手機控制網頁；須一起燒錄 LittleFS |
| `firmware/data/correction.js` | 實測複數空白扣除、參考相位投影、QC 與依裝置時間計算的畫面 EMA |
| `server/server.py` | 電腦／雲端主機接收資料、排入指令、保存 SQLite；可明確啟用示範模式 |
| `analysis/dlia.py` | 電腦端原始訊號解調；與 MCU 簡化 I/Q 不完全相同 |
| `analysis/odor_model.py` | 研究用小型神經網路訓練／推論；沒有附虛構的氣味模型 |
| `guides/` | 設定、按鍵、校正、操作、排錯與原理說明 |
| `templates/` | 空白實驗與訓練資料表 |
| `evidence/` | 實際執行的軟體測試結果與原理圖核對證據 |

## 先試介面，不接 PCB

在本資料夾開啟終端機，執行：

```powershell
python server/server.py --demo
```

同一台電腦開 `http://127.0.0.1:8765/`，API key 輸入 `local-demo-key`，按「連線」。畫面必須顯示「示範資料」。這些數字只能用來練習介面，不能放入實驗結果。

## 重跑檢查

安裝 Python 3.11 以上與 Node.js 後，在本資料夾執行：

```powershell
python -m pip install -r requirements.txt
python test_software.py
python test_model.py
node test_calibration.cjs
node test_correction.cjs
node test_ui.cjs
node --check firmware/data/app.js
```

測試會在 `evidence/` 輸出 JSON。韌體使用 PlatformIO，詳見操作指南。此測試不會接觸硬體、不會量到實際螢光，也不能證明實板時序正確。

## 已知限制

PCB 尚未到手。預設 `BOARD_VALIDATED=false`，只允許 LED 全關取樣；在供電、ADC 時序與單燈波形驗證以前不要解除。韌體未經實板燒錄測試，不能保證 Wi-Fi 啟用時仍滿足 4 kHz 取樣時序。

原理圖的 TIA 正端與 ADC 負端接地，暗訊號可能靠近 ADC 下限。若讀值被下限截斷，保留失敗資料並請電路協助者檢查工作點；不要改掉 `valid` 判斷來湊出校正結果。

同頻率 LED 反射漏光與材料背景也會進入對應 DLIA 通道。四個頻率不等於四個已分離的 well；光學串擾仍須實測。

裝置 RAM 最多保留 8 組待上傳摘要，原始 ADC 只留最後一組，重新開機會清掉 RAM。手機畫面只保留最近 1,000 組已看見的摘要；請每次實驗後匯出。

沒有電池電量、細胞溫度、氣流量、風扇轉速或氣閥控制感測／驅動電路；UI 不會假裝提供這些數值。公開網際網路部署尚未完成，兩週內先使用直接連線或私人區網。
