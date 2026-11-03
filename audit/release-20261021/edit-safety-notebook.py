from pathlib import Path
from bs4 import BeautifulSoup
import collections,hashlib,json,re
base=Path(__file__).parent;root=base.parents[1]
file=root/'safety-and-security.html';raw=file.read_text(encoding='utf-8');s=BeautifulSoup(raw,'html.parser');changes=[];zh={}
txt=lambda x:x.get_text(' ',strip=True)
def invariant(doc):
 return dict(figures=[str(x)for x in doc.find_all('figure')],tables=[str(x)for x in doc.find_all('table')],media=[str(x)for x in doc.select('img,video,source,iframe,canvas')],ids=sorted(x['id']for x in doc.select('[id]')),scripts=[str(x)for x in doc.find_all('script')])
before=invariant(s)
def edit(prefix,html,translation):
 items=[p for p in s.select('article p')if txt(p).startswith(prefix)];assert len(items)==1,(prefix,len(items));p=items[0];old=txt(p);p.clear()
 for c in list(BeautifulSoup(html,'html.parser').contents):p.append(c)
 changes.append({'before':old,'after':txt(p)});zh[txt(p)]=translation
edit('See also register: named','VUAA1 has limited public toxicology and follows the concentrated VOC and DMSO stock controls in <a href="#hazard-chem-01">CHEM-01</a> and <a href="#hazard-chem-04">CHEM-04</a>. Inventory completeness and electroporation are covered by <a href="#hazard-bio-04">BIO-04</a> and <a href="#hazard-bio-05">BIO-05</a>.','VUAA1 的公開毒理資料有限，依 CHEM-01 與 CHEM-04 的濃縮 VOC 及 DMSO 原液控制措施處理。材料清單完整性與電穿孔分別由 BIO-04 及 BIO-05 涵蓋。')
edit('See also register: cartridge seal','Cartridge sealing, leak isolation and laboratory-only live-cell use are covered by <a href="#hazard-dep-01">DEP-01</a>; living-cell distribution by <a href="#hazard-dep-02">DEP-02</a>. Autoclave and sharps controls are listed under <a href="#hazard-hw-04">HW-04</a> and <a href="#hazard-hw-05">HW-05</a>.','匣體密封、洩漏隔離及活細胞僅限實驗室使用由 DEP-01 涵蓋，活細胞配送由 DEP-02 涵蓋；高壓滅菌及尖銳物控制分別列於 HW-04 與 HW-05。')
edit('Safe construction of AeroSense depends','Safe construction combines biological containment, organism and part selection, chemical controls, equipment procedures and waste inactivation. “Implemented” identifies practices described in team records. White List eligibility, Check-In and institutional authorization require their own official records.','安全建置結合生物圍堵、生物與元件選擇、化學控制、設備程序及廢棄物失活處理。「已實施」代表團隊紀錄所述的實務；白名單資格、Check-In 與機構授權各自需要正式紀錄。')
edit('Rows below cover cloning','The inventory covers cloning, HEK293 sensing and the separate <i>Drosophila</i> imaging study. White List eligibility, Check-In, vendor pathogen testing and institutional biosafety level are separate determinations. The actual fly stock and preparation require their own identity and oversight records. Competition status must be checked against the applicable iGEM rules and official team submissions.','清單涵蓋選殖、HEK293 感測及獨立的果蠅影像研究。白名單資格、Check-In、供應商病原檢測與機構生物安全等級是不同判定；實際果蠅品系及樣本準備需要各自的身分與監督紀錄。競賽狀態須對照適用的 iGEM 規則及團隊正式提交內容。')
edit('The transimpedance amplifier uses','The transimpedance amplifier starts from an LMP7721-class design with R<sub>F</sub> = 100 MΩ. Picoampere-scale leakage can resemble photocurrent at this impedance. Controlling moisture, contamination, flux residue and unguarded paths therefore protects the biological interpretation as well as the analog signal.','跨阻放大器以 LMP7721 類設計及 R_F = 100 MΩ 為起點。在此阻抗下，皮安培等級的漏電可能看似光電流；控制濕氣、污染、助焊劑殘留及未防護路徑，同時保護類比訊號與生物解讀。')
edit('AeroSense currently has low but non-zero dual-use relevance.','The current dual-use assessment covers contained laboratory chassis, insect olfactory receptors, VOC stocks and a reconfigurable sensing architecture. Its modularity creates low but non-zero dual-use relevance. Broader pathogen-associated VOC detection or other sensitive applications require renewed review.','目前的雙重用途評估涵蓋圍堵使用的實驗室宿主、昆蟲嗅覺受體、VOC 原液及可重組的感測架構。模組化帶來偏低但非零的雙重用途關聯；擴展至病原相關 VOC 偵測或其他敏感應用時，須重新審查。')
# Preserve the original hazard-link IDs rather than imposing a guessed convention.
original=BeautifulSoup(raw,'html.parser')
for a in s.select('a[href^="#hazard-"]'):
 label=txt(a);candidates=[q for q in original.select('a[href^="#"]')if txt(q)==label]
 assert candidates,label
 a['href']=candidates[0]['href']
