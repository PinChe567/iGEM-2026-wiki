/* Measure actual navigation height without a scroll loop or a height feedback loop. */
(() => {
  'use strict';
  function init() {
    const body = document.body;
    if (!body || body.classList.contains('page-home')) return;
    const header = body.querySelector('.site-header');
    const inner = header?.querySelector('.site-header__inner');
    const nav = header?.querySelector('.site-nav');
    if (!header || !inner || !nav) return;
    const root = document.documentElement;
    const tools = header.querySelector('.header-tools');
    const toggle = header.querySelector('.nav-toggle');
    const tabs = [...document.querySelectorAll('.eng-cycle-tabs')];
    let frame = 0;
    let measuredHeight = -1;
    let previousWidth = -1;
    let recalculateMode = true;

    function fits() {
      const box = inner.getBoundingClientRect();
      const style = getComputedStyle(inner);
      const right = box.right - parseFloat(style.paddingRight || 0);
      return [...inner.children].every(child => {
        const rect = child.getBoundingClientRect();
        return !rect.width || rect.right <= right + 1;
      }) && inner.scrollWidth <= inner.clientWidth + 1;
    }
    function closeMenu() {
      nav.classList.remove('is-open');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      }
    }
    function measure() {
      frame = 0;
      if (recalculateMode) {
        recalculateMode = false;
        const previousMode = body.dataset.navMode;
        body.dataset.navMode = window.innerWidth < 1024 ? 'menu' : 'full';
        if (body.dataset.navMode === 'full' && !fits()) {
          body.dataset.navMode = 'compact';
          if (!fits()) body.dataset.navMode = 'menu';
        }
        if (previousMode && previousMode !== body.dataset.navMode) closeMenu();
      }
      const height = Math.ceil(header.getBoundingClientRect().height);
      if (height !== measuredHeight) {
        measuredHeight = height;
        root.style.setProperty('--site-header-height', `${height}px`);
        root.style.setProperty('--header-offset', `${height}px`);
      }
      tabs.forEach(tab => {
        const track = tab.closest('[data-cycle-viewer]');
        if (!track) return;
        const value = `${Math.ceil(tab.getBoundingClientRect().height)}px`;
        if (track.style.getPropertyValue('--eng-cycle-tabs-height') !== value) {
          track.style.setProperty('--eng-cycle-tabs-height', value);
        }
      });
    }
    function schedule(mode = false) {
      recalculateMode ||= mode;
      if (!frame) frame = requestAnimationFrame(measure);
    }
    if ('ResizeObserver' in window) {
      const resize = new ResizeObserver(entries => {
        let mode = false;
        for (const entry of entries) {
          if (entry.target === inner && Math.abs(entry.contentRect.width - previousWidth) > .5) {
            previousWidth = entry.contentRect.width;
            mode = true;
          }
        }
        schedule(mode);
      });
      resize.observe(header);
      resize.observe(inner);
      tabs.forEach(tab => resize.observe(tab));
    }
    if (tools) new MutationObserver(() => schedule(true)).observe(tools, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', () => schedule(true), { passive: true });
    window.addEventListener('pageshow', () => schedule(true));
    document.fonts?.ready.then(() => schedule(true));
    measure();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
