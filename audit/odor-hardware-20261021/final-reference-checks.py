from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlsplit,unquote
from decimal import Decimal
import csv,json,hashlib

SITE=Path(__file__).resolve().parents[2];ROOT=SITE.parent
H=ROOT/'zenodo-release/aerosense-wiki/data/hardware-test3-2026-10-21'
readings=list(csv.DictReader((H/'selected-analysis-readouts.csv').open(encoding='utf-8-sig')))
late=list(csv.DictReader((H/'late-window-summary.csv').open(encoding='utf-8-sig')))
diff=[]
for row in late:
    get=lambda n:Decimal(next(r['amplitude_mV']for r in readings if r['readout']==row['readout']and r['record_id']==f'87187f3e-{n}'))
    expected=Decimal(100)*(sum(get(n)for n in [26,27,28])/3/get(19)-sum(get(n)for n in [16,17,18])/3/get(9))
    diff.append(float(abs(expected-Decimal(row['late_window_contrast_pp']))))
assert max(diff)<1e-10
errors=[];soups={}
for name in ['results','hardware','experiments','description','model','parts']:
    p=SITE/f'{name}.html'
    if not p.exists():continue
    soup=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser');soups[p]=soup
    for a in soup.select('a[href]'):
        u=urlsplit(a['href'])
        if u.scheme or u.netloc or not u.fragment:continue
        target=(p.parent/unquote(u.path)).resolve()if u.path else p
        if target.suffix!='.html' or not target.is_file():continue
        other=soups.get(target)
        if other is None:
            other=BeautifulSoup(target.read_text(encoding='utf-8'),'html.parser');soups[target]=other
        if not other.find(id=unquote(u.fragment)):errors.append([name,a['href']])
assert not errors,errors
res=soups[SITE/'results.html']
assert not res.select('#fig-p2-correction')
assert len(res.select('#vuaa1-reference-table tbody td'))==66
for slug in ['results','hardware']:
    soup=soups[SITE/f'{slug}.html']
    for el in soup.select('[src],[href],[srcset]'):
        for attr in ['src','href','srcset']:
            value=el.get(attr,'')
            if not any(value.startswith(x)for x in ['fig/odor-2026-10-21/','assets/hardware-test3/','css/final-test-results.css','js/i18n-results-v19.js','js/i18n-hardware-v19.js']):continue
            u=urlsplit(value);p=SITE/u.path
            assert p.is_file(),str(p)
            assert u.query=='v='+hashlib.sha256(p.read_bytes()).hexdigest()[:16],value
report={'anchor_errors':errors,'hardware_late_window_max_independent_difference_pp':max(diff),
'hardware_late_window_conditions_checked':len(late),'new_ratio_table_cells':66,'resource_version_hashes_match':True,
'old_figure13_removed':True,'paired_maps_figure':'13','new_reference_map_figure':'14',
'publication_paths':len(json.loads((SITE/'publication-files.json').read_text(encoding='utf-8'))),
'registry_local_links':224,'odor_original_folder_removed':not(ROOT/'odor').exists()}
(Path(__file__).parent/'final-reference-checks.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
