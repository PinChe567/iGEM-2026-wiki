# AeroSense software: from power-on to a saved measurement

This folder contains the executable phone UI, ESP32 firmware, host server and analysis code. Start with `guides/Operation_and_Setup_EN.md`: demonstration, wiring and flashing, dark acquisition, LED checks, calibration, then measurement. A rented cloud server is not required for first use.

For measured LED-on background subtraction, signed phase projection and optional display averaging, follow [Measured correction](guides/Measured_Correction_EN.md). This is opt-in browser processing of preserved raw I/Q. Collect a cell-free illuminated blank and a separate fluorescence phase reference; do not substitute a simulated waveform or a living-cell F0 for the blank.

| Location | Purpose |
|---|---|
| `firmware/src/main.cpp` | LED timing, external ADC acquisition, DLIA, local API and result uploads |
| `firmware/src/config.example.h` | Copy to `aerosense_config.h` in the same folder and enter private settings |
| `firmware/data/` | Bilingual phone UI; upload the LittleFS filesystem as well as firmware |
| `firmware/data/correction.js` | Measured complex blank subtraction, reference phase projection, QC and timestamp-based display EMA |
| `server/server.py` | Host command queue, SQLite storage and explicitly labelled demonstration mode |
| `analysis/dlia.py` | Offline raw-data demodulation; not identical to the MCU rectangular I/Q estimator |
| `analysis/odor_model.py` | Small research neural-network pipeline; no fabricated trained odor model supplied |
| `guides/` | Setup, controls, calibration, operation and troubleshooting |
| `templates/` | Empty experiment and model-training tables |
| `evidence/` | Consolidated software checks, build records, and DLIA results |

## Try the interface without a PCB

Open a terminal in this folder:

```powershell
python server/server.py --demo
```

On the same computer, open `http://127.0.0.1:8765/`, enter API key `local-demo-key`, then Connect. The banner must say DEMO DATA. These numbers are interface exercises, not experimental evidence.

## Repeat software checks

With Python 3.11 or later and Node.js installed:

```powershell
python -m pip install -r requirements.txt
python test_software.py
python test_model.py
node test_calibration.cjs
node test_correction.cjs
node test_ui.cjs
node --check firmware/data/app.js
```

JSON evidence is written to `evidence/`. Firmware compilation uses PlatformIO as explained in the guide. Software tests do not exercise a physical ADC or demonstrate fluorescence detection.

## Check functions before filter delivery and after flashing

Updated 2026-10-11. Use a dry, cell-free device. Test the interface, power, dark acquisition, exports, and stop control before filter delivery.

| Step | Action | Acceptance and evidence |
|---|---|---|
| 1 Demo interface | Start DEMO above. Connect. Set three blocks and a three-second interval. Start, then stop. | Confirm DEMO. Confirm cancellation of the remaining schedule. This does not test the PCB. |
| 2 Complete flashing | Upload firmware and LittleFS with the setup guide. | Require SUCCESS for both uploads. Restart and open the page. J2 supplies power; J3 carries programming signals. |
| 3 Board connection | Connect the phone to AeroSense. Open http://192.168.4.1/. Enter the private API_KEY. | Confirm HARDWARE. Do not report DEMO records as board measurements. |
| 4 Dark acquisition | Keep BOARD_VALIDATED=false. Select Dark. Set Blocks=1 and Interval=3. | Check the 8,000-sample block, valid, railSamples, and timing fields. Resolve clipping or timing failures. |
| 5 Save data | Set a sample label before acquisition. Export JSON, CSV, and the latest raw ADC. | Check file contents and the label. Download raw ADC before another block overwrites it. |
| 6 Stop control | Start three dark blocks. After one block, select Stop. | Confirm cancellation of remaining blocks. Check that SW1 removes power when network control is unavailable. |
| 7 One LED | An electronics collaborator must first check power, ADC operating point, and timing. Then unlock, rebuild, and flash. Test each LED at 5% duty. | Check physical well mapping, LED waveforms, ADC range, and stop control. Unfiltered signals do not establish fluorescence performance. |
| 8 Final optics | Install the selected filter. Measure a cell-free blank and a known fluorescent reference. | Require distinguishable fluorescence, valid timing, and no clipping. Follow the measured-correction guide before cell measurements. |

