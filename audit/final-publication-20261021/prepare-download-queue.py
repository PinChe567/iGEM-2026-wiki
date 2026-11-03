"""Classify reachable static downloads and stage unique current bytes, never publish."""
from pathlib import Path
from collections import defaultdict,Counter
import datetime,hashlib,json,re,shutil
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];SITE=ROOT/'aerosense-wiki'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
media=json.loads((OUT/'media-publication-audit.json').read_text(encoding='utf-8'))
verified=json.loads((SITE/'igem-upload/verified-official-urls.json').read_text(encoding='utf-8'))
byhash=defaultdict(list)
for r in verified:
    if r['source_sha256']==r['response_sha256']:byhash[r['source_sha256']].append(r['official_url'])
groups={};excluded=[]
def add(p,refs,role):
    h=sha(p);r=groups.setdefault(h,{'sha256':h,'bytes':p.stat().st_size,'source_paths':[],'references':[],'roles':[]})
    rel=p.relative_to(ROOT).as_posix()
    if rel not in r['source_paths']:r['source_paths'].append(rel)
    r['references']+=refs
    if role not in r['roles']:r['roles'].append(role)
for item in media['all_local_assets']:
    for rel in item['paths']:
        p=SITE/rel;ext=p.suffix.lower()
        if ext in {'.csv','.json','.md','.txt','.zip','.xlsx'}:
            add(p,[{'source':rel,'referenced_by':item['referenced_by']}],'static downloadable research/document attachment')
        elif ext not in {'.svg'}:
            excluded.append({'path':rel,'reason':'GitLab first-party/runtime/source code or accompanying vendored license; not an uploaded media/document dependency','extensions':ext})
for md in (ROOT/'registry_docs_v2').glob('*.md'):
    for target in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)',md.read_text(encoding='utf-8')):
        if target.startswith('data/'):
            add(ROOT/'registry_docs_v2'/target,[{'source':'registry_docs_v2/'+target,'referenced_by':[md.relative_to(ROOT).as_posix()]}],'Registry downloadable evidence/provenance attachment')
queue=[];reuse=[]
for h,r in sorted(groups.items()):
    r['existing_verified_urls']=sorted(set(byhash[h]))
    r['canonical_path']=r['source_paths'][0]
    if r['existing_verified_urls']:reuse.append(r);continue
    p=ROOT/r['canonical_path'];folder='parts-data' if r['canonical_path'].startswith('registry_docs_v2/') else 'downloads'
    filename=h[:12]+'-'+p.name
    staged=OUT/'upload-staging'/folder/filename;staged.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,staged)
    assert sha(staged)==h
    r.update(remote_folder=folder,proposed_filename=filename,staging_path=str(staged),official_url=None)
    queue.append(r)
data={'prepared_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'staged; not uploaded','queue_count':len(queue),'queue_bytes':sum(r['bytes'] for r in queue),'groups':dict(Counter(r['remote_folder'] for r in queue)),'queue':queue,'verified_reuse':reuse,'excluded_source_runtime_files':excluded,'classification_notes':['All reachable local CSV/JSON listed here are static research/download attachments; none are fetched as runtime app state in the audited graph. Client-generated educational-study downloads are excluded.','HTML/CSS/JS/MJS/TS/Python and vendor LICENSE remain official GitLab source/runtime resources.','README files preserve original relative reproducibility filenames as plain documentation. Companion files must remain together in GitLab/download bundles; do not treat CDN hash-prefixed URLs as a directory-preserving execution package.','Six ZIPs and the XLSX are deliberate runtime downloads; preserve local canonical bytes until upload readback and reference rewriting are complete.','Registry data attachments included so entry bodies can point at verified public evidence without waiting for GitLab attachment publication.']}
(OUT/'official-download-upload-queue.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'count':len(queue),'bytes':data['queue_bytes'],'groups':data['groups'],'reuse':len(reuse)}))
