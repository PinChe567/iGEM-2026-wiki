"""Public figure captions and bilingual vector experiment schematics."""
from html import escape
from pathlib import Path
from receptor_result_figures import RESULT_FIGURES
from receptor_context_figures import CONTEXT_FIGURES
from receptor_molecular_features import MOLECULAR_FIGURES

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/receptor-engineering'

FIGURES={
 'receptor-panel': {
  'title':('Choosing the first receptors','挑選第一輪受體'), 'kind':'data', 'size':(900,430), 'data':'receptor-panel.csv',
  'caption':('Published mean responses for the five-receptor screening panel, comparing the selected mold-related odorants with controls. Or35a and Or22a show the largest positive panel differences here. These are literature measurements, not team-generated functional tests; panel preference does not establish specificity to mold.','五個受體篩選組的公開反應平均值，比較選定的霉味相關氣味與對照。Or35a、Or22a 在此組合中呈現較大的正向差異。數據來自文獻，並非團隊新做的功能實驗；組合偏好不代表霉菌專一性。')},
 'mutation-contacts': {
  'title':('Checking the proposed mutation mechanism','檢查突變機制是否合理'), 'kind':'data','size':(1000,440),'data':'mutation-contacts.csv',
  'caption':('Minimum mutated-side-chain distance to each odorant in the historical top docking pose. Blue outlines mark distances ≤4.5 Å. F34Y and E196Q are distant from the ligand in these poses; I87V illustrates that geometrical contact alone does not establish improved panel selectivity. Values are pose-level geometry, not binding energies.','歷史最佳 docking 姿態中，突變側鏈到各氣味分子的最近距離。藍框標出 ≤4.5 Å 的接觸。F34Y、E196Q 在這些姿態中距配體較遠；I87V 則說明有幾何接觸仍不代表專一性改善。數值是姿態幾何，不是結合能。')},
 'reference-complex': {
  'title':('Where is the odorant in the receptor complex?','氣味分子位於複合體的哪裡？'), 'kind':'structure','size':(1000,520),'data':None,
  'caption':('Cα traces and o-cresol heavy atoms from experimental PDB 8V02. Teal is OR10, gray-green the three Orco subunits, and orange the odorant. Missing resolved-chain segments remain disconnected. The tan band is a homology-transferred membrane-orientation reference, not observed lipids. This figure shows the structural starting reference, not an MD trajectory.','實驗結構 PDB 8V02 的 Cα 骨架與 o-cresol 重原子。藍綠為 OR10，灰綠為三個 Orco，橘色為氣味分子。未解析區段保持斷開；米色區帶是同源轉移的膜方向參考，不是觀察到的脂質。此圖呈現結構起點，並非 MD 軌跡。')},
 'entry-design': {
  'title':('Three ways to increase receptor encounters','三種增加接觸機會的設計'), 'kind':'schematic','size':(960,365),'data':None,
  'caption':('Placement schemes used to distinguish diffusion to the receptor from pocket entry. Orange shapes indicate initial odorant positions; the first panel shows alternative water and interface placements. The drawings do not show observed trajectories. More available molecules or a shorter starting distance did not establish sustained entry in the analyzed simulations. The concentration comparison remains exploratory.','以起始放置方式，區分分子擴散到受體與進入口袋。橘色表示氣味分子起點，第一格的水相與界面為兩種替代配置；圖中沒有畫出實際進入軌跡。已分析模擬中，增加可接觸分子或縮短起始距離仍未建立持續進入；濃度比較屬探索性研究。')},
 'force-design': {
  'title':('Two different targets for an applied force','施力的對象不同，問題也不同'), 'kind':'schematic','size':(960,350),'data':None,
  'caption':('Left: SMD couples the odorant to a moving target using a spring. Right: a separate protocol guides S3/S6 reference distances while applying no direct pulling force to the odorant. Blue arrows indicate imposed guidance, not observed trajectories. Both protocols test constrained conditions and do not measure natural entry or exit rates.','左：SMD 以彈簧將氣味分子連接到移動目標。右：另一流程引導 S3／S6 參考距離，分子本身不受直接牽引。藍色箭頭表示施加的引導，不是觀察到的軌跡。兩種方法皆研究受控條件，不能據此量測自然進出速率。')},
 'gate70': {
  'title':('Entrance motion and odorant release are different readouts','入口運動與分子移出是不同的指標'), 'kind':'data','size':(1000,640),'data':'gate70-traces.csv',
  'caption':('Recorded 70 ns trajectories for two starting conformations. Upper panels show the mismatch of S3/S6 reference distances to apo values; lower panels show odorant distance from the pocket center. Lines are 0.1 ns-bin medians for readability. Shading marks the final bias-removal interval. The full saved-frame analysis found no sustained exit; a decrease in entrance-distance error is not evidence of a passable tunnel.','兩個起始構型的 70 ns 軌跡。上方為 S3／S6 參考距離相對 apo 值的誤差，下方為氣味分子到口袋中心的距離。為方便閱讀，以每 0.1 ns 區間的中位數繪線；底色標示最後撤除偏置的區間。完整保存影格分析未見持續移出；入口距離誤差降低不等同通道可通行。')},
 'pathway-clashes': {
  'title':('Do other receptor conformations open a route?','換一個受體構型，就有路可走嗎？'), 'kind':'data','size':(1050,470),'data':'pathway-clashes.csv',
  'caption':('Peak positive Lennard–Jones repulsion along selected whole-ligand paths, including protein and lipids. Each starting structure contributes snapshots at the indicated times, evaluated separately in two corridors. Lower values mean fewer severe clashes in this diagnostic, not a validated passage. Even the lowest path peak is far above its native-pose reference; these are not free-energy barriers. Related snapshots are not independent experiments.','選定完整分子路線中，蛋白加脂質的最高 Lennard–Jones 正值排斥。各起始構型在列出時間取快照，分別評估兩條走廊。較低值表示此診斷中的嚴重碰撞較少，不代表已驗證可通行；最低的沿路峰值仍遠高於原始結合姿態參考。這些數值不是自由能障，相關快照也不是獨立實驗。')},
 'next-test': {
  'title':('A controlled test of coordinated motion','以對照實驗檢驗協同運動'), 'kind':'planned','size':(960,330),'data':None,
  'caption':('Proposed next iteration: compare small guided ligand movements followed by local relaxation with a matched no-pull condition. Track the timing of side-chain, lipid and water rearrangements relative to ligand motion. This diagram describes a future comparison; it does not show an established mechanism or a completed experiment.','下一輪擬比較小幅引導分子移動後的局部鬆弛，以及相配的不牽引條件；追蹤側鏈、脂質、水的重排相對於分子運動的先後。這是未來的比較設計，不是已確立的機制或已完成的實驗。')}
}
FIGURES.update(RESULT_FIGURES)
FIGURES.update(CONTEXT_FIGURES)
FIGURES.update(MOLECULAR_FIGURES)
for name in ('mutation-contacts', 'gate70', 'pathway-clashes'):
    FIGURES[name]['kind'] = 'result'

