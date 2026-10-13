#!/usr/bin/env python3
"""Build both public receptor pages from the bilingual editorial source.

Run with Python 3 and beautifulsoup4. Figure generation is a separate data export.
"""
import html
import json
import re
from pathlib import Path
from receptor_figure_story import figure, build_schematics, FIGURES
from receptor_research_details import DETAILS, enrich_tables, render_details
from receptor_reader_support import add_reader_support, structure_key, export_reader_guide
from receptor_molecular_features import feature_flow

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'assets/receptor-engineering/content.json').read_text())

def esc(value):
    return html.escape(str(value), quote=True)

def prose(value):
    return re.sub(r'\[(\d+(?:, \d+)*)\]', lambda m: '<span class="re-citation">[' + ', '.join(f'<a href="#ref-{n}">{n}</a>' for n in m[1].split(', ')) + ']</span>', esc(value))

def build(lang):
    def t(en, zh): return en if lang == 'en' else zh
    def val(obj): return prose(obj[lang])
    def evidence(mount): return render_details(mount,lang,prose,figure)
    page = 'receptor-engineering.html' if lang == 'en' else 'receptor-engineering-zh.html'
    header = (ROOT / 'templates/header.html').read_text()
    header = header.replace('href="receptor-engineering.html"', f'href="{page}" aria-current="page"')
    footer = (ROOT / 'templates/footer.html').read_text()
    search = (ROOT / 'templates/receptor-search.html').read_text()
    cycles = DATA['cycles']
    language = '<nav class="re-language" aria-label="Language">' + ''.join(f'<a href="{name}" lang="{code}" data-re-language {"aria-current=\"page\"" if code == lang else ""}>{label}</a>' for code, name, label in [('en','receptor-engineering.html','English'),('zh','receptor-engineering-zh.html','繁體中文')]) + '</nav>'
    out = [f'''<!doctype html>
<html lang="{t('en','zh-Hant')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{val(DATA['title'])} · AeroSense · NTHU iGEM 2026</title>
<meta name="description" content="{esc(DATA['subtitle'][lang])}">
<link rel="alternate" hreflang="en" href="receptor-engineering.html"><link rel="alternate" hreflang="zh-Hant" href="receptor-engineering-zh.html">
<link rel="icon" href="logo/favicon.ico"><meta name="theme-color" content="#173e2b">
<link rel="stylesheet" href="css/styles.css"><link rel="stylesheet" href="css/navigation-type.css"><link rel="stylesheet" href="css/receptor-engineering.css">
<script src="js/main.js" defer></script><script src="js/navigation-type.js" defer></script><script src="js/search.js" defer></script><script src="js/receptor-engineering.js" defer></script>
</head><body class="page-receptor"><a class="skip-link" href="#main">{t('Skip to content','跳至內容')}</a>{header}{search}
<main id="main" class="receptor-page">
<div class="re-topline"><div class="re-breadcrumb">Dry Lab <span aria-hidden="true"> / </span> Receptor Engineering</div>{language}</div>
<section class="re-hero" aria-labelledby="re-title"><p class="re-kicker">AeroSense · {t('Computational receptor design','計算受體設計')}</p>
<h1 id="re-title">{val(DATA['title'])}</h1><p class="re-subtitle">{val(DATA['subtitle'])}</p>
{highlights(lang)}
<p class="re-intro">{val(DATA['intro'])}</p>
<div class="re-actions"><a href="#research-flow">{t('Follow the research flow','先看整體研究流程')} ↓</a><a href="#result-figures">{t('Browse the result figures','查看計算結果圖')} →</a></div></section>
<section class="re-flow" id="research-flow" aria-labelledby="flow-heading"><div class="re-flow-head"><p class="re-kicker">{t('Six engineering cycles + molecular-feature and species-transfer studies','六個工程循環＋分子特徵與跨物種轉移研究')}</p><h2 id="flow-heading">{t('Each result changes the next question.','每一輪結果，都改變下一個研究問題。')}</h2><p>{t('Select a step to see the evidence, learning and design change.','點選步驟，查看證據、學到的事與設計改變。')}</p></div>''']
    for track, heading in [('design',t('01–02 · Candidate design in Drosophila receptors','01–02｜果蠅受體：候選設計')),('mechanism',t('03–06 · Molecular access in the OR10 reference complex','03–06｜OR10 參考複合體：分子進出機制'))]:
        if track == 'mechanism':
            out.append(f'<p class="re-flow-bridge">{t("The unresolved structural question motivates a separate reference-system study; it does not establish transfer between species.","尚未解決的結構問題，促使我們另以參考系統研究機制；這不代表已建立跨物種轉移。")}</p>')
        out.append(f'<div class="re-flow-lane"><p class="re-lane-title">{heading}</p><div class="re-nodes {track}">')
        for i, c in enumerate(cycles,1):
            if c['track'] == track:
                out.append(f'<a class="re-node" href="#{c["id"]}"><span>{i:02}</span>{val(c["short"])}</a>')
        out.append('</div></div>')
        if track == 'design':
            out.append(feature_flow(lang))
            out.append(f'<a class="re-transfer-branch" href="#cross-species"><span class="re-kicker">{t("Parallel question · Cross-species transfer","延伸問題｜跨物種轉移")}</span><strong>{t("Fly data → Anopheles receptors → direct prediction & local-fragment matching","果蠅資料 → Anopheles 蚊子受體 → 直接預測與局部片段配對")}</strong><span>{t("Direct transfer failed; local matching yielded a weak, unconfirmed signal. Explore the evidence →","直接轉移尚未成功；局部配對有待確認的弱訊號。查看證據 →")}</span></a>')
    out.append('</section>')
    out.append('<div class="re-scope">')
    for i, s in enumerate(DATA['scope']):
        extra = ' <a href="https://www.rcsb.org/structure/8V00">8V00</a> · <a href="https://www.rcsb.org/structure/8V02">8V02</a>' if s.get('structural_reference') else ''
        out.append(f'<div><h3>{val(s["title"])}</h3><p>{val(s["text"])}{extra}</p></div>')
    result_count = sum(f['kind']=='result' for f in FIGURES.values()) + 2
    out.append('</div>')
    out.append(structure_key(lang, DATA['references']))
    out.append(f'<nav class="re-result-index" id="result-figures" aria-labelledby="result-heading"><p class="re-kicker">{t("Our computational results","本研究計算結果")}</p><h2 id="result-heading">{t("Read the evidence in the figures","從結果圖看研究證據")}</h2><p>{t(f"{result_count} figure groups show predictions, recorded trajectories, saved conformations and path scans. Select a result to read its interpretation within the research cycle.",f"{result_count} 組計算結果圖，呈現預測、實際軌跡、保存構型與路徑掃描。點選結果，即可連同該輪的研究解讀一起閱讀。")}</p><div class="re-result-links">')
    for name, en, zh in [('response-matrix','Response data','反應資料全貌'),('full-ablation','Complete model comparison','完整模型比較'),('cross-transfer','Cross-species prediction','跨物種反應預測'),('cross-fragments','Local sequence matching','局部序列片段配對'),('mutation-robustness','Mutation screening','突變篩選'),('holo-baseline','20 ns diagnostics','20 ns 診斷'),('apo-stability','Apo structural motion','Apo 結構運動'),('odor-response-scatter','Odorant comparison','氣味反應比較'),('entry-trajectories','Attempted pocket entry','嘗試進入口袋'),('gate70','70 ns and saved structures','70 ns 與保存構型'),('path-pulling','Pulling and longer waits','牽引與延長等待'),('path-repulsion-profile','Path obstructions','沿路碰撞位置')]:
        out.append(f'<a href="#fig-{name}">{t(en,zh)} <span aria-hidden="true">↗</span></a>')
    for name,en,zh in [('ir-comparison','Measured IR and molecular weight','實測 IR 與分子量'),('quantum-comparison','Quantum vibrations and EVA','量子振動與 EVA'),('quantum-common','Matched spectral comparison','相同氣味的頻譜比較'),('pom-comparison','OpenPOM prediction','OpenPOM 反應預測'),('feature-gains','Feature gains and uncertainty','特徵增益與不確定度')]:
        out.append(f'<a href="#fig-{name}">{t(en,zh)} <span aria-hidden="true">↗</span></a>')
    out.append(f'''</div></nav><div class="re-tools"><p>{t('Purpose and findings first; expand each cycle for its method.','先讀研究目的與發現，再展開各輪方法。')}</p><div><button type="button" data-re-expand="true">{t('Expand all methods','展開全部方法')}</button><button type="button" data-re-expand="false">{t('Collapse methods','收合方法')}</button></div></div>''')
    out.append('<nav class="re-chapter-links" aria-label="'+t('Research topics','研究主題')+'">')
    out.append('<a href="#structure-guide">'+t('8V00 / 8V02 explained','認識 8V00／8V02')+'</a>')
    for sec in DETAILS:
        out.append(f'<a href="#{sec["id"]}">{val(sec["title"])}</a>')
    out.append('</nav>')
    out.append(evidence('before-cycles'))
    for i,c in enumerate(cycles,1):
        track = t('Candidate design','候選設計') if c['track']=='design' else t('Molecular mechanism','分子機制')
        out.append(f'<article class="re-cycle" id="{c["id"]}" data-track="{c["track"]}" aria-labelledby="{c["id"]}-title"><div class="re-cycle-meta"><p class="re-kicker">Cycle {i:02} · {track}</p><span class="re-badge">{t("Computational evidence","計算證據")}</span></div><h2 id="{c["id"]}-title">{val(c["title"])}</h2><p class="re-question">{val(c["question"])}</p><dl class="re-elc">')
        for key,label in [('evidence',t('Evidence · What happened','證據｜觀察到什麼')),('learning',t('Learning · What it means','學習｜結果代表什麼')),('change',t('Change · What we do next','改變｜下一輪做什麼'))]:
            out.append(f'<div><dt>{label}</dt><dd>{val(c[key])}</dd></div>')
        out.append(f'</dl><details class="re-detail"><summary>{t("Explore Design → Build → Test → Learn → Redesign","展開設計 → 建構 → 測試 → 學習 → 再設計")}</summary><div class="re-stages">')
        for key,label in [('design',t('Design question','Design｜目的')),('build',t('Build the model','Build｜建構')),('test',t('Test & results','Test｜測試與結果')),('learn',t('Learn','Learn｜學習')),('redesign',t('Redesign','Redesign｜再設計'))]:
            out.append(f'<section class="re-stage"><h3>{label}</h3><p>{val(c[key])}</p></section>')
        out.append('</div></details>')
        out.append(evidence(c['id']+'-before'))
        extra_figures={1:['receptor-panel'],2:['mutation-robustness','mutation-contacts'],3:['reference-complex','apo-stability'],4:['entry-design','entry-trajectories'],5:['force-design','gate70','saved-conformations']}
        for name in extra_figures.get(i,[]):
            out.append(figure(name,lang))
        if c.get('figure') in ('prediction','ranking'):
            fig = c['figure']
            captions = {
                'prediction':t('Prediction for held-out receptors. R² rises with sequence information. The full feature set adds only 0.0031 over the ligand + sequence baseline (paired 95% interval −0.0316 to 0.0344). Values come from matched out-of-fold predictions on 2,640 receptor–odorant pairs; this is not a biological intervention result.','未見受體的反應預測：序列資訊提高 R²；全部特徵相對於配體＋序列僅增加 0.0031（配對 95% 區間 −0.0316 至 0.0344）。數值來自 2,640 組受體–氣味配對的一致折外預測，並非生物介入實驗結果。'),
                'ranking':t('Retrospective ranking of 29 odorants from one published calcium-response assay. Points show Spearman ρ; intervals are exploratory odor-bootstrap intervals and omit experimental measurement uncertainty. MD ensembles did not outperform static 8V00. The aromatic-ring-count comparison (ρ = 0.790) was an exploratory chemical baseline added after inspecting the panel.','同一公開鈣反應 assay 中 29 種氣味的回溯性排序。點為 Spearman ρ，橫線為探索性的氣味重抽樣區間，未涵蓋實驗測量誤差。MD 構型集合未優於靜態 8V00；芳香環數量（ρ＝0.790）是檢視氣味組合後追加的探索性化學基準。')}
            label=t('Prediction comparison','預測比較') if fig=='prediction' else t('Odor-response ranking','氣味反應排序')
            out.append(f'<figure class="re-figure" id="fig-{fig}"><div class="re-figure-head"><span class="re-figure-kind re-figure-kind--result">{t("Our computational results","本研究計算結果")}</span><h3>{label}</h3></div><button type="button" class="re-figure-open" data-re-zoom aria-label="{t("Enlarge figure","放大圖表")}"><img src="assets/receptor-engineering/{fig}-{lang}.svg" alt="{esc(captions[fig])}" width="900" height="380" loading="lazy"><span class="re-zoom-hint">{t("Enlarge ↗","點圖放大 ↗")}</span></button><figcaption>{captions[fig]}</figcaption><div class="re-figure-links"><a href="assets/receptor-engineering/{fig}-{lang}.svg" download>{t("Vector SVG","向量圖 SVG")} ↓</a></div></figure>')
            if fig == 'ranking':
                out.append(figure('odor-response-scatter',lang))
        if c.get('figure') == 'pathway':
            out.append(pathway(lang))
            out.append(figure('path-pulling',lang))
            out.append(figure('extended-wait',lang))
            out.append(figure('pathway-clashes',lang))
            out.append(figure('path-repulsion-profile',lang))
        if c.get('data'):
            out.append(f'<p class="re-data-link"><a href="assets/receptor-engineering/{c["data"]}" download>{t("Download plotted values (CSV)","下載圖表數據（CSV）")} ↓</a></p>')
        out.append(evidence(c['id']))
        out.append('</article>')
        out.append(evidence('after-'+c['id']))
    out.append(evidence('before-next'))
    n=DATA['next']
    out.append(f'<section class="re-next" id="next-design"><p class="re-kicker">{t("Next iteration · proposed","下一輪｜待測設計")}</p><h2>{val(n["title"])}</h2><p>{val(n["intro"])}</p><ul>'+''.join(f'<li>{val(x)}</li>' for x in n['items'])+f'</ul><p class="re-next-note">{val(n["note"])}</p></section>')
    out.append(figure('next-test',lang))
    out.append(f'<section class="re-refs" id="references"><h2>{t("References & data","參考文獻與數據")}</h2><p>{t("Author–year citations link to the full references below. Figure captions distinguish published data from this project’s calculations. Undated documentation is labeled n.d.","正文以作者與年份短引文連至下方完整書目；圖說分別標示公開資料來源與本研究計算。未標示出版日期的文件以 n.d.（無日期）註記。")}</p><ul class="re-bibliography">')
    for r in sorted(DATA['references'], key=lambda r:r['short'].casefold()):
        citation=esc(r['title'])
        if r.get('journal'):
            journal=esc(r['journal']);citation=citation.replace(journal+', ', '<em>'+journal+'</em>, ')
        out.append(f'<li id="ref-{r["id"]}"><span class="re-ref-label">{esc(r["short"])}</span>{citation} <a href="{esc(r["url"])}">{esc(r["url"])}</a></li>')
    out.append(f'</ul><p class="re-data-link"><a href="assets/receptor-engineering/prediction.csv">{t("Prediction comparison","預測比較")}</a> · <a href="assets/receptor-engineering/odor-ranking.csv">{t("Odor ranking","氣味排序")}</a> · <a href="assets/receptor-engineering/content.json">{t("Cycle content (EN / 繁體中文)","循環內容（英文／繁體中文）")}</a> · <a href="assets/receptor-engineering/research-details.json">{t("Full research details (EN / 繁體中文)","完整研究內容（英文／繁體中文）")}</a> · <a href="assets/receptor-engineering/reader-guide.json" download>{t("Terminology & references","名詞與書目")}</a></p></section>')
    out.append(f'''<p class="re-end">{t("Research synthesis","研究整理")} · {DATA["updated"]} · <a href="engineering.html">Engineering</a> · <a href="model.html">Dry Lab / Model</a></p></main>
<dialog class="re-lightbox" aria-labelledby="re-lightbox-title"><div class="re-lightbox-toolbar"><h2 id="re-lightbox-title">{t('Figure detail','圖表細節')}</h2><label>{t('Zoom','縮放')} <input id="re-zoom-scale" type="range" min="100" max="300" step="25" value="100"><output for="re-zoom-scale">100%</output></label><button type="button" data-re-close>{t('Close','關閉')} ×</button></div><div class="re-zoom-viewport"><img alt=""></div><p class="re-lightbox-caption"></p></dialog>
{footer}</body></html>''')
    (ROOT/page).write_text(add_reader_support('\n'.join(out),lang,DATA['references']))
    print(page)

