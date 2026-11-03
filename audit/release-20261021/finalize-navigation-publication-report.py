"""Finalize local audit metadata after the navigation deployment passed official CI.

Reads existing publication proofs; does not access HTTP, edit website/source,
operate Git, delete files or rehash the complete research archive.
"""
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone
import csv
import hashlib
import json
import os

ROOT = Path(__file__).resolve().parents[3]
ARC = ROOT / "zenodo-release"
AUD = ROOT / "aerosense-wiki/audit/final-publication-20261021"
REL = ROOT / "aerosense-wiki/audit/release-20261021"
WIKI = "79608d64aac297b48bca47bcb396f82d72e6fc67"
SOFTWARE = "e09ec6dc273cbffe92ccccdaca2814f3d2a57960"


def native(p):
    s = str(p.absolute())
    return Path("\\\\?\\" + s) if os.name == "nt" and len(s) >= 240 and not s.startswith("\\\\?\\") else p


def read(p):
    return json.loads(native(p).read_text(encoding="utf-8-sig"))


def sha(p):
    return hashlib.sha256(native(p).read_bytes()).hexdigest()


def write(p, d):
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf8")


def replace(text, old, new):
    if old in text:
        return text.replace(old, new)
    assert new in text, old[:120]
    return text


now = datetime.now(timezone.utc).isoformat()
ci = read(AUD / "official-ci-791345.json")
deployment = read(AUD / "official-wiki-deployment-readback-791345.json")
incremental = read(AUD / "navigation-incremental-readback-provenance.json")
original = read(REL / "public-download-readback.json")
plan = read(REL / "public-download-readback-plan.json")
nav = read(AUD / "navigation-source-preservation.json")
judging = read(AUD / "judging-form-draft.json")
assert ci["pipeline"]["sha"] == WIKI and ci["pipeline"]["status"] == "success"
assert deployment["wiki_commit"] == WIKI and deployment["summary"]["passed"] == 315
assert deployment["summary"]["failed"] == 0
assert incremental["all_targets_unchanged"] and incremental["new_http_requests"] == 0
assert incremental["official_ci_success_confirmed"] and incremental["official_pipeline"] == 791345
assert incremental["current_commits"] == {"wiki": WIKI, "software": SOFTWARE}
assert original["all_verified"] and original["counts"] == {"success": 81}
assert judging["evidence_checkboxes_confirmed"] and judging["submitted"] is False

with (ARC / "manifest.csv").open(encoding="utf-8-sig", newline="") as f:
    records = list(csv.DictReader(f))
unique = {}
for row in records:
    key = row["destination_relative"]
    if key in unique:
        assert unique[key]["sha256"] == row["sha256"]
    else:
        unique[key] = row
cats = defaultdict(lambda: {"files": 0, "bytes": 0})
for row in unique.values():
    cats[row["category"]]["files"] += 1
    cats[row["category"]]["bytes"] += int(row["bytes"])
assert (len(records), len(unique), sum(int(r["bytes"]) for r in unique.values())) == (8052, 7692, 24954977082)

summary = read(ARC / "summary.json")
cleanup = summary["final_publication_cleanup_2026_10_21"]
nav_cleanup_path = AUD / "executed-navigation-obsolete-public-cleanup.json"
nav_cleanup = read(nav_cleanup_path)
assert nav_cleanup["completed"] and not nav_cleanup["pyc_touched"]
assert nav_cleanup["removed_count"] == 287 and int(nav_cleanup["removed_bytes"]) == 16626299
nav_cleanup_relative = nav_cleanup_path.relative_to(ROOT).as_posix()
if not any(r["receipt"] == nav_cleanup_relative for r in cleanup["nonoverlapping_receipts"]):
    cleanup["nonoverlapping_receipts"].append({"receipt": nav_cleanup_relative, "files": 287, "bytes": 16626299})
