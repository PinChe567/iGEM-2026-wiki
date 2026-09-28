/* A selected diagram tile enlarges and turns over; no duplicate answer panel. */
(() => {
 const figures=[...document.querySelectorAll('.framework')];if(!figures.length)return;
 const dialog=document.createElement('dialog');dialog.className='framework-flip';
 dialog.innerHTML='<div class="framework-flip__turn"><div class="framework-flip__front" aria-hidden="true"></div><article class="framework-flip__back"><button class="framework-flip__close" type="button" aria-label="Close and return to diagram">×</button><p class="framework-flip__kicker"></p><h2 id="framework-flip-title"></h2><div class="framework-flip__copy"></div></article></div>';
 dialog.setAttribute('aria-labelledby','framework-flip-title');document.body.append(dialog);let origin=null,animation=null;
 function open(figure,id,link){
  const item=figure.querySelector('#'+CSS.escape(id));if(!item)return;
  origin=link||figure.querySelector('.atlas-mobile');const title=item.querySelector('summary')?.textContent||'Analysis';
  dialog.querySelector('h2').textContent=title;dialog.querySelector('.framework-flip__kicker').textContent=figure.querySelector('header h3')?.textContent||'AeroSense field notes';
  dialog.querySelector('.framework-flip__copy').replaceChildren(...[...item.querySelector('.framework-cell__body').childNodes].map(n=>n.cloneNode(true)));
  const front=dialog.querySelector('.framework-flip__front');front.replaceChildren();
  if(link?.ownerSVGElement){const box=link.getBBox(),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`${box.x-8} ${box.y-8} ${box.width+16} ${box.height+16}`);const clone=link.cloneNode(true);clone.removeAttribute('href');clone.removeAttribute('tabindex');svg.append(clone);front.append(svg);dialog.style.setProperty('--tile-color',link.querySelector('[fill]')?.getAttribute('fill')||'#d7e7bd');}else front.textContent=title;
  const from=origin?.getBoundingClientRect();dialog.showModal();const target=dialog.getBoundingClientRect(),turn=dialog.querySelector('.framework-flip__turn');animation?.cancel();
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches&&from)animation=turn.animate([{transform:`translate(${from.x+from.width/2-target.x-target.width/2}px,${from.y+from.height/2-target.y-target.height/2}px) scale(${Math.min(1,from.width/target.width)}) rotateY(0deg)`},{transform:'translate(0,0) scale(1) rotateY(180deg)'}],{duration:650,easing:'cubic-bezier(.2,.75,.25,1)',fill:'forwards'});else turn.style.transform='rotateY(180deg)';
  dialog.querySelector('.framework-flip__close').focus({preventScroll:true});
 }
 figures.forEach(figure=>{figure.classList.add('has-flip-card');const instruction=figure.querySelector('.atlas-instruction');if(instruction)instruction.textContent='Select a region to turn it over and read the analysis.';
  figure.addEventListener('click',event=>{const a=event.target.closest('[data-atlas-target]');if(!a)return;event.preventDefault();event.stopImmediatePropagation();open(figure,a.getAttribute('href').slice(1),a);},true);
  figure.addEventListener('keydown',event=>{const a=event.target.closest('[data-atlas-target]');if(!a||!['Enter',' '].includes(event.key))return;event.preventDefault();event.stopImmediatePropagation();open(figure,a.getAttribute('href').slice(1),a);},true);
  figure.querySelector('.atlas-mobile')?.addEventListener('change',event=>{if(event.target.value)open(figure,event.target.value);});
 });
 dialog.querySelector('.framework-flip__close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('.framework-flip__copy a'))dialog.close();});dialog.addEventListener('close',()=>{animation?.cancel();origin?.focus({preventScroll:true});});
})();
