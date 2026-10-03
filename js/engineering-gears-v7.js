/* Equal tooth pitch; adjacent pitch circles touch and z1 * w1 = -z2 * w2. */
(() => {
  'use strict';
  const names = ['Design', 'Build', 'Test', 'Learn', 'Redesign'];
  const controllers = new WeakMap();
  const teeth = [24, 14, 20, 12, 18];
  const bearings = [35, 130, 35, 132];
  const gears = teeth.map(z => ({ z, r: z * 2.25 }));
  gears.forEach((gear, i) => {
    gear.ratio = (i % 2 ? -1 : 1) * gears[0].z / gear.z;
    if (!i) { gear.x = 63; gear.y = 63; gear.phase = 0; return; }
    const previous = gears[i - 1];
    const angle = bearings[i - 1] * Math.PI / 180;
    const distance = previous.r + gear.r;
    gear.x = previous.x + Math.cos(angle) * distance;
    gear.y = previous.y + Math.sin(angle) * distance;
    gear.phase = (previous.z * angle + gear.z * (angle + Math.PI) - Math.PI - previous.z * previous.phase) / gear.z;
  });
  function outline(gear) {
    const points = [];
    for (let tooth = 0; tooth < gear.z; tooth++) {
      for (const [offset, radius] of [[-.5, gear.r - 2.8], [-.34, gear.r - 2.8], [-.22, gear.r + 2.25], [.22, gear.r + 2.25], [.34, gear.r - 2.8], [.5, gear.r - 2.8]]) {
        const angle = (tooth + offset) * 2 * Math.PI / gear.z;
        points.push(`${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`);
      }
    }
    return points.join(' ');
  }
  function revealStage(target) {
    const stage = target?.closest('[data-eng-stage]');
    const panel = stage?.closest('[data-cycle-panel]');
    if (panel) controllers.get(panel)?.(names.findIndex(n => n.toLowerCase() === stage.dataset.engStage), 0);
  }
  function revealHashStage() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    revealStage(document.getElementById(id));
  }
  function init() {
    document.querySelectorAll('[data-cycle-viewer]').forEach(track => {
      const tabs = track.querySelector('.eng-cycle-tabs');
      if (!tabs || tabs.querySelector('.eng-track-label')) return;
      const label = document.createElement('strong');
      label.className = 'eng-track-label';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = track.dataset.trackLabel || ({ wetlab: 'Wet Lab', hardware: 'Hardware', model: 'Model', hp: 'Human Practices' })[track.dataset.engTrack] || 'Engineering';
      tabs.prepend(label);
    });
    document.querySelectorAll('.eng-cycle[data-cycle-panel]').forEach(panel => {
      const body = panel.querySelector('.eng-cycle__panels');
      if (!body || body.querySelector('.eng-gears')) return;
      const stages = names.map(name => body.querySelector(`[data-eng-stage="${name.toLowerCase()}"]`));
      if (stages.some(stage => !stage)) return;
      const extras = [...panel.children].filter(el => el !== body && !el.matches('.eng-cycle__head,.eng-cycle__footer'));
      if (extras.length) {
        const appendix = document.createElement('details');
        appendix.className = 'eng-source-notes';
        appendix.innerHTML = '<summary>Supporting records and comparison figures</summary>';
        extras.forEach(el => appendix.append(el));
        panel.append(appendix);
      }
      const nav = document.createElement('nav');
      nav.className = 'eng-gears';
      nav.setAttribute('aria-label', 'Engineering stages');
      nav.innerHTML = `<svg viewBox="0 0 215 330" role="group" aria-label="Interlocking engineering stages">${gears.map((gear, i) => `<g class="eng-gears__control" role="button" tabindex="0" aria-label="${names[i]}" aria-controls="${stages[i].id}" data-gear="${i}" transform="translate(${gear.x.toFixed(3)} ${gear.y.toFixed(3)})"><g class="eng-gears__rotor"><polygon points="${outline(gear)}"/><circle r="${gear.r * .48}"/></g><text text-anchor="middle" dominant-baseline="central">${names[i][0]}</text></g>`).join('')}</svg><p class="eng-gears__current" aria-live="polite"></p><p class="eng-gears__hint">Select a gear to explore a stage.</p>`;
      body.prepend(nav);
      body.classList.add('has-meshed-gears');
      let active = 0, angle = 0;
      const controls = [...nav.querySelectorAll('[data-gear]')];
      function show(index, delta = 1, source = 'navigation') {
        if (index < 0 || index >= stages.length) return;
        active = index;
        angle += delta * Math.PI / 4;
        stages.forEach((stage, i) => { stage.hidden = i !== index; });
        controls.forEach((control, i) => {
          control.setAttribute('aria-pressed', String(i === index));
          control.querySelector('.eng-gears__rotor').style.transform = `rotate(${(gears[i].phase + angle * gears[i].ratio) * 180 / Math.PI}deg)`;
        });
        nav.querySelector('.eng-gears__current').textContent = `${names[index]} · ${index + 1} / 5`;
        body.dataset.activeStage = names[index].toLowerCase();
        panel.dispatchEvent(new CustomEvent('eng:stage-change', { bubbles:true, detail:{ source } }));
      }
      controllers.set(panel, show);
      controls.forEach((control, i) => {
        control.addEventListener('click', event => show(i, i - active, event.isTrusted ? 'user' : 'guide'));
        control.addEventListener('keydown', event => {
          if (['Enter', ' '].includes(event.key)) { event.preventDefault(); show(i, i - active, event.isTrusted ? 'user' : 'guide'); }
          else if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) {
            event.preventDefault();
            const next = (i + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : 4)) % 5;
            controls[next].focus(); show(next, next - active, event.isTrusted ? 'user' : 'guide');
          }
        });
      });
      show(0, 0);
    });
    revealHashStage();
    window.addEventListener('hashchange', revealHashStage);
    window.addEventListener('popstate', revealHashStage);
    document.addEventListener('eng:reveal-stage', event => revealStage(event.detail.target));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
