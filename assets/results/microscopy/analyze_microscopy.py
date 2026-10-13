"""Reproducible QC of the team's exported HEK293 microscopy images.

Run from the wiki repository: python assets/results/microscopy/analyze_microscopy.py
Dependencies: Python 3, numpy, Pillow, scipy, matplotlib.
The TIFF inputs are only read. No transfection-efficiency estimate is inferred.
"""
from pathlib import Path
import csv
import hashlib
import html
import json
import platform
import re
import shutil
import sys
import zipfile

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[2]
SOURCE = SITE / 'wetlab results' / 'transfection_effeciency'
CHANNELS = ('BRIGHTFIELD', 'BLUE', 'GREEN', 'RED')
INDEX = {'RED': 0, 'GREEN': 1, 'BLUE': 2}
DISPLAY = {'BLUE': (0, 255), 'GREEN': (0, 120), 'RED': (0, 180), 'BRIGHTFIELD': (0, 255)}
DATE = '2026-10-13'


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def read(path, channel):
    with Image.open(path) as im:
        a = np.array(im)
        if a.ndim == 2:
            return a
        return a[:, :, INDEX[channel]]


def roi_for(shape):
    h, w = shape
    mask = np.ones((h, w), bool)
    mask[int(h * .90):, int(w * .85):] = False
    return mask


def hist_quantile(hist, q):
    return int(np.searchsorted(np.cumsum(hist), np.sum(hist) * q, side='left'))


