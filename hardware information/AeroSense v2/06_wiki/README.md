# Wiki publication / Wiki 發布

These are editable drafts. The live Wiki has not been changed. Use the English files for publication. Use the Chinese files for team review.

| Page | English | 中文 | Evidence and downloads |
|---|---|---|---|
| Hardware | [Draft](Hardware_EN.md) | [草稿](Hardware_ZH.md) | [Prints](../01_print), [BOM](../05_BOM), [manuals](../04_manuals), [CAD](../09_engineering_sources/CAD) |
| Model | [Draft](Model_EN.md) | [草稿](Model_ZH.md) | [Figures, movies, CSV, and source](../02_simulation/README.md) |
| Description | [Draft](Description_EN.md) | [草稿](Description_ZH.md) | System overview and evidence limits |
| Engineering | [Draft](Engineering_EN.md) | [草稿](Engineering_ZH.md) | Computational Cycle 4 and planned usability Cycle 5 |

## Publish the evidence

1. Keep the current site navigation and the original Engineering Cycles 1–3.
2. Add the new text to the matching Hardware, Model, Description, and Engineering sections.
3. Put key figures, methods, assumptions, and conclusions on the page. Do not hide the scientific argument in a download.
4. Upload media to the team's approved iGEM media location. Replace local file links with the actual published URLs.
5. Link the hardware and simulation source in `code/aerosense` in the team [GitLab repository](https://gitlab.igem.org/2026/nthu).
6. Upload the two BOM workbooks, current manuals, and eight STL files as downloads. CTB files are printer-specific local slicing files. Check their settings before use.
7. Test downloads, video playback, captions, phone layout, and all links after publication.

Use [02_simulation/README.md](../02_simulation/README.md) as the source of current asset paths. Old HTML previews, duplicated ZIPs, and website snapshots were removed. There is one current copy of each result.

## Report only supported findings

The four-filter comparison is a synthetic PD-signal study. It includes no filter, one LEE 101 layer, two LEE 101 layers, and one 500 nm Ultra-Thin OD4 longpass. It does not establish measured cell sensitivity. Report filter assumptions, ideal fluorescence, received signal, and residual together.

The gas model supports a conditional 3 mL/min operating candidate. The worst modeled near-liquid gas t90 is about 50 s. This is not a cell-response time. The historical transport model uses 100 µL. The provisional 80 µL operating volume has not been substituted into that model.

No physical board acceptance, cell response, odor classification, or participant result has been supplied. Do not turn planned tests into completed results. GCaMP6f green light is fluorescence emission.

The 12.45 mm OD4 filter needs a compatible mount. It does not fit the existing 5.2 × 4.2 mm receiver pocket by assumption. The English BOM uses USD. Keep the recorded exchange-rate date and distinguish the two-board development quote from production cost.

There are no verified project docking inputs, poses, logs, or identified capture-protein sequences in this package. Protein-assisted uptake remains a hypothesis. A docking score would not establish Kd, uptake rate, or cell activation.

## Short usability session

Use a dry device or DEMO. Ask a new user to identify the wells, connect the interface, start and stop a short session, and export CSV. Do not require participants to flash the PCB or perform a cell experiment. Record task completion, time, help, and one specific difficulty. Change the main problem and repeat the affected task. The [completion plan](../07_validation/Completion_Plan_EN.md) and [feedback form](../07_validation/User_Feedback_EN.pdf) define the protocol.

Hardware judging considers need, user feedback, function, and reproducibility. See the [official award criteria](https://competition.igem.org/judging/special-prizes). These themes do not guarantee an award. The team deadline in this plan is 21 October; finish experiments by 19 October and use 20 October for analysis and publication.

中文：此資料夾只留四種頁面的中英草稿。圖、影片、原始結果與程式都連回唯一正式來源。問卷採短版乾式操作；燒錄、電路驗證與細胞實驗由開發者完成。發布前將本機路徑換成實際 iGEM 託管網址。不要把合成訊號、模擬或待做測試寫成實驗成果。
