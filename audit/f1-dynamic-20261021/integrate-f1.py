from pathlib import Path
import csv, json, re, hashlib, difflib, sys
TARGETS=set(sys.argv[1:] or ['results.html','model.html','experiments.html'])

ROOT=Path(__file__).resolve().parents[3]
A=Path(__file__).resolve().parent
PKG=ROOT/'zenodo-release/aerosense-wiki/data/odor-f1-dynamic-20261021'
SOFT='https://gitlab.igem.org/2026/software/nthu/aerosense/-/tree/main/code/aerosense/wetlab/odor-f1-dynamic'
HEAT='https://static.igem.wiki/teams/6460/wiki/results/dynamic-and-door-heatmaps.svg'
SCAT='https://static.igem.wiki/teams/6460/wiki/results/dynamic-door-scatter.svg'
receipts=[]

def save(name,old,new):
    p=ROOT/'aerosense-wiki'/name
    assert p.read_text(encoding='utf-8')==old, 'Concurrent edit: '+name
    assert old!=new
    (A/(name+'.diff')).write_text(''.join(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile=name+' before',tofile=name+' after')),encoding='utf-8')
    p.write_text(new,encoding='utf-8')
    receipts.append({'path':'aerosense-wiki/'+name,'before_sha256':hashlib.sha256(old.encode()).hexdigest(),'after_sha256':hashlib.sha256(new.encode()).hexdigest()})

def protect_f1(html):
    return ''.join(piece if piece.startswith('<') else re.sub(r'\bF1\b', '<dfn title="Post-addition fluorescence acquisition">F1</dfn>', piece) for piece in re.split(r'(<[^>]+>)',html))

def insert_before_section(s,id,addition):
    addition=protect_f1(addition)
    m=re.search(r'<section\b[^>]*\bid="'+re.escape(id)+r'"[^>]*>',s)
    assert m,id
    return s[:m.start()]+addition+'\n'+s[m.start():]

def append_section(s,id,addition):
    addition=protect_f1(addition)
    m=re.search(r'<section\b[^>]*\bid="'+re.escape(id)+r'"[^>]*>',s);assert m,id
    # These prose sections have no nested sections.
    end=s.index('</section>',m.end())
    assert '<section' not in s[m.end():end],id
    return s[:end]+addition+s[end:]

