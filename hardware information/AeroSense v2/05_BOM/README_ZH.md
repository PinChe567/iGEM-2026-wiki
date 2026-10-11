# AeroSense BOM 與成本讀法

2026-10-08。工作簿同時列出 NTD 與 USD。分類改為「必要、開發者購買、未來展望」，並保留 STL、PCB、外購材料三種明細。價格來源、實際用途與待確認規格分開列。

必要：八件列印件、PCB 及 13 列外購裝配材料。開發者購買：10 列機外燒錄、量測、給氣與工具；可以借用，但給氣與流量確認能力仍是實驗必要條件。未來展望：PDMS 膜、氣閥驅動、環境感測共三列，不加進當前機器預算。

| 項目 | NTD | USD |
|---|---:|---:|
| 三批列印公式總額 | 1,115.39 | 35.07 |
| 必要外購用量成本 | 13,133.41 | 412.94 |
| 必要非 PCB 預算 | 14,248.79 | 448.00 |
| 本次 PCB 單片分攤 | 65,625.00 | 2,063.35 |
| 必要單機預算 | 79,873.79 | 2,511.36 |
| 必要外購整包額，持有量 0 | 16,300.45 | 512.51 |
| 開發者設備全新購買預算 | 38,612.18 | 1,214.03 |
| 未來展望預留，不計入本機 | 7,500.00 | 235.81 |


**上述是預算，不是已確認可下單總價。** 單機包含 NTD 12,000 客製薄型螢光濾片預留；參考的 Edmund 67-016 價格 USD 284，但其 12.5 mm 外徑與約 2 mm 厚度均不符合現有 5.2 × 4.2 × 1.0 mm 濾片座。不能直接購買並假設可裝，也不能只裁切外形就解決厚度問題。尚需尺寸、角度光譜與加工報價。

Listed＝可查到商品價；Proxy＝類似品或包裝差異的參考；Allowance／Custom allowance＝工程預留額。沒有公開且相符的價格時，不把預留額寫成已查核市價。螺絲長度、M3 標準螺帽及墊片規格不因價格參考品而更換。

濾器參考品為 Gilson ANP1322，USD 95／100 個；兩個用量換算 NTD 60.43，但買一盒是 NTD 3,021.48。它是 0.22 µm、非無菌疏水 PTFE 參考品，不代表已符合原設計 0.2 µm 氣體濾器要求。細胞用途、接頭、壓降與 VOC 回收仍需確認。

已持有量 K 欄預設 0。填入已買或可借數量，需購包數 P 與新購額 Q/R 會重算；用量成本 N/O 不會因此歸零。預留額不是採購授權，也不代表必須購買新的實驗室儀器。

PCB 保留 61 列原始位號、數量與數值。已列零件材料估價為 NTD 1,954.00；U3 身分未知，留白。許多被動元件尚缺值或封裝，僅列通用預算，不能據此採購。FD 光學點與 H 固定孔為製板特徵，材料单價 0 不是漏列。PCB 零件估價不另加到 NT$131,250／2 片的含設計與開機報價。

列印維持 1.2 × (25 + 原樹脂小計 × 1.1 + 分鐘/60 × 7.195)。三批分別 525.31282、535.12550、54.94728 NTD；全精度相加 1115.38560。合印批次不假造單件價格。原 cost.md 未修改。

匯率採臺灣銀行頁面顯示的 2026-10-05 15:13 美元即期賣出 31.805 NTD/USD；2026-10-08 查閱。這是比較用快照，不是 10 月 8 日成交匯率。USD 價來源保持 USD 輸入，NTD 價保持 NTD 輸入，改匯率會正確換算兩者。

未含運費、額外稅金、未列人工、失敗重印、細胞培養耗材及既有印表機、後固化機、手機、電腦、培養設施的重購成本。

## 價格來源

