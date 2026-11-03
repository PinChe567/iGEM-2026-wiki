"""Refresh current archive status from completed, non-overlapping cleanup receipts."""
from pathlib import Path
import csv,datetime,hashlib,json
R=Path(__file__).resolve().parents[3]; O=R/"aerosense-wiki/audit/final-publication-20261021"; Z=R/"zenodo-release"
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
receipts=[]
for name in ["executed-duplicate-cleanup.json","executed-display-cleanup.json","executed-enose-cleanup.json","executed-registry-root-png-cleanup.json","executed-upload-staging-cleanup.json","executed-download-copy-cleanup.json"]:
 d=json.loads((O/name).read_text(encoding="utf-8-sig")); assert d["status"]=="complete"
 receipts.append(dict(receipt=str((O/name).relative_to(R)).replace("\\","/"),files=d.get("removed_count",d.get("removed_files")),bytes=int(d["removed_bytes"])))
assert all(isinstance(r["files"],int) for r in receipts)
protected=json.loads((O/"executed-duplicate-cleanup.json").read_text(encoding="utf-8-sig"))["protected_videos"]
for r in protected:
 p=Path(r["path"]); assert p.is_file() and p.stat().st_size==r["bytes"] and hashlib.sha256(p.read_bytes()).hexdigest()==r["sha256"]
