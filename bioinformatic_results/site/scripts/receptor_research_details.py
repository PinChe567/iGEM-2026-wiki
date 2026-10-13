"""Public, bilingual research details reconciled with the complete Chinese Wiki."""
import csv
from pathlib import Path

ASSETS=Path(__file__).resolve().parents[1]/'assets/receptor-engineering'
def p(en,zh):return {'en':en,'zh':zh}
def block(title,paragraphs=(),headers=(),rows=(),figures=(),downloads=()):
 return dict(title=title,paragraphs=list(paragraphs),headers=list(headers),rows=list(rows),figures=list(figures),downloads=list(downloads))
def section(id,mount,title,blocks):return dict(id=id,mount=mount,title=title,blocks=blocks)

DETAILS=[
section('data-foundation','before-cycles',p('Data foundation and evaluation design','資料基礎與評估設計'),[
 block(p('What was measured, and what did we compute?','哪些是公開測量，哪些由我們計算？'),[
  p('The main benchmark contains 24 Drosophila receptors and 110 odorants: 2,640 receptor–odorant responses in spikes/s, with no missing response or duplicate pair ID in the curated table. A response threshold of 50 spikes/s was used for some classification comparisons; it is a project convention, not a universal activation threshold. [1]',
    '主要基準包含 24 個果蠅受體與 110 種氣味，共 2,640 組受體–氣味反應，保留 spikes/s 單位；整理表沒有缺失反應或重複配對 ID。部分分類比較使用 50 spikes/s 門檻，這是專案定義，不是通用活化界線。[1]'),
  p('All chemical names were mapped to PubChem. Eleven original names leave stereochemistry unspecified. The full docking screen excluded multicomponent ammonium hydroxide and therefore contains 24 × 109 = 2,616 pairs; the main predictive benchmark retains all 2,640 responses. These are different analysis populations.',
    '全部化學名稱皆完成 PubChem 對應，其中 11 個原始名稱未指定立體化學。全量 docking 排除多成分的 ammonium hydroxide，因此為 24 × 109＝2,616 組；主要預測基準仍保留 2,640 組反應，兩者分析母體不同。'),
  p('The sequence resource includes 60 OR-family genes, including Orco, and 65 protein isoforms (different protein versions produced by a gene). One representative per gene and 60 monomer models from AlphaFold DB support feature extraction. A predicted monomer is not the complete functional OR/Orco complex. [4, 24]',
    '序列資源包含 60 個 OR 家族基因（含 Orco）及 65 個蛋白 isoforms（同一基因產生的不同蛋白版本）；每個基因選取一條代表序列，並整理 AlphaFold DB 的 60 個單體模型供特徵擷取。預測單體不等於完整、有功能的 OR／Orco 複合體。[4, 24]')],figures=['response-matrix']),
 block(p('Generalization is tested at more than one level','以不同留出方式檢驗泛化'),[
  p('Five fixed split definitions were prepared. The main integrated-model comparisons emphasize random pairs, unseen chemical clusters and unseen receptors; defining a split does not mean every model was tested on it.',
    '已建立五種固定切分。主要整合模型比較集中於隨機配對、未見化學群集與未見受體；建立切分不代表每個模型都完成該項測試。')],
  headers=[p('Split','切分'),p('Question','回答的問題')],rows=[
   ['Random-pair',p('Predict a held-out combination within known receptor and odorant sets.','在已知受體及氣味集合內，預測留出的配對。')],
   ['Odorant-cold',p('Predict an odorant excluded from training.','預測訓練時未見的氣味。')],
   ['Chemical-cluster-cold',p('Predict an excluded cluster of chemically similar odorants.','預測未見的化學相似氣味群集。')],
   ['Receptor-cold',p('Predict a receptor excluded from training.','預測訓練時完全未見的受體。')],
   ['Receptor-cluster-cold',p('Predict an excluded sequence-related receptor group.','預測未見的序列相近受體群。')]]),
 block(p('DoOR checks data consistency','DoOR 用於資料一致性比對'),[
  p('The DoOR comparison covers 107 shared odorants and 2,568 pairs. The sequence + ESM model has a median within-receptor Spearman correlation of 0.938. DoOR includes Hallem measurements, and overlapping Hallem pairs were used for training. This is a consistency check with shared sources, not independent external validation or 93.8% accuracy. [6]',
    'DoOR 比對包含 107 種共同氣味、2,568 組配對；sequence＋ESM 模型的每受體 Spearman 中位數為 0.938。DoOR 包含 Hallem 測量，模型訓練也用了重疊的 Hallem 配對，因此這是有共同來源的資料一致性檢查，不能視為獨立外部驗證或 93.8% 準確率。[6]')])]),

section('model-evidence','cycle-1',p('Complete model comparisons','完整模型比較'),[
 block(p('Matched feature ablation','控制條件一致的特徵消融'),[
  p('The six feature sets use the same histogram gradient boosting settings, the same response pairs and fixed folds. L denotes ligand descriptors; S combines sequence descriptors and ESM2; P adds pocket features; D adds Vina and contact summaries; M adds multiple-pose features. PubChem identifiers, response-derived labels and split columns were excluded from the feature list; missing docking descriptors follow the existing zero-fill convention.',
    '六種特徵組合使用相同的 histogram gradient boosting 設定、反應配對與固定切分。L 為配體描述；S 為序列描述與 ESM2；P 為口袋特徵；D 為 Vina 與接觸摘要；M 為多姿態特徵。特徵清單排除 PubChem 編號、反應衍生標籤及切分欄位；缺失 docking 描述依既有流程補零。'),
  p('Sequence information supplies the clearest gain in both evaluation settings. On unseen receptors, the full model adds only ΔR² = 0.0031 over LS, with a receptor-grouped 95% bootstrap interval of −0.0316 to 0.0344. This does not establish an additional structural-feature gain; it does not show that all structure-based methods are ineffective.',
    '兩種評估中，序列資訊提供最清楚的增益。對未見受體，完整模型相對 LS 僅增加 ΔR²＝0.0031，受體分組 bootstrap 95% 區間為 −0.0316 至 0.0344。這尚未建立結構特徵的額外增益，也不代表所有結構方法都無效。')],figures=['full-ablation']),
 block(p('How the earlier models informed redesign','早期模型如何促成方法修正'),[
  p('These historical results use different representative models and feature versions. They are retained as method-development evidence and must not be combined into one model’s performance. For the matched historical HGB comparison, ΔR² ≈ 0.0175 had an interval of −0.0015 to 0.0419. Bootstrap intervals use fixed out-of-fold predictions; they omit retraining and model-selection uncertainty.',
    '下列歷史結果使用不同代表模型與特徵版本，保留作為方法演進證據，不能合併成同一模型的成績。歷史同一 HGB 比較的 ΔR² 約 0.0175，區間為 −0.0015 至 0.0419。Bootstrap 使用固定折外預測，未包含重新訓練與模型選擇的不確定度。')],
  headers=[p('Evaluation / model','評估／模型'),'R²','Spearman ρ'],rows=[
   ['Random-pair / stacked tree','0.569','0.739'],['Chemical-cluster-cold / global blend','0.420','0.659'],
   [p('Receptor-cold / original HGB','Receptor-cold／原始 HGB'),'0.229','0.463'],
   [p('Receptor-cold / HGB with multiple poses','Receptor-cold／加入多姿態 HGB'),'0.246','0.472']]),
 block(p('Docking features did not transfer uniformly','Docking 特徵並未一致改善泛化'),[
  p('In an earlier ExtraTrees analysis on 2,616 pairs, adding Vina/contact features raised chemical-cluster-cold R² from 0.066 to 0.220, while receptor-cold R² fell from 0.117 to 0.006. An eight-receptor pocket-redocking study and a small restrained implicit-solvent OpenMM study also failed to establish a stable unseen-receptor improvement. These results motivated better pocket placement, pose checks and membrane-based conformational sampling.',
    '早期 2,616 組 ExtraTrees 分析中，加入 Vina／接觸特徵使 chemical-cluster-cold R² 從 0.066 升至 0.220，但 receptor-cold 從 0.117 降至 0.006。八受體口袋重對接及小型受限制隱式溶劑 OpenMM 研究，也未建立穩定的未見受體增益。因此後續工作轉向改善口袋定位、姿態核對與膜環境構型取樣。')])]),

section('mutation-design','cycle-2',p('Mutation design and the odor panel','突變設計與氣味組合'),[
 block(p('Priority receptors and improved mutants are separate decisions','優先受體與突變增益，是兩個不同的判斷'),[
  p('Our comparison of published responses found higher mean responses to the selected mold-related panel than to the control panel for unmodified Or22a and Or35a. This supports prioritizing these receptors for functional testing; their selection does not depend on a proposed mutation succeeding. The selected-panel comparison does not establish mold specificity or a detection limit. [1]',
    '我們比較公開反應資料後發現，未加入設計突變的 Or22a、Or35a，對選定霉味相關組的平均反應高於對照組，因此列為優先功能實驗候選。選擇這兩個受體，不需要先假定某個突變有效；這項組合比較也尚未證明霉菌專一性或偵測極限。[1]'),
  p('Mutation screening asks a further question: does changing an amino acid improve preference relative to the original receptor? F34Y and E196Q showed small favorable shifts in the initial screen, but subsequent checks found that the direction and ranking depended on the calculation setup. Thus receptor candidates have been identified, while the proposed mutation benefits remain uncertain even before wet-lab validation.',
    '突變篩選回答的是下一個問題：改變胺基酸後，是否比原有受體更偏好目標氣味？F34Y、E196Q 初篩曾有小幅正向位移，但後續檢查發現，方向與排名依計算設定而變。因此，我們已有受體候選，而突變帶來的增益在計算階段仍有不確定性，並非僅缺 wet lab 驗證。')]),
 block(p('Computational constructs','計算建構'),[
  p('We proposed 35 single-residue substitutions across Or35a, Or22a, Or85b, Or98a and Or67a and checked the original amino acid at every position. The first structural screen used 12 substitutions plus Or22a/Or35a wild types, giving 14 ColabFold models. These are sequence and structure designs; they do not represent completed cloning or functional expression.',
    '對 Or35a、Or22a、Or85b、Or98a、Or67a 提出 35 個單點突變，並核對每個位置的原始胺基酸。首輪結構篩選包含 12 個突變與 Or22a／Or35a 野生型，共 14 個 ColabFold 模型。這些是序列與結構設計，不代表已完成 cloning 或功能表達。'),
  p('Mean pLDDT was about 91.6–92.2 for Or22a and 84.0–86.0 for Or35a. Local Cα RMSD within five residues on each side of the substitution was about 0.06–0.25 Å. Similar predicted backbones do not establish protein stability or receptor function.',
    'Or22a 平均 pLDDT 約 91.6–92.2，Or35a 約 84.0–86.0；突變前後各五個殘基的局部 Cα RMSD 約 0.06–0.25 Å。預測骨架相近，不能證明蛋白穩定性或受體功能。')],
  headers=[p('Receptor','受體'),p('Substitutions in the first structural screen','首輪結構篩選突變')],rows=[
   ['Or22a','E196Q, E196A, E196K, S33A, S33T, F34A, F34Y'],['Or35a','I87A, I87V, I87F, W305F, W305Y']]),
 block(p('What “mold-related preference” means here','此處的「霉味相關偏好」如何定義'),[
  p('The 14 structures were docked against 16 odorants. ΔVina = score(mutant) − score(WT); panel-preference shift = mean(ΔVina_control) − mean(ΔVina_mold-related). A positive shift favors this selected panel in the score comparison. It is not a receptor activation, EC50 or detection-limit estimate.',
    '14 個結構分別對接 16 種氣味。ΔVina＝score(mutant)−score(WT)；組合偏好位移＝mean(ΔVina_control)−mean(ΔVina_mold-related)。正值代表分數變化較偏向這個選定組合，不能換算成活化、EC50 或偵測極限。')],
  headers=[p('Group','分組'),p('Odorants','氣味')],rows=[
   [p('Mold-related','霉味相關'),'1-octen-3-ol; 2-heptanone; 1-octanol; 1-butanol; 3-methylbutanol; 4-ethyl guaiacol; methyl octanoate; ethyl octanoate'],
   [p('Controls','對照'),'acetophenone; benzaldehyde; ethyl acetate; ethyl butyrate; geranyl acetate; linalool; linalool oxide; methyl acetate']]),
 block(p('Why the first ranking was revised','為何修正首輪排名'),[
  p('Initial shifts were +0.0581 for F34Y and +0.0543 for E196Q. Later common-box means were −0.0234 and +0.0142, with search ranges crossing zero. Both mutations lacked direct side-chain contacts in the inspected original and recalculated poses. For 1-octen-3-ol, the historical closest side-chain distances were about 10.6 and 10.4 Å.',
    '首輪 F34Y、E196Q 位移分別為 +0.0581、+0.0543；後續共同搜尋框平均為 −0.0234、+0.0142，搜尋範圍皆跨零。檢查的原始與重算姿態中，兩者皆缺少直接側鏈接觸；以 1-octen-3-ol 為例，歷史最近側鏈距離約 10.6、10.4 Å。'),
  p('The audit aligned mutant and WT Cα atoms, inspected all saved docking modes, and compared a common 26 Å cubic search box with a template-informed alternative center. The 8V02 footprint was transferred using US-align only as a heterologous spatial hypothesis: some original poses lay about 24 Å from that center. It is not an experimentally mapped Drosophila pocket.',
    '驗證先對齊突變與 WT Cα、檢查全部保存的 docking 姿態，再比較共用 26 Å 立方搜尋框與模板引導的替代中心。8V02 footprint 以 US-align 轉移後僅作異源空間假說；部分原始姿態距該中心約 24 Å，這不是實驗確認的果蠅口袋。'),
  p('Leave-one-odorant-out and within-panel resampling also left F34Y/E196Q uncertainty spanning zero. Input preparation retained aromatic-bond perception warnings, and historical and revised docking settings were analyzed separately. F34Y loses priority as a selectivity candidate; E196Q remains a low-confidence comparison; I87V is useful as a contact-positive case with a negative relative preference. No first-round mutation is a validated positive winner.',
    '逐一移除氣味及組內重抽樣後，F34Y／E196Q 的不確定範圍仍跨零。輸入準備保留芳香鍵辨識警告；歷史與修正版 docking 設定分開分析。F34Y 不再列為優先專一性候選；E196Q 保留作低信心比較；I87V 則是有接觸但相對偏好為負的比較案例。首輪尚無已驗證的正向勝出者。')])]),

section('cross-species','after-cycle-2',p('Cross-species exploration: can function transfer?','跨物種探索：功能資訊能否轉移？'),[
 block(p('Design · distinguish response prediction from analogue matching','目的｜區分反應預測與功能相似受體搜尋'),[
  p('We tested whether fly-derived information can help prioritize mosquito receptors. Carey et al. provide 50 Anopheles gambiae receptors × 113 odorants, or 5,650 responses with SEM; 40 odorants overlap the fly panel. This Anopheles transfer study is separate from the Aedes OR10 molecular-dynamics reference system. [7]',
    '我們測試果蠅資訊能否協助挑選蚊子受體。Carey 等人提供 50 個 Anopheles gambiae 受體 × 113 種氣味，共 5,650 組反應與 SEM，其中 40 種氣味與果蠅組合重疊。此 Anopheles 跨物種研究與 Aedes OR10 的 MD 參考系統是不同研究。[7]'),
  p('All 50 historical receptor names have candidate sequences: 46 grade A, two grade B and two grade C. Naming or duplicate-gene ambiguity affects AgOr12 and AgOr67. The main fragment analysis therefore uses 48 receptors with A/B evidence against 24 fly receptors, giving 1,152 receptor–receptor pairs. The initial direct-transfer baseline used all 50 mosquito receptors.',
    '50 個歷史名稱皆找到候選序列：46 個 A 級、2 個 B 級、2 個 C 級。AgOr12、AgOr67 有命名或重複基因疑義，因此主要片段分析使用 A／B 級的 48 個受體，與 24 個果蠅受體比較，共 1,152 組受體–受體配對。最初直接轉移基準則使用全部 50 個蚊子受體。')]),
 block(p('Test 1 · transfer the fly-trained response model','測試一｜直接轉移果蠅反應模型'),[
  p('On the 2,000 mosquito receptor–odorant pairs sharing chemical identities with the fly benchmark, the ExtraTrees transfer baseline produced R² = −0.288 and Spearman ρ = −0.060. Negative R² means its squared prediction error exceeded the constant-mean reference on this evaluation set. This baseline does not support reliable species transfer.',
    '在與果蠅基準具有相同化學身分的 2,000 組蚊子受體–氣味配對上，ExtraTrees 轉移基準得到 R²＝−0.288、Spearman ρ＝−0.060。負 R² 表示此評估集合的平方預測誤差大於固定平均值基準，尚不支持可靠的物種轉移。')],figures=['cross-transfer']),
 block(p('Test 2 · match local sequence fragments','測試二｜比對局部序列片段'),[
  p('The alternative question is whether two receptors respond similarly across the shared 40-odorant panel. We compared full-length identity and ESM embeddings with local 21-, 31- and 41-amino-acid windows. Variants down-weight shared sequence framework and species signatures, subtract within-species embedding backgrounds, or require compatible relative position and hydropathy. These are sequence-based topology proxies, not a 3D pocket mapping.',
    '另一問題是：兩個受體在共同 40 種氣味上的反應輪廓是否相似？我們比較全長 identity、ESM embedding 與 21、31、41 個胺基酸的局部片段。不同版本降低共同序列骨架與物種 signature 的權重、扣除物種內 embedding 背景，或要求相對位置及疏水性相容。這些是序列層級的拓撲代理，並非三維口袋對應。'),
  p('Reciprocal matching asks whether each fragment selects its partner as the best match in both directions. Activity labels were not used to learn fragment weights. However, methods were compared and selected on the same response matrix, so the selected result still requires receptor-held-out confirmation.',
    '雙向配對檢查兩個片段是否互相選對方為最佳對象。反應標籤未參與片段權重學習；但方法是在同一反應矩陣上比較與選出，因此最佳結果仍需以受體留出方式確認。'),
  p('Full-length identity gave ρ = 0.017. The 31-aa mutual-best fraction reached ρ = 0.141 with a receptor-bootstrap interval of 0.035–0.250. The unadjusted block-permutation p was 0.033, but BH correction across the tested methods gave q = 0.259. The weak exploratory signal did not meet the corrected 0.05 threshold; these correlations concern profile similarity, not individual ligand activation.',
    '全長 identity 的 ρ＝0.017；31-aa 雙向最佳配對比例達 ρ＝0.141，受體 bootstrap 區間為 0.035–0.250。未校正的區塊置換 p＝0.033，但對測試方法做 BH 校正後 q＝0.259，未通過校正後 0.05 門檻。這是反應輪廓相似性的弱探索訊號，不是個別配體活化預測。')],figures=['cross-fragments']),
 block(p('Learn and redesign · validate when a local match is useful','學習與再設計｜確認局部配對何時有用'),[
  p('The effect is receptor-dependent: examples in the broader sensitivity analysis improve for AgOr4/AgOr56 and deteriorate for AgOr63/AgOr41. Removing a species mean alone did not solve transfer. Next steps are genuine 3D pocket neighborhoods, receptor-held-out nested selection and matched external assays. Spodoptera littoralis sequences and literature have been inventoried, but a usable numerical response matrix and further sequence checks are still needed; third-species validation is not complete.',
    '效果依受體而異：較廣的敏感度分析中，AgOr4／AgOr56 是改善例，AgOr63／AgOr41 則退步。單純扣除物種平均並未解決轉移問題。下一步需要真正的三維口袋鄰域、受體留出的巢狀方法選擇，以及條件可比的外部 assay。第三物種 Spodoptera littoralis 已整理序列與文獻，但仍缺可用的數值反應矩陣及進一步序列核對，尚未完成第三物種驗證。'),
  p('For the third-species inventory, the functional literature is de Fouchier et al.’s moth-receptor study, and candidate amino-acid sequences were recovered from the supplementary material of Jacquin-Joly et al. These sources support the inventory, not a completed transfer-validation result. [25, 26]',
    '第三物種盤點的功能文獻為 de Fouchier 等人的蛾類受體研究；候選胺基酸序列則由 Jacquin-Joly 等人的補充資料整理而來。這些文獻支持資料盤點，不代表已完成跨物種預測驗證。[25, 26]')])]),

section('md-methods','cycle-3-before',p('How the membrane models were built and checked','膜模型如何建立與檢查'),[
 block(p('Experimental coordinates, AlphaFold and missing regions','實驗座標、AlphaFold 與缺失區域'),[
  p('8V02 is the o-cresol-bound Aedes aegypti OR10 complex with three Apocrypta bakeri Orco subunits; 8V00 is its unbound structural reference. AlphaFold supports the missing-region hypotheses and fly-receptor features, while ColabFold supplies the mutation models. The resolved OR10/Orco coordinates used for MD originate from cryo-EM, not a de novo AlphaFold complex prediction. [2, 4, 5]',
    '8V02 是結合 o-cresol 的 Aedes aegypti OR10 加三個 Apocrypta bakeri Orco 次單元；8V00 提供未結合態參考。AlphaFold 支持缺失區域假說與果蠅受體特徵，ColabFold 用於突變模型；MD 採用的已解析 OR10／Orco 座標來自冷凍電顯，並非從零預測的 AlphaFold 複合體。[2, 4, 5]')],
  headers=[p('Reference','參考'),p('Unresolved Orco segments per subunit','每個 Orco 次單元未解析區段'),p('Rebuilt residues across the complex','複合體補建殘基總數')],rows=[
   ['8V02','1–6, 160–167, 244–312','249'],['8V00','1–3, 160–167, 244–312','240']]),
 block(p('A complete sequence is not a validated loop conformation','序列補齊不等於迴圈構型已驗證'),[
  p('The complete complex has 1,797 protein residues. The Orco 244–312 loop has mean pLDDT 37.68 and mean loop-to-core PAE 28.88 Å in the AlphaFold reference. Core alignment and local rebuilding produce testable hypotheses, not observed loop positions. Geometrically rejected candidate structures were excluded from MD, and accepted apo hypotheses retain common modeling ancestry.',
    '完整複合體共有 1,797 個蛋白殘基。AlphaFold 參考中，Orco 244–312 長迴圈平均 pLDDT 為 37.68，迴圈對核心平均 PAE 為 28.88 Å。核心對齊與局部補建產生可測假說，並非觀察到的迴圈位置。幾何不合格候選未納入 MD；合格 apo 假說仍有共同的建模來源。')],figures=['loop-confidence']),
 block(p('Physical model and engineering corrections','物理模型與工程修正'),[
  p('OpenMM integrates classical atomic motion in a POPC membrane with TIP3P water and ions, using ff14SB/Lipid17 and GAFF 2.2.20 with AM1-BCC ligand charges. Preparation uses pH 7 protonation, not constant-pH dynamics. The baseline is 300 K and 1 bar with PME and a 1 nm short-range cutoff; bonds to hydrogen are constrained, with no hydrogen-mass repartitioning. Steering studies use the documented 300 K NVT setup. [9]',
    'OpenMM 以經典力場積分原子運動；環境為 POPC 膜、TIP3P 水與離子，使用 ff14SB／Lipid17，配體採 GAFF 2.2.20 與 AM1-BCC 電荷。pH 7 用於起始加氫，並非 constant-pH 動力學。基線為 300 K、1 bar、PME 與 1 nm 短程截斷；含氫鍵長受限，沒有氫質量重分配。牽引研究使用其設定中的 300 K NVT 系統。[9]'),
  p('A restrained 200 ps pilot checked system preparation. Full-sequence 5 ns diagnostics exposed a minimum protein periodic-image separation of 0.877 nm, below the short-range cutoff. Increasing minimum water padding to 2.5 nm produced a 658,984-atom system with 1,066 POPC molecules and 162,148 waters. In the corrected 5 ns runs, checked minimum image separations were 3.227–4.113 nm; this fixes the observed short-range issue without excluding long-range finite-size effects.',
    '帶位置限制的 200 ps 試跑用於檢查系統準備。完整序列 5 ns 診斷發現蛋白最短週期影像距離為 0.877 nm，低於短程截斷。最小水層 padding 增至 2.5 nm 後，系統為 658,984 個原子、1,066 個 POPC 與 162,148 個水分子；修正後 5 ns 軌跡的受檢最短影像距離為 3.227–4.113 nm，解除了已觀察到的短程問題，但未排除長程有限尺寸效應。'),
  p('The first 1 ns includes 20 ps heating and 980 ps staged restraint release; the remaining 4 ns are unrestrained. Integration uses 1 fs during heating and 2 fs thereafter, distinct from saved-frame spacing. Frame-level checks cover 1,944 protein stereocentres, heavy-atom bonds and periodic images. Geometry passing is necessary for interpretation but is not evidence of equilibrium. [10]',
    '前 1 ns 包含 20 ps 升溫與 980 ps 分階段解除限制，後 4 ns 無位置限制。升溫以 1 fs、之後以 2 fs 積分，與保存影格間距不同。逐格檢查包含 1,944 個蛋白立體中心、重原子鍵長與週期影像。幾何通過是解讀的必要條件，不能當作已達平衡的證據。[10]')])]),

section('holo-validation','cycle-3-before',p('Bound-state MD: from 5 ns to 20 ns','結合態 MD：從 5 ns 到 20 ns'),[
 block(p('What remained stable, and what kept changing?','哪些指標穩定，哪些仍在改變？'),[
  p('Matched bound-state trajectories were extended from 5 to 20 ns without positional restraints during the extension. The prespecified summary windows are 3–5 ns and 15–20 ns. All completed trajectories passed the saved-frame geometry checks without detected chiral inversion; one rebuilt-region RMSD changed by 0.2591 nm between the 10–15 and 15–20 ns windows, exceeding the provisional 0.1 nm drift threshold.',
    '相配的結合態軌跡由 5 延伸至 20 ns，延長階段沒有位置限制；預先指定的摘要窗口為 3–5 ns 與 15–20 ns。完成軌跡皆通過保存影格的幾何檢查，未見手性反轉；其中一條補建區域 RMSD 在 10–15 與 15–20 ns 窗口間改變 0.2591 nm，高於暫定 0.1 nm 漂移門檻。'),
  p('Each summary first averages within a trajectory. Variation across those averages describes sampling conditional on the same starting model; correlated frames are not independent experiments. Rebuilt-region RMSD measures relaxation from a modeled starting hypothesis, not error against a known native loop.',
    '摘要先計算各軌跡內平均，再描述軌跡平均之間的變異；這是同一起始模型下的條件式取樣，相關影格不是獨立實驗。補建區域 RMSD 描述相對建模起點的鬆弛，不是相對已知原生迴圈的誤差。')],figures=['holo-baseline'],downloads=['holo-window-statistics.csv']),
 block(p('Ligand contacts are structural readouts','配體接觸是結構指標'),[
  p('The Ser133 hydrogen-bond geometry requires O···O <0.35 nm and donor–hydrogen–acceptor angle >135°, checking both donor directions. Its mean fraction changes from 0.9567 in the early comparison window to 0.7613 in the later window. These geometric fractions do not measure affinity, residence time or activation. Together with continued loop drift, the results support local structural diagnostics rather than a claim of equilibrium.',
    'Ser133 氫鍵幾何要求 O···O <0.35 nm 且供體–氫–受體角度 >135°，檢查兩個供受體方向；平均比例由早期比較窗口的 0.9567 變為後期的 0.7613。幾何比例不能量測親和力、停留時間或活化。配合仍存在的迴圈漂移，結果支持局部結構診斷，尚不足以宣稱平衡。')])]),

section('functional-panels','cycle-3',p('Two functional assays, kept separate','兩套功能 assay，分開比較'),[
 block(p('The initial seven-odorant reference','最初的七種氣味參考'),[
  p('The initial functional dataset contains seven odorants and 63 published oocyte-current observations with AaegOR10/AaegOrco. Screening concentration remains unresolved in the inspected records, and dose-response tables have normalization/labeling questions. The structures instead contain AbOrco. These differences prevent treating the comparison as a calibrated sensitivity or EC50 model. [8]',
    '最初功能資料包含七種氣味、63 筆公開卵母細胞電流觀測，受體為 AaegOR10／AaegOrco。已檢查紀錄中的篩選濃度仍待核實，濃度反應表另有正規化與標示疑點；結構參考使用的則是 AbOrco。這些差異使比較無法直接成為可校準的敏感度或 EC50 模型。[8]'),
  p('Static 8V00 and ligand-removed 8V02 docking gave rank correlations of 0.072 and 0.595. The 8V02 o-cresol pose control reproduced the native pose with symmetry-corrected heavy-atom RMSD of 1.17–1.22 Å; o-cresol had no functional label in this seven-odorant set and was excluded from the response correlation. After apo sampling and pocket clustering, the two MD ensembles gave 0.432 and 0.072. These small retrospective comparisons do not establish generalization.',
    '靜態 8V00 與移除配體的 8V02 對接排序相關性分別為 0.072、0.595。8V02 的 o-cresol 姿態對照，對原位姿態的對稱校正重原子 RMSD 為 1.17–1.22 Å；在七種氣味資料中它沒有功能標籤，因此不納入反應相關性。Apo 取樣與口袋分群後，兩個 MD 集合為 0.432、0.072；小型回溯比較尚未建立泛化能力。')],figures=['functional-seven']),
 block(p('Why the expanded panel answers a different question','擴充氣味組合為何不能直接合併'),[
  p('Bohbot et al. provide a separate 30-odorant screen using HEK293 calcium signaling with AgOrco. We matched identities to Supplemental Table I and digitized AaOR10 mean responses in Figure 2; these are not original replicate measurements. Excluding ammonium hydroxide leaves 29 dockable odorants. They do not overlap the initial seven labeled odorants, yielding 36 distinct dockable odorants across two assays, not one pooled response scale. [3]',
    'Bohbot 等人提供另一套 30 種氣味篩選，使用 HEK293 鈣訊號及 AgOrco。我們以 Supplemental Table I 核對身分，從圖 2 讀取 AaOR10 反應平均，並非取得原始重複觀測。排除 ammonium hydroxide 後有 29 種可對接氣味，與最初七種有標籤氣味無重疊，因此合計為兩個 assay 的 36 種不同可對接氣味，不能合併成同一反應尺度。[3]'),
  p('Four organic acids were evaluated in charged and neutral forms, and two stereochemically unspecified odorants were expanded into alternative isomers. The primary analysis uses rounded digitized means; low bars are not definitive inactive labels. MD pocket representatives are actual 3–5 ns medoid frames, and equal weighting is descriptive rather than thermodynamic.',
    '四種有機酸分別評估帶電與中性形式，兩種未指定立體化學的氣味展開替代異構物。主分析使用取整數的圖讀均值，低柱不代表確定不活化。MD 口袋代表為 3–5 ns 分群取得的實際 medoid 影格；等權平均是描述性做法，不是熱力學權重。'),
  p('For the 29-odorant panel, MD A/B correlations of 0.407/0.338 were below the static apo value of 0.450. Ligand-only controls gave 0.081 for heavy-atom count and −0.012 for neutral cLogP. The later aromatic-ring-count comparison reached 0.790. Chemical composition and post-selection optimism therefore remain plausible explanations; the exploratory intervals omit experimental error and chemical dependence.',
    '29 種氣味中，MD A／B 的 0.407／0.338 均低於靜態 apo 的 0.450。僅配體控制中，重原子數為 0.081，中性 cLogP 為 −0.012；後加的芳香環數量比較達 0.790。因此化學組成與事後選擇偏差仍可能影響結果，探索性區間也未納入實驗誤差及化學相依性。')])]),

section('concentration-study','cycle-4',p('Molecular availability: one versus twenty odorants','分子可接觸性：1 個與 20 個氣味分子'),[
 block(p('Controlled placement and concentration meaning','控制起始配置與濃度的意義'),[
  p('The concentration exploration used the same initial receptor snapshot and box for paired 1- and 20-o-cresol conditions. The first ligand position was shared and the additional molecules were placed in the external water layer with collision exclusions. Initial boxes were about 19 × 20 × 17 nm, corresponding to nominal whole-box concentrations of about 0.26 and 5.2 mM. These are not effective water-phase concentrations or airborne ppm; the periodic box does not maintain separate concentration reservoirs.',
    '濃度探索以相同起始受體快照與盒子，比較 1 個及 20 個 o-cresol。第一個分子位置共用，其餘分子在外側水層依排除碰撞規則放置。起始盒子約 19 × 20 × 17 nm，整盒名目濃度約 0.26、5.2 mM；它們不是水相有效濃度或空氣 ppm，週期盒也沒有維持分離的濃度庫。'),
  p('The available completed 2 ns observations form an incomplete, unbalanced exploratory comparison. Greater molecular availability produced some surface contacts but no sustained pocket entry. The table reports mean per-molecule protein-contact time fractions from completed, checked trajectories only; unfinished observations are excluded. Surface contact includes the protein beyond the OR10 pocket.',
    '已有完整 2 ns 觀察構成不完整、未平衡的探索性比較。較多分子產生部分表面接觸，但未見持續進入口袋。下表僅採完成並受檢軌跡，列每分子蛋白接觸時間比例的平均；未完成觀察不納入。蛋白表面接觸也包含 OR10 口袋以外區域。')],
  headers=[p('Starting model','起始模型'),p('1 odorant','1 個分子'),p('20 odorants','20 個分子')],rows=[['A','0.000','0.036'],['B','0.000','0.021']]),
 block(p('What the comparison can establish','這個比較能回答什麼'),[
  p('Molecules sharing one receptor are not independent experiments. The nearest of twenty molecules will tend to be closer than a single molecule even without stronger binding. Entry requires the same molecule to satisfy distance, residue-contact and duration criteria; contacts from different molecules cannot be joined into one event. These observations do not establish a concentration–response curve or a physical association rate.',
    '共享同一受體的多個分子不是獨立實驗。即使沒有更強結合，20 個分子中最近的一個通常也會比單一分子更近。進入必須由同一分子符合距離、殘基接觸及持續時間，不能拼接不同分子的接觸。這些觀察尚未建立濃度–反應曲線或物理結合速率。'),
  p('The near-entrance study then shortened the initial distance directly and extended unrestrained observation to 10 ns. It remained distinct from the external-water concentration comparison. No sustained entry was seen, motivating outward path exploration from the known bound pose.',
    '入口附近研究接著直接縮短起始距離，將無位置限制觀察延長至 10 ns；它與外部水相濃度比較是不同配置。仍未見持續進入，因此改由已知結合姿態探索向外路徑。')])]),

section('steering-development','cycle-5',p('How the steering experiments evolved','牽引與入口引導如何逐步演進'),[
 block(p('Outward exploration before reverse entry','先探索向外，再決定是否反向驗證'),[
  p('The first SMD design pulled o-cresol outward along candidate guidance lines and would reverse an accepted exit path for entry testing. All outward attempts encountered excessive target lag before satisfying exit criteria. Consequently, no accepted outward path was available and the planned reverse-entry test was not performed. A bound starting baseline is not a new entry event.',
    '最初 SMD 設計沿候選引導線將 o-cresol 向外拉，計畫在取得合格出口後反向測試進入。向外嘗試都在滿足出口條件前出現過大的目標落後量，因此沒有合格出口可反向驗證，未執行原定反向進入測試。由結合態起始的基線佔據也不算新進入事件。'),
  p('SMD uses a spring between ligand coordinates and a moving target, with transverse guidance around the route. Work associated with target motion and changing the bias is tracked separately. Neither non-equilibrium work nor transient retention measures PMF, binding free energy, sensitivity or natural entry kinetics.',
    'SMD 在分子座標與移動目標之間施加彈簧，並限制偏離路線的橫向運動；目標移動作功與偏置改變作功分開追蹤。非平衡作功及短暫保留，都不能直接當作 PMF、結合自由能、敏感度或自然進入動力學。')]),
 block(p('Guide the receptor instead of pulling the ligand','引導受體入口的實驗'),[
  p('Receptor guidance controls nine distances between three S3 Cα segments (123–127, 130–134, 136–140) and three S6 segments (289–293, 282–286, 277–281), moving them toward experimental apo reference distances. Each distance uses a spring constant of 3000/9 kJ mol⁻¹ nm⁻². These collective distances are not tunnel radii. Short guided-opening tests did not meet the prespecified distance and directional-progress requirements for subsequent ligand pulling.',
    '受體引導控制 S3 三段 Cα（123–127、130–134、136–140）與 S6 三段（289–293、282–286、277–281）之間的九組距離，使其朝實驗 apo 參考值變化。每組彈簧常數為 3000／9 kJ mol⁻¹ nm⁻²；這些集體距離不是通道半徑。短程入口引導未達預設距離及方向進度條件，因此該引導組未接續拉配體。')],
  headers=[p('Stage','階段'),p('Short protocol','短程流程'),p('Extended protocol','延長流程'),p('70 ns protocol','70 ns 流程')],rows=[
   [p('Baseline','基線'),'0.1 ns','0.1 ns','0.1 ns'],[p('Change the target','漸變目標'),'1 ns','5 ns','5 ns'],
   [p('Hold the target','固定目標'),'0.5 ns','2.5 ns','63.9 ns'],[p('After bias removal','撤除偏壓後'),'1 ns','1 ns','1 ns'],
   [p('Total trajectory time','軌跡總長'),'2.6 ns','8.6 ns','70 ns']]),
 block(p('Compare opening geometry with matched controls','以配對對照判讀入口幾何'),[
  p('Slower target changes and longer holding reduced entrance-distance error more for starting conformation A than B in the short-to-extended comparison. The paired duration contrasts were −0.0663 and −0.0187 nm, respectively. Timing changes affected both ramp speed and hold duration, so those effects cannot be separated. Guided and unsteered 70 ns trajectories still showed no sustained exit.',
    '短程至延長比較中，較慢調整與較長固定時間對起始構型 A 的入口距離誤差改善，比 B 更明顯；配對時間差分別為 −0.0663、−0.0187 nm。此設計同時改變目標速度及固定時間，無法分離兩者效果。引導與無新增偏壓的 70 ns 軌跡仍未見持續移出。'),
  p('An exit candidate must be at least 1.5 nm from the pocket reference, have zero designated pocket-residue contacts and persist for at least 100 ps within one stage. Bias status must accompany any event. Reaching an apo-like distance or briefly satisfying a force threshold is not equivalent to molecular passage.',
    '出口候選須距口袋參考至少 1.5 nm、指定口袋殘基接觸數為零，且在同一階段持續至少 100 ps；事件須同時標明偏壓狀態。接近 apo 距離或短暫符合施力門檻，都不等於分子已通過。')],figures=['gate-schedules'])]),

section('pathway-development','cycle-6-before',p('From empty-space probes to a whole-molecule path','從空隙探針到完整分子路徑'),[
 block(p('Search candidate geometry in saved structures','在保存構型中搜尋候選幾何'),[
  p('A widest-path graph search on saved conformations identified candidate space near S3/S6. The 47.6 ns snapshot suggested a lateral route near I132/Y285/M288; the 59 ns snapshot suggested a lower-membrane-coordinate route near L128/I184/Q292. “Lower” refers to the chosen coordinate system, not a demonstrated intracellular or extracellular exit. The lateral structural channel was already described in the experimental work. [2]',
    '對保存構型進行最寬路徑圖搜尋，在 S3／S6 附近找到候選空隙。47.6 ns 快照提示 I132／Y285／M288 附近的側向路線；59 ns 則提示 L128／I184／Q292 附近、較低膜座標方向的路線。「較低」指所用座標系，不代表已確認胞內或胞外出口；實驗研究早已描述側面結構通道。[2]'),
  p('At 0.05 nm grid spacing, candidate spherical-probe radius lower bounds were 0.089, 0.102 and 0.119 nm at 7.6, 47.6 and 59 ns using protein obstacles. Adding lipids and reselecting from the common candidate pool gave 0.089, 0.077 and 0.086 nm. The selected routes can differ between obstacle models. These are radii of particular candidate centerlines, not ligand dimensions or upper bounds on every possible route.',
    '使用 0.05 nm 網格、只納入蛋白障礙時，7.6、47.6、59 ns 的候選球形探針半徑下界為 0.089、0.102、0.119 nm。加入脂質並由共同候選集中重新選路後，為 0.089、0.077、0.086 nm；不同障礙模型可能選到不同路線。這些是特定中心線的半徑下界，不是氣味分子尺寸或所有可能通道的上限。'),
  p('Grid spacing changes the result: the 59 ns protein candidate changes from 0.091 nm on the coarse grid to 0.119 nm on the fine grid. Alternative direction-cone searches and a larger search extent tested sensitivity. Multiple endpoint directions may share a bottleneck and do not establish separate channels.',
    '網格間距會改變結果：59 ns 蛋白候選由粗網格的 0.091 nm 變為細網格的 0.119 nm。另以方向錐與較大搜尋範圍測試敏感度；不同終點方向可能共享瓶頸，不能認定為不同通道。')],figures=['tunnel-clearance']),
 block(p('Why a point-probe route was insufficient','為何點探針路線仍不足以證明可通行'),[
  p('Placing full o-cresol at candidate positions with multiple orientations exposed atom overlaps beyond the pocket. In one 47.6 ns candidate, the most congested position beyond 0.35 nm from the start retained about 0.16 nm hard-sphere overlap even at its best tested orientation, versus about 0.05 nm at the starting pose. Native poses also overlap under a hard-sphere model, so zero overlap is not by itself a physical pass/fail criterion.',
    '將完整 o-cresol 以不同朝向放到候選位置後，可見口袋之外的原子重疊。某條 47.6 ns 候選路徑在離起點 0.35 nm 以外，最擁擠位置即使採受測最佳朝向，仍有約 0.16 nm 硬球重疊；起點約為 0.05 nm。原位姿態在硬球模型也可能重疊，因此不能單憑零重疊作物理通行判定。'),
  p('The next static search used the full ligand’s translation and orientation in a 63.2 ns structure, explicitly checking consecutive poses and both protein-only and protein-plus-lipid repulsion. Flexible route-following SMD then tested the candidates at 0.2 and 0.5 nm/ns. Target progress stalled relative to actual ligand movement, and extending fixed-target waiting to 2 ns did not establish sustained exit.',
    '下一輪在 63.2 ns 結構中搜尋完整配體的位置與朝向，檢查相鄰姿態連續性，以及僅蛋白、蛋白加脂質的排斥；再以 0.2、0.5 nm/ns 的可動受體沿路 SMD 測試候選。目標與配體實際運動未能同步，將固定目標等待延長至 2 ns，也沒有建立持續移出。'),
  p('The ensemble analysis then evaluated 24 saved conformations across both starting structures and guided/control conditions, two corridors and both obstacle objectives. No evaluated selected route established a low-clash passage. The least severe combined peak was still about 3.34 × 10⁴ kJ/mol versus about 23 kJ/mol for its native pose. Positive Lennard–Jones repulsion is only a clash diagnostic. Paths from different conformations cannot be spliced into an observed continuous trajectory.',
    '構型集合分析接著評估兩個起始結構、引導／對照條件的 24 個保存構型，以及兩條走廊、兩種障礙目標。已評估選定路線仍未建立低碰撞通道；最低合併排斥峰約 3.34 × 10⁴ kJ/mol，而原位參考約 23 kJ/mol。Lennard–Jones 正值排斥僅為碰撞診斷，不能把不同構型各自的路徑片段拼成一條已觀察的連續軌跡。')]),
 block(p('The initial 63.2 ns whole-ligand search','最初 63.2 ns 完整配體路徑搜尋'),[
  p('This fixed-structure search expanded the corridor radius from 0.30 to 0.50 nm and extended candidates to 2.0 nm from the initial ligand center. Intermediate poses limited each atom’s inter-sample movement arc to 0.02 nm. Internal ligand torsions were fixed. The following values describe this particular snapshot, separately from the later ensemble analysis.',
    '此固定結構搜尋將走廊半徑從 0.30 擴至 0.50 nm，並把候選延伸至距起始配體中心 2.0 nm。插入中間姿態，使各原子相鄰取樣間的移動弧長不超過 0.02 nm；配體內部扭轉暫時固定。下表僅描述這個快照，與後來的構型集合分析分開呈現。'),
  p('The native pose scored about 15.8 kJ/mol under the same positive-repulsion diagnostic. Protein bottlenecks involved L128/S291/Q292 or L128/M288/I132; POPC dominated the combined maximum. These scores omit attraction, electrostatics, water and entropy. They are neither free-energy barriers nor the work needed for passage, and the search covers only two finite corridors.',
    '相同正值排斥診斷下，原位姿態約為 15.8 kJ/mol。蛋白瓶頸涉及 L128／S291／Q292 或 L128／M288／I132；合併障礙的最大值主要來自 POPC。此分數未含吸引項、靜電、水與熵，不能解讀為自由能障或穿越所需的功；搜尋也只涵蓋兩條有限走廊。')],
  headers=[p('Corridor','走廊'),p('Centerline arc (nm)','中心線弧長（nm）'),p('Protein peak (kJ/mol)','蛋白排斥峰（kJ/mol）'),p('Protein + lipid peak (kJ/mol)','蛋白＋脂質排斥峰（kJ/mol）')],rows=[
   [p('Lower membrane coordinate','較低膜座標方向'),'3.27','12,005','555,394'],
   [p('S3/S6 lateral','S3／S6 側向'),'4.03','29,838','103,961']]),
 block(p('Flexible pulling: target motion versus ligand motion','可動構型牽引：目標移動與配體移動的差別'),[
  p('Route-following SMD moved the ligand center while allowing rotation and receptor, lipid and water motion; it did not impose the rigid search’s full orientation sequence. Target advancement was held when lag reached 0.40 nm or force reached 180 kJ mol⁻¹ nm⁻¹. Advancement could resume only below 0.20 nm lag and 100 kJ mol⁻¹ nm⁻¹ force. Holding the target leaves MD and the spring force active.',
    '沿路 SMD 牽引配體中心，允許配體旋轉及受體、脂質、水移動，並未強制沿用固定搜尋的全部朝向。落後目標達 0.40 nm 或力達 180 kJ mol⁻¹ nm⁻¹ 時，停止目標推進；須同時降至 0.20 nm 與 100 kJ mol⁻¹ nm⁻¹ 以下才可恢復。固定目標期間，MD 與彈簧作用力仍持續。'),
  p('Across the tested pulling conditions, the ligand’s maximum pocket distance was only 0.139–0.190 nm, with at least eight pocket residues still in contact. Targets traversed 0.469–0.947 nm along the curved routes, and peak forces were about 274–304 pN. Target arc length is not ligand displacement or an exit percentage. A 2 ns unsteered control reached 0.126 nm; unequal observation durations make these descriptive extrema, not a matched rate comparison.',
    '受測牽引條件中，配體距口袋最遠僅 0.139–0.190 nm，始終至少接觸八個口袋殘基；目標沿彎曲路線走過 0.469–0.947 nm，峰值力約 274–304 pN。目標弧長不是配體位移或離開百分比。2 ns 無牽引對照最遠為 0.126 nm；各觀察時長不同，這些極值僅供描述，不能當成相配的速率比較。')])]),

section('evidence-limits','before-next',p('What the complete evidence supports','完整證據支持到哪裡'),[
 block(p('Results and the tests still needed','目前結果與仍需完成的驗證'),[
  p('The work establishes curated data, controlled feature comparisons, mutation audits, a cross-species transfer test and a membrane-MD/pathway workflow. Sequence features improve within-species prediction. Completed molecular-weight ablation, measured IR, quantum-mode and OpenPOM comparisons show model-dependent effects without a stable general gain from spectra or frozen odor AI. Added structural features, proposed selectivity mutations and direct cross-species transfer remain unvalidated. Reference MD constrains candidate access routes without establishing ligand-induced opening or complete passage.',
    '目前建立了可追溯資料、控制特徵比較、突變查核、跨物種轉移測試，以及膜 MD／路徑研究流程。序列改善物種內預測；已完成分子量消融、實測 IR、量子振動與 OpenPOM 比較，顯示效果依模型而變，頻譜或固定嗅覺 AI 尚未帶來穩定全面增益。額外結構特徵、專一性突變及直接跨物種轉移仍未驗證。參考 MD 揭露候選進出路線的限制，尚未證明分子誘發開口或完整穿越。')],
  headers=[p('Next test','下一項驗證'),p('Question it can answer','完成後能回答的問題')],rows=[
   [p('Fold-contained AI adaptation, 3D odorant descriptors and independent data','訓練折內 AI 微調、三維氣味描述及獨立資料'),p('Can richer features improve responses beyond the retained baseline?','更完整的特徵能否改善相對原基準的反應預測？')],
   [p('Alternative loop hypotheses and local drift analysis','替代迴圈假說與局部漂移分析'),p('How dependent are the conclusions on uncertain starting regions?','結論多大程度依賴不確定的起始區域？')],
   [p('Target Drosophila WT/mutant OR–Orco complexes','果蠅目標 WT／突變 OR–Orco 複合體'),p('Do candidate-specific dynamic differences reproduce?','與候選相關的動態差異能否重現？')],
   [p('Independent functional data and nested species-transfer evaluation','無來源重疊的功能資料與巢狀跨物種評估'),p('Does performance persist on genuinely unseen receptors and assays?','對未見受體與 assay 是否仍有效？')],
   [p('Matched expression and functional dose-response experiments','相配的表達與功能濃度反應實驗'),p('Do designed receptors change activity, selectivity or sensitivity?','受體設計是否改變活化、專一性或敏感度？')],
   [p('Continuous flexible pathways and unbiased follow-up','連續可動路徑與無偏壓後續觀察'),p('Is a guided route physically sustainable after removing the force?','撤除外力後，受引導路線是否仍有物理可行性？')]]),
 block(p('Data and reproducibility','數據與可追溯性'),[
  p('Each result figure provides its plotted values; the downloadable evidence tables retain units and analysis windows. Source-file hashes are recorded in the provenance manifest. Model comparisons use stored out-of-fold predictions, and docking/path analyses retain pose-level outputs. Saved trajectory selections vary by study and do not imply that every water and lipid-tail coordinate was recorded continuously.',
    '各結果圖提供繪圖數值，證據表保留單位及分析窗口；來源檔案雜湊列於 provenance。模型比較採保存的折外預測，docking／路徑分析保留姿態層級輸出。不同研究保存的軌跡原子集合有所不同，不能假定每個水與脂質尾部座標皆有連續留存。')],downloads=['provenance.json','research-coverage.json'])])
]

