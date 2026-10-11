# Wiki 整合指南

這些檔案是可在本機檢查的發布草稿，沒有修改或上傳現有網站。

## 先看哪個檔案

- `hardware_ZH.html`：完整中文硬體頁；英文對應為 `hardware_EN.html`。
- `engineering_cycles_ZH.html`：新增 Cycle 4／5 的完整預覽；英文對應為 EN。
- `Cycle_4_ZH.md`／`Cycle_5_ZH.md`：可直接編輯的中文文字稿。
- `cycle_4_EN_fragment.html`／`cycle_5_EN_fragment.html`：整合到現有英文 engineering 頁的 HTML 片段。
- `Integration_Map_EN_ZH.md`：含原始網站快照行號、精確 ID、原始檔案雜湊的技術對照。
- `numerical_sources.json`：頁面上數字對應的最終模擬來源；重新計算後執行 `build_wiki.py` 更新頁面。

## 更新 hardware 頁

保留原網站導覽列、版面、參考文獻與貢獻歸屬，將舊的 hardware 文章內容換成 `hardware_EN.html` 對應各段。不要將獨立預覽頁的整個 html/head/body 包進現有文章。

盡量保留原本的段落 ID，讓舊連結仍能找到內容。原有 `multiplexing` 是別名，新稿把它改成正式段落，整合時只能留一個同名 ID。

舊的 3D viewer 還在讀舊 STL。必須更換成 `01_print` 的八個檔案，並確認組裝位置轉換；若來不及核對，先使用附帶的最終 CAD 圖，不要讓舊模型與新尺寸同時出現在頁面。原始 PCB 圖、電路圖及元件檢視器可以保留，但要確認連結有效。

刪除舊的 150 µL 標示、把舊尺寸當成現況的文字、舊 optional 組合、舊光學／氣流數字與舊部分總成本。歷史設計可以留在工程比較中，但必須標明是先前版本。

## 更新 engineering 頁

1. 完整保留既有 hardware Cycles 1–3，包括圖、歸屬與驗證狀態。
2. 只把 hardware 的 cycle 數量從 3 改為 5，其他工程分支不動。總狀態仍是 PCB 製造與實體驗證待完成。
3. 在原有第 3 個 tab 後增加第 4、5 個 tab，沿用相同 class、data-cycle-tab、aria-controls 與鍵盤操作規則。
4. 在原 `.eng-cycle-stage` 中，放在第 3 篇 article 後、stage 關閉前，插入兩份 EN fragment。不能放到 `hw-professional-review` 區塊後面。
5. Cycle 4 明列「CAD 與計算測試完成；實體驗證待完成」。Cycle 5 明列「研究材料已準備；尚未施測」。不要將五個 cycle 全部標成已完成。
6. 更新 changelog，保留先前內容。確認五個 tab 均可滑鼠／鍵盤切換及透過網址定位；本資料包沒有宣稱已測試整合後的網站程式。

## 連結與發布

本機預覽讓 `06_wiki` 與 `01_print`、`02_simulation`、`03_software`、`04_manuals`、`05_BOM`、`07_validation` 並排，因此連結使用 `../`。搬到主網站時，必須依實際上傳位置改寫路徑；正式 iGEM 提交前，另外核對當年度官方託管規定。

完成後執行 `python check_links.py`，確認 STL、PDF、XLSX、影片、圖片與 Markdown 下載都存在，再用手機檢查圖、表格與影片。連結檢查只驗證本機路徑，不能代替部署後測試。

## 哪些結果不能先寫成成功

實板能否通電、裝件後是否密合、細胞相容性、無菌性、生物靈敏度、氣味分類、電池續航與使用者滿意度，都需要真實資料才能寫。模擬有非零收光，不等於機器已能檢測氣味；氣流代理量下降，不等於細胞受到保護。

PCB 報價是兩片含設計／開機的 NT$131,250，不能直接稱為量產成本。未知價格保持空白；頁面數字需與最新 BOM 一致。

Cycle 5 施測後再填參與人數、完成率、時間、錯誤與具體修改，保留未解決的問題。專案使用者提出需求，不能替代獨立使用者測試。

Best Hardware 對照的是官方四項面向：需求、使用者回饋、功能證據、他人可重現性。本稿沒有自行創造 Overgrad 的額外門檻。來源：https://competition.igem.org/judging/special-prizes
