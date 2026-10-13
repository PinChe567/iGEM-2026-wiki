"""Completed molecular-feature experiments, with bilingual editorial content."""
import csv
from pathlib import Path

ASSETS = Path(__file__).resolve().parents[1] / 'assets/receptor-engineering/molecular-features'


def p(en, zh): return {'en': en, 'zh': zh}
def block(title, paragraphs=(), headers=(), rows=(), figures=(), downloads=()):
    return dict(title=title, paragraphs=list(paragraphs), headers=list(headers), rows=list(rows), figures=list(figures), downloads=list(downloads))
def section(id, title, blocks): return dict(id=id, mount='after-cycle-1', title=title, blocks=blocks)


def table(key, variants, cohort=None):
    with (ASSETS / key / 'metrics.csv').open() as f: data = list(csv.DictReader(f))
    if cohort: data = [r for r in data if r['cohort']==cohort]
    rows = []
    for variant, title in variants:
        values = []
        for split in ['chemical_cluster_cold', 'receptor_cold']:
            for model in ['hist_gradient_boosting', 'extra_trees']:
                row, = [r for r in data if r['variant']==variant and r['model']==model and r['split']==split]
                values.append(f"{float(row['r2']):.4f}")
        rows.append([title, *values])
    return rows


HEADERS = [p('Inputs', '輸入特徵'), p('Chemical · HGB', '化學類群 · HGB'),
           p('Chemical · ExtraTrees', '化學類群 · ExtraTrees'), p('Receptor · HGB', '受體 · HGB'), p('Receptor · ExtraTrees', '受體 · ExtraTrees')]

