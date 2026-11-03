from pathlib import Path
from bs4 import BeautifulSoup
import collections, hashlib, html, json, re

base=Path(__file__).parent;site=base.parents[1];work=site.parent;repo=work/'gitlab/nthu'
path=site/'contribution.html';before=path.read_text(encoding='utf-8');text=before
locale_path=site/'locales/extras/zh-Hant/contribution.json'
locale=json.loads(locale_path.read_text(encoding='utf-8'));changes=[]
def replace(old,new,zh=None):
    global text
    count=text.count(old)
    assert count>0,old
    text=text.replace(old,new)
    changes.append({'old':old,'new':new,'count':count})
    if zh: locale[new]=zh

replace('Rerun the endpoint analysis of 25 fluorescence fields across 12 conditions. Scripts and machine-readable outputs record image provenance, QC, DAPI-object segmentation, reporter thresholds and exclusions, so another team can inspect each decision before adopting the analysis.',
 'Inspect the endpoint analysis of 25 fluorescence fields across 12 conditions. Reusable scripts and machine-readable tables connect each image to its QC decisions, DAPI-object measurements, reporter thresholds and exclusions.',
 '檢視涵蓋 12 個條件、25 個螢光視野的終點分析。可重用程式與機器可讀資料表將每張影像連到品質管制判定、DAPI 物件量測、報導訊號閾值及排除紀錄。')
replace('Construct maps and Registry records make the biological design traceable and reusable alongside the published OR/Orco precedent.',
 'Construct maps, Registry records and exploratory fluorescence assays connect the OR/Orco design to its experimental evidence.',
 '構築圖譜、元件登錄紀錄與探索性螢光試驗，將 OR／Orco 設計連到實驗證據。')
replace('Same notation as published construct · not an AeroSense result','Separate expression marker','獨立表現標記')
replace('Unresolved on the AeroSense side','Fusion reporter design','融合報導蛋白設計')
replace('Follows published control · workflow not validated','Orco agonist reference','Orco 致效劑參考')
replace('GCaMP6f–(GGGGS)<sub>3</sub>–Orco;','GCaMP6f–(GGGGS)<sub>3</sub>–Orco;') if False else None
replace('Maps are not functional validation.','The maps show cassette architecture.','圖譜呈現表現盒架構。')
replace('Positive- and negative-control matrix','Biological control plan','生物對照計畫')
replace('Ionomycin × VUAA1 diagnostic logic is documented on Engineering; a filled experimental matrix file is not released.',
 'Ionomycin × VUAA1 diagnostic logic connects reporter performance to Orco agonist response in the engineering record.',
 '工程紀錄中的 ionomycin × VUAA1 診斷邏輯，將報導系統表現與 Orco 致效劑反應連結。')
replace('Failed construct and troubleshooting notes','Reporter architecture and troubleshooting notes','報導系統架構與問題排查紀錄')
replace('IRES amplitude failure → fusion redesign narrative on Engineering.',
 'Engineering records the earlier IRES-driven reporter investigation and the rationale for the GCaMP6f–Orco fusion.',
 'Engineering 記錄較早的 IRES 驅動報導系統研究，以及 GCaMP6f–Orco 融合設計的依據。')
replace('Frequency-tagged weak-optical readout design, calibration specifications and engineering documentation for a biological fluorescence reader.',
 'A documented four-channel reader with fluorescent-standard measurements, calibration analysis and measured cross-talk correction.',
 '具完整文件的四通道讀取器，附螢光標準品量測、校正分析及實測串擾校正。')
replace('Optical readout, calibration workflows and engineering documentation for a biological reader.',
 'Optical readout, fluorescent-standard tests and reusable calibration records.',
 '光學讀值、螢光標準品測試與可重用校正紀錄。')

evidence=re.search(r'(<section\b[^>]*aria-labelledby="hw-evidence"[^>]*>.*?<h4[^>]*>.*?</h4>)(.*?)(</section>)',text,re.S)
assert evidence
new_hw='''
<p><a href="hardware.html">Hardware</a> reports 58 fluorescein acquisitions, calibration coefficients and a measured channel-mixing matrix. <a href="engineering.html#track-hardware">Engineering · Hardware</a> traces the corresponding circuit and enclosure decisions. The <a href="#hw-resources">Reusable resources</a> and <a href="hardware.html">Hardware · design report</a> connect those measurements to the build files and analysis.</p>
'''
text=text[:evidence.start(2)]+new_hw+text[evidence.end(2):]
changes.append({'section':'hw-evidence','action':'replace outdated documentation-only statement with measured standard/calibration scope'})
locale['reports 58 fluorescein acquisitions, calibration coefficients and a measured channel-mixing matrix.']='提供 58 次螢光素擷取、校正係數及實測通道混合矩陣。'
locale['traces the corresponding circuit and enclosure decisions. The']='追溯對應的電路與外殼設計決策。'
locale['connect those measurements to the build files and analysis.']='將這些量測連到建構檔案與分析。'

