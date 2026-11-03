"""Read-only publication, Registry and archive audit. Writes only beside this tool."""
from pathlib import Path
from collections import defaultdict, Counter
import argparse, concurrent.futures, csv, datetime, hashlib, json, re, subprocess
import urllib.request, urllib.parse, urllib.error

OUT=Path(__file__).resolve().parent
SITE=OUT.parents[1]
ROOT=SITE.parent
ARCHIVE=ROOT/'zenodo-release'
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()
def js(p): return json.loads(p.read_text(encoding='utf-8'))
def save(name,data): (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def relative(p): return p.relative_to(ROOT).as_posix()
def urlkey(u):
    p=urllib.parse.urlsplit(u)
    return urllib.parse.urlunsplit((p.scheme,p.netloc,p.path,'',''))
def csvrows(p):
    with p.open(encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))

def local_audit():
    inv=js(OUT/'all-assets-inventory.json')
    mappings=js(SITE/'igem-upload/verified-official-urls.json')
    readback=js(SITE/'audit/media-readback.json')
    resources=js(SITE/'audit/resource-upload-receipt.json')['assets']
    byhash=defaultdict(set);byurl=defaultdict(set);bypath=defaultdict(list)
    for m in mappings:
        u=urlkey(m['official_url']);h=m['response_sha256']
        byhash[h].add(u);byurl[u].add(h)
        for p in m['source_paths']:bypath[p].append(m)
    for m in readback['assets']:
        if m.get('ok') and m.get('sha256'):
            u=urlkey(m['url']);byhash[m['sha256']].add(u);byurl[u].add(m['sha256'])
    for m in resources:
        u=urlkey(m['official_url']);byhash[m['response_sha256']].add(u);byurl[u].add(m['response_sha256'])
    local=[];stale=[]
    for a in inv['assets']:
        item={k:a[k] for k in ['paths','extensions','bytes','sha256','referenced_by','kinds']}
        item['verified_byte_identical_candidates']=sorted(byhash[a['sha256']])
        item['status']='already mapped identical bytes' if item['verified_byte_identical_candidates'] else 'no verified identical official mapping'
        local.append(item)
        for p in a['paths']:
            for m in bypath[p]:
                if a['sha256'] not in [m.get('source_sha256'),m.get('response_sha256')]:
                    stale.append({'path':p,'current_sha256':a['sha256'],'old_official_url':m['official_url'],'old_response_sha256':m['response_sha256']})
    external=inv['summary']['external_sources']
    official={urlkey(a['url']) for a in external if urllib.parse.urlsplit(a['url']).hostname=='static.igem.wiki'}
    svg=[a for a in local if 'svg' in a['extensions']]
    download=[a for a in local if set(a['extensions'])&{'zip','xlsx','pdf','docx'}]
    vendor=[a for a in local if any('/vendor/' in p or p.startswith('js/vendor/') for p in a['paths'])]
    source_external=[]
    for p in SITE.rglob('*'):
        if not p.is_file() or p.suffix not in {'.html','.css','.js','.json','.mjs'} or any(s in p.parts for s in ('node_modules','audit','igem-upload','.git')):continue
        t=p.read_text(encoding='utf-8',errors='replace')
        for u in re.findall(r'https?://[^\s<>"\x27)]+',t):
            if re.search(r'(?:drive|docs)\.google\.com|fonts\.(?:googleapis|gstatic)\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.',u):
                source_external.append({'file':p.relative_to(SITE).as_posix(),'url':u,'in_live_dependency_graph':any(p.relative_to(SITE).as_posix() in a['paths'] for a in local)})
    report={'checked_at_utc':now(),'local_paths':inv['summary']['linked_paths'],'unique_local_files':len(local),'local_unique_bytes':sum(a['bytes'] for a in local),
      'static_svg_upload_queue':svg,'static_svg_upload_count':len(svg),'download_candidates':download,'vendor_dependencies':vendor,
      'local_fonts': [a for a in local if set(a['extensions'])&{'woff','woff2','ttf','otf'}],
      'local_gifs':[a for a in local if 'gif' in a['extensions']],
      'local_runtime_videos':inv['summary']['local_videos_for_video_universe'],'official_static_urls':len(official),
      'official_urls_with_prior_verified_hash':sum(bool(byurl[u]) for u in official),'known_hash_conflicts':{u:sorted(h) for u,h in byurl.items() if len(h)>1},
      'official_http_candidates':[{'url':u,'expected_sha256':sorted(byurl[u])} for u in sorted(official)],
      'stale_local_path_mappings':stale,'google_drive_runtime_links':[e for e in external if re.search(r'(?:drive|docs)\.google\.com',e['url'])],
      'external_source_only_findings':source_external,'all_local_assets':local,
      'dynamic_coverage':inv['summary']['dynamic_families'],'unresolved_templates':inv['summary']['unresolved_template_literals'],
      'missing_explicit_references':inv['summary']['missing_explicit_references'],
      'notes':['All 337 dependencies include HTML, first-party CSS/JS and data; they are not all media-upload candidates.',
               'The two my-cnd-server.com URLs are GLTFLoader documentation examples, not runtime destinations.',
               'PDF.js is vendored locally. No wasmUrl/cMapUrl/standardFontDataUrl is configured; optional decoder/font assets are not present in the graph. Current PDF runtime rendering must be checked rather than assuming all optional formats work.',
               'Existing upload tooling is inventory/readback tooling, not an authenticated uploader. Official upload receipts and hash mappings are retained. Root owns authenticated UI.',
               'No website rewrite, remote upload, deletion, commit or push performed.']}
    save('media-publication-audit.json',report)
    return report

