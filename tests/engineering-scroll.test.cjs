const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../js/engineering-scroll.js'),'utf8');
const logic=require('../js/engineering-scroll.js');

test('scroll distance addresses every phase of every cycle in either direction',()=>{
  const step=440,count=3;
  for(const order of [Array.from({length:15},(_,i)=>i),Array.from({length:15},(_,i)=>14-i)]){
    for(const i of order){
      assert.deepEqual(logic.position((i+.5)*step,step,count),{index:i,cycle:Math.floor(i/5),stage:i%5});
    }
  }
  assert.deepEqual(logic.position(-100,step,count),{index:0,cycle:0,stage:0});
  assert.deepEqual(logic.position(99999,step,count),{index:14,cycle:2,stage:4});
});

test('each phase including the final redesign receives a complete reading interval',()=>{
  const step=520;
  for(let i=0;i<15;i++){
    assert.equal(logic.position(i*step,step,3).index,i);
    assert.equal(logic.position((i+1)*step-.01,step,3).index,i);
  }
});

test('explicit navigation lands within the requested phase, away from a rounding boundary',()=>{
  for(const count of [2,3])for(let index=0;index<count*5;index++){
    const start=712.4,step=361,target=logic.target(start,step,index,count);
    assert(target>start+index*step);
    assert(target<start+(index+1)*step);
    assert.equal(logic.position(target-start,step,count).index,index);
  }
  assert.equal(logic.target(100,400,-5,3),180);
  assert.equal(logic.target(100,400,99,3),5780);
});

test('next and previous cross cycle boundaries without wrapping the whole story',()=>{
  assert.deepEqual(logic.next(0,4,1,3),{cycle:1,stage:0});
  assert.deepEqual(logic.next(1,0,-1,3),{cycle:0,stage:4});
  assert.equal(logic.next(0,0,-1,3),null);
  assert.equal(logic.next(2,4,1,3),null);
});

