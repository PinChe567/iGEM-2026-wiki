"""Build a manifest, file-role catalog and clean archive without modifying scientific data.
Run from any directory: python prepare_release.py
The release ZIP is written beside this folder. No measurements are synthesized.
"""
from pathlib import Path
import json,hashlib,csv,zipfile,re,ast,argparse
from html.parser import HTMLParser
from urllib.parse import unquote,urlparse
R=Path(__file__).resolve().parent
parser=argparse.ArgumentParser()
parser.add_argument('--allow-unverified-word-render',action='store_true',help='Package editable Word files with an explicit render-QA limitation; all source/hash checks remain required.')
args=parser.parse_args()
def load(p):return json.loads((R/p).read_text(encoding='utf8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
SKIP_DIRS={'_work','__pycache__','.pio','.git','video_frames'}
def files():
 def walk(d):
  for p in sorted(d.iterdir()):
   if p.is_dir():
    if p.name not in SKIP_DIRS:yield from walk(p)
   elif p.suffix not in ['.pyc','.sqlite','.db'] and not p.name.startswith('~$') and not p.name.endswith(('-wal','-shm')) and p.name not in ['aerosense_config.h','manifest.sha256','file_catalog.csv'] and p.name!='intersection.scad':yield p
 yield from walk(R)
mesh=load('09_engineering_sources/CAD/checks/mesh_report.json');assert len(mesh)==8
assert all(x['watertight_edges'] and x['connected_components']==1 and x['volume_cm3']>0 for x in mesh)
inter=load('09_engineering_sources/CAD/checks/nominal_intersections.json');assert all(x['volume_mm3']<1e-6 for x in inter['checks'])
board=load('09_engineering_sources/CAD/checks/nominal_board_check.json');assert all(x['nominal_pass'] for x in board['checks'])
preservation=load('09_engineering_sources/CAD/checks/current_preservation.json')
for n,h in preservation['print_folder_sha256'].items():assert sha(R/n)==h,n
assert sha(R/'09_engineering_sources/CAD/aerosense.scad')==preservation['CAD_source_sha256']
antenna=load('09_engineering_sources/CAD/checks/Antenna_Clearance_Evidence.json')
assert antenna['STLs_unchanged']==8 and antenna['four_wells_unchanged'] and not antenna['geometry_changed']
assert antenna['aperture_front_rays_all_clear'] and antenna['aperture_front_rays']==336
for n,h in antenna['STL_SHA256'].items():assert sha(R/n)==h,n
flow=load('02_simulation/airflow/validation.json');assert flow['all_run_count']==28 and flow['all_declared_converged']
o=load('02_simulation/optics/results/validation.json');assert o.get('all_figures_reproduced',o.get('all_8_figure_hashes_reproduced',False))
for n,h in o['figure_SHA256'].items():assert sha(R/'02_simulation/optics/figures'/n)==h,n
assert o['video_checked'] and o['video']['all_200_frames_share_one_time']
assert sha(R/'02_simulation/optics/optical_slow_motion.mp4')==o['video']['MP4_SHA256']
actual_optics_figures={p.name for p in (R/'02_simulation/optics/figures').glob('*.png')}
assert actual_optics_figures==set(o['figure_SHA256']), 'Every current optical figure must be reproduced and hashed'
membrane=load('02_simulation/membrane/results/package_qa.json');assert membrane['passed']
air_publication=load('02_simulation/airflow/publication_validation.json');assert air_publication['passed'] and air_publication['figure_hashes_reproduced']
for n,h in air_publication['figure_SHA256'].items():assert sha(R/'02_simulation/airflow/figures'/n)==h,n
air_supplement=load('02_simulation/airflow/supplemental_summary.json')
operation=load('02_simulation/airflow/operating_sweep_summary.json')
assert operation['screening_scalar_solves']==21 and operation['validation_scalar_solves']==6 and operation['direct_velocity_solves']==1
assert operation['chosen_conditional_point']['Q_mL_min']==3 and not operation['CAD_changed']
assert all(operation['numerical_checks'][k]['worst_t90_s']<60 for k in ['selected_point_grid','selected_point_timestep'])
assert air_supplement['additional_perforated_screening_solves']==18 and air_supplement['additional_gas_scalar_solves']==9
assert air_publication['interactive_validation']['passed']
assert air_publication['interactive_validation']['browser_interaction_tested'] is False
assert load('02_simulation/membrane/results/validation.json')['passed']
for n,h in membrane['source_sha256'].items():assert sha(R/'02_simulation/membrane'/n)==h,n
coupling=load('02_simulation/membrane/results/CFD_rim_coupling_summary.json')
assert sha((R/'02_simulation/membrane'/coupling['source_relative_to_membrane']).resolve())==coupling['source_sha256']
assert not load('02_simulation/membrane/decision.json')['change_CAD']
figure_inventory={}
for group in ['optics','airflow','membrane']:
 d=R/'02_simulation'/group;captions=json.loads((d/'captions.json').read_text(encoding='utf8'))
 figures=sorted((d/'figures').glob('*.png'))
 for fig in figures:
  assert fig.name in captions,(group,fig.name,'missing caption')
  for lang in ['ZH','EN']:
   assert captions[fig.name].get(lang),(group,fig.name,lang)
   assert (d/'figure_notes'/f'{fig.stem}_{lang}.md').is_file(),(group,fig.name,lang,'missing notes')
 for movie in d.glob('*.mp4'):
  assert movie.name in captions,(group,movie.name,'missing movie caption')
  for lang in ['ZH','EN']:assert (d/'figure_notes'/f'{movie.stem}_{lang}.md').is_file()
 figure_inventory[group]={'figures':len(figures),'bilingual_notes_verified':True}
sw=load('03_software/evidence/software_validation_summary.json');assert sw['firmware_compile_passed'] and sw['filesystem_build_passed']
for n,h in sw['artifacts'].items():assert sha(R/'03_software'/n)==h,n
for l in ['ZH','EN']:
 b=load(f'05_BOM/BOM_validation_{l}.json');assert b['formula_total_matches_independent_calculation'] and b['blank_vs_zero_test_passed'] and b['print_count']==8
 assert b['public_workbook_updated'], f'{l} BOM has not replaced the public workbook; resolve the file lock first'
 assert sha(R/f'05_BOM/BOM_{l}.xlsx')==b['public_workbook_sha256']==b['staged_workbook_sha256'], f'{l} BOM differs from its verified export'
for p in (R/'07_validation/templates').glob('*.csv'):
 assert len(list(csv.reader(p.read_text(encoding='utf-8-sig').splitlines())))==1,p
assert load('07_validation/measured_results/analysis_summary.json')['state']=='NO_EXPERIMENTAL_DATA'
quick=load('07_validation/quick_check_validation.json');assert quick['passed'] and quick['count']==25 and quick['plotting_smoke_passed']
assert sha(R/'07_validation/quick_check.py')==quick['source_SHA256']
appendix=load('appendix/appendix_manifest.json')
for row in appendix['archives']:assert sha(R/'appendix'/row['file'])==row['SHA256']
assert not (R/'03_software/firmware/src/aerosense_config.h').exists()
required=['START_HERE.html','handoff.md','handoff_EN.md','02_simulation/optics/optical_slow_motion.mp4','02_simulation/airflow/airflow_comparison.mp4']
pdfs=[]
for lang in ['ZH','EN']:
 required.extend([f'05_BOM/BOM_{lang}.xlsx',f'04_manuals/Assembly_Manual_{lang}.pdf',f'04_manuals/Operation_and_Setup_{lang}.pdf',f'04_manuals/Simulation_Analysis_{lang}.pdf',f'07_validation/User_Feedback_{lang}.pdf',f'07_validation/Validation_Plan_{lang}.pdf'])
 required.extend([f'04_manuals/Assembly_Manual_{lang}.docx',f'04_manuals/Operation_and_Setup_{lang}.docx',f'07_validation/User_Feedback_{lang}.docx'])
for p in required:assert (R/p).is_file(),p
pdf_validation=load('04_manuals/document_validation.json')
assert len(pdf_validation)==10
for row in pdf_validation:
 assert row['rendered'] and row.get('visual_review'),row['file']
 assert sha(R/row['file'])==row['sha256'],row['file']
word=load('04_manuals/word_document_validation.json');assert word['count']==6
word_render=load('04_manuals/word_render_validation.json')
word_visual_pass=word_render['all_pages_visually_inspected'] and word_render['passed']
assert word_visual_pass or args.allow_unverified_word_render, 'Word rendering is unverified. Resolve rendering, or explicitly package with the documented limitation.'
for row in word['documents']:
 assert sha(R/row['file'])==row['SHA256'],row['file']
 for src in row['sources']:assert sha(R/src['source'])==src['SHA256'],src['source']
for row in word_render['documents']:assert sha(R/row['file'])==row['source_SHA256'],row['file']
class Links(HTMLParser):
 def __init__(self):super().__init__();self.paths=[]
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ['src','href'] and v:self.paths.append(v)
link_rows=[]
for p in [R/'START_HERE.html',*(R/'06_wiki').glob('*.html'),*(R/'02_simulation').rglob('*.html'),*(R/'appendix').glob('*.html')]:
 a=Links();a.feed(p.read_text(encoding='utf8'));missing=[];count=0
 for ref in a.paths:
  u=urlparse(ref)
  if u.scheme or u.netloc or not u.path:continue
  target=(p.parent/unquote(u.path)).resolve();count+=1
  if target.name in ['manifest.sha256','file_catalog.csv','RELEASE_CHECKS.json']:continue
  if not target.exists():missing.append(ref)
 assert not missing,(p,missing)
 link_rows.append({'file':str(p.relative_to(R)).replace('\\','/'),'checked':count,'missing':missing})
syntax=[]
for p in files():
 if p.suffix=='.py':ast.parse(p.read_text(encoding='utf-8-sig'),filename=str(p));syntax.append(str(p.relative_to(R)).replace('\\','/'))
# Keep the eight selected STL meshes. Preserve user-added slicer files and notes.
print_files=list((R/'01_print').iterdir())
assert sorted(p.name for p in print_files if p.suffix.lower()=='.stl')==sorted(m['file'] for m in mesh)
assert all(p.is_file() for p in print_files)
user_print_support=[p.name for p in print_files if p.suffix.lower()!='.stl']
assert len(list(R.rglob('*.stl')))==8, 'Only eight selected STL files may ship'
status={
 'date':'2026-10-08','scope':'Engineering prototype; no physical or biological validation',
 'operating_STLs':8,'STL_inventory_contains_only_selected_designs':True,'user_added_slicer_files_and_notes_preserved':user_print_support,'slicer_settings_validated':False,'duplicate_STLs':0,'closed_connected_mesh_checks_pass':True,'printed_pair_checks':len(inter['checks']),
 'nominal_component_checks':len(board['checks']),'populated_PCB_fit_certified':False,
 'antenna_aperture_rays':antenna['aperture_front_rays'],'antenna_nominal_insertion_margin_mm':antenna['vendor_area_to_tongue_nominal_gap_mm'],'antenna_RF_validated':False,
 'optics_primary_conditions':24,'optics_seeds_per_condition':3,'optics_primary_packets':6048000,'optical_figure_hashes_match':True,
 'optics_extra_leakage_conditions':12,'optics_extra_leakage_packets':3024000,
 'airflow_original_solve_count':28,'airflow_original_design_count':18,'airflow_iterative_convergence':True,'airflow_grid_independence':False,
 'airflow_extra_hole_conditions':18,'airflow_supplemental_evidence':'02_simulation/airflow/supplemental_summary.json',
 'airflow_operating_cases':21,'airflow_operating_scalar_checks':6,'airflow_operating_direct_velocity_checks':1,
 'conditional_gas_flow_mL_min':3,'gas_threshold_is_not_cell_threshold':True,'STLs_changed_this_update':False,
 'membrane_conditions_including_no_film':243,'membrane_numerical_verification':True,'membrane_added_to_selected_build':False,
 'CFD_rim_one_way_coupling':True,'two_way_coupled_phase_mass_conservation_validated':False,
 'figure_inventory':figure_inventory,'interactive_browser_QA':'Local-file navigation blocked by browser security policy; source/data tests only',
 'firmware_compiled':True,'LittleFS_built':True,'hardware_flashed':False,'host_tests':sw['host_tests'],
 'calibration_checks':sw['calibration_checks'],'synthetic_DLIA_cases':sw['synthetic_DLIA_cases'],
 'measured_correction_tests':sw.get('measured_correction_checks'),'UI_DOM_API_tests':sw.get('ui_integration_checks'),'single_experiment_analysis_checks':25,
 'appendix_archives':len(appendix['archives']),'appendix_hashes_verified':True,
 'BOM_formula_and_unknown_price_checks_pass':True,'complete_cost':'Provisional dual-currency budget; listed prices, proxies and allowances identified; compatible custom filter quotation pending',
 'experimental_tables':'10 header-only CSVs; no measured outcomes','live_wiki_changed':False,
 'local_link_checks':link_rows,'python_syntax_checked':syntax,
 'PDF_visual_QA':'All10 PDFs rendered and inspected; layout report in04_manuals/document_validation.json',
 'editable_Word_documents':6,'Word_visual_QA':('Every current page rendered and inspected' if word_visual_pass else 'Four rewritten manuals: native Word export unavailable after startup hangs; editable content/source hashes checked, pagination unverified. Unchanged feedback documents retain their prior verified render. Separate ReportLab PDFs were inspected; they are not Word render evidence.'),'Word_source_hashes_verified':True,
 'release_QA_status':('PASS' if word_visual_pass else 'PACKAGED_WITH_WORD_RENDER_LIMITATION'),
 'XLSX_visual_QA':'All10 worksheets inspected in two workbooks; formula checks preserved in05_BOM',
 'exclusions':'Internal working files, caches, PIO build trees, private config, databases and regenerated video frames',
 'limitations':['Unknown populated component heights and PCB mirroring','Real PD/filter/LED/material optical parameters','No fan thermal model or cell temperature regulation','Gas transport and 1D PDMS/liquid sensitivities are conditional; no full two-way phase coupling or cell injury model','No target-specific calibrated PDMS D,K or water-loss model','No trained experimental odor classifier','No participant or physical test results']}
(R/'RELEASE_CHECKS.json').write_text(json.dumps(status,indent=2,ensure_ascii=False),encoding='utf8')

def role(p):
 q=p.relative_to(R).as_posix();ext=p.suffix.lower()
 if q.startswith('appendix/') and ext=='.zip':return '發布用技術附錄下載；四個壓縮檔解到同一目錄','Publication appendix download; extract all four archives into one root'
 if q.startswith('01_print/') and ext=='.stl':return '工作列印件；一件一份','Operating print; one each'
 if q.startswith('01_print/') and ext=='.ctb':return '使用者提供切片檔；設定尚未驗證','User-provided slicer output; settings unverified'
 if q=='01_print/cost.md':return '原始切片成本筆記；現行BOM採其公式重新計算的批次金額','Original slicer cost notes; current BOM uses recalculated batch amounts from their formula'
 if 'assembly_coordinates/' in q:return '裝配座標網格；不重複列印','Assembly-coordinate mesh; do not print a second set'
 if 'templates/' in q:return '空白資料表；不得当實驗成果','Empty data template; not experimental results'
 if '08_reference/site_context/' in q:return '歷史網站來源；僅供更新定位','Historical site source; integration context only'
 if q.startswith('08_reference/'):return '原始廠商參考資料／來源說明','Original vendor reference / provenance'
 if ext in ['.mp4','.gif']:return '可重現模擬動畫；不是實測影片','Reproducible simulation animation; not measured footage'
 if ext=='.stl':return 'STL幾何','STL geometry'
 if ext in ['.py','.cs','.ps1','.cjs','.cpp','.h','.scad','.js','.css','.toml','.ini']:return '可編輯程式／模型／設定來源','Editable source / model / configuration'
 if 'build_evidence' in q or ext=='.log':return '已執行計算／編譯記錄','Executed computation / build record'
 if '/figures/' in q or '/drawings/' in q:return '圖表或實際幾何圖面','Figure or actual-geometry drawing'
 if 'ui_demo' in q:return '示範介面截圖；非實板數值','DEMO UI screenshot; not physical measurements'
 if ext=='.npz':return '原始模擬場／抽樣資料','Raw simulated field / sampled data'
 if '/results/' in q or ext=='.json':return '機器可讀結果／參數／檢查','Machine-readable results / parameters / checks'
 if ext in ['.xlsx','.csv'] and q.startswith('05_BOM'):return 'BOM與價格來源；未知留白','BOM and price provenance; unknown values remain blank'
 if ext=='.pdf':return '可閱讀／列印文件；與原始參考圖分開','Readable/printable report or manual'
 if ext=='.docx':return '可直接修改的Word；修改後須同步Markdown和PDF','Editable Word document; reconcile edits with Markdown and PDF'
 if ext=='.html':return '本機網頁／整合片段；未上線','Local page / integration fragment; not deployed'
 if ext=='.exe':return '本專案CFD求解器；附來源與重編腳本','Project-built CFD solver; source/build script included'
 if ext=='.zip':return '八件STL便捷下載包','Convenient eight-STL archive'
 if ext=='.md':return '可編輯文件與用途／重現說明','Editable documentation / reproduction instructions'
 return '交付支援檔','Supporting deliverable'
allfiles=list(files())
with (R/'file_catalog.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['file','purpose_ZH','purpose_EN','bytes','sha256'])
 for p in allfiles:w.writerow([p.relative_to(R).as_posix(),*role(p),p.stat().st_size,sha(p)])
allfiles.append(R/'file_catalog.csv')
(R/'manifest.sha256').write_text('\n'.join(f'{sha(p)}  {p.relative_to(R).as_posix()}' for p in sorted(allfiles))+'\n',encoding='utf8')
allfiles.append(R/'manifest.sha256')
archive=R.parent/'chatgpt version.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(allfiles):z.write(p,'chatgpt version/'+p.relative_to(R).as_posix())
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print(json.dumps({'public_files':len(allfiles),'public_bytes':sum(p.stat().st_size for p in allfiles),'zip':str(archive),'zip_bytes':archive.stat().st_size,'zip_sha256':sha(archive),'checks':status['release_QA_status']},indent=2))
