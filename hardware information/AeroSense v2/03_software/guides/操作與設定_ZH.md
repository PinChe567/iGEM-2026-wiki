# AeroSense 操作與設定手冊

本手冊說明第一次燒錄、手機連線、按鍵、背景校正與資料匯出。先完成不含細胞的硬體檢查。UI 顯示數值不代表已驗證 GCaMP 或氣味辨識。日期：2026-10-08。

英文採 ASD-STE100 第 9 版原則，中文採對應步驟。未進行完整詞彙與語法符合性審查。命令、API 名稱與 UI 按鈕保留原文，方便逐字比對。

## 1 選擇連線方式

| 模式 | 開啟位置 | 資料 |
|---|---|---|
| Demo | 電腦 http://127.0.0.1:8765/ | 合成資料，只用於練習 |
| 手機直連 | 連 AeroSense Wi-Fi，再開 http://192.168.4.1/ | PCB 真實讀值 |
| 私有區網伺服器 | 手機開伺服器區網網址 | PCB 上傳摘要 |

先完成手機直連。這不需要網際網路，也不代表資料已上雲端。GitHub Pages 不能執行本專案的 Python 伺服器或保存 SQLite 資料庫。

## 2 準備燒錄連接

準備：電腦、VS Code、官方 PlatformIO IDE 擴充套件、USB 資料線、3.3 V 邏輯 USB-to-TTL 轉接器及三條訊號線。USB-to-TTL 與本手冊的 USB–UART 指同類裝置。已有相容轉接器就不必再買。

J2 USB-C 只有供電與充電，沒有 USB–UART 橋接晶片。因此 J2 不會產生 ESP32 燒錄 COM 埠。燒錄訊號接 J3；PCB 則由廠商確認的正常電源入口供電。

| J3 腳位 | 訊號 | 接法 |
|---|---|---|
| 1 | 3V3_DIG | 留空 |
| 2 | TXD0，GPIO1 | 接轉接器 RX |
| 3 | RXD0，GPIO3 | 接轉接器 TX |
| 4 | GND | 接轉接器 GND |

1. 關閉 PCB 電源。

2. 拔除轉接器的 USB 線。

3. 依實板標記辨認 J3 的第 1 腳。

4. 確認轉接器 TX 邏輯電壓為 3.3 V。

5. 將 J3 第 2 腳接到轉接器 RX。

6. 將 J3 第 3 腳接到轉接器 TX。

7. 將 J3 第 4 腳接到轉接器 GND。

8. 確認 J3 第 1 腳未接線。

9. 將轉接器接上電腦。

10. 以廠商確認的正常方式供應 PCB 電源。

確認：TX/RX 交叉且共地。不可使用 RS-232 或 5 V TX。轉接器的 3.3/5 V 跳線可能只改 VCC，不改 TX 邏輯。正常電源與轉接器 VCC 不得並接。已使用合格電池供電時，不必為了燒錄再加 J2 供電。

原理圖局部見 [J3 接線圖](../evidence/uart_schematic_crop.png)。這確認的是圖面訊號，不是實板左到右的排列。按鈕：SW1 電源、SW2 EN 重置、SW3 BOOT。

## 3 建立私人設定並編譯

1. 在 VS Code 安裝官方 PlatformIO IDE 擴充套件。

2. 開啟 03_software/firmware 資料夾。

3. 將 src/config.example.h 複製為 src/aerosense_config.h。

4. 將 AP_PASSWORD 設為至少八個 ASCII 字元的私人密碼。

5. 將 API_KEY 設為私人隨機字串。

6. 保留空白的 WIFI_SSID 與 CLOUD_URL。

7. 保留 BOARD_VALIDATED=false。

8. 儲存設定檔。

9. 在 PlatformIO 開啟 New Terminal。

若私人設定檔已存在，先保留原內容，不要直接覆蓋。可用下列 PowerShell 命令產生 32 字元字串。AP_PASSWORD 是 Wi-Fi 密碼；API_KEY 是網頁控制金鑰，兩者用途不同。

```powershell
[guid]::NewGuid().ToString("N")
```

先執行第一行，確認 SUCCESS 後才執行第二行。

```powershell
pio run -e esp32dev
pio run -e esp32dev -t buildfs
```

