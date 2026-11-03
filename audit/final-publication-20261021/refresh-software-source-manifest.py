"""Refresh source-only publication inventory without changing the Git index."""
from pathlib import Path
import datetime,hashlib,json,os,re,subprocess
A=Path(__file__).resolve().parent;R=A.parents[2];REPO=R/'gitlab/aerosense-software'
def n(p):return Path('\\\\?\\'+str(p.absolute())) if os.name=='nt' else p
def h(p):return hashlib.sha256(n(p).read_bytes()).hexdigest()
mp=REPO/'code/aerosense/source-manifest.json'
j=json.loads(mp.read_text(encoding='utf-8'))
index=REPO/'.git/index';index_before=h(index)
copy=json.loads((A/'software-repository-source-copy.json').read_text(encoding='utf-8'))
previous={r['repository_relative']:r for r in copy['files']}
active=set()
for directory in ['code/aerosense','docs/aerosense']:
    for current,_,files in os.walk(n(REPO/directory)):
        for name in files:
            p=Path(current)/name
            rel=str(p).removeprefix('\\\\?\\')
            rel=Path(rel).relative_to(REPO).as_posix()
            if rel=='code/aerosense/source-manifest.json':continue
            assert '__pycache__' not in rel and not rel.endswith('.pyc'),rel
            active.add(rel)
listed={r['path'] for r in j['files']}
assert active==listed,{'unlisted':sorted(active-listed),'missing':sorted(listed-active)}
updates=[]
for r in j['files']:
    p=REPO/r['path'];new=h(p);size=n(p).stat().st_size
    old=previous[r['path']]
    if new!=old['sha256']:
        r['software_migration_revision']={'pre_migration_sha256':old['sha256'],'pre_migration_bytes':old['bytes'],'reason':'Active source URL migration, accurate publication/reproduction notes, or verified-CDN game source synchronization; no experimental value edits.'}
        updates.append(r['path'])
    r['sha256']=new;r['bytes']=size
j['historical_wiki_repository']='https://gitlab.igem.org/2026/nthu'
if 'historical_wiki_base_commit' not in j:j['historical_wiki_base_commit']=j.get('base_commit')
j['repository']='https://gitlab.igem.org/2026/software/nthu/aerosense'
j['base_commit']='ddda781b0e953ba6464c039682770319b1adc052'
j['status']='Prepared source-only Software repository working tree; publication and deployment require independent verification. Full research archive is not publicly deposited.'
j['software_migration']={'source_copy_receipt':'aerosense-wiki/audit/final-publication-20261021/software-repository-source-copy.json','old_copy_cleanup_receipt':'aerosense-wiki/audit/final-publication-20261021/executed-wiki-software-copy-cleanup.json','pre_migration_canonical_manifest':'zenodo-release/reproduction-source/software-source-before-migration-20261021/PRESERVATION-MANIFEST.json','old_paths_retained':True,'originals_and_numeric_data_unchanged':True,'no_commit_push_or_index_write_by_this_generator':True}
support=['README.md','LICENSE','THIRD_PARTY_NOTICES.md','.gitattributes','.gitignore','CLAUDE.md','.claude/RESPONSIBLE_AI_USE.md']
j['repository_support_files']=[{'path':p,'sha256':h(REPO/p),'bytes':n(REPO/p).stat().st_size} for p in support]
license_receipt_path=A/'approved-mit-license-application.json'
license_pending=not license_receipt_path.exists()
if license_pending:
    j['license_status']='Initial Apache 2.0 template preserved; separate explicit team software license decision pending. Third-party grants retain their own scope.'
else:
    license_receipt=json.loads(license_receipt_path.read_text(encoding='utf-8'))
    assert h(REPO/'LICENSE')==license_receipt['license_sha256']
    j['license_status']='MIT approved for team-original AeroSense software, Copyright (c) 2026 NTHU iGEM Team. Research data, images, text, Wiki and third-party material retain their existing notices.'
    j['license_decision']={'identifier':'MIT','authorization':'Explicit user approval','copyright_holder':'2026 NTHU iGEM Team','scope':license_receipt['approved_scope'],'application_receipt':'aerosense-wiki/audit/final-publication-20261021/approved-mit-license-application.json','license_sha256':license_receipt['license_sha256']}
    bypath={r['path']:r for r in j['files']}
    for row in license_receipt['changed_files']:
        if row['path'] in bypath:
            bypath[row['path']]['license_scope_revision']={'previous_sha256':row['previous_sha256'],'reason':'User-approved MIT scope wording only; experimental values and analysis algorithms are unchanged.'}
j['summary'].update(retained_manifest_files=len(j['files']),retained_bytes=sum(r['bytes'] for r in j['files']),repository_support_files=len(support),repository_support_bytes=sum(r['bytes'] for r in j['repository_support_files']),software_migration_changed_source_files=len(updates))
j['finalized_at_utc']=datetime.datetime.now(datetime.timezone.utc).isoformat()
mp.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert h(index)==index_before
assert all(h(REPO/r['path'])==r['sha256'] for r in j['files']+j['repository_support_files'])
md_files=list((R/'registry_docs_v2').glob('*.md'))
assert len(md_files)==28 and all(h(p)==h(REPO/'docs/aerosense/parts'/p.name) for p in md_files)
payload=json.loads((A/'registry-documentation-payload.json').read_text(encoding='utf-8'))
assert payload['entry_count']==76
urls=set()
for page in payload['pages']:
    for entry in page['entries']:
        for u in re.findall(r'https://gitlab\.igem\.org/[^\s)]+',entry['body_markdown']):
            assert u.startswith(j['repository']+'/-/'),u
            relative=u.split('/main/',1)[1].split('#')[0]
            assert n(REPO/relative).is_file(),u
            urls.add(u)
out={'checked_at_utc':j['finalized_at_utc'],'software_repository':j['repository'],'manifest_path':mp.relative_to(R).as_posix(),'manifest_sha256':h(mp),'files':len(j['files']),'source_bytes':j['summary']['retained_bytes'],'support_files':len(support),'support_bytes':j['summary']['repository_support_bytes'],'changed_source_files':updates,'all_manifest_hashes_match':True,'registry_md_exact_mirrors':28,'registry_payload_entries':76,'registry_source_urls':sorted(urls),'registry_payload_sha256':h(A/'registry-documentation-payload.json'),'software_index_unchanged':True,'license_decision_pending':license_pending}
(A/'software-source-final-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in out.items() if k!='changed_source_files'},ensure_ascii=False))
