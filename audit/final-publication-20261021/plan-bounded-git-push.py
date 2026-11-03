"""Read-only plan for the official GitLab 11 MiB pack limit."""
from pathlib import Path
import json, subprocess, zlib

OUT = Path(__file__).resolve().parent
REPO = OUT.parents[2] / 'gitlab/nthu'
def git(*args):
    return subprocess.check_output(['git','-C',str(REPO),*args])
target = git('rev-parse','HEAD').decode().strip()
base = git('rev-parse','origin/main').decode().strip()
def tree(ref):
    result = {}
    for item in git('ls-tree','-r','-z',ref).split(b'\0'):
        if not item: continue
        metadata, path = item.split(b'\t',1)
        mode, kind, oid = metadata.decode().split()
        result[path.decode('utf-8')] = {'path':path.decode('utf-8'),'mode':mode,'kind':kind,'oid':oid}
    return result
before, after = tree(base), tree(target)
rows = []
changed = [path for path in sorted(set(before)|set(after)) if before.get(path) != after.get(path)]
oids = [after[path]['oid'] for path in changed if path in after]
packed = subprocess.check_output(['git','-C',str(REPO),'cat-file','--batch'],input=('\n'.join(oids)+'\n').encode())
objects = {}
position = 0
for oid in oids:
    end = packed.index(b'\n',position)
    _, kind, length = packed[position:end].decode().split()
    assert kind == 'blob'
    position = end+1
    blob = packed[position:position+int(length)]
    position += int(length)+1
    objects[oid] = (len(blob),len(zlib.compress(blob)))
for path in sorted(set(before)|set(after)):
    if before.get(path) == after.get(path): continue
    row = dict(after[path]) if path in after else {'path':path,'deleted':True}
    if not row.get('deleted'):
        size, compressed = objects[row['oid']]
        row.update(bytes=size,compressed_estimate=compressed)
    else: row.update(bytes=0,compressed_estimate=0)
    rows.append(row)
research = [r for r in rows if r['path'].startswith(('code/','docs/')) and r['path']!='code/aerosense/source-manifest.json']
final = [r for r in rows if r not in research]
limit = 8*1024*1024
batches = []
for row in sorted(research,key=lambda r:r['compressed_estimate'],reverse=True):
    assert row['compressed_estimate'] < 10*1024*1024, ('Individual object needs different solution',row['path'])
    fit = next((b for b in batches if b['compressed_estimate']+row['compressed_estimate']<=limit),None)
    if fit is None:
        fit={'type':'research','compressed_estimate':0,'files':[]}; batches.append(fit)
    fit['files'].append(row); fit['compressed_estimate']+=row['compressed_estimate']
final_size = sum(r['compressed_estimate'] for r in final)
assert final_size <= limit, ('Final source batch too large',final_size)
batches.append({'type':'website_and_manifest','compressed_estimate':final_size,'files':final})
plan={'base':base,'target_snapshot':target,'remote_limit_bytes':11*1024*1024,'working_tree_changes':False,'batches':batches}
(OUT/'bounded-git-push-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'base':base,'target_snapshot':target,'changed_paths':len(rows),'batches':[{'type':b['type'],'files':len(b['files']),'compressed_estimate':b['compressed_estimate']} for b in batches]},indent=2))