replace('Removing Raspberry Pi left an <strong>ESP32-standalone</strong> design for acquisition, modulation, embedded processing and wireless communication, with higher-level inference outside the reader. This reduces the architecture’s board area, heat, power and mechanical burden. Raspberry Pi records describe the earlier iteration.',
 'An ESP32 handles acquisition, modulation, embedded processing and wireless communication in the current reader; higher-level inference remains off-board. Engineering retains the earlier Raspberry Pi comparison and the rationale for consolidating these functions.',
 '目前讀取器由 ESP32 負責擷取、調變、嵌入式處理及無線通訊；高階推論留在裝置外執行。Engineering 保留較早的 Raspberry Pi 比較與整合這些功能的依據。')
replace('An isolation matrix is not published here.','The measured mixing matrix and correction analysis are available with the calibration records.','實測混合矩陣與校正分析可由校正紀錄取得。')
replace('An IRES-downstream GCaMP produced a real but unquantifiable VUAA1 change, which is a different diagnosis from “Orco is not expressed.”',
 'The earlier reporter investigation motivated a GCaMP6f–Orco fusion to bring the calcium reporter closer to the channel; Engineering preserves the observations and redesign rationale.',
 '較早的報導系統研究促成 GCaMP6f–Orco 融合設計，使鈣離子報導蛋白更靠近通道；Engineering 保留觀察與重新設計依據。')
replace('The blank CSV and JSON Schema specify fields and provenance. They contain no acquired reader run or measured signal-to-noise ratio.',
 'The blank CSV and JSON Schema specify sample identity, units, controls, source hashes and signal-quality fields.',
 '空白 CSV 與 JSON Schema 定義樣本身分、單位、對照、來源雜湊與訊號品質欄位。')
replace('The lists below are the contract, not a published dataset.','The lists below define the record format.','下列清單定義紀錄格式。')
replace('A computational framework that translates receptor-array responses into a high-dimensional representation inspired by <i>Drosophila</i> olfactory processing, packaged with simpler baselines so added complexity can be judged.',
 'A documented fly-inspired decoder architecture, evaluated with external sensor benchmarks and simpler comparison models.',
 '附有文件的果蠅啟發式解碼器架構，以外部感測器基準資料及較簡單的比較模型評估。')

# Update only the three headline status badges; individual document/template
# badges retain their own scope and all status-related DOM hooks are preserved.
statuses=list(re.finditer(r'<p class="contrib-status"[^>]*>.*?</p>',text,re.S))
for index,label,state,zh in reversed([
 (0,'Designs and exploratory measurements','released','設計與探索性量測'),
 (1,'Built and tested with standards','prototype','已建置並以標準品測試'),
 (3,'Architecture and external-data benchmarks','released','架構與外部資料基準評估')]):
    m=statuses[index];block=m.group().replace('data-contrib-state="documentation-only"',f'data-contrib-state="{state}"')
    block=block.replace('<span class="contrib-status__text">Documentation only</span>',f'<span class="contrib-status__text">{label}</span>')
    text=text[:m.start()]+block+text[m.end():];locale[label]=zh

# Interpretation limits are now read together in Discussion. Existing IDs are
# retained so links from other pages continue to resolve.
replace('This adaptation map describes construct design. Interpret functional response from the experimental record, with the assay conditions and controls shown there.',
 'The cassette map specifies OR–IRES–mCherry as the expression marker and GCaMP6f–Orco as the calcium reporter. The earlier IRES-driven calcium-reporter observations belong to the redesign record. Microscopy and the two single-well kinetic assays support exploratory characterization; they do not establish stable cell lines or receptor-specific activation. The ionomycin × VUAA1 diagnostic matrix remains a planned control framework.',
 '表現盒圖譜以 OR–IRES–mCherry 作為表現標記，並以 GCaMP6f–Orco 作為鈣離子報導系統。較早 IRES 驅動鈣離子報導系統的觀察屬於重新設計紀錄。顯微影像及兩次單孔動態試驗支持探索性特徵分析，尚不足以建立穩定細胞株或受體專一性活化；ionomycin × VUAA1 診斷矩陣仍屬規劃中的對照架構。')
replace('The source collection includes firmware and software, simulation archives, documentation and fabrication files. Hardware documents the design and its physical validation status.',
 'Fluorescein measurements establish reader behavior under the documented standard-solution conditions. Calibration and cross-talk correction retain their fitted ranges and matrix assumptions. Living-cell integration is exploratory; these records do not establish receptor-specific odor detection or field performance.',
 '螢光素量測建立讀取器在文件所列標準溶液條件下的表現。校正與串擾修正仍受擬合範圍及矩陣假設限制。活細胞整合屬探索性測試；這些紀錄尚不足以建立受體專一性氣味偵測或田間表現。')
