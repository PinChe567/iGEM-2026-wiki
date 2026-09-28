/* Two frame-matched MP4s. Native scrolling remains unrestricted. */
(() => {
 'use strict';
 const root=document.querySelector('[data-ink-film]');if(!root)return;
 const stage=root.querySelector('.ink-film__stage'),video=root.querySelector('[data-film-main]'),scan=root.querySelector('[data-film-scan]');
 const captions=[...root.querySelectorAll('[data-film-caption]')],count=root.querySelector('[data-film-count]');
 const play=root.querySelector('[data-film-play]'),lens=root.querySelector('[data-film-lens]'),read=root.querySelector('[data-film-read]'),status=root.querySelector('[data-film-status]'),transcript=document.querySelector('#film-transcript');
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');let desired=0,playing=false,raf=0,active=-1,lensOn=false,ready=false;
 const local=['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname);
 const header=document.querySelector('.site-header');
 if(header&&'ResizeObserver' in window)new ResizeObserver(()=>root.style.setProperty('--film-header',`${header.getBoundingClientRect().height}px`)).observe(header);
 const duration=()=>Number.isFinite(video.duration)?Math.max(.1,video.duration-.05):29.95;
 const scrollFraction=t=>{const chapter=Math.min(5,Math.floor(t/5));return (chapter+Math.min(1,(t-chapter*5)/5)*.68)/6;};
 const topOffset=()=>parseFloat(getComputedStyle(stage).top)||0;
 const source=el=>el.dataset.igemSrc||el.dataset.localSrc||'';
 const loading=new Set();
 async function loadMedia(el){if(loading.has(el)||el.getAttribute('src'))return;loading.add(el);try{const src=source(el);if(!src)throw new Error('No media source');
   // Python's simple preview server does not serve byte ranges. A complete Blob
   // makes local reverse seeking reliable; deployed iGEM media uses its URL.
   if(local&&!el.dataset.igemSrc){const response=await fetch(src);if(!response.ok)throw new Error('Media unavailable');el.src=URL.createObjectURL(await response.blob());}
   else el.src=src;el.preload='auto';el.load();
 }catch{el.dispatchEvent(new Event('error'));}finally{loading.delete(el);}}
 function caption(t){const index=Math.min(5,Math.floor(t/5));if(active!==index){active=index;captions.forEach((p,i)=>{p.classList.toggle('is-active',i===index);p.setAttribute('aria-hidden',String(i!==index));});}count.textContent=String(index+1).padStart(2,'0')+' / 06';}
 function syncState(){root.classList.toggle('is-synced',lensOn&&scan.readyState>=2&&!video.seeking&&!scan.seeking&&Math.abs(video.currentTime-scan.currentTime)<.09);}
 function seek(el){if(el.readyState<1||el.seeking)return;const target=Math.min(desired,el.duration-.05);if(Math.abs(el.currentTime-target)>.035)el.currentTime=Math.max(0,target);else syncState();}
 function update(){raf=0;if(playing||!ready||reduce.matches||!root.classList.contains('is-scroll'))return;const range=root.offsetHeight-stage.offsetHeight;desired=Math.max(0,Math.min(1,(topOffset()-root.getBoundingClientRect().top)/Math.max(1,range)))*6;const chapter=Math.min(5,Math.floor(desired));const phase=desired-chapter;desired=Math.min(duration(),(chapter+Math.min(1,phase/.68))*5);desired=Math.round(desired*24)/24;seek(video);if(lensOn)seek(scan);caption(desired);}
 function requestUpdate(){if(!raf)raf=requestAnimationFrame(update);}
 function pause(){playing=false;video.pause();play.textContent='Play film';}
 function jump(t){pause();desired=Math.max(0,Math.min(duration(),t));if(root.classList.contains('is-scroll')){const top=scrollY+root.getBoundingClientRect().top-topOffset();window.scrollTo({top:top+(root.offsetHeight-stage.offsetHeight)*scrollFraction(desired),behavior:'instant'});}seek(video);if(lensOn)seek(scan);caption(desired);}
 function fail(){pause();root.classList.remove('is-scroll','is-ready');ready=false;status.textContent='Film unavailable. The illustrated story is available below.';play.disabled=true;lens.disabled=true;transcript.open=true;caption(0);}
 video.addEventListener('loadedmetadata',()=>{ready=true;play.disabled=reduce.matches;lens.disabled=reduce.matches;root.classList.toggle('is-scroll',innerHeight>=620&&!reduce.matches);status.textContent='';requestUpdate();});
 video.addEventListener('loadeddata',()=>{root.classList.add('is-ready');status.textContent='';});
 for(const el of [video,scan]){el.addEventListener('seeking',()=>root.classList.remove('is-synced'));el.addEventListener('seeked',()=>{el.dataset.frameTime=String(el.currentTime);if(!playing||el===scan)seek(el);syncState();});}
 scan.addEventListener('loadedmetadata',()=>seek(scan));scan.addEventListener('loadeddata',syncState);
 video.addEventListener('error',fail);scan.addEventListener('error',()=>{lensOn=false;root.classList.remove('is-lens');lens.setAttribute('aria-pressed','false');lens.disabled=true;status.textContent='Scent layer unavailable; the main film remains available.';});
 video.addEventListener('timeupdate',()=>{if(!playing)return;desired=video.currentTime;caption(desired);if(lensOn)seek(scan);if(root.classList.contains('is-scroll')){const top=scrollY+root.getBoundingClientRect().top-topOffset();window.scrollTo({top:top+(root.offsetHeight-stage.offsetHeight)*scrollFraction(desired),behavior:'instant'});}});
 video.addEventListener('ended',pause);
 play.addEventListener('click',async()=>{if(playing){pause();return;}if(!ready)return;if(video.currentTime>duration()-.2)jump(0);playing=true;play.textContent='Pause film';try{await video.play();}catch{pause();status.textContent='Scroll to explore the film, or read the illustrated story.';}});
 lens.addEventListener('click',()=>{lensOn=!lensOn;root.classList.toggle('is-lens',lensOn);lens.setAttribute('aria-pressed',String(lensOn));lens.textContent=lensOn?'Scent lens ON · return to ordinary view':'Activate AeroSense · reveal the scent';if(lensOn)loadMedia(scan);if(lensOn)seek(scan);syncState();});
 stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const b=stage.getBoundingClientRect();root.style.setProperty('--lens-x',`${e.clientX-b.left}px`);root.style.setProperty('--lens-y',`${e.clientY-b.top}px`);},{passive:true});
 read.addEventListener('click',()=>{pause();transcript.open=true;transcript.scrollIntoView({block:'start',behavior:'instant'});});
 addEventListener('scroll',requestUpdate,{passive:true});addEventListener('resize',()=>{root.classList.toggle('is-scroll',ready&&innerHeight>=620&&!reduce.matches);requestUpdate();},{passive:true});
 ['wheel','touchstart'].forEach(type=>addEventListener(type,()=>{if(playing)pause();},{passive:true}));
 addEventListener('keydown',e=>{if(playing&&['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)&&!e.target.closest('button,input,select'))pause();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 function configure(){
   pause();const src=source(video);root.querySelector('.ink-film__controls').hidden=false;
   if(reduce.matches||!src){root.classList.remove('is-scroll');play.disabled=true;lens.disabled=true;status.textContent=reduce.matches?'Reduced motion: read the illustrated story below.':'Illustrated preview · film hosting is pending.';caption(0);return;}
   // Reserve the scroll space before media metadata arrives: deep links must
   // not move when the video finishes loading.
   root.classList.toggle('is-scroll',innerHeight>=620);
   play.disabled=!ready;lens.disabled=!ready;
   if(!video.getAttribute('src')){status.textContent='Loading the illustrated film…';loadMedia(video);}
   requestUpdate();
 }
 let printWasOpen=false;addEventListener('beforeprint',()=>{printWasOpen=transcript.open;transcript.open=true;});addEventListener('afterprint',()=>{transcript.open=printWasOpen;});
 reduce.addEventListener('change',configure);configure();
})();
