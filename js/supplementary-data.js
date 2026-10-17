/* Keep a moved evidence anchor as usable as an ordinary chapter anchor. */
(() => {
  'use strict';
  const roots = [...document.querySelectorAll('.supplementary-data, .data-availability')];
  if (!roots.length) return;
  const tocSelector = '.page-toc, .audit-mobile-jump, .lm-sticky';
  let initialAllowed = true;
  let printState = null;

  function targetFor(hash) {
    if (!hash || hash === '#') return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch (_) { return null; }
  }
  function isSupplement(target) {
    return target && target.closest('.supplementary-data, .data-availability');
  }
  function reveal(target) {
    for (let node = target; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS') node.open = true;
      if (node.hasAttribute('data-reveal')) {
        node.classList.remove('is-pending');
        node.classList.add('is-visible');
      }
    }
  }
  function navigate(target, options = {}) {
    if (!isSupplement(target)) return;
    if (window.AeroSenseToc) {
      // The shared navigator emits the Model branch hook before measuring.
      window.AeroSenseToc.navigate(target, { source: 'supplementary', ...options });
      return;
    }
    document.dispatchEvent(new CustomEvent('aerosense:before-anchor', {
      detail: { target, hash: '#' + target.id, source: 'supplementary' }
    }));
    reveal(target);
    if (options.push) history.pushState(history.state, '', '#' + target.id);
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }
  function fromLocation() {
    const target = targetFor(location.hash);
    if (isSupplement(target)) navigate(target);
  }
  function samePage(url) {
    const normalize = path => path.replace(/\.html$/, '').replace(/\/$/, '');
    return url.origin === location.origin && normalize(url.pathname) === normalize(location.pathname);
  }
  function init() {
    document.addEventListener('click', event => {
      const link = event.target.closest && event.target.closest('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      // TOCs already use the shared navigator. Citation-return controls own
      // their passage picker, highlighting and selected-citation state.
      if (link.closest(tocSelector + ', .ref-return-tools') || link.hasAttribute('download') || link.target === '_blank') return;
      let url;
      try { url = new URL(link.href, location.href); }
      catch (_) { return; }
      if (!samePage(url)) return;
      const target = targetFor(url.hash);
      if (!isSupplement(target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      initialAllowed = false;
      navigate(target, { push: true, focus: true });
    }, true);
    document.addEventListener('aerosense:before-anchor', event => {
      if (isSupplement(event.detail?.target)) reveal(event.detail.target);
    });
    window.addEventListener('hashchange', fromLocation);
    window.addEventListener('popstate', fromLocation);
    fromLocation();
    // A first load may finish fonts or a branch after DOM readiness. Re-align
    // only while the visitor has not begun interacting with the page.
    window.addEventListener('load', () => {
      if (initialAllowed) fromLocation();
    }, { once: true });
  }
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(type => {
    window.addEventListener(type, () => { initialAllowed = false; }, { passive: true, once: true });
  });
  // Native closed details are opened only for printing, then restored exactly.
  window.addEventListener('beforeprint', () => {
    if (printState) return;
    printState = roots.flatMap(root => [...root.querySelectorAll('details')]).map(detail => [detail, detail.open]);
    printState.forEach(([detail]) => { detail.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    printState.forEach(([detail, open]) => { detail.open = open; });
    printState = null;
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
