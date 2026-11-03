from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone
import csv, hashlib, json

ROOT=Path(__file__).resolve().parents[3]
Z=ROOT/'zenodo-release'
M=Z/'manifest.csv'
with M.open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);fields=reader.fieldnames;old=list(reader)
prefixes={
 'aerosense-wiki/data/odor-2026-10-21/':('wetlab-odor-20261021','results.html;registry_docs_v2','results.html#kinetic-pilot'),
 'aerosense-wiki/data/hardware-test3-2026-10-21/':('hardware-cell-integration-20261021','hardware.html','hardware.html#reader-integrated-demo')}
scoped=[r for r in old if any(r['destination_relative'].startswith(p) for p in prefixes)]
by_dest={r['destination_relative']:r for r in scoped}
keep=[r for r in old if r not in scoped]
new=[]
for prefix,(category,pages,ref) in prefixes.items():
    for p in sorted((Z/prefix).rglob('*')):
        if not p.is_file() or '__pycache__' in p.parts:continue
        rel=p.relative_to(Z).as_posix();st=p.stat()
        r=dict(by_dest.get(rel,{}))
        r.update(source_relative=r.get('source_relative','zenodo-release/'+rel),destination_relative=rel,
          category=category,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bytes=str(st.st_size),
          source_mtime_utc=datetime.fromtimestamp(st.st_mtime,timezone.utc).isoformat(),
          corresponding_pages=pages,direct_references=ref)
        new.append(r)
allrows=keep+new
# Earlier byte-identical source aliases intentionally share one destination.
assert len({r['destination_relative'] for r in new})==len(new)
unique={r['destination_relative']:r for r in allrows}
with M.open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(allrows)
categories=defaultdict(lambda:{'files':0,'bytes':0})
for r in unique.values():
    categories[r['category']]['files']+=1;categories[r['category']]['bytes']+=int(r['bytes'])
sp=Z/'summary.json';d=json.loads(sp.read_text(encoding='utf-8'))
d['payload_files']=len(unique);d['payload_bytes']=sum(int(r['bytes'])for r in unique.values())
d['manifest_source_records']=len(allrows)
d['recorded_manifest_payload_bytes']=d['payload_bytes'];d['categories']=dict(categories)
d['current_publication_status']['videos']='All 15 mapped official videos public; 23 corresponding local MP4/WebM copies removed after renewed explicit authorization. Seven original AVI retained.'
d['current_publication_status']['zenodo']='Existing DOI remains linked; these revised odor/hardware batches are local additions and not confirmed uploaded.'
d['odor_hardware_revision_2026_10_21']={
 'reviewed_at_utc':datetime.now(timezone.utc).isoformat(),
 'scoped_files':len(new),'scoped_bytes':sum(int(r['bytes'])for r in new),
 'scoped_sha256_readback_verified':all(hashlib.sha256((Z/r['destination_relative']).read_bytes()).hexdigest()==r['sha256']for r in new),
 'old_unrelated_hashes_reused':True,'full_25GB_payload_reverified':False,
 'wetlab_metric':'S=100*(F1last/F1first-1)-100*(F0last/F0first-1), pp; F1 168s, F0 48s; matched48 sensitivity retained',
 'wetlab_raw_sources_unchanged':True,'wetlab_VUAA1_positive_S':11,'wetlab_VUAA1_increasing_F1':10,
 'hardware_metric':'raw Fourier peak amplitude / first amplitude of each individual time series; F/Fstart',
 'hardware_chart':'four channel time courses, desktop 2x2 and mobile 4x1, with descriptive late-window contrast annotations; nominal 0–1 min; no bars',
 'hardware_late_window_contrast':'100*(mean(last3 VUAA1)/first VUAA1 - mean(last3 cells+medium)/first cells+medium), pp; D1 -3.3928, D2 +31.0655, D3 +180.4940, D4 +5.7345',
 'hardware_cross_platform_comparison_public':False,
 'hardware_source_note':'Record19 uses a separately retained user-supplied replacement CSV; all four amplitudes recomputed. Its matching acquisition report and acquisition timestamp are unavailable. Original52 raw exports unchanged.',
 'registry_documents':28,'registry_local_links_checked':224,
 'video_deletion':{'authorized':True,'targets':23,'deleted':23,'original_AVI_retained':True,'completed_after_renewed_authorization':True},
 'odor_original_folder_removed':True,'odor_archived_xlsx_retained':12,
 'results_presentation':'Old Figure13 removed; paired response maps renumbered Figure13, two heatmaps per row; new Test2 VUAA1-referenced heatmap Figure14; processing details supplementary; all figures fit viewport',
 'wetlab_vuaa1_reference':'N=(Sstimulus-SDMSO)/(SVUAA1-SDMSO), Test2 only;66 cells,44 odor cells,7 negative,none above1;0-1 colorbar preserves signed values;Or7a small2.1945pp denominator flagged;not transfection efficiency',
 'website_github_synchronized':False,'uploaded':False,'committed':False,'pushed':False}
sp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report=d['odor_hardware_revision_2026_10_21']|{'manifest_files':d['payload_files'],'manifest_bytes':d['payload_bytes']}
(Path(__file__).parent/'revision-archive-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
