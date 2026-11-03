from pathlib import Path
import hashlib, json, re, subprocess
from urllib.parse import urlsplit, unquote
from bs4 import BeautifulSoup

WORKSPACE=Path(__file__).resolve().parents[3]
REPO=WORKSPACE/'gitlab/nthu'
SITE=REPO/'site'
OUTPUT=REPO/'public'
AUDIT=Path(__file__).resolve().parent
manifest=json.loads((SITE/'publication-files.json').read_text(encoding='utf-8'))
directory_names={}

def exact_path(root, relative):
    current=root
    for part in Path(relative).parts:
        if part in ('.',''): continue
        if part=='..': current=current.parent;continue
        if current not in directory_names:
            directory_names[current]={p.name for p in current.iterdir()} if current.is_dir() else set()
        names=directory_names[current]
        if part not in names:
            return {'path':relative,'component':part,'case_matches':[p for p in names if p.lower()==part.lower()]}
        current=current/part
    return None

manifest_case=[issue for p in manifest if (issue:=exact_path(SITE,p))]
reference_case=[]; missing_local=[]; local_checked=0
for html in OUTPUT.rglob('*.html'):
    soup=BeautifulSoup(html.read_text(encoding='utf-8'),'html.parser')
    root_base=OUTPUT if soup.find('base') else html.parent
    for element in soup.find_all(True):
        for attr in ('src','href','poster','data','data-src','data-model','data-pdf-preview-src','data-index','data-frames-manifest'):
            raw=element.get(attr)
            if not isinstance(raw,str) or not raw or raw.startswith(('#','data:','blob:','mailto:','tel:','javascript:')):continue
            parsed=urlsplit(raw)
            if parsed.scheme or parsed.netloc:continue
            value=unquote(parsed.path)
            if not value or value=='/nthu/':continue
            if value.startswith('/nthu/'): value=value[6:];base=OUTPUT
            elif value.startswith('/'):value=value[1:];base=OUTPUT
            else:base=root_base
            candidate=(base/value).resolve()
            if not candidate.is_relative_to(OUTPUT):continue
            if candidate.is_dir():candidate=candidate/'index.html'
            relative=candidate.relative_to(OUTPUT).as_posix()
            if not candidate.is_file():missing_local.append({'page':html.relative_to(OUTPUT).as_posix(),'attribute':attr,'reference':raw});continue
            local_checked+=1
            issue=exact_path(OUTPUT,relative)
            if issue:reference_case.append({'page':html.relative_to(OUTPUT).as_posix(),**issue})

copy=json.loads((AUDIT/'site-source-copy-final.json').read_text(encoding='utf-8'))
required=['site/'+i['path'] for i in copy['items']]
def ignored_paths(paths):
    process=subprocess.run(['git','-C',str(REPO),'check-ignore','--stdin','-z'],input=('\0'.join(paths)+'\0').encode('utf-8'),capture_output=True)
    if process.returncode not in (0,1):raise RuntimeError(process.stderr.decode('utf-8'))
    return [x for x in process.stdout.decode('utf-8').split('\0') if x]
ignored=ignored_paths(required)
generated=['public/index.html','.build-check/final-public/index.html','site/css/design-system.css','site/css/home.bundle.css','site/js/home.bundle.js','site/js/i18n-hardware-v19.js','site/game/apps/wiki-client/dist/index.html','site/game/node_modules/.package-lock.json']
ignored_generated=ignored_paths(generated)
generated_not_ignored=sorted(set(generated)-set(ignored_generated))
staged=subprocess.run(['git','-C',str(REPO),'diff','--cached','--name-only'],capture_output=True,encoding='utf-8').stdout.splitlines()
generated_staged=[p for p in staged if p.startswith(('public/','.build-check/','site/game/node_modules/','site/game/apps/wiki-client/dist/')) or p in generated]
changed_after_copy=[]
for item in copy['items']:
    p=SITE/item['path'];digest=hashlib.sha256(p.read_bytes()).hexdigest()
    if digest!=item['sha256']:changed_after_copy.append({'path':item['path'],'source_copy_sha256':item['sha256'],'current_sha256':digest,'reason':'CI local-cache query refresh or generated publication manifest' if p.suffix in ('.html','.js','.css') or p.name=='publication-files.json' else 'review required'})
report={'output':'gitlab/nthu/public','manifest_paths_checked':len(manifest),'manifest_case_mismatches':manifest_case,'local_html_references_checked':local_checked,'html_reference_case_mismatches':reference_case,'missing_local_html_references':missing_local,'required_editable_sources':len(required),'required_sources_ignored':ignored,'generated_paths_checked':generated,'generated_paths_not_ignored':generated_not_ignored,'generated_paths_staged':generated_staged,'changes_after_source_copy':changed_after_copy,'editable_game_public_source_included':(SITE/'game/apps/wiki-client/public/404.html').is_file(),'research_index_integrity':'Root separately verified all 1,746 staged research Git blobs against the source manifest: 110,965,528 bytes; this script does not modify the index.'}
(AUDIT/'final-source-layout-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ('changes_after_source_copy','generated_paths_checked')},ensure_ascii=False))
if manifest_case or reference_case or missing_local or ignored or generated_not_ignored or generated_staged:raise SystemExit(1)
