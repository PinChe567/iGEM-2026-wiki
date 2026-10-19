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

/* Open the chosen goal before a table-of-contents or citation jump. */
(function () {
 'use strict';
 function revealGoal(hash) {
  if (!hash || hash === '#') return;
  var target;
  try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (_) { return; }
  var section = target && target.closest('section[id^="notion-sdg"]');
  var disclosure = section && section.querySelector(':scope > .sust-goal-disclosure');
  if (disclosure) disclosure.open = true;
 }
 document.addEventListener('click', function (event) {
  var link = event.target.closest && event.target.closest('a[href]');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  var url = new URL(link.href, location.href);
  if (url.origin === location.origin && url.pathname === location.pathname) revealGoal(url.hash);
 }, true);
 window.addEventListener('hashchange', function () { revealGoal(location.hash); });
 revealGoal(location.hash);
})();