- FX: [Bank of Taiwan USD spot selling](https://www.bot.com.tw/tw/personal-banking/foreign-exchange) — 2026-10-05 15:13 displayed snapshot: USD spot buy 31.705, sell 31.805. Budget conversion uses sell 31.805, not an October 8 live execution quote.
- FAN: [DigiKey MF40100V1-1000U-A99](https://www.digikey.tw/en/products/detail/sunon-fans/MF40100V1-1000U-A99/6198732) — NTD 161 at quantity 1. Listed out of stock. Shipping and local tax not added.
- FASTENER: [Local small-fastener retail benchmark](https://www.ruten.com.tw/item/21306183365097/) — Listing shows small M3 fasteners around NTD 3 individually. Listed flat-head type is NOT the specified socket cap. Budget allowances 3/4/6 NTD for M3x8/16/35 cap screws, 2 for nuts and 1 for washers; local exact-type prices unverified.
- SEAL: [Black silicone sheet size reference](https://www.ruten.com.tw/item/22517308416481/) — 0.8 mm selectable stock; exact price unavailable. NTD 150 per small sheet is an engineering allowance, not a verified selling price. Hardness and VOC compatibility unqualified.
- POWER: [Adafruit 4298 USB-C supply](https://www.adafruit.com/product/4298) — USD 8.74, 5.1 V 3 A with cable. Price benchmark only; vendor must confirm input and charging configuration. Current budget uses external power, not an unconfirmed battery.
- GASFILTER: [Gilson ANP1322 SupaTop](https://www.gilson.com/default/catalog/product/view/id/1204/) — USD 95 per 100. Hydrophobic PTFE, 13 mm, 0.22 um, NONSTERILE, air venting listed. Price proxy for 0.2 um gas-filter requirement, not certified sterile replacement. Two used per device; buying a box costs 100 filters.
- PTFE: [Tinkersphere 2 mm ID 3 mm OD PTFE](https://tinkersphere.com/3d-printer-parts-supplies/2015-ptfe-teflon-tube-2mm-id-3mm-od-for-175-mm-filament.html) — Search listing USD 4.99; sold length not verified. NTD 200 per 1 m is a separate allowance. Printer-feed tubing is not qualified analytical tubing.
- COUPLER: [Adafruit 3 mm ID silicone tubing reference](https://www.adafruit.com/product/4699) — Related tubing listed USD 2.50 per metre. Budget NTD 150 includes short flexible couplers and matching adapters. Exact ID/OD, Luer interfaces and VOC recovery must be checked; no fit guarantee.
- OPTIC: [Edmund Optics 67-016 520 nm emission filter](https://www.edmundoptics.com/p/520nm-cwl-125mm-dia-36nm-bandwidth-od-6-fluorescence-filter/21556/) — USD 284, 12.5 mm diameter, substrate 2.00 +/-0.25 mm, mounted. Does NOT fit 5.2x4.2x1.0 mm seat. NTD 12000 is a custom thin-filter budget allowance, not a quote or available drop-in part. Cutting this stock part does not solve its thickness mismatch.
- UART: [Adafruit 5335 CP2102N Friend](https://www.adafruit.com/product/5335) — USD 5.95 each. Signals 3.3 V; power wire 5 V. Leave VCC disconnected at J3. Cable and jumper wires separate.
- PUMP: [Adafruit 4699 gas pump price benchmark](https://www.adafruit.com/product/4699) — USD 7.95 for pump alone. 2.5 L/min, intermittent duty; NOT a selected 3 mL/min continuous source. NTD 5000 system allowance requires a qualified controlled source, bypass/regulation, pressure protection, fittings and supply. Borrow a suitable lab system first.
- FLOW: [Omega precision rotameter range reference](https://br.omega.com/omegaFiles/green/pdf/FL120.pdf) — FL-320 nominal air range 0.02-15 cc/min. Historical price deliberately not treated as current. NTD 15000 is a planning allowance pending current calibrated meter quote; 3 mL/min must fall within usable range.
- DYE: [Sigma 46970 sodium fluorescein](https://www.sigmaaldrich.com/US/en/product/sigma/46970) — USD 52.60 per 100 g. Budget includes whole bottle, not a fictitious single-well quantity. Prefer a documented laboratory aliquot. Not an assay-specific or GCaMP-certified standard.
- VALVE: [Adafruit 4663 FA0520E](https://www.adafruit.com/product/4663) — USD 2.95 for 6 V valve alone. NTD 500 system allowance includes driver, flyback diode, supply and fittings. Future only; VOC wetted-material suitability and firmware support unverified.
- PDMS: [Dow Sylgard 184 0.5 kg kit reference](https://labproinc.com/products/dow-sylgard-184-silicone-encapsulant-clear-0-5-kg-kit-184-sil-elast-kit-0-5kg) — Kit identity found; current public price not verified. NTD 6000 planning allowance for kit and basic casting consumables. No claim that PDMS removes water selectively.
- TOOLS: Local tools and lab access allowance — Engineering allowances only: hand tools/calipers NTD 1500; DMM 800; scope 10000; pipette/tips 4000; print/post-cure supplies 300. Borrow existing printer, wash/cure equipment, PC, phone, biosafety/cell facilities. Their capital replacement prices are outside this BOM.
- PCB_LED: [DigiKey 155124BS73200](https://www.digikey.tw/en/products/detail/w%C3%BCrth-elektronik/155124BS73200/4490035) — NTD 17 each at quantity 1.
- PCB_PD: [DigiKey VEMD5060X01](https://www.digikey.tw/en/products/detail/vishay-semiconductor-opto-division/VEMD5060X01/5879084) — NTD 68 each at quantity 1.
- PCB_U1: [DigiKey TPS61023 family](https://www.digikey.tw/en/products/detail/texas-instruments/TPS61023DRLR/11310629) — Search results list TPS61023DRLT cut tape NTD 52. Packaging-suffix proxy for vendor TPS61023; exact order code requires confirmation.
- PCB_U2: [DigiKey BQ24074RGTR](https://www.digikey.tw/en/products/detail/texas-instruments/BQ24074RGTR/2047269) — NTD 88 each at quantity 1; RGT package assumed from schematic.
- PCB_U4: [DigiKey ESP32-WROOM-32E-N4](https://www.digikey.tw/en/products/detail/espressif-systems/ESP32-WROOM-32E-N4/11613125) — NTD 181 each. N4 is a price proxy; vendor flash suffix missing.
- PCB_U6: [DigiKey LP5907MFX-3.3/NOPB](https://www.digikey.tw/en/products/detail/texas-instruments/LP5907MFX-3-3-NOPB/3906441) — NTD 24 each at quantity 1.
- PCB_U7: [DigiKey LTC6655BHMS8-2.5#TRPBF](https://www.digikey.tw/en/products/detail/analog-devices-inc/LTC6655BHMS8-2-5-TRPBF/2181717) — NTD 628 for cut tape. Packaging proxy for #PBF; listed no stock.
- PCB_U8: [DigiKey LMP7721MAX/NOPB listing](https://www.digikey.tw/en/products/filter/linear/amplifiers/instrumentation-op-amps-buffer-amps/687) — Search listing NTD 226 for MAX/NOPB. Vendor LMP7721 suffix missing; package proxy.
- PCB_U9: [DigiKey ADS8866IDGS](https://www.digikey.tw/zh/products/detail/texas-instruments/ADS8866IDGS/5176196) — NTD 306 each at quantity 1.
- PCB_MISC: Unspecified PCB parts allowance — Generic single-piece budgets, NOT verified quotations: small resistors NTD 1, high-value resistor 30, shunt 5; ceramics 2-8; bulk capacitor 15; LED 2; MOSFET 5; inductor 10; connectors 5-30; switches 5-15; linear regulator 10. Unknown U3 remains unpriced. Do not purchase substitutes without vendor values, packages and ratings.
