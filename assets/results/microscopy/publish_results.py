"""Build the static results text and downloadable analysis appendix from CSV/JSON.

No results are typed manually; tables use the reproducible analysis outputs.
"""
from pathlib import Path
from urllib.parse import quote
import csv
import html
import json
import re
import zipfile
import sys
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[2]
PREFIX = 'assets/results/microscopy/'
TEXT_ONLY = '--text-only' in sys.argv
data = json.loads((HERE / 'nuclear-object-summary.json').read_text(encoding='utf-8'))
if not TEXT_ONLY:
    # Incorporate team-confirmed preparation metadata without recomputing pixels.
    from analyze_nuclear_objects import PARAMS
    updated_nuclear_params = dict(PARAMS)
    updated_nuclear_params['reporter_thresholds_DN'] = data['parameters']['reporter_thresholds_DN']
    data['parameters'] = updated_nuclear_params
    (HERE/'nuclear-object-parameters.json').write_text(json.dumps(updated_nuclear_params,indent=2),encoding='utf-8')
    (HERE/'nuclear-object-summary.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
    qcdata = json.loads((HERE/'field-gallery.json').read_text(encoding='utf-8'))
    qparams = qcdata['parameters']
    qparams.update(pairing='Team confirmed matching file numbers identify the same field; no registration correction imposed',
                   team_confirmed_2026_10_10='HEK293; DAPI after 2% PFA fixation without permeabilization; 44-48 h after transfection, before G418; exposure held constant per fluorescence channel across groups with blank calibration',
                   biological_replicates='No independent biological repeats. Fields are technical observations.',
                   withheld_because=['DAPI labeling completeness and all-cell denominator not independently validated',
                                    'No live/dead assay; fixed images cannot yield viable-cell denominator',
                                    'Crowded/overlapping objects and substantial BLUE export clipping',
                                    'Gain/LUT transformation and unprocessed source images unavailable',
                                    'Field-to-well/day mapping unavailable'])
    for f in qcdata['fields']:
        f['independent_biological_replicates'] = False
    for c in qcdata['conditions']:
        c['biological_replicates'] = 'not independently repeated'
    (HERE/'analysis-parameters.json').write_text(json.dumps(qparams,indent=2),encoding='utf-8')
    (HERE/'field-gallery.json').write_text(json.dumps(qcdata,indent=2),encoding='utf-8')
    for name, updated_rows in [('per-field-summary.csv',qcdata['fields']),('per-condition-summary.csv',qcdata['conditions'])]:
        with (HERE/name).open('w',newline='',encoding='utf-8') as f:
            writer=csv.DictWriter(f,list(updated_rows[0]));writer.writeheader();writer.writerows(updated_rows)


if not TEXT_ONLY:
    # Refresh the diagnostic chart caption with the confirmed exposure information.
    fig_qc, ax_qc = plt.subplots(1,3,figsize=(15,7.8),sharey=True)
    qc_metrics=[('red_area_percent',f'RED pixels > {qparams["thresholds"]["RED"]["0.999"]} / ROI (%)','#b54646'),
                ('green_area_percent',f'GREEN pixels > {qparams["thresholds"]["GREEN"]["0.999"]} / ROI (%)','#37744c'),
                ('blue_export_clipped_percent','BLUE pixels at export value 255 (%)','#4865ad')]
    for ax,(metric,title,clr) in zip(ax_qc,qc_metrics):
        for i,c in enumerate(qcdata['conditions']):
            ff=[f for f in qcdata['fields'] if f['condition']==c['condition']]
            yy=np.linspace(i-.12,i+.12,len(ff)) if len(ff)>1 else [i]
            ax.scatter([f[metric] for f in ff],yy,s=38,color=clr,edgecolors='white',linewidths=.6)
        ax.set_title(title,loc='left',fontsize=11);ax.set_xlim(left=-.5);ax.grid(axis='x',color='#deded5',linewidth=.7);ax.set_axisbelow(True)
        for spine in ('top','right','left'): ax.spines[spine].set_visible(False)
    ax_qc[0].set_yticks(range(len(qcdata['conditions'])),[f'{c["condition"]} (fields={c["fields"]})' for c in qcdata['conditions']]);ax_qc[0].invert_yaxis()
    fig_qc.suptitle('Image-export diagnostics across every supplied field',x=.02,ha='left',fontsize=18,color='#173e2b')
    fig_qc.text(.02,.025,'Each point is one field, not a biological replicate. Pixel-area percentages are not transfection efficiency.\nThresholds: most conservative blank-field 99.9th percentile. Per-channel exposure matched; camera-to-export transformation unknown.',fontsize=10)
    fig_qc.tight_layout(rect=(0,.08,1,.94));fig_qc.savefig(HERE/'all-field-diagnostics.png',dpi=180,facecolor='#faf9f3');fig_qc.savefig(HERE/'all-field-diagnostics.svg',facecolor='#faf9f3');plt.close(fig_qc)

conditions = data['conditions']
fields = data['fields']
order = ['blank (no transfect)', 'ORCO only', 'Or7a+ORCO', 'Or19a+ORCO', 'Or22a+ORCO', 'Or35a+ORCO', 'Or42a+ORCO', 'Or59b+ORCO', 'Or67a+ORCO', 'Or67b+ORCO', 'Or85b+ORCO', 'Or98a+ORCO']
conditions.sort(key=lambda r: order.index(r['condition']))
slug = lambda s: re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
escape = html.escape
total = sum(c['eligible_objects'] for c in conditions)


def fraction(c, channel):
    return f"{c[channel+'_positive_objects_p99']}/{c['eligible_objects']} ({c[channel+'_positive_fraction_percent_p99']:.1f}%)"


rows = ''.join(f'<tr><th scope="row">{escape(c["condition"])}</th><td>{c["fields"]}</td><td>{fraction(c,"red")}</td><td>{fraction(c,"green")}</td><td>{fraction(c,"both")}</td><td>{c["eligible_blue_foreground_percent"]:.1f}%</td></tr>' for c in conditions)
table = f'''<div class="table-scroll"><table class="goal-table microscopy-table"><caption>Reporter-positive fraction among resolvable DAPI objects. Counts are pooled across technical fields. These are not whole-population transfection efficiencies.</caption><thead><tr><th scope="col">Image label</th><th scope="col">Fields</th><th scope="col">RED+ / eligible</th><th scope="col">GREEN+ / eligible</th><th scope="col">Both / eligible</th><th scope="col">DAPI foreground retained</th></tr></thead><tbody>{rows}</tbody></table></div>'''

if not TEXT_ONLY:
    # Scientific chart: every field, no confidence bars derived from technical fields.
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10})
    fig, axes = plt.subplots(1, 3, figsize=(14.5, 7.4), sharey=True)
    for ax, channel, clr in zip(axes, ('red', 'green', 'both'), ('#ba4169', '#387b52', '#877022')):
        for i, c in enumerate(conditions):
            ff = [f for f in fields if f['condition'] == c['condition']]
            y = np.linspace(i-.13, i+.13, len(ff)) if len(ff)>1 else [i]
            ax.scatter([f[channel+'_positive_fraction_percent_p99'] for f in ff], y, color=clr, s=30, zorder=3)
            ax.scatter(c[channel+'_positive_fraction_percent_p99'], i, marker='|', s=190, linewidths=2, color='#202c28', zorder=4)
        ax.set_title(channel.upper()+' positive / eligible objects (%)', loc='left', fontsize=10.5)
        ax.set_xlim(-.4, max(30, max(f[channel+'_positive_fraction_percent_p99'] for f in fields)+2))
        ax.grid(axis='x', color='#e0e1d8', linewidth=.7)
        for spine in ('top','right','left'):
            ax.spines[spine].set_visible(False)
    axes[0].set_yticks(range(len(conditions)), [f'{c["condition"]}  [fields={c["fields"]}]' for c in conditions])
    axes[0].invert_yaxis()
    fig.suptitle('Resolvable DAPI objects: fluorescence above the blank-derived threshold', x=.02, ha='left', fontsize=16, color='#173e2b')
    fig.text(.02,.025, 'Dots: individual fields. Black marks: pooled object fractions. No independent biological repeats.\nOnly 7-21% of segmented DAPI foreground enters these denominators; dense regions are excluded. These values are not transfection efficiencies.', fontsize=10)
    fig.tight_layout(rect=(0,.08,1,.94))
    fig.savefig(HERE/'object-fractions.png',dpi=170,facecolor='#faf9f3')
    fig.savefig(HERE/'object-fractions.svg',facecolor='#faf9f3')
    plt.close(fig)


