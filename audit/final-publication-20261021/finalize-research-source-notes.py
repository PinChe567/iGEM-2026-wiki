"""Pin observed dependencies and update publication-copy reproduction notes."""
from pathlib import Path
import datetime,hashlib,json
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];REPO=ROOT/'gitlab/nthu';BASE=REPO/'code/aerosense/wetlab/aerosense-wiki/data'
(BASE/'odor-2026-10-21/analysis/requirements.txt').write_text('numpy==2.4.6\nmatplotlib==3.11.1\nopenpyxl==3.1.5\n',encoding='utf-8')
(BASE/'hardware-test3-2026-10-21/requirements.txt').write_text('numpy==2.4.6\nmatplotlib==3.11.1\n',encoding='utf-8')
notes='''# Reproducing the added odor and cell-reader analyses

These folders retain the archive layout so the scripts find the earlier assay tables and the sibling odor summary. Run from the repository root in a clean Python 3.11 environment. The pinned package versions were verified in the current desktop environments: NumPy 2.4.6 and Matplotlib 3.11.1 in Python 3.11.9, and openpyxl 3.1.5 in the bundled Python 3.12.14 environment. This records current reproducibility dependencies; it does not claim a single frozen historical environment.

Install `code/aerosense/wetlab/aerosense-wiki/data/odor-2026-10-21/analysis/requirements.txt`. Both experiment folders use the same NumPy and Matplotlib versions; the cell-reader folder also has its own two-package requirements file.

The copied small derived tables allow these read-only checks and figure regeneration:

```
python code/aerosense/parts-analysis/integrate_odor_2026_10_21.py --validate-only
python code/aerosense/wetlab/aerosense-wiki/data/odor-2026-10-21/analysis/analyze_change.py --figures-only
python code/aerosense/wetlab/aerosense-wiki/data/odor-2026-10-21/analysis/normalize_vuaa1.py --figures-only
```

The Registry validation independently checks 72 within-stage contrasts and 66 VUAA1-referenced ratios and writes no files. Figure regeneration writes generated SVG/PNG pairs under the odor batch's `figures/change-analysis/`; these are outputs, not new experimental records. `analyze_change.py --only <figure-stems>` limits rendering. Preserve the existing `assets/results/final-test/derived/` directory under the same `aerosense-wiki/` package because both current plotting scripts use the earlier assay summaries there.

For a complete workbook rerun, restore the 12 XLSX inputs to `odor-2026-10-21/raw/` from the canonical research archive and verify `raw-manifest.json`, then run `analysis/analyze_odor.py` before `analysis/analyze_change.py`. Raw XLSX exports are not duplicated into this code checkout. The full point export `derived/observations.csv` is supplied as small evidence for the independent endpoint calculation.

For the cell-reader rerun, restore its original 52 raw CSV/JSON files to `hardware-test3-2026-10-21/raw/` and verify `source-manifest.csv`. Restore the separately retained replacement CSV to `revisions/user-supplied-record19/VUAA1_1min_raw_87187f3e-19.csv`. Keep the original record 19 in `raw/`; the script preserves original and selected analyses separately. Run `analyze_hardware_test3.py` from its batch folder. `--wet-summary` defaults to the sibling odor batch's `derived/change-summary.csv`. The saved user replacement and retained D4 illustrative series have their explicit provenance and limitations in the batch README; they are not silently substituted into immutable originals.

Full Registry text regeneration requires the figures from both plotting commands first. Then run `python code/aerosense/parts-analysis/integrate_odor_2026_10_21.py`. The publication copy locates `docs/aerosense/parts/` automatically, imports its derived evidence, and preserves hash-verified CDN attachment links in `publication-links.json`. It writes only local preparation files and does not submit to the Registry. Generated local figures need not be committed as duplicate runtime media because the documentation uses verified official CDN URLs.

Current source publication does not itself publish the additional research files in the existing Zenodo DOI, establish biological replication, or validate hardware calibration for living-cell measurements. Raw/provenance files remain in the separate canonical research archive until its corresponding release is published.
'''
(BASE/'README.md').write_text(notes,encoding='utf-8',newline='\n')
p=REPO/'code/aerosense/README.md';t=p.read_text(encoding='utf-8')
t=t.replace('25 parts, collection, form and index; 28 Markdown files, three small derived characterization CSVs and a [figure builder](parts-analysis/build_registry_figures.py). Official iGEM figure URLs are retained. GitLab availability does not mean Registry submission.','25 parts, collection, form and index; 28 Markdown files, current derived characterization/provenance attachments and [reproduction notes](wetlab/aerosense-wiki/data/README.md). Official iGEM figure URLs are retained. GitLab availability does not mean Registry submission.')
t=t.replace('Three explicit derived characterization attachments accompany the documents: P2 well summary, P2 control contrasts and microscopy condition counts (58,329 bytes total, identical to the canonical tables). They are sufficient for the two new comparison figures; no original RFU exports, TIFFs, full time series or display-image copies are included in `docs/`.','The earlier plate summaries and microscopy counts remain alongside the additional within-stage contrasts, VUAA1-referenced ratios and provenance attachments. The original source identifiers remain in the data; displayed Test 1 and Test 2 calculations are distinct. Original XLSX exports, TIFFs and raw cell-reader files remain in the canonical research archive. Current Registry figures use byte-verified official CDN URLs.')
t=t.replace('The full archive is prepared for Zenodo but has no published DOI or public data URL yet. It holds raw/full data, saved fields and processed research tables; canonical paths are recorded in the manifest. Source availability does not establish complete data availability or successful reproduction of every study.','The website links an existing [Zenodo record](https://doi.org/10.5281/zenodo.23469212). Additional current batches are prepared in the local research archive; their presence in this code checkout does not establish that they are included in that existing record. The archive holds raw/full data, saved fields and processed research tables; canonical paths are recorded in the manifest. Source availability does not establish complete data availability or successful reproduction of every study.')
t+='\n\n## Additional odor and cell-reader source\n\nThe sibling [experimental folders](wetlab/aerosense-wiki/data/README.md) include current analysis source, observed-version dependency pins and small derived evidence. The Registry importer has a read-only `--validate-only` mode that checks all 72 corrected wells and 66 reference ratios from the copied point export. The receptor coding sequences retain Design-only status; reference normalization is exploratory and does not measure transfection efficiency. Raw input restoration is required for full original-measurement reruns.\n'
p.write_text(t,encoding='utf-8',newline='\n')
p=REPO/'code/aerosense/wetlab/reproduction-readme.txt';t=p.read_text(encoding='utf-8')
t+='\n\nAdditional odor and cell-reader source\nSee aerosense-wiki/data/README.md for the sibling experiment layout, exact verified dependency versions, figure-only reproduction, and Registry read-only validation. Original XLSX and cell-reader CSV/JSON inputs require restoration from the canonical archive; the code checkout contains small derived evidence and input manifests.\n'
p.write_text(t,encoding='utf-8',newline='\n')
print('Pinned 3 observed odor dependencies, 2 cell-reader dependencies; added repository reproduction notes and updated source-overview scope.')
