# optical_slow_motion · 同步光學影片

## 可投稿圖說

NE 抽樣光路、四顆 LED 狀態與理想、收到、疊圖、殘差訊號共用同一時鐘。播放放慢 100 倍，20 秒影片呈現 0.2 秒調變。

## 如何生成與假設

第 k 格使用 sample=round(k×4000/(10×100))。LED 狀態、NE 路徑、曲線終點與游標皆讀同一取樣。第零格全部使用 sample 0，不先畫未来訊號。共 200 格、10 fps，時間為 0–199 ms；最後一格停留涵蓋剩餘 1 ms 物理時間。

## 結果

先前移動視窗會在開頭固定呈現未來的 0–60 ms 曲線，而左圖已前進，造成不同步觀感。現在固定視窗只揭露截至當下的歷史。這是顯示修正，不是修改光子飛行物理或 CAD。

## 如何讀圖：座標與圖例

A 只畫 NE 真實轨跡；其他 LED 顯示同步狀態，但不鏡射光線。B 理想、C 收到、D 綠／橘疊圖、E 紫色殘差。橫軸皆 0–200 ms，直線游標為共同時間；縱軸綠光等效 nW，殘差另有尺度。紫色 PD 十字標示 (0,−0.4,40.5) mm。

## 限制

光路依 LED 状態同步亮滅，沒有移動光點或捏造的毫秒飛行延遲。反射螢光仍在理想訊號；同頻激發污染仍在收到訊號。影片不是細胞實測或完整電子時序模型；GIF 與 MP4 共用相同 200 個時間點。

## 資料與重現

results/video_frame_alignment.json; results/video_metadata.json; results/animation_paths.json; results/frequency_traces.npz; publication.py render_frame()/video()

```text
python run.py --plots
python run.py --plots --video --ffmpeg C:/path/to/ffmpeg.exe
```