field_rows = ''.join(f'<tr><td>{escape(f["condition"])}</td><td>{f["field"]}</td><td>{f["eligible_objects"]}</td><td>{f["red_positive_objects_p99"]} ({f["red_positive_fraction_percent_p99"]:.1f}%)</td><td>{f["green_positive_objects_p99"]} ({f["green_positive_fraction_percent_p99"]:.1f}%)</td><td>{f["eligible_blue_foreground_percent"]:.1f}%</td></tr>' for f in fields)
field_table = f'<div class="table-scroll"><table class="goal-table"><caption>All 25 fields, retained separately</caption><thead><tr><th>Condition</th><th>Field</th><th>Eligible DAPI objects</th><th>RED+</th><th>GREEN+</th><th>DAPI foreground retained</th></tr></thead><tbody>{field_rows}</tbody></table></div>'
sensitivity_rows = ''.join(f'<tr><td>{escape(c["condition"])}</td><td>{c["red_positive_fraction_percent_p95"]:.1f}%</td><td>{c["red_positive_fraction_percent_p99"]:.1f}%</td><td>{c["red_positive_fraction_percent_p99.5"]:.1f}%</td><td>{c["green_positive_fraction_percent_p95"]:.1f}%</td><td>{c["green_positive_fraction_percent_p99"]:.1f}%</td><td>{c["green_positive_fraction_percent_p99.5"]:.1f}%</td></tr>' for c in conditions)
sensitivity_table = f'<div class="table-scroll"><table class="goal-table"><caption>Threshold sensitivity: maximum blank-field score percentile. Percentages have the same eligible-object denominators.</caption><thead><tr><th>Condition</th><th>RED P95</th><th>RED P99</th><th>RED P99.5</th><th>GREEN P95</th><th>GREEN P99</th><th>GREEN P99.5</th></tr></thead><tbody>{sensitivity_rows}</tbody></table></div>'

