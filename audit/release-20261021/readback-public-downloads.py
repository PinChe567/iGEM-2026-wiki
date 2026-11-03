"""Prepare current-link checks; --execute requires a successful push/CI commit.

No credentials, no CDN re-downloads, no retries, at most four simultaneous GETs.
Only audit files are written. Raw source checks stream the entire response.
"""
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit,quote,unquote
from concurrent.futures import ThreadPoolExecutor,as_completed
from datetime import datetime,timezone
from collections import Counter
from bs4 import BeautifulSoup
import argparse,hashlib,json,re,subprocess,threading,time

BASE=Path(__file__).resolve().parent; SITE=BASE.parents[1]; ROOT=SITE.parent
REPOSITORIES=BASE/'public-readback-repositories.json'
PLAN=BASE/'public-download-readback-plan.json'; REPORT=BASE/'public-download-readback.json'
LEDGER=SITE/'igem-upload/verified-official-urls.json'
def read(p):return json.loads(p.read_text(encoding='utf8'))
def stamp():return datetime.now(timezone.utc).isoformat()
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
def write(p,j):p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def normalize(u):
 p=urlsplit(u)
 assert p.scheme=='https' and p.netloc in {'gitlab.igem.org','static.igem.wiki'},u
 assert not p.username and not p.password and not re.search(r'token|password|secret|auth',p.query,re.I),u
 return urlunsplit((p.scheme,p.netloc,quote(unquote(p.path),safe='/@:+'),p.query,''))
def head(checkout):return subprocess.check_output(['git','-C',str(checkout),'rev-parse','HEAD'],text=True).strip()
def repository_config(path):
 rows=read(path)['repositories'];ids=set();urls=set()
 for r in rows:
  assert re.fullmatch(r'[a-z][a-z0-9_-]*',r['id']) and r['id'] not in ids,r
  r['url']=normalize(r['url']).rstrip('/');assert r['url'] not in urls,r
  assert urlsplit(r['url']).netloc=='gitlab.igem.org'
  checkout=(ROOT/r['local_checkout']).resolve();assert checkout.is_relative_to(ROOT.resolve()) and (checkout/'.git').exists(),r
  r['local_checkout']=checkout.relative_to(ROOT.resolve()).as_posix()
  r['branch']=r.get('branch','main');assert re.fullmatch(r'[A-Za-z0-9_./-]+',r['branch']),r
  r['local_head_at_prepare']=head(checkout);r['project_path']=unquote(urlsplit(r['url']).path).strip('/')
  ids.add(r['id']);urls.add(r['url'])
 return sorted(rows,key=lambda r:len(r['url']),reverse=True)

