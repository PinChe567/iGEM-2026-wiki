"""Create the local upload landing page and the public text overview."""
from pathlib import Path
import argparse
import csv
import html
import json

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--guide-only',action='store_true',help='Update only the local HTML guide; leave every upload payload unchanged.')
args=parser.parse_args()

WORK = Path(__file__).resolve().parents[3]
OUT = WORK / 'zenodo-upload'
SOURCE = WORK / 'zenodo-release'
rows = list(csv.DictReader((OUT/'PACKAGE_INDEX.csv').open(encoding='utf-8-sig')))
zip_count=len(rows)
attachment_count=4 if (OUT/'GH146_FILE_MAP.csv').exists() else 3
upload_count=zip_count+attachment_count
map_link='、<a href="GH146_FILE_MAP.csv">GH146_FILE_MAP.csv</a>（GH146 原始檔與分包對照）' if attachment_count==4 else '' 
assert 1<=upload_count<=100 and len({r['zip_filename'] for r in rows})==zip_count
assert all((OUT/r['local_zip_path']).is_file() for r in rows)
total = sum(int(r['zip_bytes']) for r in rows)
files = sum(int(r['source_files']) for r in rows)
assert total < 50_000_000_000

video_info=json.loads((SOURCE/'00-provenance/published-video-replacements.json').read_text(encoding='utf-8'))
avi_cleanup=video_info.get('avi_cleanup')
avi_notice=''
if avi_cleanup:
    avi_notice=('AVI presentation files are omitted at the request of the team; original raw TIFFs, CSVs and analysis sources remain unchanged. '
                +('Historical GH146 run02 MAX_02.avi is retained because its complete TIFF series was not supplied. ' if avi_cleanup['retained_run02_avi'] else 'Historical GH146 run02 AVI is also omitted; its complete TIFF series was not supplied. ')
                +'Display recordings: TH https://video.igem.org/w/6Pa3Sqm3YFAzEAcJW8krwB ; GH146 run03 https://video.igem.org/w/bhCd2DjM8qbRkZLh4yo2TJ ; GH146 run04 https://video.igem.org/w/4mG6jqCpdgUfyZkwtrg5Cw . These are display references, not downloads of the original AVI files.')

overview = f'''AeroSense: Research Data, Analysis Sources, and Supporting Materials
NTHU iGEM 2026

ONE RECORD / {zip_count} ZIP FILES / SEVEN THEMES
This collection supports the AeroSense project, developed with intended sensing
applications in rural settings. All {zip_count} ZIP files belong to this single record.
They are independently extractable standard ZIP archives, not multipart .z01/.z02 volumes.

DOWNLOAD AND EXTRACT
For the full collection, download all {zip_count} ZIPs and extract each into the SAME
parent directory. Every archive has the common internal root AeroSense-NTHU-2026/.
Merge the directory structure. Do not add a separate archive-named enclosing
folder for each ZIP. Every retained relative path occurs in exactly one ZIP.

Open AeroSense-NTHU-2026/START_HERE.html for the offline subject index.
00-guide/PACKAGE_MAP.csv maps the retained files to their archive names.
GH146_FILE_MAP.csv beside this README gives the detailed raw-frame-to-part mapping.
00-guide/DATA_CATALOG.csv and WIKI_DATA_COVERAGE.csv locate evidence and analyses.
00-guide/REPRODUCE.txt provides workflow entry points and environment notes.

Selective downloads are possible, but some workflows require other themes.
Hardware/wetlab pattern comparisons require 01 and 03; light-sheet analysis
requires 02a plus the relevant raw-acquisition archive. Source revisions and
licence notices in 06 can apply to other themes. Links in the guide become
available once the ZIP containing the target material has been extracted.

LOSSLESS GH146 PACKAGING
The GH146 run 03 and run 04 raw-acquisition ZIPs use lossless ZIP DEFLATE
compression. Every extracted file retains its original path and bytes, including
all 1,392 TIFF files. Each part is a complete ZIP that can be extracted alone;
it is not a .z01/.z02 split volume. Extract all parts of a run into the SAME
parent folder to restore the recording. Individual-file checksums are unchanged. For current
download sizes and ZIP checksums, use the accompanying PACKAGE_INDEX.csv and
ARCHIVE_CHECKSUMS.sha256; older guides may describe the initial packaging size.

AVI PRESENTATIONS
{avi_notice}

PACKAGE CONTENTS
'''
for r in rows:
    overview += f"{r['zip_filename']}\n  {r['title']}\n  {int(r['source_files']):,} files; {int(r['zip_bytes'])/1e9:.3f} GB download\n"
