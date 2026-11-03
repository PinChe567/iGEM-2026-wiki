"""Register the two frozen supplementary analyses without a full archive scan.

Only explicitly listed editable source files are copied to Software. Existing
canonical entries and source-manifest records remain intact. No Git operation,
network operation, website edit or deletion is performed.
"""
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone
import argparse
import csv
import hashlib
import json
import shutil

ROOT=Path(__file__).resolve().parents[3]
ARC=ROOT/"zenodo-release"
SOFTWARE=ROOT/"gitlab/aerosense-software"
AUD=ROOT/"aerosense-wiki/audit/final-publication-20261021"
WET=ARC/"aerosense-wiki/data/odor-complete-curves-2026-10-21"
HARDWARE=ARC/"aerosense-wiki/data/hardware-wetlab-pattern-comparison-2026-10-21"

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding="utf-8-sig"))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+"\n",encoding="utf8")


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hardware-freeze-sha",required=True,help="Confirmed frozen SHA256 of hardware verification.json")
    args=parser.parse_args()
    assert sha(HARDWARE/"verification.json")==args.hardware_freeze_sha
    wetqa=read(WET/"derived/qa.json")
    assert wetqa["exact_raw_tidy_matches"]==5280 and wetqa["test2_figure14_max_error"]==0
    assert wetqa["test2_figure14_endpoints_checked"]==66
    snapshot=ARC/"reproduction-source/odor-pattern-supplement-publication-20261021"
    assert not snapshot.exists(), "This source edition is immutable; inspect its existing receipt rather than overwrite it."
    manifest_path=SOFTWARE/"code/aerosense/source-manifest.json"
    manifest=read(manifest_path);before_sha=sha(manifest_path)
    old_count=len(manifest["files"])
    old_bytes=sum(r["bytes"] for r in manifest["files"])
    copies=[]
    targets=[(WET,"code/aerosense/wetlab/aerosense-wiki/data/odor-complete-curves-2026-10-21",["analysis/build_complete_curves.py","README.md","METHODS.md","requirements.txt"]),
             (HARDWARE,"code/aerosense/hardware/07_validation/hardware-wetlab-pattern-comparison",["analyze_patterns.py","verify_patterns.py","README.md","requirements.txt"])]
    known={r["path"] for r in manifest["files"]}
    for batch,prefix,names in targets:
        for name in names:
            source=batch/name;relative=f"{prefix}/{name}";destination=SOFTWARE/relative
            assert source.is_file() and not destination.exists() and relative not in known
            destination.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(source,destination)
            digest=sha(source);assert sha(destination)==digest
            size=source.stat().st_size
            role="analysis_source" if source.suffix==".py" else "reproduction_documentation" if source.suffix==".md" else "dependency_specification"
            row={"path":relative,"source":source.relative_to(ROOT).as_posix(),"topic":"wetlab" if batch==WET else "hardware",
                 "source_bytes":size,"source_sha256":digest,"selection":"Frozen supplementary-analysis editable source; raw and derived data remain in canonical archive and selected official CDN attachments.",
                 "bytes":size,"sha256":digest,"repository_policy_category":role}
            manifest["files"].append(row);copies.append(row);known.add(relative)
    manifest["files"].sort(key=lambda r:r["path"])
    manifest["summary"]["retained_manifest_files"]=len(manifest["files"])
    manifest["summary"]["retained_bytes"]=sum(r["bytes"] for r in manifest["files"])
    manifest["finalized_at_utc"]=datetime.now(timezone.utc).isoformat()
    manifest["status"]="Published MIT-scoped Software baseline plus eight locally prepared supplementary-analysis source files; the new supplement commit/push/readback remains pending root verification. Full research archive remains locally prepared and unpublished."
    manifest["supplementary_analysis_update"]={"base_public_commit":"e09ec6dc273cbffe92ccccdaca2814f3d2a57960",
        "new_source_files":len(copies),"new_source_bytes":sum(r["bytes"] for r in copies),
        "paths":[r["path"] for r in copies],"raw_or_derived_datasets_copied_to_git":False,
        "source_manifest_before_sha256":before_sha,"publication_status":"prepared; commit/push/readback handled by root"}
    write(manifest_path,manifest)
    snapshot.mkdir(parents=True)
    shutil.copyfile(manifest_path,snapshot/"source-manifest.json")
    assert sha(snapshot/"source-manifest.json")==sha(manifest_path)
    provenance={"source_manifest_before_sha256":before_sha,"source_manifest_after_sha256":sha(manifest_path),
        "software_base_commit":"e09ec6dc273cbffe92ccccdaca2814f3d2a57960","new_files":copies,
        "canonical_source_policy":"Each new source already has its one canonical copy inside the corresponding analysis batch. Only the updated publication manifest is additionally preserved here.",
        "no_git_operations":True,"no_uploads":True,"old_files_rehashed":False}
    write(snapshot/"PROVENANCE.json",provenance)
    master=ARC/"manifest.csv"
    with master.open(encoding="utf-8-sig",newline="") as f:
        reader=csv.DictReader(f);fields=reader.fieldnames;records=list(reader)
    existing={r["destination_relative"]:r for r in records}
    additions=[]
    for directory,category in [(WET,"odor-complete-curve-supplement"),(HARDWARE,"hardware-wetlab-pattern-supplement"),(snapshot,"publication-source-provenance")]:
        for path in sorted(directory.rglob("*")):
            if not path.is_file():continue
            assert path.suffix not in {".pyc"} and "__pycache__" not in path.parts
            relative=path.relative_to(ARC).as_posix();digest=sha(path)
            assert relative not in existing, relative
            row={"source_relative":path.relative_to(ROOT).as_posix(),"destination_relative":relative,
                "category":category,"sha256":digest,"bytes":str(path.stat().st_size),
                "source_mtime_utc":datetime.fromtimestamp(path.stat().st_mtime,timezone.utc).isoformat(),
                "corresponding_pages":"Results supplementary curves; Hardware exploratory cross-platform patterns; Measurement analytical methods",
                "direct_references":""}
            records.append(row);existing[relative]=row;additions.append(row)
    with master.open("w",encoding="utf-8-sig",newline="") as f:
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(records)
    unique={}
    for r in records:
        if r["destination_relative"] in unique:assert r["sha256"]==unique[r["destination_relative"]]["sha256"]
        else:unique[r["destination_relative"]]=r
    categories=defaultdict(lambda:{"files":0,"bytes":0})
    for r in unique.values():categories[r["category"]]["files"]+=1;categories[r["category"]]["bytes"]+=int(r["bytes"])
    summary=read(ARC/"summary.json")
    summary.update({"manifest_source_records":len(records),"payload_files":len(unique),"payload_bytes":sum(int(r["bytes"]) for r in unique.values()),"categories":dict(categories)})
    summary["supplementary_curve_and_pattern_analysis_2026_10_21"]={"canonical_batches":[WET.relative_to(ROOT).as_posix(),HARDWARE.relative_to(ROOT).as_posix()],
        "new_registered_files":len(additions),"new_registered_bytes":sum(int(r["bytes"]) for r in additions),
        "new_software_source_files":8,"software_source_manifest_sha256":sha(manifest_path),
        "software_source_count":len(manifest["files"]),"software_source_bytes":manifest["summary"]["retained_bytes"],
        "source_manifest_canonical":(snapshot/"source-manifest.json").relative_to(ROOT).as_posix(),
        "wetlab_raw_readings_checked":5280,"wetlab_figure14_endpoint_checks":66,
        "wetlab_endpoint_max_error":0,"hardware_verification_sha256":args.hardware_freeze_sha,
        "website_source_prepared":True,"new_publication_status":"Prepared; root handles official CDN/source/Wiki publication and readback. Previous verified deployment remains recorded separately.",
        "full_archive_rehashed":False,"existing_raw_data_changed":False,"github_changed":False}
    write(ARC/"summary.json",summary)
    receipt={"completed_at_utc":datetime.now(timezone.utc).isoformat(),"new_software_sources":copies,
        "software_before_files":old_count,"software_before_bytes":old_bytes,
        "software_after_files":len(manifest["files"]),"software_after_bytes":manifest["summary"]["retained_bytes"],
        "software_manifest_sha256":sha(manifest_path),"new_archive_records":additions,
        "new_archive_files":len(additions),"new_archive_bytes":sum(int(r["bytes"]) for r in additions),
        "manifest_records":len(records),"payload_files":len(unique),"payload_bytes":summary["payload_bytes"],
        "master_manifest_sha256":sha(master),"summary_sha256":sha(ARC/"summary.json"),
        "no_git_operations":True,"no_uploads":True,"no_website_edits":True,"full_archive_rehashed":False}
    write(AUD/"odor-pattern-supplement-registration.json",receipt)
    print(json.dumps({k:v for k,v in receipt.items() if k not in {"new_software_sources","new_archive_records"}},indent=2))


if __name__=="__main__":main()
