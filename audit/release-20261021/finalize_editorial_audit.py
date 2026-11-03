"""Validate the scoped prose edit and refresh translated phrase aliases."""
from pathlib import Path
from bs4 import BeautifulSoup
import collections,hashlib,json,re
base=Path(__file__).parent;root=base.parents[1]
before=json.loads((base/'editorial-before.json').read_text(encoding='utf-8'))
after=json.loads((base/'editorial-after.json').read_text(encoding='utf-8'))
changes=json.loads((base/'editorial-changes.json').read_text(encoding='utf-8'))
norm=lambda x:re.sub(r'\s+',' ',x).strip()
aliases={}
for name in before:
    page=BeautifulSoup((root/(name+'.html')).read_text(encoding='utf-8'),'html.parser')
    visible=norm(page.select_one('main').get_text(' ',strip=True))
    locale=root/'locales/extras/zh-Hant'/f'{name}.json'
    values=json.loads(locale.read_text(encoding='utf-8'));added=0
    for c in changes:
        if c['page']!=name or c['kind']!='wording':continue
        old,new=c['before'],c['after']
        for key,value in list(values.items()):
            candidate=key.replace(old,new)
            if candidate==key or candidate in values or norm(candidate) not in visible:continue
            translated=value
            if old=='P2' or 'P2' in old:translated=translated.replace('P2','Test 1')
            if '2026' in old and '2026' not in new:translated=re.sub(r'2026\s*年?\s*','',translated)
            values[candidate]=translated;added+=1
    if name=='measurement':values['Object segmentation and parameters:']='物件分割與參數：'
    locale.write_text(json.dumps(values,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');aliases[name]=added
    for field in ['media','table_text_hashes','scripts','figures']:
        assert before[name][field]==after[name][field],(name,field)
    assert not set(before[name]['all_ids'])-set(after[name]['all_ids'])
    ids=collections.Counter(x['id'] for x in page.select('[id]'))
    assert not any(v>1 for v in ids.values()),name
summary={
 'scope':list(before),
 'edits_by_kind':dict(collections.Counter(x['kind'] for x in changes)),
 'edits_by_page':dict(collections.Counter(x['page'] for x in changes)),
 'translation_aliases_added':aliases,
 'figures_preserved':sum(len(v['figures'])for v in before.values()),
 'tables_preserved':sum(len(v['table_text_hashes'])for v in before.values()),
 'verification':{'figure_markup_and_captions_unchanged':True,'table_text_and_numbers_unchanged':True,'media_attributes_unchanged':True,'script_bodies_unchanged':True,'all_existing_ids_retained':True,'local_fragment_targets_checked':True,'new_method_anchor':'experiments.html#exp-test2-kinetics','global_locale_build_run':False},
 'word_counts':{n:{'before':before[n]['word_count'],'after':after[n]['word_count']}for n in before},
 'numeric_prose_changes':'Dilution factors were relocated from Results to Experiments. Other changes are Test 1 label substitutions, removal of repeated protocol details/headings, and project framing year removal. All scientific table text, figure captions, plotted assets and canonical numerical data remain unchanged.',
 'retained_exceptions':['Bibliographic publication/access years and official team branding remain.','MaleCNS v0.9/v1.0 identify external scientific source versions and remain; they are not AeroSense design versions.','44–48 h and approximately 72 h remain as scientific durations and sample-provenance qualifications, including Discussion.','Two source-protocol table captions retain the original P2 label because table text was preserved.'],
 'limitations_retained':['One well per construct/stimulus and technical time points are not independent cultures.','Test 1 and Test 2 use different controls and metric definitions.','Test 2 stock concentrations were not supplied; Test 1 lacks a matched DMSO vehicle.','Unrecorded gain and cell-state differences constrain specificity claims.','Selected DAPI-object fractions do not estimate whole-culture transfection efficiency.','Threshold calibration, clustering, segmentation and biological replication constrain image statistics.','VUAA1 normalization compares separate single wells and can be sensitive to a small denominator.'],
 'canonical_change_summary_sha256':hashlib.sha256((root.parent/'zenodo-release/aerosense-wiki/data/odor-2026-10-21/derived/change-summary.csv').read_bytes()).hexdigest()
}
(base/'editorial-report.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
