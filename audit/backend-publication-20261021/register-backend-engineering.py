"""Register the frozen backend, engineering evidence and Registry text edition.

Explicit source/config allowlists only; no Git writes, network, deletions or raw
archive traversal. Existing canonical bytes are reused by SHA where available.
"""
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone
import csv
import hashlib
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[3]
ARC = ROOT / 'zenodo-release'
SOFT = ROOT / 'gitlab/aerosense-software'
AUD = Path(__file__).resolve().parent
ENG = ARC / 'aerosense-wiki/data/engineering-source-evidence-2026-10-21'
BACK = ARC / 'reproduction-source/hardware-odor-backend-20261021'
SNAP = ARC / 'reproduction-source/backend-engineering-registry-publication-20261021'
NOW = datetime.now(timezone.utc).isoformat()
BASE = '861ce244564c0d012954d77b94ebfda4f473f617'

def xp(p): return Path('\\\\?\\' + str(p.resolve())) if len(str(p.resolve())) >= 250 else p
def sha(p): return hashlib.sha256(xp(p).read_bytes()).hexdigest()
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p, value):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
def rel(p): return p.relative_to(ROOT).as_posix()
def git(*args):
    return subprocess.check_output(['git', '-C', str(SOFT), *args])

def main():
    assert not (SNAP / 'PROVENANCE.json').exists(), 'Immutable source edition already finalized; inspect its receipt.'
    assert git('rev-parse', 'HEAD').decode().strip() == BASE
    assert not git('diff', '--cached', '--name-only'), 'Another process has staged files; stop before registering.'
    master = ARC / 'manifest.csv'
    before_master = sha(master)
    with master.open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f); fields = reader.fieldnames; records = list(reader)
    known = {r['destination_relative']: r for r in records}
    canonical_by_sha = {}
    for r in records: canonical_by_sha.setdefault(r['sha256'], ARC / r['destination_relative'])
    registered_before = len(known)
    manifest_path = SOFT / 'code/aerosense/source-manifest.json'
    manifest = read(manifest_path); before_manifest = sha(manifest_path)
    assert before_manifest == 'a632e6a82f065eb1d11b61a57dc1b8baf2076f84878ac422f6260713d4d42c33'
    old_rows = {r['path']: r for r in manifest['files']}
    selected = read(AUD / 'backend-source-selection.json')
    prepared = read(AUD / 'backend-software-preparation.json')
    freeze = read(ROOT / 'aerosense-wiki/audit/engineering-evidence-20261021/canonical-files-frozen.json')
    registry = read(ROOT / 'aerosense-wiki/audit/final-publication-20261021/registry-test2-label-corrections.json')
    registry_qa = read(ROOT / 'aerosense-wiki/audit/final-publication-20261021/registry-test2-final-qa.json')
    assert registry_qa['local_markdown_mirrors_exact'] == 28
    assert len(freeze['files']) == 17 and freeze['total_bytes'] == 609333
    assert len(selected['source_allowlist']) == 42 and prepared['files'] == 43
    payload = []
    def queue(p, category, source=None):
        assert p.is_file() and p.is_relative_to(ARC)
        assert p.suffix != '.pyc' and '__pycache__' not in p.parts
        if p.relative_to(ARC).as_posix() not in known:
            payload.append((p, category, source or rel(p)))
    for row in selected['source_allowlist']:
        p = ROOT / row['canonical']
        assert sha(p) == row['sha256'] and p.stat().st_size == row['bytes']
        original = Path(selected['source_root']) / row['path']
        assert sha(original) == row['sha256']
        if not row['canonical_reused']: queue(p, 'hardware-odor-backend-source')
    for p in sorted((BACK / 'publication').iterdir()):
        assert p.is_file()
        queue(p, 'hardware-odor-backend-publication-source')
    assert len(payload) == 31
    new_rows = dict(old_rows)
    changed = []
    def source_row(path, canonical, topic, role, selection):
        dest = SOFT / path
        assert sha(dest) == sha(canonical)
        digest = sha(dest); size = dest.stat().st_size
        if path in old_rows and old_rows[path]['sha256'] == digest:
            return
        row = {'path': path, 'source': rel(canonical), 'topic': topic,
               'source_bytes': size, 'source_sha256': digest, 'selection': selection,
               'bytes': size, 'sha256': digest, 'repository_policy_category': role}
        new_rows[path] = row; changed.append(row)
    for row in prepared['items']:
        source_row(row['path'], ROOT / row['canonical'], 'hardware',
                   'build_or_license_text' if Path(row['path']).name == '.gitignore' else
                   'reproduction_documentation' if row['path'].endswith('.md') else 'editable_source',
                   'Reviewed four-receptor Pearson reference comparator and acquisition source. Reference JSON is retrieved separately from the verified official CDN; private configuration and generated evidence are excluded.')
    assert len(changed) == 29
    assert not (SOFT / 'code/aerosense/hardware/03_software/analysis/odor_reference.json').exists()
    eng_prefix = 'code/aerosense/hardware/09_engineering_sources/engineering-source-evidence'
    source_names = freeze['source_files'] + freeze['source_configuration_files']
    assert len(source_names) == 6
    for row in freeze['files']:
        p = ENG / row['path']; assert sha(p) == row['sha256'] and p.stat().st_size == row['bytes']
        queue(p, 'engineering-source-evidence')
    for name in source_names:
        src = ENG / name; dest = SOFT / eng_prefix / name
        if dest.exists():
            assert sha(dest) == sha(src), 'Partial preparation differs from frozen source.'
        else:
            dest.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(src, dest)
        role = 'source_configuration' if name == 'cad-source-manifest.json' else 'reproduction_documentation' if name.endswith('.md') else 'dependency_specification' if name == 'requirements.txt' else 'analysis_source'
        source_row(f'{eng_prefix}/{name}', src, 'hardware', role,
                   'Frozen engineering figure/document generator and required CAD input path/hash configuration. No CAD binary, rendered asset or private correspondence is included in Git.')
    SNAP.mkdir(parents=True, exist_ok=True)
    registry_mapping = []
    paths = []
    for row in registry['files']:
        p = ROOT / row['software_mirror']; assert sha(p) == row['after_sha256']
        assert sha(ROOT / 'registry_docs_v2' / row['file']) == row['after_sha256']
        paths.append(p.relative_to(SOFT).as_posix())
    paths.append('code/aerosense/parts-analysis/integrate_disturbance_characterisation.py')
    for path in paths:
        src = SOFT / path; digest = sha(src)
        canon = canonical_by_sha.get(digest)
        reused = canon is not None
        if canon is None:
            canon = SNAP / 'sources' / path
            canon.parent.mkdir(parents=True, exist_ok=True)
            if canon.exists(): assert sha(canon) == digest
            else: shutil.copyfile(src, canon)
            queue(canon, 'registry-publication-source', rel(src))
            canonical_by_sha[digest] = canon
        assert sha(canon) == digest
        source_row(path, canon, 'parts', 'reproduction_documentation' if path.endswith('.md') else 'analysis_source',
                   'Test 1/Test 2 label and availability clarification only; existing scientific tables, entries, numeric values and images are unchanged.')
        registry_mapping.append({'path': path, 'canonical': rel(canon), 'sha256': digest, 'reused': reused})
    assert len(changed) == 49
    # Validate the entire small source selection (about 12 MB), never the 25 GB archive.
    manifest['files'] = sorted(new_rows.values(), key=lambda r: r['path'])
    for row in manifest['files']:
        p = SOFT / row['path']; assert xp(p).is_file() and sha(p) == row['sha256'] and xp(p).stat().st_size == row['bytes'], row['path']
    for row in manifest['repository_support_files']:
        assert sha(SOFT / row['path']) == row['sha256'], row['path']
    changed_paths = {r['path'] for r in changed}
    working_changes = set(git('diff', '--name-only', '-z').decode().split('\0')) | set(git('ls-files', '--others', '--exclude-standard', '-z').decode().split('\0'))
    working_changes.discard('')
    assert working_changes == changed_paths, sorted(working_changes ^ changed_paths)
    manifest['summary']['retained_manifest_files'] = len(new_rows)
    manifest['summary']['retained_bytes'] = sum(r['bytes'] for r in new_rows.values())
    manifest['finalized_at_utc'] = NOW
    manifest['status'] = 'Published MIT-scoped Software baseline 861ce244 plus locally prepared backend, engineering generator/configuration and Registry label updates. This new edition is not yet committed or pushed. The full research archive remains local and unpublished.'
    manifest['supplementary_analysis_update']['publication_status'] = 'Published in Software commit 861ce244564c0d012954d77b94ebfda4f473f617; all eight sources and manifest passed anonymous raw GET/SHA verification.'
    manifest['backend_engineering_registry_update'] = {
        'base_public_commit': BASE, 'changed_source_paths': sorted(changed_paths),
        'new_source_files': sum(r['path'] not in old_rows for r in changed),
        'updated_source_files': sum(r['path'] in old_rows for r in changed),
        'source_manifest_before_sha256': before_manifest,
        'backend_reference_data_url': 'https://static.igem.wiki/teams/6460/wiki/downloads/odor-reference.json',
        'backend_reference_data_sha256': '4257e93ba2aee8e255e30461a69c781338f8b5d62bb0d5bc097bd92c3a310c77',
        'engineering_source_configuration': f'{eng_prefix}/cad-source-manifest.json',
        'datasets_binaries_private_configuration_added_to_git': False,
        'publication_status': 'Prepared; root owns normal commit/push and official readback.'}
    write(manifest_path, manifest)
    shutil.copyfile(manifest_path, SNAP / 'source-manifest.json')
    queue(SNAP / 'source-manifest.json', 'publication-source-provenance', rel(manifest_path))
    blocked_plan = read(AUD / 'temporary-test-cleanup-plan.json')
    blocked = {'status': 'blocked before execution', 'count': blocked_plan['count'], 'bytes': blocked_plan['bytes'],
               'files_removed': 0, 'review_response': 'blocked by policy; no further reason provided',
               'retry_performed': False, 'plan': 'temporary-test-cleanup-plan.json'}
    write(AUD / 'blocked-temporary-test-cleanup.json', blocked)
    qa = read(AUD / 'backend-review-summary.json')
    qa['retained_blocked_test_work_copies'] = blocked
    qa['pending'] = 'Unified source/canonical registration complete; new Software commit/push and official readback remain pending root verification.'
    write(AUD / 'backend-review-summary.json', qa)
    mapping = {'created_at_utc': NOW, 'source_policy': 'One selected canonical source per exact byte version; 16 redundant work copies retained after blocked cleanup are explicitly excluded from this selection.',
               'source_allowlist': [{k: r[k] for k in ['path', 'bytes', 'sha256', 'canonical', 'canonical_reused', 'publication_role']} for r in selected['source_allowlist']],
               'software_source_selection': prepared['items'],
               'private_configurations_included': False}
    write(BACK / 'SOURCE-MAPPING.json', mapping); queue(BACK / 'SOURCE-MAPPING.json', 'hardware-odor-backend-provenance')
    write(BACK / 'VERIFICATION.json', qa); queue(BACK / 'VERIFICATION.json', 'hardware-odor-backend-provenance')
    provenance = {'created_at_utc': NOW, 'base_public_commit': BASE, 'source_manifest_before_sha256': before_manifest,
        'source_manifest_after_sha256': sha(manifest_path), 'changed_sources': changed,
        'registry_source_mapping': registry_mapping, 'engineering_freeze_receipt_sha256': sha(ROOT / 'aerosense-wiki/audit/engineering-evidence-20261021/canonical-files-frozen.json'),
        'canonical_policy': 'Only changed source versions and metadata are added. Existing exact canonical sources are reused. Rendered engineering assets remain in their one frozen batch. No whole-site backup.',
        'blocked_work_copies': [{'files': 16, 'bytes': 65077, 'registered_as_canonical': False}, {'files': blocked['count'], 'bytes': blocked['bytes'], 'registered_as_canonical': False}],
        'private_source_or_raw_data_changed': False, 'no_git_index_commit_push': True, 'no_deletion': True}
    write(SNAP / 'PROVENANCE.json', provenance); queue(SNAP / 'PROVENANCE.json', 'publication-source-provenance')
    additions = []
    for p, category, source in payload:
        relative = p.relative_to(ARC).as_posix(); digest = sha(p)
        assert relative not in known, relative
        row = {'source_relative': source, 'destination_relative': relative, 'category': category,
               'sha256': digest, 'bytes': str(p.stat().st_size),
               'source_mtime_utc': datetime.fromtimestamp(p.stat().st_mtime, timezone.utc).isoformat(),
               'corresponding_pages': 'Hardware reference-pattern backend; Engineering evidence; Parts Registry local documentation',
               'direct_references': ''}
        records.append(row); known[relative] = row; additions.append(row)
    with master.open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fields); writer.writeheader(); writer.writerows(records)
    categories = defaultdict(lambda: {'files': 0, 'bytes': 0})
    for r in known.values():
        categories[r['category']]['files'] += 1; categories[r['category']]['bytes'] += int(r['bytes'])
    summary = read(ARC / 'summary.json')
    summary.update({'manifest_source_records': len(records), 'payload_files': len(known), 'payload_bytes': sum(int(r['bytes']) for r in known.values()), 'categories': dict(categories)})
    summary['backend_engineering_registry_2026_10_21'] = {
        'registered_at_utc': NOW, 'new_registered_files': len(additions), 'new_registered_bytes': sum(int(r['bytes']) for r in additions),
        'software_changed_source_files': len(changed), 'software_manifest_sha256': sha(manifest_path),
        'software_source_count': len(new_rows), 'software_source_bytes': manifest['summary']['retained_bytes'],
        'backend_test_cases_passed': 225, 'reference_data_public_sha_verified': True,
        'engineering_canonical_files': 17, 'engineering_canonical_bytes': 609333,
        'registry_markdown_changes': 13, 'registry_numeric_changes': False,
        'publication_status': 'New source edition is prepared locally; commit/push/readback pending. Current Wiki build handled separately by root.',
        'retained_unregistered_work_copies': provenance['blocked_work_copies'],
        'full_archive_rehashed': False, 'original_raw_or_github_changed': False}
    status = summary['current_publication_status']; status['checked_at_utc'] = NOW
    status['wiki'] = 'Wiki commit d1cb454229dff683f5689c06f9690e47d27f559e is public; pipeline 792226 succeeded. Its deployment passed 315/315 checks (86 fresh HTTP and 229 unchanged-SHA proofs), including 287 files and 28 routes. New Engineering/backend page edits are prepared separately and are not yet claimed deployed.'
    status['software'] = f'Software commit {BASE} is the verified public baseline. A new local edition prepares 49 source/configuration changes plus its manifest; 1,250 research sources and seven unchanged support files. New commit/push/readback remains pending root verification.'
    status['gitlab'] = 'Both prior official repositories are public and verified. The backend/Engineering/Registry source update and corresponding new Wiki edition are prepared locally, pending normal publication.'
    status['registry'] = 'Local Test 1/Test 2 labels were corrected without numeric/table changes. Public Save returned HTTP 400: Only images uploaded to the Registry are allowed. Root is preparing Registry-hosted images and a separate upload payload; no new successful save is claimed here.'
    write(ARC / 'summary.json', summary)
    pending = ARC / 'PENDING.txt'
    text = pending.read_text(encoding='utf-8-sig')
    marker = '\n本輪後端、工程與 Registry 來源增補（本地準備完成；未宣稱新版本已發布）\n'
    assert marker not in text
    addition = marker + (f'- 已登錄 {len(additions)} 份新的 canonical 檔案、{sum(int(r["bytes"]) for r in additions):,} bytes；未重新掃描完整研究包。\n'
        f'- Software 準備 49 份來源/設定變更與 manifest，合計 {len(new_rows):,} 份研究來源；等主流程正常 commit/push 與匿名讀回。\n'
        '- 後端為四受體 Pearson 參考圖樣比較，225 項測試通過；並非已訓練 PN–KC–MBON decoder。參考 JSON 已由官方 CDN 完整 GET/SHA 核對，未放進 Git。\n'
        '- 工程 17 份檔案/609,333 bytes 已核對；六份程式/說明/必要 CAD 路徑與雜湊設定同步 Software，私有往來信件未納入。\n'
        '- Registry 13 份 Markdown 及一份來源說明已更正 Test 1/Test 2 標示，數字不變。線上 Save 因僅接受 Registry 圖片回傳 400，主流程另處理圖片，尚未宣稱成功發布。\n'
        '- 自動審核拒絕移除本輪 16 份重複工作副本及 48 份測試工作檔（共 539,897 bytes）；兩組均零刪除、不重試，未冒列為去重 canonical。原先 17 份 staging 與兩份 .pyc 的拒絕紀錄仍保留。\n'
        '- 最近已驗證 Wiki 為 d1cb454229dff683f5689c06f9690e47d27f559e，pipeline 792226、315/315 部署檢核通過；本輪新頁面另待發布。\n')
    text = text.replace('目前發布狀態\n', '目前發布狀態\n' + addition + '\n', 1)
    pending.write_text(text, encoding='utf8')
    receipt = {'created_at_utc': NOW, 'source_manifest_before_sha256': before_manifest,
        'source_manifest_after_sha256': sha(manifest_path), 'changed_source_paths': sorted(changed_paths),
        'software_source_count': len(new_rows), 'software_source_bytes': manifest['summary']['retained_bytes'],
        'software_root_support_files_unchanged': 7, 'new_archive_records': additions,
        'new_archive_files': len(additions), 'new_archive_bytes': sum(int(r['bytes']) for r in additions),
        'master_before_sha256': before_master, 'master_after_sha256': sha(master),
        'manifest_records': len(records), 'payload_files_before': registered_before, 'payload_files': len(known), 'payload_bytes': summary['payload_bytes'],
        'no_index_commit_push': True, 'no_network': True, 'no_deletion': True, 'full_archive_rehashed': False}
    write(AUD / 'unified-source-registration.json', receipt)
    print(json.dumps({k: v for k, v in receipt.items() if k not in {'changed_source_paths', 'new_archive_records'}}, indent=2))

if __name__ == '__main__': main()
