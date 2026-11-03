"""Prepare four editable Notion source records and their manifest. No Git writes."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[3]
AUD = Path(__file__).resolve().parent
ARC = ROOT / 'zenodo-release'
PKG = ARC / 'aerosense-wiki/data/notion-model-2026-10-21'
SOFT = ROOT / 'gitlab/aerosense-software'
BASE = '7571b9e8f3468ee4dffe8e69ff337073de57a54d'
OLD_MANIFEST = '855264b5f0c27875402d456548b0faa939c6ac0c6dd54f38237cf590c01a53e7'
FILES = {
    'docs/aerosense/model/notion-decoder-update/model-source.md': PKG / 'sources/model-source.md',
    'docs/aerosense/model/notion-decoder-update/engineering-source.md': PKG / 'sources/engineering-source.md',
    'docs/aerosense/model/notion-decoder-update/README.md': PKG / 'README.md',
    'code/aerosense/model/notion-source/extract_notion_source.py': PKG / 'sources/extract_notion_source.py',
}

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def read(path): return json.loads(path.read_text(encoding='utf-8-sig'))
def write(path, value): path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
def git(*args): return subprocess.check_output(['git', '-C', str(SOFT), *args])

assert git('rev-parse', 'HEAD').decode().strip() == BASE
assert not git('status', '--porcelain'), 'Software source must be clean before preparation.'
manifest_path = SOFT / 'code/aerosense/source-manifest.json'
assert sha(manifest_path) == OLD_MANIFEST
assert not (PKG/'software-source-manifest.json').exists()

# Recreate each manuscript in memory; no work-copy, cache or training run.
helper = FILES['code/aerosense/model/notion-source/extract_notion_source.py']
scope = {'__name__': 'not_main'}
exec(compile(helper.read_text(encoding='utf8'), str(helper), 'exec'), scope)
provenance = read(PKG/'publication-provenance.json')
mapping = {row['source_block_id']: row for row in provenance['figures']}
checks = {}
for name, count in [('model', 150), ('engineering', 31)]:
    capture = read(PKG/'sources'/f'{name}-blocks.json')
    assert len(capture['blocks']) == count
    rebuilt = scope['convert'](capture, mapping).encode('utf8')
    existing = (PKG/'sources'/f'{name}-source.md').read_bytes()
    assert rebuilt == existing
    body = existing.decode('utf8')
    assert '92e5ae4e4097' not in body and 'Other pages' not in body
    images = [line for line in body.splitlines() if line.startswith('![')]
    assert all('(https://static.igem.wiki/' in line for line in images)
    checks[name] = {'source_blocks': count, 'exact_rebuild': True, 'image_references': len(images),
                    'bytes': len(existing), 'sha256': hashlib.sha256(existing).hexdigest()}

manifest = read(manifest_path)
assert len(manifest['files']) == 1250
known = {row['path'] for row in manifest['files']}
changes = []
for relative, source in FILES.items():
    assert relative not in known
    target = SOFT/relative
    assert not target.exists()
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
    digest = sha(source)
    assert sha(target) == digest
    row = {'path': relative, 'source': source.relative_to(ROOT).as_posix(), 'topic': 'model',
           'source_bytes': source.stat().st_size, 'source_sha256': digest,
           'selection': 'Editable supplied manuscript or standard-library source extractor; official image links only. Not a neural-model implementation or dataset.',
           'bytes': source.stat().st_size, 'sha256': digest,
           'repository_policy_category': 'analysis_source' if relative.endswith('.py') else 'editable_source_document'}
    manifest['files'].append(row)
    changes.append(row)
manifest['files'].sort(key=lambda row: row['path'])
now = datetime.now(timezone.utc).isoformat()
manifest['summary']['retained_manifest_files'] = len(manifest['files'])
manifest['summary']['retained_bytes'] = sum(row['bytes'] for row in manifest['files'])
manifest['finalized_at_utc'] = now
manifest['status'] = 'Published source through 7571b9e with four additional Notion manuscript/extraction sources prepared for review; no new neural-model implementation or raw dataset.'
manifest['registry_footer_cleanup']['publication_status'] = 'Published in 7571b9e8f3468ee4dffe8e69ff337073de57a54d; 13 changed sources/manifest passed anonymous raw GET SHA. Registry all 76 entries subsequently verified against the approved footer-free payload.'
manifest['notion_model_source_update'] = {
    'base_public_commit': BASE, 'prepared_at_utc': now, 'source_files_added': 4,
    'paths': list(FILES), 'source_manifest_before_sha256': OLD_MANIFEST,
    'source_blocks': {'model': 150, 'engineering': 31},
    'scientific_figures': '11 unique supplied WEBPs; 12 references; official CDN links, no image binaries in Git.',
    'original_pathway': 'New generated conceptual diagram replaces the article-derived anatomy image; original PNG and prompt in archive, official AVIF in public manuscript.',
    'training_engine_checkpoints_fold_ids_supplied': False,
    'model_training_reproduced': False, 'raw_datasets_or_binary_files_added': False,
    'publication_status': 'Prepared for root review; no commit or push performed by this preparation.'}
write(manifest_path, manifest)
shutil.copyfile(manifest_path, PKG/'software-source-manifest.json')
assert len(manifest['files']) == 1254
paths = [path for path in git('ls-files', '--others', '--exclude-standard', '-z').decode().split('\0') if path]
assert set(paths) == set(FILES)
assert git('diff', '--name-only').decode().splitlines() == ['code/aerosense/source-manifest.json']
assert not git('diff', '--cached', '--name-only')
receipt = {'prepared_at_utc': now, 'base_commit': BASE, 'software_changed_paths': sorted([*FILES, 'code/aerosense/source-manifest.json']),
           'changes': changes, 'manuscript_checks': checks, 'source_only': True,
           'software_manifest_sha256': sha(manifest_path), 'software_source_files': len(manifest['files']),
           'software_source_bytes': manifest['summary']['retained_bytes'],
           'no_index_commit_push': True, 'no_site_or_github_edits': True}
write(AUD/'software-source-preparation.json', receipt)
print(json.dumps({key: value for key, value in receipt.items() if key not in {'changes', 'manuscript_checks'}}, indent=2))
