"""Apply the confirmed Software repository layout after exact old-copy removal."""
from pathlib import Path
import datetime, hashlib, json, os, re

A = Path(__file__).resolve().parent
R = A.parents[2]
REPO = R / 'gitlab/aerosense-software'
DOCS = R / 'registry_docs_v2'
URL = 'https://gitlab.igem.org/2026/software/nthu/aerosense'
PAT = re.compile(r'https://gitlab\.igem\.org/2026/nthu(?=/-/(?:blob|raw|tree)/main/(?:code/aerosense|docs/aerosense)(?:/|[\s)#?]|$))')
if (A/'approved-mit-license-application.json').exists():
    raise SystemExit('Historical migration has finished and MIT is now approved. Do not replay its pre-license README templates; use the frozen Software sources and refresh-software-source-manifest.py.')

def native(p):
    return Path('\\\\?\\' + str(p.absolute())) if os.name == 'nt' else p

def sha(p):
    return hashlib.sha256(native(p).read_bytes()).hexdigest()

def write(p, text):
    native(p).write_text(text, encoding='utf-8', newline='\n')

receipt = json.loads((A/'executed-wiki-software-copy-cleanup.json').read_text(encoding='utf-8-sig'))
assert receipt['removed_files'] == 1220 and receipt['canonical_and_software_hashes_rechecked']
manifest_path = REPO/'code/aerosense/source-manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
changed=[]
for p in [REPO/row['path'] for row in manifest['files']] + sorted(DOCS.glob('*.md')):
    b = native(p).read_bytes()
    try: text=b.decode('utf-8')
    except UnicodeDecodeError: continue
    updated, count=PAT.subn(URL, text)
    if count:
        write(p, updated)
        changed.append({'path':p.relative_to(R).as_posix(),'old_sha256':hashlib.sha256(b).hexdigest(),'sha256':sha(p),'replacements':count})

