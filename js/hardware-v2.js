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
    const status = host.querySelector('[data-hw-v2-status]');
    status.textContent = 'Loading the eight current CAD parts…';
    try {
<<<<<<< HEAD
      const module = await import('./hardware-v2-viewer.js?v=20261011-low-poly');
=======
      const module = await import('./hardware-v2-viewer.js?v=20261008-studio');
>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0
      viewer = await module.createViewer(host);
      host.classList.add('is-ready');
      status.textContent = 'Drag to rotate · arrow keys rotate · + / − zoom · separate parts with the slider.';
    } catch (error) {
      host.classList.add('is-unavailable');
      status.textContent = 'The 3D view is unavailable on this device. Use the assembly drawing and eight source STLs below.';
      console.warn('CAD preview unavailable', error);
    } finally { loading = false; }
  }
  // Show the product without an extra click; defer its geometry until the stage is nearby.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); loadAssembly(); }
    }, {rootMargin:'400px'});
    observer.observe(host);
  } else loadAssembly();
});