def figure(name,lang):
    index=0 if lang=='en' else 1
    f=FIGURES[name];title=f['title'][index];caption=f['caption'][index]
    labels={'data':('Published measurements','公開實驗數據'),'result':('Our computational results','本研究計算結果'),'structure':('Experimental structure','實驗結構'),'schematic':('Method schematic','方法示意'),'planned':('Proposed experiment','待測設計')}
    kind=labels[f['kind']][index];w,h=f['size'];path=f'assets/receptor-engineering/{name}-{lang}.svg'
    data=f'<a href="assets/receptor-engineering/{f["data"]}" download>{"Data CSV" if lang=="en" else "數據 CSV"} ↓</a>' if f.get('data') else ''
    if f.get('extra_data'):
        label=('Contributors CSV' if lang=='en' else '排斥貢獻 CSV') if name=='path-repulsion-profile' else ('Supporting data CSV' if lang=='en' else '補充數據 CSV')
        data += f'<a href="assets/receptor-engineering/{f["extra_data"]}" download>{label} ↓</a>'
    return f'''<figure class="re-figure re-story-figure" id="fig-{name}"><div class="re-figure-head"><span class="re-figure-kind re-figure-kind--{f['kind']}">{kind}</span><h3>{escape(title)}</h3></div><button type="button" class="re-figure-open" data-re-zoom aria-label="{'Enlarge figure: ' if lang=='en' else '放大圖表：'}{escape(title)}"><img src="{path}" alt="{escape(caption)}" width="{w}" height="{h}" loading="lazy"><span class="re-zoom-hint">{'Enlarge ↗' if lang=='en' else '點圖放大 ↗'}</span></button><figcaption>{escape(caption)}</figcaption><div class="re-figure-links"><a href="{path}" download>{'Vector SVG' if lang=='en' else '向量圖 SVG'} ↓</a>{data}</div></figure>'''

