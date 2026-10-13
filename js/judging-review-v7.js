/* A compact native jump menu for long scientific articles; no scroll interception. */
(() => {
  const main = document.querySelector('main');
  if (!main || document.body.classList.contains('page-home') || document.querySelector('[data-learn-root]')) return;
<<<<<<< HEAD
  // Reuse the native first-paint menu instead of moving the article after load.
  const existing = document.querySelector('.audit-mobile-jump');
  if (existing) {
    existing.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => { existing.open = false; });
    });
    return;
  }
=======
>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0
  const headers = [...main.querySelectorAll('h2')].filter(h => h.id || h.closest('section[id]'));
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
<<<<<<< HEAD
    a.href = '#' + id; a.textContent = (window.AeroSenseI18n?.sourceText(h) || h.textContent).trim();
=======
    a.href = '#' + id; a.textContent = h.textContent.trim();
>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0
    a.addEventListener('click', () => {menu.open = false;});
    nav.append(a);
  });
  menu.append(summary,nav);
  const header = document.querySelector('.site-header');
  if (header) header.after(menu);
})();
