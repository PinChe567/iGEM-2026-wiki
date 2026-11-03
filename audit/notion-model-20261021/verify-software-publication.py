"""Read the five authorized public sources and compare their exact committed bytes."""
from pathlib import Path
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[3]
AUD = Path(__file__).resolve().parent
REPO = ROOT/'gitlab/aerosense-software'
def git(*args): return subprocess.check_output(['git', '-C', str(REPO), *args])
prepared = json.loads((AUD/'software-source-preparation.json').read_text(encoding='utf8'))
commit = git('rev-parse', 'HEAD').decode().strip()
assert git('rev-parse', 'origin/main').decode().strip() == commit
assert not git('status', '--porcelain')
assert set(git('diff-tree', '--no-commit-id', '--name-only', '-r', commit).decode().splitlines()) == set(prepared['software_changed_paths'])
def check(path):
    expected = git('show', commit+':'+path)
    url = 'https://gitlab.igem.org/2026/software/nthu/aerosense/-/raw/main/'+path
    row = {'path': path, 'url': url, 'commit': commit, 'expected_bytes': len(expected), 'expected_sha256': hashlib.sha256(expected).hexdigest()}
    try:
        with urlopen(Request(url, headers={'User-Agent': 'AeroSense-public-source-verification/1.0', 'Cache-Control': 'no-cache'}), timeout=60) as response:
            data = response.read()
            row.update(status=response.status, final_url=response.url, content_type=response.headers.get('Content-Type'), bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        row['pass'] = row['status'] == 200 and data == expected
    except Exception as exc:
        row.update(**{'pass': False, 'error': str(exc)})
    return row
with ThreadPoolExecutor(max_workers=3) as pool:
    rows = list(pool.map(check, prepared['software_changed_paths']))
receipt = {'checked_at_utc': datetime.now(timezone.utc).isoformat(), 'commit': commit, 'base_commit': prepared['base_commit'],
           'repository': 'https://gitlab.igem.org/2026/software/nthu/aerosense', 'anonymous_full_GET': True,
           'expected_sources': len(rows), 'passed': sum(row['pass'] for row in rows), 'all_pass': all(row['pass'] for row in rows),
           'source_manifest_sha256': prepared['software_manifest_sha256'], 'checks': rows,
           'software_source_files': prepared['software_source_files'], 'software_source_bytes': prepared['software_source_bytes']}
(AUD/'software-publication-readback.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
print(json.dumps({key:value for key,value in receipt.items() if key!='checks'}, indent=2))
assert receipt['all_pass']
