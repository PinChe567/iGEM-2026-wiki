# AeroSense 完整交接

文件基準：2026-10-06。英文版：[handoff_EN.md](handoff_EN.md)。快速入口：[START_HERE.html](START_HERE.html)。本資料夾是目前唯一完整設計與證據包；`appendix`是其發布子集，不是另一套設計。尚未更新線上Wiki、採購零件、寄出廠商確認或燒錄實板。

## 1. 目前可以採取的決策

沿用約100×90 mm PCB、四顆LED、一顆偏心PD，以及四個液體分開、氣相相通的井。使用者確認細胞為井底貼附的HEK293T，每井名義100 µL。**八個指定STL維持不變；目前成果適合進入無細胞原型驗證，尚不能保證一次列印完全合板、PCB可正常讀取細胞、四井完全獨立或已能辨識氣味。**

固定幾何的供氣候選是**3 mL/min**：在明列假設下，四井及三種氣相擴散係數中最慢的氣相t90約50秒。這不是氣味抵達井底細胞或GCaMP啟動時間。下一個優先工作是取得廠商機械確認、完成必要通電／ADC預檢，再做一套無細胞螢光標準液實驗；不是繼續增加未校準的模擬或訓練神經網路。

## 2. 檔案分工與閱讀順序

| 位置 | 內容與用途 |
|---|---|
| [01_print](01_print) | 八個操作用STL，單位mm、100%尺寸；另外保留使用者原有CTB及cost.md。CTB切片設定並未因此取得驗證。 |
| [09_engineering_sources/CAD](09_engineering_sources/CAD) | OpenSCAD、尺寸參數、匯出／干涉檢查程式、CAD圖與1:1密封片裁切圖。沒有第二套要選印的STL。 |
| [02_simulation](02_simulation/INDEX_ZH.html) | 光學、氣流與獨立液體／PDMS模型；原始資料、程式、圖、影片、互動圖及逐圖雙語說明。 |
| [03_software](03_software/README_ZH.md) | ESP32韌體、LittleFS手機UI、可選私有LAN伺服器、離線DLIA／研究分類器，以及測試／編譯證據。沒有已驗證的氣味分類模型或已部署雲端服務。 |
| [04_manuals](04_manuals/README.md) | 分開的組裝、設定／操作、設計／模擬文件、廠商確認清單及其PDF／Word交付。 |
| [05_BOM](05_BOM/README_ZH.md) | 中英文Excel；8列列印件、61列廠商PCB表、26列必要採購／共用項目，以及八份對應CSV。 |
| [06_wiki](06_wiki/hardware_ZH.html) | 未發布的本機硬體預覽、Cycle 4／5、整合地圖、目前網站查核與三頁內容草稿。 |
| [07_validation](07_validation/Validation_Plan_ZH.md) | 單一標準液實驗、quick_check.py、空白紀錄、使用者回饋表及Hardware證據對照。沒有已完成的實測或問卷結果。 |
| [08_reference](08_reference/README.md) | 廠商原理圖、TOP／BOT PDF、原始BOM及網站快照。鎖定版圖未解鎖；未取得完整可製板資料或重新發布權利。 |
| [appendix](appendix/INDEX_ZH.html) | 四個有索引的發布ZIP，需解壓到同一個空資料夾：光學、氣流、傳質敏感度、硬體／軟體／文件。排除私人設定、資料庫、工具鏈、使用者CTB及廠商原件。 |
| [file_catalog.csv](file_catalog.csv)、[manifest.sha256](manifest.sha256)、[RELEASE_CHECKS.json](RELEASE_CHECKS.json) | 用途索引、檔案雜湊與實際釋出檢查；內容有修改就必須重建，不能沿用舊檢查當成新檔案的證據。 |

## 3. 要印什麼、哪些尺寸仍須確認

