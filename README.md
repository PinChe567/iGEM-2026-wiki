# AeroSense Showcase v2

這版針對目前 interactive 的主要問題重新設計 Blender scene：

- 果蠅改成 rear-dorsal chase 用模型，翅膀 pivot 與身體連在胸部。
- Warehouse 有貨架、咖啡袋、咖啡豆、木箱、燈具、障礙物、實際 VOC source。
- Olfaction 不再是一堆圈圈，而是一個 antenna/sensilla corridor + 明確 receptor gateway。
- Cell 是單一大型 HEK293T-like cell chamber，含 receptor、Ca²⁺ 路徑、GCaMP signal。
- Hardware 是 sample chamber → PD → TIA → ADC → MCU 的 PCB 場景。
- Decoder 是 AL glomeruli → projection → sparse KC field，不再用不明圓圈。
- Return 回到 stored-food application。

## 執行

直接雙擊 `run_windows.bat`，或 PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File .\run_windows.ps1
```

輸出位置：

```text
models/showcase_v2/aerosense_fly_v2.glb
models/showcase_v2/aerosense_01_warehouse_v2.glb
models/showcase_v2/aerosense_02_olfaction_v2.glb
models/showcase_v2/aerosense_03_cell_v2.glb
models/showcase_v2/aerosense_04_hardware_v2.glb
models/showcase_v2/aerosense_05_decoder_v2.glb
models/showcase_v2/aerosense_06_return_v2.glb
models/previews_v2/*.png
models/blender/AeroSense_Showcase_v2.blend
```

生成後，把 `CURSOR_PROMPT_V2.txt` 給 Cursor，讓它把新版模型、穩定 chase camera、manual/autopilot、real-time score、stage dive、文字動畫一起接進前端。

> 注意：此環境無 Blender runtime，因此腳本已做 Python syntax check，但最終 render/API 相容性仍需你本機 Blender 跑一次。若有 Blender 5.2 API error，把完整 traceback 貼回來即可修。
