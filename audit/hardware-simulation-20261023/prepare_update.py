"""Classify the confirmed record-19 simulation; preserve all raw acquisitions."""
from pathlib import Path
import csv
import hashlib
import json
import re

AUDIT = Path(__file__).resolve().parent
WORK = AUDIT.parents[2]
ROOT = WORK/'zenodo-release'
HW = ROOT/'aerosense-wiki/data/hardware-test3-2026-10-21'
PAT = ROOT/'aerosense-wiki/data/hardware-confirmed-map-2026-10-21'
REV = HW/'revisions/user-supplied-record19'

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def write_json(path, value): path.write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
def replace(path, changes):
    text = path.read_text(encoding='utf-8')
    for old, new in changes:
        if old not in text: raise ValueError(f'Missing expected wording in {path.name}: {old[:90]}')
        text = text.replace(old, new)
    path.write_text(text, encoding='utf-8')

assert not (AUDIT/'before-source-snapshot.json').exists(), 'Already prepared; do not repeat.'
before = {p.relative_to(ROOT).as_posix(): {'bytes':p.stat().st_size, 'mtime_ns':p.stat().st_mtime_ns}
          for p in ROOT.rglob('*') if p.is_file()}
write_json(AUDIT/'before-source-snapshot.json', before)
write_json(AUDIT/'before-package-index.json', list(csv.DictReader((WORK/'zenodo-upload/PACKAGE_INDEX.csv').open(encoding='utf-8-sig'))))
write_json(AUDIT/'before-file-manifest.json', list(csv.DictReader((ROOT/'FILE_MANIFEST.csv').open(encoding='utf-8-sig'))))
write_json(AUDIT/'immutable-input-hashes.json', {str(p.relative_to(ROOT)):digest(p) for p in (HW/'raw').iterdir() if p.is_file()})
write_json(AUDIT/'prior-numeric-outputs.json', {
    str(p.relative_to(ROOT)):list(csv.DictReader(p.open(encoding='utf-8-sig')))
    for p in [HW/'summary-by-channel.csv', HW/'late-window-summary.csv', PAT/'matched-correlations.csv']})

p = REV/'selection-provenance.json'
data = json.loads(p.read_text(encoding='utf-8'))
data['historical_description_before_simulation_confirmation'] = {
    k:data[k] for k in ('selection','classification','conflicting_provenance')}
data.update(selection='The team confirmed this file is a simulated first-point scenario for comparison with the original measured record19.',
            classification='simulated postprocessing of an existing measured waveform; not a new physical acquisition',
            data_class='simulated_postprocessing', is_original_measurement=False,
            confirmation={'date':'2026-10-23','source':'Explicit team instruction in the archive preparation conversation',
                          'comparison':'Simulated data plus original measurements'},
            conflicting_provenance='Resolved for current interpretation by explicit team confirmation: use as simulation, not remeasurement. Earlier source descriptions are retained only as history.',
            timing='Sample indices and within-record time_us are inherited from the original waveform. They do not describe a second acquisition.',
            analysis='Recalculate four-channel I/Q amplitudes from the _sti CSV. The _sti JSON is a derived simulation report, not a firmware acquisition report.',
            derived_report='VUAA1_1min_report_87187f3e-19_sti.json',
            original_report_does_not_match_replacement=True)
data['current_report_scope'] = 'The _sti JSON now describes and checks the simulated CSV. The original-named JSON remains the unchanged device report.'
write_json(p,data)

