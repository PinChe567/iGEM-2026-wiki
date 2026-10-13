"""Build the public Hardware reproduction attachment without private files.

Usage: python package_source.py --output /path/to/aerosense-source.zip
The destination must be outside this delivery folder. No files are deleted.
"""
from pathlib import Path
import argparse
import hashlib
import io
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOFTWARE = ROOT / '03_software'
SIMULATION_INPUTS = {
    'airflow/code/data/operating_sweep_config.json',
    'airflow/code/data/operating_refinement_config.json',
    'airflow/code/data/operating_selected_check_config.json',
    'optics/code/data/VEMD5060X01_response_source.json',
    'optics/code/data/lee101_source.json',
    'optics/code/data/geometry_provenance.json',
    'membrane/code/data/sources.json',
    'membrane/code/data/decision.json',
}


def source_files():
    names = [
        '.gitignore', 'README.md', 'requirements.txt', 'package_source.py',
        'test_software.py', 'test_model.py', 'test_calibration.cjs',
        'test_correction.cjs', 'test_ui.cjs', 'firmware/platformio.ini',
        'firmware/src/main.cpp', 'firmware/src/config.example.h',
        'server/server.py', 'analysis/dlia.py', 'analysis/odor_model.py',
        'evidence/software_checks.json',
    ]
    paths = [SOFTWARE / name for name in names]
    for folder in ['firmware/data', 'guides', 'templates']:
        paths.extend(p for p in (SOFTWARE / folder).rglob('*') if p.is_file())
    paths.append(ROOT / '02_simulation/README.md')
    for model in ['optics', 'airflow', 'membrane']:
        base = ROOT / '02_simulation' / model
        paths.append(base / 'README.md')
        for folder in ['code', 'results']:
            paths.extend(p for p in (base / folder).rglob('*')
                         if p.is_file() and '__pycache__' not in p.parts
                         and p.suffix.lower() not in {'.pyc', '.exe', '.dll', '.pdb'}
                         and ('data' not in p.relative_to(base).parts
                              or p.relative_to(ROOT / '02_simulation').as_posix() in SIMULATION_INPUTS))
    for name in ['quick_check.py', 'plot_validation.py', 'import_ui_json.py',
                 'test_analysis.py', 'requirements.txt', 'README.md',
                 'Validation_Plan_EN.md', 'Validation_Plan_ZH.md']:
        paths.append(ROOT / '07_validation' / name)
    paths.extend((ROOT / '07_validation/templates').glob('*.csv'))
    for p in sorted(set(paths)):
        if not p.is_file() or p.is_symlink() or not p.resolve().is_relative_to(ROOT):
            raise ValueError(f'Unsafe or missing source: {p}')
        yield p


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    target = args.output.resolve()
    if target.is_relative_to(ROOT):
        raise ValueError('Save the upload archive outside the delivery folder.')
    files = {}
    for p in source_files():
        rel = p.relative_to(ROOT).as_posix()
        content = p.read_bytes()
        if p.suffix.lower() in {'.md', '.py', '.js', '.cjs', '.cpp', '.h', '.json', '.ini', '.ps1', '.cs', '.txt'}:
            text = content.decode('utf-8-sig')
            if re.search(r'(?:glpat-|ghp_)[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', text):
                raise ValueError(f'Possible credential in {rel}')
            if p.parent.name == 'guides':
                text = re.sub(r'!\[([^\]]*)\]\(\.\./evidence/uart_schematic_crop\.png\)',
                              r'\1 (vendor drawing omitted; use the wiring table)', text)
            # Public source uses LF to make archive hashes platform-independent.
            content = text.replace('\r\n', '\n').encode('utf-8')
        files[rel] = content
    files['README.md'] = b'''# AeroSense Hardware source

This archive contains device software and three simulation models.
Extract all files into one directory. Preserve their relative paths.

- 03_software/README.md: firmware, UI, server, tests, and setup.
- 02_simulation/README.md: optics, airflow, and membrane models.
- 07_validation/: measured-data analysis and blank templates.

Each model includes code, required input parameters, and CSV results.
Generated numerical fields are omitted to fit the GitLab 10 MB file limit.
Read the fresh-reproduction commands below before running plot commands.
Full numerical replay is expensive. The local delivery folder retains saved
fields for fast offline plotting. Do not mix old cached JSON with absent NPZ.
Published PNG/PDF/MP4, CTB, vendor drawings, private configuration,
databases, build binaries, and tool caches are omitted.
Some README links point to media or manuals in the full delivery folder.
The program inputs required for fresh numerical replay are included.

This is the Hardware reproduction attachment, not a Best Software entry.
No physical board, optical, cell, or participant results are claimed.
Keep BOARD_VALIDATED=false until electrical checks pass.
The Wiki repository license remains unchanged. Dependencies retain their
own licenses. Source references remain in the model README files.

## Fresh numerical replay

Run these commands from this archive root in the listed order.
Airflow needs Windows and the .NET Framework C# compiler. No CAD or STL
input is needed. Do not copy cached solve JSON into this fresh source tree.
The CSV files include reference results. Copy any values that you want to
compare before replay, because the scripts replace result CSV files.
Runtime and file hashes are not expected to reproduce byte for byte.

```text
python -m pip install -r 02_simulation/airflow/code/requirements.txt
python -m pip install -r 02_simulation/optics/code/requirements.txt
python -m pip install -r 02_simulation/membrane/code/requirements.txt
python -B 02_simulation/airflow/code/reproduce.py --solve --video
python -B 02_simulation/optics/code/run.py --verify --run --maps --convergence --standard --workers 4
python -B 02_simulation/optics/code/leakage_sweep.py --workers 4
python -B 02_simulation/optics/code/signal_model.py
python -B 02_simulation/optics/code/run.py --plots --video
python -B 02_simulation/optics/code/filter_compare_model.py --geometry --video
python -B 02_simulation/optics/code/validate_filter_comparison.py
python -B 02_simulation/membrane/code/run.py
python -B 02_simulation/membrane/code/integrate_airflow.py
python -B 02_simulation/membrane/code/plot.py
```

The full-replay dependencies were inspected during source packaging.
Packaging did not rerun the expensive MC/CFD solvers. The retained local
fields were used for the verified figure and movie rebuilds.
'''
    manifest = {name: {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
                for name, data in sorted(files.items())}
    files['source_manifest.json'] = (json.dumps(manifest, indent=2, ensure_ascii=False)+'\n').encode('utf-8')
    target.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name, data in sorted(files.items()):
            info = zipfile.ZipInfo(name, (2026, 10, 11, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data, compresslevel=9)
    if target.stat().st_size >= 10_000_000:
        raise ValueError('Source archive exceeds the GitLab 10 MB file limit.')
    with zipfile.ZipFile(target) as z:
        if z.testzip() is not None:
            raise ValueError('Archive integrity check failed.')
        for name, row in manifest.items():
            if hashlib.sha256(z.read(name)).hexdigest() != row['sha256']:
                raise ValueError(f'Archive content mismatch: {name}')
    print(json.dumps({'file': str(target), 'files': len(files), 'bytes': target.stat().st_size,
                      'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}, indent=2))


if __name__ == '__main__':
    main()