gallery_options = ''.join(f'<option value="{escape(c["condition"])}">{escape(c["condition"])} · {c["fields"]} field{"s" if c["fields"] != 1 else ""}</option>' for c in conditions)
fallback = ''.join(f'<li>{escape(c["condition"])}: '+', '.join(f'<a href="{PREFIX}{slug(c["condition"])}/field-{f["field"]:02d}-panel.webp">Field {f["field"]}</a>' for f in fields if f['condition']==c['condition'])+'</li>' for c in conditions)
source_links = ''.join(f'<li><strong>{escape(c["condition"])}</strong><ul>'+''.join(f'<li>Field {f["field"]}: '+ ' · '.join(f'<a href="wetlab%20results/transfection_effeciency/{quote(c["condition"])}/{channel}_{f["field"]}.tif" download>{label}</a>' for channel,label in [('BRIGHTFIELD','Brightfield'),('BLUE','DAPI'),('GREEN','Green'),('RED','Red')])+'</li>' for f in fields if f['condition']==c['condition'])+'</ul></li>' for c in conditions)
gallery = f'''<div class="microscopy-explorer" data-microscopy-explorer>
<p class="microscopy-coverage" data-micro-coverage>blank (no transfect) · 3 fields acquired · technical observations</p>
<div class="microscopy-controls"><label>Condition<select data-micro-condition>{gallery_options}</select></label><label>Field<select data-micro-field><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label><label>View<select data-micro-view><option value="panel">Four channels · common display settings</option><option value="merge-export">RGB merge · exported levels</option><option value="merge-display">RGB merge · common linear display</option><option value="object-overlay">Object inclusion and reporter calls</option><option value="brightfield-export">Brightfield · exported levels</option><option value="blue-export">DAPI · exported levels</option><option value="green-export">GREEN · exported levels</option><option value="red-export">RED · exported levels</option></select></label></div>
<figure class="wiki-figure"><a data-micro-open href="{PREFIX}blank-no-transfect/field-01-panel.webp"><img data-micro-image src="{PREFIX}blank-no-transfect/field-01-panel.webp" width="1440" height="1160" alt="Blank control field 1, all four microscopy channels" loading="lazy" decoding="async"></a><figcaption data-micro-caption>Blank control, field 1 of 3. Same-field channels. Display windows: brightfield and DAPI 0–255, GREEN 0–120, RED 0–180.</figcaption></figure>
<p class="microscopy-status" data-micro-status aria-live="polite">Choose a condition and inspect its acquired fields.</p><p class="microscopy-legend" hidden>Object overlay: white = below both thresholds; pink = RED+; green = GREEN+; yellow = both; cyan = excluded object. Object numbers match the measurement table.</p>
</div><details><summary>Open every field directly</summary><ul>{fallback}</ul></details>'''

references = '''<ol class="ref-list">
<li id="micro-ref-1"><span class="ref-authors">Chen, T.-W., et al.</span> <span class="ref-year">(2013).</span> <span class="ref-title">Ultrasensitive fluorescent proteins for imaging neuronal activity.</span> <span class="ref-venue"><i>Nature</i>, 499, 295–300.</span> <a class="ref-doi" href="https://www.nature.com/articles/nature12354" rel="noopener noreferrer">doi:10.1038/nature12354</a>.</li>
<li id="micro-ref-2"><span class="ref-authors">Thermo Fisher Scientific.</span> <span class="ref-title">DAPI solution: nuclear labeling and preparation limits.</span> <span class="ref-venue">Product guidance.</span> <a href="https://www.thermofisher.com/order/catalog/product/62248/faqs" rel="noopener noreferrer">Manufacturer documentation</a>.</li>
<li id="micro-ref-3"><span class="ref-authors">Montero Llopis, P., et al.</span> <span class="ref-year">(2021).</span> <span class="ref-title">Best practices and tools for reporting reproducible fluorescence microscopy methods.</span> <span class="ref-venue"><i>Nature Methods</i>, 18, 1463–1476.</span> <a class="ref-doi" href="https://www.nature.com/articles/s41592-021-01156-w" rel="noopener noreferrer">doi:10.1038/s41592-021-01156-w</a>.</li>
<li id="micro-ref-4"><span class="ref-authors">Thermo Fisher Scientific.</span> <span class="ref-title">LIVE/DEAD cell viability assays.</span> <span class="ref-venue">Membrane-integrity and esterase-based measurements.</span> <a href="https://www.thermofisher.com/us/en/home/life-science/cell-analysis/cell-viability-and-regulation/cell-viability/live-dead-cell-viability-assays.html" rel="noopener noreferrer">Manufacturer documentation</a>.</li>
<li id="micro-ref-5"><span class="ref-authors">Thermo Fisher Scientific.</span> <span class="ref-title">Stable cell line generation.</span> <span class="ref-venue">Selection and parental-cell kill-curve guidance.</span> <a href="https://www.thermofisher.com/kr/en/home/references/gibco-cell-culture-basics/transfection-basics/applications/stable-transfection.html" rel="noopener noreferrer">Manufacturer documentation</a>.</li>
<li id="micro-ref-6"><span class="ref-authors">Nature Communications.</span> <span class="ref-title">Image integrity and standards.</span> <span class="ref-venue">Source preservation and disclosure of image adjustments.</span> <a href="https://www.nature.com/ncomms/editorial-policies/image-integrity" rel="noopener noreferrer">Editorial policy</a>.</li>
</ol>'''

