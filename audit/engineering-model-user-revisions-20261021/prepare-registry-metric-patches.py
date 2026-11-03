"""Prepare 11 existing-entry updates; never writes the Registry or numerical inputs."""
from pathlib import Path
import csv,hashlib,json,re,datetime

ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
BASE=ROOT/'aerosense-wiki/audit/final-publication-20261021/registry-upload-documentation-payload.json'
BATCH=ROOT/'zenodo-release/aerosense-wiki/data/signal-metric-clarification-2026-10-21'
def sha_bytes(b):return hashlib.sha256(b).hexdigest()
def sha(p):return sha_bytes(p.read_bytes())
def tables(s):return re.findall(r'(?m)^\|.*\|$',s)
data=json.loads(BASE.read_text(encoding='utf8'))
with (BATCH/'assay-metric-comparison.csv').open(encoding='utf8',newline='') as f:
    numbers={r['receptor']:r for r in csv.DictReader(f)}
patches=[]
for page in data['pages']:
    for e in page['entries']:
        if e['type']!='Characterisation' or ': Test 2' not in e['title']:continue
        receptor=e['title'].split(':')[0]
        key=receptor.lower().replace(' ','-')
        row=numbers[receptor]
        before=e['body_markdown']
        images=re.findall(r'!\[[^\]]*\]\(([^)]+)\)',before)
        assert len(images)==1
        placeholder='REGISTRY_IMAGE_UPLOAD_'+key.upper().replace('-','_')
        old_figure=re.search(r'!\[[^\]]*\]\([^)]+\)\n\n\*Each acquisition.*?\*',before,re.S).group(0)
        figure=(f'![{receptor}: Test 2 corrected changes S and construct-matched VUAA1 reference ratios N]({placeholder})\n\n'
                '*Upper panel: S = ΔF1 − ΔF0, in percentage points (pp), using the observed F1 change over 168 s and F0 change over 48 s. Lower panel: N = (S − DMSO S) / (VUAA1 S − DMSO S), the same dimensionless normalization used in the Results heatmap. DMSO is 0 and VUAA1 is 1 by definition; these anchors do not bound other responses. Negative values remain visible. Each condition–addition pair is one separate well.*\n\n'
                f'[Full within-acquisition F0/F1 time courses]({images[0]}).')
        after=before.replace('### Disturbance-corrected fluorescence profile','### Test 2: corrected changes and VUAA1-referenced responses',1).replace(old_figure,figure,1)
        s=float(row['test2_S_pp']);vehicle=float(row['test2_DMSO_S_pp']);den=float(row['test2_VUAA1_minus_DMSO_pp'])
        note=(f'**Reading S and N together.** For this construct, VUAA1 has **S = {s:+.2f} pp** and the separate DMSO well has **S = {vehicle:+.2f} pp**. Their difference is **{den:+.2f} pp**, so the VUAA1 ratio is **N = 1.000**. The value 1 in the Results heatmap is this reference ratio, not a corrected change of 1 pp. The bars, the table below and the heatmap use the same Test 2 endpoints; no response values were changed to produce this display.')
        if receptor=='Or7a':note+=' The small +2.19 pp reference denominator makes Or7a ratios particularly sensitive to small well differences.'
        if receptor not in ('Or35a','ORCO only'):note=note.replace('the table below','the accompanying table')
        after=after.replace('### Interpretation','### Interpretation\n\n'+note,1)
        assert tables(before)==tables(after)
        assert before.count('<a id="odor-2026-10-21"></a>')==after.count('<a id="odor-2026-10-21"></a>')==1
        png=BATCH/'figures'/f'test2-{key}-summary.png';svg=png.with_suffix('.svg')
        assert png.is_file() and svg.is_file()
        patches.append({'priority':0 if receptor=='Or35a' else 1 if receptor=='ORCO only' else 2,
                        'receptor':receptor,'entry_key':e['entry_key'],'remote_entry_id':e['remote_entry_id'],
                        'part_uuid':page['part_uuid'],'page_url':page['url'],'edit_url':e['live_matching']['edit_url_pattern'],
                        'action':'update_existing','type':e['type'],'title':e['title'],'source_path':page['source_path'],
                        'before_body_sha256':sha_bytes(before.encode()),'body_template':after,
                        'body_template_sha256':sha_bytes(after.encode()),'image_placeholder':placeholder,
                        'original_full_trace_image_url':images[0],'upload_path':str(png),'upload_sha256':sha(png),
                        'upload_bytes':png.stat().st_size,'source_svg_path':str(svg),'source_svg_sha256':sha(svg),
                        'png_relation':'180-dpi output of the same Matplotlib figure object as the SVG; no changed data',
                        'original_table_lines_preserved':len(tables(before)),'S_pp':s,'DMSO_S_pp':vehicle,
                        'VUAA1_minus_DMSO_pp':den,'VUAA1_N':1.0})
patches.sort(key=lambda x:(x['priority'],x['receptor']))
assert len(patches)==11 and len({p['remote_entry_id'] for p in patches})==11
output={'prepared_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'status':'source templates frozen; Registry image URLs required before UI save',
        'base_payload':str(BASE),'base_payload_sha256':sha(BASE),
        'entry_count':11,'create_count':0,'update_count':11,
        'scope':'Presentation clarification only: preserve all prior S/ΔF0/ΔF1/S48 table lines; add matching N view and retain old full curves as links.',
        'patches':patches}
(OUT/'registry-metric-clarification-patches.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'entries':11,'png_bytes':sum(x['upload_bytes'] for x in patches),'tables_preserved':sum(x['original_table_lines_preserved'] for x in patches)},indent=2))
