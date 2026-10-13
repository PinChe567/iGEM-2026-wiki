"""Apply reviewed bilingual copy edits without reserializing whole HTML files."""
from pathlib import Path
import re, json
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT.parent/'reports/review-v25'
REPORT.mkdir(parents=True,exist_ok=True)
logfile=REPORT/'root-copy-changes.json'
changes=json.loads(logfile.read_text(encoding='utf-8')) if logfile.exists() else []
def norm(text): return ' '.join(text.split())
def copy(page, edits):
    path=ROOT/(page+'.html')
    source=path.read_text(encoding='utf-8')
    extra=ROOT/'locales/extras/zh-Hant'/f'{page}.json'
    catalog=json.loads(extra.read_text(encoding='utf-8')) if extra.exists() else {}
    for old,new,zh in edits:
        count=source.count(old)
        if count:
            source=source.replace(old,new)
            changes.append({'page':page,'before':old,'after':new,'occurrences':count})
        elif new not in source:
            # Headings sometimes use an authored line break. Preserve the
            # surrounding element; never remove a link through this fallback.
            found=False
            for match in re.finditer(r'<(h[1-6]|p)(\s[^>]*|)>(.*?)</\1>',source,re.S):
                fragment=BeautifulSoup(match.group(3),'html.parser')
                if norm(fragment.get_text(' ',strip=True))==norm(old) and not fragment.find('a'):
                    source=source[:match.start(3)]+new+source[match.end(3):]
                    changes.append({'page':page,'before':old,'after':new,'occurrences':1})
                    found=True
                    break
            if not found: raise ValueError(f'Missing exact text in {page}: {old[:100]}')
        if new and zh: catalog[norm(new)]=zh
    path.write_text(source,encoding='utf-8')
    extra.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

