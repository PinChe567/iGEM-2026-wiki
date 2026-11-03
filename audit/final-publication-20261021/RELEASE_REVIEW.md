# AeroSense 發布與嚴格審查紀錄

本報告記錄目前證據、正式交件與尚待完成的發布步驟。網站有對應頁面不等於獎牌條件已全部完成；本機建置通過、附件已上傳或文件已輸入，也不等於網站已部署、Registry 已保存或 Judging Form 已提交。

## 目前發布狀態

- **Wiki：本輪方法、完整曲線、跨平台分析、工程證據與後端說明均已正式部署並讀回。** 最新 commit `dbcfaf9414747dc2989b5ca134a1ea45452eea03`；pipeline **792720** 的 locales **1911483**、client **1911484**、pages **1911485** 全部成功，pages artifact **4,882,631 bytes**。公開部署 **315/315** 通過：34 次新 HTTP 加 281 份未變 SHA 的既有證據，包含 287 個 CI 檔案、67 個 HTML 請求與 28 個路由；27/27 clean-route base 正確。PDF.js 官方 CDN、導航與 inline PDF 的既有核對證據保留。
- **Software：最新來源已正常發布並讀回。** 官方 [AeroSense Software](https://gitlab.igem.org/2026/software/nthu/aerosense) commit `7571b9e8f3468ee4dffe8e69ff337073de57a54d`；尾註清理的12份來源加manifest共 **13/13** 匿名 raw GET/SHA 相符，前輪後端／工程 **50/50** 證據保留。現行 **1,250份研究來源／12,051,880 bytes**，另有7份未變支援檔及manifest，共1,258項；manifest SHA `855264b5f0c27875402d456548b0faa939c6ac0c6dd54f38237cf590c01a53e7`。MIT僅適用使用者核准的團隊原創程式，資料、圖文、Wiki與第三方 notices 不變。
- **Zenodo：完整研究包仍在本地，未發布。** 現行 **8,183筆來源記錄、7,823個唯一payload、24,966,544,070 bytes**；只登錄必要新版本與精簡公開證據，未重掃完整包，也未再複製整站、圖片或完整Registry payload。
- **Registry：76/76文件與Collection說明已公開核對完成。** 26個公開頁面上的標題、類型、全文及團隊歸屬全部符合最終payload；51個舊ID保留、25筆新增且唯一，沒有額外或重複條目。11處過時管理尾註已移除並增量重驗。75/75張官方Registry圖片已核對；自動AVIF轉製／縮放不宣稱與來源bytes相同。Collection的868字元說明、標題與UUID亦經官方公開端點和獨立DOM核對一致。先前400僅接受Registry上傳圖片的問題已解決。
- **Judging Form：150字草稿與六個evidence checkbox已就緒，官方UI仍顯示Not Started，尚未按Save and Submit。** 最後操作保留給使用者，期限為2026-10-21 23:00臺灣時間；保留草稿分頁不要重新整理。Eligible僅為表單檢核，不代表評審認定或獲獎；網站仍保留157字Abstract。

先前整批研究包推送曾被官方 GitLab 的傳輸大小及成品／數據儲存規則拒絕；那些歷史失敗不是目前狀態。現行分工為官方 Wiki 儲存網站來源、Software 儲存程式／Markdown／必要設定，靜態文件與圖表附件使用官方 CDN，完整原始資料及大型研究包保留於未發布的 Zenodo canonical archive。

## 方法與補充分析：Software 與 Wiki 均已發布核對

Measurement 已精煉為約 **1,938 個英文詞**，按 Abstract、Introduction、Methods and data analysis、Discussion、Conclusion、Data availability、Supplementary methods 與 References 組織。內容包括顯微分割與 reporter-positive fraction／QC／Fisher–Holm–Wilson，Test 1 峰值與 Test 2 自身變化扣除，VUAA1 參照比例及完整軌跡、光片 ROI baseline、複數 I/Q／矩陣與 fluorescein 校正、活細胞 own-start 比值，以及模型 split／metrics。新正文繁中對應完整；本機核對 0 失效連結／錨點、0 重複 ID，七組主要公式一致。這是方法與可追溯性補強，沒有新增採樣、獨立重複或實驗驗證。

完整 odor 曲線已完成本機數值／圖形檢查。Results 新 Figure 17 保留全部 **5,280 個 raw readings**（Test 1：3,840；Test 2：1,440），包含原本因來源回報增益不相容而排除計算的 24 個 Test 1 孔之原始曲線。Test 2 的 990 個合格 normalized curve points 保留 163 個負值及 2 個超過 1 的點，範圍 −0.159196 至 1.273370；66 個終點與 Figure 14 精確相符。N(t) 固定使用 168 秒 VUAA1−DMSO 終點分母；F0 的 48 秒終點變化是常數校正，不是外推至 168 秒的基線曲線。各 acquisition 的局部起點分開，初始 offset 不重新置零，未轉染條件不計 VUAA1 參照比例。

Hardware–wet-lab 主比較使用 **五個原生名目對齊點 0、12、24、36、48 秒**，不作內插；各平台以自身第一讀值正規化，沒有幅度配準或視窗最佳化。下表為一輪紀錄的描述性相關，不是五個獨立樣本：

| 配對構築 | Pearson r | Spearman ρ | 一階差分 r | 去線性趨勢 r |
|---|---:|---:|---:|---:|
| Or35a + ORCO | −0.9423 | −0.70 | −0.8858 | −0.9525 |
| Or85b + ORCO | +0.9719 | +0.90 | +0.6495 | +0.8321 |
| Or98a + ORCO | +0.7565 | +0.40 | +0.0785 | +0.3367 |
| ORCO only | +0.9477 | +0.90 | −0.1248 | −0.1007 |

Or35a 的變化方向相反；Or85b 的共同上升最穩定，但其錯配 Or35a 曲線 r = +0.9671，與正確配對僅差約 0.00476，因此不是受體特異配對證據。Or98a 移除第一個共同時間點後 r 降至 +0.1144；ORCO-only 改用原始第 19 筆時由 +0.9477 轉為 −0.2897。全部 4 × 4 配對、原始紀錄、移除首點、十點內插與原始時鐘情境均保留，沒有挑選有利配對作結論。

控制調整敏感度比較硬體各自 own-start 的 VUAA1−medium 比值，與 wet lab 各自 own-start 的 VUAA1−DMSO 比值，不另施加 F0 或 N(t) 校正。四組 r 為 −0.9028、+0.9750、+0.7984、+0.9657。硬體 medium 是加液前序列，DMSO 是另孔量測，並非兩平台配對的 vehicle-addition control。名目時間不能寫成已同步的加液後時間。

獨立檢查覆蓋 1,056 個相關係數（最大誤差約 2.02 × 10⁻¹⁴）、44 個來源雜湊與 12 個 ADC 振幅。這些檢查確認計算及來源一致，不消除自相關、共同趨勢或起點敏感性，也不構成新的生物重複、平台等效或受體活化驗證。

先前完整曲線與跨平台分析階段，兩個 canonical batch 加最小 publication manifest/provenance 共新增 37 檔、6,272,140 bytes。僅 8 份 editable source/documentation 複製到 Software，研究來源清單變為 1,227 檔、11,804,821 bytes；另有 7 support 與 source manifest。新 manifest SHA 為 `a632e6a82f065eb1d11b61a57dc1b8baf2076f84878ac422f6260713d4d42c33`。新增資料、圖與驗證記錄保留在 canonical，未放入 Git 資料集副本。收據：`odor-complete-curves-delivery.json`、`odor-pattern-supplement-registration.json`。

本輪 Software 已正常 push 至 `861ce244564c0d012954d77b94ebfda4f473f617`（前版 `e09ec6d`）。恰 8 份新增來源加 1 份 manifest 完成匿名 raw/main full GET，SHA／大小 **9/9 通過**，收據為 `odor-pattern-software-publication-readback.json`。該階段研究來源為 **1,227 檔／11,804,821 bytes**，另有 7 support 與 source manifest，合計 **1,235 項**；不把來源檔數與包含支援檔的總數混用。

上述方法與補充圖已先經 Wiki `d1cb454229dff683f5689c06f9690e47d27f559e`／pipeline 792226 部署核對，並保留於最新 `dbcfaf9414747dc2989b5ca134a1ea45452eea03`／pipeline 792720。最新 315/315 公開讀回已覆蓋現行輸出，沒有以舊 CI 代替本輪驗證。

## 本輪工程證據、後端與 Registry 來源

最後視覺檢查後，另刪除11筆Test2文件及生成模板內兩句過時行政尾註。逐檔比較確認只移除該155-byte文字，科學敘述、表格、數值、標題、圖片與連結均不變。正常Software commit `7571b9e8f3468ee4dffe8e69ff337073de57a54d`與13/13公開檔案讀回已完成；Registry同11個既有條目重存後亦併入最終76/76正文核對。

工程證據 batch 保留 17 檔／609,333 bytes；13 份既有 CAD 輸入以路徑、尺寸及 SHA 重用，沒有再複製原始 CAD。公開 Software 包含五份生成／說明來源及必要 `cad-source-manifest.json` 設定；七張圖與三頁技術 PDF 使用官方 CDN。私有郵件、原截圖與個人聯絡資訊不在公開 package；迭代圖不代表漏液、密封或電路問題已修復驗證。

新增後端是 **四受體 Pearson 參考圖樣比較器**，不是已訓練 PN–KC–MBON。通道設定為 D1 Or22a、D2 Or35a、D3 Or85b、D4 Or98a（各配 ORCO），與先前細胞硬體測試不同；不能重標舊資料。它從 I/Q 與校正紀錄重建 ΔF/F₀，分別比較 laboratory Test 1 與 DoOR 參考。顯示分數為 `100 × max(0, r)`，不是機率、氣味身分或已驗證的分類正確率；原始 signed r 保留。參考 JSON 從已完整 GET/SHA 的官方 CDN 取得，不存入 Git。

225 項來源測試通過，涵蓋 Python、演算法／virtual DOM、主機端韌體 sampler／serializer 及參考檔安裝檢查。選用的真實 Playwright history-browser 檢查未執行，與已跑的 virtual-DOM 測試分開；本輪未操作或燒錄電路板，也未宣稱完成 PlatformIO 實板驗收。Registry 13 份 Markdown 與一份分析生成程式僅修正 Test 1／Test 2 標示及來源可用性，既有數值表與圖不變。

此階段窄幅 canonical 保存共新增 72 檔／3,623,625 bytes，包含必要差異來源、工程 package、四張先前 CDN gel exact bytes 與公開讀回證據，沒有整站備份。Software `df7b3bc9731fc03205e0a1ac907e90e634d693fb` 的 49 份來源／設定加 manifest 共 50 個公開檔案均逐一匹配 commit blob。Registry 線上圖片替換使用另一份 upload payload，不改已凍結的本地 Markdown 或 Software 來源。


## 修改與保存邊界

日常網站仍使用 `aerosense-wiki/`。`github/iGEM-2026-wiki/` 未同步、未提交、未清理。官方 Wiki 與 Software checkout 的 Git 設定、正式來源及有效版本記錄保留。

HP、Education、Entrepreneurship、Sustainability 的內文保持原樣；必要的官方資產與下載連結可以更正。研究頁改為較精簡的論文敘述並統一既有章節順序，未刪除數值、圖表或科學解讀所需的限定。Description 採用使用者指定 Abstract，Results 保留 Test 1／Test 2 的不同方法。生物操作集中 Experiments，工程迭代集中 Engineering，日期工作紀錄集中 Notebook；文獻年份、科學時間長度及不可變來源名稱仍保留。

一般限制移至 Discussion，但樣本來源、單孔／技術觀察的性質、不同時間窗、排除理由與影響結論的條件仍隨相關方法或圖說呈現。Contribution 中與既有硬體證據不符的舊說明已修正，沒有將探索性細胞訊號改寫成已驗證的端到端感測器。

## 資產、文件與可重現性

此次 hosting 修正新增的 **100 個官方 CDN 附件**均已匿名完整 GET 並核對 SHA-256：89 份 CSV／JSON 衍生附件、10 份實際轉製 PDF，以及一份顯微分割參數／實測閾值 JSON。PDF 保留原文件的資料與章節，並與原 DOCX／XLSX／RPT／HTML 分開記錄用途與雜湊，沒有把改副檔名當成轉檔。六份研究 HTML 的 PDF 共 146 頁，文字、表格、圖片載入與頁面外溢均完成檢查。

現行 **730個官方static CDN URL均有完整bytes／SHA證據**；既有圖片、影片與科學SVG的收據保留，不把舊549筆子集誤當現行總數。現行網站的 **15 種 Video Universe URL 形式對應 12 支獨立 Public／Published 影片**，已完成公開metadata核對；先前漏算Model的 Four-Filter Signal Comparison（UUID `7fc4bb2a-623b-4fee-90c0-d1836add9c2e`），這是更正統計而非新增上傳。原始 AVI 與尚無相同公開對應的研究影片留在研究封存中。舊 Google Drive 教師工具包使用已核對的官方 PDF 讀本，外部來源未修改。

下載連結依實際內容分流：公開圖表資料連精確 CDN 檔案，報告連已核對 PDF，可編輯程式連官方來源，完整原始資料／模型／大型封裝連明確的 archive availability。ZIP 改連分析原始碼時，標籤已改為 source，沒有宣稱仍可下載整個資料包。失效 DOI `10.5281/zenodo.23469212` 不再作為有效資料記錄。

讀回工具使用當前頁面、互動 viewer 及遊戲教育連結建立清單；不再使用舊 237-URL 發布計畫。Wiki 與 Software 各自對應 checkout 與成功 commit，原始碼完整 GET 對照該 commit 的 Git blob SHA-256／大小，另保留 working-tree 變更防護，正確處理 Git 的合法換行正規化。**81 個 GitLab URL 全數 success，0 failed、0 not_verified：46 個 raw full GET 的 SHA／大小全部相符，35 個 repository/path/title 檢查通過；另沿用 549 個已有完整 GET 證據的 CDN URL。** Manifest 與七份支援檔均有雜湊防護。最後導航 commit 的全部 81 個目標與來源 bytes 均未變，因此沿用原 HTTP 證據而不重複下載；增量 source HTTP 為 0。另有部署頁 315/315 核對通過。這不等同全部 repository 檔案逐一 GET，亦不宣稱測遍所有可能的使用情境。

遷移前 1,220 個研究來源／manifest 項目已逐一比對實際 Zenodo 檔案：823 項已有相同 canonical；缺少的版本按 SHA 去重後僅新增 392 檔、4,157,694 bytes，並記錄歷史用途。MIT 核准前 Software 的 1,227 項及 28 份 Registry Markdown mirror 再次核對通過，只新增 26 個不同版本、1,420,889 bytes。兩份保存映射亦納入主清單，共補登錄 420 個 physical canonical、6,634,680 bytes。MIT 版再核對全部來源與 Registry mirrors，只補存 12 個差異來源、1,200,342 bytes；加上保存映射共新增 13 個 canonical、1,751,213 bytes。這是必要研究／軟體來源保存，並非整站備份。已發布基準的 source manifest SHA-256 為 `0789b6f090cafa47f34a66723a9a1a8f2806dd2263f335832ba81cbc3ae5edd5`，Software 成功 commit 為 `e09ec6dc273cbffe92ccccdaca2814f3d2a57960`；Wiki pipeline 791345 與該已發布基準的來源連結／部署讀回亦已通過。

PDF.js 歷史建置修正保存 12 份最小來源與直接 CI 設定，共 61,255 bytes；加保存映射共 13 份、68,054 bytes。最終 CDN 整合只再補存 7 個差異來源與一份映射，共 8 檔、64,402 bytes。原兩份 module 與 Apache LICENSE 共 3 檔、3,100,705 bytes 另以 exact canonical 保留，加保存收據共登錄 4 檔、3,101,724 bytes。沒有複製 node_modules 或整站；固定 npm lock 與重現程式仍保留，現行 CI 使用官方 CDN 而不再產生模組。最後導航修正只新增保存兩份異動來源、92,939 bytes；連同映射共新增 3 檔、95,531 bytes。該方法增補階段的研究主清單為 8,089 筆來源記錄、7,729 個唯一 payload、24,961,249,222 bytes；現行總數見本文開頭，本輪只讀新檔與必要差異，未重新讀完整研究包。

## 本輪清理結果

以下收據分組記錄，不把同一檔重複計數，也不將歷史準備清單當成實際刪除數量。

| 分組 | 已完成 | 保留與檢核 |
|---|---:|---|
| 官方 GitLab 不允許的研究發布副本 | 550 檔／108,211,247 bytes | 每份先確認 canonical，canonical 刪除數為 0；正式來源保留。 |
| 附件、上傳、轉檔與候選文件暫存 | 165 檔／37,359,240 bytes | 含 100 上傳 staging、19 份 PDF／列印 HTML／歷史圖快取副本、25 個可重建預覽、7 個日常二進位下載副本、13 已套用 Markdown 草稿及 1 舊 manifest。 |
| 過時的五份 compiled public 輸出 | 1,564 檔／114,406,623 bytes | 逐檔核對後移除，再移除 263 個空目錄；active public 的 289 檔前後 SHA 全相符。未使用遞迴刪除。 |
| Software 連結遷移的兩份 compiled 輸出 | 578 檔／39,432,425 bytes | 逐檔核對後移除，再移除 98 個空目錄；active public 的 289 檔前後 SHA 全相符。與上列五份輸出分開計數。 |
| PDF.js 修正前的 compiled 輸出 | 289 檔／19,716,422 bytes | 逐檔核對後移除，再移除 49 個空目錄；active public 的 289 檔前後 SHA 全相符。 |
| CDN 已驗證的 PDF module 工作／上傳副本 | 6 檔／9,271,593 bytes | 原 modules 與 Apache LICENSE 先保存並核對，active public 287 檔不變。 |
| CDN 修正前的 compiled 輸出 | 289 檔／19,716,828 bytes | 逐檔核對後移除，再移除 49 個空目錄；active public 287 檔前後 SHA 相符。 |
| 導航修正前的 compiled 輸出 | 287 檔／16,626,299 bytes | 逐檔核對後移除，再移除 49 個空目錄；active public 287 檔前後 SHA 相符。 |
| 完整曲線增補前的 compiled 輸出 | 287 檔／16,627,568 bytes | 新輸出核對後逐檔移除舊版本，再以原生移動更新 active public；未觸碰被拒絕清理的檔案。 |
| 工程／後端增補前的 compiled 輸出 | 287 檔／16,687,458 bytes | 與上一版本分開的完成收據；目前 active public 保留 287 個已核對檔案。 |
| 移轉後 Wiki 的重複研究來源 | 1,220 檔／12,831,491 bytes | 只在 Software checkout 與 Zenodo canonical 皆逐檔相符後移除；兩個被拒絕清理的 cache 保留。 |
| 已歸檔並上傳 Registry 的歷史 gel cache | 4 檔／1,014,648 bytes | 四份原件逐檔 SHA 相符，快取以原生 PowerShell literal-path 刪除一次；先前 83 份 blocked 檔案未動。 |
| Registry 前端診斷內容 | 4 個下載 chunk 的原始碼正文已去除 | 保留 URL、雜湊及診斷 metadata，紀錄由 31,563 bytes 精簡為 1,382 bytes；保存失敗結果的正式收據未改。 |

六份日常 Markdown／授權文字保留為編輯與 notices 來源。審查報告、操作收據、雜湊映射、必要生成程式、正式 Wiki／Software 來源、研究 canonical 與有效網站輸出均保留。自動審核拒絕清理的檔案共 **83 份**：2 份 `.pyc`、17 份上傳 staging、16 份來源重複工作副本及 48 份測試工作檔。各組均保留、沒有重試或改用其他方式刪除；其中後兩組共 539,897 bytes，未當作已去重 canonical。另有 **4 份歷史 gel cache 工作副本**已在 canonical SHA 與 Registry 上傳核對完成後逐檔移除（1,014,648 bytes），並不屬於這 83 份 blocked 檔案；四份 exact canonical 仍完整保存。

包含先前六份工作／展示／上傳清理、本輪兩次已核對的 public 更新及四份 gel cache 清理，18 份完成收據共移除 **6,067 個舊版本／快取檔案、505,291,282 bytes**。每次 public 更新按不同版本的完成收據計數，不把保留的 active public 或 blocked 清單算成已刪除。Registry 診斷正文的 30,181 bytes 精簡另列，不計作檔案刪除。此前 odor／影片／教育清理另有收據，不重複加總。

## 獎牌與獎項：證據、缺口、判斷

依主流程當日核讀的 [2026 官方 Medals](https://competition.igem.org/judging/awards/medals)，Bronze B1 的 Competition Deliverables 包括 **Safety Forms**，下表補正原先漏列。Gold 以前置 Bronze／Silver 達標為條件，依所選三個 Special Awards 各自 rubric 的 Gold 要求判定，且組合至少包含一個 General BioEngineering 與一個 Specialization。Model／Hardware／Education 符合選項組合要求；表單 Eligible 或選滿三項不代表內容已達 rubric，也不是獲獎保證。

| 項目 | 已有的證據 | 嚴格結論 |
|---|---|---|
| Bronze：正式交件 | B1 包括 Wiki、Judging Form、Presentation Video、Judging Session 與 Safety Forms；Attributions 另依其條件記錄 Saved／Received | 最新 Wiki 本輪增補已部署並公開讀回。Judging 已就緒但待使用者提交，影片／評審場次待完成。Safety 為 Final Submitted／Awaiting Review；已提交與已核准分開記錄。Software、Registry 均已發布並核對；正式交件仍須分別確認。 |
| Bronze：Attributions | 三個 AI 工具 ChatGPT、Claude、Fable 的用途已保存並讀回；成員與外部貢獻已列 | 本輪 AI 用途一致性修正已完成；不得沿用舊「只有 ChatGPT／等待權限」狀態。 |
| Bronze：Contribution | 元件文件、量測分析、硬體設計／韌體／手冊、模型來源與教育資源；本輪補完整曲線、敏感度與 Measurement 方法 | 增加方法可重用性與追溯性；新增 Software 與 Wiki 方法／圖均已公開讀回，不能把分析補強等同新增實驗驗證。 |
| Silver：Engineering | 設計、實作、測試、學習與改進循環，包括硬體校正與失敗假設的修正 | 有對應證據；是否達標仍由評審判定，且以前置條件完成為前提。 |
| Silver：Human Practices | 利害關係人回饋改變應用範圍、流程、商業與風險溝通 | 頁面保留既有內容；訪談次數不能直接等同整合品質。 |
| Gold 選項 | Judging 草稿選擇 Best Model、Best Education、Best Hardware，符合至少一項 General BioEngineering 與一項 Specialization 的組合要求 | 仍需三項各自符合 rubric 的 Gold 要求，並完成 Bronze／Silver；不能由勾選、Eligible 或本輪新增圖表直接判為 Gold。 |
| Best Model | 光學／氣流模型影響設計，量測對照，外部資料解碼及受體計算比較；Measurement 已釐清 split、metric 與不確定性 | PN–KC–MBON 對應訓練引擎、已擬合前處理、fold／seed 紀錄與 KT 完整來源仍有可重現性缺口；另一個四特徵模型不能替代。 |
| Best Hardware | 組裝實機、四通道、58 次螢光標準量測、校正與矩陣比較、手冊及裝配回饋；新增五點跨平台模式與敏感度比較 | 有具體原型證據；混合加成不支持任意混合物反算，一次裝配回饋不是獨立可用性重測。跨平台相關受錯配共同趨勢與首點敏感性限制，未形成受體特異或端到端驗證。 |
| Best Education | 300 人問卷、22 份營隊學習單、工作坊回饋、教師工具包與遊戲／課程 | 觸及或參與數不是學習增益；自述學習單與不同群體數字不能當作配對前後測。Post 2 同時標為 Coming soon 與 best-performing 的矛盾仍列出，因使用者保護 Education 內文而未擅改。 |
| Best Wiki | 一致敘事、章節順序、官方資產、資料入口及桌機／手機檢查 | 可讀性改善保留不利證據；正式技術通過仍以 CI 與公開讀回為準，不保證獲獎。 |

## 必須保留的研究解讀界線

Test 1 與 Test 2 的控制、時間窗與指標不同；單孔時間點不是獨立生物重複。Test 2 的 VUAA1 參照值是探索性比例，不是轉染效率；0–1 色階沒有把負值改成正值。

Hardware Figure 18 的逐段起始值正規化用於比較軌跡，不能消除加液造成的光路、體積或濃度差異。原始絕對值與其他分析仍在封存中；D1 不支持宣稱所有通道都與 wet lab 一致。

## 正式交件狀態

Registry的25個parts加collection已完成76項文件更新。Ijung Chen以既有作者權限操作；原先HTTP400訊息 **Only images uploaded to the Registry are allowed** 已確認並透過75張官方Insert Image上傳解決。最新公開核對涵蓋26頁、76項標題／type／完整Markdown正文／團隊歸屬：**76/76一致，51舊ID保留、25新增唯一條目，無extras或duplicates**。11筆Test2的過時管理尾註清理後，以10次新的paced公開請求、1份先前已核對的Or19a證據及65份未改內容證據完成增量檢查。Collection標題／UUID／868字元說明亦由官方API與獨立公開DOM核對；較短的錯誤API路徑曾回404，不是實際Collection不存在或保存失敗。最終精簡證據已歸檔，不另複製整份payload或圖片。

Attributions 已保存三項 AI 工具用途並讀回。Judging Form 的 **150 字版本已經使用者批准**，標題與三個獎項已填入；六份必要頁面已閱覽、六個 evidence checkbox 已勾選，Summary 對 Bronze／Silver／Gold 與 Model／Education／Hardware 顯示 Eligible。這是表單檢核而非評審認定。官方UI仍為Not Started；分頁內草稿與六個勾選保留，尚未按Save and Submit，最後操作留由使用者，證據見 `judging-form-ready.png`。網站 Abstract 維持原定 157 字版本。

Project Safety 狀態為 **Final Submitted／Awaiting Review**。兩個討論串仍開啟，但活動紀錄已顯示 PI **Chung-Chuan Lo** 實際編輯並提交，不能誤寫為缺 PI 提交。Safety 是否核准尚無結論；兩份獨立 safety check-in 均為 Approved。

Presentation Video 目前 No Submission，期限為 **2026-10-28 23:00（臺灣時間）**。Judging Session 排定 **2026-11-15 17:10–17:35（臺灣時間）**。這些是官方儀表板查核狀態，不是本代理已完成交件的宣稱。

## 查核依據與待補欄位

- 最後來源與歸檔：`../backend-publication-20261021/registry-footer-source-publication-completion.json`、`final-registry-evidence-preservation.json`（同目錄）；13/13來源讀回與精簡Registry證據登錄。
- 本輪最新發布：`official-ci-792720.json`、`official-wiki-deployment-readback-792720.json`、`official-ci-public-hash-manifest-792720.json`；315/315（34 fresh、281 reused），Wiki `dbcfaf9414747dc2989b5ca134a1ea45452eea03`。
- 本輪後端／工程來源：`../backend-publication-20261021/backend-engineering-publication-completion.json`、`software-publication-readback.json`（同目錄）；Software `df7b3bc9731fc03205e0a1ac907e90e634d693fb`、50/50 exact raw GET。
- Registry最終證據：`registry-final-publication-readback.json`、`registry-collection-metadata-readback.json`、`registry-collection-description-readback.json`、`registry-image-upload-readback.json`；76/76全文、51舊ID／25新增、868字元Collection說明、75張圖。尾註更新前的首筆與全批證據保留為歷史。
- 本輪新增清理：`../measurement-curves-20261021/executed-public-refresh.json`、`../engineering-backend-20261021/executed-public-refresh.json`；blocked 16／48 副本另見 `../backend-publication-20261021/blocked-new-canonical-deduplication.json`、`blocked-temporary-test-cleanup.json`（同目錄）。
- 本輪方法來源：`../../measurement.html`、`../../locales/extras/zh-Hant/measurement.json`；約 1,938 英文詞、公式及錨點／新增繁中對應檢查完成，pipeline 792720 的現行正式部署已讀回。
- 本輪完整曲線：canonical `data/odor-complete-curves-2026-10-21/METHODS.md`、`derived/qa.json`、`derived/figure-qa.json`；5,280 原始讀值、66 終點與所有未截斷曲線追溯。
- 本輪跨平台分析：canonical `data/hardware-wetlab-pattern-comparison-2026-10-21/README.md`、`analysis-summary.json`、`matched-correlations.csv`、`all-pair-correlations.csv`、`verification.json`；五點主分析與十種其他情境。上述兩個 canonical 相對路徑均以 `zenodo-release/aerosense-wiki/` 為根。
- 本輪新增保存／Software：`odor-complete-curves-delivery.json`、`odor-pattern-supplement-registration.json`、`odor-pattern-software-precommit.json`、`odor-pattern-software-publication-readback.json`；新 source manifest `a632e6a82f065eb1d11b61a57dc1b8baf2076f84878ac422f6260713d4d42c33`，Software commit `861ce244564c0d012954d77b94ebfda4f473f617`，新增／更新來源讀回 9/9。
- 正式 CI 與來源讀回：`official-ci-791345.json`、`../release-20261021/public-download-readback.json`、`navigation-incremental-readback-provenance.json`；81/81 原成功證據經最終來源對照沿用，549 CDN 證據保留。
- 最終部署與導航：`official-wiki-deployment-readback-791345.json`、`official-ci-public-hash-manifest-791345.json`；315/315 通過，其中 86 新 HTTP、229 份相同 SHA 證據沿用，27/27 clean-route 錨點 base 通過。
- 最終來源與總數：`navigation-source-preservation.json`、`final-navigation-publication-rollup.json`、`executed-navigation-obsolete-public-cleanup.json`。
- PDF runtime 最終保存：`pdf-reader-cdn-source-preservation.json`、`pdfjs-canonical-vendor-preservation.json`；原件、CDN 雜湊、重現 recipe 與授權分別記錄。
- 正式狀態：`formal-deliverable-status.json`、`registry-save-status.json`、`judging-form-draft.json`、`attributions-ai-saved.png`。
- CDN：`verified-cdn-corrections-mapping.json`、`verified-cdn-hardware-documents-mapping.json`、`verified-cdn-research-documents-mapping.json`、`verified-cdn-microscopy-parameters-mapping.json`，以及既有資產／影片讀回收據。
- PDF 與來源保存：`verified-document-reader-preservation.json`、`pre-migration-source-preservation-receipt.json`、`final-software-source-preservation-receipt.json`、`final-source-archive-registration.json`、`mit-software-source-preservation-receipt.json`、`mit-source-archive-registration.json`；實際 canonical 及 SHA 均由收據追溯。
- 清理：`executed-source-only-artifact-copy-cleanup.json`、`registry-frontend-diagnostic-cleanup.json`、`../release-20261021/executed-final-staging-cleanup.json`、`../release-20261021/executed-obsolete-generated-build-cleanup.json`、`../release-20261021/executed-software-links-build-cleanup.json`、`executed-wiki-software-copy-cleanup.json`。
- 本機網站：`../release-20261021/source-only-build-browser-qa.json`、`source-only-game-markdown-browser-qa.json`、`final-hosting-text-browser-qa.json`、`final-source-only-output-refresh.json`、`final-cleanup-qa-gate.json`、`software-links-build-completion.json`、`software-links-output-verification.json`、`software-links-browser-qa.json`。
- 嚴格獎項審查：`../release-20261021/criteria-hardware-model-review.md`；官方規範包括[獎牌](https://competition.igem.org/judging/awards/medals)、[特別獎項](https://competition.igem.org/judging/awards/special)、[交件](https://competition.igem.org/deliverables/)與[Wiki requirements](https://teams.igem.org/go/deliverables/wiki/requirements)。

**仍待完成：使用者最後提交已就緒的Judging Form；後續Presentation Video／Judging Session；Zenodo正式發布。** Wiki最新CI／315/315讀回、Software最新13/13來源讀回、Registry76/76正文與Collection說明均已完成。Safety為Final Submitted／Awaiting Review，不能把等待官方審查誤寫成未提交，也不由Eligible推論獲獎。
