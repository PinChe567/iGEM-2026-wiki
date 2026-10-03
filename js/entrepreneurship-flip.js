/* Each framework uses an interaction that matches its structure. The source
   analysis remains in HTML for no-script readers and print. */
(() => {
 'use strict';
 const figures=[...document.querySelectorAll('.framework')];
 if(!figures.length)return;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const dialog=document.createElement('dialog');dialog.className='framework-flip';
 dialog.innerHTML='<div class="framework-flip__turn"><div class="framework-flip__front" aria-hidden="true"></div><article class="framework-flip__back"><button class="framework-flip__close" type="button" aria-label="Close and return to diagram">×</button><p class="framework-flip__kicker"></p><h2 id="framework-flip-title"></h2><div class="framework-flip__copy"></div></article></div>';
 dialog.setAttribute('aria-labelledby','framework-flip-title');document.body.append(dialog);
 let origin=null,animation=null;
 const titleOf=item=>item.querySelector('summary')?.textContent||'Analysis';
 const copyInto=(target,item)=>target.replaceChildren(...[...item.querySelector('.framework-cell__body').childNodes].map(n=>n.cloneNode(true)));
 const expandLink=(figure,id)=>figure.querySelectorAll('[data-atlas-target]').forEach(a=>a.setAttribute('aria-expanded',String(a.getAttribute('href')==='#'+id)));
 function makeLabelTargets(figure){
  const labels=[...figure.querySelectorAll('.atlas-art [data-atlas-target] text')];
  const hitAreas=new WeakMap();
  function refresh(){
   labels.forEach(label=>{
    let box;try{box=label.getBBox();}catch(_){return;}
    if(!box.width||!box.height)return;
    let rect=hitAreas.get(label);
    if(!rect){
     rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
     rect.classList.add('atlas-label-hit');rect.setAttribute('aria-hidden','true');
     rect.setAttribute('fill','transparent');rect.setAttribute('stroke','none');rect.setAttribute('pointer-events','all');
     label.before(rect);hitAreas.set(label,rect);
    }
    rect.setAttribute('x',box.x-6);rect.setAttribute('y',box.y-6);
    rect.setAttribute('width',box.width+12);rect.setAttribute('height',box.height+12);
    const transform=label.getAttribute('transform');
    if(transform)rect.setAttribute('transform',transform);else rect.removeAttribute('transform');
   });
  }
  refresh();
  if(document.fonts)document.fonts.ready.then(refresh);
 }
 function openFlip(figure,id,link){
  const item=figure.querySelector('#'+CSS.escape(id));if(!item)return;
  origin=link||figure.querySelector('select.atlas-mobile');const title=titleOf(item);
  dialog.querySelector('h2').textContent=title;
  dialog.querySelector('.framework-flip__kicker').textContent=figure.querySelector('header h3')?.textContent||'AeroSense field notes';
  copyInto(dialog.querySelector('.framework-flip__copy'),item);
  const front=dialog.querySelector('.framework-flip__front');front.replaceChildren();
  if(link?.ownerSVGElement){
   const box=link.getBBox(),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
   svg.setAttribute('viewBox',`${box.x-8} ${box.y-8} ${box.width+16} ${box.height+16}`);
   const clone=link.cloneNode(true);clone.removeAttribute('href');clone.removeAttribute('tabindex');svg.append(clone);front.append(svg);
   dialog.style.setProperty('--tile-color',link.querySelector('[fill]')?.getAttribute('fill')||'#d7e7bd');
  }else front.textContent=title;
  expandLink(figure,id);
  const from=origin?.getBoundingClientRect();dialog.showModal();
  const target=dialog.getBoundingClientRect(),turn=dialog.querySelector('.framework-flip__turn');animation?.cancel();turn.style.transform='';
  if(!reduced.matches&&from)animation=turn.animate([
   {transform:`translate(${from.x+from.width/2-target.x-target.width/2}px,${from.y+from.height/2-target.y-target.height/2}px) scale(${Math.min(1,from.width/target.width)}) rotateY(0deg)`},
   {transform:'translate(0,0) scale(1) rotateY(180deg)'}
  ],{duration:560,easing:'cubic-bezier(.2,.75,.25,1)',fill:'forwards'});
  else turn.style.transform='rotateY(180deg)';
  dialog.querySelector('.framework-flip__close').focus({preventScroll:true});
 }
 figures.forEach(figure=>{
  makeLabelTargets(figure);
  const key=['golden','thinking','value','bmc','market','barriers','pest','swot','stakeholders'].find(name=>figure.classList.contains('framework--'+name));
  const mode=({golden:'circle',thinking:'steps',value:'pair',bmc:'folio',market:'lens',barriers:'flip',pest:'drawer',swot:'paper',stakeholders:'contact'})[key]||'paper';
  const isBarrier=mode==='flip';
  figure.dataset.interaction=mode;
  const instruction=figure.querySelector('.atlas-instruction');
  if(instruction)instruction.textContent=({flip:'Select a quadrant to lift and turn over its card.',circle:'Choose a ring to open the idea at its centre.',steps:'Choose a stage to open the working notebook and follow the decisions.',pair:'Choose a region to compare the customer need and proposed response.',folio:'Choose a block to open its page in the business-model folio.',lens:'Choose a market layer to bring its assumptions into focus.',drawer:'Choose a factor to pull out its context file.',paper:'Choose a quadrant to lift its evidence note from the board.',contact:'Choose a stakeholder to open its role and engagement record.'})[mode];
  let open=openFlip;
  if(isBarrier)figure.classList.add('has-flip-card');
  else {
   figure.classList.add('has-local-reveal');
   const svg=figure.querySelector('.atlas-art');if(!svg)return;
   const stage=document.createElement('div');stage.className='framework-stage';svg.before(stage);stage.append(svg);
   const reveal=document.createElement('article');reveal.className='framework-reveal';reveal.hidden=true;reveal.id=figure.id+'-reveal';
   const headingId=figure.id+'-reveal-title';reveal.setAttribute('aria-labelledby',headingId);
   reveal.innerHTML='<button class="framework-reveal__close" type="button">Close ×</button><div class="framework-reveal__emblem" aria-hidden="true"></div><div class="framework-reveal__reading"><p class="framework-reveal__kicker"></p><h4 id="'+headingId+'" tabindex="-1"></h4><div class="framework-reveal__body"></div></div>'+
    (mode==='steps'?'<nav class="framework-reveal__nav" aria-label="Design thinking stages"><button type="button" data-step-prev>← Previous</button><span data-step-position></span><button type="button" data-step-next>Next →</button></nav>':'')+
    (mode==='folio'?'<nav class="framework-reveal__tabs" aria-label="Business model blocks"></nav>':'');
   stage.append(reveal);
   let trigger=null,activeId='',transition=null;
   const links=[...figure.querySelectorAll('[data-atlas-target]')];
   // Use the source content order for sequential reading; SVG painting order
   // can differ because an outer shape must be drawn before an inner shape.
   const items=[...figure.querySelectorAll('.framework-cell')];
   const itemIds=items.map(item=>item.id);
   const originalTabIndices=links.map(link=>link.getAttribute('tabindex'));
   const originalAriaHidden=svg.getAttribute('aria-hidden');
   function setDiagramHidden(hidden){
    if(hidden)svg.setAttribute('aria-hidden','true');
    else if(originalAriaHidden===null)svg.removeAttribute('aria-hidden');
    else svg.setAttribute('aria-hidden',originalAriaHidden);
    links.forEach((link,index)=>{
     if(hidden)link.setAttribute('tabindex','-1');
     else if(originalTabIndices[index]===null)link.removeAttribute('tabindex');
     else link.setAttribute('tabindex',originalTabIndices[index]);
    });
   }
   links.forEach(link=>link.setAttribute('aria-controls',reveal.id));
   function close(){
    transition?.cancel();reveal.hidden=true;figure.classList.remove('is-revealing');setDiagramHidden(false);
    expandLink(figure,'');trigger?.focus({preventScroll:true});
   }
   open=(_,id,link)=>{
    const item=figure.querySelector('#'+CSS.escape(id));if(!item)return;
    trigger=link||figure.querySelector('select.atlas-mobile');activeId=id;
    const selected=link||links.find(a=>a.getAttribute('href')==='#'+id);
    let regionColor=selected?.querySelector('[fill]')?.getAttribute('fill')||'var(--v-pigment)';
    if(regionColor.startsWith('url('))regionColor=figure.querySelector(regionColor.slice(4,-1)+' stop')?.getAttribute('stop-color')||'var(--v-pigment)';
    reveal.style.setProperty('--region-color',regionColor);
    const index=itemIds.indexOf(id),emblem=reveal.querySelector('.framework-reveal__emblem');
    emblem.textContent=mode==='paper'?['S','W','O','T'][index]:mode==='drawer'?['P','E','S','T'][index]:mode==='contact'?titleOf(item).split(/\s+/).slice(0,2).map(s=>s[0]).join(''):mode==='circle'?titleOf(item):mode==='lens'?['TAM','SAM','SOM'][index]:mode==='pair'?'↔':String(index+1).padStart(2,'0');
    reveal.querySelector('h4').textContent=titleOf(item);
    reveal.querySelector('.framework-reveal__kicker').textContent=figure.querySelector('header h3')?.textContent||'Strategic field note';
    const body=reveal.querySelector('.framework-reveal__body');
    if(mode==='pair'){
     body.replaceChildren();
     const customerIndex=index<3?index:index-3;
     [items[customerIndex],items[customerIndex+3]].forEach((source,i)=>{
      if(!source)return;
      const sheet=document.createElement('section');sheet.className='framework-pair__sheet';
      const role=document.createElement('p');role.className='framework-pair__role';role.textContent=i?'Proposed offer':'Customer profile';
      const title=document.createElement('h5');title.textContent=titleOf(source);
      const copy=document.createElement('div');copyInto(copy,source);sheet.append(role,title,copy);body.append(sheet);
     });
     reveal.querySelector('h4').textContent='Need ↔ response';
    }else copyInto(body,item);
    expandLink(figure,id);figure.classList.add('is-revealing');reveal.hidden=false;setDiagramHidden(true);
    reveal.scrollTop=0;
    transition?.cancel();
    if(!reduced.matches){
     const from=selected?.getBoundingClientRect(),to=reveal.getBoundingClientRect();
     const tile=from?`translate(${from.x+from.width/2-to.x-to.width/2}px,${from.y+from.height/2-to.y-to.height/2}px) scale(.3)`:'scale(.8)';
     const frames=({
      circle:[{opacity:0,transform:'scale(.45)',borderRadius:'50%'},{opacity:1,transform:'none'}],
      steps:[{opacity:0,transform:'perspective(1000px) rotateX(-16deg) translateY(28px)'},{opacity:1,transform:'none'}],
      pair:[{opacity:0,transform:'scaleX(.6)'},{opacity:1,transform:'none'}],
      folio:[{opacity:0,transform:'perspective(1100px) rotateY(-42deg)'},{opacity:1,transform:'none'}],
      lens:[{opacity:.3,clipPath:'circle(6% at 50% 50%)'},{opacity:1,clipPath:'circle(100% at 50% 50%)'}],
      drawer:[{opacity:0,transform:'translateX(110%)'},{opacity:1,transform:'none'}],
      paper:[{opacity:0,transform:tile+' rotate(-9deg)'},{opacity:1,transform:'rotate(1.2deg)'},{opacity:1,transform:'none'}],
      contact:[{opacity:0,transform:'translateY(30px) scale(.82)',borderRadius:'50%'},{opacity:1,transform:'none'}]
     })[mode];
     transition=reveal.animate(frames,{duration:mode==='paper'?460:400,easing:'cubic-bezier(.2,.8,.25,1)'});
     if(mode==='pair')body.querySelectorAll('.framework-pair__sheet').forEach((sheet,i)=>sheet.animate([{transform:`translateX(${i?40:-40}px)`,opacity:.2},{transform:'none',opacity:1}],{duration:430,easing:'ease-out'}));
    }
    if(mode==='steps'){
     reveal.querySelector('[data-step-prev]').disabled=index<=0;
     reveal.querySelector('[data-step-next]').disabled=index===items.length-1;
     reveal.querySelector('[data-step-position]').textContent=(index+1)+' / '+items.length;
    }
    if(mode==='folio')reveal.querySelectorAll('[data-folio-target]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.folioTarget===id)));
    reveal.querySelector('h4').focus({preventScroll:true});
   };
   reveal.querySelector('.framework-reveal__close').addEventListener('click',close);
   reveal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
   reveal.querySelectorAll('[data-step-prev],[data-step-next]').forEach(button=>button.addEventListener('click',()=>{
    const index=itemIds.indexOf(activeId)+(button.hasAttribute('data-step-next')?1:-1);
    if(itemIds[index])open(figure,itemIds[index],links.find(a=>a.getAttribute('href')==='#'+itemIds[index]));
   }));
   if(mode==='folio')items.forEach((item,index)=>{
    const button=document.createElement('button');button.type='button';button.dataset.folioTarget=item.id;
    button.textContent=String(index+1).padStart(2,'0');button.setAttribute('aria-label',titleOf(item));button.title=titleOf(item);
    button.addEventListener('click',()=>open(figure,item.id,links.find(a=>a.getAttribute('href')==='#'+item.id)));
    reveal.querySelector('.framework-reveal__tabs').append(button);
   });
  }
  figure.addEventListener('click',event=>{
   const a=event.target.closest('[data-atlas-target]');if(!a)return;
   event.preventDefault();event.stopImmediatePropagation();open(figure,a.getAttribute('href').slice(1),a);
  },true);
  figure.addEventListener('keydown',event=>{
   const a=event.target.closest('[data-atlas-target]');if(!a||!['Enter',' '].includes(event.key))return;
   event.preventDefault();event.stopImmediatePropagation();open(figure,a.getAttribute('href').slice(1),a);
  },true);
  figure.addEventListener('change',event=>{
   if(!event.target.matches('select.atlas-mobile')||!event.target.value)return;
   event.stopImmediatePropagation();open(figure,event.target.value);
  },true);
 });
 dialog.querySelector('.framework-flip__close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('.framework-flip__copy a'))dialog.close();});
 dialog.addEventListener('close',()=>{animation?.cancel();if(origin){const figure=origin.closest('.framework');if(figure)expandLink(figure,'');origin.focus({preventScroll:true});}});
})();
