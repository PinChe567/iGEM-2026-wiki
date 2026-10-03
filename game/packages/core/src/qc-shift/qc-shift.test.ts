import { describe, expect, it } from 'vitest';
import {
  QC_SHIFT_CONTENT_VERSION,
  QC_SHIFT_DISCLAIMER,
  QC_SHIFT_EXPLANATIONS,
  QC_SHIFT_GAME_VERSION,
  QC_SHIFT_PRESETS,
  QC_SHIFT_PRODUCTS,
  QC_SHIFT_REQUIRED_TYPES,
  QC_SHIFT_SCREENING_NOTE,
  QC_SHIFT_SCIENTIFIC_ROLE,
  QC_SHIFT_SEED_VERSION,
  QC_SHIFT_STORAGE_KEY,
  SAFETY_PENALTY_MISSED_HIGH,
  applyQcShiftAction,
  assertNoQcTruthLeak,
  buildQcShiftDailySession,
  buildQcShiftPracticeSession,
  buildQcShiftSession,
  generateQcShiftScenarios,
  getQcShiftPreset,
  migrateQcShiftStoredState,
  parseQcShiftStoredJson,
  recommendedActionFromReading,
  recordQcShiftBestScore,
  replayQcShiftSession,
  summarizeQcShift,
  toPublicQcShiftSession,
  type PlayerAction,
  type QcShiftPresetId,
  type QcShiftSession,
} from './index';

const FORBIDDEN = [
  'safe to eat',
  'definitely contaminated',
  'AeroSense diagnosed mold',
  'throw away',
  'throw-away',
];

function collectCopy(): string[] {
  const blobs = [
    QC_SHIFT_DISCLAIMER.en,
    QC_SHIFT_DISCLAIMER['zh-Hant'],
    QC_SHIFT_SCREENING_NOTE.en,
    QC_SHIFT_SCREENING_NOTE['zh-Hant'],
    ...Object.values(QC_SHIFT_EXPLANATIONS).flatMap((row) => [row.en, row['zh-Hant']]),
  ];
  return blobs;
}

function play(
  session: QcShiftSession,
  choose: (current: QcShiftSession) => PlayerAction,
): QcShiftSession {
  let current = session;
  let guard = 0;
  while (current.play.status === 'playing') {
    guard += 1;
    if (guard > 80) throw new Error('play loop exceeded');
    const action = choose(current);
    const result = applyQcShiftAction(current, action);
    if (!result.ok) {
      const fallback = applyQcShiftAction(current, 'monitor');
      expect(fallback.ok).toBe(true);
      current = fallback.session;
    } else {
      current = result.session;
    }
  }
  return current;
}

function playRecommended(session: QcShiftSession): QcShiftSession {
  return play(session, (current) => {
    const batch = current.play.batchStates[current.play.batchIndex]!;
    return recommendedActionFromReading(batch.currentReading);
  });
}

describe('qc-shift presets', () => {
  it('matches Junior / Standard / Challenge constraints', () => {
    const junior = getQcShiftPreset('junior');
    expect(junior.batchCount).toBe(4);
    expect(junior.restrictiveBudget).toBe(false);
    expect(junior.retestBudget).toBeNull();
    expect(junior.confirmBudget).toBeNull();
    expect(junior.showConfidence).toBe(false);

    const standard = getQcShiftPreset('standard');
    expect(standard.batchCount).toBe(6);
    expect(standard.confirmBudget).toBe(2);
    expect(standard.retestBudget).toBe(3);
    expect(standard.restrictiveBudget).toBe(true);
    expect(standard.showConfidence).toBe(true);

    const challenge = getQcShiftPreset('challenge');
    expect(challenge.batchCount).toBe(8);
    expect(challenge.confirmBudget).toBeLessThan(standard.confirmBudget!);
    expect(challenge.retestBudget).toBeLessThan(standard.retestBudget!);
    expect(challenge.timeBudget).toBeLessThan(standard.timeBudget!);
  });

  it('keeps required educational mixes sized to each preset', () => {
    (Object.keys(QC_SHIFT_REQUIRED_TYPES) as QcShiftPresetId[]).forEach((id) => {
      expect(QC_SHIFT_REQUIRED_TYPES[id]).toHaveLength(QC_SHIFT_PRESETS[id].batchCount);
    });
    expect(QC_SHIFT_REQUIRED_TYPES.standard).toEqual(
      expect.arrayContaining(['false-positive', 'borderline', 'invalid-reading']),
    );
    expect(QC_SHIFT_REQUIRED_TYPES.challenge).toEqual(
      expect.arrayContaining(['false-positive', 'false-negative', 'drift-qc']),
    );
  });
});

