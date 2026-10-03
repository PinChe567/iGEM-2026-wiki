import { describe, expect, it } from 'vitest';
import { toLegacyOdors } from '@suite/content';
import {
  assertPatternsUnique,
  patternsForSize,
  injectNoise,
  noiseCountForOffCells,
  buildSession,
  buildSessionMeta,
  buildPracticeSession,
  applyAnswer,
  clampScore,
  summarizeResult,
  mergePracticeSettings,
  listNoisePercents,
  listPixelPresetIds,
  parsePixelStoredJson,
  migratePixelStoredState,
  PIXEL_GAME_VERSION,
  PIXEL_SEED_VERSION,
  PIXEL_PRESETS,
  DEFAULT_PRACTICE_SETTINGS,
  JUNIOR_SETTINGS,
  CHALLENGE_SETTINGS,
  getPreset,
  effectivePatternDisplayMs,
  usesTimedMemory,
  dailyPresetIdForLevel,
  toPublicQuestion,
  toPublicSession,
  assertNoAnswerLeak,
  type PixelOdor,
} from './index';

function catalog(): PixelOdor[] {
  return toLegacyOdors().map((o) => ({ id: o.id, vector: o.vector }));
}

describe('pixel patterns', () => {
  for (const size of [3, 4, 5, 6, 7] as const) {
    it(`is deterministic and unique at ${size}×${size}`, () => {
      const odors = catalog();
      const a = patternsForSize(odors, size);
      const b = patternsForSize(odors, size);
      assertPatternsUnique(a);
      for (const odor of odors) {
        expect(a.get(odor.id)).toEqual(b.get(odor.id));
      }
      expect(a.size).toBe(20);
    });
  }
});

describe('pixel noise (fixed count of OFF cells)', () => {
  it('lists 0/10/20/30/40 percents', () => {
    expect([...listNoisePercents()]).toEqual([0, 10, 20, 30, 40]);
  });

  it('never covers base-on cells and reports exact count', () => {
    const odors = catalog();
    const patterns = patternsForSize(odors, 5);
    const base = patterns.get('banana')!;
    const off = base.filter((on) => !on).length;
    for (const percent of listNoisePercents()) {
      const expected = noiseCountForOffCells(off, percent);
      const result = injectNoise(base, percent, `noise-test-${percent}`);
      expect(result.noiseCount).toBe(expected);
      expect(result.noiseIndices).toHaveLength(expected);
      for (const index of result.noiseIndices) {
        expect(base[index]).toBe(false);
        expect(result.displayCells[index]).toBe('noise');
      }
      base.forEach((on, index) => {
        if (on) expect(result.displayCells[index]).toBe('on');
      });
    }
  });

  it('0% yields zero noise', () => {
    const base = [true, false, false, true];
    const result = injectNoise(base, 0, 'z');
    expect(result.noiseCount).toBe(0);
    expect(result.noiseIndices).toEqual([]);
  });
});

describe('pixel session seeds', () => {
  it('same seed ⇒ identical pool, questions, options, noise', () => {
    const odors = catalog();
    const settings = mergePracticeSettings({
      matrixSize: 5,
      noisePercentOfOff: 20,
      distractorBias: 'similar',
    });
    const meta = buildSessionMeta({
      seed: 'fixed-seed-alpha',
      mode: 'practice',
      presetId: 'practice',
      contentVersion: '1.0.0',
    });
    const a = buildSession({ odors, settings, meta });
    const b = buildSession({ odors, settings, meta });
    expect(a.poolIds).toEqual(b.poolIds);
    expect(a.questions).toEqual(b.questions);
    expect(a.meta.seedVersion).toBe(PIXEL_SEED_VERSION);
    expect(a.meta.gameVersion).toBe(PIXEL_GAME_VERSION);
  });

  it('different seeds change pool or questions while keeping constraints', () => {
    const odors = catalog();
    const settings = mergePracticeSettings({ matrixSize: 4, noisePercentOfOff: 10 });
    const a = buildSession({
      odors,
      settings,
      meta: buildSessionMeta({ seed: 'seed-A', mode: 'practice', presetId: 'practice' }),
    });
    const b = buildSession({
      odors,
      settings,
      meta: buildSessionMeta({ seed: 'seed-B', mode: 'practice', presetId: 'practice' }),
    });
    const same =
      JSON.stringify(a.poolIds) === JSON.stringify(b.poolIds) &&
      JSON.stringify(a.questions) === JSON.stringify(b.questions);
    expect(same).toBe(false);

    for (const session of [a, b]) {
      expect(session.poolIds).toHaveLength(8);
      expect(new Set(session.poolIds).size).toBe(8);
      expect(session.questions).toHaveLength(16);
      for (const q of session.questions) {
        expect(q.optionIds).toHaveLength(4);
        expect(new Set(q.optionIds).size).toBe(4);
        expect(q.optionIds).toContain(q.answerId);
        expect(q.noiseCount).toBe(q.noiseIndices.length);
        const onCount = q.basePattern.filter(Boolean).length;
        expect(onCount).toBeGreaterThan(0);
      }
      const answerCounts = session.questions.map((q) => q.answerId);
      // 8 unique + 8 repeats ⇒ at most 8 unique ids, all from pool
      for (const id of answerCounts) expect(session.poolIds).toContain(id);
    }
  });

  it('practice helper records versions', () => {
    const session = buildPracticeSession({
      odors: catalog(),
      seed: 'replay-me',
      contentVersion: '1.0.0',
    });
    expect(session.meta.seed).toBe('replay-me');
    expect(session.meta.contentVersion).toBe('1.0.0');
  });
});

