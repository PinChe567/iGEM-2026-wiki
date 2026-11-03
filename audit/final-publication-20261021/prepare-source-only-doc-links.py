"""Prepare link-only/source-availability document patches; never change scientific values."""
from pathlib import Path
import collections,hashlib,json,os,re,urllib.parse
O=Path(__file__).resolve().parent;R=O.parents[2];repo=R/"gitlab/nthu";draft=O/"source-only-draft"
classification=json.loads((O/"source-only-policy-classification.json").read_text(encoding="utf-8"))
exclude={r["path"]:r for r in classification["records"] if r["decision"]=="exclude"}
by_source=collections.defaultdict(list)
urls={}
renderings={}
for row in json.loads((R/"aerosense-wiki/igem-upload/verified-official-urls.json").read_text(encoding="utf-8")):
 if row.get("response_sha256"):urls.setdefault(row["response_sha256"],row["official_url"])
for row in json.loads((O/"verified-cdn-corrections-mapping.json").read_text(encoding="utf-8"))["files"]:
 assert row["verified"] and row["response_sha256"]==row["sha256"] and row["response_bytes"]==row["bytes"]
 urls[row["sha256"]]=row["official_url"]
for row in json.loads((O/"verified-cdn-hardware-documents-mapping.json").read_text(encoding="utf-8"))["files"]:
 assert row["verified"] and row["response_sha256"]==row["sha256"] and row["response_bytes"]==row["bytes"]
 renderings[row["source_document_sha256"]]=row
def resolve(source,link):
 link=link.strip().split(' "')[0].strip("<>")
 if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:",link) or link.startswith(("#","/")):return None
 decoded=urllib.parse.unquote(link.split("#",1)[0].split("?",1)[0])
 try:return (repo/source).parent.joinpath(decoded).resolve().relative_to(repo.resolve()).as_posix()
 except ValueError:return None
def anchor(category):
 if category=="archive_bundle":return "original-analysis-packages"
 if category=="static_research_document":return "static-research-reports"
 if category in {"document","cad_export_or_binary","static_media","static_blank_template"}:return "documents-and-printable-artifacts"
 return "research-data"
for row in classification["records"]:
 if row["path"] in {"code/aerosense/README.md","docs/aerosense/archive-status.md"}:continue
 if row["decision"]!="retain" or Path(row["path"]).suffix!=".md":continue
 original=(repo/row["path"]).read_text(encoding="utf-8-sig")
 for link in re.findall(r'\[[^\]]*\]\(([^)]+)\)',original):
  target=resolve(row["path"],link)
  if target in exclude:by_source[row["path"]].append(dict(source=row["path"],link=link,target=target))
