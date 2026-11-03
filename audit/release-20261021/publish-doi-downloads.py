"""Publish exact, context-matched small artifacts and repair obsolete DOI anchors.

Only the official GitLab staging tree and daily site's specified links are changed.
Archived source bytes, figures, numeric results and scripts are never modified.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import quote
import collections, csv, hashlib, html, json, re, shutil

BASE = Path(__file__).resolve().parent
SITE = BASE.parents[1]
WORK = SITE.parent
ARCH = WORK/'zenodo-release'
REPO = WORK/'gitlab/nthu'
DOI = 'https://doi.org/10.5281/zenodo.23469212'
GIT = 'https://gitlab.igem.org/2026/nthu/-/'
STATUS = GIT+'blob/main/docs/aerosense/archive-status.md'
proposal = json.loads((BASE/'doi-link-routing-proposal.json').read_text(encoding='utf-8'))
records = proposal['records']
copies = {}
mapping = {}

def sha(data): return hashlib.sha256(data).hexdigest()
def git_url(kind, path): return GIT+kind+'/main/'+quote(path,safe='/')

def copy_exact(source, destination):
    source = ARCH/source
    target = REPO/destination
    assert source.is_file(), source
    data = source.read_bytes()
    existed = target.is_file()
    if existed:
        assert target.read_bytes() == data, f'Existing publication artifact differs: {target}'
    else:
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(data)
    assert target.read_bytes() == data
    copies[destination] = {'source':source.relative_to(WORK).as_posix(), 'destination':destination,
      'bytes':len(data),'sha256':sha(data),'action':'existing_identical' if existed else 'copied',
      'public_url_verified':False}
    return destination

def artifact(page,index,source,destination,label=None,reason=None):
    destination=copy_exact(source,destination)
    mapping[(page,index)]={'route':'exact_artifact','proposed_path':destination,
      'proposed_url':git_url('blob' if destination.endswith('.md') else 'raw',destination),
      'proposed_label':label,'source':copies[destination]['source'],'sha256':copies[destination]['sha256'],
      'reason':reason or 'Context-specific archived artifact copied byte-for-byte into its canonical publication path.'}

def existing(page,index,destination,label=None,reason=None):
    assert (REPO/destination).is_file(),destination
    mapping[(page,index)]={'route':'exact_artifact','proposed_path':destination,
      'proposed_url':git_url('raw',destination),'proposed_label':label,
      'sha256':sha((REPO/destination).read_bytes()),'reason':reason or 'Existing canonical publication artifact; identity checked against the relevant source manifest.'}

def folder(page,index,destination,label,reason):
    assert (REPO/destination).is_dir(),destination
    mapping[(page,index)]={'route':'specific_dataset_directory','proposed_path':destination,
      'proposed_url':git_url('tree',destination),'proposed_label':label,'reason':reason}

def video(page,index,url,label,source):
    mapping[(page,index)]={'route':'verified_corresponding_video','proposed_url':url,
      'proposed_label':label,'reason':'Corresponding rendered movie is public on iGEM Video Universe; this link does not claim to download the archived raw AVI/MP4.',
      'source':source,'public_url_verified':True}

# Context: these files populate the receptor-engineering evidence tables on Model.
receptor_src='aerosense-wiki/bioinformatic_results/site/assets/receptor-engineering/'
receptor_dst='code/aerosense/receptor-engineering/wiki-site/assets/receptor-engineering/'
for row in records:
    if row['page']!='model.html' or row['doi_link_index']<18: continue
    idx=row['doi_link_index']; relative=row['label'].split(' — ')[0]
    source=receptor_src+relative
    if idx==48: source='aerosense-wiki/assets/receptor-engineering-v13/'+relative
    artifact('model.html',idx,source,receptor_dst+relative,
      reason='Exact file in the receptor-engineering public synthesis, matched by its full nested path and the Model evidence-table context; not an unrelated basename match.')

# Context: physical model tables, diagnostics and stored calculation summaries.
sim_src='aerosense-wiki/hardware information/AeroSense v2/02_simulation/'
sim_dst='code/aerosense/hardware/02_simulation/'
for row in records:
    if row['page']=='model.html' and 5<=row['doi_link_index']<=15:
        rel=row['label'].split(' — ')[0]
        artifact('model.html',row['doi_link_index'],sim_src+rel,sim_dst+rel)
artifact('model.html',16,'aerosense-wiki/resources/model/model-manuscript-2026-10-10.md',
 'docs/aerosense/model/model-manuscript-2026-10-10.md','Archived model manuscript — GitLab',
 'Archived manuscript contains the decoder narrative and explicitly identifies its historical interpretation boundary.')
folder('model.html',17,receptor_dst.rstrip('/'),'Receptor evidence tables — GitLab',
 'The handover links to the exact published receptor-engineering CSV/JSON synthesis.')

# The published-video manifest maps source identity, hash and exact watch URL.
videos=json.loads((ARCH/'published-video-replacements.json').read_text(encoding='utf-8'))['published_video_replacements']
video_by_rel={v['destination_relative']:v for v in videos}
for i,rel,title in [
 (1,'optics/videos/optical_slow_motion.mp4','Watch optical slow motion'),
 (2,'optics/videos/filter_signal_comparison.mp4','Watch filter signal comparison'),
 (3,'airflow/videos/surface_arrival.mp4','Watch surface arrival'),
 (4,'airflow/videos/airflow_comparison.mp4','Watch airflow comparison')]:
    key=sim_src+rel; v=video_by_rel[key]; assert v['public_delivery_verified']
    video('model.html',i,v['watch_url'],title+' — Video Universe',v['workspace_relative'])
for i,url,title in [
 (21,'https://video.igem.org/w/6Pa3Sqm3YFAzEAcJW8krwB','Watch TH-GFP recording'),
 (22,'https://video.igem.org/w/bhCd2DjM8qbRkZLh4yo2TJ','Watch GH146-GCaMP6f, three odors'),
 (23,'https://video.igem.org/w/4mG6jqCpdgUfyZkwtrg5Cw','Watch GH146-GCaMP6f, four odors')]:
    readback=json.loads((SITE/'audit/final-publication-20261021/video-readback.json').read_text(encoding='utf-8'))
    rec=next(v for v in readback if v['url']==url)
    assert rec['http']==200 and rec['privacy']['id']==1 and rec['state']['id']==1
    video('results.html',i,url,title+' — Video Universe',rec['name'])

# Hardware: distinguish mesh comparisons, the selected design, spectral
# digitization, saved numerical ledgers, and measured cell counts.
hardware_files={
 1:('aerosense-wiki/resources/pcb-v38/component-audit.csv','docs/aerosense/hardware/component-audit.csv',None),
 2:('aerosense-wiki/resources/pcb-v38/component-audit.json','docs/aerosense/hardware/component-audit.json',None),
 3:('aerosense-wiki/resources/pcb-v38/calculations.json','docs/aerosense/hardware/calculations.json',None),
 13:(sim_src+'airflow/results/mesh_refinement.csv',sim_dst+'airflow/results/mesh_refinement.csv','Airflow mesh comparison · CSV — GitLab'),
 14:(sim_src+'airflow/code/data/selection.json',sim_dst+'airflow/code/data/selection.json','Airflow selection record · JSON — GitLab'),
 15:(sim_src+'optics/results/filter_comparison_summary.csv',sim_dst+'optics/results/filter_comparison_summary.csv',None),
 16:('aerosense-wiki/assets/hardware/optics-v38/spectral-alignment-data.csv','code/aerosense/visualization/aerosense-wiki/assets/hardware/optics-v38/spectral-alignment-data.csv',None),
 17:('aerosense-wiki/assets/hardware/optics-v38/spectral-provenance.json','code/aerosense/visualization/aerosense-wiki/assets/hardware/optics-v38/spectral-provenance.json',None),
 18:(sim_src+'optics/code/data/filter_comparison_summary.json',sim_dst+'optics/code/data/filter_comparison_summary.json',None),
 19:(sim_src+'airflow/results/surface_arrival.csv',sim_dst+'airflow/results/surface_arrival.csv',None),
 20:(sim_src+'airflow/results/operating_sweep.csv',sim_dst+'airflow/results/operating_sweep.csv',None),
 21:(sim_src+'airflow/code/data/supplemental_summary.json',sim_dst+'airflow/code/data/supplemental_summary.json',None),
 22:('aerosense-wiki/hardware information/AeroSense v2/10_cell_viability_results/counts.csv','code/aerosense/hardware/10_cell_viability_results/counts.csv',None),
 23:('aerosense-wiki/hardware information/AeroSense v2/10_cell_viability_results/results.csv','code/aerosense/hardware/10_cell_viability_results/results.csv',None),
 25:('aerosense-wiki/resources/hardware-en/publication-manifest.json','docs/aerosense/hardware/publication-manifest.json',None)}
for i,(source,dest,label) in hardware_files.items(): artifact('hardware.html',i,source,dest,label)
stls=json.loads((BASE/'printable-stl-source-manifest.json').read_text(encoding='utf-8'))['files']
for i,item in enumerate(stls,4):
    existing('hardware.html',i,item['destination'],'STL source — GitLab')
    assert mapping[('hardware.html',i)]['sha256']==item['sha256']
folder('hardware.html',12,sim_dst+'airflow','Airflow tables and records — GitLab','Airflow model folder with the corresponding numerical outputs and methods.')
folder('hardware.html',24,'code/aerosense/hardware','Published hardware source and data — GitLab','The hardware source tree now includes the linked small measurements and calculation tables.')
folder('hardware.html',26,'code/aerosense/hardware','Published hardware source and data — GitLab','Hardware source-library reference.')

# Wet-lab analysis packages retain their established directory relationships.
wet_src='aerosense-wiki/assets/results/'
wet_dst='code/aerosense/wetlab/aerosense-wiki/assets/results/'
for foldername in ['final-test/derived','final-test/reported']:
    for source in sorted((ARCH/(wet_src+foldername)).iterdir()):
        if source.is_file(): copy_exact(source.relative_to(ARCH).as_posix(),wet_dst+foldername+'/'+source.name)
for source in sorted((ARCH/'aerosense-wiki/wetlab results/final_test/raw_renamed').iterdir()):
    if source.is_file(): copy_exact(source.relative_to(ARCH).as_posix(),'code/aerosense/wetlab/aerosense-wiki/wetlab results/final_test/raw_renamed/'+source.name)
for source in sorted((ARCH/(wet_src+'microscopy')).iterdir()):
    if source.is_file() and source.suffix.lower() in ['.csv','.json','.txt']:
        # Registry already publishes this exact small condition table.
        if source.name=='nuclear-object-per-condition.csv':
            assert sha(source.read_bytes())==sha((REPO/'docs/aerosense/parts/data/nuclear-object-per-condition.csv').read_bytes())
            continue
        copy_exact(source.relative_to(ARCH).as_posix(),wet_dst+'microscopy/'+source.name)
result_files={
 2:('final-test/derived/plate-p2-timeseries.csv',None),
 3:('final-test/derived/plate-p2-well-summary.csv',None),
 4:('final-test/experiment-metadata.json',None),
 5:('final-test/derived/plate-p2-source-number-audit.csv',None),
 6:('final-test/derived/plate-p2-run-qc.csv',None),
 7:('final-test/derived/plate-p2-source-qc-audit.csv',None),
 10:('microscopy/control-comparison.csv',None),
 12:('microscopy/nuclear-object-measurements.csv',None),
 13:('microscopy/nuclear-object-per-field.csv',None),
 15:('microscopy/per-field-channel-qc.csv',None),
 16:('microscopy/source-manifest.json',None),
 17:('cloning/source-manifest.json',None)}
for i,(rel,label) in result_files.items(): artifact('results.html',i,wet_src+rel,wet_dst+rel,label)
existing('results.html',14,'docs/aerosense/parts/data/nuclear-object-per-condition.csv','CSV — GitLab',
 'Byte-identical condition table already published with the Registry documentation; reuse its canonical file instead of creating another copy.')
artifact('results.html',18,'aerosense-wiki/wetlab results/transfection_effeciency/transfect.xlsx',
 'code/aerosense/wetlab/aerosense-wiki/wetlab results/transfection_effeciency/transfect.xlsx',
 reason='Workbook shared strings confirm the plate map and plasmid/reagent-calculation record; it is not a measurement or proof of execution.')
folder('results.html',1,wet_dst+'final-test','Test 1 analysis tables — GitLab','Paired with all 32 byte-identical original instrument CSV exports in the sibling research directory.')
folder('results.html',9,wet_dst+'microscopy','Control-audit tables — GitLab','Fisher/Holm, Wilson, blank holdout and area/object comparison tables with source scripts.')
folder('results.html',11,wet_dst+'microscopy','Microscopy analysis tables — GitLab','Object, field, condition, QC and provenance outputs; raw TIFF availability is separately identified.')
folder('measurement.html',1,wet_dst+'microscopy','Control-audit tables — GitLab','Specific microscopy calculation outputs and sources.')

# Light-sheet data: preserve the complete small numerical/ROI inputs and results;
# raw video bytes remain archived, while rendered videos have separate watch links.
light_src='aerosense-wiki/wetlab results/description_lightsheet/'
light_dst='code/aerosense/wetlab/aerosense-wiki/wetlab results/description_lightsheet/'
for subtree in ['raw_data','results','source','videos']:
    for source in sorted((ARCH/(light_src+subtree)).rglob('*')):
        if source.is_file() and source.suffix.lower() in ['.csv','.json','.txt','.py','.zip']:
            assert source.stat().st_size < 10_000_000,source
            relative=source.relative_to(ARCH/light_src).as_posix()
            copy_exact(source.relative_to(ARCH).as_posix(),light_dst+relative)
for i,group in [(19,'GH146'),(20,'TH')]:
    folder('results.html',i,light_dst+'results/'+group,group+' numerical dataset — GitLab',
      'Specific derived measurement tables. Sibling raw_data directories retain the original intensity CSVs, ROI archives and acquisition timestamps; videos are linked separately.')

# Only full-archive and original-image availability remain status links.
for row in records:
    key=(row['page'],row['doi_link_index'])
    if key not in mapping:
        assert row['doi_link_index']==0 or key==('results.html',8),key
        mapping[key]={'route':'archive_status_not_download','proposed_url':STATUS,
          'proposed_label':'Original TIFF archive availability' if key==('results.html',8) else 'Research archive availability',
          'reason':'The complete raw archive/original TIFF collection has no verified public Zenodo deposit; this is explicitly an availability note.'}
    replacement=mapping[key]
    if replacement.get('proposed_label') is None:
        replacement['proposed_label']=row['label'].replace(' — Zenodo research record',' — GitLab')
    for obsolete in ['proposed_path','source','sha256','public_url_verified']:
        row.pop(obsolete,None)
    row.update(replacement)
    row.setdefault('public_url_verified',False)

def invariant(text):
    soup=BeautifulSoup(text,'html.parser')
    # Downloads may appear in tables, so only link text is excluded from the
    # before/after content signature; numeric table cells remain covered.
    for a in soup.select('a'): a.clear()
    return {'figures':len(soup.select('figure')),'tables':len(soup.select('table')),
      'figure_content':sha(''.join(str(x) for x in soup.select('figure')).encode()),
      'table_content_without_links':sha(''.join(str(x) for x in soup.select('table')).encode()),
      'scripts':sha(''.join(str(x) for x in soup.select('script')).encode()),
      'ids':sorted(x['id'] for x in soup.select('[id]'))}

label_zh={
 'Research archive availability':'研究資料封存與公開狀態',
 'Original TIFF archive availability':'原始 TIFF 資料的封存與公開狀態',
 'Receptor evidence tables — GitLab':'受體研究證據表 — GitLab',
 'Archived model manuscript — GitLab':'封存模型文稿 — GitLab',
 'Airflow mesh comparison · CSV — GitLab':'氣流網格比較 · CSV — GitLab',
 'Airflow selection record · JSON — GitLab':'氣流設計選擇紀錄 · JSON — GitLab',
 'Airflow tables and records — GitLab':'氣流數據表與紀錄 — GitLab',
 'Published hardware source and data — GitLab':'已公開的硬體原始碼與資料 — GitLab',
 'Test 1 analysis tables — GitLab':'測試 1 分析資料表 — GitLab',
 'Control-audit tables — GitLab':'對照稽核資料表 — GitLab',
 'Microscopy analysis tables — GitLab':'顯微影像分析資料表 — GitLab',
 'GH146 numerical dataset — GitLab':'GH146 數值資料集 — GitLab',
 'TH numerical dataset — GitLab':'TH 數值資料集 — GitLab',
 'Watch optical slow motion — Video Universe':'觀看光學慢動作 — Video Universe',
 'Watch filter signal comparison — Video Universe':'觀看濾片訊號比較 — Video Universe',
 'Watch surface arrival — Video Universe':'觀看表面氣體抵達過程 — Video Universe',
 'Watch airflow comparison — Video Universe':'觀看氣流比較 — Video Universe',
 'Watch TH-GFP recording — Video Universe':'觀看 TH-GFP 錄影 — Video Universe',
 'Watch GH146-GCaMP6f, three odors — Video Universe':'觀看 GH146-GCaMP6f 三種氣味錄影 — Video Universe',
 'Watch GH146-GCaMP6f, four odors — Video Universe':'觀看 GH146-GCaMP6f 四種氣味錄影 — Video Universe',
 'Archive availability:':'資料公開狀態：'}
html_changes=[]
for page,rows in __import__('itertools').groupby(records,key=lambda r:r['page']):
    rows=list(rows); path=SITE/page; before=path.read_text(encoding='utf-8')
    count=[0]
    pattern=re.compile(r'<a\b[^>]*\bhref=[\"\']'+re.escape(DOI)+r'[\"\'][^>]*>.*?</a>',re.S)
    def repair(match):
        i=count[0];count[0]+=1;row=rows[i]
        assert row['doi_link_index']==i
        old=match.group();open_tag,inner=old.split('>',1);inner=inner[:-4]
        actual=BeautifulSoup(inner,'html.parser').get_text(' ',strip=True)
        assert actual==row['label'],(page,i,actual,row['label'])
        open_tag=open_tag.replace(DOI,html.escape(row['proposed_url'],quote=True))
        standard=row['label'].replace(' — Zenodo research record',' — GitLab')
        if row['proposed_label']==standard and 'Zenodo research record' in inner:
            inner=inner.replace('Zenodo research record','GitLab')
        else: inner=html.escape(row['proposed_label'])
        return open_tag+'>'+inner+'</a>'
    after=pattern.sub(repair,before)
    assert count[0]==len(rows),(page,count[0],len(rows))
    after=after.replace('Research data record:', 'Archive availability:')
    assert '23469212' not in after,page
    # Structural, table numeric and figure integrity with anchor attributes
    # normalized because their intended destinations changed.
    def neutral(t):
        s=BeautifulSoup(t,'html.parser')
        for a in s.select('a'): a.clear();a.attrs={}
        return str(s)
    before_sig=invariant(neutral(before));after_sig=invariant(neutral(after))
    assert before_sig==after_sig,(page,before_sig,after_sig)
    path.write_text(after,encoding='utf-8',newline='')
    html_changes.append({'page':page,'anchors_repaired':count[0],'before_sha256':sha(before.encode()),
      'after_sha256':sha(after.encode()),'invariants':after_sig})
    locale=SITE/'locales/extras/zh-Hant'/Path(page).with_suffix('.json').name
    translations=json.loads(locale.read_text(encoding='utf-8')) if locale.exists() else {}
    translations={k:v for k,v in translations.items() if '23469212' not in k+v}
    translations.update({k:v for k,v in label_zh.items() if k in after})
    translations['GitLab']='GitLab'
    for row in rows:
        label=row['proposed_label']
        if label not in translations:
            old_translation=translations.get(row['label'])
            old_base=row['label'].split(' — ')[0]
            old_translation=old_translation or translations.get(old_base)
            if old_translation:
                translations[label]=re.sub(r'\s*[—·]\s*Zenodo.*$', '', old_translation)+' — GitLab'
            elif re.search(r'\.(?:csv|json|zip)$',old_base): translations[label]=label
    locale.write_text(json.dumps(translations,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Remove the known obsolete DOI entry from the hardware core catalog too.
source_path=SITE/'locales/source/hardware.json'
source=json.loads(source_path.read_text(encoding='utf-8'))
zh_path=SITE/'locales/zh-Hant/hardware.json'
zh=json.loads(zh_path.read_text(encoding='utf-8'))
for key,item in source.items():
    if '23469212' in item.get('text',''):
        item['text']='Research archive availability';zh[key]=label_zh['Research archive availability']
source_path.write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
zh_path.write_text(json.dumps(zh,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

proposal['summary']=dict(collections.Counter(r['route'] for r in records))
proposal['status']='Applied to the daily site and canonical GitLab publication copies; public GitLab readback is pending the parent-controlled commit/push.'
proposal['limitations']=['No original source bytes or scientific results were changed.',
 'Raw TIFF images and the full research archive remain locally preserved with explicit publication-status links.',
 'Video links are exact corresponding published renderings, not raw AVI downloads.',
 'No GitHub files were modified. No commit or push was performed.']
(BASE/'doi-link-routing-proposal.json').write_text(json.dumps(proposal,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(BASE/'doi-download-publish-manifest.json').write_text(json.dumps({'files':list(copies.values()),'html_changes':html_changes,
 'total_files':len(copies),'total_bytes':sum(v['bytes']for v in copies.values()),
 'copied_files':sum(v['action']=='copied'for v in copies.values()),'routing':proposal['summary']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'files':len(copies),'bytes':sum(v['bytes']for v in copies.values()),'routing':proposal['summary'],'html_pages':len(html_changes)}))