| STL | 樹脂與功能 |
|---|---|
| [01_base_BLACK.stl](01_print/01_base_BLACK.stl) | PC/GF-like Black；底座、一體風扇座、接孔與腳座。 |
| [02_black_hood_BLACK.stl](01_print/02_black_hood_BLACK.stl) | PC/GF-like Black；四井定位、黑色外包與中央隔牆。 |
| [03_gas_lid_BLACK.stl](01_print/03_gas_lid_BLACK.stl) | PC/GF-like Black；氣蓋與已選定的一體導流平台。 |
| [04_well_NE_CLEAR.stl](01_print/04_well_NE_CLEAR.stl)、[05_well_NW_CLEAR.stl](01_print/05_well_NW_CLEAR.stl)、[06_well_SW_CLEAR.stl](01_print/06_well_SW_CLEAR.stl)、[07_well_SE_CLEAR.stl](01_print/07_well_SE_CLEAR.stl) | Aqua-Clear Plus；四個分開、平底、可更換井。 |
| [08_gas_compression_plate_BLACK.stl](01_print/08_gas_compression_plate_BLACK.stl) | PC/GF-like Black；壓住四井口密封片的可拆壓板，不能任意省略。 |

沒有額外要印的「option最佳蓋」。本工作組不用Aqua 8K Gray；若自行用灰色試裝，不能把它當成已驗證的黑色遮光件。四井採凸緣卡位、向上取出、由壓板固定，不讓脆性樹脂反覆彎曲作彈性卡扣。黑色樹脂的遮光性、透明樹脂的光譜／自體螢光及細胞相容性均仍需實測；理想透明光學模型沒有替Aqua-Clear Plus的紫色偏色或培養相容性背書。

名義整機108×108×66 mm；風扇40×40×10 mm置於PCB下方。四井內腔4×2.8×12.5 mm、平底0.5 mm，幾何滿口140 µL而使用100 µL。中心依LED定位在X=±3.3、Y=±2.65 mm；PD感光區使用偏心代理，不等同封裝中心。中央最薄黑牆1.2 mm，底部保留光學通道，因此仍有光學串擾。

八個網格與名義干涉檢查可見[CAD checks](09_engineering_sources/CAD/checks)。這些只涵蓋已建模代理，不能取代完整裝件STEP或實板。印前／組裝前先確認板厚、孔位、光學面鏡像、電池座含電池高度、C21／R27／U8與插頭／焊點／線材包絡；以至少0.5 mm實物元件間隙作暫定檢查目標，仍要按位置與裝配容差判斷。不要硬鎖螺絲把零件壓到合。使用[廠商確認清單](04_manuals/Vendor_Confirmation_ZH.md)記錄未定項。

**ESP32照片與廠商圖查核：**下殼原本已有23 mm寬的貫穿天線口，X[-8,15]、Y[-56,-44]、Z[27,39.6] mm；但垂直裝入所經過的上緣卡槽更窄，只允許突出7.2 mm。PDF天線區約突出6.54 mm，名义插入餘量僅0.66 mm，不能當成實物與列印公差保證。組裝前必須核對突出長度、模組寬度與板下高度。八個STL、四井及其定位均未改動。機械放得下不代表RF合格，目前開口不證明符合Espressif各方向15 mm的建議；依[天線查核](09_engineering_sources/CAD/checks/Antenna_Clearance_ZH.md)與新版組裝手冊確認，並做裝殼前後手機連線檢查。

## 4. 採購、成本與可編輯文件

完整採購依[BOM_ZH.xlsx](05_BOM/BOM_ZH.xlsx)：一個5 V風扇；M3×8四支、M3×16兩支、M3×35兩支；M3螺帽八顆、墊片六片；0.8 mm不透光矽膠片、接線／絕緣、合適電源、進排氣濾器、短管／轉接、螢光濾片。風扇架和導流件已整合，沒有四組微型閥或鉸鏈組。泵／流量與限壓設備列為未報價共用項目；先借用並確認實際流量，不憑氣室壓降數字直接選泵。

PCB使用者報價為**NT$131,250／2片，含設計與開機**；NT$65,625是此次分攤，不是量產單價。現行BOM把品名、規格、數量／單位、使用位置／功能分開；螺絲品名為M3×8、M3×16、M3×35，安裝位置另列。PCB原廠61列保留原數量與位號；未提供的封裝、公差與額定值明列缺項，不假造可直接採購的完整規格。

