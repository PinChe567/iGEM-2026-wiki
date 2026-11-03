"""Check scope against the published baseline, allowing cache-query updates only elsewhere."""
from pathlib import Path
import datetime,hashlib,json,re,subprocess,urllib.parse
A=Path(__file__).resolve().parent;R=A.parents[2];S=R/'aerosense-wiki'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
base=read(A/'baseline.json'); initial=read(A/'existing-release-recheck.json')
normalize=lambda b:re.sub(rb'([?&]v=)[a-f0-9]{8,64}',rb'\1<CACHE_HASH>',b.replace(b'\r\n',b'\n'))
rows=[]
for item in base['pages']:
    p=S/item['name'];current=p.read_bytes()
    old=subprocess.check_output(['git','-C',str(R/'gitlab/nthu'),'show',base['wiki_head']+':site/'+item['name']])
    changed=normalize(old)!=normalize(current)
    rows.append({'page':item['name'],'content_changed':changed,'cache_only_or_identical':not changed,'sha256':hashlib.sha256(current).hexdigest()})
compliance=read(S/'audit/compliance-review.json')
bare=lambda u:urllib.parse.urlunsplit((*urllib.parse.urlsplit(u)[:3],'',''))
ledger=read(S/'igem-upload/verified-official-urls.json')
known={bare(x['official_url']) for x in ledger}
static={bare(x['url']) for key in ('runtime_urls','outbound_urls') for x in compliance[key] if urllib.parse.urlsplit(x['url']).hostname=='static.igem.wiki'}
git=lambda *a:subprocess.check_output(['git','-C',str(R/'github/iGEM-2026-wiki'),*a]).decode().strip()
report={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'pages':rows,
 'unexpected_content_changes':[x['page'] for x in rows if x['content_changed'] and x['page'] not in base['allowed_page_edits']],
 'protected_content_changes':[x['page'] for x in rows if x['content_changed'] and x['page'] in base['protected_content']],
 'intentional_shared_source_change':'figure-numbering.js respects authored main and supplementary figure labels; page changes elsewhere are cache queries only',
 'compliance':compliance['summary'],'current_static_urls':len(static),'with_full_byte_ledger_proofs':len(static&known),'unverified_static_urls':sorted(static-known),
 'video_proof':'existing-release-recheck.json: same-task public API checks for all 11 unique published videos; unchanged video sources',
 'public_videos':initial['public_published_videos'],
 'github_head_unchanged':git('rev-parse','HEAD')==base['github_head'],'github_status_unchanged':git('status','--porcelain').splitlines()==base['github_status'],
 'cleanup_pending':read(A/'upload-staging-cleanup-status.json')}
report['passed']=not report['unexpected_content_changes'] and not report['protected_content_changes'] and not report['unverified_static_urls'] and report['github_head_unchanged'] and report['github_status_unchanged']
(A/'final-scope-and-media.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in report.items() if k not in ('pages','cleanup_pending')},ensure_ascii=False))
assert report['passed']