describe('qc-shift deterministic generation', () => {
  const presets: QcShiftPresetId[] = ['junior', 'standard', 'challenge'];

  for (const presetId of presets) {
    it(`same seed ⇒ identical ${presetId} cases`, () => {
      const a = buildQcShiftSession({ seed: `fixed-${presetId}-alpha`, presetId });
      const b = buildQcShiftSession({ seed: `fixed-${presetId}-alpha`, presetId });
      expect(a.scenarios).toEqual(b.scenarios);
      expect(a.settings).toEqual(b.settings);
      expect(a.meta.seedVersion).toBe(QC_SHIFT_SEED_VERSION);
      expect(a.meta.gameVersion).toBe(QC_SHIFT_GAME_VERSION);
      expect(a.meta.contentVersion).toBe(QC_SHIFT_CONTENT_VERSION);
    });
  }

  it('different seeds change order or lot assignment', () => {
    const a = generateQcShiftScenarios({ seed: 'seed-A', presetId: 'standard' });
    const b = generateQcShiftScenarios({ seed: 'seed-B', presetId: 'standard' });
    expect(a).not.toEqual(b);
  });

  it('assigns unique lots and required types', () => {
    const session = buildQcShiftSession({ seed: 'mix-check', presetId: 'challenge' });
    const types = session.scenarios.map((s) => s.scenarioType);
    expect(new Set(types).size).toBe(8);
    expect(types).toEqual(expect.arrayContaining([...QC_SHIFT_REQUIRED_TYPES.challenge]));
    expect(new Set(session.scenarios.map((s) => s.productId)).size).toBe(8);
    expect(session.scenarios.every((s) => QC_SHIFT_PRODUCTS.some((p) => p.id === s.productId))).toBe(true);
  });

  it('stamps seed metadata on every scenario', () => {
    const session = buildQcShiftSession({ seed: 'meta-seed', presetId: 'junior' });
    session.scenarios.forEach((scenario, index) => {
      expect(scenario.seedMeta).toEqual({
        seed: 'meta-seed',
        presetId: 'junior',
        index,
        seedVersion: QC_SHIFT_SEED_VERSION,
      });
    });
  });
});

describe('qc-shift no impossible scenarios', () => {
  it('keeps invalid quality paired with invalid risk, and retests clarify invalids', () => {
    for (const presetId of ['junior', 'standard', 'challenge'] as const) {
      const scenarios = generateQcShiftScenarios({ seed: `possible-${presetId}`, presetId });
      for (const scenario of scenarios) {
        const readings = [scenario.initialReading, scenario.retestReading];
        for (const reading of readings) {
          const invalidPair = reading.risk === 'invalid' && reading.quality === 'invalid';
          const validPair = reading.risk !== 'invalid' && reading.quality !== 'invalid';
          expect(invalidPair || validPair).toBe(true);
          if (reading.confidence !== null) {
            expect(reading.confidence).toBeGreaterThanOrEqual(0);
            expect(reading.confidence).toBeLessThanOrEqual(1);
          }
        }
        if (scenario.scenarioType === 'invalid-reading') {
          expect(scenario.initialReading.risk).toBe('invalid');
          expect(scenario.retestReading.risk).not.toBe('invalid');
        }
        if (scenario.scenarioType === 'false-negative') {
          expect(scenario.hiddenGroundTruth.simulatedFungalRisk).toBe('high');
          expect(scenario.initialReading.risk).not.toBe('high');
        }
        if (scenario.scenarioType === 'false-positive') {
          expect(scenario.hiddenGroundTruth.simulatedFungalRisk).toBe('not-elevated');
          expect(scenario.initialReading.risk).toBe('high');
        }
      }
    }
  });

  it('Junior hides confidence; Standard/Challenge expose it', () => {
    const junior = buildQcShiftSession({ seed: 'conf-j', presetId: 'junior' });
    const standard = buildQcShiftSession({ seed: 'conf-s', presetId: 'standard' });
    expect(junior.scenarios.every((s) => s.initialReading.confidence === null)).toBe(true);
    expect(standard.scenarios.some((s) => s.initialReading.confidence !== null)).toBe(true);
  });
});

