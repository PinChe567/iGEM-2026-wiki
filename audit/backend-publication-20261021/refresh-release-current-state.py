"""Refresh only release reports and the root handoff's priority status block."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[3]
FINAL=ROOT/'aerosense-wiki/audit/final-publication-20261021'
AUD=Path(__file__).resolve().parent
review_path=FINAL/'RELEASE_REVIEW.md';status_path=FINAL/'publication-status.json';handoff_path=ROOT/'handoff.md'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
before={str(p.relative_to(ROOT)):sha(p) for p in [review_path,status_path,handoff_path]}
ci=read(FINAL/'official-ci-792720.json');deploy=read(FINAL/'official-wiki-deployment-readback-792720.json')
images=read(FINAL/'registry-image-upload-readback.json');first=read(FINAL/'registry-or35a-first-confirmed-save.json')
software=read(AUD/'backend-engineering-publication-completion.json')
assert ci['pipeline']['status']=='success' and all(x['status']=='success' for x in ci['jobs'])
assert deploy['summary']['passed']==315 and deploy['summary']['failed']==0
assert images['mapped_count']==images['success_count']==75
assert first['title_matches'] and first['body_matches']
commit=ci['pipeline']['sha'];software_commit=software['software_commit'];manifest=software['software_manifest_sha256']
now=datetime.now(timezone.utc).isoformat()
review=review_path.read_text(encoding='utf8')
research_limits=review.split('## 必須保留的研究解讀界線\n',1)[1].split('\n## 正式交件狀態',1)[0]
numeric_table=re.search(r'\| 配對構築 \|[\s\S]+?\n\n',review).group(0)
current=f'''## 目前發布狀態

- **Wiki：本輪方法、完整曲線、跨平台分析、工程證據與後端說明均已正式部署並讀回。** 最新 commit `{commit}`；pipeline **792720** 的 locales **1911483**、client **1911484**、pages **1911485** 全部成功，pages artifact **4,882,631 bytes**。公開部署 **315/315** 通過：34 次新 HTTP 加 281 份未變 SHA 的既有證據，包含 287 個 CI 檔案、67 個 HTML 請求與 28 個路由；27/27 clean-route base 正確。PDF.js 官方 CDN、導航與 inline PDF 的既有核對證據保留。
- **Software：最新來源已正常發布，50/50 個變動檔案匿名完整 GET/SHA 通過。** 官方位置為 [AeroSense Software](https://gitlab.igem.org/2026/software/nthu/aerosense)，commit `{software_commit}`。現行研究來源 **1,250 檔／12,053,740 bytes**，另有 7 份未變支援檔及 source manifest，共 **1,258 項**。Manifest SHA `{manifest}`。MIT 僅適用使用者核准的團隊原創程式；資料、圖片、文字、Wiki 與第三方 notices 不變。
- **Zenodo：完整研究包仍在本地，未發布。** 現行主清單有 **8,161 筆來源記錄、7,801 個唯一 payload、24,964,872,847 bytes**。失效 DOI 與被 GitLab 拒絕的舊資料副本不作下載服務；本輪沒有重掃完整資料包。
- **Registry：IN PROGRESS，76 項更新正在逐項儲存。** 已完成 **75/75** 張 Registry 圖片上傳與公開可讀／映射核對；Registry 自動轉製的 AVIF 不宣稱與輸入圖片 bytes 相同。首筆 Or35a characterisation 的標題與全文已獨立公開讀回一致，故目前至少 **1/76** 確認完成；其餘完成數以後續逐項儲存及最終全文讀回為準，尚不宣稱 76 項全部發布。先前 Save 的已確認原因為 **Only images uploaded to the Registry are allowed**，並非仍待切換作者帳號。
- **Judging Form：150 字草稿、六份必要頁面的查閱與六個 evidence checkbox 已就緒，仍未提交。** Save and submit 留由使用者最後操作。Summary 的 Bronze／Silver／Gold 與 Model／Education／Hardware Eligible 只代表表單檢核，不代表評審認定或獲獎；網站保留 157 字 Abstract。

先前整批研究包推送曾被官方 GitLab 的傳輸大小及成品／數據儲存規則拒絕；那些歷史失敗不是目前狀態。現行分工為官方 Wiki 儲存網站來源、Software 儲存程式／Markdown／必要設定，靜態文件與圖表附件使用官方 CDN，完整原始資料及大型研究包保留於未發布的 Zenodo canonical archive。

'''
start=review.index('## 目前發布狀態\n');end=review.index('## 新增方法與補充分析',start)
review=review[:start]+current+review[end:]
review=review.replace('## 新增方法與補充分析：Software 已發布，Wiki 等待本輪部署驗證','## 方法與補充分析：Software 與 Wiki 均已發布核對',1)
review=review.replace('約 **1,880 個英文詞**','約 **1,938 個英文詞**').replace('約 1,880 英文詞','約 1,938 英文詞')
review=review.replace('兩個 canonical batch 加最小 publication manifest/provenance 共新增','先前完整曲線與跨平台分析階段，兩個 canonical batch 加最小 publication manifest/provenance 共新增',1)
review=review.replace('現行研究來源為 **1,227 檔／11,804,821 bytes**','該階段研究來源為 **1,227 檔／11,804,821 bytes**',1)
old='本輪 Wiki／CDN routing、Wiki commit、CI 與正式部署讀回仍由主流程辦理。上節 pipeline 791345 與 315/315 檢查對應先前正式 Wiki，不能自動視為本輪 Measurement、補充曲線或跨平台圖也已上線。'
new=f'''上述方法與補充圖已先經 Wiki `d1cb454229dff683f5689c06f9690e47d27f559e`／pipeline 792226 部署核對，並保留於最新 `{commit}`／pipeline 792720。最新 315/315 公開讀回已覆蓋現行輸出，沒有以舊 CI 代替本輪驗證。

## 本輪工程證據、後端與 Registry 來源

工程證據 batch 保留 17 檔／609,333 bytes；13 份既有 CAD 輸入以路徑、尺寸及 SHA 重用，沒有再複製原始 CAD。公開 Software 包含五份生成／說明來源及必要 `cad-source-manifest.json` 設定；七張圖與三頁技術 PDF 使用官方 CDN。私有郵件、原截圖與個人聯絡資訊不在公開 package；迭代圖不代表漏液、密封或電路問題已修復驗證。

新增後端是 **四受體 Pearson 參考圖樣比較器**，不是已訓練 PN–KC–MBON。通道設定為 D1 Or22a、D2 Or35a、D3 Or85b、D4 Or98a（各配 ORCO），與先前細胞硬體測試不同；不能重標舊資料。它從 I/Q 與校正紀錄重建 ΔF/F₀，分別比較 laboratory Test 1 與 DoOR 參考。顯示分數為 `100 × max(0, r)`，不是機率、氣味身分或已驗證的分類正確率；原始 signed r 保留。參考 JSON 從已完整 GET/SHA 的官方 CDN 取得，不存入 Git。

225 項來源測試通過，涵蓋 Python、演算法／virtual DOM、主機端韌體 sampler／serializer 及參考檔安裝檢查。選用的真實 Playwright history-browser 檢查未執行，與已跑的 virtual-DOM 測試分開；本輪未操作或燒錄電路板，也未宣稱完成 PlatformIO 實板驗收。Registry 13 份 Markdown 與一份分析生成程式僅修正 Test 1／Test 2 標示及來源可用性，既有數值表與圖不變。

此階段窄幅 canonical 保存共新增 72 檔／3,623,625 bytes，包含必要差異來源、工程 package、四張先前 CDN gel exact bytes 與公開讀回證據，沒有整站備份。Software `{software_commit}` 的 49 份來源／設定加 manifest 共 50 個公開檔案均逐一匹配 commit blob。Registry 線上圖片替換使用另一份 upload payload，不改已凍結的本地 Markdown 或 Software 來源。
'''
assert old in review;review=review.replace(old,new,1)
review=review.replace('現行研究主清單有 8,089 筆來源記錄、7,729 個唯一 payload、24,961,249,222 bytes；這次沒有重新讀完全部研究包。','該方法增補階段的研究主清單為 8,089 筆來源記錄、7,729 個唯一 payload、24,961,249,222 bytes；現行總數見本文開頭，本輪只讀新檔與必要差異，未重新讀完整研究包。',1)
row='| 移轉後 Wiki 的重複研究來源 |'
insertion='| 完整曲線增補前的 compiled 輸出 | 287 檔／16,627,568 bytes | 新輸出核對後逐檔移除舊版本，再以原生移動更新 active public；未觸碰被拒絕清理的檔案。 |\n| 工程／後端增補前的 compiled 輸出 | 287 檔／16,687,458 bytes | 與上一版本分開的完成收據；目前 active public 保留 287 個已核對檔案。 |\n'
assert row in review;review=review.replace(row,insertion+row,1)
old='兩個 `.pyc` 的清除曾被自動審核拒絕；未重試，仍列為未清除項目。'
new='自動審核拒絕清理的檔案共 **83 份**：2 份 `.pyc`、17 份上傳 staging、16 份來源重複工作副本及 48 份測試工作檔。各組均保留、沒有重試或改用其他方式刪除；其中後兩組共 539,897 bytes，未當作已去重 canonical。另有 **4 份歷史 gel cache 工作副本**仍保留，並不屬於這 83 份 blocked 檔案；其 exact canonical 已另存並登錄。'
assert old in review;review=review.replace(old,new,1)
old='包含先前六份工作／展示／上傳清理收據後，15 份完成收據共移除 **5,489 檔、470,961,608 bytes**。所有刪除來源路徑已重新確認互不重疊且不存在；Registry 診斷正文的 30,181 bytes 精簡另列，不計作檔案刪除。此前 odor／影片／教育清理另有收據，不重複加總。'
new='包含先前六份工作／展示／上傳清理及本輪兩次已核對的 public 更新，17 份完成收據共移除 **6,063 個舊版本檔案、504,276,634 bytes**。每次 public 更新按不同版本的完成收據計數，不把保留的 active public 或 blocked 清單算成已刪除。Registry 診斷正文的 30,181 bytes 精簡另列，不計作檔案刪除。此前 odor／影片／教育清理另有收據，不重複加總。'
assert old in review;review=review.replace(old,new,1)
review=review.replace('先前 Wiki 版本已部署；本輪增補待部署。Judging 已就緒但待使用者提交','最新 Wiki 本輪增補已部署並公開讀回。Judging 已就緒但待使用者提交',1)
review=review.replace('新增 Software 已讀回，Wiki 方法與圖仍待本輪部署','新增 Software 與 Wiki 方法／圖均已公開讀回',1)
formal_start=review.index('Registry 的 25 個 parts 加 collection 已準備 76 個文件更新內容。',review.index('## 正式交件狀態'))
formal_end=review.index('\n\nAttributions',formal_start)
formal='Registry 的 25 個 parts 加 collection 共 76 項更新目前為 **IN PROGRESS**。使用者已登入有作者權限的 **Ijung Chen** 並 Opted in。先前 Save 的實際回應已確認為 **400：Only images uploaded to the Registry are allowed**；不能再寫成不明原因或尚待切換帳號。75 張圖片已經官方 Insert Image 上傳，75/75 公開可讀與來源映射核對通過；Registry 會自動轉製／縮放 AVIF，因此不宣稱跨版本 bytes 一致。首筆 Or35a 既有 characterisation `c09e424a-254d-42f7-9b0b-b8ba0e48659e` 的標題與全文已獨立讀回一致。發布負責人正在儲存其餘條目；**目前已證實至少 1/76，整批完成與否須等 76 項最終全文讀回**，不以按下 Save、圖片上傳或本機 payload 直接宣稱全數發布。'
review=review[:formal_start]+formal+review[formal_end:]
review=review.replace('公式及錨點／新增繁中對應檢查完成，正式部署待主流程驗證。','公式及錨點／新增繁中對應檢查完成，pipeline 792720 的現行正式部署已讀回。',1)
evidence='- 本輪最新發布：`official-ci-792720.json`、`official-wiki-deployment-readback-792720.json`、`official-ci-public-hash-manifest-792720.json`；315/315（34 fresh、281 reused），Wiki `dbcfaf9414747dc2989b5ca134a1ea45452eea03`。\n- 本輪後端／工程來源：`../backend-publication-20261021/backend-engineering-publication-completion.json`、`software-publication-readback.json`（同目錄）；Software `df7b3bc9731fc03205e0a1ac907e90e634d693fb`、50/50 exact raw GET。\n- Registry 進行中證據：`registry-image-upload-readback.json`、`registry-or35a-first-confirmed-save.json`；75/75 圖片，首筆標題／全文相符。全 76 項正文最終讀回仍待發布負責人完成。\n- 本輪新增清理：`../measurement-curves-20261021/executed-public-refresh.json`、`../engineering-backend-20261021/executed-public-refresh.json`；blocked 16／48 副本另見 `../backend-publication-20261021/blocked-new-canonical-deduplication.json`、`blocked-temporary-test-cleanup.json`（同目錄）。\n'
review=review.replace('## 查核依據與待補欄位\n\n','## 查核依據與待補欄位\n\n'+evidence,1)
tail=review.index('**待補、不得視為已完成：')
review=review[:tail]+'**待補、不得視為已完成：Registry 其餘條目保存與 76 項最終全文讀回；使用者最後提交已就緒的 Judging Form；後續 Presentation Video／Judging Session；Zenodo 正式發布。** Wiki 最新 commit／pipeline 792720／315/315 與 Software 最新 commit／50/50 來源讀回已完成。Registry 圖片問題已確認並完成圖片遷移，條目發布是進行中，不再籠統標成 blocked。Safety 仍為 Final Submitted／Awaiting Review。後續只按實際保存與公開核對結果更新狀態，不由 Eligible 推論獲獎。\n'
assert research_limits==review.split('## 必須保留的研究解讀界線\n',1)[1].split('\n## 正式交件狀態',1)[0]
assert numeric_table==re.search(r'\| 配對構築 \|[\s\S]+?\n\n',review).group(0)
review_path.write_text(review,encoding='utf8')

status=read(status_path)
historical_attempts=json.dumps(status['attempts'],sort_keys=True)
status.update(status='Latest Wiki and MIT Software published and verified; Registry 76-entry rollout IN PROGRESS with first save confirmed; Judging draft not submitted; Zenodo local unpublished',
 remote_main=commit,wiki_local_commit=commit,updated_at_utc=now,
 next_scope='Root continues Registry UI saves and then verifies all 76 public bodies. User makes the final Judging Form Save and submit click. Presentation Video/Judging Session and Zenodo publication remain separate pending deliverables.',
 registry_published=False,registry_publication_complete=False,registry_publication_status='IN PROGRESS',
 registry_verified_saved_entries=1,registry_planned_entries=76,registry_image_uploads_verified=75,
 registry_published_field_scope='False means the full 76-entry rollout is not yet confirmed complete; one entry has been independently verified saved.',
 wiki_deployment_receipt='official-wiki-deployment-readback-792720.json',
 final_rollup='../backend-publication-20261021/backend-engineering-publication-completion.json')
status['software'].update(sources_staged=False,source_manifest_sha256=manifest,research_sources=1250,research_bytes=12053740,full_index_files=1258,commit=software_commit,
 changed_files_readback_pass=50,readback_receipt='../backend-publication-20261021/software-publication-readback.json')
status['validation'].update(software_research_exact_hash_pass=1250,remote_ci='Pipeline 792720 SUCCESS: locales 1911483, client 1911484, pages 1911485; artifact 4,882,631 bytes',
 public_readback='Latest Wiki 315/315 pass (34 fresh HTTP + 281 unchanged-hash proofs), 287 CI files and 28 routes; all 27 clean-route bases correct. Latest Software 50/50 changed files pass full anonymous raw GET/SHA. Prior 81 source-link and 549 CDN proofs retained as historical evidence.',measurement_english_words=1938)
status['registry']='IN PROGRESS: 75/75 Registry image uploads verified; first Or35a existing characterisation title/full body saved and independently matched. Root is saving the remaining planned entries. Complete 76-entry publication awaits final body readback. Prior HTTP 400 required Registry-uploaded images.'
status['registry_evidence']={'image_readback':'registry-image-upload-readback.json','first_save':'registry-or35a-first-confirmed-save.json','first_verified_entry_uuid':first['entry_uuid'],
 'image_verification_note':'Official Registry automatic AVIF conversion/resizing is recorded; no claim of byte identity to all source images.',
 'full_body_readback_status':'pending completion of UI saves','local_markdown_and_software_sources_unchanged_by_image_routing':True}
status['archive'].update(payload_files=7801,payload_bytes=24964872847,manifest_records=8161)
status['cleanup'].update(removed_files=6063,removed_bytes=504276634,receipts=17,blocked_files_remaining=83,
 blocked_groups={'pyc':2,'measurement_upload_staging':17,'backend_duplicate_sources':16,'backend_test_workfiles':48},
 blocked_retry_or_bypass=False,historical_gel_cache_work_copies_remaining=4,historical_gel_cache_in_blocked_count=False)
assert json.dumps(status['attempts'],sort_keys=True)==historical_attempts
write(status_path,status)

handoff=handoff_path.read_text(encoding='utf8');boundary=handoff.index('> 更新日期：')
historical_tail=handoff[boundary:]
head=f'''# AeroSense Wiki｜給接手 AI 的專案交接

## 2026-10-21 最新發布與交件狀態（優先於下方歷史紀錄）

最新 Wiki 已正常發布：commit `{commit}`，pipeline **792720**，locales／client／pages jobs **1911483／1911484／1911485** 全成功，artifact **4,882,631 bytes**。正式讀回 **315/315** 通過（34 次新 HTTP、281 份相同 SHA 證據沿用），包含 287 個 CI 檔案、67 個 HTML 請求與 28 個路由；27/27 clean-route base 正確。Measurement 現為約 **1,938 英文詞**；完整 odor raw／VUAA1 參照曲線、跨平台敏感度、工程證據與後端說明均已包含在現行部署，不能沿用「新增方法尚未上線」的舊狀態。

Software 最新正常 push 為 `{software_commit}`，本輪 **50/50** 份異動來源／manifest 已匿名 full GET 與 commit blob SHA／大小核對。現行 **1,250 份研究來源／12,053,740 bytes**，另有 7 支援檔和 manifest，共 1,258 項。Manifest SHA `{manifest}`。官方 repository 為 `https://gitlab.igem.org/2026/software/nthu/aerosense`，本地 `gitlab/aerosense-software/`，路徑保持 `code/aerosense/`、`docs/aerosense/`。MIT 已由使用者明確核准，僅適用團隊原創程式；Wiki、資料、圖文與第三方 notices 不變，不再詢問授權。

本輪後端是四受體 **Pearson 參考圖樣比較**，不是已訓練 PN–KC–MBON。配置 D1 Or22a、D2 Or35a、D3 Or85b、D4 Or98a（各配 ORCO），與先前硬體細胞測試不同。225 項來源測試通過；未操作／燒錄實板，選用 Playwright history-browser 檢查未執行。參考 JSON 已由官方 CDN 完整 GET/SHA 核對，沒有混入 Git 資料集。跨平台非特異相關限制仍保留，不能改寫成全部受體成功驗證。

**Registry 目前為 IN PROGRESS，不能寫成全數發布，也不再籠統標成 blocked。** Ijung Chen 已登入、有作者權限並 Opted in。實際 Save 失敗原因已確認為 **400：Only images uploaded to the Registry are allowed**。75 張圖已經官方 Insert Image 上傳，75/75 可讀與來源映射核對通過；Registry 自動 AVIF 轉製／縮放不宣稱與輸入 bytes 相同。首筆 Or35a characterisation `c09e424a-254d-42f7-9b0b-b8ba0e48659e` 的標題與全文已獨立公開讀回一致。主流程正在逐項儲存其餘文件；目前至少 **1/76** 已核實，須等全部寫入與 **76 項最終全文讀回**後才標完整發布。Registry 圖片改路由在獨立 upload payload，不改已凍結本地 Markdown／Software 來源。

Judging Form 的使用者核准 **150 字草稿**、六份正式證據頁查閱及六個 checkbox 已就緒；Summary 顯示 Bronze／Silver／Gold、Best Model／Education／Hardware 皆 Eligible，僅代表表單檢核，不保證達標或獲獎。**尚未提交，Save and submit 保留給使用者最後操作；期限 2026-10-21 23:00 臺灣時間，保留的草稿分頁不可重新整理。** 網站仍保留原定 157 字 Abstract。Attributions 三個 AI 工具用途已 Saved 並讀回。Project Safety 是 **Final Submitted／Awaiting Review**，PI Chung-Chuan Lo 已實際提交，兩份 safety check-in 為 Approved。Presentation Video 仍 No Submission，期限 2026-10-28 23:00 臺灣時間；Judging Session 為 2026-11-15 17:10–17:35 臺灣時間。

完整研究包 `zenodo-release/` **仍未發布**，現有 8,161 筆來源記錄、7,801 個唯一 payload、24,964,872,847 bytes；舊 DOI `10.5281/zenodo.23469212` 為 404。官方 Wiki／Software 留可編輯來源與必要設定，靜態文件／圖表附件用官方 CDN，原始或大量數據留 canonical，不得偽裝副檔名或假稱已公開。GitHub 副本完全未動。

清理依完成收據共移除 6,063 個過時版本檔案／504,276,634 bytes，保留現行 active public 287 檔。**83 份被自動審核拒絕的檔案仍保留**：2 `.pyc`、17 upload staging、16 來源重複工作副本、48 測試工作檔；未重試或繞過。另有 4 份歷史 gel cache 工作副本保留，與 blocked 83 份分開；其 exact canonical 已登錄。不可在遞迴清理中夾帶移除被拒絕目標。

最新證據在 `aerosense-wiki/audit/final-publication-20261021/publication-status.json`、`RELEASE_REVIEW.md`、`official-ci-792720.json`、`official-wiki-deployment-readback-792720.json`；Software 與 archive 收據在 `aerosense-wiki/audit/backend-publication-20261021/backend-engineering-publication-completion.json`。Registry 後續完成數由主流程依新保存／全文讀回收據更新，不以此段的 1/76 當作已完成或永遠固定的最終數字。

'''
handoff_path.write_text(head+historical_tail,encoding='utf8')
assert handoff_path.read_text(encoding='utf8').split('> 更新日期：',1)[1]==handoff.split('> 更新日期：',1)[1]
receipt={'updated_at_utc':now,'scope':'Current release status and handoff priority summary only; no site/source/repository edits',
 'files':[{'path':str(p.relative_to(ROOT)),'before_sha256':before[str(p.relative_to(ROOT))],'after_sha256':sha(p)} for p in [review_path,status_path,handoff_path]],
 'verified_wiki_commit':commit,'pipeline':792720,'wiki_readback_passed':315,'fresh_http':34,'reused_sha_proofs':281,
 'software_commit':software_commit,'software_readback_passed':50,'registry_status':'IN PROGRESS','registry_images_verified':75,'registry_entries_planned':76,'registry_entries_verified_at_least':1,
 'judging_submitted':False,'blocked_cleanup_files':83,'separate_historical_gel_cache_files':4,
 'protected_handoff_history_unchanged':True,'protected_crossplatform_numeric_table_unchanged':True,'protected_research_limitations_and_record19_unchanged':True,
 'historical_push_attempts_unchanged':True,'github_untouched':True}
write(AUD/'release-current-state-refresh.json',receipt)
print(json.dumps(receipt,ensure_ascii=False,indent=2))
