"""Render the corrected microscopy appendix without publishing website pages.

Run after analyze_microscopy.py, analyze_nuclear_objects.py and compare_controls.py:
    python render_analysis_artifacts.py --provenance PATH_TO_CORRECTION_JSON

Reads completed CSV/JSON outputs and the canonical methods fragment. Writes only
object-fractions.png/.svg, analysis-report.html and analysis-package.zip beside
this script. Never modifies measurements, parameters, source files or site pages.
"""
from pathlib import Path
from urllib.parse import quote
import argparse
import csv
import hashlib
import html
import io
import json
import re
import zipfile

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[2]
DATE = '2026-10-13'
SCRIPTS = ('analyze_microscopy.py', 'analyze_nuclear_objects.py',
           'compare_controls.py', 'render_analysis_artifacts.py')
DATA_FILES = (
    'analysis-parameters.json', 'field-gallery.json', 'source-manifest.json',
    'verification.json', 'per-condition-summary.csv', 'per-field-summary.csv',
    'per-field-channel-qc.csv', 'nuclear-object-measurements.csv',
    'nuclear-object-parameters.json', 'nuclear-object-summary.json',
    'nuclear-object-per-condition.csv', 'nuclear-object-per-field.csv',
    'control-comparison.csv', 'control-comparison-summary.json',
    'blank-field-holdout.csv', 'area-object-comparison.csv',
    'area-object-correlations.csv', 'or98a-export-diagnostics.csv',
    'README.txt', 'CONTROL-COMPARISON-README.txt', 'area-object-agreement.png',
    'area-object-agreement.svg', 'all-field-diagnostics.png',
    'all-field-diagnostics.svg',
)
OUTPUTS = ('object-fractions.png', 'object-fractions.svg',
           'analysis-report.html', 'analysis-package.zip')
esc = lambda value: html.escape(str(value), quote=True)


def read_json(name):
    return json.loads((HERE / name).read_text(encoding='utf-8-sig'))


def read_csv(name):
    with (HERE / name).open(encoding='utf-8-sig', newline='') as stream:
        return list(csv.DictReader(stream))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def condition_key(row):
    name = row['condition']
    priority = {'blank (no transfect)': 0, 'ORCO only': 1}.get(name, 2)
    natural = tuple((0, int(p)) if p.isdigit() else (1, p.lower())
                    for p in re.split(r'(\d+)', name))
    return priority, natural


def table(headers, rows, caption):
    head = ''.join(f'<th scope="col">{esc(x)}</th>' for x in headers)
    body = ''.join('<tr>' + ''.join(f'<td>{esc(x)}</td>' for x in row) + '</tr>'
                   for row in rows)
    return f'<div class="table-scroll"><table><caption>{esc(caption)}</caption><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'


def csv_table(name, caption):
    rows = read_csv(name)
    if not rows:
        return f'<p>{esc(caption)}: no records.</p>'
    keys = list(rows[0])
    return table(keys, ([r[k] for k in keys] for r in rows), caption)


def fraction(row, channel, percentile='99'):
    k = int(row[f'{channel}_positive_objects_p{percentile}'])
    n = int(row['eligible_objects'])
    return f'{k}/{n} ({100*k/n:.1f}%)' if n else f'{k}/0 (undefined)'


