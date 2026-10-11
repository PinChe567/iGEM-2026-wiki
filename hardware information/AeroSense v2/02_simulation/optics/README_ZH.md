# 光學模擬與投稿圖表

先看 [Figure_Guide_ZH.md](Figure_Guide_ZH.md)。十張圖與同步影片，各自在 `figure_notes/` 有中英文獨立說明，包含可投稿圖說、生成方法、结果、所有座標／圖例、資料及限制。`captions.json` 提供程式可讀的雙語圖說；完整光學分析見 [Analysis_ZH.md](Analysis_ZH.md)。

資料分成三層，不能混成實驗證據：

- 原始幾何 MC：24 組 × 3 種子、空間圖與體積標準液模型。
- 新增逐 LED 阻擋 MC：四 LED × OD3／4／5，共 12 組，每組三種子，額外 3,024,000 封包。各 LED 都有自己的藍光漏光，沒有借用另一顆的增益。
- 條件式接收器模型：144 組情境 × 32 次雜訊重複。環境光、電子雜訊、R520=0.3 A/W、R470/R520=0.6／0.8／1 都是假設。Poisson 光電子模型使用離散取樣保持，不是真實 PWM 邊緣積分或類比 TIA 模型。

理想訊號保留全部模型綠光，包含有效的反射螢光。殘差包含激發漏光、環境光、散粒與電子雜訊，不能把所有反射光叫作雜訊。與 LED 同頻的污染不會被頻率分離消除。光學功率、綠光等效接收器功率、實測 ADC 電壓是不同量。

## 重現方式

在本資料夾使用 Python 3.11 與指定套件版本：

```text
python -m pip install -r requirements.txt
python run.py --verify --run --maps --convergence --standard --workers 4
python leakage_sweep.py --workers 4
python run.py --plots --video --ffmpeg C:/path/to/ffmpeg.exe
python validate_publication.py
```

只使用已附 MC 資料，重畫圖、條件訊號、圖說與報告：

```text
python run.py --plots
```

重做影片時加上 `--video --ffmpeg 路徑`。未提供 ffmpeg 時可以產生 GIF；MP4 需要該執行檔。影格直接送到編碼器，GIF 留在記憶體，不會在公開資料夾留下逐格圖。MP4 與 GIF 均為 20 秒、200 格、10 fps，涵蓋 0–199 ms 及最後一格間隔，放慢 100 倍。

影片每個面板都讀同一 sample，包括第零格。只畫 NE 真實抽樣軌跡，四 LED 狀態各依自己的閘門；沒有鏡射光路或捏造的飛行延遲。`results/video_frame_alignment.json` 保存每一格的時間、LED 狀態與顯示數值。

## 檔案用途

| 檔案 | 功能 |
|---|---|
| `transport.py`、`run.py` | 原始光學追蹤、參數掃描與空間圖 |
| `leakage_sweep.py` | 新增逐 LED OD3／4／5 MC |
| `signal_model.py` | 理想／污染比較、殘差分解、144 情境與數值驗證 |
| `publication.py`、`visualize.py` | 十張簡潔圖與同步影片 |
| `write_analysis.py`、`write_figure_guide.py` | 雙語分析、各圖說明及圖說 |
| `validate_publication.py` | 重畫雜湊、MC 未改動、圖說完整度、同步與實際影片長度檢查 |
| `results/leakage_MC_summary.json` | 各 LED 藍／綠光平均、MC SE、封包數 |
| `results/frequency_traces.npz` | 理想、收到、殘差、漏光、反射激發、環境光、散粒／電子雜訊 |
| `results/interference_sweep*.csv` | 18,432 筆通道重複記錄與 576 筆彙整 |
| `results/publication_validation.json` | 實際執行的重現與同步檢查 |

固定種子及 NumPy 版本可重現數值；不同系統字型可能改變圖片像素。MC 不確定性另列，沒有混入合成雜訊重複。這些圖不證明 PCB 已運作、生物靈敏度足夠或已得到檢測極限。CAD 原始碼位於 `../../09_engineering_sources/CAD/`，本次圖表更新沒有改動實體幾何。
