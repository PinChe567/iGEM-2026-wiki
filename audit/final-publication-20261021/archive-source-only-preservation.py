"""Preserve approved exact publication artifacts before source-only repository selection."""
from pathlib import Path
import collections,csv,datetime,hashlib,json,os
O=Path(__file__).resolve().parent;R=O.parents[2];Z=R/"zenodo-release";repo=R/"gitlab/nthu"
def native(p):return Path("\\\\?\\"+str(p.absolute())) if os.name=="nt" else p
def sha(p):return hashlib.sha256(native(p).read_bytes()).hexdigest()
plan=json.loads((O/"source-only-preservation-plan.json").read_text(encoding="utf-8"))
assert plan["count"]==31
with (Z/"manifest.csv").open(encoding="utf-8-sig",newline="") as f:
 reader=csv.DictReader(f);fields=reader.fieldnames;rows=list(reader)
existing={(r["source_relative"],r["destination_relative"]) for r in rows}
saved=[]
for item in plan["files"]:
 s=repo/item["path"];d=R/item["proposed_preservation_path"]
 assert native(s).is_file() and native(s).stat().st_size==item["bytes"] and sha(s)==item["sha256"]
 assert str(d.resolve()).startswith(str(Z.resolve())+os.sep)
 if native(d).exists():assert sha(d)==item["sha256"]
 else:native(d.parent).mkdir(parents=True,exist_ok=True);native(d).write_bytes(native(s).read_bytes())
 assert native(d).stat().st_size==item["bytes"] and sha(d)==item["sha256"]
 source="gitlab/nthu/"+item["path"];dest=d.relative_to(Z).as_posix()
 if (source,dest) not in existing:
  rows.append(dict(source_relative=source,destination_relative=dest,category="preserved-publication-artifact",sha256=item["sha256"],bytes=str(item["bytes"]),source_mtime_utc=datetime.datetime.fromtimestamp(native(s).stat().st_mtime,datetime.timezone.utc).isoformat(),corresponding_pages="publication source-only migration",direct_references=""));existing.add((source,dest))
 saved.append(dict(source=source,canonical_archive=d.relative_to(R).as_posix(),bytes=item["bytes"],sha256=item["sha256"],source_still_present=True))
with (Z/"manifest.csv").open("w",encoding="utf-8-sig",newline="") as f:
 w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
unique={r["destination_relative"]:r for r in rows};cats={}
for r in unique.values():
 v=cats.setdefault(r["category"],dict(files=0,bytes=0));v["files"]+=1;v["bytes"]+=int(r["bytes"])
summary=json.loads((Z/"summary.json").read_text(encoding="utf-8"))
summary.update(payload_files=len(unique),payload_bytes=sum(int(r["bytes"]) for r in unique.values()),manifest_source_records=len(rows),categories=cats)
summary["source_only_repository_preservation_2026_10_21"]=dict(checked_at_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),files=len(saved),bytes=sum(r["bytes"] for r in saved),all_source_and_archive_sha256_matched=True,repository_files_deleted=0,status="Exact preservation completed; repository source-only selection remains a separate step.",receipt="aerosense-wiki/audit/final-publication-20261021/source-only-preservation-receipt.json")
summary["current_publication_status"]["gitlab"]="Both attempted pushes were rejected by the official repository hook; remote unchanged. Preparing source-only code/Markdown/configuration selection. Binary documents/static assets use official CDN; research datasets/model weights remain outside the competition repository."
summary["current_publication_status"]["official_cdn"]="Previously byte-verified official uploads remain valid. GitLab fallback for 13 unsupported CDN attachments is withdrawn because the competition repository rejects archives, binary documents and datasets."
(Z/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
receipt=dict(checked_at_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),files=saved,count=len(saved),bytes=sum(r["bytes"] for r in saved),repository_deletions=0,index_changes=0,manifest_source_records=len(rows),payload_files=len(unique),payload_bytes=summary["payload_bytes"])
(O/"source-only-preservation-receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
classification=json.loads((O/"source-only-policy-classification.json").read_text(encoding="utf-8"))
by_source={r["source"].removeprefix("gitlab/nthu/"):r for r in saved}
for row in classification["records"]:
 if row["path"] in by_source:
  row["canonical_archive"]=by_source[row["path"]]["canonical_archive"];row["canonical_sha256_verified"]=True
 if row.get("review_note"):row["review_resolution"]="Root approved retention as genuine editable source; no format disguise."
classification.update(excluded_with_verified_canonical=classification["exclude_count"],excluded_without_canonical=0,preservation_required_bytes=0,preservation_receipt="source-only-preservation-receipt.json",source_review_approved=True)
(O/"source-only-policy-classification.json").write_text(json.dumps(classification,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
with (O/"source-only-policy-classification.csv").open("w",encoding="utf-8-sig",newline="") as f:
 fields2=["path","decision","category","bytes","sha256","canonical_archive","canonical_sha256_verified","proposed_preservation_path"]
 w=csv.DictWriter(f,fieldnames=fields2,extrasaction="ignore");w.writeheader();w.writerows(classification["records"])
plan["status"]="PRESERVATION COMPLETE - REPOSITORY FILES STILL PRESENT";plan["receipt"]="source-only-preservation-receipt.json"
(O/"source-only-preservation-plan.json").write_text(json.dumps(plan,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
p=Z/"PENDING.txt";t=p.read_text(encoding="utf-8")
t=t.replace("已選入官方 GitLab 發布副本；這不代表完整 Zenodo 包已公開。使用者已授權\nGitLab 發布，最終 commit、push 與匿名下載核對由主流程另行記錄。","原先選入 GitLab 發布副本，但兩次推送均遭官方 hook 拒絕，remote 未改變。\n官方 repository 只能保留程式、可讀文件與必要設定；資料集/模型須另行託管，\n文件與靜態素材使用官方 CDN。使用者已授權 GitLab 發布，正重新準備 source-only\n版本；這不代表完整 Zenodo 包已公開。")
t=t.replace("CDN 上傳器接受的 ZIP/XLSX/TXT/MD 已準備逐位元相同的 GitLab 下載副本，\n    仍需最終推送與公開網址讀回確認。","CDN 上傳器接受的 ZIP/XLSX/TXT/MD，其 GitLab fallback 方案已撤回；官方 hook\n    拒絕 archives、binary documents 與 datasets，不能改副檔名規避。")
t=t.replace("    小型 time series/ROI 記錄等已選入 GitLab 副本，不再概稱所有 raw 未選入。","    小型 time series/ROI 記錄等原先選入的 GitLab 副本未成功發布，將由 source-only\n    選集中排除；canonical 原值完整保留，不能宣稱已有 GitLab 公開下載。")
t+="\n2026-10-21 官方 hook 限制核對\n[x] 543 份建議排除的封裝/文件/靜態素材/研究資料皆已有 exact canonical。\n    原先缺少 exact Zenodo copy 的 31 份、48,195,978 bytes 已完成歸檔與 SHA\n    核對；這一步沒有刪除 GitLab 檔案或修改 index。GitLab 合法 source-only\n    清單及 README 候選版另由主流程核准後才套用。\n"
p.write_text(t,encoding="utf-8")
print(json.dumps({k:v for k,v in receipt.items() if k!="files"}))

