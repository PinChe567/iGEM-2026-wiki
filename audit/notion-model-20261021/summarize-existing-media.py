"""Read-only media evidence reuse. No HTTP, publication, cleanup or source writes."""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,re,urllib.parse
A=Path(__file__).resolve().parent;S=A.parents[1]
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
bare=lambda u:urllib.parse.urlunsplit((*urllib.parse.urlsplit(u)[:3],'',''))
report=read(A/'existing-runtime-audit.json')
lp=S/'igem-upload/verified-official-urls.json';ledger=read(lp)
known={bare(x['official_url']):x for x in ledger}
urls={bare(x['url']) for k in ('runtime_urls','outbound_urls') for x in report[k] if urllib.parse.urlsplit(x['url']).hostname=='static.igem.wiki'}
videos={x['url'] for k in ('runtime_urls','outbound_urls') for x in report[k] if urllib.parse.urlsplit(x['url']).hostname=='video.igem.org'}
vp=S/'audit/video-public-readback-20261021.json';prior=read(vp)
additional=A/'video-metadata-delta.json'
video_proofs=prior['videos']+(read(additional)['videos'] if additional.exists() else [])
video_rows=[]
for url in sorted(videos):
    token=urllib.parse.urlsplit(url).path.rstrip('/').split('/')[-1]
    matches=[x for x in video_proofs if token in [x.get('uuid'),x.get('id'),urllib.parse.urlsplit(x.get('watch_url','')).path.rstrip('/').split('/')[-1]]]
    video_rows.append({'url':url,'match_count':len(matches),'uuid':matches[0].get('uuid',matches[0].get('id')) if len(matches)==1 else None,'prior_public_published':bool(len(matches)==1 and matches[0]['status']==200 and matches[0]['privacy']['label']=='Public' and matches[0]['state']['label']=='Published')})
team_links=[x for k in ('runtime_urls','outbound_urls') for x in report[k] if re.search(r'(?:drive|docs)\.google\.com|forms\.gle|notion\.(?:so|site)',x['url'])]
result={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'scope':'Current reachable HTML/CSS/JS links; reuse existing exact-URL CDN and public Video Universe evidence. No new HTTP or playback claims. May precede the Notion content/source freeze.',
'source_audit_sha256':sha(A/'existing-runtime-audit.json'),'ledger_path':str(lp.relative_to(S)),'ledger_sha256':sha(lp),
'summary':report['summary'],'static_urls':len(urls),'static_urls_with_existing_proof':len(urls&known.keys()),'static_unverified':sorted(urls-known.keys()),
'video_url_forms':len(videos),'video_unique_uuids':len({x['uuid'] for x in video_rows if x['uuid']}),'video_urls':video_rows,
'video_prior_receipt':str(vp.relative_to(S)),'video_prior_receipt_sha256':sha(vp),'video_prior_checked_at_utc':prior['checked_at_utc'],
'external_team_links':team_links,'issues':report['issues'],'root_html_sha256':{p.name:sha(p) for p in sorted(S.glob('*.html'))}}
(A/'existing-media-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:result[k] for k in ['static_urls','static_urls_with_existing_proof','static_unverified','video_url_forms','video_unique_uuids','external_team_links','summary']},ensure_ascii=True))
