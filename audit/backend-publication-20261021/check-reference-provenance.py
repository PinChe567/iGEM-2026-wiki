"""Tie every P2 vector to its canonical table; inspect the four cited DoOR units."""
from pathlib import Path
import csv, datetime, hashlib, json, urllib.request
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup
OUT=Path(__file__).resolve().parent;WORK=OUT.parents[2]
reference=WORK/'zenodo-release/reproduction-source/hardware-odor-backend-20261021/source/analysis/odor_reference.json'
data=json.loads(reference.read_text(encoding='utf-8'))
source=WORK/'zenodo-release/aerosense-wiki/reproduction-source/eNose-feature-igem/analysis/06_odorant_receptor_dF_corr.csv'
assert hashlib.sha256(source.read_bytes()).hexdigest()==data['source']['sha256']
rows={r['compound']:r for r in csv.DictReader(source.open(encoding='utf-8-sig',newline=''))}
p2=[]
for row in data['odors']+data['controls']:
    for receptor,value in zip(data['receptorOrder'],row['values']):
        p2.append({'compound':row['compound'],'receptor':receptor,'value':value,'canonical_value':float(rows[row['compound']][receptor]),'exact':value==float(rows[row['compound']][receptor])})
assert all(x['exact'] for x in p2)
def inspect(receptor):
    url='https://neuro.uni-konstanz.de/DoOR/content/receptor.php?OR='+receptor
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'AeroSense-reference-provenance-review/1.0'})
        with urllib.request.urlopen(req,timeout=20) as response: raw=response.read();status=response.status
        soup=BeautifulSoup(raw,'html.parser');found={}
        for tr in soup.select('tr'):
            cells=[c.get_text(' ',strip=True) for c in tr.find_all('td')]
            if len(cells)>=4 and cells[0] in ('3-octanol','benzaldehyde','2-heptanone','pentanoic acid'):
                found[cells[0]]=float(cells[-1])
        comparisons=[]
        for row in data['literatureReference']['odors']:
            name='pentanoic acid' if row['compound']=='valeric acid' else row['compound']
            expected=row['values'][data['receptorOrder'].index(receptor)]
            comparisons.append({'compound':row['compound'],'expected':expected,'observed':found.get(name),'exact':found.get(name)==expected})
        return {'url':url,'status':status,'page_sha256':hashlib.sha256(raw).hexdigest(),'comparisons':comparisons,'all_exact':all(c['exact'] for c in comparisons)}
    except Exception as error:return {'url':url,'status':'not verified','error':type(error).__name__+': '+str(error)}
with ThreadPoolExecutor(max_workers=3) as pool: literature=list(pool.map(inspect,data['receptorOrder']))
report={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'P2_source_sha256':data['source']['sha256'],'P2_values_checked':len(p2),'P2_all_exact':True,'P2_comparisons':p2,'DoOR':literature,'reference_unchanged':hashlib.sha256(reference.read_bytes()).hexdigest()=='4257e93ba2aee8e255e30461a69c781338f8b5d62bb0d5bc097bd92c3a310c77','interpretation':'Matching source numbers verifies transcription, not transferability to HEK hardware or odor identification.'}
(OUT/'reference-provenance-qa.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'P2':len(p2),'DoOR_units':len(literature),'DoOR_units_exact':sum(r.get('all_exact',False) for r in literature),'DoOR_not_verified':[r for r in literature if not r.get('all_exact',False)]},indent=2))
