# AeroSense software: from power-on to a saved measurement

## 2026-10-21：四受器氣味比對後端（先讀）

本次加入 **Or22a、Or35a、Or85b、Or98a** 的時間曲線與氣味相似度長條圖。
保留單次／定時功能，另加真正不中斷取樣的連續模式：**10–120 秒、每 2 秒一組四通道結果**。
同一次量測固定校正，整段合成一份資料交給後端；暫停、無效或漏掉的區段不補線。
百分比為 **max(0, Pearson r) × 100%**，不是機率，也不加總為 100%。

**連續模式需要更新 ESP32 韌體及網頁檔案（upload / uploadfs）；本次未燒錄實板。**
舊韌體仍可使用原本單次／定時功能與主機分析，但 UI 會阻止啟動連續模式。
軟體測試及韌體編譯通過不等於實板時序或生物辨識已通過；實際驗證仍待完成。

### 開始使用

1. 電腦連上裝置的 AeroSense Wi-Fi，保持 PCB 原本供電。
2. 雙擊本資料夾的 **`start_odor_backend.cmd`**；需要 Python 3.10 以上，
   這個後端只用 Python 標準函式庫，不需安裝 numpy／深度學習套件。
3. 開啟 `http://127.0.0.1:8765/`，輸入原本裝置的 **API_KEY**，按「連線」。
   啟動程式會在本機讀取既有 `firmware/src/aerosense_config.h` 的 API_KEY，
   不顯示或複製私人設定；找不到時才在終端要求輸入。
   瀏覽器仍需輸入相同密碼。不要關閉後端視窗。
4. **實際放置必須為 D1=Or22a、D2=Or35a、D3=Or85b、D4=Or98a**。
   D1–D4 對應 41／67／89／113 Hz 的 LED 通道，不是依盤面視覺順序猜測。
   軟體無法自動確認哪個井放了哪種細胞。四井接受相同氣腔的氣味。
5. 使用既有校正流程收集獨立的有效量測：
   原始路徑需要至少 5 組 Dark、5 組未刺激細胞 F0；
   實測背景路徑需要至少 5 組亮燈空白、5 組螢光相位參考，再啟用校正，
   然後收集至少 5 組未刺激細胞 F0。亮燈空白已含暗訊號，不會重複扣除。
   樣本、空白、基線、相位參考不能使用同一筆紀錄。
6. 選「連續量測」，填入 10–120 的偶數秒數，再開始測試。
   連續取樣維持 4,000 Hz 與 LED 調變，每 8,000 筆形成一個四通道時間點，
   途中沒有定時模式的關燈間隔。可用「停止並保存」提前結束；不完整的最後一組不作有效點。
   連續模式使用裝置直連或本機後端橋接；設定 CLOUD_URL 的裝置會拒絕此模式。
7. 「氣味分析」會顯示四受器 ΔF/F0 曲線，連上主機後端時會更新整段的相似度。
   整段資料的平均反應使用相同時間窗、相同權重；可在收合的「分析區間與詳細資料」
   指定刺激後的開始／結束秒數。0 秒是第一組中心時間，不是自動偵測到的加藥時間。
   DoOR 和 P2 分開看；差距不超過 5 個百分點標示難以區分（此門檻是提示，不是信賴區間）。
8. 按「儲存這次量測」，一份 JSON 保留整次所有 2 秒結果、當時校正及分析。
   重新載入會使用保存的校正，不套用今天的校正。舊資料缺校正時會拒絕分析。
   **整段保存的是 I/Q、幅度、時間與 QC 摘要，不是全程逐點 ADC。**
   裝置只保留最新完整一組原始 ADC，且只有停止後才能下載。
   保持瀏覽器開啟可保存每組摘要；斷線後在下一次量測前重連，取得裝置保留的完整歷史。
   裝置上限 60 組，重新開機會清空，應先匯出。


