"""Apply the user's confirmed record-19 naming/layout change only."""
from pathlib import Path
import ast
import csv
import hashlib
import importlib.util
import json
import shutil

AUDIT=Path(__file__).resolve().parent
WORK=AUDIT.parents[2]
ROOT=WORK/'zenodo-release'
BASE=ROOT/'aerosense-wiki/data/hardware-test3-2026-10-21'
TARGET=BASE/'revisions/user-supplied-record19'
DOWNLOADS=Path('C:/Users/user/Downloads')
OLD='VUAA1_1min_raw_87187f3e-19.csv'
STI='VUAA1_1min_raw_87187f3e-19_sti.csv'
REPORT='VUAA1_1min_report_87187f3e-19.json'
STI_REPORT='VUAA1_1min_report_87187f3e-19_sti.json'
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
stat=lambda p:{'bytes':p.stat().st_size,'mtime_ns':p.stat().st_mtime_ns}
assert TARGET.resolve().is_relative_to(ROOT.resolve())
assert not (TARGET/STI).exists(), 'Already prepared; inspect the receipt instead of repeating.'
before={p.relative_to(ROOT).as_posix():stat(p) for p in ROOT.rglob('*') if p.is_file()}
(AUDIT/'before-source-snapshot.json').write_text(json.dumps(before,ensure_ascii=False,indent=2),encoding='utf-8')
old_index=list(csv.DictReader((WORK/'zenodo-upload/PACKAGE_INDEX.csv').open(encoding='utf-8-sig')))
(AUDIT/'before-package-index.json').write_text(json.dumps(old_index,ensure_ascii=False,indent=2),encoding='utf-8')
baseline={r['path']:r for r in csv.DictReader((ROOT/'FILE_MANIFEST.csv').open(encoding='utf-8-sig'))}
(AUDIT/'before-file-manifest.json').write_text(json.dumps(baseline,ensure_ascii=False),encoding='utf-8')
assert digest(TARGET/OLD)=='a036c39b47398ca68ba62c377e8ef245650b969b637d04593cdff7b5ecf57de9'
for name in (OLD,REPORT):
    assert digest(DOWNLOADS/name)==digest(BASE/'raw'/name), 'Supplied files changed after inspection.'
original_exports={p.name:digest(p) for p in (BASE/'raw').iterdir() if p.is_file()}

# The selected revision has a CSV and refers to the immutable original JSON.
# Keep that associated JSON as an explicitly described alias, never manufacture
# a firmware report for the revised waveform.
(TARGET/OLD).rename(TARGET/STI)
shutil.copy2(BASE/'raw'/REPORT,TARGET/STI_REPORT)
for name in (OLD,REPORT):shutil.copy2(DOWNLOADS/name,TARGET/name)

prefix='revisions/user-supplied-record19/'
replacements=[(prefix+OLD,prefix+STI),
              ((prefix+OLD).replace('/','\\\\'),(prefix+STI).replace('/','\\\\'))]
changed=[]
for parent in [ROOT/'aerosense-wiki/data',ROOT/'reproduction-source']:
    for p in parent.rglob('*'):
        if not p.is_file() or p.suffix.lower() not in {'.py','.md','.txt','.json','.csv'} or p.stat().st_size>4_000_000:
            continue
        if p.parent==TARGET or p.parent==BASE/'raw':continue
        b=p.read_bytes();new=b
        for old,replacement in replacements:new=new.replace(old.encode(),replacement.encode())
        if p==BASE/'analyze_hardware_test3.py':
            new=new.replace(("'user-supplied-record19'/'"+OLD+"'").encode(),("'user-supplied-record19'/'"+STI+"'").encode())
        if p in [BASE/'analysis-summary.json',BASE/'replacement-validation.json']:
            new=new.replace(('"csv_file": "'+OLD+'"').encode(),('"csv_file": "'+STI+'"').encode())
        if p==BASE.parent/'hardware-wetlab-pattern-comparison-2026-10-21/README.md':
            new=new.replace(('      '+OLD).encode(),('      '+STI).encode())
        if new!=b:
            p.write_bytes(new);changed.append(p.relative_to(ROOT).as_posix())

provenance=TARGET/'selection-provenance.json'
d=json.loads(provenance.read_text(encoding='utf-8'))
d['csv_file']=STI
d['user_requested_layout_2026_10_22']={
    'scope':'Rename the selected differing record-19 revision with _sti and place the two newly supplied files alongside it with their original names.',
    'selected_revision_csv':STI,
    'associated_report_alias':STI_REPORT,
    'associated_report_scope':'Byte-identical copy of the original firmware report; it does not match or validate the revised _sti CSV waveform. No synthetic firmware report was generated.',
    'original_report_does_not_match_replacement':True,
    'newly_supplied_files':[{'file':name,'bytes':(TARGET/name).stat().st_size,'sha256':digest(TARGET/name),'identical_to_immutable_raw_export':True} for name in (OLD,REPORT)],
    'analysis_selection':'The current analysis still selects the renamed _sti CSV. This file-layout change does not recompute or change reported numerical results.',
    'other_record_suffixes_changed':False}
provenance.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
changed.append(provenance.relative_to(ROOT).as_posix())

note=('\n\n## Record 19 file names requested on 22 October 2026\n\n'
      'The selected revision is now `revisions/user-supplied-record19/'+STI+'`. '
      'The same folder contains the user-supplied original-named CSV and JSON, '
      'byte-identical to the existing immutable `raw/` exports. The `_sti.json` file '
      'is an alias of the associated original report; it is not a matching firmware '
      'report for the revised waveform. `selection-provenance.json` records this '
      'distinction. The raw exports, all other record suffixes and all numerical '
      'results remain unchanged. These copies are retained together at the user\'s request.\n')
