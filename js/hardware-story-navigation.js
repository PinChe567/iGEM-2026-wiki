/* Native sticky scene: one reversible scroll timeline, with no scroll correction. */
(() => {
  const route=document.querySelector('.hw-product-route');if(!route)return;
  const tour=route.querySelector('.hw-product-tour'),host=route.querySelector('[data-hardware-product-story]');
  const model=host.querySelector('.hw-product-model'),labels=host.querySelector('.hw-product-label-layer');
  const phone=host.querySelector('.hw-product-phone'),downlink=host.querySelector('.hw-product-downlink path');
  const phoneLabels=host.querySelector('.hw-phone-label-layer'),phoneCallouts=[...host.querySelectorAll('[data-phone-callout]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),callouts=[...host.querySelectorAll('[data-product-callout]')];
  const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10);};
  // All beats use physical stage-height distances. Enlarging a reading hold
  // therefore leaves the pace of the opening and phone handoff unchanged.
  const beats=Object.freeze({assembledEnd:.18,openingEnd:1.05,labelsStart:1,labelsEnd:1.20,holdEnd:3.20,retractEnd:3.45,lineEnd:3.80,exitStart:3.65,exitEnd:4.40,phoneStart:3.90,phoneEnd:4.55,phoneLabelsStart:4.35,phoneLabelsEnd:4.70,end:5.85});
  const phase=(distance,start,end)=>clamp((distance-start)/(end-start));
  route.style.setProperty('--product-scroll-distance',beats.end);
  let viewer,loading=false,visible=false,frame=0,anchors={},focusing=false,progress=0,distance=0;
  function layout(){
    const rect=route.getBoundingClientRect(),toc=document.querySelector('.page-toc'),tr=toc?.getBoundingClientRect();
    const wide=innerWidth>=1100&&toc&&getComputedStyle(toc).display!=='none'&&tr.width>100;
    const left=wide?Math.max(0,rect.left-tr.right-10):Math.max(0,rect.left),right=Math.max(0,innerWidth-rect.right);
    const header=document.querySelector('.site-header')?.getBoundingClientRect().height||72;
    const jump=document.querySelector('.audit-mobile-jump');const extra=jump&&getComputedStyle(jump).display!=='none'?jump.getBoundingClientRect().height:0;
    host.style.setProperty('--product-left-outset',left+'px');host.style.setProperty('--product-right-outset',right+'px');
    route.style.setProperty('--product-top',(header+extra)+'px');host.style.setProperty('--product-top',(header+extra)+'px');
    document.documentElement.style.setProperty('--hw-reader-top',(header+extra)+'px');
    document.documentElement.style.setProperty('--hw-reader-left',wide?(tr.right+10)+'px':'0px');schedule();
  }
  function leaders(){
    const rect=model.getBoundingClientRect();if(!rect.width||!rect.height)return;
    for(const a of callouts){
      const ar=a.getBoundingClientRect(),left=a.dataset.side==='left';
      const lx=((left?ar.right+7:ar.left-7)-rect.left)/rect.width*1000,ly=(ar.top+ar.height/2-rect.top)/rect.height*1000;
      const keys=(a.dataset.productAnchors||a.dataset.productCallout).split(/\s+/);
      for(const key of keys){
        const point=anchors[key],g=labels.querySelector('[data-leader-for="'+key+'"]');if(!point||!g)continue;
        const ax=point.x*1000,ay=point.y*1000,elbow=lx+(left?26:-26);
        g.querySelector('path').setAttribute('d',`M${ax.toFixed(2)} ${ay.toFixed(2)} L${elbow.toFixed(2)} ${ly.toFixed(2)} L${lx.toFixed(2)} ${ly.toFixed(2)}`);
        g.querySelector('circle').setAttribute('cx',ax);g.querySelector('circle').setAttribute('cy',ay);
      }
    }
    phoneLeaders();
  }
  function phoneLeaders(){
    if(!phoneLabels||(!reduced.matches&&distance<beats.phoneStart))return;
    const rect=phoneLabels.getBoundingClientRect(),screen=phone.querySelector('img').getBoundingClientRect();if(!rect.width||!rect.height)return;
    for(const a of phoneCallouts){
      const ar=a.getBoundingClientRect(),left=a.dataset.side==='left',g=phoneLabels.querySelector('[data-phone-leader="'+a.dataset.phoneCallout+'"]');if(!g)continue;
      const ax=(screen.left+screen.width*Number(a.dataset.anchorX)-rect.left)/rect.width*1000,ay=(screen.top+screen.height*Number(a.dataset.anchorY)-rect.top)/rect.height*1000;
      const lx=((left?ar.right+5:ar.left-5)-rect.left)/rect.width*1000,ly=(ar.top+ar.height/2-rect.top)/rect.height*1000;
      g.querySelector('path').setAttribute('d',`M${ax} ${ay} L${lx+(left?18:-18)} ${ly} L${lx} ${ly}`);
      g.querySelector('circle').setAttribute('cx',ax);g.querySelector('circle').setAttribute('cy',ay);
    }
  }
  function measure(){
    frame=0;if(!visible||focusing)return;
    const rect=tour.getBoundingClientRect(),height=host.offsetHeight,top=parseFloat(getComputedStyle(host).top)||72;
    distance=reduced.matches?0:Math.max(0,Math.min(beats.end,(top-rect.top)/Math.max(1,height)));
    progress=distance/beats.end;
    const opening=reduced.matches?1:phase(distance,beats.assembledEnd,beats.openingEnd),entrance=reduced.matches?1:smooth(phase(distance,beats.labelsStart,beats.labelsEnd));
    const retract=smooth(phase(distance,beats.holdEnd,beats.retractEnd)),line=smooth(phase(distance,beats.retractEnd,beats.lineEnd)),exit=smooth(phase(distance,beats.exitStart,beats.exitEnd)),enter=smooth(phase(distance,beats.phoneStart,beats.phoneEnd));
    viewer?.setStoryProgress(opening,exit);
    host.style.setProperty('--label-retract',Math.max(retract,1-entrance));host.style.setProperty('--label-opacity',(1-retract)*entrance);
    host.style.setProperty('--product-exit',(-height*1.25*exit)+'px');host.style.setProperty('--phone-enter',((1-enter)*height*1.2)+'px');
    host.style.setProperty('--phone-tilt',((1-enter)*-7)+'deg');host.style.setProperty('--phone-depth',((1-enter)*18)+'deg');host.style.setProperty('--phone-scale',.91+.09*enter);
    host.style.setProperty('--phone-opacity',distance>=beats.phoneStart?1:0);host.style.setProperty('--connection-opacity',distance>beats.retractEnd&&distance<beats.phoneLabelsEnd?1:0);
    labels.inert=retract>.02||entrance<.95;labels.setAttribute('aria-hidden',String(retract>.98||entrance<.01));
    const phoneActive=reduced.matches||enter>.98;phone.classList.toggle('is-visible',phoneActive);phone.tabIndex=phoneActive?0:-1;
    const phoneLabelProgress=reduced.matches?1:smooth(phase(distance,beats.phoneLabelsStart,beats.phoneLabelsEnd));host.style.setProperty('--phone-label-progress',phoneLabelProgress);
    phoneLabels.inert=phoneLabelProgress<.95;phoneLabels.setAttribute('aria-hidden',String(phoneLabelProgress<.01));
    phoneCallouts.forEach((a,i)=>{const item=reduced.matches?1:smooth(phase(distance,beats.phoneLabelsStart+i*.045,beats.phoneLabelsEnd));a.style.setProperty('--phone-item-progress',item);phoneLabels.querySelector('[data-phone-leader="'+a.dataset.phoneCallout+'"]')?.style.setProperty('--phone-item-progress',item);});
    const base=anchors.base||{x:.36,y:.88},startY=base.y*1000-exit*1250,phoneTop=(.5-phone.offsetHeight/height/2+(1-enter)*1.2)*1000,endY=startY+Math.max(0,phoneTop-startY)*line;
    const phoneX=phone.offsetLeft/host.offsetWidth*1000;
    downlink.setAttribute('d',`M${base.x*1000} ${startY} C${base.x*1000} ${startY+90} ${phoneX} ${endY-90} ${phoneX} ${endY}`);
    host.dataset.handoff=distance<beats.assembledEnd?'assembled':distance<beats.openingEnd?'opening':distance<beats.holdEnd?'assembly':distance<beats.retractEnd?'retract':distance<beats.phoneEnd?'depart':'phone';
    host.dataset.scrollProgress=progress.toFixed(4);host.dataset.scrollDistance=distance.toFixed(4);leaders();
  }
  function schedule(){if(!frame&&visible)frame=requestAnimationFrame(measure);}
  async function load(){
    if(viewer||loading)return;loading=true;
    try{const module=await import('./hardware-product-story.js?v=4b44caee421a8c11');viewer=await module.createProductStory(host);
      viewer.setStoryProgress(reduced.matches?1:phase(distance,beats.assembledEnd,beats.openingEnd),0);
      viewer.ready.then(result=>{if(result.loaded!==8)host.classList.add('is-unavailable');anchors=viewer.getAnchors();schedule();});
    }catch(error){host.classList.add('is-unavailable');schedule();}finally{loading=false;}
  }
  function request(key,trigger){key=key==='cellculture'?'optics':key;document.dispatchEvent(new CustomEvent('hardware:topic',{detail:{key,trigger}}));}
  host.addEventListener('productrender',e=>{anchors=e.detail.anchors||anchors;leaders();});
  host.addEventListener('productselect',e=>{if(['pointer','keyboard'].includes(e.detail?.source))request(e.detail.key,host.querySelector('canvas'));});
  callouts.forEach(a=>{
    a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey)return;e.preventDefault();request(a.dataset.productKey,a);});
    a.addEventListener('pointerenter',()=>viewer?.highlight(a.dataset.productKey));a.addEventListener('pointerleave',()=>viewer?.highlight(null));
    a.addEventListener('focus',()=>viewer?.highlight(a.dataset.productKey));a.addEventListener('blur',()=>viewer?.highlight(null));
  });
  // The reader controller owns the one entrance/exit transition for all topics.
  window.AeroSenseHardwareStory={
    focus(key){focusing=true;host.classList.add('is-focusing');viewer?.highlight(key);},
    restore(){focusing=false;host.classList.remove('is-focusing');viewer?.highlight(null);schedule();},
    getDiagnostics(){const height=reduced.matches?host.offsetHeight/2:host.offsetHeight;return {...viewer?.getDiagnostics(),timeline:{progress,distance,beats,stageHeight:height,stickyTop:parseFloat(getComputedStyle(host).top),range:tour.offsetHeight-host.offsetHeight,assemblyHoldStart:beats.labelsEnd/beats.end,assemblyHoldEnd:beats.holdEnd/beats.end,assemblyHoldDistance:(beats.holdEnd-beats.labelsEnd)*height,phoneHoldStart:beats.phoneLabelsEnd/beats.end,phoneHoldDistance:(beats.end-beats.phoneLabelsEnd)*height}};}
  };
  new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible){load();viewer?.resume();schedule();}else{viewer?.pause();cancelAnimationFrame(frame);frame=0;}},{rootMargin:'250px'}).observe(tour);
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',layout,{passive:true});
  const header=document.querySelector('.site-header');if(header)new ResizeObserver(layout).observe(header);
  const jump=document.querySelector('.audit-mobile-jump');if(jump)new ResizeObserver(layout).observe(jump);
  document.fonts?.ready.then(layout);addEventListener('load',layout,{once:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)viewer?.pause();else if(visible){viewer?.resume();schedule();}});
  document.addEventListener('aerosense:languagechange',()=>{viewer?.refreshLabels?.();layout();});
  reduced.addEventListener('change',()=>{layout();schedule();});layout();load();
})();
