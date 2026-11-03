"""Join frozen source URLs to existing CDN/video proofs without any HTTP."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, urllib.parse
A=Path(__file__).resolve().parent;S=A.parents[1]
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
bare=lambda u:urllib.parse.urlunsplit((*urllib.parse.urlsplit(u)[:3],'',''))
report=read(A/'final-runtime-audit.json')
ledger_path=S/'igem-upload/verified-official-urls.json';ledger=read(ledger_path)
known={bare(row['official_url']):row for row in ledger}
all_rows=[row for key in ('runtime_urls','outbound_urls') for row in report[key]]
static={bare(row['url']) for row in all_rows if urllib.parse.urlsplit(row['url']).hostname=='static.igem.wiki'}
videos={row['url'] for row in all_rows if urllib.parse.urlsplit(row['url']).hostname=='video.igem.org'}
prior_path=S/'audit/video-public-readback-20261021.json';prior=read(prior_path)
proofs=prior['videos']+read(A/'video-metadata-delta.json')['videos']
video_rows=[]
for url in sorted(videos):
    token=urllib.parse.urlsplit(url).path.rstrip('/').split('/')[-1]
    matches=[row for row in proofs if token in [row.get('uuid'),row.get('id'),urllib.parse.urlsplit(row.get('watch_url','')).path.rstrip('/').split('/')[-1]]]
    video_rows.append({'url':url,'match_count':len(matches),'uuid':matches[0].get('uuid',matches[0].get('id')) if len(matches)==1 else None,
                       'public_published':bool(len(matches)==1 and matches[0]['status']==200 and matches[0]['privacy']['label']=='Public' and matches[0]['state']['label']=='Published')})
baseline=read(A/'existing-runtime-audit.json')
baseline_static={bare(row['url']) for key in ('runtime_urls','outbound_urls') for row in baseline[key] if urllib.parse.urlsplit(row['url']).hostname=='static.igem.wiki'}
new_images=read(A/'verified-notion-figures-mapping.json')
new_scientific={bare(row['official_url']) for row in new_images['mapping']}
original=read(A/'original-pathway-public-readback.json')
new_expected=new_scientific|{bare(original['official_url'])}
drive=[row for row in all_rows if urllib.parse.urlsplit(row['url']).hostname in {'drive.google.com','docs.google.com'}]
external_runtime=[row for row in report['runtime_urls'] if not row['official']]
browser_path=A/'browser-qa.json'
result={'checked_at_utc':datetime.now(timezone.utc).isoformat(),
        'scope':'Final frozen English-only root HTML and reachable source graph. URL-coverage join only; no new media GETs or playback claims.',
        'source_audit_sha256':sha(A/'final-runtime-audit.json'),'ledger_sha256':sha(ledger_path),
        'counts':{'unique_static_urls':len(static),'static_urls_with_verified_proof':len(static&known.keys()),
                  'prior_730_still_referenced':len(static&baseline_static),'new_scientific_urls':len(new_scientific),
                  'new_original_concept_urls':1,'video_url_forms':len(videos),
                  'unique_public_published_videos':len({row['uuid'] for row in video_rows if row['uuid'] and row['public_published']}),
                  'external_runtime_urls':len(external_runtime),'google_drive_document_links':len(drive),
                  'source_audit_errors':report['summary']['errors']},
        'static_unverified':sorted(static-known.keys()),'new_static_urls':sorted(static-baseline_static),
        'removed_static_urls':sorted(baseline_static-static),'new_12_urls_exactly_match_approved_assets':static-baseline_static==new_expected,
        'scientific_images_full_GET_same_bytes':bool(new_images['all_passed'] and len(new_images['files'])==11 and all(row['passed'] and row['source_sha256']==row['response_sha256'] for row in new_images['files'])),
        'original_image_conversion_validated':original['status']==200 and not original['visual_review_pending'],
        'original_image_is_format_conversion_not_byte_identical_to_PNG':not original['byte_identical_to_source'],
        'video_urls':video_rows,'external_runtime':external_runtime,'google_drive_links':drive,
        'rendered_browser_receipt':{'path':browser_path.relative_to(S).as_posix(),'sha256':sha(browser_path)} if browser_path.exists() else None,
        'proof_paths':['audit/notion-model-20261021/verified-notion-figures-mapping.json','audit/notion-model-20261021/original-pathway-public-readback.json','audit/video-public-readback-20261021.json','audit/notion-model-20261021/video-metadata-delta.json'],
        'root_html_sha256':{p.name:sha(p) for p in sorted(S.glob('*.html'))}}
result['all_media_urls_covered']=not result['static_unverified'] and all(row['public_published'] for row in video_rows) and not external_runtime and not drive
(A/'final-media-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'counts':result['counts'],'all_media_urls_covered':result['all_media_urls_covered'],
                  'new_12_urls_exactly_match_approved_assets':result['new_12_urls_exactly_match_approved_assets'],
                  'static_unverified':result['static_unverified'],'removed_static_urls':result['removed_static_urls']},indent=2))
assert result['all_media_urls_covered'] and result['new_12_urls_exactly_match_approved_assets'] and result['scientific_images_full_GET_same_bytes']