describe('qc-shift retest and resources', () => {
  it('allows at most one meaningful retest per batch', () => {
    const session = buildQcShiftSession({ seed: 'retest-once', presetId: 'junior' });
    const first = applyQcShiftAction(session, 'retest');
    expect(first.ok).toBe(true);
    expect(first.feedback?.terminal).toBe(false);
    expect(first.feedback?.debrief).toBeNull();
    expect(first.session.play.batchStates[0]?.retestUsed).toBe(true);
    expect(first.session.play.batchStates[0]?.currentReading).toEqual(session.scenarios[0]?.retestReading);

    const second = applyQcShiftAction(first.session, 'retest');
    expect(second.ok).toBe(false);
    expect(second.reason).toBe('already-retested');
  });

  it('consumes retest and confirm resources in Standard', () => {
    let session = buildQcShiftSession({ seed: 'resources-std', presetId: 'standard' });
    expect(session.play.resources.retestRemaining).toBe(3);
    expect(session.play.resources.confirmRemaining).toBe(2);

    const retest = applyQcShiftAction(session, 'retest');
    expect(retest.ok).toBe(true);
    expect(retest.session.play.resources.retestRemaining).toBe(2);
    expect(retest.session.play.resources.timeRemaining).toBe(14);
    session = retest.session;

    const hold = applyQcShiftAction(session, 'holdConfirm');
    expect(hold.ok).toBe(true);
    expect(hold.session.play.resources.confirmRemaining).toBe(1);
    expect(hold.feedback?.debrief?.simulatedFungalRisk).toBeDefined();
  });

  it('rejects extra confirms and extra retests when the budget is spent', () => {
    let session = buildQcShiftSession({ seed: 'budget-tight', presetId: 'challenge' });
    expect(session.play.resources.confirmRemaining).toBe(1);
    expect(session.play.resources.retestRemaining).toBe(2);

    session = applyQcShiftAction(session, 'holdConfirm').session;
    const blocked = applyQcShiftAction(session, 'holdConfirm');
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe('no-confirm-remaining');

    const r1 = applyQcShiftAction(session, 'retest');
    expect(r1.ok).toBe(true);
    const afterMonitor = applyQcShiftAction(r1.session, 'monitor');
    expect(afterMonitor.ok).toBe(true);
    const r2 = applyQcShiftAction(afterMonitor.session, 'retest');
    expect(r2.ok).toBe(true);
    const afterMonitor2 = applyQcShiftAction(r2.session, 'monitor');
    const r3 = applyQcShiftAction(afterMonitor2.session, 'retest');
    expect(r3.ok).toBe(false);
    expect(r3.reason).toBe('no-retest-remaining');
  });

  it('Junior never blocks retest or confirm on budget', () => {
    let session = buildQcShiftSession({ seed: 'junior-open', presetId: 'junior' });
    for (let i = 0; i < 4; i += 1) {
      const retest = applyQcShiftAction(session, 'retest');
      expect(retest.ok).toBe(true);
      const hold = applyQcShiftAction(retest.session, 'holdConfirm');
      expect(hold.ok).toBe(true);
      session = hold.session;
    }
    expect(session.play.status).toBe('complete');
  });

  it('retest readings stay deterministic for the same seed', () => {
    const a = buildQcShiftSession({ seed: 'retest-det', presetId: 'standard' });
    const b = buildQcShiftSession({ seed: 'retest-det', presetId: 'standard' });
    const ra = applyQcShiftAction(a, 'retest');
    const rb = applyQcShiftAction(b, 'retest');
    expect(ra.session.play.batchStates[0]?.currentReading).toEqual(
      rb.session.play.batchStates[0]?.currentReading,
    );
  });
});