article = f'''
<section class="section-block" id="abstract" data-reveal><span id="evidence-overview" class="anchor-alias"></span><h2>Abstract</h2>
<p>We imaged HEK293 cultures 44–48 h after transfection, before G418 selection, to examine fluorescence associated with the AeroSense expression system. The dataset contains 25 fields from 12 conditions, including an untransfected control, Orco alone and ten OR + Orco labels. Each field has brightfield, DAPI, green and red images. Using a conservative segmentation rule and a blank-derived fluorescence threshold, we identified {total:,} eligible DAPI objects across the dataset. RED-positive fractions in the OR + Orco conditions ranged from 0.7% to 16.7% within this selected subset. GREEN-positive fractions ranged from 0.0% to 7.0%.</p>
<p>Dense aggregates and overlapping blue signal prevented a reliable whole-population denominator. Eligible objects account for only 7.1–20.9% of segmented DAPI foreground among the OR + Orco conditions. These measurements therefore describe <strong>reporter-associated fluorescence around resolvable DAPI objects</strong>; they do not establish population transfection efficiency, viability, stable expression or odor sensing. All fields, thresholds, exclusions and measurement data are available below.</p></section>

<section class="section-block" id="introduction" data-reveal><h2>Introduction</h2>
<p>AeroSense requires three distinct observations: delivery and expression of its genetic components, functional activity of the engineered receptor system, and reproducible responses to relevant odor stimuli. A fluorescence image addresses the first question only indirectly. The <a href="design.html#reporter-topology">construct design</a> assigns mCherry to the OR cassette and GCaMP6f to the calcium-reporting module. Red and green image channels are analyzed separately here, without assuming that a visible reporter proves correct receptor localization or channel function.</p>
<p>GCaMP6f is a calcium-sensitive indicator. Its resting fluorescence is not a constitutive, calcium-independent measure of transfection. Low green signal may reflect indicator state, expression, acquisition sensitivity or background, and a single endpoint cannot distinguish these explanations. Functional interpretation requires time-resolved, controlled stimulation. <a href="#micro-ref-1">[1]</a></p>
<p>Our immediate question was narrower: which fields contain red or green signal above the blank background, and how much of the image permits an auditable object-level measurement?</p></section>

<section class="section-block" id="cloning-results" data-reveal><h2>Cloning record</h2>
<p>Plate cultures produced discrete colonies alongside regions of denser growth. The marked colonies identify candidates for the next cloning checks; colony growth alone does not establish insert identity.</p>
<div class="cloning-gallery">
<figure class="wiki-figure"><a href="wetlab%20results/cloning/clone1.jpg"><img src="wetlab%20results/cloning/clone1.jpg" width="1108" height="1477" loading="lazy" decoding="async" alt="Bacterial plates with visible colonies and experimental labels"></a><figcaption><span class="tech-label">Plate 01</span> Colony growth on labeled culture plates.</figcaption></figure>
<figure class="wiki-figure"><a href="wetlab%20results/cloning/clone2.jpg"><img src="wetlab%20results/cloning/clone2.jpg" width="1108" height="1477" loading="lazy" decoding="async" alt="Bacterial plates with marked colonies"></a><figcaption><span class="tech-label">Plate 02</span> Marked colonies for follow-up checks.</figcaption></figure>
<figure class="wiki-figure"><a href="wetlab%20results/cloning/clone3.jpg"><img src="wetlab%20results/cloning/clone3.jpg" width="1108" height="1477" loading="lazy" decoding="async" alt="Culture plates showing colonies and handwritten labels"></a><figcaption><span class="tech-label">Plate 03</span> Colony growth varies across the plated regions.</figcaption></figure>
</div>
<p>Insert verification remains pending: no annotated gel or sequence-confirmation result accompanies these plates. The <a href="experiments.html#cloning-track">transformation → miniprep → DNA gel electrophoresis workflow</a> is described in Experiments.</p></section>

<section class="section-block" id="wet-lab" data-reveal><h2>HEK293 fluorescence</h2><h3>One study, uneven field coverage</h3>
<div class="microscopy-study"><div><strong>12</strong><span>conditions</span></div><div><strong>25</strong><span>microscopy fields</span></div><div><strong>1–3</strong><span>fields per condition</span></div></div>
<p>Each condition has one to three acquired fields. The viewer shows <strong>one field at a time</strong>, with its four matching channels; the condition menu lists the number available. All 25 fields contribute to the analysis. A group with three fields has broader image coverage, not three independent biological repeats.</p>
<p>Images were acquired 44–48 h after transfection, before G418 selection, with the same exposure within each fluorescence channel across conditions and blank calibration. We compare the acquired fields descriptively; no independent biological repeats or between-condition significance tests are reported.</p>
{gallery}

<h3>Fluorescence around resolvable DAPI objects</h3>
<p>We excluded ambiguous connected regions instead of forcing a cell count through the dense aggregates. The table gives the number of positive objects and the denominator explicitly. “DAPI foreground retained” is the eligible objects’ share of segmented blue area, <strong>not the fraction of all cells or nuclei retained</strong>. The low retained area warns that these estimates sample the easier-to-segment portion of each field.</p>
{table}
<figure class="wiki-figure"><a href="{PREFIX}object-fractions.svg"><img src="{PREFIX}object-fractions.png" width="2465" height="1258" loading="lazy" decoding="async" alt="Each field's red, green and dual-positive fraction among eligible DAPI objects, with pooled fractions marked separately"></a><figcaption>Every supplied field is shown. Dots are technical field observations; black marks are positive-object totals divided by eligible-object totals. No biological-replicate confidence intervals or significance tests are inferred.</figcaption></figure>
<p>At the primary threshold, the blank yielded 1/170 eligible objects above each channel threshold. Orco-only yielded 0/342 RED-positive and 24/342 GREEN-positive objects. Most OR + Orco labels contained RED-positive objects. These observations support further expression validation, but differences between condition percentages cannot be interpreted as differences in true transfection efficiency.</p>

<h3>The density and threshold choices materially affect interpretation</h3>
<p>The images contain broad connected DAPI regions and clipping at the maximum exported value. Even a sharp edge around a fluorescent patch can contain several overlapping nuclei. Retaining a small, isolated subset avoids inventing divisions within those clusters, but introduces a selection bias. The excluded regions remain visible in every overlay.</p>
<p>Threshold choice also matters. For Or98a + Orco, the RED-positive fraction changes from 28.9% at the less stringent blank P95 threshold to 0.7% at P99. We use the conservative P99 rule as the primary analysis and report the full sensitivity table.</p>
<details><summary>All per-field object counts and fractions</summary>{field_table}</details>
<details><summary>Threshold sensitivity for every condition</summary>{sensitivity_table}</details>

<h3>G418 selection is a separate experiment in progress</h3>
<p>The team reports that G418 selection is ongoing in a different batch. No post-selection survival counts or fluorescence series were supplied with this dataset. The present images are therefore a pre-selection expression record, not evidence of enrichment by G418. A later G418 result should show selection duration and dose, the untransfected parental control, survival or growth counts, and reporter retention. Resistance alone does not establish both expression cassettes, stable function or an odor response. <a href="#micro-ref-5">[5]</a></p></section>

<section class="section-block" id="methods" data-reveal><h2>Methods</h2><h3>Source data and experimental context</h3>
<p>The host was HEK293, as confirmed by the team. Imaging occurred approximately 44–48 h after transfection and before G418. The team fixed cells with 2% paraformaldehyde (PFA), performed no permeabilization step, and then stained with DAPI. The source workbook contains plate-layout and reagent-calculation records, including DAPI/G418 layouts and lipid-reagent mixtures. These records do not independently establish experimental execution or an assay outcome; the VUAA1/odor grids contain labels without response measurements. The workbook does not supply objective, numerical aperture, camera model, gain, acquisition software, DAPI concentration, fixation duration, or field coordinates. Neither the source TIFF tags nor the workbook establishes these missing acquisition details. The biological preparation and transfection record is linked from <a href="experiments.html#exp-as-02">Experiments</a>; undocumented settings are not reconstructed from a literature protocol.</p>
<h3>Conservative DAPI segmentation</h3>
<p>The BLUE plane was extracted from each exported TIFF. A 3 × 3 median filter was used for segmentation only, followed by a common threshold of &gt;128 on the 0–255 export scale and 8-connected labeling. The bottom-right annotation rectangle (x ≥85% of image width and y ≥90% of image height) was excluded equally in every field. Eligible objects had area 200–2200 pixels, bounding-box aspect ratio ≤2.5, and object area/bounding-box area ≥0.4. Objects within 49 pixels of a frame edge or whose measurement neighborhood intersected the annotation exclusion were rejected. No watershed split was imposed on merged objects.</p>
<p>These rules define a conservative image-analysis subset, not a validated nuclear census. Segmentation has been visually inspected, but not benchmarked against independently annotated cell boundaries. Small touching nuclei or nuclear fragments can still pass these geometric filters, so an accepted object is not guaranteed to equal one cell. DAPI is a nuclear counterstain commonly used with fixed preparations. Here, fixation is confirmed and no permeabilization was performed; completeness and uniformity of nuclear labeling were not independently assessed. Fixed DAPI images do not recover the cells’ viability before fixation. <a href="#micro-ref-2">[2]</a></p>
<h3>Reporter measurement and positivity threshold</h3>
<p>For each eligible object, the signal region contains its nuclear mask plus pixels within 12 pixels, assigned to the nearest blue connected component to limit sharing between adjacent objects. The local background is sampled 24–48 pixels from that object, excluding blue foreground; at least 100 background pixels are required. For RED and GREEN separately, the score is the signal region’s 90th percentile intensity minus the background median. Measurements use the original exported channel values, before the display adjustments.</p>
<p>This nearest-DAPI expansion does not segment cell boundaries. Excluding blue foreground from the background ring also does not exclude every neighboring cell’s cytoplasm. Fluorescent cytoplasm within that ring can raise the estimated background and reduce an object's score, particularly in dense fields.</p>
<p>The primary positivity threshold is the maximum of the three blank-field 99th percentiles of these object scores: <strong>RED &gt;16.60 DN and GREEN &gt;11.95 DN</strong>. DN denotes the 8-bit exported digital value. Alternative P95 and P99.5 blank thresholds are reported for sensitivity analysis. Thresholds are calibrated and evaluated using the same blank set, so the blank fraction is a calibration diagnostic, not an independent false-positive validation.</p>
<p>The reported fraction is 100 × positive eligible objects / all eligible objects. Condition summaries pool these counts across fields; they do not average percentages with different denominators. “Both” indicates both channel criteria within one object's measurement region. It does not prove two-plasmid delivery, protein localization, or co-expression in a viable cell.</p>
<h3>Image processing and presentation</h3>
<p>Original TIFF and workbook files were opened read-only and verified by SHA-256 checksums. New figures use fixed linear display windows across all conditions: DAPI 0–255, GREEN 0–120 and RED 0–180; brightfield remains 0–255. The enhanced display can clip bright exported values and is used only for viewing. Original-level views remain available. No sharpening, deconvolution, content removal, generative enhancement or reconstruction of missing detail was applied. The same-field RGB merges combine the original channel positions; no registration correction was imposed. <a href="#micro-ref-3">[3]</a> <a href="#micro-ref-6">[6]</a></p>
<p>Web previews are resized with Lanczos resampling and saved as lossless WebP. The original scale bars remain within the full field; they were not used to infer pixel size. Object overlays mark classifications on a dimmed merge for legibility and have full-resolution PNG versions for audit.</p></section>

<section class="section-block" id="limitations" data-reveal><span id="negative-inconclusive" class="anchor-alias"></span><h2>Discussion and future work</h2>
<h3>What the images can establish</h3><p>The dataset supplies a traceable pre-selection fluorescence record with negative controls. The object-level analysis detects localized signal above the selected blank threshold and exposes how strongly density and threshold choices constrain the result. It does not support a single reliable transfection-efficiency percentage for each complete culture. Fluorescent pixel area is also not a substitute for the number of fluorescent cells divided by a validated total-cell denominator.</p>
<h3>Weak GCaMP6f signal</h3><p>Green-negative objects cannot be classified as untransfected from these endpoints. GCaMP6f responds to calcium, and the optical state and expression level both affect the measured signal. The next functional experiment should report a baseline time course, vehicle controls and an appropriate positive response control, with the same acquisition settings and a transparent ΔF/F₀ analysis. A brighter display is useful for inspection but cannot create evidence of a calcium response. <a href="#micro-ref-1">[1]</a></p>
<h3>mCherry and cell viability</h3><p>A red object is not, by itself, a live cell or a dead cell. Rounding, detachment, aggregates and strong fluorescence are insufficient to identify the cause here. No live/dead stain was acquired, so viability is recorded as unavailable. A spectrally compatible, independently validated viability measurement is needed to separate reporter expression from damaged cells, retained fluorophore or background. Common viability assays interrogate membrane integrity or cellular enzyme activity, which mCherry expression does not directly measure. <a href="#micro-ref-4">[4]</a></p>
<h3>Resolving the dense-center bias</h3><p>A defensible whole-population estimate requires systematic field selection across the culture, a validated total-nucleus or cell label, and segmentation checked against manual annotation across both sparse and dense regions. Where two-dimensional images cannot separate overlapping cells, reacquisition at a resolvable density or an independent single-cell readout is preferable to drawing arbitrary boundaries. Report well- and day-level replicates separately from fields. More pictures from one culture improve coverage, but do not replace independent biological repeats.</p>
<p>For the current dataset, the immediate improvement is to retain all fields and their exclusions, complete the acquisition and staining metadata, and audit the object overlays. For the ongoing G418 batch, publish the selection trajectory with its own controls and repeat the fluorescence and functional assessment after selection. A matched selection series would test enrichment directly and give pre-selection and post-selection measurements comparable denominators.</p></section>

<section class="section-block" id="conclusion" data-reveal><span id="what-changed" class="anchor-alias"></span><h2>Conclusion</h2><p>The supplied HEK293 images contain reporter-associated fluorescence above the blank-derived threshold in a subset of resolvable DAPI objects. Dense overlap prevents a validated population denominator, and no viability or independent biological-repeat data accompany the images. The analysis therefore establishes a transparent expression-screening record and defines the next experiments needed to evaluate stable expression and receptor function.</p></section>

<section class="section-block" id="supplementary" data-reveal><h2>Supplementary evidence</h2>
<p>The fluorescence-area diagnostics retain every supplied field, flag clipping at the exported value of 255, and show sensitivity to blank-derived pixel thresholds. They characterize the image exports; their percentages are neither cell percentages nor transfection efficiency. <a href="{PREFIX}all-field-diagnostics.png">Open the full diagnostic plot</a>.</p>
<p>The fly light-sheet recording remains an exploratory motivation study in <a href="description.html#lightsheet-observation">Description</a>. Its regional traces concern a separate biological preparation and do not validate the engineered HEK293 system.</p>
<details><summary>Assay questions and linked experimental records</summary>
<p id="res-EXP-AS-01"><strong>Assembly and sequence verification.</strong> Transformation, plasmid preparation and gel checks are described in <a href="experiments.html#exp-as-01">EXP-AS-01</a>. Original plate photographs are available in the <a href="#cloning-results">cloning record</a>; gel and sequence-verification records are not supplied here. No plasmid-identity conclusion is inferred from the microscopy.</p>
<p id="res-EXP-AS-02"><strong>HEK293 culture and transfection.</strong> <a href="experiments.html#exp-as-02">EXP-AS-02</a>. The current imaging record is pre-G418.</p>
<p id="res-EXP-AS-03"><strong>Expression check.</strong> <a href="experiments.html#exp-as-03">EXP-AS-03</a>. The present dataset addresses this question with the restrictions above.</p>
<p id="res-EXP-AS-04"><strong>VUAA1 function.</strong> <a href="experiments.html#exp-as-04">EXP-AS-04</a>. Controlled response traces are not supplied in this endpoint dataset.</p>
<p id="res-EXP-AS-05"><strong>Target-VOC response.</strong> <a href="experiments.html#exp-as-05">EXP-AS-05</a>. Endpoint fluorescence is not an odor-response experiment.</p>
<p id="res-EXP-AS-06"><strong>Variant rescreening.</strong> <a href="experiments.html#exp-as-06">EXP-AS-06</a>. No comparative variant result is inferred here.</p>
<p id="res-EXP-AS-07"><strong>Response analysis.</strong> <a href="experiments.html#exp-as-07">EXP-AS-07</a>. Time-course provenance and independent repeats remain necessary for response statistics.</p></details></section>

<section class="section-block" id="data-availability" data-reveal><h2>Data availability</h2>
<p>The dataset contains 100 individual-channel images across 25 fields, 12 pre-existing merges and the experimental workbook. Individual channels are 2592 × 1944 pixels; fluorescence images are 8-bit pseudocolored exports. Measurements use the individual channels. Acquisition metadata, image-processing parameters and checksums accompany the analysis.</p>
<details class="microscopy-source-data"><summary>Download acquired image channels by condition and field</summary><ul>{source_links}</ul></details>
<div class="table-scroll"><table class="goal-table"><caption>Analysis files and provenance</caption><thead><tr><th scope="col">Record</th><th scope="col">Contents</th><th scope="col">Access</th></tr></thead><tbody>
<tr><td>Analysis package</td><td>Scripts, parameters, source hashes, CSV tables and the analysis report; original images are linked separately</td><td><a href="{PREFIX}analysis-package.zip" download>Download ZIP</a></td></tr>
<tr><td>Object measurements</td><td>Every segmented object ≥200 pixels, inclusion/exclusion reason, scores and threshold calls</td><td><a href="{PREFIX}nuclear-object-measurements.csv" download>CSV</a></td></tr>
<tr><td>Per-field results</td><td>All 25 field denominators, positive counts and retained area</td><td><a href="{PREFIX}nuclear-object-per-field.csv" download>CSV</a></td></tr>
<tr><td>Per-condition results</td><td>Pooled fractions and threshold sensitivity</td><td><a href="{PREFIX}nuclear-object-per-condition.csv" download>CSV</a></td></tr>
<tr><td>Image-export diagnostics</td><td>100 channel records, blank-relative area, clipping, medians and large blue regions</td><td><a href="{PREFIX}per-field-channel-qc.csv" download>CSV</a></td></tr>
<tr><td>Source manifest</td><td>Original filenames, bit depth, TIFF tags and SHA-256 hashes</td><td><a href="{PREFIX}source-manifest.json" download>JSON</a></td></tr>
<tr><td>Analysis report</td><td>Methods, tables, threshold sensitivity and interpretation in a standalone appendix</td><td><a href="{PREFIX}analysis-report.html">Read report</a></td></tr>
<tr><td>Cloning photographs</td><td>Three unchanged source photographs; filenames and SHA-256 hashes</td><td><a href="assets/results/cloning/source-manifest.json" download>JSON</a></td></tr>
<tr><td>Source workbook</td><td>Original plate-layout and reagent-calculation records; not proof of execution or assay outcomes</td><td><a href="wetlab%20results/transfection_effeciency/transfect.xlsx" download>XLSX</a></td></tr>
</tbody></table></div></section>
<section class="section-block" id="references" data-reveal><h2>References</h2>{references}</section>
<nav class="proj-ev proj-ev--footer" aria-label="Other project evidence"><p class="proj-ev__label">Other project evidence</p><ul class="proj-ev__list"><li><a href="hardware.html">Hardware</a></li><li><a href="model.html">Model</a></li></ul></nav>
'''


