"""One-time, scoped documentation organization; scientific inputs stay unchanged."""
from pathlib import Path
from datetime import datetime, timezone
import csv, hashlib, html, json, os, shutil
from urllib.parse import quote

WORK = Path(__file__).resolve().parents[3]
ROOT = WORK / 'zenodo-release'
AUDIT = Path(__file__).resolve().parent
GUIDE = ROOT / '00-guide'
PROV = ROOT / '00-provenance'
DATE = '2026-10-21'

def digest(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda: f.read(8*1024*1024), b''): h.update(b)
    return h.hexdigest()

def write(rel, text):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text.rstrip() + '\n', encoding='utf-8')

def table(rel, rows, fields):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open('w', encoding='utf-8-sig', newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)

def files_under(rel):
    p=ROOT/rel
    if p.is_file(): return [p]
    return [q for q in p.rglob('*') if q.is_file()]

def main():
    assert ROOT.resolve().parent == WORK.resolve()
    GUIDE.mkdir(exist_ok=True); PROV.mkdir(exist_ok=True)
    # Management records only: all six research roots remain at their current paths.
    moved=[]
    for name in ['availability-links.csv','dependency-files.csv','excluded-files.csv',
                 'external-references.csv','published-video-replacements.json',
                 'reproduction-source-supplement.json']:
        src=ROOT/name; dst=PROV/name
        if src.exists():
            assert not dst.exists(), str(dst)
            before=digest(src);src.rename(dst);assert digest(dst)==before
        assert dst.is_file()
        moved.append({'old_path':name,'current_path':'00-provenance/'+name,
                      'purpose':'Historical source/provenance record; original bytes retained'})
    table('00-provenance/DOCUMENT_PATHS.csv',moved+[
        {'old_path':'PENDING.txt','current_path':'00-guide/KNOWN_GAPS.txt','purpose':'Rewritten current gaps; earlier event evidence remains in summary.json'},
        {'old_path':'reproduction-readme.txt','current_path':'00-guide/REPRODUCE.txt','purpose':'Rewritten current workflow guide; original research scripts unchanged'}
    ],['old_path','current_path','purpose'])

    # Preserve an existing, non-identifying aggregate that was absent from the deposit.
    source=WORK/'aerosense-wiki/assets/education/early-survey-summary.csv'
    dest=ROOT/'aerosense-wiki/assets/education/early-survey-summary.csv'
    if not dest.exists(): shutil.copy2(source,dest)
    assert digest(source)==digest(dest)
    with (ROOT/'manifest.csv').open(encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f);fields=reader.fieldnames;mapping=list(reader)
    destrel=dest.relative_to(ROOT).as_posix()
    if not any(x['destination_relative']==destrel for x in mapping):
        mapping.append(dict(zip(fields,[
            source.relative_to(WORK).as_posix(),destrel,'education-reported-aggregate',digest(dest),
            str(dest.stat().st_size),datetime.fromtimestamp(source.stat().st_mtime,timezone.utc).isoformat(),
            'education.html;engineering.html','Existing local supporting aggregate; no direct current Wiki download link'
        ])))
        table('manifest.csv',mapping,fields)

    tech=json.loads((WORK/'aerosense-wiki/audit/coverage-tech-current.json').read_text(encoding='utf-8-sig'))['coverage']
    labels={
        'test1':('01','Test 1 氣味篩選 / Odor screen','32 original instrument CSVs; 3,840 readings; filename map retained','Raw exports present; acquisition metadata incomplete'),
        'test2':('02','Test 2 氣味篩選 / Odor screen','12 XLSX exports; 72 wells; 1,440 readings; current endpoint-change and reference analyses','Raw exports present; acquisition metadata incomplete'),
        'complete-curves':('03','完整時間曲線 / Complete time courses','All 5,280 readings across Test 1 and Test 2, plus reconstructed curves and normalization diagnostics','Inputs, code and retained outputs present'),
        'microscopy':('04','轉染與顯微影像 / Transfection microscopy','Original microscopy images, current team-confirmed transfect.xlsx, segmentation and control comparisons','Images, workbook and analysis present; acquisition metadata incomplete'),
        'lightsheet':('05','果蠅光片影像 / Light-sheet imaging','TH, GH146 runs 03 and 04 each contain 696 TIFF frames; ROI traces, movies and corrected analysis','Current runs present; historical GH146 run 02 raw stack and Settings incomplete'),
        'fluorescein-calibration':('06','螢光硬體校正 / Fluorescein calibration','58 acquisitions, 116 paired CSV/JSON exports; unified calibration and diagnostic outputs','Inputs, current code and retained outputs present'),
        'optical-simulation-measurement':('07','光學模擬與量測 / Optical validation','Measurement-source CSV, simulation-source JSON and comparison analysis','Inputs, current code and retained outputs present'),
        'living-cell-hardware':('08','硬體活細胞量測 / Living-cell hardware','26 records with 52 original exports; time-series and late-window summaries','Original exports and descriptive analyses present'),
        'hardware-wetlab-patterns':('09','硬體與濕實驗圖樣比較 / Pattern comparison','Reference-pattern comparisons, source hashes and independent numerical verification','Inputs, code and retained outputs present; descriptive comparison'),
        'hardware-design-and-physics':('10','硬體設計、CAD 與物理模擬 / Design and simulations','CAD, print files, BOM, firmware, simulation sources and hardware figure sources','Supplied design, source and simulation materials present'),
        'receptor-engineering':('11','受體工程與分子模型 / Receptor engineering','Benchmark inputs, fixed folds, predictions, scripts, environments and processed MD outputs','Partial end-to-end reproducibility; selected original inputs and weights absent'),
        'odor-decoder':('12','嗅覺解碼模型 / Odor decoder','Current UCI/DoOR model manuscript, earlier decoder records and separate feature-table/augmentation sources','Partial; matching Brian2 training, checkpoints and preprocessing package absent'),
    }
    entries=[]
    for t in tech:
        num,title,description,status=labels[t['id']]
        if t['id']=='odor-decoder':
            t['raw']=['aerosense-wiki/data/notion-model-2026-10-21/README.md',
                      'aerosense-wiki/data/notion-model-2026-10-21/sources/model-source.md']+t['raw']
            t['limitations']=['The current UCI/DoOR manuscript and figure sources are preserved. Matching Brian2 training code, checkpoints, complete feature/response exports, seeds and fold identifiers are not supplied. Earlier KT/decoder records and eNose feature-table tools are separate historical evidence.']
        entries.append(dict(dataset_id=num+'-'+t['id'],title=title,pages=t['pages'],description=description,
                            raw=t['raw'],code=t['code'],outputs=t['outputs'],status=status,
                            notes=' '.join(t['limitations']).replace('in PENDING.','in 00-guide/KNOWN_GAPS.txt.')))
    def extra(num,slug,title,pages,description,raw,code,outputs,status,notes=''):
        entries.append(dict(dataset_id=num+'-'+slug,title=title,pages=pages,description=description,
                            raw=raw,code=code,outputs=outputs,status=status,notes=notes))
    pub='reproduction-source/gitlab-publication-review-20261021/docs/aerosense/'
    extra('13','education','教育教材與評量 / Education',['education','engineering'],
          'Published teaching PDFs, original teaching slides and an early n=28 reported survey aggregate',
          ['aerosense-wiki/resources/education/source/','aerosense-wiki/assets/education/early-survey-summary.csv'],[],
          [pub+'education/','aerosense-wiki/assets/education/'],
          'Teaching documents present; participant-level assessment data not found',
          'The early aggregate is not the later 300-person survey and is not a row-level export. Workshop n=15 underlying evaluation records were not found.')
    extra('14','human-practices','利害關係人與使用者回饋 / Human Practices',['human-practices'],
          'Integrated Human Practices and FITI reports, field documentation, anonymized public usability materials',
          ['aerosense-wiki/assets/human-practices/'],[],[pub+'human-practices/',pub+'hardware/usability/'],
          'Public reports and supporting materials present',
          'Reports and photographs are supporting documentation; they are not a participant-level interview dataset. Anonymized public derivatives and original feedback files in historical source folders both remain; this review has not cleared every original for public deposit.')
    extra('15','entrepreneurship','創業計畫與財務假設 / Entrepreneurship',['entrepreneurship'],
          'Business plan, editable financial spreadsheet, PDF preview and implementation guidance',
          [pub+'entrepreneurship/financial-plan.xlsx'],[],
          ['aerosense-wiki/resources/entrepreneurship/',pub+'entrepreneurship/'],
          'Referenced documents and editable financial model present',
          'Financial projections are assumptions, not realized sales or validated market demand.')
    extra('16','sustainability','永續情境與估算 / Sustainability',['sustainability'],
          'Unfilled impact-assessment input and equation template',
          ['aerosense-wiki/assets/sustainability/impact-model-inputs.csv'],[],
          ['aerosense-wiki/assets/sustainability/'],
          'Scenario-input template present; measured inputs not provided','The supplied CSV identifies inputs as not measured/provided. It is an assessment template, not measured field impact or a complete life-cycle inventory.')
    extra('17','parts','元件、質體與登錄 / Parts and plasmids',['parts','contribution'],
          'Registry-related tables, plasmid diagrams and source evidence',
          [pub+'parts/','aerosense-wiki/plasmid/'],[],['aerosense-wiki/assets/parts/',
          'reproduction-source/software-source-before-migration-20261021/docs/aerosense/parts/',
          'reproduction-source/backend-engineering-registry-publication-20261021/sources/docs/aerosense/parts/',
          'reproduction-source/registry-publication-footer-cleanup-20261021/sources/docs/aerosense/parts/'],
          'Supplied tables, diagrams and registry evidence present','A complete construct sequence export in FASTA/GenBank/SnapGene format was not found in this archive.')
    extra('18','protocols','實驗方法與膠圖 / Protocols and gel evidence',['experiments','results'],
          'Archived experimental methods, cloning images and electrophoresis originals',
          ['aerosense-wiki/wetlab results/DNA_electrophoresis/','aerosense-wiki/wetlab results/cloning/'],[],
          ['aerosense-wiki/assets/experiments/',pub+'wetlab/'],
          'Supplied methods and images present')
    extra('19','engineering','工程變更與來源證據 / Engineering evidence',['engineering','hardware'],
          'CAD source mappings, historical iteration figures and engineering evidence guide',
          ['aerosense-wiki/data/engineering-source-evidence-2026-10-21/'],[],
          ['aerosense-wiki/data/engineering-source-evidence-2026-10-21/engineering-evidence-guide.pdf'],
          'Current evidence guide and source mappings present')
    extra('20','reuse','可重用範本 / Reuse templates',['contribution'],
          'Measurement and stakeholder-decision CSV templates with schema and instructions',
          ['aerosense-wiki/assets/contribution/templates/'],[],[],
          'Templates and schema present','Blank example templates are not collected experimental measurements.')
    extra('21','anatomy','參考神經解剖 / Reference neuroanatomy',['description','model'],
          'MaleCNS reference geometry, plotting sources and attribution',
          ['aerosense-wiki/assets/description/neuroanatomy/malecns/'],[],
          ['aerosense-wiki/assets/description/neuroanatomy/malecns/'],
          'Supplied third-party reference geometry and attribution present',
          'Literature reference anatomy; not the team’s imaged light-sheet specimen.')
    extra('22','software-history','軟體來源與發布對照 / Software source preservation',['software','engineering','hardware'],
          'Preserved software source revisions and canonical source mappings',[],
          ['reproduction-source/hardware-odor-backend-20261021/SOURCE-MAPPING.json','reproduction-source/'],[],
          'Mapped source revisions present',
          'Publication snapshots are sparse, distinct revisions. They are not multiple interchangeable complete standalone projects.')
    extra('23','model-figures','模型原稿與圖表來源 / Model manuscripts and figures',['model','engineering'],
          'Captured Model and Engineering manuscripts, editable Markdown, extraction helper and scientific figure assets',
          ['aerosense-wiki/data/notion-model-2026-10-21/sources/model-blocks.json','aerosense-wiki/data/notion-model-2026-10-21/sources/engineering-blocks.json'],
          ['aerosense-wiki/data/notion-model-2026-10-21/sources/extract_notion_source.py'],
          ['aerosense-wiki/data/notion-model-2026-10-21/'],
          'Manuscripts, figure assets and extraction source present','The helper recreates manuscript files, not model scores. Model-training inputs, fitted preprocessing and checkpoints are separate missing items.')

    # Fail instead of inventing paths or silently dropping missing entries.
    for e in entries:
        for role in ['raw','code','outputs']:
            for rel in e[role]: assert (ROOT/rel).exists(), (e['dataset_id'],role,rel)
    rows=[];coverage=[]
    for e in entries:
        unique={p for k in ['raw','code','outputs'] for rel in e[k] for p in files_under(rel)}
        row={'dataset_id':e['dataset_id'],'title':e['title'],'wiki_pages':';'.join(e['pages']),
             'description':e['description'],'raw_or_input_paths':';'.join(e['raw']),
             'code_paths':';'.join(e['code']),'output_or_document_paths':';'.join(e['outputs']),
             'coverage_status':e['status'],'notes':e['notes'],
             'referenced_unique_file_count':len(unique),'referenced_bytes':sum(p.stat().st_size for p in unique)}
        rows.append(row)
        for page in e['pages']:
            coverage.append({'wiki_page':page,'wiki_url':'https://2026.igem.wiki/nthu/'+page,
                             'dataset_id':e['dataset_id'],'topic':e['title'],
                             'coverage_status':e['status'],'raw_or_input_paths':';'.join(e['raw']),
                             'code_paths':';'.join(e['code']),'output_or_document_paths':';'.join(e['outputs']),
                             'remaining_gap_or_scope':e['notes']})
    table('00-guide/DATA_CATALOG.csv',rows,list(rows[0]))
    table('00-guide/WIKI_DATA_COVERAGE.csv',coverage,list(coverage[0]))
    (AUDIT/'catalog-records.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2),encoding='utf-8')
    download_audit=json.loads((AUDIT/'wiki-download-audit.json').read_text(encoding='utf-8-sig'))
    downloads=[]
    for e in download_audit['entries']:
        rel=e.get('archive_path') or ''
        if rel.startswith('zenodo-release/'):rel=rel[len('zenodo-release/'):]
        if rel:assert (ROOT/rel).is_file(),rel
        matched=e.get('archive_matches') or []
        downloads.append({'wiki_page':e['page'],'download_or_document_url':e['url'],
                          'document_label':'; '.join(e.get('link_labels',[])),
                          'archive_path':rel,'status':e['status'],
                          'sha256':matched[0].get('sha256','') if matched else '',
                          'verification_scope':('Fresh public raw HTTP response vs current archived bytes' if e.get('fresh_public_raw_readback') else 'Saved publication evidence vs current archived bytes; not a new live HTTP request')})
    table('00-guide/WIKI_DOWNLOADS.csv',downloads,list(downloads[0]))
    shutil.copy2(AUDIT/'wiki-download-audit.json',PROV/'wiki-download-verification.json')

    deps=[];licenses=[]
    for p in ROOT.rglob('*'):
        if not p.is_file() or '00-guide' in p.parts or '00-provenance' in p.parts:continue
        n=p.name.lower();rel=p.relative_to(ROOT).as_posix()
        if n.startswith('requirements') or n in ['environment.yml','environment.yaml','pyproject.toml','platformio.ini','package.json','environment.txt']:
            deps.append({'path':rel,'scope':'Historical source revision' if rel.startswith('reproduction-source/') else 'See dataset-local instructions; not a universal environment'})
        if n.startswith(('license','licence','copying','notice')) or 'attribution' in n or 'third-party' in n or 'third_party' in n:
            licenses.append({'path':rel,'scope':'Applies only as stated in the original file; no blanket relicensing'})
    table('00-guide/ENVIRONMENTS.csv',sorted(deps,key=lambda x:x['path']),['path','scope'])
    table('00-guide/LICENSE_FILES.csv',sorted(licenses,key=lambda x:x['path']),['path','scope'])

    write('README.txt','''AeroSense | NTHU iGEM 2026 | Research data and reproducibility materials
Local organization date: 2026-10-21. Status: unpublished local deposit candidate.

START HERE
Open START_HERE.html in a browser. It is an offline, searchable subject index.
先開 START_HERE.html，可按 Wiki 頁面與研究主題尋找原始資料、程式與圖表。

00-guide/DATA_CATALOG.csv          Topic catalogue with exact archive paths
00-guide/WIKI_DATA_COVERAGE.csv    Wiki page -> inputs -> code -> outputs -> gaps
00-guide/WIKI_DOWNLOADS.csv        Exact document/download URL -> saved file
00-guide/PARTS_INDEX.csv           Current 25 part documents -> exact saved source
00-guide/REPRODUCE.txt             Current workflow entry points and environments
00-guide/KNOWN_GAPS.txt            Specific missing research inputs and scope
00-guide/ZENODO_UPLOAD.txt         Upload packaging and record metadata guidance
00-guide/ENVIRONMENTS.csv          Existing environment/build declarations
00-guide/LICENSE_FILES.csv        Existing licences and attribution documents
FILE_MANIFEST.csv                 One row per physical file (defined exclusions)
CHECKSUMS.sha256                  SHA-256 for all deliverables except itself
manifest.csv                     Many-to-one historical source -> canonical mapping
summary.json                     Import and verification history; dated entries
00-provenance/                   Historical link, supplement and media records

RESEARCH ROOTS (kept in their original relative positions)
aerosense-wiki/      Archived research inputs, analyses, figures and documents.
                     This is a research subtree, not a complete deployable Wiki.
receptor-engineering/ Receptor-engineering handover, benchmarks and environments.
hardware-visuals/    Hardware illustration sources and retained outputs.
reports/            Required figure-generation scripts and historical inputs.
scripts/            Additional hardware figure-generation entry points.
reproduction-source/ Distinct source revisions, publication files and mappings.

PATHS AND COUNTS
Paths in the new catalogues are relative to this folder, regardless of the CSV's
own subfolder. Keep internal filenames, acquisition identifiers and relative
paths: programs and historical source manifests depend on them. The catalogue
provides readable topic names without renaming instrument exports.
Topic file counts overlap; do not add them to obtain the package total.
manifest.csv can contain several original sources pointing to one saved file;
it is not a full physical inventory. Use FILE_MANIFEST.csv for that purpose.
FILE_MANIFEST.csv lists every file except itself and CHECKSUMS.sha256.
CHECKSUMS.sha256 also covers FILE_MANIFEST.csv, and excludes only itself.
Historical absolute paths and source aliases are provenance, not download paths.
Moved management documents are mapped in 00-provenance/DOCUMENT_PATHS.csv.

COMPLETENESS
Major Wiki-linked research materials are present, but the archive does not
establish complete end-to-end reproducibility of every model or experiment.
Across 28 local Wiki HTML pages, all 181 unique team document/data URLs have
archived matches verified using full SHA-256. Prior readbacks were reused for
179 URLs; two newly added Model source documents were fetched again in full.
This is a direct-link check, not an inventory of every possible unlinked
research input. Third-party literature is listed
separately and does not need to be copied into the team's data deposit.
See KNOWN_GAPS for the missing decoder package, selected MD/source inputs,
historical light-sheet run 02, acquisition metadata and education raw responses.
The added early-survey-summary.csv is an existing team-reported n=28 aggregate,
not newly collected data and not the later 300-person survey dataset.

USE AND PUBLICATION
Read the dataset-specific methods and licences before reuse. Original team
Software code has an MIT scope; this does not relicense data, images, text,
third-party inputs or historical revisions. No DOI is assigned by these files.
Original research bytes are preserved; this organization changes navigation and
administrative documentation and adds the existing missing education aggregate.
Zenodo accepts files, so upload a ZIP preserving this directory structure.
''')
    write('00-guide/KNOWN_GAPS.txt','''AeroSense — current data coverage and reproducibility gaps
Reviewed 2026-10-21. All paths below are relative to the archive root.

1. Odor decoder (Model)
The latest UCI-270 / DoOR manuscripts, captured blocks, figures and a manuscript
extraction helper are present in data/notion-model-2026-10-21 under aerosense-wiki.
They do not supply the matching Brian2 PN–KC–MBON training engine, trained
checkpoints, complete feature/response exports, fitted preprocessing, seeds or
fold identifiers. Original external UCI/DoOR datasets are linked by that
package's README; no full raw copy or exact selected split is provided here.
Reported model scores are not independently recomputed by extracting text.
The newer source also lacks the derivation of the grey 0.043 reference band
and inputs needed to recompute its reported 39-pair comparison independently.
Earlier decoder records reference KT and retain separate legacy figures; their
complete training inputs and original table 01–04 / fig1–4 generators are also
not supplied. eNose-feature-igem feature-table/augmentation tools and the
four-feature odor_model.py are separate workflows, not the missing engine.

2. Receptor engineering / molecular modelling
Processed outputs and supplied scripts are retained. The original handover
excludes complete MD trajectories/checkpoints/topologies, third-party weights,
original Gaussian logs/downloaded spectra and selected platform binaries.
Some trajectories also lack continuous water/lipid-tail coordinates. Consult
receptor-engineering/README_先讀我.txt and the handover's workflow manifests.

3. Light-sheet imaging
TH, GH146 run 03 and GH146 run 04 each retain 696 raw TIFF frames. Historical
GH146 run 02 retains MAX_02.avi, ROI CSV and RoiSet.zip, but its complete TIFF
series and acquisition Settings were not supplied. Frames and ROIs are not
independent biological replicates.

4. Assay metadata and microscopy
Test 1 retains 32 original instrument CSVs (3,840 readings) plus a filename
map. VOC doses, numeric gain, matched vehicle/final DMSO and delivery-to-read
latency are not fully recorded. Test 2 retains 12 XLSX exports (1,440 readings).
Team-supplied dilution statements are documented; missing stock concentrations,
exact dosing time, gain and independent biological replication cannot be
reconstructed from filenames or instrument exports. Microscopy has supplied
images and the current team-confirmed workbook; some numeric acquisition
settings and additional independent batches are not provided.

5. Living-cell hardware
All 52 original CSV/JSON exports remain in hardware-test3-2026-10-21/raw.
The former hardware_test3 working copy was removed; the canonical raw exports
inside this package are retained.

6. Education assessment
The published teaching materials are present. The existing early survey
summary has been added at assets/education/early-survey-summary.csv under
aerosense-wiki. It contains three team-reported aggregate rows for n=28 and
explicitly states raw_export_available=no. It is not the later 300-person
survey. Participant-level exports for that survey and underlying n=15 workshop
assessment records were not found. A machine-readable coding table for the 22
worksheets was also not found. Do not infer raw responses from percentages.

7. Interpretation and document scope
The sustainability input CSV is a template whose inputs are marked not
measured/provided; it is not a completed measured-impact dataset. Financial
spreadsheets describe scenarios/assumptions. Underlying buyer feedback, quotes
or acceptance records supporting payment assumptions were not found here.
Public HP reports and photographs are not full interview transcripts. Approved
anonymized public derivatives are retained. Original feedback files also remain
in historical source folders and have not been cleared by this review for
public deposit; this does not establish that every original contains personal
information. Reference MaleCNS anatomy is a
third-party literature dataset, not the team's imaged sample.
The supplied part tables/diagrams are preserved, but complete team construct
sequence exports in FASTA, GenBank or SnapGene format were not found here.
This absence does not determine the validity of the online Registry entries.

8. Specific publication checks carried forward
Confirm redistribution terms for soelter_thesis.txt, Dana2019-supplement.pdf,
the KT dataset and supplied vendor/PCB documents; preserve original attribution.
Two already-public education PDFs (synbiobeta-2026-poster.pdf and
teacher-toolkit-instructions.pdf) contain a non-team-named contact mailbox.
Confirm it is an intended public contact before deposit. The collection also
contains 44 children's artwork/worksheet images; handwriting and publication
permission were not verified by the text-only document review. No identifying
values were reproduced in this guide, and original materials were not altered.

9. Archive hygiene and historical source versions
Two existing .pyc files and 16 small backend working-source files remain with
their earlier blocked-cleanup records. They are indexed, not silently omitted
or newly described as scientific measurements. Historical source snapshots are
different revisions and sparse source maps, not disposable full backups.
Some old readmes/publication scripts refer to former workspace paths. Use the
new REPRODUCE guide and canonical mappings for current entry points.

This list describes observed missing materials and boundaries. It does not
state that new experiments were performed or that every scientific result was
independently reproduced during this organization.
''')
    write('00-guide/ZENODO_UPLOAD.txt','''AeroSense — Zenodo upload preparation

Suggested record title
AeroSense: Research Data and Reproducibility Materials — NTHU iGEM 2026

Suggested description
Research materials supporting the NTHU iGEM 2026 AeroSense project, intended
for sensing applications in rural settings. The deposit brings together odor
assay exports, microscopy and light-sheet imaging, hardware calibration and
design materials, model inputs and processed results, analysis sources, teaching
materials, and supporting documentation. START_HERE.html and DATA_CATALOG.csv
map the collection by topic; WIKI_DATA_COVERAGE.csv maps Wiki evidence to saved
inputs, code and outputs. Dataset-specific methods, provenance and known missing
inputs are included. This collection does not establish field deployment or
complete end-to-end reproducibility of every workflow.

Suggested keywords
AeroSense; iGEM; NTHU; biosensing; olfactory receptors; fluorescence;
light-sheet microscopy; hardware; reproducibility; rural applications

Packaging
Zenodo does not organize uploaded files into folders. Upload a ZIP containing
the complete directory structure. Keep the ZIP outside zenodo-release so it
does not include itself. Do not upload thousands of individual files or split
dependent datasets by moving their internal paths.
The supplied archive tool uses standard-library ZIP64 and verifies every ZIP
member against the source bytes without extracting another large copy.
From the extracted package root, run:
  python 00-guide/archive_tools.py verify
To rebuild after an intentional update, first refresh the inventory:
  python 00-guide/archive_tools.py refresh
  python 00-guide/archive_tools.py package
Packaging does not overwrite an existing ZIP. Keep only the intended final
upload ZIP after reviewing any replacement; do not accumulate numbered backups.
Recommended local archive name: AeroSense-NTHU-2026-research-data.zip.
The adjacent .zip.sha256 file verifies the whole ZIP during transfer.
If any source material changes, regenerate the manifest/checksums and ZIP.

Official limits checked 2026-10-21: default 100 files / 50,000,000,000 bytes
per record. This collection is approximately 25 GB before compression.
https://help.zenodo.org/docs/deposit/manage-files/
https://support.zenodo.org/help/en-gb/1-upload-deposit/74-can-i-upload-folders-directories

Record fields to complete at publication
Use actual creator names, order, affiliations and ORCIDs as agreed by the team.
Select a release version/date matching the final uploaded contents. Choose
licences according to the material scopes in LICENSE_FILES.csv and the original
documents; Software MIT permission is not a blanket data/figure licence.
Review the specific unresolved items in KNOWN_GAPS.txt. A full collection can
be deposited with transparent limitations; do not invent missing files.
No DOI, creator list, embargo or public-access decision has been invented here.

Related resources
Wiki: https://2026.igem.wiki/nthu/
Software: https://gitlab.igem.org/2026/software/nthu/aerosense
The previous unverified DOI is not a download URL for this package.
After publication, use the actual Zenodo record/DOI and its file links in Wiki
Data Availability. Do not claim this local folder is already hosted on Zenodo.

This preparation does not upload, publish, submit, synchronize or push anything.
''')
    write('00-provenance/README.txt','''Historical source and provenance records

Files in this folder were moved without changing their bytes. They document
earlier collection, source-link checks, exclusions, additional sources and
published-video replacements. Their old locations are in DOCUMENT_PATHS.csv.

Historical records may name earlier counts, workspaces or publication states.
Use ../00-guide/ for current reader instructions and ../FILE_MANIFEST.csv for
the complete physical-file inventory. Use ../manifest.csv for original-source
to canonical-destination mappings; destination paths remain relative to the
archive root. Its rows may share a destination after byte-identical deduplication.
The existing dependency-files.csv has mixed historical path bases; the new
../00-guide/ENVIRONMENTS.csv resolves current declaration-file locations.

Do not reinterpret source_relative, historical absolute paths or previous
upload/deletion attempts as current download paths or new instructions.
No archived instruction file authorizes publishing or removing material.
''')

    def link(p,label=None):
        return '<a href="'+html.escape(quote(p,safe='/'),quote=True)+'">'+html.escape(label or p)+'</a>'
    def links(paths):return '<br>'.join(link(p,p) for p in paths) or '<span class="muted">—</span>'
    body=[]
    for e in entries:
        text=' '.join([e['dataset_id'],e['title'],*e['pages'],e['description'],e['status']]).lower()
        body.append('<tr data-search="'+html.escape(text,quote=True)+'"><td><b>'+html.escape(e['title'])+'</b><small>'+html.escape(e['dataset_id'])+' · '+html.escape(', '.join(e['pages']))+'</small><p>'+html.escape(e['description'])+'</p><span class="status">'+html.escape(e['status'])+'</span><p class="note">'+html.escape(e['notes'])+'</p></td><td>'+links(e['raw'])+'</td><td>'+links(e['code'])+'</td><td>'+links(e['outputs'])+'</td></tr>')
    write('START_HERE.html','''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AeroSense | Research data catalogue</title><style>
:root{font-family:system-ui,"Segoe UI","Microsoft JhengHei",sans-serif;color:#213642;background:#edf3f3;line-height:1.6}body{margin:0}main{max-width:1500px;margin:auto;padding:40px 4vw 70px}header{max-width:950px}h1{font-size:clamp(28px,3vw,44px);line-height:1.2;margin:10px 0 20px}.kicker{color:#25706a;font-size:13px;font-weight:700;letter-spacing:.12em}.lead{font-size:18px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:26px 0}.card{display:block;background:white;border:1px solid #d6e1df;border-radius:12px;padding:16px;text-decoration:none}.card b{display:block}.card span{font-size:13px;color:#536570}a{color:#156c70;overflow-wrap:anywhere}a:hover{text-decoration:underline}.notice{background:#fff8e9;border-left:4px solid #ca9d3b;padding:12px 18px;border-radius:4px;margin:22px 0}label{display:block;font-weight:600;margin:24px 0 8px}input{width:min(700px,95%);font:inherit;padding:12px;border:1px solid #8eaaa6;border-radius:8px;box-sizing:border-box}.table-wrap{overflow:auto;margin-top:16px;background:white;border:1px solid #d6e1df;border-radius:12px}table{border-collapse:collapse;width:100%;min-width:950px;font-size:14px}th{position:sticky;top:0;background:#183f47;color:white;text-align:left;padding:14px}td{padding:18px 14px;vertical-align:top;border-bottom:1px solid #dce7e4;min-width:180px}td:first-child{width:32%;min-width:260px}small{display:block;color:#62757f;margin-top:5px}td p{margin:9px 0}.status{display:inline-block;font-size:12px;background:#edf4f1;border-radius:6px;padding:3px 7px}.note,.muted{color:#61727b;font-size:12px}.note:empty{display:none}footer{font-size:13px;color:#536570;margin-top:30px}button{font:inherit;background:white;color:#194f55;border:1px solid #91afac;border-radius:7px;padding:9px 13px;margin-left:8px;cursor:pointer}[hidden]{display:none!important}@media(max-width:700px){main{padding:25px 18px}.lead{font-size:16px}button{margin:8px 0}th,td{padding:12px}}
</style></head><body><main><header><div class="kicker">NTHU iGEM 2026 · AEROSENSE · LOCAL DEPOSIT CANDIDATE</div><h1>研究資料總覽<br>Research data catalogue</h1><p class="lead">按研究主題與 Wiki 頁面尋找原始資料、分析程式及結果文件。此索引可離線使用；所有資料路徑都指向本資料包。</p><p>原始量測檔、時間戳記與程式依賴的目錄名稱維持原樣。表格提供容易辨識的主題名稱；解壓縮後請保留整個資料夾結構。</p></header>
<nav class="grid">
<a class="card" href="00-guide/DATA_CATALOG.csv"><b>資料主題清單</b><span>DATA_CATALOG.csv · 可用 Excel 開啟</span></a>
<a class="card" href="00-guide/WIKI_DATA_COVERAGE.csv"><b>Wiki 與資料對照</b><span>頁面 → 原始資料 → 程式 → 輸出</span></a>
<a class="card" href="00-guide/WIKI_DOWNLOADS.csv"><b>網站附件查找</b><span>181 個團隊資料／文件網址的封存位置</span></a>
<a class="card" href="00-guide/REPRODUCE.txt"><b>重現分析入口</b><span>環境、參數與正確工作目錄</span></a>
<a class="card" href="00-guide/KNOWN_GAPS.txt"><b>資料完整性說明</b><span>明確列出尚未提供的資料</span></a>
<a class="card" href="00-guide/ZENODO_UPLOAD.txt"><b>Zenodo 上傳說明</b><span>ZIP、資料描述與發布欄位</span></a>
<a class="card" href="FILE_MANIFEST.csv"><b>全檔案索引</b><span>實際檔案、大小、SHA-256 與用途</span></a>
<a class="card" href="00-guide/PARTS_INDEX.csv"><b>25 個 Parts 最新文件</b><span>以完整 SHA 對照目前 Software 提交版本</span></a>
</nav><div class="notice"><b>目前收錄狀態：</b>主要量測資料與引用文件已保存；完整模型訓練、部分歷史原始影像與教育逐筆評量資料仍有缺口。下面的「已收錄」描述的是指定材料，不代表所有研究已端到端重現。完整差異見資料完整性說明。</div>
<label for="search">搜尋主題、頁面或關鍵字 / Search</label><input id="search" type="search" placeholder="例如：light-sheet、hardware、education、Test 2" autocomplete="off"><button type="button" id="reset">清除搜尋</button><span id="count" aria-live="polite"></span>
<div class="table-wrap"><table><thead><tr><th>研究主題與收錄範圍</th><th>原始資料／輸入</th><th>分析程式／環境</th><th>結果／文件</th></tr></thead><tbody>'''+''.join(body)+'''</tbody></table></div>
<footer>整理日期：2026-10-21。各主題涵蓋的檔案可能重疊，請勿將主題檔數相加。<a href="README.txt">Read me</a> · <a href="CHECKSUMS.sha256">SHA-256</a> · <a href="manifest.csv">原來源對照</a> · <a href="00-guide/ENVIRONMENTS.csv">環境清單</a> · <a href="00-guide/LICENSE_FILES.csv">授權文件</a>。此頁不載入外部服務，也不會上傳任何資料。</footer>
</main><script>const input=document.getElementById('search'),rows=[...document.querySelectorAll('tbody tr')],count=document.getElementById('count');function filter(){const terms=input.value.toLowerCase().trim().split(/\\s+/).filter(Boolean);let shown=0;for(const row of rows){row.hidden=!terms.every(t=>row.dataset.search.includes(t));if(!row.hidden)shown++}count.textContent='  '+shown+' / '+rows.length+' topics';}input.addEventListener('input',filter);document.getElementById('reset').addEventListener('click',()=>{input.value='';filter();input.focus()});filter();</script></body></html>''')

    # Superseded administrative text only. Scientific documentation is untouched.
    for name in ['PENDING.txt','reproduction-readme.txt']:
        p=ROOT/name
        replacement=GUIDE/('KNOWN_GAPS.txt' if name=='PENDING.txt' else 'REPRODUCE.txt')
        assert replacement.is_file(), replacement
        assert p.resolve().parent == ROOT.resolve()
        if p.exists():p.unlink()

    # Preserve the existing import history, adding an explicit current organization record.
    summary=json.loads((ROOT/'summary.json').read_text(encoding='utf-8-sig'))
    dests={r['destination_relative']:int(r['bytes']) for r in mapping}
    oldbytes=summary.get('recorded_manifest_payload_bytes')
    summary.update(payload_files=len(dests),payload_bytes=sum(dests.values()),
                   recorded_manifest_payload_bytes=sum(dests.values()),manifest_source_records=len(mapping))
    for key in ['current_publication_status']:
        if isinstance(summary.get(key),dict):summary[key]['pending_file']='00-guide/KNOWN_GAPS.txt'
    summary['organization_2026_10_21']={
        'status':'Local only; no upload, publication, repository synchronization, commit or push',
        'research_roots_renamed':False,'scientific_content_edited':False,
        'new_material':destrel,'new_material_sha256':digest(dest),'new_material_scope':'Existing source-reported n=28 aggregate; not row-level responses',
        'prior_stale_recorded_manifest_payload_bytes':oldbytes,'topic_count':len(entries),
        'guide':'START_HERE.html','file_inventory':'FILE_MANIFEST.csv','checksums':'CHECKSUMS.sha256',
        'management_document_moves':moved,'superseded_documents':['PENDING.txt','reproduction-readme.txt'],
        'note':'Dated historical records above are preserved as history; current counts refer to the stated inventory scope.'}
    (ROOT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'topics':len(entries),'coverage_rows':len(coverage),'environment_files':len(deps),'license_files':len(licenses),'source_mapping_rows':len(mapping),'source_mapping_unique':len(dests)},ensure_ascii=False))

if __name__=='__main__':main()
