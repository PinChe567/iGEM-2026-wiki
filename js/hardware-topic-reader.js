/* Each design route borrows original source nodes and returns them to their home. */
(() => {
 function init(){
  const config=document.getElementById('hw-topic-map'),dialog=document.querySelector('.hw-topic-view');if(!config||!dialog)return;
  const allRoutes=JSON.parse(config.textContent),routes=Object.fromEntries(['airflow','optics','pcb','enclosure','interface','manual'].filter(k=>allRoutes[k]).map(k=>[k,allRoutes[k]])),routeKeys=Object.keys(routes);
  const body=dialog.querySelector('.hw-topic-body'),title=dialog.querySelector('#hw-topic-title'),picker=dialog.querySelector('[data-topic-picker]'),toolbar=dialog.querySelector('.hw-topic-toolbar');
  const refs=document.getElementById('references'),refItems=[...refs.querySelectorAll('.ref-list > li[id]')],byId=id=>document.getElementById(id),t=s=>window.AeroSenseI18n?.t(s)||s;
  const mainDestinations={reader:'hardware-need',evidence:'hardware-verification',resources:'hardware-resources',references:'references',cellculture:'reader-cell-culture'};
  const canonical=new Map();
  const blocks=Object.fromEntries(Object.entries(routes).map(([key,r])=>[key,r.blocks.map(id=>{const n=byId(id);if(!n)throw Error('Missing Hardware block '+id);return n;})]));
  for(const key of routeKeys)for(const node of blocks[key]||[]){canonical.set(node.id,key);node.querySelectorAll('[id]').forEach(el=>canonical.set(el.id,key));}
  Object.entries({'optical-question':'optics','gas-path-results':'airflow','hardware-architecture':'enclosure','mechanical-package':'enclosure','hw-block-enclosure-build':'enclosure','electronics-bridge':'pcb','pcb-controls':'pcb','pcb-signal-flow':'pcb','reader-interface':'interface','assembly-documents':'manual','reader-user-feedback':'manual'}).forEach(([id,key])=>canonical.set(id,key));
  const originalRefs=refItems.map(li=>({li,value:li.getAttribute('value')}));
  let current='',mounted=[],savedCites=[],savedControls=[],trigger=null,epoch=0,locked=false,oldOverflow='',baseHash='#reader-story',tocItems=[],scrollFrame=0,visual=null,originScroll={x:0,y:0};
  const viewed=new Set(),topicLinks=[],groupLabels=[],reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const shell=document.createElement('div');shell.className='hw-topic-shell';
  const rail=document.createElement('aside');rail.className='hw-topic-rail';
  const topicMenu=document.createElement('nav');topicMenu.className='hw-topic-switcher';topicMenu.id='hw-topic-menu';
  const toc=document.createElement('details');toc.className='hw-topic-toc page-toc';toc.open=matchMedia('(min-width:1000px)').matches;
  const summary=document.createElement('summary');summary.className='toc__summary';const tocLabel=document.createElement('span');tocLabel.className='toc__label';summary.append(tocLabel);toc.append(summary);
  const nav=document.createElement('nav'),tocList=document.createElement('ol');nav.append(tocList);toc.append(nav);
  const column=document.createElement('div');column.className='hw-topic-column';
  const cover=document.createElement('header');cover.className='hw-topic-cover';
  const eyebrow=document.createElement('p');eyebrow.className='hw-topic-eyebrow';
  const coverCopy=document.createElement('div');coverCopy.className='hw-topic-cover__copy';coverCopy.append(eyebrow,title);
  const deck=document.createElement('p');deck.className='hw-topic-deck';coverCopy.append(deck);
  const art=document.createElementNS('http://www.w3.org/2000/svg','svg');art.classList.add('hw-topic-cover__art');art.setAttribute('viewBox','0 0 280 220');art.setAttribute('aria-hidden','true');
  art.innerHTML='<g fill="none" stroke="currentColor"><path class="hw-cover-plane" d="m36 77 104-51 104 51-104 52Z M36 119l104 51 104-51 M36 162l104 51 104-51"/><path class="hw-cover-axis" d="M140 26v187 M36 77v85 M244 77v85"/><path class="hw-cover-channel" d="m85 78 55-27 55 27-55 27Z M85 119l55 27 55-27"/><path class="hw-cover-trace" d="M14 119h22 M244 119h22"/><circle cx="140" cy="78" r="7"/></g>';
  const onward=document.createElement('footer');onward.className='hw-topic-onward';
  const onwardTitle=document.createElement('p');onwardTitle.className='hw-topic-onward__label';
  const nextLink=document.createElement('a');nextLink.className='hw-topic-next';
  const otherLinks=document.createElement('nav');otherLinks.className='hw-topic-other-links';
  const returnButton=document.createElement('button');returnButton.type='button';returnButton.className='hw-topic-return';returnButton.dataset.topicReturn='';
  onward.append(onwardTitle,nextLink,otherLinks,returnButton);
  cover.append(coverCopy,art);column.append(cover,body,onward);rail.append(topicMenu,toc);shell.append(rail,column);dialog.append(shell);
  const closeButton=dialog.querySelector('[data-topic-close]'),pickerLabel=picker.closest('label');pickerLabel.classList.add('hw-topic-picker');
  pickerLabel.hidden=true;
  const compactTitle=document.createElement('span');compactTitle.className='hw-topic-toolbar__label';toolbar.insertBefore(compactTitle,pickerLabel);
  const menuButton=document.createElement('button');menuButton.type='button';menuButton.className='hw-topic-menu-button';menuButton.dataset.topicMenu='';menuButton.setAttribute('aria-controls',topicMenu.id);menuButton.setAttribute('aria-expanded','false');toolbar.append(menuButton);
  function topicLink(key,parent){const a=document.createElement('a'),label=document.createElement('span'),status=document.createElement('span');a.href='#hardware-topic-'+key;a.dataset.hardwareView=key;label.className='hw-topic-link__label';status.className='hw-topic-link__status';status.setAttribute('aria-hidden','true');a.append(label,status);parent.append(a);topicLinks.push({key,a,label,status});}
  for(const [label,keys] of [['Product design',['airflow','optics','pcb','enclosure']],['Using the reader',['interface','manual']]]){const group=document.createElement('div'),heading=document.createElement('p'),list=document.createElement('div');group.className='hw-topic-group';heading.className='hw-topic-group__label';list.className='hw-topic-group__links';groupLabels.push({el:heading,label});for(const key of keys)if(routes[key])topicLink(key,list);group.append(heading,list);topicMenu.append(group);}
  for(const key of routeKeys)topicLink(key,otherLinks);
  const descriptions={optics:'From well geometry to fluorescence readout.',airflow:'From gas delivery to transport within each well.',pcb:'The complete signal path, controls and circuit design.',enclosure:'Structure, cooling and access for the complete assembly.',interface:'Connect, acquire and configure the reader.',manual:'Build instructions, operation and user feedback.'};
  function setMenu(open){dialog.classList.toggle('is-topics-open',open);menuButton.setAttribute('aria-expanded',String(open));}
  function cancelVisual(){visual?.cancel();visual=null;dialog.classList.remove('is-closing');}
  function animateIn(target,duration=320){if(reduced.matches)return;visual=target.animate([{opacity:0,transform:'translate3d(0,14px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration,easing:'cubic-bezier(.2,.7,.2,1)'});visual.finished.catch(()=>{});}
  function setFrame(){const header=document.querySelector('.site-header'),bottom=header?Math.max(0,header.getBoundingClientRect().bottom):72;dialog.style.setProperty('--hw-topic-top',bottom+'px');dialog.style.setProperty('--hw-topic-bar',toolbar.offsetHeight+'px');}
  function restore(){
    window.AeroSenseCitationPanels?.hide();
    savedCites.forEach(({a,text,label})=>{a.textContent=text;if(label===null)a.removeAttribute('aria-label');else a.setAttribute('aria-label',label);});savedCites=[];
    savedControls.forEach(({el,hidden,href})=>{el.hidden=hidden;if(href!==undefined)el.setAttribute('href',href);});savedControls=[];
    originalRefs.forEach(({li,value})=>{li.hidden=false;if(value===null)li.removeAttribute('value');else li.setAttribute('value',value);li.parentNode?.append(li);});refs.hidden=false;
    for(const {node,marker} of mounted.reverse())marker.replaceWith(node);mounted=[];body.replaceChildren();tocItems=[];tocList.replaceChildren();
  }
  function move(node){const marker=document.createComment('hardware topic home: '+node.id);node.before(marker);mounted.push({node,marker});body.append(node);}
  function sources(){
    const order=[],cites=[...body.querySelectorAll('a[href^="#"]')].filter(a=>refItems.some(li=>li.id===a.getAttribute('href').slice(1)));
    for(const a of cites){const id=a.getAttribute('href').slice(1);if(!order.includes(id))order.push(id);savedCites.push({a,text:a.textContent,label:a.getAttribute('aria-label')});a.textContent='['+(order.indexOf(id)+1)+']';a.setAttribute('aria-label',t('Reference')+' '+(order.indexOf(id)+1));}
    if(!order.length)return;
    move(refs);refs.hidden=false;refItems.forEach(li=>{li.hidden=!order.includes(li.id);if(order.includes(li.id))li.value=order.indexOf(li.id)+1;});
    order.forEach(id=>byId(id).parentNode.append(byId(id)));
    for(const a of refs.querySelectorAll('.ref-citation-popover a[href^="#"]')){const row=a.closest('li'),target=byId(a.getAttribute('href').slice(1));savedControls.push({el:row,hidden:row.hidden});row.hidden=!body.contains(target);}
    for(const a of refs.querySelectorAll('.ref-backlink')){const item=a.closest('.ref-list > li'),first=cites.find(c=>c.getAttribute('href')==='#'+item.id);if(first){savedControls.push({el:a,hidden:a.hidden,href:a.getAttribute('href')});a.setAttribute('href','#'+first.id);}}
  }
  function updateActive(){scrollFrame=0;if(!dialog.open||!tocItems.length)return;const threshold=dialog.getBoundingClientRect().top+toolbar.offsetHeight+(matchMedia('(max-width:999px)').matches?summary.offsetHeight:0)+36;let active=tocItems[0];for(const item of tocItems)if(item.node.getBoundingClientRect().top<=threshold)active=item;for(const item of tocItems){if(item===active)item.a.setAttribute('aria-current','location');else item.a.removeAttribute('aria-current');}}
  function makeToc(){
    tocList.replaceChildren();tocItems=[];if(!current)return;
    for(const node of [...blocks[current],...(body.contains(refs)?[refs]:[])]){
      const heading=node.matches('h2,h3')?node:node.querySelector('h2,h3'),label=node===refs?'References':routes[current].toc?.[node.id]||heading?.textContent.trim();if(!label)continue;
      const li=document.createElement('li'),a=document.createElement('a'),number=document.createElement('span'),text=document.createElement('span');
      number.className='tech-label';number.textContent=String(tocItems.length+1).padStart(2,'0');text.className='toc-text';text.textContent=t(label);a.href='#'+node.id;a.dataset.topicSection=node.id;a.append(number,text);li.append(a);tocList.append(li);tocItems.push({node,a});
    }updateActive();
  }
  function labels(){
    const position=routeKeys.indexOf(current)+1;
    title.textContent=t(routes[current]?.title||'');eyebrow.textContent=current?String(position).padStart(2,'0')+' / '+String(routeKeys.length).padStart(2,'0')+' · '+t('Hardware'):'';deck.textContent=t(routes[current]?.description||descriptions[current]||'');
    compactTitle.textContent=current?t(routes[current].title)+' · '+position+' / '+routeKeys.length:t('Hardware');closeButton.textContent='← '+t('Back to Hardware');returnButton.textContent='← '+t('Back to Hardware');tocLabel.textContent=t('On this page');nav.setAttribute('aria-label',t('Table of contents'));picker.setAttribute('aria-label',t('Read another topic'));
    menuButton.textContent=t('All Hardware topics');topicMenu.setAttribute('aria-label',t('All Hardware topics'));otherLinks.setAttribute('aria-label',t('Other Hardware topics'));groupLabels.forEach(({el,label})=>el.textContent=t(label));
    for(const {key,a,label,status} of topicLinks){label.textContent=t(routes[key].title);a.dataset.viewed=String(viewed.has(key));status.textContent=viewed.has(key)&&key!==current?'•':'';a.setAttribute('aria-label',t(routes[key].title)+(viewed.has(key)&&key!==current?', '+t('Viewed'):''));if(key===current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
    onwardTitle.textContent=t('Continue exploring');if(current){const isLast=position===routeKeys.length;returnButton.hidden=isLast;if(isLast){nextLink.href='#reader-story';delete nextLink.dataset.hardwareView;nextLink.dataset.topicReturn='';nextLink.textContent='← '+t('Back to Hardware');}else{const next=routeKeys[position];nextLink.href='#hardware-topic-'+next;nextLink.dataset.hardwareView=next;delete nextLink.dataset.topicReturn;nextLink.textContent=t('Next topic')+': '+t(routes[next].title)+' →';}}
    for(const option of picker.options)option.textContent=t(routes[option.value].title);makeToc();
  }
  function reveal(id,{focus=false}={}){
    const target=byId(id);if(!target||!dialog.contains(target))return;
    for(let p=target.parentElement;p&&p!==dialog;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
    requestAnimationFrame(()=>{setFrame();const top=target.getBoundingClientRect().top-dialog.getBoundingClientRect().top+dialog.scrollTop-toolbar.offsetHeight-(matchMedia('(max-width:999px)').matches?summary.offsetHeight:0)-24;dialog.scrollTo({top:Math.max(0,top),behavior:'auto'});updateActive();
      if(focus){const focusTarget=target.querySelector('h2,h3')||target;if(!focusTarget.hasAttribute('tabindex')){focusTarget.tabIndex=-1;focusTarget.addEventListener('blur',()=>focusTarget.removeAttribute('tabindex'),{once:true});}focusTarget.focus({preventScroll:true});}
      if(target.matches('a.cite')){const p=target.closest('p,figcaption,li')||target;p.classList.add('is-citation-highlight');setTimeout(()=>p.classList.remove('is-citation-highlight'),4000);}
    });
  }
  async function close({push=true,returnFocus=true,animate=true}={}){
    const seq=++epoch;cancelVisual();setMenu(false);window.AeroSenseCitationPanels?.hide();
    if(dialog.open&&animate&&!reduced.matches){dialog.classList.add('is-closing');visual=dialog.animate([{opacity:1,transform:'translate3d(0,0,0)'},{opacity:0,transform:'translate3d(0,10px,0)'}],{duration:180,easing:'cubic-bezier(.4,0,.8,.3)',fill:'forwards'});try{await visual.finished;}catch{}if(seq!==epoch)return false;}
    if(seq!==epoch)return false;cancelVisual();dialog.classList.remove('is-visible');if(dialog.open)dialog.close();restore();current='';
    if(locked){document.body.style.overflow=oldOverflow;window.scrollTo({left:originScroll.x,top:originScroll.y,behavior:'instant'});}locked=false;window.AeroSenseHardwareStory?.restore();
    if(push)history.replaceState({...history.state,hardwareTopic:null},'',baseHash.startsWith('#hardware-topic-')?'#reader-story':baseHash);if(returnFocus)trigger?.focus?.({preventScroll:true});return true;
  }
  async function navigateMain(id,{push=true}={}){if(!byId(id))id='reader-story';const closed=await close({push:false,returnFocus:false});if(!closed)return;if(push)history.pushState({...history.state,hardwareTopic:null},'','#'+id);else if(location.hash.startsWith('#hardware-topic-'))history.replaceState({...history.state,hardwareTopic:null},'','#'+id);const target=byId(id),header=document.querySelector('.site-header');if(target)window.scrollTo({top:window.scrollY+target.getBoundingClientRect().top-(header?.getBoundingClientRect().height||72)-24,behavior:'instant'});}
  function open(key,{focusId='',from=null,push=true,animate=true}={}){
    if(!routes[key]){navigateMain(mainDestinations[key]||'reader-story',{push});return;}
    ++epoch;cancelVisual();const wasOpen=dialog.open;setMenu(false);
    if(!locked){trigger=from||document.activeElement;const hash=location.hash.slice(1);baseHash=hash&&!hash.startsWith('hardware-topic-')&&!keyFor(byId(hash))?location.hash:'#reader-story';originScroll={x:scrollX,y:scrollY};oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';locked=true;}
    if(!wasOpen)window.AeroSenseHardwareStory?.focus(key);
    restore();current=key;blocks[key].forEach(move);
    if(routes[key].related?.length){const actions=document.createElement('div');actions.className='hw-related-actions';actions.setAttribute('role','navigation');actions.setAttribute('aria-label',t('Related design'));for(const item of routes[key].related){const a=document.createElement('a');a.href=item.href||'#hardware-topic-'+item.topic;if(item.topic)a.dataset.hardwareView=item.topic;a.textContent=t(item.label);actions.append(a);}body.append(actions);}
    sources();viewed.add(key);picker.value=key;labels();dialog.dataset.topic=key;if(!dialog.open)dialog.showModal();setFrame();dialog.scrollTop=0;dialog.classList.add('is-visible');if(animate)animateIn(wasOpen?column:dialog,wasOpen?240:320);requestAnimationFrame(updateActive);
    if(push)history.pushState({...history.state,hardwareTopic:key},'','#hardware-topic-'+key);if(focusId)reveal(focusId);else{title.tabIndex=-1;title.focus({preventScroll:true});}
    document.dispatchEvent(new CustomEvent('hardware:topic-open',{detail:{key}}));
  }
  function keyFor(target){if(!target)return null;if(current&&blocks[current].some(n=>n===target||n.contains(target)))return current;return canonical.get(target.id)||null;}
  function fromLocation(){const hash=decodeURIComponent(location.hash.slice(1));if(hash.startsWith('hardware-topic-')){open(hash.slice(15),{push:false,animate:false});return;}const target=byId(hash),key=keyFor(target);if(key)open(key,{focusId:hash,push:false,animate:false});else if(dialog.open)close({push:false,animate:false});}
  picker.replaceChildren();for(const [key,r] of Object.entries(routes)){const option=document.createElement('option');option.value=key;option.textContent=t(r.title);picker.append(option);}labels();
  picker.addEventListener('change',()=>open(picker.value));closeButton.addEventListener('click',()=>close());returnButton.addEventListener('click',()=>close());menuButton.addEventListener('click',()=>setMenu(!dialog.classList.contains('is-topics-open')));
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented){e.preventDefault();e.stopPropagation();if(dialog.classList.contains('is-topics-open')){setMenu(false);menuButton.focus();}else close();}});
  dialog.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateActive);},{passive:true});toc.addEventListener('toggle',()=>{if(matchMedia('(min-width:1000px)').matches&&!toc.open)toc.open=true;if(dialog.open)setFrame();});
  const tocDesktop=matchMedia('(min-width:1000px)');tocDesktop.addEventListener('change',e=>{toc.open=e.matches;summary.tabIndex=e.matches?-1:0;});summary.tabIndex=tocDesktop.matches?-1:0;
  document.addEventListener('hardware:topic',e=>open(e.detail.key,{from:e.detail.trigger}));
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    if(a.hasAttribute('data-topic-return')){e.preventDefault();e.stopImmediatePropagation();close();return;}
    const url=new URL(a.href,location.href);if(url.origin!==location.origin||url.pathname!==location.pathname||!url.hash)return;
    if(a.dataset.topicSection){e.preventDefault();e.stopImmediatePropagation();if(matchMedia('(max-width:999px)').matches)toc.open=false;history.replaceState({...history.state,hardwareTopic:current},'',url.hash);reveal(a.dataset.topicSection,{focus:true});return;}
    const explicit=a.dataset.hardwareView||a.dataset.productKey||(/^#hardware-topic-/.test(url.hash)?url.hash.slice(16):null);
    if(explicit){e.preventDefault();e.stopImmediatePropagation();open(explicit,{from:a});return;}
    const target=byId(decodeURIComponent(url.hash.slice(1)));
    if(dialog.contains(target)){if(a.classList.contains('ref-backlink')){const item=a.closest('.ref-list > li'),cites=[...body.querySelectorAll('a.cite')].filter(c=>c.getAttribute('href')==='#'+item?.id);if(cites.length===1){e.preventDefault();e.stopImmediatePropagation();reveal(cites[0].id);}}return;}
    const key=keyFor(target);if(key){e.preventDefault();e.stopImmediatePropagation();open(key,{focusId:target.id,from:a});}
    else if(dialog.open&&target){e.preventDefault();e.stopImmediatePropagation();navigateMain(target.id);}
  },true);
  addEventListener('popstate',fromLocation);addEventListener('hashchange',()=>{if(!dialog.open)fromLocation();});addEventListener('resize',()=>{if(dialog.open){setFrame();updateActive();}});
  document.addEventListener('aerosense:languagechange',()=>{labels();if(dialog.open)setFrame();});
  document.body.classList.add('hw-map-ready');fromLocation();
 }
 if(document.readyState==='complete')init();else addEventListener('load',init,{once:true});
})();
