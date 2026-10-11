# 光學圖表與影片指南

每一張圖與影片都有獨立中英文說明。圖中僅保留標題、面板、座標、圖例與數值標示；放入 paper／wiki 前，請連同圖說與假設閱讀。

- [01_parameter_sweep · 光學功率敏感度](figure_notes/01_parameter_sweep_ZH.md)
- [02_floor_maps · 井底照度與位置相關收光](figure_notes/02_floor_maps_ZH.md)
- [03_well_transfer · 細胞底層的井間混合矩陣](figure_notes/03_well_transfer_ZH.md)
- [04_detector_angles · PD 收光角度診斷](figure_notes/04_detector_angles_ZH.md)
- [05_frequency_recovery · 四種 PD 訊號比較](figure_notes/05_frequency_recovery_ZH.md)
- [06_conditional_budget · 條件式雜訊門檻](figure_notes/06_conditional_budget_ZH.md)
- [07_sample_paths · NE 抽樣光路](figure_notes/07_sample_paths_ZH.md)
- [08_volume_standard_validation · 均勻標準液的混合矩陣](figure_notes/08_volume_standard_validation_ZH.md)
- [09_interference_metrics · 頻譜與四通道解調誤差](figure_notes/09_interference_metrics_ZH.md)
- [10_interference_sweep · 干擾與雜訊掃參數](figure_notes/10_interference_sweep_ZH.md)
- [optical_slow_motion · 同步光學影片](figure_notes/optical_slow_motion_ZH.md)

原始幾何 MC 與條件式接收器模型是不同層次的證據。反射綠光仍可能是有效螢光；寄生藍光可能與 LED 完全同頻。環境光、響應度與兩種雜訊均為明列假設，任何圖都不證明實板準確度或細胞靈敏度。

在此資料夾完整重建：
```text
python run.py --verify --run --maps --convergence --standard --workers 4
python leakage_sweep.py --workers 4
python run.py --plots --video --ffmpeg C:/path/to/ffmpeg.exe
python validate_publication.py
```
