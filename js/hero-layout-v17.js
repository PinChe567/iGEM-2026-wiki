/* Measure full-bleed cover geometry without moving landmarks or article nodes. */
(() => {
 'use strict';
 if (!document.body?.matches('.signal-atlas:not(.page-home)')) return;
 if(document.documentElement.hasAttribute('data-hero-layout-v17'))return;
 document.documentElement.setAttribute('data-hero-layout-v17','');
 const selector='.page-hero,.members-intro,.learn-hero,.lm-hero,.glossary-conversation-hero';
 const covers=new Set();
 let frame=0;
 const update=()=>{
  frame=0;
  const width=document.documentElement.clientWidth;
  covers.forEach(cover=>{
   if(!cover.isConnected||!cover.getClientRects().length)return;
   const parent=cover.parentElement,box=parent.getBoundingClientRect(),style=getComputedStyle(parent);
   const inset=box.left+parseFloat(style.borderLeftWidth||0)+parseFloat(style.paddingLeft||0);
   cover.style.setProperty('--hero-v17-width',width+'px');
   cover.style.setProperty('--hero-v17-outset',inset+'px');
   const shell=cover.closest('.shell--with-toc,.learn-app');
   if(shell){
    shell.setAttribute('data-hero-layout-v17','');
    const gap=parseFloat(getComputedStyle(cover).marginBottom)||0;
    const start=shell.getBoundingClientRect().top+(parseFloat(getComputedStyle(shell).paddingTop)||0);
    shell.style.setProperty('--hero-v17-toc-offset',Math.max(0,cover.getBoundingClientRect().bottom+gap-start)+'px');
   }
  });
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
 const observer='ResizeObserver' in window?new ResizeObserver(schedule):null;
 const discover=()=>{
  document.querySelectorAll(selector).forEach(cover=>{
   if(!covers.has(cover)){covers.add(cover);observer?.observe(cover)}
   observer?.observe(cover.parentElement);
  });
  if(covers.size){document.documentElement.classList.add('hero-layout-v17');update()}
 };
 discover();
 // The head bootstrap has already painted this geometry. Transfer observation
 // without removing its styles or the shared surface class.
 window.AeroSenseHeroFirstPaint?.stop();
 // Learning lessons create their cover after reading the local module data.
 const mutations=new MutationObserver(records=>{
  if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches?.(selector)||node.querySelector?.(selector)))))discover();
 });
 mutations.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('resize',schedule,{passive:true});
 document.fonts?.ready.then(schedule);
 window.addEventListener('pageshow',schedule,{passive:true});
})();