原本直接開 `192.168.4.1` 的頁面沒有 Python 後端。現在的流程是
**原有 UI → 電腦後端 → 裝置**；分析留在電腦，量測／歷史／原始 CSV／ADC 診斷
仍經同一條橋接轉送到裝置。電腦啟動方式不接觸真實硬體前，先可執行
`python start_odor_backend.py --check` 做本機安裝檢查。

新網址與 `192.168.4.1` 的瀏覽器儲存空間分開，舊紀錄請先在舊頁匯出 JSON，
再到新頁載入。舊 JSON 若沒有保存逐筆原始校正，仍可查看原始資料，但會拒絕
替它套用現在的校正。新實驗建議從新網址完成整個校正及量測流程。
若只要分析已有完整校正快照的 JSON，可執行
`python start_odor_backend.py --offline`，載入 JSON 後使用分析按鈕。

### 模型交接查核結果

使用者指定的 `wiki/eNose-feature-igem` 只有 47 個檔案：
39 CSV、4 PNG、2 Markdown、2 Python；README 引用的
`frozen_wetlab_bundle`、`enose_odor_inference`、`preprocess.joblib`、
SNN 推論引擎與設定檔均不在交付內容或目前專案搜尋結果中。
README 所述原 SNN 使用 **10 個受器**，不能將此次 4 通道任意補零。
**本次沒有宣稱載入、重建或驗證那個已訓練模型。**
若要接上原 SNN，需要模型同學提供完整推論包、固定前處理、受器順序、
類別標籤／版本，以及經核准的四受器模型或明確缺值策略。

目前離線比對資料與來源都放在 `analysis/odor_reference.json`：

- P2 原始、gain 有效的 4 個氣味向量，僅取指定受器：
  3-octanol、benzaldehyde、2-heptanone、valeric acid。
  排除 gain 不一致的 ethyl propionate／isopentyl acetate；
  VUAA1／Control 只列為對照，不當氣味類別。
- DoOR 公開資料的 4 受器向量另表回傳，不和 P2 混成同一尺度。
  DoOR 的 Or22a responding unit 包含 Or22a+b，不是單一 Or22a 的 HEK 校正。
- P2 每氣味 × 受器只有 1 個獨立孔，原始報告與較新 handoff 不支持氣味專一性。
  P2 的 blank-corrected、3-cycle peak 特徵與硬體單一 2 秒 ΔF/F0 不同；
  DoOR 亦是不同系統的文獻共識。兩者都只能作探索性的形狀比較。
- 未建立四井光學串擾矩陣；頻率分離不等於已驗證的獨立井反應。
  最高相關係數不是氣味身分或機率；輸出始終 `identifiedOdor=null`、
  `validated=false`。低訊號／無差異 pattern 不選 nearestReference。
  內部 5×noise 檢查不是實測偵測極限。

### 只挑一個氣味：2-heptanone（2-庚酮，CAS 110-43-0）