edits=[];docs=[];unmapped=[]
for rel in sorted(by_source):
 current=repo/rel;original=current.read_text(encoding="utf-8-sig");changes=[]
 def replace(m):
  label,link=m.group(1),m.group(2);target=resolve(rel,link)
  if target not in exclude:return m.group(0)
  ex=exclude[target];url=urls.get(ex["sha256"])
  if url:
   replacement="["+label+"]("+url+")";route="exact-byte official CDN"
  elif ex["sha256"] in renderings:
   rendering=renderings[ex["sha256"]]
   suffix="（PDF呈現；原件已封存）" if re.search(r"[\u3400-\u9fff]",label) else " (PDF rendering; original archived)"
   replacement="["+label+suffix+"]("+rendering["official_url"]+")";route="verified PDF rendering of preserved source"
  else:
   section=anchor(ex["category"]);local=os.path.relpath(repo/"docs/aerosense/archive-status.md",(repo/rel).parent).replace("\\","/")
   suffix="（封存狀態；尚未公開）" if re.search(r"[\u3400-\u9fff]",label) else " (archive status; not publicly deposited)"
   replacement="["+label+suffix+"]("+local+"#"+section+")";route="explicit archive availability"
  changes.append(dict(source=rel,original_link=link,original_markup=m.group(0),target=target,sha256=ex["sha256"],route=route,replacement=replacement));return replacement
 text=re.sub(r"\[([^\]]*)\]\(([^)]+)\)",replace,original)
 assert len(changes)==len(by_source[rel]),(rel,len(changes),len(by_source[rel]))
 # Only publication-location prose is adjusted; all scientific results and methods remain unchanged.
 availability_changes=[]
 if rel=="docs/aerosense/education/README.md":
  a="These files are prepared locally for the official iGEM GitLab repository. Local\npreparation does not publish them or deploy the team Wiki. The current source\nand download hashes are recorded in `code/aerosense/source-manifest.json`."
  b="These documents use byte-verified official iGEM CDN download links. Their original bytes remain in the canonical archive; they are not bundled into the competition source-only repository. Source and download hashes are recorded in `code/aerosense/source-manifest.json`."
  assert a in text;text=text.replace(a,b);availability_changes.append(dict(before=a,after=b))
  a="The documents retain their original bytes. Website downloads should use the\nverified official publication URL once available, rather than embedding Drive."
  b="The linked documents retain their original bytes and use the verified official publication URLs."
  assert a in text;text=text.replace(a,b);availability_changes.append(dict(before=a,after=b))
 if rel=="docs/aerosense/hardware/README.md":
  a="The local website keeps a byte-identical PDF display copy because GitLab raw responses prohibit cross-origin embedding; its open/download links use these published files."
  b="PDF open/download links use verified official CDN copies. Entries labelled archive status are preserved artifacts without an established public download."
  assert a in text;text=text.replace(a,b);availability_changes.append(dict(before=a,after=b))
 note="Publication scope: this source-only repository retains editable source and methods. Descriptions of companion figures, videos, datasets or package files refer to the complete canonical research package. Only direct verified official URLs are download links; archive-status links report availability and do not publish the referenced file."
 # Marked block allows the exact original scientific narrative to be recovered for comparison.
 lines=text.splitlines(keepends=True);insert=1 if lines and lines[0].startswith("#") else 0
 block="\n<!-- BEGIN SOURCE-ONLY AVAILABILITY -->\n"+note+"\n<!-- END SOURCE-ONLY AVAILABILITY -->\n"
 lines.insert(insert,block);text="".join(lines)
 proof=text.replace(block,"")
 for change in reversed(availability_changes):proof=proof.replace(change["after"],change["before"])
 for change in changes:proof=proof.replace(change["replacement"],change["original_markup"],1)
 assert proof==original,rel
 out=draft/rel;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(text,encoding="utf-8")
 edits.extend(changes);docs.append(dict(path=rel,before_sha256=hashlib.sha256(current.read_bytes()).hexdigest(),candidate_sha256=hashlib.sha256(out.read_bytes()).hexdigest(),links_changed=len(changes),availability_prose_changes=availability_changes,scientific_narrative_exactly_recoverable=True))
for rel,r in {r["path"]:r for r in classification["records"] if r["decision"]=="retain" and Path(r["path"]).suffix in {".md",".html"}}.items():
 p=draft/rel if (draft/rel).is_file() else repo/rel
 text=p.read_text(encoding="utf-8-sig")
 links=re.findall(r'!?\[[^\]]*\]\(([^)]+)\)',text) if p.suffix==".md" else re.findall(r'(?:href|src)=["\x27]([^"\x27]+)',text)
 for link in links:
  target=resolve(rel,link)
  if target and not (repo/target).exists() and not (draft/target).exists():
   unmapped.append(dict(source=rel,link=link,target=target,reason="Existing absent relative target; not silently substituted with an unrelated file."))
out=dict(status="CANDIDATE ONLY; repository and index unchanged",documents=docs,edits=edits,link_count=len(edits),routes=dict(collections.Counter(r["route"] for r in edits)),scientific_narrative_preserved=True,remaining_preexisting_absent_targets=unmapped,remaining_preexisting_absent_target_count=len(unmapped))
(O/"source-only-doc-link-patch-receipt.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(dict(documents=len(docs),link_count=len(edits),routes=out["routes"],scientific_narrative_preserved=True,preexisting_absent_targets=len(unmapped))))

