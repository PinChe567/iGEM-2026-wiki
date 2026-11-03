"""Refresh a committed-source plan while reusing unchanged successful HTTP proof.

This performs no network requests. Any genuinely changed target is listed for
a separate, root-authorized incremental HTTP check.
"""
from pathlib import Path
from datetime import datetime,timezone
from collections import Counter
import argparse,hashlib,importlib.util,json,subprocess
BASE=Path(__file__).resolve().parent;ROOT=BASE.parents[2]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--commit',action='append',required=True)
parser.add_argument('--ci-success',action='store_true')
parser.add_argument('--pipeline',type=int)
args=parser.parse_args()
spec=importlib.util.spec_from_file_location('public_readback',BASE/'readback-public-downloads.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
def read(p):return json.loads(p.read_text(encoding='utf8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
previous_path=BASE/'public-download-readback.json';previous=read(previous_path)
assert previous['all_verified']and previous['counts']=={'success':81}
old_plan=read(BASE/'public-download-readback-plan.json')
new_plan=module.prepare(BASE/'public-readback-repositories.json',True)
assert not new_plan['local_issues']
commits=dict(x.split('=',1)for x in args.commit);repos={r['id']:r for r in new_plan['repositories']}
assert set(commits)==set(repos)
for key,repo in repos.items():assert module.head(ROOT/repo['local_checkout'])==commits[key]
old={r['url']:r for r in previous['results']};current={};reused=[];changed=[];cache={}
for target in new_plan['gitlab_targets']:
 repo_id=target['repository_id'];repo=ROOT/repos[repo_id]['local_checkout'];commit=commits[repo_id]
 if 'working_tree_sha256'in target:
  relative=target['repository_path'];key=(repo_id,relative)
  if key not in cache:
   normalized=subprocess.check_output(['git','hash-object','--path='+relative,str(repo/relative)],cwd=repo,text=True).strip()
   blob=subprocess.check_output(['git','rev-parse',commit+':'+relative],cwd=repo,text=True).strip();assert normalized==blob
   body=subprocess.check_output(['git','show',commit+':'+relative],cwd=repo)
   cache[key]={'expected_sha256':hashlib.sha256(body).hexdigest(),'expected_bytes':len(body),'expected_git_blob_id':blob,'publication_commit':commit,'hash_basis':'exact successful-commit Git blob; compared with the previous complete HTTP response'}
  target.update(cache[key])
 proof=old.get(target['url']);reason=None
 if proof is None:reason='New target URL has no prior successful HTTP proof.'
 elif proof['check']!=target['check']or proof.get('repository_id')!=repo_id:reason='Target role or repository identity changed.'
 elif target['check']=='full_get_sha256'and(target['expected_sha256']!=proof.get('download_sha256')or target['expected_bytes']!=proof.get('bytes_read')):reason='Committed source bytes changed.'
 elif target['check']=='html_repository_title':
  for key in ['expected_project','repository_path','title_path_token']:
   if target.get(key)!=proof.get(key):reason='HTML route identity changed.';break
  if not reason and 'expected_sha256'in target and target['expected_sha256']!=proof.get('expected_sha256'):reason='Linked blob content changed; HTML and new raw proof require revalidation.'
 current[target['url']]=target
 if reason:changed.append({'url':target['url'],'reason':reason,'target':target})
 else:reused.append({'url':target['url'],'check':target['check'],'repository_id':repo_id,'repository_path':target.get('repository_path'),'current_publication_commit':commit,'prior_publication_commit':previous['commits'][repo_id],'expected_sha256':target.get('expected_sha256'),'expected_bytes':target.get('expected_bytes'),'previous_http_status':proof['http'],'previous_http_finished_at_utc':previous['finished_at_utc'],'status':'reused_prior_success','basis':'Identical URL and repository/path identity; committed bytes unchanged where this is a source file. No new HTTP response is claimed.'})
old_inputs={r['path']:r['sha256']for r in old_plan['input_files']}
input_changes=[r['path']for r in new_plan['input_files']if old_inputs.get(r['path'])!=r['sha256']]
new_plan.update({'publication_commits':commits,'network_started':False,'verification_mode':'incremental reuse of prior exact HTTP evidence','prior_full_readback_report_sha256':sha(previous_path),'ci_success_confirmed':args.ci_success,'official_pipeline':args.pipeline,'preparation_status':'Committed sources compared against previous complete HTTP readback; only new/changed targets require network verification.'})
write(BASE/'public-download-readback-plan.json',new_plan)
report={'prepared_at_utc':datetime.now(timezone.utc).isoformat(),'prior_report':previous_path.relative_to(ROOT).as_posix(),'prior_report_sha256':sha(previous_path),'previous_commits':previous['commits'],'current_commits':commits,'official_ci_success_confirmed':args.ci_success,'official_pipeline':args.pipeline,'all_targets_unchanged':not changed and set(old)==set(current),'targets':len(current),'reused_successful_http_targets':len(reused),'reused_by_check':dict(Counter(r['check']for r in reused)),'new_or_changed_targets':changed,'removed_previous_targets':sorted(set(old)-set(current)),'current_cdn_proofs_reused':new_plan['counts']['cdn_verified_previously'],'input_source_files_changed_since_last_prepare':input_changes,'new_http_requests':0,'source_or_index_modified':False,'new_plan_sha256':sha(BASE/'public-download-readback-plan.json'),'reused_evidence':reused}
write(ROOT/'aerosense-wiki/audit/final-publication-20261021/navigation-incremental-readback-provenance.json',report)
print(json.dumps({k:v for k,v in report.items()if k not in ['reused_evidence','new_or_changed_targets','input_source_files_changed_since_last_prepare']},ensure_ascii=False))
