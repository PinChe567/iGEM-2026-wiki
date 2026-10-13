"""Visible local terminology explanations and linked author–date citations.

Definitions are repeated at the first mention in independently readable research
blocks and figure captions. They are real text, available on mobile and in print.
Scientific results, image assets and downloadable measurements are not modified.
"""
from html import escape
import json
import re
from bs4 import BeautifulSoup, NavigableString, Tag


def term(key, pattern, en, zh, refs=()):
    return dict(key=key, pattern=pattern, en=en, zh=zh, refs=list(refs))


TERMS = [
    term('8v00', r'8V00', 'PDB ID for the experimentally determined odorant-free OR10–Orco complex', 'PDB 結構編號：實驗解析、未結合氣味分子的 OR10–Orco 複合體', [2]),
    term('8v02', r'8V02', 'PDB ID for the experimentally determined o-cresol-bound OR10–Orco complex', 'PDB 結構編號：實驗解析、已結合鄰甲酚的 OR10–Orco 複合體', [2]),
    term('pdb', r'PDB', 'Protein Data Bank, the archive of molecular 3D structures', 'Protein Data Bank，保存分子三維結構的資料庫', [19]),
    term('door', r'DoOR(?: 2\.0)?', 'Database of Odorant Responses; integrates published fly odor-response profiles', 'Database of Odorant Responses，整合果蠅氣味反應資料的資料庫', [6]),
    term('pubchem', r'PubChem', 'public chemical database used here to identify odorant structures', '公開化學資料庫；本研究用來核對氣味分子的化學結構', [11]),
    term('alphafolddb', r'AlphaFold (?:Protein Structure Database|DB)', 'public database of precomputed AlphaFold structure predictions', '公開保存預先計算之 AlphaFold 結構預測的資料庫', [24]),
    term('alphafold', r'AlphaFold', 'AI system that predicts protein 3D structures from sequence', '從蛋白序列預測三維結構的 AI 系統', [4]),
    term('colabfold', r'ColabFold', 'protein-structure prediction workflow built around AlphaFold and fast sequence searches', '結合 AlphaFold 與快速序列搜尋的蛋白結構預測流程', [5]),
    term('esm', r'ESM-?2|ESM', 'protein language model used here to turn sequences into numerical features', '蛋白語言模型；此處將胺基酸序列轉為數值特徵', [12]),
    term('embedding', r'embeddings?', 'a numerical vector representing a sequence or molecule', '代表序列或分子資訊的數值向量'),
    term('ir', r'IR', 'infrared absorption: how a molecule absorbs light at different vibrational frequencies', '紅外線吸收：分子對不同振動頻率光線的吸收'),
    term('eva', r'EVA', 'a fixed-length descriptor formed by smoothing equally weighted normal-mode frequencies', '將等權重正常振動頻率平滑後，形成固定長度的描述子', [28]),
    term('pom', r'OpenPOM|POM', 'Principal Odor Map; OpenPOM is its open-source reproduction for learned molecular odor features', 'Principal Odor Map；OpenPOM 為其開源重現版，用來學習分子氣味特徵', [31, 32]),
    term('pca', r'PCA', 'principal component analysis, which compresses features along directions of greatest variation', '主成分分析，依特徵變異方向壓縮維度'),
    term('nist', r'NIST(?: Chemistry WebBook)?', 'US National Institute of Standards and Technology; its Chemistry WebBook supplies spectral records', '美國國家標準暨技術研究院；Chemistry WebBook 提供分子頻譜資料', [27]),
    term('identity', r'(?:full-length |global )?identity', 'fraction of aligned amino-acid positions that are identical', '對齊後胺基酸位置相同的比例'),
    term('or10', r'AaegOR10|AaOR10|OR10', 'odorant receptor 10 from Aedes aegypti, the yellow-fever mosquito', '埃及斑蚊 Aedes aegypti 的第 10 號氣味受體', [2]),
    term('aaegorco', r'AaegOrco', 'the odorant-receptor co-receptor from Aedes aegypti', '埃及斑蚊的氣味受體共同受體', [8]),
    term('aborco', r'AbOrco', 'the odorant-receptor co-receptor from the fig wasp Apocrypta bakeri', '榕小蜂 Apocrypta bakeri 的氣味受體共同受體', [2]),
    term('orco', r'Orco', 'odorant-receptor co-receptor, a shared partner that forms the channel with the odor-selective OR', '氣味受體共同受體，與辨識氣味的 OR 一起組成離子通道', [2]),
    term('or', r'OR', 'odorant receptor, the odor-selective subunit', 'odorant receptor，負責辨識氣味的受體次單元', [2]),
    term('flyor', r'Or(?:35a|22a|85b|98a|67a)', 'one of the named Drosophila melanogaster odorant receptors in our design panel', '本研究設計組合中的黑腹果蠅 Drosophila melanogaster 氣味受體名稱', [1]),
    term('agor', r'AgOr\d+', 'an Anopheles gambiae odorant receptor; Ag identifies the mosquito species', 'Anopheles gambiae 蚊子的氣味受體名稱；Ag 表示物種', [7]),
    term('wt', r'WT', 'wild type: the unmutated reference sequence', 'wild type，未加入設計突變的野生型序列'),
    term('apo', r'apo', 'the odorant-free state', '未結合氣味分子的狀態'),
    term('holo', r'holo', 'the odorant-bound state', '已結合氣味分子的狀態'),
    term('cresol', r'o-cresol', '2-methylphenol, the odorant resolved in 8V02', '鄰甲酚，又稱 2-methylphenol；8V02 中觀察到的氣味分子', [2]),
    term('cryoem', r'cryo-EM|cryo-electron microscopy', 'cryo-electron microscopy: reconstructing molecular structures from electron images of frozen samples', '冷凍電子顯微鏡：由冷凍樣本的電子影像重建分子結構'),
    term('docking', r'docking|molecular docking', 'computationally placing and scoring ligand poses in a receptor', '分子對接：搜尋分子在受體中的位置與朝向，並計算分數', [13]),
    term('delta-vina', r'ΔVina', 'mutant docking score minus the corresponding wild-type score', '突變體 docking 分數減去相應野生型分數'),
    term('vina', r'AutoDock Vina|Vina', 'AutoDock Vina docking score; lower scores are more favorable in this model, not a measured response', 'AutoDock Vina 對接分數；在此模型中越低越有利，並非實測反應大小', [13, 23]),
    term('usalign', r'US-align', 'software that aligns 3D molecular structures', '比較並對齊分子三維結構的軟體', [14]),
    term('md', r'MD', 'molecular dynamics: computing atomic motion step by step from a force field', '分子動力學：依力場逐步計算原子如何運動', [9]),
    term('smd', r'SMD', 'steered molecular dynamics: MD with an applied guiding force', '牽引式分子動力學：在 MD 中加入外力引導運動', [22]),
    term('openmm', r'OpenMM', 'the software engine that integrates the atomic equations of motion', '逐步計算原子運動方程式的模擬引擎', [9]),
    term('plddt', r'pLDDT', 'predicted local structure confidence on a 0–100 scale; higher is more confident', '局部結構預測信心分數，範圍 0–100；越高表示模型越有信心', [4]),
    term('pae', r'PAE', 'predicted aligned error, an estimate of uncertainty in relative residue placement; lower is more confident', '預測對齊誤差，估計殘基彼此相對位置的不確定度；越低越有信心', [4]),
    term('rmsd', r'RMSD', 'root-mean-square deviation: positional difference after the stated structural alignment', '均方根偏差：依指定方式對齊後，原子位置的整體差異'),
    term('rmse', r'RMSE', 'root-mean-square error relative to the selected reference values', '均方根誤差：相對指定參考值的整體誤差'),
    term('ca', r'Cα', 'alpha-carbon atoms, used to trace the protein backbone', 'α 碳原子，用來描述蛋白質主鏈骨架'),
    term('s3s6', r'S3[/／]S6|S3|S6', 'labels for the third and sixth membrane-spanning helices of OR10', 'OR10 第三與第六段跨膜螺旋的結構編號', [2]),
    term('lj', r'Lennard[–-]Jones|LJ', 'an atomic interaction potential; only its positive repulsive part is summed in our clash scans', '描述原子交互作用的位能；此處碰撞掃描只加總其中的正值排斥部分'),
    term('pmf', r'PMF', 'potential of mean force: a free-energy profile along a chosen coordinate', '平均力位能：沿指定反應座標的自由能曲線'),
    term('forcefield', r'force fields?|力場', 'equations and parameters used to approximate forces between atoms', '用來近似原子間作用力的方程式與參數組'),
    term('ligand', r'ligands?|配體', 'a molecule that can bind to a receptor; here, the tested odorant', '能與受體結合的分子，此處指受測氣味分子'),
    term('pocket', r'pockets?|口袋', 'a local cavity in the receptor that can accommodate the ligand', '受體內可容納配體的局部凹穴'),
    term('popc', r'POPC', 'a phosphatidylcholine lipid used to build the model membrane', '一種磷脂醯膽鹼脂質，此處用來建立模擬脂膜'),
    term('tip3p', r'TIP3P', 'a three-site water model used in molecular simulations', '以三個作用點描述水分子的模擬模型', [16]),
    term('ff14sb', r'ff14SB', 'the Amber parameter set for protein atomic interactions', 'Amber 系列的蛋白質原子交互作用參數組', [15]),
    term('lipid17', r'Lipid17', 'the Amber parameter set for lipid atomic interactions', 'Amber 系列的脂質原子交互作用參數組', [20]),
    term('gaff', r'GAFF(?: 2\.2\.20)?', 'General Amber Force Field; here version 2.2.20 supplies small-molecule parameters', 'General Amber Force Field；本研究以 2.2.20 版提供小分子力場參數', [17]),
    term('am1bcc', r'AM1-BCC', 'a method for assigning approximate partial charges to ligand atoms', '為配體原子估算部分電荷的方法', [18]),
    term('pme', r'PME', 'particle-mesh Ewald, a method for long-range electrostatics in periodic boxes', '粒子網格 Ewald 法，用來計算週期模擬盒中的長程靜電作用', [20]),
    term('nvt', r'NVT', 'constant particle number, volume and temperature', '固定粒子數、體積與溫度的模擬條件'),
    term('sem', r'SEM', 'standard error of the mean, describing uncertainty in an estimated mean', '平均值標準誤，描述估計平均值的不確定度'),
    term('sd', r'SD', 'standard deviation, describing spread among observations', '標準差，描述觀測值的分散程度'),
    term('ec50', r'EC50', 'concentration producing half the maximal response in a specified functional assay', '在指定功能測試中，產生一半最大反應所需的濃度'),
    term('spearman', r'Spearman(?: ρ)?', 'rank correlation, from −1 to +1; it measures ordering, not prediction accuracy as a percentage', '排序相關係數，範圍 −1 至 +1；比較排序是否一致，不是百分比準確率'),
    term('pearson', r'Pearson', 'correlation measuring linear similarity between numerical profiles', '衡量數值輪廓線性相似程度的相關係數'),
    term('delta-r2', r'ΔR²', 'difference in R² between the compared models', '兩個比較模型之間的 R² 差值'),
    term('r2', r'R²', 'coefficient of determination; 1 is perfect, 0 matches the mean baseline, and negative values are worse', '決定係數；1 為完全吻合，0 與平均值基準相當，負值表示比此基準差'),
    term('bh', r'BH(?:-adjusted)?', 'Benjamini–Hochberg multiple-testing correction; q is the adjusted p-value reported here', 'Benjamini–Hochberg 多重檢定校正；此處 q 為校正後的 p 值', [21]),
    term('bootstrap', r'bootstrap|bootstrapping', 'resampling observations or groups to assess statistical uncertainty', '對資料或群組重抽樣，以評估統計不確定度'),
    term('hgb', r'histogram gradient boosting|HGB', 'a tree-ensemble prediction model that successively corrects errors using binned features', '以分箱特徵建立決策樹，逐步修正誤差的集成預測模型'),
    term('extratrees', r'ExtraTrees', 'an ensemble of decision trees with randomized splitting rules', '以隨機切分規則建立多棵決策樹的集成模型'),
    term('medoid', r'medoids?', 'an actual sampled conformation selected to represent a cluster', '從已取樣構型中選出的群集代表構型'),
    term('clogp', r'cLogP|clogp', 'calculated octanol–water partition coefficient on a logarithmic scale, a lipophilicity descriptor', '計算的辛醇／水分配係數對數，用來描述親脂性'),
    term('assay', r'assays?', 'a defined experimental test of biological activity', '依特定條件進行的生物活性測試'),
    term('aa', r'aa', 'amino-acid residues', '胺基酸殘基數'),
    term('spikes', r'spikes/s', 'neuronal action potentials recorded per second', '每秒記錄到的神經動作電位次數'),
    term('nm', r'nm', 'nanometers; 1 nm = 10⁻⁹ meters', '奈米；1 nm＝10⁻⁹ 公尺'),
    term('angstrom', r'Å', 'ångström; 1 Å = 0.1 nm', '埃；1 Å＝0.1 奈米'),
    term('ns', r'ns', 'nanoseconds, 10⁻⁹ seconds', '奈秒，10⁻⁹ 秒'),
    term('ps', r'ps', 'picoseconds, 10⁻¹² seconds', '皮秒，10⁻¹² 秒'),
    term('fs', r'fs', 'femtoseconds, 10⁻¹⁵ seconds', '飛秒，10⁻¹⁵ 秒'),
    term('mutation', r'[ACDEFGHIKLMNPQRSTVWY]\d+[ACDEFGHIKLMNPQRSTVWY]', '', ''),
    term('residue', r'(?:Ser|Leu|Ile|Tyr|Met|Gln)\d+|[ACDEFGHIKLMNPQRSTVWY]\d{2,3}', '', ''),
]