new_results=f'''<section class="section-block" data-reveal="" id="f1-dynamic-door">
<h2 class="reading-heading--chapter">F1 dynamics and the DoOR reference</h2>
<p>A separate analysis of the retained F1 readings compares four odorant profiles across ten OR + ORCO conditions with the DoOR receptor database. The two views below place measured, vehicle-referenced fluorescence changes beside the receptor patterns used to inform our decoding work. The analysis uses the experimenter-confirmed channel labels and source-cell mapping in the F1 workbook; it reuses the Test 2 F1 records.</p>
<p><strong class="media-reference">Figure 15</strong> shows distinct profiles across the four odorants. Valeric acid has the largest positive contrast, +6.97 percentage points (pp) for the supplied Or22a channel, followed by +3.02 pp for Or67a and +2.98 pp for Or35a. Isopentyl acetate is highest for Or42a (+1.35 pp), while pentyl acetate is highest for Or67a (+1.74 pp). Values retain their signs and are shown on a common fluorescence scale.</p>
<figure class="wiki-figure" data-static-figure-number="15" id="fig-f1-door-heatmaps"><a href="{HEAT}"><img src="{HEAT}" alt="Four odorant profiles across ten receptors: F1 dynamic changes minus matched DMSO, alongside DoOR consensus minus receptor spontaneous firing rate" loading="lazy" decoding="async"/></a><figcaption><strong class="media-caption__label">Figure 15. </strong>F1-only odorant-minus-DMSO contrasts (top, pp) and DoOR consensus minus receptor-specific spontaneous firing rate, SFR (bottom, DoOR units). The scales differ between panels. Each experimental condition has one well; all ten tuning OR conditions coexpress ORCO. The grey cell is the missing Or42a–valeric acid DoOR value. The fluorescence contrast compares early and late three-reading means; <a href="experiments.html#exp-f1-dynamic">Experiments gives the calculation</a>. DoOR-derived material: <a href="https://doi.org/10.1038/srep21841">Münch and Galizia, 2016</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</figcaption></figure>
<p>The across-receptor comparisons show weak positive association with DoOR for 2-heptanone (Pearson r = +0.317; Spearman ρ = +0.406), isopentyl acetate (r = +0.325; ρ = +0.442) and valeric acid (r = +0.211; ρ = +0.283). Pentyl acetate is close to zero (r = −0.002; ρ = +0.006). Thus, the experimental profiles share part of the database ordering for three odorants, with agreement depending on the odorant.</p>
<figure class="wiki-figure" data-static-figure-number="16" id="fig-f1-door-scatter"><a href="{SCAT}"><img src="{SCAT}" alt="Per-odorant scatter plots comparing F1 dynamic contrasts with DoOR minus spontaneous firing rate, with Pearson and Spearman correlations" loading="lazy" decoding="async"/></a><figcaption><strong class="media-caption__label">Figure 16. </strong>Each point is one receptor–odorant pair. Correlations are calculated separately within each odorant: n = 10 receptors, except valeric acid (n = 9 because Or42a is missing from DoOR). ORCO-only and blank controls are retained in the analysis package and excluded from these tuning-OR correlations. Values use the supplied three-point-window calculation. DoOR-derived material: <a href="https://doi.org/10.1038/srep21841">Münch and Galizia, 2016</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</figcaption></figure>
</section>'''
discussion='''<p id="f1-dynamic-discussion">The F1-only comparison provides an exploratory connection between the cell measurements and the DoOR reference used in Model. Its metric is C = D<sub>odor</sub> − D<sub>DMSO</sub>, based on early and late F1 means; it is distinct from the F0-subtracted S values and VUAA1-referenced N ratios above. Positive C can represent a smaller decline than DMSO, rather than a rising trace. The experimenter confirmed matched DMSO fraction and addition volume, while gain consistency and addition-to-first-read delay remain unconfirmed. The experimenter-confirmed F1 channel map supersedes the earlier Test 2 receptor labels; the underlying fluorescence readings are unchanged.</p><p>The first three odorants show weak positive cross-platform agreement, while pentyl acetate does not. Leaving one receptor out gives Pearson ranges of +0.080 to +0.502, +0.198 to +0.488, +0.169 to +0.550 and −0.284 to +0.182, respectively. These ranges describe sensitivity to receptor selection, not confidence intervals. One well per condition, shared DMSO references and different measurement platforms limit transfer claims; timepoints do not increase biological n. This reanalysis does not provide an independent experimental validation, receptor-specific activation test or demonstrated fluorescence-to-odor classifier.</p>'''
if 'results.html' in TARGETS:
    p=ROOT/'aerosense-wiki/results.html';old=p.read_text(encoding='utf-8');assert 'id="f1-dynamic-door"' not in old
    s=old
    # Two main-text figures shift only the three following supplementary figure numbers.
    s=re.sub(r'data-static-figure-number="(15|16|17)"',lambda m:'data-static-figure-number="'+str(int(m[1])+2)+'"',s)
    s=re.sub(r'\bFigure (15|16|17)\b',lambda m:'Figure '+str(int(m[1])+2),s)
    s=insert_before_section(s,'limitations',new_results)
    s=append_section(s,'limitations',discussion)
    s=append_section(s,'conclusion','<p>The F1-only reanalysis adds odorant-dependent comparisons with DoOR: weak positive across-receptor associations for three odorants and near-zero association for pentyl acetate. The shared reference makes the measured profiles and their correspondence to the decoding database directly inspectable.</p>')
    s=append_section(s,'data-availability',f'<div id="f1-dynamic-files"><h3 class="reading-heading--topic">F1-only dynamic comparison</h3><p>The complete archive includes the 1,080-reading source workbook with cell references, all 72 dynamic summaries, 48 vehicle contrasts, DoOR provenance, missing-value records and leave-one-receptor-out checks. <a href="{SOFT}">Analysis code, validation code and reproduction guide — GitLab</a>. The complete data package is retained in the prepared research archive; public deposit status is described in the archive availability record. The existing reference-pattern backend Pearson function independently reproduced the four reported coefficients.</p></div>')
    needle='<li><a href="#kinetic-pilot">Odor testing</a></li>'
    assert s.count(needle)==2
    s=s.replace(needle,needle+'<li><a href="#f1-dynamic-door">F1 and DoOR</a></li>')
    save('results.html',old,s)