# Rewrite the current code's explanatory labels without changing its equations,
# record selection, numeric CSV columns or historical original-record outputs.
replace(HW/'analyze_hardware_test3.py', [
    ('User-supplied replacement; independent acquisition provenance unverified.', 'Simulated first-point scenario; not an independent physical acquisition.'),
    ('user-supplied replacement CSV', 'simulated first-point CSV'),
    ('Replacement acquisition timestamp unavailable; saved original timestamps do not validate its timing.', 'Simulation inherits the original sample-time grid; no separate acquisition occurred.'),
    ('original archived acquisition; not verified for replacement record19', 'Original device timestamps describe measured records; simulated record19 inherits the sample grid.'),
    ('The selected replacement is checked separately in replacement-validation.json and has no matching firmware report.', 'The simulated first-point scenario is checked separately in replacement-validation.json; its _sti JSON is a derived report, not a firmware export.'),
    ('It does not establish a timestamp or actual series duration for a supplied replacement record19.', 'The simulated first point is derived from that waveform and has no independent acquisition time.'),
    ('make_composite(amps, group_ids, late_window, mobile=False)', 'make_composite(amps, group_ids, late_window, mobile=False, original_amps=original_amps if replacement else None)'),
    ('make_composite(amps, group_ids, late_window, mobile=True)', 'make_composite(amps, group_ids, late_window, mobile=True, original_amps=original_amps if replacement else None)'),
    ('def make_composite(amps, groups, late_window, mobile=False):', 'def make_composite(amps, groups, late_window, mobile=False, original_amps=None):'),
    ("('vuaa1_series',vuaa_color,'s','VUAA1')", "('vuaa1_series',vuaa_color,'s','VUAA1 (simulated first point)' if original_amps is not None else 'VUAA1 measured')"),
    ("        line.set_title(LABELS[c],loc='left',fontweight='bold',pad=13)", "        if c == 3 and original_amps is not None:\n            original_ratio = original_amps[groups['vuaa1_series'],c]/original_amps[groups['vuaa1_series'][0],c]\n            line.plot(nominal, original_ratio, '--^', color='#b65c23', label='Original measured D4', linewidth=2, markersize=4)\n            line.legend(loc='lower right', fontsize=8, frameon=False)\n        line.set_title(LABELS[c],loc='left',fontweight='bold',pad=13)"),
    ("        lo=min(.98,float(all_ratios.min()))", "        if c == 3 and original_amps is not None:\n            all_ratios=np.concatenate([all_ratios,original_ratio])\n        lo=min(.98,float(all_ratios.min()))"),
    ('f"Late-window contrast: {late_window[c]', 'f"Selected-scenario contrast: {late_window[c]'),
    ("label='VUAA1')", "label='VUAA1 (simulated first point)' if original_amps is not None else 'VUAA1 measured')"),
])
replace(PAT/'analyze_patterns.py', [
    ('supplied replacement; timestamp and acquisition provenance unverified', 'simulated first-point waveform; not an independent acquisition'),
    ('Five original readings per platform at nominal0,12,24,36,48s. Main analysis; no interpolation.', 'Simulation scenario: replace hardware record19 only; compare five nominal points0,12,24,36,48s. No interpolation; not five independent replicates.'),
    ('Same five nominal points; original firmware record19 restored.', 'Original measured scenario: five nominal points with all original hardware acquisitions, including record19.'),
    ('User described remeasurement, but ADC counts match an earlier synthetic-labelled revision; the archived firmware export differs. No independent acquisition verification.', 'Resolved: the team confirmed the selected CSV is simulated postprocessing on 2026-10-23. Original measured and simulated scenarios are retained separately.'),
    ('Nominal hardware6s intervals differ from actual device intervals; the selected replacement has no verified acquisition timestamp.', 'Nominal hardware6s intervals differ from actual device intervals; the simulated point is derived and has no separate acquisition timestamp.'),
    ('def make_figures(out, nominal, selected, wet_t, wet, pair_rows, heat_rows):', 'def make_figures(out, nominal, selected, wet_t, wet, pair_rows, heat_rows, original):'),
    ("label='Hardware')", "label='Hardware (simulated first point)')"),
    ("            use = wet_t<=60", "            if c == 3:\n                ax.plot(nominal, original[:,c]/original[0,c], '--^', color='#6b7280', markersize=4, label='Original measured hardware')\n            use = wet_t<=60"),
    ("            ax.set_title(f\"D{c+1}", "            if c == 3:\n                raw_r=next(r['pearson_level'] for r in pair_rows if r['scenario']=='nominal_native5_original19' and r['channel']=='D4')\n                stats=f'Simulated r = {primary[c][\"pearson_level\"]:+.2f}; original r = {raw_r:+.2f}'\n            ax.set_title(f\"D{c+1}"),
    ("['Signal levels · five time points','Signal ranks · five time points']", "['Simulated first point · levels','Simulated first point · ranks']"),
    ('make_figures(out,nominal,selected,wet_t,wet,pair_rows,primary)', 'make_figures(out,nominal,selected,wet_t,wet,pair_rows,primary,original)'),
])

