from pathlib import Path
from bs4 import BeautifulSoup
import hashlib,json,re
base=Path(__file__).parent;site=base.parents[1];p=site/'contribution.html';text=p.read_text(encoding='utf-8')
replacements={
 'Annotated plasmid maps (PNG)':'Annotated construct maps',
 'Construct maps currently hosted under <code>plasmid/</code>. The maps show cassette architecture.':'Maps of the receptor-expression cassette and the GCaMP6f–Orco reporter.',
 'The release distinguishes design files, assay specifications and measured evidence. Build–test completion and performance validation apply only where the linked results demonstrate them.':'The resources preserve the connection between design, measurements and interpretation.',
 'The evidence supports reusable designs, exploratory cellular characterization and fluorescent-standard reader testing. The following boundaries define what another team must verify before extending those results.':'The following scope accompanies reuse of the cellular, reader and model evidence.',
 'Acquired Test 1 time-course records and diagnostic analysis':'Acquired odor-assay time courses and diagnostic analysis'}
for old,new in replacements.items():assert old in text; text=text.replace(old,new)
for target,copy in [
 ('data-resources','<p><a href="#contribution-data-availability">Download the blank CSV, schema and instructions</a>.</p>'),
 ('model-resources','<p><a href="#contribution-data-availability">Find model tables, methods and source code</a>.</p>')]:
    pattern=r'(<h4 id="'+target+r'">06 Resources</h4>)\s*<ul class="contrib-rcards">\s*</ul>'
    text,n=re.subn(pattern,r'\1'+copy,text);assert n==1
headers={'01 What we contributed':'Contribution','02 Why it matters':'Purpose','03 Evidence':'Evidence',
 '05 What another team can reuse':'Reuse','06 Resources':'Resources'}
for old,new in headers.items(): text=re.sub(r'(<h4\b[^>]*>)'+re.escape(old)+r'(</h4>)',r'\1'+new+r'\2',text)
p.write_text(text,encoding='utf-8',newline='')
p=site/'locales/extras/zh-Hant/contribution.json';d=json.loads(p.read_text(encoding='utf-8'))
d.update({
 'Annotated construct maps':'註解構築圖譜',
 'Maps of the receptor-expression cassette and the GCaMP6f–Orco reporter.':'受體表現盒與 GCaMP6f–Orco 報導系統圖譜。',
 'The resources preserve the connection between design, measurements and interpretation.':'這些資源保留設計、量測與解讀之間的關係。',
 'The following scope accompanies reuse of the cellular, reader and model evidence.':'重用細胞、讀取器與模型證據時，應一併考量下列範圍。',
 'Acquired odor-assay time courses and diagnostic analysis':'已取得的氣味試驗時間序列與診斷分析',
 'Download the blank CSV, schema and instructions':'下載空白 CSV、結構定義與說明',
 'Find model tables, methods and source code':'尋找模型資料表、方法與原始碼',
 'Contribution':'貢獻','Purpose':'目的','Evidence':'證據','Reuse':'重用','Resources':'資源'})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=base/'contribution-evidence-refinement.json';d=json.loads(p.read_text(encoding='utf-8'));s=BeautifulSoup(text,'html.parser')
d['after']['main_words']=len(s.find('main').get_text(' ',strip=True).split())
d['after']['link_targets']=sorted(set(a['href']for a in s.select('a[href]')))
d['after_sha256']=hashlib.sha256(text.encode()).hexdigest()
d['additional_polish']={'removed_repeated_numbering_from_package_subheadings':True,'filled_empty_resource_sections':2,'removed_obsolete_local_image_path':True}
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Contribution final prose and resource navigation ready.')
