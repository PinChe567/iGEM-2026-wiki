/* Native disclosures replace the former scroll-driven stage reader. */
(() => {
  'use strict';
  function init() {
    // A bookmarked comparison/diagnostic panel must also select its inner tab;
    // the shared reading-details helper opens the surrounding native records.
    function revealControl(hash) {
      let id;
      try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch (_) { return; }
      let target = document.getElementById(id);
      while (target) {
        if (target.matches('[data-eng-ba-panel], [data-eng-ladder-panel], [data-eng-diag-panel]')) {
          const group = target.closest('[data-eng-ba], [data-eng-ladder], [data-eng-diag]');
          const control = group && [...group.querySelectorAll('button[aria-controls]')].find(button => button.getAttribute('aria-controls') === target.id);
          if (control) control.click();
        }
        target = target.parentElement;
      }
    }
    revealControl(location.hash);
    window.addEventListener('hashchange', () => revealControl(location.hash));
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.hash) revealControl(url.hash);
    }, true);
    const button = document.querySelector('[data-eng-records-toggle]');
    const records = [...document.querySelectorAll('.eng-cycle-record, [data-eng-receptor-record]')];
    if (!button || !records.length) return;
    function update() {
      const expanded = records.every(record => record.open);
      button.setAttribute('aria-pressed', String(expanded));
      button.textContent = expanded ? 'Collapse records' : 'Expand records';
    }
    button.addEventListener('click', () => {
      const open = !records.every(record => record.open);
      records.forEach(record => { record.open = open; });
      update();
    });
    records.forEach(record => record.addEventListener('toggle', update));
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
