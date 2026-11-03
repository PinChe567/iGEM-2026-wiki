"""Preserve compact final Registry evidence after all 76 public bodies pass.

Default mode reports readiness only. --apply adds only new exact metadata by
SHA, references existing canonical Markdown, and never copies full payloads,
images or a website. No network, repository, source or deletion operation.
"""
from pathlib import Path
from datetime import datetime,timezone
from collections import defaultdict
import argparse,csv,json,hashlib,shutil
ROOT=Path(__file__).resolve().parents[3];ARC=ROOT/'zenodo-release'
FINAL=ROOT/'aerosense-wiki/audit/final-publication-20261021';AUD=Path(__file__).resolve().parent
DEST=ARC/'reproduction-source/registry-publication-evidence-20261021'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--apply',action='store_true');args=parser.parse_args()
report_path=FINAL/'registry-final-publication-readback.json'
names=['registry-final-publication-readback.json','registry-image-upload-readback.json','executed-registry-historical-gel-cache-cleanup.json',
       'registry-collection-metadata-readback.json','registry-collection-description-readback.json','registry-footer-cleanup-readback.json']
payload_path=FINAL/'registry-upload-documentation-payload.json'
stale_footer='These Markdown entries are prepared for Registry.'
ready=(report_path.exists() and read(report_path).get('all_76_exact',False)
       and read(report_path).get('expected_payload_sha256')==sha(payload_path)
       and stale_footer not in payload_path.read_text(encoding='utf8'))
if not args.apply:
 print(json.dumps({'ready':ready,'waiting_for':'26 successful public GETs and all 76 entries exact','target':str(DEST.relative_to(ROOT)),
   'compact_evidence_sources':names,'additional_metadata':'PROVENANCE.json with existing canonical Markdown mappings',
   'copies_of_full_payload_images_or_website':0,'deduplicate_existing_sha':True,'network_requests':0},indent=2))
 raise SystemExit(0)
assert ready,'Final 76-entry proof is not complete; do not archive as success.'
assert not (DEST/'PROVENANCE.json').exists(),'Final evidence already registered; do not duplicate.'
report=read(report_path);image=read(FINAL/names[1]);cleanup=read(FINAL/names[2])
assert report['successful_page_GETs']==26 and report['expected_entries']==report['exact_matching_entries']==76
assert not report['unexpected_entries']
entries=[e for p in report['pages'] for e in p['entries']]
assert len(entries)==76 and all(e['pass'] and e['actual_body_sha256']==e['expected_body_sha256'] for e in entries)
assert report['expected_payload_sha256']==sha(payload_path)
assert stale_footer not in payload_path.read_text(encoding='utf8')
assert image['mapped_count']==image['success_count']==75
assert cleanup['status']=='completed' and cleanup['removed_file_count']==4
metadata=read(FINAL/names[3]);description=read(FINAL/names[4])
assert metadata['all_exact'] and description['description_exact']
assert metadata['expected_description_sha256']==description['description_sha256']=='c55d22b8342a48c5c567ebd59c92b249eef470ec1dceb6fe7de4e7e57a55e82d'
footer=read(FINAL/names[5])
assert footer['all_11_exact'] and footer['changed_entries_exact']==11 and footer['expected_payload_sha256']==report['expected_payload_sha256']
assert footer['unchanged_65_payload_hashes_match_prior_proof']
master=ARC/'manifest.csv'
with master.open(encoding='utf-8-sig',newline='') as f:
 rd=csv.DictReader(f);fields=rd.fieldnames;records=list(rd)
known={r['destination_relative']:r for r in records};by_sha={}
for row in records:by_sha.setdefault(row['sha256'],row['destination_relative'])
markdown=[]
for path in sorted((ROOT/'registry_docs_v2').glob('*.md')):
 digest=sha(path);assert digest in by_sha,f'Missing canonical Markdown version: {path.name}'
 markdown.append({'source':path.relative_to(ROOT).as_posix(),'sha256':digest,'canonical':by_sha[digest]})