removed_paths = set()
for entry in cleanup["nonoverlapping_receipts"]:
    data = read(ROOT / entry["receipt"])
    rows = next(v for k, v in data.items() if k in ["removed_files", "removed", "files"] and isinstance(v, list))
    for row in rows:
        value = row if isinstance(row, str) else row.get("source") or row.get("path") or "gitlab/nthu/" + row["repository_relative"]
        p = Path(value) if Path(value).is_absolute() else ROOT / value
        key = os.path.normcase(str(p.resolve()))
        assert key not in removed_paths and not native(p).exists(), str(p)
        removed_paths.add(key)
cleanup.update({
    "checked_at_utc": now,
    "scoped_removed_files": sum(r["files"] for r in cleanup["nonoverlapping_receipts"]),
    "scoped_removed_bytes": sum(r["bytes"] for r in cleanup["nonoverlapping_receipts"]),
    "unique_removed_paths_verified_absent": len(removed_paths),
    "scope_note": "Fifteen path-disjoint completed cleanup receipts, including the final navigation-obsolete compiled output. Earlier odor/video/education cleanup remains separate. No canonical research source loss or full-archive rehash is claimed.",
})
assert (len(cleanup["nonoverlapping_receipts"]), len(removed_paths), cleanup["scoped_removed_bytes"]) == (15, 5489, 470961608)

summary.update({"payload_files": len(unique), "payload_bytes": sum(int(r["bytes"]) for r in unique.values()), "manifest_source_records": len(records), "categories": dict(cats)})
summary["wiki_navigation_source_preservation_2026_10_21"] = {
    "receipt": "aerosense-wiki/audit/final-publication-20261021/navigation-source-preservation.json",
    "receipt_sha256": sha(AUD / "navigation-source-preservation.json"),
    "commit": WIKI, "files_checked": nav["files_checked"],
    "new_source_files": nav["new_source_files"], "new_source_bytes": nav["new_source_bytes"],
    "new_registered_files": nav["new_registered_files"], "new_registered_bytes": nav["new_registered_bytes"],
    "canonical_mapping": nav["canonical_mapping"], "canonical_mapping_sha256": nav["canonical_mapping_sha256"],
    "final_ci_pipeline": 791345, "final_ci_status": "success",
    "scope": nav["scope"], "full_site_backup_created": False,
}
summary["current_publication_status"].update({
    "checked_at_utc": now,
    "gitlab": f"Final normal pushes successful: Software {SOFTWARE} and Wiki {WIKI}. Official Wiki pipeline 791345 passed locales/client/pages. All 81 linked source routes retain successful public readback proof with unchanged committed source bytes/route identities.",
    "wiki": f"Official pipeline 791345 passed for commit {WIKI}. Deployed-site verification passed 315/315 targets: 86 fresh HTTP checks and 229 unchanged-SHA proofs reused. All 27 clean-route anchor bases passed. Root also tested Contribution section navigation and inline PDF, plus Hardware PDF page 2 of 21. Runtime publication contains 287 files; PDF.js uses verified official CDN modules.",
    "readback": "81/81 linked GitLab targets passed original readback: 46 full raw GET SHA/byte matches and 35 repository/path/title checks. Final navigation commit leaves all 81 target identities and committed source bytes unchanged; 0 additional source HTTP requests were needed. 549 existing CDN proofs retained. Independent deployed-site readback passed 315/315, including 86 fresh HTTP checks.",
    "judging_form": "User-approved 150-word draft and six evidence checkboxes are ready. Official summary displays Eligible for Bronze/Silver/Gold and Best Model/Education/Hardware as form validation only, not award adjudication. Save and submit was not clicked and is reserved for the user. Website Abstract remains the approved 157-word version.",
})
summary["frozen_public_download_readback_2026_10_21"].update({
    "plan_sha256": sha(REL / "public-download-readback-plan.json"), "counts": plan["counts"],
    "wiki_local_commit": WIKI, "successful_commits_reported_by_root": {"wiki": WIKI, "software": SOFTWARE},
    "wiki_pipeline": 791345, "wiki_ci_success_pending": False,
    "wiki_ci_receipt": "aerosense-wiki/audit/final-publication-20261021/official-ci-791345.json",
    "original_http_commits": original["commits"],
    "incremental_receipt": "aerosense-wiki/audit/final-publication-20261021/navigation-incremental-readback-provenance.json",
    "incremental_receipt_sha256": sha(AUD / "navigation-incremental-readback-provenance.json"),
    "incremental_new_http_requests": 0, "all_final_targets_unchanged": True,
    "verification_scope": "Original successful HTTP evidence: 46 exact source GETs plus 35 repository/path/title routes. Final commit reuses all 81 proofs after comparison against unchanged target identities and committed Git blobs; 549 CDN proofs reused. Independent deployed-site checks are recorded separately; no claim that every repository file was downloaded.",
})
summary["official_wiki_deployment_2026_10_21"] = {
    "receipt": "aerosense-wiki/audit/final-publication-20261021/official-wiki-deployment-readback-791345.json",
    "receipt_sha256": sha(AUD / "official-wiki-deployment-readback-791345.json"),
    "commit": WIKI, "pipeline": 791345, **deployment["summary"],
}
write(ARC / "summary.json", summary)

