from pathlib import Path
import hashlib,json,re
from bs4 import BeautifulSoup

HERE=Path(__file__).resolve().parent
SITE=HERE.parents[1]
p=SITE/'hardware.html'
original=p.read_text(encoding='utf-8');before=BeautifulSoup(original,'html.parser')
old='The local backend reconstructs four ΔF/F₀ time courses from saved measurements and calibration records. It compares the Or22a, Or35a, Or85b and Or98a response pattern with laboratory and DoOR reference patterns, then displays separate ranked matches in the interface. Scores are 100 × max(0, Pearson r), so they describe pattern similarity rather than probabilities of odor identity.'
new='The reader interface sends saved acquisition and calibration records to a local Python backend. For reference analysis, D1–D4 hold Or22a, Or35a, Or85b and Or98a, respectively; the backend reconstructs their ΔF/F₀ curves, averages all four over the same selected response window and returns separate ranked matches against laboratory and DoOR references. The bars show 100 × max(0, Pearson r), a pattern-similarity score rather than an odor probability or validated identification.'
assert original.count(old)==1
changed=original.replace(old,new)
target='<h3 class="reading-heading--topic">Calibration data and reproducible analyses</h3>'
addition='<p><a href="https://gitlab.igem.org/2026/software/nthu/aerosense/-/tree/main/code/aerosense/hardware/07_validation/reproduction-source">Instrument calibration source — GitLab</a></p>'
assert changed.count(target)==1
changed=changed.replace(target,target+addition)
after=BeautifulSoup(changed,'html.parser')
assert [x.get('id') for x in before.select('[id]')]==[x.get('id') for x in after.select('[id]')]
assert [str(x) for x in before.find_all(['figure','table'])]==[str(x) for x in after.find_all(['figure','table'])]
old_links={x.get('href') for x in before.select('a[href]')}
new_links={x.get('href') for x in after.select('a[href]')}
assert old_links<=new_links
p.write_text(changed,encoding='utf-8',newline='\n')
report={'scope':'Source-checked backend integration wording and one parent-authorized calibration source link; prior concise Discussion and caption retained.','before_sha256':hashlib.sha256(original.encode()).hexdigest(),'after_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'all_figures_tables_and_ids_unchanged':True,'all_existing_links_preserved':True,'new_link':next(iter(new_links-old_links)),'discussion_word_count':len(after.find(id='hardware-discussion').get_text(' ',strip=True).split()),'backend_channel_mapping_is_distinct_from_living_cell_run':True,'image_urls_still_waiting_for_official_upload':True}
(HERE/'final-hardware-text-review.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