copy('human-practices',[
('Follow stakeholder input through the decisions it shaped. Interviews document stakeholder perspectives; technical evidence is presented in','Explore the decisions below. Technical evidence:','以下呈現關鍵決策。技術證據：'),
('The road that changed AeroSense','How feedback changed AeroSense','回饋如何改變 AeroSense'),
('A better sensor begins<br>with a harder question.','Start with the decision','從決策出發'),
('Detect a change—and then what? Conversations about crops, instruments and practical decisions pushed AeroSense beyond a general-purpose electronic nose. This is the record of those choices: what we heard, what changed, and what still needs to be tested with users.','Who needs an odor signal, and what should they do next? Agricultural specialists, instrument experts and mentors helped us narrow the target, define the buyer and limit our claims. Each checkpoint connects their feedback to a design decision and its next test.','誰需要氣味訊號，又該如何採取行動？農業專家、儀器專業人士與業師協助我們聚焦應用、釐清買方並界定主張。每個節點都連結回饋、設計決策與下一步驗證。'),
('Meet the questions that shaped the project ↗','Explore the decisions ↗','查看關鍵決策 ↗'),
('The idea we took into the room','Our starting assumption','最初的假設'),
('We arrived with a technology. The conversations made us ask who would use it, which decision it would support, and what a responsible claim would require.','We began with a sensing technology. Stakeholders redirected us toward a specific user, decision and standard of evidence.','我們從感測技術出發。利害關係人的回饋讓我們聚焦於明確的使用者、決策與證據標準。'),
('The project could be told as a general-purpose electronic nose: a living receptor layer plus lock-in electronics that might serve many facility-agriculture crops, compete as a cheaper laboratory instrument, and describe mold VOC detection as food-safety detection. Showing that AeroSense can detect odor — with strong electronics and algorithms — looked like enough to compete.','Our initial concept was a general-purpose electronic nose combining living receptors with lock-in electronics. We considered multiple crops, a lower-cost laboratory instrument and food-safety applications. Interviews challenged all three assumptions: useful odor detection requires a defined workflow and application-specific validation.','最初的構想是結合活細胞受體與鎖相電子讀取的通用電子鼻，涵蓋多種作物、較低成本的實驗室儀器及食品安全應用。訪談挑戰了這三項假設：氣味偵測要產生實際價值，必須有明確流程與特定應用的驗證。'),
('AeroSense odor map','Stakeholder map','利害關係人地圖'),
('Stakeholder groups surround the sensor. Open a category to see its organizations. The road below carries only project-changing checkpoints. Contextual voices live in the archive after the road. Planned voices stay visible because their absence is a limitation.','Select a group to see who contributed. The decision pathway records changes to the project; the archive holds supporting perspectives and planned engagements.','選取類別可查看參與對象。決策路徑呈現專題如何改變；補充觀點與規劃中的訪談則列於紀錄區。'),
('What supports each checkpoint?','Evidence behind each decision','決策的證據'),
('The linked design or business artifact shows where our reasoning changed. It does not independently verify that an interview took place. Event photographs later on this page document those events only.','Linked design and business records show what changed. Interview verification requires original notes and permission records; event photographs document attendance only.','設計與商業文件呈現具體改變。訪談仍需原始紀錄與同意文件佐證；活動照片僅證明出席情形。'),
('Institutional channels first — not every grower as buyer','Prioritize institutional buyers','優先接觸機構買方'),
('The sensing element — not electronics alone — is where industry remains stuck','Biological recognition is the key challenge','生物辨識是核心挑戰'),
('On-site screening before confirmation — not a cheaper GC-MS','Screen on site; confirm in the laboratory','現場篩檢，實驗室確認'),
('A specific expensive problem — not a general-purpose e-nose','Focus on a costly, specific problem','聚焦明確且代價高昂的問題'),
('Still open — not completed','Revalidation pending','待完成再驗證'),
('Exporter voice still missing — the beachhead stays a candidate','Exporter validation is still needed','仍需出口商驗證'),
('Other voices that informed us','Supporting perspectives','補充觀點'),
('Supporting voices that did not force a project turn — plus planned contacts. They sit off the main road on purpose. Main-road interviews are not retold here; open the checkpoint instead.','These engagements provided context without a documented project change. Planned contacts are labeled separately.','這些交流提供背景，但尚無可記錄的專題改變；規劃中的接觸對象另有標示。'),
('The rooms that changed how we explain AeroSense.','Learning through exchange','在交流中修正'),
('Each setting asked something different of the team: make the first business plan coherent, connect biology to a practical use, explain a platform to an unfamiliar audience, or defend a design choice under review. These photographs and accounts document that work. Participation describes an exchange; it does not by itself establish a commercial partnership or a validated application.','Mentor reviews and public exchanges sharpened our business plan and explanation of the technology. The records below document participation and its effect on our work; they do not establish commercial partnerships or validated applications.','業師審查與公開交流讓商業計畫及技術說明更清晰。以下紀錄呈現參與情形及其對專題的影響，不代表已建立商業合作或驗證應用成效。'),
('A place to begin the business plan.','Building the first business plan','建立第一版商業計畫'),
('Ask what a platform could become.','Exploring future applications','探索未來應用'),
('Present it without the lab\'s shared vocabulary.','Explaining across disciplines','跨領域溝通'),
('A technology needs a customer\'s problem.','Finding the customer problem','找到客戶痛點'),
('Eleven points that required a rewrite.','Eleven gaps, one revised plan','十一項缺口，一次修訂'),
('Let the audience change the explanation.','Adapting to the audience','依受眾調整說明'),
('Compare stories across teams.','Learning from other teams','向其他隊伍學習'),
('Future work: close the revalidation loop','Next: test the revised decisions','下一步：驗證修訂後的決策'),
('The next engagement must test the changed artifact with its intended user: the screening language with analytical and food-safety specialists, the workflow with operators, and the commercial assumptions with exporters or packing houses. A completed follow-up needs a date, participant role, consented summary, the artifact reviewed and a recorded decision to retain or revise it.','Next, specialists will review our screening claims, operators will review the workflow, and exporters or packing houses will test the commercial assumptions. Each follow-up must record the date, participant role, consented summary, reviewed artifact and resulting decision.','下一步將請專家審視篩檢主張、操作人員檢視流程，並由出口商或包裝場檢驗商業假設。每次回訪都須記錄日期、參與者角色、經同意的摘要、審查文件與最終決策。'),
])

# The heading belongs over the illustration, with concise body copy alongside.
path=ROOT/'human-practices.html'
html=path.read_text(encoding='utf-8')
if 'editorial-hp-intro__cover' not in html:
    start=html.index('<section class="editorial-hp-intro"')
    end=html.index('</section>',start)+len('</section>')
    old=html[start:end]
    soup=BeautifulSoup(old,'html.parser')
    section=soup.section; img=section.img.extract(); heading=section.h2.extract()
    copy_div=section.find('div'); copy_div['class']='editorial-hp-intro__copy'
    cover=soup.new_tag('div',attrs={'class':'editorial-hp-intro__cover'})
    cover.append(img); cover.append(heading); section.insert(0,cover)
    html=html[:start]+str(section)+html[end:]
    path.write_text(html,encoding='utf-8')