describe('qc-shift scoring', () => {
  it('uses separate safety / foodSaved / unnecessaryHold / efficiency dimensions', () => {
    const done = playRecommended(buildQcShiftSession({ seed: 'score-shape', presetId: 'junior' }));
    const card = summarizeQcShift(done);
    expect(card).toEqual(
      expect.objectContaining({
        safety: expect.any(Number),
        foodSaved: expect.any(Number),
        unnecessaryHold: expect.any(Number),
        efficiency: expect.any(Number),
        complete: true,
      }),
    );
    expect(card.safety).toBeGreaterThanOrEqual(0);
    expect(card.safety).toBeLessThanOrEqual(100);
    expect(card.efficiency).toBe(100);
  });

  it('penalizes a missed high-risk lot much more than an unnecessary hold', () => {
    const miss = play(buildQcShiftSession({ seed: 'score-miss', presetId: 'junior' }), (current) => {
      const scenario = current.scenarios[current.play.batchIndex]!;
      return scenario.hiddenGroundTruth.simulatedFungalRisk === 'high' ? 'monitor' : 'monitor';
    });
    const holdClear = play(buildQcShiftSession({ seed: 'score-miss', presetId: 'junior' }), (current) => {
      const scenario = current.scenarios[current.play.batchIndex]!;
      return scenario.hiddenGroundTruth.simulatedFungalRisk === 'not-elevated' ? 'holdConfirm' : 'holdConfirm';
    });
    const missCard = summarizeQcShift(miss);
    const holdCard = summarizeQcShift(holdClear);
    expect(missCard.missedHighRiskCount).toBeGreaterThan(0);
    expect(holdCard.unnecessaryHoldCount).toBeGreaterThan(0);
    expect(100 - missCard.safety).toBeGreaterThanOrEqual(SAFETY_PENALTY_MISSED_HIGH);
    expect(holdCard.safety).toBe(100);
    expect(missCard.safety).toBeLessThan(holdCard.safety);
    expect(holdCard.unnecessaryHold).toBe(holdCard.unnecessaryHoldCount);
  });

  it('counts foodSaved only when a not-elevated lot is monitored', () => {
    const session = play(buildQcShiftSession({ seed: 'food-saved', presetId: 'junior' }), (current) => {
      const truth = current.scenarios[current.play.batchIndex]!.hiddenGroundTruth.simulatedFungalRisk;
      return truth === 'not-elevated' ? 'monitor' : 'holdConfirm';
    });
    const card = summarizeQcShift(session);
    const expectedSaved = session.scenarios.filter(
      (s) => s.hiddenGroundTruth.simulatedFungalRisk === 'not-elevated',
    ).length;
    expect(card.foodSaved).toBe(expectedSaved);
    expect(card.unnecessaryHold).toBe(0);
  });
});

describe('qc-shift session flow', () => {
  it('can resolve every preset so all scenarios end', () => {
    for (const presetId of ['junior', 'standard', 'challenge'] as const) {
      const done = playRecommended(buildQcShiftSession({ seed: `end-${presetId}`, presetId }));
      expect(done.play.status).toBe('complete');
      expect(done.play.batchStates.every((b) => b.resolved)).toBe(true);
      expect(summarizeQcShift(done).complete).toBe(true);
      expect(done.play.batchIndex).toBe(done.scenarios.length);
    }
  });

  it('monitor ends the batch and may reveal follow-up in debrief only', () => {
    const session = buildQcShiftSession({ seed: 'monitor-debrief', presetId: 'junior' });
    const result = applyQcShiftAction(session, 'monitor');
    expect(result.ok).toBe(true);
    expect(result.feedback?.terminal).toBe(true);
    expect(result.feedback?.debrief?.simulatedFungalRisk).toBe(
      session.scenarios[0]!.hiddenGroundTruth.simulatedFungalRisk,
    );
    const pub = toPublicQcShiftSession(result.session);
    expect(pub.scenarios[0]).not.toHaveProperty('hiddenGroundTruth');
    expect(pub.scenarios[0]).not.toHaveProperty('retestReading');
  });

  it('holdConfirm consumes a confirm resource and ends the batch with follow-up truth', () => {
    const session = buildQcShiftSession({ seed: 'hold-end', presetId: 'standard' });
    const result = applyQcShiftAction(session, 'holdConfirm');
    expect(result.ok).toBe(true);
    expect(result.feedback?.debrief).toBeTruthy();
    expect(result.session.play.batchStates[0]?.resolved).toBe(true);
    expect(result.session.play.batchIndex).toBe(1);
  });

  it('rejects actions after the run is complete', () => {
    const done = playRecommended(buildQcShiftSession({ seed: 'done-block', presetId: 'junior' }));
    const extra = applyQcShiftAction(done, 'monitor');
    expect(extra.ok).toBe(false);
    expect(extra.reason).toBe('session-complete');
  });

  it('replays the same seed to the same cases', () => {
    const original = buildQcShiftPracticeSession({ presetId: 'standard', seed: 'replay-qc' });
    const replayed = replayQcShiftSession(original);
    expect(replayed.scenarios).toEqual(original.scenarios);
  });

  it('daily helper is date-stable', () => {
    const a = buildQcShiftDailySession({ presetId: 'standard', dateUTC: '2026-09-08' });
    const b = buildQcShiftDailySession({ presetId: 'standard', dateUTC: '2026-09-08' });
    expect(a.meta.seed).toBe(b.meta.seed);
    expect(a.meta.mode).toBe('daily');
    expect(a.scenarios).toEqual(b.scenarios);
  });
});