replace('The data dictionary and matched raw/processed examples are outside the current release. SNR and quality entries remain record fields.',
 'The measurement CSV and schema are blank record formats. They are not a matched raw/processed example of a reader run, and an SNR field does not itself provide a measured detection limit.',
 '量測 CSV 與結構定義是空白紀錄格式，並非某次讀取器操作的成對原始／處理後範例；SNR 欄位本身也不構成實測偵測極限。')
replace('The hardware package\'s four-feature NumPy MLP and the PN–KC–MBON decoder are separate implementations.',
 'The four-feature NumPy MLP and the PN–KC–MBON decoder are separate implementations. The decoder benchmarks use external metal-oxide sensors; the matching training engine, fitted preprocessing, fold tables and seeds are not all released. These results therefore do not demonstrate classification of AeroSense cell responses.',
 '四特徵 NumPy MLP 與 PN–KC–MBON 解碼器是不同實作。解碼器基準評估使用外部金屬氧化物感測器；相應訓練引擎、已擬合前處理、fold 表與種子尚未全部釋出。因此，這些結果不代表已對 AeroSense 細胞反應完成分類。')
limits=[]
for kind,title,zh in [('bio','Biological interpretation','生物結果解讀'),('hw','Reader validation scope','讀取器驗證範圍'),('data','Measurement record scope','量測紀錄範圍'),('model','Decoder reproducibility','解碼器重現性'),('hp','Feedback records','回饋紀錄')]:
    m=re.search(r'<section\b[^>]*aria-labelledby="'+kind+r'-limits"[^>]*>.*?</section>',text,re.S);assert m
    block=m.group().replace('>04 Limits</h4>',f'>{title}</h4>')
    text=text[:m.start()]+text[m.end():];limits.append(block);locale[title]=zh

# Move the clock-qualified comparison, including its existing link, from the
# package evidence card into the decoder discussion.
clock=re.search(r'<p[^>]*>\s*The clock-schedule audit invalidated the quantization sweep;.*?</p>',text,re.S);assert clock
clock_html=clock.group();text=text[:clock.start()]+text[clock.end():]
limits[3]=limits[3].replace('</section>',clock_html+'</section>')

replace('Implementation source is distinct from measured reader performance.',
 'Includes measured channel mixing and cross-talk correction records.',
 '附實測通道混合與串擾校正紀錄。')
replace('Validation plans and blank measurement forms.',
 'Fluorescein measurements, calibration coefficients and reproducible cross-talk analysis.',
 '螢光素量測、校正係數與可重現串擾分析。')
replace('Prepared protocols; a calibrated integrated reader is not demonstrated.',
 'Measurement conditions and fitted ranges accompany the results.',
 '結果附有量測條件與擬合範圍。')
replace('Record format only; no matched raw/processed example release.','Blank formats with units, QC and provenance fields.','附單位、品質管制與來源欄位的空白格式。')
replace('Decoder architecture, assumptions and reported results.',
 'Decoder architecture, assumptions and external-sensor benchmark results.',
 '解碼器架構、假設與外部感測器基準評估結果。')
replace('Matching training engine, preprocessing, folds and seeds are incomplete.',
 'Discussion identifies the scope of the available implementation and reproducibility record.',
 'Discussion 說明可取得實作與重現紀錄的範圍。')
replace('A calibrated integrated reader, validated receptor-specific responses and a complete matching neuromorphic training release remain outside the demonstrated scope.',
 'The evidence supports reusable designs, exploratory cellular characterization and fluorescent-standard reader testing. The following boundaries define what another team must verify before extending those results.',
 '證據支持可重用設計、探索性細胞特徵分析及以螢光標準品進行的讀取器測試。下列範圍界定其他團隊延伸結果前，仍須驗證的事項。')
discussion=re.search(r'<section\b[^>]*id="resource-roadmap"[^>]*>.*?</section>',text,re.S);assert discussion
block=discussion.group();block=block.replace('<p>Reuse permissions', ''.join(limits)+'<p>Reuse permissions')
text=text[:discussion.start()]+block+text[discussion.end():]

# Preserve resource-card entry points, while collecting repeated document and
# template downloads under the existing Data availability section.
moved=[]
for needle in ['Standalone protocol record','Blank measurement CSV']:
    m=next(m for m in re.finditer(r'<p\b[^>]*>.*?</p>',text,re.S)if needle in m.group())
    moved.append(m.group());text=text[:m.start()]+text[m.end():]
    changes.append({'action':'move resource paragraph to Data availability','label':needle})