def highlights(lang):
    """A concise opening summary, using plain language and explicit short definitions."""
    source=DATA['highlights']
    label='Read the evidence' if lang=='en' else '查看證據'
    out=[f'<section class="re-highlights" id="key-findings" aria-labelledby="key-findings-title" data-re-no-terms><h2 id="key-findings-title">{prose(source["title"][lang])}</h2>']
    if source.get('intro'):
        out.append(f'<p class="re-highlights-intro">{prose(source["intro"][lang])}</p>')
    out.append('<ul class="re-highlight-list">')
    for item in source['items']:
        out.append(f'<li><h3>{prose(item["title"][lang])}</h3><p>{prose(item["text"][lang])}</p><a href="#{item["anchor"]}" aria-label="{esc(label+": "+item["title"][lang])}">{label} <span aria-hidden="true">↗</span></a></li>')
    out.append(f'</ul><p class="re-highlights-note">{prose(source["note"][lang])}</p></section>')
    return '\n'.join(out)


def pathway(lang):
    def t(en,zh): return en if lang=='en' else zh
    panels = [
      (t('1 · Map empty space','1｜找幾何空隙'), t('Point probes suggest candidate corridors.','點探針指出候選走廊。'), '<circle cx="110" cy="80" r="6" fill="#087789"/><path d="M90 130 Q100 95 128 60 T125 15" fill="none" stroke="#087789" stroke-width="3" stroke-dasharray="5 5"/>'),
      (t('2 · Place the whole ligand','2｜放置完整分子'),t('Size and orientation expose clashes.','分子體積與朝向揭露碰撞。'),'<polygon points="113,54 134,67 134,93 113,106 92,93 92,67" fill="#f7bc56" stroke="#905723" stroke-width="3"/><path d="M134 67 L151 56" stroke="#905723" stroke-width="4"/><path d="M86 61 L101 76 M101 61 L86 76" stroke="#a63c40" stroke-width="4"/>'),
      (t('3 · Allow the environment to move','3｜讓環境參與運動'),t('Flexible pulling still did not establish an exit.','柔性牽引仍未建立出口。'),'<polygon points="110,62 128,73 128,95 110,106 92,95 92,73" fill="#f7bc56" stroke="#905723" stroke-width="3"/><path d="M92 73 L78 62" stroke="#905723" stroke-width="4"/><path d="M52 65 L38 65 M42 59 L36 65 L42 71 M174 89 L188 89 M182 83 L188 89 L182 95" fill="none" stroke="#087789" stroke-width="3"/>')]
    out='<figure class="re-figure"><div class="re-schematic">'
    for title,text,shape in panels:
        out+=f'<div><svg viewBox="0 0 240 160" role="img" aria-label="{esc(title)}"><path d="M0 0 H80 Q125 30 82 63 Q67 87 86 111 L95 160 H0 Z" fill="#b4cbb4"/><path d="M240 0 H161 Q129 40 166 63 Q193 90 155 119 L157 160 H240 Z" fill="#b4cbb4"/>{shape}<circle cx="184" cy="35" r="10" fill="#dac9a3"/><circle cx="198" cy="57" r="10" fill="#dac9a3"/></svg><h3>{title}</h3><p>{text}</p></div>'
    return out+'</div><figcaption>'+t('Conceptual illustration, not a molecular trajectory or a validated tunnel. Green shapes represent the receptor environment, tan circles nearby lipids, and the orange shape the odorant. Candidate geometry, steric feasibility and observed passage are separate tests.','概念示意，並非分子軌跡或已驗證通道。綠色代表受體環境，米色圓點為附近脂質，橘色為氣味分子。候選幾何、立體可行性與實際通行，必須分開檢驗。')+'</figcaption></figure>'

if __name__ == '__main__':
    enrich_tables()
    (ROOT/'assets/receptor-engineering/research-details.json').write_text(json.dumps(DETAILS,ensure_ascii=False,indent=2)+'\n')
    export_reader_guide(ROOT/'assets/receptor-engineering/reader-guide.json',DATA['references'])
    build_schematics()
    for language in ('en','zh'):
        build(language)
