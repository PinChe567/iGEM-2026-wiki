import {
  SPECTRUM_CONTENT_VERSION,
  SPECTRUM_ODOR_IDS,
  getSpectrumOdor,
  signatureMap,
  spectrumContentCatalog,
} from '@suite/content';
import {
  SPECTRUM_RULE_VERSION,
  SPECTRUM_GAME_VERSION,
  SPECTRUM_STORAGE_KEY,
  buildDailySpectrumSession,
  buildPracticeSpectrumSession,
  canonicalizeMixture,
  computeSignals,
  computeSpectrumScore,
  createPracticeSeed,
  formatElapsed,
  getPreset,
  linearMix,
  mixturesEqual,
  parseSpectrumStoredJson,
  recordSpectrumBestScore,
  recordSpectrumPlayedSeed,
  scoreAB,
  signalFitScore,
  validateMixture,
  isPerfectAB,
  enumerateLegalMixtures,
  filterCandidates,
  parseDifficultyId,
  hintPossibleOdorIds,
  hintRevealComponent,
  hintClosestCandidates,
  hintAutofillMixture,
  type CanonicalMixture,
  type DifficultyId,
  type MixtureComponent,
  type SpectrumSession,
  type SpectrumSessionMode,
  type SpectrumStoredState,
} from '@suite/core/spectrum';
import {
  createEducationSession,
  markEducationPlayComplete,
  type EducationStudySession,
} from '@suite/core/education';
import type { Locale } from '../../../src/i18n/locale';
import type { MessageTree } from '../../../src/i18n/messages';
import { channelSummaryText, drawChannelChart, drawSignatureHint } from './chart';
import {
  loadSuiteExplorer,
  markScienceCard,
  saveSuiteExplorer,
} from '../../../src/progress/explorer';
import { isStudyMode } from '../../../src/education/mode';
import { consumeScienceHash } from '../../../src/science-hash';
import { persistEducationSession } from '../../../src/education/persist';
import {
  bindStudyExport,
  bindStudyQuestions,
  postItems,
  preItems,
  studyBannerHtml,
  studyExportBarHtml,
  studyQuestionsHtml,
} from '../../../src/education/study-ui';
import {
  advancedSettingsHtml,
  gameHeaderKicker,
  levelCardsHtml,
  modeTabsHtml,
  readyCopyHtml,
  resultLayoutHtml,
  scoreRingHtml,
} from '../../../src/game-ui';

const SIGS = signatureMap();
const ALL_IDS = [...SPECTRUM_ODOR_IDS];

type GuessHistoryRow = {
  index: number;
  guess: CanonicalMixture;
  a: number;
  b: number;
  fit: number;
  guessSignal: number[];
  eliminatedOdors: number;
};

type JuniorRatio = '25-75' | '50-50' | '75-25';

type GameOptions = {
  getCopy: () => MessageTree;
  getLocale: () => Locale;
  onReady?: (api: { refreshReady: () => void }) => void;
};

function loadStore(): SpectrumStoredState {
  try {
    return parseSpectrumStoredJson(localStorage.getItem(SPECTRUM_STORAGE_KEY));
  } catch {
    return parseSpectrumStoredJson(null);
  }
}

