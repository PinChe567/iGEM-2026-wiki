from pathlib import Path
from datetime import datetime,timezone
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,urllib.request
ROOT=Path(__file__).resolve().parents[3];AUD=Path(__file__).resolve().parent
BATCH=ROOT/'zenodo-release/aerosense-wiki/data/hardware-confirmed-map-2026-10-21'
queue=json.loads((BATCH/'official-upload-queue.json').read_text(encoding='utf8'))
def sha(data):return hashlib.sha256(data).hexdigest()
def get(row):
    p=Path(row['path']);url='https://static.igem.wiki/teams/6460/wiki/hardware/'+p.name
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'AeroSense-publication-verification'}),timeout=35) as response:
        body=response.read();status=response.status;mime=response.headers.get('Content-Type')
    assert status==200 and sha(body)==row['sha256'],(url,status,sha(body),row['sha256'])
    return {'official_url':url,'source_sha256':row['sha256'],'response_sha256':sha(body),'bytes':len(body),'status':status,'content_type':mime,
            'workspace_source_paths':[p.relative_to(ROOT).as_posix()],'source_paths':[row['placeholder']],
            'verification_grade':'byte_identical_original','verification_policy':'strict-original-full-byte-sha256','verified_at_utc':datetime.now(timezone.utc).isoformat()}
with ThreadPoolExecutor(max_workers=6) as pool:proof=list(pool.map(get,queue))
page=ROOT/'aerosense-wiki/hardware.html';text=page.read_text(encoding='utf8');before=sha(page.read_bytes())
for row in proof:
    for old in row['source_paths']:text=text.replace(old,row['official_url'])
assert '../zenodo-release/aerosense-wiki/data/hardware-confirmed-map' not in text
page.write_text(text,encoding='utf8')
ledger_path=ROOT/'aerosense-wiki/igem-upload/verified-official-urls.json';ledger=json.loads(ledger_path.read_text(encoding='utf8'))
earlier=json.loads((AUD/'verified-pairwise-official-assets.json').read_text(encoding='utf8'))['assets']
for r in earlier:
    proof.append({'official_url':r['url'],'source_sha256':r['sha256'],'response_sha256':r['sha256'],'bytes':r['bytes'],
       'workspace_source_paths':[r['source'].replace('\\','/')],'source_paths':['../'+r['source'].replace('\\','/')],
       'verification_grade':'byte_identical_original','verification_policy':'strict-original-full-byte-sha256; prior full-GET receipt retained','verified_at_utc':datetime.now(timezone.utc).isoformat()})
edu=json.loads((ROOT/'aerosense-wiki/audit/browser-comments-20261021/education-chart-readback.json').read_text(encoding='utf8'))
source='zenodo-release/aerosense-wiki/data/education-learning-comparison-2026-10-21/learning-lab-cohort-comparison.svg'
proof.append({'official_url':edu['official_url'],'source_sha256':edu['sha256'],'response_sha256':edu['sha256'],'bytes':edu['bytes'],'workspace_source_paths':[source],'source_paths':['../'+source],
 'verification_grade':'byte_identical_original','verification_policy':'strict-original-full-byte-sha256; prior full-GET receipt retained','verified_at_utc':datetime.now(timezone.utc).isoformat()})
for r in json.loads((ROOT/'aerosense-wiki/audit/f1-dynamic-20261021/official-figures.json').read_text(encoding='utf8')):
    assert r['full_GET_byte_identical'] and sha((ROOT/r['source']).read_bytes())==r['sha256']
    proof.append({'official_url':r['official_url'],'source_sha256':r['sha256'],'response_sha256':r['sha256'],'bytes':r['bytes'],'workspace_source_paths':[r['source']],'source_paths':['../'+r['source']],
     'verification_grade':'byte_identical_original','verification_policy':'strict-original-full-byte-sha256; producer full-GET receipt retained','verified_at_utc':datetime.now(timezone.utc).isoformat()})
seen={r.get('official_url') for r in ledger}
for row in proof:
    if row['official_url'] not in seen:ledger.append(row);seen.add(row['official_url'])
ledger_path.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(AUD/'confirmed-hardware-cdn-readback.json').write_text(json.dumps({'hardware_assets_checked':len(queue),'assets':proof,'before_html_sha256':before,'after_html_sha256':sha(page.read_bytes()),'ledger_rows':len(ledger)},indent=2)+'\n',encoding='utf8')
print(json.dumps({'hardware_assets_checked':len(queue),'hardware_html_sha256':sha(page.read_bytes()),'ledger_rows':len(ledger)}))
