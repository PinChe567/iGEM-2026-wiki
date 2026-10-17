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
    },
    timeline(overflows,lead=200,tail=200) {
      let end=0;
      return overflows.map(overflow=>{
        const item={start:end,lead,overflow:Math.max(0,overflow),tail};
        item.end=end+lead+item.overflow+tail;end=item.end;return item;
      });
    },
    reading(distance,timeline) {
      let index=timeline.findIndex(item=>distance<item.end);
      if(index<0)index=timeline.length-1;
      const item=timeline[index];
      return {index,offset:Math.max(0,Math.min(item.overflow,distance-item.start-item.lead))};
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
    const current=reader=>reader.panels.find(panel=>panel.classList.contains('is-active'))||reader.panels.find(panel=>!panel.hidden);
    const bodyOf=panel=>panel?.querySelector('.has-meshed-gears');
    const runwayOf=panel=>panel?.querySelector('.eng-reader-runway');
    const noteOf=panel=>panel?.querySelector('[data-eng-stage]:not([hidden])');
    const stageOf=panel=>Math.max(0,stages.indexOf(bodyOf(panel)?.dataset.activeStage||'design'));
    const indexOf=reader=>reader.panels.indexOf(current(reader))*5+stageOf(current(reader));
    const headerHeight=()=>{
      if(window.AeroSenseToc)return window.AeroSenseToc.offset()-24;
      const header=document.querySelector('.site-header')?.getBoundingClientRect().height||0;
      const toc=innerWidth<1100?(document.querySelector('.audit-mobile-jump')?.getBoundingClientRect().height||0):0;
      return header+toc;
    };
    function anchor(reader) {
      return Math.ceil(headerHeight()+(reader.track.querySelector('.eng-cycle-tabs')?.getBoundingClientRect().height||0)+28);
    }
    function bottomInset(reader) {
      const control=document.querySelector('.eng-reading-mode');
      if(!control||getComputedStyle(control).position!=='fixed')return 16;
      const rect=control.getBoundingClientRect(),track=reader.track.getBoundingClientRect();
      // On narrow layouts the reading-mode control sits over the article.
      // Keep the entire pinned note above it; desktop sidebar controls do not
      // reduce the reading area when they sit outside the article's width.
      if(!rect.width||!rect.height||rect.right<=track.left||rect.left>=track.right||rect.top>=innerHeight)return 16;
      return Math.max(16,Math.ceil(innerHeight-rect.top+12));
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
        const copy=window.AeroSenseI18n?.cloneSource(original)||original.cloneNode(true);
        copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
        Object.assign(copy.style,{position:'absolute',visibility:'hidden',pointerEvents:'none',width:width+'px',minHeight:'0',height:'auto'});
        panel.append(copy);height=Math.max(height,copy.getBoundingClientRect().height);copy.remove();
      });
      reader.track.style.setProperty('--eng-guide-head-height',Math.ceil(height)+'px');
    }
    function measure(reader) {
      reader.top=anchor(reader);
      reader.track.style.setProperty('--eng-cycle-top',(headerHeight()+8)+'px');
      const availableHeight=innerHeight-reader.top-bottomInset(reader);
      // Pin the reader when enough space is available. Short viewports and
      // reduced-motion users retain the complete, manually selected text.
      reader.enabled=!document.documentElement.classList.contains('eng-reading-plain')&&reader.track.dataset.readingMode!=='manual'&&!reduced.matches&&availableHeight>=374;
      reader.track.classList.toggle('has-guide-layout',reader.enabled);
      reader.track.classList.toggle('has-scroll-story',reader.enabled);
      reader.track.classList.remove('is-guided');
      if(reader.enabled){
        reader.step=Math.max(360,Math.min(520,Math.round(innerHeight*.65)));
        reader.travel=reader.panels.length*5*reader.step;
        const height=availableHeight;
        reader.track.style.setProperty('--eng-guide-height',height+'px');
        reader.track.style.setProperty('--eng-sticky-top',reader.top+'px');
        reader.track.style.setProperty('--eng-runway-height',(height+reader.travel)+'px');
        equalizeHeaders(reader);
        if(reader.track.dataset.readingMode==='scroll')measureTimeline(reader,height);
      }
      reader.panels.forEach(panel=>writeControls(reader,panel));
    }
    function measureTimeline(reader,height) {
      const body=bodyOf(current(reader)),note=noteOf(current(reader));
      if(!body||!note)return;
      const rect=body.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const overflows=[];
      reader.panels.forEach((panel,cycle)=>{
        // The control row can wrap differently for "Next step" and "Continue
        // reading", especially on phones. Measure the complete reader grid
        // for each stage, not every note at the current stage's fixed height.
        const source=bodyOf(panel),copy=window.AeroSenseI18n?.cloneSource(source)||source.cloneNode(true);
        copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
        copy.setAttribute('aria-hidden','true');copy.inert=true;
        Object.assign(copy.style,{visibility:'hidden',pointerEvents:'none',width:rect.width+'px',height:height+'px',minHeight:'0',top:'0',left:'0',boxSizing:'border-box'});
        copy.style.setProperty('position','absolute','important');
        runwayOf(current(reader)).append(copy);
        const notes=[...copy.querySelectorAll('[data-eng-stage]')];
        try {
          notes.forEach((measured,stage)=>{
            notes.forEach(item=>{item.hidden=item!==measured;});
            copy.dataset.activeStage=stages[stage];
            const gearLabel=copy.querySelector('.eng-gears__current');
            if(gearLabel)gearLabel.textContent=`${stages[stage][0].toUpperCase()+stages[stage].slice(1)} · ${stage+1} / 5`;
            writeControlLabels(reader,copy,cycle,stage);
            overflows.push(Math.ceil(Math.max(0,measured.scrollHeight-measured.clientHeight)));
          });
        } finally {copy.remove();}
      });
      reader.timeline=logic.timeline(overflows,Math.max(180,Math.min(240,Math.round(height*.35))),200);
      reader.travel=reader.timeline.at(-1).end;
      reader.track.style.setProperty('--eng-runway-height',(height+reader.travel)+'px');
      // Keep the context before every iteration the same height so changing
      // cycles does not move the native scroll origin underneath the reader.
      const context=current(reader).querySelector('.eng-cycle-context');
      if(context){
        let maximum=0;
        const width=context.getBoundingClientRect().width;
        reader.panels.forEach(panel=>{
          const original=panel.querySelector('.eng-cycle-context');if(!original)return;
          const copy=window.AeroSenseI18n?.cloneSource(original)||original.cloneNode(true);
          Object.assign(copy.style,{position:'absolute',visibility:'hidden',width:width+'px',height:'auto',minHeight:'0'});
          current(reader).append(copy);maximum=Math.max(maximum,copy.getBoundingClientRect().height);copy.remove();
        });
        reader.track.style.setProperty('--eng-context-height',Math.ceil(maximum)+'px');
      }
      // A small DOM record supports inspection and retained deep-link positions.
      reader.track.dataset.readingDistances=JSON.stringify(reader.timeline);
    }
    function writeControls(reader,panel) {
      writeControlLabels(reader,bodyOf(panel),reader.panels.indexOf(panel),stageOf(panel));
    }
    function writeControlLabels(reader,body,cycle,stage) {
      const controls=body?.querySelector('.eng-guide-controls');if(!controls)return;
      const labelNode=reader.track.querySelector('.eng-track-label');
      const label=(labelNode&&(window.AeroSenseI18n?.sourceText(labelNode)||labelNode.textContent))||'Engineering';
      controls.querySelector('[data-guide-status]').textContent=`${label} · Cycle ${cycle+1} / ${reader.panels.length} · ${stages[stage][0].toUpperCase()+stages[stage].slice(1)}`;
      controls.querySelector('[data-guide-prev]').disabled=cycle===0&&stage===0;
      controls.querySelector('[data-guide-next]').textContent=stage<4?'Next step →':cycle<reader.panels.length-1?'Next cycle →':'Continue reading ↓';
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
        reader.track.dataset.readingPosition=String(Math.round(distance));
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
          const position=reader.timeline?logic.reading(distance,reader.timeline):logic.position(distance,reader.step,reader.panels.length);
          render(reader,position.index);
          if(reader.timeline){const note=noteOf(current(reader));if(note)note.scrollTop=position.offset;}
        }
      });
    }
    function schedule() {if(!frame)frame=requestAnimationFrame(update);}
    function moveTo(element,focus=false) {
      if(!element)return;
      readers.forEach(reader=>{reader.lastDistance=undefined;});
      window.scrollTo({top:Math.max(0,scrollY+element.getBoundingClientRect().top-headerHeight()-24),behavior:'instant'});
      if(focus){if(!element.hasAttribute('tabindex'))element.setAttribute('tabindex','-1');element.focus({preventScroll:true});}
    }
    // Seeking belongs only to an explicit navigation control. Wheel, touch,
    // keyboard scrolling and re-entry follow the document's native position.
    function seek(reader,index,focusNext=false) {
      readers.forEach(item=>{item.lastDistance=undefined;});
      reader.manualExit=false;
      render(reader,index);
      if(reader.enabled){
        const entry=reader.timeline?.[index];
        const target=entry?startOf(reader)+entry.start+Math.min(40,entry.lead*.2):logic.target(startOf(reader),reader.step,index,reader.panels.length);
        window.scrollTo({top:Math.max(0,target),behavior:'instant'});
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
        controls.innerHTML='<p class="eng-guide-controls__status" data-guide-status></p><div class="eng-guide-controls__actions"><button type="button" data-guide-prev>← Previous</button><button type="button" data-guide-next>Next step →</button><button type="button" class="eng-guide-controls__skip" data-guide-skip>Skip cycles ↓</button></div>';
        body.prepend(controls);
        panel.querySelectorAll('[data-eng-stage]').forEach(note=>{const heading=note.querySelector('h5');note.tabIndex=0;note.setAttribute('aria-label',(heading&&(window.AeroSenseI18n?.sourceText(heading)||heading.textContent))||'Engineering stage');});
        controls.querySelector('[data-guide-prev]').addEventListener('click',()=>advance(reader,-1));
        controls.querySelector('[data-guide-next]').addEventListener('click',()=>advance(reader,1));
        controls.querySelector('[data-guide-skip]').addEventListener('click',()=>{
          reader.manualExit=true;
          moveTo(reader.track.querySelector('.eng-summary')||reader.track.nextElementSibling||panel.querySelector('.eng-cycle__footer'),true);
        });
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
      if(document.documentElement.classList.contains('eng-reading-plain')){moveTo(target,true);return true;}
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
    document.addEventListener('aerosense:before-anchor',event=>{
      const target=event.detail?.target;
      if(!target||target.closest('[data-cycle-panel]'))return;
      // A chapter jump must not traverse the intermediate cycle runways: their
      // different decision/footer heights would move the destination en route.
      initialPending=false;
      readers.forEach(reader=>{reader.lastDistance=undefined;reader.manualExit=false;});
      schedule();
    });
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',()=>{readers.forEach(measure);schedule();});
    reduced.addEventListener('change',()=>{readers.forEach(measure);schedule();});
    const readingToggle=document.querySelector('[data-eng-reading-toggle]');
    function setPlainReading(plain,persist=false) {
      const focused=document.activeElement;
      document.documentElement.classList.toggle('eng-reading-plain',plain);
      readers.forEach(reader=>{
        const active=current(reader);
        reader.manualExit=false;
        reader.lastDistance=undefined;
        reader.panels.forEach(panel=>{
          panel.hidden=!plain&&panel!==active;
          panel.querySelectorAll('[data-eng-stage]').forEach(note=>{
            note.hidden=!plain&&note.dataset.engStage!==bodyOf(panel)?.dataset.activeStage;
            note.scrollTop=0;
          });
        });
        measure(reader);
      });
      readingToggle?.setAttribute('aria-pressed',String(plain));
      if(readingToggle){
        readingToggle.textContent=plain?'Guided view':'Expand all';
        readingToggle.setAttribute('aria-label',plain?'Return to guided engineering reading':'Expand all engineering cycles and stages');
      }
      document.querySelectorAll('[data-eng-receptor-record]').forEach(detail=>{detail.open=plain;});
      if(persist){try{localStorage.setItem('aerosense-engineering-reading',plain?'plain':'guided');}catch(_){} }
      if(focused===readingToggle)readingToggle.focus({preventScroll:true});
      schedule();
    }
    let preferred='';try{preferred=localStorage.getItem('aerosense-engineering-reading')||'';}catch(_){}
    setPlainReading(preferred==='plain');
    readingToggle?.addEventListener('click',()=>setPlainReading(!document.documentElement.classList.contains('eng-reading-plain'),true));
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