# Current readers receive one clear interpretation. Earlier snapshots remain
# traceable as history instead of being rewritten to hide their old labels.
(REV/'README.md').write_text('''# Record 19: original measurement and simulated first point

The team confirmed the intended comparison is **simulated data versus original measured data**. No second physical acquisition is represented by the simulated files.

| File | Meaning |
|---|---|
| `VUAA1_1min_raw_87187f3e-19.csv` | Original measured ADC waveform, unchanged and identical to `../../raw/`. |
| `VUAA1_1min_report_87187f3e-19.json` | Original device report; its embedded waveform matches the original CSV. |
| `VUAA1_1min_raw_87187f3e-19_sti.csv` | Supplied simulated waveform derived from the original record, with D4 as the modification target. |
| `VUAA1_1min_report_87187f3e-19_sti.json` | Derived simulation metadata and independently recalculated I/Q amplitudes for the `_sti.csv`; **not a firmware report**. |

The `_sti` filenames are retained as requested; the scientific term is **simulated**, not stimulated. Only record 19 is substituted in the simulated ten-point scenario. Records 20–28 are shared original measurements. ADC rounding also introduces small changes in D1–D3, which are reported rather than described as exactly unchanged.

`selection-provenance.json` records the current classification and earlier descriptions. The neighboring historical revision folder preserves earlier bytes and source evidence. Use `../../simulation-comparison/` for the current comparison figures, tables, methods and reconstruction check. Original sample times in the simulated CSV are an inherited grid, not timestamps of a new experiment.
''',encoding='utf-8')

