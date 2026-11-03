"""Refresh publication hashes and append reviewed provenance; never copy, publish or commit."""
from pathlib import Path
import datetime,hashlib,json,os,subprocess
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];REPO=ROOT/'gitlab/nthu';PATH=REPO/'code/aerosense/source-manifest.json'
def native(p):return Path('\\\\?\\'+str(p.absolute())) if os.name=='nt' else p
def sha(p):return hashlib.sha256(native(p).read_bytes()).hexdigest()
def size(p):return native(p).stat().st_size
data=json.loads(PATH.read_text(encoding='utf-8'));old_count=len(data['files']);files={r['path']:r for r in data['files']}
def register(source,dest,selection,topic):
    p=REPO/dest;r=dict(files.get(dest,{}));r.update(path=dest,topic=topic,source=source,bytes=size(p),sha256=sha(p),selection=selection)
    src=ROOT/source
    if native(src).is_file():r.update(source_bytes=size(src),source_sha256=sha(src))
    files[dest]=r
for r in json.loads((OUT/'gitlab-research-sync-receipt.json').read_text(encoding='utf-8'))['files']:
    p=REPO/r['path'];s=ROOT/r['source']
    adapted=sha(p)!=sha(s)
    register(r['source'],r['path'],'publication adaptation: repository paths, dependency pins or public attachment links; scientific data unchanged' if adapted else 'byte-identical current canonical source/derived evidence; raw inputs remain separate archive','parts' if '/parts' in r['path'] else 'wetlab-current')
for r in json.loads((OUT/'official-gitlab-download-fallbacks.json').read_text(encoding='utf-8'))['files']:
    register(r['source_paths'][0],r['destination'],'byte-identical existing downloadable artifact; official GitLab fallback for unsupported CDN extension','reproducibility-download')
for r in json.loads((ROOT/'aerosense-wiki/audit/release-20261021/printable-stl-source-manifest.json').read_text(encoding='utf-8'))['files']:
    assert sha(REPO/r['destination'])==r['sha256']
    register(r['source'],r['destination'],'byte-identical printable CAD source; canonical research archive retained','hardware-printable')
for r in json.loads((ROOT/'aerosense-wiki/audit/release-20261021/doi-download-publish-manifest.json').read_text(encoding='utf-8'))['files']:
    assert sha(REPO/r['destination']) == sha(ROOT/r['source']) == r['sha256']
    register(r['source'],r['destination'],'byte-identical selected research input or derived evidence; official GitLab availability requires push and public readback','research-download')
for r in json.loads((ROOT/'aerosense-wiki/audit/release-20261021/contribution-evidence-refinement.json').read_text(encoding='utf-8'))['template_files']:
    assert sha(REPO/r['destination']) == sha(ROOT/r['source']) == r['sha256']
    register(r['source'],r['destination'],'byte-identical reusable blank template or schema; not measured experimental data','contribution-template')
for r in json.loads((OUT/'viewer-parameter-source-manifest.json').read_text(encoding='utf-8'))['files']:
    assert sha(REPO/r['destination']) == sha(ROOT/r['source']) == r['sha256']
    register(r['source'],r['destination'],'byte-identical parameter sweep table linked by the official interactive viewer','hardware-viewer-input')
for r in json.loads((OUT/'verified-enose-cleanup-plan.json').read_text(encoding='utf-8'))['gitlab_files']:
    source=r.get('canonical_archive_source',r['source'])
    register(source,r['destination'],r['selection'],'historical-feature-source')
for dest,source in [
    ('code/aerosense/wetlab/aerosense-wiki/data/README.md','aerosense-wiki/audit/final-publication-20261021/finalize-research-source-notes.py'),
    ('code/aerosense/wetlab/aerosense-wiki/data/hardware-test3-2026-10-21/requirements.txt','aerosense-wiki/audit/final-publication-20261021/finalize-research-source-notes.py'),
    ('code/aerosense/README.md','aerosense-wiki/audit/final-publication-20261021/finalize-research-source-notes.py'),
    ('code/aerosense/wetlab/reproduction-readme.txt','aerosense-wiki/audit/final-publication-20261021/finalize-research-source-notes.py'),
    ('docs/aerosense/archive-status.md','aerosense-wiki/audit/release-20261021/printable-stl-source-manifest.json')]:
    register(source,dest,'publication-authored status/reproduction document; source field identifies preparation evidence','publication-notes')
for dest in ['code/aerosense/hardware/README.md','code/aerosense/visualization/README.md',
             'code/aerosense/wetlab/README.md',
             'code/aerosense/wetlab/aerosense-wiki/wetlab results/description_lightsheet/README.md',
             'docs/aerosense/hardware/README.md']:
    register('gitlab/nthu/'+dest,dest,'publication-authored directory overview; source identifies this maintained repository document','publication-notes')
changed=[];missing=[]
for dest,r in files.items():
    p=REPO/dest
    if not native(p).is_file():missing.append(dest);continue
    h=sha(p);n=size(p)
    if r.get('sha256')!=h or r.get('bytes')!=n:changed.append(dest)
    r.update(sha256=h,bytes=n)
assert not missing,missing
data['files']=[files[key] for key in sorted(files)]
data['prepared_date']='2026-10-21'
data['status']='Current reviewed publication copy prepared locally; commit/push and public readback are separate steps'
data['baseline_before_current_publication']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()
data['review_2026_10_21']={'updated_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'file_count':len(files),'bytes':sum(r['bytes'] for r in files.values()),'added_manifest_entries':len(files)-old_count,'existing_entry_hashes_refreshed':changed,'new_experiment_policy':'Selected original Test 1 instrument CSVs, small light-sheet numerical/ROI records, source and derived evidence are included in the publication copy. New immutable XLSX/ADC exports, revision evidence and the full research package remain canonical archive inputs.','dependency_versions':{'numpy':'2.4.6','matplotlib':'3.11.1','openpyxl':'3.1.5'},'dependency_scope':'Verified currently installed versions, not a claim of a single frozen original environment.','validation':['Repository Registry read-only validation: 72 corrected wells and 66 reference ratios passed.','Both current plotting entry points ran from repository paths in figures-only mode.','All 58 supported CSV/JSON and 35 scientific SVG +8 game SVG attachments passed full-byte official CDN readback.','13 unsupported CDN file types use byte-identical official GitLab publication copies, pending push/readback.','188 DOI replacement publication files independently match their canonical archive bytes.','Historical eNose table building and augmentation reproduce retained outputs byte-for-byte; no matching PN-KC-MBON training engine is claimed.'],'raw_archive_publication':'Full research package prepared locally and unpublished; previous DOI did not resolve in latest public check. Selected original numerical records are included separately in the official GitLab publication copy.','remote_actions_by_this_script':False}
PATH.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'updated_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'count':len(files),'bytes':sum(r['bytes'] for r in files.values()),'new_entries':len(files)-old_count,'existing_refreshed':len(changed),'missing':missing,'manifest_sha256':sha(PATH)}
(OUT/'gitlab-source-manifest-validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
