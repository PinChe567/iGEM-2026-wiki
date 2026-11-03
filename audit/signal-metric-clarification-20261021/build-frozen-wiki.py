"""Run the established English-only publication checks after parent source freeze.

Does not stage, commit, push, delete, or replace the active public directory.
The separate verified-public plan handles generated-output replacement.
"""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import json
import subprocess
import sys

AUD = Path(__file__).resolve().parent
ROOT = AUD.parents[2]
SITE = ROOT / 'aerosense-wiki'
REPO = ROOT / 'gitlab/nthu'
OUTPUT = REPO / '.build-check/confirmed-map-final-public'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-frozen', action='store_true', help='Only use after the parent confirms all page edits are frozen.')
args = parser.parse_args()
if not args.source_frozen:
    raise SystemExit('Prepared only. Await the parent source-freeze signal before running.')
assert not OUTPUT.exists(), 'Use a separately reviewed output path; never overwrite an existing build.'
PY = sys.executable
steps = [
    ['node', str(SITE/'audit/english-only-20261021/refresh-daily.mjs')],
    ['node', str(SITE/'scripts/build-home-bundles.mjs')],
    ['node', str(SITE/'audit/english-only-20261021/refresh-daily.mjs')],
    ['node', str(SITE/'scripts/qa-compliance.cjs')],
    ['node', str(SITE/'scripts/audit-publish-assets-v7.cjs')],
    [PY, '-B', str(SITE/'scripts/prepare_publication_manifest_v7.py')],
    [PY, '-B', str(REPO/'ci/prepare-publication.py'), '--site', str(SITE)],
    [PY, '-B', str(SITE/'scripts/build-publication.py'), '--check'],
    [PY, '-B', str(REPO/'ci/copy-site-source.py'), '--source', str(SITE), '--apply', '--require-complete', '--report', str(SITE/'audit/release-20261021/site-source-copy-final.json')],
    [PY, '-B', str(REPO/'ci/check-source.py')],
    [PY, '-B', str(SITE/'scripts/build-publication.py'), '--output', str(OUTPUT)],
    [PY, '-B', str(AUD/'verify-build-and-plan.py')],
    [PY, '-B', str(AUD/'check-public.py')],
]
results=[]
for index, command in enumerate(steps, 1):
    completed = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')
    log = AUD/f'build-step-{index:02d}.txt'
    log.write_text(completed.stdout+'\n'+completed.stderr, encoding='utf-8')
    results.append({'step': index, 'command': command, 'returncode': completed.returncode, 'log': log.relative_to(ROOT).as_posix()})
    print(f'Step {index}/{len(steps)}: {completed.returncode}', flush=True)
    if completed.returncode:
        print(completed.stdout[-3000:]+completed.stderr[-3000:])
        break
receipt={'at_utc':datetime.now(timezone.utc).isoformat(), 'passed':len(results)==len(steps) and all(r['returncode']==0 for r in results),
         'steps':results, 'new_public':str(OUTPUT), 'active_public_replaced':False, 'git_operations':False,
         'source_manifest_sha256':hashlib.sha256((SITE/'publication-files.json').read_bytes()).hexdigest()}
(AUD/'frozen-wiki-build.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if not receipt['passed']:raise SystemExit(1)
