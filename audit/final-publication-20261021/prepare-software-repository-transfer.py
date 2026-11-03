"""Prepare a source-only transfer inventory; never copy, delete, stage, or push."""
from pathlib import Path
import hashlib,json,datetime,re,os,stat,collections
A=Path(__file__).resolve().parent;R=A.parents[2];REPO=R/'gitlab/nthu'
def native(p):return Path('\\\\?\\'+str(p.absolute())) if os.name=='nt' else p
def sha(p):return hashlib.sha256(native(p).read_bytes()).hexdigest()
manifest_path=REPO/'code/aerosense/source-manifest.json';m=json.loads(manifest_path.read_text(encoding='utf-8'))
files=[]
for source in [*m['files'],{'path':'code/aerosense/source-manifest.json','sha256':sha(manifest_path),'bytes':manifest_path.stat().st_size}]:
    p=REPO/source['path'];assert source['path'].startswith(('code/aerosense/','docs/aerosense/'))
    assert native(p).is_file() and sha(p)==source['sha256'] and native(p).stat().st_size==source['bytes'],p
    assert p.resolve()==p
    for parent in (p,*p.parents):
        assert not (getattr(native(parent).lstat(),'st_file_attributes',0)&stat.FILE_ATTRIBUTE_REPARSE_POINT),parent
        if parent==R:break
    files.append({'source_absolute':str(p),'source_repository_relative':source['path'],'destination_repository_relative':source['path'],'sha256_before_transfer':source['sha256'],'bytes':source['bytes'],'scope':'approved editable source or Markdown; manifest is publication metadata'})
references=[]
scan_roots=[R/'aerosense-wiki',R/'registry_docs_v2',REPO/'code/aerosense',REPO/'docs/aerosense']
rx=re.compile(r'https://gitlab\.igem\.org/2026/nthu/-/(?:blob|raw|tree)/main/(?:code/aerosense|docs/aerosense)[^\s<>\)\]"\x27]*')
for base in scan_roots:
    for current,dirs,names in os.walk(native(base)):
        dirs[:]=[d for d in dirs if d not in {'node_modules','.git','audit','dist','__pycache__','build'}]
        for name in names:
            p=Path(str(Path(current)/name).removeprefix('\\\\?\\'))
            if p.suffix.lower() not in {'.md','.html','.js','.ts','.json','.py','.txt','.cjs','.mjs','.css'} or p.name in {'package-lock.json','source-manifest.json'}:continue
            text=native(p).read_text(encoding='utf-8',errors='replace')
            found=collections.Counter(rx.findall(text))
            for url,count in found.items():references.append({'file':p.relative_to(R).as_posix(),'old_url':url,'occurrences':count,'route_rule':'Replace only repository prefix after the new official software URL is confirmed; keep branch and path. Leave wiki site/ci URLs unchanged.'})
license_evidence=[]
for rel,scope,finding in [
 ('gitlab/nthu/LICENSE','wiki','CC BY 4.0; not a separately recorded team-software OSI license.'),
 ('gitlab/nthu/code/aerosense/hardware/03_software/README.md','team hardware','Instruction to preserve wiki LICENSE; no separate MIT/Apache/GPL grant.'),
 ('gitlab/nthu/code/aerosense/education/odor-pixel-suite/docs/education-games/README.md','team games','Explicitly says reuse and redistribution terms have not been separately specified.'),
 ('gitlab/nthu/code/aerosense/wetlab/reproduction-readme.txt','team research analysis','Final license and publication metadata remain to be confirmed.'),
 ('gitlab/nthu/code/aerosense/receptor-engineering/vendor/openpom_5434c4b7bade/LICENSE','third party OpenPOM','MIT, copyright Aryan Amit Barsainyan; applies to supplied third-party software.'),
 ('gitlab/nthu/code/aerosense/receptor-engineering/tools/USalign/LICENSE','third party US-align','Specific permission notice and citation requirements; no claim that this licenses team-authored code.'),
 ('gitlab/nthu/code/aerosense/visualization/aerosense-wiki/js/vendor/LICENSE.three.js.txt','third party Three.js','MIT; retain its own notice.'),
 ('gitlab/nthu/code/aerosense/visualization/aerosense-wiki/assets/licenses/thinking-orbs.txt','third party thinking-orbs','MIT, copyright Jakub Antalik; not a team-original grant.')]:
    p=R/rel;license_evidence.append({'path':rel,'scope':scope,'finding':finding,'sha256':sha(p),'bytes':p.stat().st_size})
