"""Rebuild the two-page reviewed update; no commit, push, or research mutation."""
from pathlib import Path
import json, subprocess, sys, time

A = Path(__file__).resolve().parent
W = A.parents[2]
S = W / 'aerosense-wiki'
R = W / 'gitlab/nthu'
NODE = Path('C:/Program Files/nodejs/node.exe')
records = []

def run(name, args, cwd=W):
    start = time.time()
    result = subprocess.run([str(x) for x in args], cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    (A / (name + '.log')).write_text(result.stdout + result.stderr, encoding='utf-8')
    records.append({'step':name, 'returncode':result.returncode, 'seconds':round(time.time()-start, 3)})
    (A/'build-steps.json').write_text(json.dumps(records, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(records[-1]), flush=True)
    if result.returncode:
        print((result.stdout+result.stderr)[-5000:], flush=True)
        raise SystemExit(result.returncode)

hash_js = (R/'ci/refresh-local-hashes.mjs').read_text(encoding='utf-8')
needle = "const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');"
if needle not in hash_js:
    needle = "const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../site');"
assert needle in hash_js
hash_js = hash_js.replace(needle, 'const site = ' + json.dumps(str(S)) + ';', 1)
(A/'refresh-daily-hashes.mjs').write_text(hash_js, encoding='utf-8')

run('01-locales', [sys.executable, '-B', S/'scripts/build-locales.py'], S)
run('02-hashes', [NODE, A/'refresh-daily-hashes.mjs'])
run('03-home-bundles', [NODE, S/'scripts/build-home-bundles.mjs'], S)
run('04-hashes', [NODE, A/'refresh-daily-hashes.mjs'])
run('05-compliance', [NODE, S/'scripts/qa-compliance.cjs'], S)
run('06-assets', [NODE, S/'scripts/audit-publish-assets-v7.cjs'], S)
run('07-runtime-manifest', [sys.executable, '-B', S/'scripts/prepare_publication_manifest_v7.py'], S)
run('08-generated-manifest', [sys.executable, '-B', R/'ci/prepare-publication.py', '--site', S])
run('09-publication-check', [sys.executable, '-B', S/'scripts/build-publication.py', '--check'], S)
run('10-source-copy', [sys.executable, '-B', R/'ci/copy-site-source.py', '--source', S, '--apply', '--require-complete', '--report', S/'audit/release-20261021/site-source-copy-final.json'])
run('11-source-check', [sys.executable, '-B', R/'ci/check-source.py'])
run('12-build-public', [sys.executable, '-B', S/'scripts/build-publication.py', '--output', R/'.build-check/engineering-backend-new-public'], S)
run('13-scope-audit', [sys.executable, '-B', A/'audit-scope.py'])
