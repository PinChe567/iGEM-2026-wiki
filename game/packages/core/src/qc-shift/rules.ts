import type {
  PlayerAction,
  QcReading,
  QcShiftResources,
  QcShiftSettings,
  RiskLevel,
  SignalQuality,
  SimulatedFungalRisk,
} from './types';

export function isTerminalAction(action: PlayerAction): boolean {
  return action === 'monitor' || action === 'holdConfirm';
}

export function readingIsConsistent(reading: QcReading): boolean {
  if (reading.quality === 'invalid' || reading.risk === 'invalid') {
    return reading.quality === 'invalid' && reading.risk === 'invalid';
  }
  if (reading.confidence !== null) {
    if (!Number.isFinite(reading.confidence)) return false;
    if (reading.confidence < 0 || reading.confidence > 1) return false;
  }
  return reading.risk === 'low' || reading.risk === 'medium' || reading.risk === 'high';
}

export function assertReadingConsistent(reading: QcReading, label: string): void {
  if (!readingIsConsistent(reading)) {
    throw new Error(`Impossible QC reading (${label}): ${reading.risk}/${reading.quality}`);
  }
}

export function actionTimeCost(action: PlayerAction, settings: QcShiftSettings): number {
  if (action === 'retest') return settings.retestTimeCost;
  if (action === 'holdConfirm') return settings.confirmTimeCost;
  return 0;
}

export function canAffordAction(
  action: PlayerAction,
  settings: QcShiftSettings,
  resources: QcShiftResources,
  retestUsed: boolean,
): { ok: true } | { ok: false; reason: 'already-retested' | 'no-retest-remaining' | 'no-confirm-remaining' | 'not-enough-time' } {
  const timeCost = actionTimeCost(action, settings);
  if (resources.timeRemaining !== null && timeCost > 0 && resources.timeRemaining < timeCost) {
    return { ok: false, reason: 'not-enough-time' };
  }
  if (action === 'retest') {
    if (retestUsed) return { ok: false, reason: 'already-retested' };
    if (resources.retestRemaining !== null && resources.retestRemaining < 1) {
      return { ok: false, reason: 'no-retest-remaining' };
    }
  }
  if (action === 'holdConfirm') {
    if (resources.confirmRemaining !== null && resources.confirmRemaining < 1) {
      return { ok: false, reason: 'no-confirm-remaining' };
    }
  }
  return { ok: true };
}

/**
 * Screening-appropriate next step from the *visible* reading.
 * Ground truth is not used — this is what the player is taught to do from the output.
 */
export function recommendedActionFromReading(reading: QcReading): PlayerAction {
  if (reading.quality === 'invalid' || reading.risk === 'invalid') return 'retest';
  if (reading.quality === 'uncertain') return 'retest';
  if (reading.qcFlags.some((flag) => flag === 'drift' || flag === 'unstable-baseline' || flag === 'low-signal')) {
    return 'retest';
  }
  if (reading.risk === 'high') return 'holdConfirm';
  if (reading.risk === 'medium') return 'retest';
  return 'monitor';
}

export function missedHighRisk(
  action: PlayerAction,
  truth: SimulatedFungalRisk,
): boolean {
  return action === 'monitor' && truth === 'high';
}

export function isUnnecessaryHold(
  action: PlayerAction,
  truth: SimulatedFungalRisk,
): boolean {
  return action === 'holdConfirm' && truth === 'not-elevated';
}

export function isFoodSaved(
  action: PlayerAction,
  truth: SimulatedFungalRisk,
): boolean {
  return action === 'monitor' && truth === 'not-elevated';
}

export function stripConfidenceIfNeeded(reading: QcReading, showConfidence: boolean): QcReading {
  return {
    ...reading,
    confidence: showConfidence ? reading.confidence : null,
    qcFlags: [...reading.qcFlags],
  };
}

export const RISK_LEVELS: readonly RiskLevel[] = ['low', 'medium', 'high', 'invalid'];
export const SIGNAL_QUALITIES: readonly SignalQuality[] = ['good', 'uncertain', 'invalid'];
export const PLAYER_ACTIONS: readonly PlayerAction[] = ['monitor', 'retest', 'holdConfirm'];