function saveStore(state: SpectrumStoredState): void {
  try {
    localStorage.setItem(SPECTRUM_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

const ODOR_ATLAS = [
  'banana',
  'lemon',
  'rose',
  'coffee',
  'mint',
  'strawberry',
  'chocolate',
  'lavender',
  'orange',
  'cinnamon',
  'apple',
  'vanilla',
  'bread',
  'pine',
  'popcorn',
  'peach',
];

function odorIconHtml(id: string, name: string): string {
  const index = ODOR_ATLAS.indexOf(id);
  const pos = index >= 0 ? `${(index % 5) * 25}% ${Math.floor(index / 5) * (100 / 3)}%` : '0 0';
  return `<span class="sp-odor-icon" style="background-position:${pos}" role="img" aria-label="${escapeHtml(name)}"></span>`;
}

function differingChannels(target: readonly number[], guess: readonly number[], thresh = 0.1): number[] {
  const out: number[] = [];
  for (let i = 0; i < Math.max(target.length, guess.length); i += 1) {
    if (Math.abs((target[i] ?? 0) - (guess[i] ?? 0)) >= thresh) out.push(i);
  }
  return out;
}

function odorName(id: string, locale: Locale): string {
  const rec = getSpectrumOdor(id);
  if (!rec) return id;
  return rec.name[locale];
}

function formatMixtureLabel(m: CanonicalMixture, locale: Locale): string {
  return m.components
    .map((c) => `${odorName(c.odorId, locale)} ${c.percent}%`)
    .join(' + ');
}

export function startSpectrumGame(options: GameOptions): void {
  const playAreaEl = document.querySelector<HTMLElement>('#playArea');
  const settingsPanelEl = document.querySelector<HTMLElement>('#settingsPanel');
  const modeTabsEl = document.querySelector<HTMLElement>('#modeTabs');
  if (!playAreaEl || !settingsPanelEl || !modeTabsEl) throw new Error('spectrum DOM missing');
  const playArea = playAreaEl;
  const settingsPanel = settingsPanelEl;
  const modeTabs = modeTabsEl;

  let store = loadStore();
  let mode: SpectrumSessionMode = 'practice';
  let difficulty: DifficultyId = parseDifficultyId(store.lastDifficulty);
  let practiceSeed = createPracticeSeed();
  let session: SpectrumSession | null = null;
  let history: GuessHistoryRow[] = [];
  let startedAt = 0;
  let phase: 'ready' | 'tutorial' | 'play' | 'result' = 'ready';
  let tutorialStep = 0;
  /** One row per pool odor; unselected ⇒ 0% in the guess. */
  let builderRows: Array<{ odorId: string; selected: boolean; percent: number }> = [];
  let legalCandidates: CanonicalMixture[] = [];
  let survivingCandidates: CanonicalMixture[] = [];
  let survivingOdorIds: Set<string> = new Set();
  let autofillNotice = '';
  let lastFeedback: GuessHistoryRow | null = null;
  let historyExpanded = false;
  let hintLevel = 0;
  let juniorPick: string[] = [];
  let juniorRatio: JuniorRatio = '50-50';
  let studySession: EducationStudySession | null = null;
  let advancedOpen = false;
  let moreDetailsOpen = false;
  let justSubmitted = false;
  let submitAnimTimer = 0;

  applyA11y(store);

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.close;
      const dlg = id ? document.querySelector<HTMLDialogElement>(`#${id}`) : null;
      dlg?.close();
    });
  });

  document.querySelector('#scienceButton')?.addEventListener('click', () => {
    saveSuiteExplorer(markScienceCard(loadSuiteExplorer(), 'spectrum'));
    paintScience();
    document.querySelector<HTMLDialogElement>('#scienceDialog')?.showModal();
  });
  consumeScienceHash(() => {
    saveSuiteExplorer(markScienceCard(loadSuiteExplorer(), 'spectrum'));
    paintScience();
    document.querySelector<HTMLDialogElement>('#scienceDialog')?.showModal();
  });
  document.querySelector('#guideButton')?.addEventListener('click', () => {
    paintGuide();
    document.querySelector<HTMLDialogElement>('#guideDialog')?.showModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('dialog[open]').forEach((d) => (d as HTMLDialogElement).close());
    }
  });

  function copy() {
    return options.getCopy().spectrum;
  }

  function locale() {
    return options.getLocale();
  }

  function refreshChrome(): void {
    const c = copy();
    const ui = options.getCopy().gameUi;
    const lead = document.querySelector('[data-sp-lead]');
    const heading = document.querySelector('[data-sp-heading]');
    const science = document.querySelector('[data-sp-science]');
    const pageTitle = document.querySelector('#sp-title');
    const pageLabel = document.querySelector('[data-sp-label]');
    const eyebrow = document.querySelector('#introEyebrow');
    const chips = document.querySelector('#introChips');
    if (pageTitle) {
      pageTitle.innerHTML = locale() === 'en' ? 'Scent <em>Mixer</em>' : c.titleShort;
    }
    if (pageLabel) pageLabel.textContent = gameHeaderKicker('03');
    if (eyebrow) eyebrow.innerHTML = `<span></span> ${gameHeaderKicker('03')}`;
    document.title = c.title;
    if (lead) lead.textContent = c.lead;
    if (heading) heading.textContent = c.chooseRun;
    if (science) science.textContent = ui.science;
    if (chips) {
      chips.innerHTML = `<span><b>${c.diffJunior}</b></span><span><b>${c.diffEasy}</b></span><span><b>${c.diffHard}</b></span>`;
    }
    document.querySelectorAll('[data-sp-close]').forEach((el) => {
      el.textContent = ui.close;
    });
  }

  function paintScience(): void {
    const c = copy();
    const title = document.querySelector('[data-science-title]');
    const body = document.querySelector('[data-science-body]');
    if (title) title.textContent = c.scienceTitle;
    if (body) {
      body.innerHTML = `<p>${c.scienceBody}</p><p class="sp-disclaimer">${spectrumContentCatalog.modelDisclaimer[locale()]}</p>`;
    }
  }

  function paintGuide(): void {
    const c = copy();
    const title = document.querySelector('[data-guide-title]');
    const body = document.querySelector('[data-guide-body]');
    if (title) title.textContent = c.guideTitle;
    if (body) {
      body.innerHTML = `<div class="how-cards" data-testid="how-cards">
        <article><span>01</span><b>${c.how1Title}</b><p>${c.how1Body}</p></article>
        <article><span>02</span><b>${c.how2Title}</b><p>${c.how2Body}</p></article>
        <article><span>03</span><b>${c.how3Title}</b><p>${c.how3Body}</p></article>
      </div>`;
    }
  }

  function applyA11y(s: SpectrumStoredState): void {
    document.documentElement.classList.toggle('high-contrast', s.highContrast);
    document.documentElement.classList.toggle('reduced-motion', s.reducedMotion);
    const preferReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (preferReduce) document.documentElement.classList.add('reduced-motion');
  }

  function isRunPhase(): boolean {
    return phase === 'tutorial' || phase === 'play' || phase === 'result';
  }

  function abandonRun(): void {
    session = null;
    history = [];
    lastFeedback = null;
    historyExpanded = false;
    moreDetailsOpen = false;
    justSubmitted = false;
    if (submitAnimTimer) window.clearTimeout(submitAnimTimer);
    hintLevel = 0;
    juniorPick = [];
    juniorRatio = '50-50';
    autofillNotice = '';
  }

  function applySelectionChange(changed: boolean): void {
    const leaveRun = isRunPhase() && changed;
    if (leaveRun) abandonRun();
    paintModes();
    paintSettings();
    refreshChrome();
    if (leaveRun || phase === 'ready') paintReady();
  }

  function paintModes(): void {
    const c = copy();
    modeTabs.innerHTML = modeTabsHtml({
      ariaLabel: c.chooseRun,
      selectedId: mode,
      wrap: false,
      tabs: [
        { id: 'practice', label: c.practice },
        { id: 'daily', label: c.daily },
      ],
    });
    modeTabs.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = (btn as HTMLElement).dataset.mode as SpectrumSessionMode;
        const changed = next !== mode;
        mode = next;
        applySelectionChange(changed);
      });
    });
  }

  function paintSettings(): void {
    const c = copy();
    const best = store.bestByScoreKey[`${difficulty}|${SPECTRUM_RULE_VERSION}`] ?? 0;
    const preset = getPreset(difficulty);
    const existing = settingsPanel.querySelector<HTMLDetailsElement>('#advanced');
    if (existing) existing.ontoggle = null;
    settingsPanel.innerHTML = `
      <h3>${c.chooseRun}</h3>
      ${levelCardsHtml({
        label: c.difficulty,
        selectedId: difficulty,
        cards: [
          { id: 'junior', index: '01', label: c.diffJunior, blurb: c.diffJuniorHint, testId: 'level-junior' },
          { id: 'easy', index: '02', label: c.diffEasy, blurb: c.diffEasyHint, testId: 'level-easy' },
          { id: 'hard', index: '03', label: c.diffHard, blurb: c.diffHardHint, testId: 'level-hard' },
        ],
      })}
      ${advancedSettingsHtml({
        summary: c.advanced,
        open: advancedOpen,
        body: `
          ${
            mode === 'practice'
              ? `<div class="seed-row"><label>${c.seed} <input id="seedInput" data-testid="seed" type="text" value="${practiceSeed}" spellcheck="false" autocomplete="off" /></label><button type="button" class="secondary-button" id="randomSeed">${c.randomizeSeed}</button></div>`
              : `<p class="illustrative-note" data-testid="daily-note">${c.dailyNote}</p>`
          }
          <p class="illustrative-note">${c.best}: <strong data-testid="best-score">${best}</strong> (${c.scoreScope})</p>
          <ul class="sp-preset-facts">
            <li>${c.factOdors}: ${preset.odorCount}</li>
            <li>${c.factComponents}: ${preset.componentCountMin}${preset.componentCountMin !== preset.componentCountMax ? `\u2013${preset.componentCountMax}` : ''}</li>
            <li>${c.factStep}: ${preset.percentStep}%</li>
            <li>${c.factGuesses}: ${preset.maxGuesses}</li>
            <li>${c.factModel}: ${preset.mixingModel}</li>
          </ul>
          <div class="preference-row">
            <label><input type="checkbox" id="reducedMotion" ${store.reducedMotion ? 'checked' : ''} /> ${c.reducedMotion}</label>
            <label><input type="checkbox" id="highContrast" ${store.highContrast ? 'checked' : ''} /> ${options.getCopy().shell.highContrast}</label>
          </div>
          <button type="button" class="text-button" id="clearData">${c.clearData}</button>
          <button type="button" class="text-button" id="replayTutorialBtn">${c.replayTutorial}</button>
        `,
      })}
    `;

    settingsPanel.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = parseDifficultyId(btn.dataset.level);
        const changed = next !== difficulty;
        difficulty = next;
        store = { ...store, lastDifficulty: difficulty };
        saveStore(store);
        applySelectionChange(changed);
      });
    });
    settingsPanel.querySelector('#seedInput')?.addEventListener('change', (e) => {
      practiceSeed = (e.target as HTMLInputElement).value.trim() || createPracticeSeed();
    });
    settingsPanel.querySelector('#randomSeed')?.addEventListener('click', () => {
      practiceSeed = createPracticeSeed();
      paintSettings();
    });
    settingsPanel.querySelector('#reducedMotion')?.addEventListener('change', (e) => {
      store = { ...store, reducedMotion: (e.target as HTMLInputElement).checked };
      saveStore(store);
      applyA11y(store);
    });
    settingsPanel.querySelector('#highContrast')?.addEventListener('change', (e) => {
      store = { ...store, highContrast: (e.target as HTMLInputElement).checked };
      saveStore(store);
      applyA11y(store);
    });
    settingsPanel.querySelector('#clearData')?.addEventListener('click', () => {
      store = parseSpectrumStoredJson(null);
      saveStore(store);
      paintSettings();
    });
    settingsPanel.querySelector('#replayTutorialBtn')?.addEventListener('click', () => {
      store = { ...store, tutorialSeen: false };
      saveStore(store);
      startTutorial();
    });
    const advanced = settingsPanel.querySelector<HTMLDetailsElement>('#advanced');
    if (advanced) advanced.ontoggle = (e) => { advancedOpen = (e.target as HTMLDetailsElement).open; };
  }

  function paintReady(): void {
    phase = 'ready';
    const c = copy();
    const ui = options.getCopy().gameUi;
    const modeLabel = mode === 'daily' ? c.daily : c.practice;
    const levelLabel =
      difficulty === 'junior' ? c.diffJunior : difficulty === 'easy' ? c.diffEasy : c.diffHard;
    playArea.innerHTML = `${isStudyMode() ? studyBannerHtml(options.getCopy().study) + studyExportBarHtml(options.getCopy().study) : ''}${readyCopyHtml({
      kicker: gameHeaderKicker('03', `${modeLabel} \u00b7 ${levelLabel}`),
      title: c.titleShort,
      lead: c.readyLead,
      startId: 'start',
      startTestId: 'start',
      startLabel: ui.startGame,
    })}`;
    playArea.querySelector('#start')?.addEventListener('click', onStart);
    if (isStudyMode()) bindStudyExport(playArea);
  }

  function onStart(): void {
    const seedInput = document.querySelector<HTMLInputElement>('#seedInput');
    if (mode === 'practice' && seedInput) {
      practiceSeed = seedInput.value.trim() || createPracticeSeed();
    }
    const beginSession = (): void => {
      session =
        mode === 'daily'
          ? buildDailySpectrumSession({
              difficulty,
              signatures: SIGS,
              odorIds: ALL_IDS,
              contentVersion: SPECTRUM_CONTENT_VERSION,
            })
          : buildPracticeSpectrumSession({
              difficulty,
              signatures: SIGS,
              odorIds: ALL_IDS,
              contentVersion: SPECTRUM_CONTENT_VERSION,
              seed: practiceSeed,
            });
      store = recordSpectrumPlayedSeed(store, session.meta.seed);
      saveStore(store);
      history = [];
      lastFeedback = null;
      historyExpanded = false;
      moreDetailsOpen = false;
      justSubmitted = false;
      if (submitAnimTimer) window.clearTimeout(submitAnimTimer);
      hintLevel = 0;
      juniorPick = [];
      juniorRatio = '50-50';
      startedAt = Date.now();
      legalCandidates = [];
      store = { ...store, lastDifficulty: difficulty };
      saveStore(store);
      resetBuilder(session.puzzle.poolIds);
      refreshCandidates();
      if (!store.tutorialSeen) startTutorial();
      else startPlay();
    };
    if (!isStudyMode()) {
      beginSession();
      return;
    }
    const sc = options.getCopy().study;
    const loc = locale();
    studySession = createEducationSession({
      gameId: 'spectrum',
      gameVersion: SPECTRUM_GAME_VERSION,
      contentVersion: SPECTRUM_CONTENT_VERSION,
      locale: loc,
      selectedDifficulty: difficulty,
    });
    persistEducationSession(studySession);
    const items = preItems('spectrum');
    playArea.innerHTML = studyQuestionsHtml({
      title: sc.preTitle,
      lead: sc.preLead,
      items,
      locale: loc,
      copy: sc,
      submitLabel: sc.continue,
    });
    bindStudyQuestions(playArea, {
      items,
      session: studySession,
      phaseFor: () => 'pre',
      onDone: (next) => {
        studySession = next;
        persistEducationSession(studySession);
        beginSession();
      },
    });
  }

  function resetBuilder(poolIds?: readonly string[]): void {
    const ids = poolIds ?? session?.puzzle.poolIds ?? ALL_IDS.slice(0, getPreset(difficulty).odorCount);
    if (difficulty === 'junior') {
      builderRows = ids.map((odorId) => ({ odorId, selected: false, percent: 0 }));
      juniorPick = [];
      juniorRatio = '50-50';
    } else {
      builderRows = ids.map((odorId, i) => ({
        odorId,
        selected: i < 2,
        percent: i === 0 ? 60 : i === 1 ? 40 : 0,
      }));
    }
    autofillNotice = '';
  }

  function applyJuniorMix(): void {
    for (const row of builderRows) {
      row.percent = 0;
      row.selected = false;
    }
    if (juniorPick.length !== 2) return;
    const parts =
      juniorRatio === '25-75' ? [25, 75] : juniorRatio === '75-25' ? [75, 25] : [50, 50];
    juniorPick.forEach((id, i) => {
      const row = builderRows.find((r) => r.odorId === id);
      if (!row) return;
      row.percent = parts[i]!;
      row.selected = true;
    });
  }

  function selectedComponents(): MixtureComponent[] {
    return builderRows
      .filter((r) => r.percent > 0)
      .map((r) => ({ odorId: r.odorId, percent: r.percent }));
  }

  function refreshCandidates(): void {
    if (!session) {
      legalCandidates = [];
      survivingCandidates = [];
      survivingOdorIds = new Set();
      return;
    }
    if (legalCandidates.length === 0) {
      legalCandidates = enumerateLegalMixtures({
        odorIds: [...session.puzzle.poolIds],
        preset: getPreset(difficulty),
      });
    }
    const historyEntries = history.map((h) => ({
      guess: h.guess,
      ab: { a: h.a, b: h.b },
    }));
    survivingCandidates =
      historyEntries.length === 0
        ? legalCandidates
        : filterCandidates(legalCandidates, {
            history: historyEntries,
            poolIds: session.puzzle.poolIds,
          });
    survivingOdorIds = new Set(
      survivingCandidates.flatMap((m) => m.components.map((c) => c.odorId)),
    );
  }

  function builderSum(): number {
    return selectedComponents().reduce((s, c) => s + c.percent, 0);
  }

  function startTutorial(): void {
    phase = 'tutorial';
    tutorialStep = 0;
    paintTutorial();
  }

  function paintTutorial(): void {
    const c = copy();
    const steps = [
      { title: c.tut1Title, body: c.tut1Body, demo: 'single' as const },
      { title: c.tut2Title, body: c.tut2Body, demo: 'mix' as const },
      { title: c.tut3Title, body: c.tut3Body, demo: 'infer' as const },
    ];
    const step = steps[tutorialStep]!;
    playArea.innerHTML = `
      <div class="tutorial-state" data-testid="tutorial" data-tutorial-step="${tutorialStep}">
        <p class="sp-step-label">${c.tutorial} ${tutorialStep + 1}/3</p>
        <h3>${step.title}</h3>
        <p>${step.body}</p>
        <p class="sp-axis-note">${c.axisNote}</p>
        <canvas class="sp-canvas" data-tut-canvas width="640" height="220" aria-label="${c.chartAria}"></canvas>
        <p class="sr-only" data-tut-sr></p>
        <div class="sp-actions">
          <button type="button" class="text-button" id="skipTutorial" data-testid="skip-tutorial">${c.skipTutorial}</button>
          ${tutorialStep > 0 ? `<button type="button" class="ghost-button" id="tutPrev">${c.back}</button>` : ''}
          <button type="button" class="primary-button" id="tutNext" data-testid="tut-next">${tutorialStep < 2 ? c.next : c.startPlay}</button>
        </div>
      </div>
    `;
    const canvas = playArea.querySelector<HTMLCanvasElement>('[data-tut-canvas]')!;
    const banana = SIGS.get('banana')!;
    let series: readonly number[] = banana;
    if (step.demo === 'mix' || step.demo === 'infer') {
      series = linearMix(
        canonicalizeMixture([
          { odorId: 'banana', percent: 60 },
          { odorId: 'lemon', percent: 40 },
        ]),
        SIGS,
      );
    }
    drawChannelChart(canvas, {
      bars: { values: series, color: '#6ecf8a' },
      curves: [{ values: series, color: '#c4a35a' }],
      xLabel: c.xAxis,
      yLabel: c.yAxis,
      highContrast: store.highContrast,
      reducedMotion: store.reducedMotion,
    });
    const sr = playArea.querySelector('[data-tut-sr]');
    if (sr) sr.textContent = channelSummaryText(series, locale());

    playArea.querySelector('#skipTutorial')?.addEventListener('click', () => {
      store = { ...store, tutorialSeen: true };
      saveStore(store);
      startPlay();
    });
    playArea.querySelector('#tutPrev')?.addEventListener('click', () => {
      tutorialStep = Math.max(0, tutorialStep - 1);
      paintTutorial();
    });
    playArea.querySelector('#tutNext')?.addEventListener('click', () => {
      if (tutorialStep < 2) {
        tutorialStep += 1;
        paintTutorial();
      } else {
        store = { ...store, tutorialSeen: true };
        saveStore(store);
        startPlay();
      }
    });
  }

  function startPlay(): void {
    phase = 'play';
    paintPlay();
  }

  function paintPlay(): void {
    if (!session) return;
    refreshCandidates();
    if (difficulty === 'junior') applyJuniorMix();
    const c = copy();
    const preset = getPreset(difficulty);
    const remaining = preset.maxGuesses - history.length;
    const target = session.puzzle.observedSignal;
    const sum = builderSum();
    const draftComponents = selectedComponents();
    const draftOk = validateMixture(draftComponents, {
      minPercent: preset.minPercent,
      percentStep: preset.percentStep,
      componentCountMin: preset.componentCountMin,
      componentCountMax: preset.componentCountMax,
    }).ok;
    const canSubmit = draftOk && remaining > 0;
    const juniorChart = difficulty === 'junior';
    const candidateOdorNames = [...survivingOdorIds]
      .map((id) => odorName(id, locale()))
      .sort((a, b) => a.localeCompare(b));
    const candidatesHtml = `
      <p class="sp-candidates" data-testid="candidates">
        ${c.candidatesLeft}: <strong data-testid="candidate-count">${survivingCandidates.length}</strong>
        \u00b7 ${c.candidateOdors}: <span data-testid="candidate-odors">${
          candidateOdorNames.length ? candidateOdorNames.join(', ') : '\u2014'
        }</span>
      </p>`;
    const reveal = hintLevel >= 2 ? hintRevealComponent(survivingCandidates) : null;
    const closest =
      hintLevel >= 3 && session
        ? hintClosestCandidates({
            surviving: survivingCandidates,
            observedSignal: session.puzzle.observedSignal,
            signatures: SIGS,
            difficulty,
            seed: session.meta.seed,
          })
        : [];
    const hintBtn =
      hintLevel < 3
        ? `<button type="button" class="text-button" id="useHint" data-testid="use-hint" aria-label="${c.hint}">${c.hint}</button>`
        : '';
    const feedbackLine = lastFeedback
      ? `<p class="sp-child-fb" data-testid="feedback" data-ab="${lastFeedback.a}A${lastFeedback.b}B">${childFeedbackSentence(lastFeedback, c)}</p>`
      : '';
    const lastGuessCard = lastFeedback ? renderLastGuessCard(lastFeedback, c, { animate: justSubmitted, overlay: !juniorChart }) : '';
    const historyCards = renderHistoryCards(c);
    const moreDetails = `
      <details class="sp-more" data-testid="more-details"${moreDetailsOpen ? ' open' : ''}>
        <summary>${c.moreDetails}</summary>
        ${lastFeedback ? renderGuessRow(lastFeedback, c) : ''}
        ${lastFeedback ? renderFeedback(lastFeedback, c) : ''}
        ${candidatesHtml}
        <section class="sp-history" data-testid="history">
          <button type="button" class="text-button" id="toggleHistory" data-testid="toggle-history" aria-expanded="${historyExpanded}">
            ${c.history} (${history.length})
          </button>
          <div class="sp-history-scroll" ${historyExpanded ? '' : 'hidden'}>
            <table class="sp-history-table">
              <thead><tr><th>#</th><th>${c.guess}</th><th>A/B</th><th>${c.signalFit}</th></tr></thead>
              <tbody>
                ${
                  history.length === 0
                    ? `<tr><td colspan="4">${c.noHistory}</td></tr>`
                    : history
                        .map(
                          (h) =>
                            `<tr><td>${h.index}</td><td>${formatMixtureLabel(h.guess, locale())}</td><td>${h.a}A${h.b}B</td><td>${h.fit}</td></tr>`,
                        )
                        .join('')
                }
              </tbody>
            </table>
          </div>
        </section>
        <p class="sp-muted">${c.seed}: <code data-testid="play-seed">${session.meta.seed}</code></p>
        <p class="sp-muted" data-testid="channel-note">${juniorChart ? c.channelNotSpectrum : c.axisNote}</p>
      </details>`;

    playArea.innerHTML = `
      <div class="play-state${juniorChart ? ' is-junior' : ''}" data-testid="play">
        <div class="sp-status">
          <span>${c.remaining}: <strong data-testid="remaining">${remaining}</strong></span>
          ${
            preset.revealComponentCount
              ? `<span data-testid="mix-count">${c.componentCount}: <strong>${session.puzzle.truth.components.length}</strong></span>`
              : ''
          }
          ${hintBtn}
        </div>
        ${feedbackLine}
        <div class="sp-pattern-stack" data-testid="pattern-stack">
          ${renderPredictColumns({
            odorsId: juniorChart ? undefined : 'builderSlots',
            odorsHtml: renderPoolRows(c, { controls: !juniorChart }),
            compareHtml: `
          <div class="sp-pattern-row is-question">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${c.patternQuestion}</span>
              <strong title="${juniorChart ? c.channelNotSpectrum : c.axisNote}">${c.targetSignal}</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" id="targetCanvas" width="640" height="168" aria-label="${c.chartAria}"></canvas>
              <p class="sr-only" id="targetSr"></p>
            </div>
          </div>
          ${lastGuessCard}`,
          })}
        </div>
        ${historyCards}
        ${hintLevel > 0 ? renderHints(c, reveal, closest) : ''}

        <section class="sp-builder" aria-label="${c.builder}" data-testid="builder">
          ${
            juniorChart
              ? renderJuniorBuilder(c)
              : `<div class="sp-builder-head">
            <h3>${c.builder}</h3>
          </div>
          <p class="sp-sum" data-testid="sum-line">${c.sum}: <strong data-testid="sum">${sum}</strong>/100
            ${sum !== 100 ? `<span class="sp-warn">${c.sumNeed100}</span>` : ''}</p>
          ${autofillNotice ? `<p class="sp-autofill-note" data-testid="autofill-note" role="status">${autofillNotice}</p>` : ''}
          <div class="sp-actions">
            <button type="button" class="ghost-button" id="autofill" data-testid="autofill">${c.autofill}</button>
            <button type="button" class="primary-button" id="submitGuess" data-testid="submit" ${canSubmit ? '' : 'disabled'}>${c.submit}</button>
          </div>`
          }
        </section>
        ${moreDetails}
      </div>
    `;

    drawChannelChart(playArea.querySelector('#targetCanvas')!, {
      bars: { values: target, color: '#5ec4d1' },
      curves: [{ values: target, color: '#c4a35a' }],
      xLabel: juniorChart ? c.channelTitle : c.xAxis,
      yLabel: c.yAxis,
      highContrast: store.highContrast,
      reducedMotion: store.reducedMotion,
      simple: juniorChart,
    });
    const tsr = playArea.querySelector('#targetSr');
    if (tsr) tsr.textContent = channelSummaryText(target, locale(), juniorChart);

    if (lastFeedback) {
      paintGuessComparisonCharts(lastFeedback, session.puzzle.observedSignal, c, juniorChart, !juniorChart);
      if (justSubmitted) {
        for (const comp of lastFeedback.guess.components) {
          playArea.querySelector(`[data-testid="odor-card-${comp.odorId}"]`)?.classList.add('is-submit-flash');
          playArea
            .querySelector(`[data-testid="percent-${comp.odorId}"]`)
            ?.closest('.sp-pattern-row')
            ?.classList.add('is-submit-flash');
        }
      }
    }

    if (preset.showSignatureHints) {
      playArea.querySelectorAll<HTMLCanvasElement>('[data-hint-canvas]').forEach((cv) => {
        const id = cv.dataset.hintCanvas!;
        const sig = SIGS.get(id);
        if (!sig) return;
        drawSignatureHint(cv, sig, store.highContrast, {
          xLabel: juniorChart ? c.channelTitle : c.xAxis,
          yLabel: c.yAxis,
          simple: juniorChart,
        });
      });
    }

    bindBuilder(c);
  }

  function mixtureChipsHtml(m: CanonicalMixture): string {
    const loc = locale();
    return m.components
      .map((comp, i) => {
        const name = odorName(comp.odorId, loc);
        const chip = `<span class="sp-mix-chip">${odorIconHtml(comp.odorId, name)} <strong>${escapeHtml(name)}</strong> ${comp.percent}%</span>`;
        return i === 0 ? chip : `<span class="sp-mix-plus" aria-hidden="true">+</span>${chip}`;
      })
      .join('');
  }

  function renderPredictColumns(args: {
    odorsHtml: string;
    compareHtml: string;
    odorsId?: string;
  }): string {
    const odorsId = args.odorsId ? ` id="${args.odorsId}"` : '';
    return `
      <div class="sp-predict">
        <div class="sp-predict-odors"${odorsId}>${args.odorsHtml}</div>
        <div class="sp-predict-compare">${args.compareHtml}</div>
      </div>
    `;
  }

  function renderLastGuessCard(
    row: GuessHistoryRow,
    c: Record<string, string>,
    opts: { animate: boolean; overlay: boolean },
  ): string {
    const entering = opts.animate && !store.reducedMotion ? ' is-entering' : '';
    return `
      <section class="sp-last-guess${entering}" data-testid="last-guess">
        <div class="sp-last-guess-head">
          <span class="sp-pattern-kicker">${c.lastGuessTitle}</span>
          <div class="sp-last-mix" data-testid="last-guess-mix">${mixtureChipsHtml(row.guess)}</div>
        </div>
        <div class="sp-guess-compare">
          <div class="sp-pattern-row is-result">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${c.lastGuessYours}</span>
              <strong>${c.patternGuess}</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" id="guessCanvas" data-testid="guess-chart" width="640" height="148" aria-label="${c.chartAria}"></canvas>
            </div>
          </div>
          ${
            opts.overlay
              ? `<div class="sp-pattern-row is-overlay">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${c.overlayCompare}</span>
              <strong>${c.mergePattern}</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" id="overlayCanvas" width="640" height="148" aria-label="${c.chartAria}"></canvas>
              <ul class="sp-legend">
                <li><span class="swatch" style="background:#c4a35a"></span>${c.targetCurve}</li>
                <li><span class="swatch" style="background:#6ecf8a"></span>${c.guessCurve}</li>
              </ul>
            </div>
          </div>`
              : ''
          }
        </div>
      </section>
    `;
  }

  function renderHistoryCards(c: Record<string, string>): string {
    if (history.length === 0) return '';
    return `
      <section class="sp-history-cards" data-testid="guess-history">
        ${history
          .map(
            (h) => `
          <button type="button" class="sp-history-card${lastFeedback?.index === h.index ? ' is-active' : ''}" data-history-card="${h.index}" data-testid="history-card-${h.index}">
            <span class="sp-pattern-kicker">${c.tryLabel.replace('{n}', String(h.index))}</span>
            <span class="sp-history-mix">${h.guess.components.map((comp) => odorName(comp.odorId, locale())).join(' + ')}</span>
            <canvas class="sp-mini-canvas" data-mini-history="${h.index}" width="220" height="56" aria-hidden="true"></canvas>
          </button>`,
          )
          .join('')}
      </section>
    `;
  }

  function paintGuessComparisonCharts(
    row: GuessHistoryRow,
    target: readonly number[],
    c: Record<string, string>,
    simple: boolean,
    overlay: boolean,
  ): void {
    const diffs = differingChannels(target, row.guessSignal);
    const guessCanvas = playArea.querySelector<HTMLCanvasElement>('#guessCanvas');
    if (guessCanvas) {
      drawChannelChart(guessCanvas, {
        bars: { values: row.guessSignal, color: '#6ecf8a' },
        curves: [{ values: row.guessSignal, color: '#27856a' }],
        xLabel: simple ? c.channelTitle : c.xAxis,
        yLabel: c.yAxis,
        highContrast: store.highContrast,
        reducedMotion: store.reducedMotion,
        simple,
        emphasizeIndices: diffs,
        emphasizeColor: '#ee7b66',
      });
    }
    const overlayCanvas = playArea.querySelector<HTMLCanvasElement>('#overlayCanvas');
    if (overlay && overlayCanvas) {
      drawChannelChart(overlayCanvas, {
        curves: [
          { values: target, color: '#c4a35a' },
          { values: row.guessSignal, color: '#6ecf8a' },
        ],
        xLabel: c.xAxis,
        yLabel: c.yAxis,
        highContrast: store.highContrast,
        reducedMotion: store.reducedMotion,
        emphasizeIndices: diffs,
        emphasizeColor: '#ee7b66',
      });
    }
    playArea.querySelectorAll<HTMLCanvasElement>('[data-mini-history]').forEach((cv) => {
      const idx = Number(cv.dataset.miniHistory);
      const item = history.find((h) => h.index === idx);
      if (!item) return;
      drawChannelChart(cv, {
        bars: { values: item.guessSignal, color: '#6ecf8a' },
        curves: [{ values: item.guessSignal, color: '#27856a' }],
        xLabel: '',
        yLabel: '',
        highContrast: store.highContrast,
        reducedMotion: true,
        simple: true,
        showDots: false,
      });
    });
  }

  function renderGuessRow(row: GuessHistoryRow, c: Record<string, string>): string {
    return `
      <div class="sp-pattern-row is-result">
        <div class="sp-pattern-meta">
          <span class="sp-pattern-kicker">${c.patternGuess}</span>
          <strong>${row.a}A${row.b}B</strong>
          <span class="sp-muted">${c.signalFit} ${row.fit}</span>
        </div>
      </div>
    `;
  }

  function childFeedbackSentence(row: GuessHistoryRow, c: Record<string, string>): string {
    if (row.a >= 2 && row.b > 0) return c.fbBothProportions;
    if (row.a === 1) return c.fbFoundOneOfTwo;
    if (row.b > 0 && row.fit >= 80) return c.fbPatternClose;
    return c.fbTryPair;
  }

  function renderFeedback(row: GuessHistoryRow, c: Record<string, string>): string {
    return `
      <section class="sp-feedback" data-testid="feedback-panel" aria-live="assertive">
        <details class="sp-tech-details" data-testid="tech-details">
          <summary>${c.techDetails}</summary>
          <p data-testid="ab-result"><strong>${row.a}A${row.b}B</strong> · ${c.signalFit}: <strong data-testid="fit-score">${row.fit}</strong></p>
          <p class="sp-muted">${c.abBlind}</p>
        </details>
      </section>
    `;
  }

  function renderHints(
    c: Record<string, string>,
    reveal: ReturnType<typeof hintRevealComponent>,
    closest: CanonicalMixture[],
  ): string {
    const possible = hintLevel >= 1 ? hintPossibleOdorIds(survivingCandidates) : [];
    const impossible =
      hintLevel >= 2 && session
        ? session.puzzle.poolIds.filter((id) => !survivingOdorIds.has(id))
        : [];
    const hint2 =
      hintLevel >= 2 && reveal
        ? `<p class="sp-hint-banner" data-testid="hint-reveal">
            ${
              reveal.inAll
                ? c.hintRevealSure.replace('{odor}', odorName(reveal.odorId, locale()))
                : c.hintRevealMaybe.replace('{odor}', odorName(reveal.odorId, locale()))
            }
            ${
              impossible.length
                ? `<span data-testid="hint-eliminated"> ${c.hintEliminated}: ${impossible
                    .map((id) => odorName(id, locale()))
                    .join(', ')}</span>`
                : ''
            }
          </p>`
        : '';
    const hint3 =
      hintLevel >= 3 && closest.length
        ? `<div class="sp-hint-mixes" data-testid="hint-mixes">
            <p>${c.hintClosest}</p>
            <div class="sp-hint-mix-grid">
              ${closest
                .map((mix, i) => {
                  const filled = hintAutofillMixture(mix, difficulty);
                  if (!filled) return '';
                  return `<button type="button" class="sp-hint-mix" data-hint-mix="${i}" data-testid="hint-mix-${i}">
                    ${formatMixtureLabel(filled, locale())}
                  </button>`;
                })
                .join('')}
            </div>
          </div>`
        : '';
    return `
      <div class="sp-hints" data-testid="hints" data-hint-level="${hintLevel}">
        ${hintLevel >= 1 && possible.length ? `<p class="sr-only">${c.hintPossible}: ${possible.map((id) => odorName(id, locale())).join(', ')}</p>` : ''}
        ${hint2}
        ${hint3}
        ${hintLevel >= 3 ? `<p class="sp-muted">${c.hintsMax}</p>` : ''}
      </div>
    `;
  }

  function renderJuniorBuilder(c: Record<string, string>): string {
    const preset = getPreset(difficulty);
    const sum = builderSum();
    const remaining = preset.maxGuesses - history.length;
    const draftOk = validateMixture(selectedComponents(), {
      minPercent: preset.minPercent,
      percentStep: preset.percentStep,
      componentCountMin: preset.componentCountMin,
      componentCountMax: preset.componentCountMax,
    }).ok;
    const canSubmit = draftOk && remaining > 0;
    const loc = locale();
    const mixLabel =
      juniorPick.length === 2
        ? `${odorName(juniorPick[0]!, loc)} ${
            juniorRatio === '25-75' ? 25 : juniorRatio === '75-25' ? 75 : 50
          }% + ${odorName(juniorPick[1]!, loc)} ${
            juniorRatio === '25-75' ? 75 : juniorRatio === '75-25' ? 25 : 50
          }%`
        : c.juniorNeedTwo;
    const cards = builderRows
      .map((row) => {
        const pickIndex = juniorPick.indexOf(row.odorId);
        const picked = pickIndex >= 0;
        const possible = hintLevel >= 1 ? new Set(hintPossibleOdorIds(survivingCandidates)) : null;
        const hintOn = Boolean(possible && possible.has(row.odorId));
        const hintOff = Boolean(possible && !possible.has(row.odorId) && !picked);
        const sketch = preset.showSignatureHints
          ? `<canvas class="sp-hint-canvas" data-hint-canvas="${row.odorId}" width="240" height="72" aria-hidden="true"></canvas>`
          : '';
        return `<button type="button" class="sp-odor-card${picked ? ' is-picked' : ''}${hintOn ? ' is-hint-possible' : ''}${hintOff ? ' is-hint-out' : ''}"
          data-odor-card="${row.odorId}" data-testid="odor-card-${row.odorId}" aria-pressed="${picked}" title="${odorName(row.odorId, loc)}">
          <strong class="sp-odor-card-name">${odorName(row.odorId, loc)}</strong>
          ${picked ? `<span class="sp-odor-order">${pickIndex + 1}</span>` : ''}
          ${sketch}
        </button>`;
      })
      .join('');
    return `
      <div class="sp-junior-builder" data-testid="junior-builder">
        <div class="sp-odor-cards" role="group" aria-label="${c.how1Title}">${cards}</div>
        <p class="sp-mix-preview" data-testid="junior-mix">${mixLabel}</p>
        <div class="sp-ratio-row" role="group" aria-label="${c.how2Title}">
          <button type="button" class="sp-ratio-btn${juniorRatio === '25-75' ? ' is-on' : ''}" data-ratio="25-75" data-testid="ratio-25-75" aria-pressed="${juniorRatio === '25-75'}">25 / 75</button>
          <button type="button" class="sp-ratio-btn${juniorRatio === '50-50' ? ' is-on' : ''}" data-ratio="50-50" data-testid="ratio-50-50" aria-pressed="${juniorRatio === '50-50'}">50 / 50</button>
          <button type="button" class="sp-ratio-btn${juniorRatio === '75-25' ? ' is-on' : ''}" data-ratio="75-25" data-testid="ratio-75-25" aria-pressed="${juniorRatio === '75-25'}">75 / 25</button>
        </div>
        <div class="sp-actions">
          <button type="button" class="ghost-button" id="swapOdors" data-testid="swap-odors" ${juniorPick.length === 2 ? '' : 'disabled'}>${c.juniorSwap}</button>
        </div>
        <p class="sp-sum" data-testid="sum-line" hidden>${c.sum}: <strong data-testid="sum">${sum}</strong>/100</p>
        ${autofillNotice ? `<p class="sp-autofill-note" data-testid="autofill-note" role="status">${autofillNotice}</p>` : ''}
        <div class="sp-actions">
          <button type="button" class="primary-button" id="submitGuess" data-testid="submit" ${canSubmit ? '' : 'disabled'}>${c.submit}</button>
        </div>
      </div>
    `;
  }

  function applyCanonicalToBuilder(mix: CanonicalMixture): boolean {
    const filled = hintAutofillMixture(mix, difficulty);
    if (!filled) return false;
    if (difficulty === 'junior') {
      juniorPick = filled.components.map((comp) => comp.odorId);
      const p0 = filled.components[0]?.percent ?? 50;
      const p1 = filled.components[1]?.percent ?? 50;
      if (p0 === 25 && p1 === 75) juniorRatio = '25-75';
      else if (p0 === 75 && p1 === 25) juniorRatio = '75-25';
      else juniorRatio = '50-50';
      applyJuniorMix();
    } else {
      for (const row of builderRows) {
        const comp = filled.components.find((item) => item.odorId === row.odorId);
        row.percent = comp?.percent ?? 0;
        row.selected = row.percent > 0;
      }
    }
    return true;
  }

  function renderPoolRows(
    c: Record<string, string>,
    opts: { controls: boolean } = { controls: true },
  ): string {
    const preset = getPreset(difficulty);
    return builderRows
      .map((row, i) => {
        const on = opts.controls ? row.percent > 0 : juniorPick.includes(row.odorId);
        const hintOut =
          hintLevel >= 1 &&
          survivingOdorIds.size > 0 &&
          !survivingOdorIds.has(row.odorId) &&
          !on;
        const hint = preset.showSignatureHints
          ? `<canvas class="sp-canvas" data-hint-canvas="${row.odorId}" width="640" height="168" aria-label="${c.signatureHint}"></canvas>`
          : '';
        const stepper = opts.controls
          ? `<div class="sp-stepper">
                <button type="button" data-dec="${i}" aria-label="${c.stepDown} ${odorName(row.odorId, locale())}">\u2212</button>
                <input type="range" data-range="${i}" data-testid="range-${row.odorId}" min="0" max="100" step="${preset.percentStep}" value="${row.percent}" aria-label="${odorName(row.odorId, locale())}" />
                <input type="number" data-num="${i}" data-testid="percent-${row.odorId}" min="0" max="100" step="${preset.percentStep}" value="${row.percent}" aria-label="${odorName(row.odorId, locale())} %" />
                <button type="button" data-inc="${i}" aria-label="${c.stepUp} ${odorName(row.odorId, locale())}">+</button>
              </div>`
          : '';
        const pct = opts.controls
          ? `<span class="sp-pct-label" data-testid="sel-${row.odorId}">${row.percent}%</span>`
          : '';
        return `
          <div class="sp-pattern-row is-option${on ? ' is-picked' : ''}${hintOut ? ' is-hint-out' : ''}" data-row="${i}">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${c.patternChoice}</span>
              <div class="sp-odor-name">
                <span>${odorName(row.odorId, locale())}</span>
                ${pct}
              </div>
              ${stepper}
            </div>
            <div class="sp-pattern-chart">${hint}</div>
          </div>
        `;
      })
      .join('');
  }

  function bindBuilder(c: Record<string, string>): void {
    const preset = getPreset(difficulty);
    playArea.querySelector('#toggleHistory')?.addEventListener('click', () => {
      historyExpanded = !historyExpanded;
      moreDetailsOpen = true;
      paintPlay();
    });
    playArea.querySelectorAll('[data-history-card]').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = Number((el as HTMLElement).dataset.historyCard);
        const row = history.find((h) => h.index === idx);
        if (!row) return;
        lastFeedback = row;
        justSubmitted = false;
        paintPlay();
      });
    });
    playArea.querySelector('[data-testid="more-details"]')?.addEventListener('toggle', (e) => {
      moreDetailsOpen = (e.target as HTMLDetailsElement).open;
    });
    playArea.querySelector('#useHint')?.addEventListener('click', () => {
      hintLevel = Math.min(3, hintLevel + 1);
      paintPlay();
    });
    playArea.querySelectorAll('[data-hint-mix]').forEach((el) => {
      el.addEventListener('click', () => {
        const i = Number((el as HTMLElement).dataset.hintMix);
        if (!session) return;
        const closest = hintClosestCandidates({
          surviving: survivingCandidates,
          observedSignal: session.puzzle.observedSignal,
          signatures: SIGS,
          difficulty,
          seed: session.meta.seed,
        });
        const mix = closest[i];
        if (!mix) return;
        if (applyCanonicalToBuilder(mix)) {
          autofillNotice = c.hintAutofillOk;
          paintPlay();
        }
      });
    });
    playArea.querySelectorAll('[data-odor-card]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.odorCard!;
        const idx = juniorPick.indexOf(id);
        if (idx >= 0) {
          juniorPick = juniorPick.filter((x) => x !== id);
        } else if (juniorPick.length < 2) {
          juniorPick = [...juniorPick, id];
        }
        applyJuniorMix();
        paintPlay();
      });
    });
    playArea.querySelectorAll('[data-ratio]').forEach((el) => {
      el.addEventListener('click', () => {
        juniorRatio = (el as HTMLElement).dataset.ratio as JuniorRatio;
        applyJuniorMix();
        paintPlay();
      });
    });
    playArea.querySelector('#swapOdors')?.addEventListener('click', () => {
      if (juniorPick.length === 2) {
        juniorPick = [juniorPick[1]!, juniorPick[0]!];
        applyJuniorMix();
        paintPlay();
      }
    });
    playArea.querySelector('#autofill')?.addEventListener('click', () => {
      const selected = builderRows.filter((r) => r.percent > 0);
      if (selected.length === 0) {
        autofillNotice = c.autofillFail;
        paintPlay();
        return;
      }
      const target = selected[selected.length - 1]!;
      const sumOthers = selected
        .filter((r) => r.odorId !== target.odorId)
        .reduce((s, r) => s + r.percent, 0);
      const remain = 100 - sumOthers;
      if (remain < preset.minPercent || remain % preset.percentStep !== 0 || remain > 100) {
        autofillNotice = c.autofillFail;
      } else {
        const prev = target.percent;
        target.percent = remain;
        target.selected = true;
        autofillNotice = c.autofillOk
          .replace('{odor}', odorName(target.odorId, locale()))
          .replace('{from}', String(prev))
          .replace('{to}', String(remain));
      }
      paintPlay();
    });
    playArea.querySelector('#submitGuess')?.addEventListener('click', submitGuess);

    const setPercent = (i: number, value: number) => {
      const step = preset.percentStep;
      let v = Math.round(value / step) * step;
      v = Math.max(0, Math.min(100, v));
      if (v > 0 && v < preset.minPercent) v = preset.minPercent;
      builderRows[i]!.percent = v;
      builderRows[i]!.selected = v > 0;
      autofillNotice = '';
      paintPlay();
    };

    playArea.querySelectorAll('[data-inc]').forEach((el) => {
      el.addEventListener('click', () => {
        const i = Number((el as HTMLElement).dataset.inc);
        const cur = builderRows[i]!.percent;
        setPercent(i, cur === 0 ? preset.minPercent : cur + preset.percentStep);
      });
    });
    playArea.querySelectorAll('[data-dec]').forEach((el) => {
      el.addEventListener('click', () => {
        const i = Number((el as HTMLElement).dataset.dec);
        const cur = builderRows[i]!.percent;
        if (cur <= preset.minPercent) setPercent(i, 0);
        else setPercent(i, cur - preset.percentStep);
      });
    });
    playArea.querySelectorAll('[data-range]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const i = Number((e.target as HTMLInputElement).dataset.range);
        setPercent(i, Number((e.target as HTMLInputElement).value));
      });
    });
    playArea.querySelectorAll('[data-num]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const i = Number((e.target as HTMLInputElement).dataset.num);
        setPercent(i, Number((e.target as HTMLInputElement).value));
      });
    });
  }

  function submitGuess(): void {
    if (!session) return;
    const preset = getPreset(difficulty);
    if (history.length >= preset.maxGuesses) return;
    const components = selectedComponents();
    const validated = validateMixture(components, {
      minPercent: preset.minPercent,
      percentStep: preset.percentStep,
      componentCountMin: preset.componentCountMin,
      componentCountMax: preset.componentCountMax,
    });
    if (!validated.ok) return;

    const guess = validated.canonical;
    const ab = scoreAB(guess, session.puzzle.truth, session.puzzle.poolIds);
    const guessSignals = computeSignals(
      guess,
      SIGS,
      preset.mixingModel,
      session.meta.seed,
    );
    const fit = signalFitScore(session.puzzle.observedSignal, guessSignals.observed);
    const odorsBefore = new Set(survivingOdorIds);
    const row: GuessHistoryRow = {
      index: history.length + 1,
      guess,
      a: ab.a,
      b: ab.b,
      fit,
      guessSignal: guessSignals.observed,
      eliminatedOdors: 0,
    };
    history = [...history, row];
    refreshCandidates();
    let eliminatedOdors = 0;
    for (const id of odorsBefore) {
      if (!survivingOdorIds.has(id)) eliminatedOdors += 1;
    }
    row.eliminatedOdors = eliminatedOdors;
    lastFeedback = row;
    autofillNotice = '';
    justSubmitted = true;
    if (submitAnimTimer) window.clearTimeout(submitAnimTimer);
    submitAnimTimer = window.setTimeout(() => {
      justSubmitted = false;
      playArea.querySelector('.sp-last-guess')?.classList.remove('is-entering');
      playArea.querySelectorAll('.is-submit-flash').forEach((el) => el.classList.remove('is-submit-flash'));
    }, store.reducedMotion ? 80 : 560);

    const solved =
      mixturesEqual(guess, session.puzzle.truth) ||
      isPerfectAB(ab, session.puzzle.truth.components.length);
    if (solved || history.length >= preset.maxGuesses) {
      finish(solved);
      return;
    }
    paintPlay();
  }

  function finish(solved: boolean): void {
    if (!session) return;
    phase = 'result';
    const elapsedMs = Date.now() - startedAt;
    const breakdown = computeSpectrumScore({
      solved,
      guessesUsed: history.length,
      difficulty,
      elapsedMs,
      hintsUsed: hintLevel,
    });
    store = recordSpectrumBestScore(store, breakdown.scoreKey, breakdown.totalScore);
    saveStore(store);
    if (isStudyMode() && studySession) {
      studySession = markEducationPlayComplete(studySession, {
        durationMs: elapsedMs,
        numberOfAttempts: history.length,
        hintsUsed: hintLevel,
        selectedDifficulty: difficulty,
        outcome: {
          gameId: 'spectrum',
          spectrum: {
            guesses: history.length,
            hintLevel,
            solved,
            difficulty,
          },
        },
      });
      persistEducationSession(studySession);
    }
    paintResult(solved, breakdown);
  }

  function paintResult(
    solved: boolean,
    breakdown: ReturnType<typeof computeSpectrumScore>,
  ): void {
    if (!session) return;
    const c = copy();
    const preset = getPreset(difficulty);
    const truth = session.puzzle.truth;
    const loc = locale();

    const contribHtml = truth.components
      .map((comp) => {
        const sig = SIGS.get(comp.odorId)!;
        const w = comp.percent / 100;
        const weighted = sig.map((v) => v * w);
        return `
          <div class="sp-pattern-row is-option">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${c.patternChoice}</span>
              <strong>${odorName(comp.odorId, loc)} · ${comp.percent}%</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" data-contrib="${comp.odorId}" width="640" height="168"></canvas>
              <p class="sr-only">${channelSummaryText(weighted, loc)}</p>
            </div>
          </div>
        `;
      })
      .join('');

    const lastGuessOnResult = lastFeedback
      ? renderLastGuessCard(lastFeedback, c, { animate: false, overlay: difficulty !== 'junior' })
      : '';

    const patternBlock =
      preset.mixingModel === 'linear'
        ? `<div class="sp-pattern-stack" data-testid="result-patterns">
                ${renderPredictColumns({
                  odorsHtml: contribHtml,
                  compareHtml: `
                <div class="sp-pattern-row is-question">
                  <div class="sp-pattern-meta">
                    <span class="sp-pattern-kicker">${c.patternQuestion}</span>
                    <strong>${c.targetSignal}</strong>
                  </div>
                  <div class="sp-pattern-chart">
                    <canvas class="sp-canvas" id="resultTargetCanvas" width="640" height="168" aria-label="${c.chartAria}"></canvas>
                  </div>
                </div>
                ${lastGuessOnResult}`,
                })}
              </div>`
        : `<h4>${c.satCompare}</h4>
               <div class="sp-pattern-stack">
                 <div class="sp-pattern-row is-result">
                   <div class="sp-pattern-meta">
                     <span class="sp-pattern-kicker">${c.patternGuess}</span>
                     <strong>${c.satCompare}</strong>
                   </div>
                   <div class="sp-pattern-chart">
                     <canvas class="sp-canvas" id="satCanvas" width="640" height="168"></canvas>
                     <ul class="sp-legend">
                       <li><span class="swatch" style="background:#6ecf8a"></span>${c.linear}</li>
                       <li><span class="swatch" style="background:#5ec4d1"></span>${c.saturated}</li>
                       <li><span class="swatch" style="background:#c4a35a"></span>${c.observed}</li>
                     </ul>
                   </div>
                 </div>
               </div>`;

    const metrics = [
      { value: String(breakdown.totalScore), label: c.totalScore, testId: 'total-score-metric' },
      { value: `${breakdown.guessesUsed}/${breakdown.maxGuesses}`, label: c.guessesUsed },
      { value: String(hintLevel), label: c.hintsUsed, testId: 'hints-used' },
    ];
    if (difficulty !== 'junior') {
      metrics.push({ value: String(breakdown.guessScore), label: c.guessScore, testId: 'guess-score' });
    }

    playArea.innerHTML = resultLayoutHtml({
      testId: 'result',
      extraAttrs: `data-solved="${solved}"`,
      scoreHtml: scoreRingHtml({
        score: String(breakdown.totalScore),
        label: c.totalScore,
        angle: Math.min(360, (breakdown.totalScore / 10_000) * 360),
      }),
      scoreExtraHtml: `<span data-testid="total-score" class="sr-only">${breakdown.totalScore}</span>`,
      badge: { text: solved ? c.solved : c.failed, fail: !solved },
      kicker: gameHeaderKicker('03'),
      title: solved ? c.solved : c.failed,
      titleTestId: 'result-title',
      leadHtml: `<p>${c.truth}: <strong data-testid="truth">${formatMixtureLabel(truth, loc)}</strong></p>`,
      metrics,
      discoveredTitle: c.discoveredTitle,
      discoveredBody: c.discoveredBody,
      discoveredTestId: 'discovered',
      extraCopyHtml: patternBlock,
      actionsHtml: `<button type="button" class="primary-button" id="again" data-testid="again">${c.playAgain}</button><button type="button" class="secondary-button" id="toSetup" data-testid="to-setup">${c.backSetup}</button>`,
      technicalSummary: options.getCopy().gameUi.technicalDetails,
      technicalHtml: `<p class="sp-disclaimer" data-testid="model-disclaimer">${c.modelDisclaimer}</p>
        <p>${c.seed}: <code>${session.meta.seed}</code></p>
        <p>${c.ruleVersion}: ${session.meta.ruleVersion}</p>
        <p>${c.contentVersion}: ${session.meta.contentVersion}</p>
        <p>${c.gameVersion}: ${session.meta.gameVersion}</p>
        <p>${c.factModel}: ${preset.mixingModel}</p>
        <p>${c.guessScore}: ${breakdown.guessScore}${difficulty === 'junior' ? '' : ` \u00b7 ${c.timeScore}: ${breakdown.timeScore}`}</p>
        ${difficulty === 'junior' ? `<p>${c.juniorNoTime}</p>` : `<p>${c.elapsed}: <strong data-testid="elapsed">${formatElapsed(breakdown.elapsedMs)}</strong></p><p class="illustrative-note">${c.scoreScope}</p>`}
        ${
          preset.mixingModel === 'saturatedNoisy'
            ? `<p class="sp-disclaimer" data-testid="noise-disclaimer">${c.noiseDisclaimer}</p>`
            : ''
        }`,
    });

    if (preset.mixingModel === 'linear') {
      const resultTarget = playArea.querySelector<HTMLCanvasElement>('#resultTargetCanvas');
      if (resultTarget) {
        drawChannelChart(resultTarget, {
          bars: { values: session.puzzle.observedSignal, color: '#5ec4d1' },
          curves: [{ values: session.puzzle.observedSignal, color: '#c4a35a' }],
          xLabel: difficulty === 'junior' ? c.channelTitle : c.xAxis,
          yLabel: c.yAxis,
          highContrast: store.highContrast,
          reducedMotion: store.reducedMotion,
          simple: difficulty === 'junior',
        });
      }
      if (lastFeedback) {
        paintGuessComparisonCharts(
          lastFeedback,
          session.puzzle.observedSignal,
          c,
          difficulty === 'junior',
          difficulty !== 'junior',
        );
      }
      playArea.querySelectorAll<HTMLCanvasElement>('[data-contrib]').forEach((cv) => {
        const id = cv.dataset.contrib!;
        const comp = truth.components.find((x) => x.odorId === id)!;
        const sig = SIGS.get(id)!;
        const weighted = sig.map((v) => v * (comp.percent / 100));
        drawChannelChart(cv, {
          bars: { values: weighted, color: '#6ecf8a' },
          curves: [{ values: weighted, color: '#c4a35a' }],
          xLabel: difficulty === 'junior' ? c.channelTitle : c.xAxis,
          yLabel: c.yAxis,
          highContrast: store.highContrast,
          reducedMotion: store.reducedMotion,
          simple: difficulty === 'junior',
        });
      });
    } else {
      const sat = playArea.querySelector<HTMLCanvasElement>('#satCanvas');
      if (sat) {
        drawChannelChart(sat, {
          curves: [
            { values: session.puzzle.linearSignal, color: '#6ecf8a' },
            {
              values: session.puzzle.saturatedSignal ?? session.puzzle.linearSignal,
              color: '#5ec4d1',
            },
            { values: session.puzzle.observedSignal, color: '#c4a35a' },
          ],
          xLabel: c.xAxis,
          yLabel: c.yAxis,
          highContrast: store.highContrast,
          reducedMotion: store.reducedMotion,
        });
      }
    }

    playArea.querySelector('#again')?.addEventListener('click', () => {
      onStart();
    });
    playArea.querySelector('#toSetup')?.addEventListener('click', () => {
      abandonRun();
      paintModes();
      paintSettings();
      paintReady();
    });
    if (isStudyMode() && studySession) {
      const host = document.createElement('div');
      host.className = 'edu-post';
      playArea.appendChild(host);
      const sc = options.getCopy().study;
      const loc = locale();
      const items = postItems('spectrum');
      host.innerHTML =
        studyQuestionsHtml({
          title: sc.postTitle,
          lead: sc.postLead,
          items,
          locale: loc,
          copy: sc,
          submitLabel: sc.continue,
          allowSkip: true,
        }) + studyExportBarHtml(sc);
      bindStudyQuestions(host, {
        items,
        session: studySession,
        phaseFor: (item) => (item.phase === 'pre' ? 'post' : item.phase),
        onDone: (next) => {
          studySession = next;
          persistEducationSession(studySession);
          host.innerHTML = `<p data-testid="study-thanks">${sc.thanks}</p>${studyExportBarHtml(sc)}`;
          bindStudyExport(host);
        },
      });
      bindStudyExport(host);
    }
  }

  function refreshReady(): void {
    refreshChrome();
    if (phase === 'ready') {
      paintModes();
      paintSettings();
      paintReady();
    } else if (phase === 'tutorial') {
      paintTutorial();
    } else if (phase === 'play') {
      paintPlay();
    }
  }

  refreshChrome();
  paintModes();
  paintSettings();
  paintReady();
  options.onReady?.({ refreshReady });
}