describe('qc-shift hidden truth sanitizer', () => {
  it('does not expose hidden truth on a public session before feedback', () => {
    const session = buildQcShiftSession({ seed: 'leak-check', presetId: 'challenge' });
    const pub = toPublicQcShiftSession(session);
    assertNoQcTruthLeak(pub);
    expect(() => assertNoQcTruthLeak(session)).toThrow(/truth_leak/);
    expect(JSON.stringify(pub.scenarios)).not.toMatch(/hiddenGroundTruth|retestReading/);
    expect(pub.play.log).toEqual([]);
  });

  it('attaches simulated follow-up only on terminal feedback', () => {
    const session = buildQcShiftSession({ seed: 'feedback-timing', presetId: 'junior' });
    const retest = applyQcShiftAction(session, 'retest');
    expect(retest.feedback?.debrief).toBeNull();
    const pubMid = toPublicQcShiftSession(retest.session);
    assertNoQcTruthLeak(pubMid);
    const terminal = applyQcShiftAction(retest.session, 'monitor');
    expect(terminal.feedback?.debrief?.simulatedFungalRisk).toBeDefined();
  });
});

describe('qc-shift content / disclaimer', () => {
  it('states screening-only role and simulation disclaimer', () => {
    expect(QC_SHIFT_SCIENTIFIC_ROLE).toBe('screening');
    expect(QC_SHIFT_DISCLAIMER.en).toMatch(/educational simulations/i);
    expect(QC_SHIFT_DISCLAIMER.en).toMatch(/not experimental AeroSense performance claims/i);
    expect(QC_SHIFT_SCREENING_NOTE.en).toMatch(/not a diagnostic/i);
  });

  it('avoids diagnostic / disposal wording', () => {
    const text = collectCopy().join('\n').toLowerCase();
    for (const phrase of FORBIDDEN) {
      expect(text).not.toContain(phrase.toLowerCase());
    }
  });
});

describe('qc-shift storage', () => {
  it('parses corrupt and empty payloads', () => {
    expect(parseQcShiftStoredJson(null).storageVersion).toBe(1);
    expect(parseQcShiftStoredJson('{not json').playedSeeds).toEqual([]);
    expect(migrateQcShiftStoredState({ locale: 'fr', bestByPreset: { x: 3 } }).locale).toBe('zh-Hant');
    expect(QC_SHIFT_STORAGE_KEY).toBe('suite.qc-shift.v1');
    expect(parseQcShiftStoredJson(null).tutorialSeen).toBe(false);
    expect(migrateQcShiftStoredState({ tutorialSeen: true, designHelpChoices: ['risk'] }).tutorialSeen).toBe(true);
    expect(migrateQcShiftStoredState({ tutorialSeen: true }).designHelpChoices).toEqual([]);
  });

  it('records seeds and prefers higher safety when storing bests', () => {
    let state = parseQcShiftStoredJson(null);
    state = recordQcShiftBestScore(state, 'junior', {
      safety: 60,
      foodSaved: 4,
      unnecessaryHold: 0,
      efficiency: 100,
    });
    state = recordQcShiftBestScore(state, 'junior', {
      safety: 80,
      foodSaved: 1,
      unnecessaryHold: 2,
      efficiency: 70,
    });
    expect(state.bestByPreset.junior?.safety).toBe(80);
    state = recordQcShiftBestScore(state, 'junior', {
      safety: 70,
      foodSaved: 4,
      unnecessaryHold: 0,
      efficiency: 100,
    });
    expect(state.bestByPreset.junior?.safety).toBe(80);
  });
});