template_manifest=[]
src=work/'zenodo-release/aerosense-wiki/assets/contribution/templates'
dst=repo/'docs/aerosense/contribution/templates';dst.mkdir(parents=True,exist_ok=True)
for p in src.iterdir():
    assert p.is_file();data=p.read_bytes();target=dst/p.name
    if target.exists(): assert target.read_bytes()==data
    else: target.write_bytes(data)
    template_manifest.append({'source':p.relative_to(work).as_posix(),'destination':target.relative_to(repo).as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})

proto='https://gitlab.igem.org/2026/nthu/-/raw/main/docs/aerosense/wetlab/aerosense-protocols.html'
test1='https://gitlab.igem.org/2026/nthu/-/raw/main/code/aerosense/wetlab/aerosense-wiki/assets/results/final-test/plate-p2-methods.html'
moved[0]=moved[0].replace('href="#contribution-data-availability"',f'href="{proto}"',1).replace('href="#contribution-data-availability"',f'href="{test1}"',1)
for name in ['measurement-record-template.csv','measurement-record.schema.json','README.txt']:
    moved[1]=moved[1].replace('href="#contribution-data-availability"','href="https://gitlab.igem.org/2026/nthu/-/raw/main/docs/aerosense/contribution/templates/'+name+'"',1)
extra='''<h3>Protocols and reusable record formats</h3>'''+''.join(moved)+'''<p><a href="https://gitlab.igem.org/2026/nthu/-/raw/main/docs/aerosense/contribution/templates/stakeholder-decision-template.csv">Blank stakeholder-to-design record — CSV</a></p><h3>Experimental data and reproducible analysis</h3><ul><li><a href="results.html#data-availability">Microscopy and both odor assays: data and analysis</a></li><li><a href="hardware.html#hardware-data-availability">Fluorescent standards, calibration and channel-mixing records</a></li><li><a href="model.html#model-data-availability">Model tables, methods and source code</a></li></ul>'''
needle='<h3>Raw and complete data</h3>';assert needle in text;text=text.replace(needle,extra+needle)
locale.update({
 'Protocols and reusable record formats':'實驗流程與可重用紀錄格式',
 'Experimental data and reproducible analysis':'實驗資料與可重現分析',
 'Blank stakeholder-to-design record — CSV':'空白利害關係人回饋至設計紀錄 — CSV',
 'Microscopy and both odor assays: data and analysis':'顯微影像與兩次氣味試驗：資料與分析',
 'Fluorescent standards, calibration and channel-mixing records':'螢光標準品、校正與通道混合紀錄',
 'Model tables, methods and source code':'模型資料表、方法與原始碼'})

# Concise availability labels and the now-moved method status qualify the
# existing resource entry without repeating download lists inside each card.
replace('The general protocol retains its execution labels.','The general protocol identifies executed and proposed procedures.','一般流程記錄區分已執行與規劃中的程序。')
replace('the broader 384-well specification remains unrun.','the broader 384-well specification is retained as a proposed assay.','較廣泛的 384 孔規格則保留為規劃中的試驗。')

def snap(content):
    s=BeautifulSoup(content,'html.parser')
    return {'figures':len(s.select('figure')),'tables':len(s.select('table')),
       'ids':sorted(x['id']for x in s.select('[id]')),
       'figure_hash':hashlib.sha256(''.join(str(x)for x in s.select('figure')).encode()).hexdigest(),
       'script_hash':hashlib.sha256(''.join(str(x)for x in s.select('script')).encode()).hexdigest(),
       'numeric_cells':[[re.findall(r'\b\d+(?:\.\d+)?\b',x.get_text())for x in table.select('td,th')]for table in s.select('table')],
       'link_targets':sorted(set(a['href']for a in s.select('a[href]'))),
       'main_words':len(s.find('main').get_text(' ',strip=True).split())}
b=snap(before);a=snap(text)
for k in ['figures','tables','ids','figure_hash','script_hash','numeric_cells']: assert b[k]==a[k],k
assert set(b['link_targets'])<=set(a['link_targets']),set(b['link_targets'])-set(a['link_targets'])
assert 'An isolation matrix is not published here.' not in text
assert 'Those pages are not a completed fluorescence-instrument validation claim.' not in text
path.write_text(text,encoding='utf-8',newline='')
locale_path.write_text(json.dumps(locale,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(base/'contribution-evidence-refinement.json').write_text(json.dumps({'before':b,'after':a,'changes':changes,
 'limits_moved_to_discussion':5,'resource_paragraphs_moved_to_data_availability':2,'template_files':template_manifest,
 'scope':'No dataset, figure, numerical table value, script, existing ID or prior link target removed. Exact OR–IRES–mCherry marker architecture retained; historical IRES-driven calcium reporter separated in Discussion.'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'changes':len(changes),'limits_moved':5,'templates':len(template_manifest),'words_before':b['main_words'],'words_after':a['main_words']}))