// These mocks exercise navigation/state contracts only. Actual sticky placement,
// smoothness and responsive layout must also be checked in a real browser.
function harness({reducedMotion=false,height=800,trackCount=1,initialHash='',loading=false,fontsLoading=false}={}){
  let y=0,frameId=0;
  const frames=new Map(),scrollCalls=[],listeners=[],globals={},docEvents={};
  const names=['design','build','test','learn','redesign'];
  const fontCallbacks=[];
  const document={readyState:loading?'interactive':'complete',activeElement:null};
  if(fontsLoading)document.fonts={ready:{then(fn){fontCallbacks.push(fn);}}};
  function node(extra={}){
    const el={children:[],parentElement:null,handlers:{},dataset:{},attrs:{},hidden:false,className:'',textContent:'',
      style:{values:{},setProperty(k,v){this.values[k]=v;}},
      classList:{value:new Set(),add(k){this.value.add(k);},remove(k){this.value.delete(k);},contains(k){return this.value.has(k);},toggle(k,on){if(on===undefined)on=!this.value.has(k);if(on)this.value.add(k);else this.value.delete(k);return on;}},
      addEventListener(name,fn,options){(this.handlers[name]??=[]).push(fn);},
      dispatchEvent(event){event.target??=this;for(const fn of this.handlers[event.type]||[])fn(event);if(event.bubbles)this.parentElement?.dispatchEvent(event);return true;},
      append(child){child.remove();this.children.push(child);child.parentElement=this;},
      prepend(child){child.remove();this.children.unshift(child);child.parentElement=this;},
      before(child){const parent=this.parentElement;child.remove();parent.children.splice(parent.children.indexOf(this),0,child);child.parentElement=parent;},
      remove(){if(this.parentElement){const parent=this.parentElement;parent.children.splice(parent.children.indexOf(this),1);this.parentElement=null;}},
      contains(target){return target===this||this.children.some(child=>child.contains(target));},
      focus(options){document.activeElement=this;this.focusOptions=options;},
      setAttribute(k,v){this.attrs[k]=v;},hasAttribute(k){return k in this.attrs;},removeAttribute(k){delete this.attrs[k];},
      closest(selector){if(selector==='[data-cycle-viewer]'&&this.isTrack)return this;if(selector==='[data-cycle-panel]'&&this.isPanel)return this;if(selector==='[data-eng-stage]'&&this.dataset.engStage)return this;return this.parentElement?.closest(selector)||null;},
      querySelector(selector){if(this.controlNodes?.[selector])return this.controlNodes[selector];const direct=this.children.find(child=>selector==='.'+child.className);if(direct)return direct;for(const child of this.children){const nested=child.querySelector(selector);if(nested)return nested;}return null;},
      querySelectorAll(){return [];},
      getBoundingClientRect(){const track=this.closest('[data-cycle-viewer]');if(this.className==='eng-reader-runway')return{top:track.base-y,height:parseFloat(track.style.values['--eng-runway-height'])||628};return{top:0,height:0,width:0};}
    };
    Object.defineProperty(el,'innerHTML',{set(value){this.html=value;if(!value.includes('data-guide-status'))return;this.controlNodes={};for(const key of ['status','hint','prev','next','skip','evidence']){const control=node();this.controlNodes[`[data-guide-${key}]`]=control;this.append(control);}}});
    return Object.assign(el,extra);
  }
  document.documentElement=node();document.body=node();
  const outside=node();document.activeElement=outside;
  const header=node({getBoundingClientRect:()=>({height:73})});
  const tracks=Array.from({length:trackCount},(_,trackIndex)=>{
    const track=node({isTrack:true,base:800+trackIndex*14000});
    const tabs=node({getBoundingClientRect:()=>({height:55})});
    const summary=node({getBoundingClientRect:()=>({top:track.base+9200-y})});
    const items=Array.from({length:3},(_,i)=>{
      const panel=node({isPanel:true,hidden:i!==0,dataset:{cyclePanel:String(i+1)},id:`track-${trackIndex}-cycle-${i+1}`});
      const head=node({getBoundingClientRect:()=>({width:600,height:120+i*15})});
      head.cloneNode=()=>node({getBoundingClientRect:()=>({height:120+i*15})});
      const body=node({className:'has-meshed-gears',dataset:{activeStage:'design'}});
      const notes=names.map((name,j)=>node({hidden:j!==0,dataset:{engStage:name},id:`${panel.id}-${name}`,scrollTop:0,scrollHeight:500,clientHeight:300,querySelector:selector=>selector==='h5'?{textContent:name}:null}));
      const footer=node({getBoundingClientRect:()=>({top:track.base+(parseFloat(track.style.values['--eng-runway-height'])||628)+80-y})});
      const gears=names.map((name,j)=>node({dispatchEvent(event={}){body.dataset.activeStage=name;notes.forEach((note,n)=>note.hidden=n!==j);track.dispatchEvent({type:'eng:stage-change',target:body,detail:{source:event.source||'guide'}});return true;}}));
      notes.forEach(note=>body.append(note));gears.forEach(gear=>body.append(gear));
      panel.append(head);panel.append(body);panel.append(footer);track.append(panel);
      const inherited=panel.querySelector;
      panel.querySelector=selector=>{
        if(selector==='.has-meshed-gears')return body;
        if(selector==='.eng-cycle__head')return head;
        if(selector==='.eng-cycle__footer')return footer;
        if(selector==='[data-eng-stage]:not([hidden])')return notes.find(note=>!note.hidden);
        const gear=selector.match(/data-gear="(\d)"/);if(gear)return gears[+gear[1]];
        return inherited.call(panel,selector);
      };
      panel.querySelectorAll=selector=>selector==='[data-eng-stage]'?notes:[];
      return{panel,body,head,notes,gears,footer};
    });
    const cycleTabs=items.map(({panel},i)=>node({click(source='guide'){items.forEach((item,n)=>item.panel.hidden=n!==i);track.dispatchEvent({type:'eng:cycle-change',target:track,detail:{panel,source}});}}));
    track.querySelectorAll=()=>items.map(item=>item.panel);
    track.querySelector=selector=>{
      if(selector==='.eng-cycle-tabs')return tabs;
      if(selector==='.eng-track-label')return{textContent:trackIndex?'Hardware':'Wet Lab'};
      if(selector==='.eng-summary')return summary;
      const tab=selector.match(/data-cycle-tab="(\d)"/);return tab?cycleTabs[+tab[1]-1]:null;
    };
    return{track,items,summary,cycleTabs};
  });
  document.querySelectorAll=()=>tracks.map(item=>item.track);
  document.querySelector=selector=>selector==='.site-header'?header:null;
  document.createElement=()=>node();
  document.addEventListener=(name,fn,options)=>{(docEvents[name]??=[]).push(fn);listeners.push({surface:'document',name,options});};
  document.dispatchEvent=event=>{for(const fn of docEvents[event.type]||[])fn(event);return !event.defaultPrevented;};
  document.getElementById=id=>tracks.flatMap(track=>track.items.flatMap(item=>[item.panel,...item.notes])).find(item=>item.id===id)||null;
  const reduced={matches:reducedMotion,addEventListener(name,fn){this.change=fn;}};
  const window={addEventListener:(name,fn,options)=>{(globals[name]??=[]).push(fn);listeners.push({surface:'window',name,options});},
    scrollTo:arg=>{scrollCalls.push({top:arg.top,behavior:arg.behavior});y=arg.top;},
    scrollBy:arg=>{scrollCalls.push({delta:arg.top,behavior:arg.behavior});y+=arg.top;}};
  const sandbox={document,window,location:{hash:initialHash},innerHeight:height,innerWidth:1200,matchMedia:()=>reduced,
    requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},
    MouseEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}}};
  Object.defineProperty(sandbox,'scrollY',{get:()=>y});
  vm.runInNewContext(script,sandbox);
  const fire=(name,event={})=>{for(const fn of globals[name]||[])fn(event);};
  const frame=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());};
  frame();frame();
  const track=tracks[0];
  return{...track,tracks,root:document.documentElement,document,globals,docEvents,listeners,reduced,scrollCalls,frame,
    getY:()=>y,getFocus:()=>document.activeElement,
    scroll(next){y=next;fire('scroll');},fire,
    position(index,t=0){return tracks[t].track.base-156+(index+.2)*Math.max(360,Math.min(520,Math.round(sandbox.innerHeight*.65)));},
    selectCycle(index,t=0){tracks[t].cycleTabs[index].click('user');},
    selectGear(cycle,stage,t=0){tracks[t].items[cycle].gears[stage].dispatchEvent({source:'user'});},
    button(cycle,key,t=0){return tracks[t].items[cycle].body.querySelector('.eng-guide-controls').querySelector(`[data-guide-${key}]`);},
    click(cycle,key,t=0){this.button(cycle,key,t).dispatchEvent({type:'click'});},
    resize(next){sandbox.innerHeight=next;fire('resize');},
    hash(id){sandbox.location.hash='#'+id;this.navigate(id);},
    navigate(id){
      const event={type:'eng:navigate',detail:{target:document.getElementById(id)},defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};
      const nativeFallback=document.dispatchEvent(event);frame();frame();return nativeFallback;
    },
    finishLoad(){document.readyState='complete';fire('load');frame();frame();},
    finishFonts(){fontCallbacks.splice(0).forEach(fn=>fn());frame();frame();},
    setReduced(value){reduced.matches=value;reduced.change();}
  };
}

