/* Independent figure and video sequences per page or Model study; tables keep their existing sequence. */
(() => {
  const main = document.querySelector('main');
  if (!main) return;
  const figureNumbers = new Map(), videoNumbers = new Map();
  main.querySelectorAll('figure').forEach(figure => {
    const caption = figure.querySelector(':scope > figcaption');
    if (!caption || figure.closest('.footer-partners__logos,.home-partners__logos,.home-supporters__gallery') || figure.classList.contains('footer-partners__slot')) return;
    const scope = figure.closest('[data-model-panel], [data-model-supplement], [data-model-availability]');
    const key = scope ? (scope.dataset.modelPanel || scope.dataset.modelSupplement || scope.dataset.modelAvailability) : 'page';
    const isVideo = Boolean(figure.querySelector('video, [data-lightsheet-player]'));
    const numbers = isVideo ? videoNumbers : figureNumbers;
    const number = (numbers.get(key) || 0) + 1;
    numbers.set(key, number);
    const captionLabel = `${isVideo ? 'Video' : 'Figure'} ${number}. `;
    const existing = caption.querySelector(':scope > .wiki-figure__num, :scope > .media-caption__label');
    if (existing) {
      existing.textContent = captionLabel;
      existing.classList.add('media-caption__label');
      return;
    }
    const first = caption.firstChild;
    if (first?.nodeType === Node.TEXT_NODE) {
      first.textContent = first.textContent.replace(/^\s*(?:Figure|Fig\.?|Video)\s*\d*\s*[.:—–-]\s*/i, '');
    }
    const label = document.createElement('strong');
    label.className = 'media-caption__label';
    label.textContent = captionLabel;
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
    const existing = caption.querySelector(':scope > .media-caption__label');
    if (existing) {
      existing.textContent = `Table ${tableNumber}. `;
      return;
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
