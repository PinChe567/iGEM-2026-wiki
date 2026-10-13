"""Bilingual captions for figures drawn from completed computational analyses."""

RESULT_FIGURES = {
    'mutation-robustness': {
        'title': ('Do the proposed mutations improve panel preference?', '候選突變是否改善氣味組合偏好？'),
        'kind': 'result', 'size': (1000, 560), 'data': 'mutation-robustness.csv',
        'caption': (
            'Common-box docking comparison against each wild-type receptor. Dots show mean shifts; bars span the minimum and maximum across docking searches, not a confidence interval. The shift is mean ΔVina for controls minus mean ΔVina for the mold-related panel; positive values favor the selected mold-related panel. No candidate stays positive across the searches. This scoring diagnostic does not establish an affinity or functional change.',
            '在相同 docking 搜尋框下，比較突變與各自的野生型受體。點為平均改變，橫線為各次搜尋的最小至最大值，不是信賴區間。偏好改變定義為「對照組平均 ΔVina − 霉味相關組平均 ΔVina」，正值有利於選定的霉味相關組；尚無候選在各次搜尋皆維持正值。此分數診斷不能證明親和力或功能改變。'),
    },
    'odor-response-scatter': {
        'title': ('See the odorants behind the correlation', '從每個氣味分子看相關性'),
        'kind': 'result', 'size': (1000, 700), 'data': 'odor-response-scatter.csv',
        'caption': (
            'Each panel contains the same 29 odorants. Our docking scores are compared with AaOR10 calcium responses digitized from Bohbot et al. (2011), Figure 2; these are literature measurements, not our wet-lab results. The horizontal axis reverses the Vina score so stronger predicted docking lies to the right. Color identifies aromatic chemistry. The scatter exposes substantial response variation at similar scores; ensemble docking has not established a calibrated sensitivity or EC50 predictor.',
            '每格呈現相同的 29 種氣味。將本研究 docking 分數與 Bohbot 等人（2011）圖 2 讀取的 AaOR10 鈣反應比較；反應值是文獻測量，並非本團隊濕實驗結果。橫軸將 Vina 分數反向，預測 docking 較有利者在右側；顏色區分是否具有芳香環。相近分數仍對應不同反應，構型集合 docking 尚未建立可校準的敏感度或 EC50 預測。'),
    },
    'apo-stability': {
        'title': ('Which parts move during odorant-free MD?', '無氣味分子的 MD 中，哪些區域在移動？'),
        'kind': 'result', 'size': (1100, 420), 'data': 'apo-stability.csv',
        'caption': (
            'Recorded 5 ns trajectories of the two rebuilt apo starting models. All three readouts use the same fit to resolved-core Cα atoms and measure displacement from each starting structure. Rebuilt regions cover the modeled missing parts of the complex, not only OR10. The shaded first 1 ns includes heating and staged restraint release; the remaining 4 ns are unrestrained. Larger motion in rebuilt regions motivates structural uncertainty checks; these short trajectories do not demonstrate equilibrium or correct loop reconstruction.',
            '兩個 apo 補建起始模型的 5 ns 實際軌跡。三項指標皆以已解析核心的 Cα 對齊，量測相對各自起始結構的位移。補建區域包含複合體中原先缺失的建模部分，不限於 OR10。底色的前 1 ns 包含升溫與分階段解除限制，後 4 ns 無位置限制。補建區域較大的運動提醒我們檢查結構不確定性；短程軌跡不能證明已達平衡或補建構型正確。'),
    },
    'entry-trajectories': {
        'title': ('Distance and contacts during attempted entry', '嘗試進入時的距離與接觸變化'),
        'kind': 'result', 'size': (1100, 680), 'data': 'entry-trajectories.csv',
        'caption': (
            'Actual unrestrained trajectories from water, membrane-interface and near-entrance placements, shown as 20 ps-bin medians. A/B identify the two starting models; all analyzed trajectories are included. Dashed lines mark the separate entry components: pocket distance ≤0.5 nm and contact with at least four pocket residues (within 0.45 nm), jointly sustained for 100 ps. The full-frame analysis found no entry. The 2 ns and 10 ns observation windows differ, so this plot does not estimate comparative entry probabilities.',
            '外部水相、脂膜界面與入口附近放置後的實際無位置限制軌跡，以 20 ps 區間中位數繪圖。A／B 表示兩個起始模型，納入這些配置的全部已分析軌跡。虛線分別為進入條件：距口袋 ≤0.5 nm，且接觸至少 4 個口袋殘基（距離 ≤0.45 nm），兩者須同時持續 100 ps。完整影格分析未見進入。三組觀察窗分別為 2 ns 與 10 ns，不能用本圖估計相對進入機率。'),
    },
    'path-pulling': {
        'title': ('Does the ligand follow the pulling target?', '配體是否跟得上牽引目標？'),
        'kind': 'result', 'size': (1000, 800), 'data': 'path-pulling.csv',
        'caption': (
            'Recorded outward SMD along two candidate corridors at two nominal target speeds. Time begins after the common 0.1 ns baseline; lines are 20 ps-bin medians. The target is held when lag or force becomes too large, producing plateaus. Target path arc, actual ligand–pocket distance and bias force are separate readouts: advancing the target did not establish ligand escape. The receptor and surrounding environment were flexible during these runs; applied force is not a measured natural exit barrier.',
            '沿兩條候選走廊、以兩種名義目標速度進行的向外 SMD。時間從共同的 0.1 ns 基線之後起算，曲線為 20 ps 區間中位數。落後距離或施力過大時固定目標，因此出現平台。目標沿路進度、配體至口袋距離、偏壓力是三種不同指標：目標前進並未建立分子逃離。這些模擬中受體與周圍環境可動；施加的力不是量得的自然移出能障。'),
    },
    'extended-wait': {
        'title': ('Does a longer local wait relieve the obstruction?', '多等待一段時間，能否解除局部受阻？'),
        'kind': 'result', 'size': (1000, 800), 'data': 'extended-wait.csv',
        'caption': (
            'The target was held fixed after lag developed in the slower pulling condition. This plot shows the extension from 0.5 to 2 ns of total fixed-target waiting, at the original 2 ps sampling. Catch-up requires both axial lag ≤0.20 nm and bias force ≤100 kJ/mol/nm (about 166 pN); orange diamonds mark individual frames meeting both. These brief events did not persist for 100 ps and no sustained exit was observed. Longer local waiting alone has not resolved the blockage in the tested window.',
            '較慢牽引條件出現落後後，將目標固定。本圖呈現總等待時間由 0.5 延長至 2 ns 的部分，保留原始 2 ps 取樣。跟上條件須同時滿足沿路落後距離 ≤0.20 nm 與偏壓力 ≤100 kJ/mol/nm（約 166 pN）；橘色菱形標示同時達標的個別影格。這些短暫事件未持續 100 ps，也未觀察到持續移出。於已測時間窗內，延長局部等待仍未解除受阻。'),
    },
    'path-repulsion-profile': {
        'title': ('Locate the obstruction along a candidate path', '定位候選路徑上的阻礙'),
        'kind': 'result', 'size': (1100, 830), 'data': 'path-repulsion-profile.csv',
        'extra_data': 'path-bottleneck-contributors.csv',
        'caption': (
            'Detailed static placement scan for the 69 ns entrance-guided A snapshot: the lower corridor has the lowest combined repulsion peak among the evaluated selected paths. Top panels score the same ligand poses with protein alone and with protein plus lipids; the dotted line is the native-pose reference (~23 kJ/mol). Bottom panels identify the four largest contributors at two different peaks of the lower route: protein at 1.54 nm and combined at 2.97 nm. Protein residues and later lipids both obstruct this candidate. Distances are path arc lengths, not simulation time; positive LJ repulsion is a clash diagnostic, not a free-energy profile.',
            '對入口引導 A 的 69 ns 快照，細看固定構型下的分子放置掃描；其較低走廊是已評估選定路線中，合併排斥峰最低者。上方對同一批配體姿態分別計算蛋白與蛋白加脂質排斥，點線是原始姿態參考（約 23 kJ/mol）。下方列出較低走廊兩個不同峰值處的前四大貢獻：蛋白峰在 1.54 nm，合併峰在 2.97 nm。候選路線先後遇到蛋白殘基與脂質阻礙。橫軸是沿路距離，不是模擬時間；LJ 正值排斥是碰撞診斷，並非自由能曲線。'),
    },
    'saved-conformations': {
        'title': ('Look at the structures saved during MD', '直接看 MD 保存的結構'),
        'kind': 'result', 'size': (1000, 700), 'data': 'saved-conformations.csv',
        'caption': (
            'Coordinates from one entrance-guided A trajectory, saved at 7.6, 27.6, 69 and 70 ns. All frames are aligned on OR10 Cα atoms to the first displayed frame and shown in one fixed projection at the same scale. Teal and purple highlight pocket-adjacent segments 117–139 and 281–299; orange shows actual o-cresol heavy atoms. The last frame follows bias removal. Local geometry changes while the ligand remains near the pocket. A two-dimensional projection cannot establish clearance, and selected snapshots do not show a continuous entry or exit path.',
            '同一條入口引導 A 軌跡在 7.6、27.6、69 與 70 ns 保存的座標。所有影格以 OR10 Cα 對齊第一格，採相同投影與比例。藍綠與紫色標出鄰近口袋的 117–139、281–299 區段，橘色是實際 o-cresol 重原子；最後一格位於撤除偏壓之後。局部幾何改變時，配體仍在口袋附近。二維投影不能判斷空間是否可通行，選取的快照也不代表連續進出路徑。'),
    },
}
