import { describe, expect, it } from 'vitest';
import { buildQcShiftSession } from '../qc-shift/session';
import {
  EDUCATION_ITEMS,
  EDUCATION_SCHEMA_VERSION,
  buildEducationExport,
  createEducationSession,
  educationSessionsToCsv,
  formatEducationSummaryMarkdown,
  isStudyQueryEnabled,
  itemsForGame,
  markEducationPlayComplete,
  migrateEducationStoredState,
  parseEducationExportJson,
  parseEducationStoredJson,
  qcShiftEducationOutcome,
  recordEducationAnswer,
  scoreEducationAnswer,
  summarizeEducationSessions,
  upsertEducationSession,
} from './index';

describe('education evidence schema', () => {
  it('keeps stable item ids and scores concept answers, not brand trivia', () => {
    expect(EDUCATION_ITEMS.map((item) => item.id)).toEqual([
      'G1-COMB-01',
      'G1-NOISE-01',
      'G1-TRANSFER-01',
      'G1-FEED-01',
      'G2-SCREEN-01',
      'G2-QC-01',
      'G2-TRANSFER-01',
      'G2-FEED-01',
      'G2-ALERT-01',
      'G3-MIX-01',
      'G3-DECODE-01',
      'G3-TRANSFER-01',
      'G3-FEED-01',
    ]);
    expect(scoreEducationAnswer('G1-COMB-01', 'b')).toBe(true);
    expect(scoreEducationAnswer('G1-COMB-01', 'a')).toBe(false);
    expect(scoreEducationAnswer('G1-FEED-01', 'visuals')).toBeNull();
    expect(EDUCATION_ITEMS.some((item) => /AeroSense product/i.test(item.prompt.en))).toBe(false);
    expect(itemsForGame('pixel', 'pre')).toHaveLength(2);
    expect(itemsForGame('spectrum', 'transfer')).toHaveLength(1);
  });

  it('enables study mode only for ?study=1', () => {
    expect(isStudyQueryEnabled('?study=1')).toBe(true);
    expect(isStudyQueryEnabled('study=1')).toBe(true);
    expect(isStudyQueryEnabled('?study=0')).toBe(false);
    expect(isStudyQueryEnabled('')).toBe(false);
    expect(isStudyQueryEnabled('?seed=abc')).toBe(false);
  });

  it('records pre/post answers and exports json + csv without PII fields', () => {
    let session = createEducationSession({
      gameId: 'spectrum',
      gameVersion: '1.1.0',
      contentVersion: '1.0.0',
      locale: 'en',
      selectedDifficulty: 'junior',
    });
    session = recordEducationAnswer(session, { studyItemId: 'G3-MIX-01', phase: 'pre', answer: 'a' });
    session = recordEducationAnswer(session, { studyItemId: 'G3-DECODE-01', phase: 'pre', answer: 'b' });
    session = markEducationPlayComplete(session, {
      durationMs: 42_000,
      numberOfAttempts: 3,
      hintsUsed: 1,
      outcome: {
        gameId: 'spectrum',
        spectrum: { guesses: 3, hintLevel: 1, solved: true, difficulty: 'junior' },
      },
    });
    session = recordEducationAnswer(session, { studyItemId: 'G3-MIX-01', phase: 'post', answer: 'b' });
    session = recordEducationAnswer(session, { studyItemId: 'G3-DECODE-01', phase: 'post', answer: 'b' });

    const payload = buildEducationExport([session]);
    expect(payload.privacy).toBe('anonymous-local-only');
    expect(payload.schemaVersion).toBe(EDUCATION_SCHEMA_VERSION);
    expect(JSON.stringify(payload)).not.toMatch(/email|schoolId|"name":/i);

    const csv = educationSessionsToCsv([session]);
    expect(csv.split('\n')[0]).toContain('anonymousSessionId');
    expect(csv).toContain('G3-MIX-01');
    expect(csv).toContain('spectrum');

    const parsed = parseEducationExportJson(JSON.stringify(payload));
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.answers).toHaveLength(4);
  });

  it('loads older storage, drops PII keys, and preserves sessions', () => {
    const parsed = parseEducationStoredJson(
      JSON.stringify({
        storageVersion: 1,
        name: 'Ada',
        email: 'ada@example.com',
        sessions: [
          {
            anonymousSessionId: 'anon-old',
            gameId: 'pixel',
            gameVersion: '2.0.0',
            locale: 'en',
            answers: [{ studyItemId: 'G1-COMB-01', phase: 'pre', answer: 'b', correct: true }],
            email: 'hidden@example.com',
          },
        ],
      }),
    );
    expect(parsed.sessions).toHaveLength(1);
    expect(parsed.sessions[0]?.anonymousSessionId).toBe('anon-old');
    expect(JSON.stringify(parsed)).not.toMatch(/Ada|hidden@/);
  });

  it('summarizes paired n without inventing missing duration or running significance tests', () => {
    let a = createEducationSession({
      gameId: 'pixel',
      gameVersion: '2.0.0',
      contentVersion: '1.0.0',
      locale: 'en',
    });
    a = recordEducationAnswer(a, { studyItemId: 'G1-COMB-01', phase: 'pre', answer: 'a' });
    a = recordEducationAnswer(a, { studyItemId: 'G1-COMB-01', phase: 'post', answer: 'b' });
    a = markEducationPlayComplete(a, {
      durationMs: 10_000,
      numberOfAttempts: 6,
      hintsUsed: 0,
      outcome: null,
    });

    let b = createEducationSession({
      gameId: 'pixel',
      gameVersion: '2.0.0',
      contentVersion: '1.0.0',
      locale: 'en',
    });
    b = recordEducationAnswer(b, { studyItemId: 'G1-COMB-01', phase: 'pre', answer: 'b' });
    b = markEducationPlayComplete(b, {
      durationMs: null,
      numberOfAttempts: 6,
      hintsUsed: null,
      outcome: null,
    });

    const summaries = summarizeEducationSessions([a, b]);
    const pixel = summaries.find((row) => row.gameId === 'pixel')!;
    const comb = pixel.pairedItems.find((row) => row.studyItemId === 'G1-COMB-01')!;
    expect(comb.pairedN).toBe(1);
    expect(comb.preCorrect).toBe(0);
    expect(comb.postCorrect).toBe(1);
    expect(comb.improved).toBe(1);
    expect(pixel.medianDurationMs).toBe(10_000);
    expect(pixel.medianHintsUsed).toBe(0);
    const md = formatEducationSummaryMarkdown(summaries);
    expect(md).not.toMatch(/p-value|t-test|significance/i);
    expect(md).toMatch(/paired n=1/);
  });

  it('derives QC decision counts from a real session', () => {
    const session = buildQcShiftSession({ seed: 'edu-qc-seed', presetId: 'junior' });
    const outcome = qcShiftEducationOutcome(session);
    expect(outcome.monitorCount + outcome.retestCount + outcome.holdConfirmCount).toBeGreaterThanOrEqual(0);
    expect(outcome.missedSimulatedRisks).toBeGreaterThanOrEqual(0);
    expect(outcome.unnecessaryHolds).toBeGreaterThanOrEqual(0);
  });

  it('upserts sessions into stored state', () => {
    const empty = migrateEducationStoredState(null);
    let session = createEducationSession({
      gameId: 'qc-shift',
      gameVersion: '1.0.0',
      contentVersion: '1.0.0',
      locale: 'zh-Hant',
    });
    session = recordEducationAnswer(session, { studyItemId: 'G2-SCREEN-01', phase: 'pre', answer: 'b' });
    const next = upsertEducationSession(empty, session);
    expect(next.sessions).toHaveLength(1);
    const again = upsertEducationSession(next, { ...session, completedPlay: true });
    expect(again.sessions).toHaveLength(1);
    expect(again.sessions[0]?.completedPlay).toBe(true);
  });
});