pending_path = ARC / "PENDING.txt"
pending = pending_path.read_text(encoding="utf-8-sig")
pending = replace(pending, "32d9f06ab6c29da742dc2a816bc285dd02f633ac，pipeline 791186", WIKI + "，pipeline 791345")
pending = replace(pending, "    公開頁面的導航/inline PDF 標題另由主流程作最小 UX 修正與驗證，不影響\n    已通過的來源下載證據；後續只針對真正變動的 URL/bytes 增量核對。", "    導航與 inline PDF 標題修正已部署：315/315 核對通過，其中 86 次新 HTTP、\n    229 份相同 SHA 證據沿用；27/27 clean-route 錨點 base 正確。主流程實點\n    Contribution 段落及 inline PDF、Hardware PDF 第 2/21 頁均正常。")
pending = replace(pending, "[ ] 完成正式 Zenodo 紀錄後", "[x] Judging 150 字草稿已核准，六份必要頁面已閱覽、六個 evidence checkbox\n    已確認；Summary 的 Bronze/Silver/Gold、Model/Education/Hardware 均為\n    Eligible，僅表示表單檢核通過，不代表獲獎或評審認定。\n[ ] Judging 的 Save and submit 留由使用者最後操作；目前未提交。\n[ ] 完成正式 Zenodo 紀錄後")
pending = replace(pending, "    289，另有 CDN-backed PDF module 工作副本 6 及其前一版 public 289。\n    14 份收據合計 5,202 份、454,335,309 bytes；逐項路徑去重與不存在檢查\n    通過。此前 odor/影片/教育\n    清理另有紀錄", "    289，另有 CDN-backed PDF module 工作副本 6、其前一版 public 289，\n    以及導航修正前 public 287。15 份收據合計 5,489 份、470,961,608 bytes；\n    逐項路徑去重與不存在檢查通過。此前 odor/影片/教育清理另有紀錄")
pending = replace(pending, "    現行主清單為 8,049 筆來源記錄、7,689 個唯一 payload，24,954,881,551 bytes。", "    最後導航修正只保存兩份異動來源 92,939 bytes；連保存映射新增 3 份、\n    95,531 bytes，沒有再複製整站。\n    現行主清單為 8,052 筆來源記錄、7,692 個唯一 payload，24,954,977,082 bytes。")
pending = replace(pending, "    不宣稱逐一 HTTP 下載全部 repository 檔案或完成所有網站 UX 驗證。", "    最後導航 commit 的 81 個目標與來源 bytes 全未變，因此沿用原成功證據、\n    新增來源 HTTP 請求為 0；部署頁另有 315/315 核對。這不宣稱逐一 HTTP\n    下載全部 repository 檔案或檢查每一種可能的使用情境。")
pending_path.write_text(pending, encoding="utf8")

