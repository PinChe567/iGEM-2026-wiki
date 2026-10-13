"""Exploratory reporter-positive fraction among resolvable DAPI objects.

This is NOT a validated transfection efficiency or viable-cell assay. It samples
isolated DAPI-positive objects, omits unresolved clusters, and uses 8-bit exports.
Run after analyze_microscopy.py, from any working directory.
Dependencies: numpy, scipy, Pillow, matplotlib.
"""
from pathlib import Path
import csv
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
import analyze_microscopy as q

HERE = Path(__file__).resolve().parent
SOURCE = q.SOURCE
PARAMS = {
    'analysis_date': q.DATE,
    'status': 'Exploratory reporter-positive fractions in resolvable DAPI objects; NOT transfection efficiency',
    'confirmed_by_team_2026_10_10': {'blue': 'DAPI', 'paired_fields': True,
                                   'same_exposure_per_fluorescence_channel_across_groups': True,
                                   'blank_calibration': True, 'time_post_transfection_hours': [44, 48],
                                   'before_G418': True, 'independent_biological_replicates': False,
                                   'live_dead_stain': False, 'fixation': '2% PFA before DAPI', 'permeabilization': 'none'},
    'not_confirmed': ['Gain, LUT and raw camera intensity conversion',
                      'Total-cell staining completeness', 'Viability', 'Nuclear segmentation ground truth'],
    'blue_threshold': 128, 'median_filter_size_px': 3, 'connectivity': 8,
    'min_object_area_px': 200, 'max_object_area_px': 2200,
    'max_bbox_aspect_ratio': 2.5, 'min_area_over_bbox': 0.4,
    'min_border_distance_px': 49,
    'signal_region': 'Nuclear mask and pixels within 12 px, assigned to the nearest blue connected component',
    'local_background': 'Pixels 24-48 px from each object, excluding all blue foreground; minimum 100 pixels',
    'reporter_score': '90th percentile of reporter intensity in signal region minus median local background',
    'positivity': 'Score strictly above maximum of the 3 blank-field 99th score percentiles, separately for RED/GREEN',
    'sensitivity': 'Also report maximum blank-field 95th and 99.5th score percentile thresholds',
    'exclusion': 'No watershed splitting. Tiny, oversized, elongated, low-fill, edge and insufficient-background objects excluded.',
    'denominator': 'Resolvable DAPI-positive connected objects meeting all criteria. Not all cells and not all viable cells.',
    'aggregation': 'Sum positive objects / sum eligible objects across technical fields. Per-field fractions and counts retained.',
    'uncertainty': 'No biological-replicate confidence intervals or hypothesis tests; field and threshold sensitivity shown.'
}


def save_csv(name, rows):
    q.write_csv(name, rows)