function selected(h,t=0){
  const list=h.tracks[t].items,cycle=list.findIndex(item=>!item.panel.hidden);
  return{cycle,stage:list[cycle].body.dataset.activeStage};
}

test('native input is never intercepted or locked; scroll observation is passive',()=>{
  const h=harness();
  for(const name of ['wheel','touchstart','touchmove','touchend','keydown','pointerdown'])assert(!h.listeners.some(item=>item.name===name),name);
  assert(h.listeners.some(item=>item.name==='scroll'&&item.options?.passive===true));
  assert.equal(h.root.classList.contains('eng-scroll-locked'),false);
  assert.equal(h.scrollCalls.length,0);
});

test('entry and fast native scrolling derive the visible phase without repositioning the page',()=>{
  const h=harness();
  for(const index of [0,1,7,13,14]){
    const position=h.position(index);h.scroll(position);h.frame();
    assert.deepEqual(selected(h),{cycle:Math.floor(index/5),stage:['design','build','test','learn','redesign'][index%5]});
    assert.equal(h.getY(),position);assert.equal(h.scrollCalls.length,0);
    assert(h.track.classList.contains('is-guided'));
  }
});

test('a burst of native scroll events renders the latest position once and never snaps backwards',()=>{
  const h=harness();
  for(let i=0;i<=11;i++)h.scroll(h.position(i));
  const position=h.getY();h.frame();
  assert.deepEqual(selected(h),{cycle:2,stage:'build'});
  assert.equal(h.getY(),position);assert.equal(h.scrollCalls.length,0);
});

test('natural completion keeps the final phase and flows past the runway without a jump',()=>{
  const h=harness(),start=h.track.base-156,travel=15*520;
  for(const distance of [14*520,travel-1,travel+1,travel+200]){
    h.scroll(start+distance);h.frame();
    assert.deepEqual(selected(h),{cycle:2,stage:'redesign'});
    assert.equal(h.getY(),start+distance);assert.equal(h.scrollCalls.length,0);
    assert.equal(h.track.classList.contains('is-guided'),distance<=travel);
  }
});

