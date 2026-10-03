import { isFoodSaved, isUnnecessaryHold, missedHighRisk } from './rules';
import type { PlayerAction, QcShiftScorecard, QcShiftSession, SimulatedFungalRisk } from './types';

/** Largest safety penalty — missing simulated high fungal risk. */
export const SAFETY_PENALTY_MISSED_HIGH = 40;
/** Smaller than a missed high-risk lot — never framed as equivalent. */
export const SAFETY_PENALTY_MISSED_ELEVATED = 10;
export const EFFICIENCY_PENALTY_WASTED_RETEST = 12;
export const EFFICIENCY_PENALTY_UNNECESSARY_CONFIRM = 8;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function terminalTruth(
  session: QcShiftSession,
  batchIndex: number,
  action: PlayerAction,
): SimulatedFungalRisk | null {
  if (action !== 'monitor' && action !== 'holdConfirm') return null;
  const scenario = session.scenarios[batchIndex];
  return scenario?.hiddenGroundTruth.simulatedFungalRisk ?? null;
}

function wastedRetest(session: QcShiftSession, batchIndex: number): boolean {
  const scenario = session.scenarios[batchIndex];
  if (!scenario) return false;
  const initial = scenario.initialReading;
  return (
    initial.quality === 'good' &&
    initial.risk === 'low' &&
    scenario.hiddenGroundTruth.simulatedFungalRisk === 'not-elevated'
  );
}

/**
 * Multi-axis scorecard. Do not collapse this into a single “grade” in UI.
 * Safety penalties for missed high-risk lots dwarf unnecessary-hold costs.
 */
export function summarizeQcShift(session: QcShiftSession): QcShiftScorecard {
  let missedHighRiskCount = 0;
  let missedElevatedCount = 0;
  let foodSaved = 0;
  let unnecessaryHoldCount = 0;
  let wastedRetestCount = 0;
  let unnecessaryConfirmCount = 0;
  let batchesResolved = 0;

  const resolved = new Set<number>();
  for (const row of session.play.log) {
    if (!row.terminal || !row.debrief) continue;
    if (resolved.has(row.batchIndex)) continue;
    resolved.add(row.batchIndex);
    batchesResolved += 1;
    const truth = terminalTruth(session, row.batchIndex, row.action);
    if (!truth) continue;
    if (missedHighRisk(row.action, truth)) missedHighRiskCount += 1;
    else if (row.action === 'monitor' && truth === 'elevated') missedElevatedCount += 1;
    if (isFoodSaved(row.action, truth)) foodSaved += 1;
    if (isUnnecessaryHold(row.action, truth)) {
      unnecessaryHoldCount += 1;
      unnecessaryConfirmCount += 1;
    }
  }

  for (const row of session.play.log) {
    if (row.action === 'retest' && wastedRetest(session, row.batchIndex)) wastedRetestCount += 1;
  }

  const safety = clampScore(
    100 - SAFETY_PENALTY_MISSED_HIGH * missedHighRiskCount - SAFETY_PENALTY_MISSED_ELEVATED * missedElevatedCount,
  );

  const efficiency = session.settings.restrictiveBudget
    ? clampScore(
        100 -
          EFFICIENCY_PENALTY_WASTED_RETEST * wastedRetestCount -
          EFFICIENCY_PENALTY_UNNECESSARY_CONFIRM * unnecessaryConfirmCount,
      )
    : 100;

  return {
    safety,
    foodSaved,
    unnecessaryHold: unnecessaryHoldCount,
    efficiency,
    missedHighRiskCount,
    unnecessaryHoldCount,
    batchesResolved,
    batchesTotal: session.scenarios.length,
    complete: session.play.status === 'complete' && batchesResolved === session.scenarios.length,
  };
}

/** Safety drop from one missed high-risk lot vs one unnecessary hold (the latter is 0). */
export function safetyPenaltyForMissedHigh(): number {
  return SAFETY_PENALTY_MISSED_HIGH;
}