def archive_audit():
    rows=csvrows(ARCHIVE/'manifest.csv');dest={r['destination_relative']:r for r in rows}
    missing=[];size=[];byhash=defaultdict(list)
    for rel,r in dest.items():
        p=ARCHIVE/rel
        if not p.is_file():missing.append(rel)
        elif p.stat().st_size!=int(r['bytes']):size.append({'file':rel,'expected':int(r['bytes']),'actual':p.stat().st_size})
        byhash[r['sha256']].append(p)
    new=[]
    for batch in ['odor-2026-10-21','hardware-test3-2026-10-21']:
        for p in (ARCHIVE/'aerosense-wiki/data'/batch).rglob('*'):
            if not p.is_file() or '__pycache__' in p.parts:continue
            rel=p.relative_to(ARCHIVE).as_posix();r=dest.get(rel)
            new.append({'file':rel,'bytes':p.stat().st_size,'sha256':digest(p),'in_main_manifest':r is not None,'manifest_hash_matches':bool(r and r['sha256']==digest(p))})
    candidates=[];unmatched=[]
    for dirname in ['hardware_test','hardware_test2','hardware_test3']:
        for p in (ROOT/dirname).rglob('*'):
            if not p.is_file():continue
            h=digest(p);matches=[]
            for canonical in byhash[h]:
                if canonical.is_file() and canonical.stat().st_size==p.stat().st_size and digest(canonical)==h:matches.append(relative(canonical))
            item={'source':relative(p),'bytes':p.stat().st_size,'sha256':h,'canonical_matches':matches}
            (candidates if matches else unmatched).append(item)
    video_ext={'.mp4','.webm','.avi','.mov','.m4v'}
    video=[]
    for tree in [SITE,ARCHIVE]:
        for p in tree.rglob('*'):
            if p.is_file() and p.suffix.lower() in video_ext and not any(s in p.parts for s in ['node_modules','.git']):
                video.append({'file':relative(p),'bytes':p.stat().st_size,'preserve':p.suffix.lower()=='.avi','role':'raw original; explicitly retained' if p.suffix.lower()=='.avi' else 'not automatically disposable; inspect role and official counterpart'})
    manifest=js(ROOT/'gitlab/nthu/code/aerosense/source-manifest.json')
    git_sources={item.get('source','') for item in manifest['files']}
    new_code=[]
    for r in new:
        if r['file'].endswith('.py'):
            name='zenodo-release/'+r['file']
            new_code.append({'canonical':name,'sha256':r['sha256'],'listed_in_gitlab_source_manifest':name in git_sources})
    report={'checked_at_utc':now(),'main_manifest_source_rows':len(rows),'canonical_destinations':len(dest),'manifest_bytes':sum(int(r['bytes']) for r in dest.values()),'missing_canonical_files':missing,'size_mismatches':size,
      'verification_scope':'Existence and byte length for entire main manifest; full SHA only for current odor/hardware batches and duplicate candidates. Not a new full 25 GB hash pass.',
      'current_batches':new,'current_batch_files':len(new),'current_batch_manifest_mismatches':[r for r in new if not r['manifest_hash_matches']],
      'hash_verified_root_duplicate_candidates':candidates,'candidate_count':len(candidates),'candidate_bytes':sum(r['bytes'] for r in candidates),'unmatched_root_files':unmatched,
      'remaining_local_videos':video,'raw_avi_count':sum(r['preserve'] for r in video),
      'new_analysis_code_gitlab_coverage':new_code,
      'protected_paths':['github/','aerosense-wiki/','gitlab/nthu/.git/','gitlab/local-only/','zenodo-release/ canonical raw and provenance','registry_docs_v2/ intended submission package'],
      'legacy_cleanup_targets_current_presence':{s:(ROOT/s).exists() for s in ['Workshop.pdf','education fig','.package-review-work','odor']},
      'cleanup_policy':'Candidates only; no deletions. Recheck absolute paths, reparse points, hashes and canonical survival immediately before any later approved cleanup. Keep source-conflict/revision evidence and all seven raw AVI.',
      'reproduction_limits':['PN-KC-MBON matching training engine/preprocessing/folds/seeds absent per PENDING.txt.','Full receptor MD trajectories/checkpoints/topologies/third-party weights and Gaussian logs were not provided.','GH146 run02 has ROI/AVI but incomplete original TIFF/settings.','Third-party full texts and identified local-only feedback are not automatically authorized for public redistribution.','Older PENDING.txt media/cleanup statements include superseded statuses; audit current files and latest handoff.']}
    save('archive-cleanup-audit.json',report)
    return report

