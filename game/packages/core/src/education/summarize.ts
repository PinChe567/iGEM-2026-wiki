import { pairedItemIds } from './items';
import type {
  EducationGameId,
  EducationItemId,
  EducationStudySession,
  GameEducationSummary,
  ItemPairSummary,
  QcShiftEducationOutcome,
} from './types';

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function pairForItem(sessions: readonly EducationStudySession[], itemId: EducationItemId): ItemPairSummary {
  let pairedN = 0;
  let preCorrect = 0;
  let postCorrect = 0;
  let improved = 0;
  let noChange = 0;
  let declined = 0;
  for (const session of sessions) {
    const pre = session.answers.find((row) => row.studyItemId === itemId && row.phase === 'pre');
    const post = session.answers.find((row) => row.studyItemId === itemId && row.phase === 'post');
    if (!pre || !post || pre.correct == null || post.correct == null) continue;
    pairedN += 1;
    if (pre.correct) preCorrect += 1;
    if (post.correct) postCorrect += 1;
    if (!pre.correct && post.correct) improved += 1;
    else if (pre.correct && !post.correct) declined += 1;
    else noChange += 1;
  }
  return { studyItemId: itemId, pairedN, preCorrect, postCorrect, improved, noChange, declined };
}

function averageQc(sessions: readonly EducationStudySession[]): QcShiftEducationOutcome | null {
  const rows = sessions
    .map((session) => (session.outcome?.gameId === 'qc-shift' ? session.outcome.qcShift : null))
    .filter((row): row is QcShiftEducationOutcome => row != null);
  if (rows.length === 0) return null;
  const sum = rows.reduce(
    (acc, row) => ({
      monitorCount: acc.monitorCount + row.monitorCount,
      retestCount: acc.retestCount + row.retestCount,
      holdConfirmCount: acc.holdConfirmCount + row.holdConfirmCount,
      missedSimulatedRisks: acc.missedSimulatedRisks + row.missedSimulatedRisks,
      unnecessaryHolds: acc.unnecessaryHolds + row.unnecessaryHolds,
      invalidReadingBatches: acc.invalidReadingBatches + row.invalidReadingBatches,
      invalidReadingsFollowedUp: acc.invalidReadingsFollowedUp + row.invalidReadingsFollowedUp,
    }),
    {
      monitorCount: 0,
      retestCount: 0,
      holdConfirmCount: 0,
      missedSimulatedRisks: 0,
      unnecessaryHolds: 0,
      invalidReadingBatches: 0,
      invalidReadingsFollowedUp: 0,
    },
  );
  const n = rows.length;
  const comprehensionKnown = rows.filter((row) => row.qcInvalidComprehension != null);
  const comprehensionTrue = comprehensionKnown.filter((row) => row.qcInvalidComprehension).length;
  return {
    monitorCount: sum.monitorCount / n,
    retestCount: sum.retestCount / n,
    holdConfirmCount: sum.holdConfirmCount / n,
    missedSimulatedRisks: sum.missedSimulatedRisks / n,
    unnecessaryHolds: sum.unnecessaryHolds / n,
    invalidReadingBatches: sum.invalidReadingBatches / n,
    invalidReadingsFollowedUp: sum.invalidReadingsFollowedUp / n,
    qcInvalidComprehension: comprehensionKnown.length === 0 ? null : comprehensionTrue === comprehensionKnown.length,
    alertInformationPreference: null,
  };
}

export function summarizeEducationSessions(
  sessions: readonly EducationStudySession[],
): GameEducationSummary[] {
  const games: EducationGameId[] = ['pixel', 'qc-shift', 'spectrum'];
  return games.map((gameId) => {
    const group = sessions.filter((session) => session.gameId === gameId);
    const durations = group
      .map((session) => session.durationMs)
      .filter((value): value is number => value != null);
    const hints = group
      .map((session) => session.hintsUsed)
      .filter((value): value is number => value != null);
    const spectrum = group.filter((session) => session.outcome?.gameId === 'spectrum');
    return {
      gameId,
      sessionCount: group.length,
      completedPlay: group.filter((session) => session.completedPlay).length,
      pairedItems: pairedItemIds(gameId).map((id) => pairForItem(group, id)),
      medianDurationMs: median(durations),
      medianHintsUsed: median(hints),
      qcDecisionPatterns: gameId === 'qc-shift' ? averageQc(group) : null,
      spectrumSolved:
        gameId === 'spectrum'
          ? spectrum.filter((session) => session.outcome?.gameId === 'spectrum' && session.outcome.spectrum.solved)
              .length
          : null,
      spectrumAttempted: gameId === 'spectrum' ? spectrum.length : null,
    };
  });
}

export function formatEducationSummaryMarkdown(summaries: readonly GameEducationSummary[]): string {
  const lines = [
    '# Education study descriptive summary',
    '',
    'Descriptive counts only. Missing fields are omitted, not invented.',
    '',
  ];
  for (const block of summaries) {
    if (block.sessionCount === 0) continue;
    lines.push(`## ${block.gameId}`);
    lines.push(`- sessions: ${block.sessionCount}`);
    lines.push(`- completed play: ${block.completedPlay}`);
    if (block.medianDurationMs != null) lines.push(`- median durationMs: ${block.medianDurationMs}`);
    if (block.medianHintsUsed != null) lines.push(`- median hintsUsed: ${block.medianHintsUsed}`);
    for (const item of block.pairedItems) {
      lines.push(
        `- ${item.studyItemId}: paired n=${item.pairedN}; pre correct=${item.preCorrect}; post correct=${item.postCorrect}; improved=${item.improved}; no-change=${item.noChange}; declined=${item.declined}`,
      );
    }
    if (block.qcDecisionPatterns) {
      const q = block.qcDecisionPatterns;
      lines.push(
        `- QC mean decisions: monitor=${q.monitorCount.toFixed(2)}, retest=${q.retestCount.toFixed(2)}, holdConfirm=${q.holdConfirmCount.toFixed(2)}; missed simulated risks=${q.missedSimulatedRisks.toFixed(2)}; unnecessary holds=${q.unnecessaryHolds.toFixed(2)}`,
      );
    }
    if (block.spectrumAttempted != null) {
      lines.push(`- spectrum solved/attempted: ${block.spectrumSolved ?? 0}/${block.spectrumAttempted}`);
    }
    lines.push('');
  }
  if (lines[lines.length - 1] !== '') lines.push('');
  return lines.join('\n');
}

export function pairedSummaryToCsv(summaries: readonly GameEducationSummary[]): string {
  const header = 'gameId,studyItemId,pairedN,preCorrect,postCorrect,improved,noChange,declined';
  const rows = [header];
  for (const block of summaries) {
    for (const item of block.pairedItems) {
      rows.push(
        [block.gameId, item.studyItemId, item.pairedN, item.preCorrect, item.postCorrect, item.improved, item.noChange, item.declined].join(','),
      );
    }
  }
  return `${rows.join('\n')}\n`;
}
