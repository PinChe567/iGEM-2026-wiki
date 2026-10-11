# AeroSense BOM and cost basis

2026-10-08. Workbooks show NTD and USD. Required, Developer and Future are the primary classes. Printed parts, PCB records and purchases retain separate detail. Specifications, purpose, price source and unresolved compatibility are distinguished.

Required includes eight prints, the PCB and 13 purchased assembly lines. Developer includes 10 external programming, measurement, gas-delivery and tool lines. Borrowing is acceptable; gas delivery and flow verification remain necessary for gas experiments. Future contains PDMS, valve development and environment sensing. These three lines are excluded from current device budgets.

| Item | NTD | USD |
|---|---:|---:|
| Three print batches | 1,115.39 | 35.07 |
| Required purchases at used quantity | 13,133.41 | 412.94 |
| Required budget excluding PCB | 14,248.79 | 448.00 |
| PCB allocation per board | 65,625.00 | 2,063.35 |
| Required device budget | 79,873.79 | 2,511.36 |
| Required whole packs, zero owned | 16,300.45 | 512.51 |
| Developer budget if all acquired | 38,612.18 | 1,214.03 |
| Future allowance, excluded | 7,500.00 | 235.81 |


**These are budgets, not an order-ready total.** The device includes NTD 12,000 for a custom thin emission filter. Edmund 67-016 lists at USD 284, but its 12.5 mm diameter and approximately 2 mm thickness do not fit the 5.2 × 4.2 × 1.0 mm seat. Cutting the outline alone does not fix thickness. Obtain a dimensional, angular-spectrum and fabrication quotation.

Listed identifies a public price. Proxy identifies a comparable part or package. Allowance and Custom allowance are planning values, not verified market quotations. A reference price does not change the specified cap screws, regular M3 nuts or washers.

The gas-filter proxy is Gilson ANP1322 at USD 95 per 100. Two used filters cost NTD 60.43, while one box costs NTD 3,021.48. This 0.22 µm nonsterile hydrophobic PTFE product is not a qualified replacement for the specified 0.2 µm gas filter. Cell use, fittings, pressure drop and VOC recovery need confirmation.

Owned quantity in column K defaults to 0. Enter available or borrowed quantities. Pack count P and new-purchase Q/R recalculate; used cost N/O remains. Allowances are not purchasing authorization or a requirement to buy new laboratory instruments.

PCB preserves all 61 vendor references, quantities and values. Priced component estimates sum to NTD 1,954.00. Unidentified U3 remains blank. Many passive values or packages remain unknown; generic budgets are not purchasing specifications. FD fiducials and H mounting holes are fabrication features with zero separate component cost. Do not add component estimates to the NTD 131,250 two-board design/setup quotation.

Printing remains 1.2 × (25 + source resin subtotal × 1.1 + minutes/60 × 7.195). Batches are NTD 525.31282, 535.12550 and 54.94728. Their full-precision sum is 1115.38560. Combined batches are not split into invented unit prices. Original cost.md is unchanged.

Currency conversion uses the Bank of Taiwan displayed USD spot-selling snapshot of 31.805 NTD/USD at 2026-10-05 15:13, accessed 2026-10-08. It is not an October 8 execution quote. Original USD and NTD inputs retain their currencies, so FX changes recalculate both correctly.

Shipping, extra taxes, unlisted labor, reprints, cell-culture consumables and replacement of existing printers, curing equipment, phones, computers and culture facilities are excluded.

## Price sources

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
