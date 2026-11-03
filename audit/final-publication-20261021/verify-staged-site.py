"""Confirm reviewed source copy is staged, allowing intended Git CRLF normalization."""
from pathlib import Path
import hashlib
import json
import subprocess

OUT = Path(__file__).resolve().parent
WORK = OUT.parents[2]
REPO = WORK / 'gitlab/nthu'
plan = json.loads((OUT.parent / 'release-20261021/site-source-copy-final.json').read_text(encoding='utf-8'))
paths = ['site/' + item['path'] for item in plan['items']]
paths += ['ci/' + p.name for p in (REPO / 'ci').iterdir() if p.is_file()]
requests = ''.join(':' + p + '\n' for p in paths).encode('utf-8')
data = subprocess.check_output(['git', '-C', str(REPO), 'cat-file', '--batch'], input=requests)
pos = 0
failures = []
for path in paths:
    end = data.index(b'\n', pos)
    header = data[pos:end].decode('utf-8')
    pos = end + 1
    if header.endswith(' missing'):
        failures.append({'path': path, 'error': 'not staged'})
        continue
    oid, kind, length = header.split(' ')
    blob = data[pos:pos+int(length)]
    pos += int(length) + 1
    local = (REPO / path).read_bytes()
    if kind != 'blob' or blob != local.replace(b'\r\n', b'\n') and blob != local:
        failures.append({'path': path, 'error': 'staged content differs from reviewed source'})
staged = subprocess.check_output(['git', '-C', str(REPO), 'diff', '--cached', '--name-only', '-z']).decode('utf-8').split('\0')
generated = [p for p in staged if p.startswith(('public/', '.npm/', '.build-check/')) or '/node_modules/' in p or '/dist/' in p or p.endswith(('home.bundle.js','home.bundle.css','css/design-system.css','.tsbuildinfo')) or p.startswith('site/js/i18n-')]
report = {'reviewed_source_files': len(plan['items']), 'ci_files': len(paths)-len(plan['items']), 'checked': len(paths), 'failures': failures, 'generated_files_staged': generated, 'normalization': 'Exact bytes or Git CRLF to LF text normalization only; research files checked separately.'}
(OUT / 'staged-site-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(1 if failures or generated else 0)
