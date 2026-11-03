from pathlib import Path
import hashlib,json,re
from bs4 import BeautifulSoup
SITE=Path(__file__).resolve().parents[2]
AUDIT=Path(__file__).resolve().parent
FOOTER='''<footer data-publication-license="" style="position:static;box-sizing:border-box;margin:24px auto 0;padding:16px 20px;max-width:1200px;width:100%;border-top:1px solid #dedad2;color:#443d4d;background:#f7f5f0;font:14px/1.6 system-ui,sans-serif;text-align:center;overflow-wrap:anywhere">Content is available under <a href="https://creativecommons.org/licenses/by/4.0/" rel="license noopener noreferrer" target="_blank" style="color:#5032bb;text-decoration:underline">CC BY 4.0</a>. View the <a href="https://gitlab.igem.org/2026/nthu" rel="noopener noreferrer" target="_blank" style="color:#5032bb;text-decoration:underline">wiki source on iGEM GitLab</a>.</footer>'''
pages=[p for p in (SITE/'game/apps/wiki-client').rglob('*.html') if not {'dist','node_modules'}.intersection(p.relative_to(SITE).parts)]
viewers={'hole-sweep-3d.html':'hole_sweep.csv','operating-sweep-3d.html':'operating_sweep.csv'}
pages += [SITE/'resources/hardware-en'/p for p in viewers]
changes=[]
for p in pages:
    old=p.read_text(encoding='utf-8');soup=BeautifulSoup(old,'html.parser')
    tables=[str(e) for e in soup.find_all('table')]
    scripts=[str(e) for e in soup.find_all('script')]
    new=old
    if p.name in viewers:
        url='https://gitlab.igem.org/2026/nthu/-/raw/main/code/aerosense/hardware/02_simulation/airflow/results/'+viewers[p.name]
        new,n=re.subn(r'<a class="zenodo-record-link" href="https://doi.org/10\.5281/zenodo\.23469212"[^>]*>.*?</a>',f'<a href="{url}" rel="noopener noreferrer" target="_blank">Source CSV</a>',new,flags=re.S)
        assert n==1
    if 'data-publication-license=' not in new:
        new,n=re.subn(r'</body>',FOOTER+'\n</body>',new,count=1,flags=re.I);assert n==1
    check=BeautifulSoup(new,'html.parser')
    assert tables==[str(e) for e in check.find_all('table')]
    assert scripts==[str(e) for e in check.find_all('script')]
    p.write_text(new,encoding='utf-8')
    changes.append({'path':p.relative_to(SITE).as_posix(),'before_sha256':hashlib.sha256(old.encode()).hexdigest(),'after_sha256':hashlib.sha256(new.encode()).hexdigest(),'table_and_script_content_unchanged':True})
(AUDIT/'required-publication-footer-changes.json').write_text(json.dumps({'changes':changes,'scope':'Normal-flow attribution footer only; two standalone viewer download links corrected to exact CSVs. Existing game behavior, viewer datasets, tables and scripts preserved.'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'changed_pages':len(changes),'game_pages':len(changes)-2,'viewer_pages':2}))