AMINO_ACIDS = {'A':('alanine','丙胺酸'),'C':('cysteine','半胱胺酸'),'D':('aspartate','天門冬胺酸'),'E':('glutamate','麩胺酸'),'F':('phenylalanine','苯丙胺酸'),'G':('glycine','甘胺酸'),'H':('histidine','組胺酸'),'I':('isoleucine','異白胺酸'),'K':('lysine','離胺酸'),'L':('leucine','白胺酸'),'M':('methionine','甲硫胺酸'),'N':('asparagine','天門冬醯胺'),'P':('proline','脯胺酸'),'Q':('glutamine','麩醯胺酸'),'R':('arginine','精胺酸'),'S':('serine','絲胺酸'),'T':('threonine','蘇胺酸'),'V':('valine','纈胺酸'),'W':('tryptophan','色胺酸'),'Y':('tyrosine','酪胺酸')}

PATTERN = re.compile('|'.join(
    f'(?P<t{i}>(?<![A-Za-z0-9_])(?:{t["pattern"]})(?![A-Za-z0-9_]))'
    for i,t in enumerate(TERMS)), re.I)

# External origins of data or methods, distinct from our calculated results.
FIGURE_SOURCES = {
    'response-matrix': ('data', [1]), 'receptor-panel': ('data', [1]),
    'prediction': ('data', [1]), 'full-ablation': ('data', [1]),
    'cross-transfer': ('data', [1,7]), 'cross-fragments': ('data', [1,7]),
    'reference-complex': ('structure', [2]), 'loop-confidence': ('method', [2,4]),
    'ranking': ('data', [3]), 'odor-response-scatter': ('data', [3]),
    'functional-seven': ('data', [8]),
    'mutation-contacts': ('method', [5,13]), 'mutation-robustness': ('method', [5,13]),
}