A displayed number does not establish hardware acceptance. Retain failed records. Do not disable QC to obtain valid=true. See the [setup guide](guides/Operation_and_Setup_EN.md).

The current read-only rerun passed 23 host, 10 calibration, 33 measured-correction, and 12 UI DOM/API checks. All 78 checks passed. The app.js syntax check passed. Existing evidence files were preserved. These checks exclude physical flashing, browser visual inspection, ADC timing, optics, and cells.

## GitLab hardware source attachment

The target is `code/aerosense` in the team Wiki repository. It supports Hardware reproduction. It is not the dedicated Best Software submission.

Include firmware, phone UI, server, analysis, tests, dependencies, blank templates, and guides. Exclude private settings, databases, model weights, build caches, working copies, and vendor drawings. Keep placeholders in the example configuration. Inspect the actual upload contents; ignore rules alone do not establish confidentiality.

Preserve the Wiki root LICENSE and deployment settings. Uploading source does not update the ESP32. After firmware changes, rebuild, flash, and check the board. Record the source revision used for each experiment.

## Known limits

This package has no recorded physical-board acceptance. `BOARD_VALIDATED=false` permits only all-LEDs-off acquisition. Enable LEDs only after electrical power, ADC timing and single-LED waveforms pass bench checks. Physical flashing and 4 kHz acquisition with Wi-Fi remain untested.

The grounded TIA noninverting input and ADC negative input can place the dark signal near the ADC lower rail. If dark data are clipped, retain the failure record and ask an electronics collaborator to inspect the operating point. Do not disable validity checks to manufacture a calibration result.

Reflected excitation and LED-synchronous material background remain in the corresponding DLIA channel. Four frequencies do not automatically provide four independent wells; measure optical mixing separately.

The device stores at most eight pending summaries and only the latest raw ADC block in RAM. Rebooting loses RAM. The browser keeps up to 1,000 observed summaries; export after each experiment.

There are no battery-level, cell-temperature, gas-flow or fan-speed sensors, and no connected valve-control circuit. The UI does not fabricate those values. Public internet deployment is not provided; use direct connection or a private LAN for the first two-week prototype campaign.


---

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

## 到貨前與燒錄後的功能檢查

2026-10-11。先用乾燥、無細胞裝置檢查。濾片尚未到貨時，可以完成介面、供電、暗訊號、資料保存與停止功能。

| 步驟 | 實際操作 | 通過條件與保存內容 |
|---|---|---|
| 1 示範介面 | 執行上方 DEMO。連線，設定三組與三秒間隔，開始後停止。 | 顯示 DEMO；停止後沒有繼續排程。這不證明 PCB 正常。 |
| 2 燒錄完整性 | 依操作手冊上傳 firmware 及 LittleFS。 | 兩次 SUCCESS；重新啟動後能開啟網頁。J2 僅供電，燒錄使用 J3。 |
| 3 實板連線 | 手機連 AeroSense，開 http://192.168.4.1/，輸入私人 API_KEY。 | 顯示 HARDWARE／實機連線。不要使用 DEMO 當實板資料。 |
| 4 暗訊號 | 保留 BOARD_VALIDATED=false。選 Dark，全關燈；Blocks=1、Interval=3。 | 取得 8,000 點區塊；檢查 valid、railSamples 與時序欄位。飽和或時序失敗先排錯。 |
| 5 保存 | 先填樣本標籤，再量一組。匯出 JSON、CSV 與最近 raw ADC。 | 檔案可讀且標籤正確。raw ADC 只保存最新一組；下一組前先下載。 |
| 6 停止 | 設三組暗訊號。取得一組後按停止。 | 剩餘排程取消。網路失效時，SW1 能切斷電源。保存觀察結果。 |
| 7 單燈 | 電子協作者確認電源、ADC 工作點與時序後，才解除旗標並重燒。逐燈以 5% duty 取一組。 | 核對實際井位、LED 波形、ADC 範圍及停止狀態。未裝濾片時的訊號不能當螢光性能證據。 |
| 8 最終光學 | 安裝最終濾片後，另做無細胞空白與已知螢光參考。 | 訊號可辨識、無飽和、時序正常。依實測校正指南再開始細胞流程。 |