def collect(group, fid):
    arrays = {c: q.read(group / f'{c}_{fid}.tif', c) for c in q.CHANNELS}
    blue = arrays['BLUE']
    roi = q.roi_for(blue.shape)
    binary = (ndi.median_filter(blue, size=3) > 128) & roi
    labels, n = ndi.label(binary, structure=np.ones((3, 3)))
    sizes = np.bincount(labels.ravel())
    objects = ndi.find_objects(labels)
    # Distance and nearest component assign each perinuclear pixel only once.
    distance, nearest = ndi.distance_transform_edt(~binary, return_indices=True)
    owner = labels[nearest[0], nearest[1]]
    h, w = blue.shape
    data = []
    for i, slices in enumerate(objects, 1):
        if slices is None:
            continue
        sy, sx = slices
        area = int(sizes[i])
        if area < 200:
            continue
        bh, bw = sy.stop-sy.start, sx.stop-sx.start
        cx, cy = (sx.start+sx.stop)/2, (sy.start+sy.stop)/2
        reason = []
        if area > 2200:
            reason.append('large_or_merged')
        if max(bh/bw, bw/bh) > 2.5:
            reason.append('elongated')
        if area / (bh*bw) < .4:
            reason.append('irregular_or_merged')
        if min(sx.start, sy.start, w-sx.stop, h-sy.stop) < 49:
            reason.append('edge')
        ys = slice(max(0, sy.start-49), min(h, sy.stop+49))
        xs = slice(max(0, sx.start-49), min(w, sx.stop+49))
        mask = labels[ys, xs] == i
        if not roi[ys, xs].all():
            reason.append('annotation_neighborhood')
        r = {'condition': group.name, 'field': fid, 'object_id': i,
             'bbox_x0': sx.start, 'bbox_y0': sy.start, 'bbox_x1': sx.stop, 'bbox_y1': sy.stop,
             'area_px': area, 'center_x_px': cx, 'center_y_px': cy,
             'accepted': not reason, 'exclusion_reason': '|'.join(reason),
             'signal_pixels': '', 'background_pixels': '', 'red_score_DN': '', 'green_score_DN': ''}
        if not reason:
            dist = ndi.distance_transform_edt(~mask)
            signal = (dist <= 12) & (owner[ys, xs] == i) & roi[ys, xs]
            background = (dist >= 24) & (dist <= 48) & ~binary[ys, xs] & roi[ys, xs]
            r['signal_pixels'] = int(signal.sum())
            r['background_pixels'] = int(background.sum())
            if background.sum() < 100:
                r['accepted'] = False
                r['exclusion_reason'] = 'insufficient_background'
            else:
                for c in ('RED', 'GREEN'):
                    a = arrays[c][ys, xs]
                    r[c.lower() + '_score_DN'] = round(float(np.percentile(a[signal], 90) - np.median(a[background])), 4)
        data.append(r)
    return data, {'labels': labels, 'arrays': arrays, 'roi': roi, 'binary': binary}


