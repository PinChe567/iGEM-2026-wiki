"""Read-only, rate-limited external link status audit; no credentials or cookies."""
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlsplit,urlunsplit,parse_qsl
from concurrent.futures import ThreadPoolExecutor,as_completed
import collections,datetime,hashlib,json,re,time,requests
base=Path(__file__).parent;root=base.parents[1];occurrences=collections.defaultdict(list);skipped=[]
sensitive=re.compile(r'^(?:access[_-]?token|token|auth|authorization|api[_-]?key|key|secret|password|signature|sig|x-amz-credential|x-amz-signature)$',re.I)
for file in sorted(root.glob('*.html')):
 s=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser')
 for a in s.select('a[href]'):
  u=urlsplit(a['href'])
  if u.scheme not in ['http','https']:continue
  label=a.get_text(' ',strip=True)[:180]
  section=a.find_parent(['section','footer','header','nav']);context={'page':file.name,'label':label,'section':section.get('id')or section.name if section else None,'in_reference_list':bool(a.find_parent(class_='ref-list'))}
  if u.username or u.password or any(sensitive.fullmatch(k)for k,v in parse_qsl(u.query)):
   skipped.append({'origin':u.scheme+'://'+(u.hostname or ''),'reason':'credential-like URL; not requested','context':context});continue
  url=urlunsplit((u.scheme,u.netloc,u.path,u.query,''))
  if context not in occurrences[url]:occurrences[url].append(context)

# Check priority records before general citations, then asset and social links.
def priority(url):
 host=urlsplit(url).hostname or ''
 if 'zenodo' in url or host=='gitlab.igem.org':return 0
 if host in ['doi.org','responsibility.igem.org','competition.igem.org']:return 1
 if host=='static.igem.wiki':return 3
 return 2
urls=sorted(occurrences,key=lambda u:(priority(u),u));results=[]
def check(url):
 time.sleep(.15)
 attempts=[];last=None;error=None
 with requests.Session()as session:
  session.trust_env=False
  session.headers['User-Agent']='AeroSense-wiki-public-link-audit/1.0'
  for method in ['HEAD','GET']:
   try:
    response=session.request(method,url,timeout=(5,10),allow_redirects=True,stream=True)
    code=response.status_code;final=response.url;response.close()
    attempts.append({'method':method,'status':code});last={'status':code,'final_url':final}
    if method=='HEAD' and code in [400,404,405,410,500,501,502,503,504]:continue
    error=None;break
   except requests.RequestException as exc:
    error=type(exc).__name__;attempts.append({'method':method,'error':error})
    if method=='HEAD':continue
 if last and not error:
  code=last['status'];classification='verified' if 200<=code<400 else 'broken' if code in [404,410] else 'not_verified'
 else:classification='not_verified'
 return {'url':url,**(last or {}),'classification':classification,'attempts':attempts,**({'error':error}if error else {}),'occurrences':occurrences[url]}

report={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'html_pages':len(list(root.glob('*.html'))),'method':'Three workers; unauthenticated HEAD, streaming GET fallback for unsupported/error HEAD responses. No response bodies saved. 403/429, login-required and network errors are not_verified. HTTP status does not validate a cited claim.','unique_urls':len(urls),'skipped':skipped,'results':results}
print(json.dumps({'pages':report['html_pages'],'unique_urls':len(urls),'skipped_sensitive_urls':len(skipped)}),flush=True)
with ThreadPoolExecutor(max_workers=3)as pool:
 futures={pool.submit(check,u):u for u in urls}
 for i,f in enumerate(as_completed(futures),1):
  r=f.result();results.append(r)
  if i%10==0 or r['classification']=='broken':
   print(json.dumps({'completed':i,'total':len(urls),'counts':dict(collections.Counter(x['classification']for x in results)),'latest_domain':urlsplit(r['url']).hostname}),flush=True)
  if i%20==0:
   report['counts']=dict(collections.Counter(x['classification']for x in results));(base/'external-link-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report['counts']=dict(collections.Counter(x['classification']for x in results));report['results']=sorted(results,key=lambda r:(priority(r['url']),r['url']));(base/'external-link-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'done':True,'counts':report['counts']}),flush=True)
