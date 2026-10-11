"""Create a small, indexed publication appendix from the authoritative package.
Archives retain package-relative paths: extract all four into the SAME directory.
No source is moved, deleted or published. User slicer outputs and vendor files stay out.
"""
from pathlib import Path
import hashlib,json,zipfile,html
R=Path(__file__).resolve().parent;OUT=R/'appendix'
SKIP={'_work','__pycache__','.pio','.git','video_frames'}
def allowed(p):
 return not SKIP.intersection(p.parts) and p.suffix.lower() not in {'.pyc','.ctb','.db','.sqlite'} and not p.name.startswith('~$') and p.name not in {'aerosense_config.h','config.h','intersection.scad'} and not p.name.endswith(('-wal','-shm'))
def archive(name,folders):
 paths=[]
 for folder in folders:
  d=R/folder
  paths.extend(p for p in (d.rglob('*') if d.is_dir() else [d]) if p.is_file() and allowed(p))
 paths=sorted(set(paths));target=OUT/name
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p in paths:z.write(p,p.relative_to(R).as_posix())
 with zipfile.ZipFile(target) as z:assert z.testzip() is None
 assert target.stat().st_size<99_000_000, 'Keep each appendix artifact below 99 MB; split by role if necessary.'
 return dict(file=name,bytes=target.stat().st_size,SHA256=hashlib.sha256(target.read_bytes()).hexdigest(),members=[p.relative_to(R).as_posix() for p in paths])
