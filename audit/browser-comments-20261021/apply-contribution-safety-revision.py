from pathlib import Path
from bs4 import BeautifulSoup
import re,json,hashlib
ROOT=Path(__file__).resolve().parents[2]
AUDIT=Path(__file__).parent
def fragment(s):return BeautifulSoup(s,'html.parser')
def replace(text,id,new):
 m=re.search(r'<([\w-]+)\b[^>]*\bid="'+re.escape(id)+r'"[^>]*>',text);assert m,id
 depth=0
 for x in re.finditer(r'<(/?)'+m.group(1)+r'\b[^>]*>',text[m.start():],re.I):
  depth+= -1 if x.group(1) else 1
  if depth==0:return text[:m.start()]+str(new)+text[m.start()+x.end():]
 raise AssertionError(id)
def signature(s):
 return {'images':sorted({x.get('src','') for x in s.find_all('img')}),'tables':[x.get_text(' ',strip=True) for x in s.find_all('table')],'hrefs':sorted({x.get('href','') for x in s.find_all('a')}),'ids':sorted(x['id'] for x in s.select('[id]'))}

p=ROOT/'contribution.html';text=p.read_text(encoding='utf-8');before=fragment(text);before_sig=signature(before)
for pid in ['pkg-biology','pkg-hardware','pkg-data','pkg-model']:
 pkg=fragment(text).find(id=pid)
 for h in pkg.select('.contrib-pkg__header .contrib-pkg__ident,.contrib-pkg__header .contrib-pkg__name'):h.decompose()
 layout=pkg.select_one('.contrib-pkg__layout');layout['class'].append('contrib-pkg__layout--prose')
 summary=pkg.select_one('.contrib-pkg__summary')
 # Status remains in ordinary prose; each claim retains its existing scope.
 status=summary.select_one('.contrib-status')
 if status:
  wording=status.select_one('.contrib-status__text').get_text(' ',strip=True)
  status.replace_with(fragment('<p class="contrib-package-scope">'+wording+'.</p>'))
 for section in list(summary.find_all(['section','nav'],recursive=False)):
  heading=section.find(['h3','h4'],recursive=False)
  if heading:
   aid=heading.get('id');heading.decompose()
   if aid:section.insert(0,fragment('<span class="anchor-alias" id="'+aid+'"></span>'))
  section.attrs.pop('aria-labelledby',None)
  section.name='div';section['class']=['contrib-prose']
  if section.find('ul',recursive=False):
   ul=section.find('ul',recursive=False);links=[str(a) for a in ul.find_all('a')]
   ul.replace_with(fragment('<p class="contrib-related-inline">Explore: '+' · '.join(links)+'.</p>'))
 for section in pkg.select('.contrib-pkg__detail > .contrib-pkg__block'):
  h=section.find('h4',recursive=False)
  if h and h.get_text(strip=True) in ['Contribution','Reuse']:
   aid=h.get('id');h.replace_with(fragment('<span class="anchor-alias" id="'+aid+'"></span>'))
   section.attrs.pop('aria-labelledby',None)
   section['class']=['contrib-prose']
 text=replace(text,pid,pkg)

s=fragment(text);road=s.find(id='resource-roadmap');matrix=s.find(id='repro-matrix')
road.name='details';road['class']=['contrib-reuse-scope'];road.h2.replace_with(fragment('<summary>Scope and evidence for reuse</summary>'))
for section in road.find_all('section',recursive=False):
 h=section.find('h4',recursive=False)
 if h:
  h.name='strong';h['class']=['contrib-scope-label']
 section.name='div';section['class']=['contrib-prose'];section.attrs.pop('aria-labelledby',None)
matrix.append(road.extract())
text=replace(text,'resource-roadmap','')
text=replace(text,'repro-matrix',matrix)
p.write_text(text,encoding='utf-8');after=fragment(text);after_sig=signature(after)
assert before_sig['images']==after_sig['images']
assert before_sig['tables']==after_sig['tables']
assert before_sig['hrefs']==after_sig['hrefs']
assert set(before_sig['ids'])<=set(after_sig['ids'])
reports={'contribution':{'all_images_tables_links_ids_preserved':True,'roadmap_nested_in_resource_finder':True,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}}

p=ROOT/'safety-and-security.html';text=p.read_text(encoding='utf-8');before=fragment(text);before_sig=signature(before)
s=fragment(text)
# Remove the repeated badge treatment, not the contained-use boundary or register status.
for badge in list(s.select('.saf-status[data-status="restricted"]')):
 if badge.find_parent('table'):
  badge['class']=['saf-scope-text']
 else:badge.decompose()

