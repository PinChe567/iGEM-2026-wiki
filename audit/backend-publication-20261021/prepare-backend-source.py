"""Preserve an explicit public-source allowlist; never inspect private board config."""
from pathlib import Path
import hashlib
import json
import shutil
from datetime import datetime, timezone

OUT=Path(__file__).resolve().parent
WORK=OUT.parents[2]
ORIGINAL=WORK.parent/'PCB layout/chatgpt version/03_software'
SOFTWARE=WORK/'gitlab/aerosense-software/code/aerosense/hardware/03_software'
CANONICAL=WORK/'zenodo-release/reproduction-source/hardware-odor-backend-20261021'

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()

paths=[]
paths += [p.relative_to(ORIGINAL).as_posix() for p in ORIGINAL.iterdir()
          if p.is_file() and (p.suffix in ('.py','.cjs','.cmd','.md','.txt') or p.name=='.gitignore')]
for directory, extensions in [('analysis',{'.py'}),('server',{'.py'}),('firmware/data',{'.js','.css','.html'}),('guides',{'.md'})]:
    paths += [p.relative_to(ORIGINAL).as_posix() for p in (ORIGINAL/directory).iterdir() if p.is_file() and p.suffix in extensions]
paths += ['firmware/src/main.cpp','firmware/src/config.example.h','firmware/platformio.ini','templates/README.md','analysis/odor_reference.json']
paths=sorted(set(paths))
items=[]
for relative in paths:
    assert 'aerosense_config.h' not in relative and not any(v in relative.split('/') for v in ('.history','.vscode','.pio','__pycache__','evidence'))
    source=ORIGINAL/relative
    assert source.is_file() and not source.is_symlink()
    digest=sha(source)
    old=SOFTWARE/relative
    state='new' if not old.exists() else 'unchanged' if sha(old)==digest else 'changed'
    target=CANONICAL/'source'/relative
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists(): assert sha(target)==digest,relative
    else: shutil.copyfile(source,target)
    assert sha(target)==digest and sha(source)==digest
    items.append({'path':relative,'bytes':source.stat().st_size,'sha256':digest,
                  'existing_software_state':state,'existing_software_sha256':sha(old) if old.is_file() else None,
                  'publication_role':'CDN reference data; never Git source' if relative=='analysis/odor_reference.json' else 'editable public source',
                  'canonical':str(target.relative_to(WORK)).replace('\\','/')})
reference=next(p for p in items if p['path']=='analysis/odor_reference.json')
queue={'created_at_utc':datetime.now(timezone.utc).isoformat(),'status':'ready for official CDN upload and full anonymous GET/SHA verification','files':[{'canonical':reference['canonical'],'bytes':reference['bytes'],'sha256':reference['sha256'],'media_type':'application/json','purpose':'Four-receptor P2 and DoOR reference vectors, required by the local exploratory Pearson comparator','suggested_filename':'aerosense-odor-reference-4257e93b.json'}]}
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'reference-data-upload-queue.json').write_text(json.dumps(queue,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'created_at_utc':datetime.now(timezone.utc).isoformat(),'original_untouched':True,'source_root':str(ORIGINAL),'canonical_root':str(CANONICAL),'files':len(items),'bytes':sum(x['bytes'] for x in items),'source_allowlist':items,'excluded':{'private':'firmware/src/aerosense_config.h and all .history/config variants are neither read nor copied','generated':'evidence, .pio, __pycache__, .vscode, images/PDFs, CSV templates are not selected for Git source'},'counts':{s:sum(x['existing_software_state']==s for x in items) for s in ('new','changed','unchanged')}}
(OUT/'backend-source-selection.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ('source_allowlist','source_root')},ensure_ascii=True,indent=2))
