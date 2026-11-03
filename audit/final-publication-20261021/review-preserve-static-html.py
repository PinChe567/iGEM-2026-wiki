"""Review HTML by purpose and preserve static research documents before exclusion."""
from pathlib import Path
import collections,csv,datetime,hashlib,json,os
O=Path(__file__).resolve().parent;R=O.parents[2];repo=R/"gitlab/nthu";Z=R/"zenodo-release"
def native(p):return Path("\\\\?\\"+str(p.absolute())) if os.name=="nt" else p
def sha(p):return hashlib.sha256(native(p).read_bytes()).hexdigest()
targets={
 "code/aerosense/wetlab/aerosense-wiki/assets/results/final-test/plate-p2-methods.html":"Static assay methods and reported-result document.",
 "code/aerosense/wetlab/aerosense-wiki/assets/results/final-test/source-index.html":"Static index of original instrument files and provenance; not executable application source.",
 "code/aerosense/wetlab/aerosense-wiki/assets/results/microscopy/analysis-report.html":"Generated static microscopy research report.",
 "docs/aerosense/hardware/component-audit-complete.html":"Static engineering component-audit document.",
 "docs/aerosense/model/reader-simulation-record.html":"Static simulation study report.",
 "docs/aerosense/model/receptor-analysis-record.html":"Static receptor-analysis study report.",
 "docs/aerosense/wetlab/aerosense-protocols.html":"Static laboratory protocol document."}
c=json.loads((O/"source-only-policy-classification.json").read_text(encoding="utf-8"));records={r["path"]:r for r in c["records"]}
with (Z/"manifest.csv").open(encoding="utf-8-sig",newline="") as f:
 reader=csv.DictReader(f);fields=reader.fieldnames;rows=list(reader)
byhash=collections.defaultdict(list)
for r in rows:byhash[r["sha256"]].append(Z/r["destination_relative"])
saved=[]
for path,why in targets.items():
 r=records[path];s=repo/path;assert sha(s)==r["sha256"];canonical=None
 for cand in byhash.get(r["sha256"],[]):
  if native(cand).is_file() and sha(cand)==r["sha256"]:canonical=cand;break
 new=canonical is None
 if new:
  canonical=Z/"reproduction-source/gitlab-publication-review-20261021"/path
  if native(canonical).exists():assert sha(canonical)==r["sha256"]
  else:native(canonical.parent).mkdir(parents=True,exist_ok=True);native(canonical).write_bytes(native(s).read_bytes())
  assert sha(canonical)==r["sha256"]
  rows.append(dict(source_relative="gitlab/nthu/"+path,destination_relative=canonical.relative_to(Z).as_posix(),category="preserved-static-research-document",sha256=r["sha256"],bytes=str(r["bytes"]),source_mtime_utc=datetime.datetime.fromtimestamp(native(s).stat().st_mtime,datetime.timezone.utc).isoformat(),corresponding_pages="static research document publication",direct_references=""))
 r.update(decision="exclude",category="static_research_document",reason=why+" Publish a true document format via official CDN or state archive availability; do not call it executable source merely because it uses HTML.",canonical_archive=canonical.relative_to(R).as_posix(),canonical_sha256_verified=True,semantic_review_completed=True)
 saved.append(dict(path=path,canonical_archive=r["canonical_archive"],sha256=r["sha256"],bytes=r["bytes"],new_canonical=new,repository_source_still_present=True))
for path,r in records.items():
 if r["extension"]==".html" and path not in targets:
  assert path.startswith("code/aerosense/education/") or path=="code/aerosense/hardware/03_software/firmware/data/index.html" or "/receptor-engineering/wiki-site/templates/" in path
  r["semantic_review_completed"]=True;r["semantic_review"]="Editable application/firmware HTML or reusable website template, not a standalone research document."
with (Z/"manifest.csv").open("w",encoding="utf-8-sig",newline="") as f:
 w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
unique={r["destination_relative"]:r for r in rows};cats={}
for r in unique.values():
 d=cats.setdefault(r["category"],dict(files=0,bytes=0));d["files"]+=1;d["bytes"]+=int(r["bytes"])
summary=json.loads((Z/"summary.json").read_text(encoding="utf-8"))
summary.update(payload_files=len(unique),payload_bytes=sum(int(r["bytes"]) for r in unique.values()),manifest_source_records=len(rows),categories=cats)
summary["static_research_html_review_2026_10_21"]=dict(reviewed_html=25,editable_html_retained=18,static_documents_excluded=7,new_canonical_files=sum(r["new_canonical"] for r in saved),new_canonical_bytes=sum(r["bytes"] for r in saved if r["new_canonical"]),repository_files_removed=0)
(Z/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
c["records"]=list(records.values());c["retain_count"]=sum(r["decision"]=="retain" for r in records.values());c["exclude_count"]=sum(r["decision"]=="exclude" for r in records.values());c["excluded_with_verified_canonical"]=c["exclude_count"]
groups={}
for r in records.values():
 g=groups.setdefault(r["category"],dict(count=0,bytes=0,decision=r["decision"]));g["count"]+=1;g["bytes"]+=r["bytes"]
c["groups"]=groups;c["html_semantic_review"]=summary["static_research_html_review_2026_10_21"]
(O/"source-only-policy-classification.json").write_text(json.dumps(c,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
out=dict(files=saved,html_review=c["html_semantic_review"],index_changed=False,repository_files_removed=0)
(O/"source-only-static-html-preservation.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in out.items() if k!="files"}))

