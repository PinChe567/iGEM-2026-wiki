/**
 * AeroSense QC Shift — warehouse screening UI.
 * Production entry must not import the legacy maze campaign.
 */
import {
  applyQcShiftAction,
  buildQcShiftPracticeSession,
  canAffordAction,
  createQcShiftPracticeSeed,
  getQcProduct,
  parseQcShiftStoredJson,
  QC_SHIFT_PRESET_IDS,
  QC_SHIFT_STORAGE_KEY,
  QC_SHIFT_GAME_VERSION,
  QC_SHIFT_CONTENT_VERSION,
  recordQcShiftBestScore,
  recordQcShiftPlayedSeed,
  summarizeQcShift,
  type PlayerAction,
  type QcActionRejectReason,
  type QcFlag,
  type QcReading,
  type QcShiftPresetId,
  type QcShiftSession,
  type QcShiftStoredState,
  type RiskLevel,
  type SignalQuality,
} from '@suite/core/qc-shift';
import {
  createEducationSession,
  markEducationPlayComplete,
  qcShiftEducationOutcome,
  type EducationStudySession,
} from '@suite/core/education';
import type { Locale } from '../../../src/i18n/locale';
import type { MessageTree } from '../../../src/i18n/messages';
import { t } from '../../../src/i18n/messages';
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
  bindModalCloses,
  gameHeaderHtml,
  gameHeaderKicker,
  gameStageHtml,
  guideListHtml,
  labHeaderHtml,
  levelCardsHtml,
  modalCardHtml,
  readyCopyHtml,
  resultLayoutHtml,
} from '../../../src/game-ui';

type Copy = MessageTree['qcShift'];

type Options = {
  root: HTMLElement;
  getCopy: () => Copy;
  getLocale: () => Locale;
};

type Phase = 'ready' | 'study-pre' | 'tutorial' | 'play' | 'feedback' | 'debrief' | 'design';

const PRODUCT_ICON: Record<string, string> = {
  'lot-grain-01': '🌾',
  'lot-nuts-02': '🥜',
  'lot-fruit-03': '🍇',
  'lot-spice-04': '🌶️',
  'lot-feed-05': '🧺',
  'lot-cocoa-06': '🍫',
  'lot-coffee-07': '☕',
  'lot-rice-08': '🍚',
  'lot-maize-09': '🌽',
  'lot-seed-10': '🌱',
  'lot-herb-11': '🌿',
  'lot-flour-12': '🥖',
};

const HELP_OPTS = [
  { id: 'risk', key: 'optRisk' },
  { id: 'confidence', key: 'optConfidence' },
  { id: 'quality', key: 'optQuality' },
  { id: 'next', key: 'optNext' },
  { id: 'raw', key: 'optRaw' },
] as const;

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '"') return '&quot;';
    return '&#39;';
  });
}

function tokenText(c: Copy, value: number | null): string {
  return value === null ? c.unlimited : String(value);
}

function productName(c: Copy, productId: string): string {
  const product = getQcProduct(productId);
  if (!product) return productId;
  return c[product.labelKey] ?? product.labelKey;
}

function riskLabel(c: Copy, risk: RiskLevel): string {
  if (risk === 'low') return c.riskLow;
  if (risk === 'medium') return c.riskMedium;
  if (risk === 'high') return c.riskHigh;
  return c.riskInvalid;
}

function qualityLabel(c: Copy, quality: SignalQuality): string {
  if (quality === 'good') return c.qualityGood;
  if (quality === 'uncertain') return c.qualityUncertain;
  return c.qualityInvalid;
}

function flagLabel(c: Copy, flag: QcFlag): string {
  if (flag === 'ok') return c.qcOk;
  if (flag === 'drift') return c.qcDrift;
  if (flag === 'low-signal') return c.qcLowSignal;
  if (flag === 'out-of-range') return c.qcOutOfRange;
  return c.qcUnstable;
}

function rejectCopy(c: Copy, reason: QcActionRejectReason): string {
  if (reason === 'already-retested') return c.alreadyRetest;
  if (reason === 'no-retest-remaining') return c.noRetest;
  if (reason === 'no-confirm-remaining') return c.noConfirm;
  if (reason === 'not-enough-time') return c.noTime;
  return c.noConfirm;
}

