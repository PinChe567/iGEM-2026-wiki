"""One-time hosting-label consistency pass after verified attachment routing."""
from pathlib import Path
from bs4 import BeautifulSoup
import re,json,hashlib,html
SITE=Path(__file__).resolve().parents[2]; OUT=Path(__file__).parent
edits={
 'contribution':{
  'Design files are published on GitLab; the CAD preview images are available below.':('Text-based design sources are available on GitLab; model files are listed under archive availability. The CAD preview images are available below.','文字格式的設計原始碼可於 GitLab 查閱；模型檔案列於封存資料狀態。CAD 預覽圖如下。'),
  'Published on GitLab.':('The schematic PDF is available from the link above.','電路圖 PDF 可由上方連結查閱。'),
 },
 'hardware':{
  'Published hardware source and data — GitLab':('Hardware analysis and device source — GitLab','硬體分析與裝置原始碼 — GitLab'),
  'The raw-data ZIP preserves all 58 acquisitions':('The archived raw-data ZIP preserves all 58 acquisitions','封存的原始資料 ZIP 保留全部 58 次量測'),
 },
 'measurement':{
  'The research data record is linked above. The code and methods are available on GitLab.':('Archive availability is linked above. Code and method documentation are available on GitLab; public data tables and report PDFs are linked in this section.','上方提供封存資料狀態。程式與方法文件可於 GitLab 查閱；公開資料表與報告 PDF 的連結集中於本節。'),
 },
 'results':{
  'The Test 2 batch is prepared locally for the next research-data update; its inclusion in the linked public Zenodo record has not yet been confirmed.':('The complete Test 2 raw-data package is prepared locally for Zenodo; no public deposit has been verified.','完整的 Test 2 原始資料包已在本機整理，準備存入 Zenodo；目前尚無經核實的公開紀錄。'),
  'Test 1 data and scripts —':('Test 1 source and archive —','Test 1 原始碼與封存資料 —'),
  '— 32 exact instrument exports, filename map, source analysis, tidy data, independent calculations, English figures and executed methods.':('— the complete archive preserves 32 exact instrument exports, filename map, source analysis, tidy data, independent calculations, English figures and executed methods.','— 完整封存資料保留 32 份原始儀器匯出、檔名對照、來源分析、整潔資料、獨立計算、英文圖表與實際執行方法。'),
 }
}
def snapshot(t):
 s=BeautifulSoup(t,'html.parser')
 return {'ids':[x['id'] for x in s.find_all(id=True)],'heads':[(x.name,x.get_text(' ',strip=True)) for x in s.find_all(['h1','h2','h3','h4'])],'images':[(x.get('src'),x.get('srcset')) for x in s.find_all('img')],'figures':len(s.find_all('figure')),'tables':len(s.find_all('table')),'numbers':[re.findall(r'[-+−]?\d+(?:[.,]\d+)*',x.get_text()) for x in s.find_all('table')],'scripts':[(x.get('src'),hashlib.sha256(x.get_text().encode()).hexdigest()) for x in s.find_all('script')]}
