from pathlib import Path
from bs4 import BeautifulSoup
import hashlib,json,re,subprocess

SITE=Path(__file__).resolve().parents[2]
p=SITE/'results.html';html=p.read_text(encoding='utf-8')
updates={
'fig-p2-map':(
'Response maps with Test 1 on the left and Test 2 on the right, receptors in rows and stimuli in columns, on a shared −60 to +60 pp scale. The first ten receptor labels denote OR + ORCO; hatched Test 1 isopentyl-acetate cells remain excluded, and separate-well control subtraction does not establish receptor specificity.',
'反應熱圖皆以 Test 1 在左、Test 2 在右排列，列為受體、欄為刺激條件，使用共同的 −60 至 +60 個百分點色階。前十個受體標籤皆代表 OR + ORCO；Test 1 的醋酸異戊酯斜線格仍排除分析，不同孔的對照扣除無法單獨確立受體專一性。'),
'fig-vuaa1-reference':(
'Test 2 VUAA1-referenced responses, with DMSO set to 0 and VUAA1 to 1 for each construct and one well per condition; Or7a–Or98a coexpress ORCO. Orange cells retain negative ratios; †Or7a has a small VUAA1 reference (2.19 pp), making its ratios particularly sensitive to that reference.',
'Test 2 的 VUAA1 參照反應：各構築體的 DMSO 設為 0、VUAA1 設為 1，每種條件各一孔；Or7a–Or98a 皆共表現 ORCO。橘色格保留負比值；†Or7a 的 VUAA1 參照較小（2.19 個百分點），其比值因此特別受參照值影響。')
}
for fid,(en,zh) in updates.items():
    m=re.search(r'<figure\b[^>]*id="'+fid+r'"[^>]*>.*?</figure>',html,re.S)
    assert m
    fragment=BeautifulSoup(m.group(),'html.parser');caption=fragment.figcaption
    label=caption.select_one('.media-caption__label').extract()
    caption.clear();caption.append(label);caption.append(en)
    html=html[:m.start()]+str(fragment)+html[m.end():]
lp=SITE/'locales/extras/zh-Hant/results.json';translations=json.loads(lp.read_text(encoding='utf-8'))
translations.update({en:zh for en,zh in updates.values()})
lp.write_text(json.dumps(translations,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
subprocess.run(['python',str(SITE/'scripts/build-locales.py')],check=True)
def refresh(m):
    rel=m.group(2).split('?')[0];f=SITE/rel
    return m.group(1)+rel+'?v='+hashlib.sha256(f.read_bytes()).hexdigest()[:16]+m.group(3) if f.is_file()else m.group()
html=re.sub(r'((?:href|src|srcset)=")((?:css|js|fig/odor-2026-10-21)/[^"?]+(?:\?[^" ]*)?)(")',refresh,html)
p.write_text(html,encoding='utf-8')
print(json.dumps({'updated_captions':list(updates),'resource_hashes_refreshed':True}))