copy('entrepreneurship',[
('From odor to action — before loss becomes visible','Earlier signals for better decisions','以更早的訊號支持決策'),
('How our work addresses Best Entrepreneurship','Business case at a glance','商業構想總覽'),
('Five ballot questions, five short answers, and direct links to the sections where the underlying evidence will live.\n              Essential conclusions stay on the page — not only in tooltips or animation.','Our proposed first market is Taiwan’s banana export chain. The product architecture and development plan are documented; buyer demand and integrated performance still require validation.','我們以臺灣香蕉出口供應鏈作為候選首發市場。產品架構與開發計畫已有文件紀錄，買方需求及整合效能仍待驗證。'),
('Read the hero facts and the five cards below: problem, customer, product form, and current evidence status.','Start with the problem, customer and current evidence below.','先了解下方的問題、客戶與現有證據。'),
('Walk beachhead → MVP → business model → go-to-market → risks for the commercialization path.','Follow the first market, prototype, business model and development gates.','依序查看首發市場、原型、商業模式與開發關卡。'),
('Expand source notes, BMC, financing scenario, risk filters, and references — progressive disclosure for detail, not for core claims.','Open source notes and financial scenarios for assumptions and calculations.','展開來源註記及財務情境，查看假設與計算。'),
('Possible &amp; inventive?','Technical approach','技術方案'),
('Is the solution possible, scalable, and inventive — with evidence, not slogans?','What makes the approach feasible, and what remains untested?','方案的可行性依據為何？還有哪些項目待測？'),
('Explore the business logic.','Business logic','商業邏輯'),
('Select any labeled area to open its explanation and source section. These diagrams summarize the current page; they do not add validation evidence. Exit-barrier questions are proposed additions for team review.','Select a diagram label for its rationale and source. These strategy maps summarize the proposal; exit conditions remain under review.','選取圖中的標籤可查看理由與來源。策略圖概括目前提案；退出條件仍待審查。'),
('Select a region to explore its meaning and evidence.','Select a region for details.','選取區域查看詳情。'),
('Strategic scenario analysis; these quadrants do not predict returns or assign AeroSense a market position.','Illustrative strategy scenario; no return or market-position prediction.','策略情境示意，不預測報酬或市場地位。'),
('Start with an operational decision, not a market size number.\n              In post-harvest QC, the costly mistake is often not “failing a lab assay” — it is shipping, mixing, or storing a batch after the problem was already underway but not yet visible.','Post-harvest quality control must decide when to ship, separate or retest a batch. A problem that remains invisible can carry losses into storage and distribution. AeroSense is intended to provide an earlier reason to investigate.','採後品管必須決定何時出貨、隔離或複驗。尚未顯現的問題可能將損失延伸到儲運環節；AeroSense 的目標是更早提供進一步檢查的依據。'),
('Workflow comparison — categories, not a claim that AeroSense is commercially mature','Workflow comparison. AeroSense entries describe intended capabilities.','工作流程比較。AeroSense 欄列示預期能力。'),
('Where capability sits today — gaps stay visible','Current capabilities and development gaps','現有能力與開發缺口'),
('Not a gallery — a capability map.','Skills required to deliver the proposed product.','實現產品構想所需的能力。'),
('Team, Capabilities &amp; Stakeholders','Team and capabilities','團隊與能力'),
('Designed for same-shift triage —','Target: triage within one shift;','目標：同一班次內完成初步分流；'),
('Designed for headspace / SOP sampling — workflow not demonstrated in field','Headspace sampling under a defined protocol; field workflow untested','依明確程序進行頂空採樣；現場流程尚未驗證'),
('Design goal: portable ESP32 reader — enclosure/fab pending','Portable ESP32 reader; fabrication and enclosure pending','可攜式 ESP32 讀取器；待製作與外殼驗證'),
])

