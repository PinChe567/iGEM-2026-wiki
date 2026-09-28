/* One consistent, per-page sequence for scientific figures and tables. */
(() => {
  const main = document.querySelector('main');
  if (!main) return;
  let figureNumber = 0;
  main.querySelectorAll('figure').forEach(figure => {
    const caption = figure.querySelector(':scope > figcaption');
    if (!caption || figure.closest('.footer-partners__logos,.home-partners__logos') || figure.classList.contains('footer-partners__slot')) return;
    figureNumber++;
    const existing = caption.querySelector(':scope > .wiki-figure__num');
    if (existing) {
      existing.textContent = `Figure ${figureNumber}.`;
      existing.classList.add('media-caption__label');
      return;
    }
    const first = caption.firstChild;
    if (first?.nodeType === Node.TEXT_NODE) {
      first.textContent = first.textContent.replace(/^\s*(?:Figure|Fig\.?)\s*\d*\s*[.:—–-]\s*/i, '');
    }
    const label = document.createElement('strong');
    label.className = 'media-caption__label';
    label.textContent = `Figure ${figureNumber}. `;
    caption.prepend(label);
  });
  let tableNumber = 0;
  main.querySelectorAll('table').forEach(table => {
    tableNumber++;
    let caption = table.querySelector(':scope > caption');
    if (!caption) {
      caption = document.createElement('caption');
      const context = table.closest('[aria-label]')?.getAttribute('aria-label');
      caption.textContent = context || table.getAttribute('aria-label') || 'Data summary';
      table.prepend(caption);
    }
    const first = caption.firstChild;
    if (first?.nodeType === Node.TEXT_NODE) {
      first.textContent = first.textContent.replace(/^\s*Table\s*\d*\s*[.:—–-]\s*/i, '');
    }
    const label = document.createElement('strong');
    label.className = 'media-caption__label';
    label.textContent = `Table ${tableNumber}. `;
    caption.prepend(label);
  });
})();
