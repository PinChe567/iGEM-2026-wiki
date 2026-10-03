import type { QcShiftSession } from '../qc-shift/types';
import { summarizeQcShift } from '../qc-shift/scoring';
import type { QcShiftEducationOutcome } from './types';

/** Count follow-up on invalid / uncertain batches. Never infers missing logs. */
export function qcShiftEducationOutcome(
  session: QcShiftSession,
  alertInformationPreference: string | null = null,
): QcShiftEducationOutcome {
  const monitorCount = session.play.log.filter((row) => row.action === 'monitor').length;
  const retestCount = session.play.log.filter((row) => row.action === 'retest').length;
  const holdConfirmCount = session.play.log.filter((row) => row.action === 'holdConfirm').length;
  const card = summarizeQcShift(session);
  const missedSimulatedRisks = card.missedHighRiskCount;

  let invalidReadingBatches = 0;
  let invalidReadingsFollowedUp = 0;
  session.scenarios.forEach((scenario, index) => {
    const reading = scenario.initialReading;
    const invalid =
      scenario.scenarioType === 'invalid-reading' ||
      reading.quality === 'invalid' ||
      reading.risk === 'invalid';
    if (!invalid) return;
    invalidReadingBatches += 1;
    const followed = session.play.log.some(
      (row) =>
        row.batchIndex === index &&
        (row.action === 'retest' || row.action === 'holdConfirm'),
    );
    if (followed) invalidReadingsFollowedUp += 1;
  });

  return {
    monitorCount,
    retestCount,
    holdConfirmCount,
    missedSimulatedRisks,
    unnecessaryHolds: card.unnecessaryHoldCount,
    invalidReadingBatches,
    invalidReadingsFollowedUp,
    qcInvalidComprehension:
      invalidReadingBatches === 0 ? null : invalidReadingsFollowedUp === invalidReadingBatches,
    alertInformationPreference,
  };
}
