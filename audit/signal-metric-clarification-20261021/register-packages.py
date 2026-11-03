"""Register frozen clarification and Education packages, without Git operations.

Only the new packages are hashed. Historic scientific payloads are not rehashed
or changed. Files copied to Software are editable source/documentation only.
"""
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
import argparse, csv, hashlib, json, shutil, subprocess

AUD = Path(__file__).resolve().parent
ROOT = AUD.parents[2]
ARC = ROOT/'zenodo-release'
SOFT = ROOT/'gitlab/aerosense-software'
HARD = ARC/'aerosense-wiki/data/signal-metric-clarification-2026-10-21'
EDU = ARC/'aerosense-wiki/data/education-learning-comparison-2026-10-21'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x): p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

ap=argparse.ArgumentParser(description=__doc__)
ap.add_argument('--apply',action='store_true')
args=ap.parse_args()
assert len(list((HARD/'figures').glob('*.svg')))==13
assert len(list((HARD/'figures').glob('test2-*-summary.png')))==11
assert read(AUD/'independent-hardware-review.json')['status']=='passed'
assert sha(EDU/'learning-lab-cohort-comparison.svg')=='d81db88383a3ffba56c74d913c13b13ecae7c61df9174ac739fcfbe2b84413d5'
targets=[(HARD,'code/aerosense/hardware/07_validation/signal-metric-clarification',['build_clarification.py','README.md','requirements.txt'],'hardware'),
         (EDU,'code/aerosense/education/learning-lab-cohort-comparison',['plot_comparison.py','README.md','requirements.txt'],'education')]
copies=[]
for batch,prefix,names,topic in targets:
    for name in names:
        source=batch/name;dest=SOFT/prefix/name
        assert source.is_file() and not dest.exists(),dest
        copies.append({'path':f'{prefix}/{name}','source':source.relative_to(ROOT).as_posix(),'topic':topic,
            'bytes':source.stat().st_size,'sha256':sha(source),'source_bytes':source.stat().st_size,'source_sha256':sha(source),
            'selection':'Editable plotting/verification source; reported datasets and generated figures stay in the canonical archive and selected official CDN attachments.',
            'repository_policy_category':'analysis_source' if source.suffix=='.py' else 'markdown_documentation' if source.suffix=='.md' else 'dependency_specification'})
if not args.apply:
    print(json.dumps({'prepared_source_files':copies,'apply':False},indent=2));raise SystemExit()
assert not (AUD/'package-registration.json').exists(),'Already registered; inspect receipt.'
now=datetime.now(timezone.utc).isoformat()
baseline=subprocess.check_output(['git','-C',str(SOFT),'rev-parse','HEAD'],text=True).strip()
for row in copies:
    target=SOFT/row['path'];target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(ROOT/row['source'],target);assert sha(target)==row['sha256']

manifest_path=SOFT/'code/aerosense/source-manifest.json'
manifest_before=sha(manifest_path);manifest=read(manifest_path)
known={r['path'] for r in manifest['files']}
assert not known.intersection(r['path'] for r in copies)
manifest['files'].extend(copies);manifest['files'].sort(key=lambda x:x['path'])
manifest['summary']['retained_manifest_files']=len(manifest['files'])
manifest['summary']['retained_bytes']=sum(r['bytes'] for r in manifest['files'])
manifest['finalized_at_utc']=now
manifest['status']=f'Published source through {baseline[:7]}; six additional metric-clarification and Education plotting source files prepared locally. New publication remains pending parent verification.'
manifest['metric_and_education_revision']={'prepared_at_utc':now,'base_public_commit':baseline,'new_source_files':len(copies),
    'paths':[r['path'] for r in copies],'datasets_and_figures_added_to_git':False,'manifest_before_sha256':manifest_before,
    'publication_status':'Prepared only; no commit, push or remote publication by this registration.'}
write(manifest_path,manifest)

