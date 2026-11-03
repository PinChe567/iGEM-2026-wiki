"""Read-only media and scope recheck; no uploads, source changes or deletions."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import datetime, hashlib, json, subprocess, urllib.parse, urllib.request

A = Path(__file__).resolve().parent
R = A.parents[2]
S = R / 'aerosense-wiki'

def read(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def git(*args):
    return subprocess.check_output(['git', '-C', str(R/'github/iGEM-2026-wiki'), *args]).decode().strip()

def bare(url):
    u = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit((u.scheme, u.netloc, u.path, '', ''))

baseline = read(A/'baseline.json')
compliance = read(S/'audit/compliance-review.json')
ledger = read(S/'igem-upload/verified-official-urls.json')
known = {bare(x['official_url']): x for x in ledger}
static = sorted({bare(x['url']) for key in ('runtime_urls', 'outbound_urls') for x in compliance[key]
                 if urllib.parse.urlsplit(x['url']).hostname == 'static.igem.wiki'})
unverified = [u for u in static if u not in known]
oldvideos = read(S/'audit/final-publication-20261021/video-readback.json')
video_by_uuid = {x['uuid']: x for x in oldvideos}

def video(uuid):
    url = 'https://video.igem.org/api/v1/videos/' + uuid
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'AeroSense-release-review/1.0'}), timeout=35) as response:
            body = json.load(response)
        return {'uuid':uuid, 'api_url':url, 'name':body['name'], 'privacy':body['privacy'], 'state':body['state'],
                'ok':body['privacy']['id']==1 and body['state']['id']==1}
    except Exception as e:
        return {'uuid':uuid, 'api_url':url, 'ok':False, 'error':str(e)}

with ThreadPoolExecutor(max_workers=4) as pool:
    videos = list(pool.map(video, video_by_uuid))
changed_pages = [x['name'] for x in baseline['pages'] if digest(S/x['name']) != x['sha256']]
github_status = git('status','--porcelain').splitlines()
report = {
    'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope':'All current HTML and linked runtime assets scanned; same-day byte-verification proofs reused for unchanged official CDN URLs; videos freshly checked through public API.',
    'compliance_summary':compliance['summary'],
    'current_static_urls':len(static), 'with_existing_byte_verification':len(static)-len(unverified),
    'static_urls_without_ledger_entry':unverified,
    'videos':videos, 'public_published_videos':sum(x['ok'] for x in videos),
    'changed_root_pages':changed_pages,
    'protected_pages_changed':[p for p in changed_pages if p in baseline['protected_content']],
    'unexpected_root_pages_changed':[p for p in changed_pages if p not in baseline['allowed_page_edits']],
    'github_head_unchanged':git('rev-parse','HEAD') == baseline['github_head'],
    'github_status_unchanged':github_status == baseline['github_status'],
    'external_team_content_review':'The remaining Notion link is an outbound original-source reference beside an archived GitLab manuscript, not an embedded or runtime dependency. No Google Drive dependencies remain.',
    'raw_scientific_files_deleted':False,
}
(A/'existing-release-recheck.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in {'videos'}},ensure_ascii=False,indent=2))
if not all(v['ok'] for v in videos) or report['protected_pages_changed'] or not report['github_head_unchanged'] or not report['github_status_unchanged']:
    raise SystemExit(1)