from receptor_molecular_features import MOLECULAR_DETAILS
DETAILS[2:2] = MOLECULAR_DETAILS

# Read exact tabulated values from the public exports rather than rounding by hand.
def enrich_tables():
 with (ASSETS/'full-ablation.csv').open() as f:rows=list(csv.DictReader(f))
 target=next(s for s in DETAILS if s['id']=='model-evidence')['blocks'][0]
 target['headers']=[p('Features','特徵'),'Chemical-cluster-cold R²','Receptor-cold R²']
 target['rows']=[[v,*[f"{float(next(r['r2'] for r in rows if r['variant']==v and r['split']==sp)):.4f}" for sp in ['chemical_cluster_cold','receptor_cold']]] for v in ['L','LS','LSP','LSD','LSPD','LSPDM']]
 with (ASSETS/'holo-window-statistics.csv').open() as f:rows=list(csv.DictReader(f))
 names={
  'temperature_K':p('Temperature (K)','溫度（K）'),'volume_nm3':p('Box volume (nm³)','盒體積（nm³）'),
  'box_xy_area_nm2':p('Lateral area (nm²)','側向面積（nm²）'),
  'membrane_phosphate_thickness_nm':p('Membrane phosphate thickness (nm)','膜磷酸頭基厚度（nm）'),
  'core_ca_rmsd_nm':p('Resolved-core Cα RMSD (nm)','已解析核心 Cα RMSD（nm）'),
  'or10_ca_rmsd_nm':p('OR10 Cα RMSD (nm)','OR10 Cα RMSD（nm）'),
  'modeled_ca_rmsd_nm':p('Rebuilt-region Cα RMSD (nm)','補建區域 Cα RMSD（nm）'),
  'ligand_or10_fit_rmsd_nm':p('Ligand RMSD after OR10 fit (nm)','OR10 對齊後配體 RMSD（nm）'),
  'ser133_hbond_geometry':p('Ser133 H-bond geometry fraction','Ser133 氫鍵幾何比例')}
 target=next(s for s in DETAILS if s['id']=='holo-validation')['blocks'][0]
 target['headers']=[p('Readout','指標'),p('3–5 ns · mean ± SD','3–5 ns｜平均 ± SD'),p('15–20 ns · mean ± SD','15–20 ns｜平均 ± SD')]
 target['rows']=[[label,*[f"{float(r['mean']):.4f} ± {float(r['sample_sd']):.4f}" for window in ['3–5 ns','15–20 ns'] for r in rows if r['metric']==metric and r['window']==window]] for metric,label in names.items()]