test('returning from below automatically revisits any cycle and supports reverse reading',()=>{
  const h=harness();h.scroll(h.position(14)+1500);h.frame();
  for(const index of [14,10,6,5,4,0]){
    h.scroll(h.position(index));h.frame();
    assert(h.track.classList.contains('is-guided'));
    assert.deepEqual(selected(h),{cycle:Math.floor(index/5),stage:['design','build','test','learn','redesign'][index%5]});
  }
  assert.equal(h.scrollCalls.length,0);
});

test('selecting Cycle 2 after completion returns to its Design phase, even on a repeat visit',()=>{
  const h=harness();h.scroll(h.position(14));h.frame();h.scroll(h.position(14)+1600);h.frame();
  h.selectCycle(1);h.frame();
  assert.deepEqual(selected(h),{cycle:1,stage:'design'});
  assert.equal(h.getY(),h.position(5));assert(h.track.classList.contains('is-guided'));
  h.scroll(h.position(8));h.frame();h.selectCycle(1);h.frame();
  assert.deepEqual(selected(h),{cycle:1,stage:'design'});
  assert.equal(h.scrollCalls.length,2);
});

test('manual gear navigation seeks the matching phase and subsequent native scrolling continues from there',()=>{
  const h=harness();h.selectCycle(1);h.selectGear(1,2);h.frame();
  assert.deepEqual(selected(h),{cycle:1,stage:'test'});assert.equal(h.getY(),h.position(7));
  const writes=h.scrollCalls.length;h.scroll(h.position(8));h.frame();
  assert.deepEqual(selected(h),{cycle:1,stage:'learn'});assert.equal(h.scrollCalls.length,writes);
});

test('Previous and Next cross cycles while preserving keyboard focus on a visible control',()=>{
  const h=harness();h.scroll(h.position(4));h.frame();h.click(0,'next');h.frame();
  assert.deepEqual(selected(h),{cycle:1,stage:'design'});assert.equal(h.getY(),h.position(5));
  assert(h.getFocus()===h.button(1,'next'));assert.equal(h.getFocus().focusOptions.preventScroll,true);
  h.click(1,'prev');h.frame();assert.deepEqual(selected(h),{cycle:0,stage:'redesign'});
  assert.equal(h.getY(),h.position(4));
});

test('Skip is explicit navigation and does not permanently disable later native reentry',()=>{
  const h=harness();h.scroll(h.position(3));h.frame();h.click(0,'skip');
  assert.deepEqual(h.scrollCalls.at(-1),{top:h.track.base+9200-97,behavior:'smooth'});
  assert.equal(h.getFocus(),h.summary);assert.equal(h.summary.attrs.tabindex,'-1');
  h.fire('scroll');h.frame();h.scroll(h.position(5));h.frame();
  assert.deepEqual(selected(h),{cycle:1,stage:'design'});assert(h.track.classList.contains('is-guided'));
  assert.equal(h.scrollCalls.length,1);
});

test('Human Practices Skip reaches the next local item rather than another track summary',()=>{
  const h=harness(),query=h.track.querySelector;
  h.track.querySelector=selector=>selector==='.eng-summary'?null:query(selector);
  h.track.nextElementSibling={...h.summary,getBoundingClientRect:()=>({top:10100-h.getY()})};
  h.click(0,'skip');assert.equal(h.getY(),10003);
});

test('reading a cycle decision preserves that cycle during the explicit exit',()=>{
  const h=harness();h.selectCycle(1);h.selectGear(1,2);h.frame();
  h.click(1,'evidence');h.fire('scroll');h.frame();
  assert.deepEqual(selected(h),{cycle:1,stage:'test'});assert.equal(h.getFocus(),h.items[1].footer);
  const writes=h.scrollCalls.length;
  for(const delta of [120,240,480]){h.scroll(h.getY()+delta);h.frame();assert.deepEqual(selected(h),{cycle:1,stage:'test'});}
  assert.equal(h.scrollCalls.length,writes);
  h.scroll(h.position(6));h.frame();assert.deepEqual(selected(h),{cycle:1,stage:'build'});
});

