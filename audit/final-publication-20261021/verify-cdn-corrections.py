"""Read back browser-observed official attachment URLs, retaining hashes only."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import argparse, hashlib, json, urllib.request
OUT=Path(__file__).resolve().parent
SITE=OUT.parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--stem',default='cdn-corrections')
stem=parser.parse_args().stem
assert '/' not in stem and '\\' not in stem
rows=json.loads((OUT/(stem+'-observed-urls.json')).read_text(encoding='utf-8'))['files']
def check(row):
    assert row['official_url'].startswith('https://static.igem.wiki/teams/6460/wiki/')
    try:
        with urllib.request.urlopen(row['official_url'],timeout=40) as response:
            body=response.read(); final=response.url; status=response.status
        sha=hashlib.sha256(body).hexdigest()
        return {**row,'response_status':status,'response_url':final,'response_bytes':len(body),'response_sha256':sha,'verified':status==200 and len(body)==row['bytes'] and sha==row['sha256']}
    except Exception as error: return {**row,'verified':False,'error':str(error)}
with ThreadPoolExecutor(max_workers=4) as pool: checked=list(pool.map(check,rows))
now=datetime.now(timezone.utc).isoformat()
report={'checked_at_utc':now,'checked':len(checked),'passed':sum(r['verified'] for r in checked),'failed':sum(not r['verified'] for r in checked),'files':checked}
(OUT/(stem+'-readback.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
verified=[r for r in checked if r['verified']]
(OUT/('verified-'+stem+'-mapping.json')).write_text(json.dumps({'verified_at_utc':now,'files':verified},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
ledger=SITE/'igem-upload/verified-official-urls.json'
existing=json.loads(ledger.read_text(encoding='utf-8'))
for r in verified:
    if any(x['official_url']==r['official_url'] and x.get('source_sha256')==r['sha256'] for x in existing): continue
    existing.append({'source_paths':r['local_paths'],'official_url':r['official_url'],'source_sha256':r['sha256'],'response_sha256':r['response_sha256'],'verification_grade':'byte_identical_static_figure_attachment','verified_at_utc':now,'verification_policy':'Full anonymous GET; exact original bytes; no new image/data transformation'})
ledger.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='files'},indent=2))
raise SystemExit(1 if report['failed'] else 0)
