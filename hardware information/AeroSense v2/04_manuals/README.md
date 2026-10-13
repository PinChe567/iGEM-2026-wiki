<<<<<<< HEAD
# Manuals / 主手冊

Start with the manual for your role. 每種角色只保留一套中英文主手冊。Markdown 是編輯來源，PDF 是閱讀版。

| 用途 / Purpose | 中文 | English |
|---|---|---|
| 組裝、燒錄、驗證 / Build, program, verify | [PDF](Developer_Manual_ZH.pdf) · [來源](Developer_Manual_ZH.md) | [PDF](Developer_Manual_EN.pdf) · [Source](Developer_Manual_EN.md) |
| 日常操作與介面 / Operate and use the UI | [PDF](User_Manual_ZH.pdf) · [來源](User_Manual_ZH.md) | [PDF](User_Manual_EN.pdf) · [Source](User_Manual_EN.md) |
| 實驗、排程與問卷 / Experiments, schedule, feedback | [驗證資料入口](../07_validation/README.md) | [Validation guide](../07_validation/README.md) |
| 材料成本 / Parts and costs | [BOM Excel](../05_BOM/BOM_ZH.xlsx) | [USD BOM Excel](../05_BOM/BOM_EN.xlsx) |

組裝圖、設計依據及供應商核對表已合併至開發者手冊。可選 LAN 及詳細校正仍在 [software guides](../03_software/guides)。模型的公式、數據與限制見 [optics](../02_simulation/optics/README.md)、[airflow](../02_simulation/airflow/README.md) 與 [membrane](../02_simulation/membrane/README.md)。

The developer manual includes assembly illustrations, design limits, and the supplier checklist. No separate legacy Word or duplicate assembly report is required. Preserve accepted changes in Markdown before rebuilding.

## Rebuild / 重建

Run from the package root:

```text
python 04_manuals/build_pdfs.py
```

This builds the four main manuals and six experiment/questionnaire PDFs. Use --roles for the four main manuals. Use --validation-only for the six supporting PDFs. Use --files followed by specific Markdown paths for selected documents. No simulation is rerun.

After rebuilding, render the changed PDFs with verify_pdf_layout.py. Review every page. The renderer writes contact sheets and a pending review record to the operating-system temporary folder. Rendering alone does not establish visual review.
=======
# Document guide / 文件入口

Assembly_Manual: illustrated assembly, resin choice, fasteners, well replacement and cleaning.
Operation_and_Setup: demo, UART flashing, controls, QC, calibration and measurement.
Simulation_Analysis: mechanics plus full optical/airflow reports and figures. Use PDF bookmarks to navigate.
Vendor_Confirmation: prepared questions for missing mechanical/electrical facts; not sent.

上述文件都有ZH及EN兩版；可編輯的操作原文在03_software/guides，光學及氣流原文在02_simulation各自資料夾。07_validation另放測試計畫與問卷，沒有與本手冊混成一份。

## Editable editions / 可編輯版本

| Document / 文件 | 中文版 | English edition |
|---|---|---|
| Assembly / 組裝 | [PDF](Assembly_Manual_ZH.pdf) · [Word](Assembly_Manual_ZH.docx) | [PDF](Assembly_Manual_EN.pdf) · [Word](Assembly_Manual_EN.docx) |
| Operation and setup / 操作設定 | [PDF](Operation_and_Setup_ZH.pdf) · [Word](Operation_and_Setup_ZH.docx) | [PDF](Operation_and_Setup_EN.pdf) · [Word](Operation_and_Setup_EN.docx) |
| User feedback / 使用者回饋 | [PDF](../07_validation/User_Feedback_ZH.pdf) · [Word](../07_validation/User_Feedback_ZH.docx) | [PDF](../07_validation/User_Feedback_EN.pdf) · [Word](../07_validation/User_Feedback_EN.docx) |

完整交接：[中文](../handoff.md)／[English](../handoff_EN.md)。Word可直接修改，PDF供閱讀／列印。**Word編輯不會自動同步至Markdown來源、PDF或Wiki。** 未來重建前，先將接受的修改人工回填雙語來源並保存未合併的Word，再重建與檢查。填好的問卷另存，不覆蓋空白範本。

Word is the editable edition; PDF is the reading/printing edition. **Edits made in Word do not automatically update the Markdown sources, PDFs or wiki.** Reconcile accepted edits into both language sources before future builds. [build_word_documents.py](build_word_documents.py) replaces all six Word outputs from those sources; preserve unreconciled edits first. Save completed questionnaires separately. The [handoff](../handoff_EN.md) identifies each source and the update workflow.

Rebuild PDFs on Windows with Microsoft JhengHei and Consolas fonts installed:

```text
python -m pip install -r requirements.txt
python build_pdfs.py
python build_pdfs.py --analysis
```

The builder reads saved Markdown and PNGs; it does not rerun simulations. PDF timestamps may differ across rebuilds. New PDFs require a visual layout review. On another platform, replace the three font registrations with locally available Unicode fonts before rebuilding.


2026-10-08 文件狀態：組裝與操作英文按 ASD-STE100 第 9 版寫作原則拆解，中文對照；未宣稱正式符合性認證。四份 PDF 已逐頁檢查。四份 Word 內容、可編輯結構與來源已檢查，但 Word 啟動卡住，無法完成實際分頁預覽；不得沿用舊版通過紀錄。閱讀／列印可先用 PDF，Word 列印前需在本機確認分頁。STL、四個 well 與 firmware 未修改。

2026-10-08 document status: English assembly and operation procedures use ASD-STE100 Issue 9 writing principles with corresponding Chinese steps; no formal compliance certification is claimed. All four PDFs were visually inspected. Editable Word content, structure and source hashes were checked, but Word startup stalled and actual pagination is unverified. Previous manual render approval does not apply. Use PDF for reading/printing; check Word pagination locally before printing. STL, four wells and firmware are unchanged.
>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0