test('every cycle owns a runway with a shared stable dimension and equalized header height',()=>{
  const h=harness(),height=h.track.style.values['--eng-runway-height'];
  assert.equal(height,'8428px');assert.equal(h.track.style.values['--eng-guide-head-height'],'150px');
  for(const {panel,body}of h.items){assert.equal(body.parentElement,panel.querySelector('.eng-reader-runway'));}
  for(const index of [0,4,5,9,10,14]){h.scroll(h.position(index));h.frame();assert.equal(h.track.style.values['--eng-runway-height'],height);}
});

test('short screens and reduced-motion preferences retain manual reading without page capture',()=>{
  for(const options of [{height:480},{reducedMotion:true}]){
    const h=harness(options);assert.equal(h.track.classList.contains('has-scroll-story'),false);
    h.scroll(1200);h.frame();assert.deepEqual(selected(h),{cycle:0,stage:'design'});
    h.selectCycle(1);h.selectGear(1,3);h.frame();assert.deepEqual(selected(h),{cycle:1,stage:'learn'});
    h.click(1,'next');h.frame();assert.deepEqual(selected(h),{cycle:1,stage:'redesign'});
    assert.equal(h.scrollCalls.length,0);assert.equal(h.getY(),1200);
  }
});

test('resizing and changing motion preference never restore an old scroll position',()=>{
  const h=harness();h.scroll(h.position(7));h.frame();const y=h.getY();
  h.resize(480);h.frame();assert.equal(h.track.classList.contains('has-scroll-story'),false);
  h.resize(800);h.frame();assert.equal(h.track.classList.contains('has-scroll-story'),true);
  h.setReduced(true);h.frame();assert.equal(h.track.classList.contains('has-scroll-story'),false);
  assert.equal(h.getY(),y);assert.equal(h.scrollCalls.length,0);
});

test('deep links to an iteration or phase seek to that readable place',()=>{
  const h=harness();h.hash('track-0-cycle-2-test');
  assert.deepEqual(selected(h),{cycle:1,stage:'test'});assert.equal(h.getY(),h.position(7));
  h.hash('track-0-cycle-3');
  assert.deepEqual(selected(h),{cycle:2,stage:'design'});assert.equal(h.getY(),h.position(10));
});

test('initial deep links wait for load and fonts, then seek exactly once after native fragment layout',()=>{
  const h=harness({initialHash:'#track-0-cycle-2-test',loading:true,fontsLoading:true});
  h.scroll(h.track.base);h.frame(); // The browser's initial fragment position is not the timeline position.
  assert.equal(h.scrollCalls.length,0);
  h.finishLoad();assert.equal(h.scrollCalls.length,0);
  h.finishFonts();
  assert.deepEqual(selected(h),{cycle:1,stage:'test'});
  assert.equal(h.getY(),h.position(7));assert.equal(h.scrollCalls.length,1);
  h.fire('scroll');h.frame();h.frame();
  assert.deepEqual(selected(h),{cycle:1,stage:'test'});
  assert.equal(h.scrollCalls.length,1);
});

test('same-page cycle and phase links are owned by the reader instead of a second heading scroll',()=>{
  const h=harness();
  assert.equal(h.navigate('track-0-cycle-2'),false);
  assert.deepEqual(selected(h),{cycle:1,stage:'design'});assert.equal(h.getY(),h.position(5));
  assert.equal(h.navigate('track-0-cycle-3-learn'),false);
  assert.deepEqual(selected(h),{cycle:2,stage:'learn'});assert.equal(h.getY(),h.position(13));
  assert.equal(h.scrollCalls.length,2);
});

test('explicit navigation during loading cancels the stale initial link without a later correction',()=>{
  const h=harness({initialHash:'#track-0-cycle-2',loading:true,fontsLoading:true});
  h.navigate('track-0-cycle-3-build');
  const position=h.getY();
  h.finishFonts();h.finishLoad();
  assert.deepEqual(selected(h),{cycle:2,stage:'build'});
  assert.equal(h.getY(),position);assert.equal(h.scrollCalls.length,1);
});

test('separate workstreams use independent native timelines without recursive navigation',()=>{
  const h=harness({trackCount:2});
  h.scroll(h.position(8,1));h.frame();
  assert.deepEqual(selected(h,1),{cycle:1,stage:'learn'});assert.equal(h.scrollCalls.length,0);
  h.selectCycle(1,0);h.frame();assert.deepEqual(selected(h,0),{cycle:1,stage:'design'});
  assert.equal(h.getY(),h.position(5,0));assert.equal(h.scrollCalls.length,1);
});
