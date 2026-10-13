/* Keep citations and deep links usable when their evidence is collapsed. */
(function () {
  'use strict';
  function targetFor(hash) {
    if (!hash || hash === '#') return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch (_) { return null; }
  }
  function reveal(target) {
    if (!target) return false;
    var row = target.closest('[data-evidence-id]');
    if (row && row.hidden) {
      var ledger = row.closest('[data-sust-ledger]');
      var all = ledger && ledger.querySelector('[data-sust-ledger-filter="all"]');
      if (all) all.click();
    }
    var opened = false;
    for (var node = target; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS' && !node.open) {
        node.open = true;
        opened = true;
      }
    }
    if (row) {
      var evidence = row.querySelector('details');
      if (evidence && !evidence.open) { evidence.open = true; opened = true; }
    }
    return opened;
  }
  function followHash() {
    var target = targetFor(window.location.hash);
    if (reveal(target)) {
      requestAnimationFrame(function () {
        window.dispatchEvent(new Event('resize'));
        target.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    }
  }
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var url = new URL(link.href, window.location.href);
    if (url.origin === location.origin && url.pathname === location.pathname) reveal(targetFor(url.hash));
  }, true);
  document.addEventListener('toggle', function (event) {
    if (event.target.tagName === 'DETAILS' && event.target.open) {
      requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
    }
  }, true);
  window.addEventListener('hashchange', followHash);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', followHash);
  else followHash();
}());
