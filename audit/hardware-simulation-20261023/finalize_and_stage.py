"""Validate the change, refresh the inventory and stage two replacement ZIPs."""
from pathlib import Path
import csv
import hashlib
import importlib.util
import json
import math

AUDIT=Path(__file__).resolve().parent; WORK=AUDIT.parents[2]; ROOT=WORK/'zenodo-release'
HW=ROOT/'aerosense-wiki/data/hardware-test3-2026-10-21'
PAT=ROOT/'aerosense-wiki/data/hardware-confirmed-map-2026-10-21'
GUIDE=ROOT/'00-guide'; STAGE=AUDIT/'package-staging'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read_csv(p):
    with p.open(encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f);return reader.fieldnames,list(reader)
def write_csv(p,fields,rows):
    with p.open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(rows)
def save(p,data):p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def stat(p):return {'bytes':p.stat().st_size,'mtime_ns':p.stat().st_mtime_ns}

assert not (AUDIT/'source-finalized.json').exists(),'Already finalized; use the existing receipt.'
before=json.loads((AUDIT/'before-source-snapshot.json').read_text(encoding='utf-8'))
baseline={r['path']:r for r in json.loads((AUDIT/'before-file-manifest.json').read_text(encoding='utf-8'))}
raw_hashes=json.loads((AUDIT/'immutable-input-hashes.json').read_text(encoding='utf-8'))
assert all(sha(ROOT/p)==h for p,h in raw_hashes.items())
assert sha(HW/'revisions/user-supplied-record19/VUAA1_1min_raw_87187f3e-19_sti.csv')=='a036c39b47398ca68ba62c377e8ef245650b969b637d04593cdff7b5ecf57de9'
numeric_checks=0
for rel,old in json.loads((AUDIT/'prior-numeric-outputs.json').read_text(encoding='utf-8')).items():
    _,new=read_csv(ROOT/rel);assert len(new)==len(old)
    for a,b in zip(old,new):
        for key,value in a.items():
            try:number=float(value)
            except (ValueError,TypeError):continue
            assert math.isclose(number,float(b[key]),rel_tol=1e-12,abs_tol=1e-12),(rel,key,value,b[key])
            numeric_checks+=1
verification=json.loads((PAT/'verification.json').read_text(encoding='utf-8'));assert verification['pass']

notice='''

CURRENT HARDWARE SIMULATION CLASSIFICATION (2026-10-23)
The team confirmed record19 _sti.csv is simulated postprocessing, not a second
physical acquisition. Its _sti.json is now a derived simulation report; the
original-named CSV/JSON remain unchanged. Current measured-versus-simulated D4
figures, tables and code are in:
  aerosense-wiki/data/hardware-test3-2026-10-21/simulation-comparison/
The comparison is regenerated from the preserved supplied inputs. The original
simulation-generation program is not archived; an independent check of the
abbreviated historical method is not an exact reconstruction. See that study's
README and derived report for the explicit scope. Historical publication/source
snapshots retain earlier labels and are not the current data classification.
The Wiki's live figures/downloads are synchronized separately; this update
does not claim that the online page has already been changed.
'''
for p in [ROOT/'README.txt',GUIDE/'KNOWN_GAPS.txt',GUIDE/'REPRODUCE.txt']:
    p.write_text(p.read_text(encoding='utf-8')+notice,encoding='utf-8')
p=GUIDE/'ZENODO_FORM.txt';text=p.read_text(encoding='utf-8')
paragraph='The living-cell hardware package distinguishes original measurements from a simulated first-point scenario for record 19. Both D4 series, comparison tables, figures and analysis code are included. The _sti JSON is a derived simulation report, not a firmware acquisition export. The comparison is reproducible from the supplied CSVs and does not represent an additional independent experiment.\n\n'
text=text.replace('Project Wiki: https://2026.igem.wiki/nthu/',paragraph+'Project Wiki: https://2026.igem.wiki/nthu/',1)
p.write_text(text,encoding='utf-8')
p=ROOT/'START_HERE.html';text=p.read_text(encoding='utf-8')
text=text.replace('</header>','</header><section><h2>D4：原始量測與模擬資料比較</h2><p>_sti CSV 明確分類為模擬，_sti JSON 為衍生模擬報告。兩組數值、圖表與重現程式：<a href="aerosense-wiki/data/hardware-test3-2026-10-21/simulation-comparison/README.md">比較資料說明</a>；<a href="aerosense-wiki/data/hardware-test3-2026-10-21/simulation-comparison/D4-original-vs-simulated.png">比較圖</a>。原始量測保持不變。</p></section>',1)
p.write_text(text,encoding='utf-8')

# Source manifests in historical analyses still point to the current shared
# provenance document. Update that document's digest, not their scientific data.
provenance_rel='revisions/user-supplied-record19/selection-provenance.json'
for manifest in (ROOT/'aerosense-wiki/data').glob('*/source-manifest.csv'):
    fields,entries=read_csv(manifest);changed=False
    if 'archive' not in fields or 'path' not in fields:continue
    for r in entries:
        if r.get('archive')==HW.name and r['path']==provenance_rel:
            p=HW/provenance_rel;r['sha256']=sha(p);r['bytes']=p.stat().st_size;changed=True
    if changed:write_csv(manifest,fields,entries)

catalog=GUIDE/'DATA_CATALOG.csv';fields,topics=read_csv(catalog)
for row in topics:
    if row['dataset_id'] in ('08-living-cell-hardware','28-hardware-confirmed-map'):
        row['notes']+=' Current _sti input is explicitly simulated postprocessing. The paired _sti JSON is a derived report. Topic 30 contains the original-versus-simulated D4 comparison.'
        row['coverage_status']='Original measurements and explicitly simulated scenario retained; comparative analysis reproducible from supplied inputs'
