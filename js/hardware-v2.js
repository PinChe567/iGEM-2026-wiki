/* BEGIN IGEM STATIC MEDIA MAP __igem_media_js_hardware_v2_js */
function __igem_media_js_hardware_v2_js(value) {
  var original = value, text = String(value), split = text.search(/[?#]/);
  var key = split < 0 ? text : text.slice(0, split), suffix = split < 0 ? "" : text.slice(split);
  try { key = decodeURIComponent(key); } catch (_) { return original; }
  key = key.replace(/^(?:\.\/)+/, "");
  var urls = {"../assets/hardware/optics-v38/spectral-alignment-en.png":"https://static.igem.wiki/teams/6460/wiki/hardware/spectral-alignment-en.svg","../assets/hardware/optics-v38/spectral-alignment-en.svg":"https://static.igem.wiki/teams/6460/wiki/hardware/spectral-alignment-en.svg","../assets/hardware/optics-v38/spectral-alignment-zh-Hant.png":"https://static.igem.wiki/teams/6460/wiki/hardware/spectral-alignment-zh-hant.svg","../assets/hardware/optics-v38/spectral-alignment-zh-Hant.svg":"https://static.igem.wiki/teams/6460/wiki/hardware/spectral-alignment-zh-hant.svg","assets/hardware/optics-v38/spectral-alignment-en.png":"https://static.igem.wiki/teams/6460/wiki/hardware/spectral-alignment-en.svg","assets/hardware/optics-v38/spectral-alignment-en.svg":"https://static.igem.wiki/teams/6460/wiki/hardware/spectral-alignment-en.svg","assets/hardware/optics-v38/spectral-alignment-zh-Hant.png":"https://static.igem.wiki/teams/6460/wiki/hardware/spectral-alignment-zh-hant.svg","assets/hardware/optics-v38/spectral-alignment-zh-Hant.svg":"https://static.igem.wiki/teams/6460/wiki/hardware/spectral-alignment-zh-hant.svg"};
  var target = urls[key]; if (!target) return original;
  var hashAt = target.indexOf("#"), savedHash = hashAt < 0 ? "" : target.slice(hashAt);
  if (hashAt >= 0) target = target.slice(0, hashAt);
  var suffixHash = suffix.indexOf("#"), query = suffixHash < 0 ? suffix : suffix.slice(0, suffixHash);
  if (query) target += (target.indexOf("?") < 0 ? "?" : "&") + query.slice(1);
  return target + (suffixHash < 0 ? savedHash : suffix.slice(suffixHash));
}
/* END IGEM STATIC MEDIA MAP __igem_media_js_hardware_v2_js */
/* Rich previews are optional; all decisive evidence is already in the HTML. */
function revealLinkedAppendix() {
  let id;
  try { id=decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target=document.getElementById(id);
  if(!target)return;
  let opened=false;
  for(let ancestor=target;ancestor;ancestor=ancestor.parentElement){
    if(ancestor.tagName==='DETAILS'&&!ancestor.open){ancestor.open=true;opened=true;}
  }
  if(opened)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}
window.addEventListener('hashchange',revealLinkedAppendix);
revealLinkedAppendix();

function updateOpticalSpectraLanguage() {
  const language = document.documentElement.lang === 'zh-Hant' ? 'zh-Hant' : 'en';
  const base = 'assets/hardware/optics-v38/spectral-alignment-' + language;
  document.querySelectorAll('[data-optics-spectral-image]').forEach(image => { image.src = __igem_media_js_hardware_v2_js(base + '.svg'); });
  document.querySelectorAll('[data-optics-spectral-link]').forEach(link => { link.href = __igem_media_js_hardware_v2_js(base + '.svg'); });
  document.querySelectorAll('[data-optics-spectral-png]').forEach(link => { link.href = __igem_media_js_hardware_v2_js(base + '.png'); });
}
document.addEventListener('aerosense:languagechange', updateOpticalSpectraLanguage);
updateOpticalSpectraLanguage();
document.querySelectorAll('details[data-hw-v2-preview]').forEach((details) => {
  details.addEventListener('toggle', () => {
    const frame = details.querySelector('iframe[data-src]');
    if (!frame) return;
    if (details.open) {
      if (!frame.hasAttribute('src')) frame.src = frame.dataset.src;
    } else {
      frame.removeAttribute('src');
    }
  });
});
document.querySelectorAll('[data-hw-v2-assembly]').forEach((host) => {
  let viewer, loading;
  async function loadAssembly() {
    if (viewer) return;
    if (loading) return;
    loading = true;
    host.dataset.productLoading = 'true';
    const status = host.querySelector('[data-hw-v2-status]');
    status.textContent = 'Loading the eight current CAD parts…';
    try {
      const module = await import('./hardware-v2-viewer.js?v=c9b0b2097fdb64ca');
      viewer = await module.createViewer(host);
      await viewer.firstFrame;
      host.classList.add('is-ready');
      status.textContent = 'Drag to rotate · arrow keys rotate · + / − zoom · separate parts with the slider.';
    } catch (error) {
      host.classList.add('is-unavailable');
      status.textContent = 'The 3D view is unavailable on this device. Use the assembly drawing and eight source STLs below.';
      console.warn('CAD preview unavailable', error);
    } finally { loading = false; host.dataset.productLoading = 'false'; }
  }
  // Show the product without an extra click; defer its geometry until the stage is nearby.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); loadAssembly(); }
    }, {rootMargin:'400px'});
    observer.observe(host);
  } else loadAssembly();
});

