import '@suite/ui/tokens.css';
import '@suite/ui/shell.css';
import '@suite/ui/components.css';
import '../../../src/game-ui/game-shell.css';
import './styles.css';
import { mountShell, shellMain } from '../../../src/shell/mount';
import { t } from '../../../src/i18n/messages';
import { readStoredLocale } from '../../../src/i18n/locale';
import type { Locale } from '../../../src/i18n/locale';
import {
  LABYRINTH_STORAGE_KEY,
  parseLabyrinthStoredJson,
} from '@suite/core/labyrinth';
import { howToPlayButtonHtml, textActionButtonHtml } from '../../../src/game-ui';
import { startScentbound } from './scentbound';

const appNode = document.querySelector('#app');
if (!(appNode instanceof HTMLElement)) throw new Error('#app missing');
const appRoot: HTMLElement = appNode;

const initialCopy = t(readStoredLocale());
const shell = mountShell(appRoot, {
  homeHref: '../../index.html',
  actionsHtml: howToPlayButtonHtml(initialCopy.gameUi.howToPlay),
  onLocaleChange: (locale: Locale, copy) => {
    const guide = appRoot.querySelector('#guideButton');
    if (guide) guide.innerHTML = `<span>?</span> ${copy.gameUi.howToPlay}`;
    try {
      const stored = parseLabyrinthStoredJson(localStorage.getItem(LABYRINTH_STORAGE_KEY));
      localStorage.setItem(LABYRINTH_STORAGE_KEY, JSON.stringify({ ...stored, locale }));
    } catch {
      /* optional */
    }
    destroy?.();
    boot();
  },
});

let destroy: (() => void) | undefined;

function boot(): void {
  const main = shellMain(appRoot);
  const locale = shell.getLocale();
  const copy = t(locale);
  document.title = locale === 'en' ? 'AeroSense: Scentbound Labyrinth' : copy.scentbound.title;
  main.innerHTML = `
    <div class="sb-shell" data-testid="scentbound-shell">
      <section class="intro">
        <div class="eyebrow" id="introEyebrow"><span></span> GAME 02</div>
        <h1 id="introTitle"></h1>
        <p id="introLead"></p>
        <div class="intro-chips" id="introChips" aria-label="Game facts"></div>
      </section>
      <section class="lab" aria-label="${copy.scentbound.title}">
        <div class="level-header">
          <div>
            <span class="section-label">GAME 02</span>
            <h2 id="chooseRun"></h2>
          </div>
          <div class="lab-actions">
            ${textActionButtonHtml({ id: 'scienceButton', label: copy.gameUi.science })}
          </div>
        </div>
        <div class="game-card">
          <aside class="control-panel" id="settingsPanel"></aside>
          <section class="play-area" id="playArea" aria-live="polite"></section>
        </div>
      </section>
      <dialog id="guideDialog" class="modal guide-modal">
        <div class="modal-header">
          <div>
            <span class="section-label">${copy.gameUi.howToPlay}</span>
            <h2>${copy.scentbound.howTitle}</h2>
          </div>
          <button class="close-button" data-close="guideDialog" type="button" aria-label="${copy.gameUi.close}">\u00d7</button>
        </div>
        <div id="howBody"></div>
        <button class="primary-button full-button" data-close="guideDialog" type="button">${copy.gameUi.close}</button>
      </dialog>
      <dialog id="scienceDialog" class="modal guide-modal">
        <div class="modal-header">
          <div>
            <span class="section-label">${copy.gameUi.science}</span>
            <h2>${copy.scentbound.scienceTitle}</h2>
          </div>
          <button class="close-button" data-close="scienceDialog" type="button" aria-label="${copy.gameUi.close}">\u00d7</button>
        </div>
        <div id="scienceBody"></div>
        <button class="primary-button full-button" data-close="scienceDialog" type="button">${copy.gameUi.close}</button>
      </dialog>
    </div>`;
  destroy = startScentbound({
    root: main,
    getCopy: () => t(shell.getLocale()).scentbound,
    getUi: () => t(shell.getLocale()).gameUi,
    getLocale: () => shell.getLocale(),
  }).destroy;
}

boot();