p=BASE/'README.md';p.write_text(p.read_text(encoding='utf-8')+note,encoding='utf-8')
if p.relative_to(ROOT).as_posix() not in changed:changed.append(p.relative_to(ROOT).as_posix())

# Preserve the historical source fields and update current destination paths.
mp=ROOT/'manifest.csv'
with mp.open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);fields=reader.fieldnames;rows=list(reader)
old_rel=(TARGET/OLD).relative_to(ROOT).as_posix();sti_rel=(TARGET/STI).relative_to(ROOT).as_posix()
for row in rows:
    if row['destination_relative']==old_rel:row['destination_relative']=sti_rel
for name in (OLD,REPORT,STI_REPORT):
    p=TARGET/name
    rows.append({'source_relative':str(DOWNLOADS/name) if name!=STI_REPORT else (BASE/'raw'/REPORT).relative_to(WORK).as_posix(),
        'destination_relative':p.relative_to(ROOT).as_posix(),'category':'record19-user-requested-layout-20261022',
        'sha256':digest(p),'bytes':p.stat().st_size,'source_mtime_utc':'','corresponding_pages':'Hardware','direct_references':''})
for row in rows:
    p=ROOT/row['destination_relative']
    if row['destination_relative'] in changed:
        row['bytes']=p.stat().st_size;row['sha256']=digest(p)
with mp.open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
p=ROOT/'summary.json';summary=json.loads(p.read_text(encoding='utf-8'))
unique={r['destination_relative']:int(r['bytes']) for r in rows}
summary['payload_files']=len(unique);summary['payload_bytes']=sum(unique.values())
summary['record19_filename_update_2026_10_22']={
    'folder':TARGET.relative_to(ROOT).as_posix(),'selected_revision_csv':STI,
    'associated_report_alias':STI_REPORT,'added_original_named_files':[OLD,REPORT],
    'numeric_results_changed':False,'immutable_raw_exports_changed':False,
    'report_alias_is_original_report_not_a_matching_revision_report':True}
summary['categories']['record19-user-requested-layout-20261022']={'files':3,'bytes':sum((TARGET/n).stat().st_size for n in (OLD,REPORT,STI_REPORT))}
p.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

catalog=ROOT/'00-guide/DATA_CATALOG.csv'
with catalog.open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);fields=reader.fieldnames;topics=list(reader)
for row in topics:
    refs=set()
    for key in ['raw_or_input_paths','code_paths','output_or_document_paths']:
        for rel in filter(None,row[key].split(';')):
            p=ROOT/rel
            assert p.exists(),rel
            if p.is_file():refs.add(p)
            else:refs.update(q for q in p.rglob('*') if q.is_file())
    row['referenced_unique_file_count']=len(refs)
    row['referenced_bytes']=sum(p.stat().st_size for p in refs)
with catalog.open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(topics)

spec=importlib.util.spec_from_file_location('archive_tools',ROOT/'00-guide/archive_tools.py')
tool=importlib.util.module_from_spec(spec);spec.loader.exec_module(tool);tool.plan()
cats=tool.source_categories();inventory=[];hashed=0
for p in tool.all_files():
    rel=p.relative_to(ROOT).as_posix()
    if rel in {tool.INVENTORY,tool.CHECKSUMS}:continue
    previous=baseline.get(rel)
    if previous and before.get(rel)==stat(p):checksum=previous['sha256']
    else:checksum=tool.sha(p);hashed+=1
    inventory.append({'path':rel,'bytes':p.stat().st_size,'sha256':checksum,'role':tool.classify(rel),
        'historical_source_categories':';'.join(sorted(cats.get(rel,set())))})
with (ROOT/tool.INVENTORY).open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(inventory[0]));w.writeheader();w.writerows(inventory)
checks=[(r['path'],r['sha256']) for r in inventory]+[(tool.INVENTORY,tool.sha(ROOT/tool.INVENTORY))]
(ROOT/tool.CHECKSUMS).write_text(''.join(f'{h}  {rel}\n' for rel,h in sorted(checks)),encoding='utf-8')
after={p.relative_to(ROOT).as_posix():stat(p) for p in tool.all_files()}
affected=sorted({tool.package_id(rel) for rel in set(before)|set(after) if before.get(rel)!=after.get(rel)})
assert affected==['00','03','06'],affected
assert original_exports=={p.name:digest(p) for p in (BASE/'raw').iterdir() if p.is_file()}
assert digest(TARGET/STI)=='a036c39b47398ca68ba62c377e8ef245650b969b637d04593cdff7b5ecf57de9'
for name in (OLD,REPORT):assert digest(TARGET/name)==digest(DOWNLOADS/name)
assert digest(TARGET/STI_REPORT)==digest(TARGET/REPORT)
for rel in changed:
    p=ROOT/rel
    if p.suffix=='.json':json.loads(p.read_text(encoding='utf-8-sig'))
    if p.suffix=='.py':ast.parse(p.read_text(encoding='utf-8-sig'))
receipt={'source_files':len(after),'affected_package_ids':affected,'raw_exports_unchanged':52,
    'renamed_selected_csv':{'old':old_rel,'new':sti_rel,'sha256':digest(TARGET/STI)},
    'folder':str(TARGET),'files':[{'name':n,'bytes':(TARGET/n).stat().st_size,'sha256':digest(TARGET/n)} for n in (STI,STI_REPORT,OLD,REPORT)],
    'updated_reference_files':changed,'new_or_changed_files_hashed':hashed,'numeric_results_recomputed':False}
(AUDIT/'update-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf-8')
(AUDIT/'after-source-snapshot.json').write_text(json.dumps(after,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(receipt,ensure_ascii=False),flush=True)
