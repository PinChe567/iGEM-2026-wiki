/* Accessible study tabs; original sections, anchors and numbering stay intact. */
(() => {
  'use strict';
  // Authored labels follow the current display order. Evidence identity is kept
  // by stable anchors across the visible results and inline supporting figures.
  document.querySelectorAll('main figure[data-static-figure-number], main figure[data-static-video-number]').forEach(figure=>{
    const label=figure.querySelector(':scope > figcaption > .media-caption__label');
    const video=figure.hasAttribute('data-static-video-number');
    if(label)label.textContent=(video?'Video ':'Figure ')+(video?figure.dataset.staticVideoNumber:figure.dataset.staticFigureNumber)+'. ';
  });
  document.querySelectorAll('main table[data-model-table-number]').forEach(table=>{
    const label=table.querySelector(':scope > caption > .media-caption__label');
    if(label)label.textContent='Table '+table.dataset.modelTableNumber+'. ';
  });
  const rail=document.querySelector('[data-model-tabs]');
  if(!rail)return;
  const tabs=[...rail.querySelectorAll('[data-model-tab]')];
  const panels=[...document.querySelectorAll('[data-model-panel]')];
  const supplements=[...document.querySelectorAll('[data-model-supplement]')];
  const availability=[...document.querySelectorAll('[data-model-availability]')];
  const nextReadings=[...document.querySelectorAll('[data-model-next-for]')];
  if(tabs.length<2||tabs.length!==panels.length)return;
  const panelFor=key=>panels.find(panel=>panel.dataset.modelPanel===key);
  const names=Object.fromEntries(tabs.map(tab=>{const label=tab.querySelector('strong');return[tab.dataset.modelTab,window.AeroSenseI18n?.sourceText(label)||label.textContent];}));
  const status=document.querySelector('[data-model-study-status]');
  const switcher=document.getElementById('model-study-switch');
  const references=[...document.querySelectorAll('#references :is(.ref-list,.re-bibliography) > li[id]')];
  const referenceSection=document.getElementById('references');
  const referenceTracks=new Map();
  const defaultStudy='decoding';
  let active=defaultStudy;
  let scrollFrame=0;

  function targetFromHash(hash=location.hash){
    if(!hash||hash==='#')return null;
    try{return document.getElementById(decodeURIComponent(hash.slice(1)));}catch{return null;}
  }
  function directTrack(target){return target?.closest('[data-model-panel]')?.dataset.modelPanel||target?.closest('[data-model-supplement]')?.dataset.modelSupplement||target?.closest('[data-model-availability]')?.dataset.modelAvailability||target?.closest('[data-model-reference-group]')?.dataset.modelReferenceGroup||null;}
  // Each study owns its citation sequence, including its supplementary records.
  // Keep one source node/anchor so previews and return links remain intact.
  const referenceById=new Map(references.map(ref=>[ref.id,ref]));
  const referenceByUrl=new Map();
  references.forEach(ref=>{
    referenceTracks.set(ref.id,new Set());
    ref.querySelectorAll('a[href]').forEach(link=>{
      if(link.getAttribute('href').startsWith('#')||link.closest('.ref-return-tools,.ref-highlights'))return;
      const ids=referenceByUrl.get(link.href)||[];ids.push(ref.id);referenceByUrl.set(link.href,ids);
    });
  });
  const studyReferences=new Map(tabs.map(tab=>[tab.dataset.modelTab,new Map()]));
  const studyCitations=[];
  document.querySelectorAll('main a[href]').forEach(cite=>{
    if(cite.closest('#references,.cite-preview,.reference-reading-note,.page-toc,.audit-mobile-jump'))return;
    const key=directTrack(cite),order=studyReferences.get(key);if(!order)return;
    const href=cite.getAttribute('href');
    const ids=href.startsWith('#')?[href.slice(1)]:(referenceByUrl.get(cite.href)||[]);
    ids.forEach(id=>{
      if(!referenceById.has(id))return;
      if(!order.has(id))order.set(id,order.size+1);
      referenceTracks.get(id).add(key);
      studyCitations.push({cite,key,id});
    });
  });
  references.forEach(ref=>{
    if(!referenceTracks.get(ref.id).size)ref.dataset.referenceEnhanced='uncited-model-source';
  });
  const studyReferenceList=document.createElement('ol');
  studyReferenceList.className='ref-list model-study-reference-list';
  studyReferenceList.dataset.referenceOrder='study-first-citation';
  referenceSection?.append(studyReferenceList);
  function trackFor(target,preferred=active){
    const direct=directTrack(target);if(direct)return direct;
    const ref=target?.closest('#references :is(.ref-list,.re-bibliography) > li[id]');
    const tracks=ref&&referenceTracks.get(ref.id);
    if(tracks)return tracks.has(preferred)?preferred:[...tracks][0];
    return null;
  }

  function syncContents(){
    document.querySelectorAll('.page-toc a[href^="#"],.audit-mobile-jump nav a[href^="#"]').forEach(link=>{
      if(link.classList.contains('back-to-top'))return;
      const target=targetFromHash(link.getAttribute('href'));
      const key=directTrack(target);
      const item=link.closest('li')||link;
      item.dataset.modelTocItem='';item.hidden=Boolean(key&&key!==active)||Boolean(target===referenceSection&&referenceSection.hidden);
      if(item.hidden)link.removeAttribute('aria-current');
    });
    const title=document.querySelector('.page-toc .toc__label');if(title)title.textContent=names[active];
    const mobileTitle=document.querySelector('.audit-mobile-jump > summary');if(mobileTitle)mobileTitle.textContent=names[active]+' · contents';
    window.AeroSenseToc?.refresh();
  }
  function syncReferenceVisibility(){
    // The shared enhancer may regroup source types; restore this page's
    // independent first-citation order after each shared enhancement pass.
    const order=studyReferences.get(active);
    studyCitations.forEach(({cite,key,id})=>{
      const number=studyReferences.get(key).get(id);
      if(cite.classList.contains('cite')||/^\s*\[[^\]]+\]\s*$/.test(cite.textContent))cite.textContent='['+number+']';
      if(cite.classList.contains('cite'))cite.setAttribute('aria-label',names[key]+' reference '+number);
    });
    const ordered=references.slice().sort((a,b)=>(order.get(a.id)||Infinity)-(order.get(b.id)||Infinity));
    ordered.forEach(ref=>{
      const number=order.get(ref.id);ref.hidden=!number;
      if(number)ref.value=number;
      studyReferenceList.append(ref);
    });
    studyReferenceList.hidden=!order.size;studyReferenceList.start=1;
    studyReferenceList.setAttribute('aria-label',names[active]+' references');
    referenceSection?.setAttribute('data-reference-order','study-first-citation');
    document.querySelectorAll('#references :is(.ref-list,.re-bibliography)').forEach(list=>{
      if(list!==studyReferenceList)list.hidden=![...list.children].some(ref=>!ref.hidden);
    });
    document.querySelectorAll('#references .reference-group[data-reference-family],#references .model-reference-group').forEach(group=>{
      group.hidden=![...group.querySelectorAll('.ref-list > li')].some(ref=>!ref.hidden);
    });
    if(referenceSection)referenceSection.hidden=!order.size;
  }
  document.addEventListener('aerosense:referenceschange',syncReferenceVisibility);
  function activate(key,{focus=false}={}){
    if(!panelFor(key))key=defaultStudy;
    active=key;document.body.dataset.modelStudy=key;
    panels.forEach(panel=>{
      const selected=panel.dataset.modelPanel===key;panel.hidden=!selected;
      if(!selected)panel.querySelectorAll('video').forEach(video=>video.pause());
    });
    supplements.forEach(group=>{
      group.hidden=group.dataset.modelSupplement!==key;
      if(group.hidden)group.querySelectorAll('video').forEach(video=>video.pause());
    });
    availability.forEach(group=>{group.hidden=group.dataset.modelAvailability!==key;});
    nextReadings.forEach(nav=>{nav.hidden=nav.dataset.modelNextFor!==key;});
    tabs.forEach(tab=>{
      const selected=tab.dataset.modelTab===key;
      tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
      if(selected&&focus)tab.focus({preventScroll:true});
    });
    syncReferenceVisibility();
    status.textContent=names[key]+' selected.';
    syncContents();
    window.dispatchEvent(new Event('scroll'));
  }
  function reveal(target){
    if(!target)return;
    if(target.tagName==='DETAILS')target.open=true;
    for(let parent=target.parentElement;parent;parent=parent.parentElement){if(parent.tagName==='DETAILS')parent.open=true;}
    cancelAnimationFrame(scrollFrame);
    scrollFrame=requestAnimationFrame(()=>{
      const destination=panels.includes(target)?switcher:target;
      destination.scrollIntoView({block:'start',behavior:'instant'});
    });
  }
  function remember(){history.replaceState({...history.state,modelStudy:active},'',location.href);}
  function readLocation({scroll=true}={}){
    const target=targetFromHash();
    // A bare Model URL always opens odor decoding; explicit study/section and
    // citation hashes still choose their owning study, including back/forward.
    const key=location.hash
      ? trackFor(target,history.state?.modelStudy||active)||history.state?.modelStudy||defaultStudy
      : defaultStudy;
    activate(key);remember();if(scroll&&target)reveal(target);
  }
  function selectTab(tab,{focus=false}={}){
    const key=tab.dataset.modelTab;
    if(key!==active){
      activate(key,{focus});
      history.pushState({...history.state,modelStudy:key},'','#'+panelFor(key).id);
    }else if(focus)tab.focus({preventScroll:true});
  }
  rail.setAttribute('role','tablist');rail.setAttribute('aria-label','Model study');
  tabs.forEach(tab=>{
    tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panelFor(tab.dataset.modelTab).id);
    tab.setAttribute('aria-label',names[tab.dataset.modelTab]);
    tab.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();selectTab(tab);});
    tab.addEventListener('keydown',event=>{
      const index=tabs.indexOf(tab);let next;
      if(event.key==='ArrowRight')next=tabs[(index+1)%tabs.length];
      else if(event.key==='ArrowLeft')next=tabs[(index+tabs.length-1)%tabs.length];
      else if(event.key==='Home')next=tabs[0];
      else if(event.key==='End')next=tabs[tabs.length-1];
      else if(event.key===' '||event.key==='Enter')next=tab;
      if(next){event.preventDefault();selectTab(next,{focus:true});}
    });
  });
  document.querySelectorAll('[data-model-next]').forEach(link=>{
    link.addEventListener('click',event=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const key=link.dataset.modelNext,target=targetFromHash(link.hash);
      if(!panelFor(key)||!target)return;
      event.preventDefault();activate(key);
      history.pushState({...history.state,modelStudy:key},'',link.hash);
      const heading=target.matches('h2,h3,h4')?target:target.querySelector('h2,h3,h4')||target;
      if(!heading.hasAttribute('tabindex'))heading.setAttribute('tabindex','-1');
      heading.focus({preventScroll:true});reveal(target);
    });
  });
  panels.forEach(panel=>{panel.setAttribute('role','tabpanel');panel.tabIndex=0;});
  // Run before native anchor scrolling and existing citation-return handlers.
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link||link.hasAttribute('data-model-tab')||link.hasAttribute('data-model-next')||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    let url;try{url=new URL(link.href,location.href);}catch{return;}
    const path=value=>value.replace(/\.html$/,'').replace(/\/$/,'');
    if(url.origin!==location.origin||path(url.pathname)!==path(location.pathname)||!url.hash)return;
    const target=targetFromHash(url.hash),key=trackFor(target);
    if(key&&key!==active)activate(key);
    if(target){if(target.tagName==='DETAILS')target.open=true;for(let parent=target.parentElement;parent;parent=parent.parentElement){if(parent.tagName==='DETAILS')parent.open=true;}}
  },true);
  window.addEventListener('hashchange',()=>readLocation());
  window.addEventListener('popstate',()=>readLocation());
  document.addEventListener('aerosense:before-anchor',event=>{
    const target=event.detail?.target,key=trackFor(target);
    if(key&&key!==active)activate(key);
  });
  readLocation();
  document.body.classList.add('model-studies-ready');
})();