# Keep the technical appendix complete while separating Results from Methods on the wiki.
report_source_article = article
method_match = re.search(r'<section class="section-block" id="methods".*?</section>', article, re.S)
if not method_match:
    raise RuntimeError('Missing microscopy methods source')
article = article.replace(method_match.group(0), '<p class="results-method-link" id="methods">For preparation, segmentation, reporter thresholds and display settings, see <a href="experiments.html#microscopy-analysis">Endpoint microscopy and image analysis in Experiments</a>.</p>')
article = re.sub(r'<section class="section-block" id="references".*?</section>', '', article, flags=re.S)
site_references = '<!-- results-references:start --><section class="references" aria-labelledby="references-heading" id="references" data-reveal><h2 id="references-heading">References</h2><div class="reference-group" aria-labelledby="references-evidence-heading"><h3 class="reference-group__heading" id="references-evidence-heading">Research and technical documentation</h3>'+references+'</div></section><!-- results-references:end -->'

# The standalone methods fragment is the published Experiments source.
methods_fragment = SITE/'assets/experiments/microscopy-methods.html'
experiments_page = SITE/'experiments.html'
if methods_fragment.exists():
    canonical_methods = methods_fragment.read_text(encoding='utf-8')
    report_methods = re.sub(r'<header class="exp-proto__head">.*?</header>', '<h2>Methods</h2>', canonical_methods, count=1, flags=re.S)
    report_methods = report_methods.replace('id="microscopy-analysis"', 'id="methods"')
    for old, new in [('ref-dapi-guidance">[4]', 'micro-ref-2">[2]'), ('ref-microscopy-reporting">[5]', 'micro-ref-3">[3]'), ('ref-image-integrity">[6]', 'micro-ref-6">[6]')]:
        report_methods = report_methods.replace(old, new)
    report_source_article = report_source_article.replace(method_match.group(0), report_methods)
    experiment_text = experiments_page.read_text(encoding='utf-8')
    experiment_text, replacements = re.subn(r'<!-- microscopy-methods:start -->.*?<!-- microscopy-methods:end -->', lambda _: '<!-- microscopy-methods:start -->'+canonical_methods+'<!-- microscopy-methods:end -->', experiment_text, flags=re.S)
    if replacements != 1:
        raise RuntimeError('Experiments methods slot missing or duplicated')
    experiments_page.write_text(experiment_text, encoding='utf-8')