review_path = AUD / "RELEASE_REVIEW.md"
review = review_path.read_text(encoding="utf-8-sig")
review = replace(review, "Commit `32d9f06ab6c29da742dc2a816bc285dd02f633ac` 的 pipeline **791186**", f"Commit `{WIKI}` 的 pipeline **791345**")
review = replace(review, "部署後的普通錨點導航及 inline PDF 標題另由主流程作最小 UX 修正；這不改科學內容或已通過的下載證據，後續依實際變動增量核對。", "普通錨點導航及 inline PDF 標題修正亦已部署：315/315 核對通過，包含 86 次新 HTTP 與 229 份相同 SHA 的既有證據；27/27 clean-route 錨點 base 正確。主流程另實點 Contribution 段落、inline PDF 及 Hardware PDF 第 2/21 頁，均正常。")
review = replace(review, "**Judging Form：使用者已核准 150 字草稿，摘要字數驗證通過；證據連結確認與正式提交尚待完成。** 網站保留使用者原定的 157 字 Abstract。不能把摘要通過視為整份表單已符合條件。", "**Judging Form：150 字草稿、六份必要頁面的查閱與六個 evidence checkbox 已就緒，僅待使用者按 Save and submit。** Summary 顯示 Bronze／Silver／Gold 與 Model／Education／Hardware 皆為 Eligible，僅代表表單檢核，不代表評審認定或獲獎；目前未提交。網站保留使用者原定的 157 字 Abstract。")
review = replace(review, "這是網站實際引用來源的檢查，不等同全部 repository 檔案逐一 GET 或全站 UX 已完成。", "最後導航 commit 的全部 81 個目標與來源 bytes 均未變，因此沿用原 HTTP 證據而不重複下載；增量 source HTTP 為 0。另有部署頁 315/315 核對通過。這不等同全部 repository 檔案逐一 GET，亦不宣稱測遍所有可能的使用情境。")
review = replace(review, "Wiki pipeline 791186 與本輪來源連結讀回亦已通過。", "Wiki pipeline 791345 與本輪來源連結／部署讀回亦已通過。")
review = replace(review, "現行 CI 使用官方 CDN 而不再產生模組。", "現行 CI 使用官方 CDN 而不再產生模組。最後導航修正只新增保存兩份異動來源、92,939 bytes；連同映射共新增 3 檔、95,531 bytes。現行研究主清單有 8,052 筆來源記錄、7,692 個唯一 payload、24,954,977,082 bytes；這次沒有重新讀完全部研究包。")
review = replace(review, "| 移轉後 Wiki 的重複研究來源 |", "| 導航修正前的 compiled 輸出 | 287 檔／16,626,299 bytes | 逐檔核對後移除，再移除 49 個空目錄；active public 287 檔前後 SHA 相符。 |\n| 移轉後 Wiki 的重複研究來源 |")
review = replace(review, "14 份完成收據共移除 **5,202 檔、454,335,309 bytes**", "15 份完成收據共移除 **5,489 檔、470,961,608 bytes**")
review = replace(review, "Wiki 已部署並通過 CI，部署後 UX 修正仍在主流程驗證；Judging 提交與後續影片／評審場次仍待完成。", "Wiki 已部署、CI／讀回及導航／PDF 實點通過；Judging 已就緒但仍待使用者提交，後續影片／評審場次仍待完成。")
review = replace(review, "標題與三個獎項已填入，仍是未提交草稿；Save and submit 留由使用者最後操作。", "標題與三個獎項已填入；六份必要頁面已閱覽、六個 evidence checkbox 已勾選，Summary 對 Bronze／Silver／Gold 與 Model／Education／Hardware 顯示 Eligible。這是表單檢核而非評審認定。草稿仍未提交，Save and submit 留由使用者最後操作，證據見 `judging-form-ready.png`。")
review = replace(review, "- 正式 CI 與來源讀回：`official-ci-791186.json`、`../release-20261021/public-download-readback.json`、`completed-public-readback-and-archive-rollup.json`；81/81 成功，549 CDN 證據沿用。", "- 正式 CI 與來源讀回：`official-ci-791345.json`、`../release-20261021/public-download-readback.json`、`navigation-incremental-readback-provenance.json`；81/81 原成功證據經最終來源對照沿用，549 CDN 證據保留。\n- 最終部署與導航：`official-wiki-deployment-readback-791345.json`、`official-ci-public-hash-manifest-791345.json`；315/315 通過，其中 86 新 HTTP、229 份相同 SHA 證據沿用，27/27 clean-route 錨點 base 通過。\n- 最終來源與總數：`navigation-source-preservation.json`、`final-navigation-publication-rollup.json`、`executed-navigation-obsolete-public-cleanup.json`。")
review = replace(review, "**待補、不得視為已完成：主流程的部署後 UX 修正／驗證；Registry 保存成功；Judging 正式提交與其他尚未交件項目；Zenodo 正式發布。** MIT、兩 repository 的成功 push、pipeline 791186 與 81/81 來源連結讀回已有證據。後續改動依影響範圍刷新 provenance／增量核對，由發布負責人維護 `publication-status.json` 與交接狀態。", "**待補、不得視為已完成：Registry 保存成功；使用者最後提交已就緒的 Judging Form；後續 Presentation Video／Judging Session；Zenodo 正式發布。** MIT、兩 repository 的成功 push、pipeline 791345、81/81 來源連結證據、315/315 部署核對及導航／PDF 實點均已完成。Safety 仍為 Awaiting Review。後續改動依影響範圍刷新 provenance／增量核對，由發布負責人維護 `publication-status.json` 與交接狀態。")
review_path.write_text(review, encoding="utf8")

