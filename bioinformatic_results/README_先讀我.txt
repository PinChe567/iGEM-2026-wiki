Receptor Engineering｜Wiki 負責人交接包
版本：2026-10-11；頁首已更新為「我們已經做出了什麼？」五項成果回顧。
狀態：本機完成，尚未發布至線上 Wiki。交接包不需要 GPU 或重新訓練模型。

一、先看內容
開啟 preview/receptor_engineering_zh.html 或 receptor_engineering_en.html。
兩份檔案內嵌圖片、樣式、互動與下載資料，可離線閱讀；請放在同一資料夾以切換語言。
這兩份為審閱用快照。正式整合請使用 site/ 的分離式 HTML、CSS、JS 與圖檔。

二、資料夾內容
site/：中英文網頁、全部相關圖檔／數據、樣式、互動、共用依賴與頁面重建程式。
integration/：新增檔案清單、需要比對的共用檔案清單、導覽連結片段、搜尋索引項目。
figures/：中英文圖表索引；實際 SVG／PNG 位於 site/assets/receptor-engineering/。
references/：38 筆完整參考文獻；正文使用作者—年份短引文。
requirements-wiki.txt：頁面重建所需 Python 套件版本。
MANIFEST.json：逐檔大小、SHA-256、打包時間與內容說明。

三、整合進既有 Wiki
1. 依 integration/NEW_FILES.txt，把 site/ 中的專頁檔案放進 Wiki 根目錄，維持相對路徑。
   英文入口：receptor-engineering.html
   中文入口：receptor-engineering-zh.html
2. integration/SHARED_FILES_REVIEW.txt 所列為共用依賴，提供目前版本作比對。
   若負責人的 Wiki 已更新，請合併需要的改動，保留其他人的新內容。
   本包未包含整站其他頁面的替換版本。
3. 將 navigation-snippet.html 的連結加入 Dry Lab 選單；可另加在頁尾及 Engineering／Model。
   本版 header／footer 模板已有連結；既有靜態頁面若內嵌導覽，也要用團隊原流程同步。
4. 如沿用此站的搜尋，將 receptor-search-records.json 合併到既有搜尋索引。
   若首頁使用 js/home.bundle.js，請在原 Wiki 依其既有流程重建首頁 bundle。
5. 在整合後的 Wiki 根目錄執行：python -m http.server 8000
   瀏覽 http://localhost:8000/receptor-engineering.html 及中文版。
   若只預覽本包：python -m http.server 8000 --directory site
   這時 Receptor Engineering 可使用；導覽中的其他 Wiki 頁面需回到完整站台才存在。

四、後續修改與重建
使用 Python 3.12 以上（本包以 Python 3.13 環境製作）。
在解壓後的交接包根目錄：
  python -m pip install -r requirements-wiki.txt
  python site/scripts/build_receptor_engineering.py
不需要原始 MD 軌跡或模型權重，即可重建這兩個網頁。
主要內容來源：
  site/assets/receptor-engineering/content.json：頁首五項成果、六個循環、下一步、書目。
  site/scripts/receptor_research_details.py：完整研究內容。
  site/scripts/receptor_molecular_features.py：IR、EVA／量子振動、OpenPOM 內容與結果表。
  site/scripts/receptor_reader_support.py：名詞解釋與短引文處理。
  site/css/receptor-engineering.css、site/js/receptor-engineering.js：專頁外觀與互動。
重建後先以 site/ 的網頁檢查；preview/ 是本次交接快照，不會自動同步更新。
結果圖已匯出，修改研究數值或重新繪圖時，請再與 Dry Lab 對照原始分析。

五、需保留的科學解讀
已建立受體候選、反應預測模型、振動／AI 特徵比較，以及膜 MD／路徑分析流程。
Or22a、Or35a 是優先功能實驗候選；尚未證明改造後的受體更敏感或更專一。
頻譜及固定 OpenPOM 尚未建立穩定全面增益；LORAX 明確為待測。
候選進出方向不等於已驗證通道；35 個突變是設計清單，並非成功突變體。
不同氣味子集的分數須與各自的相配基準比較；R² 不等於百分比準確率。
保留圖片的研究限制、實測／計算區別、名詞解釋與文獻引用。

六、上線前確認
中英文切換、手機版、圖表放大、方法展開／收合、CSV／SVG 下載與引用錨點。
頁首五項成果回顧、36 組圖表與原有跨物種／MD 內容均應保留。
本交接僅提供檔案，沒有代為推送或發布網站。
