# iGEM 官方上傳圖片

**之後要找上傳圖片，請直接打開 `aerosense-wiki/igem-upload/`。** 全部 507 張圖片都集中在這裡，共 454.2 MiB；已備妥 507 張。這是目前網站實際使用圖片的整理副本，原本網站資產與科學原圖保留不動，沒有修改 Notion。

## 從哪裡找

- **一般網頁圖片：** [web-images](web-images/) → 按頁名找資料夾，例如 `hardware`、`human-practices`、`education`、`model`。共 482 張。
- **較大原尺寸圖片：** [full-resolution](full-resolution/) → 按頁名整理。共 25 張，也要保留並上傳。
- **多頁共用圖：** 放在上述資料夾中的 `shared`，避免重複存檔；各頁清單仍會列出它。
- **不知道圖片被放在哪裡：** 打開下方該頁的 CSV，查看 `export_path` 欄位，就是相對於本資料夾的圖片位置。

## 各頁圖片清單

- [Alternative Platform](pages/alternative-platform/images.csv)：12 張
- [Attributions](pages/attributions/images.csv)：12 張
- [Contribution](pages/contribution/images.csv)：18 張
- [Credits](pages/credits/images.csv)：11 張
- [Description](pages/description/images.csv)：33 張
- [Design](pages/design/images.csv)：12 張
- [Education](pages/education/images.csv)：24 張
- [Engineering](pages/engineering/images.csv)：14 張
- [Entrepreneurship](pages/entrepreneurship/images.csv)：17 張
- [Experiments](pages/experiments/images.csv)：12 張
- [Glossary](pages/glossary/images.csv)：11 張
- [Hardware](pages/hardware/images.csv)：37 張
- [Human Practices](pages/human-practices/images.csv)：37 張
- [Home](pages/home/images.csv)：45 張
- [Learning 01 Smell](pages/learning-01-smell/images.csv)：12 張
- [Learning 02 Mold](pages/learning-02-mold/images.csv)：12 張
- [Learning 03 Synbio](pages/learning-03-synbio/images.csv)：12 張
- [Learning 04 Decode](pages/learning-04-decode/images.csv)：12 張
- [Learning 05 Act](pages/learning-05-act/images.csv)：12 張
- [Learning Platform](pages/learning-platform/images.csv)：12 張
- [Measurement](pages/measurement/images.csv)：12 張
- [Members](pages/members/images.csv)：23 張
- [Model](pages/model/images.csv)：104 張
- [Notebook](pages/notebook/images.csv)：15 張
- [Parts](pages/parts/images.csv)：22 張
- [Results](pages/results/images.csv)：258 張
- [Safety and Security](pages/safety-and-security/images.csv)：15 張
- [Sustainability](pages/sustainability/images.csv)：16 張

## 上傳與網址替換

1. 從 `web-images` 和 `full-resolution` 選擇檔案上傳。檔名已整理，末尾短碼可避免同名覆蓋。
2. 開啟 [official-urls.csv](official-urls.csv)，把 iGEM 實際回傳的網址填入 `official_url`。**目前尚未上傳。**
3. [site-path-mapping.csv](site-path-mapping.csv) 對照每個網站原路徑與上傳檔案；之後依此替換網站。動態切換的螢光視野、PCB 等也已納入清單。

圖片保持來源檔案的相同位元組，沒有縮圖、重壓或改色。包括 25 個螢光視野的 8 種網頁版本及 25 張原尺寸標記圖。影片、PDF、STL、CSV 研究資料、原始 TIFF，以及程式即時繪製的 SVG/canvas 不屬於這份圖片包。

## 網站更新後重新整理

在 wiki 工作區（aerosense-wiki 的上一層）執行 `node scripts/prepare-igem-image-upload-v5.cjs --copy-all`。輸出固定在本資料夾，會保留已填的官方網址。清單以 [manifest.json](manifest.json) 為準；不自動刪除使用者檔案。完整盤點摘要見 [inventory-summary.json](inventory-summary.json)。
