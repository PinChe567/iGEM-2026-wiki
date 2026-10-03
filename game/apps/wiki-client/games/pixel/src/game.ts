import {
  applyAnswer, buildDailySession, buildPracticeSession, buildSession, createPracticeSeed,
  dailyPresetIdForLevel, effectivePatternDisplayMs, getPreset, injectNoise, isPixelLevelId,
  listMatrixSizes, listNoisePercents, listPixelPresetIds, mergePracticeSettings,
  odorPattern, parsePixelStoredJson, patternDiff, PIXEL_LEVEL_IDS, PIXEL_STORAGE_KEY,
  PIXEL_GAME_VERSION, recordBestScore, recordPlayedSeed, summarizeResult, type BuiltSession, type DifficultySettings,
  type DistractorBias, type PixelLevelId, type PixelStoredState,
} from '@suite/core/pixel';
import {
  createEducationSession,
  markEducationPlayComplete,
  type EducationStudySession,
} from '@suite/core/education';
import { CONTENT_VERSION, contentCatalog, getAssetCredit, getOdorById, toPixelOdors } from '@suite/content';
import type { Locale } from '../../../src/i18n/locale';
import type { MessageTree } from '../../../src/i18n/messages';
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
  modeTabsHtml,
  readyCopyHtml,
  levelCardsHtml,
  resultLayoutHtml,
  scoreRingHtml,
} from '../../../src/game-ui';

type Options = {
  getCopy: () => MessageTree;
  getLocale: () => Locale;
  getSoundLabels: () => { on: string; off: string; toggle: string };
  onReady?: (api: { refreshReady: () => void }) => void;
};
const odors = toPixelOdors();
const patternCache = new Map<number, Map<string, boolean[]>>();
const DEMO_ODOR_ID = odors.some((odor) => odor.id === 'banana') ? 'banana' : odors[0]!.id;

