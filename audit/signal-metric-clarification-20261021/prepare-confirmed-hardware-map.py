from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[3]
DATA=ROOT/'zenodo-release/aerosense-wiki/data'
OLD=DATA/'hardware-wetlab-pattern-comparison-2026-10-21'
NEW=DATA/'hardware-confirmed-map-2026-10-21'
NEW.mkdir(exist_ok=True)
source=(OLD/'analyze_patterns.py').read_text(encoding='utf8')
assert "WELLS = ['A04', 'A09', 'A10', 'A11']" in source
source=source.replace("WELLS = ['A04', 'A09', 'A10', 'A11']", "WELLS = ['A10', 'A09', 'A04', 'A11']")
source=source.replace("['pearson_level','pearson_first_difference']", "['pearson_level','spearman_level']")
source=source.replace("'First differences · four intervals'", "'Signal ranks · five time points'")
source=source.replace("label='Pearson r',ticks", "label='Pearson r' if metric=='pearson_level' else 'Spearman ρ',ticks")
source=source.replace("'pairwise-correlations-mobile'", "'pairwise-pearson-spearman-mobile'").replace("'pairwise-correlations'", "'pairwise-pearson-spearman'")
source=source.replace("def save(fig, name):", "def save(fig, name):\n        name += '-confirmed-map'")
(NEW/'analyze_patterns.py').write_text(source,encoding='utf8')
for name in ['verify_patterns.py','requirements.txt']:
    shutil.copyfile(OLD/name,NEW/name)
(NEW/'README.md').write_text('''# Confirmed Test 2 receptor-map correction\n\nThe user explicitly confirmed the supplied F1 receptor order as the correction to Test 2 on 2026-10-21. This edition preserves every measured value and hardware assignment and changes the corresponding plate wells: D1 Or35a uses A10; D2 Or85b uses A09; D3 Or98a uses A04; D4 ORCO only uses A11. Historical outputs remain in hardware-wetlab-pattern-comparison-2026-10-21 and signal-metric-clarification-2026-10-21 and must not be used as the current receptor interpretation.\n\nThe fixed five-point nominal comparison, source-record sensitivities, controls and original actual timestamps are unchanged. The heatmap shows Pearson levels and Spearman levels at the same five points; first-difference metrics remain in the CSV files. No smoothing, lag selection or significance testing is added.\n\nRestore the archive's aerosense-wiki/data folder. Run:\n\n```sh\npython -m pip install -r requirements.txt\npython analyze_patterns.py --archive-root /path/to/zenodo-release/aerosense-wiki/data --output /path/to/rebuilt\npython verify_patterns.py --archive-root /path/to/zenodo-release/aerosense-wiki/data --output /path/to/rebuilt\n```\n''',encoding='utf8')
proof={'correction':'User explicitly confirmed new F1 order as correct Test 2 order. Numeric values unchanged; no relabeling of hardware channels.',
       'old_wetlab_wells':['A04','A09','A10','A11'],'corrected_wetlab_wells':['A10','A09','A04','A11'],
       'hardware_constructs':['Or35a + ORCO','Or85b + ORCO','Or98a + ORCO','ORCO only'],
       'prior_script_sha256':hashlib.sha256((OLD/'analyze_patterns.py').read_bytes()).hexdigest(),
       'corrected_script_sha256':hashlib.sha256((NEW/'analyze_patterns.py').read_bytes()).hexdigest(),'historical_batch_unchanged':True}
(NEW/'mapping-correction-provenance.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf8')
print(NEW)
