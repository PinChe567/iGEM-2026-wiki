/* Keep the construct identity, current plasmid and atlas in one reading place. */
(() => {
  const explorer=document.querySelector('[data-parts-explorer]');
  const maps=explorer?.querySelector('.parts-explorer__maps');
  const identity=explorer?.querySelector('.parts-or-card');
  const atlas=document.getElementById('plasmid-atlas');
  if(!maps||!identity||!atlas)return;
  maps.prepend(identity);
  const archive=document.createElement('details');archive.className='parts-atlas-archive';archive.id='plasmid-atlas';
  const summary=document.createElement('summary');summary.textContent='Browse all construct maps';archive.append(summary);
  [...atlas.children].forEach(child=>{if(child.tagName!=='H2')archive.append(child);});
  atlas.replaceWith(document.createComment('Construct maps moved beside the active plasmid.'));
  maps.append(archive);
})();
