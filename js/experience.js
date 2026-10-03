/* Progressive enhancement only: all scientific content remains in HTML. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  $$('[data-framework-part]').forEach(link => {
    const linkedItem = document.getElementById(link.getAttribute('href').slice(1));
    if (linkedItem) linkedItem.addEventListener('toggle', () => link.setAttribute('aria-expanded', String(linkedItem.open)));
    link.addEventListener('click', event => {
      const item = document.getElementById(link.getAttribute('href').slice(1));
      if (!item) return;
      event.preventDefault(); item.open = !item.open;
      link.setAttribute('aria-expanded', String(item.open));
      if (item.open) item.scrollIntoView({block:'nearest',behavior:'instant'});
    });
  });

  // Native disclosures also work with JavaScript disabled.
  $$('[data-framework-toggle]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const items = $$('.framework-cell', button.closest('.framework-gallery'));
      const open = items.some(item => !item.open);
      items.forEach(item => { item.open = open; });
      button.textContent = open ? 'Collapse all diagrams' : 'Expand all diagrams';
      button.setAttribute('aria-expanded', String(open));
    });
  });
  let printDetails = [];
  addEventListener('beforeprint', () => {
    printDetails = $$('.framework-cell,.signal-transcript,.cinema-paths details').map(el => [el, el.open]);
    printDetails.forEach(([el]) => { el.open = true; });
  });
  addEventListener('afterprint', () => printDetails.forEach(([el, open]) => { el.open = open; }));

  const cinema = $('[data-cinema]');
  if (cinema) {
    const track = $('.cinema-track', cinema), stage = $('.cinema-stage', cinema);
    const videos = $$('video', cinema), slider = $('[data-cinema-progress]', cinema);
    const start = $('[data-cinema-start]', cinema), toggle = $('[data-cinema-scan]', cinema);
    const product = $('[data-cinema-product]', cinema), status = $('[data-cinema-status]', cinema);
    const beats = $$('[data-cinema-beat]', cinema);
    const notes = [
      'A familiar view of stored food. Appearance is only one source of information.',
      'Volatile patterns can change. The signal view makes this invisible idea visible.',
      'AeroSense proposes a route from receptor response to an optical measurement.',
      'A screening signal would guide a closer look and confirmatory testing.'
    ];
    let enabled = false, scanning = false, progress = 0, frame = 0, lastBeat = -1, manual = false;
    const targets = new Map();
    function seek(video) {
      const target = targets.get(video);
      video.dataset.seekTarget=String(target ?? 0);
      if (target == null || video.seeking || video.readyState < 1 || !Number.isFinite(video.duration)) return;
      if (Math.abs(video.currentTime - target) > .06) video.currentTime = target;
    }
    videos.forEach(video => {
      video.addEventListener('seeking', () => stage.classList.remove('is-synced'));
      video.addEventListener('seeked', () => { video.dataset.frameTime=String(video.currentTime); seek(video); syncMask(); });
      video.addEventListener('canplay', () => seek(video));
      video.addEventListener('loadedmetadata', () => paint(progress));
      video.addEventListener('error', () => {
        status.textContent = 'The film could not load. The illustrated view and both written story paths remain available.';
        video.hidden = true;
      });
    });
    function syncMask() {
      stage.classList.toggle('is-synced',videos.every(v=>v.readyState>=2&&Math.abs(v.currentTime-videos[0].currentTime)<.09));
    }
    function paint(value) {
      progress = Math.max(0, Math.min(1, value));
      slider.value = String(Math.round(progress * 100));
      if (enabled && !reduce.matches) videos.forEach(video => {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          targets.set(video, progress * Math.max(0, video.duration - .08)); seek(video);
        }
      });
      const beat = Math.min(3, Math.floor(progress * 4));
      if (beat !== lastBeat) {
        lastBeat = beat; status.textContent = notes[beat];
        beats.forEach((item, i) => { item.classList.toggle('is-active', i === beat); });
      }
    }
    function setScan(value) {
      scanning = value;
      toggle.setAttribute('aria-pressed', String(value)); product.setAttribute('aria-pressed', String(value));
      toggle.textContent = value ? 'Signal view on' : 'Reveal signal view';
      stage.style.setProperty('--lens-size', value ? (fine.matches ? '190px' : '140%') : '0px');
      // The same image remains visible if media is unavailable; decoration never claims measurement.
      stage.classList.toggle('is-scanning', value);
      syncMask();
    }
    const localhost = ['localhost', '127.0.0.1', ''].includes(location.hostname);
    const approvedMedia = videos.every(v => v.dataset.igemSrc);
    function enableFilm(value) {
      enabled=value&&!reduce.matches;
      if(enabled) videos.forEach(video=>{
        if(!video.getAttribute('src')){video.src=video.dataset.igemSrc||video.dataset.localSrc;video.preload='auto';video.load();}
      });
      track.classList.toggle('is-scroll',!!videos[0].getAttribute('src')&&!reduce.matches&&innerWidth>700&&innerHeight>=620);
      start.textContent=enabled?'Pause scroll film':'Resume scroll film';
      start.setAttribute('aria-pressed',String(enabled));
      paint(progress);
    }
    start.hidden=reduce.matches||!(localhost||approvedMedia);
    if(!localhost&&!approvedMedia)$('[data-cinema-hosting-note]',cinema).hidden=false;
    start.addEventListener('click',()=>enableFilm(!enabled));
    enableFilm((localhost||approvedMedia)&&!reduce.matches);
    addEventListener('resize',()=>track.classList.toggle('is-scroll',!!videos[0].getAttribute('src')&&!reduce.matches&&innerWidth>700&&innerHeight>=620));
    toggle.hidden = false; product.hidden = false;
    toggle.addEventListener('click', () => setScan(!scanning));
    product.addEventListener('click', () => setScan(!scanning));
    stage.addEventListener('pointermove', event => {
      if (!fine.matches) return;
      const rect = stage.getBoundingClientRect();
      stage.style.setProperty('--lens-x', `${event.clientX - rect.left}px`);
      stage.style.setProperty('--lens-y', `${event.clientY - rect.top}px`);
    }, {passive:true});
    toggle.addEventListener('keydown', () => { stage.style.setProperty('--lens-x','65%'); stage.style.setProperty('--lens-y','50%'); });
    slider.addEventListener('input', () => { manual = true; paint(Number(slider.value) / 100); });
    addEventListener('wheel', () => { manual = false; }, {passive:true});
    addEventListener('touchmove', () => { manual = false; }, {passive:true});
    addEventListener('keydown', event => {
      if (event.target === slider) return;
      if (['PageDown','PageUp','ArrowDown','ArrowUp','Home','End',' '].includes(event.key)) manual = false;
    });
    addEventListener('scroll', () => {
      if (!enabled || manual || !track.classList.contains('is-scroll') || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = track.getBoundingClientRect(), distance = track.offsetHeight - stage.offsetHeight;
        paint((72 - rect.top) / Math.max(1, distance));
      });
    }, {passive:true});
    reduce.addEventListener('change', () => {
      if (reduce.matches) { enabled = false; track.classList.remove('is-scroll'); videos.forEach(v => v.pause()); start.hidden = true; }
      else { start.hidden = !(localhost||approvedMedia); enableFilm(localhost||approvedMedia); }
    });
    paint(0);
  }

  // A small flight companion. The sprite points up; rotation follows its actual velocity.
  if (fine.matches) {
    const button=document.createElement('button');button.type='button';button.className='fly-toggle';
    button.innerHTML='<svg class="fly-toggle__portrait" width="26" height="26" viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="m15 13-4-7m14 7 4-7M17 29l3 6 3-6"/><ellipse cx="20" cy="22" rx="12" ry="10" fill="currentColor" fill-opacity=".08"/><ellipse cx="12" cy="21" rx="6" ry="8"/><ellipse cx="28" cy="21" rx="6" ry="8"/><path d="m10 16 4 10m-4 0 4-10m12 0 4 10m-4 0 4-10M17 21h6"/></g></svg><span class="fly-toggle__action">Show fly</span>';
    button.setAttribute('aria-label','Fly companion');
    const tools=$('.header-tools');if(!tools)return;
    const control=document.createElement('div');control.className='fly-control';
    control.append(button);tools.prepend(control);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')control.classList.add('is-dismissed');});
    control.addEventListener('pointerleave',()=>control.classList.remove('is-dismissed'));
    control.addEventListener('focusout',()=>control.classList.remove('is-dismissed'));
    const fly=document.createElement('button');fly.type='button';fly.className='cursor-fly';fly.setAttribute('aria-label','Ask the fly about AeroSense');fly.title='Ask the fly about AeroSense';
    fly.innerHTML=`<svg viewBox="0 0 64 64"><g stroke="#593d24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M26 34l-10 6-3 7m13-8-8 9m20-14 10 6 3 7m-13-8 8 9" fill="none"/>
      <ellipse cx="32" cy="42" rx="10" ry="15" fill="#e7b561"/><path d="M23 43q9 5 18 0m-15 6q6 3 12 0" fill="none"/>
      <g class="fly-wing fly-wing--left"><path d="M29 32C14 6 2 13 8 30c3 9 13 13 21 6Z" fill="#e3f7ed" fill-opacity=".93"/><path d="M27 33 10 20m14 14-12-5" stroke="#8ebdae" stroke-width=".8"/></g>
      <g class="fly-wing fly-wing--right"><path d="M35 32C50 6 62 13 56 30c-3 9-13 13-21 6Z" fill="#e3f7ed" fill-opacity=".93"/><path d="M37 33 54 20m-14 14 12-5" stroke="#8ebdae" stroke-width=".8"/></g>
      <ellipse cx="32" cy="30" rx="10" ry="11" fill="#b68647"/><path d="m27 18-3-8m13 8 3-8" fill="none"/>
      <ellipse cx="32" cy="21" rx="11" ry="9" fill="#d4a867"/>
      <ellipse cx="23" cy="20" rx="6" ry="7" fill="#d97a59"/><ellipse cx="41" cy="20" rx="6" ry="7" fill="#d97a59"/>
      <ellipse cx="23" cy="19" rx="2.3" ry="3.3" fill="#48332d"/><ellipse cx="41" cy="19" rx="2.3" ry="3.3" fill="#48332d"/>
      <circle cx="22" cy="17" r="1.5" fill="white" stroke="none"/><circle cx="40" cy="17" r="1.5" fill="white" stroke="none"/>
    </g></svg>`;
    fly.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('aerosense:ask-fly')));
    const trail=document.createElementNS('http://www.w3.org/2000/svg','svg');trail.classList.add('fly-trail');trail.setAttribute('aria-hidden','true');
    const line=document.createElementNS(trail.namespaceURI,'polyline');line.setAttribute('fill','none');line.setAttribute('stroke','#6a987d');line.setAttribute('stroke-width','1.5');line.setAttribute('stroke-dasharray','2 6');line.setAttribute('stroke-linecap','round');trail.append(line);document.body.append(trail,fly);
    // Quiet by default for new visitors; keep any explicit previous choice.
    let on=false;try{on=localStorage.getItem('aerosense.fly')==='on';}catch{}
    let cx=innerWidth*.7,cy=innerHeight*.4,anchorX=cx,anchorY=cy,x=cx+45,y=cy,angle=0,raf=0,last=0,inside=false,phase=0,catching=false;
    const points=[];
    function sync(){button.setAttribute('aria-pressed',String(on));$('.fly-toggle__action',button).textContent=on?'Hide fly':'Show fly';button.setAttribute('aria-label',on?'Hide fly companion':'Show fly companion');const visible=on&&inside&&!reduce.matches&&!document.hidden;fly.classList.toggle('is-visible',visible);fly.tabIndex=visible?0:-1;trail.classList.toggle('is-visible',visible);if(visible&&!raf){last=performance.now();raf=requestAnimationFrame(tick);}else if(!visible){cancelAnimationFrame(raf);raf=0;points.length=0;line.setAttribute('points','');}}
    function tick(now){
      raf=0;if(!on||!inside||document.hidden||reduce.matches)return;
      const dt=Math.min(.05,(now-last)/1000);last=now;phase+=dt;
      // Let the fly explore a slowly moving neighbourhood rather than chase each pointer event.
      const anchorEase=1-Math.exp(-1.45*dt);anchorX+=(cx-anchorX)*anchorEase;anchorY+=(cy-anchorY)*anchorEase;
      const tx=catching?x:Math.max(28,Math.min(innerWidth-28,anchorX+47+27*Math.cos(phase*.72)+10*Math.cos(phase*1.39))),ty=catching?y:Math.max(28,Math.min(innerHeight-28,anchorY-24+27*Math.sin(phase*.83)+8*Math.sin(phase*1.21)));
      const ox=x,oy=y,k=1-Math.exp(-3.1*dt);x+=(tx-x)*k;y+=(ty-y)*k;
      if(Math.hypot(x-ox,y-oy)>.015){const heading=Math.atan2(y-oy,x-ox)+Math.PI/2;angle+=Math.atan2(Math.sin(heading-angle),Math.cos(heading-angle))*(1-Math.exp(-12*dt));}
      fly.style.transform=`translate(${x-19}px,${y-19}px) rotate(${angle}rad)`;
      points.push([x,y]);let length=0;for(let i=points.length-1;i>0;i--){length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);if(length>68){points.splice(0,i);break;}}if(points.length>45)points.shift();
      line.setAttribute('points',points.slice(0,-4).map(p=>p.join(',')).join(' '));raf=requestAnimationFrame(tick);
    }
    button.addEventListener('click',()=>{on=!on;try{localStorage.setItem('aerosense.fly',on?'on':'off');}catch{}sync();});
    document.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;cx=event.clientX;cy=event.clientY;if(!inside){anchorX=cx;anchorY=cy;x=cx+44;y=cy-22;inside=true;sync();}const distance=Math.hypot(cx-x,cy-y);if(on&&!catching&&distance<30)catching=true;else if(catching&&distance>58)catching=false;},{passive:true});
    document.documentElement.addEventListener('pointerleave',()=>{inside=false;sync();});
    document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);sync();
  }
})();