assert len(markdown)==28
DEST.mkdir(parents=True,exist_ok=True)
evidence=[];new=[]
for name in names:
 src=FINAL/name;digest=sha(src);existing=by_sha.get(digest)
 if existing:
  target=ARC/existing;assert sha(target)==digest
 else:
  target=DEST/name;assert not target.exists();shutil.copyfile(src,target);assert sha(target)==digest
  new.append((target,src.relative_to(ROOT).as_posix()));by_sha[digest]=target.relative_to(ARC).as_posix()
 evidence.append({'source':src.relative_to(ROOT).as_posix(),'canonical':target.relative_to(ARC).as_posix(),'sha256':digest,'bytes':target.stat().st_size,'reused':existing is not None})
prov={'created_at_utc':datetime.now(timezone.utc).isoformat(),'status':'76/76 expected documents publicly matched in full',
 'collection_url':'https://registry.igem.org/collections/40067138-a3dd-4e5b-b8a4-50b097ee0156',
 'page_count':26,'entries_exact':76,'images_verified':75,'expected_upload_payload_sha256':report['expected_payload_sha256'],
 'collection_description_characters':868,'collection_description_sha256':description['description_sha256'],
 'stale_prepublication_footer_absent':True,'footer_incremental_checks':11,'unchanged_entry_proofs_reused':65,
 'full_upload_payload_copied':False,'images_copied':0,'scientific_data_or_source_modified':False,
 'canonical_markdown_versions':markdown,'evidence':evidence,
 'image_transform_note':'Registry may automatically convert and resize AVIF. Image receipt records source and returned response hashes; source-byte equality is not asserted for transformed outputs.',
 'payload_reconstruction_note':'The publication readback records exact remote body hashes and UUIDs. Existing local Markdown and the image-routing receipt supply original text and image routes; no additional full Markdown payload copy is created.'}
write(DEST/'PROVENANCE.json',prov);new.append((DEST/'PROVENANCE.json','Final Registry publication evidence synthesis'))
added=[]
for path,source in new:
 relative=path.relative_to(ARC).as_posix();assert relative not in known
 row={'source_relative':source,'destination_relative':relative,'category':'registry-publication-evidence','sha256':sha(path),
  'bytes':str(path.stat().st_size),'source_mtime_utc':datetime.fromtimestamp(path.stat().st_mtime,timezone.utc).isoformat(),
  'corresponding_pages':'Registry collection and 25 parts; 76 typed entries','direct_references':prov['collection_url']}
 records.append(row);known[relative]=row;added.append(row)
with master.open('w',encoding='utf-8-sig',newline='') as f:
 wr=csv.DictWriter(f,fieldnames=fields);wr.writeheader();wr.writerows(records)
cats=defaultdict(lambda:{'files':0,'bytes':0})
for row in known.values():cats[row['category']]['files']+=1;cats[row['category']]['bytes']+=int(row['bytes'])
summary=read(ARC/'summary.json');summary.update(manifest_source_records=len(records),payload_files=len(known),payload_bytes=sum(int(r['bytes']) for r in known.values()),categories=dict(cats))
summary['registry_publication_evidence_2026_10_21']={'status':'76/76 exact public-body verification passed','new_metadata_files':len(added),
 'new_metadata_bytes':sum(int(r['bytes']) for r in added),'provenance':(DEST/'PROVENANCE.json').relative_to(ROOT).as_posix(),
 'duplicate_payload_or_image_copies':0,'full_archive_rehashed':False}
write(ARC/'summary.json',summary)
receipt={'registered_at_utc':datetime.now(timezone.utc).isoformat(),'status':'completed','source_readback_sha256':sha(report_path),
 'new_metadata_files':len(added),'new_metadata_bytes':sum(int(r['bytes']) for r in added),'new_records':added,
 'payload_files':len(known),'payload_bytes':summary['payload_bytes'],'manifest_records':len(records),
 'master_manifest_sha256':sha(master),'no_network':True,'no_deletion':True,'no_duplicate_payload_images':True}
write(AUD/'final-registry-evidence-preservation.json',receipt)
print(json.dumps({k:v for k,v in receipt.items() if k!='new_records'},indent=2))