// Feedback stays inside the slow media region. It never captures pointer events,
// starts playback, replaces an iframe URL, or delays reading the surrounding page.
function localMediaLoader(container, target, kind) {
  container.classList.add('hw-local-media');
  // Preserve the product scene's absolute positioning and full-stage canvas.
  if(getComputedStyle(container).position==='static')container.classList.add('hw-local-media--positioned');
  const status=document.createElement('span');status.className='hw-local-loader';status.setAttribute('role','status');
  const card=document.createElement('span');card.className='hw-local-loader__card';
  // Reuse the Learning Lab field-guide fly from index.html: same paths and colors,
  // with wings and legs grouped for a lightweight dance while this media loads.
  card.innerHTML=`<svg class="hw-local-loader__scene" viewBox="0 0 160 170" fill="none" aria-hidden="true" focusable="false">
    <circle cx="80" cy="79" r="61" stroke="currentColor" stroke-width=".7" stroke-dasharray="2 6" opacity=".6"/>
    <ellipse cx="80" cy="79" rx="38" ry="69" transform="rotate(35 80 79)" stroke="currentColor" stroke-width=".8" opacity=".45"/>
    <g class="hw-local-loader__dance">
      <g class="hw-local-loader__wing hw-local-loader__wing--left">
        <path d="M83 57C63 33 20 38 32 67 37 81 61 83 82 76" fill="#cbd9ae" fill-opacity=".5" stroke="#73845b" stroke-width="1.4"/>
        <path d="M82 73 54 59" stroke="#73845b" stroke-width="1.5"/>
      </g>
      <g class="hw-local-loader__wing hw-local-loader__wing--right">
        <path d="M85 57C100 20 139 27 128 55 122 69 105 74 85 77" fill="#cbd9ae" fill-opacity=".5" stroke="#73845b" stroke-width="1.4"/>
        <path d="M85 68 115 43" stroke="#73845b" stroke-width="1.5"/>
      </g>
      <g class="hw-local-loader__legs hw-local-loader__legs--left" stroke="#73845b" stroke-width="1.5"><path d="M75 88 54 98 43 116M75 78 51 78 39 86"/></g>
      <g class="hw-local-loader__legs hw-local-loader__legs--right" stroke="#73845b" stroke-width="1.5"><path d="M92 88 116 96 125 112M95 75 121 73 133 78"/></g>
      <ellipse cx="84" cy="88" rx="10" ry="26" transform="rotate(-8 84 88)" fill="#d7b367" stroke="#6f744c" stroke-width="1.4"/>
      <path d="M75 84 94 82M75 94 94 91M78 103 92 100" stroke="#8e7950" stroke-width="2"/>
      <ellipse cx="83" cy="61" rx="11" ry="12" fill="#bbc690" stroke="#6f744c" stroke-width="1.4"/>
      <circle cx="76" cy="60" r="4" fill="#b96950"/><circle cx="90" cy="58" r="4" fill="#b96950"/>
      <path d="M79 50 75 38M86 49 90 38" stroke="#6f744c" stroke-width="1.4" stroke-linecap="round"/>
    </g>
    <circle cx="29" cy="120" r="4" fill="#c47a57"/><circle cx="135" cy="100" r="3" fill="#b1c590"/><circle cx="114" cy="145" r="4" fill="#e0c47c"/>
    <path d="M49 151h63M66 158h30" stroke="#a5af8b" stroke-width="1"/>
  </svg>`;
  const label=document.createElement('span');label.className='hw-local-loader__label';card.append(label);status.append(card);container.append(status);status.hidden=true;
  function translate(){const zh=document.documentElement.lang==='zh-Hant';label.textContent=kind==='model'?(zh?'正在載入 3D 模型…':'Loading 3D model…'):(zh?'正在載入播放器…':'Loading player…');}
  let failed=false;
  const retry=document.createElement('button');retry.type='button';retry.className='hw-local-loader__retry';retry.hidden=true;
  retry.addEventListener('click',()=>location.reload());card.append(retry);
  const initialTranslate=translate;
  translate=()=>{initialTranslate();const zh=document.documentElement.lang==='zh-Hant';if(failed)label.textContent=zh?'3D 模型無法顯示，請重新載入或查看下方圖面。':'The 3D model could not display. Reload or use the drawings below.';retry.textContent=zh?'重新載入':'Reload';};
  function finish(){failed=false;status.hidden=true;target.setAttribute('aria-busy','false');}
  function start(){failed=false;status.classList.remove('is-error');retry.hidden=true;translate();status.hidden=false;target.setAttribute('aria-busy','true');}
  function fail(){failed=true;status.classList.add('is-error');retry.hidden=false;translate();status.hidden=false;target.setAttribute('aria-busy','false');}
  document.addEventListener('aerosense:languagechange',translate);
  return {start,finish,fail};
}
document.querySelectorAll('[data-hardware-product-story], [data-hw-v2-assembly]').forEach(host=>{
  const region=host.querySelector('.hw-product-scene')||host,canvas=host.querySelector('canvas');if(!canvas)return;
  const loader=localMediaLoader(region,canvas,'model');
  const update=()=>{if(host.classList.contains('is-unavailable')||host.dataset.productError==='true')loader.fail();else if(host.dataset.productFrameReady==='true')loader.finish();else loader.start();};
  new MutationObserver(update).observe(host,{attributes:true,attributeFilter:['class','data-product-loading','data-product-frame-ready','data-product-error']});
  host.addEventListener('productfirstframe',update);host.addEventListener('producterror',loader.fail);
  canvas.addEventListener('webglcontextlost',loader.fail);update();
});