def verify_inputs(summary, conditions, fields, control):
    """Reject stale mixed generations before writing any publication artifact."""
    for name in (*SCRIPTS, *DATA_FILES):
        if not (HERE / name).is_file():
            raise RuntimeError(f'Missing required analysis input: {name}')
    for name, expected in control['input_sha256'].items():
        if digest(HERE / name) != expected:
            raise RuntimeError(f'Stale control comparison: input hash differs for {name}')
    for csv_rows, json_rows, identifiers in (
        (conditions, summary['conditions'], ('condition',)),
        (fields, summary['fields'], ('condition', 'field')),
    ):
        key = lambda row: tuple(str(row[k]) for k in identifiers)
        indexed = {key(row): row for row in json_rows}
        if len(indexed) != len(json_rows) or {key(r) for r in csv_rows} != set(indexed):
            raise RuntimeError('CSV and nuclear summary have different record identities')
        for row in csv_rows:
            for name, value in row.items():
                if name in indexed[key(row)] and str(indexed[key(row)][name]) != value:
                    try:
                        same = float(indexed[key(row)][name]) == float(value)
                    except (TypeError, ValueError):
                        same = False
                    if not same:
                        raise RuntimeError(f'CSV/JSON mismatch: {key(row)} {name}')
    if summary['parameters']['reporter_thresholds_DN'] != read_json('nuclear-object-parameters.json')['reporter_thresholds_DN']:
        raise RuntimeError('Nuclear threshold parameters disagree')
    for condition in conditions:
        group = [r for r in fields if r['condition'] == condition['condition']]
        if len(group) != int(condition['fields']):
            raise RuntimeError('Field count differs from condition summary')
        for key in ('eligible_objects', 'red_positive_objects_p99',
                    'green_positive_objects_p99', 'both_positive_objects_p99'):
            if sum(int(r[key]) for r in group) != int(condition[key]):
                raise RuntimeError(f'Field/condition totals disagree: {key}')


def chart(conditions, fields):
    retained = [float(c['eligible_blue_foreground_percent']) for c in conditions]
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10})
    fig, axes = plt.subplots(1, 3, figsize=(14.5, 7.4), sharey=True)
    for ax, channel, color in zip(axes, ('red', 'green', 'both'), ('#ba4169', '#387b52', '#877022')):
        metric = channel + '_positive_fraction_percent_p99'
        for i, condition in enumerate(conditions):
            group = [r for r in fields if r['condition'] == condition['condition']]
            y = np.linspace(i-.13, i+.13, len(group)) if len(group) > 1 else [i]
            ax.scatter([float(r[metric]) for r in group], y, color=color, s=30, zorder=3)
            ax.scatter(float(condition[metric]), i, marker='|', s=190,
                       linewidths=2, color='#202c28', zorder=4)
        ax.set_title(channel.upper()+' positive / eligible objects (%)', loc='left', fontsize=10.5)
        ax.set_xlim(-.4, max(30, max(float(f[metric]) for f in fields)+2))
        ax.grid(axis='x', color='#e0e1d8', linewidth=.7)
        for spine in ('top', 'right', 'left'):
            ax.spines[spine].set_visible(False)
    axes[0].set_yticks(range(len(conditions)), [f'{c["condition"]}  [fields={c["fields"]}]' for c in conditions])
    axes[0].invert_yaxis()
    fig.suptitle('Resolvable DAPI objects: fluorescence above the blank-derived threshold',
                 x=.02, ha='left', fontsize=16, color='#173e2b')
    fig.text(.02, .025,
             'Dots: individual fields. Black marks: pooled object fractions. No independent biological repeats.\n'
             f'Across condition pools, {min(retained):.1f}-{max(retained):.1f}% of segmented DAPI foreground enters these denominators. These values are not transfection efficiencies.',
             fontsize=10)
    fig.tight_layout(rect=(0, .08, 1, .94))
    png, svg = io.BytesIO(), io.BytesIO()
    fig.savefig(png, format='png', dpi=170, facecolor='#faf9f3')
    fig.savefig(svg, format='svg', facecolor='#faf9f3')
    plt.close(fig)
    return {'object-fractions.png': png.getvalue(), 'object-fractions.svg': svg.getvalue()}


