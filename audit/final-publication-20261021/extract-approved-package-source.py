"""Extract only exact Python/README sources approved for source-only publication."""
from pathlib import Path
import ast,hashlib,json,zipfile
O=Path(__file__).resolve().parent;R=O.parents[2];repo=R/"gitlab/nthu"
preserved=json.loads((O/"source-only-preservation-receipt.json").read_text(encoding="utf-8"))["files"]
canonical={Path(r["source"]).name:r for r in preserved if r["source"].endswith(".zip")}
targets={
 "crosstalk-calibration.zip":"code/aerosense/hardware/07_validation/crosstalk-calibration",
 "session-comparison.zip":"code/aerosense/hardware/07_validation/session-comparison",
 "fluorescein-analysis.zip":"code/aerosense/hardware/07_validation/reproduction-source/fluorescein-analysis",
 "unified-calibration.zip":"code/aerosense/hardware/07_validation/reproduction-source/unified-calibration"}
receipt=[]
for filename,destroot in targets.items():
 saved=canonical[filename];zpath=R/saved["canonical_archive"]
 assert hashlib.sha256(zpath.read_bytes()).hexdigest()==saved["sha256"]
 with zipfile.ZipFile(zpath) as z:
  for member in z.namelist():
   pp=Path(member)
   if not (pp.suffix.lower()==".py" or pp.name.lower().startswith("readme")):continue
   relative=pp
   package=filename.removesuffix(".zip")
   if pp.parts[0]==package:relative=Path(*pp.parts[1:])
   assert relative.suffix.lower() in {".py",".md",".txt"}
   b=z.read(member);dest=repo/destroot/relative;sha=hashlib.sha256(b).hexdigest()
   if dest.exists():assert dest.read_bytes()==b
   else:dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
   assert hashlib.sha256(dest.read_bytes()).hexdigest()==sha
   if dest.suffix==".py":ast.parse(b.decode("utf-8-sig"))
   receipt.append(dict(path=dest.relative_to(repo).as_posix(),source=saved["canonical_archive"],source_archive_sha256=saved["sha256"],source_archive_member=member,bytes=len(b),sha256=sha,selection="Exact original Python/README member from preserved research package; no data extracted.",topic="reproduction-source"))
 scope=repo/destroot/"PUBLICATION_SCOPE.md"
 text=f"""# Source-only publication scope

The Python source and original README files in this directory were extracted without byte changes from `{filename}`. Their ZIP hash, original member name and per-file SHA-256 are recorded in the source manifest.

CSV/JSON result tables, raw measurements, images and the ZIP itself are not part of this source-only repository selection. They remain in the separately retained canonical research package. The original README describes that fuller package; its mentions of companion data do not assert that those data are present here or publicly deposited.

Restore the documented input paths in an isolated reproduction workspace before running the analysis. Use documented input/output options where supported; otherwise preserve the original package layout outside this competition repository. Source inspection and syntax checks are not a fresh numerical rerun or physical validation.

This directory preserves the exact package version. Other historical/current scripts elsewhere in the repository may have different bytes and must not silently substitute for this source.
"""
 scope.write_text(text,encoding="utf-8")
 b=scope.read_bytes();receipt.append(dict(path=scope.relative_to(repo).as_posix(),source="aerosense-wiki/audit/final-publication-20261021/extract-approved-package-source.py",bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),selection="Publication-authored scope note; original package member files remain unchanged.",topic="reproduction-source"))
out=dict(files=receipt,count=len(receipt),exact_members=sum("source_archive_member" in r for r in receipt),scope_notes=sum("source_archive_member" not in r for r in receipt),data_files_extracted=0,previous_sources_overwritten=0,syntax_checks="All extracted Python files parse successfully.",index_changed=False)
(O/"zip-source-extraction-receipt.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in out.items() if k!="files"}))