顯示數值不等於硬體驗收。保留失敗紀錄，不要關閉 QC 來取得 valid=true。完整接線、旗標與判讀見 [操作手冊](guides/操作與設定_ZH.md)。

本次唯讀重跑：host 23、校正 10、實測背景處理 33、UI DOM/API 12，共 78 項通過；app.js 語法通過。這不包含實際瀏覽器視覺、燒錄、ADC、光學或細胞測試。原證據檔未覆寫。

## GitLab 硬體程式附件

目標為團隊 Wiki repository 的 `code/aerosense`。用途是 Hardware 重現附件，不是 Best Software 專用 repository 提交。

發布內容包含 firmware、手機 UI、server、analysis、測試、依賴、空白模板與操作指南。私人設定、資料庫、模型權重、建置快取、工作副本與廠商原始圖面不放入附件。範例設定保留占位值；上傳前檢查實際檔案，不能只依賴 .gitignore。

Wiki 的根 LICENSE 與網站部署設定保持原樣。GitLab 上保存程式不會讓 ESP32 自動更新。每次更改韌體仍須編譯、燒錄及檢查。軟體更新後，記下提交版本以追蹤實驗使用的程式。

## 已知限制

本資料包尚未記錄實板驗收通過。預設 `BOARD_VALIDATED=false`，只允許 LED 全關取樣；在供電、ADC 時序與單燈波形驗證以前不要解除。韌體未經實板燒錄測試，不能保證 Wi-Fi 啟用時仍滿足 4 kHz 取樣時序。

原理圖的 TIA 正端與 ADC 負端接地，暗訊號可能靠近 ADC 下限。若讀值被下限截斷，保留失敗資料並請電路協助者檢查工作點；不要改掉 `valid` 判斷來湊出校正結果。

同頻率 LED 反射漏光與材料背景也會進入對應 DLIA 通道。四個頻率不等於四個已分離的 well；光學串擾仍須實測。

裝置 RAM 最多保留 8 組待上傳摘要，原始 ADC 只留最後一組，重新開機會清掉 RAM。手機畫面只保留最近 1,000 組已看見的摘要；請每次實驗後匯出。

沒有電池電量、細胞溫度、氣流量、風扇轉速或氣閥控制感測／驅動電路；UI 不會假裝提供這些數值。公開網際網路部署尚未完成，兩週內先使用直接連線或私人區網。


## Reproduction attachment and current browser check

A separate browser check on 2026-10-11 confirmed DEMO connection, language switching, Start, Stop, and JSON/CSV export. Stop changed six pending blocks to zero. Two exported DEMO records retained the sample tag and raw I/Q fields. This was a desktop check. It did not test a physical board or all mobile layouts.

To rebuild the public source archive, run from this folder:

```text
python -B package_source.py --output C:/path/outside-this-package/aerosense-source.zip
```

The archive contains device software, three simulation models, required numerical inputs, CSV results, and validation analysis. It excludes private settings, vendor drawings, generated media, saved numerical fields, caches, and binaries. This keeps the file below the GitLab 10 MB limit. Read the archive's root README for fresh solver commands before plotting. Full replay can be expensive. The local delivery retains all saved numerical fields for fast plotting. The internal manifest lists file hashes. Preserve the full directory structure after extraction. The upload location is `code/aerosense` in the team GitLab repository.

中文：本次另以瀏覽器確認 DEMO 連線、中英切換、開始／停止，以及 JSON／CSV 匯出。六筆待執行排程可取消至零；兩筆匯出資料保留標籤和原始 I/Q。這不是實板或所有手機版面的驗證。公開來源包涵蓋設備與三個模擬的程式、必要數值輸入和 CSV，解壓時須保留目錄結構。GitLab 單檔上限為 10 MB，因此不附大型計算場與對應計算快取；請先依來源包根目錄 README 從頭重算，再重畫成果。本機資料保留全部計算場，可直接快速重畫。
