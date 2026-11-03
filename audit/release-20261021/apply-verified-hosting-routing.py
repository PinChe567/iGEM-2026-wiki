"""Apply only verified attachment routing and truthful resource labels to the daily website."""
from pathlib import Path
from urllib.parse import quote
from bs4 import BeautifulSoup
from collections import Counter
import json,re,html,hashlib,os

ROOT=Path(__file__).resolve().parents[3]; SITE=ROOT/'aerosense-wiki'; OUT=Path(__file__).parent
FINAL=SITE/'audit/final-publication-20261021'; G='https://gitlab.igem.org/2026/nthu'
plan=json.loads((OUT/'gitlab-hosting-correction-plan.json').read_text(encoding='utf8'))
routes={}; route_rows=[]
pdfmaps={}
for fn in ['verified-cdn-hardware-documents-mapping.json','verified-cdn-research-documents-mapping.json']:
    for r in json.loads((FINAL/fn).read_text(encoding='utf8'))['files']:
        assert r.get('verified') and r['response_sha256']==r['sha256']
        pdfmaps[r['source_document'].replace('\\','/')]=r
assert len(pdfmaps)==10

pdf_labels={
 'plate-p2-methods.html':'Test 1 executed methods · PDF',
 'analysis-report.html':'Microscopy analysis report · PDF',
 'component-audit-complete.html':'Full component audit · PDF',
 'reader-simulation-record.html':'simulation report (PDF)',
 'receptor-analysis-record.html':'the docking / OBP evidence record (PDF)',
 'aerosense-protocols.html':'Standalone protocol record · PDF',
 'BOM_EN.xlsx':'Materials and equipment cost reference · PDF',
 'pcb-current-bom.docx':'Current design BOM · PDF',
 'pcb-initial-drc-2026-08-02.rpt':'Initial DRC report · PDF',
 'pcb-initial-erc-2026-08-02.rpt':'Initial ERC report · PDF',
}
directory_labels={
 'code/aerosense/hardware/02_simulation/airflow':'Airflow simulation source — GitLab',
 'code/aerosense/receptor-engineering/wiki-site/assets/receptor-engineering':'Receptor analysis and figure source — GitLab',
 'code/aerosense/visualization/aerosense-wiki/assets/description/neuroanatomy/malecns':'Neuroanatomy rendering source — GitLab',
 'code/aerosense/wetlab/aerosense-wiki/assets/results/final-test':'Test 1 analysis source — GitLab',
 'code/aerosense/wetlab/aerosense-wiki/assets/results/microscopy':'Microscopy analysis source — GitLab',
 'docs/aerosense/parts':'Parts documentation — GitLab',
}
for r in plan['records']:
    action=r['action']; new=r.get('proposed_url'); label=r.get('proposed_label')
    if r.get('local_path') in pdfmaps:
        proof=pdfmaps[r['local_path']]; assert r['sha256']==proof['source_document_sha256']
        new=proof['official_url']; action='replace_verified_pdf_reader'; label=pdf_labels[Path(r['repository_path']).name]
    if action in {'retain_source','retain_source_directory','retain_repository_navigation','missing_local_source_review'}: continue
    assert new,(r['current_url'],action)
    if action=='retain_source_directory_relabel': label=directory_labels[r['repository_path']]
    routes[r['current_url']]={'url':new,'action':action,'label':label,'source_sha256':r.get('sha256')}
    route_rows.append({'old_url':r['current_url'],'new_url':new,'action':action,'label':label,'source_sha256':r.get('sha256')})

# Exact current optical-analysis source; the other same-named script has different bytes.
optical='code/aerosense/visualization/aerosense-wiki/resources/hardware-en/optical-validation/analyze_optical_validation.py'
source=ROOT/'gitlab/nthu'/optical
assert hashlib.sha256(source.read_bytes()).hexdigest()=='1029ee6c8f4f2444d0ce6954d1e114be8cd940ae1cd6ac4b6ec68dfe142a80f3'
routes['resources/hardware-en/optical-validation/analyze_optical_validation.py']={'url':G+'/-/blob/main/'+optical,'action':'retain_exact_source','label':'Reproduce the optical comparison (Python)'}

