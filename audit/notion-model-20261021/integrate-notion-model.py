"""Integrate captured public Notion records; never fetch or mutate Notion.

One-shot, targeted HTML transformation. Scientific input figures are immutable.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from html import escape
import hashlib
import json
import re

WORKSPACE = next(parent for parent in Path(__file__).resolve().parents if (parent / 'aerosense-wiki').is_dir() and (parent / 'zenodo-release').is_dir())
SITE = WORKSPACE / 'aerosense-wiki'
AUDIT = SITE / 'audit/notion-model-20261021'
CAPTURES = WORKSPACE / 'zenodo-release/aerosense-wiki/data/notion-model-2026-10-21/sources'
MODEL = SITE / 'model.html'
ENGINEERING = SITE / 'engineering.html'
blocks = json.loads((CAPTURES / 'model-blocks.json').read_text('utf-8'))['blocks']
media = json.loads((AUDIT / 'notion-figure-preservation.json').read_text('utf-8'))['figures']
assets = {row['label']: row for row in media}
official = {row['source_block_id']: row['official_url'] for row in json.loads((AUDIT / 'verified-notion-figures-mapping.json').read_text('utf-8'))['mapping']}
sha = lambda value: hashlib.sha256(value.encode('utf-8')).hexdigest()

def bounds(text, tag, identifier):
    start = re.search(r'<' + tag + r'\b[^>]*\bid="' + re.escape(identifier) + r'"[^>]*>', text)
    assert start, identifier
    depth = 0
    for match in re.finditer(r'</?' + tag + r'\b[^>]*>', text[start.start():]):
        depth += -1 if match.group().startswith('</') else 1
        if depth == 0:
            return start.start(), start.start() + match.end()
    raise AssertionError('Unclosed ' + identifier)

def replace_id(text, tag, identifier, content):
    a, b = bounds(text, tag, identifier)
    return text[:a] + content + text[b:]

def exact(text, tag, identifier):
    a, b = bounds(text, tag, identifier)
    return text[a:b]

def p(value):
    return '<p>' + value + '</p>\n'

def sec(identifier, title, body):
    return f'<section class="section-block model-v5" id="{identifier}"><h2 class="reading-heading--chapter">{title}</h2>\n{body}</section>\n'

def cite(identifier, label):
    return f'<a class="cite" href="#{identifier}">{label}</a>'

def figure(label, number, caption, identifier=None):
    row = assets[label]
    identifier = identifier or 'notion-' + label
    source = official[row['source_block_id']] if label != 'model-fly-anatomy' else 'https://static.igem.wiki/teams/6460/wiki/model/original-olfactory-pathway.avif'
    dimensions = (1942, 809) if label == 'model-fly-anatomy' else row['dimensions']
    return f'<figure class="revision-visual" data-static-figure-number="{number}" id="{identifier}"><img src="{source}" data-notion-source-block="{row["source_block_id"]}" alt="{escape(caption.split(". ")[0], quote=True)}" loading="lazy" decoding="async" width="{dimensions[0]}" height="{dimensions[1]}"/><figcaption><strong class="media-caption__label">Figure {number}. </strong>{caption}</figcaption></figure>\n'

def table(headers, rows, caption):
    head = ''.join('<th scope="col">' + escape(x) + '</th>' for x in headers)
    body = ''.join('<tr>' + ''.join('<td>' + x + '</td>' for x in row) + '</tr>' for row in rows)
    return f'<div class="table-scroll" role="region" aria-label="{escape(caption, quote=True)}" tabindex="0"><table><caption>{caption}</caption><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>\n'

def source_table(block_id, caption):
    block = next(x for x in blocks if x['id'] == block_id)
    tree = BeautifulSoup(block['html'], 'html.parser')
    rows = [[cell.get_text(' ', strip=True) for cell in row.find_all(['td', 'th'])] for row in tree.select('tr')]
    assert rows and len(rows) > 1, block_id
    return table(rows[0], [[escape(x) for x in row] for row in rows[1:]], caption)

model = MODEL.read_text('utf-8')
engineering = ENGINEERING.read_text('utf-8')
assert 'id="decoder-v3-datasets"' not in model, 'Already integrated; do not rerun over later editorial changes.'
protected = {
    'model_hardware': exact(model, 'div', 'model-hardware-simulations'),
    'model_receptors': exact(model, 'div', 'model-receptor-engineering'),
    'engineering_wet': exact(engineering, 'section', 'stream-wetlab'),
}
# Other Engineering tracks are preserved by replacing only the model element.
old_model = exact(model, 'div', 'model-odor-decoding')
old_group = exact(engineering, 'section', 'group-model')

intro = p('A pattern across receptors can distinguish odors even when no receptor is uniquely selective. The fly mushroom body suggests a compact computational strategy: expand an input into many sparsely active Kenyon cells (KCs), then learn the connections to mushroom-body output neurons (MBONs). Random projection-neuron (PN) convergence and APL-mediated inhibition motivate this design. ' + cite('ref-turner-2008', '[Turner]') + ' ' + cite('ref-caron-2013', '[Caron]') + ' ' + cite('ref-lin-2014', '[Lin]'))
intro += p('We implement this motif in Brian2 and ask two questions: can the network classify response patterns, and where does useful class information disappear? UCI-270 tests gas identity from metal-oxide sensor measurements; DoOR tests chemical-family prediction from published fly-receptor responses. Wet-lab measurements are examined separately from these benchmark inputs. ' + cite('ref-stimberg-2019', '[Brian2]') + ' ' + cite('ref-team-model-v3', '[Model record]'))
intro += figure('model-figure-1', '1', 'Network schematic from the model record. The reported experiments use PN, KC, APL, MBON, MBON inhibition and the training-only forced answer. The drawn ALLN and reward-prediction-error/DAN elements are not used in these experiments; the diagram is broader than the tested circuit.')
intro += figure('model-figure-2', '2', 'Two input domains share the PN–KC–MBON pipeline: UCI-270 provides 128 sensor features per measurement, while DoOR provides ten receptor values per odorant. The dashed cell-line input is a proposed transfer route, not an experimentally trained cell-based classifier.')

datasets = table(['Property', 'UCI-270', 'DoOR subset'], [
    ['Input', '16 metal-oxide sensors; eight features per sensor', 'Or7a, Or19a, Or22a, Or35a, Or42a, Or59b, Or67a, Or67b, Or85b and Or98a'],
    ['Samples', '13,910 measurements across ten batches and 36 months', '91 odorants measured on at least eight of the ten receptors'],
    ['Labels', 'Ethanol, ethylene, ammonia, acetaldehyde, acetone and toluene', 'Acids (15), alcohols (20), aromatics (15), esters (25), terpenes (16)'],
    ['Values', 'Resistance change, normalized change and six exponential-moving-average features per sensor', 'Unitless consensus receptor responses, 0–1; 13.4% missing cells'],
    ['Prediction question', 'Recognize a gas from repeated sensor measurements', 'Recognize a chemical family for a held-out odorant'],
], 'The two benchmark datasets and the distinct questions they answer.')
datasets += p('UCI-270 is the public Gas Sensor Array Drift at Different Concentrations dataset. DoOR combines published receptor recordings into a consensus matrix; the selected ten receptors correspond to the wet-lab panel. Missing DoOR values are filled with training-split medians. ' + cite('ref-uci-270', '[UCI-270]') + ' ' + cite('ref-vergara-2012', '[Vergara]') + ' ' + cite('ref-rodriguez-lujan-2014', '[Rodríguez-Luján]') + ' ' + cite('receptor-ref-6', '[DoOR]'))
datasets += figure('model-figure-3', '3', 'DoOR consensus responses for 91 odorants and ten receptors. Darker blue denotes stronger response; grey cells are missing published measurements. Acids and terpenes are weak across this panel, while alcohols, esters and aromatics recruit different overlapping receptors.')

encoding = p('For UCI, the 128 features are standardized and projected onto 20 principal components using training data only. Three components retain 75% of the reported variance and twenty retain 98%. For DoOR, ten standardized receptor values are reduced to six components, retaining 86%. PCA captures variance, which need not coincide with class separation. ' + cite('ref-jolliffe-2002', '[PCA]'))
encoding += figure('model-figure-4', '4', 'UCI-270 projected onto the first three principal components after standardization. Each panel highlights one gas; approximately 5% of extreme display positions are omitted for visibility. The display omission is not described as a training-data exclusion. The final panel shows explained variance.')
encoding += figure('model-figure-5', '5', 'DoOR odorants projected onto the first three principal components. Each panel highlights a chemical family. Acids and terpenes overlap in a weak-response region, while alcohols and esters are dispersed. The six retained components explain 86% of the reported variance.')
encoding += p('Each PCA axis selects one PN bin. UCI uses 20 training-data quantile bins per axis: 20 components × 20 bins produce 400 PNs, with 20 active per exposure. Values outside the training range enter the outermost bin. Quantile bins allocate resolution where samples are dense; they replace equal-width bins that leave much of the code unused. DoOR compares 20 equal-width bins per component (120 PNs) with five quantile bins (30 PNs). Bin boundaries are fitted to training data.')

network = p('The UCI network contains 400 PNs, 2,000 KCs, one APL neuron and six MBONs. Fixed random PN→KC connections have probability 0.0125, or about five inputs per KC, normalized to 800 nS total input. KCs excite APL, which inhibits KCs. Every KC projects to all MBONs; MBONs mutually inhibit one another. This is a biological abstraction, not a reconstruction of every fly connection. ' + cite('ref-babadi-2014', '[Expansion]') + ' ' + cite('ref-litwin-kumar-2017', '[Connectivity]'))
network += p('Conductance-based leaky integrate-and-fire neurons are integrated with forward Euler at 0.1 ms. A spike resets the membrane potential. Synaptic conductances decay exponentially and increase by the connection weight on each presynaptic spike:')
network += '<p class="audit-equation"><code>C dV/dt = g<sub>L</sub>(E<sub>L</sub> − V) + g<sub>AMPA</sub>(E<sub>AMPA</sub> − V) + g<sub>GABA</sub>(E<sub>GABA</sub> − V) + I<sub>input</sub><br/>dg<sub>x</sub>/dt = −g<sub>x</sub>/τ<sub>x</sub>; on a presynaptic spike, g<sub>x</sub> ← g<sub>x</sub> + w</code></p>'
network += p('KC thresholds rise with recent activity and recover during silence. The spike trace x increases by 0.1 per spike and decays over 10 ms:')
network += '<p class="audit-equation"><code>dV<sub>th</sub>/dt = ηx(t)(V<sub>max</sub> − V<sub>th</sub>) − κ(V<sub>th</sub> − V<sub>min</sub>) 𝟙[x(t) &lt; 10<sup>−6</sup>]</code></p>'
network += p('Only KC→MBON synapses learn. The model uses a pair-based potentiating rule: either spike order strengthens a synapse when KC and MBON spikes are close in time, with 5 ms traces. Each weight remains within 0–10 nS; each KC’s outgoing weights are normalized to a 10 nS total after every training exposure. A correct-class teacher drives its MBON during training. Testing switches off the teacher and freezes learning; the MBON with the most spikes supplies the answer. This potentiating rule is a modeling choice. ' + cite('ref-song-2000', '[STDP]') + ' ' + cite('ref-aso-2014', '[MBONs]') + ' ' + cite('ref-cassenaer-2012', '[Plasticity]'))
network += p('The complete settings and the DoOR differences are in <a href="#decoder-v3-parameters">Supplementary parameters</a>.')

evaluation = table(['Analysis', 'Training and held-out unit', 'Reported evaluation'], [
    ['UCI SNN learning curve', 'Gas-stratified random 80%/20% measurement split; up to 800 cycles, six sampled exposures per cycle', '1,800 test presentations (300 per gas), checked after every 100 cycles; one training run'],
    ['UCI representation probes', 'Linear SVM at each layer; repeated presentations of the same measurement stay together', 'The same five measurement-grouped folds over 1,799 recorded presentations of 1,322 measurements after 800 cycles'],
    ['DoOR comparison', 'The same stratified five odorant folds for the SNN and logistic-regression readouts', 'Each odorant belongs to one held-out fold; about 18 odorants per fold'],
], 'Evaluation units and splits. Repeated network presentations do not increase the number of independent measurements.')
evaluation += p('An exposure lasts 30 ms, followed by a 3 ms gap. Macro-F1 averages class-specific F1 scores, so each class contributes equally. The learning curve and representation probes answer different questions: probe classifiers are fitted within the recorded held-out representations. Their grouped folds prevent repeated copies of one measurement from crossing the probe training/test boundary.')

results = p('The single UCI run reaches macro-F1 0.80 after 100 cycles and a highest displayed value of 0.83 at 300 cycles. Performance then falls to 0.53 at 400 cycles and returns to 0.79 at 800. More training is therefore not monotonically better; 0.83 is the observed checkpoint maximum, not an independently replicated estimate.')
results += figure('model-figure-6', '6', 'UCI-270 macro-F1 on 1,800 test presentations at 100-cycle checkpoints in one run. The dashed 0.89 line is the linear SVM readout of KC spikes from the 800-cycle representation analysis; it is not a separately measured KC baseline at every checkpoint.')
results += p('The measurement-grouped probes score 0.97 on the standardized features, 0.96 after PCA, 0.92 on PN spike counts and 0.89 on KC spike counts. Both the MBON probe and the network’s most-active-MBON decision score 0.79. The largest adjacent drop in this analysis is KC→MBON (0.10), motivating a readout-focused redesign.')
results += figure('model-figure-7', '7', 'UCI layerwise readout after 800 training cycles. Five folds are grouped by measurement over 1,799 presentations from 1,322 measurements. Bars show mean macro-F1 and lines show source-reported fold spread. Blue denotes the network’s most-active-MBON answer.')

door = p('For the 91 DoOR odorants, logistic regression scores 0.69 on the ten receptor values and 0.71 on six PCA components. Twenty equal-width PN bins reduce the linear-readout score to 0.52; five quantile bins retain 0.66. The SNN scores 0.46 and 0.52 respectively, compared with 0.09 for always choosing the largest family.')
door += figure('model-figure-8', '8', 'DoOR chemical-family macro-F1 on the same five odorant folds. Blue bars compare SNN configurations; dark grey bars show logistic-regression readouts. Binning, PN→KC connectivity and training duration vary together. Bars are means and lines show source-reported fold spread.')
door += p('The coarser configuration uses five quantile bins and PN→KC probability 0.2 for 100 cycles; the equal-width configuration uses twenty bins and probability 0.05 for 200 cycles. Both provide about six PN inputs per KC. With roughly 73 training odorants per fold, coarse bins reduce fragmentation of this small dataset. A remaining gap between PN-code and SNN readouts identifies room for readout improvement.')

wet = p('The model record compares DoOR with the first four-acquisition wet-lab assay, <strong>Test 1</strong>. Its four retained odorants are 3-octanol, benzaldehyde, 2-heptanone and valeric acid. Each receptor–odorant condition has one well. This comparison is separate from Test 2’s within-stage drift subtraction and VUAA1-reference ratios in <a href="measurement.html#odor-complete-curves-method">Measurement</a> and <a href="results.html">Results</a>.')
wet += figure('model-figure-9', '9', 'Test 1 responses and DoOR reference patterns. Each point is one receptor; measured ΔF is the Test 1 peak-based corrected response fraction. The grey ±0.043 area is a source-reported reference band. Pearson r and p annotations are retained from the supplied analysis.')
wet += p('The source reports correlations from −0.63 to +0.17 across the four odorants, and pooled r = −0.18, p = 0.28 over 39 receptor–odorant pairs.')

discussion = p('The results support a focused computational conclusion: the UCI representation retains class information through KC activity, while the learned readout loses more. On DoOR, coarse encoding helps a small odorant dataset, but bin count, wiring probability and training duration change together. Controlled ablations are needed to isolate their contributions. The biology motivates the architecture; benchmark scores alone do not show that each circuit motif causes an improvement.')
discussion += p('The UCI split is random rather than day- or batch-held-out. Reusing its held-out set for checkpoints and parameter comparisons makes the best checkpoint exploratory. The DoOR folds are small, and their spread is not independent training-seed replication. For Figure 7, the source reports 1,799 rather than the planned 1,800 presentations; it does not document the omitted presentation. Neither benchmark measures food-safety classification or a trained fluorescence-to-odor system.')
discussion += p('The Test 1–DoOR comparison has one well per receptor–odorant condition and does not establish transfer to the cell platform. We propose three to five independent wells per condition, with controls and a prespecified analysis, for the next experiment. Its ±0.043 reference band has no supplied calculation or replicate sampling definition, so it is not a biological uncertainty interval. The source reports 39 pooled pairs but does not supply the complete paired vector or explain the missing fortieth pair; the correlation statistics are retained as reported. This comparison does not use Test 2’s S or VUAA1-normalized N. Likewise, fold-spread lines in the UCI and DoOR plots have no specified SD/SE or confidence-interval definition.')
discussion += p('The source describes an integer implementation, but this update supplies figures and methods rather than matching executable training code, fitted preprocessing, fold assignments, seeds or integer/float agreement tests. We therefore make no new device-speed, energy or integer-accuracy claim. The reader’s current <a href="hardware.html">reference-pattern backend</a> is distinct from a deployed PN–KC–MBON classifier. Earlier KT/UCI analyses, including their clock-error finding, remain in <a href="#decoder-earlier-study">the historical supplement</a>.')

main = '<div aria-labelledby="model-tab-decoding" class="model-track-panel" data-model-panel="decoding" id="model-odor-decoding">\n'
main += sec('odor-decoding-summary', 'From sensor patterns to receptor patterns', p('A fly-inspired spiking network reaches its highest observed UCI macro-F1 of 0.83 and ends at 0.79 in one training run. Layerwise probes locate the largest loss at the KC→MBON readout. On 91 DoOR odorants, a coarser quantile encoding with denser wiring raises SNN macro-F1 from 0.46 to 0.52. The analyses guide a readout redesign and define the measurements needed before transfer to the cell platform.'))
main += sec('decoder-v3-introduction', 'Introduction', intro)
main += sec('decoder-v3-datasets', 'Two datasets, two prediction tasks', datasets)
main += sec('decoder-v3-encoding', 'Standardization, PCA and population coding', encoding)
main += sec('decoder-v3-network', 'Network dynamics and learning', network)
main += sec('decoder-v3-evaluation', 'Training and evaluation', evaluation)
main += sec('decoder-v3-uci-results', 'UCI: training stability and the readout bottleneck', results)
main += sec('decoder-v3-door-results', 'DoOR: coarse coding for a small receptor dataset', door)
main += sec('decoder-v3-wet-comparison', 'First comparison with wet-lab measurements', wet)
main += sec('decoder-v3-discussion', 'Discussion', discussion)
main += sec('decoder-v3-conclusion', 'Conclusion', p('The next computational priority is the KC→MBON readout, evaluated with fixed comparison folds and independent training runs. For receptor data, input resolution must match the number of available odorants.'))
main += '</div>'
model = replace_id(model, 'div', 'model-odor-decoding', main)

# Preserve every earlier decoder figure and its interpretation in a collapsed record.
old_inner = old_model[old_model.index('>') + 1:old_model.rfind('</div>')]
for identifier in ['odor-decoding-summary', 'odor-decoding-introduction']:
    old_inner = old_inner.replace('id="' + identifier + '"', 'id="' + identifier + '-earlier"')
old_inner = re.sub(r'data-static-figure-number="(\d+)"', lambda m: 'data-static-figure-number="S' + m[1] + '"', old_inner)
old_inner = re.sub(r'\bFigure (\d+)\b', lambda m: 'Figure S' + m[1], old_inner)
old_inner = '<details class="supplementary-data__group" id="decoder-earlier-study"><summary>Earlier KT/UCI decoder analysis and figures S1–S17</summary><div class="supplementary-data__body">' + p('This retained analysis uses earlier datasets, settings and splits. Its KT five-gas scores, drift studies and precision audit are historical evidence, not results of the UCI/DoOR comparison above. Original figure destinations remain available.') + old_inner + '</div></details>'

params = p('These are the settings reported for the UCI analysis in the model source. They are simulation specifications, not values fitted to the AeroSense reader. Integer clipping described in the source is an implementation specification; device validation is not supplied.')
params += table(['Population', 'UCI setting'], [['PN', '400 (20 PCA components × 20 quantile bins)'], ['KC', '2,000'], ['APL', '1'], ['MBON / teacher', '6 / 6']], 'Network size reconstructed only from explicitly stated population counts.')
for bid, caption in [
    ('40025656-1ff8-81b6-94e3-fd10c757c5af', 'Neuron settings from the model record; units and bounds are preserved.'),
    ('40025656-1ff8-8142-be84-ef3f7bb39a50', 'KC intrinsic-plasticity settings.'),
    ('40025656-1ff8-81e0-b173-cd0db339c913', 'Connection weights and learning settings.'),
    ('40025656-1ff8-8106-8916-d9c9b4d8739d', 'Input and presentation schedule.'),
]: params += source_table(bid, caption)
params += p('DoOR changes: 1,000 KCs; six PCA components; APL→KC 30 nS; intrinsic-plasticity factor 2; learning step 0.025 nS; five MBONs and teachers; 50 test presentations per class. Twenty equal-width bins use PN→KC probability 0.05 and 200 training cycles. Five quantile bins use probability 0.2 and 100 cycles.')
params = '<details class="supplementary-data__group" id="decoder-v3-parameters"><summary>Current UCI and DoOR model parameters</summary><div class="supplementary-data__body">' + params + '</div></details>'
params += '<details class="supplementary-data__group" id="decoder-v3-biology"><summary>Biological pathway schematic</summary><div class="supplementary-data__body">' + figure('model-fly-anatomy', 'S21', 'Original conceptual pathway illustration produced with OpenAI image generation and reviewed by the team; it is not an anatomical reconstruction. Sensory neurons project to the antennal lobe; PNs reach the mushroom body and lateral horn. The modeled route follows PNs to KCs and MBONs; the lateral horn is not modeled. <a href="credits.html#responsible-ai">AI assistance and team review</a>.') + '</div></details>'

tree = BeautifulSoup(model, 'html.parser')
supp = tree.select_one('[data-model-supplement="decoding"]')
old_supp = str(supp)
# Find exact original outer element by a stable unique start attribute rather than reserialize the page.
start_match = re.search(r'<div\b[^>]*data-model-supplement="decoding"[^>]*>', model)
assert start_match
temp_id = 'notion-decoder-supplement-target'
model = model[:start_match.start()] + start_match.group()[:-1] + f' id="{temp_id}">' + model[start_match.end():]
original_supp = exact(model, 'div', temp_id)
supp_inner = original_supp[original_supp.index('>') + 1:original_supp.rfind('</div>')]
supp_inner = re.sub(r'data-static-figure-number="(\d+)"', lambda m: 'data-static-figure-number="S' + m[1] + '"', supp_inner)
supp_inner = re.sub(r'\bFigure (\d+)\b', lambda m: 'Figure S' + m[1], supp_inner)
history_methods = '<details class="supplementary-data__group" id="decoder-earlier-methods"><summary>Earlier KT/UCI methods, figures S18–S20 and reproducibility record</summary><div class="supplementary-data__body">' + p('The settings below belong to the earlier record. They do not replace the current 400-PN/2,000-KC UCI configuration or the DoOR settings above.') + supp_inner + '</div></details>'
model = replace_id(model, 'div', temp_id, '<div class="model-supplement-track" data-model-supplement="decoding">' + params + old_inner + history_methods + '</div>')

# Update the decoder availability statement while retaining all existing download destinations.
old_availability = 'The local manuscript documents the decoder figures, and UCI-270 supplies concentration and batch metadata. The four-feature NumPy MLP is a separate implementation. The released materials do not contain the matching PN–KC–MBON training engine, fitted preprocessing, fold tables or seeds; KT raw data are not redistributed because the full citation and redistribution permission were not supplied.'
new_availability = 'The editable <a href="https://gitlab.igem.org/2026/software/nthu/aerosense/-/blob/main/docs/aerosense/model/notion-decoder-update/model-source.md">model manuscript</a> preserves the current UCI/DoOR figures and settings; the <a href="https://gitlab.igem.org/2026/software/nthu/aerosense/-/blob/main/docs/aerosense/model/notion-decoder-update/engineering-source.md">engineering manuscript</a> records the three redesign cycles. UCI-270 and DoOR are public source datasets. The older manuscript and four-feature NumPy MLP linked below document separate historical work.'
assert old_availability in model
model = model.replace(old_availability, new_availability, 1)

# Keep established references and add a source record, then link current sections into the page TOC.
reference = '<li id="ref-team-model-v3"><span class="ref-authors">AeroSense modeling team.</span> <span class="ref-year">(2026).</span> <span class="ref-meta">AeroSense — Model (iGEM Wiki V3). Team-supplied analysis record. <a class="ref-source-control" href="https://jealous-ragdoll-815.notion.site/model-3-4d7256561ff8825e9d4b014705b2f0d7">Source ↗</a></span></li>'
ref_anchor = model.index('<li id="ref-turner-2008"')
model = model[:ref_anchor] + reference + model[ref_anchor:]
toc_marker = '<li><a href="#odor-decoding-summary">'
toc_pos = model.find(toc_marker)
assert toc_pos >= 0
new_toc = ''.join(f'<li><a href="#{identifier}">{label}</a></li>' for identifier, label in [
    ('decoder-v3-introduction', 'Introduction'), ('decoder-v3-datasets', 'Datasets'), ('decoder-v3-encoding', 'PCA and PN coding'), ('decoder-v3-network', 'Network and learning'), ('decoder-v3-evaluation', 'Evaluation'), ('decoder-v3-uci-results', 'UCI results'), ('decoder-v3-door-results', 'DoOR results'), ('decoder-v3-wet-comparison', 'Test 1 comparison'), ('decoder-v3-discussion', 'Discussion'), ('decoder-v3-conclusion', 'Conclusion'), ('decoder-v3-parameters', 'Parameters'), ('decoder-earlier-study', 'Earlier decoder record')])
model = re.sub(r'<li><a href="#odor-decoding-summary">Overview</a></li>.*?(?=<li><a href="#receptor-re-title">)', '<li><a href="#odor-decoding-summary">Overview</a></li>' + new_toc, model, flags=re.S)

def cycle(n, title, question, design, build, test, learn, improve, fig_label, caption):
    root = f'dl-v3-cycle-{n}'
    body = ''.join(f'<section class="eng-cycle__panel" data-eng-stage="{stage}" id="{root}-{stage}"><h5 class="eng-cycle__panel-title">{heading}</h5>{p(text)}</section>' for stage, heading, text in [('design','Design',design),('build','Build',build),('test','Test',test),('learn','Learn',learn),('redesign','Improve',improve)])
    fig = figure(fig_label, str(n), caption, 'engineering-model-v3-figure-'+str(n)).replace(f' data-static-figure-number="{n}"', '')
    return f'<article class="eng-cycle eng-cycle--dry" data-cycle-panel="{n}" data-eng-cycle="" data-eng-cycle-num="{n}" data-eng-track="drylab" id="{root}" role="tabpanel" aria-labelledby="{root}-tab"><header class="eng-cycle__head"><h4 class="eng-cycle__title reading-heading--detail"><span class="eng-cycle__num">Cycle {n}</span> {title}</h4></header><div class="eng-cycle-context"><p class="eng-cycle-context__question">{question}</p><p class="eng-cycle-context__status">Computational comparison</p></div><div class="eng-cycle__panels">{body}</div>{fig}</article>'

cycles = cycle(1, 'Put PN resolution where the data are', 'Can the network learn gas identity without losing it during encoding?',
    'We hypothesized that fixed sparse expansion followed by a learned readout could classify gas-response patterns, but first needed to check whether the PN representation retained the input information.',
    'We standardized the 128 UCI-270 features, fitted PCA on training data and converted each component to a PN-bin code. We compared equal-width and training-quantile bin edges.',
    'On the second principal component, three of twenty equal-width bins contained 90% of the training measurements and eight bins were empty. A linear SVM on the PN code scored macro-F1 0.77 with twenty equal-width bins, 0.93 with sixty-five equal-width bins and 0.98 with twenty quantile bins. This PN-code comparison uses five-fold cross-validation over 13,910 measurements; it is separate from the SNN learning-curve split.',
    'Uniform coverage of a wide numerical range wastes PN resolution on sparse tails. The encoding should follow sample density.',
    'We adopted quantile bins and exposed connection probability, APL inhibition, threshold adaptation, learning rate, weight cap and MBON inhibition as configurable settings. The reported SNN run peaks at 0.83, falls to 0.53 at cycle 400 and ends at 0.79; tuning did not remove training instability. See <a href="model.html#decoder-v3-uci-results">the full learning curve</a>.',
    'engineering-figure-1', 'Equal-width and quantile PN encoding on UCI-270. The two projections show 11,128 training measurements; the readout bars use all 13,910 measurements in five-fold cross-validation. Bars are means and lines are the source-reported fold spread. These are linear PN-code readouts, not SNN scores.')
cycles += cycle(2, 'Locate the loss before redesigning the network', 'After parameter tuning, which representation limits the final decision?',
    'We compared access to class information at every stage instead of diagnosing the model from its final score alone.',
    'For the 800-cycle UCI run, we reconstructed standardized features, PCA values and PN/KC/MBON spike counts for the recorded test presentations. Each representation received a linear-SVM probe. Repeated presentations of one measurement stayed in the same cross-validation fold.',
    'The shared five-fold comparison contains 1,799 presentations from 1,322 measurements. Macro-F1 progresses from 0.97 (features) to 0.96 (PCA), 0.92 (PN), 0.89 (KC) and 0.79 (MBON). The network’s most-active-MBON answer also scores 0.79.',
    'The largest adjacent loss is at the KC→MBON readout. The KC representation supports a stronger linear classifier than the trained network uses.',
    'We made layerwise probes part of the comparison protocol and identified the learned readout as the next redesign target. A future readout change should be evaluated on fixed folds and independent runs; this cycle does not claim that such a redesign has already succeeded.',
    'engineering-figure-2', 'UCI layerwise comparison, also shown in Model Figure 7. Five measurement-grouped folds cover 1,799 presentations from 1,322 measurements after 800 training cycles. Bars are means; lines show source-reported fold spread.')
cycles += cycle(3, 'Match coding resolution to receptor-data scale', 'Can the pipeline classify chemical families from the receptors used by AeroSense?',
    'We moved from repeated metal-oxide gas measurements to published DoOR responses for the ten fly receptors in our cell-line panel. This changes the prediction task to chemical-family classification of distinct odorants.',
    'We retained 91 odorants measured on at least eight receptors, imputed missing values within training folds, and compared the SNN with logistic-regression readouts on the same five stratified odorant folds.',
    'With twenty equal-width bins, the SNN scores 0.46 and a linear PN-code readout 0.52, compared with 0.69 from raw receptor values. Sixteen bins on the second component contain at most two odorants, while one contains 40. Five quantile bins increase the linear PN-code score to 0.66; the associated SNN configuration reaches 0.52.',
    'Fine bins fragment the small dataset. The SNN comparison also changes PN→KC probability from 0.05 to 0.2 and training duration from 200 to 100 cycles, so it does not isolate binning as the sole cause of improvement. The separate Test1 cell comparison does not yet establish agreement with DoOR.',
    'We adopted the coarser quantile configuration as the candidate and set a wet-lab target of three to five independent wells per odorant–receptor condition. Replicated cell acquisition and a prespecified transfer test remain future work; DoOR consensus values are not substituted for cell measurements.',
    'engineering-figure-3', 'DoOR encoding comparison for 91 odorants. Projections show chemical families; bars compare the PN-code logistic regression and SNN on five folds. The SNN configurations differ in binning, connection probability and training cycles. Fold spread is retained as supplied.')

tabs = ''.join(f'<button class="eng-cycle-tabs__btn{" is-active" if n==1 else ""}" data-cycle-tab="{n}" id="dl-v3-cycle-{n}-tab" role="tab" aria-controls="dl-v3-cycle-{n}" aria-selected="{"true" if n==1 else "false"}" tabindex="{0 if n==1 else -1}" type="button">Cycle {n}</button>' for n in range(1,4))
new_group = '<section aria-labelledby="eng-model-heading" class="eng-track eng-track--model" data-cycle-prefix="dl-v3-cycle" data-cycle-viewer="" data-eng-track="model" data-reading-mode="scroll" id="group-model"><header class="eng-track__head"><p class="eng-track__kicker">Dry Lab</p><h3 class="eng-track__title reading-heading--topic" id="eng-model-heading">Dry Lab · Odor decoding</h3><p class="eng-track__line">3 cycles · quantile coding → layerwise diagnosis → receptor-data transfer</p><p class="eng-track__now">Current state: computational comparisons identify the readout and data-collection priorities.</p></header><nav class="eng-cycle-tabs" role="tablist" aria-label="Model cycles">' + tabs + '</nav><div class="eng-cycle-stage">' + cycles + '</div><section class="eng-summary"><h4 class="reading-heading--detail">What changed</h4>' + p('We changed the PN code to follow training-data density, added measurement-grouped layerwise probes, and adapted the code to a small receptor dataset. The new evidence supports a specific next step—readout comparison and replicated biological input—not a completed cell-based odor classifier. <a href="model.html#decoder-v3-discussion">Methods, uncertainty and source availability</a>.') + '</section></section>'
old_group = old_group.replace('id="group-model"', 'id="group-model-earlier"').replace('id="eng-model-heading"', 'id="eng-model-heading-earlier"').replace('aria-labelledby="eng-model-heading"', 'aria-labelledby="eng-model-heading-earlier"')
legacy_group = '<details class="supplementary-data__group" id="decoder-earlier-engineering"><summary>Earlier preprocessing and precision-audit cycles</summary><div class="supplementary-data__body">' + p('This earlier record is retained for its data-cleaning, seed and clock-audit evidence. Its scores and fixed-seed candidates do not describe the newer UCI/DoOR configurations above.') + old_group + '</div></details>'
engineering = replace_id(engineering, 'section', 'group-model', new_group + legacy_group)
engineering = engineering.replace('Repeated runs exposed seed sensitivity and preprocessing errors. Across-seed reporting became the rule for comparing models.', 'Quantile coding improved input resolution; layerwise probes identified the readout loss; a receptor-data comparison set the next measurement target.', 1)
engineering = engineering.replace('Decoder audits exposed preprocessing and clock errors.', 'Decoder comparisons improved PN encoding and located the learned readout bottleneck.', 1)
card_start = engineering.index('<a class="eng-overview-card" data-eng-glance="model"')
card_end = engineering.index('</a>', card_start) + 4
engineering = engineering[:card_start] + engineering[card_start:card_end].replace('2 cycles', '3 cycles') + engineering[card_end:]

assert exact(model,'div','model-hardware-simulations') == protected['model_hardware']
assert exact(model,'div','model-receptor-engineering') == protected['model_receptors']
assert exact(engineering,'section','stream-wetlab') == protected['engineering_wet']
old_images = [x.get('src') for x in BeautifulSoup(MODEL.read_text('utf-8'),'html.parser').select('img[src]')]
new_images = [x.get('src') for x in BeautifulSoup(model,'html.parser').select('img[src]')]
assert set(old_images) <= set(new_images)
for name,text in [('model',model),('engineering',engineering)]:
    dom=BeautifulSoup(text,'html.parser'); ids=[x['id'] for x in dom.select('[id]')]
    duplicates=sorted({i for i in ids if ids.count(i)>1})
    assert not duplicates,(name,duplicates)
    missing=sorted({a['href'][1:] for a in dom.select('a[href^="#"]') if a['href']!='#' and a['href'][1:] not in ids})
    assert not missing,(name,missing)
    assert 'ADD RESULT' not in dom.get_text() and 'UPDATE —' not in dom.get_text()

before={name:hashlib.sha256(path.read_bytes()).hexdigest() for name,path in [('model',MODEL),('engineering',ENGINEERING)]}
MODEL.write_text(model,'utf-8',newline='')
ENGINEERING.write_text(engineering,'utf-8',newline='')
receipt={'source_blocks':{'model':len(blocks),'engineering':len(json.loads((CAPTURES/'engineering-blocks.json').read_text('utf-8'))['blocks'])},'source_figure_references':len(media),'scientific_figure_payloads':len({x['sha256'] for x in media}),'before_sha256':before,'after_sha256':{'model':sha(model),'engineering':sha(engineering)},'protected_sections':{key:sha(value) for key,value in protected.items()},'all_previous_model_image_src_retained':True,'new_runtime_image_placeholders':0,'new_model_source_numbers_not_recalculated':True,'raw_scientific_data_changed':False,'unresolved':['Exact executable training engine, fitted preprocessing, folds, seeds and prediction tables were not supplied.','Test1 noise-guide calculation and reason for39 rather than40 receptor–odorant pairs are not supplied.','Figure 7 contains1799 recorded presentations; planned1800 and omitted-presentation reason unresolved.'],'changed_files':['model.html','engineering.html']}
(AUDIT/'content-integration-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps(receipt,ensure_ascii=False,indent=2))