def methods_fragment(parameters):
    canonical = SITE / 'assets/experiments/microscopy-methods.html'
    if not canonical.exists():
        canonical = HERE / 'microscopy-methods.html'
    source = canonical.read_bytes().decode('utf-8')
    fragment = re.sub(r'<header class="exp-proto__head">.*?</header>', '<h2>Methods</h2>', source, count=1, flags=re.S)
    fragment = fragment.replace('id="microscopy-analysis"', 'id="methods"')
    thresholds = parameters['reporter_thresholds_DN']
    fragment, count = re.subn(r'<strong>RED &gt;[\d.]+ DN and GREEN &gt;[\d.]+ DN</strong>',
        f'<strong>RED &gt;{thresholds["red"]["99"]:.2f} DN and GREEN &gt;{thresholds["green"]["99"]:.2f} DN</strong>', fragment)
    if count != 1:
        raise RuntimeError('Canonical methods threshold sentence changed; review before rendering')
    for ref in ('ref-dapi-guidance', 'ref-microscopy-reporting', 'ref-image-integrity'):
        fragment = fragment.replace(f'href="#{ref}"', f'href="../../../experiments.html#{ref}"')
    fragment = fragment.replace('href="#exp-as-', 'href="../../../experiments.html#exp-as-')
    for page in ('experiments', 'results'):
        fragment = fragment.replace(f'href="{page}.html', f'href="../../../{page}.html')
    return source, fragment