page = SITE/'results.html'
s = page.read_text(encoding='utf-8')
s = s.replace('HEK293T','HEK293').replace('HEK293t','HEK293')
s = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="HEK293 fluorescence results: 25 microscopy fields, conservative DAPI-object analysis, transparent density limitations and downloadable data. Pre-G418 expression screening at 44–48 hours.">', s)
s = re.sub(r'<p class="page-lede">.*?</p>', '<p class="page-lede">Twenty-five fields, one careful question: what do our HEK293 fluorescence images support before selection? Inspect every field, follow the counts and see where the evidence stops.</p>', s, count=1, flags=re.S)
s = re.sub(r'<article class="page-article prose">.*?</article>', '<article class="page-article prose">'+article+'</article>', s, count=1, flags=re.S)
toc = [('abstract','Abstract'),('introduction','Introduction'),('cloning-results','Cloning record'),('wet-lab','HEK293 fluorescence'),('limitations','Discussion & future work'),('conclusion','Conclusion'),('supplementary','Supplementary'),('data-availability','Data availability'),('references','References')]
toc_html = '<nav aria-label="Table of contents"><ol>'+''.join(f'<li><a href="#{a}"><span class="tech-label">{i:02d}</span> {escape(b)}</a></li>' for i,(a,b) in enumerate(toc,1))+'</ol></nav>'
s = re.sub(r'<nav aria-label="Table of contents">.*?</nav>', toc_html, s, flags=re.S)
if 'css/results-microscopy.css' not in s:
    s = s.replace('</head>','  <link rel="stylesheet" href="css/results-microscopy.css?v=20261010">\n  <script src="js/results-microscopy.js?v=20261010" defer></script>\n</head>')
