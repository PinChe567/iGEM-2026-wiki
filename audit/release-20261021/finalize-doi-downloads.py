from pathlib import Path
from bs4 import BeautifulSoup
import hashlib,json
base=Path(__file__).parent;site=base.parents[1];repo=site.parent/'gitlab/nthu'

old='The complete measurement archive and current analysis are downloadable below. Project code and documentation are available through the official repository; the research data record is linked separately.'
new='The fluorescein measurement archive and current analysis are downloadable below. The official repository provides code, documents and the linked numerical tables; the separate archive note records the publication status of the complete research package.'
old2='The raw-data ZIP preserves all 58 acquisitions from the initial study, expanded study and additional 2.5 µM loading, including records excluded from the primary fit. Each original file is checked against its SHA-256 manifest. The new files are also retained in the Zenodo release folder; this download does not indicate that the linked DOI has already received a new version.'
new2='The raw-data ZIP preserves all 58 acquisitions from the initial study, expanded study and additional 2.5 µM loading, including records excluded from the primary fit. Each original file is checked against its SHA-256 manifest. These files are also preserved in the complete research archive prepared locally for Zenodo; that full archive has no verified public deposit.'
p=site/'hardware.html';text=p.read_text(encoding='utf-8');assert old in text and old2 in text
p.write_text(text.replace(old,new).replace(old2,new2),encoding='utf-8',newline='')
p=site/'locales/extras/zh-Hant/hardware.json';d=json.loads(p.read_text(encoding='utf-8'))
d[new]='下方可下載螢光素量測資料與目前的分析。官方儲存庫提供程式、文件及所連結的數值資料表；另外的封存說明記錄完整研究資料包的公開狀態。'
d[new2]='原始資料 ZIP 保留初始研究、擴充研究與新增 2.5 µM 裝樣的全部 58 次擷取，包括主要擬合排除的紀錄。每份原始檔均依 SHA-256 清單核對。這些檔案也保留於本地整理、準備提交 Zenodo 的完整研究封存包；該完整資料包尚無已驗證的公開典藏。'
d.pop(old,None);d.pop(old2,None)
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

p=repo/'code/aerosense/hardware/README.md';text=p.read_text(encoding='utf-8')
old='Only source, minimal parameters, blank templates and two spectral input tables are included. Saved fields, raw exports, counts, CAD meshes and full outputs remain at aerosense-wiki/hardware information/AeroSense v2/ in the research archive. Original README links may refer to these external files.'
new='The publication tree includes source, parameters, blank templates, spectral inputs, the linked numerical tables and stored calculation summaries, cell-viability counts, and eight printable STLs. Complete saved fields, additional raw exports and the full research package remain in the separate archive. Stored outputs are preserved for inspection and are not evidence of a fresh simulation run. Original README links may refer to files that are supplied only in that full archive.'
assert old in text;p.write_text(text.replace(old,new),encoding='utf-8')

p=repo/'code/aerosense/wetlab/README.md';text=p.read_text(encoding='utf-8')
text=text.replace('Raw recordings and full result tables are not duplicated here.','The publication copy includes the linked microscopy CSV/JSON tables, Test 1 original instrument CSVs and reported/derived tables, the source plate-layout workbook, and current GH146/TH numerical and ROI records. Original TIFF collections, large AVI files and the complete research archive remain separate.')
text=text.replace('Restore raw inputs and reported/ from the matching Zenodo release before running it.','Its 32 original instrument exports and filename map are included at the expected sibling raw_renamed/ path, together with reported/ and derived/ tables.')
p.write_text(text,encoding='utf-8')

p=repo/'code/aerosense/wetlab/aerosense-wiki/wetlab results/description_lightsheet/README.md'
p.write_text('''# Light-sheet numerical records

This directory preserves the current GH146 and TH numerical measurement records copied byte-for-byte from the research archive. `raw_data/` contains intensity CSVs, acquisition timestamps/settings and ROI archives; `results/GH146/` and `results/TH/` contain the corresponding derived tables. `videos/` contains frame/timestamp metadata only. These folders do not contain raw AVI movies.

The current plotting entry is `../../../reports/lightsheet-v51/plot-comparison.py`, which imports the preceding full-recording analysis. Preserve the complete repository hierarchy and follow that source's input definitions. The historical `source/plot_5137TH.py` uses a six-fps playback assumption and must not replace the physical acquisition timestamps used by the current analysis.

Rendered recordings are public on iGEM Video Universe:

- [TH-GFP recording](https://video.igem.org/w/6Pa3Sqm3YFAzEAcJW8krwB)
- [GH146-GCaMP6f, three odors](https://video.igem.org/w/bhCd2DjM8qbRkZLh4yo2TJ)
- [GH146-GCaMP6f, four odors](https://video.igem.org/w/4mG6jqCpdgUfyZkwtrg5Cw)

The original AVI files and earlier excluded GH146 run 02 remain in the separately preserved full research archive. See the [archive publication status](https://gitlab.igem.org/2026/nthu/-/blob/main/docs/aerosense/archive-status.md). No new fitting, baseline correction, biological replication or data replacement was performed during publication.
''',encoding='utf-8')

manifest=json.loads((base/'doi-download-publish-manifest.json').read_text(encoding='utf-8'))
for entry in manifest['html_changes']:
    p=site/entry['page'];text=p.read_text(encoding='utf-8');soup=BeautifulSoup(text,'html.parser')
    assert '23469212' not in text
    assert len(soup.select('figure'))==entry['invariants']['figures']
    assert len(soup.select('table'))==entry['invariants']['tables']
    entry['after_sha256']=hashlib.sha256(text.encode()).hexdigest()
manifest['publication_readme_changes']=['code/aerosense/hardware/README.md','code/aerosense/wetlab/README.md','code/aerosense/wetlab/aerosense-wiki/wetlab results/description_lightsheet/README.md']
manifest['hardware_status_prose_corrected']=True
(base/'doi-download-publish-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('DOI links, availability prose and publication guides checked.')