export function startPixelGame(options: Options): void {
  let stored = load();
  let selectedLevel: PixelLevelId = 'practice';
  let selectedMode: 'practice' | 'daily' = 'practice';
  let activePresetId: string = selectedLevel;
  let settings = mergePracticeSettings({}, selectedLevel);
  let seed = createPracticeSeed();
  let session: BuiltSession | undefined;
  let round = 0, score = 0, answered = false, studyIndex = 0;
  let muted = stored.muted, reducedEffects = stored.reducedEffects, highContrast = stored.highContrast;
  let advancedOpen = false;
  let onboardStep = 0;
  let hideTimer = 0;
  let studySession: EducationStudySession | null = null;
  let studyReviewClicks = 0;
  let playStartedAt = 0;
  const playArea = need<HTMLElement>('#playArea');
  const settingsPanel = need<HTMLElement>('#settingsPanel');
  const modeTabs = need<HTMLElement>('#modeTabs');
  const sound = need<HTMLButtonElement>('#soundButton');
  const text = () => options.getCopy().pixel;
  const locale = () => options.getLocale();

  function load(): PixelStoredState {
    try { return parsePixelStoredJson(localStorage.getItem(PIXEL_STORAGE_KEY)); } catch { return parsePixelStoredJson(null); }
  }
  function save() { try { localStorage.setItem(PIXEL_STORAGE_KEY, JSON.stringify(stored)); } catch { /* optional */ } }
  function applyPreferences() {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.classList.toggle('reduced-effects', reducedEffects);
    sound.classList.toggle('muted', muted);
    sound.setAttribute('aria-label', muted ? options.getSoundLabels().on : options.getSoundLabels().off);
  }
  function name(id: string) { return getOdorById(id)?.name[locale()] ?? id; }
  function english(id: string) { return getOdorById(id)?.name.en ?? id; }
  function image(id: string, extra = '') {
    const index = contentCatalog.odors.findIndex((odor) => odor.id === id);
    return `<div class="smell-visual ${extra}" style="background-position:${index % 5 * 25}% ${Math.floor(index / 5) * 100 / 3}%" role="img" aria-label="${escape(`${name(id)} / ${english(id)}`)}"></div>`;
  }
  function base(id: string, size = settings.matrixSize) { return odorPattern(odors, id, size, patternCache); }
  function grid(
    cells: readonly ('off' | 'on' | 'noise')[],
    label: string,
    diff?: ReturnType<typeof patternDiff>,
    opts?: { size?: number; lightUp?: boolean },
  ) {
    const size = opts?.size ?? settings.matrixSize;
    const answerOnly = new Set(diff?.onlyAnswer), shownOnly = new Set(diff?.onlyShown), shared = new Set(diff?.sharedOn);
    return `<div class="led-matrix${opts?.lightUp ? ' light-up' : ''}" style="--size:${size}" role="img" aria-label="${escape(label)}">${cells.map((cell, i) => {
      const marks: string[] = [];
      if (answerOnly.has(i)) marks.push('diff-only-answer');
      if (shownOnly.has(i)) marks.push('diff-only-shown');
      if (shared.has(i)) marks.push('diff-shared');
      const title = shared.has(i) ? text().diffShared : answerOnly.has(i) ? text().diffAnswer : shownOnly.has(i) ? text().diffShown : cell;
      return `<i class="led-cell ${cell === 'on' ? 'on' : cell === 'noise' ? 'noise-cell' : ''} ${marks.join(' ')}" style="--i:${i}" title="${escape(title)}"></i>`;
    }).join('')}</div>`;
  }
  function clearHideTimer() {
    if (hideTimer) window.clearTimeout(hideTimer);
    hideTimer = 0;
  }
  function levelLabel(id: PixelLevelId) {
    const c = text();
    if (id === 'junior') return c.junior;
    if (id === 'challenge') return c.challenge;
    return c.standard;
  }
  function levelBlurb(id: PixelLevelId) {
    const c = text();
    if (id === 'junior') return c.juniorBlurb;
    if (id === 'challenge') return c.challengeBlurb;
    return c.standardBlurb;
  }
  function setup() {
    session = undefined;
    clearHideTimer();
    const existingAdvanced = document.querySelector<HTMLDetailsElement>('#advanced');
    if (existingAdvanced) existingAdvanced.ontoggle = null;
    const c = text();
    const g = options.getCopy().gameUi;
    modeTabs.innerHTML = modeTabsHtml({
      wrap: false,
      ariaLabel: c.chooseRun,
      selectedId: selectedMode,
      tabs: [
        { id: 'practice', label: c.practice, buttonId: 'practiceTab' },
        { id: 'daily', label: c.daily, buttonId: 'dailyButton' },
      ],
    });
    settingsPanel.innerHTML = `<h3>${c.chooseLevel}</h3>
      ${levelCardsHtml({
        label: c.chooseLevel,
        selectedId: selectedLevel,
        cards: PIXEL_LEVEL_IDS.map((id) => ({
          id,
          index: id === 'junior' ? '01' : id === 'practice' ? '02' : '03',
          label: levelLabel(id),
          blurb: levelBlurb(id),
        })),
      })}
      ${advancedSettingsHtml({
        summary: g.advanced,
        open: advancedOpen,
        body: `
        <label>${c.namedPreset}<select id="namedPreset">${listPixelPresetIds().map((id) => `<option value="${id}" ${id === activePresetId ? 'selected' : ''}>${id}</option>`).join('')}</select></label>
        <label>${c.matrixSize}<select id="matrixSize">${listMatrixSizes().map((n) => `<option value="${n}" ${n === settings.matrixSize ? 'selected' : ''}>${n} \u00d7 ${n}</option>`).join('')}</select></label>
        <label>${c.distractorBias}<select id="bias">${(['mixed', 'similar', 'very-similar'] as DistractorBias[]).map((v) => `<option value="${v}" ${v === settings.distractorBias ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <fieldset><legend>${c.noise}</legend><div class="activation-picker">${listNoisePercents().map((n) => `<button class="activation-button ${n === settings.noisePercentOfOff ? 'active' : ''}" data-noise="${n}" type="button">${n}%</button>`).join('')}</div></fieldset>
        <label>${c.studyReview}<select id="review"><option value="true" ${settings.allowStudyReview ? 'selected' : ''}>${c.yes}</option><option value="false" ${!settings.allowStudyReview ? 'selected' : ''}>${c.no}</option></select></label>
        <label>${c.displayMs}<select id="display" ${selectedLevel === 'junior' ? 'disabled' : ''}>${[0, 800, 1200].map((n) => `<option value="${n}" ${n === effectivePatternDisplayMs(settings, selectedLevel) ? 'selected' : ''}>${n} ms</option>`).join('')}</select></label>
        <p class="timed-note">${c.timedMemoryNote}</p>
        <div class="seed-row"><label>${c.settings} seed <input id="seedInput" type="text" value="${escape(seed)}" spellcheck="false" autocomplete="off" /></label><button class="secondary-button" id="newSeed" type="button">${c.randomizeSeed}</button></div>
        <div class="preference-row"><label><input id="reduced" type="checkbox" ${reducedEffects ? 'checked' : ''}/> ${c.reducedEffects}</label><label><input id="contrast" type="checkbox" ${highContrast ? 'checked' : ''}/> ${c.highContrast}</label></div>
        <button class="text-button" id="clear" type="button">${c.clearData}</button>`,
      })}`;
    playArea.innerHTML = readyCopyHtml({
      kicker: `GAME 1 · ${selectedMode === 'daily' ? c.daily : c.practice} · ${levelLabel(selectedLevel)}`,
      title: c.title,
      lead: c.lead,
      extraHtml: isStudyMode() ? studyBannerHtml(options.getCopy().study) + studyExportBarHtml(options.getCopy().study) : '',
      startId: 'start',
      startLabel: g.startGame,
    });
    bindReady();
    if (isStudyMode()) bindStudyExport(playArea);
    paintIntro();
  }
  function bindReady() {
    need<HTMLButtonElement>('#start').onclick = () => {
      if (selectedMode === 'daily') startDaily();
      else startPractice();
    };
    modeTabs.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
      button.onclick = () => {
        selectedMode = button.dataset.mode === 'daily' ? 'daily' : 'practice';
        setup();
      };
    });
    need<HTMLButtonElement>('#newSeed').onclick = () => { seed = createPracticeSeed(); setup(); };
    need<HTMLInputElement>('#seedInput').onchange = (e) => { seed = (e.target as HTMLInputElement).value.trim() || seed; };
    need<HTMLSelectElement>('#matrixSize').onchange = (e) => change({ matrixSize: Number((e.target as HTMLSelectElement).value) as DifficultySettings['matrixSize'] });
    need<HTMLSelectElement>('#bias').onchange = (e) => change({ distractorBias: (e.target as HTMLSelectElement).value as DistractorBias });
    need<HTMLSelectElement>('#review').onchange = (e) => change({ allowStudyReview: (e.target as HTMLSelectElement).value === 'true' });
    need<HTMLSelectElement>('#display').onchange = (e) => change({ patternDisplayMs: Number((e.target as HTMLSelectElement).value) });
    need<HTMLSelectElement>('#namedPreset').onchange = (e) => {
      const id = (e.target as HTMLSelectElement).value;
      settings = getPreset(id);
      activePresetId = id;
      if (isPixelLevelId(id)) selectedLevel = id;
      setup();
    };
    settingsPanel.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((b) => b.onclick = () => selectLevel(b.dataset.level as PixelLevelId));
    settingsPanel.querySelectorAll<HTMLButtonElement>('[data-noise]').forEach((b) => b.onclick = () => change({ noisePercentOfOff: Number(b.dataset.noise) as DifficultySettings['noisePercentOfOff'] }));
    need<HTMLDetailsElement>('#advanced').ontoggle = (e) => { advancedOpen = (e.target as HTMLDetailsElement).open; };
    need<HTMLInputElement>('#reduced').onchange = (e) => { reducedEffects = (e.target as HTMLInputElement).checked; stored = { ...stored, reducedEffects }; save(); applyPreferences(); };
    need<HTMLInputElement>('#contrast').onchange = (e) => { highContrast = (e.target as HTMLInputElement).checked; stored = { ...stored, highContrast }; save(); applyPreferences(); };
    need<HTMLButtonElement>('#clear').onclick = () => { stored = parsePixelStoredJson(null); muted = reducedEffects = highContrast = false; save(); applyPreferences(); setup(); };
    need<HTMLElement>('#scienceCopy').textContent = contentCatalog.modelDisclaimer[locale()];
    need<HTMLElement>('#creditCopy').textContent = getAssetCredit('odor-atlas')?.creditText[locale()] ?? 'TODO-VERIFY';
  }
  function paintIntro() {
    const c = text();
    const eyebrow = document.querySelector('#introEyebrow');
    const lead = document.querySelector('#introLead');
    const choose = document.querySelector('#chooseRun');
    const chips = document.querySelector('#introChips');
    if (eyebrow) eyebrow.innerHTML = `<span></span> ${gameHeaderKicker('01')}`;
    if (lead) lead.textContent = c.introLead;
    if (choose) choose.textContent = c.chooseRun;
    const scienceBtn = document.querySelector('#scienceButton');
    const creditBtn = document.querySelector('#creditButton');
    const g = options.getCopy().gameUi;
    if (scienceBtn) scienceBtn.textContent = g.science;
    if (creditBtn) creditBtn.textContent = c.assetCredit;
    const howTitle = document.querySelector('#howTitle');
    if (howTitle) howTitle.textContent = c.howTitle;
    const howBody = document.querySelector('#howBody');
    if (howBody) {
      howBody.innerHTML = `<div class="how-cards" data-testid="how-cards">
        <article><span>01</span><b>${c.how1Title}</b><p>${c.how1Body}</p></article>
        <article><span>02</span><b>${c.how2Title}</b><p>${c.how2Body}</p></article>
        <article><span>03</span><b>${c.how3Title}</b><p>${c.how3Body}</p></article>
      </div>`;
    }
    if (chips) chips.innerHTML = `<span><b>${levelLabel('junior')}</b></span><span><b>${levelLabel('practice')}</b></span><span><b>${levelLabel('challenge')}</b></span>`;
  }
  function selectLevel(id: PixelLevelId) {
    selectedLevel = id;
    activePresetId = id;
    settings = getPreset(id);
    setup();
  }
  function change(patch: Partial<DifficultySettings>) {
    settings = mergePracticeSettings({ ...settings, ...patch }, activePresetId);
    setup();
  }
  function launchAfterStudyPre(startFn: () => void): void {
    if (!isStudyMode()) {
      startFn();
      return;
    }
    const copy = options.getCopy().study;
    const loc = locale();
    studySession = createEducationSession({
      gameId: 'pixel',
      gameVersion: PIXEL_GAME_VERSION,
      contentVersion: CONTENT_VERSION,
      locale: loc,
      selectedDifficulty: activePresetId,
    });
    persistEducationSession(studySession);
    const items = preItems('pixel');
    playArea.innerHTML = studyQuestionsHtml({
      title: copy.preTitle,
      lead: copy.preLead,
      items,
      locale: loc,
      copy,
      submitLabel: copy.continue,
    });
    bindStudyQuestions(playArea, {
      items,
      session: studySession,
      phaseFor: () => 'pre',
      onDone: (next) => {
        studySession = next;
        persistEducationSession(studySession);
        startFn();
      },
    });
  }
  function startPractice() {
    const typed = need<HTMLInputElement>('#seedInput').value.trim();
    if (typed) seed = typed;
    const next = isPixelLevelId(activePresetId) && activePresetId === 'junior'
      ? { ...settings, patternDisplayMs: 0 }
      : settings;
    launchAfterStudyPre(() => {
      session = buildPracticeSession({ odors, settings: next, seed, contentVersion: CONTENT_VERSION, presetId: isPixelLevelId(activePresetId) ? activePresetId : selectedLevel });
      begin();
    });
  }
  function startDaily() {
    const presetId = dailyPresetIdForLevel(selectedLevel);
    launchAfterStudyPre(() => {
      settings = getPreset(presetId);
      activePresetId = presetId;
      if (isPixelLevelId(presetId)) selectedLevel = presetId;
      session = buildDailySession({ odors, presetId, contentVersion: CONTENT_VERSION });
      begin();
    });
  }
  function begin() {
    if (!session) return;
    round = score = studyIndex = 0;
    answered = false;
    onboardStep = 0;
    studyReviewClicks = 0;
    playStartedAt = Date.now();
    stored = recordPlayedSeed(stored, session.meta.seed);
    save();
    if (!stored.onboardingSeen) onboard();
    else study();
  }
  function demoCells(withNoise: boolean) {
    const pattern = base(DEMO_ODOR_ID, 3);
    if (!withNoise) return pattern.map((on) => (on ? 'on' : 'off' as const));
    return injectNoise(pattern, 10, 'pixel-onboard-noise').displayCells;
  }
  function onboard() {
    const c = text();
    const withNoise = onboardStep > 0;
    const skip = stored.onboardingSeen
      ? `<button class="text-button" id="onboardSkip" type="button">${c.onboardingSkip}</button>`
      : '';
    playArea.innerHTML = `<div class="onboard-state"><div class="onboard-copy"><span class="section-label">${c.onboardingTitle}</span><h3>${withNoise ? c.onboardingNoise : c.onboardingPattern}</h3><p class="illustrative-note">${c.illustrativeNote}</p></div><div class="onboard-visual">${image(DEMO_ODOR_ID, 'study-image')}${grid(demoCells(withNoise), name(DEMO_ODOR_ID), undefined, { size: 3, lightUp: !withNoise })}</div><div class="onboard-actions">${skip}<button class="primary-button" id="${withNoise ? 'onboardStart' : 'onboardNext'}" type="button">${withNoise ? c.onboardingStart : c.onboardingNext} →</button></div></div>`;
    const next = document.querySelector<HTMLButtonElement>('#onboardNext');
    const start = document.querySelector<HTMLButtonElement>('#onboardStart');
    const skipBtn = document.querySelector<HTMLButtonElement>('#onboardSkip');
    if (next) next.onclick = () => { onboardStep = 1; onboard(); };
    if (start) start.onclick = finishOnboard;
    if (skipBtn) skipBtn.onclick = finishOnboard;
    (start ?? next)?.focus();
  }
  function finishOnboard() {
    stored = { ...stored, onboardingSeen: true };
    save();
    study();
  }
  function study() {
    if (!session) return; const id = session.poolIds[studyIndex]!; const c = text();
    playArea.innerHTML = `<div class="study-state"><div class="study-topline"><div><span class="section-label">STUDY</span><h3>${name(id)}</h3><p>${english(id)}</p></div><span class="question-count">${studyIndex + 1} / ${session.poolIds.length}</span></div><div class="study-content"><div>${image(id, 'study-image')}</div><div class="study-code">${grid(base(id).map((v) => v ? 'on' : 'off'), name(id))}</div></div><div class="study-actions"><button class="secondary-button" id="prev" type="button" ${studyIndex === 0 || !session.settings.allowStudyReview ? 'disabled' : ''}>←</button><span>${session.settings.allowStudyReview ? c.reviewOn : c.reviewOff}</span><button class="primary-button" id="next" type="button">${studyIndex + 1 === session.poolIds.length ? c.startQuiz : `${c.next} →`}</button></div></div>`;
    need<HTMLButtonElement>('#prev').onclick = () => { studyIndex--; studyReviewClicks += 1; study(); };
    need<HTMLButtonElement>('#next').onclick = () => studyIndex + 1 === session!.poolIds.length ? question() : (studyIndex++, study());
  }
  function question() {
    if (!session) return;
    clearHideTimer();
    const q = session.questions[round]!, c = text();
    const timedMs = effectivePatternDisplayMs(session.settings, session.meta.presetId);
    const locked = timedMs > 0;
    playArea.innerHTML = `<div class="quiz-state"><div class="quiz-topline"><div class="progress-track"><div class="progress-fill" style="width:${(round + 1) / session.questions.length * 100}%"></div></div><span class="question-count">${round + 1} / ${session.questions.length}</span><span class="score-pill">${score} PTS</span></div><div class="quiz-main"><div class="question-visual"><div class="pattern-stage" id="patternStage">${grid(q.displayCells, c.shown)}<div class="pattern-veil hidden" id="patternVeil" role="status">${c.patternHidden}</div></div></div><div class="question-panel"><h3>${c.choose}</h3><div class="options-grid" data-count="${q.optionIds.length}">${q.optionIds.map((id, i) => `<button class="option-card" data-id="${id}" type="button" ${locked ? 'disabled' : ''}><kbd>${i + 1}</kbd>${image(id)}<span><strong>${name(id)}</strong><small>${english(id)}</small></span></button>`).join('')}</div><div class="feedback hidden" id="feedback"></div></div></div></div>`;
    playArea.querySelectorAll<HTMLButtonElement>('.option-card').forEach((b) => b.onclick = () => answer(b.dataset.id!));
    if (locked) hideTimer = window.setTimeout(() => hidePattern(), timedMs);
  }
  function hidePattern() {
    const veil = document.querySelector('#patternVeil');
    const matrix = document.querySelector('#patternStage .led-matrix');
    veil?.classList.remove('hidden');
    matrix?.setAttribute('aria-hidden', 'true');
    matrix?.setAttribute('aria-label', text().patternHidden);
    playArea.querySelectorAll<HTMLButtonElement>('.option-card').forEach((b) => { b.disabled = false; });
    playArea.querySelector<HTMLButtonElement>('.option-card')?.focus();
  }
  function answer(id: string) {
    if (!session || answered) return;
    clearHideTimer();
    const q = session.questions[round]!, result = applyAnswer({ settings: session.settings, currentScore: score, answerId: q.answerId, optionIds: q.optionIds, chosenId: id, alreadyAnswered: false });
    answered = true; score = result.nextScore;
    const c = text();
    playArea.querySelectorAll<HTMLButtonElement>('.option-card').forEach((b) => {
      b.disabled = true;
      const isAnswer = b.dataset.id === q.answerId;
      const isPick = b.dataset.id === id;
      b.classList.toggle('correct', isAnswer);
      b.classList.toggle('wrong', isPick && !result.correct);
      if (isAnswer) b.insertAdjacentHTML('beforeend', `<span class="option-mark" aria-label="${escape(c.correctMark)}">✓</span>`);
      else if (isPick) b.insertAdjacentHTML('beforeend', `<span class="option-mark" aria-label="${escape(c.yourPick)}">✕</span>`);
    });
    const feedback = need<HTMLElement>('#feedback'); feedback.classList.remove('hidden');
    const edu = result.correct ? c.feedbackCorrect : c.feedbackWrong;
    feedback.innerHTML = `<div class="feedback-copy ${result.correct ? '' : 'wrong'}"><strong>${result.correct ? c.correct : `${c.answer}: ${name(q.answerId)}`}</strong><span>${edu}</span><p class="diff-legend"><span class="legend-shared">${c.diffShared}</span><span class="legend-answer">${c.diffAnswer}</span><span class="legend-shown">${c.diffShown}</span></p><div class="diff-grid">${grid(base(q.answerId).map((v) => v ? 'on' : 'off'), c.diffLegend, patternDiff(base(id), base(q.answerId)))}</div></div><button class="next-button" id="goNext" type="button">${round + 1 === session.questions.length ? c.results : c.next} →</button>`;
    need<HTMLButtonElement>('#goNext').onclick = () => round + 1 === session!.questions.length ? results() : (round++, answered = false, question());
    need<HTMLButtonElement>('#goNext').focus();
  }
  function results() {
    if (!session) return; const result = summarizeResult(score, session.settings); stored = recordBestScore(stored, session.meta.presetId, score); save();
    const c = text();
    playArea.innerHTML = resultLayoutHtml({
      scoreHtml: scoreRingHtml({
        score: String(score),
        label: c.finalScore,
        angle: result.maxScore ? (score / result.maxScore) * 360 : 0,
      }),
      scoreExtraHtml: `<h3>${result.correctCount} / ${result.questionCount}</h3>`,
      kicker: c.results,
      discoveredTitle: c.discoveredTitle,
      discoveredBody: c.discoveredBody,
      extraCopyHtml: `<p>${c.best}: ${stored.bestByPreset[session.meta.presetId] ?? score}</p>`,
      actionsHtml: `<button class="primary-button" id="replay" type="button">${c.replay}</button><button class="secondary-button" id="setup" type="button">${c.backSetup}</button>`,
      technicalSummary: c.technicalDetails,
      technicalHtml: `<div class="result-metrics"><div><strong>${session.meta.seedVersion}</strong><span>${c.seedVersion}</span></div><div><strong>${session.meta.contentVersion}</strong><span>${c.contentVersion}</span></div><div><strong>${session.meta.gameVersion}</strong><span>${c.gameVersion}</span></div></div><p><code>${session.meta.seed}</code></p><button class="secondary-button" id="copy" type="button">${c.copySeed}</button>`,
    });
    need<HTMLButtonElement>('#copy').onclick = async () => { try { await navigator.clipboard.writeText(session!.meta.seed); } catch { /* optional */ } need<HTMLButtonElement>('#copy').textContent = c.copied; };
    need<HTMLButtonElement>('#replay').onclick = () => { session = buildSession({ odors, settings: session!.settings, meta: session!.meta }); begin(); };
    need<HTMLButtonElement>('#setup').onclick = setup;
    need<HTMLButtonElement>('#replay').focus();
    if (isStudyMode() && studySession) {
      const summary = result;
      studySession = markEducationPlayComplete(studySession, {
        durationMs: playStartedAt ? Date.now() - playStartedAt : null,
        numberOfAttempts: session.questions.length,
        hintsUsed: studyReviewClicks,
        selectedDifficulty: session.meta.presetId,
        outcome: {
          gameId: 'pixel',
          pixel: {
            correctCount: summary.correctCount,
            questionCount: summary.questionCount,
            score,
            presetId: session.meta.presetId,
            studyReviewUsed: studyReviewClicks > 0,
          },
        },
      });
      persistEducationSession(studySession);
      const host = document.createElement('div');
      host.className = 'edu-post';
      host.dataset.testid = 'study-post';
      playArea.appendChild(host);
      const sc = options.getCopy().study;
      const loc = locale();
      const items = postItems('pixel');
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
  const openPixelScience = () => {
    saveSuiteExplorer(markScienceCard(loadSuiteExplorer(), 'pixel'));
    need<HTMLDialogElement>('#scienceDialog').showModal();
  };
  need<HTMLButtonElement>('#scienceButton').onclick = () => openPixelScience();
  need<HTMLButtonElement>('#creditButton').onclick = () => need<HTMLDialogElement>('#creditDialog').showModal();
  need<HTMLButtonElement>('#guideButton').onclick = () => need<HTMLDialogElement>('#guideDialog').showModal();
  need<HTMLElement>('#scienceCopy').textContent = contentCatalog.modelDisclaimer[locale()];
  need<HTMLElement>('#creditCopy').textContent = getAssetCredit('odor-atlas')?.creditText[locale()] ?? 'TODO-VERIFY';
  document.querySelectorAll<HTMLElement>('[data-close]').forEach((b) => b.onclick = () => need<HTMLDialogElement>(`#${b.dataset.close}`).close());
  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLElement && (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))) return;
    if (event.key === 'Escape') document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((d) => d.close());
    if (event.key === 'Enter' && document.querySelector('#onboardStart')) { need<HTMLButtonElement>('#onboardStart').click(); return; }
    if (event.key === 'Enter' && document.querySelector('#onboardNext')) { need<HTMLButtonElement>('#onboardNext').click(); return; }
    if (event.key === 'Enter' && answered) need<HTMLButtonElement>('#goNext')?.click();
    if (!answered && /^[1-9]$/.test(event.key)) {
      playArea.querySelectorAll<HTMLButtonElement>('.option-card')[Number(event.key) - 1]?.click();
    }
  });
  sound.onclick = () => { muted = !muted; stored = { ...stored, muted }; save(); applyPreferences(); };
  applyPreferences();
  consumeScienceHash(openPixelScience);
  setup();
  options.onReady?.({ refreshReady: () => { if (!session) setup(); } });
}
function need<T extends Element>(selector: string): T { const el = document.querySelector<T>(selector); if (!el) throw new Error(`Missing ${selector}`); return el; }
function escape(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!); }
