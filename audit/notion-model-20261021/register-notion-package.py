"""Register only the new, verified Notion package; never rehash the full archive."""
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
import csv
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[3]
AUD = Path(__file__).resolve().parent
ARC = ROOT/'zenodo-release'
PKG = ARC/'aerosense-wiki/data/notion-model-2026-10-21'
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def read(path): return json.loads(path.read_text(encoding='utf-8-sig'))
def write(path, value): path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
now = datetime.now(timezone.utc).isoformat()
assert not (AUD/'archive-package-registration.json').exists()
assert not (PKG/'figures/original-olfactory-pathway.avif').exists()
assert not (PKG/'figures/92e5ae4e4097-model-fly-anatomy.webp').exists()

review = read(AUD/'criteria-and-scientific-review.json')
review['new_assets']['original_concept_illustration'] = 'Original generated PNG and prompt retained; official AVIF conversion verified by full GET and root rendered visual inspection. Temporary AVIF copy removed.'
review['user_clarification'] = {'source_authoring_tail': 'Omit as requested; existing credits unchanged. No pending attribution action or reassignment.', 'action_required': False}
write(AUD/'criteria-and-scientific-review.json', review)
image = read(AUD/'original-pathway-public-readback.json')
image['transient_review_copy'] = image.pop('canonical_public_rendition')
image['transient_review_copy_removed'] = True
image['visual_review_pending'] = False
image['visual_review'] = {'reviewer': 'Root', 'method': 'Official CDN image rendered on the local Model page', 'complete': True, 'natural_width': 1942, 'result': 'Pass; intact and visually consistent with original.'}
write(AUD/'original-pathway-public-readback.json', image)
ledger_path = ROOT/'aerosense-wiki/igem-upload/verified-official-urls.json'
ledger = read(ledger_path)
for row in ledger:
    if row.get('official_url') == image['official_url']:
        row['workspace_source_paths'] = [p for p in row['workspace_source_paths'] if not p.endswith('.avif')]
        row['visual_review'] = image['visual_review']
write(ledger_path, ledger)

provenance = read(PKG/'publication-provenance.json')
provenance['source_note_disposition'] = 'Trailing authoring reminder omitted at user direction; no attribution edits or reassignment. Original source capture retained for provenance.'
provenance['public_illustration_review'] = image['visual_review']
provenance['public_illustration_remote_sha256'] = image['response_sha256']
provenance['public_illustration_representation'] = 'Official AVIF conversion; canonical original PNG retained. No local duplicate AVIF payload.'
for row in provenance['figures']:
    if row.get('canonical_path'):
        row['canonical_relative'] = Path(row['canonical_path']).relative_to(ARC).as_posix()
write(PKG/'publication-provenance.json', provenance)

copies = {
    'sources/integrate-notion-model.py': 'integrate-notion-model.py',
    'verification/scientific-review.json': 'criteria-and-scientific-review.json',
    'verification/official-scientific-images.json': 'verified-notion-figures-mapping.json',
    'verification/original-pathway-public-readback.json': 'original-pathway-public-readback.json',
    'verification/content-integration-receipt.json': 'content-integration-receipt.json',
    'verification/final-prose-polish.json': 'final-prose-polish.json',
    'verification/content-static-qa.json': 'content-static-qa.json',
    'verification/software-source-preparation.json': 'software-source-preparation.json',
}
for relative, source in copies.items():
    target = PKG/relative
    assert not target.exists()
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(AUD/source, target)
    assert sha(target) == sha(AUD/source)

files = sorted(p for p in PKG.rglob('*') if p.is_file())
assert len(list((PKG/'figures').glob('*.webp'))) == 11
assert len(list((PKG/'figures').glob('*.png'))) == 1
assert not list(PKG.rglob('__pycache__'))
for capture in ['model-blocks.json', 'engineering-blocks.json']:
    assert sha(PKG/'sources'/capture) == sha(AUD/capture)
master = ARC/'manifest.csv'
before = sha(master)
with master.open(encoding='utf-8-sig', newline='') as stream:
    reader = csv.DictReader(stream); fields = reader.fieldnames; records = list(reader)