describe('pixel scoring', () => {
  const settings = mergePracticeSettings({});

  it('rejects out-of-range and unknown choices without changing score', () => {
    expect(
      applyAnswer({
        settings,
        currentScore: 200,
        answerId: 'banana',
        optionIds: ['banana', 'lemon', 'rose', 'mint'],
        chosenId: 'not-an-option',
        alreadyAnswered: false,
      }).nextScore,
    ).toBe(200);

    expect(clampScore(Number.NaN, settings)).toBe(0);
    expect(clampScore(99999, settings)).toBe(1600);
    expect(clampScore(-50, settings)).toBe(0);
  });

  it('scores correct answers and summarizes pass/perfect', () => {
    const hit = applyAnswer({
      settings,
      currentScore: 0,
      answerId: 'banana',
      optionIds: ['banana', 'lemon', 'rose', 'mint'],
      chosenId: 'banana',
      alreadyAnswered: false,
    });
    expect(hit.correct).toBe(true);
    expect(hit.nextScore).toBe(100);

    const summary = summarizeResult(1000, settings);
    expect(summary.passed).toBe(true);
    expect(summary.perfect).toBe(false);
    expect(summarizeResult(1600, settings).perfect).toBe(true);
  });
});

describe('pixel localStorage migration', () => {
  it('does not crash on corrupt or legacy payloads', () => {
    expect(parsePixelStoredJson(null).storageVersion).toBe(2);
    expect(parsePixelStoredJson('{not json').playedSeeds).toEqual([]);
    expect(migratePixelStoredState({ locale: 'fr', bestByPreset: { x: 'bad' } }).locale).toBe(
      'zh-Hant',
    );
    expect(
      migratePixelStoredState({
        storageVersion: 1,
        locale: 'en',
        muted: true,
        playedSeeds: ['a', 1, 'b'],
        bestByPreset: { practice: 400 },
      }).bestByPreset.practice,
    ).toBe(400);
    expect(parsePixelStoredJson(null).onboardingSeen).toBe(false);
    expect(migratePixelStoredState({ onboardingSeen: true, locale: 'en' }).onboardingSeen).toBe(true);
  });
});