# Keep the final section's anchor destinations beside the applicable control records.
old=s.find(id='safety-future-work')
anchors=[e['id'] for e in old.select('[id]')]+['safety-future-work']
destinations={'open-chemicals':'chemical-voc','open-waste':'safe-to-build','open-hardware':'safe-to-measure','open-governance':'laboratory-oversight','open-people':'people-and-data','open-regulatory':'safe-to-deploy'}
for aid in anchors:
 dest=s.find(id=destinations.get(aid,'risk-register'))
 alias=s.new_tag('span',id=aid);alias['class']=['anchor-alias'];alias['aria-hidden']='true'
 if dest.name.startswith('h'):dest.insert_before(alias)
 else:dest.append(alias)
old.decompose()

people=s.find(id='people-and-data')
people.find('p',recursive=False).clear();people.find('p',recursive=False).append(fragment('Education records the public survey and learning activities; Human Practices records industry and mentor input. Participant data are handled separately from laboratory measurements. <a href="education.html">Education</a> · <a href="human-practices.html">Human Practices</a> · <a href="#safe-to-interpret">Safe to interpret</a>'))

# Safety review processes are stated once; competition review does not substitute for laboratory authorization.
com=s.find(id='compliance');oldlinks=[str(a) for a in com.find_all('a')]
com.clear();com.append(fragment('<h2 class="reading-heading--chapter">Compliance and oversight</h2><p>Institutional procedures govern containment, training, chemical handling and disposal. iGEM Project Safety and Check-In forms address competition review; White List eligibility and institutional biosafety level are separate determinations. Each activity must meet its applicable requirements before work begins.</p><p>Keep the activity-specific risk assessment, operator training and authorization, chemical SDS and waste records with the laboratory. A component datasheet or a wiki description does not demonstrate control performance.</p><p class="saf-reference-links">'+' · '.join(oldlinks)+'</p>'))

# Replace the repeated judging-question cards with a concise route through the existing evidence.
award=s.find(id='award-map');oldlinks=[str(a) for a in award.find_all('a')]
award.clear();award.append(fragment('<h2 class="reading-heading--chapter">Safety contribution map</h2><p>AeroSafe connects the material inventory, contained laboratory practices, reader-quality controls and interpretation rules to the risk register. Its reusable contribution is the hazard → consequence → control → verification record, together with explicit triggers for renewed review when organisms, receptor targets or deployment change.</p><p>The linked records distinguish reported laboratory practice, design controls and uses outside the current scope. Residual risk still requires activity-specific assessment; the register does not label untested controls as verified.</p><p class="saf-reference-links">'+' · '.join(oldlinks)+'</p>'))

# Consolidate repetitive deployment requirements without changing their meaning.
deploy=s.find(id='safe-to-deploy')
for h in deploy.find_all(['h3','h4']):
 if h.get_text(' ',strip=True)=='Future deployment requirements':
  ul=h.find_next_sibling('ul')
  if ul:
   ul.clear();ul.append(fragment('<li>Validate a sealed cartridge, including leak and failure tests and isolation from food, users, the environment and reusable electronics.</li><li>Define transport and disposal for intact and damaged cartridges, and a user workflow that preserves the distinction between detection, measurement validity and confirmation.</li><li>Obtain the competent authority’s regulatory determination before deployment; laboratory containment does not itself authorize a living-cell product.</li><li>Validate real-world performance and retain a confirmatory-testing policy for high-risk or invalid outputs.</li>'))

# Drop duplicated governance qualifiers from the executive inventory; detailed controls stay below.
for p0 in s.find(id='safe-to-build').find_all('p',recursive=False):
 if 'Safe construction combines' in p0.get_text():
  p0.string='Safe construction combines biological containment, organism and part selection, chemical controls, equipment procedures and waste inactivation. Reported laboratory practice and design controls are identified separately in the risk register.'
for p0 in s.find(id='risk-scoring').find_all('p'):
 if 'Every hazard remains' in p0.get_text() or 'register contains controls' in p0.get_text():
  p0.string='The rubric supports activity-specific review; the 30 hazards have not been assigned signed likelihood or severity scores. Reported implementation does not establish residual risk, and no row is marked as a verified outcome.'

# Only replace changed major sections, preserving the remainder of the source formatting.
for sid in ['safety-at-a-glance','our-safety-case','safe-to-build','safe-to-measure','safe-to-deploy','people-and-data','risk-register','compliance','award-map']:
 text=replace(text,sid,s.find(id=sid))
text=replace(text,'safety-future-work','')
p.write_text(text,encoding='utf-8');after=fragment(text)
assert before_sig['images']==signature(after)['images']
# Table values are preserved; only the restricted-status badge class changes.
assert before_sig['tables']==signature(after)['tables']
assert set(before_sig['ids'])<=set(signature(after)['ids'])
reports['safety']={'all_images_table_values_ids_preserved':True,'restricted_badges_removed':not after.select('.saf-status[data-status="restricted"]'),'open_items_section_removed':not after.find('section',id='safety-future-work'),'word_count_before':len(before.get_text(' ',strip=True).split()),'word_count_after':len(after.get_text(' ',strip=True).split()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(AUDIT/'contribution-safety-revision-receipt.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')
print(json.dumps(reports,indent=2))