copy('education',[
('A fly-brain route from curiosity to understanding.','From curiosity to informed decisions','從好奇到有依據的決策'),
('A fact can be understood. A decision has to be practised.','Practise the decision','練習做決策'),
('Our initial survey changed the question we wanted to ask. Explaining that mold can be dangerous was too broad. Our working summary pointed instead to decisions people make about heat, smell and visible spoilage. We therefore built opportunities to choose an answer, see why it matters and try a new situation. The team now reports 107 responses; item-level counts still need verification, so this page does not turn the early summary into population percentages.','Our early survey redirected teaching from general mold awareness to decisions about heat, smell and visible spoilage. We built activities in which learners choose, receive an explanation and apply the idea again. The redesign used 28 responses; the later reported total of 107 still lacks verified item-level counts.','早期問卷讓教學從黴菌的一般知識，轉向加熱、氣味與可見腐敗的判斷。我們設計了讓學習者選擇、閱讀解釋並再次應用的活動。這次改版依據 28 份回覆；後續回報的 107 份尚缺經核對的逐題統計。'),
('Start where people already are.','Start with familiar choices','從熟悉的選擇出發'),
('The survey gave us a question to work on.','Survey findings shaped the lessons','問卷發現引導教學'),
('28 responses informed the redesign; 107 is a later collection total.','Two collection stages','兩階段問卷'),
('An initial diagnostic, not a population estimate.','Sample limitations','樣本限制'),
('A smell is a pattern across channels. That sentence is easier to understand after a pattern has fooled you. Our three browser games turn recognition, navigation and mixture decoding into decisions a player can try. They are simplified teaching models, with formal learning evaluation still pending.','Three browser games make odor patterns tangible through recognition, navigation and mixture decoding. These simplified models invite learners to test their intuition; formal learning evaluation is pending.','三款瀏覽器遊戲透過辨識、導航與混合氣味解碼，讓氣味模式變得具體。學習者可在簡化模型中檢驗直覺；正式學習成效仍待評估。'),
('Three formats for a scrolling audience.','Science in a social feed','社群裡的科學'),
('The survey and the games ask people to seek us out. Instagram lets us introduce the same ideas in a feed they already use. We separated that work into technical carousels, sustainability questions and short explanations, each with a different job.','Instagram introduces the project through technical carousels, sustainability questions and short explanations. Each format connects one scientific idea to a familiar decision.','Instagram 透過技術輪播、永續提問與簡短說明介紹專題，每種形式都將一個科學概念連結到熟悉的決策。'),
('Give curiosity a structure.','Connect the concepts','串起核心概念'),
('A clearer explanation is something we make with an audience.','Learn through dialogue','透過對話學習'),
('The last part of this map is about taking an explanation into a new setting. Industry visitors, neuroscience students and other iGEM teams bring different assumptions. Their questions reveal which links in our story need more work. The events below document that exchange; they are not controlled learning trials.','Industry audiences, neuroscience students and other iGEM teams challenged different parts of our explanation. These exchanges helped us refine the story; they were not controlled learning trials.','產業聽眾、神經科學學生與其他 iGEM 隊伍，分別挑戰了說明中的不同環節。交流協助我們修正敘事，但並非受控的學習成效試驗。'),
('Explaining the platform beyond our own university','SynBioBeta exchange','SynBioBeta 交流'),
('Start with the biology, then connect the engineering.','Biology before engineering','從生物原理理解工程'),
('Different teams, different ways to tell a research story.','Learning across teams','跨隊伍交流'),
('Leave an activity someone else can run.','Resources others can reuse','可供他人再用的資源'),
('Keep delivery and learning visible.','Evaluate learning','評估學習成效'),
('What evidence we actually have','Current evidence','現有證據'),
('Evaluation pending for paired gain. No empty bar charts and no fabricated zeros.','Paired learning-gain evaluation is pending.','配對學習成效評估尚待完成。'),
('Reach is not learning. Traffic is not knowledge gain.','Reach measures exposure; learning requires assessment.','觸及呈現接觸程度；學習成效需要評量。'),
('Two measurement chains, not one score','Two assessment pathways','兩條評量路徑'),
('Each node is a delivery fact plus an evaluation fact. Evidence view (above) adds scanning labels. The path itself does not change.','Each node identifies the delivered activity and its evaluation status.','每個節點標明已提供的活動及其評估狀態。'),
('Why identical wording — and why that is not enough','Comparability and transfer','可比性與知識遷移'),
('Why shared item IDs — and why that is not enough','Shared assessment items','共用評量題目'),
('Impact from us / impact on us','What changed in our teaching','教學如何改變'),
('The right-hand column matters more than a generic outreach summary: what did evidence change in our education design?','The record below links each piece of evidence to a teaching decision.','以下紀錄將每項證據連結到具體教學決策。'),
('Reuse the AeroSense Education Framework','Teach with AeroSense','用 AeroSense 教學'),
('Not just the lessons we built — but how someone else can run them.','Use the lessons, games and evaluation protocol in your own setting.','將課程、遊戲及評估程序運用於自己的教學情境。'),
('Only resources that actually exist are listed. There is no Download button on a missing file. The linked game build, protocols and question bank are included in this wiki. Their published iGEM routes must be checked after deployment.','The game build, protocols and question bank are included in this wiki. The packaged teacher toolkit is still in preparation.','本 wiki 已收錄遊戲、程序與題庫；整套教師工具包仍在準備中。'),
('What our evidence does not yet show','Evaluation limits','評估限制'),
('These are the bounds of the claim, not an apology for building the tools.','The resources are available; their effect on learning still requires a documented evaluation.','教學資源已可使用，學習效果仍需有紀錄的評估。'),
('Future work: test the activities with learners','Next: evaluate with learners','下一步：與學習者共同評估'),
])