def prepare(config_path,freeze_sources=False):
 repos=repository_config(config_path)
 targets={};cdn={};issues=[];inputs=[]
 # Freeze publication provenance and support text too. A later license/README
 # change must refresh the plan even when only a repository homepage is linked.
 for repo in repos:
  source_manifest=ROOT/repo['local_checkout']/'code/aerosense/source-manifest.json'
  if source_manifest.exists():
   inputs.append({'path':source_manifest.relative_to(ROOT).as_posix(),'sha256':sha(source_manifest),'role':'publication_source_manifest'})
   for entry in read(source_manifest).get('repository_support_files',[]):
    support=ROOT/repo['local_checkout']/entry['path']
    digest=sha(support)
    if digest!=entry['sha256']:issues.append({'kind':'support_manifest_mismatch','path':entry['path']})
    inputs.append({'path':support.relative_to(ROOT).as_posix(),'sha256':digest,'role':'publication_repository_support'})
 ledger={}
 for r in read(LEDGER):
  if not r.get('official_url','').startswith('https://static.igem.wiki/'):continue
  key=normalize(r['official_url'])
  if key in ledger and ledger[key].get('response_sha256')!=r.get('response_sha256'):
   issues.append({'kind':'conflicting_cdn_ledger_hash','url':key})
  ledger[key]=r
 def add(url,ref):
  url=normalize(url)
  if url.startswith('https://static.igem.wiki/'):
   t=cdn.setdefault(url,{'url':url,'check':'reuse_existing_cdn_full_get_proof','references':[]});t['references'].append(ref)
   proof=ledger.get(url);proof_url=url;cache_alias=False
   # Website cache-busting queries carry a hash prefix; the ledger proves the
   # same immutable path. Preserve the visible URL and explicitly record reuse.
   parsed=urlsplit(url)
   if not proof and re.fullmatch(r'v=[0-9a-f]{8,64}',parsed.query):
    proof_url=urlunsplit((parsed.scheme,parsed.netloc,parsed.path,'',''))
    candidate=ledger.get(proof_url);version=parsed.query[2:]
    if candidate and any(str(candidate.get(k,'')).startswith(version) for k in ['source_sha256','response_sha256']):
     proof=candidate;cache_alias=True
   if proof and re.fullmatch(r'[0-9a-f]{64}',proof.get('response_sha256','')) and proof.get('verified_at_utc'):
    t.update(status='verified_previously',response_sha256=proof['response_sha256'],verified_at_utc=proof['verified_at_utc'],verification_grade=proof.get('verification_grade'),source_paths=proof.get('source_paths',[]),source_sha256=proof.get('source_sha256'),proof_file=LEDGER.relative_to(ROOT).as_posix(),proof_url=proof_url,hash_prefix_cache_query=cache_alias)
   else:
    t.update(status='not_verified',reason='No complete existing CDN hash/time proof found.');issues.append({'kind':'missing_cdn_proof','url':url})
   return
  repo=next((r for r in repos if url==r['url'] or url.startswith(r['url']+'/')),None)
  if repo is None:
   issues.append({'kind':'unexpected_gitlab_project','url':url});return
  prefix=repo['url'];checkout=ROOT/repo['local_checkout'];project=repo['project_path'];branch=repo['branch']
  t=targets.setdefault(url,{'url':url,'repository_id':repo['id'],'references':[]});t['references'].append(ref)
  m=re.fullmatch(re.escape(prefix)+r'/-/(raw|blob|tree)/'+re.escape(branch)+r'/(.+)',url)
  if url.rstrip('/')==prefix:
   t.update(check='html_repository_title',expected_project=project);return
  if not m:issues.append({'kind':'unrecognized_gitlab_route','url':url});return
  kind,rel=m.groups();rel=unquote(rel);path=(checkout/rel).resolve()
  assert path.is_relative_to(checkout.resolve()),rel
  if kind=='tree':
   t.update(check='html_repository_title',expected_project=project,repository_path=rel,title_path_token=Path(rel).name)
   if not path.is_dir():issues.append({'kind':'missing_directory_source','url':url,'path':rel})
   return
  if not path.is_file():issues.append({'kind':'missing_exact_source','url':url,'path':rel});return
  digest=sha(path);size=path.stat().st_size
  t.update(repository_path=rel,working_tree_sha256=digest,working_tree_bytes=size,expected_sha256=digest,expected_bytes=size,hash_basis='prepared working tree; replaced by exact successful-commit blob before HTTP')
  if kind=='raw':t['check']='full_get_sha256'
  else:
   t.update(check='html_repository_title',expected_project=project,title_path_token=Path(rel).name)
   add(prefix+'/-/raw/'+branch+'/'+quote(rel,safe='/'),{**ref,'role':'exact_bytes_of_blob_source'})
 # Follow static root pages and any local HTML viewers directly reachable from them.
 queue=list(SITE.glob('*.html'));seen=set()
 while queue:
  p=queue.pop(0).resolve()
  if p in seen:continue
  seen.add(p);rel=p.relative_to(SITE).as_posix();inputs.append({'path':str(p.relative_to(ROOT)).replace('\\','/'),'sha256':sha(p)})
  soup=BeautifulSoup(p.read_text(encoding='utf8'),'html.parser')
  for tag in soup.find_all(['a','iframe']):
   attr='href' if tag.name=='a' else 'src';u=tag.get(attr,'')
   if u.startswith(('https://gitlab.igem.org/','https://static.igem.wiki/')):
    add(u,{'source':rel,'label':tag.get_text(' ',strip=True),'attribute':attr})
   elif u and not urlsplit(u).scheme and not u.startswith('#'):
    local=(p.parent/unquote(urlsplit(u).path)).resolve()
    if local.is_relative_to(SITE.resolve()) and local.is_file() and local.suffix.lower()=='.html' and 'resources' in local.relative_to(SITE.resolve()).parts:queue.append(local)
 # The nine visible education downloads are constructed by this documented helper.
 game=SITE/'game/apps/wiki-client/src/data/education.ts';text=game.read_text(encoding='utf8')
 inputs.append({'path':game.relative_to(ROOT).as_posix(),'sha256':sha(game)})
 base=re.search(r"const SOURCE_DOCS = '([^']+)'",text).group(1)
 docs=re.findall(r"download\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']+\.md)'\s*\)",text)
 # Direct helper calls, if present, are included in addition to download records.
 docnames={file for _,_,file in docs}
 game_view=SITE/'game/apps/wiki-client/education/src/education.ts'
 inputs.append({'path':game_view.relative_to(ROOT).as_posix(),'sha256':sha(game_view)})
 for file in re.findall(r"educatorSourceUrl\('([^']+\.md)'\)",game_view.read_text(encoding='utf8')):
  if file not in docnames:docs.append(('',file,file));docnames.add(file)
 assert len(docnames)==9,docnames
 for zh,label,file in docs:
  add(base+'/'+('' if file=='education-study-protocol.md' else 'education-games/')+file,{'source':game.relative_to(SITE).as_posix(),'label':label,'label_zh':zh,'role':'visible_education_download'})
 # The two approved PDF.js modules are official CDN runtime dependencies.
 # Their completed GET/SHA/MIME/CORS receipts are reused, never re-downloaded.
 pdf_reader=SITE/'js/pdf-reader.js';pdf_reader_text=pdf_reader.read_text(encoding='utf8')
 inputs.append({'path':pdf_reader.relative_to(ROOT).as_posix(),'sha256':sha(pdf_reader),'role':'pdf_reader_runtime_routes'})
 for variable in ('libraryUrl','workerUrl'):
  match=re.search(r'var '+variable+r"\s*=\s*'(https://static\.igem\.wiki/[^']+)'",pdf_reader_text)
  if match:add(match.group(1),{'source':'js/pdf-reader.js','label':variable,'role':'verified_pdfjs_runtime_module'})
 checks=Counter(t.get('check','unclassified') for t in targets.values())
 return {'schema_version':'current-public-links-v2-dual-repository','prepared_at_utc':stamp(),'network_started':False,'source_hashes_frozen':freeze_sources,'preparation_status':'Source hashes frozen after owner confirmation.' if freeze_sources else 'URL/local-source mapping prepared; research docs and manifest may still change. Reprepare with --freeze-sources after final source confirmation; execution is blocked until then.','repositories':repos,'repository_config_file':str(config_path.relative_to(ROOT)),'repository_config_sha256':sha(config_path),'supersedes':['published-download-readback-plan.json','readback-published-downloads.py'],'scope':'Current daily root pages, linked local resource HTML viewers, and nine visible game education Markdown links. CDN media/file anchors reuse existing full-GET ledger proof; GitLab sources are mapped by longest matching repository URL prefix to an explicit local checkout. No historical rejected publication copies are treated as public.','input_files':inputs,'ledger_sha256':sha(LEDGER),'counts':{'gitlab_unique_urls':len(targets),'gitlab_checks':dict(checks),'gitlab_by_repository':dict(Counter(t['repository_id'] for t in targets.values())),'cdn_unique_urls':len(cdn),'cdn_verified_previously':sum(x.get('status')=='verified_previously' for x in cdn.values()),'game_education_unique_files':len(docnames),'source_pages_and_viewers':len(seen)},'local_issues':issues,'gitlab_targets':list(targets.values()),'cdn_ledger_checks':list(cdn.values()),'execution_policy':'Run only after final source preparation (--freeze-sources), successful pushes and applicable CI, with --execute --commit wiki=FULL_SHA --commit software=FULL_SHA --ci-success (one commit argument per configured repository). No credentials/cookies, CDN requests or retries. At most four parallel GETs; URLs deduplicated; exact committed source bytes downloaded fully for hash/length.'}