確認：兩次都顯示 SUCCESS。第一個建立 firmware；第二個建立含五個網頁檔案的 LittleFS。若失敗，保存第一個錯誤訊息，先處理編譯或依賴問題，不繼續燒錄。不要公開 aerosense_config.h。

## 4 燒錄 firmware

準備：在 Windows 裝置管理員找到 USB–UART 的 COM 埠。下列 COM7 只是範例，請換成自己的埠。先關閉序列監控器，避免占用 COM 埠。

1. 在終端機輸入下列命令，但先不要按 Enter。

2. 按住 SW3。

3. 短按 SW2 後放開 SW2。

4. 繼續按住 SW3。

5. 在終端機按 Enter。

6. 等工具辨認 ESP32 或開始 Writing 後，放開 SW3。

7. 等待 SUCCESS。

```powershell
pio run -e esp32dev -t upload --upload-port COM7
```

確認：上傳完成；不是只出現 Connecting。若一直等待連線，斷電後檢查 COM 埠、TX/RX、共地與 3.3 V 邏輯，再重做本節。三線 UART 沒有自動重置接線。

## 5 燒錄網頁並啟動

1. 輸入下列 uploadfs 命令，但先不要按 Enter。

2. 按住 SW3。

3. 短按 SW2 後放開 SW2。

4. 繼續按住 SW3。

5. 在終端機按 Enter。

6. 等工具辨認 ESP32 或開始 Writing 後，放開 SW3。

7. 等待 SUCCESS。

8. 確認 SW3 已放開。

9. 短按 SW2。

```powershell
pio run -e esp32dev -t uploadfs --upload-port COM7
pio device monitor --port COM7 --baud 115200
```

第二行用來查看啟動訊息。若剛好錯過啟動輸出，在監控開啟後再按一次 SW2。預期固定訊息為：

```text
AeroSense AP http://192.168.4.1; upload filesystem before opening UI.
```

這是固定提醒文字，不代表 LittleFS 上傳失敗。只有 firmware 成功而沒有 uploadfs，網頁仍可能 404。下次上傳前按 Ctrl+C 關閉監控器。

## 6 手機第一次連線

1. 在手機選擇 AeroSense Wi-Fi。

2. 輸入 AP_PASSWORD。

3. 若手機顯示沒有網際網路，選擇保持連線。

4. 在瀏覽器開啟 http://192.168.4.1/。

5. 在頁面輸入 API_KEY。

6. 按 Connect。

7. 確認模式顯示 HARDWARE。

8. 將 LED selector 改為 Dark / all off。

9. 將 Blocks 設為 1。

10. 將 Interval 設為 3 秒。

11. 按 Start session。

12. 查看資料的 valid 與錯誤欄位。

確認：BOARD_VALIDATED=false 會禁止亮燈，這是開發鎖，不是燒錄故障。UI 預設可能是四燈，必須主動選 Dark。若出現 ADC_rail 或 timing 錯誤，保存 raw ADC，停止校正。

## 7 解除開發鎖前的必要檢查

由電子工程協作者確認電源軌、2.5 V 參考、ADC 工作點與取樣時序。標為 5 V 的節點不能只憑名稱當成已量到 5 V。若暗場碰到 ADC 下限，不能宣稱雜訊極低。

1. 保存量測電壓、ADC raw codes 與時序檢查紀錄。

2. 確認檢查結果符合實際電路要求。

3. 由協作者將 BOARD_VALIDATED 改成 true。

4. 重新編譯 firmware。

5. 依第 4 節重新燒錄。

6. 使用不含細胞的樣本。

7. 選擇單一 LED。

8. 將 PWM duty 設為 5%。

9. 記錄一個 block。

10. 檢查飽和、頻率與取樣錯誤。

這個旗標只是操作者設定，不是驗證證據。確認各 LED 後才使用四燈模式。遇到異常時，不要靠提高亮度或降低軟體門檻掩蓋。

## 8 按鍵與參數

