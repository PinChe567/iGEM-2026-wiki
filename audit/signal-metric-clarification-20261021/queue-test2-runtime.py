from pathlib import Path
import re,json,hashlib
ROOT=Path(__file__).resolve().parents[3]
BATCH=ROOT/'zenodo-release/aerosense-wiki/data/test2-confirmed-map-2026-10-21'
refs=[(p.name,u) for p in (ROOT/'aerosense-wiki').glob('*.html') for u in re.findall(r'https://static\.igem\.wiki/[^\s<>"\x27]+',p.read_text(encoding='utf8'))]
queue=[]
for p in sorted(BATCH.rglob('*')):
    if not p.is_file() or p.suffix not in ['.svg','.csv','.json']:continue
    matches=sorted(set((page,u) for page,u in refs if u.split('?',1)[0].endswith(p.name)))
    required=p.parent.name=='derived' and p.name in ['change-summary.csv','test2-vuaa1-referenced-summary.csv','observations.csv','summary.json','well-summary.csv']
    if (matches and p.suffix=='.svg') or required:queue.append({'path':str(p.resolve()),'name':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size,'replaces':matches if p.suffix=='.svg' else [],'scope':'Corrected Test 2 only; do not replace unrelated similarly named summaries.'})
Path(__file__).with_name('test2-runtime-upload-queue-fast.json').write_text(json.dumps(queue,indent=2)+'\n',encoding='utf8')
print(json.dumps([{'name':r['name'],'bytes':r['bytes']} for r in queue]))