2026-10-08。工作簿同時列出 NTD 與 USD。分類改為「必要、開發者購買、未來展望」，並保留 STL、PCB、外購材料三種明細。價格來源、實際用途與待確認規格分開列。 必要：八件列印件、PCB 及 13 列外購裝配材料。開發者購買：10 列機外燒錄、量測、給氣與工具；可以借用，但給氣與流量確認能力仍是實驗必要條件。未來展望：PDMS 膜、氣閥驅動、環境感測共三列，不加進當前機器預算。 **上述是預算，不是已確認可下單總價。** 單機包含 NTD 12,000 客製薄型螢光濾片預留；參考的 Edmund 67-016 價格 USD 284，但其 12.5 mm 外徑與約 2 mm 厚度均不符合現有 5.2 × 4.2 × 1.0 mm 濾片座。不能直接購買並假設可裝，也不能只裁切外形就解決厚度問題。尚需尺寸、角度光譜與加工報價。 詳見 [BOM 讀法](05_BOM/README_ZH.md)。

以下Word是方便協作者直接修改的文件，PDF供閱讀／列印，Markdown仍是現行程式化出版來源：

| 文件 | 中文Word | 英文Word | 來源 |
|---|---|---|---|
| 組裝手冊 | [Assembly_Manual_ZH.docx](04_manuals/Assembly_Manual_ZH.docx) | [Assembly_Manual_EN.docx](04_manuals/Assembly_Manual_EN.docx) | [ZH Markdown](04_manuals/Assembly_Manual_ZH.md)／[EN Markdown](04_manuals/Assembly_Manual_EN.md) |
| 操作設定 | [Operation_and_Setup_ZH.docx](04_manuals/Operation_and_Setup_ZH.docx) | [Operation_and_Setup_EN.docx](04_manuals/Operation_and_Setup_EN.docx) | [ZH指南](03_software/guides/操作與設定_ZH.md)／[EN指南](03_software/guides/Operation_and_Setup_EN.md) |
| 使用者回饋表 | [User_Feedback_ZH.docx](07_validation/User_Feedback_ZH.docx) | [User_Feedback_EN.docx](07_validation/User_Feedback_EN.docx) | [ZH Markdown](07_validation/User_Feedback_ZH.md)／[EN Markdown](07_validation/User_Feedback_EN.md) |

**Word修改不會自動回寫Markdown，也不會自動更新PDF、Wiki或附錄。** 指定一位文件負責人，將接受的修改人工回填雙語來源，再重建／檢查Word、PDF及發布資料。不要同時修改多個格式後假設它們已同步。填好的問卷另存為受試紀錄，不覆蓋空白範本。

## 5. 光學、干擾與軟體可以支持的結論

主MC為24條件×3種子、6,048,000封包；另有600,000底面照度封包、224點×65,536收光封包、標準液模型，以及12組LED／OD條件×3種子、3,024,000額外封包。合成偵測器研究為144情境×32雜訊重複；它不是PCB重複實驗。來源與重跑入口在[光學README](02_simulation/optics/README_ZH.md)、[主要摘要](02_simulation/optics/results/summary.json)、[逐圖說明](02_simulation/optics/Figure_Guide_ZH.md)。

在LED開啟500 µW、20 µm細胞底層、吸收0.5/mm、量子產率1等假設下，NE案例到理想PD的綠光為0.593±0.035 nW（三種子的1SE）。目標井貢獻88.6–90.9%，混合矩陣條件數約1.86；NE底面照度CV約46.2%。因此模型支持「有條件式收光路徑，仍有混合與不均勻」，不能證明細胞訊號足夠、已知偵測極限或四井獨立。

41／67／89／113 Hz DLIA會保留與LED同頻的反射激發光或其他井訊號。不是所有反射都是雜訊：有效螢光反射後被PD收到仍可能是有效訊號。理想、接收、殘差和噪聲圖／同步影片的單位與假設以[分析報告](02_simulation/optics/Analysis_ZH.md)為準；動畫不是光子真實飛行時間或細胞影片。

手機UI已提供[實測校正](03_software/guides/Measured_Correction_ZH.md)：量獨立、無細胞、LED開啟的空白，在複數I/Q扣一次；另量螢光相位參考，保留原始值、未平滑校正值及有正負號的相位投影。活細胞F0另作生物基線，不能當成要扣掉的空白。EMA只是依設備時間做顯示平均；固定背景扣除不能消除隨機雜訊、飽和或校正後改變的同頻污染，也不自動套用模擬矩陣解混。