root_readme = '''# AeroSense software and research source

AeroSense combines an odorant-receptor research platform, a fluorescence-reader prototype, scientific analysis scripts and educational games. This repository contains the editable sources and methods used in that work. It is not a validated end-to-end odor detector, and publishing the source does not publish all inputs or establish full reproducibility.

The project context and results are on the [NTHU wiki](https://2026.igem.wiki/nthu/). The website and its deployment pipeline remain in the [Wiki repository](https://gitlab.igem.org/2026/nthu). This separate Software repository keeps the original `code/aerosense/` and `docs/aerosense/` layout so documented source paths remain stable.

## Find the appropriate workflow

| Area | Starting point | Required inputs or limits |
|---|---|---|
| Reader firmware and interface | [Hardware software guide](code/aerosense/hardware/03_software/README.md) | Board bring-up is not validated; `BOARD_VALIDATED=false` remains in the example configuration. |
| Airflow, optics and membrane calculations | [Simulation guide](code/aerosense/hardware/02_simulation/README.md) | Research tables, saved fields and exported results are separate from editable settings. |
| Microscopy and fluorescence assays | [Wet-lab source](code/aerosense/wetlab/README.md) and [added-analysis guide](code/aerosense/wetlab/aerosense-wiki/data/README.md) | Restore the stated instrument exports, provenance records and derived inputs before rerunning. |
| Receptor engineering | [Execution runbook](code/aerosense/receptor-engineering/handover/RUNBOOK_zh.txt) | Individual workflows require their own dependencies, datasets, models and sometimes GPU/CUDA. |
| Educational games | [Odor Pixel Suite](code/aerosense/education/odor-pixel-suite/README.md) | The game models are teaching tools, not experimental evidence. |
| Parts documentation | [Document index](docs/aerosense/parts/00_INDEX.md) | Editable methods and source text are distinct from a successful Registry submission. |

## Installation and checks

There is no single environment that runs every workflow. Follow each linked guide in an isolated working directory. The commands below describe the source interfaces; they do not assert that a new dependency installation or the entire repository has been tested successfully.

Odor Pixel Suite declares Node.js 20 or newer and npm workspaces:

```sh
cd code/aerosense/education/odor-pixel-suite
npm ci
npm run dev:wiki
npm run build:wiki
npm test
npm run typecheck
```

The offline wiki client and the optional online client/server are different targets. The optional online service needs its documented database and environment settings; do not put populated credentials in this repository. Public game artwork uses verified official iGEM CDN URLs.

For the added odor/cell-reader analyses, install the pinned dependencies in a clean Python environment:

```sh
python -m pip install -r code/aerosense/wetlab/aerosense-wiki/data/odor-2026-10-21/analysis/requirements.txt
```

NumPy 2.4.6 and Matplotlib 3.11.1 were verified with Python 3.11.9; openpyxl 3.1.5 was verified in a separate Python 3.12.14 environment. These are recorded current dependencies, not a claim of one frozen historical environment. After restoring the documented inputs and relative layout, the analysis guide describes these entry points:

```sh
python code/aerosense/parts-analysis/integrate_odor_2026_10_21.py --validate-only
python code/aerosense/wetlab/aerosense-wiki/data/odor-2026-10-21/analysis/analyze_change.py --figures-only
python code/aerosense/wetlab/aerosense-wiki/data/odor-2026-10-21/analysis/normalize_vuaa1.py --figures-only
```

The source-only checkout does not include the raw workbooks or derived CSV/JSON inputs needed by these commands. The firmware has a PlatformIO configuration for ESP32, but a build or DEMO result does not establish safe wiring, successful board bring-up or cellular measurement performance. Hardware operation requires the separate documented physical checks.

## Evidence, data and known gaps

[source-manifest.json](code/aerosense/source-manifest.json) lists retained code/documentation sources and their hashes. Its excluded-artifact entries preserve provenance for data and documents stored elsewhere. Local canonical paths are preservation records, not public downloads. The [archive status](docs/aerosense/archive-status.md) distinguishes verified official attachments from the complete research package, which is prepared locally and has not yet been deposited publicly. An earlier DOI did not resolve in the latest public check and is not used as a download claim.

Research datasets, model weights, ZIP packages, generated scientific figures, binary documents and printable exports are not committed here. Direct CDN links identify individual verified attachments. Historical README paths to omitted data or generated outputs describe what must be restored; source publication is not a complete data-package release.

Test 1 uses a four-acquisition peak calculation. Test 2 uses within-stage changes with a baseline-disturbance subtraction. Its construct-matched VUAA1 reference is an exploratory, vehicle-anchored ratio, not transfection efficiency or proof of receptor activation. Each underlying condition has one well; comparisons combine separate wells without independent biological replication. Fluorescein calibration does not establish a valid calibration transfer to living-cell measurements.

The matching PN–KC–MBON training engine, fitted preprocessing, fold tables and seeds were not supplied. A separate four-feature model and augmentation scripts do not fill that gap. Synthetic augmented rows are not biological replicates. No successful complete hardware deployment, fresh installation, or end-to-end reproduction is asserted by this source preparation.

## Authorship, AI assistance and review

NTHU FLY iGEM 2026 supplied the project work and research records. AI assistance was used for source organization, code and numerical checks, figure preparation, translation and editorial revisions. Those activities do not create new experimental observations or replace scientific review. Follow the [responsible AI instructions](.claude/RESPONSIBLE_AI_USE.md), preserve source/provenance distinctions and review changes against the recorded evidence before use. Attribution and scientific responsibility remain with the human contributors; this summary does not assign authorship of third-party components.

## License status

The repository's initial Apache 2.0 template [LICENSE](LICENSE) is retained while the team confirms its own software licensing choice. This preparation does not treat a template or the Wiki's Creative Commons license as a newly authorized grant for team-origin software. Publication of the final team-license statement remains pending that decision. Third-party components retain their own notices, summarized in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
'''
write(REPO/'README.md',root_readme)
write(REPO/'.gitattributes', '# Preserve scientific and documentation source bytes across platforms.\n/code/aerosense/** -text\n/docs/aerosense/** -text\n')
write(REPO/'.gitignore', '''# Generated or local-only work; source inputs and schemas remain visible.
**/node_modules/
**/__pycache__/
**/*.pyc
**/.venv/
**/venv/
**/.pio/
**/.cache/
**/dist/
**/build/
**/coverage/
**/test-results/
**/playwright-report/
**/.env
**/.env.*
!**/.env.example
**/aerosense_config.h
**/*.sqlite
**/*.sqlite-wal
**/*.sqlite-shm
**/*.db
**/*.pem
**/*.key
''')
write(REPO/'THIRD_PARTY_NOTICES.md','''# Third-party notices and licensing boundaries

Third-party source, documentation and dependency notices retain their original scope. They do not by themselves authorize a license for the team's separate contributions. The root license decision is described in [README.md](README.md).

| Component | Retained notice | Scope |
|---|---|---|
| OpenPOM | [MIT notice](code/aerosense/receptor-engineering/vendor/openpom_5434c4b7bade/LICENSE) | Copyright Aryan Amit Barsainyan; applies to the supplied OpenPOM source. |
| US-align | [Permission and reference notice](code/aerosense/receptor-engineering/tools/USalign/LICENSE) | Retain the notice and cited reference information when copying substantial portions. |
| Three.js | [MIT notice](code/aerosense/visualization/aerosense-wiki/js/vendor/LICENSE.three.js.txt) | Applies to the third-party Three.js component. |
| Thinking Orbs | [MIT notice](code/aerosense/visualization/aerosense-wiki/assets/licenses/thinking-orbs.txt) | Copyright Jakub Antalik; applies to that visual component. |

Package manifests and lockfiles identify external JavaScript/Python/tool dependencies; those dependencies retain their own licenses when installed. Their presence in a manifest is not a claim of team authorship. Supplier documents, research papers, externally sourced data, model weights and publicly hosted assets are not relicensed by this repository. The Sölter thesis full text remains excluded from the publication selection.
''')

