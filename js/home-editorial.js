/* One physical research wheel. The menu portal owns the logo-fly handoff. */
(() => {
  'use strict';
  if (!document.body.classList.contains('home-edition-2026')) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=n=>Math.min(1,Math.max(0,n));
  const ease=n=>n*n*(3-2*n);
  let quiet=reduced.matches;
  const story=document.querySelector('[data-research-story]');
  const stage=story?.querySelector('.research-stage');
  const windowEl=story?.querySelector('[data-wheel-window]');
  const wheel=story?.querySelector('[data-research-wheel]');
  const panels=story?[...story.querySelectorAll('.research-stop')]:[];
  const buttons=story?[...story.querySelectorAll('[data-research-go]')]:[];
  const wordmark=document.querySelector('#signal-wordmark');
  const scent=document.querySelector('.home-opening__scent');
  const styleCache=new WeakMap();
  function setStyle(element,property,value){
    if(!element)return;
    let values=styleCache.get(element);
    if(!values){values={};styleCache.set(element,values);}
    if(values[property]===value)return;
    values[property]=value;element.style.setProperty(property,value);
  }
  let cinematic=false,storyTop=72,storyTravel=0,active=-1,queued=false,layoutWidth=0,layoutHeight=0;
  let scene=null,sceneDirty=true,lastWheelAngle=null,lastWheelLabel=null,lastInStory=null;
  function reflect(){document.body.classList.toggle('home-motion-off',quiet);}
  reflect();reduced.addEventListener('change',()=>{quiet=reduced.matches;reflect();measure();});
  document.body.classList.add('home-motion-ready');

  function selectPanel(index){
    if(index===active)return;
    const transferFocus=panels[active]?.contains(document.activeElement);
    active=index;
    panels.forEach((panel,i)=>{panel.classList.toggle('is-active',i===index);panel.inert=i!==index;panel.setAttribute('aria-hidden',String(i!==index));});
    if(transferFocus)panels[index]?.querySelector('a')?.focus({preventScroll:true});
    buttons.forEach((button,i)=>{if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    story.dataset.activePerspective=String(index+1);
  }
  function goToPanel(index){
    if(!panels[index])return;
    if(cinematic){const y=story.getBoundingClientRect().top+scrollY-storyTop+storyTravel*((index+.24)/4);window.scrollTo({top:y,behavior:quiet?'instant':'smooth'});}
    else panels[index].scrollIntoView({behavior:'instant',block:'start'});
  }
  buttons.forEach((button,index)=>{
    button.addEventListener('click',()=>goToPanel(index));
    button.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=Math.min(index+1,3);else if(event.key==='ArrowLeft')next=Math.max(index-1,0);else if(event.key==='Home')next=0;else if(event.key==='End')next=3;else return;event.preventDefault();buttons[next].focus({preventScroll:true});goToPanel(next);});
  });
  function revealHash(){const index=panels.findIndex(p=>'#'+p.id===location.hash);if(index>=0)goToPanel(index);}
  addEventListener('hashchange',revealHash);

  function measure(){
    if(story&&stage&&windowEl&&wheel){
      const previousRect=story.getBoundingClientRect(),previousTop=storyTop,wasCinematic=cinematic,wasBelow=previousRect.bottom<previousTop;
      const oldProgress=cinematic&&storyTravel?((previousTop-previousRect.top)/storyTravel):null;
      const oldHeight=story.style.getPropertyValue('--story-height');
      storyTop=Math.ceil(document.querySelector('.site-header')?.getBoundingClientRect().height||0);
      // Mobile browser chrome resizes the viewport while scrolling. Keep its
      // pacing stable; a substantial desktop resize must still fit the stage.
      const desktopHeightChanged=innerWidth>=760&&Math.abs(innerHeight-layoutHeight)>100;
      if(!layoutHeight||Math.abs(innerWidth-layoutWidth)>2||desktopHeightChanged){layoutWidth=innerWidth;layoutHeight=innerHeight;}
      const height=layoutHeight-storyTop-24;
      // A full-size wheel needs a wide reading surface; small and short screens use the same content linearly.
      cinematic=!quiet&&innerWidth>=760&&height>=500;
      story.classList.toggle('research-story--cinematic',cinematic);
      storyTravel=Math.max(920,height*1.25)*4;
      story.style.setProperty('--story-top',`${storyTop}px`);story.style.setProperty('--story-height',`${height}px`);story.style.setProperty('--story-travel',`${storyTravel}px`);
      if(cinematic){
        const w=windowEl.clientWidth,h=windowEl.clientHeight;
        const radius=Math.max(w*1.04,h*1.9),cx=w+40,cy=h+45;
        const panelWidth=Math.max(500,w-160),panelHeight=Math.max(240,h-18);
        const vx=w*.53-cx,vy=h*.51-cy;
        story.style.setProperty('--wheel-diameter',`${radius*2}px`);story.style.setProperty('--wheel-left',`${cx-radius}px`);story.style.setProperty('--wheel-top',`${cy-radius}px`);
        story.style.setProperty('--wheel-panel-width',`${panelWidth}px`);story.style.setProperty('--wheel-panel-height',`${panelHeight}px`);
        panels.forEach((panel,i)=>{panel.style.transform=`rotate(${i*90}deg) translate(${vx}px,${vy}px)`;});
        if(oldProgress!==null&&oldProgress>=0&&oldProgress<=1&&oldHeight!==`${height}px`)window.scrollTo({top:story.getBoundingClientRect().top+scrollY-storyTop+oldProgress*storyTravel,behavior:'instant'});
      }else{
        const previousActive=active;active=-1;delete story.dataset.activePerspective;delete story.dataset.wheelAngle;
        wheel.style.removeProperty('transform');
        lastWheelAngle=null;lastWheelLabel=null;
        panels.forEach(panel=>{panel.inert=false;panel.removeAttribute('aria-hidden');panel.classList.remove('is-active');panel.style.removeProperty('transform');});buttons.forEach(button=>button.removeAttribute('aria-current'));
        if(wasCinematic&&oldProgress>=0&&oldProgress<=1&&previousActive>=0)panels[previousActive].scrollIntoView({behavior:'instant',block:'start'});
      }
      if(wasBelow){const shift=story.getBoundingClientRect().bottom-previousRect.bottom;if(Math.abs(shift)>1)window.scrollTo({top:scrollY+shift,behavior:'instant'});}
    }
    invalidateScene();
  }
  // Read geometry together, before any frame writes. Scroll/resize/font changes
  // refresh this snapshot; easing between scroll events reuses it without layout.
  function readScene(){
    const snapshot={scroll:scrollY,width:innerWidth,height:innerHeight,story:story?.getBoundingClientRect()};
    if(scent&&!quiet){const rect=scent.getBoundingClientRect();if(rect.bottom>0&&rect.top<snapshot.height)snapshot.scentTop=rect.top;}
    sceneDirty=false;return snapshot;
  }
  function draw(timestamp){
    queued=false;
    if(document.hidden)return;
    if(sceneDirty||!scene)scene=readScene();
    const rect=scene.story;
    const inStory=!!(cinematic&&rect&&rect.top<scene.height*.5&&rect.bottom>scene.height*.5);
    if(inStory!==lastInStory){document.body.classList.toggle('in-research-story',inStory);lastInStory=inStory;}
    let progress=0;
    if(story&&cinematic){
      progress=clamp((storyTop-rect.top)/storyTravel);
      const position=progress*4,slot=Math.min(3,Math.floor(position)),local=position-slot;
      // Rest for reading, then physically turn the common wheel through 90 degrees.
      const turns=slot+(slot<3?ease(clamp((local-.58)/.42)):0);
      const angle=turns*90;
      if(angle!==lastWheelAngle){wheel.style.transform=`rotate(${-angle}deg)`;lastWheelAngle=angle;}
      const label=String(Math.round(angle*100)/100);
      if(label!==lastWheelLabel){story.dataset.wheelAngle=label;lastWheelLabel=label;}
      selectPanel(Math.min(3,Math.round(turns)));
    }
    if(scene.scentTop!==undefined)setStyle(scent,'stroke-dashoffset',(-scene.scentTop*.12).toFixed(2));
  }
  function schedule(){if(!queued&&!document.hidden){queued=true;requestAnimationFrame(draw);}}
  function invalidateScene(){sceneDirty=true;schedule();}
  addEventListener('scroll',invalidateScene,{passive:true});
  document.addEventListener('visibilitychange',invalidateScene);
  // Late-loading media can shift the wheel without a window resize.
  if('ResizeObserver' in window){const geometryObserver=new ResizeObserver(invalidateScene);[story,wordmark].filter(Boolean).forEach(node=>geometryObserver.observe(node));}
  let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(measure,120);});
  addEventListener('load',()=>{measure();revealHash();});document.fonts?.ready.then(measure);
  measure();
})();
