/* Constant tooth pitch; adjacent pitch circles touch and angular speeds obey z1*w1=-z2*w2. */
(() => {
 const names=['Design','Build','Test','Learn','Redesign'],controllers=new WeakMap();
 const gears=[{z:20,x:62,y:57},{z:14,x:125,y:100.39},{z:18,x:79,y:155.78},{z:12,x:132,y:197.58},{z:16,x:89,y:243.62}];
 gears.forEach((g,i)=>{g.r=g.z*2.25;g.ratio=(i%2?-1:1)*20/g.z;if(!i)g.phase=0;else{const p=gears[i-1],a=Math.atan2(g.y-p.y,g.x-p.x);g.phase=(p.z*a+g.z*(a+Math.PI)-Math.PI-p.z*p.phase)/g.z;}});
 function outline(g){const points=[];for(let n=0;n<g.z;n++)for(const [a,r] of [[-.5,g.r-2.8],[-.34,g.r-2.8],[-.22,g.r+2.25],[.22,g.r+2.25],[.34,g.r-2.8],[.5,g.r-2.8]]){const angle=(n+a)*2*Math.PI/g.z;points.push(`${(Math.cos(angle)*r).toFixed(2)},${(Math.sin(angle)*r).toFixed(2)}`);}return points.join(' ');}
 function hp(){document.querySelectorAll('.eng-hp-track').forEach(track=>{
  const grid=track.querySelector('.eng-hp-cycle-grid');if(!grid)return;track.dataset.cycleViewer='';track.classList.add('eng-track','eng-track--hp');
  const tabs=document.createElement('nav');tabs.className='eng-hp-tabs';tabs.setAttribute('aria-label','Human Practices cycles');grid.before(tabs);
  [...grid.querySelectorAll('.eng-hp-cycle')].forEach((old,i)=>{const id=old.id,title=old.querySelector('summary strong').textContent,dd=[...old.querySelectorAll('dd')].map(d=>d.innerHTML),date=old.querySelector('summary span').textContent;
   const panel=document.createElement('article');panel.id=id;panel.className='eng-cycle';panel.dataset.cyclePanel=String(i+1);panel.hidden=i!==0;
   const content=[`<p>${title}</p>`,dd[0],dd[1],`<p>${title.includes('→')?title.split('→').at(-1).trim():title}</p>`,dd[2]];
   panel.innerHTML=`<header class="eng-cycle__head"><p>Human Practices · Cycle ${i+1} · ${date}</p><h4>${title}</h4></header><div class="eng-cycle__panels">${names.map((n,j)=>`<section id="${id}-${n.toLowerCase()}" data-eng-stage="${n.toLowerCase()}"><h4>${n}</h4><div>${content[j]||''}</div></section>`).join('')}</div><footer class="eng-cycle__footer"><p class="eng-cycle__decision"><strong>Key decision.</strong> ${dd[2]||''}</p>${old.querySelector(':scope > p')?.outerHTML||''}</footer>`;
   const b=document.createElement('button');b.type='button';b.dataset.cycleTab=String(i+1);b.textContent='Cycle '+(i+1);b.setAttribute('aria-pressed',String(i===0));b.addEventListener('click',()=>{[...grid.children].forEach(p=>p.hidden=p!==panel);[...tabs.children].forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});tabs.append(b);old.replaceWith(panel);
  });
 });}
 function init(){hp();
 document.querySelectorAll('[data-cycle-viewer]').forEach(track=>{
  const tabs=track.querySelector('[data-cycle-tab]')?.parentElement;if(tabs){const label=document.createElement('strong');label.className='eng-track-label';label.textContent=track.querySelector('.eng-track__title')?.textContent||'Human Practices';tabs.prepend(label);}
 });
 document.querySelectorAll('.eng-cycle[data-cycle-panel]').forEach(panel=>{
  const body=panel.querySelector('.eng-cycle__panels');if(!body)return;const stages=names.map(n=>body.querySelector(`[data-eng-stage="${n.toLowerCase()}"]`));if(stages.some(s=>!s))return;
  const extras=[...panel.children].filter(el=>el!==body&&!el.matches('.eng-cycle__head,.eng-cycle__footer'));
  if(extras.length){const appendix=document.createElement('details');appendix.className='eng-source-notes';appendix.innerHTML='<summary>Supporting records and comparison figures</summary>';extras.forEach(e=>appendix.append(e));panel.append(appendix);}
  const nav=document.createElement('nav');nav.className='eng-gears';nav.setAttribute('aria-label','Engineering stages');
  nav.innerHTML=`<svg viewBox="0 0 210 300" role="group" aria-label="Interlocking engineering stages">${gears.map((g,i)=>`<g class="eng-gears__control" role="button" tabindex="0" aria-label="${names[i]}" data-gear="${i}" transform="translate(${g.x} ${g.y})"><g class="eng-gears__rotor"><polygon points="${outline(g)}"/><circle r="${g.r*.48}"/></g><text text-anchor="middle" dominant-baseline="central">${names[i][0]}</text></g>`).join('')}</svg><p class="eng-gears__current"></p><p class="eng-gears__hint">Scroll within the note to follow the cycle.</p>`;
  body.prepend(nav);body.classList.add('has-meshed-gears');
  let active=0,angle=0,last=0,accum=0;const controls=[...nav.querySelectorAll('[data-gear]')];
  function show(index,delta=1){active=index;angle+=delta*Math.PI/4;stages.forEach((s,i)=>s.hidden=i!==index);controls.forEach((c,i)=>{c.setAttribute('aria-pressed',String(i===index));c.querySelector('.eng-gears__rotor').style.transform=`rotate(${(gears[i].phase+angle*gears[i].ratio)*180/Math.PI}deg)`;});nav.querySelector('.eng-gears__current').textContent=`${names[index]} · ${index+1} / 5`;body.dataset.activeStage=names[index].toLowerCase();}
  controllers.set(panel,show);controls.forEach((c,i)=>{c.addEventListener('click',()=>show(i,i-active));c.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();show(i,i-active);}else if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(e.key)){e.preventDefault();const n=(i+(['ArrowDown','ArrowRight'].includes(e.key)?1:4))%5;controls[n].focus();show(n,n-active);}});});
  body.addEventListener('wheel',event=>{
   if(event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||event.target.closest('select,textarea,nav'))return;
   const stage=stages[active],dir=Math.sign(event.deltaY);if(stage.scrollHeight>stage.clientHeight+3&&((dir>0&&stage.scrollTop+stage.clientHeight<stage.scrollHeight-3)||(dir<0&&stage.scrollTop>2)))return;
   const track=panel.closest('[data-cycle-viewer]'),panels=[...track.querySelectorAll('[data-cycle-panel]')],pi=panels.indexOf(panel),next=active+dir;
   if((next<0&&pi===0)||(next>4&&pi===panels.length-1))return;
   event.preventDefault();if(performance.now()-last<650)return;accum+=event.deltaY*(event.deltaMode===1?16:1);if(Math.abs(accum)<65)return;
   accum=0;last=performance.now();if(next>=0&&next<=4)show(next,dir);else{const other=panels[pi+dir],key=other.dataset.cyclePanel;const tab=track.querySelector(`[data-cycle-tab="${CSS.escape(key)}"]`);if(tab){const y=scrollY;tab.click();window.scrollTo({top:y,behavior:'instant'});controllers.get(other)?.(dir>0?0:4,dir);}}
  },{passive:false});show(0,0);
 });}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
