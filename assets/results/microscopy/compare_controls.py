"""Reproduce the 2026-10-11 exploratory microscopy control comparison.

Run: python compare_controls.py
Inputs are the existing immutable CSV exports beside this script. No TIFF,
segmentation, condition label or primary threshold is changed. Dependencies:
numpy, scipy, matplotlib. The ZIP includes inputs, outputs and this script.

IMPORTANT: objects share fields and one experiment; they are not independent
biological replicates. Fisher p values and Wilson intervals describe an assumed
independent-object model, not calibrated inference for cells or cultures.
"""
from pathlib import Path
import csv
import hashlib
import json
import platform
import zipfile
import numpy as np
import scipy
from scipy.stats import fisher_exact, spearmanr, norm
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

HERE = Path(__file__).resolve().parent
BLANK = 'blank (no transfect)'
INPUTS = ['nuclear-object-measurements.csv', 'nuclear-object-per-condition.csv',
          'nuclear-object-per-field.csv', 'nuclear-object-parameters.json',
          'per-condition-summary.csv', 'per-field-channel-qc.csv']
OUTPUTS = []


def read(name):
    with (HERE / name).open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def save(name, rows):
    with (HERE / name).open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    OUTPUTS.append(name)


def holm(values):
    order = np.argsort(values, kind='stable')
    adjusted = np.empty(len(values))
    floor = 0.0
    for rank, i in enumerate(order):
        floor = max(floor, (len(values) - rank) * values[i])
        adjusted[i] = min(1.0, floor)
    return adjusted


def wilson(k, n):
    z = norm.ppf(.975)
    p = k/n
    den = 1 + z*z/n
    centre = (p + z*z/(2*n))/den
    half = z*np.sqrt(p*(1-p)/n + z*z/(4*n*n))/den
    return max(0, centre-half)*100, min(1, centre+half)*100


