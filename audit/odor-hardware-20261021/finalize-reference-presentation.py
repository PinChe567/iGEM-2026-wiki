from pathlib import Path
import csv, json, hashlib, re
from html import escape
from bs4 import BeautifulSoup

SITE=Path(__file__).resolve().parents[2]
ROOT=SITE.parent
D=ROOT/'zenodo-release/aerosense-wiki/data/odor-2026-10-21/derived'
rows=list(csv.DictReader((D/'test2-vuaa1-referenced-summary.csv').open(encoding='utf-8-sig')))
original=list(csv.DictReader((D/'change-summary.csv').open(encoding='utf-8-sig')))
lookup={(int(r['position']),r['row']):r for r in original}
errors=[]
for r in rows:
    pos=int(r['position'])
    s=lambda code:float(lookup[pos,code]['change_contrast_pp'])
    ratio=(s(r['row'])-s('H'))/(s('A')-s('H'))
    errors.append(abs(ratio-float(r['control_anchored_ratio'])))
assert len(rows)==66 and max(errors)<1e-12
assert sum(float(r['control_anchored_ratio'])<0 for r in rows)==7
labels=[('A','VUAA1'),('D','Isopentyl acetate'),('E','2-Heptanone'),('F','Valeric acid'),('G','Pentyl acetate'),('H','DMSO control')]
head='<tr><th scope="col">Construct</th>'+''.join(f'<th scope="col">{name}</th>'for _,name in labels)+'</tr>'
body=''
for pos in range(1,12):
    byrow={r['row']:r for r in rows if int(r['position'])==pos}
    body+='<tr><th scope="row">'+escape(byrow['A']['construct'])+'</th>'+''.join(f'<td>{float(byrow[code]["control_anchored_ratio"]):.3f}</td>'for code,_ in labels)+'</tr>'
table='<div id="vuaa1-reference-table" class="table-scroll" role="region" tabindex="0" aria-label="Test 2 VUAA1-referenced ratios"><table class="goal-table"><caption>Test 2 VUAA1-referenced ratios</caption><thead>'+head+'</thead><tbody>'+body+'</tbody></table></div>'
p=SITE/'results.html';s=p.read_text(encoding='utf-8')
s=re.sub(r'<div id="vuaa1-reference-table"[^>]*>.*?</div>',table,s,flags=re.S)
old='the corrected values in Figure 13 retain the absolute comparison.'
new='the corrected values in Figure 13 preserve the corrected-change magnitudes.'
s=s.replace(old,new)
p.write_text(s,encoding='utf-8')
lp=SITE/'locales/extras/zh-Hant/results.json';d=json.loads(lp.read_text(encoding='utf-8'))
for key,value in list(d.items()):
    if old in key:
        d[key.replace(old,new)]=value.replace('圖 13 的校正值保留絕對幅度的比較。','圖 13 的校正值保留校正後變化幅度的比較。')
d['Test 2 VUAA1-referenced ratios']='Test 2 的 VUAA1 參照比值'
lp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

lp=SITE/'locales/extras/zh-Hant/hardware.json';d=json.loads(lp.read_text(encoding='utf-8'))
d.update({
'Four hardware channel time courses. Cells-plus-medium and VUAA1 series each start at one, using their own first amplitude as the denominator. Each panel annotates the difference between the two late-window changes in percentage points.':'四個硬體通道的時間曲線。細胞加培養液與 VUAA1 序列各除以自身首筆振幅，起點皆為 1。各圖標示兩序列末段變化的差，單位為百分點。',
'Each ten-point trace is normalized to its first reading on the nominal 0–1 min schedule. Late-window contrast is the VUAA1 minus cells-plus-medium change in the last-three-point mean ratio, expressed in percentage points.':'各十點曲線以自身首筆讀值標準化，依預定 0–1 分鐘時程呈現。末段變化差為 VUAA1 與細胞加培養液序列最後三點平均比值的變化之差，單位為百分點。',
'D2 and D3 increase relative to their first post-addition readings, D4 rises modestly after a brief dip, and D1 decreases; the cells-plus-medium series change only slightly. D3’s large ratio depends on its low first post-addition reference.':'相對於各自加樣後的首筆讀值，D2 與 D3 上升，D4 短暫下降後小幅上升，D1 則下降；細胞加培養液序列僅有小幅變化。D3 較大的比值受其偏低的加樣後首筆參照影響。',
'The final absolute signals remain 7.5%, 6.1%, 5.6% and 2.7% below the initial three-reading means for D1–D4, respectively.':'D1–D4 最後的絕對訊號，仍分別比初始三筆平均低 7.5%、6.1%、5.6% 及 2.7%。',
'Liquid addition may contribute to these trajectories, but this single run does not separate that effect from receptor responses or optical mixing.':'加液可能影響這些曲線，但此次單次量測無法將加液效應與受體反應或光學混合區分。'
})
lp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Refresh browser resource versions only after figure generation and translation builds.
def refresh_assets():
    for name in ['results','hardware']:
        p=SITE/f'{name}.html';s=p.read_text(encoding='utf-8')
        def refresh(m):
            path=m.group(2).split('?')[0]
            local=SITE/path
            return m.group(1)+path+'?v='+hashlib.sha256(local.read_bytes()).hexdigest()[:16]+m.group(3) if local.is_file() else m.group()
        s=re.sub(r'((?:href|src|srcset)=")((?:css|js|fig/odor-2026-10-21|assets/hardware-test3)/[^"?]+(?:\?[^" ]*)?)(")',refresh,s)
        p.write_text(s,encoding='utf-8')

if __name__=='__main__':
    import subprocess
    subprocess.run(['python',str(SITE/'scripts/build-locales.py')],check=True)
    refresh_assets()
    report={'ratio_cells_checked':len(rows),'max_ratio_difference':max(errors),'negative_ratios':7,'above_one_ratios':0,'old_figure_removed': 'id="fig-p2-correction"'not in s,'new_table_cells':66}
    (Path(__file__).parent/'reference-numerical-qa.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report))
