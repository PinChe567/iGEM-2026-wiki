/* DBTLR uses the same native sticky / scroll-progress structure as the home film.
   Automatic scrolling only selects content. It never moves or locks the page. */
(() => {
  'use strict';
  const stages=['design','build','test','learn','redesign'];
  const logic={
    position(distance,step,count) {
      const index=Math.max(0,Math.min(count*5-1,Math.floor(distance/step)));
      return {index,cycle:Math.floor(index/5),stage:index%5};
    },
    target(start,step,index,count) {
      return start+(Math.max(0,Math.min(count*5-1,index))+.2)*step;
    },
    next(cycle,stage,direction,count) {
      const index=cycle*5+stage+direction;
      return index<0||index>=count*5?null:{cycle:Math.floor(index/5),stage:index%5};
    }
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=logic;
  if(typeof document==='undefined')return;

  function init() {
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0,rendering=false;
    const initialTarget=hashTarget();
    let initialPending=!!initialTarget?.closest('[data-cycle-panel]');
    const readers=[...document.querySelectorAll('[data-cycle-viewer]')].map(track=>({
      track,panels:[...track.querySelectorAll('[data-cycle-panel]')],enabled:false,step:440,travel:0,manualExit:false
    }));
    const current=reader=>reader.panels.find(panel=>!panel.hidden);
    const bodyOf=panel=>panel?.querySelector('.has-meshed-gears');
    const runwayOf=panel=>panel?.querySelector('.eng-reader-runway');
    const noteOf=panel=>panel?.querySelector('[data-eng-stage]:not([hidden])');
    const stageOf=panel=>Math.max(0,stages.indexOf(bodyOf(panel)?.dataset.activeStage||'design'));
    const indexOf=reader=>reader.panels.indexOf(current(reader))*5+stageOf(current(reader));
    const headerHeight=()=>document.querySelector('.site-header')?.getBoundingClientRect().height||0;
    function anchor(reader) {
      return Math.ceil(headerHeight()+(reader.track.querySelector('.eng-cycle-tabs')?.getBoundingClientRect().height||0)+28);
    }
    function startOf(reader) {
      const rect=runwayOf(current(reader)).getBoundingClientRect();
      return scrollY+rect.top-reader.top;
    }
    function equalizeHeaders(reader) {
      const panel=current(reader),head=panel?.querySelector('.eng-cycle__head');
      if(!head)return;
      const width=head.getBoundingClientRect().width;if(!width)return;
      let height=0;
      reader.panels.forEach(item=>{
        const original=item.querySelector('.eng-cycle__head');if(!original)return;
        const copy=original.cloneNode(true);
        copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
        Object.assign(copy.style,{position:'absolute',visibility:'hidden',pointerEvents:'none',width:width+'px',minHeight:'0',height:'auto'});
        panel.append(copy);height=Math.max(height,copy.getBoundingClientRect().height);copy.remove();
      });
      reader.track.style.setProperty('--eng-guide-head-height',Math.ceil(height)+'px');
    }
    function measure(reader) {
      reader.top=anchor(reader);
      reader.enabled=!reduced.matches&&innerHeight-reader.top>=390;
      reader.track.classList.toggle('has-guide-layout',reader.enabled);
      reader.track.classList.toggle('has-scroll-story',reader.enabled);
      reader.track.classList.remove('is-guided');
      if(reader.enabled){
        reader.step=Math.max(360,Math.min(520,Math.round(innerHeight*.65)));
        reader.travel=reader.panels.length*5*reader.step;
        const height=innerHeight-reader.top-16;
        reader.track.style.setProperty('--eng-guide-height',height+'px');
        reader.track.style.setProperty('--eng-sticky-top',reader.top+'px');
        reader.track.style.setProperty('--eng-runway-height',(height+reader.travel)+'px');
        equalizeHeaders(reader);
      }
      reader.panels.forEach(panel=>writeControls(reader,panel));
    }
    function writeControls(reader,panel) {
      const controls=bodyOf(panel)?.querySelector('.eng-guide-controls');if(!controls)return;
      const cycle=reader.panels.indexOf(panel),stage=stageOf(panel);
      const label=reader.track.querySelector('.eng-track-label')?.textContent||'Engineering';
      controls.querySelector('[data-guide-status]').textContent=`${label} · Cycle ${cycle+1} / ${reader.panels.length} · ${stages[stage][0].toUpperCase()+stages[stage].slice(1)}`;
      controls.querySelector('[data-guide-prev]').disabled=cycle===0&&stage===0;
      controls.querySelector('[data-guide-next]').textContent=stage<4?'Next step →':cycle<reader.panels.length-1?'Next cycle →':'Continue reading ↓';
      controls.querySelector('[data-guide-hint]').textContent=reader.enabled
        ?'Scroll to turn the gears and move through the cycles. Scroll up to revisit.'
        :'Choose a gear, or use Previous and Next to explore the cycles.';
    }
    function render(reader,index) {
      const old=current(reader),oldIndex=indexOf(reader);
      if(oldIndex===index)return;
      const position=logic.position(index,1,reader.panels.length),panel=reader.panels[position.cycle];
      const hadFocus=old?.contains(document.activeElement);
      rendering=true;
      try {
        if(panel!==old)reader.track.querySelector(`[data-cycle-tab="${panel.dataset.cyclePanel}"]`)?.click();
        panel.querySelector(`[data-gear="${position.stage}"]`)?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
        const note=noteOf(panel);if(note)note.scrollTop=index>oldIndex?0:note.scrollHeight;
        writeControls(reader,panel);
        if(panel!==old&&hadFocus)bodyOf(panel).querySelector('[data-guide-next]')?.focus({preventScroll:true});
      } finally {rendering=false;}
    }
    function update() {
      frame=0;
      if(initialPending)return;
      readers.forEach(reader=>{
        if(!reader.enabled)return;
        const rect=runwayOf(current(reader)).getBoundingClientRect();
        const distance=reader.top-rect.top;
        const inside=distance>=0&&distance<=reader.travel;
        const previous=reader.lastDistance;reader.lastDistance=distance;
        reader.track.classList.toggle('is-guided',inside);
        if(reader.manualExit){
          if(!inside)reader.manualExit='outside';
          if(inside&&reader.manualExit==='outside')reader.manualExit=false;
          else return;
        }
        // The browser pins the picture even before this frame runs. This path
        // has no scrollTo, scrollBy, preventDefault, root lock or snap-back.
        const crossedEnd=previous!==undefined&&((distance>reader.travel&&previous<=reader.travel)||(distance<0&&previous>=0));
        if(inside||crossedEnd){
          render(reader,logic.position(distance,reader.step,reader.panels.length).index);
        }
      });
    }
    function schedule() {if(!frame)frame=requestAnimationFrame(update);}
    function moveTo(element,focus=false) {
      if(!element)return;
      window.scrollTo({top:Math.max(0,scrollY+element.getBoundingClientRect().top-headerHeight()-24),behavior:reduced.matches?'instant':'smooth'});
      if(focus){if(!element.hasAttribute('tabindex'))element.setAttribute('tabindex','-1');element.focus({preventScroll:true});}
    }
    // Seeking belongs only to an explicit navigation control. Wheel, touch,
    // keyboard scrolling and re-entry follow the document's native position.
    function seek(reader,index,focusNext=false) {
      reader.manualExit=false;
      render(reader,index);
      if(reader.enabled){
        window.scrollTo({top:Math.max(0,logic.target(startOf(reader),reader.step,index,reader.panels.length)),behavior:'instant'});
      }
      if(focusNext)bodyOf(current(reader)).querySelector('[data-guide-next]')?.focus({preventScroll:true});
      schedule();
    }
    function decision(reader) {
      reader.manualExit=true;
      moveTo(current(reader).querySelector('.eng-cycle__footer'),true);
    }
    function advance(reader,direction) {
      const index=indexOf(reader)+direction;
      if(index<0)return;
      if(index>=reader.panels.length*5){decision(reader);return;}
      seek(reader,index,true);
    }
    readers.forEach(reader=>{
      reader.panels.forEach(panel=>{
        const body=bodyOf(panel);if(!body)return;
        const runway=document.createElement('div');runway.className='eng-reader-runway';
        body.before(runway);runway.append(body);
        const controls=document.createElement('div');controls.className='eng-guide-controls';
        controls.innerHTML='<p class="eng-guide-controls__status" data-guide-status></p><p class="eng-guide-controls__hint" data-guide-hint></p><div class="eng-guide-controls__actions"><button type="button" data-guide-prev>← Previous</button><button type="button" data-guide-next>Next step →</button><button type="button" class="eng-guide-controls__skip" data-guide-skip>Skip cycles ↓</button></div><button type="button" class="eng-guide-controls__evidence" data-guide-evidence>Read this cycle’s decision &amp; figures ↓</button>';
        body.prepend(controls);
        panel.querySelectorAll('[data-eng-stage]').forEach(note=>{note.tabIndex=0;note.setAttribute('aria-label',note.querySelector('h5')?.textContent||'Engineering stage');});
        controls.querySelector('[data-guide-prev]').addEventListener('click',()=>advance(reader,-1));
        controls.querySelector('[data-guide-next]').addEventListener('click',()=>advance(reader,1));
        controls.querySelector('[data-guide-skip]').addEventListener('click',()=>{
          reader.manualExit=true;
          moveTo(reader.track.querySelector('.eng-summary')||reader.track.nextElementSibling||panel.querySelector('.eng-cycle__footer'),true);
        });
        controls.querySelector('[data-guide-evidence]').addEventListener('click',()=>decision(reader));
      });
      reader.track.addEventListener('eng:cycle-change',event=>{
        const panel=current(reader);writeControls(reader,panel);
        if(!rendering&&event.detail?.source==='user')seek(reader,reader.panels.indexOf(panel)*5);
      });
      reader.track.addEventListener('eng:stage-change',event=>{
        const panel=event.target.closest('[data-cycle-panel]');writeControls(reader,panel);
        if(!rendering&&event.detail?.source==='user')seek(reader,reader.panels.indexOf(panel)*5+stageOf(panel));
      });
      measure(reader);
    });
    function hashTarget() {
      try{return document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch(_){return null;}
    }
    function openTarget(target) {
      const panel=target?.closest('[data-cycle-panel]');if(!panel)return;
      const reader=readers.find(item=>item.panels.includes(panel));if(!reader)return;
      const stage=target.closest('[data-eng-stage]');
      if(target===panel||stage){
        seek(reader,reader.panels.indexOf(panel)*5+(stage?stages.indexOf(stage.dataset.engStage):0));
        if(!reader.enabled)moveTo(stage||bodyOf(panel));
      }
      else {reader.manualExit=true;moveTo(target);}
      return true;
    }
    document.addEventListener('eng:navigate',event=>{
      const target=event.detail?.target;
      if(!target?.closest('[data-cycle-panel]'))return;
      initialPending=false;
      if(openTarget(target))event.preventDefault();
    });
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',()=>{readers.forEach(measure);schedule();});
    reduced.addEventListener('change',()=>{readers.forEach(measure);schedule();});
    let loaded=document.readyState==='complete',fontsReady=!document.fonts?.ready,initialQueued=false;
    function finishInitialNavigation(){
      if(!loaded||!fontsReady||initialQueued)return;
      initialQueued=true;
      requestAnimationFrame(()=>{
        readers.forEach(measure);
        if(initialPending){initialPending=false;openTarget(initialTarget);}
        schedule();
      });
    }
    if(!loaded)window.addEventListener('load',()=>{loaded=true;finishInitialNavigation();},{once:true});
    if(document.fonts?.ready)document.fonts.ready.then(()=>{
      fontsReady=true;readers.forEach(equalizeHeaders);finishInitialNavigation();schedule();
    });
    finishInitialNavigation();
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
