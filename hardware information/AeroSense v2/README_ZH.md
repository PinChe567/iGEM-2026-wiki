# AeroSense：從這裡開始

2026-10-06工程原型交付。先開 `START_HERE.html`；它是離線入口，不是ESP32控制介面。詳細交接在[handoff.md](handoff.md)，另有[英文版](handoff_EN.md)。本資料夾是本次統一版本，不混用其他舊資料夾的STL、影片或數值。
**唯一完整交付：這個 `chatgpt version` 資料夾。旁邊的同名 ZIP 是相同內容，分享時使用。舊資料已移到主資料夾外的 `舊資料備份_勿列印`。**

**目前可做：** 檢查圖面、尺寸試印、重現模擬、使用示範UI、編譯韌體、準備驗證。**尚未證明：** 全板實物適配、板上計時與螢光靈敏度、HEK293T相容性、氣味辨識。PCB尚未到手。

## 先做這三步

1. 閱讀[組裝說明](04_manuals/Assembly_Manual_ZH.pdf)，把[廠商確認清單](04_manuals/Vendor_Confirmation_ZH.md)交給負責窗口核對。草稿尚未傳送。
2. 只列印 `01_print` 的八個 STL，各一件；導流台已整合在03上蓋。先用這組裡的04井與02黑罩檢查配合，不增加校正片或替代上蓋。
3. 先依[操作說明](04_manuals/Operation_and_Setup_ZH.pdf)試用DEMO。到板後照[單一標準液實驗](07_validation/Validation_Plan_ZH.pdf)收集真實資料，再填Wiki實證。

## 可編輯Word與閱讀版PDF

| 文件 | 中文版 | English edition |
|---|---|---|
| 組裝手冊 | [PDF](04_manuals/Assembly_Manual_ZH.pdf) · [可編輯Word](04_manuals/Assembly_Manual_ZH.docx) | [PDF](04_manuals/Assembly_Manual_EN.pdf) · [Editable Word](04_manuals/Assembly_Manual_EN.docx) |
| 操作與設定 | [PDF](04_manuals/Operation_and_Setup_ZH.pdf) · [可編輯Word](04_manuals/Operation_and_Setup_ZH.docx) | [PDF](04_manuals/Operation_and_Setup_EN.pdf) · [Editable Word](04_manuals/Operation_and_Setup_EN.docx) |
| 使用者回饋表 | [PDF](07_validation/User_Feedback_ZH.pdf) · [可編輯Word](07_validation/User_Feedback_ZH.docx) | [PDF](07_validation/User_Feedback_EN.pdf) · [Editable Word](07_validation/User_Feedback_EN.docx) |

Word供協作修改，PDF供閱讀／列印。**Word修改不會自動同步至Markdown來源、PDF或Wiki。** 請在未來重建前，先將接受的修改人工回填中英文來源，再重新產出並檢查各格式。[build_word_documents.py](04_manuals/build_word_documents.py)會依來源覆寫這六份Word；先保留尚未回填的修改。填好的問卷另存，不覆蓋空白範本。完整來源關係與後續流程見[中文交接](handoff.md)／[English handoff](handoff_EN.md)。

## 要印哪些檔

| STL | 用途 | 樹脂 | 數量 |
|---|---|---|---:|
| [01_base_BLACK.stl](01_print/01_base_BLACK.stl) | 底座／風扇座／接口開口 | PC/GF-like Black | 1 |
| [02_black_hood_BLACK.stl](01_print/02_black_hood_BLACK.stl) | 黑色遮光罩／四井套筒／濾片座 | PC/GF-like Black | 1 |
| [03_gas_lid_BLACK.stl](01_print/03_gas_lid_BLACK.stl) | 可拆上蓋／共享氣腔／導流台 | PC/GF-like Black | 1 |
| [04_well_NE_CLEAR.stl](01_print/04_well_NE_CLEAR.stl) | NE平底井 | Aqua Clear Plus | 1 |
| [05_well_NW_CLEAR.stl](01_print/05_well_NW_CLEAR.stl) | NW平底井 | Aqua Clear Plus | 1 |
| [06_well_SW_CLEAR.stl](01_print/06_well_SW_CLEAR.stl) | SW平底井 | Aqua Clear Plus | 1 |
| [07_well_SE_CLEAR.stl](01_print/07_well_SE_CLEAR.stl) | SE平底井 | Aqua Clear Plus | 1 |
| [08_gas_compression_plate_BLACK.stl](01_print/08_gas_compression_plate_BLACK.stl) | 四孔密封壓板 | PC/GF-like Black | 1 |

四井使用Aqua Clear Plus僅先作尺寸與無細胞材料試驗；未證實可直接培養HEK293T。Aqua8K Gray不取代已要求遮光的黑色件。所有STL單位mm、比例100%；已移到底面Z=0，但沒有自動加支撐或指定最佳列印傾角。按手冊保護光學面與密封面。

## 文件各放哪裡

