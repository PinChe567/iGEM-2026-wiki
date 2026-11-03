"""Prepare an unapplied source-only manifest and link review without editing the repository."""
from pathlib import Path
import collections,datetime,hashlib,json,os,re,subprocess,urllib.parse
O=Path(__file__).resolve().parent;R=O.parents[2];repo=R/"gitlab/nthu";draft=O/"source-only-draft"
def native(p):return Path("\\\\?\\"+str(p.absolute())) if os.name=="nt" else p
def sha(p):return hashlib.sha256(native(p).read_bytes()).hexdigest()
c=json.loads((O/"source-only-policy-classification.json").read_text(encoding="utf-8"))
records={r["path"]:r for r in c["records"]}
extraction=json.loads((O/"zip-source-extraction-receipt.json").read_text(encoding="utf-8"))["files"]
for e in extraction:
 p=repo/e["path"]
 assert sha(p)==e["sha256"]
 records[e["path"]]=dict(path=e["path"],bytes=e["bytes"],sha256=e["sha256"],extension=p.suffix.lower(),decision="retain",category="editable_source" if p.suffix==".py" else "markdown_documentation",reason=e["selection"],review_note=False,source_manifest_entry=e,verified_official_urls=[])
for r in records.values():
 p=repo/r["path"];assert native(p).is_file() and sha(p)==r["sha256"],r["path"]
keep={k:r for k,r in records.items() if r["decision"]=="retain"}
exclude={k:r for k,r in records.items() if r["decision"]=="exclude"}
assert all(r["canonical_sha256_verified"] for r in exclude.values())
files=[];overrides=[]
for rel,r in sorted(keep.items()):
 if rel=="code/aerosense/source-manifest.json":continue
 p=repo/rel;candidate=draft/rel;is_override=candidate.is_file()
 content=candidate if is_override else p
 original=dict(r.get("source_manifest_entry") or {})
 if not original:
  source="gitlab/nthu/"+rel
  if rel=="code/aerosense/visualization/aerosense-wiki/resources/hardware-en/optical-validation/analyze_optical_validation.py":
   source="aerosense-wiki/resources/hardware-en/optical-validation/analyze_optical_validation.py"
  original=dict(path=rel,source=source,topic=r["category"],source_bytes=r["bytes"],source_sha256=r["sha256"],selection="Editable source retained; no raw or derived dataset represented by this file.")
 entry=original
 entry.update(path=rel,bytes=native(content).stat().st_size,sha256=sha(content),repository_policy_category=r["category"])
 if is_override:
  entry.update(previous_working_copy_sha256=r["sha256"],selection="Prepared source-only publication prose; no scientific inputs or values changed.",source="aerosense-wiki/audit/final-publication-20261021/source-only-draft/"+rel)
  overrides.append(dict(path=rel,candidate=str(candidate.relative_to(R)).replace("\\","/"),previous_sha256=r["sha256"],candidate_sha256=entry["sha256"]))
 files.append(entry)
excluded=[]
cdn_updates={r['sha256']:r for r in json.loads((O/'verified-cdn-corrections-mapping.json').read_text(encoding='utf-8'))['files']}
rendered_docs={r['source_document_sha256']:r for r in json.loads((O/'verified-cdn-hardware-documents-mapping.json').read_text(encoding='utf-8'))['files']}
for rel,r in sorted(exclude.items()):
 public_urls=list(r['verified_official_urls'])
 if r['sha256'] in cdn_updates:
  q=cdn_updates[r['sha256']];assert q['verified'] and q['response_sha256']==r['sha256'];public_urls=list(dict.fromkeys([q['official_url']]+public_urls))
 e=dict(path=rel,bytes=r["bytes"],sha256=r["sha256"],category=r["category"],canonical_archive=r["canonical_archive"],canonical_sha256_verified=True,verified_official_urls=public_urls,destination_policy="official iGEM CDN for static documents/media/templates; separately published data repository for research datasets/models",repository_policy="Excluded from proposed competition source-only commit; originals remain preserved.")
 if r['sha256'] in rendered_docs:
  q=rendered_docs[r['sha256']];assert q['verified'] and q['response_sha256']==q['sha256']
  e['verified_document_rendering']={k:q[k] for k in ['official_url','sha256','bytes','source_document_sha256','pages']}
  e['verified_document_rendering']['note']='PDF rendering of this preserved source; not byte identity between the source format and PDF.'
 excluded.append(e)
