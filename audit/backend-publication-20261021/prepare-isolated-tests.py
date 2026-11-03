"""Reuse exact canonical source bytes and assemble a disposable offline test tree."""
from pathlib import Path
import csv, hashlib, json, shutil

OUT=Path(__file__).resolve().parent; WORK=OUT.parents[2]
report=json.loads((OUT/'backend-source-selection.json').read_text(encoding='utf-8'))
known={}
with (WORK/'zenodo-release/manifest.csv').open(encoding='utf-8-sig',newline='') as stream:
    for row in csv.DictReader(stream): known.setdefault(row['sha256'],[]).append(row['destination_relative'])
cleanup=[]
for item in report['source_allowlist']:
    current=WORK/item['canonical']
    matches=[]
    for relative in known.get(item['sha256'],[]):
        path=WORK/'zenodo-release'/relative
        if path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest()==item['sha256']:
            matches.append(path)
    if matches:
        selected=sorted(set(matches),key=lambda p:(len(str(p)),str(p)))[0]
        item['canonical']=selected.relative_to(WORK).as_posix()
        item['canonical_reused']=True
        cleanup.append({'path':current.relative_to(WORK).as_posix(),'canonical':item['canonical'],'sha256':item['sha256'],'bytes':item['bytes']})
    else: item['canonical_reused']=False
    test=OUT/'test-worktree'/item['path'];test.parent.mkdir(parents=True,exist_ok=True)
    if test.exists(): assert hashlib.sha256(test.read_bytes()).hexdigest()==item['sha256']
    else: shutil.copyfile(WORK/item['canonical'],test)
(OUT/'test-worktree/evidence').mkdir(exist_ok=True)
report['canonical_reused_files']=len(cleanup)
report['new_exact_canonical_files']=len(report['source_allowlist'])-len(cleanup)
(OUT/'backend-source-selection.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUT/'new-canonical-duplicates-cleanup-plan.json').write_text(json.dumps({'scope':'Only exact copies created by this task after preserving matching pre-existing canonical bytes','files':cleanup},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'new_exact_canonical':report['new_exact_canonical_files'],'reused_existing_canonical':len(cleanup),'test_tree_files':len(report['source_allowlist']),'reference_P2_matches':known.get('1509f308f365ca7f70c967fa8a004380cb48a8a4da004c4b845bace0eb65b2d1',[])},ensure_ascii=True,indent=2))
