/* Desktop and mobile contents share one chapter list. */
(() => {
  const main = document.querySelector('main');
  if (!main || document.body.classList.contains('page-home') || document.querySelector('[data-learn-root]')) return;
  // Reuse the native first-paint menu instead of moving the article after load.
  const existing = document.querySelector('.audit-mobile-jump');
  if (existing) {
    const contents = document.querySelector('.page-toc nav');
    if (contents) existing.querySelector('nav').replaceChildren(...contents.cloneNode(true).childNodes);
    return;
  }
  const headers = [...main.querySelectorAll('h2')].filter(h =>
    !h.closest('dialog,[hidden]') && (h.id || h.closest('section[id]')));
  if (headers.length < 5) return;
  const menu = document.createElement('details');
  menu.className = 'audit-mobile-jump';
  const summary = document.createElement('summary');
  summary.textContent = 'On this page';
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label','Section shortcuts');
  const seen = new Set();
  headers.forEach(h => {
    const id = h.id || h.closest('section[id]').id;
    if (seen.has(id)) return;
    seen.add(id);
    const a = document.createElement('a');
    a.href = '#' + id; a.textContent = (window.AeroSenseI18n?.sourceText(h) || h.textContent).trim();
    a.addEventListener('click', () => {menu.open = false;});
    nav.append(a);
  });
  menu.append(summary,nav);
  const header = document.querySelector('.site-header');
  if (header) header.after(menu);
})();