ZH={
 'Test 1 executed methods · PDF':'Test 1 實際執行方法 · PDF',
 'Microscopy analysis report · PDF':'顯微影像分析報告 · PDF',
 'Full component audit · PDF':'完整元件檢核 · PDF',
 'simulation report (PDF)':'模擬報告（PDF）',
 'the docking / OBP evidence record (PDF)':'對接／OBP 證據紀錄（PDF）',
 'Standalone protocol record · PDF':'獨立實驗程序紀錄 · PDF',
 'Materials and equipment cost reference · PDF':'材料與設備參考價格 · PDF',
 'Current design BOM · PDF':'目前設計物料清單 · PDF',
 'Initial DRC report · PDF':'初版 DRC 報告 · PDF',
 'Initial ERC report · PDF':'初版 ERC 報告 · PDF',
 'User manual — PDF reader':'使用者手冊 — PDF 讀本',
 'Developer manual — PDF reader':'開發者手冊 — PDF 讀本',
 'Blank feedback form — PDF reader':'空白回饋表 — PDF 讀本',
 'Anonymized feedback form — PDF reader':'匿名回饋表 — PDF 讀本',
 'Financial planning preview — PDF':'財務規劃預覽 — PDF',
 'Cross-talk calibration analysis source — GitLab':'串擾校正分析原始碼 — GitLab',
 'Session comparison analysis source — GitLab':'兩批量測比較分析原始碼 — GitLab',
 'Fluorescein calibration analysis source — GitLab':'螢光素校正分析原始碼 — GitLab',
 'Per-channel calibration analysis source — GitLab':'逐通道校正分析原始碼 — GitLab',
 'Airflow simulation source — GitLab':'氣流模擬原始碼 — GitLab',
 'Receptor analysis and figure source — GitLab':'受體分析與製圖原始碼 — GitLab',
 'Neuroanatomy rendering source — GitLab':'神經解剖視覺化原始碼 — GitLab',
 'Test 1 analysis source — GitLab':'Test 1 分析原始碼 — GitLab',
 'Microscopy analysis source — GitLab':'顯微影像分析原始碼 — GitLab',
 'Parts documentation — GitLab':'元件文件 — GitLab',
 'Reproduce the optical comparison (Python)':'重現光學比較（Python）',
}

def label_for(old,r):
    if r['action']=='replace_verified_exact_cdn': return re.sub(r'\s*[—·]\s*GitLab\s*$','',old).strip()
    if r['action'] in {'archive_data_or_model','archive_dataset_directory'}:
        base=re.sub(r'\s*[—·]\s*(?:GitLab|ZIP)\s*$','',old).strip()
        base=base.replace('STL source','STL file')
        return base+' — archive availability'
    return r['label'] or old

def snapshot(body):
    s=BeautifulSoup(body,'html.parser')
    return {'ids':[t['id'] for t in s.find_all(id=True)],'headings':[(t.name,t.get_text(' ',strip=True)) for t in s.find_all(['h1','h2','h3','h4'])],'figures':len(s.find_all('figure')),'images':[(i.get('src'),i.get('srcset')) for i in s.find_all('img')],'tables':len(s.find_all('table')),'table_numeric_tokens':[re.findall(r'(?<![A-Za-z])[-+−]?\d+(?:[.,]\d+)*(?:%|[eE][+-]?\d+)?',t.get_text(' ',strip=True)) for t in s.find_all('table')],'scripts':[(t.get('src'),hashlib.sha256(t.get_text().encode()).hexdigest()) for t in s.find_all('script')]}

