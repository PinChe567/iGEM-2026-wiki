import { describe, expect, it } from 'vitest';
import {
  generateSoloOfficialCase,
  solutionStatusForEvidence,
  soloPlanFingerprint,
  runHeadlessSoloBatch,
  runHeadlessSoloCase,
  createSoloTask,
  applyTaskInput,
  tickSoloTask,
  SOLO_HUMAN_ID,
} from './index';

describe('solo official cases', () => {
  it('never assigns phantom to the human player and stays unique', () => {
    for (let i = 0; i < 8; i += 1) {
      const result = generateSoloOfficialCase({ seed: `solo-unit-${i}` });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.case.phantomPlayerId).not.toBe(SOLO_HUMAN_ID);
      expect(result.case.npcIds).toHaveLength(4);
      expect(result.case.playerCount).toBe(5);
      // Generator already enforced unique solution; spot-check via status helper once.
      if (i === 0) {
        const status = solutionStatusForEvidence(
          result.case,
          new Set(result.case.requiredEvidenceIds),
        );
        expect(status.unique).toBe(true);
        expect(status.matchesTruth).toBe(true);
      }
    }
  }, 60_000);

  it('same seed yields identical truth and high-level plans', () => {
    const a = generateSoloOfficialCase({ seed: 'replay-seed-7' });
    const b = generateSoloOfficialCase({ seed: 'replay-seed-7' });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(soloPlanFingerprint(a.case)).toBe(soloPlanFingerprint(b.case));
  });

  it('partial evidence reports multiple possibles without implying uniqueness', () => {
    const result = generateSoloOfficialCase({ seed: 'partial-ev-1' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const partial = new Set(result.case.requiredEvidenceIds.slice(0, 3));
    const status = solutionStatusForEvidence(result.case, partial);
    expect(status.unique).toBe(false);
    expect(status.count).toBeGreaterThan(1);
  });
});

describe('solo mini-tasks', () => {
  it('completes pattern pair and calibration hold with keyboard-style inputs', () => {
    let pair = createSoloTask('patternPair', 't1');
    if (pair.kind !== 'patternPair') throw new Error('kind');
    pair = applyTaskInput(pair, { type: 'select', index: pair.answerIndex }) as typeof pair;
    expect(pair.completed).toBe(true);

    let hold = createSoloTask('calibrationHold', 't2');
    if (hold.kind !== 'calibrationHold') throw new Error('kind');
    hold = applyTaskInput(hold, { type: 'hold', down: true }) as typeof hold;
    for (let i = 0; i < 40; i += 1) hold = tickSoloTask(hold, 100) as typeof hold;
    expect(hold.completed).toBe(true);

    let route = createSoloTask('signalRouting', 't3');
    if (route.kind !== 'signalRouting') throw new Error('kind');
    for (const node of route.path) {
      route = applyTaskInput(route, { type: 'route', node }) as typeof route;
    }
    expect(route.completed).toBe(true);
  });
});

describe('headless fairness batch', () => {
  it('passes at least 500 solo cases', () => {
    const { passed, failed } = runHeadlessSoloBatch(500, 'fair-500');
    if (failed.length > 0) {
      const sample = failed
        .slice(0, 8)
        .map((f) => `${f.seed}:${f.issues.join('|')}`)
        .join(', ');
      throw new Error(`Headless failures ${failed.length}/500 — ${sample}`);
    }
    expect(passed).toBe(500);
  }, 180_000);

  it('reproduces a single failing seed deterministically when present', () => {
    const once = runHeadlessSoloCase('fair-500-0');
    const twice = runHeadlessSoloCase('fair-500-0');
    expect(once.ok).toBe(twice.ok);
    expect(once.issues.join()).toBe(twice.issues.join());
    if (once.solo && twice.solo) {
      expect(soloPlanFingerprint(once.solo)).toBe(soloPlanFingerprint(twice.solo));
    }
  });
});