old=json.loads((repo/"code/aerosense/source-manifest.json").read_text(encoding="utf-8"))
m=dict(schema_version="aerosense-source-only-v1",prepared_date="2026-10-21",status="UNAPPLIED CANDIDATE: source-only selection; no successful push or publication claimed.",repository=old.get("repository","https://gitlab.igem.org/2026/nthu"),base_commit=subprocess.check_output(["git","rev-parse","HEAD"],cwd=repo,text=True).strip(),source_layout_policy="Retain genuine editable source, Markdown, necessary build/configuration and licenses. Restore external scientific inputs separately in a reproduction workspace; preserve original relative paths. No dataset format disguise.",files=files,excluded_artifacts=excluded,external_data_status="Full canonical research preparation remains local and unpublished. The former DOI returned 404. Static URLs are listed only when previously byte-verified; no GitLab binary/data fallback is used.",excluded_sources=old.get("excluded_sources",[]),reproduction_boundaries=["Source-only availability is not data availability or proof that all workflows reproduce.","ZIP-extracted Python and original README members preserve exact bytes; source_archive_sha256 and source_archive_member identify their provenance.","Archive README references to companion files refer to the complete archived package, not bundled repository data.","No matching PN-KC-MBON engine, fitted preprocessing, fold tables or seeds were supplied.","Registry posting and official website deployment remain separate actions."],candidate_overrides=overrides,approved_editable_source_review=[r["path"] for r in records.values() if r.get("review_note")],summary=dict(retained_manifest_files=len(files),retained_bytes=sum(r["bytes"] for r in files),excluded_artifacts=len(excluded),excluded_bytes=sum(r["bytes"] for r in excluded),all_excluded_have_verified_canonical=True,exact_zip_source_members=sum("source_archive_member" in r for r in files),index_changed=False,applied_to_repository=False))
out=draft/"code/aerosense/source-manifest.json";out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
broken=[]
for rel,r in keep.items():
 if Path(rel).suffix not in {".md",".html"}:continue
 p=draft/rel if (draft/rel).is_file() else repo/rel
 text=native(p).read_text(encoding="utf-8-sig")
 links=re.findall(r'!?\[[^\]]*\]\(([^)]+)\)',text) if p.suffix==".md" else re.findall(r'(?:href|src)=["\x27]([^"\x27]+)',text)
 for link in links:
  link=link.strip().split(' "')[0].strip("<>")
  if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:",link) or link.startswith(("#","/")):continue
  path=urllib.parse.unquote(link.split("#",1)[0].split("?",1)[0])
  try:target=(repo/rel).parent.joinpath(path).resolve().relative_to(repo.resolve()).as_posix()
  except ValueError:continue
  if target in exclude:
   ex=exclude[target]
   broken.append(dict(source=rel,link=link,excluded_target=target,canonical_archive=ex["canonical_archive"],verified_official_urls=ex["verified_official_urls"],category=ex["category"]))
(O/"source-only-retained-doc-links-review.json").write_text(json.dumps(dict(status="Review only; no repository document edits performed.",links=broken,count=len(broken),documents=len({r["source"] for r in broken})),ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
c.update(records=list(records.values()),files=len(records),bytes=sum(r["bytes"] for r in records.values()),retain_count=len(keep),exclude_count=len(exclude),source_review_approved=True,source_extraction_receipt="zip-source-extraction-receipt.json")
groups={}
for r in records.values():
 g=groups.setdefault(r["category"],dict(count=0,bytes=0,decision=r["decision"]));g["count"]+=1;g["bytes"]+=r["bytes"]
c["groups"]=groups
(O/"source-only-policy-classification.json").write_text(json.dumps(c,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(dict(candidate_manifest=out.relative_to(R).as_posix(),candidate_sha256=sha(out),**m["summary"],retained_document_links_needing_review=len(broken),affected_documents=len({r["source"] for r in broken})),ensure_ascii=False,indent=2))