if 'model.html' in TARGETS:
    p=ROOT/'aerosense-wiki/model.html';old=p.read_text(encoding='utf-8');assert 'id="decoder-f1-followup"' not in old
    addition='''<div id="decoder-f1-followup"><h3 class="reading-heading--topic">F1 dynamics alongside the decoding reference</h3><p>The subsequent F1-only reanalysis compares four odorants with DoOR consensus minus receptor-specific spontaneous firing rate. Across tuning receptors, Pearson r / Spearman ρ are +0.317 / +0.406 for 2-heptanone, +0.325 / +0.442 for isopentyl acetate, +0.211 / +0.283 for valeric acid, and −0.002 / +0.006 for pentyl acetate. The comparison includes ten receptors per odorant, except the missing Or42a–valeric acid reference (n = 9). <a href="results.html#f1-dynamic-door">Results presents the two comparison figures</a>.</p><p>These profiles connect the wet-lab observations to the database used for decoding: three odorants share part of its receptor ordering, with a near-zero relationship for pentyl acetate. Reusing the existing reference-pattern backend’s Pearson calculation reproduced all four coefficients.</p></div>'''
    s=append_section(old,'decoder-v3-wet-comparison',addition)
    s=append_section(s,'decoder-v3-discussion','<p>The F1 comparison reuses Test 2 recordings under a separately defined, vehicle-referenced metric and the experimenter-confirmed channel map; it is not another independent experiment. Weak across-receptor correlations are evidence of partial profile correspondence, not decoder accuracy. The computational cross-check runs the existing Pearson function only. A PN–KC–MBON inference run would require a fitted input transformation and compatible trained checkpoint, which are not supplied with these fluorescence data.</p>')
    s=append_section(s,'decoder-v3-conclusion','<p>The F1 profiles provide a measured starting point for comparing the cell platform with the DoOR reference. Their odorant-dependent agreement motivates a future paired evaluation with fixed preprocessing and independently replicated cell measurements.</p>')
    save('model.html',old,s)

if 'experiments.html' in TARGETS:
    p=ROOT/'aerosense-wiki/experiments.html';old=p.read_text(encoding='utf-8');assert 'id="exp-f1-dynamic"' not in old
    method=f'''<div id="exp-f1-dynamic"><h3 class="reading-heading--topic">F1-only dynamic reanalysis</h3><p>The supplied F1 workbook retains 1,080 readings: six conditions × twelve channels × fifteen readings, at 12 s intervals from 0 to 168 s. For each well, E is the mean at 0, 12 and 24 s and L is the mean at 144, 156 and 168 s. D = L/E − 1; the vehicle-referenced contrast is C = D<sub>odor</sub> − D<sub>DMSO</sub> for the same channel. We report 100C in percentage points. F0 does not enter this calculation; VUAA1 remains a reference record and is not a denominator or exclusion criterion.</p><p>The delivered channel order is Or7a, Or19a, Or42a, Or98a, Or22a, Or67a, Or67b, Or59b, Or85b, Or35a, ORCO only and blank. Analysis follows the workbook’s channel labels and source-cell provenance. DMSO fraction and addition volume were matched as confirmed by the experimenter. Pearson and Spearman correlations are calculated separately for each odorant across the ten tuning ORs, using DoOR consensus minus each receptor’s spontaneous firing rate. The missing Or42a–valeric acid reference is omitted from that correlation only. Controls are retained separately, and all signed contrasts are preserved. <a href="{SOFT}">Reproduction and validation code</a> · <a href="results.html#f1-dynamic-door">Results</a>.</p></div>'''
    s=append_section(old,'exp-p2-kinetics',method);save('experiments.html',old,s)