def citation_html(ids, references):
    lookup={str(r['id']):r for r in references}
    links=[]
    for number in dict.fromkeys(map(str,ids)):
        r=lookup[number]
        links.append(f'<a href="#ref-{number}">{escape(r["short"])}</a>')
    return '<span class="re-citation">('+ '; '.join(links)+')</span>'


def structure_key(lang, references):
    def t(en,zh):return en if lang=='en' else zh
    cite=lambda ids:citation_html(ids,references)
    return f'''<section class="re-structure-key" id="structure-guide" aria-labelledby="structure-guide-title" data-re-no-terms>
<p class="re-kicker">{t('Read the structure names','先讀懂結構名稱')}</p>
<h2 id="structure-guide-title">{t('What are 8V00 and 8V02?','8V00 與 8V02 是什麼？')}</h2>
<p>{t('They are accession IDs in the Protein Data Bank (PDB), a public archive of molecular 3D structures. Each ID points to a deposited coordinate model and its experimental records.', '這兩個代碼是 Protein Data Bank（PDB，分子三維結構資料庫）的登錄編號；每個編號對應一份公開的原子座標模型及其實驗紀錄。')} {cite([19])}</p>
<p>{t('Both structures were determined by cryo-electron microscopy (cryo-EM), which reconstructs molecular structures from electron images of frozen samples. Both contain one odor-selective OR10 subunit from Aedes aegypti (the yellow-fever mosquito) and three Orco co-receptor subunits from the fig wasp Apocrypta bakeri. Orco is the shared partner that helps form the odorant-gated ion channel. This is an experimentally assembled complex combining proteins from two species.', '兩者皆由冷凍電子顯微鏡（cryo-EM，以冷凍樣本的電子影像重建分子結構）解析：由一個埃及斑蚊 Aedes aegypti 的 OR10（第 10 號氣味受體）及三個榕小蜂 Apocrypta bakeri 的 Orco（氣味受體共同受體）組成。Orco 與辨識氣味的 OR10 共同形成離子通道；這是實驗中組成、蛋白來自兩個物種的複合體。')} {cite([2])}</p>
<div class="re-evidence-table" role="region" tabindex="0" aria-label="{t('Structure comparison','結構比較')}"><table><thead><tr><th>{t('PDB entry','PDB 編號')}</th><th>{t('What was observed','實驗觀察狀態')}</th><th>{t('Use in our study','本研究用途')}</th></tr></thead><tbody>
<tr><th scope="row"><a href="https://www.rcsb.org/structure/8V00">8V00</a></th><td>{t('Apo: no bound odorant. Experimental resolution: 2.88 Å (1 Å = 0.1 nm).','Apo（未結合態）：沒有結合氣味分子。實驗解析度為 2.88 Å（埃；1 Å＝0.1 奈米）。')}</td><td>{t('Odorant-free structural reference; a starting template for apo MD and static docking comparisons.','未結合態結構參考；用於無配體 MD 的起始模板及靜態 docking 比較。')}</td></tr>
<tr><th scope="row"><a href="https://www.rcsb.org/structure/8V02">8V02</a></th><td>{t('Odorant-bound (holo): o-cresol (2-methylphenol) is resolved in the OR10 pocket. Experimental resolution: 2.90 Å.','Holo（結合態）：OR10 口袋中可見 o-cresol（鄰甲酚，又稱 2-methylphenol）。實驗解析度為 2.90 Å。')}</td><td>{t('Reference for the bound ligand pose, bound-state MD, and candidate outward-path studies.','提供已結合分子的姿態，用於結合態 MD 與候選向外路徑研究。')}</td></tr>
</tbody></table></div>
<p>{t('MD means molecular dynamics: calculating atomic motion over time. Docking searches and scores candidate ligand positions and orientations. The PDB entries are experimental coordinate models, not simulation trajectories or AlphaFold predictions (AI predictions of protein structures from sequence). Before MD we rebuilt unresolved regions and added a membrane, water and ions; those additions are computational model assumptions. A bound experimental structure establishes an observed pose, not the route the odorant took to reach it.', 'MD（分子動力學）逐步計算原子隨時間的運動；docking（分子對接）搜尋分子在受體中的位置與朝向並評分。PDB 條目本身是實驗座標模型，不是模擬軌跡或 AlphaFold（由序列預測蛋白結構的 AI 系統）預測。我們在 MD 前補建未解析區域，並加入脂膜、水及離子；這些新增部分屬計算模型假設。實驗結合態能提供已觀察到的姿態，並不能直接告訴我們氣味分子如何進入口袋。')} {cite([2,4,9,13])}</p>
</section>'''


