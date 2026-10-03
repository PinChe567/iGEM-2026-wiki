import type { PublicQcScenario, PublicQcShiftSession, QcScenario, QcShiftSession } from './types';

export const QC_SHIFT_TRUTH_LEAK_KEYS = [
  'hiddenGroundTruth',
  'retestReading',
  'groundTruth',
  'ground_truth',
  'privateSeed',
  'private_seed',
  'server_truth',
  'serverTruth',
  'answerKey',
  'answer_key',
] as const;

export function toPublicQcScenario(scenario: QcScenario): PublicQcScenario {
  return {
    id: scenario.id,
    productId: scenario.productId,
    initialReading: {
      ...scenario.initialReading,
      qcFlags: [...scenario.initialReading.qcFlags],
    },
    seedMeta: { ...scenario.seedMeta },
  };
}

export function toPublicQcShiftSession(session: QcShiftSession): PublicQcShiftSession {
  return {
    meta: { ...session.meta },
    settings: { ...session.settings },
    scenarios: session.scenarios.map(toPublicQcScenario),
    play: {
      batchIndex: session.play.batchIndex,
      status: session.play.status,
      resources: { ...session.play.resources },
      batchStates: session.play.batchStates.map((b) => ({
        scenarioId: b.scenarioId,
        retestUsed: b.retestUsed,
        resolved: b.resolved,
        terminalAction: b.terminalAction,
        currentReading: { ...b.currentReading, qcFlags: [...b.currentReading.qcFlags] },
      })),
      log: session.play.log.map((row) => ({
        ...row,
        costs: { ...row.costs },
        readingAfter: { ...row.readingAfter, qcFlags: [...row.readingAfter.qcFlags] },
        debrief: row.debrief ? { ...row.debrief } : null,
      })),
    },
  };
}

export function assertNoQcTruthLeak(payload: unknown, path = 'root'): void {
  if (payload === null || payload === undefined) return;
  if (Array.isArray(payload)) {
    payload.forEach((item, i) => assertNoQcTruthLeak(item, `${path}[${i}]`));
    return;
  }
  if (typeof payload !== 'object') return;
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if ((QC_SHIFT_TRUTH_LEAK_KEYS as readonly string[]).includes(k)) {
      throw new Error(`truth_leak:${path}.${k}`);
    }
    assertNoQcTruthLeak(v, `${path}.${k}`);
  }
}