copy('sustainability',[
('What sustainability means for AeroSense','Benefits, burdens and evidence','效益、負擔與證據'),
('Ecological, social and economic systems belong together','One connected system','彼此相連的系統'),
('Our SDGs at a glance','Four goals, four tests','四項目標，四項驗證'),
('The four primary goals connect our design choices to specific targets. The next test matters as much as the proposed benefit.','Each goal links a design choice to a benefit hypothesis and the test needed to evaluate it.','每項目標都連結設計選擇、效益假設與驗證方法。'),
('Knowledge-sharing with clear maturity','Sharing knowledge responsibly','負責任的知識共享'),
('Sustainability effects, if any, would appear along a decision chain — not inside an SDG icon.\n            Select a stage or actor to see what happens there, who is involved, what could be gained or lost, and what evidence we actually have.\n            Engagement labels are deliberate: interviews are not commercial partnerships.','Select a stage or actor to trace a possible benefit, its cost and the available evidence. Engagement labels distinguish interviews, mentorship and formal partnerships.','選取階段或角色，追溯可能的效益、代價與現有證據。交流標籤區分訪談、指導及正式合作。'),
('What we heard, and what we changed','Feedback into design','將回饋轉為設計'),
('Our four primary impact pathways','Four impact pathways','四條影響路徑'),
('Each pathway uses the same logic: Target → Problem → AeroSense mechanism → Evidence → Boundary / risk → Next measurement.\n              Empty evidence stays empty.','Each pathway connects an SDG target, the problem, our proposed mechanism, supporting evidence, risks and the next measurement.','每條路徑連結 SDG 目標、問題、預期機制、支持證據、風險與下一項量測。'),
('What do we actually know?','Evidence ledger','證據清單'),
('This ledger is the honest boundary of the Sustainability page.\n              Status labels are not decoration: a hypothesis must not look like a measurement.\n              Limitations stay visible — they are not tucked into a closed accordion.','The ledger separates measurements, stakeholder input, estimates, designs and open hypotheses. Each entry states the evidence available and the limit on its interpretation.','此清單區分量測、利害關係人回饋、估算、設計與待驗證假設；各項列明現有證據及解讀限制。'),
('Public survey reanalysis (n = 107 team reported)','Survey analysis: reported n = 107','問卷分析：回報 n = 107'),
('Discard-behavior rate claimed in earlier drafts','Unverified discard rate','待核對的丟棄比例'),
('Beachhead problem sizing (Taiwan banana fungal-disease desk estimate)','Taiwan banana disease estimate','臺灣香蕉病害估算'),
('Field and industry engagements reshaped beachhead, buyer, and claim boundaries','Stakeholder-driven design changes','回饋促成的設計改變'),
('Individual farmers often show low willingness to pay / may resist tools that flag their own product','Grower adoption concerns','農民採用顧慮'),
('ESP32-standalone current design reader architecture (Raspberry Pi removed)','Standalone ESP32 reader design','獨立 ESP32 讀取器設計'),
('Risk-tier screening output (not binary discard / not silent “safe”)','Risk tiers for screening','篩檢風險分級'),
('Non-destructive headspace cartridge intended for multiple readings before replacement','Proposed cartridge reuse','預期的匣體重複使用'),
('AeroSense reduces food loss or food waste in practice','Food-loss reduction hypothesis','減少食物損失的假設'),
('Self-renewing living cells yield lower replacement frequency than conventional e-nose sensors','Cartridge lifetime hypothesis','匣體壽命假設'),
('Fungal / disease VOC signatures are detectable and actionable with the current receptor set','Fungal VOC sensing hypothesis','真菌 VOC 感測假設'),
('Lower environmental footprint / net LCA benefit vs destructive assays or conventional sensors','Net environmental benefit','淨環境效益'),
('Reader power consumption (including any “under 1 W” claim)','Unmeasured operating power','尚未量測的運作功耗'),
('Field diagnostic / field-ready screening capability','Field readiness','現場應用成熟度'),
('Mycotoxin / aflatoxin detection or food-safety certification','Toxin and food-safety claims','毒素與食品安全主張'),
('Patent filings completed / freedom-to-operate established','Patent and operating freedom','專利與實施自由'),
('Exporter / packing-house buyer validation','Buyer validation','買方驗證'),
('How we would calculate a net benefit','Measuring net benefit','衡量淨效益'),
('Life-cycle inventory: reader plus recurring biology','Life-cycle inventory','生命週期盤查'),
('Who benefits? Who might be left behind?','Access and equity','可及性與公平性'),
('Before wiki freeze, measure these','Priority measurements','優先量測項目'),
('Checklist for the team — empty boxes mean the measurement is still owed, not “zero impact.”','Unchecked items are pending measurements.','未勾選項目表示量測尚待完成。'),
('This page should remain useful after 2026. Below is a reusable evidence framework future iGEM teams can copy —\n              not a finished impact certificate for AeroSense.','Other teams can reuse this framework to connect a proposed benefit to evidence, costs and the next measurement.','其他隊伍可沿用此框架，將預期效益連結到證據、成本與下一項量測。'),
('Copy into your notebook or wiki. No server download — clipboard only.','Copy the framework to your notebook or wiki.','將框架複製到筆記本或 wiki。'),
])