[Zboray 等人的原始研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC10709440/)
以 2-heptanone 作為 Or85b 的 reference ligand，使用 HEK293／GCaMP6–Orco
架構，故比單靠你們目前 P2 的最大數字更適合作為這次候選依據。
[DoOR 的四受器向量](https://neuro.uni-konstanz.de/DoOR/content/odorant.php?odorant=CATSNJVOTSVZJV-UHFFFAOYSA-N)
依序為 `[0.262, 0.323, 0.648, 0.623]`，文獻形狀以 Or85b／Or98a 較高。
它與 3-octanol 的四維 pattern r≈0.97456，不能只靠這四個維度保證區分。
你們 P2 實際向量 `[0.0320, 0.0648, -0.0063, 0.0169]` 沒有重現該期待，
所以此推薦是下一次實驗候選，不是已成功的結果。

一個氣味仍需 matched vehicle／clean-air 與背景對照。
四井共用氣腔，不能把其中一井稱為未曝氣控制；若四井全部放指定四受器，
背景對照須另作一輪或以另一組樣品完成。VUAA1 是**液相 Orco 陽性對照**，
不是另一個氣相測試氣味，也不是可直接送入氣流的 VOC。
至少保存刺激前基線、vehicle、刺激後時序、實際配方／濃度、流量與時間；
5 組硬體讀值是技術重複，不是 5 次獨立生物實驗。
現有資料沒有可保證成功的唯一氣相濃度，不能把文獻液相 EC50 直接換成裝置
的氣相劑量。軟體測試通過也不保證一次細胞實驗能成功。

### 後端驗證

`python test_odor_pattern.py` 驗證數學、校正、品質拒絕與原 JS 前處理一致性；
`python test_odor_integration.py` 用假的 HTTP 裝置驗證實際 HTTP 連線、鑑權、
原始 CSV、控制、錯誤回傳與分析；`node test_ui.cjs` 包含原介面回歸及歷史分析測試。
上述合成資料只供程式測試，不是生物或實板驗證。測試結果在 `evidence/`。

English: the existing UI now connects to a local, standard-library Python backend.
Run `start_odor_backend.cmd`, connect the computer to the board Wi-Fi, and use
`http://127.0.0.1:8765/` with the existing board API key. No flashing is needed.
Load D1–D4 with Or22a, Or35a, Or85b, Or98a in that exact order. The existing research
button submits raw acquisition/calibration records; the backend recomputes
unsmoothed ΔF/F0 and returns separate P2 and DoOR similarities. Frozen SNN weights
and fitted preprocessing were not supplied. Results remain exploratory, with no
identity or probability claim. Choose **2-heptanone** for the single test odor,
retain proper controls, and do not treat literature liquid doses as gas doses.

This folder contains the executable phone UI, ESP32 firmware, host server and analysis code. Use the update instructions below for the current firmware and UI. The Word/PDF assembly manuals are in `../04_manuals`. A rented cloud server is not required for first use.

**Firmware: 2026-10-14-adc4. UI: 2026-10-14-adc-diagnostic1.**

This update changes firmware and web files. Save the latest raw CSV before you restart the board. Then upload both items from the `firmware` folder. Replace COM4 with the actual adapter port. Repeat the existing BOOT/RESET procedure for each upload.

```powershell
pio run -e esp32dev -t upload --upload-port COM4
pio run -e esp32dev -t uploadfs --upload-port COM4
```

Restart the board. Reopen the page. Check the UI version in the footer and the firmware version in JSON. Do not use the previous adc2 instruction that required firmware only.

The three supplied adc2 tests now contain 8,000 samples each. Test01 has LED mask 0. Dark has mask 15. Light_1 has mask 1. All three have ADC minimum = maximum = 32767, mean 1.249961853 V and zero AC variation. The old valid flag checked timing and rails. It did not detect a constant code. These records do not establish PD response. The cause can be in the analog path, ADC supply, connections or serial readout. The JSON alone cannot isolate it. The current CNV delay, SPI mode and pin assignments agree with the documented 3-wire interface. They have not been verified on a logic analyzer. See [TI ADS8866, section 9.4.1.1](https://www.ti.com/lit/ds/symlink/ads8866.pdf).

The adc3 firmware rejects a complete constant-code block with `ADC_constant`. It adds `adcConstant` and `adcCodeSpan`. It preserves all measured codes. It does not change the adc2 timing, add simulated noise or claim to repair the physical signal. The browser also reviews old records. It preserves their original `valid` field and adds `browserReview`. Constant records cannot enter calibration.

ADC connection diagnostic (adc4):

1. Save existing results. Upload firmware and web files with the two commands above.
2. Connect directly to the AeroSense access point. Open the UI. End any active schedule.
3. Enter `ADC_room` as the sample name. Keep ordinary room light on the PD.
4. Open Advanced settings. Select Check ADC connection. All four LEDs remain off.
5. Wait for Diagnostic complete. Select Download ADC diagnostic JSON.
6. Cover the PD. Enter `ADC_cover`. Repeat the diagnostic and save the second JSON.

The diagnostic runs on the sampler task while the measurement timer is stopped. It reads 32 codes with hardware SPI, 32 codes with a slower GPIO clock, then 32 codes with hardware SPI after it restores the peripheral. Four warmup conversions are discarded for each SPI group. A weak input pull check observes DOUT with CNV high and low. DOUT is never configured as an output. These groups are sequential. They do not sample the same conversion and do not establish calibrated light response. The GPIO half-clock delay is a minimum of 2 us. The actual rate is not measured. The GPIO conversion wait is 12 us.

Keep both files. If only one reader changes, investigate the readout configuration and clock waveform. If both remain constant, inspect the analog output, reference and ADC connections. A data line that follows weak pulls while CNV is low suggests that the ADC is not driving the expected data input. It does not identify the failed component. Do not convert these observations directly into an optical pass result.

The diagnostic preserves the latest measurement, raw CSV, history and calibration. The full report also includes the latest diagnostic in `deviceStatus.adcDiagnostic`. The diagnostic is available only on a direct device connection. Old firmware, the demo and the host relay do not support it. The ordinary 4 kHz acquisition path remains unchanged from adc3. No physical repair is claimed until new board results are inspected.

**中文操作：**更新兩個項目後，樣本命名 `ADC_room`，在室內光線下打開「進階設定」，按「檢查 ADC 連線」，完成後按「下載 ADC 診斷 JSON」。接著遮住 PD，改名 `ADC_cover`，再做一次。診斷會自動關閉板上 LED，不用放細胞或染劑。原有量測與 CSV 保留。這是定位問題的診斷版本，尚未證明固定 32767 的原因已排除。

History operation:

1. Select History. Select View beside a record.
2. Read the saved result, LED selection, on-time, sample count, schedule and firmware version.
3. Select Raw waveform if a raw CSV was saved. A missing waveform is not reconstructed from summary values.
4. Export JSON or CSV. The filename uses the saved sample name and record ID, even if the next sample name has changed.
5. Select Use these settings to fill in the controls. This action does not start acquisition. It disables current background correction.
6. Select Return to latest to return to the live result.

Use Load saved JSON reports to reopen old reports. Duplicate IDs are not added twice. Use Load matching raw CSV to attach a separately saved waveform. The row count and record IDs must match. Old exports lack a per-record calibration snapshot. The UI labels that limit. It does not use today's calibration to invent the old analysis.

Keep the page open and directly connected during acquisition. It fetches each available latest raw CSV into browser storage. The device retains 60 summaries and only the latest raw block in RAM. The browser retains up to 1,000 summaries and 60 captured raw CSV files. Backgrounding, disconnection, storage limits or rapid acquisition can prevent capture. Raw data that were overwritten on the board cannot be recovered. Browser storage is local to the browser and site address. Export a backup before clearing site data or changing devices.

**中文更新：** 本次要同時燒錄韌體及網頁（上面兩個指令），不能只做 upload。燒錄前先保存目前最近一次的原始 CSV。新版會指出「8,000 筆 ADC 全部固定」，不會把固定值當成感光成功。三筆既有測試的取樣時序已完成，但 PD 感光仍未確認。

在「歷史紀錄」按「查看」，即可重現那筆結果與設定；可匯出該筆 JSON、原始 CSV 或通道摘要 CSV。檔名使用當次樣本名稱，例如 `Light_1_report_801cb0fa-3.json`。也可載入你已匯出的三份 JSON；重複紀錄只留一筆。若另存過原始 CSV，可以再載入並依 ID 配對。沒有保存的原始波形無法由摘要補回。

Browser and native tests are software checks. They do not establish physical ADC or optical performance. The user reports that the earlier heating issue is resolved and the fan now turns. This is not an independent electrical verification. The Word/PDF manuals remain R4; this section describes the newer history interface.

**Power and flashing clarification: 2026-10-12 R2.** Connect a 5 V USB supply to PCB connector J2. Set SW1 to ON. Use a separate USB–UART adapter for J3 TX/RX/GND only; leave adapter VCC disconnected. A suitable charged battery can replace J2 power. Seeing a COM port does not prove that the ESP32 has power. Keep PCB power on for both firmware and LittleFS uploads. Repeat the BOOT/RESET sequence for each upload. See the bilingual developer manuals in `../04_manuals` and the current upload commands above.

**供電與燒錄補充：2026-10-12 R2。** J2 接 5 V USB 電源，SW1 切到 ON；另一條 USB 接電腦與 USB-to-TTL 轉接器，轉接器只接 J3 的 TX/RX/GND，VCC 留空。已由適用且有電的電池供電時，J2 可不接。看到 COM 埠不代表 ESP32 已供電。韌體與 LittleFS 兩次上傳都保持供電，每次重做 BOOT／RESET。詳見[中文燒錄指南](guides/操作與設定_ZH.md)。

Wall-power example: wall outlet → USB charger labelled 5 V output → USB cable → J2. 市電供電例：插座 → 標示 5 V 輸出的 USB 充電器（豆腐頭）→ USB 線 → J2。

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

Optional browser regression: install Playwright in your test environment. Start `python server/server.py --demo --port 8876 --db :memory:`. Run `node test_history_browser.cjs`. The default fixtures are synthetic. Three JSON paths can be supplied to review existing Test01 / Dark / Light_1 exports. The test uses an isolated browser profile. On Windows it uses Edge; `AEROSENSE_BROWSER_EXE` can specify another Chromium executable.

With Python 3.11 or later and Node.js installed:

```powershell
python -m pip install -r requirements.txt
python test_software.py
python test_adc_firmware.py
python test_model.py
node test_calibration.cjs
node test_correction.cjs
node test_ui.cjs
node --check firmware/data/app.js
```

JSON evidence is written to `evidence/`. Firmware compilation uses PlatformIO as explained in the guide. Software tests do not exercise a physical ADC or demonstrate fluorescence detection.

`test_adc_firmware.py` requires a C++17 compiler. On Windows, install the C++ workload in Visual Studio Build Tools. The test compiles the current sampler functions in an OS temporary directory. It checks preparation exclusion, transaction ownership/release, exact fault limits, cancellation, repeated blocks, timestamp wrap and final-read publication order.

Fan connection clarification: C6 is an electrical tap point, not a connector for a fan. Its small pads require skilled SMD soldering and strain relief. Do not attach thick fan leads directly. For a beginner, use an external 5 V power branch between the charger cable and J2. One branch returns to J2 through USB-C. The other goes to the matching fan connector. This needs an additional, correctly wired power adapter or cable. There is no such splitter on this PCB. J3 remains the USB-to-TTL connection. The fan does not resolve an unknown U2 fault.

風扇接線補充：C6 是電氣取電點，不是適合新手施工的風扇插座。不要直接把粗風扇線焊在 C6。較實際的方式是另做「原 Type-C 電源線輸入 → 外部分接 → Type-C 回 J2 ＋ 相符兩針接頭接風扇」的 5 V 分接線。這是需要另外購買／製作的配件，不是板上已有接頭；J3 接法不變。若一定要從 C6 引線，請由具備 SMD 焊接經驗者用細軟引線施工並固定線材，避免拉掉焊盤。散熱不能代替 U2 發燙原因的檢查。

## Check functions before filter delivery and after flashing

Updated 2026-10-11. Use a dry, cell-free device. Test the interface, power, dark acquisition, exports, and stop control before filter delivery.

| Step | Action | Acceptance and evidence |
|---|---|---|
| 1 Demo interface | Start DEMO above. Connect. Select Repeat at an interval, 1 minute, 3 measurements. Start, pause, then end the schedule in Advanced settings. | Confirm DEMO. Confirm cancellation of the remaining schedule. This does not test the PCB. |
| 2 Complete flashing | Upload firmware and LittleFS with the setup guide. | Require SUCCESS for both uploads. Restart and open the page. J2 supplies power; J3 carries programming signals. |
| 3 Board connection | Connect the phone to AeroSense. Open http://192.168.4.1/. Enter the private API_KEY. | Confirm HARDWARE. Do not report DEMO records as board measurements. |
| 4 Dark acquisition | Keep BOARD_VALIDATED=false. Select Single measurement. Open Advanced settings and select All off. | Check the 8,000-sample block, valid, railSamples, and timing fields. Resolve clipping or timing failures. |
| 5 Save data | Set a sample label before acquisition. Export JSON, CSV, and the latest raw ADC. | Check file contents and the label. Download raw ADC before another block overwrites it. |
| 6 Stop control | Start three dark measurements. After one block, press Pause, then End schedule in Advanced settings. | Confirm cancellation of remaining blocks. SW1 stops the main reader; it does not isolate the U2 charger. For abnormal heating, disconnect J2, USB-to-TTL and the J1 battery. |
| 7 One LED | An electronics collaborator must first check power, ADC operating point, and timing. Then unlock, rebuild, and flash. Test each LED at 5% duty. | Check physical well mapping, LED waveforms, ADC range, and stop control. Unfiltered signals do not establish fluorescence performance. |
| 8 Final optics | Install the selected filter. Measure a cell-free blank and a known fluorescent reference. | Require distinguishable fluorescence, valid timing, and no clipping. Follow the measured-correction guide before cell measurements. |

A displayed number does not establish hardware acceptance. Retain failed records. Do not disable QC to obtain valid=true. See the [setup guide](guides/Operation_and_Setup_EN.md).

Current checks: 27 host/API tests, 23 UI DOM/API tests, 10 calibration tests, 33 measured-correction tests and 17 native firmware cases pass (110 total). Edge browser checks cover the three supplied JSON imports, record selection, exports, IndexedDB reload, a 390 px viewport and synthetic raw CSV persistence. Firmware and LittleFS builds pass. These checks do not establish physical ADC or optical performance.

## GitLab hardware source attachment

The target is `code/aerosense` in the team Wiki repository. It supports Hardware reproduction. It is not the dedicated Best Software submission.

Include firmware, phone UI, server, analysis, tests, dependencies, blank templates, and guides. Exclude private settings, databases, model weights, build caches, working copies, and vendor drawings. Keep placeholders in the example configuration. Inspect the actual upload contents; ignore rules alone do not establish confidentiality.

Preserve the Wiki root LICENSE and deployment settings. Uploading source does not update the ESP32. After firmware changes, rebuild, flash, and check the board. Record the source revision used for each experiment.

## Known limits

This package has no recorded physical-board acceptance. `BOARD_VALIDATED=false` permits only all-LEDs-off acquisition. Enable LEDs only after electrical power, ADC timing and single-LED waveforms pass bench checks. A user supplied a failed physical acquisition. This revision has not been flashed or validated on the board.

The grounded TIA noninverting input and ADC negative input can place the dark signal near the ADC lower rail. If dark data are clipped, retain the failure record and ask an electronics collaborator to inspect the operating point. Do not disable validity checks to manufacture a calibration result.

Reflected excitation and LED-synchronous material background remain in the corresponding DLIA channel. Four frequencies do not automatically provide four independent wells; measure optical mixing separately.

The device stores at most eight pending upload summaries and the latest raw ADC block in RAM. Restart clears RAM. Browser history saves up to 1,000 summaries and 60 captured raw blocks. Export after each experiment.

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

## 連續量測驗證（2026-10-21）

- 後端：`python -m unittest test_odor_pattern test_odor_session test_odor_integration`
- UI：`node test_ui.cjs`、`node test_session_ui.cjs`、`node test_session_app.cjs`
- 韌體原生測試：`python -m unittest test_adc_firmware test_continuous_firmware`
- 編譯：在 firmware 目錄執行 PlatformIO 的 build 與 buildfs。這兩步不燒錄。
- 瀏覽器合成測試：`python evidence/serve_continuous_browser_fixture.py`，
  開啟輸出的本機網址，測試密碼 `continuous-fixture-key`。此伺服器不連實板。
  畫面例子位於 `evidence/continuous_odor_synthetic.jpg`，不可當成實驗結果。
- 詳細結果：`evidence/continuous_integration_validation.json`；
  僅軟體與合成資料驗證，未執行實板取樣／上傳／生物實驗。
