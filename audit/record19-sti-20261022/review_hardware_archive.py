"""Read-only comparison of live Hardware evidence and the prepared Zenodo ZIP."""
from pathlib import Path
import concurrent.futures
import csv
import hashlib
import io
import json
import re
import time
import urllib.request
import zipfile

import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
RELEASE = ROOT / 'zenodo-release'
HW = RELEASE / 'aerosense-wiki/data/hardware-test3-2026-10-21'
CONFIRMED = RELEASE / 'aerosense-wiki/data/hardware-confirmed-map-2026-10-21'
HISTORICAL = RELEASE / 'aerosense-wiki/data/hardware-wetlab-pattern-comparison-2026-10-21'
UPLOAD = ROOT / 'zenodo-upload/03-hardware-design-and-calibration/AeroSense-03-hardware-design-and-calibration.zip'
REVISED = HW / 'revisions/user-supplied-record19'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def rows(data):
    return list(csv.DictReader(io.StringIO(data.decode('utf-8-sig'))))


def amplitude(data):
    table = rows(data)
    counts = np.array([int(r['adc_counts']) for r in table])
    centered = counts * 2.5 / 65536
    centered -= centered.mean()
    angles = 2 * np.pi * np.outer(np.arange(1, len(counts) + 1) / 4000, [41, 67, 89, 113])
    iq = np.stack([2 / len(counts) * centered @ np.cos(angles),
                   2 / len(counts) * centered @ np.sin(angles)])
    return table, counts, np.hypot(iq[0], iq[1]) * 1000


result = {'checked_at_unix': time.time(), 'user_confirmed_interpretation': 'simulation plus original measurement',
          'live_page_url': 'https://2026.igem.wiki/nthu/hardware.html', 'inputs_modified': False}
files = [p for base in (HW, CONFIRMED) for p in base.rglob('*') if p.is_file()]
with zipfile.ZipFile(UPLOAD) as archive:
    names = set(archive.namelist())
    issues = []
    for path in files:
        arc = 'AeroSense-NTHU-2026/' + path.relative_to(RELEASE).as_posix()
        if arc not in names:
            issues.append({'file': str(path.relative_to(RELEASE)), 'problem': 'missing from ZIP'})
        elif archive.read(arc) != path.read_bytes():
            issues.append({'file': str(path.relative_to(RELEASE)), 'problem': 'ZIP bytes differ'})
    result['hardware_zip_content_check'] = {'files_checked': len(files), 'issues': issues,
        'four_record19_files': [{'filename': p.name, 'bytes': p.stat().st_size, 'sha256': sha(p.read_bytes())}
                               for p in sorted(REVISED.glob('VUAA1*'))]}

raw_manifest = rows((HW/'source-manifest.csv').read_bytes())
result['raw_manifest_check'] = {'files': len(raw_manifest), 'issues': [r['file'] for r in raw_manifest
    if sha((HW/'raw'/r['file']).read_bytes()) != r['sha256']]}
original_path = REVISED/'VUAA1_1min_raw_87187f3e-19.csv'
simulated_path = REVISED/'VUAA1_1min_raw_87187f3e-19_sti.csv'
original_rows, original_adc, original_amp = amplitude(original_path.read_bytes())
simulated_rows, simulated_adc, simulated_amp = amplitude(simulated_path.read_bytes())
report_paths = [REVISED/'VUAA1_1min_report_87187f3e-19.json', REVISED/'VUAA1_1min_report_87187f3e-19_sti.json']
report = json.loads(report_paths[0].read_text(encoding='utf-8-sig'))
record = next(r for r in report['records'] if r['id'] == '87187f3e-19')
embedded = record['rawCsv'].replace('\r\n', '\n')
result['record19_checks'] = {
    'samples_each': [len(original_rows), len(simulated_rows)],
    'changed_adc_samples': int(np.count_nonzero(original_adc != simulated_adc)),
    'sample_indices_identical': all(a['sample'] == b['sample'] for a, b in zip(original_rows, simulated_rows)),
    'sample_timestamps_identical': all(a['time_us'] == b['time_us'] for a, b in zip(original_rows, simulated_rows)),
    'original_amplitudes_mV': original_amp.tolist(), 'simulated_amplitudes_mV': simulated_amp.tolist(),
    'reports_byte_identical': report_paths[0].read_bytes() == report_paths[1].read_bytes(),
    'report_embedded_csv_matches_original': embedded == original_path.read_text(encoding='utf-8-sig').replace('\r\n','\n'),
    'report_embedded_csv_matches_simulated': embedded == simulated_path.read_text(encoding='utf-8-sig').replace('\r\n','\n'),
    'provided_original_csv_matches_raw_archive': original_path.read_bytes() == (HW/'raw'/original_path.name).read_bytes(),
}
original_series = []
for index in range(19, 29):
    path = next((HW/'raw').glob(f'*_raw_87187f3e-{index}.csv'))
    original_series.append(amplitude(path.read_bytes())[2])