copy('engineering',[
('Introduction and methods · how the cycles are read','How to read the cycles','如何閱讀工程循環'),
('Make the biological signal readable.','Improve the reporter','改良報導系統'),
('Build a clearer route from light to data.','Refine the reader','修訂讀取器'),
('Make performance withstand a second look.','Audit the decoder','檢驗解碼器'),
('Challenge a candidate before claiming improvement.','Test receptor candidates','檢驗候選受體'),
('Find the first useful place to start.','Define the first use','界定首個應用'),
('Turn an explanation into a learning path.','Build the learning pathway','建立學習路徑'),
('Make the next question easier to ask.','Help readers find answers','協助讀者找到答案'),
('Results · engineering cycles','Engineering cycles','工程循環'),
('Six iterations from prediction to molecular access','Six receptor design iterations','六輪受體設計迭代'),
('From a broad technology to a defined first use','Define the first use','界定首個應用'),
('From a question to a teachable decision','Teach through decisions','透過決策教學'),
('Help that meets the reader where they are','Contextual reading support','依閱讀情境提供協助'),
('Discussion and future work · close the open technical loops','Next validation steps','下一步驗證'),
('Supplementary information and data availability','Data and supporting records','資料與支持紀錄'),
('Each cycle records an initial hypothesis, the artifact actually built, the review or test performed, its interpretation and the resulting revision. A build may be a synthesized construct, a CAD or circuit revision, or executable software; its completion does not imply a validated instrument or biological assay. A review is documented as review evidence, while simulations retain their model assumptions and numerical uncertainty. Planned validation remains prospective.','Each cycle links a hypothesis to a build, test or review, interpretation and revision. Builds include constructs, CAD, circuits and software. Reviews and simulations retain their own evidence limits; completing a build does not establish assay or instrument performance.','每個循環連結假設、建構、測試或審查、解讀及修訂。建構成果包括構築體、CAD、電路與軟體。審查與模擬各有證據限制；完成建構不代表已證實分析方法或儀器效能。'),
('The record shows several concrete changes: establishing a mammalian expression context, revising reporter architecture, protecting the weak-signal analog path, simplifying reader control, and correcting model evaluation. Their value lies in the connection between evidence and decision. Completing the project’s next cycle requires the selected constructs and assembled reader to be evaluated together under controlled conditions, followed by a decoder assessment on those measured signals.','The cycles changed five core decisions: mammalian expression, reporter architecture, weak-signal protection, reader control and model evaluation. The next technical step is to test the selected constructs with an assembled reader under controlled conditions, then evaluate the decoder on those measured signals.','工程循環改變了五項核心決策：哺乳類細胞表現、報導架構、弱訊號保護、讀取器控制與模型評估。下一步是在受控條件下整合測試選定構築體與讀取器，再以實測訊號評估解碼器。'),
])