def render_details(mount,lang,prose,figure):
 out=[]
 for sec in DETAILS:
  if sec['mount']!=mount:continue
  val=lambda x:prose(x[lang] if isinstance(x,dict) else x)
  out.append(f'<section class="re-research-detail" id="{sec["id"]}" aria-labelledby="{sec["id"]}-heading"><p class="re-kicker">'+('Research evidence' if lang=='en' else '完整研究證據')+f'</p><h2 id="{sec["id"]}-heading">{val(sec["title"])}</h2>')
  for b in sec['blocks']:
   out.append(f'<div class="re-evidence-block"><h3>{val(b["title"])}</h3>')
   out.extend(f'<p>{val(x)}</p>' for x in b['paragraphs'])
   if b['rows']:
    out.append('<div class="re-evidence-table" role="region" tabindex="0" aria-label="'+val(b['title'])+'"><table><thead><tr>'+''.join(f'<th scope="col">{val(h)}</th>' for h in b['headers'])+'</tr></thead><tbody>')
    for row in b['rows']:out.append('<tr>'+''.join(f'<td>{val(cell)}</td>' for cell in row)+'</tr>')
    out.append('</tbody></table></div>')
   out.extend(figure(name,lang) for name in b['figures'])
   if b['downloads']:
    out.append('<div class="re-figure-links">'+''.join(f'<a href="assets/receptor-engineering/{name}" download>{name} ↓</a>' for name in b['downloads'])+'</div>')
   out.append('</div>')
  out.append('</section>')
 return '\n'.join(out)
