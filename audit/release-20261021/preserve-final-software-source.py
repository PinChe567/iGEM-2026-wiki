"""Preserve missing exact bytes from the frozen Software publication edition.

This writes only audit/canonical files. It never edits or stages repositories.
"""
from pathlib import Path
from datetime import datetime, timezone
import argparse, hashlib, json, os, re, shutil, subprocess

ROOT = Path(__file__).resolve().parents[3]
REPO = ROOT / 'gitlab/aerosense-software'
ARCHIVE = ROOT / 'zenodo-release'
AUDIT = ROOT / 'aerosense-wiki/audit/final-publication-20261021'
SOURCE_MANIFEST = REPO / 'code/aerosense/source-manifest.json'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--expected-manifest', default='819d852c36542dec1e4f4557c577c674e92d838cc09114583050ba400277e221')
parser.add_argument('--edition', default='software-publication-source-20261021')
parser.add_argument('--receipt-name', default='final-software-source-preservation-receipt.json')
parser.add_argument('--license-approved', action='store_true')
args = parser.parse_args()
assert re.fullmatch(r'[a-z0-9-]+', args.edition)
assert re.fullmatch(r'[a-z0-9-]+\.json', args.receipt_name)
assert re.fullmatch(r'[0-9a-f]{64}', args.expected_manifest)
DEST = ARCHIVE / 'reproduction-source' / args.edition
EXPECTED_MANIFEST = args.expected_manifest

def native(path):
    value = str(path.absolute())
    return Path('\\\\?\\' + value) if os.name == 'nt' and len(value) >= 240 and not value.startswith('\\\\?\\') else path

def sha(path):
    digest = hashlib.sha256()
    with native(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()

def write(path, data):
    native(path.parent).mkdir(parents=True, exist_ok=True)
    native(path).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf8')

assert sha(SOURCE_MANIFEST) == EXPECTED_MANIFEST, 'Frozen source manifest changed.'
manifest = json.loads(SOURCE_MANIFEST.read_text(encoding='utf8'))
sources = []
for role, records in [('research_source', manifest['files']), ('repository_support', manifest['repository_support_files'])]:
    for record in records:
        path = REPO / record['path']
        assert native(path).stat().st_size == record['bytes'], record['path']
        assert sha(path) == record['sha256'], record['path']
        sources.append({'repository_path': record['path'], 'role': role, 'bytes': record['bytes'], 'sha256': record['sha256']})
sources.append({'repository_path': 'code/aerosense/source-manifest.json', 'role': 'source_manifest', 'bytes': SOURCE_MANIFEST.stat().st_size, 'sha256': EXPECTED_MANIFEST})
assert len({entry['repository_path'] for entry in sources}) == len(sources)
registry = []
for local in sorted((ROOT / 'registry_docs_v2').glob('*.md')):
    relative = 'docs/aerosense/parts/' + local.name
    digest = sha(local)
    assert digest == sha(REPO / relative), local.name
    registry.append({'registry_path': local.relative_to(ROOT).as_posix(), 'repository_path': relative, 'bytes': local.stat().st_size, 'sha256': digest})
assert len(registry) == 28

wanted = {entry['sha256'] for entry in sources}
sizes = {entry['bytes'] for entry in sources}
existing = {}
scanned = 0
paths = subprocess.check_output(['rg', '--files', '--hidden', 'zenodo-release'], cwd=ROOT, text=True, encoding='utf8').splitlines()
for name in paths:
    path = ROOT / name
    if native(path).stat().st_size not in sizes:
        continue
    scanned += 1
    digest = sha(path)
    if digest in wanted:
        existing.setdefault(digest, []).append(path)

new = []
rows = []
for source in sources:
    candidates = existing.get(source['sha256'], [])
    if candidates:
        target = min(candidates, key=lambda path: (len(str(path)), str(path)))
        action = 'reuse_exact_canonical'
    else:
        target = DEST / source['repository_path']
        assert target.resolve().is_relative_to(DEST.resolve())
        assert not native(target).exists(), 'Destination collision: ' + source['repository_path']
        native(target.parent).mkdir(parents=True, exist_ok=True)
        shutil.copyfile(native(REPO / source['repository_path']), native(target))
        assert sha(target) == source['sha256']
        existing[source['sha256']] = [target]
        action = 'preserve_missing_exact_source'
        new.append({**source, 'canonical': target.relative_to(ROOT).as_posix()})
    rows.append({**source, 'canonical': target.relative_to(ROOT).as_posix(), 'action': action})
by_path = {entry['repository_path']: entry for entry in rows}
for entry in registry:
    entry['canonical'] = by_path[entry['repository_path']]['canonical']
    assert sha(ROOT / entry['canonical']) == entry['sha256']
assert sha(SOURCE_MANIFEST) == EXPECTED_MANIFEST
for entry in rows:
    assert sha(REPO / entry['repository_path']) == entry['sha256']
    assert sha(ROOT / entry['canonical']) == entry['sha256']

stamp = datetime.now(timezone.utc).isoformat()
preservation = {
    'prepared_at_utc': stamp,
    'status': 'LOCALLY PREPARED SOURCE EDITION; TEAM MIT LICENSE APPROVED; SOFTWARE PUBLICATION PENDING' if args.license_approved else 'LOCALLY PREPARED SOURCE EDITION; TEAM LICENSE DECISION AND SOFTWARE PUBLICATION PENDING',
    'purpose': 'Narrow exact-byte preservation of final research/Registry publication sources, repository support files, and their manifest. Matching archived bytes are reused. This is not a whole-website snapshot or a public-deposit claim.',
    'software_repository': 'https://gitlab.igem.org/2026/software/nthu/aerosense',
    'source_manifest_sha256': EXPECTED_MANIFEST,
    'license_status': manifest['license_status'],
    'license_interpretation': 'The user approved MIT for team-authored source. The exact scoped license files and notices in this edition govern that grant; third-party material retains its own license and is not relicensed by this archive.' if args.license_approved else 'The unchanged initial Apache template is preserved as an actual support file, not treated as evidence that the team selected its final software license.',
    'source_entries': len(manifest['files']),
    'source_bytes': sum(entry['bytes'] for entry in manifest['files']),
    'support_entries': len(manifest['repository_support_files']),
    'support_bytes': sum(entry['bytes'] for entry in manifest['repository_support_files']),
    'all_items_checked': len(rows),
    'canonical_size_candidates_hashed': scanned,
    'new_unique_source_files': len(new),
    'new_unique_source_bytes': sum(entry['bytes'] for entry in new),
    'registry_exact_mirrors': registry,
    'files': rows,
}
out = DEST / 'PRESERVATION-MANIFEST.json'
write(out, preservation)
receipt = {key: value for key, value in preservation.items() if key not in ['files', 'registry_exact_mirrors']}
receipt.update({
    'registry_exact_mirror_count': len(registry),
    'all_source_and_canonical_hashes_verified': True,
    'preservation_manifest': out.relative_to(ROOT).as_posix(),
    'preservation_manifest_sha256': sha(out),
    'preservation_manifest_bytes': out.stat().st_size,
    'new_source_files': new,
    'repository_files_modified': 0,
    'git_index_operations': 0,
    'http_requests': 0,
})
write(AUDIT / args.receipt_name, receipt)
print(json.dumps({key: receipt[key] for key in ['all_items_checked', 'new_unique_source_files', 'new_unique_source_bytes', 'registry_exact_mirror_count', 'preservation_manifest_sha256']}, ensure_ascii=False))
