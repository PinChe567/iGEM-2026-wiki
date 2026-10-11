# AeroSense 技術附錄

這是唯一主包 chatgpt version 的發布用子集，不是另一個設計版本。八個指定 STL 沒有修改。四個壓縮檔請解壓到「同一個」空資料夾，目錄會合併。內容包括原始碼、已保存模擬結果、繪圖程式、軟體、現行手冊與指定列印檔；不含使用者大型 CTB、私人設定、資料庫、工具鏈及廠商原檔。

- [optics_code_data.zip](optics_code_data.zip) - 光學蒙地卡羅、合成 DLIA、圖表與影片 (16.3 MB)
- [airflow_code_data.zip](airflow_code_data.zip) - 固定 CAD 氣流、參數掃描、原始流場與互動 3D (95.3 MB)
- [transport_sensitivity.zip](transport_sensitivity.zip) - 分開的液體／PDMS 傳輸假設與敏感度 (0.6 MB)
- [hardware_software_documents.zip](hardware_software_documents.zip) - 八件 STL、CAD、韌體／UI、BOM、手冊、單一實驗分析與 Wiki 草稿 (8.8 MB)

## 如何判讀

氣流主問題是液面附近氣相的到達：明示假設下，條件式 Q=3 mL/min，最慢 t90 約 50 秒；不代表吸收或細胞安全。另附液體／PDMS 模型是無蛋白促進、無混合的反事實敏感度分析。實測空白扣除只能處理穩定複數平均背景，不能消除未知變動干擾或散粒雜訊。沒有杜撰實板、生物或使用者測試資料。

## 重現方法

解壓後先讀各模擬資料夾 README、03_software/README_ZH.md、07_validation/Validation_Plan_ZH.md。依各處 requirements 安裝依賴；從保存結果重畫不等於重新抽樣或重算 CFD。CAD 重建需 OpenSCAD；實板使用前依韌體預設鎖定與檢查流程操作。模型驗證檔保存來源／數據雜湊，appendix_manifest.json 固定本次四個下載檔。 所附handoff描述完整主包；其中指向已排除的廠商原件或本機頁面預覽，須回完整包查看。可編輯Word與閱讀PDF並列；接受的Word修改須回填Markdown後再重建。

## 發布與授權

主要方法、關鍵結果、限制與模型如何影響硬體的決策，仍放正式 Wiki。GitHub 可鏡像這些補充下載；本次未發布 GitHub 或線上 Wiki。公開前確認當年 iGEM 託管規則、作者貢獻與授權；本包不授予廠商 PCB 資料的轉散權。取得實測或修改手冊後應重新產生附錄。