[軟體證據摘要](03_software/evidence/software_validation_summary.json)記錄韌體與目前LittleFS建置成功、23項主機測試、10項校正、33項實測校正演算法、12項DOM/API整合、4項合成模型檢查及48組DLIA情境。這些不同測試不能加總成實驗樣本數，現版UI也未取得完整視覺瀏覽器驗證。未燒錄實板，`BOARD_VALIDATED=false`仍保留；沒有電量、細胞溫度、風量或轉速感測器，也沒有已驗證的氣味分類器。

J2 USB-C為供電／充電，J3才是3.3 V UART，請逐步依操作指南接線。先查供電、ADC原始暗訊號、逐燈方向及時序；TIA／ADC工作點可能造成下軌截波，遇到時修電路工作點，不可關QC或靠背景扣除掩蓋。初期用設備直連或私有LAN；公開雲端、權限、TLS與備份不是本包已部署功能。

## 6. 氣流候選與未解的細胞暴露問題

已保留原始28次速度求解（其中18種幾何），新增18孔板條件＋2次細化、9組基準氣相標量＋1個解析基準，再有21組操作點＋6組標量查核＋1次直接速度確認。帳目在[氣流摘要](02_simulation/airflow/supplemental_summary.json)與[操作摘要](02_simulation/airflow/operating_sweep_summary.json)，不能把求解次數寫成實驗重複。

導流平台已包含在03氣蓋，不更換STL。選型兼顧轉向、清潔與件數，不追求亂流或所有指標最小。1 mL/min、Dgas=10 mm²/s的NE近液面氣相t90=149.55秒，是保留的基準。固定STL掃Q與D後，以暫定最慢氣相t90≤60秒、入口Re≤3、氣速P95≤0.01 mm/s選最低符合的已算流量：3 mL/min，最慢t90=50.00秒、細網格50.98秒、半時間步49.85秒。2.5 mL/min約60.04秒，落在數值不確定性內，不能說實物必定不合格。氣速上限只是工程比較值，**不是細胞傷害門檻**。

操作採一個外接受控的下游抽氣泵，裝好全部管／濾器後量到約3 mL/min；同壓溫基準的穩態進出流量相同，不另設兩個互相不一致的泵流量。模型氣室壓降約0.02737 Pa，不含外部管路和濾器；UI填寫流量不等於實際控制／量到流量。完整假設、局部氣速與互動掃描見[Flow_Operation](02_simulation/airflow/Flow_Operation_ZH.md)。

100 µL在此井內形成約8.93 mm液深，井口以下氣隙約3.57 mm。氣相低速度不代表分子不能靠擴散進井，但「液面上方氣體已到達」仍不等於「井底細胞已暴露」。獨立[液體／PDMS分析](02_simulation/membrane/Analysis_ZH.md)包含243膜條件及其他敏感度；無蛋白促進、無混合且假定液體D=10⁻⁹ m²/s的理想表面階躍，可得到約22.83小時的底部t90。這是特定邊界案例，不是實測受器時間，也不能忽略實際混合、分配或反應直接套用。PDMS未加入當前裝配或必買BOM；疏水性不代表阻擋水蒸氣，完整兩相／細胞耦合仍未驗證。

捕捉蛋白尚無確切身分、序列／accession與可重現的專案docking輸入、pose、log。查核範圍見[Docking／OBP證據](06_wiki/content_plan/Docking_OBP_Evidence_ZH.md)，不能從未找到檔案推論團隊在別處一定沒做。現階段只可稱假說；docking分數不能直接當Kd、吸收速率或細胞活化證明，也不能用來宣稱已解決傳質限制。

新增的[Vergara等人2012文獻](08_reference/Gas_Delivery_Reference_ZH.md)用於受控供氣與時間／批次紀錄的依據；其金屬氧化物感測器漂移研究不驗證本氣室流量、HEK293T安全或我們的DLIA校正。已附完整引用與BibTeX，沒有套用無法核對的原文流量。

## 7. 到板後只先做一套主要實驗

依[單一實驗計畫](07_validation/Validation_Plan_ZH.md)：必要的斷電試裝／離板漏液、電源與ADC、DARK、停止指令、實測D1–D4方向之後，執行亮燈空白B_CAL、獨立B_CHECK、四個單井C、全井0.5C、全井C、再次0.5C。這是九個亮燈分析條件，每個至少五個不同有效兩秒區塊；DARK另外保存。組裝／燒錄熟悉後規劃約60–120分鐘；有故障就先排除，不為趕時間省略預檢。

