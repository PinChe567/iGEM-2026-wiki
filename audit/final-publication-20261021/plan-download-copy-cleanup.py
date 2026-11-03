"""Plan removal only for uploaded, unreferenced website download copies."""
from pathlib import Path
import csv,json,hashlib
R=Path(__file__).resolve().parents[3]; O=R/"aerosense-wiki/audit/final-publication-20261021"; Z=R/"zenodo-release"
q=json.loads((O/"official-download-upload-queue.json").read_text(encoding="utf-8"))["queue"]
a=json.loads((O/"all-assets-inventory.json").read_text(encoding="utf-8"))
active={p for r in a["assets"] for p in r["paths"]}
byhash={}
with (Z/"manifest.csv").open(encoding="utf-8-sig",newline="") as f:
 for r in csv.DictReader(f):byhash.setdefault(r["sha256"],[]).append(r["destination_relative"])
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
files=[];retained=[]
for row in q:
 if row["remote_folder"]!="downloads":continue
 for source in row["source_paths"]:
  p=R/source
  if not p.is_file():continue
  if not row.get("official_url") or row.get("verification_status")!="full-byte SHA-256 verified on official iGEM CDN":
   retained.append(dict(source=source,reason="Unsupported CDN format; retained until official GitLab fallback is pushed and read back."));continue
  if p.relative_to(R/"aerosense-wiki").as_posix() in active:
   retained.append(dict(source=source,reason="Still required by the active runtime dependency graph."));continue
  assert p.suffix in [".csv",".json"]
  assert sha(p)==row["sha256"] and p.stat().st_size==row["bytes"]
  candidates=[Z/s for s in byhash.get(row["sha256"],[]) if (Z/s).is_file()]
  assert candidates,source
  c=candidates[0];assert sha(c)==row["sha256"] and c.stat().st_size==row["bytes"]
  files.append(dict(source=source,source_absolute=str(p),retain_canonical=str(c.relative_to(R)).replace("\\","/"),retain_canonical_absolute=str(c),sha256=row["sha256"],bytes=row["bytes"],official_url=row["official_url"],runtime_references=0))
d=dict(files=files,count=len(files),bytes=sum(r["bytes"] for r in files),retained=retained,dependency_graph="all-assets-inventory.json",scope="Only uploaded CSV/JSON download copies; code, licenses, Registry evidence and runtime inputs excluded.")
(O/"verified-download-copy-cleanup-plan.json").write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(dict(count=d["count"],bytes=d["bytes"],retained=len(retained))))

