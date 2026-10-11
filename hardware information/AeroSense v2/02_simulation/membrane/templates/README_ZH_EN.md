# 實驗紀錄範本 / Experimental record templates

這三個 CSV 只有欄名，沒有任何實驗數據。先確認一種目標 VOC、一種干擾物、允許延遲及恢復標準；不必把模擬的全部參數做成實驗。未知欄位留白，不要填 0。

These CSVs contain headers only, with no experimental measurements. First define one target VOC, one interferent, acceptable delay and recovery. The full simulated grid is not a required experimental program. Leave unknown fields blank rather than entering zero.

1. `membrane_characterization.csv`：紀錄實際配方、固化條件、膜厚、兩側濕度、氣體濃度單位、穩態通量與延遲。僅在邊界條件符合擴散模型時，才由通量和延遲估計 P、D、K。5:1、10:1 或 20:1 是配方名稱，不能直接換算傳輸性質。
   Record formulation, curing, thickness, humidity on both sides, concentration units, steady flux and lag. Infer P, D and K only if the measured boundary conditions satisfy the model. Formulation ratios do not automatically specify transport properties.
2. `gas_liquid_delivery.csv`：先在實際 100 µL 幾何做無膜測試，分別量測井口氣相與接近井底的液相濃度；若使用替代示蹤物，清楚填寫分子名稱。不同示蹤物只可支持相應的混合／傳輸結果，不能證明目標 VOC 的選擇性。
   Begin with a no-film test in the actual 100 µL geometry. Distinguish rim-gas and near-bottom-liquid concentration. Name any surrogate tracer; it does not establish target-VOC partitioning or selectivity.
3. `water_oxygen_checks.csv`：紀錄實際溫度、濕度、液量或質量、溶氧及 pH 的變化；未知生物耗氧量留白。沒有量測就不能以 PDMS 透氧文獻宣稱細胞一定能存活。
   Record actual temperature, humidity, liquid volume or mass, dissolved oxygen and pH. Leave unknown respiration blank. Published PDMS permeability alone does not establish cell viability.

每筆資料保留原始檔名、空白對照與重複次數。GCaMP 訊號可與濃度資料比較，但不能單靠它區分氣路延遲、膜吸收、液相傳輸、受體反應和光學變動。

Retain raw-file references, blanks and replicates. Compare GCaMP with concentration measurements, but do not use GCaMP alone to distinguish gas delivery, membrane uptake, liquid transport, receptor response and optical changes.
