(function(){
  'use strict';
  const glance=document.getElementById('at-a-glance');
  if(!glance)return;
  const anchors=[...glance.querySelectorAll('.sust-sdg[href^="#"]')];
  const primary=anchors.slice(0,4);
  const block=primary[0]?.closest('.sust-glance__block');
  if(!block)return;
  const panel=document.createElement('div');panel.className='sdg-feature';panel.setAttribute('aria-live','polite');
  const title=document.createElement('h4');const text=document.createElement('p');const evidence=document.createElement('p');const link=document.createElement('a');
  link.textContent='Read the full pathway ↗';panel.append(title,text,evidence,link);
  primary[0].closest('ul').after(panel);
  const articles=[...document.querySelectorAll('.sust-pathway[id]')];
  articles.forEach(article=>{
    const head=article.querySelector('.sust-pathway__head');const list=article.querySelector('.sust-slot-list');if(!head||!list)return;
    const toggle=document.createElement('button');toggle.type='button';toggle.className='sdg-pathway-toggle';toggle.textContent='Open evidence and limits';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',article.id+'-detail');list.id=article.id+'-detail';list.hidden=true;head.append(toggle);
    toggle.addEventListener('click',()=>{const open=list.hidden;list.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Fold pathway':'Open evidence and limits';});
  });
  function openArticle(id){const article=document.getElementById(id);const list=article?.querySelector('.sust-slot-list');if(list&&list.hidden)article.querySelector('.sdg-pathway-toggle')?.click();}
  function select(anchor){
    anchors.forEach(a=>{const on=a===anchor;a.classList.toggle('is-selected',on);a.setAttribute('aria-current',on?'true':'false');});
    const id=anchor.getAttribute('href').slice(1);const article=document.getElementById(id);
    const label=anchor.querySelector('.sust-sdg__name')?.textContent?.trim()||'SDG';
    title.textContent='SDG '+anchor.dataset.sdgNumber+' · '+label;
    text.textContent=anchor.querySelector('.sust-sdg__role')?.textContent?.trim()||'';
    const target=article?.querySelector('.sust-slot__body p')?.textContent?.trim();
    evidence.textContent=target||'Select the full pathway for targets, evidence and limits.';
    link.href='#'+id;
  }
  anchors.forEach(anchor=>{
    const number=anchor.querySelector('.sust-sdg__num')?.textContent?.trim();
    if(number){anchor.dataset.sdgNumber=number;const img=document.createElement('img');img.src='sustainability/E%20SDG%20Icons%20PRINT/E_SDG_PRINT-'+number+'.jpg';img.alt='';img.loading='lazy';img.decoding='async';anchor.querySelector('.sust-sdg__num').replaceWith(img);}
    anchor.addEventListener('click',event=>{event.preventDefault();select(anchor);if(!primary.includes(anchor))openArticle(anchor.hash.slice(1));});
  });
  link.addEventListener('click',()=>openArticle(link.hash.slice(1)));
  window.addEventListener('hashchange',()=>openArticle(location.hash.slice(1)));
  if(location.hash)openArticle(location.hash.slice(1));
  select(anchors.find(a=>a.hash===location.hash)||primary[0]);
})();
