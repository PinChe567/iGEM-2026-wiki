# Experiments and completion / 實驗與完成

Read the schedule first. Then use the sample guide and validation procedure. These are instructions and blank forms, not measured results. 先看排程，再準備樣本及驗證；下列文件與表單不是實驗結果。

| 用途 / Purpose | 中文 | English |
|---|---|---|
| 10/11–20 排程、預養井分支 / Schedule and early-culture branch | [完成計畫](Completion_Plan_ZH.md) | [Completion plan](Completion_Plan_EN.md) |
| 螢光素鈉及 GCaMP6f HEK293 + DMEM / Sample preparation | [PDF](Fluorescence_and_Cell_Test_ZH.pdf) · [來源](Fluorescence_and_Cell_Test_ZH.md) | [PDF](Fluorescence_and_Cell_Test_EN.pdf) · [Source](Fluorescence_and_Cell_Test_EN.md) |
| 完整標準液與判讀 / Standard series and analysis | [PDF](Validation_Plan_ZH.pdf) · [來源](Validation_Plan_ZH.md) | [PDF](Validation_Plan_EN.pdf) · [Source](Validation_Plan_EN.md) |
| 他人試用空白問卷 / Blank user questionnaire | [PDF](User_Feedback_ZH.pdf) · [來源](User_Feedback_ZH.md) | [PDF](User_Feedback_EN.pdf) · [Source](User_Feedback_EN.md) |

完成計畫與問卷採用 5–10 分鐘短版空井、DEMO 連線／開始／停止與 CSV 任務。由開發者準備；未測項目標為未測或不適用。不要用已填內容覆寫空白問卷。主手冊見 [04_manuals](../04_manuals/README.md)。

The plan and questionnaire specify a 5–10-minute trial. The developer prepares empty wells and DEMO. Tasks cover identification, connection, Start, Stop, and CSV export. Mark omitted tasks as untested or not applicable. Keep completed responses separate from the blank form.

## Analysis and blank records / 分析與空白記錄

- [quick_check.py](quick_check.py): analyze condition-labelled physical UI session JSON. Use --self-test for synthetic software checks.
- [plot_validation.py](plot_validation.py), [import_ui_json.py](import_ui_json.py), and [test_analysis.py](test_analysis.py): detailed engineering records and analysis checks.
- [templates](templates): empty CSV files for samples, cells, electronics, optical mapping, fit, flow, reassembly, and user feedback.
- [Fluorescence_Test_References.json](Fluorescence_Test_References.json): primary references and recipe provenance.
- [requirements.txt](requirements.txt): analysis dependencies.

Follow the validation plan for exact commands and acceptance criteria. Detailed blank forms do not require repeating every historical test. Analysis creates results only when actual input is supplied. Label DEMO and simulation data clearly. Do not report software self-tests as measurements.

依驗證計畫執行分析與判讀。保留詳細空白表，不代表本輪必須全部填寫。只在實際量測後建立結果；DEMO、模擬及程式自測不得標為實測。