state=threading.local()
def check(t):
 import requests
 if not hasattr(state,'session'):
  state.session=requests.Session();state.session.trust_env=False;state.session.headers['User-Agent']='AeroSense-Public-Readback/2.0'
 result={k:v for k,v in t.items() if k!='references'};result['reference_count']=len(t['references'])
 start=time.monotonic()
 try:
  time.sleep(.2)
  with state.session.get(t['url'],timeout=(15,90),stream=True,allow_redirects=True) as r:
   result.update(http=r.status_code,final_url=r.url,content_type=r.headers.get('Content-Type',''),redirects=[{'url':x.url,'http':x.status_code}for x in r.history])
   if r.status_code!=200:
    result.update(status='failure' if r.status_code in [404,410] else 'not_verified',reason='HTTP 200 was not returned; access/rate/server errors are not called broken links.')
   else:
    h=hashlib.sha256();length=0;body=bytearray()
    for chunk in r.iter_content(1024*1024):
     if not chunk:continue
     length+=len(chunk)
     if t['check']=='full_get_sha256':h.update(chunk)
     if len(body)<2*1024*1024:body.extend(chunk[:2*1024*1024-len(body)])
     if t['check']!='full_get_sha256' and len(body)>=2*1024*1024:break
    result['bytes_read']=length
    soup=BeautifulSoup(bytes(body),'html.parser') if 'html' in result['content_type'] else None
    title=soup.title.get_text(' ',strip=True) if soup and soup.title else ''
    login=bool(re.search(r'/(?:users/sign_in|users/auth|login|signin)(?:[/?#]|$)',r.url,re.I) or re.search(r'^(?:sign\s*in|log\s*in|login)',title,re.I))
    if login:result.update(status='not_verified',reason='Login page or authentication redirect returned.')
    elif t['check']=='full_get_sha256':
     actual=h.hexdigest();result['download_sha256']=actual
     ok=actual==t['expected_sha256'] and length==t['expected_bytes']
     result.update(status='success' if ok else 'failure',reason='Complete raw source matches the successful commit blob SHA-256 and byte length.' if ok else 'Raw response does not match the successful commit source bytes.')
    else:
     result['title']=title
     final=normalize(r.url).rstrip('/');wanted=t['url'].rstrip('/')
     bodytext=bytes(body).decode('utf8',errors='ignore');project=t['expected_project']
     project_title_pattern=r'\s*/\s*'.join(re.escape(part) for part in project.split('/'))
     project_marker=bool(re.search(r'(?:data-project-full-path|data-project-path)=[\"\']'+re.escape(project)+r'[\"\']',bodytext) or re.search(project_title_pattern,title,re.I))
     token=t.get('title_path_token');title_ok=project.split('/')[-1].lower() in title.lower() and (not token or token.lower() in unquote(title).lower())
     error=bool(re.search(r'404|not found|access denied|forbidden',title,re.I))
     ok=final==wanted and project_marker and title_ok and not error
     result.update(status='success' if ok else 'not_verified',reason='HTTP 200, exact requested route, and expected repository/path title verified.' if ok else 'HTML returned, but exact repository/path title verification was incomplete.',repository_marker=project_marker,title_matches=title_ok)
 except requests.RequestException as exc:result.update(status='not_verified',reason='Network request did not complete.',error=str(exc)[:400])
 except Exception as exc:result.update(status='not_verified',reason='Verifier could not classify response.',error=str(exc)[:400])
 result['elapsed_seconds']=round(time.monotonic()-start,3);return result

