/* Localized schematic artwork; responsive source selection is handled by picture. */
(() => {
  const picture = document.querySelector('[data-pcb-flow]');
  if (!picture) return;
  const source = picture.querySelector('source');
  const image = picture.querySelector('img');
  const link = document.querySelector('[data-pcb-flow-link]');
  function update() {
    const lang = document.documentElement.lang === 'zh-Hant' ? 'zh-Hant' : 'en';
    const base = 'assets/hardware/pcb-flow-v32/pcb-flow-';
    const wide = base + 'wide-' + lang + '.svg';
    const stacked = base + 'stacked-' + lang + '.svg';
    if (source.getAttribute('srcset') !== stacked) source.setAttribute('srcset', stacked);
    if (image.getAttribute('src') !== wide) image.setAttribute('src', wide);
    if (link.getAttribute('href') !== wide) link.setAttribute('href', wide);
  }
  document.addEventListener('aerosense:languagechange', update);
  update();
})();
