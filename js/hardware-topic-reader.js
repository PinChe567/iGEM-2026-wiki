/* Hardware topics remain in the document; navigation reveals native details. */
(() => {
  function init() {
    const sections = new Map([...document.querySelectorAll('[data-hardware-inline-topic]')]
      .map(section => [section.dataset.hardwareInlineTopic, section]));
    if (!sections.size) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const aliases = {
      'optical-question': 'optics', 'gas-path-results': 'airflow',
      'hardware-architecture': 'enclosure', 'mechanical-package': 'enclosure',
      'hw-block-enclosure-build': 'enclosure', 'electronics-bridge': 'pcb',
      'pcb-controls': 'pcb', 'pcb-signal-flow': 'pcb',
      'reader-interface': 'interface', 'assembly-documents': 'manual',
      'reader-user-feedback': 'manual'
    };
    const legacyDestinations = {
      reader: 'hardware-need', evidence: 'hardware-verification',
      resources: 'hardware-resources', references: 'references',
      cellculture: 'reader-cell-culture'
    };
    let epoch = 0, locationFrame = 0, pendingFrame = 0, arrivalCleanup = () => {};

    function hashId(hash) {
      try { return decodeURIComponent(hash.replace(/^#/, '')); } catch { return ''; }
    }
    function targetFor(id) {
      const target = document.getElementById(id);
      if (target) return target;
      if (id.startsWith('hardware-topic-')) {
        const key = id.slice(15);
        return sections.get(key) || document.getElementById(legacyDestinations[key]);
      }
      return sections.get(aliases[id]);
    }
    function revealAncestors(target) {
      for (let node = target; node; node = node.parentElement) {
        if (node.tagName === 'DETAILS') node.open = true;
      }
    }
    function sectionFor(target) {
      return target.closest('[data-hardware-inline-topic]');
    }
    function revealTopic(section) {
      section.querySelectorAll('[data-hardware-topic-details]').forEach(details => {
        if (details.dataset.hardwareTopicDetails === section.dataset.hardwareInlineTopic) details.open = true;
      });
    }
    function topOffset(target) {
      const header = document.querySelector('.site-header');
      let offset = Math.max(0, header?.getBoundingClientRect().bottom || 0);
      const jump = document.querySelector('.audit-mobile-jump');
      if (jump && getComputedStyle(jump).display !== 'none') {
        const summary = jump.querySelector('summary');
        offset += summary?.getBoundingClientRect().height || 0;
      }
      return Math.max(offset + 24, parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
    }
    function focusTarget(target) {
      const focus = target.matches('section') ? target.querySelector('h2,h3') || target : target;
      if (!focus.hasAttribute('tabindex')) {
        focus.tabIndex = -1;
        focus.addEventListener('blur', () => focus.removeAttribute('tabindex'), {once: true});
      }
      focus.focus({preventScroll: true});
    }
    function markArrival(section, sequence, smooth) {
      if (!section || reduced.matches) return;
      let timer, fallback, done = false;
      const arrived = () => {
        if (done || sequence !== epoch) return;
        done = true;
        document.removeEventListener('scrollend', arrived);
        clearTimeout(fallback);
        section.classList.add('hw-topic-arriving');
        timer = setTimeout(() => section.classList.remove('hw-topic-arriving'), 600);
      };
      arrivalCleanup = () => {
        done = true;
        clearTimeout(timer); clearTimeout(fallback);
        document.removeEventListener('scrollend', arrived);
        section.classList.remove('hw-topic-arriving');
      };
      if (smooth) {
        document.addEventListener('scrollend', arrived, {once: true});
        fallback = setTimeout(arrived, 1800);
      } else arrived();
    }
    function navigate(target, {push = false, expand = false, smooth = false, focus = false, from = null} = {}) {
      if (!target) return;
      const sequence = ++epoch, section = sectionFor(target);
      cancelAnimationFrame(locationFrame);
      cancelAnimationFrame(pendingFrame);
      arrivalCleanup();
      // Historical aliases can move between results and supporting records.
      // Use the shared layout-following navigator for these zero-height targets.
      if (target.matches('.anchor-alias') && window.AeroSenseToc) {
        window.AeroSenseToc.navigate(target, {push, focus, source: 'hardware-alias'});
        return;
      }
      // Close the mobile menu before measuring the destination's final position.
      const menu = from?.closest('.audit-mobile-jump');
      if (menu) menu.open = false;
      if (expand && section) revealTopic(section);
      revealAncestors(target);
      if (push && hashId(location.hash) !== target.id) history.pushState(history.state, '', '#' + target.id);
      pendingFrame = requestAnimationFrame(() => {
        if (sequence !== epoch) return;
        const top = Math.max(0, scrollY + target.getBoundingClientRect().top - topOffset(target));
        const animate = smooth && !reduced.matches && Math.abs(scrollY - top) > 2;
        if (focus) focusTarget(target);
        markArrival(section, sequence, animate);
        window.scrollTo({top, behavior: animate ? 'smooth' : 'instant'});
      });
    }
    function topic(key, from) {
      const target = sections.get(key) || document.getElementById(legacyDestinations[key]);
      if (!target) return;
      navigate(target, {push: true, expand: true, smooth: true, focus: true, from});
    }
    function fromLocation() {
      ++epoch;
      cancelAnimationFrame(pendingFrame);
      arrivalCleanup();
      cancelAnimationFrame(locationFrame);
      locationFrame = requestAnimationFrame(() => {
        const id = hashId(location.hash), target = targetFor(id);
        if (target) navigate(target, {expand: id.startsWith('hardware-topic-') && sections.has(id.slice(15))});
      });
    }

    document.addEventListener('hardware:topic', event => topic(event.detail?.key, event.detail?.trigger));
    document.addEventListener('click', event => {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      const id = hashId(url.hash), explicit = link.dataset.hardwareView || link.dataset.productKey || (id.startsWith('hardware-topic-') ? id.slice(15) : '');
      if (explicit && (sections.has(explicit) || legacyDestinations[explicit])) {
        event.preventDefault(); event.stopImmediatePropagation();
        topic(explicit, link);
        return;
      }
      const target = targetFor(id);
      // Citation controls already reveal their passage and manage their own chooser.
      if (!target || link.closest('.ref-return-tools') || link.classList.contains('cite')) return;
      if (sectionFor(target)) {
        event.preventDefault(); event.stopImmediatePropagation();
        navigate(target, {push: true, smooth: true, focus: true, from: link});
      }
    }, true);
    addEventListener('popstate', fromLocation);
    addEventListener('hashchange', fromLocation);
    document.body.classList.add('hw-inline-ready');
    fromLocation();
  }
  // Shared references and figure IDs are ready; images and CAD downloads may continue.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), {once: true});
  else setTimeout(init, 0);
})();
