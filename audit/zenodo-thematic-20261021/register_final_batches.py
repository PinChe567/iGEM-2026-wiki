"""Register frozen corrected batches without rewriting research material."""
from pathlib import Path
import csv
import datetime
import hashlib
import json

WORK=Path(__file__).resolve().parents[3]
ROOT=WORK/'zenodo-release'
AUDIT=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
batch_specs=[
 ('odor-f1-dynamic-20261021','odor-f1-dynamic-reanalysis',WORK/'odor_20261021_F1_dynamic','Results; Measurement; Model','01'),
 ('test2-confirmed-map-2026-10-21','test2-confirmed-receptor-map',ROOT/'aerosense-wiki/data/odor-2026-10-21','Results; Measurement; Parts','01'),
 ('hardware-confirmed-map-2026-10-21','hardware-confirmed-receptor-map',ROOT/'aerosense-wiki/data/hardware-wetlab-pattern-comparison-2026-10-21','Hardware; Measurement','03'),
 ('signal-metric-confirmed-map-2026-10-21','signal-metric-confirmed-receptor-map',ROOT/'aerosense-wiki/data/signal-metric-clarification-2026-10-21','Results; Measurement; Hardware; Parts','01'),
]
mp=ROOT/'manifest.csv'
with mp.open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);fields=reader.fieldnames;rows=list(reader)
bases=['aerosense-wiki/data/'+s[0]+'/' for s in batch_specs]
rows=[r for r in rows if not any(r['destination_relative'].startswith(p) for p in bases)]
receipts=[]
for name,category,origin,pages,package in batch_specs:
    base=ROOT/'aerosense-wiki/data'/name
    files=sorted(p for p in base.rglob('*') if p.is_file())
    if not files:raise RuntimeError('Missing batch: '+str(base))
    receipt={'directory':base.relative_to(ROOT).as_posix(),'category':category,'package_id':package,
             'files':len(files),'bytes':sum(p.stat().st_size for p in files),'identical_historical_source_files':0}
    for p in files:
        rel=p.relative_to(ROOT).as_posix();h=sha(p);op=origin/p.relative_to(base)
        match=op.is_file() and op.stat().st_size==p.stat().st_size and sha(op)==h
        source=op if match else p
        receipt['identical_historical_source_files']+=int(match)
        rows.append({'source_relative':source.relative_to(WORK).as_posix(),'destination_relative':rel,
            'category':category,'sha256':h,'bytes':p.stat().st_size,
            'source_mtime_utc':datetime.datetime.fromtimestamp(source.stat().st_mtime,datetime.timezone.utc).isoformat(),
            'corresponding_pages':pages,'direct_references':''})
    receipts.append(receipt)
with mp.open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
sump=ROOT/'summary.json';summary=json.loads(sump.read_text(encoding='utf-8'))
unique={r['destination_relative']:int(r['bytes']) for r in rows}
summary['payload_files']=len(unique);summary['payload_bytes']=sum(unique.values())
for r in receipts:summary['categories'][r['category']]={'files':r['files'],'bytes':r['bytes']}
summary['f1_dynamic_archive_integration_2026_10_21'].update({'files':receipts[0]['files'],'bytes':receipts[0]['bytes'],
    'map_confirmation':'aerosense-wiki/data/odor-f1-dynamic-20261021/MAP_CONFIRMATION.json',
    'scope':'Existing Test 2 F1 readings reanalysed with the experimenter-confirmed receptor map; no new independent biological experiments.'})
summary['confirmed_receptor_map_editions_2026_10_21']={'source_values_changed':False,
    'historical_derivatives_preserved':True,'current_batches':receipts,
    'interpretation':'The confirmed F1/Test 2 map supersedes earlier Test 2 receptor assignments. Corrected summaries, reference ratios, hardware pairings and display figures are retained in the named current batches. Test 1 has its own map.',
    'zenodo_record_plan':'Seven themes; ten ZIPs; one record and one DOI. The archive remains unpublished.'}
sump.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(AUDIT/'registered-final-batches.json').write_text(json.dumps(receipts,ensure_ascii=False,indent=2),encoding='utf-8')
p=ROOT/'README.txt';s=p.read_text(encoding='utf-8')
marker='CURRENT RECEPTOR-MAP EDITIONS\n'
if marker not in s:
    s=s.replace('COMPLETENESS\n',marker+'''The experimenter confirmed the supplied F1/Test 2 map. Its confirmation is in
aerosense-wiki/data/odor-f1-dynamic-20261021/MAP_CONFIRMATION.json.
Use these current editions for receptor-labelled interpretation:
  data/odor-f1-dynamic-20261021/ (F1 dynamic reanalysis)
  data/test2-confirmed-map-2026-10-21/ (Test 2 summaries and reference ratios)
  data/hardware-confirmed-map-2026-10-21/ (corrected hardware/wetlab pairings)
  data/signal-metric-confirmed-map-2026-10-21/ (corrected display summaries)
These four paths are under aerosense-wiki/. Historical output folders remain
for provenance, but their superseded Test 2 receptor labels are not current
evidence. Raw measurements are unchanged; Test 1 retains its own map.
The subject index identifies current editions and their historical sources.

COMPLETENESS
''')
p.write_text(s,encoding='utf-8')
print(json.dumps({'registered_batches':receipts,'historical_payload_files':len(unique)},ensure_ascii=False))