function liveFeedback(
  c: Copy,
  junior: boolean,
  action: PlayerAction,
  before: QcReading,
): string {
  const invalid = before.risk === 'invalid' || before.quality === 'invalid';
  if (action === 'retest') {
    if (invalid) return junior ? c.fbJrInvalidRetest : c.fbInvalidRetest;
    return c.fbRetestDone;
  }
  if (action === 'holdConfirm') {
    if (before.risk === 'high' && before.quality !== 'invalid') {
      return junior ? c.fbJrHighHeld : c.fbHighHeld;
    }
    return c.fbHoldGeneric;
  }
  if (before.risk === 'medium' || before.quality === 'uncertain') {
    return junior ? c.fbJrMediumIgnored : c.fbMediumIgnored;
  }
  if (before.risk === 'low' && before.quality === 'good') return c.fbLowMonitor;
  return c.fbMonitorGeneric;
}

function countAction(session: QcShiftSession, action: PlayerAction): number {
  return session.play.log.filter((row) => row.action === action).length;
}

export function startQcShift(options: Options): { destroy: () => void } {
  const root = options.root;
  let stored = load();
  let presetId: QcShiftPresetId = 'junior';
  let seed = createQcShiftPracticeSeed();
  let session: QcShiftSession | undefined;
  let phase: Phase = 'ready';
  let tutorialStep = 0;
  let feedbackText = '';
  let feedbackTone: 'good' | 'caution' | 'info' = 'info';
  let lastAction: PlayerAction | null = null;
  let helpChoices = new Set<string>(stored.designHelpChoices);
  let helpThanks = false;
  let cardPulse = false;
  let studySession: EducationStudySession | null = null;
  let studyPostDone = false;
  let playStartedAt = 0;

  const copy = () => options.getCopy();

  function load(): QcShiftStoredState {
    try {
      return parseQcShiftStoredJson(localStorage.getItem(QC_SHIFT_STORAGE_KEY));
    } catch {
      return parseQcShiftStoredJson(null);
    }
  }

  function save(): void {
    try {
      stored = { ...stored, locale: options.getLocale() };
      localStorage.setItem(QC_SHIFT_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* optional */
    }
  }

  function paint(): void {
    const c = copy();
    const junior = presetId === 'junior' || session?.meta.presetId === 'junior';
    root.innerHTML = `
      <section class="qc-shell${junior ? ' is-junior' : ''}" data-testid="qc-shell" data-phase="${phase}">
        ${phase === 'ready' ? readyHtml(c) : ''}
        ${phase === 'study-pre' ? studyPreHtml() : ''}
        ${phase === 'tutorial' ? tutorialHtml(c) : ''}
        ${phase === 'play' || phase === 'feedback' ? playHtml(c) : ''}
        ${phase === 'debrief' ? debriefHtml(c) : ''}
        ${phase === 'design' ? designHtml(c) : ''}
      </section>
      ${modalCardHtml({
        id: 'qcScienceDialog',
        testId: 'science-dialog',
        label: c.science,
        title: c.scienceTitle,
        bodyHtml: `<p>${escape(c.scienceBody)}</p><p class="illustrative-note">${escape(c.screeningNote)}</p><p class="illustrative-note">${escape(c.disclaimer)}</p>`,
        closeLabel: c.close,
      })}
      ${modalCardHtml({
        id: 'qcGuideDialog',
        testId: 'guide-dialog',
        label: c.howToPlay,
        title: c.tutorial,
        bodyHtml: guideListHtml([
          { title: c.tut1Title, body: c.tut1 },
          { title: c.tut2Title, body: c.tut2 },
          { title: c.tut3Title, body: c.tut3 },
        ]),
        closeLabel: c.close,
      })}
    `;
    bind();
    if (cardPulse) {
      const card = root.querySelector<HTMLElement>('[data-testid="batch-card"]');
      card?.classList.add('is-enter');
      cardPulse = false;
    }
  }

  function studyCopy(): MessageTree['study'] {
    return t(options.getLocale()).study;
  }

  function readyHtml(c: Copy): string {
    const study = isStudyMode() ? studyBannerHtml(studyCopy()) + studyExportBarHtml(studyCopy()) : '';
    return `
      ${gameHeaderHtml({
        gameNumber: '02',
        mode: c.eyebrow,
        title: c.title,
        lead: c.lead,
      })}
      <section class="lab">
        ${labHeaderHtml({
          gameLabel: c.gameLabel,
          heading: c.chooseLevel,
          headingId: 'qcChoose',
          actionsHtml: `<button class="text-button" type="button" data-testid="open-science" data-science>${escape(c.science)}</button>`,
        })}
        ${gameStageHtml({
          settingsHtml: `<h3>${escape(c.chooseLevel)}</h3>
            ${levelCardsHtml({
              label: c.chooseLevel,
              selectedId: presetId,
              cards: QC_SHIFT_PRESET_IDS.map((id) => ({
                id,
                index: id === 'junior' ? '01' : id === 'standard' ? '02' : '03',
                label: id === 'junior' ? c.junior : id === 'challenge' ? c.challenge : c.standard,
                blurb:
                  id === 'junior' ? c.juniorBlurb : id === 'challenge' ? c.challengeBlurb : c.standardBlurb,
                testId: `level-${id}`,
              })),
            })}
            ${advancedSettingsHtml({
              summary: c.advanced,
              body: `<div class="seed-row">
                <label>${escape(c.seed)} <input data-testid="seed-input" id="qcSeed" type="text" value="${escape(seed)}" spellcheck="false" autocomplete="off" /></label>
                <button class="secondary-button" type="button" data-new-seed>${escape(c.randomizeSeed)}</button>
              </div>`,
            })}`,
          playHtml: `${study}${readyCopyHtml({
            kicker: gameHeaderKicker('02', c.eyebrow),
            title: c.title,
            extraHtml: `<p class="shortcut-help">${escape(c.shortcuts)}</p>`,
            startId: 'qcStart',
            startTestId: 'start-shift',
            startLabel: c.startShift,
            stateTestId: 'qc-ready',
          })}`,
        })}
      </section>
    `;
  }

  function studyPreHtml(): string {
    const sc = studyCopy();
    const loc = options.getLocale();
    return `<div class="qc-ready" data-testid="study-pre">${studyQuestionsHtml({
      title: sc.preTitle,
      lead: sc.preLead,
      items: preItems('qc-shift'),
      locale: loc,
      copy: sc,
      submitLabel: sc.continue,
    })}</div>`;
  }

  function tutorialHtml(c: Copy): string {
    const steps = [
      { icon: '📦', title: c.tut1Title, body: c.tut1 },
      { icon: '🔁', title: c.tut2Title, body: c.tut2 },
      { icon: '✅', title: c.tut3Title, body: c.tut3 },
    ];
    const step = steps[tutorialStep] ?? steps[0]!;
    const last = tutorialStep >= steps.length - 1;
    return `
      <div class="qc-tutorial" data-testid="tutorial">
        <span class="section-label">${escape(c.tutorial)} · ${tutorialStep + 1}/3</span>
        <div class="qc-tut-card" aria-live="polite">
          <div class="qc-tut-icon" aria-hidden="true">${step.icon}</div>
          <h2>${escape(step.title)}</h2>
          <p>${escape(step.body)}</p>
        </div>
        <div class="qc-ready-actions">
          <button class="primary-button" type="button" data-testid="tutorial-next" data-tut-next>${escape(last ? c.start : c.next)}</button>
          ${stored.tutorialSeen ? `<button class="text-button" type="button" data-testid="tutorial-skip" data-tut-skip>${escape(c.skipIntro)}</button>` : ''}
        </div>
      </div>
    `;
  }

  function resourcesHtml(c: Copy, current: QcShiftSession): string {
    const r = current.play.resources;
    return `
      <div class="qc-tokens" data-testid="resources" aria-label="${escape(c.onShift)}">
        <span class="qc-token" data-testid="resource-retest"><b aria-hidden="true">🔁</b> ${escape(c.retestToken)} <strong>${escape(tokenText(c, r.retestRemaining))}</strong></span>
        <span class="qc-token" data-testid="resource-confirm"><b aria-hidden="true">🧪</b> ${escape(c.confirmToken)} <strong>${escape(tokenText(c, r.confirmRemaining))}</strong></span>
        <span class="qc-token" data-testid="resource-time"><b aria-hidden="true">⏱</b> ${escape(c.timeToken)} <strong>${escape(tokenText(c, r.timeRemaining))}</strong></span>
      </div>
    `;
  }

  function metersHtml(c: Copy, current: QcShiftSession): string {
    const card = summarizeQcShift(current);
    return `
      <div class="qc-meters" data-testid="meters">
        ${meter(c.safety, card.safety, 100, 'safety')}
        ${meter(c.foodSaved, card.foodSaved, current.settings.batchCount, 'food')}
        ${meter(c.efficiency, card.efficiency, 100, 'efficiency')}
      </div>
    `;
  }

  function meter(label: string, value: number, max: number, id: string): string {
    const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / max) * 100)));
    return `<div class="qc-meter" data-testid="meter-${id}"><span>${escape(label)} <strong>${value}</strong></span><div class="qc-meter-track" role="img" aria-label="${escape(label)} ${value}"><i style="width:${pct}%"></i></div></div>`;
  }

  function playHtml(c: Copy): string {
    if (!session) return '';
    const idx = Math.min(session.play.batchIndex, session.scenarios.length - 1);
    const batch = session.play.batchStates[idx];
    const scenario = session.scenarios[idx];
    if (!batch || !scenario) return '';
    const reading = batch.currentReading;
    const name = productName(c, scenario.productId);
    const icon = PRODUCT_ICON[scenario.productId] ?? '📦';
    const affordRetest = canAffordAction(
      'retest',
      session.settings,
      session.play.resources,
      batch.retestUsed,
    );
    const affordHold = canAffordAction(
      'holdConfirm',
      session.settings,
      session.play.resources,
      batch.retestUsed,
    );
    const qcBits = session.settings.showQcFlags
      ? reading.qcFlags.map((flag) => flagLabel(c, flag)).join(' · ')
      : reading.quality === 'invalid'
        ? c.qcFail
        : c.qcOk;
    const remaining = session.scenarios.length - session.play.batchIndex;
    return `
      <div class="qc-shift" data-testid="qc-play">
        ${resourcesHtml(c, session)}
        ${metersHtml(c, session)}
        <div class="qc-belt" aria-hidden="true">
          ${session.scenarios
            .map((_, i) => {
              const done = session!.play.batchStates[i]?.resolved;
              const current = i === session!.play.batchIndex && !done;
              return `<i class="qc-crate-dot${done ? ' is-done' : ''}${current ? ' is-now' : ''}"></i>`;
            })
            .join('')}
        </div>
        <article class="qc-card" data-testid="batch-card" data-retested="${batch.retestUsed}" data-batch-index="${idx}">
          <header class="qc-card-head">
            <span class="qc-product-icon" aria-hidden="true">${icon}</span>
            <div>
              <span class="section-label">${escape(c.batch)} ${idx + 1}/${session.settings.batchCount}</span>
              <h2>${escape(name)}</h2>
            </div>
          </header>
          <dl class="qc-readout">
            <div>
              <dt>${escape(c.screening)}</dt>
              <dd><span class="qc-badge qc-risk-${reading.risk}" data-testid="risk-level"><b aria-hidden="true">${riskGlyph(reading.risk)}</b> ${escape(riskLabel(c, reading.risk))}</span></dd>
            </div>
            <div>
              <dt>${escape(c.quality)}</dt>
              <dd><span class="qc-badge qc-quality-${reading.quality}" data-testid="signal-quality"><b aria-hidden="true">${qualityGlyph(reading.quality)}</b> ${escape(qualityLabel(c, reading.quality))}</span></dd>
            </div>
            ${
              session.settings.showConfidence && reading.confidence !== null
                ? `<div><dt>${escape(c.confidence)}</dt><dd data-testid="confidence">${Math.round(reading.confidence * 100)}%</dd></div>`
                : ''
            }
            <div>
              <dt>${escape(c.qcStatus)}</dt>
              <dd data-testid="qc-status">${escape(qcBits)}</dd>
            </div>
          </dl>
        </article>
        <div class="qc-actions" role="group" aria-label="${escape(c.onShift)}">
          <button class="qc-act qc-act-monitor" type="button" data-testid="action-monitor" data-action="monitor"><span aria-hidden="true">👁</span> ${escape(c.actionMonitor)}</button>
          <button class="qc-act qc-act-retest" type="button" data-testid="action-retest" data-action="retest" ${affordRetest.ok ? '' : 'disabled'}><span aria-hidden="true">🔁</span> ${escape(c.actionRetest)}</button>
          <button class="qc-act qc-act-hold" type="button" data-testid="action-hold" data-action="holdConfirm" ${affordHold.ok ? '' : 'disabled'}><span aria-hidden="true">⏸</span> ${escape(c.actionHold)}</button>
        </div>
        <p class="qc-shortcuts">${escape(c.shortcuts)} · ${remaining}</p>
        <button class="text-button" type="button" data-science>${escape(c.science)}</button>
        ${
          phase === 'feedback'
            ? `<div class="qc-feedback qc-tone-${feedbackTone}" data-testid="feedback" role="status">
                <p>${escape(feedbackText)}</p>
                <button class="primary-button" type="button" data-testid="feedback-next" data-feedback-next>${escape(session.play.status === 'complete' && lastAction !== 'retest' ? c.shiftOver : c.feedbackNext)}</button>
              </div>`
            : ''
        }
      </div>
    `;
  }

  function debriefHtml(c: Copy): string {
    if (!session) return '';
    const card = summarizeQcShift(session);
    return resultLayoutHtml({
      testId: 'debrief',
      scoreHtml: metersHtml(c, session),
      kicker: c.shiftOver,
      title: c.shiftOver,
      metrics: [
        { value: String(card.missedHighRiskCount), label: c.missedRisk, testId: 'stat-missed' },
        { value: String(card.unnecessaryHoldCount), label: c.unnecessaryHolds, testId: 'stat-holds' },
        { value: String(countAction(session, 'retest')), label: c.retestsUsed, testId: 'stat-retests' },
        { value: String(countAction(session, 'holdConfirm')), label: c.confirmsUsed, testId: 'stat-confirms' },
      ],
      discoveredTitle: c.discoveredTitle,
      discoveredBody: c.takeaway,
      discoveredTestId: 'takeaway',
      extraCopyHtml: isStudyMode() ? `<div class="edu-post" data-edu-post></div>` : '',
      actionsHtml: `<button class="primary-button" type="button" data-testid="replay" data-replay>${escape(c.replay)}</button><button class="secondary-button" type="button" data-testid="back-menu" data-menu>${escape(c.backMenu)}</button>`,
      technicalSummary: c.technicalDetails,
      technicalHtml: `<p><code>${escape(session.meta.seed)}</code></p><p class="illustrative-note">${escape(c.disclaimer)}</p><button class="text-button" type="button" data-testid="open-design" data-open-design>${escape(c.designHelpTitle)}</button>`,
    });
  }

  function designHtml(c: Copy): string {
    return `
      <div class="qc-design" data-testid="design-help">
        <span class="section-label">${escape(c.designHelpTitle)}</span>
        <h2>${escape(c.designHelpQ)}</h2>
        <p class="qc-note" data-testid="design-help-note">${escape(c.designHelpNote)}</p>
        ${
          helpThanks
            ? `<p class="qc-takeaway">${escape(c.designThanks)}</p>`
            : `<form class="qc-help-form" data-testid="design-form">
                ${HELP_OPTS.map(
                  (opt) =>
                    `<label class="qc-check"><input type="checkbox" name="help" value="${opt.id}" ${helpChoices.has(opt.id) ? 'checked' : ''}/> ${escape(c[opt.key])}</label>`,
                ).join('')}
                <div class="qc-ready-actions">
                  <button class="primary-button" type="submit" data-testid="design-submit">${escape(c.designHelpSubmit)}</button>
                  <button class="text-button" type="button" data-testid="design-skip" data-design-skip>${escape(c.designHelpSkip)}</button>
                </div>
              </form>`
        }
        ${helpThanks ? `<button class="primary-button" type="button" data-testid="design-done" data-design-skip>${escape(c.close)}</button>` : ''}
      </div>
    `;
  }

  function bind(): void {
    root.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-level');
        if (id === 'junior' || id === 'standard' || id === 'challenge') {
          presetId = id;
          paint();
        }
      });
    });
    root.querySelector('[data-new-seed]')?.addEventListener('click', () => {
      seed = createQcShiftPracticeSeed();
      paint();
    });
    root.querySelector('#qcSeed')?.addEventListener('change', (event) => {
      const value = (event.target as HTMLInputElement).value.trim();
      if (value) seed = value;
    });
    root.querySelector('[data-testid="start-shift"]')?.addEventListener('click', startShift);
    if (isStudyMode()) bindStudyExport(root);
    if (phase === 'study-pre' && studySession) {
      bindStudyQuestions(root, {
        items: preItems('qc-shift'),
        session: studySession,
        phaseFor: () => 'pre',
        onDone: (next) => {
          studySession = next;
          persistEducationSession(studySession);
          if (!stored.tutorialSeen) {
            phase = 'tutorial';
            paint();
            return;
          }
          beginPlay();
        },
      });
    }
    const postHost = root.querySelector<HTMLElement>('[data-edu-post]');
    if (phase === 'debrief' && postHost && isStudyMode() && studySession) {
      const sc = studyCopy();
      if (studyPostDone) {
        postHost.innerHTML = `<p data-testid="study-thanks">${sc.thanks}</p>${studyExportBarHtml(sc)}`;
        bindStudyExport(postHost);
      } else {
        const items = postItems('qc-shift');
        postHost.innerHTML =
          studyQuestionsHtml({
            title: sc.postTitle,
            lead: sc.postLead,
            items,
            locale: options.getLocale(),
            copy: sc,
            submitLabel: sc.continue,
            allowSkip: true,
          }) + studyExportBarHtml(sc);
        bindStudyQuestions(postHost, {
          items,
          session: studySession,
          phaseFor: (item) => (item.phase === 'pre' ? 'post' : item.phase),
          onDone: (next) => {
            const alert = next.answers.find((row) => row.studyItemId === 'G2-ALERT-01');
            if (next.outcome?.gameId === 'qc-shift' && alert) {
              next = {
                ...next,
                outcome: {
                  gameId: 'qc-shift',
                  qcShift: {
                    ...next.outcome.qcShift,
                    alertInformationPreference: alert.answer,
                  },
                },
              };
            }
            studySession = next;
            persistEducationSession(studySession);
            studyPostDone = true;
            paint();
          },
        });
        bindStudyExport(postHost);
      }
    }
    bindModalCloses(root);
    root.querySelectorAll('[data-science]').forEach((el) => el.addEventListener('click', openScience));
    root.querySelector('[data-tut-next]')?.addEventListener('click', () => {
      if (tutorialStep < 2) {
        tutorialStep += 1;
        paint();
        return;
      }
      stored = { ...stored, tutorialSeen: true };
      save();
      beginPlay();
    });
    root.querySelector('[data-tut-skip]')?.addEventListener('click', () => {
      stored = { ...stored, tutorialSeen: true };
      save();
      beginPlay();
    });
    root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'monitor' || action === 'retest' || action === 'holdConfirm') {
          act(action);
        }
      });
    });
    root.querySelector('[data-feedback-next]')?.addEventListener('click', afterFeedback);
    root.querySelector('[data-replay]')?.addEventListener('click', () => {
      if (!session) return;
      seed = session.meta.seed;
      presetId = session.meta.presetId;
      startShift();
    });
    root.querySelector('[data-menu]')?.addEventListener('click', () => {
      phase = 'ready';
      session = undefined;
      paint();
    });
    root.querySelector('[data-open-design]')?.addEventListener('click', () => {
      phase = 'design';
      helpThanks = stored.designHelpSubmitted;
      paint();
    });
    root.querySelector('[data-design-skip]')?.addEventListener('click', () => {
      phase = 'debrief';
      paint();
    });
    const form = root.querySelector<HTMLFormElement>('[data-testid="design-form"]');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const picked = [...form.querySelectorAll<HTMLInputElement>('input[name="help"]:checked')].map(
        (input) => input.value,
      );
      helpChoices = new Set(picked);
      stored = {
        ...stored,
        designHelpChoices: picked,
        designHelpSubmitted: true,
      };
      save();
      helpThanks = true;
      paint();
    });
  }

  function openScience(): void {
    saveSuiteExplorer(markScienceCard(loadSuiteExplorer(), 'labyrinth'));
    const dialog = root.querySelector<HTMLDialogElement>('#qcScienceDialog');
    dialog?.showModal();
  }

  function openGuide(): void {
    root.querySelector<HTMLDialogElement>('#qcGuideDialog')?.showModal();
  }

  function startShift(): void {
    const input = root.querySelector<HTMLInputElement>('#qcSeed');
    if (input?.value.trim()) seed = input.value.trim();
    session = buildQcShiftPracticeSession({ presetId, seed });
    tutorialStep = 0;
    studyPostDone = false;
    if (isStudyMode()) {
      studySession = createEducationSession({
        gameId: 'qc-shift',
        gameVersion: QC_SHIFT_GAME_VERSION,
        contentVersion: QC_SHIFT_CONTENT_VERSION,
        locale: options.getLocale(),
        selectedDifficulty: presetId,
      });
      persistEducationSession(studySession);
      phase = 'study-pre';
      paint();
      return;
    }
    if (!stored.tutorialSeen) {
      phase = 'tutorial';
      paint();
      return;
    }
    beginPlay();
  }

  function beginPlay(): void {
    phase = 'play';
    playStartedAt = Date.now();
    cardPulse = true;
    paint();
  }

  function act(action: PlayerAction): void {
    if (!session || phase !== 'play') return;
    const batch = session.play.batchStates[session.play.batchIndex];
    if (!batch) return;
    const before = batch.currentReading;
    const result = applyQcShiftAction(session, action);
    if (!result.ok) {
      feedbackText = rejectCopy(copy(), result.reason ?? 'unknown-action');
      feedbackTone = 'caution';
      lastAction = action;
      phase = 'feedback';
      paint();
      return;
    }
    session = result.session;
    lastAction = action;
    feedbackText = liveFeedback(copy(), session.meta.presetId === 'junior', action, before);
    feedbackTone =
      action === 'retest' && (before.quality === 'invalid' || before.risk === 'invalid')
        ? 'good'
        : action === 'holdConfirm' && before.risk === 'high'
          ? 'good'
          : action === 'monitor' && (before.risk === 'medium' || before.quality === 'uncertain')
            ? 'caution'
            : 'info';
    phase = 'feedback';
    paint();
  }

  function afterFeedback(): void {
    if (!session) return;
    if (lastAction === 'retest') {
      phase = 'play';
      cardPulse = true;
      paint();
      return;
    }
    if (session.play.status === 'complete') {
      stored = recordQcShiftPlayedSeed(stored, session.meta.seed);
      const card = summarizeQcShift(session);
      stored = recordQcShiftBestScore(stored, session.meta.presetId, {
        safety: card.safety,
        foodSaved: card.foodSaved,
        unnecessaryHold: card.unnecessaryHold,
        efficiency: card.efficiency,
      });
      stored = { ...stored, tutorialSeen: true };
      save();
      if (isStudyMode() && studySession && session) {
        const alertPref =
          studySession.answers.find((row) => row.studyItemId === 'G2-ALERT-01')?.answer ?? null;
        studySession = markEducationPlayComplete(studySession, {
          durationMs: playStartedAt ? Date.now() - playStartedAt : null,
          numberOfAttempts: session.play.log.length,
          hintsUsed: 0,
          selectedDifficulty: session.meta.presetId,
          outcome: { gameId: 'qc-shift', qcShift: qcShiftEducationOutcome(session, alertPref) },
        });
        persistEducationSession(studySession);
      }
      phase = 'debrief';
      paint();
      return;
    }
    phase = 'play';
    cardPulse = true;
    paint();
  }

  function onKey(event: KeyboardEvent): void {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    if (event.key === 'Enter') {
      if (phase === 'ready') {
        startShift();
        return;
      }
      if (phase === 'tutorial') {
        root.querySelector<HTMLButtonElement>('[data-tut-next]')?.click();
        return;
      }
      if (phase === 'feedback') {
        afterFeedback();
        return;
      }
    }
    if (phase !== 'play') return;
    if (event.key === '1') act('monitor');
    if (event.key === '2') act('retest');
    if (event.key === '3') act('holdConfirm');
  }

  window.addEventListener('keydown', onKey);
  document.querySelector('#guideButton')?.addEventListener('click', openGuide);
  paint();
  const stopScienceHash = consumeScienceHash(openScience);

  return {
    destroy() {
      stopScienceHash();
      window.removeEventListener('keydown', onKey);
      document.querySelector('#guideButton')?.removeEventListener('click', openGuide);
      root.innerHTML = '';
    },
  };
}

function riskGlyph(risk: RiskLevel): string {
  if (risk === 'low') return '↓';
  if (risk === 'medium') return '~';
  if (risk === 'high') return '!';
  return '×';
}

function qualityGlyph(quality: SignalQuality): string {
  if (quality === 'good') return '●';
  if (quality === 'uncertain') return '?';
  return '×';
}
