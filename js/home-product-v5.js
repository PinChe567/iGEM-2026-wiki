/* The static reading alternative retains the same removable-lid interaction. */
(() => {
 'use strict';
 document.querySelectorAll('[data-home-product-static]').forEach(button => {
  button.addEventListener('click', () => {
   const open=button.getAttribute('aria-pressed')!=='true';
   button.setAttribute('aria-pressed',String(open));
   button.setAttribute('aria-label',open?'Close the CAD reader lid':'Open the CAD reader lid');
   const caption=button.closest('.asc-product-study').querySelector('[data-home-product-state]');
   if(caption)caption.textContent=open?'Lid open · click to close':'Click the reader to lift its lid';
  });
 });
})();
