<<<<<<< HEAD
# AeroSense Wiki · October 12 watercolor, learning and evidence update

目前本機預覽：[AeroSense](http://127.0.0.1:8011/index.html)。可在此資料夾執行 `node scripts/preview-server.mjs 8011` 啟動；另有下方 PowerShell 預覽方式。

**要上傳 iGEM 的圖片集中在本資料夾的 [igem-upload](igem-upload/README.md)：目前 473 張唯一圖片（448 張網頁圖、25 張原尺寸附圖），附各頁清單與官方網址對照表。**

最新 v15 將封面換成保留原 Claude PNG 的水彩衍生圖集，章節標題加入階梯角、現有卡片加入短硬陰影；科學 2D 圖維持清楚。Learning 使用鼠尾草綠／天空藍／薰衣草紫／金黃／珊瑚五色搭配原 hero 基調。圖表外框仍對齊正文，caption 內部有桌機 24px／手機 16px 留白；寬表格說明會在可見欄寬內換行，資料仍可橫滑。Engineering 區分 9 個無媒體證據狀態說明與 5 個實際 figure，V1 PDF 標明為電路原理圖。完整範圍與最終驗證見 [v15 更新報告](../reports/2026-10-12-visual-evidence-v15.md)，現行規格见 [設計系統](design_system/README.md)。

v14 歷史：讓每頁的標題、控制項與淡底依該頁 Claude 插圖配色：Project 鼠尾草綠、Team 赭金、Wet Lab 淡紫、Hardware／Model 藍、HP 陶土紅，Learning 按各自圖案細節配色。同一閱讀欄位內的標題文字、正文、主要圖片及圖說共用左右邊界，章節圖案底保留，文內引用編號恢復正常行內間距。Notebook 已整合 24 筆 Wet Lab 與 5 筆 Hardware 工作，保留精確時間、失敗紀錄與未來預定狀態；合併重複事件後共 87 筆。完整範圍與檢查見 [v14 更新報告](../reports/2026-10-12-palette-notebook-v14.md)。

v13 歷史：使用原圖封面裁圖、章節圖案底、正文左右切齊與獨立 References 編號欄。首頁有深色銀河、淡出天空與五章書本；Model 包含 Receptor engineering，Engineering 有相應循環和小型 Expand all；Sustainability 依指定 Notion 整理。見 [v13 更新報告](../reports/2026-10-12-illustrated-v13.md)。
=======
# AeroSense Wiki · October 10 editorial update

目前本機預覽：[AeroSense](http://127.0.0.1:8010/index.html)。可在此資料夾執行 `node scripts/preview-server.mjs 8010` 啟動；另有下方 PowerShell 預覽方式。

**要上傳 iGEM 的圖片全部集中在本資料夾的 [igem-upload](igem-upload/README.md)：486 張圖片依頁面整理，附各頁清單與官方網址對照表。**
>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0

Reference 最新修正見[引用排序與圖片位置](../reports/2026-10-10-v6-reference-order.md)：14 頁的 123 筆來源依正文首次引用排列，內文與文末連續對應。

最新內容與檢查請看 [第五輪更新報告](../reports/2026-10-10-v5-update-report.md)：Model (2) 全文與 17 張結果圖、首頁產品開蓋互動、固定研究圖層、新封面、Description／Contribution 插畫導覽、Engineering 停駐閱讀。Notion 始終唯讀。首頁載入 `home.bundle.css`／`home.bundle.js`；修改其來源後執行 `node scripts/build-home-bundles.mjs`。以下 September 24 說明保留為歷史設計背景，以最新報告與目前頁面為準。

## September 24 design edition — historical notes

新版入口是 `index.html`。在此資料夾執行 `./preview.ps1` 可開啟本機預覽，網址為 `http://127.0.0.1:8000/index.html`；若 8000 已使用，可執行 `./preview.ps1 -Port 8001`。不需要安裝網站套件。

最新修正記錄在上一層的 `reports/06-3D影片與介面修正版.md`。目前首頁載入 `homepage_animation/` 中新的 v3 Blender 雙影片，滾輪對應播放進度；Description 直接使用可左右控制的 3D 旅程；Parts 使用可點選的 Blender 受器模型。正式發布前仍需完成 iGEM 影片託管及 URL 串接。

美術微調在 `css/refinement.css`，共用果蠅與影片在 `js/experience.js`。`models/blender/` 保存可編輯的 v3 `.blend` 和建模／渲染腳本。header/footer 的共用來源為 `templates/`，修改後執行上一層 `scripts/sync_shell.py`。研究內文與原始 Markdown 保留。`run_windows.ps1` 是下列舊 v2 Blender 工作流程，**不是網站預覽啟動器**。

---

# 原始 AeroSense Showcase v2 文件

這版針對目前 interactive 的主要問題重新設計 Blender scene：

- 果蠅改成 rear-dorsal chase 用模型，翅膀 pivot 與身體連在胸部。
- Warehouse 有貨架、咖啡袋、咖啡豆、木箱、燈具、障礙物、實際 VOC source。
- Olfaction 不再是一堆圈圈，而是一個 antenna/sensilla corridor + 明確 receptor gateway。
- Cell 是單一大型 HEK293-inspired cell chamber，含 receptor、Ca²⁺ 路徑、GCaMP signal。
- Hardware 是 sample chamber → PD → TIA → ADC → MCU 的 PCB 場景。
- Decoder 是 AL glomeruli → projection → sparse KC field，不再用不明圓圈。
- Return 回到 stored-food application。

## 執行

直接雙擊 `run_windows.bat`，或 PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File .\run_windows.ps1
```

輸出位置：

```text
models/showcase_v2/aerosense_fly_v2.glb
models/showcase_v2/aerosense_01_warehouse_v2.glb
models/showcase_v2/aerosense_02_olfaction_v2.glb
models/showcase_v2/aerosense_03_cell_v2.glb
models/showcase_v2/aerosense_04_hardware_v2.glb
models/showcase_v2/aerosense_05_decoder_v2.glb
models/showcase_v2/aerosense_06_return_v2.glb
models/previews_v2/*.png
models/blender/AeroSense_Showcase_v2.blend
```

生成後，把 `CURSOR_PROMPT_V2.txt` 給 Cursor，讓它把新版模型、穩定 chase camera、manual/autopilot、real-time score、stage dive、文字動畫一起接進前端。

> 注意：此環境無 Blender runtime，因此腳本已做 Python syntax check，但最終 render/API 相容性仍需你本機 Blender 跑一次。若有 Blender 5.2 API error，把完整 traceback 貼回來即可修。
