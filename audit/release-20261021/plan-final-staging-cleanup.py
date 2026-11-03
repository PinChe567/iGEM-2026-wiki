"""Read-only candidate inventory. No filesystem deletion/move occurs."""
from pathlib import Path
from collections import Counter
import json,hashlib,os
ROOT=Path(__file__).resolve().parents[3];SITE=ROOT/'aerosense-wiki';OUT=Path(__file__).parent
F=SITE/'audit/final-publication-20261021'
def read(p):return json.loads(p.read_text(encoding='utf8'))
def native(p):
 absolute=str(p.absolute())
 return Path('\\\\?\\'+absolute) if os.name=='nt' and len(absolute)>=240 and not absolute.startswith('\\\\?\\') else p
def sha(p):
 h=hashlib.sha256()
 with native(p).open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def rel(p):return p.resolve().relative_to(ROOT.resolve()).as_posix()
canonical={}
for r in read(F/'executed-source-only-artifact-copy-cleanup.json')['files']:
 canonical.setdefault(r['source_sha256'],[]).append(r['canonical_relative'])
pres=read(F/'verified-document-reader-preservation.json')
assert pres['all_saved_hashes_verified'] and pres['pdf_files']==10
for r in pres['files']:canonical.setdefault(r['sha256'],[]).append(r['canonical_archive'])
for r in read(F/'verified-download-copy-cleanup-plan.json')['files']:
 canonical.setdefault(r['sha256'],[]).append(r['retain_canonical'])

def find_canonical(digest):
 for candidate in canonical.get(digest,[]):
  p=ROOT/candidate
  if p.is_file() and sha(p)==digest:return candidate
 return None

rows=[]
def item(p,group,action,expected=None):
 p=p.resolve();assert p.is_relative_to(SITE.resolve()),p
 r={'source':rel(p),'group':group,'proposed_action':action,'exists':p.is_file()}
 if not p.is_file():r['status']='already_absent_no_action';rows.append(r);return r
 digest=sha(p);r.update(sha256=digest,bytes=p.stat().st_size,canonical=find_canonical(digest))
 if expected:r['expected_sha256_matches']=digest==expected
 if expected and digest!=expected:r.update(status='hold_source_changed',proposed_action='retain')
 elif action=='candidate_duplicate_removal':r['status']='ready_for_parent_review' if r['canonical'] else 'hold_no_verified_canonical'
 else:r['status']='retained_source_or_license' if action=='retain_authoring_or_license_source' else 'generated_preview_candidate'
 rows.append(r);return r

fallbacks=read(F/'official-gitlab-download-fallbacks.json')['files']
assert len(fallbacks)==13
for r in fallbacks:
 for path in r['source_paths']:
  p=ROOT/path
  action='candidate_duplicate_removal' if p.suffix.lower() in {'.zip','.xlsx'} else 'retain_authoring_or_license_source'
  row=item(p,'daily_previous_fallback',action,r['sha256'])
  row['reason']='Retain authored Markdown and attribution/license source; only redundant downloaded binaries/packages are cleanup candidates.' if action.startswith('retain') else 'Former local download is now a verified PDF reader/source tree/archive-status link; research original is retained in the canonical archive.'

staging_seen=set()
for name in ['verified-cdn-corrections-mapping.json','verified-cdn-hardware-documents-mapping.json','verified-cdn-research-documents-mapping.json','verified-cdn-microscopy-parameters-mapping.json']:
 for r in read(F/name)['files']:
  assert r['verified'] and r['response_sha256']==r['sha256']
  path=Path(r['staging_path']).resolve()
  if path in staging_seen:continue
  staging_seen.add(path)
  row=item(path,'cdn_corrections_staging','candidate_duplicate_removal',r['sha256']);row['verified_official_url']=r['official_url']
assert len(staging_seen)==100

conversion=F/'cdn-document-conversions'
for r in pres['files']:
 p=ROOT/r['source']
 if p.is_relative_to(conversion) and p.suffix.lower() in {'.pdf','.html','.webp','.png','.jpg','.jpeg'}:
  item(p,'document_conversion_duplicate','candidate_duplicate_removal',r['sha256'])
pdf_proofs={Path(r['source']).stem:r for r in pres['documents']}
for p in conversion.glob('*.png'):
 row=item(p,'document_visual_qa_preview','candidate_regenerable_preview_removal')
 names=[name for name in pdf_proofs if p.stem.startswith(name+'-')]
 if names:
  parent=pdf_proofs[max(names,key=len)];row['regenerate_from_canonical_pdf']=parent['canonical_archive'];row['canonical_pdf_sha256']=parent['sha256']
 else:row.update(status='hold_unknown_preview_parent',proposed_action='retain')
applied=read(F/'applied-source-only-documents.json')
for record in applied['files']:
 p=F/'source-only-draft'/record['path'];q=ROOT/'gitlab/nthu'/record['path']
 if p.is_file() and q.is_file() and sha(p)==record['after_sha256'] and sha(q)==record['after_sha256']:
  canonical.setdefault(record['after_sha256'],[]).append(rel(q))
  r=item(p,'applied_source_only_draft','candidate_duplicate_removal',record['after_sha256']);r['canonical_role']='retained current editable source; draft applied byte-identically'
draft_manifest=F/'source-only-draft/code/aerosense/source-manifest.json'
current_manifest=ROOT/'gitlab/nthu/code/aerosense/source-manifest.json'
if draft_manifest.is_file():
 current=read(current_manifest)
 assert len(current['files'])==1219
 for record in current['files']:
  path=ROOT/'gitlab/nthu'/record['path']
  assert native(path).is_file() and sha(path)==record['sha256'],record['path']
 row=item(draft_manifest,'superseded_draft_manifest','candidate_regenerable_preview_removal')
 row.update(status='superseded_generated_metadata',replacement_source=rel(current_manifest),replacement_sha256=sha(current_manifest),replacement_file_entries_verified=1219,reason='Draft-only generated manifest superseded by current source-only manifest and preserved application/removal receipts.')
report={'scope':'Read-only inventory of 13 daily fallback files, 100 CDN correction staging files, preserved PDF render intermediates, and 13 already-applied source-only Markdown drafts. No GitLab/public/Zenodo deletion. Excludes registry-owned 550 removed publication copies.','deletions_performed':0,'document_canonical_receipt':rel(F/'verified-document-reader-preservation.json'),'policy':'No execution authorized by this inventory alone. Root authorized later cleanup after current public QA passes. Any removal must recheck resolved path containment and current/canonical SHA immediately before each file removal; never remove directories recursively. Preserve audit JSON, generation code, official URL ledgers and receipts.','counts':dict(Counter(r['group'] for r in rows)),'statuses':dict(Counter(r['status'] for r in rows)),'candidate_duplicate_bytes':sum(r.get('bytes',0) for r in rows if r['status']=='ready_for_parent_review'),'candidate_preview_bytes':sum(r.get('bytes',0) for r in rows if r['status']=='generated_preview_candidate'),'files':rows}
(OUT/'final-staging-cleanup-candidates.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:report[k] for k in ['counts','statuses','candidate_duplicate_bytes','candidate_preview_bytes']},ensure_ascii=False))