rollup = {
    "completed_at_utc": now, "public_commits": {"wiki": WIKI, "software": SOFTWARE},
    "wiki_pipeline": 791345, "wiki_ci_status": "success",
    "source_link_targets_verified": 81, "source_full_get_proofs_reused": 46,
    "repository_route_proofs_reused": 35, "incremental_source_http_requests": 0,
    "cdn_proofs_reused": 549, "deployed_targets_verified": 315,
    "deployed_fresh_http": 86, "deployed_unchanged_proofs_reused": 229,
    "clean_route_anchor_bases_verified": 27,
    "payload_files": len(unique), "payload_bytes": summary["payload_bytes"],
    "manifest_records": len(records), "master_manifest_sha256": sha(ARC / "manifest.csv"),
    "navigation_sources_added": 2, "navigation_source_bytes": 92939,
    "navigation_registered_files_including_mapping": 3, "navigation_registered_bytes": 95531,
    "cleanup_receipts": 15, "cleanup_files": 5489, "cleanup_bytes": 470961608,
    "blocked_pyc_remaining": 2, "registry_prepared": 76, "registry_verified_published": 0,
    "judging_draft_ready": True, "judging_submitted": False,
    "zenodo_publication": "local_unpublished", "github_touched": False,
    "source_or_index_modified": False, "http_requests_by_this_finalizer": 0,
    "full_archive_rehashed": False,
    "proof_sha256": {name: sha(AUD / name) for name in ["official-ci-791345.json", "official-wiki-deployment-readback-791345.json", "navigation-incremental-readback-provenance.json", "navigation-source-preservation.json", "executed-navigation-obsolete-public-cleanup.json", "judging-form-draft.json"]},
    "summary_sha256": sha(ARC / "summary.json"), "pending_sha256": sha(pending_path), "release_review_sha256": sha(review_path),
}
write(AUD / "final-navigation-publication-rollup.json", rollup)
print(json.dumps(rollup, ensure_ascii=False))
