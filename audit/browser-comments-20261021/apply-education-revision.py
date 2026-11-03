from pathlib import Path
from bs4 import BeautifulSoup
from html import escape
import json, re, hashlib

ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'education.html'
text=P.read_text(encoding='utf-8')
before=BeautifulSoup(text,'html.parser')
blocks=json.loads((Path(__file__).parent/'education-source-blocks.json').read_text(encoding='utf-8'))
def frag(s): return BeautifulSoup(s,'html.parser')
def block(i): return escape(blocks[i]['text'])
def replace(id,new):
 global text
 m=re.search(r'<([\w-]+)\b[^>]*\bid="'+re.escape(id)+r'"[^>]*>',text)
 assert m,id
 tag=m.group(1); depth=0
 for x in re.finditer(r'<(/?)'+re.escape(tag)+r'\b[^>]*>',text[m.start():],re.I):
  depth += -1 if x.group(1) else 1
  if depth==0:
   end=m.start()+x.end();text=text[:m.start()]+str(new)+text[end:];return
 raise AssertionError(id)
def node(id): return BeautifulSoup(text,'html.parser').find(id=id)
def paragraph(s): return '<p>'+s+'</p>'

# Current Notion narrative, keeping the three working games and their stable IDs.
games=node('odor-pixel'); cards=str(games.select_one('.edu-site-interaction'))
journey=''.join('<li><strong>'+block(i).split('\n')[0]+'</strong><p>'+block(i).split('\n',1)[1]+'</p></li>' for i in range(93,98))
replace('odor-pixel',f'''<div class="notion-editorial-block edu-source-activity" id="odor-pixel">
<h3>2. Online Games — Odor Pixel Suite</h3><h4>Why does it matter?</h4>
{paragraph(block(86))}{paragraph(block(87))}<h4>Educational Impact from us.</h4>
{paragraph(block(89))}{cards}{paragraph(block(91))}<ol class="edu-design-journey">{journey}</ol>
<h4>Impact on us.</h4>{paragraph(block(99))}{paragraph(block(100))}{paragraph(block(106))}{paragraph(block(107))}</div>''')

social=node('social-media')
for p in social.find_all('p'):
 if 'Coming soon.' in p.get_text(): p.string=p.get_text().replace(' Coming soon.','')
series=frag('''<div class="edu-blog-series"><h4>Series 3: Blog Articles.</h4><p>We publish long-form articles on <strong>Neuroinfo</strong>, a popular-science blog on computational neuroscience run by Prof. <strong>Chung-Chuan Lo</strong>'s lab at National Tsing Hua University. Since 2017, the blog has published hundreds of articles in Traditional Chinese for general readers, giving our writing a home and an audience beyond our iGEM season.</p><p>Each article takes one recent study on fruit fly olfaction and explains it for non-specialists: the question it asks, how the experiment works, what it found, and what it still cannot tell us. A deep-tech tour then connects the finding to AeroSense, explaining which part of the fly's smell system inspired our design and where biology and engineering differ.</p></div>''')
social.select_one('.edu-social-impact').insert_before(series)
impact=social.select_one('.edu-social-impact__copy')
impact.clear();impact.append(frag('''<h4 class="edu-social-impact__heading">Impact on us.</h4><p>We treat social media as a reach channel, not a measurement tool. Over the posting period, our feed posts reached more than 1,700 accounts, our stories more than 1,400, and our reels more than 500, with an average of about 50 likes per post. We gained more than 100 new followers, and more than 50 people answered the Sustainability Pop Quiz stories, getting about 75% correct on average. Our best-performing post was Post 1, “We put a fruit fly's nose inside a human cell.” Most of our audience was aged 20 to 30.</p><p>These numbers show interest, not learning. Saves, poll responses and comment questions do not establish understanding; the games and Learning Lab provide opportunities to assess it more directly. In comparable in-person outreach, including street booths and pub-quiz events, we observed that this content often attracted people already interested in science.</p>'''))
replace('social-media',social)

lab=node('learning-lab');lab.h3.string='3. AeroSense Learning Lab — the Online Curriculum'
intro=lab.find('ul',recursive=False);live=intro.find_next_sibling('p')
box=frag('<div class="edu-learning-intro"></div>').div; intro.insert_before(box);box.append(intro.extract());box.append(live.extract())
for n in ['135','141']:
 e=lab.find(attrs={'data-notion-index':n})
 if e:e.decompose()
lab.find('ol',recursive=False).decompose()
# Keep functional module links, but remove the duplicate five-module list from the main flow.
module_list=lab.select_one('.notion-module-list')
if module_list:
 wrapper=module_list.parent
 details=frag('<details class="edu-module-links"><summary>Open an individual module</summary></details>').details
 wrapper.insert_before(details); details.append(wrapper.extract())