def text(x,y,lines,size=16,color='#173e2b',weight='normal',anchor='middle'):
    if isinstance(lines,str):lines=[lines]
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">'+''.join(f'<tspan x="{x}" dy="{0 if i==0 else size*1.5}">{escape(s)}</tspan>' for i,s in enumerate(lines))+'</text>'

def odor(x,y,r=9):
    return f'<path d="M {x} {y-r} l {r*.87} {r*.5} v {r} l {-r*.87} {r*.5} l {-r*.87} {-r*.5} v {-r} Z" fill="#e8a33d" stroke="#8e5c21" stroke-width="1.5"/>'

def receptor(x=0,y=0):
    return f'<g transform="translate({x},{y})"><rect x="20" y="95" width="270" height="105" rx="5" fill="#f0e8ca"/><rect x="20" y="95" width="270" height="9" fill="#dccc97"/><rect x="20" y="191" width="270" height="9" fill="#dccc97"/><path d="M100 74 Q135 65 132 110 L126 177 Q110 220 95 200 L94 119 Z" fill="#9ac3b4" stroke="#447765" stroke-width="2"/><path d="M180 74 Q160 65 158 109 L165 135 Q150 162 177 204 L197 201 L194 116 Z" fill="#9ac3b4" stroke="#447765" stroke-width="2"/><ellipse cx="146" cy="138" rx="17" ry="23" fill="#fffdf7" stroke="#68836d" stroke-dasharray="4 4"/></g>'

def base(w,h):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="Arial, Noto Sans CJK TC, sans-serif"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#087789"/></marker></defs><rect width="100%" height="100%" fill="white"/>'