# Preserve the exact new public-asset readbacks and independent numerical check.
for source,dest in [(AUD/'verified-pairwise-official-assets.json',HARD/'official-figure-readback.json'),
                    (ROOT/'aerosense-wiki/audit/browser-comments-20261021/education-chart-readback.json',EDU/'official-figure-readback.json')]:
    assert not dest.exists();shutil.copyfile(source,dest);assert sha(dest)==sha(source)
independent=read(AUD/'independent-hardware-review.json')
independent.pop('backend_source_checks',None)
write(HARD/'independent-verification.json',independent)
snapshot=ARC/'reproduction-source/metric-education-publication-20261021'
assert not snapshot.exists();snapshot.mkdir(parents=True)
shutil.copyfile(manifest_path,snapshot/'source-manifest.json')
write(snapshot/'PROVENANCE.json',{'created_at_utc':now,'software_base_commit':baseline,'source_copies':copies,
    'source_manifest_before_sha256':manifest_before,'source_manifest_after_sha256':sha(manifest_path),
    'canonical_sources_already_in_analysis_batches':True,'no_git_operations':True,'archive_published':False})

master=ARC/'manifest.csv';before=sha(master)
with master.open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);fields=reader.fieldnames;records=list(reader)
known={r['destination_relative']:r for r in records};additions=[]
for batch,category,pages in [(HARD,'signal-metric-clarification','Hardware; Results; Parts; Registry documentation'),
                              (EDU,'education-reported-cohort-comparison','Education'),
                              (snapshot,'publication-source-provenance','Hardware; Education')]:
    for p in sorted(batch.rglob('*')):
        if not p.is_file():continue
        assert p.suffix!='.pyc' and '__pycache__' not in p.parts
        relative=p.relative_to(ARC).as_posix();assert relative not in known,relative
        row={'source_relative':p.relative_to(ROOT).as_posix(),'destination_relative':relative,'category':category,
             'sha256':sha(p),'bytes':str(p.stat().st_size),'source_mtime_utc':datetime.fromtimestamp(p.stat().st_mtime,timezone.utc).isoformat(),
             'corresponding_pages':pages,'direct_references':''}
        records.append(row);additions.append(row);known[relative]=row
with master.open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(records)
categories=defaultdict(lambda:{'files':0,'bytes':0})
for row in known.values():
    categories[row['category']]['files']+=1;categories[row['category']]['bytes']+=int(row['bytes'])
summary=read(ARC/'summary.json')
summary.update(manifest_source_records=len(records),payload_files=len(known),payload_bytes=sum(int(r['bytes']) for r in known.values()),categories=dict(categories))
summary['metric_and_education_revision_2026_10_21']={'registered_at_utc':now,'new_files':len(additions),
    'new_bytes':sum(int(r['bytes']) for r in additions),'software_new_source_files':len(copies),
    'software_source_manifest_sha256':sha(manifest_path),'hardware_metric':'Pearson and Spearman levels at the same five prespecified nominal times; first differences retained as sensitivity.',
    'education_design':'Different self-selected cohorts, not paired before/after; six supplied aggregate percentages, no inferred raw counts or causal effects.',
    'full_archive_rehashed':False,'existing_raw_changed':False,'git_operations':False,'cloud_zenodo_publication':False}
write(ARC/'summary.json',summary)
receipt={'registered_at_utc':now,'source_copies':copies,'new_archive_records':additions,
    'new_archive_files':len(additions),'new_archive_bytes':sum(int(r['bytes']) for r in additions),
    'source_manifest_sha256':sha(manifest_path),'software_source_count':len(manifest['files']),
    'software_source_bytes':manifest['summary']['retained_bytes'],'master_manifest_before_sha256':before,
    'master_manifest_sha256':sha(master),'summary_sha256':sha(ARC/'summary.json'),
    'full_archive_rehashed':False,'existing_raw_changed':False,'git_operations':False,
    'physical_inventory_status':'FILE_MANIFEST/CHECKSUMS refresh is a separate final metadata task; this receipt registers only new canonical payloads.'}
write(AUD/'package-registration.json',receipt)
print(json.dumps({k:v for k,v in receipt.items() if k not in ['source_copies','new_archive_records']},indent=2))