(HW/'README.md').write_text('''# Living-cell hardware: original measurements and simulated first-point comparison

## Data classes

`raw/` contains 52 immutable device exports: 26 ADC CSVs and 26 JSON reports, records 6–31. Each original CSV matches its original report. These are the measured observations. The separate `_sti.csv` in `revisions/user-supplied-record19/` is **simulated postprocessing of original record 19**, as explicitly confirmed by the team. Its paired `_sti.json` is a derived simulation report and is not a device export.

The current presentation compares both scenarios. The original scenario uses records 19–28 without substitution. The simulated scenario substitutes only the supplied record-19 waveform; records 20–28 remain the same measured records. This is a sensitivity comparison, not two independent experimental runs. Earlier revision descriptions are retained as provenance history and do not define the current data class.

## Samples and calculation

D1 = Or35a + ORCO; D2 = Or85b + ORCO; D3 = Or98a + ORCO; D4 = ORCO only. The channels resolve 41, 67, 89 and 113 Hz modulation from one photodiode. They are electrical Fourier amplitudes, not unmixed fluorescence or calibrated calcium concentrations. Records 6–8 are initial cells-plus-medium readings, 9–18 the pre-addition series, 19–28 the VUAA1 series, and 29–31 separate final readings. VUAA1 dilution was reported as 1:100.

Each waveform has 8,000 samples at 4,000 Hz. Convert ADC codes to volts with code × 2.5 / 65536, subtract the within-record mean, and calculate I/Q with scale 2/8000 and reference phase 2πf(i+1)/4000. Amplitude is 1000 × hypot(I,Q) mV peak. Recompute simulated amplitudes from the simulated CSV; never read them from the original device JSON.

Plots use each ten-point series' own first reading as Fstart. The nominal coordinates are 0,6,…,54 seconds. The original device span is 69.186 s after addition and 79.433 s before addition; nominal coordinates do not establish synchronized biological time. The simulated point has no independent acquisition time.

## Comparison and interpretation

For D4, the original first amplitude is 30.212347 mV and the simulated first amplitude is 26.403252 mV. The last observation is shared. The first-to-last changes are **−8.09% measured** and **+5.17% in the simulated scenario**. Their five-point nominal correlations with the matched Test 2 ORCO trace are approximately **−0.290** and **+0.948**, respectively. The positive simulated correlation is not evidence of measured agreement. These are serial points from one run, not independent biological replicates.

The separate initial/final three-reading comparison is unchanged: D1–D4 final means are 7.52%, 6.05%, 5.57% and 2.66% below their initial means. Do not confuse that endpoint metric with the ten-point within-series changes. The simulation targets the D4 first-point carrier; integer rounding produces small D1–D3 amplitude differences, all reported in the comparison metadata.

The preceding cells-plus-medium series is not a matched vehicle-addition control. Fluorescein calibration, optical unmixing and concentration conversion are not applied to these cell traces. The comparison describes sensitivity to one input waveform, not a validated correction for mixing, dilution or receptor activation.

## Files and reproducibility

- `simulation-comparison/README.md`: current two-scenario comparison, figures and regeneration instructions.
- `readouts-long.csv`, `raw-validation.csv`, `source-manifest.csv`: original measurements and checks.
- `original-record19-own-start-normalized-timecourses.csv` and `original-record19-summary-by-channel.csv`: preserved original-scenario outputs.
- `own-start-normalized-timecourses.csv`, `selected-analysis-readouts.csv`, `summary-by-channel.csv`, `late-window-summary.csv`: the explicitly **simulated-first-point** scenario retained under stable legacy filenames.
- `replacement-validation.json`, `analysis-summary.json`: recalculation details and data classification. The legacy word “replacement” in filenames does not mean a new measurement.
- `revisions/user-supplied-record19/`: the original-named pair plus `_sti` simulation pair.
- `../hardware-confirmed-map-2026-10-21/`: current corrected wet-lab pairing and both scenario correlations. Earlier comparison directories retain historical receptor labels.

Run `python simulation-comparison/build_comparison.py --output /path/to/output` with Python, NumPy and Matplotlib to regenerate the two-scenario comparison without modifying source data. Run `python analyze_hardware_test3.py` only in a separate extracted working copy: it rewrites derived files beside the script. Its default selects the simulated CSV; `--original-record19` selects the original scenario. The raw exports are never rewritten by either analysis. `cross-platform-diagnostic.csv` is a historical endpoint diagnostic; use the confirmed-map directory for current receptor pairing.
''',encoding='utf-8')

p=PAT/'README.md'
text=p.read_text(encoding='utf-8')
text += '''
## Original measured and simulated scenarios

`nominal_native5_selected` is the **simulated first-point** scenario: only hardware record19 is substituted. `nominal_native5_original19` uses all original measured waveforms. The stable scenario identifiers are retained for reproducibility. This is not a second experimental run. D4 Pearson r is +0.947733 for the simulated scenario and −0.289698 for the original scenario. The matched-curve figures show both D4 traces; heatmaps are explicitly labeled as the simulated-first-point scenario. Source classification is resolved by the team's simulation confirmation; earlier remeasurement wording is historical only.

The `_sti.json` is a derived simulation report, not the original firmware report. Current source paths use `_sti.csv`. Current stand-alone D4 comparison figures, numeric tables and a reconstruction check are in `../hardware-test3-2026-10-21/simulation-comparison/`. This update changes interpretation and presentation, not any original measurement or correlation formula. Web figures and downloadable CSVs must be synchronized separately before citing this release as their exact current counterpart.
'''
p.write_text(text,encoding='utf-8')

print(json.dumps({'prepared':True,'raw_exports_preserved':52,'scope':'current hardware analysis and simulation provenance'}))
