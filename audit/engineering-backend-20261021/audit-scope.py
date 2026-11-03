"""Audit the explicitly requested Engineering/Hardware additions against verified Wiki d1cb454."""
from pathlib import Path
import datetime,hashlib,json,re,subprocess,urllib.parse
A=Path(__file__).resolve().parent; R=A.parents[2]; S=R/'aerosense-wiki'; BASE='d1cb454229dff683f5689c06f9690e47d27f559e'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
norm=lambda b:re.sub(rb'([?&]v=)[a-f0-9]{8,64}',rb'\1<CACHE_HASH>',b.replace(b'\r\n',b'\n'))
rows=[]
for p in sorted(S.glob('*.html')):
    try: old=subprocess.check_output(['git','-C',str(R/'gitlab/nthu'),'show',BASE+':site/'+p.name],stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError: continue
    rows.append({'page':p.name,'content_changed':norm(old)!=norm(p.read_bytes()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
allowed={'engineering.html','hardware.html'}; protected={'human-practices.html','education.html','entrepreneurship.html','sustainability.html'}
comp=read(S/'audit/compliance-review.json'); ledger=read(S/'igem-upload/verified-official-urls.json')
bare=lambda u:urllib.parse.urlunsplit((*urllib.parse.urlsplit(u)[:3],'',''))
known={bare(x['official_url']) for x in ledger}; urls={bare(x['url']) for k in ('runtime_urls','outbound_urls') for x in comp[k] if urllib.parse.urlsplit(x['url']).hostname=='static.igem.wiki'}
base=read(S/'audit/measurement-curves-20261021/baseline.json')
git=lambda *a:subprocess.check_output(['git','-C',str(R/'github/iGEM-2026-wiki'),*a]).decode().strip()
preserved={}
for name in allowed:
    old=subprocess.check_output(['git','-C',str(R/'gitlab/nthu'),'show',BASE+':site/'+name]).decode('utf-8'); new=(S/name).read_text(encoding='utf-8')
    media=lambda t:set(re.findall(r'<(?:img|source|video|iframe)\b[^>]*?(?:src|srcset)=["\']([^"\']+)',t))
    preserved[name]={'existing_media':len(media(old)),'missing_original_media':sorted(media(old)-media(new))}
report={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseline_commit':BASE,'allowed_page_edits':sorted(allowed),'pages':rows,'unexpected_content_changes':[x['page'] for x in rows if x['content_changed'] and x['page'] not in allowed],'protected_content_changes':[x['page'] for x in rows if x['content_changed'] and x['page'] in protected],'original_media_preservation':preserved,'compliance':comp['summary'],'official_cdn_urls':len(urls),'official_cdn_with_full_byte_proof':len(urls&known),'unverified_cdn':sorted(urls-known),'github_head_unchanged':git('rev-parse','HEAD')==base['github_head'],'github_status_unchanged':git('status','--porcelain').splitlines()==base['github_status']}
report['passed']=not report['unexpected_content_changes'] and not report['protected_content_changes'] and not report['unverified_cdn'] and all(not x['missing_original_media'] for x in preserved.values()) and report['github_head_unchanged'] and report['github_status_unchanged']
(A/'final-scope-and-media.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='pages'},ensure_ascii=False)); assert report['passed']
