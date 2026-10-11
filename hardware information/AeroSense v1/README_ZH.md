# AeroSense 完整工程交付

先讀本檔，再讀 `docs/ZH/Assembly_Manual_ZH.pdf`。本套件是可重現的工程原型：有實際執行的模擬、可編譯韌體和可操作示範 UI；PCB 尚未製造，沒有實板、細胞或氣味辨識效能驗證。不要把模型圖當成實物照片。

## 檔案入口

|工作|檔案|
|---|---|
|列印與設計|`STL/`、`CAD/`、`docs/ZH/Design_Drawings_ZH.pdf`|
|光學、氣流與 DLIA 結果|`docs/ZH/Simulation_Analysis_ZH.pdf`、`results/`|
|重跑與重畫|`reproduce.py`、`simulation/`、`requirements.txt`|
|採購、列印材料、PCB 子料|`BOM/BOM_ZH.xlsx`；四個工作表分開，不重複計入 PCB 報價|
|組裝|`docs/ZH/Assembly_Manual_ZH.pdf`|
|手機 UI、ESP32、伺服器|`software/`、`docs/ZH/Software_Guide_ZH.pdf`|
|操作、校正與性能驗證|`docs/ZH/Operating_Protocols_ZH.pdf`|
|使用者回饋|`docs/ZH/User_Feedback_ZH.pdf`|

每份文件都有英文版與可編輯 Markdown；`manifest.json` 可核對檔案 SHA-256。使用者來源 PDF/論文本身沒有重新散布。

## 最快開始

1. 先執行手機介面的示範：在套件根目錄執行 `python software/server/server.py --demo`，以同一台電腦瀏覽 `http://127.0.0.1:8765`，API key 輸入 `local-demo-key`。資料明確標記 DEMO，沒有連到實板。
2. 先印四井中的一個作尺寸／材料測試，再印大殼。預設共八件；可拆洗內蓋用兩件取代一件，總共九件。兩套內蓋不能同時累加採購。
3. 給廠商 `validation/fit_measurements.csv`，取得含元件 STEP、LED/PD 方向與最高點；尚無法保證「一定不撞件」。
4. 依操作流程先暗訊號、電子假負載、無細胞螢光標準，再做材料／细胞驗證。預設韌體只允許 LED 全關的暗量測；量測供電、ADC 與 LED 波形後才設定 `BOARD_VALIDATED=true`。

## 樹脂與列印數量

|零件|數量|樹脂|
|---|---:|---|
|01 殼體、03 外蓋、04 內蓋|各 1|Rigid PC/GF-like Black|
|02 底托|1|Aqua 8K Gray|
|05 四個獨立一體 well|4|Aqua Clear Plus，僅供尺寸及材料試驗，未確認可直接培養 HEK293T|

Well 內外底面都平，底厚 0.5 mm，名目 150 µL。紫色樹脂的吸收與自身螢光不能用拋光消除；需實測 470/520 nm 相關光譜與空白，通不過就換經測試的透明材料或細胞培養容器方案。平底可減少厚度變化，但不保證照明均勻。

## 重現計算

建議 Python 3.12，在獨立環境安裝 `python -m pip install -r requirements.txt`。以下命令從解壓後根目錄執行。`--out` 指定尚不存在的新資料夾，保留交付資料：

```text
python reproduce.py --out ../AeroSense_replot --plots
python reproduce.py --out ../AeroSense_movies --video
python reproduce.py --out ../AeroSense_optics --optics
python reproduce.py --out ../AeroSense_flow --flow --engine csharp --workers 2
python reproduce.py --out ../AeroSense_cad --cad
```

光學全跑需要較長時間；保存種子與每次能量帳本。CFD 全跑是 27 組孔板加 1 組無孔板，不是阻力公式替代。Windows C# 加速器由附帶原始碼編譯，需要系統 .NET Framework C# compiler；其他平台可用 `--engine numpy`，速度較慢。OpenSCAD 是 CAD 外部依賴，預設 Windows 標準安裝位置；非標準路徑直接用 `python CAD/build.py --out 新資料夾 --openscad 執行檔路徑`。

CFD 已附 0.3/0.2 mm 基準網格結果。額外重算網格細化：

```text
python simulation/flow_sweep.py --case base --dx .3 --engine csharp --max-steps 60000
python simulation/flow_sweep.py --case base --dx .2 --engine csharp --max-steps 60000
```

已收斂檔案會跳過；需要真正重算時用新的 `--out` 資料夾。不要直接覆寫交付資料。影片使用保存的定常速度場推進被動標記；不是非定常流體解，也沒有求細胞剪力、氣味溶解或生長。

圖 I 對應點光源到 PD 的收集比例，圖 J 是發射光 fluence rate × 收集比例；沒有把結果各自除以最大值來「畫得像論文」。本設計幾何、介質和濾片與論文不同，圖形及量級不應被強迫相同。

## 目前證據與尚未完成的驗證

- 已執行：24 光學條件×3種子、247 點收光圖、27 孔板+無孔板 CFD、48 合成 DLIA 案例、UI/API/校正與模型程式測試、韌體及網頁檔案系統編譯。
- 孔板案例在四井上方平均速度指標上都高於無孔板對照；網格獨立性尚未成立，不能以此保證保護細胞。
- PD 偏移已納入；正負方向仍由廠商封裝旋轉／底視鏡像確認。四井以 LED 配準；沒有假裝四個井中心恰好在 PD 周圍每隔 90°。
- 單一 PD 的四頻數值是 LED 頻道，不自動等於四井獨立訊號。先量實際混合矩陣，再判斷能否可靠解混。
- 神經網路提供訓練／獨立批次留出／推論程式，不提供虛構已訓練模型或辨識準確率。範本在 `software/templates/`。
- 光學濾片、氣體濾器與轉接等仍未完整報價；BOM 明確標「待報價」。目前已知單機部分成本約 NT$66,749–67,182，包含 PCB 此次設計／開機分攤，不是量產價。
- 手機直連 ESP32 與伺服器兩種路徑都有程式。未建立外部雲端帳戶、未公開部署；遠端網路使用需依軟體指南配置 HTTPS 與金鑰。

本套件可作 wiki 的設計、方法及模擬證據；實物照片、校正曲線、細胞資料、跨批次模型評估與他人組裝問卷必須以真實實驗補齊。`validation/` 的通過項目不能改寫成整台機器已驗證。
