# 薄膜與液相傳遞模擬入口

先讀`Analysis_ZH.md`。這個模組沒有修改八個指定STL，也沒有把PDMS加進本次工作版。它評估未來薄膜構想，以及已確認的100 µL、細胞貼井底之傳遞路徑。

在本資料夾開終端機，使用Python 3.11以上：

```text
python -m pip install -r requirements.txt
python run.py --plots
```

會重跑解析解驗證、243組膜條件、108組混合／供氣敏感度、25組介面阻力、液深／氧容量／選擇比計算及七張圖。只想重畫圖可執行`python plot.py`，它讀現有CSV。數值運算可重現，字型可能因電腦不同略變；不需商業求解器、下載模型或隱藏幾何快取。沒有使用捏造的生物資料。

| 位置 | 用途 |
|---|---|
| `model.py` |分層擴散、分配、守恆求解器及液柱解析解 |
| `run.py` |所有假設、掃描、檢查與CSV／JSON產生 |
| `plot.py` |七張圖的完整繪圖程式 |
| `couple_gas_history.py` |指定井口氣體歷史；僅單向連接 |
| `integrate_airflow.py` |實際執行NE井口CFD串接，以及明示假設的延伸上下界 |
| `results/summary.json` |重要數值與證據邊界 |
| `results/validation.json` |解析解及網格細化檢查 |
| `results/*.csv` |完整參數與歷史，未達時間留空 |
| `figures/` |圖內文字精簡的七張圖 |
| `Figure_Guide_ZH.md`、`figure_notes/` |逐圖中英文解釋 |
| `captions.json` |依PNG檔名對應的中英文圖說 |
| `sources.json` |輸入來源與原始文獻 |
| `templates/` |空白實驗記錄表，不含假資料 |
| `decision.json` |PDMS尚未納入目前組裝的決策 |

要改假設可修改`run.py`中的參數列表，或以SI單位呼叫`model.well()`。沒資料時不要把某D／K組合直接冠上物種或配方名稱。預設D膜=10⁻¹⁰ m²/s、K膜/氣=100、D液=10⁻⁹ m²/s、K液/氣=10，只是示例假設。

要使用CFD或實測的井口歷史：

```text
python couple_gas_history.py --csv PATH_TO_CSV --time time_s --column RIM_COLUMN
```

CSV時間從0開始且嚴格遞增，濃度非負並除以共同氣相參考。請使用井口值，不能拿井內或液面附近平均再重跑，否則重複計入氣層。沒有吸收邊界的CFD歷史也不會因此變成雙向耦合。短時間CFD資料不能用來宣稱已經求得數小時後的t90。

本次結論：低氣速不會消除分子擴散，但8.93 mm靜止液柱在明示假設下可能造成數小時延遲。這是實測優先項目，不是實機反應時間保證；PDMS也未被假定為防水蒸氣或保證供氧的材料。

本包也已把氣相CFD基準案例接到無膜及100 µm示例。執行`python integrate_airflow.py`可重現，會讀取相鄰airflow模組的`gas_transport_results/shelf_w8_e0p2_D10_dx0.4_dt0.5.csv`。原始CFD只到300秒；另外命名的continuation CSV在之後把井口固定於最後值或設為1，是明示假設，不是延長CFD。結果見`results/CFD_rim_coupling_summary.json`。`run.py --plots`不會自動重跑這個跨模組分析。