MOLECULAR_DETAILS = [
section('molecular-features', p('Can richer odorant features improve sequence-based prediction?', '更完整的氣味特徵，能否改善序列反應預測？'), [
    block(p('Purpose · connect both sides of a receptor–odorant pair', '目的｜同時描述受體與氣味分子'), [
        p('A receptor sequence describes the protein, while molecular weight, spectra and learned chemical features describe the odorant. They can enter the same response predictor before docking or MD. Our baseline already combines 540 sequence descriptors, 320 ESM2 features, 12 physicochemical descriptors including molecular weight, and a 2,048-bit Morgan fingerprint: 2,920 inputs in total. A Morgan fingerprint encodes local molecular connectivity; it is not a 3D structure. [1, 12]',
          '受體序列描述蛋白，分子量、頻譜與 AI 化學特徵描述氣味分子；兩者可以在 docking 或 MD 之前，一起輸入反應模型。原基準已包含 540 維序列描述、320 維 ESM2 特徵、12 個理化特徵（含分子量）及 2,048 維 Morgan 指紋，共 2,920 維。Morgan 指紋編碼局部化學連接關係，並非三維結構。[1, 12]'),
        p('We asked three successive questions: does measured IR add information; do complete harmonic modes and EVA recover information outside that IR window; and can a pretrained odor-perception model supply a useful molecular representation? These are completed prediction experiments, separate from the OR10 entry/exit simulations.',
          '依序測試三個問題：實測 IR 是否增加資訊；完整諧振模式與 EVA 能否補足 IR 視窗外的資訊；預訓練嗅覺 AI 能否提供有用的分子表示。這些反應預測比較已完成，與 OR10 分子進出模擬分開評估。')]),
    block(p('Method · compare the same eligible pairs within each experiment', '方法｜每項實驗都比較同一批可用配對'), [
        p('HGB and ExtraTrees are two tree-based regression methods. We kept their settings fixed and used the existing five-fold chemical-group and receptor holdouts. Chemical-group holdout tests responses to excluded chemical groups; receptor holdout tests excluded receptors with known odors. Neither is a simultaneous unseen-receptor-and-odor test. Random features of matched dimensionality provide a control.',
          'HGB（梯度提升樹）與 ExtraTrees（極端隨機樹）是兩種樹狀回歸方法。本輪固定模型設定，沿用五折化學類群留出與受體留出。前者測試未見化學類群的反應，後者測試未見受體對已知氣味的反應；尚未同時留出新受體與新氣味。另加入相同維度的隨機特徵作對照。'),
        p('Each eligible subset gets its own retrained baseline. Scores from the 82-, 85-, 67- and 109-odorant subsets are not directly interchangeable. R² measures prediction error relative to a constant-mean reference; it is not a correlation coefficient or a percentage accuracy. Spearman ρ measures ranking, and MAE measures absolute response error in spikes/s.',
          '每個可用子集都重新訓練自己的基準；82、85、67、109 種氣味的絕對分數不能直接比較增減。R² 衡量相對常數平均值基準的預測誤差，不是相關係數或百分比準確率。Spearman ρ 衡量排序，MAE 則是以 spikes/s 表示的平均絕對反應誤差。')],
        headers=[p('Experiment', '實驗'),p('Odorants', '氣味數'),p('Response pairs', '反應配對'),p('Chemical groups', '化學類群')],
        rows=[[p('Measured IR / size ablation', '實測 IR／尺寸消融'),'82','1,968','53'],
              [p('Quantum modes', '量子振動模式'),'85','2,040','56'],
              [p('Measured–computed overlap', '實測／計算共同子集'),'67','1,608','45'],
              ['OpenPOM','109','2,616','69']]),
    block(p('Interpretation · exploratory comparisons with grouped uncertainty', '解讀｜以分組不確定區間評估探索性結果'), [
        p('Paired 95% intervals resample chemical groups or receptors using fixed out-of-fold predictions. They account for those grouped observations, but omit retraining, model-selection and assay uncertainty. A zero-crossing interval does not establish a reliable gain. These data and splits have been used in earlier work; this is exploratory evaluation, with no multiplicity adjustment for secondary comparisons.',
          '配對 95% 區間以固定折外預測，依化學類群或受體重抽樣，考慮同組觀測的關聯；未涵蓋重新訓練、選模與實驗量測的不確定度。區間跨零代表尚未建立可靠增益。這些資料與切分已用於先前研究，因此屬探索性評估；次要比較未做多重比較校正。')])]),

section('measured-ir', p('Experiment A · molecular weight and measured IR', '實驗 A｜分子量與實測 IR'), [
    block(p('Purpose · test added information, not a vibration mechanism', '目的｜檢查額外資訊，並非直接驗證振動機制'), [
        p('Prior work relates receptor responses to molecular volume and uses physicochemical properties to predict odor perception. Molecular weight and volume are related but distinct quantities. We therefore tested removing weight alone and removing a size-related group, alongside adding measured infrared absorption spectra. [34, 35]',
          '過去研究分析分子體積與受體反應的關係，也使用理化特徵預測嗅覺感受；分子量與體積相關，但不是同一物理量。因此本輪分別移除分子量、移除尺寸相關特徵組，並測試加入實測紅外線吸收頻譜。[34, 35]')]),
    block(p('Method · 82 matched gas-phase spectra', '方法｜82 種身分相符的氣相頻譜'), [
        p('Of 110 odorants, 82 passed full chemical-identifier, gas-phase source and spectral-coverage checks in the NIST Chemistry WebBook. Missing spectra were excluded from all compared models, not zero-filled. We subtracted the first-percentile background, clipped negative absorbance, normalized total area over 650–3,800 cm⁻¹ and integrated 63 bands of 50 cm⁻¹. The 4 cm⁻¹ source sampling interval is not an instrument-resolution claim. [27]',
          '110 種氣味中，82 種通過 NIST Chemistry WebBook 的完整化學識別碼、氣相來源與波數範圍核對。缺譜氣味從所有比較版本排除，沒有補零。以第一百分位扣除背景、裁切負吸光度，再對 650–3,800 cm⁻¹ 總面積標準化，積分成 63 個各 50 cm⁻¹ 的頻段。來源的 4 cm⁻¹ 取樣間隔不等於儀器解析度。[27]'),
        p('All six variants retain the same receptor sequence features. “Sequence + IR only” replaces the entire chemical block with IR. The size group is molecular weight, heavy-atom count and molar refractivity (a property related to polarizability and size). These removals test incremental predictive value in this model, not a causal biological effect.',
          '六個版本保留相同的受體序列特徵。「僅序列＋IR」以 IR 取代全部化學特徵。尺寸特徵組包含分子量、重原子數及摩爾折射率（與極化性及尺寸相關的性質）。移除特徵是在測試對目前模型的額外預測價值，不能解讀成生物因果作用。')], figures=['ir-spectra']),
    block(p('Results · measured IR did not improve new-chemical prediction', '結果｜實測 IR 未改善新化學類群預測'), [
        p('On unseen chemical groups, adding IR changed HGB R² from 0.3930 to 0.3278 (Δ −0.0653; 95% interval −0.1127 to −0.0078) and ExtraTrees from 0.3746 to 0.3458 (Δ −0.0288; −0.0564 to −0.0003). Receptor-holdout point gains were small: +0.0028 and +0.0102, with both intervals crossing zero.',
          '未見化學類群中，加入 IR 後 HGB R² 從 0.3930 降至 0.3278（Δ −0.0653；95% 區間 −0.1127 至 −0.0078），ExtraTrees 從 0.3746 降至 0.3458（Δ −0.0288；−0.0564 至 −0.0003）。受體留出的點估計增益僅 +0.0028 與 +0.0102，兩個區間均跨零。'),
        p('Weight alone had model-dependent effects: retaining it changed chemical-holdout R² by −0.0121 in HGB but +0.0188 in ExtraTrees. Retaining the full size group improved point scores in both models (+0.0292 / +0.0751), although the HGB interval crossed zero. Weight was already available to the early response model; adding it is not an untested missing step.',
          '分子量單獨的效果依模型而變：保留它使化學類群留出的 HGB R² 改變 −0.0121、ExtraTrees 改變 +0.0188。保留整組尺寸特徵則讓兩模型的點估計上升（+0.0292／+0.0751），但 HGB 區間跨零。分子量本來就能進入前段反應模型，並不是尚未放入的缺失資訊。'),
        p('The table reports R². The next experiment expands beyond the measured window using complete harmonic mode sets. A failed IR feature test does not disprove vibrational sensing.',
          '下表列出 R²。下一步以完整諧振模式擴展實測視窗外的資訊；IR 特徵未改善預測，不能據此否定振動感測機制。')], headers=HEADERS,
        rows=table('ir', [('sequence_chemical',p('Baseline','原模型')),('sequence_chemical_ir',p('+ IR 63','＋IR 63 維')),
                        ('sequence_ir',p('Sequence + IR only','僅序列＋IR')),('sequence_chemical_no_mw',p('Remove weight','移除分子量')),
                        ('sequence_chemical_no_size',p('Remove size group','移除尺寸特徵組')),('sequence_chemical_random63',p('+ Random 63','＋隨機 63 維'))]),
        figures=['ir-comparison'], downloads=['molecular-features/ir/metrics.csv','molecular-features/ir/paired_uncertainty.csv','molecular-features/ir/coverage.csv'])]),

section('quantum-vibrations', p('Experiment B · complete harmonic modes, EVA and computed IR', '實驗 B｜完整諧振模式、EVA 與計算 IR'), [
    block(p('Purpose and acquisition · recover modes missed by the IR window', '目的與取得｜補足 IR 視窗外的振動模式'), [
        p('We reused published Gaussian quantum-chemistry outputs from Harada et al., a 2025 preprint, rather than claiming new quantum calculations. The method was gas-phase B3LYP/6-31G(d), a density-functional theory approximation and basis set. After checking calculation completion, mode counts, molecular connectivity and specified stereochemistry, 85 odorants were accepted: 4,767 harmonic modes, including 1,082 below 650 cm⁻¹. [29]',
          '本研究取得 Harada 等人的公開 Gaussian 量子化學輸出；來源為 2025 年預印本，不是本團隊重新完成的量子計算。來源使用氣相 B3LYP/6-31G(d)（密度泛函理論近似與基底組）。核對計算完成、模式數、化學連接及已指定的立體化學後，納入 85 種氣味、4,767 個諧振模式，其中 1,082 個低於 650 cm⁻¹。[29]'),
        p('Each molecule provides one source conformer’s complete harmonic normal modes: coordinated atom-displacement patterns near an optimized geometry, with frequencies, IR intensities, reduced masses and force constants. This does not cover all conformers, anharmonic motion, receptor-bound vibrations or full quantum dynamics. Twenty-two odorants lacked exact-match source files; two had imaginary frequencies; trans-caryophyllene required stereochemical review and was excluded.',
          '每個分子提供一個來源構型的完整諧振正常模式：最佳化幾何附近的協同原子位移模式，以及頻率、IR 強度、約化質量與力常數。這不等於所有構型、非諧振運動、受體內振動或完整量子動力學。22 種氣味缺少完全相符的來源檔；2 種有虛頻；trans-caryophyllene 的立體化學仍需複核，均未納入。')]),
    block(p('Method · encode the same modes in two ways', '方法｜將相同振動模式編成兩種特徵'), [
        p('EVA gives every mode equal weight, smooths its frequency with a Gaussian of σ = 10 cm⁻¹, and samples 1–3,996 cm⁻¹ every 5 cm⁻¹ to form 800 features. Computed IR uses the same modes and grid but weights each mode by its calculated IR intensity. Neither applies area normalization or frequency scaling. This classical EVA formulation is not a reproduction of the 27-dimensional EVA used by Gabler et al. [28, 30]',
          'EVA 讓各模式等權重，以 σ＝10 cm⁻¹ 的 Gaussian 平滑頻率，再於 1–3,996 cm⁻¹ 每 5 cm⁻¹ 取樣，得到 800 維特徵。計算 IR 使用相同模式與網格，但依計算出的 IR 強度加權；兩者皆未做面積標準化或頻率縮放。此經典 EVA 編碼不是 Gabler 等人所用 27 維 EVA 的重現。[28, 30]'),
        p('Alongside full 800-feature inputs, we tested PCA compression to 16 components and random 800/16-feature controls. PCA was fitted only on distinct training odors within each fold. Its variance retention is not evidence that response information was retained.',
          '除完整 800 維外，也測試 PCA（主成分分析）降至 16 維及隨機 800／16 維對照。PCA 只在每折的不同訓練氣味上擬合；保留頻譜變異，不代表一定保留反應資訊。')], figures=['quantum-encoding']),
    block(p('Results · full and compressed features, 85 odorants', '結果｜85 種氣味的完整與降維特徵比較'), [
        p('The prespecified primary comparison was HGB with added EVA under chemical-group holdout: R² 0.3810 → 0.3421, Δ −0.0389 (95% interval −0.0800 to +0.0022). The point estimate fell, but this interval crosses zero; it supports neither a reliable gain nor a confirmed decline. ExtraTrees also fell, from 0.4225 to 0.3772. Compressed features came closer to the baseline without exceeding its chemical-holdout point score.',
          '事先指定的主要比較為 HGB 加入 EVA 的化學類群留出：R² 0.3810 → 0.3421，Δ −0.0389（95% 區間 −0.0800 至 +0.0022）。點估計下降，但區間跨零，既不能聲稱可靠增益，也不能確認下降。ExtraTrees 亦由 0.4225 降至 0.3772。降維版本較接近基準，仍未超過其化學類群留出點估計。'),
        p('For unseen receptors, HGB rose slightly with full EVA or computed IR, but both intervals crossed zero and random features showed similar point gains. Thus no stable improvement across models and holdouts was established. All table values are R².',
          '未見受體中，HGB 加完整 EVA 或計算 IR 有小幅上升，但區間均跨零，隨機特徵也呈現類似點估計增益。因此尚未建立跨模型、跨留出方式的穩定改善；下表均為 R²。')], headers=HEADERS,
        rows=table('quantum', [('baseline',p('Baseline','原模型')),('add_eva800','＋EVA 800'),('add_qir800',p('+ Computed IR 800','＋計算 IR 800')),
                              ('add_eva_pca16','＋EVA PCA 16'),('add_qir_pca16',p('+ Computed IR PCA 16','＋計算 IR PCA 16')),
                              ('add_random800',p('+ Random 800','＋隨機 800')),('add_random16',p('+ Random 16','＋隨機 16'))], 'quantum85'),
        figures=['quantum-comparison']),
    block(p('Matched comparison · 67 odorants with both data sources', '共同子集｜67 種同時有兩類來源的氣味'), [
        p('The measured-IR and quantum datasets overlap for 67 odorants. We retrained all baselines on these same 1,608 pairs. None of the spectral additions exceeded the chemical-holdout baseline in either model. Measured IR uses a different range, dimension and normalization, so this is not an isolated test of experimental versus quantum spectral accuracy.',
          '實測 IR 與量子資料共有 67 種氣味；全部基準在同一批 1,608 組配對重新訓練。兩模型的化學類群留出中，各種頻譜均未超過基準。實測 IR 的範圍、維度及標準化方式不同，不能將差異單獨歸因於實測或量子計算的頻譜準確度。')], headers=HEADERS,
        rows=table('quantum',[('baseline',p('Baseline','原模型')),('add_eva800','＋EVA 800'),('add_qir800',p('+ Computed IR 800','＋計算 IR 800')),
                              ('add_measured_ir63',p('+ Measured IR 63','＋實測 IR 63'))], 'common67'),
        figures=['quantum-common'], downloads=['molecular-features/quantum/metrics.csv','molecular-features/quantum/paired_uncertainty.csv',
                                             'molecular-features/quantum/audited_coverage.csv','molecular-features/quantum/normal_modes.csv']),
    block(p('What this says about vibrational theories', '這對振動嗅覺假說代表什麼'), [
        p('Vibrational explanations of smell remain disputed: isotope-related fly behavior has supported further investigation, while receptor experiments and an OR51E2/propionate computational study provide counterevidence in their tested systems. Predictive usefulness of a spectrum would not by itself demonstrate electron tunneling, and our negative feature results do not exclude every vibrational mechanism. Classical MD here does not simulate electron tunneling. [36, 37, 38]',
          '振動嗅覺解釋仍有爭議：果蠅同位素行為研究提供繼續研究的依據；受體實驗及 OR51E2／丙酸計算研究，則在各自系統中提出反證。頻譜具有預測力也不直接證明電子穿隧，本輪特徵未改善也不能排除所有振動機制。目前的古典 MD 並未模擬電子穿隧。[36, 37, 38]')])]),

section('ai-odor-features', p('Experiment C · transfer frozen OpenPOM molecular features', '實驗 C｜轉用固定 OpenPOM 分子特徵'), [
    block(p('Purpose · from human odor perception to insect receptor responses', '目的｜從人類嗅覺表示，轉用到昆蟲受體反應'), [
        p('The Principal Odor Map learns molecular representations from human odor descriptions. OpenPOM is an open-source reproduction, not the original POM model weights. We tested whether its learned chemical representation helps a sequence–odorant response predictor; a “floral” or “mushroom” label cannot replace a measured insect-receptor response. [31, 32]',
          'Principal Odor Map 從人類氣味描述學習分子表示；OpenPOM 是開源重現版，並非原始 POM 模型權重。我們測試其化學表示能否幫助「序列＋氣味」反應模型；AI 的「花香」或「蘑菇味」標籤，不能取代昆蟲受體的實測反應。[31, 32]')]),
    block(p('Method · fixed 256-dimensional features, retained molecular weight', '方法｜固定 256 維表示，持續保留分子量'), [
        p('We extracted the official 256-dimensional penultimate linear representation from a prespecified public checkpoint in inference mode, without response-label fine-tuning. A second fixed checkpoint was tested separately as a sensitivity comparison. The variants either add POM to the baseline (3,176 total features) or replace only the Morgan fingerprint (1,128 total); all retain physicochemical descriptors including weight and both sequence blocks.',
          '以預先指定的公開權重，在推論模式擷取官方 256 維倒數第二層線性表示，未以反應標籤微調。另一組固定權重分開作敏感度比較。兩種做法為在原模型額外加入 POM（共 3,176 維），或只替換 Morgan 指紋（共 1,128 維）；皆保留分子量等理化描述及兩組序列特徵。'),
        p('All variants use 109 odorants × 24 receptors. Ammonium hydroxide was excluded because its two isolated ions have no covalent bonds for this graph-model workflow; it was not replaced with ammonia. The upstream model does not encode stereochemistry: 109 odorants map to 106 distinct graphs, including three indistinguishable stereoisomer pairs. Identical graphs receive identical features.',
          '所有版本使用 109 種氣味 × 24 個受體。氫氧化銨因為是兩個沒有共價鍵的獨立離子，不適用本輪圖模型流程而排除，沒有改成氨。上游模型不編碼立體化學：109 種氣味對應 106 個不同分子圖，其中三組異構物無法區分；相同圖使用相同特徵。'),
        p('A provenance audit found 108 of 109 non-stereochemical structures in the public 4,983-molecule candidate pretraining pool. Exact checkpoint training/test membership is unavailable. Chemical-group holdout therefore means unseen downstream Hallem responses, not a guarantee that the entire AI system has never encountered those molecular structures or human odor labels.',
          '來源查核發現，109 種非立體化學結構中，有 108 種出現在公開的 4,983 分子候選預訓練集合；精確權重的訓練／測試歸屬未提供。因此化學類群留出代表下游未見該組 Hallem 反應，不能保證整個 AI 系統從未看過相關結構或人類氣味標籤。')]),
    block(p('Results · the direction depends on the response model', '結果｜改善方向取決於下游反應模型'), [
        p('The prespecified primary comparison, HGB plus POM on unseen response chemical groups, changed R² from 0.3892 to 0.3232: Δ −0.0661 (95% interval −0.1327 to +0.0189). ExtraTrees instead rose from 0.3572 to 0.3967: Δ +0.0395 (−0.0490 to +0.1334). Replacing the fingerprint and using the second checkpoint showed the same model-dependent direction; every POM R²-difference interval crossed zero.',
          '事先指定的主要比較是 HGB 加入 POM、預測未見反應資料的化學類群：R² 從 0.3892 降至 0.3232，Δ −0.0661（95% 區間 −0.1327 至 +0.0189）。ExtraTrees 則從 0.3572 升至 0.3967，Δ +0.0395（−0.0490 至 +0.1334）。替換指紋及使用另一組權重，也呈現相同的模型間方向差異；所有 POM 的 R² 差值區間均跨零。'),
        p('ExtraTrees’ chemical-holdout R² gain did not improve ranking or absolute error: Spearman ρ changed 0.6465 → 0.6459 and MAE 25.2021 → 25.6071 spikes/s. On unseen receptors, adding POM gave small R² increases (HGB 0.2108 → 0.2332; ExtraTrees 0.1210 → 0.1321), but random features achieved 0.2312 / 0.1323. These results do not establish a POM-specific, stable gain. Table values are R².',
          'ExtraTrees 的化學類群留出 R² 上升，並未同時改善排序或絕對誤差：Spearman ρ 為 0.6465 → 0.6459，MAE 為 25.2021 → 25.6071 spikes/s。未見受體中，加入 POM 的 R² 小幅增加（HGB 0.2108 → 0.2332；ExtraTrees 0.1210 → 0.1321），但隨機特徵也達 0.2312／0.1323。尚不能建立 POM 特有且穩定的增益；下表列出 R²。')], headers=HEADERS,
        rows=table('pom',[('baseline',p('Baseline','原模型')),('replace_morgan_pom1',p('POM replaces fingerprint','POM 替換指紋')),
                         ('add_pom1',p('+ POM','＋POM')),('add_random256',p('+ Random 256','＋隨機 256')),
                         ('replace_morgan_pom2',p('Replace: second weights','替換：另一組權重')),('add_pom2',p('Add: second weights','加入：另一組權重'))]),
        figures=['pom-comparison','pom-predictions'], downloads=['molecular-features/pom/metrics.csv','molecular-features/pom/paired_uncertainty.csv','molecular-features/pom/coverage.csv']),
    block(p('Learning and redesign · retain the baseline; validate adaptation next', '學習與再設計｜保留基準，再檢驗任務微調'), [
        p('The project now has verified measured spectra, harmonic-mode descriptors and reproducible frozen AI features. None has yet established a stable general improvement over the matched baseline. POM with ExtraTrees remains a candidate for independent validation, not a validated replacement. These feature tests do not validate mutation effects, cross-species transfer, affinity, EC50 or detection limits.',
          '目前已建立可核對的實測頻譜、諧振模式描述與可重現的固定 AI 特徵，但尚未有一項建立相對基準的穩定全面改善。POM＋ExtraTrees 保留為獨立驗證候選，尚未成為已驗證的替代方案；本輪也沒有驗證突變效果、跨物種轉移、親和力、EC50 或偵測極限。'),
        p('LORAX studies low-rank task adaptation of chemical foundation models and motivates the next comparison, but we have not run it. Because its published work also uses Hallem data, future adaptation and model selection must occur within our training folds, followed by independent validation; weights exposed to held-out responses cannot provide an uncontaminated test. Additional 3D size descriptors and unresolved quantum structures are also future work. [33]',
          'LORAX 研究化學基礎模型的低秩任務微調，提供下一輪比較的依據，但本專案尚未執行。其文獻也使用 Hallem 資料，因此後續微調與選模須限於我們的訓練折內，再做獨立驗證；看過測試反應的權重不能提供無洩漏的測試。新增三維尺寸描述，以及未通過核對的量子構型，也仍屬後續工作。[33]')],
        figures=['feature-gains'], downloads=['molecular-features/benchmark-data.zip','molecular-features/provenance.json'])])]


