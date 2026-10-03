import '@suite/ui/tokens.css';
import '@suite/ui/shell.css';
import '@suite/ui/components.css';
import './hub.css';
import { mountShell, shellMain } from './shell/mount';
import { t } from './i18n/messages';
import {
  PIXEL_STORAGE_KEY,
  parsePixelStoredJson,
} from '@suite/core/pixel';
import {
  LABYRINTH_STORAGE_KEY,
  parseLabyrinthStoredJson,
} from '@suite/core/labyrinth';
import {
  SPECTRUM_STORAGE_KEY,
  parseSpectrumStoredJson,
} from '@suite/core/spectrum';
import { readExplorerSnapshot, type GameLocalProgress } from './progress/explorer';
import './pages/pages.css';

const appEl = document.querySelector<HTMLElement>('#app');
if (!appEl) throw new Error('#app missing');
const app = appEl;

const shell = mountShell(app, {
  homeHref: './index.html',
  onLocaleChange: () => paintHub(),
});

function progressLabel(p: GameLocalProgress, copy: ReturnType<typeof t>): string {
  const bits = [
    p.tutorialDone ? 'T' : '\u00b7',
    p.practiceDone ? 'P' : '\u00b7',
    p.dailyOrCampaignDone ? 'M' : '\u00b7',
    p.scienceDone ? 'S' : '\u00b7',
  ];
  const done = [p.tutorialDone, p.practiceDone, p.dailyOrCampaignDone, p.scienceDone].filter(Boolean)
    .length;
  return `${copy.hub.localProgress}: ${done}/4 (${bits.join('')})`;
}

function paintHub(): void {
  const locale = shell.getLocale();
  const copy = t(locale);
  document.title = copy.meta.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', copy.meta.description);

  const snap = readExplorerSnapshot({
    pixelKey: PIXEL_STORAGE_KEY,
    labyrinthKey: LABYRINTH_STORAGE_KEY,
    spectrumKey: SPECTRUM_STORAGE_KEY,
    parsePixel: parsePixelStoredJson,
    parseLabyrinth: parseLabyrinthStoredJson,
    parseSpectrum: parseSpectrumStoredJson,
  });

  const games = [
    {
      step: '01',
      href: './games/pixel/index.html',
      scienceHref: './games/pixel/index.html#science',
      meta: copy.hub.games.pixel,
      progress: snap.pixel,
      testid: 'card-pixel',
      game: 'pixel',
    },
    {
      step: '02',
      href: './games/labyrinth/index.html',
      scienceHref: './games/labyrinth/index.html#science',
      meta: copy.hub.games.game2,
      progress: snap.labyrinth,
      testid: 'card-labyrinth',
      game: 'labyrinth',
    },
    {
      step: '03',
      href: './games/spectrum/index.html',
      scienceHref: './games/spectrum/index.html#science',
      meta: copy.hub.games.game3,
      progress: snap.spectrum,
      testid: 'card-spectrum',
      game: 'spectrum',
    },
  ];

  shellMain(app).innerHTML = `
    <section class="hub-intro">
      <div class="eyebrow"><span></span> ${copy.hub.eyebrow}</div>
      <h1>${copy.hub.heading}</h1>
      <p>${copy.hub.lead}</p>
    </section>

    <section class="hub-educators" data-testid="hub-educators" aria-labelledby="hub-educators-title">
      <h2 id="hub-educators-title">${copy.hub.educatorsTitle}</h2>
      <p>${copy.hub.educatorsLead}</p>
      <a class="text-button" href="./education/index.html#for-educators">${copy.hub.educatorsLink}</a>
    </section>

    <section class="hub-grid" aria-label="${copy.hub.heading}">
      ${games
        .map((g) => {
          const titleId = `hub-title-${g.game}`;
          return `
        <article class="game-card-link hub-card" data-testid="${g.testid}" aria-labelledby="${titleId}">
          <span class="section-label">${copy.hub.gameLabel} ${g.step}</span>
          <h2 id="${titleId}">${g.meta.title}</h2>
          <p>${g.meta.blurb}</p>
          <ul class="hub-card-meta">
            <li><span>${copy.hub.duration}</span> ${g.meta.duration}</li>
            <li><span>${copy.hub.level}</span> ${g.meta.level}</li>
            <li><span>${copy.hub.concept}</span> ${g.meta.concept}</li>
            <li>${progressLabel(g.progress, copy)}</li>
          </ul>
          <div class="hub-card-actions">
            <a class="primary-button" href="${g.href}" data-game="${g.game}" data-testid="play-${g.game}" aria-label="${copy.hub.playAria}: ${g.meta.title}">${copy.hub.play}</a>
            <a class="ghost-button" href="${g.scienceHref}" data-testid="science-${g.game}" aria-label="${copy.hub.scienceAria}: ${g.meta.title}">${copy.hub.science}</a>
          </div>
        </article>`;
        })
        .join('')}
    </section>
  `;
}

paintHub();
