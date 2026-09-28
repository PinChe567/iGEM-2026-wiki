(() => {
  'use strict';
  const figure=document.querySelector('#fig-sense-mechanism');
  const list=document.querySelector('#how-aerosense-senses .design-steps');
  if(!figure||!list)return;
  const wide=figure.querySelector('.design-schema--wide');
  const narrow=figure.querySelector('.design-schema--narrow');
  const labels=[...wide.querySelectorAll('text[y="28"]')].filter(text=>/^\d/.test(text.textContent.trim())).slice(0,4);
  if(labels.length!==4)return;
  const phases=[
    {title:'VOC recognition',features:['voc','or'],box:[85,48,205,125],text:'An odor molecule meets the tuning OR. The OR contributes ligand selectivity.'},
    {title:'OR · Orco channel',features:['or','orco','channel'],box:[66,144,225,120],text:'The tuning OR and Orco form a heteromeric ligand-gated cation channel. The tuning OR helps determine odor selectivity; Orco is the conserved co-receptor and channel partner.'},
    {title:'Ca²⁺ enters the cell',features:['channel','calcium'],box:[140,235,78,150],text:'Channel opening permits extracellular Ca²⁺ to enter the cytosol.'},
    {title:'GCaMP6f reports Ca²⁺',features:['calcium','gcamp6f'],box:[74,394,215,116],text:'Calcium binding changes the calmodulin/M13 arrangement around GCaMP6f’s circularly permuted fluorescent protein, increasing green fluorescence. mCherry marks expression in red and is not the Ca²⁺ readout.'}
  ];
  const detail=document.createElement('div');detail.className='design-phase-detail';detail.id='design-phase-detail';detail.setAttribute('aria-live','polite');
  detail.innerHTML='<h3></h3><p></p>';
  figure.after(detail);
  const mobileNav=document.createElement('nav');mobileNav.className='design-phase-mobile';mobileNav.setAttribute('aria-label','Sensing mechanism steps');
  const mobileButtons=phases.map((phase,i)=>{const button=document.createElement('button');button.type='button';button.textContent=`${i+1} · ${phase.title}`;button.addEventListener('click',()=>select(i));mobileNav.append(button);return button;});
  figure.querySelector('.wiki-figure__media').prepend(mobileNav);
  let selected=0;
  function paint(index){
    const phase=phases[index];if(!phase)return;
    detail.querySelector('h3').textContent=`0${index+1} · ${phase.title}`;
    detail.querySelector('p').textContent=phase.text;
    labels.forEach((label,i)=>{label.classList.toggle('is-active',i===selected);label.setAttribute('aria-pressed',String(i===selected));});
    mobileButtons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===selected)));
    wide.classList.add('is-phased');
    wide.querySelectorAll('[data-feature]').forEach(group=>group.classList.toggle('is-active',phase.features.includes(group.dataset.feature)));
    narrow.classList.add('is-phased');narrow.querySelectorAll('[data-feature]').forEach(group=>group.classList.toggle('is-active',phase.features.includes(group.dataset.feature)));
  }
  function select(index){selected=index;paint(index);}
  labels.forEach((label,i)=>{
    label.classList.add('design-schema__step');label.setAttribute('role','button');label.setAttribute('tabindex','0');label.setAttribute('aria-controls','design-phase-detail');
    label.addEventListener('click',()=>select(i));
    label.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(i);}});
    label.addEventListener('mouseenter',()=>paint(i));
    label.addEventListener('mouseleave',()=>paint(selected));
    label.addEventListener('focus',()=>paint(i));
    label.addEventListener('blur',()=>paint(selected));
  });
  wide.setAttribute('role','group');
  list.hidden=true;
  paint(0);
})();