def build_schematics():
    for lang in ['en','zh']:
        def t(en,zh):return en if lang=='en' else zh
        s=base(960,365)
        titles=[t('External water / interface','外部水相／界面'),t('More available odorant','提高局部分子數'),t('Near the candidate entrance','放到候選入口附近')]
        notes=[t('Wait for an encounter','等待分子碰到受體'),t('Increase encounter opportunities','增加與受體接觸的機會'),t('Shorten the initial distance','縮短起點到入口的距離')]
        for i in range(3):
            x=i*320;s+=f'<g transform="translate({x},0)"><rect x="6" y="5" width="308" height="306" rx="12" fill="#fafbf7" stroke="#d2ddd0"/>'+text(160,35,titles[i],16,weight='bold')+receptor(0,24)
            if i==0:s+=odor(65,83)+odor(68,129)+text(251,167,t('membrane','脂膜'),12,color='#7b6938')
            elif i==1:
                for a,b in [(60,80),(96,68),(146,76),(205,77),(244,82),(65,118),(239,111)]:s+=odor(a,b,6)
            else:s+=odor(207,163)+f'<path d="M218 158 L266 101" stroke="#9c6b2a" stroke-width="1.4"/>'+text(258,86,t('start','起點'),12,color='#8e5c21')
            s+=text(160,284,notes[i],14)+'</g>'
        s+=text(480,345,t('Initial placements only · no entry trajectory is implied','僅表示起始配置｜不代表觀察到進入軌跡'),14,color='#6d7255')+'</svg>'
        (ASSETS/f'entry-design-{lang}.svg').write_text(s)
        s=base(960,350)
        for i in range(2):
            s+=f'<g transform="translate({i*480},0)"><rect x="10" y="5" width="460" height="316" rx="12" fill="#fafbf7" stroke="#d2ddd0"/>'
            s+=text(240,35,t('Pull the odorant','直接拉氣味分子') if i==0 else t('Guide receptor distances','引導受體入口距離'),18,weight='bold')+receptor(80,25)+odor(226,163)
            if i==0:
                s+='<path d="M237 163 l 12 -7 l 12 14 l 12 -14 l 12 14 l 12 -14 l 12 7 H384" stroke="#087789" stroke-width="2.5" fill="none" marker-end="url(#arrow)"/><circle cx="349" cy="163" r="15" fill="none" stroke="#087789" stroke-dasharray="4 3"/>'
                s+=text(340,121,t('spring + target','彈簧＋目標'),13,color='#087789')
                s+=text(240,285,t('Force acts on the ligand','力作用在配體上'),15)
            else:
                s+='<path d="M185 119 H130" stroke="#087789" stroke-width="3" fill="none" marker-end="url(#arrow)"/><path d="M270 119 H326" stroke="#087789" stroke-width="3" fill="none" marker-end="url(#arrow)"/>'
                s+=text(135,95,'S3',13)+text(327,95,'S6',13)
                s+=text(240,285,t('No direct ligand pull','氣味分子不受直接牽引'),15)
            s+='</g>'
        s+='</svg>';(ASSETS/f'force-design-{lang}.svg').write_text(s)
        s=base(960,330)
        labels=[t('Start from the same local state','由相同局部狀態出發'),t('Compare with / without guidance','比較引導與不引導'),t('Read out the order of motion','檢查運動的先後順序')]
        for i,title in enumerate(labels):
            x=10+i*320;s+=f'<rect x="{x}" y="35" width="295" height="250" rx="12" fill="#f6f7ef" stroke="#ccd6c9"/>'+text(x+148,72,title,15,weight='bold')
            if i==0:
                s+=f'<path d="M{x+60} 120 Q{x+105} 100 {x+119} 172 L{x+96} 219 M{x+215} 120 Q{x+166} 112 {x+170} 173 L{x+205} 219" fill="none" stroke="#8db5a1" stroke-width="23"/>'+odor(x+146,165,13)+text(x+148,256,t('Candidate route + environment','候選路徑＋周圍環境'),13)
            elif i==1:
                s+=text(x+148,125,t('Small step → local relaxation','小幅移動 → 局部鬆弛'),15,color='#087789')+text(x+148,173,t('versus','對照'),13,color='#647568')+text(x+148,217,t('No pull → local relaxation','不牽引 → 局部鬆弛'),15)
            else:
                s+=text(x+148,131,[t('Ligand position and orientation','配體位置與朝向'),t('Side chains · lipids · water','側鏈・脂質・水'),t('Clashes · force removal','碰撞・撤力後行為')],15)
            if i<2:s+=f'<path d="M{x+297} 164 H{x+316}" stroke="#087789" stroke-width="2" marker-end="url(#arrow)"/>'
        s+=text(480,316,t('PROPOSED STUDY · outcomes are not yet known','待測研究｜尚無此設計的結果'),14,color='#83713c')+'</svg>'
        (ASSETS/f'next-test-{lang}.svg').write_text(s)

if __name__=='__main__':build_schematics()
