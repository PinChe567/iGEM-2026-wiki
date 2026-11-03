"""Narrow Hardware prose/caption changes; official image URLs updated separately."""
from pathlib import Path
import re,json,hashlib
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[3];P=ROOT/'aerosense-wiki/hardware.html';A=Path(__file__).resolve().parent
s=P.read_text(encoding='utf8');old=s
def section(text,identifier,tag='section'):
    m=re.search(r'<'+tag+r'\b[^>]*\bid="'+re.escape(identifier)+r'"[^>]*>.*?</'+tag+'>',text,re.S);assert m,identifier
    return m
m=section(s,'reader-pattern-backend','div')
backend='<div class="hw-topic-block" id="reader-pattern-backend"><h3 class="reading-heading--topic">Reference-pattern analysis</h3><p>The local backend reconstructs four ΔF/F₀ time courses from saved measurements and calibration records. It compares the Or22a, Or35a, Or85b and Or98a response pattern with laboratory and DoOR reference patterns, then displays separate ranked matches in the interface. Scores are 100 × max(0, Pearson r), so they describe pattern similarity rather than probabilities of odor identity.</p></div>'
s=s[:m.start()]+backend+s[m.end():]
m=section(s,'hardware-discussion')
previous_discussion=BeautifulSoup(m.group(),'html.parser').get_text(' ',strip=True)
discussion='''<section class="section-block hw-main-chapter" id="hardware-discussion"><h2 class="reading-heading--chapter">Discussion</h2>
<p>The assembled reader combines replaceable cell wells, a shared gas chamber and frequency-tagged optical readout in a serviceable enclosure. Fixed optical registration supports repeated calibration, while separate cooling and sample-gas paths avoid using fan operation to set sample delivery. The tested acquisition workflow and revised assembly manual provide a practical starting point for replication.</p>
<p>The reader separates four modulation channels, but its isolated-well calibration does not directly transfer to simultaneous loading: uniform 10 µM responses are only 48.3–69.4% of the predicted sum. Likewise, strong same-well responses drive much of the simulation–measurement correlation (r = 0.810); the 12 off-diagonal entries give r = 0.257. The floor-layer simulation and liquid-volume standard have different source conditions, and the measured signal includes electronics. Arbitrary-mixture recovery therefore needs matched single-source and mixed-source controls across concentrations.</p>
<p>Viable cells were recovered from printed wells, but the lower viability in the bottom fraction cannot be assigned to resin, culture conditions or recovery without matched controls. Resin choice and post-processing can affect compatibility <a class="cite" href="#ref-kress-2020" id="cite-kress-2020-hardware">[21]</a>. Machined PMMA and poly-D-lysine are candidates supported by separate HEK293 studies <a class="cite" href="#ref-obuliraj-2014" id="cite-obuliraj-2014-hardware">[22]</a><a class="cite" href="#ref-faussner-2022" id="cite-faussner-2022-hardware">[23]</a>; comparison with standard culture plastic should measure viability, retained cells, optical background and reporter response under matched conditions.</p>
<p>Airflow calculations describe gas delivery beside fixed liquid surfaces, not cell forces or uniform cellular exposure. Nominal CAD dimensions still require fit and alignment checks. An independent timed assembly and operation trial should test the revised manual, recording assistance and errors.</p>
<p>The single cell run does not separate receptor responses from liquid addition or optical mixing; the fluorescein calibration was not applied to it. These traces remain descriptive observations.</p>
<p>Cross-platform similarity is not specific to matched constructs: D2 gives r = 0.9719 with Or85b and 0.9671 with Or35a, and the rank map also contains strong off-diagonal matches. D2 remains positive after omitting the first point and using the original device clock; D3 falls from r = 0.756 to 0.114 when the first point is omitted. Control subtraction preserves some shared trends, but preceding hardware-medium readings and separate wet-lab DMSO wells are different references. Serial time points do not establish synchronized kinetics, biological replication or receptor-specific activation.</p></section>'''
s=s[:m.start()]+discussion+s[m.end():]
m=section(s,'reader-wetlab-pairwise-correlations','figure');figure=m.group()
figure=figure.replace('Two four-by-four Pearson correlation maps compare signal levels and first differences, with intended construct matches outlined.','Four-by-four Pearson and Spearman maps compare the same five signal-level observations, with intended construct matches outlined.')
caption='All 16 hardware–wet-lab pairings at 0, 12, 24, 36 and 48 s are shown. Left: Pearson r; right: Spearman ρ of the same five signal levels, each divided by its own first reading. Outlines mark intended construct matches; strong off-diagonal correlations show that similar trends are not pairing-specific. The five serial observations are not biological replicates.'
figure=re.sub(r'(<figcaption><strong class="media-caption__label">.*?</strong>).*?(</figcaption>)',lambda m:m[1]+caption+m[2],figure,flags=re.S)
s=s[:m.start()]+figure+s[m.end():]
before=BeautifulSoup(old,'html.parser');after=BeautifulSoup(s,'html.parser')
assert len(before.find_all('figure'))==len(after.find_all('figure'))
assert [str(t) for t in before.find_all('table')]==[str(t) for t in after.find_all('table')]
assert {x['id'] for x in before.select('[id]')}=={x['id'] for x in after.select('[id]')}
P.write_text(s,encoding='utf8',newline='')
receipt={'scope':'Backend three sentences; concise Discussion; Pearson/Spearman caption and alt text. URLs await verified upload mapping.',
         'before_sha256':hashlib.sha256(old.encode()).hexdigest(),'after_sha256':hashlib.sha256(s.encode()).hexdigest(),
         'discussion_words_before':len(previous_discussion.split()),'discussion_words_after':len(BeautifulSoup(discussion,'html.parser').get_text(' ',strip=True).split()),
         'figures_tables_ids_preserved':True,'raw_or_numerical_inputs_changed':False,
         'backend_source':'PCB layout/chatgpt version/03_software/analysis/odor_session.py and odor_pattern.py',
         'backend_map_distinct_from_earlier_cell_test':True,'image_URL_update_pending':True}
(A/'hardware-text-edit.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
print(json.dumps(receipt,indent=2))