d=json.loads((Z/"summary.json").read_text(encoding="utf-8"))
d["cleanup_status"]="Completed user-authorized, hash-guarded cleanup. Prior blocked attempts are historical records, not current pending actions. Protected canonical research inputs and the separate GitHub checkout remain."
d["current_publication_status"]={"checked_at_utc":now,"zenodo":"Full research package remains local and unpublished. The former DOI 10.5281/zenodo.23469212 returned 404 in the latest public check; it is not a valid download for this package.","gitlab":"User-authorized publication copy prepared; selected original instrument CSVs, small numerical/ROI records, code and derived evidence are included. Final commit/push and anonymous readback are separate root-controlled steps.","registry":"76 typed entries prepared across 26 target pages; publication blocked by account CLA/author permissions. No entry was posted by this preparation workflow.","registry_collection":"https://registry.igem.org/collections/40067138-a3dd-4e5b-b8a4-50b097ee0156","official_cdn":"35 scientific SVG, 8 game SVG and 58 CSV/JSON new attachments verified by full-byte anonymous readback. Existing Registry SVG/AVIF mappings reverified. 13 unsupported attachments use official GitLab fallback copies, pending push/readback.","videos":"All 15 mapped official videos public. Seven original AVI and three unique airflow MP4 remain in the canonical archive and were rehashed during this status update.","github_synchronized":False,"end_to_end_reproduction_complete":False,"pending_file":"PENDING.txt"}
d["final_publication_cleanup_2026_10_21"]={"checked_at_utc":now,"scoped_removed_files":sum(r["files"] for r in receipts),"scoped_removed_bytes":sum(r["bytes"] for r in receipts),"nonoverlapping_receipts":receipts,"scope_note":"These six receipts cover the current hardware working copies, generated display copies, historical feature working directory, original Registry PNG display copies, upload staging and unreferenced CDN download copies. Earlier odor/video/education cleanup remains separate historical scope; counts are not silently combined.","protected_videos_rehashed":len(protected),"original_avi_retained":sum(Path(r["path"]).suffix.lower()==".avi" for r in protected),"unique_mp4_retained":sum(Path(r["path"]).suffix.lower()==".mp4" for r in protected),"full_archive_rehashed":False}
d["display_output_archival_2026_10_21"]["status"]="All source/canonical pairs SHA-verified; 146 display copies removed with post-deletion canonical checks."
d["historical_feature_source_consolidation_2026_10_21"]["status"]="All 47 originals preserved by exact canonical matches; working copies and empty directory removed. The two supplied table-processing steps reproduce archived outputs byte-for-byte."
d["registry_original_curve_preservation_2026_10_21"]["display_copies_removed"]=14
d["publication_download_exact_copy_archive_2026_10_21"]["upload_staging_cleanup"]="Complete; all 114 staging files have verified surviving canonical sources."
d["source_verification_note"]="Latest complete historical payload readback is the retained 2026-10-20 full_readback_verification. Subsequent changed and newly archived files were independently SHA-verified within their dated receipts. The entire approximately 25 GB archive was not rehashed in this status update."
(Z/"summary.json").write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
pending="""AeroSense 研究資料包：目前狀態與待補項目
更新：2026-10-21（Asia/Taipei）

本包仍是本地、未發布的完整研究準備包。部分原始數值資料、程式及衍生結果
已選入官方 GitLab 發布副本；這不代表完整 Zenodo 包已公開。使用者已授權
GitLab 發布，最終 commit、push 與匿名下載核對由主流程另行記錄。
舊 DOI 10.5281/zenodo.23469212 在最新公開核對回傳 404，不作本包下載網址。

目前發布狀態

[x] 官方 CDN 新增的 35 份科學 SVG、8 份遊戲 SVG、58 份 CSV/JSON 已完整
    下載並比對 SHA-256。既有 Registry SVG/AVIF 亦已重新核對。13 份不受
    CDN 上傳器接受的 ZIP/XLSX/TXT/MD 已準備逐位元相同的 GitLab 下載副本，
    仍需最終推送與公開網址讀回確認。AVIF 與原 PNG 不宣稱跨格式逐位元相同。
[x] 15 份已對應官方網址的影片皆可公開存取；不再列為等待 moderation。
    7 份原始 AVI 與 3 份獨有 airflow MP4 保留在本包，並已重新比對校驗碼。
[x] Registry 的 26 個頁面、76 個 typed entries 已完成可貼入內容與附件對應。
[ ] Registry 帳號仍需 CLA/作者權限處理；目前尚未送出這批更新，不能以本地
    payload 宣稱已公開。舊條目保留作者與內容對應，避免重複發布。
    Collection: https://registry.igem.org/collections/40067138-a3dd-4e5b-b8a4-50b097ee0156
[ ] 完成正式 Zenodo 紀錄後，再填已驗證 DOI 與下載網址。正式標題、作者、
    機構、ORCID、版本及資料/程式授權仍需在真正發布時確認。
[ ] 第三方全文、供應商文件、PCB 附件與外部資料的再散布條件仍需逐項確認，
    尤其 soelter_thesis.txt、Dana2019-supplement.pdf 與 KT 資料集。
    MaleCNS 的 CC BY 4.0 歸屬與 UCI 資料來源應保留。

研究來源與重現的缺口

[ ] PN–KC–MBON：仍缺與網站結果對應的訓練引擎、已擬合前處理、fold tables
    及種子。eNose-feature-igem 補入的是既有表格建構與資料擴充程式，兩步
    已重現原表；它不是缺少的 decoder。01–04 表與 fig1–4 的原始產生程式
    仍未提供。合成擴充列不是生物重複，分割資料須依 source_compound 分組。
    四特徵 NumPy MLP odor_model.py 仍是另一個模型。
[ ] 受體交接包仍缺完整 MD trajectories/checkpoints/topologies、第三方
    model weights、原始 Gaussian logs/下載光譜與特定平台 binaries。
    處理後資料與程式完整保存，不等於每個 workflow 能端到端重現；
    特定軌跡也未必提供連續水分子與脂質尾座標。
[ ] Light-sheet GH146 歷史 run 02：已有 MAX_02.avi、ROI CSV、RoiSet.zip，
    缺完整 TIFF series 與 Settings。GH146 03、04、TH 各 696 張原始 TIFF
    已保存；影格或 ROI 數不等於獨立生物重複。
[ ] Test 1（原始識別碼 P2）缺部分 VOC 劑量、數值 gain、最終 DMSO/匹配
    vehicle 及加樣至讀取延遲；不能用推測補齊。32 份原始 instrument CSV、
    小型 time series/ROI 記錄等已選入 GitLab 副本，不再概稱所有 raw 未選入。
[ ] Test 2 的 12 份 XLSX 原始檔與 1,440 點原值完整保存。配製資訊依使用者
    提供：各氣味 1000x、VUAA1 100x、0.1% DMSO；母液濃度、精確配方、gain、
    加樣時間與獨立生物重複仍不能從儀器輸出獨立確認。

本輪分析的確認範圍

[x] Test 2 主要量為 S=100×(F1末/F1初−1)−100×(F0末/F0初−1)，單位百分點。
    F1 168 秒與 F0 48 秒不同；另留匹配前 48 秒的敏感度分析。Test 1 的
    四階段 peak-based 計算維持獨立定義。72 孔數值核對通過。
[x] 探索性 VUAA1 參照比 N=(Sodor−SDMSO)/(SVUAA1−SDMSO) 僅用 Test 2。
    66 格與來源吻合；0/1 是參照錨點，負值保留，Or7a 小分母有標示。
    分開的單孔量測不是轉染效率，也不是已證實的受體活化。
[x] Hardware Figure 18 每一條序列分別以自己的起點正規化 F/Fstart，
    並列晚期三點的描述性對比；沒有套用 fluorescein 濃度校正到細胞值。
    目前沒有匹配 vehicle 加樣、完整 dosing time、穩定 baseline 或獨立重複，
    不把曲線差異當成已確認 receptor response，也沒有發布跨平台一致性主張。
[x] 硬體校正/光學分析已完成的重現範圍見 reproduction-readme.txt；這些計算
    不增加獨立實驗重複。顯微 field-level 計數不是整體培養效率；CAD nominal
    尺寸不是製造公差；歷史 ADC 32767 失效與空白表單維持原意義。

清理與保存

[x] 經重新授權及來源/歸檔逐檔校驗，odor、hardware_test、hardware_test2、
    hardware_test3、eNose-feature-igem 的冗餘工作副本已移除。所有唯一研究
    來源、歷史版本與 provenance 先保存於 canonical archive。
[x] 本輪硬體工作副本 168、展示副本 146、eNose 工作副本 47、Registry PNG
    展示副本 14、上傳 staging 114、無引用的 CDN 下載副本 52，
    共 541 份、93,177,894 bytes，均有獨立
    清理收據及刪後 canonical 校驗。此前 odor/影片/教育清理另有紀錄，不重複加總。
[x] 14 份 Registry 原 PNG 保留原 bytes，官方顯示用 AVIF 另有讀回紀錄。
    可重建科學圖的來源、輸入及 archive 圖檔保留；必要 editable UI vectors
    與仍被設計 manifest 使用的 contact sheet 不移除。
[x] aerosense-wiki 與 github/iGEM-2026-wiki 是刻意保留的兩份工作區，GitHub
    本輪未同步。GitLab code/docs、Registry 證據附件與研究歷史版本各有用途。
[x] 舊 blocked-by-policy 嘗試留作歷史紀錄，已完成目標不再列為目前阻礙。

詳細來源、SHA、保留路徑與清理收據見 manifest.csv、summary.json，以及
aerosense-wiki/audit/final-publication-20261021/。本輪只對新增/異動及指定保存
項目重新 hash，不宣稱再次逐位元讀完全部約 25 GB 研究包。
"""
total=sum(r["bytes"] for r in receipts)
pending=pending.replace("93,177,894",f"{total:,}")
(Z/"PENDING.txt").write_text(pending,encoding="utf-8")
(O/"archive-current-status-review.json").write_text(json.dumps({"updated_at_utc":now,"scope_cleanup_receipts":receipts,"removed_files":sum(r["files"] for r in receipts),"removed_bytes":total,"protected_video_sha_checks":len(protected),"source_manifest_pending_publication":True,"full_archive_rehashed":False},indent=2)+"\n",encoding="utf-8")
print(json.dumps({"cleanup_files":sum(r["files"] for r in receipts),"cleanup_bytes":total,"protected_videos":len(protected),"payload_files":d["payload_files"],"payload_bytes":d["payload_bytes"]}))

