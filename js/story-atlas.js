/* All diagrams and story text exist in HTML; motion and isolated disclosures are optional. */
(() => {
 'use strict';
 document.querySelectorAll('.framework:has(.atlas-art)').forEach(figure=>{
   const details=[...figure.querySelectorAll('.framework-cell')];
   const links=[...figure.querySelectorAll('[data-atlas-target]')];
   const select=document.createElement('select');select.className='atlas-mobile';select.id=figure.id+'-select';
   const label=document.createElement('label');label.className='atlas-mobile atlas-mobile-label';label.htmlFor=select.id;label.textContent='Explore a diagram region';
   select.add(new Option('Choose a region…',''));
   details.forEach(item=>select.add(new Option(item.querySelector('summary').textContent,item.id)));
   figure.querySelector('.framework-board').before(label,select);
   const openItem=id=>{const item=document.getElementById(id);if(!item||!figure.contains(item))return;details.forEach(d=>{d.open=d===item;});if(item.closest('.atlas-risk-index'))item.closest('.atlas-risk-index').open=true;select.value=id;figure.classList.add('is-inspecting');};
   links.forEach(link=>{
     const id=link.getAttribute('href').slice(1);link.setAttribute('aria-controls',id);
     link.addEventListener('click',e=>{e.preventDefault();openItem(id);});
     link.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();openItem(id);}});
   });
   select.addEventListener('change',()=>openItem(select.value));
   details.forEach(item=>item.addEventListener('toggle',()=>{if(item.open&&item.closest('.atlas-risk-index'))item.closest('.atlas-risk-index').open=true;links.filter(a=>a.getAttribute('href')==='#'+item.id).forEach(a=>a.setAttribute('aria-expanded',String(item.open)));}));
   const risks=figure.querySelector('.atlas-risk-index');
   if(risks){details.filter(d=>d.id.startsWith('atlas-barrier-review-')).forEach(d=>risks.append(d));}
   figure.dataset.atlasReady='true';
 });
 const comic=document.querySelector('[data-scroll-comic]');if(!comic)return;
 const panels=[...comic.querySelectorAll('[data-comic-panel]')],controls=comic.querySelector('.comic-controls'),stage=comic.querySelector('.comic-stage');
 const slider=comic.querySelector('#comic-progress'),counter=comic.querySelector('[data-comic-count]'),prev=comic.querySelector('[data-comic-prev]'),next=comic.querySelector('[data-comic-next]'),mode=comic.querySelector('[data-comic-mode]'),scent=comic.querySelector('[data-comic-scent]');
 const reduce=matchMedia('(prefers-reduced-motion:reduce)'),desktop=matchMedia('(min-width:701px) and (min-height:620px)');
 let active=0,reading=false,enhanced=false,frame=0;
 function paint(index,within=0){
   index=Math.max(0,Math.min(7,index));active=index;
   panels.forEach((panel,i)=>{panel.classList.toggle('is-current',i===index);if(enhanced)panel.setAttribute('aria-hidden',String(i!==index));else panel.removeAttribute('aria-hidden');panel.style.setProperty('--chapter-progress',i===index?String(within):'0');});
   comic.classList.toggle('is-dark',enhanced&&panels[index].classList.contains('comic-panel--dark'));
   slider.value=String(index+1);counter.textContent=String(index+1).padStart(2,'0')+' / 08';slider.setAttribute('aria-valuetext',panels[index].getAttribute('aria-label'));
   prev.disabled=index===0;next.disabled=index===7;
 }
 function update(){frame=0;if(!enhanced)return;const range=comic.offsetHeight-stage.offsetHeight;const progress=Math.max(0,Math.min(1,(72-comic.getBoundingClientRect().top)/Math.max(1,range)));const value=progress*7.999;paint(Math.floor(value),value%1);}
 function jump(index){if(index<0||index>7)return;if(enhanced){const top=scrollY+comic.getBoundingClientRect().top-72;const range=comic.offsetHeight-stage.offsetHeight;window.scrollTo({top:top+range*(index/8+.03),behavior:'instant'});}else panels[index].scrollIntoView({block:'start',behavior:'instant'});paint(index);}
 function configure(){enhanced=desktop.matches&&!reduce.matches&&!reading;comic.classList.toggle('is-enhanced',enhanced);comic.classList.toggle('is-reading',!enhanced);controls.hidden=!desktop.matches;mode.disabled=reduce.matches;mode.textContent=reduce.matches?'Comic view · reduced motion':enhanced?'Read as comic':'Scroll experience';panels.forEach(p=>p.querySelector('img').loading=enhanced?'eager':'lazy');paint(active);if(enhanced)update();}
 addEventListener('scroll',()=>{if(enhanced&&!frame)frame=requestAnimationFrame(update);},{passive:true});
 addEventListener('resize',()=>{if(enhanced&&!frame)frame=requestAnimationFrame(update);},{passive:true});
 prev.addEventListener('click',()=>jump(active-1));next.addEventListener('click',()=>jump(active+1));slider.addEventListener('input',()=>jump(Number(slider.value)-1));
 mode.addEventListener('click',()=>{reading=!reading;configure();comic.scrollIntoView({block:'start',behavior:'instant'});});
 scent.addEventListener('click',()=>{const on=!comic.classList.contains('show-scent');comic.classList.toggle('show-scent',on);scent.setAttribute('aria-pressed',String(on));scent.textContent=on?'Hide scent':'Reveal scent';});
 stage.addEventListener('pointermove',e=>{const b=stage.getBoundingClientRect();comic.style.setProperty('--scent-x',`${e.clientX-b.left}px`);comic.style.setProperty('--scent-y',`${e.clientY-b.top}px`);},{passive:true});
 reduce.addEventListener('change',configure);desktop.addEventListener('change',configure);configure();
})();
