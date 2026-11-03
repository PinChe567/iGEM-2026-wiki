"""Read-only repository policy inventory; writes only review outputs beside this tool."""
from pathlib import Path
import collections,csv,datetime,hashlib,json,os,re,subprocess
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];REPO=ROOT/"gitlab/nthu";ZEN=ROOT/"zenodo-release"
def native(p): return Path("\\\\?\\"+str(p.absolute())) if os.name=="nt" else p
def digest(p): return hashlib.sha256(native(p).read_bytes()).hexdigest()
head=subprocess.check_output(["git","rev-parse","HEAD"],cwd=REPO,text=True).strip()
previous=json.loads((REPO/"code/aerosense/source-manifest.json").read_text(encoding="utf-8"))
sources={r["path"]:r for r in previous["files"]}
archive_by_hash=collections.defaultdict(list)
with (ZEN/"manifest.csv").open(encoding="utf-8-sig",newline="") as f:
 for r in csv.DictReader(f):
  archive_by_hash[r["sha256"]].append(ZEN/r["destination_relative"])
archive_by_size=collections.defaultdict(list)
for base,dirs,names in os.walk(native(ZEN)):
 for name in names:
  p=Path(str(Path(base)/name).removeprefix('\\\\?\\'))
  try:archive_by_size[native(p).stat().st_size].append(p)
  except OSError:pass
checked_hash={}
def h(p):
 key=str(p)
 if key not in checked_hash:checked_hash[key]=digest(p)
 return checked_hash[key]
media={}
for r in json.loads((ROOT/"aerosense-wiki/igem-upload/verified-official-urls.json").read_text(encoding="utf-8")):
 if r.get("response_sha256"):media.setdefault(r["response_sha256"],[]).append(r["official_url"])
source_ext={".py",".js",".ts",".mjs",".cjs",".css",".html",".cpp",".h",".cs",".ps1",".sh",".sql",".scad",".kicad_pcb",".ini",".yaml",".yml"}
doc_ext={".md"}
binary_ext={".pdf",".docx",".xlsx",".zip",".stl",".brd",".png",".jpg",".jpeg",".webp",".gif",".avif",".svg",".wasm",".exe",".dll",".so",".bin",".pkl",".pickle",".pt",".pth",".onnx",".npy",".npz"}
build_names={"package.json","package-lock.json","tsconfig.json","tsconfig.base.json","site.json","assets-manifest.json"}
repo_meta={"code/aerosense/source-manifest.json","docs/aerosense/parts/publication-links.json"}
def classify(rel,p,b):
 ext=p.suffix.lower();name=p.name.lower()
 try:b.decode("utf-8-sig");text=True
 except UnicodeDecodeError:text=False
 if b"\x00" in b[:8192]:text=False
 if ext in binary_ext:
  kind="archive_bundle" if ext==".zip" else "document" if ext in {".pdf",".docx",".xlsx"} else "static_media" if ext in {".svg",".png",".jpg",".jpeg",".webp",".gif",".avif"} else "cad_export_or_binary"
  return "exclude",kind,"Archive, binary document, generated CAD export or static media belongs outside the competition repository.",False
 if ext in source_ext and text:
  return "retain","editable_source","Human-readable implementation, build script or editable engineering design source.",ext in {".scad",".kicad_pcb"}
 if ext in doc_ext and text:
  return "retain","markdown_documentation","Editable Markdown documentation; links/status must be reconciled with removed attachments.",False
 if ext=="" and text and (name in {".gitattributes",".gitignore","dockerfile","makefile","license"} or name.startswith("license")):
  return "retain","build_or_license_text","Repository/build metadata or required license text.",False
 if ext==".txt" and text:
  if "acquisition_settings" in name or name=="align.txt":
   return "exclude","research_record","Instrument acquisition record or bundled sample alignment output.",False
  return "retain","source_notes_or_dependencies","Readable README, runbook, environment/requirements or license text.",False
 if ext==".json" and text:
  d=json.loads(b.decode("utf-8-sig"))
  if name in build_names or name.endswith(".schema.json") or name.startswith("tsconfig."):
   return "retain","build_config_or_schema","Software dependency/configuration or validation schema, not a measured data table.",False
  if "/packages/core/src/labyrinth/map/" in rel:
   return "retain","authored_application_config","Authored game layout consumed as source configuration; not a scientific dataset.",True
  if "/environments/" in rel:
   return "retain","environment_metadata","Recorded package/tool versions for source reproducibility; no model weights.",False
  if rel in repo_meta:
   return "retain","publication_source_metadata","Source/attachment inventory; must be regenerated for source-only selection.",False
  if name=="design_parameters.json" or name in {"operating_refinement_config.json","operating_selected_check_config.json","operating_sweep_config.json"}:
   return "retain","authored_engineering_config","Explicit editable engineering/simulation input settings; no stored simulation result arrays.",True
  return "exclude","research_data_or_record","Conservative source-only selection: scientific results, research inputs, figure/application content or associated acquisition/provenance records are archived separately.",False
 if ext in {".csv",".tsv",".rpt"}:
  is_template="/templates/" in rel
  return "exclude","static_blank_template" if is_template else "research_dataset_or_report","Blank downloadable template belongs on static CDN." if is_template else "Raw/derived numerical table or generated research report; retain in Zenodo and link externally.",False
 return "exclude","unclassified_non_source","Not on the explicit source-text allowlist; preserve and review before any removal.",True
