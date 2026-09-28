/* Static, evidence-aware navigation. No API, model, or visitor data leaves the page. */
(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const slug = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const journeys = {
    'index.html':['description.html','Begin with the project question','A screening cue is a reason to investigate, not a food-safety verdict.'],
    'description.html':['design.html','See how odor becomes light','The fruit fly is the inspiration. The engineered sensing cells are a separate system.'],
    'design.html':['experiments.html','See how the design was tested','mCherry marks expression; GCaMP6f is the intended calcium-responsive readout.'],
    'experiments.html':['results.html','Examine the observations','A protocol describes what was done. Results show what was observed.'],
    'results.html':['engineering.html','Follow the iterations','Evidence is strongest when controls, uncertainty, and failed attempts remain visible.'],
    'parts.html':['design.html','Connect the parts to the mechanism','OR and Orco form the receptor complex; the reporter does a different job.'],
    'hardware.html':['model.html','See the downstream interpretation','A readable optical signal still needs calibration and honest uncertainty.'],
    'model.html':['human-practices.html','See the deployment questions','A model output does not establish food safety by itself.'],
    'members.html':['attributions.html','See who did what','A transparent record of contributions is part of reproducible science.'],
    'notebook.html':['engineering.html','See what changed and why','A chronological record makes redesign decisions inspectable.'],
    'safety-and-security.html':['human-practices.html','See how users shaped the work','The safest interpretation of a screen is an invitation to confirm, not a definitive diagnosis.'],
    'entrepreneurship.html':['sustainability.html','Consider long-term use','A market diagram is a hypothesis until the assumptions are supported.']
  };
  const [nextHref,nextLabel,easter] = journeys[slug] || ['description.html','Return to the project story','Every stage is easier to evaluate when design, evidence, and limits stay separate.'];
  const main = $('main');
  if (!main) return;
  const article = $('.page-article', main);
  let sections = $$('.section-block[id]', article || main).filter(el => {
    const title = $('h2,h3', el);
    return title && el.id && (article ? el.parentElement===article : !el.parentElement?.closest('.section-block'));
  });
  if(slug==='index.html')sections=$$('.home-after > section[id]',main);
  else if(sections.length<2 || slug==='members.html'){
    sections=$$('.page-toc a[href^="#"]').map(a=>document.getElementById(a.getAttribute('href').slice(1))).filter((el,i,all)=>el&&main.contains(el)&&all.indexOf(el)===i);
  }
  const labels = sections.map(el => ($('h2,h3',el)?.textContent || el.id).trim().replace(/\s+/g,' ').slice(0,65));
  // This is a page-progress indicator, not a second table of contents.
  const thread=document.createElement('div');thread.className='signal-thread';thread.setAttribute('aria-label','Reading progress');thread.setAttribute('role','progressbar');thread.setAttribute('aria-valuemin','0');thread.setAttribute('aria-valuemax','100');
  thread.innerHTML='<span class="signal-thread__label" aria-hidden="true">READING PROGRESS</span><svg viewBox="0 0 24 600" preserveAspectRatio="none" aria-hidden="true"><path class="signal-thread__rail" d="M12 0V600"/><path class="signal-thread__branch" d="M12 102h7M12 207H5m7 101h7m-7 106H5m7 97h7"/></svg><span class="signal-thread__orb" aria-hidden="true"></span>';
  document.body.prepend(thread);
  function updateThread(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    const value=Math.round(scrollY/max*100);
    document.documentElement.style.setProperty('--signal-page-progress',value+'%');
    thread.setAttribute('aria-valuenow',String(value));
  }
  addEventListener('scroll',updateThread,{passive:true});addEventListener('resize',updateThread,{passive:true});updateThread();
  const end = document.createElement('aside');end.className='signal-end';end.setAttribute('aria-label','End of page discovery');
  end.innerHTML='<details><summary>✦ Signal found · reveal a field note</summary><p></p></details><a class="signal-end__next"></a>';
  $('details p',end).textContent=easter;
  const link=$('.signal-end__next',end);link.href=nextHref;link.textContent=nextLabel+' ↗';
  (article || main).append(end);

  // Deliberately small local guide: answers are authored and link to evidence, never generated.
  const qa=[
    ['What does AeroSense actually do?','It is being developed as an early-screening route from volatile cues to cellular fluorescence, optical readout, and pattern interpretation. Read the overview and the stated evidence limits.','description.html','project overview screening food smell odor purpose'],
    ['Is it a mycotoxin test or a food-safety verdict?','No. The proposed system screens for fungal-associated odor-pattern changes and requires follow-up or confirmatory testing.','description.html#is-and-is-not','toxin mycotoxin safety diagnosis safe verdict mold'],
    ['What have you measured, and what is still planned?','Open the Results page for observations and controls. The Design page explicitly distinguishes current architecture from fusion functional validation.','results.html','evidence results measured proof data validated fusion status'],
    ['Why both OR and Orco?','A tuning odorant receptor contributes odor selectivity; Orco is its co-receptor/channel partner. The Design page separates their roles and the reporter step.','design.html#how-aerosense-senses','or orco interaction receptor channel odor ligand'],
    ['What are GCaMP6f and mCherry for?','GCaMP6f is the intended calcium-responsive green optical reporter. mCherry is a red expression marker, not the calcium signal.','parts.html#sensor-builder','gcamp mcherry fluorescence green red reporter calcium'],
    ['Where can I inspect the hardware and PCB?','The Hardware page documents the optical path, circuits, iterations, results, and their current limits.','hardware.html','pcb photodiode optical electronics reader fluorescence board'],
    ['How is the fly-inspired model evaluated?','The Model page covers the proposed decoding approach and its evaluation boundary. Keep simulated, planned, and measured outputs distinct.','model.html','model neural decode computation algorithm validation'],
    ['Who influenced the design?','Integrated Human Practices documents stakeholders, conversations, resulting decisions, and limits.','human-practices.html','ihp stakeholder interviews users feedback'],
    ['Where are safety measures documented?','The Safety and Security page covers lab safety, organism and handling considerations, and deployment limits.','safety-and-security.html','safety biosafety lab risk'],
    ['Who built each part of the project?','The Attributions page records roles and contributions.','attributions.html','attributions authors work credit contributors'],
    ['Where is the chronological work record?','The Notebook page provides the timeline; Engineering connects iterations to decisions.','notebook.html','notebook calendar timeline chronology date work']
  ];
  const headerTools=$('.header-tools');
  if(!headerTools)return;
  const dialog=document.createElement('dialog');dialog.className='fly-qa';dialog.setAttribute('aria-labelledby','fly-qa-title');
  dialog.innerHTML='<div class="fly-qa__head"><div><p>Three questions to get started</p><h2 id="fly-qa-title">A little field guide</h2></div><button class="fly-qa__close" type="button" aria-label="Close field guide">×</button></div><div class="fly-qa__body"><p>Choose a question. For a particular page, use Project Search; for a scientific term, use the Glossary.</p><div class="fly-qa__choices"></div><div class="fly-qa__answer" aria-live="polite"></div></div>';
  document.body.append(dialog);
  const choices=$('.fly-qa__choices',dialog), answer=$('.fly-qa__answer',dialog);
  [0,3,4].forEach(index=>{const row=qa[index],button=document.createElement('button');button.type='button';button.textContent=row[0];button.addEventListener('click',()=>{answer.replaceChildren();const p=document.createElement('p'),a=document.createElement('a');p.textContent=row[1];a.href=row[2];a.textContent='Explore this in the project ↗';answer.append(p,a);$$('button',choices).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});choices.append(button);});
  function open(){answer.replaceChildren();$$('button',choices).forEach(b=>b.setAttribute('aria-pressed','false'));dialog.showModal();}
  document.addEventListener('aerosense:ask-fly',open);
  $('.fly-qa__close',dialog).addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
})();
