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
import { parsePixelStoredJson, PIXEL_STORAGE_KEY } from '@suite/core/pixel';
import { howToPlayButtonHtml, textActionButtonHtml } from '../../../src/game-ui';
import { startPixelGame } from './game';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('#app missing');

const initialCopy = t(readStoredLocale());
let refreshReady: (() => void) | undefined;
const shell = mountShell(app, {
  homeHref: '../../index.html',
  actionsHtml: `
    <button class="icon-button" id="soundButton" type="button" aria-label="${initialCopy.pixelShell.soundToggle}" title="${initialCopy.pixelShell.soundToggle}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Zm12.5 3a4.5 4.5 0 0 0-2.25-3.9v7.8A4.5 4.5 0 0 0 17.5 12Z"/></svg>
    </button>
    ${howToPlayButtonHtml(initialCopy.gameUi.howToPlay)}`,
  onLocaleChange: (_locale: Locale, copy) => {
    const guide = app.querySelector('#guideButton');
    if (guide) guide.innerHTML = `<span>?</span> ${copy.gameUi.howToPlay}`;
    try {
      const stored = parsePixelStoredJson(localStorage.getItem(PIXEL_STORAGE_KEY));
      localStorage.setItem(PIXEL_STORAGE_KEY, JSON.stringify({ ...stored, locale: _locale }));
    } catch {
      /* The game works without browser storage. */
    }
    needScienceCopy();
    refreshReady?.();
  },
});

const main = shellMain(app);
main.innerHTML = `
  <section class="intro">
    <div class="eyebrow" id="introEyebrow"><span></span> GAME 01</div>
    <h1>Odor <em>Pixel Lab</em></h1>
    <p id="introLead">Look at the light pattern. Pick the matching scent.</p>
    <div class="intro-chips" id="introChips" aria-label="Game facts"><span><b>Junior</b></span><span><b>Standard</b></span><span><b>Challenge</b></span></div>
  </section>
  <section class="lab" aria-label="Odor Pixel Lab">
    <div class="level-header"><div><span class="section-label">GAME 1</span><h2 id="chooseRun">Choose a run</h2></div><div class="lab-actions">${textActionButtonHtml({ id: 'scienceButton', label: initialCopy.gameUi.science })}<button class="text-button" id="creditButton" type="button">${initialCopy.pixel.assetCredit}</button></div></div>
    <div class="level-tabs" id="modeTabs" role="tablist" aria-label="Game mode"></div>
    <div class="game-card"><aside class="control-panel" id="settingsPanel"></aside><section class="play-area" id="playArea" aria-live="polite"></section></div>
  </section>
  <dialog id="scienceDialog" class="modal guide-modal">
    <div class="modal-header"><div><span class="section-label">SCIENCE NOTE</span><h2>Illustrative model, not measurements</h2></div><button class="close-button" data-close="scienceDialog" type="button" aria-label="Close">\u00d7</button></div>
    <p id="scienceCopy"></p>
    <p>This activity maps five illustrative features to a small virtual receptor grid. It is designed to make pattern comparison and controlled noise visible; it does not model a biological sensory system or provide experimental evidence.</p>
    <p lang="zh-Hant">\u9019\u500b\u6d3b\u52d5\u628a\u4e94\u500b\u793a\u610f\u7279\u5fb5\u6620\u5c04\u6210\u865b\u64ec\u53d7\u9ad4\u7db2\u683c\uff0c\u7528\u65bc\u7df4\u7fd2\u6a21\u5f0f\u6bd4\u8f03\u8207\u5e72\u64fe\u8a2d\u8a08\uff0c\u4e0d\u4ee3\u8868\u751f\u7269\u611f\u89ba\u7cfb\u7d71\u6216\u5be6\u9a57\u8b49\u64da\u3002</p>
    <button class="primary-button full-button" data-close="scienceDialog" type="button">Close</button>
  </dialog>
  <dialog id="guideDialog" class="modal guide-modal">
    <div class="modal-header"><div><span class="section-label">${initialCopy.gameUi.howToPlay}</span><h2 id="howTitle">${initialCopy.pixel.howTitle}</h2></div><button class="close-button" data-close="guideDialog" type="button" aria-label="Close">\u00d7</button></div>
    <div id="howBody"></div>
    <button class="primary-button full-button" data-close="guideDialog" type="button">${initialCopy.gameUi.close}</button>
  </dialog>
  <dialog id="creditDialog" class="modal guide-modal">
    <div class="modal-header"><div><span class="section-label">ASSET CREDIT</span><h2>Odor atlas sprite sheet</h2></div><button class="close-button" data-close="creditDialog" type="button" aria-label="Close">\u00d7</button></div>
    <p id="creditCopy"></p><button class="primary-button full-button" data-close="creditDialog" type="button">Close</button>
  </dialog>`;

startPixelGame({
  getCopy: () => shell.getCopy(),
  getLocale: () => shell.getLocale(),
  getSoundLabels: () => {
    const copy = shell.getCopy();
    return { on: copy.pixelShell.soundOn, off: copy.pixelShell.soundOff, toggle: copy.pixelShell.soundToggle };
  },
  onReady: (api) => {
    refreshReady = api.refreshReady;
  },
});

function needScienceCopy(): void {
  const science = document.querySelector('#scienceCopy');
  const credit = document.querySelector('#creditCopy');
  const locale = shell.getLocale();
  if (science) science.textContent = shell.getCopy().pixel.science;
  // content filled by game bootstrap; keep locale sync helper no-op safe
  void credit;
  void locale;
}
