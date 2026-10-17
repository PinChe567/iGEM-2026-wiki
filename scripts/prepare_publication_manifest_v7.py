from pathlib import Path
import json, re
SITE=Path(__file__).resolve().parents[1];REPORT=SITE/'igem-upload/publication'
data=json.loads((REPORT/'all-assets-inventory.json').read_text(encoding='utf-8'))
missing=data.get('summary',{}).get('missing_explicit_references',[])
if missing:raise ValueError('Resolve missing website resources before publishing: '+str(missing))
paths=sorted({p for a in data['assets'] for p in a['paths']})
english_manifest=SITE/'resources/hardware-en/publication-manifest.json'
excluded=set(json.loads(english_manifest.read_text(encoding='utf-8')).get('exclude_from_igem_upload',[])) if english_manifest.exists() else set()
localized_flow_art={f'assets/hardware/pcb-flow-v32/pcb-flow-{layout}-zh-Hant.svg' for layout in ('wide','stacked')}
localized_flow_art.update(f'assets/hardware/optics-v38/spectral-alignment-zh-Hant.{extension}' for extension in ('svg','png'))
invalid=[p for p in paths if p in excluded or (re.search(r'(?:^|[._/-])zh(?:[._/-]|$)',p,re.I) and p not in localized_flow_art)]
if invalid:raise ValueError('Non-English or excluded hardware editions are still publicly linked: '+str(invalid))
for path in paths:
    p=(SITE/path).resolve()
    if not p.is_relative_to(SITE.resolve()) or not p.is_file():raise ValueError('Missing or outside path: '+path)
(SITE/'publication-files.json').write_text(json.dumps(paths,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'publication_paths':len(paths),'inventory_directory':str(REPORT)},ensure_ascii=False))