packages=[]
for row in m['files']:
    if row['path'].endswith('package.json'):
        d=json.loads((REPO/row['path']).read_text(encoding='utf-8'))
        packages.append({'path':row['path'],'name':d.get('name'),'license':d.get('license'),'sha256':sha(REPO/row['path'])})
license_report={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'read_only':True,'team_osi_license_found':False,'team_license_applied':False,'conclusion':'No separately specified team-origin MIT, Apache, GPL, or other explicit OSI software grant was found in the retained source, package metadata or inspected source-archive LICENSE/README records. User must decide the team software license; third-party notices remain scoped to their components.','evidence':license_evidence,'package_metadata':packages,'source_archive_review':'source-archive-license-readonly-audit.json','scope_limit':'No legal compatibility opinion or relicensing performed; no dataset contents scanned for licensing.'}
(A/'team-software-license-readonly-audit.json').write_text(json.dumps(license_report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
plan={'prepared_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PLAN ONLY: no transfer, deletion, stage or push performed. Wait for confirmed software checkout and user-selected team license.','current_wiki_repository':str(REPO),'requested_software_repository':'https://gitlab.igem.org/2026/software/nthu/aerosense','confirmed_software_repository':None,'destination_checkout':None,'layout':'Retain code/aerosense/ and docs/aerosense/ relative layout to preserve internal source relationships; root README and license are separately prepared after confirmation.','source_manifest_sha256':sha(manifest_path),'source_files_excluding_manifest':len(m['files']),'file_count_including_manifest':len(files),'total_bytes_including_manifest':sum(r['bytes'] for r in files),'files':files,'route_updates':references,'route_update_file_count':len(set(x['file'] for x in references)),'route_update_occurrences':sum(x['occurrences'] for x in references),'execution_order':['Confirm the official software project URL and resolved local checkout; preserve both .git directories.','Wait for explicit user selection of a team software license; keep third-party licenses separately scoped.','Copy only the listed 1,219 source files plus source-manifest to a clean destination, rejecting reparse points and unexpected collisions; compare every destination SHA to this plan.','Update only code/docs repository URL routes, source-manifest provenance and publication verifiers. Preserve wiki URLs for site/ci and official CDN URLs for assets.','Replace software README references that assume the wiki site or CI is in the same repository with explicit wiki links; preserve scientific method content and original source versions.','Regenerate manifest from final source content and verify no excluded research dataset/binary or generated cache has entered the source selection.','Preserve latest publication source/Registry snapshot canonically without identical duplicates, as coordinated with archive owner.','Only after verified destination and root authorization, remove old code/docs publication copies from wiki checkout using an explicit file plan. Do not move/delete .git, local-only, github, raw archive, AVI or MP4.','Root owns staging, commits and pushes; do not push previously rejected history.'],'excluded_from_transfer':['550 already-removed copied archives/documents/static media/datasets','2 ignored generated .pyc caches','site/ and ci/ remain in wiki project','original wiki LICENSE remains unchanged','github/ remains untouched','gitlab/local-only/ and all .git internals','canonical Zenodo raw data and 7 AVI/3 MP4'],'pending_decisions':['Confirmed software repository and checkout path','Team software license chosen by user','Final source/code URL routing activation after official repository exists']}
(A/'software-repository-source-transfer-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:plan[k] for k in ['source_files_excluding_manifest','file_count_including_manifest','total_bytes_including_manifest','route_update_file_count','route_update_occurrences','status']},ensure_ascii=False))