def registry_audit():
    docs=ROOT/'registry_docs_v2';parts=[];assets={}
    for p in sorted(docs.glob('BBa_*.md')):
        t=p.read_text(encoding='utf-8');part=p.name.split('__')[0];slug=part.lower().replace('_','-')
        parts.append({'file':relative(p),'part_id':part,'slug':slug,'url':'https://registry.igem.org/parts/'+slug,'api':'https://api.registry.igem.org/v1/parts/slugs/'+slug,'entries':t.count('ENTRY · Type:'),'sha256':digest(p)})
    for p in docs.glob('*.md'):
        for raw in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
            if '://' in raw or raw.startswith('#'):continue
            q=docs/raw.split('#')[0]
            if q.is_file() and q.suffix.lower()=='.svg':assets[q.relative_to(docs).as_posix()]={'path':relative(q),'sha256':digest(q),'bytes':q.stat().st_size}
    report={'checked_at_utc':now(),'markdown_files':len(list(docs.glob('*.md'))),'parts':parts,'part_count':len(parts),'part_entries':sum(p['entries'] for p in parts),'collection_entries':(docs/'00_COLLECTION.md').read_text(encoding='utf-8').count('ENTRY · Type:'),'collection_title':'Drosophila odorant receptor calcium-reporter platform','saved_NTHU_collection_id':None,'local_svg_attachments':list(assets.values()),'local_svg_count':len(assets),
      'account_context':'No authentication/session inspected. Historical19October public API audit found all25 parts published. Local index/form authorization restrictions predate and are superseded by the latest explicit user request.',
      'publication_workflow':'No Registry uploader found. integrate_odor_2026_10_21.py and integrate_disturbance_characterisation.py are local generators only. Root will inspect existing online documentation to avoid duplicate entries and publish using authenticated UI.',
      'relative_link_warning':'Local SVG, CSV and Markdown references must become verified official public URLs or Registry attachments; do not paste local provenance paths as downloadable links.'}
    save('registry-publication-audit.json',report)
    return report

def fetch(item):
    u=item['url'];result={'url':u,'checked_at_utc':now()}
    try:
        req=urllib.request.Request(u,headers={'User-Agent':'AeroSense-readonly-release-audit/1.0'})
        with urllib.request.urlopen(req,timeout=45) as response:
            h=hashlib.sha256();n=0
            for b in iter(lambda:response.read(1024*1024),b''):h.update(b);n+=len(b)
            result.update(status=response.status,bytes=n,sha256=h.hexdigest(),final_url=response.url,content_type=response.headers.get('Content-Type',''))
        expected=item.get('expected_sha256',[])
        result['expected_sha256']=expected
        result['ok']=result['status']==200 and result['bytes']>0 and urllib.parse.urlsplit(result['final_url']).hostname=='static.igem.wiki' and (not expected or result['sha256'] in expected)
        result['hash_verified']=bool(expected) and result['sha256'] in expected
    except Exception as e:result.update(ok=False,error=str(e))
    return result

def http_audit():
    report=js(OUT/'media-publication-audit.json');items=report['official_http_candidates'];results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
        for future in concurrent.futures.as_completed([ex.submit(fetch,item) for item in items]):
            results.append(future.result())
            if len(results)%100==0:print('Official full-byte readback',len(results),'/',len(items),flush=True)
    data={'checked_at_utc':now(),'method':'Anonymous HTTPS full GET and streaming SHA-256; no login or files downloaded to disk. No remote writes.','total':len(results),'passed':sum(r['ok'] for r in results),'hash_verified':sum(r.get('hash_verified',False) for r in results),'failed':[r for r in results if not r['ok']],'assets':sorted(results,key=lambda r:r['url'])}
    save('official-readback.json',data)
    print(json.dumps({k:data[k] for k in ['total','passed','hash_verified','failed']},ensure_ascii=False),flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--http-only',action='store_true');a=p.parse_args()
    if a.http_only:http_audit()
    else:
        m=local_audit();z=archive_audit();r=registry_audit()
        print(json.dumps({'local_paths':m['local_paths'],'svg_uploads':m['static_svg_upload_count'],'canonical_files':z['canonical_destinations'],'batch_files':z['current_batch_files'],'batch_mismatches':len(z['current_batch_manifest_mismatches']),'cleanup_candidates':z['candidate_count'],'unmatched_sources':len(z['unmatched_root_files']),'raw_avi':z['raw_avi_count'],'registry_parts':r['part_count'],'registry_entries':r['part_entries']+r['collection_entries'],'registry_local_svgs':r['local_svg_count']},indent=2))