def main():
    objects = read('nuclear-object-measurements.csv')
    accepted = [r for r in objects if r['accepted'] == 'True']
    conditions = read('nuclear-object-per-condition.csv')
    fields = read('nuclear-object-per-field.csv')
    area = {r['condition']: r for r in read('per-condition-summary.csv')}
    qc = read('per-field-channel-qc.csv')
    parameters = json.loads((HERE/'nuclear-object-parameters.json').read_text())
    assert len(accepted) == 2624 and len(fields) == 25 and len(conditions) == 12

    # Verify counts, all six threshold columns and fractions against object rows.
    for r in conditions:
        rr = [o for o in accepted if o['condition'] == r['condition']]
        assert len(rr) == int(r['eligible_objects'])
        for channel in ('red', 'green'):
            for percentile in ('95', '99', '99.5'):
                threshold = parameters['reporter_thresholds_DN'][channel][percentile]
                k = sum(float(o[channel+'_score_DN']) > threshold for o in rr)
                assert k == int(r[channel+'_positive_objects_p'+percentile])
                assert round(100*k/len(rr), 3) == float(r[channel+'_positive_fraction_percent_p'+percentile])

    rows = []
    reference = next(r for r in conditions if r['condition'] == BLANK)
    for channel in ('red', 'green'):
        family = []
        kb, nb = int(reference[channel+'_positive_objects_p99']), int(reference['eligible_objects'])
        for r in conditions:
            n, k = int(r['eligible_objects']), int(r[channel+'_positive_objects_p99'])
            lo, hi = wilson(k, n)
            p = fisher_exact([[k, n-k], [kb, nb-kb]], alternative='greater').pvalue if r['condition'] != BLANK else None
            row = dict(condition=r['condition'], channel=channel.upper(), fields=int(r['fields']),
                       positive=k, eligible=n, fraction_percent=100*k/n,
                       nominal_wilson95_low_percent=lo, nominal_wilson95_high_percent=hi,
                       difference_from_blank_percentage_points=100*(k/n-kb/nb),
                       fisher_one_sided_p='' if p is None else float(p),
                       holm_11_within_channel_p='', nominal_holm_below_0_05='',
                       inference='Independent-object model only; pseudoreplication and fitted blank preclude culture-level inference')
            rows.append(row)
            if p is not None:
                family.append(row)
        for row, adjusted in zip(family, holm([r['fisher_one_sided_p'] for r in family])):
            row['holm_11_within_channel_p'] = float(adjusted)
            row['nominal_holm_below_0_05'] = bool(adjusted < .05)
    save('control-comparison.csv', rows)

    # Leave ONE blank field out; train on the other TWO. This is a post-hoc
    # within-batch field audit, not an independent-day specificity validation.
    held = []
    for channel in ('red', 'green'):
        scores = {fid: np.array([float(o[channel+'_score_DN']) for o in accepted
                                if o['condition'] == BLANK and int(o['field']) == fid])
                  for fid in (1, 2, 3)}
        for fid in scores:
            train = [x for x in scores if x != fid]
            threshold = max(float(np.percentile(scores[x], 99)) for x in train)
            k = int(np.sum(scores[fid] > threshold))
            held.append(dict(channel=channel.upper(), held_out_field=fid,
                             calibration_fields=';'.join(map(str, train)),
                             threshold_DN=threshold, held_out_positive=k,
                             held_out_eligible=len(scores[fid]),
                             held_out_fraction_percent=100*k/len(scores[fid]),
                             scope='Post-hoc same-batch blank-field holdout; not external specificity'))
    save('blank-field-holdout.csv', held)

    agreement, correlation = [], []
    for r in conditions:
        for channel in ('red', 'green'):
            agreement.append(dict(condition=r['condition'], channel=channel.upper(),
                                  fields=int(r['fields']),
                                  median_pixel_area_percent=float(area[r['condition']][channel+'_area_percent_median']),
                                  pooled_object_percent=100*int(r[channel+'_positive_objects_p99'])/int(r['eligible_objects']),
                                  retained_DAPI_foreground_percent=float(r['eligible_blue_foreground_percent'])))
    for channel in ('RED', 'GREEN'):
        for subset in ('all 12 conditions', '10 receptor conditions'):
            rr = [r for r in agreement if r['channel'] == channel and
                  (subset == 'all 12 conditions' or r['condition'] not in (BLANK, 'ORCO only'))]
            rho, p = spearmanr([r['median_pixel_area_percent'] for r in rr], [r['pooled_object_percent'] for r in rr])
            correlation.append(dict(channel=channel, subset=subset, n=len(rr), spearman_rho=float(rho),
                                    descriptive_p=float(p), scope='Different estimands, small non-independent dataset; no equivalence test'))
    save('area-object-comparison.csv', agreement)
    save('area-object-correlations.csv', correlation)
    diagnostic = []
    for r in qc:
        if r['condition'] == 'Or98a+ORCO' and r['channel'] in ('RED', 'GREEN', 'BLUE'):
            diagnostic.append({key:r[key] for key in ('condition','field','channel','median_export_DN',
                              'export_255_fraction_percent','area_gt_blank_quantile_0.999_percent')})
    save('or98a-export-diagnostics.csv', diagnostic)

    plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,
                         'axes.spines.right':False,'axes.facecolor':'#fffdf6','figure.facecolor':'#fffdf6'})
    fig, axes = plt.subplots(1, 2, figsize=(11, 5.5), constrained_layout=True)
    for ax, channel, color in zip(axes, ('RED','GREEN'), ('#a3495c','#386754')):
        rr = [r for r in agreement if r['channel'] == channel]
        for r in rr:
            is98 = r['condition'] == 'Or98a+ORCO'
            ax.scatter(r['median_pixel_area_percent'], r['pooled_object_percent'], color=color,
                       s=85 if is98 else 32, marker='D' if is98 else 'o', alpha=.9)
            if is98 or r['condition'] in (BLANK,'ORCO only'):
                label = 'Or98a' if is98 else ('blank' if r['condition']==BLANK else 'Orco only')
                ax.annotate(label, (r['median_pixel_area_percent'],r['pooled_object_percent']),
                            xytext=(-6, 9) if is98 else (5,5), textcoords='offset points',
                            ha='right' if is98 else 'left', fontsize=9)
        stat = next(r for r in correlation if r['channel']==channel and r['n']==12)
        ax.set(title=f'{channel}: Spearman rho = {stat["spearman_rho"]:.2f}',
               xlabel='Median field area above pixel threshold (%)', ylabel='Pooled eligible objects above local threshold (%)')
        ax.set_xlim(-3 if channel=='GREEN' else -.4, 112 if channel=='GREEN' else 10)
        ax.set_ylim(-.7,19 if channel=='RED' else 9)
        ax.grid(alpha=.15)
    fig.suptitle('Area and object scores answer different questions\n12 conditions · one batch · descriptive comparison', fontsize=14)
    for ext in ('png','svg'):
        name='area-object-agreement.'+ext
        fig.savefig(HERE/name, dpi=180)
        OUTPUTS.append(name)
    plt.close(fig)

    summary = dict(analysis_date='2026-10-11', python=platform.python_version(), numpy=np.__version__,
                   scipy=scipy.__version__, matplotlib=matplotlib.__version__,
                   primary_data_unchanged=True, verification='12 conditions, 25 fields, 2624 objects and all72 threshold cells reproduced',
                   red_nominal_receptor_comparisons_below_0_05=sum(r['nominal_holm_below_0_05'] is True and r['condition']!='ORCO only' for r in rows if r['channel']=='RED'),
                   green_nominal_conditions_below_0_05=[r['condition'] for r in rows if r['channel']=='GREEN' and r['nominal_holm_below_0_05'] is True],
                   input_sha256={f:hashlib.sha256((HERE/f).read_bytes()).hexdigest() for f in INPUTS},
                   note='Nominal object-model summaries are exploratory diagnostics, not biological significance or specificity. No independent biological repeats.')
    (HERE/'control-comparison-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    OUTPUTS.append('control-comparison-summary.json')
    with zipfile.ZipFile(HERE/'control-comparison-package.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for name in INPUTS+OUTPUTS+['compare_controls.py','CONTROL-COMPARISON-README.txt']:
            archive.write(HERE/name,name)
    print(json.dumps(summary,indent=2))


if __name__ == '__main__':
    main()