anchor_rx=re.compile(r'<a\b(?P<attrs>[^>]*?)>(?P<body>.*?)</a>',re.I|re.S)
href_rx=re.compile(r'\bhref\s*=\s*([\"\'])(.*?)\1',re.I|re.S)
changes=[]; changed_html=[]; translations={}; snapshots=[]
files=list(SITE.glob('*.html'))+list((SITE/'resources').rglob('*.html'))
for p in files:
    original=p.read_text(encoding='utf8'); page=p.stem
    before=snapshot(original); per=[]
    def change_anchor(match):
        hm=href_rx.search(match['attrs'])
        if not hm: return match.group()
        oldurl=html.unescape(hm.group(2)); r=routes.get(oldurl)
        if not r: return match.group()
        oldlabel=BeautifulSoup(match['body'],'html.parser').get_text(' ',strip=True); newlabel=label_for(oldlabel,r)
        # Only touched resource anchors lose download attributes; navigation must not download an HTML status/source page.
        attrs=match['attrs'];attrs=re.sub(r'\s+download(?:\s*=\s*(?:\"[^\"]*\"|\'[^\']*\'|[^\s>]+))?','',attrs,flags=re.I)
        attrs=attrs.replace(hm.group(2),r['url'])
        # Relative source paths can be substrings of the already-expanded URL.
        # Only absolute historical URLs may occur in a second preview attribute.
        for old,route in routes.items():
            if old.startswith('https://'): attrs=attrs.replace(old,route['url'])
        inner=match['body']
        if oldlabel!=newlabel:
            fragment=BeautifulSoup(inner,'html.parser')
            assert not fragment.find(id=True),'Refusing to drop an ID in an anchor label.'
            assert not fragment.find(['img','svg','button']),'Refusing to replace visual anchor contents.'
            inner=html.escape(newlabel,quote=False)
            translations.setdefault(page,[]).append((oldlabel,newlabel,r['action']))
        per.append({'old_url':oldurl,'new_url':r['url'],'old_label':oldlabel,'new_label':newlabel,'action':r['action']})
        return '<a'+attrs+'>'+inner+'</a>'
    updated=anchor_rx.sub(change_anchor,original)
    for old,r in routes.items():
        if old.startswith('https://'): updated=updated.replace(old,r['url'])
    if updated!=original:
        after=snapshot(updated)
        assert before==after,('Structural/scientific invariant changed',p.name,[k for k in before if before[k]!=after[k]])
        p.write_text(updated,encoding='utf8',newline='')
        changed_html.append(p.relative_to(SITE).as_posix());changes.extend({'source':p.relative_to(SITE).as_posix(),**x} for x in per)
        snapshots.append({'source':p.relative_to(SITE).as_posix(),'before':before,'after':after,'pass':True})

locale_files=[]
for p in (SITE/'locales').rglob('*.json'):
    content=p.read_text(encoding='utf8');updated=content
    for old,r in routes.items():
        if old.startswith('https://'): updated=updated.replace(old,r['url'])
    if updated!=content: p.write_text(updated,encoding='utf8',newline='');locale_files.append(p.relative_to(SITE).as_posix())

for page,items in translations.items():
    target=SITE/'locales/extras/zh-Hant'/f'{page}.json'
    if not target.parent.exists(): continue
    data=json.loads(target.read_text(encoding='utf8')) if target.exists() else {}
    source_path=SITE/'locales/source'/f'{page}.json'; translated_path=SITE/'locales/zh-Hant'/f'{page}.json'
    old_by_text={}
    if source_path.exists() and translated_path.exists():
        src=json.loads(source_path.read_text(encoding='utf8'));zh=json.loads(translated_path.read_text(encoding='utf8'))
        old_by_text={r['text']:zh[k] for k,r in src.items() if isinstance(r,dict) and 'text' in r and k in zh}
    for old,new,action in items:
        if new in ZH: translation=ZH[new]
        else:
            base=re.sub(r'\s*[—·]\s*GitLab\s*$','',old).strip()
            oldzh=data.get(old,old_by_text.get(old,data.get(base,old_by_text.get(base,base))))
            if action=='replace_verified_exact_cdn': translation=re.sub(r'\s*[—·]\s*GitLab\s*$','',oldzh).strip()
            elif action in {'archive_data_or_model','archive_dataset_directory'}:
                translation=re.sub(r'\s*[—·]\s*(?:GitLab|ZIP)\s*$','',oldzh).strip()+' — 封存資料狀態'
            else: translation=oldzh
        data[new]=translation
    target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    locale_files.append(target.relative_to(SITE).as_posix())

report={'scope':'Verified hosting/label changes only; daily website and locale overlays. No scientific values, images, figures, sections, IDs or interactive scripts changed. Game/build left to hardware agent. No GitHub or GitLab mutation.','verified_document_mappings':['verified-cdn-hardware-documents-mapping.json','verified-cdn-research-documents-mapping.json'],'verified_static_mapping':'verified-cdn-corrections-mapping.json','changed_html':changed_html,'changed_locale_files':sorted(set(locale_files)),'anchor_changes':changes,'route_actions':dict(Counter(x['action'] for x in changes)),'routing':route_rows,'snapshots':snapshots,'needs_global_locale_build':True}
(OUT/'applied-verified-hosting-routing.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'changed_html':changed_html,'anchors':len(changes),'actions':report['route_actions'],'locales':len(set(locale_files))},ensure_ascii=False,indent=2))