copy('safety-and-security',[
('light-sheet work: TH-associated preparation on 20 April and GH146/PN preparation on 4 May 2026; both reported with UAS-GCaMP6f.','light-sheet work: 5137;TH (TH-GFP) recording on 20 April and GH146 × UAS-GCaMP6f preparation on 4 May 2026; PN imaging remains pending.','光片工作：4 月 20 日的 5137;TH（TH-GFP）影像，以及 2026 年 5 月 4 日的 GH146 × UAS-GCaMP6f 製備；PN 成像仍待進行。'),
('Laboratory contained-use only','Current scope: contained laboratory use','目前範圍：實驗室內封閉使用'),
('Lab-door biosafety labels','Facility labels','實驗室標示'),
('These photographs show the posted BSL-1 and BSL-2 labels at NTHU laboratory entrances. We cropped the location and contact details from the public images. A door label identifies a facility; it does not document which project experiments occurred in which room, certify a construct or authorize field use.','NTHU laboratory entrances display these BSL-1 and BSL-2 labels; location and contact details are cropped for publication. The labels identify facilities, not experiment-specific approval or authorization for field use.','這些 BSL-1 與 BSL-2 標示攝於清大實驗室入口，公開影像已裁去位置與聯絡資訊。標示用於辨識設施，不代表個別實驗核准或現場使用許可。'),
('Six domains, one vocabulary. Verified means a measurement, inspection, or formal record. Implemented means a procedure or design control is in laboratory or documentation use — not a published certificate. Planned is not done. Restricted is out of scope or not authorized on this wiki.','Six domains share four evidence labels: Verified requires a measurement, inspection or formal record; Implemented identifies a procedure or documented design control; Planned is pending; Restricted is outside the documented scope or authorization.','六個領域共用四種證據標籤：已驗證須有量測、檢查或正式紀錄；已實施指正在使用的程序或有文件的設計控制；規劃中表示待完成；受限表示超出已記錄的範圍或授權。'),
('The four-node selector is an enhancement. Sense, Read, Decode, and Act summaries remain in the page source in order; full hazard rows are in the Risk register.','The four layer summaries link to the complete risk register.','四層摘要連結至完整風險清單。'),
('Decode · is this a trustworthy number?','Decode · validate the signal','解碼：驗證訊號'),
('Act · what the number is allowed to mean','Act · communicate the result','行動：傳達結果'),
('Why containment is a design choice','Why containment matters','封閉管理的重要性'),
('Cartridge / interface containment','Cartridge containment','匣體封閉管理'),
('High-impedance measurement integrity','Protecting weak signals','保護弱訊號'),
('Three questions that are not equivalent','Detection, validity, confirmation','偵測、有效性與確認'),
('Shape, label, and wording all differ. Color is secondary.\n                Q1 is a detection. Q2 is a validity gate. Q3 is a food-safety confirmation this project does not claim.','The three questions separate detection, measurement validity and food-safety confirmation. AeroSense does not establish the third.','三個問題分別處理訊號偵測、量測有效性及食品安全確認；AeroSense 不提供第三項結論。'),
('Does not mean the measurement is valid. Does not mean a food-safety condition is confirmed.','A detected change still requires measurement validation and independent safety confirmation.','偵測到變化後，仍須驗證量測有效性，並另行確認食品安全。'),
('Evidence-claim integrity','Claims and evidence','主張與證據'),
('Current boundary versus future requirements','Deployment requirements','部署條件'),
('AeroSafe — a safety-case framework for living biosensors','AeroSafe: a reusable safety framework','AeroSafe：可再用的安全框架'),
('Why a living biosensor needs this chain','From hazard to evidence','從危害到證據'),
('Three administrative questions remain open','Pending administrative records','待補行政紀錄'),
('2026 Safety &amp; Security award map','Safety contribution map','安全貢獻地圖'),
])

copy('entrepreneurship',[
('From “technology that can do many things” to a positioned platform','A focused first application','聚焦首個應用'),
('We are not replacing the laboratory.<br>We are moving the decision earlier.','Screen early, confirm in the lab','提早篩檢，實驗室確認'),
('We are not replacing the laboratory.We are moving the decision earlier.','Screen early, confirm in the lab','提早篩檢，實驗室確認'),
('From the current prototype BOM to a commercial cost model','From prototype cost to unit economics','從原型成本到單位經濟'),
('Public survey: early n = 28, later reported n = 107','Survey evidence','問卷證據'),
])

