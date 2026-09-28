/* The interlocking gears are the internal navigation for each DBTLR record. */
(() => {
  const names = ['Design', 'Build', 'Test', 'Learn', 'Redesign'];
  function init() {
    document.querySelectorAll('.eng-cycle[data-cycle-panel]').forEach(panel => {
      const body = panel.querySelector('.eng-cycle__panels');
      if (!body) return;
      const stages = names.map(name => body.querySelector(`[data-eng-stage="${name.toLowerCase()}"]`));
      if (stages.some(stage => !stage)) return;
      const nav = document.createElement('nav');
      nav.className = 'eng-gear';
      nav.setAttribute('aria-label', 'Steps in this engineering cycle');
      nav.innerHTML = '<p class="eng-gear__intro">Explore the cycle</p><ol class="eng-gear__steps"></ol>';
      const list = nav.querySelector('ol');
      const buttons = stages.map((stage, index) => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'eng-gear__step';
        button.innerHTML = `<span class="eng-gear__cog" aria-hidden="true"><span>${index + 1}</span></span><span class="eng-gear__label">${names[index]}</span>`;
        button.setAttribute('aria-controls', stage.id);
        button.setAttribute('aria-label', `Show ${names[index]} in this cycle`);
        button.addEventListener('click', () => show(index));
        li.append(button);list.append(li);return button;
      });
      body.prepend(nav);
      body.classList.add('is-gear-managed');
      function show(active) {
        stages.forEach((stage, index) => { stage.hidden = index !== active; });
        buttons.forEach((button, index) => {
          button.classList.toggle('is-active', index === active);
          button.setAttribute('aria-pressed', String(index === active));
        });
        body.dataset.activeStage = names[active].toLowerCase();
      }
      show(0);
      nav.addEventListener('keydown', event => {
        if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const current = buttons.findIndex(button => button === document.activeElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 4 : (current + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + 5) % 5;
        buttons[next].focus();show(next);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