| 控制項 | 功能 | 使用方式 |
|---|---|---|
| Blocks | 每次 1 至 60 個區塊 | 初測 1，校正 5 |
| Interval | 每區塊結束後關燈等待 3 至 300 秒 | 不含兩秒取樣時間 |
| PWM duty | 1 至 50% 開燈比例 | 初測 5%；比較時固定 |
| LED selector | 全關、單燈、四燈 | 暗場主動選全關 |
| Start session | 啟動有限次量測 | 確認設定後按一次 |
| Stop / LEDs off | 取消剩餘區塊，丟棄未完成區塊 | 失去網路時用 SW1 斷電 |
| Add dark / baseline / reference | 加入最新有效區塊 | 同區塊不可重複 |
| Automatic capture | 收集後續有效區塊至五個 | 保持網頁開啟 |
| Clear calibration | 清除三組校正 | 條件變更後使用 |
| Condition ID | 背景校正的組態識別 | 記錄板、井、液量、濾片 |
| Current sample label | 標記新接收的資料 | 不會回頭改舊資料 |
| Display smoothing τ | 校正後 I/Q 的顯示平均 | 0 關閉；保留未平滑值 |
| Export JSON / CSV | 匯出目前瀏覽器紀錄 | 每次實驗後及重整前匯出 |
| Download latest raw ADC | 下載 ESP32 最近一個原始區塊 | 直連模式，下一區塊前下載 |
| Analyze with server research model | 呼叫另行訓練的研究模型 | 無實際模型時不使用 |

固定頻率：D1 41 Hz、D2 67 Hz、D3 89 Hz、D4 113 Hz。GPIO 依序 25、26、27、32。每區塊名義 4 ksample/s、8,000 點、2 秒。D1 至 D4 是電路位號，不應自行等同 NE 至 SE。

valid 只表示通過已實作的點數、ADC rail 與時序檢查。railSamples 是接近上下限的點数；maxIntervalErrorUs 是相鄰取樣間距相對 250 µs 的最大偏差。系統沒有實測電池、細胞溫度、風扇轉速、氣流或氣閥狀態。

## 9 選擇校正流程

建議採本文件後半部的「Measured background correction」。流程是亮燈無螢光空白 → 螢光相位參考 → 樣本。細胞實驗另收未刺激細胞 F0。空白不是 F0；不能重複扣暗場。

舊版 Dark/Baseline/Reference 僅在 measured blank subtraction 關閉時使用。下列步驟保留此流程，避免舊資料無法重現。

1. 關閉 measured blank subtraction。

2. 清除舊校正。

3. 關上遮光蓋。

4. 選擇 Dark。

5. 取得一個有效區塊。

6. 選擇 Automatic capture Dark。

7. 量測到 Dark 顯示 5/5。

8. 放入尚未刺激的同批細胞，或無細胞標準。

9. 選擇 D1 至 D4。

10. 依實驗室程序等待基線穩定。

11. 選擇 Automatic capture Baseline。

12. 取得五個有效基線區塊。

13. 記錄刺激開始時間。

14. 依既定實驗程序施加樣本。

15. 量測反應。

16. 匯出 JSON。

舊流程先分別扣除平均 dark I 與 Q，再計算幅值 F。F0 是基線幅值平均；結果為 (F−F0)/F0。若已有實驗室驗證的標準刺激，可另外收五個 Reference，再計算 (F−F0)/(Fref−F0)。不在此臆定藥劑或氣味濃度。

低於五倍內部雜訊門檻的分母會拒絕計算；這不是實測偵測極限。更換細胞、液量、well、濾片或 duty 後重新校正。軟體無法自動察覺未記錄的細胞或液體更换。

## 10 執行一次量測並保存資料

1. 確認外殼內沒有漏液。

2. 記錄裝置、樣本、濃度單位、批號與操作者。

3. 記錄每井實際液量。

4. 記錄氣體、實測流量與開始時間。

5. 確認 HARDWARE 模式。

6. 選擇本次唯一的校正流程。

7. 設定 Current sample label。

8. 啟動有限次量測。

9. 檢查每個區塊的 QC。

10. 按 Export JSON。

11. 按 Export CSV。

12. 保存檔案到本次實驗資料夾。

13. 按 Stop / LEDs off。

14. 確認 LED 已關閉。

15. 停止氣流。

建議檔名：date_device_sample_condition_replicate。保留失敗紀錄及原因。需要原始 ADC 時，每次只跑一個 block，立即下載後才啟動下一個。ESP32 只留最近一個 raw block；上傳佇列僅在 RAM 保留八筆摘要。重開機會失去待傳資料。瀏覽器最多保留 1,000 個觀察區塊，重新整理前務必匯出。