def write_csv(name, rows):
    with (HERE / name).open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def font(size):
    for p in ('C:/Windows/Fonts/arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default(size=size)


def scaled(a, channel):
    lo, hi = DISPLAY[channel]
    return np.clip((a.astype(np.float32) - lo) * 255 / (hi - lo), 0, 255).astype('uint8')


def save_web(im, target, width=1296):
    im = im.copy()
    if im.width > width:
        im.thumbnail((width, 100000), Image.Resampling.LANCZOS)
    im.save(target, 'WEBP', lossless=True, method=4)


def color(a, c, enhance=False):
    if c == 'BRIGHTFIELD':
        return Image.fromarray(a).convert('RGB')
    rgb = np.zeros((*a.shape, 3), 'uint8')
    rgb[:, :, INDEX[c]] = scaled(a, c) if enhance else a
    return Image.fromarray(rgb)


def main():
    groups = [p for p in sorted(SOURCE.iterdir()) if p.is_dir()]
    source_paths = sorted(SOURCE.rglob('*'))
    manifest = []
    for p in source_paths:
        if not p.is_file():
            continue
        row = {'source_file': str(p.relative_to(SITE)).replace('\\', '/'), 'bytes': p.stat().st_size,
               'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
        if p.suffix.lower() == '.tif':
            with Image.open(p) as im:
                row.update(width=im.width, height=im.height, mode=im.mode, frames=im.n_frames,
                           bits_per_sample=list(im.tag_v2.get(258, ())),
                           metadata_tags={str(k): str(v) for k, v in im.tag_v2.items()
                                          if k not in (273, 279)})
        manifest.append(row)
    (HERE / 'source-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')

    blank = SOURCE / 'blank (no transfect)'
    thresholds = {}
    for c in ('GREEN', 'RED'):
        hs = []
        for p in sorted(blank.glob(c + '_*.tif')):
            a = read(p, c)
            hs.append(np.bincount(a[roi_for(a.shape)], minlength=256))
        thresholds[c] = {str(q): max(hist_quantile(h, q) for h in hs) for q in (.99, .995, .999)}
    params = {
        'analysis_date': DATE,
        'status': 'Exploratory QC of display exports, not a cell-level transfection efficiency assay',
        'source_relative_to_wiki': str(SOURCE.relative_to(SITE)),
        'quantification': 'Unmodified 8-bit channel values extracted from TIFF; no normalization or sharpening',
        'roi_exclusion': 'Bottom-right rectangle: x >= floor(0.85*width), y >= floor(0.90*height), all channels',
        'roi_reason': 'Exclude burned-in scale bar and text; same geometric mask applied to every field',
        'threshold_definition': 'Maximum of the three blank-field quantiles, by channel; foreground is strictly > threshold',
        'thresholds': thresholds,
        'blue_qc': {'foreground_threshold': 128, 'large_connected_component_min_area_px': 5000,
                    'connectivity': 8, 'interpretation': 'Large blue signal regions, not a cell or nucleus count'},
        'display_windows_8bit': DISPLAY,
        'display': 'Uniform linear clipping/scaling per channel, all fields and controls; gamma=1; no sharpening, deconvolution or generative editing',
        'pairing': 'Team confirmed matching file numbers identify the same field; no registration correction imposed',
        'team_confirmed_2026_10_10': 'HEK293; DAPI after 2% PFA fixation without permeabilization; 44-48 h after transfection, before G418; exposure held constant per fluorescence channel across groups with blank calibration',
        'biological_replicates': 'No independent biological repeats. Fields are technical observations.',
        'transfection_efficiency': None,
        'withheld_because': ['DAPI labeling completeness and all-cell denominator not independently validated',
                            'No live/dead assay; fixed images cannot yield viable-cell denominator',
                            'Crowded/overlapping objects and substantial BLUE export clipping',
                            'Gain/LUT transformation and unprocessed source images unavailable',
                            'Field-to-well/day mapping unavailable'],
        'software': {'python': platform.python_version(), 'numpy': np.__version__, 'Pillow': Image.__version__,
                     'scipy': __import__('scipy').__version__, 'matplotlib': matplotlib.__version__},
    }
    (HERE / 'analysis-parameters.json').write_text(json.dumps(params, indent=2), encoding='utf-8')
    rows, fields, summaries = [], [], []
    for group in groups:
        key = slug(group.name)
        dest = HERE / key
        dest.mkdir(exist_ok=True)
        group_fields = []
        for p in sorted(group.glob('BRIGHTFIELD_*.tif')):
            fid = int(p.stem.split('_')[-1])
            arrays = {c: read(group / f'{c}_{fid}.tif', c) for c in CHANNELS}
            assert len({a.shape for a in arrays.values()}) == 1
            roi = roi_for(arrays['BLUE'].shape)
            h, w = roi.shape
            blue_mask = (arrays['BLUE'] > 128) & roi
            labels, _ = ndi.label(blue_mask, structure=np.ones((3, 3)))
            sizes = np.bincount(labels.ravel())
            large_ids = np.flatnonzero(sizes >= 5000)
            large_ids = large_ids[large_ids != 0]
            large = np.isin(labels, large_ids)
            total_blue = int(blue_mask.sum())
            large_blue_pct = 100 * int(large.sum()) / total_blue if total_blue else 0
            channel_rows = {}
            for c in CHANNELS:
                a = arrays[c]
                vals = a[roi]
                hist = np.bincount(vals, minlength=256)
                r = {'condition': group.name, 'field': fid, 'channel': c, 'width_px': w, 'height_px': h,
                     'analyzed_pixels': int(roi.sum()), 'median_export_DN': hist_quantile(hist, .5),
                     'p99_export_DN': hist_quantile(hist, .99), 'mean_export_DN': round(float(vals.mean()), 4),
                     'export_255_fraction_percent': round(float((vals == 255).mean()) * 100, 4),
                     'export_zero_fraction_percent': round(float((vals == 0).mean()) * 100, 4)}
                for q in (.99, .995, .999):
                    r['blank_quantile_' + str(q) + '_threshold_DN'] = thresholds[c][str(q)] if c in thresholds else ''
                    r['area_gt_blank_quantile_' + str(q) + '_percent'] = round(float((vals > thresholds[c][str(q)]).mean()) * 100, 4) if c in thresholds else ''
                r.update(large_blue_component_foreground_percent=round(large_blue_pct, 4) if c == 'BLUE' else '',
                         cell_count='NA', reporter_positive_cell_count='NA', transfection_efficiency_percent='NA',
                         reason='No validated total-cell/viable-cell denominator; image export and clumping limitations')
                rows.append(r)
                channel_rows[c] = r
                save_web(color(a, c), dest / f'field-{fid:02d}-{c.lower()}-export.webp')
            # Nominal pairing, full frame retained. This is not a spatial registration claim.
            raw_merge = Image.fromarray(np.stack([arrays['RED'], arrays['GREEN'], arrays['BLUE']], axis=-1))
            display_merge = Image.fromarray(np.stack([scaled(arrays['RED'], 'RED'), scaled(arrays['GREEN'], 'GREEN'), scaled(arrays['BLUE'], 'BLUE')], axis=-1))
            save_web(raw_merge, dest / f'field-{fid:02d}-merge-export.webp')
            save_web(display_merge, dest / f'field-{fid:02d}-merge-display.webp')
            # Cyan large-blue-region contours and yellow annotation mask for review.
            base = np.array(Image.fromarray(arrays['BRIGHTFIELD']).convert('RGB'))
            boundaries = large & ~ndi.binary_erosion(large, iterations=2)
            base[boundaries] = (0, 220, 220)
            qc = Image.fromarray(base)
            d = ImageDraw.Draw(qc)
            d.rectangle((int(w*.85), int(h*.90), w-1, h-1), outline=(255, 200, 0), width=6)
            save_web(qc, dest / f'field-{fid:02d}-qc.webp')
            # Four-panel exhibit; all settings fixed across conditions, no field-specific optimization.
            panel = Image.new('RGB', (1440, 1160), '#f4f1e7')
            pd = ImageDraw.Draw(panel)
            pd.text((20, 14), f'{group.name} / field {fid:02d}', font=font(26), fill='#173e2b')
            tiles = [(color(arrays['BRIGHTFIELD'], 'BRIGHTFIELD'), 'Brightfield | exported levels'),
                     (color(arrays['BLUE'], 'BLUE'), 'BLUE | display 0-255'),
                     (color(arrays['GREEN'], 'GREEN', True), 'GREEN | display 0-120'),
                     (color(arrays['RED'], 'RED', True), 'RED | display 0-180')]
            for i, (im, title) in enumerate(tiles):
                x, y = (i % 2) * 720, 60 + (i // 2) * 550
                im.thumbnail((712, 534), Image.Resampling.LANCZOS)
                panel.paste(im, (x + 4, y + 24))
                pd.text((x + 8, y), title, font=font(18), fill='#173e2b')
            save_web(panel, dest / f'field-{fid:02d}-panel.webp', width=1440)
            field = {'condition': group.name, 'slug': key, 'field': fid,
                     'green_area_percent': channel_rows['GREEN']['area_gt_blank_quantile_0.999_percent'],
                     'red_area_percent': channel_rows['RED']['area_gt_blank_quantile_0.999_percent'],
                     'blue_export_clipped_percent': channel_rows['BLUE']['export_255_fraction_percent'],
                     'large_blue_signal_percent': round(large_blue_pct, 4),
                     'green_median_DN': channel_rows['GREEN']['median_export_DN'],
                     'red_median_DN': channel_rows['RED']['median_export_DN'],
                     'transfection_efficiency_percent': None,
                     'cell_count': None, 'independent_biological_replicates': False}
            fields.append(field)
            group_fields.append(field)
        summary = {'condition': group.name, 'slug': key, 'fields': len(group_fields),
                   'transfection_efficiency_percent': 'NA', 'biological_replicates': 'not independently repeated'}
        for metric in ('green_area_percent', 'red_area_percent', 'blue_export_clipped_percent', 'large_blue_signal_percent'):
            vv = [f[metric] for f in group_fields]
            summary[metric + '_median'] = round(float(np.median(vv)), 4)
            summary[metric + '_min'] = min(vv)
            summary[metric + '_max'] = max(vv)
        summaries.append(summary)
        print(group.name, len(group_fields), 'fields', flush=True)
    write_csv('per-field-channel-qc.csv', rows)
    write_csv('per-condition-summary.csv', summaries)
    write_csv('per-field-summary.csv', fields)
    (HERE / 'field-gallery.json').write_text(json.dumps({'fields': fields, 'conditions': summaries, 'parameters': params}, indent=2), encoding='utf-8')

    # Actual field observations; no error bars or inferential statistics from unknown replicates.
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10})
    fig, axes = plt.subplots(1, 3, figsize=(15, 7.8), sharey=True)
    metrics = [('red_area_percent', f'RED pixels > {thresholds["RED"]["0.999"]} / ROI (%)', '#b54646'),
               ('green_area_percent', f'GREEN pixels > {thresholds["GREEN"]["0.999"]} / ROI (%)', '#37744c'),
               ('blue_export_clipped_percent', 'BLUE pixels at export value 255 (%)', '#4865ad')]
    for ax, (metric, title, clr) in zip(axes, metrics):
        for i, summary in enumerate(summaries):
            selected = [r for r in fields if r['condition'] == summary['condition']]
            ys = np.linspace(i - .12, i + .12, len(selected)) if len(selected) > 1 else [i]
            ax.scatter([s[metric] for s in selected], ys, s=38, color=clr, edgecolors='white', linewidths=.6)
        ax.set_title(title, loc='left', fontsize=11)
        ax.set_xlim(left=-.5)
        ax.grid(axis='x', color='#deded5', linewidth=.7)
        ax.set_axisbelow(True)
        for spine in ('top', 'right', 'left'):
            ax.spines[spine].set_visible(False)
    axes[0].set_yticks(range(len(summaries)), [f'{s["condition"]} (fields={s["fields"]})' for s in summaries])
    axes[0].invert_yaxis()
    fig.suptitle('Image-export diagnostics across every supplied field', x=.02, ha='left', fontsize=18, color='#173e2b')
    fig.text(.02, .025, 'Each point is one field, not a biological replicate. Pixel-area percentages are not transfection efficiency.\nThresholds derive from the most conservative blank-field 99.9th percentile. Per-channel exposure matched; camera-to-export transformation unknown.', fontsize=10)
    fig.tight_layout(rect=(0, .08, 1, .94))
    fig.savefig(HERE / 'all-field-diagnostics.png', dpi=180, facecolor='#faf9f3')
    fig.savefig(HERE / 'all-field-diagnostics.svg', facecolor='#faf9f3')
    plt.close(fig)
    # Dataset-wide record including all supplied source files, not just measured channels.
    counts = {'conditions': len(summaries), 'fields': len(fields), 'measured_channel_files': len(rows),
              'source_tiffs': len([m for m in manifest if m['source_file'].endswith('.tif')]),
              'source_files_unchanged': all(hashlib.sha256((SITE / m['source_file']).read_bytes()).hexdigest() == m['sha256'] for m in manifest),
              'efficiency_reported': False}
    (HERE / 'verification.json').write_text(json.dumps(counts, indent=2), encoding='utf-8')
    print(json.dumps(counts), flush=True)


if __name__ == '__main__':
    main()
