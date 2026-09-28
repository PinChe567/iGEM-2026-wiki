/* Keep missing local research-package assets legible without inventing replacement figures. */
(() => {
  'use strict';
  if(!document.body.classList.contains('page-hardware'))return;
  const selector='[src*="AeroSense_R2_2"],[href*="AeroSense_R2_2"]';
  const items=[...document.querySelectorAll(selector)];
  if(!items.length)return;
  let notice=null;
  function warn(){
    if(notice)return;
    notice=document.createElement('p');notice.className='source-availability';notice.setAttribute('role','status');
    notice.textContent='Some linked R2.2 source files are unavailable in this copy of the wiki. The descriptions remain readable; figures and downloads require the original source package.';
    const hero=document.querySelector('.page-hero');(hero||document.querySelector('main')).after(notice);
  }
  function missingImage(img){
    if(!img.isConnected)return;warn();
    const placeholder=document.createElement('div');placeholder.className='source-availability__figure';placeholder.setAttribute('role','img');
    placeholder.setAttribute('aria-label',img.alt||'Figure unavailable');
    placeholder.textContent='Figure source unavailable · '+(img.alt||'Original R2.2 figure');
    img.replaceWith(placeholder);
  }
  items.filter(el=>el.tagName==='IMG').forEach(img=>{
    img.addEventListener('error',()=>missingImage(img),{once:true});
    if(img.complete&&!img.naturalWidth)missingImage(img);
  });
  const links=items.filter(el=>el.tagName==='A');
  const requests=new Map();
  links.forEach(link=>{
    const href=link.getAttribute('href');
    // Only a definite missing-file response disables a link. Some wiki hosts do not support HEAD.
    if(!requests.has(href))requests.set(href,fetch(href,{method:'HEAD'}).then(r=>r.status!==404&&r.status!==410).catch(()=>true));
    requests.get(href).then(ok=>{
      if(ok||!link.isConnected)return;
      warn();link.removeAttribute('href');link.removeAttribute('download');link.classList.add('source-availability__link');
      link.setAttribute('aria-disabled','true');link.title='The source file is not present in this copy of the wiki';
    });
  });
})();