標準液與介質／pH依既有實驗室流程記錄，固定液量、井、濾片、duty及頻率。匯出原始JSON與實測方向，交給[quick_check.py](07_validation/quick_check.py)，產生濃度反應、4×4單井矩陣、保留空白校正前後三圖。它拒絕DEMO、重複或不相容紀錄；五區塊是技術重複，不是五次生物實驗。標準液矩陣應對照均勻體積MC，不是底部細胞層。這套實驗不能證明VOC捕捉、氣相t90、細胞存活或分類準確率。

另請2–3位未參與設計者使用手冊，記錄完成、時間、求助、方向／密封錯誤與具體建議；修最重要1–2處後重試相關任務。保留未解決問題及同一人重測的學習效應。Cycle 5在觀察、修改、重測資料出現前維持規劃中。細胞實驗僅在既有wet-lab流程與匹配對照成熟時追加，不在本次交接編造培養或刺激配方。

實際標準品建議 **sodium fluorescein（螢光素鈉）**，優先借可追溯試劑／stock。依[標準液與細胞比對說明](07_validation/Fluorescence_and_Cell_Test_ZH.md)做暫定50／100 nM先導與既有單一實驗，分清光學、氣體與細胞能支持的結論。現在是2秒區塊、至少3秒間隔，約每5秒一筆，可能漏掉GCaMP6f快速峰值；細胞比對應選實驗室已有的持續反應，用同批細胞與不任意平移的共同時間窗。[完成清單](07_validation/Completion_Plan_ZH.md)把七件待做工作排成十天主線加最後收尾緩衝；實板適配、燒錄、受試者與生物結果仍待完成。

## 8. Wiki要放在哪裡

依[Placement_Plan_ZH.md](06_wiki/content_plan/Placement_Plan_ZH.md)與[Integration_Map](06_wiki/Integration_Map_EN_ZH.md)整合；下表是主線，不把整個交付包塞成一頁。

| 頁面與現有錨點 | 主頁保留的核心 | 附錄／下載 |
|---|---|---|
| Hardware：`hardware-architecture`、`mechanical-package`、`reader-assembly` | 需求、目前CAD／爆炸圖、接孔／風扇、八件／樹脂、重製流程與實板未驗證狀態。 | 完整CAD、STL、BOM、手冊、名義檢查報告。 |
| Hardware：`optical-question`、`well-floor-results`、`gas-path-results` | 非零條件式光路、不均勻／混合、導流設計取捨與Q3候選；整組換新圖／圖說／數值，不混舊幾何。 | 完整孔板／Q×D掃描、原始欄位與收斂紀錄。 |
| Hardware：`electronics-bridge`、`cost-and-reproduction`、`validation-boundary` | 實測I/Q校正、已知／未知成本、單一實驗與目前證據缺口。 | 韌體、UI、測試log、空白資料表與分析程式。 |
| Model：`aerosense-bridge`新增Read物理模型；新增`optical-transport`、`detector-interference`、`gas-and-liquid-transport`、`model-to-build` | 問題、方法、單位、數值查核、關鍵結果與如何改變設計。主線先談氣體到氣液介面；蛋白機制標為未測假說。 | 全部程式／種子／表、逐圖說明、深入液體／PDMS邊界案例及有真實輸入後的docking。 |
| Model：原`evidence-snapshot`、`network`、`training-evaluation`、`performance`、`limitations`、`reproduce` | 原KT金屬氧化物SNN基準維持獨立來源；F1 0.868不是AeroSense細胞資料或本包新驗證結果。 | 原模型訓練來源仍有缺口；新光學／流場程式不能替代。 |
| Description：`read`、`decode`、`evidence-ladder` | 氣體→液體／細胞→螢光→PD／ADC→手機的簡潔系統圖及證據狀態，連回Hardware／Model。 | 不在此堆掃描熱圖；OBP若出現只能是分開標示的未來假說。 |
| Engineering：`group-hardware`下`hw-cycle-1`至`hw-cycle-3`保留；新增4／5 | Cycle 4：需求→CAD／計算→條件式操作決策→待實測。Cycle 5：手冊任務→真實觀察→修改→重測，未做部分不填成果。 | [Cycle 4／5片段與預覽](06_wiki/engineering_cycles_ZH.html)，原始測試與使用者紀錄。 |

