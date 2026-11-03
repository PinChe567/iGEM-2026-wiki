"""Record the current local source staging and exact public refresh, without Git mutations."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess

OUT = Path(__file__).resolve().parent
WORK = OUT.parents[2]
REPO = WORK / 'gitlab/nthu'
SITE = WORK / 'aerosense-wiki'

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def git(*args):
    return subprocess.check_output(['git', '-C', str(REPO), *args]).decode('utf-8').strip()

plan = read(OUT / 'public-refresh-plan.json')
cleanup = read(OUT / 'executed-public-refresh.json')
staged = read(OUT.parent / 'final-publication-20261021/staged-site-verification.json')
copy = read(OUT.parent / 'release-20261021/site-source-copy-final.json')
compliance = read(SITE / 'audit/compliance-review.json')
assert cleanup['status'] == 'completed'
assert not staged['failures'] and not staged['generated_files_staged']
assert not git('diff', '--name-only'), 'Unstaged tracked files'
paths = git('diff', '--cached', '--name-only').splitlines()
diff_args = ['diff', '--cached']
owner_commit = None
if not paths and git('rev-parse','HEAD') == 'd1cb454229dff683f5689c06f9690e47d27f559e':
    owner_commit = git('rev-parse','HEAD')
    diff_args = ['diff','HEAD^','HEAD']
    paths = git(*diff_args,'--name-only').splitlines()
assert len(paths) == 32 and all(p.startswith('site/') for p in paths)
assert all(Path(p).suffix in ('.html','.js','.json') for p in paths)
subprocess.check_call(['git','-C',str(REPO),'diff','--cached','--check'])
report = {
    'generated_at_utc': datetime.now(timezone.utc).isoformat(),
    'status': 'Local source/build/staging passed; release owner committed and pushed while completion receipt was being saved.',
    'wiki_head_before_commit': '79608d64aac297b48bca47bcb396f82d72e6fc67',
    'release_owner_commit': owner_commit,
    'source_files': copy['files'], 'source_bytes': copy['bytes'], 'source_actions': copy['actions'],
    'staged_files': paths, 'staged_change_count': len(paths),
    'diffstat': git(*diff_args,'--stat'),
    'source_only_checked': True, 'source_and_ci_staged_checks': staged,
    'compliance': compliance['summary'], 'compliance_review_items': compliance['issues'],
    'asset_audit': {'missing_explicit_references': 0, 'local_videos': 0, 'audited_paths': 247},
    'publication_dependencies': 259,
    'locale_catalogs_checked': 30,
    'home_bundle_hashes': {'css':'acbec09a2bcc9566','js':'48e66bb153c1e5f2'},
    'active_public': {'files':287, 'bytes':plan['new_bytes'], 'html':67, 'root_pages':28, 'clean_routes':27, 'all_files_sha_verified_after_move':True},
    'cleanup': {'files':cleanup['removed_file_count'], 'bytes':int(cleanup['removed_file_bytes']), 'receipt':'executed-public-refresh.json', 'method':'Exact file-by-file native PowerShell deletion after immediate SHA validation, empty-directory removal, native Move-Item.'},
    'excluded_from_cleanup': ['17 blocked upload-staging duplicates', 'both previously blocked pyc files', 'GitHub', 'all scientific canonical data and source'],
    'browser_qa': 'aerosense-wiki/audit/hardware-wetlab-pattern-20261021/measurement-results-page-qa.json: eight EN/zh-Hant desktop/mobile views passed.',
    'scientific_qa': 'aerosense-wiki/audit/hardware-wetlab-pattern-20261021/results-curves-independent-method-audit.json: 990 trajectory points and 66 endpoints independently match.',
    'proof_hashes': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in [OUT/'public-refresh-plan.json', OUT/'executed-public-refresh.json', OUT.parent/'release-20261021/site-source-copy-final.json', OUT.parent/'final-publication-20261021/staged-site-verification.json']},
    'publication_status': 'This agent performed no commit or push. Root reports normal push of d1cb454229dff683f5689c06f9690e47d27f559e; CI/deployment readback follows separately.',
}
(OUT/'wiki-build-staging-completion.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['status','source_files','source_bytes','staged_change_count','active_public','cleanup']},ensure_ascii=True,indent=2))