// Keep the two manuals in one reading space, with their PDF readers intact.
function hardwareManualTabs() {
  const host=document.querySelector('.page-hardware .hw-manuals');
  if(!host||host.dataset.manualTabs)return;
  const panels=Array.from(host.children).filter(el=>el.classList.contains('hw-manual-document')).slice(0,2);
  if(panels.length!==2)return;
  host.dataset.manualTabs='true';
  const frames=panels.map(panel=>panel.querySelector('iframe.hw-v2-preview'));
  const nav=document.createElement('div');nav.className='hw-manual-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Manuals');
  const tabs=panels.map((panel,index)=>{
    const heading=panel.querySelector('h3');
    const tab=document.createElement('button');tab.type='button';tab.id='hw-manual-tab-'+index;tab.setAttribute('role','tab');
    tab.innerHTML='<span aria-hidden="true">'+(index?'→':'←')+'</span>';
    const label=document.createElement('span');label.textContent=heading.textContent;tab.append(label);
    panel.id=panel.id||'hw-manual-panel-'+index;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);
    tab.setAttribute('aria-controls',panel.id);heading.classList.add('hw-manual-panel-title');nav.append(tab);return tab;
  });
  panels[0].before(nav);
  function select(index,focus=false){
    panels.forEach((panel,i)=>{const active=i===index;panel.hidden=!active;tabs[i].setAttribute('aria-selected',String(active));tabs[i].tabIndex=active?0:-1;
      const reader=frames[i]?._aeroSensePdfReader;if(reader)reader.setActive(active);
    });
    if(focus)tabs[index].focus();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>select(index));
    tab.addEventListener('keydown',event=>{let target;if(event.key==='ArrowRight'||event.key==='ArrowLeft')target=1-index;else if(event.key==='Home')target=0;else if(event.key==='End')target=1;else return;event.preventDefault();select(target,true);});
  });
  select(0);
}