rows=[];missing=[];exclusion_canonical_errors=[]
for sub in ["code","docs"]:
 for base,dirs,names in os.walk(native(REPO/sub)):
  dirs[:]=[d for d in dirs if d not in {".git","node_modules","__pycache__"}]
  for name in sorted(names):
   p=Path(str(Path(base)/name).removeprefix('\\\\?\\'));rel=p.relative_to(REPO).as_posix();b=native(p).read_bytes();sha=hashlib.sha256(b).hexdigest()
   action,category,reason,review=classify(rel,p,b)
   record=dict(path=rel,bytes=len(b),sha256=sha,extension=p.suffix.lower(),decision=action,category=category,reason=reason,review_note=review,source_manifest_entry=sources.get(rel),verified_official_urls=list(dict.fromkeys(media.get(sha,[]))))
   if action=="exclude":
    candidates=list(archive_by_hash.get(sha,[]))
    s=sources.get(rel,{}).get("source","")
    if s.startswith("zenodo-release/"):candidates.append(ROOT/s)
    canonical=None
    for c in candidates:
     if native(c).is_file() and native(c).stat().st_size==len(b) and h(c)==sha:canonical=c;break
    if canonical is None:
     for c in archive_by_size.get(len(b),[]):
      if h(c)==sha:canonical=c;break
    if canonical:
     record["canonical_archive"]=canonical.relative_to(ROOT).as_posix()
     record["canonical_sha256_verified"]=True
    else:
     proposed=ZEN/"reproduction-source/gitlab-publication-review-20261021"/rel
     if native(proposed).exists() and h(proposed)!=sha:
      proposed=proposed.with_name(sha[:12]+"-"+proposed.name)
     record["canonical_archive"]=None;record["canonical_sha256_verified"]=False
     record["proposed_preservation_path"]=proposed.relative_to(ROOT).as_posix()
     missing.append(dict(path=rel,source_absolute=str(p),sha256=sha,bytes=len(b),proposed_preservation_path=record["proposed_preservation_path"],action="Archive exact bytes before any removal; currently planning only."))
   rows.append(record)
groups={}
for category in sorted({r["category"] for r in rows}):
 rs=[r for r in rows if r["category"]==category];groups[category]=dict(count=len(rs),bytes=sum(r["bytes"] for r in rs),decision=rs[0]["decision"])
endhead=subprocess.check_output(["git","rev-parse","HEAD"],cwd=REPO,text=True).strip()
result=dict(checked_at_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope="Current working-tree code/ and docs/ only. No repository/index mutation, no uploads, no format renaming.",head_before=head,head_after=endhead,root_reported_policy="Archives, binaries, model weights, datasets and binary documents are rejected by the competition hook. Source code and editable text documentation are candidates for a source-only commit; documents/static media use official CDN, research datasets/models use a separately published repository such as Zenodo.",status="Read-only proposed classification; not evidence of any successful push.",files=len(rows),bytes=sum(r["bytes"] for r in rows),groups=groups,retain_count=sum(r["decision"]=="retain" for r in rows),exclude_count=sum(r["decision"]=="exclude" for r in rows),excluded_with_verified_canonical=sum(r.get("canonical_sha256_verified",False) for r in rows),excluded_without_canonical=len(missing),preservation_required_bytes=sum(r["bytes"] for r in missing),existing_source_manifest_sha256=digest(REPO/"code/aerosense/source-manifest.json"),review_notes=["No files were renamed to disguise formats.","All CSVs are classified outside the competition repository, including small/blank templates.","Scientific JSON/provenance exports are conservatively excluded; package manifests, schemas and authored input configurations are distinguished explicitly.","Kept Markdown/HTML can retain prose evidence but must not embed a substituted full dataset or model weights.","Plain-text KiCad/OpenSCAD and authored map/config inputs are marked for root review; the current .brd is a binary and excluded.","This classification does not assert that an unpublished Zenodo preparation is already a public download."],records=rows)
(OUT/"source-only-policy-classification.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
with (OUT/"source-only-policy-classification.csv").open("w",encoding="utf-8-sig",newline="") as f:
 fields=["path","decision","category","bytes","sha256","canonical_archive","canonical_sha256_verified","proposed_preservation_path"]
 w=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore");w.writeheader();w.writerows(rows)
(OUT/"source-only-preservation-plan.json").write_text(json.dumps(dict(status="PLAN ONLY - NO ARCHIVE OR DELETE PERFORMED",files=missing,count=len(missing),bytes=sum(r["bytes"] for r in missing)),ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in result.items() if k not in ["records","root_reported_policy","review_notes"]},ensure_ascii=False,indent=2))