original_series = np.array(original_series)
simulated_series = original_series.copy()
simulated_series[0] = simulated_amp
correlations = rows((CONFIRMED/'matched-correlations.csv').read_bytes())
result['d4_comparison'] = {
    'original_first_mV': float(original_series[0, 3]),
    'simulated_first_mV': float(simulated_series[0, 3]),
    'unchanged_last_mV': float(original_series[-1, 3]),
    'original_first_to_last_percent': float(100*(original_series[-1, 3]/original_series[0, 3]-1)),
    'simulated_first_to_last_percent': float(100*(simulated_series[-1, 3]/simulated_series[0, 3]-1)),
    'matched_wetlab_pearson': {r['scenario']: float(r['pearson_level']) for r in correlations
        if r['channel']=='D4' and r['scenario'] in ('nominal_native5_selected','nominal_native5_original19')},
    'original_normalized_timecourses_present': (HW/'original-record19-own-start-normalized-timecourses.csv').is_file(),
    'selected_normalized_timecourses_present': (HW/'own-start-normalized-timecourses.csv').is_file(),
}
html = (HERE/'live-hardware-review.html').read_text(encoding='utf-8-sig')
links = sorted(set(re.findall(r'https://static\.igem\.wiki/teams/6460/wiki/hardware/[^"<>\s]+\.csv', html)))
links = [link for link in links if (CONFIRMED/link.rsplit('/',1)[-1]).is_file()]
def fetch(link):
    try:
        with urllib.request.urlopen(link, timeout=35) as response:
            body = response.read(2_000_000)
        name = link.rsplit('/', 1)[-1]
        item = {'url': link, 'bytes': len(body), 'sha256': sha(body),
                'matches_current_confirmed_map': body == (CONFIRMED/name).read_bytes(),
                'matches_historical_map': (HISTORICAL/name).is_file() and body == (HISTORICAL/name).read_bytes()}
        if not item['matches_current_confirmed_map']:
            remote_rows, local_rows = rows(body), rows((CONFIRMED/name).read_bytes())
            diffs = [{'row': index + 2, 'column': key, 'live': a.get(key), 'archive': b.get(key)}
                     for index, (a, b) in enumerate(zip(remote_rows, local_rows))
                     for key in set(a) | set(b) if a.get(key) != b.get(key)]
            item['row_counts_live_archive'] = [len(remote_rows), len(local_rows)]
            item['differing_cell_count'] = len(diffs)
            item['differing_columns'] = sorted({d['column'] for d in diffs})
            item['differences_first_8'] = diffs[:8]
        if name == 'matched-correlations.csv':
            item['main_pearson'] = {r['channel']: float(r['pearson_level']) for r in rows(body)
                                    if r['scenario'] == 'nominal_native5_selected'}
        return item
    except Exception as error:
        return {'url': link, 'error': type(error).__name__ + ': ' + str(error)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    result['live_download_checks'] = list(pool.map(fetch, links))
result['current_confirmed_map_pearson'] = {r['channel']: float(r['pearson_level']) for r in correlations
                                        if r['scenario'] == 'nominal_native5_selected'}
result['source_wording_to_reconcile'] = {
    'selection_provenance': json.loads((REVISED/'selection-provenance.json').read_text(encoding='utf-8'))['classification'],
    'current_analysis_defaults_to_simulated_csv': '_sti.csv' in (HW/'analyze_hardware_test3.py').read_text(encoding='utf-8'),
    'zip_contains_new_comparison_figure': False,
    'note': 'Existing figures predate this request. No figure, source, ZIP, or remote record is changed by this audit.'
}
upload_audit = ROOT/'aerosense-wiki/audit/zenodo-upload-20261021'
receipt = json.loads((upload_audit/'upload-receipts.json').read_text(encoding='utf-8'))['files'].get(UPLOAD.name)
result['hardware_zip_upload_receipt'] = receipt
if receipt:
    digest = hashlib.md5()
    with UPLOAD.open('rb') as stream:
        for block in iter(lambda: stream.read(4*1024*1024), b''):
            digest.update(block)
    result['hardware_zip_matches_verified_remote_receipt'] = (digest.hexdigest() == receipt['md5']
        and UPLOAD.stat().st_size == receipt['bytes'] and receipt['verified'])
state = json.loads((upload_audit/'upload-progress.json').read_text(encoding='utf-8'))
result['upload_status_at_check'] = {key: state.get(key) for key in ('status','completed','current','full_collection_verified')}
(HERE/'hardware-zenodo-consistency-review.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps(result, indent=2, ensure_ascii=False))
