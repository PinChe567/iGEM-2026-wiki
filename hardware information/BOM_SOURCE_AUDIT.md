# BOM source audit

Internal. Not a public release file.

Source: `hardware information/pcb v2/NTHU_TEST_BOARD_BOM.docx`
Compared against: current schematic (`NTHU_TEST_BOARD_Schematic.pdf`) and the team design report (English hardware content + Fluorescence Detection Hardware Module Design Report).

**Do not invent component values.** Blank cells stay blank.

## Verdict

**Not release-ready.** Do not publish this DOCX as the final BOM. Do not write `hardware information/release/AeroSense_Reader_BOM.csv` until every required field is filled from a verified schematic/orderable part list.

Header column 4 is Chinese (`零件參數` = part parameter / value). The file also contains internal fabrication annotations.

## Header

| Col | Raw |
| --- | --- |
| 1 | `Item` |
| 2 | `Quantity` |
| 3 | `Reference` |
| 4 | `零件參數` ← Chinese; treat as Value |

## Row-by-row

| Item | Qty | Reference | Value (零件參數) | Flags |
| --- | --- | --- | --- | --- |
| 1 | 1 | `C1` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 2 | 1 | `C2` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 3 | 1 | `C3` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 4 | 1 | `C4` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 5 | 1 | `C5` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 6 | 1 | `C6` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 7 | 1 | `C7` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 8 | 1 | `C8` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 9 | 1 | `C9` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 10 | 1 | `C10` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 11 | 1 | `C11` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 12 | 1 | `C12` | 47uF | missing manufacturer; missing MPN; missing package / footprint |
| 13 | 2 | `C13,C18` | 22uF | missing manufacturer; missing MPN; missing package / footprint |
| 14 | 4 | `C14,C15,C22,C25` | 0.1uF | missing manufacturer; missing MPN; missing package / footprint |
| 15 | 4 | `C16,C17,C23,C28` | 10uF | missing manufacturer; missing MPN; missing package / footprint |
| 16 | 4 | `C19,C20,C27,C29` | 1uF | missing manufacturer; missing MPN; missing package / footprint |
| 17 | 1 | `C21` | 2.2pF | missing manufacturer; missing MPN; missing package / footprint |
| 18 | 1 | `C24` | 1000pF | missing manufacturer; missing MPN; missing package / footprint |
| 19 | 1 | `C26` | 100uF | missing manufacturer; missing MPN; missing package / footprint |
| 20 | 2 | `DPS1,DPS2` | LED | generic name; missing manufacturer; missing MPN; missing package / footprint |
| 21 | 4 | `D1,D2,D3,D4` | 155124BS73200 | missing manufacturer; missing MPN; missing package / footprint |
| 22 | 1 | `D5` | VEMD5060X01 | missing manufacturer; missing MPN; missing package / footprint |
| 23 | 8 | `FD1,FD2,FD3,FD4,FD5,FD6,FD7,FD8` | FD_040(SMT用光學點) | Chinese characters; generic name; missing manufacturer; missing MPN; missing package / footprint |
| 24 | 4 | `H1,H2,H3,H4` | CON(銅柱孔) | Chinese characters; generic name; missing manufacturer; missing MPN; missing package / footprint |
| 25 | 1 | `J1` | Battery_Case | generic name; missing manufacturer; missing MPN; missing package / footprint |
| 26 | 1 | `J2` | USB TYPE C FEMALE | generic name; missing manufacturer; missing MPN; missing package / footprint |
| 27 | 1 | `J3` | CON4(4pin排針) | Chinese characters; generic name; missing manufacturer; missing MPN; missing package / footprint |
| 28 | 1 | `L1` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 29 | 4 | `Q1,Q2,Q3,Q4` | AO3400A | missing manufacturer; missing MPN; missing package / footprint |
| 30 | 1 | `R1` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 31 | 1 | `R2` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 32 | 1 | `R3` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 33 | 1 | `R4` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 34 | 1 | `R5` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 35 | 1 | `R6` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 36 | 1 | `R7` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 37 | 1 | `R8` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 38 | 1 | `R9` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 39 | 1 | `R10` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 40 | 1 | `R11` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 41 | 1 | `R12` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 42 | 1 | `R13` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 43 | 1 | `R14` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 44 | 3 | `R15,R28,R35` | 10k | missing manufacturer; missing MPN; missing package / footprint |
| 45 | 7 | `R16,R21,R24,R29,R30,R31,R36` | 100R | missing manufacturer; missing MPN; missing package / footprint |
| 46 | 4 | `R17,R22,R25,R32` | 220R | missing manufacturer; missing MPN; missing package / footprint |
| 47 | 4 | `R20,R23,R26,R33` | 100k | missing manufacturer; missing MPN; missing package / footprint |
| 48 | 1 | `R27` | 100M | missing manufacturer; missing MPN; missing package / footprint |
| 49 | 1 | `R34` | 0.1R | missing manufacturer; missing MPN; missing package / footprint |
| 50 | 2 | `R37,R38` | 47R | missing manufacturer; missing MPN; missing package / footprint |
| 51 | 1 | `SW1` | SW1 | generic name; missing manufacturer; missing MPN; missing package / footprint |
| 52 | 2 | `SW2,SW3` | Tactile_Switch | generic name; missing manufacturer; missing MPN; missing package / footprint |
| 53 | 1 | `U1` | TPS61023 | missing manufacturer; missing MPN; missing package / footprint |
| 54 | 1 | `U2` | BQ24074 | missing manufacturer; missing MPN; missing package / footprint |
| 55 | 1 | `U3` | *(blank)* | blank value; missing manufacturer; missing MPN; missing package / footprint |
| 56 | 1 | `U4` | ESP32-WROOM-32E | missing manufacturer; missing MPN; missing package / footprint |
| 57 | 1 | `U5` | EC50117KBG | missing manufacturer; missing MPN; missing package / footprint |
| 58 | 1 | `U6` | LP5907MFX-3.3/NOPB | missing manufacturer; missing MPN; missing package / footprint |
| 59 | 1 | `U7` | LTC6655BHMS8-2.5#PBF | missing manufacturer; missing MPN; missing package / footprint |
| 60 | 1 | `U8` | LMP7721 | missing manufacturer; missing MPN; missing package / footprint |
| 61 | 1 | `U9` | ADS8866IDGS | missing manufacturer; missing MPN; missing package / footprint |

