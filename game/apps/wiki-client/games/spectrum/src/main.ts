import '@suite/ui/tokens.css';
import '@suite/ui/shell.css';
import '@suite/ui/components.css';
import '../../../src/game-ui/game-shell.css';
import './styles.css';
import '../../../src/education/study.css';
import { mountShell, shellMain } from '../../../src/shell/mount';
import { t } from '../../../src/i18n/messages';
import { readStoredLocale } from '../../../src/i18n/locale';
import type { Locale } from '../../../src/i18n/locale';
import {
  parseSpectrumStoredJson,
  SPECTRUM_STORAGE_KEY,
} from '@suite/core/spectrum';
import { howToPlayButtonHtml, textActionButtonHtml } from '../../../src/game-ui';
import { startSpectrumGame } from './game';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('#app missing');

const initialCopy = t(readStoredLocale());
let refreshReady: (() => void) | undefined;

const shell = mountShell(app, {
  homeHref: '../../index.html',
  actionsHtml: howToPlayButtonHtml(initialCopy.gameUi.howToPlay),
  onLocaleChange: (_locale: Locale, copy) => {
    const guide = app.querySelector('#guideButton');
    if (guide) guide.innerHTML = `<span>?</span> ${copy.gameUi.howToPlay}`;
    try {
      const stored = parseSpectrumStoredJson(localStorage.getItem(SPECTRUM_STORAGE_KEY));
      localStorage.setItem(
        SPECTRUM_STORAGE_KEY,
        JSON.stringify({ ...stored, locale: _locale }),
      );
    } catch {
      /* storage optional */
    }
    refreshReady?.();
  },
});

const main = shellMain(app);
main.innerHTML = `
  <section class="intro" aria-labelledby="sp-title">
    <div class="eyebrow" id="introEyebrow"><span></span> GAME 03</div>
    <h1 id="sp-title">Scent <em>Mixer</em></h1>
    <p id="introLead" data-sp-lead></p>
    <div class="intro-chips" id="introChips" aria-label="Game facts">
      <span><b>Junior</b></span><span><b>Standard</b></span><span><b>Challenge</b></span>
    </div>
  </section>
  <section class="lab" aria-label="Scent Mixer">
    <div class="level-header">
      <div>
        <span class="section-label" data-sp-label>GAME 03</span>
        <h2 data-sp-heading></h2>
      </div>
      <div class="lab-actions">
        ${textActionButtonHtml({ id: 'scienceButton', extra: 'data-sp-science', label: initialCopy.gameUi.science })}
      </div>
    </div>
    <div class="level-tabs" id="modeTabs" role="tablist" aria-label="Game mode"></div>
    <div class="game-card">
      <aside class="control-panel" id="settingsPanel"></aside>
      <section class="play-area" id="playArea" aria-live="polite"></section>
    </div>
  </section>
  <dialog id="scienceDialog" class="modal guide-modal">
    <div class="modal-header">
      <div>
        <span class="section-label">${initialCopy.gameUi.science}</span>
        <h2 data-science-title></h2>
      </div>
      <button class="close-button" data-close="scienceDialog" type="button" aria-label="${initialCopy.gameUi.close}">\u00d7</button>
    </div>
    <div data-science-body></div>
    <button class="primary-button full-button" data-close="scienceDialog" type="button" data-sp-close></button>
  </dialog>
  <dialog id="guideDialog" class="modal guide-modal">
    <div class="modal-header">
      <div>
        <span class="section-label">${initialCopy.gameUi.howToPlay}</span>
        <h2 data-guide-title></h2>
      </div>
      <button class="close-button" data-close="guideDialog" type="button" aria-label="${initialCopy.gameUi.close}">\u00d7</button>
    </div>
    <div data-guide-body></div>
    <button class="primary-button full-button" data-close="guideDialog" type="button" data-sp-close></button>
  </dialog>
`;

startSpectrumGame({
  getCopy: () => shell.getCopy(),
  getLocale: () => shell.getLocale(),
  onReady: (api) => {
    refreshReady = api.refreshReady;
  },
});