assert before==invariant(s),'Safety scientific/safety tables, media, IDs or scripts changed'
file.write_text(str(s),encoding='utf-8')
lp=root/'locales/extras/zh-Hant/safety-and-security.json';loc=json.loads(lp.read_text(encoding='utf-8'));loc.update(zh);lp.write_text(json.dumps(loc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Attach only the dated diagnosis that directly matches an existing session.
nf=root/'js/notebook-data.js';nr=nf.read_text(encoding='utf-8');match=re.search(r'^var EVENTS=(.*);$',nr,re.M);events=json.loads(match.group(1));event=next(e for e in events if e['id']=='hw-enclosure-assembly-test')
assert event['endDate']=='2026-10-16'
note='The 16 October 2026 board-diagnosis record ended with R27 replacement and controlled-illumination verification proposed for the next iteration; those repairs and verification tests were pending at that point. Engineering Cycle 6 retains the bench observations and diagnosis.'
oldnote=event.get('sourceNote');event['sourceNote']=(oldnote+' '+note) if oldnote else note
event['relatedLinks'].append({'label':'Engineering · board tests and gain diagnosis','href':'engineering.html#hw-cycle-6'})
new=nr[:match.start(1)]+json.dumps(events,ensure_ascii=False,separators=(',',':'))+nr[match.end(1):];nf.write_text(new,encoding='utf-8')
notebook=root/'notebook.html';nhtml=notebook.read_text(encoding='utf-8');nhtml=re.sub(r'js/notebook-data\.js\?v=[a-f0-9]+','js/notebook-data.js?v='+hashlib.sha256(new.encode()).hexdigest()[:16],nhtml);notebook.write_text(nhtml,encoding='utf-8')
nloc=root/'locales/extras/zh-Hant/notebook.json';values=json.loads(nloc.read_text(encoding='utf-8'));values[note]='2026 年 10 月 16 日的電路板診斷紀錄，以建議下一輪更換 R27 並進行受控光照驗證作結；當時這些修正與驗證測試仍待執行。Engineering Cycle 6 保留桌上測試觀察與診斷。';values['Engineering · board tests and gain diagnosis']='Engineering：電路板測試與增益診斷';nloc.write_text(json.dumps(values,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'safety_prose_changes':changes,'safety_invariants_preserved':True,'notebook_event_changed':event['id'],'notebook_added_note':note,'notebook_dates_statuses_counts_unchanged':True,'already_recorded':'The 2 August V1 ERC/DRC archive and early-August window already exist in hw-v1-drc-review.','unmatched_chronology_retained_in_audit':['20 October exchange-rate snapshot','8 October integration-package label','11 October historical workbook','5 October 15:13 quotation snapshot','11 October historical Registry documentation check'],'notebook_sha256':hashlib.sha256(new.encode()).hexdigest()}
(base/'safety-notebook-editorial.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'safety_prose_edits':len(changes),'notebook_event':event['id'],'no_new_events_or_dates':True},indent=2))
