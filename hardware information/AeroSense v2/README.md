# AeroSense

本資料夾是唯一正式交付來源。更新：2026-10-11。依用途開啟以下資料，無須選擇多個版本。

| 我要做的事 | 開啟位置 |
|---|---|
| 列印 | [01_print](01_print)：八個 STL、三個原有 CTB。單位 mm；CTB 設定須自行核對。 |
| 看模擬成果、重現計算 | [02_simulation/README.md](02_simulation/README.md)：光學、氣流、液體／PDMS。 |
| 操作或燒錄程式 | [03_software/README.md](03_software/README.md)：韌體、UI、伺服器、分析與測試。 |
| 組裝、燒錄、驗證 | [開發者手冊](04_manuals/Developer_Manual_ZH.pdf)／[English](04_manuals/Developer_Manual_EN.pdf)。 |
| 使用設備與 UI | [使用者手冊](04_manuals/User_Manual_ZH.pdf)／[English](04_manuals/User_Manual_EN.pdf)。 |
| 採購與成本 | [中文 BOM](05_BOM/BOM_ZH.xlsx)／[English BOM, USD](05_BOM/BOM_EN.xlsx)：各自包含全部清單與來源。 |
| 寫 Wiki | [06_wiki/README.md](06_wiki/README.md)：四頁中英草稿與成果位置。 |
| 排程、染劑、細胞與短版試用 | [07_validation/README.md](07_validation/README.md)。 |
| 核對廠商資料 | [08_reference](08_reference)：原始 PCB 參考資料。 |
| 修改機構或重畫組裝圖 | [09_engineering_sources/CAD](09_engineering_sources/CAD)：CAD、尺寸、圖面與幾何檢查。 |

## 目前狀態

八件列印幾何不變。英文手冊採用 ASD-STE100 的短句、逐步操作與檢查原則，中文對照；未宣稱正式符合性認證。PDF 用於閱讀，同名 Markdown 用於修改。修改後使用手冊目錄內的程式更新 PDF。

光學包含無濾片、LEE 101 一層、LEE 101 兩層、500 nm 超薄 OD4 長通一層。圖與影片比較理想螢光、PD 接收訊號和殘差。這是合成訊號，不能當作實板量測。LEE 使用取樣光譜；OD4 曲線依產品規格建模。先試一層 LEE，再依實測背景、訊號與飽和狀態判斷。12.45 mm 圓形 OD4 需另確認固定座，不能假設能裝入現有濾片槽。

氣流的 3 mL/min 是條件式候選；約 50 秒是最慢近液面氣相 t90，不是細胞反應時間。歷史傳質模型使用 100 µL。操作暫定 80 µL，須先用實物確認蓋合與不漏液；未把舊模型當作已重算。

本包尚無實板驗收、活細胞反應或受試者結果。78 項主機與介面測試通過，不能替代 ADC 時序、LED、光學或生物驗證。`BOARD_VALIDATED=false` 保留。硬體檢查通過後，才由開發者解除 LED 鎖。

探索性加速分支可以提前培養既有 GCaMP6f HEK293，沿用實驗室已建立的完整 Gibco DMEM 配方。濾片到貨後先做暗訊號、實際介質空白與已知螢光參考，再測細胞；完整染劑系列可作後續驗證。若更換井組，須先確認校正能否轉移；未具備有效對照的細胞資料只保留為探索性紀錄。三次讀值是技術重複，不等於三次獨立生物實驗。見[完成計畫](07_validation/Completion_Plan_ZH.md)。10/19 晚凍結實驗，10/20 整理與上傳，10/21 截止。

## GitLab 與 Wiki

已上傳：[NTHU GitLab 的 code/aerosense](https://gitlab.igem.org/2026/nthu/-/tree/main/code/aerosense)。用途是 Hardware 重現附件，內含一份 README 與設備、模擬程式來源 ZIP。來源包保留必要參數、光譜和全部結果 CSV。GitLab 單檔上限為 10 MB，因此來源包不含大型計算場與對應求解快取；須先依包內根目錄 README 從頭重算。本機仍保留計算場，可快速重畫。網站根目錄授權與部署設定保持原狀。影片、成果圖、BOM 與手冊依 Wiki 託管方式發布，再連回程式。

上傳驗證：提交 `83bf1ab950a197c386a98dfab6f8096d6a8d1c96`，來源包 7,281,056 bytes，255 個檔案。遠端與本機 SHA-256 均為 `fccdd2a79a228240ea7f3d054a292d10bae352f819186b61262043eb18db161e`。

私人設定、資料庫、建置快取與廠商圖面不放入程式附件。模擬必要的光譜、JSON、NPZ 與參數放在各模型 `code/data`。它們保留求解場、參數、種子與重畫所需資訊，不可刪除。

舊版 HTML 預覽、重複 ZIP、重複 Word、舊版手冊、工具快取及零散發布查核已移除。保留主手冊、唯一成果與可重現來源。廠商 PCB 原始參考文件保留供核對，沒有因此取得重新發布授權。清除的檔案送入資源回收筒，未在專案另建備份。

## English

Use the table to find the current files. There is one delivery copy. The English BOM uses USD. The manuals use ASD-STE100 writing principles. They are not certified for full standard compliance.

The simulations are conditional numerical studies. They are not measured hardware or cell results. Keep model assumptions with each figure. Use the supplied commands and inputs to reproduce the results. Do not delete `code/data` files.

Run device checks before optical calibration. Use a separate illuminated blank, fluorescence phase reference, and living-cell baseline. Keep failed records. Later dye results cannot validate earlier uncalibrated cell records.
