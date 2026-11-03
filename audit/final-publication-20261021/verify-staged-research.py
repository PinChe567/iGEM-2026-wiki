"""Compare scientific publication manifest against actual staged Git blob bytes."""
from pathlib import Path
import hashlib
import json
import subprocess

OUT = Path(__file__).resolve().parent
WORKSPACE = OUT.parents[2]
REPO = WORKSPACE / 'gitlab/aerosense-software'
manifest = json.loads((REPO / 'code/aerosense/source-manifest.json').read_text(encoding='utf-8'))
records = manifest['files']
requests = ''.join(':' + entry['path'] + '\n' for entry in records).encode('utf-8')
result = subprocess.run(['git', '-C', str(REPO), 'cat-file', '--batch'], input=requests, capture_output=True, check=True)
data = result.stdout
position = 0
checked = []
failures = []
for entry in records:
    end = data.index(b'\n', position)
    header = data[position:end].decode('utf-8')
    position = end + 1
    if header.endswith(' missing'):
        failures.append({'path': entry['path'], 'error': header})
        continue
    object_id, kind, length = header.split(' ')
    size = int(length)
    content = data[position:position + size]
    position += size + 1
    digest = hashlib.sha256(content).hexdigest()
    item = {'path': entry['path'], 'bytes': size, 'sha256': digest, 'git_blob': object_id,
            'ok': kind == 'blob' and size == entry['bytes'] and digest == entry['sha256']}
    checked.append(item)
    if not item['ok']:
        failures.append({**item, 'expected_bytes': entry['bytes'], 'expected_sha256': entry['sha256']})
report = {'checked': len(checked), 'passed': sum(item['ok'] for item in checked),
          'bytes': sum(item['bytes'] for item in checked), 'failures': failures,
          'method': 'git cat-file reads actual index blobs, including any Git newline conversion.',
          'files': checked}
(OUT / 'staged-research-byte-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: value for key, value in report.items() if key != 'files'}, ensure_ascii=False, indent=2))
raise SystemExit(1 if failures else 0)
