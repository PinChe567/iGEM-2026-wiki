import { canAffordAction, isFoodSaved, isTerminalAction, isUnnecessaryHold, missedHighRisk } from './rules';
import type {
  PlayerAction,
  QcActionResult,
  QcBatchState,
  QcDebrief,
  QcFeedback,
  QcResourceCosts,
  QcShiftResources,
  QcShiftSession,
} from './types';

function cloneResources(resources: QcShiftResources): QcShiftResources {
  return {
    retestRemaining: resources.retestRemaining,
    confirmRemaining: resources.confirmRemaining,
    timeRemaining: resources.timeRemaining,
  };
}

function spend(resources: QcShiftResources, costs: QcResourceCosts): QcShiftResources {
  const next = cloneResources(resources);
  if (next.retestRemaining !== null) next.retestRemaining -= costs.retest;
  if (next.confirmRemaining !== null) next.confirmRemaining -= costs.confirm;
  if (next.timeRemaining !== null) next.timeRemaining -= costs.time;
  return next;
}

function costsFor(action: PlayerAction, settings: QcShiftSession['settings']): QcResourceCosts {
  return {
    retest: action === 'retest' ? 1 : 0,
    confirm: action === 'holdConfirm' ? 1 : 0,
    time:
      action === 'retest'
        ? settings.retestTimeCost
        : action === 'holdConfirm'
          ? settings.confirmTimeCost
          : 0,
  };
}

function cloneBatch(state: QcBatchState): QcBatchState {
  return {
    scenarioId: state.scenarioId,
    retestUsed: state.retestUsed,
    resolved: state.resolved,
    terminalAction: state.terminalAction,
    currentReading: {
      ...state.currentReading,
      qcFlags: [...state.currentReading.qcFlags],
    },
  };
}

function cloneSession(session: QcShiftSession): QcShiftSession {
  return {
    meta: { ...session.meta },
    settings: { ...session.settings },
    scenarios: session.scenarios,
    play: {
      batchIndex: session.play.batchIndex,
      status: session.play.status,
      resources: cloneResources(session.play.resources),
      batchStates: session.play.batchStates.map(cloneBatch),
      log: session.play.log.map((row) => ({
        ...row,
        costs: { ...row.costs },
        readingAfter: { ...row.readingAfter, qcFlags: [...row.readingAfter.qcFlags] },
        debrief: row.debrief ? { ...row.debrief } : null,
      })),
    },
  };
}

function reject(session: QcShiftSession, reason: NonNullable<QcActionResult['reason']>): QcActionResult {
  return { ok: false, reason, session, feedback: null };
}

function buildDebrief(session: QcShiftSession, action: PlayerAction, batchIndex: number): QcDebrief {
  const scenario = session.scenarios[batchIndex]!;
  const truth = scenario.hiddenGroundTruth.simulatedFungalRisk;
  return {
    simulatedFungalRisk: truth,
    explanationKey: scenario.explanationKey,
    missedHighRisk: missedHighRisk(action, truth),
    unnecessaryHold: isUnnecessaryHold(action, truth),
  };
}

/**
 * Apply one player action to the current batch.
 * Immutable: returns a new session. Hidden truth is attached only on terminal debrief.
 */
export function applyQcShiftAction(session: QcShiftSession, action: PlayerAction): QcActionResult {
  if (action !== 'monitor' && action !== 'retest' && action !== 'holdConfirm') {
    return reject(session, 'unknown-action');
  }
  if (session.play.status === 'complete') return reject(session, 'session-complete');

  const index = session.play.batchIndex;
  const batch = session.play.batchStates[index];
  if (!batch) return reject(session, 'session-complete');
  if (batch.resolved) return reject(session, 'batch-resolved');

  const afford = canAffordAction(action, session.settings, session.play.resources, batch.retestUsed);
  if (!afford.ok) return reject(session, afford.reason);

  const next = cloneSession(session);
  const nextBatch = next.play.batchStates[index]!;
  const scenario = next.scenarios[index]!;
  const costs = costsFor(action, next.settings);
  next.play.resources = spend(next.play.resources, costs);

  if (action === 'retest') {
    nextBatch.retestUsed = true;
    nextBatch.currentReading = {
      ...scenario.retestReading,
      qcFlags: [...scenario.retestReading.qcFlags],
    };
    const feedback: QcFeedback = {
      action,
      scenarioId: scenario.id,
      terminal: false,
      readingAfter: nextBatch.currentReading,
      costs,
      debrief: null,
    };
    next.play.log = [
      ...next.play.log,
      {
        batchIndex: index,
        scenarioId: scenario.id,
        action,
        terminal: false,
        costs,
        readingAfter: nextBatch.currentReading,
        debrief: null,
      },
    ];
    return { ok: true, session: next, feedback };
  }

  nextBatch.resolved = true;
  nextBatch.terminalAction = action;
  const debrief = buildDebrief(next, action, index);
  const feedback: QcFeedback = {
    action,
    scenarioId: scenario.id,
    terminal: true,
    readingAfter: nextBatch.currentReading,
    costs,
    debrief,
  };
  next.play.log = [
    ...next.play.log,
    {
      batchIndex: index,
      scenarioId: scenario.id,
      action,
      terminal: true,
      costs,
      readingAfter: nextBatch.currentReading,
      debrief,
    },
  ];

  const nextIndex = index + 1;
  if (nextIndex >= next.scenarios.length) {
    next.play.batchIndex = next.scenarios.length;
    next.play.status = 'complete';
  } else {
    next.play.batchIndex = nextIndex;
  }

  return { ok: true, session: next, feedback };
}

export { isFoodSaved, isTerminalAction };
