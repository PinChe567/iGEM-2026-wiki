"""Apply only approved source-only README/link/manifests; never delete or stage."""
from pathlib import Path
import datetime,hashlib,json,os,shutil,subprocess
O=Path(__file__).resolve().parent;R=O.parents[2];repo=R/"gitlab/nthu";draft=O/"source-only-draft"
def native(p):return Path("\\\\?\\"+str(p.absolute())) if os.name=="nt" else p
def sha(p):return hashlib.sha256(native(p).read_bytes()).hexdigest()
m=json.loads((draft/"code/aerosense/source-manifest.json").read_text(encoding="utf-8"))
index=repo/".git/index";before_index=sha(index)
entries={r["path"]:r for r in m["files"]}
for r in m["candidate_overrides"]:
 assert sha(repo/r["path"])==r["previous_sha256"],r["path"]
 assert sha(draft/r["path"])==r["candidate_sha256"],r["path"]
applied=[]
for r in m["candidate_overrides"]:
 source=draft/r["path"];dest=repo/r["path"]
 native(dest).write_bytes(native(source).read_bytes())
 assert sha(dest)==entries[r["path"]]["sha256"]
 applied.append(dict(path=r["path"],before_sha256=r["previous_sha256"],after_sha256=sha(dest)))
m["status"]="Source-only publication selection prepared in the working tree. Excluded artifacts remain pending approved canonical-guarded removal; no successful push or public deployment claimed."
m["summary"]["applied_to_repository"]=True
m["summary"]["excluded_artifact_removal_complete"]=False
m["applied_at_utc"]=datetime.datetime.now(datetime.timezone.utc).isoformat()
(repo/"code/aerosense/source-manifest.json").write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
for r in m["files"]:
 assert native(repo/r["path"]).stat().st_size==r["bytes"] and sha(repo/r["path"])==r["sha256"],r["path"]
assert sha(index)==before_index
receipt=dict(applied_at_utc=m["applied_at_utc"],files=applied,readme_documents=len(applied),manifest_sha256=sha(repo/"code/aerosense/source-manifest.json"),retained_files_verified=len(m["files"]),retained_bytes=sum(r["bytes"] for r in m["files"]),excluded_files_still_present=sum(native(repo/r["path"]).is_file() for r in m["excluded_artifacts"]),index_changed=False,repository_files_deleted=0)
(O/"applied-source-only-documents.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in receipt.items() if k!="files"}))