可直接編修的三頁稿：[Hardware](06_wiki/content_plan/Hardware_Sections_ZH.md)、[Model](06_wiki/content_plan/Model_Sections_ZH.md)、[Description](06_wiki/content_plan/Description_Sections_ZH.md)。核心方法、圖與結論必須能在主頁看到；附錄提供完整重現，不是把證據藏在ZIP。Best Hardware以需求、使用者回饋、功能證據及他人重現為主，對照[證據矩陣](07_validation/Hardware_Evidence_Matrix_ZH.md)；沒有額外捏造的Overgrad SNR／成本門檻或獲獎保證。正式發布前按隊伍平台核對當年度託管、歸屬、廠商文件權利與同意；GitHub預覽不等於正式提交。

組裝易用性證據主要保留在Hardware，修改／重測放Engineering Cycle5。Entrepreneurship可交叉連結真正目標使用者的採用障礙；Education需有學習目標、雙向交流與學習證據。同學組裝問卷本身不等於客戶驗證或教育成效。同一活動只算一份研究，依實際目的分別引用；詳見[完成清單](07_validation/Completion_Plan_ZH.md)。

## 9. 下一位協作者的更新流程

1. **先固定輸入。** 保存廠商回答、實物尺寸、日期、操作者、版號與原始失敗資料；保留使用者CTB／成本筆記原件。任何幾何變動先改[design_parameters.json](09_engineering_sources/CAD/design_parameters.json)與OpenSCAD，再重匯出、檢查及更新受影響模型。
2. **區分重算與重畫。** 光學依[README](02_simulation/optics/README_ZH.md)；氣流`python reproduce.py`重畫保存結果，`--fresh-dir`才建新求解目錄。所有單項已執行，但最後擴充的完整新目錄包裝流程未再從頭到尾重跑。各模型README列依賴與影片指令，不把動畫視為新增實驗。
3. **用原始資料升級主張。** 單一實驗分析依Validation_Plan執行，保留排除原因；有實測才把Wiki「待驗證」改成有範圍的結果。不要用調整神經網路隱藏讀取器不穩定。
4. **同步來源與人類文件。** Word接受修改後人工回填雙語Markdown／指南，重建Word與PDF、檢查排版。程式變動跑對應現有測試；韌體與LittleFS分別重建，私人設定不發布。
5. **整包再檢查。** 依目前釋出工具更新模擬索引、`06_wiki/build_wiki.py`、本機link check、附錄ZIP、catalog、manifest與RELEASE_CHECKS。來源、圖說、BOM、手冊和頁面必須對應同一批資料；確認之後才由團隊發布。互動圖目前有程式／資料層測試，不宣稱完整瀏覽器或實機驗證。

沒有實板、生物或受試者結果的欄位保持空白；交接的重點是讓下一人知道如何取得、判讀並保存下一份可信證據。

## 手冊與成本的使用方式

組裝與操作手冊已按 ASD-STE100 第 9 版寫作原則重寫英文，中文對照拆成可執行步驟。每段程序附準備條件、檢查與異常處理；未做完整詞彙符合性審查，wiki 不應標示「ASD-STE100 certified」。問卷保留獨立文件。實物約 100 µL 已滿的回報優先於 CAD 容量估值，因此 80 µL 只作待確認工作量；原 100 µL 模擬未重算。氣蓋已有一體水平擋板，管線接蓋內接頭後穿外殼側孔。STL 與 firmware 沒有變更。

Wiki Hardware 放組裝程序、現行限制、必要單機預算；Engineering 放使用者依步驟組裝後的卡點、修改及重測。完整 Word、BOM、逐筆來源放 appendix 並連結。Model 保留原始模擬假設，不把手冊的 80 µL 當成已重算條件。開發者與未來成本分開呈現；不得將預留額或替代估價寫成實付或量產成本。


2026-10-08 文件狀態：組裝與操作英文按 ASD-STE100 第 9 版寫作原則拆解，中文對照；未宣稱正式符合性認證。四份 PDF 已逐頁檢查。四份 Word 內容、可編輯結構與來源已檢查，但 Word 啟動卡住，無法完成實際分頁預覽；不得沿用舊版通過紀錄。閱讀／列印可先用 PDF，Word 列印前需在本機確認分頁。STL、四個 well 與 firmware 未修改。
