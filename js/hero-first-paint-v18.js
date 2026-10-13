/* Inlined in each chapter head by install_hero_first_paint_v18.py. It has no
   network dependency and runs before the parser can paint a narrow cover. */
(() => {
 'use strict';
 if(window.AeroSenseHeroFirstPaint)return;
 const root=document.documentElement;
 const selector='.page-hero,.members-intro,.learn-hero,.lm-hero,.glossary-conversation-hero';
 const covers=new Set();
 const put=(element,name,value)=>{if(element.style.getPropertyValue(name)!==value)element.style.setProperty(name,value)};
 const sync=()=>{
  if(!document.body?.matches('.signal-atlas:not(.page-home)'))return;
  const width=root.clientWidth;
  covers.forEach(cover=>{
   if(!cover.isConnected||!cover.getClientRects().length)return;
   const parent=cover.parentElement,box=parent.getBoundingClientRect(),style=getComputedStyle(parent);
   const inset=box.left+(parseFloat(style.borderLeftWidth)||0)+(parseFloat(style.paddingLeft)||0);
   put(cover,'--hero-v17-width',width+'px');
   put(cover,'--hero-v17-outset',inset+'px');
   const shell=cover.closest('.shell--with-toc,.learn-app');
   if(shell){
    shell.setAttribute('data-hero-layout-v17','');
    const gap=parseFloat(getComputedStyle(cover).marginBottom)||0;
    const start=shell.getBoundingClientRect().top+(parseFloat(getComputedStyle(shell).paddingTop)||0);
    put(shell,'--hero-v17-toc-offset',Math.max(0,cover.getBoundingClientRect().bottom+gap-start)+'px');
   }
  });
 };
 const resize='ResizeObserver' in window?new ResizeObserver(sync):null;
 const discover=()=>{
  if(!document.body?.matches('.signal-atlas:not(.page-home)'))return;
  document.querySelectorAll(selector).forEach(cover=>{
   if(!covers.has(cover)){covers.add(cover);resize?.observe(cover)}
   resize?.observe(cover.parentElement);
  });
  if(covers.size){
   if(!root.classList.contains('hero-layout-v17'))root.classList.add('hero-layout-v17');
   sync();
  }
 };
 // Child additions include the progressively parsed title/art and dynamic lessons.
 const mutations=new MutationObserver(discover);
 mutations.observe(root,{childList:true,subtree:true});
 window.addEventListener('resize',sync,{passive:true});
 document.fonts?.ready.then(sync);
 window.AeroSenseHeroFirstPaint={stop(){mutations.disconnect();resize?.disconnect();window.removeEventListener('resize',sync);delete window.AeroSenseHeroFirstPaint}};
 discover();
})();