| 資料夾 | 內容 |
|---|---|
| 01_print |八件指定STL，各一件；保留使用者切片檔與成本筆記 |
| 02_simulation |光學、氣相傳輸、PDMS與液體傳輸；原始碼、掃描、影片、互動3D圖、逐圖中英文說明 |
| 03_software |ESP32韌體、雙語手機UI、可選LAN伺服器、DLIA與研究NN程式、已執行測試 |
| 04_manuals |中英文組裝、操作設定、完整分析PDF與廠商確認清單 |
| 05_BOM |中英文Excel，各自分成總覽／列印件／額外採購／PCB；另附CSV及價格來源 |
| 06_wiki |中英文硬體頁、Cycle4／5可貼入片段、整合地圖；尚未部署 |
| 07_validation |單一標準液實驗、問卷、空白資料表、實測匯入與分析程式、證據對照 |
| 08_reference |廠商原始圖面及BOM，權利歸屬另列；不是完整可重新製板的開源包 |
| 09_engineering_sources |CAD原始碼、圖面與驗證紀錄；用於重現與修改，組裝者不需操作 |

## 不要漏看的結論

- 外形108×108×66 mm。四井每井100 µL，內腔4×2.8 mm、平底厚0.5 mm。此為縮小井，不是96-well外形。
- 光學理想案例有收光路徑，但目標井占比只有88.6–90.9%、NE井底照明CV46.2%；反射背景保留LED頻率，DLIA不能自行消除。
- 導流台已整合在03上蓋模型內。三網格下向下動量降低約30–36%，井間流動對稱性變差；不是全域最佳，也不是細胞保護證明。
- J2 USB-C是供電／充電；J3才是UART燒錄接口。韌體預設BOARD_VALIDATED=false，先暗訊號驗證。
- 已知非PCB材料成本約NT$768–1,041，必要未報價項目仍存在；完整成本不是這個數字。兩板NT$131,250含設計與開機費。
- 真實數據模板保持空白。UI示範值、合成DLIA與模擬都不能改標為實板或細胞成果。

`file_catalog.csv`列出每個公開交付檔用途；`manifest.sha256`固定檔案版本。若修改幾何，需重新匯出STL、更新BOM與模擬；不要只改檔名沿用舊結果。

## 模擬圖、影片與重要限制

先開[完整圖與影片索引](02_simulation/INDEX_ZH.html)，每張圖旁都有圖說及獨立Markdown說明；[重現入口](02_simulation/README_ZH.md)列出各模型。

細胞已確認貼附井底、每井100 µL；現有井的液深約8.93 mm。氣相濃度抵達井口，並不表示氣味已抵達細胞。無攪拌、液體擴散係數1×10⁻⁹ m²/s的假設下，理想表面階躍的井底t90約22.83小時；這是設計限制的敏感度估算，不是實測細胞反應時間。

PDMS厚度與傳輸係數已掃描，但未知目標VOC與實際材料性質，不能指定最佳配方，也不能把疏水當成阻水蒸氣。指定裝配維持八件STL、上蓋內建導流台，不加PDMS膜或採購項目。

互動HTML包含離線資料與操作程式；本機瀏覽器預覽受安全政策阻擋，互動操作尚未經瀏覽器實測。

使用者提供的`01_print/*.ctb`與`01_print/cost.md`保留原檔，切片設定尚未驗證。BOM依筆記樹脂小計與列印時間重算原公式，三批合計 **NT$1,115.39**；原手填總額及舊純樹脂模型不再進目前總價。這仍是成本估算，不是實際付款證明。


## 本次操作與分析結論

八個 STL 完全不改。固定幾何的氣流掃描選出 **3 mL/min 作條件式起始操作點**：名目最慢氣相 t90=50.00 秒、細網格50.98秒、半時間步長49.85秒。採暫定「60秒內達入口濃度90%」目標，並非已知生物閾值。以一個外接受控的下游抽氣設備操作並實測流量；UI 輸入值不代表能量測或控制流量。蛋白促進捕捉機制仍待驗證。

UI 已提供亮燈空白 I/Q 扣除、實測螢光相位參考、未平滑校正值匯出與依設備時間的顯示 EMA；原始資料保留。固定扣除不能消除變動的同頻污染或散粒雜訊。到板後以一套無細胞標準液實驗檢查讀取器響應及光學傳遞，不能據此宣稱氣味感測成立。

- [Flow operation / 氣流操作](02_simulation/airflow/Flow_Operation_ZH.md) · [3D scan / 3D 掃描](02_simulation/airflow/operating_sweep_3d.html)
- [Measured correction / 實測校正](03_software/guides/Measured_Correction_ZH.md)
- [Wiki placement / 三頁配置](06_wiki/content_plan/Placement_Plan_ZH.md)
- [Publication appendix / 發布附錄](appendix/INDEX_ZH.html)


## 現在先完成的工作

請依[兩週內完成清單](07_validation/Completion_Plan_ZH.md)、[天線間隙查核](09_engineering_sources/CAD/checks/Antenna_Clearance_ZH.md)、[標準液與細胞比對](07_validation/Fluorescence_and_Cell_Test_ZH.md)及[供氣文獻補充](08_reference/Gas_Delivery_Reference_ZH.md)執行。八個STL與正在印的四井不變；BOM已改用三批公式重算值，分開品名、規格與用途，不重複加樹脂費。