def execute(plan,commit_args):
 assert plan['schema_version']=='current-public-links-v2-dual-repository','Prepare a current dual-repository-capable plan first.'
 assert plan.get('source_hashes_frozen'),'Research source hashes are not frozen; reprepare with --freeze-sources after owner confirmation.'
 repos={r['id']:r for r in plan['repositories']};commits={}
 for value in commit_args:
  if '=' in value:repo_id,commit=value.split('=',1)
  else:
   assert len(repos)==1,'Use repeated --commit repo_id=FULL_SHA arguments for multiple repositories.'
   repo_id=next(iter(repos));commit=value
  assert repo_id in repos and repo_id not in commits and re.fullmatch(r'[0-9a-f]{40}',commit),value
  assert head(ROOT/repos[repo_id]['local_checkout'])==commit,repo_id+': local HEAD differs from the stated successful commit.'
  commits[repo_id]=commit
 assert set(commits)==set(repos),'Provide the successful commit for each configured repository.'
 assert sha(ROOT/plan['repository_config_file'])==plan['repository_config_sha256'],'Repository mapping changed; prepare plan again.'
 assert not plan['local_issues'],plan['local_issues']
 for f in plan['input_files']:assert sha(ROOT/f['path'])==f['sha256'],f['path']+' changed; prepare plan again.'
 committed={}
 for t in plan['gitlab_targets']:
  if 'working_tree_sha256' not in t:continue
  repo_id=t['repository_id'];repo=ROOT/repos[repo_id]['local_checkout'];commit=commits[repo_id]
  rel=t['repository_path'];source=repo/rel;cache_key=(repo_id,rel)
  assert sha(source)==t['working_tree_sha256'],rel+' changed; prepare plan again.'
  if cache_key not in committed:
   # Git's own attributes determine LF/CRLF normalization. The commit must
   # represent precisely this working source after those configured filters.
   normalized_id=subprocess.check_output(['git','hash-object','--path='+rel,str(source)],cwd=repo,text=True).strip()
   committed_id=subprocess.check_output(['git','rev-parse',commit+':'+rel],cwd=repo,text=True).strip()
   assert normalized_id==committed_id,rel+' normalized working tree differs from successful commit.'
   body=subprocess.check_output(['git','show',commit+':'+rel],cwd=repo)
   committed[cache_key]={'expected_sha256':hashlib.sha256(body).hexdigest(),'expected_bytes':len(body),'expected_git_blob_id':committed_id,'publication_commit':commit,'hash_basis':'exact bytes from '+repo_id+' git show '+commit+':'+rel}
  t.update(committed[cache_key]);t['working_tree_to_commit_bytes_differ']=t['working_tree_sha256']!=t['expected_sha256']
 plan['publication_commits']=commits;plan['committed_blob_expectations_prepared_at_utc']=stamp();plan['network_started']=True;write(PLAN,plan)
 report={'started_at_utc':stamp(),'commits':commits,'plan_sha256':sha(PLAN),'policy':plan['execution_policy'],'cdn_ledger_checks_reused':len(plan['cdn_ledger_checks']),'results':[]}
 def save():
  report['counts']=dict(Counter(r['status'] for r in report['results']));write(REPORT,report)
 with ThreadPoolExecutor(max_workers=4) as pool:
  tasks=[pool.submit(check,t) for t in plan['gitlab_targets']]
  for future in as_completed(tasks):
   report['results'].append(future.result());save()
   if len(report['results'])%10==0:print(json.dumps({'completed':len(report['results']),'counts':report['counts']}),flush=True)
 report['finished_at_utc']=stamp();report['all_verified']=all(x['status']=='success' for x in report['results']);save()
 print(json.dumps({'report':str(REPORT),'all_verified':report['all_verified'],'counts':report['counts']}))

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--execute',action='store_true');parser.add_argument('--commit',action='append');parser.add_argument('--ci-success',action='store_true');parser.add_argument('--repositories',type=Path,default=REPOSITORIES);parser.add_argument('--freeze-sources',action='store_true');args=parser.parse_args()
 if args.execute:
  assert args.commit and args.ci_success,'Execution requires root-confirmed successful push/CI: --commit FULL_SHA --ci-success'
  execute(read(PLAN),args.commit)
 else:
  plan=prepare(args.repositories.resolve(),args.freeze_sources);write(PLAN,plan)
  write(BASE/'published-download-readback-plan.json',{'status':'SUPERSEDED_DO_NOT_EXECUTE','replacement':'public-download-readback-plan.json','replacement_script':'readback-public-downloads.py','reason':'Previous plan included dataset/document publication copies rejected by official GitLab hosting policy. This pointer deliberately replaces its obsolete URL list.','network_started':False})
  print(json.dumps({'plan':str(PLAN),'counts':plan['counts'],'issues':plan['local_issues']},ensure_ascii=False))