def main():
 OUT.mkdir(exist_ok=True)
 groups=[('optics_code_data.zip',['02_simulation/optics']),('airflow_code_data.zip',['02_simulation/airflow']),('transport_sensitivity.zip',['02_simulation/membrane']),('hardware_software_documents.zip',['01_print','03_software','04_manuals','05_BOM','07_validation','09_engineering_sources','06_wiki/content_plan','02_simulation/build_gallery.py','02_simulation/README_ZH.md','02_simulation/README_EN.md','handoff.md','handoff_EN.md','README_ZH.md','README_EN.md','08_reference/Gas_Delivery_Reference_ZH.md','08_reference/Gas_Delivery_Reference_EN.md','08_reference/references.bib'])]
 rows=[archive(n,d) for n,d in groups]
 for lang in ['ZH','EN']:
  en=lang=='EN'
  title='AeroSense technical appendix' if en else 'AeroSense 技術附錄'
  intro=('This is a publication subset of the authoritative chatgpt version package, not another design version. The selected eight STL meshes are unchanged. Extract all four archives into the SAME empty folder; paths are designed to merge. They contain source, saved raw simulation outputs, scripts for figures, software, current manuals and the selected print files. Large user slicer CTBs, private configuration, local databases, toolchains and vendor originals are excluded.' if en else '這是唯一主包 chatgpt version 的發布用子集，不是另一個設計版本。八個指定 STL 沒有修改。四個壓縮檔請解壓到「同一個」空資料夾，目錄會合併。內容包括原始碼、已保存模擬結果、繪圖程式、軟體、現行手冊與指定列印檔；不含使用者大型 CTB、私人設定、資料庫、工具鏈及廠商原檔。')
  boundaries=('The primary flow question is gas arrival near the liquid surface: conditional Q=3 mL/min, approximately 50 s worst t90 under declared assumptions. No uptake/cell-safety claim follows. The separate liquid/PDMS study is a no-protein/no-mixing counterfactual sensitivity. Measured blank subtraction removes a stable complex mean, not unknown variable interference or shot noise. No biological or physical test results are invented.' if en else '氣流主問題是液面附近氣相的到達：明示假設下，條件式 Q=3 mL/min，最慢 t90 約 50 秒；不代表吸收或細胞安全。另附液體／PDMS 模型是無蛋白促進、無混合的反事實敏感度分析。實測空白扣除只能處理穩定複數平均背景，不能消除未知變動干擾或散粒雜訊。沒有杜撰實板、生物或使用者測試資料。')
  instructions=('After extracting, start with each simulation README, 03_software/README_EN.md and 07_validation/Validation_Plan_EN.md. Dependencies are declared separately; rebuilding an image from saved output is not a new Monte Carlo sample or CFD solve. CAD scripts require OpenSCAD. Follow the safe-default firmware guide before hardware use. Source/data hashes inside model validation files support provenance; appendix_manifest.json fixes these four downloads.' if en else '解壓後先讀各模擬資料夾 README、03_software/README_ZH.md、07_validation/Validation_Plan_ZH.md。依各處 requirements 安裝依賴；從保存結果重畫不等於重新抽樣或重算 CFD。CAD 重建需 OpenSCAD；實板使用前依韌體預設鎖定與檢查流程操作。模型驗證檔保存來源／數據雜湊，appendix_manifest.json 固定本次四個下載檔。')
  publication=('Keep essential methods, results, limitations and the model-to-hardware decision on the main official wiki. GitHub may mirror these supporting downloads. No repository or live wiki was updated. Confirm current iGEM hosting rules, contributor attribution and licenses before public release; this package does not grant redistribution rights to vendor PCB files. Update this appendix after new real measurements or manual changes.' if en else '主要方法、關鍵結果、限制與模型如何影響硬體的決策，仍放正式 Wiki。GitHub 可鏡像這些補充下載；本次未發布 GitHub 或線上 Wiki。公開前確認當年 iGEM 託管規則、作者貢獻與授權；本包不授予廠商 PCB 資料的轉散權。取得實測或修改手冊後應重新產生附錄。')
  instructions+=(' The included handoff maps the full package; links to excluded vendor originals or local page previews require that full package. Editable Word editions accompany the reading PDFs; accepted edits must be reconciled with Markdown before rebuilding.' if en else ' 所附handoff描述完整主包；其中指向已排除的廠商原件或本機頁面預覽，須回完整包查看。可編輯Word與閱讀PDF並列；接受的Word修改須回填Markdown後再重建。')
  roles=[('Optical Monte Carlo, synthetic DLIA, figures and movies','光學蒙地卡羅、合成 DLIA、圖表與影片'),('Fixed-CAD gas flow, parameter scans, raw fields and 3D explorer','固定 CAD 氣流、參數掃描、原始流場與互動 3D'),('Separate liquid/PDMS transport assumptions and sensitivity','分開的液體／PDMS 傳輸假設與敏感度'),('Eight STLs, CAD, firmware/UI, BOM, manuals, single-experiment analysis and wiki drafts','八件 STL、CAD、韌體／UI、BOM、手冊、單一實驗分析與 Wiki 草稿')]
  md=f'# {title}\n\n{intro}\n\n'
  for r,role in zip(rows,roles):md+=f'- [{r["file"]}]({r["file"]}) - {role[0 if en else 1]} ({r["bytes"]/1e6:.1f} MB)\n'
  md+=f'\n## {"Interpretation" if en else "如何判讀"}\n\n{boundaries}\n\n## {"Reproduction" if en else "重現方法"}\n\n{instructions}\n\n## {"Publication" if en else "發布與授權"}\n\n{publication}\n'
  (OUT/f'README_{lang}.md').write_text(md,encoding='utf8')
  cards=''.join(f'<li><a href="{r["file"]}">{html.escape(role[0 if en else 1])}</a> <small>{r["bytes"]/1e6:.1f} MB</small></li>' for r,role in zip(rows,roles))
  doc=f'<!doctype html><html lang="{"en" if en else "zh-Hant"}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><style>body{{max-width:1000px;margin:40px auto;padding:0 24px;font:18px/1.8 system-ui,sans-serif;color:#173744}}a{{color:#087c83}}li{{margin:20px 0}}small{{color:#657986}}</style><h1>{title}</h1><p>{intro}</p><ul>{cards}</ul><p>{boundaries}</p><p>{instructions}</p><p>{publication}</p><p><a href="appendix_manifest.json">SHA-256 / manifest</a> · <a href="README_{"ZH" if en else "EN"}.md">{"中文" if en else "English"}</a></p></html>'
  (OUT/f'INDEX_{lang}.html').write_text(doc,encoding='utf8')
 (OUT/'appendix_manifest.json').write_text(json.dumps(dict(date='2026-10-08',scope='Publication subset; no upload performed; extract all archives to one root',excluded=['private config','databases','user CTB slicing','vendor originals','toolchains'],archives=rows),ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps([dict(file=r['file'],MB=round(r['bytes']/1e6,2),members=len(r['members'])) for r in rows]))
if __name__=='__main__':main()
