"""Anonymous full GET verification of the nine committed supplement changes."""
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import quote
import hashlib
import json
import subprocess

ROOT=Path(__file__).resolve().parents[3]
REPO=ROOT/"gitlab/aerosense-software"
AUD=ROOT/"aerosense-wiki/audit/final-publication-20261021"
BASE="https://gitlab.igem.org/2026/software/nthu/aerosense"

def git(*args):return subprocess.check_output(["git","-C",str(REPO),*args])

before=json.loads((AUD/"odor-pattern-software-precommit.json").read_text(encoding="utf8"))
commit=git("rev-parse","HEAD").decode().strip()
assert git("rev-parse","HEAD^").decode().strip()==before["base_commit"]
assert git("ls-remote","origin","refs/heads/main").decode().split()[0]==commit
assert not git("status","--porcelain").strip()
paths=sorted(before["expected_sha256"])
assert set(git("diff-tree","--no-commit-id","--name-only","-r","HEAD").decode().splitlines())==set(paths)
expectations=[]
for path in paths:
    blob=git("show",f"{commit}:{path}")
    digest=hashlib.sha256(blob).hexdigest()
    assert digest==before["expected_sha256"][path]
    expectations.append({"path":path,"expected_sha256":digest,"expected_bytes":len(blob),"url":BASE+"/-/raw/main/"+quote(path,safe="/")})

def check(item):
    row=dict(item)
    try:
        request=Request(item["url"],headers={"User-Agent":"AeroSense-source-verification/1.0","Accept":"*/*","Cache-Control":"no-cache"})
        with urlopen(request,timeout=45) as response:
            digest=hashlib.sha256();size=0
            while chunk:=response.read(1024*1024):digest.update(chunk);size+=len(chunk)
            row.update(http_status=response.status,final_url=response.url,content_type=response.headers.get("Content-Type",""),received_bytes=size,received_sha256=digest.hexdigest())
        row["status"]="success" if row["http_status"]==200 and row["received_bytes"]==item["expected_bytes"] and row["received_sha256"]==item["expected_sha256"] else "failed"
    except HTTPError as e:
        row.update(http_status=e.code,status="not_verified" if e.code in [403,429] else "failed",error=str(e))
    except (URLError,TimeoutError) as e:
        row.update(status="not_verified",error=str(e))
    return row

started=datetime.now(timezone.utc).isoformat()
with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(check,expectations))
counts={s:sum(r["status"]==s for r in results) for s in ["success","failed","not_verified"]}
report={"started_at_utc":started,"finished_at_utc":datetime.now(timezone.utc).isoformat(),
    "repository":BASE,"commit":commit,"parent":before["base_commit"],"branch":"main",
    "normal_push_confirmed_remote_head":True,"force_push":False,"anonymous_no_cookies_or_credentials":True,
    "checks":"Complete public raw responses, byte count and SHA256 compared with committed Git blobs, which also match canonical originals.",
    "concurrency":3,"counts":counts,"all_verified":counts["success"]==9,"results":results,
    "source_files":8,"metadata_manifests":1,"datasets_or_figures_published_to_git":False,
    "license_or_git_configuration_changed":False,"working_tree_clean":not git("status","--porcelain").strip()}
(AUD/"odor-pattern-software-publication-readback.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps({k:v for k,v in report.items() if k!="results"},indent=2))
assert report["all_verified"],"See per-file statuses in publication-readback receipt"
