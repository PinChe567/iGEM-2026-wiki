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
