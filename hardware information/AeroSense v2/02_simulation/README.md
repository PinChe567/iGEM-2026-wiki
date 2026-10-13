# Simulation results and reproducible code

| Model | Start here | Main result |
|---|---|---|
| Optics | [README](optics/README.md) · [four-filter movie](optics/videos/filter_signal_comparison.mp4) | No filter, one/two LEE 101 layers and a 500 nm OD4 scenario. Includes raw signals, corrected residuals, shot noise and blue drift. |
| Airflow | [README](airflow/README.md) · [movie](airflow/videos/airflow_comparison.mp4) | Selected inlet shelf, gas-delivery histories and conditional flow-rate tradeoffs. |
| Membrane/liquid | [README](membrane/README.md) | Liquid-depth and membrane transport sensitivity. PDMS is not selected without target-specific evidence. |

Each model has one README, `code/`, `figures/` and CSV `results/`. Models with a movie also have `videos/`. Necessary source metadata and numerical fields are in `code/data/`. Keep those JSON/NPZ files with the source code: they enable reproduction without repeating expensive MC or CFD.

All models use analytic geometry. No external CAD or commercial solver is required to use saved results. The airflow full solver uses included C# sources and the Windows .NET compiler, or a slower NumPy engine. Python dependencies and exact commands are in each model README. The optional PD-curve extraction requires the named manufacturer PDF; normal optical reproduction uses its saved CSV.

The model source package needs this README plus each model's README, complete `code/` and CSV `results/`. Figures and videos can be regenerated. Simulated volumes, powers, noise, gas properties and selection targets remain conditional assumptions. These results do not establish physical working volume, PCB performance or cell safety.

中文：每個模型只保留一份說明、程式、必要輸入、CSV、科學圖與既有影片。完整方法、限制與重現指令請由上表進入。光學以目前四組濾片為唯一主比較；模擬結果仍需實體校正與實驗驗證。
