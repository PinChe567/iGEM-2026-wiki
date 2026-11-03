"""Prepare or run anonymous full-byte deployment checks; no browser state or source edits.

Default is preparation only (zero network). --run requires the owner's explicit
CI-success signal. The official job artifact ZIP is processed only in memory.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse, collections, datetime, gzip, hashlib, html, io, json, re, subprocess, urllib.error, urllib.parse, urllib.request, zipfile, zlib

A=Path(__file__).resolve().parent;R=A.parents[2];REPO=R/'gitlab/nthu';PUBLIC=REPO/'public'
SITE='https://2026.igem.wiki';BASE=SITE+'/nthu/'
DEFAULT_COMMIT='32d9f06ab6c29da742dc2a816bc285dd02f633ac'
HEADERS=('Content-Type','Content-Length','Content-Encoding','Cache-Control','ETag','Last-Modified','Expires','Vary','X-Content-Type-Options','Content-Security-Policy','Cross-Origin-Resource-Policy','Access-Control-Allow-Origin','Server','Age','Via','X-Cache')
RETIRED_LOCAL_PDFS=('js/vendor/pdfjs-6.4.299/pdf.mjs','js/vendor/pdfjs-6.4.299/pdf.worker.mjs')
def sha(data):return hashlib.sha256(data).hexdigest()
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(name,value):(A/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def digest_files():
    return {p.relative_to(PUBLIC).as_posix():{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in sorted(PUBLIC.rglob('*')) if p.is_file()}
def query_urls(files):
    requests=[{'url':BASE+urllib.parse.quote(p,safe='/'),'expected_path':p,'kind':'published file'} for p in sorted(files)]
    requests.append({'url':BASE,'expected_path':'index.html','kind':'home route'})
    # All standard directory routes come from the actual route manifest inputs.
    for p in sorted(files):
        if p.count('/')==1 and p.endswith('/index.html'):
            requests.append({'url':BASE+p.split('/')[0],'expected_path':p,'kind':'clean required route'})
    return requests
def mime_ok(path, value):
    mime=value.split(';')[0].strip().lower()
    if path.endswith('.html'):return mime in {'text/html','application/xhtml+xml'}
    if path.endswith(('.js','.mjs')):return mime in {'text/javascript','application/javascript','application/x-javascript'}
    if path.endswith('.css'):return mime=='text/css'
    if path.endswith('.json'):return mime in {'application/json','text/json'}
    return True
class SiteRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        url=urllib.parse.urljoin(req.full_url,newurl);parts=urllib.parse.urlsplit(url)
        if parts.scheme!='https' or parts.netloc!='2026.igem.wiki' or not parts.path.startswith('/nthu/'):
            raise ValueError('Unexpected deployment redirect: '+url)
        return super().redirect_request(req,fp,code,msg,headers,url)
def fetch(request,files):
    result=dict(request);result['checked_at_utc']=now();result['expected']=files[request['expected_path']]
    try:
        opener=urllib.request.build_opener(SiteRedirects())
        req=urllib.request.Request(request['url'],headers={'User-Agent':'AeroSense-public-deployment-verification/1.0','Accept-Encoding':'identity','Cache-Control':'no-cache'})
        with opener.open(req,timeout=45) as response:
            data=response.read();wire_size=len(data);enc=response.headers.get('Content-Encoding','').lower()
            if enc=='gzip':data=gzip.decompress(data)
            elif enc=='deflate':data=zlib.decompress(data)
            elif enc not in {'','identity'}:raise ValueError('Unsupported response encoding: '+enc)
            result.update(status=response.status,final_url=response.url,headers={k:response.headers[k] for k in HEADERS if k in response.headers},wire_bytes=wire_size,decoded_bytes=len(data),sha256=sha(data))
        result['exact_ci_hash_match']=result['sha256']==result['expected']['sha256'] and len(data)==result['expected']['bytes']
        result['mime_ok']=mime_ok(request['expected_path'],result['headers'].get('Content-Type',''))
        result['ok']=result['status']==200 and result['exact_ci_hash_match'] and result['mime_ok']
        if request['expected_path'].endswith('.html'):
            text=data.decode('utf-8',errors='replace');title=re.search(r'<title[^>]*>(.*?)</title>',text,re.I|re.S)
            result['title']=html.unescape(re.sub(r'\s+',' ',title[1]).strip()) if title else None
        if not result['exact_ci_hash_match']:
            result['observed_lf_sha256']=sha(data.replace(b'\r\n',b'\n'))
    except urllib.error.HTTPError as error:
        result.update(status=error.code,ok=False,error=str(error),headers={k:error.headers[k] for k in HEADERS if k in error.headers})
    except Exception as error:result.update(ok=False,error=type(error).__name__+': '+str(error))
    return result
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run',action='store_true')
    parser.add_argument('--commit',default=DEFAULT_COMMIT)
    parser.add_argument('--pipeline-id',type=int,default=791186)
    parser.add_argument('--pages-job-id',type=int)
    parser.add_argument('--workers',type=int,default=5)
    parser.add_argument('--incremental-from',type=Path,help='Prior successful full-byte readback receipt; repeat all required routes and changed files only.')
    args=parser.parse_args()
    suffix='-'+str(args.pipeline_id) if args.incremental_from else ''
    baseline=json.loads(args.incremental_from.read_text(encoding='utf-8')) if args.incremental_from else None
    if baseline:assert baseline['summary']['failed']==0 and baseline['summary']['passed']==baseline['summary']['requests']
    local_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()
    remote_line=subprocess.check_output(['git','ls-remote','origin','refs/heads/main'],cwd=REPO,text=True).strip()
    commit=remote_line.split()[0]
    assert commit==args.commit,{'expected_remote_commit':args.commit,'actual_remote':commit,'local_commit':local_commit}
    current=digest_files();assert len(current)>=180,len(current)
    assert all(p not in current for p in RETIRED_LOCAL_PDFS)
    reader=(PUBLIC/'js/pdf-reader.js').read_text(encoding='utf-8')
    cdn_modules=re.findall(r"var (?:libraryUrl|workerUrl) = '(https://static\.igem\.wiki/[^']+\.js)';",reader)
    assert len(cdn_modules)==2,cdn_modules
    cdn_receipts=json.loads((A.parent/'final-publication-20261021/pdfjs-cdn-get-verification.json').read_text(encoding='utf-8'))
    for url in cdn_modules:
        matches=[r for r in cdn_receipts if r['url']==url]
        assert len(matches)==1 and matches[0]['pass'] and matches[0]['status']==200 and matches[0]['sha256']==matches[0]['expected_sha256'] and matches[0]['cors_origin']=='*',url
    plan={'prepared_at_utc':now(),'network_executed':False,'wiki_commit':commit,'pipeline_id':args.pipeline_id,'pages_job_id':args.pages_job_id,'local_public_files':current,'local_file_count':len(current),'local_checkout_commit':local_commit,'local_checkout_may_contain_unpublished_commit':local_commit!=commit,'local_html_count':sum(p.endswith('.html') for p in current),'planned_request_count':len(query_urls(current)),'pdf_cdn_modules':cdn_modules,'pdf_cdn_verification_receipt':'aerosense-wiki/audit/final-publication-20261021/pdfjs-cdn-get-verification.json','retired_local_pdf_modules_not_requested':True,'official_artifact_url':f'https://gitlab.igem.org/2026/nthu/-/jobs/{args.pages_job_id}/artifacts/download' if args.pages_job_id else None,'source_policy':'Artifact ZIP remains in memory; persist only paths, SHA-256, sizes and response metadata. Full deployed responses are hashed, not saved as duplicate outputs. CDN PDF modules use the separate complete GET/SHA/CORS receipt; no obsolete local module request is required.','run_requires':'Root confirmation of successful official pipeline/pages job and its observed job ID; no network in prepare mode.'}
    plan['incremental_from']=str(args.incremental_from) if args.incremental_from else None
    save('official-wiki-deployment-plan'+suffix+'.json',plan)
    if not args.run:
        print(json.dumps({k:v for k,v in plan.items() if k!='local_public_files'},ensure_ascii=False));return
    assert args.pages_job_id,'The successful official pages-job ID is required for network verification.'
    request=urllib.request.Request(plan['official_artifact_url'],headers={'User-Agent':'AeroSense-public-deployment-verification/1.0','Accept-Encoding':'identity'})
    with urllib.request.urlopen(request,timeout=90) as response:
        archive=response.read();artifact_headers={k:response.headers[k] for k in HEADERS if k in response.headers};artifact_final_url=response.url
    files={};local_comparison=[];navigation_checks=[]
    with zipfile.ZipFile(io.BytesIO(archive)) as zipped:
        for member in zipped.infolist():
            if member.is_dir() or not member.filename.startswith('public/'):continue
            relative=member.filename[len('public/'):]
            assert relative and not Path(relative).is_absolute() and '..' not in Path(relative).parts,relative
            data=zipped.read(member);files[relative]={'bytes':len(data),'sha256':sha(data)}
            if relative.count('/')==1 and relative.endswith('/index.html'):
                bases=re.findall(rb'<base\b[^>]*\bhref=["\x27]([^"\x27]+)',data,re.I)
                expected='/nthu/'+relative.split('/')[0]+'.html'
                navigation_checks.append({'path':relative,'expected_base_href':expected,'actual_base_hrefs':[b.decode('utf-8') for b in bases],'page_anchor_base_ok':bases==[expected.encode()]})
            local=PUBLIC/relative
            state='missing locally'
            if local.is_file():
                local_data=local.read_bytes()
                normalize=lambda b:re.sub(rb'([?&]v=)[a-f0-9]{8,64}',rb'\1<CACHE_HASH>',re.sub(rb'\r+\n',b'\n',b))
                state='exact' if local_data==data else 'line endings only' if re.sub(rb'\r+\n',b'\n',local_data)==re.sub(rb'\r+\n',b'\n',data) else 'line endings and cache queries only' if normalize(local_data)==normalize(data) else 'generated or source content differs'
            local_comparison.append({'path':relative,'comparison':state,'ci':files[relative],'local':current.get(relative)})
    assert len(files)>=180 and sum(p.endswith('.html') for p in files)>=45
    assert all(p not in files for p in RETIRED_LOCAL_PDFS)
    artifact={'checked_at_utc':now(),'wiki_commit':commit,'pipeline_id':args.pipeline_id,'job_id':args.pages_job_id,'artifact_url':plan['official_artifact_url'],'artifact_final_url':artifact_final_url,'artifact_zip_sha256':sha(archive),'artifact_zip_bytes':len(archive),'artifact_headers':artifact_headers,'files':files,'file_count':len(files),'html_count':sum(p.endswith('.html') for p in files),'local_comparison':local_comparison,'local_only_files':sorted(set(current)-set(files)),'local_comparison_summary':dict(collections.Counter(r['comparison'] for r in local_comparison)),'artifact_file_saved':False}
    artifact['navigation_base_checks']=navigation_checks
    save('official-ci-public-hash-manifest'+suffix+'.json',artifact)
    del archive
    requests=query_urls(files);results=[];network=[]
    prior={r['url']:r for r in baseline['responses']} if baseline else {}
    for request in requests:
        old=prior.get(request['url']);expected=files[request['expected_path']]
        if request['kind']=='published file' and old and old['ok'] and old['sha256']==expected['sha256'] and old['decoded_bytes']==expected['bytes']:
            reused=dict(old);reused['expected']=expected
            reused['verification_mode']='Prior full HTTP proof reused because new CI artifact bytes and path are identical.'
            reused['proof_reused_from']=str(args.incremental_from);reused['prior_wiki_commit']=baseline['wiki_commit']
            results.append(reused)
        else:network.append(request)
    print(json.dumps({'incremental':bool(baseline),'new_http_requests':len(network),'unchanged_proofs_reused':len(results),'total_checks':len(requests)}),flush=True)
    with ThreadPoolExecutor(max_workers=max(1,min(args.workers,6))) as pool:
        pending={pool.submit(fetch,r,files):r for r in network}
        for future in as_completed(pending):
            results.append(future.result())
            if len(results)%40==0:print(json.dumps({'completed':len(results),'planned':len(requests),'failures_so_far':sum(not r['ok'] for r in results)}),flush=True)
    results.sort(key=lambda r:r['url'])
    summary={'requests':len(results),'network_requests':len(network),'unchanged_proofs_reused':len(requests)-len(network),'passed':sum(r['ok'] for r in results),'failed':sum(not r['ok'] for r in results),'unique_ci_files':len(files),'html_file_requests':sum(r['kind']=='published file' and r['expected_path'].endswith('.html') for r in results),'required_route_requests':sum(r['kind']!='published file' for r in results),'clean_route_anchor_bases_passed':sum(r['page_anchor_base_ok'] for r in navigation_checks),'clean_route_anchor_bases_checked':len(navigation_checks),'retired_local_pdf_modules_requested':False,'pdf_cdn_modules_separately_verified':cdn_modules}
    out={'checked_at_utc':now(),'wiki_commit':commit,'pipeline_id':args.pipeline_id,'pages_job_id':args.pages_job_id,'authority':'Anonymous official pages artifact as exact Linux CI output; local line-ending/content differences are reported separately.','summary':summary,'local_vs_ci_summary':artifact['local_comparison_summary'],'local_checkout_commit':local_commit,'local_public_is_prior_release':True,'responses':results,'source_files_changed':False,'git_operations':'rev-parse only; no index, commit or push writes','browser_or_credentials_used':False}
    out['incremental_baseline_receipt']=str(args.incremental_from) if args.incremental_from else None
    save('official-wiki-deployment-readback'+suffix+'.json',out)
    assert digest_files()==current,'Local public changed during readback'
    print(json.dumps(summary,ensure_ascii=False))
    if summary['failed']:raise SystemExit(2)
if __name__=='__main__':main()