old=lab.find(attrs={'data-notion-index':'143'})
old.replace_with(frag(paragraph(block(64))))
chart='../zenodo-release/aerosense-wiki/data/education-learning-comparison-2026-10-21/learning-lab-cohort-comparison.svg'
impact_heading=lab.find(attrs={'data-notion-index':'142'})
newp=impact_heading.find_next_sibling('p')
newp.insert_after(frag(f'''<figure class="edu-learning-comparison" id="learning-lab-cohort-comparison"><a href="{chart}" target="_blank" rel="noopener noreferrer"><img src="{chart}" alt="Correct-answer rates: public survey 78%, 64%, 58%; Learning Lab learners 97%, 92%, 85% for visible mold, heating, and appearance and smell." loading="lazy" decoding="async"/></a><figcaption>Correct-answer rates for three common misconceptions. Dark bars show the public survey baseline; light bars show Learning Lab learners answering the same statements in Module 2 (n = 521). These are different groups, not a pre/post test of the same learners. Learners chose to take the course and answered immediately after the module; the comparison describes short-term understanding and does not isolate a course effect.</figcaption></figure>'''))
lab.find(attrs={'data-notion-index':'144'}).replace_with(frag(paragraph(block(66))+paragraph(block(67))))
lab.find(attrs={'data-notion-index':'146'}).replace_with(frag(paragraph(block(71))))
replace('learning-lab',lab)

tool=node('education-teacher-toolkit'); tool.h3.string='4. Teacher Toolkit & Education Guide (Open Resources)'
for key,label in [('202','Teacher Toolkit.'),('205','Education Guide.')]:
 p=tool.find(attrs={'data-notion-index':key});rest=p.get_text()[len(label):].strip();p.clear();p.append(frag('<strong class="edu-resource-label">'+label+'</strong> '+escape(rest)))
oldlink=tool.select_one('a[data-teacher-toolkit]');oldlink.parent.decompose()
files=tool.select_one('#teacher-toolkit-files');instruction=files.find_all('li')[-1];instruction.extract()
fileblock=tool.select_one('[data-notion-file="toolkit"]');fileblock.clear();fileblock.append(instruction.a.extract());fileblock['class']=['edu-toolkit-instruction']
files.insert_before(fileblock.extract())
details=frag('<details class="edu-toolkit-disclosure"><summary class="edu-resource-card edu-resource-card--toolkit"><span class="edu-resource-card__copy"><strong>Bring the science into your classroom</strong><span class="edu-resource-card__description">Lesson slides, activities and teaching guidance, ready to explore and reuse.</span><span class="edu-resource-card__action">Open the Teacher Toolkit <span aria-hidden="true">＋</span></span></span></summary></details>').details
files.insert_before(details);details.append(files.extract())
guide=tool.find(attrs={'data-notion-index':'205'})
guide.append(frag(' <a href="contribution.html#guide-education">Find the Education Guide on Contribution</a>.'))
replace('education-teacher-toolkit',tool)
team=node('education-team-exchange');team.h3.string='2. Mini Jamboree (with International iGEM Community)';replace('education-team-exchange',team)
art=node('education-art-gallery');p=art.find('p',recursive=False);p.string=p.get_text().replace('The drawings are displayed on our Art Gallery page','The drawings are displayed on our Art Gallery below.');replace('education-art-gallery',art)
camp=node('camp-creative-wall');a=camp.a;a['class']=['edu-resource-card','edu-resource-card--gallery'];a.clear();a.append(frag('''<span class="edu-resource-card__art"><svg viewBox="0 0 96 96" aria-hidden="true"><path d="M23 15h50v66H23z" fill="#fff9e9" stroke="currentColor" stroke-width="2.5"/><path d="M35 28h26M35 38h18" stroke="#a4b28f" stroke-width="4" stroke-linecap="round"/><path d="m39 56 7-4 20 20-7 4z" fill="#dca65c" stroke="currentColor" stroke-width="2"/><path d="m39 56-3 9 10-3" fill="#f4d6c0" stroke="currentColor" stroke-width="2"/><circle cx="69" cy="20" r="12" fill="#f4d6c0"/><path d="M69 13v14M62 20h14" stroke="currentColor" stroke-width="2"/></svg></span><span class="edu-resource-card__copy"><strong>44 young imaginations. One gallery.</strong><span class="edu-resource-card__description">Discover the fruit flies, noses and reflections created by our learners.</span><span class="edu-resource-card__action">Explore the student gallery ↗</span></span>'''));replace('camp-creative-wall',camp)
closing=''.join('<li>'+block(i)+'</li>' for i in [37,38,14,15,16])
close0=block(35)+' The comparison is between different groups, not a paired pre/post assessment.'
replace('education-closing',f'<div class="notion-editorial-block edu-source-activity" id="education-closing"><h3>Closing</h3><p>{close0}</p><p>{block(36)}</p><ul>{closing}</ul><p>{block(17)}</p></div>')
P.write_text(text,encoding='utf-8')
after=BeautifulSoup(text,'html.parser')
report={'page':'education.html','before_sha256':hashlib.sha256(str(before).encode()).hexdigest(),'after_sha256':hashlib.sha256(P.read_bytes()).hexdigest(),'image_urls_preserved':set(i.get('src') for i in before.find_all('img')) <= set(i.get('src') for i in after.find_all('img')),'new_chart_placeholder':chart,'note':'No raw counts inferred. Survey and learners are different groups. Original existing media and game/module destinations preserved.'}
(Path(__file__).parent/'education-revision-receipt.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
