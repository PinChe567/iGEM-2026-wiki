/* Authored section-aware field guide. No model, API or visitor-data upload. */
(() => {
 'use strict';
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 const slug=(location.pathname.split('/').pop()||'index.html').toLowerCase(),main=$('main');
 if(!main)return;
 const thread=document.createElement('div');thread.className='signal-thread';
 thread.setAttribute('aria-label','Reading progress');thread.setAttribute('role','progressbar');thread.setAttribute('aria-valuemin','0');thread.setAttribute('aria-valuemax','100');
 thread.innerHTML='<span class="signal-thread__label" aria-hidden="true">READING PROGRESS</span><svg viewBox="0 0 24 600" preserveAspectRatio="none" aria-hidden="true"><path class="signal-thread__rail" d="M12 0V600"/><path class="signal-thread__branch" d="M12 102h7M12 207H5m7 101h7m-7 106H5m7 97h7"/></svg><span class="signal-thread__orb" aria-hidden="true"></span>';
 document.body.prepend(thread);
 let pending=false;
 function update(){pending=false;const value=Math.round(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)*100);document.documentElement.style.setProperty('--signal-page-progress',value+'%');thread.setAttribute('aria-valuenow',String(value));}
 function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});update();
 const dialog=document.createElement('dialog');dialog.className='fly-qa';dialog.setAttribute('aria-labelledby','fly-qa-title');
 dialog.innerHTML='<div class="fly-qa__head"><div><p>ASK THE FLY · ABOUT THIS SECTION</p><h2 id="fly-qa-title">A closer look</h2></div><button class="fly-qa__close" type="button" aria-label="Close field guide">×</button></div><div class="fly-qa__body"><p class="fly-qa__context"></p><div class="fly-qa__choices"></div><div class="fly-qa__answer" aria-live="polite"></div><p class="fly-qa__footnote">Questions change with the section you are reading. Answers are written by the team and link to the project record.</p></div>';
 document.body.append(dialog);
 const choices=$('.fly-qa__choices',dialog),answer=$('.fly-qa__answer',dialog);
 const fallback=[{q:'How do the layers of AeroSense fit together?',a:'Living receptors provide the biological sensing layer. Fluorescence, optical measurement, and computational interpretation connect that response to a screening decision.',href:'description.html#pipeline'},{q:'Where is the experimental evidence?',a:'Results reports observations and controls. Engineering explains how those observations informed design decisions.',href:'results.html'}];
 function context(){
  const data=window.AEROSENSE_SECTION_QUESTIONS?.[slug]||{};
  const line=Math.min(innerHeight*.35,280);
  const candidates=Object.keys(data).filter(k=>k!=='*').map(id=>({id,el:document.getElementById(id)})).filter(row=>row.el&&main.contains(row.el)).map(row=>({...row,rect:row.el.getBoundingClientRect()})).filter(row=>row.rect.height>0&&row.rect.width>0&&row.rect.bottom>line&&row.rect.top<innerHeight);
  // Prefer the innermost mapped section crossing the reading line.
  candidates.sort((a,b)=>{const ac=a.rect.top<=line,bc=b.rect.top<=line;if(ac!==bc)return ac?-1:1;return ac?b.rect.top-a.rect.top:a.rect.top-b.rect.top;});
  const chosen=candidates[0];
  const title=chosen?($('h2,h3,h4',chosen.el)?.textContent||chosen.el.getAttribute('aria-label')||chosen.id):($('h1',main)?.textContent||document.title.split('·')[0]);
  return {rows:(chosen?data[chosen.id]:data['*'])||fallback,title:title.trim().replace(/\s+/g,' '),id:chosen?.id||'*'};
 }
 function open(){
  const current=context();choices.replaceChildren();answer.replaceChildren();dialog.dataset.section=current.id;
  $('.fly-qa__context',dialog).textContent='Reading now: '+current.title;
  current.rows.forEach(row=>{
   const button=document.createElement('button');button.type='button';button.textContent=row.q;button.setAttribute('aria-pressed','false');
   button.addEventListener('click',()=>{
    answer.replaceChildren();const p=document.createElement('p'),a=document.createElement('a');p.textContent=row.a;a.href=row.href;a.textContent='Read the explanation ↗';
    a.addEventListener('click',()=>dialog.close());answer.append(p,a);$$('button',choices).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   });choices.append(button);
  });
  if(!dialog.open)dialog.showModal();
 }
 document.addEventListener('aerosense:ask-fly',open);
 $('.fly-qa__close',dialog).addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
})();