// Numbered regions connect each instruction to the actual interface screenshot.
function hardwareInterfaceGuide() {
  const layout=document.querySelector('.page-hardware .hw-ui-overview');
  if(!layout||layout.dataset.interfaceGuide)return;
  const figure=layout.querySelector('#figure-14'),image=figure?.querySelector('img'),link=figure?.querySelector('a');
  const items=Array.from(layout.querySelectorAll('.hw-v4-ui-steps > li'));
  if(!image||!link||items.length!==4)return;
  layout.dataset.interfaceGuide='true';layout.classList.add('hw-ui-guide');
  const stage=document.createElement('div');stage.className='hw-ui-guide__image';link.before(stage);stage.append(link);
  const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.classList.add('hw-ui-guide__leaders');overlay.setAttribute('aria-hidden','true');
  const path=document.createElementNS(overlay.namespaceURI,'path');overlay.append(path);layout.append(overlay);
  // Percent coordinates refer to the supplied 585 × 1180 screenshot.
  const regions=[[2.4,9.2,95,4.6],[4.4,20.8,91,23.3],[2.4,74.4,95,24.5],[50.9,45,43.6,4.2]];
  const entries=items.map((item,index)=>{
    const heading=item.querySelector('h3'),details=document.createElement('details'),summary=document.createElement('summary');
    details.className='hw-ui-guide__step';summary.innerHTML='<span class="hw-ui-guide__number" aria-hidden="true">'+String(index+1).padStart(2,'0')+'</span>';
    summary.append(heading);const body=document.createElement('div');body.className='hw-ui-guide__body';
    Array.from(item.childNodes).forEach(node=>body.append(node));details.append(summary,body);item.append(details);
    const box=document.createElement('button');box.type='button';box.className='hw-ui-guide__region';
    box.innerHTML='<span aria-hidden="true">'+String(index+1).padStart(2,'0')+'</span>';
    ['left','top','width','height'].forEach((key,i)=>box.style[key]=regions[index][i]+'%');
    box.setAttribute('aria-controls',item.id);stage.append(box);
    return {item,heading,details,summary,box};
  });
  let selected=0,frame=0;
  function draw(){
    frame=0;const entry=entries[selected],area=layout.getBoundingClientRect(),from=entry.box.getBoundingClientRect(),to=entry.summary.getBoundingClientRect();
    overlay.setAttribute('viewBox','0 0 '+area.width+' '+area.height);
    const x1=from.right-area.left,y1=from.top+from.height/2-area.top,x2=to.left-area.left-8,y2=to.top+to.height/2-area.top;
    const bend=x1+Math.max(12,(x2-x1)*.5);
    path.setAttribute('d',`M${x1} ${y1}H${bend}V${y2}H${x2}`);
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
  function updateLabels(){entries.forEach(entry=>entry.box.setAttribute('aria-label',entry.heading.textContent));schedule();}
  function select(index,open=false){selected=index;entries.forEach((entry,i)=>{const active=i===index;entry.box.classList.toggle('is-active',active);entry.item.classList.toggle('is-active',active);if(open&&entry.details.open!==active)entry.details.open=active;entry.box.setAttribute('aria-expanded',String(entry.details.open));});schedule();}
  entries.forEach((entry,index)=>{
    entry.box.addEventListener('click',()=>{select(index,true);entry.summary.focus({preventScroll:true});});
    entry.summary.addEventListener('focus',()=>select(index));
    entry.details.addEventListener('toggle',()=>{if(entry.details.open){select(index);entries.forEach((other,i)=>{if(i!==index)other.details.open=false;});}entry.box.setAttribute('aria-expanded',String(entry.details.open));schedule();});
  });
  if('ResizeObserver' in window)new ResizeObserver(schedule).observe(layout);
  image.addEventListener('load',schedule);window.addEventListener('resize',schedule);document.addEventListener('aerosense:languagechange',updateLabels);
  updateLabels();select(0);
}
hardwareManualTabs();
hardwareInterfaceGuide();