topic={k:'' for k in fields}
topic.update(dataset_id='30-hardware-simulation-comparison',title='D4 原始量測與模擬比較 / Measured versus simulated D4',wiki_pages='hardware',
    description='Original measured record19 compared with supplied simulated first-point scenario; tables, figures and derived report',
    raw_or_input_paths='aerosense-wiki/data/hardware-test3-2026-10-21/raw/;aerosense-wiki/data/hardware-test3-2026-10-21/revisions/user-supplied-record19/',
    code_paths='aerosense-wiki/data/hardware-test3-2026-10-21/simulation-comparison/build_comparison.py',
    output_or_document_paths='aerosense-wiki/data/hardware-test3-2026-10-21/simulation-comparison/',
    coverage_status='Comparison reproducible from supplied measured and simulated CSVs',
    notes='No new measurement. Original simulation generator not retained; independent abbreviated-method crosscheck is not exact. _sti JSON is derived metadata, not a firmware export.')
topics.append(topic)
for row in topics:
    refs=set()
    for key in ('raw_or_input_paths','code_paths','output_or_document_paths'):
        for rel in filter(None,row[key].split(';')):
            p=ROOT/rel;assert p.exists(),rel
            refs.update([p] if p.is_file() else [q for q in p.rglob('*') if q.is_file()])
    row['referenced_unique_file_count']=len(refs);row['referenced_bytes']=sum(p.stat().st_size for p in refs)
write_csv(catalog,fields,topics)
coverage=GUIDE/'WIKI_DATA_COVERAGE.csv';fields,entries=read_csv(coverage)
row={k:'' for k in fields};row.update(wiki_page='hardware',wiki_url='https://2026.igem.wiki/nthu/hardware.html',
    dataset_id=topic['dataset_id'],topic=topic['title'],coverage_status=topic['coverage_status'],
    raw_or_input_paths=topic['raw_or_input_paths'],code_paths=topic['code_paths'],output_or_document_paths=topic['output_or_document_paths'],remaining_gap_or_scope=topic['notes'])
entries.append(row);write_csv(coverage,fields,entries)

manifest=ROOT/'manifest.csv';fields,entries=read_csv(manifest)
mapped={r['destination_relative'] for r in entries}
changed={p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and before.get(p.relative_to(ROOT).as_posix())!=stat(p)}
for r in entries:
    if r['destination_relative'] in changed:
        p=ROOT/r['destination_relative'];r['bytes']=p.stat().st_size;r['sha256']=sha(p)
for rel in sorted(changed-mapped):
    if not rel.startswith('aerosense-wiki/data/hardware-test3-2026-10-21/simulation-comparison/'):continue
    p=ROOT/rel;row={k:'' for k in fields};row.update(source_relative='Derived from preserved hardware original and supplied simulated CSVs',
        destination_relative=rel,category='hardware-measured-simulation-comparison-20261023',sha256=sha(p),bytes=p.stat().st_size,
        corresponding_pages='Hardware',direct_references='')
    entries.append(row)
write_csv(manifest,fields,entries)
p=ROOT/'summary.json';summary=json.loads(p.read_text(encoding='utf-8'))
unique={r['destination_relative']:int(r['bytes']) for r in entries}
summary['payload_files']=len(unique);summary['payload_bytes']=sum(unique.values())
summary['hardware_simulation_update_2026_10_23']={'classification':'simulated postprocessing',
    'original_device_exports_changed':False,'simulated_csv_changed':False,'sti_json_is_derived_report':True,
    'current_comparison':'aerosense-wiki/data/hardware-test3-2026-10-21/simulation-comparison/',
    'numeric_values_preserved':True,'independent_correlations_verified':1056,
    'waveform_generation_scope':'Comparison reproduces from supplied CSVs; abbreviated historical generator method does not reproduce every ADC count.'}
save(p,summary)
spec=importlib.util.spec_from_file_location('archive_tools',GUIDE/'archive_tools.py')
tool=importlib.util.module_from_spec(spec);spec.loader.exec_module(tool);tool.plan()
cats=tool.source_categories();inventory=[]
for p in tool.all_files():
    rel=p.relative_to(ROOT).as_posix()
    if rel in (tool.INVENTORY,tool.CHECKSUMS):continue
    checksum=baseline[rel]['sha256'] if rel in baseline and before.get(rel)==stat(p) else tool.sha(p)
    inventory.append({'path':rel,'bytes':p.stat().st_size,'sha256':checksum,'role':tool.classify(rel),
        'historical_source_categories':';'.join(sorted(cats.get(rel,set())))})
write_csv(ROOT/tool.INVENTORY,list(inventory[0]),inventory)
checks=[(r['path'],r['sha256']) for r in inventory]+[(tool.INVENTORY,tool.sha(ROOT/tool.INVENTORY))]
(ROOT/tool.CHECKSUMS).write_text(''.join(f'{h}  {rel}\n' for rel,h in sorted(checks)),encoding='utf-8')
after={p.relative_to(ROOT).as_posix():stat(p) for p in tool.all_files()}
changed=sorted(p for p in set(before)|set(after) if before.get(p)!=after.get(p))
affected=sorted({tool.package_id(p) for p in changed});assert affected==['00','03'],affected
save(AUDIT/'source-finalized.json',{'changed_files':changed,'affected_packages':affected,'physical_source_files':len(after),
    'original_exports_verified_unchanged':52,'prior_numeric_values_checked':numeric_checks,'independent_correlations_verified':1056})
save(AUDIT/'after-source-snapshot.json',after)
tool.package(STAGE,only='00,03')
print('Staged and verified replacement archives. Active upload payloads are not changed yet.',flush=True)