def render_report(conditions, fields, parameters, manifest, provenance, methods):
    total = sum(int(c['eligible_objects']) for c in conditions)
    retained = [float(c['eligible_blue_foreground_percent']) for c in conditions]
    reassigned = sum(r['condition'] != r['previous_condition'] for r in provenance['field_mapping'])
    renumbered = sum(r['condition'] == r['previous_condition'] and r['field'] != r['previous_field']
                     for r in provenance['field_mapping'])
    rows = [[c['condition'], c['fields'], fraction(c, 'red'), fraction(c, 'green'),
             fraction(c, 'both'), f'{float(c["eligible_blue_foreground_percent"]):.1f}%'] for c in conditions]
    pooled_table = table(['Image label', 'Fields', 'RED+ / eligible', 'GREEN+ / eligible',
                          'Both / eligible', 'DAPI foreground retained'], rows,
                         'Pooled technical fields; fractions describe eligible objects, not all cells.')
    sources = ''.join(f'<li><a href="../../../{quote(r["source_file"], safe="/")}">{esc(r["source_file"])}</a> '
                      f'<small>SHA-256: {esc(r["sha256"])}</small></li>' for r in manifest)
    downloads = ''.join(f'<li><a href="{quote(name)}">{esc(name)}</a></li>' for name in
                        ('analysis-package.zip', 'source-revision-2026-10-13.json',
                         *SCRIPTS, *DATA_FILES))
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>HEK293 microscopy analysis · {DATE}</title><style>
body{{max-width:1100px;margin:3rem auto;padding:0 1rem;font:16px/1.65 system-ui,sans-serif;color:#243c30;background:#faf9f3}}
h1,h2,h3{{line-height:1.2}}h2{{margin-top:2.5rem}}a{{color:#245f4a}}img{{max-width:100%;height:auto}}
.table-scroll{{overflow:auto}}table{{border-collapse:collapse;width:100%;font-size:14px}}th,td{{padding:.6rem;text-align:left;border-bottom:1px solid #bbb}}
caption{{text-align:left;font-weight:600;padding:1rem 0}}pre,li{{overflow-wrap:anywhere}}pre{{white-space:pre-wrap;font-size:13px}}small{{display:block;font-size:12px}}details{{margin:1rem 0}}
</style></head><body><p><a href="../../../results.html">AeroSense Results</a></p>
<h1>HEK293 microscopy analysis</h1><p>{DATE} · Corrected source assignments · Pre-G418 expression screening</p>
<h2>What the images support</h2>
<p>The current dataset contains {len(fields)} technical fields across {len(conditions)} image labels and {total:,} eligible DAPI objects.
The tables report fluorescence above a blank-derived threshold around resolvable objects. They do not establish whole-population transfection efficiency, viable-cell fractions, stable expression or odor sensing.</p>
<p>Condition pools retain {min(retained):.1f}–{max(retained):.1f}% of segmented DAPI foreground. This is an area fraction, not the fraction of all cells retained. Dense and overlapping regions are excluded; accepted objects are not guaranteed to equal individual cells. Fields share one experimental record and are not independent biological repeats.</p>
<h2>Corrected labels, unchanged source bytes</h2>
<p>The 2026-10-13 source reconciliation reassigned {reassigned} fields to corrected conditions and renumbered {renumbered} fields within conditions. The recorded audit preserves the bytes and SHA-256 identities of all {provenance['current_files']} source files ({provenance['measured_channel_files']} individual-channel images, {provenance['source_tiffs']-provenance['measured_channel_files']} pre-existing merges and one workbook). This is a correction to source assignment, not new image acquisition. Results are recomputed from the corrected folders; labels below follow the current outputs.</p>
<p>The current source manifest contains {len(manifest)} files. The correction record below retains the previous-to-current mapping and its audit evidence. Original TIFFs and the workbook are linked, not copied into the package.</p>
<details><summary>Source reassignment provenance</summary><pre>{esc(json.dumps(provenance, indent=2, ensure_ascii=False))}</pre></details>
<h2>Reporter-positive objects</h2>{pooled_table}
<figure><a href="object-fractions.svg"><img src="object-fractions.png" width="2465" height="1258" alt="Every field's red, green and dual-positive fraction among eligible DAPI objects; black marks show pooled fractions"></a>
<figcaption>Dots are technical fields. Black marks divide positive-object totals by eligible-object totals. No biological-replicate confidence interval is inferred.</figcaption></figure>
<details><summary>Complete per-condition table and threshold sensitivity</summary>{csv_table('nuclear-object-per-condition.csv', 'All condition-level measurements, including P95, P99 and P99.5 calls.')}</details>
<details><summary>Complete per-field table</summary>{csv_table('nuclear-object-per-field.csv', 'Every measured field, all thresholds and denominators.')}</details>
<p>Every segmented object, its inclusion decision and reporter scores are available in <a href="nuclear-object-measurements.csv">the complete object measurement CSV</a>.</p>
{methods}
<details><summary>Current numeric analysis parameters</summary><pre>{esc(json.dumps(parameters, indent=2))}</pre></details>
<h2>Control and image-export diagnostics</h2>
<p>Control comparisons are exploratory summaries under an assumed independent-object model. Objects share fields and the blank data also fitted the threshold. Fisher probabilities and Wilson intervals therefore do not measure culture-level significance or biological-repeat uncertainty. Holm adjustment does not remove these limits. Blank-field holdout is a same-batch diagnostic, not external specificity validation.</p>
<p><a href="control-comparison-package.zip" download>Download the separate control comparison package</a>. Its current tables, figures, parameters and script are also included directly in the main analysis package.</p>
<details><summary>Complete control comparison</summary>{csv_table('control-comparison.csv', 'Nominal object-model comparisons; no biological significance claim.')}</details>
<details><summary>All blank-field holdouts</summary>{csv_table('blank-field-holdout.csv', 'Post-hoc within-batch blank-field audit.')}</details>
<details><summary>Area versus object diagnostics</summary>{csv_table('area-object-comparison.csv', 'Different denominators and estimands.')}{csv_table('area-object-correlations.csv', 'Descriptive correlations.')}</details>
<figure><a href="all-field-diagnostics.svg"><img src="all-field-diagnostics.png" alt="All technical fields: red and green pixel-area diagnostics and blue export clipping" loading="lazy"></a><figcaption>Image-export diagnostics retain every measured field. Pixel-area percentages do not count cells.</figcaption></figure>
<figure><a href="area-object-agreement.svg"><img src="area-object-agreement.png" alt="Descriptive comparison of median pixel-area scores and pooled eligible-object fractions" loading="lazy"></a><figcaption>Area and object measurements use different denominators. Correlation does not establish equivalence.</figcaption></figure>
<p>These diagnostics cannot establish transfection efficiency. Camera dynamic range and export transformation remain incompletely documented.</p>
<h2>What remains to be tested</h2>
<p>Independent repeats, validated cell or nucleus denominators, viability measurements and controlled fluorescence time courses are required for stronger conclusions. GCaMP6f resting intensity is calcium dependent, so a green-negative object cannot be classified as untransfected. A red-positive object does not establish correct receptor localization or cell viability. This fixed pre-selection record does not test enrichment by G418.</p>
<h2>Data and reproduction</h2><p>The package contains the current measurement tables, parameter and source JSON, four active scripts, control comparison artifacts, figures, canonical methods and a reproduction README. The legacy publisher is not used because it also rewrites website pages. External wiki/source links require the original repository layout or the online site; the measurement tables and figures are included in the package.</p>
<ul>{downloads}</ul><details><summary>All original source links and hashes</summary><ul>{sources}</ul></details>
</body></html>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--provenance', type=Path, default=HERE / 'source-revision-2026-10-13.json',
                        help='JSON containing the 2026-10-13 source reassignment and identity audit')
    args = parser.parse_args()
    provenance_bytes = args.provenance.read_bytes()
    provenance = json.loads(provenance_bytes.decode('utf-8-sig'))
    summary = read_json('nuclear-object-summary.json')
    parameters = read_json('nuclear-object-parameters.json')
    conditions = sorted(read_csv('nuclear-object-per-condition.csv'), key=condition_key)
    fields = sorted(read_csv('nuclear-object-per-field.csv'), key=lambda r: (condition_key(r), int(r['field'])))
    manifest = read_json('source-manifest.json')
    control = read_json('control-comparison-summary.json')
    verify_inputs(summary, conditions, fields, control)
    if (not provenance['all_source_bytes_preserved'] or provenance['added_image_content'] != 0
            or len(manifest) != provenance['current_files']
            or len({r['sha256'] for r in manifest}) != provenance['previous_files']):
        raise RuntimeError('Source identities do not match the recorded reconciliation')
    field_ids = {(r['condition'], int(r['field'])) for r in fields}
    mapping_ids = {(r['condition'], int(r['field'])) for r in provenance['field_mapping']}
    if field_ids != mapping_ids or not all(r['all_four_channels_preserve_same_field'] for r in provenance['field_mapping']):
        raise RuntimeError('Current fields do not match the paired-channel correction record')
    canonical_methods, report_methods = methods_fragment(parameters)
    frozen_inputs = {name: digest(HERE/name) for name in (*SCRIPTS, *DATA_FILES)}
    rendered = chart(conditions, fields)
    rendered['analysis-report.html'] = render_report(conditions, fields, parameters, manifest, provenance, report_methods).encode('utf-8')
    package = io.BytesIO()
    with zipfile.ZipFile(package, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in (*SCRIPTS, *DATA_FILES):
            archive.write(HERE/name, name)
        for name, content in rendered.items():
            archive.writestr(name, content)
        archive.writestr('microscopy-methods.html', canonical_methods)
        archive.writestr('source-revision-2026-10-13.json', provenance_bytes)
    if (frozen_inputs != {name: digest(HERE/name) for name in frozen_inputs}
            or args.provenance.read_bytes() != provenance_bytes):
        raise RuntimeError('Analysis inputs changed during rendering; no artifacts published')
    rendered['analysis-package.zip'] = package.getvalue()
    for name in OUTPUTS:
        (HERE/name).write_bytes(rendered[name])
    print(json.dumps({'date': DATE, 'conditions': len(conditions), 'fields': len(fields),
                      'eligible_objects': sum(int(c['eligible_objects']) for c in conditions),
                      'outputs': list(OUTPUTS), 'measurement_inputs_unchanged': True}, indent=2))


if __name__ == '__main__':
    main()