copy('entrepreneurship',[
('Order of story: unit economics honesty → customer-side logic → illustrative 3-year model → collapsed financing detail.\n              Market sizing (TAM/SAM/SOM) sits here — not in the hero.','The financial model connects prototype costs, customer value and a three-year operating scenario. Market estimates and financing assumptions remain illustrative until tested with customers and suppliers.','財務模型連結原型成本、客戶價值與三年營運情境。市場估算及融資假設仍屬示意，須與客戶及供應商驗證。'),
('English personal names for founders remain <span class="ent-tag">Pending team confirmation</span>; Chinese names and roles are from the entrepreneurship draft.','',''),
('Multiple applications were considered. We keep that history visible.\n              Cells use qualitative strength labels — not fabricated numeric scores.','We compared several applications using qualitative evidence. The matrix shows why banana quality control became the proposed first use.','我們以質性證據比較多種應用。矩陣呈現香蕉品管成為候選首發應用的理由。'),
('Only real actions. Revenue models live in §10; this section does not convert intentions into traction.','Dated reviews, interviews and prototype work show progress beyond the business plan. Planned pilots remain separate from completed engagements.','有日期的審查、訪談與原型工作呈現商業計畫之外的進展。規劃中的試點與已完成的交流分別列示。'),
('<p class="ent-caption">This is the functional system architecture, not the team workstream hierarchy.</p>','',''),
])
copy('sustainability',[
('SDGs do not operate independently on this project.\n              Select a marked cell (desktop) or a card (all sizes) to read the relationship.\n              Relationship detail text also appears in the panel below — readable without JavaScript.\n              Empty cells mean we are not inventing a link — not that the goals are unrelated in the world.','Select a marked relationship to examine a synergy, trade-off or unresolved question. Blank cells indicate that this project has not established a relationship.','選取已標記的關係，查看協同效益、取捨或尚未解決的問題。空白格表示本專題尚未建立該項關係。'),
('The plan below follows the Sustainability source while retaining the later hardware and survey corrections. ','',''),
('Before claiming we reduce other people’s waste, we account for what AeroSense itself consumes.','This inventory defines AeroSense’s resource use and waste streams.','本盤查界定 AeroSense 的資源使用與廢棄物流。'),
('Where mass, energy, or hazard tallies do not exist, we write','Unmeasured quantities are marked','未量測的數值標為'),
('</span>, not zeros.','</span>.',''),
])
copy('safety-and-security',[
('This is the functional system architecture, not the team workstream hierarchy.\n              ','',''),
('The assessment is proportional: common laboratory chassis, insect olfactory receptor genes, VOC research stocks, and a reconfigurable sensing architecture in contained use — not a weaponization narrative.','The current assessment covers contained use of common laboratory chassis, insect olfactory receptors, VOC stocks and a reconfigurable sensing architecture.','目前評估涵蓋常用實驗室宿主、昆蟲嗅覺受體、VOC 儲備液及可重新配置感測架構的封閉使用。'),
('This section does not answer “yes,” does not claim an award, and does not replace the official judging form.','The links below connect each safety contribution to its documented controls, evidence and remaining limitations.','以下連結將各項安全貢獻對應至已記錄的控制措施、證據與剩餘限制。'),
])

common=ROOT/'locales/extras/zh-Hant/common.json'
catalog=json.loads(common.read_text(encoding='utf-8'))
catalog['Cited passages']='引用段落'
catalog['BDSC 5137 is a UAS-mCD8::GFP reporter stock, consistent with the team’s clarified 5137;TH (TH-GFP) recording. The full experimental cross remains to be documented.']='BDSC 5137 是 UAS-mCD8::GFP 報導品系，與團隊更正的 5137;TH（TH-GFP）影像相符。完整實驗交配紀錄仍待補充。'
common.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
search=ROOT/'locales/extras/zh-Hant/search.json'
catalog=json.loads(search.read_text(encoding='utf-8'))
catalog['The 5137;TH recording uses TH-GFP, a membrane label rather than a calcium reporter. The separate GH146 preparation uses UAS-GCaMP6f; PN imaging remains pending. Projection neurons relay olfactory input, while dopamine modulates the circuit.']='5137;TH 影像使用 TH-GFP 膜標記，不是鈣報導系統。另一項 GH146 製備使用 UAS-GCaMP6f，PN 成像仍待進行。投射神經元傳遞嗅覺輸入，多巴胺則參與迴路調節。'
catalog['The 20 April light-sheet recording used 5137;TH (TH-GFP). mCD8::GFP labels membranes; normalized fluorescence does not establish a calcium response. The full cross, acquisition controls and biological repeats remain to be documented.']='4 月 20 日的光片影像使用 5137;TH（TH-GFP）。mCD8::GFP 用於膜標記；正規化螢光不能證明鈣反應。完整交配、影像擷取對照及生物重複仍待記錄。'
search.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

(REPORT/'root-copy-changes.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Reviewed {len(changes)} copy changes')
