"""Reconstruct unchanged reviewed Git blobs as bounded commits; never push or edit files."""
from pathlib import Path
import argparse, json, subprocess

OUT = Path(__file__).resolve().parent
REPO = OUT.parents[2] / 'gitlab/nthu'
PLAN = json.loads((OUT/'bounded-git-push-plan.json').read_text(encoding='utf-8'))
STATE = OUT/'bounded-git-push-state.json'
parser = argparse.ArgumentParser()
parser.add_argument('--begin',action='store_true')
parser.add_argument('--batch',type=int)
args = parser.parse_args()
def git(*command, data=None):
    return subprocess.check_output(['git','-C',str(REPO),*command],input=data)
def current(): return git('rev-parse','HEAD').decode().strip()
if args.begin:
    assert not STATE.exists(), 'Reconstruction already started'
    assert current()==PLAN['target_snapshot']
    assert not git('status','--porcelain=v1','--untracked-files=normal').strip(), 'Working tree must be clean before reconstruction'
    remote = git('ls-remote','origin','refs/heads/main').decode().split()[0]
    assert remote==PLAN['base'], 'Remote advanced; stop rather than overwrite'
    # The remote rejected the entire new pack. Only the unpublished local commit
    # is reconstructed; these two commands never write to the working directory.
    git('reset','--soft',PLAN['base'])
    git('read-tree',PLAN['base'])
    state={'base':PLAN['base'],'target_snapshot':PLAN['target_snapshot'],'commits':[]}
    STATE.write_text(json.dumps(state,indent=2)+'\n',encoding='utf-8')
    print('Prepared unchanged reviewed files for bounded commits; no working files modified.')
elif args.batch is not None:
    state=json.loads(STATE.read_text(encoding='utf-8'))
    assert args.batch==len(state['commits']), 'Batches must be applied in order once'
    assert current()==(state['commits'][-1]['commit'] if state['commits'] else PLAN['base'])
    batch=PLAN['batches'][args.batch]
    records=[]
    for row in batch['files']:
        if row.get('deleted'): records.append('0 '+'0'*40+'\t'+row['path']+'\0')
        else: records.append(row['mode']+' '+row['oid']+'\t'+row['path']+'\0')
    git('update-index','-z','--index-info',data=''.join(records).encode('utf-8'))
    title=(f'Publish verified AeroSense research files ({args.batch+1}/{len(PLAN["batches"])-1})'
           if batch['type']=='research' else 'Publish audited AeroSense wiki and complete research manifest')
    git('commit','-q','-m',title)
    entry={'batch':args.batch,'type':batch['type'],'files':len(batch['files']),'commit':current()}
    state['commits'].append(entry)
    if args.batch==len(PLAN['batches'])-1:
        target_tree=git('rev-parse',PLAN['target_snapshot']+'^{tree}').decode().strip()
        final_tree=git('rev-parse','HEAD^{tree}').decode().strip()
        assert target_tree==final_tree, 'Final tree differs from reviewed snapshot'
        state['exact_final_tree_match']=True
        state['tree']=final_tree
    STATE.write_text(json.dumps(state,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(entry,indent=2))
else: parser.error('Choose --begin or --batch')
