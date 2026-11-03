"""Build existing-ID Registry targets using the experimenter-confirmed map."""
from pathlib import Path
import json,re,hashlib
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
batch=ROOT/'zenodo-release/aerosense-wiki/data/test2-confirmed-map-2026-10-21'
clar=ROOT/'zenodo-release/aerosense-wiki/data/signal-metric-confirmed-map-2026-10-21'
prior=json.loads((OUT/'registry-metric-clarification-patches.json').read_text('utf8'))['patches']
additions=json.loads((ROOT/'aerosense-wiki/audit/f1-dynamic-20261021/registry-f1-additions.json').read_text('utf8'))
extra={x['entry_key']:x['append_markdown'].replace('\\n','\n') for x in additions['parts']}
source=ROOT/'registry_docs_v2/integrate_disturbance_characterisation.py'
g={'__name__':'confirmed_map_targets','__file__':str(source)};exec(compile(source.read_text('utf8'),str(source),'exec'),g)
names=['Or7a','Or19a','Or42a','Or98a','Or22a','Or67a','Or67b','Or59b','Or85b','Or35a']
g.update(SOURCE=batch,BATCH=batch.name,CLARIFICATION_BATCH=clar.name,RECEPTORS=names)
rows=g['audit_and_calculate']()
collection_url='https://registry.igem.org/collections/40067138-a3dd-4e5b-b8a4-50b097ee0156'
note='**Experimenter-confirmed mapping correction.** The construct labels below supersede the earlier Test 2 labels. The source wells, RFU readings and endpoint calculations are unchanged; column 12 is Blank, whose composition is not documented. This is a relabelling of the same acquisition, not an independent experiment.'
targets=[]
for p in prior:
 label=p['receptor'];col=11 if label=='ORCO only' else names.index(label)+1;key=label.lower().replace(' ','-')
 body=g['condition_block'](label,col,[rows[r,col] for r in g['ROWS']]);body=body[body.index('<a id='):].strip()
 body=body.replace('### Assay context','### Assay context\n\n'+note,1)
 body=re.sub(r'!\[([^\]]+)\]\([^)]*test2-[^)]*summary\.png\)',lambda m:'!['+m.group(1)+']('+p['image_placeholder']+')',body)
 body=re.sub(r'\n\[Full within-acquisition F0/F1 time courses\].*?\n','\n',body)
 body=body.replace('the table below','the accompanying table')
 body=re.sub(r'\[audit summary\]\([^)]+\)','historical audit summary (retained in the source archive with its superseded labels)',body)
 body=re.sub(r'\nAttachments:.*$', '',body,flags=re.S)
 body=body.replace('](00_COLLECTION.md#',']('+collection_url+'#')
 body+=extra.get(p['entry_key'],'')
 png=clar/'figures'/f'test2-{key}-summary.png'
 targets.append({**p,'confirmed_column':col,'body_template':body,'body_template_sha256':hashlib.sha256(body.encode()).hexdigest(),'upload_path':str(png),'upload_sha256':hashlib.sha256(png.read_bytes()).hexdigest() if png.exists() else None,'upload_bytes':png.stat().st_size if png.exists() else None,'source_svg_path':str(png.with_suffix('.svg')),'status':'Corrected map; requires new matching Registry image upload; existing UUID only'})
base=json.loads((ROOT/'aerosense-wiki/audit/final-publication-20261021/registry-upload-documentation-payload.json').read_text('utf8'))
collection=next(p for p in base['pages'] if p['kind']=='collection');e=next(e for e in collection['entries'] if e['remote_entry_id']=='18d51051-8be1-4d93-867d-c412639eb2e9')
body=e['body_markdown'];body=body.replace('### Experimental map','### Experimental map\n\n'+note,1)
if note not in body:body=note+'\n\n'+body
body=re.sub(r'!\[[^\]]*\]\([^)]+\)\n\n\*An experimental schematic.*?\*\n','',body,flags=re.S)
for col,name in enumerate(names,1):
 module=g['PARTS'][name][1]
 body=re.sub(r'^\| '+str(col)+r' \|.*$',f'| {col} | {name} + ORCO | [BBa_{module}](https://registry.igem.org/parts/bba-{module.lower()}#odor-2026-10-21) |',body,flags=re.M)
body=body.replace('| 12 | No transfection | Cellular background control; no part assigned |','| 12 | Blank | Composition not documented; no part assigned |')
body=body.replace('A further no-transfection contrast','A further blank-control contrast')
body=re.sub(r'\[mean-ratio audit\]\([^)]+\)','historical mean-ratio audit',body)
body=re.sub(r'\nLocal attachments:.*$', '',body,flags=re.S)
body+=additions['collection']['append_markdown'].replace('\\n','\n')
targets.append({'entry_key':e['entry_key'],'receptor':'Collection methods','remote_entry_id':e['remote_entry_id'],'title':e['title'],'type':e['type'],'page_url':collection_url,'edit_url':additions['collection']['edit_url'],'source_path':collection['source_path'],'body_template':body,'body_template_sha256':hashlib.sha256(body.encode()).hexdigest(),'image_placeholder':None,'status':'Corrected map and F1 method; existing UUID only'})
(OUT/'registry-confirmed-map-targets.json').write_text(json.dumps({'status':'12 corrected-map targets; image URL routing pending','raw_values_unchanged':True,'targets':targets},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'targets':len(targets),'PNGs_ready':sum(bool(t.get('upload_sha256')) for t in targets),'columns':{t['receptor']:t.get('confirmed_column') for t in targets}},indent=2))
