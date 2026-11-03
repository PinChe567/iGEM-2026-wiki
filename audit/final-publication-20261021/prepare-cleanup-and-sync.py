"""Produce concrete local plans only. No removal, copy to GitLab, commit or upload."""
from pathlib import Path
from collections import Counter
import datetime,hashlib,json,os,stat
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(name,data):(OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
a=json.loads((OUT/'archive-cleanup-audit.json').read_text(encoding='utf-8'));items=[]
for candidate in a['hash_verified_root_duplicate_candidates']:
    source=ROOT/candidate['source'];canonical=ROOT/candidate['canonical_matches'][0]
    top=source.relative_to(ROOT).parts[0];assert top in {'hardware_test','hardware_test2','hardware_test3'}
    assert source.resolve().is_relative_to((ROOT/top).resolve())
    assert canonical.resolve().is_relative_to((ROOT/'zenodo-release').resolve())
    for p in [source,canonical]:
        for component in [p,*p.parents]:
            if component==ROOT.parent:break
            assert not bool(getattr(component.stat(),'st_file_attributes',0)&stat.FILE_ATTRIBUTE_REPARSE_POINT),component
        assert sha(p)==candidate['sha256'] and p.stat().st_size==candidate['bytes'],p
    items.append({**candidate,'source_absolute':str(source),'retain_canonical_absolute':str(canonical),'action':'remove only this verified duplicate source file; canonical archive remains','preflight_sha256_matches':True})
avi=[{**r,'absolute_path':str(ROOT/r['file'])} for r in a['remaining_local_videos'] if r['preserve']]
assert len(items)==168 and len(avi)==7
save('proposed-canonical-cleanup.json',{'prepared_at_utc':now(),'status':'Concrete hash-checked proposal; no deletions executed','count':len(items),'bytes':sum(r['bytes'] for r in items),'groups':dict(Counter(Path(r['source']).parts[0] for r in items)),'files':items,'protected_raw_avi':avi,'protected_other_archived_videos':[r for r in a['remaining_local_videos'] if not r['preserve']],'protected_paths':['github/ entire intentional GitHub checkout','aerosense-wiki/ active site','gitlab/nthu/.git/','gitlab/local-only/','zenodo-release/ entire canonical research/provenance archive','registry_docs_v2/ intentional documentation and local evidence package'],'execution_guards':['Immediately recheck exact absolute path containment, no reparse points, source and retained canonical SHA-256 and length before deleting each individual source file.','Never recursively delete a computed directory. Remove an empty source top-level directory only after confirming that exact directory is empty.','Do not add other files to this proposal merely because they look duplicated.','Temporary upload staging has a separate lifecycle: remove only after all upload receipts and all dependent public references are verified. No unique raw content is staged.'],'deliberate_duplicates_to_keep':['Active site and entire github/iGEM-2026-wiki are separate required workflows.','Canonical Zenodo raw/provenance, Registry imported attachments, runtime ZIP downloads and GitLab source copies have different roles.','Six static ZIPs are user-facing bundles. Keep canonical content and preserve runtime availability until CDN reference replacement succeeds.']})

sync=[]
def mapfile(p,target,role):
    dest=ROOT/'gitlab/nthu'/target
    sync.append({'source':p.relative_to(ROOT).as_posix(),'destination':target,'role':role,'source_sha256':sha(p),'bytes':p.stat().st_size,'destination_exists':dest.exists(),'destination_sha256':sha(dest) if dest.is_file() else None,'action':'replace' if dest.exists() else 'add'})
for batch in ['odor-2026-10-21','hardware-test3-2026-10-21']:
    base=ROOT/'zenodo-release/aerosense-wiki/data'/batch;target='code/aerosense/wetlab/aerosense-wiki/data/'+batch
    for p in base.rglob('*'):
        if not p.is_file() or any(x in p.relative_to(base).parts for x in ['raw','figures','revisions','__pycache__']):continue
        if p.suffix.lower() in {'.py','.txt','.md','.csv','.json'}:mapfile(p,target+'/'+p.relative_to(base).as_posix(),'analysis source and small derived/provenance evidence; raw inputs remain canonical archive')
for p in (ROOT/'registry_docs_v2').rglob('*'):
    if not p.is_file() or '__pycache__' in p.parts:continue
    rel=p.relative_to(ROOT/'registry_docs_v2')
    if rel.parts[0]=='figures':continue
    if p.suffix=='.py':target='code/aerosense/parts-analysis/'+p.name;role='Registry generator source; workspace layout restoration required for new importer'
    elif p.suffix.lower() in {'.md','.json','.csv','.txt'}:target='docs/aerosense/parts/'+rel.as_posix();role='latest canonical Registry documentation and linked small evidence'
    else:continue
    mapfile(p,target,role)
save('gitlab-sync-plan.json',{'prepared_at_utc':now(),'status':'Proposed mappings only; GitLab checkout unchanged','destination_repository':'https://gitlab.igem.org/2026/nthu.git','files':sync,'count':len(sync),'bytes':sum(r['bytes'] for r in sync),'path_dependencies':['Keep both experimental batches as siblings so hardware --wet-summary resolves odor derived/change-summary.csv.','analyze_change.py and normalize_vuaa1.py resolve earlier assets/results/final-test/derived relative to the aerosense-wiki package. Preserve existing earlier tables there.','Hardware needs original raw/ and separately documented revisions/user-supplied-record19 replacement CSV. They are not silently substituted into the immutable original raw directory. Restore from canonical Zenodo archive before numerical rerun.','New Registry importer expects its original workspace neighbors zenodo-release and aerosense-wiki; direct relocation to code/aerosense/parts-analysis is source publication only until defaults/CLI are adapted. build_registry_figures.py already supports published data layout.','Registry figure URLs are official CDN; publication-links.json preserves source hash mappings. Keep local figure originals in canonical archive/documentation package, not required as duplicate GitLab runtime media.'],'required_followup':['Refresh source-manifest with actual source and published SHA values, preserving adaptation provenance.','Update stale GitLab README claims about no DOI/no newer data and three derived attachments to accurate current publication scope; do not claim newer data are included in an older DOI.','Convert remaining Registry relative data references to newly verified CDN URLs before final docs copy.','Syntax-check copied Python and run meaningful small reproduction/figure checks with explicit restored inputs; do not label a source-only copy a completed experiment rerun.','Preserve existing uncommitted GitLab work, .git, local-only exclusions, remote and deployment configuration.']})
print(json.dumps({'cleanup_count':len(items),'cleanup_bytes':sum(r['bytes'] for r in items),'protected_avi':len(avi),'gitlab_plan_files':len(sync)}))