p=REPO/'code/aerosense/README.md'
t=p.read_text(encoding='utf-8').replace('The repository license is unchanged.', 'The initial Software repository license template is unchanged while the team license decision remains pending; see the [repository license status](../../README.md#license-status).')
t=t.replace('The editable website is under [site](../../site/), with its build pipeline in [.gitlab-ci.yml](../../.gitlab-ci.yml).', 'The editable website remains in the [Wiki site tree](https://gitlab.igem.org/2026/nthu/-/tree/main/site), with its [Wiki build pipeline](https://gitlab.igem.org/2026/nthu/-/blob/main/.gitlab-ci.yml).')
write(p,t)
p=REPO/'code/aerosense/wetlab/aerosense-wiki/data/README.md'
t=p.read_text(encoding='utf-8')
t=t.replace('The copied small derived tables allow these read-only checks and figure regeneration:', 'After restoring the documented derived tables and provenance files from the research archive, these entry points provide read-only checks and figure regeneration:')
t=t.replace('The full point export `derived/observations.csv` is supplied as small evidence for the independent endpoint calculation.', 'The full point export `derived/observations.csv` is a required external input for the independent endpoint calculation; it is not supplied in this source-only checkout.')
t=t.replace('The publication copy locates `docs/aerosense/parts/` automatically, imports its derived evidence, and preserves hash-verified CDN attachment links in `publication-links.json`.', 'The publication copy locates `docs/aerosense/parts/` automatically. Restore the documented derived evidence and the archived `publication-links.json` attachment map before text regeneration; the generator preserves its hash-verified CDN attachment links.')
write(p,t)

art_source=R/'aerosense-wiki/game/apps/wiki-client/games/labyrinth/src/art.ts'
art_dest=REPO/'code/aerosense/education/odor-pixel-suite/apps/wiki-client/games/labyrinth/src/art.ts'
art_before=sha(art_dest)
native(art_dest).write_bytes(native(art_source).read_bytes())
assert sha(art_dest)==sha(art_source)
assert '.svg?raw' not in art_dest.read_text(encoding='utf-8')
for p in sorted(DOCS.glob('*.md')):
    target=REPO/'docs/aerosense/parts'/p.name
    assert target.exists(),target
    native(target).write_bytes(p.read_bytes())

out={'completed_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'software_repository':URL,'routing_changes':changed,'game_art':{'source':art_source.relative_to(R).as_posix(),'destination':art_dest.relative_to(REPO).as_posix(),'previous_sha256':art_before,'sha256':sha(art_dest),'uses_verified_official_cdn':True},'registry_markdown_synced':len(list(DOCS.glob('*.md'))),'license_template_changed':False,'manifest_refresh_pending':True,'git_operations':0}
(A/'software-source-routing-receipt.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in out.items() if k!='routing_changes'},ensure_ascii=False))
