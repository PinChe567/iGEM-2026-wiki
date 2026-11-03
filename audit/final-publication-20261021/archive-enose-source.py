"""Consolidate a historical partial feature-table package; no training-engine claim."""
from pathlib import Path
from collections import defaultdict
import csv,datetime,hashlib,json,shutil
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];ARCHIVE=ROOT/'zenodo-release';REPO=ROOT/'gitlab/nthu'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
inventory=json.loads((OUT/'enose-initial-inventory.json').read_text(encoding='utf-8'))['files']
manifest=ARCHIVE/'manifest.csv'
with manifest.open(encoding='utf-8-sig',newline='') as f:reader=csv.DictReader(f);columns=reader.fieldnames;rows=list(reader)
archived=[];published=[];new_count=0;new_bytes=0
for r in inventory:
    source=ROOT/r['path'];assert sha(source)==r['sha256']
    matches=[ARCHIVE/p for p in set(r['matches']) if (ARCHIVE/p).is_file() and sha(ARCHIVE/p)==r['sha256']]
    created=False
    if matches:canonical=sorted(matches,key=lambda p:(len(str(p)),str(p)))[0]
    else:
        canonical=ARCHIVE/'aerosense-wiki/reproduction-source'/r['path']
        if canonical.exists():assert sha(canonical)==r['sha256']
        else:canonical.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,canonical);new_count+=1;new_bytes+=r['bytes'];created=True
    assert sha(canonical)==r['sha256'] and canonical.stat().st_size==r['bytes']
    rows.append({'source_relative':r['path'],'destination_relative':canonical.relative_to(ARCHIVE).as_posix(),'category':'historical-feature-table-source','sha256':r['sha256'],'bytes':str(r['bytes']),'source_mtime_utc':datetime.datetime.fromtimestamp(source.stat().st_mtime,datetime.timezone.utc).isoformat(),'corresponding_pages':'results.html;model.html','direct_references':'Historical partial table-building/augmentation evidence; not the missing matching PN-KC-MBON training engine.'})
    archived.append({'source':r['path'],'source_absolute':str(source),'retain_canonical':canonical.relative_to(ROOT).as_posix(),'retain_canonical_absolute':str(canonical),'bytes':r['bytes'],'sha256':r['sha256'],'new_canonical':created})
    rel=source.relative_to(ROOT/'eNose-feature-igem')
    if rel.parts[0]=='scripts' or source.suffix.lower()=='.md' or (rel.parts[0]=='analysis' and source.suffix.lower()=='.csv') or source.name=='00_filename_map.csv':
        dest=REPO/'code/aerosense/wetlab/eNose-feature-igem'/rel
        assert not dest.exists(),dest
        dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dest)
        published.append({'source':r['path'],'canonical_archive_source':canonical.relative_to(ROOT).as_posix(),'destination':dest.relative_to(REPO).as_posix(),'source_sha256':r['sha256'],'source_bytes':r['bytes'],'sha256':sha(dest),'bytes':dest.stat().st_size,'selection':'historical source/small derived input; original archive unchanged'})
base=REPO/'code/aerosense/wetlab/eNose-feature-igem'
notes='''# Publication scope: historical feature-table package

This is a partial historical table-processing package, not the PN–KC–MBON training engine that produced the website decoder results. The original README names simulation, preprocessing, configuration and model paths that are not supplied here. Publishing these two scripts does not fill that reproducibility gap or independently verify the model statistics mentioned in historical comments.

`build_odorant_receptor_table.py` derives an eight-compound, ten-receptor table from `analysis/01_per_well_results.csv`. `augment_odorant_table.py` creates noisy copies using a documented seed and noise model. Augmented rows are not new experimental observations or biological replicates. Group all copies of the same source compound together when evaluating a model; do not split near-duplicate augmented rows across training and evaluation sets.

The input per-well table, earlier matrices, QC table and original outputs are retained byte-for-byte. The package does not include the original scripts that generated tables 01–04 and figures 1–4. Current wiki analysis has separate validation/selection rules; these historical tables must not silently replace it.

The canonical research archive retains all 32 original reader CSVs, the filename map, four historical figures, the original README/report and both scripts. The six formerly unique files from this working folder are preserved under `aerosense-wiki/reproduction-source/eNose-feature-igem/`; files already present elsewhere are mapped by SHA in the archive manifest rather than duplicated. Restore their original package layout using that manifest when needed. No raw reader exports or display-image duplicates are added to this source checkout.

The scripts resolve inputs relative to their own folder. From the repository root:

```
python code/aerosense/wetlab/eNose-feature-igem/scripts/build_odorant_receptor_table.py
python code/aerosense/wetlab/eNose-feature-igem/scripts/augment_odorant_table.py --out /path/to/new-output.csv
```

The first command writes the table 06 output inside this package. Run in a separate reproduction checkout if you need to preserve the supplied generated files exactly. The only external dependency is NumPy; `requirements.txt` pins the verified current version, not an asserted historical environment.
'''
(base/'PUBLICATION_SCOPE.md').write_text(notes,encoding='utf-8',newline='\n')
(base/'requirements.txt').write_text('numpy==2.4.6\n',encoding='utf-8')
p=base/'README.md';p.write_text('> Publication note: this is a historical partial table-construction and augmentation package. The SNN training engine and several paths named below are not included. See [PUBLICATION_SCOPE.md](PUBLICATION_SCOPE.md) before using these data or interpreting model claims.\n\n'+p.read_text(encoding='utf-8'),encoding='utf-8',newline='\n')
for r in published:
    dest=REPO/r['destination'];r.update(sha256=sha(dest),bytes=dest.stat().st_size)
    if r['sha256']!=r['source_sha256']:r['selection']='publication copy adds a scope notice; historical original retained unchanged in archive'
for name in ['PUBLICATION_SCOPE.md','requirements.txt']:
    p=base/name;published.append({'source':'aerosense-wiki/audit/final-publication-20261021/archive-enose-source.py','destination':p.relative_to(REPO).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size,'selection':'new publication scope/current dependency note; no scientific data generated'})
with manifest.open('w',encoding='utf-8',newline='') as f:w=csv.DictWriter(f,fieldnames=columns);w.writeheader();w.writerows(rows)
destinations={r['destination_relative']:r for r in rows};categories=defaultdict(lambda:{'files':0,'bytes':0})
for r in destinations.values():categories[r['category']]['files']+=1;categories[r['category']]['bytes']+=int(r['bytes'])
p=ARCHIVE/'summary.json';summary=json.loads(p.read_text(encoding='utf-8'));summary.update(payload_files=len(destinations),payload_bytes=sum(int(r['bytes']) for r in destinations.values()),manifest_source_records=len(rows),categories=dict(categories))
summary['historical_feature_source_consolidation_2026_10_21']={'source_files':47,'source_bytes':sum(r['bytes'] for r in archived),'new_canonical_files':new_count,'new_canonical_bytes':new_bytes,'existing_canonical_reused':47-new_count,'matching_decoder_engine_found':False,'status':'All original files archived/hash-verified; removal is a separate guarded step'}
p.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'files':archived,'count':len(archived),'bytes':sum(r['bytes'] for r in archived),'new_canonical_files':new_count,'new_canonical_bytes':new_bytes,'gitlab_files':published,'gitlab_count':len(published),'scope':'Historical table builder/augmentation only; no PN-KC-MBON matching training engine supplied'}
(OUT/'verified-enose-cleanup-plan.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['count','bytes','new_canonical_files','new_canonical_bytes','gitlab_count']}))
