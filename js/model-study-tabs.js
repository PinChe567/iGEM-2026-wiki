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
  references.forEach(ref=>{
    const tracks=new Set();
    document.querySelectorAll('main a[href="#'+CSS.escape(ref.id)+'"]').forEach(cite=>{
      const key=directTrack(cite);if(key)tracks.add(key);
    });
    // Uncited records never become automatic further reading in another study.
    // The shared reference enhancer handles genuine citations and their returns.
    if(!tracks.size)ref.dataset.referenceEnhanced='uncited-model-source';
    referenceTracks.set(ref.id,tracks);
  });
  // Each panel owns a bibliography ordered by its first actual citation. The
  // same numbering is authored in HTML, so the full no-JS page remains usable.
  panels.forEach(panel=>{
    const order=[];
    const scopes=[panel,...supplements.filter(group=>group.dataset.modelSupplement===panel.dataset.modelPanel),...availability.filter(group=>group.dataset.modelAvailability===panel.dataset.modelPanel)];
    scopes.flatMap(scope=>[...scope.querySelectorAll('a[href^="#"]')]).forEach(cite=>{
      const id=cite.getAttribute('href').slice(1);
      if(!referenceTracks.has(id))return;
      if(!order.includes(id))order.push(id);
      const number=order.indexOf(id)+1;
      cite.textContent='['+number+']';
      cite.setAttribute('aria-label','Reference '+number);
      cite.dataset.modelReference=id;
      document.getElementById(id).value=number;
    });
    const list=document.querySelector('[data-model-reference-group="'+panel.dataset.modelPanel+'"] .ref-list');
    if(list){list.start=1;order.forEach(id=>list.appendChild(document.getElementById(id)));}
  });
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
    tabs.forEach(tab=>{
      const selected=tab.dataset.modelTab===key;
      tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
      if(selected&&focus)tab.focus({preventScroll:true});
    });
    references.forEach(ref=>{ref.hidden=!referenceTracks.get(ref.id).has(key);});
    document.querySelectorAll('#references [data-model-reference-group]').forEach(group=>{group.hidden=group.dataset.modelReferenceGroup!==key;});
    document.querySelectorAll('#references :is(.ref-list,.re-bibliography)').forEach(list=>{list.hidden=![...list.children].some(ref=>!ref.hidden);});
    if(referenceSection)referenceSection.hidden=!references.some(ref=>!ref.hidden);
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
  panels.forEach(panel=>{panel.setAttribute('role','tabpanel');panel.tabIndex=0;});
  // Run before native anchor scrolling and existing citation-return handlers.
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link||link.hasAttribute('data-model-tab')||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
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
