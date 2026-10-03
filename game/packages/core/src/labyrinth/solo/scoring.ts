/** Four-column scoring — no science-trivia penalties. */

import type { CaseTruth, VerdictSubmission } from '../types';
import type { SoloCase } from './case';

export type SoloScoreBreakdown = {
  caseSolved: number;
  odorAssignments: number;
  evidenceFound: number;
  time: number;
  total: number;
};

export type SoloScoreInput = {
  solo: SoloCase;
  verdict: VerdictSubmission;
  discoveredIds: ReadonlySet<string>;
  /** Elapsed round time in ms (excluding tutorial). */
  elapsedMs: number;
  /** Soft target for full time score (~7 min). */
  targetMs?: number;
};

const TARGET_MS = 7 * 60_000;

export function scoreSoloRound(input: SoloScoreInput): SoloScoreBreakdown {
  const { solo, verdict, discoveredIds } = input;
  const targetMs = input.targetMs ?? TARGET_MS;
  const truth: CaseTruth = solo.truth;

  const caseSolved = verdict.accusedPhantomPlayerId === truth.phantomPlayerId ? 40 : 0;

  let odorAssignments = 0;
  if (verdict.accusedAssignments) {
    const truthMap = new Map(truth.assignments.map((a) => [a.playerId, a.odorId]));
    const npcIds = new Set(solo.npcIds);
    let correct = 0;
    let total = 0;
    for (const row of verdict.accusedAssignments) {
      if (!npcIds.has(row.playerId) && row.playerId !== solo.humanPlayerId) continue;
      // Score NPC (+ optional self) odor guesses
      if (row.playerId === solo.humanPlayerId) continue;
      total += 1;
      if (truthMap.get(row.playerId) === row.odorId) correct += 1;
    }
    odorAssignments = total === 0 ? 0 : Math.round((correct / solo.npcIds.length) * 30);
  }

  const required = solo.requiredEvidenceIds.length || 1;
  const found = solo.requiredEvidenceIds.filter((id) => discoveredIds.has(id)).length;
  const evidenceFound = Math.round((found / required) * 20);

  const ratio = Math.min(1, Math.max(0, 1 - input.elapsedMs / targetMs));
  const time = Math.round(ratio * 10);

  return {
    caseSolved,
    odorAssignments,
    evidenceFound,
    time,
    total: caseSolved + odorAssignments + evidenceFound + time,
  };
}

export type DebriefRow = {
  playerId: string;
  truthOdorId: string;
  guessedOdorId: string | null;
  isPhantomTruth: boolean;
  isPhantomGuess: boolean;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
};

export function buildDebriefRows(
  solo: SoloCase,
  verdict: VerdictSubmission,
  discoveredIds: ReadonlySet<string>,
): DebriefRow[] {
  const guessMap = new Map(
    (verdict.accusedAssignments ?? []).map((a) => [a.playerId, a.odorId]),
  );
  const rows: DebriefRow[] = [];
  for (const role of solo.playerRoles) {
    if (role.playerId === solo.humanPlayerId) continue;
    const supporting: string[] = [];
    const contradicting: string[] = [];
    for (const ev of solo.evidenceEvents) {
      if (!discoveredIds.has(ev.id)) continue;
      if (ev.type === 'artifactTrace' && ev.playerId === role.playerId) {
        supporting.push(ev.id);
      }
      if (
        ev.type === 'positiveChannel' &&
        ev.playerId === role.playerId &&
        guessMap.get(role.playerId) === role.odorId
      ) {
        supporting.push(ev.id);
      }
      if (
        ev.type === 'negativeChannel' &&
        ev.playerId === role.playerId &&
        guessMap.has(role.playerId)
      ) {
        // If player guessed wrong odor, negatives for truth still support truth
        contradicting.push(ev.id);
      }
    }
    rows.push({
      playerId: role.playerId,
      truthOdorId: role.odorId,
      guessedOdorId: guessMap.get(role.playerId) ?? null,
      isPhantomTruth: role.playerId === solo.truth.phantomPlayerId,
      isPhantomGuess: verdict.accusedPhantomPlayerId === role.playerId,
      supportingEvidenceIds: supporting,
      contradictingEvidenceIds: contradicting,
    });
  }
  return rows;
}