## Known problems (do not fill by guessing)

### Blank values

- Capacitors **C1–C11**: value blank.
- Inductor **L1**: value blank.
- Resistors **R1–R14**: value blank.
- IC **U3**: value blank.

Expanded blank-value references: `C1`, `C2`, `C3`, `C4`, `C5`, `C6`, `C7`, `C8`, `C9`, `C10`, `C11`, `L1`, `R1`, `R2`, `R3`, `R4`, `R5`, `R6`, `R7`, `R8`, `R9`, `R10`, `R11`, `R12`, `R13`, `R14`, `U3`.

### Chinese internal annotations

- Header: `零件參數`.
- `FD1,FD2,FD3,FD4,FD5,FD6,FD7,FD8 = FD_040(SMT用光學點)`
- `H1,H2,H3,H4 = CON(銅柱孔)`
- `J3 = CON4(4pin排針)`

Decoded (source strings, not replacements):
- `SMT用光學點` — SMT optical fiducial.
- `銅柱孔` — copper-standoff / pillar hole.
- `4pin排針` — 4-pin header.

These must be rewritten in English *from a verified mechanical drawing*, not guessed into MPNs.

### Generic names (not orderable)

- `DPS1,DPS2 = LED`
- `FD1,FD2,FD3,FD4,FD5,FD6,FD7,FD8 = FD_040(SMT用光學點)`
- `H1,H2,H3,H4 = CON(銅柱孔)`
- `J1 = Battery_Case`
- `J2 = USB TYPE C FEMALE`
- `J3 = CON4(4pin排針)`
- `SW1 = SW1`
- `SW2,SW3 = Tactile_Switch`
- `SW1` as both reference and value.

### Missing MPN / manufacturer / footprint

Every DOCX row lacks manufacturer, manufacturer part number, and package/footprint columns. Even rows that list a catalog-like value (e.g. `155124BS73200`, `ADS8866IDGS`) are **not** a complete release line until manufacturer + orderable MPN + footprint are verified against the current schematic.

### Schematic / design-report disagreements (do not silently reconcile)

- Design study (hardware design report): first-design recommended feedback capacitor **4.7 pF** with **100 MΩ** → ~339 Hz simple RC pole.
- Current schematic / this BOM: **C21 = 2.2 pF** and **R27 = 100 M**. That is a different network (~723 Hz simple RC pole). **Do not replace one with the other.**
- Retired V1 BOM listed TIA *C<sub>F</sub>* as **C1 = 2.2 pF**. This DOCX leaves **C1 blank** and puts **2.2 pF on C21**. Reference mapping is unverified — do not copy V1 values onto C1–C11.
- Retired V1 BOM listed TIA *R<sub>F</sub>* as **R13 = 100 M** with an HVC1206-series note. This DOCX leaves **R13 blank** and lists **R27 = 100 M**. Do not assume R13 is still 100 MΩ.
- **R16, R21, R24, R29, R30, R31, R36 = 100R** (seven resistors). The design report selects **100 Ω per LED** as a conservative prototype start. This file does not state which of those 100 Ω parts are LED series resistors. Do not assign them.
- **R37, R38 = 47R** is consistent with the documented 47 Ω SCLK/CONVST damping, but the DOCX does not name that function.
- **C24 = 1000 pF** is numerically 1 nF; the design report uses a 100 Ω + 1 nF ADC input network. Not confirmed as the same part.
- Photodiode **D5 = VEMD5060X01** and LEDs **D1–D4 = 155124BS73200** match the design report identities; package/MPN still missing.
- **U8 = LMP7721**, **U9 = ADS8866IDGS**, **U7 = LTC6655BHMS8-2.5#PBF** match the design-report devices; manufacturer/footprint still missing.

### Duplicate references

No duplicate reference designators after expanding grouped cells (e.g. `C13,C18`).

## Release gate

`scripts/check_hardware_bom.py` must pass on `hardware information/release/AeroSense_Reader_BOM.csv` before that CSV is linked as the public BOM.

Required CSV columns: Reference, Quantity, Value, Manufacturer, Manufacturer Part Number, Package / footprint, Function, Notes.

Until then: interactive wiki table may show this draft with **Not frozen in source BOM** for empty fields. It must not be labeled final.