def fig(title, caption, data, size=(1200,850), kind='result'):
    return dict(title=title, caption=caption, data='molecular-features/'+data if data else None, size=size, kind=kind)


MOLECULAR_FIGURES = {
    'ir-spectra': fig(('Measured odorant spectra', '氣味分子的實測頻譜'),
        ('Six accepted NIST gas-phase spectra after background correction and area normalization. Peak patterns describe relative molecular absorption, not receptor activity or absolute absorption strength. [27]',
         '六種通過核對的 NIST 氣相頻譜，已扣除背景並做總面積標準化。峰形描述相對分子吸收，並非受體活性或絕對吸收強度。[27]'), 'ir/coverage.csv', (1100,750), 'data'),
    'ir-comparison': fig(('Measured IR and size ablation', '實測 IR 與尺寸消融'),
        ('All variants use the same 82 odors and fixed folds. Removing molecular weight differs from removing all three size-related descriptors. IR did not improve chemical-holdout R² in either model; full paired intervals are downloadable.',
         '所有版本使用同一批 82 種氣味與固定切分。移除分子量不同於移除全部三項尺寸相關描述。IR 未提升兩模型的化學類群留出 R²；完整配對區間可下載。'), 'ir/metrics.csv'),
    'quantum-encoding': fig(('Equal-mode EVA versus intensity-weighted IR', '等權 EVA 與強度加權 IR'),
        ('Descriptors computed from two published harmonic mode sets, with the same Gaussian width and grid. The ordinate scales differ because EVA weights modes equally and computed IR uses intensities. Shading marks frequencies below the measured-IR window. This is not a measured spectrum or a receptor-bound calculation. [28, 29]',
         '由兩種公開諧振模式集合計算描述子，使用相同 Gaussian 寬度與網格。EVA 等權、計算 IR 依強度加權，因此縱軸尺度不同。底色表示低於實測 IR 視窗的頻段；這不是實測譜或受體內量子計算。[28, 29]'), 'quantum/normal_modes.csv', (1100,600)),
    'quantum-comparison': fig(('Quantum feature comparison', '量子振動特徵比較'),
        ('The 85-odorant comparison includes full EVA, computed IR, training-fold-only PCA and random-feature controls. PCA moves chemical-holdout scores closer to baseline but does not exceed it. These are predictions of published functional responses. [1]',
         '85 種氣味比較涵蓋完整 EVA、計算 IR、僅在訓練折擬合的 PCA，以及隨機特徵對照。PCA 使化學類群留出分數較接近基準，但未超過。預測目標為文獻的功能反應。[1]'), 'quantum/metrics.csv'),
    'quantum-common': fig(('Measured and computed spectra on the same odors', '在相同氣味上比較實測與計算頻譜'),
        ('All models are retrained on the same 67-odorant overlap. Different spectral ranges, dimensions and normalization remain part of the comparison; it cannot isolate source accuracy. Scores should not be compared directly to the larger cohorts.',
         '所有模型均在同一批 67 種共同氣味上重新訓練。頻譜範圍、維度及標準化仍有差異，不能單獨比較來源準確度；分數不可與較大子集直接比較增減。'), 'quantum/metrics.csv'),
    'pom-comparison': fig(('Does an odor-perception AI improve receptor predictions?', '嗅覺 AI 能否改善受體反應預測？'),
        ('Matched 109-odorant comparison. All variants retain molecular weight and sequence features. The second fixed checkpoint is a sensitivity analysis, not a selected best model. Chemical-group holdout applies to downstream response labels; upstream molecular exposure is possible. [31, 32]',
         '同一批 109 種氣味的比較。全部版本保留分子量及序列特徵；另一組固定權重用於敏感度分析，並非挑選最高分模型。化學類群留出針對下游反應標籤，上游可能已看過分子資訊。[31, 32]'), 'pom/metrics.csv'),
    'pom-predictions': fig(('Predicted versus measured response', '預測反應與實測反應對照'),
        ('Out-of-fold predictions for the chemical-group holdout, baseline versus added POM. Each point is a receptor–odorant pair; shared receptors and chemicals mean points are not independent experimental replicates. The dashed line denotes perfect prediction. [1]',
         '化學類群留出的折外預測，比較原模型與加入 POM。每點為一組受體–氣味配對；共用受體與化合物，並非彼此獨立的實驗重複。虛線表示預測與實測完全一致。[1]'), 'pom-predictions.csv', (1100,480)),
    'feature-gains': fig(('Do the improvements survive uncertainty?', '考慮不確定度後，是否仍有增益？'),
        ('Points show added-feature ΔR²; lines show paired group-bootstrap 95% intervals conditional on fixed predictions. Each row uses its own eligible cohort and matched baseline, not a common ranking of features. A line crossing zero does not establish a reliable gain; secondary intervals are unadjusted.',
         '點為加入特徵的 ΔR²，線為條件於固定預測的配對分組 bootstrap 95% 區間。各列使用自己的可用子集與相配基準，並非同一資料上的特徵排行榜。區間跨零不能建立可靠增益；次要區間未校正多重比較。'), 'feature-gains.csv', (1200,520)),
}


