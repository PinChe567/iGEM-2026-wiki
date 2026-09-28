/* SWOT and PEST regions open as compact field-note overlays. Other atlases retain inline reading. */
(() => {
  const figures=[...document.querySelectorAll('.framework--swot,.framework--pest')];
  if(!figures.length)return;
  const dialog=document.createElement('dialog');dialog.className='framework-note';
  dialog.innerHTML='<div class="framework-note__sheet"><button type="button" class="framework-note__close" aria-label="Close analysis note">×</button><p class="framework-note__kicker">AeroSense · strategic field note</p><h2></h2><div class="framework-note__copy"></div></div>';
  document.body.append(dialog);
  const title=dialog.querySelector('h2'),copy=dialog.querySelector('.framework-note__copy');
  function open(figure,id){
    const item=figure.querySelector(`#${CSS.escape(id)}`);if(!item)return;
    title.textContent=`${figure.querySelector('header h3')?.textContent || 'Analysis'} · ${item.querySelector('summary')?.textContent || ''}`;
    copy.replaceChildren(...[...item.querySelector('.framework-cell__body')?.childNodes||[]].map(node=>node.cloneNode(true)));
    dialog.showModal?.();
    if(!dialog.showModal)dialog.setAttribute('open','');
  }
  figures.forEach(figure=>{
    figure.classList.add('has-note-dialog');
    figure.addEventListener('click',event=>{
      const link=event.target.closest('[data-atlas-target]');if(!link)return;
      event.preventDefault();event.stopPropagation();open(figure,link.getAttribute('href').slice(1));
    },true);
    figure.addEventListener('keydown',event=>{
      const link=event.target.closest('[data-atlas-target]');if(!link||!['Enter',' '].includes(event.key))return;
      event.preventDefault();event.stopPropagation();open(figure,link.getAttribute('href').slice(1));
    },true);
    figure.querySelector('.atlas-mobile')?.addEventListener('change',event=>{if(event.target.value)open(figure,event.target.value);});
  });
  dialog.querySelector('.framework-note__close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
})();
