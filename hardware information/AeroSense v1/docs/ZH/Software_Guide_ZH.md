# 手機介面與ESP32上手

提供兩條路徑：①手機與ESP32直接連線，使用ESP32內建網頁；②ESP32主動向伺服器上傳／領取指令，手機開伺服器網頁。兩者共用相同UI與資料結構。示範伺服器使用合成數據，標示DEMO，不會自動切成實機數據。

最快先試：安裝Python 3.12，開software/server資料夾終端機，執行 python server.py --demo。電腦開http://127.0.0.1:8765，API key填local-demo-key。按連線、開始排程，確認DEMO標籤、四路數據與停止。這不需要PCB或付費雲端。

手機試用：電腦與手機接同一可信Wi-Fi，設定AEROSENSE_UI_KEY與AEROSENSE_DEVICE_KEY兩個不同密鑰，再用 --host 0.0.0.0啟動；手機開電腦的區網IP:8765。伺服器預設只綁本機；此套件不替你公開網際網路服務，也不含雲端帳號。

介面：中英文切換、有限組數排程、duty、全關／單LED／四LED、結果品質、校正收集、ΔF/F0與參考值、JSON／CSV匯出、直連時原始ADC下載。無電池／細胞溫度感測器時顯示未配置，不捏造數據。

# 燒錄與首次實機連線

1. 安裝PlatformIO。software/firmware內platformio.ini固定espressif32@6.10.0、ArduinoJson@6.21.5。用短英文路徑解壓（例如C:/AeroSense），Windows長路徑可能使編譯器找不到子程序。執行pio run編譯；pio run -t buildfs建立UI檔案系統。

2. 複製src/config.example.h成src/aerosense_config.h，填Wi-Fi、AP密碼、API key。不要把填好的檔案傳到wiki。BOARD_VALIDATED預設false，只允許全關LED的暗取樣；完成電源、ADC與示波器LED檢查後才改true重新編譯。

3. J2 USB-C沒有證據是USB轉UART。使用3.3V邏輯USB-UART與J3，共地、交叉TX/RX，原理圖J3：1=3V3_DIG、2=TXD0(GPIO1)、3=RXD0(GPIO3)、4=GND；以接頭pin1標記確認方向。主電源供電時不接UART VCC；禁止接5V UART。以SW3將GPIO0拉低並用SW2 reset進下載模式，執行pio run -t upload，接著pio run -t uploadfs。再reset正常開機。

4. 手機連AeroSense AP，開http://192.168.4.1，用設定的API key登入。或等ESP32連入實驗室Wi-Fi後以其IP連線。AP模式本身不是跨網際網路遠端。先做暗組與ADC原始碼值檢查，再做有光量測。

原始碼已實際編譯；預設韌體不包含你的網路密鑰，亦未燒錄或測過實板。編譯成功證明語法／連結與容量可接受，不能證明ADC時序在Wi-Fi負載下符合要求。

# 通訊、資料保存與雲端

| 項目 | 行為 |
| GET /api/status | 模式、狀態、最新量測及品質 |
| POST /api/command | start/stop；blocks1-60、intervalSec3-300、duty1-50、ledMask0-15 |
| GET /api/raw.csv | 直連ESP32下載最近組；取樣時拒絕 |
| POST /api/device/result | 設備密鑰上傳，result ID去重，SQLite保存 |
| GET /api/device/poll | 設備主動領取有限有效期指令 |
| POST /api/device/ack | 回覆執行／拒絕原因 |
| POST /api/predict | 伺服器研究模型推論；無模型明確拒絕 |

區網用X-Aero-Key，設備用不同X-Device-Key。跨網路部署必須HTTPS反向代理，ESP32指定CA憑證，不使用setInsecure。ALLOW_LAN_HTTP只能在私有區網測試時開；不要把明文控制端點直接暴露公網。server.py是研究用服務，正式多人服務需自行部署、備份和權限管理。

ESP32以RAM保存最新原始組與最多8組待上傳摘要，佇列滿就停止後續量測，重開機會丟失未保存資料。雲端保存摘要，完整ADC需每組直連下載或擴充持久儲存。本UI保留最近1000組瀏覽器收到的摘要；開新頁不會自動補齊過往歷史，完整歷史用伺服器/api/export.json。

停止是網路指令，不是硬接線緊急停止。即使失聯，每組曝光最多2秒，但已設定的有限本地排程可繼續。需要立即斷電用SW1。UI不控制氣閥、溫度或風扇轉速，因PCB沒有對應驅動／感測連線。

# 校正操作與分析重現

先全關LED取得暗訊號5組，每一組完成後按「加入暗訊號」，同一id不能重複加入。換成四LED、匹配空白取得基線5組，每組按「加入基線」。加入標準刺激後依固定時間點取得至少5組，按「加入標準刺激」。改duty、細胞或井後清除校正重做。

校正在此瀏覽器本機保存，密鑰只在本頁記憶體中。匯出的JSON包含原始I/Q、振幅、校正紀錄和正規化結果；CSV是LED振幅簡表。不要把含細胞實驗記錄或網路密鑰混進公開wiki下載包。

software/analysis/dlia.py提供timestamp-aware joint least squares、複數串擾反解與48組合成數據掃描；韌體使用固定窗I/Q，其差異已列在分析報告。python dlia.py --sweep可重新生成CSV、圖及驗證JSON。

NN訓練CSV欄位：sample_id,group,label,D1,D2,D3,D4，D欄為事先定義的ΔF/F0特徵。執行python odor_model.py train data.csv --holdout batch3 --out trained_model。至少3個獨立group；測試group不得參與scaling或調參。用AEROSENSE_MODEL指向model.json啟用伺服器推論；回傳仍標示研究模型。

快速重現：在套件根目錄執行python reproduce.py --plots重畫既有數值；--optics重新計算光學，--flow重新計算27組孔板CFD加無孔板對照（NumPy較慢，可先編譯C#加速器），--video產生MP4；每一種操作保留參數與種子。