overview += f'''
Total: {files:,} retained files in {zip_count} ZIPs, {total/1e9:.3f} GB download.
PACKAGE_INDEX.csv provides exact byte counts and archive SHA-256 values.
ARCHIVE_CHECKSUMS.sha256 uses archive basenames, as downloaded from Zenodo.
Within the extracted collection, CHECKSUMS.sha256 verifies individual files;
FILE_MANIFEST.csv describes their roles and historical source categories.
To verify the extracted collection with Python's standard library:
  python 00-guide/archive_tools.py verify

CURRENT RECEPTOR-MAP EDITIONS
The experimenter-confirmed F1/Test 2 receptor map and its provenance are in
aerosense-wiki/data/odor-f1-dynamic-20261021/MAP_CONFIRMATION.json.
For current receptor-labelled interpretation, use odor-f1-dynamic-20261021,
test2-confirmed-map-2026-10-21, hardware-confirmed-map-2026-10-21 and
signal-metric-confirmed-map-2026-10-21 under aerosense-wiki/data/.
Historical derivatives retain their original labels for provenance; the guide
marks their superseded Test 2 assignments. Original measured values are unchanged.
The F1 analysis uses existing Test 2 readings, not a new independent experiment.

MEASURED AND SIMULATED HARDWARE DATA
The living-cell hardware package preserves 52 original device exports and a
separate simulated first-point scenario for record 19. The _sti CSV is simulated;
its _sti JSON is a derived simulation report, not a firmware acquisition export.
Original and simulated D4 time courses, figures, source hashes and analysis code
are in aerosense-wiki/data/hardware-test3-2026-10-21/simulation-comparison/.
The comparison is reproducible from the supplied CSVs; the original simulation
generator was not retained. Historical source descriptions remain marked as
history. The simulation adds no independent measurement or experiment.

SCOPE AND RIGHTS
Read 00-guide/KNOWN_GAPS.txt and dataset-specific documentation for remaining
inputs and metadata. Retained manuscripts or processed outputs do not imply
that every training, simulation or measurement workflow can be reproduced
end-to-end. Education cohort percentages are reported aggregates, not paired
participant-level data. Rural field deployment is not established by this deposit.
Preserve material-specific licence and attribution notices. Software MIT scope
does not automatically apply to data, images, text or third-party materials.

Project Wiki: https://2026.igem.wiki/nthu/
Software: https://gitlab.igem.org/2026/software/nthu/aerosense
'''
if not args.guide_only:
    (OUT/'UPLOAD_README.txt').write_text(overview,encoding='utf-8')