def main():
    all_objects, field_data = [], []
    for group in [p for p in sorted(SOURCE.iterdir()) if p.is_dir()]:
        for file in sorted(group.glob('BRIGHTFIELD_*.tif')):
            fid = int(file.stem.split('_')[-1])
            records, imaging = collect(group, fid)
            all_objects.extend(records)
            retained = sum(r['area_px'] for r in records if r['accepted'])
            foreground = int(imaging['binary'].sum())
            field_data.append({'condition': group.name, 'field': fid,
                               'segmented_blue_foreground_pixels': foreground,
                               'eligible_object_foreground_pixels': retained,
                               'eligible_blue_foreground_percent': round(100*retained/foreground, 3) if foreground else 0,
                               'excluded_components_area_ge_200px': sum(not r['accepted'] for r in records),
                               'eligible_objects': sum(r['accepted'] for r in records)})
            print(group.name, fid, 'eligible:', sum(r['accepted'] for r in records), flush=True)
    thresholds = {}
    for c in ('red', 'green'):
        thresholds[c] = {}
        for percentile in (95, 99, 99.5):
            per_blank = []
            for fid in (1, 2, 3):
                scores = [r[c+'_score_DN'] for r in all_objects if r['condition'] == 'blank (no transfect)' and r['field'] == fid and r['accepted']]
                assert scores, 'Blank does not have eligible objects'
                per_blank.append(float(np.percentile(scores, percentile)))
            thresholds[c][str(percentile)] = round(max(per_blank), 4)
    PARAMS['reporter_thresholds_DN'] = thresholds
    for r in all_objects:
        for percentile in (95, 99, 99.5):
            for c in ('red', 'green'):
                r[c+'_positive_p'+str(percentile)] = r[c+'_score_DN'] > thresholds[c][str(percentile)] if r['accepted'] else ''
        r['both_positive_p99'] = r['red_positive_p99'] and r['green_positive_p99'] if r['accepted'] else ''
    for f in field_data:
        rr = [r for r in all_objects if r['condition'] == f['condition'] and r['field'] == f['field'] and r['accepted']]
        n = len(rr)
        for percentile in (95, 99, 99.5):
            for c in ('red', 'green'):
                k = sum(r[c+'_positive_p'+str(percentile)] for r in rr)
                f[c+'_positive_objects_p'+str(percentile)] = k
                f[c+'_positive_fraction_percent_p'+str(percentile)] = round(100*k/n, 3) if n else 'NA'
        k = sum(r['both_positive_p99'] for r in rr)
        f['both_positive_objects_p99'] = k
        f['both_positive_fraction_percent_p99'] = round(100*k/n, 3) if n else 'NA'
        f['transfection_efficiency_percent'] = 'NA'
        f['viability_percent'] = 'NA'
    summaries = []
    for condition in dict.fromkeys(f['condition'] for f in field_data):
        ff = [f for f in field_data if f['condition'] == condition]
        n = sum(f['eligible_objects'] for f in ff)
        summary = {'condition': condition, 'fields': len(ff), 'eligible_objects': n,
                   'eligible_blue_foreground_percent': round(100*sum(f['eligible_object_foreground_pixels'] for f in ff)/sum(f['segmented_blue_foreground_pixels'] for f in ff), 3),
                   'transfection_efficiency_percent': 'NA', 'viability_percent': 'NA', 'biological_replicates': 'not independently repeated'}
        for percentile in (95, 99, 99.5):
            for c in ('red', 'green'):
                k = sum(f[c+'_positive_objects_p'+str(percentile)] for f in ff)
                summary[c+'_positive_objects_p'+str(percentile)] = k
                summary[c+'_positive_fraction_percent_p'+str(percentile)] = round(100*k/n, 3) if n else 'NA'
        k = sum(f['both_positive_objects_p99'] for f in ff)
        summary['both_positive_objects_p99'] = k
        summary['both_positive_fraction_percent_p99'] = round(100*k/n, 3) if n else 'NA'
        summaries.append(summary)
    save_csv('nuclear-object-measurements.csv', all_objects)
    save_csv('nuclear-object-per-field.csv', field_data)
    save_csv('nuclear-object-per-condition.csv', summaries)
    (HERE / 'nuclear-object-parameters.json').write_text(json.dumps(PARAMS, indent=2), encoding='utf-8')
    (HERE / 'nuclear-object-summary.json').write_text(json.dumps({'conditions': summaries, 'fields': field_data, 'parameters': PARAMS}, indent=2), encoding='utf-8')

    # Every field gets an auditable overlay; rejected connected regions remain visible.
    for f in field_data:
        group = SOURCE / f['condition']
        fid = f['field']
        rr = [r for r in all_objects if r['condition'] == f['condition'] and r['field'] == fid]
        blue = q.read(group / f'BLUE_{fid}.tif', 'BLUE')
        binary = (ndi.median_filter(blue, size=3) > 128) & q.roi_for(blue.shape)
        labels, _ = ndi.label(binary, structure=np.ones((3, 3)))
        rgb = np.stack([q.read(group / f'RED_{fid}.tif', 'RED'), q.read(group / f'GREEN_{fid}.tif', 'GREEN'), blue], axis=-1)
        # Reduced background display brightness only in this labeled overlay, not measurements.
        rgb = (rgb.astype(float)*.55).astype('uint8')
        lookup = np.zeros((labels.max()+1, 3), 'uint8')
        for r in rr:
            if not r['accepted']:
                color = (70, 200, 220)
            elif r['both_positive_p99']:
                color = (255, 220, 70)
            elif r['red_positive_p99']:
                color = (255, 80, 120)
            elif r['green_positive_p99']:
                color = (120, 250, 120)
            else:
                color = (230, 230, 230)
            lookup[r['object_id']] = color
        edge = (labels > 0) & (labels != ndi.minimum_filter(labels, size=3))
        rgb[edge] = lookup[labels[edge]]
        im = Image.fromarray(rgb)
        d = ImageDraw.Draw(im)
        for r in rr:
            if r['accepted']:
                d.text((r['center_x_px']+3, r['center_y_px']), str(r['object_id']), fill=(255,255,255), font=q.font(13))
        dest = HERE / q.slug(group.name)
        im.save(dest / f'field-{fid:02d}-object-overlay.png')
        q.save_web(im, dest / f'field-{fid:02d}-object-overlay.webp')
    print(json.dumps({'thresholds': thresholds, 'eligible_objects': sum(f['eligible_objects'] for f in field_data), 'conditions': len(summaries)}), flush=True)


if __name__ == '__main__':
    main()