def add_reader_support(document, lang, references):
    soup=BeautifulSoup(document,'html.parser')
    main=soup.select_one('main')
    # Replace existing numeric markers, including those in figure captions.
    for span in main.select('.re-citation'):
        ids=[a['href'].removeprefix('#ref-') for a in span.select('a[href^="#ref-"]')]
        span.replace_with(BeautifulSoup(citation_html(ids,references),'html.parser'))
    marker=re.compile(r'\[(\d+(?:,\s*\d+)*)\]')
    for node in list(main.find_all(string=True)):
        if node.find_parent(id='references') or node.find_parent(['script','style']):continue
        if marker.search(str(node)):
            value=marker.sub(lambda m:citation_html(re.split(r',\s*',m[1]),references),escape(str(node)))
            node.replace_with(BeautifulSoup(value,'html.parser'))
    for key,(kind,ids) in FIGURE_SOURCES.items():
        caption=main.select_one(f'#fig-{key} figcaption')
        labels={'data':('Published data source','公開資料來源'),'structure':('Experimental structure source','實驗結構來源'),'method':('Structure / method references','結構／方法參考')}
        label=labels[kind][0 if lang=='en' else 1]
        caption.append(BeautifulSoup(f' <span class="re-figure-source">{label}: {citation_html(ids,references)}.</span>','html.parser'))
    seen={}
    selectors='p, dd, td, th, figcaption'
    for block in main.select(selectors):
        if block.find_parent(id='references') or block.find_parent(attrs={'data-re-no-terms':True}) or block.has_attr('data-re-no-terms'):continue
        if set(block.get('class',[])) & {'re-kicker','re-end','re-data-link'}:continue
        context=next((a for a in [block,*block.parents] if isinstance(a,Tag) and (a.name=='figure' or set(a.get('class',[])) & {'re-research-detail','re-detail','re-cycle','re-hero','re-scope','re-next','re-takeaway'})),block)
        used=seen.setdefault(id(context),set())
        cited={int(a['href'][5:]) for a in block.select('a[href^="#ref-"]')}
        for node in list(block.find_all(string=True)):
            if node.find_parent(['a','button']) or any(set(a.get('class',[])) & {'re-citation','re-term-note','re-figure-source'} for a in node.parents if isinstance(a,Tag)):continue
            text=str(node);pieces=[];last=0
            for match in PATTERN.finditer(text):
                entry=TERMS[int(match.lastgroup[1:])]
                key=entry['key']+(':'+match[0] if entry['key'] in {'mutation','residue'} else '')
                if key in used:continue
                used.add(key)
                pieces.append(escape(text[last:match.end()]))
                explanation=entry[lang]
                if entry['key']=='mutation':
                    a,pos,b=re.fullmatch(r'([A-Z])(\d+)([A-Z])',match[0]).groups()
                    first,last_aa=(AMINO_ACIDS[x][0 if lang=='en' else 1] for x in [a,b])
                    explanation=f'residue {pos}: {first} → {last_aa}' if lang=='en' else f'第 {pos} 位：{first} {a} → {last_aa} {b}'
                elif entry['key']=='residue':
                    code,pos=re.fullmatch(r'([A-Za-z]+)(\d+)',match[0]).groups()
                    aa={'Ser':'S','Leu':'L','Ile':'I','Tyr':'Y','Met':'M','Gln':'Q'}.get(code,code)
                    name=AMINO_ACIDS[aa][0 if lang=='en' else 1]
                    explanation=f'{name} at residue {pos}' if lang=='en' else f'第 {pos} 位{name}'
                opening,closing=(' (',')') if lang=='en' else ('（','）')
                pieces.append(f'<span class="re-term-note" data-term="{entry["key"]}">{opening}{escape(explanation)}{closing}</span>')
                missing=[i for i in entry['refs'] if i not in cited]
                if missing:pieces.append(' '+citation_html(missing,references));cited.update(missing)
                last=match.end()
            if pieces:
                pieces.append(escape(text[last:]));node.replace_with(BeautifulSoup(''.join(pieces),'html.parser'))
    # Descriptive alt text uses the same author–date style without markup.
    by_id={str(r['id']):r['short'] for r in references}
    for img in main.select('img[alt]'):
        img['alt']=marker.sub(lambda m:'('+ '; '.join(by_id[n] for n in re.split(r',\s*',m[1]))+')',img['alt'])
    return str(soup)+'\n'


def export_reader_guide(path, references):
    path.write_text(json.dumps(dict(terms=TERMS,reference_style='Author–date',references=references),ensure_ascii=False,indent=2)+'\n')
