from pathlib import Path
from bs4 import BeautifulSoup
import csv,json,hashlib,re
ROOT=Path(__file__).resolve().parents[3]
PAGE=ROOT/'aerosense-wiki/hardware.html'
BATCH=ROOT/'zenodo-release/aerosense-wiki/data/hardware-confirmed-map-2026-10-21'
text=PAGE.read_text(encoding='utf8');before=hashlib.sha256(PAGE.read_bytes()).hexdigest()
original=BeautifulSoup(text,'html.parser')
def replace_paragraph(prefix,new):
 global text
 soup=BeautifulSoup(text,'html.parser')
 node=next(p for p in soup.find_all('p') if p.get_text().startswith(prefix))
 old=str(node);assert old in text,prefix
 text=text.replace(old,'<p>'+new+'</p>',1)
replace_paragraph('For D1–D4, the matched Pearson',
 'For D1–D4, the matched Pearson correlations are −0.859, +0.972, +0.961 and +0.948; Spearman correlations are −0.80, +0.90, +0.90 and +0.90. The corresponding first-difference correlations are −0.529, +0.650, +0.761 and −0.125. D2 and D3 share positive level and step-to-step trends with their matched wet-lab traces; D1 trends in the opposite direction, while D4 shares less step-to-step variation than its level correlation suggests.')
replace_paragraph('Cross-platform similarity is not specific',
 'Cross-platform similarity is not specific to matched constructs: D2 gives r = 0.9719 with Or85b and 0.9671 with Or98a, and D3 exceeds its strongest off-diagonal match by only 0.0055. D2 and D3 remain positive after omitting the first point (r = 0.970 and 0.904). Control subtraction preserves some shared trends, but preceding hardware-medium readings and separate wet-lab DMSO wells are different references. Serial time points do not establish synchronized kinetics, biological replication or receptor-specific activation.')
rows=list(csv.DictReader((BATCH/'matched-correlations.csv').open(encoding='utf8')))
scenarios=['nominal_native5_selected','nominal_native4_omit19','actual_clock_native6_original19','control_adjusted_native5_selected']
soup=BeautifulSoup(text,'html.parser');table=soup.select_one('#reader-crossplatform-sensitivity table');old=str(table);assert old in text
for index,tr in enumerate(table.tbody.find_all('tr'),1):
    values=[next(r for r in rows if r['channel']==f'D{index}' and r['scenario']==scenario) for scenario in scenarios]
    for td,row in zip(tr.find_all('td'),values):td.string=f"{float(row['pearson_level']):+.3f}"
text=text.replace(old,str(table),1)
links=[]
soup=BeautifulSoup(text,'html.parser')
for tag in soup.find_all(['a','img','source']):
    attr='href' if tag.name=='a' else 'srcset' if tag.name=='source' else 'src'
    url=tag.get(attr,'')
    if not url:continue
    name=None
    if 'matched-curves-mobile' in url:name='figures/matched-curves-mobile-confirmed-map.svg'
    elif 'matched-curves' in url:name='figures/matched-curves-confirmed-map.svg'
    elif 'pairwise-pearson-spearman-mobile' in url or 'pairwise-correlations-mobile' in url:name='figures/pairwise-pearson-spearman-mobile-confirmed-map.svg'
    elif 'pairwise-pearson-spearman' in url or 'pairwise-correlations' in url:name='figures/pairwise-pearson-spearman-confirmed-map.svg'
    else:
        for candidate in ['input-observations.csv','aligned-timepoints.csv','matched-correlations.csv','all-pair-correlations.csv','specificity-summary.csv','descriptive-linear-trends.csv','analysis-summary.json']:
            if url.endswith(candidate):name=candidate;break
    if name:
        target='../zenodo-release/aerosense-wiki/data/hardware-confirmed-map-2026-10-21/'+name
        text=text.replace(url,target)
        if (url,target) not in links:links.append((url,target))
after=BeautifulSoup(text,'html.parser')
assert [p.get('id') for p in original.select('[id]')]==[p.get('id') for p in after.select('[id]')]
assert not any(v in after.get_text() for v in ['−0.942, +0.972, +0.756','D3 falls from r = 0.756 to 0.114'])
PAGE.write_text(text,encoding='utf8')
queue=[]
for name in sorted({target.split('hardware-confirmed-map-2026-10-21/',1)[1] for _,target in links}):
    p=BATCH/name
    remote_name=p.name if p.suffix=='.svg' else p.stem+'-confirmed-map'+p.suffix
    queue.append({'path':str(p.resolve()),'name':remote_name,'placeholder':'../zenodo-release/aerosense-wiki/data/hardware-confirmed-map-2026-10-21/'+name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size})
(BATCH/'official-upload-queue.json').write_text(json.dumps(queue,indent=2)+'\n',encoding='utf8')
(ROOT/'aerosense-wiki/audit/signal-metric-clarification-20261021/confirmed-hardware-html.json').write_text(json.dumps({'before_sha256':before,'after_sha256':hashlib.sha256(PAGE.read_bytes()).hexdigest(),'mapping':['A10','A09','A04','A11'],'links':links,'table_cells_recomputed':4*len(scenarios),'IDs_preserved':True,'upload_assets':len(queue)},indent=2)+'\n',encoding='utf8')
print(json.dumps({'updated':True,'upload_assets':len(queue),'sha256':hashlib.sha256(PAGE.read_bytes()).hexdigest()}))