rx=re.compile(r'(<a\b[^>]*>)(.*?)(</a>)',re.S|re.I)
changes=[];labelmaps={};files=[]
for p in SITE.glob('*.html'):
 orig=p.read_text(encoding='utf8');updated=orig;labels=[]
 def clean(m):
  if 'https://static.igem.wiki/' not in m[1] or 'GitLab' not in m[2]: return m[0]
  old=BeautifulSoup(m[2],'html.parser').get_text(' ',strip=True)
  body=re.sub(r'\s*<small>\s*[—·]\s*GitLab\s*</small>','',m[2])
  body=re.sub(r'\s*[—·]\s*GitLab\s*$','',body)
  new=BeautifulSoup(body,'html.parser').get_text(' ',strip=True)
  if old!=new: labels.append((old,new));changes.append({'page':p.name,'kind':'cdn-label','old':old,'new':new})
  return m[1]+body+m[3]
 updated=rx.sub(clean,updated)
 for old,(new,zh) in edits.get(p.stem,{}).items():
  assert old in updated,(p.name,old)
  updated=updated.replace(old,new);changes.append({'page':p.name,'kind':'hosting-prose','old':old,'new':new})
 # The second duplicate source-tree link in Test 1 now exposes the archive's actual availability.
 if p.stem=='results':
  old='<a class="zenodo-record-link" href="https://gitlab.igem.org/2026/nthu/-/tree/main/code/aerosense/wetlab/aerosense-wiki/assets/results/final-test"'
  if old in updated:
   start=updated.index(old);end=updated.index('</a>',start)+4;node=updated[start:end]
   replacement=node.replace('/-/tree/main/code/aerosense/wetlab/aerosense-wiki/assets/results/final-test','/-/blob/main/docs/aerosense/archive-status.md').replace('Test 1 analysis source — GitLab','Full raw-data archive availability')
   updated=updated[:start]+replacement+updated[end:];labels.append(('Test 1 analysis source — GitLab','Full raw-data archive availability'))
   changes.append({'page':p.name,'kind':'duplicate-source-to-archive','new':'Full raw-data archive availability'})
 if updated!=orig:
  assert snapshot(orig)==snapshot(updated),p
  p.write_text(updated,encoding='utf8',newline='');files.append(p.name)
  labelmaps[p.stem]=labels
locale_files=[]
for page in set(labelmaps)|set(edits):
 p=SITE/'locales/extras/zh-Hant'/f'{page}.json'
 data=json.loads(p.read_text(encoding='utf8')) if p.exists() else {}
 src=SITE/'locales/source'/f'{page}.json'; zh=SITE/'locales/zh-Hant'/f'{page}.json';lookup={}
 if src.exists() and zh.exists():
  a=json.loads(src.read_text(encoding='utf8'));b=json.loads(zh.read_text(encoding='utf8'));lookup={v['text']:b[k] for k,v in a.items() if isinstance(v,dict) and 'text' in v and k in b}
 for old,new in labelmaps.get(page,[]):
  data[new]='完整原始資料封存狀態' if new=='Full raw-data archive availability' else re.sub(r'\s*[—·]\s*GitLab\s*$','',data.get(old,lookup.get(old,new))).strip()
 for old,(new,zht) in edits.get(page,{}).items():
  # Overlay full translated nodes as well as the replaced individual fragment.
  for key,value in list(data.items()):
   if old in key:
    updated_key=key.replace(old,new)
    oldzh=(lookup.get(old) or data.get(old))
    if oldzh and oldzh in value: data[updated_key]=value.replace(oldzh,zht)
  data[new]=zht
 # These two long nodes are provided explicitly to keep source and translation semantics identical.
 if page=='results':
  body=BeautifulSoup((SITE/'results.html').read_text(encoding='utf8'),'html.parser')
  for node in body.find_all('p'):
   key=node.get_text(' ',strip=True)
   if key.startswith('The complete Test 2 raw-data package'):
    data[key]='完整的 Test 2 原始資料包已在本機整理，準備存入 Zenodo；目前尚無經核實的公開紀錄。資料包包含十二份未修改的 XLSX、校驗碼、附來源儲存格的 1,440 筆觀察、72 組校正摘要、配對視窗敏感度數值及可重現分析程式。先前的整段平均比值僅保留作次要稽核指標。全部校正值可於補充表格查閱。'
 p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8');locale_files.append(p.relative_to(SITE).as_posix())
(OUT/'final-hosting-label-consistency.json').write_text(json.dumps({'changes':changes,'html':files,'locale_extras':locale_files,'all_structural_numeric_figure_script_invariants_pass':True,'needs_global_locale_build':True},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'html':files,'changes':len(changes),'locale_extras':len(locale_files)},ensure_ascii=False))