describe('pixel level presets', () => {
  it('keeps Standard practice settings unchanged', () => {
    expect(DEFAULT_PRACTICE_SETTINGS).toEqual({
      matrixSize: 4,
      distractorBias: 'similar',
      noisePercentOfOff: 10,
      allowStudyReview: true,
      patternDisplayMs: 0,
      poolSize: 8,
      questionCount: 16,
      optionsPerQuestion: 4,
      passCorrect: 10,
      pointsPerCorrect: 100,
    });
    expect(getPreset('practice')).toEqual(DEFAULT_PRACTICE_SETTINGS);
  });

  it('adds a child-friendly Junior preset', () => {
    expect(JUNIOR_SETTINGS).toMatchObject({
      matrixSize: 3,
      poolSize: 5,
      questionCount: 10,
      optionsPerQuestion: 3,
      distractorBias: 'mixed',
      allowStudyReview: true,
      patternDisplayMs: 0,
      passCorrect: 6,
    });
    expect([0, 10]).toContain(JUNIOR_SETTINGS.noisePercentOfOff);
    expect(getPreset('junior')).toEqual(JUNIOR_SETTINGS);
  });

  it('keeps Challenge and existing daily presets', () => {
    expect(CHALLENGE_SETTINGS.patternDisplayMs).toBeGreaterThan(0);
    expect(getPreset('challenge')).toEqual(CHALLENGE_SETTINGS);
    expect(listPixelPresetIds()).toEqual(
      expect.arrayContaining(['junior', 'practice', 'challenge', 'daily-easy', 'daily-standard', 'daily-focus', 'daily-dense']),
    );
    expect(PIXEL_PRESETS['daily-focus']?.allowStudyReview).toBe(false);
    expect(PIXEL_PRESETS['daily-dense']?.matrixSize).toBe(6);
    expect(dailyPresetIdForLevel('practice')).toBe('daily-standard');
    expect(dailyPresetIdForLevel('junior')).toBe('junior');
    expect(dailyPresetIdForLevel('challenge')).toBe('daily-focus');
  });

  it('builds a deterministic Junior session with 6/10 pass mark', () => {
    const a = buildPracticeSession({
      odors: catalog(),
      seed: 'junior-seed-alpha',
      presetId: 'junior',
      contentVersion: '1.0.0',
    });
    const b = buildPracticeSession({
      odors: catalog(),
      seed: 'junior-seed-alpha',
      presetId: 'junior',
      contentVersion: '1.0.0',
    });
    expect(a.poolIds).toEqual(b.poolIds);
    expect(a.questions).toEqual(b.questions);
    expect(a.poolIds).toHaveLength(5);
    expect(a.questions).toHaveLength(10);
    expect(a.meta.presetId).toBe('junior');
    expect(a.settings.patternDisplayMs).toBe(0);
    for (const q of a.questions) {
      expect(q.optionIds).toHaveLength(3);
      expect(q.optionIds).toContain(q.answerId);
    }
    expect(summarizeResult(600, a.settings).passed).toBe(true);
    expect(summarizeResult(500, a.settings).passed).toBe(false);
  });
});

describe('pixel timed memory', () => {
  it('never applies timed memory to Junior', () => {
    expect(effectivePatternDisplayMs(JUNIOR_SETTINGS, 'junior')).toBe(0);
    expect(effectivePatternDisplayMs({ ...JUNIOR_SETTINGS, patternDisplayMs: 1200 }, 'junior')).toBe(0);
    expect(usesTimedMemory({ ...JUNIOR_SETTINGS, patternDisplayMs: 800 }, 'junior')).toBe(false);
    expect(mergePracticeSettings({ patternDisplayMs: 800 }, 'junior').patternDisplayMs).toBe(0);
  });

  it('uses patternDisplayMs as visible duration for Challenge', () => {
    expect(effectivePatternDisplayMs(CHALLENGE_SETTINGS, 'challenge')).toBe(800);
    expect(usesTimedMemory(CHALLENGE_SETTINGS, 'challenge')).toBe(true);
    expect(effectivePatternDisplayMs(DEFAULT_PRACTICE_SETTINGS, 'practice')).toBe(0);
    expect(usesTimedMemory(getPreset('daily-focus'), 'daily-focus')).toBe(true);
    expect(effectivePatternDisplayMs(getPreset('daily-focus'))).toBe(1200);
  });
});

describe('pixel public online sanitizer', () => {
  it('strips answer keys from public session payloads', () => {
    const session = buildPracticeSession({
      odors: catalog(),
      seed: 'sanitize-test-seed',
      contentVersion: '1.0.0',
    });
    const pub = toPublicSession(session);
    expect(pub.questions).toHaveLength(session.questions.length);
    expect(pub.questions[0]!.questionId).toBe('q0');
    expect(pub.questions[0]!.optionIds).toEqual(session.questions[0]!.optionIds);
    expect(pub.questions[0]!.displayCells).toEqual(session.questions[0]!.displayCells);
    assertNoAnswerLeak(pub);
    expect(() => assertNoAnswerLeak(session.questions[0])).toThrow(/answer_leak/);
    expect(toPublicQuestion(session.questions[0]!)).not.toHaveProperty('answerId');
  });
});