def esc(s): return html.escape(str(s),quote=True)
def size(n): return f'{n/1e9:.2f} GB' if n>=1e9 else f'{n/1e6:.1f} MB'
table=''.join(f'''<tr><td><b>{esc(r['package_id'])}</b></td><td><b>{esc(r['title_zh'])}</b><small>{esc(r['title'])}</small><a href="{esc(r['local_zip_path'])}">{esc(r['zip_filename'])}</a></td><td>{int(r['source_files']):,}</td><td>{size(int(r['zip_bytes']))}</td></tr>''' for r in rows)
title='AeroSense: Research Data, Analysis Sources, and Supporting Materials for NTHU iGEM 2026'
description=f'''This dataset accompanies AeroSense, the NTHU iGEM 2026 project investigating living-cell odor sensing, fluorescence readout hardware, and fly-inspired computational decoding. The project is developed toward odor-based screening applications in rural communities, including stored-food monitoring.

The collection brings together odor-assay measurements, transfection microscopy, Drosophila light-sheet imaging, hardware calibration and measurement records, engineering designs and firmware, receptor-engineering analyses, computational modelling resources, analysis code, and education and stakeholder-engagement materials. Original instrument exports, revised analysis inputs, and historical derivatives are distinguished through their accompanying provenance records.

The living-cell hardware data distinguish original measurements from a simulated first-point scenario for record 19. Both D4 series, derived comparison tables, figures, and analysis code are included. The _sti JSON describes derived simulated data and is not a firmware acquisition report. Reproduction of the comparison uses the supplied CSVs; this does not establish an additional independent experiment or exact regeneration of the supplied simulated waveform.

Materials are organized into seven themes distributed across {zip_count} ZIP archives within this single Zenodo record. All archives share the internal root AeroSense-NTHU-2026/. Extract the required archives into the same parent directory while preserving relative paths. Light-sheet analysis materials and the TH, GH146 run 03, and GH146 run 04 raw acquisition series are packaged separately to support selective downloading.

Start with UPLOAD_README.txt and PACKAGE_INDEX.csv. ARCHIVE_CHECKSUMS.sha256 provides archive integrity checks. Within the extracted collection, START_HERE.html, 00-guide/DATA_CATALOG.csv, and 00-guide/WIKI_DATA_COVERAGE.csv help locate materials; 00-guide/REPRODUCE.txt identifies analysis entry points. Dataset-specific documentation and 00-guide/KNOWN_GAPS.txt describe provenance, dependencies, and the scope of reproduction. Consult 00-guide/LICENSE_FILES.csv and the accompanying notices for material-specific licensing and attribution.

Project Wiki: https://2026.igem.wiki/nthu/
Software repository: https://gitlab.igem.org/2026/software/nthu/aerosense'''
keywords='\n'.join(['AeroSense','NTHU','iGEM 2026','biosensing','olfactory receptors','living-cell biosensors','fluorescence','Drosophila','light-sheet microscopy','open-source hardware','computational modelling','rural applications','stored-food monitoring','reproducible research'])
rights_note='''Licensing is material-specific. The existing MIT license applies to the team-original software identified in the software license notices. DoOR reference data and the specified derived matrices and figures retain CC BY-SA 4.0. Other third-party materials retain their own license and attribution requirements. Consult 00-guide/LICENSE_FILES.csv and the notices accompanying individual materials. Any additional license for team-original research data and documentation should be declared with its exact scope after confirmation by the rights holders.'''
page=f'''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AeroSense｜Zenodo 上傳總覽</title>
<style>:root{{color-scheme:light}}*{{box-sizing:border-box}}body{{margin:0;background:#f1f5f3;color:#193b36;font-family:system-ui,"Microsoft JhengHei",sans-serif;line-height:1.7}}main{{max-width:1120px;margin:auto;padding:42px 24px 64px}}h1{{font-size:clamp(28px,4vw,42px);line-height:1.25;margin:8px 0 16px}}h2{{font-size:23px;margin:0 0 14px}}.eyebrow{{font-size:12px;letter-spacing:2px;font-weight:750;color:#47746a}}.lead{{font-size:19px;max-width:850px}}.stats{{display:flex;gap:16px;flex-wrap:wrap;margin:26px 0}}.stat{{background:#164b40;color:white;border-radius:14px;padding:16px 22px;min-width:150px}}.stat b{{display:block;font-size:27px}}section{{background:white;border:1px solid #d5e1dc;border-radius:18px;padding:26px;margin-top:22px}}a{{color:#126657;text-underline-offset:3px;overflow-wrap:anywhere}}.table-wrap{{overflow:auto}}table{{width:100%;border-collapse:collapse;text-align:left}}th,td{{padding:14px 12px;border-bottom:1px solid #dce6e1;vertical-align:top}}th{{background:#f2f7f4}}td:first-child{{width:65px}}td:nth-child(3),td:nth-child(4){{white-space:nowrap}}small{{display:block;color:#61766f}}td a{{font-size:12px}}.field{{border:1px solid #dce6e1;border-radius:10px;padding:16px;margin-top:14px}}.fieldhead{{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:10px}}button{{border:1px solid #8fafa5;border-radius:7px;background:#edf5f0;color:#164b40;padding:6px 14px;cursor:pointer}}pre{{font:14px/1.7 ui-monospace,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin:0}}.note{{border-left:4px solid #b18d43;padding:8px 14px;background:#fcf9f0}}code{{background:#edf4f0;padding:2px 5px}}li{{margin:8px 0}}footer{{margin-top:24px;color:#61766f;font-size:13px}}@media(max-width:650px){{main{{padding:26px 14px}}section{{padding:18px}}td,th{{padding:10px 8px}}.stat{{flex:1;min-width:120px}}}}</style></head><body><main>
<div class="eyebrow">NTHU iGEM 2026 · AeroSense</div><h1>同一筆 Zenodo，整套資料共用一個 DOI</h1><p class="lead">七個主題分成 {zip_count} 個 ZIP，讀者可以按需要下載。請將所有 ZIP 與 {attachment_count} 個附件加入<b>同一個草稿</b>，整筆資料只填一套 metadata。</p>
<div class="stats"><div class="stat"><b>7 個主題</b>{zip_count} 個 ZIP</div><div class="stat"><b>{upload_count} 個檔案</b>實際上傳數量</div><div class="stat"><b>{total/1e9:.2f} GB</b>{files:,} 個包內檔案</div></div>
<section><h2>每個檔案完成後即保存</h2><p>上傳工具依序傳送檔案，每檔完成後核對 Zenodo 回傳的大小與校驗碼，並記錄完成結果。重新開始時會再次讀取原草稿，核對並跳過已完成且內容一致的檔案；不需要因為後面的檔案失敗而整批重傳。尚未完成的單一 ZIP 目前須從頭傳送。</p><p><b>Save draft</b> 用來儲存表單內容；<b>Publish</b> 是正式公開整筆資料。先在<a href="https://zenodo.org/uploads/23469212">原草稿 23469212</a>逐步上傳、填表並儲存，全部核對完成後再正式發布。此頁是操作指南，實際上傳進度請看上傳視窗。</p><p class="note">整筆必需資料是 {upload_count} 檔。GH146 原始影像已改成小型 ZIP；完整資料續傳模式會核對並跳過已完成檔案，再補齊其餘檔案。只有 {upload_count} 檔皆核對成功，才會顯示整套必需檔案完成。兩個舊的大型 ZIP 空白 Pending 項目會在所有小包驗證完成後移除，其他額外項目保留。</p></section>
<section><h2>1. 上傳這些檔案</h2><p>逐一開啟本機七個主題資料夾，選取下表{zip_count} 個 ZIP，全部加入同一筆 Zenodo draft。資料夾只供本機整理；Zenodo 會顯示各個 ZIP 檔名。</p><div class="table-wrap"><table><thead><tr><th>編號</th><th>主題與檔名</th><th>包內檔案</th><th>大小</th></tr></thead><tbody>{table}</tbody></table></div><p>另外加入 {attachment_count} 個附件：<a href="UPLOAD_README.txt">UPLOAD_README.txt</a>（讀者入口）、<a href="PACKAGE_INDEX.csv">PACKAGE_INDEX.csv</a>（大小與內容清單）、<a href="ARCHIVE_CHECKSUMS.sha256">ARCHIVE_CHECKSUMS.sha256</a>（ZIP 校驗碼）{map_link}。</p><p class="note">本頁是本機操作指南，不必上傳。也不用再上傳 zenodo-release 中的數千個散檔。可將 UPLOAD_README.txt 設為 Zenodo 的預設預覽。</p></section>
<section><h2>AVI 展示影片</h2><p>{html.escape(avi_notice)}</p></section>
<section><h2>2. 這些欄位只填一次</h2><p>{zip_count} 個 ZIP 共用以下一套資料。標題、描述與關鍵字可用按鈕複製；姓名、作者順序與授權範圍請依團隊確認內容填入。下列內容是建議填法，尚未代填或儲存到 Zenodo。</p>
<div class="field"><div class="fieldhead"><b>Title</b><button data-copy="title">複製</button></div><pre id="title">{esc(title)}</pre></div>
<div class="field"><div class="fieldhead"><b>Description</b><button data-copy="description">複製</button></div><pre id="description">{esc(description)}</pre></div>
<div class="field"><div class="fieldhead"><b>Keywords · 分別加入每個詞</b><button data-copy="keywords">複製</button></div><pre id="keywords">{esc(keywords)}</pre></div>
<div class="table-wrap"><table><thead><tr><th>欄位</th><th>建議填法</th></tr></thead><tbody>
<tr><td>Resource type</td><td>Dataset。這是一筆以研究資料為主、附分析程式及文件的混合內容紀錄。</td></tr>
<tr><td>DOI</td><td>保留原草稿已預留的 <b>10.5281/zenodo.23469212</b>。不用重新申請，也不要把預留 DOI 改成另一筆「既有 DOI」輸入。</td></tr>
<tr><td>Creators</td><td>逐一填實際作者與團隊同意的排序。依先前提供的姓名，個人姓名拆分範例為 Family name：Huang；Given names：Pin Che。是否列作者及順序由團隊確認。若團隊採共同署名，可選 Organization，填 NTHU iGEM 2026 Team；個人作者仍依團隊的署名約定列入。</td></tr>
<tr><td>Affiliation / ORCID</td><td>清大成員可選 National Tsing Hua University，並確認是臺灣的清華大學。外部成員填實際機構。ORCID 有已確認的識別碼才填，沒有可留空。</td></tr>
<tr><td>Version</td><td>如果這是第一次正式公開整筆資料，建議 1.0.0。每個 ZIP 上傳或重試不另加版本。</td></tr>
<tr><td>Publication date</td><td>填實際首次正式公開這筆資料的日期；不是各實驗日期，也不必沿用建立草稿的日期。</td></tr>
<tr><td>Language / Publisher</td><td>主要描述語言選 English；若表單提供多語言選項且要標示中文材料，可再加 Chinese。Publisher 使用 Zenodo。</td></tr>
<tr><td>Visibility / Embargo</td><td>供評審與讀者取得資料的正式發布版本選 Public；無延後公開需求就不設定 embargo。先儲存草稿不會因此立刻公開檔案。</td></tr>
<tr><td>Related works</td><td>加入 Project Wiki 與 Software repository 的 URL。關係不確定時使用 Is related to；不要將 Wiki 或軟體的網址當作本資料集 DOI。</td></tr>
<tr><td>Funding / Contributors / Communities</td><td>Funding 僅填實際計畫與編號；其他貢獻者可依實際角色列入 Contributors。沒有適用資料的非必填欄位留空；Communities 不必為了完成表單而強行加入。</td></tr>
<tr><td>Default preview</td><td>建議選 UPLOAD_README.txt，讓讀者先看到資料包導覽。</td></tr>
</tbody></table></div>
<h3>License：依材料分別標示</h3><p>團隊原創研究數據與說明文件可考慮 <b>CC BY 4.0</b>，由權利人確認同意後再套用；現有原創軟體保留 <b>MIT</b>，指定的 DoOR 參照資料與衍生矩陣／圖表保留 <b>CC BY-SA 4.0</b>，其他材料沿用其原授權。Zenodo 支援在同一筆資料列出多種授權，並應在描述中清楚寫出各自範圍。</p>
<div class="field"><div class="fieldhead"><b>現有授權範圍說明 · 可附於 Description</b><button data-copy="rights">複製</button></div><pre id="rights">{esc(rights_note)}</pre></div>
<p>授權與來源入口：<a href="../zenodo-release/00-guide/LICENSE_FILES.csv">LICENSE_FILES.csv</a>、<a href="../zenodo-release/00-guide/KNOWN_GAPS.txt">資料範圍紀錄</a>。CC BY 4.0 是原創資料的建議選擇，這份指南本身不替團隊授予新授權。</p>
<p>官方填表說明：<a href="https://help.zenodo.org/docs/deposit/create-new-upload/">建立與儲存草稿</a>、<a href="https://help.zenodo.org/docs/deposit/describe-records/reserve-doi/">預留 DOI</a>、<a href="https://help.zenodo.org/docs/deposit/describe-records/creators/">作者</a>、<a href="https://help.zenodo.org/docs/deposit/describe-records/licenses/">混合授權</a>。</p></section>
<section><h2>3. 下載後如何合併與找資料</h2><ol><li>把{zip_count} 個 ZIP 解壓到<b>同一個目的位置</b>；每個包內的共同根目錄都是 <code>AeroSense-NTHU-2026/</code>。</li><li>允許同名資料夾合併，不要替每包再增加一層 ZIP 名稱的資料夾。每個原始路徑只存放於其中一包，不需覆蓋原始檔。</li><li>打開合併後的 <code>START_HERE.html</code>，按研究主題或 Wiki 頁面找資料；<code>00-guide/PACKAGE_MAP.csv</code> 可反查每個檔案的目前分包；GH146 小包也可查外層 GH146_FILE_MAP.csv。</li></ol><p>目前本機原始資料的 <a href="../zenodo-release/START_HERE.html">完整內容導覽</a> 也可直接開啟。單獨下載一主題時，跨主題分析可能還需其他 ZIP，例如硬體／濕實驗模式比較需 01 與 03。</p></section>
<footer>本頁是本機操作與填表指南，不會自行變更 Zenodo 欄位或按下 Publish。{zip_count} 個 ZIP 已逐檔讀回核對 SHA-256 與 CRC，跨包無重複路徑。官方單筆預設上限為 100 檔、50 GB：<a href="https://help.zenodo.org/docs/deposit/manage-files/">Zenodo Manage files</a>。</footer>
</main><script>document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{{const el=document.getElementById(b.dataset.copy);try{{await navigator.clipboard.writeText(el.textContent);b.textContent='已複製';setTimeout(()=>b.textContent='複製',1800)}}catch{{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='已選取，請複製'}}}}));</script></body></html>'''
(OUT/'START_HERE.html').write_text(page,encoding='utf-8')
print(json.dumps({'upload_files':upload_count,'zip_count':zip_count,'source_files':files,'zip_bytes':total,'guide':str(OUT/'START_HERE.html')},ensure_ascii=False))