液量以 80 µL 作為待確認工作量；先完成無細胞蓋合試驗。不要根據舊的 100 µL 模擬宣稱此次容量已驗證。操作過程不開蓋、不換井、不拉管。

## 11 啟用私有區網伺服器

準備：直連控制已正常。電腦與 PCB 使用同一私有路由器。每個伺服器只配一片 PCB；兩片 PCB 使用不同埠、資料庫及裝置金鑰。

在 03_software 的終端機執行下列命令。兩個金鑰都換成自己的不同隨機值。

```powershell
$env:AEROSENSE_UI_KEY='your-private-phone-key'
$env:AEROSENSE_DEVICE_KEY='your-private-device-key'
python server/server.py --host 0.0.0.0 --port 8765 --db aerosense.sqlite
```

1. 在 firmware 設定中填入路由器名稱與密碼。

2. 將 CLOUD_URL 設為 http://HOST_LAN_IP:8765。

3. 將 CLOUD_DEVICE_KEY 設為伺服器裝置金鑰。

4. 僅於私有區網測試時設 ALLOW_LAN_HTTP=true。

5. 重新編譯並燒錄 firmware。

6. 在手機開啟同一個伺服器網址。

7. 輸入 AEROSENSE_UI_KEY。

8. 確認裝置最後連線時間與回報狀態。

HOST_LAN_IP 換成電腦實際區網 IP。不要填 127.0.0.1；對 ESP32 而言那是它自己。狀態在區塊間更新，會延遲。公開網路部署還需要 HTTPS、存取控制與正確 CLOUD_CA_PEM，本套件未代為部署。

## 12 排除問題

| 現象 | 動作 | 通過條件 |
|---|---|---|
| J2 接電腦沒有 COM | 使用 J3 與 USB–UART | 裝置管理員出現轉接器 |
| 一直 Connecting | 檢查交叉接線後重做 BOOT 與 EN | 上傳 SUCCESS |
| Wi-Fi 正常但網頁 404 | 執行 buildfs 與 uploadfs | 首頁可開啟 |
| 401 | 輸入目前装置或伺服器的 API key | Connect 成功 |
| board_not_validated | 保持 Dark，完成第 7 節 | 實體檢查留有紀錄 |
| ADC_rail | 保存 raw ADC，檢查偏壓與飽和 | 有效未夾限資料 |
| timing 或 jitter 錯誤 | 保存失敗資料，請協作者檢查時序 | 不再出現無效區塊 |
| baseline_below_noise | 檢查空白、標準與光學路徑 | 參考訊號足夠 |
| upload_queue_full | 恢復伺服器連線並等重傳 | 佇列排空後再量測 |
| no_trained_model_installed | 使用量測及匯出功能 | 不臆造分類結果 |

## 13 解讀結果與參考資料

DLIA 分離的是調變頻率。LED 同頻反射光、材料螢光與跨井螢光仍會進入同一通道。不能以增加固定抵消波或任意平移數據，保證去除未知干擾。背景扣除方法與限制見下一部分。

firmware 使用固定取樣時刻的 I/Q；離線 dlia.py 可使用實際時間戳與聯合最小平方。保留 raw ADC 才能比較。模型與合成資料測試不等於實板、細胞或氣味辨識成功。

技術依據：廠商原理圖第 1 至 2 頁；[Espressif BOOT 與 EN](https://docs.espressif.com/projects/esptool/en/latest/esp32/advanced-topics/boot-mode-selection.html)；[PlatformIO IDE](https://docs.platformio.org/en/latest/integration/ide/vscode.html)；[ASD-STE100](https://www.asd-ste100.org/)。

### Demo 練習

準備：電腦已安裝 Python 3；此模式不連接 PCB。

1. 在 03_software 資料夾開啟終端機。
2. 執行下列命令。

```text
python server/server.py --demo
```

3. 用同一台電腦開啟 http://127.0.0.1:8765/。
4. 確認頁面標示 DEMO。

只用來練習按鍵與匯出。合成資料不是硬體或細胞的測量結果。結束時在終端機按 Ctrl+C。