# Supply exact additive Registry fragments. The main editor owns the current remote bodies.
pairs=list(csv.DictReader((PKG/'results/all_48_channel_pairs.csv').open()))
coord=json.loads((A/'coordination-from-editor.json').read_text(encoding='utf-8'))
items=[]
for entry in coord['current_registry_scope']:
    receptor=entry['title'].split(':')[0]
    channel='ORCO only' if receptor=='ORCO only' else receptor
    vals=[r for r in pairs if r['receptor']==channel]
    assert len(vals)==4,(channel,len(vals))
    values='; '.join(f"{r['odor']}: {float(r['corrected_percentage_points']):+.2f} pp" for r in vals)
    body=f'''\n\n### F1-only dynamic reanalysis\n\nA separate reanalysis of the retained F1 readings uses the supplied F1 workbook channel labels and source-cell map. For **{channel}**, the odorant-minus-DMSO contrasts are **{values}**. Each well is normalized to its first-three-reading mean; the contrast subtracts the matched channel’s DMSO late-to-early change from the odorant change (last-three mean / first-three mean − 1). This metric uses F1 only and is distinct from S and VUAA1-referenced N above; it does not replace those calculations or supply an independent biological replicate. VUAA1 is retained as reference data without division or threshold selection.\n\nOne well represents each condition. A positive contrast can reflect less decline than DMSO; it does not establish receptor-specific activation. The experimenter confirmed this F1 channel mapping; it supersedes the earlier Test 2 receptor labels, without changing the raw measurements. [Full F1/DoOR comparison and interpretation](https://2026.igem.wiki/nthu/results#f1-dynamic-door) · [Analysis and validation source]({SOFT}).\n'''
    items.append({**entry,'receptor':channel,'append_markdown':body})
collection='''\n\n### F1-only dynamics compared with DoOR\n\nThe retained Test 2 F1 records were reanalysed using each well’s first-three and last-three mean (0/12/24 s and 144/156/168 s). D = L/E − 1 and C = D_odor − D_DMSO for the same supplied channel; 100C is reported in percentage points. This F1-only metric is distinct from F0-subtracted S and VUAA1-referenced N, and is a reanalysis rather than an independent experiment. The supplied F1 workbook channel mapping and source-cell provenance are retained.\n\nDoOR consensus minus receptor-specific spontaneous firing rate was compared with C separately for each odorant. Pearson r / Spearman rho: 2-heptanone +0.317/+0.406; isopentyl acetate +0.325/+0.442; valeric acid +0.211/+0.283; pentyl acetate −0.002/+0.006. n=10 receptors except valeric acid (n=9; missing Or42a reference). ORCO-only and blank controls are not included in tuning-OR correlations. Thus three odorants show weak positive correspondence and pentyl acetate is near zero. One well per condition and a shared vehicle reference constrain interpretation; positive C can mean less decline than DMSO. No independent replicate, significance claim, receptor-specific activation, or trained odor-classifier validation is inferred.\n\n[Two comparison figures and full discussion](https://2026.igem.wiki/nthu/results#f1-dynamic-door). DoOR source: Münch & Galizia (2016), https://doi.org/10.1038/srep21841; DoOR.data revision 49fc21074e157327aa9aea12ba7a5024fb4b991d, CC BY-SA 4.0.\n'''
public=json.loads((ROOT/'aerosense-wiki/audit/engineering-model-user-revisions-20261021/registry-test2-recheck.json').read_text(encoding='utf-8'))
existing=public['fresh_public'][0]['entries'][0]
(A/'registry-f1-additions.json').write_text(json.dumps({'mode':'append to fresh latest body; do not replace S/N or other text','parts':items,'collection':{'collection_id':'40067138-a3dd-4e5b-b8a4-50b097ee0156','remote_entry_id':existing['remote_id'],'known_body_sha256':existing['body_sha256'],'edit_url':'https://registry.igem.org/collections/40067138-a3dd-4e5b-b8a4-50b097ee0156/documentation/'+existing['remote_id']+'/modify','append_markdown':collection}},ensure_ascii=False,indent=2),encoding='utf-8')
(A/'web-integration.json').write_text(json.dumps({'edited_files':receipts,'figures_added':2,'numbering':'New main figures15,16; former supplementary15–17 shifted to17–19 including textual references','registry':'Prepared 11 receptor-specific additions and collection addition for current editor; no competing remote writes','software_source_directory':'gitlab/aerosense-software/code/aerosense/wetlab/odor-f1-dynamic','status':'Ready for review', 'selected_pages':list(TARGETS)},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'edited':[r['path'] for r in receipts],'registry_fragments':len(items)+1,'figures':2},ensure_ascii=False))