known = {row['destination_relative']: row for row in records}
existing_hashes = {row['sha256']: row['destination_relative'] for row in records}
additions = []
for path in files:
    relative = path.relative_to(ARC).as_posix()
    assert relative not in known
    digest = sha(path)
    assert digest not in existing_hashes, f'Existing exact canonical should be referenced instead of copied: {relative}'
    row = {'source_relative': 'New Notion manuscript source, supplied scientific image or verified publication metadata',
           'destination_relative': relative, 'category': 'notion-model-source-and-figures', 'sha256': digest,
           'bytes': str(path.stat().st_size), 'source_mtime_utc': datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
           'corresponding_pages': 'Model; Engineering; Measurement model-evaluation context', 'direct_references': ''}
    additions.append(row); records.append(row); known[relative] = row; existing_hashes[digest] = relative
with master.open('w', encoding='utf-8-sig', newline='') as stream:
    writer = csv.DictWriter(stream, fieldnames=fields); writer.writeheader(); writer.writerows(records)
categories = defaultdict(lambda: {'files': 0, 'bytes': 0})
for row in known.values():
    categories[row['category']]['files'] += 1
    categories[row['category']]['bytes'] += int(row['bytes'])
summary = read(ARC/'summary.json')
summary.update(manifest_source_records=len(records), payload_files=len(known), payload_bytes=sum(int(row['bytes']) for row in known.values()), categories=dict(categories))
summary['notion_model_update_2026_10_21'] = {
    'prepared_at_utc': now, 'status': 'Canonical source preserved; four Software source additions prepared for authorized publication; Wiki deployment separate and pending.',
    'new_canonical_files': len(additions), 'new_canonical_bytes': sum(int(row['bytes']) for row in additions),
    'source_blocks': {'model': 150, 'engineering': 31}, 'supplied_scientific_image_references': 12,
    'unique_supplied_scientific_images': 11, 'new_original_concept_images': 1,
    'official_scientific_image_full_GET_SHA_pass': 11, 'original_official_AVIF_conversion_and_visual_review_pass': True,
    'full_archive_rehashed': False, 'raw_datasets_or_model_implementation_supplied': False,
    'article_derived_image_not_in_payload': True, 'temporary_AVIF_not_in_payload': True,
    'prior_83_blocked_files_untouched': True,
    'judging_form_current_dashboard_state': 'Saved -> Received', 'judging_form_submission_performed_by_agent': False,
    'presentation_current_dashboard_state': 'No Submission',
    'current_deliverables_evidence': 'aerosense-wiki/audit/notion-model-20261021/official-deliverables-visible.txt'}
write(ARC/'summary.json', summary)
pending = (ARC/'PENDING.txt').read_text(encoding='utf-8-sig')
old = 'Judging官方仍Not Started，分頁草稿與六勾選就緒，Save and Submit保留使用者最後按下；Zenodo完整包仍未發布。'
assert old in pending
pending = pending.replace(old, '最新官方 Deliverables dashboard 已顯示 Judging Form Saved → Received；本輪代理未按送出，Presentation 仍為 No Submission。Zenodo完整包仍未發布。', 1)
notice = (f'\nNotion Model／Engineering 新增來源已本機保存：{len(additions)} 檔／{sum(int(row["bytes"]) for row in additions):,} bytes；'
          f'現行 payload {len(known):,} 檔／{summary["payload_bytes"]:,} bytes，manifest {len(records):,} 筆。'
          '11份科學圖官方GET/SHA通過，新原創示意圖PNG保留、官方AVIF轉檔及視覺核對通過；舊文章示意圖不納入。'
          'Software四份新增文字／程式來源已準備，發布與網站部署另行核對；無新增模型訓練程式或原始外部資料集。\n')
pending = pending.replace('目前發布狀態\n', '目前發布狀態\n'+notice, 1)
(ARC/'PENDING.txt').write_text(pending, encoding='utf8')
receipt = {'registered_at_utc': now, 'new_canonical_files': len(additions), 'new_canonical_bytes': sum(int(row['bytes']) for row in additions),
           'payload_files': len(known), 'payload_bytes': summary['payload_bytes'], 'manifest_records': len(records),
           'master_manifest_before_sha256': before, 'master_manifest_sha256': sha(master), 'new_records': additions,
           'only_new_files_hashed': True, 'source_capture_exact': True, 'old_anatomy_and_temporary_AVIF_absent': True,
           'software_commit_push_performed': False, 'cloud_zenodo_publication': False, 'github_touched': False}
write(AUD/'archive-package-registration.json', receipt)
print(json.dumps({key: value for key, value in receipt.items() if key != 'new_records'}, indent=2))