def feature_flow(lang):
    """Simple HTML diagram, readable on mobile and without JavaScript."""
    def t(en,zh): return en if lang=='en' else zh
    return f'''<div class="re-feature-flow" aria-label="{t('Molecular-feature experiment flow','分子特徵實驗流程')}">
<p class="re-feature-origin">{t('Receptor sequence + odorant chemistry (including weight) → functional response predictor','受體序列＋氣味化學特徵（含分子量）→ 功能反應預測器')}</p>
<div class="re-feature-steps">
<a href="#measured-ir"><strong>A · {t('Measured IR','實測 IR')}</strong><span>{t('82 odors · add spectra / remove size features','82 種氣味｜加入頻譜／移除尺寸特徵')}</span></a>
<a href="#quantum-vibrations"><strong>B · {t('Quantum modes','量子振動模式')}</strong><span>{t('85 odors · EVA / computed IR / PCA; 67-odor overlap','85 種氣味｜EVA／計算 IR／PCA；67 種共同子集')}</span></a>
<a href="#ai-odor-features"><strong>C · OpenPOM</strong><span>{t('109 odors · add or replace molecular features','109 種氣味｜加入或替換分子特徵')}</span></a>
</div><p class="re-feature-outcome">{t('Same-pair holdouts + random controls + uncertainty → retain the baseline; test task adaptation next','同配對留出＋隨機對照＋不確定度 → 保留基準；下一步測試任務微調')}</p></div>'''
