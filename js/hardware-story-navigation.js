/* Native sticky scene: one reversible scroll timeline, with no scroll correction. */
(() => {
  const route=document.querySelector('.hw-product-route');if(!route)return;
  const tour=route.querySelector('.hw-product-tour'),host=route.querySelector('[data-hardware-product-story]');
  const model=host.querySelector('.hw-product-model'),labels=host.querySelector('.hw-product-label-layer');
  const phone=host.querySelector('.hw-product-phone'),downlink=host.querySelector('.hw-product-downlink path');
  const networkPackets=[...host.querySelectorAll('.hw-network-packet')],networkBadge=host.querySelector('.hw-wireless-badge');
  const phoneLabels=host.querySelector('.hw-phone-label-layer'),phoneCallouts=[...host.querySelectorAll('[data-phone-callout]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),callouts=[...host.querySelectorAll('[data-product-callout]')];
  // These nodes and properties belong to this timeline. Avoid rewriting the
  // same values during holds and collect leader rectangles before SVG updates.
  const styleValues=new WeakMap(),attributeValues=new WeakMap();
  function setStyle(node,name,value){
    if(!node)return;const text=String(value);let values=styleValues.get(node);
    if(!values){values=new Map();styleValues.set(node,values);}if(values.get(name)===text)return;
    node.style.setProperty(name,text);values.set(name,text);
  }
  function setAttribute(node,name,value){
    if(!node)return;const text=String(value);let values=attributeValues.get(node);
    if(!values){values=new Map();attributeValues.set(node,values);}if(values.get(name)===text)return;
    node.setAttribute(name,text);values.set(name,text);
  }
  function setInert(node,value){if(node.inert!==value)node.inert=value;}
  const productLeaderNodes=new Map([...labels.querySelectorAll('[data-leader-for]')].map(group=>[group.dataset.leaderFor,{path:group.querySelector('path'),circle:group.querySelector('circle')} ]));
  const productLabels=callouts.map(node=>({node,left:node.dataset.side==='left',keys:(node.dataset.productAnchors||node.dataset.productCallout).split(/\s+/)}));
  const phoneLabelNodes=phoneCallouts.map(node=>{const group=phoneLabels.querySelector('[data-phone-leader="'+node.dataset.phoneCallout+'"]');return {node,group,left:node.dataset.side==='left',path:group?.querySelector('path'),circle:group?.querySelector('circle')};});
  const phoneScreen=phone.querySelector('img');
  const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10);};
  // All beats use physical stage-height distances. The fully revealed labels
  // hold for two thirds of the previous distance; all later beats move together.
  const holdEnd=1.20+2*(2/3);
  const beats=Object.freeze({assembledEnd:.18,openingEnd:1.05,labelsStart:1,labelsEnd:1.20,holdEnd,retractEnd:holdEnd+.25,lineEnd:holdEnd+.60,exitStart:holdEnd+.45,exitEnd:holdEnd+1.20,phoneStart:holdEnd+.70,phoneEnd:holdEnd+1.35,phoneLabelsStart:holdEnd+1.15,phoneLabelsEnd:holdEnd+1.50,end:holdEnd+2.65});
  const phase=(distance,start,end)=>clamp((distance-start)/(end-start));
  setStyle(route,'--product-scroll-distance',beats.end);
  let viewer,loading=false,visible=false,stageVisible=false,frame=0,anchors={},focusing=false,progress=0,distance=0;
  function motionState(){host.classList.toggle('is-motion-active',stageVisible&&!document.hidden&&!reduced.matches);}
  function layout(){
    const rect=route.getBoundingClientRect(),toc=document.querySelector('.page-toc'),tr=toc?.getBoundingClientRect();
    const wide=innerWidth>=1100&&toc&&getComputedStyle(toc).display!=='none'&&tr.width>100;
    const left=wide?Math.max(0,rect.left-tr.right-10):Math.max(0,rect.left),right=Math.max(0,innerWidth-rect.right);
    const header=document.querySelector('.site-header')?.getBoundingClientRect().height||72;
    const jump=document.querySelector('.audit-mobile-jump');const extra=jump&&getComputedStyle(jump).display!=='none'?jump.getBoundingClientRect().height:0;
    setStyle(host,'--product-left-outset',left+'px');setStyle(host,'--product-right-outset',right+'px');
    setStyle(route,'--product-top',(header+extra)+'px');setStyle(host,'--product-top',(header+extra)+'px');
    setStyle(document.documentElement,'--hw-reader-top',(header+extra)+'px');
    setStyle(document.documentElement,'--hw-reader-left',wide?(tr.right+10)+'px':'0px');schedule();
  }
  function readLeaderGeometry(){
    const rect=model.getBoundingClientRect();if(!rect.width||!rect.height)return null;
    const product=productLabels.map(label=>({...label,rect:label.node.getBoundingClientRect()}));
    let mobile=null;
    if(phoneLabels&&(reduced.matches||distance>=beats.phoneStart)){
      const area=phoneLabels.getBoundingClientRect(),screen=phoneScreen.getBoundingClientRect();
      if(area.width&&area.height)mobile={area,screen,labels:phoneLabelNodes.map(label=>({...label,rect:label.node.getBoundingClientRect()}))};
    }
    return {rect,product,mobile};
  }
  function writeLeaders(geometry){
    if(!geometry)return;const {rect,product,mobile}=geometry;
    for(const label of product){
      const ar=label.rect,left=label.left;
      const lx=((left?ar.right+7:ar.left-7)-rect.left)/rect.width*1000,ly=(ar.top+ar.height/2-rect.top)/rect.height*1000;
      for(const key of label.keys){
        const point=anchors[key],nodes=productLeaderNodes.get(key);if(!point||!nodes)continue;
        const ax=point.x*1000,ay=point.y*1000,elbow=lx+(left?26:-26);
        setAttribute(nodes.path,'d',`M${ax.toFixed(2)} ${ay.toFixed(2)} L${elbow.toFixed(2)} ${ly.toFixed(2)} L${lx.toFixed(2)} ${ly.toFixed(2)}`);
        setAttribute(nodes.circle,'cx',ax);setAttribute(nodes.circle,'cy',ay);
      }
    }
    if(!mobile)return;
    const {area,screen}=mobile;
    for(const label of mobile.labels){
      if(!label.group)continue;const a=label.node,ar=label.rect,left=label.left;
      const ax=(screen.left+screen.width*Number(a.dataset.anchorX)-area.left)/area.width*1000,ay=(screen.top+screen.height*Number(a.dataset.anchorY)-area.top)/area.height*1000;
      const lx=((left?ar.right+5:ar.left-5)-area.left)/area.width*1000,ly=(ar.top+ar.height/2-area.top)/area.height*1000;
      setAttribute(label.path,'d',`M${ax} ${ay} L${lx+(left?18:-18)} ${ly} L${lx} ${ly}`);
      setAttribute(label.circle,'cx',ax);setAttribute(label.circle,'cy',ay);
    }
  }
  function leaders(){writeLeaders(readLeaderGeometry());}
  function measure(){
    frame=0;if(!visible||focusing)return;
    const rect=tour.getBoundingClientRect(),height=host.offsetHeight,top=parseFloat(getComputedStyle(host).top)||72;
    distance=reduced.matches?0:Math.max(0,Math.min(beats.end,(top-rect.top)/Math.max(1,height)));
    progress=distance/beats.end;
    const opening=reduced.matches?1:phase(distance,beats.assembledEnd,beats.openingEnd),entrance=reduced.matches?1:smooth(phase(distance,beats.labelsStart,beats.labelsEnd));
    const retract=smooth(phase(distance,beats.holdEnd,beats.retractEnd)),line=smooth(phase(distance,beats.retractEnd,beats.lineEnd)),exit=smooth(phase(distance,beats.exitStart,beats.exitEnd)),enter=smooth(phase(distance,beats.phoneStart,beats.phoneEnd));
    viewer?.setStoryProgress(opening,exit);
    setStyle(host,'--label-retract',Math.max(retract,1-entrance));setStyle(host,'--label-opacity',(1-retract)*entrance);
    setStyle(host,'--product-exit',(-height*1.25*exit)+'px');setStyle(host,'--phone-enter',((1-enter)*height*.96)+'px');
    setStyle(host,'--phone-tilt',(-7+8*enter)+'deg');setStyle(host,'--phone-depth',((1-enter)*12)+'deg');setStyle(host,'--phone-yaw',(-16+10*enter)+'deg');setStyle(host,'--phone-scale',.91+.09*enter);
    setStyle(host,'--phone-opacity',distance>=beats.phoneStart?1:0);
    const connectionIn=smooth(phase(distance,beats.retractEnd,beats.retractEnd+.14)),connectionOut=smooth(phase(distance,beats.phoneEnd-.05,beats.phoneLabelsEnd));
    const connectionOpacity=connectionIn*(1-connectionOut);
    setStyle(host,'--connection-opacity',connectionOpacity);
    setStyle(host,'--network-opacity',reduced.matches?1:connectionIn);
    host.classList.toggle('is-network-active',reduced.matches||connectionIn>0);
    host.classList.toggle('is-connection-active',!reduced.matches&&connectionOpacity>.001);
    setAttribute(networkBadge,'aria-hidden',String(!reduced.matches&&connectionIn===0));
    setInert(labels,retract>.02||entrance<.95);setAttribute(labels,'aria-hidden',String(retract>.98||entrance<.01));
    const phoneActive=reduced.matches||enter>.98;phone.classList.toggle('is-visible',phoneActive);if(phone.tabIndex!==(phoneActive?0:-1))phone.tabIndex=phoneActive?0:-1;
    const phoneLabelProgress=reduced.matches?1:smooth(phase(distance,beats.phoneLabelsStart,beats.phoneLabelsEnd));setStyle(host,'--phone-label-progress',phoneLabelProgress);
    setInert(phoneLabels,phoneLabelProgress<.95);setAttribute(phoneLabels,'aria-hidden',String(phoneLabelProgress<.01));
    phoneLabelNodes.forEach((label,i)=>{const item=reduced.matches?1:smooth(phase(distance,beats.phoneLabelsStart+i*.045,beats.phoneLabelsEnd));setStyle(label.node,'--phone-item-progress',item);setStyle(label.group,'--phone-item-progress',item);});
    const phoneRect=phone.getBoundingClientRect(),hostRect=host.getBoundingClientRect();
    const phoneWidth=phone.offsetWidth,phoneHeight=phone.offsetHeight,hostWidth=host.offsetWidth,leaderGeometry=readLeaderGeometry();
    const base=anchors.base||{x:.36,y:.88},startY=base.y*1000-exit*1250;
    // Finish beneath the transformed bezel so the wire meets the moving phone.
    const phoneTop=(phoneRect.top-hostRect.top+Math.min(40,phoneRect.width*.12))/height*1000,endY=startY+Math.max(0,phoneTop-startY)*line;
    const phoneX=(phoneRect.left+phoneRect.width/2-hostRect.left)/hostRect.width*1000;
    const linkPath=`M${base.x*1000} ${startY} C${base.x*1000} ${startY+90} ${phoneX} ${endY-90} ${phoneX} ${endY}`;
    setAttribute(downlink,'d',linkPath);networkPackets.forEach(path=>setAttribute(path,'d',linkPath));
    // The wireless marker follows the handoff, then stays beside the device.
    // It describes the link; it does not report a live connection state.
    const badgeSettle=reduced.matches?1:smooth(phase(distance,beats.phoneStart,beats.phoneEnd));
    const badgeStartX=(base.x*1000+phoneX)/2,badgeStartY=Math.max(120,Math.min(760,(startY+endY)/2));
    const badgeEndX=phoneX+(phoneWidth/2+30)/hostWidth*1000;
    const badgeEndY=(reduced.matches?.75:.5)*1000-phoneHeight/height*500+38/height*1000;
    setStyle(host,'--network-x',(badgeStartX+(badgeEndX-badgeStartX)*badgeSettle)/10+'%');
    setStyle(host,'--network-y',(badgeStartY+(badgeEndY-badgeStartY)*badgeSettle)/10+'%');
    setAttribute(host,'data-handoff',distance<beats.assembledEnd?'assembled':distance<beats.openingEnd?'opening':distance<beats.holdEnd?'assembly':distance<beats.retractEnd?'retract':distance<beats.phoneEnd?'depart':'phone');
    setAttribute(host,'data-scroll-progress',progress.toFixed(4));setAttribute(host,'data-scroll-distance',distance.toFixed(4));writeLeaders(leaderGeometry);
  }
  function schedule(){if(!frame&&visible)frame=requestAnimationFrame(measure);}
  async function load(){
    if(viewer||loading)return;loading=true;
    try{const module=await import('./hardware-product-story.js?v=d88b742f8d208f39');viewer=await module.createProductStory(host);
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
  new IntersectionObserver(entries=>{stageVisible=entries.some(e=>e.isIntersecting);motionState();}).observe(host);
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',layout,{passive:true});
  const header=document.querySelector('.site-header');if(header)new ResizeObserver(layout).observe(header);
  const jump=document.querySelector('.audit-mobile-jump');if(jump)new ResizeObserver(layout).observe(jump);
  document.fonts?.ready.then(layout);addEventListener('load',layout,{once:true});
  document.addEventListener('visibilitychange',()=>{motionState();if(document.hidden)viewer?.pause();else if(visible){viewer?.resume();schedule();}});
  document.addEventListener('aerosense:languagechange',()=>{viewer?.refreshLabels?.();layout();});
  reduced.addEventListener('change',()=>{motionState();layout();schedule();});layout();load();
})();
