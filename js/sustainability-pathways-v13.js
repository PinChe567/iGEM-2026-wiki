/* Keep long SDG evidence available without repeating it in the overview. */
(function () {
  'use strict';
  const pathways = [...document.querySelectorAll('.page-sustainability .sust-pathway[id]')];
  pathways.forEach(article => {
    const head = article.querySelector('.sust-pathway__head');
    const detail = article.querySelector('.sust-slot-list');
    if (!head || !detail) return;
    detail.id = article.id + '-detail';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sdg-pathway-toggle';
    button.setAttribute('aria-controls', detail.id);
    function setOpen(open) {
      detail.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? 'Fold pathway' : 'Open evidence and limits';
    }
    button.addEventListener('click', () => setOpen(detail.hidden));
    head.append(button);
    setOpen(false);
  });
  function revealTarget() {
    if (!location.hash) return;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    const article = target?.closest('.sust-pathway');
    const button = article?.querySelector('.sdg-pathway-toggle');
    if (button?.getAttribute('aria-expanded') === 'false') button.click();
  }
  window.addEventListener('hashchange', revealTarget);
  revealTarget();
})();
