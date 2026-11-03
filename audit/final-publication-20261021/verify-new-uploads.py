"""Anonymous, full-byte verification followed by additive local receipts only."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse,datetime,hashlib,json,urllib.request
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[2]
parser=argparse.ArgumentParser()
parser.add_argument('--queue',default='official-upload-queue.json')
parser.add_argument('--report-prefix',default='new-svg')
parser.add_argument('--report-dir',type=Path,help='Existing audit folder for verification receipts')
parser.add_argument('--allow-partial',action='store_true',help='Verify observed URLs only, retaining all pending rows and concurrent queue updates')
args=parser.parse_args()
REPORT=args.report_dir.resolve() if args.report_dir else OUT
assert REPORT.is_dir()
QUEUE=OUT/args.queue
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def fetch(q):
    r={'official_url':q['official_url'],'source_sha256':q['sha256'],'source_paths':q['source_paths'],'checked_at_utc':now()}
    try:
        with urllib.request.urlopen(urllib.request.Request(q['official_url'],headers={'User-Agent':'AeroSense-publication-readback/1.0'}),timeout=45) as response:
            data=response.read();r.update(status=response.status,final_url=response.url,bytes=len(data),response_sha256=hashlib.sha256(data).hexdigest())
        r['ok']=r['status']==200 and r['response_sha256']==q['sha256'] and r['bytes']==q['bytes'] and all(sha(ROOT/p)==q['sha256'] for p in q['source_paths'])
    except Exception as e:r.update(ok=False,error=str(e))
    return r
q=json.loads(QUEUE.read_text(encoding='utf-8'))
items=[item for item in q['queue'] if item.get('official_url')] if args.allow_partial else q['queue']
assert items and all(item.get('official_url') for item in items),'No observed URL or incomplete queue; use --allow-partial for a partial readback'
with ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(fetch,items))
report={'checked_at_utc':now(),'method':'Anonymous full HTTPS GET, SHA-256 and byte-length comparison with each current source; no remote writes.','queue_total':len(q['queue']),'observed_url_count':len(items),'pending_count':len(q['queue'])-len(items),'count':len(results),'passed':sum(r['ok'] for r in results),'results':results}
(REPORT/(args.report_prefix+'-readback.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert all(r['ok'] for r in results),report
receipt=ROOT/'aerosense-wiki/igem-upload/verified-official-urls.json'
records=json.loads(receipt.read_text(encoding='utf-8'));known={(r['official_url'],r['source_sha256']) for r in records}
updates=[]
for r in results:
    paths=[p.removeprefix('aerosense-wiki/') if p.startswith('aerosense-wiki/') else '../'+p for p in r['source_paths']]
    item={'source_paths':paths,'official_url':r['official_url'],'source_sha256':r['source_sha256'],'verification_grade':'byte_identical_original','response_sha256':r['response_sha256'],'verified_at_utc':r['checked_at_utc'],'verification_policy':'strict-original-full-byte-sha256','workspace_source_paths':r['source_paths']}
    if (item['official_url'],item['source_sha256']) not in known:records.append(item)
    updates.append(item)
receipt.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(REPORT/('verified-'+args.report_prefix+'-mapping.json')).write_text(json.dumps({'verified_at_utc':now(),'count':len(updates),'mappings':updates},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
q=json.loads(QUEUE.read_text(encoding='utf-8'))
results_by_hash={r['source_sha256']:r for r in results}
for item in q['queue']:
    if item['sha256'] in results_by_hash:
        item['verification_status']='full-byte SHA-256 verified on official iGEM CDN'
        item['verified_at_utc']=results_by_hash[item['sha256']]['checked_at_utc']
q['status']='uploaded and full-byte SHA-256 verified on official iGEM CDN' if all(item.get('verification_status') for item in q['queue']) else 'partially verified; unresolved or unsupported rows retained'
q['verified_at_utc']=now()
QUEUE.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'verified':len(results),'receipt_total':len(records),'failed':0}))
