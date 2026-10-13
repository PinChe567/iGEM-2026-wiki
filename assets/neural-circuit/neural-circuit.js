/* Scripted teaching animation. No solver, measured traces or fitted weights. */
(() => {
  'use strict';
  const root=document.querySelector('[data-neural-circuit]');
  if(!root)return;
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  const $=s=>root.querySelector(s),buttons=[...root.querySelectorAll('[data-neural-step]')];
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const C={ink:'#303b3c',muted:'#596667',line:'#c6cec5',paper:'#f9f7ef',green:'#28644f',mint:'#9ccfb2',purple:'#7960a0',lavender:'#b7a4d1',coral:'#b45741',peach:'#f2aa8e',gold:'#8b681b',yellow:'#ead18a'};
  const theme=getComputedStyle(root);
  C.paper=theme.getPropertyValue('--v-tint').trim()||C.paper;
  C.ink=theme.getPropertyValue('--v-ink').trim()||C.ink;
  C.muted=theme.getPropertyValue('--v-muted').trim()||C.muted;
  const steps=[
    {title:'An odor becomes a distributed input pattern',phase:'Encoding',status:'Several channels respond to the same odor',detail:'Receptor and projection-neuron (PN) activity represent an odor as a pattern. In our implemented decoder, electronic-sensor features supply the PN input.'},
    {title:'Expansion leaves a sparse KC ensemble',phase:'Sparse coding',status:'A small subset of Kenyon cells stays active',detail:'PN signals spread into a larger KC population. Inhibition and adaptive thresholds keep activity sparse; the simplified drawing highlights the surviving ensemble.'},
    {title:'A teacher guides the MBON readout',phase:'Training',status:'Teacher A → MBON A',detail:'During training, the corresponding Answerₚ teacher stimulates MBON A while the KC pattern is active. Highlighted KC→MBON connections illustrate a learned readout.'}
  ];
  const state={step:0,phase:'train',elapsed:0,playing:false,last:0,frame:0,visible:true,ended:false};
  const activeKC=new Set([1,6,12,19,25]);
  const clamp=x=>Math.max(0,Math.min(1,x));
  function fit(){
    const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);
    if(!r.width||!r.height)return null;
    const width=Math.round(r.width*d),height=Math.round(r.height*d);
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    ctx.setTransform(d,0,0,d,0,0);return r;
  }
  function line(a,b,color=C.line,width=1,alpha=.45,dashed=false,arrow=false){
    ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dashed?[4,4]:[]);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    if(arrow){const t=.76,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,angle=Math.atan2(b.y-a.y,b.x-a.x);ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(x-6*Math.cos(angle-.5),y-6*Math.sin(angle-.5));ctx.lineTo(x,y);ctx.lineTo(x-6*Math.cos(angle+.5),y-6*Math.sin(angle+.5));ctx.stroke();}ctx.restore();
  }
  function text(s,x,y,{size=12,weight=600,color=C.muted,align='center'}={}){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui, sans-serif`;ctx.textAlign=align;ctx.fillText(s,x,y);}
  function node(p,r,fill,active=false,label='',labelY=0){
    if(active){ctx.beginPath();ctx.arc(p.x,p.y,r+5,0,Math.PI*2);ctx.fillStyle=fill+'28';ctx.fill();}
    ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=active?fill:C.paper;ctx.strokeStyle=active?C.ink:C.line;ctx.lineWidth=active?1.4:1;ctx.fill();ctx.stroke();
    if(label)text(label,p.x,p.y+(labelY||r+19),{size:11,color:C.ink});
  }
  function dot(a,b,offset,color,size=2.5){const p=(state.elapsed*.55+offset)%1;ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*p,a.y+(b.y-a.y)*p,size,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
  function draw(){
    const bounds=fit();if(!bounds)return;const w=bounds.width,h=bounds.height,mobile=w<530;
    ctx.clearRect(0,0,w,h);
    const group=(n,x,y,gap)=>Array.from({length:n},(_,i)=>({x:x(i),y:y(i),i}));
    const receptors=mobile?group(6,i=>w*(.12+i*.152),()=>57):group(6,()=>w*.13,i=>103+i*39);
    const pn=mobile?group(5,i=>w*(.14+i*.18),()=>153):group(5,()=>w*.30,i=>119+i*45);
    const kc=mobile?group(28,i=>w*.08+(i%14)*w*.0647,i=>264+Math.floor(i/14)*30):group(28,()=>w*.52,i=>63+i*10.6);
    const mb=mobile?group(3,i=>w*(.18+i*.32),()=>410):group(3,()=>w*.76,i=>128+i*83);
    const teacher=mobile?group(3,i=>w*(.18+i*.32),()=>530):group(3,()=>w*.94,i=>128+i*83);
    const encoded=state.step>=0,sparse=state.step>=1,learned=state.step===2,training=learned&&state.phase==='train';
    // Reduced motion disables autoplay; an explicit Play action can opt in.
    const animated=state.playing,progress=clamp(state.elapsed/2.8);
    const labels=mobile?[
      ['ODOR → RECEPTORS',w/2,20],['PN · ENCODED PATTERN',w/2,117],['KC · SPARSE ENSEMBLE',w/2,224],['MBON · CLASS OUTPUT',w/2,367],['TEACHER · TRAINING ONLY',w/2,486]
    ]:[['RECEPTORS',w*.13,29],['PN',w*.30,29],['KC',w*.52,29],['MBON / OUTPUT',w*.76,29],['TEACHER',w*.94,29]];
    labels.forEach(([s,x,y])=>text(s,x,y,{size:mobile?11:10.5,weight:700}));
    if(!mobile)text('ODOR',w*.025,196,{size:10});
    const gas={x:mobile?w/2:w*.03,y:mobile?31:216};
    receptors.forEach((r,i)=>{if(!mobile){line(gas,r,C.coral,1,.25);if(animated&&state.step===0&&[1,2,4].includes(i))dot(gas,r,i*.13,C.coral);}});
    pn.forEach((p,i)=>receptors.forEach((r,j)=>{if((i+j)%4===1||i===j%5){const a=[0,2,3].includes(i)&&[1,2,4].includes(j);line(r,p,a?C.purple:C.line,1,a?.45:.24);if(a&&animated&&state.step===0)dot(r,p,i*.17,C.purple);}}));
    kc.forEach((k,i)=>pn.forEach((p,j)=>{
      // Every highlighted KC has an active illustrative PN source. These fixed
      // links explain the pattern; they do not replicate the simulation matrix.
      const highlightedSource=activeKC.has(i)&&j===[0,2,3][[...activeKC].indexOf(i)%3];
      if((i*3+j*5)%11<2||highlightedSource){const a=sparse&&activeKC.has(i)&&[0,2,3].includes(j);line(p,k,a?C.green:C.line,a?1.25:.7,a?.6:.23);if(a&&animated&&state.step===1)dot(p,k,i*.09,C.green,2.5);}
    }));
    kc.forEach((k,i)=>mb.forEach((m,j)=>{if((i+j*4)%9===0||(activeKC.has(i)&&j===0)){
      const a=learned&&activeKC.has(i)&&j===0;line(k,m,a?C.purple:C.line,a?(training?1.2+progress*1.5:2.7):.7,a?.65:.22);
      if(a&&animated)dot(k,m,i*.14,C.purple);
    }}));
    teacher.forEach((t,i)=>{const a=training&&i===0;line(t,mb[i],a?C.gold:C.line,a?2:1,a?.9:.6,!training,true);if(a&&animated)dot(t,mb[i],.22,C.gold,3.2);});
    receptors.forEach((r,i)=>node(r,mobile?8:7,C.peach,encoded&&[1,2,4].includes(i),'R'+(i+1)));
    pn.forEach((p,i)=>node(p,mobile?10:9,C.lavender,encoded&&[0,2,3].includes(i),'PN'+(i+1)));
    kc.forEach((k,i)=>node(k,mobile?4.6:4,C.mint,sparse&&activeKC.has(i)));
    mb.forEach((m,i)=>{node(m,mobile?17:15,C.peach,learned&&i===0);text(String.fromCharCode(65+i),m.x,m.y+4,{size:12,color:C.ink});text('MBON '+String.fromCharCode(65+i),m.x,m.y+35,{size:11,color:C.ink});});
    teacher.forEach((t,i)=>{node(t,11,C.yellow,training&&i===0);text(String.fromCharCode(65+i),t.x,t.y+4,{size:11,color:C.ink});text('Answerₚ '+String.fromCharCode(65+i),t.x,t.y+29,{size:10.5});});
    if(mobile){text(sparse?'5 highlighted KCs':'28 illustrative KCs',w/2,327,{size:11,color:sparse?C.green:C.muted});}
    else{text(sparse?'5 highlighted of 28 illustrative KCs':'Illustrative populations · not to scale',w*.48,389,{size:11});}
  }
  function sync(){
    const s=steps[state.step],testing=state.step===2&&state.phase==='test';
    $('[data-neural-title]').textContent=testing?'The same KC pattern drives the learned output':s.title;
    $('[data-neural-phase-label]').textContent=testing?'Testing · teacher off':s.phase;
    $('[data-neural-status]').textContent=testing?'Teacher removed · MBON A is the output':s.status;
    $('[data-neural-detail]').textContent=testing?'The scripted example replays the same pattern with the teacher off. Our actual evaluation uses held-out inputs with learning disabled; classification is based on the MBON with the most spikes.':s.detail;
    buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===state.step)));
    $('[data-neural-phases]').hidden=state.step!==2;
    root.querySelectorAll('[data-neural-phase]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.neuralPhase===state.phase)));
    $('[data-neural-motion]').textContent=state.playing?'Pause animation':(state.ended?'Replay animation':'Play animation');
    $('[data-neural-motion]').setAttribute('aria-pressed',String(state.playing));
    canvas.setAttribute('aria-label',(testing?'Testing: teacher removed and MBON A responds.':s.status+'.')+' Scripted conceptual circuit; population sizes are illustrative.');
  }
  function cancel(){cancelAnimationFrame(state.frame);state.frame=0;state.last=0;}
  function tick(now){
    state.frame=0;if(!state.playing||!state.visible||document.hidden||root.closest('[hidden]')){state.last=0;return;}
    if(state.last)state.elapsed+=Math.min((now-state.last)/1000,.1);state.last=now;
    if(state.step===2&&state.elapsed>=4&&state.phase==='train'){state.phase='test';sync();}
    const duration=state.step===2?7.2:4.2;
    if(state.elapsed>=duration){state.playing=false;state.ended=true;cancel();sync();}
    draw();if(state.playing)state.frame=requestAnimationFrame(tick);
  }
  function schedule(){if(state.playing&&state.visible&&!document.hidden&&!root.closest('[hidden]')&&!state.frame)state.frame=requestAnimationFrame(tick);}
  function select(i){cancel();state.step=i;state.phase='train';state.elapsed=0;state.ended=false;state.playing=!motion.matches;sync();draw();schedule();}
  buttons.forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.neuralStep))));
  $('[data-neural-reset]').addEventListener('click',()=>select(0));
  $('[data-neural-motion]').addEventListener('click',()=>{
    if(state.playing){state.playing=false;cancel();}
    else{if(state.ended){state.elapsed=0;state.phase='train';state.ended=false;}state.playing=true;}
    sync();draw();schedule();
  });
  root.querySelectorAll('[data-neural-phase]').forEach(b=>b.addEventListener('click',()=>{
    cancel();state.phase=b.dataset.neuralPhase;state.elapsed=state.phase==='test'?4.1:0;state.playing=false;state.ended=false;sync();draw();
  }));
  // Initial hidden→visible changes can arrive together; use the newest entry.
  const observer=new IntersectionObserver(entries=>{state.visible=entries[entries.length-1].isIntersecting;if(!state.visible)cancel();else{draw();schedule();}},{threshold:.05});observer.observe(canvas);
  new ResizeObserver(()=>{draw();schedule();}).observe(canvas);
  new MutationObserver(()=>{if(root.closest('[hidden]'))cancel();else{draw();schedule();}}).observe(root.closest('[data-model-panel]'),{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();else schedule();});
  motion.addEventListener('change',()=>{if(motion.matches){state.playing=false;cancel();sync();draw();}});
  root.querySelectorAll('[data-neural-controls]').forEach(e=>e.hidden=false);
  root.classList.add('is-ready');select(0);
})();