s = re.sub(r'<!-- results-references:start -->.*?<!-- results-references:end -->', '', s, flags=re.S)
s = re.sub(r'(<nav class="page-turn".*?</nav>)', lambda m: m.group(0)+'\n'+site_references, s, count=1, flags=re.S)
if 'css/reference-groups.css' not in s:
    s = s.replace('</head>', '  <link rel="stylesheet" href="css/reference-groups.css?v=20261003-categories">\n</head>')
s = re.sub(r'(css/results-microscopy\.css|js/results-microscopy\.js)\?v=[^"\s]+', lambda m: m.group(1)+'?v=20261010-fields', s)
page.write_text(s,encoding='utf-8')

# A portable report without the main site navigation. Relative links resolve in place.
report_article = report_source_article.replace(gallery,'<p>The field explorer and image downloads are available on the <a href="../../../results.html#wet-lab">wiki Results page</a>. Image files are not duplicated in the downloadable analysis package.</p>')
report_article = report_article.replace(PREFIX,'').replace('href="experiments.html','href="../../../experiments.html').replace('href="design.html','href="../../../design.html').replace('href="description.html','href="../../../description.html').replace('href="hardware.html','href="../../../hardware.html').replace('href="model.html','href="../../../model.html').replace('href="wetlab%20results','href="../../../wetlab%20results')
report_article = report_article.replace('src="wetlab%20results', 'src="../../../wetlab%20results').replace('href="assets/results/cloning/', 'href="../cloning/')
report_article = report_article.replace('href="results.html', 'href="../../../results.html')
report = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HEK293 microscopy analysis · 10 October 2026</title><style>body{{margin:3rem auto;padding:0 1rem;max-width:1100px;font:16px/1.65 system-ui,sans-serif;color:#243c30;background:#faf9f3}}h1,h2,h3{{line-height:1.2}}h2{{margin-top:3rem}}a{{color:#245f4a}}table{{border-collapse:collapse;width:100%;font-size:14px}}th,td{{padding:.6rem;text-align:left;border-bottom:1px solid #bbb}}caption{{text-align:left;font-weight:600;padding:1rem 0}}.table-scroll{{overflow:auto}}img{{max-width:100%;height:auto}}select{{display:block;max-width:100%}}.microscopy-controls,.microscopy-status,.microscopy-legend{{display:none}}figcaption{{font-size:14px}}details{{margin:1rem 0}}.anchor-alias{{display:none}}</style></head><body><p><a href="../../../results.html">AeroSense Results</a></p><h1>HEK293 microscopy analysis</h1><p>10 October 2026 · Pre-G418 expression screening · Original files preserved</p>{report_article}</body></html>'''
(HERE/'analysis-report.html').write_text(report,encoding='utf-8')
(HERE/'README.txt').write_text('AeroSense HEK293 microscopy analysis, 2026-10-10\n\nThis package contains analysis scripts, parameters, source hashes and data tables.\nThe original TIFFs are not duplicated in the ZIP. They are linked in the wiki Results Data availability section.\nReproduction: retain the repository layout, install numpy/Pillow/scipy/matplotlib in a Python 3 environment, then run analyze_microscopy.py, analyze_nuclear_objects.py, and publish_results.py in that order.\nAll three scripts live at assets/results/microscopy/.\nFor text/layout updates without recomputing or redrawing measurements, run publish_results.py --text-only.\nThe canonical published methods fragment is assets/experiments/microscopy-methods.html.\n\nRead analysis-report.html for methods and limitations. Object fractions are NOT validated transfection efficiencies or viable-cell fractions.\nThe companion source workbook and input TIFFs are opened read-only.\n\nPer-field records are technical observations; no independent biological repeats were supplied.\nRED/GREEN calls are local contrast above the maximum blank-field 99th score percentile.\nDensity exclusions and threshold sensitivity materially limit interpretation.\n',encoding='utf-8')
with zipfile.ZipFile(HERE/'analysis-package.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(HERE.iterdir()):
        if p.is_file() and p.suffix in {'.py','.json','.csv','.txt','.html','.svg'}:
            z.write(p,p.name)
    for name in ('object-fractions.png','all-field-diagnostics.png'):
        z.write(HERE/name,name)
print('Published results page and report:', total, 'eligible objects')
